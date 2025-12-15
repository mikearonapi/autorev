#!/usr/bin/env node

/**
 * Extract Known Issues from NHTSA Complaints
 * 
 * Fetches NHTSA complaints and groups them by component to identify
 * common issues for each vehicle.
 * 
 * Usage:
 *   node scripts/enrichIssuesFromComplaints.js                    # All missing
 *   node scripts/enrichIssuesFromComplaints.js --limit=10         # First 10
 *   node scripts/enrichIssuesFromComplaints.js --car=bmw-m3-e46   # Single car
 *   node scripts/enrichIssuesFromComplaints.js --all              # All cars
 *   node scripts/enrichIssuesFromComplaints.js --threshold=2      # Min complaints per issue
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeMakeName, normalizeModelName, parseYearsRange } from '../lib/recallService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const NHTSA_API_BASE = 'https://api.nhtsa.gov';

// Parse arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    acc[key] = value === undefined ? true : value;
  }
  return acc;
}, {});

const LIMIT = args.limit ? parseInt(args.limit) : null;
const SKIP = args.skip ? parseInt(args.skip) : 0;
const DELAY_MS = args.delay ? parseInt(args.delay) : 1500;
const ALL_CARS = args.all || false;
const SINGLE_CAR = args.car || null;
const DRY_RUN = args['dry-run'] || false;
const THRESHOLD = args.threshold ? parseInt(args.threshold) : 3; // Min complaints per issue
const VERBOSE = args.verbose || args.v || false;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch complaints from NHTSA API
 */
async function fetchComplaints(make, model, year) {
  const url = `${NHTSA_API_BASE}/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.results || [];
  } catch {
    return [];
  }
}

/**
 * Group complaints by component and summarize
 */
function groupAndSummarizeComplaints(complaints) {
  const groups = {};
  
  for (const complaint of complaints) {
    const component = complaint.components || complaint.Component || 'Unknown';
    
    if (!groups[component]) {
      groups[component] = {
        component,
        count: 0,
        summaries: [],
        crashReports: 0,
        injuryReports: 0,
        fireReports: 0,
      };
    }
    
    groups[component].count++;
    
    // Collect summaries (limit to first 5)
    const summary = complaint.summary || complaint.Summary || '';
    if (summary && groups[component].summaries.length < 5) {
      groups[component].summaries.push(summary.slice(0, 200));
    }
    
    // Track severity indicators
    if (complaint.crash === 'Y' || complaint.Crash === 'Y') groups[component].crashReports++;
    if (complaint.injuries > 0 || complaint.Injuries > 0) groups[component].injuryReports++;
    if (complaint.fire === 'Y' || complaint.Fire === 'Y') groups[component].fireReports++;
  }
  
  return groups;
}

/**
 * Calculate severity based on complaint data
 */
function calculateSeverity(group) {
  if (group.crashReports > 0 || group.fireReports > 0) return 'critical';
  if (group.injuryReports > 0) return 'high';
  if (group.count >= 10) return 'high';
  if (group.count >= 5) return 'medium';
  return 'low';
}

/**
 * Create a descriptive title from component
 */
function createIssueTitle(component) {
  // Clean up NHTSA component names
  const cleaned = component
    .replace(/\s*:\s*/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return `${cleaned} Issues`;
}

/**
 * Create description from summaries
 */
function createDescription(group) {
  const intro = `${group.count} NHTSA complaints reported for ${group.component}.`;
  
  let severity = '';
  if (group.crashReports > 0) severity += ` ${group.crashReports} crash report(s).`;
  if (group.fireReports > 0) severity += ` ${group.fireReports} fire report(s).`;
  if (group.injuryReports > 0) severity += ` ${group.injuryReports} injury report(s).`;
  
  // Summarize common themes from complaints
  const summaryText = group.summaries.length > 0
    ? '\n\nTypical complaints include: ' + group.summaries[0].slice(0, 150) + '...'
    : '';
  
  return (intro + severity + summaryText).trim();
}

/**
 * Process complaints for a single car
 */
async function processCarComplaints(car) {
  const make = normalizeMakeName(car.brand);
  const model = normalizeModelName(car.name);
  const yearsRange = parseYearsRange(car.years);
  
  if (!make || !model || !yearsRange) {
    return { complaints: 0, issues: [], error: 'Could not parse car info' };
  }
  
  let allComplaints = [];
  
  // Fetch complaints for each year
  for (let year = yearsRange.start; year <= yearsRange.end; year++) {
    const yearComplaints = await fetchComplaints(make, model, year);
    allComplaints = allComplaints.concat(yearComplaints);
    await sleep(300); // Rate limit
  }
  
  if (allComplaints.length === 0) {
    return { complaints: 0, issues: [], error: null };
  }
  
  // Group by component
  const groups = groupAndSummarizeComplaints(allComplaints);
  
  // Convert to issues (only groups meeting threshold)
  const issues = Object.values(groups)
    .filter(g => g.count >= THRESHOLD)
    .map(group => ({
      car_id: car.id,
      car_slug: car.slug,
      kind: 'common_issue',
      title: createIssueTitle(group.component),
      description: createDescription(group),
      severity: calculateSeverity(group),
      source_type: 'nhtsa_complaints',
      source_url: `https://www.nhtsa.gov/vehicle/${car.brand}/${model}`,
    }));
  
  return { complaints: allComplaints.length, issues, error: null };
}

