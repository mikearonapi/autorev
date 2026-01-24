#!/usr/bin/env node
/**
 * Media Query Conversion Helper
 * 
 * Helps convert max-width (desktop-first) to min-width (mobile-first) patterns.
 * 
 * NOTE: This script provides GUIDANCE only. Full automation is risky because:
 * - CSS logic often needs to be inverted (mobile styles become default)
 * - Some queries have complex logic that needs manual review
 * 
 * Usage:
 *   node scripts/convert-media-queries.mjs <file> [--preview]
 *   node scripts/convert-media-queries.mjs --list
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Breakpoint mapping (max-width → min-width equivalent)
const BREAKPOINT_MAP = {
  '360': { minWidth: '361', name: 'xs-landscape' },
  '374': { minWidth: '375', name: 'small-phone' },
  '375': { minWidth: '376', name: 'small-phone' },
  '480': { minWidth: '481', name: 'phone' },
  '600': { minWidth: '601', name: 'large-phone' },
  '640': { minWidth: '641', name: 'sm' },
  '767': { minWidth: '768', name: 'md' },
  '768': { minWidth: '769', name: 'md' },
  '900': { minWidth: '901', name: 'tablet' },
  '1024': { minWidth: '1025', name: 'lg' },
  '1100': { minWidth: '1101', name: 'lg-custom' },
  '1280': { minWidth: '1281', name: 'xl' },
};

const args = process.argv.slice(2);
const listMode = args.includes('--list');
const previewMode = args.includes('--preview');
const targetFile = args.find(a => !a.startsWith('--'));

if (listMode) {
  // List all files with max-width queries
  const IGNORE_DIRS = ['node_modules', '.next', 'out', 'public', '.git'];
  
  function findCssFiles(dir) {
    const files = [];
    function walk(d) {
      if (IGNORE_DIRS.some(x => d.includes('/' + x))) return;
      try {
        fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
          const full = path.join(d, e.name);
          if (e.isDirectory()) walk(full);
          else if (e.name.endsWith('.css')) files.push(full);
        });
      } catch(e) {}
    }
    walk(dir);
    return files;
  }
  
  const files = findCssFiles(projectRoot);
  const results = [];
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(/@media[^{]*max-width/gi) || [];
    if (matches.length > 0) {
      results.push({ file: path.relative(projectRoot, file), count: matches.length });
    }
  });
  
  results.sort((a, b) => b.count - a.count);
  
  console.log('Files with max-width queries:\n');
  results.forEach(({ file, count }) => {
    console.log(`  ${count.toString().padStart(3)} queries - ${file}`);
  });
  console.log(`\nTotal: ${results.reduce((sum, r) => sum + r.count, 0)} queries across ${results.length} files`);
  process.exit(0);
}

if (!targetFile) {
  console.log(`
Media Query Conversion Helper

Usage:
  node scripts/convert-media-queries.mjs <file> [--preview]
  node scripts/convert-media-queries.mjs --list

Options:
  --preview  Show what would be changed without modifying the file
  --list     List all files with max-width queries

Examples:
  node scripts/convert-media-queries.mjs components/Header.module.css --preview
  node scripts/convert-media-queries.mjs app/(app)/garage/page.module.css

Conversion Rules:
  max-width: 767px → min-width: 768px
  max-width: 480px → min-width: 481px
  max-width: 640px → min-width: 641px
  etc.

IMPORTANT: After conversion, you must MANUALLY:
  1. Move mobile styles OUTSIDE the media query (as default)
  2. Move desktop styles INSIDE the min-width query
  3. Test at multiple viewport sizes
`);
  process.exit(0);
}

// Read and analyze file
const filePath = path.resolve(projectRoot, targetFile);
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${targetFile}`);
  process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');

// Find all max-width media queries
const mediaQueryRegex = /@media\s*\([^)]*max-width\s*:\s*(\d+)px[^)]*\)/gi;
const matches = [...content.matchAll(mediaQueryRegex)];

if (matches.length === 0) {
  console.log('No max-width media queries found in this file.');
  process.exit(0);
}

console.log(`Found ${matches.length} max-width media queries in ${targetFile}:\n`);

// Group by breakpoint
const byBreakpoint = {};
matches.forEach(match => {
  const breakpoint = match[1];
  if (!byBreakpoint[breakpoint]) byBreakpoint[breakpoint] = [];
  byBreakpoint[breakpoint].push(match);
});

Object.entries(byBreakpoint).forEach(([bp, instances]) => {
  const mapping = BREAKPOINT_MAP[bp];
  const suggestion = mapping 
    ? `→ min-width: ${mapping.minWidth}px (${mapping.name})`
    : `→ min-width: ${parseInt(bp) + 1}px`;
  console.log(`  max-width: ${bp}px (${instances.length} instances) ${suggestion}`);
});

if (previewMode) {
  console.log('\n[Preview mode - no changes made]');
  console.log('\nTo apply changes, run without --preview flag.');
} else {
  // Perform conversion
  let newContent = content;
  let replacements = 0;
  
  Object.entries(byBreakpoint).forEach(([bp, instances]) => {
    const minWidth = BREAKPOINT_MAP[bp]?.minWidth || (parseInt(bp) + 1).toString();
    
    // Replace max-width with min-width
    const regex = new RegExp(`@media\\s*\\(\\s*max-width\\s*:\\s*${bp}px\\s*\\)`, 'gi');
    const replacement = `@media (min-width: ${minWidth}px)`;
    
    const beforeCount = (newContent.match(regex) || []).length;
    newContent = newContent.replace(regex, replacement);
    const afterCount = (newContent.match(regex) || []).length;
    
    replacements += beforeCount;
  });
  
  if (replacements > 0) {
    fs.writeFileSync(filePath, newContent);
    console.log(`\n✅ Converted ${replacements} media queries.`);
    console.log('\n⚠️  IMPORTANT: Manual review required!');
    console.log('   The CSS LOGIC may need to be inverted:');
    console.log('   - Mobile styles should be the DEFAULT (outside media query)');
    console.log('   - Desktop styles go INSIDE the min-width query');
    console.log('   - Test at 375px, 768px, and 1024px viewports');
  }
}
