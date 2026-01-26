# AutoRev Architecture

> AI-powered research platform for sports car enthusiasts
>
> **Last Verified:** January 21, 2026 — Updated with mobile readiness and route consolidation

---

## System Overview

AutoRev is a web-first PWA (Progressive Web App) serving sports car enthusiasts with AI-powered research, modification planning, and community features. The platform is designed mobile-first with native app readiness built in.

```
┌─────────────────────────────────────────────────────────────────┐
│                           USERS                                  │
│              Anonymous → Free → Collector → Tuner                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS FRONTEND (PWA)                       │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │ Garage   │ │ Data     │ │Community │ │   AL     │ │Profile ││
│  │ (mods)   │ │ (specs)  │ │ (social) │ │  (AI)    │ │(account)│
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │            COMPONENTS (192 files)                        │    │
│  │  • Providers (Auth, Favorites, Compare, etc.)           │    │
│  │  • UI Components (Header, Footer, CarImage, etc.)       │    │
│  │  • Feature Components (PerformanceHub, ExpertReviews)   │    │
│  │  • Gates (PremiumGate, TeaserPrompt)                    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API LAYER (160 routes)                       │
│                                                                  │
│  /api/cars/*          Car data (specs, safety, pricing)         │
│  /api/parts/*         Parts catalog and search                  │
│  /api/ai-mechanic     AL assistant (streaming)                  │
│  /api/users/*         User data, garage, AL credits             │
│  /api/community/*     Posts, builds, comments, likes            │
│  /api/analytics/*     Page views, events, engagement            │
│  /api/vin/*           VIN decode                                │
│  /api/checkout        Stripe checkout sessions                  │
│  /api/billing/*       Stripe customer portal                    │
│  /api/webhooks/*      Stripe, Resend, Vercel webhooks           │
│  /api/admin/*         Admin dashboards (28 routes)              │
│  /api/internal/*      Internal tools (18 routes)                │
│  /api/cron/*          Scheduled jobs (20 jobs)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER (177 files)                      │
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
│  │   139 tables    │  │   AL Assistant  │  │  • YouTube API  │ │
│  │   pgvector      │  │   20 tools      │  │  • NHTSA        │ │
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
│   ├── articles/         # Blog/articles
│   ├── community/        # Community pages (events)
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
│   ├── al/               # AL chat (AI assistant)
│   ├── browse-cars/      # Car browsing
│   ├── community/        # Community builds & posts
│   ├── data/             # Performance data hub
│   ├── garage/           # User's garage (builds + projects)
│   └── profile/          # User profile & settings
│
├── admin/                # Admin routes (role-protected)
├── internal/             # Internal tools (role-protected)
├── auth/                 # Auth callbacks
├── api/                  # API routes (161 routes)
└── layout.jsx            # Root layout (global providers)
```

### Route Consolidation (January 2026)

Several routes were consolidated to simplify navigation:

| Old Route | New Route | Redirect Type |
|-----------|-----------|---------------|
| `/car-selector` | `/garage` | Permanent |
| `/tuning-shop` | `/garage` | Permanent |
| `/mod-planner` | `/garage` | Permanent |
| `/my-builds` | `/garage` | Permanent |
| `/build` | `/garage` | Permanent |
| `/track` | `/data` | Permanent |
| `/performance` | `/data` | Permanent |
| `/community/builds` | `/community` | Permanent |
| `/join` | `/` | Temporary |

Redirects are configured in `next.config.js` and `vercel.json`.

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

### Build-Time Optimizations

Configured in `next.config.js`:

```javascript
experimental: {
  // Tree-shake these packages more aggressively
  optimizePackageImports: [
    '@supabase/supabase-js',
    '@supabase/ssr',
    'recharts',
    'date-fns',
    'openai',
    '@anthropic-ai/sdk',
  ],
  // Inline critical CSS
  optimizeCss: true,
},

compiler: {
  // Strip console.log in production (keep warn/error)
  removeConsole: process.env.NODE_ENV === 'production' 
    ? { exclude: ['error', 'warn'] } 
    : false,
},

// Vendor chunk splitting for better caching
webpack: {
  cacheGroups: {
    supabase: { test: /@supabase/, priority: 30 },
    reactQuery: { test: /@tanstack/, priority: 25 },
    utils: { test: /(date-fns|lodash|uuid)/, priority: 20 },
  }
}
```

### Image Optimization

