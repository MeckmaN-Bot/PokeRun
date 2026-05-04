/**
 * PokeAPI sprite URL helpers.
 *
 * The PokeAPI/sprites GitHub repo is the canonical source for in-game art —
 * Pokémon (`/sprites/pokemon/{id}.png`), items (`/sprites/items/{slug}.png`),
 * and trainers (`/sprites/trainers/{slug}.png`). All requests hit GitHub's
 * raw-content CDN; on failure, render code falls back to emoji glyphs.
 */

const ROOT = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites';

export const itemSprite = (slug: string): string => `${ROOT}/items/${slug}.png`;
export const pokemonSprite = (id: number): string => `${ROOT}/pokemon/${id}.png`;
export const trainerSprite = (slug: string): string => `${ROOT}/trainers/${slug}.png`;

/**
 * Kanto gym badges live at PokeAPI/sprites under `/sprites/badges/{1..8}.png`,
 * indexed by gym order (1 = Boulder/Brock, 8 = Earth/Giovanni).
 */
const BADGE_INDEX: Record<string, number> = {
  boulder: 1,
  cascade: 2,
  thunder: 3,
  rainbow: 4,
  soul:    5,
  marsh:   6,
  volcano: 7,
  earth:   8,
};

export const badgeSprite = (badgeId: string): string | undefined => {
  const idx = BADGE_INDEX[badgeId];
  return idx ? `${ROOT}/badges/${idx}.png` : undefined;
};

/**
 * Inline `onerror` handler that swaps a broken sprite img for a text glyph.
 * Used as `onerror="${imgErrorFallback('◆')}"`. The fallback runs once and
 * removes itself, so no infinite loop on a missing icon.
 *
 * The result is embedded in an HTML attribute (`onerror="..."`), so all
 * double-quotes in the JS body must be HTML-escaped — otherwise the attribute
 * terminates prematurely and the handler never runs (broken-image stays).
 */
export const imgErrorFallback = (emoji: string): string => {
  const encoded = JSON.stringify(emoji).replace(/"/g, '&quot;');
  return `this.onerror=null;var d=document.createElement('span');d.className='px-emoji';d.textContent=${encoded};this.replaceWith(d);`;
};
