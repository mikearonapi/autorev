# AutoRev API Reference

> Complete reference for all 160 API routes
>
> **Last Verified:** January 21, 2026 — Full audit and update

---

## Overview

| Category | Routes | Auth Required |
|----------|--------|---------------|
| Car Data | 22 | No |
| Parts | 4 | No |
| Events | 8 | Mixed |
| Users & Garage | 18 | Yes |
| AL (AI Assistant) | 10 | Yes |
| VIN | 3 | Mixed |
| Community | 10 | Mixed |
| Analytics | 9 | No |
| Payments (Stripe) | 4 | Yes |
| Webhooks | 4 | Varies |
| Admin Dashboard | 28 | Admin |
| Internal Tools | 18 | Admin |
| Cron Jobs | 19 | API Key |
| Other | 14 | Varies |
| **Total** | **160** | |

---

## Car Data Routes (22)

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
      "priceAvg": 95000
    }
  ],
  "count": 150,
  "source": "supabase"
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
    "ghg_score": 4,
    "is_electric": false,
    "is_hybrid": false,
    "ev_range": null,
    "source": "EPA",
    "fetched_at": "2024-12-15T00:00:00.000Z"
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
    "complaint_count": 15,
    "investigation_count": 0,
    "tsb_count": 3,
    "has_open_recalls": false,
    "has_open_investigations": false,
    "iihs_overall": "Good",
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
    "bat_median": 45500,
    "carscom_avg": 44000,
    "hagerty_concours": 65000,
    "hagerty_excellent": 52000,
    "hagerty_good": 45000,
    "hagerty_fair": 38000,
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

### `GET /api/cars/[slug]/issues`
**Purpose:** Get known issues for a specific car

**Response:**
```json
{
  "issues": [
    {
      "id": "uuid",
      "category": "Engine",
      "title": "IMS Bearing Failure",
      "description": "...",
      "severity": "major",
      "affected_years": [2000, 2001, 2002],
      "source_url": "https://..."
    }
  ]
}
```

**Table:** `car_issues`

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

---

### `GET /api/cars/[slug]/pricing`
**Purpose:** Fetch live market prices (enrichment)

---

### `GET /api/cars/[slug]/ai-context`
**Purpose:** Get comprehensive AI context for a car (used by AL)

**Response:**
```json
{
  "car": { ... },
  "tuningProfile": { ... },
  "issues": [...],
  "maintenanceSpecs": { ... },
  "dynoRuns": [...],
  "lapTimes": [...]
}
```

---

### `GET /api/cars/[slug]/factory-options`
**Purpose:** Get factory option packages and codes

---

### `GET /api/cars/[slug]/fitments`
**Purpose:** Get parts fitments for a car

---

### `GET|POST /api/cars/[slug]/manual-data`
**Purpose:** Get/add manually entered car data

**Auth:** POST requires Admin

---

### `GET /api/cars/expert-reviewed`
**Purpose:** List all cars with expert reviews

---

### `GET /api/cars/[slug]/recalls`
**Purpose:** Get recall campaigns for a car

**Query Params:**
- `limit` - Max recalls (default 50, max 200)
- `includeIncomplete` - Include incomplete records (default true)

**Table:** `car_recalls`

---

## Parts Routes (4)

### `GET /api/parts/search`
**Purpose:** Search parts catalog

**Query Params:**
- `q` - Search query
- `carSlug` - Filter by car fitment
- `carVariantKey` - Filter by specific car variant
- `category` - Part category
- `verified` - Filter to verified fitments only
- `limit` - Max results (default 12, max 30)

**Table:** `parts`, `part_fitments`, `part_pricing_snapshots`

---

### `GET /api/parts/popular`
**Purpose:** Get popular parts for a car

**Query Params:**
- `car_slug` - Car identifier
- `limit` - Max results (default 10)

---

