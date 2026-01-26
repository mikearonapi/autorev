# CRON JOBS AUDIT

> **Audit ID:** CRON-001  
> **Category:** Infrastructure / Background Jobs  
> **Priority:** High  
> **Total Jobs:** 25 route files, 20 scheduled

---

## EXECUTIVE SUMMARY

AutoRev has **25 CRON job route files** in `app/api/cron/`. Of these:
- **20 are actively scheduled** in `vercel.json`
- **5 are NOT scheduled** (may be deprecated or missing from config)

This audit will review each CRON job for:
- Purpose and business value
- Schedule appropriateness
- Code quality and error handling
- Resource efficiency
- Alignment with current codebase

---

## CRON JOBS INVENTORY

### Scheduled Jobs (20)

| # | Job | Schedule | Frequency | Purpose |
|---|-----|----------|-----------|---------|
| 1 | `flush-error-aggregates` | `*/5 * * * *` | Every 5 min | Aggregate error logs |
| 2 | `process-email-queue` | `*/5 * * * *` | Every 5 min | Send queued emails |
| 3 | `process-scrape-jobs` | `*/15 * * * *` | Every 15 min | Process scraping queue |
| 4 | `daily-metrics` | `0 0 * * *` | Daily midnight | Capture metrics snapshot |
| 5 | `calculate-engagement` | `0 2 * * *` | Daily 2am | Calculate engagement scores |
| 6 | `refresh-events` | `0 6 * * *` | Daily 6am | Update automotive events |
| 7 | `retention-alerts` | `0 10 * * *` | Daily 10am | Send retention notifications |
| 8 | `schedule-inactivity-emails` | `0 11 * * *` | Daily 11am | Queue inactivity emails |
| 9 | `daily-digest` | `0 14 * * *` | Daily 2pm | Send daily digest |
| 10 | `article-research` | `0 0 * * *` | Daily midnight | Research article topics |
| 11 | `article-write` | `0 5 * * *` | Daily 5am | Write article drafts |
| 12 | `article-images` | `0 6 * * *` | Daily 6am | Generate article images |
| 13 | `article-publish` | `0 8 * * *` | Daily 8am | Publish articles |
| 14 | `weekly-car-expansion` | `0 1 * * 0` | Sunday 1am | Expand vehicle database |
| 15 | `schedule-ingestion` | `30 1 * * 0` | Sunday 1:30am | Schedule data ingestion |
| 16 | `refresh-recalls` | `0 2 * * 0` | Sunday 2am | Update recall data |
| 17 | `refresh-complaints` | `30 2 * * 0` | Sunday 2:30am | Update NHTSA complaints |
| 18 | `youtube-enrichment` | `0 4 * * 1` | Monday 4am | Enrich with YouTube data |
| 19 | `forum-scrape` | `0 5 * * 2,5` | Tue/Fri 5am | Scrape forum content |
| 20 | `al-optimization` | `0 3 * * 6` | Saturday 3am | Optimize AL performance |

### ⚠️ UNSCHEDULED Jobs (5) - NEEDS REVIEW

| # | Job | File Exists | In vercel.json | Status |
|---|-----|-------------|----------------|--------|
| 1 | `al-evaluation` | ✅ | ❌ | **INVESTIGATE** |
| 2 | `article-qa` | ✅ | ❌ | **INVESTIGATE** |
| 3 | `trial-reminders` | ✅ | ❌ | **INVESTIGATE** |
| 4 | `streak-reminders` | ✅ | ❌ | **INVESTIGATE** |
| 5 | `subscription-metrics` | ✅ | ❌ | **INVESTIGATE** |

---

## FILES TO EXAMINE

### CRON Route Files

```
app/api/cron/
├── al-evaluation/route.js
├── al-optimization/route.js
├── article-images/route.js
├── article-publish/route.js
├── article-qa/route.js
├── article-research/route.js
├── article-write/route.js
├── calculate-engagement/route.js
├── daily-digest/route.js
├── daily-metrics/route.js
├── flush-error-aggregates/route.js
├── forum-scrape/route.js
├── process-email-queue/route.js
├── process-scrape-jobs/route.js
├── refresh-complaints/route.js
├── refresh-events/route.js
├── refresh-recalls/route.js
├── retention-alerts/route.js
├── schedule-inactivity-emails/route.js
├── schedule-ingestion/route.js
├── streak-reminders/route.js
├── subscription-metrics/route.js
├── trial-reminders/route.js
├── weekly-car-expansion/route.js
└── youtube-enrichment/route.js
```

