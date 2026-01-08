#!/usr/bin/env node
/**
 * Audit Article Alignment
 * 
 * Compares AL Articles content against what the database and car selector
 * algorithm would actually recommend. Identifies discrepancies.
 * 
 * Usage:
 *   node scripts/audit-article-alignment.mjs              # Audit all articles
 *   node scripts/audit-article-alignment.mjs --slug=<s>   # Audit specific article
 *   node scripts/audit-article-alignment.mjs --fix        # Generate fix recommendations
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

// Scoring function adapted for database column names
// Database uses score_* columns, not camelCase
function calculateWeightedScoreFromDB(car, weights = {}) {
  const defaultWeights = {
    sound: 1, interior: 1, track: 1, reliability: 1, value: 1, driverFun: 1, aftermarket: 1
  };
  const w = { ...defaultWeights, ...weights };
  
  return (
    (parseFloat(car.score_sound) || 0) * w.sound +
    (parseFloat(car.score_interior) || 0) * w.interior +
    (parseFloat(car.score_track) || 0) * w.track +
    (parseFloat(car.score_reliability) || 0) * w.reliability +
    (parseFloat(car.score_value) || 0) * w.value +
    (parseFloat(car.score_driver_fun) || 0) * w.driverFun +
    (parseFloat(car.score_aftermarket) || 0) * w.aftermarket
  );
}

// =============================================================================
// CLI ARGUMENTS
// =============================================================================

const args = process.argv.slice(2);
const specificSlug = args.find(a => a.startsWith('--slug='))?.split('=')[1];
const showFix = args.includes('--fix');
const verbose = args.includes('--verbose') || args.includes('-v');

// =============================================================================
// ANALYSIS FUNCTIONS
// =============================================================================

/**
 * Parse article title to determine what cars it SHOULD recommend
 */
function parseArticleRequirements(article) {
  const title = article.title.toLowerCase();
  const result = {
    type: 'unknown',
    filters: {},
  };
  
  // Budget articles: "Under $X"
  const priceMatch = title.match(/under\s*\$?(\d+),?(\d*)k?/i);
  if (priceMatch) {
    const numStr = priceMatch[1] + (priceMatch[2] || '');
    const num = parseInt(numStr.replace(/,/g, ''), 10);
    const maxPrice = num < 1000 ? num * 1000 : num;
    
    result.type = 'budget';
    result.filters = { maxPrice };
    return result;
  }
  
  // Three-way comparison
  const threeWayMatch = title.match(/(.+?)\s*vs\.?\s*(.+?)\s*vs\.?\s*(.+?)(?::|$)/i);
  if (threeWayMatch) {
    result.type = 'three_way';
    result.filters = {
      cars: [
        threeWayMatch[1].trim().replace(/^\d{4}\s*/, ''),
        threeWayMatch[2].trim().replace(/^\d{4}\s*/, ''),
        threeWayMatch[3].trim().replace(/^\d{4}\s*/, ''),
      ],
    };
    return result;
  }
  
  // Head-to-head comparison
  const vsMatch = title.match(/(.+?)\s*vs\.?\s*(.+?)(?::|$)/i);
  if (vsMatch) {
    result.type = 'head_to_head';
    result.filters = {
      cars: [
        vsMatch[1].trim().replace(/^\d{4}\s*/, ''),
        vsMatch[2].trim().replace(/^\d{4}\s*/, ''),
      ],
    };
    return result;
  }
  
  // JDM articles
  if (title.includes('jdm')) {
    result.type = 'category';
    result.filters = { country: 'Japan' };
    return result;
  }
  
  // First sports car / beginner
  if (title.includes('first sports car') || title.includes('beginner')) {
    result.type = 'budget';
    result.filters = { maxPrice: 50000, prioritize: 'value' };
    return result;
  }
  
  return result;
}

/**
 * Get top cars from database for a given filter
 */
