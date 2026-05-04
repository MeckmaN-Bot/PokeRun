import type {
  GameState, BattlePokemon, Move, BattleLogEntry, Perk, Item,
} from '../../types';
import {
  calculateDamage, checkMoveHits, applyDamage, applyEndOfTurnStatus,
  applyEndOfTurnItems, aiSelectMove, playerAutoSelectMove, determineTurnOrder, canMove,
  toBattlePokemon, healPokemon, grantXP, xpFromKO, monHasItem,
  applyToothHealCheck, applyHookItemLoss, canInflictStatus,
} from '../../systems/battle';
import { getBossBlindById, blindDisablesItems } from '../../data/bossBlinds';
import { evaluateSynergies, type ActiveSynergy } from '../../systems/synergies';
import { markDiscovered } from '../../systems/discoveries';
import { loadSettings, saveSettings } from '../../systems/userSettings';
import { ALL_ITEMS } from '../../data/items';
import { attachTooltipDelegation } from '../components/Tooltip';
import { getEffectivenessLabel } from '../../data/typeChart';
import {
  renderBattleInfoCard, renderBattleSpriteImg,
  renderPokemonPortrait, renderTeamBar,
} from '../components/PokemonCard';
import { renderBattleLog, appendLogEntry } from '../components/BattleLog';
import { renderTypeBadges } from '../components/TypeBadge';
import {
  fadeIn, attackAnimation, hitAnimation, faintAnimation, enterAnimation,
  showDamageNumber, animateHPBar, shakeElement, showToast, pulseElement,
  showTypeAttackEffect, screenFlash,
} from '../animations';
import { gsap } from 'gsap';
import { learnMovesForLevel } from '../../api/pokeapi';
import { processPendingLearns } from './MoveLearnPicker';
import { Audio } from '../../audio/AudioManager';
import { isTourActive, isTourBattlePaused } from '../../systems/tutorialTour';

const ITEM_BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const POKEAPI_ITEMS = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/';
function itemArt(item: Item, cls = ''): string {
  const clsStr = cls ? ' ' + cls : '';
  if (item.pokeapiName) {
    return `<img src="${POKEAPI_ITEMS}${item.pokeapiName}.png" alt="${item.name}" class="item-sprite${clsStr}" draggable="false">`;
  }
  if (item.sprite) {
    return `<img src="${ITEM_BASE}${item.sprite}" alt="${item.name}" class="item-sprite${clsStr}" draggable="false">`;
  }
  return `<span class="item-glyph${clsStr}">${item.icon}</span>`;
}

export class BattleScreen {
  private container: HTMLElement;
  private state: GameState;
  private onBattleEnd: (state: GameState) => void;
  private isAnimating = false;
  private autoInterval: ReturnType<typeof setInterval> | null = null;
  private isFirstMove = true;
  private activeSynergies: ActiveSynergy[] = [];
  private xpStart: { level: number; xp: number; xpToNextLevel: number }[] = [];

  constructor(
    container: HTMLElement,
    state: GameState,
    onBattleEnd: (state: GameState) => void
  ) {
    this.container = container;
    this.state = state;
    this.onBattleEnd = onBattleEnd;
  }

  mount(): void {
    if (!this.state.battleState) return;
    const bs = this.state.battleState;
    // Auto-battler: always on
    bs.autoBattle = true;
    // Tutorial mode: nerf the very first battle so the player never loses
    // while learning the screens. Only triggers on wave 1 with the tour active.
    if (isTourActive() && this.state.wave === 1) {
      bs.enemyTeam.forEach(mon => {
        mon.battleHp = 1;
        mon.maxBattleHp = Math.max(1, Math.min(mon.maxBattleHp, 1));
        mon.effectiveStats.attack = Math.max(1, Math.floor(mon.effectiveStats.attack * 0.4));
        mon.effectiveStats.spAtk = Math.max(1, Math.floor(mon.effectiveStats.spAtk * 0.4));
      });
    }
    // Make sure we don't start the battle with a fainted mon active
    if (bs.playerTeam[bs.activePlayerIndex]?.battleHp <= 0) {
      const aliveIdx = bs.playerTeam.findIndex(m => m.battleHp > 0);
      if (aliveIdx >= 0) bs.activePlayerIndex = aliveIdx;
    }
    if (bs.enemyTeam[bs.activeEnemyIndex]?.battleHp <= 0) {
      const aliveIdx = bs.enemyTeam.findIndex(m => m.battleHp > 0);
      if (aliveIdx >= 0) bs.activeEnemyIndex = aliveIdx;
    }
    // Snapshot XP/level before the fight for the post-battle recap
    this.xpStart = this.state.battleState.playerTeam.map(m => ({
      level: m.level, xp: m.xp, xpToNextLevel: m.xpToNextLevel,
    }));
    document.body.classList.add('battle-active');
    this.container.innerHTML = this.renderHTML();
    this.container.style.display = '';
    fadeIn(this.container);
    this.attachEvents();
    this.renderMoveButtons();
    this.renderTeamPortraits();
    this.renderBattleTeamStrip();
    this.refreshSynergyBar();
    // Initialise player sprite flip via GSAP so all subsequent animations preserve it
    const playerSprite = this.container.querySelector<HTMLElement>('#player-active-sprite');
    if (playerSprite) gsap.set(playerSprite, { scaleX: -1 });
  }

  private renderHTML(): string {
    const bs = this.state.battleState!;
    const playerMon = bs.playerTeam[bs.activePlayerIndex];
    const enemyMon = bs.enemyTeam[bs.activeEnemyIndex];
    const wave = this.state.wave;
    const isBoss = bs.isBossWave;

    const godModeBtn = this.state.activePerks.some(p => p.id === 'god_mode') && this.state.godModeAvailable
      ? `<button class="ink-btn danger sm" id="god-mode-btn">↯ GOD MODE</button>`
      : '';

    return `
      <div class="battle-wrap screen" id="battle-screen-inner">

        <!-- TopStrip: wave-chip | team-dots | coin-chip -->
        <div class="topstrip${isBoss ? ' boss' : ''}">
          <div class="wave-chip${isBoss ? ' boss' : ''}">
            <span class="wlabel">${isBoss ? 'Boss wave' : 'Wave'}</span>
            <span class="wnum">${String(wave).padStart(2,'0')}</span>
          </div>
          <div class="team-dots" id="hud-team-pills">
            ${this.renderTeamDots()}
          </div>
          <div class="coin-chip">
            <span class="coin-dot"></span>
            <span id="coin-display">${this.state.coins.toLocaleString()}</span>
          </div>
        </div>

        ${this.renderBossBlindBanner()}

        <!-- Active Perks Strip -->
        ${this.renderPerksStrip()}

        <!-- Synergy Bar (reserved height so it never shifts layout) -->
        <div class="synergy-bar" id="synergy-bar"></div>

        <!-- Battle Field -->
        <div class="battle-field">
          <!-- Enemy: info LEFT, sprite RIGHT -->
          <div class="battle-combatant enemy-combatant" id="enemy-combatant">
            ${renderBattleInfoCard(enemyMon, 'enemy-active', 'enemy')}
            <div class="battle-sprite-slot enemy-sprite-slot" id="enemy-battle-area">
              ${renderBattleSpriteImg(enemyMon, 'enemy-active')}
            </div>
          </div>

          <!-- Player: sprite LEFT, info RIGHT -->
          <div class="battle-combatant player-combatant" id="player-combatant">
            ${renderBattleInfoCard(playerMon, 'player-active', 'player')}
            <div class="battle-sprite-slot player-sprite-slot" id="player-battle-area">
              ${renderBattleSpriteImg(playerMon, 'player-active')}
            </div>
          </div>
        </div>

        <!-- Auto-battler: ticker + team strip + bag controls -->
        <div class="battle-actions auto">
          <div class="battle-ticker" id="battle-ticker">
            ${this.renderTicker(bs.log)}
          </div>
          <div class="battle-team-strip" id="battle-team-strip">
            <!-- Rendered dynamically -->
          </div>
          <div class="battle-controls">
            <div id="battle-bag-row">${this.renderBagButtons()}</div>
            <button class="ink-btn ghost sm" id="battle-speed-btn" type="button"
                    aria-label="Cycle battle animation speed">
              ${this.renderSpeedLabel()}
            </button>
            ${godModeBtn}
          </div>
        </div>

      </div>
    `;
  }

