/**
 * Daily Article Publish Cron Job
 * 
 * Runs daily at 8am to publish one article from the queue.
 * Articles are pulled in FIFO order from unpublished drafts.
 * 
 * Schedule: 0 8 * * * (8am daily)
 * 
 * @route GET /api/cron/article-publish
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Verify cron secret
const CRON_SECRET = process.env.CRON_SECRET;

export const dynamic = 'force-dynamic';

export async function GET(request) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  console.log('[ArticlePublish] Starting daily publish...');
  
  try {
    // 1. Get next article to publish
    const { data: article, error: fetchError } = await supabase
      .from('al_articles')
      .select('id, slug, title, category')
      .eq('is_published', false)
      .not('content_html', 'is', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();
    
    if (fetchError || !article) {
      console.log('[ArticlePublish] No articles in queue to publish');
      return NextResponse.json({
        success: true,
        message: 'No articles in queue',
        published: null,
      });
    }
    
    // 2. Publish the article
    const { error: publishError } = await supabase
      .from('al_articles')
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .eq('id', article.id);
    
    if (publishError) {
      console.error('[ArticlePublish] Publish error:', publishError);
      return NextResponse.json({
        success: false,
        error: publishError.message,
      }, { status: 500 });
    }
    
    // 3. Update pipeline counter
    const { data: pipeline } = await supabase
      .from('article_pipeline')
      .select('id')
      .eq('status', 'in_progress')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();
    
    if (pipeline) {
      await supabase
        .from('article_pipeline')
        .update({ articles_published: supabase.raw('articles_published + 1') })
        .eq('id', pipeline.id);
    }
    
    // 4. Get queue status
    const { count: queueCount } = await supabase
      .from('al_articles')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', false)
      .not('content_html', 'is', null);
    
    console.log(`[ArticlePublish] Published: ${article.title}`);
    console.log(`[ArticlePublish] Remaining in queue: ${queueCount || 0}`);
    
    return NextResponse.json({
      success: true,
      published: {
        id: article.id,
        slug: article.slug,
        title: article.title,
        category: article.category,
        url: `/articles/${article.category}/${article.slug}`,
      },
      queueRemaining: queueCount || 0,
    });
  } catch (error) {
    console.error('[ArticlePublish] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

