/**
 * Definitive tour-step list for PokéRun's onboarding flow.
 *
 * Steps span multiple screens — anchors use `waitForAnchor` so each step
 * pauses until its target element exists in the DOM (e.g. after the user
 * triggers a transition like Start Run → BattleScreen).
 *
 * Order assumes a fresh first-time run: StartScreen → Battle → Reward → Path.
 */

import { startTour, setTourBattlePaused, type TourStep } from './tutorialTour';

export const FIRST_RUN_STEPS: TourStep[] = [
  {
    id: 'tour_starter',
    anchor: '.starter-grid',
    eyebrow: 'Setup · 01',
    title: 'Pick a starter',
    body: 'Three options — every starter is a viable seed. Use ‹ › to browse types. Your starter sets your run\'s opening move.',
    cta: 'Got one →',
    position: 'top',
  },
  {
    id: 'tour_trainer',
    anchor: '#trainer-chip',
    eyebrow: 'Setup · 02',
    title: 'Your trainer card',
    body: 'Click to swap gender. Your name &amp; trainer carry across runs and show on the leaderboard.',
    cta: 'Cool →',
    position: 'bottom',
  },
  {
    id: 'tour_start',
    anchor: '#start-btn',
    eyebrow: 'Setup · 03',
    title: 'Press to begin',
    body: 'Click <b>Start Run</b> to step onto the path. We\'ll explain each screen as it appears.',
    advanceOnClick: true,
    position: 'top',
  },
  {
    id: 'tour_path_arena',
    anchor: () =>
      document.querySelector<HTMLElement>('.stage-progress') ??
      document.querySelector<HTMLElement>('.path-header'),
    eyebrow: 'Path · 04',
    title: 'Road to the badge',
    body: 'This strip shows the <b>upcoming arena</b> and your progress. Each pip is one node — when the rail fills up, the gym leader is next.',
    cta: 'Continue →',
    position: 'bottom',
    waitMs: 30000,
    pad: 10,
  },
  {
    id: 'tour_path_cards',
    anchor: () =>
      document.querySelector<HTMLElement>('.path-cards') ??
      document.querySelector<HTMLElement>('.path-content'),
    eyebrow: 'Path · 05',
    title: 'Three branches',
    body: 'Each card is one path forward:<br><b>Battle</b> · standard fight + reward<br><b>Elite</b> · harder fight, better loot<br><b>Shop</b> · spend coins on items<br><b>Heal</b> · restore your team<br><b>Event</b> · random dilemma<br><b>Arena</b> · 4-stage gym, badge on win',
    cta: 'Got it →',
    position: 'top',
    waitMs: 8000,
    pad: 12,
  },
  {
    id: 'tour_path_pick',
    anchor: () => document.querySelector<HTMLElement>('.path-card'),
    eyebrow: 'Path · 06',
    title: 'Take a path',
    body: 'Click any card to commit. Plan two steps ahead — coins are tight before arenas, HP matters before bosses. <b>Pick a Battle node now</b> so we can show you combat.',
    cta: '— click a card —',
    advanceOnClick: true,
    position: 'right',
    waitMs: 8000,
  },
  // Battle steps — auto-battle is paused while we explain each area calmly.
  // Pause is set on first battle-step, kept across the next two, then released
  // on the final "watch the fight" step.
  {
    id: 'tour_battle_arena',
    anchor: () =>
      document.querySelector<HTMLElement>('.battle-arena') ??
      document.querySelector<HTMLElement>('#battle-screen-inner'),
    eyebrow: 'Combat · 07',
    title: 'The arena',
    body: 'Your active mon vs. the enemy. Each card shows HP, level, status, and types. The fight is paused — take your time reading.',
    cta: 'Show me the team →',
    position: 'bottom',
    waitMs: 12000,
    pad: 6,
    onEnter: () => setTourBattlePaused(true),
  },
  {
    id: 'tour_battle_team',
    anchor: '#battle-team-strip',
    eyebrow: 'Combat · 08',
    title: 'Your team',
    body: 'Each sprite is a roster slot. Color-bar = HP. Faded sprite = fainted. Your active mon is highlighted with the oxblood border.',
    cta: 'Show me the ticker →',
    position: 'top',
    waitMs: 8000,
    pad: 8,
  },
  {
    id: 'tour_battle_ticker',
    anchor: '#battle-ticker',
    eyebrow: 'Combat · 09',
    title: 'Live ticker',
    body: 'Combat log. Damage rolls, type matchups, status procs, item triggers — everything resolves here. Once we resume the fight, watch this strip.',
    cta: 'Watch the fight →',
    position: 'top',
    waitMs: 8000,
    pad: 8,
    onExit: () => setTourBattlePaused(false),
  },
  {
    id: 'tour_reward',
    anchor: () =>
      document.querySelector<HTMLElement>('.reward-screen') ??
      document.querySelector<HTMLElement>('#reward-cards'),
    eyebrow: 'Reward · 10',
    title: 'Pick or skip',
    body: 'Three cards drop after every win — a <b>Mon</b>, a <b>Perk</b>, or an <b>Item</b>. Skip for <b>+60¢</b> instead. Boss waves drop better loot — save your skips for normal waves.',
    cta: 'Got it →',
    position: 'bottom',
    waitMs: 90000,
    pad: 12,
  },
];

export function startFirstRunTour(force = false): void {
  startTour(FIRST_RUN_STEPS, { force });
}
