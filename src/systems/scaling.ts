import type { WaveConfig } from '../types';
import { getEnemyPool, getBossPool, getRandomFromPool } from '../data/enemyPools';

export function getWaveConfig(wave: number, isBossWave: boolean): WaveConfig {

  let enemyCount: number;
  let levelMin: number;
  let levelMax: number;
  let coinReward: number;

  // Difficulty ramp — player starts at level 8.
  // Wave 1 is easy (single weak enemy). Ramp is gentle early, steeper mid/late.
  if (wave === 1) {
    enemyCount = 1;
    levelMin = 4;
    levelMax = 7;
    coinReward = 60;
  } else if (wave === 2) {
    enemyCount = 1;
    levelMin = 7;
    levelMax = 11;
    coinReward = 70;
  } else if (wave <= 4) {
    // Waves 3-4: introduce a second enemy
    enemyCount = 2;
    levelMin = 10 + (wave - 3) * 3;   // 10, 13
    levelMax = 14 + (wave - 3) * 3;   // 14, 17
    coinReward = 65 + wave * 6;
  } else if (wave <= 9) {
    // Waves 5-9: two–three enemies, mid-game ramp
    enemyCount = wave <= 6 ? 2 : 3;
    levelMin = 16 + (wave - 5) * 4;   // 16, 20, 24, 28, 32
    levelMax = 22 + (wave - 5) * 4;   // 22, 26, 30, 34, 38
    coinReward = 70 + wave * 7;
  } else if (wave <= 14) {
    // Waves 10-14: three–four enemies
    enemyCount = wave <= 11 ? 3 : 4;
    levelMin = 36 + (wave - 10) * 5;  // 36, 41, 46, 51, 56
    levelMax = 46 + (wave - 10) * 5;  // 46, 51, 56, 61, 66
    coinReward = 100 + wave * 7;
  } else if (wave <= 19) {
    // Waves 15-19: four–five enemies
    enemyCount = wave <= 16 ? 4 : 5;
    levelMin = 56 + (wave - 15) * 5;  // 56, 61, 66, 71, 76
    levelMax = 68 + (wave - 15) * 5;  // 68, 73, 78, 83, 88
    coinReward = 130 + wave * 6;
  } else {
    // Wave 20+: five–six enemies, scaling to 100
    enemyCount = wave <= 22 ? 5 : 6;
    levelMin = Math.min(90,  80 + (wave - 20) * 2);
    levelMax = Math.min(100, 92 + (wave - 20) * 2);
    coinReward = 170 + wave * 5;
  }

  // ── Threat multiplier: Balatro-style exponential ramp ──
  // Early waves stay close to 1.0; mid-game ramps steeply; late-game scales hard
  // to match Balatro-style broken builds. Player MUST build properly or die.
  //   wave 5  → ×1.16      wave 10 → ×1.57      wave 15 → ×2.28
  //   wave 20 → ×3.31      wave 25 → ×4.67      wave 30 → ×6.36
  //   wave 35 → ×8.38      wave 40 → ×10.74     wave 50 → ×16.50
  // Softened ~15% to compensate for the weaker starting movesets in the
  // move-learning progression — early waves are kinder, mid/late curve preserved.
  let threatMultiplier = 1.0;
  if (wave >= 4) {
    threatMultiplier = 1.0 + Math.pow((wave - 2) / 10, 1.8) * 0.85;
  }

  // Boss waves: bump count, level, and coins. Threat scales with wave so late bosses are scarier.
  if (isBossWave) {
    if (wave <= 7) {
      // First boss: 2 enemies, no level boost — challenging but winnable
      enemyCount = 2;
    } else {
      enemyCount = enemyCount + 1;
      levelMin = Math.min(100, Math.floor(levelMin * 1.10));
      levelMax = Math.min(100, Math.floor(levelMax * 1.10));
    }
    coinReward = Math.floor(coinReward * 2);

    // Boss threat bonus scales with wave: early bosses ×1.08, late bosses ×1.35
    const bossBonus = Math.min(1.35, 1.08 + (wave - 5) * 0.012);
    threatMultiplier *= bossBonus;
  }

  return {
    enemyCount,
    levelMin,
    levelMax,
    isBossWave,
    enemyPool: getEnemyPool(wave),
    bossPool: getBossPool(wave),
    coinReward,
    threatMultiplier,
  };
}

export function getEnemyLevel(config: WaveConfig): number {
  return config.levelMin + Math.floor(Math.random() * (config.levelMax - config.levelMin + 1));
}

export function selectEnemyIds(config: WaveConfig): number[] {
  if (config.isBossWave) {
    const bossCount = Math.ceil(config.enemyCount / 2);
    const regularCount = config.enemyCount - bossCount;
    return [
      ...getRandomFromPool(config.bossPool, bossCount),
      ...getRandomFromPool(config.enemyPool, regularCount),
    ];
  }
  return getRandomFromPool(config.enemyPool, config.enemyCount);
}

export function getWaveCoins(wave: number, isBossWave: boolean, perks: import('../types').Perk[]): number {
  const config = getWaveConfig(wave, isBossWave);
  let coins = config.coinReward;

  for (const perk of perks) {
    if (perk.effect.coinMultiplier) {
      coins = Math.floor(coins * perk.effect.coinMultiplier);
    }
  }

  return coins;
}

export function getWaveLabel(wave: number, isBossWave: boolean): string {
  return isBossWave ? `BOSS WAVE ${wave}` : `Wave ${wave}`;
}
