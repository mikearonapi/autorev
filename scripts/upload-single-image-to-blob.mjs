#!/usr/bin/env node
/**
 * Upload Single Image to Vercel Blob (with WebP conversion)
 * 
 * Usage:
 *   node scripts/upload-single-image-to-blob.mjs <local-path> [blob-folder]
 * 
 * Example:
 *   node scripts/upload-single-image-to-blob.mjs "public/images/new site design - Jan 30/garage-audi-rs5-hero-NEW.png" site-design
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

// WebP conversion settings
const WEBP_OPTIONS = {
  quality: 88,
  effort: 6,
  lossless: false,
};

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

async function convertToWebP(buffer) {
  const webpBuffer = await sharp(buffer).webp(WEBP_OPTIONS).toBuffer();
  return webpBuffer;
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

async function main() {
  const args = process.argv.slice(2);
  
  // Parse --name flag
  const nameIndex = args.indexOf('--name');
  let outputName = null;
  if (nameIndex !== -1) {
    outputName = args[nameIndex + 1];
    args.splice(nameIndex, 2);
  }
  
  if (args.length < 1) {
    console.log('Usage: node scripts/upload-single-image-to-blob.mjs <local-path> [blob-folder] [--name output-name]');
    console.log('Example: node scripts/upload-single-image-to-blob.mjs "public/images/foo.png" site-design --name new-name');
    process.exit(1);
  }
  
  const localPath = args[0];
  const blobFolder = args[1] || 'site-design';
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     SINGLE IMAGE → VERCEL BLOB (WebP)                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  if (!BLOB_TOKEN) {
    console.error('❌ ERROR: BLOB_READ_WRITE_TOKEN not found in .env.local');
    process.exit(1);
  }
  
  // Resolve path
  const fullPath = path.isAbsolute(localPath) 
    ? localPath 
    : path.join(PROJECT_ROOT, localPath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File not found: ${fullPath}`);
    process.exit(1);
  }
  
  const originalName = path.basename(localPath);
  const baseName = outputName || originalName.replace(/\.(png|jpe?g)$/i, '');
  const webpName = baseName.endsWith('.webp') ? baseName : `${baseName}.webp`;
  const blobPathname = `${blobFolder}/${webpName}`;
  
  console.log(`📁 Source:      ${fullPath}`);
  console.log(`📦 Destination: ${blobPathname}`);
  
  // Read file
  const originalBuffer = fs.readFileSync(fullPath);
  const originalSize = originalBuffer.length;
  console.log(`📊 Original:    ${formatBytes(originalSize)}`);
  
  // Convert to WebP
  console.log('\n🔄 Converting to WebP...');
  const webpBuffer = await convertToWebP(originalBuffer);
  const webpSize = webpBuffer.length;
  const savings = ((1 - webpSize / originalSize) * 100).toFixed(1);
  console.log(`📊 WebP size:   ${formatBytes(webpSize)} (-${savings}%)`);
  
  // Upload
  console.log('\n⬆️  Uploading to Vercel Blob...');
  const url = await uploadToBlob(webpBuffer, blobPathname);
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                      UPLOAD COMPLETE                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log(`✅ Blob URL: ${url}`);
  console.log(`\n📋 Size: ${formatBytes(originalSize)} → ${formatBytes(webpSize)} (-${savings}%)`);
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
