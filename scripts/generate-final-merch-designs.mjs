#!/usr/bin/env node

/**
 * Generate print-ready PNG versions of final merch designs
 * 
 * Usage: node scripts/generate-final-merch-designs.mjs
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const merchDir = path.join(__dirname, '..', 'public', 'merch-designs');

async function generatePNGs() {
  console.log('Generating print-ready merch designs (4096px)...\n');

  const svgFiles = fs.readdirSync(merchDir)
    .filter(f => f.endsWith('.svg'))
    .sort();
  
  for (const svgFile of svgFiles) {
    const svgPath = path.join(merchDir, svgFile);
    const pngFile = svgFile.replace('.svg', '-print.png');
    const pngPath = path.join(merchDir, pngFile);
    
    // Read SVG and scale to 4096px width for print quality
    const svgBuffer = fs.readFileSync(svgPath);
    
    await sharp(svgBuffer)
      .resize({ width: 4096 })
      .png()
      .toFile(pngPath);
    
    const name = svgFile.replace('.svg', '').replace(/^\d+-/, '').replace(/-/g, ' ').toUpperCase();
    console.log(`✓ ${name}`);
  }

  console.log('\n✅ Done! All 11 designs saved to public/merch-designs/');
  console.log('\nFiles ready for Apliiq upload:');
  console.log('- SVG files: Editable vector graphics');
  console.log('- PNG files: Print-ready at 4096px width');
}

generatePNGs().catch(console.error);
