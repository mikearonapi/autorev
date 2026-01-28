#!/usr/bin/env node
/**
 * Test Parts Research Script
 * 
 * Tests the parts research flow for a single car + upgrade combo.
 * Uses Exa for web search and Claude for extraction.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import Anthropic from '@anthropic-ai/sdk';
import Exa from 'exa-js';
import { createClient } from '@supabase/supabase-js';
import { 
  extractManufacturerFromName, 
  isKnownRetailer,
  PART_MANUFACTURERS 
} from '../data/seedManufacturers.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const EXA_API_KEY = process.env.EXA_API_KEY;

// ============================================================================
// CLIENTS
// ============================================================================

function createSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

function createAnthropicClient() {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY must be set');
  }
  return new Anthropic({ apiKey: ANTHROPIC_API_KEY });
}

function createExaClient() {
  if (!EXA_API_KEY) {
    throw new Error('EXA_API_KEY must be set');
  }
  return new Exa(EXA_API_KEY);
}

// ============================================================================
// WEB RESEARCH
// ============================================================================

async function searchForParts(exa, carName, upgradeType) {
  console.log(`\n[Research] Searching for ${upgradeType} for ${carName}...`);
  
  const queries = [
    `best ${upgradeType} for ${carName} review`,
    `${carName} ${upgradeType} upgrade recommendations`,
    `top rated ${upgradeType} ${carName}`,
  ];

  const allResults = [];

  for (const query of queries) {
    try {
      const result = await exa.searchAndContents(query, {
        type: 'auto',
        numResults: 5,
        text: { maxCharacters: 1500 },
      });
      
      if (result.results) {
        allResults.push(...result.results.map(r => ({
          title: r.title,
          url: r.url,
          text: r.text?.slice(0, 1000) || '',
        })));
      }
    } catch (err) {
      console.warn(`[Research] Query failed: ${query}`, err.message);
    }
  }

  console.log(`[Research] Found ${allResults.length} results`);
  return allResults;
}

// ============================================================================
// AI EXTRACTION
// ============================================================================

async function extractPartsWithAI(anthropic, searchResults, carName, upgradeType) {
  console.log(`\n[AI] Extracting parts from search results...`);

  const knownManufacturers = PART_MANUFACTURERS.slice(0, 40).map(m => m.name).join(', ');

  const systemPrompt = `You are a parts data extraction assistant for automotive performance parts.

Your job is to analyze web search results and extract the TOP 5 part recommendations for "${upgradeType}" for a "${carName}".

For each part, extract:
1. manufacturer_name - The company that MAKES the part (e.g., "APR", "Integrated Engineering", "034 Motorsport")
   - This is NOT the store selling it (BMP Tuning, ECS Tuning are RETAILERS, not manufacturers)
   - Known manufacturers include: ${knownManufacturers}
2. product_name - The product name without the manufacturer prefix
3. price_cents - Price in cents (e.g., $1,299.99 = 129999), or null if not found
4. product_url - URL where it can be purchased
5. quality_tier - "budget", "mid", "premium", or "ultra-premium"
6. why_recommended - 1-2 sentences on why this is a good choice
7. differentiator - What makes this part unique vs competitors (1 sentence)
8. best_for - Who should buy this, e.g., "Stock to Stage 1 builds", "Track-focused builds", "Daily drivers"
9. fitment_confidence - "confirmed" (explicit fitment found), "likely" (platform matches), or "verify" (need to confirm)

Return ONLY valid JSON array, no markdown or explanation. Example:
[
  {
    "manufacturer_name": "Integrated Engineering",
    "product_name": "Carbon Fiber Cold Air Intake",
    "price_cents": 89900,
    "product_url": "https://...",
    "quality_tier": "premium",
    "why_recommended": "Best airflow gains, excellent build quality",
    "differentiator": "Largest volume intake for the platform with proven dyno results",
    "best_for": "Stage 1-2 builds seeking maximum airflow",
    "fitment_confidence": "confirmed"
  }
]`;

  const userPrompt = `Extract the top 5 ${upgradeType} recommendations for "${carName}" from these search results:

${JSON.stringify(searchResults.slice(0, 10), null, 2)}

Return ONLY a JSON array.`;

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
      const parts = JSON.parse(jsonMatch[0]);
      console.log(`[AI] Extracted ${parts.length} parts`);
      return parts;
    }
    
    console.warn(`[AI] Could not parse response`);
    return [];
  } catch (err) {
    console.error(`[AI] Extraction error: ${err.message}`);
    return [];
  }
}

// ============================================================================
// DATABASE STORAGE
// ============================================================================

function lookupManufacturerUrl(name) {
  const mfg = PART_MANUFACTURERS.find(
    m => m.name.toLowerCase() === name?.toLowerCase() ||
         m.aliases?.some(a => a.toLowerCase() === name?.toLowerCase())
  );
  return mfg?.website || null;
}

async function saveParts(supabase, carId, upgradeKey, parts) {
  console.log(`\n[DB] Saving ${parts.length} parts...`);
  
  let saved = 0;
  const savedPartIds = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    // Skip if manufacturer looks like a retailer
    if (isKnownRetailer(part.manufacturer_name)) {
      console.warn(`[DB] Skipping - retailer as manufacturer: ${part.manufacturer_name}`);
      continue;
    }

    try {
      // Build rich attributes from AL research
      const attributes = {
        discovered_via: 'al_batch_research',
        discovered_at: new Date().toISOString(),
      };
      if (part.why_recommended) attributes.why_recommended = part.why_recommended;
      if (part.differentiator) attributes.differentiator = part.differentiator;
      if (part.best_for) attributes.best_for = part.best_for;
      if (part.fitment_confidence) attributes.fitment_confidence = part.fitment_confidence;

      // Insert part with rich data
      const { data: newPart, error: partError } = await supabase
        .from('parts')
        .insert({
          name: part.product_name,
          manufacturer_name: part.manufacturer_name,
          manufacturer_url: lookupManufacturerUrl(part.manufacturer_name),
          brand_name: part.manufacturer_name, // backward compat
          category: upgradeKeyToCategory(upgradeKey),
          quality_tier: part.quality_tier || 'mid',
          description: part.why_recommended || null,
          data_source: 'al_research',
          source_urls: part.product_url ? [part.product_url] : [],
          attributes: attributes,
          is_active: true,
        })
        .select('id')
        .single();

      if (partError) {
        console.error(`[DB] Part insert error: ${partError.message}`);
        continue;
      }

      const partId = newPart.id;
      savedPartIds.push(partId);

      // Insert fitment
      await supabase
        .from('part_fitments')
        .insert({
          part_id: partId,
          car_id: carId,
          confidence: 0.8,
          verified: false,
          source_url: part.product_url,
        });

      // Insert AL recommendation
      await supabase
        .from('al_part_recommendations')
        .insert({
          car_id: carId,
          upgrade_key: upgradeKey,
          part_id: partId,
          rank: i + 1,
          source: 'batch_research',
        });

      // Insert pricing if available
      if (part.price_cents && part.product_url) {
        const vendorName = extractVendorFromUrl(part.product_url);
        await supabase
          .from('part_pricing_snapshots')
          .insert({
            part_id: partId,
            vendor_name: vendorName,
            product_url: part.product_url,
            price_cents: part.price_cents,
            currency: 'USD',
            recorded_at: new Date().toISOString().slice(0, 10),
          });
      }

      saved++;
      console.log(`[DB] Saved: ${part.manufacturer_name} ${part.product_name}`);
    } catch (err) {
      console.error(`[DB] Error: ${err.message}`);
    }
  }

  console.log(`[DB] Saved ${saved} of ${parts.length} parts`);
  return savedPartIds;
}

// Mapping from CLI-friendly names to actual upgrade keys used by UI
const UPGRADE_KEY_ALIASES = {
  'cold-air-intake': 'intake',  // UI uses 'intake'
  'cai': 'intake',
  'catback': 'exhaust-catback',
  'cat-back': 'exhaust-catback',
};

function normalizeUpgradeKey(key) {
  return UPGRADE_KEY_ALIASES[key] || key;
}

function upgradeKeyToCategory(key) {
  const map = {
    'intake': 'intake',
    'cold-air-intake': 'intake',
    'exhaust-catback': 'exhaust',
    'catback': 'exhaust',
    'downpipe': 'exhaust',
    'stage1-tune': 'tune',
    'coilovers-street': 'suspension',
    'intercooler': 'cooling',
  };
  return map[key] || 'other';
}

function extractVendorFromUrl(url) {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    const vendorMap = {
      'ecstuning.com': 'ECS Tuning',
      'fcpeuro.com': 'FCP Euro',
      '034motorsport.com': '034 Motorsport',
      'performancebyie.com': 'Integrated Engineering',
      'goapr.com': 'APR',
      'bmptuning.com': 'BMP Tuning',
      'urotuning.com': 'UroTuning',
    };
    return vendorMap[hostname] || hostname;
  } catch {
    return 'Unknown';
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const carSlug = process.argv[2] || 'audi-rs5-b9';
  const rawUpgradeKey = process.argv[3] || 'intake';
  const upgradeKey = normalizeUpgradeKey(rawUpgradeKey);

  console.log('='.repeat(60));
  console.log('PARTS RESEARCH TEST');
  console.log('='.repeat(60));
  console.log(`Car: ${carSlug}`);
  console.log(`Upgrade: ${upgradeKey}${rawUpgradeKey !== upgradeKey ? ` (normalized from ${rawUpgradeKey})` : ''}`);
  console.log('='.repeat(60));

  // Initialize clients
  const supabase = createSupabaseClient();
  const anthropic = createAnthropicClient();
  const exa = createExaClient();

  // Get car info
  const { data: car, error: carError } = await supabase
    .from('cars')
    .select('id, name, brand, years')
    .eq('slug', carSlug)
    .single();

  if (carError || !car) {
    throw new Error(`Car not found: ${carSlug}`);
  }

  console.log(`\nFound car: ${car.name} (${car.years})`);
  const carName = `${car.brand} ${car.name}`;

  // Step 1: Web research
  const searchResults = await searchForParts(exa, carName, upgradeKey);

  if (searchResults.length === 0) {
    console.log('\nNo search results found. Exiting.');
    return;
  }

  // Step 2: AI extraction
  const parts = await extractPartsWithAI(anthropic, searchResults, carName, upgradeKey);

  if (parts.length === 0) {
    console.log('\nNo parts extracted. Exiting.');
    return;
  }

  // Step 3: Save to database
  const savedIds = await saveParts(supabase, car.id, upgradeKey, parts);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60));
  console.log(`Parts saved: ${savedIds.length}`);
  console.log(`Part IDs: ${savedIds.join(', ')}`);
  console.log('='.repeat(60));

  // Verify
  const { data: recs } = await supabase
    .from('al_part_recommendations')
    .select(`
      rank,
      parts (
        manufacturer_name,
        name,
        manufacturer_url
      )
    `)
    .eq('car_id', car.id)
    .eq('upgrade_key', upgradeKey)
    .order('rank');

  console.log('\nSaved Recommendations:');
  for (const rec of recs || []) {
    console.log(`  ${rec.rank}. ${rec.parts?.manufacturer_name} - ${rec.parts?.name}`);
    if (rec.parts?.manufacturer_url) {
      console.log(`     → ${rec.parts.manufacturer_url}`);
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
