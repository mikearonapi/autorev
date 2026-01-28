#!/usr/bin/env node
/**
 * Fix Logo Aspect Ratio
 * 
 * Creates a 1:1 aspect ratio version of the AutoRev logo with proper padding
 * for circular and square presentations. The logo will have safe zone padding
 * to ensure nothing gets cut off when displayed in circular contexts.
 * 
 * Usage: node scripts/fix-logo-aspect-ratio.mjs
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, copyFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ASSETS_DIR = '/Users/mikearon/.cursor/projects/Volumes-10TB-External-HD-01-Apps-WORKING-AutoRev/assets';

// Source logo (the one currently used for PWA icons)
const SOURCE_LOGO = join(ASSETS_DIR, 'autorev-logo-transparent-b0baab83-7d04-4de8-9387-8b44bbc1cb65.png');

// Output files
const OUTPUT_1X1 = join(ASSETS_DIR, 'autorev-logo-1x1-transparent.png');
const OUTPUT_PUBLIC = join(ROOT, 'public/images/autorev-logo-1x1.png');

// For circular safe zone, we want approximately 12% padding on each side
// This ensures the logo is fully visible even when clipped to a circle
const PADDING_PERCENT = 0.12;

async function main() {
  console.log('🔧 Fixing logo aspect ratio for circular/square presentation...\n');
  
  // Verify source exists
  if (!existsSync(SOURCE_LOGO)) {
    console.error('❌ Source logo not found:', SOURCE_LOGO);
    process.exit(1);
  }
  
  // Get source metadata
  const sourceMetadata = await sharp(SOURCE_LOGO).metadata();
  console.log(`📐 Source logo: ${sourceMetadata.width}x${sourceMetadata.height}`);
  
  // Step 1: Trim the source to get the actual content bounds
  const trimmedBuffer = await sharp(SOURCE_LOGO)
    .trim({ threshold: 10 }) // Remove near-transparent edges
    .toBuffer();
  
  const trimmedMetadata = await sharp(trimmedBuffer).metadata();
  console.log(`📐 Trimmed content: ${trimmedMetadata.width}x${trimmedMetadata.height}`);
  
  // Step 2: Calculate the 1:1 canvas size
  // We want the larger dimension to fit, plus padding for circular safe zone
  const contentSize = Math.max(trimmedMetadata.width, trimmedMetadata.height);
  const totalPadding = Math.round(contentSize * PADDING_PERCENT * 2); // Total padding (both sides)
  const canvasSize = contentSize + totalPadding;
  
  // Round up to a nice even number
  const finalSize = Math.ceil(canvasSize / 16) * 16; // Round to multiple of 16
  
  console.log(`📐 Canvas size: ${finalSize}x${finalSize} (1:1)`);
  console.log(`📐 Padding: ~${Math.round(PADDING_PERCENT * 100)}% each side`);
  
  // Step 3: Calculate how much to scale the content to fit with padding
  const availableSpace = finalSize - totalPadding;
  const scale = availableSpace / contentSize;
  const scaledWidth = Math.round(trimmedMetadata.width * scale);
  const scaledHeight = Math.round(trimmedMetadata.height * scale);
  
  console.log(`📐 Scaled content: ${scaledWidth}x${scaledHeight}`);
  
  // Step 4: Resize the trimmed content
  const resizedContent = await sharp(trimmedBuffer)
    .resize(scaledWidth, scaledHeight, {
      fit: 'inside',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();
  
  // Step 5: Create the 1:1 canvas and composite the content centered
  await sharp({
    create: {
      width: finalSize,
      height: finalSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([
      {
        input: resizedContent,
        gravity: 'center'
      }
    ])
    .png()
    .toFile(OUTPUT_1X1);
  
  console.log(`\n✅ Created: ${OUTPUT_1X1}`);
  
  // Verify the output
  const outputMetadata = await sharp(OUTPUT_1X1).metadata();
  console.log(`   Dimensions: ${outputMetadata.width}x${outputMetadata.height}`);
  
  // Also copy to public folder
  copyFileSync(OUTPUT_1X1, OUTPUT_PUBLIC);
  console.log(`✅ Copied to: ${OUTPUT_PUBLIC}`);
  
  console.log('\n📋 Next steps:');
  console.log('   1. Update generate-pwa-icons.mjs to use the new 1:1 source');
  console.log('   2. Run: node scripts/generate-pwa-icons-v4.mjs');
  console.log('   3. Verify icons look correct in circular and square contexts');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
