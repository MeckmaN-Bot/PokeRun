/**
 * Stakes v1 — Balatro-style cascade-unlocked difficulty modifiers. White is
 * baseline; clearing Champion on White unlocks Red; clearing Champion on Red
 * unlocks Black. Each step bumps difficulty AND coin reward.
 *
 * Storage mirrors decks.ts pattern: per-username localStorage keyed by
 * lowercased name. Quota- and corrupt-safe.
 */

import { showToast } from '../ui/animations';

export interface Stake {
  id: string;
  name: string;
  description: string;
  /** Stake id whose Champion-clear unlocks this stake. White has none. */
  unlockAfter?: string;
  mods?: {
    bossBlindHpMult?: number;
    coinRewardMult?: number;
    shopPriceMult?: number;
    enemySpeedMult?: number;
  };
}

export const STAKES: Stake[] = [
  {
    id: 'white',
    name: 'White Stake',
    description: 'Standard difficulty. The starting trial.',
  },
  {
    id: 'red',
    name: 'Red Stake',
    unlockAfter: 'white',
    description: 'Boss Blinds carry +50% HP. Coins reward +50%.',
    mods: { bossBlindHpMult: 1.5, coinRewardMult: 1.5 },
  },
  {
    id: 'black',
    name: 'Black Stake',
    unlockAfter: 'red',
    description: 'Shop prices +50%. Enemy speed +25%. Coins reward +100%.',
    mods: { shopPriceMult: 1.5, enemySpeedMult: 1.25, coinRewardMult: 2.0 },
  },
];

const KNOWN_STAKE_IDS = new Set(STAKES.map(s => s.id));

const UNLOCKED_KEY_PREFIX = 'pokerun_stakes_unlocked_';
const LAST_STAKE_KEY_PREFIX = 'pokerun_last_stake_';

function unlockedKey(username: string): string {
  return `${UNLOCKED_KEY_PREFIX}${username.toLowerCase()}`;
}
function lastStakeKey(username: string): string {
  return `${LAST_STAKE_KEY_PREFIX}${username.toLowerCase()}`;
}

function readUnlockedSet(username: string): Set<string> {
  const out = new Set<string>(['white']);
  if (!username) return out;
  try {
    const arr = JSON.parse(localStorage.getItem(unlockedKey(username)) ?? '[]');
    if (Array.isArray(arr)) {
      for (const id of arr) {
        if (typeof id === 'string' && KNOWN_STAKE_IDS.has(id)) out.add(id);
      }
    }
  } catch { /* corrupt — fallback to {white} */ }
  return out;
}

export function getUnlockedStakes(username: string): Set<string> {
  return readUnlockedSet(username);
}

export function isStakeUnlocked(username: string, id: string): boolean {
  return readUnlockedSet(username).has(id);
}

export function getLastStake(username: string): string {
  if (!username) return 'white';
  try {
    const raw = localStorage.getItem(lastStakeKey(username));
    if (raw && KNOWN_STAKE_IDS.has(raw) && isStakeUnlocked(username, raw)) return raw;
  } catch { /* storage unavailable */ }
  return 'white';
}

export function saveLastStake(username: string, id: string): void {
  if (!username || !KNOWN_STAKE_IDS.has(id)) return;
  try { localStorage.setItem(lastStakeKey(username), id); } catch { /* ignore */ }
}

/**
 * Cascade unlock: clearing Champion on stake X unlocks the stake whose
 * unlockAfter === X. Idempotent. Fires a toast on newly-unlocked.
 */
export function unlockNextStake(username: string, currentStake: string | undefined | null): void {
  if (!username || !currentStake) return;
  const next = STAKES.find(s => s.unlockAfter === currentStake);
  if (!next) return;
  const set = readUnlockedSet(username);
  if (set.has(next.id)) return;
  set.add(next.id);
  try {
    localStorage.setItem(unlockedKey(username), JSON.stringify([...set]));
  } catch { return; }
  showToast(`${next.name} unlocked!`, 'success');
}

/** Display helper for the leaderboard pill. White → null (no pill). */
export function getStakeName(id: string | undefined | null): string | null {
  if (!id || id === 'white') return null;
  return STAKES.find(s => s.id === id)?.name ?? null;
}

/** Resolved mods for a stake id; returns {} for white/missing. */
export function getStakeMods(id: string | undefined | null): NonNullable<Stake['mods']> {
  if (!id) return {};
  return STAKES.find(s => s.id === id)?.mods ?? {};
}
