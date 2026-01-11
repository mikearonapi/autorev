#!/usr/bin/env node
/**
 * Tuning Shop Enhancement Pipeline - Step 1: Database Mining
 * 
 * Extracts all existing data for a given car from the database:
 * - YouTube videos and transcripts
 * - Car issues
 * - Parts and fitments
 * - Dyno runs
 * - Existing car fields (upgrade_recommendations, key_resources, etc.)
 * 
 * Usage:
 *   node scripts/tuning-pipeline/mine-database.mjs --car-slug ford-f150-thirteenth
 *   node scripts/tuning-pipeline/mine-database.mjs --car-id abc123-uuid
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parseArgs } from 'util';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

/**
 * Mine all data for a car from the database
 * @param {string} carSlug - The car slug to mine
 * @param {string} carId - The car UUID (optional, looked up from slug)
 * @returns {Object} - All mined data
 */
export async function mineDatabase(carSlug, carId = null) {
  const result = {
    car: null,
    variants: [],
    youtubeVideos: [],
    issues: [],
    parts: [],
    dynoRuns: [],
    existingProfile: null,
    insights: {
      tunerMentions: [],
      brandMentions: [],
      issueMentions: [],
      powerFigures: [],
      avgAftermarketSentiment: null
    }
  };

  // 1. Get the car record
  console.log(`\n📦 Mining data for: ${carSlug}`);
  
  const carQuery = carId 
    ? supabase.from('cars').select('*').eq('id', carId).single()
    : supabase.from('cars').select('*').eq('slug', carSlug).single();
  
  const { data: car, error: carError } = await carQuery;
  
  if (carError || !car) {
    // Try to find by partial slug match
    const { data: cars } = await supabase
      .from('cars')
      .select('id, slug, name')
      .ilike('slug', `%${carSlug}%`)
      .limit(5);
    
    if (cars && cars.length > 0) {
      console.log(`\n⚠️  Car not found. Did you mean one of these?`);
      cars.forEach(c => console.log(`   - ${c.slug} (${c.name})`));
    }
    throw new Error(`Car not found: ${carSlug}`);
  }
  
  result.car = car;
  carId = car.id;
  console.log(`   ✓ Found car: ${car.name} (${car.slug})`);

  // 2. Get car variants
  const { data: variants } = await supabase
    .from('car_variants')
    .select('*')
    .eq('car_id', carId);
  
  result.variants = variants || [];
  console.log(`   ✓ Found ${result.variants.length} variants`);

  // 3. Get YouTube videos linked to this car
  const { data: videoLinks } = await supabase
    .from('youtube_video_car_links')
    .select(`
      video_id,
      car_slug,
      role,
      sentiment_aftermarket,
      stock_strength_tags,
      stock_weakness_tags,
      overall_sentiment
    `)
    .or(`car_id.eq.${carId},car_slug.eq.${carSlug}`);

  if (videoLinks && videoLinks.length > 0) {
    const videoIds = [...new Set(videoLinks.map(l => l.video_id))];
    
    const { data: videos } = await supabase
      .from('youtube_videos')
      .select(`
        video_id,
        title,
        channel_name,
        transcript_text,
        summary,
        one_line_take,
        key_points,
        pros_mentioned,
        cons_mentioned,
        notable_quotes,
        stock_strengths,
        stock_weaknesses,
        view_count,
        published_at
      `)
      .in('video_id', videoIds);

    // Merge video data with link data
    result.youtubeVideos = (videos || []).map(v => {
      const link = videoLinks.find(l => l.video_id === v.video_id);
      return { ...v, ...link };
    });
  }
  console.log(`   ✓ Found ${result.youtubeVideos.length} YouTube videos`);

  // 4. Get car issues
  const { data: issues } = await supabase
    .from('car_issues')
    .select('*')
    .eq('car_id', carId);
  
  result.issues = issues || [];
  console.log(`   ✓ Found ${result.issues.length} issues`);

  // 5. Get parts and fitments
  const { data: fitments } = await supabase
    .from('part_fitments')
    .select(`
      id,
      fitment_notes,
      requires_tune,
      install_difficulty,
      verified,
      parts:part_id (
        id,
        name,
        category,
        subcategory,
        part_brands:brand_id (name)
      )
    `)
    .eq('car_id', carId);
  
  result.parts = (fitments || []).map(f => ({
    ...f.parts,
    brand: f.parts?.part_brands?.name,
    fitment_notes: f.fitment_notes,
    requires_tune: f.requires_tune,
    install_difficulty: f.install_difficulty,
    verified: f.verified
  }));
  console.log(`   ✓ Found ${result.parts.length} part fitments`);

  // 6. Get dyno runs
  const { data: dynoRuns } = await supabase
    .from('car_dyno_runs')
    .select('*')
    .eq('car_id', carId)
    .order('peak_whp', { ascending: false, nullsFirst: false });
  
  result.dynoRuns = dynoRuns || [];
  console.log(`   ✓ Found ${result.dynoRuns.length} dyno runs`);

  // 7. Check for existing tuning profile
  const { data: existingProfile } = await supabase
    .from('car_tuning_profiles')
    .select('*')
    .eq('car_id', carId)
    .limit(1);
  
  result.existingProfile = existingProfile?.[0] || null;
  if (result.existingProfile) {
    console.log(`   ✓ Found existing tuning profile (v${result.existingProfile.pipeline_version})`);
  }

  // 8. Extract insights from YouTube data
  result.insights = extractYouTubeInsights(result.youtubeVideos);
  
  return result;
}