async function main() {
  console.log('='.repeat(70));
  console.log('🔍 NHTSA Complaints → Known Issues Enrichment');
  console.log('='.repeat(70));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Threshold: ${THRESHOLD} complaints = 1 issue`);
  console.log(`Delay: ${DELAY_MS}ms between cars`);
  console.log('='.repeat(70));

  let carsToProcess = [];

  if (SINGLE_CAR) {
    const { data: car, error } = await supabase
      .from('cars')
      .select('id, slug, name, brand, years')
      .eq('slug', SINGLE_CAR)
      .single();

    if (error || !car) {
      console.error(`❌ Car not found: ${SINGLE_CAR}`);
      process.exit(1);
    }
    carsToProcess = [car];
    console.log(`Single car mode: ${car.name}`);
  } else if (ALL_CARS) {
    const { data: cars, error } = await supabase
      .from('cars')
      .select('id, slug, name, brand, years')
      .order('name');

    if (error || !cars) {
      console.error('❌ Error fetching cars:', error?.message);
      process.exit(1);
    }
    carsToProcess = cars;
    console.log(`All cars mode: ${carsToProcess.length} cars`);
  } else {
    // Missing cars mode - get cars without NHTSA-sourced issues
    const { data: existingIssues } = await supabase
      .from('car_issues')
      .select('car_slug')
      .eq('source_type', 'nhtsa_complaints');

    const carsWithNhtsaIssues = new Set(existingIssues?.map(r => r.car_slug) || []);

    const { data: allCars, error } = await supabase
      .from('cars')
      .select('id, slug, name, brand, years')
      .order('name');

    if (error || !allCars) {
      console.error('❌ Error fetching cars:', error?.message);
      process.exit(1);
    }

    carsToProcess = allCars.filter(car => !carsWithNhtsaIssues.has(car.slug));
    console.log(`Missing cars mode: ${carsToProcess.length} of ${allCars.length} cars need NHTSA issues`);
  }

  // Apply skip and limit
  carsToProcess = carsToProcess.slice(SKIP);
  if (LIMIT) {
    carsToProcess = carsToProcess.slice(0, LIMIT);
  }

  console.log(`\nProcessing: ${carsToProcess.length} cars\n`);
  console.log('='.repeat(70));

  let totalComplaints = 0;
  let totalIssues = 0;
  let carsWithIssues = 0;
  let carsWithErrors = 0;

  for (let i = 0; i < carsToProcess.length; i++) {
    const car = carsToProcess[i];

    process.stdout.write(`[${String(i + 1).padStart(3)}/${carsToProcess.length}] ${car.name.padEnd(45)}`);

    try {
      const { complaints, issues, error } = await processCarComplaints(car);

      if (error) {
        console.log(` ⚠️  ${error}`);
        carsWithErrors++;
        continue;
      }

      totalComplaints += complaints;

      if (issues.length > 0) {
        if (!DRY_RUN) {
          // Upsert issues (using title as uniqueness within car)
          for (const issue of issues) {
            const { error: upsertError } = await supabase
              .from('car_issues')
              .upsert(issue, { 
                onConflict: 'car_id,title',
                ignoreDuplicates: false 
              });

            if (upsertError && VERBOSE) {
              console.log(`\n      DB Error: ${upsertError.message}`);
            }
          }
          console.log(` ✅ ${complaints} complaints → ${issues.length} issues`);
        } else {
          console.log(` [DRY RUN] ${complaints} complaints → ${issues.length} issues`);
        }
        totalIssues += issues.length;
        carsWithIssues++;

        if (VERBOSE) {
          issues.forEach(issue => {
            console.log(`      - ${issue.title} (${issue.severity})`);
          });
        }
      } else {
        console.log(` ⭕ ${complaints} complaints (< threshold)`);
      }
    } catch (err) {
      console.log(` ❌ Error: ${err.message}`);
      carsWithErrors++;
    }

    if (i < carsToProcess.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 Summary');
  console.log('='.repeat(70));
  console.log(`Cars processed:    ${carsToProcess.length}`);
  console.log(`Cars with issues:  ${carsWithIssues}`);
  console.log(`Cars with errors:  ${carsWithErrors}`);
  console.log(`Total complaints:  ${totalComplaints}`);
  console.log(`Total issues:      ${totalIssues}`);
  console.log('='.repeat(70));

  // Show final coverage
  const { count: totalCars } = await supabase
    .from('cars')
    .select('*', { count: 'exact', head: true });

  const { data: issueCoverage } = await supabase
    .from('car_issues')
    .select('car_slug');

  const uniqueCarsWithIssues = new Set(issueCoverage?.map(r => r.car_slug) || []);

  console.log(`\n📈 Coverage: ${uniqueCarsWithIssues.size}/${totalCars} cars (${Math.round(uniqueCarsWithIssues.size / totalCars * 100)}%)`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

