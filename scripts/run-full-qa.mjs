#!/usr/bin/env node

/**
 * Full Article QA Pipeline
 * 
 * Comprehensive QA for all articles including:
 * - Content length validation (1500-2000 words)
 * - Auto-expansion of short articles
 * - Image quality analysis
 * - Auto-regeneration of failed images using DALL-E 3
 * 
 * Usage:
 *   node scripts/run-full-qa.mjs                    # Run QA on all articles
 *   node scripts/run-full-qa.mjs --article <slug>   # Run QA on specific article
 *   node scripts/run-full-qa.mjs --content-only     # Only check/fix content
 *   node scripts/run-full-qa.mjs --images-only      # Only check/fix images
 *   node scripts/run-full-qa.mjs --report           # Generate status report
 *   node scripts/run-full-qa.mjs --no-fix           # Analyze only, don't auto-fix
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { put } from '@vercel/blob';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env.local') });

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// QA Configuration
const QA_CONFIG = {
  content: {
    minWords: 1500,
    maxWords: 2000,
    targetWords: 1750,
  },
  image: {
    autoApproveThreshold: 75,
    autoRejectThreshold: 45,
    maxRegenerationAttempts: 3,
  },
  dates: {
    currentYear: new Date().getFullYear(),
    outdatedYears: () => {
      const current = new Date().getFullYear();
      return [current - 2, current - 3, current - 4]; // 2024, 2023, 2022 if current is 2026
    },
  },
};

/**
 * Get context-appropriate cars for budget articles
 */
function getContextAppropriateCars(title) {
  const priceMatch = title.match(/under\s*\$?(\d+)k?/i) || title.match(/\$?(\d+)k?\s*budget/i);
  if (priceMatch) {
    const maxPrice = parseInt(priceMatch[1]) * (priceMatch[1].length <= 3 ? 1000 : 1);
    if (maxPrice <= 30000) return ['Mazda MX-5 Miata', 'Toyota GR86', 'Subaru BRZ', 'VW Golf GTI'];
    if (maxPrice <= 50000) return ['Toyota GR Supra', 'Nissan Z', 'Ford Mustang GT', 'BMW M240i', 'Porsche Boxster'];
    if (maxPrice <= 75000) return ['BMW M3', 'Porsche Cayman S', 'Corvette Stingray', 'Ford Mustang GT350'];
    if (maxPrice <= 100000) return ['Porsche 911 Carrera', 'BMW M5', 'Nissan GT-R', 'Corvette Z06'];
  }
  if (title.toLowerCase().includes('jdm')) return ['Nissan GT-R', 'Toyota Supra', 'Honda NSX', 'Mazda RX-7'];
  if (title.toLowerCase().includes('first sports car')) return ['Mazda MX-5 Miata', 'Toyota GR86', 'Ford Mustang EcoBoost'];
  return null;
}

/**
 * Build context hints for image relevance checking
 */
function buildContextHints(title, category) {
  const hints = [];
  const priceMatch = title.match(/under\s*\$?(\d+)k?/i);
  if (priceMatch) {
    const maxPrice = parseInt(priceMatch[1]) * (priceMatch[1].length <= 3 ? 1000 : 1);
    hints.push(`PRICE CONSTRAINT: Cars must be under $${maxPrice.toLocaleString()}`);
    hints.push(`REJECT if showing supercars or vehicles >2x the budget (Ford GT, McLaren, Ferrari, Lamborghini for budget articles)`);
    const appropriateCars = getContextAppropriateCars(title);
    if (appropriateCars) hints.push(`EXPECTED CARS: ${appropriateCars.join(', ')}`);
  }
  if (title.toLowerCase().includes('jdm')) {
    hints.push('EXPECTED: Japanese cars only (Nissan, Toyota, Honda, Mazda, Subaru)');
    hints.push('REJECT if: European or American cars shown');
  }
  return hints.length > 0 ? hints.join('\n') : null;
}

/**
 * Check for outdated year references
 */
function checkOutdatedYears(content, title) {
  const issues = [];
  const outdated = QA_CONFIG.dates.outdatedYears();
  const fullText = `${title} ${content.replace(/<[^>]*>/g, ' ')}`;
  
  for (const year of outdated) {
    const regex = new RegExp(`\\b(in|as of|for|the|new|latest|current)\\s*${year}\\b`, 'gi');
    const matches = fullText.match(regex);
    if (matches) issues.push({ year, count: matches.length });
  }
  return issues;
}

/**
 * Fix outdated year references
 */
