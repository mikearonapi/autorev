#!/usr/bin/env node
/**
 * Error Analysis CLI Script
 * 
 * Usage:
 *   node scripts/error-analysis.mjs                    # Show full report
 *   node scripts/error-analysis.mjs --unresolved       # List unresolved errors
 *   node scripts/error-analysis.mjs --regressions      # List regression errors
 *   node scripts/error-analysis.mjs --fix HASH1 HASH2  # Mark errors as fixed
 *   node scripts/error-analysis.mjs --fix-all-shown    # Mark all shown errors as fixed
 * 
 * Environment:
 *   Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

const c = (color, text) => `${colors[color]}${text}${colors.reset}`;

/**
 * Get unresolved errors from the view
 */
async function getUnresolvedErrors(daysBack = 7) {
  const { data, error } = await supabase
    .from('v_unresolved_errors')
    .select('*')
    .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
    .limit(100);

  if (error) throw error;
  return data || [];
}

/**
 * Get regression errors
 */
async function getRegressionErrors() {
  const { data, error } = await supabase
    .from('v_regression_errors')
    .select('*')
    .limit(50);

  if (error) throw error;
  return data || [];
}

/**
 * Mark errors as fixed
 */
async function markFixed(hashes, version = null, notes = null) {
  const results = [];
  for (const hash of hashes) {
    const { data, error } = await supabase.rpc('mark_error_fixed', {
      p_error_hash: hash,
      p_fixed_in_version: version,
      p_fix_notes: notes,
    });
    results.push({ hash, updated: data, error: error?.message });
  }
  return results;
}

/**
 * Print a horizontal line
 */
function hr(char = '─', length = 80) {
  console.log(colors.dim + char.repeat(length) + colors.reset);
}

/**
 * Format severity with color
 */
function formatSeverity(severity) {
  switch (severity) {
    case 'blocking': return c('red', '🔴 BLOCKING');
    case 'major': return c('yellow', '🟠 MAJOR');
    case 'minor': return c('blue', '🔵 MINOR');
    default: return c('dim', '⚪ ' + severity);
  }
}

/**
 * Truncate string
 */
function truncate(str, len = 80) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

/**
 * Print unresolved errors
 */
function printUnresolved(errors) {
  console.log('\n' + c('bold', '📋 UNRESOLVED ERRORS') + '\n');
  
  if (errors.length === 0) {
    console.log(c('green', '✅ No unresolved errors!'));
    return;
  }

  // Group by severity
  const blocking = errors.filter(e => e.severity === 'blocking');
  const major = errors.filter(e => e.severity === 'major');
  const minor = errors.filter(e => e.severity === 'minor');

  const groups = [
    { name: 'BLOCKING', errors: blocking, color: 'red' },
    { name: 'MAJOR', errors: major, color: 'yellow' },
    { name: 'MINOR', errors: minor, color: 'blue' },
  ];

  for (const group of groups) {
    if (group.errors.length === 0) continue;
    
    console.log(c(group.color, `\n${group.name} (${group.errors.length}):`));
    hr();
    
    // Dedupe by error_hash
    const seen = new Set();
    for (const error of group.errors) {
      if (error.error_hash && seen.has(error.error_hash)) continue;
      if (error.error_hash) seen.add(error.error_hash);
      
      console.log(`  ${c('cyan', error.error_hash || 'no-hash')}`);
      console.log(`    ${truncate(error.message, 70)}`);
      console.log(`    ${c('dim', `Feature: ${error.feature_context || 'unknown'} | Page: ${truncate(error.page_url, 40) || 'N/A'}`)}`);
      console.log(`    ${c('dim', `First seen: ${new Date(error.created_at).toLocaleString()}`)}`);
      console.log();
    }
  }
}

/**
 * Print regression errors
 */
