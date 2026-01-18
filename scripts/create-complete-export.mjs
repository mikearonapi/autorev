#!/usr/bin/env node

/**
 * Create a COMPLETE export of all vehicle data
 */

import { readFileSync, writeFileSync, statSync } from 'fs';

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Usage: node create-complete-export.mjs <input-file>');
  process.exit(1);
}

// Read the file
let content = readFileSync(inputFile, 'utf8');

// The file format is:
// "Below is the result...<untrusted-data-xxx>\n[{\"id\":...}]\n</untrusted-data-xxx>..."
// Where the JSON inside has escaped quotes (\") 

// Find the start of the JSON array (after the tag and \n)
const jsonStartPattern = />\s*\\n\s*\[\{/;
const match = content.match(jsonStartPattern);
if (!match) {
  console.error('Could not find JSON array start');
  process.exit(1);
}

const jsonStartIdx = content.indexOf('[{', match.index);
const jsonEndIdx = content.lastIndexOf('}]') + 2;
let jsonPart = content.substring(jsonStartIdx, jsonEndIdx);

// Unescape the JSON - the quotes are escaped as \"
jsonPart = jsonPart.replace(/\\"/g, '"');

// The literal \n and \\ inside strings need to stay escaped for JSON parsing
// But we have \\n (literal backslash-n in the file) that represents \n in JSON strings
// Don't change anything else - JSON.parse will handle the rest

// Parse JSON
let data;
try {
  data = JSON.parse(jsonPart);
} catch (e) {
  console.error('Parse error:', e.message);
  const match = e.message.match(/position (\d+)/);
  if (match) {
    const pos = parseInt(match[1]);
    console.error('Around position', pos, ':');
    console.error(jsonPart.substring(Math.max(0, pos - 50), pos + 50));
  }
  process.exit(1);
}

console.log(`Parsed ${data.length} vehicles`);

// Get all column headers, excluding binary/vector fields
const skipCols = ['embedding', 'search_vector', 'ai_searchable_text'];
const headers = Object.keys(data[0]).filter(k => !skipCols.includes(k));
console.log(`${headers.length} columns`);

// Escape for CSV
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  
  // Convert objects/arrays to JSON
  if (typeof value === 'object') {
    value = JSON.stringify(value);
  }
  
  // Convert to string and normalize newlines
  let str = String(value)
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ');
  
  // If contains comma, quote, or other special chars, wrap in quotes
  if (str.includes(',') || str.includes('"') || str.includes(';')) {
    str = '"' + str.replace(/"/g, '""') + '"';
  }
  
  return str;
}

// Build CSV
const lines = [headers.join(',')];

for (const row of data) {
  const values = headers.map(h => escapeCSV(row[h]));
  lines.push(values.join(','));
}

// Write output
const date = new Date().toISOString().split('T')[0];
const outFile = `audit/vehicle_COMPLETE_export_${date}.csv`;
writeFileSync(outFile, lines.join('\n'), 'utf8');

const stats = statSync(outFile);
console.log(`Written to: ${outFile}`);
console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