  private renderBattleTeamStrip(): void {
    const bs = this.state.battleState;
    if (!bs) return;
    const strip = this.container.querySelector<HTMLElement>('#battle-team-strip');
    if (!strip) return;
    const itemsDisabled = blindDisablesItems(bs.bossBlind);
    strip.innerHTML = bs.playerTeam.map((mon, i) => {
      const isActive = i === bs.activePlayerIndex;
      const isFainted = mon.battleHp <= 0;
      const hpPct = Math.max(0, Math.min(100, (mon.battleHp / mon.maxBattleHp) * 100));
      const hpClass = hpPct > 50 ? 'high' : hpPct > 20 ? 'mid' : 'low';
      return `
        <div class="bts-card ${isFainted ? 'fainted' : ''} ${isActive ? 'active' : ''}"
             data-bts-index="${i}"
             title="${mon.displayName} · Lv ${mon.level} · ${Math.max(0, mon.battleHp)}/${mon.maxBattleHp}">
          <img class="bts-sprite" src="${mon.sprite}" alt="${mon.displayName}" draggable="false">
          <div class="bts-info">
            <div class="bts-name">${mon.displayName}</div>
            <div class="bts-types">${renderTypeBadges(mon.types)}</div>
            <div class="bts-hp-bar">
              <div class="bts-hp-fill ${hpClass}" style="width:${hpPct}%"></div>
            </div>
            <div class="bts-hp-num">${Math.max(0, mon.battleHp)}/${mon.maxBattleHp}</div>
            ${this.renderBtsItems(mon, itemsDisabled)}
          </div>
        </div>
      `;
    }).join('');
  }

  private renderBtsItems(mon: BattlePokemon, disabled: boolean): string {
    const slots = mon.itemSlots ?? [];
    const visible = slots.filter(s => s.unlocked);
    if (visible.length === 0) return '';
    const cells = visible.map(slot => {
      if (!slot.item) return `<span class="bts-slot empty" title="Empty slot">·</span>`;
      const cls = `bts-slot filled${disabled ? ' disabled' : ''}`;
      const tt = disabled ? `${slot.item.name} (disabled — Boss Blind)` : slot.item.name;
      return `<span class="${cls}" title="${tt}" data-tooltip-item-id="${slot.item.id}">${itemArt(slot.item)}</span>`;
    }).join('');
    return `<div class="bts-items${disabled ? ' all-disabled' : ''}">${cells}</div>`;
  }

  private renderTicker(log: BattleLogEntry[]): string {
    const last = log.slice(-3);
    if (last.length === 0) return `<span class="bt-msg muted">— battle starts —</span>`;
    return last.map(e => `<span class="bt-msg t-${e.type}">${e.text}</span>`).join('');
  }

  private renderBossBlindBanner(): string {
    const bs = this.state.battleState!;
    if (!bs.bossBlind) return '';
    const blind = getBossBlindById(bs.bossBlind);
    if (!blind) return '';
    return `
      <div class="boss-blind-banner" style="--blind-color:${blind.color}">
        <div class="bb-icon">${blind.icon}</div>
        <div class="bb-text">
          <div class="bb-name">Boss Blind · ${blind.name}</div>
          <div class="bb-desc">${blind.description}</div>
        </div>
        <div class="bb-hint">${blind.tacticalHint}</div>
      </div>
    `;
  }

