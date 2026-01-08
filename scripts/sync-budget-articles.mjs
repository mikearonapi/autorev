#!/usr/bin/env node
/**
 * Sync Budget Articles with Database
 * 
 * Updates budget articles ("Best Sports Cars Under $X") to:
 * 1. Use explicit "USED" or "NEW" in title
 * 2. Align car_slugs with database recommendations
 * 3. Flag articles that need content rewrites
 * 
 * Usage:
 *   node scripts/sync-budget-articles.mjs --dry-run    # Preview changes
 *   node scripts/sync-budget-articles.mjs --apply      # Apply changes
 *   node scripts/sync-budget-articles.mjs --slug=<s>   # Sync specific article
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =============================================================================
// CLI ARGUMENTS
// =============================================================================

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const apply = args.includes('--apply');
const specificSlug = args.find(a => a.startsWith('--slug='))?.split('=')[1];

if (!dryRun && !apply) {
  console.log(`
Usage:
  node scripts/sync-budget-articles.mjs --dry-run    # Preview changes
  node scripts/sync-budget-articles.mjs --apply      # Apply changes to database
  node scripts/sync-budget-articles.mjs --slug=<s>   # Sync specific article
`);
  process.exit(0);
}

// =============================================================================
// SCORING (matches car selector algorithm)
// =============================================================================

function calculateScoreFromDB(car) {
  return (
    (parseFloat(car.score_sound) || 0) +
    (parseFloat(car.score_interior) || 0) +
    (parseFloat(car.score_track) || 0) +
    (parseFloat(car.score_reliability) || 0) +
    (parseFloat(car.score_value) || 0) +
    (parseFloat(car.score_driver_fun) || 0) +
    (parseFloat(car.score_aftermarket) || 0)
  );
}

// =============================================================================
// GET TOP CARS FROM DATABASE
// =============================================================================

async function getTopCarsUnderPrice(maxPrice, limit = 6) {
  const { data: cars, error } = await supabase
    .from('cars')
    .select('*')
    .lte('price_avg', maxPrice)
    .not('price_avg', 'is', null);
  
  if (error || !cars) {
    console.error('Query error:', error);
    return [];
  }
  
  // Score and sort
  const scoredCars = cars.map(car => ({
    ...car,
    total: calculateScoreFromDB(car),
  }));
  scoredCars.sort((a, b) => b.total - a.total);
  
  return scoredCars.slice(0, limit);
}

// =============================================================================
// ARTICLE SYNC LOGIC
// =============================================================================

/**
 * Generate new title with explicit USED label
 */
function generateUsedTitle(originalTitle, maxPrice) {
  // Extract year if present
  const yearMatch = originalTitle.match(/in\s+(\d{4})/);
  const year = yearMatch ? yearMatch[1] : new Date().getFullYear();
  
  // Generate new title
  const priceK = maxPrice >= 1000 ? `$${(maxPrice / 1000).toFixed(0)},000` : `$${maxPrice}`;
  return `Best USED Sports Cars Under ${priceK}: Top Picks for ${year}`;
}

/**
 * Generate meta description for USED article
 */
function generateUsedMetaDescription(maxPrice, topCars) {
  const priceK = maxPrice >= 1000 ? `$${(maxPrice / 1000).toFixed(0)}k` : `$${maxPrice}`;
  const topCarNames = topCars.slice(0, 3).map(c => c.name).join(', ');
  return `Discover the best used sports cars under ${priceK} based on our expert scoring system. Top picks include ${topCarNames}. Find your perfect enthusiast car.`;
}

/**
 * Sync a single budget article
 */
