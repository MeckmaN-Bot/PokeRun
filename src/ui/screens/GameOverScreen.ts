import type { GameState, LeaderboardEntry } from '../../types';
import { submitScore, getTopScores, getPersonalBest } from '../../systems/leaderboard';
import { fadeIn } from '../animations';
import { getGymForAct } from '../../data/gymLeaders';
import { getEliteByIndex, ELITE_FOUR } from '../../data/eliteFour';
import { BADGES } from '../../data/badges';
import { badgeSprite, imgErrorFallback } from '../../data/sprites';

export class GameOverScreen {
  private container: HTMLElement;
  private state: GameState;
  private onRestart: () => void;
  private onLeaderboard: () => void;
  private submitted = false;
  // PB snapshot — must be captured BEFORE autoSubmitScore writes the new entry,
  // otherwise the comparison would always read "tied with the freshly-written record."
  private priorPB: LeaderboardEntry | null = null;
  private isNewBest = false;

  constructor(
    container: HTMLElement,
    state: GameState,
    onRestart: () => void,
    onLeaderboard: () => void
  ) {
    this.container = container;
    this.state = state;
    this.onRestart = onRestart;
    this.onLeaderboard = onLeaderboard;
    this.priorPB = getPersonalBest(state.playerName);
    const newWaves = state.runStats.wavesCleared;
    const priorWaves = this.priorPB?.score_waves ?? 0;
    this.isNewBest = !this.priorPB || newWaves > priorWaves;
  }

  mount(): void {
    this.container.innerHTML = this.renderHTML();
    this.container.style.display = '';
    fadeIn(this.container);
    this.attachEvents();
    this.autoSubmitScore();
    this.loadLeaderboard();
  }

  private renderHTML(): string {
    const s = this.state.runStats;
    const wave = this.state.wave;
    const progress = this.computeProgress();
    const ownedBadges = new Set(this.state.badges ?? []);
    const ownedBadgeList = BADGES.filter(b => ownedBadges.has(b.id));
    const badgeIconsHtml = ownedBadgeList.map(b => {
      const url = badgeSprite(b.id);
      const inner = url
        ? `<img src="${url}" alt="${b.name}" class="badge-pip-sprite" onerror="${imgErrorFallback(b.icon)}" />`
        : `<span class="badge-pip-icon" aria-hidden="true">${b.icon}</span>`;
      return `<span class="badge-pip owned" title="${b.name}" style="--badge-color:${b.color}">${inner}</span>`;
    }).join('');
    const badgeCellHtml = ownedBadgeList.length > 0
      ? `<div class="v"><span class="gover-badge-row">${badgeIconsHtml}</span><span class="gover-badge-count">${ownedBadgeList.length} / ${BADGES.length}</span></div>`
      : `<div class="v">${ownedBadgeList.length} / ${BADGES.length}</div>`;

    const leagueRowHtml = (this.state.badges?.length ?? 0) >= 8
      ? (() => {
          const cleared = this.state.leagueStep ?? 0;
          const cells = ELITE_FOUR.map((step, i) => {
            const status = i < cleared ? 'done' : i === cleared ? 'current' : '';
            return `<span class="gover-league-cell ${status}" title="${step.name}">${step.icon} ${step.name.split(' ')[0]}</span>`;
          }).join('<span class="gover-league-arrow">→</span>');
          return `<div class="stat-row"><div class="k">League progress</div><div class="v"><div class="gover-league-row">${cells}</div></div></div>`;
        })()
      : '';

    return `
      <div class="gover-wrap screen">
        <div class="gover-stamp">RUN ENDED</div>

        <div class="gover-head">
          <div>
            <div class="kicker">Field log · Final entry</div>
            <h2>The last Pokémon fainted on Wave ${wave}.${this.isNewBest ? ` <span class="gover-newbest-pill">★ NEW PERSONAL BEST</span>` : ''}</h2>
            <div class="gover-subhead">${escapeHtml(progress.subheadLabel)}</div>
            ${this.isNewBest ? `<div class="gover-pb-delta">${
              this.priorPB
                ? `Previous best · Wave ${this.priorPB.score_waves} → +${s.wavesCleared - this.priorPB.score_waves} waves`
                : `Your first record — Wave ${s.wavesCleared}.`
            }</div>` : ''}
          </div>
          <div style="font-family:var(--font-mono);font-size:11px;letter-spacing:.18em;color:var(--ink-3);text-transform:uppercase;text-align:right">
            Starter · ${s.starterName}<br/>
            Run · ${this.state.playerName}
          </div>
        </div>

        <div class="gover-body">
          <div class="gover-stats">
            <div class="h">Run stats</div>
            <div class="stat-row"><div class="k">Waves cleared</div><div class="v">${s.wavesCleared}</div></div>
            <div class="stat-row"><div class="k">Act reached</div><div class="v">${escapeHtml(progress.actLabel)}</div></div>
            <div class="stat-row"><div class="k">Badges earned</div>${badgeCellHtml}</div>
            ${leagueRowHtml}
            <div class="stat-row"><div class="k">Total KOs</div><div class="v">${s.totalKOs}</div></div>
            <div class="stat-row"><div class="k">Damage dealt</div><div class="v">${s.totalDamageDealt.toLocaleString()}</div></div>
            <div class="stat-row"><div class="k">Items collected</div><div class="v">${s.itemsCollected}</div></div>
            <div class="stat-row"><div class="k">Perks picked</div><div class="v">${s.perksCollected}</div></div>
            <div class="stat-row"><div class="k">Coins banked</div><div class="v">${this.state.coins.toLocaleString()}¢</div></div>
            <div id="submit-status" style="margin-top:10px;font-family:var(--font-mono);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-3)">Submitting score…</div>
          </div>

          <div class="lb-panel">
            <div class="h">
              <span class="t">Leaderboard</span>
              <span class="s">Top 7 · global</span>
            </div>
            <div class="lb-list" id="lb-list">
              <div style="font-family:var(--font-mono);font-size:11px;color:var(--ink-3);letter-spacing:.15em">Loading…</div>
            </div>
          </div>
        </div>

        <div class="gover-foot">
          <button class="ink-btn ghost" id="copy-btn">Copy results</button>
          <button class="ink-btn ghost" id="leaderboard-btn">Full leaderboard</button>
          <button class="ink-btn primary" id="restart-btn">Start new run →</button>
        </div>
      </div>
    `;
  }

