#!/usr/bin/env node
/**
 * Brand Logo Upload Script
 * 
 * Downloads car brand logos from GitHub, compresses with TinyPNG,
 * and uploads to Vercel Blob storage.
 * 
 * Usage: node scripts/upload-brand-logos.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// =============================================================================
// ENV LOADING
// =============================================================================

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

const TINIFY_API_KEY = process.env.TINIFY_API_KEY;
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

// =============================================================================
// BRAND CONFIGURATION
// =============================================================================

/**
 * Car brands we showcase - matching BrandsStep.jsx
 * Mapped to the filippofilip95/car-logos-dataset repository
 */
const SHOWCASE_BRANDS = [
  // Row 1 - Premium European
  { name: 'Porsche', filename: 'porsche' },
  { name: 'Ferrari', filename: 'ferrari' },
  { name: 'Lamborghini', filename: 'lamborghini' },
  { name: 'McLaren', filename: 'mclaren' },
  { name: 'Aston Martin', filename: 'aston-martin' },
  
  // Row 2 - German Performance
  { name: 'BMW', filename: 'bmw' },
  { name: 'Mercedes', filename: 'mercedes-benz' },
  { name: 'Audi', filename: 'audi' },
  { name: 'Volkswagen', filename: 'volkswagen' },
  { name: 'Alfa Romeo', filename: 'alfa-romeo' },
  
  // Row 3 - American Muscle
  { name: 'Ford', filename: 'ford' },
  { name: 'Chevrolet', filename: 'chevrolet' },
  { name: 'Dodge', filename: 'dodge' },
  { name: 'Cadillac', filename: 'cadillac' },
  { name: 'Tesla', filename: 'tesla' },
  
  // Row 4 - Japanese Performance
  { name: 'Toyota', filename: 'toyota' },
  { name: 'Nissan', filename: 'nissan' },
  { name: 'Honda', filename: 'honda' },
  { name: 'Mazda', filename: 'mazda' },
  { name: 'Subaru', filename: 'subaru' },
  
  // Row 5 - Luxury Japanese + Others
  { name: 'Lexus', filename: 'lexus' },
  { name: 'Acura', filename: 'acura' },
  { name: 'Lotus', filename: 'lotus' },
  { name: 'Maserati', filename: 'maserati' },
  { name: 'Jaguar', filename: 'jaguar' },
];

const GITHUB_LOGO_BASE = 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized';
const TEMP_DIR = path.join(PROJECT_ROOT, 'temp-logos');

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

async function downloadImage(url, outputPath) {
  console.log(`  📥 Downloading from ${url}...`);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
  }
  
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  return buffer;
}

async function compressWithTinify(buffer, _filename) {
  if (!TINIFY_API_KEY) {
    console.warn('  ⚠️  TINIFY_API_KEY not set, skipping compression');
    return buffer;
  }
  
  console.log(`  🗜️  Compressing with TinyPNG...`);
  
  const response = await fetch('https://api.tinify.com/shrink', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`api:${TINIFY_API_KEY}`).toString('base64')}`,
      'Content-Type': 'image/png',
    },
    body: buffer,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.warn(`  ⚠️  TinyPNG error: ${errorText}, using original`);
    return buffer;
  }
  
  const result = await response.json();
  const originalSize = buffer.length;
  const compressedSize = result.output.size;
  const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
  
  console.log(`  📊 ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (-${savings}%)`);
  
  // Download compressed version
  const compressedResponse = await fetch(result.output.url);
  return Buffer.from(await compressedResponse.arrayBuffer());
}

async function uploadToBlob(buffer, blobPath) {
  if (!BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN not set');
  }
  
  console.log(`  ☁️  Uploading to Vercel Blob: ${blobPath}`);
  
  const { put } = await import('@vercel/blob');
  
  const blob = await put(blobPath, buffer, {
    access: 'public',
    contentType: 'image/png',
    token: BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  
  return blob.url;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🚗 Brand Logo Upload Script');
  console.log('='.repeat(70) + '\n');
  
  // Check required env vars
  if (!BLOB_READ_WRITE_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN is required');
    process.exit(1);
  }
  
  if (!TINIFY_API_KEY) {
    console.warn('⚠️  TINIFY_API_KEY not set - logos will not be compressed\n');
  }
  
  // Create temp directory
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
  
  const results = [];
  const errors = [];
  
  for (let i = 0; i < SHOWCASE_BRANDS.length; i++) {
    const brand = SHOWCASE_BRANDS[i];
    console.log(`\n[${i + 1}/${SHOWCASE_BRANDS.length}] ${brand.name}`);
    
    try {
      // Download from GitHub
      const sourceUrl = `${GITHUB_LOGO_BASE}/${brand.filename}.png`;
      const tempPath = path.join(TEMP_DIR, `${brand.filename}.png`);
      const buffer = await downloadImage(sourceUrl, tempPath);
      
      // Compress with TinyPNG
      const compressedBuffer = await compressWithTinify(buffer, brand.filename);
      
      // Upload to Vercel Blob
      const blobPath = `brand-logos/${brand.filename}.png`;
      const blobUrl = await uploadToBlob(compressedBuffer, blobPath);
      
      console.log(`  ✅ ${blobUrl}`);
      
      results.push({
        name: brand.name,
        filename: brand.filename,
        blobUrl,
      });
      
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      errors.push({ name: brand.name, error: error.message });
    }
    
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Cleanup temp directory
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true });
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Success: ${results.length}`);
  console.log(`❌ Failed: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\nFailed brands:');
    errors.forEach(e => console.log(`  - ${e.name}: ${e.error}`));
  }
  
  // Output code snippet for BrandsStep.jsx
  console.log('\n' + '='.repeat(70));
  console.log('📝 Code snippet for BrandsStep.jsx');
  console.log('='.repeat(70) + '\n');
  
  console.log('const SHOWCASE_BRANDS = [');
  
  // Group by rows of 5
  for (let row = 0; row < 5; row++) {
    const rowStart = row * 5;
    const rowEnd = rowStart + 5;
    const rowBrands = results.slice(rowStart, rowEnd);
    
    const comments = [
      '// Row 1 - Premium European',
      '// Row 2 - German Performance',
      '// Row 3 - American Muscle',
      '// Row 4 - Japanese Performance',
      '// Row 5 - Luxury + Others',
    ];
    
    if (rowBrands.length > 0) {
      console.log(`  ${comments[row]}`);
      rowBrands.forEach(brand => {
        console.log(`  { name: '${brand.name}', logo: '${brand.blobUrl}' },`);
      });
      if (row < 4) console.log('');
    }
  }
  
  console.log('];');
  console.log('\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
