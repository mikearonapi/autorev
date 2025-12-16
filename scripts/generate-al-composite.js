#!/usr/bin/env node
/**
 * Generate AutoRev AL Mascot - Composite Image (3 poses like reference)
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
// COMPOSITE PROMPT - 3 poses of same character in one image
// =============================================================================

const COMPOSITE_PROMPT = `Create a SINGLE wide image showing the SAME 3D Pixar-style character "AL" in THREE different poses side by side, like a character showcase.

CRITICAL: This must be ONE image with THREE versions of the EXACT SAME character.

CHARACTER (MUST BE IDENTICAL IN ALL 3 POSES):
- Friendly male auto mechanic, early 30s
- Short brown hair, slightly wavy, neat style
- Warm brown eyes
- Light skin tone
- Friendly smile showing teeth
- Clean-shaven
- Pixar/DreamWorks 3D animation style
- Rounded, appealing animated features

LAYOUT (LEFT TO RIGHT):
Each character is inside a frosted glass card frame with a subtle green/teal glowing border.
Small white icon floats above each card.

POSE 1 (LEFT) - "SPECS/INFO":
- Same character wearing olive/sage green casual jacket over dark t-shirt
- Holding a car part or diagnostic tool
- Confident stance, slight smile
- Icon above: computer monitor icon (represents car specs/info)

POSE 2 (CENTER) - "SHOPPING/DEALS":
- Same EXACT character wearing navy blue business suit with tie
- One hand raised with finger pointing up (explaining gesture)
- Helpful, knowledgeable expression
- Icon above: shopping cart icon (represents marketplace)
- This pose is slightly larger/more prominent

POSE 3 (RIGHT) - "TRUSTED/VERIFIED":
- Same EXACT character wearing red/orange plaid flannel shirt
- Arms crossed or thumbs up, relaxed confident pose
- Warm, trustworthy smile
- Icon above: checkmark/shield icon (represents trust/verification)

FRAME STYLING:
- Each character is in a rounded rectangle glass/frosted card
- Cards have subtle green/teal glowing border (like neon edge)
- Cards are slightly overlapping with center one in front
- Semi-transparent frosted glass effect

BACKGROUND:
- Blurred modern office/garage environment
- Warm lighting, depth of field blur
- Professional but automotive-themed
- Slightly out of focus so characters pop

STYLE:
- High quality 3D render
- Pixar/Illumination animation quality
- Consistent character model across all 3 poses
- Soft studio lighting on characters
- Premium app/marketing quality

OUTPUT:
- Wide format (16:9 or 3:1 aspect ratio)
- All 3 characters clearly visible
- Professional marketing showcase style`;

const COMPOSITE_PROMPT_V2 = `3D rendered marketing image showing THREE versions of the SAME Pixar-style character "AL" - a friendly auto mechanic mascot.

THE CHARACTER (IDENTICAL IN ALL 3):
- Male, early 30s, 3D animated Pixar style
- Brown hair, brown eyes, friendly smile
- Clean-shaven, approachable face
- Athletic build

COMPOSITION - Three glass cards side by side:

[LEFT CARD]
- Character in olive green jacket, holding tablet with car on screen
- Small monitor/screen ICON floating above the card
- Glass card with subtle green glow border

[CENTER CARD - Larger, overlapping others]  
- SAME character in navy suit with blue tie
- Finger raised in "explaining" gesture
- Shopping cart ICON floating above
- Glass card with green glow, slightly in front

[RIGHT CARD]
- SAME character in red plaid flannel shirt
- Thumbs up or arms crossed, relaxed pose
- Checkmark/verified ICON floating above
- Glass card with green glow border

IMPORTANT DETAILS:
- All 3 are the EXACT same person in different outfits
- Frosted glass card frames with green/teal neon-like borders
- Small white icons float above each card
- Blurred warm office/automotive background
- Professional 3D render quality
- Wide 16:9 format showing all 3 cards`;

async function generateImage(prompt, outputPath, aspectRatio = '16:9') {
  if (!GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY not set');
  }
  
  console.log('🍌 Generating composite AL mascot image...');
  
  // Try the Pro model for better quality
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
    console.log(`📝 Model notes: ${textPart.text.substring(0, 300)}...`);
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
  console.log('\n🤖 Generating AutoRev AL Composite Image (3 poses)\n');
  console.log('='.repeat(60));
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  
  // Generate 2 variations
  const prompts = [
    { name: 'composite-v1', prompt: COMPOSITE_PROMPT },
    { name: 'composite-v2', prompt: COMPOSITE_PROMPT_V2 },
  ];
  
  for (let i = 0; i < prompts.length; i++) {
    const { name, prompt } = prompts[i];
    const filename = `al-${name}-${timestamp}.png`;
    const outputPath = path.join(OUTPUT_DIR, filename);
    
    console.log(`\n--- Generating ${name} ---`);
    
    try {
      await generateImage(prompt, outputPath);
    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
    }
    
    if (i < prompts.length - 1) {
      console.log('\n⏳ Waiting 3 seconds...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ GENERATION COMPLETE');
  console.log(`📁 Output: ${OUTPUT_DIR}`);
}

main();
