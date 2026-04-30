/**
 * Trainer archetypes — themed NPCs the player can encounter on Trainer nodes.
 * Each archetype defines a flavour identity and a type bias used to draw the
 * enemy roster from `typePools`. The actual battle still rolls within the
 * biased pool, so encounters stay surprising.
 */

import type { PokemonType } from '../types';

export interface TrainerArchetype {
  id: string;
  /** Display title on the path card and intro screen. */
  name: string;
  /** Shorter label used inside compact UI (path-card eyebrow, etc.). */
  shortLabel: string;
  /** One-line flavour text. */
  flavour: string;
  /** Pixel-emoji icon for cards (rendered through the px-pixelate filter). */
  icon: string;
  /** Accent colour (hex) for card frames and badges. */
  accent: string;
  /** Type bias for the enemy roster. */
  typeBias: PokemonType[];
  /** Coin reward modifier vs. standard wild wave (1.0 = same). */
  coinMultiplier: number;
  /** Level offset vs. standard wild wave (e.g. +1 = slightly tougher). */
  levelDelta: number;
  /** Soft size override for the team (otherwise scaling default). */
  teamSize?: number;
  /**
   * PokeAPI trainer-sprite slug. Resolves to
   * `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/<slug>.png`
   * — the same Gen 1 sprite roster the game already uses for Pokémon art.
   */
  spriteSlug?: string;
}

/**
 * Build a trainer-sprite URL for an archetype/leader slug. PokeAPI's sprite
 * repo does not host trainer/leader portraits, so we hit Pokémon Showdown's
 * sprite CDN — it covers all gym leaders, archetypes, and Elite Four.
 */
export function trainerSpriteUrl(slug: string): string {
  return `https://play.pokemonshowdown.com/sprites/trainers/${slug}.png`;
}

export const TRAINER_ARCHETYPES: TrainerArchetype[] = [
  {
    id: 'miner',
    name: 'Bergarbeiter',
    shortLabel: 'Miner',
    flavour: 'Crusts the dust off his boots and grins. "Got a few rock-hards down here."',
    icon: '⛏',
    accent: '#7a634a',
    typeBias: ['rock', 'ground', 'fighting'],
    coinMultiplier: 1.25,
    levelDelta: 0,
    spriteSlug: 'hiker',
  },
  {
    id: 'cop',
    name: 'Polizist',
    shortLabel: 'Officer',
    flavour: 'Tips his cap. "Routine inspection. Hope your Pokémon are squared away."',
    icon: '🚓',
    accent: '#2a4a78',
    typeBias: ['normal', 'fighting', 'dark'],
    coinMultiplier: 1.30,
    levelDelta: 1,
    spriteSlug: 'gentleman',
  },
  {
    id: 'swimmer',
    name: 'Schwimmer',
    shortLabel: 'Swimmer',
    flavour: 'Goggles up. "The current\'s perfect. Want to spar before I dive?"',
    icon: '🏊',
    accent: '#3a6c8a',
    typeBias: ['water'],
    coinMultiplier: 1.20,
    levelDelta: 0,
    spriteSlug: 'swimmer',
  },
  {
    id: 'bug_catcher',
    name: 'Käfersammler',
    shortLabel: 'Bug Catcher',
    flavour: 'Holds out a net, eyes sparkling. "I just caught the perfect one!"',
    icon: '🐛',
    accent: '#6e8b32',
    typeBias: ['bug', 'grass'],
    coinMultiplier: 0.95,
    levelDelta: -1,
    spriteSlug: 'bugcatcher',
  },
  {
    id: 'ranger',
    name: 'Pfadfinder',
    shortLabel: 'Ranger',
    flavour: 'Field cap, weathered map. "Trail rules: clear battle, then we both move on."',
    icon: '🥾',
    accent: '#4d6b3f',
    typeBias: ['grass', 'normal', 'flying'],
    coinMultiplier: 1.10,
    levelDelta: 0,
    spriteSlug: 'acetrainer',
  },
  {
    id: 'channeler',
    name: 'Geistheilerin',
    shortLabel: 'Channeler',
    flavour: 'Hood low. Whispers a name you don\'t catch.',
    icon: '🔮',
    accent: '#5a3a78',
    typeBias: ['ghost', 'psychic'],
    coinMultiplier: 1.40,
    levelDelta: 1,
    spriteSlug: 'channeler-gen1',
  },
  {
    id: 'school_kid',
    name: 'Schulkind',
    shortLabel: 'Schoolkid',
    flavour: 'Bag bouncing, gap-tooth grin. "I just got my license!"',
    icon: '🎒',
    accent: '#c08a2c',
    typeBias: ['normal', 'fairy'],
    coinMultiplier: 0.85,
    levelDelta: -2,
    teamSize: 1,
    spriteSlug: 'youngster',
  },
  {
    id: 'biker',
    name: 'Rocker',
    shortLabel: 'Biker',
    flavour: 'Engine idles. Leather creaks. "You blocking the road, kid?"',
    icon: '🏍',
    accent: '#5a2a2a',
    typeBias: ['poison', 'dark', 'fire'],
    coinMultiplier: 1.35,
    levelDelta: 1,
    spriteSlug: 'biker',
  },
  {
    id: 'firebreather',
    name: 'Feuerschlucker',
    shortLabel: 'Firebreather',
    flavour: 'Cracks his knuckles. "Light my fire, kid."',
    icon: '🔥',
    accent: '#a64418',
    typeBias: ['fire'],
    coinMultiplier: 1.30,
    levelDelta: 1,
    spriteSlug: 'burglar',
  },
  {
    id: 'sailor',
    name: 'Matrose',
    shortLabel: 'Sailor',
    flavour: 'Rolls his sleeves. "Salt in the air. Salt in your tea."',
    icon: '⚓',
    accent: '#1d4f6e',
    typeBias: ['water', 'fighting'],
    coinMultiplier: 1.15,
    levelDelta: 0,
    spriteSlug: 'sailor',
  },
];

export function getTrainerArchetype(id: string): TrainerArchetype | undefined {
  return TRAINER_ARCHETYPES.find(t => t.id === id);
}

export function pickRandomArchetype(act: number): TrainerArchetype {
  // Phase B: bias toward easier archetypes early, harder later.
  const eligible = TRAINER_ARCHETYPES.filter(t => {
    if (act <= 1) return t.levelDelta <= 0;
    if (act <= 3) return t.levelDelta <= 1;
    return true;
  });
  const pool = eligible.length > 0 ? eligible : TRAINER_ARCHETYPES;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Pick a trainer archetype whose typeBias overlaps the requested types.
 * Falls back to a generic random pick if no match exists.
 */
export function pickArchetypeByType(types: PokemonType[], act: number): TrainerArchetype {
  const wantSet = new Set(types);
  const matches = TRAINER_ARCHETYPES.filter(t => t.typeBias.some(b => wantSet.has(b)));
  if (matches.length > 0) {
    return matches[Math.floor(Math.random() * matches.length)];
  }
  return pickRandomArchetype(act);
}
