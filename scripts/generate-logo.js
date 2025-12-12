#!/usr/bin/env node
/**
 * AutoRev Logo Generation Script
 * 
 * Generates logo options for the AutoRev brand using Google Nano Banana Pro.
 * 
 * Usage:
 *   node scripts/generate-logo.js generate          # Generate the logo
 *   node scripts/generate-logo.js prompt            # Show the prompt
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
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'generated-images', 'logo');

// Ensure directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// =============================================================================
// LOGO PROMPT - AutoRev Brand
// =============================================================================

/**
 * AutoRev Logo Design Brief:
 * - Brand: AutoRev (Auto + Revelation/Revolution)
 * - Tagline: "Find What Drives You"
 * - Values: Discovery, guidance, truth, automotive passion
 * - Style: Simple, minimalist, modern
 * - Feature: Tachometer/rev gauge element
 * - Use case: Header logo (small, needs to work at 32x32px)
 */

const LOGO_PROMPT = `Design a simple, minimalist logo icon for "AutoRev" - an automotive enthusiast platform.

BRAND CONTEXT:
- AutoRev = Auto + Revelation (discovering the perfect car)
- "Rev" also references engine RPM/tachometer
- Tagline: "Find What Drives You"
- Values: Discovery, guidance, honest advice, automotive passion

DESIGN REQUIREMENTS:
- Simple, clean, minimalist design that works at small sizes (32x32px)
- MUST include a stylized tachometer/rev gauge element
- Integrate a stylized letter "A" into the center of the gauge
- The gauge needle should point toward the "redline" (upper right area)
- Use a bold, confident aesthetic
- Icon-only design (NO wordmark)

CRITICAL - BACKGROUND:
- PURE WHITE BACKGROUND ONLY
- DO NOT add any colored background shape
- DO NOT add rounded rectangles, squares, or circles behind the icon
- The icon should float on the white background
- Just the tachometer icon itself, nothing behind it

STYLE DIRECTION:
- Modern, tech-forward aesthetic
- Clean geometric shapes
- Semi-circular or circular gauge outline
- A bold needle/indicator pointing to high RPM (upper right)
- Letter "A" integrated into the gauge center
- Think of line-art style logos

COLOR PALETTE:
- Primary: Dark navy blue (#1a3a52) for the gauge and "A"
- Accent: Gold/amber (#d4a04a) for the needle - matches site accent color
- 2 colors only, flat design

OUTPUT:
- Square format, icon centered
- White/blank background
- Professional quality, vector-style line art
- NO gradients, NO shadows, NO background shapes
- Clean, crisp edges

Reference style: Simple line-art app icons like Strava, fitness apps - just the icon, no background box.`;

// Alternative prompts for different styles
const LOGO_PROMPTS = {
  tachometer: LOGO_PROMPT,
  
  compass: `Design a simple, minimalist logo icon for "AutoRev" - an automotive guidance platform.

BRAND CONTEXT:
- AutoRev helps people find their perfect car
- "Find What Drives You" is the tagline
- Values: Guidance, discovery, direction

DESIGN REQUIREMENTS:
- Simple compass or direction indicator merged with automotive styling
- Could show a stylized steering wheel with compass needle
- OR a road/path forming a compass shape
- Clean, geometric, minimal design
- Works at 32x32px
- Icon only, NO text

COLORS:
- Deep blue (#1a4d6e) primary
- Red accent (#e94560)
- 2-3 colors max, flat design`,

  abstract_a: `Design a minimal logo icon for "AutoRev" automotive platform.

REQUIREMENTS:
- Stylized letter "A" that suggests motion/speed
- Could incorporate a gauge needle or road element
- Very simple, works at small sizes
- Modern, clean aesthetic
- NO text besides the stylized A shape

COLORS:
- Dark blue/charcoal base
- Red accent for motion/speed element
- Flat design, no gradients`,
};

// =============================================================================
// Image Generation using Google Nano Banana Pro
// =============================================================================

