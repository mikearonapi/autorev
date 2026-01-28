# AutoRev Database Backup Strategy

> **Purpose**: Protect against data loss with multiple layers of backup redundancy
>
> **Last Updated**: January 27, 2026

---

## Backup Layers Overview

| Layer                  | Method        | Frequency  | Retention  | Recovery Time |
| ---------------------- | ------------- | ---------- | ---------- | ------------- |
| **1. Supabase Pro**    | Automatic     | Daily      | 7 days     | ~10 min       |
| **2. Storage Upload**  | Manual/Script | On-demand  | 14 backups | ~5 min        |
| **3. Local Backup**    | Script        | On-demand  | 30 backups | ~2 min        |
| **4. GitHub (Schema)** | Automatic     | Per commit | Forever    | ~1 min        |

---

## Layer 1: Supabase Built-in Backups (RECOMMENDED)

### What You Get with Supabase Pro ($25/month)

- **Daily automatic backups** at ~midnight UTC
- **7-day retention** with point-in-time restore
- **One-click restore** from Supabase Dashboard
- **No setup required** - just upgrade your plan

### How to Enable

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project → Settings → Billing
3. Upgrade to **Pro** plan
4. Backups are automatic - nothing else to configure

### How to Restore

1. Dashboard → Project Settings → Database → Backups
2. Select the backup date/time
3. Click "Restore"

### Current Plan Status

Check your plan: Dashboard → Settings → Billing

| Plan    | Backup Feature                    | Cost    |
| ------- | --------------------------------- | ------- |
| Free    | ❌ No backups                     | $0/mo   |
| **Pro** | ✅ Daily backups, 7-day retention | $25/mo  |
| Team    | ✅ Daily + PITR (7-day window)    | $599/mo |

**Recommendation**: Upgrade to Pro - $25/mo is cheap insurance for your data.

---

## Layer 2: Supabase Storage Backup (Script)

Backup your database and store it in Supabase Storage for offsite redundancy.

### Setup (One-time)

1. **Create Storage Bucket**

   ```
   Supabase Dashboard → Storage → New Bucket
   Name: backups
   Public: No (keep private)
   ```

2. **Run Initial Backup**

   ```bash
   # Create backup
   node scripts/backup-database.mjs

   # Upload to storage
   node scripts/backup-to-storage.mjs
   ```

### Daily Automation

Option A: **macOS/Linux Cron** (if you have a local machine running 24/7)

```bash
# Edit crontab
crontab -e

# Add this line (runs at 3am daily)
0 3 * * * cd "/Volumes/10TB External HD/01. Apps - WORKING/AutoRev" && node scripts/daily-backup.mjs >> logs/backup.log 2>&1
```

