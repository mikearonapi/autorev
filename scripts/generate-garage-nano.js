#!/usr/bin/env node
/**
 * Garage Image Generator - Nano Banana Pro Edition
 * 
 * Generates premium industrial warehouse images for the My Garage page
 * using Google's Nano Banana Pro (Gemini 3 Pro Image Preview).
 * 
 * Usage:
 *   node scripts/generate-garage-nano.js test                    # Test API
 *   node scripts/generate-garage-nano.js single <slug>           # Generate + upload one car
 *   node scripts/generate-garage-nano.js batch <count>           # Generate batch of N cars  
 *   node scripts/generate-garage-nano.js prompt <slug>           # Preview prompt
 *   node scripts/generate-garage-nano.js status                  # Show generation status
 *   node scripts/generate-garage-nano.js list                    # List all cars
 * 
 * Environment:
 *   GOOGLE_AI_API_KEY      - Required for Nano Banana Pro
 *   BLOB_READ_WRITE_TOKEN  - Required for Vercel Blob uploads
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { carData } from '../data/cars.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// =============================================================================
// Environment Setup
// =============================================================================

function loadEnv() {
  const envPath = path.join(PROJECT_ROOT, '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        let value = valueParts.join('=');
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (key && value) process.env[key] = value;
      }
    }
  }
}

loadEnv();

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'generated-images', 'garage');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// =============================================================================
// Car Color Mapping
// =============================================================================

const CAR_COLORS = {
  // Porsche
  '718-cayman-gt4': 'Shark Blue metallic',
  '718-cayman-gts-40': 'Carmine Red',
  '718-cayman-s': 'Racing Yellow',
  '981-cayman-gts': 'GT Silver metallic',
  '981-cayman-s': 'Guards Red',
  '987-2-cayman-s': 'Speed Yellow',
  '911-gt3-996': 'Arctic Silver',
  '911-gt3-997': 'GT Silver metallic',
  '991-1-carrera-s': 'Agate Grey metallic',
  '997-2-carrera-s': 'Basalt Black metallic',
  'porsche-911-turbo-997-1': 'GT Silver metallic',
  'porsche-911-turbo-997-2': 'Basalt Black metallic',
  'porsche-911-gt3-992': 'Shark Blue metallic',
  
  // Corvette
  'c8-corvette-stingray': 'Rapid Blue',
  'c7-corvette-grand-sport': 'Watkins Glen Gray metallic',
  'c7-corvette-z06': 'Torch Red',
  'chevrolet-corvette-c6-z06': 'Velocity Yellow',
  'chevrolet-corvette-c6-grand-sport': 'Cyber Gray metallic',
  'chevrolet-corvette-c5-z06': 'Electron Blue metallic',
  
  // American Muscle
  'camaro-zl1': 'Riverside Blue metallic',
  'camaro-ss-1le': 'Summit White',
  'mustang-gt-pp2': 'Kona Blue',
  'shelby-gt350': 'Avalanche Gray',
  'shelby-gt500': 'Grabber Lime',
  'ford-mustang-boss-302': 'School Bus Yellow',
  'dodge-viper': 'Viper Red',
  'dodge-challenger-srt-392': 'Plum Crazy pearl',
  'dodge-challenger-hellcat': 'TorRed',
  'dodge-charger-srt-392': 'F8 Green',
  'dodge-charger-hellcat': 'Destroyer Grey',
  'cadillac-cts-v-gen2': 'Black Diamond Tricoat',
  'cadillac-cts-v-gen3': 'Crystal White Tricoat',
  
  // BMW M
  'bmw-m2-competition': 'Long Beach Blue metallic',
  'bmw-m3-e46': 'Laguna Seca Blue',
  'bmw-m3-e92': 'Frozen Gray metallic',
  'bmw-m3-f80': 'Austin Yellow metallic',
  'bmw-m4-f82': 'Sakhir Orange',
  'bmw-1m-coupe-e82': 'Valencia Orange metallic',
  'bmw-z4m-e85-e86': 'Interlagos Blue',
  'bmw-m5-e39': 'Imola Red',
  'bmw-m5-e60': 'Indianapolis Red',
  'bmw-m5-f10-competition': 'San Marino Blue',
  'bmw-m5-f90-competition': 'Frozen Dark Silver',
  
  // Audi RS
  'audi-r8-v8': 'Daytona Gray pearl',
  'audi-r8-v10': 'Suzuka Gray metallic',
  'audi-rs3-8v': 'Nardo Gray',
  'audi-rs3-8y': 'Kyalami Green',
  'audi-rs5-b8': 'Sepang Blue pearl',
  'audi-rs5-b9': 'Sonoma Green metallic',
  'audi-tt-rs-8j': 'Imola Yellow',
  'audi-tt-rs-8s': 'Turbo Blue',
  
  // Japanese
  'toyota-supra-mk4-a80-turbo': 'Super White II',
  'toyota-gr-supra': 'Renaissance Red',
  'toyota-gr86': 'Trueno Blue',
  'toyota-86-scion-frs': 'Firestorm orange',
  'nissan-gt-r': 'Katsura Orange',
  'nissan-370z-nismo': 'Solid Red',
  'nissan-350z': 'Silverstone metallic',
  'nissan-z-rz34': 'Seiran Blue',
  'nissan-300zx-twin-turbo-z32': 'Black Pearl',
  'mazda-rx7-fd3s': 'Competition Yellow Mica',
  'mazda-mx5-miata-na': 'Classic Red',
  'mazda-mx5-miata-nb': 'Titanium Gray metallic',
  'mazda-mx5-miata-nc': 'Stormy Blue Mica',
  'mazda-mx5-miata-nd': 'Soul Red Crystal',
  'honda-s2000': 'Berlina Black',
  'honda-civic-type-r-fk8': 'Championship White',
  'honda-civic-type-r-fl5': 'Boost Blue pearl',
  'acura-integra-type-r-dc2': 'Championship White',
  'subaru-wrx-sti-gd': 'World Rally Blue pearl',
  'subaru-wrx-sti-gr-gv': 'WR Blue Mica',
  'subaru-wrx-sti-va': 'WR Blue pearl',
  'subaru-brz-zc6': 'WR Blue pearl',
  'subaru-brz-zd8': 'Sapphire Blue pearl',
  'mitsubishi-lancer-evo-8-9': 'Red metallic',
  'mitsubishi-lancer-evo-x': 'Phantom Black pearl',
  
  // Mercedes-AMG
  'mercedes-c63-amg-w204': 'Obsidian Black metallic',
  'mercedes-amg-c63-w205': 'Selenite Grey metallic',
  'mercedes-amg-e63-w212': 'Palladium Silver',
  'mercedes-amg-e63s-w213': 'Designo Diamond White',
  'mercedes-amg-gt': 'AMG Solarbeam Yellow',
  
  // Lotus
  'lotus-emira': 'Hethel Yellow',
  'lotus-evora-gt': 'Metallic Yellow',
  'lotus-evora-s': 'Chrome Orange',
  'lotus-elise-s2': 'Ardent Red',
  'lotus-exige-s': 'Solar Yellow',
  
  // Italian & Others
  'lamborghini-gallardo': 'Verde Ithaca',
  'alfa-romeo-4c': 'Alfa Red',
  'alfa-romeo-giulia-quadrifoglio': 'Verde Visconti',
  'maserati-granturismo': 'Grigio Granito',
  'jaguar-f-type-r': 'Ultra Blue metallic',
  'jaguar-f-type-v6-s': 'Firesand metallic',
  'aston-martin-v8-vantage': 'Lightning Silver',
  
  // Hot hatches
  'volkswagen-golf-r-mk7': 'Lapiz Blue metallic',
  'volkswagen-golf-r-mk8': 'Pure White',
  'volkswagen-gti-mk7': 'Tornado Red',
  'ford-focus-rs': 'Nitrous Blue',
  
  // Lexus & Tesla
  'lexus-lc-500': 'Structural Blue',
  'lexus-rc-f': 'Ultrasonic Blue Mica 2.0',
  'tesla-model-3-performance': 'Midnight Silver metallic',
};

function getCarColor(slug) {
  return CAR_COLORS[slug] || 'metallic silver';
}

// =============================================================================
// Prompt Generation - Optimized for Nano Banana Pro
// =============================================================================

/**
 * Generate an industrial garage prompt optimized for Gemini's image generation
 */
