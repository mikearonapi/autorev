#!/usr/bin/env node
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(__dirname, '..', 'public', 'merch-designs', 'more-boost-please-white-lime.svg');
const pngPath = path.join(__dirname, '..', 'public', 'merch-designs', 'more-boost-please-white-lime-print.png');

const svgBuffer = fs.readFileSync(svgPath);

await sharp(svgBuffer)
  .resize({ width: 4096 })
  .png()
  .toFile(pngPath);

console.log('✅ Updated more-boost-please-white-lime-print.png');
console.log('   White "MORE" + Lime "BOOST" + White "PLEASE"');
