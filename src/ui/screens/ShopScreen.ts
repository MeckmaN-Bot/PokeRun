import type { GameState, BattlePokemon, Item } from '../../types';
import { SLOT_UNLOCK_COSTS } from '../../types';
import { renderItemCard } from '../components/ItemCard';
import { renderTypeBadges } from '../components/TypeBadge';
import { renderHPBar } from '../components/HPBar';
import { purchaseShopItem, rerollShop, REROLL_COST, canAfford } from '../../systems/shop';
import { fadeIn, animateCoinGain, showToast } from '../animations';
import { toBattlePokemon, xpForLevel, monHasItem } from '../../systems/battle';
import { fetchPokemon } from '../../api/pokeapi';

export class ShopScreen {
  private container: HTMLElement;
  private state: GameState;
  private onShopDone: (state: GameState) => void;
  private selectedTeamIndex = 0;
  private selectedInventoryIndex = -1;
  private assigningItem: Item | null = null;

  constructor(container: HTMLElement, state: GameState, onShopDone: (state: GameState) => void) {
    this.container = container;
    this.state = state;
    this.onShopDone = onShopDone;
  }

  mount(): void {
    this.container.innerHTML = this.renderHTML();
    this.container.style.display = '';
    fadeIn(this.container);
    this.attachEvents();
    this.processPendingEvolutions();
  }

