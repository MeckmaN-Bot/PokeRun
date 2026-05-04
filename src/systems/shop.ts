import type { ShopItem, ShopPack, ShopVoucher, Item, Rarity } from '../types';
import { ALL_ITEMS } from '../data/items';
import { BOOSTER_PACKS, type PackId } from '../data/boosterPacks';
import { VOUCHERS, type VoucherId } from '../data/vouchers';

// ============================================================
// Price Tables
// ============================================================

const PRICE_RANGES: Record<Rarity, [number, number]> = {
  common:    [20, 40],
  rare:      [60, 100],
  epic:      [150, 250],
  legendary: [400, 600],
};

function getPrice(rarity: Rarity, wave: number, discount = 0): number {
  const [min, max] = PRICE_RANGES[rarity];
  const base = min + Math.floor(Math.random() * (max - min + 1));
  // Scaling delayed by 3 waves so first shops stay base price
  const scale = 1 + Math.min(0.5, Math.max(0, wave - 3) * 0.022);
  return Math.max(1, Math.floor(base * scale * (1 - discount)));
}

// ============================================================
// Shop Generation
// ============================================================

const HEALING_ITEM_IDS = ['potion', 'super_potion', 'hyper_potion', 'full_restore', 'pokemon_food'];

export function generateShop(
  wave: number,
  existingItemIds: string[] = [],
  vouchers: VoucherId[] = [],
  opts?: { teamHpRatio?: number; epicPity?: boolean; healingPity?: boolean; excludeConsumables?: boolean },
): ShopItem[] {
  const items: ShopItem[] = [];
  const usedIds = new Set<string>(existingItemIds);
  const discount = vouchers.includes('clearance_sale') ? 0.25 : 0;
  const overstock = vouchers.includes('overstock') ? 2 : 0;
  // Iron Trainer deck — strip every consumable from the pool so the shop is
  // held-items only. The healing-pity branch below still tries to add a healing
  // item, so we pre-filter ALL_ITEMS here once and reuse the filtered base.
  const itemPool = opts?.excludeConsumables
    ? ALL_ITEMS.filter(i => i.itemType !== 'consumable')
    : ALL_ITEMS;

  // 3-4 items + overstock bonus
  const count = 3 + (Math.random() < 0.5 ? 1 : 0) + overstock;

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

  // Epic pity — after wave 8 with no epic-in-shop streak, force epic
  if (opts?.epicPity && wave >= 8) {
    shuffledRarities[0] = 'epic';
  }

  for (const rarity of shuffledRarities) {
    const pool = itemPool.filter(
      i => i.rarity === rarity && !usedIds.has(i.id) && !i.rewardOnly
    );

    if (pool.length === 0) continue;

    const item = pool[Math.floor(Math.random() * pool.length)];
    usedIds.add(item.id);

    items.push({
      item,
      price: getPrice(rarity, wave, discount),
      sold: false,
    });
  }

  // Guarantee at least one healing item in the shop — UNLESS Iron Trainer
  // mode is on (consumables forbidden by design).
  const hasHealing = items.some(s => HEALING_ITEM_IDS.includes(s.item.id));
  if (!hasHealing && !opts?.excludeConsumables) {
    // Pity escalates the floor: low team HP or 3+ shops without healing → at least Hyper Potion
    const teamLowHp = (opts?.teamHpRatio ?? 1) < 0.6;
    const lowHpFloor = ['hyper_potion', 'full_restore'];
    const candidates = (teamLowHp || opts?.healingPity)
      ? ALL_ITEMS.filter(i => lowHpFloor.includes(i.id) && !usedIds.has(i.id))
      : ALL_ITEMS.filter(i => HEALING_ITEM_IDS.includes(i.id) && !usedIds.has(i.id));
    const healingPool = candidates.length > 0
      ? candidates
      : ALL_ITEMS.filter(i => HEALING_ITEM_IDS.includes(i.id) && !usedIds.has(i.id));
    if (healingPool.length > 0) {
      const healItem = healingPool[Math.floor(Math.random() * healingPool.length)];
      items.push({
        item: healItem,
        price: getPrice(healItem.rarity, wave, discount),
        sold: false,
      });
    }
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

/** Reroll cost scales with wave so it stays meaningful early but trivial late. */
export function getRerollCost(wave: number): number {
  return 15 + Math.floor(wave / 3) * 5;
}

export function rerollShop(
  wave: number,
  existingItemIds: string[] = [],
  vouchers: VoucherId[] = [],
  opts?: { teamHpRatio?: number; epicPity?: boolean; healingPity?: boolean; excludeConsumables?: boolean },
): ShopItem[] {
  return generateShop(wave, existingItemIds, vouchers, opts);
}

// ============================================================
// Booster Packs
// ============================================================

export function generateShopPacks(
  wave: number,
  guaranteeFreeMega = false,
  vouchers: VoucherId[] = [],
  opts?: { excludeConsumables?: boolean },
): ShopPack[] {
  const packs: ShopPack[] = [];
  if (guaranteeFreeMega) {
    packs.push({ packId: 'master_ball', price: 0, sold: false, free: true });
  }
  // Always 2 packs in the shop.
  const count = 2;
  const packDiscount = vouchers.includes('magic_trick') ? 0.2 : 0;
  const priceScale = (1 + Math.min(0.5, wave * 0.02)) * (1 - packDiscount);
  const usedIds = new Set<PackId>();
  if (guaranteeFreeMega) usedIds.add('master_ball');

  const pool = BOOSTER_PACKS.filter(p => {
    if (p.id === 'premier_ball') return wave >= 5;
    // Iron Trainer deck — Great Ball pack is "3 consumables", incompatible
    // with the no-consumables rule. Hide it.
    if (opts?.excludeConsumables && p.id === 'great_ball') return false;
    return true;
  });

  for (let i = 0; i < count; i++) {
    const candidates = pool.filter(p => !usedIds.has(p.id));
    const src = candidates.length ? candidates : pool;
    const pick = src[Math.floor(Math.random() * src.length)];
    usedIds.add(pick.id);
    packs.push({
      packId: pick.id,
      price: Math.floor(pick.price * priceScale),
      sold: false,
    });
  }
  return packs;
}

// ============================================================
// Vouchers
// ============================================================

export function generateShopVouchers(
  wave: number,
  owned: VoucherId[] = [],
  guaranteeSlot = false,
): ShopVoucher[] {
  const ownedSet = new Set(owned);
  const pool = VOUCHERS.filter(v => !ownedSet.has(v.id));
  if (pool.length === 0) return [];

  const shouldAppear = guaranteeSlot || Math.random() < (0.22 + Math.min(0.3, wave * 0.01));
  if (!shouldAppear) return [];

  const pick = pool[Math.floor(Math.random() * pool.length)];
  const scale = 1 + Math.min(0.25, wave * 0.015);
  return [{
    voucherId: pick.id,
    price: Math.floor(pick.price * scale),
    sold: false,
  }];
}