/**
 * Extract tuning-relevant insights from YouTube video data
 */
function extractYouTubeInsights(videos) {
  const insights = {
    tunerMentions: [],
    brandMentions: [],
    issueMentions: [],
    powerFigures: [],
    avgAftermarketSentiment: null,
    commonPros: [],
    commonCons: [],
    keyQuotes: []
  };

  if (!videos || videos.length === 0) {
    return insights;
  }

  // Known tuner/platform names to look for
  const tunerPatterns = [
    'COBB', 'APR', 'SCT', 'HP Tuners', 'Unitronic', 'JB4', 'Dinan',
    'BMS', 'MHD', 'bootmod3', 'Hondata', 'KTuner', 'EcuTek', 'Accessport',
    '5 Star Tuning', 'MPT', 'Livernois', 'Palm Beach Dyno', 'VF Engineering',
    'Burger Tuning', 'IE', 'Integrated Engineering', 'Stage 1', 'Stage 2', 'Stage 3'
  ];

  // Known performance brand names
  const brandPatterns = [
    'Borla', 'Magnaflow', 'MBRP', 'Flowmaster', 'AWE', 'Milltek',
    'K&N', 'AFE', 'S&B', 'Airaid', 'Injen', 'Mishimoto', 'CSF',
    'KW', 'Bilstein', 'Ohlins', 'BC Racing', 'Fortune Auto',
    'Brembo', 'StopTech', 'EBC', 'Hawk', 'Ferodo',
    'Whipple', 'ProCharger', 'Roush', 'VMP', 'Kenne Bell',
    'Garrett', 'BorgWarner', 'Precision Turbo', 'Full-Race',
    'Teraflex', 'MetalCloak', 'AEV', 'ARB', 'Warn', 'FOX', 'ICON', 'BDS'
  ];

  // Aggregate sentiment
  const sentiments = videos
    .filter(v => v.sentiment_aftermarket != null)
    .map(v => parseFloat(v.sentiment_aftermarket));
  
  if (sentiments.length > 0) {
    insights.avgAftermarketSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
  }

  // Process each video
  const prosMap = new Map();
  const consMap = new Map();

  for (const video of videos) {
    const textToSearch = [
      video.transcript_text || '',
      video.summary || '',
      JSON.stringify(video.key_points || []),
      JSON.stringify(video.pros_mentioned || []),
      JSON.stringify(video.cons_mentioned || [])
    ].join(' ');

    // Find tuner mentions
    for (const tuner of tunerPatterns) {
      if (textToSearch.toLowerCase().includes(tuner.toLowerCase())) {
        if (!insights.tunerMentions.includes(tuner)) {
          insights.tunerMentions.push(tuner);
        }
      }
    }

    // Find brand mentions
    for (const brand of brandPatterns) {
      if (textToSearch.toLowerCase().includes(brand.toLowerCase())) {
        if (!insights.brandMentions.includes(brand)) {
          insights.brandMentions.push(brand);
        }
      }
    }

    // Extract power figures from transcript (e.g., "450 hp", "500 whp", "380 wheel horsepower")
    const powerRegex = /(\d{2,4})\s*(whp|hp|horsepower|bhp|wheel\s*horsepower)/gi;
    let match;
    while ((match = powerRegex.exec(textToSearch)) !== null) {
      const figure = {
        value: parseInt(match[1]),
        unit: match[2].toLowerCase().includes('w') ? 'whp' : 'hp',
        source: video.channel_name
      };
      if (figure.value > 50 && figure.value < 2000) { // Sanity check
        insights.powerFigures.push(figure);
      }
    }

    // Aggregate pros
    if (Array.isArray(video.pros_mentioned)) {
      for (const pro of video.pros_mentioned) {
        const text = typeof pro === 'string' ? pro : pro.text;
        if (text) {
          prosMap.set(text, (prosMap.get(text) || 0) + 1);
        }
      }
    }

    // Aggregate cons
    if (Array.isArray(video.cons_mentioned)) {
      for (const con of video.cons_mentioned) {
        const text = typeof con === 'string' ? con : con.text;
        if (text) {
          consMap.set(text, (consMap.get(text) || 0) + 1);
        }
      }
    }

    // Extract notable quotes about tuning/mods
    if (Array.isArray(video.notable_quotes)) {
      for (const quote of video.notable_quotes) {
        const text = typeof quote === 'string' ? quote : quote.text;
        if (text && (
          text.toLowerCase().includes('tune') ||
          text.toLowerCase().includes('mod') ||
          text.toLowerCase().includes('horsepower') ||
          text.toLowerCase().includes('upgrade')
        )) {
          insights.keyQuotes.push({
            quote: text,
            source: video.channel_name
          });
        }
      }
    }
  }

  // Sort by frequency and take top items
  insights.commonPros = [...prosMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([text]) => text);

  insights.commonCons = [...consMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([text]) => text);

  // Limit key quotes
  insights.keyQuotes = insights.keyQuotes.slice(0, 5);

  return insights;
}

