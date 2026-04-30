/**
 * Audio asset registry. Vite serves anything under `public/` from the site
 * root, so paths stay the same in dev + build.
 *
 * SFX:   `Audio.registerSfx(key, '/audio/sfx/<file>.ogg')`
 * Music: `Audio.registerMusic(key, '/audio/music/<file>.ogg')`
 */

import { Audio } from './AudioManager';

export function registerAudioAssets(): void {
  // ── UI ──────────────────────────────────────────────────────────────
  Audio.registerSfx('ui.click',          '/audio/sfx/ui-click.ogg');
  Audio.registerSfx('ui.confirm',        '/audio/sfx/ui-confirm.ogg');
  Audio.registerSfx('ui.cancel',         '/audio/sfx/ui-cancel.ogg');
  Audio.registerSfx('ui.error',          '/audio/sfx/ui-error.ogg');
  Audio.registerSfx('ui.coin',           '/audio/sfx/ui-coin.ogg');

  // ── Battle ──────────────────────────────────────────────────────────
  Audio.registerSfx('battle.hit',              '/audio/sfx/wood-block-thud.ogg');
  Audio.registerSfx('battle.crit',             '/audio/sfx/cymbal-crash.ogg');
  Audio.registerSfx('battle.miss',             '/audio/sfx/slide-whistle.ogg');
  Audio.registerSfx('battle.faint',            '/audio/sfx/sad-trombone.ogg');
  Audio.registerSfx('battle.super_effective',  '/audio/sfx/trumpet-rip.ogg');
  Audio.registerSfx('battle.not_effective',    '/audio/sfx/muted-trumpet.ogg');
  Audio.registerSfx('battle.immune',           '/audio/sfx/kazoo-buzz.ogg');

  // ── Catch ───────────────────────────────────────────────────────────
  Audio.registerSfx('catch.throw',       '/audio/sfx/whoosh.ogg');
  Audio.registerSfx('catch.land',        '/audio/sfx/wood-clack.ogg');
  Audio.registerSfx('catch.wobble',      '/audio/sfx/wood-clack-soft.ogg');
  Audio.registerSfx('catch.caught',      '/audio/sfx/clarinet-jubilee.ogg');
  Audio.registerSfx('catch.broke',       '/audio/sfx/strangled-trumpet.ogg');

  // ── Shop ────────────────────────────────────────────────────────────
  Audio.registerSfx('shop.coin',         '/audio/sfx/brass-coin.ogg');
  Audio.registerSfx('shop.buy',          '/audio/sfx/till-chime.ogg');
  Audio.registerSfx('shop.pack_open',    '/audio/sfx/paper-rip.ogg');
  Audio.registerSfx('shop.voucher',      '/audio/sfx/stamp-thud.ogg');
  Audio.registerSfx('shop.reroll',       '/audio/sfx/slot-machine.ogg');
  Audio.registerSfx('shop.unaffordable', '/audio/sfx/dud-buzz.ogg');

  // ── Wave / meta ─────────────────────────────────────────────────────
  Audio.registerSfx('wave.intro',        '/audio/sfx/fanfare-short.ogg');
  Audio.registerSfx('wave.boss_warn',    '/audio/sfx/siren-trombone.ogg');

  // ── One-shot music (played non-looping at moments) ──────────────────
  Audio.registerMusic('music.victory',      '/audio/music/victory-fanfare.ogg');
  Audio.registerMusic('music.defeat',       '/audio/music/defeat-theme.ogg');
  Audio.registerMusic('music.evolution',    '/audio/music/evolution-theme.ogg');
  Audio.registerMusic('music.catch_intro',  '/audio/music/catch-encounter.ogg');

  // ── Looped scene music ──────────────────────────────────────────────
  Audio.registerMusic('music.menu',          '/audio/music/menu-theme.ogg');
  Audio.registerMusic('music.shop',          '/audio/music/shop-theme.ogg');
  Audio.registerMusic('music.battle_normal', '/audio/music/battle-normal.ogg');
  Audio.registerMusic('music.battle_boss',   '/audio/music/battle-boss.ogg');
}
