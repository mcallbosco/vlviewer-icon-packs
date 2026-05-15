#!/usr/bin/env node
/**
 * tools/extract.mjs
 *
 * Local helper for testing a pack: decompiles the pack's VPK, applies any
 * icons-extra/ overrides, and writes a build/ folder mirroring what the
 * website will see.
 *
 * Usage:
 *   node tools/extract.mjs packs/<game>/<pack-id> [output-dir]
 *
 * Source2Viewer-CLI is located via, in order:
 *   1. $S2VIEWER_BIN env var
 *   2. ~/Apps/S2ViewerCLI/Source2Viewer-CLI
 *   3. on $PATH as "Source2Viewer-CLI"
 */

import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const VARIANT_ORDER = ['minimap', 'normal', 'gloat', 'critical'];

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function findS2Viewer() {
  if (process.env.S2VIEWER_BIN && existsSync(process.env.S2VIEWER_BIN)) {
    return process.env.S2VIEWER_BIN;
  }
  const home = path.join(os.homedir(), 'Apps/S2ViewerCLI/Source2Viewer-CLI');
  if (existsSync(home)) return home;
  return 'Source2Viewer-CLI';
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', ...opts });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) reject(new Error(`${cmd} exited with code ${code}`));
      else resolve();
    });
  });
}

async function listDir(dir) {
  try {
    return await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

async function copyVariantFiles(srcDir, destDir, suffix) {
  await fs.mkdir(destDir, { recursive: true });
  const entries = await listDir(srcDir);
  let copied = 0;
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.toLowerCase().endsWith('.png')) continue;
    const stem = path.basename(entry.name, '.png');
    if (!stem.endsWith(suffix)) continue;
    const character = stem.slice(0, -suffix.length);
    if (!character) continue;
    await fs.copyFile(path.join(srcDir, entry.name), path.join(destDir, `${character}.png`));
    copied += 1;
  }
  return copied;
}

async function applyOverrides(packDir, packMeta, destRoot) {
  const overridesDir = path.join(packDir, packMeta.iconOverridesDir || 'icons-extra');
  if (!existsSync(overridesDir)) return 0;
  let applied = 0;
  for (const variant of VARIANT_ORDER) {
    const src = path.join(overridesDir, variant);
    const entries = await listDir(src);
    if (entries.length === 0) continue;
    const dst = path.join(destRoot, variant);
    await fs.mkdir(dst, { recursive: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.png')) continue;
      await fs.copyFile(path.join(src, entry.name), path.join(dst, entry.name));
      applied += 1;
    }
  }
  return applied;
}

async function loadDefaults() {
  return readJson(path.join(REPO_ROOT, 'schemas/defaults.json'));
}

async function extractPack(packDir, outputDir) {
  const packMeta = await readJson(path.join(packDir, 'pack.json'));
  const defaults = await loadDefaults();
  const extraction = {
    filePathFilter:
      packMeta.extraction?.filePathFilter ?? defaults.extraction.filePathFilter,
    variants: packMeta.extraction?.variants ?? defaults.extraction.variants,
  };

  console.log(`\n[extract] ${packMeta.id} (${packMeta.game})`);
  const destRoot = path.resolve(outputDir);
  await fs.rm(destRoot, { recursive: true, force: true });
  await fs.mkdir(destRoot, { recursive: true });

  // 1. VPK extraction (optional)
  if (packMeta.vpk) {
    const vpkPath = path.join(packDir, packMeta.vpk);
    if (!existsSync(vpkPath)) {
      throw new Error(`VPK not found at ${vpkPath}`);
    }
    const s2v = await findS2Viewer();
    const tmpExtractDir = path.join(destRoot, '.tmp');
    await fs.mkdir(tmpExtractDir, { recursive: true });
    console.log(`[extract] decompiling ${path.basename(vpkPath)} via ${s2v}`);
    await run(s2v, [
      '-i', vpkPath,
      '-o', tmpExtractDir,
      '-d',
      '--vpk_filepath', extraction.filePathFilter,
      '--vpk_extensions', 'vtex_c',
    ]);
    const decompiledDir = path.join(tmpExtractDir, extraction.filePathFilter);
    for (const [variant, cfg] of Object.entries(extraction.variants)) {
      if (!VARIANT_ORDER.includes(variant)) continue;
      const variantDest = path.join(destRoot, variant);
      const n = await copyVariantFiles(decompiledDir, variantDest, cfg.suffix);
      console.log(`[extract]   variant ${variant}: ${n} icon(s) from VPK`);
    }
    await fs.rm(tmpExtractDir, { recursive: true, force: true });
  } else {
    console.log('[extract] no VPK, skipping decompile');
  }

  // 2. Apply icons-extra overrides
  const applied = await applyOverrides(packDir, packMeta, destRoot);
  if (applied > 0) {
    console.log(`[extract] applied ${applied} override file(s) from ${packMeta.iconOverridesDir || 'icons-extra'}/`);
  }

  // 3. Build a manifest preview
  const manifest = {
    id: packMeta.id,
    label: packMeta.label,
    familyId: packMeta.familyId,
    description: packMeta.description,
    hidden: packMeta.hidden ?? false,
    credits: packMeta.credits,
    license: packMeta.license,
    icons: {},
  };
  for (const variant of VARIANT_ORDER) {
    const variantDir = path.join(destRoot, variant);
    const entries = await listDir(variantDir);
    const files = entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.png'))
      .map((e) => e.name)
      .sort();
    if (files.length === 0) continue;
    manifest.icons[variant] = {};
    for (const f of files) {
      const stem = path.basename(f, '.png').toLowerCase();
      manifest.icons[variant][stem] = `${variant}/${f}`;
    }
  }
  await fs.writeFile(
    path.join(destRoot, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    'utf8',
  );
  console.log(`[extract] wrote manifest with variants: ${Object.keys(manifest.icons).join(', ') || '(none)'}`);
  console.log(`[extract] output: ${destRoot}`);
}

async function main() {
  const [, , packArg, outArg] = process.argv;
  if (!packArg) {
    console.error('Usage: node tools/extract.mjs packs/<game>/<pack-id> [output-dir]');
    process.exit(1);
  }
  const packDir = path.resolve(packArg);
  if (!existsSync(path.join(packDir, 'pack.json'))) {
    console.error(`No pack.json found at ${packDir}`);
    process.exit(1);
  }
  const outDir = path.resolve(outArg ?? path.join(REPO_ROOT, 'build', path.basename(packDir)));
  await extractPack(packDir, outDir);
}

main().catch((err) => {
  console.error('[extract] error:', err.message);
  process.exit(1);
});
