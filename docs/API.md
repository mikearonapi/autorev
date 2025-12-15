# AutoRev API Reference

> Complete reference for all 43 API routes
>
> **Last Synced:** December 15, 2024

---

## Overview

| Category | Routes | Auth Required |
|----------|--------|---------------|
| Car Data | 17 | No |
| Parts | 3 | No |
| Users/AL | 4 | Yes |
| VIN | 3 | Yes |
| Internal | 8 | Admin |
| Cron | 5 | API Key |
| Other | 3 | Varies |

---

## Car Data Routes (17)

### `GET /api/cars`
**Purpose:** List all cars with basic info

**Query Params:**
- `limit` - Max number of results (default: all)
- `brand` - Filter by brand (e.g., "Porsche")
- `tier` - Filter by tier (e.g., "premium", "upper-mid", "mid", "budget")

**Response:**
```json
{
  "cars": [
    {
      "id": "uuid",
      "slug": "718-cayman-gt4",
      "name": "718 Cayman GT4",
      "brand": "Porsche",
      "tier": "premium",
      "category": "Mid-Engine",
      "hp": 414,
      "price_avg": 95000
    }
  ]
}
```

**Table:** `cars`

---

### `GET /api/cars/[slug]/efficiency`
**Purpose:** Get EPA fuel economy data

**Response:**
```json
{
  "efficiency": {
    "city_mpg": 18,
    "highway_mpg": 25,
    "combined_mpg": 21,
    "fuel_type": "Premium",
    "annual_fuel_cost": 2500,
    "co2_emissions": 420,
    "ghg_score": 4
  }
}
```

**Table:** `car_fuel_economy`

---

### `GET /api/cars/[slug]/safety-ratings`
**Purpose:** Get NHTSA and IIHS safety data

**Response:**
```json
{
  "safety": {
    "nhtsa_overall_rating": 5,
    "nhtsa_front_crash_rating": 5,
    "nhtsa_side_crash_rating": 5,
    "nhtsa_rollover_rating": 4,
    "recall_count": 2,
    "iihs_overall": "Good",
    "iihs_top_safety_pick": false,
    "safety_score": 85,
    "safety_grade": "A"
  }
}
```

**Table:** `car_safety_data`

---

### `GET /api/cars/[slug]/price-by-year`
**Purpose:** Get pricing by model year and price history

**Response:**
```json
{
  "pricesByYear": [
    { "model_year": 2020, "avg_price": 45000, "sample_size": 12 }
  ],
  "priceHistory": [
    { "recorded_at": "2024-01-01", "avg_price": 44000 }
  ],
  "bestValueYear": 2019,
  "bestValuePrice": 42000
}
```

**Tables:** `car_market_pricing_years`, `car_price_history`

---

### `GET /api/cars/[slug]/market-value`
**Purpose:** Get current market value aggregation

**Response:**
```json
{
  "marketValue": {
    "avg_price": 45000,
    "bat_avg": 46000,
    "carscom_avg": 44000,
    "hagerty_condition_2": 48000,
    "trend_direction": "stable",
    "confidence": "high"
  }
}
```

**Table:** `car_market_pricing`

---

### `GET /api/cars/[slug]/lap-times`
**Purpose:** Get track lap times

**Response:**
```json
{
  "lapTimes": [
    {
      "track_name": "Laguna Seca",
      "lap_time_text": "1:38.2",
      "is_stock": true,
      "tires": "Michelin PS4S",
      "source_url": "https://..."
    }
  ]
}
```

**Table:** `car_track_lap_times`

---

### `GET /api/cars/[slug]/dyno`
**Purpose:** Get dyno run data

**Response:**
```json
{
  "dynoRuns": [
    {
      "run_kind": "baseline",
      "peak_whp": 385,
      "peak_wtq": 340,
      "dyno_type": "Dynojet",
      "fuel": "93 octane",
      "source_url": "https://..."
    }
  ]
}
```

**Table:** `car_dyno_runs`

---

### `GET /api/cars/[slug]/maintenance`
**Purpose:** Get maintenance specs and known issues

**Response:**
```json
{
  "maintenance": {
    "oil": { "type": "Full Synthetic", "viscosity": "0W-40", "capacity_liters": 8.5 },
    "coolant": { "type": "OAT", "color": "Pink" },
    "brake_fluid": { "type": "DOT 4" }
  },
  "serviceIntervals": [...],
  "knownIssues": [...]
}
```

**Tables:** `vehicle_maintenance_specs`, `vehicle_service_intervals`, `car_issues`

---

### `GET /api/cars/[slug]/expert-reviews`
**Purpose:** Get YouTube reviews for a car

