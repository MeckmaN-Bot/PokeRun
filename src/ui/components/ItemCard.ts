import type { Item, Rarity } from '../../types';
import { getRarityClass } from '../../systems/rewards';

export function renderItemCard(
  item: Item,
  options: {
    showPrice?: number;
    sold?: boolean;
    selected?: boolean;
    onClick?: string;
  } = {}
): string {
  const { showPrice, sold = false, selected = false, onClick } = options;
  const rarityClass = getRarityClass(item.rarity);

  return `
    <div
      class="item-card ${rarityClass} ${sold ? 'sold' : ''} ${selected ? 'selected' : ''}"
      ${onClick ? `data-action="${onClick}" data-item-id="${item.id}"` : ''}
      role="button"
      tabindex="0"
    >
      <div class="item-card-icon">${item.icon}</div>
      <div class="item-card-content">
        <div class="item-card-name">${item.name}</div>
        <div class="item-card-type">${item.itemType === 'held' ? 'Held Item' : 'Consumable'}</div>
        <div class="item-card-rarity ${rarityClass}">${capitalize(item.rarity)}</div>
        <div class="item-card-desc">${item.description}</div>
      </div>
      ${showPrice !== undefined ? `
        <div class="item-card-price ${sold ? 'sold-label' : ''}">
          ${sold ? 'SOLD' : `<span class="coin-icon">🪙</span>${showPrice}`}
        </div>
      ` : ''}
    </div>
  `;
}

function capitalize(s: string): string {
  return s[0].toUpperCase() + s.slice(1);
}

export function renderRarityBadge(rarity: Rarity): string {
  const labels: Record<Rarity, string> = {
    common: 'Common',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
  };
  return `<span class="rarity-badge rarity-${rarity}">${labels[rarity]}</span>`;
}
