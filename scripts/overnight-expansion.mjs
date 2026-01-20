#!/usr/bin/env node
/**
 * Overnight Database Expansion Runner
 * 
 * Runs all phases of the database expansion plan sequentially:
 * 1. AI Research for Tier 1 cars (20 cars)
 * 2. AI Research for Tier 2 cars (15 cars)
 * 3. AI Research for Tier 3 cars (10 cars)
 * 4. AI Research for missing cars (up to 50 more)
 * 5. Seed dyno baselines
 * 
 * Usage:
 *   node scripts/overnight-expansion.mjs
 *   node scripts/overnight-expansion.mjs --dry-run
 * 
 * Progress is logged to: logs/overnight-expansion-{date}.log
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Parse args
const dryRun = process.argv.includes('--dry-run');

// Setup logging
const timestamp = new Date().toISOString().split('T')[0];
const logDir = path.join(projectRoot, 'logs');
const logFile = path.join(logDir, `overnight-expansion-${timestamp}.log`);

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function log(message) {
  const time = new Date().toISOString();
  const line = `[${time}] ${message}`;
  console.log(line);
  logStream.write(line + '\n');
}

function runCommand(command, args, description) {
  return new Promise((resolve, reject) => {
    log(`\n${'='.repeat(60)}`);
    log(`STARTING: ${description}`);
    log(`Command: ${command} ${args.join(' ')}`);
    log('='.repeat(60));
    
    const startTime = Date.now();
    
    const proc = spawn(command, args, {
      cwd: projectRoot,
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '1' }
    });
    
    proc.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          log(`  ${line}`);
        }
      });
    });
    
    proc.stderr.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          log(`  [ERR] ${line}`);
        }
      });
    });
    
    proc.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
      if (code === 0) {
        log(`✅ COMPLETED: ${description} (${duration} min)`);
        resolve();
      } else {
        log(`❌ FAILED: ${description} (exit code ${code})`);
        // Don't reject - continue with next phase
        resolve();
      }
    });
    
    proc.on('error', (err) => {
      log(`❌ ERROR: ${err.message}`);
      resolve(); // Continue anyway
    });
  });
}

async function main() {
  const overallStart = Date.now();
  
  log('\n');
  log('🌙 OVERNIGHT DATABASE EXPANSION STARTED');
  log('========================================');
  log(`Timestamp: ${new Date().toISOString()}`);
  log(`Log file: ${logFile}`);
  log(`Dry run: ${dryRun}`);
  log('');
  
  const dryRunFlag = dryRun ? ['--dry-run'] : [];
  
  // Phase 1: Tier 1 AI Research (20 high-priority cars)
  await runCommand('node', [
    'scripts/tuning-pipeline/batch-ai-research.mjs',
    '--tier', '1',
    '--limit', '20',
    '--delay', '8000',
    '--verbose',
    ...dryRunFlag
  ], 'Phase 1: AI Research - Tier 1 (20 cars)');
  
  // Brief pause between phases
  log('\n⏳ Pausing 30 seconds before next phase...\n');
  await new Promise(r => setTimeout(r, 30000));
  
  // Phase 2: Tier 2 AI Research (15 medium-priority cars)
  await runCommand('node', [
    'scripts/tuning-pipeline/batch-ai-research.mjs',
    '--tier', '2',
    '--limit', '15',
    '--delay', '8000',
    '--verbose',
    ...dryRunFlag
  ], 'Phase 2: AI Research - Tier 2 (15 cars)');
  
  // Brief pause
  log('\n⏳ Pausing 30 seconds before next phase...\n');
  await new Promise(r => setTimeout(r, 30000));
  
  // Phase 3: Tier 3 AI Research (10 fill-gap cars)
  await runCommand('node', [
    'scripts/tuning-pipeline/batch-ai-research.mjs',
    '--tier', '3',
    '--limit', '10',
    '--delay', '8000',
    '--verbose',
    ...dryRunFlag
  ], 'Phase 3: AI Research - Tier 3 (10 cars)');
  
  // Brief pause
  log('\n⏳ Pausing 30 seconds before next phase...\n');
  await new Promise(r => setTimeout(r, 30000));
  
  // Phase 4: Find and process remaining cars missing data
  await runCommand('node', [
    'scripts/tuning-pipeline/batch-ai-research.mjs',
    '--missing',
    '--limit', '50',
    '--delay', '8000',
    '--verbose',
    ...dryRunFlag
  ], 'Phase 4: AI Research - Missing Cars (up to 50)');
  
  // Summary
  const totalDuration = ((Date.now() - overallStart) / 1000 / 60).toFixed(1);
  
  log('\n');
  log('========================================');
  log('🌅 OVERNIGHT EXPANSION COMPLETE');
  log('========================================');
  log(`Total duration: ${totalDuration} minutes`);
  log(`Log file: ${logFile}`);
  log('');
  log('Next steps:');
  log('  1. Review log file for any failures');
  log('  2. Run validation queries from DATABASE-EXPANSION-FOR-MY-GARAGE.md');
  log('  3. Check UI to verify data is displaying correctly');
  log('');
  
  logStream.end();
}

main().catch(err => {
  log(`Fatal error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
