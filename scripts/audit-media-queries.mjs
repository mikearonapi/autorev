#!/usr/bin/env node
/**
 * Media Query Audit Script
 * 
 * Finds all max-width media queries (desktop-first anti-pattern)
 * and provides conversion guidance to mobile-first min-width queries.
 * 
 * Usage:
 *   node scripts/audit-media-queries.mjs [--json] [--path=<dir>]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Configuration
const IGNORE_DIRS = ['node_modules', '.next', 'out', 'public', '.git'];
const CSS_EXTENSIONS = ['.css', '.module.css'];

// Standard breakpoints (mobile-first)
const BREAKPOINTS = {
  'sm': 640,
  'md': 768,
  'lg': 1024,
  'xl': 1280,
  '2xl': 1536,
};

// Parse arguments
const args = process.argv.slice(2);
const outputJson = args.includes('--json');
const pathArg = args.find(a => a.startsWith('--path='));
const scanPath = pathArg ? pathArg.split('=')[1] : projectRoot;

// Results storage
const results = {
  maxWidthQueries: [],
  summary: {
    totalFiles: 0,
    filesWithMaxWidth: 0,
    totalMaxWidthQueries: 0,
    byBreakpoint: {},
  }
};

/**
 * Check if a path should be ignored
 */
function shouldIgnore(filePath) {
  return IGNORE_DIRS.some(dir => 
    filePath.includes(path.sep + dir + path.sep) || 
    filePath.includes(path.sep + dir)
  );
}

/**
 * Find all CSS files in a directory
 */
function findCssFiles(dir) {
  const files = [];
  
  function walkDir(currentPath) {
    if (shouldIgnore(currentPath)) return;
    
    try {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.isFile() && CSS_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (err) {
      console.error(`Error reading directory ${currentPath}: ${err.message}`);
    }
  }
  
  walkDir(dir);
  return files;
}

/**
 * Find max-width media queries in a file
 */
function findMaxWidthQueries(content, filePath) {
  const issues = [];
  const lines = content.split('\n');
  
  // Regex for max-width media queries
  const maxWidthPattern = /@media[^{]*max-width\s*:\s*(\d+)(px|em|rem)?/gi;
  
  lines.forEach((line, lineIndex) => {
    let match;
    while ((match = maxWidthPattern.exec(line)) !== null) {
      const value = parseInt(match[1], 10);
      const unit = match[2] || 'px';
      const breakpoint = `${value}${unit}`;
      
      // Determine which standard breakpoint this maps to
      let closestBreakpoint = null;
      let minWidthEquivalent = null;
      
      for (const [name, bp] of Object.entries(BREAKPOINTS)) {
        if (Math.abs(bp - value) <= 32) { // Within 32px tolerance
          closestBreakpoint = name;
          minWidthEquivalent = `${bp}px`;
          break;
        }
      }
      
      issues.push({
        file: path.relative(projectRoot, filePath),
        line: lineIndex + 1,
        breakpoint,
        closestStandard: closestBreakpoint,
        minWidthEquivalent,
        lineContent: line.trim(),
        suggestion: minWidthEquivalent 
          ? `Convert to: @media (min-width: ${minWidthEquivalent})`
          : `Convert to mobile-first pattern with appropriate min-width`,
      });
      
      // Track by breakpoint
      if (!results.summary.byBreakpoint[breakpoint]) {
        results.summary.byBreakpoint[breakpoint] = 0;
      }
      results.summary.byBreakpoint[breakpoint]++;
    }
  });
  
  return issues;
}

/**
 * Process a single CSS file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const issues = findMaxWidthQueries(content, filePath);
    
    if (issues.length > 0) {
      results.maxWidthQueries.push(...issues);
      results.summary.filesWithMaxWidth++;
      results.summary.totalMaxWidthQueries += issues.length;
    }
    
    results.summary.totalFiles++;
  } catch (err) {
    console.error(`Error processing ${filePath}: ${err.message}`);
  }
}

/**
 * Generate report
 */
function generateReport() {
  if (outputJson) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('MEDIA QUERY AUDIT REPORT');
  console.log('Mobile-First CSS Compliance Check');
  console.log('='.repeat(80));
  
  console.log('\n📊 SUMMARY');
  console.log('-'.repeat(40));
  console.log(`Total CSS files scanned: ${results.summary.totalFiles}`);
  console.log(`Files with max-width queries: ${results.summary.filesWithMaxWidth}`);
  console.log(`Total max-width queries: ${results.summary.totalMaxWidthQueries}`);
  
  // Breakpoint frequency
  console.log('\n📏 BREAKPOINT FREQUENCY');
  console.log('-'.repeat(40));
  
  const sortedBreakpoints = Object.entries(results.summary.byBreakpoint)
    .sort((a, b) => b[1] - a[1]);
  
  sortedBreakpoints.forEach(([bp, count]) => {
    const value = parseInt(bp, 10);
    let standard = '';
    for (const [name, stdValue] of Object.entries(BREAKPOINTS)) {
      if (Math.abs(stdValue - value) <= 32) {
        standard = ` (≈ ${name}: ${stdValue}px)`;
        break;
      }
    }
    console.log(`${bp}: ${count} queries${standard}`);
  });
  
  // Group by file
  console.log('\n\n📁 FILES WITH MAX-WIDTH QUERIES');
  console.log('-'.repeat(40));
  
  const byFile = {};
  results.maxWidthQueries.forEach(issue => {
    if (!byFile[issue.file]) byFile[issue.file] = [];
    byFile[issue.file].push(issue);
  });
  
  const sortedFiles = Object.entries(byFile)
    .sort((a, b) => b[1].length - a[1].length);
  
  sortedFiles.forEach(([file, issues]) => {
    console.log(`\n📁 ${file} (${issues.length} queries)`);
    issues.slice(0, 5).forEach(issue => {
      console.log(`   Line ${issue.line}: max-width: ${issue.breakpoint}`);
      if (issue.closestStandard) {
        console.log(`      → ${issue.suggestion}`);
      }
    });
    if (issues.length > 5) {
      console.log(`   ... and ${issues.length - 5} more`);
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('STANDARD BREAKPOINTS (Mobile-First)');
  console.log('-'.repeat(40));
  console.log('Base (0-639px): Default styles, no media query needed');
  Object.entries(BREAKPOINTS).forEach(([name, value]) => {
    console.log(`${name}: @media (min-width: ${value}px)`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('CONVERSION GUIDE');
  console.log('-'.repeat(40));
  console.log(`
BEFORE (Desktop-First - Anti-Pattern):
  .element {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (max-width: 768px) {
    .element {
      grid-template-columns: 1fr;
    }
  }

AFTER (Mobile-First - Best Practice):
  .element {
    display: grid;
    grid-template-columns: 1fr;
  }
  
  @media (min-width: 768px) {
    .element {
      grid-template-columns: repeat(3, 1fr);
    }
  }
`);
  
  console.log('='.repeat(80) + '\n');
}

// Main execution
console.log('🔍 Scanning CSS files for max-width media queries...\n');

const cssFiles = findCssFiles(scanPath);
console.log(`Found ${cssFiles.length} CSS files\n`);

cssFiles.forEach(processFile);

generateReport();

// Exit with error code if issues found (for CI)
if (results.summary.totalMaxWidthQueries > 0) {
  process.exit(1);
}
