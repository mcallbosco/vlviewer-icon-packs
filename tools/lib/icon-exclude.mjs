import { promises as fs } from 'node:fs';
import path from 'node:path';

/** `variant/character.png` — one slash, no traversal, PNG only. */
const EXCLUDE_ICON_PATTERN = /^[a-z0-9][a-z0-9-]{0,31}\/[a-z0-9][a-z0-9._-]*\.png$/;

export function normalizeExcludeIcons(raw, label = 'excludeIcons') {
  if (raw == null) return [];
  if (!Array.isArray(raw)) {
    throw new Error(`${label} must be an array of relative PNG paths.`);
  }

  const seen = new Set();
  const normalized = [];
  for (const entry of raw) {
    if (typeof entry !== 'string' || !entry.trim()) {
      throw new Error(`${label} entries must be non-empty strings.`);
    }
    const value = entry.trim().replaceAll('\\', '/').replace(/^\.\//, '').toLowerCase();
    if (
      value.includes('..')
      || value.startsWith('/')
      || value.split('/').length !== 2
      || !EXCLUDE_ICON_PATTERN.test(value)
    ) {
      throw new Error(`${label} entry must be variant/file.png: ${entry}`);
    }
    if (seen.has(value)) {
      throw new Error(`${label} has a duplicate entry: ${value}`);
    }
    seen.add(value);
    normalized.push(value);
  }
  return normalized;
}

export function iconOutputKey(variant, fileName) {
  return `${String(variant)}/${path.basename(String(fileName))}`.replaceAll('\\', '/').toLowerCase();
}

/**
 * Delete excluded icons from an extracted pack root. Missing files are ignored
 * so packs can list character-select (or other) paths that were never extracted.
 */
export async function removeExcludedIcons(outputRoot, excludeIcons) {
  const resolvedRoot = path.resolve(outputRoot);
  let removed = 0;

  for (const relative of excludeIcons) {
    const [variant, fileName] = relative.split('/');
    const variantDirectory = path.join(resolvedRoot, variant);
    const relativeToRoot = path.relative(resolvedRoot, variantDirectory);
    if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
      throw new Error(`excludeIcons path escapes output: ${relative}`);
    }

    let entries;
    try {
      entries = await fs.readdir(variantDirectory, { withFileTypes: true });
    } catch (error) {
      if (error?.code === 'ENOENT') continue;
      throw error;
    }

    const match = entries.find(
      (entry) => entry.isFile() && entry.name.toLowerCase() === fileName,
    );
    if (!match) continue;

    const target = path.join(variantDirectory, match.name);
    const targetRelative = path.relative(resolvedRoot, target);
    if (targetRelative.startsWith('..') || path.isAbsolute(targetRelative)) {
      throw new Error(`excludeIcons path escapes output: ${relative}`);
    }
    await fs.unlink(target);
    removed += 1;
  }

  return removed;
}