  /**
   * Resolve the player's story progress for display.
   *  - 1..8 (gym): "Act N · LeaderName" + numeric act for the score payload
   *  - badges>=8 in league: "League · StepName" + actReached=9
   *  - leagueStep===5 (champion cleared): "Champion ✓" + actReached=10
   */
  private computeProgress(): {
    actLabel: string;
    subheadLabel: string;
    actReached: number;
  } {
    const badges = this.state.badges?.length ?? 0;
    const leagueStep = this.state.leagueStep ?? 0;
    if (badges >= 8 && leagueStep >= 5) {
      return { actLabel: 'Champion ✓', subheadLabel: 'League · Champion', actReached: 10 };
    }
    if (badges >= 8) {
      const step = getEliteByIndex(leagueStep);
      const name = step?.name ?? `Step ${leagueStep + 1}`;
      return { actLabel: `League · ${name}`, subheadLabel: `League · ${name}`, actReached: 9 };
    }
    const act = this.state.currentAct;
    const leader = getGymForAct(act);
    if (leader) {
      return {
        actLabel: `Act ${act} · ${leader.name}`,
        subheadLabel: `Act ${act} · ${leader.city}`,
        actReached: act,
      };
    }
    return { actLabel: `Act ${act}`, subheadLabel: `Act ${act}`, actReached: act };
  }

  private async autoSubmitScore(): Promise<void> {
    if (this.submitted) return;
    this.submitted = true;
    const statusEl = this.container.querySelector<HTMLElement>('#submit-status');
    const progress = this.computeProgress();

    try {
      await submitScore({
        name: this.state.playerName,
        score_waves: this.state.runStats.wavesCleared,
        score_details: {
          starterName: this.state.runStats.starterName,
          totalKOs: this.state.runStats.totalKOs,
          itemsCollected: this.state.runStats.itemsCollected,
          perksCollected: this.state.runStats.perksCollected,
          totalDamageDealt: this.state.runStats.totalDamageDealt,
          actReached: progress.actReached,
          badgesEarned: this.state.badges?.length ?? 0,
        },
      });
      if (statusEl) statusEl.textContent = '✓ Score submitted';
    } catch {
      if (statusEl) statusEl.textContent = '· Score saved locally';
    }
  }

  private async loadLeaderboard(): Promise<void> {
    const listEl = this.container.querySelector<HTMLElement>('#lb-list');
    if (!listEl) return;

    try {
      const scores = await getTopScores('all_time', 7);
      if (scores.length === 0) {
        listEl.innerHTML = '<div style="font-family:var(--font-mono);font-size:11px;color:var(--ink-3);letter-spacing:.15em">No scores yet.</div>';
        return;
      }
      listEl.innerHTML = scores.map((e, i) => {
        const isMe = e.name === this.state.playerName && e.score_waves === this.state.runStats.wavesCleared;
        return `
          <div class="lb-row${isMe ? ' me' : ''}">
            <div class="rank">${i + 1}.</div>
            <div>
              <div class="n">${escapeHtml(e.name)}</div>
              <div class="sub">Starter · ${escapeHtml(e.score_details?.starterName ?? '—')}</div>
            </div>
            <div class="wv">W${e.score_waves}</div>
          </div>
        `;
      }).join('');
    } catch {
      listEl.innerHTML = '<div style="font-family:var(--font-mono);font-size:11px;color:var(--ink-3);letter-spacing:.15em">Failed to load.</div>';
    }
  }

  private attachEvents(): void {
    this.container.querySelector('#leaderboard-btn')?.addEventListener('click', () => {
      this.onLeaderboard();
    });
    this.container.querySelector('#restart-btn')?.addEventListener('click', () => {
      this.onRestart();
    });
    this.container.querySelector('#copy-btn')?.addEventListener('click', () => {
      const s = this.state.runStats;
      const progress = this.computeProgress();
      const badgesEarned = this.state.badges?.length ?? 0;
      const text = `PokeRun — ${this.state.playerName}\nWaves: ${s.wavesCleared} | Act: ${progress.actLabel} | Badges: ${badgesEarned}/${BADGES.length} | KOs: ${s.totalKOs} | Starter: ${s.starterName}`;
      navigator.clipboard.writeText(text).catch(() => {});
    });
  }

  unmount(): void {
    this.container.style.display = 'none';
    this.container.innerHTML = '';
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
