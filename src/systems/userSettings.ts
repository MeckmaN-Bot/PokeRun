/**
 * User-facing display settings — persisted in localStorage and applied as
 * CSS variables / `<html>` data attributes so styles can branch on them.
 *
 * Two knobs at present:
 *   - reduceMotion: respect the user's preference; minimises non-essential
 *     animations even when the OS-level `prefers-reduced-motion` is off.
 *   - animationSpeed: 0.5 / 1 / 1.5 / 2 — multiplies battle/anim timings.
 */

export interface UserSettings {
  reduceMotion: boolean;
  animationSpeed: number; // 0.5 | 1 | 1.5 | 2
}

const KEY = 'pokerun:settings:v1';

const DEFAULTS: UserSettings = {
  reduceMotion: false,
  animationSpeed: 1,
};

let cache: UserSettings | null = null;

export function loadSettings(): UserSettings {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<UserSettings>;
      cache = {
        reduceMotion: typeof parsed.reduceMotion === 'boolean' ? parsed.reduceMotion : DEFAULTS.reduceMotion,
        animationSpeed: [0.5, 1, 1.5, 2].includes(parsed.animationSpeed as number)
          ? (parsed.animationSpeed as number)
          : DEFAULTS.animationSpeed,
      };
    } else {
      cache = { ...DEFAULTS };
    }
  } catch {
    cache = { ...DEFAULTS };
  }
  return cache;
}

export function saveSettings(next: UserSettings): void {
  cache = { ...next };
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* ignore quota */ }
  applySettings(cache);
}

/** Push current settings into CSS / DOM so styles + GSAP can react. */
export function applySettings(s: UserSettings = loadSettings()): void {
  document.documentElement.dataset['reduceMotion'] = s.reduceMotion ? 'on' : 'off';
  // Inverse: bigger animSpeed → shorter durations. Style code uses --anim-scale.
  const scale = 1 / s.animationSpeed;
  document.documentElement.style.setProperty('--anim-scale', String(scale));
}
