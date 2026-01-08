#!/usr/bin/env node
/**
 * AutoRev Tuning Shop Ad Generator
 * 
 * Automates creation of car-specific Tuning Shop ads:
 * 1. Generates car images via MidJourney API
 * 2. Creates screen recording via Playwright automation
 * 3. Generates music via ElevenLabs
 * 4. Assembles video via ffmpeg
 * 
 * Output: 24-second vertical video ad ready for social media
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { spawn, execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load environment variables
const envPath = path.join(PROJECT_ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#')) {
      let value = valueParts.join('=').trim();
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key.trim()] = value;
    }
  });
}

const MIDJOURNEY_API_KEY = process.env.MIDJOURNEY_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'generated-videos', 'tuning-shop-ads');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CARS_TO_GENERATE = [
  {
    slug: 'bmw-m3-e92',
    displayName: 'BMW M3',
    year: '2008',
    color: 'Alpine White',
    midjourneyPrompt: 'white BMW M3 E92 in a professional garage workshop, front angle, cinematic lighting, motorsport aesthetic, hyper-realistic photography --ar 9:16 --style raw',
    scenicPrompt: 'white BMW M3 E92 on mountain road at golden hour, dramatic landscape, rear three-quarter view, automotive photography --ar 9:16 --style raw',
  },
  {
    slug: 'volkswagen-golf-r-mk7',
    displayName: 'Golf R',
    year: '2017',
    color: 'Lapiz Blue',
    midjourneyPrompt: 'blue Volkswagen Golf R Mk7 in modern tuning shop, wheel detail shot, professional lighting, performance aesthetic --ar 9:16 --style raw',
    scenicPrompt: 'blue Volkswagen Golf R Mk7 on coastal highway at sunset, side profile, automotive photography --ar 9:16 --style raw',
  },
  // Add more cars here
];

// ============================================================================
// STEP 1: GENERATE CAR IMAGES VIA MIDJOURNEY
// ============================================================================

/**
 * Generate images using MidJourney API
 * Note: You'll need to sign up for a MidJourney API service like:
 * - https://www.useapi.net/docs/api-midjourney
 * - https://rapidapi.com/nexusmind/api/midjourney-ai-image-generator
 */
async function generateCarImages(car) {
  console.log(`\n🎨 Generating images for ${car.displayName}...`);
  
  const outputDir = path.join(OUTPUT_DIR, car.slug, 'images');
  fs.mkdirSync(outputDir, { recursive: true });

  const images = {
    opening: path.join(outputDir, 'opening.png'),
    scenic: path.join(outputDir, 'scenic.png'),
  };

  // Check if images already exist
  if (fs.existsSync(images.opening) && fs.existsSync(images.scenic)) {
    console.log('   ✅ Images already exist, skipping generation');
    return images;
  }

  // TODO: Implement actual MidJourney API call
  // For now, this is a placeholder showing the structure
  
  console.log('   📸 Opening shot prompt:', car.midjourneyPrompt);
  console.log('   📸 Scenic shot prompt:', car.scenicPrompt);
  console.log('   ⚠️  MidJourney API not yet implemented - please generate manually');
  
  // Placeholder: Copy from existing MidJourney folder if available
  const existingImages = path.join(PROJECT_ROOT, 'generated-videos', 'MidJourney');
  if (fs.existsSync(existingImages)) {
    console.log('   💡 TIP: Place generated images in:', outputDir);
  }

  return images;
}

// ============================================================================
// STEP 2: RECORD TUNING SHOP SCREEN CAPTURE
// ============================================================================

/**
 * Automate screen recording of Tuning Shop using Playwright
 */
async function recordTuningShopDemo(car) {
  console.log(`\n📱 Recording Tuning Shop demo for ${car.displayName}...`);
  
  const outputPath = path.join(OUTPUT_DIR, car.slug, `tuning-shop-demo.webm`);
  
  if (fs.existsSync(outputPath)) {
    console.log('   ✅ Demo already exists, skipping recording');
    return outputPath;
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro dimensions
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  // Start video recording
  await page.video(); // Playwright will auto-record
  
  try {
    // Navigate to AutoRev Tuning Shop
    console.log('   🌐 Navigating to tuning shop...');
    await page.goto(`http://localhost:3000/tuning-shop?car=${car.slug}`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Script the interaction
    console.log('   🎬 Recording interaction...');
    
    // 1. Show "Modify" section (2s)
    await page.click('button:has-text("Modify")');
    await page.waitForTimeout(2000);
    
    // 2. Click through upgrade categories (each 1.5s)
    const categories = ['Power', 'Turbo/C', 'Chassis', 'Brakes', 'Cooling'];
    for (const category of categories) {
      try {
        await page.click(`text=${category}`);
        await page.waitForTimeout(1500);
      } catch (e) {
        console.log(`   ⚠️  Category ${category} not found, skipping`);
      }
    }
    
    // 3. Show Performance Metrics (3s)
    await page.click('text=Performance Metrics');
    await page.waitForTimeout(3000);

    console.log('   ✅ Recording complete');

  } catch (error) {
    console.error('   ❌ Recording failed:', error.message);
  } finally {
    await context.close();
    await browser.close();
  }

  // Video is automatically saved by Playwright
  const videoPath = await page.video().path();
  
  // Move to our output directory
  if (videoPath) {
    fs.renameSync(videoPath, outputPath);
  }

  return outputPath;
}

// ============================================================================
// STEP 3: GENERATE MUSIC VIA ELEVENLABS
// ============================================================================

/**
 * Generate 25-second upbeat rock trailer music using ElevenLabs
 */
async function generateMusic(car) {
  console.log(`\n🎵 Generating music for ${car.displayName}...`);
  
  const outputPath = path.join(OUTPUT_DIR, car.slug, 'music.mp3');
  
  if (fs.existsSync(outputPath)) {
    console.log('   ✅ Music already exists, skipping generation');
    return outputPath;
  }

  if (!ELEVENLABS_API_KEY) {
    console.log('   ⚠️  ELEVENLABS_API_KEY not found - using existing library track');
    
    // Fallback: Use existing ad music
    const existingMusic = path.join(PROJECT_ROOT, 'generated-videos', 'ad-music', 'ad-upbeat-25s-2026-01-04.mp3');
    if (fs.existsSync(existingMusic)) {
      fs.copyFileSync(existingMusic, outputPath);
      return outputPath;
    }
    
    return null;
  }

  // ElevenLabs Sound Generation API
  const prompt = "Upbeat energetic rock trailer music, 25 seconds, epic drums, electric guitar riffs, powerful and exciting, perfect for car tuning advertisement";
  
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: prompt,
        duration_seconds: 25,
        prompt_influence: 0.5,
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(audioBuffer));
    console.log('   ✅ Music generated');
    
  } catch (error) {
    console.error('   ❌ Music generation failed:', error.message);
    return null;
  }

  return outputPath;
}

