// ============================================================
// Core Type Definitions for Pokémon Gauntlet
// ============================================================

export type PokemonType =
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

export type MoveCategory = 'physical' | 'special' | 'status';

export type StatusEffect = 'burn' | 'poison' | 'badPoison' | 'paralysis' | 'sleep' | 'freeze' | 'confusion';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type GamePhase =
  | 'loading'
  | 'start'
  | 'path_select'
  | 'wave_intro'
  | 'battle'
  | 'reward'
  | 'catch'
  | 'shop'
  | 'gameover'
  | 'leaderboard';

/**
 * Run-graph node kinds — Phase A only emits `grass` (existing wave). Other
 * kinds are stubs for Phase B+ (trainer NPCs, healing, mystery, gyms).
 */
export type NodeKind =
  | 'grass'
  | 'trainer'
  | 'center'
  | 'shop_mini'
  | 'mystery'
  | 'forage'
  | 'gym'
  | 'elite_four'
  | 'champion';

export interface NodeInstance {
  kind: NodeKind;
  title: string;
  eyebrow: string;
  hint: string;
  /** Single emoji or short glyph; pixelated via SVG filter at render time. */
  icon: string;
  /** Optional accent colour for the card frame (hex). */
  accent?: string;
  /** Trainer archetype id when kind === 'trainer'. */
  trainerArchetypeId?: string;
  /** Trainer-sprite URL (PokeAPI) when kind === 'trainer'. */
  spriteUrl?: string;
  /** Mystery sub-flavour id when kind === 'mystery'. */
  mysteryFlavourId?: string;
  /** Gym leader id when kind === 'gym'. */
  gymLeaderId?: string;
  /** Elite Four step id when kind === 'elite_four' or 'champion'. */
  eliteId?: string;
  /** Habitat-bias type for grass nodes (single type bias from sub-choice). */
  habitatBias?: PokemonType;
  /** Marks the act-3 gym card as the entry to a multi-step arena gauntlet. */
  arenaEntry?: boolean;
  /** Arena sub-step rank label ("Junior", "Senior", "Restock", "Leader"). */
  arenaRank?: string;
  /** Cap the trainer team size for this node — used by early-act onboarding. */
  teamSizeOverride?: number;
}

export interface ArenaState {
  /** Gym leader id whose arena this is (matches gymLeaders.ts). */
  gymId: string;
  /** Pre-built sequence of sub-nodes (trainer → shop → trainer → leader). */
  steps: NodeInstance[];
  /** Index of the next step to execute. */
  index: number;
}

export type Generation = 'gen1' | 'gen2' | 'endless';

export type RewardType = 'pokemon' | 'perk' | 'item';

// ============================================================
// Stats
// ============================================================

export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  spAtk: number;
  spDef: number;
  speed: number;
}

export interface StatStages {
  attack: number;
  defense: number;
  spAtk: number;
  spDef: number;
  speed: number;
  accuracy: number;
  evasion: number;
}

// ============================================================
// Moves
// ============================================================

export interface Move {
  id: number;
  name: string;
  displayName: string;
  type: PokemonType;
  category: MoveCategory;
  power: number;
  accuracy: number;
  pp: number;
  maxPp: number;
  effect: string;
  effectChance: number;
  priority: number;
  isContact: boolean;
  isSoundBased: boolean;
  isPowder: boolean;
  isTwoTurn: boolean;
  target: string;
}

// ============================================================
// Item Slots
// ============================================================

export interface ItemSlot {
  unlocked: boolean;
  item: Item | null;
}

/** Costs (in coins) to unlock each slot (index 0 = slot 1 which is free). */
export const SLOT_UNLOCK_COSTS: number[] = [0, 50, 100, 200, 400];

/** Creates a default set of 5 item slots (slot 1 unlocked, rest locked). */
export function defaultItemSlots(): ItemSlot[] {
  return [
    { unlocked: true, item: null },
    { unlocked: false, item: null },
    { unlocked: false, item: null },
    { unlocked: false, item: null },
    { unlocked: false, item: null },
  ];
}

// ============================================================
// Items
// ============================================================

