// Sprite URL helpers for PokéAPI sprites

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

export function getStaticSprite(id: number): string {
  return `${SPRITE_BASE}/${id}.png`;
}

export function getAnimatedSprite(id: number): string {
  return `${SPRITE_BASE}/versions/generation-v/black-white/animated/${id}.gif`;
}

export function getBackSprite(id: number): string {
  return `${SPRITE_BASE}/back/${id}.png`;
}

export function getShinySprite(id: number): string {
  return `${SPRITE_BASE}/shiny/${id}.png`;
}

// Returns animated GIF if available, falls back to static PNG
export async function getBestSprite(id: number): Promise<{ animated: string; static: string }> {
  return {
    animated: getAnimatedSprite(id),
    static: getStaticSprite(id),
  };
}

// Test if an animated sprite exists (some mons don't have gen-5 animated sprites)
const ANIMATED_SPRITE_CACHE = new Map<number, boolean>();

export async function hasAnimatedSprite(id: number): Promise<boolean> {
  if (ANIMATED_SPRITE_CACHE.has(id)) {
    return ANIMATED_SPRITE_CACHE.get(id)!;
  }
  try {
    const resp = await fetch(getAnimatedSprite(id), { method: 'HEAD' });
    const exists = resp.ok;
    ANIMATED_SPRITE_CACHE.set(id, exists);
    return exists;
  } catch {
    ANIMATED_SPRITE_CACHE.set(id, false);
    return false;
  }
}

// IDs known to have animated sprites (Gen 1-5, roughly 1-649)
export function likelyHasAnimatedSprite(id: number): boolean {
  return id <= 649;
}
