import { gsap } from 'gsap';

// ============================================================
// Screen Transitions
// ============================================================

export function fadeIn(el: HTMLElement, duration = 0.4): gsap.core.Tween {
  return gsap.fromTo(el,
    { opacity: 0, y: 20 },
    {
      opacity: 1, y: 0, duration, ease: 'power2.out',
      // Clear inline transform once the fade is done — otherwise GSAP leaves
      // `transform: translate(0,0)` on the element, which makes it the
      // containing block for descendant `position: fixed` children. That
      // breaks the mobile shop drawer (it ends up clipped to .shop-wrap).
      clearProps: 'transform',
    },
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
  el.className = 'damage-number battle-vfx';

  const colorMap: Record<DamageType, string> = {
    damage: '#b4352a',         // oxblood
    heal: '#5f7a3a',           // moss
    super_effective: '#c9962b', // gold
    not_effective: '#8a7e6b',  // ink-4
    miss: '#8a7e6b',
    immune: '#8a7e6b',
    critical: '#7a3a9a',       // plum
  };

  const isCrit = type === 'critical';
  const isSuperEff = type === 'super_effective';

  if (typeof value === 'number') {
    el.textContent = type === 'heal' ? `+${value}` : `-${value}`;
  } else {
    el.textContent = value;
  }

  el.style.color = colorMap[type];
  if (isCrit || isSuperEff) el.style.fontSize = '1.35rem';

  const rect = targetEl.getBoundingClientRect();
  el.style.position = 'fixed';
  el.style.left = `${rect.left + rect.width / 2}px`;
  el.style.top = `${rect.top + rect.height * 0.2}px`;
  el.style.transform = 'translateX(-50%)';
  el.style.zIndex = '9999';
  el.style.pointerEvents = 'none';

  document.body.appendChild(el);

  gsap.fromTo(el,
    { y: 0, opacity: 1, scale: isCrit ? 1.5 : 1.2 },
    {
      y: -90,
      opacity: 0,
      scale: 0.9,
      duration: 1.4,
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
  const dx = direction === 'right' ? 36 : -36;
  return new Promise(resolve => {
    const t = setTimeout(resolve, 800);
    gsap.timeline({ onComplete: () => { clearTimeout(t); resolve(); } })
      // Wind-up: pull back slightly
      .to(spriteEl, { x: -dx * 0.2, duration: 0.07, ease: 'power2.out' })
      // Lunge forward
      .to(spriteEl, { x: dx, duration: 0.11, ease: 'power3.in' })
      // Snap back
      .to(spriteEl, { x: 0, duration: 0.28, ease: 'elastic.out(1.4, 0.35)' });
  });
}

export function hitAnimation(spriteEl: HTMLElement): Promise<void> {
  return new Promise(resolve => {
    const t = setTimeout(resolve, 800);
    gsap.timeline({ onComplete: () => { clearTimeout(t); resolve(); } })
      .to(spriteEl, { opacity: 0.1, duration: 0.07 })
      .to(spriteEl, { opacity: 1, duration: 0.07 })
      .to(spriteEl, { opacity: 0.1, duration: 0.07 })
      .to(spriteEl, { opacity: 1, duration: 0.07 })
      .to(spriteEl, { opacity: 0.1, duration: 0.05 })
      .to(spriteEl, { opacity: 1, duration: 0.07 });
  });
}

export function faintAnimation(spriteEl: HTMLElement): Promise<void> {
  return new Promise(resolve => {
    const t = setTimeout(resolve, 1200);
    gsap.timeline({ onComplete: () => { clearTimeout(t); resolve(); } })
      .to(spriteEl, { y: 10, duration: 0.15, ease: 'power2.in' })
      .to(spriteEl, { y: 100, opacity: 0, rotation: -15, duration: 0.55, ease: 'power3.in' });
  });
}

export function enterAnimation(spriteEl: HTMLElement, flipX = false): gsap.core.Tween {
  const sx = flipX ? -1 : 1;
  return gsap.fromTo(spriteEl,
    { y: 60, opacity: 0, scaleX: flipX ? -0.8 : 0.8, scaleY: 0.8 },
    { y: 0, opacity: 1, scaleX: sx, scaleY: 1, duration: 0.45, ease: 'back.out(1.7)' }
  );
}

// ============================================================
// Reward Card Flip
// ============================================================

export function staggerRevealCards(cards: HTMLElement[]): Promise<void> {
  return new Promise(resolve => {
    if (cards.length === 0) { resolve(); return; }
    const staggerMs = 130;
    const durationMs = 560;
    cards.forEach((card, i) => {
      card.style.animationDelay = `${i * staggerMs}ms`;
      card.classList.add('card-dealing');
    });
    const total = (cards.length - 1) * staggerMs + durationMs + 40;
    setTimeout(resolve, total);
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
      coinEl.textContent = Math.floor(obj.value).toLocaleString();
    },
  });
  gsap.fromTo(coinEl,
    { scale: 1.3, color: '#ffd700' },
    { scale: 1, color: '', duration: 0.6, ease: 'elastic.out(1, 0.5)' }
  );
}

// ============================================================
// Shake (for misses, status immunities)
// ============================================================

export function shakeElement(el: HTMLElement): void {
  gsap.fromTo(el,
    { x: -10 },
    { x: 0, duration: 0.5, ease: 'elastic.out(6, 0.3)' }
  );
}

// ============================================================
// Pulse (for status effects, critical hits)
// ============================================================

export function pulseElement(el: HTMLElement, color = '#f59e0b'): void {
  gsap.fromTo(el,
    { boxShadow: `0 0 30px ${color}` },
    { boxShadow: '0 0 0px transparent', duration: 0.9, ease: 'power2.out' }
  );
}

// ============================================================
// Wave intro
// ============================================================

export function waveIntroAnimation(el: HTMLElement, opts?: { hasTag?: boolean }): Promise<void> {
  const hold = opts?.hasTag ? 2.4 : 0.55;
  const fallback = opts?.hasTag ? 5200 : 3000;
  return new Promise(resolve => {
    const t = setTimeout(resolve, fallback);
    gsap.timeline({ onComplete: () => { clearTimeout(t); resolve(); } })
      .fromTo(el,
        { scale: 2.5, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'power3.out' }
      )
      .to(el, { scale: 1.04, duration: 0.18 })
      .to(el, { scale: 1, duration: 0.18 })
      .to(el, { opacity: 0, y: -30, delay: hold, duration: 0.3, ease: 'power2.in' });
  });
}

/**
 * Full-screen boss-warn VFX — shown before a boss wave intro.
 * Red-tinted scanlines, shaking WARN banner, audio-hint pulsing dots.
 * Returns after the sequence completes (~2.2s).
 */
export function bossWarnAnimation(blindName?: string, blindColor?: string): Promise<void> {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'boss-warn-overlay';
    const color = blindColor ?? '#a32323';
    overlay.innerHTML = `
      <div class="bw-scanlines" style="--bw-color:${color}"></div>
      <div class="bw-vignette"></div>
      <div class="bw-stripes"></div>
      <div class="bw-center">
        <div class="bw-warn-row">
          <span class="bw-tri">◤</span>
          <span class="bw-text">WARNING</span>
          <span class="bw-tri bw-tri-r">◥</span>
        </div>
        <div class="bw-sub">Boss encounter approaching</div>
        ${blindName ? `<div class="bw-blind" style="--bw-color:${color}">${blindName}</div>` : ''}
        <div class="bw-dots"><i></i><i></i><i></i></div>
      </div>
    `;
    document.body.appendChild(overlay);

    const cleanup = () => {
      overlay.remove();
      resolve();
    };

    const t = setTimeout(cleanup, 2600);

    gsap.timeline({
      onComplete: () => { clearTimeout(t); cleanup(); },
    })
      .fromTo(overlay,
        { opacity: 0 },
        { opacity: 1, duration: 0.18, ease: 'power2.out' })
      .fromTo(overlay.querySelector('.bw-center'),
        { scale: 0.6, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: 'back.out(2)' }, '-=0.05')
      .to(overlay.querySelector('.bw-text'),
        { x: '+=4', yoyo: true, repeat: 7, duration: 0.05, ease: 'none' })
      .to(overlay, { opacity: 0, duration: 0.3, ease: 'power2.in' }, '+=1.1');
  });
}

