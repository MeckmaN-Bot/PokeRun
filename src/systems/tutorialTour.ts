/**
 * Interactive guided tutorial tour.
 *
 * Anchors a paper speech-bubble + spotlight cutout to a real DOM element.
 * The user walks through the steps via "Next" or by performing the prompted
 * action (e.g. clicking the highlighted element). Skip aborts the entire tour.
 *
 * Steps may live across multiple screens — `waitFor` lets a step pause until
 * the anchor exists in the DOM (e.g. after a screen transition).
 */

import { wasSeen, markSeen } from './tutorial';

export type TourPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export interface TourStep {
  /** stable id for telemetry / per-step seen-tracking */
  id: string;
  /** CSS selector OR a function that resolves to an HTMLElement */
  anchor: string | (() => HTMLElement | null);
  eyebrow: string;
  title: string;
  body: string;
  cta?: string;
  position?: TourPosition;
  /** if true, advance only when user clicks the anchor (else "Next" button) */
  advanceOnClick?: boolean;
  /** wait up to N ms for anchor to appear (screen transitions). default 4000 */
  waitMs?: number;
  /** padding around anchor in spotlight cutout (default 8px) */
  pad?: number;
  /** runs once when this step becomes the active step (after anchor resolves) */
  onEnter?: () => void;
  /** runs once when this step is left (advance or skip) */
  onExit?: () => void;
}

// ── Battle-pause flag — battle loop checks this each tick.
let _battlePaused = false;
export function setTourBattlePaused(paused: boolean): void { _battlePaused = paused; }
export function isTourBattlePaused(): boolean { return _battlePaused; }

const TOUR_KEY = 'tour';

interface ActiveTour {
  steps: TourStep[];
  index: number;
  overlay: HTMLElement;
  spotlight: HTMLElement;
  card: HTMLElement;
  onResize: () => void;
  cleanupAnchorListener: (() => void) | null;
  onComplete?: () => void;
}

let active: ActiveTour | null = null;

export function isTourActive(): boolean { return active != null; }

export function endTour(reason: 'completed' | 'skipped' = 'completed'): void {
  if (!active) return;
  if (reason === 'completed') markSeen(TOUR_KEY);
  // Run the current step's onExit so it can clean up side effects (e.g. unpause battle).
  const cur = active.steps[active.index];
  cur?.onExit?.();
  // Always unpause battle on tour end — defensive in case a step skipped its onExit.
  setTourBattlePaused(false);
  active.cleanupAnchorListener?.();
  window.removeEventListener('resize', active.onResize);
  window.removeEventListener('scroll', active.onResize, true);
  active.overlay.classList.add('closing');
  const t = active;
  window.setTimeout(() => t.overlay.remove(), 200);
  active = null;
  t.onComplete?.();
}

