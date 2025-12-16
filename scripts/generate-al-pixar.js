#!/usr/bin/env node
/**
 * Generate AutoRev AL Mascot - 3D Pixar Style
 * Creates a 3D rendered avatar similar to the reference image
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load environment variables
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
// 3D PIXAR STYLE PROMPTS - Like the reference image
// =============================================================================

const PIXAR_PROMPTS = {
  mechanic_holding_wrench: `3D rendered character avatar in Pixar/Nintendo style for an automotive AI assistant named "AL".

CHARACTER DESIGN:
- Friendly male auto mechanic character, stylized 3D render
- Short brown hair with some texture, slightly messy
- Warm brown eyes, friendly expression
- Light skin tone
- Slightly exaggerated friendly smile showing teeth
- Rounded, approachable facial features (Pixar-style proportions)
- Athletic build

OUTFIT:
- Dark navy blue mechanic coveralls/jumpsuit
- Visible chest pocket
- Rolled up sleeves showing forearms
- Clean but working attire
- Maybe a slight oil smudge for authenticity

POSE & PROPS:
- Bust portrait (head, shoulders, upper torso)
- Holding a shiny chrome wrench in one hand near shoulder
- Confident, helpful stance
- Direct eye contact with viewer, warm welcoming smile

STYLE:
- HIGH QUALITY 3D RENDER - NOT 2D illustration
- Pixar/DreamWorks animation style
- Nintendo Mii-meets-Pixar aesthetic
- Soft studio lighting
- Subtle shadows for depth
- Clean, polished 3D surfaces
- Soft gradient background (light gray to white)

COMPOSITION:
- Square format (1:1)
- Subject fills most of frame
- Clean, simple background
- Professional avatar/icon quality`,

  tech_with_tablet: `3D rendered character avatar in Pixar/Nintendo style for an automotive AI assistant named "AL".

CHARACTER DESIGN:
- Friendly male auto tech character, stylized 3D render
- Short brown hair, neat but with character
- Warm brown eyes, intelligent expression
- Light skin tone
- Genuine smile, approachable
- Rounded, animated-style facial features
- Fit build

OUTFIT:
- Gray polo shirt with collar
- Dark work apron over shirt
- Modern automotive professional look
- Clean and polished

POSE & PROPS:
- Bust portrait
- Holding a tablet/digital device showing car diagnostics
- One hand pointing up thoughtfully (like explaining something)
- Helpful, knowledgeable pose
- Eye contact with viewer

STYLE:
- HIGH QUALITY 3D RENDER - like Pixar or DreamWorks characters
- NOT flat illustration - actual 3D depth and volume
- Soft, diffused lighting
- Subsurface scattering on skin
- Clean gradient background (warm cream/white)
- Professional mascot quality

COMPOSITION:
- Square format (1:1)
- Centered subject
- Clean minimal background
- Avatar/app icon ready`,

  thumbs_up_friendly: `3D rendered character avatar in Pixar/Nintendo style for an automotive AI assistant named "AL".

CHARACTER DESIGN:
- Friendly male mechanic character, 3D animated style
- Short brown hair, slightly wavy
- Friendly brown eyes
- Light skin with natural warmth
- Big welcoming smile showing teeth
- Pixar-style proportions - slightly larger head, expressive features
- Athletic build

OUTFIT:
- Classic blue mechanic work shirt (short sleeve button-up)
- Dark navy work apron with tool pocket
- "AL" could be embroidered on shirt (optional)
- Professional auto shop attire

POSE & PROPS:
- Bust portrait
- Giving a confident thumbs up toward the viewer
- Warm, encouraging expression
- Like he just finished helping you with your car question
- Direct eye contact

STYLE:
- 3D RENDERED CHARACTER - not illustration
- Pixar/Illumination animation quality
- Soft rim lighting
- Smooth 3D surfaces
- Warm cream/beige gradient background
- Premium app mascot aesthetic

COMPOSITION:
- Square format (1:1)
- Character fills frame nicely
- Minimal clean background
- Perfect for chat avatar icon`,
};

async function generateImage(prompt, outputPath) {
  if (!GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY not set');
  }
  
  console.log('🍌 Generating 3D Pixar-style AL mascot...');
  
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
    console.log(`📝 Model notes: ${textPart.text.substring(0, 200)}...`);
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
  console.log(`✅ Image saved: ${finalPath}`);
  
  return finalPath;
}

async function main() {
  console.log('\n🤖 Generating 3 AutoRev AL Pixar-Style Mascots\n');
  console.log('='.repeat(60));
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const styles = Object.entries(PIXAR_PROMPTS);
  
  for (let i = 0; i < styles.length; i++) {
    const [name, prompt] = styles[i];
    const filename = `al-pixar-${name}-${timestamp}.png`;
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
  console.log('✅ GENERATION COMPLETE');
  console.log(`📁 Output: ${OUTPUT_DIR}`);
}

main();
