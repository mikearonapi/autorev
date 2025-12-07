# SuperNatural Motorsports - Data Model & Ownership

This document defines the data boundaries and ownership rules for the SuperNatural Motorsports application. It serves as the single source of truth for understanding where data lives and who is responsible for it.

## Data Ownership Summary

| Layer | Location | Purpose | Examples |
|-------|----------|---------|----------|
| **Supabase** | Cloud DB | Mutable business data | Cars, leads, upgrade packages, image URLs |
| **Local Config** | `src/data/` | Immutable product logic | Categories, tier definitions, scoring weights |
| **Derived/Computed** | `src/lib/` | Algorithmic transformations | Weighted scores, recommendations, performance deltas |

---

## 1. Supabase (Mutable Business Data)

### Purpose
Supabase holds all data that:
- May be updated without redeploying the app
- Is user-generated (leads, contact submissions)
- Requires persistence across sessions
- Benefits from database queries and indexing

### Tables

#### `cars`
The authoritative source for vehicle data in production.

| Column Type | Examples | Notes |
|-------------|----------|-------|
| Identity | `id`, `slug`, `name`, `years` | UUID primary key, unique slug for URLs |
| Tiers | `tier`, `category` | Constrained values |
| Advisory Scores | `score_sound`, `score_interior`, etc. | 1-10 scale, used by recommendation engine |
| Performance HUB Scores | `perf_power_accel`, `perf_grip_cornering`, etc. | 1-10 scale, for GT-style visualization |
| Core Specs | `engine`, `hp`, `trans`, `price_range`, `price_avg` | Display and sorting |
| Extended Specs | `curb_weight`, `zero_to_sixty`, `torque`, `lateral_g`, etc. | Optional, for hero pages & Performance HUB |
| Content | `notes`, `highlight`, `tagline`, `pros`, `cons`, `best_for` | Editorial content |
| Media | `image_hero_url`, `image_gallery`, `video_url` | URLs to Vercel Blob storage |

#### `leads`
User submissions from contact form, newsletter signups, and CTAs.

| Column | Purpose |
|--------|---------|
| `email` | Primary identifier (unique constraint) |
| `name` | Optional user name |
| `source` | Origin: `contact`, `newsletter`, `hero-page`, `upgrade-inquiry`, `service-booking` |
| `car_interest_slug` | FK to specific car if relevant |
| `metadata` | JSONB for messages, interests, interaction history |

#### `upgrade_packages`
Upgrade packages and modules for Performance HUB.

| Column | Purpose |
|--------|---------|
| `key`, `slug` | Unique identifiers |
| `type` | `package` (curated set) or `module` (individual item) |
| `tier` | `streetSport`, `trackPack`, `timeAttack` |
| `delta_*` | Performance score deltas (+/- values) |
| `metric_*` | Hard metric changes (HP gain, 0-60 improvement) |
| `car_slug` | NULL = applies to all cars, or specific car slug |

### Row Level Security (RLS)

| Table | Public Read | Public Insert | Public Update | Public Delete |
|-------|-------------|---------------|---------------|---------------|
| `cars` | ✅ Yes | ❌ No | ❌ No | ❌ No |
| `leads` | ❌ No | ✅ Yes | ✅ Yes (for upsert) | ❌ No |
| `upgrade_packages` | ✅ Yes | ❌ No | ❌ No | ❌ No |

---

## 2. Local Config (Immutable Product Logic)

### Purpose
Local files hold configuration that:
- Defines how the app behaves (not what data it displays)
- Should only change with intentional product updates
- Doesn't need to be modified at runtime
- Is used by scoring algorithms and UI rendering

### Files

#### `src/data/cars.js`
**Role: Seed data & local fallback**

- Contains the same data structure as Supabase `cars` table
- Used when Supabase is not configured (local development)
- Serves as the seed source for new environments
- **NOT the source of truth in production** — Supabase is

