import type { PokemonType } from '../types';

export type BossBlindId =
  | 'the_hook'
  | 'the_wall'
  | 'the_ox'
  | 'the_needle'
  | 'the_mouth'
  | 'the_manacle'
  | 'the_tooth'
  | 'the_fish'
  | 'the_serpent'
  | 'the_eye';

export interface BossBlind {
  id: BossBlindId;
  name: string;
  icon: string;
  color: string;
  description: string;
  /** Short tactical hint shown to the player */
  tacticalHint: string;
}

export const BOSS_BLINDS: BossBlind[] = [
  {
    id: 'the_hook',
    name: 'The Hook',
    icon: '⌾',
    color: '#8b2a2a',
    description: 'Player loses 1 random item-slot item each turn.',
    tacticalHint: 'Bring items you can afford to lose.',
  },
  {
    id: 'the_wall',
    name: 'The Wall',
    icon: '▣',
    color: '#3a3a3a',
    description: 'Enemies start with 2× max HP.',
    tacticalHint: 'Bring sustained damage.',
  },
  {
    id: 'the_ox',
    name: 'The Ox',
    icon: '◍',
    color: '#704214',
    description: 'Your first attack each battle deals 0 damage.',
    tacticalHint: 'Don\'t waste your strongest opener.',
  },
  {
    id: 'the_needle',
    name: 'The Needle',
    icon: '✕',
    color: '#a03060',
    description: 'Moves deal 50% less damage — but crits deal 3×.',
    tacticalHint: 'Stack crit-rate items.',
  },
  {
    id: 'the_mouth',
    name: 'The Mouth',
    icon: '○',
    color: '#4a1c6a',
    description: 'No synergies are active this battle.',
    tacticalHint: 'Raw stats only. Bring strong mons.',
  },
  {
    id: 'the_manacle',
    name: 'The Manacle',
    icon: '⊘',
    color: '#2a5a8a',
    description: 'All your Pokémon enter with −2 to all stat stages.',
    tacticalHint: 'Stat boost perks (Synergy Link) shine here.',
  },
  {
    id: 'the_tooth',
    name: 'The Tooth',
    icon: '◤',
    color: '#b04020',
    description: 'Enemies heal 50% max HP once at 50% HP.',
    tacticalHint: 'Burst them before they recover.',
  },
  {
    id: 'the_fish',
    name: 'The Fish',
    icon: '∿',
    color: '#2a6a8a',
    description: 'Held items are disabled this battle.',
    tacticalHint: 'Raw type/stat matchups only.',
  },
  {
    id: 'the_serpent',
    name: 'The Serpent',
    icon: '⟲',
    color: '#2a6a4a',
    description: 'Your moves do not get STAB bonuses.',
    tacticalHint: 'High-power non-STAB coverage helps.',
  },
  {
    id: 'the_eye',
    name: 'The Eye',
    icon: '◉',
    color: '#6a4a8a',
    description: 'No move can be used twice per battle.',
    tacticalHint: 'Bring Pokémon with 4 different moves.',
  },
];

export function getBossBlindById(id: BossBlindId): BossBlind | undefined {
  return BOSS_BLINDS.find(b => b.id === id);
}

export function pickRandomBossBlind(excludeIds: BossBlindId[] = []): BossBlind {
  const pool = BOSS_BLINDS.filter(b => !excludeIds.includes(b.id));
  const src = pool.length ? pool : BOSS_BLINDS;
  return src[Math.floor(Math.random() * src.length)];
}

/** Return a list of ignored PokemonTypes (for The Mouth / The Serpent flavour helpers). */
export function blindDisablesSynergies(blindId: BossBlindId | null | undefined): boolean {
  return blindId === 'the_mouth';
}
export function blindDisablesStab(blindId: BossBlindId | null | undefined): boolean {
  return blindId === 'the_serpent';
}
export function blindDisablesItems(blindId: BossBlindId | null | undefined): boolean {
  return blindId === 'the_fish';
}

// Type placeholder helper for unused imports (keeps the file valid)
export type __BlindTypeStub = PokemonType;
