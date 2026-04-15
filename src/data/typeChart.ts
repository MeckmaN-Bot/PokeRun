import type { PokemonType } from '../types';

// Full 18x18 type effectiveness chart
// typeChart[attackType][defenderType] = multiplier
// 0 = immune, 0.5 = not very effective, 1 = normal, 2 = super effective

const typeChart: Record<PokemonType, Partial<Record<PokemonType, number>>> = {
  normal: {
    rock: 0.5, steel: 0.5,
    ghost: 0,
  },
  fire: {
    fire: 0.5, water: 0.5, rock: 0.5, dragon: 0.5,
    grass: 2, ice: 2, bug: 2, steel: 2,
  },
  water: {
    water: 0.5, grass: 0.5, dragon: 0.5,
    fire: 2, ground: 2, rock: 2,
  },
  electric: {
    electric: 0.5, grass: 0.5, dragon: 0.5,
    ground: 0,
    water: 2, flying: 2,
  },
  grass: {
    fire: 0.5, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, dragon: 0.5, steel: 0.5,
    water: 2, ground: 2, rock: 2,
  },
  ice: {
    water: 0.5, ice: 0.5, steel: 0.5,
    grass: 2, ground: 2, flying: 2, dragon: 2,
  },
  fighting: {
    poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, fairy: 0.5,
    ghost: 0,
    normal: 2, ice: 2, rock: 2, dark: 2, steel: 2,
  },
  poison: {
    poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5,
    steel: 0,
    grass: 2, fairy: 2,
  },
  ground: {
    grass: 0.5, bug: 0.5,
    flying: 0,
    fire: 2, electric: 2, poison: 2, rock: 2, steel: 2,
  },
  flying: {
    electric: 0.5, rock: 0.5, steel: 0.5,
    grass: 2, fighting: 2, bug: 2,
  },
  psychic: {
    psychic: 0.5, steel: 0.5,
    dark: 0,
    fighting: 2, poison: 2,
  },
  bug: {
    fire: 0.5, fighting: 0.5, flying: 0.5, ghost: 0.5, steel: 0.5, fairy: 0.5,
    grass: 2, psychic: 2, dark: 2,
  },
  rock: {
    fighting: 0.5, ground: 0.5, steel: 0.5,
    fire: 2, ice: 2, flying: 2, bug: 2,
  },
  ghost: {
    dark: 0.5,
    normal: 0,
    ghost: 2, psychic: 2,
  },
  dragon: {
    steel: 0.5,
    fairy: 0,
    dragon: 2,
  },
  dark: {
    fighting: 0.5, dark: 0.5, fairy: 0.5,
    ghost: 2, psychic: 2,
  },
  steel: {
    fire: 0.5, water: 0.5, electric: 0.5, steel: 0.5,
    ice: 2, rock: 2, fairy: 2,
  },
  fairy: {
    fire: 0.5, poison: 0.5, steel: 0.5,
    fighting: 2, dragon: 2, dark: 2,
  },
};

export function getTypeEffectiveness(attackType: PokemonType, defenderTypes: PokemonType[]): number {
  let multiplier = 1;
  for (const defType of defenderTypes) {
    const chart = typeChart[attackType];
    const value = chart[defType];
    if (value !== undefined) {
      multiplier *= value;
    }
  }
  return multiplier;
}

export function getEffectivenessLabel(multiplier: number): string {
  if (multiplier === 0) return 'No effect!';
  if (multiplier < 1) return 'Not very effective...';
  if (multiplier > 1) return 'Super effective!';
  return '';
}

export const TYPE_COLORS: Record<PokemonType, string> = {
  normal:   '#A8A878',
  fire:     '#F08030',
  water:    '#6890F0',
  electric: '#F8D030',
  grass:    '#78C850',
  ice:      '#98D8D8',
  fighting: '#C03028',
  poison:   '#A040A0',
  ground:   '#E0C068',
  flying:   '#A890F0',
  psychic:  '#F85888',
  bug:      '#A8B820',
  rock:     '#B8A038',
  ghost:    '#705898',
  dragon:   '#7038F8',
  dark:     '#705848',
  steel:    '#B8B8D0',
  fairy:    '#EE99AC',
};
