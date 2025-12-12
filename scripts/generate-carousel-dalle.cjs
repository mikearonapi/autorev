/**
 * DALL-E Carousel Image Generator
 * 
 * Uses OpenAI's DALL-E 3 to generate dramatic car silhouette images
 * for the Find Your Car carousel.
 * 
 * Reference style: Dark studio shot, side profile, rim lighting,
 * reflective floor, car at ~55% of frame width
 */

require('dotenv').config({ path: '.env.local' });

const OpenAI = require('openai');
const { put, del, list } = require('@vercel/blob');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const https = require('https');

// API Keys
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is required');
  process.exit(1);
}
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const OUTPUT_DIR = path.join(__dirname, '../generated-images/dalle-carousel');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Base prompt template that describes the exact style we want
 * Based on the reference image (c7-corvette-z06-dramatic-side.jpg)
 */
const BASE_STYLE_PROMPT = `
Minimalist automotive photograph. A single sports car shown in EXACT SIDE PROFILE (90 degrees, facing left) against a PURE BLACK infinite void background.

CRITICAL COMPOSITION: The car should be MEDIUM-SIZED in the frame - approximately 50-60% of the image width. There must be empty black space on the left side of the car and empty black space on the right side. The car is horizontally centered.

LIGHTING: Subtle rim lighting / edge lighting only - thin silver highlights trace the car's silhouette along the top edge of the roof, hood line, and body curves. The lighting is minimal and dramatic, making the car's shape barely visible against the darkness.

FLOOR: Dark grey polished concrete floor with a subtle reflection of the car beneath it. The floor fades to black at the edges.

BACKGROUND: Pure black. No studio equipment visible. No lights visible. Just infinite darkness behind the car.

STYLE: Like a Porsche or BMW official press photo - ultra clean, minimal, the car floating in darkness. Dark and moody. The car is dark grey or matte black colored.

NO visible studio lights, NO visible equipment, NO other objects - just the car alone in darkness.

Photorealistic, high-end automotive photography.
`.trim();

/**
 * Car definitions for the carousel
 */
const CAROUSEL_CARS = [
  {
    id: 'cayman-gt4',
    name: '718 Cayman GT4',
    filename: 'dalle-cayman-gt4.png',
    blobPath: 'carousel/718-cayman-gt4.webp',
    carDescription: 'a 2020 Porsche 718 Cayman GT4 - a compact mid-engine German sports car. Key features: large fixed rear wing, wide hips/fenders, two-door coupe body, sloped hood with air intakes, Porsche styling',
  },
  {
    id: 'r8-v10',
    name: 'R8 V10',
    filename: 'dalle-r8-v10.png',
    blobPath: 'carousel/audi-r8-v10.webp',
    carDescription: 'a 2020 Audi R8 V10 - a German mid-engine supercar. Key features: distinctive side blade accent, wide low body, angular design, LED headlights, visible engine bay behind cabin',
  },
  {
    id: 'gallardo',
    name: 'Gallardo',
    filename: 'dalle-gallardo.png',
    blobPath: 'carousel/lamborghini-gallardo.webp',
    carDescription: 'a 2012 Lamborghini Gallardo LP570-4 - an Italian exotic supercar. Key features: sharp angular wedge shape, very low roofline, scissor-style doors, aggressive Italian styling, wide rear haunches',
  },
  {
    id: 'emira',
    name: 'Lotus Emira',
    filename: 'dalle-emira.png',
    blobPath: 'carousel/lotus-emira.webp',
    carDescription: 'a 2023 Lotus Emira - a British mid-engine sports car. Key features: flowing organic curves, compact dimensions, modern design language, rear diffuser, elegant proportions',
  },
  {
    id: 'viper',
    name: 'Dodge Viper',
    filename: 'dalle-viper.png',
    blobPath: 'carousel/dodge-viper.webp',
    carDescription: 'a 2017 Dodge Viper ACR - an American V10 supercar. Key features: extremely long hood (V10 engine), massive front fenders, huge adjustable rear wing, wide aggressive body, side exhaust',
  },
  {
    id: 'c8-corvette',
    name: 'C8 Corvette',
    filename: 'dalle-c8-corvette.png',
    blobPath: 'carousel/c8-corvette.webp',
    carDescription: 'a 2024 Chevrolet Corvette C8 Stingray - an American mid-engine sports car. Key features: sharp angular design, visible engine behind cabin, distinctive split rear window, aggressive front fascia',
  },
  {
    id: '911-991',
    name: '911 Carrera S',
    filename: 'dalle-911-991.png',
    blobPath: 'carousel/porsche-911-991.webp',
    carDescription: 'a 2015 Porsche 911 Carrera S (991 generation) - a German rear-engine sports car. Key features: iconic 911 silhouette with sloping roofline, round headlights, wide rear haunches, timeless design',
  },
  {
    id: 'gtr',
    name: 'GT-R',
    filename: 'dalle-gtr.png',
    blobPath: 'carousel/nissan-gtr.webp',
    carDescription: 'a 2020 Nissan GT-R R35 - a Japanese twin-turbo AWD supercar. Key features: wide aggressive body, quad circular taillights, muscular fenders, functional hood vents, aggressive front fascia',
  },
  {
    id: 'gt500',
    name: 'Shelby GT500',
    filename: 'dalle-gt500.png',
    blobPath: 'carousel/shelby-gt500.webp',
    carDescription: 'a 2022 Ford Mustang Shelby GT500 - an American muscle car. Key features: long hood with heat extractors, aggressive front splitter, wide body, Mustang fastback silhouette, Shelby striping',
  },
  {
    id: 'evora-gt',
    name: 'Evora GT',
    filename: 'dalle-evora-gt.png',
    blobPath: 'carousel/lotus-evora-gt.webp',
    carDescription: 'a 2021 Lotus Evora GT - a British mid-engine GT car. Key features: elegant flowing curves, elongated proportions, rear wing, side air intakes, lightweight construction',
  },
  {
    id: 'supra-mk4',
    name: 'Supra Mk4',
    filename: 'dalle-supra-mk4.png',
    blobPath: 'carousel/toyota-supra-mk4.webp',
    carDescription: 'a 1998 Toyota Supra Mk4 Turbo (A80) - a legendary Japanese sports car. Key features: distinctive rounded bubble roof, large rear spoiler, flowing organic curves, round taillights, 90s JDM styling',
  },
  {
    id: 'rx7-fd',
    name: 'RX-7 FD',
    filename: 'dalle-rx7-fd.png',
    blobPath: 'carousel/mazda-rx7-fd.webp',
    carDescription: 'a 1995 Mazda RX-7 FD (third generation) - a Japanese rotary sports car. Key features: sensual flowing curves, pop-up headlights, compact proportions, sequential taillights, iconic 90s design',
  },
  {
    id: 'bmw-1m',
    name: 'BMW 1M',
    filename: 'dalle-bmw-1m.png',
    blobPath: 'carousel/bmw-1m.webp',
    carDescription: 'a 2011 BMW 1 Series M Coupe (E82) - a German compact sports car. Key features: wide box fender flares, short wheelbase, aggressive stance, BMW kidney grilles, angular headlights',
  },
  {
    id: 'rs5',
    name: 'Audi RS5',
    filename: 'dalle-rs5.png',
    blobPath: 'carousel/audi-rs5.webp',
    carDescription: 'a 2020 Audi RS5 Coupe - a German luxury sports coupe. Key features: wide Quattro fender flares, large front grille, elegant roofline, muscular haunches, LED headlights',
  },
  {
    id: '997',
    name: '997 Carrera S',
    filename: 'dalle-997.png',
    blobPath: 'carousel/porsche-997.webp',
    carDescription: 'a 2010 Porsche 911 Carrera S (997 generation) - a German rear-engine sports car. Key features: classic 911 silhouette, round headlights, sloping rear, wide rear fenders, timeless proportions',
  },
];

