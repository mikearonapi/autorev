#!/usr/bin/env node
/**
 * Data Quality Audit Script for Events
 * 
 * Checks for:
 * 1. Required field completeness
 * 2. Data quality rules (valid dates, locations, formatting)
 * 3. Relationship integrity (FKs exist)
 * 
 * @module scripts/audit-events-quality
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
// VALIDATION RULES
// ============================================================================

const VALID_REGIONS = ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West'];
const VALID_SCOPES = ['local', 'regional', 'national'];
const VALID_STATUSES = ['pending', 'approved', 'rejected', 'expired'];

const TEST_DATA_PATTERNS = [
  /^test/i,
  /^sample/i,
  /^example/i,
  /^asdf/i,
  /^foo/i,
  /^bar$/i,
  /^lorem/i,
  /^ipsum/i,
  /^xxx/i,
  /^placeholder/i,
  /^dummy/i,
];

const PLACEHOLDER_LOCATIONS = [
  'tbd', 'tba', 'unknown', 'n/a', 'na', 'none', 'test', 
  'xxx', 'placeholder', '...', '???'
];

// ============================================================================
// AUDIT FUNCTIONS
// ============================================================================

/**
 * Check required field completeness
 */
function auditRequiredFields(events) {
  const issues = [];
  
  for (const event of events) {
    const eventIssues = [];
    
    // name: NOT NULL, length > 0
    if (!event.name || event.name.trim().length === 0) {
      eventIssues.push({ field: 'name', issue: 'Empty or missing' });
    }
    
    // slug: NOT NULL, unique (handled by DB)
    if (!event.slug || event.slug.trim().length === 0) {
      eventIssues.push({ field: 'slug', issue: 'Empty or missing' });
    }
    
    // event_type_id: should have valid FK
    if (!event.event_type_id) {
      eventIssues.push({ field: 'event_type_id', issue: 'Missing category' });
    }
    
    // start_date: NOT NULL
    if (!event.start_date) {
      eventIssues.push({ field: 'start_date', issue: 'Missing start date' });
    }
    
    // city: NOT NULL
    if (!event.city || event.city.trim().length === 0) {
      eventIssues.push({ field: 'city', issue: 'Empty or missing' });
    }
    
    // scope: NOT NULL, valid enum
    if (!event.scope) {
      eventIssues.push({ field: 'scope', issue: 'Missing scope' });
    } else if (!VALID_SCOPES.includes(event.scope)) {
      eventIssues.push({ field: 'scope', issue: `Invalid value: ${event.scope}` });
    }
    
    // source_url: NOT NULL
    if (!event.source_url || event.source_url.trim().length === 0) {
      eventIssues.push({ field: 'source_url', issue: 'Empty or missing' });
    }
    
    if (eventIssues.length > 0) {
      issues.push({
        eventId: event.id,
        eventName: event.name || '(unnamed)',
        issues: eventIssues,
      });
    }
  }
  
  return issues;
}

/**
 * Check data quality rules
 */