### Configuration

| File | Purpose |
|------|---------|
| `vercel.json` | CRON schedule definitions |

### Related Services

| File | Purpose |
|------|---------|
| `lib/serverErrorLogger.js` | Error logging for CRONs |
| `lib/notificationService.js` | Notification creation |
| `lib/engagementService.js` | Engagement/streak logic |
| `lib/subscriptionMetricsService.js` | Subscription metrics |
| `lib/emailService.js` | Email sending |

---

## CRITICAL: Read These First

Before making ANY changes:

1. `vercel.json` - Current schedule configuration
2. `docs/SOURCE_OF_TRUTH.md` - Background job patterns
3. Each CRON route file's header comments

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY CRON job:

1. ✅ Verify it currently runs successfully (check Vercel logs)
2. ✅ Understand its dependencies
3. ✅ Check for database tables/functions it relies on
4. ❌ Do NOT disable without understanding impact
5. ❓ For unscheduled jobs, determine if intentional or oversight

---

## AUDIT CHECKLIST

### A. Configuration Audit

- [ ] All intended CRONs are in `vercel.json`
- [ ] No orphaned routes (files without schedule)
- [ ] No orphaned schedules (config without files)
- [ ] Schedule times don't conflict/overlap excessively
- [ ] Timezone considerations documented

### B. Per-Job Audit Template

For EACH CRON job, verify:

| Check | Criteria |
|-------|----------|
| **Authorization** | Has `CRON_SECRET` or `x-vercel-cron` check |
| **Error Handling** | Uses `withErrorLogging` wrapper |
| **Logging** | Logs start, completion, errors |
| **Idempotency** | Safe to run multiple times |
| **Timeout** | Completes within Vercel limits (10s hobby, 60s pro) |
| **Dependencies** | All required env vars documented |
| **Database** | Uses service role key appropriately |
| **Edge Runtime** | Appropriate `runtime` export |

### C. Security Checklist

- [ ] All jobs verify `CRON_SECRET` or `x-vercel-cron`
- [ ] Service role key only used server-side
- [ ] No sensitive data in logs
- [ ] Rate limiting considered for resource-intensive jobs

---

## INDIVIDUAL JOB AUDITS

### 1. flush-error-aggregates

| Attribute | Value |
|-----------|-------|
| **Schedule** | Every 5 minutes |
| **Purpose** | Aggregates error logs from buffer to permanent storage |
| **File** | `app/api/cron/flush-error-aggregates/route.js` |
| **Priority** | High (error visibility) |

**Checklist:**
- [ ] Authorization check present
- [ ] Error handling with `withErrorLogging`
- [ ] Completes within timeout
- [ ] Database operations efficient
- [ ] Still needed with current error logging setup

---

### 2. process-email-queue

| Attribute | Value |
|-----------|-------|
| **Schedule** | Every 5 minutes |
| **Purpose** | Sends queued emails |
| **File** | `app/api/cron/process-email-queue/route.js` |
| **Priority** | High (user communication) |

**Checklist:**
- [ ] Authorization check present
- [ ] Error handling with `withErrorLogging`
- [ ] Handles partial failures
- [ ] Marks emails as sent/failed
- [ ] Retry logic for failures
- [ ] Email service configured correctly

---

### 3. process-scrape-jobs

| Attribute | Value |
|-----------|-------|
| **Schedule** | Every 15 minutes |
| **Purpose** | Processes queued scraping tasks |
| **File** | `app/api/cron/process-scrape-jobs/route.js` |
| **Priority** | Medium (data enrichment) |

**Checklist:**
- [ ] Authorization check present
- [ ] Error handling with `withErrorLogging`
- [ ] Respects `max` and `delay` params
- [ ] Handles scrape failures gracefully
- [ ] Rate limiting to avoid IP blocks

---

### 4. daily-metrics

| Attribute | Value |
|-----------|-------|
| **Schedule** | Daily at midnight |
| **Purpose** | Captures daily metrics snapshot |
| **File** | `app/api/cron/daily-metrics/route.js` |
| **Priority** | High (analytics) |

**Checklist:**
- [ ] Authorization check present
- [ ] Error handling with `withErrorLogging`
- [ ] Calls `generate_daily_metrics_snapshot` RPC
- [ ] Logs snapshot summary
- [ ] Database function exists and works

---

### 5. calculate-engagement

