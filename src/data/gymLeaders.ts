/**
 * Gen 1 Gym Leaders — lore-accurate ace + signature type. Each leader caps an
 * act (4 steps) and grants a Badge with a passive perk.
 *
 * Sprite slugs come straight from the PokeAPI sprites repo:
 *   https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/<slug>.png
 */

import type { PokemonType } from '../types';

export interface GymLeader {
  id: string;
  /** Display title — uses the canonical English name for clarity. */
  name: string;
  /** Localised short tag for the path eyebrow. */
  city: string;
  /** Single-line flavour line. */
  flavour: string;
  /** Primary type the gym is biased toward. */
  type: PokemonType;
  /** Signature ace national-dex id, used as the lead enemy. */
  acePokemonId: number;
  /** Filler-roster type bias. */
  bias: PokemonType[];
  /** Roster size for the leader fight. */
  teamSize: number;
  /** Level boost over the base wave config. */
  levelDelta: number;
  /** Coin reward multiplier vs. standard wave. */
  coinMultiplier: number;
  /** Hex accent for cards. */
  accent: string;
  /** Pixel emoji fallback if sprite fails. */
  icon: string;
  /** PokeAPI trainer sprite slug. */
  spriteSlug: string;
  /** Badge id this leader awards (matches `badges.ts`). */
  badgeId: string;
}

export const GYM_LEADERS: GymLeader[] = [
  {
    id: 'brock', name: 'Brock', city: 'Pewter City',
    flavour: 'The rock-solid Pokémon trainer. Folds his arms. "Show me your strength."',
    type: 'rock', acePokemonId: 95 /* Onix */,
    bias: ['rock', 'ground'], teamSize: 1, levelDelta: 0, coinMultiplier: 1.8,
    accent: '#7a634a', icon: '◆', spriteSlug: 'brock', badgeId: 'boulder',
  },
  {
    id: 'misty', name: 'Misty', city: 'Cerulean City',
    flavour: 'The tomboyish mermaid. Spins her chain. "My policy is an all-out offensive."',
    type: 'water', acePokemonId: 121 /* Starmie */,
    bias: ['water'], teamSize: 2, levelDelta: 1, coinMultiplier: 1.9,
    accent: '#3a6c8a', icon: '◇', spriteSlug: 'misty', badgeId: 'cascade',
  },
  {
    id: 'surge', name: 'Lt. Surge', city: 'Vermilion City',
    flavour: 'The lightning American. Salutes. "I tell ya, kid — electricity is in MY blood."',
    type: 'electric', acePokemonId: 26 /* Raichu */,
    bias: ['electric'], teamSize: 2, levelDelta: 1, coinMultiplier: 2.0,
    accent: '#c9a417', icon: '★', spriteSlug: 'ltsurge', badgeId: 'thunder',
  },
  {
    id: 'erika', name: 'Erika', city: 'Celadon City',
    flavour: 'The nature-loving princess. Bows. "I had a bad dream — but you woke me up."',
    type: 'grass', acePokemonId: 71 /* Victreebel */,
    bias: ['grass', 'poison'], teamSize: 3, levelDelta: 3, coinMultiplier: 2.0,
    accent: '#5d8266', icon: '◉', spriteSlug: 'erika', badgeId: 'rainbow',
  },
  {
    id: 'koga', name: 'Koga', city: 'Fuchsia City',
    flavour: 'The poisonous ninja master. Bows once. "Now you witness true horror."',
    type: 'poison', acePokemonId: 89 /* Muk */,
    bias: ['poison', 'bug'], teamSize: 3, levelDelta: 3, coinMultiplier: 2.1,
    accent: '#7a3f8a', icon: '☠', spriteSlug: 'koga', badgeId: 'soul',
  },
  {
    id: 'sabrina', name: 'Sabrina', city: 'Saffron City',
    flavour: 'The master of psychic Pokémon. Bends a spoon without touching it.',
    type: 'psychic', acePokemonId: 65 /* Alakazam */,
    bias: ['psychic'], teamSize: 3, levelDelta: 4, coinMultiplier: 2.2,
    accent: '#c14a8a', icon: '◆', spriteSlug: 'sabrina', badgeId: 'marsh',
  },
  {
    id: 'blaine', name: 'Blaine', city: 'Cinnabar Island',
    flavour: 'The hot-headed quizmaster. "My fiery hot Pokémon will make charcoal of you!"',
    type: 'fire', acePokemonId: 59 /* Arcanine */,
    bias: ['fire'], teamSize: 3, levelDelta: 5, coinMultiplier: 2.3,
    accent: '#a64418', icon: '▲', spriteSlug: 'blaine', badgeId: 'volcano',
  },
  {
    id: 'giovanni', name: 'Giovanni', city: 'Viridian City',
    flavour: 'Boss of Team Rocket. "So, after all your meddling — you face me at last."',
    type: 'ground', acePokemonId: 112 /* Rhydon */,
    bias: ['ground', 'rock'], teamSize: 4, levelDelta: 6, coinMultiplier: 2.6,
    accent: '#3a3a3a', icon: '◉', spriteSlug: 'giovanni', badgeId: 'earth',
  },
];

export function getGymLeader(id: string): GymLeader | undefined {
  return GYM_LEADERS.find(g => g.id === id);
}

export function getGymForAct(act: number): GymLeader | undefined {
  // act 1 → Brock, act 8 → Giovanni
  return GYM_LEADERS[act - 1];
}
