#!/usr/bin/env node
/**
 * MECE Audit Script for Events
 * 
 * Checks for:
 * 1. Cross-category duplicates (same event in multiple categories)
 * 2. Within-category duplicates (exact or near-duplicates)
 * 3. Potential miscategorizations based on name keywords
 * 
 * @module scripts/audit-events-mece
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
// CATEGORY KEYWORDS for miscategorization detection
// ============================================================================
const CATEGORY_KEYWORDS = {
  'cars-and-coffee': [
    'cars & coffee', 'cars and coffee', 'c&c', 'cars n coffee', 
    'coffee and cars', 'morning meetup', 'breakfast meetup'
  ],
  'track-day': [
    'hpde', 'track day', 'trackday', 'lapping', 'open track',
    'high performance driving', 'driver education', 'de event'
  ],
  'autocross': [
    'autocross', 'auto-x', 'autox', 'solo', 'solo ii', 'cone course',
    'parking lot', 'gymkhana', 'slalom'
  ],
  'car-show': [
    'concours', 'car show', 'auto show', 'display', 'show and shine',
    'judged', 'awards', 'best in show', 'peoples choice'
  ],
  'club-meetup': [
    'pca', 'bmw cca', 'mbca', 'chapter', 'club meeting', 'monthly meeting',
    'annual meeting', 'tech session', 'club event', 'owners club',
    'enthusiast gathering', 'ncm', 'ferrari club', 'lamborghini club'
  ],
  'auction': [
    'auction', 'mecum', 'barrett-jackson', 'rm sotheby', 'gooding',
    'bonhams', 'bring a trailer', 'bat', 'bid', 'lot', 'hammer'
  ],
  'industry': [
    'sema', 'pri', 'auto show', 'conference', 'summit', 'expo',
    'trade show', 'industry event', 'press day'
  ],
  'cruise': [
    'cruise', 'drive', 'rally', 'tour', 'road trip', 'canyon run',
    'scenic drive', 'poker run', 'gumball'
  ],
  'time-attack': [
    'time attack', 'global time attack', 'gta', 'super lap', 
    'time trial', 'timed session'
  ]
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const matrix = [];

  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[s2.length][s1.length];
}

/**
 * Normalize event name for comparison
 */
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if name contains category keywords
 */
function detectCategoryFromName(name) {
  const lowerName = name.toLowerCase();
  const detectedCategories = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerName.includes(keyword)) {
        detectedCategories.push({ category, keyword });
        break; // Only count each category once
      }
    }
  }

  return detectedCategories;
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toISOString().split('T')[0];
}

// ============================================================================
// MAIN AUDIT FUNCTIONS
// ============================================================================

