/**
 * AudioManager — buses, SFX one-shots, music crossfade + ducking.
 *
 * Buses: master → music | sfx | ui
 * SFX:   lazy fetch+decode of OGG/MP3, with optional placeholder voice fallback.
 * Music: scene-based loops with equal-power crossfade, optional duck for modals.
 */

export type Bus = 'music' | 'sfx' | 'ui';

interface PersistedSettings {
  master: number;
  music: number;
  sfx: number;
  muted: boolean;
}

const STORAGE_KEY = 'pokerun.audio.v3';

const DEFAULT_SETTINGS: PersistedSettings = {
  master: 0.6,
  music: 0.85,
  sfx: 0.95,
  muted: false,
};

/**
 * Per-key gain trim applied on top of LUFS-normalized assets.
 * Use this to tame sounds that fire frequently (hits, wobbles, clicks)
 * or boost moments that need extra weight (faints, fanfares).
 * 1.0 = neutral; 0.6 = -4 dB; 1.3 = +2 dB.
 */
const SFX_GAIN_TRIM: Record<string, number> = {
  'ui.click':              0.55,
  'ui.hover':              0.35,
  'ui.confirm':            0.85,
  'ui.cancel':             0.80,
  'ui.error':              0.85,
  'ui.coin':               0.90,

  'battle.hit':            0.65,
  'battle.miss':           0.70,
  'battle.crit':           1.00,
  'battle.faint':          1.05,
  'battle.super_effective':1.00,
  'battle.not_effective':  0.80,
  'battle.immune':         0.75,

  'catch.throw':           0.80,
  'catch.land':            0.80,
  'catch.wobble':          0.55,
  'catch.caught':          1.05,
  'catch.broke':           0.95,

  'shop.coin':             0.80,
  'shop.buy':              1.00,
  'shop.pack_open':        0.95,
  'shop.voucher':          0.85,
  'shop.reroll':           0.75,
  'shop.unaffordable':     0.80,

  'wave.intro':            1.05,
  'wave.boss_warn':        1.05,
};

type VoiceSpec =
  | { kind: 'tone'; freq: number; duration: number; type?: OscillatorType; sweep?: number; gain?: number }
  | { kind: 'noise'; duration: number; cutoff?: number; gain?: number }
  | { kind: 'chord'; freqs: number[]; duration: number; type?: OscillatorType; sweep?: number; gain?: number }
  | { kind: 'sequence'; steps: VoiceSpec[]; stepDelay: number };

const PLACEHOLDER_VOICES: Record<string, VoiceSpec> = {
  'ui.click':   { kind: 'tone', freq: 520, duration: 0.06, type: 'square' },
  'ui.confirm': { kind: 'tone', freq: 660, duration: 0.10, type: 'triangle', sweep: 990 },
  'ui.cancel':  { kind: 'tone', freq: 220, duration: 0.10, type: 'sawtooth', sweep: 110 },
  'ui.error':   { kind: 'tone', freq: 180, duration: 0.18, type: 'square' },
  'ui.coin':    { kind: 'tone', freq: 1320, duration: 0.08, type: 'triangle', sweep: 1760 },
};

class AudioManagerImpl {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicDuckGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private uiGain: GainNode | null = null;

  private settings: PersistedSettings = this.load();
  private suspendedByVisibility = false;
  private lastFireAt = new Map<string, number>();
  private listeners = new Set<() => void>();

  private buffers = new Map<string, AudioBuffer>();
  private bufferUrls = new Map<string, string>();
  private pendingDecodes = new Map<string, Promise<AudioBuffer | null>>();

  private musicUrls = new Map<string, string>();
  private currentMusicKey: string | null = null;
  private currentMusicNode: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
  private musicGenToken = 0;

  private duckLevel = 1; // 1 = full volume, 0 = silent

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctor();
      this.ctx = ctx;

      this.masterGain    = ctx.createGain();
      this.musicGain     = ctx.createGain();
      this.musicDuckGain = ctx.createGain();
      this.sfxGain       = ctx.createGain();
      this.uiGain        = ctx.createGain();

      // music chain: source → musicDuckGain → musicGain → masterGain
      this.musicDuckGain.connect(this.musicGain);
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.uiGain.connect(this.masterGain);
      this.masterGain.connect(ctx.destination);

