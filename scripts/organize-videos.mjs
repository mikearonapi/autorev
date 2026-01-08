#!/usr/bin/env node
/**
 * Organize existing generated videos into proper folder structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const VIDEOS_DIR = path.join(PROJECT_ROOT, 'generated-videos');

// Get today's date for organizing today's videos
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');

const ARCHIVE_DIR = path.join(VIDEOS_DIR, 'archive', `${year}-${month}-${day}-legacy`);
const TODAY_DIR = path.join(VIDEOS_DIR, String(year), month, day);

// Ensure directories exist
[ARCHIVE_DIR, TODAY_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

console.log(`\n${'═'.repeat(65)}`);
console.log(`📁 ORGANIZING GENERATED VIDEOS`);
console.log(`${'═'.repeat(65)}`);
console.log(`   Today's videos → ${TODAY_DIR}`);
console.log(`   Legacy files   → ${ARCHIVE_DIR}`);
console.log(`${'═'.repeat(65)}\n`);

// Find all videos in social-ads folder (legacy location)
const socialAdsDir = path.join(VIDEOS_DIR, 'social-ads');
const scheduledDir = path.join(VIDEOS_DIR, 'scheduled');

let moved = 0;
let archived = 0;

// Process social-ads directory
if (fs.existsSync(socialAdsDir)) {
  const items = fs.readdirSync(socialAdsDir);
  
  for (const item of items) {
    const itemPath = path.join(socialAdsDir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isFile() && item.endsWith('.mp4')) {
      // Check if created today
      const createdToday = stat.mtime.toISOString().startsWith(`${year}-${month}-${day}`);
      
      if (createdToday) {
        // Move to today's organized folder
        const destPath = path.join(TODAY_DIR, item);
        fs.renameSync(itemPath, destPath);
        console.log(`   ✅ Moved to today: ${item}`);
        moved++;
      } else {
        // Archive older files
        const destPath = path.join(ARCHIVE_DIR, item);
        fs.renameSync(itemPath, destPath);
        console.log(`   📦 Archived: ${item}`);
        archived++;
      }
    } else if (stat.isDirectory()) {
      // Move entire campaign folders to archive
      const destPath = path.join(ARCHIVE_DIR, item);
      fs.renameSync(itemPath, destPath);
      console.log(`   📦 Archived folder: ${item}/`);
      archived++;
    }
  }
}

// Process scheduled directory
if (fs.existsSync(scheduledDir)) {
  const items = fs.readdirSync(scheduledDir);
  
  for (const item of items) {
    const itemPath = path.join(scheduledDir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isFile() && item.endsWith('.mp4')) {
      const createdToday = stat.mtime.toISOString().startsWith(`${year}-${month}-${day}`);
      
      if (createdToday) {
        const destPath = path.join(TODAY_DIR, item);
        fs.renameSync(itemPath, destPath);
        console.log(`   ✅ Moved to today: ${item}`);
        moved++;
      } else {
        const destPath = path.join(ARCHIVE_DIR, item);
        fs.renameSync(itemPath, destPath);
        console.log(`   📦 Archived: ${item}`);
        archived++;
      }
    }
  }
}

console.log(`\n${'═'.repeat(65)}`);
console.log(`📊 ORGANIZATION COMPLETE`);
console.log(`${'═'.repeat(65)}`);
console.log(`   ✅ Moved to today's folder: ${moved} files`);
console.log(`   📦 Archived legacy files:   ${archived} items`);
console.log(`\n📁 New structure:`);
console.log(`   generated-videos/`);
console.log(`   ├── ${year}/`);
console.log(`   │   └── ${month}/`);
console.log(`   │       └── ${day}/  ← Today's videos`);
console.log(`   └── archive/`);
console.log(`       └── ${year}-${month}-${day}-legacy/  ← Previous videos`);
console.log(`${'═'.repeat(65)}\n`);
