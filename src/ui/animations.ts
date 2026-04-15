import { gsap } from 'gsap';

// ============================================================
// Screen Transitions
// ============================================================

export function fadeIn(el: HTMLElement, duration = 0.4): gsap.core.Tween {
  return gsap.fromTo(el,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration, ease: 'power2.out' }
  );
}

export function fadeOut(el: HTMLElement, duration = 0.3): Promise<void> {
  return new Promise(resolve => {
    gsap.to(el, {
      opacity: 0,
      y: -20,
      duration,
      ease: 'power2.in',
      onComplete: resolve,
    });
  });
}

export function slideInFromRight(el: HTMLElement, duration = 0.4): gsap.core.Tween {
  return gsap.fromTo(el,
    { opacity: 0, x: 100 },
    { opacity: 1, x: 0, duration, ease: 'power3.out' }
  );
}

export function slideInFromLeft(el: HTMLElement, duration = 0.4): gsap.core.Tween {
  return gsap.fromTo(el,
    { opacity: 0, x: -100 },
    { opacity: 1, x: 0, duration, ease: 'power3.out' }
  );
}

export async function transitionScreens(
  outEl: HTMLElement | null,
  inEl: HTMLElement,
  inFn = fadeIn
): Promise<void> {
  if (outEl) await fadeOut(outEl);
  inEl.style.display = '';
  inFn(inEl);
}

// ============================================================
// Floating Damage Numbers
// ============================================================

type DamageType = 'damage' | 'heal' | 'super_effective' | 'not_effective' | 'miss' | 'immune' | 'critical';

export function showDamageNumber(
  targetEl: HTMLElement,
  value: number | string,
  type: DamageType = 'damage'
): void {
  const el = document.createElement('div');
  el.className = 'damage-number';
  el.textContent = typeof value === 'number' ? (type === 'heal' ? `+${value}` : `-${value}`) : value;

  const colorMap: Record<DamageType, string> = {
    damage: '#ef4444',
    heal: '#22c55e',
    super_effective: '#f59e0b',
    not_effective: '#64748b',
    miss: '#94a3b8',
    immune: '#64748b',
    critical: '#ec4899',
  };
  el.style.color = colorMap[type];

  // Position relative to target
  const rect = targetEl.getBoundingClientRect();
  el.style.position = 'fixed';
  el.style.left = `${rect.left + rect.width / 2}px`;
  el.style.top = `${rect.top}px`;
  el.style.transform = 'translateX(-50%)';
  el.style.zIndex = '9999';
  el.style.pointerEvents = 'none';

  document.body.appendChild(el);

  gsap.fromTo(el,
    { y: 0, opacity: 1, scale: 1.2 },
    {
      y: -80,
      opacity: 0,
      scale: 0.8,
      duration: 1.2,
      ease: 'power2.out',
      onComplete: () => el.remove(),
    }
  );
}

// ============================================================
// HP Bar Animation
// ============================================================

export function animateHPBar(
  barFill: HTMLElement,
  labelEl: HTMLElement | null,
  currentHp: number,
  maxHp: number,
  animate = true
): void {
  const pct = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));

  if (animate) {
    gsap.to(barFill, { width: `${pct}%`, duration: 0.5, ease: 'power2.out' });
  } else {
    barFill.style.width = `${pct}%`;
  }

  // Color based on percentage
  let color: string;
  if (pct > 50) color = 'var(--hp-high)';
  else if (pct > 25) color = 'var(--hp-mid)';
  else color = 'var(--hp-low)';

  barFill.style.background = color;

  if (labelEl) {
    labelEl.textContent = `${Math.max(0, currentHp)}/${maxHp}`;
  }
}

// ============================================================
// Pokemon Sprite Attack Animation
// ============================================================

export function attackAnimation(spriteEl: HTMLElement, direction: 'left' | 'right'): Promise<void> {
  const dx = direction === 'right' ? 30 : -30;
  return new Promise(resolve => {
    gsap.timeline({ onComplete: resolve })
      .to(spriteEl, { x: dx, duration: 0.1, ease: 'power2.out' })
      .to(spriteEl, { x: 0, duration: 0.2, ease: 'bounce.out' });
  });
}

export function hitAnimation(spriteEl: HTMLElement): Promise<void> {
  return new Promise(resolve => {
    gsap.timeline({ onComplete: resolve })
      .to(spriteEl, { opacity: 0.2, duration: 0.1 })
      .to(spriteEl, { opacity: 1, duration: 0.1 })
      .to(spriteEl, { opacity: 0.2, duration: 0.1 })
      .to(spriteEl, { opacity: 1, duration: 0.1 });
  });
}

export function faintAnimation(spriteEl: HTMLElement): Promise<void> {
  return new Promise(resolve => {
    gsap.to(spriteEl, {
      y: 80,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.in',
      onComplete: resolve,
    });
  });
}

