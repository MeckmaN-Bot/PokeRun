import './styles/main.css';
import './styles/battle.css';
import './styles/rewards.css';
import './styles/shop.css';
import './styles/catch.css';
import './styles/leaderboard.css';
import './styles/auth.css';
import './styles/evolution.css';
import './styles/moveLearn.css';
import './styles/moveManager.css';
import './styles/audio.css';
import './styles/path.css';
import './styles/mobile.css';

import { installAudioKeyboardShortcuts } from './audio/AudioSettingsPanel';
import { bindGlobalAudioCues } from './audio/uiBindings';
import { Audio } from './audio/AudioManager';
import { registerAudioAssets } from './audio/registry';

import type { GameState, BattlePokemon } from './types';
import { prefetchStarters, fetchPokemon, fetchPokemonBatch } from './api/pokeapi';
import { getWaveConfig, getEnemyLevel, selectEnemyIds, getWaveCoins } from './systems/scaling';
import { generateRewards } from './systems/rewards';
import { generateShop, generateShopPacks, generateShopVouchers } from './systems/shop';
import { toBattlePokemon, monHasItem, getSlotItems } from './systems/battle';
import { pickRandomBossBlind } from './data/bossBlinds';
import { pickRandomTag, getTagById } from './data/tags';
import { ALL_ITEMS } from './data/items';

import { AuthScreen } from './ui/screens/AuthScreen';
import { getSession } from './systems/auth';
import { showCoachmark as _showCoachmark } from './systems/tutorial';
import { isTourActive } from './systems/tutorialTour';

// Wrap coachmarks so they don't double-up over the active tour overlay.
const showCoachmark: typeof _showCoachmark = (id, opts) => {
  if (isTourActive()) return;
  _showCoachmark(id, opts);
};
import { StartScreen } from './ui/screens/StartScreen';
import { BattleScreen } from './ui/screens/BattleScreen';
import { RewardScreen } from './ui/screens/RewardScreen';
import { CatchScreen } from './ui/screens/CatchScreen';
import { ShopScreen } from './ui/screens/ShopScreen';
import { PathSelectScreen } from './ui/screens/PathSelectScreen';
import { PokemonCenterScreen } from './ui/screens/PokemonCenterScreen';
import { MysteryEventScreen } from './ui/screens/MysteryEventScreen';
import { generateNodeOptions } from './data/nodes';
import { getTrainerArchetype } from './data/trainerArchetypes';
import { poolForTypes } from './data/typePools';
import { getGymLeader, GYM_LEADERS } from './data/gymLeaders';
import { trainerSpriteUrl } from './data/trainerArchetypes';
import { buildArena } from './data/arenas';
import { saveRun, loadRun, clearRun } from './systems/saveRun';
import { applySettings } from './systems/userSettings';
import { getEliteStep } from './data/eliteFour';
import { getBadge } from './data/badges';
import { itemSprite, pokemonSprite, imgErrorFallback, badgeSprite } from './data/sprites';
import { GameOverScreen } from './ui/screens/GameOverScreen';
import { LeaderboardScreen } from './ui/screens/LeaderboardScreen';
import { fadeIn, fadeOut, showToast, waveIntroAnimation, animateCoinGain, bossWarnAnimation } from './ui/animations';
import { getBossBlindById } from './data/bossBlinds';
import { gsap } from 'gsap';

// ============================================================
// App State
// ============================================================

let gameState: GameState | null = null;

// Screen containers (single root, swap content)
const appEl = document.getElementById('app')!;

let authScreen: AuthScreen | null = null;
let startScreen: StartScreen | null = null;
let battleScreen: BattleScreen | null = null;
let rewardScreen: RewardScreen | null = null;
let catchScreen: CatchScreen | null = null;
let shopScreen: ShopScreen | null = null;
let pathSelectScreen: PathSelectScreen | null = null;
let pokemonCenterScreen: PokemonCenterScreen | null = null;
let mysteryEventScreen: MysteryEventScreen | null = null;
let gameOverScreen: GameOverScreen | null = null;
let leaderboardScreen: LeaderboardScreen | null = null;

let screenContainer: HTMLElement;

// ============================================================
// Boot
// ============================================================

async function boot(): Promise<void> {
  // Prevent GSAP animations from freezing when tab is in background
  gsap.ticker.lagSmoothing(0);

  installMobileDetection();
  installErrorBoundary();
  applySettings();

  // Build main layout
  appEl.innerHTML = `
    <div id="screen-container" class="screen-container"></div>
  `;
  screenContainer = document.getElementById('screen-container')!;

  // Mount a one-off SVG filter used by `.px-emoji` to pixelate emoji glyphs.
  // Combines small blur + posterization → chunky, stamp-like cartoon feel.
  if (!document.getElementById('pokerun-svg-defs')) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'pokerun-svg-defs';
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';
    svg.innerHTML = `
      <defs>
        <filter id="px-pixelate" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
          <feGaussianBlur stdDeviation="0.55" />
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues="0 0.2 0.45 0.7 0.95"/>
            <feFuncG type="discrete" tableValues="0 0.2 0.45 0.7 0.95"/>
            <feFuncB type="discrete" tableValues="0 0.2 0.45 0.7 0.95"/>
            <feFuncA type="discrete" tableValues="0 0.4 0.85 1 1"/>
          </feComponentTransfer>
          <feMorphology operator="dilate" radius="0.4"/>
        </filter>
      </defs>
    `;
    document.body.appendChild(svg);
  }

  // Audio: keyboard shortcut + global UI cues + asset registry. Inline audio
  // button is mounted per-screen (StartScreen footer, ShopScreen header).
  installAudioKeyboardShortcuts();
  bindGlobalAudioCues(document.body);
  registerAudioAssets();
  // Warm the HTTP cache for sounds that fire on first interaction.
  Audio.prefetch(['ui.click', 'ui.confirm', 'ui.cancel', 'ui.error', 'ui.coin', 'music.menu']);

  // Fire-and-forget — prefetch is just a cache warmer, never block boot on it
  prefetchStarters().catch(() => {});

  hideLoadingScreen();
  showAuthScreen();
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
  authScreen?.unmount();
  startScreen?.unmount();
  battleScreen?.unmount();
  rewardScreen?.unmount();
  catchScreen?.unmount();
  shopScreen?.unmount();
  gameOverScreen?.unmount();
  leaderboardScreen?.unmount();
  pathSelectScreen?.unmount();
  pokemonCenterScreen?.unmount();
  mysteryEventScreen?.unmount();

  startScreen = null;
  battleScreen = null;
  rewardScreen = null;
  catchScreen = null;
  shopScreen = null;
  gameOverScreen = null;
  leaderboardScreen = null;
  pathSelectScreen = null;
  pokemonCenterScreen = null;
  mysteryEventScreen = null;

  screenContainer.innerHTML = '';

  // Remove any lingering body-appended VFX elements (fixed-position particles)
  document.querySelectorAll('.battle-vfx').forEach(el => el.remove());
}

