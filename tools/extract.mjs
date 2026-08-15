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
import { selectVariantPngs } from './lib/icon-variant-files.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const VARIANT_ORDER = ['minimap', 'normal', 'gloat', 'critical', 'minimap-low-res'];
const SAFE_VARIANT_ID = /^[a-z0-9][a-z0-9-]{0,31}$/;

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

/**
 * Resolve the path the user wrote in pack.json `vpk` to an actual .vpk on disk.
 * If the file is a .zip it gets unzipped into `workDir` and the path to the
 * extracted .vpk is returned.
 */
async function resolveVpkPath(vpkPath, workDir) {
  if (!vpkPath.toLowerCase().endsWith('.zip')) return vpkPath;
  await fs.mkdir(workDir, { recursive: true });
  console.log(`[extract] unzipping ${path.basename(vpkPath)} → ${workDir}`);
  await run('unzip', ['-q', '-o', vpkPath, '-d', workDir]);
  // Pick the first .vpk inside the zip, regardless of directory depth.
  const stack = [workDir];
  while (stack.length) {
    const dir = stack.pop();
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile() && e.name.toLowerCase().endsWith('.vpk')) return full;
    }
  }
  throw new Error(`No .vpk found inside ${vpkPath}`);
}

async function copyVariantFiles(srcDir, destDir, suffixes) {
  await fs.mkdir(destDir, { recursive: true });
  const entries = (await listDir(srcDir)).filter((entry) => entry.isFile());
  const selected = selectVariantPngs(entries.map((entry) => entry.name), suffixes);
  let copied = 0;
  for (const { character, fileName } of selected) {
    await fs.copyFile(path.join(srcDir, fileName), path.join(destDir, `${character}.png`));
    copied += 1;
  }
  return copied;
}

async function applyOverrides(packDir, packMeta, destRoot) {
  const overridesDir = path.join(packDir, packMeta.iconOverridesDir || 'icons-extra');
  if (!existsSync(overridesDir)) return 0;
  let applied = 0;
  for (const variantEntry of await listDir(overridesDir)) {
    if (!variantEntry.isDirectory() || !SAFE_VARIANT_ID.test(variantEntry.name)) continue;
    const variant = variantEntry.name;
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

function normalizeSources(packMeta) {
  const sources = { ...(packMeta.vpkSources ?? {}) };
  if (packMeta.vpk) {
    if (sources.default) throw new Error('vpk conflicts with vpkSources.default');
    sources.default = packMeta.vpk;
  }
  return sources;
}

function normalizeExtraction(packMeta, defaults, sourceIds) {
  const variants = packMeta.extraction?.variants ?? defaults.extraction.variants;
  const normalized = {};
  for (const [variant, config] of Object.entries(variants)) {
    if (!SAFE_VARIANT_ID.test(variant)) continue;
    const source = config.source ?? (sourceIds.length === 1 ? sourceIds[0] : null);
    if (!source || !sourceIds.includes(source)) {
      throw new Error(`variant ${variant} references missing VPK source ${source ?? '(none)'}`);
    }
    normalized[variant] = {
      source,
      suffixes: config.suffixes ?? [config.suffix],
    };
  }
  return {
    filePathFilter:
      packMeta.extraction?.filePathFilter ?? defaults.extraction.filePathFilter,
    variants: normalized,
  };
}

async function extractPack(packDir, outputDir) {
  const packMeta = await readJson(path.join(packDir, 'pack.json'));
  const defaults = await loadDefaults();
  const sources = normalizeSources(packMeta);
  const sourceIds = Object.keys(sources);
  const extraction = sourceIds.length > 0
    ? normalizeExtraction(packMeta, defaults, sourceIds)
    : null;

  console.log(`\n[extract] ${packMeta.id} (${packMeta.game})`);
  const destRoot = path.resolve(outputDir);
  await fs.rm(destRoot, { recursive: true, force: true });
  await fs.mkdir(destRoot, { recursive: true });

  // 1. VPK extraction (optional)
  for (const [sourceId, sourceFile] of Object.entries(sources)) {
    const vpkSourcePath = path.join(packDir, sourceFile);
    if (!existsSync(vpkSourcePath)) {
      throw new Error(`VPK not found at ${vpkSourcePath}`);
    }
    const unzipDir = path.join(destRoot, '.unzip', sourceId);
    const vpkPath = await resolveVpkPath(vpkSourcePath, unzipDir);
    const s2v = await findS2Viewer();
    const tmpExtractDir = path.join(destRoot, '.tmp', sourceId);
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
      if (cfg.source !== sourceId) continue;
      const variantDest = path.join(destRoot, variant);
      const suffixes = cfg.suffixes ?? [cfg.suffix];
      const n = await copyVariantFiles(decompiledDir, variantDest, suffixes);
      console.log(`[extract]   variant ${variant}: ${n} icon(s) from VPK`);
    }
  }
  await fs.rm(path.join(destRoot, '.tmp'), { recursive: true, force: true });
  await fs.rm(path.join(destRoot, '.unzip'), { recursive: true, force: true });
  if (sourceIds.length === 0) {
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
    variantLabels: packMeta.variantLabels,
    icons: {},
  };
  const ignoredVariants = new Set(packMeta.doNotUse ?? []);
  const outputEntries = await listDir(destRoot);
  const variants = outputEntries
    .filter((entry) => entry.isDirectory() && SAFE_VARIANT_ID.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => {
      const ai = VARIANT_ORDER.indexOf(a);
      const bi = VARIANT_ORDER.indexOf(b);
      if (ai >= 0 || bi >= 0) return (ai < 0 ? Number.MAX_SAFE_INTEGER : ai) - (bi < 0 ? Number.MAX_SAFE_INTEGER : bi);
      return a.localeCompare(b);
    });
  for (const variant of variants) {
    if (ignoredVariants.has(variant)) continue;
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
