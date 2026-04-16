import type {
  GameState, BattlePokemon, Move, BattleLogEntry, Perk,
} from '../../types';
import {
  calculateDamage, checkMoveHits, applyDamage, applyEndOfTurnStatus,
  applyEndOfTurnItems, aiSelectMove, determineTurnOrder, canMove,
  toBattlePokemon, healPokemon, grantXP, xpFromKO, monHasItem,
} from '../../systems/battle';
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
  showTypeAttackEffect,
} from '../animations';

export class BattleScreen {
  private container: HTMLElement;
  private state: GameState;
  private onBattleEnd: (state: GameState) => void;
  private isAnimating = false;
  private autoInterval: ReturnType<typeof setInterval> | null = null;
  private isFirstMove = true;

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
    this.container.innerHTML = this.renderHTML();
    this.container.style.display = '';
    fadeIn(this.container);
    this.attachEvents();
    this.renderMoveButtons();
    this.renderTeamPortraits();
  }

  private renderHTML(): string {
    const bs = this.state.battleState!;
    const playerMon = bs.playerTeam[bs.activePlayerIndex];
    const enemyMon = bs.enemyTeam[bs.activeEnemyIndex];
    const wave = this.state.wave;
    const isBoss = bs.isBossWave;

    return `
      <div class="battle-screen screen" id="battle-screen-inner">
        <!-- Wave Banner -->
        <div class="wave-banner ${isBoss ? 'boss-wave' : ''}">
          <span class="wave-text">${isBoss ? '⚡ BOSS WAVE' : 'Wave'} ${wave}</span>
          <div class="wave-progress-bar">
            <div class="wave-progress-fill" style="width:${Math.min(100, (wave / 25) * 100)}%"></div>
          </div>
        </div>

        <!-- Battle Field -->
        <div class="battle-field">
          <!-- Enemy: info LEFT, sprite RIGHT -->
          <div class="battle-combatant enemy-combatant" id="enemy-combatant">
            ${renderBattleInfoCard(enemyMon, 'enemy-active', 'enemy')}
            <div class="battle-sprite-slot enemy-sprite-slot" id="enemy-battle-area">
              ${renderBattleSpriteImg(enemyMon, 'enemy-active')}
            </div>
          </div>

          <!-- Player: sprite LEFT, info RIGHT (row-reverse) -->
          <div class="battle-combatant player-combatant" id="player-combatant">
            ${renderBattleInfoCard(playerMon, 'player-active', 'player')}
            <div class="battle-sprite-slot player-sprite-slot" id="player-battle-area">
              ${renderBattleSpriteImg(playerMon, 'player-active')}
            </div>
          </div>
        </div>

        <!-- Battle Controls -->
        <div class="battle-controls">
          <div class="battle-controls-main">
            <!-- Move Buttons -->
            <div class="move-grid" id="move-grid">
              <!-- Rendered dynamically -->
            </div>

            <!-- Battle Log -->
            ${renderBattleLog(bs.log)}
          </div>

          <!-- Control Bar -->
          <div class="battle-control-bar">
            <div class="auto-battle-toggle">
              <label class="toggle-label">
                <input type="checkbox" id="auto-battle-toggle" ${bs.autoBattle ? 'checked' : ''} />
                <span class="toggle-slider"></span>
                <span class="toggle-text">AUTO</span>
              </label>
            </div>
            ${this.state.activePerks.some(p => p.id === 'god_mode') && this.state.godModeAvailable
              ? `<button class="btn btn-legendary btn-sm" id="god-mode-btn">⚡ GOD MODE</button>`
              : ''
            }
            <div class="battle-coins">
              🪙 <span id="coin-display">${this.state.coins}</span>
            </div>
          </div>
        </div>

        <!-- Team Overview (bottom) -->
        <div class="team-overview" id="team-overview">
          <!-- Rendered dynamically -->
        </div>
      </div>
    `;
  }

  private renderMoveButtons(): void {
    const bs = this.state.battleState!;
    const playerMon = bs.playerTeam[bs.activePlayerIndex];
    const grid = this.container.querySelector<HTMLElement>('#move-grid');
    if (!grid) return;

    const isSelecting = bs.phase === 'selecting' && !bs.autoBattle;

    grid.innerHTML = playerMon.moves.map((move, i) => {
      const ppEmpty = move.pp <= 0;
      const typeColors: Record<string, string> = {
        normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
        grass: '#78C850', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
        ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
        rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
        steel: '#B8B8D0', fairy: '#EE99AC',
      };
      const typeColor = typeColors[move.type] ?? '#888';
      const isPhysical = move.category === 'physical';
      const isSpecial = move.category === 'special';

      return `
        <button
          class="move-btn ${ppEmpty ? 'move-empty' : ''} ${!isSelecting ? 'move-disabled' : ''}"
          data-move-index="${i}"
          ${ppEmpty || !isSelecting ? 'disabled' : ''}
          style="--move-type-color: ${typeColor}"
        >
          <div class="move-btn-inner">
            <span class="move-name">${move.displayName}</span>
            <div class="move-meta">
              <span class="move-type-badge" style="background:${typeColor}">${move.type.toUpperCase()}</span>
              <span class="move-category">${isPhysical ? '⚔️' : isSpecial ? '✨' : '🌀'}</span>
              <span class="move-power">${move.power > 0 ? `PWR ${move.power}` : 'STATUS'}</span>
              <span class="move-pp ${move.pp <= move.maxPp * 0.25 ? 'pp-low' : ''}">PP ${move.pp}/${move.maxPp}</span>
            </div>
          </div>
        </button>
      `;
    }).join('');
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

    const overview = this.container.querySelector('#team-overview');
    if (overview) {
      overview.innerHTML = bs.playerTeam.map((p, i) =>
        renderPokemonPortrait(p, `portrait-${i}`, i === bs.activePlayerIndex)
      ).join('');
    }
  }

  private attachEvents(): void {
    // Move buttons
    this.container.addEventListener('click', async (e) => {
      const btn = (e.target as HTMLElement).closest('[data-move-index]') as HTMLElement;
      if (btn && !this.isAnimating) {
        const idx = parseInt(btn.dataset['moveIndex'] ?? '0');
        await this.executeTurn(idx);
      }
    });

    // Auto-battle toggle
    const autoToggle = this.container.querySelector<HTMLInputElement>('#auto-battle-toggle');
    if (autoToggle) {
      autoToggle.addEventListener('change', () => {
        const bs = this.state.battleState!;
        bs.autoBattle = autoToggle.checked;
        this.renderMoveButtons();
        if (bs.autoBattle) {
          this.startAutoMode();
        } else {
          this.stopAutoMode();
        }
      });
    }

    // God Mode
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
      const bs = this.state.battleState;
      if (bs.phase !== 'selecting' || bs.winner) return;

      const playerMon = bs.playerTeam[bs.activePlayerIndex];
      const enemyMon = bs.enemyTeam[bs.activeEnemyIndex];
      const move = aiSelectMove(playerMon, enemyMon, this.state.activePerks);
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

    const logEl = this.container.querySelector<HTMLElement>('#battle-log')!;

    const doPlayerAttack = async () => {
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

    this.isFirstMove = false;

    // End of turn
    if (!bs.winner) {
      await this.applyEndOfTurnEffects(logEl);
    }

    bs.turn++;
    this.isAnimating = false;

    if (!bs.winner) {
      bs.phase = 'selecting';
      this.renderMoveButtons();
    }
  }

  private async performAttack(
    side: 'player' | 'enemy',
    attacker: BattlePokemon,
    defender: BattlePokemon,
    move: Move,
    logEl: HTMLElement
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

    // Attack animation
    if (attackerSpriteEl) {
      await attackAnimation(attackerSpriteEl, side === 'player' ? 'right' : 'left');
    }

    // Check if move hits
    const hits = checkMoveHits(attacker, move, this.state.activePerks);
    if (!hits) {
      this.addLog(logEl, { text: `${attacker.displayName}'s attack missed!`, type: 'normal' });
      if (attackerSpriteEl) shakeElement(attackerSpriteEl);
      return;
    }

    // Status move handling
    if (move.category === 'status') {
      await this.applyStatusMove(attacker, defender, move, logEl);
      return;
    }

    // Calculate damage
    const result = calculateDamage(attacker, defender, move, this.state.activePerks, this.isFirstMove);

    if (result.isImmune) {
      this.addLog(logEl, { text: `It has no effect on ${defender.displayName}!`, type: 'immune' });
      if (defenderSpriteEl) shakeElement(defenderSpriteEl);
      return;
    }

    // Effectiveness messages
    const effectLabel = getEffectivenessLabel(result.effectiveness);
    if (effectLabel) {
      this.addLog(logEl, {
        text: effectLabel,
        type: result.effectiveness > 1 ? 'super_effective' : 'not_effective',
      });
    }

    if (result.isCritical) {
      this.addLog(logEl, { text: 'A critical hit!', type: 'critical' });
    }

    // Apply damage
    const { actualDamage, fainted, log: dmgLog } = applyDamage(
      defender, result.damage, move, this.state.activePerks
    );

    this.state.runStats.totalDamageDealt += actualDamage;

    // Update UI
    if (defenderSpriteEl) {
      // Type-specific particle effect
      if (attackerSpriteEl) {
        await showTypeAttackEffect(move.type, attackerSpriteEl, defenderSpriteEl);
      }
      await hitAnimation(defenderSpriteEl);
      const dmgType = result.isCritical ? 'critical'
        : result.effectiveness > 1 ? 'super_effective'
        : result.effectiveness < 1 ? 'not_effective'
        : 'damage';
      showDamageNumber(defenderSpriteEl, actualDamage, dmgType);
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

    // Double hit perk
    if (!fainted && this.state.activePerks.some(p => p.id === 'double_up') && Math.random() < 0.15) {
      const result2 = calculateDamage(attacker, defender, move, this.state.activePerks, false);
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
      if (defenderSpriteEl) await faintAnimation(defenderSpriteEl);
      await this.handleFaint(side === 'player' ? 'enemy' : 'player', defenderSpriteEl, logEl);
    }
  }

  private async applyStatusMove(
    attacker: BattlePokemon,
    defender: BattlePokemon,
    move: Move,
    logEl: HTMLElement
  ): Promise<void> {
    // Simplified status move handling
    this.addLog(logEl, { text: `${attacker.displayName} used ${move.displayName}!`, type: 'normal' });
    // Most status moves just give a slight log entry
    await new Promise(r => setTimeout(r, 300));
  }

  private async applyMoveEffect(
    move: Move,
    target: BattlePokemon,
    logEl: HTMLElement
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

  private async applyEndOfTurnEffects(logEl: HTMLElement): Promise<void> {
    const bs = this.state.battleState!;
    const allMons = [
      ...bs.playerTeam.slice(0, bs.activePlayerIndex + 1).slice(-1),
      ...bs.enemyTeam.slice(0, bs.activeEnemyIndex + 1).slice(-1),
    ];

    for (const mon of allMons) {
      if (mon.battleHp <= 0) continue;

      // Status damage
      const { damage, log: statusLog } = applyEndOfTurnStatus(mon);
      statusLog.forEach(e => this.addLog(logEl, e));
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
    logEl: HTMLElement
  ): Promise<void> {
    const bs = this.state.battleState!;
    const isPlayerFainted = faintedSide === 'player';

    if (isPlayerFainted) {
      // Synergy Link perk
      if (this.state.activePerks.some(p => p.id === 'synergy_link')) {
        const nextMon = bs.playerTeam[bs.activePlayerIndex + 1];
        if (nextMon) {
          nextMon.statStages.attack = Math.min(6, nextMon.statStages.attack + 2);
          nextMon.statStages.spAtk = Math.min(6, nextMon.statStages.spAtk + 2);
          nextMon.statStages.defense = Math.min(6, nextMon.statStages.defense + 2);
          nextMon.statStages.spDef = Math.min(6, nextMon.statStages.spDef + 2);
          nextMon.statStages.speed = Math.min(6, nextMon.statStages.speed + 2);
        }
      }

      bs.activePlayerIndex++;
      if (bs.activePlayerIndex >= bs.playerTeam.length ||
          bs.playerTeam.slice(bs.activePlayerIndex).every(p => p.battleHp <= 0)) {
        bs.winner = 'enemy';
        await this.endBattle(false);
        return;
      }

      // Switch in next Pokemon
      const nextMon = bs.playerTeam[bs.activePlayerIndex];
      this.addLog(logEl, { text: `Go, ${nextMon.displayName}!`, type: 'system' });
      this.rerenderBattleSprites();
      const spriteEl = this.container.querySelector<HTMLElement>('#player-active-sprite');
      if (spriteEl) enterAnimation(spriteEl);
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
        const { leveledUp, newLevel } = grantXP(attacker, xpGain, this.state.activePerks);
        this.addLog(logEl, {
          text: `${attacker.displayName} gained ${xpGain} XP!`,
          type: 'system',
        });
        if (leveledUp) {
          this.addLog(logEl, {
            text: `⬆ ${attacker.displayName} grew to Lv.${newLevel}!`,
            type: 'system',
          });
          this.updateHPDisplay(attacker, bs);
          this.renderTeamPortraits();

          // Check for level-based evolution
          if (
            !attacker.isFullyEvolved &&
            attacker.nextEvolutionId !== null &&
            attacker.evolutionLevel !== null &&
            newLevel >= attacker.evolutionLevel
          ) {
            attacker.pendingEvolution = true;
            this.addLog(logEl, {
              text: `✨ ${attacker.displayName} is ready to evolve!`,
              type: 'system',
            });
          }
        }
      }
      // ─────────────────────────────────────────────────────────

      bs.activeEnemyIndex++;
      if (bs.activeEnemyIndex >= bs.enemyTeam.length ||
          bs.enemyTeam.slice(bs.activeEnemyIndex).every(p => p.battleHp <= 0)) {
        bs.winner = 'player';
        await this.endBattle(true);
        return;
      }

      // Switch in next enemy
      const nextEnemy = bs.enemyTeam[bs.activeEnemyIndex];
      this.addLog(logEl, { text: `Enemy sent out ${nextEnemy.displayName}!`, type: 'system' });
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
    }
    if (enemyCombatant) {
      enemyCombatant.innerHTML =
        renderBattleInfoCard(enemyMon, 'enemy-active', 'enemy') +
        `<div class="battle-sprite-slot enemy-sprite-slot" id="enemy-battle-area">${renderBattleSpriteImg(enemyMon, 'enemy-active')}</div>`;
    }

    this.renderMoveButtons();
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

    await new Promise(r => setTimeout(r, 1500));

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
    }

    this.onBattleEnd(this.state);
  }

  private addLog(logEl: HTMLElement, entry: BattleLogEntry): void {
    appendLogEntry(logEl, entry);
    this.state.battleState?.log.push(entry);
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
    showToast('⚡ GOD MODE ACTIVATED! Team fully restored!', 'success');

    // Remove god mode button
    const btn = this.container.querySelector('#god-mode-btn');
    if (btn) btn.remove();
  }

  unmount(): void {
    this.stopAutoMode();
    this.container.style.display = 'none';
    this.container.innerHTML = '';
  }
}
