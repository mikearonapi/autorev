#!/usr/bin/env node
/**
 * Generate a custom advertisement music track using ElevenLabs
 * 
 * Usage:
 *   node scripts/generate-ad-music.mjs
 *   node scripts/generate-ad-music.mjs --duration 30 --style "epic cinematic"
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

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'generated-videos', 'ad-music');

if (!ELEVENLABS_API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY not found. Add it to .env.local');
  process.exit(1);
}

// Parse CLI arguments
const args = process.argv.slice(2);
let duration = 25; // Default 25 seconds
let style = 'upbeat';
let outputName = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--duration' && args[i + 1]) {
    duration = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--style' && args[i + 1]) {
    style = args[i + 1];
    i++;
  } else if (args[i] === '--name' && args[i + 1]) {
    outputName = args[i + 1];
    i++;
  }
}

// Style presets for advertisement music
const STYLE_PRESETS = {
  upbeat: 'Upbeat, energetic, and modern instrumental music with driving rhythm, punchy drums, and bright synths. Perfect for exciting product advertisements and promotional videos. High energy, positive vibes, catchy melody. Commercial quality production. No vocals, instrumental only.',
  
  inspiring: 'Inspiring and uplifting cinematic instrumental with soaring strings and piano. Emotional crescendo building hope and possibility. Premium brand commercial quality. Motivational and aspirational. No vocals, instrumental only.',
  
  epic: 'Epic cinematic orchestral instrumental with powerful brass, dramatic strings, and impactful percussion. Luxury automotive commercial quality. Grand, prestigious, and memorable. No vocals, instrumental only.',
  
  modern: 'Contemporary electronic instrumental with clean production, subtle bass, and modern aesthetic. Tech-forward and sleek, perfect for innovation-focused ads. Sophisticated and cutting-edge. No vocals, instrumental only.',
  
  energetic: 'High-energy electronic rock instrumental with driving guitars, powerful drums, and intense synths. Action-packed and thrilling, perfect for sports or automotive ads. Adrenaline-pumping but polished. No vocals.',
  
  premium: 'Sophisticated and elegant instrumental with piano, strings, and subtle electronic elements. Luxury brand quality, refined and prestigious. Appeals to discerning audience. Clean and polished. No vocals, instrumental only.',
  
  fun: 'Fun and playful instrumental with bouncy rhythm, bright tones, and infectious energy. Cheerful and engaging, perfect for lifestyle ads. Makes you want to move. No vocals, instrumental only.',
  
  dynamic: 'Dynamic and versatile instrumental with building energy and memorable hook. Transitions smoothly from subtle to powerful. Perfect for storytelling ads. Professional commercial quality. No vocals.',
  
  trailerrock: 'Trailer rock instrumental with massive drums, heavy guitar riffs, and orchestral hits. Epic and cinematic like a blockbuster movie trailer. Powerful stomp rhythm with distorted guitars building intensity. Triumphant and heroic energy, big anthemic feel. Perfect for action sports car commercial. Stadium rock meets Hollywood trailer. No vocals, instrumental only.',
  
  firestarter: 'Aggressive high-energy rock instrumental with pounding drums, intense electric guitar riffs, and driving bass. Raw power and unstoppable momentum. Fierce and rebellious energy with heavy distortion and relentless rhythm. Perfect for high-octane automotive commercial. Adrenaline-fueled intensity. No vocals, instrumental only.'
};

// Get the prompt - use preset or custom style
const prompt = STYLE_PRESETS[style.toLowerCase()] || 
  `${style}. Perfect for video advertisement. Commercial quality production. No vocals, instrumental only.`;

/**
 * Generate music using ElevenLabs Music Compose API
 */
async function generateMusic(prompt, durationSeconds) {
  const endpoint = 'https://api.elevenlabs.io/v1/music/compose';
  
  console.log(`\n⏳ Generating ${durationSeconds}-second track...`);
  console.log(`   Style: ${style}`);
  console.log(`   Prompt: ${prompt.substring(0, 100)}...`);
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt,
      music_length_ms: durationSeconds * 1000,
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
 * Main execution
 */
async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║            AUTOREV AD MUSIC GENERATOR - ELEVENLABS               ║
║                Custom Advertisement Tracks                        ║
╚══════════════════════════════════════════════════════════════════╝
`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Generate filename
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = outputName || `ad-${style}-${duration}s-${timestamp}`;
  const outputPath = path.join(OUTPUT_DIR, `${filename}.mp3`);

  try {
    const audioBuffer = await generateMusic(prompt, duration);
    fs.writeFileSync(outputPath, audioBuffer);
    
    const sizeKB = (audioBuffer.length / 1024).toFixed(1);
    
    console.log(`\n✅ Success!`);
    console.log(`   📁 File: ${outputPath}`);
    console.log(`   📏 Duration: ${duration} seconds`);
    console.log(`   💾 Size: ${sizeKB} KB`);
    console.log(`\n🎬 Ready for your video advertisement!`);
    
  } catch (error) {
    console.error(`\n❌ Generation failed: ${error.message}`);
    process.exit(1);
  }
}

// Show help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
AutoRev Ad Music Generator (ElevenLabs)

Usage:
  node scripts/generate-ad-music.mjs [options]

Options:
  --duration <seconds>  Track length (default: 25)
  --style <style>       Music style preset or custom description
  --name <filename>     Output filename (without extension)

Style Presets:
  upbeat      Energetic, positive, driving rhythm
  inspiring   Uplifting, emotional, aspirational
  epic        Grand orchestral, cinematic
  modern      Contemporary, tech-forward, sleek
  energetic   High-energy, action-packed
  premium     Sophisticated, elegant, luxury
  fun         Playful, bouncy, cheerful
  dynamic     Versatile, building energy
  trailerrock Epic trailer rock with massive drums & guitar riffs
  firestarter Aggressive high-energy rock with raw power & intensity

Examples:
  node scripts/generate-ad-music.mjs
  node scripts/generate-ad-music.mjs --duration 30 --style epic
  node scripts/generate-ad-music.mjs --duration 25 --style "upbeat electronic with driving beat"
  node scripts/generate-ad-music.mjs --name my-ad-track --style modern
`);
  process.exit(0);
}

main().catch(console.error);



