#!/usr/bin/env node
/**
 * AutoRev AL Mascot Generation Script
 * 
 * Generates the "AL" mascot - the friendly AI mechanic assistant for AutoRev.
 * AL = AutoRev AI AL (the chat assistant mascot)
 * 
 * Usage:
 *   node scripts/generate-al-mascot.js generate          # Generate the mascot
 *   node scripts/generate-al-mascot.js prompt            # Show the prompt
 *   node scripts/generate-al-mascot.js generate-multiple 3  # Generate multiple variations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'generated-images', 'mascot');

// Ensure directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// =============================================================================
// AL MASCOT PROMPT - AutoRev AI Assistant
// =============================================================================

/**
 * AL Mascot Design Brief:
 * - Name: AL (AutoRev AI AL)
 * - Role: Friendly AI chat assistant for automotive enthusiasts
 * - Appearance: Professional mechanic with warm, approachable demeanor
 * - Style: Digital illustration, professional but friendly
 * - Feature: Yellow/gold circular ring frame (matches brand accent color)
 * - Use case: Chat icon, AI assistant button, bottom-right corner widget
 */

const AL_MASCOT_PROMPT = `Create a professional digital illustration of a friendly male mechanic named "AL" for an automotive enthusiast platform.

CHARACTER DESIGN:
- Male mechanic, early-to-mid 30s, warm and genuinely friendly smile showing teeth
- SANDY BLONDE / LIGHT BROWN hair - short, slightly wavy/textured, natural messy style
- BRIGHT BLUE EYES - striking, friendly, engaging
- Light/fair skin complexion with slight natural warmth
- Clean-shaven face with friendly, approachable expression
- Strong jawline, natural masculine features
- Athletic build, professional posture

OUTFIT - MECHANIC VIBES:
- Gray or blue mechanic work shirt (short sleeve)
- Dark navy or charcoal mechanic's work apron or coverall top
- Could show tool pocket on apron
- The outfit should clearly read as "automotive mechanic"
- Clean but professional work attire
- No visible logos or text

COMPOSITION:
- Bust portrait (head, shoulders, and upper chest visible)
- Subject centered in frame
- Arms crossed in a confident, friendly pose OR one hand near chin thoughtfully
- Looking directly at camera/viewer with a warm, genuine smile
- Slight head tilt for approachability

BACKGROUND AND FRAME:
- Soft, warm cream/off-white background (#faf8f5 or similar)
- IMPORTANT: A thin, elegant GOLDEN/AMBER ring (#d4a04a) encircling the subject
- The ring should be a perfect circle, like a profile picture frame
- Ring has subtle shadow/depth effect
- About 15-20% padding between the subject and the ring edge

STYLE:
- High-quality digital illustration
- Slightly stylized but realistic proportions
- Warm, inviting color palette
- Professional headshot quality
- Soft, natural lighting from the front
- Gentle shadows for depth
- Clean, polished finish

COLOR PALETTE:
- Background: Warm cream (#faf8f5)
- Ring/Frame: Golden amber (#d4a04a) - matches AutoRev brand accent
- Skin: Light/fair with natural warmth
- Hair: Sandy blonde / light brown
- Eyes: Bright blue
- Clothing: Gray/blue work shirt, dark apron

MOOD:
- Trustworthy and knowledgeable
- Genuinely friendly and warm
- Professional automotive expert
- The kind of guy you'd want to ask for car advice
- Confident but approachable, like a helpful neighbor

OUTPUT:
- Square format (1:1 aspect ratio)
- High resolution
- Clean, crisp rendering
- Ready to use as a chat assistant avatar/icon`;

