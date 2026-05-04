import type { NodeInstance, NodeKind, PokemonType } from '../types';
import { pickRandomArchetype, trainerSpriteUrl } from './trainerArchetypes';
import { getGymForAct } from './gymLeaders';
import { getEliteByIndex } from './eliteFour';
import { itemSprite } from './sprites';

/**
 * Path-graph node generator.
 *
 * Acts are 4 steps long. Steps 1-3 roll from a weighted mix of
 * grass / trainer / center / mystery / mini-shop / forage. Step 4 of
 * each act is the gym leader (Brock → Giovanni). After 8 badges, the
 * graph collapses into the Pokémon League — sequential E4 + Champion.
 *
 * We always present three distinct kinds where possible to give the
 * player a meaningful choice — except on gym/league steps where the
 * single boss card occupies all three slots (cosmetic variants).
 */

interface KindWeight { kind: NodeKind; weight: number; }

function kindWeights(act: number, actStep: number): KindWeight[] {
  // Combat-heavy mix. Utility nodes are rare relief, not a parallel track.
  // ~75% combat / 25% utility on average; late-step nudges utility up slightly
  // so the player can stabilise before the gym at step 4.
  const lateStep = actStep >= 2;
  return [
    { kind: 'grass',     weight: act <= 1 ? 7 : 6 },
    { kind: 'trainer',   weight: act <= 1 ? 5 : 6 },
    { kind: 'center',    weight: lateStep ? 2 : 1 },
    { kind: 'mystery',   weight: 1 },
    { kind: 'shop_mini', weight: lateStep ? 2 : 1 },
    { kind: 'forage',    weight: 1 },
  ];
}

function pickKind(weights: KindWeight[], excluded: Set<NodeKind>): NodeKind {
  const filtered = weights.filter(w => !excluded.has(w.kind));
  const pool = filtered.length > 0 ? filtered : weights;
  const total = pool.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;
  for (const w of pool) {
    r -= w.weight;
    if (r <= 0) return w.kind;
  }
  return pool[0].kind;
}

const GRASS_FLAVORS: Array<Omit<NodeInstance, 'kind'> & { habitatBias?: PokemonType }> = [
  { title: 'Tall Grass',     eyebrow: 'Wild',   hint: 'Rustling leaves. Wild encounter, chance for items.',     icon: '◇', accent: '#5d8266', habitatBias: 'grass' },
  { title: 'Old Path',       eyebrow: 'Trail',  hint: 'Mixed terrain. Variable foes.',                          icon: '›', accent: '#9a7d3f' },
  { title: 'Wooded Edge',    eyebrow: 'Forest', hint: 'Cool shade — rarer drops, twitchy critters.',            icon: '◆', accent: '#4d6b3f', habitatBias: 'bug' },
  { title: 'Rocky Outcrop',  eyebrow: 'Cliffs', hint: 'Sharp footing favours rock & ground types.',             icon: '▲', accent: '#7a634a', habitatBias: 'rock' },
  { title: 'Riverside',      eyebrow: 'Banks',  hint: 'Cattails and ripples. Water types nearby.',              icon: '◇', accent: '#3a6c8a', habitatBias: 'water' },
  { title: 'Sunny Meadow',   eyebrow: 'Open',   hint: 'Wildflowers and bug song. Common pool, abundant loot.',  icon: '◉', accent: '#c08a2c', habitatBias: 'normal' },
];

const MYSTERY_FLAVORS: Array<Omit<NodeInstance, 'kind' | 'mysteryFlavourId'>> = [
  { title: 'Old Signpost',    eyebrow: 'Mystery',   hint: 'Half-buried, scratched. Worth a poke?',                  icon: '◇', accent: '#7a4f8a', spriteUrl: itemSprite('dusk-stone') },
  { title: 'Lost Satchel',    eyebrow: 'Mystery',   hint: 'Someone\'s travel gear, abandoned in the brush.',         icon: '◆', accent: '#7a4f8a', spriteUrl: itemSprite('poke-ball') },
  { title: 'Travelling NPC',  eyebrow: 'Encounter', hint: 'A weary stranger waves you down. Could go either way.',  icon: '◈', accent: '#7a4f8a', spriteUrl: itemSprite('tm-normal') },
];

const CENTER_FLAVORS: Array<Omit<NodeInstance, 'kind'>> = [
  { title: 'Pokémon Center', eyebrow: 'Rest',  hint: 'Nurse Joy waves you over. Heal up, regroup.',           icon: '✚',  accent: '#c43a3a', spriteUrl: itemSprite('super-potion') },
  { title: 'Forest Spring',  eyebrow: 'Rest',  hint: 'Cool water, rumored to mend even broken spirits.',      icon: '⛲', accent: '#c43a3a', spriteUrl: itemSprite('fresh-water') },
];

const SHOP_MINI_FLAVORS: Array<Omit<NodeInstance, 'kind'>> = [
  { title: 'Travelling Pedlar', eyebrow: 'Pop-up Shop', hint: 'Mules laden with curios — small but choice.',      icon: '◆', accent: '#c08a2c', spriteUrl: itemSprite('coin-case') },
  { title: 'Roadside Stall',    eyebrow: 'Pop-up Shop', hint: 'Half-set tent, prices already half-shouted.',      icon: '◉', accent: '#c08a2c', spriteUrl: itemSprite('great-ball') },
];