async function fetchAllEvents() {
  console.log('📊 Fetching all events from database...');
  
  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      slug,
      name,
      start_date,
      city,
      state,
      source_url,
      event_type_id,
      event_types (
        slug,
        name,
        icon
      )
    `)
    .eq('status', 'approved')
    .order('name');

  if (error) {
    console.error('❌ Error fetching events:', error.message);
    process.exit(1);
  }

  console.log(`✅ Fetched ${data.length} events`);
  return data;
}

async function fetchEventTypes() {
  const { data, error } = await supabase
    .from('event_types')
    .select('id, slug, name, icon')
    .order('sort_order');

  if (error) {
    console.error('❌ Error fetching event types:', error.message);
    process.exit(1);
  }

  return data;
}

/**
 * Find cross-category duplicates
 */
function findCrossCategoryDuplicates(events) {
  const duplicates = [];
  const eventsByName = new Map();

  // Group events by normalized name
  for (const event of events) {
    const normalizedName = normalizeName(event.name);
    if (!eventsByName.has(normalizedName)) {
      eventsByName.set(normalizedName, []);
    }
    eventsByName.get(normalizedName).push(event);
  }

  // Check for same name in different categories
  for (const [name, eventGroup] of eventsByName) {
    if (eventGroup.length > 1) {
      const categories = new Set(eventGroup.map(e => e.event_types?.slug));
      if (categories.size > 1) {
        duplicates.push({
          type: 'exact_name_different_category',
          confidence: 'HIGH',
          events: eventGroup.map(e => ({
            id: e.id,
            name: e.name,
            category: e.event_types?.name || 'Unknown',
            categorySlug: e.event_types?.slug,
            date: formatDate(e.start_date),
            location: `${e.city}, ${e.state}`
          }))
        });
      }
    }
  }

  return duplicates;
}

/**
 * Find same URL across categories
 */
function findSameUrlDuplicates(events) {
  const duplicates = [];
  const eventsByUrl = new Map();

  // Group events by source_url
  for (const event of events) {
    if (!event.source_url) continue;
    const url = event.source_url.toLowerCase().replace(/\/$/, '');
    if (!eventsByUrl.has(url)) {
      eventsByUrl.set(url, []);
    }
    eventsByUrl.get(url).push(event);
  }

  // Check for same URL in different categories
  for (const [url, eventGroup] of eventsByUrl) {
    if (eventGroup.length > 1) {
      const categories = new Set(eventGroup.map(e => e.event_types?.slug));
      if (categories.size > 1) {
        duplicates.push({
          type: 'same_url_different_category',
          confidence: 'CRITICAL',
          url,
          events: eventGroup.map(e => ({
            id: e.id,
            name: e.name,
            category: e.event_types?.name || 'Unknown',
            categorySlug: e.event_types?.slug,
            date: formatDate(e.start_date),
            location: `${e.city}, ${e.state}`
          }))
        });
      }
    }
  }

  return duplicates;
}

/**
 * Find same date + location potential duplicates
 */
function findSameDateLocationDuplicates(events) {
  const duplicates = [];
  const eventsByDateLocation = new Map();

  // Group by date + city + state
  for (const event of events) {
    const key = `${event.start_date}|${(event.city || '').toLowerCase()}|${(event.state || '').toLowerCase()}`;
    if (!eventsByDateLocation.has(key)) {
      eventsByDateLocation.set(key, []);
    }
    eventsByDateLocation.get(key).push(event);
  }

  // Check for same date+location in different categories
  for (const [key, eventGroup] of eventsByDateLocation) {
    if (eventGroup.length > 1) {
      const categories = new Set(eventGroup.map(e => e.event_types?.slug));
      if (categories.size > 1) {
        // Calculate name similarity
        const names = eventGroup.map(e => normalizeName(e.name));
        let maxSimilarity = 0;
        for (let i = 0; i < names.length; i++) {
          for (let j = i + 1; j < names.length; j++) {
            const dist = levenshteinDistance(names[i], names[j]);
            const maxLen = Math.max(names[i].length, names[j].length);
            const similarity = 1 - (dist / maxLen);
            if (similarity > maxSimilarity) maxSimilarity = similarity;
          }
        }

        if (maxSimilarity > 0.5) { // Only flag if names are somewhat similar
          duplicates.push({
            type: 'same_date_location_different_category',
            confidence: maxSimilarity > 0.8 ? 'HIGH' : 'MEDIUM',
            events: eventGroup.map(e => ({
              id: e.id,
              name: e.name,
              category: e.event_types?.name || 'Unknown',
              categorySlug: e.event_types?.slug,
              date: formatDate(e.start_date),
              location: `${e.city}, ${e.state}`
            }))
          });
        }
      }
    }
  }

  return duplicates;
}

/**
 * Find within-category near-duplicates (fuzzy name match)
 */
function findWithinCategoryDuplicates(events) {
  const duplicates = [];
  const eventsByCategory = new Map();

  // Group by category
  for (const event of events) {
    const cat = event.event_types?.slug || 'unknown';
    if (!eventsByCategory.has(cat)) {
      eventsByCategory.set(cat, []);
    }
    eventsByCategory.get(cat).push(event);
  }

  // Check within each category
  for (const [category, categoryEvents] of eventsByCategory) {
    // Skip if too few events
    if (categoryEvents.length < 2) continue;

    // Check for fuzzy name matches (Levenshtein ≤ 3)
    for (let i = 0; i < categoryEvents.length; i++) {
      for (let j = i + 1; j < categoryEvents.length; j++) {
        const name1 = normalizeName(categoryEvents[i].name);
        const name2 = normalizeName(categoryEvents[j].name);
        
        // Skip if names are too different in length
        if (Math.abs(name1.length - name2.length) > 5) continue;
        
        const distance = levenshteinDistance(name1, name2);
        
        if (distance > 0 && distance <= 3) {
          duplicates.push({
            type: 'fuzzy_name_match',
            confidence: distance === 1 ? 'HIGH' : (distance === 2 ? 'MEDIUM' : 'LOW'),
            levenshteinDistance: distance,
            category,
            events: [
              {
                id: categoryEvents[i].id,
                name: categoryEvents[i].name,
                date: formatDate(categoryEvents[i].start_date),
                location: `${categoryEvents[i].city}, ${categoryEvents[i].state}`
              },
              {
                id: categoryEvents[j].id,
                name: categoryEvents[j].name,
                date: formatDate(categoryEvents[j].start_date),
                location: `${categoryEvents[j].city}, ${categoryEvents[j].state}`
              }
            ]
          });
        }
      }
    }
  }

  return duplicates;
}

/**
 * Find potential miscategorizations
 */
function findMiscategorizations(events) {
  const issues = [];

  for (const event of events) {
    const currentCategory = event.event_types?.slug;
    if (!currentCategory) continue;

    const detected = detectCategoryFromName(event.name);
    
    // Check if name suggests a different category
    for (const { category: suggestedCategory, keyword } of detected) {
      if (suggestedCategory !== currentCategory) {
        // Check if it's a significant mismatch
        // (some categories overlap, e.g., club-meetup events can be named "PCA Track Day")
        const isSignificantMismatch = !isRelatedCategory(currentCategory, suggestedCategory);
        
        if (isSignificantMismatch) {
          issues.push({
            eventId: event.id,
            eventName: event.name,
            currentCategory: event.event_types?.name || currentCategory,
            currentCategorySlug: currentCategory,
            suggestedCategory,
            matchedKeyword: keyword,
            severity: getSeverity(currentCategory, suggestedCategory)
          });
        }
      }
    }
  }

  return issues;
}

/**
 * Check if two categories are related (some overlap is expected)
 */
function isRelatedCategory(cat1, cat2) {
  const relatedGroups = [
    ['track-day', 'autocross', 'time-attack'], // All track events
    ['club-meetup', 'cars-and-coffee'], // Social events
    ['car-show', 'industry'], // Display events
  ];

  for (const group of relatedGroups) {
    if (group.includes(cat1) && group.includes(cat2)) {
      return true;
    }
  }

  return false;
}

/**
 * Get severity of miscategorization
 */
function getSeverity(current, suggested) {
  // High severity: completely different event types
  const highSeverityMismatches = [
    ['auction', 'track-day'],
    ['auction', 'autocross'],
    ['auction', 'cars-and-coffee'],
    ['industry', 'cars-and-coffee'],
    ['track-day', 'car-show'],
  ];

  for (const [a, b] of highSeverityMismatches) {
    if ((current === a && suggested === b) || (current === b && suggested === a)) {
      return 'HIGH';
    }
  }

  return 'MEDIUM';
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function generateReport(events, eventTypes, crossDupes, urlDupes, dateDupes, withinDupes, miscats) {
  const timestamp = new Date().toISOString();
  
  // Count events by category
  const categoryBreakdown = {};
  for (const type of eventTypes) {
    categoryBreakdown[type.name] = events.filter(e => e.event_types?.slug === type.slug).length;
  }

  // Summary stats
  const totalCrossDupes = crossDupes.length + urlDupes.length + dateDupes.length;
  const criticalIssues = urlDupes.length + crossDupes.filter(d => d.confidence === 'HIGH').length;

  let report = `# MECE Audit Report

**Generated:** ${timestamp}
**Script:** audit-events-mece.js

---

## Summary

| Metric | Value |
|--------|-------|
| Total Events | ${events.length} |
| Cross-Category Duplicates | ${totalCrossDupes} |
| Within-Category Near-Duplicates | ${withinDupes.length} |
| Potential Miscategorizations | ${miscats.length} |
| **Critical Issues** | **${criticalIssues}** |

### Events by Category

| Category | Count |
|----------|-------|
${Object.entries(categoryBreakdown).map(([cat, count]) => `| ${cat} | ${count} |`).join('\n')}

---

## Cross-Category Duplicates (CRITICAL)

`;

  if (urlDupes.length > 0) {
    report += `### Same URL in Different Categories (${urlDupes.length})\n\n`;
    report += `⚠️ **These events share the same URL but are in different categories - likely data entry errors**\n\n`;
    
    for (const dupe of urlDupes) {
      report += `**URL:** \`${dupe.url}\`\n`;
      report += `| Event ID | Name | Category | Date | Location |\n`;
      report += `|----------|------|----------|------|----------|\n`;
      for (const e of dupe.events) {
        report += `| ${e.id.slice(0, 8)}... | ${e.name} | ${e.category} | ${e.date} | ${e.location} |\n`;
      }
      report += '\n';
    }
  } else {
    report += `✅ No events share the same URL across different categories.\n\n`;
  }

  if (crossDupes.length > 0) {
    report += `### Same Name in Different Categories (${crossDupes.length})\n\n`;
    
    for (const dupe of crossDupes) {
      report += `**Confidence:** ${dupe.confidence}\n`;
      report += `| Event ID | Name | Category | Date | Location |\n`;
      report += `|----------|------|----------|------|----------|\n`;
      for (const e of dupe.events) {
        report += `| ${e.id.slice(0, 8)}... | ${e.name} | ${e.category} | ${e.date} | ${e.location} |\n`;
      }
      report += '\n';
    }
  } else {
    report += `✅ No events share the same name across different categories.\n\n`;
  }

  if (dateDupes.length > 0) {
    report += `### Same Date+Location in Different Categories (${dateDupes.length})\n\n`;
    report += `⚠️ **These events occur at the same time and place but are categorized differently**\n\n`;
    
    for (const dupe of dateDupes.slice(0, 10)) { // Limit to first 10
      report += `**Confidence:** ${dupe.confidence}\n`;
      report += `| Event ID | Name | Category | Date | Location |\n`;
      report += `|----------|------|----------|------|----------|\n`;
      for (const e of dupe.events) {
        report += `| ${e.id.slice(0, 8)}... | ${e.name} | ${e.category} | ${e.date} | ${e.location} |\n`;
      }
      report += '\n';
    }
    if (dateDupes.length > 10) {
      report += `_...and ${dateDupes.length - 10} more_\n\n`;
    }
  } else {
    report += `✅ No events at same date+location in different categories.\n\n`;
  }

  report += `---

## Potential Miscategorizations (REVIEW)

`;

  if (miscats.length > 0) {
    report += `| Event ID | Name | Current Category | Suggested | Keyword | Severity |\n`;
    report += `|----------|------|------------------|-----------|---------|----------|\n`;
    
    for (const issue of miscats.slice(0, 50)) { // Limit to first 50
      report += `| ${issue.eventId.slice(0, 8)}... | ${issue.eventName.slice(0, 40)} | ${issue.currentCategory} | ${issue.suggestedCategory} | "${issue.matchedKeyword}" | ${issue.severity} |\n`;
    }
    
    if (miscats.length > 50) {
      report += `\n_...and ${miscats.length - 50} more_\n`;
    }
  } else {
    report += `✅ No potential miscategorizations detected.\n`;
  }

  report += `

---

## Within-Category Near-Duplicates (INFO)

`;

  if (withinDupes.length > 0) {
    report += `ℹ️ **These are events with similar names in the same category - may be recurring events or true duplicates**\n\n`;
    
    const highConfidence = withinDupes.filter(d => d.confidence === 'HIGH');
    
    if (highConfidence.length > 0) {
      report += `### High Confidence (Levenshtein = 1)\n\n`;
      for (const dupe of highConfidence.slice(0, 20)) {
        report += `**Category:** ${dupe.category}\n`;
        report += `| Event ID | Name | Date | Location |\n`;
        report += `|----------|------|------|----------|\n`;
        for (const e of dupe.events) {
          report += `| ${e.id.slice(0, 8)}... | ${e.name} | ${e.date} | ${e.location} |\n`;
        }
        report += '\n';
      }
    }
    
    report += `\n**Total within-category near-duplicates:** ${withinDupes.length}\n`;
    report += `- High confidence: ${withinDupes.filter(d => d.confidence === 'HIGH').length}\n`;
    report += `- Medium confidence: ${withinDupes.filter(d => d.confidence === 'MEDIUM').length}\n`;
    report += `- Low confidence: ${withinDupes.filter(d => d.confidence === 'LOW').length}\n`;
  } else {
    report += `✅ No within-category near-duplicates detected.\n`;
  }

  report += `

---

## Recommendations

`;

  if (criticalIssues > 0) {
    report += `### 🚨 Critical Issues to Fix\n\n`;
    report += `1. Review and fix the ${urlDupes.length} events sharing URLs across categories\n`;
    report += `2. Review the ${crossDupes.length} events with identical names in different categories\n`;
  }

  if (miscats.length > 0) {
    report += `### ⚠️ Review Recommended\n\n`;
    report += `1. Check ${miscats.filter(m => m.severity === 'HIGH').length} high-severity miscategorizations\n`;
    report += `2. Consider reviewing ${miscats.filter(m => m.severity === 'MEDIUM').length} medium-severity miscategorizations\n`;
  }

  report += `
---

_End of MECE Audit Report_
`;

  return report;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  MECE AUDIT SCRIPT - AutoRev Events');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  try {
    // Fetch data
    const events = await fetchAllEvents();
    const eventTypes = await fetchEventTypes();

    // Run audits
    console.log('🔍 Checking for cross-category duplicates (exact name)...');
    const crossDupes = findCrossCategoryDuplicates(events);
    console.log(`   Found ${crossDupes.length} potential issues`);

    console.log('🔍 Checking for cross-category duplicates (same URL)...');
    const urlDupes = findSameUrlDuplicates(events);
    console.log(`   Found ${urlDupes.length} potential issues`);

    console.log('🔍 Checking for cross-category duplicates (same date+location)...');
    const dateDupes = findSameDateLocationDuplicates(events);
    console.log(`   Found ${dateDupes.length} potential issues`);

    console.log('🔍 Checking for within-category near-duplicates...');
    const withinDupes = findWithinCategoryDuplicates(events);
    console.log(`   Found ${withinDupes.length} potential issues`);

    console.log('🔍 Checking for potential miscategorizations...');
    const miscats = findMiscategorizations(events);
    console.log(`   Found ${miscats.length} potential issues`);

    // Generate report
    console.log('');
    console.log('📝 Generating report...');
    const report = generateReport(events, eventTypes, crossDupes, urlDupes, dateDupes, withinDupes, miscats);

    // Write to file
    const outputPath = 'docs/EVENTS_MECE_AUDIT.md';
    writeFileSync(outputPath, report);
    console.log(`✅ Report written to ${outputPath}`);

    // Console summary
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  Total Events: ${events.length}`);
    console.log(`  Cross-Category Duplicates: ${crossDupes.length + urlDupes.length + dateDupes.length}`);
    console.log(`  Within-Category Near-Duplicates: ${withinDupes.length}`);
    console.log(`  Potential Miscategorizations: ${miscats.length}`);
    console.log('');

    // Exit code
    const criticalIssues = urlDupes.length + crossDupes.filter(d => d.confidence === 'HIGH').length;
    if (criticalIssues > 0) {
      console.log(`⚠️  Found ${criticalIssues} critical issues. See report for details.`);
      process.exit(1);
    } else {
      console.log('✅ No critical MECE issues found.');
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Audit failed:', err.message);
    process.exit(1);
  }
}

main();

