#!/usr/bin/env node
/**
 * QA Score Comparison Tool
 * 
 * Compares internal advisory scores against external expert consensus
 * to identify cars where scores may need manual review/update.
 * 
 * This supports the "single source of truth" approach - external data
 * is used to INFORM score updates, not as a separate adjustment layer.
 * 
 * Usage: node scripts/qa-score-comparison.js [--threshold 0.3] [--output json|table]
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { carData } from '../data/cars.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Score categories to compare
const CATEGORIES = ['sound', 'interior', 'track', 'reliability', 'value', 'driverFun', 'aftermarket'];

// Sentiment to score mapping (external sentiment is -1 to 1, we map to suggestion)
function sentimentToScoreAdjustment(sentiment) {
  if (sentiment === null || sentiment === undefined) return 0;
  // Strong positive (>0.5) suggests score might be too low
  // Strong negative (<-0.5) suggests score might be too high
  // Returns suggested direction, not magnitude
  if (sentiment > 0.5) return 0.5; // "experts more positive than our score"
  if (sentiment > 0.2) return 0.25;
  if (sentiment < -0.5) return -0.5;
  if (sentiment < -0.2) return -0.25;
  return 0;
}

async function runQAComparison(threshold = 0.3, outputFormat = 'table') {
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('   QA SCORE COMPARISON: Internal vs External Consensus');
  console.log('═══════════════════════════════════════════════════════════════════\n');
  console.log(`Threshold for flagging: ±${threshold} sentiment divergence\n`);

  // Fetch all video-car links with sentiment data
  const { data: links, error } = await supabase
    .from('youtube_video_car_links')
    .select(`
      car_slug,
      sentiment_sound,
      sentiment_interior,
      sentiment_track,
      sentiment_reliability,
      sentiment_value,
      sentiment_driver_fun,
      sentiment_aftermarket,
      overall_sentiment,
      stock_strength_tags,
      stock_weakness_tags
    `);

  if (error) {
    console.error('Error fetching data:', error);
    process.exit(1);
  }

  // Aggregate sentiment per car
  const carSentiments = {};
  for (const link of links) {
    if (!carSentiments[link.car_slug]) {
      carSentiments[link.car_slug] = {
        slug: link.car_slug,
        reviewCount: 0,
        sentiments: {},
        strengths: {},
        weaknesses: {}
      };
    }
    
    const cs = carSentiments[link.car_slug];
    cs.reviewCount++;
    
    // Aggregate category sentiments
    for (const cat of CATEGORIES) {
      const sentKey = `sentiment_${cat === 'driverFun' ? 'driver_fun' : cat}`;
      if (link[sentKey] !== null && link[sentKey] !== undefined) {
        if (!cs.sentiments[cat]) cs.sentiments[cat] = [];
        cs.sentiments[cat].push(link[sentKey]);
      }
    }
    
    // Aggregate tags
    (link.stock_strength_tags || []).forEach(tag => {
      cs.strengths[tag] = (cs.strengths[tag] || 0) + 1;
    });
    (link.stock_weakness_tags || []).forEach(tag => {
      cs.weaknesses[tag] = (cs.weaknesses[tag] || 0) + 1;
    });
  }

  // Calculate averages
  for (const slug of Object.keys(carSentiments)) {
    const cs = carSentiments[slug];
    cs.avgSentiments = {};
    for (const cat of CATEGORIES) {
      if (cs.sentiments[cat]?.length > 0) {
        cs.avgSentiments[cat] = cs.sentiments[cat].reduce((a, b) => a + b, 0) / cs.sentiments[cat].length;
      }
    }
  }

  // Compare with internal scores
  const discrepancies = [];
  
  for (const car of carData) {
    const external = carSentiments[car.slug];
    if (!external || external.reviewCount === 0) continue;
    
    const carDiscrepancies = {
      name: car.name,
      slug: car.slug,
      reviewCount: external.reviewCount,
      categories: [],
      strengths: Object.entries(external.strengths)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => `${tag} (${count})`),
      weaknesses: Object.entries(external.weaknesses)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => `${tag} (${count})`),
    };
    
    for (const cat of CATEGORIES) {
      const internalScore = car[cat];
      const externalSentiment = external.avgSentiments[cat];
      
      if (internalScore !== undefined && externalSentiment !== undefined) {
        // Normalize internal score to -1 to 1 range for comparison
        // Score 5 = neutral (0), Score 10 = very positive (1), Score 1 = very negative (-1)
        const normalizedInternal = (internalScore - 5) / 5;
        const divergence = externalSentiment - normalizedInternal;
        
        if (Math.abs(divergence) >= threshold) {
          const direction = divergence > 0 ? '↑' : '↓';
          const suggestion = divergence > 0 
            ? `Consider raising (experts more positive)` 
            : `Consider lowering (experts more critical)`;
          
          carDiscrepancies.categories.push({
            category: cat,
            internalScore,
            externalSentiment: externalSentiment.toFixed(2),
            divergence: divergence.toFixed(2),
            direction,
            suggestion
          });
        }
      }
    }
    
    if (carDiscrepancies.categories.length > 0) {
      discrepancies.push(carDiscrepancies);
    }
  }

  // Sort by number of discrepancies
  discrepancies.sort((a, b) => b.categories.length - a.categories.length);

  // Output results
  if (outputFormat === 'json') {
    console.log(JSON.stringify(discrepancies, null, 2));
  } else {
    console.log(`Found ${discrepancies.length} cars with potential score discrepancies:\n`);
    
    for (const car of discrepancies) {
      console.log('┌─────────────────────────────────────────────────────────────────');
      console.log(`│ 🚗 ${car.name} (${car.reviewCount} reviews)`);
      console.log('├─────────────────────────────────────────────────────────────────');
      
      for (const cat of car.categories) {
        console.log(`│ ${cat.direction} ${cat.category.padEnd(12)} | Internal: ${cat.internalScore}/10 | External: ${cat.externalSentiment} | ${cat.suggestion}`);
      }
      
      if (car.strengths.length > 0) {
        console.log(`│ ✅ Praised: ${car.strengths.join(', ')}`);
      }
      if (car.weaknesses.length > 0) {
        console.log(`│ ⚠️  Watch: ${car.weaknesses.join(', ')}`);
      }
      console.log('└─────────────────────────────────────────────────────────────────\n');
    }
    
    // Summary
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(`Total cars with expert reviews: ${Object.keys(carSentiments).length}`);
    console.log(`Cars flagged for review: ${discrepancies.length}`);
    
    // Category breakdown
    const catCounts = {};
    for (const car of discrepancies) {
      for (const cat of car.categories) {
        catCounts[cat.category] = (catCounts[cat.category] || 0) + 1;
      }
    }
    console.log('\nDiscrepancies by category:');
    for (const [cat, count] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${cat}: ${count} cars`);
    }
  }

  return discrepancies;
}

// Parse CLI args
const args = process.argv.slice(2);
let threshold = 0.3;
let outputFormat = 'table';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--threshold' && args[i + 1]) {
    threshold = parseFloat(args[i + 1]);
    i++;
  } else if (args[i] === '--output' && args[i + 1]) {
    outputFormat = args[i + 1];
    i++;
  }
}

runQAComparison(threshold, outputFormat);

