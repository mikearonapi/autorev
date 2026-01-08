#!/usr/bin/env node
/**
 * AutoRev Daily Video Generator
 * 
 * Creates 3 short reels per day using 3 Veo 3.1 credits (1 per reel)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * CREATIVE DIRECTION REQUIREMENTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * FORMAT:
 * ✓ VERTICAL 9:16 - Native mobile format, never requires phone rotation
 * ✓ 8 seconds per clip - Veo's generation length
 * 
 * VISUAL QUALITY:
 * ✓ PHOTOREALISTIC - Real automotive footage aesthetic, not CGI
 * ✓ Natural lighting - No overly processed or artificial looks
 * 
 * AUDIO (ASMR QUALITY):
 * ✓ SFX ONLY - Engine sounds, shifting, door mechanisms, ambient
 * ✓ NO voiceover - No "this is the one" or any spoken words
 * ✓ NO dialogue - No conversations or speech
 * ✓ NO text overlays - Pure visual/audio experience
 * 
 * PHYSICS & MOVEMENT:
 * ✓ REALISTIC ONLY - No glitchy movements, no 360 spins
 * ✓ Smooth transitions - Natural car behavior
 * ✓ Controlled speed - Cruising, not aggressive racing (unless builders)
 * ✓ Gentle stops - No dramatic braking
 * 
 * EMOTIONAL CONNECTION:
 * ✓ First 2 seconds = HOOK that stops the scroll
 * ✓ Strike emotional chord with car enthusiasts
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * REEL STRUCTURE (~12-13 seconds)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ├── Video (8s): THE HOOK - attention-grabbing, emotional connection
 * ├── Music (12s): ElevenLabs instrumental @ 10% under SFX, 2s fade
 * └── Closing (4-5s): Branded CTA with own audio
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * PERSONA STRATEGIES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * BUYERS:   Discovery, anticipation, "what if" moments
 *           Emotion: Curiosity → Desire → "I can see myself"
 * 
 * OWNERS:   Rituals, pride, personal connection
 *           Emotion: Comfort → Satisfaction → "This is mine"
 * 
 * BUILDERS: Performance, achievement, validation
 *           Emotion: Focus → Intensity → Pride
 * 
 * CINEMATIC: Beauty, journey, epic landscapes
 *            Emotion: Wonder → Freedom → Peace
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
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
      let value = valueParts.join('=').trim();
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key.trim()] = value;
    }
  });
}

const API_KEY = process.env.GOOGLE_AI_API_KEY;
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'generated-videos');
const CLIPS_DIR = path.join(OUTPUT_DIR, 'clips');
const REELS_DIR = path.join(OUTPUT_DIR, 'reels');
const CLOSING_DIR = path.join(OUTPUT_DIR, 'closings');
const MUSIC_DIR = path.join(OUTPUT_DIR, 'music');
const TEMP_DIR = path.join(OUTPUT_DIR, '.temp');

// ============================================================================
// CAR DATABASE - Real cars from AutoRev
// ============================================================================
const CARS = [
  { name: 'Porsche 911 GT3', color: 'Guards Red', style: 'track weapon' },
  { name: 'Porsche Cayman GT4', color: 'Miami Blue', style: 'balanced sports car' },
  { name: 'BMW M3 Competition', color: 'Isle of Man Green', style: 'sports sedan' },
  { name: 'Toyota GR Supra', color: 'Renaissance Red', style: 'Japanese sports car' },
  { name: 'Mazda MX-5 Miata', color: 'Soul Red Crystal', style: 'lightweight roadster' },
  { name: 'Chevrolet Corvette C8', color: 'Rapid Blue', style: 'mid-engine American supercar' },
  { name: 'Ford Mustang GT', color: 'Grabber Blue', style: 'American muscle' },
  { name: 'Nissan GT-R', color: 'Bayside Blue', style: 'Japanese supercar' },
  { name: 'Audi RS6 Avant', color: 'Nardo Gray', style: 'super wagon' },
  { name: 'Mercedes-AMG GT', color: 'AMG Green Hell Magno', style: 'German grand tourer' },
  { name: 'Lamborghini Huracán', color: 'Verde Mantis', style: 'Italian supercar' },
  { name: 'McLaren 720S', color: 'Papaya Spark', style: 'British hypercar' },
  { name: 'Ferrari 488 GTB', color: 'Rosso Corsa', style: 'Italian prancing horse' },
  { name: 'Alfa Romeo Giulia Quadrifoglio', color: 'Competizione Red', style: 'Italian sports sedan' },
  { name: 'Subaru WRX STI', color: 'World Rally Blue', style: 'rally-bred AWD' },
];

// ============================================================================
// PERSONA CONFIGURATIONS
// ============================================================================
const PERSONAS = {
  buyers: {
    name: 'Researching Buyer',
    themes: ['discovery', 'first encounter', 'dream car reveal', 'showroom moment'],
    musicMood: 'uplifting hopeful piano with gentle strings, inspiring and aspirational',
    closingFile: 'CLOSING-BUYERS.mp4',
  },
  owners: {
    name: 'Proud Owner', 
    themes: ['morning ritual', 'garage pride', 'weekend drive', 'detail obsession'],
    musicMood: 'warm nostalgic acoustic guitar, satisfied and peaceful',
    closingFile: 'CLOSING-OWNERS.mp4',
  },
  builders: {
    name: 'The Builder',
    themes: ['track day glory', 'modification reveal', 'performance upgrade', 'dyno pull'],
    musicMood: 'driving electronic beat with building intensity, powerful and energetic',
    closingFile: 'CLOSING-BUILDERS.mp4',
  },
  cinematic: {
    name: 'Cinematic',
    themes: ['mountain pass', 'coastal highway', 'city night', 'golden hour'],
    musicMood: 'epic orchestral with sweeping strings, cinematic and emotional',
    closingFile: 'CLOSING-CINEMATIC.mp4',
  },
};

// ============================================================================
// VIDEO A TEMPLATES - THE HOOK (First 8 seconds)
// 
// CREATIVE DIRECTION REQUIREMENTS:
// ✓ VERTICAL 9:16 native format - composed for mobile viewing
// ✓ PORTRAIT COMPOSITION - car fills HEIGHT of frame, NOT width
// ✓ PHOTOREALISTIC - real automotive footage aesthetic
// ✓ SFX ONLY - ASMR-quality engine, mechanical, ambient sounds
// ✓ NO voiceover, NO dialogue, NO text overlays
// ✓ REALISTIC PHYSICS - smooth, natural car movements only
// ✓ EMOTIONAL - connect viewer to the car experience
//
// ⚠️ CRITICAL: Prompts must describe TALL/VERTICAL compositions
//    - Front/rear angles where car is tall in frame
//    - Close-ups that fill vertical space
//    - Avoid wide landscape shots that create letterboxing
// ============================================================================
const VIDEO_A_TEMPLATES = {
  
  // BUYERS: Discovery, anticipation, first encounter magic
  buyers: [
    `VERTICAL 9:16 PORTRAIT FORMAT - Fill HEIGHT of frame. No black bars.

Photorealistic automotive footage. Real camera work, natural lighting.

SCENE: First encounter with a {color} {car} in a clean, well-lit space.

SHOTS:
0-2s: HOOK - Extreme close-up of {car} headlight illuminating. Camera racks focus.
2-5s: FRONT VIEW - {color} {car} revealed head-on, grille to roof fills vertical frame.
5-8s: LOW ANGLE looking UP at {color} {car} - dramatic, aspirational. Slow push in.

AUDIO (NO VOICEOVER):
- Soft ambient room tone
- Engine idle rumble
- Subtle exhaust note

PORTRAIT composition. Photorealistic. Natural lighting.`,

    `VERTICAL 9:16 PORTRAIT FORMAT - Compose TALL. No black bars.

Documentary-style authenticity. Natural light.

SCENE: Someone discovering a {color} {car} for the first time.

SHOTS:
0-2s: HOOK - Hand gently touches {color} {car} fender, camera looking UP along body.
2-5s: Slow walk around the {color} {car} - appreciating every curve.
5-8s: REAR VIEW of {car} - tail lights and exhaust tips fill vertical frame. Engine revs gently.

AUDIO (NO VOICEOVER):
- Footsteps on concrete
- Gentle engine idle
- Light exhaust note

PORTRAIT composition. Photorealistic.`,

    `VERTICAL 9:16 PORTRAIT FORMAT - All shots TALL. No letterboxing.

Premium showroom aesthetic. Soft, even lighting.

SCENE: The {color} {car} presented as art in a minimal space.

SHOTS:
0-2s: HOOK - {color} {car} badge/emblem revealed by light sweep. Close-up.
2-5s: LOW ANGLE - Full {color} {car} towers in vertical frame. Push in slowly.
5-8s: Side profile of {color} {car} - dramatic lighting highlights curves.

AUDIO (NO VOICEOVER):
- Deep, quiet ambiance
- Subtle engine idle
- Atmosphere

PORTRAIT composition. Photorealistic. Premium feel.`,
  ],

  // OWNERS: Pride, ritual, personal connection
  owners: [
    `VERTICAL 9:16 PORTRAIT FORMAT - Frame TALL. No black bars.

Authentic, personal footage. Golden hour morning light.

SCENE: An owner's morning ritual with their {color} {car}.

SHOTS:
0-2s: HOOK - Garage door rises, {color} {car} revealed FRONT-ON. Morning light streaming in.
2-5s: Owner approaches {color} {car}, hand runs along the hood appreciatively.
5-8s: Engine starts with a satisfying rumble. Exhaust note fills the garage.

AUDIO (NO VOICEOVER):
- Garage door mechanism
- Footsteps on concrete  
- Engine start and idle

PORTRAIT composition. Photorealistic. Pride of ownership.`,

    `VERTICAL 9:16 PORTRAIT FORMAT - Compose TALL. No black bars.

Weekend detailing aesthetic. Outdoor, natural light.

SCENE: Owner caring for their {color} {car} with attention.

SHOTS:
0-2s: HOOK - Macro of water droplets on {color} paint - texture and reflections.
2-5s: Owner carefully wiping the side of {car} - car fills background.
5-8s: Step back to admire the gleaming {color} {car}. Sun catches the curves.

AUDIO (NO VOICEOVER):
- Water spray
- Soft cloth on paint
- Birds, light breeze
PORTRAIT composition. Photorealistic. Weekend vibes.`,

    `VERTICAL 9:16 PORTRAIT FORMAT - All shots TALL. No letterboxing.

Garage sanctuary aesthetic. Personal space.

SCENE: The {color} {car} as centerpiece of owner's personal garage.

SHOTS:
0-2s: HOOK - Light switch clicks, {color} {car} illuminated FRONT-ON. Dramatic reveal.
2-5s: Hand running along {color} {car} fender appreciatively.
5-8s: Engine starts with a deep, satisfying rumble. Exhaust note resonates in garage.

AUDIO (NO VOICEOVER):
- Light switch click
- Hand on paint
- Engine startup and idle

PORTRAIT composition. Photorealistic. Garage pride.`,
  ],

  // BUILDERS: Performance, achievement, mechanical passion
  builders: [
    `VERTICAL 9:16 PORTRAIT FORMAT - Frame TALL. No black bars.

Motorsport documentary quality. Track environment.

SCENE: The {color} {car} in action at a track day.

SHOTS:
0-2s: HOOK - {color} {car} approaches HEAD-ON, growing larger, filling vertical frame.
2-5s: Tachometer close-up - needle climbing through rev range.
5-8s: {color} {car} flies past camera at speed. Engine screaming.

AUDIO (NO VOICEOVER):
- Engine note through RPM range
- Transmission whine
- Tires gripping

PORTRAIT composition. Photorealistic. Track action.`,

    `VERTICAL 9:16 PORTRAIT FORMAT - Compose TALL. No black bars.

Garage/shop build aesthetic. Raw authenticity.

SCENE: Builder revealing work done on their {color} {car}.

SHOTS:
0-2s: HOOK - Hood rises revealing engine bay of {color} {car}. Power.
2-5s: Engine bay details - turbo, intercooler, polished components.
5-8s: Engine fires up with aggressive idle. Builder nods with satisfaction.

AUDIO (NO VOICEOVER):
- Hood latch release
- Engine bay ticking/settling
- Aggressive startup

PORTRAIT composition. Photorealistic. Build pride.`,

    `VERTICAL 9:16 PORTRAIT FORMAT - Frame TALL. No black bars.

Performance testing aesthetic. Technical focus.

SCENE: {color} {car} on the dyno, power being measured.

SHOTS:
0-2s: HOOK - Tachometer climbing - gauge fills frame.
2-5s: Exhaust tips glowing, heat shimmer visible.
5-8s: Peak power hit - engine screaming, dyno numbers climbing.

AUDIO (NO VOICEOVER):
- Engine note climbing
- Dyno whine
- Peak power exhaust note

PORTRAIT composition. Photorealistic. Power.`,
  ],

  // CINEMATIC: Beauty, journey, emotional landscapes
  cinematic: [
    `VERTICAL 9:16 PORTRAIT FORMAT - Frame TALL. No black bars.

Premium automotive commercial quality. Gimbal + drone.

SCENE: The {color} {car} on a mountain road at golden hour.

SHOTS:
0-2s: HOOK - Drone descends toward {color} {car} - car grows to fill vertical frame.
2-5s: LOW ANGLE - {color} {car} cruises past, golden light catching paint.
5-8s: FRONT VIEW - {color} {car} approaches camera. Majestic. Powerful.

AUDIO (NO VOICEOVER):
- Wind
- Engine cruising note
- Nature ambient

PORTRAIT composition. Photorealistic. Cinematic beauty.`,

    `VERTICAL 9:16 PORTRAIT FORMAT - Compose TALL. No letterboxing.

Film-quality golden hour cinematography.

SCENE: The {color} {car} at rest in beautiful golden light.

SHOTS:
0-2s: HOOK - Lens flare clears, {color} {car} revealed - fills vertical frame.
2-5s: LOW ANGLE - {color} {car} towers in frame against golden sky.
5-8s: Close-up of curves catching the light. Paintwork perfection.

AUDIO (NO VOICEOVER):
- Gentle wind
- Distant birds
- Peaceful engine idle
PORTRAIT composition. Photorealistic. Golden hour beauty.`,

    `VERTICAL 9:16 PORTRAIT FORMAT - All shots TALL. No black bars.

Urban night aesthetic. Reflections and mood.

SCENE: The {color} {car} in city at night.

SHOTS:
0-2s: HOOK - {color} {car} headlights pierce darkness, FRONT VIEW fills frame.
2-5s: Neon reflections dance across the {color} paint. City lights.
5-8s: {color} {car} pulls away smoothly into the night. Tail lights glowing.

AUDIO (NO VOICEOVER):
- Soft engine idle
- Rain on paint
- Engine revving smoothly

PORTRAIT composition. Photorealistic. Night vibes.`,
  ],
};

// ============================================================================
// MUSIC LIBRARY
// ============================================================================

/**
 * Get a random music track from the library for a category
 */