// ============================================================
// Type ink palette — muted to match paper/ink design
// ============================================================

const TYPE_INK: Record<string, string> = {
  fire:     '#c84a1a',
  water:    '#2b5fa8',
  grass:    '#5f7a3a',
  electric: '#d4a312',
  ice:      '#6a9ebd',
  psychic:  '#c74a7a',
  ghost:    '#4a3a7a',
  dragon:   '#3a4a9a',
  dark:     '#3a2e22',
  fighting: '#a64223',
  poison:   '#7a3a9a',
  rock:     '#8a7a4a',
  ground:   '#a6753a',
  steel:    '#7a8090',
  fairy:    '#c47090',
  bug:      '#8a9a3a',
  flying:   '#7a8ab0',
  normal:   '#8a7e6b',
};

// ============================================================
// Ink Brushstroke Attack — paper/woodblock print style
// ============================================================

// Pixel-art type VFX: shapes are clip-path polygons rendered as solid
// flat divs (no glow, no blur, no gradients). Particles fly in an arc
// from attacker to defender along a quadratic Bézier path.

type ShapeKey =
  | 'leaf' | 'vine' | 'ember' | 'droplet' | 'flake' | 'sparkle'
  | 'chunk' | 'shard' | 'feather' | 'wisp' | 'bubble' | 'gear'
  | 'fist' | 'claw' | 'star' | 'spark';

