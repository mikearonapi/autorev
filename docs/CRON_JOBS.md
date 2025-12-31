# Cron Job Schedule & Dependencies

> **Last Updated:** December 31, 2024

This document explains the AutoRev cron job schedule, dependencies, and rationale.

---

## Schedule Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            WEEKLY SCHEDULE                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  CONTINUOUS (Every 5 min)           FREQUENT (Every 15 min)                  │
│  ├── flush-error-aggregates         └── process-scrape-jobs (3 max)          │
│  └── process-email-queue                                                      │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────── │
│                                                                               │
│  DAILY                                                                        │
│  ├── 00:00 daily-metrics          (Start of day baseline)                    │
│  ├── 06:00 refresh-events         (Automotive events from sources)           │
│  ├── 10:00 schedule-inactivity-emails                                        │
│  └── 14:00 daily-digest           (Afternoon summary)                        │
│                                                                               │
│  ─────────────────────────────────────────────────────────────────────────── │
│                                                                               │
│  SUNDAY - Main Data Expansion Day                                            │
│  ├── 01:00 ① weekly-car-expansion   (Queue new cars for pipeline)            │
│  ├── 01:30 ① schedule-ingestion     (Queue event source scrapes)             │
│  ├── 02:00 ② refresh-recalls        (NHTSA recall data)                      │
│  ├── 02:30 ② refresh-complaints     (NHTSA complaint data)                   │
│  └── 03:00 ③ process-scrape-jobs    (Run car pipelines + event scrapes)      │
│                                                                               │
│  MONDAY                                                                       │
│  └── 04:00 youtube-enrichment       (Discover + transcribe + AI process)     │
│                                                                               │
│  TUESDAY & FRIDAY                                                            │
│  └── 05:00 forum-scrape             (Scrape threads + extract insights)      │
│                                                                               │
│  SATURDAY - Knowledge Optimization (MUST BE LAST)                            │
│  └── 03:00 al-optimization          (Embed all new content for AL)           │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Dependency Graph

```
PHASE 1: Discovery & Queuing (Sunday 1:00 AM)
┌─────────────────────────┐    ┌─────────────────────────┐
│  weekly-car-expansion   │    │   schedule-ingestion    │
│  • Analyze demand       │    │   • Queue event sources │
│  • Queue cars for AI    │    │                         │
│    pipeline             │    │                         │
└───────────┬─────────────┘    └───────────┬─────────────┘
            │                              │
            └──────────────┬───────────────┘
                           ▼
PHASE 2: External Data Refresh (Sunday 2:00-2:30 AM)
┌─────────────────────────┐    ┌─────────────────────────┐
│    refresh-recalls      │    │   refresh-complaints    │
│    • NHTSA API          │    │   • NHTSA API           │
│    • car_recalls table  │    │   • car_issues table    │
└───────────┬─────────────┘    └───────────┬─────────────┘
            │                              │
            └──────────────┬───────────────┘
                           ▼
PHASE 3: Heavy Processing (Sunday 3:00 AM)
┌───────────────────────────────────────────────────────┐
│              process-scrape-jobs (max=10)             │
│  • Run AI car pipeline for queued cars                │
│  • Process queued event source scrapes                │
│  • Creates: new cars, car_issues, service_intervals   │
└───────────────────────────┬───────────────────────────┘
                            │
                            ▼
PHASE 4: Content Enrichment (Mon-Fri)
┌─────────────────────────┐    ┌─────────────────────────┐
│   youtube-enrichment    │    │      forum-scrape       │
│   Monday 4:00 AM        │    │   Tue/Fri 5:00 AM       │
│   • Discover videos     │    │   • Scrape threads      │
│   • Fetch transcripts   │    │   • AI extract insights │
│   • AI process          │    │                         │
│   Creates:              │    │   Creates:              │
│   • youtube_videos      │    │   • forum_posts         │
│   • youtube_video_      │    │   • community_insights  │
│     car_links           │    │                         │
└───────────┬─────────────┘    └───────────┬─────────────┘
            │                              │
            └──────────────┬───────────────┘
                           ▼
PHASE 5: Knowledge Optimization (Saturday 3:00 AM) ⭐ MUST BE LAST
┌───────────────────────────────────────────────────────┐
│                  al-optimization                       │
│                                                        │
│  EMBEDS everything created during the week:           │
│  • New cars from weekly-car-expansion → pipeline      │
│  • New community_insights from forum-scrape           │
│  • New youtube_videos from youtube-enrichment         │
│  • Updated car ai_searchable_text                     │
│                                                        │
│  Why last? Because content must EXIST before we can   │
│  generate embeddings for it!                          │
└───────────────────────────────────────────────────────┘
                           │
                           ▼
┌───────────────────────────────────────────────────────┐
│              AL is now fully optimized!               │
│                                                        │
│  Can semantically search:                             │
│  • All 188+ cars with complete embeddings             │
│  • 1,200+ community insights                          │
│  • 7,000+ document chunks (YouTube, docs, etc.)       │
└───────────────────────────────────────────────────────┘
```

