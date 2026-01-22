#!/usr/bin/env node
/**
 * Logo Color Adjustment Script
 * 
 * Adjusts the green/lime color in a logo to match AutoRev's exact brand lime (#d4ff00).
 * 
 * Usage:
 *   node scripts/adjust-logo-color.js <input-image> [output-image]
 * 
 * Example:
 *   node scripts/adjust-logo-color.js logo-from-cory.png logo-brand-lime.png
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// AutoRev brand lime color
const BRAND_LIME = { r: 212, g: 255, b: 0 }; // #d4ff00

async function adjustLogoColor(inputPath, outputPath) {
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ File not found: ${inputPath}`);
    process.exit(1);
  }

  console.log(`\n🎨 Logo Color Adjustment`);
  console.log(`${'─'.repeat(50)}`);
  console.log(`Input:  ${inputPath}`);
  console.log(`Output: ${outputPath}`);
  console.log(`Target: #d4ff00 (Brand Lime)`);
  console.log(`${'─'.repeat(50)}\n`);

  try {
    // Read the image
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    console.log(`📐 Image: ${metadata.width}x${metadata.height}, ${metadata.format}`);

    // Get raw pixel data
    const { data, info } = await image
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels = new Uint8Array(data);
    const channels = info.channels;
    
    let replacedCount = 0;

    // Process each pixel
    for (let i = 0; i < pixels.length; i += channels) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      // Detect green-ish pixels (various shades of green/lime)
      // Looking for pixels where green is dominant and it's not white/gray
      const isGreenish = (
        g > 100 &&                    // Green channel is significant
        g > r * 0.8 &&                // Green is stronger than red (allow some yellow)
        g > b * 1.5 &&                // Green is much stronger than blue
        !(r > 200 && g > 200 && b > 200) && // Not white
        !(Math.abs(r - g) < 30 && Math.abs(g - b) < 30) // Not gray
      );

      if (isGreenish) {
        // FORCE EXACT BRAND LIME - NO SHADING
        // This flattens the swoosh to match the UI buttons perfectly
        pixels[i] = BRAND_LIME.r;
        pixels[i + 1] = BRAND_LIME.g;
        pixels[i + 2] = BRAND_LIME.b;
        
        replacedCount++;
      }
    }

    console.log(`🔄 Replaced ${replacedCount.toLocaleString()} green pixels with brand lime`);

    // Write the modified image
    await sharp(pixels, {
      raw: {
        width: info.width,
        height: info.height,
        channels: info.channels
      }
    })
      .png()
      .toFile(outputPath);

    console.log(`\n✅ Saved: ${outputPath}`);
    
    // Also create a WebP version for web use
    const webpPath = outputPath.replace(/\.[^.]+$/, '.webp');
    await sharp(pixels, {
      raw: {
        width: info.width,
        height: info.height,
        channels: info.channels
      }
    })
      .webp({ quality: 95 })
      .toFile(webpPath);
    
    console.log(`✅ Saved: ${webpPath}`);
    
    return { outputPath, webpPath };

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Alternative approach: Use hue/saturation adjustment
async function adjustWithHSL(inputPath, outputPath) {
  console.log(`\n🎨 HSL Color Adjustment (Alternative)`);
  console.log(`${'─'.repeat(50)}`);
  
  try {
    // This approach modulates the hue to shift green toward lime
    // Brand lime #d4ff00 has hue ~72° (yellow-green)
    // Standard green #00ff00 has hue ~120°
    // We need to shift by about -48° (or +312°)
    
    await sharp(inputPath)
      .modulate({
        hue: 50,  // Shift hue toward yellow
        saturation: 1.1,  // Slightly boost saturation
        lightness: 1.05   // Slightly brighter
      })
      .toFile(outputPath.replace('.png', '-hsl.png'));
    
    console.log(`✅ HSL version saved`);
  } catch (error) {
    console.log(`⚠️  HSL adjustment not available: ${error.message}`);
  }
}

// Main
const inputFile = process.argv[2];
const outputFile = process.argv[3] || inputFile.replace(/(\.[^.]+)$/, '-brand-lime$1');

if (!inputFile) {
  console.log(`
🎨 Logo Color Adjustment Script

Converts green/lime colors in a logo to AutoRev's exact brand lime (#d4ff00).

Usage:
  node scripts/adjust-logo-color.js <input-image> [output-image]

Examples:
  node scripts/adjust-logo-color.js logo.png
  node scripts/adjust-logo-color.js logo.png logo-fixed.png
  node scripts/adjust-logo-color.js generated-images/logo/cory-logo.png public/images/autorev-logo.png

The script will:
  1. Detect green/lime colored pixels
  2. Replace them with exact brand lime (#d4ff00)
  3. Save as PNG and WebP

Brand Lime: #d4ff00 (RGB: 212, 255, 0)
`);
  process.exit(0);
}

adjustLogoColor(inputFile, outputFile);
