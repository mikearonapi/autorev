#!/usr/bin/env node
/**
 * Backfill Missing Car Issues
 * 
 * Generates known issues for cars that have 0 issues in the database.
 * Uses Claude AI to research and generate realistic issues based on
 * owner forums, TSBs, and recall history.
 * 
 * Usage:
 *   node scripts/car-pipeline/backfill-missing-issues.js
 *   node scripts/car-pipeline/backfill-missing-issues.js --dry-run
 *   node scripts/car-pipeline/backfill-missing-issues.js --limit=5
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Parse CLI args
const args = process.argv.slice(2);
const flags = {
  dryRun: args.includes('--dry-run'),
  limit: parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1]) || null,
  verbose: args.includes('--verbose') || args.includes('-v'),
};

function log(msg, type = 'info') {
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    ai: '🤖',
    db: '💾',
    skip: '⏭️',
  };
  console.log(`${prefix[type] || '•'} ${msg}`);
}

async function getCarsWithoutIssues() {
  const { data, error } = await supabase.rpc('get_cars_without_issues');
  
  if (error) {
    // Fallback to direct query if RPC doesn't exist
    const { data: cars, error: queryError } = await supabase
      .from('cars')
      .select('id, slug, name, years');
    
    if (queryError) throw queryError;
    
    // Filter to cars with no issues
    const { data: allIssues } = await supabase
      .from('car_issues')
      .select('car_slug');
    
    const slugsWithIssues = new Set(allIssues?.map(i => i.car_slug) || []);
    return cars.filter(c => !slugsWithIssues.has(c.slug));
  }
  
  return data;
}

async function aiResearchKnownIssues(carData) {
  log(`Researching issues for ${carData.name}...`, 'ai');
  
  const prompt = `Research the known issues and reliability concerns for the ${carData.name} (${carData.years}).

Based on owner forums, TSBs, and recall history, provide 5-8 realistic known issues.

CRITICAL: Use this exact JSON format with these exact enum values:

[
  {
    "title": "Issue name (e.g., IMS Bearing Failure)",
    "kind": "common_issue",
    "severity": "critical",
    "affected_years_text": "Years affected (e.g., 2020-2022)",
    "description": "Detailed description (2-3 sentences)",
    "symptoms": ["Symptom 1", "Symptom 2", "Symptom 3"],
    "prevention": "How to prevent or catch early",
    "fix_description": "What the repair involves",
    "estimated_cost_text": "Cost range (e.g., $2,000 - $4,000)",
    "estimated_cost_low": 2000,
    "estimated_cost_high": 4000
  }
]

ENUM VALUES:
- kind: ONLY use "common_issue", "recall", "tsb", or "other"
- severity: ONLY use "critical", "high", "medium", "low", or "cosmetic" (lowercase)
- symptoms: MUST be an array of strings, NOT pipe-separated text

RULES:
- Include at least 1 critical or high severity issue if applicable
- Most issues should be "common_issue" kind
- Realistic cost estimates with both text and numeric values
- Be specific to this exact model and generation
- Return ONLY the JSON array`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  });

  const content = response.content[0].text;
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON array in AI response');
  
  const issues = JSON.parse(jsonMatch[0]);
  
  return issues.map(issue => ({
    ...issue,
    car_id: carData.id,
    car_slug: carData.slug,
  }));
}

async function saveIssues(issues, carSlug) {
  if (flags.dryRun) {
    log(`[DRY RUN] Would save ${issues.length} issues for ${carSlug}`, 'skip');
    if (flags.verbose) {
      issues.forEach(i => console.log(`  - ${i.title} (${i.severity})`));
    }
    return;
  }

  const { error } = await supabase
    .from('car_issues')
    .insert(issues);

  if (error) throw error;
  log(`Saved ${issues.length} issues for ${carSlug}`, 'db');
}

async function main() {
  console.log('\n🔧 Backfill Missing Car Issues\n');
  
  if (flags.dryRun) {
    log('Running in DRY RUN mode - no changes will be made\n', 'info');
  }

  // Get cars without issues
  log('Finding cars without known issues...', 'info');
  let cars = await getCarsWithoutIssues();
  
  if (flags.limit) {
    cars = cars.slice(0, flags.limit);
    log(`Limited to ${flags.limit} cars`, 'info');
  }

  log(`Found ${cars.length} cars needing issues\n`, 'info');

  let successCount = 0;
  let errorCount = 0;

  for (const car of cars) {
    try {
      const issues = await aiResearchKnownIssues(car);
      await saveIssues(issues, car.slug);
      successCount++;
      
      // Rate limiting - wait 1 second between API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      log(`Failed for ${car.slug}: ${err.message}`, 'error');
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  log(`Completed: ${successCount} success, ${errorCount} errors`, successCount > 0 ? 'success' : 'info');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

