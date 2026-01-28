#!/usr/bin/env node
/**
 * Generate All Logo Assets from FINAL Master Logo
 * 
 * Master source: public/images/FINAL autorev-logo-no-shading-v2-1x1.png
 * 
 * Generates:
 * - Favicons (16, 32, 48) with navy background
 * - PWA icons (180, 192, 512) with navy background
 * - Transparent logo versions
 * - Navy background logo versions
 * - Email logo
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const IMAGES = join(PUBLIC, 'images');

// Master source file (1:1 aspect ratio with proper padding)
const MASTER_LOGO = join(IMAGES, 'FINAL autorev-logo-no-shading-v2-1x1.png');

// Brand navy color
const NAVY_BG = { r: 13, g: 27, b: 42, alpha: 1 }; // #0d1b2a

// All assets to generate
const ASSETS = [
  // Favicons - small icons need navy background for visibility
  { output: 'public/favicon-16x16.png', size: 16, background: NAVY_BG, padding: 1 },
  { output: 'public/favicon-32x32.png', size: 32, background: NAVY_BG, padding: 2 },
  { output: 'public/favicon-48x48.png', size: 48, background: NAVY_BG, padding: 3 },
  
  // PWA Icons - with navy background (used in manifest.json)
  { output: 'public/apple-touch-icon-v3.png', size: 180, background: NAVY_BG, padding: 14 },
  { output: 'public/icon-192x192-v3.png', size: 192, background: NAVY_BG, padding: 15 },
  { output: 'public/icon-512x512-v3.png', size: 512, background: NAVY_BG, padding: 40 },
  
  // General logo - navy background version (1024x1024)
  { output: 'public/autorev-logo-navy.png', size: 1024, background: NAVY_BG, padding: 0 },
  
  // General logo - transparent version (1024x1024)
  { output: 'public/autorev-logo-transparent.png', size: 1024, background: null, padding: 0 },
  
  // Images folder versions
  { output: 'public/images/autorev-logo-navy.png', size: 1024, background: NAVY_BG, padding: 0 },
  { output: 'public/images/autorev-logo-transparent.png', size: 1024, background: null, padding: 0 },
  
  // Email logo - smaller with navy background
  { output: 'public/images/autorev-email-logo.png', size: 120, background: NAVY_BG, padding: 8 },
  
  // Additional sizes that might be needed
  { output: 'public/images/autorev-logo-256.png', size: 256, background: NAVY_BG, padding: 20 },
  { output: 'public/images/autorev-logo-128.png', size: 128, background: NAVY_BG, padding: 10 },
];

async function generateAsset(config) {
  const { output, size, background, padding } = config;
  const outputPath = join(ROOT, output);
  
  // Calculate logo size (canvas size minus padding on each side)
  const logoSize = size - (padding * 2);
  
  // First resize the master logo to fit
  const resizedLogo = await sharp(MASTER_LOGO)
    .resize(logoSize, logoSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();
  
  if (background) {
    // Create canvas with background color, composite logo centered
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: background
      }
    })
      .composite([{
        input: resizedLogo,
        gravity: 'center'
      }])
      .png()
      .toFile(outputPath);
  } else {
    // Transparent - create transparent canvas, composite logo
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{
        input: resizedLogo,
        gravity: 'center'
      }])
      .png()
      .toFile(outputPath);
  }
  
  // Verify output
  const meta = await sharp(outputPath).metadata();
  const bgType = background ? 'navy' : 'transparent';
  console.log(`  ✅ ${output} (${meta.width}x${meta.height}, ${bgType})`);
}

async function main() {
  console.log('🎨 Generating all logo assets from FINAL master...\n');
  
  // Verify master exists
  if (!existsSync(MASTER_LOGO)) {
    console.error('❌ Master logo not found:', MASTER_LOGO);
    process.exit(1);
  }
  
  const masterMeta = await sharp(MASTER_LOGO).metadata();
  console.log(`📐 Master logo: ${masterMeta.width}x${masterMeta.height}\n`);
  
  console.log('Generating assets...\n');
  
  for (const asset of ASSETS) {
    try {
      await generateAsset(asset);
    } catch (err) {
      console.error(`  ❌ Failed: ${asset.output} - ${err.message}`);
    }
  }
  
  console.log('\n✅ All logo assets generated!\n');
  
  console.log('Generated files:');
  for (const asset of ASSETS) {
    console.log(`  - ${asset.output}`);
  }
  
  console.log('\n📋 Next: Upload to Vercel Blob with:');
  console.log('   node scripts/upload-logo-assets-to-blob.mjs');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
