import type { LeaderboardEntry } from '../../types';
import { getTopScores, getLeaderboardStatusMessage } from '../../systems/leaderboard';
import { fadeIn } from '../animations';
import { gsap } from 'gsap';

export class LeaderboardScreen {
  private container: HTMLElement;
  private onBack: () => void;
  private activeFilter: 'all_time' | 'today' = 'all_time';
  private currentPlayerScore: number | null = null;

  constructor(
    container: HTMLElement,
    onBack: () => void,
    currentPlayerScore?: number
  ) {
    this.container = container;
    this.onBack = onBack;
    this.currentPlayerScore = currentPlayerScore ?? null;
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
      <div class="leaderboard-screen screen">
        <div class="leaderboard-header">
          <button class="btn btn-ghost btn-sm back-btn" id="lb-back-btn">← Back</button>
          <h2 class="leaderboard-title">🏆 LEADERBOARD</h2>
          <div class="lb-status">${getLeaderboardStatusMessage()}</div>
        </div>

        <div class="lb-tabs">
          <button class="lb-tab active" data-filter="all_time">ALL TIME</button>
          <button class="lb-tab" data-filter="today">TODAY</button>
        </div>

        <div class="lb-table-wrapper">
          <div class="lb-loading" id="lb-loading">
            <div class="pokeball-spin"></div>
            <p>Loading scores...</p>
          </div>
          <table class="lb-table hidden" id="lb-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Trainer</th>
                <th>Waves</th>
                <th>Starter</th>
                <th>KOs</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody id="lb-body"></tbody>
          </table>
          <div class="lb-empty hidden" id="lb-empty">
            <p>No scores yet — be the first!</p>
          </div>
        </div>
      </div>
    `;
  }

  private async loadScores(): Promise<void> {
    const loadingEl = this.container.querySelector<HTMLElement>('#lb-loading')!;
    const tableEl = this.container.querySelector<HTMLElement>('#lb-table')!;
    const emptyEl = this.container.querySelector<HTMLElement>('#lb-empty')!;
    const tbody = this.container.querySelector<HTMLElement>('#lb-body')!;

    loadingEl.classList.remove('hidden');
    tableEl.classList.add('hidden');
    emptyEl.classList.add('hidden');

    try {
      const scores = await getTopScores(this.activeFilter, 20);

      loadingEl.classList.add('hidden');

      if (scores.length === 0) {
        emptyEl.classList.remove('hidden');
        return;
      }

      tbody.innerHTML = scores.map((entry, i) =>
        this.renderRow(entry, i + 1)
      ).join('');

      tableEl.classList.remove('hidden');

      // Animate rows in
      const rows = Array.from(tbody.querySelectorAll<HTMLElement>('tr'));
      gsap.fromTo(rows,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.3, stagger: 0.04, ease: 'power2.out' }
      );

    } catch {
      loadingEl.classList.add('hidden');
      emptyEl.classList.remove('hidden');
      emptyEl.querySelector('p')!.textContent = 'Failed to load scores.';
    }
  }

  private renderRow(entry: LeaderboardEntry, rank: number): string {
    const isPlayerScore = this.currentPlayerScore !== null &&
      entry.score_waves === this.currentPlayerScore;

    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
    const date = entry.created_at
      ? new Date(entry.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : '—';

    return `
      <tr class="${isPlayerScore ? 'lb-row-highlight' : ''} ${rank <= 3 ? `lb-row-top-${rank}` : ''}">
        <td class="lb-rank">${medal}</td>
        <td class="lb-name">${escapeHtml(entry.name)}</td>
        <td class="lb-waves">${entry.score_waves}</td>
        <td class="lb-starter">${escapeHtml(entry.score_details?.starterName ?? '—')}</td>
        <td class="lb-kos">${entry.score_details?.totalKOs ?? 0}</td>
        <td class="lb-date">${date}</td>
      </tr>
    `;
  }

  private attachEvents(): void {
    this.container.querySelector('#lb-back-btn')?.addEventListener('click', () => {
      this.onBack();
    });

    this.container.querySelectorAll('.lb-tab').forEach(tab => {
      tab.addEventListener('click', async () => {
        const filter = (tab as HTMLElement).dataset['filter'] as 'all_time' | 'today';
        this.activeFilter = filter;
        this.container.querySelectorAll('.lb-tab').forEach(t =>
          t.classList.toggle('active', t === tab)
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
