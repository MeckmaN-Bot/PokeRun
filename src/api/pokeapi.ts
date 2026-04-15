import type {
  Pokemon, Move, BaseStats, PokemonType, MoveCategory,
  PokeAPIResponse, PokeAPIMoveResponse,
} from '../types';
import { getStaticSprite, getAnimatedSprite, likelyHasAnimatedSprite } from './sprites';

const CACHE_KEY_PREFIX = 'pokelike_cache_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const API_BASE = 'https://pokeapi.co/api/v2';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY_PREFIX + key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function cacheSet<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(entry));
  } catch {
    // localStorage full — clear old entries
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_KEY_PREFIX));
      keys.slice(0, Math.floor(keys.length / 2)).forEach(k => localStorage.removeItem(k));
      localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify({ data, timestamp: Date.now() }));
    } catch {
      // silently fail
    }
  }
}

async function apiFetch<T>(url: string): Promise<T> {
  const cacheKey = url.replace(API_BASE, '').replace(/\//g, '_');
  const cached = cacheGet<T>(cacheKey);
  if (cached) return cached;

  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`API fetch failed: ${url} (${resp.status})`);
  const data: T = await resp.json();
  cacheSet(cacheKey, data);
  return data;
}

// Map PokeAPI stat names to our stat keys
function mapStatName(name: string): keyof BaseStats | null {
  const map: Record<string, keyof BaseStats> = {
    'hp': 'hp',
    'attack': 'attack',
    'defense': 'defense',
    'special-attack': 'spAtk',
    'special-defense': 'spDef',
    'speed': 'speed',
  };
  return map[name] ?? null;
}