/**
 * Download image from URL to buffer
 */
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Generate a single car image using DALL-E 3
 */
async function generateCarImage(car) {
  const fullPrompt = `${BASE_STYLE_PROMPT}\n\nThe car in this image is: ${car.carDescription}`;
  
  console.log(`\n🎨 Generating: ${car.name}`);
  console.log(`   Prompt length: ${fullPrompt.length} chars`);
  
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: fullPrompt,
      n: 1,
      size: '1792x1024', // Closest to 16:9 that DALL-E 3 supports
      quality: 'hd',
      style: 'vivid',
    });
    
    const imageUrl = response.data[0].url;
    const revisedPrompt = response.data[0].revised_prompt;
    
    console.log(`   ✅ Generated successfully`);
    console.log(`   Revised prompt: ${revisedPrompt.substring(0, 100)}...`);
    
    // Download the image
    const imageBuffer = await downloadImage(imageUrl);
    
    // Save as PNG
    const outputPath = path.join(OUTPUT_DIR, car.filename);
    await sharp(imageBuffer)
      .png()
      .toFile(outputPath);
    
    console.log(`   💾 Saved to: ${outputPath}`);
    
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
    // Convert to WebP
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
    
    // Upload
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
  
  if (!command) {
    console.log(`
DALL-E Carousel Image Generator
================================

Usage:
  node scripts/generate-carousel-dalle.cjs generate [car-id]   Generate image(s)
  node scripts/generate-carousel-dalle.cjs upload [car-id]     Upload to Vercel Blob
  node scripts/generate-carousel-dalle.cjs list                List available cars

Examples:
  node scripts/generate-carousel-dalle.cjs generate cayman-gt4
  node scripts/generate-carousel-dalle.cjs generate all
  node scripts/generate-carousel-dalle.cjs upload all

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
  
  if (command === 'generate') {
    const carsToGenerate = carId === 'all' 
      ? CAROUSEL_CARS 
      : CAROUSEL_CARS.filter(c => c.id === carId);
    
    if (carsToGenerate.length === 0) {
      console.error(`Car not found: ${carId}`);
      console.log('Use "list" command to see available cars');
      return;
    }
    
    console.log(`\n🚗 Generating ${carsToGenerate.length} car image(s) with DALL-E 3...\n`);
    
    for (const car of carsToGenerate) {
      await generateCarImage(car);
      // Add delay between requests to avoid rate limits
      if (carsToGenerate.length > 1) {
        console.log('   Waiting 5 seconds before next generation...');
        await new Promise(r => setTimeout(r, 5000));
      }
    }
    
    console.log('\n✅ Generation complete!');
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