| Feature | Configuration |
|---------|---------------|
| **Formats** | AVIF, WebP (auto-negotiated) |
| **Device Sizes** | 640, 750, 828, 1080, 1200, 1920, 2048 |
| **Thumbnail Sizes** | 16, 32, 48, 64, 96, 128, 256, 384 |

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

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | Next.js (App Router) | 14.2.35 | React SSR/SSG with PWA support |
| **React** | React | 18.2.x | UI library |
| **Database** | Supabase (PostgreSQL) | - | Primary data store |
| **Vector Search** | pgvector | - | Knowledge base embeddings |
| **AI Assistant** | Anthropic Claude Sonnet 4 | - | AL conversational AI |
| **AI Images** | fal.ai | 1.8.x | Image generation |
| **Embeddings** | OpenAI text-embedding-3-small | - | Document embeddings |
| **Auth** | Supabase Auth | - | Authentication |
| **Payments** | Stripe | 14.11.x | Subscription billing & credits |
| **Email** | Resend | 6.5.x | Transactional email delivery |
| **Images** | Vercel Blob | 2.0.x | Car images & assets |
| **Server State** | TanStack Query | 5.90.x | API caching & synchronization |
| **Hosting** | Vercel | - | Deployment & edge functions |
| **Styling** | CSS Modules + Design Tokens | - | Component styles |
| **Testing** | Playwright | 1.57.x | E2E & mobile testing |

---

## Mobile Readiness

AutoRev follows a **PWA-first** strategy, delivering native-like experiences through Progressive Web App technology before pursuing native wrappers.

### Current Status: PWA (Production Ready)

| Feature | Status | Implementation |
|---------|--------|----------------|
| **Installable** | ✅ | Web app manifest with full icon set |
| **Offline Support** | ✅ | Service worker with intelligent caching |
| **App-like UI** | ✅ | Standalone display mode, portrait orientation |
| **Touch Optimization** | ✅ | 44px minimum touch targets, gesture support |
| **API Caching** | ✅ | Stale-while-revalidate for car data |
| **Safe Area Insets** | ✅ | CSS env() for notch/home indicator |

### Service Worker Features (v2.0)

```javascript
// Caching strategies by endpoint type
CACHEABLE_API_PATTERNS = [
  /\/api\/cars$/,                        // Car list
  /\/api\/cars\/[^/]+\/enriched$/,       // Car enriched data
  /\/api\/cars\/[^/]+\/efficiency$/,     // Fuel efficiency
  /\/api\/cars\/[^/]+\/safety-ratings$/, // Safety ratings
  /\/api\/cars\/[^/]+\/recalls$/,        // Recalls
  /\/api\/cars\/[^/]+\/maintenance$/,    // Maintenance
  /\/api\/parts\/popular$/,              // Popular parts
  /\/api\/events$/,                      // Events list
];

// Stale-while-revalidate: Return cached immediately, update in background
// Network-first: User data, auth, billing (always fresh)
// Precached: Offline page, icons, manifest
```

### PWA Manifest Highlights

```json
{
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#0a1628",
  "theme_color": "#1a4d6e",
  "categories": ["automotive", "lifestyle", "sports"]
}
```

### Native App Preparation (Future)

When the time comes for App Store/Play Store distribution:

| Approach | Consideration | Status |
|----------|---------------|--------|
| **Capacitor** | Wrap existing PWA with native shell | 🔲 Not started |
| **React Native** | Full native rewrite | 🔲 Not planned |
| **Push Notifications** | Service worker → native push | 🔲 Prepared |

**Design Token System** — CSS variables in `styles/tokens.css` are structured for future React Native export:

```css
/* Web tokens (current) */
--color-accent-lime: #d4ff00;
--space-4: 16px;
--touch-target-min: 44px;

/* Maps directly to React Native */
const tokens = {
  accentLime: '#d4ff00',
  space4: 16,
  touchTargetMin: 44,
};
```

---

## Tier System

### Hierarchy

```
free → collector → tuner
```

Admin access is handled separately via `user_profiles.role` column, not the tier hierarchy.

### Pricing (Post-Beta)

| Tier | Price | AL Chats/Month |
|------|-------|----------------|
| **Free** | $0 | ~15 |
| **Enthusiast** (collector) | $9.99/mo | ~130 |
| **Pro** (tuner) | $19.99/mo | ~350 |

### Implementation

**Config:** `lib/tierAccess.js`

