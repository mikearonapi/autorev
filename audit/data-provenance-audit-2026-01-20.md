# Data Provenance Audit Report

**Generated:** 2026-01-20
**Purpose:** Understand what data we have and its quality/source

---

## Executive Summary

| Data Type | Total | Real Sources | AI-Generated | Needs Data |
|-----------|-------|--------------|--------------|------------|
| Tuning Profiles | 322 | 54 (17%) | 165 (51%) | 103 (32%) |
| Known Issues | 9,104 | 7,313 (80%) | 0 | 1,791 (20%) |
| Community Insights | 1,252 | 1,252 (100%) | 0 | 0 |
| Part Fitments | 930 | 930 (100%) | 0 | 0 |
| YouTube Videos | 2,306 | 2,306 (100%) | 0 | 0 |
| Dyno Runs | 29 | 29 (100%) | 0 | 0 |

**Key Finding:** Tuning profiles are heavily AI-generated (51%). All other data sources are REAL.

---

## Tuning Profiles Analysis

### Confidence Tier Distribution

| Tier | Label | Count | Has Upgrades | Has Insights | Description |
|------|-------|-------|--------------|--------------|-------------|
| 1 | `verified` | 2 | 2 | 2 | Human-verified, highest trust |
| 2 | `extracted` | 52 | 52 | 26 | Mined from real sources by AI |
| 4 | `ai_enhanced` | 165 | 129 | 120 | AI-generated, needs validation |
| - | `needs_data` | 87 | 0 | 0 | Empty profiles, no data |
| - | `unknown` | 16 | 16 | 9 | Unclassified |

### Pipeline Version Analysis

| Pipeline | Count | Data Quality |
|----------|-------|--------------|
| `vehicle-data-pipeline@2.2` | 220 | Mixed - needs review |
| `1.2.0-batch` | 76 | AI-generated overnight runs |
| `1.0.0` | 22 | Original pipeline |
| `1.2.0-ai` | 4 | AI-generated |

### Recommendations for Tuning Profiles

1. **Tier 4 (ai_enhanced)**: 165 profiles need real data validation
   - Cross-reference with YouTube videos
   - Validate against forum discussions
   - Mark individual fields with confidence levels

2. **Tier 2 (extracted)**: 52 profiles are good foundation
   - Document extraction sources
   - Add YouTube video citations where available

3. **needs_data**: 87 profiles are empty
   - Prioritize cars with YouTube videos (can extract real data)
   - Don't fill with AI-generated content

---

## Known Issues Analysis (car_issues)

### Source Distribution

| Source | Issues | Cars | Confidence | Tier |
|--------|--------|------|------------|------|
| `nhtsa_complaint` | 3,153 | 55 | 1.00 | VERIFIED |
| `forum` | 2,188 | 295 | 0.84 | EXTRACTED |
| `nhtsa_complaints` | 797 | 52 | - | VERIFIED |
| `tsb` | 416 | 206 | 0.75 | VERIFIED |
| `owner_report` | 387 | 173 | - | COMMUNITY |
| `nhtsa` | 371 | 197 | - | VERIFIED |
| `research` | 193 | 109 | - | EXTRACTED |
| `unknown` | 1,598 | 271 | - | NEEDS REVIEW |
| `recall` | 1 | 1 | 0.88 | VERIFIED |

### Quality Assessment

- **REAL DATA**: 7,313 issues (80%) from verified government and forum sources
- **NEEDS REVIEW**: 1,598 issues (20%) have unknown source
- **STRONG**: NHTSA data is authoritative (government source)

### Recommendations

1. Classify the 1,598 "unknown" source issues
2. Continue forum scraping for more real issues
3. Issues are a STRONG foundation - no AI generation needed

---

## Community Insights Analysis (community_insights)

### Forum Distribution

| Forum | Insights | Cars | Confidence | Consensus |
|-------|----------|------|------------|-----------|
| `rennlist` | 1,226 | 11 | 0.78 | single_source |
| `ft86club` | 20 | 2 | 0.82 | single_source |
| `bimmerpost` | 6 | 1 | 0.90 | single_source |

### Quality Assessment

- **100% REAL**: All insights extracted from actual forum posts
- **NARROW COVERAGE**: Only 14 cars have community insights
- **OPPORTUNITY**: Need to expand forum coverage

### Recommendations

1. Expand forum scraping to cover more car makes:
   - BMW forums (bimmerpost, e46fanatics, e90post)
   - VW/Audi forums (vwvortex, audizine)
   - Mustang forums (mustang6g, svtperformance)
   - Honda forums (s2ki, civicx)
   - Subaru forums (nasioc, clubwrx)

2. Extract insights from our YouTube transcripts (2,306 videos!)

---

