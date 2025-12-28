# AutoRev Feature Catalog

> **Source of Truth for Feature Availability by Tier**
>
> Last Verified: December 15, 2024
>
> Cross-referenced against: `lib/tierAccess.js`, actual code implementations, `DATABASE.md` row counts

---

## Status Legend

| Status | Meaning |
|--------|---------|
| ✅ Complete | Fully implemented with adequate data coverage |
| ⚠️ Partial (X%) | Implemented but limited data coverage |
| 🚧 Under Development | Code exists but incomplete/non-functional |
| ❌ Not Built | Claimed in marketing but no implementation found |

---

## Quick Stats

| Metric | Count | Notes |
|--------|-------|-------|
| Total User-Facing Pages | 24 | Including 10 internal admin |
| Total Public Routes | 14 | User-accessible pages |
| Total Features Defined | 34 | In `lib/tierAccess.js` |
| Features Fully Implemented | 20 | ~59% |
| Features Partial | 8 | Limited data coverage |
| Features Under Development | 2 | Code incomplete |
| Features Not Built | 4 | serviceReminders, collections, exportData, pdfExport |
| Global UI Components | 15 | Available site-wide |
| React Context Providers | 7 | State management |
| API Routes | 50+ | Backend endpoints |

---

## Home Page (`/`)

| Feature | Tier | Status | Component | Notes |
|---------|------|--------|-----------|-------|
| Hero section with CTA | Public | ✅ Complete | HeroSection.jsx | Cycling brand text animation |
| Quick stats bar | Public | ✅ Complete | HeroSection.jsx | Car count, upgrade guides count |
| Three pillars section | Public | ✅ Complete | PillarsSection.jsx | Discovery, Build, Master |
| Car carousel showcase | Public | ✅ Complete | CarCarousel.jsx | Horizontal scroll of featured cars |
| Value props section | Public | ✅ Complete | Static | Brotherhood messaging |
| Join CTA button | Public | ✅ Complete | HeroSection.jsx | Links to /join |

---

## Browse Cars (`/browse-cars`)

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| Car grid with filtering | Free | ✅ Complete | `cars` (98 rows) | 100% coverage |
| Search by name/brand | Free | ✅ Complete | `cars.search_vector` | Full-text search |
| Filter by price range | Free | ✅ Complete | `cars.price_avg` | All 98 cars |
| Filter by drivetrain | Free | ✅ Complete | `cars.drivetrain` | RWD/AWD/FWD |
| Filter by engine layout | Free | ✅ Complete | `cars.category` | Mid/Front/Rear |
| Filter by brand | Free | ✅ Complete | `cars.brand` | All brands |

---

## Car Detail (`/browse-cars/[slug]`)

### Overview Tab

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| Story & heritage | Free | ✅ Complete | `cars.writeup` | 98/98 cars |
| Full specifications | Free | ✅ Complete | `cars` (139 columns) | 100% |
| Pros/cons | Free | ✅ Complete | `cars.pros`, `cars.cons` | All populated |
| 7 enthusiast scores | Free | ✅ Complete | `cars.score_*` | Sound, track, reliability, etc. |
| Hero image | Free | ✅ Complete | `cars.image_hero_url` | All 98 cars |

### Buying Tab

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| Best model years guide | Free | ✅ Complete | `cars.best_model_years` | Editorial content |
| Price by model year | Free | ⚠️ Partial (24%) | `car_market_pricing_years` (23 rows) | Limited year data |
| Safety ratings (NHTSA) | Free | ✅ Complete | `car_safety_data` (98 rows) | 100% |
| Safety ratings (IIHS) | Free | ✅ Complete | `car_safety_data` | 100% |
| Alternatives section | Free | ✅ Complete | `lib/carRecommendations.js` | Algorithm-based |

### Ownership Tab

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| Fuel economy (EPA) | Free | ✅ Complete | `car_fuel_economy` (98 rows) | 100% |
| Known issues | Free | ✅ Complete | `car_issues` (1,211 rows) | All cars covered |
| Recall campaigns | Free | ⚠️ Partial (50%) | `car_recalls` (469 rows) | Not all cars |
| Parts preview (3 items) | Free | ⚠️ Partial (15%) | `parts`, `part_fitments` | Only ~15 cars |
| Lap times preview (2) | Free | ⚠️ Partial (20%) | `car_track_lap_times` (65 rows) | ~20 cars |

### Expert Reviews Tab

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| YouTube video reviews | Free | ✅ Complete | `youtube_videos` (288 rows) | 96/98 cars |
| AI-generated summaries | Free | ✅ Complete | `youtube_videos.summary` | 98% populated |
| Pros/cons extraction | Free | ✅ Complete | `youtube_videos.pros_mentioned` | 96% |
| Channel attribution | Free | ✅ Complete | `youtube_channels` (12 rows) | Trusted sources |