**Response:**
```json
{
  "videos": [
    {
      "title": "Is the GT4 worth it?",
      "channel_name": "Throttle House",
      "url": "https://youtube.com/...",
      "summary": "...",
      "pros_mentioned": [...],
      "cons_mentioned": [...]
    }
  ]
}
```

**Tables:** `youtube_video_car_links`, `youtube_videos`

---

### `GET /api/cars/[slug]/expert-consensus`
**Purpose:** Get AI-aggregated expert consensus

**Response:**
```json
{
  "consensus": {
    "strengths": ["handling", "sound"],
    "weaknesses": ["practicality"],
    "comparisons": ["cayman-gts", "supra"]
  }
}
```

---

### `GET /api/cars/[slug]/enriched`
**Purpose:** Get all enriched data in one call

**Response:** Combined object with safety, fuel, pricing, reviews

---

### `GET /api/cars/[slug]/safety`
**Purpose:** Fetch live NHTSA data (enrichment)

**Note:** Different from `/safety-ratings` (cached DB read)

---

### `GET /api/cars/[slug]/fuel-economy`
**Purpose:** Fetch live EPA data (enrichment)

**Note:** Different from `/efficiency` (cached DB read)

---

### `GET /api/cars/[slug]/pricing`
**Purpose:** Fetch live market prices (enrichment)

---

### `GET /api/cars/[slug]/manual-data`
**Purpose:** Get manually entered car data

### `POST /api/cars/[slug]/manual-data`
**Purpose:** Add manual car data

**Auth:** Admin

**Request:**
```json
{
  "field": "value"
}
```

---

### `GET /api/cars/expert-reviewed`
**Purpose:** List all cars with expert reviews

---

### `GET /api/cars/[slug]/recalls`
**Purpose:** Get recall campaigns for a car

**Query Params:**
- `limit` - Max recalls (default 50, max 200)
- `includeIncomplete` - Include incomplete records (default true)

**Response:**
```json
{
  "recalls": [
    {
      "car_slug": "718-cayman-gt4",
      "recall_campaign_number": "24V123",
      "recall_date": "2024-01-15",
      "component": "ELECTRICAL SYSTEM",
      "summary": "...",
      "consequence": "...",
      "remedy": "...",
      "manufacturer": "Porsche",
      "source_url": "https://...",
      "is_incomplete": false
    }
  ],
  "count": 5
}
```

**Table:** `car_recalls`

---

## Parts Routes (3)

### `GET /api/parts/search`
**Purpose:** Search parts catalog

**Query Params:**
- `q` - Search query
- `car_slug` - Filter by car fitment
- `category` - Part category
- `limit` - Max results

**Response:**
```json
{
  "parts": [
    {
      "id": "uuid",
      "name": "Cold Air Intake",
      "brand_name": "AFE",
      "part_number": "54-12202",
      "category": "intake",
      "fitment": { "verified": true, "requires_tune": false },
      "latest_price": { "price_cents": 35000, "vendor_name": "MAPerformance" }
    }
  ]
}
```

**Tables:** `parts`, `part_fitments`, `part_pricing_snapshots`

---

### `GET /api/parts/popular`
**Purpose:** Get popular parts for a car

**Query Params:**
- `car_slug` - Car identifier
- `limit` - Max results (default 10)

---

### `POST /api/parts/relationships`
**Purpose:** Get part compatibility relationships for multiple parts

**Method:** POST (requires body with part IDs)

> **Note:** This is POST, not GET, because it requires an array of part IDs in the request body.

**Request:**
```json
{
  "partIds": ["uuid-1", "uuid-2"]
}
```

**Response:**
```json
{
  "edges": [
    {
      "id": "uuid",
      "relation_type": "requires|suggests|conflicts",
      "reason": "Explanation",
      "part": { "id": "uuid", "name": "Part A", "brand_name": "Brand", "category": "intake" },
      "related_part": { "id": "uuid", "name": "Part B", "brand_name": "Brand", "category": "tune" }
    }
  ]
}
```

**Table:** `part_relationships`

---

## Users/AL Routes (4)

### `POST /api/ai-mechanic`
**Purpose:** Send message to AL assistant

**Auth:** Required

**Request:**
```json
{
  "message": "What's wrong with the E46 M3?",
  "conversationId": "optional-uuid",
  "carContext": { "slug": "bmw-m3-e46" }
}
```

**Response:**
```json
{
  "response": "The E46 M3 is known for...",
  "conversationId": "uuid",
  "usage": { "inputTokens": 1500, "outputTokens": 400, "costCents": 1.5 }
}
```

