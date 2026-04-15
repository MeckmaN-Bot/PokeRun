import type { GameState } from '../../types';
import { submitScore } from '../../systems/leaderboard';
import { renderTypeBadges } from '../components/TypeBadge';
import { fadeIn, showToast } from '../animations';

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
  }

  private renderHTML(): string {
    const s = this.state.runStats;
    const team = this.state.team;
    const perks = this.state.activePerks;

    return `
      <div class="gameover-screen screen">
        <div class="gameover-content">
          <div class="gameover-skull">☠️</div>
          <h1 class="gameover-title">GAME OVER</h1>
          <p class="gameover-trainer">${this.state.playerName}</p>

          <!-- Score -->
          <div class="gameover-score-card">
            <div class="gameover-score-main">
              <span class="score-label">WAVES SURVIVED</span>
              <span class="score-value">${s.wavesCleared}</span>
            </div>
            <div class="gameover-score-grid">
              <div class="score-stat">
                <span class="score-stat-val">${s.totalKOs}</span>
                <span class="score-stat-label">KOs</span>
              </div>
              <div class="score-stat">
                <span class="score-stat-val">${s.itemsCollected}</span>
                <span class="score-stat-label">Items</span>
              </div>
              <div class="score-stat">
                <span class="score-stat-val">${s.perksCollected}</span>
                <span class="score-stat-label">Perks</span>
              </div>
              <div class="score-stat">
                <span class="score-stat-val">${s.totalDamageDealt.toLocaleString()}</span>
                <span class="score-stat-label">Damage</span>
              </div>
            </div>
          </div>

          <!-- Starter info -->
          <div class="gameover-starter">
            Started with: <strong>${s.starterName}</strong>
          </div>

          <!-- Final team -->
          <div class="gameover-section">
            <h3 class="gameover-section-title">FINAL TEAM</h3>
            <div class="gameover-team">
              ${team.map(mon => `
                <div class="gameover-pokemon">
                  <img src="${mon.sprite}" alt="${mon.displayName}" class="gameover-sprite" />
                  <div class="gameover-mon-name">${mon.displayName}</div>
                  <div class="gameover-mon-level">Lv.${mon.level}</div>
                  ${renderTypeBadges(mon.types)}
                  ${mon.heldItem ? `<div class="gameover-held-item">${mon.heldItem.icon} ${mon.heldItem.name}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Perks collected -->
          ${perks.length > 0 ? `
            <div class="gameover-section">
              <h3 class="gameover-section-title">PERKS COLLECTED</h3>
              <div class="gameover-perks">
                ${perks.map(p => `
                  <div class="gameover-perk rarity-${p.rarity}" title="${p.description}">
                    ${p.name}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Submit / Leaderboard -->
          <div class="gameover-actions">
            <div class="submit-status" id="submit-status">Submitting score...</div>
            <button class="btn btn-primary btn-lg" id="leaderboard-btn">🏆 VIEW LEADERBOARD</button>
            <button class="btn btn-secondary btn-lg" id="restart-btn">🔄 PLAY AGAIN</button>
          </div>
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
      if (statusEl) {
        statusEl.textContent = '✅ Score submitted!';
        statusEl.style.color = 'var(--success)';
      }
    } catch {
      if (statusEl) {
        statusEl.textContent = '⚠️ Score saved locally';
        statusEl.style.color = 'var(--warning)';
      }
    }
  }

  private attachEvents(): void {
    this.container.querySelector('#leaderboard-btn')?.addEventListener('click', () => {
      this.onLeaderboard();
    });
    this.container.querySelector('#restart-btn')?.addEventListener('click', () => {
      this.onRestart();
    });
  }

  unmount(): void {
    this.container.style.display = 'none';
    this.container.innerHTML = '';
  }
}
