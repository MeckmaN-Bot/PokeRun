export type WaveTagId =
  | 'double_coins'
  | 'rare_tag'
  | 'investment'
  | 'speed_tag'
  | 'orbit_tag'
  | 'boss_tag'
  | 'charm_tag'
  | 'voucher_tag';

export interface WaveTag {
  id: WaveTagId;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export const WAVE_TAGS: WaveTag[] = [
  {
    id: 'double_coins',
    name: 'Double Coins',
    icon: '¢',
    color: '#d4a014',
    description: 'Coins earned from this wave are doubled.',
  },
  {
    id: 'rare_tag',
    name: 'Rare Tag',
    icon: '◈',
    color: '#60a5fa',
    description: 'All rewards from this wave are at least Rare.',
  },
  {
    id: 'investment',
    name: 'Investment',
    icon: '†',
    color: '#7a8a4a',
    description: 'Earn +25¢ per wave until your next boss clear.',
  },
  {
    id: 'speed_tag',
    name: 'Speed Tag',
    icon: '›',
    color: '#0ea5e9',
    description: 'Win this wave in 5 turns or less for +100¢.',
  },
  {
    id: 'orbit_tag',
    name: 'Orbit Tag',
    icon: '◇',
    color: '#a855f7',
    description: 'All team members gain +3 levels at wave end.',
  },
  {
    id: 'boss_tag',
    name: 'Boss Tag',
    icon: '◆',
    color: '#b71c1c',
    description: 'Next boss drops 2 reward cards instead of 1.',
  },
  {
    id: 'charm_tag',
    name: 'Charm Tag',
    icon: '♧',
    color: '#ec4899',
    description: 'Free Master Ball Pouch at the next shop.',
  },
  {
    id: 'voucher_tag',
    name: 'Voucher Tag',
    icon: '◉',
    color: '#f59e0b',
    description: 'Next shop guaranteed to have a voucher.',
  },
];

export function getTagById(id: WaveTagId): WaveTag | undefined {
  return WAVE_TAGS.find(t => t.id === id);
}

export function pickRandomTag(exclude: WaveTagId[] = []): WaveTag {
  const pool = WAVE_TAGS.filter(t => !exclude.includes(t.id));
  const src = pool.length ? pool : WAVE_TAGS;
  return src[Math.floor(Math.random() * src.length)];
}