---

### `GET /api/users/[userId]/al-conversations`
**Purpose:** List user's AL conversations

**Auth:** User must match userId

---

### `GET /api/users/[userId]/al-conversations/[conversationId]`
**Purpose:** Get specific conversation with messages

---

### `GET /api/users/[userId]/al-credits`
**Purpose:** Get user's AL credit balance

**Response:**
```json
{
  "balance_cents": 75,
  "plan_id": "collector",
  "lifetime_spent_cents": 125
}
```

---

## VIN Routes (3)

### `POST /api/vin/decode`
**Purpose:** Decode VIN to car variant

**Auth:** Required (Collector tier)

**Request:**
```json
{
  "vin": "WP0AB29986S731234"
}
```

**Response:**
```json
{
  "car_slug": "718-cayman-gt4",
  "variant": {
    "model_year": 2020,
    "trim_level": "GT4",
    "engine_code": "4.0L flat-6"
  }
}
```

---

### `POST /api/vin/resolve`
**Purpose:** Match VIN to existing car variant

---

### `POST /api/vin/safety`
**Purpose:** Fetch VIN safety data from NHTSA (server-side proxy)

**Auth:** No (proxy for CORS bypass)

**Request:**
```json
{
  "vin": "WP0AB29986S731234",
  "year": 2020,
  "make": "Porsche",
  "model": "718 Cayman"
}
```

**Response:**
```json
{
  "recalls": [...],
  "complaints": [...],
  "investigations": [...],
  "safetyRatings": {...},
  "error": null
}
```

---

## Internal Routes (7)

All require admin authentication.

| Route | Purpose |
|-------|---------|
| `POST /api/internal/car-variants` | Manage car variants |
| `POST /api/internal/dyno/runs` | Add dyno data |
| `POST /api/internal/track/lap-times` | Add lap times |
| `POST /api/internal/parts/fitments` | Manage fitments |
| `POST /api/internal/knowledge/ingest` | Ingest documents |
| `POST /api/internal/maintenance/variant-overrides` | Variant-specific maintenance |
| `GET /api/internal/qa-report` | Generate QA report |

### Internal Route Method Variants

#### `/api/internal/car-variants`
| Method | Purpose |
|--------|---------|
| POST | Create car variant |
| GET | List variants (with optional filters) |
| PUT | Update existing variant |
| DELETE | Delete variant by ID |

#### `/api/internal/dyno/runs`
| Method | Purpose |
|--------|---------|
| POST | Add dyno run |
| GET | List dyno runs (with optional filters) |
| PUT | Update existing dyno run |
| DELETE | Delete dyno run by ID |

#### `/api/internal/track/lap-times`
| Method | Purpose |
|--------|---------|
| POST | Add lap time |
| GET | List lap times (with optional filters) |
| PUT | Update existing lap time |
| DELETE | Delete lap time by ID |

#### `/api/internal/parts/fitments`
| Method | Purpose |
|--------|---------|
| POST | Create fitment |
| GET | List fitments (with optional filters) |
| PUT | Update existing fitment |
| DELETE | Delete fitment by ID |

---

## Cron Routes (5)

Triggered by Vercel cron jobs. Schedules defined in `vercel.json`.

| Route | Purpose | Schedule |
|-------|---------|----------|
| `/api/cron/schedule-ingestion` | Queue enrichment jobs | Weekly (Sun 2:00 AM UTC) |
| `/api/cron/process-scrape-jobs` | Process scrape queue | Every 15 min (`*/15 * * * *`) |
| `/api/cron/process-scrape-jobs` | Weekly batch processing | Weekly (Sun 3:00 AM UTC) |
| `/api/cron/refresh-recalls` | Refresh NHTSA recall data | Weekly (Sun 2:30 AM UTC) |
| `/api/cron/youtube-enrichment` | Process YouTube queue | Weekly (Mon 4:00 AM UTC) |
| `/api/cron/forum-scrape` | Forum scraping + insight extraction | Bi-weekly (Tue, Fri 5:00 AM UTC) |

### `GET /api/cron/refresh-recalls`
**Purpose:** Refresh NHTSA recall data for all cars

**Auth:** Bearer token or `x-vercel-cron: true`

**Query Params:**
- `limitCars` - Max cars to process (default: all)
- `skipCars` - Skip first N cars
- `maxYearsPerCar` - Years to search per car (default: 25)
- `concurrency` - Parallel requests (default: 3, max: 8)

**Response:**
```json
{
  "startedAt": "2024-12-14T02:30:00.000Z",
  "totalCars": 98,
  "processed": 98,
  "newRecalls": 12,
  "durationMs": 45000
}
```

