#!/usr/bin/env node
/**
 * Vehicle Accuracy Audit Script
 * Parses the complete vehicle JSON and extracts key information for verification
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load the vehicle data
const vehicleData = JSON.parse(
  readFileSync(join(__dirname, '../audit/vehicle_COMPLETE_2026-01-11.json'), 'utf-8')
);

console.log(`Total vehicles: ${vehicleData.length}`);
console.log('\n=== VEHICLE LIST ===\n');

// Extract key fields for each vehicle
const vehicleList = vehicleData.map((v, i) => ({
  index: i + 1,
  slug: v.slug,
  name: v.name,
  years: v.years,
  brand: v.brand,
  hp: v.hp,
  engine: v.engine,
  curb_weight: v.curb_weight,
  zero_to_sixty: v.zero_to_sixty,
  torque: v.torque,
  msrp_new_low: v.msrp_new_low,
  msrp_new_high: v.msrp_new_high,
  price_avg: v.price_avg,
  drivetrain: v.drivetrain,
  trans: v.trans,
  top_speed: v.top_speed,
  quarter_mile: v.quarter_mile,
  braking_60_0: v.braking_60_0,
  lateral_g: v.lateral_g
}));

// Print list
vehicleList.forEach(v => {
  console.log(`${v.index}. ${v.name} (${v.years}) - ${v.slug}`);
});

// Save vehicle list to file
writeFileSync(
  join(__dirname, '../audit/vehicle_list_summary.json'),
  JSON.stringify(vehicleList, null, 2)
);

console.log('\n=== SUMMARY ===');
console.log(`Total vehicles: ${vehicleData.length}`);
console.log(`Vehicle list saved to: audit/vehicle_list_summary.json`);

// Count fields with null/empty values per vehicle
const fieldCounts = {
  total_fields: 154,
  vehicles_with_missing_critical: []
};

const criticalFields = [
  'hp', 'torque', 'engine', 'curb_weight', 'zero_to_sixty',
  'drivetrain', 'trans', 'years', 'name', 'brand'
];

vehicleData.forEach((v, i) => {
  const missingCritical = criticalFields.filter(f => v[f] === null || v[f] === undefined);
  if (missingCritical.length > 0) {
    fieldCounts.vehicles_with_missing_critical.push({
      index: i + 1,
      name: v.name,
      slug: v.slug,
      missing: missingCritical
    });
  }
});

console.log(`\nVehicles missing critical data: ${fieldCounts.vehicles_with_missing_critical.length}`);
if (fieldCounts.vehicles_with_missing_critical.length > 0) {
  fieldCounts.vehicles_with_missing_critical.forEach(v => {
    console.log(`  - ${v.name}: missing ${v.missing.join(', ')}`);
  });
}
