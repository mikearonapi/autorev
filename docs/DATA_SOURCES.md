# AutoRev Data Sources Documentation
**Last Updated**: 2026-01-21

This document catalogs all data ingestion patterns used by AutoRev, including their services, scripts, target tables, and refresh schedules.

---

## Quick Reference Matrix

| # | Source | Service/Script | Target Tables | Cron Schedule | Coverage |
|---|--------|---------------|---------------|---------------|----------|
| 1 | Shopify Parts JSON | `partsVendorIngestionService.js` | `parts`, `part_fitments`, `part_pricing_snapshots` | Weekly (manual) | 5,620 parts |
| 2 | YouTube Discovery | `youtubeClient.js` | `youtube_videos`, `youtube_video_car_links` | Mon 04:00 | 2,261 videos |
| 3 | Forum Scraping | `run-insight-extraction.js` | `forum_scraped_threads`, `community_insights` | Tue/Fri 05:00 | 1,252 insights |
| 4 | NHTSA Recalls | `recallService.js` | `car_recalls` | Sun 02:00 | 1,365 records |
| 5 | NHTSA Complaints | `complaintService.js` | `car_issues` | Sun 02:30 | 9,104 records |
| 6 | EPA Fuel Economy | `epaFuelEconomyService.js` | `car_fuel_economy` | On demand | 78% coverage |
| 7 | Reddit Insights (Apify) | `redditInsightService.js` | `community_insights` | Manual | ~20 cars |
| 8 | Events Multi-Source | `eventsService.js` | `events` | Daily 06:00 | 8,615 events |
| 9 | Knowledge Base | `knowledgeIndexService.js` | `source_documents`, `document_chunks` | Sat 03:00 | 7,448 chunks |
| 10 | Tuning Pipeline | `tuning-pipeline/*.mjs` | `car_tuning_profiles` | Manual | 323 profiles |
| 11 | Vehicle Data Pipeline | `vehicle-data-pipeline/*.mjs` | `cars`, `vehicle_maintenance_specs` | Manual | 310 cars |

---

## Detailed Source Documentation

---

### 1. Shopify Parts JSON Feed

**Purpose**: Ingest aftermarket parts from vendor Shopify stores with fitment data.

| Property | Value |
|----------|-------|
| **Service** | `lib/partsVendorIngestionService.js` |
| **Script** | `scripts/run-all-shopify-vendors.mjs` |
| **Cron** | Manual / Weekly |
| **Auth** | None (public Shopify JSON feeds) |
| **Rate Limit** | 350ms between requests |

**Target Tables**:
- `parts` - Part catalog (name, description, category)
- `part_fitments` - Vehicle fitment mappings
- `part_pricing_snapshots` - Price history
- `part_brands` - Brand registry

**Supported Vendors**:
```javascript
{
  eqtuning: { vendorUrl: 'https://eqtuning.com', families: ['vag'] },
  bmptuning: { vendorUrl: 'https://www.bmptuning.com', families: ['vag'] },
  performancebyie: { vendorUrl: 'https://performancebyie.com', families: ['vag'] },
  ftspeed: { vendorUrl: 'https://www.ftspeed.com', families: ['toyotasubaru', 'subaru'] },
  titanmotorsports: { vendorUrl: 'https://www.titanmotorsports.com', families: ['toyotasubaru'] },
  jhpusa: { vendorUrl: 'https://www.jhpusa.com', families: ['honda'] },
  maperformance: { vendorUrl: 'https://www.maperformance.com', families: ['mitsubishi', 'subaru', 'domestic'] },
}
```

**Fitment Resolution**:
1. First: Explicit `fitment_tag_mappings` table (high confidence)
2. Fallback: Pattern matching via `vendorAdapters.js` (60-85% confidence)

**Data Flow**:
```
Shopify /products.json → partsVendorIngestionService.js → parts + part_fitments
```

