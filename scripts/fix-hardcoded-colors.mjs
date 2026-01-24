#!/usr/bin/env node
/**
 * Fix Hardcoded Colors Script
 * 
 * Automatically replaces hardcoded hex colors with CSS variable tokens.
 * Uses the color-token-map.json for mappings.
 * 
 * Usage:
 *   node scripts/fix-hardcoded-colors.mjs <file-or-directory>
 *   node scripts/fix-hardcoded-colors.mjs --dry-run <file>
 *   node scripts/fix-hardcoded-colors.mjs --all
 * 
 * Options:
 *   --dry-run    Show changes without modifying files
 *   --all        Process all CSS files in the project
 *   --backup     Create backup files before modifying
 *   --verbose    Show detailed output
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Load color mappings
const colorMapPath = path.join(__dirname, 'color-token-map.json');
const colorMapData = JSON.parse(fs.readFileSync(colorMapPath, 'utf-8'));
const COLOR_MAP = colorMapData.flatMap;

// Configuration
const IGNORE_DIRS = ['node_modules', '.next', 'out', 'public', '.git'];
const CSS_EXTENSIONS = ['.css', '.module.css'];

// Parse arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const processAll = args.includes('--all');
const createBackup = args.includes('--backup');
const verbose = args.includes('--verbose');
const targetPath = args.find(a => !a.startsWith('--'));

// Statistics
const stats = {
  filesProcessed: 0,
  filesModified: 0,
  replacementsMade: 0,
  errors: [],
};

/**
 * Normalize hex color to lowercase 6-digit format
 */
function normalizeHex(hex) {
  hex = hex.toLowerCase();
  if (hex.length === 4) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex;
}

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
      stats.errors.push(`Error reading directory ${currentPath}: ${err.message}`);
    }
  }
  
  walkDir(dir);
  return files;
}

/**
 * Process a single CSS file
 */
function processFile(filePath) {
  const relativePath = path.relative(projectRoot, filePath);
  
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    let replacements = [];
    
    // Process line by line to handle context better
    const lines = content.split('\n');
    const processedLines = lines.map((line, lineIndex) => {
      // Skip comments
      if (line.trim().startsWith('/*') || line.trim().startsWith('*') || line.trim().startsWith('//')) {
        return line;
      }
      
      // Skip lines that already use var() with the color
      if (line.includes('var(--color-')) {
        return line;
      }
      
      // Skip lines inside url()
      if (line.includes('url(') && line.includes('#')) {
        // Only skip if the hex is inside url()
        const urlMatch = line.match(/url\([^)]*#[0-9a-fA-F]+[^)]*\)/);
        if (urlMatch) {
          return line;
        }
      }
      
      // Find and replace hex colors
      const hexPattern = /#([0-9a-fA-F]{3}){1,2}\b/g;
      let match;
      let newLine = line;
      
      while ((match = hexPattern.exec(line)) !== null) {
        const originalHex = match[0];
        const normalizedHex = normalizeHex(originalHex);
        
        if (COLOR_MAP[normalizedHex]) {
          const replacement = COLOR_MAP[normalizedHex];
          
          // Check if this hex is not already part of a var() fallback
          const beforeHex = line.substring(0, match.index);
          if (beforeHex.includes('var(') && beforeHex.includes(',')) {
            // This hex is likely a fallback value, skip
            continue;
          }
          
          newLine = newLine.replace(new RegExp(escapeRegex(originalHex), 'i'), replacement);
          replacements.push({
            line: lineIndex + 1,
            original: originalHex,
            replacement: replacement,
          });
        } else if (verbose) {
          console.log(`  [Unknown color] ${relativePath}:${lineIndex + 1} - ${originalHex}`);
        }
      }
      
      return newLine;
    });
    
    const newContent = processedLines.join('\n');
    
    if (newContent !== originalContent) {
      stats.filesModified++;
      stats.replacementsMade += replacements.length;
      
      if (dryRun) {
        console.log(`\n📁 ${relativePath} (${replacements.length} replacements)`);
        replacements.forEach(r => {
          console.log(`   Line ${r.line}: ${r.original} → ${r.replacement}`);
        });
      } else {
        // Create backup if requested
        if (createBackup) {
          fs.writeFileSync(filePath + '.bak', originalContent);
        }
        
        // Write the modified content
        fs.writeFileSync(filePath, newContent);
        console.log(`✅ ${relativePath} (${replacements.length} replacements)`);
        
        if (verbose) {
          replacements.forEach(r => {
            console.log(`   Line ${r.line}: ${r.original} → ${r.replacement}`);
          });
        }
      }
    } else if (verbose) {
      console.log(`⏭️  ${relativePath} (no changes needed)`);
    }
    
    stats.filesProcessed++;
  } catch (err) {
    stats.errors.push(`Error processing ${filePath}: ${err.message}`);
    console.error(`❌ Error processing ${relativePath}: ${err.message}`);
  }
}

