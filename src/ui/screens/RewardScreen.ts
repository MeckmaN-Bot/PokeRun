import type { GameState, Reward, Pokemon } from '../../types';
import { renderTypeBadges } from '../components/TypeBadge';
import { getRarityClass, getRarityLabel } from '../../systems/rewards';
import { fadeIn, staggerRevealCards } from '../animations';
import { toBattlePokemon } from '../../systems/battle';

export class RewardScreen {
  private container: HTMLElement;
  private state: GameState;
  private onRewardChosen: (state: GameState) => void;

  constructor(
    container: HTMLElement,
    state: GameState,
    onRewardChosen: (state: GameState) => void
  ) {
    this.container = container;
    this.state = state;
    this.onRewardChosen = onRewardChosen;
  }

  mount(): void {
    this.container.innerHTML = this.renderHTML();
    this.container.style.display = '';
    fadeIn(this.container);
    this.revealCards();
    this.attachEvents();
  }

  private renderHTML(): string {
    const isBoss = this.state.wave % 5 === 0;
    return `
      <div class="reward-screen screen">
        <div class="reward-header">
          <div class="reward-wave-badge ${isBoss ? 'boss' : ''}">
            ${isBoss ? '⚡ BOSS CLEARED' : `Wave ${this.state.wave} Cleared`}
          </div>
          <h2 class="reward-title">CHOOSE YOUR REWARD</h2>
          <p class="reward-subtitle">Pick 1 of 3 — choose wisely!</p>
        </div>

        <div class="reward-cards" id="reward-cards">
          ${this.state.pendingRewards.map((r, i) => this.renderRewardCard(r, i)).join('')}
        </div>

        <div class="reward-footer">
          <div class="reward-coins">🪙 ${this.state.coins} coins</div>
          <div class="reward-wave-info">Next: Wave ${this.state.wave + 1}${(this.state.wave + 1) % 5 === 0 ? ' (BOSS)' : ''}</div>
        </div>
      </div>
    `;
  }

  private renderRewardCard(reward: Reward, index: number): string {
    const rarityClass = getRarityClass(reward.rarity);
    const rarityLabel = getRarityLabel(reward.rarity);

    let content = '';

    if (reward.type === 'pokemon') {
      const p = reward.pokemon as Pokemon;
      content = `
        <div class="reward-card-icon">
          <img src="${p.sprite}" alt="${p.displayName}" class="reward-pokemon-sprite" />
        </div>
        <div class="reward-card-type-label">NEW POKÉMON</div>
        <div class="reward-card-name">${p.displayName}</div>
        <div class="reward-card-types">${renderTypeBadges(p.types)}</div>
        <div class="reward-card-stats">
          <span>Lv.${p.level}</span>
          <span>BST ${p.bst}</span>
          <span>${p.isFullyEvolved ? '★ Fully Evolved' : '◇ Can Evolve'}</span>
        </div>
        <div class="reward-card-moves">
          ${p.moves.slice(0, 4).map(m => `<span class="reward-move-tag">${m.displayName}</span>`).join('')}
        </div>
      `;
    } else if (reward.type === 'perk') {
      content = `
        <div class="reward-card-icon reward-perk-icon">⚡</div>
        <div class="reward-card-type-label">TEAM PERK</div>
        <div class="reward-card-name">${reward.perk.name}</div>
        <div class="reward-card-desc">${reward.perk.description}</div>
      `;
    } else if (reward.type === 'item') {
      content = `
        <div class="reward-card-icon">${reward.item.icon}</div>
        <div class="reward-card-type-label">${reward.item.itemType === 'held' ? 'HELD ITEM' : 'CONSUMABLE'}</div>
        <div class="reward-card-name">${reward.item.name}</div>
        <div class="reward-card-desc">${reward.item.description}</div>
      `;
    }

    return `
      <div
        class="reward-card ${rarityClass} hidden-card"
        data-reward-index="${index}"
        role="button"
        tabindex="0"
        style="opacity:0"
      >
        <div class="reward-card-rarity ${rarityClass}">${rarityLabel}</div>
        ${content}
        <div class="reward-card-select-btn">SELECT</div>
      </div>
    `;
  }

  private async revealCards(): Promise<void> {
    const cards = Array.from(
      this.container.querySelectorAll<HTMLElement>('.reward-card')
    );
    await staggerRevealCards(cards);
    cards.forEach(c => c.classList.remove('hidden-card'));
  }

  private attachEvents(): void {
    this.container.addEventListener('click', (e) => {
      const card = (e.target as HTMLElement).closest('[data-reward-index]') as HTMLElement;
      if (card) {
        const idx = parseInt(card.dataset['rewardIndex'] ?? '0');
        this.selectReward(idx);
      }
    });

    this.container.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter') {
        const card = (e.target as HTMLElement).closest('[data-reward-index]') as HTMLElement;
        if (card) {
          const idx = parseInt(card.dataset['rewardIndex'] ?? '0');
          this.selectReward(idx);
        }
      }
    });
  }

  private selectReward(index: number): void {
    const reward = this.state.pendingRewards[index];
    if (!reward) return;

    // Highlight selected card
    this.container.querySelectorAll('.reward-card').forEach((c, i) => {
      c.classList.toggle('reward-selected', i === index);
      if (i !== index) c.classList.add('reward-dimmed');
    });

    // Apply reward
    if (reward.type === 'pokemon') {
      if (this.state.team.length < 6) {
        this.state.team.push(toBattlePokemon(reward.pokemon, this.state.activePerks));
      }
    } else if (reward.type === 'perk') {
      if (!this.state.activePerks.find(p => p.id === reward.perk.id)) {
        this.state.activePerks.push(reward.perk);
        this.state.runStats.perksCollected++;

        // God Mode perk
        if (reward.perk.id === 'god_mode') {
          this.state.godModeAvailable = true;
        }
      }
    } else if (reward.type === 'item') {
      this.state.runStats.itemsCollected++;
      const existing = this.state.inventory.find(i => i.item.id === reward.item.id);
      if (existing) {
        existing.quantity++;
      } else {
        this.state.inventory.push({ item: reward.item, quantity: 1 });
      }
    }

    this.state.pendingRewards = [];

    // Short delay then proceed
    setTimeout(() => {
      this.onRewardChosen(this.state);
    }, 600);
  }

  unmount(): void {
    this.container.style.display = 'none';
    this.container.innerHTML = '';
  }
}
