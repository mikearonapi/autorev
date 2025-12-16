#!/usr/bin/env node
/**
 * Expand Fitments Script
 *
 * Analyzes existing parts and creates fitments for cars that don't have them yet.
 * Uses the vendorAdapters pattern matching to infer fitments from product tags.
 *
 * Usage:
 *   node scripts/expandFitments.mjs [options]
 *
 * Options:
 *   --dry-run       Don't write to DB, just report what would be done
 *   --vendor=KEY    Only process parts from specific vendor
 *   --priority=N    Only process priority tier N cars (1, 2, or 3)
 *   --car=SLUG      Only create fitments for specific car
 *   --limit=N       Max parts to process (default: 500)
 *   --verbose       Show detailed progress
 *
 * Examples:
 *   node scripts/expandFitments.mjs --dry-run --verbose
 *   node scripts/expandFitments.mjs --priority=1 --limit=100
 *   node scripts/expandFitments.mjs --car=bmw-m3-f80 --vendor=generic_bmw
 *
 * @module scripts/expandFitments
 */

import { createClient } from '@supabase/supabase-js';
import {
  resolveCarSlugsFromTags,
  parseShopifyTags,
  PRIORITY_CARS,
  PLATFORM_TAG_PATTERNS,
} from '../lib/vendorAdapters.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ============================================================================
// CLI ARGUMENT PARSING
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    vendor: null,
    priority: null,
    car: null,
    limit: 500,
    verbose: false,
  };

  for (const arg of args) {
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--verbose') options.verbose = true;
    else if (arg.startsWith('--vendor=')) options.vendor = arg.split('=')[1];
    else if (arg.startsWith('--priority=')) options.priority = parseInt(arg.split('=')[1], 10);
    else if (arg.startsWith('--car=')) options.car = arg.split('=')[1];
    else if (arg.startsWith('--limit=')) options.limit = parseInt(arg.split('=')[1], 10);
    else if (arg === '--help' || arg === '-h') {
      console.log(`
Expand Fitments Script

Usage:
  node scripts/expandFitments.mjs [options]

Options:
  --dry-run       Don't write to DB, just report what would be done
  --vendor=KEY    Only process parts from specific vendor
  --priority=N    Only process priority tier N cars (1, 2, or 3)
  --car=SLUG      Only create fitments for specific car
  --limit=N       Max parts to process (default: 500)
  --verbose       Show detailed progress

Examples:
  node scripts/expandFitments.mjs --dry-run --verbose
  node scripts/expandFitments.mjs --priority=1 --limit=100
  node scripts/expandFitments.mjs --car=bmw-m3-f80 --vendor=generic_bmw
      `);
      process.exit(0);
    }
  }

  return options;
}

// ============================================================================
// DATABASE HELPERS
// ============================================================================

async function getAllCars() {
  const { data, error } = await supabase.from('cars').select('id, slug, name, brand');
  if (error) throw error;
  return data || [];
}

async function getExistingFitments() {
  const { data, error } = await supabase
    .from('part_fitments')
    .select('part_id, car_id');
  if (error) throw error;
  return data || [];
}

