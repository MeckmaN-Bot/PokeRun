import type {
  BattlePokemon, Move, Perk, DamageResult, BattleLogEntry,
  StatusEffect, StatStages, BaseStats, PokemonType,
} from '../types';
import { getTypeEffectiveness } from '../data/typeChart';
import { calcStat } from '../api/pokeapi';

// ============================================================
// Stat Stage Multiplier
// ============================================================

export function getStageMultiplier(stage: number): number {
  // Stages -6 to +6
  const table: Record<number, number> = {
    [-6]: 2/8, [-5]: 2/7, [-4]: 2/6, [-3]: 2/5, [-2]: 2/4, [-1]: 2/3,
    [0]: 1,
    [1]: 3/2, [2]: 4/2, [3]: 5/2, [4]: 6/2, [5]: 7/2, [6]: 8/2,
  };
  return table[Math.max(-6, Math.min(6, stage))] ?? 1;
}

export function getAccuracyStageMultiplier(stage: number): number {
  const table: Record<number, number> = {
    [-6]: 3/9, [-5]: 3/8, [-4]: 3/7, [-3]: 3/6, [-2]: 3/5, [-1]: 3/4,
    [0]: 1,
    [1]: 4/3, [2]: 5/3, [3]: 6/3, [4]: 7/3, [5]: 8/3, [6]: 9/3,
  };
  return table[Math.max(-6, Math.min(6, stage))] ?? 1;
}

// ============================================================
// Effective Stats (with stage modifiers)
// ============================================================

export function getEffectiveStat(pokemon: BattlePokemon, stat: keyof BaseStats): number {
  const base = pokemon.effectiveStats[stat];
  const stageKey = stat as keyof StatStages;
  const stage = stageKey in pokemon.statStages ? pokemon.statStages[stageKey as keyof StatStages] : 0;
  return Math.floor(base * getStageMultiplier(stage));
}

// ============================================================
// Damage Calculation
// ============================================================

