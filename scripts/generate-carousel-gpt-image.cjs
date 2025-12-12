/**
 * GPT-Image-1 Carousel Generator
 * 
 * Uses OpenAI's gpt-image-1 model with image editing to create
 * consistent car silhouettes by using a reference image.
 * 
 * This approach ensures:
 * - Same background, lighting, floor reflection
 * - Same car positioning and scale
 * - Only the vehicle changes
 */

require('dotenv').config({ path: '.env.local' });

const OpenAI = require('openai');
const { toFile } = require('openai');
const { put, del, list } = require('@vercel/blob');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Use env variable or fallback (same as generate-carousel-dalle.cjs)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is required');
  process.exit(1);
}
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const OUTPUT_DIR = path.join(__dirname, '../generated-images/gpt-image-carousel');
const REFERENCE_IMAGE = path.join(__dirname, '../generated-images/c7-corvette-z06-dramatic-side.jpg');
const MASK_IMAGE = path.join(__dirname, '../generated-images/carousel-mask.png');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Top 15 Highest Scoring Vehicles from AutoRev Database
 * Each car needs a precise description for the edit prompt
 */
const CAROUSEL_CARS = [
  {
    id: 'c8-corvette-stingray',
    name: 'C8 Corvette Stingray',
    displayName: 'C8 CORVETTE STINGRAY',
    filename: 'gpt-c8-corvette-stingray.png',
    blobPath: 'carousel/c8-corvette-stingray.webp',
    carPrompt: '2024 Chevrolet Corvette C8 Stingray mid-engine supercar with sharp angular bodywork, visible engine bay behind the cabin, distinctive split rear window, aggressive front fascia with large intakes, sleek low profile',
  },
  {
    id: '718-cayman-gt4',
    name: '718 Cayman GT4',
    displayName: '718 CAYMAN GT4',
    filename: 'gpt-718-cayman-gt4.png',
    blobPath: 'carousel/718-cayman-gt4.webp',
    carPrompt: '2020 Porsche 718 Cayman GT4 with large fixed rear wing, compact mid-engine proportions, wide rear fenders, front hood vents, motorsport-inspired design',
  },
  {
    id: 'c7-corvette-grand-sport',
    name: 'C7 Corvette Grand Sport',
    displayName: 'C7 GRAND SPORT',
    filename: 'gpt-c7-grand-sport.png',
    blobPath: 'carousel/c7-corvette-grand-sport.webp',
    carPrompt: '2017 Chevrolet Corvette C7 Grand Sport with wide body fenders, front-engine long hood proportions, aggressive aero package, classic Corvette silhouette, side fender hash marks',
  },
  {
    id: 'camaro-zl1',
    name: 'Camaro ZL1',
    displayName: 'CAMARO ZL1',
    filename: 'gpt-camaro-zl1.png',
    blobPath: 'carousel/camaro-zl1.webp',
    carPrompt: '2020 Chevrolet Camaro ZL1 with aggressive front splitter, muscular fender bulges, large hood extractor, wide stance, American muscle car proportions, modern angular design',
  },
  {
    id: '981-cayman-gts',
    name: '981 Cayman GTS',
    displayName: '981 CAYMAN GTS',
    filename: 'gpt-981-cayman-gts.png',
    blobPath: 'carousel/981-cayman-gts.webp',
    carPrompt: '2015 Porsche 981 Cayman GTS with classic Porsche curves, compact mid-engine proportions, black accents, sport exhaust tips, elegant flowing roofline',
  },
  {
    id: 'c6-corvette-grand-sport',
    name: 'C6 Corvette Grand Sport',
    displayName: 'C6 GRAND SPORT',
    filename: 'gpt-c6-grand-sport.png',
    blobPath: 'carousel/c6-corvette-grand-sport.webp',
    carPrompt: '2012 Chevrolet Corvette C6 Grand Sport with wide body fenders, long hood front-engine layout, classic American sports car proportions, fender hash marks, flowing curves',
  },
  {
    id: 'c5-corvette-z06',
    name: 'C5 Corvette Z06',
    displayName: 'C5 Z06',
    filename: 'gpt-c5-z06.png',
    blobPath: 'carousel/c5-corvette-z06.webp',
    carPrompt: '2004 Chevrolet Corvette C5 Z06 with fixed roof coupe design, long hood, pop-up headlights era styling, wide rear fenders, classic early 2000s American sports car',
  },
  {
    id: 'civic-type-r-fl5',
    name: 'Honda Civic Type R FL5',
    displayName: 'CIVIC TYPE R',
    filename: 'gpt-civic-type-r-fl5.png',
    blobPath: 'carousel/civic-type-r-fl5.webp',
    carPrompt: '2023 Honda Civic Type R FL5 hot hatch with large rear wing, aggressive body kit, triple exhaust tips, functional hood scoop, wide track stance, modern Japanese performance car',
  },
  {
    id: '718-cayman-gts-40',
    name: '718 Cayman GTS 4.0',
    displayName: '718 GTS 4.0',
    filename: 'gpt-718-cayman-gts-40.png',
    blobPath: 'carousel/718-cayman-gts-40.webp',
    carPrompt: '2021 Porsche 718 Cayman GTS 4.0 with sleek mid-engine proportions, black sport exhaust tips, Porsche curves, compact sports car silhouette, elegant design',
  },
  {
    id: 'cts-v-gen3',
    name: 'Cadillac CTS-V Gen 3',
    displayName: 'CTS-V',
    filename: 'gpt-cts-v-gen3.png',
    blobPath: 'carousel/cts-v-gen3.webp',
    carPrompt: '2019 Cadillac CTS-V sedan with aggressive front fascia, wide body, large hood vents, luxury performance sedan proportions, angular Cadillac design language',
  },
  {
    id: 'c6-corvette-z06',
    name: 'C6 Corvette Z06',
    displayName: 'C6 Z06',
    filename: 'gpt-c6-z06.png',
    blobPath: 'carousel/c6-corvette-z06.webp',
    carPrompt: '2008 Chevrolet Corvette C6 Z06 with wide body carbon fiber fenders, long hood, aggressive front splitter, fixed roof coupe, American supercar proportions',
  },
  {
    id: 'mustang-gt-pp2',
    name: 'Mustang GT PP2',
    displayName: 'MUSTANG GT PP2',
    filename: 'gpt-mustang-gt-pp2.png',
    blobPath: 'carousel/mustang-gt-pp2.webp',
    carPrompt: '2019 Ford Mustang GT Performance Pack 2 with long hood, fastback roofline, aggressive front splitter, classic American muscle car proportions, modern angular design',
  },
  {
    id: '981-cayman-s',
    name: '981 Cayman S',
    displayName: '981 CAYMAN S',
    filename: 'gpt-981-cayman-s.png',
    blobPath: 'carousel/981-cayman-s.webp',
    carPrompt: '2014 Porsche 981 Cayman S with elegant mid-engine proportions, flowing roofline, classic Porsche curves, dual exhaust tips, compact sports car silhouette',
  },
  {
    id: 'c7-corvette-z06',
    name: 'C7 Corvette Z06',
    displayName: 'C7 Z06',
    filename: 'gpt-c7-z06.png',
    blobPath: 'carousel/c7-corvette-z06.webp',
    carPrompt: '2019 Chevrolet Corvette C7 Z06 with supercharged wide body, massive rear fenders, large front splitter, hood extractor, aggressive American supercar',
  },
  {
    id: 'camaro-ss-1le',
    name: 'Camaro SS 1LE',
    displayName: 'CAMARO SS 1LE',
    filename: 'gpt-camaro-ss-1le.png',
    blobPath: 'carousel/camaro-ss-1le.webp',
    carPrompt: '2020 Chevrolet Camaro SS 1LE with track-focused aero, front splitter, wide stance, muscular fenders, American muscle car proportions, aggressive modern design',
  },
];

