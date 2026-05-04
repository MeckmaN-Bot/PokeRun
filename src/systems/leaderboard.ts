import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { LeaderboardEntry } from '../types';

// ============================================================
// Supabase Configuration
// ============================================================
// To enable the leaderboard:
// 1. Create a Supabase project at https://supabase.com
// 2. Run the SQL in README.md to create the leaderboard table
// 3. Replace the placeholder values below with your project's URL and anon key
// 4. The anon key is safe to expose in frontend code (it's read-only by default)

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';

const isConfigured =
  SUPABASE_URL !== 'https://placeholder.supabase.co' &&
  SUPABASE_ANON_KEY !== 'placeholder-anon-key';

let supabase: SupabaseClient | null = null;
if (isConfigured) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch {
    supabase = null;
  }
}

// ============================================================
// Local Leaderboard (fallback if Supabase not configured)
// ============================================================

const LOCAL_LEADERBOARD_KEY = 'pokelike_leaderboard';
const MAX_LOCAL_ENTRIES = 20;

function getLocalLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalLeaderboard(entries: LeaderboardEntry[]): void {
  try {
    localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

function addLocalEntry(entry: LeaderboardEntry): LeaderboardEntry[] {
  const entries = getLocalLeaderboard();
  const existing = entries.find(e => e.name.toLowerCase() === entry.name.toLowerCase());

  if (existing) {
    // Only update if new score is better
    if (entry.score_waves > existing.score_waves) {
      existing.score_waves = entry.score_waves;
      existing.score_details = entry.score_details;
      existing.created_at = new Date().toISOString();
    }
  } else {
    entries.push({
      ...entry,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    });
  }

  entries.sort((a, b) => b.score_waves - a.score_waves);
  const trimmed = entries.slice(0, MAX_LOCAL_ENTRIES);
  saveLocalLeaderboard(trimmed);
  return trimmed;
}

// ============================================================
// Public API
// ============================================================

export async function submitScore(entry: LeaderboardEntry): Promise<boolean> {
  if (!isConfigured || !supabase) {
    addLocalEntry(entry);
    return true;
  }
  try {
    // Check if player already has an entry
    const { data: existing } = await supabase
      .from('leaderboard')
      .select('id, score_waves')
      .ilike('name', entry.name.slice(0, 32))
      .maybeSingle();

    if (existing) {
      // Only update if new score is better
      if (entry.score_waves <= existing.score_waves) return true;
      const { error } = await supabase
        .from('leaderboard')
        .update({
          score_waves: entry.score_waves,
          score_details: entry.score_details,
          created_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      if (error) { addLocalEntry(entry); }
    } else {
      const { error } = await supabase.from('leaderboard').insert([{
        name: entry.name.slice(0, 32),
        score_waves: entry.score_waves,
        score_details: entry.score_details,
      }]);
      if (error) { addLocalEntry(entry); }
    }
    return true;
  } catch (err) {
    console.warn('Supabase error:', err);
    addLocalEntry(entry);
    return true;
  }
}

export async function getTopScores(
  filter: 'all_time' | 'today' = 'all_time',
  limit = 20
): Promise<LeaderboardEntry[]> {
  if (!isConfigured || !supabase) {
    const local = getLocalLeaderboard();
    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return local
        .filter(e => e.created_at?.startsWith(today))
        .slice(0, limit);
    }
    return local.slice(0, limit);
  }

  try {
    let query = supabase
      .from('leaderboard')
      .select('*')
      .order('score_waves', { ascending: false })
      .limit(limit);

    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('created_at', today + 'T00:00:00Z');
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as LeaderboardEntry[];
  } catch {
    return getLocalLeaderboard().slice(0, limit);
  }
}

export function isLeaderboardEnabled(): boolean {
  return isConfigured;
}

export function getLeaderboardStatusMessage(): string {
  if (isConfigured) return '◉ Connected to global leaderboard';
  return '◇ Local leaderboard (set up Supabase for global scores)';
}

/**
 * Look up a player's best run by name. Local-only — Supabase round-trip is
 * unnecessary for a startup-screen card and would slow first paint. The local
 * fallback already mirrors the player's runs since addLocalEntry runs on every
 * submit. v1: name-keyed (case-insensitive); not account-scoped, so multiple
 * users sharing a name will conflate. Account-scoped PB is a future spec.
 */
export function getPersonalBest(name: string): LeaderboardEntry | null {
  if (!name) return null;
  const entries = getLocalLeaderboard();
  return entries.find(e => e.name.toLowerCase() === name.toLowerCase()) ?? null;
}
