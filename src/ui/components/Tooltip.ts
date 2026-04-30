import type { Item } from '../../types';
import type { ActiveSynergy } from '../../systems/synergies';

let tooltipEl: HTMLElement | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

function getEl(): HTMLElement {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'game-tooltip';
    tooltipEl.style.display = 'none';
    tooltipEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(tooltipEl);
  }
  return tooltipEl;
}

function reposition(anchor: HTMLElement): void {
  const tt = getEl();
  // Measure after content set, position before showing
  tt.style.visibility = 'hidden';
  tt.style.display = 'block';

  const ar = anchor.getBoundingClientRect();
  const tw = tt.offsetWidth;
  const th = tt.offsetHeight;

  // Prefer above; flip below if not enough space
  let top = ar.top - th - 10;
  let left = ar.left + ar.width / 2 - tw / 2;

  if (top < 8) top = ar.bottom + 8;
  left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));

  tt.style.top  = `${top}px`;
  tt.style.left = `${left}px`;
  tt.style.visibility = '';
}

export function showTooltip(anchor: HTMLElement, html: string): void {
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  const tt = getEl();
  tt.innerHTML = html;
  reposition(anchor);
}

export function hideTooltip(delay = 80): void {
  hideTimer = setTimeout(() => {
    const tt = getEl();
    tt.style.display = 'none';
  }, delay);
}

// ── HTML Builders ────────────────────────────────────────────

const RARITY_COLORS: Record<string, string> = {
  common:    'var(--ink-3)',
  rare:      '#2272c3',
  epic:      '#6a26c8',
  legendary: '#c8920a',
};

export function buildItemTooltipHtml(item: Item): string {
  const color = RARITY_COLORS[item.rarity] ?? 'var(--ink-3)';
  const typeLabel = item.itemType === 'held' ? 'HELD ITEM' : 'CONSUMABLE';
  return `
    <div class="tt-eyebrow" style="color:${color}">${item.rarity.toUpperCase()} · ${typeLabel}</div>
    <div class="tt-name">${item.name}</div>
    <div class="tt-desc">${item.description}</div>
  `;
}

export function buildSynergyTooltipHtml(syn: ActiveSynergy): string {
  return `
    <div class="tt-syn-row">
      <span class="tt-syn-icon">${syn.icon}</span>
      <span class="tt-name">${syn.name}</span>
      <span class="tt-mult">×${syn.multiplier.toFixed(2)}</span>
    </div>
    <div class="tt-desc">${syn.description}</div>
  `;
}

// ── Delegation helper ─────────────────────────────────────────
// Attach to a container element; uses data-tooltip-item-id and data-synergy-id.
// Provide an itemLookup fn + synergies array at call time.

export function attachTooltipDelegation(
  container: HTMLElement,
  itemLookup: (id: string) => Item | undefined,
  getSynergies: () => ActiveSynergy[],
): void {
  container.addEventListener('mouseover', (e) => {
    const target = e.target as HTMLElement;
    const itemEl = target.closest<HTMLElement>('[data-tooltip-item-id]');
    if (itemEl) {
      const item = itemLookup(itemEl.dataset['tooltipItemId'] ?? '');
      if (item) showTooltip(itemEl, buildItemTooltipHtml(item));
      return;
    }
    const synEl = target.closest<HTMLElement>('[data-synergy-id]');
    if (synEl) {
      const syn = getSynergies().find(s => s.id === synEl.dataset['synergyId']);
      if (syn) showTooltip(synEl, buildSynergyTooltipHtml(syn));
    }
  });

  container.addEventListener('mouseout', (e) => {
    const to = e.relatedTarget as HTMLElement | null;
    if (!to?.closest('[data-tooltip-item-id],[data-synergy-id]')) {
      hideTooltip();
    }
  });

  // Mobile: tap-to-show, auto-dismiss
  container.addEventListener('touchstart', (e) => {
    const target = e.target as HTMLElement;
    const itemEl = target.closest<HTMLElement>('[data-tooltip-item-id]');
    if (itemEl) {
      const item = itemLookup(itemEl.dataset['tooltipItemId'] ?? '');
      if (item) { showTooltip(itemEl, buildItemTooltipHtml(item)); hideTooltip(1800); }
      return;
    }
    const synEl = target.closest<HTMLElement>('[data-synergy-id]');
    if (synEl) {
      const syn = getSynergies().find(s => s.id === synEl.dataset['synergyId']);
      if (syn) { showTooltip(synEl, buildSynergyTooltipHtml(syn)); hideTooltip(1800); }
    }
  }, { passive: true });
}