### `POST /api/parts/relationships`
**Purpose:** Get part compatibility relationships

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
      "relation_type": "requires",
      "reason": "Intake requires tune for optimal performance",
      "part": { ... },
      "related_part": { ... }
    }
  ]
}
```

**Table:** `part_relationships`

---

### `GET /api/parts/turbos`
**Purpose:** Get turbo parts catalog

---

## Events Routes (8)

### `GET /api/events`
**Purpose:** List/search upcoming car events with filtering

**Query Params:**
- `query` - Text search for event name
- `location` - ZIP code or "City, State"
- `zip` - ZIP code for location filtering
- `lat`, `lng` - Direct coordinates (skips geocoding)
- `radius` - Radius in miles (default 50, max 500)
- `city`, `state`, `region` - Location filters
- `scope` - Event scope (local, regional, national)
- `type` - Event type slug
- `is_track_event` - Filter to track events only
- `is_free` - Filter to free events only
- `brand`, `car_slug` - Filter by car affinity
- `start_after`, `start_before` - Date filters
- `limit`, `offset` - Pagination
- `sort` - Sort order: "date", "featured", or "distance"
- `group_recurring` - Group recurring events

**Tables:** `events`, `event_types`, `event_car_affinities`

---

### `GET /api/events/[slug]`
**Purpose:** Get single event details by slug

---

### `GET /api/events/types`
**Purpose:** Get all event types for filtering

---

### `GET /api/events/featured`
**Purpose:** Get featured events

---

### `POST /api/events/submit`
**Purpose:** Submit an event for review

**Auth:** Required

**Table:** `event_submissions`

---

### `POST /api/events/[slug]/save`
**Purpose:** Save (bookmark) an event

**Auth:** Required

**Table:** `event_saves`

---

### `DELETE /api/events/[slug]/save`
**Purpose:** Unsave an event

**Auth:** Required

---

## Users & Garage Routes (18)

### `GET /api/users/[userId]/garage`
**Purpose:** Fetch user's vehicles

**Auth:** Required (must be own user ID)

**Response:**
```json
{
  "vehicles": [
    {
      "id": "uuid",
      "vin": "WP0AB29986S731234",
      "year": 2020,
      "make": "Porsche",
      "model": "718 Cayman",
      "trim": "GT4",
      "matchedCarSlug": "718-cayman-gt4",
      "nickname": "My GT4",
      "color": "Racing Yellow",
      "mileage": 15000,
      "isPrimary": true,
      "installedModifications": [...],
      "totalHpGain": 25,
      "enrichment": { ... }
    }
  ],
  "count": 2
}
```

**Table:** `user_vehicles`

---

### `GET|DELETE|PATCH /api/users/[userId]/vehicles/[vehicleId]`
**Purpose:** Get, delete, or update a specific vehicle

**Auth:** Required (must be own user ID)

---

### `GET|POST|PUT|DELETE /api/users/[userId]/vehicles/[vehicleId]/modifications`
**Purpose:** Manage vehicle modifications

**Auth:** Required

---

### `GET|POST|PUT|DELETE /api/users/[userId]/vehicles/[vehicleId]/custom-specs`
**Purpose:** Manage custom vehicle specifications

**Auth:** Required

---

### `PUT /api/users/[userId]/vehicles/reorder`
**Purpose:** Reorder vehicles in garage

**Auth:** Required

---

### `GET /api/users/[userId]/saved-events`
**Purpose:** Get user's saved events

**Auth:** Required (must be own user ID)

---

### `GET|POST|PATCH /api/users/[userId]/onboarding`
**Purpose:** Manage user onboarding state

**Auth:** Required

---

### `POST /api/users/[userId]/onboarding/dismiss`
**Purpose:** Dismiss onboarding overlay

**Auth:** Required

---

### `GET|POST|DELETE /api/users/[userId]/track-times`
**Purpose:** Manage user's track times

**Auth:** Required

---

### `POST /api/users/[userId]/track-times/analyze`
**Purpose:** AI analysis of track times

**Auth:** Required

---

### `GET|PUT /api/users/[userId]/car-images`
**Purpose:** Manage user's car images

**Auth:** Required

---

### `POST /api/users/[userId]/clear-data`
**Purpose:** Clear user data (GDPR compliance)

**Auth:** Required

---

### `DELETE /api/users/[userId]/account`
**Purpose:** Delete user account

**Auth:** Required

---

### `GET|POST /api/garage/enrich`
**Purpose:** Enrich garage vehicle with external data

---

## AL (AI Assistant) Routes (10)

### `POST /api/ai-mechanic`
**Purpose:** Send message to AL assistant (streaming supported)

**Auth:** Required

**Request:**
```json
{
  "message": "What's wrong with the E46 M3?",
  "conversationId": "optional-uuid",
  "carSlug": "bmw-m3-e46",
  "stream": true,
  "attachments": [
    { "public_url": "...", "file_type": "image/jpeg" }
  ]
}
```

**Response (non-streaming):**
```json
{
  "response": "The E46 M3 is known for...",
  "conversationId": "uuid",
  "usage": {
    "costCents": 1.5,
    "inputTokens": 1500,
    "outputTokens": 400
  }
}
```

**Streaming:** Returns SSE stream with events: `connected`, `text`, `tool_start`, `tool_result`, `done`, `error`

---

### `GET /api/ai-mechanic`
**Purpose:** Get contextual suggestions for AL

---

### `GET|POST /api/ai-mechanic/feedback`
**Purpose:** Get/submit AL conversation feedback

---

### `GET /api/users/[userId]/al-conversations`
**Purpose:** List user's AL conversations

**Auth:** Required

---

### `GET|DELETE|PATCH /api/users/[userId]/al-conversations/[conversationId]`
**Purpose:** Get, delete, or rename a conversation

**Auth:** Required

---

### `GET /api/users/[userId]/al-credits`
**Purpose:** Get user's AL credit balance

**Response:**
```json
{
  "balanceCents": 75,
  "balanceFormatted": "$0.75",
  "plan": "collector",
  "monthlyAllocationCents": 200,
  "spentThisMonthCents": 125,
  "tank": {
    "level": "medium",
    "percentage": 37.5
  }
}
```

---

### `GET|PUT /api/al/preferences`
**Purpose:** Get/update AL preferences (tool toggles)

**Auth:** Required

---

### `GET /api/al/stats`
**Purpose:** Get AL usage statistics

---

### `GET|POST /api/al/upload`
**Purpose:** Upload images for AL analysis

**Auth:** Required

---

## VIN Routes (3)

### `GET|POST /api/vin/decode`
**Purpose:** Decode VIN to car variant using NHTSA API

**Auth:** No (public endpoint)

---

### `POST /api/vin/resolve`
**Purpose:** Match VIN to existing car variant

---

### `POST /api/vin/safety`
**Purpose:** Fetch VIN safety data from NHTSA

---

## Community Routes (10)

### `GET /api/community/posts`
**Purpose:** List community posts

**Query Params:**
- `type` - Post type filter (garage, build, vehicle)
- `car` - Filter by car slug
- `buildId` - Get linked post for build
- `limit`, `offset` - Pagination
- `featured` - Filter to featured posts

---

### `POST /api/community/posts`
**Purpose:** Create a new community post

**Auth:** Required

**Request:**
```json
{
  "postType": "build",
  "title": "My GT4 Track Build",
  "description": "...",
  "vehicleId": "uuid",
  "buildId": "uuid",
  "carSlug": "718-cayman-gt4",
  "imageIds": ["uuid-1", "uuid-2"]
}
```

---

### `PATCH /api/community/posts`
**Purpose:** Update a community post

**Auth:** Required (must own post)

---

### `GET /api/community/builds`
**Purpose:** List community builds

---

### `GET /api/community/builds/[slug]`
**Purpose:** Get specific build details

---

### `GET|POST|DELETE|PATCH /api/community/posts/[postId]/comments`
**Purpose:** Manage post comments

**Auth:** Required for POST/DELETE/PATCH

---

### `GET|POST /api/community/posts/[postId]/like`
**Purpose:** Get/toggle like status on a post

**Auth:** Required for POST

---

### `POST /api/community/feed/recalculate`
**Purpose:** Recalculate community feed rankings

**Auth:** Admin

---

### `POST /api/community/feed/track`
**Purpose:** Track feed engagement

---

## Analytics Routes (9)

### `GET|POST /api/analytics/track`
**Purpose:** Track page views

**Request:**
```json
{
  "path": "/browse-cars/718-cayman-gt4",
  "route": "/browse-cars/[slug]",
  "sessionId": "uuid",
  "visitorId": "uuid",
  "referrer": "https://google.com",
  "pageLoadTime": 1250
}
```

**Note:** Bot traffic is automatically filtered

---

### `POST /api/analytics/event`
**Purpose:** Track custom events

---

### `POST /api/analytics/click`
**Purpose:** Track click events

---

### `POST /api/analytics/search`
**Purpose:** Track search queries

---

### `POST /api/analytics/feature`
**Purpose:** Track feature usage

---

### `POST /api/analytics/engagement`
**Purpose:** Track engagement metrics

---

### `POST /api/analytics/attribution`
**Purpose:** Track marketing attribution

---

### `POST /api/analytics/goal`
**Purpose:** Track goal completions

---

### `POST /api/activity`
**Purpose:** Track user activity

---

## Payments (Stripe) Routes (4)

### `POST /api/checkout`
**Purpose:** Create Stripe checkout session

**Auth:** Required

**Request:**
```json
{
  "type": "subscription",
  "tier": "collector"
}
```

---

### `POST /api/billing/portal`
**Purpose:** Create Stripe Customer Portal session

**Auth:** Required

---

### `POST /api/webhooks/stripe`
**Purpose:** Process Stripe webhook events

**Auth:** Verified via `STRIPE_WEBHOOK_SECRET`

**Events Handled:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

---

### `GET /api/admin/stripe`
**Purpose:** Get Stripe metrics for admin dashboard

**Auth:** Admin

---

## Webhooks (4)

### `POST /api/webhooks/stripe`
See Payments section above.

---

### `GET|POST /api/webhooks/resend`
**Purpose:** Handle Resend email webhooks

---

### `GET|POST /api/webhooks/vercel`
**Purpose:** Handle Vercel deployment webhooks

---

### `GET|POST /api/webhooks/speed-insights`
**Purpose:** Handle Vercel Speed Insights webhooks

---

## Admin Dashboard Routes (28)

All admin routes require admin authentication.

### `GET /api/admin/dashboard`
**Purpose:** Get comprehensive admin dashboard stats

**Query Params:**
- `range` - Time range: "day", "week", "month", "all"

**Response:**
```json
{
  "timeRange": "week",
  "users": {
    "total": 1500,
    "newThisPeriod": 45,
    "growthPercent": 12,
    "byTier": { "free": 1200, "collector": 250, "tuner": 50 }
  },
  "engagement": {
    "weeklyActiveUsers": 350,
    "wauPercent": 23,
    "alConversations": 890
  },
  "costs": { ... },
  "system": {
    "database": "healthy",
    "api": "healthy",
    "cron": "healthy"
  },
  "alerts": [...]
}
```

---

### `GET /api/admin/users`
**Purpose:** List users with admin filters

---

### `GET /api/admin/site-analytics`
**Purpose:** Get site analytics data

---

### `GET /api/admin/marketing-analytics`
**Purpose:** Get marketing analytics

---

### `GET /api/admin/advanced-analytics`
**Purpose:** Get advanced analytics data

---

### `GET /api/admin/beta-dashboard`
**Purpose:** Get beta program dashboard

---

### `GET /api/admin/retention`
**Purpose:** Get user retention metrics

---

### `GET /api/admin/content-growth`
**Purpose:** Get content growth metrics

---

### `GET /api/admin/al-usage`
**Purpose:** Get AL usage metrics

---

### `GET /api/admin/al-trends`
**Purpose:** Get AL usage trends

---

### `GET|POST /api/admin/al-evaluations`
**Purpose:** Manage AL evaluation runs

---

### `GET /api/admin/ai-cost-summary`
**Purpose:** Get AI cost summary

---

### `GET /api/admin/external-costs`
**Purpose:** Get external service costs

---

### `GET|POST|DELETE|PATCH /api/admin/financials`
**Purpose:** Manage financial records

---

### `GET|POST /api/admin/insights`
**Purpose:** Manage community insights

---

### `GET|POST /api/admin/emails`
**Purpose:** Manage email campaigns

---

### `GET /api/admin/emails/preview`
**Purpose:** Preview email template

---

### `GET|POST /api/admin/feedback/resolve`
**Purpose:** Resolve feedback items

---

### `GET|POST /api/admin/feedback/resolve-batch`
**Purpose:** Batch resolve feedback items

---

### `GET /api/admin/usage`
**Purpose:** Get usage metrics

---

### `GET /api/admin/alerts`
**Purpose:** Get system alerts

---

### `GET /api/admin/system-health`
**Purpose:** Get system health status

---

### `GET /api/admin/vercel-status`
**Purpose:** Get Vercel deployment status

---

### `GET /api/admin/web-vitals`
**Purpose:** Get web vitals metrics

---

### `GET /api/admin/export`
**Purpose:** Export data

---

### `GET|POST /api/admin/auth-cleanup`
**Purpose:** Clean up orphaned auth records

---

### `POST /api/admin/run-action`
**Purpose:** Run admin actions

---

## Internal Routes (18)

All internal routes require admin authentication.

### Event Moderation

### `GET|POST /api/internal/events/submissions`
**Purpose:** List/approve event submissions

---

### `POST /api/internal/events/submissions/[id]/reject`
**Purpose:** Reject an event submission

---

### Car Pipeline

### `GET|POST /api/internal/car-pipeline`
**Purpose:** Manage car ingestion pipeline

---

### `GET|DELETE|PATCH /api/internal/car-pipeline/[slug]`
**Purpose:** Manage specific car in pipeline

---

### `GET|POST /api/internal/add-car-ai`
**Purpose:** AI-assisted car data generation

---

### `GET /api/internal/car-variants`
**Purpose:** List car variants

---

### Data Management

### `GET|POST /api/internal/dyno/runs`
**Purpose:** Manage dyno data

---

### `GET|POST /api/internal/track/lap-times`
**Purpose:** Manage lap time data

---

### `GET|PATCH /api/internal/parts/fitments`
**Purpose:** Manage part fitments

---

### `POST /api/internal/knowledge/ingest`
**Purpose:** Ingest documents into knowledge base

---

### `GET|POST /api/internal/maintenance/variant-overrides`
**Purpose:** Manage variant-specific maintenance data

---

### Monitoring

### `GET|POST /api/internal/errors`
**Purpose:** View/log errors

---

### `GET /api/internal/errors/stats`
**Purpose:** Get error statistics

---

### `GET|POST /api/internal/forum-insights`
**Purpose:** Manage forum intelligence

---

### `GET /api/internal/qa-report`
**Purpose:** Generate QA report

---

### `GET /api/internal/test-discord`
**Purpose:** Test Discord webhook

---

## Cron Routes (19)

All cron routes are triggered by Vercel cron jobs. Schedules defined in `vercel.json`.

### Content Pipeline

### `GET /api/cron/youtube-enrichment`
**Purpose:** Discover new YouTube videos and process AI summaries

---

### `GET /api/cron/forum-scrape`
**Purpose:** Forum Intelligence Pipeline

---

### `GET /api/cron/schedule-ingestion`
**Purpose:** Queue parts ingestion jobs

---

### `GET|POST /api/cron/process-scrape-jobs`
**Purpose:** Process queued scrape jobs

---

### Article Generation

### `GET /api/cron/article-research`
**Purpose:** Research topics for articles

---

### `GET /api/cron/article-write`
**Purpose:** Write article drafts

---

### `GET|POST /api/cron/article-qa`
**Purpose:** QA article content

---

### `GET /api/cron/article-images`
**Purpose:** Generate article images

---

### `GET /api/cron/article-publish`
**Purpose:** Publish approved articles

---

### Data Refresh

### `GET /api/cron/refresh-recalls`
**Purpose:** Refresh NHTSA recall data

---

### `GET /api/cron/refresh-complaints`
**Purpose:** Refresh NHTSA complaint data

---

### `GET /api/cron/refresh-events`
**Purpose:** Fetch events from external sources

---

### `GET /api/cron/weekly-car-expansion`
**Purpose:** Expand car database

---

### Analytics & Engagement

### `GET /api/cron/daily-metrics`
**Purpose:** Calculate daily metrics

---

### `GET /api/cron/calculate-engagement`
**Purpose:** Calculate engagement scores

---

### `GET /api/cron/daily-digest`
**Purpose:** Generate daily digest

---

### User Engagement

### `GET /api/cron/retention-alerts`
**Purpose:** Send retention alerts

---

### `GET /api/cron/schedule-inactivity-emails`
**Purpose:** Schedule inactivity emails

---

### `GET /api/cron/process-email-queue`
**Purpose:** Process email queue

---

### System Maintenance

### `GET /api/cron/al-evaluation`
**Purpose:** Run AL evaluation suite

---

### `GET /api/cron/al-optimization`
**Purpose:** Optimize AL performance

---

### `GET|POST /api/cron/flush-error-aggregates`
**Purpose:** Flush error aggregates

---

## Other Routes (14)

### `POST /api/contact`
**Purpose:** Submit contact form

**Table:** `leads`

---

### `GET|POST /api/feedback`
**Purpose:** Submit/get user feedback

**Table:** `user_feedback`

---

### `GET|POST /api/feedback/screenshot`
**Purpose:** Upload feedback screenshots

---

### `GET /api/health`
**Purpose:** Health check endpoint

**Query Params:**
- `deep` - Include database connectivity check

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-18T00:00:00.000Z",
  "database": "connected",
  "version": "1.0.0"
}
```