## Part Fitments Analysis (part_fitments)

### Current State

| Metric | Value |
|--------|-------|
| Total Fitments | 930 |
| Cars Covered | 98 |
| Unique Parts | 723 |
| Avg Fitments/Car | 9.5 |

### Quality Assessment

- **100% REAL**: All fitments from vendor catalogs
- **LIMITED COVERAGE**: Only 98 of 310 cars (32%)

### Recommendations

1. Expand vendor integrations:
   - ECS Tuning (VW/Audi/BMW/Porsche)
   - Turner Motorsport (BMW/MINI)
   - FTSpeed/MAPerformance (Subaru/Evo)
   - AmericanMuscle (Mustang/Camaro)
   - 4WheelParts (Trucks/SUVs)

---

## YouTube Videos Analysis (youtube_video_car_links)

### Current State

| Metric | Value |
|--------|-------|
| Total Videos | 2,306 |
| Cars Linked | ~150+ |

### Quality Assessment

- **100% REAL**: Actual YouTube video links
- **UNTAPPED GOLD**: Transcripts contain real recommendations

### Recommendations

1. **HIGH PRIORITY**: Build transcript mining pipeline
2. Extract:
   - Part recommendations with sentiment
   - Installation tips
   - Performance claims
   - Issues mentioned
3. Store extracted data with `source: youtube_transcript`

---

## Dyno Runs Analysis (car_dyno_runs)

### Current State

| Metric | Value |
|--------|-------|
| Total Runs | 29 |
| Cars Covered | 25 |

### Quality Assessment

- **100% REAL**: Actual dyno data
- **LIMITED**: Only 8% of cars have dyno data

### Recommendations

1. DO NOT seed fake/estimated dyno data
2. Virtual Dyno calculator handles estimates
3. Focus on collecting REAL dyno data:
   - User submissions with verification
   - Forum scraping for dyno results
   - Tuner shop partnerships

---

## Action Items by Priority

### Priority 1: YouTube Transcript Mining
- 2,306 videos with real data waiting to be extracted
- Can dramatically improve upgrade recommendations
- Source: REAL (Tier 2 - extracted)

### Priority 2: Vendor Fitment Expansion
- Only 32% of cars have fitments
- Real parts from real vendors
- Source: REAL (Tier 2 - extracted)

### Priority 3: Audit AI-Generated Profiles
- 165 profiles marked as `ai_enhanced`
- Validate against real sources
- Replace with real data as available

### Priority 4: Forum Expansion
- Only 14 cars have community insights
- Many enthusiast forums untapped
- Source: REAL (Tier 2 - extracted)

### Priority 5: Classify Unknown Sources
- 1,598 issues with unknown source
- 16 tuning profiles with unknown tier

---

## Confidence Tier Definitions

| Tier | Label | Confidence | Source Examples |
|------|-------|------------|-----------------|
| 1 | `verified` | 95%+ | OEM specs, recalls, human-verified |
| 2 | `extracted` | 80-90% | Forum posts, YouTube transcripts, vendor catalogs |
| 3 | `community` | 70-85% | User submissions, cross-validated |
| 4 | `ai_enhanced` | 60-75% | Claude-generated, needs validation |

---

## Database Schema Updates Applied

```sql
-- Added confidence_tier column
ALTER TABLE car_tuning_profiles 
ADD COLUMN confidence_tier TEXT DEFAULT 'unknown';

-- Updated existing data:
-- - AI-researched → ai_enhanced
-- - Enriched → extracted  
-- - Verified → verified
-- - Skeleton/unknown → needs_data
```

---

## Implementation Complete

### Final Results After Implementation

| Confidence Tier | Count | Has Upgrades | Has YouTube Data |
|-----------------|-------|--------------|------------------|
| **extracted** | 123 | 116 | 91 |
| **ai_enhanced** | 121 | 94 | 0 |
| **needs_data** | 69 | 0 | 0 |
| **verified** | 2 | 2 | 1 |
| **unknown** | 8 | 8 | 0 |

**Key Improvements:**
- 92 cars now have YouTube-extracted insights (real data from 2,200+ videos)
- 123 profiles upgraded to "extracted" tier (Tier 2 - real sources)
- All data now has confidence_tier and data_sources metadata
- AL system prompt updated to cite sources using provenance data

---

## Next Steps (Completed)

1. ✅ Phase 1 Complete: Audit and label existing data
2. ✅ Phase 2 Complete: YouTube transcript mining pipeline - 92 cars enriched
3. ✅ Phase 3 Complete: Vendor fitments verified (723 parts, 98 cars)
4. ✅ Phase 4 Complete: Continuous enrichment pipeline architecture documented
5. ✅ Phase 5 Complete: AL enhanced to cite real sources with provenance metadata
