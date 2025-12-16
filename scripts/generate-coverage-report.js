#!/usr/bin/env node

/**
 * Coverage Report Generator
 * 
 * Generates detailed reports on event coverage across the top 500 US cities.
 * Outputs to console and optionally to JSON/CSV files.
 * 
 * Usage:
 *   node scripts/generate-coverage-report.js [--json] [--csv] [--update]
 * 
 * Options:
 *   --json    Output detailed JSON report to reports/coverage-report.json
 *   --csv     Output CSV report to reports/coverage-report.csv
 *   --update  Update coverage stats in database before generating report
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse arguments
const args = process.argv.slice(2);
const outputJson = args.includes('--json');
const outputCsv = args.includes('--csv');
const updateStats = args.includes('--update');

async function updateCoverageStats() {
  console.log('📊 Updating coverage stats...');
  const { data, error } = await supabase.rpc('update_all_city_coverage_stats');
  if (error) {
    console.error('Failed to update stats:', error.message);
    return false;
  }
  console.log(`✅ Updated stats for ${data} cities`);
  return true;
}

async function getRegionSummary() {
  const { data, error } = await supabase
    .from('target_cities')
    .select('region, has_cnc_coverage, total_event_count, cnc_event_count');

  if (error) {
    console.error('Error fetching region data:', error);
    return [];
  }

  // Aggregate by region
  const regionMap = {};
  for (const city of data) {
    const region = city.region || 'Unknown';
    if (!regionMap[region]) {
      regionMap[region] = {
        region,
        total_cities: 0,
        cities_with_cnc: 0,
        cities_with_any_event: 0,
        total_cnc_events: 0,
        total_events: 0,
      };
    }
    regionMap[region].total_cities++;
    if (city.has_cnc_coverage) regionMap[region].cities_with_cnc++;
    if (city.total_event_count > 0) regionMap[region].cities_with_any_event++;
    regionMap[region].total_cnc_events += city.cnc_event_count || 0;
    regionMap[region].total_events += city.total_event_count || 0;
  }

  return Object.values(regionMap).map(r => ({
    ...r,
    cnc_coverage_pct: ((r.cities_with_cnc / r.total_cities) * 100).toFixed(1),
    any_event_coverage_pct: ((r.cities_with_any_event / r.total_cities) * 100).toFixed(1),
  }));
}

async function getTierSummary() {
  const { data, error } = await supabase
    .from('target_cities')
    .select('priority_tier, has_cnc_coverage, total_event_count');

  if (error) {
    console.error('Error fetching tier data:', error);
    return [];
  }

  const tierNames = {
    1: 'Tier 1 (Top 50)',
    2: 'Tier 2 (51-100)',
    3: 'Tier 3 (101-250)',
    4: 'Tier 4 (251-500)',
  };

  const tierMap = {};
  for (const city of data) {
    const tier = city.priority_tier || 4;
    if (!tierMap[tier]) {
      tierMap[tier] = {
        tier,
        tier_name: tierNames[tier],
        total_cities: 0,
        cities_with_cnc: 0,
        cities_with_any_event: 0,
      };
    }
    tierMap[tier].total_cities++;
    if (city.has_cnc_coverage) tierMap[tier].cities_with_cnc++;
    if (city.total_event_count > 0) tierMap[tier].cities_with_any_event++;
  }

  return Object.values(tierMap).map(t => ({
    ...t,
    cnc_coverage_pct: ((t.cities_with_cnc / t.total_cities) * 100).toFixed(1),
    any_event_coverage_pct: ((t.cities_with_any_event / t.total_cities) * 100).toFixed(1),
  })).sort((a, b) => a.tier - b.tier);
}

async function getCitiesNeedingCoverage() {
  const { data, error } = await supabase
    .from('target_cities')
    .select('*')
    .eq('has_cnc_coverage', false)
    .order('population_rank', { ascending: true })
    .limit(100);

  if (error) {
    console.error('Error fetching cities needing coverage:', error);
    return [];
  }

  return data;
}

async function getCitiesWithPartialCoverage() {
  const { data, error } = await supabase
    .from('target_cities')
    .select('*')
    .eq('has_cnc_coverage', true)
    .lte('total_event_count', 4)
    .order('population_rank', { ascending: true })
    .limit(50);

  if (error) {
    console.error('Error fetching partial coverage cities:', error);
    return [];
  }

  return data;
}

async function getAllCities() {
  const { data, error } = await supabase
    .from('target_cities')
    .select('*')
    .order('population_rank', { ascending: true });

  if (error) {
    console.error('Error fetching all cities:', error);
    return [];
  }

  return data;
}

function printTable(data, columns) {
  if (!data.length) return;

  // Calculate column widths
  const widths = {};
  for (const col of columns) {
    widths[col.key] = Math.max(
      col.label.length,
      ...data.map(row => String(row[col.key] || '').length)
    );
  }

  // Print header
  const header = columns.map(c => c.label.padEnd(widths[c.key])).join(' | ');
  console.log(header);
  console.log('-'.repeat(header.length));

  // Print rows
  for (const row of data) {
    const line = columns.map(c => {
      const val = String(row[c.key] ?? '');
      return c.align === 'right' ? val.padStart(widths[c.key]) : val.padEnd(widths[c.key]);
    }).join(' | ');
    console.log(line);
  }
  console.log();
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('       AUTOREV EVENT COVERAGE REPORT');
  console.log(`       Generated: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Optionally update stats first
  if (updateStats) {
    await updateCoverageStats();
    console.log();
  }

  // Region Summary
  console.log('📍 COVERAGE BY REGION');
  console.log('─────────────────────────────────────────────────────────────────');
  const regionSummary = await getRegionSummary();
  printTable(regionSummary.sort((a, b) => a.region.localeCompare(b.region)), [
    { key: 'region', label: 'Region' },
    { key: 'total_cities', label: 'Cities', align: 'right' },
    { key: 'cities_with_cnc', label: 'With C&C', align: 'right' },
    { key: 'cnc_coverage_pct', label: 'C&C %', align: 'right' },
    { key: 'cities_with_any_event', label: 'Any Events', align: 'right' },
    { key: 'any_event_coverage_pct', label: 'Coverage %', align: 'right' },
    { key: 'total_cnc_events', label: 'Total C&C', align: 'right' },
    { key: 'total_events', label: 'Total Events', align: 'right' },
  ]);

  // Tier Summary
  console.log('🏆 COVERAGE BY PRIORITY TIER');
  console.log('─────────────────────────────────────────────────────────────────');
  const tierSummary = await getTierSummary();
  printTable(tierSummary, [
    { key: 'tier_name', label: 'Tier' },
    { key: 'total_cities', label: 'Cities', align: 'right' },
    { key: 'cities_with_cnc', label: 'With C&C', align: 'right' },
    { key: 'cnc_coverage_pct', label: 'C&C %', align: 'right' },
    { key: 'cities_with_any_event', label: 'Any Events', align: 'right' },
    { key: 'any_event_coverage_pct', label: 'Coverage %', align: 'right' },
  ]);

  // Cities Needing Coverage (Priority Targets)
  console.log('🎯 TOP PRIORITY: CITIES WITHOUT CARS & COFFEE COVERAGE');
  console.log('─────────────────────────────────────────────────────────────────');
  const citiesNeedingCoverage = await getCitiesNeedingCoverage();
  const tier1Missing = citiesNeedingCoverage.filter(c => c.priority_tier === 1);
  const tier2Missing = citiesNeedingCoverage.filter(c => c.priority_tier === 2);

  if (tier1Missing.length > 0) {
    console.log('\n🔴 TIER 1 (Top 50 cities) - CRITICAL:');
    printTable(tier1Missing, [
      { key: 'population_rank', label: 'Rank', align: 'right' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'ST' },
      { key: 'region', label: 'Region' },
      { key: 'population', label: 'Population', align: 'right' },
      { key: 'total_event_count', label: 'Events', align: 'right' },
    ]);
  }

  if (tier2Missing.length > 0) {
    console.log('🟠 TIER 2 (51-100 cities) - HIGH:');
    printTable(tier2Missing, [
      { key: 'population_rank', label: 'Rank', align: 'right' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'ST' },
      { key: 'region', label: 'Region' },
      { key: 'population', label: 'Population', align: 'right' },
      { key: 'total_event_count', label: 'Events', align: 'right' },
    ]);
  }

  // Cities with Partial Coverage
  console.log('🟡 CITIES WITH PARTIAL COVERAGE (Need More Events)');
  console.log('─────────────────────────────────────────────────────────────────');
  const partialCoverage = await getCitiesWithPartialCoverage();
  const tier12Partial = partialCoverage.filter(c => c.priority_tier <= 2);
  if (tier12Partial.length > 0) {
    printTable(tier12Partial.slice(0, 20), [
      { key: 'population_rank', label: 'Rank', align: 'right' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'ST' },
      { key: 'region', label: 'Region' },
      { key: 'cnc_event_count', label: 'C&C', align: 'right' },
      { key: 'total_event_count', label: 'Total', align: 'right' },
    ]);
  }

  // Overall Summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📈 OVERALL SUMMARY');
  console.log('───────────────────────────────────────────────────────────────');
  
  const allCities = await getAllCities();
  const totalCities = allCities.length;
  const citiesWithCnc = allCities.filter(c => c.has_cnc_coverage).length;
  const citiesWithAnyEvent = allCities.filter(c => c.total_event_count > 0).length;
  const totalCncEvents = allCities.reduce((sum, c) => sum + (c.cnc_event_count || 0), 0);
  const totalEvents = allCities.reduce((sum, c) => sum + (c.total_event_count || 0), 0);

  console.log(`Total Target Cities:     ${totalCities}`);
  console.log(`Cities with C&C:         ${citiesWithCnc} (${((citiesWithCnc/totalCities)*100).toFixed(1)}%)`);
  console.log(`Cities with Any Events:  ${citiesWithAnyEvent} (${((citiesWithAnyEvent/totalCities)*100).toFixed(1)}%)`);
  console.log(`Total C&C Events:        ${totalCncEvents}`);
  console.log(`Total Events:            ${totalEvents}`);
  console.log();
  console.log(`Tier 1 Missing C&C:      ${tier1Missing.length} cities`);
  console.log(`Tier 2 Missing C&C:      ${tier2Missing.length} cities`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Output to files if requested
  const reportDir = join(__dirname, '..', 'reports');
  if (!existsSync(reportDir)) {
    mkdirSync(reportDir, { recursive: true });
  }

  if (outputJson) {
    const jsonReport = {
      generated_at: new Date().toISOString(),
      summary: {
        total_cities: totalCities,
        cities_with_cnc: citiesWithCnc,
        cities_with_any_event: citiesWithAnyEvent,
        total_cnc_events: totalCncEvents,
        total_events: totalEvents,
        tier1_missing: tier1Missing.length,
        tier2_missing: tier2Missing.length,
      },
      by_region: regionSummary,
      by_tier: tierSummary,
      priority_targets: citiesNeedingCoverage,
      partial_coverage: partialCoverage,
      all_cities: allCities,
    };

    const jsonPath = join(reportDir, 'coverage-report.json');
    writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
    console.log(`📄 JSON report saved to: ${jsonPath}`);
  }

  if (outputCsv) {
    const csvHeaders = [
      'population_rank', 'city', 'state', 'region', 'population',
      'priority_tier', 'has_cnc_coverage', 'cnc_event_count', 'total_event_count',
      'track_event_count', 'show_event_count', 'autocross_event_count',
      'nearest_event_distance_miles', 'last_coverage_check'
    ];

    const csvRows = [csvHeaders.join(',')];
    for (const city of allCities) {
      const row = csvHeaders.map(h => {
        const val = city[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
        return val;
      });
      csvRows.push(row.join(','));
    }

    const csvPath = join(reportDir, 'coverage-report.csv');
    writeFileSync(csvPath, csvRows.join('\n'));
    console.log(`📄 CSV report saved to: ${csvPath}`);
  }
}

main().catch(console.error);


