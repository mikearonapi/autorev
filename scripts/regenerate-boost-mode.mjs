#!/usr/bin/env node
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(__dirname, '..', 'public', 'merch-designs', 'boost-mode-white-lime.svg');
const pngPath = path.join(__dirname, '..', 'public', 'merch-designs', 'boost-mode-white-lime-print.png');

const svgBuffer = fs.readFileSync(svgPath);

await sharp(svgBuffer)
  .resize({ width: 4096 })
  .png()
  .toFile(pngPath);

console.log('✅ Updated boost-mode-white-lime-print.png');
console.log('   Lime "BOOST" + White "MODE"');
