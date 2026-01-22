#!/usr/bin/env node

/**
 * Generate print-ready PNG versions of all color variations
 * 
 * Usage: node scripts/generate-variations.mjs
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const variationsDir = path.join(__dirname, '..', 'public', 'merch-designs', 'variations');

async function generatePNGs() {
  console.log('Generating print-ready design variations (4096px)...\n');

  const svgFiles = fs.readdirSync(variationsDir)
    .filter(f => f.endsWith('.svg'))
    .sort();
  
  let count = 0;
  for (const svgFile of svgFiles) {
    const svgPath = path.join(variationsDir, svgFile);
    const pngFile = svgFile.replace('.svg', '-print.png');
    const pngPath = path.join(variationsDir, pngFile);
    
    // Read SVG and scale to 4096px width for print quality
    const svgBuffer = fs.readFileSync(svgPath);
    
    await sharp(svgBuffer)
      .resize({ width: 4096 })
      .png()
      .toFile(pngPath);
    
    count++;
  }

  console.log(`✅ Generated ${count} print-ready PNG files`);
  console.log('\nAll variations saved to public/merch-designs/variations/');
  console.log('\nColor schemes:');
  console.log('- White: Clean, classic');
  console.log('- Lime: Brand accent (#d4ff00)');
  console.log('- Teal: Brand color (#10b981)');
  console.log('- Mixed: Lime + Teal combinations');
}

generatePNGs().catch(console.error);