export function calculateDamage(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: Move,
  perks: Perk[],
  isFirstMove: boolean = false
): DamageResult {
  if (move.power === 0 || move.category === 'status') {
    return { damage: 0, effectiveness: 1, isCritical: false, isImmune: false };
  }

  // Check type immunity
  const rawEffectiveness = getTypeEffectiveness(move.type, defender.types);

  // Type Erase perk overrides immunities/resistances to neutral
  const typeEraseActive = perks.some(p => p.id === 'type_erase');
  const effectiveness = typeEraseActive ? 1 : rawEffectiveness;

  if (effectiveness === 0) {
    return { damage: 0, effectiveness: 0, isCritical: false, isImmune: true };
  }

  // Air Balloon immunity to Ground
  if (move.type === 'ground' && defender.hasAirBalloon) {
    return { damage: 0, effectiveness: 0, isCritical: false, isImmune: true };
  }

  const level = attacker.level;
  const power = move.power;

  // Physical vs Special
  let atkStat: number;
  let defStat: number;
  if (move.category === 'physical') {
    atkStat = getEffectiveStat(attacker, 'attack');
    defStat = getEffectiveStat(defender, 'defense');
  } else {
    atkStat = getEffectiveStat(attacker, 'spAtk');
    defStat = getEffectiveStat(defender, 'spDef');
  }

  // Burn halves physical attack
  if (attacker.battleStatus === 'burn' && move.category === 'physical') {
    atkStat = Math.floor(atkStat * 0.5);
  }

  // Paralysis halves Speed (handled elsewhere) but not attack

  // Base damage formula
  let damage = Math.floor(
    (Math.floor((2 * level / 5 + 2) * power * atkStat / defStat) / 50) + 2
  );

  // Critical hit
  let critChance = 0.0625; // 6.25% base
  if (perks.some(p => p.id === 'lucky_streak')) critChance += 0.03;
  if (perks.some(p => p.id === 'adrenaline_rush') && isFirstMove) critChance = 1;
  if (attacker.heldItem?.id === 'scope_lens') critChance = 0.125;
  const isCritical = Math.random() < critChance;
  if (isCritical) damage = Math.floor(damage * 1.5);

  // STAB
  let stab = 1;
  if (attacker.types.includes(move.type)) {
    if (perks.some(p => p.id === 'adaptability')) {
      stab = 2.0;
    } else {
      stab = perks.some(p => p.id === 'stab_boost') ? 1.6 : 1.5;
    }
  }
  damage = Math.floor(damage * stab);

  // Type effectiveness
  damage = Math.floor(damage * effectiveness);

  // Random factor (85–100%)
  const random = 0.85 + Math.random() * 0.15;
  damage = Math.floor(damage * random);

  // === Item Effects ===

  // Life Orb
  if (attacker.heldItem?.id === 'life_orb') {
    damage = Math.floor(damage * 1.3);
  }

  // Expert Belt (super effective only)
  if (attacker.heldItem?.id === 'expert_belt' && effectiveness > 1) {
    damage = Math.floor(damage * 1.2);
  }

  // Muscle Band (physical only)
  if (attacker.heldItem?.id === 'muscle_band' && move.category === 'physical') {
    damage = Math.floor(damage * 1.1);
  }

  // Wise Glasses (special only)
  if (attacker.heldItem?.id === 'wise_glasses' && move.category === 'special') {
    damage = Math.floor(damage * 1.1);
  }

  // Type-boosting items
  if (attacker.heldItem?.effect.typePowerBoost) {
    const { type, multiplier } = attacker.heldItem.effect.typePowerBoost;
    if (move.type === type) {
      damage = Math.floor(damage * multiplier);
    }
  }

  // Mega Stone
  if (attacker.heldItem?.id === 'mega_stone') {
    damage = Math.floor(damage * 1.3);
  }

  // Z-Crystal (handled separately via z-move UI)

  // === Perk Effects ===

  // Death's Door Power (< 25% HP)
  const hpRatio = attacker.battleHp / attacker.maxBattleHp;
  if (hpRatio < 0.25 && perks.some(p => p.id === 'deaths_door')) {
    damage = Math.floor(damage * 2);
  }

  // Speed Demons
  if (
    perks.some(p => p.id === 'speed_demons') &&
    getEffectiveStat(attacker, 'speed') > getEffectiveStat(defender, 'speed')
  ) {
    damage = Math.floor(damage * 1.2);
  }

  // Dual Threat (attacker has 2 types)
  if (perks.some(p => p.id === 'dual_threat') && attacker.types.length >= 2) {
    damage = Math.floor(damage * 1.15);
  }

  // Evolution Power
  if (perks.some(p => p.id === 'evolution_power') && attacker.isFullyEvolved) {
    damage = Math.floor(damage * 1.1);
  }

  // Legendary Aura
  if (perks.some(p => p.id === 'legendary_aura')) {
    damage = Math.floor(damage * 1.1);
  }

  // Mega Evolution perk
  if (perks.some(p => p.id === 'mega_evolution')) {
    damage = Math.floor(damage * 1.3);
  }

  // Chain Reaction bonus
  const chainPerk = perks.find(p => p.id === 'chain_reaction');
  if (chainPerk) {
    const bonus = 1 + (chainPerk.effect.chainKOBonus ?? 0);
    damage = Math.floor(damage * bonus);
  }

  // Z-Power Aura
  if (perks.some(p => p.id === 'z_power_aura')) {
    damage = Math.floor(damage * 1.15);
  }

  // Type Coverage (6+ types)
  // Handled in main.ts when applying the perk

  // Minimum 1 damage
  return {
    damage: Math.max(1, damage),
    effectiveness,
    isCritical,
    isImmune: false,
  };
}

// ============================================================
// Move Accuracy Check
// ============================================================

export function checkMoveHits(attacker: BattlePokemon, move: Move, perks: Perk[]): boolean {
  if (move.accuracy === 0 || move.accuracy === null) return true; // Always hit

  let accuracy = move.accuracy / 100;

  // Wide Lens
  if (attacker.heldItem?.id === 'wide_lens') accuracy *= 1.1;

  // Sharp Senses perk
  if (perks.some(p => p.id === 'sharp_senses')) accuracy *= 1.05;

  // Accuracy stage
  const accStage = attacker.statStages.accuracy ?? 0;
  const evaStage = 0; // defender evasion not tracked per-pokemon in simplification
  const stageMulti = getAccuracyStageMultiplier(accStage - evaStage);
  accuracy *= stageMulti;

  return Math.random() < accuracy;
}