// Alternative style variations
const AL_PROMPTS = {
  default: AL_MASCOT_PROMPT,
  
  mechanic: `Create a professional digital illustration of a friendly male auto mechanic named "AL" for an automotive enthusiast platform.

CHARACTER:
- Male mechanic, early-to-mid 30s, warm genuine smile showing teeth
- SANDY BLONDE / LIGHT BROWN short hair, slightly wavy and natural
- BRIGHT BLUE EYES - friendly and engaging
- Light/fair skin complexion
- Clean-shaven, approachable expression
- Athletic build

OUTFIT - FULL MECHANIC LOOK:
- Classic blue or gray mechanic work shirt (short sleeve button-up style)
- Dark navy mechanic's coveralls or work apron
- Visible tool pockets or wrench holder
- Looks like a professional auto shop mechanic
- Clean but working attire

COMPOSITION:
- Bust portrait, centered in frame
- Arms crossed confidently OR holding a wrench casually
- Direct eye contact, warm smile
- Slight head tilt for friendliness

BACKGROUND AND FRAME:
- Soft warm cream background (#faf8f5)
- Perfect circular GOLDEN/AMBER ring (#d4a04a) framing the subject
- Ring is elegant and prominent
- Clean, professional look

STYLE:
- High-quality digital illustration
- Slightly stylized but realistic
- Warm, inviting colors
- Professional portrait lighting

The mechanic outfit is KEY - this should clearly look like an automotive professional.`,

  coveralls: `Create a professional digital illustration of a friendly male auto mechanic named "AL".

CHARACTER:
- Male, early-to-mid 30s, big friendly smile showing teeth
- Sandy blonde / light brown short hair, slightly messy natural style
- Bright blue eyes, warm and engaging
- Light/fair complexion
- Clean-shaven, genuinely approachable

OUTFIT:
- Classic dark blue or charcoal mechanic COVERALLS / jumpsuit
- Rolled up sleeves showing forearms
- Maybe an oil rag tucked in pocket
- Automotive workshop professional look
- Could have a name patch area (but no text)

COMPOSITION:
- Bust portrait (head, shoulders, chest)
- Arms crossed confidently
- Looking at viewer with genuine warm smile
- Centered in frame

BACKGROUND:
- Soft cream/off-white background
- Elegant GOLDEN circle ring frame (#d4a04a) around subject
- Ring is clearly visible and decorative
- Premium avatar styling

STYLE:
- Digital illustration, slightly stylized
- Warm color palette
- Clean, polished finish
- Professional quality

This should look like a trustworthy auto mechanic you'd want advice from.`,

  workshop: `Create a professional digital illustration of a friendly male mechanic named "AL" for an automotive AI assistant.

CHARACTER:
- Male mechanic, early-to-mid 30s
- Sandy blonde short hair, natural texture
- Bright blue eyes, friendly gaze
- Light skin, clean-shaven
- Warm, genuine smile showing teeth
- Athletic/fit build

OUTFIT - MECHANIC STYLE:
- Gray or blue mechanic polo or work shirt
- Dark work apron with tool pocket
- Could be wiping hands on shop rag
- Professional auto shop attire

POSE:
- Bust portrait
- Arms crossed OR one hand up in friendly wave/gesture
- Confident but welcoming posture
- Direct eye contact with viewer

BACKGROUND:
- Warm cream background (#faf8f5)
- GOLDEN ring frame (#d4a04a) encircling portrait
- Elegant, premium avatar style
- Clean and professional

STYLE:
- High-quality digital illustration
- Warm, inviting aesthetic
- Slightly stylized but realistic proportions
- Soft natural lighting

Make AL look like the friendly mechanic everyone wishes they knew.`,

  digital: `Create a stylized digital avatar of a friendly male auto mechanic named "AL" for an AI chat assistant.

CHARACTER:
- Friendly male mechanic, early-to-mid 30s
- Sandy blonde / light brown hair, short and natural
- Bright blue eyes
- Light/fair skin
- Big genuine smile, approachable
- Arms crossed confidently

OUTFIT:
- Blue or gray mechanic work shirt
- Dark work apron or coveralls
- Clearly reads as "automotive mechanic"

STYLE DIRECTION:
- More stylized/illustrated look (not photorealistic)
- Clean vector-like quality
- Bold, confident lines
- Modern app icon aesthetic
- Pixar/Disney-adjacent style

BACKGROUND:
- Soft warm background (cream/beige)
- Bold golden circle ring frame surrounding the character (#d4a04a)
- The ring should be prominent and decorative
- Clean, minimal, professional

COLOR PALETTE:
- Warm neutrals for background
- Golden amber (#d4a04a) for the ring frame
- Light/fair skin tones
- Sandy blonde hair
- Blue eyes
- Blue/gray mechanic clothing

This should look like a premium app mascot - friendly, trustworthy, automotive expert.`,
};

// =============================================================================
// Image Generation using Google Nano Banana Pro
// =============================================================================

