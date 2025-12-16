# AutoRev API Reference

> Complete reference for all 55 API routes
>
> **Last Verified:** December 15, 2024 — MCP-verified file listing

---

## Overview

| Category | Routes | Auth Required |
|----------|--------|---------------|
| Car Data | 18 | No |
| Parts | 3 | No |
| Events | 6 | Mixed |
| Users/AL | 4 | Yes |
| VIN | 3 | Yes |
| Internal | 10 | Admin |
| Cron | 7 | API Key |
| Other | 4 | Varies |

---

## Car Data Routes (18)

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

## Events Routes (6)

### `GET /api/events`
**Purpose:** List/search upcoming car events with filtering

**Query Params:**
- `zip` - ZIP code for location filtering
- `radius` - Radius in miles for distance search (requires zip, default 50, max 500)
- `city` - City name (supports partial match)
- `state` - State code (e.g., "CA", "TX")
- `region` - Region name (Northeast, Southeast, Midwest, Southwest, West)
- `scope` - Event scope (local, regional, national)
- `type` - Event type slug (e.g., "cars-and-coffee", "track-day")
- `is_track_event` - Filter to track events only (boolean)
- `is_free` - Filter to free events only (boolean)
- `brand` - Filter by car brand affinity
- `car_slug` - Filter by specific car affinity
- `start_after` - ISO date string, events after this date
- `start_before` - ISO date string, events before this date
- `limit` - Max results (default 20, max 100)
- `offset` - Pagination offset (default 0)
- `sort` - Sort order: "date", "featured", or "distance" (default "date")

**Response:**
```json
{
  "events": [
    {
      "id": "uuid",
      "slug": "cars-coffee-malibu-jan-2025",
      "name": "Malibu Cars & Coffee",
      "description": "Monthly morning meetup...",
      "distance_miles": 12.5,
      "event_type": {
        "slug": "cars-and-coffee",
        "name": "Cars & Coffee",
        "icon": "☕",
        "is_track_event": false
      },
      "start_date": "2025-01-18",
      "end_date": null,
      "start_time": "07:30:00",
      "end_time": "10:00:00",
      "timezone": "America/Los_Angeles",
      "venue_name": "PCH Meetup Spot",
      "city": "Malibu",
      "state": "CA",
      "zip": "90265",
      "region": "West",
      "scope": "local",
      "source_url": "https://...",
      "source_name": "Malibu Cars & Coffee",
      "registration_url": null,
      "image_url": "https://...",
      "cost_text": "Free",
      "is_free": true,
      "featured": true,
      "car_affinities": [
        { "car_id": null, "car_slug": null, "car_name": null, "brand": "Porsche", "affinity_type": "featured" }
      ]
    }
  ],
  "total": 15,
  "limit": 20,
  "offset": 0,
  "searchCenter": {
    "latitude": 38.8977,
    "longitude": -77.0365,
    "radius": 50,
    "zip": "22033"
  }
}
```

**Notes:**
- Only returns events where `status='approved'` AND `start_date >= today`
- Sorted by `featured DESC, start_date ASC` by default
- When `zip` and `radius` are provided, performs geocoded radius search
- `distance_miles` field included in events when radius search is used
- `searchCenter` object included in response when radius search is used
- Events without latitude/longitude are excluded from radius search results

**Tables:** `events`, `event_types`, `event_car_affinities`

---

### `GET /api/events/[slug]`
**Purpose:** Get single event details by slug

**Response:**
```json
{
  "event": {
    "id": "uuid",
    "slug": "cars-coffee-malibu-jan-2025",
    "name": "Malibu Cars & Coffee",
    "description": "...",
    "event_type": { "slug": "cars-and-coffee", "name": "Cars & Coffee", "description": "...", "icon": "☕", "is_track_event": false },
    "start_date": "2025-01-18",
    "end_date": null,
    "start_time": "07:30:00",
    "end_time": "10:00:00",
    "timezone": "America/Los_Angeles",
    "venue_name": "PCH Meetup Spot",
    "address": "22000 Pacific Coast Hwy",
    "city": "Malibu",
    "state": "CA",
    "zip": "90265",
    "country": "USA",
    "latitude": 34.0259,
    "longitude": -118.7798,
    "region": "West",
    "scope": "local",
    "source_url": "https://...",
    "source_name": "Malibu Cars & Coffee",
    "registration_url": null,
    "image_url": "https://...",
    "cost_text": "Free",
    "is_free": true,
    "featured": true,
    "car_affinities": [...]
  }
}
```

