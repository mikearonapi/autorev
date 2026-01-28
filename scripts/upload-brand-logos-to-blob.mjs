#!/usr/bin/env node
/**
 * Upload Brand Logos to Vercel Blob
 * 
 * Uploads the optimized AutoRev logos to Vercel Blob for use across the site.
 * 
 * Usage:
 *   node scripts/upload-brand-logos-to-blob.mjs
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

const LOGOS_TO_UPLOAD = [
  {
    name: 'autorev-logo-transparent.png',
    localPath: path.join(PROJECT_ROOT, 'public/autorev-logo-transparent.png'),
    blobPath: 'brand/autorev-logo-transparent.png',
    description: 'Transparent logo (for use on dark backgrounds)',
  },
  {
    name: 'autorev-logo-navy.png',
    localPath: path.join(PROJECT_ROOT, 'public/autorev-logo-navy.png'),
    blobPath: 'brand/autorev-logo-navy.png',
    description: 'Navy background logo (for favicon, PWA, etc.)',
  },
];

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

async function uploadToBlob(localPath, blobPath) {
  const { put } = await import('@vercel/blob');
  
  const fileBuffer = fs.readFileSync(localPath);
  
  const blob = await put(blobPath, fileBuffer, {
    access: 'public',
    contentType: 'image/png',
    token: BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  
  return blob.url;
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║          BRAND LOGOS → VERCEL BLOB UPLOAD                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  if (!BLOB_READ_WRITE_TOKEN) {
    console.error('❌ ERROR: BLOB_READ_WRITE_TOKEN not found in environment');
    process.exit(1);
  }
  
  const urls = {};
  
  for (const logo of LOGOS_TO_UPLOAD) {
    if (!fs.existsSync(logo.localPath)) {
      console.log(`❌ ${logo.name} - File not found!`);
      continue;
    }
    
    const size = fs.statSync(logo.localPath).size;
    process.stdout.write(`⬆️  ${logo.name} (${formatBytes(size)})...`);
    
    try {
      const url = await uploadToBlob(logo.localPath, logo.blobPath);
      urls[logo.name] = url;
      console.log(` ✅`);
      console.log(`   → ${url}`);
      console.log(`   ${logo.description}\n`);
    } catch (error) {
      console.log(` ❌ ${error.message}`);
    }
  }
  
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                      UPLOAD COMPLETE                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log('📋 BLOB URLs FOR CODE INTEGRATION:\n');
  console.log('// Brand logo URLs (Vercel Blob CDN)');
  console.log('export const BRAND_LOGOS = {');
  for (const [name, url] of Object.entries(urls)) {
    const key = name.replace('.png', '').replace(/-/g, '_').toUpperCase();
    console.log(`  ${key}: '${url}',`);
  }
  console.log('};');
  
  // Save to a config file for easy import
  const configContent = `// Auto-generated brand logo URLs (Vercel Blob CDN)
// Generated: ${new Date().toISOString()}

export const BRAND_LOGOS = {
${Object.entries(urls).map(([name, url]) => {
  const key = name.replace('.png', '').replace(/-/g, '_').toUpperCase();
  return `  ${key}: '${url}',`;
}).join('\n')}
};

// Convenience exports
export const LOGO_TRANSPARENT = BRAND_LOGOS.AUTOREV_LOGO_TRANSPARENT;
export const LOGO_NAVY = BRAND_LOGOS.AUTOREV_LOGO_NAVY;
`;
  
  const configPath = path.join(PROJECT_ROOT, 'lib/brandLogos.js');
  fs.writeFileSync(configPath, configContent);
  console.log(`\n📄 Config saved to: lib/brandLogos.js`);
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
