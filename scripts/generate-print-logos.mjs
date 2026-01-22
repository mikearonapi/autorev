#!/usr/bin/env node

/**
 * Generate high-resolution transparent logos for print/clothing
 * 
 * Usage: node scripts/generate-print-logos.mjs
 * 
 * Requires: sharp (npm install sharp)
 * 
 * Outputs rectangular logos that follow the text shape (not square):
 * - public/logo-print-white-*.png (white AUTO, lime REV - for dark clothing)
 * - public/logo-print-dark-*.png (navy AUTO, lime REV - for light clothing)
 */

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

// Rectangular aspect ratio - text is wide, not tall
// viewBox optimized to tightly wrap the text
const VIEWBOX_WIDTH = 520;
const VIEWBOX_HEIGHT = 120;

// SVG with transparent background - white AUTO, lime REV (for dark clothing)
const createWhiteTextSVG = (width, height) => `
<svg width="${width}" height="${height}" viewBox="0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <text 
    x="50%" 
    y="55%" 
    text-anchor="middle" 
    dominant-baseline="middle"
    font-family="'Oswald', 'Arial Black', Impact, sans-serif"
    font-weight="700"
    font-size="88px"
    letter-spacing="2"
  >
    <tspan fill="#ffffff">AUTO</tspan><tspan fill="#d4ff00">REV</tspan>
  </text>
</svg>`;

// Dark text version for light backgrounds/clothing
const createDarkTextSVG = (width, height) => `
<svg width="${width}" height="${height}" viewBox="0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <text 
    x="50%" 
    y="55%" 
    text-anchor="middle" 
    dominant-baseline="middle"
    font-family="'Oswald', 'Arial Black', Impact, sans-serif"
    font-weight="700"
    font-size="88px"
    letter-spacing="2"
  >
    <tspan fill="#0d1b2a">AUTO</tspan><tspan fill="#d4ff00">REV</tspan>
  </text>
</svg>`;

// Rectangular sizes (width x height) - maintaining ~4.3:1 aspect ratio
const sizes = [
  { width: 1024, height: 240 },
  { width: 2048, height: 480 },
  { width: 4096, height: 960 },
];

async function generateLogos() {
  console.log('Generating rectangular transparent logos for print/clothing...\n');

  for (const { width, height } of sizes) {
    // White text version (for dark backgrounds/clothing)
    const whiteSvg = Buffer.from(createWhiteTextSVG(width, height));
    await sharp(whiteSvg)
      .resize(width, height)
      .png()
      .toFile(path.join(publicDir, `logo-print-white-${width}x${height}.png`));
    console.log(`✓ Created logo-print-white-${width}x${height}.png (white AUTO, lime REV)`);

    // Dark text version (for light backgrounds/clothing)
    const darkSvg = Buffer.from(createDarkTextSVG(width, height));
    await sharp(darkSvg)
      .resize(width, height)
      .png()
      .toFile(path.join(publicDir, `logo-print-dark-${width}x${height}.png`));
    console.log(`✓ Created logo-print-dark-${width}x${height}.png (navy AUTO, lime REV)`);
  }

  console.log('\n✅ Done! Files saved to public/ folder');
  console.log('\nRecommendations for clothing:');
  console.log('- Use 4096x960 version for best print quality');
  console.log('- White text version: for dark clothing (black hoodies)');
  console.log('- Dark text version: for light clothing (white/gray shirts)');
}

generateLogos().catch(console.error);
