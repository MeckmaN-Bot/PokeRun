/**
 * Per-type Pokémon ID pools — used by Trainer-NPC nodes to bias the enemy
 * roster toward a type theme without locking it. Hand-curated across Gen 1+2
 * basics & second evolutions to keep level scaling broad.
 *
 * NOTE: keep entries deliberately small (~12 per type). The trainer system
 * picks N from the union of its bias types, so a roster with 2-3 biases
 * still draws from a healthy pool.
 */

import type { PokemonType } from '../types';

export const TYPE_POOLS: Record<PokemonType, number[]> = {
  normal:   [16, 19, 21, 39, 52, 84, 108, 113, 115, 132, 143, 162, 174, 190, 216],
  fire:     [4, 37, 58, 77, 126, 136, 146, 155, 218, 228, 240, 244],
  water:    [7, 54, 60, 72, 79, 86, 90, 116, 118, 120, 129, 158, 170, 194, 222, 226],
  electric: [25, 81, 100, 125, 135, 145, 170, 179, 239, 243],
  grass:    [1, 43, 46, 69, 102, 114, 152, 187, 191, 192, 273, 387],
  ice:      [87, 91, 124, 144, 215, 220, 225, 238, 245, 361],
  fighting: [56, 62, 66, 67, 106, 107, 214, 236, 237, 286, 296, 297],
  poison:   [13, 23, 29, 32, 41, 48, 88, 109, 167, 168, 316, 317],
  ground:   [27, 50, 74, 95, 104, 111, 220, 231, 232, 246, 449],
  flying:   [16, 17, 21, 22, 41, 84, 142, 163, 169, 198, 277, 333, 396],
  psychic:  [63, 79, 96, 102, 122, 150, 196, 203, 280, 358, 386],
  bug:      [10, 13, 46, 48, 123, 165, 167, 193, 204, 213, 269, 290],
  rock:     [74, 95, 111, 138, 140, 142, 185, 213, 220, 246, 299, 408],
  ghost:    [92, 200, 292, 302, 353, 355, 425, 477],
  dragon:   [147, 230, 329, 371, 380, 384, 443, 445, 483, 484],
  dark:     [197, 215, 261, 215, 359, 430, 461, 491, 510],
  steel:    [81, 95, 205, 208, 212, 227, 374, 379, 437, 448, 462],
  fairy:    [35, 39, 122, 173, 174, 175, 176, 183, 184, 280, 282],
};

/** Build a wave-appropriate ID list for one or more biased types. */
export function poolForTypes(types: PokemonType[]): number[] {
  const set = new Set<number>();
  for (const t of types) {
    for (const id of TYPE_POOLS[t] ?? []) set.add(id);
  }
  return Array.from(set);
}