/**
 * Escape special regex characters
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Print usage
 */
function printUsage() {
  console.log(`
Fix Hardcoded Colors Script

Usage:
  node scripts/fix-hardcoded-colors.mjs <file-or-directory>
  node scripts/fix-hardcoded-colors.mjs --dry-run <file>
  node scripts/fix-hardcoded-colors.mjs --all

Options:
  --dry-run    Show changes without modifying files
  --all        Process all CSS files in the project
  --backup     Create backup files before modifying
  --verbose    Show detailed output

Examples:
  node scripts/fix-hardcoded-colors.mjs components/Header.module.css
  node scripts/fix-hardcoded-colors.mjs --dry-run components/
  node scripts/fix-hardcoded-colors.mjs --all --dry-run
  node scripts/fix-hardcoded-colors.mjs --all --backup
`);
}

// Main execution
console.log('🎨 Fix Hardcoded Colors Script');
console.log('=' .repeat(50));

if (dryRun) {
  console.log('🔍 DRY RUN MODE - No files will be modified\n');
}

if (!targetPath && !processAll) {
  printUsage();
  process.exit(1);
}

let filesToProcess = [];

if (processAll) {
  console.log('📂 Scanning all CSS files in project...\n');
  filesToProcess = findCssFiles(projectRoot);
} else {
  const targetFullPath = path.resolve(projectRoot, targetPath);
  
  if (!fs.existsSync(targetFullPath)) {
    console.error(`❌ Path not found: ${targetPath}`);
    process.exit(1);
  }
  
  const stat = fs.statSync(targetFullPath);
  
  if (stat.isDirectory()) {
    console.log(`📂 Scanning directory: ${targetPath}\n`);
    filesToProcess = findCssFiles(targetFullPath);
  } else if (stat.isFile()) {
    if (CSS_EXTENSIONS.some(ext => targetFullPath.endsWith(ext))) {
      filesToProcess = [targetFullPath];
    } else {
      console.error(`❌ Not a CSS file: ${targetPath}`);
      process.exit(1);
    }
  }
}

console.log(`Found ${filesToProcess.length} CSS files to process\n`);

// Process each file
filesToProcess.forEach(processFile);

// Print summary
console.log('\n' + '=' .repeat(50));
console.log('📊 SUMMARY');
console.log('-'.repeat(30));
console.log(`Files processed: ${stats.filesProcessed}`);
console.log(`Files modified: ${stats.filesModified}`);
console.log(`Total replacements: ${stats.replacementsMade}`);

if (stats.errors.length > 0) {
  console.log(`\n❌ Errors: ${stats.errors.length}`);
  stats.errors.forEach(err => console.log(`   ${err}`));
}

if (dryRun && stats.replacementsMade > 0) {
  console.log('\n💡 Run without --dry-run to apply changes');
}

console.log('');