const SHAPE_CLIP: Record<ShapeKey, string> = {
  leaf:    'polygon(50% 0%, 100% 35%, 80% 100%, 50% 90%, 20% 100%, 0% 35%)',
  vine:    'polygon(0% 40%, 60% 0%, 100% 30%, 80% 100%, 30% 90%)',
  ember:   'polygon(50% 0%, 90% 30%, 80% 70%, 100% 100%, 50% 80%, 0% 100%, 20% 70%, 10% 30%)',
  droplet: 'polygon(50% 0%, 90% 50%, 80% 100%, 20% 100%, 10% 50%)',
  flake:   'polygon(45% 0%, 55% 0%, 55% 35%, 100% 35%, 100% 55%, 55% 65%, 55% 100%, 45% 100%, 45% 65%, 0% 55%, 0% 45%, 45% 35%)',
  sparkle: 'polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%)',
  chunk:   'polygon(20% 0%, 80% 10%, 100% 50%, 80% 100%, 30% 90%, 0% 60%)',
  shard:   'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  feather: 'polygon(0% 50%, 30% 0%, 70% 20%, 100% 50%, 70% 80%, 30% 100%)',
  wisp:    'polygon(20% 0%, 80% 20%, 100% 60%, 70% 100%, 30% 90%, 0% 50%)',
  bubble:  'polygon(50% 0%, 80% 20%, 100% 50%, 80% 80%, 50% 100%, 20% 80%, 0% 50%, 20% 20%)',
  gear:    'polygon(40% 0%, 60% 0%, 70% 20%, 100% 30%, 100% 70%, 70% 80%, 60% 100%, 40% 100%, 30% 80%, 0% 70%, 0% 30%, 30% 20%)',
  fist:    'polygon(20% 10%, 80% 10%, 90% 40%, 100% 50%, 90% 60%, 80% 90%, 20% 90%, 10% 60%, 0% 50%, 10% 40%)',
  claw:    'polygon(0% 0%, 30% 10%, 60% 30%, 100% 80%, 90% 100%, 60% 80%, 30% 50%, 10% 30%)',
  star:    'polygon(50% 0%, 62% 35%, 100% 38%, 70% 60%, 80% 100%, 50% 76%, 20% 100%, 30% 60%, 0% 38%, 38% 35%)',
  spark:   'polygon(50% 0%, 55% 45%, 100% 50%, 55% 55%, 50% 100%, 45% 55%, 0% 50%, 45% 45%)',
};

