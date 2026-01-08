#!/usr/bin/env node
/**
 * AutoRev Music Generator using ElevenLabs Music API
 * 
 * Generates 18-second instrumental tracks for each category:
 * - Buyers: Uplifting, hopeful, inspiring
 * - Owners: Warm, nostalgic, chill
 * - Builders: Energetic, powerful, driving
 * - Cinematic: Epic, emotional, sweeping
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

// ElevenLabs API Key (from environment)
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const MUSIC_DIR = path.join(PROJECT_ROOT, 'generated-videos', 'music');

if (!ELEVENLABS_API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY not found. Add it to .env.local');
  process.exit(1);
}

// Music configurations per category (15 tracks each = 60 total)
const MUSIC_CONFIGS = {
  buyers: [
    // Existing tracks (1-3)
    { name: 'hopeful-discovery-01', prompt: 'Uplifting cinematic instrumental with hopeful piano melody and gentle strings. Building anticipation, sense of discovery and possibility. Perfect for aspirational content. No vocals, instrumental only.' },
    { name: 'inspiring-journey-02', prompt: 'Inspiring orchestral instrumental with warm synthesizers and subtle percussion. Motivational and optimistic tone, like finding something special. Clean and modern production. No vocals.' },
    { name: 'dream-realized-03', prompt: 'Emotional cinematic piano with soft strings building to a hopeful climax. Captures the feeling of achieving a dream. Elegant and sophisticated. Instrumental only, no vocals.' },
    // New tracks (4-15)
    { name: 'new-beginnings-04', prompt: 'Bright and optimistic instrumental with acoustic guitar and light orchestral elements. Fresh start energy, possibility and excitement. Warm and inviting. No vocals.' },
    { name: 'the-search-05', prompt: 'Gentle electronic ambient with soft pads and subtle rhythm. Contemplative and curious mood, like browsing and exploring options. Modern and clean. Instrumental only.' },
    { name: 'first-sight-06', prompt: 'Romantic cinematic instrumental with sweeping strings and delicate piano. Love at first sight feeling, emotional connection. Elegant and heartfelt. No vocals.' },
    { name: 'making-choices-07', prompt: 'Thoughtful piano-driven instrumental with warm ambient textures. Decision-making mood, weighing options carefully. Sophisticated and mature. Instrumental only.' },
    { name: 'almost-there-08', prompt: 'Building anticipation instrumental with gentle percussion and rising synths. Getting closer to a goal, excitement building. Hopeful energy. No vocals.' },
    { name: 'window-shopping-09', prompt: 'Light and playful instrumental with acoustic elements and soft beats. Casual browsing mood, enjoying the process. Relaxed and pleasant. Instrumental only.' },
    { name: 'the-one-10', prompt: 'Emotional orchestral swell with piano and strings. The moment of realization, finding the perfect match. Triumphant but elegant. No vocals.' },
    { name: 'dreaming-big-11', prompt: 'Aspirational cinematic instrumental with soaring melodies and lush production. Big dreams and ambitions. Inspiring and uplifting. Instrumental only.' },
    { name: 'research-mode-12', prompt: 'Focused electronic ambient with subtle rhythmic elements. Concentration and determination, doing homework. Modern and purposeful. No vocals.' },
    { name: 'wishlist-13', prompt: 'Whimsical piano instrumental with light orchestral touches. Making plans and setting goals. Optimistic and charming. Instrumental only.' },
    { name: 'future-forward-14', prompt: 'Modern synth-driven instrumental with uplifting progression. Looking ahead with excitement, future possibilities. Clean and contemporary. No vocals.' },
    { name: 'heart-wants-15', prompt: 'Emotional piano ballad with subtle string swells. Deep desire and passion, following your heart. Beautiful and sincere. Instrumental only.' },
  ],
  owners: [
    // Existing tracks (1-3)
    { name: 'morning-ritual-01', prompt: 'Warm acoustic guitar with soft ambient pads. Peaceful and satisfied mood, like a perfect morning routine. Chill lo-fi vibes with subtle warmth. No vocals, instrumental only.' },
    { name: 'pride-of-ownership-02', prompt: 'Nostalgic cinematic instrumental with mellow piano and gentle strings. Contentment and pride, like admiring something you love. Smooth and relaxed. No vocals.' },
    { name: 'sunday-drive-03', prompt: 'Laid-back acoustic instrumental with light percussion. Carefree weekend vibes, cruising without a destination. Warm and inviting tone. Instrumental only.' },
    // New tracks (4-15)
    { name: 'garage-time-04', prompt: 'Chill lo-fi beats with warm bass and soft keys. Relaxed garage sessions, quality time with your car. Mellow and satisfying. No vocals.' },
    { name: 'detail-day-05', prompt: 'Peaceful ambient instrumental with gentle piano notes. Meditative detailing mood, care and attention. Calm and focused. Instrumental only.' },
    { name: 'my-baby-06', prompt: 'Affectionate acoustic instrumental with warm tones and soft rhythm. Deep connection and love for your car. Tender and personal. No vocals.' },
    { name: 'weekend-warrior-07', prompt: 'Upbeat but relaxed instrumental with acoustic guitar and light drums. Saturday morning energy, ready for adventure. Feel-good vibes. Instrumental only.' },
    { name: 'earned-it-08', prompt: 'Satisfied cinematic instrumental with subtle triumph. The reward of hard work, enjoying what you deserve. Proud and content. No vocals.' },
    { name: 'sunset-cruise-09', prompt: 'Warm ambient instrumental with soft synths and mellow bass. Evening drive mood, golden hour feelings. Peaceful and beautiful. Instrumental only.' },
    { name: 'show-ready-10', prompt: 'Confident instrumental with smooth jazz influences. Pride in presentation, ready to show off. Classy and assured. No vocals.' },
    { name: 'memories-made-11', prompt: 'Nostalgic piano instrumental with gentle strings. Reflecting on good times, treasured memories. Emotional and warm. Instrumental only.' },
    { name: 'daily-driver-12', prompt: 'Comfortable acoustic instrumental with steady rhythm. Everyday joy, reliable companion. Familiar and reassuring. No vocals.' },
    { name: 'garage-queen-13', prompt: 'Elegant cinematic instrumental with sophisticated arrangement. Admiration and care, treating it like royalty. Refined and beautiful. Instrumental only.' },
    { name: 'road-companion-14', prompt: 'Friendly acoustic instrumental with warm production. Trusty partner on every journey. Comforting and loyal. No vocals.' },
    { name: 'pride-and-joy-15', prompt: 'Heartfelt piano and strings instrumental. Deep satisfaction and love, your prized possession. Emotional and genuine. Instrumental only.' },
  ],
  builders: [
    // Existing tracks (1-3)
    { name: 'track-day-01', prompt: 'Energetic electronic instrumental with driving synth bass and punchy drums. High-performance intensity, building power and adrenaline. Modern and aggressive but clean. No vocals.' },
    { name: 'power-unleashed-02', prompt: 'Epic cinematic rock instrumental with heavy guitars and powerful drums. Achievement and triumph, like crossing the finish line. Intense but controlled energy. No vocals.' },
    { name: 'build-complete-03', prompt: 'Dynamic electronic instrumental with rising synths and impactful drops. The satisfaction of completion and raw power. Polished production. Instrumental only.' },
    // New tracks (4-15)
    { name: 'dyno-pull-04', prompt: 'Intense electronic instrumental building to a powerful climax. Raw performance testing, numbers climbing. Adrenaline and anticipation. No vocals.' },
    { name: 'wrench-time-05', prompt: 'Focused industrial-influenced instrumental with steady rhythm. Working on the build, hands-on progress. Determined and productive. Instrumental only.' },
    { name: 'boost-life-06', prompt: 'Aggressive electronic instrumental with turbo-inspired sounds. Forced induction energy, pure power. Fast and furious. No vocals.' },
    { name: 'lap-record-07', prompt: 'Triumphant cinematic rock instrumental with victorious energy. Breaking records, achieving goals. Intense celebration. Instrumental only.' },
    { name: 'tune-session-08', prompt: 'Technical electronic instrumental with precise rhythms. Fine-tuning and optimization, chasing perfection. Focused and methodical. No vocals.' },
    { name: 'full-send-09', prompt: 'Maximum energy electronic instrumental with explosive drops. All-out commitment, no holding back. Intense and thrilling. Instrumental only.' },
    { name: 'garage-built-10', prompt: 'Gritty rock instrumental with authentic feel. DIY pride, built not bought. Raw and genuine. No vocals.' },
    { name: 'race-prep-11', prompt: 'Building tension instrumental with driving percussion. Pre-race anticipation, focused preparation. Intense and purposeful. Instrumental only.' },
    { name: 'mod-list-12', prompt: 'Progressive electronic instrumental with evolving layers. Planning and dreaming, next upgrades. Creative and ambitious. No vocals.' },
    { name: 'shake-down-13', prompt: 'Exciting electronic instrumental with testing energy. First runs with new mods, validation. Anticipation and discovery. Instrumental only.' },
    { name: 'podium-finish-14', prompt: 'Triumphant orchestral rock instrumental with celebration energy. Victory achieved, goals reached. Powerful and proud. No vocals.' },
    { name: 'never-done-15', prompt: 'Persistent electronic instrumental with continuous drive. Always improving, never satisfied. Relentless and passionate. Instrumental only.' },
  ],
  cinematic: [
    // Existing tracks (1-3)
    { name: 'mountain-pass-01', prompt: 'Sweeping orchestral cinematic instrumental with majestic strings and French horns. Breathtaking landscapes and freedom. Epic scope with emotional depth. No vocals.' },
    { name: 'golden-hour-02', prompt: 'Beautiful cinematic piano with lush string arrangement. Golden light and timeless beauty, emotional and evocative. Film score quality. Instrumental only.' },
    { name: 'pure-cinema-03', prompt: 'Grand orchestral instrumental with building intensity and emotional payoff. Premium automotive commercial quality, sophisticated and memorable. No vocals.' },
    // New tracks (4-15)
    { name: 'coastal-highway-04', prompt: 'Breezy cinematic instrumental with ocean vibes and sweeping melodies. Pacific Coast Highway feeling, freedom and beauty. Expansive and refreshing. No vocals.' },
    { name: 'night-drive-05', prompt: 'Atmospheric electronic cinematic with moody synths and urban feel. City lights at night, mysterious and cool. Stylish and modern. Instrumental only.' },
    { name: 'desert-dawn-06', prompt: 'Epic cinematic instrumental with southwestern influences. Vast desert landscapes, sunrise adventure. Grand and spiritual. No vocals.' },
    { name: 'autumn-roads-07', prompt: 'Warm orchestral instrumental with nostalgic fall feeling. Colorful foliage drives, seasonal beauty. Cozy and picturesque. Instrumental only.' },
    { name: 'canyon-carving-08', prompt: 'Dynamic cinematic instrumental with tension and release. Winding mountain roads, skillful driving. Exciting and beautiful. No vocals.' },
    { name: 'midnight-run-09', prompt: 'Dark cinematic electronic with mysterious atmosphere. Late night empty roads, solitary journey. Moody and introspective. Instrumental only.' },
    { name: 'sunrise-summit-10', prompt: 'Uplifting orchestral instrumental building to emotional peak. Reaching the top at dawn, achievement and awe. Triumphant and beautiful. No vocals.' },
    { name: 'rainy-reflections-11', prompt: 'Melancholic piano cinematic with rain ambiance. Contemplative wet weather driving, beauty in grey. Thoughtful and artistic. Instrumental only.' },
    { name: 'endless-horizon-12', prompt: 'Expansive orchestral instrumental with limitless feeling. Open road stretching forever, ultimate freedom. Grand and inspiring. No vocals.' },
    { name: 'tunnel-vision-13', prompt: 'Intense cinematic instrumental with dramatic tunnel acoustics. Focused intensity, light at the end. Powerful and purposeful. Instrumental only.' },
    { name: 'country-escape-14', prompt: 'Peaceful cinematic instrumental with pastoral beauty. Rolling hills and quiet roads, escape from city. Serene and rejuvenating. No vocals.' },
    { name: 'final-destination-15', prompt: 'Emotional orchestral crescendo with satisfying resolution. Journey complete, destination reached. Fulfilling and memorable. Instrumental only.' },
  ],
};

/**
 * Generate music using ElevenLabs Music API
 */
