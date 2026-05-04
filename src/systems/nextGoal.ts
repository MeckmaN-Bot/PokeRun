/**
 * Goal-Hint system — surfaces the player's next achievable progression
 * step on StartScreen + ChampionVictoryScreen.
 *
 * The priority cascade walks from "easiest meaningful goal" to
 * "final-flex objectives." First unmet goal wins; null is returned only
 * when every tracked progression vector is complete.
 *
 * Reads from existing per-username localStorage modules — corrupt or
 * missing data on any of them just makes that signal undefined, and the
 * cascade falls through to the next goal.
 */

import { getUnlockedSet as getAchievements } from './achievements';
import { getUnlockedStakes } from './stakes';
import {
  getDiscoveredCount, TOTAL_SYNERGIES,
  getDiscoveredBlindCount, TOTAL_BLINDS,
} from './discoveries';

export interface Goal {
  id: string;
  title: string;
  hint?: string;
}

export function getNextGoal(username: string): Goal | null {
  if (!username) return null;
  const ach = getAchievements(username);
  const stakesUnlocked = getUnlockedStakes(username);
  const synergies = getDiscoveredCount(username);
  const blinds = getDiscoveredBlindCount(username);

  // 1. Brand new player — get them moving.
  if (!ach.has('first_step')) {
    return { id: 'first_step', title: 'Clear your first wave to begin the field manual.' };
  }
  // 2. Brock badge.
  if (!ach.has('boulder_master')) {
    return { id: 'boulder_master', title: 'Defeat Brock to earn the Boulder Badge.' };
  }
  // 3. Reach Act 5 (post-Erika).
  if (!ach.has('survivor')) {
    return { id: 'survivor', title: 'Reach Act 5 (defeat Erika) to unlock the Iron Trainer Deck.' };
  }
  // 4. Hall of Records — survive 30 waves in one run.
  if (!ach.has('hall_of_records')) {
    return { id: 'hall_of_records', title: 'Survive 30+ waves in a single run to unlock the Speedrunner Deck.' };
  }
  // 5. Mono-team gym victory.
  if (!ach.has('mono_master')) {
    return { id: 'mono_master', title: 'Defeat a gym leader with 2+ same-type alive teammates to unlock the Mono-Type Deck.' };
  }
  // 6. First Champion clear.
  if (!ach.has('champion')) {
    return { id: 'champion', title: 'Defeat the Champion to unlock Endless and Gen 2.' };
  }
  // 7. Stake cascade — Red.
  if (!stakesUnlocked.has('red')) {
    return { id: 'stake_red', title: 'Beat the Champion on White Stake to unlock Red Stake.' };
  }
  // 8. Stake cascade — Black.
  if (!stakesUnlocked.has('black')) {
    return { id: 'stake_black', title: 'Beat the Champion on Red Stake to unlock Black Stake.' };
  }
  // 9. Synergy codex completion.
  if (synergies < TOTAL_SYNERGIES) {
    const remaining = TOTAL_SYNERGIES - synergies;
    return {
      id: 'synergist',
      title: `Trigger ${remaining} more synerg${remaining === 1 ? 'y' : 'ies'} to complete the Synergy Codex.`,
    };
  }
  // 10. Boss blind codex completion.
  if (blinds < TOTAL_BLINDS) {
    const remaining = TOTAL_BLINDS - blinds;
    return {
      id: 'field_reference',
      title: `Face ${remaining} more Boss Blind${remaining === 1 ? '' : 's'} to complete the Boss Blind Codex.`,
    };
  }
  // All progression complete.
  return null;
}
