#!/usr/bin/env node
/**
 * CSS Token Audit Script
 * 
 * Scans CSS files for:
 * 1. Hardcoded hex colors without var() wrapper
 * 2. max-width media queries (desktop-first anti-pattern)
 * 3. Reports findings for remediation
 * 
 * Usage:
 *   node scripts/audit-css-tokens.mjs [--fix-colors] [--json]
 * 
 * Options:
 *   --fix-colors  Generate a fix script (doesn't modify files directly)
 *   --json        Output results as JSON
 *   --path=<dir>  Scan specific directory (default: entire project)
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

// Color token mappings (from styles/tokens/colors.css)
const COLOR_TOKEN_MAP = {
  // Backgrounds
  '#0d1b2a': 'var(--color-bg-base, #0d1b2a)',
  '#1b263b': 'var(--color-bg-elevated, #1b263b)',
  '#1a2332': 'var(--color-bg-elevated, #1a2332)', // alternate elevated
  
  // Text
  '#ffffff': 'var(--color-text-primary, #ffffff)',
  '#fff': 'var(--color-text-primary, #ffffff)',
  '#94a3b8': 'var(--color-text-secondary, #94a3b8)',
  '#64748b': 'var(--color-text-tertiary, #64748b)',
  '#475569': 'var(--color-text-muted, #475569)',
  '#334155': 'var(--color-text-muted, #334155)', // alternate muted
  
  // Accent - Lime
  '#d4ff00': 'var(--color-accent-lime, #d4ff00)',
  '#bfe600': 'var(--color-accent-lime-dark, #bfe600)',
  
  // Accent - Teal
  '#10b981': 'var(--color-accent-teal, #10b981)',
  '#34d399': 'var(--color-accent-teal-light, #34d399)',
  '#059669': 'var(--color-accent-teal, #059669)', // alternate teal
  
  // Accent - Blue
  '#3b82f6': 'var(--color-accent-blue, #3b82f6)',
  '#60a5fa': 'var(--color-accent-blue-light, #60a5fa)',
  '#2563eb': 'var(--color-accent-blue, #2563eb)', // alternate blue
  
  // Accent - Amber/Warning
  '#f59e0b': 'var(--color-accent-amber, #f59e0b)',
  '#fbbf24': 'var(--color-accent-amber-light, #fbbf24)',
  
  // Semantic
  '#22c55e': 'var(--color-success, #22c55e)',
  '#ef4444': 'var(--color-error, #ef4444)',
  '#dc2626': 'var(--color-error, #dc2626)', // alternate error
  
  // Common grays
  '#000000': 'var(--color-bg-base, #000000)',
  '#000': 'var(--color-bg-base, #000000)',
  '#111827': 'var(--color-bg-base, #111827)',
  '#1f2937': 'var(--color-bg-elevated, #1f2937)',
  '#374151': 'var(--color-text-muted, #374151)',
  '#4b5563': 'var(--color-text-muted, #4b5563)',
  '#6b7280': 'var(--color-text-tertiary, #6b7280)',
  '#9ca3af': 'var(--color-text-secondary, #9ca3af)',
  '#d1d5db': 'var(--color-border-default, #d1d5db)',
  '#e5e7eb': 'var(--color-border-subtle, #e5e7eb)',
  '#f3f4f6': 'var(--color-bg-card, #f3f4f6)',
  '#f9fafb': 'var(--color-bg-base, #f9fafb)',
};

// Parse arguments
const args = process.argv.slice(2);
const outputJson = args.includes('--json');
const fixColors = args.includes('--fix-colors');
const pathArg = args.find(a => a.startsWith('--path='));
const scanPath = pathArg ? pathArg.split('=')[1] : projectRoot;

// Results storage
const results = {
  hardcodedColors: [],
  maxWidthQueries: [],
  summary: {
    totalFiles: 0,
    filesWithHardcodedColors: 0,
    filesWithMaxWidth: 0,
    totalHardcodedColors: 0,
    totalMaxWidthQueries: 0,
  }
};

/**
 * Check if a path should be ignored
 */
function shouldIgnore(filePath) {
  return IGNORE_DIRS.some(dir => filePath.includes(path.sep + dir + path.sep) || filePath.includes(path.sep + dir));
}

/**
 * Find all CSS files in a directory
 */