/**
 * Create a mask image that covers the car area
 * The mask should have transparent/white areas where the car is
 * Must match the prepared image size (1536x1024)
 */
async function createCarMask() {
  console.log('\n🎭 Creating car mask...');
  
  // Use the same dimensions as the prepared image (1536x1024)
  const width = 1536;
  const height = 1024;
  
  console.log(`   Mask dimensions: ${width}x${height}`);
  
  // Create a mask with the car area transparent (to be replaced)
  // Based on the reference image, the car is roughly centered
  // We'll create an elliptical mask covering the car area
  
  // Car bounds (approximate from reference image analysis)
  // The car takes up roughly 60% of width, positioned center-left
  const carLeft = Math.floor(width * 0.12);
  const carRight = Math.floor(width * 0.88);
  const carTop = Math.floor(height * 0.25);
  const carBottom = Math.floor(height * 0.82);
  const carWidth = carRight - carLeft;
  const carHeight = carBottom - carTop;
  
  // Create SVG mask (white = area to keep, transparent = area to replace)
  // For OpenAI, transparent areas indicate where to edit
  const maskSvg = `
    <svg width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="white"/>
      <ellipse 
        cx="${carLeft + carWidth/2}" 
        cy="${carTop + carHeight/2}" 
        rx="${carWidth/2 * 1.1}" 
        ry="${carHeight/2 * 1.05}"
        fill="black"
      />
    </svg>
  `;
  
  // Create the mask as PNG with alpha channel
  // Black areas become transparent (to be replaced)
  await sharp(Buffer.from(maskSvg))
    .png()
    .toFile(MASK_IMAGE);
  
  // Now convert black to transparent for OpenAI format
  const maskBuffer = await sharp(MASK_IMAGE)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const { data, info } = maskBuffer;
  const pixels = new Uint8Array(data);
  
  // Convert: black (0,0,0) -> transparent, white (255,255,255) -> opaque
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    
    // If pixel is dark (car area), make it transparent
    if (r < 128 && g < 128 && b < 128) {
      pixels[i] = 0;     // R
      pixels[i + 1] = 0; // G
      pixels[i + 2] = 0; // B
      pixels[i + 3] = 0; // A - transparent
    } else {
      // Keep white areas opaque
      pixels[i + 3] = 255;
    }
  }
  
  await sharp(pixels, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
    .png()
    .toFile(MASK_IMAGE);
  
  console.log(`   ✅ Mask saved to: ${MASK_IMAGE}`);
  return MASK_IMAGE;
}

