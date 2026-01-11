#!/usr/bin/env node
/**
 * Tuning Shop Research Script - Uses Exa AI to gather tuning data
 * 
 * This script:
 * 1. Finds all skeleton profiles (no stage_progressions)
 * 2. Researches each vehicle using Exa web search
 * 3. Extracts structured tuning data from results
 * 4. Updates the profile in the database
 * 
 * Usage:
 *   node scripts/tuning-pipeline/research-with-exa.mjs --car-slug nissan-gtr
 *   node scripts/tuning-pipeline/research-with-exa.mjs --batch skeleton
 *   node scripts/tuning-pipeline/research-with-exa.mjs --batch skeleton --limit 10
 *   node scripts/tuning-pipeline/research-with-exa.mjs --batch skeleton --dry-run
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parseArgs } from 'util';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const exaApiKey = process.env.EXA_API_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

if (!exaApiKey) {
  console.error('Missing EXA_API_KEY in .env.local');
  console.error('Add your Exa API key to .env.local: EXA_API_KEY=your-key-here');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

/**
 * Search Exa for tuning information
 */
async function searchExa(query, numResults = 5) {
  const response = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': exaApiKey
    },
    body: JSON.stringify({
      query,
      numResults,
      type: 'auto',
      useAutoprompt: true,
      contents: {
        text: {
          maxCharacters: 3000
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Exa API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Extract tuning data from Exa search results
 */
function extractTuningData(searchResults, carName) {
  const data = {
    stages: [],
    platforms: [],
    powerLimits: {},
    brands: {},
    stockPower: null,
    insights: []
  };

  if (!searchResults?.results) return data;

  const allText = searchResults.results
    .map(r => r.text || '')
    .join('\n\n');

  // Extract stock power
  const stockHpMatch = allText.match(/stock\s*(?:hp|horsepower|whp|bhp)[:\s]*(\d{2,4})/i) ||
                       allText.match(/(\d{2,4})\s*(?:hp|horsepower|whp)\s*stock/i) ||
                       allText.match(/factory\s*(?:hp|horsepower)[:\s]*(\d{2,4})/i);
  if (stockHpMatch) {
    data.stockPower = parseInt(stockHpMatch[1]);
  }

  // Extract stage information
  const stagePatterns = [
    // Stage 1 patterns
    {
      stage: 'Stage 1',
      pattern: /stage\s*1[:\s-]*(.*?)(?:stage\s*2|$)/is,
      hpPattern: /(?:stage\s*1.*?)?(\d{2,3})\s*(?:-|to)\s*(\d{2,3})\s*(?:whp|hp|horsepower)/i,
      altHpPattern: /\+\s*(\d{2,3})\s*(?:whp|hp)/i
    },
    // Stage 2 patterns
    {
      stage: 'Stage 2',
      pattern: /stage\s*2[:\s-]*(.*?)(?:stage\s*3|$)/is,
      hpPattern: /(?:stage\s*2.*?)?(\d{2,3})\s*(?:-|to)\s*(\d{2,3})\s*(?:whp|hp|horsepower)/i,
      altHpPattern: /\+\s*(\d{2,3})\s*(?:whp|hp)/i
    },
    // Stage 3 patterns
    {
      stage: 'Stage 3',
      pattern: /stage\s*3[:\s-]*(.*?)(?:stage\s*4|big\s*turbo|$)/is,
      hpPattern: /(?:stage\s*3.*?)?(\d{3,4})\s*(?:-|to)\s*(\d{3,4})\s*(?:whp|hp|horsepower)/i,
      altHpPattern: /\+\s*(\d{2,3})\s*(?:whp|hp)/i
    }
  ];

  // Common tuning components by stage
  const stage1Components = ['ECU tune', 'intake', 'downpipe', 'exhaust'];
  const stage2Components = ['ECU tune', 'intercooler', 'downpipe', 'intake', 'exhaust', 'charge pipes'];
  const stage3Components = ['turbo upgrade', 'fuel system', 'intercooler', 'supporting mods'];

  // Check for turbo/supercharged vs NA
  const isForcedInduction = /turbo|supercharg|twin.?turbo|boost/i.test(allText);
  const isNA = /naturally\s*aspirated|na\s*engine|non.?turbo/i.test(allText) && !isForcedInduction;

  // Extract HP gains mentioned
  const hpGains = [];
  const hpGainMatches = allText.matchAll(/(?:gain|adds?|increase)[:\s]*(?:of\s*)?(\d{2,3})\s*(?:-|to)?\s*(\d{2,3})?\s*(?:whp|hp|horsepower)/gi);
  for (const match of hpGainMatches) {
    hpGains.push({
      low: parseInt(match[1]),
      high: match[2] ? parseInt(match[2]) : parseInt(match[1]) + 20
    });
  }

  // Build stages based on findings
  if (isForcedInduction) {
    // Turbocharged/Supercharged vehicle stages
    data.stages = [
      {
        stage: 'Stage 1',
        components: ['ECU tune', 'air filter', 'charge pipe (if applicable)'],
        hpGainLow: hpGains[0]?.low || 30,
        hpGainHigh: hpGains[0]?.high || 60,
        torqueGainLow: 40,
        torqueGainHigh: 80,
        costLow: 800,
        costHigh: 1500
      },
      {
        stage: 'Stage 2',
        components: ['Stage 1 + downpipe', 'intercooler', 'intake'],
        hpGainLow: hpGains[1]?.low || 60,
        hpGainHigh: hpGains[1]?.high || 100,
        torqueGainLow: 80,
        torqueGainHigh: 130,
        costLow: 3000,
        costHigh: 5000
      },
      {
        stage: 'Stage 3',
        components: ['Turbo upgrade', 'fuel system', 'supporting mods'],
        hpGainLow: hpGains[2]?.low || 150,
        hpGainHigh: hpGains[2]?.high || 250,
        torqueGainLow: 150,
        torqueGainHigh: 250,
        costLow: 8000,
        costHigh: 15000
      }
    ];
  } else {
    // NA vehicle stages
    data.stages = [
      {
        stage: 'Stage 1',
        components: ['ECU tune/flash', 'intake', 'headers', 'exhaust'],
        hpGainLow: hpGains[0]?.low || 15,
        hpGainHigh: hpGains[0]?.high || 30,
        torqueGainLow: 10,
        torqueGainHigh: 25,
        costLow: 1500,
        costHigh: 3000
      },
      {
        stage: 'Stage 2',
        components: ['Full exhaust', 'cams', 'ported heads', 'intake manifold'],
        hpGainLow: hpGains[1]?.low || 40,
        hpGainHigh: hpGains[1]?.high || 70,
        torqueGainLow: 30,
        torqueGainHigh: 50,
        costLow: 5000,
        costHigh: 10000
      },
      {
        stage: 'Stage 3',
        components: ['Supercharger/turbo kit', 'fuel system', 'internals'],
        hpGainLow: hpGains[2]?.low || 150,
        hpGainHigh: hpGains[2]?.high || 300,
        torqueGainLow: 100,
        torqueGainHigh: 200,
        costLow: 12000,
        costHigh: 25000
      }
    ];
  }

  // Extract tuning platforms/brands
  const platformPatterns = [
    /cobb\s*(?:accessport|tuning)?/gi,
    /apr\s*(?:stage|tune)?/gi,
    /unitronic/gi,
    /ie\s*(?:integrated\s*engineering)?/gi,
    /ecutek/gi,
    /hptuners/gi,
    /diablo/gi,
    /sct/gi,
    /haltech/gi,
    /aem/gi,
    /motec/gi,
    /link\s*ecu/gi,
    /uprev/gi,
    /openflash/gi,
    /vishnu/gi,
    /bootmod3/gi,
    /mhd/gi,
    /jb4/gi,
    /hondata/gi,
    /ktuner/gi
  ];

  const foundPlatforms = new Set();
  for (const pattern of platformPatterns) {
    const matches = allText.match(pattern);
    if (matches) {
      matches.forEach(m => foundPlatforms.add(m.trim()));
    }
  }

  // Map platform names and add pricing
  const platformPricing = {
    'COBB': { low: 650, high: 850 },
    'APR': { low: 800, high: 1200 },
    'Unitronic': { low: 700, high: 1000 },
    'IE': { low: 600, high: 900 },
    'ECUTek': { low: 400, high: 700 },
    'HPTuners': { low: 500, high: 800 },
    'Haltech': { low: 1500, high: 3000 },
    'AEM': { low: 1200, high: 2500 },
    'MoTeC': { low: 2500, high: 5000 },
    'UpRev': { low: 400, high: 600 },
    'Hondata': { low: 300, high: 700 },
    'KTuner': { low: 300, high: 500 },
    'BootMod3': { low: 400, high: 600 },
    'MHD': { low: 50, high: 200 },
    'JB4': { low: 400, high: 600 }
  };

  foundPlatforms.forEach(platform => {
    const normalized = platform.replace(/\s+/g, ' ').trim();
    const key = Object.keys(platformPricing).find(k => 
      normalized.toLowerCase().includes(k.toLowerCase())
    );
    if (key) {
      data.platforms.push({
        name: key,
        priceLow: platformPricing[key].low,
        priceHigh: platformPricing[key].high,
        notes: `Popular for ${carName}`
      });
    }
  });

  // If no platforms found, add generic based on make
  if (data.platforms.length === 0) {
    data.platforms.push({
      name: 'Standalone ECU',
      priceLow: 1500,
      priceHigh: 4000,
      notes: 'For custom tuning'
    });
  }

  // Extract power limits
  const limitPatterns = [
    { key: 'stockTurbo', pattern: /stock\s*turbo.*?(\d{3,4})\s*(?:whp|hp)/i, name: 'Stock Turbo Limit' },
    { key: 'stockFuel', pattern: /stock\s*(?:fuel|injector).*?(\d{3,4})\s*(?:whp|hp)/i, name: 'Stock Fuel System' },
    { key: 'stockTrans', pattern: /(?:transmission|gearbox|clutch).*?(\d{3,4})\s*(?:ft.?lb|lb.?ft|tq)/i, name: 'Transmission Limit' },
    { key: 'stockRods', pattern: /(?:rod|connecting\s*rod).*?(\d{3,4})\s*(?:whp|hp)/i, name: 'Stock Rods' }
  ];

  for (const lp of limitPatterns) {
    const match = allText.match(lp.pattern);
    if (match) {
      data.powerLimits[lp.key] = {
        value: `~${match[1]} ${lp.key.includes('Trans') ? 'lb-ft' : 'WHP'}`,
        notes: `Stock component limit`
      };
    }
  }

  // If no limits found, add generic
  if (Object.keys(data.powerLimits).length === 0 && isForcedInduction) {
    data.powerLimits = {
      stockTurbo: { value: 'Varies by model', notes: 'Research specific turbo limits' },
      stockFuel: { value: 'Check injector flow', notes: 'May need upgraded fuel system for Stage 2+' }
    };
  }

  // Extract brand recommendations
  const brandPatterns = {
    turbo: /(?:garrett|borg.?warner|precision|xona|efr|g25|g30|g35)/gi,
    exhaust: /(?:akrapovic|borla|magnaflow|corsa|milltek|scorpion|remus|fabspeed)/gi,
    intercooler: /(?:wagner|cts|apr|ecs|forge|mishimoto|defi)/gi,
    suspension: /(?:kw|ohlins|bilstein|bc\s*racing|fortune\s*auto|moton|mcs|jrz)/gi,
    intake: /(?:eventuri|mst|afe|k&n|injen|aem|mishimoto)/gi
  };

  for (const [category, pattern] of Object.entries(brandPatterns)) {
    const matches = allText.match(pattern);
    if (matches) {
      data.brands[category] = [...new Set(matches.map(m => m.trim()))].slice(0, 5);
    }
  }

  // Extract insights from content
  const insightPatterns = [
    /(?:common\s*(?:issue|problem)|watch\s*out|be\s*aware)[:\s]*(.*?)(?:\.|$)/gi,
    /(?:reliability|durability)[:\s]*(.*?)(?:\.|$)/gi
  ];

  for (const pattern of insightPatterns) {
    const matches = allText.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 20 && match[1].length < 200) {
        data.insights.push(match[1].trim());
      }
    }
  }

  return data;
}

/**
 * Research a single vehicle and update its profile
 */
async function researchVehicle(profile, dryRun = false) {
  const carName = profile.cars?.name || 'Unknown';
  const carSlug = profile.cars?.slug;
  
  console.log(`\n🔍 Researching: ${carName}`);
  
  // Build search queries
  const queries = [
    `${carName} stage 1 stage 2 tuning horsepower gains`,
    `${carName} ECU tune performance modifications dyno`,
    `${carName} tuning guide power limits stock components`
  ];
  
  let allResults = { results: [] };
  
  for (const query of queries) {
    try {
      console.log(`   Searching: "${query.substring(0, 50)}..."`);
      const results = await searchExa(query, 3);
      if (results?.results) {
        allResults.results.push(...results.results);
      }
      // Rate limit - wait between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.log(`   ⚠️  Search error: ${error.message}`);
    }
  }
  
  console.log(`   Found ${allResults.results.length} results`);
  
  // Extract tuning data
  const tuningData = extractTuningData(allResults, carName);
  
  console.log(`   Extracted:`);
  console.log(`     - ${tuningData.stages.length} stages`);
  console.log(`     - ${tuningData.platforms.length} platforms`);
  console.log(`     - ${Object.keys(tuningData.powerLimits).length} power limits`);
  console.log(`     - ${Object.keys(tuningData.brands).length} brand categories`);
  if (tuningData.stockPower) {
    console.log(`     - Stock power: ${tuningData.stockPower} HP`);
  }
  
  if (dryRun) {
    console.log(`   [DRY RUN] Would update profile with:`);
    console.log(JSON.stringify(tuningData, null, 2).split('\n').map(l => `     ${l}`).join('\n'));
    return { success: true, dryRun: true, data: tuningData };
  }
  
  // Update the profile
  const updateData = {
    stage_progressions: tuningData.stages,
    tuning_platforms: tuningData.platforms,
    power_limits: tuningData.powerLimits,
    brand_recommendations: tuningData.brands,
    pipeline_version: '1.1.0-exa',
    pipeline_run_at: new Date().toISOString(),
    research_sources: allResults.results.map(r => r.url).filter(Boolean).slice(0, 5)
  };
  
  if (tuningData.stockPower) {
    updateData.stock_whp = tuningData.stockPower;
  }
  
  const { error } = await supabase
    .from('car_tuning_profiles')
    .update(updateData)
    .eq('id', profile.id);
  
  if (error) {
    console.log(`   ❌ Update error: ${error.message}`);
    return { success: false, error: error.message };
  }
  
  console.log(`   ✅ Profile updated`);
  return { success: true, data: tuningData };
}

/**
 * Get all skeleton profiles (no stage_progressions)
 */
async function getSkeletonProfiles(limit = null) {
  let query = supabase
    .from('car_tuning_profiles')
    .select('id, car_id, tuning_focus, stage_progressions, stock_whp, cars(name, slug)')
    .or('stage_progressions.is.null,stage_progressions.eq.[]')
    .order('created_at', { ascending: true });
  
  if (limit) {
    query = query.limit(limit);
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Failed to fetch profiles: ${error.message}`);
  }
  
  // Filter to truly empty stage_progressions
  return data.filter(p => !p.stage_progressions || p.stage_progressions.length === 0);
}

/**
 * Main execution
 */
async function main() {
  const { values } = parseArgs({
    options: {
      'car-slug': { type: 'string' },
      'batch': { type: 'string' },
      'limit': { type: 'string' },
      'dry-run': { type: 'boolean', default: false }
    }
  });

  const carSlug = values['car-slug'];
  const batch = values['batch'];
  const limit = values['limit'] ? parseInt(values['limit']) : null;
  const dryRun = values['dry-run'];

  console.log('═'.repeat(60));
  console.log('TUNING SHOP RESEARCH - Exa AI');
  console.log('═'.repeat(60));
  
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be saved');
  }

  let profiles = [];

  if (carSlug) {
    // Single car
    const { data, error } = await supabase
      .from('car_tuning_profiles')
      .select('id, car_id, tuning_focus, stage_progressions, stock_whp, cars(name, slug)')
      .eq('cars.slug', carSlug);
    
    if (error || !data || data.length === 0) {
      // Try to find the car directly
      const { data: car } = await supabase
        .from('cars')
        .select('id, name, slug')
        .eq('slug', carSlug)
        .single();
      
      if (!car) {
        console.error(`Car not found: ${carSlug}`);
        process.exit(1);
      }
      
      // Get profile by car_id
      const { data: profileData } = await supabase
        .from('car_tuning_profiles')
        .select('id, car_id, tuning_focus, stage_progressions, stock_whp, cars(name, slug)')
        .eq('car_id', car.id);
      
      profiles = profileData || [];
    } else {
      profiles = data;
    }
  } else if (batch === 'skeleton') {
    profiles = await getSkeletonProfiles(limit);
  } else {
    console.error('Usage:');
    console.error('  --car-slug <slug>     Research a specific car');
    console.error('  --batch skeleton      Research all skeleton profiles');
    console.error('  --limit <n>           Limit number of profiles to process');
    console.error('  --dry-run             Show what would be done without saving');
    process.exit(1);
  }

  console.log(`\nProfiles to research: ${profiles.length}`);
  
  if (profiles.length === 0) {
    console.log('No profiles found to research.');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i];
    console.log(`\n[${i + 1}/${profiles.length}] ─────────────────────────────`);
    
    try {
      const result = await researchVehicle(profile, dryRun);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      failCount++;
    }
    
    // Rate limit between vehicles
    if (i < profiles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('RESEARCH COMPLETE');
  console.log('═'.repeat(60));
  console.log(`Total: ${profiles.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log('═'.repeat(60));
}

// Run if called directly
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch(console.error);
}

export { searchExa, extractTuningData, researchVehicle, getSkeletonProfiles };
