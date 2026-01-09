#!/usr/bin/env node
/**
 * Compress All Vercel Blob Images with TinyPNG
 * 
 * This script:
 * 1. Lists all images in Vercel Blob
 * 2. Compresses each with TinyPNG API
 * 3. Re-uploads to same path (overwrites original)
 * 4. Tracks progress and total savings
 * 
 * Usage:
 *   node scripts/compress-blob-images.mjs              # Compress all images
 *   node scripts/compress-blob-images.mjs --dry-run    # Preview without changes
 *   node scripts/compress-blob-images.mjs --category cars  # Only compress cars folder
 * 
 * Environment:
 *   BLOB_READ_WRITE_TOKEN - Vercel Blob token (from .env.local)
 *   TINIFY_API_KEY - TinyPNG API key
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { list, put } from '@vercel/blob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
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
const TINIFY_API_KEY = process.env.TINIFY_API_KEY || 'CC0wrwQtwgZwyG2wnZWq1HJ2xxbpv6nm';
const CONCURRENT_LIMIT = 5; // Process 5 images at a time
const PROGRESS_FILE = path.join(__dirname, '..', '.compression-progress.json');

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const CATEGORY_FILTER = args.includes('--category') 
  ? args[args.indexOf('--category') + 1] 
  : null;
const RESUME = args.includes('--resume');

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
          reject(new Error('RATE_LIMIT: Too many requests'));
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
// Image Processing
// =============================================================================

async function fetchImageBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Follow redirect
        https.get(res.headers.location, (res2) => {
          const chunks = [];
          res2.on('data', chunk => chunks.push(chunk));
          res2.on('end', () => resolve(Buffer.concat(chunks)));
          res2.on('error', reject);
        }).on('error', reject);
      } else {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }
    }).on('error', reject);
  });
}

async function processImage(blob, stats) {
  const startTime = Date.now();
  
  try {
    // Skip if already processed (resume mode)
    if (stats.processed.has(blob.pathname)) {
      return { skipped: true, reason: 'already processed' };
    }
    
    // Download original
    const originalBuffer = await fetchImageBuffer(blob.url);
    const originalSize = originalBuffer.length;
    
    // Compress with TinyPNG
    const result = await compressWithTinify(originalBuffer);
    const compressedSize = result.buffer.length;
    
    // Calculate savings
    const savings = originalSize - compressedSize;
    const savingsPercent = ((savings / originalSize) * 100).toFixed(1);
    
    // Skip if no meaningful savings (< 5%)
    if (savingsPercent < 5) {
      stats.skippedNoSavings++;
      return { 
        skipped: true, 
        reason: 'minimal savings',
        originalSize,
        compressedSize 
      };
    }
    
    if (!DRY_RUN) {
      // Determine content type
      let contentType = 'image/webp';
      if (blob.pathname.endsWith('.png')) contentType = 'image/png';
      if (blob.pathname.endsWith('.jpg') || blob.pathname.endsWith('.jpeg')) contentType = 'image/jpeg';
      
      // Re-upload to same path (overwrite existing)
      await put(blob.pathname, result.buffer, {
        access: 'public',
        contentType,
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    }
    
    // Update stats
    stats.totalOriginalSize += originalSize;
    stats.totalCompressedSize += compressedSize;
    stats.totalSavings += savings;
    stats.successCount++;
    stats.processed.add(blob.pathname);
    
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
    stats.errors.push({ pathname: blob.pathname, error: error.message });
    
    if (error.message.includes('RATE_LIMIT')) {
      // Wait and retry on rate limit
      await new Promise(r => setTimeout(r, 60000));
      return processImage(blob, stats); // Retry
    }
    
    return { error: error.message };
  }
}

// =============================================================================
// Progress Tracking
// =============================================================================

function loadProgress() {
  if (RESUME && fs.existsSync(PROGRESS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
      return new Set(data.processed || []);
    } catch (e) {
      return new Set();
    }
  }
  return new Set();
}

function saveProgress(processed) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
    processed: Array.from(processed),
    lastUpdated: new Date().toISOString()
  }, null, 2));
}

// =============================================================================
// Main Execution
// =============================================================================

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║           VERCEL BLOB IMAGE COMPRESSION                      ║');
  console.log('║                  Powered by TinyPNG                          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }
  
  // Initialize stats
  const stats = {
    processed: loadProgress(),
    totalOriginalSize: 0,
    totalCompressedSize: 0,
    totalSavings: 0,
    successCount: 0,
    errorCount: 0,
    skippedNoSavings: 0,
    errors: []
  };
  
  // List all blobs
  console.log('📋 Fetching image list from Vercel Blob...');
  const allBlobs = [];
  let cursor;
  
  do {
    const result = await list({ cursor, limit: 1000 });
    cursor = result.cursor;
    
    for (const blob of result.blobs) {
      // Filter to images only
      if (!blob.pathname.match(/\.(webp|jpg|jpeg|png)$/i)) continue;
      
      // Apply category filter if specified
      if (CATEGORY_FILTER && !blob.pathname.startsWith(CATEGORY_FILTER)) continue;
      
      // Skip already processed (resume mode)
      if (stats.processed.has(blob.pathname)) continue;
      
      allBlobs.push(blob);
    }
  } while (cursor);
  
  const totalToProcess = allBlobs.length;
  const alreadyProcessed = stats.processed.size;
  
  console.log(`\n📊 Found ${totalToProcess} images to process`);
  if (alreadyProcessed > 0) {
    console.log(`   (${alreadyProcessed} already processed in previous run)`);
  }
  if (CATEGORY_FILTER) {
    console.log(`   Filtering to category: ${CATEGORY_FILTER}`);
  }
  console.log('');
  
  if (totalToProcess === 0) {
    console.log('✅ All images already processed!');
    return;
  }
  
  // Process in batches
  const startTime = Date.now();
  let completedCount = 0;
  
  for (let i = 0; i < allBlobs.length; i += CONCURRENT_LIMIT) {
    const batch = allBlobs.slice(i, i + CONCURRENT_LIMIT);
    
    const results = await Promise.all(
      batch.map(blob => processImage(blob, stats))
    );
    
    // Log progress for each image in batch
    for (let j = 0; j < batch.length; j++) {
      completedCount++;
      const blob = batch[j];
      const result = results[j];
      const progress = `[${completedCount}/${totalToProcess}]`;
      
      if (result.skipped) {
        console.log(`${progress} ⏭️  ${blob.pathname} (${result.reason})`);
      } else if (result.error) {
        console.log(`${progress} ❌ ${blob.pathname} - ${result.error}`);
      } else {
        const origKB = (result.originalSize / 1024).toFixed(0);
        const compKB = (result.compressedSize / 1024).toFixed(0);
        console.log(`${progress} ✅ ${blob.pathname}: ${origKB}KB → ${compKB}KB (-${result.savingsPercent}%)`);
      }
    }
    
    // Save progress after each batch
    saveProgress(stats.processed);
    
    // Small delay between batches to be nice to the API
    if (i + CONCURRENT_LIMIT < allBlobs.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  // Final summary
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  const totalOriginalMB = (stats.totalOriginalSize / 1024 / 1024).toFixed(2);
  const totalCompressedMB = (stats.totalCompressedSize / 1024 / 1024).toFixed(2);
  const totalSavingsMB = (stats.totalSavings / 1024 / 1024).toFixed(2);
  const avgSavingsPercent = stats.totalOriginalSize > 0 
    ? ((stats.totalSavings / stats.totalOriginalSize) * 100).toFixed(1)
    : 0;
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    COMPRESSION COMPLETE                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`⏱️  Duration:        ${duration} minutes`);
  console.log(`✅ Successful:      ${stats.successCount} images`);
  console.log(`⏭️  Skipped:         ${stats.skippedNoSavings} (minimal savings)`);
  console.log(`❌ Errors:          ${stats.errorCount}`);
  console.log('');
  console.log(`📦 Original size:   ${totalOriginalMB} MB`);
  console.log(`📦 Compressed:      ${totalCompressedMB} MB`);
  console.log(`💾 Total saved:     ${totalSavingsMB} MB (${avgSavingsPercent}%)`);
  
  if (DRY_RUN) {
    console.log('\n🔍 This was a DRY RUN - no files were modified');
    console.log('   Run without --dry-run to apply changes');
  }
  
  if (stats.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    for (const err of stats.errors.slice(0, 10)) {
      console.log(`   - ${err.pathname}: ${err.error}`);
    }
    if (stats.errors.length > 10) {
      console.log(`   ... and ${stats.errors.length - 10} more`);
    }
  }
  
  // Cleanup progress file on complete success
  if (stats.errorCount === 0 && !DRY_RUN) {
    if (fs.existsSync(PROGRESS_FILE)) {
      fs.unlinkSync(PROGRESS_FILE);
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
