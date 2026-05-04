import type { GameState, TrainerGender } from '../../types';
import { STARTERS } from '../../data/enemyPools';
import { ALL_ITEMS } from '../../data/items';
import { fetchPokemon } from '../../api/pokeapi';
import { getStaticSprite } from '../../api/sprites';
import { fadeIn } from '../animations';
import { toBattlePokemon } from '../../systems/battle';
import { logout } from '../../systems/auth';
import { getTrainerSprite, TRAINER_NAMES } from '../../data/trainers';
import { mountAudioControls } from '../../audio/AudioSettingsPanel';
import { escapeHtml, safeUrl } from '../../util/sanitize';
import { hasSavedRun, loadRun, clearRun } from '../../systems/saveRun';
import { loadSettings, saveSettings } from '../../systems/userSettings';
import { getPersonalBest } from '../../systems/leaderboard';
import {
  getDiscoveredCount, getDiscoveredSet, TOTAL_SYNERGIES,
  getDiscoveredBlindCount, getDiscoveredBlindSet, TOTAL_BLINDS,
} from '../../systems/discoveries';
import { SYNERGY_CATALOG } from '../../systems/synergies';
import { BOSS_BLINDS } from '../../data/bossBlinds';
import { ACHIEVEMENTS, getUnlockedSet, getUnlockedCount, TOTAL_ACHIEVEMENTS } from '../../systems/achievements';
import { getChampionClears } from '../../systems/championClears';
import {
  DECKS, MONO_TYPE_OPTIONS, getUnlockedDecks, getLastDeck, saveLastDeck,
  getLastMonoType, saveLastMonoType,
} from '../../systems/decks';
import {
  STAKES, getUnlockedStakes, getLastStake, saveLastStake, getStakeMods,
} from '../../systems/stakes';
import type { PokemonType } from '../../types';
import { formatAct, formatBadges } from '../../util/runProgress';
import { BADGES } from '../../data/badges';
import { badgeSprite, imgErrorFallback } from '../../data/sprites';
import { wasSeen, markSeen, resetTutorial } from '../../systems/tutorial';
import { startFirstRunTour } from '../../systems/runTour';
import { resetTour } from '../../systems/tutorialTour';

const DONATION_URL = 'https://ko-fi.com/pokerun';

interface StarterDisplay {
  id: number;
  name: string;
  displayName: string;
  sprite: string;
  types?: string[];
  bst?: number;
}

/** Pinned type for each of the 5 default starter ids. Used by Mono-Type deck
 *  to filter the carousel before async type-data has loaded. */
const STARTER_PRIMARY_TYPE: Record<number, PokemonType> = {
  1: 'grass',     // Bulbasaur
  4: 'fire',      // Charmander
  7: 'water',     // Squirtle
  25: 'electric', // Pikachu
  133: 'normal',  // Eevee
};

export class StartScreen {
  private container: HTMLElement;
  private onStart: (state: GameState) => void;
  private onLogout: () => void;
  private onResume: (() => void) | null;
  private starterData: StarterDisplay[] = STARTERS.map(s => ({
    id: s.id,
    name: s.name,
    displayName: s.displayName,
    sprite: getStaticSprite(s.id),
  }));
  private selectedStarterIndex = 0;
  private playerName = '';
  private isGuest = false;
  private trainerGender: TrainerGender = 'male';
  private destroyAudioBtn: (() => void) | null = null;
  private selectedDeck: string = 'standard';
  private selectedMonoType: PokemonType = 'grass';
  private selectedStake: string = 'white';

  constructor(
    container: HTMLElement,
    onStart: (state: GameState) => void,
    onLogout: () => void,
    playerName: string,
    isGuest = false,
    onResume: (() => void) | null = null,
  ) {
    this.container = container;
    this.onStart = onStart;
    this.onLogout = onLogout;
    this.playerName = playerName;
    this.isGuest = isGuest;
    this.onResume = onResume;
    this.selectedDeck = getLastDeck(playerName);
    this.selectedMonoType = getLastMonoType(playerName);
    this.selectedStake = getLastStake(playerName);
  }

  async mount(): Promise<void> {
    this.container.innerHTML = this.renderHTML();
    this.container.style.display = '';
    document.body.classList.add('start-active');
    fadeIn(this.container);
    this.attachEvents();
    // Apply mono-type starter filter on initial mount (deck remembered).
    this.refreshStarterFilter();
    const audioSlot = this.container.querySelector<HTMLElement>('#settings-audio-slot');
    if (audioSlot) this.destroyAudioBtn = mountAudioControls(audioSlot);
    this.loadStarterData();

    // First-time launch: pop the How-to-Play modal once so brand-new players
    // get the rules without hunting for the button. Cover page has a "Take the
    // tour" CTA that kicks off the interactive walkthrough.
    if (!wasSeen('intro_htp')) {
      const modal = this.container.querySelector('#howtoplay-modal');
      modal?.classList.remove('hidden');
      markSeen('intro_htp');
    }
  }

  private async loadStarterData(): Promise<void> {
    // Fetch starter data in background
    for (let i = 0; i < STARTERS.length; i++) {
      try {
        const pokemon = await fetchPokemon(STARTERS[i].id, 8);
        this.starterData[i] = {
          id: pokemon.id,
          name: pokemon.name,
          displayName: pokemon.displayName,
          sprite: pokemon.sprite,
          types: pokemon.types,
          bst: pokemon.bst,
        };
        // Update the card
        const card = this.container.querySelector(`[data-starter="${i}"]`);
        if (card) {
          const typeEl = card.querySelector('.starter-types');
          const bstEl = card.querySelector('.starter-bst');
          if (typeEl && pokemon.types) {
            typeEl.innerHTML = pokemon.types
              .map((t, j) => `<span class="type-stamp type-${t}" style="--rot:${j % 2 === 0 ? '-2' : '2'}deg">${t.toUpperCase()}</span>`)
              .join('');
          }
          if (bstEl && pokemon.bst) {
            bstEl.textContent = `BST ${pokemon.bst}`;
          }
        }
      } catch {
        // keep default
      }
    }
  }

