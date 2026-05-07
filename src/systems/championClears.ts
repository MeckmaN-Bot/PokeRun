/**
 * Per-username Champion-clears counter — bumps on every Pokémon League
 * Champion victory and surfaces on StartScreen as a meta-progression line.
 *
 * Storage: localStorage key 'pokerun_champion_clears_<lowercase-username>'.
 * Mirrors the discoveries/achievements try/catch + corrupt-self-heal pattern.
 */

const KEY_PREFIX = 'pokerun_champion_clears_';

function key(username: string): string {
  return `${KEY_PREFIX}${username.toLowerCase()}`;
}

/** Increment the per-user counter and return the new value. Failure → 0. */
export function bumpChampionClears(username: string): number {
  if (!username) return 0;
  try {
    const raw = localStorage.getItem(key(username));
    const prev = raw ? parseInt(raw, 10) : 0;
    const next = (Number.isFinite(prev) && prev >= 0 ? prev : 0) + 1;
    localStorage.setItem(key(username), String(next));
    return next;
  } catch {
    return 0;
  }
}

export function getChampionClears(username: string): number {
  if (!username) return 0;
  try {
    const raw = localStorage.getItem(key(username));
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}
