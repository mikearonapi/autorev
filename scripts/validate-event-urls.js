#!/usr/bin/env node
/**
 * URL Validation Script for Events
 * 
 * Validates all event URLs by making HEAD requests.
 * Classifies results as: VALID, REDIRECT, BROKEN, TIMEOUT, BLOCKED
 * 
 * @module scripts/validate-event-urls
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local (Next.js convention)
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });
import { writeFileSync } from 'fs';

// Create service role client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  timeout: 5000,         // 5 second timeout
  maxRetries: 1,         // Retry once on timeout
  concurrency: 5,        // 5 concurrent requests
  retryDelay: 1000,      // 1 second delay between retries
  userAgent: 'AutoRev-URLChecker/1.0 (+https://autorev.app)',
};

// ============================================================================
// URL VALIDATION
// ============================================================================

/**
 * URL validation result types
 */
const ResultType = {
  VALID: 'VALID',           // 2xx response
  REDIRECT: 'REDIRECT',     // 3xx response
  BROKEN: 'BROKEN',         // 4xx/5xx response
  TIMEOUT: 'TIMEOUT',       // No response in time
  BLOCKED: 'BLOCKED',       // 403/captcha
  ERROR: 'ERROR',           // Network/other error
  INVALID: 'INVALID',       // Invalid URL format
};

/**
 * Validate a single URL
 */
async function validateUrl(url, retryCount = 0) {
  if (!url) {
    return { type: ResultType.INVALID, status: null, message: 'Empty URL' };
  }

  // Check URL format
  try {
    new URL(url);
  } catch {
    return { type: ResultType.INVALID, status: null, message: 'Invalid URL format' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': CONFIG.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'manual', // Don't follow redirects automatically
    });

    clearTimeout(timeoutId);
    const status = response.status;

    // Check for redirect
    if (status >= 300 && status < 400) {
      const location = response.headers.get('location');
      return {
        type: ResultType.REDIRECT,
        status,
        redirectUrl: location,
      };
    }

    // Check for success
    if (status >= 200 && status < 300) {
      return { type: ResultType.VALID, status };
    }

    // Check for blocked (403, 429)
    if (status === 403 || status === 429) {
      return { type: ResultType.BLOCKED, status };
    }

    // Check for broken (4xx/5xx)
    if (status >= 400) {
      return { type: ResultType.BROKEN, status };
    }

    return { type: ResultType.ERROR, status, message: 'Unexpected status' };

  } catch (err) {
    clearTimeout(timeoutId);

    // Handle abort (timeout)
    if (err.name === 'AbortError') {
      if (retryCount < CONFIG.maxRetries) {
        await sleep(CONFIG.retryDelay);
        return validateUrl(url, retryCount + 1);
      }
      return { type: ResultType.TIMEOUT, status: null };
    }

    // Some sites block HEAD, try GET as fallback
    if (err.cause?.code === 'ECONNREFUSED' || err.message.includes('fetch failed')) {
      try {
        const getResponse = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(CONFIG.timeout),
          headers: {
            'User-Agent': CONFIG.userAgent,
          },
        });
        
        if (getResponse.ok) {
          return { type: ResultType.VALID, status: getResponse.status };
        }
        return { type: ResultType.BROKEN, status: getResponse.status };
      } catch {
        // Fall through to error
      }
    }

    return {
      type: ResultType.ERROR,
      status: null,
      message: err.message || 'Unknown error',
    };
  }
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Process URLs with concurrency limit
 */
