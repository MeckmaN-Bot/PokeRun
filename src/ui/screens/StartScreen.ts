import type { GameState } from '../../types';
import { STARTERS } from '../../data/enemyPools';
import { fetchPokemon } from '../../api/pokeapi';
import { getStaticSprite } from '../../api/sprites';
import { renderTypeBadges } from '../components/TypeBadge';
import { fadeIn, showToast } from '../animations';
import { toBattlePokemon } from '../../systems/battle';

const STORAGE_KEY = 'pokerun_player_name';

interface StarterDisplay {
  id: number;
  name: string;
  displayName: string;
  sprite: string;
  types?: string[];
  bst?: number;
}

export class StartScreen {
  private container: HTMLElement;
  private onStart: (state: GameState) => void;
  private starterData: StarterDisplay[] = STARTERS.map(s => ({
    id: s.id,
    name: s.name,
    displayName: s.displayName,
    sprite: getStaticSprite(s.id),
  }));
  private selectedStarterIndex = 0;
  private playerName = '';

  constructor(container: HTMLElement, onStart: (state: GameState) => void) {
    this.container = container;
    this.onStart = onStart;
  }

  async mount(): Promise<void> {
    // Restore saved name before rendering so the input can be pre-filled
    this.playerName = localStorage.getItem(STORAGE_KEY) ?? '';
    this.container.innerHTML = this.renderHTML();
    this.container.style.display = '';
    fadeIn(this.container);
    this.attachEvents();
    this.loadStarterData();
  }

