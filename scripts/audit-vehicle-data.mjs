#!/usr/bin/env node

/**
 * Vehicle Data Audit Script
 * 
 * Runs comprehensive validation checks across all vehicles in the database
 * to identify data quality issues, contamination, and missing information.
 * 
 * Usage: node scripts/audit-vehicle-data.mjs [--fix] [--brand=audi]
 * 
 * Flags:
 *   --fix     Apply automatic fixes where safe
 *   --brand=X Only audit vehicles from brand X
 *   --verbose Show all vehicles, not just issues
 */

import { createClient } from '@supabase/supabase-js';
import { identifyEnginePlatform, validateStockWhp } from '../lib/enginePlatforms.js';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse CLI args
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const verboseMode = args.includes('--verbose');
const brandFilter = args.find(a => a.startsWith('--brand='))?.split('=')[1];

// Issue severity levels
const SEVERITY = {
  CRITICAL: '🔴 CRITICAL',
  HIGH: '🟠 HIGH',
  MEDIUM: '🟡 MEDIUM',
  LOW: '🟢 LOW',
};

// Track all issues
const issues = [];
const fixes = [];

/**
 * Add an issue to the report
 */
function addIssue(severity, slug, field, message, currentValue, expectedValue, autoFixable = false) {
  issues.push({
    severity,
    slug,
    field,
    message,
    currentValue,
    expectedValue,
    autoFixable,
  });
}

/**
 * Validation Rule: manual_available matches transmission type
 */
function validateManualAvailable(car) {
  const trans = (car.trans || '').toLowerCase();
  const hasManualTrans = trans.includes('mt') || trans.includes('manual') || trans.includes('6m') || trans.includes('5m');
  const hasDctOnly = (trans.includes('dct') || trans.includes('dsg') || trans.includes('pdk') || trans.includes('at')) 
                     && !hasManualTrans;
  
  // Known DCT-only vehicles (no manual option available)
  const dctOnlyVehicles = [
    'nissan-gt-r', 'c8-corvette', 'shelby-gt500', 'volkswagen-golf-r-mk8',
    'ferrari', 'lamborghini', 'mclaren', 'bugatti',
  ];
  
  const isDctOnly = dctOnlyVehicles.some(v => car.slug.includes(v)) || 
                    car.slug.includes('dct') ||
                    (hasDctOnly && !hasManualTrans);
  
  if (car.manual_available === true && isDctOnly) {
    addIssue(
      SEVERITY.CRITICAL,
      car.slug,
      'manual_available',
      'Vehicle marked as manual available but has DCT/automatic only',
      'true',
      'false',
      true
    );
    return false;
  }
  
  return true;
}

/**
 * Validation Rule: stock_whp is reasonable for crank HP
 */
function validateStockPower(car, tuningProfile) {
  if (!tuningProfile || !tuningProfile.stock_whp || !car.hp) return true;
  
  // Expected WHP = crank HP * 0.85 (±20% tolerance for different dyno types)
  const expectedWhp = Math.round(car.hp * 0.85);
  const tolerance = 0.25; // 25% tolerance
  const minExpected = expectedWhp * (1 - tolerance);
  const maxExpected = expectedWhp * (1 + tolerance);
  
  if (tuningProfile.stock_whp < minExpected || tuningProfile.stock_whp > maxExpected) {
    addIssue(
      SEVERITY.HIGH,
      car.slug,
      'stock_whp',
      `Stock WHP ${tuningProfile.stock_whp} doesn't match crank HP ${car.hp} (expected ~${expectedWhp} WHP)`,
      tuningProfile.stock_whp,
      expectedWhp,
      false
    );
    return false;
  }
  
  return true;
}

/**
 * Validation Rule: engine_family matches car's actual engine
 */
