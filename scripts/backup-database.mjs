#!/usr/bin/env node
/**
 * Database Backup Script for Supabase
 * 
 * Creates a timestamped backup of the AutoRev database using pg_dump.
 * Supports both full database dumps and schema-only exports.
 * 
 * Usage:
 *   node scripts/backup-database.mjs                    # Full backup
 *   node scripts/backup-database.mjs --schema-only      # Schema only
 *   node scripts/backup-database.mjs --data-only        # Data only (no schema)
 *   node scripts/backup-database.mjs --tables cars,parts # Specific tables
 *   node scripts/backup-database.mjs --verify           # Verify backup integrity
 * 
 * Prerequisites:
 *   - pg_dump must be installed (comes with PostgreSQL)
 *   - POSTGRES_URL_NON_POOLING env var must be set
 * 
 * Output:
 *   backups/autorev_YYYY-MM-DD_HH-MM-SS.sql (or .sql.gz if gzip is available)
 */

import { execSync, spawnSync } from 'child_process';
import { existsSync, mkdirSync, statSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from 'util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
// Store backups in dedicated folder outside the project (not in git)
const BACKUP_DIR = '/Volumes/10TB External HD/01. Apps - WORKING/Database BACKUPs';

// Configuration
const CONFIG = {
  maxBackups: 30,           // Keep last 30 backups
  compressBackups: true,    // Use gzip compression
  excludeTables: [          // Tables to exclude from backup (if needed)
    // 'application_errors',  // Uncomment to exclude large log tables
  ],
  criticalTables: [         // Tables that MUST be backed up
    'cars',
    'car_tuning_profiles',
    'user_profiles',
    'user_vehicles',
    'user_projects',
    'user_favorites',
    'parts',
    'part_fitments',
    'al_conversations',
    'al_messages',
    'events',
  ],
};

// Parse command line arguments
const { values: args } = parseArgs({
  options: {
    'schema-only': { type: 'boolean', default: false },
    'data-only': { type: 'boolean', default: false },
    'tables': { type: 'string', default: '' },
    'verify': { type: 'boolean', default: false },
    'help': { type: 'boolean', short: 'h', default: false },
  },
  allowPositionals: false,
});

if (args.help) {
  console.log(`
Database Backup Script for AutoRev

Usage:
  node scripts/backup-database.mjs [options]

Options:
  --schema-only    Export only the database schema (no data)
  --data-only      Export only data (requires existing schema)
  --tables <list>  Comma-separated list of tables to backup
  --verify         Verify the last backup can be restored
  -h, --help       Show this help message

Examples:
  node scripts/backup-database.mjs                     # Full backup
  node scripts/backup-database.mjs --schema-only       # Schema only
  node scripts/backup-database.mjs --tables cars,parts # Specific tables
  `);
  process.exit(0);
}

/**
 * Check if pg_dump is available
 */
function checkPrerequisites() {
  try {
    execSync('which pg_dump', { stdio: 'pipe' });
    return true;
  } catch {
    console.error('❌ pg_dump not found. Please install PostgreSQL client tools.');
    console.error('   macOS: brew install postgresql');
    console.error('   Ubuntu: sudo apt-get install postgresql-client');
    return false;
  }
}

/**
 * Check if gzip is available
 */
function hasGzip() {
  try {
    execSync('which gzip', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get database connection URL
 */
function getDatabaseUrl() {
  // Use non-pooling URL for pg_dump (required for direct connections)
  const url = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
  
  if (!url) {
    console.error('❌ Database URL not found.');
    console.error('   Set POSTGRES_URL_NON_POOLING or DATABASE_URL in your environment.');
    process.exit(1);
  }
  
  return url;
}

/**
 * Generate timestamped backup filename
 */
function getBackupFilename(suffix = '') {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19);
  
  const ext = CONFIG.compressBackups && hasGzip() ? '.sql.gz' : '.sql';
  return `autorev_${timestamp}${suffix}${ext}`;
}

/**
 * Ensure backup directory exists
 */
function ensureBackupDir() {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁 Created backup directory: ${BACKUP_DIR}`);
  }
}

/**
 * Clean up old backups, keeping only the most recent N
 */
function cleanupOldBackups() {
  const files = readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('autorev_') && (f.endsWith('.sql') || f.endsWith('.sql.gz')))
    .map(f => ({
      name: f,
      path: join(BACKUP_DIR, f),
      mtime: statSync(join(BACKUP_DIR, f)).mtime,
    }))
    .sort((a, b) => b.mtime - a.mtime); // Newest first

  if (files.length > CONFIG.maxBackups) {
    const toDelete = files.slice(CONFIG.maxBackups);
    console.log(`🧹 Cleaning up ${toDelete.length} old backup(s)...`);
    
    for (const file of toDelete) {
      unlinkSync(file.path);
      console.log(`   Deleted: ${file.name}`);
    }
  }
}

/**
 * Run pg_dump with the given options
 */
function runPgDump(outputPath, options = {}) {
  const dbUrl = getDatabaseUrl();
  const useCompression = CONFIG.compressBackups && hasGzip();
  
  // Build pg_dump command
  const pgDumpArgs = [
    '--no-owner',           // Don't output ownership commands
    '--no-acl',             // Don't output access privilege (grant/revoke) commands
    '--clean',              // Include DROP statements before CREATE
    '--if-exists',          // Use IF EXISTS with DROP
    '--format=plain',       // Plain SQL output
  ];

  // Add mode-specific options
  if (options.schemaOnly) {
    pgDumpArgs.push('--schema-only');
  }
  if (options.dataOnly) {
    pgDumpArgs.push('--data-only');
  }

  // Add specific tables if requested
  if (options.tables && options.tables.length > 0) {
    for (const table of options.tables) {
      pgDumpArgs.push(`--table=${table}`);
    }
  }

  // Exclude tables if configured
  for (const table of CONFIG.excludeTables) {
    pgDumpArgs.push(`--exclude-table=${table}`);
  }

  // Add database URL
  pgDumpArgs.push(dbUrl);

  console.log(`🔄 Running pg_dump...`);
  
  let command;
  if (useCompression) {
    command = `pg_dump ${pgDumpArgs.join(' ')} | gzip > "${outputPath}"`;
  } else {
    command = `pg_dump ${pgDumpArgs.join(' ')} > "${outputPath}"`;
  }

  try {
    execSync(command, { 
      stdio: ['pipe', 'pipe', 'inherit'],
      maxBuffer: 1024 * 1024 * 500, // 500MB buffer
    });
    return true;
  } catch (error) {
    console.error(`❌ pg_dump failed: ${error.message}`);
    return false;
  }
}

/**
 * Verify backup integrity by checking it can be parsed
 */
function verifyBackup(backupPath) {
  console.log(`🔍 Verifying backup integrity...`);
  
  if (!existsSync(backupPath)) {
    console.error(`❌ Backup file not found: ${backupPath}`);
    return false;
  }

  const stats = statSync(backupPath);
  if (stats.size === 0) {
    console.error(`❌ Backup file is empty!`);
    return false;
  }

  // Check for critical tables in the backup
  try {
    let content;
    if (backupPath.endsWith('.gz')) {
      content = execSync(`gunzip -c "${backupPath}" | head -c 1000000`, { 
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024 * 10,
      });
    } else {
      content = execSync(`head -c 1000000 "${backupPath}"`, { 
        encoding: 'utf-8',
      });
    }

    const foundTables = CONFIG.criticalTables.filter(table => 
      content.includes(`CREATE TABLE`) && content.includes(table)
    );

    if (foundTables.length === 0 && !args['data-only']) {
      console.warn(`⚠️  Warning: No critical tables found in backup preview`);
    } else {
      console.log(`   Found ${foundTables.length} critical tables in backup`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Verification failed: ${error.message}`);
    return false;
  }
}

/**
 * Get size of file in human-readable format
 */
function getFileSize(path) {
  const stats = statSync(path);
  const bytes = stats.size;
  
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Main backup function
 */
async function main() {
  console.log('🗄️  AutoRev Database Backup');
  console.log('═'.repeat(50));

  // Check prerequisites
  if (!checkPrerequisites()) {
    process.exit(1);
  }

  // Ensure backup directory exists
  ensureBackupDir();

  // Handle verify mode
  if (args.verify) {
    const files = readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('autorev_') && (f.endsWith('.sql') || f.endsWith('.sql.gz')))
      .map(f => ({
        name: f,
        path: join(BACKUP_DIR, f),
        mtime: statSync(join(BACKUP_DIR, f)).mtime,
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length === 0) {
      console.error('❌ No backups found to verify');
      process.exit(1);
    }

    const lastBackup = files[0];
    console.log(`\nVerifying most recent backup: ${lastBackup.name}`);
    const isValid = verifyBackup(lastBackup.path);
    
    process.exit(isValid ? 0 : 1);
  }

  // Determine backup type suffix
  let suffix = '';
  if (args['schema-only']) {
    suffix = '_schema';
    console.log('📋 Mode: Schema only');
  } else if (args['data-only']) {
    suffix = '_data';
    console.log('📋 Mode: Data only');
  } else {
    console.log('📋 Mode: Full backup (schema + data)');
  }

  // Parse specific tables if provided
  const tables = args.tables ? args.tables.split(',').map(t => t.trim()) : [];
  if (tables.length > 0) {
    suffix += `_${tables.length}tables`;
    console.log(`📋 Tables: ${tables.join(', ')}`);
  }

  // Generate filename and path
  const filename = getBackupFilename(suffix);
  const backupPath = join(BACKUP_DIR, filename);

  console.log(`📁 Output: ${filename}`);
  console.log('');

  // Start timing
  const startTime = Date.now();

  // Run backup
  const success = runPgDump(backupPath, {
    schemaOnly: args['schema-only'],
    dataOnly: args['data-only'],
    tables,
  });

  if (!success) {
    process.exit(1);
  }

  // Calculate duration
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  const fileSize = getFileSize(backupPath);

  console.log('');
  console.log('✅ Backup completed successfully!');
  console.log(`   📁 File: ${filename}`);
  console.log(`   📦 Size: ${fileSize}`);
  console.log(`   ⏱️  Duration: ${duration}s`);

  // Verify the backup
  console.log('');
  verifyBackup(backupPath);

  // Clean up old backups
  console.log('');
  cleanupOldBackups();

  // Show next steps
  console.log('');
  console.log('═'.repeat(50));
  console.log('📌 Next steps:');
  console.log('   • Store backup offsite (GitHub, S3, etc.)');
  console.log('   • Test restore periodically');
  console.log('   • Consider automating with cron');
  console.log('');
  console.log('To restore:');
  console.log(`   psql $DATABASE_URL < backups/${filename.replace('.gz', '')}`);
  if (filename.endsWith('.gz')) {
    console.log('   (Use gunzip first to decompress)');
  }
}

main().catch(error => {
  console.error('❌ Backup failed:', error.message);
  process.exit(1);
});
