import './styles/main.css';
import './styles/battle.css';
import './styles/rewards.css';
import './styles/shop.css';
import './styles/leaderboard.css';

import type { GameState, BattlePokemon } from './types';
import { prefetchStarters, fetchPokemon, fetchPokemonBatch } from './api/pokeapi';
import { getWaveConfig, getEnemyLevel, selectEnemyIds, getWaveCoins } from './systems/scaling';
import { generateRewards } from './systems/rewards';
import { generateShop } from './systems/shop';
import { toBattlePokemon, monHasItem } from './systems/battle';

import { StartScreen } from './ui/screens/StartScreen';
import { BattleScreen } from './ui/screens/BattleScreen';
import { RewardScreen } from './ui/screens/RewardScreen';
import { ShopScreen } from './ui/screens/ShopScreen';
import { GameOverScreen } from './ui/screens/GameOverScreen';
import { LeaderboardScreen } from './ui/screens/LeaderboardScreen';
import { fadeIn, fadeOut, showToast, waveIntroAnimation, animateCoinGain } from './ui/animations';
import { gsap } from 'gsap';

// ============================================================
// App State
// ============================================================

let gameState: GameState | null = null;

// Screen containers (single root, swap content)
const appEl = document.getElementById('app')!;

let startScreen: StartScreen | null = null;
let battleScreen: BattleScreen | null = null;
let rewardScreen: RewardScreen | null = null;
let shopScreen: ShopScreen | null = null;
let gameOverScreen: GameOverScreen | null = null;
let leaderboardScreen: LeaderboardScreen | null = null;

let screenContainer: HTMLElement;

// ============================================================
// Boot
// ============================================================

async function boot(): Promise<void> {
  // Build main layout
  appEl.innerHTML = `
    <div id="screen-container" class="screen-container"></div>
  `;
  screenContainer = document.getElementById('screen-container')!;

  // Show loading
  showLoadingScreen();

  // Prefetch starter data
  try {
    await prefetchStarters();
  } catch {
    // non-fatal
  }

  hideLoadingScreen();
  showStartScreen();
}

// ============================================================
// Loading Screen
// ============================================================

function showLoadingScreen(): void {
  const loading = document.createElement('div');
  loading.id = 'main-loading';
  loading.className = 'loading-screen';
  loading.innerHTML = `
    <div class="loading-pokeball">
      <div class="pokeball-top"></div>
      <div class="pokeball-center"><div class="pokeball-button"></div></div>
      <div class="pokeball-bottom"></div>
    </div>
    <p class="loading-text">Catching wild Pokémon...</p>
    <div class="loading-bar"><div class="loading-fill" id="load-fill"></div></div>
  `;
  screenContainer.appendChild(loading);

  // Animate loading bar
  gsap.to('#load-fill', { width: '90%', duration: 1.5, ease: 'power1.inOut' });
}

function hideLoadingScreen(): void {
  const loading = document.getElementById('main-loading');
  if (loading) {
    gsap.to(loading, {
      opacity: 0, duration: 0.4,
      onComplete: () => loading.remove(),
    });
  }
}

// ============================================================
// Screen Management
// ============================================================

function createMountDiv(id: string): HTMLDivElement {
  const div = document.createElement('div');
  div.id = id;
  div.style.position = 'absolute';
  div.style.inset = '0';
  return div;
}

function clearScreen(): void {
  startScreen?.unmount();
  battleScreen?.unmount();
  rewardScreen?.unmount();
  shopScreen?.unmount();
  gameOverScreen?.unmount();
  leaderboardScreen?.unmount();

  startScreen = null;
  battleScreen = null;
  rewardScreen = null;
  shopScreen = null;
  gameOverScreen = null;
  leaderboardScreen = null;

  screenContainer.innerHTML = '';
}

// ============================================================
// Start Screen
// ============================================================

function showStartScreen(): void {
  clearScreen();
  const div = createMountDiv('start-screen-mount');
  screenContainer.appendChild(div);

  startScreen = new StartScreen(div, (state) => {
    gameState = state;
    startNewWave();
  });
  startScreen.mount();

  // Listen for leaderboard request from start screen
  div.addEventListener('show-leaderboard', () => {
    showLeaderboard(() => {
      clearScreen();
      showStartScreen();
    });
  });
}

// ============================================================
// Wave Start
// ============================================================

