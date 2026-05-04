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
import { BOSS_BLINDS } from '../data/bossBlinds';
import { tryUnlock } from './achievements';

// ── Synergy discoveries ─────────────────────────────────────

const SYNERGY_KEY_PREFIX = 'pokerun_discovered_synergies_';
const ALL_SYNERGY_IDS = SYNERGY_CATALOG.map(e => e.id);
export const TOTAL_SYNERGIES = ALL_SYNERGY_IDS.length;
const KNOWN_SYNERGIES = new Set<string>(ALL_SYNERGY_IDS);

// ── Boss blind discoveries ──────────────────────────────────

const BLIND_KEY_PREFIX = 'pokerun_discovered_blinds_';
const ALL_BLIND_IDS = BOSS_BLINDS.map(b => b.id);
export const TOTAL_BLINDS = ALL_BLIND_IDS.length;
const KNOWN_BLINDS = new Set<string>(ALL_BLIND_IDS);

// ── Generic helpers ─────────────────────────────────────────

function readSet(prefix: string, known: Set<string>, username: string): Set<string> {
  try {
    const arr = JSON.parse(localStorage.getItem(`${prefix}${username.toLowerCase()}`) ?? '[]');
    if (!Array.isArray(arr)) return new Set();
    return new Set<string>(arr.filter((id): id is string => typeof id === 'string' && known.has(id)));
  } catch {
    return new Set();
  }
}

function markIds(
  prefix: string,
  known: Set<string>,
  username: string,
  ids: string[],
): void {
  if (!username || ids.length === 0) return;
  const existing = readSet(prefix, known, username);
  let changed = false;
  for (const id of ids) {
    if (known.has(id) && !existing.has(id)) {
      existing.add(id);
      changed = true;
    }
  }
  if (!changed) return;
  try {
    localStorage.setItem(`${prefix}${username.toLowerCase()}`, JSON.stringify([...existing]));
  } catch { /* storage unavailable, no-op */ }
}

// ── Synergy public API ──────────────────────────────────────

export function markDiscovered(username: string, ids: string[]): void {
  markIds(SYNERGY_KEY_PREFIX, KNOWN_SYNERGIES, username, ids);
  if (getDiscoveredCount(username) >= TOTAL_SYNERGIES) {
    tryUnlock(username, 'synergist');
  }
}

export function getDiscoveredCount(username: string): number {
  if (!username) return 0;
  return readSet(SYNERGY_KEY_PREFIX, KNOWN_SYNERGIES, username).size;
}

export function getDiscoveredSet(username: string): Set<string> {
  if (!username) return new Set();
  return readSet(SYNERGY_KEY_PREFIX, KNOWN_SYNERGIES, username);
}

// ── Boss blind public API ───────────────────────────────────

export function markBlindDiscovered(username: string, ids: string[]): void {
  markIds(BLIND_KEY_PREFIX, KNOWN_BLINDS, username, ids);
  if (getDiscoveredBlindCount(username) >= TOTAL_BLINDS) {
    tryUnlock(username, 'field_reference');
  }
}

export function getDiscoveredBlindCount(username: string): number {
  if (!username) return 0;
  return readSet(BLIND_KEY_PREFIX, KNOWN_BLINDS, username).size;
}

export function getDiscoveredBlindSet(username: string): Set<string> {
  if (!username) return new Set();
  return readSet(BLIND_KEY_PREFIX, KNOWN_BLINDS, username);
}
