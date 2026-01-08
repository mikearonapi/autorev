#!/usr/bin/env node
/**
 * Generate Pit Lane Article Images - Illustration Style
 * 
 * Generates illustration-style hero images for Pit Lane (humor) articles.
 * Uses custom illustration prompts optimized for humor content.
 * 
 * Usage:
 *   node scripts/generate-pitlane-images.mjs --dry-run     # Preview prompts
 *   node scripts/generate-pitlane-images.mjs --execute     # Generate images
 *   node scripts/generate-pitlane-images.mjs --execute --slug=<slug>  # Single article
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { put } from '@vercel/blob';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load environment
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const MODEL_NAME = 'gemini-2.0-flash-exp-image-generation';

// =============================================================================
// CLI ARGS
// =============================================================================

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const execute = args.includes('--execute');
const specificSlug = args.find(a => a.startsWith('--slug='))?.split('=')[1];

if (!dryRun && !execute) {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║     Generate Pit Lane Article Images (Illustration Style)        ║
╠══════════════════════════════════════════════════════════════════╣
║  Generates illustration-style hero images for humor articles.    ║
║  Uses custom prompts optimized for editorial cartoon style.      ║
╚══════════════════════════════════════════════════════════════════╝

Usage:
  node scripts/generate-pitlane-images.mjs --dry-run     # Preview prompts
  node scripts/generate-pitlane-images.mjs --execute     # Run
  node scripts/generate-pitlane-images.mjs --execute --slug=<slug>
`);
  process.exit(0);
}

// =============================================================================
// ILLUSTRATION-STYLE PROMPTS - Optimized for humor articles
// =============================================================================

const ARTICLE_PROMPTS = {
  'how-to-survive-car-forum-trolls': `A comedic illustration of a car enthusiast at a computer looking exasperated, surrounded by floating speech bubbles with automotive opinions like "Wrong exhaust choice" and "Should've bought different car". Style: Modern editorial illustration, warm colors, slightly cartoonish but professional. The person has a bemused expression. Include subtle car-related elements in the background like posters and model cars. Light-hearted and relatable mood.`,
  
  'if-cars-could-talk-parking-lot-drama': `A playful illustration of cars in a parking lot with thought bubbles showing their personalities. A red Mustang looking smug, a Tesla with a condescending expression, a Honda Civic looking patient and wise. Style: Modern cartoon illustration with vibrant colors, anthropomorphized vehicles with subtle facial expressions in their grilles and headlights. Warm morning light suggesting cars and coffee atmosphere. Humorous and whimsical mood.`,
  
  'top-10-excuses-for-buying-another-car': `A humorous illustration showing a person trying to sneak a new sports car into their already full garage while their spouse watches suspiciously from a window. The garage already has multiple vehicles including a project car on blocks. Style: Editorial cartoon style with warm, inviting colors. Exaggerated expressions for comedy. The new car has a big red bow on it. Light-hearted domestic comedy vibe.`,
  
  'field-guide-to-car-show-personalities': `A Where's Waldo style illustration of a cars and coffee event, featuring various car enthusiast stereotypes: someone obsessively polishing their car, a phone photographer blocking others, someone showing off their engine bay, people gathered around different vehicles. Style: Detailed editorial illustration with warm, golden morning light. Diverse cars from Miatas to lifted trucks to exotics. Busy but organized composition, cheerful and observational humor.`,
  
  'five-stages-of-project-car-ownership': `A dramatic five-panel style illustration showing the emotional journey of project car ownership: initial excitement with a freshly purchased project, shock at discovering hidden problems, the car on jackstands collecting dust, the owner looking defeated, and finally either triumph or surrender. Style: Comic book panel layout, expressive characters, the project car should be something relatable like a classic Mustang or 240SX. Emotional storytelling through visuals.`,
  
  'decoding-what-your-mechanic-actually-means': `An illustration of a mechanic making the classic "sharp inhale through teeth" expression while looking at an engine bay, with a worried car owner standing behind. Thought bubbles show the translation of what the mechanic is thinking vs saying. Style: Modern editorial cartoon with muted workshop colors (grays, blues) contrasted with warm skin tones. Professional but humorous. The engine bay should show obviously concerning details like leaks and makeshift repairs.`,
  
  'things-car-people-find-normal-that-arent': `A split-scene illustration: on one side, a "normal person" looking confused at a car, on the other side, a "car person" enthusiastically explaining something about their engine bay with maniacal joy. Around them float icons of car person behaviors: multiple insurance cards, photos of cars instead of family, checking on their car in the garage at night. Style: Clean, modern editorial illustration with complementary color scheme. Relatable humor.`,
  
  'survival-guide-to-car-dealerships': `An illustration styled like a vintage survival guide or field manual, showing a car buyer navigating a dealership. The salesperson is depicted as friendly but with slightly exaggerated eagerness. Visual elements include the "four square" paper, a clock showing long wait times, and the buyer looking knowledgeable and confident. Style: Retro field guide illustration with muted colors and informative diagram elements. Educational but humorous.`,
  
  'legendary-car-rivalries-as-high-school-drama': `A fun illustration of cars depicted as high school students in a hallway scene. A Mustang and Camaro face off like rival jocks, a Porsche 911 stands aloof as the exchange student, a group of hot hatches hang out together, and a Tesla is the controversial new kid. Style: Modern cartoon illustration with high school aesthetic - lockers, dramatic lighting, teenage drama vibes. Cars have subtle anthropomorphic features. Colorful and dynamic.`,
  
  'things-car-owners-say-about-check-engine-lights': `A humorous illustration of a car dashboard with an angry, glowing check engine light, while the driver has an expression of casual denial. Around the scene float speech bubbles with classic excuses: "It's been on for years", "It's just the O2 sensor", "The car runs fine". A piece of electrical tape is visible nearby. Style: Modern editorial illustration focusing on the dashboard and driver's dismissive expression. Warm amber glow from the CEL. Relatable and funny.`
};

// =============================================================================
// IMAGE GENERATION
// =============================================================================

async function generateImage(prompt) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;
  
  // Add quality directives for illustration style
  const enhancedPrompt = `${prompt}

STYLE REQUIREMENTS:
- High-quality editorial illustration suitable for a professional automotive website
- Clean, modern aesthetic with professional finish
- Suitable for article hero image at 16:9 aspect ratio
- No text, watermarks, or logos in the image
- Professional magazine quality illustration
- Warm, inviting color palette`;

  const response = await fetch(`${apiUrl}?key=${GOOGLE_AI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: enhancedPrompt }]
      }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  
  // Extract image from response
  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));
  
  if (!imagePart) {
    throw new Error('No image in response');
  }
  
  return {
    buffer: Buffer.from(imagePart.inlineData.data, 'base64'),
    mimeType: imagePart.inlineData.mimeType,
  };
}

async function uploadToBlob(imageBuffer, articleSlug, mimeType) {
  const ext = mimeType.split('/')[1] || 'png';
  const timestamp = Date.now();
  const filename = `articles/${articleSlug}/hero-${timestamp}.${ext}`;
  
  const blob = await put(filename, imageBuffer, {
    access: 'public',
    contentType: mimeType,
  });
  
  return blob.url;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║     Generate Pit Lane Images (Illustration Style)                ║
╚══════════════════════════════════════════════════════════════════╝
`);
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No images will be generated\n');
  }
  
  // Fetch Pit Lane articles
  let query = supabase
    .from('al_articles')
    .select('id, slug, title, category')
    .eq('category', 'pitlane')
    .eq('is_published', true)
    .order('published_at', { ascending: false });
  
  if (specificSlug) {
    query = supabase
      .from('al_articles')
      .select('id, slug, title, category')
      .eq('slug', specificSlug);
  }
  
  const { data: articles, error } = await query;
  
  if (error) {
    console.error('Failed to fetch articles:', error);
    process.exit(1);
  }
  
  console.log(`📋 Found ${articles.length} Pit Lane article(s) to process\n`);
  
  if (dryRun) {
    console.log('Preview of illustration prompts:\n');
    articles.forEach((article, i) => {
      const prompt = ARTICLE_PROMPTS[article.slug];
      if (prompt) {
        console.log(`${i + 1}. ${article.title}`);
        console.log(`   Slug: ${article.slug}`);
        console.log(`   Prompt: "${prompt.slice(0, 120)}..."\n`);
      } else {
        console.log(`${i + 1}. ${article.title}`);
        console.log(`   ⚠️  No custom prompt defined for: ${article.slug}\n`);
      }
    });
    console.log('\nRun with --execute to generate images');
    return;
  }
  
  // Generate images
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const prompt = ARTICLE_PROMPTS[article.slug];
    
    console.log(`\n[${i + 1}/${articles.length}] ${article.title}`);
    console.log(`   Slug: ${article.slug}`);
    
    if (!prompt) {
      console.log(`   ⚠️  Skipping: No custom prompt defined`);
      failed++;
      continue;
    }
    
    try {
      console.log(`   ⏳ Generating illustration...`);
      const { buffer, mimeType } = await generateImage(prompt);
      console.log(`   ✅ Generated: ${buffer.length} bytes`);
      
      console.log(`   ⏳ Uploading to Vercel Blob...`);
      const imageUrl = await uploadToBlob(buffer, article.slug, mimeType);
      console.log(`   ✅ Uploaded: ${imageUrl.slice(0, 60)}...`);
      
      console.log(`   ⏳ Updating database...`);
      const { error: updateError } = await supabase
        .from('al_articles')
        .update({
          hero_image_url: imageUrl,
          image_qa_score: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', article.id);
      
      if (updateError) throw updateError;
      
      console.log(`   ✅ Complete!`);
      success++;
      
      // Rate limiting - wait 3s between requests
      if (i < articles.length - 1) {
        console.log(`   ⏳ Waiting 3s before next image...`);
        await new Promise(r => setTimeout(r, 3000));
      }
      
    } catch (err) {
      console.log(`   ❌ Failed: ${err.message}`);
      failed++;
    }
  }
  
  // Summary
  console.log(`
${'═'.repeat(60)}
                         SUMMARY
${'═'.repeat(60)}
✅ Success: ${success}
❌ Failed:  ${failed}
${'─'.repeat(60)}
`);
}

main().catch(console.error);