function auditDataQuality(events) {
  const issues = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (const event of events) {
    const eventIssues = [];
    
    // Date validation
    if (event.start_date) {
      const startDate = new Date(event.start_date);
      
      // Check if past event (only for approved, non-historical)
      if (event.status === 'approved' && startDate < today) {
        eventIssues.push({
          field: 'start_date',
          issue: 'Past event still approved',
          value: event.start_date,
          severity: 'WARNING',
        });
      }
      
      // Check for unreasonable future dates
      const maxFutureDate = new Date();
      maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 3);
      if (startDate > maxFutureDate) {
        eventIssues.push({
          field: 'start_date',
          issue: 'Date too far in future (>3 years)',
          value: event.start_date,
          severity: 'ERROR',
        });
      }
      
      // Check for unreasonable past dates
      const minDate = new Date('2020-01-01');
      if (startDate < minDate) {
        eventIssues.push({
          field: 'start_date',
          issue: 'Date before 2020 (likely error)',
          value: event.start_date,
          severity: 'ERROR',
        });
      }
      
      // end_date validation
      if (event.end_date) {
        const endDate = new Date(event.end_date);
        if (endDate < startDate) {
          eventIssues.push({
            field: 'end_date',
            issue: 'End date before start date',
            value: event.end_date,
            severity: 'ERROR',
          });
        }
      }
    }
    
    // Location validation
    if (event.city) {
      const cityLower = event.city.toLowerCase().trim();
      if (PLACEHOLDER_LOCATIONS.includes(cityLower)) {
        eventIssues.push({
          field: 'city',
          issue: 'Placeholder value',
          value: event.city,
          severity: 'WARNING',
        });
      }
    }
    
    // Region validation
    if (event.region && !VALID_REGIONS.includes(event.region)) {
      eventIssues.push({
        field: 'region',
        issue: 'Invalid region value',
        value: event.region,
        severity: 'ERROR',
      });
    }
    
    // State validation (should be 2-letter code or null)
    if (event.state) {
      if (event.state.length !== 2) {
        eventIssues.push({
          field: 'state',
          issue: 'State should be 2-letter code',
          value: event.state,
          severity: 'WARNING',
        });
      }
    }
    
    // Name formatting
    if (event.name) {
      // Check ALL CAPS
      if (event.name === event.name.toUpperCase() && event.name.length > 5) {
        eventIssues.push({
          field: 'name',
          issue: 'ALL CAPS name',
          value: event.name,
          severity: 'WARNING',
        });
      }
      
      // Check all lowercase
      if (event.name === event.name.toLowerCase() && event.name.length > 10) {
        eventIssues.push({
          field: 'name',
          issue: 'all lowercase name',
          value: event.name,
          severity: 'WARNING',
        });
      }
      
      // Check for test data
      for (const pattern of TEST_DATA_PATTERNS) {
        if (pattern.test(event.name)) {
          eventIssues.push({
            field: 'name',
            issue: 'Looks like test data',
            value: event.name,
            severity: 'ERROR',
          });
          break;
        }
      }
    }
    
    // URL validation
    if (event.source_url) {
      try {
        const url = new URL(event.source_url);
        
        // Check for example.com
        if (url.hostname.includes('example.com')) {
          eventIssues.push({
            field: 'source_url',
            issue: 'Example.com placeholder URL',
            value: event.source_url,
            severity: 'ERROR',
          });
        }
        
        // Check for localhost
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          eventIssues.push({
            field: 'source_url',
            issue: 'Localhost URL',
            value: event.source_url,
            severity: 'ERROR',
          });
        }
      } catch {
        eventIssues.push({
          field: 'source_url',
          issue: 'Invalid URL format',
          value: event.source_url,
          severity: 'ERROR',
        });
      }
    }
    
    // Lat/lng validation
    if (event.latitude !== null && event.longitude !== null) {
      const lat = parseFloat(event.latitude);
      const lng = parseFloat(event.longitude);
      
      // Check for reasonable US coordinates
      if (lat < 18 || lat > 72 || lng < -180 || lng > -60) {
        // Allow for some international events
        if (event.country === 'USA') {
          eventIssues.push({
            field: 'coordinates',
            issue: 'Coordinates outside continental US',
            value: `${lat}, ${lng}`,
            severity: 'WARNING',
          });
        }
      }
      
      // Check for 0,0 coordinates (null island)
      if (lat === 0 && lng === 0) {
        eventIssues.push({
          field: 'coordinates',
          issue: 'Null Island coordinates (0,0)',
          value: `${lat}, ${lng}`,
          severity: 'ERROR',
        });
      }
    }
    
    // Cost consistency
    if (event.is_free === true && event.cost_text && !event.cost_text.toLowerCase().includes('free')) {
      eventIssues.push({
        field: 'cost',
        issue: 'is_free=true but cost_text doesn\'t say Free',
        value: event.cost_text,
        severity: 'WARNING',
      });
    }
    
    if (eventIssues.length > 0) {
      issues.push({
        eventId: event.id,
        eventName: event.name || '(unnamed)',
        issues: eventIssues,
      });
    }
  }
  
  return issues;
}