function fixOutdatedYears(content) {
  const currentYear = QA_CONFIG.dates.currentYear;
  let fixed = content;
  for (const year of QA_CONFIG.dates.outdatedYears()) {
    fixed = fixed.replace(new RegExp(`\\b(in|as of|for)\\s+${year}\\b`, 'gi'), `$1 ${currentYear}`);
    fixed = fixed.replace(new RegExp(`\\b(the|new|latest|current)\\s+${year}\\b`, 'gi'), `$1 ${currentYear}`);
  }
  return fixed;
}

// Parse arguments
const args = process.argv.slice(2);
const specificSlug = args.includes('--article') ? args[args.indexOf('--article') + 1] : null;
const contentOnly = args.includes('--content-only');
const imagesOnly = args.includes('--images-only');
const reportOnly = args.includes('--report');
const noFix = args.includes('--no-fix');

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateWordCount(htmlContent) {
  if (!htmlContent) return 0;
  const text = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.split(' ').filter(w => w.length > 0).length;
}

function detectImageType(buffer) {
  const bytes = new Uint8Array(buffer.slice(0, 12));
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'image/png';
  if (bytes[0] === 0xFF && bytes[1] === 0xD8) return 'image/jpeg';
  if (bytes[0] === 0x47 && bytes[1] === 0x49) return 'image/gif';
  if (bytes[0] === 0x52 && bytes[1] === 0x49) return 'image/webp';
  return 'image/jpeg';
}

// ============================================
// CONTENT QA
// ============================================

