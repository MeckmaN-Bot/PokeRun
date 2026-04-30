/**
 * Generates pixel-art item icons via fal.ai nano-banana-pro
 * then removes the background via fal-ai/bria-rmbg
 * Saves PNGs to public/items/[id].png
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const FAL_KEY = 'c23401b4-547e-4e1f-8cbe-a7373549ecdb:b08b5877ee19efbfc22a43f907539cbb';
const OUT_DIR = path.resolve('/Users/Marius-Work/PokeRun/public/items');

fs.mkdirSync(OUT_DIR, { recursive: true });

const ITEMS = [
  // Berries
  { id: 'oran_berry',      prompt: 'pixel art RPG item icon, small round blue Oran Berry from Pokemon, shiny surface, retro game sprite, simple clean design' },
  { id: 'sitrus_berry',    prompt: 'pixel art RPG item icon, large yellow Sitrus Berry from Pokemon, golden sheen, retro game sprite' },
  { id: 'lum_berry',       prompt: 'pixel art RPG item icon, shiny round green Lum Berry from Pokemon, speckled pattern, retro game sprite' },
  { id: 'pecha_berry',     prompt: 'pixel art RPG item icon, pink fuzzy Pecha Berry from Pokemon, peach-like, retro game sprite' },
  { id: 'rawst_berry',     prompt: 'pixel art RPG item icon, blue pointed leaf Rawst Berry from Pokemon, retro game sprite' },
  { id: 'chesto_berry',    prompt: 'pixel art RPG item icon, purple round Chesto Berry from Pokemon, retro game sprite' },
  { id: 'cheri_berry',     prompt: 'pixel art RPG item icon, red spicy Cheri Berry from Pokemon, small chili pepper berry, retro game sprite' },
  { id: 'aspear_berry',    prompt: 'pixel art RPG item icon, yellow pear-shaped Aspear Berry from Pokemon, retro game sprite' },
  { id: 'lum_berry',       prompt: 'pixel art RPG item icon, shiny multicolor Lum Berry from Pokemon, retro game sprite' },
  { id: 'miracle_seed',    prompt: 'pixel art RPG item icon, small glowing green seed, Pokemon Miracle Seed, grass type power, retro game sprite' },
  { id: 'leech_seed',      prompt: 'pixel art RPG item icon, green round Leech Seed with tiny vines, Pokemon item, retro game sprite' },

  // Coins / Economy
  { id: 'amulet_coin',     prompt: 'pixel art RPG item icon, shiny gold coin with yen symbol, Pokemon Amulet Coin, lucky charm, retro game sprite' },

  // Choice items
  { id: 'choice_band',     prompt: 'pixel art RPG item icon, red cloth headband, Pokemon Choice Band, tied knot, retro game sprite' },
  { id: 'choice_specs',    prompt: 'pixel art RPG item icon, blue round spectacles, Pokemon Choice Specs, retro game sprite' },
  { id: 'choice_scarf',    prompt: 'pixel art RPG item icon, yellow scarf, Pokemon Choice Scarf, tied ribbon, retro game sprite' },

  // Orbs
  { id: 'life_orb',        prompt: 'pixel art RPG item icon, dark purple glowing orb with soul flame, Pokemon Life Orb, sinister energy, retro game sprite' },
  { id: 'flame_orb',       prompt: 'pixel art RPG item icon, orange glowing fiery orb, Pokemon Flame Orb, fire inside glass, retro game sprite' },
  { id: 'toxic_orb',       prompt: 'pixel art RPG item icon, sickly purple poison orb, Pokemon Toxic Orb, dripping venom, retro game sprite' },

  // Recovery / HP items
  { id: 'leftovers',       prompt: 'pixel art RPG item icon, small plate with food scraps, Pokemon Leftovers, healing food remains, retro game sprite' },
  { id: 'shell_bell',      prompt: 'pixel art RPG item icon, golden shell-shaped bell, Pokemon Shell Bell, sparkling, retro game sprite' },
  { id: 'poke_bandage',    prompt: 'pixel art RPG item icon, white medical bandage roll with red cross, Pokemon Poke Bandage, retro game sprite' },

  // Defense / Utility held
  { id: 'rocky_helmet',    prompt: 'pixel art RPG item icon, rough rocky spiky helmet, Pokemon Rocky Helmet, stone headgear, retro game sprite' },
  { id: 'eviolite',        prompt: 'pixel art RPG item icon, clear transparent diamond crystal gem, Pokemon Eviolite, sparkle, retro game sprite' },
  { id: 'assault_vest',    prompt: 'pixel art RPG item icon, dark green combat tactical vest, Pokemon Assault Vest, military gear, retro game sprite' },
  { id: 'focus_sash',      prompt: 'pixel art RPG item icon, thin yellow silk sash ribbon, Pokemon Focus Sash, tied bow, retro game sprite' },
  { id: 'air_balloon',     prompt: 'pixel art RPG item icon, pink inflated balloon with string, Pokemon Air Balloon, floating, retro game sprite' },
  { id: 'weakness_policy', prompt: 'pixel art RPG item icon, rolled scroll parchment, Pokemon Weakness Policy, ancient paper, retro game sprite' },

  // Accuracy / Crit
  { id: 'scope_lens',      prompt: 'pixel art RPG item icon, golden magnifying scope lens, Pokemon Scope Lens, optical glass, retro game sprite' },
  { id: 'wide_lens',       prompt: 'pixel art RPG item icon, wide circular camera lens, Pokemon Wide Lens, glass ring, retro game sprite' },
  { id: 'kings_rock',      prompt: 'pixel art RPG item icon, small golden crown-shaped stone, Pokemon Kings Rock, regal, retro game sprite' },
  { id: 'quick_claw',      prompt: 'pixel art RPG item icon, sharp yellow curved claw, Pokemon Quick Claw, fast movement, retro game sprite' },

  // Legendary
  { id: 'mega_stone',      prompt: 'pixel art RPG item icon, round glowing rainbow mega evolution stone, Pokemon Mega Stone, pulsing light, retro game sprite' },
  { id: 'z_crystal',       prompt: 'pixel art RPG item icon, translucent prism crystal Z-Crystal, Pokemon Z-Crystal, rainbow facets, retro game sprite' },
  { id: 'light_ball',      prompt: 'pixel art RPG item icon, electric yellow pulsing sphere, Pokemon Light Ball, Pikachu item, lightning inside, retro game sprite' },
  { id: 'revive_heart',    prompt: 'pixel art RPG item icon, glowing red heart with golden glow, Pokemon Revive Heart, resurrection life force, retro game sprite' },

  // Type boosters
  { id: 'magnet',          prompt: 'pixel art RPG item icon, red and blue horseshoe magnet, Pokemon Magnet, electric type booster, retro game sprite' },
  { id: 'charcoal',        prompt: 'pixel art RPG item icon, black glowing charcoal chunk, Pokemon Charcoal, fire type booster, retro game sprite' },
  { id: 'mystic_water',    prompt: 'pixel art RPG item icon, teardrop water droplet gemstone, Pokemon Mystic Water, blue glowing, retro game sprite' },
  { id: 'soft_sand',       prompt: 'pixel art RPG item icon, small hourglass with tan sand, Pokemon Soft Sand, ground type booster, retro game sprite' },
  { id: 'sharp_beak',      prompt: 'pixel art RPG item icon, pointed sharp yellow bird beak, Pokemon Sharp Beak, flying type, retro game sprite' },
  { id: 'twisted_spoon',   prompt: 'pixel art RPG item icon, silver spoon bent at odd angle, Pokemon Twisted Spoon, psychic type, retro game sprite' },
  { id: 'spell_tag',       prompt: 'pixel art RPG item icon, purple haunted paper tag, Pokemon Spell Tag, ghost type, cursed writing, retro game sprite' },
  { id: 'metal_coat',      prompt: 'pixel art RPG item icon, silver metallic plating slab, Pokemon Metal Coat, steel type, shiny, retro game sprite' },
  { id: 'dragon_fang',     prompt: 'pixel art RPG item icon, white sharp dragon tooth fang, Pokemon Dragon Fang, serrated, retro game sprite' },
  { id: 'poison_barb',     prompt: 'pixel art RPG item icon, purple poisoned spike barb, Pokemon Poison Barb, venomous thorn, retro game sprite' },
  { id: 'silk_scarf',      prompt: 'pixel art RPG item icon, pale pink flowing silk scarf, Pokemon Silk Scarf, normal type booster, retro game sprite' },
  { id: 'never_melt_ice',  prompt: 'pixel art RPG item icon, blue shimmering ice crystal shard, Pokemon Never-Melt Ice, frozen, retro game sprite' },
  { id: 'black_belt',      prompt: 'pixel art RPG item icon, black martial arts belt with white stripe, Pokemon Black Belt, fighting type, retro game sprite' },
  { id: 'expert_belt',     prompt: 'pixel art RPG item icon, brown leather champion belt with gold buckle, Pokemon Expert Belt, retro game sprite' },
  { id: 'muscle_band',     prompt: 'pixel art RPG item icon, red striped cloth muscle band, Pokemon Muscle Band, physical power, retro game sprite' },
  { id: 'wise_glasses',    prompt: 'pixel art RPG item icon, small round wire-frame spectacles, Pokemon Wise Glasses, special power, retro game sprite' },
  { id: 'hard_stone',      prompt: 'pixel art RPG item icon, rough grey stone rock, Pokemon Hard Stone, heavy, retro game sprite' },
  { id: 'silver_powder',   prompt: 'pixel art RPG item icon, small silver glittering powder pouch, Pokemon Silver Powder, bug type, retro game sprite' },
  { id: 'binding_band',    prompt: 'pixel art RPG item icon, thick metal ring band, Pokemon Binding Band, constricting, retro game sprite' },

  // Stat boosters
  { id: 'assault_vest',    prompt: 'pixel art RPG item icon, dark tactical combat vest, Pokemon Assault Vest, retro game sprite' },
  { id: 'weakness_policy', prompt: 'pixel art RPG item icon, ancient parchment scroll, Pokemon Weakness Policy, retro game sprite' },

  // Consumables
  { id: 'potion',          prompt: 'pixel art RPG item icon, small blue glass bottle with P label, Pokemon Potion, heal item, retro game sprite' },
  { id: 'super_potion',    prompt: 'pixel art RPG item icon, medium blue bottle with SP label, Pokemon Super Potion, retro game sprite' },
  { id: 'hyper_potion',    prompt: 'pixel art RPG item icon, large blue bottle glowing, Pokemon Hyper Potion, retro game sprite' },
  { id: 'max_potion',      prompt: 'pixel art RPG item icon, large pink full-restore bottle, Pokemon Max Potion, retro game sprite' },
  { id: 'full_restore',    prompt: 'pixel art RPG item icon, white medicine bottle with red cross, Pokemon Full Restore, retro game sprite' },
  { id: 'full_heal',       prompt: 'pixel art RPG item icon, pink status cure medicine bottle, Pokemon Full Heal, retro game sprite' },
  { id: 'antidote',        prompt: 'pixel art RPG item icon, purple antidote medicine vial, Pokemon Antidote, retro game sprite' },
  { id: 'burn_heal',       prompt: 'pixel art RPG item icon, orange burn cure spray bottle, Pokemon Burn Heal, retro game sprite' },
  { id: 'pokemon_food',    prompt: 'pixel art RPG item icon, small bowl of colorful Pokémon kibble food, retro game sprite' },
  { id: 'revive',          prompt: 'pixel art RPG item icon, small purple revival bottle with star, Pokemon Revive, revitalizing energy, retro game sprite' },
  { id: 'max_revive',      prompt: 'pixel art RPG item icon, large golden revival bottle shining, Pokemon Max Revive, retro game sprite' },
  { id: 'rare_candy',      prompt: 'pixel art RPG item icon, wrapped pink swirled candy with star, Pokemon Rare Candy, level up, retro game sprite' },
  { id: 'x_attack',        prompt: 'pixel art RPG item icon, red X-shaped attack booster vial, Pokemon X Attack, retro game sprite' },
  { id: 'x_speed',         prompt: 'pixel art RPG item icon, yellow speed arrow booster vial, Pokemon X Speed, retro game sprite' },
  { id: 'x_sp_atk',        prompt: 'pixel art RPG item icon, blue oval special attack booster, Pokemon X Sp Atk, retro game sprite' },
  { id: 'dire_hit',        prompt: 'pixel art RPG item icon, yellow starburst critical hit token, Pokemon Dire Hit, retro game sprite' },
  { id: 'escape_rope',     prompt: 'pixel art RPG item icon, coiled orange rope, Pokemon Escape Rope, retro game sprite' },
  { id: 'ether',           prompt: 'pixel art RPG item icon, small blue glass PP restore vial, Pokemon Ether, magical mist inside, retro game sprite' },
  { id: 'max_elixir',      prompt: 'pixel art RPG item icon, rainbow shimmer elixir vial, Pokemon Max Elixir, full PP restore, retro game sprite' },
  { id: 'reroll_token',    prompt: 'pixel art RPG item icon, gold hexagonal coin with dice pattern, reroll token, retro game sprite' },
  { id: 'sacred_ash',      prompt: 'pixel art RPG item icon, ancient grey ash urn with golden lid, Pokemon Sacred Ash, sacred container, retro game sprite' },
  { id: 'star_piece',      prompt: 'pixel art RPG item icon, shiny red five-pointed gem star, Pokemon Star Piece, sparkling, retro game sprite' },
  { id: 'big_nugget',      prompt: 'pixel art RPG item icon, large golden ore nugget, Pokemon Big Nugget, shiny gold, retro game sprite' },
  { id: 'protein',         prompt: 'pixel art RPG item icon, red muscle protein capsule pill, Pokemon Protein, permanent boost, retro game sprite' },
  { id: 'iron',            prompt: 'pixel art RPG item icon, grey iron ingot bar, Pokemon Iron stat booster, heavy metal, retro game sprite' },
  { id: 'carbos',          prompt: 'pixel art RPG item icon, yellow speed carbon capsule, Pokemon Carbos, speed booster, retro game sprite' },
  { id: 'item_pouch',      prompt: 'pixel art RPG item icon, brown leather drawstring pouch bag, item pouch, retro game sprite' },
  { id: 'evolution_stone', prompt: 'pixel art RPG item icon, glowing fire evolution stone orange, Pokemon Fire Stone, evolution, retro game sprite' },
  { id: 'ace_trainers_gift', prompt: 'pixel art RPG item icon, gift box with red ribbon bow, Pokemon trainer gift, retro game sprite' },
  { id: 'team_vitals',     prompt: 'pixel art RPG item icon, red heart with green plus cross, team heal item, Pokemon, retro game sprite' },
];

// Deduplicate by id
const unique = [...new Map(ITEMS.map(i => [i.id, i])).values()];

async function falPost(model, body) {
  const resp = await fetch(`https://fal.run/${model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`fal.run/${model} ${resp.status}: ${text.slice(0, 200)}`);
  }
  return resp.json();
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    proto.get(url, res => {
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', err => { fs.unlink(dest, () => {}); reject(err); });
  });
}

async function processItem(item) {
  const outPath = path.join(OUT_DIR, `${item.id}.png`);
  if (fs.existsSync(outPath)) {
    console.log(`  ⏭  ${item.id} already exists, skipping`);
    return;
  }

  try {
    // 1. Generate image
    console.log(`  🎨 Generating ${item.id}...`);
    const genResult = await falPost('fal-ai/nano-banana-pro', {
      prompt: item.prompt + ', centered object, no text, white background',
      num_images: 1,
      aspect_ratio: '1:1',
      output_format: 'png',
      resolution: '1K',
    });

    const imageUrl = genResult.images?.[0]?.url;
    if (!imageUrl) throw new Error('No image URL in response: ' + JSON.stringify(genResult).slice(0,200));

    // 2. Remove background
    console.log(`  ✂️  Removing background for ${item.id}...`);
    let finalUrl = imageUrl;
    try {
      const rmResult = await falPost('fal-ai/bria-rmbg', {
        image_url: imageUrl,
      });
      finalUrl = rmResult.image?.url || rmResult.images?.[0]?.url || imageUrl;
    } catch (e) {
      console.warn(`  ⚠️  Background removal failed for ${item.id}: ${e.message} — using original`);
    }

    // 3. Download PNG
    console.log(`  💾 Saving ${item.id}.png...`);
    await downloadFile(finalUrl, outPath);
    console.log(`  ✅ Done: ${item.id}`);

  } catch (e) {
    console.error(`  ❌ Failed ${item.id}: ${e.message}`);
  }
}

async function main() {
  console.log(`Generating ${unique.length} item icons...\n`);

  // Process in batches of 4 to avoid rate limits
  const BATCH = 4;
  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH);
    console.log(`\nBatch ${Math.floor(i/BATCH)+1}/${Math.ceil(unique.length/BATCH)}: ${batch.map(b=>b.id).join(', ')}`);
    await Promise.all(batch.map(processItem));
  }

  console.log('\n✨ All done! Images saved to public/items/');
}

main().catch(console.error);