// ============================================================
// Status Effect Application
// ============================================================

export function canInflictStatus(target: BattlePokemon, status: StatusEffect): boolean {
  if (target.battleStatus !== null) return false;

  // Type immunities
  if (status === 'burn' && target.types.includes('fire')) return false;
  if (status === 'freeze' && target.types.includes('ice')) return false;
  if ((status === 'poison' || status === 'badPoison') && (
    target.types.includes('poison') || target.types.includes('steel')
  )) return false;
  if (status === 'paralysis' && target.types.includes('electric')) return false;

  return true;
}

// ============================================================
// AI Move Selection
// ============================================================

export function aiSelectMove(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  perks: Perk[]
): Move {
  const usableMoves = attacker.moves.filter(m => m.pp > 0);
  if (usableMoves.length === 0) {
    // Struggle fallback
    return {
      id: -1, name: 'struggle', displayName: 'Struggle',
      type: 'normal', category: 'physical', power: 50, accuracy: 100,
      pp: 1, maxPp: 1, effect: '', effectChance: 0, priority: 0,
      isContact: true, isSoundBased: false, isPowder: false, isTwoTurn: false,
      target: 'selected-pokemon',
    };
  }

  // Choice lock
  if (attacker.choiceLockedMove && usableMoves.find(m => m.id === attacker.choiceLockedMove!.id)) {
    return attacker.choiceLockedMove;
  }

  // Score each move
  let bestMove = usableMoves[0];
  let bestScore = -Infinity;

  for (const move of usableMoves) {
    if (move.power === 0) continue; // Skip status moves for AI simplicity
    const effectiveness = getTypeEffectiveness(move.type, defender.types);
    const stab = attacker.types.includes(move.type) ? 1.5 : 1;
    const score = move.power * effectiveness * stab;
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

// ============================================================
// Turn Order Calculation
// ============================================================

export function determineTurnOrder(
  playerMon: BattlePokemon,
  enemyMon: BattlePokemon,
  playerMove: Move,
  enemyMove: Move,
  perks: Perk[]
): 'player' | 'enemy' {
  // Priority brackets
  if (playerMove.priority !== enemyMove.priority) {
    return playerMove.priority > enemyMove.priority ? 'player' : 'enemy';
  }

  // Quick Claw check
  const playerHasQuickClaw = playerMon.heldItem?.id === 'quick_claw';
  const enemyHasQuickClaw = enemyMon.heldItem?.id === 'quick_claw';
  if (playerHasQuickClaw && Math.random() < 0.2) return 'player';
  if (enemyHasQuickClaw && Math.random() < 0.2) return 'enemy';

  const playerSpeed = getEffectiveStat(playerMon, 'speed');
  const enemySpeed = getEffectiveStat(enemyMon, 'speed');

  // Paralysis halves speed
  const pSpeed = playerMon.battleStatus === 'paralysis' ? Math.floor(playerSpeed * 0.5) : playerSpeed;
  const eSpeed = enemyMon.battleStatus === 'paralysis' ? Math.floor(enemySpeed * 0.5) : enemySpeed;

  if (pSpeed > eSpeed) return 'player';
  if (eSpeed > pSpeed) return 'enemy';
  return Math.random() < 0.5 ? 'player' : 'enemy';
}

// ============================================================
// Status Effects — End-of-Turn
// ============================================================

export function applyEndOfTurnStatus(
  pokemon: BattlePokemon
): { damage: number; log: BattleLogEntry[] } {
  const log: BattleLogEntry[] = [];
  let damage = 0;

  if (pokemon.battleHp <= 0) return { damage, log };

  switch (pokemon.battleStatus) {
    case 'burn': {
      const d = Math.max(1, Math.floor(pokemon.maxBattleHp / 16));
      damage = d;
      log.push({ text: `${pokemon.displayName} is hurt by its burn! (−${d} HP)`, type: 'damage' });
      break;
    }
    case 'poison': {
      const d = Math.max(1, Math.floor(pokemon.maxBattleHp / 8));
      damage = d;
      log.push({ text: `${pokemon.displayName} is hurt by poison! (−${d} HP)`, type: 'damage' });
      break;
    }
    case 'badPoison': {
      pokemon.poisonCounter = (pokemon.poisonCounter ?? 1) + 1;
      const d = Math.max(1, Math.floor(pokemon.maxBattleHp * pokemon.poisonCounter / 16));
      damage = d;
      log.push({ text: `${pokemon.displayName} is badly poisoned! (−${d} HP)`, type: 'damage' });
      break;
    }
    case 'sleep': {
      pokemon.sleepTurns = (pokemon.sleepTurns ?? 1) + 1;
      if (pokemon.sleepTurns >= 3) {
        pokemon.battleStatus = null;
        pokemon.sleepTurns = 0;
        log.push({ text: `${pokemon.displayName} woke up!`, type: 'status' });
      }
      break;
    }
    case 'freeze': {
      if (Math.random() < 0.2) {
        pokemon.battleStatus = null;
        log.push({ text: `${pokemon.displayName} thawed out!`, type: 'status' });
      }
      break;
    }
  }

  return { damage, log };
}

// ============================================================
// Item End-of-Turn Effects
// ============================================================

export function applyEndOfTurnItems(
  pokemon: BattlePokemon
): { heal: number; log: BattleLogEntry[] } {
  const log: BattleLogEntry[] = [];
  let heal = 0;

  if (pokemon.battleHp <= 0) return { heal, log };

  const item = pokemon.heldItem;
  if (!item) return { heal, log };

  if (item.id === 'leftovers') {
    const h = Math.max(1, Math.floor(pokemon.maxBattleHp * 0.0625));
    if (pokemon.battleHp < pokemon.maxBattleHp) {
      heal = h;
      log.push({ text: `${pokemon.displayName} restored a little HP with Leftovers! (+${h} HP)`, type: 'heal' });
    }
  }

  if (item.id === 'black_sludge') {
    if (pokemon.types.includes('poison')) {
      const h = Math.max(1, Math.floor(pokemon.maxBattleHp * 0.0625));
      if (pokemon.battleHp < pokemon.maxBattleHp) {
        heal = h;
        log.push({ text: `${pokemon.displayName} absorbed toxins with Black Sludge! (+${h} HP)`, type: 'heal' });
      }
    } else {
      const d = Math.max(1, Math.floor(pokemon.maxBattleHp * 0.0625));
      heal = -d;
      log.push({ text: `${pokemon.displayName} is hurt by Black Sludge! (−${d} HP)`, type: 'damage' });
    }
  }

  return { heal, log };
}

// ============================================================
// Apply Damage to Pokemon
// ============================================================

export function applyDamage(
  pokemon: BattlePokemon,
  damage: number,
  move: Move | null,
  perks: Perk[]
): { actualDamage: number; fainted: boolean; focusSashTriggered: boolean; log: BattleLogEntry[] } {
  const log: BattleLogEntry[] = [];
  let actualDamage = damage;
  let focusSashTriggered = false;

  // Focus Sash
  const hasFocusSash = pokemon.heldItem?.id === 'focus_sash';
  const hasFocusSashAll = perks.some(p => p.id === 'immortal_grit');
  if (
    (hasFocusSash || hasFocusSashAll) &&
    !pokemon.hasUsedFocusSash &&
    pokemon.battleHp === pokemon.maxBattleHp &&
    actualDamage >= pokemon.battleHp
  ) {
    actualDamage = pokemon.battleHp - 1;
    pokemon.hasUsedFocusSash = true;
    focusSashTriggered = true;
    log.push({ text: `${pokemon.displayName} held on with its Focus Sash!`, type: 'system' });
  }

  pokemon.battleHp = Math.max(0, pokemon.battleHp - actualDamage);

  // Rocky Helmet recoil (handled in main battle loop)

  // Weakness Policy trigger
  if (move && getTypeEffectiveness(move.type, pokemon.types) > 1) {
    if (pokemon.heldItem?.id === 'weakness_policy') {
      pokemon.statStages.attack = Math.min(6, pokemon.statStages.attack + 2);
      pokemon.statStages.spAtk = Math.min(6, pokemon.statStages.spAtk + 2);
      log.push({ text: `${pokemon.displayName}'s Weakness Policy activated! Atk and SpAtk rose sharply!`, type: 'status' });
    }
  }

  // Air Balloon bursts
  if (pokemon.hasAirBalloon && move) {
    pokemon.hasAirBalloon = false;
    log.push({ text: `${pokemon.displayName}'s Air Balloon popped!`, type: 'system' });
  }

  const fainted = pokemon.battleHp <= 0;
  if (fainted) {
    log.push({ text: `${pokemon.displayName} fainted!`, type: 'system' });
  }

  return { actualDamage, fainted, focusSashTriggered, log };
}

// ============================================================
// Build BattlePokemon from base Pokemon
// ============================================================

export function toBattlePokemon(pokemon: import('../types').Pokemon, perks: Perk[]): BattlePokemon {
  // Apply perk stat multipliers
  let stats = { ...pokemon.baseStats };

  // All stats multiplier perks
  const allStatsMult = perks.reduce((acc, p) => {
    if (p.effect.allStatsMultiplier) return acc * p.effect.allStatsMultiplier;
    return acc;
  }, 1);

  // Per-stat multipliers
  const hpMult = perks.reduce((acc, p) => {
    if (p.effect.statMultiplier?.hp) return acc * p.effect.statMultiplier.hp;
    return acc;
  }, allStatsMult);

  const speedMult = perks.reduce((acc, p) => {
    if (p.effect.statMultiplier?.speed) return acc * p.effect.statMultiplier.speed;
    return acc;
  }, allStatsMult);

  const defMult = perks.reduce((acc, p) => {
    if (p.effect.statMultiplier?.defense) return acc * p.effect.statMultiplier.defense;
    return acc;
  }, allStatsMult);

  const spDefMult = perks.reduce((acc, p) => {
    if (p.effect.statMultiplier?.spDef) return acc * p.effect.statMultiplier.spDef;
    return acc;
  }, allStatsMult);

  // Apply eviolite
  const evioliteActive = !pokemon.isFullyEvolved && pokemon.heldItem?.id === 'eviolite';

  const effectiveStats: BaseStats = {
    hp: Math.floor(stats.hp * hpMult),
    attack: Math.floor(stats.attack * allStatsMult),
    defense: Math.floor(stats.defense * defMult * (evioliteActive ? 1.5 : 1)),
    spAtk: Math.floor(stats.spAtk * allStatsMult),
    spDef: Math.floor(stats.spDef * spDefMult * (evioliteActive ? 1.5 : 1)),
    speed: Math.floor(stats.speed * speedMult),
  };

  // Choice item speed boost
  if (pokemon.heldItem?.id === 'choice_scarf') {
    effectiveStats.speed = Math.floor(effectiveStats.speed * 1.5);
  }
  if (pokemon.heldItem?.id === 'choice_band') {
    effectiveStats.attack = Math.floor(effectiveStats.attack * 1.5);
  }
  if (pokemon.heldItem?.id === 'choice_specs') {
    effectiveStats.spAtk = Math.floor(effectiveStats.spAtk * 1.5);
  }

  // Assault Vest SpDef boost
  if (pokemon.heldItem?.id === 'assault_vest') {
    effectiveStats.spDef = Math.floor(effectiveStats.spDef * 1.5);
  }

  // Mega Stone HP boost
  if (pokemon.heldItem?.id === 'mega_stone') {
    effectiveStats.hp = Math.floor(effectiveStats.hp * 1.2);
  }

  const maxHp = effectiveStats.hp;

  // Preserve XP/level-up state when rebuilding an existing BattlePokemon
  const existingBattle = pokemon as Partial<BattlePokemon>;

  return {
    ...pokemon,
    battleHp: maxHp,
    maxBattleHp: maxHp,
    effectiveStats,
    statStages: { attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0, accuracy: 0, evasion: 0 },
    battleStatus: null,
    battleStatusTurns: 0,
    poisonCounter: 1,
    isConfused: false,
    confusionTurns: 0,
    hasUsedFocusSash: false,
    choiceLockedMove: null,
    hasUsedZMove: false,
    hasAirBalloon: pokemon.heldItem?.id === 'air_balloon',
    twoTurnMove: null,
    sleepTurns: 0,
    moves: pokemon.moves.map(m => ({ ...m })), // Fresh copy with PP
    xp: existingBattle.xp ?? 0,
    xpToNextLevel: xpForLevel(pokemon.level),
    pendingEvolution: existingBattle.pendingEvolution ?? false,
  };
}

// ============================================================
// Check if a pokemon can move (status checks)
// ============================================================

export function canMove(pokemon: BattlePokemon): { canMove: boolean; reason: string } {
  if (pokemon.battleStatus === 'sleep') {
    return { canMove: false, reason: `${pokemon.displayName} is fast asleep!` };
  }
  if (pokemon.battleStatus === 'freeze') {
    return { canMove: false, reason: `${pokemon.displayName} is frozen solid!` };
  }
  if (pokemon.battleStatus === 'paralysis' && Math.random() < 0.25) {
    return { canMove: false, reason: `${pokemon.displayName} is paralyzed! It can't move!` };
  }
  if (pokemon.isConfused) {
    pokemon.confusionTurns++;
    if (pokemon.confusionTurns >= 5) {
      pokemon.isConfused = false;
      pokemon.confusionTurns = 0;
      return { canMove: true, reason: `${pokemon.displayName} snapped out of confusion!` };
    }
    if (Math.random() < 0.33) {
      return { canMove: false, reason: `${pokemon.displayName} hurt itself in confusion!` };
    }
  }
  return { canMove: true, reason: '' };
}

// ============================================================
// Apply Heal to Pokemon
// ============================================================

export function healPokemon(pokemon: BattlePokemon, amount: number): number {
  const before = pokemon.battleHp;
  pokemon.battleHp = Math.min(pokemon.maxBattleHp, pokemon.battleHp + amount);
  return pokemon.battleHp - before;
}

// ============================================================
// XP / Leveling System
// ============================================================

/** XP required to reach the NEXT level from `level`. */
export function xpForLevel(level: number): number {
  return Math.floor(Math.pow(level, 1.5) * 10);
}

/** XP awarded for defeating an enemy at the given level. */
export function xpFromKO(enemyLevel: number): number {
  return Math.floor(enemyLevel * 15);
}

/**
 * Grant XP to a Pokémon. Handles multi-level-ups in one call.
 * Mutates the Pokémon in place.
 * Returns whether at least one level-up occurred.
 */
export function grantXP(
  pokemon: BattlePokemon,
  amount: number,
  perks: Perk[],
): { leveledUp: boolean; newLevel: number } {
  pokemon.xp += amount;
  let leveledUp = false;

  while (pokemon.xp >= pokemon.xpToNextLevel && pokemon.level < 100) {
    pokemon.xp -= pokemon.xpToNextLevel;
    pokemon.level++;
    pokemon.xpToNextLevel = xpForLevel(pokemon.level);
    leveledUp = true;

    // Recalculate effective stats for the new level
    const base = pokemon.baseStats;
    const allStatsMult = perks.reduce((acc, p) =>
      p.effect.allStatsMultiplier ? acc * p.effect.allStatsMultiplier : acc, 1);

    const newStats = {
      hp:      Math.floor(calcStat(base.hp,      pokemon.level, true)  * allStatsMult),
      attack:  Math.floor(calcStat(base.attack,  pokemon.level, false) * allStatsMult),
      defense: Math.floor(calcStat(base.defense, pokemon.level, false) * allStatsMult),
      spAtk:   Math.floor(calcStat(base.spAtk,   pokemon.level, false) * allStatsMult),
      spDef:   Math.floor(calcStat(base.spDef,   pokemon.level, false) * allStatsMult),
      speed:   Math.floor(calcStat(base.speed,   pokemon.level, false) * allStatsMult),
    };

    const oldMaxHp = pokemon.maxBattleHp;
    const hpGain = Math.max(0, newStats.hp - oldMaxHp);

    pokemon.effectiveStats = newStats;
    pokemon.maxBattleHp = newStats.hp;
    // Current HP gains the same amount the max HP grew (Pokémon-style level-up heal)
    pokemon.battleHp = Math.min(pokemon.maxBattleHp, pokemon.battleHp + hpGain);
  }

  return { leveledUp, newLevel: pokemon.level };
}
