#!/usr/bin/env node
/**
 * Upload Database Backup to Remote Storage
 * 
 * Uploads the latest backup to Supabase Storage or other destinations.
 * Can be run after backup-database.mjs to store backups offsite.
 * 
 * Usage:
 *   node scripts/backup-to-storage.mjs                    # Upload latest backup
 *   node scripts/backup-to-storage.mjs --file backup.sql  # Upload specific file
 *   node scripts/backup-to-storage.mjs --list             # List remote backups
 *   node scripts/backup-to-storage.mjs --prune            # Delete old remote backups
 * 
 * Prerequisites:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment
 *   - 'backups' bucket must exist in Supabase Storage
 * 
 * Setup:
 *   1. Go to Supabase Dashboard → Storage
 *   2. Create a bucket called 'backups' (private, not public)
 *   3. Run this script after each backup
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from 'util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
// Store backups in dedicated folder outside the project (not in git)
const BACKUP_DIR = '/Volumes/10TB External HD/01. Apps - WORKING/Database BACKUPs';

// Configuration
const CONFIG = {
  bucket: 'backups',                    // Supabase Storage bucket name
  remoteFolder: 'database',             // Folder within the bucket
  maxRemoteBackups: 14,                 // Keep 2 weeks of backups in storage
  maxUploadSizeMB: 200,                 // Max file size to upload (MB)
};

// Parse command line arguments
const { values: args } = parseArgs({
  options: {
    'file': { type: 'string', short: 'f', default: '' },
    'list': { type: 'boolean', short: 'l', default: false },
    'prune': { type: 'boolean', default: false },
    'help': { type: 'boolean', short: 'h', default: false },
  },
  allowPositionals: false,
});

if (args.help) {
  console.log(`
Upload Database Backup to Supabase Storage

Usage:
  node scripts/backup-to-storage.mjs [options]

Options:
  -f, --file <path>  Upload a specific backup file
  -l, --list         List all remote backups
  --prune            Delete old remote backups (keeps last ${CONFIG.maxRemoteBackups})
  -h, --help         Show this help message

Setup:
  1. Create a 'backups' bucket in Supabase Storage (Dashboard → Storage)
  2. Make sure the bucket is private (not public)
  3. Run: node scripts/backup-database.mjs && node scripts/backup-to-storage.mjs
  `);
  process.exit(0);
}

/**
 * Get Supabase client with service role key
 */
function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('❌ Missing Supabase credentials.');
    console.error('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.');
    process.exit(1);
  }

  return createClient(url, key);
}

/**
 * Get size of file in human-readable format
 */
function getFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Find the most recent local backup
 */
