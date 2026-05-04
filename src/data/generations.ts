/**
 * Generation registry — single source of truth for the 9 main-series eras.
 * Status drives gen-gate availability: 'live' is playable, 'coming_soon' is
 * a visible-but-disabled teaser, 'planned' is architecture-only and not
 * surfaced in the UI yet.
 *
 * curatedKeep narrows the wild encounter pool — without it, every Gen-N
 * run would pull every ID in pokemonRange. ~30 strong picks per region
 * matches Marius's "no chaos" directive.
 *
 * Storage of player-unlocked gens lives at
 *   pokerun_unlocked_gens_<lowercase-username>
 * gen1 is auto-included; clearing Champion in gen N unlocks the next 'live' gen.
 */

export type GenerationStatus = 'live' | 'coming_soon' | 'planned';

export interface Generation {
  id: string;
  ordinal: number;
  region: string;
  themeAccent: string;
  pokemonRange: { min: number; max: number };
  /** Strong-picks subset of the gen's pokemonRange. Empty for planned/coming-soon. */
  curatedKeep: number[];
  /** Starter ids visible on the StartScreen carousel for this gen. */
  starterPool: number[];
  /** Gen id whose Champion-clear unlocks this gen. null = default-unlocked. */
  unlockAfter: string | null;
  status: GenerationStatus;
  /** Flavor text rendered in the Coming-Soon mini-modal. */
  flavorText?: string;
}

/** Curated Gen 2 picks lifted from the prior GEN2_KEEP literal in enemyPools.ts.
 *  Held here so the registry is the single source of truth. */
const GEN2_CURATED: number[] = [
  // Wave 6-10 tier — early Johto basics
  152, 155, 158, 161, 163, 167, 170, 172, 173, 187,
  // Wave 11-15 tier — mid Johto
  153, 156, 159, 168, 178, 184, 195, 199, 219, 224,
  // Wave 16-20 tier — final evos + powerhouses
  154, 157, 160, 181, 185, 196, 197, 211, 230, 245,
  // Wave 21+ tier — legendaries
  248, 249, 250,
];

export const GENERATIONS: Generation[] = [
  {
    id: 'gen1', ordinal: 1, region: 'Kanto', themeAccent: '#cc4040',
    pokemonRange: { min: 1, max: 151 },
    curatedKeep: [],
    starterPool: [1, 4, 7, 25, 133],
    unlockAfter: null, status: 'live',
  },
  {
    id: 'gen2', ordinal: 2, region: 'Johto', themeAccent: '#dab94a',
    pokemonRange: { min: 152, max: 251 },
    curatedKeep: GEN2_CURATED,
    starterPool: [152, 155, 158, 25, 133],
    unlockAfter: 'gen1', status: 'live',
  },
  {
    id: 'gen3', ordinal: 3, region: 'Hoenn', themeAccent: '#3a8aa3',
    pokemonRange: { min: 252, max: 386 },
    curatedKeep: [],
    starterPool: [252, 255, 258, 25, 133],
    unlockAfter: 'gen2', status: 'coming_soon',
    flavorText: 'The Hoenn region awaits. Lore, content, and gym leaders incoming in the next epic.',
  },
  {
    id: 'gen4', ordinal: 4, region: 'Sinnoh', themeAccent: '#6a8aa3',
    pokemonRange: { min: 387, max: 493 },
    curatedKeep: [],
    starterPool: [387, 390, 393, 25, 133],
    unlockAfter: 'gen3', status: 'planned',
  },
  {
    id: 'gen5', ordinal: 5, region: 'Unova', themeAccent: '#8a3a3a',
    pokemonRange: { min: 494, max: 649 },
    curatedKeep: [],
    starterPool: [495, 498, 501, 25, 133],
    unlockAfter: 'gen4', status: 'planned',
  },
  {
    id: 'gen6', ordinal: 6, region: 'Kalos', themeAccent: '#3a6a8a',
    pokemonRange: { min: 650, max: 721 },
    curatedKeep: [],
    starterPool: [650, 653, 656, 25, 133],
    unlockAfter: 'gen5', status: 'planned',
  },
  {
    id: 'gen7', ordinal: 7, region: 'Alola', themeAccent: '#e0a73a',
    pokemonRange: { min: 722, max: 809 },
    curatedKeep: [],
    starterPool: [722, 725, 728, 25, 133],
    unlockAfter: 'gen6', status: 'planned',
  },
  {
    id: 'gen8', ordinal: 8, region: 'Galar', themeAccent: '#7a3a8a',
    pokemonRange: { min: 810, max: 905 },
    curatedKeep: [],
    starterPool: [810, 813, 816, 25, 133],
    unlockAfter: 'gen7', status: 'planned',
  },
  {
    id: 'gen9', ordinal: 9, region: 'Paldea', themeAccent: '#8a3a4a',
    pokemonRange: { min: 906, max: 1025 },
    curatedKeep: [],
    starterPool: [906, 909, 912, 25, 133],
    unlockAfter: 'gen8', status: 'planned',
  },
];

const GEN_BY_ID = new Map(GENERATIONS.map(g => [g.id, g]));

export function getGenById(id: string): Generation | undefined {
  return GEN_BY_ID.get(id);
}

export function getNextGen(currentId: string): Generation | undefined {
  const cur = GEN_BY_ID.get(currentId);
  if (!cur) return undefined;
  return GENERATIONS.find(g => g.unlockAfter === cur.id);
}

export function getLiveGens(): Generation[] {
  return GENERATIONS.filter(g => g.status === 'live');
}

export function getComingSoonGens(): Generation[] {
  return GENERATIONS.filter(g => g.status === 'coming_soon');
}

/** All ids whose curatedKeep should contribute to the wild pool when running
 *  a 'live' gen (or endless). Includes only live gens to avoid leaking
 *  unfinished content. */
export function getLiveCuratedKeep(): Set<number> {
  const out = new Set<number>();
  for (const g of GENERATIONS) {
    if (g.status === 'live') for (const id of g.curatedKeep) out.add(id);
  }
  return out;
}

// ── Per-username unlock storage ───────────────────────────────

const UNLOCKED_GEN_KEY_PREFIX = 'pokerun_unlocked_gens_';
const KNOWN_IDS = new Set(GENERATIONS.map(g => g.id));

function unlockedKey(username: string): string {
  return `${UNLOCKED_GEN_KEY_PREFIX}${username.toLowerCase()}`;
}

export function getUnlockedGens(username: string): Set<string> {
  const out = new Set<string>(['gen1']);
  if (!username) return out;
  try {
    const arr = JSON.parse(localStorage.getItem(unlockedKey(username)) ?? '[]');
    if (Array.isArray(arr)) {
      for (const id of arr) {
        if (typeof id === 'string' && KNOWN_IDS.has(id)) out.add(id);
      }
    }
  } catch { /* corrupt — fallback to {gen1} */ }
  return out;
}

export function isGenUnlocked(unlockedSet: Set<string>, id: string): boolean {
  return unlockedSet.has(id);
}

/**
 * Cascade unlock: clearing Champion in gen X unlocks the next 'live' gen.
 * Coming-Soon and Planned gens are NOT unlocked (they're not playable).
 * Idempotent.
 */
export function unlockNextGen(username: string, currentGenId: string | undefined | null): void {
  if (!username || !currentGenId) return;
  const next = getNextGen(currentGenId);
  if (!next || next.status !== 'live') return;
  const set = getUnlockedGens(username);
  if (set.has(next.id)) return;
  set.add(next.id);
  try {
    localStorage.setItem(unlockedKey(username), JSON.stringify([...set]));
  } catch { /* ignore */ }
}
