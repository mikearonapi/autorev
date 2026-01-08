#!/usr/bin/env node
/**
 * Enhanced Image QA V2
 * 
 * Validates article images with article-aware criteria:
 * 1. Car accuracy - Does it show the RIGHT cars for this article?
 * 2. Environment appropriateness - Is the setting relevant?
 * 3. Technical quality - Composition, cropping, realism
 * 
 * Usage:
 *   node scripts/run-image-qa-v2.mjs                    # Run QA on pending
 *   node scripts/run-image-qa-v2.mjs --article <slug>   # Specific article
 *   node scripts/run-image-qa-v2.mjs --report           # Full report
 *   node scripts/run-image-qa-v2.mjs --rerun-all        # Rerun all articles
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

// =============================================================================
// ENHANCED QA CRITERIA
// =============================================================================

/**
 * Get expected cars for an article based on title and content
 * Used to verify the image shows appropriate vehicles
 */
function getExpectedCarsForArticle(article) {
  const title = article.title.toLowerCase();
  
  // Head-to-head: extract both cars
  const vsMatch = title.match(/(\d{4}\s+)?(.+?)\s+vs\.?\s+(\d{4}\s+)?(.+?)(?::|$)/i);
  if (vsMatch) {
    return [vsMatch[2].trim(), vsMatch[4].trim()];
  }
  
  // Budget articles
  if (title.includes('under $50')) {
    return ['Toyota GR86', 'Mazda MX-5 Miata', 'Ford Mustang', 'Hyundai Elantra N', 'Honda Civic Type R', 'Subaru BRZ'];
  }
  if (title.includes('under $40')) {
    return ['Honda Civic Si', 'Subaru WRX', 'Mazda MX-5 Miata', 'Toyota GR86', 'Hyundai Veloster N'];
  }
  
  // Topic-specific
  if (title.includes('jdm')) {
    return ['Nissan Skyline', 'Toyota Supra', 'Mazda RX-7', 'Honda NSX', 'Mitsubishi Evo'];
  }
  if (title.includes('first sports car') || title.includes('beginner')) {
    return ['Mazda MX-5 Miata', 'Toyota GR86', 'Subaru BRZ', 'Ford Mustang EcoBoost'];
  }
  if (title.includes('wheel') || title.includes('tire')) {
    // Should NOT show supercars - should show attainable enthusiast cars
    return ['BMW M3', 'Porsche Cayman', 'Ford Mustang GT', 'Mazda MX-5'];
  }
  if (title.includes('movie')) {
    return ['Ford Mustang', 'Dodge Charger', 'Chevrolet Camaro', 'Toyota Supra'];
  }
  
  // Car_slugs fallback
  if (article.car_slugs && article.car_slugs.length > 0) {
    return article.car_slugs.map(s => s.replace(/-/g, ' ').replace(/^\d+-/, ''));
  }
  
  return [];
}

/**
 * Determine if an article is about budget/affordable cars
 */
function isBudgetArticle(article) {
  const title = article.title.toLowerCase();
  return title.includes('under $') || 
         title.includes('affordable') || 
         title.includes('budget') ||
         title.includes('first sports car');
}

/**
 * Cars that should NEVER appear in budget articles
 */
const SUPERCAR_LIST = [
  'lamborghini', 'ferrari', 'mclaren', 'bugatti', 'pagani', 
  'koenigsegg', 'rolls-royce', 'bentley', 'aston martin',
  'maybach', 'porsche 918', 'porsche gt2 rs', 'rimac'
];

// =============================================================================
// THRESHOLDS
// =============================================================================

const AUTO_APPROVE_THRESHOLD = 80;
const AUTO_REJECT_THRESHOLD = 50;

// =============================================================================
// CLI PARSING
// =============================================================================

const args = process.argv.slice(2);
const specificSlug = args.includes('--article') ? args[args.indexOf('--article') + 1] : null;
const reportOnly = args.includes('--report');
const rerunAll = args.includes('--rerun-all');
const verbose = args.includes('--verbose') || args.includes('-v');

// =============================================================================
// QA ANALYSIS
// =============================================================================

