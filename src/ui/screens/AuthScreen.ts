import { register, login, loginAsGuest, getSession } from '../../systems/auth';
import { fadeIn } from '../animations';
import { sanitizePlayerName } from '../../util/sanitize';

export class AuthScreen {
  private container: HTMLElement;
  private onAuth: (username: string, isGuest: boolean) => void;
  private activeTab: 'signin' | 'register' = 'signin';

  constructor(
    container: HTMLElement,
    onAuth: (username: string, isGuest: boolean) => void
  ) {
    this.container = container;
    this.onAuth = onAuth;
  }

  mount(): void {
    // If already logged in, skip screen
    const session = getSession();
    if (session) {
      this.onAuth(session.username, session.isGuest);
      return;
    }

    this.container.innerHTML = this.renderHTML();
    this.container.style.display = '';
    fadeIn(this.container);
    this.attachEvents();
  }

  private renderHTML(): string {
    return `
      <div class="auth-screen screen">
        <div class="auth-card">
          <div class="auth-eyebrow">Issue 001 · Trainer HQ</div>
          <h1 class="auth-title">TRAINER<br><em>HEAD&shy;QUARTERS</em></h1>

          <!-- Tab strip -->
          <div class="auth-tabs">
            <button class="auth-tab active" data-tab="signin">Sign In</button>
            <button class="auth-tab" data-tab="register">Register</button>
          </div>

          <!-- Error -->
          <div class="auth-error" id="auth-error"></div>

          <!-- Form -->
          <form class="auth-form" id="auth-form" autocomplete="off" novalidate>
            <div class="auth-field">
              <label class="auth-label" for="auth-username">Trainer Name</label>
              <input
                class="auth-input"
                id="auth-username"
                type="text"
                placeholder="Your username…"
                maxlength="24"
                minlength="2"
                pattern="[\p{L}\p{N} _.\-']{2,24}"
                inputmode="text"
                autocomplete="username"
                autocapitalize="none"
                spellcheck="false"
                required
              />
            </div>
            <div class="auth-field">
              <label class="auth-label" for="auth-password">Password</label>
              <input
                class="auth-input"
                id="auth-password"
                type="password"
                placeholder="••••••••"
                maxlength="64"
                autocomplete="current-password"
              />
            </div>
            <div class="auth-field" id="confirm-field" style="display:none">
              <label class="auth-label" for="auth-confirm">Confirm Password</label>
              <input
                class="auth-input"
                id="auth-confirm"
                type="password"
                placeholder="••••••••"
                maxlength="64"
                autocomplete="new-password"
              />
            </div>

            <button type="submit" class="ink-btn primary auth-submit" id="auth-submit">
              Sign In →
            </button>
          </form>

          <!-- Guest divider -->
          <div class="auth-divider">or</div>
          <button class="ink-btn ghost auth-guest" id="guest-btn">
            Play as Guest →
          </button>

          <div class="auth-footer-note">Guest scores are not saved globally</div>
        </div>
      </div>
    `;
  }

  private attachEvents(): void {
    const form        = this.container.querySelector<HTMLFormElement>('#auth-form')!;
    const usernameEl  = this.container.querySelector<HTMLInputElement>('#auth-username')!;
    const passwordEl  = this.container.querySelector<HTMLInputElement>('#auth-password')!;
    const confirmEl   = this.container.querySelector<HTMLInputElement>('#auth-confirm')!;
    const confirmField = this.container.querySelector<HTMLElement>('#confirm-field')!;
    const submitBtn   = this.container.querySelector<HTMLButtonElement>('#auth-submit')!;
    const errorEl     = this.container.querySelector<HTMLElement>('#auth-error')!;
    const guestBtn    = this.container.querySelector<HTMLButtonElement>('#guest-btn')!;

    const showError = (msg: string) => {
      errorEl.textContent = msg;
      errorEl.classList.add('visible');
    };
    const clearError = () => errorEl.classList.remove('visible');

    // Tab switching
    this.container.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const t = (tab as HTMLElement).dataset['tab'] as 'signin' | 'register';
        this.activeTab = t;
        this.container.querySelectorAll('.auth-tab').forEach(b => b.classList.toggle('active', b === tab));
        confirmField.style.display = t === 'register' ? '' : 'none';
        submitBtn.textContent = t === 'register' ? 'Create Account →' : 'Sign In →';
        clearError();
        usernameEl.focus();
      });
    });

    // Form submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearError();

      const username = sanitizePlayerName(usernameEl.value);
      const password = passwordEl.value;
      const confirm  = confirmEl.value;

      if (username.length < 2) {
        showError('Username must be at least 2 characters (letters / numbers / spaces).');
        return;
      }
      if (this.activeTab === 'register' && password.length < 6) {
        showError('Password must be at least 6 characters.');
        return;
      }

      submitBtn.disabled = true;
      const origText = submitBtn.textContent;
      submitBtn.textContent = '…';

      try {
        if (this.activeTab === 'register') {
          if (password !== confirm) {
            showError('Passwords do not match.');
            return;
          }
          const res = await register(username, password);
          if (!res.ok) { showError(res.error); return; }
          this.onAuth(username, false);
        } else {
          const res = await login(username, password);
          if (!res.ok) { showError(res.error); return; }
          this.onAuth(username, false);
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = origText ?? '';
      }
    });

    // Guest
    guestBtn.addEventListener('click', () => {
      loginAsGuest();
      const session = { username: `Guest_${Math.random().toString(36).slice(2,6).toUpperCase()}`, isGuest: true };
      this.onAuth(sanitizePlayerName(session.username), true);
    });

    // Focus username on load
    setTimeout(() => usernameEl.focus(), 80);
  }

  unmount(): void {
    this.container.style.display = 'none';
    this.container.innerHTML = '';
  }
}
