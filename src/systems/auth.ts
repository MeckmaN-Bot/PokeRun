// ============================================================
// Auth — localStorage-based account system
// ============================================================

const ACCOUNTS_KEY = 'pokerun_accounts';
const SESSION_KEY  = 'pokerun_session';
const LAST_GUEST_KEY = 'pokerun_last_guest_username';

export interface Account {
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface Session {
  username: string;
  isGuest: boolean;
}

// ── Crypto helpers ──────────────────────────────────────────

async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Storage helpers ─────────────────────────────────────────

function loadAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveAccounts(accounts: Account[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

// ── Public API ──────────────────────────────────────────────

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

function setSession(session: Session): void {
  // Storage may be disabled or full — in-memory session would be ideal, but the
  // app reads getSession() from localStorage everywhere. We at least keep the
  // auth flow from crashing; the user can still play this tab's session via
  // the playerName the caller already has. Reload will land them on auth again.
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch { /* ignore */ }
}

export async function register(
  username: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = username.trim().slice(0, 20);
  if (trimmed.length < 2) return { ok: false, error: 'Username must be at least 2 characters.' };
  if (password.length < 4)  return { ok: false, error: 'Password must be at least 4 characters.' };

  const accounts = loadAccounts();
  if (accounts.some(a => a.username.toLowerCase() === trimmed.toLowerCase())) {
    return { ok: false, error: 'Username already taken.' };
  }

  const passwordHash = await sha256(trimmed.toLowerCase() + ':' + password);
  accounts.push({ username: trimmed, passwordHash, createdAt: new Date().toISOString() });
  saveAccounts(accounts);
  setSession({ username: trimmed, isGuest: false });
  return { ok: true };
}

export async function login(
  username: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = username.trim();
  if (!trimmed || !password) return { ok: false, error: 'Please enter username and password.' };

  const accounts = loadAccounts();
  const account = accounts.find(a => a.username.toLowerCase() === trimmed.toLowerCase());
  if (!account) return { ok: false, error: 'Username not found.' };

  const hash = await sha256(trimmed.toLowerCase() + ':' + password);
  if (hash !== account.passwordHash) return { ok: false, error: 'Wrong password.' };

  setSession({ username: account.username, isGuest: false });
  return { ok: true };
}

export function loginAsGuest(): string {
  let username: string;
  let stored: string | null = null;
  try { stored = localStorage.getItem(LAST_GUEST_KEY); } catch { /* storage unavailable */ }
  if (stored && /^Guest_[A-Z0-9]{4}$/.test(stored)) {
    username = stored;
  } else {
    const id = Math.random().toString(36).slice(2, 6).toUpperCase();
    username = `Guest_${id}`;
    try { localStorage.setItem(LAST_GUEST_KEY, username); } catch { /* ignore */ }
  }
  setSession({ username, isGuest: true });
  return username;
}

/** Wipe the sticky-guest username so the next loginAsGuest generates a new id. */
export function clearGuestIdentity(): void {
  try { localStorage.removeItem(LAST_GUEST_KEY); } catch { /* ignore */ }
}
