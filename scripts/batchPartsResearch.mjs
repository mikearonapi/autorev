#!/usr/bin/env node
/**
 * Batch Parts Research Script
 * 
 * Systematically researches parts for all cars across priority upgrade categories
 * using AL's research_parts_live tool. Stores results with proper manufacturer
 * attribution in parts table and al_part_recommendations.
 * 
 * Usage:
 *   node scripts/batchPartsResearch.mjs [--pilot] [--cars=5] [--categories=5] [--dry-run]
 * 
 * Options:
 *   --pilot       Run a pilot test with limited scope (5 cars x 5 categories)
 *   --cars=N      Process only N cars (default: all)
 *   --categories=N Process only N categories (default: 10)
 *   --dry-run     Don't save to database, just log what would be done
 *   --resume      Resume from last checkpoint
 *   --car-slug=X  Process only a specific car
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { 
  extractManufacturerFromName, 
  isKnownRetailer,
  PART_MANUFACTURERS 
} from '../data/seedManufacturers.js';

// Note: researchPartsLive has complex dependencies, so we'll call the Exa API directly
// for the batch script to avoid module resolution issues with @/ paths

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Priority upgrade categories to research
const PRIORITY_CATEGORIES = [
  // Priority 1 - Most common upgrades
  'intake',
  'exhaust-catback',
  'downpipe',
  'stage1-tune',
  'coilovers-street',
  'intercooler',
  'lowering-springs',
  'big-brake-kit',
  'cold-air-intake',
  'headers',
  // Priority 2 - Secondary upgrades
  'exhaust-axleback',
  'stage2-tune',
  'sway-bars',
  'brake-pads-track',
  'turbo-upgrade-existing',
  'oil-cooler',
  'clutch-upgrade',
  'supercharger-kit',
  'flex-fuel-e85',
  'wheels-lightweight',
];

// Rate limiting
const DELAY_BETWEEN_REQUESTS_MS = 500; // Exa rate limiting
const DELAY_BETWEEN_AI_CALLS_MS = 200; // Anthropic rate limiting

// ============================================================================
// HELPERS
// ============================================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    pilot: false,
    cars: null,
    categories: 10,
    dryRun: false,
    resume: false,
    carSlug: null,
  };
  
  for (const arg of args) {
    if (arg === '--pilot') {
      options.pilot = true;
      options.cars = 5;
      options.categories = 5;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--resume') {
      options.resume = true;
    } else if (arg.startsWith('--cars=')) {
      options.cars = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--categories=')) {
      options.categories = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--car-slug=')) {
      options.carSlug = arg.split('=')[1];
    }
  }
  
  return options;
}

// ============================================================================
// DATABASE
// ============================================================================

function createSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

async function getAllCars(client, limit = null) {
  let query = client
    .from('cars')
    .select('id, slug, name, brand, years')
    .order('brand', { ascending: true });
  
  if (limit) {
    query = query.limit(limit);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function getCompletedResearch(client) {
  const { data, error } = await client
    .from('al_part_recommendations')
    .select('car_id, upgrade_key')
    .order('car_id');
  
  if (error) {
    // Table might not exist yet
    console.log('[Batch] al_part_recommendations table not found, starting fresh');
    return new Set();
  }
  
  // Create a Set of "car_id:upgrade_key" combinations already done
  const completed = new Set();
  for (const row of data || []) {
    completed.add(`${row.car_id}:${row.upgrade_key}`);
  }
  return completed;
}

// ============================================================================
// AI EXTRACTION
// ============================================================================

function createAnthropicClient() {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY must be set');
  }
  return new Anthropic({ apiKey: ANTHROPIC_API_KEY });
}

/**
 * Use Claude to extract structured part recommendations from research results
 */