function getRandomMusicTrack(category) {
  const categoryDir = path.join(MUSIC_DIR, category);
  
  if (!fs.existsSync(categoryDir)) {
    console.log(`   ⚠️ Music folder not found: ${categoryDir}`);
    return null;
  }
  
  const tracks = fs.readdirSync(categoryDir)
    .filter(f => f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.m4a'));
  
  if (tracks.length === 0) {
    console.log(`   ⚠️ No music tracks in ${category}/`);
    return null;
  }
  
  const selected = tracks[Math.floor(Math.random() * tracks.length)];
  console.log(`   🎵 Selected: ${selected}`);
  return path.join(categoryDir, selected);
}

/**
 * Check if music library has tracks for all categories
 */
function checkMusicLibrary() {
  const categories = ['buyers', 'owners', 'builders', 'cinematic'];
  const status = {};
  
  for (const cat of categories) {
    const catDir = path.join(MUSIC_DIR, cat);
    if (fs.existsSync(catDir)) {
      const tracks = fs.readdirSync(catDir)
        .filter(f => f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.m4a'));
      status[cat] = tracks.length;
    } else {
      status[cat] = 0;
    }
  }
  
  return status;
}

// ============================================================================
// VIDEO GENERATION
// ============================================================================

/**
 * Generate a video using Veo 3.1
 */
async function generateVideo(prompt, outputPath, options = {}) {
  const { fast = false } = options;
  const model = fast ? 'veo-3.1-fast-generate-preview' : 'veo-3.1-generate-preview';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predictLongRunning?key=${API_KEY}`;

  console.log(`   ⏳ Generating video (${fast ? 'fast' : 'standard'} model)...`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        aspectRatio: '9:16',
      },
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`Veo API error: ${data.error.message}`);
  }

  if (!data.name) {
    throw new Error(`No operation name returned: ${JSON.stringify(data)}`);
  }

  // Poll for completion
  const operationName = data.name;
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max

  while (attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 5000)); // 5 second intervals
    attempts++;

    const pollResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${API_KEY}`
    );
    const pollData = await pollResponse.json();

    if (pollData.done) {
      // Check both response formats (API changed structure)
      const videoData = pollData.response?.generateVideoResponse?.generatedSamples?.[0]?.video ||
                        pollData.response?.generatedVideos?.[0]?.video;
      
      if (videoData) {
        let videoBuffer;
        
        // Check if video is a URI (new format) or base64 (old format)
        if (typeof videoData === 'object' && videoData.uri) {
          // Download from URI
          const downloadResponse = await fetch(videoData.uri, {
            headers: { 'x-goog-api-key': API_KEY }
          });
          if (!downloadResponse.ok) {
            throw new Error(`Failed to download video: ${downloadResponse.status}`);
          }
          videoBuffer = Buffer.from(await downloadResponse.arrayBuffer());
        } else if (typeof videoData === 'string') {
          // Base64 encoded video (old format)
          videoBuffer = Buffer.from(videoData, 'base64');
        } else {
          throw new Error(`Unknown video format: ${typeof videoData}`);
        }
        
        fs.writeFileSync(outputPath, videoBuffer);
        console.log(`   ✅ Saved: ${path.basename(outputPath)}`);
        return true;
      } else if (pollData.error) {
        throw new Error(`Generation failed: ${pollData.error.message}`);
      } else {
        console.log('   ⚠️ No video in response:', JSON.stringify(pollData).substring(0, 200));
      }
    }

    process.stdout.write(`   ⏳ (${attempts * 5}s) `);
  }

  throw new Error('Generation timed out after 5 minutes');
}