export interface ItemEffect {
  trigger: 'passive' | 'on_hit_taken' | 'end_of_turn' | 'on_attack' | 'on_status' | 'once_per_battle' | 'manual';
  hpThreshold?: number;
  healAmount?: number;
  healPercent?: number;
  statBoost?: Partial<BaseStats>;
  damagePercent?: number;
  damageReflectPercent?: number;
  curesStatus?: StatusEffect | 'any';
  preventStatus?: StatusEffect | 'any';
  typePowerBoost?: { type: PokemonType; multiplier: number };
  critBoost?: number;
  accuracyBoost?: number;
  coinMultiplier?: number;
  flinchChance?: number;
  surviveKO?: boolean;
  immuneGround?: boolean;
  statOnHit?: { condition: string; stat: keyof BaseStats; stages: number };
  speedBoost?: number;
  lockToFirstMove?: boolean;
  damageMultiplier?: number;
  costHpPercent?: number;
  regenPercent?: number;
  evasionBoost?: number;
  // New fields
  /** Life Orb v2: costs % of CURRENT HP per attack instead of max HP */
  currentHpCostPercent?: number;
  /** Life Orb v2: no self-damage when below this HP ratio */
  noSelfDamageBelowHpPct?: number;
  /** Rocky Helmet v2: chance to paralyze contact attackers */
  paralysisOnContact?: number;
  /** Flame/Toxic Orb: inflict this status on self at battle start */
  selfInflictStatus?: StatusEffect;
  /** Flame Orb: +50% Atk when statused (Guts) */
  gutsEffect?: boolean;
  /** Toxic Orb: heal instead of taking poison damage (Poison Heal) */
  poisonHealEffect?: boolean;
  /** Leech Seed: drain this % of enemy max HP per turn, heal self */
  drainPercent?: number;
  /** Revive Heart: revive once per run with this % HP, then destroy */
  reviveOncePercent?: number;
  /** Shell Bell v2: minimum heal per hit */
  minHealAmount?: number;
  /** Poké Bandage: % HP healed after each wave */
  waveRegen?: number;
  /** Oran Berry: recharges each wave */
  rechargesEveryWave?: boolean;
  /** Sitrus Berry: recharges after this many waves */
  rechargesAfterWaves?: number;
  /** Focus Sash v2: destroy item at end of wave after triggering */
  waveEndDestroy?: boolean;
  /** Protein/Iron/Carbos: permanent % stat boost */
  permanentStatBoost?: Partial<BaseStats>;
  /** Planet Card: +1 level for this type's moves this run. */
  planetCardType?: PokemonType;
  /** Quick Powder: +25% Speed but only on first turn of battle. */
  firstTurnSpeedBoost?: number;
  /** Type Lens: secondary type also gets STAB. */
  dualStab?: boolean;
  /** Reset Pulse: clear enemy stat stages on switch-in (once per wave). */
  resetPulse?: boolean;
  /** Tag-Team Bell: when KO'd, next ally heals to full and gets +1 Atk. */
  tagTeamRevive?: boolean;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  itemType: 'held' | 'consumable';
  effect: ItemEffect;
  icon: string;
  sprite?: string;
  /** PokeAPI item name (e.g. "choice-band") — used to load official sprites. */
  pokeapiName?: string;
  /** If true, this item only appears in post-wave card rewards, never in the shop. */
  rewardOnly?: boolean;
}

// ============================================================
// Perks
// ============================================================

export interface PerkEffect {
  statMultiplier?: Partial<Record<keyof BaseStats, number>>;
  stabMultiplier?: number;
  typeBoost?: { type: PokemonType; multiplier: number };
  allDamageMultiplier?: number;
  speedMultiplier?: number;
  defenseMultiplier?: number;
  spDefMultiplier?: number;
  accuracyBonus?: number;
  coinMultiplier?: number;
  critBoost?: number;
  berryTriggerTwice?: boolean;
  monoTypeBonus?: { minCount: number; multiplier: number };
  lastPokemonBoost?: number;
  weatherBonus?: string;
  dualTypeBonus?: number;
  fullyEvolvedBonus?: number;
  notFullyEvolvedBonus?: { def: number; spDef: number };
  speedDamageBonus?: number;
  lowestBSTAttackBonus?: number;
  typeCoverageBonus?: { minTypes: number; multiplier: number };
  regenPercent?: number;
  statusBonus?: string;
  onKOBoost?: { stages: number };
  deathsDoorMultiplier?: number;
  firstMoveCrit?: boolean;
  doubleHitChance?: number;
  focusSashAll?: boolean;
  chainKOBonus?: number;
  adaptability?: boolean;
  speedBoostPerTurn?: number;
  godModeRevive?: boolean;
  typeEraseAll?: boolean;
  randomStatDouble?: keyof BaseStats;
  allStatsMultiplier?: number;
  allMovePowerBonus?: number;
  /** Burn-cascade: chance to burn target with Fire moves. */
  fireBurnChance?: number;
  /** Master Ball Luck: extra reroll per shop. */
  extraReroll?: number;
  /** Type Mastery: extra type level when 2+ teammates share primary type. */
  typeMasteryBonus?: number;
  /** Backline Burner: damage bonus for Pokémon in slots 4-5. */
  backlineDamageBonus?: number;
  /** Pivot Tactics: stat-stage boost on switch-in. */
  pivotBoost?: { atk: number; speed: number; turns: number };
  /** Status Stacker: status-damage and status-accuracy bonus. */
  statusStacker?: { damageMult: number; accuracyMult: number };
  /** Item Maven: per-held-item stat % bonus. */
  itemMaven?: number;
}

