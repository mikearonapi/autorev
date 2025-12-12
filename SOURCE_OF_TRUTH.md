# AutoRev - Source of Truth

> **Last Updated**: December 8, 2024 (Major vehicle database expansion - 98 vehicles)  
> **Framework**: Next.js 14 (App Router)  
> **Database**: Supabase (PostgreSQL)  
> **Deployment**: Vercel  

This document is the authoritative reference for all code decisions, architecture, and relationships in the AutoRev codebase.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Routes & Pages](#4-routes--pages)
5. [Components](#5-components)
6. [Data Layer](#6-data-layer)
7. [Database Schema](#7-database-schema)
8. [API Clients](#8-api-clients)
9. [Scoring & Algorithms](#9-scoring--algorithms)
10. [Styling System](#10-styling-system)
11. [Environment Variables](#11-environment-variables)
12. [User Journeys](#12-user-journeys)
13. [Local Development](#13-local-development)
14. [Deployment](#14-deployment)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Project Overview

AutoRev is a sports car advisory platform that helps enthusiasts find the right vehicle based on their priorities. The site features:

- **Sports Car Selector**: 98 vehicles with 7 weighted scoring criteria
- **Performance HUB**: Gran Turismo-inspired upgrade visualization
- **Upgrade Advisory**: Guidance on modifications
- **Services**: Professional upgrade installation services
- **Lead Capture**: Non-intrusive email collection

### Core Philosophy
- **Unbiased**: No affiliate links or pay-to-win recommendations
- **For Everyone**: All budgets welcome ($25K-$100K+)
- **Expert-Driven**: Real ownership experience, not just specs
- **Free to Use**: No email required to use the advisory

### Vehicle Database Coverage

The database includes **98 sports cars and performance vehicles under $100k**, organized by segments:

| Segment | Count | Examples |
|---------|-------|----------|
| **Rally/AWD Heroes** | 5 | Evo VIII/IX, Evo X, WRX STI GD/GR/VA |
| **Lightweight Analog** | 9 | S2000, Miata NA/NB/NC/ND, 86/BRZ |
| **JDM Legends** | 6 | Supra Mk4, RX-7 FD, 300ZX TT, Z RZ34, Integra Type R |
| **German M/RS/AMG** | 13 | M3 E46/E92/F80, 1M, RS5, RS3, TT RS, C63, Giulia QV |
| **Super-Sedans** | 8 | M5 E39/E60/F10/F90, E63, CTS-V Gen 2/3 |
| **American Muscle** | 8 | C5/C6 Z06/GS, Challenger/Charger 392/Hellcat, Boss 302 |
| **Lotus Hardcore** | 2 | Elise S2, Exige S |
| **Hot Hatches** | 6 | Civic Type R FK8/FL5, Golf R Mk7/Mk8, GTI, Focus RS |
| **Exotics/Other** | 6 | 911 Turbo/GT3, AMG GT, Model 3 Performance |
| **Core Coverage** | 35 | Original Porsche, Corvette, GT-R, Viper, etc. |

### Inclusion Rules
- **Price**: Include if ANY realistic year/spec can be bought under $100k
- **Granularity**: Separate entries per major generation when engine/chassis/ownership differs materially
- **Scope**: U.S. market focus, ~1990s to present, curated sports sedans and hot hatches included

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Next.js 14 | React framework with App Router |
| **Language** | JavaScript (JSX) | Component development |
| **Styling** | CSS Modules | Scoped, modular styles |
| **Database** | Supabase (PostgreSQL) | Car data, leads, upgrades |
| **Images** | Vercel Blob | CDN-backed image storage |
| **Deployment** | Vercel | Hosting & CI/CD |
| **Version Control** | GitHub | Source code management |

### Key Dependencies
```json
{
  "next": "^14.2.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "@supabase/supabase-js": "^2.86.2"
}
```

---

## 3. Project Structure

```
autorev/
├── app/                      # Next.js App Router (pages)
│   ├── layout.jsx           # Root layout (Header + Footer)
│   ├── page.jsx             # Home page (/)
│   ├── globals.css          # Global styles & theme tokens
│   ├── not-found.jsx        # 404 page
│   ├── car-finder/          # /car-finder - Sports Car Finder
│   ├── performance/         # /performance - Performance HUB
│   ├── upgrades/            # /upgrades - Upgrade Advisory
│   ├── services/            # /services - Upgrade Services
│   ├── contact/             # /contact - Contact Form
│   └── cars/[slug]/         # /cars/:slug - Car Detail
│       └── performance/     # /cars/:slug/performance - Car Performance HUB
│
├── components/              # Reusable React components
│   ├── Header.jsx          # Global navigation
│   ├── Footer.jsx          # Global footer with newsletter
│   ├── Button.jsx          # Universal button component
│   ├── SportsCarComparison.jsx  # Main advisory tool
│   ├── PerformanceHub.jsx  # Performance visualization
│   ├── CarImage.jsx        # Car image with fallback
│   ├── NewsletterSignup.jsx # Email capture form
│   ├── ScoringInfo.jsx     # Scoring methodology explainer
│   └── LoadingSpinner.jsx  # Loading state indicator
│
├── data/                    # Static data (seed/fallback)
│   ├── cars.js             # Vehicle database (98 cars)
│   ├── performanceCategories.js  # Performance HUB categories
│   └── upgradePackages.js  # Upgrade modules & packages
│
├── lib/                     # Utilities & API clients
│   ├── supabase.js         # Supabase client initialization
│   ├── carsClient.js       # Car data fetching
│   ├── leadsClient.js      # Lead submission
│   ├── scoring.js          # Recommendation algorithms
│   ├── performance.js      # Performance calculations
│   └── images.js           # Image URL handling
│
├── supabase/               # Database schema
│   ├── schema.sql          # Table definitions, RLS, indexes
│   └── seed.sql            # Sample data (if needed)
│
├── scripts/                # Development utilities
│   ├── migrate-and-seed.js # Database setup script
│   └── generate-images.js  # AI image generation helper
│
├── docs/                   # Additional documentation
│   ├── data-model.md       # Data ownership rules
│   └── image-inventory.md  # Required images list
│
├── next.config.js          # Next.js configuration
├── jsconfig.json           # Path aliases (@/)
├── package.json            # Dependencies & scripts
└── README.md               # Quick start guide
```

---

## 4. Routes & Pages

### Route Map

| Route | Page | Component | Description |
|-------|------|-----------|-------------|
| `/` | Home | `app/page.jsx` | Landing page with hero, pillars, process |
| `/car-finder` | Sports Car Finder | `app/car-finder/page.jsx` | Main recommendation tool |
| `/performance` | Performance HUB | `app/performance/page.jsx` | Car selection for Performance HUB |
| `/cars/[slug]` | Car Detail | `app/cars/[slug]/page.jsx` | Individual car profile |
| `/cars/[slug]/performance` | Car Performance | `app/cars/[slug]/performance/page.jsx` | Performance HUB for specific car |
| `/upgrades` | Upgrade Advisory | `app/upgrades/page.jsx` | Upgrade planning intake form |
| `/services` | Services | `app/services/page.jsx` | Installation services |
| `/contact` | Contact | `app/contact/page.jsx` | Contact form |
| `*` | 404 | `app/not-found.jsx` | Page not found |

### Page Hierarchy

```
Layout (Header + Footer)
├── Home
├── Advisory
│   └── SportsCarComparison (embedded)
├── Performance
│   └── Car Selection Grid
│       └── PerformanceHub (when car selected)
├── Car Detail
│   └── Links to Performance HUB
├── Upgrades
├── Services
└── Contact
```

---

## 5. Components

### Component Dependency Graph

```
Layout
├── Header
│   └── NavLinks → Link (next/link)
├── Footer
│   └── NewsletterSignup
│       └── leadsClient.submitLead()
└── {children} (page content)

SportsCarComparison (Advisory page)
├── Icons (inline SVGs)
├── fetchCars() → carsClient
├── calculateWeightedScore() → scoring.js
└── Link → /cars/[slug]

PerformanceHub
├── CarImage
├── ScoringInfo
├── getPerformanceProfile() → performance.js
└── Links → /cars/[slug], /upgrades, /services

CarDetail
├── CarImage
├── ScoringInfo
├── NewsletterSignup
├── calculateScoreBreakdown() → scoring.js
└── Links → /upgrades, /performance
```

### Component Props Reference

#### Button
```jsx
<Button
  href="/path"        // Internal link (uses next/link)
  variant="primary"   // primary | secondary | outline | ghost
  size="md"          // sm | md | lg
  fullWidth={false}  // boolean
  icon={<Icon />}    // optional icon
  external={false}   // true for external links
/>
```

#### CarImage
```jsx
<CarImage
  car={carObject}     // Required: car with slug, name, imageHeroUrl
  variant="hero"      // hero | thumbnail | card
  showName={true}     // Show name on placeholder
  lazy={true}         // Lazy loading
/>
```

#### NewsletterSignup
```jsx
<NewsletterSignup
  variant="default"   // default | compact | inline
  source="newsletter" // Lead source identifier
  carSlug={null}      // Optional: car context
  title="..."         // Heading text
  description="..."   // Subtext
  buttonText="..."    // CTA button text
/>
```

---

## 6. Data Layer

### Data Ownership Matrix

| Data Type | Source | Mutability | Location |
|-----------|--------|------------|----------|
| Car specs & scores | Supabase | Mutable | `cars` table |
| Lead submissions | Supabase | Write-only | `leads` table |
| Upgrade packages | Supabase | Mutable | `upgrade_packages` table |
| Categories | Local | Immutable | `data/cars.js` |
| Tier config | Local | Immutable | `data/cars.js` |
| Performance categories | Local | Immutable | `data/performanceCategories.js` |
| Scoring algorithms | Local | Immutable | `lib/scoring.js` |
| Performance calculations | Local | Derived | `lib/performance.js` |

### Fallback Strategy

All data fetching follows this pattern:
1. Try Supabase first
2. If Supabase fails or returns empty, use local data
3. Log errors but never break the UI

```javascript
// Example from carsClient.js
export async function fetchCars() {
  if (!isSupabaseConfigured) {
    return localCarData;  // Fallback
  }
  try {
    const { data, error } = await supabase.from('cars').select('*');
    if (error || !data.length) return localCarData;
    return data.map(normalizeCarFromSupabase);
  } catch (err) {
    return localCarData;  // Fallback on any error
  }
}
```

---

## 7. Database Schema

### Tables Overview

```sql
-- CARS: Vehicle database
cars (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  years VARCHAR(50),
  tier VARCHAR(20),                    -- premium | upper-mid | mid | budget
  category VARCHAR(50),                -- Mid-Engine | Front-Engine | Rear-Engine
  
  -- Brand & Origin (for upgrade pricing)
  brand VARCHAR(100),                  -- Porsche | Chevrolet | BMW | etc.
  country VARCHAR(50),                 -- Germany | USA | Japan | UK | Italy
  platform_cost_tier VARCHAR(50),      -- exotic | premium | luxury | mainstream
  
  -- Advisory Scores (1-10)
  score_sound, score_interior, score_track,
  score_reliability, score_value, score_driver_fun, score_aftermarket,
  
  -- Specs
  engine, hp, trans, drivetrain, price_range, price_avg,
  curb_weight, zero_to_sixty, top_speed, layout,
  torque, quarter_mile, braking_60_to_0, lateral_g,
  
  -- Performance HUB Scores (1-10)
  perf_power_accel, perf_grip_cornering, perf_braking,
  perf_track_pace, perf_drivability, perf_reliability_heat, perf_sound_emotion,
  
  -- Ownership & Usability
  manual_available BOOLEAN,
  seats INTEGER,
  daily_usability_tag VARCHAR(50),     -- Dailyable | Weekend warrior | Track focused
  maintenance_cost_index INTEGER,       -- 1-5 scale
  insurance_cost_index INTEGER,         -- 1-5 scale
  fuel_economy_combined INTEGER,        -- MPG
  common_issues TEXT[],                 -- Array of known issues
  years_to_avoid VARCHAR(200),
  recommended_years_note TEXT,
  ownership_cost_notes TEXT,
  
  -- Content
  notes, highlight, tagline, hero_blurb, pros, cons, best_for,
  
  -- Media
  image_hero_url, image_gallery
)

-- LEADS: Email capture
leads (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(200),
  source VARCHAR(50),    -- contact | newsletter | hero-page | performance-hub
  interest VARCHAR(100),
  message TEXT,
  car_interest_slug VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- UPGRADE_PACKAGES: Modification options
upgrade_packages (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200),
  slug VARCHAR(100),
  type VARCHAR(50),      -- package | module
  tier VARCHAR(50),      -- street | sport | track | race
  category VARCHAR(100), -- exhaust | suspension | brakes | power | cooling
  
  -- Cost
  estimated_cost, estimated_cost_low, estimated_cost_high,
  
  -- Performance Deltas (added to stock scores)
  delta_power_accel, delta_grip_cornering, delta_braking,
  delta_track_pace, delta_drivability, delta_reliability_heat, delta_sound_emotion,
  
  -- Content
  description, intended_use, includes, considerations,
  car_slug, applicable_layouts
)
```

### Row Level Security (RLS)

```sql
-- Public read access for cars and upgrade_packages
-- Public write access for leads (insert/update only)
-- Service role required for delete operations
```

---

## 8. API Clients

### `lib/supabase.js` - Client Initialization
```javascript
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
```

### `lib/carsClient.js` - Car Data
| Function | Purpose |
|----------|---------|
| `fetchCars()` | Get all cars (sorted by price) |
| `fetchCarBySlug(slug)` | Get single car by slug |
| `fetchCarsByTier(tier)` | Filter cars by tier |
| `fetchCarsByCategory(category)` | Filter by chassis type |
| `searchCars(query)` | Search by name/engine/notes |

### `lib/leadsClient.js` - Lead Capture
| Function | Purpose |
|----------|---------|
| `submitLead(data)` | Create or update lead record |
| `checkEmailExists(email)` | Check for existing lead |

### Data Normalization

Supabase uses `snake_case`, frontend uses `camelCase`:

```javascript
// Supabase → Frontend
{
  score_sound: 8,        → { sound: 8 }
  price_avg: 45000,      → { priceAvg: 45000 }
  image_hero_url: "...", → { imageHeroUrl: "..." }
}
```

---

## 9. Scoring & Algorithms

### Advisory Scoring (`lib/scoring.js`)

#### Weighted Score Calculation
```javascript
// Each car has 7 scores (1-10)
const categories = ['sound', 'interior', 'track', 'reliability', 'value', 'driverFun', 'aftermarket'];

// User sets weights via sliders (0-10)
// Total score = Σ(category_score × weight) / Σ(weights)

function calculateWeightedScore(car, weights) {
  let totalScore = 0;
  let totalWeight = 0;
  categories.forEach(cat => {
    totalScore += car[cat] * weights[cat];
    totalWeight += weights[cat];
  });
  return totalWeight > 0 ? totalScore / totalWeight : 0;
}
```

#### Score Labels
| Score | Label | Tier |
|-------|-------|------|
| 9-10 | Exceptional | A |
| 7-8.9 | Great | B |
| 5-6.9 | Good | C |
| 3-4.9 | Average | D |
| 0-2.9 | Below Average | F |

### Performance HUB Scoring (`lib/performance.js`)

#### 7 Performance Categories
1. **Power & Acceleration** - HP, torque, 0-60
2. **Grip & Cornering** - Tires, suspension, lateral G
3. **Braking** - Stopping distance, fade resistance
4. **Track Pace** - Overall lap time potential
5. **Drivability** - Daily usability, comfort
6. **Reliability & Heat** - Track endurance
7. **Sound & Emotion** - Exhaust note, engagement

#### Upgrade Calculation
```javascript
// Stock scores come from car.perf* fields
// Upgrades add delta values
upgradedScore = stockScore + Σ(upgrade.delta*)

// Example: Sport Exhaust adds +1.5 to sound_emotion
```

#### Brand-Specific Upgrade Pricing (`data/upgradePricing.js`)

Premium brands have higher parts and labor costs. The system uses `platformCostTier` to adjust pricing:

| Tier | Multiplier | Brands |
|------|-----------|--------|
| **Exotic** | 2.0x | Ferrari, Lamborghini, McLaren, Aston Martin |
| **Premium** | 1.5x | Porsche, BMW, Mercedes-AMG, Audi |
| **Luxury** | 1.3x | Lexus, Jaguar, Maserati, Alfa Romeo, Lotus |
| **Mainstream** | 1.0x | Ford, Chevrolet, Dodge, Nissan, Toyota |

```javascript
// Pricing calculation
const adjustedCost = baseCost * platformCostMultipliers[car.platformCostTier].multiplier;

// Brand-specific overrides exist for known expensive combos:
// Example: Porsche big brake kit = $4,500-$9,000 (vs $2,500-$5,000 generic)
```

---

## 10. Styling System

### CSS Variables (`app/globals.css`)

```css
:root {
  /* Brand Colors */
  --sn-primary: #1a4d6e;
  --sn-primary-light: #2a6d94;
  --sn-primary-dark: #0f3347;
  --sn-accent: #d4a418;
  
  /* Performance HUB Colors */
  --perf-power: #e74c3c;
  --perf-grip: #3498db;
  --perf-braking: #e67e22;
  --perf-track: #9b59b6;
  --perf-comfort: #1abc9c;
  --perf-reliability: #27ae60;
  --perf-sound: #f39c12;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  /* Typography */
  --font-display: 'Oswald', sans-serif;
  --font-body: 'Inter', sans-serif;
  
  /* Breakpoints (in media queries) */
  /* Mobile: default */
  /* Tablet: 768px */
  /* Desktop: 1024px */
}
```

### CSS Module Pattern
```css
/* Component.module.css */
.container { ... }
.title { ... }
.button { ... }

/* Usage in JSX */
import styles from './Component.module.css';
<div className={styles.container}>
  <h1 className={styles.title}>...</h1>
</div>
```

---

## 11. Environment Variables

### Required Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Yes |

### Optional Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_VERCEL_BLOB_URL` | Vercel Blob public URL | For images |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token | For uploads |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key | For scripts only |

### Vercel Integration

When you connect Supabase to Vercel:
- `NEXT_PUBLIC_SUPABASE_URL` is auto-configured
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is auto-configured
- No manual setup needed!

---

## 12. User Journeys

### Journey 1: Finding a Car

```
Home → Advisory → Adjust Weights → View Recommendations → Car Detail → Performance HUB
```

1. User lands on Home, clicks "Explore the Advisory"
2. On Advisory, adjusts sliders for priorities (sound, track, value, etc.)
3. Recommendations update in real-time
4. User clicks a car to see full profile
5. User can view Performance HUB to see upgrade potential

### Journey 2: Planning Upgrades

```
Home → Upgrades → Fill Form → Contact
```

1. User has a car, wants to upgrade
2. Goes to Upgrades page, fills out goals/budget
3. Submits form, which creates a lead
4. AutoRev team follows up

### Journey 3: Exploring Performance

```
Performance HUB → Select Car → View Stock Scores → Select Upgrades → See Improvements
```

1. User goes directly to Performance HUB
2. Selects a car from the grid
3. Sees stock performance scores (7 categories)
4. Selects upgrade packages/modules
5. Sees visual representation of improvements

---

## 13. Local Development

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/mikearonapi/autorev.git
cd autorev

# 2. Install dependencies
npm install

# 3. Create .env.local (optional - app works with local data)
echo "NEXT_PUBLIC_SUPABASE_URL=your-url" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key" >> .env.local

# 4. Run development server
npm run dev

# 5. Open http://localhost:3000
```

### Available Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `npm run dev` | Start dev server |
| `build` | `npm run build` | Production build |
| `start` | `npm run start` | Start production server |
| `lint` | `npm run lint` | Run ESLint |
| `seed` | `npm run seed` | Seed database |

### Without Supabase

The app works fully with local data from `data/cars.js`. Supabase is only needed for:
- Persistent lead storage
- Remote car data updates
- Production deployment

---

## 14. Deployment

### Vercel Deployment Flow

```
GitHub Push → Vercel Webhook → Build → Deploy
```

1. Push to `main` branch
2. Vercel automatically triggers build
3. Next.js builds static + server components
4. Deployed to Vercel Edge Network

### Environment Setup in Vercel

1. **Connect Supabase Integration**
   - Go to Vercel Dashboard → Integrations
   - Add Supabase integration
   - Environment variables are auto-configured

2. **Connect Vercel Blob (optional)**
   - Go to Storage → Create Blob Store
   - Copy token to `BLOB_READ_WRITE_TOKEN`

### Build Settings

Vercel auto-detects Next.js. No custom settings needed.

---

## 15. Troubleshooting

### Common Issues

#### "Supabase not configured" warning
- **Cause**: Missing environment variables
- **Fix**: Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Note**: App still works with local data fallback

#### Car images not loading
- **Cause**: Image URLs not set or Blob not configured
- **Fix**: App shows styled placeholders automatically
- **Note**: Images are purely cosmetic; all functionality works without them

#### 404 on car pages
- **Cause**: Car slug not found in data
- **Fix**: Verify slug exists in `data/cars.js` or Supabase `cars` table

#### Scores not updating
- **Cause**: Caching or state issue
- **Fix**: Hard refresh (Cmd+Shift+R) or clear `.next` folder

### Debug Mode

Add console logging by checking browser DevTools:
- Network tab: API calls to Supabase
- Console: `[carsClient]`, `[leadsClient]` prefixed logs

### Getting Help

1. Check this document first
2. Review `docs/data-model.md` for data questions
3. Check GitHub issues
4. Contact: contact@autorev.app

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2024-12-08 | **MAJOR**: Expanded vehicle database from 35 to 98 cars | AI |
| 2024-12-08 | Added Rally/AWD segment: Evo VIII/IX/X, WRX STI GD/GR/VA | AI |
| 2024-12-08 | Added Lightweight segment: S2000, Miata NA/NB/NC/ND, 86/BRZ variants | AI |
| 2024-12-08 | Added JDM Legends: Supra Mk4, RX-7 FD, 300ZX TT, 350Z, Z RZ34, Integra Type R | AI |
| 2024-12-08 | Added German M/RS/AMG: M3 E46/E92/F80, 1M, Z4 M, RS5/RS3/TT RS, C63 W205, Giulia QV | AI |
| 2024-12-08 | Added Super-Sedans: M5 E39/E60/F10/F90, E63 W212/W213, CTS-V Gen 2/3 | AI |
| 2024-12-08 | Added American Muscle: C5/C6 Z06/GS, Challenger/Charger 392/Hellcat, Boss 302 | AI |
| 2024-12-08 | Added Lotus: Elise S2, Exige S | AI |
| 2024-12-08 | Added Hot Hatches: Civic Type R FK8/FL5, Golf R Mk7/Mk8, GTI Mk7, Focus RS | AI |
| 2024-12-08 | Added Other: 911 Turbo 997, 911 GT3 996/997, AMG GT, Model 3 Performance | AI |
| 2024-12-07 | **CLEANUP**: Removed entire legacy `src/` directory (Vite-era code) | AI |
| 2024-12-07 | **FIX**: Updated scripts to import from `data/` instead of `src/data/` | AI |
| 2024-12-07 | Full-stack audit completed | AI |
| 2024-12-07 | **SECURITY FIX**: Removed hardcoded Supabase service keys from scripts | AI |
| 2024-12-07 | **BUG FIX**: Fixed Link to= → href= in components/SportsCarComparison.jsx | AI |
| 2024-12-07 | Migrated from Vite to Next.js 14 | AI |
| 2024-12-07 | Created SOURCE_OF_TRUTH.md | AI |

---

## Audit Summary (Dec 7, 2024)

### Issues Found & Fixed ✅

1. **P0 - Security**: Hardcoded Supabase service role keys in scripts
   - **Fixed**: Now requires environment variables (scripts/migrate-and-seed.js, scripts/run-schema.js)

2. **P1 - Bug**: Link component using React Router syntax (`to=`) instead of Next.js (`href=`)
   - **Fixed**: Updated `components/SportsCarComparison.jsx` line 415

3. **P2 - Cleanup**: Legacy `src/` directory contained Vite-era code
   - **Fixed**: Entire `src/` directory removed, scripts updated to use `data/`

4. **P2 - Imports**: Scripts imported from old `src/data/` path
   - **Fixed**: All scripts now import from `data/`

### Remaining Notes

1. **Dev Environment**: EMFILE errors may occur on external HD volumes
   - Cause: Too many open file descriptors when running from external HD
   - Workaround: Clone project to internal SSD for development

2. **Type Safety**: JSDoc types are comprehensive but TypeScript migration would improve safety
   - Recommendation: Gradual TypeScript adoption starting with `lib/` utilities (optional)

---

*This document should be updated whenever significant changes are made to the codebase.*

