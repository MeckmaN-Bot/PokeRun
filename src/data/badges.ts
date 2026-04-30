/**
 * Gen 1 gym badges. Each badge grants a passive run-wide effect.
 * Effects are mapped onto existing `PerkEffect` fields so the battle engine
 * picks them up without new branches.
 */

import type { Perk } from '../types';

export interface Badge {
  id: string;
  name: string;
  hint: string;
  /** Hex accent for the badge UI. */
  color: string;
  icon: string;
  /** Granted as an `activePerk` so the existing engine handles the effect. */
  perk: Perk;
}

export const BADGES: Badge[] = [
  {
    id: 'boulder',
    name: 'Boulder Badge',
    hint: 'Earned from Brock — your team\'s defenses harden.',
    color: '#7a634a', icon: '🥾',
    perk: {
      id: 'badge_boulder', name: 'Boulder Badge',
      description: '+10% Defense across the team.',
      icon: '🥾', rarity: 'rare',
      effect: { defenseMultiplier: 1.06 },
    },
  },
  {
    id: 'cascade',
    name: 'Cascade Badge',
    hint: 'Earned from Misty — slow regen between turns.',
    color: '#3a6c8a', icon: '💧',
    perk: {
      id: 'badge_cascade', name: 'Cascade Badge',
      description: '+3% HP regen per turn.',
      icon: '💧', rarity: 'rare',
      effect: { regenPercent: 0.03 },
    },
  },
  {
    id: 'thunder',
    name: 'Thunder Badge',
    hint: 'Earned from Surge — quicker reflexes.',
    color: '#c9a417', icon: '⚡',
    perk: {
      id: 'badge_thunder', name: 'Thunder Badge',
      description: '+6% Speed across the team.',
      icon: '⚡', rarity: 'rare',
      effect: { speedMultiplier: 1.06 },
    },
  },
  {
    id: 'rainbow',
    name: 'Rainbow Badge',
    hint: 'Earned from Erika — passive HP regen.',
    color: '#5d8266', icon: '🌸',
    perk: {
      id: 'badge_rainbow', name: 'Rainbow Badge',
      description: '+4% HP regen per turn.',
      icon: '🌸', rarity: 'epic',
      effect: { regenPercent: 0.04 },
    },
  },
  {
    id: 'soul',
    name: 'Soul Badge',
    hint: 'Earned from Koga — sturdier special wall.',
    color: '#7a3f8a', icon: '☠',
    perk: {
      id: 'badge_soul', name: 'Soul Badge',
      description: '+6% Sp. Defense across the team.',
      icon: '☠', rarity: 'epic',
      effect: { spDefMultiplier: 1.06 },
    },
  },
  {
    id: 'marsh',
    name: 'Marsh Badge',
    hint: 'Earned from Sabrina — sharper psyche.',
    color: '#c14a8a', icon: '🔮',
    perk: {
      id: 'badge_marsh', name: 'Marsh Badge',
      description: '+6% Sp. Attack across the team.',
      icon: '🔮', rarity: 'epic',
      effect: { statMultiplier: { spAtk: 1.06 } },
    },
  },
  {
    id: 'volcano',
    name: 'Volcano Badge',
    hint: 'Earned from Blaine — coin bonuses burn brighter.',
    color: '#a64418', icon: '🔥',
    perk: {
      id: 'badge_volcano', name: 'Volcano Badge',
      description: '+15% coin reward from every wave.',
      icon: '🔥', rarity: 'epic',
      effect: { coinMultiplier: 1.15 },
    },
  },
  {
    id: 'earth',
    name: 'Earth Badge',
    hint: 'Earned from Giovanni — true power. League gates open.',
    color: '#caa15a', icon: '🌍',
    perk: {
      id: 'badge_earth', name: 'Earth Badge',
      description: '+8% damage and unlocks the Pokémon League.',
      icon: '🌍', rarity: 'legendary',
      effect: { allDamageMultiplier: 1.08 },
    },
  },
];

export function getBadge(id: string): Badge | undefined {
  return BADGES.find(b => b.id === id);
}