**Manual Run**:
```bash
node scripts/run-all-shopify-vendors.mjs
node scripts/run-shopify-ingest.mjs --vendor=eqtuning
```

---

### 2. YouTube Video Discovery & AI Processing

**Purpose**: Discover, transcribe, and extract insights from YouTube videos about cars.

| Property | Value |
|----------|-------|
| **Service** | `lib/youtubeClient.js` |
| **Cron Job** | `api/cron/youtube-enrichment` |
| **Schedule** | Monday 04:00 UTC |
| **Auth** | YouTube Data API v3 + Exa API |

**Target Tables**:
- `youtube_videos` - Video metadata and transcripts
- `youtube_video_car_links` - Video-to-car mappings (uses `car_id`)
- `youtube_channels` - Registered channels
- `youtube_ingestion_queue` - Processing queue
- `car_consensus` - Aggregated strengths/weaknesses from videos

**Data Flow**:
```
Exa Discovery → YouTube API metadata → Transcripts → AI Processing → car_consensus
```

**Processing Stages**:
1. **Discovery**: Find new videos via Exa API or channel scanning
2. **Metadata**: Fetch video details via YouTube API
3. **Transcription**: Extract video transcripts
4. **AI Analysis**: Extract key points, strengths, weaknesses
5. **Linking**: Map videos to cars via title/description parsing
6. **Consensus**: Aggregate findings into `car_consensus`

**Manual Run**:
```bash
node scripts/youtube-pipeline.js
node scripts/youtube-ai-processing.js --car=bmw-m3-e46
```

---

### 3. Forum Scraping & Insight Extraction

**Purpose**: Scrape automotive forums for community knowledge and extract structured insights.

| Property | Value |
|----------|-------|
| **Service** | `lib/forumScraperService.js` + `redditInsightService.js` |
| **Script** | `scripts/run-insight-extraction.js` |
| **Cron** | Tuesday/Friday 05:00 UTC |
| **Auth** | None (public forums) |

**Target Tables**:
- `forum_scraped_threads` - Raw scraped thread data
- `community_insights` - Extracted structured insights
- `forum_sources` - Registered forum configurations

**Insight Types**:
```javascript
const INSIGHT_TYPES = {
  known_issue: 'Problems, failures, common complaints',
  maintenance_tip: 'Maintenance advice and schedules',
  upgrade_recommendation: 'Part recommendations',
  dyno_result: 'Power measurements',
  diy_guide: 'How-to instructions',
  cost_estimate: 'Repair/mod costs',
  comparison: 'vs other cars/parts',
};
```

**Confidence Scoring**:
- Upvotes + comments → higher confidence
- Content length → moderate impact
- Source reputation → base modifier

**Data Flow**:
```
Forum HTML → Scraper → forum_scraped_threads → AI Extraction → community_insights
```

---

### 4. NHTSA Recall Data

**Purpose**: Fetch official safety recall data from NHTSA API.

| Property | Value |
|----------|-------|
| **Service** | `lib/recallService.js` |
| **Cron Job** | `api/cron/refresh-recalls` |
| **Schedule** | Sunday 02:00 UTC |
| **API** | https://api.nhtsa.gov/recalls |
| **Auth** | None (public API) |

**Target Tables**:
- `car_recalls` - Recall records linked to `car_id`

**API Response Mapping**:
```javascript
{
  nhtsa_campaign_id: recall.NHTSACampaignNumber,
  component: recall.Component,
  summary: recall.Summary,
  consequence: recall.Conequence,
  remedy: recall.Remedy,
  manufacture_date_start: recall.ManufactureBeginDate,
  manufacture_date_end: recall.ManufactureEndDate,
  report_received_date: recall.ReportReceivedDate,
}
```

**Manual Run**:
```bash
curl "https://autorev.vercel.app/api/cron/refresh-recalls" -H "Authorization: Bearer $CRON_SECRET"
```

---

### 5. NHTSA Complaint Data

