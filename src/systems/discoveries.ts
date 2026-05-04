/**
 * Per-username synergy-discovery tracking. Counts which synergy ids the
 * player has triggered across all their runs, surfaced as a meta-progression
 * line on StartScreen ("Synergies discovered: N / 20").
 *
 * Storage: localStorage, scoped by lower-cased username (matches the auth
 * model). Sticky-guest accrues across sessions; clearGuestIdentity does NOT
 * port discoveries — by design.
 *
 * Canonical id list is derived from SYNERGY_CATALOG in synergies.ts so the
 * codex display and the discovered-count cannot drift.
 */

import { SYNERGY_CATALOG } from './synergies';

const KEY_PREFIX = 'pokerun_discovered_synergies_';

const ALL_SYNERGY_IDS = SYNERGY_CATALOG.map(e => e.id);

export const TOTAL_SYNERGIES = ALL_SYNERGY_IDS.length;

const KNOWN = new Set<string>(ALL_SYNERGY_IDS);

function key(username: string): string {
  return `${KEY_PREFIX}${username.toLowerCase()}`;
}

function readSet(username: string): Set<string> {
  try {
    const arr = JSON.parse(localStorage.getItem(key(username)) ?? '[]');
    if (!Array.isArray(arr)) return new Set();
    return new Set<string>(arr.filter((id): id is string => typeof id === 'string' && KNOWN.has(id)));
  } catch {
    return new Set();
  }
}

export function markDiscovered(username: string, ids: string[]): void {
  if (!username || ids.length === 0) return;
  const existing = readSet(username);
  let changed = false;
  for (const id of ids) {
    if (KNOWN.has(id) && !existing.has(id)) {
      existing.add(id);
      changed = true;
    }
  }
  if (!changed) return;
  try {
    localStorage.setItem(key(username), JSON.stringify([...existing]));
  } catch { /* storage unavailable, no-op */ }
}

export function getDiscoveredCount(username: string): number {
  if (!username) return 0;
  return readSet(username).size;
}

/** Codex consumer — returns the validated set of discovered ids. */
export function getDiscoveredSet(username: string): Set<string> {
  if (!username) return new Set();
  return readSet(username);
}
