#!/usr/bin/env node

/**
 * Featured Content Ingestion Script
 * 
 * Ingests YouTube videos into the featured_content table with transcripts.
 * This is for curated, high-quality automotive content that may not be
 * car-specific reviews.
 * 
 * Usage:
 *   node scripts/ingest-featured-content.js [options]
 * 
 * Options:
 *   --url <url>        Process a single YouTube URL
 *   --urls <file>      Process URLs from a JSON file
 *   --dry-run          Don't write to database
 *   --verbose          Enable verbose logging
 * 
 * Environment Variables:
 *   SUPADATA_API_KEY      Optional: Supadata API key for reliable transcript fetching
 *   SUPABASE_URL          Required: Supabase project URL
 *   SUPABASE_SERVICE_KEY  Required: Supabase service role key
 * 
 * @module scripts/ingest-featured-content
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// Configuration
// ============================================================================

const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  url: null,
  urlsFile: null,
  dryRun: false,
  verbose: false,
  urls: []
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--url':
      options.url = args[++i];
      break;
    case '--urls':
      options.urlsFile = args[++i];
      break;
    case '--dry-run':
      options.dryRun = true;
      break;
    case '--verbose':
      options.verbose = true;
      break;
    default:
      // Treat bare args as URLs if they look like YouTube URLs
      if (args[i].includes('youtube.com') || args[i].includes('youtu.be')) {
        options.urls.push(args[i]);
      }
  }
}

// Logging helpers
const log = (...args) => console.log('[featured-content]', ...args);
const logVerbose = (...args) => options.verbose && console.log('[featured-content:verbose]', ...args);
const logError = (...args) => console.error('[featured-content:error]', ...args);

// ============================================================================
// YouTube Utilities
// ============================================================================

/**
 * Extract video ID from YouTube URL
 * @param {string} url - YouTube URL
 * @returns {string|null} Video ID
 */
function extractVideoId(url) {
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Fetch video metadata from YouTube page
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object>} Video metadata
 */