/**
 * Check relationship integrity
 */
async function auditRelationships(events) {
  const issues = [];
  
  // Get all valid event_type_ids
  const { data: types } = await supabase
    .from('event_types')
    .select('id');
  const validTypeIds = new Set(types?.map(t => t.id) || []);
  
  // Check each event's event_type_id
  for (const event of events) {
    if (event.event_type_id && !validTypeIds.has(event.event_type_id)) {
      issues.push({
        eventId: event.id,
        eventName: event.name,
        issue: 'Invalid event_type_id (FK not found)',
        field: 'event_type_id',
        value: event.event_type_id,
      });
    }
  }
  
  // Check car affinities for orphaned car_ids
  const { data: affinities } = await supabase
    .from('event_car_affinities')
    .select('id, event_id, car_id, brand')
    .not('car_id', 'is', null);
  
  if (affinities && affinities.length > 0) {
    // Get valid car_ids
    const { data: cars } = await supabase
      .from('cars')
      .select('id');
    const validCarIds = new Set(cars?.map(c => c.id) || []);
    
    for (const aff of affinities) {
      if (!validCarIds.has(aff.car_id)) {
        issues.push({
          table: 'event_car_affinities',
          id: aff.id,
          issue: 'Invalid car_id (FK not found)',
          field: 'car_id',
          value: aff.car_id,
        });
      }
    }
  }
  
  return issues;
}

/**
 * Generate summary statistics
 */
