import type { GameState, BattlePokemon, Item, InventoryItem } from '../../types';
import { renderItemCard } from '../components/ItemCard';
import { renderTypeBadges } from '../components/TypeBadge';
import { renderHPBar } from '../components/HPBar';
import { purchaseShopItem, rerollShop, REROLL_COST, canAfford } from '../../systems/shop';
import { fadeIn, animateCoinGain, showToast } from '../animations';
import { toBattlePokemon, xpForLevel } from '../../systems/battle';
import { fetchPokemon } from '../../api/pokeapi';

export class ShopScreen {
  private container: HTMLElement;
  private state: GameState;
  private onShopDone: (state: GameState) => void;
  private selectedTeamIndex = 0;
  private selectedInventoryIndex = -1;
  private assigningItem: Item | null = null;

  constructor(
    container: HTMLElement,
    state: GameState,
    onShopDone: (state: GameState) => void
  ) {
    this.container = container;
    this.state = state;
    this.onShopDone = onShopDone;
  }

  mount(): void {
    this.container.innerHTML = this.renderHTML();
    this.container.style.display = '';
    fadeIn(this.container);
    this.attachEvents();
    // Process any level-up evolutions that were queued during battle
    this.processPendingEvolutions();
  }

  /** Auto-evolve any team member that levelled up to their evolution threshold. */
  private async processPendingEvolutions(): Promise<void> {
    for (let i = 0; i < this.state.team.length; i++) {
      const mon = this.state.team[i];
      if (!mon.pendingEvolution || !mon.nextEvolutionId) continue;

      showToast(`${mon.displayName} is evolving…`, 'info');
      try {
        const evolved = await fetchPokemon(mon.nextEvolutionId, mon.level);
        const evolvedBattle = toBattlePokemon(
          { ...evolved, heldItem: mon.heldItem },
          this.state.activePerks,
        );
        // Preserve battle-relevant state
        evolvedBattle.battleHp = Math.min(evolvedBattle.maxBattleHp, mon.battleHp);
        evolvedBattle.battleStatus = mon.battleStatus;
        evolvedBattle.xp = mon.xp;
        evolvedBattle.xpToNextLevel = xpForLevel(evolved.level);
        evolvedBattle.pendingEvolution = false;

        this.state.team[i] = evolvedBattle;
        showToast(`${mon.displayName} evolved into ${evolved.displayName}! ✨`, 'success');
      } catch {
        mon.pendingEvolution = false;
        showToast(`Evolution failed for ${mon.displayName}.`, 'error');
      }
    }
    this.refreshTeamList();
  }

  private renderHTML(): string {
    return `
      <div class="shop-screen screen">
        <div class="shop-header">
          <h2 class="shop-title">🛒 POKÉMON CENTER</h2>
          <div class="shop-meta">
            <span class="shop-wave">Wave ${this.state.wave}</span>
            <span class="shop-coins" id="shop-coin-display">🪙 ${this.state.coins}</span>
          </div>
        </div>

        <div class="shop-layout">
          <!-- Left: Shop Items -->
          <div class="shop-items-panel">
            <div class="shop-panel-header">
              <h3>SHOP</h3>
              <button class="btn btn-secondary btn-sm" id="reroll-btn">
                🎲 Reroll (🪙${REROLL_COST})
              </button>
            </div>
            <div class="shop-items" id="shop-items">
              ${this.renderShopItems()}
            </div>
          </div>

          <!-- Right: Team + Inventory -->
          <div class="shop-right-panel">
            <!-- Team -->
            <div class="shop-team-panel">
              <h3 class="shop-panel-title">YOUR TEAM</h3>
              <div class="shop-team-list" id="shop-team-list">
                ${this.renderTeamList()}
              </div>
            </div>

            <!-- Inventory -->
            <div class="shop-inventory-panel">
              <h3 class="shop-panel-title">INVENTORY</h3>
              <div class="shop-inventory-list" id="shop-inventory">
                ${this.renderInventory()}
              </div>
            </div>
          </div>
        </div>

        <div class="shop-footer">
          <button class="btn btn-primary btn-lg" id="continue-btn">
            ➡ Continue to Wave ${this.state.wave + 1}
          </button>
        </div>

        <!-- Item Assign Modal -->
        <div class="modal-overlay hidden" id="assign-modal">
          <div class="modal">
            <button class="modal-close" id="close-assign">✕</button>
            <h3 class="modal-title" id="assign-modal-title">Assign to which Pokémon?</h3>
            <div class="assign-team-list" id="assign-team-list"></div>
          </div>
        </div>

        <!-- Use Consumable Modal -->
        <div class="modal-overlay hidden" id="use-modal">
          <div class="modal">
            <button class="modal-close" id="close-use">✕</button>
            <h3 class="modal-title" id="use-modal-title">Use on which Pokémon?</h3>
            <div class="use-team-list" id="use-team-list"></div>
          </div>
        </div>
      </div>
    `;
  }