      this.musicDuckGain.gain.value = 1;
      this.applyGains();
      return ctx;
    } catch {
      return null;
    }
  }

  resume(): void {
    const ctx = this.ensureContext();
    if (ctx?.state === 'suspended') void ctx.resume();
  }

  // ── SFX ────────────────────────────────────────────────────────────────

  registerSfx(key: string, url: string): void {
    this.bufferUrls.set(key, url);
  }

  registerMusic(key: string, url: string): void {
    this.musicUrls.set(key, url);
  }

  /** Warm the HTTP cache for these keys so the first `play()` is instant. */
  prefetch(keys: string[]): void {
    for (const k of keys) {
      const url = this.bufferUrls.get(k) ?? this.musicUrls.get(k);
      if (!url) continue;
      fetch(url).catch(() => { /* silent */ });
    }
  }

  play(key: string, opts?: { bus?: Bus; volume?: number }): void {
    if (this.settings.muted || this.suspendedByVisibility) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();

    const now = performance.now();
    const last = this.lastFireAt.get(key) ?? 0;
    // No throttle for ui.click; tight 12ms guard for everything else.
    const minInterval = key === 'ui.click' ? 0 : 12;
    if (now - last < minInterval) return;
    this.lastFireAt.set(key, now);

    const bus = opts?.bus ?? (key.startsWith('ui.') ? 'ui' : 'sfx');
    const dest = this.busNode(bus);
    if (!dest) return;
    const trim = SFX_GAIN_TRIM[key] ?? 1;
    const vol = (opts?.volume ?? 1) * trim;

    const buf = this.buffers.get(key);
    if (buf) { this.playBuffer(ctx, dest, buf, vol); return; }

    const url = this.bufferUrls.get(key);
    if (url) {
      void this.loadBuffer(ctx, key, url).then(loaded => {
        if (loaded) this.playBuffer(ctx, dest, loaded, vol);
      });
      return;
    }

    const voice = PLACEHOLDER_VOICES[key];
    if (voice) this.synthesizeVoice(ctx, dest, voice, vol, 0);
  }

  // ── Music ──────────────────────────────────────────────────────────────

  /**
   * Crossfade to a new music track. Pass null/undefined `key` to fade out.
   * If `key` is already playing, this is a no-op (unless `force=true`).
   */
  async playMusic(key: string | null, opts?: { fadeMs?: number; loop?: boolean; force?: boolean; volume?: number }): Promise<void> {
    if (!key) { this.stopMusic(opts?.fadeMs ?? 800); return; }
    if (!opts?.force && this.currentMusicKey === key) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.musicDuckGain) return;

    const url = this.musicUrls.get(key);
    if (!url) return;

    const myToken = ++this.musicGenToken;
    const buffer = await this.loadMusicBuffer(ctx, key, url);
    if (myToken !== this.musicGenToken) return; // newer call superseded
    if (!buffer || !this.musicDuckGain) return;

    const fadeMs = opts?.fadeMs ?? 1200;
    const fadeSec = Math.max(0, fadeMs) / 1000;
    const loop = opts?.loop ?? true;
    const targetVol = opts?.volume ?? 1;
    const now = ctx.currentTime;

    // Fade out previous
    const prev = this.currentMusicNode;
    if (prev) {
      const g = prev.gain.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(0.0001, now + fadeSec);
      const stopAt = now + fadeSec + 0.05;
      try { prev.src.stop(stopAt); } catch { /* ignore */ }
    }

    // Fade in new
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = loop;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(targetVol, now + fadeSec);
    src.connect(gain).connect(this.musicDuckGain);
    src.start();

    this.currentMusicNode = { src, gain };
    this.currentMusicKey = key;
  }

  stopMusic(fadeMs = 600): void {
    const ctx = this.ctx;
    if (!ctx) return;
    this.musicGenToken++;
    const node = this.currentMusicNode;
    this.currentMusicKey = null;
    this.currentMusicNode = null;
    if (!node) return;
    const fadeSec = Math.max(0, fadeMs) / 1000;
    const now = ctx.currentTime;
    const g = node.gain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0.0001, now + fadeSec);
    try { node.src.stop(now + fadeSec + 0.05); } catch { /* ignore */ }
  }

  /**
   * Duck music to `level` (0..1) over `fadeMs`. Use for modal opens, cinematic
   * moments. Call duckMusic(1) to restore.
   */
  duckMusic(level: number, fadeMs = 250): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicDuckGain) { this.duckLevel = level; return; }
    const target = Math.max(0, Math.min(1, level));
    this.duckLevel = target;
    const now = ctx.currentTime;
    const g = this.musicDuckGain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(target < 0.001 ? 0.0001 : target, now + Math.max(0, fadeMs) / 1000);
  }

  /** Convenience: duck to 0.45 then restore after `holdMs`. */
  duckPulse(level = 0.45, holdMs = 800, fadeMs = 200): void {
    this.duckMusic(level, fadeMs);
    window.setTimeout(() => this.duckMusic(1, fadeMs), Math.max(0, holdMs));
  }

  getCurrentMusicKey(): string | null { return this.currentMusicKey; }

  // ── Settings ──────────────────────────────────────────────────────────

  getSettings(): PersistedSettings { return { ...this.settings }; }

  setVolume(bus: 'master' | 'music' | 'sfx', value: number): void {
    this.settings[bus] = Math.max(0, Math.min(1, value));
    this.persist();
    this.applyGains();
    this.notify();
  }

  setMuted(muted: boolean): void {
    this.settings.muted = muted;
    this.persist();
    this.applyGains();
    this.notify();
  }

  toggleMute(): boolean {
    this.setMuted(!this.settings.muted);
    return this.settings.muted;
  }

  onChange(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // ── Internals ─────────────────────────────────────────────────────────

  private busNode(bus: Bus): GainNode | null {
    switch (bus) {
      case 'music': return this.musicGain;
      case 'sfx':   return this.sfxGain;
      case 'ui':    return this.uiGain;
    }
  }

  private applyGains(): void {
    if (!this.masterGain || !this.musicGain || !this.sfxGain || !this.uiGain) return;
    const silent = this.settings.muted || this.suspendedByVisibility;
    this.masterGain.gain.value = silent ? 0 : this.settings.master;
    this.musicGain.gain.value  = this.settings.music;
    this.sfxGain.gain.value    = this.settings.sfx;
    this.uiGain.gain.value     = this.settings.sfx;
  }

  /** Transient mute on tab-hide — does NOT touch persisted muted setting. */
  setSuspendedByVisibility(suspended: boolean): void {
    this.suspendedByVisibility = suspended;
    this.applyGains();
  }

  private playBuffer(ctx: AudioContext, dest: AudioNode, buffer: AudioBuffer, vol: number): void {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    src.connect(gain).connect(dest);
    src.start();
  }

  private async loadBuffer(ctx: AudioContext, key: string, url: string): Promise<AudioBuffer | null> {
    const cached = this.buffers.get(key);
    if (cached) return cached;
    const pending = this.pendingDecodes.get(key);
    if (pending) return pending;
    const p = (async () => {
      try {
        const resp = await fetch(url);
        if (!resp.ok) return null;
        const arr = await resp.arrayBuffer();
        const buf = await ctx.decodeAudioData(arr);
        this.buffers.set(key, buf);
        return buf;
      } catch {
        return null;
      } finally {
        this.pendingDecodes.delete(key);
      }
    })();
    this.pendingDecodes.set(key, p);
    return p;
  }

  /** Music uses the same buffer cache, but namespaced by the `music.` prefix. */
  private loadMusicBuffer(ctx: AudioContext, key: string, url: string): Promise<AudioBuffer | null> {
    return this.loadBuffer(ctx, `__music__:${key}`, url);
  }

  private synthesizeVoice(ctx: AudioContext, dest: AudioNode, spec: VoiceSpec, vol: number, offset: number): void {
    const t0 = ctx.currentTime + offset;
    if (spec.kind === 'tone') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = spec.type ?? 'sine';
      osc.frequency.setValueAtTime(spec.freq, t0);
      if (spec.sweep != null) {
        osc.frequency.exponentialRampToValueAtTime(spec.sweep, t0 + spec.duration);
      }
      const peak = (spec.gain ?? 0.25) * vol;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + spec.duration);
      osc.connect(gain).connect(dest);
      osc.start(t0);
      osc.stop(t0 + spec.duration + 0.02);
      return;
    }
    if (spec.kind === 'noise') {
      const buf = this.getNoiseBuffer(ctx);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = spec.cutoff ?? 2000;
      const gain = ctx.createGain();
      const peak = (spec.gain ?? 0.4) * vol;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + spec.duration);
      src.connect(filter).connect(gain).connect(dest);
      src.start(t0);
      src.stop(t0 + spec.duration + 0.02);
      return;
    }
    if (spec.kind === 'chord') {
      const peak = (spec.gain ?? 0.2) * vol;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, t0);
      masterGain.gain.exponentialRampToValueAtTime(peak, t0 + 0.005);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, t0 + spec.duration);
      masterGain.connect(dest);
      for (const f of spec.freqs) {
        const osc = ctx.createOscillator();
        osc.type = spec.type ?? 'triangle';
        osc.frequency.setValueAtTime(f, t0);
        if (spec.sweep != null) {
          osc.frequency.exponentialRampToValueAtTime(spec.sweep * (f / spec.freqs[0]), t0 + spec.duration);
        }
        osc.connect(masterGain);
        osc.start(t0);
        osc.stop(t0 + spec.duration + 0.02);
      }
      return;
    }
    if (spec.kind === 'sequence') {
      let off = offset;
      for (const step of spec.steps) {
        this.synthesizeVoice(ctx, dest, step, vol, off);
        const stepLen = step.kind === 'sequence' ? 0 : step.duration;
        off += stepLen + spec.stepDelay;
      }
    }
  }

  private noiseBuffer: AudioBuffer | null = null;
  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const length = ctx.sampleRate * 0.6;
    const buf = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buf;
    return buf;
  }

  private load(): PersistedSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  private persist(): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings)); } catch { /* ignore */ }
  }

  private notify(): void {
    this.listeners.forEach(fn => { try { fn(); } catch { /* noop */ } });
  }
}

export const Audio = new AudioManagerImpl();

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    Audio.setSuspendedByVisibility(document.hidden);
  });
}