function printRegressions(errors) {
  console.log('\n' + c('bold', '🔄 REGRESSION ERRORS') + '\n');
  
  if (errors.length === 0) {
    console.log(c('green', '✅ No regression errors!'));
    return;
  }

  hr();
  for (const error of errors) {
    console.log(`  ${c('magenta', error.error_hash)}`);
    console.log(`    ${truncate(error.message, 70)}`);
    console.log(`    ${c('dim', `Originally fixed: ${error.originally_fixed_at ? new Date(error.originally_fixed_at).toLocaleString() : 'Unknown'}`)}`);
    console.log(`    ${c('red', `Recurred: ${new Date(error.recurred_at).toLocaleString()}`)}`);
    console.log();
  }
}

/**
 * Print full report
 */
async function printReport() {
  console.log('\n' + c('bold', '═══════════════════════════════════════════════'));
  console.log(c('bold', '           ERROR ANALYSIS REPORT'));
  console.log(c('bold', '═══════════════════════════════════════════════') + '\n');
  console.log(c('dim', `Generated: ${new Date().toLocaleString()}`));

  const [unresolved, regressions] = await Promise.all([
    getUnresolvedErrors(),
    getRegressionErrors(),
  ]);

  // Summary
  const blocking = unresolved.filter(e => e.severity === 'blocking');
  const major = unresolved.filter(e => e.severity === 'major');
  const minor = unresolved.filter(e => e.severity === 'minor');
  
  // Unique by hash
  const uniqueHashes = [...new Set(unresolved.map(e => e.error_hash).filter(Boolean))];

  console.log('\n' + c('bold', '📊 SUMMARY'));
  hr();
  console.log(`  Total unresolved records: ${unresolved.length}`);
  console.log(`  Unique error hashes:      ${uniqueHashes.length}`);
  console.log(`  Regression errors:        ${regressions.length}`);
  console.log();
  console.log(`  ${c('red', '🔴 Blocking:')} ${blocking.length}`);
  console.log(`  ${c('yellow', '🟠 Major:')}    ${major.length}`);
  console.log(`  ${c('blue', '🔵 Minor:')}    ${minor.length}`);

  printUnresolved(unresolved);
  printRegressions(regressions);

  // Print hashes for easy copy-paste
  if (uniqueHashes.length > 0) {
    console.log('\n' + c('bold', '📝 ERROR HASHES (for marking as fixed)'));
    hr();
    console.log(c('cyan', uniqueHashes.join(' ')));
    console.log();
    console.log(c('dim', 'To mark as fixed, run:'));
    console.log(c('dim', `  node scripts/error-analysis.mjs --fix ${uniqueHashes.slice(0, 3).join(' ')}`));
  }

  console.log('\n' + c('bold', '═══════════════════════════════════════════════') + '\n');
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);
  
  try {
    if (args.includes('--unresolved')) {
      const errors = await getUnresolvedErrors();
      printUnresolved(errors);
    } else if (args.includes('--regressions')) {
      const errors = await getRegressionErrors();
      printRegressions(errors);
    } else if (args.includes('--fix')) {
      const fixIndex = args.indexOf('--fix');
      const hashes = args.slice(fixIndex + 1).filter(a => !a.startsWith('--'));
      
      if (hashes.length === 0) {
        console.error('❌ No error hashes provided');
        console.log('Usage: node scripts/error-analysis.mjs --fix HASH1 HASH2 ...');
        process.exit(1);
      }

      const version = args.includes('--version') 
        ? args[args.indexOf('--version') + 1] 
        : null;
      const notes = args.includes('--notes')
        ? args[args.indexOf('--notes') + 1]
        : null;

      console.log(`\n🔧 Marking ${hashes.length} error(s) as fixed...`);
      const results = await markFixed(hashes, version, notes);
      
      for (const r of results) {
        if (r.error) {
          console.log(`  ${c('red', '❌')} ${r.hash}: ${r.error}`);
        } else {
          console.log(`  ${c('green', '✅')} ${r.hash}: ${r.updated} record(s) updated`);
        }
      }
      console.log();
    } else {
      await printReport();
    }
  } catch (error) {
    console.error(c('red', `\n❌ Error: ${error.message}`));
    process.exit(1);
  }
}

main();

