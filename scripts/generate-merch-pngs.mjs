#!/usr/bin/env node

/**
 * Generate print-ready PNG versions (4096px width)
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const merchDir = path.join(__dirname, '..', 'public', 'merch-designs');

async function generatePNGs() {
  console.log('Generating print-ready PNGs (4096px width)...\n');

  const svgFiles = fs.readdirSync(merchDir)
    .filter(f => f.endsWith('.svg'))
    .sort();
  
  for (const svgFile of svgFiles) {
    const svgPath = path.join(merchDir, svgFile);
    const pngFile = svgFile.replace('.svg', '-print.png');
    const pngPath = path.join(merchDir, pngFile);
    
    const svgBuffer = fs.readFileSync(svgPath);
    
    await sharp(svgBuffer)
      .resize({ width: 4096 })
      .png()
      .toFile(pngPath);
  }

  console.log(`✅ Generated ${svgFiles.length} print-ready PNG files`);
  console.log('\nReady for screen printing on black/navy hoodies');
  console.log('Resolution: 4096px width (300+ DPI at print size)');
}

generatePNGs().catch(console.error);