function generateStats(events) {
  const stats = {
    total: events.length,
    byStatus: {},
    byRegion: {},
    byScope: {},
    withCoordinates: 0,
    withImages: 0,
    freeEvents: 0,
    pastEvents: 0,
  };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (const event of events) {
    // By status
    const status = event.status || 'unknown';
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    
    // By region
    const region = event.region || 'unknown';
    stats.byRegion[region] = (stats.byRegion[region] || 0) + 1;
    
    // By scope
    const scope = event.scope || 'unknown';
    stats.byScope[scope] = (stats.byScope[scope] || 0) + 1;
    
    // With coordinates
    if (event.latitude && event.longitude) {
      stats.withCoordinates++;
    }
    
    // With images
    if (event.image_url) {
      stats.withImages++;
    }
    
    // Free events
    if (event.is_free) {
      stats.freeEvents++;
    }
    
    // Past events
    if (event.start_date) {
      const startDate = new Date(event.start_date);
      if (startDate < today) {
        stats.pastEvents++;
      }
    }
  }
  
  return stats;
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function fetchAllEvents() {
  console.log('📊 Fetching all events...');
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('name');

  if (error) {
    console.error('❌ Error fetching events:', error.message);
    process.exit(1);
  }

  console.log(`✅ Fetched ${data.length} events`);
  return data;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function generateReport(stats, requiredFieldIssues, qualityIssues, relationshipIssues) {
  const timestamp = new Date().toISOString();
  
  // Count severities
  let errorCount = 0;
  let warningCount = 0;
  
  for (const event of qualityIssues) {
    for (const issue of event.issues) {
      if (issue.severity === 'ERROR') errorCount++;
      if (issue.severity === 'WARNING') warningCount++;
    }
  }
  
  let report = `# Events Data Quality Report

**Generated:** ${timestamp}
**Script:** audit-events-quality.js

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Events | ${stats.total} |
| With Coordinates | ${stats.withCoordinates} (${((stats.withCoordinates/stats.total)*100).toFixed(1)}%) |
| With Images | ${stats.withImages} (${((stats.withImages/stats.total)*100).toFixed(1)}%) |
| Free Events | ${stats.freeEvents} |
| Past Events | ${stats.pastEvents} |

### By Status

| Status | Count |
|--------|-------|
${Object.entries(stats.byStatus).map(([k,v]) => `| ${k} | ${v} |`).join('\n')}

### By Region

| Region | Count |
|--------|-------|
${Object.entries(stats.byRegion).sort((a,b) => b[1]-a[1]).map(([k,v]) => `| ${k} | ${v} |`).join('\n')}

### By Scope

| Scope | Count |
|-------|-------|
${Object.entries(stats.byScope).sort((a,b) => b[1]-a[1]).map(([k,v]) => `| ${k} | ${v} |`).join('\n')}

---

## Data Quality Summary

| Category | Count |
|----------|-------|
| Events Missing Required Fields | ${requiredFieldIssues.length} |
| Events with Quality Issues | ${qualityIssues.length} |
| → Errors | ${errorCount} |
| → Warnings | ${warningCount} |
| Relationship Integrity Issues | ${relationshipIssues.length} |

---

`;

  // Required field issues
  report += `## Missing Required Fields

`;
  if (requiredFieldIssues.length > 0) {
    report += `| Event ID | Name | Missing Fields |\n`;
    report += `|----------|------|----------------|\n`;
    for (const event of requiredFieldIssues.slice(0, 50)) {
      const fields = event.issues.map(i => i.field).join(', ');
      const name = event.eventName.length > 35 ? event.eventName.slice(0, 35) + '...' : event.eventName;
      report += `| ${event.eventId.slice(0, 8)}... | ${name} | ${fields} |\n`;
    }
    if (requiredFieldIssues.length > 50) {
      report += `\n_...and ${requiredFieldIssues.length - 50} more_\n`;
    }
  } else {
    report += `✅ All events have required fields populated.\n`;
  }

  // Quality issues - Errors first
  report += `

---

## Quality Issues: ERRORS

`;
  const errorEvents = qualityIssues.filter(e => e.issues.some(i => i.severity === 'ERROR'));
  if (errorEvents.length > 0) {
    report += `| Event ID | Name | Field | Issue | Value |\n`;
    report += `|----------|------|-------|-------|-------|\n`;
    for (const event of errorEvents.slice(0, 50)) {
      for (const issue of event.issues.filter(i => i.severity === 'ERROR')) {
        const name = event.eventName.length > 25 ? event.eventName.slice(0, 25) + '...' : event.eventName;
        const value = String(issue.value || '').length > 30 ? String(issue.value).slice(0, 30) + '...' : (issue.value || 'N/A');
        report += `| ${event.eventId.slice(0, 8)}... | ${name} | ${issue.field} | ${issue.issue} | ${value} |\n`;
      }
    }
    if (errorEvents.length > 50) {
      report += `\n_...and ${errorEvents.length - 50} more events with errors_\n`;
    }
  } else {
    report += `✅ No critical data quality errors found.\n`;
  }

  // Quality issues - Warnings
  report += `

---

## Quality Issues: WARNINGS

`;
  const warningEvents = qualityIssues.filter(e => e.issues.some(i => i.severity === 'WARNING'));
  if (warningEvents.length > 0) {
    report += `| Event ID | Name | Field | Issue |\n`;
    report += `|----------|------|-------|-------|\n`;
    for (const event of warningEvents.slice(0, 30)) {
      for (const issue of event.issues.filter(i => i.severity === 'WARNING')) {
        const name = event.eventName.length > 30 ? event.eventName.slice(0, 30) + '...' : event.eventName;
        report += `| ${event.eventId.slice(0, 8)}... | ${name} | ${issue.field} | ${issue.issue} |\n`;
      }
    }
    if (warningEvents.length > 30) {
      report += `\n_...and ${warningEvents.length - 30} more events with warnings_\n`;
    }
  } else {
    report += `✅ No data quality warnings found.\n`;
  }

  // Relationship integrity
  report += `

---

## Relationship Integrity

`;
  if (relationshipIssues.length > 0) {
    report += `⚠️ Found ${relationshipIssues.length} broken relationships\n\n`;
    report += `| Table/ID | Field | Issue | Invalid Value |\n`;
    report += `|----------|-------|-------|---------------|\n`;
    for (const issue of relationshipIssues) {
      const id = issue.eventId || issue.id;
      const table = issue.table || 'events';
      report += `| ${table}/${id.slice(0, 8)}... | ${issue.field} | ${issue.issue} | ${issue.value.slice(0, 8)}... |\n`;
    }
  } else {
    report += `✅ All foreign key relationships are valid.\n`;
  }

  // Recommendations
  report += `

---

## Recommendations

`;
  
  if (errorCount > 0) {
    report += `### 🚨 Critical Fixes Required\n\n`;
    report += `1. Fix ${errorCount} data quality errors (invalid dates, URLs, test data)\n`;
    report += `2. Review events with invalid coordinates\n`;
    report += `3. Replace placeholder URLs\n\n`;
  }
  
  if (stats.pastEvents > 0 && stats.byStatus['approved'] > 0) {
    report += `### ⚠️ Maintenance Required\n\n`;
    report += `1. Mark ${stats.pastEvents} past events as 'expired'\n`;
  }
  
  if (stats.total - stats.withCoordinates > 10) {
    report += `### 📍 Data Enhancement\n\n`;
    report += `1. Geocode ${stats.total - stats.withCoordinates} events missing coordinates\n`;
  }
  
  if (warningCount > 0) {
    report += `### 📝 Nice to Have\n\n`;
    report += `1. Address ${warningCount} data quality warnings\n`;
    report += `2. Standardize event name capitalization\n`;
  }

  report += `
---

_End of Data Quality Report_
`;

  return report;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  DATA QUALITY AUDIT - AutoRev Events');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  try {
    // Fetch data
    const events = await fetchAllEvents();

    // Run audits
    console.log('🔍 Checking required field completeness...');
    const requiredFieldIssues = auditRequiredFields(events);
    console.log(`   Found ${requiredFieldIssues.length} events with missing fields`);

    console.log('🔍 Checking data quality rules...');
    const qualityIssues = auditDataQuality(events);
    console.log(`   Found ${qualityIssues.length} events with quality issues`);

    console.log('🔍 Checking relationship integrity...');
    const relationshipIssues = await auditRelationships(events);
    console.log(`   Found ${relationshipIssues.length} broken relationships`);

    console.log('📊 Generating statistics...');
    const stats = generateStats(events);

    // Generate report
    console.log('');
    console.log('📝 Generating report...');
    const report = generateReport(stats, requiredFieldIssues, qualityIssues, relationshipIssues);

    // Write to file
    const outputPath = 'docs/EVENTS_QUALITY_AUDIT.md';
    writeFileSync(outputPath, report);
    console.log(`✅ Report written to ${outputPath}`);

    // Console summary
    let errorCount = 0;
    for (const event of qualityIssues) {
      for (const issue of event.issues) {
        if (issue.severity === 'ERROR') errorCount++;
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  Total Events: ${stats.total}`);
    console.log(`  Missing Required Fields: ${requiredFieldIssues.length}`);
    console.log(`  Quality Errors: ${errorCount}`);
    console.log(`  Broken Relationships: ${relationshipIssues.length}`);
    console.log('');

    // Exit code
    const criticalIssues = requiredFieldIssues.length + errorCount + relationshipIssues.length;
    if (criticalIssues > 0) {
      console.log(`⚠️  Found ${criticalIssues} critical issues. See report for details.`);
      process.exit(1);
    } else {
      console.log('✅ No critical data quality issues found.');
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Audit failed:', err.message);
    process.exit(1);
  }
}

main();

