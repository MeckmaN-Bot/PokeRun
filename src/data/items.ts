import type { Item } from '../types';

export const ALL_ITEMS: Item[] = [
  // ===================== COMMON HELD ITEMS =====================
  {
    id: 'oran_berry', name: 'Oran Berry', rarity: 'common', itemType: 'held',
    icon: '🫐',
    description: 'Restores 10 HP when the holder\'s HP drops below 50%.',
    effect: { trigger: 'on_hit_taken', hpThreshold: 0.5, healAmount: 10 },
  },
  {
    id: 'sitrus_berry', name: 'Sitrus Berry', rarity: 'common', itemType: 'held',
    icon: '🍋',
    description: 'Restores 25% max HP when the holder\'s HP drops below 50%.',
    effect: { trigger: 'on_hit_taken', hpThreshold: 0.5, healPercent: 0.25 },
  },
  {
    id: 'pecha_berry', name: 'Pecha Berry', rarity: 'common', itemType: 'held',
    icon: '🍑',
    description: 'Cures Poison when inflicted.',
    effect: { trigger: 'on_status', curesStatus: 'poison' },
  },
  {
    id: 'rawst_berry', name: 'Rawst Berry', rarity: 'common', itemType: 'held',
    icon: '🫐',
    description: 'Cures Burn when inflicted.',
    effect: { trigger: 'on_status', curesStatus: 'burn' },
  },
  {
    id: 'chesto_berry', name: 'Chesto Berry', rarity: 'common', itemType: 'held',
    icon: '🫒',
    description: 'Cures Sleep when inflicted.',
    effect: { trigger: 'on_status', curesStatus: 'sleep' },
  },
  {
    id: 'cheri_berry', name: 'Cheri Berry', rarity: 'common', itemType: 'held',
    icon: '🍒',
    description: 'Cures Paralysis when inflicted.',
    effect: { trigger: 'on_status', curesStatus: 'paralysis' },
  },
  {
    id: 'aspear_berry', name: 'Aspear Berry', rarity: 'common', itemType: 'held',
    icon: '🍐',
    description: 'Cures Freeze when inflicted.',
    effect: { trigger: 'on_status', curesStatus: 'freeze' },
  },
  {
    id: 'lum_berry', name: 'Lum Berry', rarity: 'common', itemType: 'held',
    icon: '🌿',
    description: 'Cures any status condition once.',
    effect: { trigger: 'on_status', curesStatus: 'any' },
  },
  {
    id: 'amulet_coin', name: 'Amulet Coin', rarity: 'common', itemType: 'held',
    icon: '🪙',
    description: '+20% coins earned per wave.',
    effect: { trigger: 'passive', coinMultiplier: 1.2 },
  },
  // ===================== RARE HELD ITEMS =====================
  {
    id: 'choice_band', name: 'Choice Band', rarity: 'rare', itemType: 'held',
    icon: '🩹',
    description: '+50% Attack, but locked to the first move used each battle.',
    effect: { trigger: 'passive', statBoost: { attack: 1.5 }, lockToFirstMove: true },
  },
  {
    id: 'choice_specs', name: 'Choice Specs', rarity: 'rare', itemType: 'held',
    icon: '👓',
    description: '+50% Sp. Atk, but locked to the first move used each battle.',
    effect: { trigger: 'passive', statBoost: { spAtk: 1.5 }, lockToFirstMove: true },
  },
  {
    id: 'choice_scarf', name: 'Choice Scarf', rarity: 'rare', itemType: 'held',
    icon: '🧣',
    description: '+50% Speed, but locked to the first move used each battle.',
    effect: { trigger: 'passive', statBoost: { speed: 1.5 }, lockToFirstMove: true },
  },
  {
    id: 'life_orb', name: 'Life Orb', rarity: 'rare', itemType: 'held',
    icon: '🔮',
    description: '+30% damage on all moves. Costs 10% of max HP per attack.',
    effect: { trigger: 'on_attack', damageMultiplier: 1.3, costHpPercent: 0.1 },
  },
  {
    id: 'leftovers', name: 'Leftovers', rarity: 'rare', itemType: 'held',
    icon: '🍱',
    description: 'Restores 6.25% max HP at the end of each turn.',
    effect: { trigger: 'end_of_turn', regenPercent: 0.0625 },
  },
  {
    id: 'shell_bell', name: 'Shell Bell', rarity: 'rare', itemType: 'held',
    icon: '🐚',
    description: 'Restores HP equal to 1/8 of damage dealt.',
    effect: { trigger: 'on_attack', healAmount: 0.125 },
  },
  {
    id: 'rocky_helmet', name: 'Rocky Helmet', rarity: 'rare', itemType: 'held',
    icon: '⛑️',
    description: 'Deals 1/6 of max HP damage back to contact attackers.',
    effect: { trigger: 'on_hit_taken', damageReflectPercent: 0.1667 },
  },
  {
    id: 'eviolite', name: 'Eviolite', rarity: 'rare', itemType: 'held',
    icon: '💎',
    description: '+50% Def and Sp. Def if the holder is not fully evolved.',
    effect: { trigger: 'passive', statBoost: { defense: 1.5, spDef: 1.5 } },
  },
  {
    id: 'assault_vest', name: 'Assault Vest', rarity: 'rare', itemType: 'held',
    icon: '🦺',
    description: '+50% Sp. Def, but cannot use status moves.',
    effect: { trigger: 'passive', statBoost: { spDef: 1.5 } },
  },
  {
    id: 'focus_sash', name: 'Focus Sash', rarity: 'rare', itemType: 'held',
    icon: '🎀',
    description: 'Survive one hit from full HP that would KO (1 use per battle).',
    effect: { trigger: 'on_hit_taken', surviveKO: true },
  },
  {
    id: 'air_balloon', name: 'Air Balloon', rarity: 'rare', itemType: 'held',
    icon: '🎈',
    description: 'Immune to Ground-type moves until hit by any attack.',
    effect: { trigger: 'passive', immuneGround: true },
  },
  {
    id: 'weakness_policy', name: 'Weakness Policy', rarity: 'rare', itemType: 'held',
    icon: '📜',
    description: 'Raises Atk and Sp. Atk by 2 stages when hit by a super-effective move.',
    effect: { trigger: 'on_hit_taken', statOnHit: { condition: 'super_effective', stat: 'attack', stages: 2 } },
  },
  {
    id: 'expert_belt', name: 'Expert Belt', rarity: 'rare', itemType: 'held',
    icon: '🥋',
    description: '+20% damage on super-effective moves.',
    effect: { trigger: 'on_attack', damageMultiplier: 1.2 },
  },
  {
    id: 'muscle_band', name: 'Muscle Band', rarity: 'rare', itemType: 'held',
    icon: '💪',
    description: '+10% damage on physical moves.',
    effect: { trigger: 'on_attack', damageMultiplier: 1.1 },
  },
  {
    id: 'wise_glasses', name: 'Wise Glasses', rarity: 'rare', itemType: 'held',
    icon: '🧐',
    description: '+10% damage on special moves.',
    effect: { trigger: 'on_attack', damageMultiplier: 1.1 },
  },
  // Type-boosting items
  {
    id: 'magnet', name: 'Magnet', rarity: 'rare', itemType: 'held',
    icon: '🧲',
    description: '+20% power to Electric-type moves.',
    effect: { trigger: 'on_attack', typePowerBoost: { type: 'electric', multiplier: 1.2 } },
  },
  {
    id: 'charcoal', name: 'Charcoal', rarity: 'rare', itemType: 'held',
    icon: '🪨',
    description: '+20% power to Fire-type moves.',
    effect: { trigger: 'on_attack', typePowerBoost: { type: 'fire', multiplier: 1.2 } },
  },
  {
    id: 'mystic_water', name: 'Mystic Water', rarity: 'rare', itemType: 'held',
    icon: '💧',
    description: '+20% power to Water-type moves.',
    effect: { trigger: 'on_attack', typePowerBoost: { type: 'water', multiplier: 1.2 } },
  },
  {
    id: 'miracle_seed', name: 'Miracle Seed', rarity: 'rare', itemType: 'held',
    icon: '🌱',
    description: '+20% power to Grass-type moves.',
    effect: { trigger: 'on_attack', typePowerBoost: { type: 'grass', multiplier: 1.2 } },
  },
  {
    id: 'soft_sand', name: 'Soft Sand', rarity: 'rare', itemType: 'held',
    icon: '🏖️',
    description: '+20% power to Ground-type moves.',
    effect: { trigger: 'on_attack', typePowerBoost: { type: 'ground', multiplier: 1.2 } },
  },
  {
    id: 'sharp_beak', name: 'Sharp Beak', rarity: 'rare', itemType: 'held',
    icon: '🦅',
    description: '+20% power to Flying-type moves.',
    effect: { trigger: 'on_attack', typePowerBoost: { type: 'flying', multiplier: 1.2 } },
  },
  {
    id: 'twisted_spoon', name: 'Twisted Spoon', rarity: 'rare', itemType: 'held',
    icon: '🥄',
    description: '+20% power to Psychic-type moves.',
    effect: { trigger: 'on_attack', typePowerBoost: { type: 'psychic', multiplier: 1.2 } },
  },
  {
    id: 'spell_tag', name: 'Spell Tag', rarity: 'rare', itemType: 'held',
    icon: '👻',
    description: '+20% power to Ghost-type moves.',
    effect: { trigger: 'on_attack', typePowerBoost: { type: 'ghost', multiplier: 1.2 } },
  },
  {
    id: 'metal_coat', name: 'Metal Coat', rarity: 'rare', itemType: 'held',
    icon: '🔩',
    description: '+20% power to Steel-type moves.',
    effect: { trigger: 'on_attack', typePowerBoost: { type: 'steel', multiplier: 1.2 } },
  },
  {
    id: 'dragon_fang', name: 'Dragon Fang', rarity: 'rare', itemType: 'held',
    icon: '🐉',
    description: '+20% power to Dragon-type moves.',
    effect: { trigger: 'on_attack', typePowerBoost: { type: 'dragon', multiplier: 1.2 } },
  },
  {
    id: 'poison_barb', name: 'Poison Barb', rarity: 'rare', itemType: 'held',
    icon: '☠️',
    description: '+20% power to Poison-type moves.',
    effect: { trigger: 'on_attack', typePowerBoost: { type: 'poison', multiplier: 1.2 } },
  },
  {
    id: 'silk_scarf', name: 'Silk Scarf', rarity: 'rare', itemType: 'held',
    icon: '🎗️',
    description: '+20% power to Normal-type moves.',
    effect: { trigger: 'on_attack', typePowerBoost: { type: 'normal', multiplier: 1.2 } },
  },
  {
    id: 'never_melt_ice', name: 'Never-Melt Ice', rarity: 'rare', itemType: 'held',
    icon: '🧊',
    description: '+20% power to Ice-type moves.',
    effect: { trigger: 'on_attack', typePowerBoost: { type: 'ice', multiplier: 1.2 } },
  },
  {
    id: 'black_belt', name: 'Black Belt', rarity: 'rare', itemType: 'held',
    icon: '🥊',
    description: '+20% power to Fighting-type moves.',
    effect: { trigger: 'on_attack', typePowerBoost: { type: 'fighting', multiplier: 1.2 } },
  },
  {
    id: 'hard_stone', name: 'Hard Stone', rarity: 'rare', itemType: 'held',
    icon: '🪨',
    description: '+20% power to Rock-type moves.',
    effect: { trigger: 'on_attack', typePowerBoost: { type: 'rock', multiplier: 1.2 } },
  },
  {
    id: 'silver_powder', name: 'Silver Powder', rarity: 'rare', itemType: 'held',
    icon: '✨',
    description: '+20% power to Bug-type moves.',
    effect: { trigger: 'on_attack', typePowerBoost: { type: 'bug', multiplier: 1.2 } },
  },
  // ===================== EPIC HELD ITEMS =====================
  {
    id: 'scope_lens', name: 'Scope Lens', rarity: 'epic', itemType: 'held',
    icon: '🔭',
    description: 'Critical hit ratio +1 stage (raises crit rate to ~12.5%).',
    effect: { trigger: 'passive', critBoost: 1 },
  },
  {
    id: 'kings_rock', name: "King's Rock", rarity: 'epic', itemType: 'held',
    icon: '👑',
    description: 'Moves have 10% chance to cause flinch.',
    effect: { trigger: 'on_attack', flinchChance: 0.1 },
  },
  {
    id: 'wide_lens', name: 'Wide Lens', rarity: 'epic', itemType: 'held',
    icon: '🔍',
    description: 'Move accuracy +10%.',
    effect: { trigger: 'passive', accuracyBoost: 1.1 },
  },
  {
    id: 'heavy_duty_boots', name: 'Heavy-Duty Boots', rarity: 'epic', itemType: 'held',
    icon: '🥾',
    description: 'Immune to entry hazard damage.',
    effect: { trigger: 'passive' },
  },
  {
    id: 'quick_claw', name: 'Quick Claw', rarity: 'epic', itemType: 'held',
    icon: '💅',
    description: '20% chance to move first regardless of Speed.',
    effect: { trigger: 'passive', speedBoost: 99 },
  },
  // ===================== LEGENDARY HELD ITEMS =====================
  {
    id: 'mega_stone', name: 'Mega Stone', rarity: 'legendary', itemType: 'held',
    icon: '💠',
    description: 'Pokémon deals 30% more damage and has 20% more HP.',
    effect: { trigger: 'passive', damageMultiplier: 1.3, statBoost: { hp: 1.2 } },
  },
  {
    id: 'z_crystal', name: 'Z-Crystal', rarity: 'legendary', itemType: 'held',
    icon: '⭐',
    description: 'Once per battle: next move does 2.5× damage, ignores type immunity.',
    effect: { trigger: 'once_per_battle', damageMultiplier: 2.5 },
  },
  {
    id: 'light_ball', name: 'Light Ball', rarity: 'legendary', itemType: 'held',
    icon: '⚡',
    description: 'Doubles Atk and Sp. Atk (Pikachu only).',
    effect: { trigger: 'passive', statBoost: { attack: 2, spAtk: 2 } },
  },
  // ===================== COMMON CONSUMABLES =====================
  {
    id: 'potion', name: 'Potion', rarity: 'common', itemType: 'consumable',
    icon: '🧪',
    description: 'Restores 20 HP to one Pokémon.',
    effect: { trigger: 'manual', healAmount: 20 },
  },
  {
    id: 'super_potion', name: 'Super Potion', rarity: 'common', itemType: 'consumable',
    icon: '🧪',
    description: 'Restores 50 HP to one Pokémon.',
    effect: { trigger: 'manual', healAmount: 50 },
  },
  {
    id: 'hyper_potion', name: 'Hyper Potion', rarity: 'common', itemType: 'consumable',
    icon: '🧪',
    description: 'Restores 200 HP to one Pokémon.',
    effect: { trigger: 'manual', healAmount: 200 },
  },
  {
    id: 'max_potion', name: 'Max Potion', rarity: 'common', itemType: 'consumable',
    icon: '💊',
    description: 'Fully restores HP to one Pokémon.',
    effect: { trigger: 'manual', healPercent: 1 },
  },
  {
    id: 'antidote', name: 'Antidote', rarity: 'common', itemType: 'consumable',
    icon: '💉',
    description: 'Cures Poison from one Pokémon.',
    effect: { trigger: 'manual', curesStatus: 'poison' },
  },
  {
    id: 'burn_heal', name: 'Burn Heal', rarity: 'common', itemType: 'consumable',
    icon: '🧊',
    description: 'Cures Burn from one Pokémon.',
    effect: { trigger: 'manual', curesStatus: 'burn' },
  },
  {
    id: 'full_heal', name: 'Full Heal', rarity: 'common', itemType: 'consumable',
    icon: '💊',
    description: 'Cures any status condition from one Pokémon.',
    effect: { trigger: 'manual', curesStatus: 'any' },
  },
  // ===================== RARE CONSUMABLES =====================
  {
    id: 'revive', name: 'Revive', rarity: 'rare', itemType: 'consumable',
    icon: '💫',
    description: 'Revives a KO\'d Pokémon to half HP.',
    effect: { trigger: 'manual', healPercent: 0.5 },
  },
  {
    id: 'max_revive', name: 'Max Revive', rarity: 'rare', itemType: 'consumable',
    icon: '⭐',
    description: 'Revives a KO\'d Pokémon to full HP.',
    effect: { trigger: 'manual', healPercent: 1 },
  },
  {
    id: 'rare_candy', name: 'Rare Candy', rarity: 'rare', itemType: 'consumable',
    icon: '🍬',
    description: 'Levels up one Pokémon by 1.',
    effect: { trigger: 'manual' },
  },
  {
    id: 'x_attack', name: 'X Attack', rarity: 'rare', itemType: 'consumable',
    icon: '⚔️',
    description: '+2 Attack stages for the current battle.',
    effect: { trigger: 'manual', statBoost: { attack: 2 } },
  },
  {
    id: 'x_speed', name: 'X Speed', rarity: 'rare', itemType: 'consumable',
    icon: '💨',
    description: '+2 Speed stages for the current battle.',
    effect: { trigger: 'manual', statBoost: { speed: 2 } },
  },
  {
    id: 'x_sp_atk', name: 'X Sp. Atk', rarity: 'rare', itemType: 'consumable',
    icon: '✨',
    description: '+2 Sp. Atk stages for the current battle.',
    effect: { trigger: 'manual', statBoost: { spAtk: 2 } },
  },
  {
    id: 'dire_hit', name: 'Dire Hit', rarity: 'rare', itemType: 'consumable',
    icon: '🎯',
    description: 'Raises critical hit rate for the current battle.',
    effect: { trigger: 'manual', critBoost: 2 },
  },
  {
    id: 'escape_rope', name: 'Escape Rope', rarity: 'rare', itemType: 'consumable',
    icon: '🪢',
    description: 'Skip the current wave (no reward, no coins).',
    effect: { trigger: 'manual' },
  },
  // ===================== EPIC CONSUMABLES =====================
  {
    id: 'full_restore', name: 'Full Restore', rarity: 'epic', itemType: 'consumable',
    icon: '💖',
    description: 'Fully heals HP and cures status of one Pokémon.',
    effect: { trigger: 'manual', healPercent: 1, curesStatus: 'any' },
  },
  {
    id: 'sacred_ash', name: 'Sacred Ash', rarity: 'epic', itemType: 'consumable',
    icon: '🕊️',
    description: 'Revives the entire team to full HP.',
    effect: { trigger: 'manual', healPercent: 1 },
  },
  {
    id: 'star_piece', name: 'Star Piece', rarity: 'epic', itemType: 'consumable',
    icon: '⭐',
    description: 'Grants +50 coins immediately.',
    effect: { trigger: 'manual', coinMultiplier: 50 },
  },
  {
    id: 'big_nugget', name: 'Big Nugget', rarity: 'epic', itemType: 'consumable',
    icon: '💎',
    description: 'Grants +150 coins immediately.',
    effect: { trigger: 'manual', coinMultiplier: 150 },
  },
];

export function getItemById(id: string): Item | undefined {
  return ALL_ITEMS.find(i => i.id === id);
}

export function getItemsByRarity(rarity: string): Item[] {
  return ALL_ITEMS.filter(i => i.rarity === rarity);
}

export function getHeldItems(): Item[] {
  return ALL_ITEMS.filter(i => i.itemType === 'held');
}

export function getConsumables(): Item[] {
  return ALL_ITEMS.filter(i => i.itemType === 'consumable');
}