---

## Car Selector (`/car-selector`)

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| 7 priority sliders | Free | ✅ Complete | `lib/scoring.js` | Weighted algorithm |
| Must-have filters | Free | ✅ Complete | Client-side | Price/trans/drivetrain |
| Match results grid | Free | ✅ Complete | `cars` + scoring | Top Match, picks |
| Best Sound/Track/Value picks | Free | ✅ Complete | Score-based | Algorithm complete |

---

## My Garage (`/garage`)

### Favorites (Free)

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| Save cars to garage | Free | ✅ Complete | `user_favorites` | Works for all |
| Add personal notes | Free | ✅ Complete | `user_favorites.notes` | Optional |
| View saved favorites | Free | ✅ Complete | FavoritesProvider | Context-based |

### Owned Vehicles (Enthusiast+)

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| Add owned vehicle | Collector | ✅ Complete | `user_vehicles` (2 rows) | VIN optional |
| VIN decode | Collector | ✅ Complete | NHTSA API + `car_variants` | External API |
| Variant identification | Collector | ✅ Complete | `car_variants` (102 rows) | Year/trim matching |

### Owner's Reference Tab (Enthusiast+)

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| Oil specs | Collector | ✅ Complete | `vehicle_maintenance_specs` (98 rows) | 100% |
| Fluid capacities | Collector | ✅ Complete | `vehicle_maintenance_specs` | 130 columns |
| Tire sizes | Collector | ✅ Complete | `vehicle_maintenance_specs` | All cars |
| Service intervals | Collector | ✅ Complete | `vehicle_service_intervals` (976 rows) | Comprehensive |

### Safety Tab (Enthusiast+)

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| VIN-specific recalls | Collector | ✅ Complete | NHTSA API | `fetchRecallsByVIN()` |
| Open recall status | Collector | ✅ Complete | NHTSA API | Incomplete/complete |
| Safety ratings for VIN | Collector | ✅ Complete | `car_safety_data` | Via matched car |

### Service Log Tab (Enthusiast+)

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| Log service records | Collector | 🚧 Under Development | `user_service_logs` (0 rows) | UI exists, table empty |
| Service categories | Collector | 🚧 Under Development | ServiceLogModal.jsx | Form complete |
| Cost tracking | Collector | 🚧 Under Development | ServiceLogModal.jsx | Form field exists |
| Next service reminder | Collector | ❌ Not Built | — | No notification system |

### Value Tab (Enthusiast+)

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| Current market value | Collector | ⚠️ Partial (10%) | `car_market_pricing` (10/98 cars) | Critical gap |
| BaT auction prices | Collector | ⚠️ Partial (10%) | `car_market_pricing.bat_*` | 10 cars only |
| Cars.com listings | Collector | ⚠️ Partial (10%) | `car_market_pricing.carscom_*` | 10 cars only |
| Hagerty values | Collector | ⚠️ Partial (10%) | `car_market_pricing.hagerty_*` | 10 cars only |
| Price history trends | Collector | ⚠️ Partial (7%) | `car_price_history` (7 rows) | Effectively non-functional |
| Market trend indicator | Collector | ⚠️ Partial (10%) | `car_market_pricing.market_trend` | 10 cars |

### Collections & Export (Enthusiast+)

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| Organize into collections | Collector | ❌ Not Built | — | Feature key exists, no UI |
| Export garage data | Collector | ❌ Not Built | — | Feature key exists, no implementation |

---

## Garage Compare (`/garage/compare`)

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| Side-by-side comparison | Free | ✅ Complete | `cars` | Up to 4 cars (no tier gate in code) |
| Spec comparison table | Free | ✅ Complete | `cars` (139 columns) | Full specs |
| Score comparison | Free | ✅ Complete | `cars.score_*` | 7 scores |
| Compare bar (global) | Free | ✅ Complete | CompareProvider | Available site-wide |

---

## Tuning Shop (`/tuning-shop`)

### Performance Hub

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| Browse upgrade packages | Free | ✅ Complete | `upgrade_packages` (42 rows) | Street/Track/Time Attack |
| View package details | Free | ✅ Complete | `upgrade_packages` | Cost estimates |
| Upgrade tier breakdown | Free | ✅ Complete | `upgrade_keys` (49 rows) | Categories |

### Performance Data (Tuner)

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| Dyno database | Tuner | ⚠️ Partial (30%) | `car_dyno_runs` (29 rows) | ~30 cars |
| Full lap times | Tuner | ⚠️ Partial (20%) | `car_track_lap_times` (65 rows) | ~20 cars |
| Track venue info | Tuner | ✅ Complete | `track_venues` (21 rows) | All lap times linked |

