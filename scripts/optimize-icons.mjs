#!/usr/bin/env node
/**
 * Optimizes PWA icons through TinyPNG API
 * Requires TINIFY_API_KEY in environment
 */

import tinify from 'tinify';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile, writeFile, stat } from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '../public');

// Load API key from .env.local
import { config } from 'dotenv';
config({ path: join(__dirname, '../.env.local') });

tinify.key = process.env.TINIFY_API_KEY;

const ICONS_TO_OPTIMIZE = [
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon-48x48.png',
  'apple-touch-icon.png',
  'icon-192x192.png',
  'icon-512x512.png',
  'images/autorev-logo-navy.png',
];

async function getFileSize(path) {
  const stats = await stat(path);
  return stats.size;
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function optimizeIcons() {
  console.log('🗜️  Optimizing icons with TinyPNG...\n');

  let totalOriginal = 0;
  let totalOptimized = 0;

  for (const iconName of ICONS_TO_OPTIMIZE) {
    const iconPath = join(PUBLIC_DIR, iconName);
    
    try {
      const originalSize = await getFileSize(iconPath);
      totalOriginal += originalSize;

      // Read, optimize, and write back
      const source = tinify.fromFile(iconPath);
      await source.toFile(iconPath);

      const optimizedSize = await getFileSize(iconPath);
      totalOptimized += optimizedSize;

      const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
      console.log(`✅ ${iconName}`);
      console.log(`   ${formatBytes(originalSize)} → ${formatBytes(optimizedSize)} (${savings}% smaller)\n`);
    } catch (error) {
      console.error(`❌ ${iconName}: ${error.message}\n`);
    }
  }

  const totalSavings = ((1 - totalOptimized / totalOriginal) * 100).toFixed(1);
  console.log('─'.repeat(50));
  console.log(`📊 Total: ${formatBytes(totalOriginal)} → ${formatBytes(totalOptimized)} (${totalSavings}% smaller)`);
  
  // Show API usage
  console.log(`\n🔑 TinyPNG compressions used this month: ${tinify.compressionCount}`);
}

optimizeIcons().catch(console.error);
