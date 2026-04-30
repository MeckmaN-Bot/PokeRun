/**
 * Removes backgrounds from all generated item icons using fal-ai/birefnet
 * Run after generate-item-icons.mjs
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const FAL_KEY = 'c23401b4-547e-4e1f-8cbe-a7373549ecdb:b08b5877ee19efbfc22a43f907539cbb';
const ITEMS_DIR = path.resolve('/Users/Marius-Work/PokeRun/public/items');
// Serve images temporarily via a local URL or upload them —
// birefnet needs a URL, not a local file.
// Strategy: re-download original images from the generation step.
// Better: track URLs during generation.
// For now, we'll use fal-ai/imageutils/rembg which accepts base64

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
    throw new Error(`fal.run/${model} ${resp.status}: ${text.slice(0, 300)}`);
  }
  return resp.json();
}

async function toBase64DataUrl(filePath) {
  const data = fs.readFileSync(filePath);
  const b64 = data.toString('base64');
  return `data:image/png;base64,${b64}`;
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    proto.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', err => { fs.unlink(dest, () => {}); reject(err); });
  });
}

async function removeBackground(filePath) {
  const tmpPath = filePath.replace('.png', '.orig.png');

  // Skip if already processed (orig backup exists)
  if (fs.existsSync(tmpPath)) {
    console.log(`  ⏭  ${path.basename(filePath)} already processed`);
    return;
  }

  try {
    // Convert local file to base64 data URL
    const dataUrl = await toBase64DataUrl(filePath);

    console.log(`  ✂️  Processing ${path.basename(filePath)}...`);

    // Try birefnet first
    let result;
    try {
      result = await falPost('fal-ai/birefnet', {
        image_url: dataUrl,
        model: 'General Use (Light)',
        output_format: 'png',
      });
    } catch (e) {
      // Fallback to imageutils/rembg
      result = await falPost('fal-ai/imageutils/rembg', {
        image_url: dataUrl,
      });
    }

    const outUrl = result.image?.url || result.images?.[0]?.url;
    if (!outUrl) throw new Error('No output URL: ' + JSON.stringify(result).slice(0, 200));

    // Backup original
    fs.copyFileSync(filePath, tmpPath);

    // Download transparent version
    await downloadFile(outUrl, filePath);
    console.log(`  ✅ ${path.basename(filePath)} — background removed`);

  } catch (e) {
    console.error(`  ❌ ${path.basename(filePath)}: ${e.message}`);
  }
}

async function main() {
  const files = fs.readdirSync(ITEMS_DIR)
    .filter(f => f.endsWith('.png') && !f.endsWith('.orig.png'))
    .map(f => path.join(ITEMS_DIR, f));

  console.log(`Removing backgrounds from ${files.length} images...\n`);

  const BATCH = 3;
  for (let i = 0; i < files.length; i += BATCH) {
    const batch = files.slice(i, i + BATCH);
    await Promise.all(batch.map(removeBackground));
  }

  console.log('\n✨ Done! All backgrounds removed.');
}

main().catch(console.error);
