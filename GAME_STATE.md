# PokéRun — Aktueller Stand

Stand: 2026-05-04 · Deploy: pokerun.pages.dev

---

## Idee

Balatro-artiges Pokémon-Roguelike. Auto-Battler mit manuellem Eingriff.
Ziel: Durch 8 Akte (Gen-1-Arenaleiter Brock → Giovanni) und die Top Vier +
Champion in der Pokémon-Liga laufen, dabei Team aus bis zu 5 Pokémon
aufbauen, Items stapeln, Perks auswählen, Synergien finden.

Aesthetic: „Field Manual" — Fraunces (Display, italic), Space Grotesk
(Mono), harte 4–8px Schatten, gestrichelte/repeating Bars, Cream/Schwarz
mit Akzentfarben pro Typ.

---

## Run-Ablauf

1. **Starter wählen** — 3 Optionen aus den Gen-1-Startern + paar Wildcards
2. **Pfad-Knoten** — pro Akt 4 Schritte. Jeder Schritt zeigt 3 Karten zur
   Wahl:
   - `grass` — Wilde Begegnung (mögl. Catch + Loot)
   - `trainer` — Trainerkampf (Münzen + Belohnung)
   - `center` — Pokécenter (Heilung + Item)
   - `mystery` — Zufallsereignis
   - `shop_mini` — kleiner Shop
   - `forage` — Item-Drop
3. **Schritt 4 jedes Akts = Gym Leader** (Brock, Misty, Surge, Erika,
   Koga, Sabrina, Blaine, Giovanni). Bei Sieg: Badge + großer Reward-Pool.
4. **Wave** = einzelne Schlacht. **Akt** = 4 Waves bis Gym.
5. **Shop** öffnet zwischen Waves (Items, Booster, Perks, Reroll).
6. Nach 8 Badges: **Pokémon-Liga** — Lorelei → Bruno → Agatha → Lance →
   Champion (sequenziell, kein Pfad).
7. Run endet bei Team-Wipe oder Champion-Sieg.

---

## Kampf-System

- **Auto-Battler-Kern**: Pokémon wählen automatisch beste Moves, Spieler
  kann jederzeit eingreifen (Move tauschen, Item nutzen, Pokémon
  swappen).
- **Geschwindigkeitsregler**: 1× / 1.5× (Default) / 2× / 3×.
- **Type-Chart**: voll implementiert, Super-Effective-Animation auf
  Sprite + Battle-Log-Eintrag.
- **STAB**: 1.5× (per Perk auf 1.6× erhöhbar).
- **Status**: Burn, Poison, BadPoison, Sleep, Paralysis, Freeze, Flinch.
- **Stat Stages**: -6 bis +6 wie im Original.
- **XP-Curve**: `floor(level^1.5 * 10)`. Level-Up während Wave möglich,
  XP-Recap-Overlay nach Sieg (klick-zum-skippen erst nach Animation).
- **Move-Pool**: Pokémon kennt mehr Moves als 4 — Pool sichtbar im
  MoveManager. Pending Learns werden in Batch-Modal angezeigt.
- **Item-Bag im Kampf**: Auch im Auto-Battle nutzbar. Hyper Potion etc.
  öffnet Target-Picker.

---

## Items

**Held Items** (1 Slot pro Pokémon, Slot 2 ab Lv 25):

- *Common*: Beeren (Oran, Sitrus, Pecha, Rawst, Chesto, Cheri, Aspear,
  Lum), Amulet Coin
- *Rare*: Choice Band/Specs/Scarf, Life Orb, Leftovers, Shell Bell,
  Rocky Helmet, Eviolite, Assault Vest, Focus Sash, Air Balloon,
  Weakness Policy, Expert Belt, Muscle Band, Wise Glasses,
  Type-Booster (Magnet, Charcoal, Mystic Water, … 16 Typen),
  Poké Bandage, Leech Seed, Binding Band, Quick Powder, Rally Band,
  Formation Crest, Tag-Team Bell
- *Epic*: Scope Lens, King's Rock, Wide Lens, Heavy-Duty Boots,
  Quick Claw, Flame Orb, Toxic Orb, Synergy Stone, Type Enhancer,
  Momentum Badge, Type Lens, Reset Pulse
- *Legendary*: Mega Stone, Z-Crystal, Light Ball, Revive Heart

**Consumables**:

- Heilung: Potion / Super / Hyper / Max / Full Restore / Sacred Ash /
  Team Vitals / Pokémon Food