  private renderShopItems(): string {
    if (this.state.shopItems.length === 0) {
      return '<div class="shop-empty">No items available</div>';
    }
    return this.state.shopItems.map((si, i) =>
      renderItemCard(si.item, {
        showPrice: si.price,
        sold: si.sold,
        onClick: 'buy-item',
      }).replace('data-item-id=', `data-shop-index="${i}" data-item-id=`)
    ).join('');
  }

  private renderTeamList(): string {
    const last = this.state.team.length - 1;
    return this.state.team.map((mon, i) => `
      <div
        class="shop-pokemon-row ${i === this.selectedTeamIndex ? 'selected' : ''} ${mon.battleHp <= 0 ? 'fainted' : ''}"
        data-team-index="${i}"
      >
        <div class="reorder-btns">
          <button class="btn-reorder ${i === 0 ? 'invisible' : ''}" data-action="move-up" data-team-index="${i}">▲</button>
          <button class="btn-reorder ${i === last ? 'invisible' : ''}" data-action="move-down" data-team-index="${i}">▼</button>
        </div>
        <img class="shop-pokemon-sprite" src="${mon.sprite}" alt="${mon.displayName}" />
        <div class="shop-pokemon-info">
          <div class="shop-pokemon-name">${mon.displayName} <span class="lv">Lv.${mon.level}</span><span class="xp-label" style="font-size:0.65rem;color:var(--text-muted);margin-left:4px">${mon.xp ?? 0}/${mon.xpToNextLevel ?? '?'} XP</span></div>
          ${renderTypeBadges(mon.types)}
          ${renderHPBar(mon.battleHp, mon.maxBattleHp, `shop-hp-${i}`, true)}
          ${mon.battleStatus ? `<span class="status-badge status-${mon.battleStatus}">${mon.battleStatus.toUpperCase()}</span>` : ''}
        </div>
        <div class="shop-pokemon-item">
          ${mon.heldItem
            ? `<div class="held-item-slot has-item" title="${mon.heldItem.name} — ${mon.heldItem.description}">
                 ${mon.heldItem.icon}
                 <span class="held-item-name">${mon.heldItem.name}</span>
               </div>`
            : `<div class="held-item-slot empty">No Item</div>`}
        </div>
      </div>
    `).join('');
  }