  private renderSettingsModal(): string {
    const s = loadSettings();
    const speedOption = (val: number, label: string) =>
      `<button class="settings-pill${s.animationSpeed === val ? ' active' : ''}" data-speed="${val}" type="button">${label}</button>`;
    return `
      <div class="modal-overlay hidden" id="settings-modal">
        <div class="modal htp-modal">
          <button class="modal-close" id="close-settings">✕</button>
          <div class="htp-eyebrow">Display · Motion · Audio</div>
          <h2 class="modal-title">◈ <em>Settings</em></h2>

          <div class="settings-row">
            <div class="settings-row-label">
              <div class="srl-title">Reduce Motion</div>
              <div class="srl-sub">Mute non-essential animations and shakes.</div>
            </div>
            <label class="settings-toggle">
              <input type="checkbox" id="setting-reduce-motion" ${s.reduceMotion ? 'checked' : ''} />
              <span class="settings-toggle-track"><span class="settings-toggle-knob"></span></span>
            </label>
          </div>

          <div class="settings-row">
            <div class="settings-row-label">
              <div class="srl-title">Animation Speed</div>
              <div class="srl-sub">Speed up battle and intro flair.</div>
            </div>
            <div class="settings-pills" id="setting-speed">
              ${speedOption(0.5, '0.5×')}
              ${speedOption(1, '1×')}
              ${speedOption(1.5, '1.5×')}
              ${speedOption(2, '2×')}
            </div>
          </div>

          <div class="settings-row" style="border-top:1.5px dashed var(--ink, #1a1a1a); padding-top:14px; flex-direction:column; align-items:stretch; gap:10px;">
            <div class="settings-row-label">
              <div class="srl-title">Sound &amp; Music</div>
              <div class="srl-sub">Master · Music · SFX</div>
            </div>
            <div id="settings-audio-slot" class="settings-audio-slot"></div>
          </div>

          <div class="settings-row" style="border-top:1.5px dashed var(--ink, #1a1a1a); padding-top:14px;">
            <div class="settings-row-label">
              <div class="srl-title">Tutorial</div>
              <div class="srl-sub">Replay the how-to-play overlay and contextual hints.</div>
            </div>
            <button class="ink-btn ghost sm" id="reset-tutorial-btn" type="button">Replay Tutorial</button>
          </div>

          <div class="settings-row" style="border-top:1.5px dashed var(--ink, #1a1a1a); padding-top:14px;">
            <div class="settings-row-label">
              <div class="srl-title">Saved trainer</div>
              <div class="srl-sub">${escapeHtml(this.playerName || '—')}</div>
            </div>
            <button class="ink-btn ghost sm" id="clear-name-btn" type="button">Clear Saved Name</button>
          </div>
        </div>
      </div>
    `;
  }

  private renderBadgeTrophyStrip(): string {
    const saved = loadRun();
    const earned = new Set(saved?.state.badges ?? []);
    if (earned.size === 0) return '';
    return `
      <div class="trophy-strip" aria-label="Badges earned in saved run">
        <div class="trophy-strip-eyebrow">— Badges earned · ${earned.size} of 8 —</div>
        <div class="trophy-strip-row">
          ${BADGES.map(b => {
            const owned = earned.has(b.id);
            const url = badgeSprite(b.id);
            const inner = owned && url
              ? `<img src="${url}" alt="${b.name}" onerror="${imgErrorFallback(b.icon)}" />`
              : `<span class="trophy-pip-locked" aria-hidden="true"></span>`;
            return `<span class="trophy-pip${owned ? ' owned' : ''}" title="${b.name}"
              style="--badge-color:${b.color}">${inner}</span>`;
          }).join('')}
        </div>
      </div>
    `;
  }

  private renderResumeBanner(): string {
    if (!this.onResume || !hasSavedRun()) return '';
    const saved = loadRun();
    if (!saved) return '';
    const ageMin = Math.max(1, Math.floor((Date.now() - saved.savedAt) / 60_000));
    const wave = saved.state.wave;
    const team = saved.state.team.length;
    const act = saved.state.currentAct;
    const ageLabel = ageMin < 60 ? `${ageMin} min ago` : `${Math.floor(ageMin / 60)}h ago`;
    return `
      <div class="resume-banner">
        <div class="resume-banner-info">
          <div class="resume-banner-eyebrow">Saved run · ${ageLabel}</div>
          <div class="resume-banner-meta">Wave ${wave} · Act ${act} · ${team} mon</div>
        </div>
        <div class="resume-banner-actions">
          <button class="ink-btn ghost sm" id="resume-discard" type="button">Discard</button>
          <button class="ink-btn primary" id="resume-btn" type="button">↻ Resume run</button>
        </div>
      </div>
    `;
  }

  private renderPersonalBest(): string {
    const pb = getPersonalBest(this.playerName);
    const discovered = getDiscoveredCount(this.playerName);
    const blindsFaced = getDiscoveredBlindCount(this.playerName);
    const achievementsUnlocked = getUnlockedCount(this.playerName);
    const discoveryLine = `<button type="button" class="ss-discovery-line" id="ss-discovery-open" title="Open Synergy Codex">Synergies discovered · ${discovered} / ${TOTAL_SYNERGIES} →</button>
      <button type="button" class="ss-discovery-line" id="ss-blind-codex-open" title="Open Boss Blind Codex">Boss Blinds faced · ${blindsFaced} / ${TOTAL_BLINDS} →</button>
      <button type="button" class="ss-discovery-line" id="ss-achievements-open" title="Open Achievements">Achievements · ${achievementsUnlocked} / ${TOTAL_ACHIEVEMENTS} →</button>
      <div class="ss-discovery-line champion-clears-line">Champion clears · ${getChampionClears(this.playerName)}</div>`;
    if (!pb) {
      return `
        <div class="ss-personal-best" data-empty="true">
          <div class="ss-pb-eyebrow">Personal best</div>
          <div class="ss-pb-empty">No runs yet — start your first.</div>
        </div>
        ${discoveryLine}
      `;
    }
    const d = pb.score_details ?? {} as NonNullable<typeof pb.score_details>;
    return `
      <div class="ss-personal-best" data-empty="false">
        <div class="ss-pb-eyebrow">Personal best</div>
        <div class="ss-pb-row">
          <div class="ss-pb-stat"><span class="k">Waves</span><span class="v">${pb.score_waves}</span></div>
          <div class="ss-pb-stat"><span class="k">Act</span><span class="v">${formatAct(d.actReached, d.endless)}</span></div>
          <div class="ss-pb-stat"><span class="k">Badges</span><span class="v">${formatBadges(d.badgesEarned)}</span></div>
          <div class="ss-pb-stat"><span class="k">Starter</span><span class="v">${escapeHtml(d.starterName ?? '—')}</span></div>
        </div>
      </div>
      ${discoveryLine}
    `;
  }

