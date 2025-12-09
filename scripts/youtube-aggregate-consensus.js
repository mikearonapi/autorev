#!/usr/bin/env node

/**
 * YouTube Consensus Aggregation Job
 * 
 * Aggregates per-video sentiment and tags into per-car consensus metrics.
 * Updates cars table with:
 * - external_consensus JSONB
 * - expert_review_count
 * - expert_consensus_summary
 * - score_adj_* bounded adjustments
 * 
 * Usage:
 *   node scripts/youtube-aggregate-consensus.js [options]
 * 
 * Options:
 *   --car-slug <slug>     Only process a specific car
 *   --dry-run             Don't write to database, just log results
 *   --verbose             Enable verbose logging
 * 
 * @module scripts/youtube-aggregate-consensus
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  carSlug: null,
  dryRun: false,
  verbose: false
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--car-slug':
      options.carSlug = args[++i];
      break;
    case '--dry-run':
      options.dryRun = true;
      break;
    case '--verbose':
      options.verbose = true;
      break;
  }
}

// Logging helpers
const log = (...args) => console.log('[aggregate]', ...args);
const logVerbose = (...args) => options.verbose && console.log('[aggregate:verbose]', ...args);
const logError = (...args) => console.error('[aggregate:error]', ...args);

// Tier weights for sentiment aggregation
const TIER_WEIGHTS = {
  tier1: 1.0,
  tier2: 0.7,
  tier3: 0.5
};

// Maximum score adjustment (bounded)
const MAX_ADJUSTMENT = 0.5;

// ============================================================================
// Aggregation Logic
// ============================================================================

/**
 * Calculate weighted mean and variance for a set of values
 * @param {Array<{value: number, weight: number}>} items - Values with weights
 * @returns {Object} { mean, variance, count }
 */
function calculateWeightedStats(items) {
  if (!items || items.length === 0) {
    return { mean: null, variance: null, count: 0 };
  }

  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
  if (totalWeight === 0) {
    return { mean: null, variance: null, count: 0 };
  }

  const weightedSum = items.reduce((sum, i) => sum + i.value * i.weight, 0);
  const mean = weightedSum / totalWeight;

  const weightedSquaredDiff = items.reduce((sum, i) => 
    sum + Math.pow(i.value - mean, 2) * i.weight, 0);
  const variance = weightedSquaredDiff / totalWeight;

  return {
    mean: Math.round(mean * 100) / 100,
    variance: Math.round(variance * 100) / 100,
    count: items.length
  };
}

/**
 * Determine agreement level from variance
 * @param {number} variance - Sentiment variance
 * @returns {string} Agreement level
 */
function getAgreementLevel(variance) {
  if (variance === null) return 'none';
  if (variance < 0.1) return 'strong';
  if (variance < 0.25) return 'moderate';
  return 'weak';
}

/**
 * Calculate score adjustment from sentiment mean
 * @param {number} mean - Sentiment mean (-1 to 1)
 * @param {string} agreement - Agreement level
 * @returns {number} Bounded adjustment
 */
function calculateAdjustment(mean, agreement) {
  if (mean === null) return 0;

  // Agreement multiplier
  const multipliers = {
    strong: 1.0,
    moderate: 0.7,
    weak: 0.4,
    none: 0
  };

  const multiplier = multipliers[agreement] || 0;
  const rawAdjustment = mean * MAX_ADJUSTMENT * multiplier;

  // Bound to ±MAX_ADJUSTMENT
  return Math.max(-MAX_ADJUSTMENT, Math.min(MAX_ADJUSTMENT, 
    Math.round(rawAdjustment * 100) / 100));
}

/**
 * Aggregate tags across multiple sources
 * @param {Array<string[]>} tagArrays - Arrays of tags from different sources
 * @returns {Array<{tag: string, count: number}>} Aggregated tag counts
 */
