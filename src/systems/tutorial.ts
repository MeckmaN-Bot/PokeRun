/**
 * Lightweight contextual-tutorial controller.
 *
 * Tracks which tutorial steps the player has seen via localStorage, so we
 * can show a step exactly once per device. Steps are gated by a string id
 * (e.g. `intro`, `first_wave`, `first_reward`, `first_arena`).
 */

const KEY = 'pokerun:tutorialSeen:v1';

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch { return new Set(); }
}

function persist(set: Set<string>): void {
  try { localStorage.setItem(KEY, JSON.stringify(Array.from(set))); }
  catch { /* quota or private mode — non-fatal, just won't persist. */ }
}

export function wasSeen(id: string): boolean {
  return loadSeen().has(id);
}

export function markSeen(id: string): void {
  const s = loadSeen();
  if (s.has(id)) return;
  s.add(id);
  persist(s);
}

/** Wipe all tutorial flags. Useful for a "Show tutorial again" settings entry. */
export function resetTutorial(): void {
  try { localStorage.removeItem(KEY); } catch {}
}

/**
 * Show a small dismissible coachmark overlay anchored to the bottom-center.
 * Used for first-wave / first-reward / first-arena hints. Auto-marks `id` seen
 * on dismiss.
 */
export function showCoachmark(id: string, opts: {
  eyebrow: string;
  title: string;
  body: string;
  cta?: string;
}): void {
  if (wasSeen(id)) return;
  const overlay = document.createElement('div');
  overlay.className = 'coachmark-overlay';
  overlay.innerHTML = `
    <div class="coachmark-card" role="dialog" aria-label="${opts.title}">
      <div class="coachmark-eyebrow">${opts.eyebrow}</div>
      <h3 class="coachmark-title">${opts.title}</h3>
      <p class="coachmark-body">${opts.body}</p>
      <button type="button" class="ink-btn primary coachmark-cta">${opts.cta ?? 'Got it →'}</button>
    </div>
  `;
  document.body.appendChild(overlay);
  const close = () => {
    markSeen(id);
    overlay.classList.add('closing');
    window.setTimeout(() => overlay.remove(), 200);
  };
  overlay.querySelector<HTMLButtonElement>('.coachmark-cta')?.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
}