**Error Responses:**
- `404` - Event not found or not approved

**Tables:** `events`, `event_types`, `event_car_affinities`

---

### `GET /api/events/types`
**Purpose:** Get all event types for filtering

**Response:**
```json
{
  "types": [
    { "slug": "cars-and-coffee", "name": "Cars & Coffee", "description": "Morning car meetups", "icon": "☕", "is_track_event": false, "sort_order": 1 },
    { "slug": "track-day", "name": "Track Day / HPDE", "description": "High Performance Driver Education", "icon": "🏁", "is_track_event": true, "sort_order": 6 }
  ]
}
```

**Table:** `event_types`

---

### `POST /api/events/submit`
**Purpose:** Submit an event for review (user submission)

**Auth:** Required

**Request:**
```json
{
  "name": "Sunset Cars & Coffee",
  "event_type_slug": "cars-and-coffee",
  "source_url": "https://example.com/event",
  "start_date": "2025-03-15",
  "end_date": null,
  "venue_name": "Downtown Plaza",
  "city": "Austin",
  "state": "TX",
  "description": "Monthly morning meetup for car enthusiasts"
}
```

**Response:**
```json
{
  "success": true,
  "submissionId": "uuid",
  "message": "Event submitted successfully. It will be reviewed within 48 hours."
}
```

**Error Responses:**
- `400` - Validation error (missing fields, invalid URL, past date)
- `401` - Authentication required

**Table:** `event_submissions`

---

### `POST /api/events/[slug]/save`
**Purpose:** Save (bookmark) an event

**Auth:** Required (Collector+ tier)

**Response:**
```json
{
  "saved": true,
  "alreadySaved": false
}
```

**Error Responses:**
- `401` - Authentication required
- `403` - Requires Collector tier
- `404` - Event not found or not approved

**Table:** `event_saves`

---

### `DELETE /api/events/[slug]/save`
**Purpose:** Unsave (remove bookmark from) an event

**Auth:** Required

**Response:**
```json
{
  "saved": false
}
```

**Table:** `event_saves`

---

### `GET /api/users/[userId]/saved-events`
**Purpose:** Get user's saved events

**Auth:** Required (must be own user ID)

**Query Params:**
- `includeExpired` (boolean, default: false): Include events with past start dates

**Response:**
```json
{
  "savedEvents": [
    {
      "saved_at": "2025-01-15T10:30:00Z",
      "notes": "Don't forget to bring the 911",
      "event": {
        "id": "uuid",
        "slug": "cars-coffee-malibu-jan-2025",
        "name": "Malibu Cars & Coffee",
        "event_type": { "slug": "cars-and-coffee", "name": "Cars & Coffee", "icon": "☕" },
        "start_date": "2025-01-18",
        "city": "Malibu",
        "state": "CA",
        "...": "full event object"
      }
    }
  ]
}
```

**Error Responses:**
- `401` - Authentication required
- `403` - Cannot access other user's saved events

**Tables:** `event_saves`, `events`

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

## Internal Routes (10)

All require admin authentication.

### Event Moderation

### `GET /api/internal/events/submissions`
**Purpose:** List event submissions for moderation

**Query Params:**
- `status` (string): Filter by status (`pending`, `approved`, `rejected`, `all`)
- `limit` (number, default: 20): Max results
- `offset` (number, default: 0): Pagination offset

**Response:**
```json
{
  "submissions": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Sunset Cars & Coffee",
      "event_type_slug": "cars-and-coffee",
      "source_url": "https://...",
      "start_date": "2025-03-15",
      "city": "Austin",
      "state": "TX",
      "status": "pending",
      "created_at": "2025-01-10T14:00:00Z",
      "user_profiles": {
        "email": "user@example.com",
        "display_name": "John D."
      }
    }
  ],
  "total": 15
}
```

**Table:** `event_submissions`

---

### `POST /api/internal/events/submissions`
**Purpose:** Approve a submission and create an event