// ============================================================
// Auth Screen
// ============================================================

function showAuthScreen(): void {
  clearScreen();
  void Audio.playMusic('music.menu', { fadeMs: 1400 });
  const div = createMountDiv('auth-screen-mount');
  screenContainer.appendChild(div);

  authScreen = new AuthScreen(div, (playerName, isGuest) => {
    showStartScreen(playerName, isGuest);
  });
  authScreen.mount();
}

// ============================================================
// Start Screen
// ============================================================

function showStartScreen(playerName?: string, isGuest?: boolean): void {
  const session = getSession();
  playerName ??= session?.username ?? '';
  isGuest    ??= session?.isGuest  ?? false;
  clearScreen();
  void Audio.playMusic('music.menu', { fadeMs: 1400 });
  const div = createMountDiv('start-screen-mount');
  screenContainer.appendChild(div);

  startScreen = new StartScreen(div, (state) => {
    gameState = state;
    showPathSelect();
  }, () => {
    showAuthScreen();
  }, playerName, isGuest, () => {
    // Resume callback — reuse persisted state, jump straight back into the run
    const saved = loadRun();
    if (!saved) return;
    gameState = saved.state;
    // Most natural resume point is path-select; if there's no path queued it'll
    // generate a fresh one for the saved act/step.
    showPathSelect();
  });
  startScreen.mount();

  // Listen for leaderboard request from start screen
  div.addEventListener('show-leaderboard', () => {
    showLeaderboard(() => {
      clearScreen();
      showStartScreen(playerName, isGuest);
    });
  });
}

// ============================================================
// Wave Start
// ============================================================