Option B: **GitHub Actions** (recommended - runs from GitHub's servers)

Create `.github/workflows/daily-backup.yml`:

```yaml
name: Daily Database Backup

on:
  schedule:
    - cron: '0 8 * * *' # 8am UTC = 3am EST
  workflow_dispatch: # Allow manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install PostgreSQL Client
        run: sudo apt-get install -y postgresql-client

      - name: Install Dependencies
        run: npm ci

      - name: Run Backup
        env:
          POSTGRES_URL_NON_POOLING: ${{ secrets.POSTGRES_URL_NON_POOLING }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: |
          node scripts/backup-database.mjs
          node scripts/backup-to-storage.mjs
```

Then add secrets in GitHub: Repository → Settings → Secrets → Actions.

---

## Layer 3: Local Backups (Script)

Keep backups on your local machine or external drive.

### Manual Backup

```bash
# Full backup (schema + data)
node scripts/backup-database.mjs

# Schema only (small, fast)
node scripts/backup-database.mjs --schema-only

# Specific tables
node scripts/backup-database.mjs --tables cars,user_profiles,user_vehicles

# Verify last backup
node scripts/backup-database.mjs --verify
```

### Backup Location

Backups are stored in: `/Volumes/10TB External HD/01. Apps - WORKING/Database BACKUPs/`

Filename format: `autorev_YYYY-MM-DD_HH-MM-SS.sql.gz`

### Retention

- Keeps last **30 backups** locally
- Keeps last **14 backups** in Supabase Storage
- Older backups are automatically deleted

---

## Layer 4: Schema in Git (Automatic)

Your database schema is already version-controlled!

### What's Tracked

```
supabase/
├── migrations/        # All schema changes (67 files)
├── schema.sql         # Current full schema
└── seed.sql           # Initial seed data
```

### To Recreate Schema

If you ever need to rebuild the database from scratch:

```bash
# Apply all migrations in order
psql $DATABASE_URL -f supabase/schema.sql
```

---

## Recovery Procedures

### Scenario 1: Accidental Data Deletion

**Time to recover: ~5 minutes**

1. Download latest backup from Supabase Storage
   - Dashboard → Storage → backups → Download
2. Decompress if needed: `gunzip backup.sql.gz`
3. Restore: `psql $DATABASE_URL < backup.sql`

### Scenario 2: Corrupted Database

**Time to recover: ~10 minutes**

1. Use Supabase Dashboard restore (Pro plan)
2. Dashboard → Settings → Database → Backups → Restore

### Scenario 3: Total Project Loss

**Time to recover: ~30 minutes**

1. Create new Supabase project
2. Apply schema: `psql $NEW_DATABASE_URL -f supabase/schema.sql`
3. Restore data from latest backup

### Scenario 4: Selective Table Restore

**Time to recover: ~10 minutes**

```bash
# Extract specific tables from backup
gunzip -c backup.sql.gz | grep -A 1000 "COPY cars" > cars_data.sql

# Or backup specific tables
node scripts/backup-database.mjs --tables cars --data-only
```

---

## Critical Tables

These tables contain the most valuable/irreplaceable data:

| Table                 | Rows  | Priority     | Notes              |
| --------------------- | ----- | ------------ | ------------------ |
| `cars`                | 310   | 🔴 Critical  | All vehicle data   |
| `user_profiles`       | 62    | 🔴 Critical  | User accounts      |
| `user_vehicles`       | 34    | 🔴 Critical  | User's owned cars  |
| `user_favorites`      | 19    | 🔴 Critical  | User's saved cars  |
| `user_projects`       | 13    | 🔴 Critical  | Build projects     |
| `al_conversations`    | 74    | 🟡 Important | AI chat history    |
| `al_messages`         | 355   | 🟡 Important | AI message content |
| `parts`               | 723   | 🟡 Important | Parts catalog      |
| `events`              | 8,615 | 🟡 Important | Event data         |
| `car_tuning_profiles` | 323   | 🟡 Important | Tuning data        |

---

## Monitoring & Alerts

### Check Backup Status

```bash
# List local backups
ls -la backups/

# List remote backups
node scripts/backup-to-storage.mjs --list
```

### Discord Notifications (Optional)

Add `DISCORD_WEBHOOK_URL` to your environment to get notified on backup failures.

1. Create Discord webhook: Server Settings → Integrations → Webhooks
2. Add to `.env.local`:
   ```
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
   ```

---

## Quick Reference

```bash
# Create backup now
node scripts/backup-database.mjs

# Upload to Supabase Storage
node scripts/backup-to-storage.mjs

# Full daily backup routine
node scripts/daily-backup.mjs

# Verify backup integrity
node scripts/backup-database.mjs --verify

# List remote backups
node scripts/backup-to-storage.mjs --list

# Clean up old remote backups
node scripts/backup-to-storage.mjs --prune
```

---

## Cost Summary

| Item                               | Monthly Cost |
| ---------------------------------- | ------------ |
| Supabase Pro (automatic backups)   | $25          |
| Supabase Storage (100GB included)  | $0\*         |
| GitHub Actions (2,000 min/mo free) | $0           |
| **Total**                          | **$25/mo**   |

\*Storage backups use Supabase Storage which has 1GB free, then $0.021/GB.

---

## Recommended Action

1. ✅ **Upgrade to Supabase Pro** ($25/mo) - automatic daily backups
2. ✅ **Create Storage bucket** named "backups" in Supabase Dashboard
3. ✅ **Run initial backup**: `node scripts/daily-backup.mjs`
4. ⬜ **Set up GitHub Actions** for automated offsite backups (optional but recommended)
5. ⬜ **Test restore** quarterly to ensure backups work

---

_Questions? Check [Supabase Backup Docs](https://supabase.com/docs/guides/platform/backups)_
