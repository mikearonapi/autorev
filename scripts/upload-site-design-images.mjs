#!/usr/bin/env node
/**
 * Upload Site Design Images to Vercel Blob
 * 
 * Uploads all images from public/images/new site design/ to Vercel Blob
 * and outputs a JSON mapping of filenames to Blob URLs.
 * 
 * Usage:
 *   node scripts/upload-site-design-images.mjs              # Upload all
 *   node scripts/upload-site-design-images.mjs --dry-run    # Preview only
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
const SOURCE_DIR = path.join(PROJECT_ROOT, 'public', 'images', 'new site design');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'site-design-blob-urls.json');
const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Upload an image to Vercel Blob
 */
async function uploadToBlob(localPath, filename) {
  if (!BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN not set in environment');
  }
  
  const { put } = await import('@vercel/blob');
  
  const fileBuffer = fs.readFileSync(localPath);
  const ext = path.extname(filename).toLowerCase();
  
  // Determine content type
  const contentTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
  };
  const contentType = contentTypes[ext] || 'image/png';
  
  // Use a clean blob path
  const blobPath = `site-design/${filename}`;
  
  const blob = await put(blobPath, fileBuffer, {
    access: 'public',
    contentType,
    token: BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  
  return blob.url;
}

/**
 * Get all images from source directory
 */
function getSourceImages() {
  const files = fs.readdirSync(SOURCE_DIR);
  return files
    .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
    .map(f => ({
      filename: f,
      localPath: path.join(SOURCE_DIR, f),
      size: fs.statSync(path.join(SOURCE_DIR, f)).size,
    }))
    .sort((a, b) => a.filename.localeCompare(b.filename));
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

/**
 * Main function
 */
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║        SITE DESIGN IMAGES → VERCEL BLOB UPLOAD              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  if (!BLOB_READ_WRITE_TOKEN) {
    console.error('❌ ERROR: BLOB_READ_WRITE_TOKEN not found in environment');
    console.error('   Add BLOB_READ_WRITE_TOKEN to your .env.local file');
    process.exit(1);
  }
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No files will be uploaded\n');
  }
  
  // Get all images
  console.log(`📂 Source: ${SOURCE_DIR}\n`);
  const images = getSourceImages();
  const totalSize = images.reduce((sum, img) => sum + img.size, 0);
  
  console.log(`📊 Found ${images.length} images (${formatBytes(totalSize)} total)\n`);
  
  if (images.length === 0) {
    console.log('❌ No images found!');
    return;
  }
  
  // Upload each image
  const urlMapping = {};
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  console.log('🚀 Uploading to Vercel Blob...\n');
  
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const progress = `[${i + 1}/${images.length}]`;
    
    try {
      if (DRY_RUN) {
        console.log(`${progress} 🔍 ${img.filename} (${formatBytes(img.size)}) → site-design/${img.filename}`);
        urlMapping[img.filename] = `https://[blob-url]/site-design/${img.filename}`;
      } else {
        process.stdout.write(`${progress} ⬆️  ${img.filename}...`);
        const url = await uploadToBlob(img.localPath, img.filename);
        urlMapping[img.filename] = url;
        console.log(` ✅ ${url}`);
        successCount++;
      }
    } catch (error) {
      console.log(` ❌ ${error.message}`);
      errors.push({ filename: img.filename, error: error.message });
      errorCount++;
    }
    
    // Small delay between uploads
    if (!DRY_RUN && i < images.length - 1) {
      await new Promise(r => setTimeout(r, 100));
    }
  }
  
  // Save URL mapping to JSON file
  if (!DRY_RUN && successCount > 0) {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(urlMapping, null, 2));
    console.log(`\n📄 URL mapping saved to: ${OUTPUT_FILE}`);
  }
  
  // Summary
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                      UPLOAD COMPLETE                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN - No files were uploaded');
    console.log(`   Would upload: ${images.length} images`);
  } else {
    console.log(`✅ Uploaded:  ${successCount} images`);
    if (errorCount > 0) {
      console.log(`❌ Failed:    ${errorCount} images`);
    }
  }
  
  if (errors.length > 0) {
    console.log('\n⚠️  Errors:');
    for (const err of errors) {
      console.log(`   - ${err.filename}: ${err.error}`);
    }
  }
  
  // Output the URL mapping for easy copy/paste
  if (!DRY_RUN && successCount > 0) {
    console.log('\n' + '═'.repeat(62));
    console.log('📋 BLOB URL MAPPING (for homepage integration):');
    console.log('═'.repeat(62) + '\n');
    
    // Group by category for easier reading
    const categories = {
      'AL Chat': [],
      'Build': [],
      'Community': [],
      'Garage/Data': [],
      'Other': [],
    };
    
    for (const [filename, url] of Object.entries(urlMapping)) {
      if (filename.startsWith('al-')) {
        categories['AL Chat'].push({ filename, url });
      } else if (filename.includes('build') || filename.includes('upgrade')) {
        categories['Build'].push({ filename, url });
      } else if (filename.includes('community')) {
        categories['Community'].push({ filename, url });
      } else if (filename.includes('garage') || filename.includes('my-') || filename.includes('data')) {
        categories['Garage/Data'].push({ filename, url });
      } else {
        categories['Other'].push({ filename, url });
      }
    }
    
    for (const [category, items] of Object.entries(categories)) {
      if (items.length > 0) {
        console.log(`\n📁 ${category}:`);
        for (const { filename, url } of items) {
          console.log(`   ${filename}`);
          console.log(`   → ${url}\n`);
        }
      }
    }
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
