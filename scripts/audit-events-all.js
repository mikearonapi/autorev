#!/usr/bin/env node
/**
 * Combined Events Audit Runner
 * 
 * Runs all three audit scripts in sequence:
 * 1. MECE Audit (duplicates and categorization)
 * 2. URL Validation
 * 3. Data Quality
 * 
 * Generates a single combined report and exits with code 1 if critical issues found.
 * 
 * @module scripts/audit-events-all
 */

import dotenv from 'dotenv';
import { dirname as pathDirname, join as pathJoin } from 'path';
import { fileURLToPath as fileUrl } from 'url';

const __mainFilename = fileUrl(import.meta.url);
const __mainDirname = pathDirname(__mainFilename);

// Load environment variables from .env.local (Next.js convention)
dotenv.config({ path: pathJoin(__mainDirname, '..', '.env.local') });
dotenv.config({ path: pathJoin(__mainDirname, '..', '.env') });
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

const SKIP_URL_VALIDATION = process.argv.includes('--skip-urls');
const VERBOSE = process.argv.includes('--verbose');

// ============================================================================
// HELPERS
// ============================================================================

function log(msg) {
  console.log(msg);
}

function logVerbose(msg) {
  if (VERBOSE) console.log(msg);
}

/**
 * Run a child script and capture output
 */
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath], {
      cwd: join(__dirname, '..'),
      stdio: 'pipe',
      env: process.env,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      const str = data.toString();
      stdout += str;
      if (VERBOSE) process.stdout.write(str);
    });

    child.stderr.on('data', (data) => {
      const str = data.toString();
      stderr += str;
      if (VERBOSE) process.stderr.write(str);
    });

    child.on('close', (code) => {
      resolve({
        exitCode: code,
        stdout,
        stderr,
      });
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Read a markdown file and extract key sections
 */
function readReportFile(filepath) {
  if (!existsSync(filepath)) {
    return null;
  }
  return readFileSync(filepath, 'utf-8');
}

/**
 * Get current date formatted for filename
 */
function getDateString() {
  const now = new Date();
  return now.toISOString().split('T')[0].replace(/-/g, '');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const startTime = Date.now();
  
  log('');
  log('╔══════════════════════════════════════════════════════════════════╗');
  log('║          COMPREHENSIVE EVENTS AUDIT - AutoRev                     ║');
  log('╚══════════════════════════════════════════════════════════════════╝');
  log('');
  
  if (SKIP_URL_VALIDATION) {
    log('⚠️  URL validation will be skipped (--skip-urls flag)');
    log('');
  }

  // Ensure docs directory exists
  if (!existsSync('docs')) {
    mkdirSync('docs');
  }

  const results = {
    mece: { exitCode: null, hasIssues: false },
    urls: { exitCode: null, hasIssues: false, skipped: SKIP_URL_VALIDATION },
    quality: { exitCode: null, hasIssues: false },
  };

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 1: MECE AUDIT
  // ══════════════════════════════════════════════════════════════════════════
  
  log('┌──────────────────────────────────────────────────────────────────┐');
  log('│  PHASE 1: MECE Audit (Duplicates & Categorization)               │');
  log('└──────────────────────────────────────────────────────────────────┘');
  log('');
  
  try {
    const meceResult = await runScript('scripts/audit-events-mece.js');
    results.mece.exitCode = meceResult.exitCode;
    results.mece.hasIssues = meceResult.exitCode !== 0;
    
    if (!VERBOSE) {
      // Extract summary from stdout
      const summaryMatch = meceResult.stdout.match(/SUMMARY[\s\S]*?$/m);
      if (summaryMatch) {
        log(summaryMatch[0]);
      }
    }
    
    log(results.mece.hasIssues 
      ? '⚠️  MECE audit found issues' 
      : '✅ MECE audit passed');
  } catch (err) {
    log(`❌ MECE audit failed to run: ${err.message}`);
    results.mece.exitCode = 1;
    results.mece.hasIssues = true;
  }
  
  log('');

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 2: URL VALIDATION
  // ══════════════════════════════════════════════════════════════════════════
  
  log('┌──────────────────────────────────────────────────────────────────┐');
  log('│  PHASE 2: URL Validation                                         │');
  log('└──────────────────────────────────────────────────────────────────┘');
  log('');
  
  if (SKIP_URL_VALIDATION) {
    log('⏭️  Skipped (--skip-urls flag)');
  } else {
    try {
      const urlResult = await runScript('scripts/validate-event-urls.js');
      results.urls.exitCode = urlResult.exitCode;
      results.urls.hasIssues = urlResult.exitCode !== 0;
      
      if (!VERBOSE) {
        // Extract summary from stdout
        const summaryMatch = urlResult.stdout.match(/SUMMARY[\s\S]*?(?=\n\n|$)/m);
        if (summaryMatch) {
          log(summaryMatch[0]);
        }
      }
      
      log(results.urls.hasIssues 
        ? '⚠️  URL validation found broken links' 
        : '✅ URL validation passed');
    } catch (err) {
      log(`❌ URL validation failed to run: ${err.message}`);
      results.urls.exitCode = 1;
      results.urls.hasIssues = true;
    }
  }
  
  log('');

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 3: DATA QUALITY
  // ══════════════════════════════════════════════════════════════════════════
  
  log('┌──────────────────────────────────────────────────────────────────┐');
  log('│  PHASE 3: Data Quality Audit                                     │');
  log('└──────────────────────────────────────────────────────────────────┘');
  log('');
  
  try {
    const qualityResult = await runScript('scripts/audit-events-quality.js');
    results.quality.exitCode = qualityResult.exitCode;
    results.quality.hasIssues = qualityResult.exitCode !== 0;
    
    if (!VERBOSE) {
      // Extract summary from stdout
      const summaryMatch = qualityResult.stdout.match(/SUMMARY[\s\S]*?$/m);
      if (summaryMatch) {
        log(summaryMatch[0]);
      }
    }
    
    log(results.quality.hasIssues 
      ? '⚠️  Data quality audit found issues' 
      : '✅ Data quality audit passed');
  } catch (err) {
    log(`❌ Data quality audit failed to run: ${err.message}`);
    results.quality.exitCode = 1;
    results.quality.hasIssues = true;
  }
  
  log('');

  // ══════════════════════════════════════════════════════════════════════════
  // GENERATE COMBINED REPORT
  // ══════════════════════════════════════════════════════════════════════════
  
  log('┌──────────────────────────────────────────────────────────────────┐');
  log('│  Generating Combined Report                                      │');
  log('└──────────────────────────────────────────────────────────────────┘');
  log('');

  const timestamp = new Date().toISOString();
  const dateStr = getDateString();
  const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);

  // Read individual reports
  const meceReport = readReportFile('docs/EVENTS_MECE_AUDIT.md');
  const urlReport = readReportFile('docs/EVENTS_URL_VALIDATION.md');
  const qualityReport = readReportFile('docs/EVENTS_QUALITY_AUDIT.md');

  // Build combined report
  let combinedReport = `# Comprehensive Events Audit Report

**Generated:** ${timestamp}
**Duration:** ${elapsedSeconds} seconds

---

## Executive Summary

| Audit | Status | Critical Issues |
|-------|--------|-----------------|
| MECE (Duplicates) | ${results.mece.hasIssues ? '⚠️ Issues Found' : '✅ Passed'} | ${results.mece.exitCode !== 0 ? 'Yes' : 'No'} |
| URL Validation | ${results.urls.skipped ? '⏭️ Skipped' : (results.urls.hasIssues ? '⚠️ Issues Found' : '✅ Passed')} | ${results.urls.hasIssues ? 'Yes' : 'No'} |
| Data Quality | ${results.quality.hasIssues ? '⚠️ Issues Found' : '✅ Passed'} | ${results.quality.exitCode !== 0 ? 'Yes' : 'No'} |

**Overall Result:** ${
    results.mece.hasIssues || results.urls.hasIssues || results.quality.hasIssues
      ? '🚨 **ACTION REQUIRED** - Critical issues found'
      : '✅ **ALL AUDITS PASSED** - No critical issues'
  }

---

# Individual Reports

`;

  if (meceReport) {
    combinedReport += `
---
---

${meceReport}

`;
  }

  if (urlReport && !SKIP_URL_VALIDATION) {
    combinedReport += `
---
---

${urlReport}

`;
  }

  if (qualityReport) {
    combinedReport += `
---
---

${qualityReport}

`;
  }

  combinedReport += `
---

_Combined report generated by audit-events-all.js_
_Run with --verbose for detailed output, --skip-urls to skip URL validation_
`;

  // Write combined report
  const outputPath = `docs/EVENTS_AUDIT_${dateStr}.md`;
  writeFileSync(outputPath, combinedReport);
  log(`✅ Combined report written to ${outputPath}`);

  // Also save as latest
  writeFileSync('docs/EVENTS_AUDIT_LATEST.md', combinedReport);
  log(`✅ Latest report saved to docs/EVENTS_AUDIT_LATEST.md`);

  // ══════════════════════════════════════════════════════════════════════════
  // FINAL SUMMARY
  // ══════════════════════════════════════════════════════════════════════════
  
  log('');
  log('╔══════════════════════════════════════════════════════════════════╗');
  log('║                      FINAL SUMMARY                                ║');
  log('╠══════════════════════════════════════════════════════════════════╣');
  log(`║  MECE Audit:      ${results.mece.hasIssues ? '⚠️  ISSUES FOUND' : '✅ PASSED'}                                ║`);
  log(`║  URL Validation:  ${results.urls.skipped ? '⏭️  SKIPPED' : (results.urls.hasIssues ? '⚠️  ISSUES FOUND' : '✅ PASSED')}                                ║`);
  log(`║  Data Quality:    ${results.quality.hasIssues ? '⚠️  ISSUES FOUND' : '✅ PASSED'}                                ║`);
  log('╠══════════════════════════════════════════════════════════════════╣');
  log(`║  Duration: ${elapsedSeconds}s                                                   ║`);
  log('╚══════════════════════════════════════════════════════════════════╝');
  log('');

  // Exit with appropriate code
  const hasCriticalIssues = results.mece.hasIssues || results.urls.hasIssues || results.quality.hasIssues;
  
  if (hasCriticalIssues) {
    log('🚨 Critical issues found. Review the reports for details.');
    process.exit(1);
  } else {
    log('✅ All audits passed. No critical issues found.');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('❌ Audit runner failed:', err.message);
  process.exit(1);
});

