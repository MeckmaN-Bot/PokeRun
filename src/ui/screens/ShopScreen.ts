import type { GameState, BattlePokemon, Item, Perk, ShopPack, Rarity } from '../../types';
import { SLOT_UNLOCK_COSTS, MAX_TEAM_SIZE } from '../../types';
import { renderItemCard } from '../components/ItemCard';
import { renderTypeBadges } from '../components/TypeBadge';
import { renderHPBar } from '../components/HPBar';
import { purchaseShopItem, rerollShop, getRerollCost, canAfford } from '../../systems/shop';
import { fadeIn, animateCoinGain, showToast } from '../animations';
import { tryUnlock as tryUnlockAchievement } from '../../systems/achievements';
import { toBattlePokemon, xpForLevel, monHasItem } from '../../systems/battle';
import { fetchPokemon, learnMovesForLevel } from '../../api/pokeapi';
import { showEvolutionOverlay } from './EvolutionOverlay';
import { openMoveManager } from './MoveManagerModal';
import {
  getPackById,
  pickRandomCurse,
  PACK_SERIES,
  PACK_PALETTE,
  PACK_KIND_LABEL,
  PACK_SHORT_TITLE,
  type BoosterPack,
  type SpectralCurse,
  type PackId,
} from '../../data/boosterPacks';
import { ALL_ITEMS } from '../../data/items';
import { mountSettingsButton } from '../../audio/AudioSettingsPanel';
import { ALL_PERKS } from '../../data/perks';
import { getVoucherById } from '../../data/vouchers';
import { Audio } from '../../audio/AudioManager';

const ITEM_BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const POKEAPI_ITEMS = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/';
/** Number of waves a fainted Pokémon must rest in the PC before auto-reviving. */
const PC_REVIVE_WAVES = 3;
function sellValueFor(rarity: Rarity, itemId?: string, lastPaidPrices?: Record<string, number>): number {
  let floor: number;
  switch (rarity) {
    case 'legendary': floor = 80; break;
    case 'epic':      floor = 50; break;
    case 'rare':      floor = 30; break;
    default:          floor = 15;
  }
  if (itemId && lastPaidPrices?.[itemId]) {
    return Math.max(floor, Math.floor(lastPaidPrices[itemId] * 0.4));
  }
  return floor;
}