const FORAGE_FLAVORS: Array<Omit<NodeInstance, 'kind'>> = [
  { title: 'Berry Bush',       eyebrow: 'Forage', hint: 'Heavy with fruit. No fight — just leaves & loot.',       icon: '◇', accent: '#5a8a3a', spriteUrl: itemSprite('oran-berry') },
  { title: 'Mossy Stump',      eyebrow: 'Forage', hint: 'Look beneath. Mushrooms? Maybe a stray Pokéball.',        icon: '◇', accent: '#5a8a3a', spriteUrl: itemSprite('tiny-mushroom') },
];

function makeGrass(): NodeInstance {
  const f = GRASS_FLAVORS[Math.floor(Math.random() * GRASS_FLAVORS.length)];
  return { kind: 'grass', ...f };
}

function makeTrainer(act: number): NodeInstance {
  const arc = pickRandomArchetype(act);
  return {
    kind: 'trainer',
    title: arc.name, eyebrow: 'Trainer',
    hint: arc.flavour, icon: arc.icon, accent: arc.accent,
    trainerArchetypeId: arc.id,
    spriteUrl: arc.spriteSlug ? trainerSpriteUrl(arc.spriteSlug) : undefined,
  };
}

function makeCenter(): NodeInstance {
  const f = CENTER_FLAVORS[Math.floor(Math.random() * CENTER_FLAVORS.length)];
  return { kind: 'center', ...f };
}

function makeMystery(): NodeInstance {
  const f = MYSTERY_FLAVORS[Math.floor(Math.random() * MYSTERY_FLAVORS.length)];
  return { kind: 'mystery', mysteryFlavourId: 'random_v1', ...f };
}

function makeShopMini(): NodeInstance {
  const f = SHOP_MINI_FLAVORS[Math.floor(Math.random() * SHOP_MINI_FLAVORS.length)];
  return { kind: 'shop_mini', ...f };
}

function makeForage(): NodeInstance {
  const f = FORAGE_FLAVORS[Math.floor(Math.random() * FORAGE_FLAVORS.length)];
  return { kind: 'forage', ...f };
}

function makeNode(kind: NodeKind, act: number): NodeInstance {
  switch (kind) {
    case 'grass':     return makeGrass();
    case 'trainer':   return makeTrainer(act);
    case 'center':    return makeCenter();
    case 'mystery':   return makeMystery();
    case 'shop_mini': return makeShopMini();
    case 'forage':    return makeForage();
    default:          return makeGrass();
  }
}

/** Single gym card — entry point to the multi-step arena gauntlet. */
function makeGymOption(act: number): NodeInstance | null {
  const leader = getGymForAct(act);
  if (!leader) return null;
  return {
    kind: 'gym',
    title: `${leader.name}'s Arena`,
    eyebrow: `${leader.city} · Gym Arena`,
    hint: `Four-stop gauntlet: two trainers, a restock, then ${leader.name} for the badge.`,
    icon: leader.icon,
    accent: leader.accent,
    gymLeaderId: leader.id,
    spriteUrl: trainerSpriteUrl(leader.spriteSlug),
    arenaEntry: true,
  };
}

/** Single league card — sequential boss, no faux choice. */
function makeLeagueOption(leagueIdx: number): NodeInstance | null {
  const step = getEliteByIndex(leagueIdx);
  if (!step) return null;
  return {
    kind: step.isChampion ? 'champion' : 'elite_four',
    title: step.name,
    eyebrow: step.title,
    hint: step.flavour,
    icon: step.icon,
    accent: step.accent,
    eliteId: step.id,
    spriteUrl: trainerSpriteUrl(step.spriteSlug),
  };
}

/**
 * Generate three node options for the upcoming step.
 *
 * Special routing:
 *   - If badges >= 8 → league step (E4 idx 0..3, then Champion at 4).
 *   - Else if actStep === stagesPerAct - 1 → gym leader for this act.
 *     (Default stagesPerAct=4 → gym at step 3. Speedrunner deck overrides
 *     to stagesPerAct=3 → gym at step 2.)
 *   - Otherwise → normal weighted mix.
 */
export function generateNodeOptions(
  act: number,
  actStep: number,
  badgeCount: number = 0,
  leagueStep: number = 0,
  stagesPerAct: number = 4,
): NodeInstance[] {
  // League takes priority once unlocked. Single-option (no fake choice).
  if (badgeCount >= 8 && leagueStep < 5) {
    const opt = makeLeagueOption(leagueStep);
    if (opt) return [opt];
  }
  // Gym occupies the LAST step of the act (acts 1..8). Single card, no choice.
  if (actStep === stagesPerAct - 1 && act >= 1 && act <= 8) {
    const opt = makeGymOption(act);
    if (opt) return [opt];
  }

  const weights = kindWeights(act, actStep);
  const used = new Set<NodeKind>();
  const out: NodeInstance[] = [];
  for (let i = 0; i < 3; i++) {
    const kind = pickKind(weights, used);
    used.add(kind);
    out.push(makeNode(kind, act));
  }
  return out;
}
