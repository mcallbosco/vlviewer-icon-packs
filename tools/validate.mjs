#!/usr/bin/env node
/**
 * tools/validate.mjs
 *
 * Walks every packs/<game>/<id>/pack.json, validates it against
 * schemas/pack.schema.json, and runs structural checks:
 *   - VPK exists if referenced
 *   - At least one variant available (VPK extraction OR icons-extra)
 *
 * Exits non-zero if any pack fails. Used by the validate workflow.
 */

import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..');

async function loadSchema() {
  const raw = await fs.readFile(path.join(REPO_ROOT, 'schemas/pack.schema.json'), 'utf8');
  return JSON.parse(raw);
}

async function findPackJsons() {
  const packsRoot = path.join(REPO_ROOT, 'packs');
  if (!existsSync(packsRoot)) return [];
  const results = [];
  const games = await fs.readdir(packsRoot, { withFileTypes: true });
  for (const game of games) {
    if (!game.isDirectory()) continue;
    const packs = await fs.readdir(path.join(packsRoot, game.name), { withFileTypes: true });
    for (const pack of packs) {
      if (!pack.isDirectory()) continue;
      const packJson = path.join(packsRoot, game.name, pack.name, 'pack.json');
      if (existsSync(packJson)) results.push(packJson);
    }
  }
  return results;
}

async function validateOne(ajv, schema, packJsonPath) {
  const raw = await fs.readFile(packJsonPath, 'utf8');
  let meta;
  try {
    meta = JSON.parse(raw);
  } catch (err) {
    return { ok: false, errors: [`invalid JSON: ${err.message}`] };
  }
  const validate = ajv.compile(schema);
  const ok = validate(meta);
  const errors = [];
  if (!ok) {
    for (const e of validate.errors) {
      errors.push(`${e.instancePath || '/'} ${e.message}`);
    }
  }

  // Structural checks
  const packDir = path.dirname(packJsonPath);
  if (meta.vpk && !existsSync(path.join(packDir, meta.vpk))) {
    errors.push(`vpk file missing: ${meta.vpk}`);
  }
  const overridesDir = path.join(packDir, meta.iconOverridesDir || 'icons-extra');
  const hasOverrides = existsSync(overridesDir);
  if (!meta.vpk && !hasOverrides) {
    errors.push('pack ships no content (no vpk and no icons-extra/ folder)');
  }

  return { ok: errors.length === 0, errors };
}

async function main() {
  const schema = await loadSchema();
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  const packJsons = await findPackJsons();
  if (packJsons.length === 0) {
    console.log('[validate] no packs found — nothing to do');
    return;
  }
  let failed = 0;
  for (const pj of packJsons) {
    const rel = path.relative(REPO_ROOT, pj);
    const { ok, errors } = await validateOne(ajv, schema, pj);
    if (ok) {
      console.log(`[validate] ok    ${rel}`);
    } else {
      failed += 1;
      console.error(`[validate] FAIL  ${rel}`);
      for (const e of errors) console.error(`           - ${e}`);
    }
  }
  if (failed > 0) {
    console.error(`\n${failed} pack(s) failed validation.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[validate] unexpected error:', err);
  process.exit(1);
});