**Request:**
```json
{
  "submissionId": "uuid",
  "eventData": {
    "name": "Sunset Cars & Coffee",
    "event_type_id": "uuid",
    "start_date": "2025-03-15",
    "city": "Austin",
    "state": "TX",
    "source_url": "https://...",
    "is_free": true,
    "featured": false
  },
  "carAffinities": [
    { "brand": "Porsche", "affinity_type": "welcome" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "event": {
    "id": "uuid",
    "slug": "sunset-cars-coffee-austin"
  }
}
```

**Tables:** `events`, `event_submissions`, `event_car_affinities`

---

### `POST /api/internal/events/submissions/[id]/reject`
**Purpose:** Reject a submission

**Request:**
```json
{
  "reason": "Duplicate event"
}
```

**Response:**
```json
{
  "success": true
}
```

**Table:** `event_submissions`

---

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

## Cron Routes (7 unique, 10 scheduled)

Triggered by Vercel cron jobs. Schedules defined in `vercel.json`.

| Route | Purpose | Schedule |
|-------|---------|----------|
| `/api/cron/schedule-ingestion` | Queue parts ingestion jobs | Weekly (Sun 2:00 AM UTC) |
| `/api/cron/process-scrape-jobs` | Process scrape queue | Every 15 min (`*/15 * * * *`) |
| `/api/cron/process-scrape-jobs` | Weekly batch processing | Weekly (Sun 3:00 AM UTC) |
| `/api/cron/refresh-recalls` | Refresh NHTSA recall data | Weekly (Sun 2:30 AM UTC) |
| `/api/cron/refresh-complaints` | Refresh NHTSA complaint data | Weekly (Sun 4:00 AM UTC) |
| `/api/cron/youtube-enrichment` | Process YouTube queue | Weekly (Mon 4:00 AM UTC) |
| `/api/cron/forum-scrape` | Forum scraping + insight extraction | Bi-weekly (Tue 5:00 AM UTC) |
| `/api/cron/forum-scrape` | Forum scraping + insight extraction | Bi-weekly (Fri 5:00 AM UTC) |
| `/api/cron/refresh-events` | Fetch events from external sources | Weekly (Mon 6:00 AM UTC) |

### `GET /api/cron/schedule-ingestion`
**Purpose:** Queue parts ingestion jobs from vendor APIs (MAPerformance Shopify, etc.)

**Auth:** Bearer token or `x-vercel-cron: true`

**Query Params:**
- `source` - Specific vendor to process (default: all configured)
- `limit` - Max products per vendor (default: 100)
- `dryRun` - If "true", don't create jobs

**Response:**
```json
{
  "success": true,
  "jobsCreated": 15,
  "sources": ["maperformance"],
  "timestamp": "2024-12-15T02:00:00.000Z"
}
```

**Flow:** Creates `scrape_jobs` entries → consumed by `process-scrape-jobs`

**Table:** `scrape_jobs`

---

### `GET /api/cron/process-scrape-jobs`
**Purpose:** Process queued scrape/enrichment jobs

**Auth:** Bearer token or `x-vercel-cron: true`

**Query Params:**
- `max` - Max jobs to process (default: 3 for 15-min, 10 for weekly)
- `delay` - Delay between jobs in ms (default: 15000 for 15-min, 5000 for weekly)
- `type` - Job type filter (parts, knowledge, enrichment)

**Response:**
```json
{
  "processed": 3,
  "succeeded": 3,
  "failed": 0,
  "remaining": 12,
  "jobs": [
    { "id": "uuid", "type": "parts", "status": "completed" }
  ],
  "durationMs": 45000
}
```

**Notes:**
- Runs every 15 min with `max=3` (incremental processing)
- Runs weekly Sun 3am with `max=10` (batch catch-up)
- Supports parts ingestion, knowledge base updates, car enrichment

**Tables:** `scrape_jobs`, `parts`, `part_fitments`, `part_pricing_snapshots`

---

### `GET /api/cron/youtube-enrichment`
**Purpose:** Discover new YouTube videos and process AI summaries

**Auth:** Bearer token or `x-vercel-cron: true`

**Query Params:**
- `channel` - Specific channel to process (default: all active)
- `limit` - Max videos to discover per channel (default: 10)
- `processLimit` - Max videos to AI-process (default: 5)
- `skipDiscovery` - If "true", only process existing queue

**Response:**
```json
{
  "discovery": {
    "channelsChecked": 12,
    "videosDiscovered": 8,
    "videosQueued": 5
  },
  "processing": {
    "videosProcessed": 5,
    "summariesGenerated": 5,
    "carLinksCreated": 7
  },
  "durationMs": 120000
}
```