async function analyzeImageV2(imageUrl, article) {
  const expectedCars = getExpectedCarsForArticle(article);
  const isBudget = isBudgetArticle(article);
  
  try {
    console.log(`   Fetching image...`);
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    // Detect image type
    const bytes = new Uint8Array(arrayBuffer.slice(0, 12));
    let mediaType = 'image/jpeg';
    if (bytes[0] === 0x89 && bytes[1] === 0x50) mediaType = 'image/png';
    else if (bytes[0] === 0xFF && bytes[1] === 0xD8) mediaType = 'image/jpeg';
    else if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46) mediaType = 'image/webp';
    
    console.log(`   Image type: ${mediaType}`);
    console.log(`   Expected cars: ${expectedCars.length > 0 ? expectedCars.join(', ') : 'any sports car'}`);
    
    const prompt = buildQAPrompt(article, expectedCars, isBudget);
    
    console.log(`   Running vision analysis...`);
    
    const result = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
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
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    // Post-process: check for supercar in budget article
    if (isBudget && analysis.cars_identified) {
      const identifiedLower = analysis.cars_identified.toLowerCase();
      for (const supercar of SUPERCAR_LIST) {
        if (identifiedLower.includes(supercar)) {
          analysis.critical_issues = analysis.critical_issues || [];
          analysis.critical_issues.push(`supercar_in_budget_article: ${supercar}`);
          analysis.scores.car_appropriateness = Math.min(analysis.scores.car_appropriateness, 20);
        }
      }
    }
    
    return analysis;
    
  } catch (error) {
    console.log(`   ❌ Analysis failed: ${error.message}`);
    return {
      scores: { 
        car_completeness: 0, 
        car_appropriateness: 0, 
        realism: 0, 
        composition: 0, 
        quality: 0,
        environment: 0
      },
      weighted_total: 0,
      critical_issues: ['analysis_failed'],
      recommendation: 'review',
      issues_found: error.message,
    };
  }
}

function buildQAPrompt(article, expectedCars, isBudget) {
  const expectedCarsStr = expectedCars.length > 0 
    ? expectedCars.join(', ') 
    : 'any appropriate sports car';
  
  return `You are an expert image quality analyst for AutoRev, a professional automotive website.

ARTICLE CONTEXT:
- Title: "${article.title}"
- Category: ${article.category}
- This is ${isBudget ? 'a BUDGET/AFFORDABLE car article' : 'a general automotive article'}
- Expected cars for this article: ${expectedCarsStr}

Score each criterion from 0-100. BE STRICT - we need magazine-quality images:

1. CAR_COMPLETENESS (25%): Is the ENTIRE car visible?
   - Score 0-20 if any significant part is cut off (wheel, bumper, etc.)
   - Score 100 only if car is perfectly framed with all parts visible

2. CAR_APPROPRIATENESS (25%): Does the image show the RIGHT cars for this article?
   - For budget articles: REJECT if showing supercars (Lamborghini, Ferrari, McLaren)
   - Score 0-30 if cars don't match the article topic
   - Score 100 if cars perfectly match what the article discusses
   - ${isBudget ? 'THIS IS A BUDGET ARTICLE - NO SUPERCARS ALLOWED' : ''}

3. REALISM (20%): Would this pass as a real photograph?
   - Check for: AI artifacts, impossible reflections, merged parts, warped proportions
   - Score 0-30 for obvious CGI/AI generation tells
   - Score 80+ only for truly photorealistic images

4. COMPOSITION (15%): Professional automotive photography?
   - Good angle (3/4 front preferred), balanced framing
   - Interesting but not distracting background

5. ENVIRONMENT (10%): Appropriate setting for the article type?
   - Technical articles: workshop/garage settings preferred
   - Comparison articles: outdoor settings work well
   - Score lower for dark studio shots with reflective floors (AI cliché)

6. QUALITY (5%): Technical image quality - sharpness, lighting, resolution

CRITICAL AUTO-REJECT ISSUES (any = immediate rejection):
- Car partially cut off
- SUPERCAR in budget article (Lamborghini, Ferrari, McLaren, etc.)
- Extra wheels, doors, or merged car parts
- Distorted proportions
- Dark studio with reflective floor (major AI tell)
- Wrong vehicle type entirely
- Obvious CGI/video game appearance

Return ONLY this JSON (no other text):
{
  "scores": {
    "car_completeness": <0-100>,
    "car_appropriateness": <0-100>,
    "realism": <0-100>,
    "composition": <0-100>,
    "environment": <0-100>,
    "quality": <0-100>
  },
  "weighted_total": <calculated weighted average>,
  "critical_issues": [],
  "cars_identified": "<Make Model(s) or 'Unidentifiable'>",
  "environment_detected": "<describe the setting briefly>",
  "matches_expected_cars": <true/false>,
  "recommendation": "approve|reject|review",
  "issues_found": "<brief description of problems>",
  "improvement_suggestions": "<specific suggestions to improve>"
}`;
}

// =============================================================================
// QA EXECUTION
// =============================================================================

