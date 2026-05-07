/**
 * Audio settings UI — inline trigger button + centered modal panel.
 *
 * Each screen that wants the trigger renders a host `<span>` and calls
 * `mountAudioButton(host)`. The button matches its `.ink-btn ghost` siblings
 * (Bag/PC/Leave). Clicking the button opens a centered modal with a darkened
 * backdrop, styled like the wave EP / evolution post-screens.
 *
 * The `M` hotkey is installed once at boot via `installAudioKeyboardShortcuts`.
 */

import { Audio } from './AudioManager';
import { loadSettings, saveSettings } from '../systems/userSettings';

let hotkeyInstalled = false;

export function installAudioKeyboardShortcuts(): void {
  if (hotkeyInstalled) return;
  hotkeyInstalled = true;
  document.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'm' && !isTypingTarget(e.target)) {
      Audio.resume();
      Audio.toggleMute();
    }
  });
}

let openModalEl: HTMLDivElement | null = null;
let openUnsubscribe: (() => void) | null = null;
let openKeyHandler: ((e: KeyboardEvent) => void) | null = null;

/**
 * Mount an inline audio settings trigger button into `host`.
 * Returns a destroy function that removes the trigger and closes the modal.
 */
export function mountAudioButton(host: HTMLElement): () => void {
  host.classList.add('audio-btn-host');

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'ink-btn ghost audio-btn';
  toggle.title = 'Audio (press M to mute)';
  toggle.setAttribute('aria-label', 'Audio settings');
  toggle.innerHTML = renderToggleIcon(Audio.getSettings().muted);

  host.appendChild(toggle);

  toggle.addEventListener('click', () => {
    Audio.resume();
    if (openModalEl) closeAudioModal();
    else openAudioModal();
  });

  const unsubscribe = Audio.onChange(() => {
    toggle.innerHTML = renderToggleIcon(Audio.getSettings().muted);
  });

  return () => {
    unsubscribe();
    toggle.remove();
  };
}