/** Replay button entry point — clears the seen flag so the tour reruns. */
export function resetTour(): void {
  // We rely on `tutorial.ts` resetTutorial() for full wipe; here we just clear our key.
  try {
    const key = 'pokerun:tutorialSeen:v1';
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const arr = JSON.parse(raw) as string[];
    const filtered = Array.isArray(arr) ? arr.filter(x => x !== TOUR_KEY) : [];
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch { /* non-fatal */ }
}

export function hasSeenTour(): boolean {
  return wasSeen(TOUR_KEY);
}

export async function startTour(steps: TourStep[], opts: { force?: boolean; onComplete?: () => void } = {}): Promise<void> {
  if (active) return;
  if (!opts.force && wasSeen(TOUR_KEY)) return;

  const overlay = document.createElement('div');
  overlay.className = 'tour-overlay';
  overlay.innerHTML = `
    <div class="tour-spotlight"></div>
    <div class="tour-card" role="dialog" aria-live="polite">
      <div class="tour-card-arrow" aria-hidden="true"></div>
      <div class="tour-card-head">
        <span class="tour-eyebrow"></span>
        <span class="tour-progress"></span>
      </div>
      <h3 class="tour-title"></h3>
      <p class="tour-body"></p>
      <div class="tour-actions">
        <button type="button" class="ink-btn ghost sm tour-skip">Skip tour</button>
        <button type="button" class="ink-btn primary tour-next">Next ›</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const spotlight = overlay.querySelector<HTMLElement>('.tour-spotlight')!;
  const card = overlay.querySelector<HTMLElement>('.tour-card')!;

  active = {
    steps,
    index: 0,
    overlay,
    spotlight,
    card,
    onResize: () => positionForCurrent(),
    cleanupAnchorListener: null,
    onComplete: opts.onComplete,
  };

  overlay.querySelector<HTMLButtonElement>('.tour-skip')!.addEventListener('click', () => endTour('skipped'));
  overlay.querySelector<HTMLButtonElement>('.tour-next')!.addEventListener('click', advance);

  window.addEventListener('resize', active.onResize);
  window.addEventListener('scroll', active.onResize, true);

  await renderStep();
}

async function renderStep(): Promise<void> {
  if (!active) return;
  const step = active.steps[active.index];
  if (!step) { endTour('completed'); return; }

  // Hide spotlight + card while we poll for the next step's anchor —
  // nothing flashes while screens are mid-transition.
  setWaitingState(true);

  const anchor = await waitForAnchor(step);
  if (!active) return;
  if (!anchor) { endTour('completed'); return; }

  // Let the screen finish its mount/animation before we measure anchor rect.
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
  if (!active) return;

  setWaitingState(false);

  active.cleanupAnchorListener?.();
  active.cleanupAnchorListener = null;

  // Update card content
  const c = active.card;
  c.querySelector<HTMLElement>('.tour-eyebrow')!.textContent = step.eyebrow;
  c.querySelector<HTMLElement>('.tour-progress')!.textContent = `${active.index + 1} / ${active.steps.length}`;
  c.querySelector<HTMLElement>('.tour-title')!.textContent = step.title;
  c.querySelector<HTMLElement>('.tour-body')!.innerHTML = step.body;

  const nextBtn = c.querySelector<HTMLButtonElement>('.tour-next')!;
  const isLast = active.index === active.steps.length - 1;
  nextBtn.textContent = step.advanceOnClick
    ? '— do the action —'
    : (step.cta ?? (isLast ? 'Got it →' : 'Next ›'));
  nextBtn.disabled = !!step.advanceOnClick;

  if (step.advanceOnClick) {
    const onClick = () => advance();
    anchor.addEventListener('click', onClick, { once: true });
    active.cleanupAnchorListener = () => anchor.removeEventListener('click', onClick);
  }

  // Run onEnter side-effects (e.g. pause battle, weaken enemy team).
  step.onEnter?.();

  positionForCurrent();
  // Bring the anchor into view if it's offscreen
  try {
    anchor.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
  } catch { /* older browsers */ }
}

function positionForCurrent(): void {
  if (!active) return;
  const step = active.steps[active.index];
  const anchor = resolveAnchor(step);
  if (!anchor) return;
  const rect = anchor.getBoundingClientRect();
  const pad = step.pad ?? 8;

  // Spotlight: absolutely-positioned outline, with a 4-rect inset cutout via box-shadow
  const sp = active.spotlight;
  sp.style.top = `${rect.top - pad}px`;
  sp.style.left = `${rect.left - pad}px`;
  sp.style.width = `${rect.width + pad * 2}px`;
  sp.style.height = `${rect.height + pad * 2}px`;

  // Card placement
  const card = active.card;
  card.classList.remove('pos-top', 'pos-bottom', 'pos-left', 'pos-right', 'mobile-sheet');
  const vw = window.innerWidth, vh = window.innerHeight;

  // Mobile: pin card to top or bottom of viewport so it never covers the spotlight.
  // Decision: anchor in upper half → card sticks to bottom; anchor in lower half → card to top.
  if (vw <= 600) {
    const anchorMid = rect.top + rect.height / 2;
    const dockTop = anchorMid > vh / 2;
    card.classList.add('mobile-sheet', dockTop ? 'pos-top' : 'pos-bottom');
    card.style.top = '';
    card.style.left = '';
    return;
  }

  const desired = step.position && step.position !== 'auto' ? step.position : pickAuto(rect, vw, vh);
  card.classList.add(`pos-${desired}`);

  // Position the card relative to the anchor
  const cardRect = card.getBoundingClientRect();
  const cardW = cardRect.width || 320;
  const cardH = cardRect.height || 160;
  const gap = 18;

  let top = 0, left = 0;
  switch (desired) {
    case 'top':
      top = rect.top - cardH - gap;
      left = rect.left + rect.width / 2 - cardW / 2;
      break;
    case 'bottom':
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2 - cardW / 2;
      break;
    case 'left':
      top = rect.top + rect.height / 2 - cardH / 2;
      left = rect.left - cardW - gap;
      break;
    case 'right':
      top = rect.top + rect.height / 2 - cardH / 2;
      left = rect.right + gap;
      break;
  }
  // Clamp to viewport
  const margin = 12;
  left = Math.max(margin, Math.min(vw - cardW - margin, left));
  top = Math.max(margin, Math.min(vh - cardH - margin, top));

  card.style.top = `${top}px`;
  card.style.left = `${left}px`;
}

function setWaitingState(waiting: boolean): void {
  if (!active) return;
  // While polling for the next anchor, keep the tour invisible — no chrome.
  active.card.style.visibility = waiting ? 'hidden' : '';
  active.spotlight.style.visibility = waiting ? 'hidden' : '';
}

function pickAuto(rect: DOMRect, vw: number, vh: number): TourPosition {
  // Pick the side with the most room
  const space = {
    top: rect.top,
    bottom: vh - rect.bottom,
    left: rect.left,
    right: vw - rect.right,
  };
  const entries = Object.entries(space) as [TourPosition, number][];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

function resolveAnchor(step: TourStep): HTMLElement | null {
  if (typeof step.anchor === 'function') return step.anchor();
  return document.querySelector<HTMLElement>(step.anchor);
}

function waitForAnchor(step: TourStep): Promise<HTMLElement | null> {
  const max = step.waitMs ?? 4000;
  return new Promise(resolve => {
    const start = Date.now();
    const tick = () => {
      const el = resolveAnchor(step);
      if (el) { resolve(el); return; }
      if (Date.now() - start > max) { resolve(null); return; }
      window.requestAnimationFrame(tick);
    };
    tick();
  });
}

function advance(): void {
  if (!active) return;
  // Fire the leaving step's onExit before moving on.
  const leaving = active.steps[active.index];
  leaving?.onExit?.();
  active.index += 1;
  if (active.index >= active.steps.length) { endTour('completed'); return; }
  renderStep();
}