function generatePrompt(car) {
  const year = car.years.split('-')[0];
  const color = getCarColor(car.slug);

  // Concise, structured prompt that works well with Gemini
  return `SUBJECT: ${year} ${car.name} in ${color}, pristine showroom condition.

SETTING: Private collector's industrial warehouse garage. Choose ONE: brick warehouse with arched windows, modern concrete gallery, vintage factory with timber beams, converted aircraft hangar, or waterfront loading dock space. Unique character, exclusive atmosphere.

COMPOSITION: Front 3/4 hero angle showing front fascia and driver's side profile. Car centered or slightly right, filling 45-50% of frame width. Camera at knee height. Show architectural environment framing the vehicle.

LIGHTING: Golden hour sunlight streaming through large industrial windows. Warm color temperature. Atmospheric light rays. Car's ${color} finish shows rich reflections and dramatic highlights. Deep shadows for cinematic depth.

FLOOR: Polished concrete or epoxy with subtle reflections of car silhouette.

TECHNICAL: Shot on Hasselblad H6D-100c, 80mm lens, f/4. Magazine-quality automotive photography. Razor sharp focus on car. 8K resolution, photorealistic.

REQUIREMENTS: No people, no text, no watermarks, no logos, no license plates. Pure automotive art.`;
}

// =============================================================================
// Nano Banana Pro Image Generation
// =============================================================================

