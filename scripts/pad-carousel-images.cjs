/**
 * Pad Carousel Images
 * 
 * Instead of trying to shrink cars (which loses quality), this script
 * ADDS black padding around the original images to make cars appear
 * at the target 55% of frame width while preserving full quality.
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const IMAGES_DIR = path.join(__dirname, '../generated-images/pages');
const OUTPUT_DIR = path.join(__dirname, '../generated-images/padded');

// Target: car should be ~55% of final frame width
const TARGET_CAR_PERCENT = 0.55;

// Final output dimensions (16:9)
const OUTPUT_WIDTH = 1920;
const OUTPUT_HEIGHT = 1080;

const CAROUSEL_IMAGES = [
  'carousel-cayman-gt4.png',
  'carousel-r8-v10.png',
  'carousel-gallardo.png',
  'carousel-emira.png',
  'carousel-viper.png',
  'carousel-c8-corvette.png',
  'carousel-911-991.png',
  'carousel-gtr.png',
  'carousel-gt500.png',
  'carousel-evora-gt.png',
  'carousel-supra-mk4.png',
  'carousel-rx7-fd.png',
  'carousel-bmw-1m.png',
  'carousel-rs5.png',
  'carousel-997.png',
];

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Analyze an image to find the car bounds
 */
async function analyzeCarBounds(imagePath) {
  const image = sharp(imagePath);
  const metadata = await image.metadata();
  
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const { width, height, channels } = info;
  
  let minX = width, maxX = 0, minY = height, maxY = 0;
  const threshold = 25;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      if (brightness > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  return {
    left: minX,
    right: maxX,
    top: minY,
    bottom: maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: minX + (maxX - minX) / 2,
    centerY: minY + (maxY - minY) / 2,
    imageWidth: width,
    imageHeight: height,
    carWidthPercent: (maxX - minX) / width,
  };
}

/**
 * Pad image to make car appear at target percentage of frame
 */
async function padImage(inputPath, outputPath, bounds) {
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  
  // Current car width in pixels
  const currentCarWidth = bounds.width;
  
  // What width should the final frame be so car is TARGET_CAR_PERCENT?
  // carWidth / finalWidth = TARGET_CAR_PERCENT
  // finalWidth = carWidth / TARGET_CAR_PERCENT
  const targetFrameWidth = Math.round(currentCarWidth / TARGET_CAR_PERCENT);
  
  // Maintain 16:9 aspect ratio
  const targetFrameHeight = Math.round(targetFrameWidth * 9 / 16);
  
  // How much padding to add on each side
  const totalHorizPadding = targetFrameWidth - metadata.width;
  const leftPad = Math.round(totalHorizPadding / 2);
  const rightPad = totalHorizPadding - leftPad;
  
  const totalVertPadding = targetFrameHeight - metadata.height;
  // Position car slightly below center (at ~55% from top)
  const topPad = Math.round(totalVertPadding * 0.45);
  const bottomPad = totalVertPadding - topPad;
  
  // Ensure we don't have negative padding
  const safePadding = {
    left: Math.max(0, leftPad),
    right: Math.max(0, rightPad),
    top: Math.max(0, topPad),
    bottom: Math.max(0, bottomPad),
  };
  
  // Add padding and resize to final dimensions
  await image
    .extend({
      top: safePadding.top,
      bottom: safePadding.bottom,
      left: safePadding.left,
      right: safePadding.right,
      background: { r: 0, g: 0, b: 0 },
    })
    .resize(OUTPUT_WIDTH, OUTPUT_HEIGHT, {
      fit: 'cover',
      position: 'center',
    })
    .png()
    .toFile(outputPath);
  
  return {
    originalSize: `${metadata.width}x${metadata.height}`,
    paddedSize: `${targetFrameWidth}x${targetFrameHeight}`,
    finalSize: `${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}`,
    carPercent: (currentCarWidth / targetFrameWidth * 100).toFixed(1),
  };
}

async function main() {
  console.log('🖼️  Padding carousel images for consistent car sizing...\n');
  console.log(`Target: Cars at ${TARGET_CAR_PERCENT * 100}% of frame width\n`);
  
  for (const filename of CAROUSEL_IMAGES) {
    const inputPath = path.join(IMAGES_DIR, filename);
    const outputPath = path.join(OUTPUT_DIR, filename);
    
    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  Skipping ${filename} - not found`);
      continue;
    }
    
    console.log(`Processing: ${filename}`);
    
    const bounds = await analyzeCarBounds(inputPath);
    console.log(`   Original car: ${(bounds.carWidthPercent * 100).toFixed(1)}% of frame`);
    
    const result = await padImage(inputPath, outputPath, bounds);
    console.log(`   Padded: ${result.originalSize} -> ${result.paddedSize} -> ${result.finalSize}`);
    console.log(`   Final car size: ${result.carPercent}% of frame`);
    console.log(`   ✅ Saved\n`);
  }
  
  console.log('✅ All images padded!');
  console.log(`\nOutput: ${OUTPUT_DIR}`);
}

main().catch(console.error);
