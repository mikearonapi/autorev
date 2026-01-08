/**
 * Daily Article Research Cron Job
 * 
 * Runs daily at midnight (before 5am write / 8am publish) to:
 * 1. Check if pipeline needs refilling (< 21 ideas = 3 weeks)
 * 2. Research trending automotive topics using Exa
 * 3. Generate new article ideas for categories with low pipeline
 * 4. Save ideas to article_pipeline for consumption by article-write cron
 * 
 * Schedule: 0 0 * * * (midnight daily)
 * 
 * Pipeline Flow:
 *   article-research (midnight) → article-write (5am) → article-images (6am) → article-publish (8am)
 * 
 * @route GET /api/cron/article-research
 */

import { NextResponse } from 'next/server';
import { researchCategoryTopics, savePipelineToDatabase } from '@/lib/articleResearchService';
import { supabase } from '@/lib/supabase';

// Verify cron secret
const CRON_SECRET = process.env.CRON_SECRET;

// Minimum ideas in pipeline before refilling
const MIN_PIPELINE_SIZE = 21; // 3 weeks of daily articles
const IDEAS_TO_GENERATE = 7;  // 1 week of ideas per category

export const maxDuration = 300; // 5 minute timeout
export const dynamic = 'force-dynamic';

export async function GET(request) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  console.log('[ArticleResearch] Starting daily research check...');
  
  const startTime = Date.now();
  const results = {
    success: false,
    action: 'none',
    pipelineStatus: {
      current: 0,
      threshold: MIN_PIPELINE_SIZE,
    },
    ideasGenerated: 0,
    errors: [],
  };
  
  try {
    // 1. Check current pipeline size (unpublished articles + pending ideas)
    const { count: queueSize } = await supabase
      .from('al_articles')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', false)
      .not('content_html', 'is', null);
    
    // Check pending ideas in pipeline that haven't been written yet
    const { data: pendingPipeline } = await supabase
      .from('article_pipeline')
      .select('pipeline_data, articles_published, articles_total')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);
    
    const pendingIdeasCount = pendingPipeline?.[0] 
      ? (pendingPipeline[0].articles_total - pendingPipeline[0].articles_published)
      : 0;
    
    const totalPipelineSize = (queueSize || 0) + pendingIdeasCount;
    results.pipelineStatus.current = totalPipelineSize;
    
    console.log(`[ArticleResearch] Pipeline status: ${totalPipelineSize} ideas (threshold: ${MIN_PIPELINE_SIZE})`);
    
    // 2. Skip if pipeline is healthy
    if (totalPipelineSize >= MIN_PIPELINE_SIZE) {
      console.log('[ArticleResearch] Pipeline healthy, skipping research');
      results.success = true;
      results.action = 'skipped_pipeline_healthy';
      return NextResponse.json(results);
    }
    
    // 3. Generate new ideas for each category
    console.log('[ArticleResearch] Pipeline low, generating new ideas...');
    results.action = 'generating_ideas';
    
    const pipeline = {
      generatedAt: new Date().toISOString(),
      month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      categories: {},
      totalArticles: 0,
    };
    
    // Research each category
    for (const category of ['comparisons', 'enthusiast', 'technical']) {
      console.log(`[ArticleResearch] Researching ${category}...`);
      
      const ideas = await researchCategoryTopics(category, IDEAS_TO_GENERATE);
      pipeline.categories[category] = ideas;
      pipeline.totalArticles += ideas.length;
      
      // Delay between categories to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    results.ideasGenerated = pipeline.totalArticles;
    
    if (pipeline.totalArticles === 0) {
      results.errors.push('Failed to generate any article ideas');
      return NextResponse.json(results, { status: 500 });
    }
    
    // 4. Save pipeline to database
    const saveResult = await savePipelineToDatabase(pipeline);
    if (!saveResult.success) {
      console.warn('[ArticleResearch] Could not save to article_pipeline:', saveResult.error);
      // Non-fatal - pipeline table might not exist
    }
    
    results.success = true;
    results.duration = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
    results.pipelineStatus.new = totalPipelineSize + pipeline.totalArticles;
    
    console.log(`[ArticleResearch] Complete: Generated ${pipeline.totalArticles} new ideas`);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('[ArticleResearch] Error:', error);
    results.errors.push(error.message);
    return NextResponse.json(results, { status: 500 });
  }
}

