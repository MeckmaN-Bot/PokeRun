/**
 * Phase 1 wiring — fire placeholder UI tones on common interactions.
 *
 * Single delegated listener so we don't have to touch every screen.
 * Replace / refine in Phase 2 once the SFX registry holds real samples.
 */

import { Audio } from './AudioManager';

const BUTTON_SELECTOR = 'button, .ink-btn, [role="button"], [data-sfx]';

export function bindGlobalAudioCues(root: HTMLElement = document.body): void {
  // Fire UI click on pointerdown for snappier feedback (no mouseup wait).
  // Skip explicit `data-sfx="none"` opt-outs.
  root.addEventListener('pointerdown', e => {
    Audio.resume();
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const btn = target.closest(BUTTON_SELECTOR) as HTMLElement | null;
    if (!btn) return;
    const explicit = btn.dataset['sfx'];
    if (explicit === 'none') return;
    Audio.play(explicit || 'ui.click');
  }, { capture: true });

  // Auto-duck music whenever a modal overlay is visible.
  // Watches `.modal-overlay:not(.hidden)` count and ducks while > 0.
  const update = () => {
    // Audio modal is excluded — user is mixing levels, ducking would lie.
    const open = document.querySelectorAll('.modal-overlay:not(.hidden):not(.audio-modal-overlay)').length;
    Audio.duckMusic(open > 0 ? 0.55 : 1, 220);
  };
  const obs = new MutationObserver(update);
  obs.observe(document.body, {
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
    childList: true,
  });
}
