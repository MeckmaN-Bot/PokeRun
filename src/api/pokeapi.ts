import type {
  Pokemon, Move, BaseStats, PokemonType, MoveCategory,
  PokeAPIResponse, PokeAPIMoveResponse,
} from '../types';
import { defaultItemSlots } from '../types';
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

async function apiFetch<T>(url: string, timeoutMs = 8000): Promise<T> {
  const cacheKey = url.replace(API_BASE, '').replace(/\//g, '_');
  const cached = cacheGet<T>(cacheKey);
  if (cached) return cached;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) throw new Error(`API fetch failed: ${url} (${resp.status})`);
    const data: T = await resp.json();
    cacheSet(cacheKey, data);
    return data;
  } finally {
    clearTimeout(timer);
  }
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

interface BuildMovesResult {
  moves: Move[];
  learnsetPool: { name: string; level: number }[];
}

/**
 * Build initial moveset (2 weak moves) + learnset pool.
 * Pokemon start with limited weak moves and learn stronger ones over the run.
 */
async function buildMovesAndLearnset(
  apiMoves: PokeAPIResponse['moves'],
  types: PokemonType[],
  level: number,
): Promise<BuildMovesResult> {
  // Build full level-up learnset (used to learn moves later)
  const levelUpEntries = apiMoves
    .filter(m => m.version_group_details.some(
      vg => vg.move_learn_method.name === 'level-up' && vg.level_learned_at > 0 && vg.level_learned_at <= 60
    ))
    .map(m => ({
      name: m.move.name,
      level: Math.min(...m.version_group_details
        .filter(vg => vg.move_learn_method.name === 'level-up' && vg.level_learned_at > 0)
        .map(vg => vg.level_learned_at)),
    }))
    .sort((a, b) => a.level - b.level);

  // Initial moveset: only moves learned at or before current level, capped to 2 slots, prefer weak/STAB
  const initialEligible = levelUpEntries.filter(e => e.level <= Math.max(level, 1));
  const fetched = await Promise.all(initialEligible.slice(0, 12).map(e => fetchMove(e.name)));
  const validMoves = fetched.filter((m): m is Move => m !== null);

  // Cap power for starting moves so Pokémon must grow into their kit
  const STARTING_POWER_CAP = 60;
  const weakStab = validMoves.filter(m => m.power > 0 && m.power <= STARTING_POWER_CAP && types.includes(m.type));
  const weakAny = validMoves.filter(m => m.power > 0 && m.power <= STARTING_POWER_CAP && !types.includes(m.type));
  const weakStatus = validMoves.filter(m => m.category === 'status' && m.power === 0);

  const selected: Move[] = [];
  const addUnique = (arr: Move[], limit: number) => {
    for (const m of arr) {
      if (selected.length >= limit) break;
      if (!selected.find(s => s.id === m.id)) selected.push(m);
    }
  };
  addUnique(weakStab, 1);
  addUnique(weakAny, 2);
  addUnique(weakStatus, 2);

  // Hard fallback — Tackle if nothing fits
  if (selected.length === 0) {
    const tackle = await fetchMove('tackle');
    if (tackle) selected.push(tackle);
  }

  return {
    moves: selected.slice(0, 2),
    learnsetPool: levelUpEntries,
  };
}

/**
 * Learn moves a Pokémon now qualifies for via its level.
 * Mutates pokemon.moves, pokemon.learnedMoveIds, and pokemon.pendingLearns.
 *
 * If a move slot is free → equip the move directly and mark learned.
 * If all 4 slots are full → push to `pendingLearns` and DO NOT mark learned;
 *   the caller (typically the post-battle flow) opens a picker so the player
 *   chooses which slot to replace, or whether to drop the move into the
 *   reserve pool. Marking happens at commit time.
 */
export interface LearnEvent {
  newMove: Move;
  replacedMove: Move | null;
  /** True when the new move couldn't be auto-equipped (slots full). The
   *  caller must run the picker before treating the learn as resolved. */
  pending?: boolean;
}

