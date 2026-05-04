/**
 * Per-username synergy-discovery tracking. Counts which synergy ids the
 * player has triggered across all their runs, surfaced as a meta-progression
 * line on StartScreen ("Synergies discovered: N / 20").
 *
 * Storage: localStorage, scoped by lower-cased username (matches the auth
 * model). Sticky-guest accrues across sessions; clearGuestIdentity does NOT
 * port discoveries — by design.
 *
 * Single source of truth for the canonical id list lives here. Any addition
 * to src/systems/synergies.ts MUST also be added to ALL_SYNERGY_IDS below,
 * otherwise the new id will be silently dropped on save (filtered) and the
 * count will not include it.
 */

const KEY_PREFIX = 'pokerun_discovered_synergies_';

const ALL_SYNERGY_IDS = [
  'lead_vanguard', 'last_stand', 'mono_legion', 'type_trio', 'type_bond',
  'trinity', 'brute_force', 'mind_surge', 'berserker', 'vampire_strike',
  'precision_hunter', 'synergy_stone', 'rally_band', 'type_enhancer',
  'momentum_badge', 'royal_arsenal', 'gilded_crown', 'phoenix_oath',
  'brilliant_beam', 'formation_crest',
] as const;

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
