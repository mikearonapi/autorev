#!/usr/bin/env node
/**
 * Generate AutoRev AL Mascot - Single Character with Wrench
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
// SINGLE CHARACTER PROMPTS - AL with wrench
// =============================================================================

const PROMPTS = {
  mechanic_classic: `3D rendered Pixar-style character portrait of "AL" - a friendly automotive AI mechanic mascot.

CHARACTER:
- Friendly male auto mechanic, early 30s
- Short brown hair, slightly wavy and neat
- Warm brown eyes with friendly expression
- Light skin tone with natural warmth
- Confident smile showing teeth
- Clean-shaven, approachable
- Pixar/DreamWorks animation quality 3D render

OUTFIT:
- Classic navy blue mechanic coveralls/jumpsuit
- Sleeves rolled up showing forearms
- Clean but professional work attire
- Maybe a small chest pocket

POSE & PROP:
- Bust portrait (head, shoulders, upper chest)
- Holding a shiny chrome WRENCH in one hand
- Wrench resting on shoulder or held confidently
- Direct eye contact with viewer
- Warm, welcoming expression - like a trusted mechanic friend

STYLE:
- HIGH QUALITY 3D RENDER - Pixar animation quality
- Soft studio lighting
- Subtle shadows for depth
- Clean, simple gradient background (light gray to white)
- Professional mascot/avatar quality
- Square format (1:1)`,

  mechanic_apron: `3D Pixar-style character avatar of "AL" - an automotive AI assistant mascot.

CHARACTER:
- Friendly male mechanic, early 30s
- Brown hair, neat with slight texture
- Brown eyes, genuine friendly gaze
- Light skin
- Big welcoming smile
- 3D animated style like Pixar or DreamWorks

OUTFIT:
- Blue or gray mechanic work shirt (collared)
- Dark work apron over the shirt
- Professional auto shop look
- Clean and polished

POSE & PROP:
- Upper body portrait
- Holding a chrome WRENCH confidently
- Could have wrench over shoulder or in hand near chest
- Arms showing competence and friendliness
- Looking at camera with warm smile

BACKGROUND:
- Simple clean gradient (cream/white)
- Soft, professional
- No distractions

STYLE:
- Premium 3D render quality
- Pixar-level character design
- Soft lighting, subtle shadows
- Square format for avatar use
- App mascot quality`,

  mechanic_confident: `3D rendered character mascot "AL" for an automotive enthusiast app.

CHARACTER DESIGN:
- Male auto mechanic, early 30s, friendly and confident
- Short brown hair with natural wave
- Expressive brown eyes
- Light complexion
- Warm genuine smile showing teeth
- Strong but friendly features
- Pixar/Nintendo animation style - appealing 3D proportions

OUTFIT:
- Navy blue mechanic jumpsuit/coveralls
- Name badge area (no text needed)
- Professional automotive technician look
- Rolled sleeves showing capable forearms

KEY ELEMENT - THE WRENCH:
- Character is HOLDING a large chrome wrench
- Wrench is prominent and visible
- Either resting on shoulder, or held across chest, or in one hand
- The wrench represents automotive expertise

EXPRESSION:
- Confident but approachable
- "I've got this" energy
- Trustworthy expert you'd want working on your car
- Direct eye contact, friendly smile

COMPOSITION:
- Square format (1:1)
- Bust/upper body portrait
- Clean simple background (soft white/cream gradient)
- Character fills frame nicely
- Perfect for app icon or chat avatar

RENDER QUALITY:
- High-end 3D animation quality
- Soft rim lighting
- Subsurface scattering on skin
- Clean, polished surfaces
- Professional mascot finish`
};

async function generateImage(prompt, outputPath) {
  if (!GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY not set');
  }
  
  console.log('🍌 Generating AL mascot...');
  
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
    console.log(`📝 Model: ${textPart.text.substring(0, 150)}...`);
  }
  
  if (!imagePart) throw new Error('No image in response');
  
  const imageData = imagePart.inlineData.data;
  const mimeType = imagePart.inlineData.mimeType || 'image/png';
  
  let ext = '.png';
  if (mimeType === 'image/jpeg') ext = '.jpg';
  if (mimeType === 'image/webp') ext = '.webp';
  
  const buffer = Buffer.from(imageData, 'base64');
  const finalPath = outputPath.replace(/\.[^.]+$/, ext);
  
  fs.writeFileSync(finalPath, buffer);
  console.log(`✅ Saved: ${finalPath}`);
  
  return finalPath;
}

async function main() {
  console.log('\n🔧 Generating AL - Single Character with Wrench\n');
  console.log('='.repeat(60));
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const styles = Object.entries(PROMPTS);
  
  for (let i = 0; i < styles.length; i++) {
    const [name, prompt] = styles[i];
    const filename = `al-wrench-${name}-${timestamp}.png`;
    const outputPath = path.join(OUTPUT_DIR, filename);
    
    console.log(`\n--- ${i + 1}/3: ${name} ---`);
    
    try {
      await generateImage(prompt, outputPath);
    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
    }
    
    if (i < styles.length - 1) {
      console.log('\n⏳ Waiting 3 seconds...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ DONE! Opening images...');
}

main();
