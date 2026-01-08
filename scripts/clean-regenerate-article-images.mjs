#!/usr/bin/env node
/**
 * Clean Regenerate Article Images
 * 
 * This script:
 * 1. Deletes ALL existing article images from Vercel Blob (only articles/* path)
 * 2. Regenerates fresh images using our optimized prompts
 * 3. Updates database with new URLs
 * 
 * This ensures no stale images or caching issues.
 * 
 * Usage:
 *   node scripts/clean-regenerate-article-images.mjs --dry-run     # Preview what will happen
 *   node scripts/clean-regenerate-article-images.mjs --execute     # Actually run
 *   node scripts/clean-regenerate-article-images.mjs --execute --slug=<s>  # Single article
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { put, del, list } from '@vercel/blob';
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
║      Clean Regenerate Article Images                             ║
╠══════════════════════════════════════════════════════════════════╣
║  This script deletes ALL article images from Vercel Blob         ║
║  and regenerates them fresh with optimized prompts.              ║
╚══════════════════════════════════════════════════════════════════╝

Usage:
  node scripts/clean-regenerate-article-images.mjs --dry-run     # Preview
  node scripts/clean-regenerate-article-images.mjs --execute     # Run
  node scripts/clean-regenerate-article-images.mjs --execute --slug=<slug>
`);
  process.exit(0);
}

// =============================================================================
// ENVIRONMENT DIVERSITY - Different settings for variety
// =============================================================================

const ENVIRONMENTS = {
  comparisons: [
    'at a scenic mountain overlook with blue sky',
    'in an empty parking garage with concrete pillars',
    'on a coastal highway with ocean visible',
    'at a cars and coffee event with other vehicles blurred in background',
    'at a track day paddock area',
    'in front of a modern car dealership',
    'on a desert highway at golden hour',
    'in an industrial area with brick warehouses',
  ],
  technical: [
    'inside a well-lit professional garage',
    'in a clean workshop with tools visible',
    'at a tuning shop with dyno in background',
    'at a race team garage',
    'in a home garage with lift',
  ],
  enthusiast: [
    'at a classic car show on green grass',
    'in a vintage gas station setting',
    'at a drive-in movie theater parking lot',
    'at a European countryside road',
    'at an American diner parking lot',
    'at a Japanese touge mountain road',
  ],
  // Pit Lane - humor and fun articles
  pitlane: [
    'in a quirky vintage gas station with retro signs',
    'at a colorful roadside diner parking lot',
    'in front of a funky mural-covered wall',
    'at a casual backyard BBQ setting',
    'in a classic American drive-in movie theater',
    'at a nostalgic Route 66 roadside attraction',
    'in a playful urban alley with street art',
    'at a lively food truck gathering',
  ],
};

// =============================================================================
// PROMPT GENERATION - Optimized for realism
// =============================================================================

function generateOptimizedPrompt(article, environmentIndex = 0) {
  const title = article.title.toLowerCase();
  const category = article.category || 'comparisons';
  
  // Select environment based on category and index for variety
  const envList = ENVIRONMENTS[category] || ENVIRONMENTS.comparisons;
  const environment = envList[environmentIndex % envList.length];
  
  // Determine subject based on article
  const subject = getSubjectForArticle(article);
  
  // Camera and realism specifications
  const cameraSpec = 'Shot on Canon EOS R5, 24-70mm f/2.8 lens';
  const lighting = 'natural daylight, soft shadows';
  const style = 'editorial automotive photography, documentary style';
  
  const prompt = `${subject} ${environment}. ${cameraSpec}, ${lighting}. ${style}.

CRITICAL REQUIREMENTS:
1. Show the COMPLETE car(s) - NO cropping at all
2. All wheels, bumpers, headlights, and taillights fully visible
3. Realistic camera distance of 15-25 feet away
4. Real outdoor environment with visible sky and natural surroundings
5. Natural imperfections: realistic reflections, subtle road dust
6. This must look like a REAL PHOTOGRAPH, not a render

ABSOLUTELY AVOID:
- Dark studio backgrounds with reflective floors
- CGI or 3D render appearance
- Overly saturated or HDR look
- Impossibly perfect chrome reflections
- Any text, watermarks, or license plate text
- Dramatic cinematic lighting
- Video game graphics style`;

  return prompt;
}

function getSubjectForArticle(article) {
  const title = article.title.toLowerCase();
  
  // Head-to-head comparisons
  if (title.includes('mustang') && title.includes('camaro')) {
    return 'A red Ford Mustang GT and a yellow Chevrolet Camaro SS parked side by side';
  }
  if (title.includes('supra') && title.includes('nissan z')) {
    return 'A white Toyota GR Supra and an orange Nissan Z parked together';
  }
  if (title.includes('porsche 911') && title.includes('corvette')) {
    return 'A silver Porsche 911 and a red Chevrolet Corvette C8 parked together';
  }
  if (title.includes('m3') && title.includes('c63')) {
    return 'A blue BMW M3 G80 and a gray Mercedes-AMG C63 sedan parked side by side';
  }
  if (title.includes('rs3') && title.includes('m2')) {
    return 'A Nardo gray Audi RS3 and a blue BMW M2 parked together';
  }
  if (title.includes('miata') && title.includes('gr86') && title.includes('brz')) {
    return 'A red Mazda MX-5 Miata, a blue Toyota GR86, and a white Subaru BRZ';
  }
  if (title.includes('electric') && title.includes('gas')) {
    return 'A Tesla Model S Plaid and a Porsche 911 GT3 parked side by side';
  }
  
  // Budget articles
  if (title.includes('new') && title.includes('under') && title.includes('50')) {
    return 'A blue Toyota GR86, a red Mazda MX-5 Miata, and a yellow Ford Mustang EcoBoost';
  }
  if (title.includes('new') && title.includes('under') && title.includes('40')) {
    return 'A white Subaru BRZ, a red Mazda MX-5 Miata ND, and a gray Honda Civic Si';
  }
  if (title.includes('first sports car') || title.includes('first car')) {
    return 'A clean blue Mazda MX-5 Miata ND parked in a residential driveway';
  }
  
  // Technical articles
  if (title.includes('exhaust')) {
    return 'A modified sports car with visible aftermarket exhaust system, rear quarter view';
  }
  if (title.includes('brake')) {
    return 'Close-up of a sports car wheel showing large red brake calipers behind forged wheels';
  }
  if (title.includes('intake') || title.includes('cold air')) {
    return 'Engine bay of a sports car showing a polished cold air intake system';
  }
  if (title.includes('suspension') || title.includes('coilover')) {
    return 'A lowered sports car showing coilover suspension, wheel and fender gap visible';
  }
  if (title.includes('ecu') || title.includes('tuning')) {
    return 'A sports car on a dyno with laptop showing tuning software';
  }
  if (title.includes('dyno')) {
    return 'A sports car strapped to a Dynojet dyno with technician monitoring';
  }
  if (title.includes('turbo') || title.includes('supercharger') || title.includes('forced induction')) {
    return 'Engine bay showing a turbocharger with polished piping and intercooler';
  }
  if (title.includes('wheel') || title.includes('tire')) {
    return 'A sports car wheel close-up showing premium alloy wheel with performance tire sidewall visible';
  }
  if (title.includes('oil')) {
    return 'Close-up of engine oil being poured into a sports car engine';
  }
  
  // Culture articles
  if (title.includes('jdm')) {
    return 'A group of Japanese sports cars including a Nissan Skyline GT-R, Toyota Supra, and Honda NSX';
  }
  if (title.includes('nurburgring') || title.includes('nürburgring')) {
    return 'A Porsche 911 GT3 driving on the Nürburgring Nordschleife with green forest in background';
  }
  if (title.includes('car meet') || title.includes('cars and coffee')) {
    return 'A diverse group of sports cars gathered at a morning car meet';
  }
  if (title.includes('barn find')) {
    return 'A dusty classic Porsche 911 in an old barn with sunlight streaming through wooden slats';
  }
  if (title.includes('history') && title.includes('911')) {
    return 'A classic air-cooled Porsche 911 in silver parked on a European cobblestone street';
  }
  if (title.includes('manual transmission') || title.includes('manual')) {
    return 'Interior shot of a sports car showing manual gear shifter and pedals';
  }
  if (title.includes('movie') || title.includes('film')) {
    return 'Iconic sports cars from famous movies including a silver Aston Martin DB5';
  }
  if (title.includes('electric') && title.includes('future')) {
    return 'A Porsche Taycan and BMW i4 M50 parked at a charging station';
  }
  if (title.includes('photography') || title.includes('photo')) {
    return 'A photographer with camera tripod shooting a sports car at golden hour';
  }
  if (title.includes('detailing')) {
    return 'A freshly detailed sports car with perfect paint showing reflections';
  }
  
  // Default
  return 'A modern sports car in a scenic outdoor setting';
}

// =============================================================================
// STEP 1: Delete all existing article images from Vercel Blob
// =============================================================================

async function deleteAllArticleImages() {
  console.log('\n📋 Step 1: Finding existing article images in Vercel Blob...\n');
  
  const allBlobs = [];
  let cursor = undefined;
  
  // List all blobs with 'articles/' prefix
  do {
    const result = await list({
      prefix: 'articles/',
      limit: 1000,
      cursor,
    });
    
    allBlobs.push(...result.blobs);
    cursor = result.cursor;
  } while (cursor);
  
  console.log(`   Found ${allBlobs.length} article images in Vercel Blob\n`);
  
  if (allBlobs.length === 0) {
    return { deleted: 0, errors: [] };
  }
  
  if (dryRun) {
    console.log('   [DRY RUN] Would delete:');
    allBlobs.slice(0, 10).forEach(blob => {
      console.log(`     - ${blob.pathname}`);
    });
    if (allBlobs.length > 10) {
      console.log(`     ... and ${allBlobs.length - 10} more`);
    }
    return { deleted: 0, errors: [], blobs: allBlobs };
  }
  
  // Delete all article images
  console.log('   Deleting images...');
  let deleted = 0;
  const errors = [];
  
  for (const blob of allBlobs) {
    try {
      await del(blob.url);
      deleted++;
      if (deleted % 10 === 0) {
        process.stdout.write(`\r   Deleted ${deleted}/${allBlobs.length} images`);
      }
    } catch (err) {
      errors.push({ url: blob.url, error: err.message });
    }
  }
  
  console.log(`\n   ✅ Deleted ${deleted} images (${errors.length} errors)\n`);
  
  return { deleted, errors };
}

// =============================================================================
// STEP 2: Generate new images
// =============================================================================

async function generateImage(prompt) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;
  
  const response = await fetch(`${apiUrl}?key=${GOOGLE_AI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
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
    base64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType,
  };
}

async function uploadToBlob(imageData, articleSlug) {
  const ext = imageData.mimeType.split('/')[1] || 'webp';
  const timestamp = Date.now();
  const filename = `articles/${articleSlug}/hero-${timestamp}.${ext}`;
  
  // Convert base64 to buffer
  const buffer = Buffer.from(imageData.base64, 'base64');
  
  const blob = await put(filename, buffer, {
    access: 'public',
    contentType: imageData.mimeType,
  });
  
  return blob.url;
}

// =============================================================================
// STEP 3: Regenerate all article images
// =============================================================================

async function regenerateArticleImages() {
  console.log('\n📋 Step 2: Fetching articles from database...\n');
  
  let query = supabase
    .from('al_articles')
    .select('id, slug, title, category, subcategory')
    .eq('is_published', true)
    .order('slug');
  
  if (specificSlug) {
    query = supabase
      .from('al_articles')
      .select('id, slug, title, category, subcategory')
      .eq('slug', specificSlug);
  }
  
  const { data: articles, error } = await query;
  
  if (error) {
    console.error('Failed to fetch articles:', error);
    return { success: 0, failed: 0 };
  }
  
  console.log(`   Found ${articles.length} article(s) to process\n`);
  
  if (dryRun) {
    console.log('   [DRY RUN] Would regenerate images for:');
    articles.forEach((a, i) => {
      const prompt = generateOptimizedPrompt(a, i);
      console.log(`\n   ${i + 1}. ${a.title}`);
      console.log(`      Slug: ${a.slug}`);
      console.log(`      Prompt preview: "${prompt.split('\n')[0].slice(0, 80)}..."`);
    });
    return { success: 0, failed: 0 };
  }
  
  console.log('📋 Step 3: Generating new images...\n');
  
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(`\n[${i + 1}/${articles.length}] ${article.title}`);
    
    try {
      // Generate prompt with environment variety
      const prompt = generateOptimizedPrompt(article, i);
      console.log(`   Generating image...`);
      
      // Generate image
      const imageData = await generateImage(prompt);
      console.log(`   Uploading to Vercel Blob...`);
      
      // Upload to blob
      const imageUrl = await uploadToBlob(imageData, article.slug);
      console.log(`   Updating database...`);
      
      // Update database
      const { error: updateError } = await supabase
        .from('al_articles')
        .update({
          hero_image_url: imageUrl,
          image_qa_score: null, // Reset QA score for fresh evaluation
          updated_at: new Date().toISOString(),
        })
        .eq('id', article.id);
      
      if (updateError) {
        throw updateError;
      }
      
      console.log(`   ✅ Success: ${imageUrl.split('/').pop()}`);
      success++;
      
      // Rate limiting - wait between requests
      if (i < articles.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
      
    } catch (err) {
      console.log(`   ❌ Failed: ${err.message}`);
      failed++;
    }
  }
  
  return { success, failed };
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║        Clean Regenerate Article Images                           ║
╚══════════════════════════════════════════════════════════════════╝
`);
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }
  
  // Step 1: Delete existing images
  const deleteResult = await deleteAllArticleImages();
  
  // Step 2 & 3: Regenerate images
  const regenResult = await regenerateArticleImages();
  
  // Summary
  console.log(`
${'═'.repeat(60)}
                         SUMMARY
${'═'.repeat(60)}
Images deleted:       ${dryRun ? `${deleteResult.blobs?.length || 0} (would delete)` : deleteResult.deleted}
Images generated:     ${dryRun ? 'N/A (dry run)' : regenResult.success}
Generation failed:    ${dryRun ? 'N/A (dry run)' : regenResult.failed}
${'─'.repeat(60)}
`);

  if (dryRun) {
    console.log(`Run with --execute to apply changes:\n`);
    console.log(`  node scripts/clean-regenerate-article-images.mjs --execute\n`);
  } else {
    console.log(`✅ Complete! The site should now show new images.`);
    console.log(`\nIf images still appear old:`);
    console.log(`  1. Hard refresh browser (Cmd+Shift+R)`);
    console.log(`  2. Clear browser cache`);
    console.log(`  3. Check Vercel deployment logs\n`);
  }
}

main().catch(console.error);

