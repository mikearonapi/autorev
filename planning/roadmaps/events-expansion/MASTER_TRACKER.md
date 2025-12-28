# Car Events Database Expansion - Master Tracker

> **Started:** 2024-12-15  
> **Last Updated:** 2024-12-15  
> **Pipeline Status:** ✅ READY  
> **Current Events:** 21 (verified in database)  
> **Total Events Target:** ~5,000-10,000 verified events  
> **Critical Constraint:** ONLY real events with verifiable source_url

---

## Progress Dashboard

| Metric | Current | Target | % Complete |
|--------|---------|--------|------------|
| **Cities Processed** | 0 | 494 | 0% |
| **Categories Complete** | 0 | 10 | 0% |
| **Total Events** | 21 | 5,000+ | 0.4% |
| **Events with Source URL** | 21 | 100% | 100% |
| **Events Approved** | 21 | 100% | 100% |
| **Future Events (2026+)** | TBD | 3,000+ | TBD |
| **Track Events** | 0 | 500+ | 0% |

---

## Current Event Breakdown by Category

| Category | Count | Target | % | Priority |
|----------|-------|--------|---|----------|
| Cars & Coffee | 11 | 2,000 | 0.6% | ★★★ |
| Cruise / Drive | 6 | 300 | 2.0% | ★★ |
| Car Show | 2 | 500 | 0.4% | ★★★ |
| Other | 2 | 100 | 2.0% | ★ |
| Club Meetup | 0 | 500 | 0% | ★★ |
| **Autocross** | 0 | 400 | 0% | **🔴 CRITICAL** |
| **Track Day / HPDE** | 0 | 600 | 0% | **🔴 CRITICAL** |
| **Time Attack** | 0 | 100 | 0% | **🔴 CRITICAL** |
| Industry Event | 0 | 200 | 0% | ★ |
| Auction | 0 | 300 | 0% | ★ |

---

## Pipeline Infrastructure

### Source Registry

| Source | Status | Fetcher | Type | Notes |
|--------|--------|---------|------|-------|
| EventbriteSearch | ✅ Active | `eventbritesearch.js` | Scrape | City-based search, 6 queries |
| CarsAndCoffeeEvents | ✅ Active | `carsandcoffeeevents.js` | Scrape | Tribe calendar parsing |
| MotorsportReg | ⚠️ Partial | `motorsportreg.js` | Scrape | Often blocked by captcha |
| SCCA | ✅ Active | `scca.js` | JSON/Scrape | Calendar feed + details |
| PCA | ✅ Active | `pca.js` | Scrape | Porsche club events |
| **Track Venues** | ✅ **NEW** | `trackVenueFetcher.js` | Scrape | 30 US tracks, direct source |
| **iCal Feeds** | ✅ **NEW** | `icalAggregator.js` | iCal | Club calendars (PCA, SCCA) |
| Rideology | ⚠️ Blocked | `rideology.js` | Scrape | Bot protection active |
| Facebook Events | ❌ Disabled | `facebookEvents.js` | — | API restrictions |

### Pipeline Components

| Component | File | Status | Description |
|-----------|------|--------|-------------|
| **Unified Pipeline** | `lib/eventIngestionPipeline.js` | ✅ NEW | Multi-source orchestrator |
| **Track Venue Fetcher** | `lib/eventSourceFetchers/trackVenueFetcher.js` | ✅ NEW | 30 US tracks |
| **iCal Aggregator** | `lib/eventSourceFetchers/icalAggregator.js` | ✅ NEW | Club iCal feeds |
| Pipeline Runner | `scripts/run-event-pipeline.js` | ✅ NEW | CLI for full pipeline |
| Track Backfill | `scripts/backfill-track-events.js` | ✅ NEW | Priority track events |
| City Backfill | `scripts/backfill-target-cities-eventbritesearch.js` | ✅ Ready | City-by-city |
| Deduplication | `lib/eventDeduplication.js` | ✅ Ready | Levenshtein-based |
| Event Builder | `lib/eventsIngestion/buildEventRows.js` | ✅ Ready | Row normalization |

---

## Track Venues by Region

| Region | Tracks | Status |
|--------|--------|--------|
| Southeast | 5 | Road Atlanta, Barber, Sebring, Daytona, AMP |
| Mid-Atlantic | 4 | VIR, Summit Point, NJMP, Pocono |
| New England | 3 | Watkins Glen, Lime Rock, Thompson |
| Great Lakes | 5 | Road America, Mid-Ohio, Grattan, Autobahn, GingerMan |
| Pacific | 6 | Laguna Seca, Sonoma, Thunderhill, Buttonwillow, Pacific, Portland |
| Southwest | 4 | COTA, Motorsport Ranch, Harris Hill, Phoenix |
| Mountain | 2 | High Plains, Utah Motorsports |