function openAudioModal(): void {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay audio-modal-overlay';
  overlay.innerHTML = `
    <div class="modal audio-modal" role="dialog" aria-label="Audio settings">
      <button class="modal-close" data-close aria-label="Close">✕</button>
      <div class="audio-modal-eyebrow">◇ Sound &amp; Music ◇</div>
      <h2 class="modal-title">Audio<br><em>Settings</em></h2>
      <div class="audio-modal-body">
        ${renderRows()}
      </div>
      <div class="audio-modal-foot">
        <button class="aus-mute" data-mute>${Audio.getSettings().muted ? 'Unmute' : 'Mute'}</button>
        <button class="aus-test" data-test-sfx>Test SFX ▶</button>
        <span class="aus-hint">Press <kbd>M</kbd> to mute</span>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  openModalEl = overlay;

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeAudioModal();
  });

  overlay.addEventListener('input', e => {
    const t = e.target as HTMLInputElement;
    if (t.dataset['volume']) {
      const v = parseInt(t.value, 10) / 100;
      Audio.setVolume(t.dataset['volume'] as 'master' | 'music' | 'sfx', v);
    }
  });

  overlay.addEventListener('click', e => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-close]')) { closeAudioModal(); return; }
    if (t.closest('[data-mute]')) { Audio.resume(); Audio.toggleMute(); return; }
    if (t.closest('[data-test-sfx]')) { Audio.resume(); Audio.play('ui.confirm'); return; }
  });

  openKeyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeAudioModal();
  };
  document.addEventListener('keydown', openKeyHandler);

  // Granular updates so an in-progress drag is never interrupted.
  openUnsubscribe = Audio.onChange(() => {
    if (!openModalEl) return;
    const s = Audio.getSettings();
    (['master', 'music', 'sfx'] as const).forEach(key => {
      const slider = openModalEl!.querySelector<HTMLInputElement>(`input[data-volume="${key}"]`);
      const valEl = openModalEl!.querySelector<HTMLElement>(`[data-volume-value="${key}"]`);
      const v = Math.round(s[key] * 100);
      if (slider && document.activeElement !== slider) slider.value = String(v);
      if (valEl) valEl.textContent = String(v);
    });
    const muteBtn = openModalEl.querySelector<HTMLButtonElement>('[data-mute]');
    if (muteBtn) {
      muteBtn.classList.toggle('is-muted', s.muted);
      muteBtn.textContent = s.muted ? 'Unmute' : 'Mute';
    }
  });
}

function closeAudioModal(): void {
  if (!openModalEl) return;
  openUnsubscribe?.();
  openUnsubscribe = null;
  if (openKeyHandler) {
    document.removeEventListener('keydown', openKeyHandler);
    openKeyHandler = null;
  }
  openModalEl.remove();
  openModalEl = null;
}

/**
 * Mount the audio sliders + mute/test buttons inline inside an existing host
 * (e.g. the general Settings modal). No toggle, no extra modal.
 * Returns a destroy function.
 */
export function mountAudioControls(host: HTMLElement): () => void {
  host.innerHTML = `
    <div class="audio-modal-body">${renderRows()}</div>
    <div class="audio-modal-foot">
      <button class="aus-mute" type="button" data-mute>${Audio.getSettings().muted ? 'Unmute' : 'Mute'}</button>
      <button class="aus-test" type="button" data-test-sfx>Test SFX ▶</button>
      <span class="aus-hint">Press <kbd>M</kbd> to mute</span>
    </div>
  `;

  host.addEventListener('input', e => {
    const t = e.target as HTMLInputElement;
    if (t.dataset['volume']) {
      const v = parseInt(t.value, 10) / 100;
      Audio.setVolume(t.dataset['volume'] as 'master' | 'music' | 'sfx', v);
    }
  });

  host.addEventListener('click', e => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-mute]')) { Audio.resume(); Audio.toggleMute(); return; }
    if (t.closest('[data-test-sfx]')) { Audio.resume(); Audio.play('ui.confirm'); return; }
  });

  const unsubscribe = Audio.onChange(() => {
    const s = Audio.getSettings();
    (['master', 'music', 'sfx'] as const).forEach(key => {
      const slider = host.querySelector<HTMLInputElement>(`input[data-volume="${key}"]`);
      const valEl = host.querySelector<HTMLElement>(`[data-volume-value="${key}"]`);
      const v = Math.round(s[key] * 100);
      if (slider && document.activeElement !== slider) slider.value = String(v);
      if (valEl) valEl.textContent = String(v);
    });
    const muteBtn = host.querySelector<HTMLButtonElement>('[data-mute]');
    if (muteBtn) {
      muteBtn.classList.toggle('is-muted', s.muted);
      muteBtn.textContent = s.muted ? 'Unmute' : 'Mute';
    }
  });

  return () => {
    unsubscribe();
    host.innerHTML = '';
  };
}

/**
 * Mount a SETTINGS trigger (gear icon) that opens the full Settings modal —
 * Reduce Motion, Animation Speed, and Audio sliders. Used by in-run screens
 * (shop) so the player can reach the same settings exposed on the start menu.
 */
export function mountSettingsButton(host: HTMLElement): () => void {
  host.classList.add('audio-btn-host');

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'ink-btn ghost audio-btn settings-btn';
  toggle.title = 'Settings (M to mute)';
  toggle.setAttribute('aria-label', 'Settings');
  toggle.innerHTML = renderToggleIcon(Audio.getSettings().muted);

  host.appendChild(toggle);

  toggle.addEventListener('click', () => {
    Audio.resume();
    if (openModalEl) closeAudioModal();
    else openSettingsModal();
  });

  const unsubscribe = Audio.onChange(() => {
    toggle.innerHTML = renderToggleIcon(Audio.getSettings().muted);
  });

  return () => {
    unsubscribe();
    toggle.remove();
  };
}

function openSettingsModal(): void {
  const s = loadSettings();
  const speedOption = (val: number, label: string) =>
    `<button class="settings-pill${s.animationSpeed === val ? ' active' : ''}" data-speed="${val}" type="button">${label}</button>`;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay audio-modal-overlay';
  overlay.innerHTML = `
    <div class="modal htp-modal settings-modal-shop" role="dialog" aria-label="Settings">
      <button class="modal-close" data-close aria-label="Close">✕</button>
      <div class="htp-eyebrow">Display · Motion · Audio</div>
      <h2 class="modal-title">◈ <em>Settings</em></h2>

      <div class="settings-row">
        <div class="settings-row-label">
          <div class="srl-title">Reduce Motion</div>
          <div class="srl-sub">Mute non-essential animations and shakes.</div>
        </div>
        <label class="settings-toggle">
          <input type="checkbox" data-reduce-motion ${s.reduceMotion ? 'checked' : ''} />
          <span class="settings-toggle-track"><span class="settings-toggle-knob"></span></span>
        </label>
      </div>

      <div class="settings-row">
        <div class="settings-row-label">
          <div class="srl-title">Animation Speed</div>
          <div class="srl-sub">Speed up battle and intro flair.</div>
        </div>
        <div class="settings-pills" data-speed-pills>
          ${speedOption(0.5, '0.5×')}
          ${speedOption(1, '1×')}
          ${speedOption(1.5, '1.5×')}
          ${speedOption(2, '2×')}
        </div>
      </div>

      <div class="settings-row" style="border-top:1.5px dashed var(--ink, #1a1a1a); padding-top:14px; flex-direction:column; align-items:stretch; gap:10px;">
        <div class="settings-row-label">
          <div class="srl-title">Sound &amp; Music</div>
          <div class="srl-sub">Master · Music · SFX</div>
        </div>
        <div class="audio-modal-body">${renderRows()}</div>
        <div class="audio-modal-foot">
          <button class="aus-mute" type="button" data-mute>${Audio.getSettings().muted ? 'Unmute' : 'Mute'}</button>
          <button class="aus-test" type="button" data-test-sfx>Test SFX ▶</button>
          <span class="aus-hint">Press <kbd>M</kbd> to mute</span>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  openModalEl = overlay;

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeAudioModal();
  });

  overlay.addEventListener('input', e => {
    const t = e.target as HTMLInputElement;
    if (t.dataset['volume']) {
      const v = parseInt(t.value, 10) / 100;
      Audio.setVolume(t.dataset['volume'] as 'master' | 'music' | 'sfx', v);
    }
    if (t.hasAttribute('data-reduce-motion')) {
      saveSettings({ ...loadSettings(), reduceMotion: t.checked });
    }
  });

  overlay.addEventListener('click', e => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-close]')) { closeAudioModal(); return; }
    if (t.closest('[data-mute]')) { Audio.resume(); Audio.toggleMute(); return; }
    if (t.closest('[data-test-sfx]')) { Audio.resume(); Audio.play('ui.confirm'); return; }
    const pill = t.closest<HTMLButtonElement>('[data-speed]');
    if (pill) {
      const val = parseFloat(pill.dataset['speed'] || '1');
      saveSettings({ ...loadSettings(), animationSpeed: val });
      overlay.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach(p => {
        p.classList.toggle('active', parseFloat(p.dataset['speed'] || '1') === val);
      });
    }
  });

  openKeyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeAudioModal();
  };
  document.addEventListener('keydown', openKeyHandler);

  openUnsubscribe = Audio.onChange(() => {
    if (!openModalEl) return;
    const s = Audio.getSettings();
    (['master', 'music', 'sfx'] as const).forEach(key => {
      const slider = openModalEl!.querySelector<HTMLInputElement>(`input[data-volume="${key}"]`);
      const valEl = openModalEl!.querySelector<HTMLElement>(`[data-volume-value="${key}"]`);
      const v = Math.round(s[key] * 100);
      if (slider && document.activeElement !== slider) slider.value = String(v);
      if (valEl) valEl.textContent = String(v);
    });
    const muteBtn = openModalEl.querySelector<HTMLButtonElement>('[data-mute]');
    if (muteBtn) {
      muteBtn.classList.toggle('is-muted', s.muted);
      muteBtn.textContent = s.muted ? 'Unmute' : 'Mute';
    }
  });
}

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  const tag = t.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || t.isContentEditable;
}