---

### `GET /api/stats`
**Purpose:** Get platform statistics

---

### `GET /api/tracks`
**Purpose:** List race tracks

---

### `GET|POST /api/dyno-results`
**Purpose:** Manage dyno results

---

### `PUT|DELETE /api/dyno-results`
**Purpose:** Update/delete dyno results

---

### `GET|POST|DELETE /api/user/location`
**Purpose:** Manage user location preferences

---

### `GET /api/locations/search`
**Purpose:** Search locations (Google Places proxy)

---

### `POST|DELETE|PATCH /api/uploads`
**Purpose:** Manage file uploads

---

### `POST /api/uploads/client-token`
**Purpose:** Get client upload token

---

### `POST /api/uploads/save-metadata`
**Purpose:** Save upload metadata

---

### `GET /api/builds/[buildId]/images`
**Purpose:** Get build images

---

### `GET|POST|PUT /api/vehicles/[vehicleId]/build`
**Purpose:** Manage vehicle builds

---

### `GET|POST /api/v2/performance`
**Purpose:** Performance calculator v2

---

### `GET|POST|PATCH /api/referrals`
**Purpose:** Manage referral program

---

### `GET|POST /api/email/unsubscribe`
**Purpose:** Email unsubscribe handling

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
- `503` - Service unavailable

---

## External API Dependencies

### Google Cloud APIs

| External API | Internal Routes Using It |
|--------------|-------------------------|
| YouTube Data API v3 | `/api/cron/youtube-enrichment` |
| Places API | `/api/locations/search` |
| Geocoding API | `/api/events` radius search |

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
| Stripe | `/api/checkout`, `/api/billing/portal`, `/api/webhooks/stripe` |
| Resend | `/api/cron/process-email-queue` |

---

*See [DATABASE.md](DATABASE.md) for table schemas.*
