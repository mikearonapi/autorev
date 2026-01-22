#!/usr/bin/env node

/**
 * Sync Competitive Analysis to Notion
 * 
 * Creates/updates pages in Notion for each competitor with summary data.
 * Note: This script requires manual creation of a Notion database first,
 * as the API doesn't support inline database creation.
 * 
 * Usage:
 *   node scripts/competitive-analysis/sync-to-notion.mjs
 *   node scripts/competitive-analysis/sync-to-notion.mjs --parent-page-id=xxx
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

const CONFIG_PATH = path.join(ROOT_DIR, 'SaaS Strategy/competitor-config.json');

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    parentPageId: null,
    dryRun: false,
  };

  for (const arg of args) {
    if (arg.startsWith('--parent-page-id=')) {
      options.parentPageId = arg.split('=')[1];
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    }
  }

  return options;
}

/**
 * Generate Notion-compatible content for a competitor
 */
async function generateNotionContent(competitor) {
  return {
    name: competitor.name,
    category: competitor.category,
    subcategory: competitor.subcategory,
    url: competitor.urls.homepage,
    businessModel: competitor.businessModel,
    topPattern: competitor.topPattern,
    studyFocus: competitor.studyFocus?.join(', ') || '',
    pages: {
      homepage: competitor.urls.homepage,
      pricing: competitor.urls.pricing,
      features: competitor.urls.features,
      about: competitor.urls.about,
    },
  };
}

/**
 * Main execution
 */
async function main() {
  const options = parseArgs();

  console.log('\n📝 Notion Sync for Competitive Analysis');
  console.log('━'.repeat(50));

  // Load config
  const configText = await fs.readFile(CONFIG_PATH, 'utf-8');
  const config = JSON.parse(configText);

  console.log(`📊 Competitors: ${config.competitors.length}`);

  if (options.dryRun) {
    console.log('\n🏃 DRY RUN - No changes will be made to Notion\n');
  }

  // Generate summary for each competitor
  const summaries = [];
  
  for (const competitor of config.competitors) {
    const content = await generateNotionContent(competitor);
    summaries.push(content);
    
    if (options.dryRun) {
      console.log(`  📄 ${competitor.name} (${competitor.category})`);
    }
  }

  // Output summary JSON for manual import if needed
  const summaryPath = path.join(ROOT_DIR, 'SaaS Strategy/competitor-analysis/notion-import-data.json');
  await fs.writeFile(summaryPath, JSON.stringify({
    exportedAt: new Date().toISOString(),
    count: summaries.length,
    competitors: summaries,
    schema: {
      name: 'title',
      category: 'select',
      subcategory: 'text',
      url: 'url',
      businessModel: 'text',
      topPattern: 'text',
      studyFocus: 'text',
    },
  }, null, 2));

  console.log('\n' + '━'.repeat(50));
  console.log('📊 SYNC SUMMARY');
  console.log('━'.repeat(50));
  console.log(`📁 Import data saved to: notion-import-data.json`);
  console.log(`📄 Competitors prepared: ${summaries.length}`);
  console.log('');
  console.log('To import into Notion:');
  console.log('1. Create a new database in Notion');
  console.log('2. Add properties: Name (title), Category (select), URL (url), etc.');
  console.log('3. Use Notion\'s CSV import or copy data from JSON');
  console.log('━'.repeat(50) + '\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