/**
 * Prepare reference image for API (convert to PNG, ensure proper size)
 */
async function prepareReferenceImage() {
  const preparedPath = path.join(OUTPUT_DIR, 'reference-prepared.png');
  
  // Convert to PNG and resize if needed (max 4MB, must be square for some operations)
  // gpt-image-1 supports 1024x1024, 1024x1536, 1536x1024
  await sharp(REFERENCE_IMAGE)
    .resize(1536, 1024, { fit: 'cover' })
    .png()
    .toFile(preparedPath);
  
  console.log(`   Reference prepared: ${preparedPath}`);
  return preparedPath;
}

/**
 * Generate a car image using gpt-image-1 with image editing
 */
async function generateCarImageWithEdit(car, referenceImagePath, maskPath) {
  console.log(`\n🎨 Generating: ${car.name}`);
  
  const editPrompt = `Replace the car in this image with a ${car.carPrompt}. 
Keep EXACTLY the same:
- Dark studio background
- Subtle rim lighting on the car silhouette  
- Reflective floor with car reflection
- Same camera angle (exact side profile, facing left)
- Same car position and scale in the frame
- Same dramatic moody lighting atmosphere
The car should be dark grey/matte black colored with silver rim light highlights.`;

  console.log(`   Prompt: ${editPrompt.substring(0, 80)}...`);
  
  try {
    // Create proper file objects with mime type
    const imageFile = await toFile(fs.readFileSync(referenceImagePath), 'reference.png', { type: 'image/png' });
    const maskFile = await toFile(fs.readFileSync(maskPath), 'mask.png', { type: 'image/png' });
    
    // Use the images.edit endpoint with gpt-image-1
    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: imageFile,
      mask: maskFile,
      prompt: editPrompt,
      n: 1,
      size: '1536x1024',
    });
    
    // gpt-image-1 returns base64 by default
    const imageData = response.data[0].b64_json || response.data[0].url;
    
    let outputBuffer;
    if (response.data[0].b64_json) {
      outputBuffer = Buffer.from(response.data[0].b64_json, 'base64');
    } else {
      // Download from URL
      const https = require('https');
      outputBuffer = await new Promise((resolve, reject) => {
        https.get(response.data[0].url, (res) => {
          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', reject);
        }).on('error', reject);
      });
    }
    
    // Save the result
    const outputPath = path.join(OUTPUT_DIR, car.filename);
    await sharp(outputBuffer)
      .png()
      .toFile(outputPath);
    
    console.log(`   ✅ Saved to: ${outputPath}`);
    return { success: true, path: outputPath };
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    if (error.response) {
      console.error(`   Response: ${JSON.stringify(error.response.data || error.response)}`);
    }
    return { success: false, error: error.message };
  }
}

