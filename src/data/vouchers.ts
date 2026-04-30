export type VoucherId =
  | 'overstock'
  | 'clearance_sale'
  | 'reroll_surplus'
  | 'crystal_ball'
  | 'omen_globe'
  | 'magic_trick'
  | 'grabber'
  | 'tarot_merchant'
  | 'type_atlas'
  | 'held_slot_charter'
  | 'boss_insurance';

export interface Voucher {
  id: VoucherId;
  name: string;
  icon: string;
  price: number;
  description: string;
}

export const VOUCHERS: Voucher[] = [
  {
    id: 'overstock',
    name: 'Mart Restock Permit',
    icon: '▣',
    price: 280,
    description: 'The PokéMart team keeps the shelves fuller. Shop shows 2 extra items.',
  },
  {
    id: 'clearance_sale',
    name: 'Mart Discount Card',
    icon: '¢',
    price: 320,
    description: 'A loyalty card from Celadon Dept. Store. All shop prices 25% cheaper.',
  },
  {
    id: 'reroll_surplus',
    name: 'Free Sample Coupon',
    icon: '⁂',
    price: 220,
    description: 'The clerk waves your first restock through. First reroll per shop is free.',
  },
  {
    id: 'crystal_ball',
    name: 'Itemfinder',
    icon: '◉',
    price: 300,
    description: 'Devon Corp\'s scout device. Reveals the next 2 waves\' enemy roster in advance.',
  },
  {
    id: 'omen_globe',
    name: 'Lucky Charm',
    icon: '◇',
    price: 350,
    description: 'A keepsake from Mt. Moon. Each wave grants +1 reward choice.',
  },
  {
    id: 'magic_trick',
    name: 'Pack-In Promo',
    icon: '✦',
    price: 300,
    description: 'A trading-card promotion. Booster Packs cost 20% less and contain one extra option.',
  },
  {
    id: 'grabber',
    name: 'Pickup Charter',
    icon: '◈',
    price: 200,
    description: 'Lessons from a Pickup-trained Linoone. New recruits arrive with slot 2 already unlocked.',
  },
  {
    id: 'tarot_merchant',
    name: 'Stargazer\'s Permit',
    icon: '☆',
    price: 280,
    description: 'Mossdeep Observatory access. Planet Cards appear 50% more often in the shop.',
  },
  {
    id: 'type_atlas',
    name: 'Type Scope',
    icon: '✦',
    price: 300,
    description: 'A field manual for type matchups. Every Planet Card in this run grants +2 type levels instead of +1.',
  },
  {
    id: 'held_slot_charter',
    name: 'Bag Upgrade Permit',
    icon: '◈',
    price: 350,
    description: 'Bill\'s storage engineers retrofit your team. Every Pokémon unlocks one extra held-item slot.',
  },
  {
    id: 'boss_insurance',
    name: 'Sacred Ash Insurance',
    icon: '✚',
    price: 400,
    description: 'A pinch of legendary ash, kept for emergencies. Once per boss wave a fainted Pokémon auto-revives at 25% HP.',
  },
];

export function getVoucherById(id: VoucherId): Voucher | undefined {
  return VOUCHERS.find(v => v.id === id);
}

export function hasVoucher(owned: VoucherId[], id: VoucherId): boolean {
  return owned.includes(id);
}
