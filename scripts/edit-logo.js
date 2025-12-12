#!/usr/bin/env node
/**
 * AutoRev - Logo Editor Script
 * 
 * Provides tools for editing the logo:
 * - Remove/add background transparency
 * - Adjust colors (hue shift, replace colors)
 * - Resize for different use cases
 * - Generate favicon sizes
 * 
 * Usage:
 *   node scripts/edit-logo.js transparent <input> [output]   - Make background transparent
 *   node scripts/edit-logo.js resize <input> <size> [output] - Resize to square dimensions
 *   node scripts/edit-logo.js favicon <input>                - Generate favicon sizes (16, 32, 48, 192, 512)
 *   node scripts/edit-logo.js recolor <input> <from> <to>    - Replace a color
 *   node scripts/edit-logo.js info <input>                   - Show image info
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default paths
const LOGO_DIR = path.join(process.cwd(), 'generated-images', 'logo');
const PUBLIC_DIR = path.join(process.cwd(), 'public', 'images');
const FAVICON_DIR = path.join(process.cwd(), 'public');

// Favicon sizes for various platforms
const FAVICON_SIZES = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'favicon-48x48.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
];

/**
 * Make background transparent (removes white/near-white pixels)
 */
async function makeTransparent(inputPath, outputPath, threshold = 240) {
  console.log('\n🔍 Making background transparent...');
  console.log(`   Input: ${inputPath}`);
  console.log(`   Threshold: ${threshold} (pixels above this become transparent)`);
  
  const image = sharp(inputPath);
  const { width, height, channels } = await image.metadata();
  
  // Get raw pixel data
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  // Process pixels - make white/near-white pixels transparent
  const pixelCount = info.width * info.height;
  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    
    // If pixel is white/near-white, make it transparent
    if (r >= threshold && g >= threshold && b >= threshold) {
      data[idx + 3] = 0; // Set alpha to 0
    }
  }
  
  // Save the result
  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
    .png()
    .toFile(outputPath);
  
  console.log(`✅ Saved: ${outputPath}`);
  return outputPath;
}

/**
 * Remove a specific background color (for removing colored backgrounds)
 */
async function removeBackground(inputPath, outputPath, targetColor = '#2d4a5e', tolerance = 40) {
  console.log('\n🔍 Removing background color...');
  console.log(`   Input: ${inputPath}`);
  console.log(`   Target color: ${targetColor}`);
  console.log(`   Tolerance: ${tolerance}`);
  
  // Parse hex color
  const parseHex = (hex) => {
    const clean = hex.replace('#', '');
    return {
      r: parseInt(clean.substr(0, 2), 16),
      g: parseInt(clean.substr(2, 2), 16),
      b: parseInt(clean.substr(4, 2), 16)
    };
  };
  
  const target = parseHex(targetColor);
  
  const image = sharp(inputPath);
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const pixelCount = info.width * info.height;
  let removedCount = 0;
  
  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    
    // Check if pixel is close to the target background color
    const diff = Math.abs(r - target.r) + Math.abs(g - target.g) + Math.abs(b - target.b);
    if (diff <= tolerance * 3) {
      data[idx + 3] = 0; // Make transparent
      removedCount++;
    }
  }
  
  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
    .png()
    .toFile(outputPath);
  
  console.log(`   Removed ${removedCount} background pixels`);
  console.log(`✅ Saved: ${outputPath}`);
  return outputPath;
}

/**
 * Resize image to specified dimensions
 */
async function resize(inputPath, size, outputPath) {
  console.log('\n📐 Resizing image...');
  console.log(`   Input: ${inputPath}`);
  console.log(`   Size: ${size}x${size}`);
  
  await sharp(inputPath)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(outputPath);
  
  console.log(`✅ Saved: ${outputPath}`);
  return outputPath;
}

/**
 * Generate all favicon sizes
 */
async function generateFavicons(inputPath) {
  console.log('\n🎨 Generating favicon sizes...');
  console.log(`   Input: ${inputPath}`);
  
  // First make sure we have a transparent version
  const tempTransparent = path.join(LOGO_DIR, 'temp-transparent.png');
  await makeTransparent(inputPath, tempTransparent);
  
  const results = [];
  
  for (const { size, name } of FAVICON_SIZES) {
    const outputPath = path.join(FAVICON_DIR, name);
    await sharp(tempTransparent)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    
    console.log(`   ✓ ${name} (${size}x${size})`);
    results.push(outputPath);
  }
  
  // Clean up temp file
  fs.unlinkSync(tempTransparent);
  
  console.log('\n✅ All favicons generated in /public/');
  return results;
}

/**
 * Replace a specific color in the image
 */
async function recolor(inputPath, fromColor, toColor, outputPath, tolerance = 30) {
  console.log('\n🎨 Recoloring image...');
  console.log(`   From: ${fromColor}`);
  console.log(`   To: ${toColor}`);
  
  // Parse hex colors
  const parseHex = (hex) => {
    const clean = hex.replace('#', '');
    return {
      r: parseInt(clean.substr(0, 2), 16),
      g: parseInt(clean.substr(2, 2), 16),
      b: parseInt(clean.substr(4, 2), 16)
    };
  };
  
  const from = parseHex(fromColor);
  const to = parseHex(toColor);
  
  const image = sharp(inputPath);
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const pixelCount = info.width * info.height;
  let replacedCount = 0;
  
  for (let i = 0; i < pixelCount; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    
    // Check if pixel is close to the "from" color
    const diff = Math.abs(r - from.r) + Math.abs(g - from.g) + Math.abs(b - from.b);
    if (diff <= tolerance * 3) {
      data[idx] = to.r;
      data[idx + 1] = to.g;
      data[idx + 2] = to.b;
      replacedCount++;
    }
  }
  
  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
    .png()
    .toFile(outputPath);
  
  console.log(`   Replaced ${replacedCount} pixels`);
  console.log(`✅ Saved: ${outputPath}`);
  return outputPath;
}

