#!/usr/bin/env node
/**
 * Regenerate Article Images V2
 * 
 * Uses the new V2 strategy for smarter, more diverse article images.
 * 
 * Features:
 * - Aligns cars with article content/recommendations
 * - Diverse environments (not just mountain overlooks)
 * - Database-driven car selection for budget articles
 * - Better QA integration
 * 
 * Usage:
 *   node scripts/regenerate-article-images-v2.mjs --dry-run
 *   node scripts/regenerate-article-images-v2.mjs --slug=best-sports-cars-under-50k
 *   node scripts/regenerate-article-images-v2.mjs --priority=high
 *   node scripts/regenerate-article-images-v2.mjs --all
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { put } from '@vercel/blob';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load environment
const envPath = path.join(PROJECT_ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#')) {
      let value = valueParts.join('=').trim();
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key.trim()] = value;
    }
  });
}

// Dynamic imports after env is loaded
const { 
  generateArticleImageV2, 
  prioritizeArticlesForRegeneration 
} = await import('../lib/articleImageStrategyV2.js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =============================================================================
// CLI ARGUMENT PARSING
// =============================================================================

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const showHelp = args.includes('--help') || args.includes('-h');
const runAll = args.includes('--all');

const slugArg = args.find(a => a.startsWith('--slug='));
const specificSlug = slugArg ? slugArg.split('=')[1] : null;

const priorityArg = args.find(a => a.startsWith('--priority='));
const priorityFilter = priorityArg ? priorityArg.split('=')[1] : null;

const limitArg = args.find(a => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 10;

if (showHelp) {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║         Article Image Regeneration V2 - Usage Guide            ║
╚════════════════════════════════════════════════════════════════╝

OPTIONS:
  --dry-run           Show what would be generated without making changes
  --slug=<slug>       Regenerate a specific article's image
  --priority=high     Only regenerate high-priority (rejected/low-score) articles
  --priority=medium   Include medium priority articles
  --all               Regenerate ALL article images (careful!)
  --limit=N           Limit to N articles (default: 10)
  --help              Show this help message

EXAMPLES:
  node scripts/regenerate-article-images-v2.mjs --dry-run
  node scripts/regenerate-article-images-v2.mjs --slug=best-sports-cars-under-50k
  node scripts/regenerate-article-images-v2.mjs --priority=high --limit=5
`);
  process.exit(0);
}

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

async function uploadToBlob(buffer, slug, mimeType) {
  const ext = mimeType.includes('webp') ? 'webp' : mimeType.includes('jpeg') ? 'jpg' : 'png';
  const timestamp = Date.now();
  
  const blob = await put(`articles/${slug}/hero-v2-${timestamp}.${ext}`, buffer, {
    access: 'public',
    contentType: mimeType,
  });
  
  return blob.url;
}

async function regenerateArticleImage(article) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📸 ${article.title}`);
  console.log(`   Slug: ${article.slug}`);
  console.log(`   Category: ${article.category}/${article.subcategory || 'general'}`);
  
  if (article.regenerationReasons?.length > 0) {
    console.log(`   Reasons: ${article.regenerationReasons.join(', ')}`);
  }
  
  // Generate image using V2 strategy
  const result = await generateArticleImageV2(article, { supabase });
  
  console.log(`   Cars selected: ${result.cars?.map(c => c.name).join(', ') || 'N/A'}`);
  console.log(`   Environment: ${result.environment || 'N/A'}`);
  
  if (dryRun) {
    console.log(`   [DRY RUN] Prompt preview:`);
    console.log(`   ${result.prompt?.substring(0, 200)}...`);
    return { success: true, dryRun: true };
  }
  
  if (!result.success) {
    console.log(`   ❌ Generation failed: ${result.error}`);
    return { success: false, error: result.error };
  }
  
  console.log(`   ✅ Generated: ${result.imageBuffer.length} bytes`);
  
  // Upload to Vercel Blob
  try {
    console.log(`   ⏳ Uploading to blob storage...`);
    const imageUrl = await uploadToBlob(result.imageBuffer, article.slug, result.mimeType);
    console.log(`   ✅ Uploaded: ${imageUrl.substring(0, 60)}...`);
    
    // Update database
    const { error: dbError } = await supabase
      .from('al_articles')
      .update({ 
        hero_image_url: imageUrl,
        image_qa_status: 'pending', // Reset QA status for new image
        image_qa_score: null,
        image_qa_issues: null,
        image_qa_details: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', article.id);
    
    if (dbError) {
      console.log(`   ⚠️ DB update failed: ${dbError.message}`);
      return { success: true, imageUrl, dbError: dbError.message };
    }
    
    console.log(`   ✅ Database updated`);
    return { success: true, imageUrl };
    
  } catch (uploadError) {
    console.log(`   ❌ Upload failed: ${uploadError.message}`);
    return { success: false, error: uploadError.message };
  }
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║      Article Image Regeneration V2 - Smart Prompts             ║
╚════════════════════════════════════════════════════════════════╝
`);
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }
  
  // Fetch articles based on arguments
  let query = supabase
    .from('al_articles')
    .select('id, title, slug, category, subcategory, car_slugs, hero_image_url, image_qa_status, image_qa_score, image_qa_details')
    .eq('is_published', true);
  
  if (specificSlug) {
    query = query.eq('slug', specificSlug);
    console.log(`🎯 Targeting specific article: ${specificSlug}\n`);
  }
  
  const { data: articles, error } = await query.order('title');
  
  if (error) {
    console.log(`❌ Failed to fetch articles: ${error.message}`);
    process.exit(1);
  }
  
  if (articles.length === 0) {
    console.log('❌ No articles found matching criteria');
    process.exit(1);
  }
  
  // Prioritize articles if not targeting a specific one
  let articlesToProcess;
  
  if (specificSlug) {
    articlesToProcess = articles;
  } else if (runAll) {
    articlesToProcess = articles.slice(0, limit);
    console.log(`📋 Processing ALL articles (limit: ${limit})\n`);
  } else {
    const prioritized = prioritizeArticlesForRegeneration(articles);
    
    if (priorityFilter === 'high') {
      articlesToProcess = prioritized.filter(a => a.regenerationPriority >= 80).slice(0, limit);
      console.log(`📋 High priority articles: ${articlesToProcess.length}\n`);
    } else if (priorityFilter === 'medium') {
      articlesToProcess = prioritized.filter(a => a.regenerationPriority >= 40).slice(0, limit);
      console.log(`📋 Medium+ priority articles: ${articlesToProcess.length}\n`);
    } else {
      // Default: show prioritized list for user to choose
      console.log('📋 PRIORITIZED ARTICLES FOR REGENERATION:\n');
      prioritized.slice(0, 20).forEach((a, i) => {
        const statusEmoji = a.image_qa_status === 'rejected' ? '❌' : 
                           a.image_qa_status === 'approved' ? '✅' : '⚠️';
        console.log(`${i + 1}. ${statusEmoji} [${a.regenerationPriority}] ${a.title}`);
        console.log(`   Reasons: ${a.regenerationReasons.join(', ')}`);
      });
      
      console.log(`\nRun with --priority=high or --slug=<slug> to regenerate specific articles.`);
      return;
    }
  }
  
  if (articlesToProcess.length === 0) {
    console.log('✨ No articles need regeneration!');
    return;
  }
  
  console.log(`Processing ${articlesToProcess.length} article(s)...\n`);
  
  // Process each article
  const results = { success: 0, failed: 0, skipped: 0 };
  const delayMs = 5000; // 5 seconds between API calls
  
  for (let i = 0; i < articlesToProcess.length; i++) {
    const article = articlesToProcess[i];
    
    try {
      const result = await regenerateArticleImage(article);
      
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
      }
    } catch (err) {
      console.log(`   ❌ Unexpected error: ${err.message}`);
      results.failed++;
    }
    
    // Delay between requests (except for last one, and not in dry run)
    if (!dryRun && i < articlesToProcess.length - 1) {
      console.log(`   ⏳ Waiting ${delayMs / 1000}s before next request...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  
  // Summary
  console.log(`
${'═'.repeat(60)}
                         SUMMARY
${'═'.repeat(60)}
✅ Success: ${results.success}
❌ Failed:  ${results.failed}
─────────────────────────────────────────────────────────────

${dryRun ? 'This was a DRY RUN. Run without --dry-run to apply changes.' : 
  'Done! Run image QA to verify quality:\n  node scripts/run-image-qa.mjs --rerun-all'}
`);
}

main().catch(console.error);

