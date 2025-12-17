#!/usr/bin/env node
/**
 * Exclusive Garage Image Generator (Nano Banana Edition)
 * 
 * Creates premium, high-end industrial warehouse images for the garage page.
 * Uses Google's Nano Banana Pro (Gemini 3 Pro Image Preview) for highest quality.
 * These images are exclusive to the garage - not found elsewhere on the site.
 * 
 * Style: Industrial collector's garage / warehouse setting
 * - Private collector's warehouse or industrial space
 * - Dramatic natural lighting from windows/skylights
 * - Polished concrete floor with subtle reflections
 * - Premium, exclusive, aspirational atmosphere
 * 
 * Usage:
 *   node scripts/generate-garage-images.js test              # Test API connection
 *   node scripts/generate-garage-images.js single <slug>     # Generate for one car
 *   node scripts/generate-garage-images.js batch <count>     # Generate batch of N cars
 *   node scripts/generate-garage-images.js upload <slug>     # Upload to blob
 *   node scripts/generate-garage-images.js list              # List all cars
 *   node scripts/generate-garage-images.js prompt <slug>     # Show prompt for manual generation
 *   node scripts/generate-garage-images.js status            # Show generation status
 * 
 * Environment variables required:
 *   GOOGLE_AI_API_KEY - Google AI API key for Nano Banana
 *   BLOB_READ_WRITE_TOKEN - Vercel Blob token (for uploads)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { carData } from '../data/cars.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(PROJECT_ROOT, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        let value = valueParts.join('=');
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (key && value) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const GENERATED_IMAGES_DIR = path.join(PROJECT_ROOT, 'generated-images', 'garage');

// Ensure generated-images directory exists
if (!fs.existsSync(GENERATED_IMAGES_DIR)) {
  fs.mkdirSync(GENERATED_IMAGES_DIR, { recursive: true });
}

// =============================================================================
// Car Color & Style Mapping
// =============================================================================

/**
 * Signature colors for each brand/model for visual consistency
 * This ensures the garage images have a cohesive, premium look
 */
const CAR_COLORS = {
  // Porsche - Classic colors
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
  
  // Corvette - Bold American colors
  'c8-corvette-stingray': 'Rapid Blue',
  'c7-corvette-grand-sport': 'Watkins Glen Gray metallic',
  'c7-corvette-z06': 'Torch Red',
  'chevrolet-corvette-c6-z06': 'Velocity Yellow',
  'chevrolet-corvette-c6-grand-sport': 'Cyber Gray metallic',
  'chevrolet-corvette-c5-z06': 'Electron Blue metallic',
  
  // Camaro
  'camaro-zl1': 'Riverside Blue metallic',
  'camaro-ss-1le': 'Summit White with black stripes',
  
  // Mustang
  'mustang-gt-pp2': 'Kona Blue',
  'shelby-gt350': 'Avalanche Gray',
  'shelby-gt500': 'Grabber Lime',
  'ford-mustang-boss-302': 'School Bus Yellow',
  
  // BMW - Iconic M colors
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
  
  // Audi - RS colors
  'audi-r8-v8': 'Daytona Gray pearl',
  'audi-r8-v10': 'Suzuka Gray metallic',
  'audi-rs3-8v': 'Nardo Gray',
  'audi-rs3-8y': 'Kyalami Green',
  'audi-rs5-b8': 'Sepang Blue pearl',
  'audi-rs5-b9': 'Sonoma Green metallic',
  'audi-tt-rs-8j': 'Imola Yellow',
  'audi-tt-rs-8s': 'Turbo Blue',
  
  // Japanese - JDM legends
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
  
  // Subaru
  'subaru-wrx-sti-gd': 'World Rally Blue pearl',
  'subaru-wrx-sti-gr-gv': 'WR Blue Mica',
  'subaru-wrx-sti-va': 'WR Blue pearl',
  'subaru-brz-zc6': 'WR Blue pearl',
  'subaru-brz-zd8': 'Sapphire Blue pearl',
  
  // Mitsubishi
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
  
  // Italian
  'lamborghini-gallardo': 'Verde Ithaca',
  'alfa-romeo-4c': 'Alfa Red',
  'alfa-romeo-giulia-quadrifoglio': 'Verde Visconti',
  'maserati-granturismo': 'Grigio Granito',
  
  // British
  'jaguar-f-type-r': 'Ultra Blue metallic',
  'jaguar-f-type-v6-s': 'Firesand metallic',
  'aston-martin-v8-vantage': 'Lightning Silver',
  
  // American muscle
  'dodge-viper': 'Viper Red',
  'dodge-challenger-srt-392': 'Plum Crazy pearl',
  'dodge-challenger-hellcat': 'TorRed',
  'dodge-charger-srt-392': 'F8 Green',
  'dodge-charger-hellcat': 'Destroyer Grey',
  'cadillac-cts-v-gen2': 'Black Diamond Tricoat',
  'cadillac-cts-v-gen3': 'Crystal White Tricoat',
  
  // Hot hatches
  'volkswagen-golf-r-mk7': 'Lapiz Blue metallic',
  'volkswagen-golf-r-mk8': 'Pure White',
  'volkswagen-gti-mk7': 'Tornado Red',
  'ford-focus-rs': 'Nitrous Blue',
  
  // Lexus
  'lexus-lc-500': 'Structural Blue',
  'lexus-rc-f': 'Ultrasonic Blue Mica 2.0',
  
  // Tesla
  'tesla-model-3-performance': 'Midnight Silver metallic',
};

