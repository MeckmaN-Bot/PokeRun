import type { BattlePokemon, PokemonType } from '../types';
import { getSlotItems, monHasItem } from './battle';

export type SynergyColor = 'gold' | 'blue' | 'green' | 'red' | 'purple' | 'orange';

export interface ActiveSynergy {
  id: string;
  name: string;
  multiplier: number;
  description: string;
  color: SynergyColor;
  icon: string;
}

/**
 * Static catalog of every synergy id — single source of truth used by:
 *   - the StartScreen Synergy Codex modal (display)
 *   - systems/discoveries.ts (validation against the canonical id list)
 *
 * When you add a synergy to evaluateSynergies below, ADD AN ENTRY HERE TOO
 * or it won't show up in the codex and won't count toward the discovered total.
 *
 * Display order is intentional: positional → team-comp → item-combo →
 * held-item-effect → legendary jackpots → formation. Names mirror the
 * runtime base names (no runtime "×N" suffixes).
 */
export interface SynergyCatalogEntry {
  id: string;
  name: string;
  icon: string;
  color: SynergyColor;
  description: string;
}

export const SYNERGY_CATALOG: SynergyCatalogEntry[] = [
  // Positional
  { id: 'lead_vanguard', name: 'Lead Vanguard', icon: '◈', color: 'blue',
    description: 'Active Pokémon holds the lead slot in a team of 2+. Reward for keeping your frontrunner healthy.' },
  { id: 'last_stand', name: 'Last Stand', icon: '✦', color: 'red',
    description: 'Your last Pokémon standing after others have fainted. Fight from the brink and deal double damage.' },
  { id: 'formation_crest', name: 'Formation Lead', icon: '◈', color: 'blue',
    description: 'Formation Crest in the lead slot. Stacks with Lead Vanguard for a powerful double bonus.' },
  // Team composition
  { id: 'mono_legion', name: 'Mono Legion', icon: '◆', color: 'gold',
    description: 'Every living team member shares a type. Absolute purity grants tremendous power.' },
  { id: 'type_trio', name: 'Type Trio', icon: '◇', color: 'green',
    description: '3 or more living teammates share your type. Unity amplifies each strike.' },
  { id: 'type_bond', name: 'Type Bond', icon: '◇', color: 'green',
    description: '2 teammates share your type in a team of 3+. A bond begins to form.' },
  { id: 'trinity', name: 'Trinity', icon: '✦', color: 'gold',
    description: 'Your team covers Fire, Water and Grass. The eternal triangle grants balance.' },
  // Item combos
  { id: 'brute_force', name: 'Brute Force', icon: '▲', color: 'orange',
    description: 'Choice Band + Muscle Band. Double down on raw physical power for extra damage.' },
  { id: 'mind_surge', name: 'Mind Surge', icon: '⊙', color: 'purple',
    description: 'Choice Specs + Wise Glasses. Stack special attack for overwhelming mental force.' },
  { id: 'vampire_strike', name: 'Vampire Strike', icon: '◉', color: 'purple',
    description: 'Life Orb + Shell Bell. Drain back what you spend. Raw power with built-in sustain.' },
  { id: 'precision_hunter', name: 'Precision Hunter', icon: '⊙', color: 'gold',
    description: 'Scope Lens + Expert Belt. Critical hits on super-effective moves are devastating.' },
  { id: 'berserker', name: 'Berserker Soul', icon: '▲', color: 'red',
    description: 'Flame Orb + Choice Band. Embrace the burn — pain fuels unbridled fury.' },
  // Held-item effects
  { id: 'synergy_stone', name: 'Synergy Stone', icon: '◈', color: 'gold',
    description: 'Synergy Stone amplifies each other held item sharing this Pokémon\'s slots (+15% per item, max ×1.60).' },
  { id: 'rally_band', name: 'Rally Band', icon: '≋', color: 'blue',
    description: 'Rally Band: +8% per living teammate. The whole team fuels the individual.' },
  { id: 'type_enhancer', name: 'Type Master', icon: '◆', color: 'green',
    description: 'Type Enhancer fires when you use a STAB move with 3+ same-type allies. STAB pushed further.' },
  { id: 'momentum_badge', name: 'Momentum Badge', icon: '›', color: 'orange',
    description: 'Momentum Badge gains +10% per wave won (up to ×2.0 at 10 stacks).' },
  // Legendary jackpots
  { id: 'royal_arsenal', name: 'Royal Arsenal', icon: '♔', color: 'gold',
    description: 'Mega Stone + Z-Crystal — legendary weapons of kings, wielded by a single champion.' },
  { id: 'gilded_crown', name: 'Gilded Crown', icon: '♕', color: 'gold',
    description: 'Light Ball + Amulet Coin — brilliance and fortune intertwined for electric payday.' },
  { id: 'phoenix_oath', name: 'Phoenix Oath', icon: '✦', color: 'red',
    description: 'Revive Heart wielder at <30% HP — embrace the ashes. Your next strike burns brighter.' },
  { id: 'brilliant_beam', name: 'Brilliant Beam', icon: '★', color: 'gold',
    description: 'Light Ball + Mega Stone + Z-Crystal on an Electric-type — a once-in-a-run jackpot.' },
];