// Calculate actual stat value from base stat + level
export function calcStat(baseStat: number, level: number, isHp: boolean): number {
  const iv = 31;
  const ev = 0;
  if (isHp) {
    return Math.floor(((2 * baseStat + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
  }
  return Math.floor(
    (Math.floor(((2 * baseStat + iv + Math.floor(ev / 4)) * level) / 100) + 5) * 1.0
  );
}

// Calculate all stats for a Pokemon at a given level
function calcAllStats(base: BaseStats, level: number): BaseStats {
  return {
    hp: calcStat(base.hp, level, true),
    attack: calcStat(base.attack, level, false),
    defense: calcStat(base.defense, level, false),
    spAtk: calcStat(base.spAtk, level, false),
    spDef: calcStat(base.spDef, level, false),
    speed: calcStat(base.speed, level, false),
  };
}

// Move data cache
const moveCache = new Map<string, Move>();

export async function fetchMove(nameOrId: string | number): Promise<Move | null> {
  const key = String(nameOrId);
  if (moveCache.has(key)) return moveCache.get(key)!;

  try {
    const data = await apiFetch<PokeAPIMoveResponse>(`${API_BASE}/move/${key}`);

    // Skip Z-moves, max moves, and moves with no power that are status
    const category = data.damage_class.name as MoveCategory;
    const power = data.power ?? 0;
    const accuracy = data.accuracy ?? 100;

    const move: Move = {
      id: data.id,
      name: data.name,
      displayName: data.name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
      type: data.type.name as PokemonType,
      category,
      power,
      accuracy,
      pp: data.pp,
      maxPp: data.pp,
      effect: data.effect_entries.find(e => e.language.name === 'en')?.short_effect ?? '',
      effectChance: data.effect_chance ?? 0,
      priority: data.priority,
      isContact: data.flags?.['contact'] ?? false,
      isSoundBased: data.flags?.['sound'] ?? false,
      isPowder: data.flags?.['powder'] ?? false,
      isTwoTurn: data.flags?.['charge'] ?? false,
      target: data.target.name,
    };

    moveCache.set(key, move);
    moveCache.set(String(data.id), move);
    return move;
  } catch {
    return null;
  }
}

// Select up to 4 good moves for a Pokemon from its learnset
async function selectMoves(apiMoves: PokeAPIResponse['moves'], types: PokemonType[]): Promise<Move[]> {
  // Filter to level-up moves only
  const levelUpMoves = apiMoves
    .filter(m => m.version_group_details.some(
      vg => vg.move_learn_method.name === 'level-up' && vg.level_learned_at <= 60
    ))
    .map(m => ({
      name: m.move.name,
      level: Math.max(...m.version_group_details
        .filter(vg => vg.move_learn_method.name === 'level-up')
        .map(vg => vg.level_learned_at)),
    }))
    .sort((a, b) => b.level - a.level)
    .slice(0, 20); // Fetch top 20 candidates

  const fetchedMoves = await Promise.all(
    levelUpMoves.map(m => fetchMove(m.name))
  );

  const validMoves = fetchedMoves.filter((m): m is Move => m !== null);

  // Prioritize: STAB moves with power > 60, then other damaging moves, then status
  const stabDamaging = validMoves.filter(m => m.power > 60 && types.includes(m.type));
  const otherDamaging = validMoves.filter(m => m.power > 60 && !types.includes(m.type));
  const weakDamaging = validMoves.filter(m => m.power > 0 && m.power <= 60);
  const statusMoves = validMoves.filter(m => m.category === 'status' && m.power === 0);

  const selected: Move[] = [];
  const addUnique = (moves: Move[]) => {
    for (const m of moves) {
      if (selected.length >= 4) break;
      if (!selected.find(s => s.id === m.id)) selected.push(m);
    }
  };

  addUnique(stabDamaging.slice(0, 2));
  addUnique(otherDamaging);
  addUnique(weakDamaging);
  addUnique(statusMoves.slice(0, 1));

  // Ensure at least 1 damaging move
  if (selected.length === 0 || selected.every(m => m.power === 0)) {
    // Add Tackle as fallback
    const tackle = await fetchMove('tackle');
    if (tackle) selected.unshift(tackle);
  }

  return selected.slice(0, 4);
}

// ============================================================
// Evolution info cache
// ============================================================

interface EvolutionInfo {
  nextEvolutionId: number | null;
  evolutionLevel: number | null;
  isFullyEvolved: boolean;
}

const evolutionInfoCache = new Map<string, EvolutionInfo>();

async function fetchEvolutionInfo(pokemonName: string): Promise<EvolutionInfo> {
  if (evolutionInfoCache.has(pokemonName)) return evolutionInfoCache.get(pokemonName)!;

  const fallback: EvolutionInfo = { nextEvolutionId: null, evolutionLevel: null, isFullyEvolved: true };

  try {
    type EvolutionDetail = { min_level: number | null; trigger: { name: string } };
    type ChainNode = {
      species: { name: string; url: string };
      evolves_to: ChainNode[];
      evolution_details: EvolutionDetail[];
    };

    const speciesData = await apiFetch<{ evolution_chain: { url: string } }>(
      `${API_BASE}/pokemon-species/${pokemonName}`
    );
    const chainData = await apiFetch<{ chain: ChainNode }>(speciesData.evolution_chain.url);

    function findInfo(node: ChainNode, target: string): EvolutionInfo | null {
      if (node.species.name === target) {
        if (node.evolves_to.length === 0) {
          return { nextEvolutionId: null, evolutionLevel: null, isFullyEvolved: true };
        }
        const nextNode = node.evolves_to[0];
        const detail = nextNode.evolution_details[0] as EvolutionDetail | undefined;
        const urlParts = nextNode.species.url.replace(/\/$/, '').split('/');
        const speciesId = parseInt(urlParts[urlParts.length - 1]);
        return {
          nextEvolutionId: isNaN(speciesId) ? null : speciesId,
          evolutionLevel: detail?.min_level ?? null,
          isFullyEvolved: false,
        };
      }
      for (const child of node.evolves_to) {
        const result = findInfo(child, target);
        if (result !== null) return result;
      }
      return null;
    }

    const info = findInfo(chainData.chain, pokemonName) ?? fallback;
    evolutionInfoCache.set(pokemonName, info);
    return info;
  } catch {
    evolutionInfoCache.set(pokemonName, fallback);
    return fallback;
  }
}

/** Fetch the next evolution of a Pokémon at the same level, preserving the held item. */
export async function fetchNextEvolution(pokemon: import('../types').Pokemon): Promise<import('../types').Pokemon | null> {
  if (!pokemon.nextEvolutionId) return null;
  try {
    return await fetchPokemon(pokemon.nextEvolutionId, pokemon.level);
  } catch {
    return null;
  }
}

// Main function: fetch and build a Pokemon at a given level
export async function fetchPokemon(idOrName: number | string, level: number): Promise<Pokemon> {
  const cacheKey = `_pokemon_${idOrName}_${level}`;
  const cached = cacheGet<Pokemon>(cacheKey);
  if (cached) return cached;

  const data = await apiFetch<PokeAPIResponse>(`${API_BASE}/pokemon/${idOrName}`);

  // Store raw data for other uses
  cacheSet(`_pokemon_${data.id}`, data);

  // Build base stats
  const baseStats: BaseStats = {
    hp: 45, attack: 45, defense: 45, spAtk: 45, spDef: 45, speed: 45,
  };
  for (const s of data.stats) {
    const key = mapStatName(s.stat.name);
    if (key) baseStats[key] = s.base_stat;
  }

  const bst = Object.values(baseStats).reduce((a, b) => a + b, 0);

  // Types
  const types = data.types
    .sort((a, b) => a.slot - b.slot)
    .map(t => t.type.name as PokemonType);

  // Moves
  const moves = await selectMoves(data.moves, types);

  // Sprites
  const sprite = getStaticSprite(data.id);
  const animatedSprite = likelyHasAnimatedSprite(data.id)
    ? getAnimatedSprite(data.id)
    : sprite;

  // Fetch evolution info (cached after first call)
  const evoInfo = await fetchEvolutionInfo(data.name);

  const displayName = data.name
    .split('-')
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join('-');

  const pokemon: Pokemon = {
    id: data.id,
    name: data.name,
    displayName,
    types,
    baseStats,
    level,
    moves,
    heldItem: null,
    sprite,
    animatedSprite,
    isFullyEvolved: evoInfo.isFullyEvolved,
    bst,
    abilities: data.abilities.map(a => a.ability.name),
    evolutionChainId: data.id,
    nextEvolutionId: evoInfo.nextEvolutionId,
    evolutionLevel: evoInfo.evolutionLevel,
  };

  cacheSet(cacheKey, pokemon);
  return pokemon;
}

// Fetch multiple pokemon in parallel
export async function fetchPokemonBatch(
  ids: number[],
  level: number,
  onProgress?: (done: number, total: number) => void
): Promise<Pokemon[]> {
  const results: Pokemon[] = [];
  let done = 0;

  // Fetch in batches of 5 to avoid hammering the API
  const batchSize = 5;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const fetched = await Promise.all(batch.map(id => fetchPokemon(id, level)));
    results.push(...fetched);
    done += fetched.length;
    onProgress?.(done, ids.length);
  }
  return results;
}

// Pre-fetch starters on game load
export async function prefetchStarters(): Promise<void> {
  const starterIds = [1, 4, 7, 25, 133];
  await fetchPokemonBatch(starterIds, 5);
}
