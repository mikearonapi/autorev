#!/usr/bin/env node

/**
 * Generate high-resolution transparent logos for print/clothing
 * 
 * Usage: node scripts/generate-print-logos.mjs
 * 
 * Requires: sharp (npm install sharp)
 * 
 * Outputs:
 * - public/logo-print-1024.png (1024x1024 transparent)
 * - public/logo-print-2048.png (2048x2048 transparent) 
 * - public/logo-print-4096.png (4096x4096 transparent - ideal for print)
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

// SVG with transparent background - white AUTO, lime REV
const createTransparentSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <text 
    x="50%" 
    y="52%" 
    text-anchor="middle" 
    dominant-baseline="middle"
    font-family="'Oswald', 'Arial Black', Impact, sans-serif"
    font-weight="700"
    font-size="92px"
    letter-spacing="0"
  >
    <tspan fill="#ffffff">AUTO</tspan><tspan fill="#d4ff00">REV</tspan>
  </text>
</svg>`;

// Dark text version for light backgrounds
const createDarkTextSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <text 
    x="50%" 
    y="52%" 
    text-anchor="middle" 
    dominant-baseline="middle"
    font-family="'Oswald', 'Arial Black', Impact, sans-serif"
    font-weight="700"
    font-size="92px"
    letter-spacing="0"
  >
    <tspan fill="#0d1b2a">AUTO</tspan><tspan fill="#d4ff00">REV</tspan>
  </text>
</svg>`;

const sizes = [1024, 2048, 4096];

async function generateLogos() {
  console.log('Generating high-resolution transparent logos for print...\n');

  for (const size of sizes) {
    // White text version (for dark backgrounds/clothing)
    const whiteSvg = Buffer.from(createTransparentSVG(size));
    await sharp(whiteSvg)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, `logo-print-white-${size}.png`));
    console.log(`✓ Created logo-print-white-${size}.png (white AUTO, lime REV)`);

    // Dark text version (for light backgrounds/clothing)
    const darkSvg = Buffer.from(createDarkTextSVG(size));
    await sharp(darkSvg)
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, `logo-print-dark-${size}.png`));
    console.log(`✓ Created logo-print-dark-${size}.png (navy AUTO, lime REV)`);
  }

  console.log('\n✅ Done! Files saved to public/ folder');
  console.log('\nRecommendations for clothing:');
  console.log('- Use 4096px version for best print quality');
  console.log('- White text version: for dark clothing');
  console.log('- Dark text version: for light clothing');
  console.log('- SVG files (logo-transparent.svg, logo-transparent-dark.svg) are infinitely scalable');
}

generateLogos().catch(console.error);
