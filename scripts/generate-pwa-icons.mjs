#!/usr/bin/env node
/**
 * Generates all PWA and favicon icons from the AutoRev logo
 * Uses the navy background version for proper display on all platforms
 * 
 * Brand navy: #0a1628
 * 
 * The logo is trimmed to remove transparent padding, then sized to fill
 * most of the icon with minimal side padding for readability.
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir } from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '../public');

const BRAND_NAVY = '#0a1628';
const SOURCE_LOGO = '/Users/mikearon/.cursor/projects/Volumes-10TB-External-HD-01-Apps-WORKING-AutoRev/assets/autorev-logo-transparent-b0baab83-7d04-4de8-9387-8b44bbc1cb65.png';

// Icon sizes needed for PWA and favicons
// Minimal padding (5% each side = 10% total) for logo to fill the space
const ICON_SIZES = [
  { name: 'favicon-16x16.png', size: 16, padding: 1 },      // 1px each side
  { name: 'favicon-32x32.png', size: 32, padding: 2 },      // 2px each side
  { name: 'favicon-48x48.png', size: 48, padding: 3 },      // 3px each side
  { name: 'apple-touch-icon.png', size: 180, padding: 9 },  // ~5% each side
  { name: 'icon-192x192.png', size: 192, padding: 10 },     // ~5% each side
  { name: 'icon-512x512.png', size: 512, padding: 26 },     // ~5% each side
];

async function generateIcons() {
  console.log('🎨 Generating PWA icons with navy background...\n');

  // First, trim the source logo to remove transparent padding
  const trimmedLogo = await sharp(SOURCE_LOGO)
    .trim()
    .toBuffer();
  
  const trimmedMetadata = await sharp(trimmedLogo).metadata();
  console.log(`Trimmed logo: ${trimmedMetadata.width}x${trimmedMetadata.height}`);

  for (const icon of ICON_SIZES) {
    const outputPath = join(PUBLIC_DIR, icon.name);
    const padding = icon.padding;
    const availableSpace = icon.size - (padding * 2);

    // Resize trimmed logo to fit within the available space
    const resizedLogo = await sharp(trimmedLogo)
      .resize(availableSpace, availableSpace, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();

    // Create navy background and composite the logo centered
    await sharp({
      create: {
        width: icon.size,
        height: icon.size,
        channels: 4,
        background: BRAND_NAVY
      }
    })
      .composite([
        {
          input: resizedLogo,
          gravity: 'center'
        }
      ])
      .png()
      .toFile(outputPath);

    console.log(`✅ ${icon.name} (${icon.size}x${icon.size}, ${padding}px padding)`);
  }

  // Also create the main logo with navy background for general use
  const mainLogoPath = join(PUBLIC_DIR, 'images/autorev-logo-navy.png');
  const metadata2 = await sharp(SOURCE_LOGO).metadata();
  
  await sharp({
    create: {
      width: metadata2.width,
      height: metadata2.height,
      channels: 4,
      background: BRAND_NAVY
    }
  })
    .composite([
      {
        input: SOURCE_LOGO,
        blend: 'over'
      }
    ])
    .png()
    .toFile(mainLogoPath);

  console.log(`✅ images/autorev-logo-navy.png (${metadata2.width}x${metadata2.height})`);

  console.log('\n🎉 All icons generated successfully!');
  console.log('\nGenerated files:');
  ICON_SIZES.forEach(icon => console.log(`  - public/${icon.name}`));
  console.log('  - public/images/autorev-logo-navy.png');
}

generateIcons().catch(console.error);