function validateEngineFamily(car, tuningProfile) {
  if (!tuningProfile || !tuningProfile.engine_family || !car.engine) return true;
  
  const carEngine = car.engine.toLowerCase();
  const profileEngine = tuningProfile.engine_family.toLowerCase();
  
  // Extract displacement from both
  const carDisplacementMatch = carEngine.match(/(\d+\.\d+)l/);
  const profileDisplacementMatch = profileEngine.match(/(\d+\.\d+)l/);
  
  if (carDisplacementMatch && profileDisplacementMatch) {
    const carDisplacement = parseFloat(carDisplacementMatch[1]);
    const profileDisplacement = parseFloat(profileDisplacementMatch[1]);
    
    // Displacement should be within 0.3L
    if (Math.abs(carDisplacement - profileDisplacement) > 0.3) {
      addIssue(
        SEVERITY.CRITICAL,
        car.slug,
        'engine_family',
        `Engine family "${tuningProfile.engine_family}" doesn't match car engine "${car.engine}" (displacement mismatch)`,
        tuningProfile.engine_family,
        `Should match ${car.engine}`,
        false
      );
      return false;
    }
  }
  
  // Check for obvious mismatches
  const engineKeywords = {
    'turbo': ['turbo', 'tt', 'tfsi', 'tsi', 'ecoboost', 'biturbo'],
    'supercharged': ['supercharged', 'sc', 'kompressor'],
    'na': ['na', 'naturally aspirated'],
    'v8': ['v8'],
    'v6': ['v6'],
    'v10': ['v10'],
    'v12': ['v12'],
    'i4': ['i4', 'inline-4', 'inline 4', '4-cylinder'],
    'i6': ['i6', 'inline-6', 'inline 6', '6-cylinder', 'straight-6'],
    'flat': ['flat', 'boxer', 'h4', 'h6'],
    'electric': ['electric', 'ev', 'motor'],
  };
  
  // Check cylinder count mismatch
  for (const [type, keywords] of Object.entries(engineKeywords)) {
    const carHas = keywords.some(k => carEngine.includes(k));
    const profileHas = keywords.some(k => profileEngine.includes(k));
    
    if (type.startsWith('v') || type.startsWith('i') || type === 'flat') {
      if (carHas && !profileHas) {
        // Car has V8 but profile doesn't mention V8 - potential issue
        const otherConfigs = ['v6', 'v8', 'v10', 'v12', 'i4', 'i6', 'flat'];
        const profileHasOther = otherConfigs.some(c => 
          c !== type && engineKeywords[c].some(k => profileEngine.includes(k))
        );
        
        if (profileHasOther) {
          addIssue(
            SEVERITY.CRITICAL,
            car.slug,
            'engine_family',
            `Engine config mismatch: Car has ${carEngine} but profile shows "${tuningProfile.engine_family}"`,
            tuningProfile.engine_family,
            `Should match ${car.engine}`,
            false
          );
          return false;
        }
      }
    }
  }
  
  return true;
}

/**
 * Validation Rule: Required fields are populated
 */
function validateRequiredFields(car) {
  const requiredFields = [
    { field: 'seats', severity: SEVERITY.MEDIUM },
    { field: 'hp', severity: SEVERITY.HIGH },
    { field: 'engine', severity: SEVERITY.HIGH },
    { field: 'drivetrain', severity: SEVERITY.MEDIUM },
    { field: 'trans', severity: SEVERITY.MEDIUM },
  ];
  
  let valid = true;
  
  for (const { field, severity } of requiredFields) {
    if (car[field] === null || car[field] === undefined || car[field] === '') {
      addIssue(
        severity,
        car.slug,
        field,
        `Missing required field: ${field}`,
        'null',
        'Should be populated',
        false
      );
      valid = false;
    }
  }
  
  return valid;
}

/**
 * Validation Rule: Check for suspected data contamination
 * Looks for tuning profiles that seem to belong to a different car
 */