export async function learnMovesForLevel(
  pokemon: Pokemon,
): Promise<LearnEvent[]> {
  const events: LearnEvent[] = [];
  if (!pokemon.learnsetPool || pokemon.learnsetPool.length === 0) return events;
  const learned = new Set(pokemon.learnedMoveIds ?? []);
  const pendingIds = new Set((pokemon.pendingLearns ?? []).map(m => m.id));
  const poolIds = new Set((pokemon.movePool ?? []).map(m => m.id));

  const eligible = pokemon.learnsetPool.filter(
    e => e.level > 0 && e.level <= pokemon.level,
  );

  for (const entry of eligible) {
    const move = await fetchMove(entry.name);
    if (!move) continue;
    if (learned.has(move.id) || pendingIds.has(move.id) || poolIds.has(move.id)) continue;

    if (pokemon.moves.length < 4) {
      pokemon.moves.push(move);
      learned.add(move.id);
      events.push({ newMove: move, replacedMove: null });
      continue;
    }

    pokemon.pendingLearns = pokemon.pendingLearns ?? [];
    pokemon.pendingLearns.push(move);
    pendingIds.add(move.id);
    events.push({ newMove: move, replacedMove: null, pending: true });
  }

  pokemon.learnedMoveIds = Array.from(learned);
  return events;
}

/** Commit the player's choice for a pending learn.
 *  - replaceIdx >= 0: swap moves[replaceIdx] with newMove, push the old slot
 *    contents into movePool so the player can re-equip it later.
 *  - replaceIdx === -1: skip the move entirely; it goes into movePool too,
 *    so the player can pick it up later from the move manager.
 *  Either way the move is marked learned to avoid re-prompting. */
export function commitPendingLearn(
  pokemon: Pokemon,
  newMove: Move,
  replaceIdx: number,
): void {
  pokemon.pendingLearns = (pokemon.pendingLearns ?? []).filter(m => m.id !== newMove.id);
  pokemon.movePool = pokemon.movePool ?? [];
  if (replaceIdx >= 0 && replaceIdx < pokemon.moves.length) {
    const removed = pokemon.moves[replaceIdx];
    pokemon.moves[replaceIdx] = { ...newMove };
    if (removed && !pokemon.movePool.some(m => m.id === removed.id)) {
      pokemon.movePool.push(removed);
    }
  } else if (replaceIdx >= 0 && pokemon.moves.length < 4) {
    // Empty slot — just push (also remove from pool if it was stashed there).
    pokemon.moves.push({ ...newMove });
    pokemon.movePool = pokemon.movePool.filter(m => m.id !== newMove.id);
  } else {
    if (!pokemon.movePool.some(m => m.id === newMove.id)) {
      pokemon.movePool.push({ ...newMove });
    }
  }
  const learned = new Set(pokemon.learnedMoveIds ?? []);
  learned.add(newMove.id);
  pokemon.learnedMoveIds = Array.from(learned);
}

/** Swap a move from movePool into a moveset slot. The displaced move
 *  goes back into the pool so the player can rotate freely. */
export function swapMoveFromPool(
  pokemon: Pokemon,
  poolIdx: number,
  slotIdx: number,
): void {
  if (!pokemon.movePool || poolIdx < 0 || poolIdx >= pokemon.movePool.length) return;
  if (slotIdx < 0 || slotIdx >= pokemon.moves.length) return;
  const fromPool = pokemon.movePool[poolIdx];
  const fromSlot = pokemon.moves[slotIdx];
  pokemon.moves[slotIdx] = { ...fromPool };
  pokemon.movePool[poolIdx] = fromSlot;
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

  // Moves + learnset
  const { moves, learnsetPool } = await buildMovesAndLearnset(data.moves, types, level);

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
    itemSlots: defaultItemSlots(),
    sprite,
    animatedSprite,
    isFullyEvolved: evoInfo.isFullyEvolved,
    bst,
    abilities: data.abilities.map(a => a.ability.name),
    evolutionChainId: data.id,
    heightDm: data.height,
    nextEvolutionId: evoInfo.nextEvolutionId,
    evolutionLevel: evoInfo.evolutionLevel,
    learnsetPool,
    learnedMoveIds: moves.map(m => m.id),
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
