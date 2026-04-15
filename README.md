# Pokémon Gauntlet

A roguelite wave-survival browser game. Build a Pokémon team, survive endless waves of enemies, collect rewards, and climb the global leaderboard.

**Tech stack:** Vite · TypeScript · GSAP · Supabase · PokéAPI

---

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Deploy to GitHub Pages

```bash
npm run deploy
```

This runs `npm run build` then pushes the `dist/` folder to the `gh-pages` branch via the `gh-pages` npm package.

> **Note:** Update `base` in `vite.config.ts` to match your repository name:
> ```ts
> base: '/your-repo-name/',
> ```

---

## Supabase Leaderboard Setup

The game works fully offline — scores are saved to `localStorage` by default. To enable a **global leaderboard**:

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a free project, and note your **Project URL** and **anon key** (found in Settings → API).

### 2. Create the leaderboard table

In the Supabase dashboard, open the **SQL Editor** and run:

```sql
CREATE TABLE leaderboard (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL CHECK (char_length(name) <= 32),
  score_waves integer NOT NULL,
  score_details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Allow anyone to read scores
CREATE POLICY "Read leaderboard" ON leaderboard
  FOR SELECT USING (true);

-- Allow anyone to insert scores (rate-limited by Supabase free tier)
CREATE POLICY "Insert scores" ON leaderboard
  FOR INSERT WITH CHECK (true);

ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Index for fast leaderboard queries
CREATE INDEX leaderboard_score_idx ON leaderboard (score_waves DESC);
CREATE INDEX leaderboard_date_idx ON leaderboard (created_at DESC);
```

### 3. Add environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

The anon key is safe to expose in the browser — Supabase row-level security controls what it can do.

### 4. Rebuild

```bash
npm run build
npm run deploy
```

---

## Game Rules

| Phase | Description |
|-------|-------------|
| **Start** | Enter your name, pick a starter (Bulbasaur / Charmander / Squirtle / Pikachu / Eevee) |
| **Battle** | Turn-based combat against enemy teams. Faster Pokémon moves first. |
| **Reward** | After each wave, pick 1 of 3 random rewards (Pokémon / Perk / Item) |
| **Shop** | Spend coins on held items and consumables |
| **Boss Wave** | Every 5 waves — harder enemies, guaranteed Epic+ reward |
| **Game Over** | All Pokémon fainted. Score = waves survived. |

### Wave Scaling

| Waves | Enemy Count | Levels |
|-------|-------------|--------|
| 1–5   | 2 Pokémon   | 5–15   |
| 6–10  | 3 Pokémon   | 15–30  |
| 11–15 | 4 Pokémon   | 30–50  |
| 16–20 | 5 Pokémon   | 50–70  |
| 21+   | 6 Pokémon   | 70–100 |

---

## Project Structure

```
src/
├── main.ts               # Game state machine + screen orchestrator
├── types.ts              # All TypeScript interfaces
├── data/
│   ├── items.ts          # All held items and consumables
│   ├── perks.ts          # All team perks
│   ├── typeChart.ts      # Full 18×18 type effectiveness chart
│   └── enemyPools.ts     # Wave-scaled enemy Pokemon pools
├── api/
│   ├── pokeapi.ts        # PokéAPI wrapper (localStorage cache, 7-day TTL)
│   └── sprites.ts        # Sprite URL helpers
├── systems/
│   ├── battle.ts         # Damage formula, status effects, AI, turn order
│   ├── scaling.ts        # Wave configuration
│   ├── rewards.ts        # Reward generation + rarity rolls
│   ├── shop.ts           # Shop generation + pricing
│   └── leaderboard.ts    # Supabase integration with local fallback
├── ui/
│   ├── animations.ts     # GSAP helpers
│   ├── components/       # Reusable HTML renderers
│   └── screens/          # One file per game screen
└── styles/               # CSS (no Tailwind — pure CSS custom properties)
```

---

## Customization

### Adding Items

Edit `src/data/items.ts`. Each item follows this shape:

```ts
{
  id: 'my_item',
  name: 'My Item',
  rarity: 'rare',           // common | rare | epic | legendary
  itemType: 'held',         // held | consumable
  icon: '🎁',
  description: 'Does something cool.',
  effect: {
    trigger: 'passive',
    damageMultiplier: 1.2,
  },
}
```

Effect triggers: `passive` · `on_hit_taken` · `end_of_turn` · `on_attack` · `on_status` · `once_per_battle` · `manual`

### Adding Perks

Edit `src/data/perks.ts`. Perks are team-wide permanent buffs:

```ts
{
  id: 'my_perk',
  name: 'My Perk',
  rarity: 'epic',
  description: 'All Pokémon deal +20% damage.',
  effect: {
    allDamageMultiplier: 1.2,
  },
}
```

### Modifying Enemy Pools

Edit `src/data/enemyPools.ts`. Add/remove National Dex IDs from the pool arrays.

---

## Credits

- Pokémon data: [PokéAPI](https://pokeapi.co) (CC BY-NC 4.0)
- Sprites: [PokeAPI/sprites](https://github.com/PokeAPI/sprites)
- Pokémon and all related names are trademarks of Nintendo / Game Freak. This is a fan project with no commercial intent.