### Parts Catalog (Tuner)

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| Full parts catalog | Tuner | ✅ Complete | `parts` (642 rows) | All parts accessible |
| Car-specific fitments | Tuner | ⚠️ Partial (15%) | `part_fitments` (836 rows) | Only ~15 cars (VAG-biased) |
| Fitment verification | Tuner | ⚠️ Partial (4%) | `part_fitments.verified` | Only 4% verified |
| Part pricing | Tuner | ✅ Complete | `part_pricing_snapshots` (173 rows) | Recent prices |
| Part relationships | Tuner | ✅ Complete | `part_relationships` (38 rows) | Compatibility |

### Build Projects (Tuner)

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| Save build projects | Tuner | ✅ Complete | `user_projects` (4 rows) | SavedBuildsProvider |
| Build cost calculator | Tuner | ✅ Complete | UpgradeCenter.jsx | Estimated ranges |
| HP/torque projections | Tuner | ✅ Complete | `upgrade_packages.hp_gain_*` | From packages |
| Mod compatibility check | Tuner | 🚧 Under Development | `part_relationships` | Limited data |
| PDF export of builds | Tuner | ❌ Not Built | — | Feature key exists, no implementation |

---

## Events (`/community/events`)

### Discovery (Free)

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| Browse events | Free | ✅ Complete | `events` (940 rows) | All event types |
| Event list view | Free | ✅ Complete | EventCard component | Default view |
| Filter by type | Free | ✅ Complete | `event_types` (10 types) | Cars & Coffee, Track Day, etc. |
| Filter by location | Free | ✅ Complete | `events.city`, `events.state` | ZIP/city/state |
| Filter by date | Free | ✅ Complete | `events.start_date` | Date picker |
| Free events toggle | Free | ✅ Complete | `events.is_free` | Boolean filter |

### Event Detail (`/community/events/[slug]`)

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| Full event info | Free | ✅ Complete | `events` (33 columns) | Location, dates, cost |
| Car/brand affinities | Free | ✅ Complete | `event_car_affinities` (22 rows) | Links to cars |
| Google Maps link | Free | ✅ Complete | External link | From lat/lng |
| Related events | Free | ✅ Complete | Same type/region | Algorithm |

### Enhanced Views (Enthusiast+)

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| Map view | Collector | ✅ Complete | EventMap.jsx | Leaflet integration |
| Calendar view | Collector | ✅ Complete | EventCalendarView.jsx | Monthly grid |
| Save/bookmark events | Collector | ✅ Complete | `event_saves` (0 rows) | Working, no saves yet |
| Add to calendar export | Collector | ✅ Complete | AddToCalendarButton.jsx | Google/Apple/ICS |
| Events for my cars filter | Collector | ✅ Complete | EventFilters.jsx | Garage integration |

### Event Submission (`/events/submit`)

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| Submit new event | Free (auth) | ✅ Complete | `event_submissions` (0 rows) | Form exists, no submissions |

### Saved Events (`/events/saved`)

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| View saved events | Collector | ✅ Complete | `event_saves` | PremiumGate protected |
| Remove saved events | Collector | ✅ Complete | API route exists | Unsave functionality |

### Garage Events Integration

| Feature | Tier | Status | Component | Notes |
|---------|------|--------|-----------|-------|
| Events for garage vehicles | Collector | ✅ Complete | GarageEventsSection.jsx | Shows relevant events |
| Events on car detail | Free | ✅ Complete | CarEventsSection.jsx | Events for that car type |

---

## Encyclopedia (`/encyclopedia`)

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| Automotive systems (9) | Free | ✅ Complete | `lib/encyclopediaHierarchy.js` | Engine, Drivetrain, etc. |
| Components (52) | Free | ✅ Complete | Static data | Per-system breakdown |
| Topics (136) | Free | ✅ Complete | Static data | Educational content |
| Modifications (49) | Free | ✅ Complete | `data/upgradeEducation.js` | Mod guides |
| Build guides (6) | Free | ✅ Complete | `lib/educationData.js` | Goal-based paths |

---

## Community Hub (`/community`)

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| Featured events carousel | Free | ✅ Complete | `events` (940 rows) | API: `/api/events/featured` |
| Category grid navigation | Free | ✅ Complete | Static + `event_types` | 5 main categories |
| Location search input | Free | ✅ Complete | LocationAutocomplete.jsx | ZIP/city search |
| "Find Events Near You" CTA | Free | ✅ Complete | Links to `/community/events` | |

---

