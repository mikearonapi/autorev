#!/usr/bin/env node
/**
 * Convert Vercel Blob Images to WebP
 * 
 * Downloads PNG/JPG images from specified folders, converts to WebP,
 * and re-uploads to Vercel Blob.
 * 
 * Usage:
 *   node scripts/convert-blob-images-to-webp.mjs
 *   node scripts/convert-blob-images-to-webp.mjs --dry-run
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load environment variables
function loadEnv() {
  const envPath = path.join(PROJECT_ROOT, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        let value = valueParts.join('=');
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (key && value) process.env[key] = value;
      }
    }
  }
}

loadEnv();

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const DRY_RUN = process.argv.includes('--dry-run');

// Folders to convert (exclude brand folders)
const FOLDERS_TO_CONVERT = [
  'articles',
  'site-design-v2', 
  'site-design',
  'cars',  // Only JPGs, WebPs already exist
  'user-uploads',
  'feedback-screenshots',
];

// Folders to skip (logos, brand assets)
const FOLDERS_TO_SKIP = [
  'brand',
  'brand-logos',
];

// WebP conversion settings
const WEBP_OPTIONS = {
  quality: 88,        // Good balance of quality/size
  effort: 6,          // Higher = better compression, slower
  lossless: false,    // Lossy for photos/screenshots
};

// For images that need lossless (detected by alpha channel)
const WEBP_LOSSLESS_OPTIONS = {
  lossless: true,
  effort: 6,
};

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

async function downloadImage(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function convertToWebP(buffer, pathname) {
  const image = sharp(buffer);
  const metadata = await image.metadata();
  
  // Use lossless for images with alpha channel that need it preserved perfectly
  // Most screenshots are fine with lossy compression even with alpha
  const options = WEBP_OPTIONS;
  
  const webpBuffer = await image.webp(options).toBuffer();
  
  return {
    buffer: webpBuffer,
    originalSize: buffer.length,
    newSize: webpBuffer.length,
    hasAlpha: metadata.hasAlpha,
  };
}

async function uploadToBlob(buffer, pathname) {
  const { put } = await import('@vercel/blob');
  
  const blob = await put(pathname, buffer, {
    access: 'public',
    contentType: 'image/webp',
    token: BLOB_TOKEN,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  
  return blob.url;
}

async function deleteFromBlob(url) {
  const { del } = await import('@vercel/blob');
  await del(url, { token: BLOB_TOKEN });
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     VERCEL BLOB IMAGE CONVERSION → WebP                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }
  
  if (!BLOB_TOKEN) {
    console.error('❌ ERROR: BLOB_READ_WRITE_TOKEN not found');
    process.exit(1);
  }
  
  const { list } = await import('@vercel/blob');
  
  // Get all blobs
  console.log('📋 Fetching blob list...');
  let allBlobs = [];
  let cursor;
  do {
    const result = await list({ token: BLOB_TOKEN, cursor, limit: 1000 });
    allBlobs = allBlobs.concat(result.blobs);
    cursor = result.cursor;
  } while (cursor);
  
  // Filter to convertible images
  const toConvert = allBlobs.filter(blob => {
    const folder = blob.pathname.split('/')[0];
    const ext = path.extname(blob.pathname).toLowerCase();
    
    // Skip folders we want to preserve
    if (FOLDERS_TO_SKIP.includes(folder)) return false;
    
    // Only process specified folders
    if (!FOLDERS_TO_CONVERT.includes(folder)) return false;
    
    // Only PNG and JPG files
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') return false;
    
    // For cars folder, only convert JPGs (WebPs already exist)
    if (folder === 'cars' && ext === '.png') return false;
    
    return true;
  });
  
  console.log(`\n📊 Found ${toConvert.length} images to convert\n`);
  
  // Group by folder for reporting
  const byFolder = {};
  toConvert.forEach(b => {
    const folder = b.pathname.split('/')[0];
    if (!byFolder[folder]) byFolder[folder] = [];
    byFolder[folder].push(b);
  });
  
  Object.entries(byFolder).forEach(([folder, blobs]) => {
    const size = blobs.reduce((s, b) => s + b.size, 0);
    console.log(`  ${folder}/: ${blobs.length} files (${formatBytes(size)})`);
  });
  
  if (DRY_RUN) {
    console.log('\n✅ Dry run complete. Run without --dry-run to convert.');
    return;
  }
  
  console.log('\n🔄 Starting conversion...\n');
  
  let converted = 0;
  let failed = 0;
  let totalOriginalSize = 0;
  let totalNewSize = 0;
  const errors = [];
  
  for (const blob of toConvert) {
    const ext = path.extname(blob.pathname).toLowerCase();
    const newPathname = blob.pathname.replace(/\.(png|jpe?g)$/i, '.webp');
    
    process.stdout.write(`⬇️  ${blob.pathname} (${formatBytes(blob.size)})...`);
    
    try {
      // Download
      const originalBuffer = await downloadImage(blob.url);
      
      // Convert
      const result = await convertToWebP(originalBuffer, blob.pathname);
      totalOriginalSize += result.originalSize;
      totalNewSize += result.newSize;
      
      const savings = ((1 - result.newSize / result.originalSize) * 100).toFixed(0);
      
      // Upload WebP
      await uploadToBlob(result.buffer, newPathname);
      
      // Delete original (only if different extension)
      if (newPathname !== blob.pathname) {
        await deleteFromBlob(blob.url);
      }
      
      converted++;
      console.log(` ✅ ${formatBytes(result.newSize)} (-${savings}%)`);
      
    } catch (error) {
      failed++;
      errors.push({ pathname: blob.pathname, error: error.message });
      console.log(` ❌ ${error.message}`);
    }
  }
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    CONVERSION COMPLETE                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log(`✅ Converted: ${converted}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`\n📊 Size reduction:`);
  console.log(`   Before: ${formatBytes(totalOriginalSize)}`);
  console.log(`   After:  ${formatBytes(totalNewSize)}`);
  console.log(`   Saved:  ${formatBytes(totalOriginalSize - totalNewSize)} (${((1 - totalNewSize / totalOriginalSize) * 100).toFixed(1)}%)`);
  
  if (errors.length > 0) {
    console.log('\n⚠️  Errors:');
    errors.forEach(e => console.log(`   ${e.pathname}: ${e.error}`));
  }
  
  console.log('\n📋 Next steps:');
  console.log('   1. Update lib/images.js to use .webp extensions');
  console.log('   2. Update any hardcoded image references in code');
  console.log('   3. Test the site to ensure images load correctly');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
