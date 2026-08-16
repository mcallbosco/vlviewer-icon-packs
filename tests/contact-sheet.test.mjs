import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import sharp from 'sharp';
import { buildVariantSection } from '../tools/contact-sheet.mjs';

test('contact sheet contains portrait icons without cropping', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'contact-sheet-'));
  try {
    await sharp({
      create: {
        width: 48,
        height: 96,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 },
      },
    })
      .png()
      .toFile(path.join(tempDir, 'portrait.png'));

    const section = await buildVariantSection(tempDir, 'normal');
    const { data: sidePadding } = await sharp(section)
      .extract({ left: 12, top: 40, width: 1, height: 1 })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const { data: iconCenter } = await sharp(section)
      .extract({ left: 56, top: 80, width: 1, height: 1 })
      .raw()
      .toBuffer({ resolveWithObject: true });

    assert.deepEqual([...sidePadding], [26, 32, 38, 255]);
    assert.deepEqual([...iconCenter], [255, 0, 0, 255]);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