## Mod Planner / Performance HUB (`/mod-planner`)

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| Car search/selection | Free | ✅ Complete | `cars` (98 rows) | Weighted score ranking |
| Quick access from garage | Free | ✅ Complete | FavoritesProvider, OwnedVehiclesProvider | Shows owned + favorites |
| PerformanceHub component | Free | ✅ Complete | PerformanceHub.jsx | After car selected |
| Upgrade package browser | Free | ✅ Complete | `upgrade_packages` (42 rows) | Street Sport, Track Pack |
| Parts search | Tuner | ⚠️ Partial (15%) | `parts`, `part_fitments` | Limited fitments |
| Build project saving | Tuner | ✅ Complete | `user_projects` | SavedBuildsProvider |
| HP gain calculator | Tuner | ✅ Complete | `upgrade_packages.hp_gain_*` | From package data |
| Cost estimation | Tuner | ✅ Complete | `upgrade_packages`, `part_pricing_snapshots` | Range estimates |
| URL state persistence | Free | ✅ Complete | useSearchParams | `?car=slug&build=id` |

---

## Tuning Shop (`/tuning-shop`)

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| Three-step workflow tabs | Free | ✅ Complete | Static | Select Car → Upgrade → Projects |
| Car selection grid | Free | ✅ Complete | `cars` | With search/filter |
| Owned vehicles section | Free | ✅ Complete | OwnedVehiclesProvider | From garage |
| Favorites section | Free | ✅ Complete | FavoritesProvider | From garage |
| UpgradeCenter component | Free | ✅ Complete | UpgradeCenter.jsx | Full build planner |
| Upgrade aggregator | Free | ✅ Complete | UpgradeAggregator.jsx | Category breakdown |
| Upgrade detail modal | Free | ✅ Complete | UpgradeDetailModal.jsx | Full mod details |
| BuildsWorkshop tab | Tuner | ✅ Complete | BuildsWorkshop.jsx | Saved projects management |
| Project comparison | Tuner | ✅ Complete | BuildsWorkshop.jsx | Side-by-side builds |
| Onboarding popup | Free | ✅ Complete | OnboardingPopup.jsx | First-time user guide |

---

## Contact Page (`/contact`)

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| Contact form | Public | ✅ Complete | `/api/contact` | Email + lead capture |
| Interest selection | Public | ✅ Complete | Static categories | Car Selector, Performance, etc. |
| Lead capture to database | Public | ✅ Complete | `leads` table | Via `lib/leadsClient.js` |
| Email notification | Public | ✅ Complete | Resend API | To team email |
| FAQ section | Public | ✅ Complete | Static | Common questions |
| Success confirmation | Public | ✅ Complete | Static | Post-submission |

---

## Join / Membership (`/join`)

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| Tier cards (Free/Collector/Tuner) | Public | ✅ Complete | `lib/tierAccess.js` | With pricing |
| Feature comparison table | Public | ✅ Complete | Static | 6 categories |
| Signup CTAs | Public | ✅ Complete | AuthModal | Sign up buttons |
| Testimonials | Public | ✅ Complete | Static | User quotes |
| Beta banner | Public | ✅ Complete | Static | "Free during beta" |
| Animated brand text | Public | ✅ Complete | Static | Revival/Revelation/Revolution |

---

## Profile (`/profile`)

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| Account info display | Auth | ✅ Complete | `user_profiles` | Name, email, avatar |
| Subscription tier display | Auth | ✅ Complete | `user_profiles.subscription_tier` | Current tier |
| Tier upgrade CTAs | Auth | ✅ Complete | Static | Per-tier benefits |
| AL credits display | Auth | ✅ Complete | `al_user_credits` | Balance/usage |

---

## Static Pages

### Privacy Policy (`/privacy`)

| Feature | Tier | Status | Notes |
|---------|------|--------|-------|
| Privacy policy content | Public | ✅ Complete | Static legal text |

### Terms of Service (`/terms`)

| Feature | Tier | Status | Notes |
|---------|------|--------|-------|
| Terms content | Public | ✅ Complete | Static legal text |

### Auth Error (`/auth/error`)

| Feature | Tier | Status | Notes |
|---------|------|--------|-------|
| Error message display | Public | ✅ Complete | Auth error handling |

### 404 Not Found

| Feature | Tier | Status | Notes |
|---------|------|--------|-------|
| Custom 404 page | Public | ✅ Complete | `not-found.jsx` |

---

## AL — AI Assistant (All Pages)

### Basic (Free)

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| ~25 chats/month | Free | ✅ Complete | `al_user_credits` | $0.25 budget |
| `search_cars` tool | Free | ✅ Complete | `cars` | Filtered search |
| `get_car_details` tool | Free | ✅ Complete | `cars` + enrichment | Full specs |
| `get_car_ai_context` tool | Free | ✅ Complete | RPC function | Optimized context |
| `search_events` tool | Free | ✅ Complete | `events` | Location-based |

