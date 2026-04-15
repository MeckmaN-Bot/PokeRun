import type { ShopItem, Item, Rarity } from '../types';
import { ALL_ITEMS } from '../data/items';

// ============================================================
// Price Tables
// ============================================================

const PRICE_RANGES: Record<Rarity, [number, number]> = {
  common:    [20, 40],
  rare:      [60, 100],
  epic:      [150, 250],
  legendary: [400, 600],
};

function getPrice(rarity: Rarity, wave: number): number {
  const [min, max] = PRICE_RANGES[rarity];
  const base = min + Math.floor(Math.random() * (max - min + 1));
  // Small scaling with wave
  const scale = 1 + Math.min(0.5, wave * 0.02);
  return Math.floor(base * scale);
}

// ============================================================
// Shop Generation
// ============================================================

export function generateShop(wave: number, existingItemIds: string[] = []): ShopItem[] {
  const items: ShopItem[] = [];
  const usedIds = new Set<string>(existingItemIds);

  // 3-4 items: mix of rarities
  const count = 3 + (Math.random() < 0.5 ? 1 : 0);

  // Rarity distribution: mostly common/rare, occasional epic
  const rarityPool: Rarity[] = ['common', 'common', 'rare', 'rare', 'epic'];
  if (wave >= 10) rarityPool.push('epic');
  if (wave >= 15) rarityPool.push('legendary');

  // Shuffle and pick
  const shuffledRarities = rarityPool.sort(() => Math.random() - 0.5).slice(0, count);

  // Always ensure at least one "aspirational" expensive item
  if (!shuffledRarities.includes('epic') && !shuffledRarities.includes('legendary')) {
    shuffledRarities[shuffledRarities.length - 1] = 'epic';
  }

  for (const rarity of shuffledRarities) {
    const pool = ALL_ITEMS.filter(
      i => i.rarity === rarity && !usedIds.has(i.id)
    );

    if (pool.length === 0) continue;

    const item = pool[Math.floor(Math.random() * pool.length)];
    usedIds.add(item.id);

    items.push({
      item,
      price: getPrice(rarity, wave),
      sold: false,
    });
  }

  return items;
}

// ============================================================
// Purchase Logic
// ============================================================

export function canAfford(price: number, coins: number): boolean {
  return coins >= price;
}

export function purchaseShopItem(
  shopItem: ShopItem,
  coins: number
): { success: boolean; newCoins: number } {
  if (shopItem.sold || coins < shopItem.price) {
    return { success: false, newCoins: coins };
  }
  return { success: true, newCoins: coins - shopItem.price };
}

// ============================================================
// Reroll
// ============================================================

export const REROLL_COST = 20;

export function rerollShop(wave: number, existingItemIds: string[] = []): ShopItem[] {
  return generateShop(wave, existingItemIds);
}
