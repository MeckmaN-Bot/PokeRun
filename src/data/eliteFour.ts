/**
 * Pokémon League — Elite Four (4 sequential bosses) followed by Champion Blue.
 * Triggered after the player earns all 8 Gen 1 badges.
 */

import type { PokemonType } from '../types';

export interface EliteStep {
  id: string;
  name: string;
  title: string;
  flavour: string;
  acePokemonId: number;
  bias: PokemonType[];
  teamSize: number;
  levelDelta: number;
  coinMultiplier: number;
  accent: string;
  icon: string;
  spriteSlug: string;
  /** True for the final fight, used by main.ts to trigger the gen-gate. */
  isChampion?: boolean;
}

export const ELITE_FOUR: EliteStep[] = [
  {
    id: 'lorelei', name: 'Lorelei', title: 'Elite Four — I',
    flavour: 'Cool, calm, collected. "Pokémon are everything to me."',
    acePokemonId: 131 /* Lapras */, bias: ['ice', 'water'],
    teamSize: 4, levelDelta: 12, coinMultiplier: 3.0,
    accent: '#5a8acc', icon: '❄', spriteSlug: 'lorelei-gen3',
  },
  {
    id: 'bruno', name: 'Bruno', title: 'Elite Four — II',
    flavour: 'Mountain-trained fists. "Hwa-cha! We will grind you down!"',
    acePokemonId: 68 /* Machamp */, bias: ['fighting', 'rock'],
    teamSize: 4, levelDelta: 14, coinMultiplier: 3.2,
    accent: '#a05a2c', icon: '🥋', spriteSlug: 'bruno',
  },
  {
    id: 'agatha', name: 'Agatha', title: 'Elite Four — III',
    flavour: 'Old, sharp, and laughing. "Oak\'s grandchild?! Pokémon are for fighting!"',
    acePokemonId: 94 /* Gengar */, bias: ['ghost', 'poison'],
    teamSize: 4, levelDelta: 16, coinMultiplier: 3.4,
    accent: '#5a3a78', icon: '👻', spriteSlug: 'agatha-gen1',
  },
  {
    id: 'lance', name: 'Lance', title: 'Elite Four — IV',
    flavour: 'Dragon master, last of the four. "I am the most powerful trainer."',
    acePokemonId: 149 /* Dragonite */, bias: ['dragon', 'flying'],
    teamSize: 4, levelDelta: 18, coinMultiplier: 3.6,
    accent: '#b21f1f', icon: '🐉', spriteSlug: 'lance',
  },
  {
    id: 'champion', name: 'Champion Blue', title: 'Champion',
    flavour: 'Your eternal rival. He grins. "Heh! That\'s right! I am the Pokémon Champion!"',
    acePokemonId: 6 /* Charizard */, bias: ['fire', 'water', 'flying', 'normal'],
    teamSize: 5, levelDelta: 22, coinMultiplier: 5.0,
    accent: '#caa15a', icon: '👑', spriteSlug: 'blue', isChampion: true,
  },
];

export function getEliteStep(id: string): EliteStep | undefined {
  return ELITE_FOUR.find(e => e.id === id);
}

export function getEliteByIndex(idx: number): EliteStep | undefined {
  return ELITE_FOUR[idx];
}