function renderToggleIcon(muted: boolean): string {
  const dot = muted ? 'var(--oxblood)' : 'var(--ink)';
  return `
    <svg class="aus-cog ${muted ? 'is-muted' : ''}" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="miter">
        <path d="M12 3 L13 5 L15 4 L16 6 L18 6 L18 8 L20 9 L19 11 L21 12 L19 13 L20 15 L18 16 L18 18 L16 18 L15 20 L13 19 L12 21 L11 19 L9 20 L8 18 L6 18 L6 16 L4 15 L5 13 L3 12 L5 11 L4 9 L6 8 L6 6 L8 6 L9 4 L11 5 Z"/>
        <circle cx="12" cy="12" r="3.2" fill="${dot}" stroke="none"/>
      </g>
      ${muted ? '<line x1="4" y1="4" x2="20" y2="20" stroke="var(--oxblood)" stroke-width="2.4" stroke-linecap="square"/>' : ''}
    </svg>
  `;
}

function renderRows(): string {
  const s = Audio.getSettings();
  const row = (label: string, sub: string, key: 'master' | 'music' | 'sfx', value: number) => `
    <label class="aus-row">
      <span class="aus-label">
        <span class="aus-label-name">${label}</span>
        <span class="aus-label-sub">${sub}</span>
      </span>
      <input type="range" min="0" max="100" step="1" value="${Math.round(value * 100)}" data-volume="${key}" />
      <span class="aus-value" data-volume-value="${key}">${Math.round(value * 100)}</span>
    </label>
  `;
  return `
    ${row('Master', 'Overall mix',  'master', s.master)}
    ${row('Music',  'Soundtrack',   'music',  s.music)}
    ${row('SFX',    'Effects · UI', 'sfx',    s.sfx)}
  `;
}
