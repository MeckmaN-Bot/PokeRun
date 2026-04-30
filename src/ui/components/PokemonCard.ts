import type { BattlePokemon } from '../../types';
import { renderTypeBadges } from './TypeBadge';
import { renderHPBar } from './HPBar';

// ============================================================
// New split battle layout — info card and sprite separately
// ============================================================

/** Renders the info card (name, types, HP, XP bar for player, stage indicators, team bar slot). */
export function renderBattleInfoCard(
  pokemon: BattlePokemon,
  id: string,
  side: 'player' | 'enemy',
): string {
  const statusHtml = pokemon.battleStatus
    ? `<div class="bic-status-badge status-${pokemon.battleStatus}">${getStatusAbbr(pokemon.battleStatus)}</div>`
    : '';

  const stageIndicators = getStageIndicators(pokemon);

  const xpPct = side === 'player'
    ? Math.min(100, ((pokemon.xp ?? 0) / Math.max(1, pokemon.xpToNextLevel ?? 1)) * 100)
    : 0;
  const xpBarHtml = side === 'player'
    ? `<div class="battle-xp-bar"><div class="battle-xp-fill" id="${id}-xp-fill" style="width:${xpPct}%"></div></div>`
    : '';

  const typesHtml = pokemon.types.length
    ? `<div class="bic-types">${pokemon.types.map(t =>
        `<span class="bic-type type-${t}">${t.toUpperCase()}</span>`
      ).join('')}</div>`
    : '';

  const hpPct = Math.max(0, Math.min(100, (pokemon.battleHp / pokemon.maxBattleHp) * 100));
  const hpClass = hpPct > 50 ? 'hp-high' : hpPct > 25 ? 'hp-mid' : 'hp-low';

  const eliteBadge = pokemon.isElite
    ? `<span class="bic-elite" title="Elite — drops 2× coins">★ ELITE</span>`
    : '';

  return `
    <div class="battle-info-card ${side}-info${pokemon.isElite ? ' is-elite' : ''}" id="${id}-info-card">
      <div class="bic-header">
        <span class="bic-name">${pokemon.displayName}${eliteBadge}</span>
        <span class="bic-level">LV · ${pokemon.level}</span>
      </div>
      ${typesHtml}
      <div class="bic-hp-row">
        <div class="bic-hp-bar-track">
          <div class="bic-hp-fill ${hpClass}" id="${id}-hp-fill" style="width:${hpPct}%"></div>
        </div>
        <div class="bic-hp-num" id="${id}-hp-label">${Math.max(0, pokemon.battleHp)}/${pokemon.maxBattleHp}</div>
      </div>
      ${xpBarHtml}
      <div class="bic-bottom">
        ${statusHtml}
        ${stageIndicators}
      </div>
      <div class="battle-info-teambar" id="${id}-team-bar"></div>
    </div>
  `;
}

/** Renders just the sprite <img> tag. */
export function renderBattleSpriteImg(pokemon: BattlePokemon, id: string): string {
  return `
    <img
      id="${id}-sprite"
      class="battle-sprite"
      src="${pokemon.animatedSprite}"
      alt="${pokemon.displayName}"
      onerror="this.src='${pokemon.sprite}'"
    />
  `;
}