**Purpose**: Fetch consumer complaint data from NHTSA API and populate `car_issues`.

| Property | Value |
|----------|-------|
| **Service** | `lib/complaintService.js` |
| **Cron Job** | `api/cron/refresh-complaints` |
| **Schedule** | Sunday 02:30 UTC |
| **API** | https://api.nhtsa.gov/complaints |
| **Auth** | None (public API) |

**Target Tables**:
- `car_issues` - Issues linked to `car_id`

**Data Quality**:
- All issues include `source = 'nhtsa'`
- Confidence based on complaint count
- ODI number for deduplication

---

### 6. EPA Fuel Economy Data

**Purpose**: Fetch official EPA fuel economy ratings.

| Property | Value |
|----------|-------|
| **Service** | `lib/epaFuelEconomyService.js` |
| **Schedule** | On demand (via API route) |
| **API** | https://www.fueleconomy.gov/feg/ws/ |
| **Auth** | None (public API) |

**Target Tables**:
- `car_fuel_economy` - MPG data linked to `car_id`

**Data Fields**:
```javascript
{
  city_mpg: number,
  highway_mpg: number,
  combined_mpg: number,
  fuel_type: string,
  annual_fuel_cost: number,
  epa_year: number,
}
```

**Current Coverage**: 78% of cars (241/310)

---

### 7. Reddit Community Insights (Apify)

**Purpose**: Scrape Reddit posts for community insights and knowledge.

| Property | Value |
|----------|-------|
| **Service** | `lib/redditInsightService.js` |
| **Script** | `scripts/apify/backfill-reddit-insights.mjs` |
| **Schedule** | Manual |
| **API** | Apify Reddit Scraper |
| **Auth** | `APIFY_API_TOKEN` |

**Target Tables**:
- `community_insights` - Structured insights linked to `car_id`

**Subreddits Targeted**:
- r/cars, r/Audi, r/BMW, r/Porsche
- Brand/model-specific subreddits

**Current Coverage**: ~20 cars (needs expansion)

---

### 8. Automotive Events (Multi-Source)

**Purpose**: Aggregate automotive events from multiple sources.

| Property | Value |
|----------|-------|
| **Service** | `lib/eventsService.js` |
| **Cron Job** | `api/cron/refresh-events` |
| **Schedule** | Daily 06:00 UTC |

**Target Tables**:
- `events` - Event catalog
- `event_saves` - User saved events

**Event Sources**:
- MotorsportReg (track days, autocross)
- Cars and Coffee directory
- Major auto shows (SEMA, PRI, etc.)
- Club events
- Auction houses

**Event Types**:
```javascript
['car_show', 'track_day', 'autocross', 'time_attack', 'auction', 'cars_and_coffee', 'rally', 'drift']
```

**Current Coverage**: 8,615 events

---

### 9. Knowledge Base Indexing

**Purpose**: Index documents and content for AL semantic search.

| Property | Value |
|----------|-------|
| **Service** | `lib/knowledgeIndexService.js` |
| **Cron Job** | `api/cron/al-optimization` |
| **Schedule** | Saturday 03:00 UTC |
| **Embeddings** | OpenAI `text-embedding-3-small` |

**Target Tables**:
- `source_documents` - Document metadata
- `document_chunks` - Chunked content with embeddings

**Indexed Content**:
- YouTube video transcripts
- Forum threads
- Encyclopedia articles
- Car specifications
- Tuning guides

**Current Coverage**: 7,448 chunks

---

### 10. Tuning Data Pipeline

**Purpose**: AI-powered tuning profile research and creation.

| Property | Value |
|----------|-------|
| **Service** | `scripts/tuning-pipeline/*.mjs` |
| **Schedule** | Manual |
| **AI** | Claude Sonnet 4 + Exa API |

**Target Tables**:
- `car_tuning_profiles` - Tuning recommendations
- `car_dyno_runs` - Dyno data

