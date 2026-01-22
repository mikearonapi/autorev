#!/usr/bin/env node
/**
 * Daily Data Quality Check
 *
 * Automated script to run daily validation of data integrity across the database.
 * Checks for orphaned foreign keys, missing car_id linkages, and data anomalies.
 * 
 * Designed to run as a cron job:
 *   0 6 * * * node /path/to/scripts/cron/data-quality-check.mjs >> /var/log/autorev-dq.log 2>&1
 *
 * Options:
 *   --alert        Send alerts for critical issues (requires ALERT_WEBHOOK_URL)
 *   --verbose      Show detailed output
 *   --threshold N  Alert threshold for orphaned records (default: 10)
 *
 * @module scripts/cron/data-quality-check
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const alertWebhookUrl = process.env.ALERT_WEBHOOK_URL;

if (!supabaseUrl || !serviceKey) {
  console.error('[DQ-CHECK] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// ============================================================================
// CONFIGURATION
// ============================================================================

const args = process.argv.slice(2);
const ALERT_ENABLED = args.includes('--alert') && alertWebhookUrl;
const VERBOSE = args.includes('--verbose');
const thresholdIdx = args.indexOf('--threshold');
const ALERT_THRESHOLD = thresholdIdx !== -1 ? parseInt(args[thresholdIdx + 1], 10) : 10;

const TABLES_TO_CHECK = [
  { 
    name: 'car_track_lap_times', 
    carIdColumn: 'car_id',
    critical: true,
  },
  { 
    name: 'car_dyno_runs', 
    carIdColumn: 'car_id',
    critical: true,
  },
  { 
    name: 'community_insights', 
    carIdColumn: 'car_id',
    activeFilter: { column: 'is_active', value: true },
    critical: false,
  },
  { 
    name: 'youtube_video_car_links', 
    carIdColumn: 'car_id',
    critical: false,
  },
  { 
    name: 'part_fitments', 
    carIdColumn: 'car_id',
    critical: true,
  },
  { 
    name: 'car_tuning_profiles', 
    carIdColumn: 'car_id',
    critical: false,
  },
];

// ============================================================================
// CHECKS
// ============================================================================

/**
 * Check for missing car_id linkages in a table
 */
async function checkCarIdLinkage(tableConfig) {
  const { name, carIdColumn, activeFilter, critical } = tableConfig;
  
  let query = supabase.from(name).select('id', { count: 'exact', head: false });
  
  if (activeFilter) {
    query = query.eq(activeFilter.column, activeFilter.value);
  }
  
  // Get total count
  const { count: total, error: totalError } = await query;
  if (totalError) {
    return { name, error: totalError.message };
  }
  
  // Get count with null car_id
  let orphanQuery = supabase.from(name).select('id', { count: 'exact', head: true }).is(carIdColumn, null);
  if (activeFilter) {
    orphanQuery = orphanQuery.eq(activeFilter.column, activeFilter.value);
  }
  
  const { count: orphaned, error: orphanError } = await orphanQuery;
  if (orphanError) {
    return { name, error: orphanError.message };
  }
  
  return {
    name,
    total,
    linked: total - orphaned,
    orphaned,
    linkedPercent: total > 0 ? Math.round(((total - orphaned) / total) * 100) : 100,
    critical,
  };
}

/**
 * Check for orphaned track_id references in lap times
 */
async function checkTrackReferences() {
  const { data, error } = await supabase.rpc('check_orphaned_track_refs').catch(() => {
    // Fallback if RPC doesn't exist
    return { data: null, error: { message: 'RPC not available' } };
  });
  
  if (error || !data) {
    // Manual check
    const { data: lapTimes, error: ltError } = await supabase
      .from('car_track_lap_times')
      .select('track_id')
      .not('track_id', 'is', null);
    
    if (ltError) return { orphaned: 0, error: ltError.message };
    
    const uniqueTrackIds = [...new Set(lapTimes.map(lt => lt.track_id))];
    
    const { data: tracks, error: trackError } = await supabase
      .from('tracks')
      .select('id')
      .in('id', uniqueTrackIds.slice(0, 1000)); // Limit for performance
    
    if (trackError) return { orphaned: 0, error: trackError.message };
    
    const validTrackIds = new Set(tracks.map(t => t.id));
    const orphaned = uniqueTrackIds.filter(id => !validTrackIds.has(id)).length;
    
    return { orphaned };
  }
  
  return { orphaned: data.orphaned_count || 0 };
}

/**
 * Check parts category distribution
 */
async function checkPartCategories() {
  const { data, error } = await supabase
    .from('parts')
    .select('category')
    .eq('is_active', true);
  
  if (error) return { error: error.message };
  
  const counts = {};
  data.forEach(p => {
    counts[p.category] = (counts[p.category] || 0) + 1;
  });
  
  const otherCount = counts['other'] || 0;
  const totalParts = data.length;
  const otherPercent = totalParts > 0 ? Math.round((otherCount / totalParts) * 100) : 0;
  
  return {
    totalParts,
    otherCount,
    otherPercent,
    categories: Object.entries(counts).sort((a, b) => b[1] - a[1]),
  };
}