  private refreshDeckPicker(): void {
    const sec = this.container.querySelector<HTMLElement>('.deck-picker-section');
    if (!sec) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = this.renderDeckPicker();
    const next = wrap.firstElementChild as HTMLElement;
    if (next) {
      sec.replaceWith(next);
      // Re-wire the new buttons.
      next.querySelectorAll<HTMLButtonElement>('[data-deck-id]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.disabled) return;
          const id = btn.dataset['deckId'] ?? 'standard';
          this.selectedDeck = id;
          saveLastDeck(this.playerName, id);
          this.refreshDeckPicker();
          this.refreshStarterFilter();
        });
      });
      next.querySelectorAll<HTMLButtonElement>('[data-mono-type]').forEach(btn => {
        btn.addEventListener('click', () => {
          const t = btn.dataset['monoType'] as PokemonType;
          this.selectedMonoType = t;
          saveLastMonoType(this.playerName, t);
          this.refreshDeckPicker();
          this.refreshStarterFilter();
        });
      });
      next.querySelectorAll<HTMLButtonElement>('[data-stake-id]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.disabled) return;
          const id = btn.dataset['stakeId'] ?? 'white';
          this.selectedStake = id;
          saveLastStake(this.playerName, id);
          this.refreshDeckPicker();
        });
      });
    }
  }

  /** Mono-Type deck narrows the starter carousel to just the matching starter.
   *  Other decks show all 5. Applied via inline display:none so we don't have
   *  to fully re-render the starter section. Auto-selects the first visible. */
  private refreshStarterFilter(): void {
    const grid = this.container.querySelector<HTMLElement>('#starter-grid');
    const dots = this.container.querySelector<HTMLElement>('#starter-dots');
    const monoFilter = this.selectedDeck === 'mono_type' ? this.selectedMonoType : null;
    let firstVisible = -1;
    this.starterData.forEach((s, i) => {
      const matches = monoFilter == null || STARTER_PRIMARY_TYPE[s.id] === monoFilter;
      const card = grid?.querySelector<HTMLElement>(`[data-starter="${i}"]`);
      const dot  = dots?.querySelector<HTMLElement>(`[data-dot="${i}"]`);
      if (card) card.style.display = matches ? '' : 'none';
      if (dot)  dot.style.display  = matches ? '' : 'none';
      if (matches && firstVisible < 0) firstVisible = i;
    });
    if (firstVisible >= 0 && this.starterData[this.selectedStarterIndex] &&
        monoFilter != null &&
        STARTER_PRIMARY_TYPE[this.starterData[this.selectedStarterIndex].id] !== monoFilter) {
      // Current selection is now hidden — move to first visible.
      this.selectedStarterIndex = firstVisible;
      this.container.querySelectorAll<HTMLElement>('[data-starter]').forEach((c, i) => {
        c.classList.toggle('selected', i === firstVisible);
      });
      this.container.querySelectorAll<HTMLElement>('[data-dot]').forEach((d, i) => {
        d.classList.toggle('active', i === firstVisible);
      });
    }
  }

  private renderDeckPicker(): string {
    const unlocked = getUnlockedDecks(this.playerName);
    const cards = DECKS.map(d => {
      const isUnlocked = unlocked.has(d.id);
      const isSelected = this.selectedDeck === d.id && isUnlocked;
      const lockHint = !isUnlocked
        ? `<div class="deck-card-lock">Unlock: ${this.unlockHintFor(d.id)}</div>`
        : '';
      return `
        <button type="button"
                class="deck-card${isSelected ? ' selected' : ''}${!isUnlocked ? ' locked' : ''}"
                data-deck-id="${d.id}"
                ${!isUnlocked ? 'disabled' : ''}>
          <div class="deck-card-icon" aria-hidden="true">${isUnlocked ? d.icon : '·'}</div>
          <div class="deck-card-eyebrow">${escapeHtml(d.eyebrow)}</div>
          <div class="deck-card-name">${escapeHtml(isUnlocked ? d.name : '???')}</div>
          <div class="deck-card-desc">${escapeHtml(isUnlocked ? d.description : 'Locked. Keep playing to unlock.')}</div>
          ${lockHint}
        </button>
      `;
    }).join('');

    const monoSubpicker = this.selectedDeck === 'mono_type' && unlocked.has('mono_type')
      ? `<div class="deck-mono-subpicker">
           <span class="deck-mono-label">Choose type:</span>
           ${MONO_TYPE_OPTIONS.map(t => `
             <button type="button"
                     class="deck-mono-chip type-chip type-${t}${this.selectedMonoType === t ? ' selected' : ''}"
                     data-mono-type="${t}">${escapeHtml(t.toUpperCase())}</button>
           `).join('')}
         </div>`
      : '';

    const stakeUnlocked = getUnlockedStakes(this.playerName);
    const stakePills = STAKES.map(s => {
      const isUnlocked = stakeUnlocked.has(s.id);
      const isSelected = this.selectedStake === s.id && isUnlocked;
      const lockHint = !isUnlocked && s.unlockAfter
        ? `Unlock: clear Champion on ${this.stakeNameForId(s.unlockAfter)}`
        : s.description;
      return `<button type="button"
                      class="stake-pill stake-${s.id}${isSelected ? ' selected' : ''}${!isUnlocked ? ' locked' : ''}"
                      data-stake-id="${s.id}"
                      title="${escapeHtml(lockHint)}"
                      ${!isUnlocked ? 'disabled' : ''}>
                ${escapeHtml(isUnlocked ? s.name.split(' ')[0] : '???')}
              </button>`;
    }).join('');

    return `
      <div class="deck-picker-section">
        <div class="deck-picker-header">
          <span class="deck-picker-title">Choose your deck</span>
          <span class="deck-picker-hint">Decks bend the rules — unlocked via achievements.</span>
        </div>
        <div class="deck-picker-grid">${cards}</div>
        ${monoSubpicker}
        <div class="stake-picker-row">
          <span class="stake-picker-label">Stake</span>
          ${stakePills}
        </div>
      </div>
    `;
  }

  private stakeNameForId(id: string): string {
    return STAKES.find(s => s.id === id)?.name ?? id;
  }

  private unlockHintFor(deckId: string): string {
    switch (deckId) {
      case 'speedrunner':  return 'Hall of Records — survive 30+ waves';
      case 'iron_trainer': return 'Survivor — reach Act 5';
      case 'mono_type':    return 'Mono Master — beat a gym with 2+ same-type alive';
      default:             return '—';
    }
  }

  private openSynergyCodex(): void {
    const discovered = getDiscoveredSet(this.playerName);
    const cards = SYNERGY_CATALOG.map(entry => {
      const found = discovered.has(entry.id);
      if (found) {
        return `
          <div class="codex-card found syn-${entry.color}">
            <div class="codex-card-head">
              <span class="codex-card-icon">${entry.icon}</span>
              <span class="codex-card-name">${escapeHtml(entry.name)}</span>
            </div>
            <p class="codex-card-desc">${escapeHtml(entry.description)}</p>
          </div>
        `;
      }
      return `
        <div class="codex-card locked">
          <div class="codex-card-head">
            <span class="codex-card-icon">·</span>
            <span class="codex-card-name">???</span>
          </div>
          <p class="codex-card-desc">Trigger this synergy to reveal.</p>
        </div>
      `;
    }).join('');

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay codex-overlay';
    overlay.innerHTML = `
      <div class="modal codex-modal">
        <button class="modal-close" id="codex-close" type="button">✕</button>
        <div class="codex-eyebrow">— Field Reference —</div>
        <h2 class="modal-title">Synergy <em>Codex</em></h2>
        <div class="codex-progress">${discovered.size} / ${SYNERGY_CATALOG.length} discovered</div>
        <div class="codex-grid">${cards}</div>
      </div>
    `;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector<HTMLButtonElement>('#codex-close')?.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  }

  private openBlindCodex(): void {
    const faced = getDiscoveredBlindSet(this.playerName);
    const cards = BOSS_BLINDS.map(b => {
      const found = faced.has(b.id);
      if (found) {
        return `
          <div class="codex-card found codex-blind" style="--blind-color:${b.color}">
            <div class="codex-card-head">
              <span class="codex-card-icon">${b.icon}</span>
              <span class="codex-card-name">${escapeHtml(b.name)}</span>
            </div>
            <p class="codex-card-desc">${escapeHtml(b.description)}</p>
            <p class="codex-card-hint">${escapeHtml(b.tacticalHint)}</p>
          </div>
        `;
      }
      return `
        <div class="codex-card locked">
          <div class="codex-card-head">
            <span class="codex-card-icon">·</span>
            <span class="codex-card-name">???</span>
          </div>
          <p class="codex-card-desc">Face this blind in battle to reveal.</p>
        </div>
      `;
    }).join('');

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay codex-overlay';
    overlay.innerHTML = `
      <div class="modal codex-modal">
        <button class="modal-close" id="codex-close" type="button">✕</button>
        <div class="codex-eyebrow">— Field Reference —</div>
        <h2 class="modal-title">Boss Blind <em>Codex</em></h2>
        <div class="codex-progress">${faced.size} / ${BOSS_BLINDS.length} faced</div>
        <div class="codex-grid">${cards}</div>
      </div>
    `;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector<HTMLButtonElement>('#codex-close')?.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  }

  private openAchievementsCodex(): void {
    const unlocked = getUnlockedSet(this.playerName);
    const cards = ACHIEVEMENTS.map(a => {
      const found = unlocked.has(a.id);
      if (found) {
        return `
          <div class="codex-card found codex-achievement">
            <div class="codex-card-head">
              <span class="codex-card-icon">★</span>
              <span class="codex-card-name">${escapeHtml(a.name)}</span>
            </div>
            <div class="codex-card-eyebrow">${escapeHtml(a.eyebrow)}</div>
            <p class="codex-card-desc">${escapeHtml(a.description)}</p>
          </div>
        `;
      }
      return `
        <div class="codex-card locked">
          <div class="codex-card-head">
            <span class="codex-card-icon">·</span>
            <span class="codex-card-name">???</span>
          </div>
          <p class="codex-card-desc">Locked. Keep playing to unlock.</p>
        </div>
      `;
    }).join('');

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay codex-overlay';
    overlay.innerHTML = `
      <div class="modal codex-modal">
        <button class="modal-close" id="codex-close" type="button">✕</button>
        <div class="codex-eyebrow">— Field Reference —</div>
        <h2 class="modal-title">Achieve<em>ments</em></h2>
        <div class="codex-progress">${unlocked.size} / ${ACHIEVEMENTS.length} unlocked</div>
        <div class="codex-grid">${cards}</div>
      </div>
    `;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector<HTMLButtonElement>('#codex-close')?.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  }

  private wireHtpPager(modalEl: HTMLElement): void {
    const book = modalEl.querySelector<HTMLElement>('.htp-book');
    if (!book) return;
    const pages = Array.from(book.querySelectorAll<HTMLElement>('.htp-page'));
    const pips = Array.from(book.querySelectorAll<HTMLButtonElement>('.htp-pip'));
    const prev = book.querySelector<HTMLButtonElement>('#htp-prev')!;
    const next = book.querySelector<HTMLButtonElement>('#htp-next')!;
    const max = pages.length - 1;
    const goto = (i: number) => {
      const idx = Math.max(0, Math.min(max, i));
      book.dataset.page = String(idx);
      pages.forEach((p, k) => {
        p.hidden = k !== idx;
        if (k === idx) p.classList.add('htp-page-in'); else p.classList.remove('htp-page-in');
      });
      pips.forEach((p, k) => p.classList.toggle('active', k === idx));
      prev.disabled = idx === 0;
      next.textContent = idx === max ? 'Close' : 'Next ›';
      book.scrollTop = 0;
    };
    prev.addEventListener('click', () => goto(Number(book.dataset.page ?? 0) - 1));
    next.addEventListener('click', () => {
      const cur = Number(book.dataset.page ?? 0);
      if (cur === max) {
        modalEl.classList.add('hidden');
        goto(0);
      } else {
        goto(cur + 1);
      }
    });
    pips.forEach(p => p.addEventListener('click', () => goto(Number(p.dataset.pip))));
    // Reset to cover whenever modal opens
    const observer = new MutationObserver(() => {
      if (!modalEl.classList.contains('hidden')) goto(0);
    });
    observer.observe(modalEl, { attributes: true, attributeFilter: ['class'] });
  }

  private renderHTML(): string {
    return `
      <div class="start-screen screen">
        <div class="start-content">

          <!-- Headline: eyebrow + big title | side note -->
          <div class="game-logo">
            <div>
              <div class="logo-subtitle">Issue 001 · Field Guide Edition</div>
              <h1 class="logo-title">A <em>ROGUELIKE</em><br>GAUNTLET.</h1>
            </div>
            <div class="start-issue">
              <b>How it works</b>
              Choose a starter. Clear waves.<br>
              Pick rewards. Survive longer than<br>
              the last person who tried.
            </div>
          </div>

          <!-- Logged-in user banner -->
          <div class="start-user-banner">
            <div class="start-user-name">
              <span class="kicker">${this.isGuest ? 'Playing as guest' : 'Logged in as'}</span>
              ${escapeHtml(this.playerName)}
            </div>
            <button class="trainer-chip" id="trainer-chip" type="button" title="Click to switch trainer">
              <span class="tc-sprite-wrap">
                <img class="tc-sprite" src="${getTrainerSprite(this.trainerGender)}" alt="" draggable="false" />
              </span>
              <span class="tc-meta">
                <span class="tc-kicker">Trainer</span>
                <span class="tc-name">${TRAINER_NAMES[this.trainerGender]} ${this.trainerGender === 'male' ? '♂' : '♀'}</span>
              </span>
              <span class="tc-swap" aria-hidden="true">↻</span>
            </button>
            <button class="ink-btn ghost sm" id="logout-btn" style="font-size:11px">
              ${this.isGuest ? '← Back' : 'Log out'}
            </button>
          </div>

          ${this.renderResumeBanner()}
          ${this.renderPersonalBest()}
          ${this.renderBadgeTrophyStrip()}
          ${this.renderDeckPicker()}

          <!-- Starter selection -->
          <div class="starter-section">
            <div class="starter-heading">
              <div class="h">Choose your starter</div>
              <div class="s">${this.starterData.length} available · press A to confirm</div>
            </div>
            <div class="starter-carousel">
              <button class="starter-nav prev" id="starter-prev" type="button" aria-label="Previous starter">‹</button>
              <div class="starter-grid" id="starter-grid">
                ${this.starterData.map((s, i) => `
                  <div
                    class="creature-card ${i === this.selectedStarterIndex ? 'selected' : ''}"
                    data-starter="${i}"
                    role="button"
                    tabindex="0"
                    style="--card-hover-rot:${i % 2 === 0 ? '1.2' : '-1.2'}deg"
                  >
                    <div class="card-head">
                      <span class="dex">№ ${String(s.id).padStart(3,'0')}</span>
                      <span class="bst starter-bst">BST …</span>
                    </div>
                    <div class="sprite-frame">
                      <img src="${s.sprite}" alt="${s.displayName}" />
                    </div>
                    <div class="card-foot">
                      <div class="name">${s.displayName}</div>
                      <div class="types starter-types"><!-- loaded async --></div>
                    </div>
                  </div>
                `).join('')}
              </div>
              <button class="starter-nav next" id="starter-next" type="button" aria-label="Next starter">›</button>
            </div>
            <div class="starter-dots" id="starter-dots" role="tablist">
              ${this.starterData.map((_, i) => `
                <button class="starter-dot ${i === this.selectedStarterIndex ? 'active' : ''}"
                        data-dot="${i}" type="button" aria-label="Select starter ${i + 1}"></button>
              `).join('')}
            </div>
          </div>

          <!-- Footer -->
          <div class="start-footer">
            <div class="logo-subtitle kb-hints" style="text-transform:uppercase;letter-spacing:.08em">
              ► D-pad select<br>► Start begins run
            </div>
            <div style="display:flex;gap:10px;justify-self:center;flex-wrap:wrap;align-items:center">
              <button class="ink-btn ghost" id="howtoplay-btn">How to play</button>
              <button class="ink-btn ghost" id="leaderboard-btn">Leaderboard</button>
              <button class="ink-btn ghost" id="settings-btn" title="Display + audio settings">⚙ Settings</button>
              <a class="ink-btn ghost donate-chip" id="donate-link" href="${safeUrl(DONATION_URL)}" target="_blank" rel="noopener noreferrer" title="Support server costs">♥ Support</a>
              <button class="ink-btn primary" id="start-btn">Begin run →</button>
            </div>
            <div class="logo-subtitle" style="text-align:right;letter-spacing:.08em;text-transform:uppercase">
              Trainer · ${escapeHtml(this.playerName)}<br>Wave — · —¢
              <a href="#" id="legal-btn" class="footer-legal-link">Legal &amp; Disclaimer</a>
            </div>
          </div>

        </div>

        <!-- Settings Modal -->
        ${this.renderSettingsModal()}

        <!-- Legal / Disclaimer Modal -->
        <div class="modal-overlay hidden" id="legal-modal">
          <div class="modal htp-modal">
            <button class="modal-close" id="close-legal">✕</button>
            <div class="htp-eyebrow">Fan Project · Non-Commercial</div>
            <h2 class="modal-title">Legal &amp;<br><em>Disclaimer</em></h2>
            <div class="htp-block" style="margin-top:12px">
              <p>PokéRun is a free, fan-made tribute. <b>Pokémon</b> and all associated names, sprites, and trademarks are property of <b>Nintendo</b>, <b>Game Freak</b>, and <b>The Pokémon Company</b>. This project is not affiliated with, endorsed, or sponsored by them.</p>
              <p>Sprites are loaded from public APIs (PokéAPI). No copyrighted assets are bundled. No money is made from this game.</p>
              <p>If you are a rights-holder and want this taken down — please reach out via the donation page. We will comply.</p>
            </div>
            <div class="htp-tips">
              <div class="htp-label">Donations</div>
              <p>Donations cover server costs only and grant no in-game advantage. They are voluntary tips and not a purchase of any product or licence.</p>
            </div>
          </div>
        </div>

        <!-- How to Play Modal -->
        <div class="modal-overlay hidden" id="howtoplay-modal">
          <div class="modal htp-modal htp-book" data-page="0">
            <button class="modal-close" id="close-howtoplay">✕</button>

            <!-- Page 0 — Cover -->
            <div class="htp-page htp-cover" data-page="0">
              <div class="htp-cover-stamp">Vol. 01</div>
              <div class="htp-eyebrow">Field Manual · Issue 001</div>
              <h2 class="modal-title">How to<br><em>Play</em></h2>
              <div class="htp-cover-meta">
                <span>6 chapters</span>
                <span class="htp-cover-dot">·</span>
                <span>~ 4 min read</span>
                <span class="htp-cover-dot">·</span>
                <span>Trainer-grade</span>
              </div>
              <p class="htp-cover-blurb">A pocket guide to surviving Kanto's longest gauntlet. Read it, fold it, lose it in your bag — works either way.</p>
              <button class="ink-btn primary htp-tour-cta" id="htp-take-tour" type="button">▶ Take the interactive tour</button>
              <div class="htp-cover-toc">
                <div class="htp-label">Contents</div>
                <ol>
                  <li><span>01</span> The Run</li>
                  <li><span>02</span> Battle Basics</li>
                  <li><span>03</span> Rewards &amp; Path</li>
                  <li><span>04</span> Items &amp; Bag</li>
                  <li><span>05</span> Arenas &amp; Badges</li>
                  <li><span>06</span> Field Notes</li>
                </ol>
              </div>
            </div>

            <!-- Page 1 — The Run -->
            <div class="htp-page" data-page="1" hidden>
              <div class="htp-eyebrow">Chapter 01</div>
              <h3 class="htp-chapter-title">The <em>Run</em></h3>
              <p class="htp-lede">A run is a single life. Survive waves, clear three acts, capture badges. When your team faints — that's the run.</p>
              <ul class="htp-flow">
                <li><b>Pick a starter.</b> One mon, level 8. Your seed.</li>
                <li><b>Walk a path.</b> Each act branches: battles, shops, arenas, events.</li>
                <li><b>Clear waves.</b> Win fights, earn coins &amp; rewards.</li>
                <li><b>Beat arenas.</b> Eight gym leaders gate the acts. Win → badge.</li>
                <li><b>Face the Elite.</b> Final 4 + Champion close the run.</li>
              </ul>
              <div class="htp-tips">
                <div class="htp-label">Score</div>
                <p>Run score = waves cleared. Badges add a multiplier. Leaderboard ranks your best.</p>
              </div>
            </div>

            <!-- Page 2 — Battle Basics -->
            <div class="htp-page" data-page="2" hidden>
              <div class="htp-eyebrow">Chapter 02</div>
              <h3 class="htp-chapter-title">Battle <em>Basics</em></h3>
              <div class="htp-grid htp-grid-2">
                <div class="htp-block">
                  <div class="htp-label">Turn order</div>
                  <p>Speed decides who strikes first. Priority moves cut the line.</p>
                </div>
                <div class="htp-block">
                  <div class="htp-label">Type chart</div>
                  <p>Super-effective hits do <b>2×</b>. Resisted hits do <b>½×</b>. Stack types — coverage wins fights.</p>
                </div>
                <div class="htp-block">
                  <div class="htp-label">Status</div>
                  <p>Burn, poison, sleep, paralyse, freeze. Cure with items or switch out.</p>
                </div>
                <div class="htp-block">
                  <div class="htp-label">Auto-Battle</div>
                  <p>Battles resolve automatically — your team picks moves based on type matchups, items, and HP. Toggle <kbd>A</kbd> to pause and read the log.</p>
                </div>
              </div>
              <div class="htp-tips">
                <div class="htp-label">Move roster</div>
                <p>When a mon learns a new move with a full set, the picker pops up — choose what to forget or stash it in the move pool. The team-panel <b>☰</b> button opens the manager any time.</p>
              </div>
            </div>

            <!-- Page 3 — Rewards & Path -->
            <div class="htp-page" data-page="3" hidden>
              <div class="htp-eyebrow">Chapter 03</div>
              <h3 class="htp-chapter-title">Rewards &amp; <em>Path</em></h3>
              <p class="htp-lede">After every fight: pick one of three cards — or skip for coins.</p>
              <div class="htp-cardrow">
                <div class="htp-card-mock"><div class="htp-cm-label">Mon</div><div class="htp-cm-tag">+1 to team</div></div>
                <div class="htp-card-mock"><div class="htp-cm-label">Perk</div><div class="htp-cm-tag">Team buff</div></div>
                <div class="htp-card-mock"><div class="htp-cm-label">Item</div><div class="htp-cm-tag">Bag &amp; held</div></div>
              </div>
              <div class="htp-grid htp-grid-2">
                <div class="htp-block">
                  <div class="htp-label">Skip</div>
                  <p>Take no card → <b>+60¢</b>. Build a war chest for the shop.</p>
                </div>
                <div class="htp-block">
                  <div class="htp-label">Boss waves</div>
                  <p>Wave 5, 10, 15… higher rarity drops. Save your skips for normal waves.</p>
                </div>
                <div class="htp-block">
                  <div class="htp-label">Path nodes</div>
                  <p>Battle · Elite · Shop · Event · Heal · Arena. Plan two steps ahead.</p>
                </div>
                <div class="htp-block">
                  <div class="htp-label">Events</div>
                  <p>Random encounters: gambles, gifts, dilemmas. Read carefully.</p>
                </div>
              </div>
            </div>

            <!-- Page 4 — Items & Bag -->
            <div class="htp-page" data-page="4" hidden>
              <div class="htp-eyebrow">Chapter 04</div>
              <h3 class="htp-chapter-title">Items &amp; <em>Bag</em></h3>
              <p class="htp-lede">Your bag holds <b>5 consumables</b>. Use them mid-battle. Held items live on a Pokémon and trigger automatically.</p>
              <div class="htp-bag-mock" aria-hidden="true">
                <span class="htp-slot filled">Potion</span>
                <span class="htp-slot filled">Revive</span>
                <span class="htp-slot filled">X-Atk</span>
                <span class="htp-slot">·</span>
                <span class="htp-slot">·</span>
              </div>
              <div class="htp-grid htp-grid-2">
                <div class="htp-block">
                  <div class="htp-label">Consumables</div>
                  <p>Potions, Revives, status cures, X-stat boosters, Berries. One-shot — once spent, gone.</p>
                </div>
                <div class="htp-block">
                  <div class="htp-label">Held items</div>
                  <p>Leftovers, Choice Band, Focus Sash, type plates. Each mon has up to <b>5 slots</b> — slot 1 is free, the rest unlock with coins as you level.</p>
                </div>
                <div class="htp-block">
                  <div class="htp-label">Perks</div>
                  <p>Team-wide passives. Stack with held items. Picked from rewards.</p>
                </div>
                <div class="htp-block">
                  <div class="htp-label">Shop</div>
                  <p>Between waves. Consumables, held items, sometimes a rare mon. Coins only.</p>
                </div>
              </div>
            </div>

            <!-- Page 5 — Arenas -->
            <div class="htp-page" data-page="5" hidden>
              <div class="htp-eyebrow">Chapter 05</div>
              <h3 class="htp-chapter-title">Arenas &amp; <em>Badges</em></h3>
              <p class="htp-lede">An arena is a four-stage gauntlet. HP carries over — pack potions or grab a Pokémon Center node first.</p>
              <ol class="htp-gauntlet">
                <li><b>Junior trainer</b> — warm-up</li>
                <li><b>Restock shop</b> — discounted consumables</li>
                <li><b>Senior trainer</b> — same type, bigger team</li>
                <li><b>Gym leader</b> — boss fight, type-locked</li>
              </ol>
              <div class="htp-tips">
                <div class="htp-label">Badges</div>
                <p>Eight leaders, eight badges. Each unlocks a permanent perk (level cap, evolution, status res). Badges persist on your run-save until the run ends.</p>
              </div>
            </div>

            <!-- Page 6 — Field Notes -->
            <div class="htp-page" data-page="6" hidden>
              <div class="htp-eyebrow">Chapter 06</div>
              <h3 class="htp-chapter-title">Field <em>Notes</em></h3>
              <div class="htp-tips">
                <div class="htp-label">Pro tips · learned the hard way</div>
                <ul>
                  <li>Type diversity beats raw stats — always have an answer</li>
                  <li>Held items stack with perks. Combine deliberately</li>
                  <li>Hoard Revives &amp; Full Restores for bosses</li>
                  <li>Pause the auto-battle (<kbd>A</kbd>) to inspect the log between turns</li>
                  <li>Skip early waves for coins · spend before arenas</li>
                  <li>Read the leader's type before walking in — counter-build</li>
                  <li>Lose a mon? Don't panic. The bag is your second team</li>
                </ul>
              </div>
              <div class="htp-end">— end of manual —<br>good luck out there.</div>
            </div>

            <!-- Pager -->
            <div class="htp-pager">
              <button class="ink-btn ghost sm" id="htp-prev" type="button" disabled>‹ Prev</button>
              <div class="htp-pips" id="htp-pips" role="tablist" aria-label="Chapters">
                <button class="htp-pip active" data-pip="0" type="button" aria-label="Cover"></button>
                <button class="htp-pip" data-pip="1" type="button" aria-label="The Run"></button>
                <button class="htp-pip" data-pip="2" type="button" aria-label="Battle"></button>
                <button class="htp-pip" data-pip="3" type="button" aria-label="Rewards"></button>
                <button class="htp-pip" data-pip="4" type="button" aria-label="Items"></button>
                <button class="htp-pip" data-pip="5" type="button" aria-label="Arenas"></button>
                <button class="htp-pip" data-pip="6" type="button" aria-label="Notes"></button>
              </div>
              <button class="ink-btn primary sm" id="htp-next" type="button">Next ›</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private attachEvents(): void {
    const startBtn       = this.container.querySelector<HTMLButtonElement>('#start-btn')!;
    const leaderboardBtn = this.container.querySelector('#leaderboard-btn')!;
    const howtoplayBtn   = this.container.querySelector('#howtoplay-btn')!;
    const howtoplayModal = this.container.querySelector('#howtoplay-modal')!;
    const closeHowtoplay = this.container.querySelector('#close-howtoplay')!;
    const logoutBtn      = this.container.querySelector('#logout-btn');

    // Synergy Codex — click discovery line to open the catalog modal
    this.container.querySelector<HTMLButtonElement>('#ss-discovery-open')
      ?.addEventListener('click', () => this.openSynergyCodex());
    this.container.querySelector<HTMLButtonElement>('#ss-blind-codex-open')
      ?.addEventListener('click', () => this.openBlindCodex());
    this.container.querySelector<HTMLButtonElement>('#ss-achievements-open')
      ?.addEventListener('click', () => this.openAchievementsCodex());

    // Deck picker — clicking unlocked card selects it. Re-render strip so the
    // mono-type sub-picker can appear/disappear.
    this.container.querySelectorAll<HTMLButtonElement>('[data-deck-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const id = btn.dataset['deckId'] ?? 'standard';
        this.selectedDeck = id;
        saveLastDeck(this.playerName, id);
        this.refreshDeckPicker();
      });
    });
    this.container.querySelectorAll<HTMLButtonElement>('[data-mono-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset['monoType'] as PokemonType;
        this.selectedMonoType = t;
        saveLastMonoType(this.playerName, t);
        this.refreshDeckPicker();
      });
    });
    this.container.querySelectorAll<HTMLButtonElement>('[data-stake-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const id = btn.dataset['stakeId'] ?? 'white';
        this.selectedStake = id;
        saveLastStake(this.playerName, id);
        this.refreshDeckPicker();
      });
    });

    // Trainer chip — click cycles gender
    const trainerChip = this.container.querySelector<HTMLButtonElement>('#trainer-chip');
    trainerChip?.addEventListener('click', () => {
      this.trainerGender = this.trainerGender === 'male' ? 'female' : 'male';
      const img = trainerChip.querySelector<HTMLImageElement>('.tc-sprite');
      const name = trainerChip.querySelector<HTMLElement>('.tc-name');
      if (img) img.src = getTrainerSprite(this.trainerGender);
      if (name) name.textContent = `${TRAINER_NAMES[this.trainerGender]} ${this.trainerGender === 'male' ? '♂' : '♀'}`;
      trainerChip.classList.remove('pulse');
      void trainerChip.offsetWidth;
      trainerChip.classList.add('pulse');
    });

    // Starter selection (cards + dots + nav buttons)
    const grid = this.container.querySelector<HTMLElement>('#starter-grid');
    const setSelected = (idx: number, scroll = false) => {
      idx = Math.max(0, Math.min(this.starterData.length - 1, idx));
      this.selectedStarterIndex = idx;
      this.container.querySelectorAll('[data-starter]').forEach((c, i) => {
        c.classList.toggle('selected', i === idx);
      });
      this.container.querySelectorAll('[data-dot]').forEach((d, i) => {
        d.classList.toggle('active', i === idx);
      });
      if (scroll && grid) {
        const card = grid.querySelector<HTMLElement>(`[data-starter="${idx}"]`);
        card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    };
    this.container.querySelectorAll('[data-starter]').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt((card as HTMLElement).dataset['starter'] ?? '0');
        setSelected(idx, true);
      });
      card.addEventListener('keydown', e => {
        if ((e as KeyboardEvent).key === 'Enter') (card as HTMLElement).click();
      });
    });
    this.container.querySelectorAll<HTMLElement>('[data-dot]').forEach(dot => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.dataset['dot'] ?? '0');
        setSelected(idx, true);
      });
    });
    this.container.querySelector<HTMLElement>('#starter-prev')?.addEventListener('click', () => {
      setSelected(this.selectedStarterIndex - 1, true);
    });
    this.container.querySelector<HTMLElement>('#starter-next')?.addEventListener('click', () => {
      setSelected(this.selectedStarterIndex + 1, true);
    });
    // Sync selection on swipe (scroll-snap finished)
    if (grid) {
      let scrollTimer: number | null = null;
      grid.addEventListener('scroll', () => {
        if (scrollTimer != null) window.clearTimeout(scrollTimer);
        scrollTimer = window.setTimeout(() => {
          const cards = Array.from(grid.querySelectorAll<HTMLElement>('[data-starter]'));
          if (cards.length === 0) return;
          const center = grid.scrollLeft + grid.clientWidth / 2;
          let bestI = 0; let bestDist = Infinity;
          cards.forEach((c, i) => {
            const cx = c.offsetLeft + c.offsetWidth / 2;
            const d = Math.abs(cx - center);
            if (d < bestDist) { bestDist = d; bestI = i; }
          });
          if (bestI !== this.selectedStarterIndex) setSelected(bestI, false);
        }, 90) as unknown as number;
      }, { passive: true });
    }

    startBtn.addEventListener('click', () => this.handleStart());

    leaderboardBtn.addEventListener('click', () => {
      this.container.dispatchEvent(new CustomEvent('show-leaderboard'));
    });

    howtoplayBtn.addEventListener('click', () => howtoplayModal.classList.remove('hidden'));
    closeHowtoplay.addEventListener('click', () => howtoplayModal.classList.add('hidden'));
    howtoplayModal.addEventListener('click', e => {
      if (e.target === howtoplayModal) howtoplayModal.classList.add('hidden');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !howtoplayModal.classList.contains('hidden')) {
        howtoplayModal.classList.add('hidden');
      }
    });
    this.wireHtpPager(howtoplayModal as HTMLElement);

    // "Take the tour" CTA on the cover page → close modal, start tour
    const takeTourBtn = this.container.querySelector<HTMLButtonElement>('#htp-take-tour');
    takeTourBtn?.addEventListener('click', () => {
      howtoplayModal.classList.add('hidden');
      resetTour();
      window.setTimeout(() => startFirstRunTour(true), 220);
    });

    const legalBtn = this.container.querySelector('#legal-btn');
    const legalModal = this.container.querySelector('#legal-modal');
    const closeLegal = this.container.querySelector('#close-legal');
    legalBtn?.addEventListener('click', e => {
      e.preventDefault();
      legalModal?.classList.remove('hidden');
    });
    closeLegal?.addEventListener('click', () => legalModal?.classList.add('hidden'));
    legalModal?.addEventListener('click', e => {
      if (e.target === legalModal) legalModal.classList.add('hidden');
    });

    logoutBtn?.addEventListener('click', () => {
      logout();
      this.onLogout();
    });

    // Settings modal
    const settingsBtn = this.container.querySelector('#settings-btn');
    const settingsModal = this.container.querySelector('#settings-modal');
    const closeSettings = this.container.querySelector('#close-settings');
    settingsBtn?.addEventListener('click', () => settingsModal?.classList.remove('hidden'));
    closeSettings?.addEventListener('click', () => settingsModal?.classList.add('hidden'));
    settingsModal?.addEventListener('click', e => {
      if (e.target === settingsModal) settingsModal.classList.add('hidden');
    });
    const resetTutBtn = this.container.querySelector<HTMLButtonElement>('#reset-tutorial-btn');
    resetTutBtn?.addEventListener('click', () => {
      resetTutorial();
      const howto = this.container.querySelector('#howtoplay-modal');
      const settingsModalEl = this.container.querySelector('#settings-modal');
      settingsModalEl?.classList.add('hidden');
      howto?.classList.remove('hidden');
    });

    const reduceMotionCb = this.container.querySelector<HTMLInputElement>('#setting-reduce-motion');
    reduceMotionCb?.addEventListener('change', () => {
      const cur = loadSettings();
      saveSettings({ ...cur, reduceMotion: !!reduceMotionCb.checked });
    });
    this.container.querySelectorAll<HTMLButtonElement>('#setting-speed [data-speed]').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = parseFloat(btn.dataset['speed'] ?? '1');
        const cur = loadSettings();
        saveSettings({ ...cur, animationSpeed: v });
        this.container.querySelectorAll('#setting-speed [data-speed]').forEach(b => b.classList.toggle('active', b === btn));
      });
    });

    // Resume / discard saved run
    const resumeBtn = this.container.querySelector<HTMLButtonElement>('#resume-btn');
    const discardBtn = this.container.querySelector<HTMLButtonElement>('#resume-discard');
    resumeBtn?.addEventListener('click', () => {
      this.onResume?.();
    });
    discardBtn?.addEventListener('click', () => {
      clearRun();
      const banner = this.container.querySelector<HTMLElement>('.resume-banner');
      banner?.remove();
    });
  }

  private async handleStart(): Promise<void> {
    // Beginning a fresh run drops any existing save so resume-banner stays consistent.
    clearRun();
    const starter = this.starterData[this.selectedStarterIndex];
    const startBtn = this.container.querySelector<HTMLButtonElement>('#start-btn')!;
    startBtn.disabled = true;
    startBtn.textContent = 'Loading...';

    try {
      const pokemon = await fetchPokemon(starter.id, 8);

      const battlePokemon = toBattlePokemon(pokemon, []);

      // ── Resolve deck mods at run-start ────────────────────────────────
      const deckMods: NonNullable<GameState['deckMods']> = {};
      let bonusCoins = 0;
      const bonusInventory: { itemId: string; qty: number }[] = [];
      if (this.selectedDeck === 'speedrunner') {
        bonusCoins = 100;
        bonusInventory.push({ itemId: 'reroll_token', qty: 1 });
        deckMods.stagesPerAct = 3;
      } else if (this.selectedDeck === 'iron_trainer') {
        deckMods.shopExcludeConsumables = true;
        deckMods.startWithSlot2 = true;
        // Apply slot-2 unlock to the chosen starter immediately so the player
        // sees the benefit on wave 1.
        if (battlePokemon.itemSlots?.[1]) {
          battlePokemon.itemSlots[1].unlocked = true;
        }
      } else if (this.selectedDeck === 'mono_type') {
        deckMods.monoType = this.selectedMonoType;
        deckMods.monoDamageBoost = true;
      }
      // Build any starter-bonus inventory entries by looking up the items.
      const startInventory = bonusInventory
        .map(({ itemId, qty }) => {
          const item = ALL_ITEMS.find(i => i.id === itemId);
          return item ? { item, quantity: qty } : null;
        })
        .filter((x): x is NonNullable<typeof x> => x != null);

      const initialState: GameState = {
        phase: 'wave_intro',
        playerName: this.playerName,
        trainerGender: this.trainerGender,
        wave: 1,
        coins: 100 + bonusCoins,
        team: [battlePokemon],
        pc: [],
        pendingCatch: null,
        inventory: startInventory,
        activePerks: [],
        battleState: null,
        pendingRewards: [],
        shopItems: [],
        shopPacks: [],
        shopVouchers: [],
        runStats: {
          wavesCleared: 0,
          totalKOs: 0,
          itemsCollected: 0,
          perksCollected: 0,
          starterName: pokemon.displayName,
          starterId: pokemon.id,
          totalDamageDealt: 0,
          chainKOCount: 0,
        },
        godModeAvailable: false,
        zMovesAvailable: 0,
        teamRewards: [],
        nextBossWave: 5 + Math.floor(Math.random() * 3), // first boss: wave 5, 6, or 7
        vouchers: [],
        pendingWaveTag: null,
        queuedTags: [],
        investmentCoins: 0,
        typeLevels: {},
        totalCoinsEarned: 0,
        currentAct: 1,
        actStep: 0,
        nodeOptions: [],
        currentNode: null,
        badges: [],
        generation: 'gen1',
        leagueStep: 0,
        pendingGenGate: false,
        actBossBlind: null,
        leagueBlinds: [],
        deck: this.selectedDeck,
        deckMods,
        stake: this.selectedStake,
        stakeMods: getStakeMods(this.selectedStake),
      };

      this.onStart(initialState);
    } catch (err) {
      startBtn.disabled = false;
      startBtn.textContent = 'START GAUNTLET';
      console.error('Failed to load starter:', err);
    }
  }

  unmount(): void {
    this.destroyAudioBtn?.();
    this.destroyAudioBtn = null;
    document.body.classList.remove('start-active');
    this.container.style.display = 'none';
    this.container.innerHTML = '';
  }
}