/**
 * Format mined data as a summary report
 */
export function formatMinedDataReport(data) {
  const lines = [];
  
  lines.push('═'.repeat(60));
  lines.push(`MINED DATA REPORT: ${data.car?.name || 'Unknown'}`);
  lines.push('═'.repeat(60));
  
  lines.push('\n📊 DATA COVERAGE:');
  lines.push(`   Car Record:       ✓ ${data.car?.slug}`);
  lines.push(`   Variants:         ${data.variants.length} engine variants`);
  lines.push(`   YouTube Videos:   ${data.youtubeVideos.length} (${data.youtubeVideos.filter(v => v.transcript_text).length} with transcripts)`);
  lines.push(`   Issues:           ${data.issues.length} known issues`);
  lines.push(`   Parts/Fitments:   ${data.parts.length} parts`);
  lines.push(`   Dyno Runs:        ${data.dynoRuns.length} runs`);
  lines.push(`   Existing Profile: ${data.existingProfile ? 'Yes' : 'No'}`);
  
  lines.push('\n🔍 EXISTING CAR FIELDS:');
  lines.push(`   upgrade_recommendations: ${data.car?.upgrade_recommendations ? 'Has data' : 'Empty'}`);
  lines.push(`   key_resources:           ${data.car?.key_resources ? 'Has data' : 'Empty'}`);
  lines.push(`   popular_track_mods:      ${data.car?.popular_track_mods ? 'Has data' : 'Empty'}`);
  lines.push(`   community_notes:         ${data.car?.community_notes ? 'Has data' : 'Empty'}`);
  
  if (data.youtubeVideos.length > 0) {
    lines.push('\n🎬 YOUTUBE INSIGHTS:');
    if (data.insights.avgAftermarketSentiment !== null) {
      lines.push(`   Aftermarket Sentiment:   ${(data.insights.avgAftermarketSentiment * 100).toFixed(0)}%`);
    }
    if (data.insights.tunerMentions.length > 0) {
      lines.push(`   Tuners Mentioned:        ${data.insights.tunerMentions.join(', ')}`);
    }
    if (data.insights.brandMentions.length > 0) {
      lines.push(`   Brands Mentioned:        ${data.insights.brandMentions.slice(0, 10).join(', ')}`);
    }
    if (data.insights.powerFigures.length > 0) {
      const unique = [...new Set(data.insights.powerFigures.map(p => `${p.value} ${p.unit}`))];
      lines.push(`   Power Figures:           ${unique.slice(0, 5).join(', ')}`);
    }
    if (data.insights.commonPros.length > 0) {
      lines.push(`   Common Pros:             ${data.insights.commonPros.slice(0, 3).join('; ')}`);
    }
    if (data.insights.commonCons.length > 0) {
      lines.push(`   Common Cons:             ${data.insights.commonCons.slice(0, 3).join('; ')}`);
    }
  }
  
  if (data.variants.length > 0) {
    lines.push('\n🔧 VARIANTS:');
    for (const v of data.variants) {
      lines.push(`   - ${v.display_name || v.variant_key} (${v.engine || 'Unknown engine'})`);
    }
  }
  
  if (data.issues.length > 0) {
    lines.push('\n⚠️  TOP ISSUES:');
    const topIssues = data.issues
      .sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4);
      })
      .slice(0, 5);
    for (const issue of topIssues) {
      lines.push(`   [${issue.severity?.toUpperCase() || '?'}] ${issue.title}`);
    }
  }
  
  if (data.dynoRuns.length > 0) {
    lines.push('\n📈 DYNO DATA:');
    for (const run of data.dynoRuns.slice(0, 3)) {
      const power = run.peak_whp ? `${run.peak_whp} whp` : run.peak_hp ? `${run.peak_hp} hp` : 'N/A';
      lines.push(`   - ${run.configuration || run.run_kind || 'Unknown'}: ${power}`);
    }
  }
  
  lines.push('\n' + '═'.repeat(60));
  
  return lines.join('\n');
}

// CLI execution
async function main() {
  const { values } = parseArgs({
    options: {
      'car-slug': { type: 'string' },
      'car-id': { type: 'string' },
      'json': { type: 'boolean', default: false },
      'help': { type: 'boolean', short: 'h' }
    }
  });

  if (values.help || (!values['car-slug'] && !values['car-id'])) {
    console.log(`
Tuning Shop Enhancement Pipeline - Database Mining

Usage:
  node mine-database.mjs --car-slug <slug>
  node mine-database.mjs --car-id <uuid>

Options:
  --car-slug    Car slug to mine (e.g., ford-f150-thirteenth)
  --car-id      Car UUID to mine
  --json        Output as JSON instead of formatted report
  -h, --help    Show this help message
`);
    process.exit(0);
  }

  try {
    const data = await mineDatabase(values['car-slug'], values['car-id']);
    
    if (values.json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(formatMinedDataReport(data));
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly (check if this file is the entry point)
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isMainModule) {
  main().catch(console.error);
}
