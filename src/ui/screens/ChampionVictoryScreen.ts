import type { GameState } from '../../types';
import { Audio } from '../../audio/AudioManager';
import { pokemonSprite, imgErrorFallback } from '../../data/sprites';
import { getNextGoal } from '../../systems/nextGoal';

/**
 * Celebration overlay shown after the Champion-KO and before the
 * existing generation-gate prompt. Fires once per Champion clear.
 *
 * UI: layered modal-overlay (matches gen-gate / mlp-overlay patterns),
 * dismisses on Continue button or click-outside. On dismiss, calls onClose
 * which the caller uses to advance the state machine to the gen-gate.
 */
export function showChampionVictoryScreen(state: GameState, clears: number, onClose: () => void): void {
  const overlay = document.createElement('div');
  overlay.className = 'champion-victory-overlay';
  const waves = state.runStats.wavesCleared;
  const badges = state.badges?.length ?? 0;

  overlay.innerHTML = `
    <div class="champion-victory-card">
      <div class="path-eyebrow">— Hall of Fame · Run complete —</div>
      <h2 class="champion-victory-title">Champion of <em>Indigo</em>!</h2>
      <div class="champion-victory-trophy" aria-hidden="true">
        <img src="${pokemonSprite(150)}" alt="" class="champion-trophy-img"
             onerror="${imgErrorFallback('★')}" />
      </div>
      <div class="champion-victory-summary">
        Cleared <b>${waves}</b> wave${waves === 1 ? '' : 's'} ·
        <b>${badges}</b> badge${badges === 1 ? '' : 's'} ·
        Defeated the Pokémon League
      </div>
      <div class="champion-victory-clears">Champion clears: <b>${clears}</b></div>
      ${(() => {
        const goal = getNextGoal(state.playerName, state.generation);
        return goal
          ? `<div class="champion-victory-next-goal"><span class="cv-next-eyebrow">Next:</span> ${goal.title}</div>`
          : '';
      })()}
      <button class="ink-btn primary champion-victory-cta" type="button">Continue →</button>
    </div>
  `;
  document.body.appendChild(overlay);
  Audio.play('ui.coin');

  const close = () => {
    if (!overlay.isConnected) return;
    overlay.classList.add('closing');
    setTimeout(() => overlay.remove(), 220);
    onClose();
  };
  overlay.querySelector<HTMLButtonElement>('.champion-victory-cta')
    ?.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
}
