# Continuous Enrichment Pipeline Architecture

> **Philosophy:** Real data from real sources, continuously enriched, AI analyzes and synthesizes.

---

## Overview

The enrichment pipeline is an always-running system that grows our real data foundation through multiple automated and semi-automated channels.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DATA SOURCES                                     │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────┤
│   YouTube   │   Forums    │   Vendors   │    Users    │    NHTSA    │
│   Videos    │   Threads   │   Catalogs  │  Submissions│   Gov Data  │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┘
       │             │             │             │             │
       ▼             ▼             ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    INGESTION LAYER                                   │
├─────────────────────────────────────────────────────────────────────┤
│  • YouTube Monitor (new videos from tracked channels)                │
│  • Forum Listener (new posts from monitored forums)                  │
│  • Vendor Sync (periodic catalog refresh)                            │
│  • User Submission API (dyno results, build logs)                    │
│  • NHTSA Feed (complaints, recalls, TSBs)                            │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EXTRACTION LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│  • AI Extraction (Claude) - structured data from unstructured text   │
│  • Pattern Matching - fitments from vendor tags                      │
│  • Validation Rules - data quality checks                            │
│  • Confidence Scoring - assign tier based on source                  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    STORAGE LAYER                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Tables with provenance:                                             │
│  • car_tuning_profiles (upgrades, insights)                          │
│  • car_issues (problems, fixes)                                      │
│  • community_insights (forum wisdom)                                 │
│  • part_fitments (verified parts)                                    │
│  • car_dyno_runs (real measurements)                                 │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    OUTPUT LAYER                                      │
├─────────────┬─────────────────────────────────────────┬─────────────┤
│   API       │              AL Assistant               │     UI      │
│   Layer     │  (synthesizes, cites sources)           │   Display   │
└─────────────┴─────────────────────────────────────────┴─────────────┘
```

---

## Data Confidence Tiers

Every piece of data has a confidence tier tracking its provenance:

| Tier | Label | Confidence | Sources | Example |
|------|-------|------------|---------|---------|
| 1 | `verified` | 95%+ | Human-verified, OEM | Official recalls, verified specs |
| 2 | `extracted` | 80-90% | AI-extracted from real sources | YouTube transcript insights |
| 3 | `community` | 70-85% | User-submitted, cross-validated | Dyno results with photos |
| 4 | `ai_enhanced` | 60-75% | AI-generated to fill gaps | Generated when no real data |

**Rule:** Tier 4 data should be clearly labeled and replaced with real data when available.

---

## Component Details

### 1. YouTube Monitor

**Purpose:** Track automotive YouTube channels and process new videos automatically.

**Location:** `scripts/youtube-monitor.mjs`

**Workflow:**
1. Daily scan of tracked channels for new videos
2. Filter by relevance (car name in title, automotive content)
3. Fetch transcripts via Supadata API
4. Process through existing AI extraction pipeline
5. Link to cars and store insights

**Tracked Channels:**
- Savagegeese
- Doug DeMuro
- Engineering Explained
- ThrottleHouse
- Donut Media
- Speed Academy
- TheSmokingTire
- ChrisFix (DIY)
- And more...

### 2. Forum Listener

**Purpose:** Monitor enthusiast forums for new insights about specific platforms.

**Forums to Monitor:**
| Forum | Platforms | Priority |
|-------|-----------|----------|
| Rennlist | Porsche | High |
| Bimmerpost | BMW | High |
| VWVortex | VW/Audi | High |
| E46Fanatics | BMW E46 | Medium |
| S2KI | Honda S2000 | Medium |
| NASIOC | Subaru | Medium |
| MX-5 Miata.net | Mazda Miata | Medium |

**Extraction Focus:**
- Common issues and fixes
- Part recommendations
- Build logs
- Dyno results

### 3. Vendor Catalog Sync

**Purpose:** Keep part fitments current with vendor catalogs.

**Current Vendors:**
- EQTuning (VW/Audi)
- Integrated Engineering (VW/Audi)
- BMP Tuning (Various)
- 034 Motorsport (Audi)

**Expansion Targets:**
- ECS Tuning (VW/Audi/BMW/Porsche)
- Turner Motorsport (BMW/MINI)
- FTSpeed (Subaru/Evo)
- AmericanMuscle (Mustang/Camaro)
- 4WheelParts (Trucks/SUVs)

### 4. User Submission Workflow

**Purpose:** Allow verified users to contribute real data.

**Submission Types:**
- Dyno results (with verification)
- Build logs
- Part reviews
- Issue reports

**Verification:**
- Photo proof required
- Cross-reference with existing data
- Community validation (upvotes)
- Confidence increases with validation

### 5. NHTSA Integration

**Status:** Already integrated - 7,313 issues from NHTSA

**Data Types:**
- Consumer complaints
- Technical Service Bulletins (TSBs)
- Recalls
- Investigation reports

---

## Scripts Reference

| Script | Purpose | Schedule |
|--------|---------|----------|
| `youtube-insight-extraction.mjs` | Extract insights from YouTube | On new video |
| `youtube-diy-processor.js` | Extract DIY/build content | On new video |
| `youtube-ai-processing.js` | AI analysis of transcripts | On new video |
| `expandFitments.mjs` | Expand part fitments | Weekly |
| `run-insight-extraction.js` | Forum insight extraction | Daily |

---

## Database Tables with Provenance

### car_tuning_profiles
```sql
-- Key provenance columns:
confidence_tier TEXT,    -- verified, extracted, community, ai_enhanced
data_sources JSONB,      -- { youtube_extraction: true, video_count: 50 }
data_quality_tier TEXT,  -- enriched, researched, templated
```

### car_issues
```sql
-- Key provenance columns:
source_type TEXT,        -- nhtsa_complaint, forum, tsb, owner_report
source_url TEXT,
confidence NUMERIC,
```

### community_insights
```sql
-- Key provenance columns:
source_forum TEXT,       -- rennlist, bimmerpost, etc.
consensus_strength TEXT, -- strong, moderate, single_source
confidence FLOAT,
is_verified BOOLEAN,
```

### part_fitments
```sql
-- Key provenance columns:
match_confidence NUMERIC,
match_method TEXT,       -- exact_match, pattern_match, manual
notes TEXT,              -- source vendor, verification status
```

---

## AL Integration

AL (AutoRev AI) uses this data with clear source attribution:

```javascript
// AL response pattern
{
  recommendation: "IE Cold Air Intake",
  confidence: 0.85,
  sources: [
    { type: "youtube", count: 18, sentiment: "positive" },
    { type: "forum", count: 12, sentiment: "positive" },
    { type: "vendor", verified: true }
  ],
  citation: "Based on 18 YouTube reviews and 12 forum discussions"
}
```

**AL Rules:**
1. Always cite data sources
2. Prefer Tier 1-2 data over Tier 4
3. Never invent specifications
4. Clearly indicate confidence level
5. Acknowledge when data is limited

---

## Success Metrics

| Metric | Current | 30-Day Target | 90-Day Target |
|--------|---------|---------------|---------------|
| Data with real sources | ~50% | 75% | 90% |
| YouTube insights extracted | 92 cars | 150 cars | 200 cars |
| Vendor fitments | 930 | 1,500 | 3,000 |
| Real dyno runs | 25 | 50 | 100 |
| Forum insights coverage | 14 cars | 50 cars | 100 cars |

---

## Running the Pipeline

### Manual Runs

```bash
# YouTube extraction (all cars with videos)
node scripts/youtube-insight-extraction.mjs --all

# Forum insight extraction
node scripts/run-insight-extraction.js --car-slugs "bmw-m3-e46,honda-s2000"

# Part fitment expansion
node scripts/expandFitments.mjs --verbose
```

### Scheduled Jobs (Future)

```yaml
# .github/workflows/enrichment.yml
jobs:
  youtube-monitor:
    schedule: "0 0 * * *"  # Daily at midnight
    script: youtube-monitor.mjs
  
  vendor-sync:
    schedule: "0 0 * * 0"  # Weekly on Sunday
    script: expandFitments.mjs
```

---

## Data Quality Alerts

The pipeline should alert on:
- Low confidence data accumulation
- Source coverage dropping
- Extraction failures
- Stale data (no updates in 30 days)

```javascript
// Example alert rule
if (confidence_tier === 'ai_enhanced' && percent > 0.4) {
  alert('Over 40% of data is AI-generated, need more real sources');
}
```

---

## Version History

- **2026-01-20**: Initial architecture design
- Phase 1: Data audit completed
- Phase 2: YouTube extraction operational (92 cars)
- Phase 3: Vendor fitments verified (723 parts, 98 cars)
- Phase 4: Architecture documented