async function expandArticleContent(article) {
  const currentWordCount = calculateWordCount(article.content_html);
  
  const systemPrompt = `You are AL, AutoRev's AI automotive expert. Write comprehensive, authoritative articles.

Style: Authoritative, data-driven, practical advice, NO fluff.
Format: Proper HTML (<h2>, <h3>, <p>, <ul>/<li>, <strong>)

CRITICAL: Output ONLY HTML content. No preamble or code fences.`;

  const userPrompt = `Expand this article to ${QA_CONFIG.content.targetWords} words.

ARTICLE: ${article.title}
CATEGORY: ${article.category}/${article.subcategory || 'general'}
CURRENT: ${currentWordCount} words
TARGET: ${QA_CONFIG.content.targetWords} words

CONTENT:
${article.content_html}

Add depth, specific data, actionable advice. Every section must provide value.
Output ONLY expanded HTML content.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  return response.content[0].text.trim();
}

// ============================================
// IMAGE QA
// ============================================

async function analyzeImageQuality(imageUrl, articleContext) {
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const mediaType = detectImageType(arrayBuffer);

  // Build context hints for relevance checking
  const contextHints = buildContextHints(articleContext.title, articleContext.category);

  const prompt = `Analyze this car image with STRICT professional standards.

Article: "${articleContext.title}"
${contextHints ? `\nCONTEXT REQUIREMENTS:\n${contextHints}` : ''}

Score 0-100 for each:
1. CAR_COMPLETENESS (25%): Entire car visible without cropping?
2. CAR_ACCURACY (20%): Real, identifiable car model?
3. CONTEXTUAL_RELEVANCE (25%): Does car MATCH the article topic? ${contextHints ? 'Must match context requirements!' : ''}
4. REALISM (15%): Photorealistic? No AI artifacts?
5. COMPOSITION (10%): Professional framing?
6. QUALITY (5%): Sharp, well-lit?

CRITICAL AUTO-REJECT:
- Car does NOT match article context (e.g., $400k supercar for "under $50k" article)
- Car cut off or cropped
- AI artifacts or distortions
- Wrong car segment for the topic

Return ONLY JSON:
{"scores":{"car_completeness":<0-100>,"car_accuracy":<0-100>,"contextual_relevance":<0-100>,"realism":<0-100>,"composition":<0-100>,"quality":<0-100>},"weighted_total":<0-100>,"critical_issues":[],"car_identified":"<Make Model>","estimated_price":"<$XX,XXX>","context_match":true|false,"context_issue":"<why it doesn't match>","issues_found":"<brief>"}`;

  const result = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
        { type: 'text', text: prompt },
      ],
    }],
  });

  const jsonMatch = result.content[0].text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Parse failed');
  
  const analysis = JSON.parse(jsonMatch[0]);
  
  // Calculate weighted score with contextual relevance
  const weights = { car_completeness: 0.25, car_accuracy: 0.20, contextual_relevance: 0.25, realism: 0.15, composition: 0.10, quality: 0.05 };
  analysis.weighted_total = Math.round(
    Object.entries(analysis.scores).reduce((sum, [k, v]) => sum + (v * (weights[k] || 0)), 0)
  );
  
  // Auto-fail if context doesn't match
  if (analysis.context_match === false) {
    analysis.critical_issues = analysis.critical_issues || [];
    analysis.critical_issues.push('context_mismatch');
    // Cap score at 50 for context mismatch
    if (analysis.weighted_total > 50) analysis.weighted_total = 50;
  }
  
  return analysis;
}

async function generateImageDALLE(article, attempt = 1) {
  // Get context-appropriate cars for budget articles
  const appropriateCars = getContextAppropriateCars(article.title);
  
  let prompt;
  
  if (appropriateCars && appropriateCars.length > 0) {
    // Use context-appropriate cars - CRITICAL for budget articles!
    const selectedCars = appropriateCars.slice(0, 2);
    prompt = `Professional automotive photography featuring ${selectedCars.join(' and ')}. Both vehicles fully visible, parked side by side from 3/4 front angle. Scenic outdoor background with dramatic lighting. Magazine-quality, photorealistic.`;
  } else if (article.category === 'comparisons') {
    const cars = article.title.replace(/vs\.?|versus|:.*$/gi, ' and ').substring(0, 100);
    prompt = `Professional automotive photography: ${cars}. Both vehicles fully visible, parked side by side from 3/4 front angle. Clean studio or scenic background. Magazine-quality, photorealistic.`;
  } else if (article.category === 'technical') {
    prompt = `Professional automotive photography for article about ${article.title.substring(0, 60)}. Clean workshop or studio setting. Sharp detail, professional lighting. Magazine editorial style.`;
  } else {
    prompt = `Stunning automotive photography: ${article.title.substring(0, 60)}. Full vehicle visible, dramatic lighting, scenic background. Magazine editorial quality, photorealistic.`;
  }

  // Critical instructions to prevent common issues
  prompt += ` CRITICAL REQUIREMENTS:
1. Show COMPLETE car(s) - ALL wheels, bumpers, body panels fully visible
2. NO cropping or cut-off parts whatsoever
3. NO supercars or hypercars unless specifically requested
4. Cars must be REAL models that actually exist
5. No text or watermarks`;
  
  // Variation for retry attempts
  if (attempt > 1) {
    const angles = ['front 3/4 view', 'rear 3/4 view', 'side profile'];
    const settings = ['mountain road', 'coastal highway', 'urban cityscape'];
    prompt += ` Different perspective: ${angles[attempt % angles.length]}, ${settings[attempt % settings.length]}.`;
  }

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

async function uploadImage(imageUrl, articleSlug) {
  const response = await fetch(imageUrl);
  const imageBuffer = await response.arrayBuffer();
  
  const blob = await put(`articles/${articleSlug}/hero-${Date.now()}.webp`, Buffer.from(imageBuffer), {
    access: 'public',
    contentType: 'image/webp',
  });

  return blob.url;
}

// ============================================
// QA PIPELINE
// ============================================

async function runQA(article) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 ${article.title}`);
  console.log(`${'='.repeat(60)}`);

  const results = {
    title: article.title,
    slug: article.slug,
    content: { status: 'skipped' },
    image: { status: 'skipped' },
  };

  // ---- CONTENT QA ----
  if (!imagesOnly) {
    const wordCount = calculateWordCount(article.content_html);
    console.log(`\n📝 CONTENT QA`);
    console.log(`   Words: ${wordCount} (target: ${QA_CONFIG.content.minWords}-${QA_CONFIG.content.maxWords})`);
    
    // Check for outdated year references
    const yearIssues = checkOutdatedYears(article.content_html, article.title);
    if (yearIssues.length > 0) {
      console.log(`   ⚠️ Outdated year references found:`);
      yearIssues.forEach(issue => console.log(`      - "${issue.year}" appears ${issue.count} time(s)`));
      
      if (!noFix) {
        // Fix year references
        const fixedContent = fixOutdatedYears(article.content_html);
        const fixedTitle = fixOutdatedYears(article.title);
        
        if (fixedContent !== article.content_html || fixedTitle !== article.title) {
          await supabase
            .from('al_articles')
            .update({
              content_html: fixedContent,
              title: fixedTitle,
              updated_at: new Date().toISOString(),
            })
            .eq('id', article.id);
          
          article.content_html = fixedContent;
          article.title = fixedTitle;
          console.log(`   ✅ Fixed year references to ${QA_CONFIG.dates.currentYear}`);
        }
      }
    }

    if (wordCount >= QA_CONFIG.content.minWords) {
      console.log(`   ✅ Content approved`);
      results.content = { status: 'approved', wordCount };
    } else if (noFix) {
      console.log(`   ⚠️ Needs expansion (+${QA_CONFIG.content.minWords - wordCount} words)`);
      results.content = { status: 'needs_fix', wordCount, needed: QA_CONFIG.content.minWords - wordCount };
    } else {
      console.log(`   ⚙️ Expanding content...`);
      try {
        const expandedContent = await expandArticleContent(article);
        const newWordCount = calculateWordCount(expandedContent);
        const newReadTime = Math.ceil(newWordCount / 200);

        await supabase
          .from('al_articles')
          .update({
            content_html: expandedContent,
            read_time_minutes: newReadTime,
            updated_at: new Date().toISOString(),
          })
          .eq('id', article.id);

        console.log(`   ✅ Expanded: ${wordCount} → ${newWordCount} words`);
        results.content = { status: 'fixed', oldWordCount: wordCount, newWordCount };
      } catch (err) {
        console.log(`   ❌ Expansion failed: ${err.message}`);
        results.content = { status: 'failed', error: err.message };
      }
    }
  }

  // ---- IMAGE QA ----
  if (!contentOnly && article.hero_image_url) {
    console.log(`\n🖼️ IMAGE QA`);
    
    try {
      const analysis = await analyzeImageQuality(article.hero_image_url, { title: article.title, category: article.category });
      console.log(`   Score: ${analysis.weighted_total}/100`);
      console.log(`   Car: ${analysis.car_identified || 'Unknown'} (Est. ${analysis.estimated_price || 'unknown'})`);
      if (analysis.context_match === false) {
        console.log(`   ❌ CONTEXT MISMATCH: ${analysis.context_issue || 'Car does not match article topic'}`);
      }
      if (analysis.issues_found) console.log(`   Issues: ${analysis.issues_found}`);

      // Strict check: must pass score AND context match
      const hasContextMismatch = analysis.context_match === false;
      const passesQA = analysis.weighted_total >= QA_CONFIG.image.autoApproveThreshold &&
        !hasContextMismatch &&
        (!analysis.critical_issues || analysis.critical_issues.length === 0);

      if (passesQA) {
        console.log(`   ✅ Image approved`);
        
        await supabase
          .from('al_articles')
          .update({
            image_qa_status: 'approved',
            image_qa_score: analysis.weighted_total,
            image_qa_details: analysis,
            image_qa_reviewed_at: new Date().toISOString(),
          })
          .eq('id', article.id);

        results.image = { status: 'approved', score: analysis.weighted_total };
      } else if (noFix) {
        console.log(`   ⚠️ Needs regeneration`);
        results.image = { status: 'needs_fix', score: analysis.weighted_total };
      } else {
        // Regenerate image
        console.log(`   ⚙️ Regenerating image with DALL-E 3...`);
        
        for (let attempt = 1; attempt <= QA_CONFIG.image.maxRegenerationAttempts; attempt++) {
          console.log(`   Attempt ${attempt}/${QA_CONFIG.image.maxRegenerationAttempts}...`);
          
          try {
            const newImageUrl = await generateImageDALLE(article, attempt);
            console.log(`   Analyzing new image...`);
            
            const newAnalysis = await analyzeImageQuality(newImageUrl, { title: article.title, category: article.category });
            console.log(`   New score: ${newAnalysis.weighted_total}/100 (Car: ${newAnalysis.car_identified || 'Unknown'})`);
            if (newAnalysis.context_match === false) {
              console.log(`   ⚠️ Context mismatch: ${newAnalysis.context_issue || 'Car does not match'}`);
            }

            const newHasContextMismatch = newAnalysis.context_match === false;
            const newPassesQA = newAnalysis.weighted_total >= QA_CONFIG.image.autoApproveThreshold &&
              !newHasContextMismatch &&
              (!newAnalysis.critical_issues || newAnalysis.critical_issues.length === 0);

            if (newPassesQA) {
              console.log(`   Uploading to storage...`);
              const uploadedUrl = await uploadImage(newImageUrl, article.slug);

              await supabase
                .from('al_articles')
                .update({
                  hero_image_url: uploadedUrl,
                  image_qa_status: 'approved',
                  image_qa_score: newAnalysis.weighted_total,
                  image_qa_details: newAnalysis,
                  image_qa_reviewed_at: new Date().toISOString(),
                })
                .eq('id', article.id);

              console.log(`   ✅ New image approved (attempt ${attempt})`);
              results.image = { status: 'regenerated', score: newAnalysis.weighted_total, attempts: attempt };
              break;
            }
          } catch (err) {
            console.log(`   Attempt ${attempt} failed: ${err.message}`);
          }

          if (attempt === QA_CONFIG.image.maxRegenerationAttempts) {
            console.log(`   ❌ Failed after ${attempt} attempts`);
            results.image = { status: 'failed', originalScore: analysis.weighted_total };
            
            await supabase
              .from('al_articles')
              .update({
                image_qa_status: 'rejected',
                image_qa_score: analysis.weighted_total,
                image_qa_details: analysis,
                image_qa_reviewed_at: new Date().toISOString(),
              })
              .eq('id', article.id);
          }
        }
      }
    } catch (err) {
      console.log(`   ❌ Analysis failed: ${err.message}`);
      results.image = { status: 'error', error: err.message };
    }
  }

  return results;
}