```javascript
// Export structure
export const carData = [...];           // Array of car objects
export const categories = [...];        // Advisory scoring categories
export const tierConfig = {...};        // Price tier labels
export const recommendationTypes = [...]; // Recommendation card types
```

#### `src/data/performanceCategories.js`
**Role: Performance HUB category definitions**

- Defines the 7 Performance HUB categories
- Maps hard metrics to each category
- Provides score guides and labels
- Defines upgrade tiers (stock, streetSport, trackPack, timeAttack)

```javascript
// Export structure
export const performanceCategories = [...]; // 7 GT-style categories
export const upgradeTiers = {...};          // Tier definitions with colors
export const upgradeModuleCategories = [...]; // Module groupings
```

#### `src/data/upgradePackages.js`
**Role: Upgrade package definitions & local fallback**

- Generic upgrade packages (Street Sport, Track Pack, Time Attack)
- Individual upgrade modules (intake, exhaust, coilovers, etc.)
- Performance deltas for each package/module
- **Synced to Supabase `upgrade_packages` table in production**

---

## 3. Derived/Computed (Algorithmic Logic)

### Purpose
Pure functions that transform data. These should:
- Have no side effects
- Be deterministic (same input = same output)
- Live in `src/lib/`
- Be testable in isolation

### Files

#### `src/lib/scoring.js`
**Role: Advisory recommendation engine**

- `calculateWeightedScore(car, weights)` — Weighted total for a car
- `calculateMaxScore(weights)` — Max possible score
- `getRecommendations(cars, weights)` — Top match, best sound, best track, etc.
- `getScoreLabel(score)` — "Excellent", "Good", etc.

**Important:** Scoring logic does NOT live in the database. Only raw scores are stored; weighted calculations happen client-side.

#### `src/lib/performance.js`
**Role: Performance HUB calculations**

- `getStockPerformanceScores(car)` — Extract or derive stock scores
- `applyUpgradeDeltas(stockScores, upgrades)` — Apply package deltas
- `calculateUpgradedMetrics(car, upgrades)` — Compute new HP, 0-60, etc.
- `getPerformanceProfile(car, upgradeKeys)` — Full comparison object

---

## 4. API Clients

### `src/api/supabaseClient.js`
Initializes Supabase client with env vars. Exports `isSupabaseConfigured` flag.

### `src/api/carsClient.js`
- `fetchCars()` — All cars from Supabase or local fallback
- `fetchCarBySlug(slug)` — Single car lookup
- Normalizes snake_case → camelCase

### `src/api/leadsClient.js`
- `submitLead({ email, name, source, ... })` — Submit or update lead
- Handles duplicate email upsert pattern
- Validates email format

---

## 5. Image Storage Strategy

### Vercel Blob
All images are stored in Vercel Blob and referenced by URL in Supabase.

| Image Type | Path Pattern | Dimensions | Aspect Ratio |
|------------|--------------|------------|--------------|
| Car Hero | `cars/{slug}/hero.webp` | 1280×720 | 16:9 |
| Car Thumbnail | `cars/{slug}/thumb.webp` | 640×480 | 4:3 |
| Car Gallery | `cars/{slug}/gallery-{n}.webp` | 960×640 | 3:2 |
| Car OG Image | `cars/{slug}/og.jpg` | 1200×630 | OpenGraph |
| Page Hero | `pages/home/hero.webp` | 1920×1080 | 16:9 |
| Page Section | `pages/{page}/{section}.webp` | 1280×720 | 16:9 |
| Shared Assets | `shared/{name}.webp` | Various | Various |

### Database Storage
- `cars.image_hero_url` — Direct URL to Vercel Blob
- `cars.image_gallery` — JSONB array of URLs
- **Never store binary data in Supabase**

### Image Utilities (`src/lib/images.js`)
Helper functions for working with images:

