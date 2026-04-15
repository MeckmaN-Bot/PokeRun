import type { WaveConfig } from '../types';
import { getEnemyPool, getBossPool, getRandomFromPool } from '../data/enemyPools';

export function getWaveConfig(wave: number): WaveConfig {
  const isBossWave = wave % 5 === 0;

  let enemyCount: number;
  let levelMin: number;
  let levelMax: number;
  let coinReward: number;

  // Smooth difficulty ramp — player starts at level 5.
  // Wave 1 is intentionally easy (single enemy slightly below player level).
  if (wave === 1) {
    enemyCount = 1;
    levelMin = 3;
    levelMax = 6;
    coinReward = 40;
  } else if (wave <= 4) {
    // Waves 2-4: two enemies, gentle ramp
    enemyCount = 2;
    levelMin = 5 + (wave - 2) * 3;   // 5, 8
    levelMax = 9 + (wave - 2) * 3;   // 9, 12
    coinReward = 45 + wave * 8;
  } else if (wave <= 9) {
    // Waves 5-9: three enemies, mid-game
    enemyCount = 3;
    levelMin = 12 + (wave - 5) * 3;  // 12, 15, 18, 21, 24
    levelMax = 18 + (wave - 5) * 3;  // 18, 21, 24, 27, 30
    coinReward = 60 + wave * 8;
  } else if (wave <= 14) {
    // Waves 10-14: four enemies
    enemyCount = 4;
    levelMin = 28 + (wave - 10) * 4; // 28, 32, 36, 40, 44
    levelMax = 38 + (wave - 10) * 4; // 38, 42, 46, 50, 54
    coinReward = 90 + wave * 7;
  } else if (wave <= 19) {
    // Waves 15-19: five enemies
    enemyCount = 5;
    levelMin = 50 + (wave - 15) * 4; // 50, 54, 58, 62, 66
    levelMax = 63 + (wave - 15) * 4; // 63, 67, 71, 75, 79
    coinReward = 120 + wave * 6;
  } else {
    // Wave 20+: six enemies, scaling to 100
    enemyCount = 6;
    levelMin = Math.min(95,  72 + (wave - 20) * 3);
    levelMax = Math.min(100, 85 + (wave - 20) * 3);
    coinReward = 160 + wave * 5;
  }

  // Boss waves: bump count floor to (regular+1) and add ~15% level, double coins
  if (isBossWave) {
    enemyCount = Math.max(enemyCount, wave === 5 ? 3 : enemyCount + 1);
    levelMin = Math.min(100, Math.floor(levelMin * 1.12));
    levelMax = Math.min(100, Math.floor(levelMax * 1.12));
    coinReward = Math.floor(coinReward * 2);
  }

  return {
    enemyCount,
    levelMin,
    levelMax,
    isBossWave,
    enemyPool: getEnemyPool(wave),
    bossPool: getBossPool(wave),
    coinReward,
  };
}

export function getEnemyLevel(config: WaveConfig): number {
  return config.levelMin + Math.floor(Math.random() * (config.levelMax - config.levelMin + 1));
}

export function selectEnemyIds(config: WaveConfig): number[] {
  if (config.isBossWave) {
    // Boss: mostly boss pool, 1-2 from regular pool
    const bossCount = Math.ceil(config.enemyCount / 2);
    const regularCount = config.enemyCount - bossCount;
    return [
      ...getRandomFromPool(config.bossPool, bossCount),
      ...getRandomFromPool(config.enemyPool, regularCount),
    ];
  }
  return getRandomFromPool(config.enemyPool, config.enemyCount);
}

export function getWaveCoins(wave: number, perks: import('../types').Perk[]): number {
  const config = getWaveConfig(wave);
  let coins = config.coinReward;

  // Coin multiplier perks
  for (const perk of perks) {
    if (perk.effect.coinMultiplier) {
      coins = Math.floor(coins * perk.effect.coinMultiplier);
    }
  }

  // Amulet Coin held by team members (handled in game state)
  return coins;
}

export function getWaveLabel(wave: number): string {
  if (wave % 5 === 0) return `BOSS WAVE ${wave}`;
  return `Wave ${wave}`;
}
