#!/usr/bin/env node

/**
 * Automated Image QA Script
 * 
 * Uses Claude Vision to analyze article images and score them on quality criteria.
 * 
 * Usage:
 *   node scripts/run-image-qa.mjs              # Run QA on all pending images
 *   node scripts/run-image-qa.mjs --article <slug>  # Run QA on specific article
 *   node scripts/run-image-qa.mjs --report     # Generate QA report
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Thresholds
const AUTO_APPROVE_THRESHOLD = 75;
const AUTO_REJECT_THRESHOLD = 45;

// Parse arguments
const args = process.argv.slice(2);
const specificSlug = args.includes('--article') ? args[args.indexOf('--article') + 1] : null;
const reportOnly = args.includes('--report');
const rerunAll = args.includes('--rerun-all');

async function analyzeImage(imageUrl, articleContext) {
  try {
    console.log(`   Fetching image...`);
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    // Detect actual image type from magic bytes
    const bytes = new Uint8Array(arrayBuffer.slice(0, 12));
    let mediaType = 'image/jpeg'; // default
    
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      mediaType = 'image/png';
    } else if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      mediaType = 'image/jpeg';
    } else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
      mediaType = 'image/gif';
    } else if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
      mediaType = 'image/webp';
    }
    
    console.log(`   Image type: ${mediaType}`);

    console.log(`   Running vision analysis...`);
    
    const prompt = `You are an expert image quality analyst for AutoRev, a professional automotive website. Analyze this car image with STRICT quality standards.

Article: "${articleContext.title}"
Category: ${articleContext.category}

Score each criterion from 0-100. BE HARSH - we need magazine-quality images:

1. CAR_COMPLETENESS (30%): Is the ENTIRE car visible? All wheels, bumpers, roof visible without cropping?
   - Score 0-20 if any significant part is cut off
   - Score 100 only if car is perfectly framed with all parts visible

2. CAR_ACCURACY (25%): Does this look like a REAL car model enthusiasts would recognize?
   - Score 0-30 for generic/fictional looking cars
   - Score 80+ only for clearly identifiable real vehicles

3. REALISM (20%): Would this pass as a real photograph?
   - Check for: extra/missing parts, impossible reflections, merged objects, warped proportions
   - Score 0-30 if ANY obvious AI artifacts present
   - Score 80+ only for photorealistic images

4. COMPOSITION (15%): Professional automotive photography standards?
   - Good angle, interesting setting, proper lighting

5. QUALITY (10%): Technical image quality - sharpness, lighting, resolution

CRITICAL AUTO-REJECT ISSUES (any of these = immediate rejection):
- Car partially cut off (missing wheel, bumper, etc.)
- Extra wheels, doors, or merged car parts
- Distorted proportions (stretched, warped)
- Obvious AI generation artifacts
- Text/watermarks in image
- Wrong vehicle type for the article

Return ONLY this JSON (no other text):
{
  "scores": {
    "car_completeness": <0-100>,
    "car_accuracy": <0-100>,
    "realism": <0-100>,
    "composition": <0-100>,
    "quality": <0-100>
  },
  "weighted_total": <calculated weighted average>,
  "critical_issues": [],
  "car_identified": "<Make Model or 'Unidentifiable'>",
  "recommendation": "approve|reject|review",
  "issues_found": "<brief description of problems found>"
}`;

    const result = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    });

    const responseText = result.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Could not parse response');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.log(`   ❌ Analysis failed: ${error.message}`);
    return {
      scores: { car_completeness: 0, car_accuracy: 0, realism: 0, composition: 0, quality: 0 },
      weighted_total: 0,
      critical_issues: ['analysis_failed'],
      recommendation: 'review',
      issues_found: error.message,
    };
  }
}

async function runQAOnArticle(article) {
  console.log(`\n🔍 ${article.title}`);
  console.log(`   URL: ${article.hero_image_url?.substring(0, 60)}...`);

  if (!article.hero_image_url) {
    console.log(`   ⚠️ No image URL`);
    return null;
  }

  const analysis = await analyzeImage(article.hero_image_url, {
    title: article.title,
    category: article.category,
  });

  // Calculate weighted score
  const weights = { car_completeness: 0.30, car_accuracy: 0.25, realism: 0.20, composition: 0.15, quality: 0.10 };
  const weightedScore = Math.round(
    Object.entries(analysis.scores).reduce((sum, [key, score]) => sum + (score * (weights[key] || 0)), 0)
  );
  analysis.weighted_total = weightedScore;

  // Determine status
  let status = 'needs_review';
  if (analysis.critical_issues && analysis.critical_issues.length > 0) {
    status = 'rejected';
  } else if (weightedScore >= AUTO_APPROVE_THRESHOLD) {
    status = 'approved';
  } else if (weightedScore < AUTO_REJECT_THRESHOLD) {
    status = 'rejected';
  }

  const statusEmoji = { approved: '✅', rejected: '❌', needs_review: '⚠️' };
  console.log(`   ${statusEmoji[status]} Score: ${weightedScore}/100 → ${status.toUpperCase()}`);
  console.log(`   Car: ${analysis.car_identified || 'Unknown'}`);
  
  if (analysis.issues_found) {
    console.log(`   Issues: ${analysis.issues_found}`);
  }

  // Update database
  const { error } = await supabase
    .from('al_articles')
    .update({
      image_qa_status: status,
      image_qa_score: weightedScore,
      image_qa_issues: analysis.critical_issues?.length > 0 ? analysis.critical_issues : null,
      image_qa_details: analysis,
      image_qa_reviewed_at: new Date().toISOString(),
    })
    .eq('id', article.id);

  if (error) {
    console.log(`   ❌ DB update failed: ${error.message}`);
  }

  return { status, score: weightedScore, analysis };
}

async function generateReport() {
  const { data: articles } = await supabase
    .from('al_articles')
    .select('title, slug, category, image_qa_status, image_qa_score, image_qa_issues, image_qa_details')
    .eq('is_published', true)
    .order('image_qa_score', { ascending: true, nullsFirst: true });

  console.log('\n📊 IMAGE QA REPORT');
  console.log('='.repeat(70));

  const stats = { approved: 0, rejected: 0, needs_review: 0, pending: 0 };
  
  for (const a of articles) {
    const status = a.image_qa_status || 'pending';
    stats[status] = (stats[status] || 0) + 1;
    
    const emoji = { approved: '✅', rejected: '❌', needs_review: '⚠️', pending: '⏳' }[status];
    const score = a.image_qa_score !== null ? `${a.image_qa_score}/100` : 'Not scored';
    
    console.log(`\n${emoji} ${a.title}`);
    console.log(`   Status: ${status} | Score: ${score}`);
    if (a.image_qa_issues?.length > 0) {
      console.log(`   Issues: ${a.image_qa_issues.join(', ')}`);
    }
    if (a.image_qa_details?.car_identified) {
      console.log(`   Car ID: ${a.image_qa_details.car_identified}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY:');
  console.log(`  ✅ Approved: ${stats.approved}`);
  console.log(`  ❌ Rejected: ${stats.rejected}`);
  console.log(`  ⚠️ Needs Review: ${stats.needs_review}`);
  console.log(`  ⏳ Pending: ${stats.pending}`);
  console.log(`  Total: ${articles.length}`);
}

async function main() {
  console.log('\n🖼️  AutoRev Image QA System');
  console.log('='.repeat(50));

  if (reportOnly) {
    await generateReport();
    return;
  }

  // Build query
  let query = supabase
    .from('al_articles')
    .select('id, title, slug, category, hero_image_url, image_qa_status')
    .eq('is_published', true)
    .not('hero_image_url', 'is', null);

  if (specificSlug) {
    query = query.eq('slug', specificSlug);
  } else if (!rerunAll) {
    // Only pending by default
    query = query.or('image_qa_status.eq.pending,image_qa_status.is.null');
  }

  const { data: articles, error } = await query.order('title');

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  if (articles.length === 0) {
    console.log('\n✨ No images pending QA review!');
    console.log('Run with --report to see full status.');
    return;
  }

  console.log(`\nAnalyzing ${articles.length} image(s)...\n`);

  const results = { approved: 0, rejected: 0, needs_review: 0 };

  for (const article of articles) {
    const result = await runQAOnArticle(article);
    if (result) {
      results[result.status]++;
    }
    // Rate limit - 2 seconds between API calls
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n' + '='.repeat(50));
  console.log('RESULTS:');
  console.log(`  ✅ Approved: ${results.approved}`);
  console.log(`  ❌ Rejected: ${results.rejected}`);
  console.log(`  ⚠️ Needs Review: ${results.needs_review}`);
}

main().catch(console.error);