async function startNewWave(): Promise<void> {
  if (!gameState) return;

  const wave = gameState.wave;
  const config = getWaveConfig(wave);

  clearScreen();

  // Wave intro overlay
  const introEl = document.createElement('div');
  introEl.className = 'wave-intro-overlay';
  introEl.innerHTML = `
    <div class="wave-intro-content">
      <div class="wave-intro-number ${config.isBossWave ? 'boss' : ''}">${config.isBossWave ? '⚡ BOSS WAVE' : 'WAVE'}</div>
      <div class="wave-intro-num">${wave}</div>
      ${config.isBossWave ? '<div class="wave-intro-sub">PREPARE FOR BATTLE!</div>' : ''}
    </div>
  `;
  screenContainer.appendChild(introEl);

  await waveIntroAnimation(introEl);
  introEl.remove();

  // Show loading state while fetching enemy team
  const loadDiv = document.createElement('div');
  loadDiv.className = 'wave-loading';
  loadDiv.innerHTML = `
    <div class="wave-loading-inner">
      <div class="pokeball-spin"></div>
      <p>Wild Pokémon appeared!</p>
    </div>
  `;
  screenContainer.appendChild(loadDiv);

  try {
    const enemyIds = selectEnemyIds(config);
    const levels = enemyIds.map(() => getEnemyLevel(config));

    let fetched = 0;
    const enemyPokemons = await fetchPokemonBatch(enemyIds, 1, (done) => {
      fetched = done;
    });

    // Scale each enemy to its specific level
    const enemyTeam: BattlePokemon[] = enemyPokemons.map((p, i) => {
      const scaledPokemon = { ...p, level: levels[i] };
      return toBattlePokemon(scaledPokemon, []);
    });

    // Prepare reward Pokemon pool (3 options, fetched from current-wave pool)
    const rewardIds = selectEnemyIds(config).slice(0, 3);
    const rewardPokemonLevel = Math.floor((config.levelMin + config.levelMax) / 2);

    fetchPokemonBatch(rewardIds, rewardPokemonLevel).then(async (rewardPokemons) => {
      if (!gameState) return;
      gameState.pendingRewards = generateRewards(
        wave,
        config.isBossWave,
        gameState.activePerks.map(p => p.id),
        rewardPokemons
      );
    }).catch(() => {
      if (!gameState) return;
      gameState.pendingRewards = generateRewards(wave, config.isBossWave, [], []);
    });

    loadDiv.remove();

    // Setup battle state
    gameState.battleState = {
      playerTeam: gameState.team.map(p => ({ ...p })), // fresh copies
      enemyTeam,
      activePlayerIndex: 0,
      activeEnemyIndex: 0,
      turn: 0,
      log: [{
        text: `Wave ${wave}${config.isBossWave ? ' — BOSS WAVE' : ''}! The battle begins!`,
        type: 'system',
      }],
      phase: 'selecting',
      autoBattle: false,
      isBossWave: config.isBossWave,
      winner: null,
      pendingDamage: null,
    };

    showBattleScreen();
  } catch (err) {
    loadDiv.remove();
    console.error('Failed to load enemy team:', err);
    showToast('Failed to load enemy team. Retrying...', 'error');
    setTimeout(() => startNewWave(), 2000);
  }
}

// ============================================================
// Battle Screen
// ============================================================

function showBattleScreen(): void {
  if (!gameState) return;
  clearScreen();

  const div = createMountDiv('battle-screen-mount');
  screenContainer.appendChild(div);

  battleScreen = new BattleScreen(div, gameState, (state) => {
    gameState = state;
    const bs = state.battleState;

    if (bs?.winner === 'player') {
      // Victory — award coins
      const config = getWaveConfig(state.wave);
      const coinEarned = getWaveCoins(state.wave, state.activePerks);

      // Amulet coin bonus from held items (check all slots)
      const amuletBonus = state.team.filter(m => monHasItem(m, 'amulet_coin')).length * 0.2;
      const totalCoins = Math.floor(coinEarned * (1 + amuletBonus));

      const oldCoins = state.coins;
      state.coins += totalCoins;

      showToast(`+${totalCoins} coins!`, 'success');

      // Show reward screen (rewards were pre-fetched)
      showRewardScreen();
    } else {
      // Defeat
      showGameOver();
    }
  });
  battleScreen.mount();
}

// ============================================================
// Reward Screen
// ============================================================

function showRewardScreen(): void {
  if (!gameState) return;

  // If rewards weren't loaded yet, wait briefly
  if (gameState.pendingRewards.length === 0) {
    setTimeout(() => showRewardScreen(), 300);
    return;
  }

  clearScreen();
  const div = createMountDiv('reward-screen-mount');
  screenContainer.appendChild(div);

  rewardScreen = new RewardScreen(div, gameState, (state) => {
    gameState = state;
    showShopScreen();
  });
  rewardScreen.mount();
}

// ============================================================
// Shop Screen
// ============================================================

function showShopScreen(): void {
  if (!gameState) return;

  // Generate shop items if needed
  if (gameState.shopItems.length === 0) {
    gameState.shopItems = generateShop(gameState.wave);
  }

  clearScreen();
  const div = createMountDiv('shop-screen-mount');
  screenContainer.appendChild(div);

  shopScreen = new ShopScreen(div, gameState, (state) => {
    gameState = state;

    // Reset for next wave
    gameState.wave++;
    gameState.shopItems = [];
    gameState.battleState = null;

    // Restore team HP between waves (Nurse's Blessing perk)
    const hasNurse = gameState.activePerks.some(p => p.id === 'nurses_blessing');
    gameState.team.forEach(mon => {
      if (mon.battleHp > 0) {
        const regenPct = hasNurse ? 0.3 : 0.2;
        const heal = Math.floor(mon.maxBattleHp * regenPct);
        mon.battleHp = Math.min(mon.maxBattleHp, mon.battleHp + heal);
      }
    });

    startNewWave();
  });
  shopScreen.mount();
}

// ============================================================
// Game Over
// ============================================================

function showGameOver(): void {
  if (!gameState) return;
  clearScreen();

  const div = createMountDiv('gameover-screen-mount');
  screenContainer.appendChild(div);

  gameOverScreen = new GameOverScreen(
    div,
    gameState,
    () => {
      // Restart
      gameState = null;
      showStartScreen();
    },
    () => {
      // Show leaderboard from game over
      showLeaderboard(() => {
        clearScreen();
        showGameOver();
      });
    }
  );
  gameOverScreen.mount();
}

// ============================================================
// Leaderboard
// ============================================================

function showLeaderboard(onBack: () => void, playerScore?: number): void {
  clearScreen();
  const div = createMountDiv('lb-screen-mount');
  screenContainer.appendChild(div);

  leaderboardScreen = new LeaderboardScreen(div, onBack, playerScore);
  leaderboardScreen.mount();
}

// ============================================================
// Start the game
// ============================================================

boot().catch(console.error);
