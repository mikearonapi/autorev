#!/usr/bin/env node
/**
 * Generate HIGH QUALITY AutoRev AL Mascot
 * Uses Pro model with detailed prompts for maximum quality
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

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
        if (key && value) process.env[key] = value;
      }
    }
  }
}

loadEnv();

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'generated-images', 'mascot-pixar');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// =============================================================================
// HIGH QUALITY PROMPT - Based on the classic mechanic style user chose
// =============================================================================

const HQ_PROMPT = `Ultra high quality 3D rendered Pixar-style character portrait of "AL" - a friendly automotive AI mechanic mascot.

CHARACTER DETAILS:
- Friendly male auto mechanic, early 30s
- Short brown hair with natural wave and texture, neatly styled
- Warm brown eyes with lifelike reflections and depth
- Light skin tone with subtle natural color variations
- Confident, genuine smile showing teeth
- Clean-shaven with smooth skin
- Strong but friendly jawline
- Pixar/DreamWorks animation quality - appealing proportions

OUTFIT:
- Classic navy blue mechanic work shirt (short sleeve, button-up style)
- White undershirt visible at collar
- Name badge area on chest (blank, no text)
- Chest pocket with subtle stitching details
- Professional automotive technician look
- Clean, crisp fabric with realistic folds and shadows

POSE & PROP:
- Bust portrait (head, shoulders, upper chest)
- Holding a shiny chrome DOUBLE-ENDED WRENCH in right hand
- Wrench held up near shoulder, angled naturally
- Relaxed, confident posture
- Direct eye contact with viewer
- Warm, welcoming smile - like a trusted friend who knows cars

LIGHTING & RENDERING:
- Professional studio lighting setup
- Soft key light from front-left
- Subtle fill light from right
- Gentle rim light for separation from background
- Subsurface scattering on skin for realistic glow
- Realistic reflections on wrench chrome
- Soft shadows under chin and on clothing

BACKGROUND:
- Clean gradient from light blue-gray at top to soft white at bottom
- Professional studio backdrop feel
- No distractions - focus on character

QUALITY SPECIFICATIONS:
- ULTRA HIGH DEFINITION rendering
- 8K quality textures
- Cinema-quality 3D render
- Pixar/DreamWorks feature film quality
- Sharp details on face, hair, clothing
- Realistic material properties
- Professional mascot/branding quality

OUTPUT:
- Square format (1:1 aspect ratio)
- Maximum resolution
- Clean, crisp edges
- Ready for professional use`;

async function generateWithPro(prompt, outputPath) {
  if (!GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY not set');
  }
  
  console.log('🍌 Generating with Gemini Pro model for maximum quality...');
  
  // Use the Pro image model for highest quality
  const modelName = 'gemini-2.0-flash-exp';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GOOGLE_AI_API_KEY}`;
  
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    }
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }
  
  const result = await response.json();
  const candidates = result.candidates || [];
  if (candidates.length === 0) throw new Error('No candidates');
  
  const parts = candidates[0].content?.parts || [];
  const imagePart = parts.find(p => p.inlineData);
  const textPart = parts.find(p => p.text);
  
  if (textPart) {
    console.log(`📝 Model: ${textPart.text.substring(0, 200)}...`);
  }
  
  if (!imagePart) throw new Error('No image in response');
  
  const imageData = imagePart.inlineData.data;
  const mimeType = imagePart.inlineData.mimeType || 'image/png';
  
  let ext = '.png';
  if (mimeType === 'image/jpeg') ext = '.jpg';
  if (mimeType === 'image/webp') ext = '.webp';
  
  const buffer = Buffer.from(imageData, 'base64');
  const finalPath = outputPath.replace(/\.[^.]+$/, ext);
  
  // Log file size for quality reference
  const fileSizeKB = Math.round(buffer.length / 1024);
  console.log(`📦 File size: ${fileSizeKB} KB`);
  
  fs.writeFileSync(finalPath, buffer);
  console.log(`✅ Saved: ${finalPath}`);
  
  return finalPath;
}

async function main() {
  console.log('\n🔧 Generating HIGH QUALITY AL Mascot\n');
  console.log('='.repeat(60));
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  
  // Generate 3 HQ variations
  for (let i = 1; i <= 3; i++) {
    const filename = `al-hq-classic-${i}-${timestamp}.png`;
    const outputPath = path.join(OUTPUT_DIR, filename);
    
    console.log(`\n--- High Quality Version ${i}/3 ---`);
    
    try {
      await generateWithPro(HQ_PROMPT, outputPath);
    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
    }
    
    if (i < 3) {
      console.log('\n⏳ Waiting 3 seconds...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ HIGH QUALITY GENERATION COMPLETE!');
}

main();
