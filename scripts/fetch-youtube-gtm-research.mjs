#!/usr/bin/env node

/**
 * YouTube GTM Research Script
 * 
 * This script:
 * 1. Fetches transcripts for seed + discovered YouTube videos using Supadata API
 * 2. Extracts metadata like title, channel, views, and description
 * 3. Saves all transcripts as markdown files for GTM strategy analysis
 * 
 * Usage:
 *   SUPADATA_API_KEY=your_key node scripts/fetch-youtube-gtm-research.mjs
 *   
 * Or set SUPADATA_API_KEY as environment variable
 */

import dotenv from 'dotenv';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

dotenv.config({ path: '.env.local' });

// ============================================================================
// Configuration
// ============================================================================

const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Seed videos from the user + discovered videos from Exa research
const ALL_VIDEOS = [
  // Original seed videos
  'https://www.youtube.com/watch?v=xeUhKuJbeWQ',
  'https://www.youtube.com/watch?v=6P_H9eDNBcA',
  'https://www.youtube.com/watch?v=RynySryqM_0',
  'https://www.youtube.com/watch?v=8BtHk-oNlN0',
  'https://www.youtube.com/watch?v=rO3dIBMXD2g',
  'https://www.youtube.com/watch?v=67zh8_yiPh4',
  'https://www.youtube.com/watch?v=jpSY4MlWX50',
  'https://www.youtube.com/watch?v=Fzz1Xnnt17s',
  'https://www.youtube.com/watch?v=LuOZ2PKvd4s',
  'https://www.youtube.com/watch?v=k2jecxFu2as',
  'https://www.youtube.com/watch?v=jSWuepkuFrU',
  'https://www.youtube.com/watch?v=uWdIgftpvBI',
  'https://www.youtube.com/watch?v=FCGpgPZqmkY',
  'https://www.youtube.com/watch?v=ar9JCsiq6hs',
  'https://www.youtube.com/watch?v=DJ4wg4eM1-o',
  'https://www.youtube.com/watch?v=SddMq2nKsUA',
  'https://www.youtube.com/watch?v=z_fARFqjLoY',
  
  // GTM Mistakes & Lessons (Exa discovered)
  'https://www.youtube.com/watch?v=7igT_vZGxsA', // Top 10 GTM Mistakes - Jason Lemkin
  'https://www.youtube.com/watch?v=KFG9t849Wl8', // Top 10 GTM mistakes SaaStr 2024
  'https://www.youtube.com/watch?v=cCB9d3JBpz8', // Top 10 Avoidable Mistakes SaaS Startups
  'https://www.youtube.com/watch?v=19OjUgB31W8', // 5 Biggest Pitfalls Vertical SaaS GTM
  'https://www.youtube.com/watch?v=VQL5Qyr43Gc', // GTM Strategy: 5 Critical Components
  'https://www.youtube.com/watch?v=bYlY6pOTRCQ', // Avoid mistakes B2B SaaS founder
  'https://www.youtube.com/watch?v=r3Pc0sKRoLQ', // Scaling SaaS: GTM Stories
  'https://www.youtube.com/watch?v=0tI7iAGFBSI', // Growth Strategies: $500M E-Commerce
  'https://www.youtube.com/watch?v=YsqF2lyYfLk', // 5 Painful SaaS F*ckups
  'https://www.youtube.com/watch?v=bkMcYwwG9wA', // Top 3 Mistakes SaaS 2025
  
  // Community & PLG Strategy (Exa discovered)
  'https://www.youtube.com/watch?v=5wEG2h5hfzY', // Grow SaaS Faster with Community
  'https://www.youtube.com/watch?v=s1j2kjl8haU', // Activating Community in PLG
  'https://www.youtube.com/watch?v=aYX1x3Vmr-0', // PLG meets Partnerships - Kyle Poyar
  'https://www.youtube.com/watch?v=ibQU8NUvQRc', // Community-Led + Product-Led Growth
  'https://www.youtube.com/watch?v=chlfO4DMx9s', // Magic inside the product - communities
  'https://www.youtube.com/watch?v=yZiKySlPxLo', // 6 Secrets to Building PLG Business
  'https://www.youtube.com/watch?v=MGtm8fb4nK0', // PLG effect on B2B SaaS - Tally founder
  'https://www.youtube.com/watch?v=wchIx-OxvNo', // Sales-led SaaS embrace PLG
  'https://www.youtube.com/watch?v=8ozubl0OJuY', // Community Led Growth Future
  'https://www.youtube.com/watch?v=jbZ0SRdTamo', // DIY: Creating Community Strategy
  
  // Pricing & Monetization (Exa discovered)
  'https://www.youtube.com/watch?v=1wElP5N6QgY', // Hidden Costs Free Trials, Power of Freemium
  'https://www.youtube.com/watch?v=gvV-ZgXdfUM', // Freemium vs Premium: Data-Backed Answer
  'https://www.youtube.com/watch?v=lDbwP51FWgU', // How to Get SaaS Pricing Right
  'https://www.youtube.com/watch?v=St73x1RRMdw', // Value-Based Pricing & Smart Packaging
  'https://www.youtube.com/watch?v=3ETQOVwLhJM', // Pricing Strategy 10x Revenue
  'https://www.youtube.com/watch?v=v-bCGaYc4jw', // Freemium vs Free Trial
  'https://www.youtube.com/watch?v=72PBx2CtKO4', // Premium-Only SaaS Wins in AI
  'https://www.youtube.com/watch?v=854xNn0Lz4Q', // SaaS monetization 2026
  'https://www.youtube.com/watch?v=Xgu5p93jjJ0', // Pros Cons Freemium Pricing
  'https://www.youtube.com/watch?v=j10aawHx19k', // Freemium Model Explained
  
  // Discord & Community Monetization
  'https://www.youtube.com/watch?v=tPH9Pq5os7g', // 6 Methods to Monetize Your Discord Server
  'https://www.youtube.com/watch?v=1ig-3Gvh5ZE', // Discord's 200M User Growth Strategies
  'https://www.youtube.com/watch?v=mdWqG2ebUiU', // Paid Discord Sub Roles Tutorial
  
  // Vertical SaaS & Niche Markets
  'https://www.youtube.com/watch?v=sTRJXEC-LTs', // How Vertical SaaS Wins with AI
  'https://www.youtube.com/watch?v=JmaK6ZYq1c4', // Scale Vertical SaaS 2025 - Procore CRO
  'https://www.youtube.com/watch?v=bfD4oFQXHTs', // Built $15M ARR Vertical SaaS - PushPress
  'https://www.youtube.com/watch?v=gUO5U07s8po', // Podium $1M to Hundreds of Millions
  'https://www.youtube.com/watch?v=P_aW3Nk1xrU', // Dominant Vertical SaaS Ignoring Modern GTM
  'https://www.youtube.com/watch?v=9aEIhQjF1_Q', // Build Vertical Software Company Playbook
  'https://www.youtube.com/watch?v=wj-ESs_2WwU', // Vertical SaaS Revenue Expansion
  
  // Beta Programs & Early Access
  'https://www.youtube.com/watch?v=EGEpwRHiALc', // First 1,000 Beta Testing Customers
  'https://www.youtube.com/watch?v=UoPSoI5Oqqk', // Beta Testing Strategy: Perfect Launches
  
  // Niche & Micro-SaaS
  'https://www.youtube.com/watch?v=6xSp0vK-Fag', // Build Launch Scale Micro-SaaS
  'https://www.youtube.com/watch?v=npcL7oRZQlI', // Built $9K/Month Micro-SaaS
  'https://www.youtube.com/watch?v=vudlSZun8nk', // Price Your Membership Site 2025
  'https://www.youtube.com/watch?v=myoitPf6e-8', // Psychology of Pricing
  
  // Customer Retention & Churn
  'https://www.youtube.com/watch?v=23zvFgQQgr0', // 2024 SaaS Retention Benchmarks
  'https://www.youtube.com/watch?v=9pkYU_fMS54', // Cutting SaaS Churn: What Actually Keeps Customers
  'https://www.youtube.com/watch?v=X2wvMyntBnU', // Reduce Churn: Long-Term Retention
  'https://www.youtube.com/watch?v=3GcTiaebPq0', // 6 SaaS Retention Tips
  'https://www.youtube.com/watch?v=HiKsaU573gM', // SaaS Churn Prediction & Strategies
  'https://www.youtube.com/watch?v=g37GNwT7cLM', // Cancellation Flow Best Practices
  
  // Content Marketing & SEO
  'https://www.youtube.com/watch?v=Sxn1ji7vYzU', // B2B Content Strategy for $1M ARR
  'https://www.youtube.com/watch?v=VlpV1YFUjmo', // Content Marketing Predictions 2026
  'https://www.youtube.com/watch?v=NfqqkYIAcP4', // SaaS SEO Show
  'https://www.youtube.com/watch?v=IjTsZY0hBJc', // Organic Growth Early-Stage SaaS
  'https://www.youtube.com/watch?v=aJG0K3uC6WM', // Building Strategy for Organic Growth
  'https://www.youtube.com/watch?v=nnFF34v77Xw', // B2B SaaS SEO Case Study
  'https://www.youtube.com/watch?v=usZfKP3QUts', // Effective SaaS SEO Strategy 2024
  'https://www.youtube.com/watch?v=9emLMxmFCYA', // SaaS SEO Marketing Ideas
  
  // UGC & Community-Driven Growth
  'https://www.youtube.com/watch?v=r02kWc2_ZRM', // User-Generated Content for SaaS
  'https://www.youtube.com/watch?v=sjmXMgd1wRo', // GEO + UGC: Grow Organic Traffic
  'https://www.youtube.com/watch?v=26GUlAe913M', // ProductHunt's SEO Strategy
];

