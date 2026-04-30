import type { PokemonType } from '../../types';
import { TYPE_COLORS } from '../../data/typeChart';

export function renderTypeBadge(type: PokemonType): string {
  const color = TYPE_COLORS[type] ?? '#888';
  return `<span class="type-badge" data-type="${type}">${type.toUpperCase()}</span>`;
}

export function renderTypeBadges(types: PokemonType[]): string {
  return types.map(renderTypeBadge).join('');
}