// ============================================================================
// FFMPEG OPERATIONS
// ============================================================================

/**
 * Check if ffmpeg is available
 */
function checkFFmpeg() {
  try {
    execSync('which ffmpeg', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get video duration
 */
function getVideoDuration(filePath) {
  try {
    const output = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      { encoding: 'utf-8' }
    );
    return parseFloat(output);
  } catch {
    return null;
  }
}

/**
 * Trim music to target duration with fade out
 */
async function trimMusicWithFade(inputAudio, outputAudio, targetDuration, fadeOutDuration = 2) {
  return new Promise((resolve, reject) => {
    // Trim to target duration, add fade in (0.5s) and fade out
    const ffmpeg = spawn('ffmpeg', [
      '-i', inputAudio,
      '-t', String(targetDuration),
      '-af', `afade=t=in:st=0:d=0.5,afade=t=out:st=${targetDuration - fadeOutDuration}:d=${fadeOutDuration}`,
      '-acodec', 'aac',
      '-b:a', '192k',
      '-y',
      outputAudio,
    ]);

    let stderr = '';
    ffmpeg.stderr.on('data', data => { stderr += data.toString(); });

    ffmpeg.on('close', code => {
      if (code === 0) resolve(true);
      else reject(new Error(`Trim music failed: ${stderr.slice(-300)}`));
    });
  });
}

/**
 * Concatenate videos A + B
 */
async function concatenateVideos(videoA, videoB, outputPath) {
  const listFile = path.join(path.dirname(outputPath), '.concat-list.txt');
  fs.writeFileSync(listFile, `file '${videoA}'\nfile '${videoB}'`);

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-f', 'concat',
      '-safe', '0',
      '-i', listFile,
      '-c', 'copy',
      '-y',
      outputPath,
    ]);

    ffmpeg.on('close', code => {
      fs.unlinkSync(listFile);
      if (code === 0) resolve(true);
      else reject(new Error(`Concatenate failed with code ${code}`));
    });
  });
}