/**
 * Get the signature color for a car, with fallback
 */
function getCarColor(slug) {
  return CAR_COLORS[slug] || 'metallic silver gray';
}

/**
 * Extract brand from car name/slug for prompt context
 */
function extractBrand(name) {
  const brandPatterns = [
    { pattern: /Cayman|Carrera|911|Boxster|GT4|GT3|718|981|987|991|992|997/i, brand: 'Porsche' },
    { pattern: /Corvette|C5|C6|C7|C8/i, brand: 'Chevrolet Corvette' },
    { pattern: /Camaro/i, brand: 'Chevrolet Camaro' },
    { pattern: /Mustang|GT350|GT500|Shelby|Boss 302/i, brand: 'Ford Mustang' },
    { pattern: /GT-R|GTR/i, brand: 'Nissan GT-R' },
    { pattern: /370Z|350Z|300ZX|Nissan Z/i, brand: 'Nissan Z' },
    { pattern: /Supra|GR86|86|Toyota/i, brand: 'Toyota' },
    { pattern: /BRZ/i, brand: 'Subaru BRZ' },
    { pattern: /WRX|STI/i, brand: 'Subaru WRX' },
    { pattern: /Miata|MX-5|RX-7|RX7/i, brand: 'Mazda' },
    { pattern: /S2000|NSX|Civic Type R|Integra Type R/i, brand: 'Honda' },
    { pattern: /R8/i, brand: 'Audi R8' },
    { pattern: /RS3|RS5|TT RS/i, brand: 'Audi RS' },
    { pattern: /Gallardo/i, brand: 'Lamborghini' },
    { pattern: /Emira|Evora|Elise|Exige/i, brand: 'Lotus' },
    { pattern: /M2|M3|M4|M5|1M|Z4 M/i, brand: 'BMW M' },
    { pattern: /C63|E63|AMG GT/i, brand: 'Mercedes-AMG' },
    { pattern: /F-Type/i, brand: 'Jaguar' },
    { pattern: /Vantage/i, brand: 'Aston Martin' },
    { pattern: /GranTurismo/i, brand: 'Maserati' },
    { pattern: /4C|Giulia/i, brand: 'Alfa Romeo' },
    { pattern: /Viper/i, brand: 'Dodge Viper' },
    { pattern: /Challenger|Charger/i, brand: 'Dodge' },
    { pattern: /CTS-V|CT5-V/i, brand: 'Cadillac V-Series' },
    { pattern: /Golf R|GTI/i, brand: 'Volkswagen' },
    { pattern: /Focus RS/i, brand: 'Ford Focus' },
    { pattern: /LC 500|RC F/i, brand: 'Lexus' },
    { pattern: /Model 3|Tesla/i, brand: 'Tesla' },
    { pattern: /Lancer Evo/i, brand: 'Mitsubishi Evo' },
  ];
  
  for (const { pattern, brand } of brandPatterns) {
    if (pattern.test(name)) {
      return brand;
    }
  }
  return 'sports car';
}

