#!/usr/bin/env node
/**
 * Analyze Vercel Blob Usage
 * 
 * Checks every image in Vercel Blob storage against the codebase
 * to determine which images are actually used vs orphaned.
 * 
 * Usage:
 *   node scripts/analyze-blob-usage.mjs
 *   node scripts/analyze-blob-usage.mjs --verbose
 *   node scripts/analyze-blob-usage.mjs --output report.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load environment variables
function loadEnv() {
  const envPath = path.join(PROJECT_ROOT, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        let value = valueParts.join('=');
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (key && value) process.env[key] = value;
      }
    }
  }
}

loadEnv();

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const VERBOSE = process.argv.includes('--verbose');
const OUTPUT_FILE = process.argv.find(a => a.startsWith('--output='))?.split('=')[1];

// Folders to search for references
const SEARCH_DIRS = ['app', 'components', 'lib', 'hooks', 'data', 'styles'];

// File extensions to search
const SEARCH_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.css', '.json', '.md'];

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

/**
 * Search for a string in the codebase using ripgrep
 */
function searchInCodebase(searchTerm) {
  try {
    // Escape special regex characters
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Use ripgrep for fast searching
    const result = execSync(
      `rg -l --type-add 'web:*.{js,jsx,ts,tsx,css,json,md}' -t web "${escaped}" ${SEARCH_DIRS.join(' ')} 2>/dev/null || true`,
      { cwd: PROJECT_ROOT, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
    
    return result.trim().split('\n').filter(Boolean);
  } catch (e) {
    return [];
  }
}

/**
 * Check if a blob is referenced in the codebase
 */
function checkBlobUsage(blob) {
  const pathname = blob.pathname;
  const filename = path.basename(pathname);
  const filenameNoExt = path.basename(pathname, path.extname(pathname));
  
  // Different search strategies
  const searchStrategies = [
    // Full pathname
    pathname,
    // Filename only
    filename,
    // Filename without extension (for dynamic paths like cars/${slug}/hero.webp)
    filenameNoExt,
  ];
  
  // For cars/ folder, check if it's a dynamic reference
  if (pathname.startsWith('cars/')) {
    const parts = pathname.split('/');
    if (parts.length >= 3) {
      // cars/slug/type.webp -> check for cars/${slug}/type or cars/${...}/type
      const imageType = parts[2]; // e.g., "hero.webp"
      searchStrategies.push(`cars/\${`); // Dynamic pattern
      searchStrategies.push(`/cars/`);
    }
  }
  
  // For garage/ folder, similar dynamic check
  if (pathname.startsWith('garage/')) {
    searchStrategies.push(`garage/\${`);
    searchStrategies.push(`/garage/`);
  }
  
  // For articles/, check for article image patterns
  if (pathname.startsWith('articles/')) {
    searchStrategies.push(`articles/\${`);
    searchStrategies.push(`/articles/`);
    searchStrategies.push(`hero_image_url`);
  }
  
  // For user-uploads/, check for user upload patterns
  if (pathname.startsWith('user-uploads/')) {
    searchStrategies.push(`user-uploads/`);
    searchStrategies.push(`blob_url`);
    searchStrategies.push(`blobUrl`);
  }
  
  for (const term of searchStrategies) {
    const matches = searchInCodebase(term);
    if (matches.length > 0) {
      return { used: true, matches, searchTerm: term };
    }
  }
  
  return { used: false, matches: [], searchTerm: null };
}

/**
 * Analyze usage patterns for a folder
 */
function analyzeFolderPattern(folderName, blobs) {
  // Check if there's a dynamic reference pattern for this folder
  const dynamicPatterns = [
    `${folderName}/\${`,
    `${folderName}/\`\${`,
    `'${folderName}/'`,
    `"${folderName}/"`,
    `/${folderName}/`,
  ];
  
  for (const pattern of dynamicPatterns) {
    const matches = searchInCodebase(pattern);
    if (matches.length > 0) {
      return { 
        dynamicUsage: true, 
        pattern,
        matches,
        confidence: 'high'
      };
    }
  }
  
  return { dynamicUsage: false, pattern: null, matches: [], confidence: 'low' };
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           VERCEL BLOB USAGE ANALYSIS                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  if (!BLOB_TOKEN) {
    console.error('❌ ERROR: BLOB_READ_WRITE_TOKEN not found');
    process.exit(1);
  }
  
  const { list } = await import('@vercel/blob');
  
  // Get all blobs
  console.log('📋 Fetching all blobs from Vercel...');
  let allBlobs = [];
  let cursor;
  do {
    const result = await list({ token: BLOB_TOKEN, cursor, limit: 1000 });
    allBlobs = allBlobs.concat(result.blobs);
    cursor = result.cursor;
  } while (cursor);
  
  console.log(`   Found ${allBlobs.length} blobs\n`);
  
  // Group by folder
  const folders = {};
  allBlobs.forEach(b => {
    const folder = b.pathname.split('/')[0];
    if (!folders[folder]) folders[folder] = [];
    folders[folder].push(b);
  });
  
  // Analyze each folder
  console.log('🔍 Analyzing usage patterns...\n');
  
  const results = {
    totalBlobs: allBlobs.length,
    totalSize: allBlobs.reduce((s, b) => s + b.size, 0),
    folders: {},
    unusedBlobs: [],
    dynamicFolders: [],
    staticUsed: [],
    summary: {}
  };
  
  for (const [folderName, blobs] of Object.entries(folders)) {
    const folderSize = blobs.reduce((s, b) => s + b.size, 0);
    
    console.log(`📁 ${folderName}/ (${blobs.length} files, ${formatBytes(folderSize)})`);
    
    // First check for dynamic usage pattern
    const folderPattern = analyzeFolderPattern(folderName, blobs);
    
    if (folderPattern.dynamicUsage) {
      console.log(`   ✅ Dynamic usage found: ${folderPattern.pattern}`);
      console.log(`      Referenced in: ${folderPattern.matches.slice(0, 3).join(', ')}${folderPattern.matches.length > 3 ? '...' : ''}`);
      
      results.folders[folderName] = {
        count: blobs.length,
        size: folderSize,
        usageType: 'dynamic',
        pattern: folderPattern.pattern,
        allUsed: true,
        unusedCount: 0
      };
      results.dynamicFolders.push(folderName);
    } else {
      // Check individual files
      let usedCount = 0;
      let unusedInFolder = [];
      
      for (const blob of blobs) {
        const usage = checkBlobUsage(blob);
        if (usage.used) {
          usedCount++;
          if (VERBOSE) {
            console.log(`   ✅ ${blob.pathname} - found in ${usage.matches[0]}`);
          }
        } else {
          unusedInFolder.push(blob);
          if (VERBOSE) {
            console.log(`   ❌ ${blob.pathname} - NOT FOUND`);
          }
        }
      }
      
      const unusedCount = blobs.length - usedCount;
      const unusedSize = unusedInFolder.reduce((s, b) => s + b.size, 0);
      
      if (unusedCount > 0) {
        console.log(`   ⚠️  ${unusedCount} potentially unused (${formatBytes(unusedSize)})`);
        results.unusedBlobs.push(...unusedInFolder);
      } else {
        console.log(`   ✅ All ${blobs.length} files referenced`);
      }
      
      results.folders[folderName] = {
        count: blobs.length,
        size: folderSize,
        usageType: 'static',
        usedCount,
        unusedCount,
        unusedSize,
        unusedFiles: unusedInFolder.map(b => b.pathname)
      };
    }
    
    console.log('');
  }
  
  // Summary
  const unusedSize = results.unusedBlobs.reduce((s, b) => s + b.size, 0);
  
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                        SUMMARY                               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log(`Total blobs: ${results.totalBlobs}`);
  console.log(`Total size: ${formatBytes(results.totalSize)}`);
  console.log('');
  console.log(`Dynamic folders (all files used): ${results.dynamicFolders.length}`);
  results.dynamicFolders.forEach(f => console.log(`  - ${f}/`));
  console.log('');
  console.log(`Potentially unused blobs: ${results.unusedBlobs.length}`);
  console.log(`Potentially unused size: ${formatBytes(unusedSize)}`);
  
  if (results.unusedBlobs.length > 0) {
    console.log('\n📋 Unused blobs by folder:');
    const unusedByFolder = {};
    results.unusedBlobs.forEach(b => {
      const folder = b.pathname.split('/')[0];
      if (!unusedByFolder[folder]) unusedByFolder[folder] = [];
      unusedByFolder[folder].push(b);
    });
    
    Object.entries(unusedByFolder)
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([folder, blobs]) => {
        const size = blobs.reduce((s, b) => s + b.size, 0);
        console.log(`\n   ${folder}/ - ${blobs.length} unused (${formatBytes(size)})`);
        if (blobs.length <= 10) {
          blobs.forEach(b => console.log(`      - ${b.pathname}`));
        } else {
          blobs.slice(0, 5).forEach(b => console.log(`      - ${b.pathname}`));
          console.log(`      ... and ${blobs.length - 5} more`);
        }
      });
  }
  
  // Save report if requested
  if (OUTPUT_FILE) {
    const reportPath = path.join(PROJECT_ROOT, OUTPUT_FILE);
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Full report saved to: ${OUTPUT_FILE}`);
  }
  
  console.log('\n💡 Note: "Dynamic folders" contain images loaded via dynamic paths');
  console.log('   (e.g., cars/${slug}/hero.webp) - all files are potentially used.');
  console.log('   Manual verification recommended for "potentially unused" items.');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
