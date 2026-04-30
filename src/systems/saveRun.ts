/**
 * Run-save system — persists the active GameState to localStorage so the
 * player can resume after a refresh, tab close, or accidental kill.
 *
 * Why localStorage and not the leaderboard DB:
 *   - Saves are local-only, never synced — no cheat surface.
 *   - The state object is shape-stable enough to JSON-roundtrip.
 *
 * Versioning: the storage key carries a `:v1` suffix. Bump when GameState
 * changes shape so old saves are silently dropped instead of crashing the
 * resume flow.
 */

import type { GameState } from '../types';
import { getSession } from './auth';

const SAVE_KEY_BASE = 'pokerun:save:v1';

function saveKey(): string {
  const s = getSession();
  const id = s ? `${s.isGuest ? 'guest' : 'user'}:${s.username.toLowerCase()}` : 'anon';
  return `${SAVE_KEY_BASE}:${id}`;
}

/** Saved at the start of every wave/path/shop transition (debounced). */
let saveTimer: number | null = null;

export interface SavedRun {
  savedAt: number;
  state: GameState;
}

export function saveRun(state: GameState): void {
  // Don't save terminal states — they're not resumable.
  if (state.phase === 'gameover' || state.phase === 'leaderboard' || state.phase === 'start') {
    return;
  }
  // Debounce — collapse bursty saves (e.g. shop transitions fire a few in a row).
  if (saveTimer != null) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      const payload: SavedRun = { savedAt: Date.now(), state };
      localStorage.setItem(saveKey(), JSON.stringify(payload));
    } catch (err) {
      // Quota exceeded or disabled — fail silently. Resume just won't be available.
      console.warn('[saveRun] failed to persist:', err);
    }
    saveTimer = null;
  }, 400) as unknown as number;
}

export function loadRun(): SavedRun | null {
  try {
    const raw = localStorage.getItem(saveKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedRun;
    if (!parsed?.state || typeof parsed.savedAt !== 'number') return null;
    // Sanity: a run with no team can't be resumed meaningfully.
    if (!Array.isArray(parsed.state.team) || parsed.state.team.length === 0) return null;
    return parsed;
  } catch (err) {
    console.warn('[loadRun] failed to parse save:', err);
    return null;
  }
}

export function clearRun(): void {
  try { localStorage.removeItem(saveKey()); } catch { /* ignore */ }
}

export function hasSavedRun(): boolean {
  return loadRun() !== null;
}
