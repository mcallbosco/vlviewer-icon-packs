#!/usr/bin/env node
/**
 * tools/contact-sheet.mjs
 *
 * Builds a PNG contact sheet of all icons in an extracted pack directory.
 * Used by the PR preview workflow. Each variant gets a section. Tiles are
 * captioned with their character key.
 *
 * Usage:
 *   node tools/contact-sheet.mjs build/<pack-id> output.png
 */

import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';

const VARIANT_ORDER = ['minimap', 'normal', 'gloat', 'critical'];
const TILE = 96;        // tile size (px)
const COLS = 8;
const PADDING = 8;
const HEADER = 28;      // per-variant section header
const TITLE = 40;       // overall title bar
const CAPTION = 16;     // caption strip under each tile
const BG = { r: 26, g: 32, b: 38, alpha: 1 };
const FG = '#e5e7eb';
const SUB = '#9ca3af';

function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]),
  );
}

function svgText(text, w, h, opts = {}) {
  const fontSize = opts.fontSize ?? 12;
  const color = opts.color ?? FG;
  const anchor = opts.anchor ?? 'middle';
  const x = anchor === 'middle' ? w / 2 : 8;
  const y = opts.y ?? Math.floor(h / 2 + fontSize / 3);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <rect width="100%" height="100%" fill="rgb(${BG.r},${BG.g},${BG.b})"/>
      <text x="${x}" y="${y}" font-family="sans-serif" font-size="${fontSize}" fill="${color}" text-anchor="${anchor}">${escapeXml(text)}</text>
    </svg>`,
    'utf8',
  );
}

async function buildVariantSection(variantDir, variantName) {
  let entries;
  try {
    entries = await fs.readdir(variantDir, { withFileTypes: true });
  } catch {
    return null;
  }
  const files = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.png'))
    .map((e) => e.name)
    .sort();
  if (files.length === 0) return null;

  const rows = Math.ceil(files.length / COLS);
  const cellW = TILE + PADDING;
  const cellH = TILE + CAPTION + PADDING;
  const width = COLS * cellW + PADDING;
  const height = HEADER + rows * cellH + PADDING;

  const composites = [];

  // Section header
  composites.push({
    input: svgText(`${variantName} (${files.length})`, width, HEADER, {
      fontSize: 14,
      anchor: 'start',
      y: 20,
    }),
    top: 0,
    left: 0,
  });

  for (let i = 0; i < files.length; i++) {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    const x = PADDING + col * cellW;
    const y = HEADER + PADDING + row * cellH;

    const file = files[i];
    const charKey = path.basename(file, '.png');
    const imgPath = path.join(variantDir, file);

    const tile = await sharp(imgPath)
      .resize(TILE, TILE, { fit: 'cover' })
      .png()
      .toBuffer();
    composites.push({ input: tile, top: y, left: x });

    composites.push({
      input: svgText(charKey, TILE, CAPTION, { fontSize: 10, color: SUB }),
      top: y + TILE,
      left: x,
    });
  }

  return await sharp({
    create: { width, height, channels: 4, background: BG },
  })
    .composite(composites)
    .png()
    .toBuffer();
}

async function buildSheet(packDir, outFile) {
  let packMeta = null;
  try {
    packMeta = JSON.parse(await fs.readFile(path.join(packDir, 'manifest.json'), 'utf8'));
  } catch {
    /* manifest is optional for sheet building */
  }

  const sections = [];
  for (const variant of VARIANT_ORDER) {
    const dir = path.join(packDir, variant);
    if (!existsSync(dir)) continue;
    const buf = await buildVariantSection(dir, variant);
    if (buf) sections.push(buf);
  }

  if (sections.length === 0) {
    throw new Error('No variant directories with PNGs found.');
  }

  const titleLabel = packMeta ? `${packMeta.label} (${packMeta.id})` : path.basename(packDir);
  const sectionMeta = await Promise.all(sections.map((s) => sharp(s).metadata()));
  const sheetWidth = Math.max(...sectionMeta.map((m) => m.width));
  const sheetHeight =
    TITLE + sectionMeta.reduce((acc, m) => acc + m.height, 0) + PADDING * sections.length;

  const composites = [
    {
      input: svgText(titleLabel, sheetWidth, TITLE, { fontSize: 18, anchor: 'start', y: 28 }),
      top: 0,
      left: 0,
    },
  ];
  let y = TITLE;
  for (let i = 0; i < sections.length; i++) {
    composites.push({ input: sections[i], top: y, left: 0 });
    y += sectionMeta[i].height + PADDING;
  }

  await sharp({
    create: { width: sheetWidth, height: sheetHeight, channels: 4, background: BG },
  })
    .composite(composites)
    .png()
    .toFile(outFile);

  console.log(`[contact-sheet] wrote ${outFile} (${sheetWidth}x${sheetHeight})`);
}

async function main() {
  const [, , packArg, outArg] = process.argv;
  if (!packArg || !outArg) {
    console.error('Usage: node tools/contact-sheet.mjs <pack-build-dir> <output.png>');
    process.exit(1);
  }
  await buildSheet(packArg, outArg);
}

main().catch((err) => {
  console.error('[contact-sheet] error:', err.message);
  process.exit(1);
});