async function getTopCarsForFilter(filters, limit = 10) {
  let query = supabase.from('cars').select('*');
  
  if (filters.maxPrice) {
    query = query.lte('price_avg', filters.maxPrice);
  }
  if (filters.minPrice) {
    query = query.gte('price_avg', filters.minPrice);
  }
  if (filters.country) {
    query = query.eq('country', filters.country);
  }
  
  const { data: cars, error } = await query;
  
  if (error || !cars) {
    console.error('Query error:', error);
    return [];
  }
  
  // Score and sort using the SAME algorithm as car selector
  const scoredCars = cars.map(car => ({
    ...car,
    total: calculateWeightedScoreFromDB(car),
  }));
  
  scoredCars.sort((a, b) => b.total - a.total);
  
  return scoredCars.slice(0, limit);
}

/**
 * Find a car by partial name match
 */
async function findCarByName(name) {
  const searchTerm = name
    .replace(/^\d{4}\s*/, '')
    .replace(/[^\w\s]/g, '')
    .toLowerCase()
    .trim();
  
  const { data } = await supabase
    .from('cars')
    .select('*')
    .or(`name.ilike.%${searchTerm}%,slug.ilike.%${searchTerm.replace(/\s+/g, '-')}%`)
    .limit(5);
  
  return data || [];
}

/**
 * Audit a single article
 */