export function enterAnimation(spriteEl: HTMLElement): gsap.core.Tween {
  return gsap.fromTo(spriteEl,
    { y: 80, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' }
  );
}

// ============================================================
// Reward Card Flip
// ============================================================

export function flipRevealCard(cardEl: HTMLElement, delay = 0): Promise<void> {
  return new Promise(resolve => {
    gsap.timeline({ onComplete: resolve, delay })
      .fromTo(cardEl,
        { rotationY: 90, opacity: 0, scale: 0.9 },
        { rotationY: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)' }
      );
  });
}

export function staggerRevealCards(cards: HTMLElement[]): Promise<void> {
  return new Promise(resolve => {
    let completed = 0;
    cards.forEach((card, i) => {
      flipRevealCard(card, i * 0.15).then(() => {
        completed++;
        if (completed === cards.length) resolve();
      });
    });
  });
}

// ============================================================
// Coin Counter Bounce
// ============================================================

export function animateCoinGain(
  coinEl: HTMLElement,
  from: number,
  to: number
): void {
  const obj = { value: from };
  gsap.to(obj, {
    value: to,
    duration: 0.8,
    ease: 'power2.out',
    onUpdate: () => {
      coinEl.textContent = `${Math.floor(obj.value)}`;
    },
  });
  gsap.fromTo(coinEl,
    { scale: 1.3, color: '#f59e0b' },
    { scale: 1, color: '', duration: 0.6, ease: 'elastic.out(1, 0.5)' }
  );
}

// ============================================================
// Shake (for misses, status immunities)
// ============================================================

export function shakeElement(el: HTMLElement): void {
  gsap.fromTo(el,
    { x: -8 },
    { x: 0, duration: 0.4, ease: 'elastic.out(5, 0.3)' }
  );
}

// ============================================================
// Pulse (for status effects, critical hits)
// ============================================================

export function pulseElement(el: HTMLElement, color = '#f59e0b'): void {
  gsap.fromTo(el,
    { boxShadow: `0 0 20px ${color}` },
    { boxShadow: '0 0 0px transparent', duration: 0.8, ease: 'power2.out' }
  );
}

// ============================================================
// Wave intro
// ============================================================

export function waveIntroAnimation(el: HTMLElement): Promise<void> {
  return new Promise(resolve => {
    gsap.timeline({ onComplete: resolve })
      .fromTo(el,
        { scale: 2, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'power3.out' }
      )
      .to(el, { scale: 1.05, duration: 0.2 })
      .to(el, { scale: 1, duration: 0.2 })
      .to(el, { opacity: 0, y: -20, delay: 0.5, duration: 0.3 });
  });
}

// ============================================================
// Type-specific Attack Particle Effect
// ============================================================

const TYPE_COLORS: Record<string, [string, string]> = {
  fire:     ['#f97316', '#ef4444'],
  water:    ['#38bdf8', '#3b82f6'],
  grass:    ['#4ade80', '#22c55e'],
  electric: ['#fde047', '#f59e0b'],
  ice:      ['#bae6fd', '#7dd3fc'],
  psychic:  ['#f472b6', '#ec4899'],
  ghost:    ['#a78bfa', '#7c3aed'],
  dragon:   ['#818cf8', '#6366f1'],
  dark:     ['#94a3b8', '#475569'],
  fighting: ['#f87171', '#dc2626'],
  poison:   ['#c084fc', '#a855f7'],
  rock:     ['#d6d3d1', '#a8a29e'],
  ground:   ['#fbbf24', '#d97706'],
  steel:    ['#e2e8f0', '#94a3b8'],
  fairy:    ['#f9a8d4', '#f472b6'],
  bug:      ['#a3e635', '#84cc16'],
  flying:   ['#93c5fd', '#60a5fa'],
  normal:   ['#e2e8f0', '#94a3b8'],
};

export function showTypeAttackEffect(
  type: string,
  attackerEl: HTMLElement,
  defenderEl: HTMLElement,
): Promise<void> {
  const [color1, color2] = TYPE_COLORS[type] ?? ['#e2e8f0', '#94a3b8'];

  const aRect = attackerEl.getBoundingClientRect();
  const dRect = defenderEl.getBoundingClientRect();

  const startX = aRect.left + aRect.width / 2;
  const startY = aRect.top + aRect.height / 2;
  const endX   = dRect.left + dRect.width / 2;
  const endY   = dRect.top  + dRect.height / 2;

  const PARTICLE_COUNT = 7;
  const particles: HTMLElement[] = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const el = document.createElement('div');
    el.className = 'type-particle';
    const size = 7 + Math.random() * 9;
    el.style.width  = `${size}px`;
    el.style.height = `${size}px`;
    el.style.background  = i % 2 === 0 ? color1 : color2;
    el.style.boxShadow   = `0 0 ${size + 4}px ${color1}`;
    el.style.left = `${startX}px`;
    el.style.top  = `${startY}px`;
    document.body.appendChild(el);
    particles.push(el);
  }

  return new Promise(resolve => {
    let completed = 0;
    particles.forEach((el, i) => {
      const spread = 28;
      const offsetX = (Math.random() - 0.5) * spread;
      const offsetY = (Math.random() - 0.5) * spread;
      gsap.fromTo(el,
        { x: 0, y: 0, opacity: 1, scale: 1 },
        {
          x: endX - startX + offsetX,
          y: endY - startY + offsetY,
          opacity: 0,
          scale: 0.25,
          duration: 0.3 + i * 0.04,
          delay: i * 0.035,
          ease: 'power2.in',
          onComplete: () => {
            el.remove();
            completed++;
            if (completed === PARTICLE_COUNT) resolve();
          },
        }
      );
    });
  });
}

// ============================================================
// Toast Notification
// ============================================================

export function showToast(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  gsap.fromTo(toast,
    { x: 100, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }
  );

  setTimeout(() => {
    gsap.to(toast, {
      x: 100,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => toast.remove(),
    });
  }, 3000);
}