  private async processPendingEvolutions(): Promise<void> {
    for (let i = 0; i < this.state.team.length; i++) {
      const mon = this.state.team[i];
      if (!mon.pendingEvolution || !mon.nextEvolutionId) continue;
      showToast(`${mon.displayName} entwickelt sich…`, 'info');
      try {
        const evolved = await fetchPokemon(mon.nextEvolutionId, mon.level);
        const evolvedBattle = toBattlePokemon(
          { ...evolved, itemSlots: mon.itemSlots, heldItem: mon.heldItem },
          this.state.activePerks,
        );
        evolvedBattle.battleHp = Math.min(evolvedBattle.maxBattleHp, mon.battleHp);
        evolvedBattle.battleStatus = mon.battleStatus;
        evolvedBattle.xp = mon.xp;
        evolvedBattle.xpToNextLevel = xpForLevel(evolved.level);
        evolvedBattle.pendingEvolution = false;
        this.state.team[i] = evolvedBattle;
        showToast(`${mon.displayName} hat sich zu ${evolved.displayName} entwickelt! ✨`, 'success');
      } catch {
        mon.pendingEvolution = false;
        showToast(`Entwicklung von ${mon.displayName} fehlgeschlagen.`, 'error');
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

          <div class="shop-right-panel">
            <div class="shop-team-panel">
              <h3 class="shop-panel-title">DEIN TEAM</h3>
              <div class="shop-team-list" id="shop-team-list">
                ${this.renderTeamList()}
              </div>
            </div>

            <div class="shop-inventory-panel">
              <h3 class="shop-panel-title">INVENTAR</h3>
              <div class="shop-inventory-list" id="shop-inventory">
                ${this.renderInventory()}
              </div>
            </div>

            <div class="shop-team-rewards-panel">
              <h3 class="shop-panel-title">TEAM REWARDS</h3>
              <div id="shop-team-rewards">
                ${this.renderTeamRewards()}
              </div>
            </div>
          </div>
        </div>

        <div class="shop-footer">
          <button class="btn btn-primary btn-lg" id="continue-btn">
            ➡ Weiter zu Wave ${this.state.wave + 1}
          </button>
        </div>

        <div class="modal-overlay hidden" id="assign-modal">
          <div class="modal">
            <button class="modal-close" id="close-assign">✕</button>
            <h3 class="modal-title" id="assign-modal-title">Item zuweisen</h3>
            <div class="assign-team-list" id="assign-team-list"></div>
          </div>
        </div>

        <div class="modal-overlay hidden" id="use-modal">
          <div class="modal">
            <button class="modal-close" id="close-use">✕</button>
            <h3 class="modal-title" id="use-modal-title">Verwenden auf:</h3>
            <div class="use-team-list" id="use-team-list"></div>
          </div>
        </div>
      </div>
    `;
  }

  private renderShopItems(): string {
    if (this.state.shopItems.length === 0) {
      return '<div class="shop-empty">Keine Items verfügbar</div>';
    }
    return this.state.shopItems.map((si, i) =>
      renderItemCard(si.item, { showPrice: si.price, sold: si.sold, onClick: 'buy-item' })
        .replace('data-item-id=', `data-shop-index="${i}" data-item-id=`)
    ).join('');
  }

  private renderItemSlots(mon: BattlePokemon): string {
    const slots = mon.itemSlots ?? [];
    return `<div class="item-slots-row">${slots.map((slot, si) => {
      if (slot.unlocked && slot.item) {
        return `<div class="item-slot filled" title="${slot.item.name}: ${slot.item.description}">${slot.item.icon}</div>`;
      } else if (slot.unlocked) {
        return `<div class="item-slot empty" title="Slot ${si + 1} (leer)">·</div>`;
      } else {
        return `<div class="item-slot locked" title="Freischalten: ${SLOT_UNLOCK_COSTS[si]}🪙">🔒</div>`;
      }
    }).join('')}</div>`;
  }

  private renderTeamList(): string {
    const last = this.state.team.length - 1;
    return this.state.team.map((mon, i) => `
      <div class="shop-pokemon-row ${i === this.selectedTeamIndex ? 'selected' : ''} ${mon.battleHp <= 0 ? 'fainted' : ''}" data-team-index="${i}">
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
          ${this.renderItemSlots(mon)}
        </div>
      </div>
    `).join('');
  }

  private renderInventory(): string {
    if (this.state.inventory.length === 0) {
      return '<div class="inventory-empty">Keine Items im Inventar</div>';
    }
    return this.state.inventory.map((inv, i) => `
      <div class="inventory-row ${i === this.selectedInventoryIndex ? 'selected' : ''}" data-inv-index="${i}">
        <span class="inv-icon">${inv.item.icon}</span>
        <div class="inv-info">
          <span class="inv-name">${inv.item.name}</span>
          <span class="inv-type">${inv.item.itemType === 'held' ? 'Gehalten' : 'Verbrauchbar'}</span>
        </div>
        <span class="inv-qty">×${inv.quantity}</span>
        <div class="inv-actions">
          ${inv.item.itemType === 'held'
            ? `<button class="btn btn-sm btn-secondary" data-action="assign-item" data-inv-index="${i}">Zuweisen</button>`
            : `<button class="btn btn-sm btn-secondary" data-action="use-item" data-inv-index="${i}">Verwenden</button>`}
        </div>
      </div>
    `).join('');
  }

  private renderTeamRewards(): string {
    if (!this.state.teamRewards || this.state.teamRewards.length === 0) {
      return '<div class="team-rewards-empty">Keine aktiven Team-Rewards</div>';
    }
    return this.state.teamRewards.map(tr => `
      <div class="team-reward-row">
        <span class="inv-icon">${tr.item.icon}</span>
        <div class="inv-info">
          <span class="inv-name">${tr.item.name}</span>
          <span class="inv-type">${tr.item.description}</span>
        </div>
      </div>
    `).join('');
  }

  private attachEvents(): void {
    this.container.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;

      // Slot freischalten
      const unlockBtn = target.closest('[data-unlock-slot]') as HTMLElement | null;
      if (unlockBtn) {
        const si = parseInt(unlockBtn.dataset['unlockSlot'] ?? '0');
        const pi = parseInt(unlockBtn.dataset['assignPokemon'] ?? '0');
        const cost = SLOT_UNLOCK_COSTS[si];
        if (this.state.coins < cost) { showToast('Nicht genug Coins!', 'error'); return; }
        const mon = this.state.team[pi];
        if (mon?.itemSlots[si]) {
          const oldCoins = this.state.coins;
          this.state.coins -= cost;
          mon.itemSlots[si].unlocked = true;
          const coinEl = this.container.querySelector<HTMLElement>('#shop-coin-display');
          if (coinEl) animateCoinGain(coinEl, oldCoins, this.state.coins);
          showToast(`Slot ${si + 1} für ${mon.displayName} freigeschaltet!`, 'success');
          this.openAssignModal(this.selectedInventoryIndex);
        }
        return;
      }

      // Item in bestimmten Slot zuweisen
      const assignSlotBtn = target.closest('[data-assign-slot]') as HTMLElement | null;
      if (assignSlotBtn) {
        const si = parseInt(assignSlotBtn.dataset['assignSlot'] ?? '0');
        const pi = parseInt(assignSlotBtn.dataset['assignPokemon'] ?? '0');
        this.assignHeldItemToSlot(pi, si);
        return;
      }

      // Shop kaufen
      const shopCard = target.closest('[data-shop-index]') as HTMLElement | null;
      if (shopCard && !target.dataset['action']) {
        const idx = parseInt(shopCard.dataset['shopIndex'] ?? '0');
        this.buyItem(idx);
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

      const teamRow = target.closest('[data-team-index]') as HTMLElement | null;
      if (teamRow && !target.dataset['action']) {
        this.selectedTeamIndex = parseInt(teamRow.dataset['teamIndex'] ?? '0');
        this.refreshTeamList();
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

      if (target.id === 'close-assign' || target.id === 'assign-modal') {
        this.container.querySelector('#assign-modal')?.classList.add('hidden');
        this.assigningItem = null;
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
    });
  }

  private buyItem(shopIndex: number): void {
    const shopItem = this.state.shopItems[shopIndex];
    if (!shopItem || shopItem.sold) return;
    if (!canAfford(shopItem.price, this.state.coins)) {
      showToast('Nicht genug Coins!', 'error');
      return;
    }
    const { success, newCoins } = purchaseShopItem(shopItem, this.state.coins);
    if (!success) return;

    const oldCoins = this.state.coins;
    this.state.coins = newCoins;
    shopItem.sold = true;

    const existing = this.state.inventory.find(i => i.item.id === shopItem.item.id);
    if (existing) existing.quantity++;
    else this.state.inventory.push({ item: shopItem.item, quantity: 1 });
    this.state.runStats.itemsCollected++;

    const coinEl = this.container.querySelector<HTMLElement>('#shop-coin-display');
    if (coinEl) animateCoinGain(coinEl, oldCoins, newCoins);

    showToast(`${shopItem.item.name} gekauft!`, 'success');
    this.refreshShop();
    this.refreshInventory();
  }

  private rerollShop(): void {
    if (!canAfford(REROLL_COST, this.state.coins)) {
      showToast('Nicht genug Coins zum Rerolln!', 'error');
      return;
    }
    const oldCoins = this.state.coins;
    this.state.coins -= REROLL_COST;
    this.state.shopItems = rerollShop(this.state.wave);
    const coinEl = this.container.querySelector<HTMLElement>('#shop-coin-display');
    if (coinEl) animateCoinGain(coinEl, oldCoins, this.state.coins);
    this.refreshShop();
    showToast('Shop neu gewürfelt!', 'info');
  }

  private openAssignModal(invIdx: number): void {
    const inv = this.state.inventory[invIdx];
    if (!inv || inv.item.itemType !== 'held') return;
    this.assigningItem = inv.item;
    this.selectedInventoryIndex = invIdx;

    const modal = this.container.querySelector('#assign-modal')!;
    const titleEl = modal.querySelector('#assign-modal-title')!;
    const listEl = modal.querySelector('#assign-team-list')!;

    titleEl.textContent = `"${inv.item.name}" zuweisen:`;
    listEl.innerHTML = this.state.team.map((mon, i) => `
      <div class="assign-row">
        <img src="${mon.sprite}" class="assign-sprite" alt="${mon.displayName}" />
        <div class="assign-info">
          <span class="assign-name">${mon.displayName}</span>
          <div class="assign-slots">
            ${(mon.itemSlots ?? []).map((slot, si) => {
              if (!slot.unlocked) {
                return `<button class="item-slot locked btn-sm" data-unlock-slot="${si}" data-assign-pokemon="${i}" title="Freischalten: ${SLOT_UNLOCK_COSTS[si]}🪙">🔒 ${SLOT_UNLOCK_COSTS[si]}🪙</button>`;
              } else if (slot.item) {
                return `<button class="item-slot filled btn-sm" data-assign-slot="${si}" data-assign-pokemon="${i}" title="${slot.item.name} — ersetzen">${slot.item.icon}</button>`;
              } else {
                return `<button class="item-slot empty btn-sm" data-assign-slot="${si}" data-assign-pokemon="${i}" title="Hier zuweisen">+</button>`;
              }
            }).join('')}
          </div>
        </div>
      </div>
    `).join('');

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

    showToast(`${mon.displayName} hat ${newItem.name} in Slot ${slotIdx + 1} ausgerüstet!`, 'success');
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
    if (inv.item.id === 'evolution_stone') {
      this.openEvolutionStoneModal(invIdx);
      return;
    }

    const modal = this.container.querySelector('#use-modal')!;
    const titleEl = modal.querySelector('#use-modal-title')!;
    const listEl = modal.querySelector('#use-team-list')!;

    titleEl.textContent = `"${inv.item.name}" verwenden auf:`;

    const isRevive = inv.item.id === 'revive' || inv.item.id === 'max_revive';
    const team = isRevive
      ? this.state.team.filter(m => m.battleHp <= 0)
      : this.state.team.filter(m => m.battleHp > 0);

    listEl.innerHTML = team.map(mon => {
      const realIdx = this.state.team.indexOf(mon);
      return `
        <div class="assign-row" data-use-index="${realIdx}">
          <img src="${mon.sprite}" class="assign-sprite" alt="${mon.displayName}" />
          <div class="assign-info">
            <span class="assign-name">${mon.displayName} Lv.${mon.level}</span>
            <span class="assign-current-item">${mon.battleHp}/${mon.maxBattleHp} HP${mon.battleStatus ? ` • ${mon.battleStatus}` : ''}</span>
          </div>
          <button class="btn btn-sm btn-primary">Verwenden</button>
        </div>
      `;
    }).join('') || '<p style="padding:1rem;color:var(--text-muted)">Kein gültiges Ziel</p>';

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
      showToast('+50 Coins durch Star Piece!', 'success');
    } else if (item.id === 'big_nugget') {
      const old = this.state.coins;
      this.state.coins += 150;
      const el = this.container.querySelector<HTMLElement>('#shop-coin-display');
      if (el) animateCoinGain(el, old, this.state.coins);
      showToast('+150 Coins durch Big Nugget!', 'success');
    } else if (item.id === 'sacred_ash') {
      this.state.team.forEach(m => { m.battleHp = m.maxBattleHp; m.battleStatus = null; });
      showToast('Sacred Ash hat dein ganzes Team vollständig geheilt!', 'success');
    } else if (item.id === 'max_elixir') {
      this.state.team.forEach(m => m.moves.forEach(mv => { mv.pp = mv.maxPp; }));
      showToast('Max Elixir hat alle PP deines Teams wiederhergestellt!', 'success');
    } else if (item.id === 'team_vitals') {
      this.state.team.forEach(m => {
        if (m.battleHp > 0) m.battleHp = Math.min(m.maxBattleHp, m.battleHp + Math.floor(m.maxBattleHp * 0.5));
      });
      showToast('Team Vitals hat 50% HP für dein ganzes Team geheilt!', 'success');
    } else if (item.id === 'reroll_token') {
      this.state.shopItems = rerollShop(this.state.wave);
      this.refreshShop();
      showToast('Shop neu gewürfelt (kostenlos)!', 'info');
    }

    this.consumeInventoryItem();
    this.refreshTeamList();
    this.refreshInventory();
  }

  private openEvolutionStoneModal(invIdx: number): void {
    const modal = this.container.querySelector('#use-modal')!;
    const titleEl = modal.querySelector('#use-modal-title')!;
    const listEl = modal.querySelector('#use-team-list')!;

    titleEl.textContent = 'Welches Pokémon entwickeln?';
    const candidates = this.state.team.filter(m => !m.isFullyEvolved && m.nextEvolutionId !== null);

    listEl.innerHTML = candidates.map(mon => {
      const realIdx = this.state.team.indexOf(mon);
      return `
        <div class="assign-row" data-use-index="${realIdx}">
          <img src="${mon.sprite}" class="assign-sprite" alt="${mon.displayName}" />
          <div class="assign-info">
            <span class="assign-name">${mon.displayName} Lv.${mon.level}</span>
            <span class="assign-current-item">Kann sich entwickeln</span>
          </div>
          <button class="btn btn-sm btn-primary">Entwickeln</button>
        </div>
      `;
    }).join('') || '<p style="padding:1rem;color:var(--text-muted)">Kein Pokémon kann sich jetzt entwickeln.</p>';

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
      showToast(`${mon.displayName}'s PP wurden vollständig wiederhergestellt!`, 'success');
      this.consumeInventoryItem();
      this.container.querySelector('#use-modal')?.classList.add('hidden');
      this.refreshTeamList();
      this.refreshInventory();
      return;
    }

    if (item.id === 'item_pouch') {
      if (mon.itemSlots[1] && !mon.itemSlots[1].unlocked) {
        mon.itemSlots[1].unlocked = true;
        showToast(`Slot 2 für ${mon.displayName} freigeschaltet!`, 'success');
      } else {
        showToast(`${mon.displayName} hat Slot 2 bereits freigeschaltet!`, 'info');
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
      showToast(`${mon.displayName}'s Stats wurden permanent erhöht!`, 'success');
      this.consumeInventoryItem();
      this.container.querySelector('#use-modal')?.classList.add('hidden');
      this.refreshTeamList();
      this.refreshInventory();
      return;
    }

    if (effect.healPercent && item.id !== 'team_vitals') {
      const heal = Math.floor(mon.maxBattleHp * effect.healPercent);
      mon.battleHp = Math.min(mon.maxBattleHp, mon.battleHp + heal);
      showToast(`${mon.displayName} hat ${heal} HP wiederhergestellt!`, 'success');
    } else if (effect.healAmount) {
      mon.battleHp = Math.min(mon.maxBattleHp, mon.battleHp + effect.healAmount);
      showToast(`${mon.displayName} hat ${effect.healAmount} HP wiederhergestellt!`, 'success');
    }

    if (effect.curesStatus) {
      if (effect.curesStatus === 'any' || effect.curesStatus === mon.battleStatus) {
        mon.battleStatus = null;
        showToast(`${mon.displayName}'s Status wurde geheilt!`, 'success');
      }
    }

    if (item.id === 'rare_candy') {
      const newLevel = Math.min(100, mon.level + 1);
      const leveled = toBattlePokemon({ ...mon, level: newLevel }, this.state.activePerks);
      const hpGain = Math.max(0, leveled.maxBattleHp - mon.maxBattleHp);
      leveled.battleHp = Math.min(leveled.maxBattleHp, mon.battleHp + hpGain);
      leveled.battleStatus = mon.battleStatus;
      this.state.team[teamIdx] = leveled;
      showToast(`${mon.displayName} ist auf Lv.${newLevel} aufgestiegen!`, 'success');
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
      showToast(`${mon.displayName}'s ${boostKey} ist stark gestiegen!`, 'success');
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
      showToast('Dieses Pokémon kann sich nicht entwickeln!', 'error');
      return;
    }
    showToast(`${mon.displayName} entwickelt sich…`, 'info');
    try {
      const evolved = await fetchPokemon(mon.nextEvolutionId, mon.level);
      const evolvedBattle = toBattlePokemon(
        { ...evolved, itemSlots: mon.itemSlots, heldItem: mon.heldItem },
        this.state.activePerks,
      );
      evolvedBattle.battleHp = Math.min(evolvedBattle.maxBattleHp, mon.battleHp);
      evolvedBattle.battleStatus = mon.battleStatus;
      evolvedBattle.xp = mon.xp;
      evolvedBattle.xpToNextLevel = xpForLevel(evolved.level);
      evolvedBattle.pendingEvolution = false;
      this.state.team[teamIdx] = evolvedBattle;
      this.consumeInventoryItem();
      showToast(`${mon.displayName} hat sich zu ${evolved.displayName} entwickelt! ✨`, 'success');
    } catch {
      showToast('Entwicklung fehlgeschlagen — versuche es erneut.', 'error');
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