| Attribute | Value |
|-----------|-------|
| **Schedule** | Daily at 2am |
| **Purpose** | Calculates user engagement scores |
| **File** | `app/api/cron/calculate-engagement/route.js` |
| **Priority** | Medium (gamification) |

**Checklist:**
- [ ] Authorization check present
- [ ] Error handling with `withErrorLogging`
- [ ] Updates user engagement scores
- [ ] Efficient for large user base

---

### 6. refresh-events

| Attribute | Value |
|-----------|-------|
| **Schedule** | Daily at 6am |
| **Purpose** | Updates automotive event data |
| **File** | `app/api/cron/refresh-events/route.js` |
| **Priority** | Medium (community feature) |

**Checklist:**
- [ ] Authorization check present
- [ ] Error handling with `withErrorLogging`
- [ ] Respects `limit` param
- [ ] Updates event status (past events)
- [ ] Fetches new events from sources

---

### 7. retention-alerts

| Attribute | Value |
|-----------|-------|
| **Schedule** | Daily at 10am |
| **Purpose** | Sends retention notifications |
| **File** | `app/api/cron/retention-alerts/route.js` |
| **Priority** | High (retention) |

**Checklist:**
- [ ] Authorization check present
- [ ] Error handling with `withErrorLogging`
- [ ] Targets correct user segments
- [ ] Respects notification preferences
- [ ] Doesn't spam users

---

### 8. schedule-inactivity-emails

| Attribute | Value |
|-----------|-------|
| **Schedule** | Daily at 11am |
| **Purpose** | Queues emails for inactive users |
| **File** | `app/api/cron/schedule-inactivity-emails/route.js` |
| **Priority** | Medium (retention) |

**Checklist:**
- [ ] Authorization check present
- [ ] Error handling with `withErrorLogging`
- [ ] Correct inactivity threshold
- [ ] Respects email preferences
- [ ] Integrates with email queue

---

### 9. daily-digest

| Attribute | Value |
|-----------|-------|
| **Schedule** | Daily at 2pm |
| **Purpose** | Sends daily digest notifications |
| **File** | `app/api/cron/daily-digest/route.js` |
| **Priority** | Medium (engagement) |

**Checklist:**
- [ ] Authorization check present
- [ ] Error handling with `withErrorLogging`
- [ ] Aggregates relevant content
- [ ] Respects user preferences
- [ ] Discord notification included

---

### 10-13. Article Pipeline Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `article-research` | Daily midnight | Research topics |
| `article-write` | Daily 5am | Write drafts |
| `article-images` | Daily 6am | Generate images |
| `article-publish` | Daily 8am | Publish articles |

**Checklist (all):**
- [ ] Authorization check present
- [ ] Error handling with `withErrorLogging`
- [ ] Pipeline order is correct (research → write → images → publish)
- [ ] Handles AI service failures
- [ ] Quality checks before publish
- [ ] Still needed/used

---

### 14. weekly-car-expansion

| Attribute | Value |
|-----------|-------|
| **Schedule** | Sunday at 1am |
| **Purpose** | Expands vehicle database |
| **File** | `app/api/cron/weekly-car-expansion/route.js` |
| **Priority** | Medium (content) |

**Checklist:**
- [ ] Authorization check present
- [ ] Error handling with `withErrorLogging`
- [ ] Respects `max` param
- [ ] Adds new vehicle variants
- [ ] Data validation before insert

---

### 15. schedule-ingestion

| Attribute | Value |
|-----------|-------|
| **Schedule** | Sunday at 1:30am |
| **Purpose** | Schedules data ingestion tasks |
| **File** | `app/api/cron/schedule-ingestion/route.js` |
| **Priority** | Medium (data) |

**Checklist:**
- [ ] Authorization check present
- [ ] Error handling with `withErrorLogging`
- [ ] Queues appropriate tasks
- [ ] Doesn't duplicate existing tasks

---

### 16. refresh-recalls

| Attribute | Value |
|-----------|-------|
| **Schedule** | Sunday at 2am |
| **Purpose** | Updates NHTSA recall data |
| **File** | `app/api/cron/refresh-recalls/route.js` |
| **Priority** | High (safety data) |

**Checklist:**
- [ ] Authorization check present
- [ ] Error handling with `withErrorLogging`
- [ ] Respects `concurrency` param
- [ ] NHTSA API integration works
- [ ] Updates existing recalls
- [ ] Adds new recalls

---

### 17. refresh-complaints

