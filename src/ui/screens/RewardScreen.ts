import type { GameState, Reward, Pokemon, Item } from '../../types';
import { renderTypeBadges } from '../components/TypeBadge';
import { getRarityClass, getRarityLabel } from '../../systems/rewards';
import { fadeIn, staggerRevealCards } from '../animations';
import { toBattlePokemon } from '../../systems/battle';

const ITEM_BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const POKEAPI_ITEMS = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/';
function itemArt(item: Item): string {
  if (item.pokeapiName) {
    return `<img src="${POKEAPI_ITEMS}${item.pokeapiName}.png" alt="${item.name}" class="item-sprite" draggable="false">`;
  }
  if (item.sprite) {
    return `<img src="${ITEM_BASE}${item.sprite}" alt="${item.name}" class="item-sprite" draggable="false">`;
  }
  return `<div class="glyph">${item.icon}</div>`;
}

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
    const isBoss = this.state.battleState?.isBossWave ?? false;
    const arena = this.state.arenaState;
    const skipAmount = isBoss ? 200 : 60;
    const skipLabel = isBoss
      ? `Skip for a <strong>${skipAmount}¢</strong> boss bounty · Stash it for the Shop.`
      : `Skip to continue with +${skipAmount}¢ in your pocket.`;
    let badgeText: string;
    if (arena) {
      const total = arena.steps.length;
      const cur = Math.min(arena.index, total);
      badgeText = `Arena · Round ${cur}/${total} · Cleared`;
    } else if (isBoss) {
      badgeText = 'Boss Wave · Cleared';
    } else {
      badgeText = `Wave ${this.state.wave} · Cleared`;
    }
    return `
      <div class="reward-screen screen">
        <div class="reward-header">
          <div class="reward-wave-badge ${isBoss ? 'boss' : ''}${arena ? ' arena' : ''}">
            ${badgeText}
          </div>
          <h2 class="reward-title">Pick a <em>prize</em></h2>
          <p class="reward-subtitle">Three cards dealt · Choose one · Skip for +${skipAmount}¢</p>
        </div>

        <div class="reward-cards" id="reward-cards">
          ${this.state.pendingRewards.map((r, i) => this.renderRewardCard(r, i)).join('')}
        </div>

        <div class="reward-footer">
          <div class="reward-coins">
            <span style="font-family:var(--font-mono);font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:var(--ink-3)">
              ► ${skipLabel}
            </span>
          </div>
          <div style="display:flex;gap:10px">
            <button class="ink-btn ${isBoss ? 'primary' : 'ghost'}" id="skip-reward-btn" data-skip-amount="${skipAmount}">
              Skip (+${skipAmount}¢)${isBoss ? ' ★' : ''}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderRewardCard(reward: Reward, index: number): string {
    const rarityClass = getRarityClass(reward.rarity);
    const rarityLabel = getRarityLabel(reward.rarity);
    const tilts = [-5, 0, 5];
    const tilt = tilts[index] ?? 0;

    let tag = '';
    let artHtml = '';
    let nameHtml = '';
    let typesHtml = '';
    let descHtml = '';

    if (reward.type === 'pokemon') {
      const p = reward.pokemon as Pokemon;
      tag = 'NEW CREATURE';
      artHtml = `<img src="${p.sprite}" alt="${p.displayName}" />`;
      nameHtml = p.displayName;
      typesHtml = renderTypeBadges(p.types);
      descHtml = `Lv.${p.level} · BST ${p.bst} · ${p.isFullyEvolved ? '★ Fully Evolved' : '◇ Can Evolve'}`;
    } else if (reward.type === 'perk') {
      tag = 'TEAM PERK';
      artHtml = `<div class="glyph">${reward.perk.icon ?? '◈'}</div>`;
      nameHtml = reward.perk.name;
      descHtml = reward.perk.description;
    } else if (reward.type === 'item') {
      tag = reward.item.itemType === 'held' ? 'HELD ITEM' : 'CONSUMABLE';
      artHtml = itemArt(reward.item);
      nameHtml = reward.item.name;
      descHtml = reward.item.description;
    }

    return `
      <div
        class="reward-card ${rarityClass} hidden-card"
        data-reward-index="${index}"
        role="button"
        tabindex="0"
        style="opacity:0;--tilt:${tilt}deg"
      >
        <div class="r-tag">
          <span>${tag}</span>
          <span>№ ${String(100 + index).padStart(3,'0')}</span>
        </div>
        <div class="reward-card-rarity ${rarityClass}">${rarityLabel}</div>
        <div class="r-art">${artHtml}</div>
        <div class="r-name">${nameHtml}</div>
        ${typesHtml ? `<div class="r-types">${typesHtml}</div>` : ''}
        <div class="r-desc">${descHtml}</div>
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
      const target = e.target as HTMLElement;

      // Skip button — boss waves give a larger bounty
      const skipBtn = target.closest('#skip-reward-btn') as HTMLElement | null;
      if (skipBtn) {
        const amount = parseInt(skipBtn.dataset['skipAmount'] ?? '60') || 60;
        this.state.coins += amount;
        this.state.pendingRewards = [];
        setTimeout(() => this.onRewardChosen(this.state), 200);
        return;
      }

      const card = target.closest('[data-reward-index]') as HTMLElement;
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
      // Route to catch mini-game
      this.state.pendingCatch = reward.pokemon;
      this.state.pendingRewards = [];
      setTimeout(() => this.onRewardChosen(this.state), 600);
      return;
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