  private async loadStarterData(): Promise<void> {
    // Fetch starter data in background
    for (let i = 0; i < STARTERS.length; i++) {
      try {
        const pokemon = await fetchPokemon(STARTERS[i].id, 5);
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
            typeEl.innerHTML = renderTypeBadges(pokemon.types);
          }
          if (bstEl && pokemon.bst) {
            bstEl.textContent = `BST: ${pokemon.bst}`;
          }
        }
      } catch {
        // keep default
      }
    }
  }

  private renderHTML(): string {
    return `
      <div class="start-screen screen">
        <div class="start-bg-particles"></div>
        <div class="start-content">
          <div class="game-logo">
            <div class="logo-subtitle">⚔️ ROGUELITE WAVE SURVIVAL ⚔️</div>
            <h1 class="logo-title">POKÉMON<br><span class="logo-gauntlet">GAUNTLET</span></h1>
            <div class="logo-tagline">Survive the endless waves. Build the ultimate team.</div>
          </div>

          <div class="start-form">
            <div class="name-input-group">
              <label for="player-name" class="form-label">TRAINER NAME</label>
              <input
                id="player-name"
                type="text"
                class="name-input"
                placeholder="Enter your name..."
                maxlength="20"
                autocomplete="off"
                value="${this.playerName}"
              />
            </div>

            <div class="starter-section">
              <h2 class="starter-heading">CHOOSE YOUR STARTER</h2>
              <div class="starter-grid">
                ${this.starterData.map((s, i) => `
                  <div
                    class="starter-card ${i === this.selectedStarterIndex ? 'selected' : ''}"
                    data-starter="${i}"
                    role="button"
                    tabindex="0"
                  >
                    <img class="starter-sprite" src="${s.sprite}" alt="${s.displayName}" />
                    <div class="starter-name">${s.displayName}</div>
                    <div class="starter-types"><!-- loaded async --></div>
                    <div class="starter-bst">Loading...</div>
                  </div>
                `).join('')}
              </div>
            </div>

            <button class="btn btn-primary btn-start" id="start-btn" ${this.playerName.length > 0 ? '' : 'disabled'}>
              START GAUNTLET
            </button>
          </div>

          <div class="start-footer">
            <button class="btn btn-ghost" id="leaderboard-btn">🏆 LEADERBOARD</button>
            <button class="btn btn-ghost" id="howtoplay-btn">❓ HOW TO PLAY</button>
            <button class="btn btn-ghost" id="settings-btn">⚙️ SETTINGS</button>
          </div>
        </div>

        <!-- Settings Modal -->
        <div class="modal-overlay hidden" id="settings-modal">
          <div class="modal">
            <button class="modal-close" id="close-settings">✕</button>
            <h2 class="modal-title">⚙️ SETTINGS</h2>
            <div style="padding: 0.5rem 0 1rem;">
              <p style="color: var(--text-muted); margin-bottom: 1rem; font-size: 0.9rem;">
                Saved trainer: <strong style="color: var(--text)">${this.playerName || '—'}</strong>
              </p>
              <button class="btn btn-secondary btn-sm" id="clear-name-btn">
                🚪 Clear Saved Name
              </button>
            </div>
          </div>
        </div>

        <!-- How to Play Modal -->
        <div class="modal-overlay hidden" id="howtoplay-modal">
          <div class="modal">
            <button class="modal-close" id="close-howtoplay">✕</button>
            <h2 class="modal-title">HOW TO PLAY</h2>
            <div class="howtoplay-content">
              <div class="howtoplay-section">
                <h3>🎮 Objective</h3>
                <p>Survive as many waves of enemy Pokémon as possible. Your score = waves cleared.</p>
              </div>
              <div class="howtoplay-section">
                <h3>⚔️ Battle</h3>
                <p>Turn-based battles. Choose a move or enable Auto-Battle. Type effectiveness matters!</p>
                <p>Turn order is determined by Speed. Faster Pokémon moves first.</p>
              </div>
              <div class="howtoplay-section">
                <h3>🎁 Rewards</h3>
                <p>After each wave, choose 1 of 3 rewards: new Pokémon, team perk, or item.</p>
                <p>Rarities: Common → Rare → Epic → Legendary. Every 5 waves is a Boss Wave with better loot!</p>
              </div>
              <div class="howtoplay-section">
                <h3>🛒 Shop</h3>
                <p>Spend coins earned from waves. Buy held items and consumables to strengthen your team.</p>
              </div>
              <div class="howtoplay-section">
                <h3>💡 Tips</h3>
                <ul>
                  <li>Type matchups are crucial — build a diverse team</li>
                  <li>Held items stack with team perks for powerful combos</li>
                  <li>Save Full Restores and Revives for boss waves</li>
                  <li>Auto-Battle is good, but manual play lets you use Z-moves strategically</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private attachEvents(): void {
    const nameInput = this.container.querySelector<HTMLInputElement>('#player-name')!;
    const startBtn = this.container.querySelector<HTMLButtonElement>('#start-btn')!;
    const leaderboardBtn = this.container.querySelector('#leaderboard-btn')!;
    const howtoplayBtn = this.container.querySelector('#howtoplay-btn')!;
    const howtoplayModal = this.container.querySelector('#howtoplay-modal')!;
    const closeHowtoplay = this.container.querySelector('#close-howtoplay')!;
    const settingsBtn = this.container.querySelector('#settings-btn')!;
    const settingsModal = this.container.querySelector('#settings-modal')!;
    const closeSettings = this.container.querySelector('#close-settings')!;
    const clearNameBtn = this.container.querySelector('#clear-name-btn')!;

    nameInput.addEventListener('input', () => {
      this.playerName = nameInput.value.trim();
      startBtn.disabled = this.playerName.length === 0;
    });

    nameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && this.playerName.length > 0) startBtn.click();
    });

    // Starter selection
    this.container.querySelectorAll('[data-starter]').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt((card as HTMLElement).dataset['starter'] ?? '0');
        this.selectedStarterIndex = idx;
        this.container.querySelectorAll('[data-starter]').forEach((c, i) => {
          c.classList.toggle('selected', i === idx);
        });
      });
      card.addEventListener('keydown', e => {
        if ((e as KeyboardEvent).key === 'Enter') (card as HTMLElement).click();
      });
    });

    startBtn.addEventListener('click', () => this.handleStart());

    leaderboardBtn.addEventListener('click', () => {
      // Signal to show leaderboard
      this.container.dispatchEvent(new CustomEvent('show-leaderboard'));
    });

    howtoplayBtn.addEventListener('click', () => howtoplayModal.classList.remove('hidden'));
    closeHowtoplay.addEventListener('click', () => howtoplayModal.classList.add('hidden'));
    howtoplayModal.addEventListener('click', e => {
      if (e.target === howtoplayModal) howtoplayModal.classList.add('hidden');
    });

    // Settings
    settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    closeSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));
    settingsModal.addEventListener('click', e => {
      if (e.target === settingsModal) settingsModal.classList.add('hidden');
    });
    clearNameBtn.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY);
      this.playerName = '';
      nameInput.value = '';
      startBtn.disabled = true;
      settingsModal.classList.add('hidden');
      showToast('Saved name cleared.', 'info');
    });
  }

  private async handleStart(): Promise<void> {
    const starter = this.starterData[this.selectedStarterIndex];
    const startBtn = this.container.querySelector<HTMLButtonElement>('#start-btn')!;
    startBtn.disabled = true;
    startBtn.textContent = 'Loading...';

    // Persist the trainer name so it survives page reloads / run resets
    localStorage.setItem(STORAGE_KEY, this.playerName);

    try {
      const pokemon = await fetchPokemon(starter.id, 5);

      const battlePokemon = toBattlePokemon(pokemon, []);

      const initialState: GameState = {
        phase: 'wave_intro',
        playerName: this.playerName,
        wave: 1,
        coins: 100,
        team: [battlePokemon],
        inventory: [],
        activePerks: [],
        battleState: null,
        pendingRewards: [],
        shopItems: [],
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
      };

      this.onStart(initialState);
    } catch (err) {
      startBtn.disabled = false;
      startBtn.textContent = 'START GAUNTLET';
      console.error('Failed to load starter:', err);
    }
  }

  unmount(): void {
    this.container.style.display = 'none';
    this.container.innerHTML = '';
  }
}
