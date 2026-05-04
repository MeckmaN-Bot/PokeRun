import type { GameState, Pokemon } from '../../types';
import { MAX_TEAM_SIZE } from '../../types';
import { renderTypeBadges } from '../components/TypeBadge';
import { toBattlePokemon } from '../../systems/battle';
import { fadeIn } from '../animations';
import { getTrainerSprite } from '../../data/trainers';
import { Audio } from '../../audio/AudioManager';

const MAX_BALLS = 3;

type Phase =
  | 'intro'
  | 'idle'
  | 'throwing'
  | 'absorb'
  | 'falling'
  | 'wobbling'
  | 'caught'
  | 'breakout'
  | 'fled'
  | 'done';

function catchChance(pokemon: Pokemon): number {
  return Math.max(0.30, 0.85 - (pokemon.bst - 200) / 1100);
}

/**
 * Scale the wild sprite container so the Pokémon reads at lore-accurate height
 * relative to the trainer (rendered at ~200px tall ≈ 17 dm canonically).
 * Tiny mons (Joltik 1 dm) stay legible; giants (Wailord 145 dm) get capped.
 */
function wildSpriteScale(heightDm: number | undefined): number {
  const TRAINER_DM = 17;
  const dm = heightDm && heightDm > 0 ? heightDm : 5; // sensible fallback
  const raw = dm / TRAINER_DM;
  // Compress extremes: log-ish curve keeps tiny mons visible and giants on-stage.
  const compressed = Math.pow(raw, 0.7);
  return Math.max(0.32, Math.min(1.25, compressed));
}

export class CatchScreen {
  private container: HTMLElement;
  private state: GameState;
  private pokemon: Pokemon;
  private onDone: (state: GameState) => void;

  private ballsLeft = MAX_BALLS;
  private phase: Phase = 'intro';
  private shakeCount = 0;
  private timers: number[] = [];

  constructor(
    container: HTMLElement,
    state: GameState,
    pokemon: Pokemon,
    onDone: (state: GameState) => void,
  ) {
    this.container = container;
    this.state = state;
    this.pokemon = pokemon;
    this.onDone = onDone;
  }

  mount(): void {
    this.container.innerHTML = this.renderHTML();
    this.container.style.display = '';
    fadeIn(this.container);
    this.attachEvents();
    // Intro → idle. Sync the disabled button state right after mount so the
    // first click registers as soon as intro finishes (the button starts
    // disabled to make this state visible to the player).
    this.refresh();
    this.timers.push(window.setTimeout(() => {
      this.phase = 'idle';
      this.refresh();
      // If a queued click arrived during intro, fire it now
      if (this.queuedThrow) {
        this.queuedThrow = false;
        this.onThrow();
      }
    }, 800));
  }

  private queuedThrow = false;

  private clearTimers(): void {
    this.timers.forEach(t => window.clearTimeout(t));
    this.timers = [];
  }