/**
 * Mix music under video (keeping original SFX)
 */
async function mixAudioUnderVideo(videoPath, musicPath, outputPath, musicVolume = 0.25) {
  return new Promise((resolve, reject) => {
    // Mix: video audio at full volume + music at lower volume
    const ffmpeg = spawn('ffmpeg', [
      '-i', videoPath,
      '-i', musicPath,
      '-filter_complex',
      `[0:a]volume=1.0[sfx];[1:a]volume=${musicVolume}[music];[sfx][music]amix=inputs=2:duration=first:dropout_transition=2[aout]`,
      '-map', '0:v',
      '-map', '[aout]',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-y',
      outputPath,
    ]);

    let stderr = '';
    ffmpeg.stderr.on('data', data => { stderr += data.toString(); });

    ffmpeg.on('close', code => {
      if (code === 0) resolve(true);
      else reject(new Error(`Mix audio failed: ${stderr.slice(-500)}`));
    });
  });
}

/**
 * Add closing video with its original audio
 */
async function appendClosing(mainVideo, closingVideo, outputPath) {
  // First, we need to re-encode to ensure compatibility
  const tempMain = mainVideo.replace('.mp4', '-temp.mp4');
  const tempClosing = closingVideo.replace('.mp4', '-temp-closing.mp4');

  // Re-encode main to consistent format
  await new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', mainVideo,
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
      '-c:a', 'aac', '-b:a', '192k',
      '-r', '24',
      '-y', tempMain,
    ]);
    ffmpeg.on('close', code => code === 0 ? resolve(true) : reject(new Error('Re-encode main failed')));
  });

  // Re-encode closing to match
  await new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', closingVideo,
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
      '-c:a', 'aac', '-b:a', '192k',
      '-vf', 'scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2',
      '-r', '24',
      '-y', tempClosing,
    ]);
    ffmpeg.on('close', code => code === 0 ? resolve(true) : reject(new Error('Re-encode closing failed')));
  });

  // Concatenate
  const listFile = path.join(path.dirname(outputPath), '.final-concat.txt');
  fs.writeFileSync(listFile, `file '${tempMain}'\nfile '${tempClosing}'`);

  await new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-f', 'concat',
      '-safe', '0',
      '-i', listFile,
      '-c', 'copy',
      '-y', outputPath,
    ]);
    ffmpeg.on('close', code => {
      fs.unlinkSync(listFile);
      try { fs.unlinkSync(tempMain); } catch {}
      try { fs.unlinkSync(tempClosing); } catch {}
      if (code === 0) resolve(true);
      else reject(new Error('Final concat failed'));
    });
  });

  return true;
}

