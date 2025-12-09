#!/usr/bin/env node
/**
 * YouTube Fill Missing Cars
 * 
 * Processes ONLY cars that don't have video coverage yet.
 * Uses browser automation to find videos, Supadata for transcripts,
 * and Claude for AI extraction.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';

// Load env from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Car name mapping for better YouTube searches
const CAR_SEARCH_TERMS = {
  'bmw-m3-e46': 'BMW M3 E46',
  'bmw-m3-e92': 'BMW M3 E92',
  'bmw-m3-f80': 'BMW M3 F80',
  'bmw-m4-f82': 'BMW M4 F82',
  'bmw-m5-e39': 'BMW M5 E39',
  'bmw-m5-e60': 'BMW M5 E60',
  'bmw-m5-f10-competition': 'BMW M5 F10',
  'bmw-m5-f90-competition': 'BMW M5 F90 Competition',
  'bmw-z4m-e85-e86': 'BMW Z4 M Coupe',
  'c7-corvette-grand-sport': 'C7 Corvette Grand Sport',
  'c7-corvette-z06': 'C7 Corvette Z06',
  'cadillac-cts-v-gen2': 'Cadillac CTS-V 2009',
  'cadillac-cts-v-gen3': 'Cadillac CTS-V 2016',
  'camaro-ss-1le': 'Camaro SS 1LE',
  'camaro-zl1': 'Camaro ZL1',
  'chevrolet-corvette-c5-z06': 'C5 Corvette Z06',
  'chevrolet-corvette-c6-grand-sport': 'C6 Corvette Grand Sport',
  'chevrolet-corvette-c6-z06': 'C6 Corvette Z06',
  'dodge-challenger-hellcat': 'Dodge Challenger Hellcat',
  'dodge-challenger-srt-392': 'Dodge Challenger SRT 392',
  'dodge-charger-hellcat': 'Dodge Charger Hellcat',
  'dodge-charger-srt-392': 'Dodge Charger SRT 392',
  'dodge-viper': 'Dodge Viper',
  'ford-focus-rs': 'Ford Focus RS',
  'ford-mustang-boss-302': 'Ford Mustang Boss 302',
  'honda-civic-type-r-fk8': 'Honda Civic Type R FK8',
  'honda-civic-type-r-fl5': 'Honda Civic Type R FL5 2023',
  'honda-s2000': 'Honda S2000',
  'jaguar-f-type-r': 'Jaguar F-Type R',
  'jaguar-f-type-v6-s': 'Jaguar F-Type V6 S',
  'lamborghini-gallardo': 'Lamborghini Gallardo',
  'lexus-rc-f': 'Lexus RC F',
  'lotus-elise-s2': 'Lotus Elise S2',
  'lotus-emira': 'Lotus Emira',
  'lotus-evora-gt': 'Lotus Evora GT',
  'lotus-evora-s': 'Lotus Evora S',
  'lotus-exige-s': 'Lotus Exige S',
  'maserati-granturismo': 'Maserati GranTurismo',
  'mazda-mx5-miata-na': 'Mazda Miata NA',
  'mazda-mx5-miata-nb': 'Mazda Miata NB',
  'mazda-mx5-miata-nc': 'Mazda Miata NC',
  'mazda-mx5-miata-nd': 'Mazda MX-5 ND',
  'mazda-rx7-fd3s': 'Mazda RX-7 FD',
  'mercedes-amg-c63-w205': 'Mercedes C63 AMG W205',
  'mercedes-amg-e63-w212': 'Mercedes E63 AMG W212',
  'mercedes-amg-e63s-w213': 'Mercedes E63 S AMG',
  'mercedes-amg-gt': 'Mercedes AMG GT',
  'mercedes-c63-amg-w204': 'Mercedes C63 AMG W204',
  'mitsubishi-lancer-evo-8-9': 'Mitsubishi Evo 8 9',
  'mitsubishi-lancer-evo-x': 'Mitsubishi Evo X',
  'mustang-gt-pp2': 'Mustang GT Performance Pack 2',
  'nissan-300zx-twin-turbo-z32': 'Nissan 300ZX Twin Turbo',
  'nissan-350z': 'Nissan 350Z',
  'nissan-370z-nismo': 'Nissan 370Z NISMO',
  'porsche-911-gt3-996': 'Porsche 996 GT3',
  'porsche-911-gt3-997': 'Porsche 997 GT3',
  'porsche-911-turbo-997-1': 'Porsche 997 Turbo',
  'porsche-911-turbo-997-2': 'Porsche 997.2 Turbo',
  'shelby-gt500': 'Shelby GT500',
  'subaru-brz-zc6': 'Subaru BRZ first gen',
  'subaru-brz-zd8': 'Subaru BRZ 2022',
  'subaru-wrx-sti-gd': 'Subaru WRX STI blobeye hawkeye',
  'subaru-wrx-sti-gr-gv': 'Subaru WRX STI hatchback',
  'subaru-wrx-sti-va': 'Subaru WRX STI VA',
  'tesla-model-3-performance': 'Tesla Model 3 Performance',
  'toyota-86-scion-frs': 'Toyota 86 Scion FR-S',
  'toyota-gr86': 'Toyota GR86 2022',
  'toyota-supra-mk4-a80-turbo': 'Toyota Supra MK4 A80',
  'volkswagen-gti-mk7': 'Volkswagen GTI MK7',
  'volkswagen-golf-r-mk7': 'Volkswagen Golf R MK7',
  'volkswagen-golf-r-mk8': 'Volkswagen Golf R MK8'
};

// Trusted channels to prioritize
const TRUSTED_CHANNELS = [
  'throttle house', 'savagegeese', 'doug demuro', 'carwow', 
  'the straight pipes', 'top gear', 'motortrend', 'donut',
  'engineering explained', 'cars with miles', 'chris harris',
  'the smoking tire', 'everyday driver', 'car and driver',
  'motorweek', 'hagerty', 'regular car reviews', 'carfection'
];

function log(msg) {
  console.log(`[fill-missing] ${msg}`);
}

async function getMissingCars() {
  // Get all cars that already have video links
  const { data: existingLinks } = await supabase
    .from('youtube_video_car_links')
    .select('car_slug');
  
  const carsWithVideos = new Set(existingLinks?.map(l => l.car_slug) || []);
  
  // Return slugs that don't have videos yet
  const allSlugs = Object.keys(CAR_SEARCH_TERMS);
  return allSlugs.filter(slug => !carsWithVideos.has(slug));
}

async function searchYouTube(browser, searchTerm) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  try {
    const query = encodeURIComponent(`${searchTerm} review`);
    await page.goto(`https://www.youtube.com/results?search_query=${query}`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for results
    await page.waitForSelector('ytd-video-renderer', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000));
    
    // Extract video data
    const videos = await page.evaluate(() => {
      const results = [];
      const elements = document.querySelectorAll('ytd-video-renderer');
      
      for (const el of elements) {
        if (results.length >= 5) break;
        
        try {
          const linkEl = el.querySelector('a#video-title');
          if (!linkEl) continue;
          
          const href = linkEl.getAttribute('href');
          if (!href || !href.includes('/watch?v=')) continue;
          
          const videoId = href.split('v=')[1]?.split('&')[0];
          const title = linkEl.textContent?.trim() || '';
          
          const channelEl = el.querySelector('ytd-channel-name a, ytd-channel-name yt-formatted-string');
          const channelName = channelEl?.textContent?.trim() || '';
          
          // Get view count
          const metaEl = el.querySelector('#metadata-line');
          const viewText = metaEl?.textContent || '';
          
          results.push({ videoId, title, channelName, viewText });
        } catch (e) {}
      }
      
      return results;
    });
    
    return videos;
  } catch (error) {
    log(`  Search error: ${error.message}`);
    return [];
  } finally {
    await page.close();
  }
}

async function fetchTranscript(videoId) {
  if (!SUPADATA_API_KEY) {
    throw new Error('SUPADATA_API_KEY not configured');
  }
  
  const response = await fetch(
    `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}`,
    {
      headers: { 'x-api-key': SUPADATA_API_KEY }
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supadata error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  
  if (!data.content || data.content.length === 0) {
    throw new Error('No transcript content');
  }
  
  const fullText = data.content.map(s => s.text).join(' ');
  return {
    text: fullText,
    segments: data.content,
    language: data.lang || 'en',
    source: 'supadata_api'
  };
}

async function processWithAI(transcript, carName, carSlug) {
  const prompt = `Analyze this YouTube car review transcript for the ${carName}.

Extract the following in JSON format:
{
  "summary": "2-3 paragraph summary of the review",
  "one_line_take": "Single sentence verdict on the car",
  "pros_mentioned": ["array of specific pros mentioned with detail"],
  "cons_mentioned": ["array of specific cons mentioned with detail"],
  "notable_quotes": ["memorable quotes from reviewers"],
  "sentiment": {
    "sound": -1 to 1 (negative to positive),
    "interior": -1 to 1,
    "track": -1 to 1,
    "reliability": -1 to 1,
    "value": -1 to 1,
    "driver_fun": -1 to 1
  },
  "stock_strengths": ["array of stock car strengths like 'brakes', 'handling', 'power'"],
  "stock_weaknesses": ["array of stock car weaknesses"]
}

Transcript:
${transcript.slice(0, 15000)}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content[0]?.text || '';
  
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in AI response');
  }
  
  return JSON.parse(jsonMatch[0]);
}

async function saveVideo(videoId, title, channelName, transcript, aiData, carSlug) {
  // Check if video already exists
  const { data: existing } = await supabase
    .from('youtube_videos')
    .select('id')
    .eq('video_id', videoId)
    .single();
  
  let videoDbId;
  
  if (existing) {
    videoDbId = existing.id;
    // Update existing video with new data if needed
    await supabase
      .from('youtube_videos')
      .update({
        processing_status: 'processed',
        summary: aiData.summary,
        one_line_take: aiData.one_line_take,
        pros_mentioned: aiData.pros_mentioned,
        cons_mentioned: aiData.cons_mentioned,
        notable_quotes: aiData.notable_quotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', videoDbId);
  } else {
    // Insert new video
    const { data: newVideo, error } = await supabase
      .from('youtube_videos')
      .insert({
        video_id: videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        title: title,
        channel_name: channelName,
        transcript_text: transcript.text,
        transcript_source: transcript.source,
        processing_status: 'processed',
        summary: aiData.summary,
        one_line_take: aiData.one_line_take,
        pros_mentioned: aiData.pros_mentioned,
        cons_mentioned: aiData.cons_mentioned,
        notable_quotes: aiData.notable_quotes
      })
      .select('id')
      .single();
    
    if (error) throw error;
    videoDbId = newVideo.id;
  }
  
  // Create video-car link if it doesn't exist
  const { data: existingLink } = await supabase
    .from('youtube_video_car_links')
    .select('id')
    .eq('video_id', videoId)
    .eq('car_slug', carSlug)
    .single();
  
  if (!existingLink) {
    await supabase
      .from('youtube_video_car_links')
      .insert({
        video_id: videoId,
        car_slug: carSlug,
        role: 'primary',
        match_confidence: 0.95,
        sentiment_sound: aiData.sentiment?.sound,
        sentiment_interior: aiData.sentiment?.interior,
        sentiment_track: aiData.sentiment?.track,
        sentiment_reliability: aiData.sentiment?.reliability,
        sentiment_value: aiData.sentiment?.value,
        sentiment_driver_fun: aiData.sentiment?.driver_fun,
        stock_strength_tags: aiData.stock_strengths || [],
        stock_weakness_tags: aiData.stock_weaknesses || []
      });
  }
  
  return videoDbId;
}

async function processCarVideos(browser, carSlug, carName, videosPerCar = 2) {
  log(`\n🚗 ${carName} (${carSlug})`);
  
  // Search for videos
  log(`  Searching YouTube...`);
  const videos = await searchYouTube(browser, carName);
  
  if (videos.length === 0) {
    log(`  ❌ No videos found`);
    return { processed: 0, failed: 0 };
  }
  
  log(`  ✓ Found ${videos.length} videos`);
  
  // Prioritize trusted channels
  const sorted = videos.sort((a, b) => {
    const aIsTrusted = TRUSTED_CHANNELS.some(c => 
      a.channelName.toLowerCase().includes(c)
    );
    const bIsTrusted = TRUSTED_CHANNELS.some(c => 
      b.channelName.toLowerCase().includes(c)
    );
    if (aIsTrusted && !bIsTrusted) return -1;
    if (!aIsTrusted && bIsTrusted) return 1;
    return 0;
  });
  
  let processed = 0;
  let failed = 0;
  
  for (const video of sorted.slice(0, videosPerCar)) {
    try {
      log(`  📼 "${video.title.slice(0, 50)}..." (${video.channelName})`);
      
      // Fetch transcript
      log(`     🔤 Fetching transcript...`);
      const transcript = await fetchTranscript(video.videoId);
      log(`     ✓ ${transcript.text.length} chars`);
      
      // AI processing
      log(`     🤖 AI processing...`);
      const aiData = await processWithAI(transcript.text, carName, carSlug);
      log(`     ✓ ${aiData.pros_mentioned?.length || 0} pros, ${aiData.cons_mentioned?.length || 0} cons`);
      
      // Save to database
      await saveVideo(video.videoId, video.title, video.channelName, transcript, aiData, carSlug);
      log(`     ✓ Saved to database`);
      
      processed++;
    } catch (error) {
      log(`     ❌ Error: ${error.message}`);
      failed++;
    }
  }
  
  return { processed, failed };
}

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : null;
  const dryRun = args.includes('--dry-run');
  
  log('========================================');
  log('Fill Missing Cars - YouTube Enrichment');
  log('========================================\n');
  
  // Get cars that need processing
  const missingCars = await getMissingCars();
  
  log(`Cars missing video coverage: ${missingCars.length}`);
  
  if (dryRun) {
    log('\n[DRY RUN] Would process these cars:');
    missingCars.slice(0, limit || missingCars.length).forEach(slug => {
      log(`  • ${CAR_SEARCH_TERMS[slug] || slug}`);
    });
    return;
  }
  
  const carsToProcess = limit ? missingCars.slice(0, limit) : missingCars;
  
  log(`Processing ${carsToProcess.length} cars...\n`);
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  let totalProcessed = 0;
  let totalFailed = 0;
  
  try {
    for (let i = 0; i < carsToProcess.length; i++) {
      const carSlug = carsToProcess[i];
      const carName = CAR_SEARCH_TERMS[carSlug] || carSlug;
      
      log(`[${i + 1}/${carsToProcess.length}]`);
      const result = await processCarVideos(browser, carSlug, carName);
      
      totalProcessed += result.processed;
      totalFailed += result.failed;
      
      // Small delay between cars
      await new Promise(r => setTimeout(r, 1000));
    }
  } finally {
    await browser.close();
  }
  
  log('\n========================================');
  log('Processing Complete!');
  log('========================================');
  log(`Cars processed: ${carsToProcess.length}`);
  log(`Videos saved: ${totalProcessed}`);
  log(`Videos failed: ${totalFailed}`);
}

main().catch(console.error);

