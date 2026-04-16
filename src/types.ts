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
  | 'wave_intro'
  | 'battle'
  | 'reward'
  | 'shop'
  | 'gameover'
  | 'leaderboard';

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
}

export interface Item {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  itemType: 'held' | 'consumable';
  effect: ItemEffect;
  icon: string;
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
}

export interface Perk {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  effect: PerkEffect;
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
  /** Pokédex ID of the next evolution form, or null if fully evolved / evolves by other means. */
  nextEvolutionId: number | null;
  /** Minimum level at which this Pokémon evolves, or null if not level-based. */
  evolutionLevel: number | null;
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
}

// ============================================================
// Game State
// ============================================================

export interface InventoryItem {
  item: Item;
  quantity: number;
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

export interface GameState {
  phase: GamePhase;
  playerName: string;
  wave: number;
  coins: number;
  team: BattlePokemon[];
  inventory: InventoryItem[];
  activePerks: Perk[];
  battleState: BattleState | null;
  pendingRewards: Reward[];
  shopItems: ShopItem[];
  runStats: RunStats;
  godModeAvailable: boolean;
  zMovesAvailable: number;
  /** Active team-wide reward items (displayed in shop Team Rewards panel). */
  teamRewards: InventoryItem[];
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
}
