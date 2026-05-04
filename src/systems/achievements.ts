/**
 * Per-username achievement tracking — milestone-based unlocks complementary
 * to the count-based discovery trackers in discoveries.ts. Each id can be
 * unlocked at most once. Caller-friendly wrapper `tryUnlock` fires a toast
 * via the existing animations helper.
 *
 * Storage: localStorage key 'pokerun_achievements_<lowercase-username>'.
 */

import { showToast } from '../ui/animations';

export interface Achievement {
  id: string;
  name: string;
  eyebrow: string;
  description: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_step',      name: 'First Step',      eyebrow: 'First steps.',
    description: 'Clear your first wave. Every legend starts here.' },
  { id: 'boulder_master',  name: 'Boulder Master',  eyebrow: 'Act 1.',
    description: 'Defeat Brock and earn the Boulder Badge.' },
  { id: 'champion',        name: 'Champion',        eyebrow: 'Hall of Fame.',
    description: 'Defeat the Champion and complete the league.' },
  { id: 'mono_master',     name: 'Mono Master',     eyebrow: 'Pure of type.',
    description: 'Defeat a gym leader with a mono-type team.' },
  { id: 'synergist',       name: 'Synergist',       eyebrow: 'Catalogue complete.',
    description: 'Trigger every synergy at least once.' },
  { id: 'field_reference', name: 'Field Reference', eyebrow: 'Catalogue complete.',
    description: 'Face every Boss Blind at least once.' },
];

export const TOTAL_ACHIEVEMENTS = ACHIEVEMENTS.length;

const KEY_PREFIX = 'pokerun_achievements_';
const KNOWN = new Set(ACHIEVEMENTS.map(a => a.id));

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

/** Returns true ONLY if this call newly unlocked the achievement. */
export function unlockAchievement(username: string, id: string): boolean {
  if (!username || !KNOWN.has(id)) return false;
  const set = readSet(username);
  if (set.has(id)) return false;
  set.add(id);
  try {
    localStorage.setItem(key(username), JSON.stringify([...set]));
  } catch {
    return false;
  }
  return true;
}

/** Unlock + toast in one call. Idempotent — repeat calls do nothing. */
export function tryUnlock(username: string, id: string): void {
  if (!unlockAchievement(username, id)) return;
  const a = ACHIEVEMENTS.find(x => x.id === id);
  if (a) showToast(`Achievement unlocked: ${a.name}`, 'success');
}

export function getUnlockedSet(username: string): Set<string> {
  if (!username) return new Set();
  return readSet(username);
}

export function getUnlockedCount(username: string): number {
  if (!username) return 0;
  return readSet(username).size;
}
