#!/usr/bin/env node

/**
 * Convert JSON export to CSV
 * Reads the SQL query result and outputs a clean CSV
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get input file from argument
const inputFile = process.argv[2];

if (!inputFile) {
  console.error('Usage: node convert-json-to-csv.mjs <input-file>');
  process.exit(1);
}

// Read and parse the file
let content = readFileSync(inputFile, 'utf8');

// Remove the wrapper text and get just the JSON
// The format has escaped JSON like: \"[{...}]\"
const startMarker = '<untrusted-data-';
const endMarker = '</untrusted-data-';

let jsonStr;
if (content.includes(startMarker)) {
  // Extract content between the tags
  const startIdx = content.indexOf('>', content.indexOf(startMarker)) + 1;
  const endIdx = content.lastIndexOf(endMarker);
  jsonStr = content.substring(startIdx, endIdx).trim();
  // Unescape the JSON
  jsonStr = jsonStr.replace(/\\"/g, '"').replace(/\\n/g, '\n');
  // Remove outer quotes if present
  if (jsonStr.startsWith('"[')) {
    jsonStr = jsonStr.slice(1);
  }
  if (jsonStr.endsWith(']"')) {
    jsonStr = jsonStr.slice(0, -1);
  }
} else {
  // Try to find raw JSON array
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error('Could not find JSON array in file');
    process.exit(1);
  }
  jsonStr = jsonMatch[0];
}

let data;
try {
  data = JSON.parse(jsonStr);
} catch (e) {
  console.error('JSON parse error:', e.message);
  console.error('First 500 chars:', jsonStr.substring(0, 500));
  process.exit(1);
}
console.log(`Parsed ${data.length} vehicles`);

// Get all keys from first record
const keys = Object.keys(data[0]);
console.log(`Found ${keys.length} columns`);

// Escape CSV value
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// Build CSV
const lines = [
  keys.join(','),
  ...data.map(row => keys.map(k => escapeCSV(row[k])).join(','))
];

const csv = lines.join('\n');

// Write output
const date = new Date().toISOString().split('T')[0];
const outputFile = join(__dirname, '..', 'audit', `vehicle_full_export_${date}.csv`);
writeFileSync(outputFile, csv, 'utf8');

console.log(`✅ Written to: ${outputFile}`);
