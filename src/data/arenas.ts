/**
 * Arena gauntlet — a multi-step gym sequence that replaces the single
 * gym fight at act-step 4 (acts 1-8).
 *
 * Each arena is a 4-stop chain themed around the gym leader's type:
 *   1. Junior trainer (gym-type biased)
 *   2. Arena restock (mini-shop)
 *   3. Senior trainer (gym-type biased, tougher)
 *   4. Gym Leader → grants the Gen-1 badge
 */

import type { ArenaState, NodeInstance } from '../types';
import { GYM_LEADERS, type GymLeader } from './gymLeaders';
import { pickArchetypeByType, trainerSpriteUrl } from './trainerArchetypes';
import { itemSprite } from './sprites';

export function buildArena(leader: GymLeader, act: number): ArenaState {
  const t1 = makeArenaTrainer(leader, act, 'Junior');
  const shop = makeArenaShop(leader);
  const t2 = makeArenaTrainer(leader, act, 'Senior');
  const leaderNode: NodeInstance = {
    kind: 'gym',
    title: leader.name,
    eyebrow: `${leader.city} · Gym Leader`,
    hint: leader.flavour,
    icon: leader.icon,
    accent: leader.accent,
    gymLeaderId: leader.id,
    spriteUrl: trainerSpriteUrl(leader.spriteSlug),
    arenaRank: 'Leader',
  };
  return { gymId: leader.id, steps: [t1, shop, t2, leaderNode], index: 0 };
}

function makeArenaTrainer(leader: GymLeader, act: number, rank: 'Junior' | 'Senior'): NodeInstance {
  const arc = pickArchetypeByType(leader.bias, act);
  // Early-act onboarding: cap arena trainer team to 1 mon in Acts 1–2 so the
  // first arena gauntlet (3 fights b2b vs a solo starter) stays fair.
  const teamCap = act <= 2 ? 1 : act <= 4 ? (rank === 'Senior' ? 2 : 1) : undefined;
  return {
    kind: 'trainer',
    title: `${rank} ${arc.shortLabel}`,
    eyebrow: `${leader.city} · Arena · ${rank}`,
    hint: `${rank === 'Junior' ? 'A warm-up fight' : 'No more pleasantries'} — drilled in ${leader.type}-type combat.`,
    icon: arc.icon,
    accent: leader.accent,
    trainerArchetypeId: arc.id,
    spriteUrl: arc.spriteSlug ? trainerSpriteUrl(arc.spriteSlug) : undefined,
    arenaRank: rank,
    teamSizeOverride: teamCap,
    // Tighten the roster pool to the gym leader's bias — keeps Mankey out of
    // Brock's gauntlet etc. Archetype identity (sprite, name, level/coin deltas)
    // is unchanged.
    rosterTypeBias: [...leader.bias],
  };
}

function makeArenaShop(leader: GymLeader): NodeInstance {
  return {
    kind: 'shop_mini',
    title: 'Arena Atrium',
    eyebrow: `${leader.city} · Arena · Restock`,
    hint: 'Catch your breath. The vendor here knows what gym leaders cost.',
    icon: '◆',
    accent: leader.accent,
    spriteUrl: itemSprite('coin-case'),
    arenaRank: 'Restock',
  };
}

export function getArenaLeader(state: ArenaState): GymLeader | undefined {
  return GYM_LEADERS.find(g => g.id === state.gymId);
}
