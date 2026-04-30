import type { Rarity } from '../types';

export type PackId = 'poke_ball' | 'great_ball' | 'ultra_ball' | 'master_ball' | 'premier_ball';

export interface BoosterPack {
  id: PackId;
  name: string;
  /** PokeAPI item name for sprite. */
  pokeapiName: string;
  color: string;
  price: number;
  /** What kind of rewards are inside. */
  contents: 'held_items' | 'perks' | 'consumables' | 'mixed' | 'spectral';
  /** Number of options shown. */
  options: number;
  /** Number of options the player can pick. */
  pick: number;
  /** Minimum rarity floor. */
  minRarity?: Rarity;
  description: string;
}

export const BOOSTER_PACKS: BoosterPack[] = [
  {
    id: 'poke_ball',
    name: 'Poké Ball Booster',
    pokeapiName: 'poke-ball',
    color: '#dc2626',
    price: 50,
    contents: 'held_items',
    options: 3,
    pick: 1,
    description: '3 held items — keep 1.',
  },
  {
    id: 'great_ball',
    name: 'Great Ball Booster',
    pokeapiName: 'great-ball',
    color: '#2563eb',
    price: 60,
    contents: 'consumables',
    options: 3,
    pick: 1,
    description: '3 consumables — keep 1.',
  },
  {
    id: 'ultra_ball',
    name: 'Ultra Ball Booster',
    pokeapiName: 'ultra-ball',
    color: '#eab308',
    price: 80,
    contents: 'perks',
    options: 2,
    pick: 1,
    description: '2 trainer perks — keep 1.',
  },
  {
    id: 'master_ball',
    name: 'Master Ball Booster',
    pokeapiName: 'master-ball',
    color: '#a855f7',
    price: 120,
    contents: 'mixed',
    options: 5,
    pick: 2,
    minRarity: 'rare',
    description: '5 rare-tier goods — keep 2.',
  },
  {
    id: 'premier_ball',
    name: 'Premier Ball Booster',
    pokeapiName: 'premier-ball',
    color: '#be123c',
    price: 100,
    contents: 'spectral',
    options: 2,
    pick: 1,
    minRarity: 'epic',
    description: '2 mighty items — carries a cost.',
  },
];

/** Short series label, used on PackArt header strip. */
export const PACK_SERIES: Record<PackId, string> = {
  poke_ball: 'SERIES I',
  great_ball: 'SERIES II',
  ultra_ball: 'SERIES III',
  master_ball: 'SERIES IV',
  premier_ball: 'SPECIAL',
};

/** Two-tone gradient stops for the PackArt body, per pack. */
export const PACK_PALETTE: Record<PackId, [string, string]> = {
  poke_ball:    ['#e84040', '#c01818'],
  great_ball:   ['#2a6fd8', '#154aa8'],
  ultra_ball:   ['#ffc83a', '#ca8a04'],
  master_ball:  ['#a855f7', '#6b21a8'],
  premier_ball: ['#f8f1dd', '#8b2f00'],
};

/** Short kind label printed on the bottom band. */
export const PACK_KIND_LABEL: Record<PackId, string> = {
  poke_ball: 'held items',
  great_ball: 'consumables',
  ultra_ball: 'trainer perks',
  master_ball: 'rare goods',
  premier_ball: 'mighty items',
};

/** Short title used on the pack name plate (without the word "Booster"). */
export const PACK_SHORT_TITLE: Record<PackId, string> = {
  poke_ball: 'Poké Ball',
  great_ball: 'Great Ball',
  ultra_ball: 'Ultra Ball',
  master_ball: 'Master Ball',
  premier_ball: 'Premier Ball',
};

export function getPackById(id: PackId): BoosterPack | undefined {
  return BOOSTER_PACKS.find(p => p.id === id);
}

// ============================================================
// Spectral Curses — applied when player takes from Spectral Pack
// ============================================================

export type SpectralCurseId =
  | 'frayed_edge'
  | 'heavy_load'
  | 'blood_pact'
  | 'time_debt';

export interface SpectralCurse {
  id: SpectralCurseId;
  name: string;
  description: string;
}

export const SPECTRAL_CURSES: SpectralCurse[] = [
  {
    id: 'frayed_edge',
    name: 'Frayed Edge',
    description: 'Team max HP reduced by 10% for the rest of the run.',
  },
  {
    id: 'heavy_load',
    name: 'Heavy Load',
    description: 'Team Speed reduced by 10% for the rest of the run.',
  },
  {
    id: 'blood_pact',
    name: 'Blood Pact',
    description: 'Lose 50 coins now.',
  },
  {
    id: 'time_debt',
    name: 'Time Debt',
    description: 'Next 2 waves give no coin reward.',
  },
];

export function pickRandomCurse(): SpectralCurse {
  return SPECTRAL_CURSES[Math.floor(Math.random() * SPECTRAL_CURSES.length)];
}
