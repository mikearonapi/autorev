/**
 * AL Optimization Cron Job
 * 
 * Weekly job to ensure AL has the best possible knowledge base:
 * 1. Generate missing embeddings for cars, insights, etc.
 * 2. Re-index YouTube transcripts that haven't been chunked
 * 3. Refresh internal documentation
 * 4. Generate ai_searchable_text for cars missing it
 * 5. Sync community insights embeddings
 * 
 * Schedule: Weekly (Sundays at 3am UTC)
 * Duration: ~10-30 minutes depending on backlog
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding, toPgVectorLiteral, chunkText, isEmbeddingConfigured } from '@/lib/embeddingUtils';
import { notifyCronEnrichment, notifyCronError } from '@/lib/discord';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

/**
 * GET handler for cron job
 */
export async function GET(request) {
  const startTime = Date.now();
  
  // Auth check
  const authHeader = request.headers.get('authorization');
  const cronHeader = request.headers.get('x-vercel-cron');
  
  if (!cronHeader && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  if (!isEmbeddingConfigured()) {
    return NextResponse.json({ error: 'OpenAI not configured for embeddings' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const results = {
    carEmbeddings: { processed: 0, success: 0, failed: 0 },
    insightEmbeddings: { processed: 0, success: 0, failed: 0 },
    aiSearchableText: { processed: 0, success: 0, failed: 0 },
    youtubeChunking: { processed: 0, chunks: 0 },
    errors: []
  };

  try {
    console.log('[AL-Optimization] Starting weekly optimization...');

    // ============================================
    // STEP 1: Generate missing car embeddings
    // ============================================
    console.log('\n[AL-Optimization] Step 1: Car embeddings...');
    
    const { data: carsNeedingEmbedding } = await supabase
      .from('cars')
      .select('id, slug, name, ai_searchable_text')
      .is('embedding', null)
      .not('ai_searchable_text', 'is', null)
      .limit(50); // Process 50 per run to avoid timeout

    for (const car of carsNeedingEmbedding || []) {
      results.carEmbeddings.processed++;
      try {
        const text = car.ai_searchable_text || `${car.name}`;
        const embeddingResult = await generateEmbedding(text.slice(0, 8000));
        
        if (embeddingResult.embedding) {
          const pgVec = toPgVectorLiteral(embeddingResult.embedding);
          await supabase
            .from('cars')
            .update({ 
              embedding: pgVec,
              embedding_model: embeddingResult.model,
              embedding_updated_at: new Date().toISOString()
            })
            .eq('id', car.id);
          
          results.carEmbeddings.success++;
          console.log(`   ✓ Embedded: ${car.slug}`);
        } else {
          results.carEmbeddings.failed++;
          console.log(`   ✗ Failed: ${car.slug} - ${embeddingResult.error}`);
        }
      } catch (err) {
        results.carEmbeddings.failed++;
        results.errors.push({ phase: 'car_embedding', slug: car.slug, error: err.message });
      }
      
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 100));
    }

    // ============================================
    // STEP 2: Generate missing insight embeddings
    // ============================================
    console.log('\n[AL-Optimization] Step 2: Insight embeddings...');
    
    const { data: insightsNeedingEmbedding } = await supabase
      .from('community_insights')
      .select('id, title, summary, details, embedding_text')
      .is('embedding', null)
      .limit(100); // Process 100 per run

    for (const insight of insightsNeedingEmbedding || []) {
      results.insightEmbeddings.processed++;
      try {
        // Generate embedding text if not present
        const embeddingText = insight.embedding_text || 
          `${insight.title || ''} ${insight.summary || ''} ${insight.details || ''}`.trim();
        
        if (embeddingText.length < 50) continue;
        
        const embeddingResult = await generateEmbedding(embeddingText.slice(0, 8000));
        
        if (embeddingResult.embedding) {
          const pgVec = toPgVectorLiteral(embeddingResult.embedding);
          await supabase
            .from('community_insights')
            .update({ 
              embedding: pgVec,
              embedding_text: embeddingText,
              embedding_model: embeddingResult.model
            })
            .eq('id', insight.id);
          
          results.insightEmbeddings.success++;
        } else {
          results.insightEmbeddings.failed++;
        }
      } catch (err) {
        results.insightEmbeddings.failed++;
        results.errors.push({ phase: 'insight_embedding', id: insight.id, error: err.message });
      }
      
      await new Promise(r => setTimeout(r, 50));
    }

    // ============================================
    // STEP 3: Generate ai_searchable_text for cars missing it
    // ============================================
    console.log('\n[AL-Optimization] Step 3: AI searchable text...');
    
    const { data: carsMissingText } = await supabase
      .from('cars')
      .select(`
        id, slug, name, brand, years, category, tier,
        engine, hp, torque, trans, drivetrain,
        notes, highlight, tagline, hero_blurb,
        defining_strengths, honest_weaknesses,
        score_sound, score_interior, score_track, 
        score_reliability, score_value, score_driver_fun, score_aftermarket
      `)
      .or('ai_searchable_text.is.null,ai_searchable_text.eq.')
      .limit(30);

    for (const car of carsMissingText || []) {
      results.aiSearchableText.processed++;
      try {
        // Build comprehensive searchable text
        const parts = [
          car.name,
          car.brand,
          car.years,
          car.category,
          car.engine,
          car.notes,
          car.highlight,
          car.tagline,
          car.hero_blurb,
        ].filter(Boolean);

        // Add strengths and weaknesses
        if (car.defining_strengths) {
          const strengths = Array.isArray(car.defining_strengths) 
            ? car.defining_strengths.map(s => typeof s === 'object' ? s.title : s).join(', ')
            : '';
          if (strengths) parts.push(`Strengths: ${strengths}`);
        }
        
        if (car.honest_weaknesses) {
          const weaknesses = Array.isArray(car.honest_weaknesses)
            ? car.honest_weaknesses.map(w => typeof w === 'object' ? w.title : w).join(', ')
            : '';
          if (weaknesses) parts.push(`Weaknesses: ${weaknesses}`);
        }

        // Add performance summary
        if (car.hp) parts.push(`${car.hp} horsepower`);
        if (car.torque) parts.push(`${car.torque} lb-ft torque`);
        if (car.drivetrain) parts.push(`${car.drivetrain} drivetrain`);

        const aiSearchableText = parts.join(' ').trim();
        
        if (aiSearchableText.length > 100) {
          await supabase
            .from('cars')
            .update({ ai_searchable_text: aiSearchableText })
            .eq('id', car.id);
          
          results.aiSearchableText.success++;
          console.log(`   ✓ Generated AI text: ${car.slug}`);
        }
      } catch (err) {
        results.aiSearchableText.failed++;
        results.errors.push({ phase: 'ai_searchable_text', slug: car.slug, error: err.message });
      }
    }

    // ============================================
    // STEP 4: Index new YouTube transcripts
    // ============================================
    console.log('\n[AL-Optimization] Step 4: YouTube transcript chunking...');
    
    // Find videos with transcripts that haven't been chunked yet
    const { data: unchunkedVideos } = await supabase
      .from('youtube_videos')
      .select('id, video_id, title, transcript_text')
      .eq('processing_status', 'processed')
      .not('transcript_text', 'is', null)
      .gt('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .limit(20);

    // Check which ones don't have chunks yet
    for (const video of unchunkedVideos || []) {
      const { count } = await supabase
        .from('document_chunks')
        .select('id', { count: 'exact', head: true })
        .eq('topic', 'youtube_transcript')
        .ilike('metadata->>video_id', video.video_id);
      
      if (count === 0 && video.transcript_text && video.transcript_text.length > 500) {
        results.youtubeChunking.processed++;
        
        try {
          // Chunk the transcript
          const chunks = chunkText(video.transcript_text, { maxChars: 1200, overlapChars: 150 });
          
          for (let i = 0; i < chunks.length; i++) {
            const embeddingResult = await generateEmbedding(chunks[i]);
            if (!embeddingResult.embedding) continue;
            
            const pgVec = toPgVectorLiteral(embeddingResult.embedding);
            
            await supabase.from('document_chunks').insert({
              topic: 'youtube_transcript',
              chunk_index: i,
              chunk_text: chunks[i],
              chunk_tokens: Math.ceil(chunks[i].length / 4),
              embedding_model: embeddingResult.model,
              embedding: pgVec,
              metadata: {
                video_id: video.video_id,
                title: video.title,
                source_type: 'youtube_video'
              }
            });
            
            results.youtubeChunking.chunks++;
          }
          
          console.log(`   ✓ Chunked video: ${video.title?.slice(0, 40)}... (${chunks.length} chunks)`);
        } catch (err) {
          results.errors.push({ phase: 'youtube_chunking', video_id: video.video_id, error: err.message });
        }
        
        await new Promise(r => setTimeout(r, 200));
      }
    }

    // ============================================
    // Log summary
    // ============================================
    const duration = Date.now() - startTime;
    
    console.log('\n[AL-Optimization] Complete!');
    console.log(`   Car embeddings: ${results.carEmbeddings.success}/${results.carEmbeddings.processed}`);
    console.log(`   Insight embeddings: ${results.insightEmbeddings.success}/${results.insightEmbeddings.processed}`);
    console.log(`   AI searchable text: ${results.aiSearchableText.success}/${results.aiSearchableText.processed}`);
    console.log(`   YouTube chunks: ${results.youtubeChunking.chunks} from ${results.youtubeChunking.processed} videos`);
    console.log(`   Duration: ${(duration / 1000).toFixed(1)}s`);

    // Send Discord notification
    notifyCronEnrichment('AL Knowledge Base Optimization', {
      duration,
      table: 'multiple',
      recordsProcessed: 
        results.carEmbeddings.processed + 
        results.insightEmbeddings.processed + 
        results.aiSearchableText.processed +
        results.youtubeChunking.processed,
      recordsAdded: results.youtubeChunking.chunks,
      errors: results.errors.length,
      details: [
        { label: '🚗 Car Embeddings', value: `${results.carEmbeddings.success}/${results.carEmbeddings.processed}` },
        { label: '💡 Insight Embeddings', value: `${results.insightEmbeddings.success}/${results.insightEmbeddings.processed}` },
        { label: '📝 AI Search Text', value: `${results.aiSearchableText.success}/${results.aiSearchableText.processed}` },
        { label: '🎬 YouTube Chunks', value: results.youtubeChunking.chunks },
      ]
    });

    return NextResponse.json({
      success: true,
      duration,
      results,
      message: 'AL optimization complete'
    });

  } catch (error) {
    console.error('[AL-Optimization] Fatal error:', error);
    
    notifyCronError('al-optimization', error.message, {
      partialResults: results,
      duration: Date.now() - startTime
    });

    return NextResponse.json({
      success: false,
      error: error.message,
      partialResults: results
    }, { status: 500 });
  }
}