  private renderPerksStrip(): string {
    const perks = this.state.activePerks ?? [];
    if (perks.length === 0) return '';
    return `
      <div class="perks-strip" id="perks-strip">
        <span class="ps-label">Perks</span>
        ${perks.map(p => `
          <div class="ps-chip" data-perk-id="${p.id}" title="${p.name} — ${p.description ?? ''}">
            <span class="ps-icon">${p.icon ?? '◈'}</span>
            <span class="ps-name">${p.name}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  private renderTeamDots(): string {
    const bs = this.state.battleState!;
    return bs.playerTeam.map((mon, i) => {
      const isActive = i === bs.activePlayerIndex;
      const isFainted = mon.battleHp <= 0;
      return `<div class="team-dot ${isFainted ? 'fainted' : 'alive'}${isActive && !isFainted ? ' active' : ''}" title="${mon.displayName} · ${mon.battleHp}/${mon.maxBattleHp}"></div>`;
    }).join('');
  }

  private renderRewardsSidebar(): string {
    const rewards = this.state.teamRewards ?? [];
    const perks = this.state.activePerks ?? [];
    const items: string[] = [];

    perks.forEach(p => {
      items.push(`
        <div class="sidebar-reward-row">
          <span class="sidebar-reward-icon">◈</span>
          <div>
            <div class="sidebar-reward-name">${p.name}</div>
          </div>
        </div>
      `);
    });

    rewards.forEach(r => {
      items.push(`
        <div class="sidebar-reward-row" data-tooltip-item-id="${r.item.id}">
          <span class="sidebar-reward-icon">${itemArt(r.item)}</span>
          <div>
            <div class="sidebar-reward-name">${r.item.name}</div>
            <div class="sidebar-reward-desc">${r.item.description}</div>
          </div>
        </div>
      `);
    });

    if (items.length === 0) {
      return '<div class="sidebar-empty">No rewards yet</div>';
    }
    return items.join('');
  }

  private renderItemsSidebar(): string {
    const inv = this.state.inventory ?? [];
    if (inv.length === 0) {
      return '<div class="sidebar-empty">No items</div>';
    }
    return inv.map(entry => `
      <div class="sidebar-item-row" data-tooltip-item-id="${entry.item.id}">
        <span class="sidebar-item-icon">${itemArt(entry.item)}</span>
        <div class="sidebar-item-info">
          <div class="sidebar-item-name">${entry.item.name}</div>
          <div class="sidebar-item-qty">×${entry.quantity}</div>
        </div>
      </div>
    `).join('');
  }

  private renderSpeedLabel(): string {
    const s = loadSettings();
    return `${s.animationSpeed}× speed`;
  }

  private cycleSpeed(): void {
    // Cycle 1× → 1.5× → 2× → 0.5× → 1×. animationSpeed allowed values are
    // [0.5, 1, 1.5, 2] per userSettings.ts; cycle order chosen so the most
    // common values come first.
    const order = [1, 1.5, 2, 0.5];
    const cur = loadSettings();
    const idx = order.indexOf(cur.animationSpeed);
    const next = order[(idx + 1) % order.length];
    saveSettings({ ...cur, animationSpeed: next });
    const btn = this.container.querySelector<HTMLElement>('#battle-speed-btn');
    if (btn) btn.textContent = `${next}× speed`;
  }

  private renderBagButtons(): string {
    const bs = this.state.battleState!;
    // Bag is usable any time the battle hasn't ended — auto-battle doesn't
    // block manual item use, since picking targets is the only manual call
    // the player makes once auto is on.
    const battleOver = !!bs.winner || bs.phase === 'finished';
    const usable = (this.state.inventory ?? []).filter(inv => {
      const e = inv.item.effect;
      return inv.item.itemType === 'consumable' && (e.healPercent || e.healAmount || e.curesStatus || inv.item.id === 'full_restore' || inv.item.id === 'revive' || inv.item.id === 'max_revive');
    });
    if (usable.length === 0) return '';
    return usable.map((inv, i) => `
      <button
        class="ink-btn ghost sm${battleOver ? ' move-disabled' : ''}"
        data-bag-index="${i}"
        data-tooltip-item-id="${inv.item.id}"
        ${battleOver ? 'disabled' : ''}
      >${itemArt(inv.item)} ${inv.item.name} ×${inv.quantity}</button>
    `).join('');
  }

  private renderMoveButtons(): void {
    const bs = this.state.battleState!;
    const playerMon = bs.playerTeam[bs.activePlayerIndex];
    const grid = this.container.querySelector<HTMLElement>('#move-grid');
    if (!grid) return;

    const isSelecting = bs.phase === 'selecting' && !bs.autoBattle;

    const eyeActive = bs.bossBlind === 'the_eye';

    grid.innerHTML = playerMon.moves.map((move, i) => {
      const ppEmpty = move.pp <= 0;
      const eyeBlocked = eyeActive && bs.usedMoveIds.includes(move.id);
      const isPhysical = move.category === 'physical';
      const isSpecial = move.category === 'special';
      const lowPP = move.pp > 0 && move.pp <= move.maxPp * 0.3;
      const disabled = ppEmpty || !isSelecting || eyeBlocked;

      return `
        <button
          class="move-btn${ppEmpty ? ' move-empty' : ''}${eyeBlocked ? ' move-eye-locked' : ''}${!isSelecting ? ' move-disabled' : ''}"
          data-move-index="${i}"
          ${disabled ? 'disabled' : ''}
          style="--m-color: var(--t-${move.type})"
          ${eyeBlocked ? 'title="Blocked by The Eye — already used this battle"' : ''}
        >
          <div class="mtop">
            <span class="mname">${move.displayName}${eyeBlocked ? ' 👁' : ''}</span>
            <span class="type-stamp type-${move.type}">${move.type}</span>
          </div>
          <div class="mmeta">
            <span>${isPhysical ? '† phys' : isSpecial ? '✦ spec' : '● stat'}</span>
            <span>pow ${move.power > 0 ? move.power : '—'}</span>
            <span class="pp${lowPP ? ' low' : ''}">pp ${move.pp}/${move.maxPp}</span>
          </div>
        </button>
      `;
    }).join('');

    const bagRow = this.container.querySelector<HTMLElement>('#battle-bag-row');
    if (bagRow) bagRow.innerHTML = this.renderBagButtons();
  }

  private renderTeamPortraits(): void {
    const bs = this.state.battleState!;

    // Team bars live inside the info cards
    const enemyBar = this.container.querySelector('#enemy-active-team-bar');
    if (enemyBar) {
      enemyBar.innerHTML = renderTeamBar(bs.enemyTeam, bs.activeEnemyIndex, 'enemy');
    }

    const playerBar = this.container.querySelector('#player-active-team-bar');
    if (playerBar) {
      playerBar.innerHTML = renderTeamBar(bs.playerTeam, bs.activePlayerIndex, 'player');
    }

    // Refresh team dots
    const hudPills = this.container.querySelector('#hud-team-pills');
    if (hudPills) {
      hudPills.innerHTML = this.renderTeamDots();
    }

    // Refresh bottom battle team strip (auto-battler view)
    this.renderBattleTeamStrip();
  }

  private refreshSynergyBar(): void {
    const bar = this.container.querySelector<HTMLElement>('#synergy-bar');
    if (!bar) return;
    const bs = this.state.battleState;
    if (!bs) return;

    const playerMon = bs.playerTeam[bs.activePlayerIndex];
    if (!playerMon || playerMon.battleHp <= 0) {
      this.activeSynergies = [];
      bar.innerHTML = '';
      return;
    }

    const { activeSynergies } = evaluateSynergies({
      attacker: playerMon,
      team: bs.playerTeam,
      slotIndex: bs.activePlayerIndex,
    });

    this.activeSynergies = activeSynergies;
    if (activeSynergies.length > 0) {
      markDiscovered(this.state.playerName, activeSynergies.map(s => s.id));
    }
    const label = activeSynergies.length > 0
      ? `<span class="syn-label">Synergies</span>`
      : '';
    bar.innerHTML = label + activeSynergies.map(s => `
      <div class="syn-badge syn-${s.color}" data-synergy-id="${s.id}" title="Synergy — ${s.description ?? s.name}">
        <span class="syn-icon">${s.icon}</span>
        <span class="syn-name">${s.name}</span>
        <span class="syn-mult">×${s.multiplier.toFixed(2)}</span>
      </div>
    `).join('');
  }

  private pulseSynergies(ids: string[]): void {
    ids.forEach(id => {
      const badge = this.container.querySelector<HTMLElement>(`[data-synergy-id="${id}"]`);
      if (!badge) return;
      badge.classList.remove('syn-pulsing');
      void (badge as HTMLElement).offsetWidth; // force reflow to restart animation
      badge.classList.add('syn-pulsing');
      badge.addEventListener('animationend', () => badge.classList.remove('syn-pulsing'), { once: true });
    });
  }

  private attachEvents(): void {
    // Tooltip delegation — items and synergy badges
    attachTooltipDelegation(
      this.container,
      (id) => ALL_ITEMS.find(i => i.id === id),
      () => this.activeSynergies,
    );

    // Move buttons
    this.container.addEventListener('click', async (e) => {
      const btn = (e.target as HTMLElement).closest('[data-move-index]') as HTMLElement;
      if (btn && !this.isAnimating) {
        const idx = parseInt(btn.dataset['moveIndex'] ?? '0');
        await this.executeTurn(idx);
      }
      // Bag (in-battle item use)
      const bagBtn = (e.target as HTMLElement).closest('[data-bag-index]') as HTMLElement;
      if (bagBtn && !this.isAnimating) {
        const usable = (this.state.inventory ?? []).filter(inv => {
          const ef = inv.item.effect;
          return inv.item.itemType === 'consumable' && (ef.healPercent || ef.healAmount || ef.curesStatus || inv.item.id === 'full_restore' || inv.item.id === 'revive' || inv.item.id === 'max_revive');
        });
        const idx = parseInt(bagBtn.dataset['bagIndex'] ?? '0');
        const invEntry = usable[idx];
        if (invEntry) await this.useBattleItem(invEntry.item);
      }
    });

    // Team strip — click to switch active Pokémon (manual override)
    const teamStrip = this.container.querySelector<HTMLElement>('#battle-team-strip');
    if (teamStrip) {
      teamStrip.addEventListener('click', (e) => {
        const card = (e.target as HTMLElement).closest<HTMLElement>('[data-bts-index]');
        if (!card) return;
        const idx = parseInt(card.dataset['btsIndex'] ?? '-1');
        const bs = this.state.battleState;
        if (!bs || idx < 0 || idx === bs.activePlayerIndex) return;
        const target = bs.playerTeam[idx];
        if (!target || target.battleHp <= 0) return;
        if (this.isAnimating || bs.phase !== 'selecting' || bs.winner) return;
        this.manualSwitchTo(idx);
      });
    }

    // God Mode
    this.container.querySelector('#battle-speed-btn')
      ?.addEventListener('click', () => this.cycleSpeed());

    const godBtn = this.container.querySelector('#god-mode-btn');
    if (godBtn) {
      godBtn.addEventListener('click', () => this.activateGodMode());
    }

    // Start auto-battle if already enabled
    if (this.state.battleState?.autoBattle) {
      setTimeout(() => this.startAutoMode(), 500);
    }
  }

  private startAutoMode(): void {
    this.stopAutoMode();
    const doAuto = async () => {
      if (!this.state.battleState?.autoBattle) return;
      if (this.isAnimating) return;
      // Tour pause — freeze the auto-battler while the tour is explaining
      // battle UI areas to the player. Resumes when the tour clears the flag.
      if (isTourBattlePaused()) return;
      const bs = this.state.battleState;
      if (bs.phase !== 'selecting' || bs.winner) return;

      const playerMon = bs.playerTeam[bs.activePlayerIndex];
      const enemyMon = bs.enemyTeam[bs.activeEnemyIndex];
      // Respect The Eye — filter already-used moves when AI picks
      const availableMoves = bs.bossBlind === 'the_eye'
        ? playerMon.moves.filter(m => !bs.usedMoveIds.includes(m.id) && m.pp > 0)
        : playerMon.moves.filter(m => m.pp > 0);
      if (availableMoves.length === 0) return;
      const tempMon = { ...playerMon, moves: availableMoves };
      const move = playerAutoSelectMove(tempMon, enemyMon, this.state.activePerks);
      const moveIdx = playerMon.moves.findIndex(m => m.id === move.id);
      await this.executeTurn(moveIdx >= 0 ? moveIdx : 0);
    };

    this.autoInterval = setInterval(doAuto, 1200);
  }

  private stopAutoMode(): void {
    if (this.autoInterval !== null) {
      clearInterval(this.autoInterval);
      this.autoInterval = null;
    }
  }

  private async executeTurn(playerMoveIndex: number): Promise<void> {
    if (this.isAnimating) return;
    const bs = this.state.battleState!;
    if (bs.phase !== 'selecting' || bs.winner) return;

    this.isAnimating = true;
    bs.phase = 'animating';
    this.renderMoveButtons(); // disable buttons

    const playerMon = bs.playerTeam[bs.activePlayerIndex];
    const enemyMon = bs.enemyTeam[bs.activeEnemyIndex];
    const playerMove = playerMon.moves[playerMoveIndex] ?? playerMon.moves[0];

    // The Eye — block move reuse
    if (bs.bossBlind === 'the_eye' && bs.usedMoveIds.includes(playerMove.id)) {
      showToast(`The Eye blocks ${playerMove.displayName}! Pick a different move.`, 'warning');
      this.isAnimating = false;
      bs.phase = 'selecting';
      this.renderMoveButtons();
      return;
    }

    const enemyMove = aiSelectMove(enemyMon, playerMon, []);

    // Set choice lock if applicable
    if (
      (monHasItem(playerMon, 'choice_band') || monHasItem(playerMon, 'choice_specs') || monHasItem(playerMon, 'choice_scarf')) &&
      !playerMon.choiceLockedMove
    ) {
      playerMon.choiceLockedMove = playerMove;
    }

    // Determine turn order
    const order = determineTurnOrder(playerMon, enemyMon, playerMove, enemyMove, this.state.activePerks);

    const logEl = this.container.querySelector<HTMLElement>('#battle-log');

    const doPlayerAttack = async () => {
      if (playerMon.battleHp <= 0) return;
      const { canMove: pCanMove, reason } = canMove(playerMon);
      if (!pCanMove) {
        if (reason) this.addLog(logEl, { text: reason, type: 'normal' });
        return;
      }
      await this.performAttack('player', playerMon, enemyMon, playerMove, logEl);
    };

    const doEnemyAttack = async () => {
      if (enemyMon.battleHp <= 0) return;
      const { canMove: eCanMove, reason } = canMove(enemyMon);
      if (!eCanMove) {
        if (reason) this.addLog(logEl, { text: reason, type: 'normal' });
        return;
      }
      await this.performAttack('enemy', enemyMon, playerMon, enemyMove, logEl);
    };

    if (order === 'player') {
      await doPlayerAttack();
      if (!bs.winner) await doEnemyAttack();
    } else {
      await doEnemyAttack();
      if (!bs.winner) await doPlayerAttack();
    }

    // Record player's used move for The Eye
    if (bs.bossBlind === 'the_eye' && !bs.usedMoveIds.includes(playerMove.id)) {
      bs.usedMoveIds.push(playerMove.id);
    }

    bs.turnsUsed++;
    this.isFirstMove = false;

    // End of turn
    if (!bs.winner) {
      await this.applyEndOfTurnEffects(logEl);
    }

    bs.turn++;
    // Track turns each active Pokémon has spent on the field
    const pAct = bs.playerTeam[bs.activePlayerIndex];
    const eAct = bs.enemyTeam[bs.activeEnemyIndex];
    if (pAct) pAct.turnsInBattle = (pAct.turnsInBattle ?? 0) + 1;
    if (eAct) eAct.turnsInBattle = (eAct.turnsInBattle ?? 0) + 1;
    const turnCounter = this.container.querySelector<HTMLElement>('#battle-turn-counter');
    if (turnCounter) turnCounter.textContent = `Turn ${bs.turn}`;
    this.isAnimating = false;

    if (!bs.winner) {
      bs.phase = 'selecting';
      this.renderMoveButtons();
      this.refreshSynergyBar();
    }
  }

  private async performAttack(
    side: 'player' | 'enemy',
    attacker: BattlePokemon,
    defender: BattlePokemon,
    move: Move,
    logEl: HTMLElement | null
  ): Promise<void> {
    const bs = this.state.battleState!;

    this.addLog(logEl, { text: `${attacker.displayName} used ${move.displayName}!`, type: 'normal' });

    // Deduct PP
    if (move.pp > 0) move.pp--;

    const attackerSpriteEl = this.container.querySelector<HTMLElement>(
      `#${side === 'player' ? 'player' : 'enemy'}-active-sprite`
    );
    const defenderSpriteEl = this.container.querySelector<HTMLElement>(
      `#${side === 'player' ? 'enemy' : 'player'}-active-sprite`
    );
    // Attacker card for is-attacking highlight
    const attackerCardEl = this.container.querySelector<HTMLElement>(
      `#${side === 'player' ? 'player' : 'enemy'}-combatant`
    );

    // Attack animation
    if (attackerCardEl) attackerCardEl.classList.add('is-attacking');
    if (attackerSpriteEl) {
      await attackAnimation(attackerSpriteEl, side === 'player' ? 'right' : 'left');
    }
    if (attackerCardEl) attackerCardEl.classList.remove('is-attacking');

    // Check if move hits
    const hits = checkMoveHits(attacker, move, this.state.activePerks);
    if (!hits) {
      this.addLog(logEl, { text: `${attacker.displayName}'s attack missed!`, type: 'normal' });
      if (attackerSpriteEl) shakeElement(attackerSpriteEl);
      Audio.play('battle.miss');
      return;
    }

    // Status move handling
    if (move.category === 'status') {
      await this.applyStatusMove(attacker, defender, move, logEl);
      return;
    }

    // Evaluate synergies for player (used for damage bonus + post-hit pulse)
    let activeSynergyIds: string[] = [];
    if (side === 'player') {
      const { activeSynergies } = evaluateSynergies({
        attacker,
        team: bs.playerTeam,
        slotIndex: bs.activePlayerIndex,
        moveType: move.type,
      });
      activeSynergyIds = activeSynergies.map(s => s.id);
    }

    // Calculate damage (pass team context for player attacks to enable synergy bonuses)
    const teamCtx = side === 'player'
      ? { team: bs.playerTeam, slotIndex: bs.activePlayerIndex }
      : undefined;
    const battleCtx = {
      bossBlind: bs.bossBlind,
      isPlayerAttacker: side === 'player',
      typeLevels: this.state.typeLevels,
    };
    // The Ox — "first player attack of battle" flag (battle-scoped, not first-turn move)
    const isFirstPlayerAttack = side === 'player' && !bs.hasUsedFirstAttack;
    const result = calculateDamage(attacker, defender, move, this.state.activePerks, isFirstPlayerAttack, teamCtx, battleCtx);
    if (side === 'player' && !bs.hasUsedFirstAttack) bs.hasUsedFirstAttack = true;

    if (result.isImmune) {
      this.addLog(logEl, { text: `It has no effect on ${defender.displayName}!`, type: 'immune' });
      if (defenderSpriteEl) shakeElement(defenderSpriteEl);
      Audio.play('battle.immune');
      return;
    }

    // Effectiveness messages — glued to the move name so it can't drift
    // onto an adjacent log entry in the ticker.
    const effectLabel = getEffectivenessLabel(result.effectiveness);
    if (effectLabel) {
      this.addLog(logEl, {
        text: `${move.displayName} — ${effectLabel}`,
        type: result.effectiveness > 1 ? 'super_effective' : 'not_effective',
      });
      if (result.effectiveness > 1) {
        screenFlash('#ffb830', 0.12);
        Audio.play('battle.super_effective');
      } else {
        Audio.play('battle.not_effective');
      }
    }

    if (result.isCritical) {
      this.addLog(logEl, { text: 'A critical hit!', type: 'critical' });
      screenFlash('#ff6bb5', 0.1);
      Audio.play('battle.crit');
    } else {
      Audio.play('battle.hit');
    }

    // Apply damage
    const { actualDamage, fainted, log: dmgLog } = applyDamage(
      defender, result.damage, move, this.state.activePerks
    );

    this.state.runStats.totalDamageDealt += actualDamage;

    // Update UI
    if (defenderSpriteEl) {
      // Type-specific ink strike effect
      if (attackerSpriteEl) {
        await showTypeAttackEffect(move.type, attackerSpriteEl, defenderSpriteEl, attackerCardEl ?? undefined);
      }
      await hitAnimation(defenderSpriteEl);
      const dmgType = result.isCritical ? 'critical'
        : result.effectiveness > 1 ? 'super_effective'
        : result.effectiveness < 1 ? 'not_effective'
        : 'damage';
      showDamageNumber(defenderSpriteEl, actualDamage, dmgType);
    }

    // Pulse synergy badges that contributed to this hit
    if (activeSynergyIds.length > 0) {
      this.pulseSynergies(activeSynergyIds);
    }

    // Animate HP bar
    const hpFill = this.container.querySelector<HTMLElement>(
      `#${side === 'player' ? 'enemy' : 'player'}-active-hp-fill`
    );
    const hpLabel = this.container.querySelector<HTMLElement>(
      `#${side === 'player' ? 'enemy' : 'player'}-active-hp-label`
    );
    if (hpFill) {
      animateHPBar(hpFill, hpLabel, defender.battleHp, defender.maxBattleHp);
    }

    // Update team bar
    this.renderTeamPortraits();

    // Log damage messages
    dmgLog.forEach(e => this.addLog(logEl, e));

    // The Tooth — heal enemy once when crossing 50% HP
    if (side === 'player' && !fainted) {
      const toothResult = applyToothHealCheck(defender, bs.activeEnemyIndex, bs);
      if (toothResult.healed) {
        toothResult.log.forEach(e => this.addLog(logEl, e));
        if (defenderSpriteEl) {
          const healAmt = Math.floor(defender.maxBattleHp * 0.5);
          showDamageNumber(defenderSpriteEl, healAmt, 'heal');
          pulseElement(defenderSpriteEl, '#ff6bb5');
        }
        if (hpFill) animateHPBar(hpFill, hpLabel, defender.battleHp, defender.maxBattleHp);
      }
    }

    // Life Orb recoil (v2: 8% current HP, no damage below 20% max HP)
    if (monHasItem(attacker, 'life_orb') && attacker.battleHp / attacker.maxBattleHp >= 0.2) {
      const recoil = Math.max(1, Math.floor(attacker.battleHp * 0.08));
      attacker.battleHp = Math.max(0, attacker.battleHp - recoil);
      const attackerHpFill = this.container.querySelector<HTMLElement>(
        `#${side}-active-hp-fill`
      );
      const attackerHpLabel = this.container.querySelector<HTMLElement>(
        `#${side}-active-hp-label`
      );
      if (attackerHpFill) {
        animateHPBar(attackerHpFill, attackerHpLabel, attacker.battleHp, attacker.maxBattleHp);
      }
    }

    // Shell Bell heal (v2: 1/6 dealt, min 5 HP)
    if (monHasItem(attacker, 'shell_bell') && actualDamage > 0) {
      const heal = Math.max(5, Math.floor(actualDamage / 6));
      healPokemon(attacker, heal);
      const attackerHpFill = this.container.querySelector<HTMLElement>(`#${side}-active-hp-fill`);
      const attackerHpLabel = this.container.querySelector<HTMLElement>(`#${side}-active-hp-label`);
      if (attackerHpFill) {
        animateHPBar(attackerHpFill, attackerHpLabel, attacker.battleHp, attacker.maxBattleHp);
      }
      if (attackerSpriteEl) showDamageNumber(attackerSpriteEl, heal, 'heal');
    }

    // Rocky Helmet (v2: recoil + 15% paralyze chance on contact)
    if (monHasItem(defender, 'rocky_helmet') && move.isContact && attacker.battleHp > 0) {
      const rfDamage = Math.max(1, Math.floor(defender.maxBattleHp / 6));
      attacker.battleHp = Math.max(0, attacker.battleHp - rfDamage);
      this.addLog(logEl, { text: `${attacker.displayName} was hurt by ${defender.displayName}'s Rocky Helmet!`, type: 'damage' });
      if (!attacker.battleStatus && Math.random() < 0.15) {
        attacker.battleStatus = 'paralysis';
        this.addLog(logEl, { text: `${attacker.displayName} was paralyzed by the Rocky Helmet!`, type: 'status' });
      }
    }

    // Move effects (status infliction)
    if (move.effectChance > 0 && Math.random() * 100 < move.effectChance && !fainted) {
      await this.applyMoveEffect(move, defender, logEl);
    }

    // Burn Cascade perk — Fire moves get extra burn chance
    if (!fainted && move.type === 'fire' && !defender.battleStatus) {
      const cascade = this.state.activePerks.find(p => p.id === 'burn_cascade');
      const chance = cascade?.effect.fireBurnChance ?? 0;
      if (chance > 0 && canInflictStatus(defender, 'burn') && Math.random() < chance) {
        defender.battleStatus = 'burn';
        this.addLog(logEl, { text: `${defender.displayName} was burned by Burn Cascade!`, type: 'status' });
      }
    }

    // Double hit perk
    if (!fainted && this.state.activePerks.some(p => p.id === 'double_up') && Math.random() < 0.15) {
      const result2 = calculateDamage(attacker, defender, move, this.state.activePerks, false, teamCtx, battleCtx);
      const { actualDamage: d2, fainted: f2, log: l2 } = applyDamage(
        defender, result2.damage, move, this.state.activePerks
      );
      if (defenderSpriteEl) {
        await hitAnimation(defenderSpriteEl);
        showDamageNumber(defenderSpriteEl, d2, 'damage');
      }
      if (hpFill) animateHPBar(hpFill, hpLabel, defender.battleHp, defender.maxBattleHp);
      l2.forEach(e => this.addLog(logEl, e));
      this.addLog(logEl, { text: 'Hit twice!', type: 'system' });
      if (f2 && !fainted) {
        await this.handleFaint(side === 'player' ? 'enemy' : 'player', defenderSpriteEl, logEl);
        return;
      }
    }

    if (fainted) {
      Audio.play('battle.faint');
      if (defenderSpriteEl) await faintAnimation(defenderSpriteEl);
      await this.handleFaint(side === 'player' ? 'enemy' : 'player', defenderSpriteEl, logEl);
    }
  }

  private async applyStatusMove(
    attacker: BattlePokemon,
    defender: BattlePokemon,
    move: Move,
    logEl: HTMLElement | null
  ): Promise<void> {
    // Simplified status move handling
    this.addLog(logEl, { text: `${attacker.displayName} used ${move.displayName}!`, type: 'normal' });
    // Most status moves just give a slight log entry
    await new Promise(r => setTimeout(r, 300));
  }

  private async applyMoveEffect(
    move: Move,
    target: BattlePokemon,
    logEl: HTMLElement | null
  ): Promise<void> {
    // Simplified: map common effects to status
    const effect = move.effect?.toLowerCase() ?? '';
    if (effect.includes('burn') && !target.battleStatus) {
      target.battleStatus = 'burn';
      this.addLog(logEl, { text: `${target.displayName} was burned!`, type: 'status' });
    } else if (effect.includes('paralyz') && !target.battleStatus) {
      target.battleStatus = 'paralysis';
      this.addLog(logEl, { text: `${target.displayName} was paralyzed!`, type: 'status' });
    } else if (effect.includes('poison') && !target.battleStatus) {
      target.battleStatus = 'poison';
      this.addLog(logEl, { text: `${target.displayName} was poisoned!`, type: 'status' });
    } else if (effect.includes('sleep') && !target.battleStatus) {
      target.battleStatus = 'sleep';
      target.sleepTurns = 0;
      this.addLog(logEl, { text: `${target.displayName} fell asleep!`, type: 'status' });
    } else if (effect.includes('freeze') && !target.battleStatus) {
      target.battleStatus = 'freeze';
      this.addLog(logEl, { text: `${target.displayName} was frozen!`, type: 'status' });
    }
  }

  private async applyEndOfTurnEffects(logEl: HTMLElement | null): Promise<void> {
    const bs = this.state.battleState!;

    // The Hook — remove one random item from a random player pokemon
    if (bs.bossBlind === 'the_hook') {
      bs.hookTurnCount++;
      const hookLog = applyHookItemLoss(bs);
      hookLog.forEach(e => this.addLog(logEl, e));
    }

    const allMons = [
      ...bs.playerTeam.slice(0, bs.activePlayerIndex + 1).slice(-1),
      ...bs.enemyTeam.slice(0, bs.activeEnemyIndex + 1).slice(-1),
    ];

    for (const mon of allMons) {
      if (mon.battleHp <= 0) continue;

      // Status damage
      let { damage, log: statusLog } = applyEndOfTurnStatus(mon);
      statusLog.forEach(e => this.addLog(logEl, e));
      // Status Stacker perk — boost burn/poison damage on enemies
      const isEnemy = bs.enemyTeam.includes(mon);
      if (isEnemy && damage > 0 &&
          (mon.battleStatus === 'burn' || mon.battleStatus === 'poison' || mon.battleStatus === 'badPoison')) {
        const ssPerk = this.state.activePerks.find(p => p.id === 'status_stacker');
        if (ssPerk?.effect.statusStacker) {
          damage = Math.floor(damage * ssPerk.effect.statusStacker.damageMult);
        }
      }
      if (damage > 0) {
        mon.battleHp = Math.max(0, mon.battleHp - damage);
        this.updateHPDisplay(mon, bs);
        if (mon.battleHp <= 0) {
          const side = bs.playerTeam.includes(mon) ? 'player' : 'enemy';
          const spriteEl = this.container.querySelector<HTMLElement>(`#${side === 'player' ? 'player' : 'enemy'}-active-sprite`);
          if (spriteEl) await faintAnimation(spriteEl);
          await this.handleFaint(side, spriteEl, logEl);
          if (bs.winner) return;
        }
      }

      // Item regen (Leftovers etc.)
      const { heal, log: itemLog } = applyEndOfTurnItems(mon);
      itemLog.forEach(e => this.addLog(logEl, e));
      if (heal > 0) {
        healPokemon(mon, heal);
        this.updateHPDisplay(mon, bs);
        const side = bs.playerTeam.includes(mon) ? 'player' : 'enemy';
        const spriteEl = this.container.querySelector<HTMLElement>(`#${side}-active-sprite`);
        if (spriteEl) showDamageNumber(spriteEl, heal, 'heal');
      } else if (heal < 0) {
        mon.battleHp = Math.max(0, mon.battleHp + heal); // heal is negative
        this.updateHPDisplay(mon, bs);
      }

      // Leech Seed: drain 8% enemy HP per turn
      if (mon.leechSeedActive && mon.battleHp > 0) {
        const isPlayer = bs.playerTeam.includes(mon);
        const opponent = isPlayer
          ? bs.enemyTeam[bs.activeEnemyIndex]
          : bs.playerTeam[bs.activePlayerIndex];
        if (opponent && opponent.battleHp > 0) {
          const drain = Math.max(1, Math.floor(opponent.maxBattleHp * 0.08));
          opponent.battleHp = Math.max(0, opponent.battleHp - drain);
          healPokemon(mon, drain);
          this.updateHPDisplay(mon, bs);
          this.updateHPDisplay(opponent, bs);
          this.addLog(logEl, { text: `${opponent.displayName} was drained by Leech Seed! (−${drain} HP)`, type: 'damage' });
        }
      }

      // Grassy Carpet perk
      if (this.state.activePerks.some(p => p.id === 'grassy_carpet') && mon.battleHp < mon.maxBattleHp) {
        const regen = Math.max(1, Math.floor(mon.maxBattleHp * 0.0625));
        healPokemon(mon, regen);
        this.updateHPDisplay(mon, bs);
      }

      // Speed Boost perk
      if (this.state.activePerks.some(p => p.id === 'speed_boost') && bs.playerTeam.includes(mon)) {
        mon.statStages.speed = Math.min(6, mon.statStages.speed + 1);
      }
    }

    this.renderTeamPortraits();
  }

  private updateHPDisplay(mon: BattlePokemon, bs: typeof this.state.battleState): void {
    if (!bs) return;
    const isPlayer = bs.playerTeam.includes(mon);
    const side = isPlayer ? 'player' : 'enemy';
    const hpFill = this.container.querySelector<HTMLElement>(`#${side}-active-hp-fill`);
    const hpLabel = this.container.querySelector<HTMLElement>(`#${side}-active-hp-label`);
    if (hpFill) animateHPBar(hpFill, hpLabel, mon.battleHp, mon.maxBattleHp);
  }

  private async handleFaint(
    faintedSide: 'player' | 'enemy',
    _spriteEl: HTMLElement | null,
    logEl: HTMLElement | null
  ): Promise<void> {
    const bs = this.state.battleState!;
    const isPlayerFainted = faintedSide === 'player';

    if (isPlayerFainted) {
      // Boss Insurance voucher — once per boss wave, revive at 25% HP
      if (
        bs.isBossWave &&
        this.state.vouchers?.includes('boss_insurance') &&
        !(this.state as { _bossInsuranceUsed?: boolean })._bossInsuranceUsed
      ) {
        const fallen = bs.playerTeam[bs.activePlayerIndex];
        if (fallen && fallen.battleHp <= 0) {
          fallen.battleHp = Math.max(1, Math.floor(fallen.maxBattleHp * 0.25));
          (this.state as { _bossInsuranceUsed?: boolean })._bossInsuranceUsed = true;
          this.addLog(logEl, {
            text: `${fallen.displayName} was revived by Boss Insurance!`,
            type: 'heal',
          });
          this.rerenderBattleSprites();
          return;
        }
      }

      // Synergy Link perk — buffs the next alive Pokémon (not the next slot blindly)
      if (this.state.activePerks.some(p => p.id === 'synergy_link')) {
        const nextMon = bs.playerTeam
          .slice(bs.activePlayerIndex + 1)
          .find(m => m.battleHp > 0);
        if (nextMon) {
          nextMon.statStages.attack = Math.min(6, nextMon.statStages.attack + 2);
          nextMon.statStages.spAtk = Math.min(6, nextMon.statStages.spAtk + 2);
          nextMon.statStages.defense = Math.min(6, nextMon.statStages.defense + 2);
          nextMon.statStages.spDef = Math.min(6, nextMon.statStages.spDef + 2);
          nextMon.statStages.speed = Math.min(6, nextMon.statStages.speed + 2);
        }
      }

      // Advance past every fainted slot until we find an alive one
      let nextPlayerIdx = bs.activePlayerIndex + 1;
      while (
        nextPlayerIdx < bs.playerTeam.length &&
        bs.playerTeam[nextPlayerIdx].battleHp <= 0
      ) {
        nextPlayerIdx++;
      }
      if (nextPlayerIdx >= bs.playerTeam.length) {
        bs.winner = 'enemy';
        await this.endBattle(false);
        return;
      }
      bs.activePlayerIndex = nextPlayerIdx;

      // Switch in next Pokemon
      const nextMon = bs.playerTeam[bs.activePlayerIndex];
      this.addLog(logEl, { text: `Go, ${nextMon.displayName}!`, type: 'system' });

      // Tag-Team Bell — fallen ally heals + boosts the next one
      const fallen = bs.playerTeam[bs.activePlayerIndex - 1];
      if (fallen && monHasItem(fallen, 'tag_team_bell')) {
        nextMon.battleHp = nextMon.maxBattleHp;
        nextMon.statStages.attack = Math.min(6, nextMon.statStages.attack + 1);
        this.addLog(logEl, {
          text: `${fallen.displayName}'s Tag-Team Bell rang! ${nextMon.displayName} entered at full HP, Atk rose!`,
          type: 'heal',
        });
      }

      // Pivot Tactics perk — +1 Atk and Speed on switch-in
      const pivotPerk = this.state.activePerks.find(p => p.id === 'pivot_tactics');
      if (pivotPerk?.effect.pivotBoost) {
        const { atk, speed } = pivotPerk.effect.pivotBoost;
        nextMon.statStages.attack = Math.min(6, nextMon.statStages.attack + atk);
        nextMon.statStages.speed = Math.min(6, nextMon.statStages.speed + speed);
        this.addLog(logEl, {
          text: `${nextMon.displayName} pivoted in! Atk and Speed rose!`,
          type: 'status',
        });
      }

      this.rerenderBattleSprites();
      const spriteEl = this.container.querySelector<HTMLElement>('#player-active-sprite');
      if (spriteEl) enterAnimation(spriteEl, true);
    } else {
      // Enemy fainted
      this.state.runStats.totalKOs++;
      this.state.runStats.chainKOCount++;

      // Chain Reaction perk
      const chainPerk = this.state.activePerks.find(p => p.id === 'chain_reaction');
      if (chainPerk) {
        chainPerk.effect.chainKOBonus = (chainPerk.effect.chainKOBonus ?? 0) + 0.01;
      }

      // ── XP gain ──────────────────────────────────────────────
      const faintedEnemy = bs.enemyTeam[bs.activeEnemyIndex];
      const attackerIdx = bs.activePlayerIndex;
      const attacker = bs.playerTeam[attackerIdx];
      if (attacker && attacker.battleHp > 0) {
        const xpGain = xpFromKO(faintedEnemy.level);
        const preLockedSlots = attacker.itemSlots?.map(s => s.unlocked) ?? [];
        const { leveledUp, newLevel } = grantXP(attacker, xpGain, this.state.activePerks);
        this.addLog(logEl, {
          text: `${attacker.displayName} gained ${xpGain} XP!`,
          type: 'system',
        });
        if (leveledUp) {
          this.addLog(logEl, {
            text: `↑ ${attacker.displayName} grew to Lv.${newLevel}!`,
            type: 'system',
          });
          // Log any newly auto-unlocked item slots
          attacker.itemSlots?.forEach((s, si) => {
            if (s.unlocked && !preLockedSlots[si]) {
              this.addLog(logEl, { text: `◈ ${attacker.displayName} unlocked Item Slot ${si + 1}!`, type: 'system' });
            }
          });
          this.updateHPDisplay(attacker, bs);
          this.renderTeamPortraits();

          // Learn new moves. When 4 slots are full the pokeapi helper now
          // queues a pendingLearns entry instead of auto-replacing — the
          // post-battle picker lets the player choose what to forget.
          const learned = await learnMovesForLevel(attacker);
          for (const ev of learned) {
            const txt = ev.pending
              ? `✦ ${attacker.displayName} wants to learn ${ev.newMove.displayName} — pick after battle!`
              : `✦ ${attacker.displayName} learned ${ev.newMove.displayName}!`;
            this.addLog(logEl, { text: txt, type: 'system' });
          }

          // Check for level-based evolution
          if (
            !attacker.isFullyEvolved &&
            attacker.nextEvolutionId !== null &&
            attacker.evolutionLevel !== null &&
            newLevel >= attacker.evolutionLevel
          ) {
            attacker.pendingEvolution = true;
            this.addLog(logEl, {
              text: `◇ ${attacker.displayName} is ready to evolve!`,
              type: 'system',
            });
          }
        }

        // Exp. Share — benched alive teammates get 50% XP
        const sharedXp = Math.max(1, Math.floor(xpGain * 0.5));
        for (const [idx, mon] of bs.playerTeam.entries()) {
          if (idx === attackerIdx || mon.battleHp <= 0) continue;
          const preLocked = mon.itemSlots?.map(s => s.unlocked) ?? [];
          const { leveledUp: bl, newLevel: blv } = grantXP(mon, sharedXp, this.state.activePerks);
          if (bl) {
            this.addLog(logEl, { text: `↑ ${mon.displayName} grew to Lv.${blv}!`, type: 'system' });
            mon.itemSlots?.forEach((s, si) => {
              if (s.unlocked && !preLocked[si]) {
                this.addLog(logEl, { text: `◈ ${mon.displayName} unlocked Item Slot ${si + 1}!`, type: 'system' });
              }
            });
            const benchLearned = await learnMovesForLevel(mon);
            for (const ev of benchLearned) {
              const txt = ev.pending
                ? `✦ ${mon.displayName} wants to learn ${ev.newMove.displayName} — pick after battle!`
                : `✦ ${mon.displayName} learned ${ev.newMove.displayName}!`;
              this.addLog(logEl, { text: txt, type: 'system' });
            }
            if (!mon.isFullyEvolved && mon.nextEvolutionId !== null && mon.evolutionLevel !== null && blv >= mon.evolutionLevel) {
              mon.pendingEvolution = true;
              this.addLog(logEl, { text: `◇ ${mon.displayName} is ready to evolve!`, type: 'system' });
            }
          }
        }
      }
      // ─────────────────────────────────────────────────────────

      // Advance past every fainted enemy until we find an alive one
      let nextEnemyIdx = bs.activeEnemyIndex + 1;
      while (
        nextEnemyIdx < bs.enemyTeam.length &&
        bs.enemyTeam[nextEnemyIdx].battleHp <= 0
      ) {
        nextEnemyIdx++;
      }
      if (nextEnemyIdx >= bs.enemyTeam.length) {
        bs.winner = 'player';
        await this.endBattle(true);
        return;
      }
      bs.activeEnemyIndex = nextEnemyIdx;

      // Switch in next enemy
      const nextEnemy = bs.enemyTeam[bs.activeEnemyIndex];
      this.addLog(logEl, { text: `Enemy sent out ${nextEnemy.displayName}!`, type: 'system' });

      // Reset Pulse — any player Pokémon holding it clears enemy stat stages once per wave
      const pulseHolder = bs.playerTeam.find(p =>
        p.battleHp > 0 && monHasItem(p, 'reset_pulse') && !p.resetPulseUsedThisWave
      );
      if (pulseHolder) {
        nextEnemy.statStages = {
          attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0,
        };
        pulseHolder.resetPulseUsedThisWave = true;
        this.addLog(logEl, {
          text: `${pulseHolder.displayName}'s Reset Pulse cleared ${nextEnemy.displayName}'s stat changes!`,
          type: 'status',
        });
      }

      this.rerenderBattleSprites();
      const spriteEl = this.container.querySelector<HTMLElement>('#enemy-active-sprite');
      if (spriteEl) enterAnimation(spriteEl);
    }

    this.renderTeamPortraits();
  }

  private rerenderBattleSprites(): void {
    const bs = this.state.battleState!;
    const playerMon = bs.playerTeam[bs.activePlayerIndex];
    const enemyMon = bs.enemyTeam[bs.activeEnemyIndex];

    // Re-render the full combatant (info card + sprite slot) so the new
    // Pokémon's data and sprite are both reflected.
    const playerCombatant = this.container.querySelector<HTMLElement>('#player-combatant');
    const enemyCombatant = this.container.querySelector<HTMLElement>('#enemy-combatant');

    if (playerCombatant) {
      playerCombatant.innerHTML =
        renderBattleInfoCard(playerMon, 'player-active', 'player') +
        `<div class="battle-sprite-slot player-sprite-slot" id="player-battle-area">${renderBattleSpriteImg(playerMon, 'player-active')}</div>`;
      const ps = playerCombatant.querySelector<HTMLElement>('#player-active-sprite');
      if (ps) gsap.set(ps, { scaleX: -1 });
    }
    if (enemyCombatant) {
      enemyCombatant.innerHTML =
        renderBattleInfoCard(enemyMon, 'enemy-active', 'enemy') +
        `<div class="battle-sprite-slot enemy-sprite-slot" id="enemy-battle-area">${renderBattleSpriteImg(enemyMon, 'enemy-active')}</div>`;
    }

    this.renderMoveButtons();
  }

  private pickItemTarget(
    item: import('../../types').Item,
    candidates: import('../../types').BattlePokemon[]
  ): Promise<import('../../types').BattlePokemon | null> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'item-target-overlay';
      overlay.innerHTML = `
        <div class="itm-card">
          <div class="itm-eyebrow">◆ Use Item ◆</div>
          <div class="itm-title">${item.name}</div>
          <div class="itm-desc">${item.description}</div>
          <div class="itm-pickline">Pick a target</div>
          <div class="itm-targets">
            ${candidates.map((m, i) => `
              <button class="itm-target" data-itm-idx="${i}">
                <img src="${m.sprite}" class="itm-target-sprite" alt="" draggable="false" />
                <div class="itm-target-body">
                  <div class="itm-target-name">${m.displayName}</div>
                  <div class="itm-target-hp">HP ${m.battleHp}/${m.maxBattleHp}</div>
                </div>
              </button>
            `).join('')}
          </div>
          <div class="itm-actions">
            <button class="ink-btn ghost" data-itm-cancel>Cancel</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('active'));

      const cleanup = (result: import('../../types').BattlePokemon | null) => {
        overlay.classList.remove('active');
        setTimeout(() => {
          overlay.remove();
          document.removeEventListener('keydown', onKey);
          resolve(result);
        }, 180);
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') cleanup(null);
      };
      document.addEventListener('keydown', onKey);

      overlay.addEventListener('click', (e) => {
        const t = e.target as HTMLElement;
        if (t.closest('[data-itm-cancel]')) { cleanup(null); return; }
        const tgt = t.closest<HTMLElement>('[data-itm-idx]');
        if (tgt) {
          const idx = parseInt(tgt.dataset['itmIdx'] ?? '-1', 10);
          cleanup(candidates[idx] ?? null);
        }
      });
    });
  }

  private async useBattleItem(item: import('../../types').Item): Promise<void> {
    const bs = this.state.battleState!;
    const logEl = this.container.querySelector<HTMLElement>('#battle-log');

    // Pick a target based on item kind. Revives → fainted mons. Heals/cures
    // → living mons. Player picks via a modal so a Pokémon doesn't die in the
    //  bench because the active mon hogged the potion.
    const isRevive = item.id === 'revive' || item.id === 'max_revive';
    const candidates = bs.playerTeam.filter(m =>
      isRevive ? m.battleHp <= 0 : m.battleHp > 0
    );
    if (candidates.length === 0) { showToast('No valid target!', 'warning'); return; }

    const target = candidates.length === 1
      ? candidates[0]
      : await this.pickItemTarget(item, candidates);
    if (!target) return;

    const ef = item.effect;
    if (ef.healPercent) {
      const heal = Math.floor(target.maxBattleHp * ef.healPercent);
      target.battleHp = Math.min(target.maxBattleHp, target.battleHp + heal);
      if (logEl) this.addLog(logEl, { text: `Used ${item.name} on ${target.displayName}! (+${heal} HP)`, type: 'system' });
    } else if (ef.healAmount) {
      target.battleHp = Math.min(target.maxBattleHp, target.battleHp + ef.healAmount);
      if (logEl) this.addLog(logEl, { text: `Used ${item.name} on ${target.displayName}! (+${ef.healAmount} HP)`, type: 'system' });
    } else if (item.id === 'full_restore') {
      target.battleHp = target.maxBattleHp;
      target.battleStatus = null;
      if (logEl) this.addLog(logEl, { text: `Used ${item.name} on ${target.displayName}! Full HP restored!`, type: 'system' });
    } else if (isRevive) {
      target.battleHp = item.id === 'max_revive' ? target.maxBattleHp : Math.floor(target.maxBattleHp / 2);
      if (logEl) this.addLog(logEl, { text: `${target.displayName} was revived!`, type: 'system' });
    }
    if (ef.curesStatus) { target.battleStatus = null; }

    // Consume from inventory
    const invIdx = this.state.inventory.findIndex(i => i.item.id === item.id);
    if (invIdx >= 0) {
      this.state.inventory[invIdx].quantity--;
      if (this.state.inventory[invIdx].quantity <= 0) this.state.inventory.splice(invIdx, 1);
    }

    this.updateHPDisplay(target, bs);
    this.renderTeamPortraits();
    this.renderMoveButtons();
  }

  /** Post-battle XP recap — focuses each Pokémon, animates its EP bar from
   *  pre-battle XP to post-battle XP, flashes level-ups. Click to skip. */
  private async showXpRecap(): Promise<void> {
    const bs = this.state.battleState;
    if (!bs) return;
    const team = bs.playerTeam;
    // Total XP gained across the battle, summed across any level-ups so the
    // recap shows the real number ("+147 XP") instead of "+1" when a Pokémon
    // crossed a level threshold.
    const totalXp = (level: number, xp: number): number => {
      let sum = 0;
      for (let l = 1; l < level; l++) sum += Math.floor(Math.pow(l, 1.5) * 10);
      return sum + xp;
    };
    const gained = team.map((m, i) => {
      const start = this.xpStart[i];
      if (!start) return 0;
      return Math.max(0, totalXp(m.level, m.xp) - totalXp(start.level, start.xp));
    });
    if (gained.every(g => g === 0)) return;

    const overlay = document.createElement('div');
    overlay.className = 'xp-recap-overlay';
    overlay.innerHTML = `
      <div class="xpr-card">
        <div class="xpr-kicker">◆ Battle Recap ◆</div>
        <div class="xpr-title">Experience gained</div>
        <div class="xpr-list" id="xpr-list">
          ${team.map((m, i) => {
            const start = this.xpStart[i] ?? { level: m.level, xp: m.xp, xpToNextLevel: m.xpToNextLevel };
            const fainted = m.battleHp <= 0;
            return `
              <div class="xpr-row ${fainted ? 'fainted' : ''}" data-xpr-row="${i}">
                <img class="xpr-sprite" src="${m.sprite}" alt="${m.displayName}" draggable="false" />
                <div class="xpr-mid">
                  <div class="xpr-name">
                    <span>${m.displayName}</span>
                    <span class="xpr-lvl" data-xpr-lvl="${i}">Lv.${start.level}</span>
                  </div>
                  <div class="xpr-bar-track">
                    <div class="xpr-bar-fill" data-xpr-fill="${i}" style="width:${(start.xp / Math.max(1, start.xpToNextLevel)) * 100}%"></div>
                  </div>
                  <div class="xpr-meta" data-xpr-meta="${i}">
                    +${gained[i]} XP
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="xpr-skip">Tallying experience…</div>
      </div>
    `;
    document.body.appendChild(overlay);

    let dismissed = false;
    let dismissable = false;
    const dismiss = () => {
      if (dismissed || !dismissable) return;
      dismissed = true;
      gsap.to(overlay, {
        opacity: 0, duration: 0.2, ease: 'power2.in',
        onComplete: () => overlay.remove(),
      });
    };
    overlay.addEventListener('click', () => {
      if (!dismissable) {
        // Nudge the user — animation still running.
        overlay.classList.remove('shake');
        void overlay.offsetWidth;
        overlay.classList.add('shake');
        return;
      }
      dismiss();
    });

    requestAnimationFrame(() => overlay.classList.add('active'));
    // Pause: let the panel settle before the bars start filling
    await new Promise(r => setTimeout(r, 700));

    // Animate each Pokémon sequentially: focus → fill bar → level-up flash if any
    for (let i = 0; i < team.length; i++) {
      if (dismissed) break;
      if (gained[i] === 0) continue;
      const row = overlay.querySelector<HTMLElement>(`[data-xpr-row="${i}"]`);
      const fill = overlay.querySelector<HTMLElement>(`[data-xpr-fill="${i}"]`);
      const lvl = overlay.querySelector<HTMLElement>(`[data-xpr-lvl="${i}"]`);
      const meta = overlay.querySelector<HTMLElement>(`[data-xpr-meta="${i}"]`);
      if (!row || !fill || !lvl || !meta) continue;

      const start = this.xpStart[i] ?? { level: team[i].level, xp: team[i].xp, xpToNextLevel: team[i].xpToNextLevel };
      const finalLevel = team[i].level;
      const finalXp = team[i].xp;
      const finalCap = team[i].xpToNextLevel;

      row.classList.add('active');
      await new Promise(r => setTimeout(r, 260));

      // Animate level-by-level if multiple level-ups happened
      let curLevel = start.level;
      let curCap = start.xpToNextLevel;
      let curStart = start.xp;
      while (curLevel < finalLevel && !dismissed) {
        // Fill from curStart → curCap (full bar)
        await new Promise<void>(resolve => {
          gsap.to(fill, {
            width: '100%',
            duration: 0.85,
            ease: 'power2.out',
            onComplete: () => resolve(),
          });
        });
        if (dismissed) break;
        // Level-up flash
        curLevel += 1;
        lvl.textContent = `Lv.${curLevel}`;
        lvl.classList.remove('flash');
        void lvl.offsetWidth;
        lvl.classList.add('flash');
        // Snap bar to 0 and continue
        gsap.set(fill, { width: '0%' });
        // Approximate cap progression
        curStart = 0;
        curCap = Math.floor(Math.pow(curLevel, 1.5) * 10);
        await new Promise(r => setTimeout(r, 320));
      }
      if (dismissed) break;
      // Final partial fill
      const finalPct = (finalXp / Math.max(1, finalCap)) * 100;
      const startPct = (curStart / Math.max(1, curCap)) * 100;
      gsap.set(fill, { width: `${startPct}%` });
      await new Promise<void>(resolve => {
        gsap.to(fill, {
          width: `${finalPct}%`,
          duration: 0.7,
          ease: 'power2.out',
          onComplete: () => resolve(),
        });
      });
      meta.textContent = `+${gained[i]} XP · Lv.${finalLevel}`;
      row.classList.remove('active');
      row.classList.add('done');
      await new Promise(r => setTimeout(r, 260));
    }

    dismissable = true;
    const skipHint = overlay.querySelector<HTMLElement>('.xpr-skip');
    if (skipHint) {
      skipHint.classList.add('ready');
      skipHint.textContent = 'Click to continue';
    }
    if (!dismissed) {
      await new Promise(r => setTimeout(r, 1500));
      dismiss();
    }
  }

  private async endBattle(playerWon: boolean): Promise<void> {
    this.stopAutoMode();
    const logEl = this.container.querySelector<HTMLElement>('#battle-log');
    if (logEl) {
      if (playerWon) {
        this.addLog(logEl, { text: `You won! Wave ${this.state.wave} cleared!`, type: 'system' });
        pulseElement(this.container, '#22c55e');
      } else {
        this.addLog(logEl, { text: 'All your Pokémon fainted...', type: 'system' });
        pulseElement(this.container, '#ef4444');
      }
    }

    await new Promise(r => setTimeout(r, 1200));

    if (playerWon) {
      await this.showXpRecap();
    }

    this.state.battleState!.phase = 'finished';
    this.state.battleState!.winner = playerWon ? 'player' : 'enemy';

    if (playerWon) {
      this.state.runStats.wavesCleared = this.state.wave;
    }

    // Sync XP, level, and pending-evolution flags from the battle copies back to
    // the canonical team so the shop / reward screen reflects level-ups.
    const bs = this.state.battleState!;
    for (let i = 0; i < this.state.team.length; i++) {
      const battleMon = bs.playerTeam[i];
      if (!battleMon) continue;
      this.state.team[i].level = battleMon.level;
      this.state.team[i].xp = battleMon.xp;
      this.state.team[i].xpToNextLevel = battleMon.xpToNextLevel;
      this.state.team[i].pendingEvolution = battleMon.pendingEvolution;
      this.state.team[i].battleHp = battleMon.battleHp;
      this.state.team[i].maxBattleHp = battleMon.maxBattleHp;
      this.state.team[i].effectiveStats = battleMon.effectiveStats;
      // Move + learnset state — picker uses these post-battle.
      this.state.team[i].moves = battleMon.moves;
      this.state.team[i].learnedMoveIds = battleMon.learnedMoveIds;
      this.state.team[i].pendingLearns = battleMon.pendingLearns;
      this.state.team[i].movePool = battleMon.movePool;
      this.state.team[i].learnsetPool = battleMon.learnsetPool;
      // Sync unlock state (auto-unlocks from level-ups)
      if (battleMon.itemSlots && this.state.team[i].itemSlots) {
        battleMon.itemSlots.forEach((s, si) => {
          const target = this.state.team[i].itemSlots?.[si];
          if (target && s.unlocked) target.unlocked = true;
        });
      }
    }

    if (playerWon) {
      await processPendingLearns(this.state.team);
    }

    this.onBattleEnd(this.state);
  }

  private addLog(logEl: HTMLElement | null, entry: BattleLogEntry): void {
    if (logEl) appendLogEntry(logEl, entry);
    this.state.battleState?.log.push(entry);
    this.refreshTicker();
  }

  private refreshTicker(): void {
    const tickerEl = this.container.querySelector<HTMLElement>('#battle-ticker');
    const bs = this.state.battleState;
    if (!tickerEl || !bs) return;
    tickerEl.innerHTML = this.renderTicker(bs.log);
  }

  private manualSwitchTo(idx: number): void {
    const bs = this.state.battleState;
    if (!bs) return;
    if (idx === bs.activePlayerIndex) return;
    const target = bs.playerTeam[idx];
    if (!target || target.battleHp <= 0) return;
    const logEl = this.container.querySelector<HTMLElement>('#battle-log');
    const oldMon = bs.playerTeam[bs.activePlayerIndex];
    bs.activePlayerIndex = idx;
    target.choiceLockedMove = null;
    target.turnsInBattle = 0;
    this.addLog(logEl, { text: `${oldMon?.displayName} retreats. Go, ${target.displayName}!`, type: 'system' });

    // Pivot Tactics perk
    const pivotPerk = this.state.activePerks.find(p => p.id === 'pivot_tactics');
    if (pivotPerk?.effect.pivotBoost) {
      const { atk, speed } = pivotPerk.effect.pivotBoost;
      target.statStages.attack = Math.min(6, target.statStages.attack + atk);
      target.statStages.speed = Math.min(6, target.statStages.speed + speed);
    }

    this.rerenderBattleSprites();
    this.renderTeamPortraits();
    this.renderBattleTeamStrip();
    this.refreshSynergyBar();
    const spriteEl = this.container.querySelector<HTMLElement>('#player-active-sprite');
    if (spriteEl) enterAnimation(spriteEl, true);
  }

  private async activateGodMode(): Promise<void> {
    if (!this.state.godModeAvailable) return;
    this.state.godModeAvailable = false;

    const bs = this.state.battleState!;
    for (const mon of bs.playerTeam) {
      mon.battleHp = mon.maxBattleHp;
      mon.battleStatus = null;
    }

    this.rerenderBattleSprites();
    this.renderTeamPortraits();
    showToast('↯ GOD MODE ACTIVATED! Team fully restored!', 'success');

    // Remove god mode button
    const btn = this.container.querySelector('#god-mode-btn');
    if (btn) btn.remove();
  }

  unmount(): void {
    this.stopAutoMode();
    document.body.classList.remove('battle-active');
    this.container.style.display = 'none';
    this.container.innerHTML = '';
  }
}