```javascript
export const IS_BETA = true; // Bypasses all tier checks when true

export const FEATURES = {
  // Free tier - Discovery & buying research
  carSelector: { tier: 'free' },
  carDetailPages: { tier: 'free' },
  fuelEconomy: { tier: 'free' },
  safetyRatings: { tier: 'free' },
  alBasic: { tier: 'free' },           // 25 AI chats/month
  
  // Collector tier - Ownership intelligence
  vinDecode: { tier: 'collector' },
  ownerReference: { tier: 'collector' },
  marketValue: { tier: 'collector' },
  priceHistory: { tier: 'collector' },
  serviceLog: { tier: 'collector' },
  recallAlerts: { tier: 'collector' },
  alCollector: { tier: 'collector' },  // 75 AI chats/month
  
  // Tuner tier - Performance intelligence
  dynoDatabase: { tier: 'tuner' },
  fullLapTimes: { tier: 'tuner' },
  fullPartsCatalog: { tier: 'tuner' },
  buildProjects: { tier: 'tuner' },
  buildAnalytics: { tier: 'tuner' },
  alTuner: { tier: 'tuner' },          // 150 AI chats/month
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
- Credit/usage still tracked for analytics

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
| **Server State** | TanStack Query | API caching & synchronization |
| **Favorites** | Zustand + Supabase | `favoritesStore` |
| **Compare** | Zustand | `compareStore` |
| **Car Selection** | Zustand | `carSelectionStore` |
| **User Preferences** | Zustand + localStorage | `userPreferencesStore` |
| **AL Preferences** | Zustand + localStorage | `alPreferencesStore` |

### Zustand Store Pattern

```javascript
// lib/stores/exampleStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useExampleStore = create(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((s) => ({ items: [...s.items, item] })),
      clear: () => set({ items: [] }),
    }),
    { name: 'autorev-example' }
  )
);
```

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
| **fal.ai** | Image generation | Various (article images) |

### Payment Processing

| Service | Purpose | Status |
|---------|---------|--------|
| **Stripe** | Subscription billing, AL credit packs, donations | ✅ Integrated |

**Features:**
- Subscription management (Enthusiast $9.99/mo, Pro $19.99/mo)
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

### High Frequency (Every 5-15 minutes)

| Job | Schedule | Purpose |
|-----|----------|---------|
| `flush-error-aggregates` | Every 5 min | Aggregate and flush error metrics |
| `process-email-queue` | Every 5 min | Send queued transactional emails |
| `process-scrape-jobs` | Every 15 min | Process scrape queue (incremental) |

### Daily Jobs

| Job | Schedule (UTC) | Purpose |
|-----|----------------|---------|
| `daily-metrics` | 00:00 | Calculate daily platform metrics |
| `calculate-engagement` | 02:00 | Calculate user engagement scores |
| `refresh-events` | 06:00 | Fetch events from external sources |
| `retention-alerts` | 10:00 | Check for at-risk users |
| `schedule-inactivity-emails` | 11:00 | Queue re-engagement emails |
| `daily-digest` | 14:00 | Send daily digest to Discord |
| `article-research` | 00:00 | AI research for article topics |
| `article-write` | 05:00 | AI writes draft articles |
| `article-images` | 06:00 | Generate article images |
| `article-publish` | 08:00 | Publish approved articles |

### Weekly Jobs

| Job | Day/Time (UTC) | Purpose |
|-----|----------------|---------|
| `weekly-car-expansion` | Sun 01:00 | Expand car database coverage |
| `schedule-ingestion` | Sun 01:30 | Queue parts ingestion from vendors |
| `refresh-recalls` | Sun 02:00 | Fetch NHTSA recall data |
| `refresh-complaints` | Sun 02:30 | Fetch NHTSA complaint data |
| `youtube-enrichment` | Mon 04:00 | Discover videos, AI summaries |
| `forum-scrape` | Tue, Fri 05:00 | Scrape forums, extract insights |
| `al-optimization` | Sat 03:00 | Optimize AL performance |

**Data Flow:**
```
schedule-ingestion → creates scrape_jobs → process-scrape-jobs consumes
youtube-enrichment → youtube_ingestion_queue → AI processing
forum-scrape → forum_scraped_threads → community_insights
refresh-events → events table (auto-approve, geocode, dedupe)
article-* pipeline → article_queue → published articles
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

### Data Enrichment & AI

| Variable | Purpose |
|----------|---------|
| `YOUTUBE_API_KEY` | YouTube Data API for video metadata |
| `EXA_API_KEY` | Exa search for YouTube video discovery |
| `SUPADATA_API_KEY` | Optional: Transcript fallback service |
| `OPENAI_API_KEY` | Embeddings for knowledge base search |
| `FAL_KEY` | fal.ai image generation for articles |
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