async function generateReport() {
  const { data: articles } = await supabase
    .from('al_articles')
    .select('title, slug, content_html, image_qa_status, image_qa_score, read_time_minutes')
    .eq('is_published', true)
    .order('title');

  console.log('\n📊 ARTICLE QA STATUS REPORT');
  console.log('='.repeat(70));

  const stats = {
    content: { passed: 0, needsWork: 0 },
    image: { approved: 0, rejected: 0, pending: 0 },
  };

  for (const a of articles) {
    const wordCount = calculateWordCount(a.content_html);
    const contentOk = wordCount >= QA_CONFIG.content.minWords;
    const imageStatus = a.image_qa_status || 'pending';

    stats.content[contentOk ? 'passed' : 'needsWork']++;
    stats.image[imageStatus] = (stats.image[imageStatus] || 0) + 1;

    const contentEmoji = contentOk ? '✅' : '⚠️';
    const imageEmoji = { approved: '✅', rejected: '❌', pending: '⏳', needs_review: '⚠️' }[imageStatus] || '⏳';

    console.log(`\n${a.title}`);
    console.log(`   Content: ${contentEmoji} ${wordCount} words`);
    console.log(`   Image: ${imageEmoji} ${imageStatus} ${a.image_qa_score ? `(${a.image_qa_score}/100)` : ''}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY:');
  console.log(`\n📝 Content:`);
  console.log(`   ✅ Passed: ${stats.content.passed}`);
  console.log(`   ⚠️ Needs work: ${stats.content.needsWork}`);
  console.log(`\n🖼️ Images:`);
  console.log(`   ✅ Approved: ${stats.image.approved || 0}`);
  console.log(`   ❌ Rejected: ${stats.image.rejected || 0}`);
  console.log(`   ⏳ Pending: ${stats.image.pending || 0}`);
  console.log(`\n   Total articles: ${articles.length}`);
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('\n🔍 AutoRev Full QA Pipeline');
  console.log('='.repeat(50));
  console.log(`Mode: ${contentOnly ? 'Content Only' : imagesOnly ? 'Images Only' : 'Full QA'}`);
  console.log(`Auto-fix: ${noFix ? 'Disabled' : 'Enabled'}`);

  if (reportOnly) {
    await generateReport();
    return;
  }

  // Build query
  let query = supabase
    .from('al_articles')
    .select('*')
    .eq('is_published', true);

  if (specificSlug) {
    query = query.eq('slug', specificSlug);
  }

  const { data: articles, error } = await query.order('title');

  if (error || !articles?.length) {
    console.log(`\n❌ ${error?.message || 'No articles found'}`);
    return;
  }

  console.log(`\nProcessing ${articles.length} article(s)...\n`);

  const summary = {
    total: articles.length,
    contentFixed: 0,
    contentFailed: 0,
    imageApproved: 0,
    imageRegenerated: 0,
    imageFailed: 0,
  };

  for (const article of articles) {
    const results = await runQA(article);
    
    if (results.content.status === 'fixed') summary.contentFixed++;
    if (results.content.status === 'failed') summary.contentFailed++;
    if (results.image.status === 'approved') summary.imageApproved++;
    if (results.image.status === 'regenerated') summary.imageRegenerated++;
    if (results.image.status === 'failed') summary.imageFailed++;

    // Rate limit
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 QA COMPLETE');
  console.log(`${'='.repeat(60)}`);
  console.log(`\nTotal articles: ${summary.total}`);
  console.log(`\n📝 Content:`);
  console.log(`   Fixed: ${summary.contentFixed}`);
  console.log(`   Failed: ${summary.contentFailed}`);
  console.log(`\n🖼️ Images:`);
  console.log(`   Already approved: ${summary.imageApproved}`);
  console.log(`   Regenerated: ${summary.imageRegenerated}`);
  console.log(`   Failed: ${summary.imageFailed}`);
}

main().catch(console.error);