// =============================================================================
// Premium Garage Prompt Generation - Optimized for Nano Banana Pro
// =============================================================================

/**
 * Industrial environment variations for diverse garage images
 * Each image gets a unique industrial setting while maintaining cohesive theme
 */
const INDUSTRIAL_ENVIRONMENTS = [
  'Historic brick warehouse with tall arched windows, cast iron columns, exposed timber beams',
  'Modern concrete garage with floor-to-ceiling glass walls, polished resin floor',
  'Vintage factory building with wooden truss ceiling, steel I-beams, industrial skylights',
  'Former railroad depot with dramatic skylights, raw brick walls, steel track rails in floor',
  'Converted aircraft hangar with massive sliding doors, corrugated steel walls',
  'Old foundry building with raw concrete walls, copper patina accents, industrial character',
  'Loft-style garage with exposed HVAC ductwork, steel beams, original hardwood floors',
  'Classic car barn with weathered wood siding, hay loft, natural light streaming in',
  'Underground parking structure with sculptural concrete pillars, moody atmosphere',
  'Waterfront warehouse with large loading dock doors, harbor light flooding in',
  'Former textile mill with original brick, cast iron columns, north-facing windows',
  'Industrial brewery conversion with copper pipes, concrete floors, Edison lighting',
  'Art deco factory with geometric windows, terrazzo floors, vintage machinery accents',
  'Mid-century showroom with clerestory windows, wood panel walls, retro industrial feel',
  'Contemporary auto gallery with white walls, concrete floors, museum-like presentation',
];

/**
 * Get a random industrial environment from our curated list
 */
function getIndustrialEnvironment(index = null) {
  if (index !== null && index >= 0 && index < INDUSTRIAL_ENVIRONMENTS.length) {
    return INDUSTRIAL_ENVIRONMENTS[index];
  }
  return INDUSTRIAL_ENVIRONMENTS[Math.floor(Math.random() * INDUSTRIAL_ENVIRONMENTS.length)];
}

/**
 * Generate an optimized industrial garage prompt for Nano Banana Pro
 * 
 * PROMPT ENGINEERING FOR GEMINI:
 * - Concise, direct language (Gemini responds well to clear instructions)
 * - Strong emphasis on photorealism and camera specifications
 * - Specific technical photography terms
 * - Structured format with clear sections
 */
function generateGaragePrompt(car, environmentIndex = null) {
  const year = car.years.split('-')[0];
  const color = getCarColor(car.slug);
  const environment = getIndustrialEnvironment(environmentIndex);

  // Optimized prompt structure for Nano Banana Pro
  const prompt = `SUBJECT: ${year} ${car.name} in ${color}, pristine condition, showroom quality.

ENVIRONMENT: ${environment}. Private collector's sanctuary, exclusive atmosphere.

COMPOSITION: Front 3/4 angle hero shot. Car positioned center-right, occupying 45-50% of frame width. Camera at knee height for commanding presence. Show architectural environment framing the car.

LIGHTING: Dramatic golden hour natural light streaming through windows. Warm color temperature. Visible light rays in atmosphere. Car's ${color} paint shows rich reflections and highlights. Moody shadows create depth.

FLOOR: Polished concrete or epoxy with subtle reflections of the car's silhouette.

STYLE: Shot on Hasselblad H6D-100c medium format camera, 80mm lens, f/4 aperture. Magazine editorial automotive photography. Razor sharp focus. Rich color depth. Professional color grading.

QUALITY: 8K resolution, hyper-realistic, photographic, not AI-generated. Automotive press release quality. Commercial photography for luxury brand campaign.

EXCLUSIONS: No people, no text, no watermarks, no logos, no license plates.`;

  return prompt;
}

/**
 * Generate an alternate style prompt - more cinematic/dramatic
 */
