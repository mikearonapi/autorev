#!/usr/bin/env node
/**
 * Regenerate Article Images with Improved Prompts
 * 
 * Uses updated prompts designed to produce more realistic, 
 * Canon R5-style photography rather than CGI/AI polish.
 * 
 * Run: node scripts/regenerate-article-images.mjs [--dry-run] [--slug=article-slug]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { put } from '@vercel/blob';

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

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const MODEL_NAME = 'gemini-2.0-flash-exp-image-generation'; // Best model for realistic article images

// =============================================================================
// IMPROVED PROMPT TEMPLATES - Focus on realism, not CGI
// =============================================================================

/**
 * Generate a realistic photography prompt for an article
 * Key changes from old prompts:
 * - Canon R5 camera specification
 * - Natural light, not cinematic
 * - Documentary/editorial style
 * - Avoid "hyper-realistic", "professional", "magazine" triggers
 * - Include subtle imperfections for authenticity
 */
function generateRealisticPrompt(article) {
  const title = article.title.toLowerCase();
  
  // Base photography style - consistent across all images
  const cameraSettings = 'Shot on Canon EOS R5, 24-70mm f/2.8 lens, natural daylight';
  const realism = 'real photograph, authentic moment, slight lens compression, natural shadows';
  const antiAI = 'NOT CGI, NOT 3D render, NOT video game, NOT overly polished, subtle imperfections';
  
  // Get context-appropriate subject
  const subject = getSubjectForArticle(article);
  const setting = getSettingForArticle(article);
  const style = getStyleForCategory(article.category);
  
  return `${subject}, ${setting}. ${cameraSettings}. ${style}. ${realism}. 

CRITICAL: Show the COMPLETE car(s) from a realistic distance - all wheels, bumpers, and body fully visible. Real outdoor environment with natural sky.

${antiAI}`;
}

/**
 * Determine the car/subject based on article title and content
 */
function getSubjectForArticle(article) {
  const title = article.title.toLowerCase();
  
  // Head-to-head comparisons
  if (title.includes('mustang') && title.includes('camaro')) {
    return 'A red Ford Mustang GT and a yellow Chevrolet Camaro SS parked side by side in a parking lot';
  }
  if (title.includes('supra') && title.includes('nissan z')) {
    return 'A white Toyota GR Supra and an orange Nissan Z parked together at a scenic overlook';
  }
  if (title.includes('porsche 911') && title.includes('corvette')) {
    return 'A silver Porsche 911 and a red Chevrolet Corvette C8 on a mountain road';
  }
  if (title.includes('m3') && title.includes('c63')) {
    return 'A blue BMW M3 and a gray Mercedes-AMG C63 parked in an urban setting';
  }
  if (title.includes('miata') && title.includes('gr86') && title.includes('brz')) {
    return 'A red Mazda MX-5 Miata, a blue Toyota GR86, and a white Subaru BRZ at a cars and coffee event';
  }
  if (title.includes('rs3') && title.includes('m2')) {
    return 'An Audi RS3 in Nardo Gray and a BMW M2 in Alpine White at a car meet';
  }
  
  // Budget articles
  if (title.includes('under $50') || title.includes('under $40')) {
    return 'A Toyota GR86 and Mazda MX-5 Miata parked at a scenic viewpoint';
  }
  if (title.includes('first sports car')) {
    return 'A Mazda MX-5 Miata in Soul Red parked in a suburban driveway, approachable first car';
  }
  
  // Electric vs Gas
  if (title.includes('electric') && title.includes('gas')) {
    return 'A Porsche Taycan and a Porsche 911 parked side by side';
  }
  
  // JDM Culture
  if (title.includes('jdm')) {
    return 'Classic JDM cars including a white Nissan Skyline GT-R R34 and a red Toyota Supra MK4 at a nighttime car meet';
  }
  
  // Barn Find
  if (title.includes('barn find')) {
    return 'A dusty classic Ford Mustang from the 1960s discovered in an old wooden barn, dust particles in light beams';
  }
  
  // Manual Transmission
  if (title.includes('manual transmission')) {
    return 'Interior shot of a sports car cockpit focusing on the manual gear shifter, driver\'s hand on the knob';
  }
  
  // Car Movies
  if (title.includes('car movies')) {
    return 'Iconic movie cars: a 1968 Ford Mustang Fastback and a Dodge Charger parked dramatically';
  }
  
  // Photography article
  if (title.includes('photography')) {
    return 'A photographer with a camera shooting a Porsche 911 at golden hour, behind-the-scenes shot';
  }
  
  // Car meet / etiquette
  if (title.includes('car meet') || title.includes('etiquette')) {
    return 'A diverse group of sports cars at a morning car meet, enthusiasts chatting nearby';
  }
  
  // Cars and Coffee
  if (title.includes('cars & coffee') || title.includes('cars and coffee')) {
    return 'A busy cars and coffee event with various sports cars and people holding coffee cups';
  }
  
  // Nürburgring
  if (title.includes('nürburgring') || title.includes('nurburgring')) {
    return 'A Porsche GT3 RS cornering on the Nürburgring Nordschleife, green hell forest backdrop';
  }
  
  // Porsche 911 History
  if (title.includes('history') && title.includes('911')) {
    return 'Three generations of Porsche 911 lined up: a classic 1970s 911, a 993, and a modern 992';
  }
  
  // Electric Future
  if (title.includes('electric future')) {
    return 'A sleek electric sports car like Porsche Taycan charging at a modern charging station';
  }
  
  // Technical articles
  if (title.includes('exhaust')) {
    return 'Close-up of a performance exhaust system on a BMW M3, quad tips visible, garage setting';
  }
  if (title.includes('suspension') || title.includes('handling')) {
    return 'A sports car on a lift showing coilover suspension components, clean garage';
  }
  if (title.includes('brake')) {
    return 'Detail shot of big brake kit with red calipers on a sports car, wheel removed';
  }
  if (title.includes('wheel') && title.includes('tire')) {
    return 'A sports car with aftermarket wheels, shot from low angle emphasizing the wheel and tire';
  }
  if (title.includes('turbo') || title.includes('supercharger') || title.includes('forced induction')) {
    return 'Engine bay of a turbocharged car showing the turbo and intercooler piping, hood open';
  }
  if (title.includes('ecu') || title.includes('tuning')) {
    return 'A laptop connected to a car\'s OBD port for ECU tuning, interior and dashboard visible';
  }
  if (title.includes('dyno')) {
    return 'A sports car strapped to a dynamometer, spinning rollers visible, dyno shop environment';
  }
  if (title.includes('cold air') || title.includes('intake')) {
    return 'Engine bay showing a cold air intake system with exposed filter, clean install';
  }
  if (title.includes('detailing')) {
    return 'Someone detailing a car with a polishing machine, paint correction in progress';
  }
  if (title.includes('oil') || title.includes('maintenance')) {
    return 'Oil being poured during an oil change, funnel in valve cover, clean garage setup';
  }
  
  // Default fallback
  return 'A modern sports car in natural outdoor setting';
}

