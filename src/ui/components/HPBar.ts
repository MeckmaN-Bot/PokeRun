export function renderHPBar(
  currentHp: number,
  maxHp: number,
  id: string,
  showLabel = true
): string {
  const pct = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
  const colorClass = pct > 50 ? 'hp-high' : pct > 25 ? 'hp-mid' : 'hp-low';

  return `
    <div class="hp-bar-container">
      ${showLabel ? `<span class="hp-label" id="${id}-label">${Math.max(0, currentHp)}/${maxHp}</span>` : ''}
      <div class="hp-bar-track">
        <div class="hp-bar-fill ${colorClass}" id="${id}-fill" style="width:${pct}%"></div>
      </div>
    </div>
  `;
}