export interface Perk {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  effect: PerkEffect;
  icon?: string;
}

// ============================================================
// Pokemon
// ============================================================

export interface Pokemon {
  id: number;
  name: string;
  displayName: string;
  types: PokemonType[];
  baseStats: BaseStats;
  level: number;
  moves: Move[];
  /** Legacy single-slot alias (= itemSlots[0].item). Keep for backwards compat with battle checks. */
  heldItem: Item | null;
  /** All 5 item slots. Slot 0 is always unlocked; others cost coins. */
  itemSlots: ItemSlot[];
  sprite: string;
  animatedSprite: string;
  isFullyEvolved: boolean;
  bst: number;
  abilities: string[];
  evolutionChainId: number;
  /** Height in decimetres (PokeAPI native units). 1 dm = 0.1 m. Optional for legacy cache. */
  heightDm?: number;
  /** Pokédex ID of the next evolution form, or null if fully evolved / evolves by other means. */
  nextEvolutionId: number | null;
  /** Minimum level at which this Pokémon evolves, or null if not level-based. */
  evolutionLevel: number | null;
  /**
   * Move-learning pool — full level-up learnset for this species.
   * Pokémon learn moves from this pool as they level up.
   */
  learnsetPool?: LearnsetEntry[];
  /** IDs of moves already taught (so we don't re-teach the same one). */
  learnedMoveIds?: number[];
}

export interface LearnsetEntry {
  /** Move name as used by PokéAPI (e.g. 'flame-thrower'). */
  name: string;
  /** Level at which this move is learned in the official games. */
  level: number;
}

export interface BattlePokemon extends Pokemon {
  battleHp: number;
  maxBattleHp: number;
  effectiveStats: BaseStats;
  statStages: StatStages;
  battleStatus: StatusEffect | null;
  battleStatusTurns: number;
  poisonCounter: number;
  isConfused: boolean;
  confusionTurns: number;
  hasUsedFocusSash: boolean;
  choiceLockedMove: Move | null;
  hasUsedZMove: boolean;
  hasAirBalloon: boolean;
  twoTurnMove: Move | null;
  sleepTurns: number;
  /** Current XP towards the next level. */
  xp: number;
  /** XP required to reach the next level. */
  xpToNextLevel: number;
  /** True when a level-up triggered an evolution that hasn't happened yet. */
  pendingEvolution: boolean;
  /** IDs of once-per-battle berries consumed this wave (reset at wave end). */
  usedBerries: string[];
  /** Wave number when Sitrus Berry was last consumed (for 3-wave recharge). */
  sitrusBerryLastUsedWave: number;
  /** Focus Sash triggered this wave — destroy item at wave end. */
  focusSashBroken: boolean;
  /** Revive Heart has been used this run — destroy item at wave end. */
  reviveHeartUsed: boolean;
  /** Leech Seed is active (drains enemy each turn). */
  leechSeedActive: boolean;
  /** Momentum Badge stacks (gained per wave won). */
  momentumStacks: number;
  /** Elite enemy flag — has a held item, drops double coins. */
  isElite?: boolean;
  /** Turns this Pokémon has been active in the current battle. */
  turnsInBattle?: number;
  /** Reset Pulse: tracked usage per wave. */
  resetPulseUsedThisWave?: boolean;
  /** Waves remaining until a fainted mon stored in the PC auto-revives. */
  pcReviveCountdown?: number;
}

