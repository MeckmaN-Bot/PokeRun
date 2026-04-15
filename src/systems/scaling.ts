import type { WaveConfig } from '../types';
import { getEnemyPool, getBossPool, getRandomFromPool } from '../data/enemyPools';

export function getWaveConfig(wave: number): WaveConfig {
  const isBossWave = wave % 5 === 0;

  let enemyCount: number;
  let levelMin: number;
  let levelMax: number;
  let coinReward: number;

  if (wave <= 5) {
    enemyCount = 2;
    levelMin = 5;
    levelMax = 15;
    coinReward = 30 + wave * 5;
  } else if (wave <= 10) {
    enemyCount = 3;
    levelMin = 15;
    levelMax = 30;
    coinReward = 50 + wave * 5;
  } else if (wave <= 15) {
    enemyCount = 4;
    levelMin = 30;
    levelMax = 50;
    coinReward = 75 + wave * 5;
  } else if (wave <= 20) {
    enemyCount = 5;
    levelMin = 50;
    levelMax = 70;
    coinReward = 100 + wave * 5;
  } else {
    enemyCount = 6;
    levelMin = 70;
    levelMax = Math.min(100, 70 + (wave - 20) * 2);
    coinReward = 130 + wave * 5;
  }

  // Boss waves are harder
  if (isBossWave) {
    enemyCount = Math.max(enemyCount, 4);
    levelMin = Math.floor(levelMin * 1.15);
    levelMax = Math.min(100, Math.floor(levelMax * 1.15));
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