function findCssFiles(dir) {
  const files = [];
  
  function walkDir(currentPath) {
    if (shouldIgnore(currentPath)) return;
    
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile() && CSS_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  walkDir(dir);
  return files;
}

/**
 * Find hardcoded hex colors not wrapped in var()
 */
function findHardcodedColors(content, filePath) {
  const issues = [];
  const lines = content.split('\n');
  
  // Regex to find hex colors
  const hexPattern = /#([0-9a-fA-F]{3}){1,2}\b/g;
  
  lines.forEach((line, lineIndex) => {
    // Skip comments
    if (line.trim().startsWith('/*') || line.trim().startsWith('*') || line.trim().startsWith('//')) {
      return;
    }
    
    // Skip lines that already use var() with fallback
    if (line.includes('var(') && line.includes(',')) {
      return;
    }
    
    // Skip lines inside url()
    if (line.includes('url(')) {
      return;
    }
    
    let match;
    while ((match = hexPattern.exec(line)) !== null) {
      const hex = match[0].toLowerCase();
      const normalizedHex = hex.length === 4 
        ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
        : hex;
      
      issues.push({
        file: path.relative(projectRoot, filePath),
        line: lineIndex + 1,
        column: match.index + 1,
        color: match[0],
        normalizedColor: normalizedHex,
        suggestedToken: COLOR_TOKEN_MAP[normalizedHex] || `var(--color-unknown, ${normalizedHex})`,
        lineContent: line.trim(),
      });
    }
  });
  
  return issues;
}

/**
 * Find max-width media queries
 */
function findMaxWidthQueries(content, filePath) {
  const issues = [];
  const lines = content.split('\n');
  
  // Regex for max-width media queries
  const maxWidthPattern = /@media[^{]*max-width\s*:\s*(\d+)(px|em|rem)?/gi;
  
  lines.forEach((line, lineIndex) => {
    let match;
    while ((match = maxWidthPattern.exec(line)) !== null) {
      const breakpoint = match[1] + (match[2] || 'px');
      
      issues.push({
        file: path.relative(projectRoot, filePath),
        line: lineIndex + 1,
        breakpoint,
        lineContent: line.trim(),
        suggestion: `Convert to min-width: ${match[1]}px (mobile-first)`,
      });
    }
  });
  
  return issues;
}

/**
 * Process a single CSS file
 */
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const colorIssues = findHardcodedColors(content, filePath);
  const maxWidthIssues = findMaxWidthQueries(content, filePath);
  
  if (colorIssues.length > 0) {
    results.hardcodedColors.push(...colorIssues);
    results.summary.filesWithHardcodedColors++;
    results.summary.totalHardcodedColors += colorIssues.length;
  }
  
  if (maxWidthIssues.length > 0) {
    results.maxWidthQueries.push(...maxWidthIssues);
    results.summary.filesWithMaxWidth++;
    results.summary.totalMaxWidthQueries += maxWidthIssues.length;
  }
  
  results.summary.totalFiles++;
}

/**
 * Generate summary report
 */
function generateReport() {
  if (outputJson) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('CSS TOKEN AUDIT REPORT');
  console.log('='.repeat(80));
  
  console.log('\n📊 SUMMARY');
  console.log('-'.repeat(40));
  console.log(`Total CSS files scanned: ${results.summary.totalFiles}`);
  console.log(`Files with hardcoded colors: ${results.summary.filesWithHardcodedColors}`);
  console.log(`Total hardcoded colors: ${results.summary.totalHardcodedColors}`);
  console.log(`Files with max-width queries: ${results.summary.filesWithMaxWidth}`);
  console.log(`Total max-width queries: ${results.summary.totalMaxWidthQueries}`);
  
  // Group hardcoded colors by file
  if (results.hardcodedColors.length > 0) {
    console.log('\n\n🎨 HARDCODED COLORS (Top 20 files)');
    console.log('-'.repeat(40));
    
    const byFile = {};
    results.hardcodedColors.forEach(issue => {
      if (!byFile[issue.file]) byFile[issue.file] = [];
      byFile[issue.file].push(issue);
    });
    
    const sortedFiles = Object.entries(byFile)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 20);
    
    sortedFiles.forEach(([file, issues]) => {
      console.log(`\n📁 ${file} (${issues.length} issues)`);
      issues.slice(0, 5).forEach(issue => {
        console.log(`   Line ${issue.line}: ${issue.color} → ${issue.suggestedToken}`);
      });
      if (issues.length > 5) {
        console.log(`   ... and ${issues.length - 5} more`);
      }
    });
  }
  
  // Group max-width queries by file
  if (results.maxWidthQueries.length > 0) {
    console.log('\n\n📱 MAX-WIDTH MEDIA QUERIES (Desktop-First Anti-Pattern)');
    console.log('-'.repeat(40));
    
    const byFile = {};
    results.maxWidthQueries.forEach(issue => {
      if (!byFile[issue.file]) byFile[issue.file] = [];
      byFile[issue.file].push(issue);
    });
    
    const sortedFiles = Object.entries(byFile)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 20);
    
    sortedFiles.forEach(([file, issues]) => {
      console.log(`\n📁 ${file} (${issues.length} queries)`);
      issues.slice(0, 3).forEach(issue => {
        console.log(`   Line ${issue.line}: max-width: ${issue.breakpoint}`);
      });
      if (issues.length > 3) {
        console.log(`   ... and ${issues.length - 3} more`);
      }
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('END OF REPORT');
  console.log('='.repeat(80) + '\n');
  
  // Color frequency analysis
  console.log('\n🔢 COLOR FREQUENCY ANALYSIS');
  console.log('-'.repeat(40));
  
  const colorFrequency = {};
  results.hardcodedColors.forEach(issue => {
    const key = issue.normalizedColor;
    if (!colorFrequency[key]) {
      colorFrequency[key] = {
        count: 0,
        token: issue.suggestedToken,
      };
    }
    colorFrequency[key].count++;
  });
  
  const sortedColors = Object.entries(colorFrequency)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20);
  
  sortedColors.forEach(([color, data]) => {
    console.log(`${color}: ${data.count} occurrences → ${data.token}`);
  });
}

/**
 * Generate fix script for colors
 */
function generateFixScript() {
  console.log('\n// Auto-generated fix commands');
  console.log('// Review carefully before running\n');
  
  const byFile = {};
  results.hardcodedColors.forEach(issue => {
    if (!byFile[issue.file]) byFile[issue.file] = [];
    byFile[issue.file].push(issue);
  });
  
  Object.entries(byFile).forEach(([file]) => {
    console.log(`// File: ${file}`);
    console.log(`// Run: node scripts/fix-hardcoded-colors.mjs "${file}"`);
    console.log('');
  });
}

// Main execution
console.log('🔍 Scanning CSS files...\n');

const cssFiles = findCssFiles(scanPath);
console.log(`Found ${cssFiles.length} CSS files\n`);

cssFiles.forEach(file => {
  processFile(file);
});

generateReport();

if (fixColors) {
  generateFixScript();
}

// Exit with error code if issues found (for CI)
if (results.summary.totalHardcodedColors > 0 || results.summary.totalMaxWidthQueries > 0) {
  process.exit(1);
}