async function runQAOnArticle(article) {
  console.log(`\n🔍 ${article.title}`);
  console.log(`   URL: ${article.hero_image_url?.substring(0, 60)}...`);

  if (!article.hero_image_url) {
    console.log(`   ⚠️ No image URL`);
    return null;
  }

  const analysis = await analyzeImageV2(article.hero_image_url, article);

  // Calculate weighted score with new criteria
  const weights = { 
    car_completeness: 0.25, 
    car_appropriateness: 0.25, 
    realism: 0.20, 
    composition: 0.15, 
    environment: 0.10,
    quality: 0.05 
  };
  
  const weightedScore = Math.round(
    Object.entries(analysis.scores || {}).reduce((sum, [key, score]) => {
      return sum + ((score || 0) * (weights[key] || 0));
    }, 0)
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
  console.log(`   Cars identified: ${analysis.cars_identified || 'Unknown'}`);
  console.log(`   Environment: ${analysis.environment_detected || 'Unknown'}`);
  console.log(`   Matches expected: ${analysis.matches_expected_cars ? '✓' : '✗'}`);
  
  if (analysis.issues_found) {
    console.log(`   Issues: ${analysis.issues_found}`);
  }
  
  if (verbose && analysis.improvement_suggestions) {
    console.log(`   Suggestions: ${analysis.improvement_suggestions}`);
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

// =============================================================================
// REPORTING
// =============================================================================

async function generateReport() {
  const { data: articles } = await supabase
    .from('al_articles')
    .select('title, slug, category, subcategory, image_qa_status, image_qa_score, image_qa_issues, image_qa_details')
    .eq('is_published', true)
    .order('image_qa_score', { ascending: true, nullsFirst: true });

  console.log('\n📊 IMAGE QA REPORT V2');
  console.log('═'.repeat(70));

  const stats = { approved: 0, rejected: 0, needs_review: 0, pending: 0 };
  const issues = {
    car_mismatch: [],
    cropping: [],
    cgi_appearance: [],
    supercar_in_budget: [],
  };
  
  for (const a of articles) {
    const status = a.image_qa_status || 'pending';
    stats[status] = (stats[status] || 0) + 1;
    
    const emoji = { approved: '✅', rejected: '❌', needs_review: '⚠️', pending: '⏳' }[status];
    const score = a.image_qa_score !== null ? `${a.image_qa_score}/100` : 'Not scored';
    
    console.log(`\n${emoji} ${a.title}`);
    console.log(`   Status: ${status} | Score: ${score}`);
    
    if (a.image_qa_details?.cars_identified) {
      console.log(`   Cars: ${a.image_qa_details.cars_identified}`);
    }
    if (a.image_qa_details?.environment_detected) {
      console.log(`   Environment: ${a.image_qa_details.environment_detected}`);
    }
    if (a.image_qa_issues?.length > 0) {
      console.log(`   Issues: ${a.image_qa_issues.join(', ')}`);
      
      // Categorize issues
      for (const issue of a.image_qa_issues) {
        if (issue.includes('supercar')) issues.supercar_in_budget.push(a.slug);
        else if (issue.includes('crop') || issue.includes('cut')) issues.cropping.push(a.slug);
        else if (issue.includes('cgi') || issue.includes('render')) issues.cgi_appearance.push(a.slug);
      }
    }
    if (a.image_qa_details?.matches_expected_cars === false) {
      issues.car_mismatch.push(a.slug);
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log('SUMMARY:');
  console.log(`  ✅ Approved:      ${stats.approved}`);
  console.log(`  ❌ Rejected:      ${stats.rejected}`);
  console.log(`  ⚠️ Needs Review:  ${stats.needs_review}`);
  console.log(`  ⏳ Pending:       ${stats.pending}`);
  console.log(`  Total:           ${articles.length}`);
  
  console.log('\nISSUE BREAKDOWN:');
  console.log(`  🚗 Car mismatch:       ${issues.car_mismatch.length}`);
  console.log(`  ✂️ Cropping issues:    ${issues.cropping.length}`);
  console.log(`  🎮 CGI appearance:     ${issues.cgi_appearance.length}`);
  console.log(`  💰 Supercar in budget: ${issues.supercar_in_budget.length}`);
  
  if (issues.supercar_in_budget.length > 0) {
    console.log(`\n⚠️ SUPERCAR IN BUDGET ARTICLES (high priority fix):`);
    issues.supercar_in_budget.forEach(slug => console.log(`   - ${slug}`));
  }
  
  console.log('\n' + '═'.repeat(70));
  console.log('NEXT STEPS:');
  console.log('  1. Regenerate rejected images: node scripts/regenerate-article-images-v2.mjs --priority=high');
  console.log('  2. Review "needs_review" images manually');
  console.log('  3. Re-run QA after regeneration: node scripts/run-image-qa-v2.mjs --rerun-all');
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('\n🖼️  AutoRev Image QA System V2');
  console.log('═'.repeat(50));

  if (reportOnly) {
    await generateReport();
    return;
  }

  // Build query
  let query = supabase
    .from('al_articles')
    .select('id, title, slug, category, subcategory, car_slugs, hero_image_url, image_qa_status')
    .eq('is_published', true)
    .not('hero_image_url', 'is', null);

  if (specificSlug) {
    query = query.eq('slug', specificSlug);
  } else if (!rerunAll) {
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
    // Rate limit - 2.5 seconds between API calls
    await new Promise(r => setTimeout(r, 2500));
  }

  console.log('\n' + '═'.repeat(50));
  console.log('RESULTS:');
  console.log(`  ✅ Approved:     ${results.approved}`);
  console.log(`  ❌ Rejected:     ${results.rejected}`);
  console.log(`  ⚠️ Needs Review: ${results.needs_review}`);
  
  if (results.rejected > 0) {
    console.log('\nRun regeneration on rejected images:');
    console.log('  node scripts/regenerate-article-images-v2.mjs --priority=high');
  }
}

main().catch(console.error);