### Collector Tools

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| ~75 chats/month | Collector | ✅ Complete | `al_user_credits` | $1.00 budget |
| `get_expert_reviews` | Collector | ✅ Complete | `youtube_videos` | AI summaries |
| `get_known_issues` | Collector | ✅ Complete | `car_issues`, `vehicle_known_issues` | 1,300+ issues |
| `compare_cars` | Collector | ✅ Complete | `cars` | Up to 4 |
| `search_encyclopedia` | Collector | ✅ Complete | Static data | All content |
| `get_upgrade_info` | Collector | ✅ Complete | `upgrade_keys`, `data/upgradeEducation.js` | Mod details |
| `search_parts` | Collector | ⚠️ Partial (15%) | `parts`, `part_fitments` | Limited fitments |
| `get_maintenance_schedule` | Collector | ✅ Complete | `vehicle_maintenance_specs`, `vehicle_service_intervals` | 100% |
| `search_knowledge` | Collector | ✅ Complete | `document_chunks` (547 rows) | Vector search |
| `get_track_lap_times` | Collector | ⚠️ Partial (20%) | `car_track_lap_times` | 65 records |
| `get_dyno_runs` | Collector | ⚠️ Partial (30%) | `car_dyno_runs` | 29 runs |
| `search_community_insights` | Collector | ✅ Complete | `community_insights` (1,226 rows) | Forum wisdom |
| `search_forums` | Collector | 🚧 Under Development | — | Stub only |

### Tuner Tools

| Feature | Tier | Status | Data Source | Notes |
|---------|------|--------|-------------|-------|
| ~150 chats/month | Tuner | ✅ Complete | `al_user_credits` | $2.50 budget |
| `recommend_build` | Tuner | ✅ Complete | `upgrade_packages`, `parts` | Goal-based builds |

---

## Data Coverage Summary

| Data Type | Coverage | Current | Target | Impact |
|-----------|----------|---------|--------|--------|
| **Core Specs** | ✅ 100% | 98/98 | 98 | None |
| **Fuel Economy** | ✅ 100% | 98/98 | 98 | None |
| **Safety Ratings** | ✅ 100% | 98/98 | 98 | None |
| **Maintenance Specs** | ✅ 100% | 98/98 | 98 | None |
| **Service Intervals** | ✅ 100% | 976 records | — | None |
| **Known Issues** | ✅ 100% | 1,211 records | — | None |
| **YouTube Reviews** | ✅ ~60% | 288 videos (96/98 cars) | — | Minor |
| **Community Insights** | ✅ Active | 1,226 insights | — | None |
| **Events** | ✅ Active | 940 events | — | None |
| **Recall Campaigns** | ⚠️ ~50% | 469 records | All cars | P2 |
| **Market Pricing** | ⚠️ **10%** | 10/98 cars | 98/98 | **P1 Critical** |
| **Price History** | ⚠️ **7%** | 7 rows | Time series | **P1 Critical** |
| **Part Fitments** | ⚠️ **~15%** | 836 fitments (~15 cars) | All cars | **P1 Critical** |
| **Dyno Runs** | ⚠️ ~30% | 29 runs | 200+ | P2 |
| **Lap Times** | ⚠️ ~20% | 65 records | 300+ | P2 |

---

## Feature Discrepancies: /join Page vs Reality

### ❌ Inaccurate Claims (Require Update)

| Claim on /join | Reality | Recommended Action |
|----------------|---------|-------------------|
| "Bring a Trailer recent sales" | Only 10/98 cars have BaT data | Change to "Bring a Trailer sales (when available)" |
| "Cars.com current listings data" | Only 10/98 cars | Change to "Cars.com data (expanding coverage)" |
| "Hagerty insurance values" | Only 10/98 cars | Change to "Hagerty values (when available)" |
| "Price history trends over time" | 7 total rows — non-functional | Remove or mark "Coming Soon" |
| "Full parts catalog with fitments" | 836 fitments but only ~15 cars covered | Change to "Parts catalog (15+ cars, expanding)" |
| "PDF export of build plans" | Not implemented | Remove or mark "Coming Soon" |
| "Export your garage data" | Not implemented | Remove or mark "Coming Soon" |
| "Service reminders" | No notification system | Remove or mark "Coming Soon" |
| "Organize cars into collections" | Not implemented | Remove or mark "Coming Soon" |

### ✅ Accurate Claims

| Claim | Verification |
|-------|--------------|
| "Full sports car database (98+ cars)" | ✅ `cars` has 98 rows |
| "Car Selector with personalized matching" | ✅ Fully functional |
| "Detailed specs, history & heritage" | ✅ 139 columns per car |
| "Curated expert video reviews" | ✅ 288 videos, 96/98 cars |
| "EPA fuel economy data" | ✅ 100% coverage |
| "NHTSA & IIHS safety ratings" | ✅ 100% coverage |
| "VIN decode → exact variant" | ✅ NHTSA API + `car_variants` |
| "Owner's Reference (oil specs, capacities)" | ✅ 130 columns, 100% |
| "VIN-specific active recall alerts" | ✅ `fetchRecallsByVIN()` works |
| "Track lap times preview (2 samples)" | ✅ TEASER_LIMITS.lapTimes = 2 |
| "Popular parts preview (3 items)" | ✅ TEASER_LIMITS.popularParts = 3 |
| "Save and organize build projects" | ✅ `user_projects` + SavedBuildsProvider |
| "Dyno database (real HP/torque)" | ⚠️ Partial — 29 runs, ~30% coverage |
| "Full lap times library" | ⚠️ Partial — 65 records, ~20% coverage |