async function validateUrlsBatch(events, onProgress) {
  const results = [];
  const queue = [...events];
  let completed = 0;

  async function processNext() {
    while (queue.length > 0) {
      const event = queue.shift();
      const result = await validateUrl(event.source_url);
      results.push({
        event,
        result,
      });
      completed++;
      onProgress(completed, events.length);
    }
  }

  // Start concurrent workers
  const workers = [];
  for (let i = 0; i < CONFIG.concurrency; i++) {
    workers.push(processNext());
  }

  await Promise.all(workers);
  return results;
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function fetchEventsWithUrls() {
  console.log('📊 Fetching all events with URLs...');
  
  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      slug,
      name,
      source_url,
      event_types (
        slug,
        name
      )
    `)
    .eq('status', 'approved')
    .not('source_url', 'is', null)
    .order('name');

  if (error) {
    console.error('❌ Error fetching events:', error.message);
    process.exit(1);
  }

  console.log(`✅ Fetched ${data.length} events with URLs`);
  return data;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function generateReport(results) {
  const timestamp = new Date().toISOString();
  
  // Group by result type
  const byType = {
    [ResultType.VALID]: [],
    [ResultType.REDIRECT]: [],
    [ResultType.BROKEN]: [],
    [ResultType.TIMEOUT]: [],
    [ResultType.BLOCKED]: [],
    [ResultType.ERROR]: [],
    [ResultType.INVALID]: [],
  };

  for (const { event, result } of results) {
    byType[result.type].push({ event, result });
  }

  const total = results.length;
  const validCount = byType[ResultType.VALID].length;
  const redirectCount = byType[ResultType.REDIRECT].length;
  const brokenCount = byType[ResultType.BROKEN].length;
  const timeoutCount = byType[ResultType.TIMEOUT].length;
  const blockedCount = byType[ResultType.BLOCKED].length;
  const errorCount = byType[ResultType.ERROR].length + byType[ResultType.INVALID].length;

  let report = `# URL Validation Report

**Generated:** ${timestamp}
**Script:** validate-event-urls.js

---

## Summary

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Valid | ${validCount} | ${((validCount/total)*100).toFixed(1)}% |
| ↪️ Redirect | ${redirectCount} | ${((redirectCount/total)*100).toFixed(1)}% |
| ❌ Broken | ${brokenCount} | ${((brokenCount/total)*100).toFixed(1)}% |
| ⏱️ Timeout | ${timeoutCount} | ${((timeoutCount/total)*100).toFixed(1)}% |
| 🔒 Blocked | ${blockedCount} | ${((blockedCount/total)*100).toFixed(1)}% |
| ⚠️ Error | ${errorCount} | ${((errorCount/total)*100).toFixed(1)}% |
| **Total** | **${total}** | 100% |

---

`;

  // Broken URLs (ACTION REQUIRED)
  report += `## Broken URLs (ACTION REQUIRED)

`;
  if (brokenCount > 0) {
    report += `| Event ID | Name | Category | URL | Status |\n`;
    report += `|----------|------|----------|-----|--------|\n`;
    for (const { event, result } of byType[ResultType.BROKEN]) {
      const name = event.name.length > 40 ? event.name.slice(0, 40) + '...' : event.name;
      const url = event.source_url.length > 50 ? event.source_url.slice(0, 50) + '...' : event.source_url;
      report += `| ${event.id.slice(0, 8)}... | ${name} | ${event.event_types?.name || 'N/A'} | ${url} | ${result.status} |\n`;
    }
  } else {
    report += `✅ No broken URLs found.\n`;
  }

  // Redirects (REVIEW)
  report += `

---

## Redirects (REVIEW)

`;
  if (redirectCount > 0) {
    report += `| Event ID | Original URL | Redirect Status | Destination |\n`;
    report += `|----------|--------------|-----------------|-------------|\n`;
    for (const { event, result } of byType[ResultType.REDIRECT].slice(0, 50)) {
      const originalUrl = event.source_url.length > 40 ? event.source_url.slice(0, 40) + '...' : event.source_url;
      const destUrl = result.redirectUrl ? (result.redirectUrl.length > 40 ? result.redirectUrl.slice(0, 40) + '...' : result.redirectUrl) : 'N/A';
      report += `| ${event.id.slice(0, 8)}... | ${originalUrl} | ${result.status} | ${destUrl} |\n`;
    }
    if (redirectCount > 50) {
      report += `\n_...and ${redirectCount - 50} more_\n`;
    }
  } else {
    report += `✅ No redirects found.\n`;
  }

  // Timeouts (MANUAL CHECK)
  report += `

---

## Timeouts (MANUAL CHECK)

`;
  if (timeoutCount > 0) {
    report += `⚠️ These URLs did not respond within ${CONFIG.timeout/1000} seconds (after ${CONFIG.maxRetries + 1} attempts)\n\n`;
    report += `| Event ID | Name | URL |\n`;
    report += `|----------|------|-----|\n`;
    for (const { event } of byType[ResultType.TIMEOUT]) {
      const name = event.name.length > 40 ? event.name.slice(0, 40) + '...' : event.name;
      const url = event.source_url.length > 60 ? event.source_url.slice(0, 60) + '...' : event.source_url;
      report += `| ${event.id.slice(0, 8)}... | ${name} | ${url} |\n`;
    }
  } else {
    report += `✅ No timeouts encountered.\n`;
  }

  // Blocked (MANUAL CHECK)
  report += `

---

## Blocked/Rate Limited (MANUAL CHECK)

`;
  if (blockedCount > 0) {
    report += `⚠️ These URLs returned 403 Forbidden or 429 Too Many Requests\n\n`;
    report += `| Event ID | Name | URL | Status |\n`;
    report += `|----------|------|-----|--------|\n`;
    for (const { event, result } of byType[ResultType.BLOCKED]) {
      const name = event.name.length > 40 ? event.name.slice(0, 40) + '...' : event.name;
      const url = event.source_url.length > 50 ? event.source_url.slice(0, 50) + '...' : event.source_url;
      report += `| ${event.id.slice(0, 8)}... | ${name} | ${url} | ${result.status} |\n`;
    }
  } else {
    report += `✅ No blocked URLs encountered.\n`;
  }

  // Errors
  report += `

---

## Errors

`;
  const allErrors = [...byType[ResultType.ERROR], ...byType[ResultType.INVALID]];
  if (allErrors.length > 0) {
    report += `| Event ID | Name | URL | Error |\n`;
    report += `|----------|------|-----|-------|\n`;
    for (const { event, result } of allErrors) {
      const name = event.name.length > 35 ? event.name.slice(0, 35) + '...' : event.name;
      const url = event.source_url?.length > 40 ? event.source_url.slice(0, 40) + '...' : (event.source_url || 'N/A');
      report += `| ${event.id.slice(0, 8)}... | ${name} | ${url} | ${result.message || 'Unknown'} |\n`;
    }
  } else {
    report += `✅ No errors encountered.\n`;
  }

  // Valid URLs summary
  report += `

---

## Valid URLs

✅ ${validCount} URLs returned 2xx status codes.

`;

  // Unique domains
  const domains = new Set();
  for (const { event } of byType[ResultType.VALID]) {
    try {
      const domain = new URL(event.source_url).hostname;
      domains.add(domain);
    } catch {
      // Skip invalid URLs
    }
  }
  
  report += `### Unique Valid Domains (${domains.size})

\`\`\`
${[...domains].sort().slice(0, 30).join('\n')}
${domains.size > 30 ? `\n...and ${domains.size - 30} more` : ''}
\`\`\`

---

_End of URL Validation Report_
`;

  return report;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  URL VALIDATION SCRIPT - AutoRev Events');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`Config: ${CONFIG.concurrency} concurrent requests, ${CONFIG.timeout/1000}s timeout, ${CONFIG.maxRetries} retries`);
  console.log('');

  try {
    // Fetch data
    const events = await fetchEventsWithUrls();

    // Validate URLs
    console.log('');
    console.log('🔗 Validating URLs...');
    const startTime = Date.now();
    
    const results = await validateUrlsBatch(events, (completed, total) => {
      const percent = ((completed / total) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      process.stdout.write(`\r   Progress: ${completed}/${total} (${percent}%) - ${elapsed}s elapsed`);
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('');
    console.log(`✅ Validated ${results.length} URLs in ${elapsed}s`);

    // Generate report
    console.log('');
    console.log('📝 Generating report...');
    const report = generateReport(results);

    // Write to file
    const outputPath = 'docs/EVENTS_URL_VALIDATION.md';
    writeFileSync(outputPath, report);
    console.log(`✅ Report written to ${outputPath}`);

    // Console summary
    const broken = results.filter(r => r.result.type === ResultType.BROKEN).length;
    const valid = results.filter(r => r.result.type === ResultType.VALID).length;
    const redirects = results.filter(r => r.result.type === ResultType.REDIRECT).length;
    const timeouts = results.filter(r => r.result.type === ResultType.TIMEOUT).length;
    const blocked = results.filter(r => r.result.type === ResultType.BLOCKED).length;

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  Total URLs: ${results.length}`);
    console.log(`  ✅ Valid: ${valid} (${((valid/results.length)*100).toFixed(1)}%)`);
    console.log(`  ↪️ Redirects: ${redirects}`);
    console.log(`  ❌ Broken: ${broken}`);
    console.log(`  ⏱️ Timeouts: ${timeouts}`);
    console.log(`  🔒 Blocked: ${blocked}`);
    console.log('');

    // Exit code
    if (broken > 0) {
      console.log(`⚠️  Found ${broken} broken URLs. See report for details.`);
      process.exit(1);
    } else {
      console.log('✅ No broken URLs found.');
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Validation failed:', err.message);
    process.exit(1);
  }
}

main();