async function generateImageWithNanoBananaPro(prompt, outputPath) {
  if (!GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY not set in .env.local');
  }
  
  console.log('🍌 Generating AL mascot with Nano Banana Pro...');
  
  // Use the best model for character generation
  const modelName = 'gemini-2.0-flash-exp';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GOOGLE_AI_API_KEY}`;
  
  const body = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
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
    throw new Error(`API error (${response.status}): ${errorText}`);
  }
  
  const result = await response.json();
  
  const candidates = result.candidates || [];
  if (candidates.length === 0) {
    throw new Error('No candidates in response');
  }
  
  const parts = candidates[0].content?.parts || [];
  const imagePart = parts.find(p => p.inlineData);
  const textPart = parts.find(p => p.text);
  
  if (textPart) {
    console.log(`\n📝 Model notes: ${textPart.text.substring(0, 300)}...`);
  }
  
  if (!imagePart) {
    throw new Error('No image in response. The model may have refused.');
  }
  
  const imageData = imagePart.inlineData.data;
  const mimeType = imagePart.inlineData.mimeType || 'image/png';
  
  let ext = '.png';
  if (mimeType === 'image/jpeg') ext = '.jpg';
  if (mimeType === 'image/webp') ext = '.webp';
  
  const buffer = Buffer.from(imageData, 'base64');
  const finalPath = outputPath.replace(/\.[^.]+$/, ext);
  
  fs.writeFileSync(finalPath, buffer);
  console.log(`\n✅ Image saved to: ${finalPath}`);
  
  return finalPath;
}

// =============================================================================
// Commands
// =============================================================================

function showPrompt(style = 'default') {
  const prompt = AL_PROMPTS[style] || AL_MASCOT_PROMPT;
  console.log('\n🤖 AL MASCOT GENERATION PROMPT:\n');
  console.log('='.repeat(60));
  console.log(prompt);
  console.log('='.repeat(60));
  console.log(`\nStyle: ${style}`);
  console.log('Available styles: default, mechanic, coveralls, workshop, digital');
}

async function generateMascot(style = 'default', index = 1) {
  const prompt = AL_PROMPTS[style] || AL_MASCOT_PROMPT;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `al-mascot-${style}-${index}-${timestamp}.png`;
  const outputPath = path.join(OUTPUT_DIR, filename);
  
  console.log('\n🤖 AutoRev AL Mascot Generation');
  console.log('='.repeat(60));
  console.log(`Style: ${style}`);
  console.log(`Output: ${outputPath}`);
  console.log('='.repeat(60));
  
  try {
    const finalPath = await generateImageWithNanoBananaPro(prompt, outputPath);
    
    console.log('\n✅ AL MASCOT GENERATED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log(`📁 File: ${finalPath}`);
    console.log('\n📌 Next steps:');
    console.log('   1. Open the image to review');
    console.log('   2. If you like it, copy to public/images/al-mascot.png');
    console.log('   3. Create an AIAssistantButton component using the image');
    console.log('\n💡 To generate more variations:');
    console.log(`   node scripts/generate-al-mascot.js generate ${style} 2`);
    console.log(`   node scripts/generate-al-mascot.js generate younger`);
    console.log(`   node scripts/generate-al-mascot.js generate digital`);
    
    return finalPath;
  } catch (error) {
    console.error(`\n❌ Generation failed: ${error.message}`);
    return null;
  }
}

async function generateMultiple(style = 'default', count = 3) {
  console.log(`\n🤖 Generating ${count} AL mascot variations (${style} style)...\n`);
  
  const results = [];
  for (let i = 1; i <= count; i++) {
    console.log(`\n--- Variation ${i}/${count} ---`);
    const result = await generateMascot(style, i);
    results.push(result);
    
    if (i < count) {
      console.log('\n⏳ Waiting 3 seconds before next generation...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  
  console.log('\n📊 GENERATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Generated ${results.filter(r => r).length}/${count} mascots`);
  console.log(`📁 Location: ${OUTPUT_DIR}`);
  
  return results;
}

async function generateAllStyles() {
  console.log('\n🤖 Generating AL mascot in ALL styles...\n');
  
  const styles = ['default', 'younger', 'experienced', 'digital'];
  const results = [];
  
  for (const style of styles) {
    console.log(`\n=== Generating ${style.toUpperCase()} style ===`);
    const result = await generateMascot(style, 1);
    results.push({ style, path: result });
    
    if (style !== styles[styles.length - 1]) {
      console.log('\n⏳ Waiting 3 seconds before next style...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  
  console.log('\n📊 ALL STYLES GENERATED');
  console.log('='.repeat(60));
  results.forEach(r => {
    console.log(`   ${r.style}: ${r.path || 'FAILED'}`);
  });
  
  return results;
}

// =============================================================================
// Main
// =============================================================================

const command = process.argv[2];
const style = process.argv[3] || 'default';
const countOrIndex = parseInt(process.argv[4], 10) || 1;

switch (command) {
  case 'prompt':
    showPrompt(style);
    break;
    
  case 'generate':
    generateMascot(style, countOrIndex);
    break;
    
  case 'generate-multiple':
    generateMultiple(style, countOrIndex);
    break;
    
  case 'generate-all':
    generateAllStyles();
    break;
    
  default:
    console.log(`
🤖 AutoRev AL Mascot Generation Script

AL = AutoRev AI AL - The friendly AI mechanic chat assistant

Character: Sandy blonde hair, blue eyes, friendly smile, mechanic outfit

Usage:
  node scripts/generate-al-mascot.js <command> [style] [count]

Commands:
  prompt [style]                    Show the generation prompt
  generate [style] [index]          Generate a single mascot
  generate-multiple [style] [count] Generate multiple variations
  generate-all                      Generate one of each style

Styles:
  default      Standard friendly mechanic (work shirt + apron)
  mechanic     Full mechanic look (button-up + coveralls/apron)
  coveralls    Classic coveralls/jumpsuit style
  workshop     Workshop setting, polo/work shirt
  digital      More stylized/illustrated avatar look

Examples:
  node scripts/generate-al-mascot.js prompt
  node scripts/generate-al-mascot.js generate
  node scripts/generate-al-mascot.js generate mechanic 1
  node scripts/generate-al-mascot.js generate coveralls
  node scripts/generate-al-mascot.js generate digital
  node scripts/generate-al-mascot.js generate-multiple default 3
  node scripts/generate-al-mascot.js generate-all

Output:
  Images are saved to: generated-images/mascot/
`);
}