// ============================================================================
// MAIN GENERATION FLOW
// ============================================================================

/**
 * Generate one complete reel
 */
async function generateReel(reelNumber, persona, car, date) {
  const personaConfig = PERSONAS[persona];
  const safeCarName = car.name.replace(/\s+/g, '-').toLowerCase();
  
  // New folder structure:
  // - clips/[category]/ for raw Veo videos (A and B)
  // - reels/[category]/ for final combined reels
  // - .temp/ for intermediate files (auto-cleaned)
  const clipsDir = path.join(CLIPS_DIR, persona);
  const reelsDir = path.join(REELS_DIR, persona);
  const tempDir = TEMP_DIR;
  
  // Ensure directories exist
  [clipsDir, reelsDir, tempDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const prefix = `${String(reelNumber).padStart(2, '0')}-${safeCarName}`;
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🎬 REEL ${reelNumber}: ${car.color} ${car.name}`);
  console.log(`   Persona: ${personaConfig.name} | Theme: ${personaConfig.themes[reelNumber % personaConfig.themes.length]}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  const paths = {
    video: path.join(clipsDir, `${prefix}.mp4`),
    musicTrimmed: path.join(tempDir, `${prefix}-music-12s.aac`),
    withMusic: path.join(tempDir, `${prefix}-with-music.mp4`),
    final: path.join(reelsDir, `REEL-${prefix}.mp4`),
  };

  try {
    // Get persona-specific templates
    const templates = VIDEO_A_TEMPLATES[persona] || VIDEO_A_TEMPLATES.cinematic;
    
    // Select random template from this persona's set
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Build prompt with car details
    const carDescription = `${car.color} ${car.name}`;
    const prompt = template
      .replace(/{car}/g, car.name)
      .replace(/{color}/g, car.color);

    // 1. Generate single 8-second video (THE HOOK)
    console.log(`\n📹 Generating 8s clip...`);
    console.log(`   Template: ${persona}-style`);
    console.log(`   Car: ${carDescription}`);
    
    await generateVideo(prompt, paths.video, { fast: true });

    // 2. Get music from library (NO VEO CREDIT NEEDED!)
    console.log(`\n🎵 Selecting music from library...`);
    const musicTrack = getRandomMusicTrack(persona);

    // 3. Process with ffmpeg
    console.log(`\n🔧 Processing with ffmpeg...`);

    // Trim/prepare music to 12s with fade (8s clip + ~5s closing = ~13s total)
    let hasMusicTrack = false;
    if (musicTrack) {
      console.log(`   Preparing music (trim to 12s + 2s fade)...`);
      await trimMusicWithFade(musicTrack, paths.musicTrimmed, 12, 2);
      hasMusicTrack = true;
    } else {
      console.log(`   ⚠️ No music track - video will have SFX only`);
    }

    // Mix music under video at very low volume (10%) - SFX should be prominent
    let videoForClosing = paths.video;
    if (hasMusicTrack) {
      console.log(`   Mixing music under video SFX (10% volume - SFX prominent)...`);
      await mixAudioUnderVideo(paths.video, paths.musicTrimmed, paths.withMusic, 0.10);
      videoForClosing = paths.withMusic;
    }

    // Add closing
    const closingPath = path.join(CLOSING_DIR, personaConfig.closingFile);
    if (fs.existsSync(closingPath)) {
      console.log(`   Appending closing sequence...`);
      await appendClosing(videoForClosing, closingPath, paths.final);
    } else {
      console.log(`   ⚠️ No closing video found, using clip as final`);
      fs.copyFileSync(videoForClosing, paths.final);
    }

    // Get final duration
    const finalDuration = getVideoDuration(paths.final);
    console.log(`\n✅ REEL COMPLETE: ${path.basename(paths.final)}`);
    console.log(`   Duration: ${finalDuration?.toFixed(1) || '~13'}s`);
    console.log(`   Location: ${paths.final}`);

    // Cleanup intermediate files
    [paths.musicTrimmed, paths.withMusic].forEach(f => {
      try { fs.unlinkSync(f); } catch {}
    });

    return { success: true, path: paths.final, duration: finalDuration };

  } catch (error) {
    console.error(`\n❌ REEL FAILED: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Run the daily generation
 */
async function runDailyGeneration() {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                    AUTOREV DAILY VIDEO GENERATOR                  ║
║                      Veo 3.1 • 3 Reels • 3 Credits               ║
╚══════════════════════════════════════════════════════════════════╝
`);

  if (!API_KEY) {
    console.error('❌ GOOGLE_AI_API_KEY not found in environment');
    process.exit(1);
  }

  if (!checkFFmpeg()) {
    console.error('❌ ffmpeg not found. Install with: brew install ffmpeg');
    process.exit(1);
  }

  // Check music library
  console.log('🎵 Music Library Status:');
  const musicStatus = checkMusicLibrary();
  let totalTracks = 0;
  for (const [cat, count] of Object.entries(musicStatus)) {
    const icon = count > 0 ? '✅' : '⚠️';
    console.log(`   ${icon} ${cat}: ${count} tracks`);
    totalTracks += count;
  }
  
  if (totalTracks === 0) {
    console.log('\n⚠️  No music tracks found! Videos will have SFX only.');
    console.log('   Add tracks to: generated-videos/music/[category]/');
    console.log('   (Continuing without background music...)\n');
  }

  const date = new Date();
  const personaKeys = Object.keys(PERSONAS);
  const results = [];

  // Generate 3 reels with different personas/cars (1 Veo credit each)
  const REELS_PER_DAY = 3;
  
  // Ensure variety - try to use different personas for each reel
  const shuffledPersonas = [...personaKeys].sort(() => Math.random() - 0.5);
  const usedCars = new Set();
  
  for (let i = 0; i < REELS_PER_DAY; i++) {
    // Rotate through personas for variety
    const persona = shuffledPersonas[i % shuffledPersonas.length];
    
    // Pick a car we haven't used yet today (if possible)
    let car;
    const availableCars = CARS.filter(c => !usedCars.has(c.name));
    if (availableCars.length > 0) {
      car = availableCars[Math.floor(Math.random() * availableCars.length)];
    } else {
      car = CARS[Math.floor(Math.random() * CARS.length)];
    }
    usedCars.add(car.name);
    
    const result = await generateReel(i + 1, persona, car, date);
    results.push({ reelNumber: i + 1, persona, car: car.name, ...result });

    // Small delay between reels to avoid rate limiting
    if (i < REELS_PER_DAY - 1) {
      console.log(`\n⏳ Waiting 15s before next reel...`);
      await new Promise(r => setTimeout(r, 15000));
    }
  }

  // Summary
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                         GENERATION SUMMARY                        ║
╚══════════════════════════════════════════════════════════════════╝
`);
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successful: ${successful.length}`);
  successful.forEach(r => {
    console.log(`   • Reel ${r.reelNumber}: ${r.car} (${r.persona}) - ${r.duration?.toFixed(1) || '~20'}s`);
    console.log(`     ${r.path}`);
  });

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`);
    failed.forEach(r => {
      console.log(`   • Reel ${r.reelNumber}: ${r.car} - ${r.error}`);
    });
  }

  console.log(`\n📊 Credits used: ${successful.length} (${successful.length} reels × 1 credit each)`);
  console.log(`📅 Remaining daily quota: ~${10 - successful.length} credits\n`);

  // Cleanup temp directory
  try {
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
  } catch {}

  return results;
}

// ============================================================================
// CLI
// ============================================================================

const args = process.argv.slice(2);
const command = args[0];

if (command === 'generate' || !command) {
  runDailyGeneration().catch(console.error);
} else if (command === 'test') {
  // Test with a single reel
  console.log('🧪 Test mode: Generating 1 reel...');
  const car = CARS[0];
  generateReel(1, 'cinematic', car, new Date()).then(console.log).catch(console.error);
} else {
  console.log(`
AutoRev Daily Video Generator

Usage:
  node generate-daily-videos.mjs           Generate 3 daily reels (3 Veo credits)
  node generate-daily-videos.mjs test      Test with 1 reel (1 Veo credit)

Output Structure:
  generated-videos/
  ├── clips/[category]/    Raw Veo videos (8s clips)
  ├── reels/[category]/    Final combined reels
  ├── closings/            Closing video files
  └── music/[category]/    Music library (60 tracks)

Each reel = Video (8s) + Music (12s @ 10% vol) + Closing (4-5s)
Total: ~12-13 seconds per reel, ready for Instagram/Facebook
`);
}