async function generateMusic(prompt, durationMs = 18000) {
  const endpoint = 'https://api.elevenlabs.io/v1/music';
  
  console.log(`   ⏳ Generating ${durationMs / 1000}s track...`);
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt,
      duration_seconds: durationMs / 1000,
      // Ensure instrumental only
      instrumental: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
  }

  // Response is audio binary
  const audioBuffer = await response.arrayBuffer();
  return Buffer.from(audioBuffer);
}

/**
 * Alternative: Use the compose endpoint for more control
 */
async function generateMusicCompose(prompt, durationMs = 18000) {
  const endpoint = 'https://api.elevenlabs.io/v1/music/compose';
  
  console.log(`   ⏳ Composing ${durationMs / 1000}s track...`);
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt,
      music_length_ms: durationMs,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
  }

  const audioBuffer = await response.arrayBuffer();
  return Buffer.from(audioBuffer);
}

/**
 * Generate a single track and save it
 */
async function generateAndSaveTrack(category, config) {
  const outputDir = path.join(MUSIC_DIR, category);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${config.name}.mp3`);
  
  // Skip if already exists
  if (fs.existsSync(outputPath)) {
    console.log(`   ⏭️ Skipping ${config.name} (already exists)`);
    return { success: true, skipped: true, path: outputPath };
  }

  console.log(`\n🎵 Generating: ${config.name}`);
  console.log(`   Prompt: ${config.prompt.substring(0, 80)}...`);

  try {
    const audioBuffer = await generateMusicCompose(config.prompt, 18000);
    fs.writeFileSync(outputPath, audioBuffer);
    
    const sizeKB = (audioBuffer.length / 1024).toFixed(1);
    console.log(`   ✅ Saved: ${config.name}.mp3 (${sizeKB} KB)`);
    
    return { success: true, path: outputPath, size: audioBuffer.length };
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Generate all tracks for a category
 */
async function generateCategory(category) {
  const configs = MUSIC_CONFIGS[category];
  if (!configs) {
    console.error(`Unknown category: ${category}`);
    return;
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📁 Category: ${category.toUpperCase()}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  const results = [];
  for (const config of configs) {
    const result = await generateAndSaveTrack(category, config);
    results.push({ ...result, name: config.name });
    
    // Small delay between API calls
    if (!result.skipped) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  return results;
}

/**
 * Generate all tracks for all categories
 */
async function generateAll() {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║              AUTOREV MUSIC GENERATOR - ELEVENLABS                ║
║                    18-Second Instrumental Tracks                 ║
╚══════════════════════════════════════════════════════════════════╝
`);

  const categories = Object.keys(MUSIC_CONFIGS);
  const allResults = {};

  for (const category of categories) {
    allResults[category] = await generateCategory(category);
  }

  // Summary
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 GENERATION SUMMARY`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  let totalGenerated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const [category, results] of Object.entries(allResults)) {
    const generated = results.filter(r => r.success && !r.skipped).length;
    const skipped = results.filter(r => r.skipped).length;
    const failed = results.filter(r => !r.success).length;
    
    totalGenerated += generated;
    totalSkipped += skipped;
    totalFailed += failed;

    console.log(`${category}: ${generated} generated, ${skipped} skipped, ${failed} failed`);
  }

  console.log(`\n✅ Total: ${totalGenerated} new tracks generated`);
  console.log(`⏭️ Skipped: ${totalSkipped} (already existed)`);
  if (totalFailed > 0) {
    console.log(`❌ Failed: ${totalFailed}`);
  }
  console.log(`\n📁 Music saved to: ${MUSIC_DIR}/[category]/`);
}

/**
 * List current music library status
 */
function listLibrary() {
  console.log(`\n📁 AutoRev Music Library\n`);
  
  const categories = ['buyers', 'owners', 'builders', 'cinematic'];
  
  for (const category of categories) {
    const catDir = path.join(MUSIC_DIR, category);
    let tracks = [];
    
    if (fs.existsSync(catDir)) {
      tracks = fs.readdirSync(catDir).filter(f => 
        f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.m4a')
      );
    }
    
    const icon = tracks.length > 0 ? '✅' : '⚠️';
    console.log(`${icon} ${category}: ${tracks.length} tracks`);
    tracks.forEach(t => console.log(`   - ${t}`));
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

if (command === 'all' || !command) {
  generateAll().catch(console.error);
} else if (command === 'list') {
  listLibrary();
} else if (MUSIC_CONFIGS[command]) {
  generateCategory(command).catch(console.error);
} else {
  console.log(`
AutoRev Music Generator (ElevenLabs)

Usage:
  node generate-music-elevenlabs.mjs              Generate all tracks (12 total)
  node generate-music-elevenlabs.mjs [category]   Generate tracks for one category
  node generate-music-elevenlabs.mjs list         Show current library status

Categories: buyers, owners, builders, cinematic

Each category gets 3 tracks × 18 seconds = ~1 minute of variety per category
`);
}