/**
 * Check upgrade_key_parts linkages
 */
async function checkUpgradeKeyParts() {
  const { count, error } = await supabase
    .from('upgrade_key_parts')
    .select('id', { count: 'exact', head: true });
  
  return { count: count || 0, error: error?.message };
}

// ============================================================================
// ALERTING
// ============================================================================

async function sendAlert(issues) {
  if (!ALERT_ENABLED || issues.length === 0) return;
  
  const message = {
    text: `🚨 AutoRev Data Quality Alert`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🚨 Data Quality Issues Detected' }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: issues.map(i => `• *${i.table}*: ${i.message} (${i.count} affected)`).join('\n')
        }
      },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: `Run at: ${new Date().toISOString()}` }
        ]
      }
    ]
  };
  
  try {
    await fetch(alertWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    console.log('[DQ-CHECK] Alert sent successfully');
  } catch (err) {
    console.error('[DQ-CHECK] Failed to send alert:', err.message);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const startTime = Date.now();
  console.log('='.repeat(60));
  console.log(`[DQ-CHECK] Daily Data Quality Check - ${new Date().toISOString()}`);
  console.log('='.repeat(60));
  console.log('');
  
  const results = {
    tableHealth: [],
    issues: [],
    warnings: [],
  };
  
  // Check car_id linkages
  console.log('[DQ-CHECK] Checking table linkages...');
  for (const tableConfig of TABLES_TO_CHECK) {
    const result = await checkCarIdLinkage(tableConfig);
    results.tableHealth.push(result);
    
    if (result.error) {
      results.warnings.push({ table: tableConfig.name, message: result.error });
      continue;
    }
    
    const status = result.linkedPercent >= 95 ? '✓' : result.linkedPercent >= 80 ? '⚠' : '✗';
    if (VERBOSE || result.linkedPercent < 95) {
      console.log(`  ${status} ${result.name}: ${result.linkedPercent}% linked (${result.orphaned} orphaned)`);
    }
    
    if (result.orphaned > ALERT_THRESHOLD && result.critical) {
      results.issues.push({
        table: result.name,
        message: `${result.orphaned} records missing car_id`,
        count: result.orphaned,
        severity: 'high',
      });
    }
  }
  console.log('');
  
  // Check track references
  console.log('[DQ-CHECK] Checking track references...');
  const trackResult = await checkTrackReferences();
  if (trackResult.orphaned > 0) {
    console.log(`  ✗ ${trackResult.orphaned} lap times with invalid track_id`);
    results.issues.push({
      table: 'car_track_lap_times',
      message: 'Lap times with invalid track_id references',
      count: trackResult.orphaned,
      severity: 'critical',
    });
  } else {
    console.log('  ✓ All track references valid');
  }
  console.log('');
  
  // Check part categories
  console.log('[DQ-CHECK] Checking part categories...');
  const partResult = await checkPartCategories();
  if (!partResult.error) {
    console.log(`  Total parts: ${partResult.totalParts}`);
    console.log(`  "Other" category: ${partResult.otherCount} (${partResult.otherPercent}%)`);
    
    if (partResult.otherPercent > 30) {
      results.warnings.push({
        table: 'parts',
        message: `${partResult.otherPercent}% of parts in "other" category`,
      });
    }
  }
  console.log('');
  
  // Check upgrade_key_parts
  console.log('[DQ-CHECK] Checking upgrade_key_parts...');
  const upgradeResult = await checkUpgradeKeyParts();
  if (!upgradeResult.error) {
    const status = upgradeResult.count >= 500 ? '✓' : '⚠';
    console.log(`  ${status} upgrade_key_parts: ${upgradeResult.count} rows`);
    
    if (upgradeResult.count < 100) {
      results.issues.push({
        table: 'upgrade_key_parts',
        message: 'Table nearly empty - Tuning Shop parts recommendations broken',
        count: upgradeResult.count,
        severity: 'high',
      });
    }
  }
  console.log('');
  
  // Summary
  const duration = Date.now() - startTime;
  console.log('='.repeat(60));
  console.log('[DQ-CHECK] Summary');
  console.log('='.repeat(60));
  console.log(`  Duration: ${duration}ms`);
  console.log(`  Issues found: ${results.issues.length}`);
  console.log(`  Warnings: ${results.warnings.length}`);
  
  if (results.issues.length > 0) {
    console.log('');
    console.log('  Critical Issues:');
    results.issues.forEach(i => {
      console.log(`    - ${i.table}: ${i.message}`);
    });
  }
  
  // Send alerts
  if (results.issues.length > 0) {
    await sendAlert(results.issues);
  }
  
  console.log('');
  console.log(`[DQ-CHECK] Complete at ${new Date().toISOString()}`);
  
  // Exit with error code if critical issues found
  if (results.issues.some(i => i.severity === 'critical')) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('[DQ-CHECK] Fatal error:', err);
  process.exit(1);
});