---

## Recommended /join Page Updates

### Market Value & Tracking Section

**Current:**
```
- Bring a Trailer recent sales
- Cars.com current listings data
- Hagerty insurance values
- Price history trends over time
- VIN-specific active recall alerts
```

**Recommended:**
```
- Market value data (BaT, Cars.com, Hagerty — expanding coverage)
- VIN-specific active recall alerts
- Price trend monitoring (when available)
```

### My Garage Section

**Current:**
```
- Service reminders
- Export your garage data
```

**Recommended:**
```
- Service log tracking ✓
- Export your garage data (Coming Soon)
```

Remove "Service reminders" until notification system is built.

### Performance Data Section

**Current:**
```
- Full parts catalog with fitments
- Part compatibility verification
```

**Recommended:**
```
- Full parts catalog (642 parts)
- Car-specific fitments (15+ vehicles, expanding)
```

### Tuning Shop Section

**Current:**
```
- PDF export of build plans
```

**Recommended:**
Remove until implemented, or mark as "Coming Soon"

---

## Implementation Priority Matrix

### P0 — Fix /join Page Accuracy
- [ ] Update market value claims to reflect 10% coverage
- [ ] Remove or flag "Collections" as coming soon
- [ ] Remove or flag "Export garage data" as coming soon
- [ ] Remove or flag "PDF export" as coming soon
- [ ] Remove "Service reminders" or flag as coming soon

### P1 — Critical Data Gaps (Feature-Blocking)
- [ ] Expand `car_market_pricing` from 10 → 98 cars
- [ ] Expand `part_fitments` beyond VAG vehicles
- [ ] Build `car_price_history` time series

### P2 — Important Feature Completion
- [ ] Implement garage data export
- [ ] Implement PDF export for builds
- [ ] Implement collections feature
- [ ] Build service reminder notifications
- [ ] Expand dyno data coverage
- [ ] Expand lap times coverage

### P3 — Nice to Have
- [ ] Implement `search_forums` AL tool fully
- [ ] Add more auction results data
- [ ] Track layout variants

---

## Tier Feature Summary

### Free Tier (12 features)
| Feature Key | Status |
|-------------|--------|
| `carSelector` | ✅ Complete |
| `carDetailPages` | ✅ Complete |
| `basicGarage` | ✅ Complete |
| `favorites` | ✅ Complete |
| `partsTeaser` | ⚠️ Partial (15% car coverage) |
| `lapTimesTeaser` | ⚠️ Partial (20% car coverage) |
| `fuelEconomy` | ✅ Complete |
| `safetyRatings` | ✅ Complete |
| `priceByYear` | ⚠️ Partial (24% year data) |
| `alBasic` | ✅ Complete |
| `eventsBrowse` | ✅ Complete |
| `eventsSubmit` | ✅ Complete |

### Enthusiast Tier (12 features)
| Feature Key | Status |
|-------------|--------|
| `vinDecode` | ✅ Complete |
| `ownerReference` | ✅ Complete |
| `serviceLog` | 🚧 Under Development |
| `serviceReminders` | ❌ Not Built |
| `recallAlerts` | ✅ Complete |
| `safetyData` | ✅ Complete |
| `marketValue` | ⚠️ Partial (10%) |
| `priceHistory` | ⚠️ Partial (7 rows) |
| `fullCompare` | ⚠️ Defined but NOT gated — works for everyone |
| `collections` | ❌ Not Built |
| `exportData` | ❌ Not Built |
| `alCollector` | ✅ Complete |

### Tuner Tier (10 features)
| Feature Key | Status |
|-------------|--------|
| `dynoDatabase` | ⚠️ Partial (30%) |
| `fullLapTimes` | ⚠️ Partial (20%) |
| `fullPartsCatalog` | ⚠️ Partial (15% fitments) |
| `buildProjects` | ✅ Complete |
| `buildAnalytics` | ✅ Complete |
| `partsCompatibility` | 🚧 Under Development |
| `modImpactAnalysis` | ✅ Complete |
| `pdfExport` | ❌ Not Built |
| `earlyAccess` | ✅ Complete |
| `alTuner` | ✅ Complete |

---

## Notes

