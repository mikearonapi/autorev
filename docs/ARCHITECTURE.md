# AutoRev Architecture

> How the system works
>
> **Last Verified:** January 8, 2026 — Updated with route groups architecture + performance optimizations

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
│  │            COMPONENTS (70+ files)                        │    │
│  │  • Providers (Auth, Favorites, Compare, etc.)           │    │
│  │  • UI Components (Header, Footer, CarImage, etc.)       │    │
│  │  • Feature Components (PerformanceHub, ExpertReviews)   │    │
│  │  • Gates (PremiumGate, TeaserPrompt)                    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API LAYER (99 routes)                        │
│                                                                  │
│  /api/cars/*          Car data (specs, safety, pricing)         │
│  /api/parts/*         Parts catalog and search                  │
│  /api/ai-mechanic     AL assistant                              │
│  /api/users/*         User data and AL credits                  │
│  /api/vin/*           VIN decode                                │
│  /api/checkout        Stripe checkout sessions                  │
│  /api/billing/*       Stripe customer portal                    │
│  /api/webhooks/*      Stripe & other webhooks                   │
│  /api/admin/*         Admin operations & dashboards             │
│  /api/internal/*      Internal tools                            │
│  /api/cron/*          Scheduled jobs (12 jobs)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER (114 files)                      │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ tierAccess  │  │ carsClient  │  │ alTools     │             │
│  │ (gating)    │  │ (car data)  │  │ (AI tools)  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ scoring     │  │ maintenance │  │ youtube     │             │
│  │ (algorithm) │  │ Service     │  │ Client      │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │ stripe      │  │ discord     │                               │
│  │ (payments)  │  │ (notify)    │                               │
│  └─────────────┘  └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   SUPABASE      │  │   CLAUDE AI     │  │  EXTERNAL APIs  │ │
│  │   (PostgreSQL)  │  │   (Anthropic)   │  │                 │ │
│  │                 │  │                 │  │  • Stripe       │ │
│  │   75 tables     │  │   AL Assistant  │  │  • YouTube API  │ │
│  │   pgvector      │  │   17 tools      │  │  • NHTSA        │ │
│  │   RLS enabled   │  │   token billing │  │  • EPA          │ │
│  │                 │  │                 │  │  • Resend       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Route Group Architecture

AutoRev uses Next.js route groups to split the application into two distinct layout contexts:

```
app/
├── (marketing)/          # Public-facing, lightweight layout
│   ├── layout.jsx        # Minimal providers
│   ├── page.jsx          # Home page
│   ├── landing/          # Landing pages
│   ├── join/             # Sign up page
│   ├── features/         # Feature pages
│   ├── articles/         # Blog/articles
│   ├── car-selector/     # Car selector tool
│   ├── community/        # Community pages
│   ├── al/               # AL landing
│   ├── compare/          # Comparison pages
│   ├── contact/          # Contact form
│   ├── encyclopedia/     # Encyclopedia
│   ├── events/           # Events listing
│   ├── privacy/          # Privacy policy
│   ├── terms/            # Terms of service
│   └── unsubscribe/      # Email unsubscribe
│
├── (app)/                # Authenticated app, full providers
│   ├── layout.jsx        # Full provider stack
│   ├── browse-cars/      # Car browsing (needs Favorites, Compare)
│   ├── garage/           # User's garage (needs OwnedVehicles)
│   ├── tuning-shop/      # Tuning shop (needs SavedBuilds)
│   ├── profile/          # User profile
│   └── mod-planner/      # Mod planning tool
│
├── admin/                # Admin routes (root layout)
├── internal/             # Internal tools (root layout)
├── auth/                 # Auth callbacks (root layout)
├── api/                  # API routes (root layout)
└── layout.jsx            # Root layout (global providers)
```

### Provider Dependencies

| Route Group | Providers Needed |
|-------------|------------------|
| `(marketing)` | Auth, QueryProvider (minimal) |
| `(app)` | Auth, Favorites, Compare, SavedBuilds, OwnedVehicles, AIMechanic |

### Why Route Groups?

1. **Performance**: Marketing pages don't load app-specific providers
2. **Bundle Size**: Smaller JS bundles for landing pages
3. **LCP Improvement**: Faster initial paint without provider initialization
4. **Maintainability**: Clear separation of public vs authenticated features

---

## Performance Optimizations

### Image Loading Strategy

| Context | Strategy | Implementation |
|---------|----------|----------------|
| **Hero images** | `priority={true}` | Single above-fold image |
| **Carousels** | Current + next only | Render 2 images, preload next |
| **Decorative backgrounds** | `loading="lazy"` | Lower quality, deferred |
| **Below-fold content** | `loading="lazy"` | Default browser behavior |

### Carousel Optimization Pattern

```jsx
// Only render current and next image
const nextIndex = (currentIndex + 1) % images.length;
const indicesToRender = [currentIndex, nextIndex];

// Preload upcoming image
useEffect(() => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = images[(currentIndex + 1) % images.length].src;
  document.head.appendChild(link);
  return () => link.parentNode?.removeChild(link);
}, [currentIndex]);

// Only start animation when visible
useEffect(() => {
  const observer = new IntersectionObserver(([entry]) => {
    setIsVisible(entry.isIntersecting);
  }, { threshold: 0.1 });
  observer.observe(containerRef.current);
  return () => observer.disconnect();
}, []);
```

### Video Preload Settings

| Video Type | Preload | Rationale |
|------------|---------|-----------|
| Hero video | `metadata` | Load poster, defer full video |
| Below-fold | `none` | Only load when user scrolls |

### Analytics Script Loading

| Script | Strategy | Load Timing |
|--------|----------|-------------|
| Google Analytics | `afterInteractive` | After hydration |
| Meta Pixel | `lazyOnload` | After page idle |

### Performance Regression Tests

Location: `tests/e2e/performance-regression.spec.js`

Tests ensure:
- Priority image count ≤ limit per page
- Video preload attributes correct
- Carousel renders only 2 images
- Decorative backgrounds lazy-loaded
- No console warnings about priority images
- Analytics scripts use correct strategy

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Next.js 14 (App Router) | React SSR/SSG |
| **Database** | Supabase (PostgreSQL) | Primary data store |
| **Vector Search** | pgvector | Knowledge base embeddings |
| **AI** | Anthropic Claude Sonnet 4 | AL assistant |
| **Embeddings** | OpenAI text-embedding-3-small | Document embeddings |
| **Auth** | Supabase Auth | Authentication |
| **Payments** | Stripe | Subscription billing & one-time purchases |
| **Email** | Resend | Transactional email delivery |
| **Images** | Vercel Blob | Car images & assets |
| **Hosting** | Vercel | Deployment & edge functions |
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
  
  // Enthusiast tier
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

### Payment Processing

| Service | Purpose | Status |
|---------|---------|--------|
| **Stripe** | Subscription billing, AL credit packs, donations | ✅ Integrated |

**Features:**
- Subscription management (Collector $4.99/mo, Tuner $9.99/mo)
- One-time AL credit purchases
- Customer portal for billing management
- Webhook integration for real-time updates

**See:** [STRIPE_INTEGRATION.md](STRIPE_INTEGRATION.md) for complete reference

### Communication Services

| Service | Purpose | Status |
|---------|---------|--------|
| **Resend** | Transactional email | ✅ Integrated |
| **Discord Webhooks** | Operations notifications | ✅ Integrated |

**See:** [DISCORD_CHANNEL_REFERENCE.md](DISCORD_CHANNEL_REFERENCE.md) for Discord setup

### YouTube Enhancement

| Service | Purpose | Status |
|---------|---------|--------|
| **YouTube Data API v3** | Video metadata | ✅ Integrated |
| **Exa API** | YouTube video discovery | ✅ Integrated |
| **Supadata API** | Transcript fallback | 🔲 Optional |

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

All scheduled via `vercel.json`. Auth requires `CRON_SECRET` Bearer token or `x-vercel-cron: true` header.

| Job | Schedule | Cron Expression | Purpose |
|-----|----------|-----------------|---------|
| `schedule-ingestion` | Sun 2:00 AM UTC | `0 2 * * 0` | Queue parts ingestion from vendor APIs |
| `process-scrape-jobs` | Every 15 min | `*/15 * * * *` | Process scrape queue (incremental) |
| `process-scrape-jobs` | Sun 3:00 AM UTC | `0 3 * * 0` | Process scrape queue (weekly batch) |
| `refresh-recalls` | Sun 2:30 AM UTC | `30 2 * * 0` | Fetch NHTSA recall data for all cars |
| `refresh-complaints` | Sun 4:00 AM UTC | `0 4 * * 0` | Fetch NHTSA complaint data for all cars |
| `youtube-enrichment` | Mon 4:00 AM UTC | `0 4 * * 1` | Discover videos, process AI summaries |
| `forum-scrape` | Tue, Fri 5:00 AM UTC | `0 5 * * 2,5` | Scrape forums + extract community insights |
| `refresh-events` | Daily 6:00 AM UTC | `0 6 * * *` | Fetch events from external sources |

**Data Flow:**
```
schedule-ingestion → creates scrape_jobs → process-scrape-jobs consumes
youtube-enrichment → youtube_ingestion_queue → AI processing
forum-scrape → forum_scraped_threads → community_insights
refresh-events → events table (auto-approve, geocode, dedupe)
```

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

### Required

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server-side) |
| `ANTHROPIC_API_KEY` | Claude AI for AL assistant |

### Payments (Required for Production)

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Stripe API secret key (server-side) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (client-side) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification |

See [STRIPE_INTEGRATION.md](STRIPE_INTEGRATION.md) for complete Stripe setup.

### Communication

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Transactional email delivery |
| `DISCORD_WEBHOOK_DEPLOYMENTS` | Deployment notifications |
| `DISCORD_WEBHOOK_ERRORS` | Error notifications |
| `DISCORD_WEBHOOK_CRON` | Cron job summaries |
| `DISCORD_WEBHOOK_FEEDBACK` | User feedback |
| `DISCORD_WEBHOOK_SIGNUPS` | New user signups |
| `DISCORD_WEBHOOK_CONTACTS` | Contact form submissions |
| `DISCORD_WEBHOOK_EVENTS` | Event submissions |
| `DISCORD_WEBHOOK_AL` | AL conversation notifications |
| `DISCORD_WEBHOOK_DIGEST` | Daily digest |
| `DISCORD_WEBHOOK_FINANCIALS` | Payment notifications (Stripe) |

See [DISCORD_CHANNEL_REFERENCE.md](DISCORD_CHANNEL_REFERENCE.md) for Discord setup.

### Data Enrichment

| Variable | Purpose |
|----------|---------|
| `YOUTUBE_API_KEY` | YouTube Data API for video metadata |
| `EXA_API_KEY` | Exa search for YouTube video discovery |
| `SUPADATA_API_KEY` | Optional: Transcript fallback service |
| `OPENAI_API_KEY` | Embeddings for knowledge base search |
| `CRON_SECRET` | Auth token for cron job endpoints |

### Optional / Google Cloud

| Variable | Purpose |
|----------|---------|
| `GOOGLE_API_KEY` | Server-side Google APIs (Places, Vision) |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Client-side Maps JavaScript API |
| `GOOGLE_CUSTOM_SEARCH_ENGINE_ID` | Custom Search for forum search |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob for image storage |
| `NEXT_PUBLIC_APP_URL` | Application base URL (for Stripe redirects) |

See [GOOGLE_CLOUD_APIS.md](GOOGLE_CLOUD_APIS.md) for complete Google API setup.

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