  private renderInventory(): string {
    if (this.state.inventory.length === 0) {
      return '<div class="inventory-empty">No items in inventory</div>';
    }
    return this.state.inventory.map((inv, i) => `
      <div
        class="inventory-row ${i === this.selectedInventoryIndex ? 'selected' : ''}"
        data-inv-index="${i}"
      >
        <span class="inv-icon">${inv.item.icon}</span>
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

  private attachEvents(): void {
    // Buy item
    this.container.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;

      // Buy from shop
      const shopCard = target.closest('[data-shop-index]') as HTMLElement | null;
      if (shopCard && !target.dataset['action']) {
        const idx = parseInt(shopCard.dataset['shopIndex'] ?? '0');
        this.buyItem(idx);
        return;
      }

      // Assign held item from inventory
      if (target.dataset['action'] === 'assign-item') {
        const invIdx = parseInt(target.dataset['invIndex'] ?? '0');
        this.openAssignModal(invIdx);
        return;
      }

      // Use consumable from inventory
      if (target.dataset['action'] === 'use-item') {
        const invIdx = parseInt(target.dataset['invIndex'] ?? '0');
        this.openUseModal(invIdx);
        return;
      }

      // Reorder team
      if (target.dataset['action'] === 'move-up') {
        const idx = parseInt(target.dataset['teamIndex'] ?? '0');
        if (idx > 0) {
          [this.state.team[idx - 1], this.state.team[idx]] =
            [this.state.team[idx], this.state.team[idx - 1]];
          this.refreshTeamList();
        }
        return;
      }
      if (target.dataset['action'] === 'move-down') {
        const idx = parseInt(target.dataset['teamIndex'] ?? '0');
        if (idx < this.state.team.length - 1) {
          [this.state.team[idx], this.state.team[idx + 1]] =
            [this.state.team[idx + 1], this.state.team[idx]];
          this.refreshTeamList();
        }
        return;
      }

      // Select team member
      const teamRow = target.closest('[data-team-index]') as HTMLElement | null;
      if (teamRow) {
        this.selectedTeamIndex = parseInt(teamRow.dataset['teamIndex'] ?? '0');
        this.refreshTeamList();
        return;
      }

      // Reroll
      if (target.id === 'reroll-btn' || target.closest('#reroll-btn')) {
        this.rerollShop();
        return;
      }

      // Continue
      if (target.id === 'continue-btn' || target.closest('#continue-btn')) {
        this.onShopDone(this.state);
        return;
      }

      // Close modals
      if (target.id === 'close-assign' || target.id === 'assign-modal') {
        this.container.querySelector('#assign-modal')?.classList.add('hidden');
        this.assigningItem = null;
        return;
      }
      if (target.id === 'close-use' || target.id === 'use-modal') {
        this.container.querySelector('#use-modal')?.classList.add('hidden');
        return;
      }

      // Assign to team member
      const assignRow = target.closest('[data-assign-index]') as HTMLElement | null;
      if (assignRow) {
        const teamIdx = parseInt(assignRow.dataset['assignIndex'] ?? '0');
        this.assignHeldItem(teamIdx);
        return;
      }

      // Use on team member
      const useRow = target.closest('[data-use-index]') as HTMLElement | null;
      if (useRow) {
        const teamIdx = parseInt(useRow.dataset['useIndex'] ?? '0');
        this.useConsumable(teamIdx);
        return;
      }
    });
  }

  private buyItem(shopIndex: number): void {
    const shopItem = this.state.shopItems[shopIndex];
    if (!shopItem || shopItem.sold) return;

    if (!canAfford(shopItem.price, this.state.coins)) {
      showToast('Not enough coins!', 'error');
      return;
    }

    const { success, newCoins } = purchaseShopItem(shopItem, this.state.coins);
    if (!success) return;

    const oldCoins = this.state.coins;
    this.state.coins = newCoins;
    shopItem.sold = true;

    // Add to inventory
    const existing = this.state.inventory.find(i => i.item.id === shopItem.item.id);
    if (existing) {
      existing.quantity++;
    } else {
      this.state.inventory.push({ item: shopItem.item, quantity: 1 });
    }
    this.state.runStats.itemsCollected++;

    // Animate coin count
    const coinEl = this.container.querySelector<HTMLElement>('#shop-coin-display');
    if (coinEl) animateCoinGain(coinEl, oldCoins, newCoins);

    showToast(`Bought ${shopItem.item.name}!`, 'success');
    this.refreshShop();
    this.refreshInventory();
  }

  private rerollShop(): void {
    if (!canAfford(REROLL_COST, this.state.coins)) {
      showToast('Not enough coins to reroll!', 'error');
      return;
    }
    const oldCoins = this.state.coins;
    this.state.coins -= REROLL_COST;
    this.state.shopItems = rerollShop(this.state.wave);

    const coinEl = this.container.querySelector<HTMLElement>('#shop-coin-display');
    if (coinEl) animateCoinGain(coinEl, oldCoins, this.state.coins);

    this.refreshShop();
    showToast('Shop rerolled!', 'info');
  }

  private openAssignModal(invIdx: number): void {
    const inv = this.state.inventory[invIdx];
    if (!inv || inv.item.itemType !== 'held') return;
    this.assigningItem = inv.item;
    this.selectedInventoryIndex = invIdx;

    const modal = this.container.querySelector('#assign-modal')!;
    const titleEl = modal.querySelector('#assign-modal-title')!;
    const listEl = modal.querySelector('#assign-team-list')!;

    titleEl.textContent = `Assign "${inv.item.name}" to:`;
    listEl.innerHTML = this.state.team.map((mon, i) => `
      <div class="assign-row" data-assign-index="${i}">
        <img src="${mon.sprite}" class="assign-sprite" alt="${mon.displayName}" />
        <div class="assign-info">
          <span class="assign-name">${mon.displayName}</span>
          <span class="assign-current-item">${mon.heldItem ? `Currently: ${mon.heldItem.name}` : 'No item'}</span>
        </div>
        <button class="btn btn-sm btn-primary">Assign</button>
      </div>
    `).join('');

    modal.classList.remove('hidden');
  }

  private assignHeldItem(teamIdx: number): void {
    if (!this.assigningItem) return;
    const mon = this.state.team[teamIdx];
    if (!mon) return;

    // If mon already has item, put it back in inventory
    if (mon.heldItem) {
      const existing = this.state.inventory.find(i => i.item.id === mon.heldItem!.id);
      if (existing) existing.quantity++;
      else this.state.inventory.push({ item: mon.heldItem, quantity: 1 });
    }

    // Equip new item
    mon.heldItem = this.assigningItem;

    // Remove from inventory
    const invItem = this.state.inventory[this.selectedInventoryIndex];
    if (invItem) {
      invItem.quantity--;
      if (invItem.quantity <= 0) {
        this.state.inventory.splice(this.selectedInventoryIndex, 1);
      }
    }

    // Recalculate battle stats with new item
    const newMon = toBattlePokemon({ ...mon, heldItem: this.assigningItem }, this.state.activePerks);
    newMon.battleHp = Math.min(mon.battleHp, newMon.maxBattleHp);
    newMon.battleStatus = mon.battleStatus;
    this.state.team[teamIdx] = newMon;

    this.assigningItem = null;
    this.selectedInventoryIndex = -1;
    this.container.querySelector('#assign-modal')?.classList.add('hidden');

    showToast(`${mon.displayName} equipped ${mon.heldItem?.name ?? 'item'}!`, 'success');
    this.refreshTeamList();
    this.refreshInventory();
  }

  /** Items that apply to the whole team and don't need a Pokémon target. */
  private static readonly GLOBAL_ITEMS = new Set([
    'star_piece', 'big_nugget', 'sacred_ash', 'max_elixir', 'team_vitals',
  ]);

  private openUseModal(invIdx: number): void {
    const inv = this.state.inventory[invIdx];
    if (!inv || inv.item.itemType !== 'consumable') return;
    this.selectedInventoryIndex = invIdx;

    // Global items are applied immediately, no target selection needed
    if (ShopScreen.GLOBAL_ITEMS.has(inv.item.id)) {
      this.useGlobalConsumable();
      return;
    }

    // Evolution Stone: open modal filtered to non-fully-evolved Pokémon
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

    listEl.innerHTML = team.map((mon) => {
      const realIdx = this.state.team.indexOf(mon);
      return `
        <div class="assign-row" data-use-index="${realIdx}">
          <img src="${mon.sprite}" class="assign-sprite" alt="${mon.displayName}" />
          <div class="assign-info">
            <span class="assign-name">${mon.displayName} Lv.${mon.level}</span>
            <span class="assign-current-item">${mon.battleHp}/${mon.maxBattleHp} HP ${mon.battleStatus ? `• ${mon.battleStatus}` : ''}</span>
          </div>
          <button class="btn btn-sm btn-primary">Use</button>
        </div>
      `;
    }).join('') || '<p style="padding:1rem;color:var(--text-muted)">No valid targets</p>';

    modal.classList.remove('hidden');
  }

  /** Apply a global consumable immediately without Pokémon target. */
  private useGlobalConsumable(): void {
    const inv = this.state.inventory[this.selectedInventoryIndex];
    if (!inv) return;
    const { item } = inv;

    if (item.id === 'star_piece') {
      const old = this.state.coins;
      this.state.coins += 50;
      const el = this.container.querySelector<HTMLElement>('#shop-coin-display');
      if (el) animateCoinGain(el, old, this.state.coins);
      showToast('+50 coins from Star Piece!', 'success');
    } else if (item.id === 'big_nugget') {
      const old = this.state.coins;
      this.state.coins += 150;
      const el = this.container.querySelector<HTMLElement>('#shop-coin-display');
      if (el) animateCoinGain(el, old, this.state.coins);
      showToast('+150 coins from Big Nugget!', 'success');
    } else if (item.id === 'sacred_ash') {
      this.state.team.forEach(m => {
        m.battleHp = m.maxBattleHp;
        m.battleStatus = null;
      });
      showToast('Sacred Ash revived your entire team to full HP!', 'success');
    } else if (item.id === 'max_elixir') {
      this.state.team.forEach(m => m.moves.forEach(mv => { mv.pp = mv.maxPp; }));
      showToast('Max Elixir fully restored all PP for your team!', 'success');
    } else if (item.id === 'team_vitals') {
      this.state.team.forEach(m => {
        if (m.battleHp > 0) {
          m.battleHp = Math.min(m.maxBattleHp, m.battleHp + Math.floor(m.maxBattleHp * 0.5));
        }
      });
      showToast('Team Vitals healed 50% HP for your entire team!', 'success');
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

    listEl.innerHTML = candidates.map((mon) => {
      const realIdx = this.state.team.indexOf(mon);
      return `
        <div class="assign-row" data-use-index="${realIdx}">
          <img src="${mon.sprite}" class="assign-sprite" alt="${mon.displayName}" />
          <div class="assign-info">
            <span class="assign-name">${mon.displayName} Lv.${mon.level}</span>
            <span class="assign-current-item">${mon.isFullyEvolved ? 'Fully evolved' : 'Can evolve'}</span>
          </div>
          <button class="btn btn-sm btn-primary">Evolve</button>
        </div>
      `;
    }).join('') || '<p style="padding:1rem;color:var(--text-muted)">No Pokémon can evolve right now.</p>';

    modal.classList.remove('hidden');
  }

  private useConsumable(teamIdx: number): void {
    const inv = this.state.inventory[this.selectedInventoryIndex];
    if (!inv) return;
    const mon = this.state.team[teamIdx];
    if (!mon) return;

    const item = inv.item;
    const effect = item.effect;

    // Evolution Stone — async, handled separately
    if (item.id === 'evolution_stone') {
      this.container.querySelector('#use-modal')?.classList.add('hidden');
      this.evolveWithStone(teamIdx);
      return;
    }

    // Single-target heals
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
        showToast(`${mon.displayName}'s status was cured!`, 'success');
      }
    }

