# Events Database Expansion - Tracking System

> **Purpose:** Comprehensive tracking system for expanding car events database to 5,000+ verified events across top 500 US cities

---

## Directory Structure

```
docs/events-expansion/
├── README.md                    # This file
├── MASTER_TRACKER.md            # Overall progress dashboard
├── SOURCES.md                   # Verified data sources by category
├── cities/
│   ├── CITIES_BATCH_001.md      # Cities 1-50 progress
│   ├── CITIES_BATCH_002.md      # Cities 51-100 progress
│   └── ...                      # Additional batches
├── categories/
│   ├── cars-and-coffee.md       # Category-specific progress
│   ├── track-day-hpde.md        # Category-specific progress
│   ├── car-show.md              # Category-specific progress
│   └── ...                      # Additional categories
└── validation/
    ├── DUPLICATES_LOG.md        # Detected duplicates
    └── FAILED_SOURCES.md         # Sources that couldn't be scraped
```

---

## Critical Constraints

⚠️ **ONLY REAL EVENTS WITH VERIFIABLE SOURCES**

- Every event MUST have a `source_url` that can be verified
- NO synthetic, AI-generated, or placeholder events
- If you cannot find real events for a city/category, log it and move on
- Quality over quantity — 100 verified events beats 1000 fake ones

---

## How to Use This System

### 1. Starting a New Batch

1. Open the appropriate `CITIES_BATCH_XXX.md` file
2. Update status to "🟡 In Progress"
3. Set "Started" date
4. Process cities one by one
5. Update progress after each city

### 2. Processing a City

```bash
# Example: Process Leesburg, VA
node scripts/backfill-target-cities-eventbritesearch.js \
  --only=Leesburg,VA \
  --rangeStart=2026-01-01T00:00:00Z \
  --rangeEnd=2026-12-31T23:59:59Z \
  --limitPerCity=25
```

After running:
1. Check event count added
2. Verify all events have source_url
3. Update city row in batch file
4. Update batch summary

### 3. Updating Master Tracker

After completing a batch:
1. Update "Cities Processed" count
2. Update "Total Events" count
3. Update "Last Updated" timestamp
4. Update batch status

### 4. Logging Issues

**Duplicates:**
- Add to `validation/DUPLICATES_LOG.md`
- Include event IDs, names, URLs
- Mark resolution status

**Failed Sources:**
- Add to `validation/FAILED_SOURCES.md`
- Include error message, timestamp
- Document resolution steps

---

## Progress Tracking Workflow

### Daily Workflow

1. **Start:** Check MASTER_TRACKER.md for next batch
2. **Process:** Run backfill script for target cities
3. **Verify:** Confirm all events have source_url
4. **Update:** Update batch file with results
5. **Log:** Record any issues in validation files
6. **Complete:** Update master tracker

### Weekly Workflow

1. **Review:** Check all batch files for completeness
2. **Audit:** Run quality audit scripts
3. **Update:** Refresh master tracker metrics
4. **Plan:** Identify next batch to process

---

## Key Metrics to Track

### Per Batch
- Cities processed
- Events added per city
- Events with source_url (should be 100%)
- Failed cities
- Source performance

### Overall
- Total cities processed (target: 500)
- Total events (target: 5,000+)
- Events with source_url (target: 100%)
- Category coverage
- Geographic coverage

---

## Database Integration

This tracking system complements the database:

- **Events Table:** Stores actual event data
- **scrape_jobs:** Tracks ingestion runs
- **event_sources:** Configuration for sources
- **Tracking Files:** Human-readable progress logs

The tracking files enable:
- Resumable progress (know where you left off)
- Issue tracking (duplicates, failures)
- Performance monitoring (source success rates)
- Planning (identify gaps)

---

## Quality Assurance

### Before Marking Batch Complete

- [ ] All cities processed
- [ ] All events have source_url
- [ ] All events geocoded
- [ ] Duplicates reviewed/resolved
- [ ] Failed sources documented
- [ ] Master tracker updated

### Before Adding New Source

- [ ] Source verified (real events, verifiable URLs)
- [ ] Test fetcher on small sample
- [ ] Confirm source_url requirement met
- [ ] Document in SOURCES.md
- [ ] Add to event_sources table

---

## Related Documentation

- `docs/DATABASE.md` - Database schema reference
- `docs/EVENT_SOURCING_STRATEGY.md` - Sourcing strategy
- `docs/EVENTS_QUALITY_AUDIT.md` - Quality audit results
- `docs/EVENTS_MECE_AUDIT.md` - MECE audit results

---

## Scripts Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `backfill-target-cities-eventbritesearch.js` | Backfill events for cities | `--only=City,State --rangeStart=... --rangeEnd=...` |
| `enrich-events-2026-from-sources.js` | Enrich from all sources | `--sources=EventbriteSearch --limit=500` |
| `audit-events-quality.js` | Quality audit | `node scripts/audit-events-quality.js` |
| `audit-events-mece.js` | MECE audit | `node scripts/audit-events-mece.js` |

---

## Notes

- **Resumable:** Tracking files enable resuming after interruptions
- **Transparent:** All progress visible in markdown files
- **Quality-First:** Every event must be verifiable
- **Systematic:** Process cities in batches for manageable progress

---

## Questions?

- Check MASTER_TRACKER.md for overall status
- Check batch files for city-level progress
- Check validation files for issues
- Check SOURCES.md for source information