export interface SynergyContext {
  attacker: BattlePokemon;
  team: BattlePokemon[];
  slotIndex: number;
  moveType?: PokemonType;
}

export function evaluateSynergies(ctx: SynergyContext): {
  totalMultiplier: number;
  activeSynergies: ActiveSynergy[];
} {
  const { attacker, team, slotIndex, moveType } = ctx;
  const aliveTeam = team.filter(p => p.battleHp > 0);
  const activeSynergies: ActiveSynergy[] = [];
  let mult = 1.0;

  const items = getSlotItems(attacker);
  const primaryType = attacker.types[0];

  // ── POSITION EFFECTS ────────────────────────────────────────

  if (slotIndex === 0 && team.length >= 2) {
    const b = 1.15;
    activeSynergies.push({
      id: 'lead_vanguard', name: 'Lead Vanguard', multiplier: b, color: 'blue', icon: '◈',
      description: 'Active Pokémon holds the lead slot in a team of 2+. Reward for keeping your frontrunner healthy.',
    });
    mult *= b;
  }

  if (aliveTeam.length === 1 && team.length >= 2 && attacker.battleHp > 0) {
    const b = 2.0;
    activeSynergies.push({
      id: 'last_stand', name: 'Last Stand', multiplier: b, color: 'red', icon: '✦',
      description: 'Your last Pokémon standing after others have fainted. Fight from the brink and deal double damage.',
    });
    mult *= b;
  }

  // ── TYPE SYNERGIES ──────────────────────────────────────────

  const aliveWithPrimary = aliveTeam.filter(p => p.types.includes(primaryType)).length;
  const totalAlive = aliveTeam.length;

  if (totalAlive >= 3 && aliveWithPrimary === totalAlive) {
    const b = 2.0;
    activeSynergies.push({
      id: 'mono_legion', name: 'Mono Legion', multiplier: b, color: 'gold', icon: '◆',
      description: 'Every living team member shares a type. Absolute purity grants tremendous power.',
    });
    mult *= b;
  } else if (aliveWithPrimary >= 3) {
    const b = 1.35;
    activeSynergies.push({
      id: 'type_trio', name: 'Type Trio', multiplier: b, color: 'green', icon: '◇',
      description: '3 or more living teammates share your type. Unity amplifies each strike.',
    });
    mult *= b;
  } else if (aliveWithPrimary >= 2 && totalAlive >= 3) {
    const b = 1.15;
    activeSynergies.push({
      id: 'type_bond', name: 'Type Bond', multiplier: b, color: 'green', icon: '◇',
      description: '2 teammates share your type in a team of 3+. A bond begins to form.',
    });
    mult *= b;
  }

  const aliveTypes = new Set(aliveTeam.flatMap(p => p.types));
  if (aliveTypes.has('fire') && aliveTypes.has('water') && aliveTypes.has('grass')) {
    const b = 1.15;
    activeSynergies.push({
      id: 'trinity', name: 'Trinity', multiplier: b, color: 'gold', icon: '✦',
      description: 'Your team covers Fire, Water and Grass. The eternal triangle grants balance.',
    });
    mult *= b;
  }

  // ── ITEM COMBO SYNERGIES ────────────────────────────────────

  const hasChoiceBand  = monHasItem(attacker, 'choice_band');
  const hasMuscle      = monHasItem(attacker, 'muscle_band');
  const hasChoiceSpecs = monHasItem(attacker, 'choice_specs');
  const hasWiseGlasses = monHasItem(attacker, 'wise_glasses');
  const hasLifeOrb     = monHasItem(attacker, 'life_orb');
  const hasShellBell   = monHasItem(attacker, 'shell_bell');
  const hasScopeLens   = monHasItem(attacker, 'scope_lens');
  const hasExpertBelt  = monHasItem(attacker, 'expert_belt');
  const hasFlameOrb    = monHasItem(attacker, 'flame_orb');

  if (hasChoiceBand && hasMuscle) {
    const b = 1.20;
    activeSynergies.push({
      id: 'brute_force', name: 'Brute Force', multiplier: b, color: 'orange', icon: '▲',
      description: 'Choice Band + Muscle Band. Double down on raw physical power for extra damage.',
    });
    mult *= b;
  }

  if (hasChoiceSpecs && hasWiseGlasses) {
    const b = 1.20;
    activeSynergies.push({
      id: 'mind_surge', name: 'Mind Surge', multiplier: b, color: 'purple', icon: '⊙',
      description: 'Choice Specs + Wise Glasses. Stack special attack for overwhelming mental force.',
    });
    mult *= b;
  }

  if (hasFlameOrb && hasChoiceBand) {
    const b = 1.30;
    activeSynergies.push({
      id: 'berserker', name: 'Berserker Soul', multiplier: b, color: 'red', icon: '▲',
      description: 'Flame Orb + Choice Band. Embrace the burn — pain fuels unbridled fury.',
    });
    mult *= b;
  }

  if (hasLifeOrb && hasShellBell) {
    const b = 1.15;
    activeSynergies.push({
      id: 'vampire_strike', name: 'Vampire Strike', multiplier: b, color: 'purple', icon: '◉',
      description: 'Life Orb + Shell Bell. Drain back what you spend. Raw power with built-in sustain.',
    });
    mult *= b;
  }

  if (hasScopeLens && hasExpertBelt) {
    const b = 1.20;
    activeSynergies.push({
      id: 'precision_hunter', name: 'Precision Hunter', multiplier: b, color: 'gold', icon: '⊙',
      description: 'Scope Lens + Expert Belt. Critical hits on super-effective moves are devastating.',
    });
    mult *= b;
  }

  // ── SYNERGY ITEM EFFECTS ────────────────────────────────────

  if (monHasItem(attacker, 'synergy_stone')) {
    const others = items.filter(i => i.id !== 'synergy_stone').length;
    if (others > 0) {
      const b = 1 + Math.min(4, others) * 0.15;
      activeSynergies.push({
        id: 'synergy_stone', name: `Synergy Stack ×${others}`, multiplier: b, color: 'gold', icon: '◈',
        description: `Synergy Stone amplifies each other held item sharing this Pokémon's slots (+15% per item, max ×1.60).`,
      });
      mult *= b;
    }
  }

  if (monHasItem(attacker, 'rally_band')) {
    const count = aliveTeam.length;
    const b = 1 + count * 0.08;
    activeSynergies.push({
      id: 'rally_band', name: `Rally ×${count}`, multiplier: b, color: 'blue', icon: '≋',
      description: `Rally Band: +8% per living teammate. The whole team fuels the individual.`,
    });
    mult *= b;
  }

  if (monHasItem(attacker, 'type_enhancer')) {
    const targetType = moveType ?? primaryType;
    const aliveWithMove = aliveTeam.filter(p => p.types.includes(targetType)).length;
    if (moveType && attacker.types.includes(moveType) && aliveWithMove >= 3) {
      const b = 1.35;
      activeSynergies.push({
        id: 'type_enhancer', name: 'Type Master', multiplier: b, color: 'green', icon: '◆',
        description: 'Type Enhancer fires when you use a STAB move with 3+ same-type allies. STAB pushed further.',
      });
      mult *= b;
    }
  }

  if (monHasItem(attacker, 'momentum_badge')) {
    const stacks = attacker.momentumStacks ?? 0;
    if (stacks > 0) {
      const b = 1 + Math.min(10, stacks) * 0.10;
      activeSynergies.push({
        id: 'momentum_badge', name: `Momentum ×${stacks}`, multiplier: b, color: 'orange', icon: '›',
        description: `Momentum Badge gains +10% per wave won (up to ×2.0 at 10 stacks). Current: ${stacks} stack${stacks !== 1 ? 's' : ''}.`,
      });
      mult *= b;
    }
  }

  // ── LEGENDARY JACKPOT COMBOS ────────────────────────────────

  const hasMegaStone   = monHasItem(attacker, 'mega_stone');
  const hasZCrystal    = monHasItem(attacker, 'z_crystal');
  const hasLightBall   = monHasItem(attacker, 'light_ball');
  const hasReviveHeart = monHasItem(attacker, 'revive_heart');
  const hasAmuletCoin  = monHasItem(attacker, 'amulet_coin');

  if (hasMegaStone && hasZCrystal) {
    const b = 1.50;
    activeSynergies.push({
      id: 'royal_arsenal', name: 'Royal Arsenal', multiplier: b, color: 'gold', icon: '♔',
      description: 'Mega Stone + Z-Crystal — legendary weapons of kings, wielded by a single champion.',
    });
    mult *= b;
  }

  if (hasLightBall && hasAmuletCoin) {
    const b = 1.30;
    activeSynergies.push({
      id: 'gilded_crown', name: 'Gilded Crown', multiplier: b, color: 'gold', icon: '♕',
      description: 'Light Ball + Amulet Coin — brilliance and fortune intertwined for electric payday.',
    });
    mult *= b;
  }

  if (hasReviveHeart && attacker.battleHp / attacker.maxBattleHp < 0.3) {
    const b = 1.40;
    activeSynergies.push({
      id: 'phoenix_oath', name: 'Phoenix Oath', multiplier: b, color: 'red', icon: '✦',
      description: 'Revive Heart wielder at <30% HP — embrace the ashes. Your next strike burns brighter.',
    });
    mult *= b;
  }

  // Triple-legend jackpot: all 3 Electric-rare items + primary type Electric → BRILLIANT BEAM
  if (hasLightBall && hasMegaStone && hasZCrystal && primaryType === 'electric') {
    const b = 1.75;
    activeSynergies.push({
      id: 'brilliant_beam', name: 'Brilliant Beam', multiplier: b, color: 'gold', icon: '★',
      description: 'Light Ball + Mega Stone + Z-Crystal on an Electric-type — a once-in-a-run jackpot.',
    });
    mult *= b;
  }

  if (monHasItem(attacker, 'formation_crest') && slotIndex === 0) {
    const b = 1.25;
    activeSynergies.push({
      id: 'formation_crest', name: 'Formation Lead', multiplier: b, color: 'blue', icon: '◈',
      description: 'Formation Crest in the lead slot. Stacks with Lead Vanguard for a powerful double bonus.',
    });
    mult *= b;
  }

  return { totalMultiplier: mult, activeSynergies };
}
