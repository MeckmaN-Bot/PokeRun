import type { GameState, NodeInstance } from '../../types';
import { fadeIn } from '../animations';
import { Audio } from '../../audio/AudioManager';
import { BADGES, getBadge } from '../../data/badges';
import { badgeSprite, imgErrorFallback } from '../../data/sprites';
import { getGymForAct } from '../../data/gymLeaders';
import { trainerSpriteUrl } from '../../data/trainerArchetypes';
import { renderTypeBadge } from '../components/TypeBadge';
import { getBossBlindById, type BossBlindId } from '../../data/bossBlinds';
import { getEliteByIndex } from '../../data/eliteFour';

/**
 * Path-select screen — three thematic node cards. The player picks one;
 * Phase A skeleton: the chosen node simply runs the existing wave flow.
 *
 * Visual language matches the reward screen (paper card, ink border, hard
 * shadow, hand-drawn rotation) so it slots in without breaking layout.
 */
export class PathSelectScreen {
  private container: HTMLElement;
  private state: GameState;
  private onChoose: (node: NodeInstance) => void;

  constructor(
    container: HTMLElement,
    state: GameState,
    onChoose: (node: NodeInstance) => void,
  ) {
    this.container = container;
    this.state = state;
    this.onChoose = onChoose;
  }

  mount(): void {
    this.container.innerHTML = this.renderHTML();
    this.container.style.display = '';
    fadeIn(this.container);
    this.attachEvents();
  }

  unmount(): void {
    this.container.style.display = 'none';
    this.container.innerHTML = '';
  }

  private renderHTML(): string {
    const wave = this.state.wave;
    const act = this.state.currentAct;
    const step = this.state.actStep + 1; // 1-based for display
    const opts = this.state.nodeOptions;

    const isSingle = opts.length === 1;
    const card = (n: NodeInstance, i: number) => {
      // Single-card layouts (gym / league) sit centered, no rotation theatrics.
      const rot = isSingle ? '0' : i === 0 ? '-1.4' : i === 1 ? '0.6' : '-0.8';
      const accent = n.accent ?? '#3a3a3a';
      // Trainer cards use the PokeAPI sprite; fallback to emoji on load error.
      const iconHtml = n.spriteUrl
        ? `<div class="path-card-portrait" aria-hidden="true">
             <img src="${n.spriteUrl}" alt="" class="path-card-sprite"
                  onerror="this.parentElement.classList.add('sprite-failed');this.replaceWith(Object.assign(document.createElement('div'),{className:'path-card-icon px-emoji',textContent:'${n.icon}'}));" />
           </div>`
        : `<div class="path-card-icon px-emoji" aria-hidden="true">${n.icon}</div>`;
      return `
        <button class="path-card${n.spriteUrl ? ' has-sprite' : ''}" data-path-idx="${i}" type="button"
                style="--card-rot:${rot}deg;--card-accent:${accent}">
          <span class="path-card-corner tl" aria-hidden="true"></span>
          <span class="path-card-corner tr" aria-hidden="true"></span>
          <span class="path-card-corner bl" aria-hidden="true"></span>
          <span class="path-card-corner br" aria-hidden="true"></span>
          <div class="path-card-eyebrow">${n.eyebrow}</div>
          ${iconHtml}
          <h3 class="path-card-title">${n.title}</h3>
          <p class="path-card-hint">${n.hint}</p>
          <div class="path-card-foot">
            <span class="path-card-tag">${kindLabel(n.kind)}</span>
            <span class="path-card-cta">Take this path →</span>
          </div>
        </button>
      `;
    };

    const ownedBadges = new Set(this.state.badges ?? []);
    // Don't render an empty 8-pip row before the player has earned anything —
    // tilted gray placeholders read as "broken images" and add no info.
    // Render the strip only once at least one badge is owned, and only show
    // the earned ones (plus a +N counter for the rest).
    const ownedList = BADGES.filter(b => ownedBadges.has(b.id));
    const badgeRowHtml = ownedList.length === 0 ? '' : `
      <div class="badge-row" aria-label="Gym badges earned">
        ${ownedList.map(b => {
          const url = badgeSprite(b.id);
          const inner = url
            ? `<img src="${url}" alt="${b.name}" class="badge-pip-sprite" onerror="${imgErrorFallback(b.icon)}" />`
            : `<span class="badge-pip-icon" aria-hidden="true">${b.icon}</span>`;
          return `<span class="badge-pip owned" title="${b.name}"
            style="--badge-color:${b.color}">
            ${inner}
          </span>`;
        }).join('')}
        ${ownedList.length < BADGES.length
          ? `<span class="badge-pip-more" aria-label="${BADGES.length - ownedList.length} badges remaining">+${BADGES.length - ownedList.length}</span>`
          : ''}
      </div>
    `;

    // Eyebrow shifts when the league is in play.
    const inLeague = (this.state.badges?.length ?? 0) >= 8 && (this.state.leagueStep ?? 0) < 5;
    const headerEyebrow = inLeague
      ? `— Pokémon League · Step ${(this.state.leagueStep ?? 0) + 1} of 5 —`
      : `— Crossroads · Act ${act} · Step ${step} of 4 —`;
    const headerTitle = inLeague ? 'Indigo <em>Plateau</em>' : 'Choose your <em>path</em>';
    const headerSub = inLeague
      ? 'No retreat. The next door is the next opponent.'
      : `Wave ${String(wave).padStart(2, '0')} awaits. Three trails diverge.`;

    // Big stage progress strip — 4 pips representing the act, with the gym leader portrait.
    const nextGymLeader = !inLeague && act >= 1 && act <= 8 ? getGymForAct(act) : undefined;
    const stopsToGym = nextGymLeader ? Math.max(0, 4 - step) : 0;
    const gymBlindHtml = nextGymLeader
      ? renderBlindChip(this.state.actBossBlind ?? null)
      : '';
    const stageProgressHtml = nextGymLeader
      ? (() => {
          const accent = nextGymLeader.accent;
          // Step 1..3 are normal nodes, step 4 is the gym arena.
          const pips = [0, 1, 2, 3].map(i => {
            const isGym = i === 3;
            const isDone = i < this.state.actStep; // already completed
            const isCurrent = i === this.state.actStep; // up next
            const cls = [
              'stage-pip',
              isGym ? 'gym' : '',
              isDone ? 'done' : '',
              isCurrent ? 'current' : '',
            ].filter(Boolean).join(' ');
            const label = isGym ? 'ARENA' : `${i + 1}`;
            return `<span class="${cls}"><span class="stage-pip-label">${label}</span></span>`;
          }).join('<span class="stage-pip-rail" aria-hidden="true"></span>');
          const cta = stopsToGym <= 0
            ? 'ENTER ARENA'
            : `${stopsToGym} STOP${stopsToGym === 1 ? '' : 'S'} TO ${nextGymLeader.name.toUpperCase()}`;
          return `
            <div class="stage-progress" style="--stage-color:${accent}">
              <div class="stage-progress-portrait">
                <img src="${trainerSpriteUrl(nextGymLeader.spriteSlug)}" alt="${nextGymLeader.name}"
                     onerror="${imgErrorFallback(nextGymLeader.icon)}" />
              </div>
              <div class="stage-progress-body">
                <div class="stage-progress-eyebrow">
                  <span>${nextGymLeader.city.toUpperCase()} · ACT ${act}</span>
                  <span class="stage-progress-type">${renderTypeBadge(nextGymLeader.type)}</span>
                </div>
                <div class="stage-progress-pips">${pips}</div>
                <div class="stage-progress-cta">${cta}</div>
                ${gymBlindHtml}
              </div>
            </div>
          `;
        })()
      : '';

    // League progress block — when the league is in play, preview the current step's blind.
    const leagueProgressHtml = inLeague
      ? (() => {
          const idx = this.state.leagueStep ?? 0;
          const step = getEliteByIndex(idx);
          if (!step) return '';
          const blindId = this.state.leagueBlinds?.[idx] ?? null;
          const accent = step.accent;
          return `
            <div class="stage-progress" style="--stage-color:${accent}">
              <div class="stage-progress-portrait">
                <img src="${trainerSpriteUrl(step.spriteSlug)}" alt="${step.name}"
                     onerror="${imgErrorFallback(step.icon)}" />
              </div>
              <div class="stage-progress-body">
                <div class="stage-progress-eyebrow">
                  <span>${step.title.toUpperCase()} · STEP ${idx + 1}/5</span>
                </div>
                <div class="stage-progress-cta">${step.name.toUpperCase()}</div>
                ${renderBlindChip(blindId)}
              </div>
            </div>
          `;
        })()
      : '';

    return `
      <div class="path-screen screen">
        <div class="path-content rail-1440">
          <div class="path-header">
            <div class="path-eyebrow">${headerEyebrow}</div>
            <h1 class="path-title">${headerTitle}</h1>
            <div class="path-sub">${headerSub}</div>
            ${stageProgressHtml}
            ${leagueProgressHtml}
            ${badgeRowHtml}
          </div>

          <div class="path-cards${isSingle ? ' single' : ''}">
            ${opts.map((n, i) => card(n, i)).join('')}
          </div>

          <div class="path-footnote">
            <span class="kbd-hint">Each path biases the encounter pool — the dice still roll.</span>
          </div>
        </div>
      </div>
    `;
  }