async function auditArticle(article) {
  const requirements = parseArticleRequirements(article);
  
  const audit = {
    slug: article.slug,
    title: article.title,
    category: article.category,
    subcategory: article.subcategory,
    requirementType: requirements.type,
    filters: requirements.filters,
    currentCarSlugs: article.car_slugs || [],
    issues: [],
    recommendations: [],
    severity: 'ok', // ok, warning, critical
  };
  
  // Handle budget articles
  if (requirements.type === 'budget') {
    const dbTopCars = await getTopCarsForFilter(requirements.filters, 10);
    
    if (dbTopCars.length === 0) {
      audit.issues.push({
        type: 'no_cars_found',
        message: `No cars found in database matching filter: maxPrice=${requirements.filters.maxPrice}`,
      });
      audit.severity = 'warning';
      return audit;
    }
    
    // Get car names for display
    audit.databaseTopCars = dbTopCars.slice(0, 10).map((car, i) => ({
      rank: i + 1,
      name: car.name,
      slug: car.slug,
      score: car.total.toFixed(1),
      priceAvg: `$${(car.price_avg / 1000).toFixed(0)}k`,
    }));
    
    // Check if article's car_slugs include any of the top 5 from database
    const dbTop5Slugs = dbTopCars.slice(0, 5).map(c => c.slug);
    const hasTop5 = audit.currentCarSlugs.some(slug => dbTop5Slugs.includes(slug));
    
    if (!hasTop5 && dbTop5Slugs.length > 0) {
      audit.issues.push({
        type: 'top_cars_mismatch',
        message: `Article doesn't feature any of database's top 5 cars`,
        expected: dbTop5Slugs,
        actual: audit.currentCarSlugs,
      });
      audit.severity = 'critical';
    }
    
    // Check if article car_slugs exist at all
    if (audit.currentCarSlugs.length === 0) {
      audit.issues.push({
        type: 'missing_car_slugs',
        message: 'Article has no car_slugs defined',
      });
      audit.severity = 'critical';
    }
    
    // Recommended fix
    audit.recommendations = {
      car_slugs: dbTopCars.slice(0, 6).map(c => c.slug),
      heroImageCars: dbTopCars.slice(0, 3).map(c => c.name),
      topPick: dbTopCars[0]?.name,
    };
  }
  
  // Handle comparison articles
  if (requirements.type === 'head_to_head' || requirements.type === 'three_way') {
    const expectedCars = requirements.filters.cars;
    
    // Find the cars in database
    const foundCars = [];
    const missingCars = [];
    
    for (const carName of expectedCars) {
      const matches = await findCarByName(carName);
      if (matches.length > 0) {
        foundCars.push(matches[0]);
      } else {
        missingCars.push(carName);
      }
    }
    
    if (missingCars.length > 0) {
      audit.issues.push({
        type: 'cars_not_found',
        message: `Could not find these cars in database: ${missingCars.join(', ')}`,
      });
      audit.severity = 'warning';
    }
    
    // Check if car_slugs match the expected cars
    const foundSlugs = foundCars.map(c => c.slug);
    const allMatch = foundSlugs.every(slug => audit.currentCarSlugs.includes(slug));
    
    if (!allMatch && foundSlugs.length > 0) {
      audit.issues.push({
        type: 'comparison_cars_mismatch',
        message: 'Article car_slugs don\'t match the cars mentioned in title',
        expected: foundSlugs,
        actual: audit.currentCarSlugs,
      });
      audit.severity = audit.severity === 'critical' ? 'critical' : 'warning';
    }
    
    audit.databaseCars = foundCars.map(car => ({
      name: car.name,
      slug: car.slug,
      score: calculateWeightedScoreFromDB(car).toFixed(1),
    }));
    
    audit.recommendations = {
      car_slugs: foundSlugs,
    };
  }
  
  // If no issues found
  if (audit.issues.length === 0) {
    audit.severity = 'ok';
  }
  
  return audit;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           Article Alignment Audit                              ║
║   Comparing articles against database recommendations          ║
╚════════════════════════════════════════════════════════════════╝
`);
  
  // Fetch articles
  let query = supabase
    .from('al_articles')
    .select('*')
    .eq('is_published', true);
  
  if (specificSlug) {
    query = query.eq('slug', specificSlug);
  }
  
  const { data: articles, error } = await query.order('title');
  
  if (error) {
    console.error('Failed to fetch articles:', error);
    process.exit(1);
  }
  
  console.log(`Auditing ${articles.length} article(s)...\n`);
  
  const results = {
    total: articles.length,
    ok: 0,
    warning: 0,
    critical: 0,
    audits: [],
  };
  
  for (const article of articles) {
    const audit = await auditArticle(article);
    results.audits.push(audit);
    results[audit.severity]++;
    
    // Display result
    const emoji = { ok: '✅', warning: '⚠️', critical: '❌' }[audit.severity];
    console.log(`${emoji} ${article.title}`);
    console.log(`   Type: ${audit.requirementType} | Current slugs: ${audit.currentCarSlugs.length}`);
    
    if (audit.issues.length > 0) {
      audit.issues.forEach(issue => {
        console.log(`   ⚠️ ${issue.type}: ${issue.message}`);
      });
    }
    
    if (audit.databaseTopCars && verbose) {
      console.log(`   📊 Database Top 5 (by car selector algorithm):`);
      audit.databaseTopCars.slice(0, 5).forEach(car => {
        console.log(`      ${car.rank}. ${car.name} (${car.priceAvg}, Score: ${car.score})`);
      });
    }
    
    if (showFix && audit.recommendations && Object.keys(audit.recommendations).length > 0) {
      console.log(`   💡 Recommended fix:`);
      if (audit.recommendations.car_slugs) {
        console.log(`      car_slugs: [${audit.recommendations.car_slugs.map(s => `"${s}"`).join(', ')}]`);
      }
      if (audit.recommendations.heroImageCars) {
        console.log(`      Hero image should show: ${audit.recommendations.heroImageCars.join(', ')}`);
      }
    }
    
    console.log('');
  }
  
  // Summary
  console.log(`
${'═'.repeat(60)}
                         SUMMARY
${'═'.repeat(60)}
✅ OK:       ${results.ok}
⚠️ Warning:  ${results.warning}
❌ Critical: ${results.critical}
───────────────────────────────────────────────────────────
Total:       ${results.total}
`);
  
  if (results.critical > 0) {
    console.log(`\n⚠️ ${results.critical} article(s) have CRITICAL alignment issues!`);
    console.log('These articles may be recommending cars that contradict your car selector.\n');
    
    const criticalAudits = results.audits.filter(a => a.severity === 'critical');
    console.log('Critical articles:');
    criticalAudits.forEach(audit => {
      console.log(`  - ${audit.slug}: ${audit.issues.map(i => i.type).join(', ')}`);
    });
  }
  
  console.log(`
NEXT STEPS:
1. Run with --fix to see recommended car_slugs
2. Run with --verbose to see database rankings
3. Update articles to match database recommendations
4. Regenerate images for updated articles
`);
}

main().catch(console.error);