async function generateLogoWithNanoBanana(prompt, outputPath) {
  if (!GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY not set in .env.local');
  }
  
  console.log('🍌 Generating logo with Nano Banana Pro...');
  
  // Use gemini-2.0-flash-exp for image generation
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
    console.log(`\n📝 Model notes: ${textPart.text.substring(0, 200)}...`);
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
  console.log(`\n✅ Logo saved to: ${finalPath}`);
  
  return finalPath;
}

// =============================================================================
// Commands
// =============================================================================

function showPrompt(style = 'tachometer') {
  const prompt = LOGO_PROMPTS[style] || LOGO_PROMPT;
  console.log('\n📝 LOGO GENERATION PROMPT:\n');
  console.log('='.repeat(60));
  console.log(prompt);
  console.log('='.repeat(60));
  console.log(`\nStyle: ${style}`);
  console.log('Available styles: tachometer, compass, abstract_a');
}

async function generateLogo(style = 'tachometer', index = 1) {
  const prompt = LOGO_PROMPTS[style] || LOGO_PROMPT;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `autorev-logo-${style}-${index}-${timestamp}.png`;
  const outputPath = path.join(OUTPUT_DIR, filename);
  
  console.log('\n🎨 AutoRev Logo Generation');
  console.log('='.repeat(60));
  console.log(`Style: ${style}`);
  console.log(`Output: ${outputPath}`);
  console.log('='.repeat(60));
  
  try {
    const finalPath = await generateLogoWithNanoBanana(prompt, outputPath);
    
    console.log('\n✅ LOGO GENERATED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log(`📁 File: ${finalPath}`);
    console.log('\n📌 Next steps:');
    console.log('   1. Open the image to review');
    console.log('   2. If you like it, copy to public/images/logo.png');
    console.log('   3. Update Header.jsx to use the image');
    console.log('\n💡 To generate more variations:');
    console.log(`   node scripts/generate-logo.js generate ${style} 2`);
    console.log(`   node scripts/generate-logo.js generate compass`);
    
    return finalPath;
  } catch (error) {
    console.error(`\n❌ Generation failed: ${error.message}`);
    return null;
  }
}

async function generateMultiple(style = 'tachometer', count = 3) {
  console.log(`\n🎨 Generating ${count} logo variations (${style} style)...\n`);
  
  const results = [];
  for (let i = 1; i <= count; i++) {
    console.log(`\n--- Variation ${i}/${count} ---`);
    const result = await generateLogo(style, i);
    results.push(result);
    
    if (i < count) {
      console.log('\n⏳ Waiting 3 seconds before next generation...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  
  console.log('\n📊 GENERATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Generated ${results.filter(r => r).length}/${count} logos`);
  console.log(`📁 Location: ${OUTPUT_DIR}`);
  
  return results;
}

// =============================================================================
// Main
// =============================================================================

const command = process.argv[2];
const style = process.argv[3] || 'tachometer';
const countOrIndex = parseInt(process.argv[4], 10) || 1;

switch (command) {
  case 'prompt':
    showPrompt(style);
    break;
    
  case 'generate':
    generateLogo(style, countOrIndex);
    break;
    
  case 'generate-multiple':
    generateMultiple(style, countOrIndex);
    break;
    
  default:
    console.log(`
🎨 AutoRev Logo Generation Script

Usage:
  node scripts/generate-logo.js <command> [style] [count]

Commands:
  prompt [style]                    Show the generation prompt
  generate [style] [index]          Generate a single logo
  generate-multiple [style] [count] Generate multiple variations

Styles:
  tachometer    (default) Rev gauge with needle pointing to redline
  compass       Direction/guidance themed
  abstract_a    Stylized "A" with motion element

Examples:
  node scripts/generate-logo.js prompt
  node scripts/generate-logo.js generate
  node scripts/generate-logo.js generate tachometer 1
  node scripts/generate-logo.js generate compass
  node scripts/generate-logo.js generate-multiple tachometer 3

Output:
  Logos are saved to: generated-images/logo/
`);
}
