import type { GameState } from '../../types';
import { fadeIn } from '../animations';
import { Audio } from '../../audio/AudioManager';

/**
 * Pokémon Center node — peaceful step. Three sub-options the player picks
 * from. Phase B keeps it small: each option triggers a deterministic effect
 * on the team, then advances back to the path-select screen without a wave.
 */
type CenterChoice = 'full_heal' | 'partial_plus_status' | 'risky_supply';

const CHOICES: Array<{
  id: CenterChoice;
  title: string;
  hint: string;
  icon: string;
  accent: string;
}> = [
  {
    id: 'full_heal',
    title: 'Full Recovery',
    hint: 'Restore HP to full for every Pokémon on the team.',
    icon: '✚',
    accent: '#c43a3a',
  },
  {
    id: 'partial_plus_status',
    title: 'Quick Patch',
    hint: '+50% HP and clear all status effects across the team.',
    icon: '◇',
    accent: '#3a7a8a',
  },
  {
    id: 'risky_supply',
    title: 'Secret Supply',
    hint: 'Skip healing — receive 80 coins instead. Press your luck.',
    icon: '◆',
    accent: '#c08a2c',
  },
];

export class PokemonCenterScreen {
  private container: HTMLElement;
  private state: GameState;
  private onDone: (state: GameState) => void;

  constructor(
    container: HTMLElement,
    state: GameState,
    onDone: (state: GameState) => void,
  ) {
    this.container = container;
    this.state = state;
    this.onDone = onDone;
  }

  mount(): void {
    this.container.innerHTML = this.renderHTML();
    this.container.style.display = '';
    fadeIn(this.container);
    this.attachEvents();
  }

  unmount(): void {
    this.container.style.display = 'none';
    this.container.innerHTML = '';
  }

  private renderHTML(): string {
    const card = (c: typeof CHOICES[number], i: number) => {
      const rot = i === 0 ? '-1.2' : i === 1 ? '0.5' : '-0.7';
      return `
        <button class="path-card center-card" data-choice="${c.id}" type="button"
                style="--card-rot:${rot}deg;--card-accent:${c.accent}">
          <span class="path-card-corner tl"></span>
          <span class="path-card-corner tr"></span>
          <span class="path-card-corner bl"></span>
          <span class="path-card-corner br"></span>
          <div class="path-card-eyebrow">Choice 0${i + 1}</div>
          <div class="path-card-icon px-emoji">${c.icon}</div>
          <h3 class="path-card-title">${c.title}</h3>
          <p class="path-card-hint">${c.hint}</p>
          <div class="path-card-foot">
            <span class="path-card-tag">Center</span>
            <span class="path-card-cta">Choose →</span>
          </div>
        </button>
      `;
    };

    return `
      <div class="path-screen screen">
        <div class="path-content rail-1440">
          <div class="path-header">
            <div class="path-eyebrow">— Pokémon Center · Wave ${String(this.state.wave).padStart(2, '0')} —</div>
            <h1 class="path-title">Welcome, <em>trainer</em></h1>
            <div class="path-sub">"We can take care of your Pokémon for you. Which would you like?"</div>
          </div>

          <div class="path-cards center-grid">
            ${CHOICES.map((c, i) => card(c, i)).join('')}
          </div>

          <div class="path-footnote">
            <span class="kbd-hint">Healing nodes do not consume a wave — choose freely.</span>
          </div>
        </div>
      </div>
    `;
  }

  private attachEvents(): void {
    this.container.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach(btn => {
      btn.addEventListener('click', () => {
        const choice = btn.dataset['choice'] as CenterChoice;
        Audio.play('ui.confirm');
        btn.classList.add('chosen');
        this.container.querySelectorAll<HTMLElement>('.path-card').forEach(other => {
          if (other !== btn) other.classList.add('dimmed');
        });
        window.setTimeout(() => this.applyChoice(choice), 320);
      });
    });
  }

  private applyChoice(choice: CenterChoice): void {
    const state = this.state;
    if (choice === 'full_heal') {
      state.team.forEach(mon => {
        mon.battleHp = mon.maxBattleHp;
        mon.battleStatus = null;
      });
    } else if (choice === 'partial_plus_status') {
      state.team.forEach(mon => {
        const heal = Math.floor(mon.maxBattleHp * 0.5);
        mon.battleHp = Math.min(mon.maxBattleHp, mon.battleHp + heal);
        mon.battleStatus = null;
      });
    } else if (choice === 'risky_supply') {
      state.coins += 80;
    }
    this.onDone(state);
  }
}