**Flow:**
1. Checks trusted channels in `youtube_channels` for new uploads
2. Queues new videos in `youtube_ingestion_queue`
3. Processes queue: transcribes → AI summarizes → extracts pros/cons/quotes
4. Creates car links in `youtube_video_car_links`

**Tables:** `youtube_channels`, `youtube_ingestion_queue`, `youtube_videos`, `youtube_video_car_links`

---

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

### `GET /api/cron/refresh-complaints`
**Purpose:** Refresh NHTSA complaint data for all cars

**Auth:** Bearer token or `x-vercel-cron: true`

**Query Params:**
- `limitCars` - Max cars to process (default: all)
- `skipCars` - Skip first N cars
- `concurrency` - Parallel requests (default: 3)

**Response:**
```json
{
  "startedAt": "2024-12-14T04:00:00.000Z",
  "totalCars": 98,
  "processed": 98,
  "totalComplaints": 125,
  "durationMs": 30000
}
```

**Updates:** `car_safety_data.complaint_count`

---

### `GET /api/cron/refresh-events`
**Purpose:** Fetch events from external sources, deduplicate, geocode, and insert into database

**Auth:** Bearer token or `x-vercel-cron: true`

**Query Params:**
- `source` - Specific source name to run (default: all active)
- `limit` - Max events per source (default: 100)
- `dryRun` - If "true", don't write to DB
- `skipGeocode` - If "true", skip geocoding step

**Response:**
```json
{
  "success": true,
  "dryRun": false,
  "sourcesProcessed": 1,
  "eventsDiscovered": 45,
  "eventsCreated": 12,
  "eventsUpdated": 0,
  "eventsExpired": 3,
  "eventsDeduplicated": 30,
  "eventsGeocoded": 10,
  "errors": [],
  "sourceResults": [
    {
      "name": "MotorsportReg",
      "eventsDiscovered": 45,
      "eventsCreated": 12,
      "eventsDeduplicated": 30,
      "errors": []
    }
  ],
  "durationMs": 65000,
  "ranAt": "2024-12-16T06:00:00.000Z"
}
```

**Notes:**
- Fetches from configured sources in `event_sources` table
- Deduplicates by source_url and name+date+city similarity
- Geocodes events missing latitude/longitude
- Auto-approves events from trusted sources
- Marks past events as expired

**Tables:** `events`, `event_sources`, `event_types`

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

## Other Routes (4)

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

### `GET /api/health`
**Purpose:** Health check endpoint for monitoring

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-15T00:00:00.000Z"
}
```

---

### `GET /auth/callback`
**Purpose:** Supabase auth callback handler

---

## External API Dependencies

AutoRev routes integrate with external APIs for data enrichment. See [GOOGLE_CLOUD_APIS.md](GOOGLE_CLOUD_APIS.md) for complete documentation.

### Google Cloud APIs

| External API | Internal Routes Using It | Status |
|--------------|-------------------------|--------|
| YouTube Data API v3 | `/api/cron/youtube-enrichment` | ✅ Integrated |
| Places API | Future: track venue enrichment | 🔲 Enabled |
| Maps JavaScript API | Future: client-side maps | 🔲 Enabled |
| Geocoding API | Future: `/api/events` radius search | 🔲 Enabled |
| Custom Search API | Future: AL `search_forums` tool | 🔲 Enabled |
| Cloud Vision API | Future: `/api/vin/decode` image upload | 🔲 Enabled |
| Cloud Natural Language | Future: YouTube enrichment | 🔲 Enabled |
| Cloud Speech-to-Text | Future: transcript generation | 🔲 Enabled |
| Sheets API | Future: admin import/export | 🔲 Enabled |

### Government APIs

| External API | Internal Routes Using It |
|--------------|-------------------------|
| NHTSA Recalls API | `/api/cron/refresh-recalls`, `/api/cars/[slug]/safety` |
| NHTSA Ratings API | `/api/cars/[slug]/safety-ratings` |
| EPA Fuel Economy API | `/api/cars/[slug]/fuel-economy` |

### Third-Party Services

| Service | Internal Routes Using It |
|---------|-------------------------|
| Anthropic Claude | `/api/ai-mechanic` |
| OpenAI Embeddings | `/api/internal/knowledge/ingest` |

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