async function fetchVideoMetadata(videoId) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  
  log(`  Fetching metadata for ${videoId}...`);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch video page: ${response.status}`);
  }

  const html = await response.text();

  // Extract metadata from playerResponse
  const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);
  const dataMatch = html.match(/ytInitialData\s*=\s*(\{.+?\});/s);

  const metadata = {
    videoId,
    title: null,
    description: null,
    channelName: null,
    channelId: null,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    publishedAt: null,
    durationSeconds: null,
    viewCount: null,
    likeCount: null
  };

  if (playerMatch) {
    try {
      const playerResponse = JSON.parse(playerMatch[1]);
      const videoDetails = playerResponse?.videoDetails || {};
      const microformat = playerResponse?.microformat?.playerMicroformatRenderer || {};

      metadata.title = videoDetails.title || microformat.title?.simpleText;
      metadata.description = videoDetails.shortDescription;
      metadata.channelName = videoDetails.author;
      metadata.channelId = videoDetails.channelId;
      metadata.durationSeconds = parseInt(videoDetails.lengthSeconds, 10) || null;
      metadata.viewCount = parseInt(videoDetails.viewCount, 10) || null;
      metadata.publishedAt = microformat.publishDate || null;

      // Get best thumbnail
      const thumbnails = videoDetails.thumbnail?.thumbnails || [];
      if (thumbnails.length > 0) {
        metadata.thumbnailUrl = thumbnails[thumbnails.length - 1].url;
      }
    } catch (e) {
      logVerbose(`  Could not parse playerResponse: ${e.message}`);
    }
  }

  // Extract additional metadata from ytInitialData
  if (dataMatch) {
    try {
      const initialData = JSON.parse(dataMatch[1]);
      // Navigate to like count if available
      const contents = initialData?.contents?.twoColumnWatchNextResults?.results?.results?.contents || [];
      for (const content of contents) {
        const videoPrimaryInfo = content?.videoPrimaryInfoRenderer;
        if (videoPrimaryInfo) {
          const likeButton = videoPrimaryInfo?.videoActions?.menuRenderer?.topLevelButtons?.find(b => 
            b?.segmentedLikeDislikeButtonViewModel?.likeButtonViewModel
          );
          if (likeButton) {
            const likeText = likeButton.segmentedLikeDislikeButtonViewModel?.likeButtonViewModel?.likeButtonViewModel?.toggleButtonViewModel?.toggleButtonViewModel?.defaultButtonViewModel?.buttonViewModel?.title;
            if (likeText) {
              // Parse likes like "123K" or "1.2M"
              const parsed = parseEngagementCount(likeText);
              if (parsed) metadata.likeCount = parsed;
            }
          }
        }
      }
    } catch (e) {
      logVerbose(`  Could not parse initialData: ${e.message}`);
    }
  }

  return metadata;
}

/**
 * Parse engagement counts like "123K" or "1.2M"
 * @param {string} text - Text like "123K likes"
 * @returns {number|null}
 */
function parseEngagementCount(text) {
  if (!text) return null;
  const match = text.match(/^([\d.,]+)\s*([KkMm])?/);
  if (!match) return null;
  
  let num = parseFloat(match[1].replace(/,/g, ''));
  if (match[2]) {
    const multiplier = match[2].toUpperCase() === 'K' ? 1000 : 1000000;
    num = Math.round(num * multiplier);
  }
  return num;
}

// ============================================================================
// Transcript Fetching
// ============================================================================

/**
 * Fetch transcript using Supadata API (most reliable)
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object>} Transcript data
 */
async function fetchTranscriptViaSupadata(videoId) {
  if (!SUPADATA_API_KEY) {
    throw new Error('SUPADATA_API_KEY not configured');
  }

  const url = `https://api.supadata.ai/v1/transcript?url=https://www.youtube.com/watch?v=${videoId}`;
  
  const response = await fetch(url, {
    headers: {
      'x-api-key': SUPADATA_API_KEY
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supadata API failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.content || data.content.length === 0) {
    throw new Error('Supadata returned empty transcript');
  }

  const segments = data.content.map(item => ({
    start: (item.offset || 0) / 1000,
    duration: (item.duration || 0) / 1000,
    text: item.text || ''
  }));

  const fullText = segments.map(s => s.text).join(' ');

  return {
    text: fullText,
    segments,
    language: data.lang || 'en',
    source: 'supadata_api'
  };
}

/**
 * Fetch transcript via YouTube page scraping
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object>} Transcript data
 */
async function fetchTranscriptViaPage(videoId) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  const response = await fetch(videoUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch video page: ${response.status}`);
  }

  const html = await response.text();
  const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);
  
  if (!playerMatch) {
    throw new Error('Could not find player response');
  }

  const playerResponse = JSON.parse(playerMatch[1]);
  const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  
  if (!captions || captions.length === 0) {
    throw new Error('No caption tracks available');
  }

  // Prefer English
  const track = captions.find(c => c.languageCode === 'en') || 
                captions.find(c => c.languageCode?.startsWith('en')) ||
                captions[0];

  if (!track?.baseUrl) {
    throw new Error('No caption track URL found');
  }

  const transcriptResponse = await fetch(track.baseUrl);
  if (!transcriptResponse.ok) {
    throw new Error(`Failed to fetch transcript: ${transcriptResponse.status}`);
  }

  const transcriptXml = await transcriptResponse.text();
  const segments = [];
  const textMatches = transcriptXml.matchAll(/<text start="([^"]+)" dur="([^"]+)"[^>]*>([^<]*)<\/text>/g);

  for (const match of textMatches) {
    const start = parseFloat(match[1]);
    const duration = parseFloat(match[2]);
    const text = decodeHtmlEntities(match[3]);

    if (text.trim()) {
      segments.push({ start, duration, text });
    }
  }

  if (segments.length === 0) {
    throw new Error('Transcript XML contained no text segments');
  }

  const fullText = segments.map(s => s.text).join(' ');

  return {
    text: fullText,
    segments,
    language: track.languageCode || 'en',
    source: 'youtube_library'
  };
}

/**
 * Decode HTML entities
 * @param {string} text - Text with HTML entities
 * @returns {string} Decoded text
 */
function decodeHtmlEntities(text) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#32;': ' ',
    '\n': ' ',
    '\\n': ' '
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.split(entity).join(char);
  }

  decoded = decoded.replace(/&#(\d+);/g, (match, code) => 
    String.fromCharCode(parseInt(code, 10))
  );
  decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (match, code) => 
    String.fromCharCode(parseInt(code, 16))
  );

  return decoded.trim();
}

/**
 * Main transcript fetching function with fallbacks
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object|null>} Transcript data or null
 */
async function fetchTranscript(videoId) {
  const methods = [];
  
  if (SUPADATA_API_KEY) {
    methods.push({ name: 'supadata', fn: fetchTranscriptViaSupadata });
  }
  
  methods.push({ name: 'page', fn: fetchTranscriptViaPage });

  for (const method of methods) {
    try {
      logVerbose(`    Trying ${method.name} method...`);
      const result = await method.fn(videoId);
      log(`    ✓ Transcript fetched via ${method.name} (${result.text.length} chars)`);
      return result;
    } catch (error) {
      logVerbose(`    ${method.name} failed: ${error.message}`);
    }
  }

  return null;
}

// ============================================================================
// Content Classification
// ============================================================================

/**
 * Detect content category from title and description
 * @param {string} title - Video title
 * @param {string} description - Video description
 * @returns {string} Category enum value
 */
function detectCategory(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('documentary') || text.includes('history of') || text.includes('story of')) {
    return 'brand_documentary';
  }
  if (text.includes('engineering') || text.includes('how it') || text.includes('technical') || text.includes('explained')) {
    return 'engineering_deep_dive';
  }
  if (text.includes('pov') || text.includes('point of view') || text.includes('driving')) {
    return 'driving_experience';
  }
  if (text.includes(' vs ') || text.includes('comparison') || text.includes('versus') || text.includes('compared')) {
    return 'comparison';
  }
  if (text.includes('review')) {
    return 'review';
  }
  if (text.includes('race') || text.includes('motorsport') || text.includes('f1') || text.includes('nascar') || text.includes('lemans')) {
    return 'motorsport';
  }
  if (text.includes('restoration') || text.includes('restoring') || text.includes('rebuild')) {
    return 'restoration';
  }
  if (text.includes('culture') || text.includes('lifestyle') || text.includes('community')) {
    return 'culture';
  }
  if (text.includes('how to') || text.includes('tutorial') || text.includes('guide') || text.includes('diy')) {
    return 'educational';
  }
  if (text.includes('interview')) {
    return 'interview';
  }
  
  return 'other';
}

/**
 * Extract brands from title and description
 * @param {string} title - Video title
 * @param {string} description - Video description
 * @returns {string[]} Array of brand names
 */
function extractBrands(title, description) {
  const text = `${title} ${description}`;
  const brands = new Set();
  
  const brandPatterns = [
    'Porsche', 'Ferrari', 'Lamborghini', 'McLaren', 'Aston Martin',
    'BMW', 'Mercedes', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'VW',
    'Toyota', 'Lexus', 'Nissan', 'Honda', 'Mazda', 'Subaru', 'Mitsubishi',
    'Ford', 'Chevrolet', 'Chevy', 'Dodge', 'Jeep', 'Corvette', 'Mustang',
    'Jaguar', 'Land Rover', 'Range Rover', 'Bentley', 'Rolls-Royce',
    'Lotus', 'Alpine', 'Alfa Romeo', 'Maserati', 'Pagani', 'Bugatti',
    'Koenigsegg', 'Rimac', 'Lucid', 'Tesla', 'Rivian', 'Polestar',
    'Acura', 'Infiniti', 'Genesis', 'Hyundai', 'Kia'
  ];
  
  for (const brand of brandPatterns) {
    const regex = new RegExp(`\\b${brand}\\b`, 'i');
    if (regex.test(text)) {
      // Normalize brand name
      let normalized = brand;
      if (brand.toLowerCase() === 'chevy') normalized = 'Chevrolet';
      if (brand.toLowerCase() === 'vw') normalized = 'Volkswagen';
      if (brand.toLowerCase() === 'mercedes-benz') normalized = 'Mercedes';
      brands.add(normalized);
    }
  }
  
  return Array.from(brands);
}

/**
 * Extract topics from title and description
 * @param {string} title - Video title
 * @param {string} description - Video description
 * @returns {string[]} Array of topic tags
 */
function extractTopics(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const topics = new Set();
  
  const topicPatterns = {
    'performance': ['performance', 'horsepower', 'hp', 'speed', 'fast', 'quick', 'acceleration'],
    'design': ['design', 'styling', 'exterior', 'interior', 'beautiful', 'aesthetic'],
    'history': ['history', 'heritage', 'legacy', 'classic', 'vintage', 'origins'],
    'technology': ['technology', 'tech', 'innovation', 'features', 'system'],
    'track': ['track', 'circuit', 'lap', 'nürburgring', 'nurburgring', 'laguna seca'],
    'reliability': ['reliability', 'reliable', 'maintenance', 'issues', 'problems'],
    'value': ['value', 'price', 'cost', 'money', 'investment', 'depreciation'],
    'sound': ['sound', 'exhaust', 'engine note', 'noise'],
    'handling': ['handling', 'cornering', 'grip', 'steering', 'suspension'],
    'electric': ['electric', 'ev', 'hybrid', 'battery', 'charging'],
    'supercar': ['supercar', 'hypercar', 'exotic'],
    'sports-car': ['sports car', 'sportscar', 'coupe', 'roadster', 'convertible']
  };
  
  for (const [topic, keywords] of Object.entries(topicPatterns)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        topics.add(topic);
        break;
      }
    }
  }
  
  return Array.from(topics);
}

// ============================================================================
// Main Ingestion
// ============================================================================

async function processVideo(supabase, url) {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error(`Invalid YouTube URL: ${url}`);
  }

  log(`\n📼 Processing: ${videoId}`);
  log(`   URL: ${url}`);

  // Check if already exists
  if (!options.dryRun) {
    const { data: existing } = await supabase
      .from('featured_content')
      .select('id')
      .eq('source_video_id', videoId)
      .eq('source_type', 'youtube')
      .single();

    if (existing) {
      log(`   ⚠️  Already exists, skipping`);
      return { status: 'skipped', videoId };
    }
  }

  // Fetch metadata
  const metadata = await fetchVideoMetadata(videoId);
  log(`   Title: ${metadata.title}`);
  log(`   Channel: ${metadata.channelName}`);

  // Fetch transcript
  log(`   🔤 Fetching transcript...`);
  const transcript = await fetchTranscript(videoId);

  if (!transcript) {
    log(`   ⚠️  No transcript available`);
    // Still save metadata even without transcript
  } else {
    log(`   ✓ Got transcript (${transcript.text.length} chars)`);
  }

  // Classify content
  const category = detectCategory(metadata.title || '', metadata.description || '');
  const brands = extractBrands(metadata.title || '', metadata.description || '');
  const topics = extractTopics(metadata.title || '', metadata.description || '');

  log(`   Category: ${category}`);
  log(`   Brands: ${brands.join(', ') || 'None detected'}`);
  log(`   Topics: ${topics.join(', ') || 'None detected'}`);

  // Build record
  const record = {
    source_type: 'youtube',
    source_video_id: videoId,
    source_url: `https://www.youtube.com/watch?v=${videoId}`,
    title: metadata.title,
    description: metadata.description,
    channel_name: metadata.channelName,
    channel_id: metadata.channelId,
    channel_url: metadata.channelId ? `https://www.youtube.com/channel/${metadata.channelId}` : null,
    category,
    brands_featured: brands,
    topics,
    view_count: metadata.viewCount,
    like_count: metadata.likeCount,
    published_at: metadata.publishedAt,
    duration_seconds: metadata.durationSeconds,
    thumbnail_url: metadata.thumbnailUrl,
    transcript_text: transcript?.text || null,
    transcript_language: transcript?.language || null,
    transcript_source: transcript?.source || null,
    transcript_fetched_at: transcript ? new Date().toISOString() : null,
    status: transcript ? 'transcript_fetched' : 'pending',
    is_active: true
  };

  if (options.dryRun) {
    log(`   [DRY RUN] Would save record`);
    logVerbose(`   Record:`, JSON.stringify(record, null, 2));
    return { status: 'dry_run', videoId, metadata, transcript: !!transcript };
  }

  // Insert into database
  const { error } = await supabase
    .from('featured_content')
    .insert(record);

  if (error) {
    throw new Error(`Database insert failed: ${error.message}`);
  }

  log(`   ✓ Saved to featured_content`);
  return { status: 'success', videoId, metadata, transcript: !!transcript };
}

