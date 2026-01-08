/**
 * Article QA Cron Job
 * 
 * Daily automated QA for articles:
 * - Validates content length (1500-2000 words)
 * - Auto-expands short articles
 * - Analyzes image quality
 * - Regenerates failed images using DALL-E 3
 * 
 * Endpoints:
 * - GET: Run full QA on pending articles
 * - POST: Run QA with options (specific article, mode)
 * 
 * Cron schedule: Daily at 3 AM UTC
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

// Verify cron secret
const CRON_SECRET = process.env.CRON_SECRET;

// QA Configuration
const QA_CONFIG = {
  content: { minWords: 1500, maxWords: 2000, targetWords: 1750 },
  image: { autoApproveThreshold: 75, maxRegenerationAttempts: 2 },
  maxArticlesPerRun: 5, // Limit per run to avoid timeouts
};

// Initialize clients
let supabase, anthropic, openai;

function getClients() {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return { supabase, anthropic, openai };
}

// Helper functions
function calculateWordCount(html) {
  if (!html) return 0;
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(w => w.length > 0).length;
}

function detectImageType(buffer) {
  const bytes = new Uint8Array(buffer.slice(0, 4));
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'image/png';
  if (bytes[0] === 0xFF && bytes[1] === 0xD8) return 'image/jpeg';
  return 'image/jpeg';
}

// Content expansion
async function expandContent(article) {
  const { anthropic, supabase } = getClients();
  const currentWords = calculateWordCount(article.content_html);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    system: `You are AL, AutoRev's AI automotive expert. Write comprehensive articles. NO fluff. Output ONLY HTML.`,
    messages: [{
      role: 'user',
      content: `Expand to ${QA_CONFIG.content.targetWords} words:

ARTICLE: ${article.title}
CATEGORY: ${article.category}
CURRENT: ${currentWords} words

CONTENT:
${article.content_html}

Add depth, data, actionable advice. Output ONLY HTML.`
    }],
  });

  const expanded = response.content[0].text.trim();
  const newWords = calculateWordCount(expanded);

  await supabase
    .from('al_articles')
    .update({
      content_html: expanded,
      read_time_minutes: Math.ceil(newWords / 200),
      updated_at: new Date().toISOString(),
    })
    .eq('id', article.id);

  return { oldWords: currentWords, newWords };
}

// Image QA
async function analyzeImage(imageUrl, title) {
  const { anthropic } = getClients();
  
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const mediaType = detectImageType(buffer);

  const result = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
        { type: 'text', text: `Score this car image 0-100. Car completeness, accuracy, realism, composition, quality. Return JSON: {"score":<0-100>,"issues":"<brief>"}` },
      ],
    }],
  });

  const json = result.content[0].text.match(/\{[\s\S]*\}/);
  return json ? JSON.parse(json[0]) : { score: 0, issues: 'Parse failed' };
}

// Image generation
async function generateImage(article, attempt = 1) {
  const { openai } = getClients();
  
  let prompt = `Professional automotive photography: ${article.title.substring(0, 80)}. Full vehicle visible, magazine quality, photorealistic.`;
  prompt += ` CRITICAL: Complete car - all wheels, bumpers visible. No cropping.`;
  if (attempt > 1) prompt += ` Variation ${attempt}.`;

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1792x1024',
    quality: 'hd',
    style: 'natural',
  });

  return response.data[0].url;
}

// Main QA function
async function runArticleQA(article) {
  const { supabase } = getClients();
  const result = { id: article.id, title: article.title, content: null, image: null };

  // Content QA
  const wordCount = calculateWordCount(article.content_html);
  if (wordCount < QA_CONFIG.content.minWords) {
    try {
      const expansion = await expandContent(article);
      result.content = { status: 'expanded', ...expansion };
    } catch (err) {
      result.content = { status: 'failed', error: err.message };
    }
  } else {
    result.content = { status: 'ok', wordCount };
  }

  // Image QA
  if (article.hero_image_url && article.image_qa_status !== 'approved') {
    try {
      const analysis = await analyzeImage(article.hero_image_url, article.title);
      
      if (analysis.score >= QA_CONFIG.image.autoApproveThreshold) {
        await supabase
          .from('al_articles')
          .update({ image_qa_status: 'approved', image_qa_score: analysis.score })
          .eq('id', article.id);
        result.image = { status: 'approved', score: analysis.score };
      } else {
        // Try regeneration
        for (let i = 1; i <= QA_CONFIG.image.maxRegenerationAttempts; i++) {
          const newUrl = await generateImage(article, i);
          const newAnalysis = await analyzeImage(newUrl, article.title);
          
          if (newAnalysis.score >= QA_CONFIG.image.autoApproveThreshold) {
            // Upload to blob
            const imgResponse = await fetch(newUrl);
            const imgBuffer = await imgResponse.arrayBuffer();
            const blob = await put(`articles/${article.slug}/hero-${Date.now()}.webp`, Buffer.from(imgBuffer), {
              access: 'public',
              contentType: 'image/webp',
            });

            await supabase
              .from('al_articles')
              .update({
                hero_image_url: blob.url,
                image_qa_status: 'approved',
                image_qa_score: newAnalysis.score,
              })
              .eq('id', article.id);

            result.image = { status: 'regenerated', score: newAnalysis.score, attempt: i };
            break;
          }
        }
        
        if (!result.image) {
          await supabase
            .from('al_articles')
            .update({ image_qa_status: 'rejected', image_qa_score: analysis.score })
            .eq('id', article.id);
          result.image = { status: 'failed', score: analysis.score };
        }
      }
    } catch (err) {
      result.image = { status: 'error', error: err.message };
    }
  }

  return result;
}

// GET handler - run QA on pending articles
export async function GET(request) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { supabase } = getClients();

    // Get articles needing QA
    const { data: articles, error } = await supabase
      .from('al_articles')
      .select('*')
      .eq('is_published', true)
      .or('image_qa_status.eq.pending,image_qa_status.is.null')
      .order('created_at', { ascending: true })
      .limit(QA_CONFIG.maxArticlesPerRun);

    if (error) throw error;

    // Also check for short articles
    const { data: allArticles } = await supabase
      .from('al_articles')
      .select('id, title, slug, category, content_html, hero_image_url, image_qa_status')
      .eq('is_published', true);

    const shortArticles = allArticles?.filter(a => 
      calculateWordCount(a.content_html) < QA_CONFIG.content.minWords
    ).slice(0, QA_CONFIG.maxArticlesPerRun) || [];

    // Combine unique articles
    const toProcess = [...articles];
    for (const short of shortArticles) {
      if (!toProcess.find(a => a.id === short.id)) {
        toProcess.push(short);
      }
    }

    if (toProcess.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No articles need QA',
        stats: { processed: 0 }
      });
    }

    // Run QA
    const results = [];
    for (const article of toProcess.slice(0, QA_CONFIG.maxArticlesPerRun)) {
      const result = await runArticleQA(article);
      results.push(result);
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('Article QA cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST handler - run QA with options
export async function POST(request) {
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { articleSlug, mode = 'full' } = body;

    const { supabase } = getClients();

    let query = supabase
      .from('al_articles')
      .select('*')
      .eq('is_published', true);

    if (articleSlug) {
      query = query.eq('slug', articleSlug);
    }

    const { data: articles, error } = await query.limit(articleSlug ? 1 : QA_CONFIG.maxArticlesPerRun);
    if (error) throw error;

    const results = [];
    for (const article of articles) {
      const result = await runArticleQA(article);
      results.push(result);
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