async function startNewWave(): Promise<void> {
  if (!gameState) return;

  const wave = gameState.wave;
  // Gym / Elite Four / Champion always count as boss waves regardless of schedule.
  const node = gameState.currentNode;
  const isStoryBoss = node?.kind === 'gym' || node?.kind === 'elite_four' || node?.kind === 'champion';
  const isBossWave = isStoryBoss || wave === gameState.nextBossWave;
  const config = getWaveConfig(wave, isBossWave);

  clearScreen();

  // Pre-roll boss blind so we can preview it in the warning + reuse it later
  const preRolledBlind = config.isBossWave ? pickRandomBossBlind().id : null;

  // Pre-roll wave tag — consume queued first, else low-chance roll on non-boss waves
  let preRolledTag: import('./data/tags').WaveTagId | null = null;
  if (gameState.queuedTags.length > 0) {
    preRolledTag = gameState.queuedTags[0] ?? null;
  } else if (!config.isBossWave && Math.random() < 0.18) {
    preRolledTag = pickRandomTag().id;
  }

  // Boss warn VFX — played BEFORE the wave intro on boss waves
  if (config.isBossWave) {
    Audio.play('wave.boss_warn');
    const blind = preRolledBlind ? getBossBlindById(preRolledBlind) : undefined;
    await bossWarnAnimation(blind?.name, blind?.color);
  } else {
    Audio.play('wave.intro');
  }

  // Wave intro overlay
  const introEl = document.createElement('div');
  introEl.className = 'wave-intro';
  const tagInfo = preRolledTag ? getTagById(preRolledTag) : undefined;
  const tagBannerHtml = tagInfo
    ? `<div class="wave-intro-tag" style="--tag-color:${tagInfo.color}">
         <span class="wit-icon">${tagInfo.icon}</span>
         <span class="wit-label">
           <span class="wit-name">${tagInfo.name}</span>
           <span class="wit-desc">${tagInfo.description}</span>
         </span>
       </div>`
    : '';
  // Trainer / Gym / League intro
  const trainerArchetypeForIntro = node?.kind === 'trainer'
    ? getTrainerArchetype(node.trainerArchetypeId ?? '')
    : undefined;
  const gymLeaderForIntro = node?.kind === 'gym'
    ? getGymLeader(node.gymLeaderId ?? '')
    : undefined;
  const eliteStepForIntro = (node?.kind === 'elite_four' || node?.kind === 'champion')
    ? getEliteStep(node.eliteId ?? '')
    : undefined;

  const sprite = node?.spriteUrl;
  const spriteHtml = sprite
    ? `<div class="wave-trainer-portrait" aria-hidden="true">
         <img src="${sprite}" alt="" class="wave-trainer-sprite"
              onerror="this.style.display='none';" />
       </div>`
    : '';

  let introEyebrow: string;
  let introMain: string;
  let introSub: string;
  let extraClass = '';

  if (eliteStepForIntro) {
    introEyebrow = eliteStepForIntro.title;
    introMain = `${spriteHtml}<div class="wn">${eliteStepForIntro.name.toUpperCase()}</div>`;
    introSub = eliteStepForIntro.flavour;
    extraClass = ' trainer league';
  } else if (gymLeaderForIntro) {
    introEyebrow = `${gymLeaderForIntro.city} · Gym`;
    introMain = `${spriteHtml}<div class="wn">${gymLeaderForIntro.name.toUpperCase()}</div>`;
    introSub = gymLeaderForIntro.flavour;
    extraClass = ' trainer gym';
  } else if (trainerArchetypeForIntro) {
    introEyebrow = 'Trainer challenges you';
    introMain = `${spriteHtml}<div class="wn">${trainerArchetypeForIntro.name.toUpperCase()}</div>`;
    introSub = trainerArchetypeForIntro.flavour;
    extraClass = ' trainer';
  } else {
    introEyebrow = config.isBossWave ? 'Boss encounter' : 'Incoming wave';
    introMain = `<div class="wn">WAVE <em>${String(wave).padStart(2, '0')}</em></div>`;
    introSub = config.isBossWave ? 'A monstrous challenger blocks the route.' : 'Wild creatures ahead.';
  }

  // Arena progress banner — only when inside a gauntlet.
  const arena = gameState.arenaState;
  const arenaBannerHtml = arena
    ? (() => {
        const leader = getGymLeader(arena.gymId);
        const total = arena.steps.length;
        const cur = arena.index; // 1-based for display (already incremented before runArenaStep return)
        const pips = Array.from({ length: total }, (_, i) =>
          `<span class="arena-pip${i < cur ? ' done' : i === cur - 1 ? ' active' : ''}"></span>`
        ).join('');
        return `<div class="arena-progress" style="--arena-color:${leader?.accent ?? '#3a3a3a'}">
          <span class="arena-progress-label">Arena · ${cur}/${total}</span>
          <span class="arena-progress-pips">${pips}</span>
          <span class="arena-progress-target">vs ${leader?.name ?? '???'}</span>
        </div>`;
      })()
    : '';

  // Outside an arena: show the same big stage-progress strip on wave-intro so
  // the player always knows how many stops until the next gym.
  const waveAct = gameState.currentAct;
  const waveStep = gameState.actStep;
  const stageLeaderForIntro = !arena && waveAct >= 1 && waveAct <= 8 ? GYM_LEADERS[waveAct - 1] : undefined;
  const stageProgressIntroHtml = stageLeaderForIntro
    ? (() => {
        const accent = stageLeaderForIntro.accent;
        const stopsLeft = Math.max(0, 4 - waveStep);
        const pips = [0, 1, 2, 3].map(i => {
          const isGym = i === 3;
          const isDone = i < waveStep;
          const isCurrent = i === waveStep;
          const cls = ['stage-pip', isGym ? 'gym' : '', isDone ? 'done' : '', isCurrent ? 'current' : '']
            .filter(Boolean).join(' ');
          const label = isGym ? 'ARENA' : `${i + 1}`;
          return `<span class="${cls}"><span class="stage-pip-label">${label}</span></span>`;
        }).join('<span class="stage-pip-rail" aria-hidden="true"></span>');
        const cta = stopsLeft <= 0
          ? `ENTERING ${stageLeaderForIntro.name.toUpperCase()}'S ARENA`
          : `${stopsLeft} STOP${stopsLeft === 1 ? '' : 'S'} TO ${stageLeaderForIntro.name.toUpperCase()}`;
        return `<div class="stage-progress wave-intro-stage" style="--stage-color:${accent}">
          <div class="stage-progress-portrait">
            <img src="${trainerSpriteUrl(stageLeaderForIntro.spriteSlug)}" alt="" onerror="this.style.display='none';" />
          </div>
          <div class="stage-progress-body">
            <div class="stage-progress-eyebrow">${stageLeaderForIntro.city.toUpperCase()} · ACT ${waveAct}</div>
            <div class="stage-progress-pips">${pips}</div>
            <div class="stage-progress-cta">${cta}</div>
          </div>
        </div>`;
      })()
    : '';

  introEl.innerHTML = `
    <div class="wave-intro-card${config.isBossWave ? ' boss' : ''}${extraClass}">
      <div class="eyebrow">${introEyebrow}</div>
      ${introMain}
      <div class="sub">${introSub}</div>
      ${arenaBannerHtml}
      ${stageProgressIntroHtml}
      ${tagBannerHtml}
      <div class="hint">Tap / Press A to continue</div>
    </div>
  `;
  screenContainer.appendChild(introEl);

  await waveIntroAnimation(introEl, { hasTag: !!tagInfo });
  introEl.remove();

  // First-wave coachmark — quick rules primer the very first time only.
  if (wave === 1 && !node) {
    showCoachmark('first_wave', {
      eyebrow: 'Field manual · Wave 01',
      title: 'Battle basics',
      body: 'Pick a move each turn — or toggle <b>Auto-Battle</b> with <kbd>A</kbd>. Speed decides who strikes first. <b>Type matchups</b> deal 2× or 0.5× damage. Items in your bag can be used in-battle.',
      cta: 'Begin →',
    });
  }
  if (node?.kind === 'gym') {
    showCoachmark('first_arena', {
      eyebrow: 'Field manual · Arena',
      title: 'You\'re at a gym leader',
      body: 'Arenas are <b>multi-step gauntlets</b>: junior trainer → restock shop → senior trainer → leader. HP carries over between fights, so spend coins on healing items or counter the gym\'s type.',
      cta: 'Got it →',
    });
  }

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

  // Trainer / Gym / League roster overrides
  const trainerArchetype = node?.kind === 'trainer'
    ? getTrainerArchetype(node.trainerArchetypeId ?? '')
    : undefined;
  const gymLeader = node?.kind === 'gym'
    ? getGymLeader(node.gymLeaderId ?? '')
    : undefined;
  const eliteStep = (node?.kind === 'elite_four' || node?.kind === 'champion')
    ? getEliteStep(node.eliteId ?? '')
    : undefined;

  try {
    let enemyIds: number[];
    let levelDelta = 0;
    let teamSize = config.enemyCount;
    if (eliteStep) {
      const biased = poolForTypes(eliteStep.bias);
      teamSize = eliteStep.teamSize;
      const fillers = biased.length > 0
        ? Array.from({ length: Math.max(0, teamSize - 1) }, () => biased[Math.floor(Math.random() * biased.length)])
        : Array.from({ length: Math.max(0, teamSize - 1) }, () => selectEnemyIds(config)[0] ?? 1);
      // Ace last so it stays in the back like canonical leaders
      enemyIds = [...fillers, eliteStep.acePokemonId];
      levelDelta = eliteStep.levelDelta;
    } else if (gymLeader) {
      const biased = poolForTypes(gymLeader.bias);
      teamSize = gymLeader.teamSize;
      const fillers = biased.length > 0
        ? Array.from({ length: Math.max(0, teamSize - 1) }, () => biased[Math.floor(Math.random() * biased.length)])
        : Array.from({ length: Math.max(0, teamSize - 1) }, () => selectEnemyIds(config)[0] ?? 1);
      enemyIds = [...fillers, gymLeader.acePokemonId];
      levelDelta = gymLeader.levelDelta;
    } else if (trainerArchetype) {
      const allowed = new Set(config.enemyPool);
      const biasedRaw = poolForTypes(trainerArchetype.typeBias);
      const biased = biasedRaw.filter(id => allowed.has(id));
      teamSize = node?.teamSizeOverride ?? trainerArchetype.teamSize ?? config.enemyCount;
      enemyIds = biased.length > 0
        ? Array.from({ length: teamSize }, () => biased[Math.floor(Math.random() * biased.length)])
        : selectEnemyIds(config).slice(0, teamSize);
      levelDelta = trainerArchetype.levelDelta;
      // Early-act easing: junior arena trainers get no levelDelta on top.
      if (node?.arenaRank === 'Junior' && (gameState.currentAct ?? 1) <= 2) {
        levelDelta = Math.min(levelDelta, 0);
      }
    } else if (node?.kind === 'grass' && node.habitatBias) {
      // Habitat-biased grass: bias type pool by node hint, but never break
      // out of the wave's allowed dex range — keeps fossils/legendaries
      // (Aerodactyl, Articuno, etc.) out of early waves where they'd be
      // pure type-traps with no counter-play.
      const allowed = new Set(config.enemyPool);
      const biasedRaw = poolForTypes([node.habitatBias]);
      const biased = biasedRaw.filter(id => allowed.has(id));
      enemyIds = biased.length > 0
        ? Array.from({ length: config.enemyCount }, () => biased[Math.floor(Math.random() * biased.length)])
        : selectEnemyIds(config);
    } else {
      enemyIds = selectEnemyIds(config);
    }
    const baseLevels = enemyIds.map(() => getEnemyLevel(config));
    const levels = levelDelta !== 0
      ? baseLevels.map(l => Math.max(1, l + levelDelta))
      : baseLevels;

    let fetched = 0;
    const enemyPokemons = await fetchPokemonBatch(enemyIds, 1, (done) => {
      fetched = done;
    });

    // Scale each enemy to its specific level + apply threat multiplier for late-game.
    // Early-arena easing: the act-1/2 gym leader is a hard wall otherwise — first
    // arena leader fight lands on a boss-flagged wave 6, compounding wave threat
    // ramp × boss bonus × leader levelDelta into a one-shot wipe.
    let threatMult = config.threatMultiplier ?? 1;
    if (gymLeader && (gameState.currentAct ?? 1) <= 2) {
      threatMult = Math.min(threatMult, 1.0);
    } else if (gymLeader && (gameState.currentAct ?? 1) <= 4) {
      threatMult = Math.min(threatMult, 1.0 + (threatMult - 1.0) * 0.6);
    }
    // Elite pool: only meaningful held items (skip healing berries — not very threatening)
    const ELITE_ITEM_POOL = ALL_ITEMS.filter(i =>
      i.itemType === 'held' && (i.rarity === 'rare' || i.rarity === 'epic') &&
      !['focus_sash', 'revive_heart', 'eviolite'].includes(i.id)
    );
    const enemyTeam: BattlePokemon[] = enemyPokemons.map((p, i) => {
      const scaledPokemon = { ...p, level: levels[i] };
      const bp = toBattlePokemon(scaledPokemon, []);
      if (threatMult !== 1) {
        bp.effectiveStats.attack  = Math.floor(bp.effectiveStats.attack  * threatMult);
        bp.effectiveStats.spAtk   = Math.floor(bp.effectiveStats.spAtk   * threatMult);
        bp.effectiveStats.defense = Math.floor(bp.effectiveStats.defense * Math.sqrt(threatMult));
        bp.effectiveStats.spDef   = Math.floor(bp.effectiveStats.spDef   * Math.sqrt(threatMult));
        bp.maxBattleHp = Math.floor(bp.maxBattleHp * threatMult);
        bp.battleHp    = bp.maxBattleHp;
      }
      // Elite roll — 10% per non-boss enemy, wave ≥ 3. Boss waves never spawn elites (they have blinds instead)
      if (!config.isBossWave && wave >= 3 && Math.random() < 0.10 && ELITE_ITEM_POOL.length > 0) {
        const item = ELITE_ITEM_POOL[Math.floor(Math.random() * ELITE_ITEM_POOL.length)];
        bp.isElite = true;
        bp.heldItem = { ...item };
        if (bp.itemSlots.length > 0) {
          bp.itemSlots[0].unlocked = true;
          bp.itemSlots[0].item = { ...item };
        }
        // Elite stat boost — 20% across the board
        bp.effectiveStats.attack  = Math.floor(bp.effectiveStats.attack  * 1.2);
        bp.effectiveStats.spAtk   = Math.floor(bp.effectiveStats.spAtk   * 1.2);
        bp.effectiveStats.defense = Math.floor(bp.effectiveStats.defense * 1.2);
        bp.effectiveStats.spDef   = Math.floor(bp.effectiveStats.spDef   * 1.2);
        bp.effectiveStats.speed   = Math.floor(bp.effectiveStats.speed   * 1.2);
        bp.maxBattleHp = Math.floor(bp.maxBattleHp * 1.2);
        bp.battleHp = bp.maxBattleHp;
      }
      return bp;
    });

    // Prepare reward Pokemon pool (3 options, fetched from current-wave pool)
    const rewardIds = selectEnemyIds(config).slice(0, 3);
    const rewardPokemonLevel = Math.floor((config.levelMin + config.levelMax) / 2);

    // Tag-based reward option flags
    const rareFloor = preRolledTag === 'rare_tag' || gameState.pendingRareFloor;
    const omenGlobe = gameState.vouchers?.includes('omen_globe');
    const extraCard = (config.isBossWave && gameState.pendingBossTagBonus) || omenGlobe;
    const rewardOpts = {
      minRarity: rareFloor ? ('rare' as const) : undefined,
      extraCard: !!extraCard,
    };
    gameState.pendingRareFloor = false;

    fetchPokemonBatch(rewardIds, rewardPokemonLevel).then(async (rewardPokemons) => {
      if (!gameState) return;
      gameState.pendingRewards = generateRewards(
        wave,
        config.isBossWave,
        gameState.activePerks.map(p => p.id),
        rewardPokemons,
        rewardOpts,
      );
    }).catch(() => {
      if (!gameState) return;
      gameState.pendingRewards = generateRewards(wave, config.isBossWave, [], [], rewardOpts);
    });

    loadDiv.remove();

    // Boss-Blind — use the pre-rolled blind so the warning preview matches
    const bossBlind = preRolledBlind;

    // Wave-Tag — consume pre-rolled tag (displayed in the wave intro)
    const waveTag = preRolledTag;
    if (waveTag && gameState.queuedTags[0] === waveTag) {
      gameState.queuedTags.shift();
    }
    gameState.pendingWaveTag = waveTag;

    // Apply Manacle debuffs pre-battle
    if (bossBlind === 'the_manacle') {
      gameState.team.forEach(mon => {
        mon.statStages.attack  = Math.max(-6, -2);
        mon.statStages.defense = Math.max(-6, -2);
        mon.statStages.spAtk   = Math.max(-6, -2);
        mon.statStages.spDef   = Math.max(-6, -2);
        mon.statStages.speed   = Math.max(-6, -2);
      });
    }

    // Apply The Wall — double enemy HP
    if (bossBlind === 'the_wall') {
      enemyTeam.forEach(e => {
        e.maxBattleHp = Math.floor(e.maxBattleHp * 2);
        e.battleHp = e.maxBattleHp;
      });
    }

    // Reset boss-insurance flag at start of each boss wave
    if (config.isBossWave) {
      (gameState as { _bossInsuranceUsed?: boolean })._bossInsuranceUsed = false;
    }

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
      autoBattle: (() => { try { return localStorage.getItem('pokerun.autoBattle') === '1'; } catch { return false; } })(),
      isBossWave: config.isBossWave,
      winner: null,
      pendingDamage: null,
      bossBlind,
      hasUsedFirstAttack: false,
      usedMoveIds: [],
      toothHealedEnemies: [],
      hookTurnCount: 0,
      waveTag,
      turnsUsed: 0,
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

  const isBoss = gameState.battleState?.isBossWave ?? (gameState.wave === gameState.nextBossWave);
  void Audio.playMusic(isBoss ? 'music.battle_boss' : 'music.battle_normal', { fadeMs: 900 });

  const div = createMountDiv('battle-screen-mount');
  screenContainer.appendChild(div);

  battleScreen = new BattleScreen(div, gameState, (state) => {
    gameState = state;
    const bs = state.battleState;

    if (bs?.winner === 'player') {
      // Victory — award coins
      const isBossVictory = bs.isBossWave;
      void Audio.playMusic('music.victory', { fadeMs: 200, loop: false, volume: 0.95 });
      const config = getWaveConfig(state.wave, isBossVictory);
      const coinEarned = getWaveCoins(state.wave, isBossVictory, state.activePerks);

      // After a boss wave, schedule the next boss wave randomly 4–7 waves away
      if (isBossVictory) {
        state.nextBossWave = state.wave + 5 + Math.floor(Math.random() * 4); // 5-8 waves between bosses
      }

      // Amulet coin bonus from held items (check all slots)
      const amuletBonus = state.team.filter(m => monHasItem(m, 'amulet_coin')).length * 0.2;
      // Elite coin bonus — +100% per elite defeated
      const eliteCount = bs.enemyTeam.filter(e => e.isElite).length;
      const eliteBonus = eliteCount;
      // Wave-Tag effects — multipliers apply to coin reward
      const activeTag = bs.waveTag ?? state.pendingWaveTag ?? null;
      let coinMultiplier = 1;
      if (activeTag === 'double_coins') coinMultiplier = 2;
      if (activeTag === 'investment') {
        // +25¢ per wave until next boss clear
        state.investmentCoins = (state.investmentCoins ?? 0) + 25;
      }
      let tagBonus = 0;
      if (activeTag === 'speed_tag' && bs.turnsUsed <= 5) tagBonus += 100;
      if (activeTag === 'orbit_tag') {
        state.team.forEach(mon => { mon.level = Math.min(100, mon.level + 3); });
      }
      // Queue follow-up tag flags
      if (activeTag === 'boss_tag') state.pendingBossTagBonus = true;
      if (activeTag === 'charm_tag') state.pendingCharmPack = true;
      if (activeTag === 'voucher_tag') state.pendingVoucherSlot = true;
      // Boss-Tag is consumed when next boss wave's reward gets its extra card
      if (isBossVictory && state.pendingBossTagBonus) {
        state.pendingBossTagBonus = false;
      }

      const investmentPayout = state.investmentCoins ?? 0;
      const winNode = state.currentNode;
      const trainerArchetypeWin = winNode?.kind === 'trainer'
        ? getTrainerArchetype(winNode.trainerArchetypeId ?? '')
        : undefined;
      const gymLeaderWin = winNode?.kind === 'gym'
        ? getGymLeader(winNode.gymLeaderId ?? '')
        : undefined;
      const eliteStepWin = (winNode?.kind === 'elite_four' || winNode?.kind === 'champion')
        ? getEliteStep(winNode.eliteId ?? '')
        : undefined;
      const trainerCoinMult =
        eliteStepWin?.coinMultiplier ??
        gymLeaderWin?.coinMultiplier ??
        trainerArchetypeWin?.coinMultiplier ?? 1;
      const totalCoins = Math.floor(
        coinEarned * (1 + amuletBonus + eliteBonus) * coinMultiplier * trainerCoinMult
      ) + tagBonus + investmentPayout;

      // Gym victory → award badge + matching perk if not yet held.
      if (gymLeaderWin && !state.badges.includes(gymLeaderWin.badgeId)) {
        state.badges.push(gymLeaderWin.badgeId);
        const badge = getBadge(gymLeaderWin.badgeId);
        if (badge) {
          if (!state.activePerks.some(p => p.id === badge.perk.id)) {
            state.activePerks.push(badge.perk);
          }
          showBadgeAward(badge, gymLeaderWin.name);
        }
      }
      // Leader fight ends the arena gauntlet — clear it so normal flow resumes.
      if (gymLeaderWin) {
        state.arenaState = null;
      }
      // Elite Four / Champion → advance league progression.
      if (eliteStepWin) {
        state.leagueStep = (state.leagueStep ?? 0) + 1;
        if (eliteStepWin.isChampion) {
          state.pendingGenGate = true;
        }
      }

      const oldCoins = state.coins;
      state.coins += totalCoins;

      // Investment resets on boss clear
      if (isBossVictory && state.investmentCoins) {
        state.investmentCoins = 0;
      }

      // Build toast with bonus annotations
      const notes: string[] = [];
      if (eliteCount > 0) notes.push(`${eliteCount} Elite`);
      if (coinMultiplier > 1) notes.push(`${coinMultiplier}× Tag`);
      if (tagBonus > 0) notes.push(`+${tagBonus}¢ Speed`);
      if (investmentPayout > 0) notes.push(`+${investmentPayout}¢ Invest`);
      const noteStr = notes.length > 0 ? ` (${notes.join(', ')})` : '';
      showToast(`+${totalCoins} coins!${noteStr}`, 'success');

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

  showCoachmark('first_reward', {
    eyebrow: 'Field manual · Spoils',
    title: 'Pick one of three',
    body: 'Each card is a <b>Pokémon</b>, a <b>team perk</b>, or an <b>item</b>. You can also <b>skip</b> for +60¢. Boss waves drop better loot — save your skips for those.',
    cta: 'Pick a card →',
  });
  screenContainer.appendChild(div);

  // Save the post-battle state so a refresh inside the reward step doesn't
  // rewind you back across the battle you already won.
  saveRun(gameState);

  rewardScreen = new RewardScreen(div, gameState, (state) => {
    gameState = state;
    saveRun(gameState);
    if (state.pendingCatch) {
      showCatchScreen();
    } else if (state.arenaState) {
      // Inside an arena gauntlet — skip the standard post-wave shop and march on.
      showPathSelect();
    } else {
      showShopScreen();
    }
  });
  rewardScreen.mount();
}

// ============================================================
// Catch Screen
// ============================================================

function showCatchScreen(): void {
  if (!gameState?.pendingCatch) return;
  clearScreen();

  // Duck battle music + play short encounter sting
  Audio.duckMusic(0.35, 250);
  void Audio.playMusic('music.catch_intro', { fadeMs: 200, loop: false, volume: 0.9 });

  const div = createMountDiv('catch-screen-mount');
  screenContainer.appendChild(div);

  showCoachmark('first_catch', {
    eyebrow: 'Field manual · Catch',
    title: 'A wild encounter!',
    body: 'Throw a <b>Poké Ball</b> from your bag — better balls have higher catch rates. The mon\'s HP and status affect the odds. Caught mons join your team if there\'s room, or replace a benched mon.',
    cta: 'Got it →',
  });

  saveRun(gameState);

  catchScreen = new CatchScreen(div, gameState, gameState.pendingCatch, (state) => {
    gameState = state;
    saveRun(gameState);
    Audio.duckMusic(1, 400);
    if (state.arenaState) {
      // Inside an arena gauntlet — skip the standard post-wave shop and march on.
      showPathSelect();
    } else {
      showShopScreen();
    }
  });
  catchScreen.mount();
}

// ============================================================
// Shop Screen
// ============================================================

function showShopScreen(): void {
  if (!gameState) return;

  // Generate shop items if needed
  const ownedVouchers = gameState.vouchers ?? [];
  if (gameState.shopItems.length === 0) {
    const totalHp = gameState.team.reduce((s, m) => s + m.battleHp, 0);
    const totalMaxHp = gameState.team.reduce((s, m) => s + m.maxBattleHp, 1);
    const teamHpRatio = totalHp / totalMaxHp;
    const healingPity = (gameState.shopsWithoutHealing ?? 0) >= 3;
    const epicPity = (gameState.shopsWithoutEpic ?? 0) >= 3;
    gameState.shopItems = generateShop(gameState.wave, [], ownedVouchers, {
      teamHpRatio, healingPity, epicPity,
    });
    // Update pity counters based on what showed up
    const HEALING_IDS = ['potion', 'super_potion', 'hyper_potion', 'full_restore', 'pokemon_food', 'max_potion'];
    const hasHealing = gameState.shopItems.some(s => HEALING_IDS.includes(s.item.id));
    const hasEpic = gameState.shopItems.some(s => s.item.rarity === 'epic' || s.item.rarity === 'legendary');
    gameState.shopsWithoutHealing = hasHealing ? 0 : (gameState.shopsWithoutHealing ?? 0) + 1;
    gameState.shopsWithoutEpic = hasEpic ? 0 : (gameState.shopsWithoutEpic ?? 0) + 1;
  }
  if (!gameState.shopPacks || gameState.shopPacks.length === 0) {
    const freeMega = !!gameState.pendingCharmPack;
    gameState.shopPacks = generateShopPacks(gameState.wave, freeMega, ownedVouchers);
    gameState.pendingCharmPack = false;
  }
  if (!gameState.shopVouchers || gameState.shopVouchers.length === 0) {
    const guaranteed = !!gameState.pendingVoucherSlot;
    gameState.shopVouchers = generateShopVouchers(gameState.wave, ownedVouchers, guaranteed);
    gameState.pendingVoucherSlot = false;
  }
  gameState.freeRerollUsed = false;
  // Master Ball Luck perk: +1 free reroll per shop
  const extraRerollPerks = gameState.activePerks.reduce(
    (sum, p) => sum + (p.effect.extraReroll ?? 0), 0);
  gameState.freeRerollsLeft = extraRerollPerks;

  clearScreen();
  void Audio.playMusic('music.shop', { fadeMs: 1000 });
  const div = createMountDiv('shop-screen-mount');
  screenContainer.appendChild(div);

  showCoachmark('first_shop', {
    eyebrow: 'Field manual · Shop',
    title: 'The pop-up shop',
    body: 'Spend coins on <b>consumables</b>, <b>held items</b>, and the occasional rare mon. <b>Reroll</b> the inventory once per visit (free), then it costs coins. Healing pity guarantees a Potion every few shops.',
    cta: 'Got it →',
  });

  // Save the freshly-rolled shop so refresh inside the shop returns the same
  // inventory + post-battle team, not the stale state from the prior path.
  saveRun(gameState);

  shopScreen = new ShopScreen(div, gameState, (state) => {
    gameState = state;

    // Reset for next wave
    gameState.wave++;
    gameState.shopItems = [];
    gameState.shopPacks = [];
    gameState.shopVouchers = [];
    gameState.freeRerollUsed = false;
    gameState.freeRerollsLeft = 0;
    gameState.battleState = null;

    // HP persists across waves. Only Nurse's Blessing perk auto-heals;
    // everyone else must rely on items, Pokémon Center nodes, or surviving
    // injured. Damage carrying forward is core roguelike attrition tension.
    const hasNurse = gameState.activePerks.some(p => p.id === 'nurses_blessing');
    gameState.team.forEach(mon => {
      // Momentum Badge: gain 1 stack per wave won (max 10)
      if (getSlotItems(mon).some(i => i.id === 'momentum_badge')) {
        mon.momentumStacks = Math.min(10, (mon.momentumStacks ?? 0) + 1);
      }
      // Reset per-wave flags
      mon.resetPulseUsedThisWave = false;
      mon.turnsInBattle = 0;

      if (mon.battleHp > 0 && hasNurse) {
        mon.battleHp = mon.maxBattleHp;
      }
    });

    showPathSelect();
  });
  shopScreen.mount();
}

// ============================================================
// Path Select Screen — choose one of 3 nodes before each wave
// ============================================================

function showPathSelect(): void {
  if (!gameState) return;

  // Champion just defeated → show generation gate before any new path.
  if (gameState.pendingGenGate) {
    showGenerationGate();
    return;
  }

  // Inside an active arena gauntlet: skip path-select, run the next sub-step.
  if (gameState.arenaState) {
    runArenaStep();
    return;
  }

  // Generate options if not already present (e.g. after a load)
  if (!gameState.nodeOptions || gameState.nodeOptions.length === 0) {
    gameState.nodeOptions = generateNodeOptions(
      gameState.currentAct,
      gameState.actStep,
      gameState.badges?.length ?? 0,
      gameState.leagueStep ?? 0,
    );
  }
  gameState.phase = 'path_select';
  saveRun(gameState); // path-select is a stable resume point

  clearScreen();
  void Audio.playMusic('music.menu', { fadeMs: 700 });
  const div = createMountDiv('path-screen-mount');
  screenContainer.appendChild(div);

  pathSelectScreen = new PathSelectScreen(div, gameState, (node) => {
    if (!gameState) return;
    gameState.currentNode = node;
    // Combat nodes consume a step; rest/utility nodes do not.
    const consumesStep =
      node.kind === 'grass' || node.kind === 'trainer' || node.kind === 'gym' ||
      node.kind === 'elite_four' || node.kind === 'champion' || node.kind === 'forage';
    if (consumesStep) {
      gameState.actStep += 1;
      if (gameState.actStep >= 4) {
        gameState.actStep = 0;
        gameState.currentAct += 1;
      }
    }
    gameState.nodeOptions = [];

    // Arena entry → build the gauntlet, run the first sub-step.
    if (node.kind === 'gym' && node.arenaEntry) {
      const leader = getGymLeader(node.gymLeaderId ?? '');
      if (leader) {
        gameState.arenaState = buildArena(leader, gameState.currentAct);
        runArenaStep();
        return;
      }
    }

    if (node.kind === 'center') {
      showPokemonCenter();
    } else if (node.kind === 'mystery') {
      showMysteryEvent();
    } else if (node.kind === 'shop_mini') {
      showShopScreen(); // re-use main shop screen for now (lighter inventory rolled by wave-scaling)
    } else if (node.kind === 'forage') {
      showForageEvent();
    } else {
      // grass + trainer + gym + elite_four + champion → combat wave
      startNewWave();
    }
  });
  pathSelectScreen.mount();
}

// ============================================================
// Arena Gauntlet — multi-step gym sequence
// ============================================================

function runArenaStep(): void {
  if (!gameState?.arenaState) return;
  const a = gameState.arenaState;
  if (a.index >= a.steps.length) {
    // Safety: shouldn't happen — leader victory clears arenaState.
    gameState.arenaState = null;
    showPathSelect();
    return;
  }
  const step = a.steps[a.index];
  a.index += 1;
  gameState.currentNode = step;
  gameState.nodeOptions = [];
  if (step.kind === 'shop_mini') {
    showShopScreen();
  } else {
    // trainer / gym → combat wave (uses currentNode for theming + leader logic)
    startNewWave();
  }
}

// ============================================================
// Pokémon Center Node — heal step, no wave consumed
// ============================================================

function showPokemonCenter(): void {
  if (!gameState) return;
  clearScreen();
  void Audio.playMusic('music.menu', { fadeMs: 700 });
  const div = createMountDiv('center-screen-mount');
  screenContainer.appendChild(div);

  pokemonCenterScreen = new PokemonCenterScreen(div, gameState, (state) => {
    gameState = state;
    showPathSelect();
  });
  pokemonCenterScreen.mount();
}

// ============================================================
// Mystery Event Node — single tap-to-reveal, no wave consumed
// ============================================================

function showMysteryEvent(): void {
  if (!gameState) return;
  clearScreen();
  void Audio.playMusic('music.menu', { fadeMs: 700 });
  const div = createMountDiv('mystery-screen-mount');
  screenContainer.appendChild(div);

  mysteryEventScreen = new MysteryEventScreen(div, gameState, (state) => {
    gameState = state;
    showPathSelect();
  });
  mysteryEventScreen.mount();
}

// ============================================================
// Forage Node — quick item drop, no combat
// ============================================================

function showForageEvent(): void {
  if (!gameState) return;
  const consumables = ALL_ITEMS.filter(i => i.itemType === 'consumable' && i.rarity === 'common');
  const pick = consumables[Math.floor(Math.random() * consumables.length)];
  const existing = gameState.inventory.find(it => it.item.id === pick.id);
  if (existing) existing.quantity += 1;
  else gameState.inventory.push({ item: pick, quantity: 1 });

  // Lightweight overlay, then back to path select.
  const overlay = document.createElement('div');
  overlay.className = 'path-overlay';
  const slug = pick.pokeapiName;
  const iconHtml = slug
    ? `<div class="forage-sprite-wrap"><img src="${itemSprite(slug)}" alt="" class="forage-sprite" onerror="${imgErrorFallback(pick.icon ?? '🌿')}" /></div>`
    : `<div class="path-card-icon px-emoji" aria-hidden="true">${pick.icon ?? '🌿'}</div>`;
  overlay.innerHTML = `
    <div class="path-modal-card forage-modal">
      <div class="path-eyebrow">Forage</div>
      <h2 class="path-card-title">${pick.name}</h2>
      ${iconHtml}
      <p class="path-card-hint">${pick.description}</p>
      <button class="btn-primary forage-cta" type="button">Continue →</button>
    </div>
  `;
  document.body.appendChild(overlay);
  Audio.play('ui.coin');
  showToast(`Foraged: ${pick.name}!`, 'success');
  const close = () => { overlay.remove(); showPathSelect(); };
  overlay.querySelector<HTMLButtonElement>('.forage-cta')?.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
}

// ============================================================
// Generation Gate — post-Champion choice
// ============================================================

/**
 * Big "you earned a badge" overlay — shown after a gym leader victory.
 * Pulls the actual PokeAPI badge sprite (item slug) so the moment feels real.
 */
function showBadgeAward(badge: import('./data/badges').Badge, leaderName: string): void {
  const sprite = badgeSprite(badge.id);
  const overlay = document.createElement('div');
  overlay.className = 'badge-award-overlay';
  overlay.innerHTML = `
    <div class="badge-award-card" style="--badge-accent:${badge.color}">
      <div class="badge-award-eyebrow">— Badge unlocked · ${leaderName} defeated —</div>
      <h2 class="badge-award-title">${badge.name}</h2>
      <div class="badge-award-art">
        ${sprite
          ? `<img src="${sprite}" alt="${badge.name}" class="badge-award-sprite"
                  onerror="${imgErrorFallback(badge.icon)}" />`
          : `<span class="badge-award-fallback px-emoji">${badge.icon}</span>`}
        <span class="badge-award-burst"></span>
      </div>
      <p class="badge-award-perk"><b>Passive:</b> ${badge.perk.description}</p>
      <button class="ink-btn primary badge-award-cta" type="button">Continue →</button>
    </div>
  `;
  document.body.appendChild(overlay);
  Audio.play('ui.coin');
  const close = () => { overlay.classList.add('closing'); setTimeout(() => overlay.remove(), 220); };
  overlay.querySelector<HTMLButtonElement>('.badge-award-cta')?.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  // Auto-close fallback in case the player walks away
  setTimeout(() => { if (overlay.isConnected) close(); }, 8000);
}

function showGenerationGate(): void {
  if (!gameState) return;
  gameState.pendingGenGate = false;

  const overlay = document.createElement('div');
  overlay.className = 'path-overlay gen-gate-overlay';
  overlay.innerHTML = `
    <div class="path-modal-card gen-gate">
      <div class="path-eyebrow">— Champion defeated · The path forks —</div>
      <h2 class="gen-gate-title">Where to <em>next</em>?</h2>
      <p class="gen-gate-sub">You stand atop the Indigo Plateau. A new generation calls — or you press deeper into Endless.</p>
      <div class="gen-gate-cards">
        <button class="path-card gen-gate-card has-sprite" data-gen="gen2" type="button" style="--card-accent:#6c8a3a">
          <span class="path-card-corner tl"></span><span class="path-card-corner tr"></span>
          <span class="path-card-corner bl"></span><span class="path-card-corner br"></span>
          <div class="path-card-eyebrow">New Generation</div>
          <div class="path-card-portrait">
            <img src="${pokemonSprite(249)}" alt="" class="path-card-sprite" onerror="${imgErrorFallback('🌳')}" />
          </div>
          <h3 class="path-card-title">Johto · Gen 2</h3>
          <p class="path-card-hint">Reset acts, badges fade — but Pokémon roster expands to Gen 1+2 (IDs 1–251).</p>
          <div class="path-card-foot"><span class="path-card-tag">Continue</span><span class="path-card-cta">Choose →</span></div>
        </button>
        <button class="path-card gen-gate-card has-sprite" data-gen="endless" type="button" style="--card-accent:#7a3f8a">
          <span class="path-card-corner tl"></span><span class="path-card-corner tr"></span>
          <span class="path-card-corner bl"></span><span class="path-card-corner br"></span>
          <div class="path-card-eyebrow">Press On</div>
          <div class="path-card-portrait">
            <img src="${pokemonSprite(151)}" alt="" class="path-card-sprite" onerror="${imgErrorFallback('♾')}" />
          </div>
          <h3 class="path-card-title">Endless Mode</h3>
          <p class="path-card-hint">Keep your team, badges, items — waves keep scaling. No new gens, just glory.</p>
          <div class="path-card-foot"><span class="path-card-tag">Endless</span><span class="path-card-cta">Choose →</span></div>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelectorAll<HTMLButtonElement>('[data-gen]').forEach(btn => {
    btn.addEventListener('click', () => {
      const gen = btn.dataset['gen'] as 'gen2' | 'endless';
      if (!gameState) return;
      Audio.play('ui.confirm');
      if (gen === 'gen2') {
        gameState.generation = 'gen2';
        // Reset run-graph for the second tour but keep team/items/badges visible as legacy
        gameState.currentAct = 1;
        gameState.actStep = 0;
        gameState.leagueStep = 0;
        // Badges array kept as historical record; passive perks remain in activePerks.
        showToast('Welcome to Johto.', 'success');
      } else {
        gameState.generation = 'endless';
        gameState.leagueStep = 5; // skip generator's league branch
        showToast('Endless mode engaged.', 'success');
      }
      gameState.nodeOptions = [];
      overlay.remove();
      showPathSelect();
    });
  });
}

// ============================================================
// Game Over
// ============================================================

function showGameOver(): void {
  if (!gameState) return;
  clearRun(); // run is over — drop the save so StartScreen offers a fresh start
  clearScreen();
  void Audio.playMusic('music.defeat', { fadeMs: 400, loop: false, volume: 0.95 });

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
      const gs = gameState;
      showLeaderboard(() => {
        clearScreen();
        showGameOver();
      }, gs?.runStats.wavesCleared, gs?.playerName);
    }
  );
  gameOverScreen.mount();
}

// ============================================================
// Leaderboard
// ============================================================

function showLeaderboard(onBack: () => void, playerScore?: number, playerName?: string): void {
  clearScreen();
  const div = createMountDiv('lb-screen-mount');
  screenContainer.appendChild(div);

  leaderboardScreen = new LeaderboardScreen(div, onBack, playerScore, playerName);
  leaderboardScreen.mount();
}

// ============================================================
// Mobile detection — sets body.is-mobile + viewport CSS vars.
// Re-evaluates on resize / orientation change / pointer change.
// ============================================================

function installMobileDetection(): void {
  const update = () => {
    const isMobile =
      window.matchMedia('(max-width: 760px)').matches
      || window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    document.body.classList.toggle('is-mobile', isMobile);
    document.body.classList.toggle('is-desktop', !isMobile);
    // Stable viewport height var (avoids iOS URL-bar jump)
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    document.documentElement.style.setProperty('--app-vh', `${window.innerHeight}px`);
  };
  update();
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', update);
  window.matchMedia('(max-width: 760px)').addEventListener?.('change', update);
}

/**
 * Global error boundary — catches uncaught errors and unhandled promise
 * rejections. Shows a non-blocking toast for minor issues, full-screen
 * recovery panel for fatal ones (loops, infinite renders, etc).
 */
function installErrorBoundary(): void {
  let panelShown = false;
  const showFatalPanel = (msg: string) => {
    if (panelShown) return;
    panelShown = true;
    const panel = document.createElement('div');
    panel.className = 'error-boundary';
    panel.innerHTML = `
      <div class="error-boundary-card">
        <div class="error-boundary-eyebrow">Oh no — something broke</div>
        <h2 class="error-boundary-title">A wild <em>error</em> appeared</h2>
        <pre class="error-boundary-msg"></pre>
        <div class="error-boundary-actions">
          <button class="ink-btn ghost" id="eb-reload">Reload page</button>
          <button class="ink-btn primary" id="eb-reset">Reset save &amp; reload</button>
        </div>
        <div class="error-boundary-foot">If this keeps happening, please report it on GitHub.</div>
      </div>
    `;
    const pre = panel.querySelector<HTMLElement>('.error-boundary-msg');
    if (pre) pre.textContent = msg.slice(0, 600);
    document.body.appendChild(panel);
    panel.querySelector<HTMLButtonElement>('#eb-reload')?.addEventListener('click', () => {
      window.location.reload();
    });
    panel.querySelector<HTMLButtonElement>('#eb-reset')?.addEventListener('click', () => {
      try { localStorage.removeItem('pokerun:save:v1'); } catch { /* ignore */ }
      window.location.reload();
    });
  };

  window.addEventListener('error', (e) => {
    console.error('[error-boundary]', e.error ?? e.message);
    showFatalPanel(e.message || String(e.error));
  });
  window.addEventListener('unhandledrejection', (e) => {
    console.error('[error-boundary] unhandledrejection', e.reason);
    showFatalPanel(String(e.reason?.message ?? e.reason));
  });
}

// ============================================================
// Start the game
// ============================================================

boot().catch(console.error);