function generateGaragePromptAlt(car, environmentIndex = null) {
  const year = car.years.split('-')[0];
  const color = getCarColor(car.slug);
  const environment = getIndustrialEnvironment(environmentIndex);

  const prompt = `SUBJECT: ${year} ${car.name}, ${color} finish, collector grade.

SETTING: ${environment}. Moody, atmospheric private garage. Dawn or dusk light.

FRAMING: Classic front 3/4 automotive hero composition. Low angle, eye-level with headlights. Car fills 50% of frame, centered slightly right. Strong environmental context visible.

ATMOSPHERE: Cinematic golden hour. Dust particles floating in light beams. ${color} paintwork catching dramatic highlights. Deep, rich shadows. Warm color palette with teal shadows.

TECHNICAL: Hasselblad X2D 100C, 90mm f/3.2. Shallow depth of field on background. Tack sharp on car. Film-like color science. Magazine cover quality.

OUTPUT: Ultra high resolution photorealistic image. Indistinguishable from actual photograph. Luxury automotive brand campaign quality.

AVOID: People, text, watermarks, logos, artificial elements.`;

  return prompt;
}

// =============================================================================
// Nano Banana Pro (Gemini 3 Pro Image Preview) - Image Generation
// =============================================================================

/**
 * Generate an image using Nano Banana Pro (gemini-3-pro-image-preview)
 * This is Google's highest quality image generation model
 * 
 * @param {string} prompt - The image generation prompt
 * @param {string} outputPath - Path to save the generated image
 * @param {object} options - Generation options
 * @returns {Promise<string>} - Path to the saved image
 */
async function generateImageWithNanaBananaPro(prompt, outputPath, options = {}) {
  if (!GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY not set in environment');
  }
  
  const aspectRatio = options.aspectRatio || '16:9';
  const imageSize = options.imageSize || '2K';  // 1K, 2K, or 4K
  
  console.log('🍌 Generating with Nano Banana Pro (gemini-3-pro-image-preview)...');
  console.log(`   Aspect: ${aspectRatio}, Size: ${imageSize}`);
  console.log(`   Prompt preview: ${prompt.substring(0, 80)}...`);
  
  const modelName = 'gemini-3-pro-image-preview';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GOOGLE_AI_API_KEY}`;
  
  const body = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: imageSize
      }
    }
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Nano Banana Pro API error (${response.status}): ${errorText}`);
  }
  
  const result = await response.json();
  
  // Extract image from response
  const candidates = result.candidates || [];
  if (candidates.length === 0) {
    throw new Error('No candidates in response');
  }
  
  const parts = candidates[0].content?.parts || [];
  const imagePart = parts.find(p => p.inlineData);
  const textPart = parts.find(p => p.text);
  
  if (textPart) {
    console.log(`   Model notes: ${textPart.text.substring(0, 100)}...`);
  }
  
  if (!imagePart) {
    const finishReason = candidates[0].finishReason;
    throw new Error(`No image in response. Finish reason: ${finishReason}. The model may have refused the prompt.`);
  }
  
  const imageData = imagePart.inlineData.data;
  const mimeType = imagePart.inlineData.mimeType || 'image/png';
  
  let ext = '.png';
  if (mimeType === 'image/jpeg') ext = '.jpg';
  if (mimeType === 'image/webp') ext = '.webp';
  
  const buffer = Buffer.from(imageData, 'base64');
  
  // Adjust output path extension based on what we received
  let finalPath = outputPath;
  if (!outputPath.endsWith(ext)) {
    finalPath = outputPath.replace(/\.(png|jpg|jpeg|webp)$/i, ext);
  }
  
  fs.writeFileSync(finalPath, buffer);
  console.log(`   ✅ Saved: ${path.basename(finalPath)} (${(buffer.length / 1024).toFixed(0)} KB)`);
  
  return finalPath;
}

/**
 * Test API connection
 */
async function testConnection() {
  console.log('\n🧪 Testing Nano Banana Pro API connection...\n');
  
  if (!GOOGLE_AI_API_KEY) {
    console.error('❌ GOOGLE_AI_API_KEY not set in environment');
    console.log('\nPlease add GOOGLE_AI_API_KEY to your .env.local file');
    return;
  }
  
  console.log('✅ API key found');
  
  // Test with a simple prompt
  const testPrompt = 'A red sports car in a modern garage, professional automotive photography';
  const testOutput = path.join(GENERATED_IMAGES_DIR, '_api-test.png');
  
  try {
    await generateImageWithNanaBananaPro(testPrompt, testOutput, { aspectRatio: '16:9', imageSize: '1K' });
    console.log('\n✅ API test successful!');
    console.log(`   Test image saved to: ${testOutput}`);
  } catch (error) {
    console.error(`\n❌ API test failed: ${error.message}`);
  }
}

