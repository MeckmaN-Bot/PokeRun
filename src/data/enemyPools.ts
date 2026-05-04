// Enemy Pokemon pools by wave range
// IDs correspond to National Dex numbers (PokéAPI IDs)

// Wave 1-5: Gen 1 basics, starter/common mons
export const POOL_WAVE_1_5 = [
  16, 17, 19, 21, 23, 27, 29, 32, 35, 39, 43, 46, 48, 50, 52, 54, 56, 58, 60,
  63, 66, 69, 72, 74, 79, 81, 84, 86, 90, 92, 96, 100, 102, 104, 116, 120, 129,
];

// Wave 6-10: mid-tier Gen 1 + Gen 2 basics
export const POOL_WAVE_6_10 = [
  ...POOL_WAVE_1_5,
  1, 4, 7, 25, 37, 41, 74, 77, 88, 98, 109, 111, 114, 118, 122, 123, 124, 126, 127, 128,
  152, 155, 158, 161, 163, 165, 167, 170, 172, 173, 174, 175, 177, 179, 183, 187, 191, 193,
  194, 198, 200, 204, 206, 209, 213, 214, 215, 216, 218, 220, 222, 223, 225, 226, 228, 231,
];

// Wave 11-15: second evolutions, stronger mons
export const POOL_WAVE_11_15 = [
  ...POOL_WAVE_6_10,
  2, 5, 8, 15, 18, 20, 22, 24, 26, 28, 30, 33, 36, 40, 44, 47, 49, 51, 53, 55, 57, 59,
  61, 64, 67, 70, 73, 75, 80, 82, 85, 87, 91, 93, 97, 101, 103, 105, 117, 121, 125,
  153, 156, 159, 162, 164, 166, 168, 171, 176, 178, 180, 184, 188, 192, 195, 199, 205,
  210, 217, 219, 221, 224, 227, 229, 232,
];

// Wave 16-20: strong fully evolved
export const POOL_WAVE_16_20 = [
  ...POOL_WAVE_11_15,
  3, 6, 9, 65, 68, 71, 76, 78, 83, 89, 94, 95, 99, 106, 107, 110, 112, 113, 115, 119,
  130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146,
  154, 157, 160, 181, 185, 189, 196, 197, 201, 202, 203, 207, 208, 211, 212, 214, 230, 233,
  234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245,
];

// Wave 21+: everything including legendaries
export const POOL_WAVE_21_PLUS = [
  ...POOL_WAVE_16_20,
  248, 249, 250, 254, 257, 260, 282, 289, 295, 302, 306, 310, 330, 334, 350, 357, 359,
  362, 373, 376, 380, 381, 382, 383, 384, 385, 386,
  // Gen 4 strong mons
  389, 392, 395, 398, 407, 409, 411, 416, 428, 430, 432, 437, 442, 445, 448, 452, 454,
  460, 461, 462, 463, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475, 476,
  477, 478, 479, 480, 481, 482, 483, 484, 485, 486, 487,
];

// Boss wave Pokemon — wave 5 first boss (mid-tier, BST 400-500)
export const BOSS_POOL_WAVE_5 = [
  67,  // Machoke  (Atk 100, BST 405)
  93,  // Haunter  (SpAtk 115, BST 405, low def = fair)
  57,  // Primeape (Atk 105, BST 455)
  125, // Electabuzz (SpAtk 95, BST 490)
  126, // Magmar    (SpAtk 95, BST 465)
  123, // Scyther   (Atk 110, BST 500)
  87,  // Dewgong   (balanced, BST 475)
  55,  // Golduck   (SpAtk 95, BST 500)
  28,  // Sandslash (Atk 100, BST 450)
  97,  // Hypno     (SpAtk 73, tanky SpDef, BST 483)
];

// Boss wave Pokemon — wave 10 (strong fully evolved, BST 490-540)
export const BOSS_POOL_EARLY = [
  130, // Gyarados  (Atk 125)
  94,  // Gengar    (SpAtk 130)
  65,  // Alakazam  (SpAtk 135)
  76,  // Golem     (Atk 120, Def 130)
  112, // Rhydon    (Atk 130)
  59,  // Arcanine  (Atk 110)
  62,  // Poliwrath (Atk 95, balanced)
  34,  // Nidoking  (Atk 102)
  121, // Starmie   (SpAtk 100, fast)
];

export const BOSS_POOL_MID = [
  248, // Tyranitar
  245, // Suicune
  243, // Raikou
  244, // Entei
  249, // Lugia
  250, // Ho-Oh
  257, // Blaziken
  260, // Swampert
  254, // Sceptile
  373, // Salamence
  376, // Metagross
  380, // Latias
  381, // Latios
];

export const BOSS_POOL_LATE = [
  384, // Rayquaza
  382, // Kyogre
  383, // Groudon
  445, // Garchomp
  448, // Lucario
  483, // Dialga
  484, // Palkia
  485, // Heatran
  487, // Giratina
  486, // Regigigas
  480, // Uxie
  481, // Mesprit
  482, // Azelf
];

/**
 * Curated Gen 2 picks gated behind the Gen 2 / Endless run flag. Strong
 * representatives across the wave tiers; baby/pre-evolutions and noisy
 * mid-tiers are intentionally dropped (the existing arrays carry every
 * Gen 2 ID, this set narrows the pool that ships to the player).
 */
const GEN2_KEEP = new Set<number>([
  // Wave 6-10 tier — early Johto basics
  152, 155, 158, 161, 163, 167, 170, 172, 173, 187,
  // Wave 11-15 tier — mid Johto
  153, 156, 159, 168, 178, 184, 195, 199, 219, 224,
  // Wave 16-20 tier — final evos + powerhouses
  154, 157, 160, 181, 185, 196, 197, 211, 230, 245,
  // Wave 21+ tier — legendaries
  248, 249, 250,
]);

import type { Generation } from '../types';

/**
 * Wild encounter pool gated by run generation:
 *   - 'gen1':    only Gen 1 IDs (≤151).
 *   - 'gen2':    Gen 1 IDs + curated Gen 2 picks.
 *   - 'endless': same as gen2 + the post-Gen-2 spice (>251) that lives in the
 *                wave-21+ pool. Endless is score-attack and benefits from
 *                variety beyond Gen 2.
 */
export function getEnemyPool(wave: number, generation: Generation = 'gen1'): number[] {
  const base =
    wave <= 5  ? POOL_WAVE_1_5 :
    wave <= 10 ? POOL_WAVE_6_10 :
    wave <= 15 ? POOL_WAVE_11_15 :
    wave <= 20 ? POOL_WAVE_16_20 :
    POOL_WAVE_21_PLUS;
  if (generation === 'gen1') {
    return base.filter(id => id <= 151);
  }
  return base.filter(id =>
    id <= 151 ||
    GEN2_KEEP.has(id) ||
    (generation === 'endless' && id > 251)
  );
}

export function getBossPool(wave: number): number[] {
  if (wave <= 5)  return BOSS_POOL_WAVE_5;
  if (wave <= 10) return BOSS_POOL_EARLY;
  if (wave <= 20) return BOSS_POOL_MID;
  return BOSS_POOL_LATE;
}

export function getRandomFromPool(pool: number[], count: number): number[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Starters
export const STARTERS = [
  { id: 1, name: 'Bulbasaur', displayName: 'Bulbasaur' },
  { id: 4, name: 'Charmander', displayName: 'Charmander' },
  { id: 7, name: 'Squirtle', displayName: 'Squirtle' },
  { id: 25, name: 'Pikachu', displayName: 'Pikachu' },
  { id: 133, name: 'Eevee', displayName: 'Eevee' },
];