1. **IS_BETA = true** — All features currently accessible to authenticated users regardless of tier
2. **PremiumGate** component properly wraps tier-gated features
3. **TEASER_LIMITS** correctly configured:
   - `popularParts: 3`
   - `lapTimes: 2`
   - `dynoRuns: 0`
   - `compareCars: 2`
   - `savedProjects: 0`

---

## Global UI Features (Site-Wide)

These components appear across all pages and provide consistent functionality.

### Navigation & Layout

| Feature | Component | Tier | Status | Notes |
|---------|-----------|------|--------|-------|
| Global header | Header.jsx | Public | ✅ Complete | Logo, nav links, auth buttons |
| Global footer | Footer.jsx | Public | ✅ Complete | Links, social, copyright |
| Mobile bottom CTA | MobileBottomCta.jsx | Public | ✅ Complete | Sticky mobile action bar |
| Scroll to top | ScrollToTop.jsx | Public | ✅ Complete | Floating button |
| Scroll indicator | ScrollIndicator.jsx | Public | ✅ Complete | Progress indicator |

### Car Selection & Comparison

| Feature | Component | Tier | Status | Notes |
|---------|-----------|------|--------|-------|
| Selected car floating widget | SelectedCarFloatingWidget.jsx | Free | ✅ Complete | Quick actions for selected car |
| Selected car banner | SelectedCarBanner.jsx | Free | ✅ Complete | Persistent car context |
| Compare bar | CompareBar.jsx | Free | ✅ Complete | Floating compare tray (up to 4 cars) |
| Compare modal | CompareModal.jsx | Collector | ✅ Complete | Full comparison view |
| Car action menu | CarActionMenu.jsx | Free | ✅ Complete | Add to favorites/compare/garage |

### Authentication & User

| Feature | Component | Tier | Status | Notes |
|---------|-----------|------|--------|-------|
| Auth modal | AuthModal.jsx | Public | ✅ Complete | Sign in/sign up modal |
| Premium gate | PremiumGate.jsx | All | ✅ Complete | Tier-based feature gating |
| Onboarding popup | OnboardingPopup.jsx | Auth | ✅ Complete | First-time user tutorials |

### AI Assistant

| Feature | Component | Tier | Status | Notes |
|---------|-----------|------|--------|-------|
| AL chat button | AIMechanicChat.jsx | Free | ✅ Complete | Floating chat trigger |
| AL chat panel | AIMechanicChat.jsx | Free | ✅ Complete | Full conversation UI |
| AL tool execution | `lib/alTools.js` | Varies | ✅ Complete | 17 tools by tier |

### Feedback & Support

| Feature | Component | Tier | Status | Notes |
|---------|-----------|------|--------|-------|
| Feedback widget | FeedbackWidget.jsx | Public | ✅ Complete | Bug/feature/praise submission |
| Feedback corner | FeedbackCorner.jsx | Public | ✅ Complete | Persistent feedback button |
| Feedback context | FeedbackProvider | Public | ✅ Complete | Programmatic control |

### Utilities

| Feature | Component | Tier | Status | Notes |
|---------|-----------|------|--------|-------|
| Loading spinner | LoadingSpinner.jsx | N/A | ✅ Complete | Consistent loading UI |
| Button component | Button.jsx | N/A | ✅ Complete | Styled button variants |
| Car image | CarImage.jsx | N/A | ✅ Complete | Optimized car images |
| Location autocomplete | LocationAutocomplete.jsx | N/A | ✅ Complete | ZIP/city search input |

---

## Internal / Admin Pages (`/internal/*`)

These pages are for admin/team use only and require admin authentication.

| Page | Route | Purpose | Status |
|------|-------|---------|--------|
| Admin Dashboard | `/internal` | Overview stats | ✅ Complete |
| Parts Review | `/internal/parts-review` | Review parts catalog | ✅ Complete |
| Variant Maintenance | `/internal/variant-maintenance` | Manage variant overrides | ✅ Complete |
| Dyno Management | `/internal/dyno` | Add/edit dyno runs | ✅ Complete |
| Lap Times | `/internal/lap-times` | Add/edit track times | ✅ Complete |
| Knowledge Ingestion | `/internal/knowledge` | Ingest documents | ✅ Complete |
| Manual Entry | `/internal/manual-entry` | Manual data entry | ✅ Complete |
| Feedback Review | `/internal/feedback` | Review user feedback | ✅ Complete |
| QA Reports | `/internal/qa` | Quality assurance | ✅ Complete |
| Event Moderation | `/internal/events` | Moderate submitted events | ✅ Complete |

---

## Context Providers (React)

These providers manage global state across the application.

