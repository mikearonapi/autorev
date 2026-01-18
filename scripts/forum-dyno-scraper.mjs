#!/usr/bin/env node
/**
 * Forum Dyno Scraper
 * 
 * Scrapes dyno results from automotive forums to build calibration data.
 * Uses Exa API for search, then extracts dyno data using AI.
 * 
 * ARCHITECTURE:
 * 1. Search forums for dyno-related posts using Exa
 * 2. Extract raw post content
 * 3. Parse dyno data using AI (GPT-4 or Claude)
 * 4. Store in forum_dyno_extractions table for verification
 * 5. Verified data feeds into calibration system
 * 
 * Usage:
 *   node scripts/forum-dyno-scraper.mjs --source=vwvortex --limit=50
 *   node scripts/forum-dyno-scraper.mjs --engine-family=EA888_Gen3 --limit=100
 *   node scripts/forum-dyno-scraper.mjs --all-sources --limit=20
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================================================
// EXA SEARCH (via MCP or direct API)
// ============================================================================

async function searchForumPosts(query, domain, limit = 20) {
  // Check if we have Exa API key
  const exaApiKey = process.env.EXA_API_KEY;
  
  if (!exaApiKey) {
    console.warn('⚠️  EXA_API_KEY not set - using mock data for development');
    return getMockSearchResults(domain);
  }
  
  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': exaApiKey,
      },
      body: JSON.stringify({
        query: query,
        numResults: limit,
        includeDomains: [domain],
        useAutoprompt: true,
        type: 'neural',
        contents: {
          text: {
            maxCharacters: 5000,
          },
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Exa API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Exa search failed:', error.message);
    return [];
  }
}

function getMockSearchResults(domain) {
  // Mock data for development/testing
  return [
    {
      url: `https://${domain}/threads/my-dyno-results-stage-1-tune.12345/`,
      title: 'My Dyno Results - Stage 1 Tune',
      text: `Just got back from the dyno shop with my 2019 Golf R. 
             Stock baseline was 270 WHP / 290 WTQ on a Dynojet.
             After APR Stage 1 tune: 342 WHP / 368 WTQ
             Running 93 octane. Pretty happy with the gains!
             Mods: APR Stage 1, stock everything else.`,
      publishedDate: '2024-06-15',
    },
  ];
}

// ============================================================================
// AI EXTRACTION
// ============================================================================

const EXTRACTION_PROMPT = `You are an expert at extracting dyno data from forum posts. 
Extract the following information if present. Be conservative - only extract data you're confident about.

Return a JSON object with these fields (use null for missing data):
{
  "car_year": number or null,
  "car_make": string or null,
  "car_model": string or null,
  "car_variant": string or null (e.g., "Golf R", "M3 Competition"),
  
  "stock_hp": number or null (crank HP if specified as stock),
  "stock_whp": number or null (wheel HP if specified as stock),
  "stock_wtq": number or null (wheel torque if specified as stock),
  
  "modded_hp": number or null (crank HP after mods),
  "modded_whp": number or null (wheel HP after mods),
  "modded_wtq": number or null (wheel torque after mods),
  
  "mods_list": string[] (list of modifications mentioned),
  "tune_brand": string or null (e.g., "APR", "Cobb", "Unitronic"),
  "tune_stage": string or null (e.g., "Stage 1", "Stage 2"),
  
  "dyno_type": string or null (e.g., "Dynojet", "Mustang", "Mainline"),
  "fuel_type": string or null (e.g., "93", "91", "E85", "E30"),
  "boost_psi": number or null,
  
  "confidence": number (0-1, your confidence in the extraction accuracy),
  "notes": string or null (any caveats or uncertainties)
}

Forum post to extract from:
---
{POST_TEXT}
---

Return ONLY valid JSON, no other text.`;

async function extractDynoData(postText, url) {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: EXTRACTION_PROMPT.replace('{POST_TEXT}', postText),
        },
      ],
    });
    
    const content = response.content[0].text;
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { error: 'No JSON found in response', raw: content };
    }
    
    const extracted = JSON.parse(jsonMatch[0]);
    extracted.source_url = url;
    
    return extracted;
  } catch (error) {
    console.error('AI extraction failed:', error.message);
    return { error: error.message };
  }
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

async function getDataSource(sourceName) {
  const { data, error } = await supabase
    .from('dyno_data_sources')
    .select('*')
    .eq('source_name', sourceName)
    .single();
  
  return error ? null : data;
}

async function getAllDataSources() {
  const { data, error } = await supabase
    .from('dyno_data_sources')
    .select('*')
    .eq('scrape_enabled', true);
  
  return error ? [] : data;
}

async function checkUrlAlreadyScraped(url) {
  const { data } = await supabase
    .from('forum_dyno_extractions')
    .select('id')
    .eq('source_url', url)
    .limit(1);
  
  return data && data.length > 0;
}

async function saveExtraction(sourceId, url, postText, extracted) {
  const record = {
    source_id: sourceId,
    source_url: url,
    thread_title: extracted.thread_title || null,
    
    // Car info
    extracted_car_text: [
      extracted.car_year,
      extracted.car_make,
      extracted.car_model,
      extracted.car_variant,
    ].filter(Boolean).join(' '),
    
    // Mods
    extracted_mods_text: extracted.mods_list?.join(', ') || null,
    parsed_mods: extracted.mods_list || [],
    
    // Dyno numbers
    extracted_stock_hp: extracted.stock_hp,
    extracted_stock_whp: extracted.stock_whp,
    extracted_modded_hp: extracted.modded_hp,
    extracted_modded_whp: extracted.modded_whp,
    extracted_hp_gain: extracted.modded_whp && extracted.stock_whp 
      ? extracted.modded_whp - extracted.stock_whp 
      : null,
    
    // Conditions
    extracted_dyno_type: extracted.dyno_type,
    extracted_fuel_type: extracted.fuel_type,
    extracted_boost_psi: extracted.boost_psi,
    
    // Raw data
    raw_text: postText.substring(0, 10000), // Limit size
    extraction_method: 'claude',
    
    // Status
    status: 'pending',
    extraction_confidence: extracted.confidence || 0.5,
  };
  
  const { data, error } = await supabase
    .from('forum_dyno_extractions')
    .insert(record)
    .select()
    .single();
  
  if (error) {
    console.error('Failed to save extraction:', error.message);
    return null;
  }
  
  return data;
}

async function updateSourceStats(sourceId, totalExtractions) {
  await supabase
    .from('dyno_data_sources')
    .update({
      total_extractions: totalExtractions,
      last_scraped_at: new Date().toISOString(),
      last_scrape_success: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sourceId);
}

// ============================================================================
// SEARCH QUERIES BY ENGINE FAMILY
// ============================================================================

const SEARCH_QUERIES = {
  '4B11': [
    'Evo X dyno results stage 3',
    'Evo X FP Black dyno',
    'Lancer Evolution X dyno tune',
    'Evo X E85 dyno results',
    'Evo X big turbo dyno',
    'EvoX dyno sheet AMS',
  ],
  EA888_Gen3: [
    'Golf GTI MK7 dyno results stage 1',
    'Golf R dyno APR Cobb tune',
    'Audi S3 8V dyno results',
    'GTI MK7.5 dyno sheet',
  ],
  EA855_RS3: [
    'RS3 8V dyno results tune',
    'TTRS dyno APR stage',
    'Audi 2.5 TFSI dyno results',
  ],
  B58: [
    'B58 Supra dyno tune',
    'M340i dyno results stage',
    'BMW B58 dyno sheet tune',
  ],
  S55: [
    'F80 M3 dyno results tune',
    'F82 M4 dyno bootmod3',
    'S55 dyno sheet stage',
  ],
  Coyote_Gen3: [
    'Mustang GT S550 dyno tune',
    '5.0 Coyote dyno results',
    'Mustang GT 2018+ dyno sheet',
  ],
  Voodoo: [
    'GT350 dyno results supercharger',
    'Voodoo 5.2 dyno sheet',
    'Shelby GT350 dyno whipple',
  ],
  LT1_Gen5: [
    'C7 Corvette dyno tune',
    'Camaro SS LT1 dyno results',
    '6th gen Camaro SS dyno',
  ],
  Hellcat: [
    'Hellcat dyno results tune',
    'Hellcat pulley dyno',
    'Charger Hellcat dyno sheet',
  ],
  K20C1: [
    'Civic Type R FK8 dyno tune',
    'CTR dyno results Hondata',
    'K20C1 dyno sheet tune',
  ],
  VR38DETT: [
    'GT-R R35 dyno results tune',
    'Nissan GTR dyno cobb',
    'VR38 dyno sheet',
  ],
};

// ============================================================================
// MAIN SCRAPER LOGIC
// ============================================================================

async function scrapeSource(source, queries, limit) {
  console.log(`\n📡 Scraping ${source.display_name} (${source.base_url})`);
  console.log('─'.repeat(60));
  
  const domain = new URL(source.base_url).hostname.replace('www.', '');
  const results = [];
  
  for (const query of queries) {
    console.log(`  🔍 Searching: "${query}"`);
    
    const searchResults = await searchForumPosts(query, domain, Math.ceil(limit / queries.length));
    
    for (const result of searchResults) {
      // Skip if already scraped
      if (await checkUrlAlreadyScraped(result.url)) {
        console.log(`  ⏭️  Skipping (already scraped): ${result.url.substring(0, 60)}...`);
        continue;
      }
      
      // Extract dyno data
      console.log(`  📄 Extracting: ${result.title?.substring(0, 50) || result.url.substring(0, 50)}...`);
      
      const extracted = await extractDynoData(result.text, result.url);
      
      if (extracted.error) {
        console.log(`  ❌ Extraction failed: ${extracted.error}`);
        continue;
      }
      
      // Check if we got any useful dyno data
      if (!extracted.modded_whp && !extracted.modded_hp) {
        console.log(`  ⚠️  No dyno numbers found`);
        continue;
      }
      
      // Save to database
      const saved = await saveExtraction(source.id, result.url, result.text, {
        ...extracted,
        thread_title: result.title,
      });
      
      if (saved) {
        console.log(`  ✅ Saved: ${extracted.stock_whp || '?'} → ${extracted.modded_whp || '?'} WHP`);
        results.push(saved);
      }
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  // Update source stats
  const { count } = await supabase
    .from('forum_dyno_extractions')
    .select('id', { count: 'exact', head: true })
    .eq('source_id', source.id);
  
  await updateSourceStats(source.id, count || 0);
  
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const sourceArg = args.find(a => a.startsWith('--source='))?.split('=')[1];
  const engineFamilyArg = args.find(a => a.startsWith('--engine-family='))?.split('=')[1];
  const limitArg = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '20');
  const allSources = args.includes('--all-sources');
  
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║               FORUM DYNO SCRAPER                                  ║
║                                                                    ║
║  Extracts dyno data from automotive forums for calibration        ║
╚══════════════════════════════════════════════════════════════════╝
`);

  // Determine which sources to scrape
  let sources = [];
  let queries = [];
  
  if (sourceArg) {
    const source = await getDataSource(sourceArg);
    if (!source) {
      console.error(`❌ Source not found: ${sourceArg}`);
      process.exit(1);
    }
    sources = [source];
    
    // Get queries for this source's engine families
    const families = source.engine_families || [];
    queries = families.flatMap(f => SEARCH_QUERIES[f] || []);
    if (queries.length === 0) {
      queries = [`${source.display_name} dyno results tune`];
    }
  } else if (engineFamilyArg) {
    queries = SEARCH_QUERIES[engineFamilyArg] || [];
    if (queries.length === 0) {
      console.error(`❌ No queries defined for engine family: ${engineFamilyArg}`);
      process.exit(1);
    }
    sources = await getAllDataSources();
  } else if (allSources) {
    sources = await getAllDataSources();
  } else {
    console.log('Usage:');
    console.log('  --source=<source_name>     Scrape specific source (e.g., vwvortex)');
    console.log('  --engine-family=<family>   Search for specific engine family');
    console.log('  --all-sources              Scrape all enabled sources');
    console.log('  --limit=<n>                Limit results per source (default: 20)');
    process.exit(0);
  }

  console.log(`Sources to scrape: ${sources.length}`);
  console.log(`Result limit per source: ${limitArg}`);
  
  // Scrape each source
  let totalExtracted = 0;
  
  for (const source of sources) {
    const sourceQueries = queries.length > 0 
      ? queries 
      : (source.engine_families || []).flatMap(f => SEARCH_QUERIES[f] || []);
    
    if (sourceQueries.length === 0) {
      console.log(`\n⏭️  Skipping ${source.display_name} - no queries defined`);
      continue;
    }
    
    const results = await scrapeSource(source, sourceQueries, limitArg);
    totalExtracted += results.length;
  }

  console.log(`
═══════════════════════════════════════════════════════════════════
SCRAPING COMPLETE
Total extractions: ${totalExtracted}
═══════════════════════════════════════════════════════════════════

Next steps:
1. Review extractions: SELECT * FROM forum_dyno_extractions WHERE status = 'pending'
2. Verify data and match to cars
3. Run calibration update

`);
}

main().catch(console.error);