// =============================================================================
// Vercel Blob Upload
// =============================================================================

/**
 * Upload an image to Vercel Blob for garage-exclusive images
 */
async function uploadToBlob(localPath, slug) {
  if (!BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN not set in environment');
  }
  
  const sharp = (await import('sharp')).default;
  const { put } = await import('@vercel/blob');
  
  // Convert to optimized WebP
  const webpBuffer = await sharp(localPath)
    .webp({ quality: 85 })
    .toBuffer();
  
  const blobPath = `garage/${slug}/exclusive.webp`;
  
  console.log(`   ☁️  Uploading to: ${blobPath}`);
  
  const blob = await put(blobPath, webpBuffer, {
    access: 'public',
    contentType: 'image/webp',
    token: BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  
  console.log(`   ✅ Blob URL: ${blob.url}`);
  return blob.url;
}

// =============================================================================
// Generation Commands
// =============================================================================

/**
 * Generate exclusive garage image for a specific car (local save only)
 */
async function generateForCar(slug, useAlt = false) {
  const car = carData.find(c => c.slug === slug);
  if (!car) {
    console.error(`❌ Car not found: ${slug}`);
    console.log('\nUse "list" command to see available slugs.');
    return null;
  }
  
  console.log(`\n🚗 Generating garage image for: ${car.name} (${car.years})`);
  console.log(`   Tier: ${car.tier}, Category: ${car.category}`);
  console.log(`   Color: ${getCarColor(slug)}`);
  
  const prompt = useAlt ? generateGaragePromptAlt(car) : generateGaragePrompt(car);
  
  const outputPath = path.join(GENERATED_IMAGES_DIR, `${slug}-garage.png`);
  
  try {
    const finalPath = await generateImageWithNanaBananaPro(prompt, outputPath, {
      aspectRatio: '16:9',
      imageSize: '2K'
    });
    console.log(`\n🎉 Success! Image saved to: ${finalPath}`);
    return finalPath;
  } catch (error) {
    console.error(`\n❌ Generation failed: ${error.message}`);
    return null;
  }
}

/**
 * Generate and upload image for a single car - fresh generation with diverse industrial backgrounds
 */
async function generateAndUploadCar(slug, useAlt = false, skipIfExists = true) {
  const car = carData.find(c => c.slug === slug);
  if (!car) {
    return { success: false, slug, error: 'Car not found' };
  }
  
  // Check if image already exists locally
  const existingPath = path.join(GENERATED_IMAGES_DIR, `${slug}-garage.png`);
  if (fs.existsSync(existingPath) && skipIfExists) {
    console.log(`⏭️  Skipping ${slug} - image already exists`);
    return { success: true, slug, skipped: true };
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚗 Processing: ${car.name} (${car.years})`);
  console.log(`${'='.repeat(60)}`);
  console.log(`   Color: ${getCarColor(slug)}`);
  
  try {
    // Generate fresh image with diverse industrial backgrounds
    const prompt = useAlt ? generateGaragePromptAlt(car) : generateGaragePrompt(car);
    const outputPath = path.join(GENERATED_IMAGES_DIR, `${slug}-garage.png`);
    const localPath = await generateImageWithGPT(prompt, outputPath);
    const blobUrl = await uploadToBlob(localPath, slug);
    
    return { success: true, slug, localPath, blobUrl };
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    return { success: false, slug, error: error.message };
  }
}

/**
 * Batch generate garage images
 */
async function batchGenerate(tierFilter = null, delayMs = 5000, skipExisting = true) {
  console.log('\n🔄 Starting batch garage image generation...\n');
  
  let carsToProcess = carData;
  
  if (tierFilter) {
    carsToProcess = carData.filter(car => car.tier === tierFilter);
    console.log(`📊 Filtering by tier: ${tierFilter}`);
  }
  
  console.log(`📊 Stats:`);
  console.log(`   Total cars to process: ${carsToProcess.length}`);
  console.log(`   Delay between generations: ${delayMs}ms`);
  console.log(`   Skip existing: ${skipExisting}\n`);
  
  const results = {
    success: [],
    failed: [],
    skipped: [],
  };
  
  for (let i = 0; i < carsToProcess.length; i++) {
    const car = carsToProcess[i];
    console.log(`\n📍 Progress: ${i + 1}/${carsToProcess.length}`);
    
    const result = await generateAndUploadCar(car.slug, false, skipExisting);
    
    if (result.skipped) {
      results.skipped.push(result);
    } else if (result.success) {
      results.success.push(result);
    } else {
      results.failed.push(result);
    }
    
    // Rate limit delay
    if (i < carsToProcess.length - 1 && !result.skipped) {
      console.log(`⏳ Waiting ${delayMs/1000}s before next generation...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 BATCH GENERATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${results.success.length}`);
  console.log(`⏭️  Skipped: ${results.skipped.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed cars:');
    for (const fail of results.failed) {
      console.log(`   - ${fail.slug}: ${fail.error}`);
    }
  }
  
  if (results.success.length > 0) {
    console.log('\n✅ Successfully generated:');
    for (const success of results.success) {
      console.log(`   - ${success.slug}: ${success.blobUrl}`);
    }
  }
  
  return results;
}

/**
 * Upload existing local image
 */
async function uploadCarImage(slug) {
  const localPath = path.join(GENERATED_IMAGES_DIR, `${slug}-garage.png`);
  
  if (!fs.existsSync(localPath)) {
    console.error(`❌ Image not found: ${localPath}`);
    return null;
  }
  
  try {
    const blobUrl = await uploadToBlob(localPath, slug);
    console.log(`\n🎉 Upload complete!`);
    return blobUrl;
  } catch (error) {
    console.error(`\n❌ Upload failed: ${error.message}`);
    return null;
  }
}

/**
 * List all cars
 */
function listCars() {
  console.log('\n📋 All cars in database:\n');
  
  const tiers = ['premium', 'upper-mid', 'mid', 'budget'];
  
  for (const tier of tiers) {
    const tierCars = carData.filter(c => c.tier === tier);
    console.log(`\n=== ${tier.toUpperCase()} (${tierCars.length} cars) ===`);
    for (const car of tierCars) {
      const localPath = path.join(GENERATED_IMAGES_DIR, `${car.slug}-garage.png`);
      const hasImage = fs.existsSync(localPath) ? '✅' : '⬜';
      console.log(`  ${hasImage} ${car.slug} - ${car.name}`);
    }
  }
  
  console.log(`\n\nTotal: ${carData.length} cars`);
}

/**
 * Show prompt for a car
 */
function showPrompt(slug, useAlt = false) {
  const car = carData.find(c => c.slug === slug);
  if (!car) {
    console.error(`❌ Car not found: ${slug}`);
    return;
  }
  
  console.log(`\n📝 Garage prompt for ${car.name}:\n`);
  console.log('─'.repeat(60));
  console.log(useAlt ? generateGaragePromptAlt(car) : generateGaragePrompt(car));
  console.log('─'.repeat(60));
  console.log(`\n📁 Save as: generated-images/garage/${slug}-garage.png`);
  console.log(`☁️  Blob path: garage/${slug}/exclusive.webp`);
}

// =============================================================================
// Main CLI
// =============================================================================

const command = process.argv[2];
const arg = process.argv[3];
const useAlt = process.argv.includes('--alt');
const delayFlag = process.argv.find(a => a.startsWith('--delay='));
const delayMs = delayFlag ? parseInt(delayFlag.split('=')[1], 10) : 5000;
const noSkip = process.argv.includes('--no-skip');

switch (command) {
  case 'test':
    testConnection();
    break;
    
  case 'generate':
    if (!arg) {
      console.error('Usage: node scripts/generate-garage-images.js generate <slug> [--alt]');
      process.exit(1);
    }
    generateForCar(arg, useAlt);
    break;
    
  case 'single':
    if (!arg) {
      console.error('Usage: node scripts/generate-garage-images.js single <slug>');
      process.exit(1);
    }
    generateAndUploadCar(arg, useAlt, false);
    break;
    
  case 'batch':
    batchGenerate(arg || null, delayMs, !noSkip);
    break;

  // === COMPOSITE APPROACH COMMANDS ===
  case 'create-background':
    // Create clean warehouse background
    createCleanBackground().then(() => {
      console.log('\n✅ Clean background created!');
    }).catch(err => {
      console.error('Failed:', err.message);
    });
    break;

  case 'composite':
    // Generate single car using composite approach
    if (!arg) {
      console.error('Usage: node scripts/generate-garage-images.js composite <slug> [--force]');
      process.exit(1);
    }
    const forceGenerate = process.argv.includes('--force');
    generateWithComposite(arg, forceGenerate).then(result => {
      if (result?.success) {
        console.log('\n✅ Composite complete!');
        if (result.blobUrl) console.log('   URL:', result.blobUrl);
      }
    }).catch(err => {
      console.error('Failed:', err.message);
    });
    break;

  case 'composite-batch':
    // Batch generate all cars using composite approach
    (async () => {
      console.log('🏭 COMPOSITE BATCH: Generating all cars with identical background\n');
      
      // Create background first if needed
      if (!fs.existsSync(CLEAN_BACKGROUND_PATH)) {
        console.log('Creating clean background first...\n');
        await createCleanBackground();
      }
      
      const results = { success: [], failed: [], skipped: [] };
      const cars = arg ? carData.filter(c => c.tier === arg) : carData;
      
      for (let i = 0; i < cars.length; i++) {
        const car = cars[i];
        console.log(`\n[${i + 1}/${cars.length}]`);
        
        try {
          const result = await generateWithComposite(car.slug);
          if (result?.skipped) {
            results.skipped.push(car.slug);
          } else if (result?.success) {
            results.success.push(car.slug);
          } else {
            results.failed.push(car.slug);
          }
        } catch (err) {
          results.failed.push(car.slug);
        }
        
        // Rate limiting
        if (i < cars.length - 1) {
          console.log(`   ⏳ Waiting ${delayMs/1000}s...`);
          await new Promise(r => setTimeout(r, delayMs));
        }
      }
      
      console.log('\n' + '='.repeat(60));
      console.log('COMPOSITE BATCH COMPLETE');
      console.log('='.repeat(60));
      console.log(`✅ Success: ${results.success.length}`);
      console.log(`⏭️  Skipped: ${results.skipped.length}`);
      console.log(`❌ Failed: ${results.failed.length}`);
      if (results.failed.length > 0) {
        console.log('   Failed:', results.failed.join(', '));
      }
    })();
    break;

  case 'upload':
    if (!arg) {
      console.error('Usage: node scripts/generate-garage-images.js upload <slug>');
      process.exit(1);
    }
    uploadCarImage(arg);
    break;
    
  case 'list':
    listCars();
    break;
    
  case 'prompt':
    if (!arg) {
      console.error('Usage: node scripts/generate-garage-images.js prompt <slug> [--alt]');
      process.exit(1);
    }
    showPrompt(arg, useAlt);
    break;
    
  default:
    console.log(`
🏎️  Exclusive Garage Image Generator
=====================================

Creates premium, high-end studio images exclusively for the garage page.
Style: Dark studio, dramatic rim lighting, reflective floor, museum-quality presentation.

Usage:
  node scripts/generate-garage-images.js <command> [args]

Commands:
  test                    Test OpenAI GPT-Image-1 API connection
  generate <slug>         Generate garage image (save locally only)
  single <slug>           Generate + upload single car
  batch [tier]            Generate + upload ALL cars (or filter by tier)
  upload <slug>           Upload existing local image to Vercel Blob
  list                    List all cars and their image status
  prompt <slug>           Show the prompt for manual generation

Options:
  --alt                   Use alternate prompt style
  --delay=5000            Delay between batch generations in ms (default: 5000)
  --no-skip               Don't skip existing images in batch mode

Examples:
  node scripts/generate-garage-images.js test
  node scripts/generate-garage-images.js generate 718-cayman-gt4
  node scripts/generate-garage-images.js single c8-corvette-stingray
  node scripts/generate-garage-images.js batch premium --delay=3000
  node scripts/generate-garage-images.js batch --delay=5000
  node scripts/generate-garage-images.js list
  node scripts/generate-garage-images.js prompt camaro-zl1 --alt

Tiers for batch filtering:
  - premium     (highest tier cars)
  - upper-mid   
  - mid         
  - budget      (entry-level sports cars)

Image storage:
  - Local: generated-images/garage/<slug>-garage.png
  - Blob:  garage/<slug>/exclusive.webp
`);
}










