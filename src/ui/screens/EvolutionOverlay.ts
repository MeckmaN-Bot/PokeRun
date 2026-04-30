import type { BattlePokemon, Pokemon } from '../../types';
import type { LearnEvent } from '../../api/pokeapi';
import { gsap } from 'gsap';
import { Audio } from '../../audio/AudioManager';

/**
 * Full-screen evolution overlay — paper/hard-shadow aesthetic, no glow effects.
 * Plays a phased animation:
 *   1. mount + reveal old sprite
 *   2. silhouette pulse (scale shake)
 *   3. flash slab wipe + sprite swap
 *   4. reveal new name + learned moves
 *   5. dismiss on click or after timeout
 *
 * Returns a Promise that resolves when the overlay is dismissed.
 */
export function showEvolutionOverlay(
  oldMon: BattlePokemon,
  newSpecies: Pokemon,
  learned: LearnEvent[],
): Promise<void> {
  return new Promise<void>(resolve => {
    Audio.duckMusic(0.3, 250);
    void Audio.playMusic('music.evolution', { fadeMs: 200, loop: false, volume: 0.95 });
    const overlay = document.createElement('div');
    overlay.className = 'evo-overlay';
    overlay.innerHTML = `
      <div class="evo-bar top"></div>
      <div class="evo-bar bot"></div>
      <div class="evo-skip">Click to skip</div>
      <div class="evo-kicker top">◇ Evolution ◇</div>
      <div class="evo-stage" id="evo-stage">
        <div class="evo-sprite-wrap">
          <img class="evo-sprite swap-out" id="evo-old-sprite" src="${oldMon.animatedSprite || oldMon.sprite}" alt="${oldMon.displayName}" />
          <img class="evo-sprite swap-in"  id="evo-new-sprite" src="${newSpecies.animatedSprite || newSpecies.sprite}" alt="${newSpecies.displayName}" style="opacity:0;" />
        </div>
        <div class="evo-flash" id="evo-flash"></div>
      </div>
      <div class="evo-kicker bottom">${oldMon.displayName} → ${newSpecies.displayName}</div>
      <div class="evo-result" id="evo-result">
        <div class="from-to">
          ${oldMon.displayName}<span class="arrow">►</span>evolved
        </div>
        <div class="new-name">${newSpecies.displayName}</div>
      </div>
      <div class="evo-moves" id="evo-moves">
        ${learned.map(ev => `
          <div class="evo-move-row">
            ${ev.replacedMove
              ? `Forgot <strong>${ev.replacedMove.displayName}</strong> · Learned <strong>${ev.newMove.displayName}</strong>`
              : `Learned <strong>${ev.newMove.displayName}</strong>`}
          </div>
        `).join('')}
      </div>
    `;
    document.body.appendChild(overlay);

    const oldImg   = overlay.querySelector<HTMLImageElement>('#evo-old-sprite')!;
    const newImg   = overlay.querySelector<HTMLImageElement>('#evo-new-sprite')!;
    const flash    = overlay.querySelector<HTMLElement>('#evo-flash')!;
    const result   = overlay.querySelector<HTMLElement>('#evo-result')!;
    const moves    = overlay.querySelector<HTMLElement>('#evo-moves')!;

    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      tl.kill();
      Audio.duckMusic(1, 400);
      void Audio.playMusic('music.shop', { fadeMs: 800 });
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.18,
        ease: 'power2.in',
        onComplete: () => {
          overlay.remove();
          resolve();
        },
      });
    };

    overlay.addEventListener('click', dismiss);

    // Activate
    requestAnimationFrame(() => overlay.classList.add('active'));

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    // Phase 1: enter
    tl.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.22 });
    tl.fromTo(
      oldImg,
      { scale: 0.4, x: -60, opacity: 0 },
      { scale: 1, x: 0, opacity: 1, duration: 0.32 },
      '<'
    );

    // Phase 2: silhouette + shake (no glow — hard scale pulse)
    tl.to({}, { duration: 0.4 }); // beat
    tl.add(() => oldImg.classList.add('silhouette'));
    tl.fromTo(
      oldImg,
      { scale: 1, rotation: 0 },
      {
        scale: 1.08,
        rotation: -2,
        duration: 0.12,
        repeat: 5,
        yoyo: true,
        ease: 'steps(2)',
      }
    );

    // Phase 3: hard flash slab wipe
    tl.to(flash, { scaleY: 1, duration: 0.18, ease: 'power3.in' });
    tl.add(() => {
      oldImg.style.opacity = '0';
      newImg.style.opacity = '1';
    });
    tl.to(flash, { scaleY: 0, duration: 0.22, ease: 'power3.out', transformOrigin: 'top' });

    // Phase 4: hard pop on the new sprite
    tl.fromTo(
      newImg,
      { scale: 0.6 },
      { scale: 1, duration: 0.36, ease: 'back.out(2.4)' },
      '-=0.12'
    );

    // Phase 5: result card + moves
    tl.fromTo(
      result,
      { y: 28, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.28 },
      '+=0.05'
    );
    if (learned.length > 0) {
      tl.fromTo(
        moves,
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.24 },
        '-=0.12'
      );
    }

    // Auto-dismiss after a generous beat
    tl.to({}, { duration: 1.6 });
    tl.add(dismiss);
  });
}