function itemArt(item: Item, cls = ''): string {
  const clsStr = cls ? ' ' + cls : '';
  // PokeAPI doesn't host every item we reference (e.g. Leech Seed is a move,
  // not an item). Fall back to the icon glyph if the sprite 404s, instead of
  // letting the browser render its broken-image placeholder. The handler is
  // embedded in onerror="..." so every " inside the JS body must become &quot;
  // — otherwise the attribute terminates early and the page hits a parser
  // SyntaxError mid-render (battle→shop crash).
  const iconJson = JSON.stringify(item.icon).replace(/"/g, '&quot;');
  const clsAttr = `item-glyph${clsStr}`.replace(/"/g, '&quot;');
  const fallback = `this.onerror=null;this.replaceWith(Object.assign(document.createElement('span'),{className:&quot;${clsAttr}&quot;,textContent:${iconJson}}))`;
  if (item.pokeapiName) {
    return `<img src="${POKEAPI_ITEMS}${item.pokeapiName}.png" alt="${item.name}" class="item-sprite${clsStr}" draggable="false" onerror="${fallback}">`;
  }
  if (item.sprite) {
    return `<img src="${ITEM_BASE}${item.sprite}" alt="${item.name}" class="item-sprite${clsStr}" draggable="false" onerror="${fallback}">`;
  }
  return `<span class="item-glyph${clsStr}">${item.icon}</span>`;
}

export class ShopScreen {
  private container: HTMLElement;
  private state: GameState;
  private onShopDone: (state: GameState) => void;
  private selectedTeamIndex = 0;
  private selectedInventoryIndex = -1;
  private assigningItem: Item | null = null;
  private openingPackIndex: number | null = null;
  private packOptions: Array<{ kind: 'item'; item: Item } | { kind: 'perk'; perk: Perk }> = [];
  private packPicksRemaining = 0;
  private packPickedKeys: Set<string> = new Set();
  private packSpectralCurse: SpectralCurse | null = null;
  private packPhase: 'idle' | 'shake' | 'tear' | 'fan' | 'done' = 'idle';
  private packRevealed: Set<number> = new Set();
  private packPickedIdx: number[] = [];
  private packDef: BoosterPack | null = null;
  private packMaxPicks = 0;
  private packTimers: number[] = [];
  private packFanEntered = false;
  private stashTab: 'items' | 'equip' | 'perks' = 'items';
  private destroyAudioBtn: (() => void) | null = null;

  constructor(container: HTMLElement, state: GameState, onShopDone: (state: GameState) => void) {
    this.container = container;
    this.state = state;
    this.onShopDone = onShopDone;
  }

  mount(): void {
    this.container.innerHTML = this.renderHTML();
    this.container.style.display = '';
    document.body.classList.add('shop-active');
    fadeIn(this.container);
    this.attachEvents();
    const audioSlot = this.container.querySelector<HTMLElement>('#shop-audio-slot');
    if (audioSlot) this.destroyAudioBtn = mountSettingsButton(audioSlot);
    this.attachMobileTeamDrawer();
    this.portalPackModal();
    this.processPendingEvolutions();
  }

  /** Move #pack-modal out of the shop-wrap into <body>. The shop's
   *  document-flow chrome (head/foot) was rendering above the fixed overlay
   *  on iOS Safari — most likely because some ancestor formed a containing
   *  block (transform/contain) so `position: fixed` resolved to .shop-body's
   *  rect instead of the viewport. Portaling sidesteps the entire stacking
   *  issue. Click delegation re-binds because the modal is no longer a
   *  descendant of `this.container`. */
  private portalPackModal(): void {
    const modal = (this.portaledPackModal ?? this.container.querySelector<HTMLElement>('#pack-modal'));
    if (!modal) return;
    document.body.appendChild(modal);
    modal.addEventListener('click', this.handleClick);
    this.portaledPackModal = modal;
  }

  /** On mobile: shop-side becomes a bottom drawer. Portal drawer + backdrop
   *  to document.body so they're not trapped inside a transformed ancestor's
   *  stacking context (which made the dark backdrop render ABOVE the drawer).
   *  Desktop keeps shop-side inside the grid so the team panel stretches to
   *  full sidebar height and refreshTeamList()'s container query resolves. */
  private attachMobileTeamDrawer(): void {
    const isMobile = window.matchMedia('(max-width: 760px)').matches;
    if (!isMobile) return;

    const side = this.container.querySelector<HTMLElement>('.shop-side');
    const foot = this.container.querySelector<HTMLElement>('.shop-foot');
    const wrap = this.container.querySelector<HTMLElement>('.shop-wrap');
    if (!side || !foot || !wrap) return;
    if (foot.querySelector('#shop-team-toggle')) return;

    // Move the drawer itself out of the shop-wrap into <body>. Container's
    // delegated click handler won't see it after the move, so re-bind to the
    // drawer directly.
    document.body.appendChild(side);
    side.addEventListener('click', this.handleClick);
    this.mobileDrawer = side;

    const backdrop = document.createElement('div');
    backdrop.className = 'shop-side-backdrop mobile-only-btn';
    document.body.appendChild(backdrop);
    this.mobileBackdrop = backdrop;

    const btn = document.createElement('button');
    btn.id = 'shop-team-toggle';
    btn.type = 'button';
    btn.className = 'ink-btn primary mobile-only-btn';
    btn.textContent = '▲ Team';

    const setOpen = (open: boolean) => {
      side.classList.toggle('open', open);
      backdrop.classList.toggle('visible', open);
      btn.textContent = open ? '▼ Close' : '▲ Team';
    };

    btn.addEventListener('click', () => setOpen(!side.classList.contains('open')));
    backdrop.addEventListener('click', () => setOpen(false));

    foot.insertBefore(btn, foot.firstChild);
  }

  private openMoveManager(mon: BattlePokemon): void {
    openMoveManager(mon, () => this.refreshTeamList());
  }

  private async processPendingEvolutions(): Promise<void> {
    for (let i = 0; i < this.state.team.length; i++) {
      const mon = this.state.team[i];
      if (!mon.pendingEvolution || !mon.nextEvolutionId) continue;
      try {
        const evolved = await fetchPokemon(mon.nextEvolutionId, mon.level);
        const evolvedBattle = toBattlePokemon(
          {
            ...evolved,
            itemSlots: mon.itemSlots,
            heldItem: mon.heldItem,
            moves: mon.moves,
            learnedMoveIds: mon.learnedMoveIds ?? mon.moves.map(m => m.id),
            learnsetPool: evolved.learnsetPool,
          },
          this.state.activePerks,
        );
        evolvedBattle.battleHp = Math.min(evolvedBattle.maxBattleHp, mon.battleHp);
        evolvedBattle.battleStatus = mon.battleStatus;
        evolvedBattle.xp = mon.xp;
        evolvedBattle.xpToNextLevel = xpForLevel(evolved.level);
        evolvedBattle.pendingEvolution = false;
        const evoLearned = await learnMovesForLevel(evolvedBattle);
        this.state.team[i] = evolvedBattle;
        await showEvolutionOverlay(mon, evolved, evoLearned);
      } catch {
        mon.pendingEvolution = false;
        showToast(`Evolution of ${mon.displayName} failed.`, 'error');
      }
    }
    this.refreshTeamList();
  }

  private renderHTML(): string {
    const aliveCount = this.state.team.filter(m => m.battleHp > 0).length;
    return `
      <div class="shop-wrap screen">

        <!-- Header: kicker + title | coin-chip + leave button -->
        <div class="shop-head">
          <div>
            <div class="kicker">Rest stop · Wave ${this.state.wave}</div>
            <div class="title">The <em>PEDDLER'S</em> cart</div>
          </div>
          <div class="shop-head-right">
            <div class="coin-chip">
              <span class="coin-dot"></span>
              <span id="shop-coin-display">${this.state.coins.toLocaleString()}</span>
            </div>
            <button class="ink-btn ghost bag-btn" id="bag-btn" title="Open Bag">
              <span class="bag-btn-glyph">▤</span>
              <span class="bag-btn-label">Bag</span>
              <span class="bag-btn-count" id="bag-btn-count">${this.state.inventory.reduce((s, i) => s + i.quantity, 0)}</span>
            </button>
            <button class="ink-btn ghost bag-btn pc-btn" id="pc-btn" title="Open PC Box">
              <img class="bag-btn-glyph pc-btn-icon" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/pokemon-box-link.png" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'bag-btn-glyph',textContent:'📦'}))" />
              <span class="bag-btn-label">PC</span>
              <span class="bag-btn-count" id="pc-btn-count">${this.state.pc.length}</span>
            </button>
            <span class="audio-btn-slot" id="shop-audio-slot"></span>
            <button class="ink-btn primary" id="continue-btn">Leave →</button>
          </div>
        </div>

        <!-- Status strip: type levels + vouchers count -->
        ${this.renderStatusStrip()}

        <!-- Body: shelf (left) + sidebar (right) -->
        <div class="shop-body">
          <div class="shop-shelf" id="shop-items">
            ${this.renderBoosterPacks()}
            ${this.renderShopItems()}
            ${this.renderVouchers()}
          </div>

          <!-- Pack-opening overlay (full-screen) -->
          <div class="po-overlay hidden" id="pack-modal"></div>

          <div class="shop-side">
            <!-- Team panel — full sidebar height -->
            <div class="team-panel side-team">
              <div class="h">
                <span>Your team</span>
                <span class="count">${aliveCount}/${MAX_TEAM_SIZE}</span>
              </div>
              <div class="shop-team-list" id="shop-team-list">
                ${this.renderTeamList()}
              </div>
            </div>

            <!-- PC Box compact strip -->
            <div class="pc-strip-panel" id="pc-strip-panel" data-pc-open="1" title="Open PC Box"
                 style="${this.state.pc.length === 0 ? 'display:none' : ''}">
              <div class="pc-strip-h">
                <span class="pc-strip-label">PC Box</span>
                <span class="pc-strip-count">${this.state.pc.length}</span>
              </div>
              <div class="pc-strip" id="shop-pc-strip">
                ${this.renderPCStrip()}
              </div>
            </div>
          </div>
        </div>

        <!-- Footer: tip + reroll -->
        <div class="shop-foot">
          <div class="kicker">► Items refresh next shop · Prices rise with depth</div>
          <button class="ink-btn ghost" id="reroll-btn">Reroll (${getRerollCost(this.state.wave)}¢)</button>
        </div>

        <!-- Bag modal (inventory + equip + perks) -->
        <div class="modal-overlay hidden" id="bag-modal">
          <div class="modal bag-modal">
            <button class="modal-close" id="close-bag">×</button>
            <h3 class="modal-title">Bag</h3>
            <div class="stash-panel" id="stash-panel">
              ${this.renderStash()}
            </div>
          </div>
        </div>

        <!-- Assign item modal (inventory → pick Pokémon + slot) -->
        <div class="modal-overlay hidden" id="assign-modal">
          <div class="modal">
            <button class="modal-close" id="close-assign">×</button>
            <h3 class="modal-title" id="assign-modal-title">Assign Item</h3>
            <div id="assign-team-list"></div>
          </div>
        </div>

        <!-- Pick held item modal (empty slot → pick from inventory) -->
        <div class="modal-overlay hidden" id="pick-item-modal">
          <div class="modal">
            <button class="modal-close" id="close-pick-item">×</button>
            <h3 class="modal-title" id="pick-item-title">Equip item</h3>
            <div id="pick-item-list"></div>
          </div>
        </div>

        <!-- PC Box modal -->
        <div class="modal-overlay hidden" id="pc-box-modal">
          <div class="modal pc-box-modal">
            <button class="modal-close" id="close-pc-box">×</button>
            <h3 class="modal-title">PC Box <span class="pc-box-count" id="pc-box-count">${this.state.pc.length}</span></h3>
            <div class="pc-box-hint" id="pc-box-hint">${this.state.team.length >= MAX_TEAM_SIZE ? 'Team full — swap a Pokémon to retrieve.' : 'Click Retrieve to add to your team.'}</div>
            <div class="pc-list" id="pc-list-container">${this.renderPCList()}</div>
            <div class="pc-deposit-section">
              <div class="pc-deposit-label">Deposit from team</div>
              <div class="pc-deposit-list" id="pc-deposit-list">${this.renderPCDepositList()}</div>
            </div>
          </div>
        </div>

        <!-- Use consumable modal -->
        <div class="modal-overlay hidden" id="use-modal">
          <div class="modal">
            <button class="modal-close" id="close-use">×</button>
            <h3 class="modal-title" id="use-modal-title">Use on:</h3>
            <div id="use-team-list"></div>
          </div>
        </div>
      </div>
    `;
  }

  private renderPerksStrip(): string {
    const perks = this.state.activePerks ?? [];
    const rewards = this.state.teamRewards ?? [];
    const chips: string[] = [];

    perks.forEach(p => {
      chips.push(`
        <div class="perk-chip" title="${p.description}">
          <span class="perk-chip-icon">◈</span>
          <span class="perk-chip-name">${p.name}</span>
        </div>
      `);
    });

    rewards.forEach(r => {
      chips.push(`
        <div class="perk-chip" title="${r.item.description}">
          <span class="perk-chip-icon">${itemArt(r.item)}</span>
          <span class="perk-chip-name">${r.item.name}</span>
        </div>
      `);
    });

    if (chips.length === 0) {
      return '<span class="perks-strip-empty">No perks yet — earn them from waves!</span>';
    }
    return chips.join('');
  }

  private renderRewardsSidebarContent(): string {
    const perks = this.state.activePerks ?? [];
    const rewards = this.state.teamRewards ?? [];
    const items: string[] = [];

    perks.forEach((p, i) => {
      const sell = sellValueFor(p.rarity);
      items.push(`
        <div class="shop-reward-entry">
          <span class="shop-reward-icon">◈</span>
          <div class="shop-reward-info">
            <div class="shop-reward-name">${p.name}</div>
          </div>
          <button class="ink-btn ghost reward-sell-btn" data-sell-perk="${i}" title="Sell ${p.name} for ${sell}¢">Sell ${sell}¢</button>
        </div>
      `);
    });

    rewards.forEach((r, i) => {
      const sell = sellValueFor(r.item.rarity);
      items.push(`
        <div class="shop-reward-entry">
          <span class="shop-reward-icon">${itemArt(r.item)}</span>
          <div class="shop-reward-info">
            <div class="shop-reward-name">${r.item.name}</div>
            <div class="shop-reward-desc">${r.item.description}</div>
          </div>
          <button class="ink-btn ghost reward-sell-btn" data-sell-team-item="${i}" title="Sell ${r.item.name} for ${sell}¢">Sell ${sell}¢</button>
        </div>
      `);
    });

    if (items.length === 0) {
      return '<div class="shop-rewards-empty">No rewards yet. Win waves to earn perks!</div>';
    }
    return items.join('');
  }

  private renderStatusStrip(): string {
    const levels = this.state.typeLevels ?? {};
    const typeEntries = (Object.entries(levels) as Array<[string, number]>).filter(([, v]) => v > 0);
    const ownedVouchers = this.state.vouchers ?? [];
    const hasAnything = typeEntries.length > 0 || ownedVouchers.length > 0;
    if (!hasAnything) return '';
    const pills = typeEntries.map(([t, lv]) => `
      <span class="type-level-pill type-${t}" title="${t} type Lv.${lv}">
        <span class="tlp-type">${t}</span>
        <span class="tlp-lv">Lv.${lv}</span>
      </span>`).join('');
    const vCount = ownedVouchers.length > 0
      ? `<span class="status-strip-chip" title="Active vouchers">◈ ${ownedVouchers.length} voucher${ownedVouchers.length === 1 ? '' : 's'}</span>`
      : '';
    return `
      <div class="shop-status-strip">
        ${typeEntries.length > 0 ? `
          <span class="status-strip-label">Type Levels</span>
          <div class="status-strip-pills">${pills}</div>
        ` : ''}
        ${vCount ? `<span class="status-strip-sep"></span>${vCount}` : ''}
      </div>
    `;
  }

  private renderPCStrip(): string {
    const pc = this.state.pc ?? [];
    if (pc.length === 0) return '';
    return pc.slice(0, 12).map((mon, i) => `
      <div class="pc-chip" data-pc-open="1" data-pc-index="${i}" title="${mon.displayName} · Lv.${mon.level} — open PC Box">
        <img class="pc-chip-sprite" src="${mon.sprite}" alt="${mon.displayName}" draggable="false">
        <span class="pc-chip-lv">L${mon.level}</span>
      </div>
    `).join('') + (pc.length > 12 ? `<span class="pc-chip-more" data-pc-open="1" title="Open PC Box">+${pc.length - 12}</span>` : '');
  }

  private renderStash(): string {
    const itemCount = this.state.inventory.reduce((s, i) => s + i.quantity, 0);
    const equipCount = this.state.teamRewards.length;
    const perkCount = this.state.activePerks.length;
    const tab = this.stashTab;
    const tabBtn = (id: 'items' | 'equip' | 'perks', label: string, count: number) => `
      <button class="stash-tab${tab === id ? ' active' : ''}" data-stash-tab="${id}" type="button">
        <span class="stash-tab-label">${label}</span>
        <span class="stash-tab-count">${count}</span>
      </button>
    `;
    let body = '';
    if (tab === 'items') body = this.renderStashItems();
    else if (tab === 'equip') body = this.renderStashEquip();
    else body = this.renderStashPerks();
    return `
      <div class="stash-tabs" role="tablist">
        ${tabBtn('items', 'Items', itemCount)}
        ${tabBtn('equip', 'Equip', equipCount)}
        ${tabBtn('perks', 'Perks', perkCount)}
      </div>
      <div class="stash-list" id="stash-list">${body}</div>
    `;
  }

  private renderStashItems(): string {
    if (this.state.inventory.length === 0) {
      return '<div class="stash-empty">No items yet — buy from the cart or open boosters.</div>';
    }
    return this.state.inventory.map((inv, i) => {
      const sell = sellValueFor(inv.item.rarity, inv.item.id, this.state.lastPaidPrices);
      const primary = inv.item.itemType === 'held'
        ? `<button class="stash-btn" data-action="assign-item" data-inv-index="${i}" title="Assign ${inv.item.name}">Assign</button>`
        : `<button class="stash-btn" data-action="use-item" data-inv-index="${i}" title="Use ${inv.item.name}">Use</button>`;
      return `
        <div class="stash-row" data-inv-index="${i}">
          <span class="stash-row-icon">${itemArt(inv.item)}</span>
          <div class="stash-row-info">
            <div class="stash-row-name">${inv.item.name}<span class="stash-row-qty">×${inv.quantity}</span></div>
            <div class="stash-row-sub">${inv.item.itemType === 'held' ? 'Held' : 'Consumable'} · ${inv.item.rarity}</div>
          </div>
          <div class="stash-row-actions">
            ${primary}
            <button class="stash-btn sell" data-sell-inv="${i}" title="Sell 1 ${inv.item.name} for ${sell}¢">Sell ${sell}¢</button>
          </div>
        </div>
      `;
    }).join('');
  }

  private renderStashEquip(): string {
    const rewards = this.state.teamRewards ?? [];
    if (rewards.length === 0) {
      return '<div class="stash-empty">No team-equipped items yet.</div>';
    }
    return rewards.map((r, i) => {
      const sell = sellValueFor(r.item.rarity);
      return `
        <div class="stash-row">
          <span class="stash-row-icon">${itemArt(r.item)}</span>
          <div class="stash-row-info">
            <div class="stash-row-name">${r.item.name}</div>
            <div class="stash-row-sub">${r.item.description}</div>
          </div>
          <div class="stash-row-actions">
            <button class="stash-btn sell" data-sell-team-item="${i}" title="Sell ${r.item.name} for ${sell}¢">Sell ${sell}¢</button>
          </div>
        </div>
      `;
    }).join('');
  }

  private renderStashPerks(): string {
    const perks = this.state.activePerks ?? [];
    if (perks.length === 0) {
      return '<div class="stash-empty">No perks yet — earn them between waves.</div>';
    }
    return perks.map((p, i) => {
      const sell = sellValueFor(p.rarity);
      return `
        <div class="stash-row">
          <span class="stash-row-icon perk-icon">◈</span>
          <div class="stash-row-info">
            <div class="stash-row-name">${p.name}</div>
            <div class="stash-row-sub">${p.description}</div>
          </div>
          <div class="stash-row-actions">
            <button class="stash-btn sell" data-sell-perk="${i}" title="Sell ${p.name} for ${sell}¢">Sell ${sell}¢</button>
          </div>
        </div>
      `;
    }).join('');
  }

  private renderVouchers(): string {
    const vouchers = this.state.shopVouchers ?? [];
    if (vouchers.length === 0) return '';
    const cards = vouchers.map((sv, i) => {
      const def = getVoucherById(sv.voucherId);
      if (!def) return '';
      return `
        <div class="voucher-card${sv.sold ? ' sold' : ''}" data-voucher-index="${i}">
          <div class="voucher-glyph">${def.icon}</div>
          <div class="voucher-body">
            <div class="voucher-head">
              <div class="voucher-name">${def.name}</div>
              <div class="voucher-price">${sv.price}¢</div>
            </div>
            <div class="voucher-desc">${def.description}</div>
          </div>
        </div>
      `;
    }).join('');
    const liveCount = vouchers.filter(v => !v.sold).length;
    return `
      <section class="shelf-section shelf-vouchers">
        <header class="shelf-section-head">
          <span class="shelf-section-glyph">◈</span>
          <span class="shelf-section-title">Vouchers</span>
          <span class="shelf-section-meta">${liveCount} on offer</span>
          <span class="shelf-section-rule"></span>
        </header>
        <div class="voucher-row">${cards}</div>
      </section>
    `;
  }

  private renderPackArt(packId: PackId, opts: { size?: 'sm' | 'lg'; price?: string | null; pickN: number; outOf: number } = { pickN: 1, outOf: 1 }): string {
    const palette = PACK_PALETTE[packId];
    const series = PACK_SERIES[packId];
    const title = PACK_SHORT_TITLE[packId];
    const kind = PACK_KIND_LABEL[packId];
    const size = opts.size ?? 'sm';
    const rays = Array.from({ length: 12 }).map((_, i) =>
      `<span style="transform:rotate(${i * 30}deg) translateY(-50%)"></span>`,
    ).join('');
    return `
      <div class="pa pa-${size}" style="--pa-c1:${palette[0]};--pa-c2:${palette[1]}">
        <div class="pa-bg"></div>
        <div class="pa-halftone"></div>
        <div class="pa-foil"></div>

        <div class="pa-top">
          <div class="pa-series">${series}</div>
          <div class="pa-tear-edge"></div>
        </div>

        <div class="pa-emblem">
          <div class="pa-ball">
            <div class="pa-ball-top"></div>
            <div class="pa-ball-seam"></div>
            <div class="pa-ball-btn"></div>
            <div class="pa-ball-bot"></div>
          </div>
          <div class="pa-rays">${rays}</div>
        </div>

        <div class="pa-name">
          <div class="pa-title">${title}</div>
          <div class="pa-sub">Booster</div>
        </div>

        <div class="pa-bottom">
          <span class="pa-pick">${opts.pickN} of ${opts.outOf}</span>
          <span class="pa-kind">${kind}</span>
        </div>

        <span class="pa-star pa-star-tl">✦</span>
        <span class="pa-star pa-star-tr">✦</span>
        <span class="pa-star pa-star-bl">✦</span>
        <span class="pa-star pa-star-br">✦</span>
      </div>
    `;
  }

  private renderBoosterPacks(): string {
    const packs = this.state.shopPacks ?? [];
    if (packs.length === 0) return '';
    const cards = packs.map((sp, i) => {
      const def = getPackById(sp.packId);
      if (!def) return '';
      const priceLabel = sp.free ? 'FREE' : `${sp.price}¢`;
      const unaffordable = !sp.free && this.state.coins < sp.price;
      const cls = [
        'pack-card',
        sp.sold ? 'sold' : '',
        sp.free ? 'pack-free' : '',
        unaffordable ? 'unaffordable' : '',
      ].filter(Boolean).join(' ');
      return `
        <div class="${cls}" data-pack-index="${i}" title="${def.name} — ${def.description}">
          ${this.renderPackArt(def.id, { size: 'sm', price: null, pickN: def.pick, outOf: def.options })}
          <div class="pa-price${sp.free ? ' is-free' : ''}">${priceLabel}</div>
        </div>
      `;
    }).join('');
    return `
      <section class="shelf-section shelf-boosters">
        <header class="shelf-section-head">
          <span class="shelf-section-glyph">◇</span>
          <span class="shelf-section-title">Boosters</span>
          <span class="shelf-section-meta">${packs.filter(p => !p.sold).length} avail</span>
          <span class="shelf-section-rule"></span>
        </header>
        <div class="booster-row">${cards}</div>
      </section>
    `;
  }

  private renderShopItems(): string {
    if (this.state.shopItems.length === 0) return '';
    const cards = this.state.shopItems.map((si, i) => {
      const rarityLabel = si.item.rarity ?? 'common';
      const itemType = si.item.itemType === 'held' ? 'held' : 'consumable';
      return `
        <div class="shop-item${si.sold ? ' sold' : ''}" data-shop-index="${i}" data-item-id="${si.item.id}">
          <div class="item-art">${itemArt(si.item)}</div>
          <div class="item-body">
            <div class="item-head">
              <div class="item-name">${si.item.name}</div>
              <div class="item-price">${si.price}¢</div>
            </div>
            <div class="item-meta">· ${rarityLabel} · ${itemType}</div>
            <div class="item-desc">${si.item.description}</div>
          </div>
        </div>
      `;
    }).join('');
    const liveCount = this.state.shopItems.filter(s => !s.sold).length;
    return `
      <section class="shelf-section shelf-items">
        <header class="shelf-section-head">
          <span class="shelf-section-glyph">◆</span>
          <span class="shelf-section-title">Goods</span>
          <span class="shelf-section-meta">${liveCount} on shelf</span>
          <span class="shelf-section-rule"></span>
        </header>
        <div class="shop-items-grid">${cards}</div>
      </section>
    `;
  }

  private renderItemSlots(mon: BattlePokemon): string {
    const slots = mon.itemSlots ?? [];
    return `<div class="item-slots-row">${slots.map((slot, si) => {
      if (slot.unlocked && slot.item) {
        return `<div class="item-slot filled" title="${slot.item.name}: ${slot.item.description}">${itemArt(slot.item)}</div>`;
      } else if (slot.unlocked) {
        return `<div class="item-slot empty" title="Slot ${si + 1} (empty)">·</div>`;
      } else {
        return `<div class="item-slot locked" title="Unlock: ${SLOT_UNLOCK_COSTS[si]}¢">◈</div>`;
      }
    }).join('')}</div>`;
  }

  private renderTeamList(): string {
    return this.state.team.map((mon, i) => {
      const hpPct = Math.max(0, Math.min(100, (mon.battleHp / mon.maxBattleHp) * 100));
      const hpClass = hpPct > 50 ? 'high' : hpPct > 20 ? 'mid' : 'low';
      const slots = mon.itemSlots ?? [];
      const hasHeldItems = this.state.inventory.some(inv => inv.item.itemType === 'held');

      const slotsHtml = slots.map((slot, si) => {
        if (!slot.unlocked) {
          const cost = SLOT_UNLOCK_COSTS[si];
          const affordable = this.state.coins >= cost;
          return `
            <button class="stc-slot locked ${affordable ? '' : 'cant-afford'}"
              data-team-slot-unlock="${si}" data-team-index="${i}"
              title="${affordable ? `Unlock Slot ${si + 1} for ${cost}¢` : `Need ${cost}¢ to unlock`}">
              <span class="stc-slot-glyph">◈</span>
              <span class="stc-slot-label">${cost}¢</span>
            </button>`;
        } else if (slot.item) {
          const label = slot.item.name.length > 9 ? slot.item.name.slice(0, 8) + '…' : slot.item.name;
          return `
            <button class="stc-slot filled"
              data-team-slot-remove="${si}" data-team-index="${i}"
              title="${slot.item.name} — click to remove">
              ${itemArt(slot.item, 'stc-slot-glyph')}
              <span class="stc-slot-label">${label}</span>
              <span class="stc-slot-x">×</span>
            </button>`;
        } else {
          return `
            <button class="stc-slot empty ${!hasHeldItems ? 'cant-afford' : ''}"
              data-team-slot-assign="${si}" data-team-index="${i}"
              title="${hasHeldItems ? 'Equip a held item' : 'No held items in inventory'}">
              <span class="stc-slot-glyph">+</span>
              <span class="stc-slot-label">Equip</span>
            </button>`;
        }
      }).join('');

      return `
        <div class="shop-team-card ${mon.battleHp <= 0 ? 'fainted' : ''}"
             draggable="true"
             data-team-drag="${i}">
          <div class="stc-top">
            <span class="stc-drag-handle" title="Drag to reorder">⋮⋮</span>
            <img src="${mon.sprite}" class="stc-sprite" alt="${mon.displayName}" />
            <div class="stc-meta">
              <div class="stc-name-row">
                <span class="stc-name">${mon.displayName}</span>
                <span class="stc-types">${renderTypeBadges(mon.types ?? [])}</span>
              </div>
              <span class="stc-stat">Lv ${mon.level} · ${Math.max(0, mon.battleHp)}/${mon.maxBattleHp}</span>
              <div class="stc-hp-bar">
                <div class="stc-hp-fill ${hpClass}" style="width:${hpPct}%"></div>
              </div>
            </div>
            <div class="stc-actions">
              <button class="stc-order-btn stc-moves-btn ${(mon.pendingLearns?.length ?? 0) > 0 ? 'has-pending' : ''}"
                      data-action="open-moves" data-team-index="${i}"
                      title="${(mon.pendingLearns?.length ?? 0) > 0 ? `${mon.pendingLearns!.length} move(s) waiting` : 'Manage moves'}">
                ☰
                ${(mon.pendingLearns?.length ?? 0) > 0 ? `<span class="stc-moves-badge">${mon.pendingLearns!.length}</span>` : ''}
              </button>
              ${i > 0
                ? `<button class="stc-order-btn" data-action="move-up" data-team-index="${i}" title="Move up">↑</button>`
                : `<span class="stc-order-btn" style="visibility:hidden;pointer-events:none"></span>`}
              ${i < this.state.team.length - 1
                ? `<button class="stc-order-btn" data-action="move-down" data-team-index="${i}" title="Move down">↓</button>`
                : `<span class="stc-order-btn" style="visibility:hidden;pointer-events:none"></span>`}
            </div>
          </div>
          <div class="stc-slots-row">${slotsHtml}</div>
        </div>
      `;
    }).join('');
  }

  private renderPCDepositList(): string {
    if (this.state.team.length <= 1) {
      return '<div class="pc-deposit-empty">Need at least 2 Pokémon in team to deposit.</div>';
    }
    return this.state.team.map((mon, i) => `
      <div class="pc-row pc-deposit-row" data-team-index="${i}">
        <img src="${mon.sprite}" alt="${mon.displayName}" class="pc-sprite" draggable="false">
        <div class="pc-info">
          <span class="pc-name">${mon.displayName}</span>
          <span class="pc-meta">Lv.${mon.level} · ${mon.battleHp}/${mon.maxBattleHp} HP</span>
        </div>
        <button class="btn btn-sm btn-secondary" data-action="deposit-pc" data-team-index="${i}">Deposit</button>
      </div>
    `).join('');
  }

  private renderPCList(): string {
    const teamFull = this.state.team.length >= MAX_TEAM_SIZE;
    return this.state.pc.map((mon, i) => {
      const fainted = mon.battleHp <= 0;
      const reviveLeft = fainted ? (mon.pcReviveCountdown ?? PC_REVIVE_WAVES) : 0;
      const status = fainted
        ? `<span style="color:var(--oxblood)">Fainted</span> · <span style="color:var(--moss)">Revives in ${reviveLeft} wave${reviveLeft === 1 ? '' : 's'}</span>`
        : `${mon.battleHp}/${mon.maxBattleHp} HP`;
      return `
        <div class="pc-row${fainted ? ' fainted' : ''}" data-pc-index="${i}">
          <img src="${mon.sprite}" alt="${mon.displayName}" class="pc-sprite" draggable="false">
          <div class="pc-info">
            <span class="pc-name">${mon.displayName}</span>
            <span class="pc-meta">Lv.${mon.level} · ${status}</span>
          </div>
          ${teamFull
            ? `<button class="btn btn-sm btn-secondary" data-pc-swap="${i}" title="Swap with a team member">Swap</button>`
            : `<button class="btn btn-sm btn-secondary" data-pc-retrieve="${i}">Retrieve</button>`
          }
        </div>
      `;
    }).join('');
  }

  private renderInventory(): string {
    if (this.state.inventory.length === 0) {
      return '<div class="inventory-empty">No items in inventory</div>';
    }
    return this.state.inventory.map((inv, i) => `
      <div class="inventory-row ${i === this.selectedInventoryIndex ? 'selected' : ''}" data-inv-index="${i}">
        <span class="inv-icon">${itemArt(inv.item)}</span>
        <div class="inv-info">
          <span class="inv-name">${inv.item.name}</span>
          <span class="inv-type">${inv.item.itemType === 'held' ? 'Held' : 'Consumable'}</span>
        </div>
        <span class="inv-qty">×${inv.quantity}</span>
        <div class="inv-actions">
          ${inv.item.itemType === 'held'
            ? `<button class="btn btn-sm btn-secondary" data-action="assign-item" data-inv-index="${i}">Assign</button>`
            : `<button class="btn btn-sm btn-secondary" data-action="use-item" data-inv-index="${i}">Use</button>`}
        </div>
      </div>
    `).join('');
  }

  private renderTeamRewards(): string {
    const perks = this.state.activePerks ?? [];
    if (perks.length === 0) {
      return '<div class="team-rewards-empty">No perks yet — win waves to earn them!</div>';
    }
    return perks.map(p => `
      <div class="team-reward-row">
        <span class="inv-icon">${p.icon ?? '◈'}</span>
        <div class="inv-info">
          <span class="inv-name">${p.name}</span>
          <span class="inv-type">${p.description}</span>
        </div>
      </div>
    `).join('');
  }

  private mobileDrawer: HTMLElement | null = null;
  private mobileBackdrop: HTMLElement | null = null;
  private portaledPackModal: HTMLElement | null = null;
  private packFanScrollLeft = 0;

  private attachEvents(): void {
    this.container.addEventListener('click', this.handleClick);
  }

  private handleClick = async (e: Event): Promise<void> => {
    const target = e.target as HTMLElement;

      // ── Bag modal open/close ─────────────────────────────────
      const bagBtn = target.closest('#bag-btn') as HTMLElement | null;
      if (bagBtn) {
        const modal = this.container.querySelector('#bag-modal') as HTMLElement | null;
        if (modal) {
          this.refreshStash();
          modal.classList.remove('hidden');
        }
        return;
      }
      const closeBag = target.closest('#close-bag') as HTMLElement | null;
      if (closeBag) {
        this.container.querySelector('#bag-modal')?.classList.add('hidden');
        return;
      }
      const bagOverlay = target.closest('#bag-modal') as HTMLElement | null;
      if (bagOverlay && target === bagOverlay) {
        bagOverlay.classList.add('hidden');
        return;
      }

      // ── PC button (header) ───────────────────────────────────
      const pcHeaderBtn = target.closest('#pc-btn') as HTMLElement | null;
      if (pcHeaderBtn) {
        this.openPCBoxModal();
        return;
      }

      // ── Stash tab switch ─────────────────────────────────────
      const stashTabBtn = target.closest('[data-stash-tab]') as HTMLElement | null;
      if (stashTabBtn) {
        const tab = stashTabBtn.dataset['stashTab'] as 'items' | 'equip' | 'perks' | undefined;
        if (tab && tab !== this.stashTab) {
          this.stashTab = tab;
          this.refreshStash();
        }
        return;
      }

      // ── Team panel slot: unlock ──────────────────────────────
      const teamSlotUnlock = target.closest('[data-team-slot-unlock]') as HTMLElement | null;
      if (teamSlotUnlock) {
        const si = parseInt(teamSlotUnlock.dataset['teamSlotUnlock'] ?? '0');
        const pi = parseInt(teamSlotUnlock.dataset['teamIndex'] ?? '0');
        const cost = SLOT_UNLOCK_COSTS[si];
        if (this.state.coins < cost) { showToast(`Need ${cost}¢ to unlock this slot.`, 'error'); return; }
        const mon = this.state.team[pi];
        if (mon?.itemSlots[si]) {
          const oldCoins = this.state.coins;
          this.state.coins -= cost;
          mon.itemSlots[si].unlocked = true;
          const coinEl = this.container.querySelector<HTMLElement>('#shop-coin-display');
          if (coinEl) animateCoinGain(coinEl, oldCoins, this.state.coins);
          showToast(`Slot ${si + 1} unlocked for ${mon.displayName}!`, 'success');
          this.refreshTeamList();
        }
        return;
      }

      // ── Team panel slot: remove held item ────────────────────
      const teamSlotRemove = target.closest('[data-team-slot-remove]') as HTMLElement | null;
      if (teamSlotRemove) {
        const si = parseInt(teamSlotRemove.dataset['teamSlotRemove'] ?? '0');
        const pi = parseInt(teamSlotRemove.dataset['teamIndex'] ?? '0');
        const mon = this.state.team[pi];
        const removedItem = mon?.itemSlots[si]?.item;
        if (!mon || !removedItem) return;
        mon.itemSlots[si].item = null;
        if (si === 0) mon.heldItem = null;
        const existing = this.state.inventory.find(inv => inv.item.id === removedItem.id);
        if (existing) existing.quantity++;
        else this.state.inventory.push({ item: removedItem, quantity: 1 });
        const newMon = toBattlePokemon({ ...mon }, this.state.activePerks);
        newMon.battleHp = Math.min(mon.battleHp, newMon.maxBattleHp);
        newMon.battleStatus = mon.battleStatus;
        newMon.xp = mon.xp;
        newMon.xpToNextLevel = mon.xpToNextLevel;
        this.state.team[pi] = newMon;
        showToast(`${removedItem.name} removed from ${mon.displayName}.`, 'success');
        this.refreshTeamList();
        this.refreshInventory();
        return;
      }

      // ── Team panel slot: assign (empty slot clicked) ─────────
      const teamSlotAssign = target.closest('[data-team-slot-assign]') as HTMLElement | null;
      if (teamSlotAssign) {
        const si = parseInt(teamSlotAssign.dataset['teamSlotAssign'] ?? '0');
        const pi = parseInt(teamSlotAssign.dataset['teamIndex'] ?? '0');
        this.openPickItemModal(pi, si);
        return;
      }

      // ── Pick-item modal: equip chosen item ───────────────────
      const pickItemBtn = target.closest('[data-pick-item]') as HTMLElement | null;
      if (pickItemBtn) {
        const invIdx = parseInt(pickItemBtn.dataset['pickItem'] ?? '0');
        const teamIdx = parseInt(pickItemBtn.dataset['pickTeam'] ?? '0');
        const slotIdx = parseInt(pickItemBtn.dataset['pickSlot'] ?? '0');
        this.assigningItem = this.state.inventory[invIdx]?.item ?? null;
        this.selectedInventoryIndex = invIdx;
        this.container.querySelector('#pick-item-modal')?.classList.add('hidden');
        this.assignHeldItemToSlot(teamIdx, slotIdx);
        return;
      }

      // ── Assign modal: unlock slot ────────────────────────────
      const unlockBtn = target.closest('[data-unlock-slot]') as HTMLElement | null;
      if (unlockBtn) {
        const si = parseInt(unlockBtn.dataset['unlockSlot'] ?? '0');
        const pi = parseInt(unlockBtn.dataset['assignPokemon'] ?? '0');
        const cost = SLOT_UNLOCK_COSTS[si];
        if (this.state.coins < cost) { showToast(`Need ${cost}¢ to unlock this slot.`, 'error'); return; }
        const mon = this.state.team[pi];
        if (mon?.itemSlots[si]) {
          const oldCoins = this.state.coins;
          this.state.coins -= cost;
          mon.itemSlots[si].unlocked = true;
          const coinEl = this.container.querySelector<HTMLElement>('#shop-coin-display');
          if (coinEl) animateCoinGain(coinEl, oldCoins, this.state.coins);
          showToast(`Slot ${si + 1} unlocked for ${mon.displayName}!`, 'success');
          this.openAssignModal(this.selectedInventoryIndex);
        }
        return;
      }

      // ── Assign modal: equip into slot ────────────────────────
      const assignSlotBtn = target.closest('[data-assign-slot]') as HTMLElement | null;
      if (assignSlotBtn) {
        const si = parseInt(assignSlotBtn.dataset['assignSlot'] ?? '0');
        const pi = parseInt(assignSlotBtn.dataset['assignPokemon'] ?? '0');
        this.assignHeldItemToSlot(pi, si);
        return;
      }

      // ── Shop: buy item ───────────────────────────────────────
      const shopCard = target.closest('[data-shop-index]') as HTMLElement | null;
      if (shopCard && !target.dataset['action']) {
        const idx = parseInt(shopCard.dataset['shopIndex'] ?? '0');
        this.buyItem(idx);
        return;
      }

      // ── Sell team perk / team-reward item / inventory ────
      const sellPerkBtn = target.closest('[data-sell-perk]') as HTMLElement | null;
      if (sellPerkBtn) {
        const idx = parseInt(sellPerkBtn.dataset['sellPerk'] ?? '-1');
        this.sellTeamPerk(idx);
        return;
      }
      const sellItemBtn = target.closest('[data-sell-team-item]') as HTMLElement | null;
      if (sellItemBtn) {
        const idx = parseInt(sellItemBtn.dataset['sellTeamItem'] ?? '-1');
        this.sellTeamRewardItem(idx);
        return;
      }
      const sellInvBtn = target.closest('[data-sell-inv]') as HTMLElement | null;
      if (sellInvBtn) {
        const idx = parseInt(sellInvBtn.dataset['sellInv'] ?? '-1');
        this.sellInventoryItem(idx);
        return;
      }

      // ── Shop: buy/open booster pack ──────────────────────────
      const packCard = target.closest('[data-pack-index]') as HTMLElement | null;
      if (packCard) {
        const idx = parseInt(packCard.dataset['packIndex'] ?? '0');
        this.buyAndOpenPack(idx);
        return;
      }

      // ── Shop: buy voucher ────────────────────────────────────
      const voucherCard = target.closest('[data-voucher-index]') as HTMLElement | null;
      if (voucherCard) {
        const idx = parseInt(voucherCard.dataset['voucherIndex'] ?? '0');
        this.buyVoucher(idx);
        return;
      }

      // ── Pack overlay: tap pack to tear ───────────────────────
      const packWrap = target.closest('#po-pack-wrap') as HTMLElement | null;
      if (packWrap && this.packPhase === 'idle') {
        this.startPackTear();
        return;
      }

      // ── Pack overlay: card click (reveal then pick) ──────────
      const packCardSlot = target.closest('[data-pack-card]') as HTMLElement | null;
      if (packCardSlot) {
        const i = parseInt(packCardSlot.dataset['packCard'] ?? '0');
        this.toggleCardPick(i);
        return;
      }

      // ── Pack overlay: reveal all ─────────────────────────────
      if (target.id === 'po-reveal-all' || target.closest('#po-reveal-all')) {
        this.revealAllCards();
        return;
      }

      // ── Pack overlay: confirm picks ──────────────────────────
      if (target.id === 'po-confirm' || target.closest('#po-confirm')) {
        this.confirmPackPicks();
        return;
      }

      // ── Pack overlay: close (only in idle phase) ─────────────
      if (target.id === 'po-close' || target.closest('#po-close')) {
        if (this.packPhase === 'idle') this.closePackModal();
        return;
      }
      // Backdrop click on overlay (idle only)
      if (target.id === 'pack-modal' && this.packPhase === 'idle') {
        this.closePackModal();
        return;
      }

      if (target.dataset['action'] === 'assign-item') {
        const invIdx = parseInt(target.dataset['invIndex'] ?? '0');
        this.openAssignModal(invIdx);
        return;
      }

      if (target.dataset['action'] === 'use-item') {
        const invIdx = parseInt(target.dataset['invIndex'] ?? '0');
        this.openUseModal(invIdx);
        return;
      }

      const openMovesBtn = target.closest<HTMLElement>('[data-action="open-moves"]');
      if (openMovesBtn) {
        const idx = parseInt(openMovesBtn.dataset['teamIndex'] ?? '0');
        const mon = this.state.team[idx];
        if (mon) this.openMoveManager(mon);
        return;
      }

      if (target.dataset['action'] === 'move-up') {
        const idx = parseInt(target.dataset['teamIndex'] ?? '0');
        if (idx > 0) {
          [this.state.team[idx - 1], this.state.team[idx]] = [this.state.team[idx], this.state.team[idx - 1]];
          this.refreshTeamList();
        }
        return;
      }

      if (target.dataset['action'] === 'move-down') {
        const idx = parseInt(target.dataset['teamIndex'] ?? '0');
        if (idx < this.state.team.length - 1) {
          [this.state.team[idx], this.state.team[idx + 1]] = [this.state.team[idx + 1], this.state.team[idx]];
          this.refreshTeamList();
        }
        return;
      }

      if (target.dataset['action'] === 'deposit-pc') {
        const idx = parseInt(target.dataset['teamIndex'] ?? '0');
        const mon = this.state.team[idx];
        if (!mon) return;
        if (this.state.team.length <= 1) {
          showToast('You need at least one Pokémon on the team!', 'error');
          Audio.play('ui.error');
          return;
        }
        if (mon.battleHp <= 0) {
          mon.pcReviveCountdown = PC_REVIVE_WAVES;
        } else {
          mon.pcReviveCountdown = undefined;
        }
        this.state.team.splice(idx, 1);
        this.state.pc.push(mon);
        showToast(`${mon.displayName} stored in the PC Box.`, 'success');
        Audio.play('ui.confirm');
        this.refreshTeamList();
        this.refreshPCList();
        return;
      }

      // ── PC Box: open modal ──────────────────────────────────
      const pcOpen = target.closest('[data-pc-open]') as HTMLElement | null;
      if (pcOpen && !target.closest('[data-pc-retrieve]') && !target.closest('[data-pc-swap]')) {
        this.openPCBoxModal();
        return;
      }
      if (target.id === 'close-pc-box' || target.id === 'pc-box-modal') {
        this.container.querySelector('#pc-box-modal')?.classList.add('hidden');
        return;
      }

      // ── PC Box: retrieve ────────────────────────────────────
      const pcRetrieve = target.closest('[data-pc-retrieve]') as HTMLElement | null;
      if (pcRetrieve) {
        const idx = parseInt(pcRetrieve.dataset['pcRetrieve'] ?? '0');
        const mon = this.state.pc[idx];
        if (!mon) return;
        if (this.state.team.length >= MAX_TEAM_SIZE) {
          showToast('Team is full! Swap a Pokémon first.', 'error');
          return;
        }
        this.state.pc.splice(idx, 1);
        // Iron Trainer deck — slot 2 unlocked by default.
        if (this.state.deckMods?.startWithSlot2 && mon.itemSlots?.[1]) {
          mon.itemSlots[1].unlocked = true;
        }
        this.state.team.push(mon);
        showToast(`${mon.displayName} added to team!`, 'success');
        this.refreshTeamList();
        this.refreshPCList();
        return;
      }

      // ── PC Box: swap with team member ───────────────────────
      const pcSwap = target.closest('[data-pc-swap]') as HTMLElement | null;
      if (pcSwap) {
        const pcIdx = parseInt(pcSwap.dataset['pcSwap'] ?? '0');
        // Open a simple inline swap picker
        this.openPCSwapModal(pcIdx);
        return;
      }

      const pcSwapConfirm = target.closest('[data-pc-swap-team]') as HTMLElement | null;
      if (pcSwapConfirm) {
        const pcIdx = parseInt(pcSwapConfirm.dataset['pcSwapPc'] ?? '0');
        const teamIdx = parseInt(pcSwapConfirm.dataset['pcSwapTeam'] ?? '0');
        const pcMon = this.state.pc[pcIdx];
        const teamMon = this.state.team[teamIdx];
        if (!pcMon || !teamMon) return;
        this.state.pc.splice(pcIdx, 1, teamMon);
        this.state.team.splice(teamIdx, 1, pcMon);
        showToast(`Swapped ${pcMon.displayName} ↔ ${teamMon.displayName}`, 'success');
        this.container.querySelector('#pc-swap-modal')?.classList.add('hidden');
        this.refreshTeamList();
        this.refreshPCList();
        return;
      }

      if (target.id === 'reroll-btn' || target.closest('#reroll-btn')) {
        this.rerollShop();
        return;
      }

      if (target.id === 'continue-btn' || target.closest('#continue-btn')) {
        this.performWaveEndCleanup();
        this.onShopDone(this.state);
        return;
      }

      // ── Modal close / backdrop ───────────────────────────────
      if (target.id === 'close-assign' || target.id === 'assign-modal') {
        this.container.querySelector('#assign-modal')?.classList.add('hidden');
        this.assigningItem = null;
        return;
      }
      if (target.id === 'close-pick-item' || target.id === 'pick-item-modal') {
        this.container.querySelector('#pick-item-modal')?.classList.add('hidden');
        return;
      }
      if (target.id === 'close-use' || target.id === 'use-modal') {
        this.container.querySelector('#use-modal')?.classList.add('hidden');
        return;
      }

    const useRow = target.closest('[data-use-index]') as HTMLElement | null;
    if (useRow) {
      const teamIdx = parseInt(useRow.dataset['useIndex'] ?? '0');
      this.useConsumable(teamIdx);
      return;
    }
  };

  private sellTeamPerk(idx: number): void {
    const perks = this.state.activePerks ?? [];
    if (idx < 0 || idx >= perks.length) return;
    const perk = perks[idx];
    const value = sellValueFor(perk.rarity);
    perks.splice(idx, 1);
    const oldCoins = this.state.coins;
    this.state.coins += value;
    const coinEl = this.container.querySelector<HTMLElement>('#shop-coin-display');
    if (coinEl) animateCoinGain(coinEl, oldCoins, this.state.coins);
    showToast(`${perk.name} sold (+${value}¢)`, 'success');
    this.refreshShop();
  }

  private sellInventoryItem(idx: number): void {
    const inv = this.state.inventory ?? [];
    if (idx < 0 || idx >= inv.length) return;
    const entry = inv[idx];
    const value = sellValueFor(entry.item.rarity, entry.item.id, this.state.lastPaidPrices);
    entry.quantity -= 1;
    if (entry.quantity <= 0) inv.splice(idx, 1);
    const oldCoins = this.state.coins;
    this.state.coins += value;
    const coinEl = this.container.querySelector<HTMLElement>('#shop-coin-display');
    if (coinEl) animateCoinGain(coinEl, oldCoins, this.state.coins);
    showToast(`${entry.item.name} sold (+${value}¢)`, 'success');
    this.refreshStash();
  }

  private sellTeamRewardItem(idx: number): void {
    const rewards = this.state.teamRewards ?? [];
    if (idx < 0 || idx >= rewards.length) return;
    const entry = rewards[idx];
    const value = sellValueFor(entry.item.rarity, entry.item.id, this.state.lastPaidPrices);
    rewards.splice(idx, 1);
    const oldCoins = this.state.coins;
    this.state.coins += value;
    const coinEl = this.container.querySelector<HTMLElement>('#shop-coin-display');
    if (coinEl) animateCoinGain(coinEl, oldCoins, this.state.coins);
    showToast(`${entry.item.name} sold (+${value}¢)`, 'success');
    this.refreshShop();
  }

  private buyItem(shopIndex: number): void {
    const shopItem = this.state.shopItems[shopIndex];
    if (!shopItem || shopItem.sold) return;
    if (!canAfford(shopItem.price, this.state.coins)) {
      showToast('Not enough coins!', 'error');
      Audio.play('shop.unaffordable');
      return;
    }
    const { success, newCoins } = purchaseShopItem(shopItem, this.state.coins);
    if (!success) return;
    Audio.play('shop.buy');

    const oldCoins = this.state.coins;
    this.state.coins = newCoins;
    shopItem.sold = true;

    // Record paid price for sell-back floor
    if (!this.state.lastPaidPrices) this.state.lastPaidPrices = {};
    this.state.lastPaidPrices[shopItem.item.id] = shopItem.price;

    const existing = this.state.inventory.find(i => i.item.id === shopItem.item.id);
    if (existing) existing.quantity++;
    else this.state.inventory.push({ item: shopItem.item, quantity: 1 });
    this.state.runStats.itemsCollected++;

    const coinEl = this.container.querySelector<HTMLElement>('#shop-coin-display');
    if (coinEl) animateCoinGain(coinEl, oldCoins, newCoins);

    showToast(`${shopItem.item.name} purchased!`, 'success');
    this.refreshShop();
    this.refreshInventory();
  }

  private buyVoucher(idx: number): void {
    const sv = this.state.shopVouchers?.[idx];
    if (!sv || sv.sold) return;
    const def = getVoucherById(sv.voucherId);
    if (!def) return;
    if (!canAfford(sv.price, this.state.coins)) {
      showToast('Not enough coins!', 'error');
      Audio.play('shop.unaffordable');
      return;
    }
    const oldCoins = this.state.coins;
    this.state.coins -= sv.price;
    sv.sold = true;
    Audio.play('shop.voucher');
    if (!this.state.vouchers) this.state.vouchers = [];
    if (!this.state.vouchers.includes(sv.voucherId)) this.state.vouchers.push(sv.voucherId);

    const coinEl = this.container.querySelector<HTMLElement>('#shop-coin-display');
    if (coinEl) animateCoinGain(coinEl, oldCoins, this.state.coins);

    // Immediate effect: Overstock → re-roll shop items with new voucher
    if (sv.voucherId === 'overstock') {
      this.state.shopItems = rerollShop(this.state.wave, [], this.state.vouchers, { excludeConsumables: !!this.state.deckMods?.shopExcludeConsumables });
    }
    // Immediate effect: Grabber → unlock slot 2 for every current team member
    if (sv.voucherId === 'grabber') {
      this.state.team.forEach(mon => {
        if (mon.itemSlots?.[1] && !mon.itemSlots[1].unlocked) mon.itemSlots[1].unlocked = true;
      });
      this.refreshTeamList();
    }
    // Immediate effect: Held Slot Charter → unlock the next locked slot for every Pokémon
    if (sv.voucherId === 'held_slot_charter') {
      const unlockNext = (mon: BattlePokemon) => {
        if (!mon.itemSlots) return;
        const nextLocked = mon.itemSlots.findIndex(s => !s.unlocked);
        if (nextLocked >= 0) mon.itemSlots[nextLocked].unlocked = true;
      };
      this.state.team.forEach(unlockNext);
      this.state.pc.forEach(unlockNext);
      this.refreshTeamList();
    }

    showToast(`${def.name} activated!`, 'success');
    this.refreshShop();
  }

  private buyAndOpenPack(idx: number): void {
    const sp = this.state.shopPacks?.[idx];
    if (!sp || sp.sold) return;
    const def = getPackById(sp.packId);
    if (!def) return;
    if (!sp.free && !canAfford(sp.price, this.state.coins)) {
      showToast('Not enough coins!', 'error');
      Audio.play('shop.unaffordable');
      return;
    }
    if (!sp.free) {
      const oldCoins = this.state.coins;
      this.state.coins -= sp.price;
      const coinEl = this.container.querySelector<HTMLElement>('#shop-coin-display');
      if (coinEl) animateCoinGain(coinEl, oldCoins, this.state.coins);
    }
    sp.sold = true;
    Audio.play('shop.buy');
    this.refreshShop();
    this.openPackModal(idx, def);
  }

  private rollRarityForPack(def: BoosterPack): Rarity {
    const floor = def.minRarity ?? 'common';
    const order: Rarity[] = ['common', 'rare', 'epic', 'legendary'];
    const minIdx = order.indexOf(floor);
    // Upward-skew roll
    const r = Math.random();
    let bumpIdx = minIdx;
    if (r < 0.1 && minIdx < 3) bumpIdx = Math.min(3, minIdx + 2);
    else if (r < 0.45 && minIdx < 3) bumpIdx = Math.min(3, minIdx + 1);
    return order[bumpIdx];
  }

  private generatePackOptions(def: BoosterPack): Array<{ kind: 'item'; item: Item } | { kind: 'perk'; perk: Perk }> {
    const opts: Array<{ kind: 'item'; item: Item } | { kind: 'perk'; perk: Perk }> = [];
    const usedItemIds = new Set<string>();
    const ownedPerkIds = new Set(this.state.activePerks.map(p => p.id));

    const makeItemOption = (filter: (it: Item) => boolean): Item | null => {
      for (let tries = 0; tries < 6; tries++) {
        const rarity = this.rollRarityForPack(def);
        const pool = ALL_ITEMS.filter(it => it.rarity === rarity && !usedItemIds.has(it.id) && !it.rewardOnly && filter(it));
        if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
      }
      const fallback = ALL_ITEMS.filter(it => !usedItemIds.has(it.id) && !it.rewardOnly && filter(it));
      return fallback.length ? fallback[Math.floor(Math.random() * fallback.length)] : null;
    };

    const makePerkOption = (): Perk | null => {
      for (let tries = 0; tries < 6; tries++) {
        const rarity = this.rollRarityForPack(def);
        const pool = ALL_PERKS.filter(p => p.rarity === rarity && !ownedPerkIds.has(p.id));
        if (pool.length) {
          const pick = pool[Math.floor(Math.random() * pool.length)];
          ownedPerkIds.add(pick.id);
          return pick;
        }
      }
      return null;
    };

    for (let i = 0; i < def.options; i++) {
      if (def.contents === 'held_items') {
        const it = makeItemOption(x => x.itemType === 'held');
        if (it) { usedItemIds.add(it.id); opts.push({ kind: 'item', item: it }); }
      } else if (def.contents === 'consumables') {
        const it = makeItemOption(x => x.itemType === 'consumable');
        if (it) { usedItemIds.add(it.id); opts.push({ kind: 'item', item: it }); }
      } else if (def.contents === 'perks') {
        const p = makePerkOption();
        if (p) opts.push({ kind: 'perk', perk: p });
      } else if (def.contents === 'mixed') {
        const coin = Math.random();
        if (coin < 0.45) {
          const it = makeItemOption(x => x.itemType === 'held');
          if (it) { usedItemIds.add(it.id); opts.push({ kind: 'item', item: it }); continue; }
        }
        if (coin < 0.8) {
          const it = makeItemOption(x => x.itemType === 'consumable');
          if (it) { usedItemIds.add(it.id); opts.push({ kind: 'item', item: it }); continue; }
        }
        const p = makePerkOption();
        if (p) { opts.push({ kind: 'perk', perk: p }); continue; }
        const it = makeItemOption(() => true);
        if (it) { usedItemIds.add(it.id); opts.push({ kind: 'item', item: it }); }
      } else if (def.contents === 'spectral') {
        // Spectral: high-rarity held items, curse applied on pick
        const it = makeItemOption(x => x.itemType === 'held' && (x.rarity === 'epic' || x.rarity === 'legendary'));
        if (it) { usedItemIds.add(it.id); opts.push({ kind: 'item', item: it }); }
      }
    }
    return opts;
  }

  private openPackModal(packIdx: number, def: BoosterPack): void {
    this.openingPackIndex = packIdx;
    const magicTrick = this.state.vouchers?.includes('magic_trick');
    const augmented: BoosterPack = magicTrick
      ? { ...def, options: def.options + 1 }
      : def;
    this.packDef = augmented;
    this.packOptions = this.generatePackOptions(augmented);
    this.packMaxPicks = Math.min(def.pick, this.packOptions.length);
    this.packPicksRemaining = this.packMaxPicks;
    this.packPickedKeys = new Set();
    this.packPickedIdx = [];
    this.packRevealed = new Set();
    this.packSpectralCurse = def.contents === 'spectral' ? pickRandomCurse() : null;
    this.packPhase = 'idle';
    this.packFanEntered = false;
    this.clearPackTimers();

    const overlay = (this.portaledPackModal ?? this.container.querySelector<HTMLElement>('#pack-modal'))!;
    overlay.classList.remove('hidden');
    this.renderPackOverlay();
  }

  private clearPackTimers(): void {
    this.packTimers.forEach(t => window.clearTimeout(t));
    this.packTimers = [];
  }

  private optionLabel(opt: { kind: 'item'; item: Item } | { kind: 'perk'; perk: Perk }): { name: string; eff: string; rarity: string; type: string; iconHtml: string; tier: number } {
    const rarityTier: Record<string, number> = { common: 1, rare: 3, epic: 4, legendary: 5 };
    if (opt.kind === 'item') {
      return {
        name: opt.item.name,
        eff: opt.item.description,
        rarity: opt.item.rarity ?? 'common',
        type: opt.item.itemType === 'held' ? 'held' : 'consumable',
        iconHtml: itemArt(opt.item),
        tier: rarityTier[opt.item.rarity ?? 'common'] ?? 1,
      };
    }
    return {
      name: opt.perk.name,
      eff: opt.perk.description,
      rarity: opt.perk.rarity ?? 'rare',
      type: 'perk',
      iconHtml: '<span class="po-c-icon-glyph">◈</span>',
      tier: rarityTier[opt.perk.rarity ?? 'rare'] ?? 3,
    };
  }

  private renderPackOverlay(): void {
    const overlay = (this.portaledPackModal ?? this.container.querySelector<HTMLElement>('#pack-modal'));
    if (!overlay || !this.packDef) return;
    const def = this.packDef;
    const phase = this.packPhase;
    const cards = this.packOptions;
    const total = cards.length;

    let subText = '';
    if (phase === 'idle')  subText = `Tap the pack to tear it open. Pick ${this.packMaxPicks} of ${total}.`;
    else if (phase === 'shake') subText = 'Hold on…';
    else if (phase === 'tear')  subText = 'Tearing the seal…';
    else if (phase === 'fan')   subText = `Revealed <b>${this.packRevealed.size}</b> / ${total} · Pick <b>${this.packPickedIdx.length}</b> / ${this.packMaxPicks}`;
    else if (phase === 'done')  subText = 'Adding to satchel…';

    const curseLine = this.packSpectralCurse
      ? `<div class="po-curse-line"><span class="pack-curse">Side-effect: ${this.packSpectralCurse.name} — ${this.packSpectralCurse.description}</span></div>`
      : '';

    const titleParts = `The <em>${PACK_SHORT_TITLE[def.id].toUpperCase()}</em> Booster`;

    const showPack = phase === 'idle' || phase === 'shake' || phase === 'tear';
    const showFan  = phase === 'fan'  || phase === 'done';

    const packArt = this.renderPackArt(def.id, { size: 'lg', price: null, pickN: def.pick, outOf: total });

    let stage = '';
    if (showPack) {
      const wrapCls = `po-pack-wrap ${phase}`;
      const tapPrompt = phase === 'idle'
        ? `<div class="po-tap-prompt"><span>▶ TAP TO OPEN</span></div>`
        : '';
      const debris = phase === 'tear'
        ? `<div class="po-rip">${Array.from({ length: 18 }).map(() => {
            const dx = (Math.random() - 0.5) * 320;
            const dy = -Math.random() * 260 - 80;
            const r = (Math.random() - 0.5) * 360;
            const d = Math.random() * 0.2;
            return `<span style="--dx:${dx}px;--dy:${dy}px;--r:${r}deg;--d:${d}s"></span>`;
          }).join('')}</div>`
        : '';
      stage = `
        <div class="${wrapCls}" id="po-pack-wrap">
          ${packArt}
          ${tapPrompt}
          <div class="po-pack-top">${packArt}</div>
          <div class="po-pack-bot">${packArt}</div>
          ${debris}
        </div>
      `;
    } else if (showFan) {
      const mid = (total - 1) / 2;
      const spread = Math.min(44, 18 * total);
      const cardsHtml = cards.map((opt, i) => {
        const offset = i - mid;
        const rot = offset * (spread / total);
        const lift = Math.abs(offset) * 6;
        const isRevealed = this.packRevealed.has(i);
        const isPicked = this.packPickedIdx.includes(i);
        const slotCls = [
          'po-card-slot',
          isRevealed ? 'revealed' : '',
          isPicked ? 'picked' : '',
          phase === 'done' ? 'flyoff' : '',
        ].filter(Boolean).join(' ');
        const meta = this.optionLabel(opt);
        return `
          <div class="${slotCls}" data-pack-card="${i}"
               style="--rot:${rot}deg;--lift:${lift}px;--i:${i};animation-delay:${i * 90}ms">
            <div class="po-card-flip">
              <div class="po-card-back">
                ${this.renderPackArt(def.id, { size: 'sm', price: null, pickN: def.pick, outOf: total })}
              </div>
              <div class="po-card-front type-${meta.type}">
                <div class="po-c-head">
                  <span class="po-c-type">${meta.type.toUpperCase()}</span>
                  <span class="po-c-rarity">${'✦'.repeat(meta.tier)}</span>
                </div>
                <div class="po-c-art">
                  <div class="po-c-art-frame">
                    <span class="po-c-icon">${meta.iconHtml}</span>
                  </div>
                  <div class="po-c-art-shine"></div>
                </div>
                <div class="po-c-name">${meta.name}</div>
                <div class="po-c-eff">${meta.eff}</div>
                <div class="po-c-footer">
                  <span class="po-c-tier">${meta.rarity.toUpperCase()}</span>
                  <span class="po-c-num">#${String(i + 1).padStart(2, '0')}/${String(total).padStart(2, '0')}</span>
                </div>
                ${isPicked ? '<div class="po-c-picked-stamp">KEPT</div>' : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');
      const fanCls = this.packFanEntered ? 'po-fan' : 'po-fan is-entering';
      stage = `<div class="${fanCls}">${cardsHtml}</div>`;
      this.packFanEntered = true;
    }

    const canConfirm = this.packPickedIdx.length === this.packMaxPicks;
    const actions = phase === 'fan'
      ? `
        <div class="po-actions">
          <button class="ink-btn ghost" id="po-reveal-all">Reveal all</button>
          <button class="ink-btn ${canConfirm ? 'primary' : 'ghost'}" id="po-confirm" ${canConfirm ? '' : 'disabled'}>
            ${canConfirm
              ? `▶ Confirm pick${this.packMaxPicks > 1 ? 's' : ''}`
              : `Pick ${this.packMaxPicks - this.packPickedIdx.length} more`}
          </button>
        </div>
      `
      : '';

    const closeBtn = phase === 'idle'
      ? `<button class="po-close" id="po-close">✕ BACK</button>`
      : '';

    // Preserve the swipe-snap scroll position across re-renders. Without
    // this, every reveal/pick re-runs innerHTML and the scroll-snapped fan
    // jumps back to the centre, forcing the player to swipe again.
    const prevFan = overlay.querySelector<HTMLElement>('.po-fan');
    if (prevFan) this.packFanScrollLeft = prevFan.scrollLeft;

    overlay.innerHTML = `
      <div class="po-halftone"></div>
      <div class="po-vignette"></div>
      ${closeBtn}
      <div class="po-head">
        <div class="po-kicker">— Opening —</div>
        <h1 class="po-title">${titleParts}</h1>
        <div class="po-sub">${subText}</div>
        ${curseLine}
      </div>
      <div class="po-stage">${stage}</div>
      ${actions}
    `;

    if (showFan && this.packFanScrollLeft > 0) {
      const newFan = overlay.querySelector<HTMLElement>('.po-fan');
      if (newFan) {
        // Skip scroll-snap during programmatic restore so the browser
        // doesn't fight us by re-snapping mid-frame.
        const prevSnap = newFan.style.scrollSnapType;
        newFan.style.scrollSnapType = 'none';
        newFan.scrollLeft = this.packFanScrollLeft;
        requestAnimationFrame(() => {
          newFan.style.scrollSnapType = prevSnap;
        });
      }
    }
  }

  private startPackTear(): void {
    if (this.packPhase !== 'idle') return;
    this.packPhase = 'shake';
    this.renderPackOverlay();
    this.packTimers.push(window.setTimeout(() => {
      this.packPhase = 'tear';
      Audio.play('shop.pack_open');
      this.renderPackOverlay();
    }, 500));
    this.packTimers.push(window.setTimeout(() => {
      this.packPhase = 'fan';
      this.packFanEntered = false;
      this.renderPackOverlay();
    }, 1300));
  }

  private toggleCardPick(i: number): void {
    if (this.packPhase !== 'fan') return;
    if (!this.packRevealed.has(i)) {
      this.packRevealed.add(i);
      this.renderPackOverlay();
      return;
    }
    const pos = this.packPickedIdx.indexOf(i);
    if (pos >= 0) {
      this.packPickedIdx.splice(pos, 1);
    } else if (this.packPickedIdx.length < this.packMaxPicks) {
      this.packPickedIdx.push(i);
    }
    this.renderPackOverlay();
  }

  private revealAllCards(): void {
    if (this.packPhase !== 'fan') return;
    this.packOptions.forEach((_, i) => this.packRevealed.add(i));
    this.renderPackOverlay();
  }

  private confirmPackPicks(): void {
    if (this.packPhase !== 'fan') return;
    if (this.packPickedIdx.length !== this.packMaxPicks) return;

    const keptNames: string[] = [];
    for (const idx of this.packPickedIdx) {
      const opt = this.packOptions[idx];
      if (!opt) continue;
      if (opt.kind === 'item') {
        const existing = this.state.inventory.find(inv => inv.item.id === opt.item.id);
        if (existing) existing.quantity++;
        else this.state.inventory.push({ item: opt.item, quantity: 1 });
        this.state.runStats.itemsCollected++;
        keptNames.push(opt.item.name);
      } else {
        this.state.activePerks.push(opt.perk);
        this.state.runStats.perksCollected++;
        keptNames.push(opt.perk.name);
      }
    }

    if (this.packSpectralCurse) this.applySpectralCurse(this.packSpectralCurse);

    this.packPhase = 'done';
    this.renderPackOverlay();
    this.packTimers.push(window.setTimeout(() => {
      this.closePackModal();
      if (keptNames.length) {
        showToast(`Kept: ${keptNames.join(' · ')}`, 'success');
      }
      this.refreshInventory();
      this.refreshTeamList();
    }, 700));
  }

  private applySpectralCurse(curse: SpectralCurse): void {
    if (curse.id === 'frayed_edge') {
      this.state.team.forEach(mon => {
        mon.maxBattleHp = Math.max(1, Math.floor(mon.maxBattleHp * 0.9));
        mon.battleHp = Math.min(mon.battleHp, mon.maxBattleHp);
      });
    } else if (curse.id === 'heavy_load') {
      this.state.team.forEach(mon => {
        mon.effectiveStats.speed = Math.max(1, Math.floor(mon.effectiveStats.speed * 0.9));
      });
    } else if (curse.id === 'blood_pact') {
      const old = this.state.coins;
      this.state.coins = Math.max(0, this.state.coins - 50);
      const el = this.container.querySelector<HTMLElement>('#shop-coin-display');
      if (el) animateCoinGain(el, old, this.state.coins);
    } else if (curse.id === 'time_debt') {
      (this.state as any).curseTimeDebtWaves = ((this.state as any).curseTimeDebtWaves ?? 0) + 2;
    }
    showToast(`Curse: ${curse.name} — ${curse.description}`, 'error');
    tryUnlockAchievement(this.state.playerName, 'spectral_dabbler');
  }

  private closePackModal(): void {
    this.clearPackTimers();
    const modal = (this.portaledPackModal ?? this.container.querySelector<HTMLElement>('#pack-modal'));
    if (modal) {
      modal.classList.add('hidden');
      modal.innerHTML = '';
    }
    this.openingPackIndex = null;
    this.packOptions = [];
    this.packPicksRemaining = 0;
    this.packPickedKeys = new Set();
    this.packPickedIdx = [];
    this.packRevealed = new Set();
    this.packSpectralCurse = null;
    this.packDef = null;
    this.packPhase = 'idle';
    this.packMaxPicks = 0;
    this.packFanScrollLeft = 0;
    this.refreshTeamList();
  }

  private rerollShop(): void {
    const hasSurplus = this.state.vouchers?.includes('reroll_surplus');
    const surplusFree = hasSurplus && !this.state.freeRerollUsed;
    const perkFreeLeft = (this.state.freeRerollsLeft ?? 0) > 0;
    const freeNow = surplusFree || perkFreeLeft;
    const cost = getRerollCost(this.state.wave);
    if (!freeNow && !canAfford(cost, this.state.coins)) {
      showToast('Not enough coins to reroll!', 'error');
      Audio.play('shop.unaffordable');
      return;
    }
    Audio.play('shop.reroll');
    const oldCoins = this.state.coins;
    if (!freeNow) {
      this.state.coins -= cost;
    } else if (surplusFree) {
      this.state.freeRerollUsed = true;
    } else {
      this.state.freeRerollsLeft = Math.max(0, (this.state.freeRerollsLeft ?? 0) - 1);
    }
    this.state.shopItems = rerollShop(this.state.wave, [], this.state.vouchers ?? [], { excludeConsumables: !!this.state.deckMods?.shopExcludeConsumables });
    const coinEl = this.container.querySelector<HTMLElement>('#shop-coin-display');
    if (coinEl && !freeNow) animateCoinGain(coinEl, oldCoins, this.state.coins);
    this.refreshShop();
    showToast(freeNow ? 'Free reroll (Surplus)!' : 'Shop rerolled!', 'info');
  }

  private openAssignModal(invIdx: number): void {
    const inv = this.state.inventory[invIdx];
    if (!inv || inv.item.itemType !== 'held') return;
    this.assigningItem = inv.item;
    this.selectedInventoryIndex = invIdx;

    const modal = this.container.querySelector('#assign-modal')!;
    const titleEl = modal.querySelector('#assign-modal-title')!;
    const listEl = modal.querySelector('#assign-team-list')!;

    titleEl.textContent = `Assign "${inv.item.name}"`;

    const rarityMeta = inv.item.rarity ? `· ${inv.item.rarity} ` : '';
    listEl.innerHTML = `
      <div class="modal-item-preview">
        <div class="mip-glyph">${itemArt(inv.item)}</div>
        <div>
          <div class="mip-name">${inv.item.name}</div>
          <div class="mip-meta">· Held Item ${rarityMeta}·</div>
          <div class="mip-desc">${inv.item.description}</div>
        </div>
      </div>
      ${this.state.team.map((mon, i) => {
        const hpPct = Math.max(0, Math.min(100, (mon.battleHp / mon.maxBattleHp) * 100));
        const hpClass = hpPct > 50 ? 'high' : hpPct > 20 ? 'mid' : 'low';
        const slotsHtml = (mon.itemSlots ?? []).map((slot, si) => {
          if (!slot.unlocked) {
            const cost = SLOT_UNLOCK_COSTS[si];
            const affordable = this.state.coins >= cost;
            return `
              <button class="assign-slot-btn locked ${affordable ? '' : 'cant-afford'}"
                data-unlock-slot="${si}" data-assign-pokemon="${i}">
                <span class="asb-glyph">◈</span>
                <span class="asb-label">Slot ${si + 1}</span>
                <span class="asb-action">${cost}¢ unlock</span>
              </button>`;
          } else if (slot.item) {
            const label = slot.item.name.length > 9 ? slot.item.name.slice(0, 8) + '…' : slot.item.name;
            return `
              <button class="assign-slot-btn filled"
                data-assign-slot="${si}" data-assign-pokemon="${i}">
                ${itemArt(slot.item, 'asb-glyph')}
                <span class="asb-label">${label}</span>
                <span class="asb-action">⇄ replace</span>
              </button>`;
          } else {
            return `
              <button class="assign-slot-btn empty"
                data-assign-slot="${si}" data-assign-pokemon="${i}">
                <span class="asb-glyph">+</span>
                <span class="asb-label">Slot ${si + 1}</span>
                <span class="asb-action">equip</span>
              </button>`;
          }
        }).join('');

        return `
          <div class="assign-pokemon-section">
            <div class="assign-pokemon-header">
              <img src="${mon.sprite}" class="assign-pokemon-sprite" alt="${mon.displayName}" />
              <div style="flex:1;min-width:0">
                <div class="assign-pokemon-name-row">
                  <div class="assign-pokemon-name">${mon.displayName}</div>
                  <span class="stc-types">${renderTypeBadges(mon.types ?? [])}</span>
                </div>
                <div class="assign-pokemon-sub">Lv ${mon.level} · ${Math.max(0, mon.battleHp)}/${mon.maxBattleHp} HP</div>
                <div class="stc-hp-bar" style="margin-top:5px">
                  <div class="stc-hp-fill ${hpClass}" style="width:${hpPct}%"></div>
                </div>
              </div>
            </div>
            <div class="assign-pokemon-slots">${slotsHtml}</div>
          </div>
        `;
      }).join('')}
    `;

    modal.classList.remove('hidden');
  }

  private openPickItemModal(teamIdx: number, slotIdx: number): void {
    const heldItems = this.state.inventory.filter(inv => inv.item.itemType === 'held');
    if (heldItems.length === 0) {
      showToast('No held items in inventory to equip.', 'info');
      return;
    }

    const mon = this.state.team[teamIdx];
    if (!mon) return;

    const modal = this.container.querySelector('#pick-item-modal')!;
    const titleEl = modal.querySelector('#pick-item-title')!;
    const listEl = modal.querySelector('#pick-item-list')!;

    titleEl.textContent = `Slot ${slotIdx + 1} — ${mon.displayName}`;

    listEl.innerHTML = heldItems.map(inv => {
      const realIdx = this.state.inventory.indexOf(inv);
      const rarityBadge = inv.item.rarity ? `<span style="font-family:var(--font-mono);font-size:9px;letter-spacing:.15em;text-transform:uppercase;color:var(--ink-4)">${inv.item.rarity}</span>` : '';
      return `
        <div class="pick-item-row">
          <div class="pick-item-glyph">${itemArt(inv.item)}</div>
          <div class="pick-item-info">
            <div class="pick-item-name">${inv.item.name} ${rarityBadge}</div>
            <div class="pick-item-desc">${inv.item.description}</div>
          </div>
          <button class="ink-btn ghost"
            data-pick-item="${realIdx}"
            data-pick-team="${teamIdx}"
            data-pick-slot="${slotIdx}">
            Equip →
          </button>
        </div>
      `;
    }).join('');

    modal.classList.remove('hidden');
  }

  private assignHeldItemToSlot(teamIdx: number, slotIdx: number): void {
    if (!this.assigningItem) return;
    const mon = this.state.team[teamIdx];
    if (!mon || !mon.itemSlots[slotIdx]?.unlocked) return;

    const oldItem = mon.itemSlots[slotIdx].item;
    if (oldItem) {
      const existing = this.state.inventory.find(i => i.item.id === oldItem.id);
      if (existing) existing.quantity++;
      else this.state.inventory.push({ item: oldItem, quantity: 1 });
    }

    const newItem = this.assigningItem;
    mon.itemSlots[slotIdx].item = newItem;
    if (slotIdx === 0) mon.heldItem = newItem;

    const invItem = this.state.inventory[this.selectedInventoryIndex];
    if (invItem) {
      invItem.quantity--;
      if (invItem.quantity <= 0) this.state.inventory.splice(this.selectedInventoryIndex, 1);
    }

    const newMon = toBattlePokemon({ ...mon }, this.state.activePerks);
    newMon.battleHp = Math.min(mon.battleHp, newMon.maxBattleHp);
    newMon.battleStatus = mon.battleStatus;
    newMon.xp = mon.xp;
    newMon.xpToNextLevel = mon.xpToNextLevel;
    this.state.team[teamIdx] = newMon;

    this.assigningItem = null;
    this.selectedInventoryIndex = -1;
    this.container.querySelector('#assign-modal')?.classList.add('hidden');

    showToast(`${mon.displayName} equipped ${newItem.name} in Slot ${slotIdx + 1}!`, 'success');
    this.refreshTeamList();
    this.refreshInventory();
  }

  private static readonly GLOBAL_ITEMS = new Set([
    'star_piece', 'big_nugget', 'sacred_ash', 'max_elixir', 'team_vitals', 'reroll_token',
  ]);

  private openUseModal(invIdx: number): void {
    const inv = this.state.inventory[invIdx];
    if (!inv || inv.item.itemType !== 'consumable') return;
    this.selectedInventoryIndex = invIdx;

    if (ShopScreen.GLOBAL_ITEMS.has(inv.item.id)) {
      this.useGlobalConsumable();
      return;
    }
    // Planet Card — boost type level run-wide
    if (inv.item.effect.planetCardType) {
      const t = inv.item.effect.planetCardType;
      if (!this.state.typeLevels) this.state.typeLevels = {};
      const cur = this.state.typeLevels[t] ?? 0;
      const grant = this.state.vouchers?.includes('type_atlas') ? 2 : 1;
      this.state.typeLevels[t] = cur + grant;
      showToast(`${inv.item.name} used! ${t} Lv.${cur + grant}`, 'success');
      this.consumeInventoryItem();
      this.refreshInventory();
      return;
    }
    if (inv.item.id === 'evolution_stone') {
      this.openEvolutionStoneModal(invIdx);
      return;
    }

    const modal = this.container.querySelector('#use-modal')!;
    const titleEl = modal.querySelector('#use-modal-title')!;
    const listEl = modal.querySelector('#use-team-list')!;

    titleEl.textContent = `Use "${inv.item.name}" on:`;

    const isRevive = inv.item.id === 'revive' || inv.item.id === 'max_revive';
    const team = isRevive
      ? this.state.team.filter(m => m.battleHp <= 0)
      : this.state.team.filter(m => m.battleHp > 0);

    listEl.innerHTML = team.map(mon => {
      const realIdx = this.state.team.indexOf(mon);
      const hpPct = Math.max(0, Math.min(100, (mon.battleHp / mon.maxBattleHp) * 100));
      const hpClass = hpPct > 50 ? 'high' : hpPct > 20 ? 'mid' : 'low';
      return `
        <div class="assign-pokemon-section" data-use-index="${realIdx}">
          <div class="assign-pokemon-header">
            <img src="${mon.sprite}" class="assign-pokemon-sprite" alt="${mon.displayName}" />
            <div style="flex:1;min-width:0">
              <div class="assign-pokemon-name">${mon.displayName}</div>
              <div class="assign-pokemon-sub">Lv ${mon.level} · ${Math.max(0, mon.battleHp)}/${mon.maxBattleHp} HP${mon.battleStatus ? ` · ${mon.battleStatus}` : ''}</div>
              <div class="stc-hp-bar" style="margin-top:5px">
                <div class="stc-hp-fill ${hpClass}" style="width:${hpPct}%"></div>
              </div>
            </div>
            <button class="ink-btn ghost" style="pointer-events:none;flex-shrink:0">Use →</button>
          </div>
        </div>
      `;
    }).join('') || '<p style="padding:1rem;color:var(--ink-3);font-family:var(--font-mono);font-size:11px;letter-spacing:.1em">No valid targets.</p>';

    modal.classList.remove('hidden');
  }

  private useGlobalConsumable(): void {
    const inv = this.state.inventory[this.selectedInventoryIndex];
    if (!inv) return;
    const { item } = inv;

    if (item.id === 'star_piece') {
      const old = this.state.coins;
      this.state.coins += 50;
      const el = this.container.querySelector<HTMLElement>('#shop-coin-display');
      if (el) animateCoinGain(el, old, this.state.coins);
      showToast('+50¢ from Star Piece!', 'success');
    } else if (item.id === 'big_nugget') {
      const old = this.state.coins;
      this.state.coins += 150;
      const el = this.container.querySelector<HTMLElement>('#shop-coin-display');
      if (el) animateCoinGain(el, old, this.state.coins);
      showToast('+150¢ from Big Nugget!', 'success');
    } else if (item.id === 'sacred_ash') {
      this.state.team.forEach(m => { m.battleHp = m.maxBattleHp; m.battleStatus = null; });
      showToast('Sacred Ash fully restored your team!', 'success');
    } else if (item.id === 'max_elixir') {
      this.state.team.forEach(m => m.moves.forEach(mv => { mv.pp = mv.maxPp; }));
      showToast('Max Elixir restored all PP for your team!', 'success');
    } else if (item.id === 'team_vitals') {
      this.state.team.forEach(m => {
        if (m.battleHp > 0) m.battleHp = Math.min(m.maxBattleHp, m.battleHp + Math.floor(m.maxBattleHp * 0.5));
      });
      showToast('Team Vitals healed 50% HP for your whole team!', 'success');
    } else if (item.id === 'reroll_token') {
      this.state.shopItems = rerollShop(this.state.wave, [], this.state.vouchers ?? [], { excludeConsumables: !!this.state.deckMods?.shopExcludeConsumables });
      this.refreshShop();
      showToast('Shop rerolled (free)!', 'info');
    }

    this.consumeInventoryItem();
    this.refreshTeamList();
    this.refreshInventory();
  }

  private openEvolutionStoneModal(invIdx: number): void {
    const modal = this.container.querySelector('#use-modal')!;
    const titleEl = modal.querySelector('#use-modal-title')!;
    const listEl = modal.querySelector('#use-team-list')!;

    titleEl.textContent = 'Evolve which Pokémon?';
    const candidates = this.state.team.filter(m => !m.isFullyEvolved && m.nextEvolutionId !== null);

    listEl.innerHTML = candidates.map(mon => {
      const realIdx = this.state.team.indexOf(mon);
      return `
        <div class="assign-pokemon-section" data-use-index="${realIdx}">
          <div class="assign-pokemon-header">
            <img src="${mon.sprite}" class="assign-pokemon-sprite" alt="${mon.displayName}" />
            <div style="flex:1;min-width:0">
              <div class="assign-pokemon-name">${mon.displayName}</div>
              <div class="assign-pokemon-sub">Lv ${mon.level} · Can evolve</div>
            </div>
            <button class="ink-btn ghost" style="pointer-events:none;flex-shrink:0">Evolve →</button>
          </div>
        </div>
      `;
    }).join('') || '<p style="padding:1rem;color:var(--ink-3);font-family:var(--font-mono);font-size:11px;letter-spacing:.1em">No Pokémon can evolve right now.</p>';

    modal.classList.remove('hidden');
  }

  private useConsumable(teamIdx: number): void {
    const inv = this.state.inventory[this.selectedInventoryIndex];
    if (!inv) return;
    const mon = this.state.team[teamIdx];
    if (!mon) return;

    const item = inv.item;
    const effect = item.effect;

    if (item.id === 'evolution_stone') {
      this.container.querySelector('#use-modal')?.classList.add('hidden');
      this.evolveWithStone(teamIdx);
      return;
    }

    if (item.id === 'ether') {
      mon.moves.forEach(m => { m.pp = m.maxPp; });
      showToast(`${mon.displayName}'s PP fully restored!`, 'success');
      this.consumeInventoryItem();
      this.container.querySelector('#use-modal')?.classList.add('hidden');
      this.refreshTeamList();
      this.refreshInventory();
      return;
    }

    if (item.id === 'item_pouch') {
      if (mon.itemSlots[1] && !mon.itemSlots[1].unlocked) {
        mon.itemSlots[1].unlocked = true;
        showToast(`Slot 2 unlocked for ${mon.displayName}!`, 'success');
      } else {
        showToast(`${mon.displayName} already has Slot 2 unlocked!`, 'info');
      }
      this.consumeInventoryItem();
      this.container.querySelector('#use-modal')?.classList.add('hidden');
      this.refreshTeamList();
      this.refreshInventory();
      return;
    }

    if (effect.permanentStatBoost) {
      const boost = effect.permanentStatBoost;
      if (boost.attack) mon.baseStats.attack = Math.floor(mon.baseStats.attack * 1.1);
      if (boost.defense) mon.baseStats.defense = Math.floor(mon.baseStats.defense * 1.1);
      if (boost.speed) mon.baseStats.speed = Math.floor(mon.baseStats.speed * 1.1);
      if (boost.spAtk) mon.baseStats.spAtk = Math.floor(mon.baseStats.spAtk * 1.1);
      if (boost.spDef) mon.baseStats.spDef = Math.floor(mon.baseStats.spDef * 1.1);
      if (boost.hp) mon.baseStats.hp = Math.floor(mon.baseStats.hp * 1.1);
      const boosted = toBattlePokemon({ ...mon }, this.state.activePerks);
      boosted.battleHp = Math.min(Math.floor(mon.battleHp * 1.1), boosted.maxBattleHp);
      boosted.battleStatus = mon.battleStatus;
      boosted.xp = mon.xp;
      boosted.xpToNextLevel = mon.xpToNextLevel;
      this.state.team[teamIdx] = boosted;
      showToast(`${mon.displayName}'s stats permanently boosted!`, 'success');
      this.consumeInventoryItem();
      this.container.querySelector('#use-modal')?.classList.add('hidden');
      this.refreshTeamList();
      this.refreshInventory();
      return;
    }

    if (effect.healPercent && item.id !== 'team_vitals') {
      const heal = Math.floor(mon.maxBattleHp * effect.healPercent);
      mon.battleHp = Math.min(mon.maxBattleHp, mon.battleHp + heal);
      showToast(`${mon.displayName} restored ${heal} HP!`, 'success');
    } else if (effect.healAmount) {
      mon.battleHp = Math.min(mon.maxBattleHp, mon.battleHp + effect.healAmount);
      showToast(`${mon.displayName} restored ${effect.healAmount} HP!`, 'success');
    }

    if (effect.curesStatus) {
      if (effect.curesStatus === 'any' || effect.curesStatus === mon.battleStatus) {
        mon.battleStatus = null;
        showToast(`${mon.displayName}'s status condition cured!`, 'success');
      }
    }

    if (item.id === 'rare_candy') {
      const newLevel = Math.min(100, mon.level + 1);
      const leveled = toBattlePokemon({ ...mon, level: newLevel }, this.state.activePerks);
      const hpGain = Math.max(0, leveled.maxBattleHp - mon.maxBattleHp);
      leveled.battleHp = Math.min(leveled.maxBattleHp, mon.battleHp + hpGain);
      leveled.battleStatus = mon.battleStatus;
      this.state.team[teamIdx] = leveled;
      showToast(`${mon.displayName} reached Lv.${newLevel}!`, 'success');
      if (!leveled.isFullyEvolved && leveled.nextEvolutionId !== null && leveled.evolutionLevel !== null && newLevel >= leveled.evolutionLevel) {
        leveled.pendingEvolution = true;
        this.consumeInventoryItem();
        this.container.querySelector('#use-modal')?.classList.add('hidden');
        this.processPendingEvolutions();
        this.refreshTeamList();
        this.refreshInventory();
        return;
      }
    }

    const statBoostMap: Record<string, keyof typeof mon.statStages> = {
      'x_attack': 'attack', 'x_sp_atk': 'spAtk', 'x_speed': 'speed',
    };
    const boostKey = statBoostMap[item.id];
    if (boostKey) {
      mon.statStages[boostKey] = Math.min(6, mon.statStages[boostKey] + 2);
      showToast(`${mon.displayName}'s ${boostKey} sharply rose!`, 'success');
    }

    this.consumeInventoryItem();
    this.container.querySelector('#use-modal')?.classList.add('hidden');
    this.refreshTeamList();
    this.refreshInventory();
  }

  private consumeInventoryItem(): void {
    const inv = this.state.inventory[this.selectedInventoryIndex];
    if (!inv) return;
    inv.quantity--;
    if (inv.quantity <= 0) this.state.inventory.splice(this.selectedInventoryIndex, 1);
    this.selectedInventoryIndex = -1;
  }

  private async evolveWithStone(teamIdx: number): Promise<void> {
    const mon = this.state.team[teamIdx];
    if (!mon || mon.isFullyEvolved || !mon.nextEvolutionId) {
      showToast('This Pokémon cannot evolve!', 'error');
      return;
    }
    try {
      const evolved = await fetchPokemon(mon.nextEvolutionId, mon.level);
      const evolvedBattle = toBattlePokemon(
        {
          ...evolved,
          itemSlots: mon.itemSlots,
          heldItem: mon.heldItem,
          moves: mon.moves,
          learnedMoveIds: mon.learnedMoveIds ?? mon.moves.map(m => m.id),
          learnsetPool: evolved.learnsetPool,
        },
        this.state.activePerks,
      );
      evolvedBattle.battleHp = Math.min(evolvedBattle.maxBattleHp, mon.battleHp);
      evolvedBattle.battleStatus = mon.battleStatus;
      evolvedBattle.xp = mon.xp;
      evolvedBattle.xpToNextLevel = xpForLevel(evolved.level);
      evolvedBattle.pendingEvolution = false;
      const evoLearned = await learnMovesForLevel(evolvedBattle);
      this.state.team[teamIdx] = evolvedBattle;
      await showEvolutionOverlay(mon, evolved, evoLearned);
      this.consumeInventoryItem();
      showToast(`${mon.displayName} evolved into ${evolved.displayName}! ◇`, 'success');
    } catch {
      showToast('Evolution failed — please try again.', 'error');
    }
    this.refreshTeamList();
    this.refreshInventory();
  }

  private performWaveEndCleanup(): void {
    const wave = this.state.wave;
    this.state.team.forEach(mon => {
      if (!mon.itemSlots) return;

      if (mon.focusSashBroken) {
        for (const slot of mon.itemSlots) {
          if (slot.item?.id === 'focus_sash') { slot.item = null; break; }
        }
        if (mon.heldItem?.id === 'focus_sash') mon.heldItem = null;
        mon.focusSashBroken = false;
      }

      if (mon.reviveHeartUsed) {
        for (const slot of mon.itemSlots) {
          if (slot.item?.id === 'revive_heart') { slot.item = null; break; }
        }
        if (mon.heldItem?.id === 'revive_heart') mon.heldItem = null;
      }

      if (monHasItem(mon, 'oran_berry')) {
        mon.usedBerries = (mon.usedBerries ?? []).filter(id => id !== 'oran_berry');
      }

      if (monHasItem(mon, 'sitrus_berry') && (mon.usedBerries ?? []).includes('sitrus_berry')) {
        if (wave - (mon.sitrusBerryLastUsedWave ?? 0) >= 3) {
          mon.usedBerries = (mon.usedBerries ?? []).filter(id => id !== 'sitrus_berry');
        }
      }

      if (monHasItem(mon, 'poke_bandage') && mon.battleHp > 0) {
        const heal = Math.floor(mon.maxBattleHp * 0.15);
        mon.battleHp = Math.min(mon.maxBattleHp, mon.battleHp + heal);
      }
    });

    // PC Box: tick revive countdown for fainted stored Pokémon.
    this.state.pc.forEach(mon => {
      if (mon.battleHp > 0) {
        mon.pcReviveCountdown = undefined;
        return;
      }
      if (mon.pcReviveCountdown == null) mon.pcReviveCountdown = PC_REVIVE_WAVES;
      mon.pcReviveCountdown -= 1;
      if (mon.pcReviveCountdown <= 0) {
        mon.battleHp = mon.maxBattleHp;
        mon.battleStatus = null;
        mon.battleStatusTurns = 0;
        mon.poisonCounter = 0;
        mon.isConfused = false;
        mon.confusionTurns = 0;
        mon.sleepTurns = 0;
        mon.pcReviveCountdown = undefined;
        showToast(`${mon.displayName} recovered in the PC!`, 'success');
      }
    });
  }

  private refreshShop(): void {
    const el = this.container.querySelector<HTMLElement>('#shop-items');
    if (el) el.innerHTML = this.renderBoosterPacks() + this.renderShopItems() + this.renderVouchers();
    this.refreshStash();
  }

  private refreshStash(): void {
    const panel = this.container.querySelector<HTMLElement>('#stash-panel');
    if (panel) panel.innerHTML = this.renderStash();
    const count = this.container.querySelector<HTMLElement>('#bag-btn-count');
    if (count) count.textContent = String(this.state.inventory.reduce((s, i) => s + i.quantity, 0));
  }

  private refreshTeamList(): void {
    const el = this.container.querySelector<HTMLElement>('#shop-team-list');
    if (el) {
      el.innerHTML = this.renderTeamList();
      this.attachTeamDragHandlers(el);
    }
  }

  private attachTeamDragHandlers(root: HTMLElement): void {
    let dragFromIdx: number | null = null;
    root.querySelectorAll<HTMLElement>('[data-team-drag]').forEach(card => {
      card.addEventListener('dragstart', e => {
        dragFromIdx = parseInt(card.dataset['teamDrag'] ?? '-1');
        card.classList.add('dragging');
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', String(dragFromIdx));
        }
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        root.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
      });
      card.addEventListener('dragover', e => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        card.classList.add('drag-over');
      });
      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over');
      });
      card.addEventListener('drop', e => {
        e.preventDefault();
        card.classList.remove('drag-over');
        const toIdx = parseInt(card.dataset['teamDrag'] ?? '-1');
        const fromIdx = dragFromIdx;
        dragFromIdx = null;
        if (fromIdx === null || fromIdx === toIdx || fromIdx < 0 || toIdx < 0) return;
        const [moved] = this.state.team.splice(fromIdx, 1);
        this.state.team.splice(toIdx, 0, moved);
        this.refreshTeamList();
      });
    });
  }

  private refreshInventory(): void {
    this.refreshStash();
  }

  private refreshPCList(): void {
    const strip = this.container.querySelector<HTMLElement>('#shop-pc-strip');
    if (strip) strip.innerHTML = this.renderPCStrip();
    // Hide strip panel entirely when PC empty
    const panel = this.container.querySelector<HTMLElement>('#pc-strip-panel');
    if (panel) panel.style.display = this.state.pc.length === 0 ? 'none' : '';
    const countEl = panel?.querySelector<HTMLElement>('.pc-strip-count');
    if (countEl) countEl.textContent = String(this.state.pc.length);
    // Refresh modal contents if mounted
    const list = this.container.querySelector<HTMLElement>('#pc-list-container');
    if (list) list.innerHTML = this.renderPCList();
    const depositList = this.container.querySelector<HTMLElement>('#pc-deposit-list');
    if (depositList) depositList.innerHTML = this.renderPCDepositList();
    const modalCount = this.container.querySelector<HTMLElement>('#pc-box-count');
    if (modalCount) modalCount.textContent = String(this.state.pc.length);
    const headerCount = this.container.querySelector<HTMLElement>('#pc-btn-count');
    if (headerCount) headerCount.textContent = String(this.state.pc.length);
    const hint = this.container.querySelector<HTMLElement>('#pc-box-hint');
    if (hint) {
      if (this.state.pc.length === 0) {
        hint.textContent = 'PC is empty.';
      } else {
        hint.textContent = this.state.team.length >= MAX_TEAM_SIZE
          ? 'Team full — swap a Pokémon to retrieve.'
          : 'Click Retrieve to add to your team.';
      }
    }
  }

  private openPCBoxModal(): void {
    this.refreshPCList();
    this.container.querySelector('#pc-box-modal')?.classList.remove('hidden');
  }

  private openPCSwapModal(pcIdx: number): void {
    // Reuse the assign-modal as a swap picker
    let modal = this.container.querySelector<HTMLElement>('#pc-swap-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'pc-swap-modal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal">
          <button class="modal-close" id="close-pc-swap">×</button>
          <h3 class="modal-title">Swap with team member</h3>
          <div id="pc-swap-list"></div>
        </div>
      `;
      this.container.querySelector('.shop-wrap')?.appendChild(modal);
      modal.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).id === 'close-pc-swap' || (e.target as HTMLElement).id === 'pc-swap-modal') {
          modal!.classList.add('hidden');
        }
      });
    }

    const listEl = modal.querySelector<HTMLElement>('#pc-swap-list');
    const pcMon = this.state.pc[pcIdx];
    if (listEl && pcMon) {
      listEl.innerHTML = this.state.team.map((tm, ti) => `
        <div class="pc-swap-row" data-pc-swap-team="${ti}" data-pc-swap-pc="${pcIdx}" style="display:flex;align-items:center;gap:10px;padding:8px;cursor:pointer;border-bottom:1px dashed var(--paper-edge);">
          <img src="${tm.sprite}" alt="${tm.displayName}" style="width:32px;height:32px;object-fit:contain;image-rendering:pixelated;">
          <div style="flex:1;font-family:var(--font-display);font-weight:900;font-style:italic;font-size:15px;">${tm.displayName}</div>
          <span style="font-family:var(--font-mono);font-size:10px;color:var(--ink-3)">Lv.${tm.level}</span>
          <button class="btn btn-sm btn-secondary" data-pc-swap-team="${ti}" data-pc-swap-pc="${pcIdx}">Swap</button>
        </div>
      `).join('');
    }
    modal.classList.remove('hidden');
  }

  unmount(): void {
    this.destroyAudioBtn?.();
    this.destroyAudioBtn = null;
    document.body.classList.remove('shop-active');
    if (this.mobileDrawer) {
      this.mobileDrawer.removeEventListener('click', this.handleClick);
      this.mobileDrawer.remove();
      this.mobileDrawer = null;
    }
    if (this.mobileBackdrop) {
      this.mobileBackdrop.remove();
      this.mobileBackdrop = null;
    }
    if (this.portaledPackModal) {
      this.portaledPackModal.removeEventListener('click', this.handleClick);
      this.portaledPackModal.remove();
      this.portaledPackModal = null;
    }
    document.body.querySelectorAll('.shop-side-backdrop, #shop-team-toggle').forEach(el => el.remove());
    document.body.querySelectorAll('.shop-side').forEach(el => el.remove());
    this.container.style.display = 'none';
    this.container.innerHTML = '';
  }
}