/**
 * Get appropriate setting based on article
 */
function getSettingForArticle(article) {
  const category = article.category;
  const title = article.title.toLowerCase();
  
  if (title.includes('barn')) return 'rustic barn interior with hay and dust, morning light through wooden slats';
  if (title.includes('nürburgring')) return 'green forested racetrack, overcast German weather';
  if (title.includes('coffee')) return 'parking lot at sunrise, coffee shop in background';
  if (title.includes('meet')) return 'parking lot or street, other cars visible in background';
  if (title.includes('dyno')) return 'industrial dyno shop, concrete floor, bright shop lights';
  
  if (category === 'technical') {
    return 'clean home garage or professional workshop, concrete floor, organized tools';
  }
  if (category === 'enthusiast') {
    return 'outdoor location, natural environment, morning or evening light';
  }
  if (category === 'comparisons') {
    return 'scenic outdoor location, mountain road or coastal highway backdrop';
  }
  
  return 'outdoor location with natural lighting';
}

/**
 * Get photography style based on category
 */
function getStyleForCategory(category) {
  switch (category) {
    case 'comparisons':
      return 'editorial automotive photography, eye-level perspective, both cars equally prominent';
    case 'enthusiast':
      return 'documentary style photography, candid feel, authentic atmosphere';
    case 'technical':
      return 'instructional photography, clear detail visibility, well-lit subject';
    default:
      return 'editorial automotive photography, natural composition';
  }
}

// =============================================================================
// IMAGE GENERATION
// =============================================================================

async function generateImage(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GOOGLE_AI_API_KEY}`;
  
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: { aspectRatio: '16:9', imageSize: '2K' }
    }
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error.substring(0, 200)}`);
  }
  
  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));
  
  if (!imagePart) throw new Error('No image in response');
  
  return {
    buffer: Buffer.from(imagePart.inlineData.data, 'base64'),
    mimeType: imagePart.inlineData.mimeType,
  };
}

async function uploadToBlob(buffer, slug, mimeType) {
  const ext = mimeType.includes('webp') ? 'webp' : mimeType.includes('jpeg') ? 'jpg' : 'png';
  const timestamp = Date.now();
  
  const blob = await put(`articles/${slug}/hero-${timestamp}.${ext}`, buffer, {
    access: 'public',
    contentType: mimeType,
  });
  
  return blob.url;
}

// =============================================================================
// ARTICLES TO REGENERATE
// =============================================================================

// Priority 1: Currently rejected or score < 80
const PRIORITY_1_SLUGS = [
  'barn-find-guide',           // Score 50, rejected
  'car-detailing-basics',      // Score 50, rejected
  'forced-induction-basics',   // Score 77, rejected
  'why-manual-transmissions-matter', // Score 88, rejected
];