async function main() {
  log('========================================');
  log('Featured Content Ingestion');
  log('========================================');
  
  // Build URL list
  const urls = [];
  if (options.url) {
    urls.push(options.url);
  }
  urls.push(...options.urls);

  // If no URLs provided, use the hardcoded list from the request
  if (urls.length === 0) {
    // These are the initial Porsche-focused videos from the user's request
    urls.push(
      'https://www.youtube.com/watch?v=wSZDqnnPx_g',
      'https://www.youtube.com/watch?v=yEKjBxlBQk4',
      'https://www.youtube.com/watch?v=O7V9YEajSf8',
      'https://www.youtube.com/watch?v=StWSpZHF998',
      'https://www.youtube.com/watch?v=ifmdSmPVHzs',
      'https://www.youtube.com/watch?v=xvAg8WBsiq4',
      'https://www.youtube.com/watch?v=Gux4Y2EWg7Q',
      'https://www.youtube.com/watch?v=j7Hx1VCJcg8',
      'https://www.youtube.com/watch?v=K-awc2Ugebo',
      'https://www.youtube.com/watch?v=PbgKlRrp2io',
      'https://www.youtube.com/watch?v=OEQWbJl3mK8'
    );
  }

  log(`URLs to process: ${urls.length}`);
  log(`Dry run: ${options.dryRun}`);
  log('');

  // API configuration
  log('API Configuration:');
  log(`  - Supadata API: ${SUPADATA_API_KEY ? '✓ Configured' : '✗ Not configured'}`);
  log('');

  // Validate configuration
  if (!options.dryRun && (!SUPABASE_URL || !SUPABASE_SERVICE_KEY)) {
    logError('SUPABASE_URL and SUPABASE_SERVICE_KEY are required (or use --dry-run)');
    process.exit(1);
  }

  // Initialize Supabase client
  const supabase = options.dryRun 
    ? null 
    : createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Process videos
  const stats = {
    total: urls.length,
    success: 0,
    skipped: 0,
    noTranscript: 0,
    errors: 0
  };

  for (const url of urls) {
    try {
      const result = await processVideo(supabase, url);
      
      if (result.status === 'success' || result.status === 'dry_run') {
        stats.success++;
        if (!result.transcript) stats.noTranscript++;
      } else if (result.status === 'skipped') {
        stats.skipped++;
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, 1500));

    } catch (error) {
      logError(`   ✗ Error: ${error.message}`);
      stats.errors++;
    }
  }

  // Summary
  log('\n========================================');
  log('Ingestion Complete');
  log('========================================');
  log(`Total:         ${stats.total}`);
  log(`Success:       ${stats.success}`);
  log(`Skipped:       ${stats.skipped}`);
  log(`No transcript: ${stats.noTranscript}`);
  log(`Errors:        ${stats.errors}`);

  if (options.dryRun) {
    log('\n[DRY RUN] No changes were made to the database');
  }
}

// Run
main().catch(error => {
  logError('Fatal error:', error);
  process.exit(1);
});