/**
 * Alternative: Generate without mask (let the model understand what to replace)
 * This might work better as gpt-image-1 is good at understanding context
 */
async function generateCarImageNoMask(car, referenceImagePath) {
  console.log(`\n🎨 Generating (no mask): ${car.name}`);
  
  const editPrompt = `This is a dramatic automotive studio photograph. Replace the Corvette with a ${car.carPrompt}.

CRITICAL - Keep EXACTLY identical:
- The pure black infinite void background
- The dark polished floor with subtle reflection
- The subtle silver rim lighting effect on the car's silhouette edges
- The exact camera angle: perfect side profile, car facing left
- The car's position: horizontally centered, taking about 60% of frame width
- The moody, dark, dramatic atmosphere

The replacement car should be dark grey/matte black with subtle silver edge highlighting from the rim light. Photorealistic automotive photography.`;

  console.log(`   Prompt length: ${editPrompt.length} chars`);
  
  try {
    // Create proper file object with mime type
    const imageFile = await toFile(fs.readFileSync(referenceImagePath), 'reference.png', { type: 'image/png' });
    
    // Use the images.edit endpoint - gpt-image-1 understands context
    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: imageFile,
      prompt: editPrompt,
      n: 1,
      size: '1536x1024',
    });
    
    let outputBuffer;
    if (response.data[0].b64_json) {
      outputBuffer = Buffer.from(response.data[0].b64_json, 'base64');
    } else {
      const https = require('https');
      outputBuffer = await new Promise((resolve, reject) => {
        https.get(response.data[0].url, (res) => {
          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', reject);
        }).on('error', reject);
      });
    }
    
    const outputPath = path.join(OUTPUT_DIR, car.filename);
    await sharp(outputBuffer)
      .png()
      .toFile(outputPath);
    
    console.log(`   ✅ Saved to: ${outputPath}`);
    return { success: true, path: outputPath };
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Upload image to Vercel Blob
 */
