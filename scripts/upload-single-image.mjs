#!/usr/bin/env node
/**
 * Upload Single Image to Vercel Blob
 * 
 * Compresses with TinyPNG, converts to WebP, and uploads to Vercel Blob.
 * 
 * Usage:
 *   node scripts/upload-single-image.mjs <local-path> <blob-path>
 * 
 * Example:
 *   node scripts/upload-single-image.mjs "public/images/new site design - Jan 30/AI-AL-CHAT-Response.png" "site-design-v2/al-chat-response.webp"
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

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

const TINIFY_API_KEY = process.env.TINIFY_API_KEY;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

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

async function convertToWebP(buffer) {
  const webpBuffer = await sharp(buffer)
    .webp({ quality: 88, effort: 6 })
    .toBuffer();
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
  const [,, localPath, blobPath] = process.argv;
  
  if (!localPath || !blobPath) {
    console.error('Usage: node scripts/upload-single-image.mjs <local-path> <blob-path>');
    console.error('Example: node scripts/upload-single-image.mjs "public/images/my-image.png" "site-design-v2/my-image.webp"');
    process.exit(1);
  }
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     SINGLE IMAGE UPLOAD → TinyPNG → WebP → Vercel Blob      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  if (!TINIFY_API_KEY) {
    console.error('❌ ERROR: TINIFY_API_KEY not found in .env.local');
    process.exit(1);
  }
  
  if (!BLOB_TOKEN) {
    console.error('❌ ERROR: BLOB_READ_WRITE_TOKEN not found in .env.local');
    process.exit(1);
  }
  
  const fullPath = path.join(PROJECT_ROOT, localPath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File not found: ${fullPath}`);
    process.exit(1);
  }
  
  // Read original file
  const originalBuffer = fs.readFileSync(fullPath);
  const originalSize = originalBuffer.length;
  console.log(`📄 Original: ${localPath}`);
  console.log(`📏 Size: ${formatBytes(originalSize)}`);
  
  // Step 1: Compress with TinyPNG
  console.log('\n🗜️  Compressing with TinyPNG...');
  const compressed = await compressWithTinify(originalBuffer);
  const compressedSize = compressed.buffer.length;
  const tinySavings = ((1 - compressedSize / originalSize) * 100).toFixed(1);
  console.log(`   ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (-${tinySavings}%)`);
  
  // Step 2: Convert to WebP
  console.log('\n🔄 Converting to WebP...');
  const webpBuffer = await convertToWebP(compressed.buffer);
  const webpSize = webpBuffer.length;
  const webpSavings = ((1 - webpSize / compressedSize) * 100).toFixed(1);
  console.log(`   ${formatBytes(compressedSize)} → ${formatBytes(webpSize)} (-${webpSavings}%)`);
  
  // Step 3: Upload to Vercel Blob
  console.log('\n⬆️  Uploading to Vercel Blob...');
  const url = await uploadToBlob(webpBuffer, blobPath);
  console.log(`   ✅ Uploaded: ${url}`);
  
  // Summary
  const totalSavings = ((1 - webpSize / originalSize) * 100).toFixed(1);
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                        COMPLETE                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`📊 Total reduction: ${formatBytes(originalSize)} → ${formatBytes(webpSize)} (-${totalSavings}%)`);
  console.log(`🔗 URL: ${url}`);
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