**Pipeline Steps**:
1. Research via Exa API
2. AI analysis and structure
3. Validation against known data
4. Database insertion

**Current Coverage**: 323 profiles (100% of cars)

---

### 11. Vehicle Data Pipeline

**Purpose**: Core vehicle specifications and maintenance data.

| Property | Value |
|----------|-------|
| **Service** | `scripts/vehicle-data-pipeline/*.mjs` |
| **Schedule** | Manual (one-time per car) |
| **AI** | Claude Sonnet 4 |

**Target Tables**:
- `cars` - Core vehicle catalog
- `car_variants` - Trim/generation variants
- `vehicle_maintenance_specs` - Maintenance data
- `vehicle_service_intervals` - Service schedules

**Current Coverage**: 310 cars (complete)

---

## Data Quality Framework

### Confidence Tiers

| Tier | Confidence | Sources | Example Tables |
|------|------------|---------|----------------|
| 1 verified | 95%+ | NHTSA, EPA, OEM | `car_recalls`, `car_fuel_economy` |
| 2 extracted | 80-90% | YouTube AI, structured APIs | `youtube_video_car_links`, `car_consensus` |
| 3 community | 70-85% | Reddit, forums (high engagement) | `community_insights` |
| 4 ai_enhanced | 60-75% | AI-generated gap fills | `car_tuning_profiles` |

### Provenance Columns

Most tables include provenance tracking:

```sql
source TEXT,           -- e.g., 'nhtsa', 'youtube', 'forum'
source_url TEXT,       -- Original data URL
confidence DECIMAL,    -- 0.0 to 1.0
fetched_at TIMESTAMPTZ -- When data was retrieved
```

---

## Database Integrity Rules

### 1. Car ID Resolution

**ALWAYS** use `car_id` for queries, never `car_slug` alone:

```javascript
// ✅ CORRECT
import { resolveCarId } from '@/lib/carResolver';
const carId = await resolveCarId(carSlug);
const { data } = await supabase
  .from('car_issues')
  .select('*')
  .eq('car_id', carId);

// ❌ WRONG
const { data } = await supabase
  .from('car_issues')
  .select('*')
  .eq('car_slug', carSlug);
```

### 2. New Ingestion Requirements

Every new data source MUST:
1. Link to `car_id` via foreign key
2. Include `source` and `confidence` columns
3. Handle deduplication
4. Log to Discord on success/failure

---

## Future Data Sources (Planned)

| Source | Purpose | Status |
|--------|---------|--------|
| Turn 14 Distribution API | ACES-compliant parts fitment | Research complete |
| SEMA Data Co-Op | Industry-standard parts data | Requires membership |
| Hagerty API | Classic car valuations | Not started |
| Cars.com Listings | Current market prices | Not started |

See `docs/TURN14_SEMA_RESEARCH.md` for detailed integration research.

---

## Cron Job Quick Reference

| Job | Schedule | What it runs |
|-----|----------|--------------|
| `refresh-recalls` | Sun 02:00 | NHTSA → `car_recalls` |
| `refresh-complaints` | Sun 02:30 | NHTSA → `car_issues` |
| `youtube-enrichment` | Mon 04:00 | YouTube → `youtube_videos` |
| `forum-scrape` | Tue/Fri 05:00 | Forums → `community_insights` |
| `refresh-events` | Daily 06:00 | Multi-source → `events` |
| `al-optimization` | Sat 03:00 | Embeddings → `document_chunks` |

See `docs/CRON_JOBS.md` for complete schedule and dependencies.

---

## Related Documentation

- [DATABASE.md](./DATABASE.md) - Complete table schemas
- [CRON_JOBS.md](./CRON_JOBS.md) - Cron schedule and dependencies
- [TURN14_SEMA_RESEARCH.md](./TURN14_SEMA_RESEARCH.md) - Parts data integration research
- [ENRICHMENT-PIPELINE.md](./ENRICHMENT-PIPELINE.md) - Enrichment philosophy