interface TypeFxConfig {
  shape: ShapeKey;
  count: number;
  size: [number, number];     // min, max in px
  arcHeight: number;          // px above straight line
  staggerMs: number;
  spinDeg: number;            // additional rotation during travel
  travelMs: number;
  /** If true: skip the arc projectile and play a strike/impact-only effect. */
  strike?: 'lightning' | 'pulse' | 'rays' | null;
  /** Outline color for two-tone pixel look. Defaults to type ink. */
  outline?: string;
}

const TYPE_FX: Record<string, TypeFxConfig> = {
  grass:    { shape: 'leaf',    count: 5, size: [10, 16], arcHeight: 70, staggerMs: 28, spinDeg: 220, travelMs: 360 },
  fire:     { shape: 'ember',   count: 6, size: [10, 14], arcHeight: 50, staggerMs: 22, spinDeg: 360, travelMs: 320 },
  water:    { shape: 'droplet', count: 5, size: [9, 13],  arcHeight: 55, staggerMs: 24, spinDeg: 90,  travelMs: 320 },
  ice:      { shape: 'flake',   count: 5, size: [10, 14], arcHeight: 60, staggerMs: 26, spinDeg: 360, travelMs: 360 },
  electric: { shape: 'spark',   count: 0, size: [0, 0],   arcHeight: 0,  staggerMs: 0,  spinDeg: 0,   travelMs: 0,   strike: 'lightning' },
  psychic:  { shape: 'star',    count: 0, size: [0, 0],   arcHeight: 0,  staggerMs: 0,  spinDeg: 0,   travelMs: 0,   strike: 'pulse' },
  ghost:    { shape: 'wisp',    count: 4, size: [12, 18], arcHeight: 80, staggerMs: 36, spinDeg: 90,  travelMs: 420 },
  dragon:   { shape: 'claw',    count: 3, size: [16, 22], arcHeight: 35, staggerMs: 18, spinDeg: 0,   travelMs: 280 },
  dark:     { shape: 'chunk',   count: 5, size: [10, 14], arcHeight: 30, staggerMs: 22, spinDeg: 180, travelMs: 320 },
  fighting: { shape: 'fist',    count: 3, size: [16, 22], arcHeight: 20, staggerMs: 14, spinDeg: 0,   travelMs: 240 },
  poison:   { shape: 'bubble',  count: 5, size: [9, 14],  arcHeight: 65, staggerMs: 26, spinDeg: 60,  travelMs: 360 },
  rock:     { shape: 'chunk',   count: 4, size: [12, 18], arcHeight: 90, staggerMs: 24, spinDeg: 270, travelMs: 380 },
  ground:   { shape: 'chunk',   count: 4, size: [12, 18], arcHeight: 30, staggerMs: 20, spinDeg: 200, travelMs: 320 },
  steel:    { shape: 'gear',    count: 4, size: [11, 15], arcHeight: 28, staggerMs: 18, spinDeg: 360, travelMs: 280 },
  fairy:    { shape: 'sparkle', count: 6, size: [9, 13],  arcHeight: 45, staggerMs: 22, spinDeg: 180, travelMs: 360 },
  bug:      { shape: 'shard',   count: 5, size: [8, 12],  arcHeight: 25, staggerMs: 16, spinDeg: 360, travelMs: 260 },
  flying:   { shape: 'feather', count: 4, size: [12, 18], arcHeight: 50, staggerMs: 24, spinDeg: 120, travelMs: 320 },
  normal:   { shape: 'shard',   count: 4, size: [10, 14], arcHeight: 30, staggerMs: 18, spinDeg: 180, travelMs: 280 },
};

function rand(min: number, max: number): number { return min + Math.random() * (max - min); }