function checkForContamination(car, tuningProfile) {
  if (!tuningProfile || !tuningProfile.engine_family) return true;
  
  // Known contamination patterns from our RS5 investigation
  const contaminationPatterns = [
    { pattern: '2.5L TFSI 5-Cylinder', validFor: ['rs3', 'tt-rs', 'ttrs'] },
    { pattern: 'K20C1', validFor: ['civic-type-r', 'ctr', 'fl5', 'fk8'] },
    { pattern: 'B58', validFor: ['supra-a90', 'm340i', 'z4-m40i', 'x3-m40i'] },
    { pattern: 'S55', validFor: ['m3-f80', 'm4-f82', 'm2-competition'] },
    { pattern: 'EA888 Gen3', validFor: ['gti-mk7', 'gti-mk8', 'golf-r-mk7', 'golf-r-mk8', 's3', 'a3'] },
    { pattern: '3.5L EcoBoost', validFor: ['f-150', 'raptor', 'explorer-st'] },
    { pattern: '5.0L Coyote', validFor: ['mustang-gt', 'f-150-5'] },
  ];
  
  const engineFamily = tuningProfile.engine_family.toLowerCase();
  const slug = car.slug.toLowerCase();
  
  for (const { pattern, validFor } of contaminationPatterns) {
    if (engineFamily.includes(pattern.toLowerCase())) {
      const isValidMatch = validFor.some(v => slug.includes(v));
      if (!isValidMatch) {
        addIssue(
          SEVERITY.CRITICAL,
          car.slug,
          'engine_family',
          `Suspected contamination: "${tuningProfile.engine_family}" typically belongs to ${validFor.join('/')} vehicles`,
          tuningProfile.engine_family,
          'Reset to skeleton and re-populate',
          false
        );
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Main audit function
 */
async function runAudit() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    VEHICLE DATA AUDIT                          ');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Fetch all cars with their tuning profiles
  let query = supabase
    .from('cars')
    .select(`
      id, slug, name, engine, hp, torque, trans, drivetrain,
      manual_available, seats, daily_usability_tag, brand,
      car_tuning_profiles (
        engine_family, stock_whp, stock_wtq, data_quality_tier,
        stage_progressions, tuning_platforms, upgrades_by_objective
      )
    `)
    .order('brand')
    .order('name');
  
  if (brandFilter) {
    query = query.ilike('brand', `%${brandFilter}%`);
  }
  
  const { data: cars, error } = await query;
  
  if (error) {
    console.error('Error fetching cars:', error);
    process.exit(1);
  }
  
  console.log(`Auditing ${cars.length} vehicles${brandFilter ? ` (brand: ${brandFilter})` : ''}...\n`);
  
  // Run validations on each car
  for (const car of cars) {
    const tuningProfile = car.car_tuning_profiles?.[0] || null;
    
    validateManualAvailable(car);
    validateRequiredFields(car);
    validateStockPower(car, tuningProfile);
    validateEngineFamily(car, tuningProfile);
    checkForContamination(car, tuningProfile);
  }
  
  // Generate report
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                         AUDIT RESULTS                          ');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Group issues by severity
  const criticalIssues = issues.filter(i => i.severity === SEVERITY.CRITICAL);
  const highIssues = issues.filter(i => i.severity === SEVERITY.HIGH);
  const mediumIssues = issues.filter(i => i.severity === SEVERITY.MEDIUM);
  const lowIssues = issues.filter(i => i.severity === SEVERITY.LOW);
  
  console.log('SUMMARY:');
  console.log(`  ${SEVERITY.CRITICAL}: ${criticalIssues.length} issues`);
  console.log(`  ${SEVERITY.HIGH}: ${highIssues.length} issues`);
  console.log(`  ${SEVERITY.MEDIUM}: ${mediumIssues.length} issues`);
  console.log(`  ${SEVERITY.LOW}: ${lowIssues.length} issues`);
  console.log(`  TOTAL: ${issues.length} issues across ${cars.length} vehicles\n`);
  
  // Print critical issues first
  if (criticalIssues.length > 0) {
    console.log('\n─────────────────────────────────────────────────────────────────');
    console.log(`${SEVERITY.CRITICAL} ISSUES (${criticalIssues.length})`);
    console.log('─────────────────────────────────────────────────────────────────\n');
    
    for (const issue of criticalIssues) {
      console.log(`  ${issue.slug}`);
      console.log(`    Field: ${issue.field}`);
      console.log(`    Issue: ${issue.message}`);
      console.log(`    Current: ${issue.currentValue}`);
      console.log(`    Expected: ${issue.expectedValue}`);
      console.log('');
    }
  }
  
  // Print high issues
  if (highIssues.length > 0) {
    console.log('\n─────────────────────────────────────────────────────────────────');
    console.log(`${SEVERITY.HIGH} ISSUES (${highIssues.length})`);
    console.log('─────────────────────────────────────────────────────────────────\n');
    
    for (const issue of highIssues) {
      console.log(`  ${issue.slug}`);
      console.log(`    Field: ${issue.field}`);
      console.log(`    Issue: ${issue.message}`);
      console.log('');
    }
  }
  
  // Print medium issues (grouped by field type)
  if (mediumIssues.length > 0) {
    console.log('\n─────────────────────────────────────────────────────────────────');
    console.log(`${SEVERITY.MEDIUM} ISSUES (${mediumIssues.length})`);
    console.log('─────────────────────────────────────────────────────────────────\n');
    
    const byField = {};
    for (const issue of mediumIssues) {
      if (!byField[issue.field]) byField[issue.field] = [];
      byField[issue.field].push(issue.slug);
    }
    
    for (const [field, slugs] of Object.entries(byField)) {
      console.log(`  Missing "${field}" (${slugs.length} vehicles):`);
      console.log(`    ${slugs.slice(0, 10).join(', ')}${slugs.length > 10 ? ` ... and ${slugs.length - 10} more` : ''}`);
      console.log('');
    }
  }
  
  // Generate SQL fixes for auto-fixable issues
  const autoFixable = issues.filter(i => i.autoFixable);
  if (autoFixable.length > 0) {
    console.log('\n─────────────────────────────────────────────────────────────────');
    console.log('AUTO-FIXABLE ISSUES');
    console.log('─────────────────────────────────────────────────────────────────\n');
    
    for (const issue of autoFixable) {
      console.log(`-- Fix ${issue.slug}.${issue.field}`);
      console.log(`UPDATE cars SET ${issue.field} = ${issue.expectedValue} WHERE slug = '${issue.slug}';`);
      console.log('');
    }
  }
  
  // Return summary for programmatic use
  return {
    total: cars.length,
    issues: issues.length,
    critical: criticalIssues.length,
    high: highIssues.length,
    medium: mediumIssues.length,
    low: lowIssues.length,
    issuesList: issues,
  };
}

// Run the audit
runAudit()
  .then(result => {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                       AUDIT COMPLETE                           ');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    if (result.critical > 0) {
      console.log(`⚠️  ${result.critical} CRITICAL issues require immediate attention!`);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Audit failed:', err);
    process.exit(1);
  });