  private renderHTML(): string {
    const p = this.pokemon;
    const chance = Math.round(catchChance(p) * 100);
    const difficulty = 100 - chance;
    const trainerSprite = getTrainerSprite(this.state.trainerGender ?? 'male');

    return `
      <div class="catch-screen screen" id="catch-screen-inner">

        <!-- Headline -->
        <div class="catch-headline">
          <div class="catch-kicker">— Encounter —</div>
          <h1 class="catch-title">A wild <em>${p.displayName.toUpperCase()}</em> appeared!</h1>
        </div>

        <!-- Main: arena + side -->
        <div class="catch-main">

          <!-- Arena -->
          <div class="catch-arena ${this.phase === 'intro' ? 'intro' : ''}" id="catch-arena">
            <div class="ca-sky">
              <div class="ca-halftone"></div>
              <div class="ca-sun"></div>
              <div class="ca-clouds">
                <span class="ca-cloud ca-cloud-1"></span>
                <span class="ca-cloud ca-cloud-2"></span>
                <span class="ca-cloud ca-cloud-3"></span>
              </div>
              <div class="ca-mountains">
                <span class="ca-mtn ca-mtn-1"></span>
                <span class="ca-mtn ca-mtn-2"></span>
                <span class="ca-mtn ca-mtn-3"></span>
              </div>
            </div>
            <div class="ca-ground">
              <div class="ca-grass"></div>
              <div class="ca-path"></div>
              <span class="ca-tuft" style="left:8%;bottom:6%;--s:1.2;--r:-6deg"></span>
              <span class="ca-tuft" style="left:24%;bottom:12%;--s:0.8;--r:4deg"></span>
              <span class="ca-tuft" style="left:38%;bottom:5%;--s:1;--r:-2deg"></span>
              <span class="ca-tuft" style="left:55%;bottom:14%;--s:0.7;--r:8deg"></span>
              <span class="ca-tuft" style="left:72%;bottom:6%;--s:1.1;--r:-4deg"></span>
              <span class="ca-tuft" style="left:88%;bottom:11%;--s:0.9;--r:3deg"></span>
            </div>
            <div class="ca-vignette"></div>
            <div class="ca-frame"></div>

            <div class="ca-platform ca-platform-trainer"></div>
            <div class="ca-platform ca-platform-wild"></div>

            <div class="ca-trainer" id="ca-trainer">
              <img src="${trainerSprite}" alt="Trainer" class="ca-trainer-sprite" draggable="false" />
              <div class="ca-trainer-label">YOU</div>
            </div>

            <div class="ca-wild" id="ca-wild" style="--mon-scale:${wildSpriteScale(p.heightDm).toFixed(3)}">
              <div class="ca-wild-shadow"></div>
              <img src="${p.animatedSprite || p.sprite}" alt="${p.displayName}" class="ca-wild-sprite" draggable="false" onerror="this.onerror=null;this.src='${p.sprite}';" />
              <div class="ca-entry-burst" id="ca-entry-burst">
                ${'✦✧★✦✧★'.split('').map((s, i) => `<span style="--d:${i * 0.06}s;--a:${(i - 2.5) * 35}deg">${s}</span>`).join('')}
              </div>
            </div>

            <div class="ca-ball" id="ca-ball" hidden>
              <img class="ca-ball-img" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" alt="Pokéball" draggable="false" />
            </div>

            <div class="ca-beam" id="ca-beam" hidden></div>

            <div class="ca-flash" id="ca-flash"></div>
            <div class="ca-result-layer" id="ca-result-layer"></div>

            <!-- Mobile-only: tap arena to throw, small flee chip top-right -->
            <div class="ca-tap-hint" id="ca-tap-hint" aria-hidden="true">▸ Tap to throw</div>
            <button class="ca-mobile-flee" id="ca-mobile-flee" type="button" aria-label="Run away">Run</button>
          </div>

          <!-- Side -->
          <div class="catch-side">

            <div class="catch-data-card">
              <div class="cdc-head">
                <div class="cdc-kicker">Field Notes · #${String(p.id).padStart(3, '0')}</div>
                <div class="cdc-name">${p.displayName}</div>
                <div class="cdc-types">${renderTypeBadges(p.types)}</div>
              </div>
              <div class="cdc-stats">
                <div class="cdc-row"><span>Level</span><b>${p.level}</b></div>
                <div class="cdc-row"><span>Base Stat Total</span><b>${p.bst}</b></div>
                <div class="cdc-row"><span>Catch Rate</span><b class="cdc-rate">~${chance}%</b></div>
              </div>
              <div class="cdc-gauge">
                <div class="cdc-gauge-label">Capture difficulty</div>
                <div class="cdc-gauge-bar">
                  <div class="cdc-gauge-fill" style="width:${difficulty}%"></div>
                  ${[20, 40, 60, 80].map(t => `<span class="cdc-gauge-tick" style="left:${t}%"></span>`).join('')}
                </div>
                <div class="cdc-gauge-meta"><span>Easy</span><span>Tough</span></div>
              </div>
            </div>

            <div class="catch-ball-tray">
              <div class="cbt-label">Balls remaining</div>
              <div class="cbt-balls" id="cbt-balls">
                ${Array.from({ length: MAX_BALLS }).map((_, i) => `
                  <div class="cbt-ball ${i >= this.ballsLeft ? 'used' : ''}">
                    <img class="cbt-ball-img" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" alt="Pokéball" draggable="false" />
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="catch-actions">
              <button class="ink-btn primary" id="catch-throw-btn">▶ Throw Pokéball</button>
              <button class="ink-btn ghost" id="catch-run-btn">Run Away</button>
            </div>

          </div>
        </div>
      </div>
    `;
  }

  private attachEvents(): void {
    const throwFn = () => this.onThrow();
    this.container.querySelector('#catch-throw-btn')?.addEventListener('click', throwFn);
    this.container.querySelector('#catch-run-btn')?.addEventListener('click', () => this.onFled());

    // Mobile-friendly: tap anywhere on the arena (including the wild Pokémon)
    // to throw a ball. Decorative children have pointer-events: none, so clicks
    // bubble up to the arena. The flee chip stops propagation.
    const arena = this.container.querySelector<HTMLElement>('#catch-arena');
    arena?.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('#ca-mobile-flee') || t.closest('.catch-pc-overlay')) return;
      throwFn();
    });
    this.container.querySelector('#ca-mobile-flee')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onFled();
    });

    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        throwFn();
      }
    };
    document.addEventListener('keydown', keyHandler);
    (this.container as any)._keyHandler = keyHandler;
  }

  private refresh(): void {
    this.refreshArena();
    this.refreshActions();
    this.refreshBalls();
  }

  private refreshArena(): void {
    const arena = this.container.querySelector<HTMLElement>('#catch-arena');
    const wild = this.container.querySelector<HTMLElement>('#ca-wild');
    const ball = this.container.querySelector<HTMLElement>('#ca-ball');
    const beam = this.container.querySelector<HTMLElement>('#ca-beam');
    const trainer = this.container.querySelector<HTMLElement>('#ca-trainer');
    const resultLayer = this.container.querySelector<HTMLElement>('#ca-result-layer');
    if (!arena || !wild || !ball || !beam || !trainer || !resultLayer) return;

    arena.classList.toggle('intro', this.phase === 'intro');
    arena.classList.toggle('idle', this.phase === 'idle' && this.ballsLeft > 0);

    // Wild visibility
    const spriteHidden = ['absorb', 'falling', 'wobbling', 'caught'].includes(this.phase);
    wild.classList.toggle('hidden', spriteHidden);
    wild.classList.toggle('rebound', this.phase === 'breakout');

    // Trainer throwing pose (windup is built into the throw keyframes)
    trainer.classList.toggle('throwing', this.phase === 'throwing');

    // Ball state (rebuild class list)
    const ballThrown = this.phase === 'throwing';
    const ballVisible = ballThrown || ['absorb', 'falling', 'wobbling', 'caught', 'breakout'].includes(this.phase);
    ball.hidden = !ballVisible;
    ball.className = 'ca-ball';
    if (ballThrown) ball.classList.add('throwing');
    if (this.phase === 'absorb') ball.classList.add('absorb');
    if (this.phase === 'falling') ball.classList.add('falling');
    if (this.phase === 'wobbling') {
      ball.classList.add('settled');
      // single-cycle wobble: force reflow + add class for one shake
      if (this.shakeCount > 0) {
        // restart animation: remove → reflow → add
        ball.classList.remove('wobble');
        void ball.offsetWidth;
        ball.classList.add('wobble');
      }
    }
    if (this.phase === 'caught') ball.classList.add('caught', 'settled');
    if (this.phase === 'breakout') ball.classList.add('breakout');

    // Beam
    beam.hidden = this.phase !== 'absorb';

    // Caught flash
    const flash = this.container.querySelector<HTMLElement>('#ca-flash');
    if (flash) {
      flash.classList.remove('flash');
      if (this.phase === 'caught') {
        void flash.offsetWidth;
        flash.classList.add('flash');
      }
    }

    // Result layer
    if (this.phase === 'caught') {
      resultLayer.innerHTML = `
        <div class="ca-caught-banner">
          <div class="ca-spark-ring">
            ${'★✦✧✩★✦'.split('').map((s, i) => `<span style="--i:${i};animation-delay:${i * 0.07}s">${s}</span>`).join('')}
          </div>
          <div class="ca-stamp">GOTCHA!</div>
          <div class="ca-stamp-sub">${this.pokemon.displayName} was caught!</div>
        </div>
      `;
    } else if (this.phase === 'breakout') {
      resultLayer.innerHTML = `<div class="ca-breakout-msg">BROKE FREE</div>`;
    } else if (this.phase === 'fled') {
      resultLayer.innerHTML = `
        <div class="ca-fled-overlay">
          <div class="ca-stamp fled">IT GOT AWAY</div>
        </div>
      `;
    } else {
      resultLayer.innerHTML = '';
    }
  }

  private refreshActions(): void {
    const throwBtn = this.container.querySelector<HTMLButtonElement>('#catch-throw-btn');
    const runBtn = this.container.querySelector<HTMLButtonElement>('#catch-run-btn');
    if (!throwBtn || !runBtn) return;
    const idle = this.phase === 'idle';
    throwBtn.disabled = !idle || this.ballsLeft <= 0;
    runBtn.disabled = !idle;
    if (this.phase === 'idle') throwBtn.textContent = '▶ Throw Pokéball';
    else if (this.phase === 'intro') throwBtn.textContent = '…';
    else if (this.phase === 'caught') throwBtn.textContent = '✓ Caught';
    else if (this.phase === 'fled') throwBtn.textContent = 'Got away';
    else throwBtn.textContent = 'Throwing…';
  }

  private refreshBalls(): void {
    this.container.querySelectorAll<HTMLElement>('#cbt-balls .cbt-ball').forEach((b, i) => {
      b.classList.toggle('used', i >= this.ballsLeft);
    });
  }

  private onThrow(): void {
    // Queue the throw if the player clicked during intro — it fires once idle
    if (this.phase === 'intro') {
      this.queuedThrow = true;
      return;
    }
    if (this.phase !== 'idle' || this.ballsLeft <= 0) return;
    this.ballsLeft--;
    this.phase = 'throwing';
    this.refresh();
    Audio.play('catch.throw');

    const caught = Math.random() < catchChance(this.pokemon);
    const shakes = caught ? 3 : (Math.random() < 0.6 ? 2 : 1);

    this.timers.push(window.setTimeout(() => { this.phase = 'absorb'; this.refresh(); Audio.play('catch.absorb'); }, 700));
    this.timers.push(window.setTimeout(() => { this.phase = 'falling'; this.refresh(); }, 1100));
    this.timers.push(window.setTimeout(() => {
      this.phase = 'wobbling';
      this.shakeCount = 0;
      this.refresh();
      Audio.play('catch.land');
    }, 1450));

    for (let i = 1; i <= shakes; i++) {
      this.timers.push(window.setTimeout(() => {
        this.shakeCount = i;
        this.refresh();
        Audio.play('catch.wobble');
      }, 1450 + i * 650));
    }

    const resolveAt = 1450 + shakes * 650 + 400;
    this.timers.push(window.setTimeout(() => {
      if (caught) {
        this.phase = 'caught';
        this.refresh();
        Audio.play('catch.caught');
        this.timers.push(window.setTimeout(() => this.onCaught(), 2400));
      } else {
        this.phase = 'breakout';
        this.refresh();
        Audio.play('catch.broke');
        this.timers.push(window.setTimeout(() => {
          if (this.ballsLeft <= 0) {
            this.phase = 'fled';
            this.refresh();
            Audio.play('catch.fled');
            this.timers.push(window.setTimeout(() => this.onFled(), 1500));
          } else {
            this.phase = 'idle';
            this.refresh();
          }
        }, 1000));
      }
    }, resolveAt));
  }

  private onCaught(): void {
    this.phase = 'done';
    const mon = toBattlePokemon(this.pokemon, this.state.activePerks);
    if (this.state.vouchers?.includes('grabber') && mon.itemSlots?.[1]) {
      mon.itemSlots[1].unlocked = true;
    }
    if (this.state.vouchers?.includes('held_slot_charter') && mon.itemSlots) {
      const nextLocked = mon.itemSlots.findIndex(s => !s.unlocked);
      if (nextLocked >= 0) mon.itemSlots[nextLocked].unlocked = true;
    }
    if (this.state.team.length < MAX_TEAM_SIZE) {
      this.state.team.push(mon);
      this.state.pendingCatch = null;
      this.finish();
    } else {
      this.showPCChoice(mon);
    }
  }

  private showPCChoice(mon: ReturnType<typeof toBattlePokemon>): void {
    const inner = this.container.querySelector<HTMLElement>('#catch-screen-inner');
    if (!inner) return;
    const overlay = document.createElement('div');
    overlay.className = 'catch-pc-overlay';
    overlay.innerHTML = `
      <div class="catch-pc-title">Team is full!</div>
      <div class="catch-pc-sub">What do you want to do with ${mon.displayName}?</div>
      <div class="catch-pc-actions">
        <button class="ink-btn ghost" id="send-to-pc-btn">Send to PC</button>
        ${this.state.team.map((tm, i) => `
          <button class="ink-btn" data-swap-index="${i}" style="font-size:12px">
            Swap out ${tm.displayName}
          </button>
        `).join('')}
      </div>
    `;
    inner.style.position = 'relative';
    inner.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null;
      if (!btn) return;
      if (btn.id === 'send-to-pc-btn') {
        this.state.pc.push(mon);
      } else if (btn.dataset['swapIndex'] !== undefined) {
        const idx = parseInt(btn.dataset['swapIndex']);
        const swapped = this.state.team.splice(idx, 1, mon);
        this.state.pc.push(swapped[0]);
      }
      this.state.pendingCatch = null;
      this.finish();
    });
  }

  private onFled(): void {
    this.phase = 'done';
    this.state.pendingCatch = null;
    this.finish();
  }

  private finish(): void {
    this.clearTimers();
    const kh = (this.container as any)._keyHandler;
    if (kh) document.removeEventListener('keydown', kh);
    setTimeout(() => this.onDone(this.state), 300);
  }

  unmount(): void {
    this.clearTimers();
    const kh = (this.container as any)._keyHandler;
    if (kh) document.removeEventListener('keydown', kh);
    this.phase = 'done';
    this.container.style.display = 'none';
    this.container.innerHTML = '';
  }
}