/** Quadratic-Bézier arc tween — animates left/top in px to the field above the line. */
function arcTween(
  el: HTMLElement,
  sx: number, sy: number,
  ex: number, ey: number,
  arcHeight: number,
  durationMs: number,
  spinDeg: number,
  delayMs: number,
): Promise<void> {
  const dx = ex - sx, dy = ey - sy;
  const dist = Math.hypot(dx, dy) || 1;
  // Perpendicular unit vector (rotated 90° CCW). Pick the side that lifts
  // the arc *upward* on screen (negative y direction) regardless of
  // attacker/defender positions.
  let px = -dy / dist, py = dx / dist;
  if (py > 0) { px = -px; py = -py; }
  const cx = (sx + ex) / 2 + px * arcHeight;
  const cy = (sy + ey) / 2 + py * arcHeight;
  const baseRot = (Math.random() - 0.5) * 60;

  return new Promise(resolve => {
    const obj = { t: 0 };
    gsap.to(obj, {
      t: 1,
      duration: durationMs / 1000,
      delay: delayMs / 1000,
      ease: 'power1.inOut',
      onUpdate: () => {
        const t = obj.t;
        const u = 1 - t;
        const x = u * u * sx + 2 * u * t * cx + t * t * ex;
        const y = u * u * sy + 2 * u * t * cy + t * t * ey;
        el.style.left = `${x}px`;
        el.style.top  = `${y}px`;
        el.style.transform = `translate(-50%,-50%) rotate(${baseRot + spinDeg * t}deg)`;
      },
      onComplete: resolve,
    });
  });
}