async function generateImage(prompt, outputPath) {
  if (!GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY not set');
  }

  console.log('🍌 Calling Nano Banana Pro API...');
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GOOGLE_AI_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: { aspectRatio: '16:9', imageSize: '2K' }
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText.substring(0, 200)}`);
  }

  const result = await response.json();
  const candidates = result.candidates || [];
  
  if (candidates.length === 0) {
    throw new Error('No candidates in response');
  }

  const parts = candidates[0].content?.parts || [];
  const imagePart = parts.find(p => p.inlineData);
  
  if (!imagePart) {
    const reason = candidates[0].finishReason || 'unknown';
    throw new Error(`No image generated. Reason: ${reason}`);
  }

  const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
  const mimeType = imagePart.inlineData.mimeType || 'image/png';
  const ext = mimeType.includes('jpeg') ? '.jpg' : mimeType.includes('webp') ? '.webp' : '.png';
  
  const finalPath = outputPath.replace(/\.[^.]+$/, ext);
  fs.writeFileSync(finalPath, buffer);
  
  console.log(`   ✅ Generated: ${path.basename(finalPath)} (${(buffer.length / 1024).toFixed(0)} KB)`);
  return finalPath;
}

// =============================================================================
// Vercel Blob Upload
// =============================================================================

async function uploadToBlob(localPath, slug) {
  if (!BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN not set');
  }

  const sharp = (await import('sharp')).default;
  const { put } = await import('@vercel/blob');

  // Convert to WebP for optimal delivery
  const webpBuffer = await sharp(localPath).webp({ quality: 85 }).toBuffer();
  const blobPath = `garage/${slug}/exclusive.webp`;

  console.log(`   ☁️  Uploading to Vercel Blob...`);
  
  const blob = await put(blobPath, webpBuffer, {
    access: 'public',
    contentType: 'image/webp',
    token: BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  console.log(`   ✅ Live at: ${blob.url}`);
  return blob.url;
}

// =============================================================================
// Main Commands
// =============================================================================

async function testApi() {
  console.log('\n🧪 Testing Nano Banana Pro API...\n');
  
  if (!GOOGLE_AI_API_KEY) {
    console.error('❌ GOOGLE_AI_API_KEY not found in .env.local');
    return;
  }
  console.log('✅ API key found');

  const testPrompt = 'A red Porsche 911 in a modern industrial garage, professional automotive photography, 8K quality';
  const testPath = path.join(OUTPUT_DIR, '_test-image.png');
  
  try {
    await generateImage(testPrompt, testPath);
    console.log('\n✅ API test successful!');
  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
  }
}

async function generateSingle(slug, skipUpload = false) {
  const car = carData.find(c => c.slug === slug);
  if (!car) {
    console.error(`❌ Car not found: ${slug}`);
    return null;
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`🚗 ${car.name} (${car.years})`);
  console.log(`   Color: ${getCarColor(slug)}`);
  console.log(`${'─'.repeat(50)}`);

  const prompt = generatePrompt(car);
  const outputPath = path.join(OUTPUT_DIR, `${slug}-garage.png`);

  try {
    const imagePath = await generateImage(prompt, outputPath);
    
    if (!skipUpload) {
      const blobUrl = await uploadToBlob(imagePath, slug);
      return { success: true, slug, imagePath, blobUrl };
    }
    
    return { success: true, slug, imagePath };
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    return { success: false, slug, error: error.message };
  }
}

async function generateBatch(count = 10, delayMs = 2000) {
  console.log(`\n🏭 BATCH GENERATION: ${count} cars\n`);
  
  // Find cars that don't have garage images yet (check all extensions)
  const pending = carData.filter(car => {
    const pngPath = path.join(OUTPUT_DIR, `${car.slug}-garage.png`);
    const jpgPath = path.join(OUTPUT_DIR, `${car.slug}-garage.jpg`);
    const webpPath = path.join(OUTPUT_DIR, `${car.slug}-garage.webp`);
    return !fs.existsSync(pngPath) && !fs.existsSync(jpgPath) && !fs.existsSync(webpPath);
  }).slice(0, count);

  if (pending.length === 0) {
    console.log('✅ All cars already have garage images!');
    console.log('   Use --force to regenerate existing images.');
    return;
  }

  console.log(`📋 Cars to generate (${pending.length}):`);
  pending.forEach((car, i) => console.log(`   ${i + 1}. ${car.name}`));
  console.log();

  const results = { success: [], failed: [] };

  for (let i = 0; i < pending.length; i++) {
    const car = pending[i];
    console.log(`\n[${i + 1}/${pending.length}]`);
    
    const result = await generateSingle(car.slug);
    
    if (result?.success) {
      results.success.push(result);
    } else {
      results.failed.push({ slug: car.slug, error: result?.error });
    }

    // Rate limit delay between generations
    if (i < pending.length - 1) {
      console.log(`   ⏳ Waiting ${delayMs / 1000}s...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  // Summary
  console.log(`\n${'═'.repeat(50)}`);
  console.log('📊 BATCH COMPLETE');
  console.log(`${'═'.repeat(50)}`);
  console.log(`✅ Success: ${results.success.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('\nFailed cars:');
    results.failed.forEach(f => console.log(`   - ${f.slug}: ${f.error}`));
  }
  
  if (results.success.length > 0) {
    console.log('\n✅ Generated images are now live in My Garage!');
  }
}

function showPrompt(slug) {
  const car = carData.find(c => c.slug === slug);
  if (!car) {
    console.error(`❌ Car not found: ${slug}`);
    return;
  }

  console.log(`\n📝 Prompt for ${car.name}:\n`);
  console.log('─'.repeat(50));
  console.log(generatePrompt(car));
  console.log('─'.repeat(50));
}

function showStatus() {
  console.log('\n📊 GARAGE IMAGE STATUS\n');
  
  let generated = 0;
  let pending = 0;
  
  const tiers = ['premium', 'upper-mid', 'mid', 'budget'];
  
  for (const tier of tiers) {
    const tierCars = carData.filter(c => c.tier === tier);
    console.log(`\n${tier.toUpperCase()} (${tierCars.length}):`);
    
    for (const car of tierCars) {
      const pngPath = path.join(OUTPUT_DIR, `${car.slug}-garage.png`);
      const jpgPath = path.join(OUTPUT_DIR, `${car.slug}-garage.jpg`);
      const hasImage = fs.existsSync(pngPath) || fs.existsSync(jpgPath);
      const icon = hasImage ? '✅' : '⬜';
      console.log(`  ${icon} ${car.slug}`);
      
      if (hasImage) generated++;
      else pending++;
    }
  }
  
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Total: ${carData.length} | Generated: ${generated} | Pending: ${pending}`);
}