    // Rare Candy: level up + stat recalc + evolution check
    if (item.id === 'rare_candy') {
      const newLevel = Math.min(100, mon.level + 1);
      const leveled = toBattlePokemon({ ...mon, level: newLevel }, this.state.activePerks);
      const hpGain = Math.max(0, leveled.maxBattleHp - mon.maxBattleHp);
      leveled.battleHp = Math.min(leveled.maxBattleHp, mon.battleHp + hpGain);
      leveled.battleStatus = mon.battleStatus;
      this.state.team[teamIdx] = leveled;
      showToast(`${mon.displayName} leveled up to Lv.${newLevel}!`, 'success');

      // Check evolution
      if (
        !leveled.isFullyEvolved &&
        leveled.nextEvolutionId !== null &&
        leveled.evolutionLevel !== null &&
        newLevel >= leveled.evolutionLevel
      ) {
        leveled.pendingEvolution = true;
        showToast(`${leveled.displayName} is ready to evolve! Check the team section.`, 'info');
        // Auto-evolve immediately via stone logic
        this.consumeInventoryItem();
        this.container.querySelector('#use-modal')?.classList.add('hidden');
        this.processPendingEvolutions();
        this.refreshTeamList();
        this.refreshInventory();
        return;
      }
    }

    // X items: stat stage boosts
    const statBoostMap: Record<string, keyof typeof mon.statStages> = {
      'x_attack': 'attack', 'x_sp_atk': 'spAtk', 'x_speed': 'speed',
    };
    const boostKey = statBoostMap[item.id];
    if (boostKey) {
      mon.statStages[boostKey] = Math.min(6, mon.statStages[boostKey] + 2);
      showToast(`${mon.displayName}'s ${boostKey} rose sharply!`, 'success');
    }