// ============================================================
// Game State
// ============================================================

export interface InventoryItem {
  item: Item;
  quantity: number;
}

export interface ShopPack {
  packId: import('./data/boosterPacks').PackId;
  price: number;
  sold: boolean;
  free?: boolean;
}

export interface ShopVoucher {
  voucherId: import('./data/vouchers').VoucherId;
  price: number;
  sold: boolean;
}

export interface RunStats {
  wavesCleared: number;
  totalKOs: number;
  itemsCollected: number;
  perksCollected: number;
  starterName: string;
  starterId: number;
  totalDamageDealt: number;
  chainKOCount: number;
}

export const MAX_TEAM_SIZE = 5;

export type TrainerGender = 'male' | 'female';

export interface GameState {
  phase: GamePhase;
  playerName: string;
  trainerGender: TrainerGender;
  wave: number;
  coins: number;
  team: BattlePokemon[];
  /** Pokémon stored in the PC box (not in active battle team). */
  pc: BattlePokemon[];
  /** Pokémon awaiting the catch mini-game. */
  pendingCatch: Pokemon | null;
  inventory: InventoryItem[];
  activePerks: Perk[];
  battleState: BattleState | null;
  pendingRewards: Reward[];
  shopItems: ShopItem[];
  shopPacks: ShopPack[];
  shopVouchers: ShopVoucher[];
  /** Whether this shop's first reroll has been used (Reroll Surplus). */
  freeRerollUsed?: boolean;
  /** Free rerolls remaining in this shop (granted by perks like Master Ball Luck). */
  freeRerollsLeft?: number;
  runStats: RunStats;
  godModeAvailable: boolean;
  zMovesAvailable: number;
  /** Active team-wide reward items (displayed in shop Team Rewards panel). */
  teamRewards: InventoryItem[];
  /** Wave number of the next boss encounter (randomised each run). */
  nextBossWave: number;
  /** Owned vouchers (permanent run-upgrades). */
  vouchers: import('./data/vouchers').VoucherId[];
  /** Pre-battle wave tag for the current wave (consumed at battle end). */
  pendingWaveTag: import('./data/tags').WaveTagId | null;
  /** Tags queued for future waves (from skip-rewards). */
  queuedTags: import('./data/tags').WaveTagId[];
  /** Investment-tag accumulated coins (paid on next boss clear). */
  investmentCoins: number;
  /** Type level per Pokémon type (from Planet Cards). */
  typeLevels: Partial<Record<PokemonType, number>>;
  /** Wave coins earned to date — used for leaderboard calc. */
  totalCoinsEarned: number;
  /** Boss-Tag pending — next boss wave grants +1 reward card. */
  pendingBossTagBonus?: boolean;
  /** Charm-Tag pending — next shop grants a free Mega pack. */
  pendingCharmPack?: boolean;
  /** Voucher-Tag pending — next shop guarantees a voucher slot. */
  pendingVoucherSlot?: boolean;
  /** Rare-Tag marker for the upcoming reward pick. */
  pendingRareFloor?: boolean;
  /** Shops without healing in a row (pity counter). */
  shopsWithoutHealing?: number;
  /** Shops without an epic in a row (pity counter). */
  shopsWithoutEpic?: number;
  /** Last paid price per item id (for sell-value floor). */
  lastPaidPrices?: Record<string, number>;
  /** Run-graph: current act (1..8 for Gen 1) and step inside the act. */
  currentAct: number;
  actStep: number;
  /** Three node options shown on the path-select screen. */
  nodeOptions: NodeInstance[];
  /** The node the player chose for the upcoming encounter, or null. */
  currentNode: NodeInstance | null;
  /** Earned gym badges (Gen 1+). */
  badges: string[];
  /** Active generation/track. */
  generation: Generation;
  /** League progress 0–5 (0 = not started; 1–4 = E4 step; 5 = champion done). */
  leagueStep?: number;
  /** Pending generation-gate prompt after the champion is defeated. */
  pendingGenGate?: boolean;
  /** Active arena gauntlet (multi-step gym sequence), or null if not in one. */
  arenaState?: ArenaState | null;
}

// ============================================================
// Battle State
// ============================================================