async function uploadToBlob(car) {
  if (!BLOB_READ_WRITE_TOKEN) {
    console.error('   ❌ BLOB_READ_WRITE_TOKEN not set');
    return { success: false };
  }
  
  const inputPath = path.join(OUTPUT_DIR, car.filename);
  
  if (!fs.existsSync(inputPath)) {
    console.error(`   ❌ File not found: ${inputPath}`);
    return { success: false };
  }
  
  console.log(`\n☁️  Uploading: ${car.name} -> ${car.blobPath}`);
  
  try {
    const webpBuffer = await sharp(inputPath)
      .webp({ quality: 85 })
      .toBuffer();
    
    // Delete existing blob if present
    try {
      const existing = await list({ prefix: car.blobPath, token: BLOB_READ_WRITE_TOKEN });
      for (const blob of existing.blobs) {
        if (blob.pathname === car.blobPath) {
          console.log(`   Deleting old blob...`);
          await del(blob.url, { token: BLOB_READ_WRITE_TOKEN });
        }
      }
    } catch (e) {
      // Ignore
    }
    
    const result = await put(car.blobPath, webpBuffer, {
      access: 'public',
      contentType: 'image/webp',
      addRandomSuffix: false,
      token: BLOB_READ_WRITE_TOKEN,
    });
    
    console.log(`   ✅ Uploaded to: ${result.url}`);
    return { success: true, url: result.url };
  } catch (error) {
    console.error(`   ❌ Upload error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main CLI
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const carId = args[1];
  const useNoMask = args.includes('--no-mask');
  
  if (!command) {
    console.log(`
GPT-Image-1 Carousel Generator
===============================

Uses OpenAI's gpt-image-1 with image editing to create consistent
car silhouettes based on a reference image.

Usage:
  node scripts/generate-carousel-gpt-image.cjs generate [car-id] [--no-mask]
  node scripts/generate-carousel-gpt-image.cjs upload [car-id]
  node scripts/generate-carousel-gpt-image.cjs list
  node scripts/generate-carousel-gpt-image.cjs create-mask

Options:
  --no-mask    Generate without using a mask (let model decide what to replace)

Examples:
  node scripts/generate-carousel-gpt-image.cjs generate cayman-gt4
  node scripts/generate-carousel-gpt-image.cjs generate cayman-gt4 --no-mask
  node scripts/generate-carousel-gpt-image.cjs generate all
  node scripts/generate-carousel-gpt-image.cjs upload all

Available cars:
${CAROUSEL_CARS.map(c => `  - ${c.id}: ${c.name}`).join('\n')}
`);
    return;
  }
  
  if (command === 'list') {
    console.log('\nAvailable cars:');
    CAROUSEL_CARS.forEach(c => console.log(`  ${c.id}: ${c.name}`));
    return;
  }
  
  if (command === 'create-mask') {
    if (!fs.existsSync(REFERENCE_IMAGE)) {
      console.error(`❌ Reference image not found: ${REFERENCE_IMAGE}`);
      console.log('   Expected: generated-images/c7-corvette-z06-dramatic-side.jpg');
      return;
    }
    await createCarMask();
    return;
  }
  
  if (command === 'generate') {
    // Check reference image exists
    if (!fs.existsSync(REFERENCE_IMAGE)) {
      console.error(`❌ Reference image not found: ${REFERENCE_IMAGE}`);
      console.log('   Expected: generated-images/c7-corvette-z06-dramatic-side.jpg');
      return;
    }
    
    const carsToGenerate = carId === 'all' 
      ? CAROUSEL_CARS 
      : CAROUSEL_CARS.filter(c => c.id === carId);
    
    if (carsToGenerate.length === 0) {
      console.error(`Car not found: ${carId}`);
      console.log('Use "list" command to see available cars');
      return;
    }
    
    console.log(`\n🚗 Generating ${carsToGenerate.length} car image(s) with gpt-image-1...\n`);
    console.log(`   Reference: ${REFERENCE_IMAGE}`);
    console.log(`   Mode: ${useNoMask ? 'No mask (model decides)' : 'With mask (explicit car area)'}`);
    
    // Prepare reference image
    const preparedRef = await prepareReferenceImage();
    
    // Create mask if needed
    let maskPath = null;
    if (!useNoMask) {
      maskPath = await createCarMask();
    }
    
    for (const car of carsToGenerate) {
      if (useNoMask) {
        await generateCarImageNoMask(car, preparedRef);
      } else {
        await generateCarImageWithEdit(car, preparedRef, maskPath);
      }
      
      // Rate limit delay
      if (carsToGenerate.length > 1) {
        console.log('   Waiting 3 seconds before next generation...');
        await new Promise(r => setTimeout(r, 3000));
      }
    }
    
    console.log('\n✅ Generation complete!');
    console.log(`   Output directory: ${OUTPUT_DIR}`);
    return;
  }
  
  if (command === 'upload') {
    const carsToUpload = carId === 'all'
      ? CAROUSEL_CARS
      : CAROUSEL_CARS.filter(c => c.id === carId);
    
    if (carsToUpload.length === 0) {
      console.error(`Car not found: ${carId}`);
      return;
    }
    
    console.log(`\n☁️  Uploading ${carsToUpload.length} image(s) to Vercel Blob...\n`);
    
    for (const car of carsToUpload) {
      await uploadToBlob(car);
    }
    
    console.log('\n✅ Upload complete!');
    return;
  }
  
  console.error(`Unknown command: ${command}`);
}

main().catch(console.error);
