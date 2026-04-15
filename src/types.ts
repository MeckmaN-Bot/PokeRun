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
}

export interface Item {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  itemType: 'held' | 'consumable';
  effect: ItemEffect;
  icon: string;
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
  heldItem: Item | null;
  sprite: string;
  animatedSprite: string;
  isFullyEvolved: boolean;
  bst: number;
  abilities: string[];
  evolutionChainId: number;
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
