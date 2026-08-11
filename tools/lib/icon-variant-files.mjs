import path from 'node:path';

/** Select one decompiled PNG per character using suffix order as precedence. */
export function selectVariantPngs(fileNames, suffixes) {
  const normalizedSuffixes = suffixes.map((suffix) => suffix.toLowerCase());
  const selected = new Map();

  for (const fileName of [...fileNames].sort((a, b) => a.localeCompare(b))) {
    if (!fileName.toLowerCase().endsWith('.png')) continue;
    const stem = path.basename(fileName, path.extname(fileName));
    const lowerStem = stem.toLowerCase();
    const priority = normalizedSuffixes.findIndex((suffix) => lowerStem.endsWith(suffix));
    if (priority < 0) continue;

    const suffix = suffixes[priority];
    const character = stem.slice(0, -suffix.length);
    if (!character) continue;

    const key = character.toLowerCase();
    const current = selected.get(key);
    if (!current || priority < current.priority) {
      selected.set(key, { character, fileName, priority });
    }
  }

  return [...selected.values()].sort((a, b) => a.character.localeCompare(b.character));
}