---

## Job Details

### Continuous Jobs (Every 5 min)

| Job | Purpose | Tables Affected |
|-----|---------|-----------------|
| `flush-error-aggregates` | Batch Discord notifications to avoid spam | `error_aggregates` |
| `process-email-queue` | Send queued transactional emails | `email_queue` |

### Frequent Jobs (Every 15 min)

| Job | Purpose | Tables Affected |
|-----|---------|-----------------|
| `process-scrape-jobs` | Process background jobs (lightweight mode) | `scrape_jobs`, various |

### Daily Jobs

| Job | Time (UTC) | Purpose | Tables Affected |
|-----|------------|---------|-----------------|
| `daily-metrics` | 00:00 | Snapshot user/system metrics | `daily_metrics_snapshot` |
| `refresh-events` | 06:00 | Fetch automotive events | `events` |
| `schedule-inactivity-emails` | 10:00 | Queue reminders for inactive users | `email_queue` |
| `daily-digest` | 14:00 | Send admin summary | Discord webhook |

### Weekly Jobs

| Job | Day/Time (UTC) | Duration | Purpose |
|-----|----------------|----------|---------|
| `weekly-car-expansion` | Sun 01:00 | ~2 min | Queue 3 new cars for AI pipeline |
| `schedule-ingestion` | Sun 01:30 | ~2 min | Queue event source scrapes |
| `refresh-recalls` | Sun 02:00 | ~10 min | Fetch NHTSA recall data |
| `refresh-complaints` | Sun 02:30 | ~15 min | Fetch NHTSA complaint data |
| `process-scrape-jobs` | Sun 03:00 | ~45 min | Run car pipelines, event scrapes |
| `youtube-enrichment` | Mon 04:00 | ~30 min | Discover videos, transcripts, AI |
| `forum-scrape` | Tue/Fri 05:00 | ~30 min | Scrape forums, extract insights |
| `al-optimization` | Sat 03:00 | ~30 min | Generate all embeddings |

---

## Why This Order?

### 1. Car Expansion First (Sunday 1:00 AM)

The `weekly-car-expansion` job only **queues** cars - it doesn't actually create them. This means:
- The cars get processed by `process-scrape-jobs` at 3:00 AM
- New cars are ready before the week's enrichment jobs run
- By Saturday, the new cars have had time to get YouTube videos, forum mentions, etc.

### 2. External Data Before Processing (Sunday 2:00-2:30 AM)

Recalls and complaints from NHTSA should be refreshed before the car pipeline runs because:
- The car pipeline can link new cars to existing recalls
- Fresh complaint data helps populate `car_issues`

### 3. YouTube on Monday (Not Sunday)

Why Monday?
- Weekend content (videos published Sat/Sun) has time to be indexed by YouTube
- Separates heavy processing from Sunday's car expansion work
- Gives the system a "rest day" between heavy jobs

### 4. Forum Scraping Twice Weekly (Tue/Fri)

Why twice?
- Forums are constantly updated - once weekly isn't fresh enough
- Spreading across the week catches different discussion patterns
- Tue catches weekend discussions, Fri catches weekday threads

### 5. AL Optimization LAST (Saturday)

**This is critical!** The optimization job generates embeddings for:
- New cars created on Sunday
- New YouTube videos discovered Monday
- New forum insights extracted Tue/Fri

If it ran earlier, it would miss content created later in the week!

---

## Monitoring & Alerts

All jobs send Discord notifications on:
- ✅ Success (with metrics)
- ❌ Failure (with error details)
- ⚠️ Partial success (some records processed, some failed)

Check the Discord `#cron-notifications` channel for job status.

---

## Manual Triggers

All jobs can be triggered manually:

```bash
# Car expansion (dry run)
curl "https://autorev.vercel.app/api/cron/weekly-car-expansion?dryRun=true" \
  -H "Authorization: Bearer $CRON_SECRET"

# AL optimization
curl "https://autorev.vercel.app/api/cron/al-optimization" \
  -H "Authorization: Bearer $CRON_SECRET"

# YouTube enrichment for specific car
curl "https://autorev.vercel.app/api/cron/youtube-enrichment?carSlug=porsche-911-992" \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## Adding New Jobs

When adding a new cron job, consider:

1. **What data does it create?** → Should run BEFORE `al-optimization`
2. **What data does it need?** → Should run AFTER jobs that create that data
3. **How long does it take?** → Don't overlap with other heavy jobs
4. **Can it run in parallel?** → Use different time slots if not

Update this document when adding new jobs!

---

*See also: [DATABASE.md](./DATABASE.md) for table schemas, [AL.md](./AL.md) for AI assistant details*

