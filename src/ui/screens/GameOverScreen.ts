import type { GameState, LeaderboardEntry } from '../../types';
import { submitScore, getTopScores } from '../../systems/leaderboard';
import { fadeIn } from '../animations';

export class GameOverScreen {
  private container: HTMLElement;
  private state: GameState;
  private onRestart: () => void;
  private onLeaderboard: () => void;
  private submitted = false;

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

    return `
      <div class="gover-wrap screen">
        <div class="gover-stamp">RUN ENDED</div>

        <div class="gover-head">
          <div>
            <div class="kicker">Field log · Final entry</div>
            <h2>The last Pokémon fainted on Wave ${wave}.</h2>
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

  private async autoSubmitScore(): Promise<void> {
    if (this.submitted) return;
    this.submitted = true;
    const statusEl = this.container.querySelector<HTMLElement>('#submit-status');

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
      const text = `PokeRun — ${this.state.playerName}\nWaves: ${s.wavesCleared} | KOs: ${s.totalKOs} | Starter: ${s.starterName}`;
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
