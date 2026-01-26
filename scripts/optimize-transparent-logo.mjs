#!/usr/bin/env node
/**
 * Optimizes the transparent AutoRev logo through TinyPNG
 */

import tinify from 'tinify';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { stat } from 'fs/promises';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../.env.local') });

tinify.key = process.env.TINIFY_API_KEY;

const LOGO_PATH = join(__dirname, '../public/images/autorev-logo-transparent.png');

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function optimize() {
  console.log('🗜️  Optimizing transparent logo with TinyPNG...\n');

  const originalSize = (await stat(LOGO_PATH)).size;
  console.log(`Original: ${formatBytes(originalSize)}`);

  const source = tinify.fromFile(LOGO_PATH);
  await source.toFile(LOGO_PATH);

  const optimizedSize = (await stat(LOGO_PATH)).size;
  const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

  console.log(`Optimized: ${formatBytes(optimizedSize)} (${savings}% smaller)`);
  console.log(`\n✅ Saved to: public/images/autorev-logo-transparent.png`);
  console.log(`🔑 TinyPNG compressions used this month: ${tinify.compressionCount}`);
}

optimize().catch(console.error);