async function getPartsWithTags(options) {
  let query = supabase
    .from('parts')
    .select('id, name, brand_name, part_number, category, attributes, source_urls')
    .eq('is_active', true)
    .not('attributes', 'is', null)
    .limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function getExistingTagMappings() {
  const { data, error } = await supabase
    .from('fitment_tag_mappings')
    .select('vendor_key, tag, car_id, confidence');
  if (error) throw error;
  return data || [];
}

async function createFitment(fitment) {
  const { error } = await supabase
    .from('part_fitments')
    .insert(fitment)
    .select()
    .single();

  if (error && error.code !== '23505') { // Ignore unique constraint violations
    throw error;
  }
  return !error;
}

// ============================================================================
// FITMENT GENERATION LOGIC
// ============================================================================

function extractTagsFromPart(part) {
  const attrs = part?.attributes;
  if (!attrs) return [];

  const tags = [];

  // Source tags from Shopify ingestion
  if (attrs.source?.tagsRaw) {
    tags.push(...parseShopifyTags(attrs.source.tagsRaw));
  }

  // Vehicle tags
  if (attrs.vehicleTags) {
    tags.push(...parseShopifyTags(attrs.vehicleTags));
  }

  // Also check the product name for platform codes
  if (part.name) {
    tags.push(part.name);
  }

  return [...new Set(tags)];
}

function inferFitmentsFromPart(part, carsBySlug, existingFitmentSet, options) {
  const tags = extractTagsFromPart(part);
  if (tags.length === 0) return [];

  const vendorKey = part.attributes?.source?.vendor || 'unknown';

  // Filter families if vendor is specified
  let families = Object.keys(PLATFORM_TAG_PATTERNS);

  // Resolve matching cars from tags
  const matches = resolveCarSlugsFromTags(tags, families);

  const results = [];
  for (const match of matches) {
    const car = carsBySlug.get(match.car_slug);
    if (!car) {
      if (options.verbose) {
        console.log(`  [SKIP] Car slug not found in DB: ${match.car_slug}`);
      }
      continue;
    }

    // Check if we should process this car
    if (options.car && match.car_slug !== options.car) continue;
    if (options.priority) {
      const priorityCars = PRIORITY_CARS[`tier${options.priority}`] || [];
      if (!priorityCars.includes(match.car_slug)) continue;
    }

    // Check if fitment already exists
    const fitmentKey = `${part.id}:${car.id}`;
    if (existingFitmentSet.has(fitmentKey)) {
      if (options.verbose) {
        console.log(`  [EXISTS] ${part.name} -> ${car.name}`);
      }
      continue;
    }

    results.push({
      part_id: part.id,
      car_id: car.id,
      car_slug: match.car_slug,
      confidence: match.confidence,
      source_tags: match.tags,
      fitment_notes: `Inferred from tags: ${match.tags.join(', ')}`,
      requires_tune: false, // Conservative default
      install_difficulty: null,
      estimated_labor_hours: null,
      verified: false,
      source_url: part.source_urls?.[0] || null,
      metadata: {
        inference_source: 'expandFitments.mjs',
        matched_tags: match.tags,
        vendor_key: vendorKey,
        family: match.family,
        created_at: new Date().toISOString(),
      },
    });
  }

  return results;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const options = parseArgs();

  console.log('========================================');
  console.log('FITMENT EXPANSION SCRIPT');
  console.log('========================================');
  console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`);
  if (options.vendor) console.log(`Vendor filter: ${options.vendor}`);
  if (options.priority) console.log(`Priority tier: ${options.priority}`);
  if (options.car) console.log(`Car filter: ${options.car}`);
  console.log(`Part limit: ${options.limit}`);
  console.log('');

  // Load data
  console.log('Loading data...');
  const [cars, existingFitments, parts, tagMappings] = await Promise.all([
    getAllCars(),
    getExistingFitments(),
    getPartsWithTags(options),
    getExistingTagMappings(),
  ]);

  console.log(`  Cars in DB: ${cars.length}`);
  console.log(`  Existing fitments: ${existingFitments.length}`);
  console.log(`  Parts with tags: ${parts.length}`);
  console.log(`  Tag mappings: ${tagMappings.length}`);
  console.log('');

  // Build lookup structures
  const carsBySlug = new Map(cars.map((c) => [c.slug, c]));
  const existingFitmentSet = new Set(
    existingFitments.map((f) => `${f.part_id}:${f.car_id}`)
  );

  // Process parts
  console.log('Processing parts...');
  const allInferred = [];
  const carStats = new Map();

  for (const part of parts) {
    const inferred = inferFitmentsFromPart(part, carsBySlug, existingFitmentSet, options);

    for (const fit of inferred) {
      allInferred.push(fit);

      // Track stats by car
      const count = carStats.get(fit.car_slug) || 0;
      carStats.set(fit.car_slug, count + 1);

      if (options.verbose) {
        console.log(`  [NEW] ${part.brand_name} ${part.name} -> ${fit.car_slug} (conf: ${fit.confidence.toFixed(2)})`);
      }
    }
  }

  console.log('');
  console.log('========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`Parts processed: ${parts.length}`);
  console.log(`New fitments found: ${allInferred.length}`);
  console.log(`Cars affected: ${carStats.size}`);
  console.log('');

  // Show per-car breakdown
  if (carStats.size > 0) {
    console.log('Fitments by car:');
    const sorted = [...carStats.entries()].sort((a, b) => b[1] - a[1]);
    for (const [slug, count] of sorted.slice(0, 20)) {
      console.log(`  ${slug}: ${count}`);
    }
    if (sorted.length > 20) {
      console.log(`  ... and ${sorted.length - 20} more cars`);
    }
    console.log('');
  }

  // Write fitments if not dry run
  if (!options.dryRun && allInferred.length > 0) {
    console.log('Writing fitments to database...');
    let written = 0;
    let errors = 0;

    for (const fit of allInferred) {
      try {
        const created = await createFitment({
          part_id: fit.part_id,
          car_id: fit.car_id,
          fitment_notes: fit.fitment_notes,
          requires_tune: fit.requires_tune,
          install_difficulty: fit.install_difficulty,
          estimated_labor_hours: fit.estimated_labor_hours,
          verified: fit.verified,
          confidence: fit.confidence,
          source_url: fit.source_url,
          metadata: fit.metadata,
        });

        if (created) {
          written++;
          // Also mark as existing to avoid duplicates within this run
          existingFitmentSet.add(`${fit.part_id}:${fit.car_id}`);
        }
      } catch (err) {
        errors++;
        if (options.verbose) {
          console.error(`  [ERROR] ${fit.car_slug}: ${err.message}`);
        }
      }
    }

    console.log(`  Written: ${written}`);
    if (errors > 0) console.log(`  Errors: ${errors}`);
  } else if (options.dryRun) {
    console.log('[DRY RUN] No changes made. Remove --dry-run to write fitments.');
  }

  console.log('');
  console.log('Done!');
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});

