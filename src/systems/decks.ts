/**
 * Decks v1 — Balatro-style alternative starts. Each deck either changes the
 * run's opening conditions (Standard / Speedrunner / Iron Trainer) or biases
 * a play-style (Mono-Type). Standard is auto-unlocked; the others gate behind
 * existing achievements so the meta-progression hooks back into player effort.
 *
 * D.1 ships the catalog + storage + UI surface only. Modifier application is
 * D.2's scope.
 */

import type { PokemonType } from '../types';
import { getUnlockedSet as getAchievements } from './achievements';

export interface Deck {
  id: string;
  name: string;
  eyebrow: string;
  description: string;
  /** Achievement id whose unlock unlocks this deck. Standard has none. */
  unlockAchievement?: string;
  /** Sprite hint or glyph for the picker card. */
  icon: string;
  /** When true, picking this deck triggers the type sub-picker on StartScreen. */
  requiresTypeChoice?: boolean;
}

export const DECKS: Deck[] = [
  {
    id: 'standard',
    name: 'Standard Field Kit',
    eyebrow: 'Default',
    icon: '◇',
    description: 'The classic field manual. All 5 starters, no twists.',
  },
  {
    id: 'speedrunner',
    name: 'Speedrunner Field Kit',
    eyebrow: 'Wave 30+',
    icon: '»',
    unlockAchievement: 'hall_of_records',
    description: 'Start with +100¢ and a Reroll Token. Each act has 3 stages instead of 4.',
  },
  {
    id: 'iron_trainer',
    name: 'Iron Trainer Field Kit',
    eyebrow: 'Act 5',
    icon: '◆',
    unlockAchievement: 'survivor',
    description: 'No consumables in shop. Every Pokémon starts with slot 2 unlocked.',
  },
  {
    id: 'mono_type',
    name: 'Mono-Type Field Kit',
    eyebrow: 'Pure of type',
    icon: '◈',
    unlockAchievement: 'mono_master',
    requiresTypeChoice: true,
    description: 'Pick a type. Starter pool narrows to that type. Full-mono alive team = +25% damage.',
  },
];

/** Types eligible for the Mono-Type deck — must intersect with the 5 default
 *  starters (bulbasaur=grass, charmander=fire, squirtle=water, pikachu=electric,
 *  eevee=normal). Restricted on purpose: more types would mean unsupported
 *  starter picks. */
export const MONO_TYPE_OPTIONS: PokemonType[] = ['grass', 'fire', 'water', 'electric', 'normal'];

const UNLOCKED_KEY_PREFIX = 'pokerun_decks_unlocked_';
const LAST_DECK_KEY_PREFIX = 'pokerun_last_deck_';
const LAST_MONO_TYPE_KEY_PREFIX = 'pokerun_last_mono_type_';

const KNOWN_DECK_IDS = new Set(DECKS.map(d => d.id));

function unlockedKey(username: string): string {
  return `${UNLOCKED_KEY_PREFIX}${username.toLowerCase()}`;
}
function lastDeckKey(username: string): string {
  return `${LAST_DECK_KEY_PREFIX}${username.toLowerCase()}`;
}
function lastMonoTypeKey(username: string): string {
  return `${LAST_MONO_TYPE_KEY_PREFIX}${username.toLowerCase()}`;
}

/**
 * Resolve which decks are unlocked for this user. Standard is always in.
 * Other decks unlock when their gating achievement is unlocked.
 */
export function getUnlockedDecks(username: string): Set<string> {
  const out = new Set<string>(['standard']);
  if (!username) return out;
  const ach = getAchievements(username);
  for (const deck of DECKS) {
    if (deck.unlockAchievement && ach.has(deck.unlockAchievement)) {
      out.add(deck.id);
    }
  }
  return out;
}

export function isDeckUnlocked(username: string, id: string): boolean {
  return getUnlockedDecks(username).has(id);
}

export function getLastDeck(username: string): string {
  if (!username) return 'standard';
  try {
    const raw = localStorage.getItem(lastDeckKey(username));
    if (raw && KNOWN_DECK_IDS.has(raw) && isDeckUnlocked(username, raw)) return raw;
  } catch { /* storage unavailable */ }
  return 'standard';
}

export function saveLastDeck(username: string, id: string): void {
  if (!username || !KNOWN_DECK_IDS.has(id)) return;
  try { localStorage.setItem(lastDeckKey(username), id); } catch { /* ignore */ }
}

export function getLastMonoType(username: string): PokemonType {
  if (!username) return 'grass';
  try {
    const raw = localStorage.getItem(lastMonoTypeKey(username));
    if (raw && (MONO_TYPE_OPTIONS as string[]).includes(raw)) return raw as PokemonType;
  } catch { /* storage unavailable */ }
  return 'grass';
}

export function saveLastMonoType(username: string, t: PokemonType): void {
  if (!username || !(MONO_TYPE_OPTIONS as string[]).includes(t)) return;
  try { localStorage.setItem(lastMonoTypeKey(username), t); } catch { /* ignore */ }
}

/** Display helper for the leaderboard pill. Returns the catalog name or null. */
export function getDeckName(id: string | undefined | null): string | null {
  if (!id || id === 'standard') return null;
  return DECKS.find(d => d.id === id)?.name ?? null;
}