/**
 * Show image information
 */
async function showInfo(inputPath) {
  console.log('\n📊 Image Information');
  console.log('═'.repeat(50));
  
  const metadata = await sharp(inputPath).metadata();
  
  console.log(`   File: ${path.basename(inputPath)}`);
  console.log(`   Format: ${metadata.format}`);
  console.log(`   Width: ${metadata.width}px`);
  console.log(`   Height: ${metadata.height}px`);
  console.log(`   Channels: ${metadata.channels}`);
  console.log(`   Has Alpha: ${metadata.hasAlpha ? 'Yes' : 'No'}`);
  console.log(`   Color Space: ${metadata.space}`);
  
  const stats = fs.statSync(inputPath);
  console.log(`   File Size: ${(stats.size / 1024).toFixed(2)} KB`);
}

/**
 * Main CLI handler
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log(`
🎨 AutoRev Logo Editor
═══════════════════════════════════════════════════

Usage:
  node scripts/edit-logo.js <command> [options]

Commands:
  transparent <input> [output]     Make background transparent
                                   Default threshold: 240 (white)
  
  resize <input> <size> [output]   Resize to square dimensions
                                   Example: resize logo.png 64
  
  favicon <input>                  Generate all favicon sizes
                                   (16, 32, 48, 180, 192, 512)
  
  recolor <input> <from> <to>      Replace a color
                                   Example: recolor logo.png #e94560 #00ff00
  
  info <input>                     Show image information

Examples:
  # Make logo background transparent
  node scripts/edit-logo.js transparent public/images/autorev-logo.png
  
  # Generate favicons from logo
  node scripts/edit-logo.js favicon public/images/autorev-logo.png
  
  # Change red accent to blue
  node scripts/edit-logo.js recolor public/images/autorev-logo.png #c94a4a #4a8ac9
  
  # Resize for social media
  node scripts/edit-logo.js resize public/images/autorev-logo.png 400
`);
    return;
  }
  
  try {
    switch (command) {
      case 'transparent': {
        const input = args[1];
        if (!input) {
          console.error('❌ Please provide an input file');
          process.exit(1);
        }
        const inputPath = path.isAbsolute(input) ? input : path.join(process.cwd(), input);
        const output = args[2] || inputPath.replace('.png', '-transparent.png');
        const outputPath = path.isAbsolute(output) ? output : path.join(process.cwd(), output);
        await makeTransparent(inputPath, outputPath);
        break;
      }
      
      case 'remove-bg': {
        const input = args[1];
        const color = args[2] || '#2d4a5e';
        if (!input) {
          console.error('❌ Please provide an input file');
          process.exit(1);
        }
        const inputPath = path.isAbsolute(input) ? input : path.join(process.cwd(), input);
        const output = args[3] || inputPath.replace('.png', '-nobg.png');
        const outputPath = path.isAbsolute(output) ? output : path.join(process.cwd(), output);
        await removeBackground(inputPath, outputPath, color);
        break;
      }
      
      case 'resize': {
        const input = args[1];
        const size = parseInt(args[2], 10);
        if (!input || !size) {
          console.error('❌ Please provide input file and size');
          process.exit(1);
        }
        const inputPath = path.isAbsolute(input) ? input : path.join(process.cwd(), input);
        const output = args[3] || inputPath.replace('.png', `-${size}x${size}.png`);
        const outputPath = path.isAbsolute(output) ? output : path.join(process.cwd(), output);
        await resize(inputPath, size, outputPath);
        break;
      }
      
      case 'favicon': {
        const input = args[1];
        if (!input) {
          console.error('❌ Please provide an input file');
          process.exit(1);
        }
        const inputPath = path.isAbsolute(input) ? input : path.join(process.cwd(), input);
        await generateFavicons(inputPath);
        break;
      }
      
      case 'recolor': {
        const input = args[1];
        const fromColor = args[2];
        const toColor = args[3];
        if (!input || !fromColor || !toColor) {
          console.error('❌ Please provide input file, from color, and to color');
          process.exit(1);
        }
        const inputPath = path.isAbsolute(input) ? input : path.join(process.cwd(), input);
        const output = args[4] || inputPath.replace('.png', '-recolored.png');
        const outputPath = path.isAbsolute(output) ? output : path.join(process.cwd(), output);
        await recolor(inputPath, fromColor, toColor, outputPath);
        break;
      }
      
      case 'info': {
        const input = args[1];
        if (!input) {
          console.error('❌ Please provide an input file');
          process.exit(1);
        }
        const inputPath = path.isAbsolute(input) ? input : path.join(process.cwd(), input);
        await showInfo(inputPath);
        break;
      }
      
      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('   Run without arguments to see usage');
        process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
