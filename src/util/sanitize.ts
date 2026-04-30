/**
 * Input safety helpers — defensive layer around any text the player types.
 * The leaderboard echoes player names, so untrusted input is a real concern.
 */

const NAME_MAX_LEN = 24;
const ZERO_WIDTH = /[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g;
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

/**
 * Sanitize a player name:
 *   - strip control + zero-width chars (anti-spoofing)
 *   - collapse whitespace
 *   - trim, hard-cap at 24 chars
 *   - allow Unicode letters/numbers, spaces, dash, underscore, dot, apostrophe
 *   - reject empty after stripping
 *
 * Returns the cleaned string (may be '').
 */
export function sanitizePlayerName(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  let s = raw
    .replace(CONTROL_CHARS, '')
    .replace(ZERO_WIDTH, '')
    .replace(/\s+/g, ' ')
    .trim();
  // Allow letters, marks, numbers, plus a small punctuation set
  s = s.replace(/[^\p{L}\p{M}\p{N} _.\-']/gu, '');
  if (s.length > NAME_MAX_LEN) s = s.slice(0, NAME_MAX_LEN);
  return s;
}

/**
 * Escape any string before injecting into innerHTML. Cheap and complete.
 */
export function escapeHtml(s: unknown): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Allow only http/https URLs (no javascript:, data:, etc).
 */
export function safeUrl(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  try {
    const u = new URL(raw, window.location.origin);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    return u.toString();
  } catch {
    return '';
  }
}