    this.consumeInventoryItem();
    this.container.querySelector('#use-modal')?.classList.add('hidden');
    this.refreshTeamList();
    this.refreshInventory();
  }

  /** Consume one unit of the currently selected inventory item. */
  private consumeInventoryItem(): void {
    const inv = this.state.inventory[this.selectedInventoryIndex];
    if (!inv) return;
    inv.quantity--;
    if (inv.quantity <= 0) {
      this.state.inventory.splice(this.selectedInventoryIndex, 1);
    }
    this.selectedInventoryIndex = -1;
  }

  /** Async: fetch the evolved form and replace the Pokémon in the team. */
  private async evolveWithStone(teamIdx: number): Promise<void> {
    const mon = this.state.team[teamIdx];
    if (!mon || mon.isFullyEvolved || !mon.nextEvolutionId) {
      showToast('This Pokémon cannot evolve!', 'error');
      return;
    }

    showToast(`Evolving ${mon.displayName}…`, 'info');
    try {
      const evolved = await fetchPokemon(mon.nextEvolutionId, mon.level);
      const evolvedBattle = toBattlePokemon(
        { ...evolved, heldItem: mon.heldItem },
        this.state.activePerks,
      );
      evolvedBattle.battleHp = Math.min(evolvedBattle.maxBattleHp, mon.battleHp);
      evolvedBattle.battleStatus = mon.battleStatus;
      evolvedBattle.xp = mon.xp;
      evolvedBattle.xpToNextLevel = xpForLevel(evolved.level);
      evolvedBattle.pendingEvolution = false;

      this.state.team[teamIdx] = evolvedBattle;

      this.consumeInventoryItem();
      showToast(`${mon.displayName} evolved into ${evolved.displayName}! ✨`, 'success');
    } catch {
      showToast('Evolution failed — try again.', 'error');
    }

    this.refreshTeamList();
    this.refreshInventory();
  }

  private refreshShop(): void {
    const el = this.container.querySelector<HTMLElement>('#shop-items');
    if (el) el.innerHTML = this.renderShopItems();
  }

  private refreshTeamList(): void {
    const el = this.container.querySelector<HTMLElement>('#shop-team-list');
    if (el) el.innerHTML = this.renderTeamList();
  }

  private refreshInventory(): void {
    const el = this.container.querySelector<HTMLElement>('#shop-inventory');
    if (el) el.innerHTML = this.renderInventory();
  }

  unmount(): void {
    this.container.style.display = 'none';
    this.container.innerHTML = '';
  }
}
