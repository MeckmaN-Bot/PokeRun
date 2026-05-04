import type {
  BattlePokemon, Move, Perk, DamageResult, BattleLogEntry,
  StatusEffect, StatStages, BaseStats, PokemonType, Item, ItemSlot, BattleState,
} from '../types';
import { defaultItemSlots } from '../types';
import { evaluateSynergies } from './synergies';
import { getTypeEffectiveness } from '../data/typeChart';
import { calcStat } from '../api/pokeapi';
import {
  blindDisablesSynergies,
  blindDisablesStab,
  blindDisablesItems,
} from '../data/bossBlinds';

// ============================================================
// Item Slot Helpers
// ============================================================

/** Returns all active (unlocked + filled) items across all slots. */
export function getSlotItems(mon: { itemSlots?: ItemSlot[]; heldItem?: Item | null }): Item[] {
  if (mon.itemSlots?.length) {
    return mon.itemSlots.filter(s => s.unlocked && s.item != null).map(s => s.item!);
  }
  return mon.heldItem ? [mon.heldItem] : [];
}

/** Checks if any unlocked slot holds an item with the given ID. */
export function monHasItem(
  mon: { itemSlots?: ItemSlot[]; heldItem?: Item | null },
  itemId: string,
): boolean {
  if (mon.itemSlots?.length) {
    return mon.itemSlots.some(s => s.unlocked && s.item?.id === itemId);
  }
  return mon.heldItem?.id === itemId;
}

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
  isFirstMove: boolean = false,
  teamCtx?: { team: BattlePokemon[]; slotIndex: number },
  battleCtx?: {
    bossBlind: import('../data/bossBlinds').BossBlindId | null;
    isPlayerAttacker: boolean;
    typeLevels?: Partial<Record<PokemonType, number>>;
    /** Mono-Type deck — when true, boost fires if alive team is fully one type. */
    monoDamageBoost?: boolean;
  }
): DamageResult {
  if (move.power === 0 || move.category === 'status') {
    return { damage: 0, effectiveness: 1, isCritical: false, isImmune: false };
  }

  // Boss-Blind: The Ox — first player attack deals 0
  if (battleCtx?.isPlayerAttacker && battleCtx.bossBlind === 'the_ox' && isFirstMove) {
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

  // Burn halves physical attack — but Guts (Flame Orb) boosts instead
  if (attacker.battleStatus === 'burn' && move.category === 'physical') {
    if (monHasItem(attacker, 'flame_orb')) {
      atkStat = Math.floor(atkStat * 1.5); // Guts: +50% under status
    } else {
      atkStat = Math.floor(atkStat * 0.5);
    }
  }
  // Also apply Guts for other statuses (poison, paralysis etc.) with Flame Orb carrier
  if (attacker.battleStatus && attacker.battleStatus !== 'burn' && move.category === 'physical') {
    if (monHasItem(attacker, 'flame_orb') || monHasItem(attacker, 'toxic_orb')) {
      atkStat = Math.floor(atkStat * 1.5);
    }
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
  if (monHasItem(attacker, 'scope_lens')) critChance = 0.125;
  const isCritical = Math.random() < critChance;
  const critMult = battleCtx?.bossBlind === 'the_needle' ? 3 : 1.5;
  if (isCritical) damage = Math.floor(damage * critMult);

  // STAB (disabled by The Serpent)
  let stab = 1;
  const stabActive = !blindDisablesStab(battleCtx?.bossBlind);
  // Type Lens — secondary type also gets STAB
  const hasTypeLens = monHasItem(attacker, 'type_lens') && !blindDisablesItems(battleCtx?.bossBlind);
  const stabMatches = stabActive && (
    attacker.types.includes(move.type) ||
    (hasTypeLens && attacker.types.length >= 2 && attacker.types[1] === move.type)
  );
  if (stabMatches) {
    if (perks.some(p => p.id === 'adaptability')) {
      stab = 2.0;
    } else {
      stab = perks.some(p => p.id === 'stab_boost') ? 1.6 : 1.5;
    }
  }
  damage = Math.floor(damage * stab);

  // The Needle — base damage ×0.5 (crit makes up for it via critMult above)
  if (battleCtx?.bossBlind === 'the_needle') {
    damage = Math.floor(damage * 0.5);
  }

  // Type effectiveness
  damage = Math.floor(damage * effectiveness);

  // Random factor (85–100%)
  const random = 0.85 + Math.random() * 0.15;
  damage = Math.floor(damage * random);

  // === Item Effects (all unlocked slots) ===
  // The Fish disables all held items
  const itemsDisabled = blindDisablesItems(battleCtx?.bossBlind);

  if (!itemsDisabled) {
    if (monHasItem(attacker, 'life_orb')) damage = Math.floor(damage * 1.3);
    if (monHasItem(attacker, 'expert_belt') && effectiveness > 1) damage = Math.floor(damage * 1.2);
    if (monHasItem(attacker, 'muscle_band') && move.category === 'physical') damage = Math.floor(damage * 1.1);
    if (monHasItem(attacker, 'wise_glasses') && move.category === 'special') damage = Math.floor(damage * 1.1);
    if (monHasItem(attacker, 'mega_stone')) damage = Math.floor(damage * 1.3);

    // Type-boosting items — check all slots
    for (const item of getSlotItems(attacker)) {
      if (item.effect.typePowerBoost) {
        const { type, multiplier } = item.effect.typePowerBoost;
        if (move.type === type) damage = Math.floor(damage * multiplier);
      }
    }
  }

  // Planet Card — +10% per type level on matching move type
  if (battleCtx?.typeLevels || perks.some(p => p.id === 'type_mastery')) {
    let tl = battleCtx?.typeLevels?.[move.type] ?? 0;
    // Type Mastery perk — +1 type level when 2+ teammates share primary type
    const tmPerk = perks.find(p => p.id === 'type_mastery');
    if (tmPerk?.effect.typeMasteryBonus && teamCtx) {
      const primary = attacker.types[0];
      if (primary === move.type) {
        const sharers = teamCtx.team.filter(p =>
          p.battleHp > 0 && p.types.includes(primary)).length;
        if (sharers >= 2) tl += tmPerk.effect.typeMasteryBonus;
      }
    }
    if (tl > 0) {
      damage = Math.floor(damage * (1 + tl * 0.1));
    }
  }

  // Z-Crystal (handled separately via z-move UI)

  // === Perk: typeBoost (per-type damage perks like Burn Cascade) ===
  for (const perk of perks) {
    if (perk.effect.typeBoost && perk.effect.typeBoost.type === move.type) {
      damage = Math.floor(damage * perk.effect.typeBoost.multiplier);
    }
  }

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

  // Backline Burner — slots 4 & 5 deal +30%
  if (teamCtx && teamCtx.slotIndex >= 3) {
    const blPerk = perks.find(p => p.id === 'backline_burner');
    if (blPerk?.effect.backlineDamageBonus) {
      damage = Math.floor(damage * blPerk.effect.backlineDamageBonus);
    }
  }

  // Type Coverage (6+ types)
  // Handled in main.ts when applying the perk

  // === Synergy Bonuses (player side only — teamCtx not passed for enemy) ===
  // The Mouth disables synergies entirely.
  if (teamCtx && !blindDisablesSynergies(battleCtx?.bossBlind)) {
    const { totalMultiplier, activeSynergies } = evaluateSynergies({
      attacker,
      team: teamCtx.team,
      slotIndex: teamCtx.slotIndex,
      moveType: move.type,
    });
    damage = Math.floor(damage * totalMultiplier);
    // Stash for UI display — clears each turn
    (attacker as any)._activeSynergies = activeSynergies;
  } else if (teamCtx) {
    (attacker as any)._activeSynergies = [];
  }

  // === Mono-Type deck damage boost (player side only) ===
  // +25% all damage when the alive team shares one primary type. Solo last-mon
  // counts as mono — committed to the deck.
  if (battleCtx?.monoDamageBoost && teamCtx) {
    const alive = teamCtx.team.filter(p => p.battleHp > 0);
    if (alive.length > 0) {
      const lead = alive[0].types[0];
      const allMono = alive.every(p => p.types[0] === lead);
      if (allMono) {
        damage = Math.floor(damage * 1.25);
      }
    }
  }

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
  if (monHasItem(attacker, 'wide_lens')) accuracy *= 1.1;

  // Sharp Senses perk
  if (perks.some(p => p.id === 'sharp_senses')) accuracy *= 1.05;

  // Status Stacker perk — +20% accuracy on status moves
  if (move.category === 'status') {
    const ssPerk = perks.find(p => p.id === 'status_stacker');
    if (ssPerk?.effect.statusStacker) accuracy *= ssPerk.effect.statusStacker.accuracyMult;
  }

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

  // Status-move opportunism: if the defender has no major status,
  // there's a 28% chance the AI picks a status move (if it has one that inflicts one).
  const defenderHasStatus = defender.battleStatus !== null;
  const statusInflictingMoves = usableMoves.filter(m => {
    if (m.category !== 'status' && m.power > 0) return false;
    const e = (m.effect ?? '').toLowerCase();
    return e.includes('burn') || e.includes('paralyz') || e.includes('poison') ||
           e.includes('sleep') || e.includes('freeze') || e.includes('confus');
  });
  if (!defenderHasStatus && statusInflictingMoves.length > 0 && Math.random() < 0.28) {
    // Pick a status move, preferring ones the defender isn't immune to
    const pool = statusInflictingMoves.filter(m => {
      const e = (m.effect ?? '').toLowerCase();
      // Basic type immunities
      if (e.includes('poison') && (defender.types.includes('poison') || defender.types.includes('steel'))) return false;
      if (e.includes('burn') && defender.types.includes('fire')) return false;
      if (e.includes('paralyz') && defender.types.includes('electric')) return false;
      if (e.includes('freeze') && defender.types.includes('ice')) return false;
      return true;
    });
    const src = pool.length > 0 ? pool : statusInflictingMoves;
    return src[Math.floor(Math.random() * src.length)];
  }

  // Score each damaging move
  let bestMove = usableMoves[0];
  let bestScore = -Infinity;

  for (const move of usableMoves) {
    if (move.power === 0) continue; // Skip pure status for damage scoring
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

/**
 * Smart move selection for player auto-battle.
 * Prefers most-effective damaging move (type, STAB, accuracy, atk/def stat ratio),
 * but rotates among near-best candidates weighted by remaining PP fraction
 * so PP doesn't deplete on a single move over a long run.
 */
export function playerAutoSelectMove(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  perks: Perk[],
): Move {
  const usableMoves = attacker.moves.filter(m => m.pp > 0);
  if (usableMoves.length === 0) {
    return {
      id: -1, name: 'struggle', displayName: 'Struggle',
      type: 'normal', category: 'physical', power: 50, accuracy: 100,
      pp: 1, maxPp: 1, effect: '', effectChance: 0, priority: 0,
      isContact: true, isSoundBased: false, isPowder: false, isTwoTurn: false,
      target: 'selected-pokemon',
    };
  }

  // Choice lock — forced
  if (attacker.choiceLockedMove && usableMoves.find(m => m.id === attacker.choiceLockedMove!.id)) {
    return attacker.choiceLockedMove;
  }

  void perks; // unused; kept for signature parity with aiSelectMove
  const stabBoost = 1.5;

  const atkStage = getStageMultiplier(attacker.statStages.attack ?? 0);
  const spAtkStage = getStageMultiplier(attacker.statStages.spAtk ?? 0);
  const defStage = getStageMultiplier(defender.statStages.defense ?? 0);
  const spDefStage = getStageMultiplier(defender.statStages.spDef ?? 0);

  const effAtk = (attacker.effectiveStats.attack ?? 1) * atkStage;
  const effSpAtk = (attacker.effectiveStats.spAtk ?? 1) * spAtkStage;
  const effDef = Math.max(1, (defender.effectiveStats.defense ?? 1) * defStage);
  const effSpDef = Math.max(1, (defender.effectiveStats.spDef ?? 1) * spDefStage);

  type Scored = { move: Move; score: number; effectiveness: number };
  const damaging: Scored[] = [];
  const statusMoves: Move[] = [];

  for (const move of usableMoves) {
    if (move.power <= 0) {
      statusMoves.push(move);
      continue;
    }
    const effectiveness = getTypeEffectiveness(move.type, defender.types);
    if (effectiveness === 0) continue; // never pick zero-effect
    const stab = attacker.types.includes(move.type) ? stabBoost : 1;
    const acc = (move.accuracy ?? 100) / 100;
    const ratio = move.category === 'special'
      ? effSpAtk / effSpDef
      : effAtk / effDef;
    let score = move.power * effectiveness * stab * acc * ratio;
    if (effectiveness >= 2) score *= 1.15; // mild SE bonus to break ties toward super-effective
    damaging.push({ move, score, effectiveness });
  }

  if (damaging.length === 0) {
    // No damaging hits land — fall back to any status/utility move, else first usable
    if (statusMoves.length > 0) {
      return statusMoves[Math.floor(Math.random() * statusMoves.length)];
    }
    return usableMoves[0];
  }

  // Find best, then candidates within 12% of best
  damaging.sort((a, b) => b.score - a.score);
  const best = damaging[0].score;
  const cutoff = best * 0.88;
  const candidates = damaging.filter(d => d.score >= cutoff);

  // Weighted-random by PP-fraction × score-share so fresher moves rotate in
  // but heavy underdogs don't sneak into a critical pick.
  let totalWeight = 0;
  const weights: number[] = candidates.map(c => {
    const ppFrac = c.move.maxPp > 0 ? c.move.pp / c.move.maxPp : 1;
    const scoreShare = c.score / best;
    const w = Math.max(0.01, scoreShare * (0.25 + ppFrac));
    totalWeight += w;
    return w;
  });

  let r = Math.random() * totalWeight;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i].move;
  }
  return candidates[candidates.length - 1].move;
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
  const playerHasQuickClaw = monHasItem(playerMon, 'quick_claw');
  const enemyHasQuickClaw = monHasItem(enemyMon, 'quick_claw');
  if (playerHasQuickClaw && Math.random() < 0.2) return 'player';
  if (enemyHasQuickClaw && Math.random() < 0.2) return 'enemy';

  let playerSpeed = getEffectiveStat(playerMon, 'speed');
  let enemySpeed = getEffectiveStat(enemyMon, 'speed');

  // Quick Powder — first turn only
  if (monHasItem(playerMon, 'quick_powder') && (playerMon.turnsInBattle ?? 0) === 0) {
    playerSpeed = Math.floor(playerSpeed * 1.25);
  }
  if (monHasItem(enemyMon, 'quick_powder') && (enemyMon.turnsInBattle ?? 0) === 0) {
    enemySpeed = Math.floor(enemySpeed * 1.25);
  }

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
      // Toxic Orb: Poison Heal — heal instead of taking damage
      if (monHasItem(pokemon, 'toxic_orb')) {
        const h = Math.max(1, Math.floor(pokemon.maxBattleHp * 0.12));
        damage = -h; // negative = heal in the caller
        log.push({ text: `${pokemon.displayName} recovered HP via Poison Heal! (+${h})`, type: 'heal' });
      } else {
        const d = Math.max(1, Math.floor(pokemon.maxBattleHp / 8));
        damage = d;
        log.push({ text: `${pokemon.displayName} is hurt by poison! (−${d} HP)`, type: 'damage' });
      }
      break;
    }
    case 'badPoison': {
      // Toxic Orb: Poison Heal
      if (monHasItem(pokemon, 'toxic_orb')) {
        const h = Math.max(1, Math.floor(pokemon.maxBattleHp * 0.12));
        damage = -h;
        log.push({ text: `${pokemon.displayName} recovered HP via Poison Heal! (+${h})`, type: 'heal' });
      } else {
        pokemon.poisonCounter = (pokemon.poisonCounter ?? 1) + 1;
        const d = Math.max(1, Math.floor(pokemon.maxBattleHp * pokemon.poisonCounter / 16));
        damage = d;
        log.push({ text: `${pokemon.displayName} is badly poisoned! (−${d} HP)`, type: 'damage' });
      }
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

  for (const item of getSlotItems(pokemon)) {
    if (item.id === 'leftovers') {
      const h = Math.max(1, Math.floor(pokemon.maxBattleHp * 0.0625));
      if (pokemon.battleHp < pokemon.maxBattleHp) {
        heal += h;
        log.push({ text: `${pokemon.displayName} restored HP with Leftovers! (+${h})`, type: 'heal' });
      }
    }

    if (item.id === 'black_sludge') {
      if (pokemon.types.includes('poison')) {
        const h = Math.max(1, Math.floor(pokemon.maxBattleHp * 0.0625));
        if (pokemon.battleHp < pokemon.maxBattleHp) { heal += h; log.push({ text: `${pokemon.displayName} absorbed toxins! (+${h})`, type: 'heal' }); }
      } else {
        const d = Math.max(1, Math.floor(pokemon.maxBattleHp * 0.0625));
        heal -= d;
        log.push({ text: `${pokemon.displayName} is hurt by Black Sludge! (−${d})`, type: 'damage' });
      }
    }

    // Toxic Orb — Poison Heal: heal instead of taking poison damage
    // (override handled in applyEndOfTurnStatus instead; mark active here)
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

  // Focus Sash (v2: survive at 1 HP, mark for wave-end destruction)
  const hasFocusSash = monHasItem(pokemon, 'focus_sash');
  const hasFocusSashAll = perks.some(p => p.id === 'immortal_grit');
  if (
    (hasFocusSash || hasFocusSashAll) &&
    !pokemon.hasUsedFocusSash &&
    pokemon.battleHp === pokemon.maxBattleHp &&
    actualDamage >= pokemon.battleHp
  ) {
    actualDamage = pokemon.battleHp - 1;
    pokemon.hasUsedFocusSash = true;
    if (hasFocusSash) pokemon.focusSashBroken = true; // destroy at wave end
    focusSashTriggered = true;
    log.push({ text: `${pokemon.displayName} held on with its Focus Sash!`, type: 'system' });
  }

  pokemon.battleHp = Math.max(0, pokemon.battleHp - actualDamage);

  // Oran Berry (v2: 15% max HP, <40% HP, once per wave)
  if (
    monHasItem(pokemon, 'oran_berry') &&
    !(pokemon.usedBerries ?? []).includes('oran_berry') &&
    pokemon.battleHp > 0 &&
    pokemon.battleHp / pokemon.maxBattleHp < 0.4
  ) {
    const h = Math.max(1, Math.floor(pokemon.maxBattleHp * 0.15));
    pokemon.battleHp = Math.min(pokemon.maxBattleHp, pokemon.battleHp + h);
    pokemon.usedBerries = [...(pokemon.usedBerries ?? []), 'oran_berry'];
    log.push({ text: `${pokemon.displayName} ate its Oran Berry! (+${h} HP)`, type: 'heal' });
  }

  // Sitrus Berry (v2: 25% max HP, <50% HP, recharge every 3 waves)
  if (
    monHasItem(pokemon, 'sitrus_berry') &&
    !(pokemon.usedBerries ?? []).includes('sitrus_berry') &&
    pokemon.battleHp > 0 &&
    pokemon.battleHp / pokemon.maxBattleHp < 0.5
  ) {
    const h = Math.max(1, Math.floor(pokemon.maxBattleHp * 0.25));
    pokemon.battleHp = Math.min(pokemon.maxBattleHp, pokemon.battleHp + h);
    pokemon.usedBerries = [...(pokemon.usedBerries ?? []), 'sitrus_berry'];
    log.push({ text: `${pokemon.displayName} ate its Sitrus Berry! (+${h} HP)`, type: 'heal' });
  }

  // Weakness Policy trigger
  if (move && getTypeEffectiveness(move.type, pokemon.types) > 1) {
    if (monHasItem(pokemon, 'weakness_policy')) {
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

  // Revive Heart: once per run, revive at 30% HP
  if (fainted && monHasItem(pokemon, 'revive_heart') && !pokemon.reviveHeartUsed) {
    const reviveHp = Math.max(1, Math.floor(pokemon.maxBattleHp * 0.3));
    pokemon.battleHp = reviveHp;
    pokemon.reviveHeartUsed = true;
    log.push({ text: `${pokemon.displayName}'s Revive Heart activated! It recovered ${reviveHp} HP!`, type: 'heal' });
    return { actualDamage, fainted: false, focusSashTriggered, log };
  }

  if (fainted) {
    log.push({ text: `${pokemon.displayName} fainted!`, type: 'system' });
  }

  return { actualDamage, fainted, focusSashTriggered, log };
}

// ============================================================
// Boss-Blind Helpers
// ============================================================

/**
 * The Tooth — heal enemy to 100% once when they cross 50% HP.
 * Returns true if a heal occurred.
 */
export function applyToothHealCheck(
  enemy: BattlePokemon,
  enemyIdx: number,
  bs: BattleState,
): { healed: boolean; log: BattleLogEntry[] } {
  const log: BattleLogEntry[] = [];
  if (bs.bossBlind !== 'the_tooth') return { healed: false, log };
  if (bs.toothHealedEnemies.includes(enemyIdx)) return { healed: false, log };
  if (enemy.battleHp <= 0) return { healed: false, log };
  const ratio = enemy.battleHp / enemy.maxBattleHp;
  if (ratio > 0 && ratio <= 0.5) {
    const heal = Math.floor(enemy.maxBattleHp * 0.5);
    enemy.battleHp = Math.min(enemy.maxBattleHp, enemy.battleHp + heal);
    bs.toothHealedEnemies.push(enemyIdx);
    log.push({ text: `${enemy.displayName}'s tooth bites back! Healed ${heal} HP!`, type: 'heal' });
    return { healed: true, log };
  }
  return { healed: false, log };
}

/**
 * The Hook — remove one random item from a random player pokemon each turn.
 */
export function applyHookItemLoss(bs: BattleState): BattleLogEntry[] {
  const log: BattleLogEntry[] = [];
  if (bs.bossBlind !== 'the_hook') return log;
  // Find players with items
  const candidates = bs.playerTeam.filter(p =>
    p.battleHp > 0 && p.itemSlots?.some(s => s.unlocked && s.item !== null)
  );
  if (candidates.length === 0) return log;
  const target = candidates[Math.floor(Math.random() * candidates.length)];
  const filledSlots = target.itemSlots
    .map((s, i) => ({ s, i }))
    .filter(x => x.s.unlocked && x.s.item !== null);
  if (filledSlots.length === 0) return log;
  const pick = filledSlots[Math.floor(Math.random() * filledSlots.length)];
  const lostItem = pick.s.item!;
  target.itemSlots[pick.i].item = null;
  if (pick.i === 0) target.heldItem = null;
  log.push({
    text: `The Hook snatches ${lostItem.name} from ${target.displayName}!`,
    type: 'system',
  });
  return log;
}

// ============================================================
// Build BattlePokemon from base Pokemon
// ============================================================

export function toBattlePokemon(pokemon: import('../types').Pokemon, perks: Perk[]): BattlePokemon {
  // Initialize / deep-copy item slots
  const itemSlots: ItemSlot[] = pokemon.itemSlots?.length
    ? pokemon.itemSlots.map(s => ({ ...s, item: s.item ? { ...s.item } : null }))
    : defaultItemSlots();

  // Build a temporary lookup object so monHasItem/getSlotItems work during construction
  const withSlots = { ...pokemon, itemSlots };

  // Sync legacy heldItem alias from slot 0
  const heldItem = itemSlots[0]?.item ?? null;

  // Apply perk stat multipliers
  const stats = { ...pokemon.baseStats };

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

  // Eviolite — check all slots
  const evioliteActive = !pokemon.isFullyEvolved && monHasItem(withSlots, 'eviolite');

  // All stats scale with level using the standard Pokemon formula (31 IVs, no EVs)
  const effectiveStats: BaseStats = {
    hp:      Math.floor(calcStat(stats.hp,      pokemon.level, true)  * hpMult),
    attack:  Math.floor(calcStat(stats.attack,  pokemon.level, false) * allStatsMult),
    defense: Math.floor(calcStat(stats.defense, pokemon.level, false) * defMult    * (evioliteActive ? 1.5 : 1)),
    spAtk:   Math.floor(calcStat(stats.spAtk,   pokemon.level, false) * allStatsMult),
    spDef:   Math.floor(calcStat(stats.spDef,   pokemon.level, false) * spDefMult  * (evioliteActive ? 1.5 : 1)),
    speed:   Math.floor(calcStat(stats.speed,   pokemon.level, false) * speedMult),
  };

  // Choice item boosts — check all slots
  if (monHasItem(withSlots, 'choice_scarf')) {
    effectiveStats.speed = Math.floor(effectiveStats.speed * 1.5);
  }
  if (monHasItem(withSlots, 'choice_band')) {
    effectiveStats.attack = Math.floor(effectiveStats.attack * 1.5);
  }
  if (monHasItem(withSlots, 'choice_specs')) {
    effectiveStats.spAtk = Math.floor(effectiveStats.spAtk * 1.5);
  }

  // Assault Vest SpDef boost
  if (monHasItem(withSlots, 'assault_vest')) {
    effectiveStats.spDef = Math.floor(effectiveStats.spDef * 1.5);
  }

  // Mega Stone HP boost (applied after level scaling)
  if (monHasItem(withSlots, 'mega_stone')) {
    effectiveStats.hp = Math.floor(effectiveStats.hp * 1.2);
  }

  // Light Ball — doubles Atk and SpAtk on weaker Pokémon (BST < 400)
  if (monHasItem(withSlots, 'light_ball') && pokemon.bst < 400) {
    effectiveStats.attack = effectiveStats.attack * 2;
    effectiveStats.spAtk = effectiveStats.spAtk * 2;
  }

  // Item Maven perk — per held item, +5% to all stats of the holder
  const mavenPerk = perks.find(p => p.id === 'item_maven');
  if (mavenPerk?.effect.itemMaven) {
    const heldCount = getSlotItems(withSlots).length;
    if (heldCount > 0) {
      const m = 1 + heldCount * mavenPerk.effect.itemMaven;
      effectiveStats.hp      = Math.floor(effectiveStats.hp      * m);
      effectiveStats.attack  = Math.floor(effectiveStats.attack  * m);
      effectiveStats.defense = Math.floor(effectiveStats.defense * m);
      effectiveStats.spAtk   = Math.floor(effectiveStats.spAtk   * m);
      effectiveStats.spDef   = Math.floor(effectiveStats.spDef   * m);
      effectiveStats.speed   = Math.floor(effectiveStats.speed   * m);
    }
  }

  const maxHp = effectiveStats.hp;

  // Preserve persistent battle state when rebuilding an existing BattlePokemon
  const existingBattle = pokemon as Partial<BattlePokemon>;

  const result: BattlePokemon = {
    ...pokemon,
    itemSlots,
    heldItem,
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
    hasAirBalloon: monHasItem(withSlots, 'air_balloon'),
    twoTurnMove: null,
    sleepTurns: 0,
    moves: pokemon.moves.map(m => ({ ...m })), // Fresh copy with full PP
    xp: existingBattle.xp ?? 0,
    xpToNextLevel: xpForLevel(pokemon.level),
    pendingEvolution: existingBattle.pendingEvolution ?? false,
    usedBerries: existingBattle.usedBerries ?? [],
    sitrusBerryLastUsedWave: existingBattle.sitrusBerryLastUsedWave ?? 0,
    focusSashBroken: false,
    reviveHeartUsed: existingBattle.reviveHeartUsed ?? false,
    leechSeedActive: monHasItem(withSlots, 'leech_seed'),
    momentumStacks: existingBattle.momentumStacks ?? 0,
  };

  // Battle-start self-inflicted status (Flame Orb → burn, Toxic Orb → badPoison)
  if (monHasItem(result, 'flame_orb')) {
    result.battleStatus = 'burn';
  } else if (monHasItem(result, 'toxic_orb')) {
    result.battleStatus = 'badPoison';
  }

  // Auto-unlock item slots based on current level
  autoUnlockSlotsForLevel(result);

  return result;
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

/** XP awarded for defeating an enemy at the given level.
 * Buffed from 40→55 to accelerate move-learning progression. */
export function xpFromKO(enemyLevel: number): number {
  return Math.floor(enemyLevel * 55);
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

    // Auto-unlock item slots at milestone levels — Lv.10/25/50/80
    autoUnlockSlotsForLevel(pokemon);
  }

  return { leveledUp, newLevel: pokemon.level };
}

/**
 * Unlocks item slots automatically as a Pokémon levels up.
 * Slot 2 (index 1) at Lv.10, Slot 3 at Lv.25, Slot 4 at Lv.50, Slot 5 at Lv.80.
 * Slot 1 (index 0) is always unlocked by default.
 */
export function autoUnlockSlotsForLevel(pokemon: BattlePokemon): number[] {
  const thresholds = [0, 10, 25, 50, 80]; // per-slot level requirement (slot 0 = always)
  const newlyUnlocked: number[] = [];
  if (!pokemon.itemSlots) return newlyUnlocked;
  for (let i = 0; i < pokemon.itemSlots.length && i < thresholds.length; i++) {
    const slot = pokemon.itemSlots[i];
    if (!slot.unlocked && pokemon.level >= thresholds[i]) {
      slot.unlocked = true;
      newlyUnlocked.push(i);
    }
  }
  return newlyUnlocked;
}