function aggregateTags(tagArrays) {
  const counts = {};
  
  for (const tags of tagArrays) {
    for (const tag of (tags || [])) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }

  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Generate consensus summary sentence
 * @param {Object} consensus - Consensus data
 * @returns {string} Summary sentence
 */
function generateSummary(consensus) {
  const parts = [];

  if (consensus.strengths.length > 0) {
    const topStrengths = consensus.strengths.slice(0, 2).map(s => s.tag);
    parts.push(`Praised for ${topStrengths.join(' and ')}`);
  }

  if (consensus.weaknesses.length > 0) {
    const topWeaknesses = consensus.weaknesses.slice(0, 2).map(w => w.tag);
    parts.push(`watch for ${topWeaknesses.join(' and ')}`);
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.join('; ') + '.';
}

// ============================================================================
// Main Aggregation
// ============================================================================

async function main() {
  log('Starting consensus aggregation...');
  log('Options:', options);

  // Validate configuration
  if (!options.dryRun && (!SUPABASE_URL || !SUPABASE_SERVICE_KEY)) {
    logError('SUPABASE_URL and SUPABASE_SERVICE_KEY are required (or use --dry-run)');
    process.exit(1);
  }

  const supabase = options.dryRun 
    ? null 
    : createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Get list of cars to process
  log('Fetching cars...');
  let cars = [];

  if (options.dryRun) {
    cars = [
      { slug: '718-cayman-gt4', name: '718 Cayman GT4' },
      { slug: 'c8-corvette-stingray', name: 'C8 Corvette Stingray' }
    ];
    if (options.carSlug) {
      cars = cars.filter(c => c.slug === options.carSlug);
    }
  } else {
    let query = supabase
      .from('cars')
      .select('slug, name');

    if (options.carSlug) {
      query = query.eq('slug', options.carSlug);
    }

    const { data, error } = await query;
    if (error) {
      logError('Failed to fetch cars:', error);
      process.exit(1);
    }
    cars = data || [];
  }

  log(`Processing ${cars.length} cars`);

  // Track statistics
  const stats = {
    processed: 0,
    updated: 0,
    noReviews: 0,
    errors: 0
  };

  // Process each car
  for (const car of cars) {
    log(`\nProcessing: ${car.name} (${car.slug})`);
    stats.processed++;

    try {
      // Fetch all video links for this car
      let links = [];

      if (options.dryRun) {
        // Sample data for dry run
        links = [
          {
            video_id: 'test1',
            role: 'primary',
            sentiment_sound: 0.8,
            sentiment_track: 0.9,
            sentiment_driver_fun: 0.95,
            sentiment_reliability: 0.6,
            sentiment_value: 0.3,
            stock_strength_tags: ['sound', 'chassis', 'steering'],
            stock_weakness_tags: ['value', 'infotainment'],
            compared_to_slugs: ['c8-corvette-stingray'],
            youtube_videos: { quality_score: 0.85 },
            youtube_channels: { credibility_tier: 'tier1' }
          },
          {
            video_id: 'test2',
            role: 'primary',
            sentiment_sound: 0.9,
            sentiment_track: 0.85,
            sentiment_driver_fun: 0.9,
            stock_strength_tags: ['sound', 'brakes'],
            stock_weakness_tags: ['value'],
            youtube_videos: { quality_score: 0.8 },
            youtube_channels: { credibility_tier: 'tier2' }
          }
        ];
      } else {
        const { data, error } = await supabase
          .from('youtube_video_car_links')
          .select(`
            video_id,
            role,
            sentiment_sound,
            sentiment_interior,
            sentiment_track,
            sentiment_reliability,
            sentiment_value,
            sentiment_driver_fun,
            sentiment_aftermarket,
            overall_sentiment,
            stock_strength_tags,
            stock_weakness_tags,
            usage_context_tags,
            compared_to_slugs,
            youtube_videos!inner (
              quality_score,
              processing_status
            ),
            youtube_channels:youtube_videos!inner (
              youtube_channels!inner (
                credibility_tier
              )
            )
          `)
          .eq('car_slug', car.slug)
          .eq('youtube_videos.processing_status', 'processed');

        if (error) {
          logError(`  Failed to fetch links:`, error);
          stats.errors++;
          continue;
        }

        // Flatten the nested channel tier (Supabase returns nested objects)
        links = (data || []).map(link => ({
          ...link,
          youtube_channels: {
            credibility_tier: link.youtube_channels?.youtube_channels?.credibility_tier
          }
        }));
      }

      if (links.length === 0) {
        log(`  No processed reviews found`);
        stats.noReviews++;
        continue;
      }

      log(`  Found ${links.length} reviews`);

      // Aggregate category sentiments
      const categories = {};
      const categoryFields = [
        'sentiment_sound', 'sentiment_interior', 'sentiment_track',
        'sentiment_reliability', 'sentiment_value', 'sentiment_driver_fun',
        'sentiment_aftermarket'
      ];

      for (const field of categoryFields) {
        const categoryKey = field.replace('sentiment_', '');
        const items = [];

        for (const link of links) {
          if (link[field] !== null && link[field] !== undefined) {
            const tier = link.youtube_channels?.credibility_tier || 'tier3';
            const weight = TIER_WEIGHTS[tier] || 0.5;
            items.push({ value: link[field], weight });
          }
        }

        const stats = calculateWeightedStats(items);
        const agreement = getAgreementLevel(stats.variance);

        categories[categoryKey] = {
          ...stats,
          agreement
        };
      }

      // Aggregate tags
      const strengths = aggregateTags(links.map(l => l.stock_strength_tags));
      const weaknesses = aggregateTags(links.map(l => l.stock_weakness_tags));
      const usageContexts = aggregateTags(links.map(l => l.usage_context_tags));

      // Aggregate comparisons
      const comparisonCounts = {};
      for (const link of links) {
        for (const slug of (link.compared_to_slugs || [])) {
          comparisonCounts[slug] = (comparisonCounts[slug] || 0) + 1;
        }
      }
      const comparisons = Object.entries(comparisonCounts)
        .map(([slug, count]) => ({ slug, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Build consensus object
      const consensus = {
        reviewCount: links.length,
        categories,
        strengths: strengths.slice(0, 5),
        weaknesses: weaknesses.slice(0, 5),
        usageContexts: usageContexts.slice(0, 5),
        comparisons,
        lastUpdated: new Date().toISOString()
      };

      // Calculate score adjustments
      const adjustments = {};
      for (const [category, data] of Object.entries(categories)) {
        const adj = calculateAdjustment(data.mean, data.agreement);
        adjustments[`score_adj_${category}`] = adj;
      }

      // Generate summary
      const summary = generateSummary(consensus);

      // Log results
      logVerbose(`  Categories:`, categories);
      logVerbose(`  Adjustments:`, adjustments);
      log(`  Summary: "${summary}"`);
      log(`  Top strengths: ${strengths.slice(0, 3).map(s => s.tag).join(', ')}`);
      log(`  Top weaknesses: ${weaknesses.slice(0, 3).map(w => w.tag).join(', ')}`);

      // Update database
      if (options.dryRun) {
        log(`  [DRY RUN] Would update car with consensus data`);
      } else {
        const { error: updateError } = await supabase
          .from('cars')
          .update({
            external_consensus: consensus,
            expert_review_count: consensus.reviewCount,
            expert_consensus_summary: summary,
            ...adjustments
          })
          .eq('slug', car.slug);

        if (updateError) {
          logError(`  Failed to update car:`, updateError);
          stats.errors++;
        } else {
          log(`  ✓ Updated consensus`);
          stats.updated++;
        }
      }

    } catch (error) {
      logError(`  Processing failed:`, error.message);
      stats.errors++;
    }
  }

  // Print summary
  log('\n========================================');
  log('Consensus Aggregation Complete');
  log('========================================');
  log(`Cars processed:  ${stats.processed}`);
  log(`Cars updated:    ${stats.updated}`);
  log(`No reviews:      ${stats.noReviews}`);
  log(`Errors:          ${stats.errors}`);

  if (options.dryRun) {
    log('\n[DRY RUN] No changes were made to the database');
  }
}

// Run
main().catch(error => {
  logError('Fatal error:', error);
  process.exit(1);
});