export function renderPokemonPortrait(pokemon: BattlePokemon, id: string, isActive = false): string {
  const hpPct = pokemon.battleHp / pokemon.maxBattleHp;
  const isFainted = pokemon.battleHp <= 0;
  const statusHtml = pokemon.battleStatus
    ? `<span class="status-badge status-${pokemon.battleStatus}">${pokemon.battleStatus.toUpperCase()}</span>`
    : '';
  const heldItemHtml = pokemon.heldItem
    ? `<span class="held-item-icon" title="${pokemon.heldItem.name}">${pokemon.heldItem.icon}</span>`
    : '';

  return `
    <div class="pokemon-portrait ${isActive ? 'active' : ''} ${isFainted ? 'fainted' : ''}" id="${id}">
      <img
        class="portrait-sprite"
        src="${pokemon.sprite}"
        alt="${pokemon.displayName}"
        loading="lazy"
        onerror="this.src='${pokemon.sprite}'"
      />
      <div class="portrait-info">
        <span class="portrait-name">${pokemon.displayName}</span>
        <span class="portrait-level">Lv.${pokemon.level}</span>
        ${statusHtml}
        ${heldItemHtml}
      </div>
      <div class="portrait-hp">
        ${renderHPBar(pokemon.battleHp, pokemon.maxBattleHp, `${id}-hp`, false)}
      </div>
    </div>
  `;
}

export function renderBattleSprite(
  pokemon: BattlePokemon,
  side: 'player' | 'enemy',
  id: string
): string {
  const isFainted = pokemon.battleHp <= 0;
  const statusHtml = pokemon.battleStatus
    ? `<div class="battle-status-badge status-${pokemon.battleStatus}">${getStatusAbbr(pokemon.battleStatus)}</div>`
    : '';

  // Stage indicators
  const stageIndicators = getStageIndicators(pokemon);

  return `
    <div class="battle-pokemon-wrapper ${side} ${isFainted ? 'fainted' : ''}" id="${id}-wrapper">
      <div class="battle-pokemon-info ${side}">
        <div class="battle-name-row">
          <span class="battle-pokemon-name">${pokemon.displayName}</span>
          <span class="battle-pokemon-level">Lv.${pokemon.level}</span>
          ${statusHtml}
        </div>
        ${renderHPBar(pokemon.battleHp, pokemon.maxBattleHp, `${id}-hp`, true)}
        ${side === 'player' ? `<div class="xp-bar-track"><div class="xp-bar-fill" style="width:${Math.min(100, pokemon.xpToNextLevel > 0 ? Math.floor((pokemon.xp / pokemon.xpToNextLevel) * 100) : 0)}%"></div></div>` : ''}
        ${stageIndicators}
      </div>
      <div class="battle-sprite-container" id="${id}-sprite-container">
        <img
          id="${id}-sprite"
          class="battle-sprite"
          src="${pokemon.animatedSprite}"
          alt="${pokemon.displayName}"
          onerror="this.src='${pokemon.sprite}'"
        />
      </div>
    </div>
  `;
}

function getStatusAbbr(status: string): string {
  const map: Record<string, string> = {
    burn: 'BRN', poison: 'PSN', badPoison: 'TOX', paralysis: 'PAR',
    sleep: 'SLP', freeze: 'FRZ', confusion: 'CNF',
  };
  return map[status] ?? '???';
}

function getStageIndicators(pokemon: BattlePokemon): string {
  const stages = pokemon.statStages;
  const indicators: string[] = [];

  const add = (key: string, label: string, value: number) => {
    if (value > 0) indicators.push(`<span class="stage-up">▲${label}+${value}</span>`);
    else if (value < 0) indicators.push(`<span class="stage-down">▼${label}${value}</span>`);
  };

  add('atk', 'ATK', stages.attack);
  add('def', 'DEF', stages.defense);
  add('spa', 'SPA', stages.spAtk);
  add('spd', 'SPD', stages.spDef);
  add('spe', 'SPE', stages.speed);

  return indicators.length
    ? `<div class="stage-indicators">${indicators.join('')}</div>`
    : '';
}

export function renderTeamBar(team: BattlePokemon[], activeIndex: number, side: 'player' | 'enemy'): string {
  return `
    <div class="team-bar ${side}">
      ${team.map((p, i) => `
        <div class="team-ball ${p.battleHp <= 0 ? 'fainted' : ''} ${i === activeIndex ? 'active' : ''}"
             title="${p.displayName} (${p.battleHp}/${p.maxBattleHp})">
        </div>
      `).join('')}
    </div>
  `;
}
