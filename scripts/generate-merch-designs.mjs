#!/usr/bin/env node

/**
 * Generate print-ready PNG versions of merch designs
 * 
 * Usage: node scripts/generate-merch-designs.mjs
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const merchDir = path.join(__dirname, '..', 'public', 'merch');

async function generatePNGs() {
  console.log('Generating print-ready merch designs...\n');

  const svgFiles = fs.readdirSync(merchDir).filter(f => f.endsWith('.svg'));
  
  for (const svgFile of svgFiles) {
    const svgPath = path.join(merchDir, svgFile);
    const pngFile = svgFile.replace('.svg', '-4096.png');
    const pngPath = path.join(merchDir, pngFile);
    
    // Read SVG and scale up 4x for print quality
    const svgBuffer = fs.readFileSync(svgPath);
    
    await sharp(svgBuffer)
      .resize({ width: 4096 })
      .png()
      .toFile(pngPath);
    
    console.log(`✓ Created ${pngFile}`);
  }

  console.log('\n✅ Done! Print-ready PNGs saved to public/merch/');
}

generatePNGs().catch(console.error);