function spawnPixelShape(
  shape: ShapeKey,
  x: number, y: number,
  size: number,
  color: string,
  outline: string,
): HTMLElement {
  const el = document.createElement('div');
  el.className = 'battle-vfx pixel-vfx';
  el.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    width: ${size}px;
    height: ${size}px;
    transform: translate(-50%,-50%);
    background: ${color};
    clip-path: ${SHAPE_CLIP[shape]};
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    box-shadow: inset 0 0 0 1px ${outline};
    z-index: 9998;
    pointer-events: none;
  `;
  document.body.appendChild(el);
  return el;
}

/** Hard-edged pixel impact: ring + radial chunks. No glow. */
function pixelImpactBurst(x: number, y: number, color: string, outline: string): Promise<void> {
  const ring = document.createElement('div');
  ring.className = 'battle-vfx';
  ring.style.cssText = `
    position: fixed;
    left: ${x}px; top: ${y}px;
    width: 24px; height: 24px;
    transform: translate(-50%,-50%) scale(0.4);
    border: 4px solid ${color};
    box-sizing: border-box;
    border-radius: 0;
    z-index: 9996;
    pointer-events: none;
  `;
  document.body.appendChild(ring);
  gsap.to(ring, { scale: 3.6, opacity: 0, duration: 0.36, ease: 'power2.out', onComplete: () => ring.remove() });

  const SHARD_COUNT = 8;
  return new Promise(resolve => {
    let done = 0;
    for (let i = 0; i < SHARD_COUNT; i++) {
      const a = (i / SHARD_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const d = 32 + Math.random() * 36;
      const sz = 6 + Math.random() * 4;
      const sh = spawnPixelShape('shard', x, y, sz, color, outline);
      gsap.to(sh, {
        x: Math.cos(a) * d,
        y: Math.sin(a) * d,
        opacity: 0,
        scale: 0.4,
        duration: 0.34 + Math.random() * 0.14,
        ease: 'power2.out',
        onComplete: () => { sh.remove(); if (++done === SHARD_COUNT) resolve(); },
      });
    }
  });
}

/** Lightning bolt — vertical pixel zigzag striking from above the defender. */
function lightningStrike(x: number, y: number, color: string): Promise<void> {
  const bolt = document.createElement('div');
  bolt.className = 'battle-vfx';
  // Build a jagged pixel zig-zag using clip-path.
  bolt.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y - 260}px;
    width: 60px;
    height: 280px;
    transform: translate(-50%, 0) scaleY(0);
    transform-origin: 50% 0%;
    background: ${color};
    clip-path: polygon(
      55% 0%,  60% 18%,  44% 22%,  60% 38%,  46% 44%,
      62% 60%,  46% 66%,  60% 80%,  40% 86%,  56% 100%,
      70% 86%,  74% 76%,  64% 64%,  78% 56%,  64% 42%,
      78% 36%,  64% 22%,  76% 14%
    );
    image-rendering: pixelated;
    z-index: 9999;
    pointer-events: none;
  `;
  document.body.appendChild(bolt);

  // White inner core for two-tone pixel feel
  const core = document.createElement('div');
  core.className = 'battle-vfx';
  core.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y - 260}px;
    width: 30px;
    height: 280px;
    transform: translate(-50%, 0) scaleY(0);
    transform-origin: 50% 0%;
    background: #fff;
    clip-path: polygon(
      55% 0%,  60% 18%,  44% 22%,  60% 38%,  46% 44%,
      62% 60%,  46% 66%,  60% 80%,  40% 86%,  56% 100%,
      66% 86%,  74% 76%,  64% 64%,  78% 56%,  64% 42%,
      72% 36%,  64% 22%,  76% 14%
    );
    image-rendering: pixelated;
    z-index: 10000;
    pointer-events: none;
  `;
  document.body.appendChild(core);

  return new Promise(resolve => {
    gsap.timeline({
      onComplete: () => {
        bolt.remove();
        core.remove();
        resolve();
      },
    })
      .to([bolt, core], { scaleY: 1, duration: 0.05, ease: 'none' })
      .to([bolt, core], { opacity: 0, duration: 0.16, delay: 0.04, ease: 'power2.out' });

    // Quick screen-edge tint pulse
    screenFlash(color, 0.12);
  });
}

/** Psychic / fairy / generic strike: concentric pixel pulses. */
function psychicPulse(x: number, y: number, color: string, outline: string): Promise<void> {
  const ringCount = 3;
  const promises: Promise<void>[] = [];
  for (let i = 0; i < ringCount; i++) {
    const ring = document.createElement('div');
    ring.className = 'battle-vfx';
    ring.style.cssText = `
      position: fixed;
      left: ${x}px; top: ${y}px;
      width: 30px; height: 30px;
      transform: translate(-50%,-50%) scale(0.3);
      border: 4px solid ${color};
      box-shadow: inset 0 0 0 1px ${outline};
      z-index: 9996;
      pointer-events: none;
    `;
    document.body.appendChild(ring);
    promises.push(new Promise(res => {
      gsap.to(ring, {
        scale: 2.8 + i * 0.6,
        opacity: 0,
        duration: 0.42,
        delay: i * 0.08,
        ease: 'power2.out',
        onComplete: () => { ring.remove(); res(); },
      });
    }));
  }
  return Promise.all(promises).then(() => undefined);
}

export function showTypeAttackEffect(
  type: string,
  attackerEl: HTMLElement,
  defenderEl: HTMLElement,
  attackerCard?: HTMLElement,
): Promise<void> {
  const inkColor = TYPE_INK[type] ?? '#5a4f42';
  const outline = '#1a1612';
  // Anchor on slot rects so the geometry is stable even mid-lunge.
  const aSlot = (attackerEl.closest('.battle-sprite-slot') as HTMLElement) ?? attackerEl;
  const dSlot = (defenderEl.closest('.battle-sprite-slot') as HTMLElement) ?? defenderEl;
  const aRect = aSlot.getBoundingClientRect();
  const dRect = dSlot.getBoundingClientRect();

  const ax = aRect.left + aRect.width / 2;
  const ay = aRect.top  + aRect.height / 2;
  const ex = dRect.left + dRect.width / 2;
  const ey = dRect.top  + dRect.height / 2;
  const vx = ex - ax, vy = ey - ay;
  const dist = Math.hypot(vx, vy) || 1;
  // Spawn slightly forward of attacker so projectiles don't sit on the sprite.
  const offset = Math.min(50, aRect.width * 0.3);
  const sx = ax + (vx / dist) * offset;
  const sy = ay + (vy / dist) * offset;

  const cfg = TYPE_FX[type] ?? TYPE_FX['normal']!;
  const fieldEl = (attackerEl.closest('.battle-field') as HTMLElement | null);

  return new Promise(resolve => {
    const safetyTimer = setTimeout(resolve, 1600);
    const finish = () => { clearTimeout(safetyTimer); resolve(); };

    if (attackerCard) attackerCard.classList.add('is-attacking');

    // Attacker windup (pixel-friendly: crisp scale, no glow).
    gsap.to(attackerEl, {
      scale: 1.14,
      duration: 0.08,
      ease: 'steps(2)',
      onComplete: () => gsap.to(attackerEl, { scale: 1, duration: 0.1, ease: 'steps(2)' }),
    });

    const onImpact = () => {
      if (attackerCard) attackerCard.classList.remove('is-attacking');
      if (fieldEl) {
        gsap.fromTo(fieldEl, { x: -3 }, { x: 0, duration: 0.4, ease: 'elastic.out(2, 0.35)' });
      }
      let burst: Promise<void>;
      if (cfg.strike === 'lightning')   burst = lightningStrike(ex, ey, inkColor);
      else if (cfg.strike === 'pulse')  burst = psychicPulse(ex, ey, inkColor, outline);
      else                              burst = pixelImpactBurst(ex, ey, inkColor, outline);
      burst.then(finish);
    };

    // Strike-only types skip the arc.
    if (cfg.strike) {
      onImpact();
      return;
    }

    // Spawn arc particles.
    const particleProms: Promise<void>[] = [];
    for (let i = 0; i < cfg.count; i++) {
      const sz = rand(cfg.size[0], cfg.size[1]);
      const el = spawnPixelShape(cfg.shape, sx, sy, sz, inkColor, outline);
      // Per-particle slight target jitter so they don't all stack on impact.
      const jx = (Math.random() - 0.5) * Math.min(40, dRect.width * 0.4);
      const jy = (Math.random() - 0.5) * Math.min(36, dRect.height * 0.4);
      const arcH = cfg.arcHeight + (Math.random() - 0.5) * cfg.arcHeight * 0.4;
      const dur = cfg.travelMs + (Math.random() - 0.5) * 80;
      particleProms.push(
        arcTween(el, sx, sy, ex + jx, ey + jy, arcH, dur, cfg.spinDeg, i * cfg.staggerMs)
          .then(() => {
            // Quick fade on landing
            gsap.to(el, { opacity: 0, scale: 0.6, duration: 0.16, ease: 'power2.out', onComplete: () => el.remove() });
          })
      );
    }

    // Trigger impact when the *first* particle (the lead) lands so the
    // burst feels responsive without waiting for the slowest stragglers.
    const lead = Math.max(180, cfg.travelMs - 80);
    setTimeout(onImpact, lead);

    Promise.all(particleProms).then(() => { /* ensure all cleaned */ });
  });
}

// ============================================================
// Screen Flash (super-effective, crits)
// ============================================================

export function screenFlash(color = '#ffffff', opacity = 0.15): void {
  const el = document.createElement('div');
  el.className = 'battle-flash-overlay battle-vfx';
  el.style.cssText = `
    position: fixed;
    inset: 0;
    background: ${color};
    opacity: 0;
    z-index: 9995;
    pointer-events: none;
  `;
  document.body.appendChild(el);
  gsap.timeline({ onComplete: () => el.remove() })
    .to(el, { opacity, duration: 0.05 })
    .to(el, { opacity: 0, duration: 0.25, ease: 'power2.out' });
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
    { y: 24, opacity: 0 },
    { y: 0, opacity: 0.94, duration: 0.25, ease: 'back.out(1.4)' }
  );

  setTimeout(() => {
    gsap.to(toast, {
      y: 24,
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => toast.remove(),
    });
  }, 1800);
}
