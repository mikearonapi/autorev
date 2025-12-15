# AutoRev Architecture

> How the system works

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                           USERS                                  │
│         Anonymous → Free → Collector → Tuner → Admin            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS FRONTEND                             │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Browse   │ │ Car      │ │ My       │ │ Tuning   │           │
│  │ Cars     │ │ Selector │ │ Garage   │ │ Shop     │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │            COMPONENTS (46 files)                         │    │
│  │  • Providers (Auth, Favorites, Compare, etc.)           │    │
│  │  • UI Components (Header, Footer, CarImage, etc.)       │    │
│  │  • Feature Components (PerformanceHub, ExpertReviews)   │    │
│  │  • Gates (PremiumGate, TeaserPrompt)                    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API LAYER (41 routes)                        │
│                                                                  │
│  /api/cars/*          Car data (specs, safety, pricing)         │
│  /api/parts/*         Parts catalog and search                  │
│  /api/ai-mechanic     AL assistant                              │
│  /api/users/*         User data and AL credits                  │
│  /api/vin/*           VIN decode                                │
│  /api/internal/*      Admin operations                          │
│  /api/cron/*          Scheduled jobs                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER (69 files)                       │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ tierAccess  │  │ carsClient  │  │ alTools     │             │
│  │ (gating)    │  │ (car data)  │  │ (AI tools)  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ scoring     │  │ maintenance │  │ youtube     │             │
│  │ (algorithm) │  │ Service     │  │ Client      │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   SUPABASE      │  │   CLAUDE AI     │  │  EXTERNAL APIs  │ │
│  │   (PostgreSQL)  │  │   (Anthropic)   │  │                 │ │
│  │                 │  │                 │  │  • YouTube API  │ │
│  │   52 tables     │  │   AL Assistant  │  │  • NHTSA        │ │
│  │   pgvector      │  │   15 tools      │  │  • EPA          │ │
│  │   RLS enabled   │  │   token billing │  │  • BaT scraping │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Next.js 14 (App Router) | React SSR/SSG |
| **Database** | Supabase (PostgreSQL) | Primary data store |
| **Vector Search** | pgvector | Knowledge base embeddings |
| **AI** | Anthropic Claude | AL assistant |
| **Embeddings** | OpenAI text-embedding-3-small | Document embeddings |
| **Auth** | Supabase Auth | Authentication |
| **Images** | Vercel Blob | Car images |
| **Hosting** | Vercel | Deployment |
| **Styling** | CSS Modules | Component styles |

---

## Tier System

### Hierarchy

```
free → collector → tuner → admin
```

### Implementation

**Config:** `lib/tierAccess.js`

```javascript
export const IS_BETA = true; // Bypasses all tier checks when true

export const FEATURES = {
  // Free tier
  carSelector: { tier: 'free' },
  fuelEconomy: { tier: 'free' },
  safetyRatings: { tier: 'free' },
  
  // Collector tier
  vinDecode: { tier: 'collector' },
  marketValue: { tier: 'collector' },
  priceHistory: { tier: 'collector' },
  
  // Tuner tier
  dynoDatabase: { tier: 'tuner' },
  fullLapTimes: { tier: 'tuner' },
  buildProjects: { tier: 'tuner' },
};
```

**Usage in Components:**

```jsx
import { PremiumGate } from '@/components/PremiumGate';

<PremiumGate feature="marketValue">
  <MarketValueSection car={car} />
</PremiumGate>
```

**Beta Mode:**

When `IS_BETA = true`:
- All authenticated users get full access
- No tier restrictions enforced
- Credit/usage still tracked

---

## Data Flow Patterns

### Pattern 1: Static Car Data

```
User visits /browse-cars/[slug]
    ↓
Page component calls carsClient.getCarBySlug()
    ↓
carsClient checks Supabase first
    ↓
Falls back to data/cars.js if DB unavailable
    ↓
Returns car object to page
```

### Pattern 2: Enriched Data

```
User visits car detail page
    ↓
Page renders with static data immediately
    ↓
useEffect fetches enriched data from API routes:
  - /api/cars/[slug]/efficiency
  - /api/cars/[slug]/safety-ratings
  - /api/cars/[slug]/expert-reviews
    ↓
Each route queries Supabase tables
    ↓
Components update with enriched data
```

### Pattern 3: AL Assistant

```
User sends message to AL
    ↓
POST /api/ai-mechanic
    ↓
Build system prompt with user context
    ↓
Send to Claude with tool definitions
    ↓
Claude decides which tools to call
    ↓
Execute tools (search_cars, get_known_issues, etc.)
    ↓
Return tool results to Claude
    ↓
Claude generates final response
    ↓
Log usage, deduct credits
    ↓
Return response to user
```

### Pattern 4: Tier-Gated Content

```
Component renders PremiumGate
    ↓
PremiumGate checks IS_BETA flag
    ↓
If IS_BETA && authenticated: render children
    ↓
Else: check user tier via hasAccess()
    ↓
If hasAccess: render children
    ↓
Else: render upgrade prompt
```

---

## Authentication Flow

```
User clicks "Sign In"
    ↓
AuthModal opens (Google or Magic Link)
    ↓
Supabase Auth handles authentication
    ↓
Redirect to /auth/callback
    ↓
Callback exchanges code for session
    ↓
Session stored in cookies
    ↓
AuthProvider provides user context
    ↓
user_profiles row created if new user
    ↓
Tier defaults to 'free'
```

---

## State Management

| Type | Solution | Location |
|------|----------|----------|
| **Auth State** | React Context | `AuthProvider` |
| **Favorites** | React Context + Supabase | `FavoritesProvider` |
| **Compare** | React Context + Zustand | `CompareProvider` |
| **Car Selection** | Zustand | `carSelectionStore` |
| **User Preferences** | Zustand + localStorage | `userPreferencesStore` |
| **Server State** | API routes | Supabase |

---

## External Integrations

AutoRev integrates with multiple external APIs for data enrichment. See [GOOGLE_CLOUD_APIS.md](GOOGLE_CLOUD_APIS.md) for complete Google API documentation.

### Google Cloud APIs (9 Enabled)

| API | Status | Primary Use |
|-----|--------|-------------|
| YouTube Data API v3 | ✅ Integrated | Expert Reviews enrichment |
| Places API | 🔲 Enabled | Track venue enrichment |
| Maps JavaScript API | 🔲 Enabled | Interactive maps |
| Geocoding API | 🔲 Enabled | Address → coordinates |
| Custom Search API | 🔲 Enabled | AL forum search |
| Cloud Vision API | 🔲 Enabled | VIN-from-photo OCR |
| Cloud Natural Language | 🔲 Enabled | Content analysis |
| Cloud Speech-to-Text | 🔲 Enabled | Transcript generation |
| Sheets API | 🔲 Enabled | Bulk data import/export |

**Environment Variables:**
- `GOOGLE_API_KEY` — Server-side key (YouTube, Places, Vision, etc.)
- `NEXT_PUBLIC_GOOGLE_MAPS_KEY` — Client-side key (Maps JavaScript)
- `GOOGLE_CUSTOM_SEARCH_ENGINE_ID` — Search engine ID

### Government APIs

| API | Purpose | Rate Limits |
|-----|---------|-------------|
| **NHTSA** | Safety ratings, recalls | None (government) |
| **EPA** | Fuel economy data | None |

### Scraped Sources

| Source | Data Type |
|--------|-----------|
| Bring a Trailer | Auction results |
| Cars.com | Listing prices |
| Hagerty | Insurance values |

### AI Services

| Service | Purpose | Model |
|---------|---------|-------|
| **Anthropic Claude** | AL assistant | Claude Sonnet 4 |
| **OpenAI** | Embeddings | text-embedding-3-small |

---

## Database Design

### Row Level Security (RLS)

| Table | Policy |
|-------|--------|
| `cars`, `parts` | Public read |
| `user_*` | User owns row |
| `al_*` | User owns row |
| Internal tables | Admin only |

### Foreign Keys

```
cars.id ← car_variants.car_id
cars.slug ← car_fuel_economy.car_slug
cars.slug ← car_safety_data.car_slug
cars.id ← youtube_video_car_links.car_id
cars.id ← part_fitments.car_id
parts.id ← part_fitments.part_id
user_profiles.id ← user_favorites.user_id
```

### Indexes

Critical indexes for performance:
- `cars(slug)` - Unique, primary lookup
- `car_fuel_economy(car_slug)` - FK lookup
- `part_fitments(car_id, part_id)` - Join queries
- `document_chunks(embedding)` - Vector similarity

---

## Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `schedule-ingestion` | Daily | Queue cars for enrichment |
| `process-scrape-jobs` | Hourly | Process scrape queue |
| `youtube-enrichment` | Every 6h | Process YouTube queue |

---

## Error Handling

### API Routes
```javascript
try {
  // Operation
} catch (err) {
  console.error('[API/route-name] Error:', err);
  return NextResponse.json({ error: 'Message' }, { status: 500 });
}
```

### Components
- Graceful fallbacks for missing data
- Loading states
- Error boundaries (where needed)

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role (server) |
| `ANTHROPIC_API_KEY` | Yes | Claude AI |
| `OPENAI_API_KEY` | Recommended | Embeddings |
| `YOUTUBE_API_KEY` | Optional | YouTube API |
| `BLOB_READ_WRITE_TOKEN` | Optional | Vercel Blob |

---

## Deployment

### Vercel Setup
1. Connect GitHub repo
2. Add Supabase integration (auto-configures DB vars)
3. Add remaining env vars
4. Deploy

### Supabase Setup
1. Run migrations in order
2. Enable RLS on all tables
3. Create service role for server
4. Set up cron functions (if using Supabase cron)

---

*See [DATABASE.md](DATABASE.md) for complete schema and [API.md](API.md) for route documentation.*


