#!/usr/bin/env node
/**
 * Generate Article Images Script
 * 
 * Generates images for AL articles using Google Gemini Nano Banana Pro:
 *   - Hero image (required, top of article)
 *   - 3 inline images (different perspectives/contexts)
 * 
 * Usage:
 *   node scripts/generate-article-images.js                    # Process all articles needing images
 *   node scripts/generate-article-images.js --limit=5          # Process 5 articles
 *   node scripts/generate-article-images.js --slug=my-article  # Process specific article
 *   node scripts/generate-article-images.js --inline-only      # Only generate inline images (hero exists)
 *   node scripts/generate-article-images.js --hero-only        # Only generate hero images
 *   node scripts/generate-article-images.js --dry-run          # Show what would be generated
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
        if (key && value) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

// =============================================================================
// CONFIGURATION
// =============================================================================

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const MODEL_NAME = 'gemini-2.0-flash-exp-image-generation'; // Best model for realistic article images
const INLINE_COUNT = 3;
const DELAY_MS = 5000; // 5 seconds between API calls (Google rate limit)

// =============================================================================
// PROMPT TEMPLATES
// =============================================================================

const CATEGORY_STYLES = {
  comparisons: {
    prefix: 'OUTDOOR professional automotive photography,',
    style: 'cinematic lighting, dramatic angle, high-end car photography, magazine quality',
    heroSettings: [
      'on a scenic mountain road at golden hour, dramatic peaks in background',
      'parked at a scenic overlook at sunset, beautiful landscape behind',
    ],
    inlineContexts: [
      { context: 'interior cockpit view, driver perspective', style: 'luxury automotive interior' },
      { context: 'rear 3/4 angle driving shot with motion blur', style: 'dynamic action shot' },
      { context: 'side profile, clean architectural backdrop', style: 'elegant profile shot' },
    ],
  },
  enthusiast: {
    prefix: 'OUTDOOR lifestyle automotive photography,',
    style: 'warm natural lighting, authentic atmosphere, car culture aesthetic',
    heroSettings: [
      'at a cars and coffee gathering at sunrise',
      'on a scenic coastal road with ocean view',
    ],
    inlineContexts: [
      { context: 'group of enthusiasts admiring cars at meet', style: 'community atmosphere' },
      { context: 'dashboard view with scenic road through windshield', style: 'POV driving shot' },
      { context: 'vintage gas station backdrop, nostalgic americana', style: 'classic car culture' },
    ],
  },
  technical: {
    prefix: 'OUTDOOR technical automotive photography,',
    style: 'clean lighting, detailed focus, workshop aesthetic',
    heroSettings: [
      'in a clean modern garage workshop, tools visible',
      'engine bay close-up with dramatic lighting',
    ],
    inlineContexts: [
      { context: 'engine bay open, inspection in progress', style: 'technical workshop photo' },
      { context: 'undercarriage on lift showing suspension', style: 'mechanical detail shot' },
      { context: 'performance parts on clean workbench', style: 'parts showcase' },
    ],
  },
};

// =============================================================================
// PROMPT GENERATION
// =============================================================================

function getSubject(article) {
  if (article.car_slugs && article.car_slugs.length > 0) {
    const carNames = article.car_slugs.map(slug => 
      slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    );
    return carNames.length === 1 ? carNames[0] : `${carNames[0]} and ${carNames[1]}`;
  }
  
  // Extract from title
  const title = article.title.toLowerCase();
  if (title.includes('exhaust')) return 'sports car with performance exhaust';
  if (title.includes('suspension')) return 'sports car showing suspension dynamics';
  if (title.includes('turbo')) return 'turbocharged sports car engine bay';
  if (title.includes('electric')) return 'modern electric sports car';
  if (title.includes('jdm')) return 'JDM sports car, Japanese aesthetic';
  if (title.includes('track')) return 'sports car on race track';
  if (title.includes('detailing')) return 'freshly detailed sports car';
  if (title.includes('manual')) return 'sports car cockpit with manual shifter';
  if (title.includes('dyno')) return 'sports car on dynamometer';
  if (title.includes('intake')) return 'sports car engine bay with intake';
  return 'modern sports car';
}

function generateHeroPrompt(article) {
  const style = CATEGORY_STYLES[article.category] || CATEGORY_STYLES.comparisons;
  const setting = style.heroSettings[Math.floor(Math.random() * style.heroSettings.length)];
  const subject = getSubject(article);
  return `${style.prefix} ${subject} ${setting}. ${style.style}. NOT a studio shot - real outdoor environment. Professional automotive photography.`;
}

function generateInlinePrompts(article) {
  const style = CATEGORY_STYLES[article.category] || CATEGORY_STYLES.comparisons;
  const subject = getSubject(article);
  
  return style.inlineContexts.map((ctx, i) => ({
    prompt: `${style.prefix} ${subject}, ${ctx.context}. ${ctx.style}. Real environment. Professional automotive photography.`,
    alt: `${subject} - ${ctx.context.split(',')[0]}`,
    position: i + 1,
  }));
}

// =============================================================================
// GOOGLE GEMINI API
// =============================================================================

async function generateImageWithGemini(prompt, aspectRatio = '16:9') {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GOOGLE_AI_API_KEY}`;
  
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: { aspectRatio, imageSize: '2K' }
    }
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google API error: ${response.status} - ${errorText.substring(0, 200)}`);
  }
  
  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find(part => part.inlineData?.mimeType?.startsWith('image/'));
  
  if (!imagePart) {
    throw new Error('No image in response');
  }
  
  return {
    buffer: Buffer.from(imagePart.inlineData.data, 'base64'),
    mimeType: imagePart.inlineData.mimeType,
  };
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const { put } = await import('@vercel/blob');
  const { createClient } = await import('@supabase/supabase-js');
  
  if (!GOOGLE_AI_API_KEY) {
    console.error('Error: GOOGLE_AI_API_KEY not found in environment');
    process.exit(1);
  }
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Parse arguments
  const args = process.argv.slice(2);
  const options = {
    limit: 30,
    slug: null,
    dryRun: false,
    inlineOnly: false,
    heroOnly: false,
  };
  
  for (const arg of args) {
    if (arg.startsWith('--limit=')) options.limit = parseInt(arg.split('=')[1]);
    else if (arg.startsWith('--slug=')) options.slug = arg.split('=')[1];
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--inline-only') options.inlineOnly = true;
    else if (arg === '--hero-only') options.heroOnly = true;
  }
  
  console.log('🍌 Article Image Generator (Google Gemini Nano Banana Pro)');
  console.log('='.repeat(60));
  console.log(`Mode: ${options.heroOnly ? 'Hero only' : options.inlineOnly ? 'Inline only' : 'Full (Hero + Inline)'}`);
  console.log(`Options: limit=${options.limit}, dry-run=${options.dryRun}`);
  console.log('');
  
  // Fetch articles based on mode
  let query;
  
  if (options.slug) {
    query = supabase
      .from('al_articles')
      .select('id, slug, title, category, car_slugs, hero_image_url, inline_images')
      .eq('slug', options.slug);
  } else if (options.inlineOnly) {
    // Articles with hero but no inline images
    query = supabase
      .from('al_articles')
      .select('id, slug, title, category, car_slugs, hero_image_url, inline_images')
      .not('hero_image_url', 'is', null)
      .eq('is_published', true)
      .or('inline_images.is.null,inline_images.eq.[]')
      .order('published_at', { ascending: false });
  } else {
    // Articles without hero image
    query = supabase
      .from('al_articles')
      .select('id, slug, title, category, car_slugs, hero_image_url, inline_images')
      .is('hero_image_url', null)
      .eq('is_published', true)
      .order('published_at', { ascending: false });
  }
  
  const { data: articles, error } = await query.limit(options.limit);
  
  if (error) {
    console.error('Error fetching articles:', error.message);
    process.exit(1);
  }
  
  if (!articles || articles.length === 0) {
    console.log('✅ No articles need images');
    process.exit(0);
  }
  
  console.log(`Found ${articles.length} articles to process:\n`);
  
  const results = { success: [], failed: [] };
  
  for (const article of articles) {
    console.log(`\n📝 ${article.title}`);
    console.log(`   Slug: ${article.slug}`);
    console.log(`   Category: ${article.category}`);
    
    if (options.dryRun) {
      console.log(`   Hero prompt: ${generateHeroPrompt(article).slice(0, 80)}...`);
      results.success.push(article.slug);
      continue;
    }
    
    try {
      let heroUrl = article.hero_image_url;
      const inlineImages = [];
      
      // Generate hero image if needed
      if (!options.inlineOnly && !heroUrl) {
        console.log('   ⏳ Generating hero image...');
        const heroPrompt = generateHeroPrompt(article);
        const { buffer, mimeType } = await generateImageWithGemini(heroPrompt);
        
        const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
        const blob = await put(`articles/${article.slug}/hero.${ext}`, buffer, {
          access: 'public',
          contentType: mimeType,
        });
        
        heroUrl = blob.url;
        console.log(`   ✅ Hero: ${heroUrl.slice(0, 50)}...`);
        
        // Update hero in database immediately
        await supabase
          .from('al_articles')
          .update({ hero_image_url: heroUrl })
          .eq('id', article.id);
        
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
      
      // Generate inline images if needed
      if (!options.heroOnly) {
        const inlinePrompts = generateInlinePrompts(article);
        
        for (let i = 0; i < inlinePrompts.length; i++) {
          const { prompt, alt, position } = inlinePrompts[i];
          
          console.log(`   ⏳ Generating inline ${position}/${inlinePrompts.length}...`);
          
          try {
            const { buffer, mimeType } = await generateImageWithGemini(prompt);
            
            const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
            const blob = await put(`articles/${article.slug}/inline-${position}.${ext}`, buffer, {
              access: 'public',
              contentType: mimeType,
            });
            
            inlineImages.push({
              url: blob.url,
              alt,
              position,
            });
            
            console.log(`   ✅ Inline ${position}: ${blob.url.slice(0, 50)}...`);
          } catch (inlineErr) {
            console.log(`   ⚠️ Inline ${position} failed: ${inlineErr.message}`);
          }
          
          if (i < inlinePrompts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, DELAY_MS));
          }
        }
        
        // Update inline images in database
        if (inlineImages.length > 0) {
          await supabase
            .from('al_articles')
            .update({ inline_images: inlineImages })
            .eq('id', article.id);
          
          console.log(`   ✅ Saved ${inlineImages.length} inline images to database`);
        }
      }
      
      results.success.push(article.slug);
      
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
      results.failed.push({ slug: article.slug, error: err.message });
    }
    
    // Delay before next article
    console.log('   ⏳ Waiting before next article...');
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Summary:');
  console.log(`  ✅ Success: ${results.success.length}`);
  console.log(`  ❌ Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('\nFailed articles:');
    for (const f of results.failed) {
      console.log(`  - ${f.slug}: ${f.error}`);
    }
  }
}

main().catch(console.error);
