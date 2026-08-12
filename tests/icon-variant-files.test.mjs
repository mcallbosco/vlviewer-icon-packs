import assert from 'node:assert/strict';
import test from 'node:test';

import { selectVariantPngs } from '../tools/lib/icon-variant-files.mjs';

test('large icon extraction accepts PSD- and PNG-backed small textures', () => {
  const selected = selectVariantPngs([
    'chrono_sm_psd.png',
    'duplicate_sm_psd.png',
    'duplicate_sm_png.png',
    'hornet_sm_png.png',
    'hornet_sm_psd_d09ce06e.png',
    'hornet_mm_psd.png',
  ], ['_sm_png', '_sm_psd']);

  assert.deepEqual(
    selected.map(({ character, fileName }) => ({ character, fileName })),
    [
      { character: 'chrono', fileName: 'chrono_sm_psd.png' },
      { character: 'duplicate', fileName: 'duplicate_sm_png.png' },
      { character: 'hornet', fileName: 'hornet_sm_png.png' },
    ],
  );
});

test('low-res minimap extraction accepts canonical mm textures without assuming dimensions', () => {
  const selected = selectVariantPngs([
    'chrono_mm_psd.png',
    'hornet_mm_png.png',
    'hornet_mm_psd.png',
    'hornet_sm_png.png',
  ], ['_mm_png', '_mm_psd']);

  assert.deepEqual(
    selected.map(({ character, fileName }) => ({ character, fileName })),
    [
      { character: 'chrono', fileName: 'chrono_mm_psd.png' },
      { character: 'hornet', fileName: 'hornet_mm_png.png' },
    ],
  );
});
