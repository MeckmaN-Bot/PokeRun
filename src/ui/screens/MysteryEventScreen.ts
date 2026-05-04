import type { GameState, InventoryItem } from '../../types';
import { ALL_ITEMS } from '../../data/items';
import { fadeIn, showToast } from '../animations';
import { Audio } from '../../audio/AudioManager';
import { itemSprite, imgErrorFallback } from '../../data/sprites';

/**
 * Mystery node — single curtain, click to flip → reveals a randomised
 * minor outcome (coins, item, or a small team buff). Phase B keeps the
 * outcome list short; Phase F can expand into multi-step narrative events.
 */
type Outcome =
  | { kind: 'coins'; amount: number }
  | { kind: 'item'; item: InventoryItem }
  | { kind: 'heal'; pct: number };

function rollOutcome(): Outcome {
  const r = Math.random();
  if (r < 0.50) {
    const amount = 50 + Math.floor(Math.random() * 70); // 50–120
    return { kind: 'coins', amount };
  }
  if (r < 0.65) {
    // Items rare here — only commons. Keeps mystery from outshining the shop.
    const consumables = ALL_ITEMS.filter(i => i.itemType === 'consumable' && i.rarity === 'common');
    const pick = consumables[Math.floor(Math.random() * consumables.length)];
    return { kind: 'item', item: { item: pick, quantity: 1 } };
  }
  if (r < 0.88) {
    return { kind: 'heal', pct: 0.35 };
  }
  // Pity payout — was previously the 'nothing' branch. No path-click is wasted.
  return { kind: 'coins', amount: 5 };
}

export class MysteryEventScreen {
  private container: HTMLElement;
  private state: GameState;
  private onDone: (state: GameState) => void;
  private revealed = false;
  private outcome: Outcome | null = null;

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
    const node = this.state.currentNode;
    const title = node?.title ?? 'Mystery';
    const eyebrow = node?.eyebrow ?? 'Mystery';
    const flavour = node?.hint ?? 'Something interesting catches your eye.';

    return `
      <div class="path-screen screen">
        <div class="path-content rail-1440">
          <div class="path-header">
            <div class="path-eyebrow">— ${eyebrow} ·  Wave ${String(this.state.wave).padStart(2, '0')} —</div>
            <h1 class="path-title">${title}</h1>
            <div class="path-sub">${flavour}</div>
          </div>

          <div class="mystery-stage">
            <button class="mystery-card" id="mystery-card" type="button">
              <span class="path-card-corner tl"></span>
              <span class="path-card-corner tr"></span>
              <span class="path-card-corner bl"></span>
              <span class="path-card-corner br"></span>
              <div class="mystery-front">
                ${node?.spriteUrl
                  ? `<div class="mystery-sprite-wrap"><img src="${node.spriteUrl}" alt="" class="mystery-sprite" onerror="${imgErrorFallback(node.icon ?? '❓')}" /></div>`
                  : `<div class="path-card-icon px-emoji">${node?.icon ?? '❓'}</div>`}
                <div class="mystery-cta">Tap to investigate</div>
              </div>
              <div class="mystery-back hidden" id="mystery-back"></div>
            </button>
          </div>

          <div class="path-footnote">
            <span class="kbd-hint">One outcome — fortune favours the curious.</span>
          </div>
        </div>
      </div>
    `;
  }

  private attachEvents(): void {
    const card = this.container.querySelector<HTMLButtonElement>('#mystery-card');
    if (!card) return;

    card.addEventListener('click', () => {
      if (!this.revealed) {
        this.revealOutcome(card);
      } else {
        this.commitAndExit();
      }
    });
  }

  private revealOutcome(card: HTMLButtonElement): void {
    this.outcome = rollOutcome();
    this.revealed = true;
    Audio.play('ui.confirm');

    const back = this.container.querySelector<HTMLElement>('#mystery-back');
    const front = card.querySelector<HTMLElement>('.mystery-front');
    if (!back || !front) return;

    back.innerHTML = this.renderOutcomeHtml(this.outcome);
    front.classList.add('hidden');
    back.classList.remove('hidden');
    card.classList.add('revealed');
  }

  private renderOutcomeHtml(o: Outcome): string {
    const sprite = (slug: string, fallbackEmoji: string) =>
      `<div class="mystery-sprite-wrap"><img src="${itemSprite(slug)}" alt="" class="mystery-sprite" onerror="${imgErrorFallback(fallbackEmoji)}" /></div>`;
    switch (o.kind) {
      case 'coins':
        if (o.amount === 5) {
          return `
            ${sprite('oran-berry', '🍒')}
            <h3 class="path-card-title">A stray berry</h3>
            <p class="path-card-hint">You found a stray berry and pocket change. +5¢</p>
            <div class="mystery-cta">Tap to continue →</div>
          `;
        }
        return `
          ${sprite('nugget', '💰')}
          <h3 class="path-card-title">+${o.amount} coins</h3>
          <p class="path-card-hint">Lucky find — straight into the satchel.</p>
          <div class="mystery-cta">Tap to continue →</div>
        `;
      case 'item': {
        const slug = o.item.item.pokeapiName;
        const inner = slug
          ? sprite(slug, o.item.item.icon ?? '🎁')
          : `<div class="path-card-icon px-emoji">${o.item.item.icon ?? '🎁'}</div>`;
        return `
          ${inner}
          <h3 class="path-card-title">${o.item.item.name}</h3>
          <p class="path-card-hint">${o.item.item.description}</p>
          <div class="mystery-cta">Tap to continue →</div>
        `;
      }
      case 'heal':
        return `
          ${sprite('super-potion', '🌿')}
          <h3 class="path-card-title">Restorative herbs</h3>
          <p class="path-card-hint">+${Math.round(o.pct * 100)}% HP across the team.</p>
          <div class="mystery-cta">Tap to continue →</div>
        `;
    }
  }

  private commitAndExit(): void {
    if (!this.outcome) return;
    const o = this.outcome;
    if (o.kind === 'coins') {
      this.state.coins += o.amount;
      showToast(`+${o.amount} coins!`, 'success');
    } else if (o.kind === 'item') {
      const existing = this.state.inventory.find(it => it.item.id === o.item.item.id);
      if (existing) existing.quantity += 1;
      else this.state.inventory.push({ ...o.item });
      showToast(`Picked up ${o.item.item.name}!`, 'success');
    } else if (o.kind === 'heal') {
      this.state.team.forEach(mon => {
        const heal = Math.floor(mon.maxBattleHp * o.pct);
        mon.battleHp = Math.min(mon.maxBattleHp, mon.battleHp + heal);
      });
      showToast('Team healed!', 'success');
    }
    this.onDone(this.state);
  }
}
