#!/usr/bin/env node
/**
 * Daily Automated Backup
 * 
 * Combines database dump + storage upload in one script.
 * Designed for cron job automation.
 * 
 * Usage:
 *   node scripts/daily-backup.mjs
 * 
 * Cron Example (daily at 3am):
 *   0 3 * * * cd /path/to/autorev && node scripts/daily-backup.mjs >> logs/backup.log 2>&1
 * 
 * What it does:
 *   1. Creates a compressed database backup
 *   2. Verifies the backup integrity
 *   3. Uploads to Supabase Storage
 *   4. Cleans up old local and remote backups
 *   5. Sends notification on failure (if configured)
 */

import { execSync } from 'child_process';
import { existsSync, appendFileSync, readdirSync, statSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const LOG_DIR = join(PROJECT_ROOT, 'logs');
const LOG_FILE = join(LOG_DIR, 'backup.log');

// Configuration
const CONFIG = {
  notifyOnFailure: true,           // Send Discord notification on failure
  discordWebhookEnvVar: 'DISCORD_WEBHOOK_URL', // Optional Discord webhook
  uploadToStorage: true,           // Upload to Supabase Storage
};

/**
 * Log a message with timestamp
 */
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level}] ${message}`;
  console.log(logLine);
  
  // Also append to log file
  try {
    if (!existsSync(LOG_DIR)) {
      mkdirSync(LOG_DIR, { recursive: true });
    }
    appendFileSync(LOG_FILE, logLine + '\n');
  } catch {
    // Ignore log file errors
  }
}

/**
 * Send failure notification via Discord webhook
 */
async function sendFailureNotification(error) {
  const webhookUrl = process.env[CONFIG.discordWebhookEnvVar];
  
  if (!webhookUrl || !CONFIG.notifyOnFailure) {
    return;
  }

  try {
    const message = {
      content: `🚨 **AutoRev Database Backup Failed**\n\n\`\`\`\n${error}\n\`\`\`\n\nTime: ${new Date().toISOString()}`,
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    log('Failure notification sent to Discord', 'WARN');
  } catch (notifyError) {
    log(`Failed to send notification: ${notifyError.message}`, 'ERROR');
  }
}

/**
 * Run a script and return success status
 */
function runScript(scriptPath, args = []) {
  const command = `node "${scriptPath}" ${args.join(' ')}`;
  
  try {
    execSync(command, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      env: process.env,
    });
    return true;
  } catch (error) {
    return false;
  }
}

// Store backups in dedicated folder outside the project
const BACKUP_DIR = '/Volumes/10TB External HD/01. Apps - WORKING/Database BACKUPs';

/**
 * Get backup statistics
 */
function getBackupStats() {
  const backupDir = BACKUP_DIR;
  
  if (!existsSync(backupDir)) {
    return { count: 0, totalSize: 0, latest: null };
  }

  const files = readdirSync(backupDir)
    .filter(f => f.startsWith('autorev_'))
    .map(f => ({
      name: f,
      path: join(backupDir, f),
      mtime: statSync(join(backupDir, f)).mtime,
      size: statSync(join(backupDir, f)).size,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return {
    count: files.length,
    totalSize: (totalSize / (1024 * 1024)).toFixed(1) + ' MB',
    latest: files[0]?.name || null,
  };
}

/**
 * Main backup routine
 */
async function main() {
  const startTime = Date.now();
  
  log('═'.repeat(60));
  log('🗄️  Starting Daily Database Backup');
  log('═'.repeat(60));

  let success = true;
  let errorMessage = '';

  try {
    // Step 1: Run database backup
    log('Step 1/3: Creating database backup...');
    const backupScript = join(__dirname, 'backup-database.mjs');
    
    if (!runScript(backupScript)) {
      throw new Error('Database backup failed');
    }
    log('✓ Database backup completed');

    // Step 2: Upload to storage (if configured)
    if (CONFIG.uploadToStorage) {
      log('Step 2/3: Uploading to Supabase Storage...');
      const uploadScript = join(__dirname, 'backup-to-storage.mjs');
      
      if (existsSync(uploadScript)) {
        if (!runScript(uploadScript)) {
          log('⚠️  Storage upload failed (non-fatal)', 'WARN');
        } else {
          log('✓ Storage upload completed');
        }
      } else {
        log('⚠️  Upload script not found, skipping', 'WARN');
      }
    } else {
      log('Step 2/3: Storage upload disabled, skipping');
    }

    // Step 3: Verify backup
    log('Step 3/3: Verifying backup integrity...');
    if (!runScript(backupScript, ['--verify'])) {
      throw new Error('Backup verification failed');
    }
    log('✓ Backup verified');

  } catch (error) {
    success = false;
    errorMessage = error.message;
    log(`❌ Backup failed: ${errorMessage}`, 'ERROR');
  }

  // Calculate duration
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  // Get stats
  const stats = getBackupStats();

  // Summary
  log('');
  log('═'.repeat(60));
  
  if (success) {
    log('✅ Daily Backup Completed Successfully');
    log(`   Duration: ${duration}s`);
    log(`   Latest: ${stats.latest}`);
    log(`   Local backups: ${stats.count} (${stats.totalSize})`);
  } else {
    log('❌ Daily Backup Failed', 'ERROR');
    log(`   Error: ${errorMessage}`, 'ERROR');
    log(`   Duration: ${duration}s`);
    
    // Send failure notification
    await sendFailureNotification(errorMessage);
  }

  log('═'.repeat(60));
  log('');

  process.exit(success ? 0 : 1);
}

main();
