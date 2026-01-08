/**
 * Article Image Generation Cron Job
 * 
 * Generates images for articles:
 * - Hero images for articles missing them
 * - Inline images (3 per article) for articles with hero but no inline
 * 
 * Runs daily to backfill any articles that failed image generation.
 * Limited to ~3-4 articles per run to stay within timeout.
 * 
 * Schedule: 0 6 * * * (6am daily)
 * 
 * @route GET /api/cron/article-images
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createArticleHeroImage, createArticleInlineImages } from '@/lib/articleImageService';

// Verify cron secret
const CRON_SECRET = process.env.CRON_SECRET;

export const maxDuration = 300; // 5 minute timeout
export const dynamic = 'force-dynamic';

export async function GET(request) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Parse query params for mode
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'all'; // 'all', 'hero', 'inline'
  const limit = parseInt(searchParams.get('limit') || '3');
  
  console.log(`[ArticleImages] Starting image generation (mode=${mode}, limit=${limit})...`);
  
  const results = {
    success: true,
    mode,
    processed: 0,
    heroes: { succeeded: 0, failed: 0 },
    inlines: { succeeded: 0, failed: 0 },
    failed: [],
  };
  
  try {
    // ==========================================================================
    // PHASE 1: Generate Hero Images
    // ==========================================================================
    
    if (mode === 'all' || mode === 'hero') {
      const { data: needsHero, error: heroError } = await supabase
        .from('al_articles')
        .select('id, slug, title, category, car_slugs')
        .is('hero_image_url', null)
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(limit);
      
      if (heroError) {
        console.error('[ArticleImages] Hero fetch error:', heroError);
      } else if (needsHero && needsHero.length > 0) {
        console.log(`[ArticleImages] Generating hero images for ${needsHero.length} articles...`);
        
        for (const article of needsHero) {
          results.processed++;
          
          try {
            const imageResult = await createArticleHeroImage(article);
            
            if (imageResult.success && imageResult.imageUrl) {
              await supabase
                .from('al_articles')
                .update({ hero_image_url: imageResult.imageUrl })
                .eq('id', article.id);
              
              results.heroes.succeeded++;
              console.log(`[ArticleImages] ✅ Hero for: ${article.slug}`);
            } else {
              results.heroes.failed++;
              results.failed.push({
                slug: article.slug,
                type: 'hero',
                error: imageResult.error || 'Unknown error',
              });
            }
            
            // Delay between generations (5s for Google rate limit)
            await new Promise(resolve => setTimeout(resolve, 5000));
          } catch (err) {
            results.heroes.failed++;
            results.failed.push({
              slug: article.slug,
              type: 'hero',
              error: err.message,
            });
          }
        }
      } else {
        console.log('[ArticleImages] No articles need hero images');
      }
    }
    
    // ==========================================================================
    // PHASE 2: Generate Inline Images
    // ==========================================================================
    
    if (mode === 'all' || mode === 'inline') {
      // Get articles with hero but no inline images
      const { data: needsInline, error: inlineError } = await supabase
        .from('al_articles')
        .select('id, slug, title, category, car_slugs')
        .not('hero_image_url', 'is', null)
        .eq('is_published', true)
        .or('inline_images.is.null,inline_images.eq.[]')
        .order('published_at', { ascending: false })
        .limit(limit);
      
      if (inlineError) {
        console.error('[ArticleImages] Inline fetch error:', inlineError);
      } else if (needsInline && needsInline.length > 0) {
        console.log(`[ArticleImages] Generating inline images for ${needsInline.length} articles...`);
        
        for (const article of needsInline) {
          results.processed++;
          
          try {
            const inlineResult = await createArticleInlineImages(article, 3, 5000);
            
            if (inlineResult.success && inlineResult.images.length > 0) {
              await supabase
                .from('al_articles')
                .update({ inline_images: inlineResult.images })
                .eq('id', article.id);
              
              results.inlines.succeeded++;
              console.log(`[ArticleImages] ✅ ${inlineResult.images.length} inline for: ${article.slug}`);
            } else {
              results.inlines.failed++;
              results.failed.push({
                slug: article.slug,
                type: 'inline',
                error: 'No inline images generated',
              });
            }
            
            // Short delay before next article
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (err) {
            results.inlines.failed++;
            results.failed.push({
              slug: article.slug,
              type: 'inline',
              error: err.message,
            });
          }
        }
      } else {
        console.log('[ArticleImages] No articles need inline images');
      }
    }
    
    // ==========================================================================
    // Get remaining counts
    // ==========================================================================
    
    const [{ count: needsHeroCount }, { count: needsInlineCount }] = await Promise.all([
      supabase
        .from('al_articles')
        .select('id', { count: 'exact', head: true })
        .is('hero_image_url', null)
        .eq('is_published', true),
      supabase
        .from('al_articles')
        .select('id', { count: 'exact', head: true })
        .not('hero_image_url', 'is', null)
        .eq('is_published', true)
        .or('inline_images.is.null,inline_images.eq.[]'),
    ]);
    
    results.remaining = {
      hero: needsHeroCount || 0,
      inline: needsInlineCount || 0,
    };
    
    console.log(`[ArticleImages] Complete: ${results.heroes.succeeded} heroes, ${results.inlines.succeeded} inlines`);
    console.log(`[ArticleImages] Remaining: ${results.remaining.hero} need hero, ${results.remaining.inline} need inline`);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('[ArticleImages] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