| Attribute | Value |
|-----------|-------|
| **Schedule** | Sunday at 2:30am |
| **Purpose** | Updates NHTSA complaints |
| **File** | `app/api/cron/refresh-complaints/route.js` |
| **Priority** | High (safety data) |

**Checklist:**
- [ ] Authorization check present
- [ ] Error handling with `withErrorLogging`
- [ ] Respects `concurrency` and `delay` params
- [ ] NHTSA API integration works
- [ ] Normalizes complaint data

---

### 18. youtube-enrichment

| Attribute | Value |
|-----------|-------|
| **Schedule** | Monday at 4am |
| **Purpose** | Enriches content with YouTube data |
| **File** | `app/api/cron/youtube-enrichment/route.js` |
| **Priority** | Low (enhancement) |

**Checklist:**
- [ ] Authorization check present
- [ ] Error handling with `withErrorLogging`
- [ ] YouTube API key configured
- [ ] Respects API quotas
- [ ] Stores relevant video metadata

---

### 19. forum-scrape

| Attribute | Value |
|-----------|-------|
| **Schedule** | Tue/Fri at 5am |
| **Purpose** | Scrapes automotive forum content |
| **File** | `app/api/cron/forum-scrape/route.js` |
| **Priority** | Medium (content) |

**Checklist:**
- [ ] Authorization check present
- [ ] Error handling with `withErrorLogging`
- [ ] Respects params (mode, maxThreads, maxExtract)
- [ ] Ethical scraping (respects robots.txt)
- [ ] Rate limiting to avoid blocks

---

### 20. al-optimization

| Attribute | Value |
|-----------|-------|
| **Schedule** | Saturday at 3am |
| **Purpose** | Optimizes AL performance |
| **File** | `app/api/cron/al-optimization/route.js` |
| **Priority** | Medium (AI quality) |

**Checklist:**
- [ ] Authorization check present
- [ ] Error handling with `withErrorLogging`
- [ ] Analyzes AL performance metrics
- [ ] Identifies improvement opportunities
- [ ] Safe optimization operations

---

## ⚠️ UNSCHEDULED JOBS - DETAILED REVIEW

### U1. al-evaluation

| Attribute | Value |
|-----------|-------|
| **File** | `app/api/cron/al-evaluation/route.js` |
| **Scheduled** | ❌ NO |
| **Action Required** | Investigate |

**Questions:**
- [ ] What does this job do?
- [ ] Is it superseded by `al-optimization`?
- [ ] Should it be scheduled?
- [ ] Or should it be deleted?

---

### U2. article-qa

| Attribute | Value |
|-----------|-------|
| **File** | `app/api/cron/article-qa/route.js` |
| **Scheduled** | ❌ NO |
| **Action Required** | Investigate |

**Questions:**
- [ ] Part of article pipeline?
- [ ] Should it run between write and publish?
- [ ] Forgotten in config?

---

### U3. trial-reminders

| Attribute | Value |
|-----------|-------|
| **File** | `app/api/cron/trial-reminders/route.js` |
| **Scheduled** | ❌ NO |
| **Action Required** | Investigate |

**Questions:**
- [ ] Should send trial expiration reminders
- [ ] Why not scheduled?
- [ ] Is this critical for conversions?

---

### U4. streak-reminders

| Attribute | Value |
|-----------|-------|
| **File** | `app/api/cron/streak-reminders/route.js` |
| **Scheduled** | ❌ NO |
| **Action Required** | Investigate |

**Questions:**
- [ ] Sends "your streak is at risk" notifications
- [ ] Should run daily ~6pm for best timing
- [ ] Why not scheduled?
- [ ] Is this critical for engagement?

---

### U5. subscription-metrics

| Attribute | Value |
|-----------|-------|
| **File** | `app/api/cron/subscription-metrics/route.js` |
| **Scheduled** | ❌ NO |
| **Action Required** | Investigate |

**Questions:**
- [ ] Calculates MRR, ARR, churn, LTV
- [ ] Should run daily for accurate metrics
- [ ] Why not scheduled?
- [ ] Is this critical for business intelligence?

---

## SCHEDULE TIMELINE (UTC)

Visual representation of when jobs run:

