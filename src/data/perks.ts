import type { Perk } from '../types';

export const ALL_PERKS: Perk[] = [
  // ===================== COMMON PERKS =====================
  {
    id: 'veteran_training', name: 'Veteran Training', rarity: 'common', icon: '◆',
    description: 'All Pokémon gain +7% to all stats.',
    effect: { allStatsMultiplier: 1.07 },
  },
  {
    id: 'stab_boost', name: 'Type STAB Boost', rarity: 'common', icon: '†',
    description: 'STAB bonus increased from 1.5× to 1.6×.',
    effect: { stabMultiplier: 1.6 },
  },
  {
    id: 'endurance', name: 'Endurance', rarity: 'common', icon: '▲',
    description: 'All Pokémon gain +10% max HP.',
    effect: { statMultiplier: { hp: 1.1 } },
  },
  {
    id: 'swift_feet', name: 'Swift Feet', rarity: 'common', icon: '›',
    description: 'All Pokémon gain +8% Speed.',
    effect: { statMultiplier: { speed: 1.08 } },
  },
  {
    id: 'iron_will', name: 'Iron Will', rarity: 'common', icon: '▽',
    description: 'All Pokémon gain +8% Defense.',
    effect: { statMultiplier: { defense: 1.08 } },
  },
  {
    id: 'mystic_mind', name: 'Mystic Mind', rarity: 'common', icon: '⊕',
    description: 'All Pokémon gain +8% Sp. Def.',
    effect: { statMultiplier: { spDef: 1.08 } },
  },
  {
    id: 'sharp_senses', name: 'Sharp Senses', rarity: 'common', icon: '⊙',
    description: 'Move accuracy +5% globally.',
    effect: { accuracyBonus: 1.05 },
  },
  {
    id: 'coin_collector', name: 'Coin Collector', rarity: 'common', icon: '¢',
    description: '+15% coins from all waves.',
    effect: { coinMultiplier: 1.15 },
  },
  {
    id: 'lucky_streak', name: 'Lucky Streak', rarity: 'common', icon: '✦',
    description: 'Critical hit rate slightly increased for all Pokémon.',
    effect: { critBoost: 0.03 },
  },
  {
    id: 'berry_feast', name: 'Berry Feast', rarity: 'common', icon: '❧',
    description: 'All Berry items trigger twice.',
    effect: { berryTriggerTwice: true },
  },
  // ===================== RARE PERKS =====================
  {
    id: 'last_resort', name: 'Last Resort', rarity: 'rare', icon: '▲',
    description: 'When only 1 Pokémon remains, it gets +50% Atk and Sp. Atk.',
    effect: { lastPokemonBoost: 0.5 },
  },
  {
    id: 'grassy_carpet', name: 'Grassy Carpet', rarity: 'rare', icon: '❧',
    description: 'All Pokémon heal 6.25% HP at the end of each turn.',
    effect: { regenPercent: 0.0625 },
  },
  {
    id: 'dual_threat', name: 'Dual Threat', rarity: 'rare', icon: '✕',
    description: 'Dual-type Pokémon deal +15% damage.',
    effect: { dualTypeBonus: 1.15 },
  },
  {
    id: 'evolution_power', name: 'Evolution Power', rarity: 'rare', icon: '✦',
    description: 'Fully evolved Pokémon get +10% to all stats.',
    effect: { fullyEvolvedBonus: 1.1 },
  },
  {
    id: 'rookie_boost', name: 'Rookie Boost', rarity: 'rare', icon: '❧',
    description: 'Non-fully evolved Pokémon get +25% Def and Sp. Def.',
    effect: { notFullyEvolvedBonus: { def: 1.25, spDef: 1.25 } },
  },
  {
    id: 'speed_demons', name: 'Speed Demons', rarity: 'rare', icon: '›',
    description: 'If Speed > enemy\'s, deal +20% damage.',
    effect: { speedDamageBonus: 1.2 },
  },
  {
    id: 'underdog', name: 'Underdog', rarity: 'rare', icon: '▽',
    description: 'The Pokémon with the lowest BST on the team gets +40% Attack.',
    effect: { lowestBSTAttackBonus: 1.4 },
  },
  {
    id: 'type_coverage', name: 'Type Coverage', rarity: 'rare', icon: '◈',
    description: 'If the team covers 6+ unique types, all moves deal +10% damage.',
    effect: { typeCoverageBonus: { minTypes: 6, multiplier: 1.1 } },
  },
  {
    id: 'nurses_blessing', name: "Nurse's Blessing", rarity: 'rare', icon: '✚',
    description: 'Between-wave HP regeneration +10%.',
    effect: { regenPercent: 0.1 },
  },
  {
    id: 'burn_cascade', name: 'Burn Cascade', rarity: 'rare', icon: '▲',
    description: 'Fire-type moves deal +20% damage and have a 25% chance to burn.',
    effect: { typeBoost: { type: 'fire', multiplier: 1.2 }, fireBurnChance: 0.25 },
  },
  // ===================== EPIC PERKS =====================
  {
    id: 'synergy_link', name: 'Synergy Link', rarity: 'epic', icon: '∞',
    description: 'After a KO, the next Pokémon enters with +2 to all stat stages.',
    effect: { onKOBoost: { stages: 2 } },
  },
  {
    id: 'deaths_door', name: "Death's Door Power", rarity: 'epic', icon: '†',
    description: 'Pokémon below 25% HP deal double damage.',
    effect: { deathsDoorMultiplier: 2 },
  },
  {
    id: 'adrenaline_rush', name: 'Adrenaline Rush', rarity: 'epic', icon: '↯',
    description: 'First move each battle is guaranteed to be a critical hit.',
    effect: { firstMoveCrit: true },
  },
  {
    id: 'legendary_aura', name: 'Legendary Aura', rarity: 'epic', icon: '◇',
    description: 'All Pokémon stats treated as 10% higher for damage calculation.',
    effect: { allStatsMultiplier: 1.1 },
  },
  {
    id: 'double_up', name: 'Double Up', rarity: 'epic', icon: 'II',
    description: '15% chance any move hits twice.',
    effect: { doubleHitChance: 0.15 },
  },
  {
    id: 'immortal_grit', name: 'Immortal Grit', rarity: 'epic', icon: '▲',
    description: 'Focus Sash effect applies to all Pokémon once per wave.',
    effect: { focusSashAll: true },
  },
  {
    id: 'chain_reaction', name: 'Chain Reaction', rarity: 'epic', icon: '∞',
    description: 'Each KO grants +1% permanent damage bonus (stacks, persists run).',
    effect: { chainKOBonus: 0.01 },
  },
  {
    id: 'adaptability', name: 'Adaptability', rarity: 'epic', icon: '◈',
    description: 'All Pokémon have Adaptability (STAB = 2× instead of 1.5×).',
    effect: { adaptability: true },
  },
  {
    id: 'speed_boost', name: 'Speed Boost', rarity: 'epic', icon: '›',
    description: 'All Pokémon gain +1 Speed stage at the end of each turn.',
    effect: { speedBoostPerTurn: 1 },
  },
  // ===================== LEGENDARY PERKS =====================
  {
    id: 'god_mode', name: 'God Mode', rarity: 'legendary', icon: '◆',
    description: 'Once per run: entire team revived to full HP mid-battle (manual trigger).',
    effect: { godModeRevive: true },
  },
  {
    id: 'type_erase', name: 'Type Erase', rarity: 'legendary', icon: '○',
    description: 'All moves deal neutral damage (ignores resistances and immunities).',
    effect: { typeEraseAll: true },
  },
  {
    id: 'mega_evolution', name: 'Mega Evolution', rarity: 'legendary', icon: '◈',
    description: 'All Pokémon get +30% to all stats (Mega Evolution for all!).',
    effect: { allStatsMultiplier: 1.3 },
  },
  {
    id: 'z_power_aura', name: 'Z-Power Aura', rarity: 'legendary', icon: '✦',
    description: 'All moves get +15% power. Z-move slot recharges each boss wave.',
    effect: { allMovePowerBonus: 1.15 },
  },
  {
    id: 'master_ball_luck', name: 'Master Ball Luck', rarity: 'legendary', icon: '◉',
    description: '+15% to all stats and +1 free reroll per shop.',
    effect: { allStatsMultiplier: 1.15, extraReroll: 1 },
  },
  // ===================== ARCHETYPE PERKS — NEW =====================
  {
    id: 'backline_burner', name: 'Backline Burner', rarity: 'rare', icon: '◇',
    description: 'Pokémon in slot 4 or 5 deal +30% damage.',
    effect: { backlineDamageBonus: 1.3 },
  },
  {
    id: 'pivot_tactics', name: 'Pivot Tactics', rarity: 'rare', icon: '↻',
    description: 'After a Pokémon enters battle, +1 stage to Atk and Speed for 1 turn.',
    effect: { pivotBoost: { atk: 1, speed: 1, turns: 1 } },
  },
  {
    id: 'item_maven', name: 'Item Maven', rarity: 'rare', icon: '◈',
    description: 'Each held item adds +5% to one stat (rotates by slot).',
    effect: { itemMaven: 0.05 },
  },
  {
    id: 'type_mastery', name: 'Type Mastery', rarity: 'epic', icon: '◆',
    description: '+1 type level for the primary type when 2+ teammates share it.',
    effect: { typeMasteryBonus: 1 },
  },
  {
    id: 'status_stacker', name: 'Status Stacker', rarity: 'epic', icon: '‡',
    description: 'Damage from burn and poison +50%. Status moves +20% accuracy.',
    effect: { statusStacker: { damageMult: 1.5, accuracyMult: 1.2 } },
  },
];

export function getPerkById(id: string): Perk | undefined {
  return ALL_PERKS.find(p => p.id === id);
}

export function getPerksByRarity(rarity: string): Perk[] {
  return ALL_PERKS.filter(p => p.rarity === rarity);
}