```javascript
// Get car hero image with fallback chain
getCarHeroImage(car) // → URL or null for placeholder

// Check if placeholder should be shown
shouldShowPlaceholder(car) // → boolean

// Get gradient placeholder styles
getPlaceholderGradient(seed, variant) // → { background: '...' }

// Generate AI prompt metadata (for scripts)
getImageGenMetadata(car) // → { slug, promptHints, outputPaths }
```

### Image Components

| Component | Purpose | Props |
|-----------|---------|-------|
| `CarImage` | Car images with placeholder fallback | `car`, `variant`, `showName` |
| `CarThumbnail` | Lightweight thumbnail | `car`, `className` |
| `PageImage` | Page-level images | `imageKey`, `variant`, `children` |
| `HeroImage` | Hero backgrounds with overlay | `imageKey`, `children` |

### Image Generation Script
Run `scripts/generate-images.js` to create AI-generated images:

```bash
# Preview what would be generated
node scripts/generate-images.js --dry-run

# Generate for specific car
node scripts/generate-images.js --car 718-cayman-gt4 --generate

# Generate page images
node scripts/generate-images.js --pages --generate
```

Requires environment variables:
- `GOOGLE_AI_API_KEY` — For AI image generation
- `BLOB_READ_WRITE_TOKEN` — For Vercel Blob uploads

---

## 6. Environment Variables

### Client-Side (VITE_ prefix)
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Server-Side Only (NOT exposed to browser)
```
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # For admin scripts only
GOOGLE_AI_API_KEY=...             # For image generation scripts
BLOB_READ_WRITE_TOKEN=...         # For Vercel Blob uploads
```

---

## 7. Data Flow Diagrams

### Advisory Flow
```
User adjusts weights
        ↓
calculateWeightedScore() for each car
        ↓
getRecommendations() filters & sorts
        ↓
UI renders recommendation cards
```

### Performance HUB Flow
```
User selects upgrade package
        ↓
getStockPerformanceScores(car)
        ↓
applyUpgradeDeltas(stock, [packages])
        ↓
getScoreComparison(stock, upgraded)
        ↓
Bar chart visualization
```

### Lead Capture Flow
```
User submits form
        ↓
submitLead() validates & formats
        ↓
Supabase INSERT (or UPDATE if email exists)
        ↓
Success/error feedback to UI
```

---

## 8. Updating Data

### To update car information:
1. **Production:** Update directly in Supabase dashboard or via API
2. **Local/Seed:** Update `src/data/cars.js` and re-run seed script

### To add a new car:
1. Add to `src/data/cars.js` with all required fields
2. Run seed script to sync to Supabase
3. Generate hero image via AI script
4. Upload to Vercel Blob
5. Update `image_hero_url` in Supabase

### To modify scoring algorithm:
1. Update functions in `src/lib/scoring.js`
2. Test with existing car data
3. Deploy (client-side change, no database migration needed)

### To add upgrade packages:
1. Add to `src/data/upgradePackages.js`
2. Run seed script to sync to Supabase `upgrade_packages`
3. Packages become available in Performance HUB automatically

---

## 9. Security Notes

- **Anon key is public** — RLS policies restrict what it can do
- **Service role key is secret** — Never expose to browser
- **No business logic in database** — All scoring happens client-side
- **Email validation happens client-side AND server-side** — Defense in depth
- **Leads table allows INSERT but not SELECT** — Users can't query other leads

---

## 10. Quick Reference

### What goes WHERE?

| I want to... | Location |
|--------------|----------|
| Change a car's HP | Supabase `cars.hp` |
| Change how scores are weighted | `src/lib/scoring.js` |
| Add a new scoring category | `src/data/cars.js` (categories array) |
| Change upgrade package costs | `src/data/upgradePackages.js` → sync to Supabase |
| Add a new car image | Vercel Blob → update `image_hero_url` in Supabase |
| Change hero page copy | Supabase `cars.tagline`, `hero_blurb`, etc. |
| Change recommendation algorithm | `src/lib/scoring.js` |
| Change Performance HUB visualization | `src/lib/performance.js` + components |