function findLatestBackup() {
  if (!existsSync(BACKUP_DIR)) {
    console.error('❌ Backup directory not found. Run backup-database.mjs first.');
    process.exit(1);
  }

  const files = readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('autorev_') && (f.endsWith('.sql') || f.endsWith('.sql.gz')))
    .map(f => ({
      name: f,
      path: join(BACKUP_DIR, f),
      mtime: statSync(join(BACKUP_DIR, f)).mtime,
      size: statSync(join(BACKUP_DIR, f)).size,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (files.length === 0) {
    console.error('❌ No backups found. Run backup-database.mjs first.');
    process.exit(1);
  }

  return files[0];
}

/**
 * Upload a backup file to Supabase Storage
 */
async function uploadBackup(filePath) {
  const supabase = getSupabaseClient();
  const fileName = basename(filePath);
  const remotePath = `${CONFIG.remoteFolder}/${fileName}`;
  
  // Check file size
  const stats = statSync(filePath);
  const sizeMB = stats.size / (1024 * 1024);
  
  if (sizeMB > CONFIG.maxUploadSizeMB) {
    console.error(`❌ File too large: ${getFileSize(stats.size)}`);
    console.error(`   Maximum allowed: ${CONFIG.maxUploadSizeMB} MB`);
    console.error('   Consider using --schema-only for smaller backups');
    process.exit(1);
  }

  console.log(`📤 Uploading ${fileName} (${getFileSize(stats.size)})...`);

  // Read file
  const fileData = readFileSync(filePath);

  // Determine content type
  const contentType = filePath.endsWith('.gz') 
    ? 'application/gzip' 
    : 'application/sql';

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(CONFIG.bucket)
    .upload(remotePath, fileData, {
      contentType,
      upsert: true, // Overwrite if exists
    });

  if (error) {
    // Check if bucket doesn't exist
    if (error.message.includes('Bucket not found') || error.statusCode === '404') {
      console.error(`❌ Bucket '${CONFIG.bucket}' not found.`);
      console.error('   Create it in Supabase Dashboard → Storage → New bucket');
      console.error(`   Name: ${CONFIG.bucket}`);
      console.error('   Public: No (private)');
      process.exit(1);
    }
    throw new Error(`Upload failed: ${error.message}`);
  }

  console.log(`✅ Uploaded successfully!`);
  console.log(`   📁 Remote path: ${CONFIG.bucket}/${remotePath}`);
  
  return data;
}

/**
 * List all remote backups
 */
async function listRemoteBackups() {
  const supabase = getSupabaseClient();
  
  console.log(`📋 Remote backups in '${CONFIG.bucket}/${CONFIG.remoteFolder}/':`);
  console.log('');

  const { data, error } = await supabase.storage
    .from(CONFIG.bucket)
    .list(CONFIG.remoteFolder, {
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    if (error.message.includes('Bucket not found')) {
      console.error(`❌ Bucket '${CONFIG.bucket}' not found.`);
      process.exit(1);
    }
    throw new Error(`List failed: ${error.message}`);
  }

  if (!data || data.length === 0) {
    console.log('   (No backups found)');
    return [];
  }

  // Filter to only .sql and .sql.gz files
  const backups = data.filter(f => 
    f.name.endsWith('.sql') || f.name.endsWith('.sql.gz')
  );

  for (const file of backups) {
    const size = file.metadata?.size ? getFileSize(file.metadata.size) : 'unknown size';
    const date = file.created_at ? new Date(file.created_at).toLocaleString() : 'unknown date';
    console.log(`   📁 ${file.name}`);
    console.log(`      Size: ${size} | Created: ${date}`);
  }

  console.log('');
  console.log(`   Total: ${backups.length} backup(s)`);

  return backups;
}

/**
 * Delete old remote backups
 */
async function pruneRemoteBackups() {
  const supabase = getSupabaseClient();
  
  console.log(`🧹 Pruning old remote backups...`);
  console.log(`   Keeping last ${CONFIG.maxRemoteBackups} backups`);
  console.log('');

  const { data, error } = await supabase.storage
    .from(CONFIG.bucket)
    .list(CONFIG.remoteFolder, {
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    throw new Error(`List failed: ${error.message}`);
  }

  // Filter to only backup files
  const backups = (data || []).filter(f => 
    f.name.endsWith('.sql') || f.name.endsWith('.sql.gz')
  );

  if (backups.length <= CONFIG.maxRemoteBackups) {
    console.log(`   No cleanup needed (${backups.length} backups)`);
    return;
  }

  const toDelete = backups.slice(CONFIG.maxRemoteBackups);
  console.log(`   Deleting ${toDelete.length} old backup(s)...`);

  for (const file of toDelete) {
    const remotePath = `${CONFIG.remoteFolder}/${file.name}`;
    const { error: deleteError } = await supabase.storage
      .from(CONFIG.bucket)
      .remove([remotePath]);

    if (deleteError) {
      console.error(`   ❌ Failed to delete ${file.name}: ${deleteError.message}`);
    } else {
      console.log(`   ✓ Deleted: ${file.name}`);
    }
  }

  console.log('');
  console.log(`✅ Cleanup complete`);
}

/**
 * Main function
 */
async function main() {
  console.log('☁️  Supabase Storage Backup Upload');
  console.log('═'.repeat(50));
  console.log('');

  try {
    // Handle list mode
    if (args.list) {
      await listRemoteBackups();
      return;
    }

    // Handle prune mode
    if (args.prune) {
      await pruneRemoteBackups();
      return;
    }

    // Find file to upload
    let backupFile;
    if (args.file) {
      const filePath = args.file.startsWith('/') 
        ? args.file 
        : join(BACKUP_DIR, args.file);
      
      if (!existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        process.exit(1);
      }
      
      backupFile = {
        name: basename(filePath),
        path: filePath,
        size: statSync(filePath).size,
      };
    } else {
      backupFile = findLatestBackup();
      console.log(`📋 Found latest backup: ${backupFile.name}`);
      console.log('');
    }

    // Upload
    await uploadBackup(backupFile.path);

    // Prune old backups
    console.log('');
    await pruneRemoteBackups();

    console.log('');
    console.log('═'.repeat(50));
    console.log('✅ Backup upload complete!');
    console.log('');
    console.log('To download/restore:');
    console.log('  1. Go to Supabase Dashboard → Storage → backups');
    console.log('  2. Download the desired backup file');
    console.log('  3. Restore: psql $DATABASE_URL < backup.sql');

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
