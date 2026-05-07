/**
 * Shared formatters for the actReached / badgesEarned score-detail fields,
 * used by both the Full Leaderboard rows and the StartScreen Personal Best
 * card. Single source of truth so both screens render identical labels.
 *
 * Convention (matches GameOverScreen.computeProgress):
 *   1..8 → gym act
 *   9    → league in progress
 *   10+  → champion cleared
 */

export function formatAct(n: number | undefined | null, isEndless = false): string {
  // Endless flag takes precedence — endless runs render 'Endless' regardless
  // of where actReached landed (pre- or post-Champion entry to endless mode).
  if (isEndless) return 'Endless';
  if (n == null) return '—';
  if (n >= 10) return 'Champion ✓';
  if (n === 9) return 'League';
  if (n >= 1 && n <= 8) return `Act ${n}`;
  return '—';
}

export function formatBadges(n: number | undefined | null): string {
  if (n == null) return '—';
  return `${n}/8`;
}
