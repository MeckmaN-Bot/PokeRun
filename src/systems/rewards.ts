import type { Reward, Rarity, Perk, Item, Pokemon } from '../types';
import { ALL_ITEMS } from '../data/items';
import { ALL_PERKS } from '../data/perks';

// ============================================================
// Rarity Roll
// ============================================================

export function rollRarity(wave: number, isBossWave: boolean): Rarity {
  // Boss waves: guaranteed at least Epic
  if (isBossWave) {
    const r = Math.random();
    if (r < 0.15) return 'legendary';
    if (r < 0.65) return 'epic';
    return 'rare';
  }

  // Scale probabilities with wave number (better loot later)
  const legendaryChance = Math.min(0.08, 0.03 + wave * 0.001);
  const epicChance = Math.min(0.25, 0.12 + wave * 0.003);
  const rareChance = Math.min(0.45, 0.30 + wave * 0.002);

  const r = Math.random();
  if (r < legendaryChance) return 'legendary';
  if (r < legendaryChance + epicChance) return 'epic';
  if (r < legendaryChance + epicChance + rareChance) return 'rare';
  return 'common';
}

// ============================================================
// Item Reward Generation
// ============================================================

function getItemByRarity(rarity: Rarity, exclude: string[] = []): Item | null {
  const pool = ALL_ITEMS.filter(i => i.rarity === rarity && !exclude.includes(i.id));
  if (pool.length === 0) {
    // Fall back to lower rarity
    const rarityOrder: Rarity[] = ['legendary', 'epic', 'rare', 'common'];
    const idx = rarityOrder.indexOf(rarity);
    if (idx < rarityOrder.length - 1) {
      return getItemByRarity(rarityOrder[idx + 1], exclude);
    }
    return null;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// ============================================================
// Perk Reward Generation
// ============================================================

function getPerkByRarity(rarity: Rarity, ownedPerkIds: string[]): Perk | null {
  const pool = ALL_PERKS.filter(p => p.rarity === rarity && !ownedPerkIds.includes(p.id));
  if (pool.length === 0) {
    const rarityOrder: Rarity[] = ['legendary', 'epic', 'rare', 'common'];
    const idx = rarityOrder.indexOf(rarity);
    if (idx < rarityOrder.length - 1) {
      return getPerkByRarity(rarityOrder[idx + 1], ownedPerkIds);
    }
    return null;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// ============================================================
// Generate 3 Reward Choices
// ============================================================

export function generateRewards(
  wave: number,
  isBossWave: boolean,
  ownedPerkIds: string[],
  pokemonChoices: Pokemon[],
  options?: { minRarity?: Rarity; extraCard?: boolean }
): Reward[] {
  const rewards: Reward[] = [];
  const usedItemIds: string[] = [];

  // Rarity floor from options (e.g. rare_tag, boss wave bonus)
  const floor = options?.minRarity;
  const upgrade = (r: Rarity): Rarity => {
    if (!floor) return r;
    const order: Rarity[] = ['common', 'rare', 'epic', 'legendary'];
    return order[Math.max(order.indexOf(r), order.indexOf(floor))] ?? r;
  };

  const maxRewards = options?.extraCard ? 4 : 3;

  // Always include at least one Pokemon reward
  if (pokemonChoices.length > 0) {
    const pokemon = pokemonChoices[Math.floor(Math.random() * pokemonChoices.length)];
    const rarity = upgrade(rollRarity(wave, isBossWave));
    rewards.push({ type: 'pokemon', rarity, pokemon });
  }

  // Fill remaining slots with perks and items
  while (rewards.length < maxRewards) {
    const rarity = upgrade(rollRarity(wave, isBossWave));
    const rewardTypeRoll = Math.random();

    if (rewardTypeRoll < 0.4) {
      // Perk
      const perk = getPerkByRarity(rarity, ownedPerkIds);
      if (perk) {
        rewards.push({ type: 'perk', rarity, perk });
        continue;
      }
    }

    // Item
    const item = getItemByRarity(rarity, usedItemIds);
    if (item) {
      usedItemIds.push(item.id);
      rewards.push({ type: 'item', rarity, item });
    } else {
      // Fallback: another pokemon
      if (pokemonChoices.length > 0) {
        const pokemon = pokemonChoices[Math.floor(Math.random() * pokemonChoices.length)];
        rewards.push({ type: 'pokemon', rarity: 'common', pokemon });
      }
    }
  }

  return rewards.slice(0, maxRewards);
}

// ============================================================
// Reward Display Helpers
// ============================================================

export function getRarityLabel(rarity: Rarity): string {
  const labels: Record<Rarity, string> = {
    common: 'Common',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
  };
  return labels[rarity];
}

export function getRarityColor(rarity: Rarity): string {
  const colors: Record<Rarity, string> = {
    common: '#94a3b8',
    rare: '#60a5fa',
    epic: '#a855f7',
    legendary: '#f59e0b',
  };
  return colors[rarity];
}

export function getRarityClass(rarity: Rarity): string {
  return `rarity-${rarity}`;
}
