#!/usr/bin/env node
/**
 * Compress All Public Folder Images with TinyPNG
 * 
 * This script:
 * 1. Scans the public folder for PNG, JPG, and WebP images
 * 2. Compresses each with TinyPNG API
 * 3. Overwrites the original file with compressed version
 * 4. Tracks progress and total savings
 * 
 * Usage:
 *   node scripts/compress-public-images.mjs              # Compress all images
 *   node scripts/compress-public-images.mjs --dry-run    # Preview without changes
 *   node scripts/compress-public-images.mjs --folder images/cars  # Only compress specific folder
 * 
 * Environment:
 *   TINIFY_API_KEY - TinyPNG API key (from .env.local)
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.slice(0, eqIndex);
          let value = trimmed.slice(eqIndex + 1);
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

// Configuration
const TINIFY_API_KEY = process.env.TINIFY_API_KEY;
const CONCURRENT_LIMIT = 3; // Process 3 images at a time (be nice to free tier)
const MIN_SAVINGS_PERCENT = 5; // Skip if savings < 5%
const MIN_FILE_SIZE = 10 * 1024; // Skip files under 10KB

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FOLDER_FILTER = args.includes('--folder') 
  ? args[args.indexOf('--folder') + 1] 
  : null;

// =============================================================================
// TinyPNG API
// =============================================================================

async function compressWithTinify(buffer) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.tinify.com',
      port: 443,
      path: '/shrink',
      method: 'POST',
      auth: 'api:' + TINIFY_API_KEY,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': buffer.length
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          const result = JSON.parse(body);
          // Download the compressed image
          https.get(result.output.url, (imgRes) => {
            const chunks = [];
            imgRes.on('data', chunk => chunks.push(chunk));
            imgRes.on('end', () => resolve({
              buffer: Buffer.concat(chunks),
              input: result.input,
              output: result.output
            }));
            imgRes.on('error', reject);
          }).on('error', reject);
        } else if (res.statusCode === 429) {
          reject(new Error('RATE_LIMIT: Too many requests - wait and try again'));
        } else if (res.statusCode === 401) {
          reject(new Error('UNAUTHORIZED: Invalid API key'));
        } else {
          reject(new Error(`TinyPNG API error (${res.statusCode}): ${body}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

// =============================================================================
// File Operations
// =============================================================================

function findImages(dir, imageList = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findImages(filePath, imageList);
    } else if (/\.(png|jpg|jpeg|webp)$/i.test(file)) {
      imageList.push({
        path: filePath,
        relativePath: path.relative(PUBLIC_DIR, filePath),
        size: stat.size
      });
    }
  }
  
  return imageList;
}

async function processImage(image, stats) {
  const startTime = Date.now();
  
  try {
    // Skip small files
    if (image.size < MIN_FILE_SIZE) {
      return { 
        skipped: true, 
        reason: 'too small',
        originalSize: image.size 
      };
    }
    
    // Read original file
    const originalBuffer = fs.readFileSync(image.path);
    const originalSize = originalBuffer.length;
    
    // Compress with TinyPNG
    const result = await compressWithTinify(originalBuffer);
    const compressedSize = result.buffer.length;
    
    // Calculate savings
    const savings = originalSize - compressedSize;
    const savingsPercent = ((savings / originalSize) * 100).toFixed(1);
    
    // Skip if no meaningful savings
    if (parseFloat(savingsPercent) < MIN_SAVINGS_PERCENT) {
      stats.skippedNoSavings++;
      return { 
        skipped: true, 
        reason: 'minimal savings',
        originalSize,
        compressedSize,
        savingsPercent
      };
    }
    
    if (!DRY_RUN) {
      // Overwrite original file with compressed version
      fs.writeFileSync(image.path, result.buffer);
    }
    
    // Update stats
    stats.totalOriginalSize += originalSize;
    stats.totalCompressedSize += compressedSize;
    stats.totalSavings += savings;
    stats.successCount++;
    
    return {
      success: true,
      originalSize,
      compressedSize,
      savings,
      savingsPercent,
      duration: Date.now() - startTime
    };
    
  } catch (error) {
    stats.errorCount++;
    stats.errors.push({ path: image.relativePath, error: error.message });
    
    if (error.message.includes('RATE_LIMIT')) {
      console.log('\n⏳ Rate limited - waiting 60 seconds...');
      await new Promise(r => setTimeout(r, 60000));
      return processImage(image, stats); // Retry
    }
    
    return { error: error.message };
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

// =============================================================================
// Main Execution
// =============================================================================

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║          PUBLIC FOLDER IMAGE COMPRESSION                     ║');
  console.log('║                  Powered by TinyPNG                          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  // Check for API key
  if (!TINIFY_API_KEY) {
    console.error('❌ ERROR: TINIFY_API_KEY not found in environment');
    console.error('   Add TINIFY_API_KEY to your .env.local file');
    console.error('   Get a free key at: https://tinypng.com/developers');
    process.exit(1);
  }
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }
  
  // Find all images
  const searchDir = FOLDER_FILTER 
    ? path.join(PUBLIC_DIR, FOLDER_FILTER)
    : PUBLIC_DIR;
    
  if (!fs.existsSync(searchDir)) {
    console.error(`❌ Directory not found: ${searchDir}`);
    process.exit(1);
  }
  
  console.log(`📂 Scanning: ${searchDir}`);
  const images = findImages(searchDir);
  
  // Sort by size (largest first for maximum impact)
  images.sort((a, b) => b.size - a.size);
  
  const totalToProcess = images.length;
  const totalSize = images.reduce((sum, img) => sum + img.size, 0);
  
  console.log(`📊 Found ${totalToProcess} images (${formatBytes(totalSize)} total)\n`);
  
  if (totalToProcess === 0) {
    console.log('✅ No images to process!');
    return;
  }
  
  // Show preview of largest files
  console.log('📋 Largest files:');
  images.slice(0, 10).forEach((img, i) => {
    console.log(`   ${i + 1}. ${img.relativePath} (${formatBytes(img.size)})`);
  });
  if (images.length > 10) {
    console.log(`   ... and ${images.length - 10} more`);
  }
  console.log('');
  
  // Initialize stats
  const stats = {
    totalOriginalSize: 0,
    totalCompressedSize: 0,
    totalSavings: 0,
    successCount: 0,
    errorCount: 0,
    skippedNoSavings: 0,
    skippedSmall: 0,
    errors: []
  };
  
  // Process images in batches
  const startTime = Date.now();
  let completedCount = 0;
  
  for (let i = 0; i < images.length; i += CONCURRENT_LIMIT) {
    const batch = images.slice(i, i + CONCURRENT_LIMIT);
    
    const results = await Promise.all(
      batch.map(img => processImage(img, stats))
    );
    
    // Log progress for each image in batch
    for (let j = 0; j < batch.length; j++) {
      completedCount++;
      const image = batch[j];
      const result = results[j];
      const progress = `[${completedCount}/${totalToProcess}]`;
      
      if (result.skipped) {
        if (result.reason === 'too small') {
          stats.skippedSmall++;
          console.log(`${progress} ⏭️  ${image.relativePath} (${formatBytes(image.size)} - too small)`);
        } else {
          console.log(`${progress} ⏭️  ${image.relativePath} (${result.savingsPercent}% savings - skipped)`);
        }
      } else if (result.error) {
        console.log(`${progress} ❌ ${image.relativePath} - ${result.error}`);
      } else {
        console.log(`${progress} ✅ ${image.relativePath}: ${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)} (-${result.savingsPercent}%)`);
      }
    }
    
    // Small delay between batches to be nice to the API
    if (i + CONCURRENT_LIMIT < images.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }
  
  // Final summary
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    COMPRESSION COMPLETE                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`⏱️  Duration:        ${duration} minutes`);
  console.log(`✅ Compressed:      ${stats.successCount} images`);
  console.log(`⏭️  Skipped (small): ${stats.skippedSmall}`);
  console.log(`⏭️  Skipped (min %): ${stats.skippedNoSavings}`);
  console.log(`❌ Errors:          ${stats.errorCount}`);
  console.log('');
  console.log(`📦 Original size:   ${formatBytes(stats.totalOriginalSize)}`);
  console.log(`📦 Compressed:      ${formatBytes(stats.totalCompressedSize)}`);
  console.log(`💾 Total saved:     ${formatBytes(stats.totalSavings)}`);
  
  if (stats.totalOriginalSize > 0) {
    const avgSavings = ((stats.totalSavings / stats.totalOriginalSize) * 100).toFixed(1);
    console.log(`📉 Avg reduction:   ${avgSavings}%`);
  }
  
  if (DRY_RUN) {
    console.log('\n🔍 This was a DRY RUN - no files were modified');
    console.log('   Run without --dry-run to apply changes');
  }
  
  if (stats.errors.length > 0) {
    console.log('\n⚠️  Errors encountered:');
    for (const err of stats.errors.slice(0, 10)) {
      console.log(`   - ${err.path}: ${err.error}`);
    }
    if (stats.errors.length > 10) {
      console.log(`   ... and ${stats.errors.length - 10} more`);
    }
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