function listCars() {
  console.log('\n📋 All Cars:\n');
  carData.forEach((car, i) => {
    console.log(`${String(i + 1).padStart(2)}. ${car.slug} - ${car.name}`);
  });
  console.log(`\nTotal: ${carData.length} cars`);
}

// =============================================================================
// CLI Router
// =============================================================================

const [,, command, arg, arg2] = process.argv;

switch (command) {
  case 'test':
    testApi();
    break;

  case 'single':
    if (!arg) {
      console.error('Usage: node scripts/generate-garage-nano.js single <slug>');
      process.exit(1);
    }
    generateSingle(arg);
    break;

  case 'batch':
    const count = parseInt(arg) || 10;
    const delay = parseInt(arg2) || 3000;
    generateBatch(count, delay);
    break;

  case 'prompt':
    if (!arg) {
      console.error('Usage: node scripts/generate-garage-nano.js prompt <slug>');
      process.exit(1);
    }
    showPrompt(arg);
    break;

  case 'status':
    showStatus();
    break;

  case 'list':
    listCars();
    break;

  default:
    console.log(`
🏎️  Garage Image Generator - Nano Banana Pro Edition
${'═'.repeat(50)}

Creates premium industrial warehouse images for My Garage.
Uses Google's Nano Banana Pro (Gemini 3 Pro Image Preview).

Commands:
  test              Test API connection
  single <slug>     Generate + upload one car
  batch <count>     Generate batch (default: 10)
  prompt <slug>     Preview the prompt for a car
  status            Show generation progress
  list              List all car slugs

Examples:
  node scripts/generate-garage-nano.js test
  node scripts/generate-garage-nano.js single 991-1-carrera-s
  node scripts/generate-garage-nano.js batch 10
  node scripts/generate-garage-nano.js status
`);
}



