**Table:** `car_recalls`

---

### `GET /api/cron/forum-scrape`
**Purpose:** Forum Intelligence Pipeline - scrape forums and extract insights

**Auth:** Bearer token or `x-vercel-cron: true`

**Query Params:**
- `mode` - Pipeline mode: `scrape`, `extract`, or `both` (default: `both`)
- `forum` - Specific forum slug (default: all active)
- `maxThreads` - Max threads to scrape per forum (default: 20)
- `maxExtract` - Max threads to extract insights from (default: 10)

**Response:**
```json
{
  "mode": "both",
  "startedAt": "2024-12-15T05:00:00.000Z",
  "scrape": {
    "forums": ["rennlist", "bimmerpost"],
    "threadsFound": 45,
    "threadsScraped": 20,
    "postsScraped": 340
  },
  "extract": {
    "threadsProcessed": 10,
    "insightsExtracted": 25,
    "errors": 0
  },
  "completedAt": "2024-12-15T05:04:30.000Z",
  "success": true
}
```

**Tables:** `forum_sources`, `forum_scrape_runs`, `forum_scraped_threads`, `community_insights`

---

### `GET /api/internal/forum-insights`
**Purpose:** Get Forum Intelligence stats and recent activity

**Auth:** Bearer token (CRON_SECRET)

**Response:**
```json
{
  "overview": {
    "forumSources": 6,
    "activeSources": 6,
    "totalThreadsScraped": 150,
    "pendingThreads": 25,
    "totalInsights": 340
  },
  "forums": [...],
  "recentRuns": [...],
  "insightTypes": {
    "known_issue": 120,
    "maintenance_tip": 85,
    "modification_guide": 45
  },
  "topCarsWithInsights": {
    "911-992": 45,
    "m3-g80": 38
  }
}
```

---

### `POST /api/internal/forum-insights`
**Purpose:** Trigger manual forum operations

**Auth:** Bearer token (CRON_SECRET)

**Request (scrape action):**
```json
{
  "action": "scrape",
  "forum": "rennlist",
  "maxThreads": 10
}
```

**Request (extract action):**
```json
{
  "action": "extract",
  "maxExtract": 5
}
```

**Request (reprocess action):**
```json
{
  "action": "reprocess",
  "threadId": "uuid-of-thread"
}
```

**Response:** Varies by action

---

## Other Routes (3)

### `POST /api/contact`
**Purpose:** Submit contact form

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John",
  "interest": "services",
  "message": "..."
}
```

**Table:** `leads`

---

### `POST /api/feedback`
**Purpose:** Submit user feedback (enhanced for beta)

**Request:**
```json
{
  "message": "Description of feedback",
  "category": "bug|feature|data|general|praise",
  "severity": "blocking|major|minor",
  "rating": 4,
  "email": "optional@email.com",
  "pageUrl": "/browse-cars/718-cayman-gt4",
  "featureContext": "browse-cars",
  "carContext": "718-cayman-gt4",
  "browserInfo": { "browser": "Chrome", "os": "macOS" }
}
```

**Auto-Captured (server-side):**
- `userTier` from authenticated session
- `carContext` extracted from URL if not provided

**Validation:**
- `message` required
- `category` must be valid enum
- `severity` required if `category='bug'`
- `rating` must be 1-5 if provided

**Response:**
```json
{
  "success": true,
  "feedbackId": "uuid",
  "message": "Thank you for your feedback!"
}
```

**Table:** `user_feedback`

---

### `GET /api/feedback`
**Purpose:** Get feedback with filters (admin)

**Query Params:**
- `category` - Filter by category
- `severity` - Filter by severity
- `status` - Filter by status
- `unresolved` - If 'true', only show unresolved
- `limit` - Max results (default 50)

**Response:**
```json
{
  "counts": [...],
  "categoryStats": {...},
  "recent": [...]
}
```

---

### `PATCH /api/feedback`
**Purpose:** Update feedback status (admin)

**Auth:** Required (admin tier)

**Request:**
```json
{
  "feedbackId": "uuid",
  "status": "resolved",
  "resolved": true,
  "internalNotes": "Fixed in v1.2"
}
```

---

### `GET /auth/callback`
**Purpose:** Supabase auth callback handler

---

## Error Handling

All routes return consistent error format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common status codes:
- `400` - Bad request (missing params)
- `401` - Unauthorized
- `403` - Forbidden (tier restriction)
- `404` - Not found
- `500` - Server error

---

*See [DATABASE.md](DATABASE.md) for table schemas.*


