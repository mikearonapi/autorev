#!/usr/bin/env node
/**
 * Backfill image dimensions for existing library entries
 * 
 * Reads dimensions from local cached files or fetches from blob URLs
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import imageSize from 'image-size';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const LIBRARY_PATH = path.join(PROJECT_ROOT, 'image-library.json');
const IMPORTS_DIR = path.join(PROJECT_ROOT, 'generated-images', 'imports');

function loadLibrary() {
  return JSON.parse(fs.readFileSync(LIBRARY_PATH, 'utf-8'));
}

function saveLibrary(library) {
  library.lastUpdated = new Date().toISOString();
  fs.writeFileSync(LIBRARY_PATH, JSON.stringify(library, null, 2));
}

function calculateAspectRatio(width, height) {
  if (!width || !height) return null;
  const ratio = width / height;
  if (Math.abs(ratio - 16/9) < 0.1) return '16:9';
  if (Math.abs(ratio - 4/3) < 0.1) return '4:3';
  if (Math.abs(ratio - 3/2) < 0.1) return '3:2';
  if (Math.abs(ratio - 1) < 0.1) return '1:1';
  return `${width}:${height}`;
}

async function downloadToBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadToBuffer(response.headers.location).then(resolve).catch(reject);
        return;
      }
      
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  const library = loadLibrary();
  
  // Find images missing dimensions
  const needsDimensions = library.images.filter(img => 
    !img.width || !img.height
  );
  
  console.log(`\n📐 Backfilling dimensions for ${needsDimensions.length} images...\n`);
  
  let updated = 0;
  let failed = 0;
  
  for (const img of needsDimensions) {
    process.stdout.write(`Processing ${img.car_slug}... `);
    
    try {
      // Try to find local cached file first
      const localFiles = fs.readdirSync(IMPORTS_DIR).filter(f => 
        f.startsWith(img.car_slug) && f.includes(img.blob_path?.split('/').pop()?.split('-')[0] || 'exterior')
      );
      
      let dimensions;
      
      if (localFiles.length > 0) {
        // Use local file
        const localPath = path.join(IMPORTS_DIR, localFiles[0]);
        dimensions = imageSize(localPath);
        console.log(`(local) ${dimensions.width}x${dimensions.height}`);
      } else if (img.blob_url) {
        // Fetch from blob
        const buffer = await downloadToBuffer(img.blob_url);
        dimensions = imageSize(buffer);
        console.log(`(remote) ${dimensions.width}x${dimensions.height}`);
      } else {
        console.log('⚠️ No source available');
        failed++;
        continue;
      }
      
      // Update the image record
      img.width = dimensions.width;
      img.height = dimensions.height;
      img.aspect_ratio = calculateAspectRatio(dimensions.width, dimensions.height);
      updated++;
      
    } catch (err) {
      console.log(`❌ ${err.message}`);
      failed++;
    }
  }
  
  // Save updated library
  saveLibrary(library);
  
  console.log(`\n✅ Backfill complete!`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total with dimensions: ${library.images.filter(i => i.width).length}/${library.images.length}`);
}

main().catch(console.error);
