/**
 * Upload normalized carousel images to Vercel Blob
 */

require('dotenv').config({ path: '.env.local' });

const { put, del, list } = require('@vercel/blob');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

if (!BLOB_READ_WRITE_TOKEN) {
  console.error('Error: BLOB_READ_WRITE_TOKEN not found in .env.local');
  process.exit(1);
}

const NORMALIZED_DIR = path.join(__dirname, '../generated-images/padded');

const CAROUSEL_MAPPING = {
  'carousel-cayman-gt4.png': 'carousel/718-cayman-gt4.webp',
  'carousel-r8-v10.png': 'carousel/audi-r8-v10.webp',
  'carousel-gallardo.png': 'carousel/lamborghini-gallardo.webp',
  'carousel-emira.png': 'carousel/lotus-emira.webp',
  'carousel-viper.png': 'carousel/dodge-viper.webp',
  'carousel-c8-corvette.png': 'carousel/c8-corvette.webp',
  'carousel-911-991.png': 'carousel/porsche-911-991.webp',
  'carousel-gtr.png': 'carousel/nissan-gtr.webp',
  'carousel-gt500.png': 'carousel/shelby-gt500.webp',
  'carousel-evora-gt.png': 'carousel/lotus-evora-gt.webp',
  'carousel-supra-mk4.png': 'carousel/toyota-supra-mk4.webp',
  'carousel-rx7-fd.png': 'carousel/mazda-rx7-fd.webp',
  'carousel-bmw-1m.png': 'carousel/bmw-1m.webp',
  'carousel-rs5.png': 'carousel/audi-rs5.webp',
  'carousel-997.png': 'carousel/porsche-997.webp',
};

async function uploadAll() {
  console.log('📤 Uploading normalized carousel images to Vercel Blob...\n');
  
  for (const [filename, blobPath] of Object.entries(CAROUSEL_MAPPING)) {
    const inputPath = path.join(NORMALIZED_DIR, filename);
    
    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  Skipping ${filename} - file not found`);
      continue;
    }
    
    console.log(`Processing: ${filename} -> ${blobPath}`);
    
    // Convert PNG to WebP for better compression
    const webpBuffer = await sharp(inputPath)
      .webp({ quality: 85 })
      .toBuffer();
    
    // Delete existing blob if present
    try {
      const existing = await list({ prefix: blobPath, token: BLOB_READ_WRITE_TOKEN });
      for (const blob of existing.blobs) {
        if (blob.pathname === blobPath) {
          console.log(`   Deleting old blob...`);
          await del(blob.url, { token: BLOB_READ_WRITE_TOKEN });
        }
      }
    } catch (e) {
      // Ignore if not found
    }
    
    // Upload new blob
    const result = await put(blobPath, webpBuffer, {
      access: 'public',
      contentType: 'image/webp',
      addRandomSuffix: false,
      token: BLOB_READ_WRITE_TOKEN,
    });
    
    console.log(`   ✅ Uploaded to: ${result.url}\n`);
  }
  
  console.log('✅ All normalized images uploaded!');
}

uploadAll().catch(console.error);
