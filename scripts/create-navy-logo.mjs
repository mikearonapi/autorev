#!/usr/bin/env node
/**
 * Creates a version of the AutoRev logo on navy background
 * Brand navy: #0a1628
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BRAND_NAVY = '#0a1628';
const INPUT_PATH = '/Users/mikearon/.cursor/projects/Volumes-10TB-External-HD-01-Apps-WORKING-AutoRev/assets/autorev-logo-transparent-b0baab83-7d04-4de8-9387-8b44bbc1cb65.png';
const OUTPUT_PATH = join(__dirname, '../public/images/autorev-logo-navy.png');

async function createNavyLogo() {
  try {
    // Get the original image metadata
    const metadata = await sharp(INPUT_PATH).metadata();
    console.log(`Original image: ${metadata.width}x${metadata.height}`);

    // Create navy background and composite the logo on top
    await sharp({
      create: {
        width: metadata.width,
        height: metadata.height,
        channels: 4,
        background: BRAND_NAVY
      }
    })
      .composite([
        {
          input: INPUT_PATH,
          blend: 'over'
        }
      ])
      .png()
      .toFile(OUTPUT_PATH);

    console.log(`✅ Created navy background logo: ${OUTPUT_PATH}`);
  } catch (error) {
    console.error('Error creating logo:', error);
    process.exit(1);
  }
}

createNavyLogo();