async function syncBudgetArticle(article) {
  const result = {
    slug: article.slug,
    originalTitle: article.title,
    changes: [],
    warnings: [],
    updates: {},
  };
  
  // Parse price from title
  const priceMatch = article.title.match(/under\s*\$?(\d+),?(\d*)k?/i);
  if (!priceMatch) {
    result.warnings.push('Could not parse price from title');
    return result;
  }
  
  const numStr = priceMatch[1] + (priceMatch[2] || '');
  const num = parseInt(numStr.replace(/,/g, ''), 10);
  const maxPrice = num < 1000 ? num * 1000 : num;
  
  // Get top cars from database
  const topCars = await getTopCarsUnderPrice(maxPrice, 6);
  
  if (topCars.length === 0) {
    result.warnings.push(`No cars found under $${maxPrice}`);
    return result;
  }
  
  // Check if title already says "USED" or "NEW"
  const hasUsedLabel = /\bUSED\b/i.test(article.title);
  const hasNewLabel = /\bNEW\b/i.test(article.title);
  
  if (!hasUsedLabel && !hasNewLabel) {
    // Need to add USED to title
    const newTitle = generateUsedTitle(article.title, maxPrice);
    result.updates.title = newTitle;
    result.changes.push(`Title: "${article.title}" → "${newTitle}"`);
  }
  
  // Update car_slugs to match database
  const dbSlugs = topCars.map(c => c.slug);
  const currentSlugs = article.car_slugs || [];
  
  // Check for misalignment
  const hasAlignment = dbSlugs.slice(0, 3).some(slug => currentSlugs.includes(slug));
  
  if (!hasAlignment || currentSlugs.length === 0) {
    result.updates.car_slugs = dbSlugs;
    result.changes.push(`car_slugs: [${currentSlugs.join(', ') || 'none'}] → [${dbSlugs.join(', ')}]`);
  }
  
  // Update meta description if title changed
  if (result.updates.title) {
    const newMeta = generateUsedMetaDescription(maxPrice, topCars);
    result.updates.meta_description = newMeta;
    result.changes.push(`meta_description: updated for USED focus`);
  }
  
  // Flag for content rewrite if major changes
  if (result.updates.car_slugs) {
    result.warnings.push('⚠️ CONTENT REWRITE NEEDED: Article body discusses different cars than database recommends');
    result.recommendedCars = topCars.slice(0, 6).map((car, i) => ({
      rank: i + 1,
      name: car.name,
      slug: car.slug,
      priceRange: car.price_range,
      score: car.total.toFixed(1),
    }));
  }
  
  return result;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║        Budget Article Sync (NEW/USED Alignment)                ║
╚════════════════════════════════════════════════════════════════╝
`);
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be applied\n');
  }
  
  // Find budget articles
  let query = supabase
    .from('al_articles')
    .select('*')
    .eq('is_published', true)
    .or('title.ilike.%under $%,title.ilike.%under $%k%');
  
  if (specificSlug) {
    query = supabase
      .from('al_articles')
      .select('*')
      .eq('slug', specificSlug);
  }
  
  const { data: articles, error } = await query;
  
  if (error) {
    console.error('Failed to fetch articles:', error);
    process.exit(1);
  }
  
  // Filter to only budget-related articles
  const budgetArticles = articles.filter(a => 
    /under\s*\$?\d+k?/i.test(a.title.toLowerCase()) ||
    a.subcategory === 'best_under'
  );
  
  console.log(`Found ${budgetArticles.length} budget article(s) to sync\n`);
  
  const results = [];
  
  for (const article of budgetArticles) {
    const result = await syncBudgetArticle(article);
    results.push(result);
    
    console.log(`${'─'.repeat(60)}`);
    console.log(`📄 ${result.originalTitle}`);
    console.log(`   Slug: ${result.slug}`);
    
    if (result.changes.length === 0) {
      console.log(`   ✅ Already aligned with database`);
    } else {
      console.log(`   📝 Changes needed:`);
      result.changes.forEach(change => {
        console.log(`      • ${change}`);
      });
    }
    
    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        console.log(`   ${warning}`);
      });
    }
    
    if (result.recommendedCars) {
      console.log(`   📊 Database recommends these cars:`);
      result.recommendedCars.forEach(car => {
        console.log(`      ${car.rank}. ${car.name} (${car.priceRange}, Score: ${car.score})`);
      });
    }
    
    // Apply changes if --apply flag
    if (apply && Object.keys(result.updates).length > 0) {
      const { error: updateError } = await supabase
        .from('al_articles')
        .update({
          ...result.updates,
          updated_at: new Date().toISOString(),
        })
        .eq('slug', result.slug);
      
      if (updateError) {
        console.log(`   ❌ Update failed: ${updateError.message}`);
      } else {
        console.log(`   ✅ Database updated`);
      }
    }
    
    console.log('');
  }
  
  // Summary
  const needsChanges = results.filter(r => r.changes.length > 0);
  const needsRewrite = results.filter(r => r.recommendedCars);
  
  console.log(`
${'═'.repeat(60)}
                         SUMMARY
${'═'.repeat(60)}
Total budget articles:     ${results.length}
Already aligned:           ${results.length - needsChanges.length}
Need metadata updates:     ${needsChanges.length}
Need content rewrites:     ${needsRewrite.length}
${'─'.repeat(60)}
`);

  if (dryRun && needsChanges.length > 0) {
    console.log(`Run with --apply to update the database:\n`);
    console.log(`  node scripts/sync-budget-articles.mjs --apply\n`);
  }
  
  if (needsRewrite.length > 0) {
    console.log(`⚠️ ${needsRewrite.length} article(s) need CONTENT REWRITES because the`);
    console.log(`   article body discusses different cars than the database recommends.\n`);
    console.log(`   These articles should be regenerated or manually updated to feature`);
    console.log(`   the database's top-ranked cars for authenticity.\n`);
  }
}

main().catch(console.error);