| Provider | File | Purpose | Tier |
|----------|------|---------|------|
| AuthProvider | `providers/AuthProvider.jsx` | User auth state | All |
| FavoritesProvider | `providers/FavoritesProvider.jsx` | Garage favorites | Free |
| OwnedVehiclesProvider | `providers/OwnedVehiclesProvider.jsx` | Owned vehicles | Collector |
| CompareProvider | `providers/CompareProvider.jsx` | Compare list state | Free |
| CarSelectionProvider | `providers/CarSelectionProvider.jsx` | Selected car context | Free |
| SavedBuildsProvider | `providers/SavedBuildsProvider.jsx` | Build projects | Tuner |
| FeedbackProvider | `FeedbackWidget.jsx` | Feedback modal state | All |

---

## API Routes Summary

| Category | Routes | Status |
|----------|--------|--------|
| Cars | 17 routes | ✅ Complete |
| Events | 5 routes | ✅ Complete |
| Parts | 3 routes | ✅ Complete |
| Users | 4 routes | ✅ Complete |
| VIN | 3 routes | ✅ Complete |
| AI/AL | 1 route | ✅ Complete |
| Contact/Feedback | 2 routes | ✅ Complete |
| Cron Jobs | 7 routes | ✅ Complete |
| Internal | 8 routes | ✅ Complete |
| **Total** | **50+ routes** | |

---

## /join Page Feature Breakdown (User-Facing)

This section documents exactly what is displayed on the `/join` page feature table. Keep this in sync with `app/join/page.jsx`.

### Browse Cars & Find Your Match

| Feature | Free | Collector | Tuner |
|---------|:----:|:---------:|:-----:|
| Full 98-car sports car database | ✓ | ✓ | ✓ |
| Car Selector quiz with personalized matches | ✓ | ✓ | ✓ |
| Specs, known issues & buying guides | ✓ | ✓ | ✓ |
| Expert video reviews & safety ratings | ✓ | ✓ | ✓ |
| Side-by-side comparison (up to 4 cars) | ✓ | ✓ | ✓ |

### My Garage

| Feature | Free | Collector | Tuner |
|---------|:----:|:---------:|:-----:|
| Save favorite cars | ✓ | ✓ | ✓ |
| Save cars you own | ✓ | ✓ | ✓ |

#### My Garage Intelligence (Enthusiast+)

| Feature | Free | Collector | Tuner |
|---------|:----:|:---------:|:-----:|
| VIN Decode — identify your exact variant | — | ✓ | ✓ |
| Owner's Reference — oil specs, capacities, fluids | — | ✓ | ✓ |
| Maintenance schedules & service intervals | — | ✓ | ✓ |
| Service log — track your maintenance history | — | ✓ | ✓ |
| Recall alerts — active recalls for your VIN | — | ✓ | ✓ |
| Price guides & market position | — | ✓ | ✓ |

### Tuning Shop

| Feature | Free | Collector | Tuner |
|---------|:----:|:---------:|:-----:|
| Browse upgrade packages & mod tiers | ✓ | ✓ | ✓ |
| Performance projections (HP/torque gains) | ✓ | ✓ | ✓ |
| Popular parts preview | ✓ | ✓ | ✓ |
| Full parts catalog with car-specific fitments | — | — | ✓ |
| Save & organize build projects | — | — | ✓ |
| Build cost calculator | — | — | ✓ |

### Community

| Feature | Free | Collector | Tuner |
|---------|:----:|:---------:|:-----:|
| Browse & submit car events | ✓ | ✓ | ✓ |
| Map & calendar views | — | ✓ | ✓ |
| Save events & export to calendar | — | ✓ | ✓ |

### Encyclopedia

| Feature | Free | Collector | Tuner |
|---------|:----:|:---------:|:-----:|
| Automotive systems education | ✓ | ✓ | ✓ |
| Modification guides & explanations | ✓ | ✓ | ✓ |
| Build paths & learning guides | ✓ | ✓ | ✓ |

### AL — AI Mechanic

| Feature | Free | Collector | Tuner |
|---------|:----:|:---------:|:-----:|
| Monthly conversations | ~25 | ~75 | ~150 |
| Car search & basic questions | ✓ | ✓ | ✓ |
| Reviews, reliability & maintenance lookup | — | ✓ | ✓ |
| Build recommendations & parts search | — | — | ✓ |

---

### Tier Card Summaries

**Free** — Research any sports car
- Full 98-car database
- Specs, reviews & buying guides
- Side-by-side comparison
- AL: ~25/mo, Car search & basic questions

**Enthusiast** — Own & maintain your car
- Garage Intelligence system
- VIN decode, specs & service logs
- Maintenance schedules & recalls
- AL: ~75/mo, Reviews, reliability & maintenance

**Tuner** — Build & modify your car
- Full parts catalog & fitments
- Save build projects
- Build cost calculator
- AL: ~150/mo, Build advice & parts search

---

*This catalog supersedes marketing claims in FEATURES.md and should be used as the source of truth for the /join page.*

