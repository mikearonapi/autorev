#!/usr/bin/env node
/**
 * Generate all logo assets from the new source logo
 * Source: public/images/autorev logo no shading v2.png
 */

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Navy background color (matches theme_color in manifest.json)
const NAVY_BG = { r: 13, g: 27, b: 42, alpha: 1 }; // #0d1b2a

// Source logo path
const SOURCE_LOGO = path.join(ROOT, 'public/images/autorev logo no shading v2.png');

// Assets to generate
const ASSETS = [
  // Large versions
  { 
    output: 'public/autorev-logo-transparent.png', 
    width: 1536, 
    height: 1024, 
    background: null 
  },
  { 
    output: 'public/autorev-logo-navy.png', 
    width: 1536, 
    height: 1024, 
    background: NAVY_BG 
  },
  // Also update the one in images folder
  { 
    output: 'public/images/autorev-logo-transparent.png', 
    width: 1536, 
    height: 1024, 
    background: null 
  },
  
  // Favicons and icons (all with navy background for visibility)
  { output: 'public/favicon-16x16.png', width: 16, height: 16, background: NAVY_BG, padding: 1 },
  { output: 'public/favicon-32x32.png', width: 32, height: 32, background: NAVY_BG, padding: 2 },
  { output: 'public/favicon-48x48.png', width: 48, height: 48, background: NAVY_BG, padding: 3 },
  { output: 'public/apple-touch-icon-v2.png', width: 180, height: 180, background: NAVY_BG, padding: 12 },
  { output: 'public/icon-192x192-v2.png', width: 192, height: 192, background: NAVY_BG, padding: 12 },
  { output: 'public/icon-512x512-v2.png', width: 512, height: 512, background: NAVY_BG, padding: 32 },
];

async function generateAsset(config) {
  const { output, width, height, background, padding = 0 } = config;
  const outputPath = path.join(ROOT, output);
  
  console.log(`  Generating ${output} (${width}x${height})...`);
  
  // Calculate the size for the logo (accounting for padding)
  const logoWidth = width - (padding * 2);
  const logoHeight = height - (padding * 2);
  
  // Resize the logo first
  let pipeline = sharp(SOURCE_LOGO)
    .resize(logoWidth, logoHeight, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    });
  
  if (background) {
    // Add background and padding
    pipeline = pipeline.flatten({ background });
    
    if (padding > 0) {
      pipeline = pipeline.extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background
      });
    }
  } else {
    // Keep transparent, but still need to handle padding
    if (padding > 0) {
      pipeline = pipeline.extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      });
    }
  }
  
  await pipeline.png().toFile(outputPath);
  
  // Verify the output
  const metadata = await sharp(outputPath).metadata();
  console.log(`    ✓ Created ${metadata.width}x${metadata.height}`);
}

async function main() {
  console.log('🎨 Generating logo assets from new source...\n');
  console.log(`Source: ${SOURCE_LOGO}\n`);
  
  // Verify source exists
  const sourceMetadata = await sharp(SOURCE_LOGO).metadata();
  console.log(`Source dimensions: ${sourceMetadata.width}x${sourceMetadata.height}\n`);
  
  for (const asset of ASSETS) {
    await generateAsset(asset);
  }
  
  console.log('\n✅ All assets generated successfully!');
  console.log('\nGenerated files:');
  for (const asset of ASSETS) {
    console.log(`  - ${asset.output}`);
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