// Priority 2: Known issues or CGI appearance (based on visual review)
const PRIORITY_2_SLUGS = [
  'best-first-sports-car',     // Cropping issues
  'jdm-culture-explained',     // Cropping + CGI look
  'history-of-the-porsche-911', // Multiple cars cut off
  'best-car-movies-enthusiasts', // CGI look
  'car-photography-tips',      // Too polished
  'car-meets-etiquette',       // Same Taycan overused
  'cars-and-coffee-guide',     // Same Taycan overused  
  'electric-car-future-enthusiasts', // Too CGI
  'nurburgring-guide',         // CGI Lamborghini
];

// Priority 3: Borderline - could improve
const PRIORITY_3_SLUGS = [
  'best-sports-cars-under-50k',
  'best-sports-cars-under-40k',
  'wheel-tire-guide',
  'oil-guide-enthusiasts',
];

// =============================================================================
// MAIN
// =============================================================================

async function regenerateImage(article, dryRun = false) {
  console.log(`\n🎨 ${article.title}`);
  console.log(`   Slug: ${article.slug}`);
  console.log(`   Current score: ${article.image_qa_score || 'N/A'}`);
  
  const prompt = generateRealisticPrompt(article);
  console.log(`   Prompt: ${prompt.substring(0, 150)}...`);
  
  if (dryRun) {
    console.log(`   [DRY RUN] Would generate and upload image`);
    return { success: true, dryRun: true };
  }
  
  try {
    // Generate image
    console.log(`   ⏳ Generating...`);
    const { buffer, mimeType } = await generateImage(prompt);
    console.log(`   ✅ Generated: ${buffer.length} bytes`);
    
    // Upload to blob
    console.log(`   ⏳ Uploading...`);
    const imageUrl = await uploadToBlob(buffer, article.slug, mimeType);
    console.log(`   ✅ Uploaded: ${imageUrl.substring(0, 60)}...`);
    
    // Update database
    const { error } = await supabase
      .from('al_articles')
      .update({ 
        hero_image_url: imageUrl,
        image_qa_status: 'pending',
        image_qa_score: null,
        image_qa_issues: null,
        image_qa_details: null,
      })
      .eq('id', article.id);
    
    if (error) throw error;
    console.log(`   ✅ Database updated`);
    
    return { success: true, imageUrl };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const slugArg = args.find(a => a.startsWith('--slug='));
  const specificSlug = slugArg ? slugArg.split('=')[1] : null;
  const priorityArg = args.find(a => a.startsWith('--priority='));
  const priority = priorityArg ? parseInt(priorityArg.split('=')[1]) : null;
  
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║       Article Image Regeneration - Realistic Photography        ║
╚════════════════════════════════════════════════════════════════╝
`);
  
  if (dryRun) console.log('🔍 DRY RUN MODE - No changes will be made\n');
  
  // Get articles to regenerate
  let slugsToRegenerate;
  
  if (specificSlug) {
    slugsToRegenerate = [specificSlug];
    console.log(`Regenerating specific article: ${specificSlug}\n`);
  } else if (priority === 1) {
    slugsToRegenerate = PRIORITY_1_SLUGS;
    console.log(`Regenerating Priority 1 (rejected/low score): ${slugsToRegenerate.length} articles\n`);
  } else if (priority === 2) {
    slugsToRegenerate = PRIORITY_2_SLUGS;
    console.log(`Regenerating Priority 2 (CGI/issues): ${slugsToRegenerate.length} articles\n`);
  } else if (priority === 3) {
    slugsToRegenerate = PRIORITY_3_SLUGS;
    console.log(`Regenerating Priority 3 (borderline): ${slugsToRegenerate.length} articles\n`);
  } else {
    slugsToRegenerate = [...PRIORITY_1_SLUGS, ...PRIORITY_2_SLUGS];
    console.log(`Regenerating Priority 1 + 2: ${slugsToRegenerate.length} articles\n`);
  }
  
  // Fetch articles
  const { data: articles, error } = await supabase
    .from('al_articles')
    .select('id, title, slug, category, subcategory, hero_image_url, image_qa_score')
    .in('slug', slugsToRegenerate);
  
  if (error) {
    console.error('Failed to fetch articles:', error);
    process.exit(1);
  }
  
  console.log(`Found ${articles.length} articles to process\n`);
  
  // Process each article
  const results = { success: 0, failed: 0 };
  const delayMs = 5000; // 5 seconds between requests
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const result = await regenerateImage(article, dryRun);
    
    if (result.success) results.success++;
    else results.failed++;
    
    // Delay between requests (except for last one)
    if (!dryRun && i < articles.length - 1) {
      console.log(`   ⏳ Waiting ${delayMs/1000}s before next request...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  
  // Summary
  console.log(`
════════════════════════════════════════════════════════════════
                         SUMMARY
════════════════════════════════════════════════════════════════
✅ Success: ${results.success}
❌ Failed:  ${results.failed}
────────────────────────────────────────────────────────────────

${dryRun ? 'This was a DRY RUN. Run without --dry-run to apply changes.' : 'Done! Run image QA to verify quality: node scripts/run-image-qa.mjs'}
`);
}

main().catch(console.error);

