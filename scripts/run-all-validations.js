#!/usr/bin/env node

/**
 * SuperNatural Motorsports - Master Validation Suite Runner
 * 
 * Runs all validation tools in sequence and generates a consolidated report.
 * 
 * Usage:
 *   node scripts/run-all-validations.js         # Run all validations
 *   node scripts/run-all-validations.js --quick # Skip slower checks
 * 
 * Exit codes:
 *   0 - All validations passed
 *   1 - Some validations failed
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isQuick = process.argv.includes('--quick');

// =============================================================================
// VALIDATION SUITE CONFIGURATION
// =============================================================================

const validations = [
  {
    name: 'Data Quality Queries',
    script: 'data-quality-queries.js',
    description: 'Checks for impossible values, missing fields, and data anomalies',
    critical: true,
  },
  {
    name: 'Algorithm Regression Tests',
    script: 'algorithm-regression-tests.js',
    description: 'Golden test set for scoring and algorithm behavior',
    critical: true,
  },
  {
    name: 'Content Linter',
    script: 'content-linter.js',
    description: 'Validates educational content and metadata quality',
    critical: false,
  },
  {
    name: 'Vehicle Data Audit',
    script: 'audit-vehicle-data.js',
    description: 'Compares vehicle data against OEM reference dataset',
    critical: false,
    skip: isQuick, // This requires OEM reference data
  },
  {
    name: 'Validation Suite',
    script: 'validation-suite.js',
    description: 'Comprehensive data quality, algorithm, and content checks',
    critical: false,
  },
];

// =============================================================================
// RUNNER
// =============================================================================

async function runScript(scriptPath) {
  return new Promise((resolve) => {
    const child = spawn('node', [scriptPath], {
      cwd: path.join(__dirname, '..'),
      stdio: ['inherit', 'pipe', 'pipe'],
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });
    
    child.on('close', (code) => {
      resolve({
        exitCode: code,
        stdout,
        stderr,
      });
    });
  });
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  SuperNatural Motorsports - Master Validation Runner       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log();
  console.log(`Running at: ${new Date().toISOString()}`);
  console.log(`Mode: ${isQuick ? 'Quick' : 'Full'}`);
  console.log();
  
  const results = [];
  let hasFailures = false;
  
  for (const validation of validations) {
    if (validation.skip) {
      console.log(`\n⏭️  SKIPPING: ${validation.name} (quick mode)`);
      results.push({
        name: validation.name,
        status: 'skipped',
        description: validation.description,
      });
      continue;
    }
    
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`🔄 RUNNING: ${validation.name}`);
    console.log(`   ${validation.description}`);
    console.log('═'.repeat(60));
    console.log();
    
    const scriptPath = path.join(__dirname, validation.script);
    
    if (!fs.existsSync(scriptPath)) {
      console.log(`⚠️  Script not found: ${validation.script}`);
      results.push({
        name: validation.name,
        status: 'missing',
        description: validation.description,
      });
      continue;
    }
    
    const startTime = Date.now();
    const result = await runScript(scriptPath);
    const duration = Date.now() - startTime;
    
    const passed = result.exitCode === 0;
    
    results.push({
      name: validation.name,
      status: passed ? 'passed' : 'failed',
      exitCode: result.exitCode,
      duration,
      critical: validation.critical,
      description: validation.description,
    });
    
    if (!passed && validation.critical) {
      hasFailures = true;
    }
    
    console.log();
    console.log(passed ? '✅ PASSED' : '❌ FAILED');
    console.log(`Duration: ${(duration / 1000).toFixed(1)}s`);
  }
  
  // ==========================================================================
  // SUMMARY
  // ==========================================================================
  
  console.log('\n\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                  VALIDATION SUMMARY                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log();
  
  const passed = results.filter(r => r.status === 'passed');
  const failed = results.filter(r => r.status === 'failed');
  const skipped = results.filter(r => r.status === 'skipped' || r.status === 'missing');
  
  console.log('Results:');
  for (const result of results) {
    const icon = {
      passed: '✅',
      failed: '❌',
      skipped: '⏭️',
      missing: '⚠️',
    }[result.status];
    const duration = result.duration ? ` (${(result.duration / 1000).toFixed(1)}s)` : '';
    console.log(`  ${icon} ${result.name}${duration}`);
  }
  
  console.log();
  console.log(`✅ Passed:  ${passed.length}`);
  console.log(`❌ Failed:  ${failed.length}`);
  console.log(`⏭️  Skipped: ${skipped.length}`);
  
  // Write summary to file
  const summaryPath = path.join(__dirname, '..', 'audit', 'validation-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    runAt: new Date().toISOString(),
    mode: isQuick ? 'quick' : 'full',
    summary: {
      passed: passed.length,
      failed: failed.length,
      skipped: skipped.length,
      total: results.length,
    },
    results,
  }, null, 2));
  
  console.log(`\n📄 Summary saved to: ${summaryPath}`);
  
  if (hasFailures) {
    console.log('\n❌ VALIDATION FAILED - Critical issues found');
    process.exit(1);
  } else if (failed.length > 0) {
    console.log('\n⚠️  VALIDATION COMPLETED WITH WARNINGS');
    process.exit(0);
  } else {
    console.log('\n✅ ALL VALIDATIONS PASSED');
    process.exit(0);
  }
}

main().catch(console.error);