- Status: Antidote, Burn Heal, Full Heal
- Revive / Max Revive
- Stat-Boost (in-battle): X Attack, X Speed, X Sp.Atk, Dire Hit
- Permanent: Protein, Iron, Carbos
- Utility: Rare Candy, Ether, Max Elixir, Reroll Token, Escape Rope
- Spezial: Evolution Stone, Item Pouch (Slot-2-Unlock),
  Ace Trainer's Gift (2× XP, 5 Waves)
- Coin-Drops: Star Piece (+50¢), Big Nugget (+150¢)
- **Planet Cards**: 18 Stück, je +1 Type-Level (+10% Dmg pro Level)

---

## Booster Packs (Shop)

| Pack | Preis | Inhalt | Pick |
|---|---|---|---|
| Poké Ball | 50¢ | 3 Held Items | 1 |
| Great Ball | 60¢ | 3 Consumables | 1 |
| Ultra Ball | 80¢ | 2 Perks | 1 |
| Master Ball | 120¢ | 5 Rare-Goods | 2 |
| Premier Ball | 100¢ | 2 Mighty Items + Curse | 1 |

**Spectral Curses** (Premier Ball Cost): Frayed Edge (-10% HP),
Heavy Load (-10% Speed), Blood Pact (-50¢), Time Debt (2 Waves no coin).

---

## Perks (Trainer Perks, persistent)

40+ Perks gestaffelt Common/Rare/Epic. Beispiele:

- **Common**: Veteran Training (+7% all stats), STAB Boost (1.6×),
  Endurance, Swift Feet, Iron Will, Coin Collector, Berry Feast
- **Rare**: Last Resort, Grassy Carpet, Dual Threat, Speed Demons,
  Underdog, Type Coverage, Burn Cascade
- **Epic**: Synergy Link (+2 stages on KO), Death's Door Power (2×
  unter 25% HP), Adrenaline Rush (1. Move = Crit), Legendary Aura,
  Double Up (15% Multi-Hit)

---

## Synergies (in-battle, automatisch)

Berechnet aus Team-Komposition. Keine Picks — entstehen aus dem
Kader. Beispiel: **Lead Vanguard** (Pokémon in Slot 1 = +15% Dmg).
Sichtbar im Battle als „Synergies"-Bar oben.

---

## Gym Leaders & Liga

- Brock (Rock) → Misty (Water) → Surge (Electric) → Erika (Grass) →
  Koga (Poison) → Sabrina (Psychic) → Blaine (Fire) → Giovanni (Ground)
- Jeder Leader: Sprite, Ace-Pokémon (lore-akkurat), Bias-Roster,
  Badge-Reward mit Passive-Perk.
- Pre-Arena Screen zeigt Typ-Badge des Leaders zur Vorbereitung.
- **Pokémon League**: Lorelei → Bruno → Agatha → Lance → Champion.

---

## Wirtschaft

- **Münzen** verdient pro Wave (Trainer geben mehr, Gym × Multi).
- Reroll-Kosten steigen pro Reroll im selben Shop.
- Amulet Coin / Coin Collector skalieren Income.
- Wave-Endcleanup: Focus Sash zerstört, Berry-Recharge, MomentumBadge
  +1 Stack.

---

## Tech-Stack

- Vanilla TS + Vite, kein Framework
- GSAP für Animation
- PokeAPI (Sprites, Moves) gecached über Promise.all
- Supabase Leaderboard mit localStorage-Fallback
- Cloudflare Pages Deploy (`wrangler pages deploy dist`)

---

## Run-End Screen

Field-Log-Stil. Zeigt:

- Waves cleared, Total KOs, Damage dealt, Items collected,
  Perks picked, Coins banked
- Globaler Top-7 Leaderboard
- Copy-Results, Full-Leaderboard, Restart

---

## Letzte Iterationen (offen → fixed)

- BROKE-FREE Overlay Fade-out
- Default-Speed 1.5×
- Gym-Type-Badge auf Path-Stage
- Battle-Log Effectiveness-Sync (Move + Effekt-Tag)
- Hyper Potion Target-Picker
- Batch Move-Learn Modal (alle Pending in einem)
- Coin-Counter `C220`-Prefix-Bug
- Trainer-Namen DE→EN translatiert
- Recap-Click-Block bis Animation fertig
- Wave/Arena-Step-Label disambiguiert
- Wild-Pool Cap pro Akt (Aerodactyl-Trap @ Wave 3 fixed)
- „Perks Found" → „Perks picked", Synergies-Label im Battle