  private attachEvents(): void {
    this.container.querySelectorAll<HTMLButtonElement>('[data-path-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset['pathIdx'] ?? '0', 10);
        const node = this.state.nodeOptions[idx];
        if (!node) return;
        Audio.play('ui.confirm');
        // Subtle commit animation — flash the card, fade siblings
        btn.classList.add('chosen');
        this.container.querySelectorAll<HTMLElement>('.path-card').forEach(other => {
          if (other !== btn) other.classList.add('dimmed');
        });
        window.setTimeout(() => this.onChoose(node), 280);
      });
    });
  }
}

function kindLabel(kind: NodeInstance['kind']): string {
  switch (kind) {
    case 'grass':       return 'Wild · Tall Grass';
    case 'trainer':     return 'Trainer Battle';
    case 'center':      return 'Pokémon Center';
    case 'shop_mini':   return 'Pop-up Shop';
    case 'mystery':     return 'Mystery Event';
    case 'forage':      return 'Quick Forage';
    case 'gym':         return 'Gym Leader';
    case 'elite_four':  return 'Elite Four';
    case 'champion':    return 'Champion';
  }
}

// keep getBadge import "live" so it stays available for future expansions
void getBadge;

function renderBlindChip(blindId: BossBlindId | null): string {
  if (!blindId) return '';
  const b = getBossBlindById(blindId);
  if (!b) return '';
  return `
    <div class="po-blind-chip" style="--blind-color:${b.color}" aria-label="Boss Blind: ${b.name}">
      <div class="po-blind-chip-icon" aria-hidden="true">${b.icon}</div>
      <div class="po-blind-chip-body">
        <div class="po-blind-chip-eyebrow">Boss Blind</div>
        <div class="po-blind-chip-name">${b.name}</div>
        <div class="po-blind-chip-desc">${b.description}</div>
        <div class="po-blind-chip-hint">${b.tacticalHint}</div>
      </div>
    </div>
  `;
}
