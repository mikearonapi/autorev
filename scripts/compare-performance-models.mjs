#!/usr/bin/env node
/**
 * Performance Model Comparison Script
 * 
 * Compares the CURRENT (legacy) calculator with the FUTURE (hybrid) model.
 * Run this to validate the new model before switching over.
 * 
 * Usage:
 *   node scripts/compare-performance-models.mjs
 *   node scripts/compare-performance-models.mjs --car=volkswagen-gti-mk7
 *   node scripts/compare-performance-models.mjs --test-suite
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Dynamic imports (ES modules)
const { compareModels, formatComparisonReport, TEST_SCENARIOS, runTestSuite } = 
  await import('../lib/performanceModelComparison.js');

// ============================================================================
// HELPERS
// ============================================================================

async function getCar(slug) {
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .eq('slug', slug)
    .single();
  
  if (error) {
    console.error(`Failed to fetch car ${slug}:`, error.message);
    return null;
  }
  
  return data;
}

async function getPopularCars(limit = 10) {
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .order('hp', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Failed to fetch cars:', error.message);
    return [];
  }
  
  return data;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║           PERFORMANCE MODEL COMPARISON TOOL                       ║
║                                                                    ║
║  Comparing: LEGACY (current) vs FUTURE (hybrid physics model)     ║
╚══════════════════════════════════════════════════════════════════╝
`);

  // Check for test suite flag
  if (args.includes('--test-suite')) {
    console.log('Running full test suite...\n');
    
    const results = await runTestSuite(getCar);
    
    console.log('TEST RESULTS:');
    console.log('─'.repeat(80));
    console.log(
      'Scenario'.padEnd(25),
      'Legacy'.padEnd(10),
      'Future'.padEnd(10),
      'Expected'.padEnd(15),
      'Status'.padEnd(10),
      'Confidence'
    );
    console.log('─'.repeat(80));
    
    for (const r of results) {
      if (r.status === 'SKIP') {
        console.log(r.scenario.padEnd(25), 'SKIPPED:', r.reason);
      } else {
        console.log(
          r.name.padEnd(25),
          `+${r.legacyGain}`.padEnd(10),
          `+${r.futureGain}`.padEnd(10),
          r.expectedRange.padEnd(15),
          r.status.padEnd(10),
          r.confidence
        );
      }
    }
    
    console.log('─'.repeat(80));
    const passed = results.filter(r => r.status === 'PASS').length;
    const total = results.filter(r => r.status !== 'SKIP').length;
    console.log(`\n${passed}/${total} scenarios within expected range`);
    
    return;
  }

  // Check for specific car flag
  const carArg = args.find(a => a.startsWith('--car='));
  
  if (carArg) {
    const carSlug = carArg.split('=')[1];
    const car = await getCar(carSlug);
    
    if (!car) {
      console.error(`Car not found: ${carSlug}`);
      process.exit(1);
    }
    
    // Test with common upgrade combos
    const testCombos = [
      ['stage1-tune'],
      ['stage1-tune', 'intake'],
      ['stage2-tune', 'downpipe', 'intake'],
      ['intake', 'exhaust-catback', 'tune-street'],
    ];
    
    for (const upgrades of testCombos) {
      const comparison = await compareModels(car, upgrades);
      console.log(formatComparisonReport(comparison));
    }
    
    return;
  }

  // Default: run comparisons on popular cars
  console.log('Running comparison on popular cars with Stage 1 tune...\n');
  
  const popularSlugs = [
    'volkswagen-gti-mk7',
    'bmw-m3-f80',
    'ford-mustang-gt-s550',
    'shelby-gt350',
    'audi-rs3-8v',
    'toyota-gr-supra',
    'subaru-wrx-sti-va',
    'chevrolet-camaro-ss-1le',
  ];
  
  const upgradeKeys = ['stage1-tune'];
  
  console.log('STAGE 1 TUNE COMPARISON:');
  console.log('─'.repeat(90));
  console.log(
    'Car'.padEnd(30),
    'Stock'.padEnd(8),
    'Legacy'.padEnd(12),
    'Future'.padEnd(12),
    'Delta'.padEnd(8),
    'Confidence'
  );
  console.log('─'.repeat(90));
  
  for (const slug of popularSlugs) {
    const car = await getCar(slug);
    if (!car) continue;
    
    const comparison = await compareModels(car, upgradeKeys);
    
    console.log(
      car.name.substring(0, 28).padEnd(30),
      car.hp.toString().padEnd(8),
      `${comparison.legacy.projectedHp} (+${comparison.legacy.totalGain})`.padEnd(12),
      `${comparison.future.projectedHp} (+${comparison.future.totalGain})`.padEnd(12),
      `${comparison.difference.hpDelta > 0 ? '+' : ''}${comparison.difference.hpDelta}`.padEnd(8),
      comparison.future.confidenceLabel
    );
  }
  
  console.log('─'.repeat(90));
  
  console.log(`
INTERPRETATION:
• Delta shows difference between models (Future - Legacy)
• Positive delta = Future model predicts higher gains
• "Confidence" shows data quality backing the Future prediction
• Run with --test-suite for full validation against expected ranges
• Run with --car=<slug> for detailed single-car analysis
`);
}

main().catch(console.error);