async function extractPartsWithAI(anthropic, researchResults, carSlug, upgradeKey) {
  const systemPrompt = `You are a parts data extraction assistant. Your job is to analyze web research results and extract structured part recommendations.

For each part you find, you MUST:
1. Identify the actual MANUFACTURER (e.g., "APR", "Borla", "HKS") - NOT the retailer (BMP Tuning, FT Speed, etc.)
2. Extract the product name (without the manufacturer prefix)
3. Find the price (if available)
4. Find the product URL

CRITICAL: The "manufacturer" field must be the company that MAKES the part, not the store selling it.
- "APR" makes tuning products → manufacturer = "APR"
- "BMP Tuning" SELLS APR products → they are a RETAILER, not manufacturer
- "Borla" makes exhausts → manufacturer = "Borla"
- "FT Speed" SELLS Borla exhausts → they are a RETAILER, not manufacturer

Known manufacturers include: ${PART_MANUFACTURERS.slice(0, 30).map(m => m.name).join(', ')}, and many more.

Return a JSON array of the top 5 parts. Each part should have:
{
  "manufacturer_name": "APR",
  "product_name": "Stage 1 ECU Tune",
  "price_cents": 79900,
  "product_url": "https://...",
  "vendor_name": "BMP Tuning",
  "vendor_url": "https://bmptuning.com/...",
  "quality_tier": "premium",
  "rank": 1,
  "confidence": 0.9,
  "notes": "Why this is recommended"
}

If you cannot identify the manufacturer, set confidence to 0.5 or lower.
Only return valid JSON, no markdown or explanation.`;

  const userPrompt = `Extract the top 5 part recommendations for "${upgradeKey}" from this research data for car "${carSlug}":

${JSON.stringify(researchResults.web_research?.results?.slice(0, 15) || [], null, 2)}

Return ONLY a JSON array of parts.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content[0]?.text || '';
    
    // Try to parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    console.warn(`[Batch] Could not parse AI response for ${carSlug}/${upgradeKey}`);
    return [];
  } catch (err) {
    console.error(`[Batch] AI extraction error: ${err.message}`);
    return [];
  }
}

// ============================================================================
// STORAGE
// ============================================================================

async function savePartRecommendations(client, carId, carSlug, upgradeKey, parts, dryRun) {
  if (dryRun) {
    console.log(`[DRY-RUN] Would save ${parts.length} parts for ${carSlug}/${upgradeKey}`);
    return { saved: 0, skipped: parts.length };
  }

  let saved = 0;
  let skipped = 0;

  for (const part of parts) {
    try {
      // Skip if manufacturer is a known retailer (data quality issue)
      if (isKnownRetailer(part.manufacturer_name)) {
        console.warn(`[Batch] Skipping part with retailer as manufacturer: ${part.manufacturer_name}`);
        skipped++;
        continue;
      }

      // Try to find or create the part
      const { data: existingPart, error: findError } = await client
        .from('parts')
        .select('id')
        .eq('manufacturer_name', part.manufacturer_name)
        .ilike('name', `%${part.product_name}%`)
        .maybeSingle();

      let partId;

      if (existingPart?.id) {
        partId = existingPart.id;
      } else {
        // Insert new part with proper manufacturer attribution
        const { data: newPart, error: insertError } = await client
          .from('parts')
          .insert({
            name: part.product_name,
            manufacturer_name: part.manufacturer_name,
            manufacturer_url: lookupManufacturerUrl(part.manufacturer_name),
            brand_name: part.manufacturer_name, // For backward compatibility
            category: upgradeKeyToCategory(upgradeKey),
            quality_tier: part.quality_tier || 'mid',
            data_source: 'al_research',
            source_urls: part.product_url ? [part.product_url] : [],
            confidence: part.confidence || 0.7,
            is_active: true,
          })
          .select('id')
          .single();

        if (insertError) {
          console.error(`[Batch] Error inserting part: ${insertError.message}`);
          skipped++;
          continue;
        }
        partId = newPart.id;
      }

      // Save pricing snapshot if we have vendor info
      if (part.vendor_name && part.price_cents) {
        await client
          .from('part_pricing_snapshots')
          .upsert({
            part_id: partId,
            vendor_name: part.vendor_name,
            vendor_url: part.vendor_url || null,
            product_url: part.product_url || null,
            price_cents: part.price_cents,
            currency: 'USD',
            recorded_at: new Date().toISOString().slice(0, 10),
          }, {
            onConflict: 'part_id,vendor_name,recorded_at',
          });
      }

      // Create fitment record
      await client
        .from('part_fitments')
        .upsert({
          part_id: partId,
          car_id: carId,
          confidence: part.confidence || 0.7,
          verified: false,
          source_url: part.product_url,
        }, {
          onConflict: 'part_id,car_id',
          ignoreDuplicates: true,
        });

      // Save AL recommendation
      await client
        .from('al_part_recommendations')
        .upsert({
          car_id: carId,
          upgrade_key: upgradeKey,
          part_id: partId,
          rank: part.rank || (saved + 1),
          source: 'batch_research',
        }, {
          onConflict: 'car_id,upgrade_key,rank',
        });

      saved++;
    } catch (err) {
      console.error(`[Batch] Error saving part: ${err.message}`);
      skipped++;
    }
  }

  return { saved, skipped };
}

function lookupManufacturerUrl(name) {
  const mfg = PART_MANUFACTURERS.find(
    m => m.name.toLowerCase() === name.toLowerCase() ||
         m.aliases?.some(a => a.toLowerCase() === name.toLowerCase())
  );
  return mfg?.website || null;
}

function upgradeKeyToCategory(upgradeKey) {
  const map = {
    'intake': 'intake',
    'cold-air-intake': 'intake',
    'exhaust-catback': 'exhaust',
    'exhaust-axleback': 'exhaust',
    'downpipe': 'exhaust',
    'headers': 'exhaust',
    'stage1-tune': 'tune',
    'stage2-tune': 'tune',
    'coilovers-street': 'suspension',
    'coilovers-track': 'suspension',
    'lowering-springs': 'suspension',
    'sway-bars': 'suspension',
    'big-brake-kit': 'brakes',
    'brake-pads-track': 'brakes',
    'intercooler': 'cooling',
    'oil-cooler': 'cooling',
    'turbo-upgrade-existing': 'forced_induction',
    'supercharger-kit': 'forced_induction',
    'clutch-upgrade': 'drivetrain',
    'flex-fuel-e85': 'fuel_system',
    'wheels-lightweight': 'wheels_tires',
  };
  return map[upgradeKey] || 'other';
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const options = parseArgs();
  
  console.log('='.repeat(60));
  console.log('BATCH PARTS RESEARCH');
  console.log('='.repeat(60));
  console.log(`Mode: ${options.pilot ? 'PILOT' : 'FULL'}`);
  console.log(`Dry run: ${options.dryRun}`);
  console.log(`Cars limit: ${options.cars || 'all'}`);
  console.log(`Categories: ${options.categories}`);
  console.log('='.repeat(60));

  // Initialize clients
  const supabase = createSupabaseClient();
  const anthropic = createAnthropicClient();

  // Get cars to process
  let cars;
  if (options.carSlug) {
    const { data, error } = await supabase
      .from('cars')
      .select('id, slug, name, brand, years')
      .eq('slug', options.carSlug)
      .single();
    if (error) throw error;
    cars = [data];
  } else {
    cars = await getAllCars(supabase, options.cars);
  }
  
  console.log(`[Batch] Processing ${cars.length} cars`);

  // Get categories to process
  const categories = PRIORITY_CATEGORIES.slice(0, options.categories);
  console.log(`[Batch] Processing ${categories.length} categories: ${categories.join(', ')}`);

  // Get already completed research (for resume)
  const completed = options.resume ? await getCompletedResearch(supabase) : new Set();
  console.log(`[Batch] Already completed: ${completed.size} combinations`);

  // Progress tracking
  const totalTasks = cars.length * categories.length;
  let processedTasks = 0;
  let savedParts = 0;
  let skippedTasks = 0;
  let errors = 0;

  const startTime = Date.now();

  // Process each car
  for (const car of cars) {
    console.log(`\n[Batch] Processing: ${car.name} (${car.slug})`);

    for (const upgradeKey of categories) {
      processedTasks++;
      const taskKey = `${car.id}:${upgradeKey}`;

      // Skip if already completed
      if (completed.has(taskKey)) {
        console.log(`  [Skip] ${upgradeKey} - already completed`);
        skippedTasks++;
        continue;
      }

      const progress = ((processedTasks / totalTasks) * 100).toFixed(1);
      console.log(`  [${progress}%] Researching: ${upgradeKey}`);

      try {
        // Step 1: Run web research
        const researchResults = await researchPartsLive({
          car_slug: car.slug,
          upgrade_type: upgradeKey,
        });

        if (!researchResults.success || !researchResults.web_research) {
          console.log(`    [Warn] No research results for ${upgradeKey}`);
          errors++;
          continue;
        }

        await sleep(DELAY_BETWEEN_REQUESTS_MS);

        // Step 2: Extract parts with AI
        const parts = await extractPartsWithAI(
          anthropic,
          researchResults,
          car.slug,
          upgradeKey
        );

        if (parts.length === 0) {
          console.log(`    [Warn] No parts extracted for ${upgradeKey}`);
          continue;
        }

        await sleep(DELAY_BETWEEN_AI_CALLS_MS);

        // Step 3: Save to database
        const { saved, skipped } = await savePartRecommendations(
          supabase,
          car.id,
          car.slug,
          upgradeKey,
          parts,
          options.dryRun
        );

        savedParts += saved;
        console.log(`    [OK] Saved ${saved} parts (skipped ${skipped})`);

      } catch (err) {
        console.error(`    [Error] ${err.message}`);
        errors++;
      }
    }
  }

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log('\n' + '='.repeat(60));
  console.log('BATCH RESEARCH COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total tasks: ${totalTasks}`);
  console.log(`Processed: ${processedTasks}`);
  console.log(`Skipped (already done): ${skippedTasks}`);
  console.log(`Errors: ${errors}`);
  console.log(`Parts saved: ${savedParts}`);
  console.log(`Time elapsed: ${elapsed} minutes`);
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
