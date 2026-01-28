#!/usr/bin/env node
/**
 * Upload All Logo Assets to Vercel Blob
 * 
 * Uploads all AutoRev logo assets (generated from FINAL master) to Vercel Blob.
 * 
 * Usage:
 *   node scripts/upload-logo-assets-to-blob.mjs
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

// All logo assets to upload
const ASSETS_TO_UPLOAD = [
  // Main logos
  {
    name: 'autorev-logo-transparent',
    localPath: 'public/autorev-logo-transparent.png',
    blobPath: 'brand/autorev-logo-transparent.png',
    description: 'Transparent logo 1024x1024 (for dark backgrounds)',
  },
  {
    name: 'autorev-logo-navy',
    localPath: 'public/autorev-logo-navy.png',
    blobPath: 'brand/autorev-logo-navy.png',
    description: 'Navy background logo 1024x1024',
  },
  
  // PWA Icons
  {
    name: 'icon-512x512-v3',
    localPath: 'public/icon-512x512-v3.png',
    blobPath: 'brand/icon-512x512.png',
    description: 'PWA icon 512x512 (navy background)',
  },
  {
    name: 'icon-192x192-v3',
    localPath: 'public/icon-192x192-v3.png',
    blobPath: 'brand/icon-192x192.png',
    description: 'PWA icon 192x192 (navy background)',
  },
  {
    name: 'apple-touch-icon-v3',
    localPath: 'public/apple-touch-icon-v3.png',
    blobPath: 'brand/apple-touch-icon.png',
    description: 'Apple touch icon 180x180 (navy background)',
  },
  
  // Favicons
  {
    name: 'favicon-48x48',
    localPath: 'public/favicon-48x48.png',
    blobPath: 'brand/favicon-48x48.png',
    description: 'Favicon 48x48',
  },
  {
    name: 'favicon-32x32',
    localPath: 'public/favicon-32x32.png',
    blobPath: 'brand/favicon-32x32.png',
    description: 'Favicon 32x32',
  },
  {
    name: 'favicon-16x16',
    localPath: 'public/favicon-16x16.png',
    blobPath: 'brand/favicon-16x16.png',
    description: 'Favicon 16x16',
  },
  
  // Additional sizes
  {
    name: 'autorev-logo-256',
    localPath: 'public/images/autorev-logo-256.png',
    blobPath: 'brand/autorev-logo-256.png',
    description: 'Logo 256x256 (navy background)',
  },
  {
    name: 'autorev-logo-128',
    localPath: 'public/images/autorev-logo-128.png',
    blobPath: 'brand/autorev-logo-128.png',
    description: 'Logo 128x128 (navy background)',
  },
  {
    name: 'autorev-email-logo',
    localPath: 'public/images/autorev-email-logo.png',
    blobPath: 'brand/autorev-email-logo.png',
    description: 'Email logo 120x120 (navy background)',
  },
  
  // Master source (for future regeneration)
  {
    name: 'FINAL-autorev-logo-1x1',
    localPath: 'public/images/FINAL autorev-logo-no-shading-v2-1x1.png',
    blobPath: 'brand/master/autorev-logo-1x1-master.png',
    description: 'Master 1:1 source logo 2147x2147 (transparent)',
  },
];

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

async function uploadToBlob(localPath, blobPath) {
  const { put } = await import('@vercel/blob');
  
  const fullPath = path.join(PROJECT_ROOT, localPath);
  const fileBuffer = fs.readFileSync(fullPath);
  
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
  console.log('║       AUTOREV LOGO ASSETS → VERCEL BLOB UPLOAD               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  if (!BLOB_READ_WRITE_TOKEN) {
    console.error('❌ ERROR: BLOB_READ_WRITE_TOKEN not found in environment');
    console.error('   Add BLOB_READ_WRITE_TOKEN to your .env.local file');
    process.exit(1);
  }
  
  console.log(`📁 Uploading ${ASSETS_TO_UPLOAD.length} logo assets...\n`);
  
  const urls = {};
  let successCount = 0;
  let failCount = 0;
  
  for (const asset of ASSETS_TO_UPLOAD) {
    const fullPath = path.join(PROJECT_ROOT, asset.localPath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ ${asset.name} - File not found: ${asset.localPath}`);
      failCount++;
      continue;
    }
    
    const size = fs.statSync(fullPath).size;
    process.stdout.write(`⬆️  ${asset.name} (${formatBytes(size)})...`);
    
    try {
      const url = await uploadToBlob(asset.localPath, asset.blobPath);
      urls[asset.name] = url;
      successCount++;
      console.log(` ✅`);
      console.log(`   → ${url}`);
    } catch (error) {
      console.log(` ❌ ${error.message}`);
      failCount++;
    }
  }
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                      UPLOAD COMPLETE                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log(`✅ Success: ${successCount}  ❌ Failed: ${failCount}\n`);
  
  // Update brandLogos.js config
  const configContent = `// Auto-generated brand logo URLs (Vercel Blob CDN)
// Generated: ${new Date().toISOString()}
// Source: scripts/upload-logo-assets-to-blob.mjs

export const BRAND_LOGOS = {
${Object.entries(urls).map(([name, url]) => {
  const key = name.replace(/-/g, '_').toUpperCase();
  return `  ${key}: '${url}',`;
}).join('\n')}
};

// Convenience exports
export const LOGO_TRANSPARENT = BRAND_LOGOS.AUTOREV_LOGO_TRANSPARENT;
export const LOGO_NAVY = BRAND_LOGOS.AUTOREV_LOGO_NAVY;
export const ICON_512 = BRAND_LOGOS.ICON_512X512_V3;
export const ICON_192 = BRAND_LOGOS.ICON_192X192_V3;
export const APPLE_TOUCH_ICON = BRAND_LOGOS.APPLE_TOUCH_ICON_V3;
export const EMAIL_LOGO = BRAND_LOGOS.AUTOREV_EMAIL_LOGO;
`;

  const configPath = path.join(PROJECT_ROOT, 'lib/brandLogos.js');
  fs.writeFileSync(configPath, configContent);
  console.log(`📄 Config saved to: lib/brandLogos.js`);
  
  console.log('\n📋 BLOB URLs:\n');
  for (const [name, url] of Object.entries(urls)) {
    console.log(`  ${name}: ${url}`);
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