```
EVERY 5 MIN:
  - flush-error-aggregates
  - process-email-queue

EVERY 15 MIN:
  - process-scrape-jobs

DAILY:
  00:00 - daily-metrics, article-research
  02:00 - calculate-engagement
  05:00 - article-write
  06:00 - refresh-events, article-images
  08:00 - article-publish
  10:00 - retention-alerts
  11:00 - schedule-inactivity-emails
  14:00 - daily-digest

WEEKLY:
  Sunday 01:00 - weekly-car-expansion
  Sunday 01:30 - schedule-ingestion
  Sunday 02:00 - refresh-recalls
  Sunday 02:30 - refresh-complaints
  Monday 04:00 - youtube-enrichment
  Tue/Fri 05:00 - forum-scrape
  Saturday 03:00 - al-optimization
```

---

## TESTING SCENARIOS

### Test 1: Manual Trigger

```bash
# Test with CRON_SECRET
curl -X GET "https://yourdomain.com/api/cron/daily-metrics" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test 2: Check Vercel Logs

1. Go to Vercel Dashboard → Project → Logs
2. Filter by "cron"
3. Verify jobs ran successfully
4. Check for errors

### Test 3: Database Verification

```sql
-- Check daily_metrics_snapshot has recent entries
SELECT * FROM daily_metrics_snapshot 
ORDER BY snapshot_date DESC 
LIMIT 5;

-- Check email queue is being processed
SELECT status, COUNT(*) 
FROM email_queue 
GROUP BY status;
```

---

## AUTOMATED CHECKS

```bash
# 1. List all CRON routes
ls app/api/cron/

# 2. Check vercel.json has all jobs
grep -o '"path": "/api/cron/[^"]*"' vercel.json | wc -l

# 3. Find unscheduled jobs
for job in app/api/cron/*/route.js; do
  name=$(dirname $job | xargs basename)
  if ! grep -q "/api/cron/$name" vercel.json; then
    echo "UNSCHEDULED: $name"
  fi
done

# 4. Check for authorization in all jobs
grep -rn "CRON_SECRET\|x-vercel-cron" app/api/cron/

# 5. Check for withErrorLogging
grep -rn "withErrorLogging" app/api/cron/

# 6. Find jobs without proper auth
for f in app/api/cron/*/route.js; do
  if ! grep -q "CRON_SECRET\|x-vercel-cron" "$f"; then
    echo "NO AUTH: $f"
  fi
done
```

---

## DELIVERABLES

### 1. Configuration Report

| Check | Status | Notes |
|-------|--------|-------|
| All jobs have routes | ✅/❌ | |
| All routes are scheduled | ✅/❌ | 5 unscheduled |
| No schedule conflicts | ✅/❌ | |
| Timezone documented | ✅/❌ | |

### 2. Job-by-Job Report

| Job | Auth | Error Handling | Timeout OK | Status |
|-----|------|----------------|------------|--------|
| flush-error-aggregates | ✅/❌ | ✅/❌ | ✅/❌ | |
| ... | | | | |

### 3. Recommendations

| Priority | Recommendation |
|----------|----------------|
| High | [Add/Remove/Modify job X because...] |
| Medium | |
| Low | |

### 4. Issues Found

| Severity | Issue | Job | Fix |
|----------|-------|-----|-----|
| | | | |

---

## VERIFICATION

- [ ] All 25 jobs reviewed
- [ ] 5 unscheduled jobs resolved (schedule or delete)
- [ ] All jobs have proper authorization
- [ ] All jobs have error handling
- [ ] Schedule makes sense (no conflicts, appropriate timing)
- [ ] Vercel logs show successful executions

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | All jobs inventoried and understood |
| 2 | Unscheduled jobs resolved |
| 3 | All jobs have auth & error handling |
| 4 | Schedule optimized (no conflicts) |
| 5 | Documentation complete |
| 6 | No critical/high issues remaining |

---

## OUTPUT FORMAT

```
⏰ CRON JOBS AUDIT COMPLETE

**Summary:**
- Total Jobs: 25
- Scheduled: 20
- Unscheduled: 5 → [resolved status]

**Unscheduled Resolution:**
- al-evaluation: [Scheduled/Deleted/...]
- article-qa: [Scheduled/Deleted/...]
- trial-reminders: [Scheduled/Deleted/...]
- streak-reminders: [Scheduled/Deleted/...]
- subscription-metrics: [Scheduled/Deleted/...]

**Issues Fixed:**
1. [Issue description]
2. [Issue description]

**Recommendations:**
1. [Recommendation]
2. [Recommendation]
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Status | Issues Fixed | Notes |
|------|---------|--------|--------------|-------|
| | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite*
