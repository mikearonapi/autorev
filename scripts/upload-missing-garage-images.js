#!/usr/bin/env node
/**
 * Upload Missing Garage Images to Vercel Blob
 * 
 * Checks which garage images exist locally but are missing from Blob storage,
 * then uploads all missing images.
 * 
 * Usage:
 *   node scripts/upload-missing-garage-images.js          # Check and upload missing
 *   node scripts/upload-missing-garage-images.js --check  # Only check, don't upload
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load environment variables from .env.local
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
        if (key && value) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const BLOB_BASE_URL = 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com';
const GENERATED_IMAGES_DIR = path.join(PROJECT_ROOT, 'generated-images', 'garage');

/**
 * Check if an image exists on Vercel Blob
 */
async function checkBlobExists(slug) {
  const url = `${BLOB_BASE_URL}/garage/${slug}/exclusive.webp`;
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Upload an image to Vercel Blob
 */
async function uploadToBlob(localPath, slug) {
  if (!BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN not set in environment');
  }
  
  const sharp = (await import('sharp')).default;
  const { put } = await import('@vercel/blob');
  
  // Convert to optimized WebP
  const webpBuffer = await sharp(localPath)
    .webp({ quality: 85 })
    .toBuffer();
  
  const blobPath = `garage/${slug}/exclusive.webp`;
  
  const blob = await put(blobPath, webpBuffer, {
    access: 'public',
    contentType: 'image/webp',
    token: BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  
  return blob.url;
}

/**
 * Get all local garage images
 */
function getLocalGarageImages() {
  const files = fs.readdirSync(GENERATED_IMAGES_DIR);
  const garageImages = files
    .filter(f => f.endsWith('-garage.png') || f.endsWith('-garage.jpg'))
    .map(f => {
      const slug = f.replace(/-garage\.(png|jpg)$/, '');
      return {
        slug,
        localPath: path.join(GENERATED_IMAGES_DIR, f),
        filename: f,
      };
    });
  return garageImages;
}

/**
 * Main function
 */
async function main() {
  const checkOnly = process.argv.includes('--check');
  
  console.log('🔍 Scanning local garage images...\n');
  
  const localImages = getLocalGarageImages();
  console.log(`📁 Found ${localImages.length} local garage images\n`);
  
  // Check each image against Blob storage
  console.log('☁️  Checking Vercel Blob status...\n');
  
  const missing = [];
  const existing = [];
  
  // Check in batches to avoid rate limiting
  const batchSize = 10;
  for (let i = 0; i < localImages.length; i += batchSize) {
    const batch = localImages.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (img) => {
        const exists = await checkBlobExists(img.slug);
        return { ...img, exists };
      })
    );
    
    for (const result of results) {
      if (result.exists) {
        existing.push(result);
      } else {
        missing.push(result);
      }
    }
    
    // Progress indicator
    const checked = Math.min(i + batchSize, localImages.length);
    process.stdout.write(`   Checked ${checked}/${localImages.length}\r`);
  }
  
  console.log('\n');
  console.log('=' .repeat(60));
  console.log('📊 STATUS REPORT');
  console.log('='.repeat(60));
  console.log(`   ✅ Already on Blob: ${existing.length}`);
  console.log(`   ❌ Missing from Blob: ${missing.length}`);
  console.log('='.repeat(60));
  
  if (missing.length === 0) {
    console.log('\n🎉 All garage images are already uploaded to Vercel Blob!');
    return;
  }
  
  console.log('\n📋 Missing images:');
  for (const img of missing) {
    console.log(`   - ${img.slug}`);
  }
  
  if (checkOnly) {
    console.log('\n(--check mode: skipping uploads)');
    return;
  }
  
  // Upload missing images
  console.log('\n🚀 Uploading missing images...\n');
  
  let uploaded = 0;
  let failed = 0;
  
  for (const img of missing) {
    try {
      process.stdout.write(`   ⬆️  Uploading ${img.slug}...`);
      const url = await uploadToBlob(img.localPath, img.slug);
      console.log(` ✅`);
      uploaded++;
    } catch (error) {
      console.log(` ❌ ${error.message}`);
      failed++;
    }
    
    // Small delay between uploads to be nice to the API
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 UPLOAD COMPLETE');
  console.log('='.repeat(60));
  console.log(`   ✅ Successfully uploaded: ${uploaded}`);
  if (failed > 0) {
    console.log(`   ❌ Failed: ${failed}`);
  }
  console.log('='.repeat(60));
  
  if (failed === 0) {
    console.log('\n🎉 All garage images are now on Vercel Blob!');
  }
}

main().catch(console.error);













