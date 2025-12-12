/**
 * Normalize Carousel Images
 * 
 * This script analyzes each carousel image to detect the car's position,
 * then normalizes all images so cars appear in consistent positions.
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const IMAGES_DIR = path.join(__dirname, '../generated-images/pages');
const OUTPUT_DIR = path.join(__dirname, '../generated-images/normalized');

// Target dimensions (16:9 aspect ratio)
const TARGET_WIDTH = 1920;
const TARGET_HEIGHT = 1080;

// Target car positioning (as percentages)
const TARGET_CAR_CENTER_X = 0.50; // Car center at 50% horizontally
const TARGET_CAR_CENTER_Y = 0.52; // Car center slightly below middle
const TARGET_CAR_WIDTH_PERCENT = 0.65; // Car should occupy 65% of frame width

// Carousel image files
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
 * Returns { left, right, top, bottom, centerX, centerY, width, height }
 */
async function analyzeCarBounds(imagePath) {
  const image = sharp(imagePath);
  const metadata = await image.metadata();
  
  // Get raw pixel data
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const { width, height, channels } = info;
  
  let minX = width, maxX = 0, minY = height, maxY = 0;
  const threshold = 25; // Brightness threshold to detect car (rim lighting)
  
  // Scan for non-black pixels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // Check if pixel is bright enough (part of the car)
      const brightness = (r + g + b) / 3;
      if (brightness > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  const carWidth = maxX - minX;
  const carHeight = maxY - minY;
  const centerX = minX + carWidth / 2;
  const centerY = minY + carHeight / 2;
  
  return {
    left: minX,
    right: maxX,
    top: minY,
    bottom: maxY,
    width: carWidth,
    height: carHeight,
    centerX,
    centerY,
    imageWidth: width,
    imageHeight: height,
    // As percentages
    centerXPercent: centerX / width,
    centerYPercent: centerY / height,
    widthPercent: carWidth / width,
  };
}

/**
 * Normalize an image to have consistent car positioning
 */
async function normalizeImage(inputPath, outputPath, bounds) {
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  
  // Calculate how much we need to scale the car
  const currentCarWidthPercent = bounds.widthPercent;
  const scaleFactor = TARGET_CAR_WIDTH_PERCENT / currentCarWidthPercent;
  
  // Calculate new dimensions after scaling
  const scaledWidth = Math.round(metadata.width * scaleFactor);
  const scaledHeight = Math.round(metadata.height * scaleFactor);
  
  // Scale the image
  let processed = image.resize(scaledWidth, scaledHeight, {
    fit: 'fill',
    kernel: 'lanczos3',
  });
  
  // Calculate where the car center will be after scaling
  const scaledCarCenterX = bounds.centerX * scaleFactor;
  const scaledCarCenterY = bounds.centerY * scaleFactor;
  
  // Calculate target car center position in the final image
  const targetCarCenterX = TARGET_WIDTH * TARGET_CAR_CENTER_X;
  const targetCarCenterY = TARGET_HEIGHT * TARGET_CAR_CENTER_Y;
  
  // Calculate extraction region to center the car properly
  const extractLeft = Math.round(scaledCarCenterX - targetCarCenterX);
  const extractTop = Math.round(scaledCarCenterY - targetCarCenterY);
  
  // Ensure we don't go out of bounds
  const safeLeft = Math.max(0, Math.min(extractLeft, scaledWidth - TARGET_WIDTH));
  const safeTop = Math.max(0, Math.min(extractTop, scaledHeight - TARGET_HEIGHT));
  
  // If the scaled image is smaller than target, we need to extend with black
  if (scaledWidth < TARGET_WIDTH || scaledHeight < TARGET_HEIGHT) {
    // Create a black canvas and composite the car onto it
    const offsetX = Math.round(targetCarCenterX - scaledCarCenterX);
    const offsetY = Math.round(targetCarCenterY - scaledCarCenterY);
    
    const safeOffsetX = Math.max(0, Math.min(offsetX, TARGET_WIDTH - scaledWidth));
    const safeOffsetY = Math.max(0, Math.min(offsetY, TARGET_HEIGHT - scaledHeight));
    
    await sharp({
      create: {
        width: TARGET_WIDTH,
        height: TARGET_HEIGHT,
        channels: 3,
        background: { r: 0, g: 0, b: 0 },
      },
    })
      .composite([
        {
          input: await processed.toBuffer(),
          left: safeOffsetX,
          top: safeOffsetY,
        },
      ])
      .png()
      .toFile(outputPath);
  } else {
    // Extract the target region
    await processed
      .extract({
        left: safeLeft,
        top: safeTop,
        width: Math.min(TARGET_WIDTH, scaledWidth - safeLeft),
        height: Math.min(TARGET_HEIGHT, scaledHeight - safeTop),
      })
      .resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: 'cover', position: 'center' })
      .png()
      .toFile(outputPath);
  }
  
  return outputPath;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Analyzing carousel images...\n');
  
  const analyses = [];
  
  // First pass: analyze all images
  for (const filename of CAROUSEL_IMAGES) {
    const inputPath = path.join(IMAGES_DIR, filename);
    
    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  Skipping ${filename} - file not found`);
      continue;
    }
    
    console.log(`Analyzing: ${filename}`);
    const bounds = await analyzeCarBounds(inputPath);
    analyses.push({ filename, bounds, inputPath });
    
    console.log(`   Car bounds: ${bounds.width}x${bounds.height}`);
    console.log(`   Center: ${(bounds.centerXPercent * 100).toFixed(1)}% x ${(bounds.centerYPercent * 100).toFixed(1)}%`);
    console.log(`   Width: ${(bounds.widthPercent * 100).toFixed(1)}% of frame\n`);
  }
  
  // Calculate average car dimensions for reference
  const avgWidthPercent = analyses.reduce((sum, a) => sum + a.bounds.widthPercent, 0) / analyses.length;
  const avgCenterX = analyses.reduce((sum, a) => sum + a.bounds.centerXPercent, 0) / analyses.length;
  const avgCenterY = analyses.reduce((sum, a) => sum + a.bounds.centerYPercent, 0) / analyses.length;
  
  console.log('📊 Average car positioning:');
  console.log(`   Center X: ${(avgCenterX * 100).toFixed(1)}%`);
  console.log(`   Center Y: ${(avgCenterY * 100).toFixed(1)}%`);
  console.log(`   Width: ${(avgWidthPercent * 100).toFixed(1)}%\n`);
  
  console.log('🔧 Normalizing images...\n');
  
  // Second pass: normalize all images
  for (const { filename, bounds, inputPath } of analyses) {
    const outputPath = path.join(OUTPUT_DIR, filename);
    
    console.log(`Normalizing: ${filename}`);
    await normalizeImage(inputPath, outputPath, bounds);
    console.log(`   ✅ Saved to: ${outputPath}\n`);
  }
  
  console.log('✅ All images normalized!\n');
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log('\nNext steps:');
  console.log('1. Review the normalized images');
  console.log('2. If they look good, upload them to Vercel Blob');
}

main().catch(console.error);