export interface BattleState {
  playerTeam: BattlePokemon[];
  enemyTeam: BattlePokemon[];
  activePlayerIndex: number;
  activeEnemyIndex: number;
  turn: number;
  log: BattleLogEntry[];
  phase: 'selecting' | 'animating' | 'enemy_turn' | 'end_of_turn' | 'finished';
  autoBattle: boolean;
  isBossWave: boolean;
  winner: 'player' | 'enemy' | null;
  pendingDamage: PendingDamage | null;
  /** Boss-Blind modifier active this battle (only on boss waves). */
  bossBlind: import('./data/bossBlinds').BossBlindId | null;
  /** Track "first attack zero" for The Ox. */
  hasUsedFirstAttack: boolean;
  /** Track which moves have been used (for The Eye). */
  usedMoveIds: number[];
  /** Track enemies that already triggered The Tooth heal. */
  toothHealedEnemies: number[];
  /** Turn counter for The Hook item-drop. */
  hookTurnCount: number;
  /** Active wave-tag this battle. */
  waveTag: import('./data/tags').WaveTagId | null;
  /** Turn count at start (for Speed Tag). */
  turnsUsed: number;
}

export interface BattleLogEntry {
  text: string;
  type: 'normal' | 'damage' | 'super_effective' | 'not_effective' | 'immune' | 'critical' | 'heal' | 'status' | 'weather' | 'system';
}

export interface PendingDamage {
  targetIsPlayer: boolean;
  damage: number;
  effectiveness: number;
  isCritical: boolean;
  moveType: PokemonType;
}

export interface DamageResult {
  damage: number;
  effectiveness: number;
  isCritical: boolean;
  isImmune: boolean;
}

// ============================================================
// Rewards
// ============================================================

export interface PokemonReward {
  type: 'pokemon';
  rarity: Rarity;
  pokemon: Pokemon;
}

export interface PerkReward {
  type: 'perk';
  rarity: Rarity;
  perk: Perk;
}

export interface ItemReward {
  type: 'item';
  rarity: Rarity;
  item: Item;
}

export type Reward = PokemonReward | PerkReward | ItemReward;

// ============================================================
// Shop
// ============================================================

export interface ShopItem {
  item: Item;
  price: number;
  sold: boolean;
}

// ============================================================
// PokéAPI Response Types
// ============================================================

export interface PokeAPISprite {
  front_default: string | null;
  front_shiny: string | null;
  versions?: {
    'generation-v'?: {
      'black-white'?: {
        animated?: {
          front_default: string | null;
        };
      };
    };
  };
}

export interface PokeAPIStat {
  base_stat: number;
  stat: { name: string };
}

export interface PokeAPIType {
  slot: number;
  type: { name: string };
}

export interface PokeAPIMove {
  move: { name: string; url: string };
  version_group_details: Array<{
    level_learned_at: number;
    move_learn_method: { name: string };
  }>;
}

export interface PokeAPIAbility {
  ability: { name: string };
  is_hidden: boolean;
}

export interface PokeAPIResponse {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: PokeAPISprite;
  stats: PokeAPIStat[];
  types: PokeAPIType[];
  moves: PokeAPIMove[];
  abilities: PokeAPIAbility[];
  base_experience: number;
  is_default: boolean;
}

export interface PokeAPIMoveResponse {
  id: number;
  name: string;
  type: { name: string };
  damage_class: { name: string };
  power: number | null;
  accuracy: number | null;
  pp: number;
  effect_entries: Array<{
    effect: string;
    short_effect: string;
    language: { name: string };
  }>;
  effect_chance: number | null;
  priority: number;
  meta: {
    ailment: { name: string };
    ailment_chance: number;
    flinch_chance: number;
    drain: number;
    healing: number;
  } | null;
  flags: { [key: string]: boolean };
  target: { name: string };
}

// ============================================================
// Leaderboard
// ============================================================

export interface LeaderboardEntry {
  id?: string;
  name: string;
  score_waves: number;
  score_details: {
    starterName: string;
    totalKOs: number;
    itemsCollected: number;
    perksCollected: number;
    totalDamageDealt: number;
  };
  created_at?: string;
}

// ============================================================
// Wave Config
// ============================================================

export interface WaveConfig {
  enemyCount: number;
  levelMin: number;
  levelMax: number;
  isBossWave: boolean;
  enemyPool: number[];
  bossPool: number[];
  coinReward: number;
  /** Multiplier applied to enemy effective Atk/SpAtk and max HP for late-game threat scaling. */
  threatMultiplier: number;
}