const OUTPUT_DIR = join(process.cwd(), 'SaaS Strategy', 'YouTube Videos');
const DELAY_BETWEEN_REQUESTS = 2000; // 2 second delay to respect API limits

// ============================================================================
// Utility Functions
// ============================================================================

const log = (...args) => console.log('[gtm-research]', ...args);
const logVerbose = (...args) => console.log('[gtm-research:verbose]', ...args);
const logError = (...args) => console.error('[gtm-research:error]', ...args);

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Just the ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function sanitizeFilename(str) {
  return str
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .substring(0, 100);
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// YouTube Metadata Fetching
// ============================================================================

async function fetchVideoMetadata(videoId) {
  if (!GOOGLE_API_KEY) {
    logVerbose(`  Skipping metadata fetch (no Google API key)`);
    return null;
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${GOOGLE_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return null;
    }

    const video = data.items[0];
    return {
      title: video.snippet.title,
      channelName: video.snippet.channelTitle,
      channelId: video.snippet.channelId,
      description: video.snippet.description,
      publishedAt: video.snippet.publishedAt,
      viewCount: parseInt(video.statistics.viewCount || 0),
      likeCount: parseInt(video.statistics.likeCount || 0),
      thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
    };
  } catch (error) {
    logVerbose(`  Failed to fetch metadata: ${error.message}`);
    return null;
  }
}

// ============================================================================
// Supadata Transcript Fetching
// ============================================================================

async function fetchTranscriptViaSupadata(videoId) {
  if (!SUPADATA_API_KEY) {
    throw new Error('SUPADATA_API_KEY not configured');
  }

  const url = `https://api.supadata.ai/v1/transcript?url=https://www.youtube.com/watch?v=${videoId}`;
  
  logVerbose(`  Fetching transcript via Supadata API...`);
  
  const response = await fetch(url, {
    headers: {
      'x-api-key': SUPADATA_API_KEY
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supadata API error ${response.status}: ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();
  
  // Handle content array mode (standard Supadata response)
  if (data.content && data.content.length > 0) {
    const fullText = data.content.map(item => item.text || '').join(' ');
    return {
      text: fullText,
      language: data.lang || 'en',
      source: 'supadata',
    };
  }

  // Handle text mode if available
  if (data.text && data.text.length > 0) {
    return {
      text: data.text,
      language: data.lang || 'en',
      source: 'supadata',
    };
  }

  return null;
}

// ============================================================================
// Markdown Generation
// ============================================================================

function generateMarkdown(videoId, metadata, transcript) {
  const lines = [];
  
  lines.push(`# ${metadata?.title || `Video ${videoId}`}`);
  lines.push('');
  
  if (metadata) {
    lines.push('## Video Information');
    lines.push('');
    lines.push(`- **Channel**: ${metadata.channelName}`);
    lines.push(`- **Published**: ${new Date(metadata.publishedAt).toLocaleDateString()}`);
    lines.push(`- **Views**: ${metadata.viewCount.toLocaleString()}`);
    lines.push(`- **Likes**: ${metadata.likeCount.toLocaleString()}`);
    lines.push(`- **URL**: https://www.youtube.com/watch?v=${videoId}`);
    lines.push('');
    
    if (metadata.description) {
      lines.push('## Description');
      lines.push('');
      lines.push(metadata.description);
      lines.push('');
    }
  } else {
    lines.push(`**URL**: https://www.youtube.com/watch?v=${videoId}`);
    lines.push('');
  }
  
  lines.push('---');
  lines.push('');
  lines.push('## Transcript');
  lines.push('');
  
  if (transcript && transcript.text) {
    // Split into paragraphs for better readability
    const paragraphs = transcript.text.split(/\.\s+/).reduce((acc, sentence, i) => {
      const paragraphIndex = Math.floor(i / 5); // ~5 sentences per paragraph
      if (!acc[paragraphIndex]) acc[paragraphIndex] = [];
      acc[paragraphIndex].push(sentence);
      return acc;
    }, []);
    
    paragraphs.forEach(para => {
      if (para.length > 0) {
        lines.push(para.join('. ') + (para[para.length - 1].endsWith('.') ? '' : '.'));
        lines.push('');
      }
    });
  } else {
    lines.push('*Transcript not available*');
  }
  
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`*Fetched: ${new Date().toISOString()}*`);
  lines.push(`*Source: ${transcript?.source || 'N/A'}*`);
  
  return lines.join('\n');
}

// ============================================================================
// Main Processing
// ============================================================================

async function processVideo(url, index, total) {
  const videoId = extractVideoId(url);
  
  if (!videoId) {
    logError(`Invalid URL: ${url}`);
    return { success: false, videoId: null };
  }

  log(`[${index}/${total}] Processing ${videoId}...`);

  try {
    // Fetch metadata
    logVerbose(`  Fetching metadata...`);
    const metadata = await fetchVideoMetadata(videoId);
    
    if (metadata) {
      log(`  ✓ Title: ${metadata.title}`);
      log(`  ✓ Channel: ${metadata.channelName}`);
    }

    // Fetch transcript
    logVerbose(`  Fetching transcript...`);
    const transcript = await fetchTranscriptViaSupadata(videoId);
    
    if (transcript) {
      log(`  ✓ Transcript: ${transcript.text.length} characters`);
    } else {
      logError(`  ✗ No transcript available`);
    }

    // Generate filename
    const filename = metadata 
      ? `${sanitizeFilename(metadata.title)}-${videoId}.md`
      : `video-${videoId}.md`;
    
    const filepath = join(OUTPUT_DIR, filename);

    // Generate and save markdown
    const markdown = generateMarkdown(videoId, metadata, transcript);
    await writeFile(filepath, markdown, 'utf-8');
    
    log(`  ✓ Saved: ${filename}`);

    return {
      success: true,
      videoId,
      filename,
      hasTranscript: !!transcript,
      metadata,
      category: categorizeVideo(url),
    };

  } catch (error) {
    logError(`  Failed to process ${videoId}: ${error.message}`);
    return { success: false, videoId, error: error.message };
  }
}

function categorizeVideo(url) {
  const index = ALL_VIDEOS.indexOf(url);
  if (index < 17) return 'seed';
  if (index < 27) return 'gtm-mistakes';
  if (index < 37) return 'community-plg';
  if (index < 47) return 'pricing-monetization';
  if (index < 50) return 'discord-community';
  if (index < 57) return 'vertical-saas';
  if (index < 59) return 'beta-programs';
  if (index < 63) return 'micro-saas';
  if (index < 69) return 'retention-churn';
  if (index < 77) return 'content-seo';
  return 'ugc-growth';
}

async function main() {
  console.log('');
  log('='.repeat(70));
  log('YouTube GTM Research - Transcript Fetcher');
  log('='.repeat(70));
  console.log('');

  // Validate API keys
  if (!SUPADATA_API_KEY) {
    logError('❌ SUPADATA_API_KEY is required.');
    logError('Please set it as an environment variable:');
    logError('  export SUPADATA_API_KEY=your_key_here');
    logError('Or run: SUPADATA_API_KEY=your_key node scripts/fetch-youtube-gtm-research.mjs');
    process.exit(1);
  }

  log('✓ SUPADATA_API_KEY found');
  
  if (GOOGLE_API_KEY) {
    log('✓ GOOGLE_API_KEY found (metadata enabled)');
  } else {
    log('ℹ️  GOOGLE_API_KEY not found (metadata disabled)');
  }

  // Create output directory
  try {
    await mkdir(OUTPUT_DIR, { recursive: true });
    log(`✓ Output directory: ${OUTPUT_DIR}`);
  } catch (error) {
    logError(`Failed to create output directory: ${error.message}`);
    process.exit(1);
  }

  console.log('');
  log(`📹 Processing ${ALL_VIDEOS.length} videos...`);
  log(`   - ${ALL_VIDEOS.filter((_, i) => i < 17).length} seed videos`);
  log(`   - ${ALL_VIDEOS.filter((_, i) => i >= 17 && i < 27).length} GTM mistakes & lessons`);
  log(`   - ${ALL_VIDEOS.filter((_, i) => i >= 27 && i < 37).length} Community & PLG strategy`);
  log(`   - ${ALL_VIDEOS.filter((_, i) => i >= 37 && i < 47).length} Pricing & monetization`);
  log(`   - ${ALL_VIDEOS.filter((_, i) => i >= 47 && i < 50).length} Discord & community monetization`);
  log(`   - ${ALL_VIDEOS.filter((_, i) => i >= 50 && i < 57).length} Vertical SaaS & niche markets`);
  log(`   - ${ALL_VIDEOS.filter((_, i) => i >= 57 && i < 59).length} Beta programs & early access`);
  log(`   - ${ALL_VIDEOS.filter((_, i) => i >= 59 && i < 63).length} Micro-SaaS & pricing psychology`);
  log(`   - ${ALL_VIDEOS.filter((_, i) => i >= 63 && i < 69).length} Retention & churn reduction`);
  log(`   - ${ALL_VIDEOS.filter((_, i) => i >= 69 && i < 77).length} Content marketing & SEO`);
  log(`   - ${ALL_VIDEOS.filter((_, i) => i >= 77).length} UGC & community-driven growth`);
  console.log('');

  const results = [];
  for (let i = 0; i < ALL_VIDEOS.length; i++) {
    const result = await processVideo(ALL_VIDEOS[i], i + 1, ALL_VIDEOS.length);
    results.push(result);
    
    if (i < ALL_VIDEOS.length - 1) {
      await delay(DELAY_BETWEEN_REQUESTS);
    }
  }

  console.log('');
  log('─'.repeat(70));
  console.log('');

  // Summary
  const successful = results.filter(r => r.success);
  const withTranscripts = results.filter(r => r.hasTranscript);
  const failed = results.filter(r => !r.success);

  const byCategory = {
    seed: results.filter(r => r.category === 'seed'),
    gtm: results.filter(r => r.category === 'gtm-mistakes'),
    community: results.filter(r => r.category === 'community-plg'),
    pricing: results.filter(r => r.category === 'pricing-monetization'),
    discord: results.filter(r => r.category === 'discord-community'),
    vertical: results.filter(r => r.category === 'vertical-saas'),
    beta: results.filter(r => r.category === 'beta-programs'),
    micro: results.filter(r => r.category === 'micro-saas'),
    retention: results.filter(r => r.category === 'retention-churn'),
    seo: results.filter(r => r.category === 'content-seo'),
    ugc: results.filter(r => r.category === 'ugc-growth'),
  };

  console.log('');
  log('='.repeat(70));
  log('SUMMARY');
  log('='.repeat(70));
  console.log('');
  log(`Total videos processed: ${results.length}`);
  log(`✓ Successful: ${successful.length}`);
  log(`✓ With transcripts: ${withTranscripts.length}`);
  if (failed.length > 0) {
    log(`✗ Failed: ${failed.length}`);
  }
  console.log('');
  log('By Category:');
  log(`  Seed videos: ${byCategory.seed.filter(r => r.success).length}/${byCategory.seed.length}`);
  log(`  GTM mistakes: ${byCategory.gtm.filter(r => r.success).length}/${byCategory.gtm.length}`);
  log(`  Community/PLG: ${byCategory.community.filter(r => r.success).length}/${byCategory.community.length}`);
  log(`  Pricing: ${byCategory.pricing.filter(r => r.success).length}/${byCategory.pricing.length}`);
  log(`  Discord: ${byCategory.discord.filter(r => r.success).length}/${byCategory.discord.length}`);
  log(`  Vertical SaaS: ${byCategory.vertical.filter(r => r.success).length}/${byCategory.vertical.length}`);
  log(`  Beta programs: ${byCategory.beta.filter(r => r.success).length}/${byCategory.beta.length}`);
  log(`  Micro-SaaS: ${byCategory.micro.filter(r => r.success).length}/${byCategory.micro.length}`);
  log(`  Retention: ${byCategory.retention.filter(r => r.success).length}/${byCategory.retention.length}`);
  log(`  SEO/Content: ${byCategory.seo.filter(r => r.success).length}/${byCategory.seo.length}`);
  log(`  UGC Growth: ${byCategory.ugc.filter(r => r.success).length}/${byCategory.ugc.length}`);
  console.log('');
  log(`📁 Output directory: ${OUTPUT_DIR}`);
  console.log('');

  // Create an index file
  const indexLines = ['# YouTube GTM Research - Video Index\n\n'];
  indexLines.push(`Generated: ${new Date().toISOString()}\n\n`);
  indexLines.push(`Total videos: ${successful.length}\n`);
  indexLines.push(`Videos with transcripts: ${withTranscripts.length}\n\n`);
  indexLines.push('---\n\n');
  
  const categories = [
    { name: 'Seed Videos', key: 'seed', results: byCategory.seed },
    { name: 'GTM Mistakes & Lessons', key: 'gtm', results: byCategory.gtm },
    { name: 'Community & PLG Strategy', key: 'community', results: byCategory.community },
    { name: 'Pricing & Monetization', key: 'pricing', results: byCategory.pricing },
    { name: 'Discord & Community Monetization', key: 'discord', results: byCategory.discord },
    { name: 'Vertical SaaS & Niche Markets', key: 'vertical', results: byCategory.vertical },
    { name: 'Beta Programs & Early Access', key: 'beta', results: byCategory.beta },
    { name: 'Micro-SaaS & Pricing Psychology', key: 'micro', results: byCategory.micro },
    { name: 'Customer Retention & Churn Reduction', key: 'retention', results: byCategory.retention },
    { name: 'Content Marketing & SEO', key: 'seo', results: byCategory.seo },
    { name: 'UGC & Community-Driven Growth', key: 'ugc', results: byCategory.ugc },
  ];

  for (const cat of categories) {
    const successfulInCat = cat.results.filter(r => r.success);
    if (successfulInCat.length > 0) {
      indexLines.push(`## ${cat.name}\n\n`);
      for (const result of successfulInCat) {
        const title = result.metadata?.title || result.videoId;
        const channel = result.metadata?.channelName || 'Unknown';
        const status = result.hasTranscript ? '✅' : '⚠️ No transcript';
        indexLines.push(`${status} [${title}](${result.filename}) - ${channel}\n`);
      }
      indexLines.push('\n');
    }
  }

  if (failed.length > 0) {
    indexLines.push('## Failed\n\n');
    for (const result of failed) {
      indexLines.push(`- ${result.videoId}: ${result.error}\n`);
    }
    indexLines.push('\n');
  }

  indexLines.push('---\n\n');
  indexLines.push('## Analysis Categories\n\n');
  indexLines.push('### GTM Strategy Patterns to Extract\n');
  indexLines.push('- Customer acquisition channels that work\n');
  indexLines.push('- Common mistakes to avoid\n');
  indexLines.push('- Pricing strategy evolution\n');
  indexLines.push('- Product-market fit signals\n\n');
  
  indexLines.push('### Community Building\n');
  indexLines.push('- How successful SaaS companies build communities\n');
  indexLines.push('- Discord vs other platforms\n');
  indexLines.push('- User-generated content strategies\n');
  indexLines.push('- Beta program structures\n\n');
  
  indexLines.push('### Monetization & Pricing\n');
  indexLines.push('- Freemium vs paid-only\n');
  indexLines.push('- Pricing tier structure\n');
  indexLines.push('- Feature gating strategies\n');
  indexLines.push('- Upsell and expansion revenue\n');

  await writeFile(join(OUTPUT_DIR, 'INDEX.md'), indexLines.join(''), 'utf-8');
  log('✓ Index file created: INDEX.md');
  
  console.log('');
  log('✅ Done!');
  console.log('');
}

// ============================================================================
// Execute
// ============================================================================

main().catch(error => {
  logError('Fatal error:', error);
  process.exit(1);
});