---

## City Batches

| Batch | Cities | Priority | Status | Events Added | Last Updated | Notes |
|-------|--------|----------|--------|--------------|--------------|-------|
| 001 | 1-50 | Tier 1 | ⬜ Not Started | 0 | — | Top 50 by population |
| 002 | 51-100 | Tier 2 | ⬜ Not Started | 0 | — | 49 cities |
| 003 | 101-150 | Tier 3 | ⬜ Not Started | 0 | — | — |
| 004 | 151-200 | Tier 3 | ⬜ Not Started | 0 | — | — |
| 005 | 201-250 | Tier 3 | ⬜ Not Started | 0 | — | — |
| 006 | 251-300 | Tier 4 | ⬜ Not Started | 0 | — | — |
| 007 | 301-350 | Tier 4 | ⬜ Not Started | 0 | — | — |
| 008 | 351-400 | Tier 4 | ⬜ Not Started | 0 | — | — |
| 009 | 401-450 | Tier 4 | ⬜ Not Started | 0 | — | — |
| 010 | 451-494 | Tier 4 | ⬜ Not Started | 0 | — | 44 cities |

**Status Legend:**
- ⬜ Not Started
- 🟡 In Progress
- ✅ Complete
- ⚠️ Blocked/Issues

---

## Pipeline Runs

| Job ID | Date | Sources | Fetched | Inserted | Errors | Notes |
|--------|------|---------|---------|----------|--------|-------|
| — | — | — | — | — | — | No runs yet |

---

## How to Run

### Full Pipeline (All Sources)
```bash
cd "/Volumes/10TB External HD/01. Apps - WORKING/AutoRev"
node scripts/run-event-pipeline.js --all
```

### Track Events Only (Priority)
```bash
node scripts/backfill-track-events.js
```

### Dry Run (Test without DB writes)
```bash
node scripts/run-event-pipeline.js --all --dryRun --limitPerSource=10
```

### City-by-City (Eventbrite)
```bash
node scripts/backfill-target-cities-eventbritesearch.js --priorityTier=1 --cityLimit=10 --rangeStart=2026-01-01 --rangeEnd=2026-12-31
```

---

## Recommended Execution Order

1. **FIRST**: Run track events backfill (biggest gap)
   ```bash
   node scripts/backfill-track-events.js
   ```

2. **SECOND**: Run full pipeline to hit all sources
   ```bash
   node scripts/run-event-pipeline.js --all --rangeStart=2026-01-01 --rangeEnd=2026-12-31
   ```

3. **THIRD**: Backfill by city for comprehensive coverage
   ```bash
   node scripts/backfill-target-cities-eventbritesearch.js --priorityTier=1 --cityLimit=50
   ```

---

## Quality Metrics

| Metric | Value | Target | Status |
|--------|-------|-------|--------|
| Events with source_url | 21 | 100% | ✅ |
| Events geocoded | 21 | 100% | ✅ |
| Duplicate detection rate | TBD | <1% | — |
| Failed source attempts | 0 | Track all | ⬜ |
| Validation errors | 0 | 0 | ✅ |

---

## Next Actions

### Immediate (Priority)
- [x] Build track venue calendar fetcher
- [x] Build iCal aggregator for club calendars
- [x] Create unified ingestion pipeline
- [x] Create priority track backfill script
- [ ] **Run track events backfill** ← NEXT
- [ ] Run full pipeline

### Short-term (Week 1-2)
- [ ] Process 200+ track events from venues
- [ ] Process 100+ autocross events from SCCA
- [ ] Process Batch 001 cities via Eventbrite
- [ ] Validate all events have source_url

### Medium-term (Months 1-2)
- [ ] Complete top 500 cities
- [ ] Achieve 3,000+ verified events
- [ ] Category-specific expansion
- [ ] Quality audit completion

---

## Notes

- **Data Quality First**: Every event MUST have a verifiable source_url
- **No Synthetic Data**: If we can't find real events, log it and move on
- **Provenance Tracking**: All events linked to scrape_jobs + event_sources
- **Resumable**: Tracking files enable resuming after interruptions
- **Track Events Priority**: Zero coverage currently - critical gap

---

## Related Files

- `/cities/` - City batch progress files
- `/categories/` - Category-specific tracking
- `/validation/` - Duplicate detection and failed sources logs
- `/SOURCES.md` - Verified data sources by category