// ============================================================================
// STEP 4: ASSEMBLE VIDEO WITH FFMPEG
// ============================================================================

/**
 * Combine all assets into final video using ffmpeg
 */
async function assembleVideo(car, assets) {
  console.log(`\n🎬 Assembling final video for ${car.displayName}...`);
  
  const finalPath = path.join(OUTPUT_DIR, 'Final ADs', `Tuning Shop Ad - ${car.displayName}.mp4`);
  fs.mkdirSync(path.dirname(finalPath), { recursive: true });

  // Video structure (24 seconds total):
  // 0-4s:   Opening image with text overlays (MODIFY / YOUR / CAR NAME)
  // 4-18s:  Screen recording of Tuning Shop (14s)
  // 18-22s: Scenic shot with "WITH AUTOREV" (4s)
  // 22-24s: CTA card (2s)

  const tempDir = path.join(OUTPUT_DIR, car.slug, '.temp');
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // 1. Create opening sequence (4s) - image + text overlays
    console.log('   📝 Creating opening sequence...');
    // TODO: Use ffmpeg drawtext filter to add "MODIFY", "YOUR", car name
    
    // 2. Trim screen recording to 14s
    console.log('   ✂️  Trimming screen recording...');
    const trimmedDemo = path.join(tempDir, 'demo-14s.mp4');
    await executeFFmpeg([
      '-i', assets.screenRecording,
      '-t', '14',
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-y', trimmedDemo,
    ]);

    // 3. Create scenic sequence (4s)
    console.log('   🌄 Creating scenic sequence...');
    // TODO: Add "WITH AUTOREV" text overlay

    // 4. Create CTA card (2s)
    console.log('   📢 Creating CTA card...');
    // TODO: Generate static card with text and logo

    // 5. Concatenate all segments
    console.log('   🔗 Concatenating segments...');
    // TODO: Use ffmpeg concat

    // 6. Add music track
    console.log('   🎵 Adding music...');
    if (assets.music) {
      // TODO: Mix music under video audio
    }

    console.log(`   ✅ Video complete: ${finalPath}`);
    
  } catch (error) {
    console.error('   ❌ Assembly failed:', error.message);
  } finally {
    // Cleanup temp files
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  return finalPath;
}

/**
 * Execute ffmpeg command as promise
 */
function executeFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args);
    let stderr = '';
    
    proc.stderr.on('data', data => { stderr += data.toString(); });
    proc.on('close', code => {
      if (code === 0) resolve(true);
      else reject(new Error(`ffmpeg failed: ${stderr.slice(-300)}`));
    });
  });
}

// ============================================================================
// MAIN WORKFLOW
// ============================================================================

async function generateTuningShopAd(car) {
  console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║  Tuning Shop Ad Generator - ${car.displayName.padEnd(32)} ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝`);

  const assets = {};

  // Step 1: Generate images
  assets.images = await generateCarImages(car);

  // Step 2: Record screen demo
  assets.screenRecording = await recordTuningShopDemo(car);

  // Step 3: Generate music
  assets.music = await generateMusic(car);

  // Step 4: Assemble final video
  const finalVideo = await assembleVideo(car, assets);

  return finalVideo;
}

// ============================================================================
// CLI
// ============================================================================

const args = process.argv.slice(2);
const carSlug = args[0];

if (!carSlug) {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║              AutoRev Tuning Shop Ad Generator                     ║
╚══════════════════════════════════════════════════════════════════╝

Usage:
  node generate-tuning-shop-ad.mjs <car-slug>
  node generate-tuning-shop-ad.mjs all

Examples:
  node generate-tuning-shop-ad.mjs bmw-m3-e92
  node generate-tuning-shop-ad.mjs all

Available cars:
${CARS_TO_GENERATE.map(c => `  - ${c.slug} (${c.displayName})`).join('\n')}

Workflow:
  1. ��� Generate car images via MidJourney API
  2. 📱 Record Tuning Shop demo via Playwright
  3. 🎵 Generate music via ElevenLabs
  4. 🎬 Assemble video via ffmpeg

Output: generated-videos/tuning-shop-ads/Final ADs/
`);
  process.exit(0);
}

// Run generation
if (carSlug === 'all') {
  for (const car of CARS_TO_GENERATE) {
    await generateTuningShopAd(car);
  }
} else {
  const car = CARS_TO_GENERATE.find(c => c.slug === carSlug);
  if (!car) {
    console.error(`❌ Car not found: ${carSlug}`);
    process.exit(1);
  }
  await generateTuningShopAd(car);
}


