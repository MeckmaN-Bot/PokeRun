import type { LeaderboardEntry } from '../../types';
import { getTopScores, getLeaderboardStatusMessage } from '../../systems/leaderboard';
import { fadeIn } from '../animations';
import { gsap } from 'gsap';
import { formatAct, formatBadges } from '../../util/runProgress';
import { getDeckName } from '../../systems/decks';

export class LeaderboardScreen {
  private container: HTMLElement;
  private onBack: () => void;
  private activeFilter: 'all_time' | 'today' = 'all_time';
  private currentPlayerScore: number | null = null;
  private currentPlayerName: string | null = null;

  constructor(
    container: HTMLElement,
    onBack: () => void,
    currentPlayerScore?: number,
    currentPlayerName?: string
  ) {
    this.container = container;
    this.onBack = onBack;
    this.currentPlayerScore = currentPlayerScore ?? null;
    this.currentPlayerName = currentPlayerName ?? null;
  }

  async mount(): Promise<void> {
    this.container.innerHTML = this.renderShell();
    this.container.style.display = '';
    fadeIn(this.container);
    this.attachEvents();
    await this.loadScores();
  }

  private renderShell(): string {
    return `
      <div class="lb-full-wrap screen">
        <div class="lb-full-head">
          <div>
            <div class="kicker">Field records · Global</div>
            <h2 class="lb-full-title">Leader<em>board</em></h2>
          </div>
          <div class="lb-full-head-right">
            <div class="lb-filter-strip" id="lb-filter-strip">
              <button class="lb-filter active" data-filter="all_time">All time</button>
              <button class="lb-filter" data-filter="today">Today</button>
            </div>
            <button class="ink-btn ghost sm" id="lb-back-btn">← Back</button>
          </div>
        </div>

        <div class="lb-full-body">
          <div class="lb-panel lb-full-panel">
            <div class="h">
              <span class="t" id="lb-panel-title">All-time top runs</span>
              <span class="s" id="lb-status">${getLeaderboardStatusMessage()}</span>
            </div>
            <div class="lb-full-cols">
              <div class="lb-col-head">
                <span>#</span>
                <span>Trainer</span>
                <span>Waves</span>
                <span>Starter</span>
                <span>KOs</span>
                <span>Act</span>
                <span>Badges</span>
                <span>Date</span>
              </div>
              <div class="lb-list" id="lb-list">
                <div class="lb-loading-row" id="lb-loading">
                  <span style="font-family:var(--font-mono);font-size:11px;letter-spacing:.2em;color:var(--ink-3)">Loading scores…</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private async loadScores(): Promise<void> {
    const listEl = this.container.querySelector<HTMLElement>('#lb-list')!;

    listEl.innerHTML = `<div class="lb-loading-row"><span style="font-family:var(--font-mono);font-size:11px;letter-spacing:.2em;color:var(--ink-3)">Loading scores…</span></div>`;

    const titleEl = this.container.querySelector<HTMLElement>('#lb-panel-title');
    if (titleEl) {
      titleEl.textContent = this.activeFilter === 'today' ? "Today's top runs" : 'All-time top runs';
    }

    try {
      const scores = await getTopScores(this.activeFilter, 20);

      if (scores.length === 0) {
        listEl.innerHTML = `<div class="lb-loading-row"><span style="font-family:var(--font-mono);font-size:11px;letter-spacing:.2em;color:var(--ink-3)">No scores yet — be the first!</span></div>`;
        return;
      }

      listEl.innerHTML = scores.map((entry, i) => this.renderRow(entry, i + 1)).join('');

      // Stagger rows in
      const rows = Array.from(listEl.querySelectorAll<HTMLElement>('.lb-row'));
      gsap.fromTo(rows,
        { opacity: 0, x: -16 },
        { opacity: 1, x: 0, duration: 0.25, stagger: 0.035, ease: 'power2.out' }
      );

    } catch {
      listEl.innerHTML = `<div class="lb-loading-row"><span style="font-family:var(--font-mono);font-size:11px;letter-spacing:.2em;color:var(--oxblood)">Failed to load scores.</span></div>`;
    }
  }

  private renderRow(entry: LeaderboardEntry, rank: number): string {
    const isMe = this.currentPlayerName != null &&
      entry.name === this.currentPlayerName &&
      (this.currentPlayerScore == null || entry.score_waves === this.currentPlayerScore);

    const date = entry.created_at
      ? new Date(entry.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : '—';

    const deckName = getDeckName(entry.score_details?.deck);
    const deckPill = deckName ? `<span class="lb-deck-pill">${escapeHtml(deckName)}</span>` : '';
    return `
      <div class="lb-row lb-full-row${isMe ? ' me' : ''}">
        <div class="rank">${rank}.</div>
        <div>
          <div class="n">${escapeHtml(entry.name)}${deckPill}</div>
          <div class="sub">Starter · ${escapeHtml(entry.score_details?.starterName ?? '—')}</div>
        </div>
        <div class="wv">W${entry.score_waves ?? 0}</div>
        <div class="lb-cell-starter">${escapeHtml(entry.score_details?.starterName ?? '—')}</div>
        <div class="lb-cell-kos">${entry.score_details?.totalKOs ?? 0}</div>
        <div class="lb-cell-act">${formatAct(entry.score_details?.actReached, entry.score_details?.endless)}</div>
        <div class="lb-cell-badges">${formatBadges(entry.score_details?.badgesEarned)}</div>
        <div class="lb-cell-date">${date}</div>
      </div>
    `;
  }

  private attachEvents(): void {
    this.container.querySelector('#lb-back-btn')?.addEventListener('click', () => {
      this.onBack();
    });

    this.container.querySelectorAll('.lb-filter').forEach(btn => {
      btn.addEventListener('click', async () => {
        const filter = (btn as HTMLElement).dataset['filter'] as 'all_time' | 'today';
        this.activeFilter = filter;
        this.container.querySelectorAll('.lb-filter').forEach(b =>
          b.classList.toggle('active', b === btn)
        );
        await this.loadScores();
      });
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

