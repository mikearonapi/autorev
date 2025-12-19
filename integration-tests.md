# AutoRev Integration Test Scenarios

> End-to-end test plan covering complete user journeys from frontend to database
>
> **Created:** December 18, 2024
> **Source Docs:** PAGES.md, API.md, ARCHITECTURE.md, DATABASE.md

---

## Overview

| Journey | User Tier | Critical APIs | Tables Touched |
|---------|-----------|---------------|----------------|
| Car Shopper | Free | `/api/cars`, `/api/cars/[slug]/*`, `/api/ai-mechanic` | `cars`, `user_favorites`, `al_conversations` |
| New Owner | Collector | `/api/vin/decode`, `/api/cars/[slug]/maintenance`, `/api/cars/[slug]/market-value` | `user_vehicles`, `car_variants`, `vehicle_maintenance_specs` |
| Enthusiast | Tuner | `/api/cars/[slug]/dyno`, `/api/cars/[slug]/lap-times`, `/api/parts/search` | `car_dyno_runs`, `car_track_lap_times`, `parts`, `user_projects` |
| Event Discovery | Free/Collector | `/api/events`, `/api/events/[slug]`, `/api/events/submit` | `events`, `event_types`, `event_saves`, `event_submissions` |
| AL Assistant | Free+ | `/api/ai-mechanic` | `al_conversations`, `al_messages`, `al_usage_logs`, `al_user_credits` |

---

## Journey 1: Car Shopper (Free Tier)

### Preconditions
- Anonymous user (not logged in) OR authenticated Free tier user
- `cars` table has ≥10 rows with valid scores
- `car_fuel_economy` has matching records for test cars
- `car_safety_data` has matching records for test cars

### Steps

| Step | Action | API Call | Expected Response | Assertion |
|------|--------|----------|-------------------|-----------|
| 1 | Load home page `/` | None (SSR) | Page renders | Hero section visible, car count displayed |
| 2 | Click "Find Your Car" CTA | None | Navigate to `/car-selector` | URL is `/car-selector`, priority sliders visible |
| 3 | Set Sound priority slider to 5 | None (client state) | UI updates | Slider value shows 5 |
| 4 | Set Track Capability to 4 | None (client state) | UI updates | Slider value shows 4 |
| 5 | Click "Find Matches" | `GET /api/cars` | `{ cars: [...] }` | Response has `cars` array, length > 0 |
| 6 | Verify results are scored | None | Results ranked by match % | Top result has highest weighted score |
| 7 | Click on top result car card | None | Navigate to `/browse-cars/[slug]` | Car detail page loads |
| 8 | View Overview tab | `GET /api/cars/[slug]/efficiency`<br>`GET /api/cars/[slug]/safety-ratings` | Efficiency + safety data | MPG values displayed, safety grade shown |
| 9 | Switch to Buying tab | `GET /api/cars/[slug]/price-by-year`<br>`GET /api/cars/[slug]/recalls` | Price history + recalls | Best value year shown, recall count displayed |
| 10 | Switch to Ownership tab | `GET /api/cars/[slug]/maintenance` | Maintenance specs | Oil type/viscosity displayed |
| 11 | Switch to Expert Reviews tab | `GET /api/cars/[slug]/expert-reviews` | YouTube videos array | Video cards rendered (or empty state) |
| 12 | Click "Save to Garage" (heart icon) | Supabase INSERT `user_favorites` | `{ success: true }` | Heart icon filled, toast confirmation |
| 13 | Navigate to `/garage` | None | Garage page loads | Saved car appears in Favorites tab |
| 14 | Open AL chat bubble | None | Chat modal opens | AL greeting displayed |
| 15 | Ask "What are common issues with this car?" | `POST /api/ai-mechanic` | `{ response, conversationId, usage }` | Response mentions known issues, usage tracked |

### Critical Path APIs
```
GET  /api/cars
GET  /api/cars/[slug]/efficiency
GET  /api/cars/[slug]/safety-ratings
GET  /api/cars/[slug]/price-by-year
GET  /api/cars/[slug]/recalls
GET  /api/cars/[slug]/maintenance
GET  /api/cars/[slug]/expert-reviews
POST /api/ai-mechanic
```

### Database Assertions
| Table | Assertion |
|-------|-----------|
| `user_favorites` | New row with `car_slug` matching saved car |
| `al_conversations` | New conversation created for user |
| `al_messages` | ≥2 messages (user + assistant) |
| `al_usage_logs` | Usage logged with token counts |

---

## Journey 2: New Owner (Collector Tier)

### Preconditions
- Authenticated user with `subscription_tier = 'collector'`
- `car_variants` has variant for test VIN
- `vehicle_maintenance_specs` has specs for test car
- `car_market_pricing` has pricing for test car (⚠️ only 10 cars have this)

### Steps

| Step | Action | API Call | Expected Response | Assertion |
|------|--------|----------|-------------------|-----------|
| 1 | Login as Collector user | Supabase Auth | Session established | User context shows 'collector' tier |
| 2 | Navigate to `/garage` | None | Garage page loads | "My Vehicles" section visible |
| 3 | Click "Add Vehicle" button | None | AddVehicleModal opens | VIN input field visible |
| 4 | Enter valid VIN `WP0AB29986S731234` | None | VIN field populated | 17-character VIN accepted |
| 5 | Click "Decode VIN" | `POST /api/vin/decode` | `{ car_slug, variant }` | Car identified, variant details shown |
| 6 | Confirm vehicle addition | Supabase INSERT `user_vehicles` | `{ success: true }` | Modal closes, vehicle in list |
| 7 | Click on added vehicle | None | Vehicle detail view | Tabs: Overview, Reference, Service, Value |
| 8 | View Reference tab | `GET /api/cars/[slug]/maintenance` | `{ maintenance, serviceIntervals, knownIssues }` | Oil specs displayed (type, viscosity, capacity) |
| 9 | View Value tab | `GET /api/cars/[slug]/market-value` | `{ marketValue }` | Average price, trend direction shown |
| 10 | View price by year data | `GET /api/cars/[slug]/price-by-year` | `{ pricesByYear, bestValueYear }` | Year-by-year pricing chart |

### Critical Path APIs
```
POST /api/vin/decode
GET  /api/cars/[slug]/maintenance
GET  /api/cars/[slug]/market-value
GET  /api/cars/[slug]/price-by-year
```

### Database Assertions
| Table | Assertion |
|-------|-----------|
| `user_vehicles` | New row with `vin`, `matched_car_slug`, `matched_car_variant_id` |
| `car_variants` | Queried for VIN resolution |
| `vehicle_maintenance_specs` | Oil/fluid specs returned for `car_slug` |
| `car_market_pricing` | Market value returned (if available) |

### Tier Gating Assertions
| Feature | Expected Behavior for Free User |
|---------|--------------------------------|
| Add Vehicle with VIN | PremiumGate blocks, shows upgrade prompt |
| Market Value tab | PremiumGate blocks, teaser content shown |
| Price History chart | Blurred/locked with Collector CTA |

---

## Journey 3: Enthusiast (Tuner Tier)

### Preconditions
- Authenticated user with `subscription_tier = 'tuner'`
- `car_dyno_runs` has data for test car
- `car_track_lap_times` has data for test car
- `parts` table has ≥10 parts with fitments for test car
- `part_fitments` has fitments linking parts to test car

### Steps

| Step | Action | API Call | Expected Response | Assertion |
|------|--------|----------|-------------------|-----------|
| 1 | Login as Tuner user | Supabase Auth | Session established | User context shows 'tuner' tier |
| 2 | Navigate to `/tuning-shop` | None | Tuning Shop loads | PerformanceHub, UpgradeCenter visible |
| 3 | Select a car from dropdown | None | Car context set | Selected car displayed |
| 4 | View Dyno Data section | `GET /api/cars/[slug]/dyno` | `{ dynoRuns: [...] }` | Dyno runs table populated |
| 5 | Verify dyno data fields | None | Data displayed | `peak_whp`, `peak_wtq`, `dyno_type`, `run_kind` shown |
| 6 | View Lap Times section | `GET /api/cars/[slug]/lap-times` | `{ lapTimes: [...] }` | Lap times table populated |
| 7 | Verify lap time fields | None | Data displayed | `track_name`, `lap_time_text`, `is_stock`, `tires` shown |
| 8 | Open Parts Catalog | None | Parts search UI | Search input, category filters visible |
| 9 | Search "intake" | `GET /api/parts/search?q=intake&car_slug=[slug]` | `{ parts: [...] }` | Parts matching search + fitment |
| 10 | Filter by category "exhaust" | `GET /api/parts/search?category=exhaust&car_slug=[slug]` | `{ parts: [...] }` | Only exhaust parts returned |
| 11 | Click "Create Build Project" | None | Build modal opens | Project name input, car pre-selected |
| 12 | Name project "Stage 1" | None | Name entered | Input validated |
| 13 | Add intake part to build | None | Part added | Part in build list, cost updated |
| 14 | Add exhaust part to build | None | Part added | Total cost calculated |
| 15 | Check part relationships | `POST /api/parts/relationships` | `{ edges: [...] }` | Compatible/conflicting parts shown |
| 16 | Save build project | Supabase INSERT `user_projects` | `{ success: true }` | Project saved, confirmation shown |

### Critical Path APIs
```
GET  /api/cars/[slug]/dyno
GET  /api/cars/[slug]/lap-times
GET  /api/parts/search
GET  /api/parts/popular
POST /api/parts/relationships
```

### Database Assertions
| Table | Assertion |
|-------|-----------|
| `car_dyno_runs` | Returns rows where `car_slug` matches |
| `car_track_lap_times` | Returns rows where `car_slug` matches |
| `parts` | Search returns matching parts |
| `part_fitments` | Filters parts by `car_id` fitment |
| `user_projects` | New row with `project_name`, `car_slug`, `selected_upgrades` |

### Tier Gating Assertions
| Feature | Expected Behavior for Collector User |
|---------|-------------------------------------|
| Full Dyno Data | PremiumGate blocks, shows sample + upgrade CTA |
| Full Lap Times | PremiumGate blocks, limited preview |
| Save Build Project | PremiumGate blocks, Tuner upgrade prompt |

---

## Journey 4: Event Discovery

### Preconditions
- `event_types` has ≥5 event types (cars-and-coffee, track-day, etc.)
- `events` table has ≥10 approved events with future `start_date`
- Events have `status = 'approved'`
- For save/submit tests: authenticated Collector+ user

### Steps

| Step | Action | API Call | Expected Response | Assertion |
|------|--------|----------|-------------------|-----------|
| 1 | Navigate to `/community/events` | `GET /api/events` | `{ events: [...], total }` | Event cards displayed |
| 2 | Verify default sort | None | Events ordered | Sorted by `featured DESC, start_date ASC` |
| 3 | Get event types for filters | `GET /api/events/types` | `{ types: [...] }` | Filter pills rendered |
| 4 | Filter by "Cars & Coffee" | `GET /api/events?type=cars-and-coffee` | `{ events: [...] }` | Only cars-and-coffee events |
| 5 | Filter by state "CA" | `GET /api/events?state=CA` | `{ events: [...] }` | Only California events |
| 6 | Filter by Track Events | `GET /api/events?is_track_event=true` | `{ events: [...] }` | Only `is_track_event` types |
| 7 | Filter by Free Events | `GET /api/events?is_free=true` | `{ events: [...] }` | All have `is_free: true` |
| 8 | Click on event card | None | Navigate to `/community/events/[slug]` | Event detail page loads |
| 9 | Load event detail | `GET /api/events/[slug]` | `{ event: {...} }` | Full event data displayed |
| 10 | Verify event fields | None | Data rendered | name, date, time, venue, city, state, description |
| 11 | Click "Save Event" (Collector+) | `POST /api/events/[slug]/save` | `{ saved: true }` | Save button toggles, confirmation |
| 12 | Navigate to `/events/saved` | `GET /api/users/[userId]/saved-events` | `{ savedEvents: [...] }` | Saved event appears in list |
| 13 | Unsave event | `DELETE /api/events/[slug]/save` | `{ saved: false }` | Event removed from saved list |
| 14 | Navigate to `/events/submit` | None | Submission form loads | Form fields visible |
| 15 | Fill submission form | None | Form populated | Name, type, URL, dates, location filled |
| 16 | Submit event | `POST /api/events/submit` | `{ success: true, submissionId }` | Confirmation message, pending review |

### Critical Path APIs
```
GET    /api/events
GET    /api/events/types
GET    /api/events/[slug]
POST   /api/events/[slug]/save
DELETE /api/events/[slug]/save
GET    /api/users/[userId]/saved-events
POST   /api/events/submit
```

### Database Assertions
| Table | Assertion |
|-------|-----------|
| `events` | Query returns `status = 'approved'` AND `start_date >= today` |
| `event_types` | All types returned with `slug`, `name`, `icon`, `is_track_event` |
| `event_saves` | Row created with `user_id`, `event_id` on save |
| `event_saves` | Row deleted on unsave |
| `event_submissions` | New row with `status = 'pending'`, `user_id` |

### Tier Gating Assertions
| Feature | Expected Behavior for Free User |
|---------|--------------------------------|
| Save Event | 401/403 error, upgrade prompt |
| Map View | PremiumGate, Collector CTA |
| Calendar View | PremiumGate, Collector CTA |
| "Events for My Cars" filter | Disabled, Collector CTA |

---

## Journey 5: AL Assistant

### Preconditions
- Authenticated user (any tier)
- `al_user_credits` has positive balance for user
- `cars` table populated for search queries
- `car_issues` / `vehicle_known_issues` populated for issue queries
- `document_chunks` has embeddings for knowledge search
- `community_insights` has insights (⚠️ Porsche-only currently)

### Steps

| Step | Action | API Call | Expected Response | Assertion |
|------|--------|----------|-------------------|-----------|
| 1 | Open AL chat from any page | None | Chat modal opens | AL greeting, input field visible |
| 2 | Ask "What is a good sports car under $50k?" | `POST /api/ai-mechanic` | `{ response, conversationId, usage }` | Response lists cars, tool_calls includes `search_cars` |
| 3 | Verify search_cars tool usage | None | Response references car data | Car names/specs from database mentioned |
| 4 | Ask "Tell me about the 718 Cayman GT4" | `POST /api/ai-mechanic` | `{ response }` | Response with car context |
| 5 | Verify get_car_ai_context tool | None | Detailed car info | Specs, scores, pros/cons returned |
| 6 | Ask "What are common issues with it?" | `POST /api/ai-mechanic` | `{ response }` | Known issues listed |
| 7 | Verify get_known_issues tool | None | Issue data | Issues from `car_issues` table |
| 8 | Ask "How does it compare to the Supra?" | `POST /api/ai-mechanic` | `{ response }` | Comparison data |
| 9 | Verify comparison logic | None | Side-by-side data | Both cars' specs compared |
| 10 | Ask "What mods should I do first?" | `POST /api/ai-mechanic` | `{ response }` | Modification recommendations |
| 11 | Verify search_parts tool | None | Part recommendations | Parts from `parts` table |
| 12 | Check usage/credits | `GET /api/users/[userId]/al-credits` | `{ balance_cents, spent_cents_this_month }` | Credits decremented |
| 13 | Check conversation history | `GET /api/users/[userId]/al-conversations` | `{ conversations: [...] }` | Conversation with message count |

### Critical Path APIs
```
POST /api/ai-mechanic
GET  /api/users/[userId]/al-credits
GET  /api/users/[userId]/al-conversations
GET  /api/users/[userId]/al-conversations/[conversationId]
```

### AL Tool Usage Assertions
| User Query Pattern | Expected Tool(s) |
|--------------------|------------------|
| "What car should I buy..." | `search_cars` |
| "Tell me about [car]" | `get_car_ai_context` |
| "What issues does [car] have" | `get_known_issues` |
| "Compare [car] to [car]" | `get_car_ai_context` (×2) |
| "What mods for [car]" | `search_parts` |
| "Dyno numbers for [car]" | `get_dyno_runs` |
| "Lap times for [car]" | `get_track_lap_times` |
| "Maintenance schedule for [car]" | `get_maintenance_schedule` |
| "Events near me" | `search_events` |

### Database Assertions
| Table | Assertion |
|-------|-----------|
| `al_conversations` | New conversation created, `message_count` incremented |
| `al_messages` | Messages logged with `role`, `content`, `tool_calls` |
| `al_usage_logs` | Usage logged with `input_tokens`, `output_tokens`, `cost_cents` |
| `al_user_credits` | `balance_cents` decremented, `spent_cents_this_month` incremented |

---

## Test Data Requirements

| Test Journey | Required Data | Table | Min Rows |
|--------------|---------------|-------|----------|
| Car Shopper | Cars with all scores populated | `cars` | 10 |
| Car Shopper | Fuel economy data | `car_fuel_economy` | 10 |
| Car Shopper | Safety ratings | `car_safety_data` | 10 |
| Car Shopper | Recalls | `car_recalls` | 5 |
| New Owner | Car variants for VIN decode | `car_variants` | 5 |
| New Owner | Maintenance specs | `vehicle_maintenance_specs` | 10 |
| New Owner | Market pricing (⚠️ sparse) | `car_market_pricing` | 1 |
| Enthusiast | Dyno runs | `car_dyno_runs` | 3 |
| Enthusiast | Lap times | `car_track_lap_times` | 3 |
| Enthusiast | Parts catalog | `parts` | 20 |
| Enthusiast | Part fitments | `part_fitments` | 10 |
| Events | Event types | `event_types` | 5 |
| Events | Approved future events | `events` | 10 |
| AL | Knowledge embeddings | `document_chunks` | 50 |
| AL | Community insights (⚠️ Porsche-only) | `community_insights` | 10 |
| AL | User credits | `al_user_credits` | 1 |

---

## Seed Data Script Requirements

```sql
-- Minimum test data for integration tests

-- 1. Ensure test user exists with each tier
INSERT INTO user_profiles (id, display_name, subscription_tier)
VALUES 
  ('test-free-user-id', 'Test Free User', 'free'),
  ('test-collector-user-id', 'Test Collector', 'collector'),
  ('test-tuner-user-id', 'Test Tuner', 'tuner')
ON CONFLICT (id) DO UPDATE SET subscription_tier = EXCLUDED.subscription_tier;

-- 2. Ensure AL credits for test users
INSERT INTO al_user_credits (user_id, subscription_tier, balance_cents)
VALUES 
  ('test-free-user-id', 'free', 100),
  ('test-collector-user-id', 'collector', 500),
  ('test-tuner-user-id', 'tuner', 1000)
ON CONFLICT (user_id) DO UPDATE SET balance_cents = EXCLUDED.balance_cents;

-- 3. Ensure test events exist
INSERT INTO events (slug, name, event_type_id, start_date, city, state, status, is_free)
SELECT 
  'test-cars-coffee-' || generate_series,
  'Test Cars & Coffee #' || generate_series,
  (SELECT id FROM event_types WHERE slug = 'cars-and-coffee'),
  CURRENT_DATE + (generate_series || ' days')::interval,
  'Test City',
  'CA',
  'approved',
  true
FROM generate_series(1, 5)
ON CONFLICT (slug) DO NOTHING;
```

---

## API Response Schemas to Validate

### GET /api/cars
```typescript
interface CarsResponse {
  cars: Array<{
    id: string;           // UUID
    slug: string;         // URL-safe identifier
    name: string;
    brand: string;
    tier: 'premium' | 'upper-mid' | 'mid' | 'budget';
    category: string;     // Engine layout
    hp: number;
    price_avg: number;
  }>;
}
```

### GET /api/cars/[slug]/efficiency
```typescript
interface EfficiencyResponse {
  efficiency: {
    city_mpg: number;
    highway_mpg: number;
    combined_mpg: number;
    fuel_type: string;
    annual_fuel_cost: number;
    co2_emissions: number;
    ghg_score: number;
  } | null;
}
```

### GET /api/cars/[slug]/dyno
```typescript
interface DynoResponse {
  dynoRuns: Array<{
    run_kind: 'baseline' | 'modded';
    peak_whp: number;
    peak_wtq: number;
    dyno_type: string;
    fuel: string;
    modifications?: string;
    source_url?: string;
  }>;
}
```

### GET /api/events
```typescript
interface EventsResponse {
  events: Array<{
    id: string;
    slug: string;
    name: string;
    event_type: {
      slug: string;
      name: string;
      icon: string;
      is_track_event: boolean;
    };
    start_date: string;   // ISO date
    city: string;
    state: string;
    is_free: boolean;
    featured: boolean;
  }>;
  total: number;
  limit: number;
  offset: number;
}
```

### POST /api/ai-mechanic
```typescript
interface AIResponse {
  response: string;
  conversationId: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    costCents: number;
  };
}
```

---

## Error Scenarios to Test

| Scenario | Expected Status | Expected Response |
|----------|-----------------|-------------------|
| Invalid car slug | 404 | `{ error: "Car not found" }` |
| Invalid VIN format | 400 | `{ error: "Invalid VIN" }` |
| VIN not in database | 404 | `{ error: "No matching variant" }` |
| Unauthenticated user saves event | 401 | `{ error: "Authentication required" }` |
| Free user accesses Collector feature | 403 | `{ error: "Requires Collector tier" }` |
| Collector user accesses Tuner feature | 403 | `{ error: "Requires Tuner tier" }` |
| AL request with zero credits | 402 | `{ error: "Insufficient credits" }` |
| Event submission missing required field | 400 | `{ error: "Validation error", fields: [...] }` |
| Event submission past date | 400 | `{ error: "Event date must be in future" }` |

---

## Test Environment Setup

### Environment Variables Required
```bash
NEXT_PUBLIC_SUPABASE_URL=<test-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<test-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<test-service-key>
ANTHROPIC_API_KEY=<test-or-mock-key>
```

### Test User Accounts
| Role | Email | Tier | Purpose |
|------|-------|------|---------|
| Anonymous | — | — | Free features without auth |
| Free | test-free@autorev.test | free | Free tier gating |
| Collector | test-collector@autorev.test | collector | Collector features |
| Tuner | test-tuner@autorev.test | tuner | Full feature access |
| Admin | test-admin@autorev.test | admin | Internal routes |

### Test Execution Order
1. **Setup**: Seed test data, create test users
2. **Journey 1**: Car Shopper (no auth required)
3. **Journey 4**: Event Discovery (partial auth)
4. **Journey 5**: AL Assistant (auth required)
5. **Journey 2**: New Owner (Collector auth)
6. **Journey 3**: Enthusiast (Tuner auth)
7. **Cleanup**: Remove test data

---

## Edge Cases & Known Limitations

### Data Sparseness
| Data Type | Coverage | Impact on Tests |
|-----------|----------|-----------------|
| Market Pricing | 10/98 cars | Use known cars (Porsche models) for value tests |
| Dyno Runs | 29 total | Limited car selection for dyno tests |
| Lap Times | 65 total | Limited car selection for lap time tests |
| Community Insights | Porsche-only | AL insight queries limited to Porsche |
| Events | 55 total | May need seed data for event tests |

### Tier Gating (IS_BETA Flag)
- When `IS_BETA = true` in `lib/tierAccess.js`, all authenticated users bypass tier checks
- Tests should verify both beta-enabled and production gating behavior
- Mock or toggle `IS_BETA` for comprehensive tier testing

### Empty Tables (Intentional)
| Table | Status | Test Approach |
|-------|--------|---------------|
| `event_saves` | Empty | Tests will create first rows |
| `event_submissions` | Empty | Tests will create first rows |
| `user_service_logs` | Empty | Skip or mark as future feature |
| `user_project_parts` | Empty | Skip or mark as future feature |

---

## Recommended Test Framework

```javascript
// Example Playwright E2E test structure
import { test, expect } from '@playwright/test';

test.describe('Journey 1: Car Shopper', () => {
  test('complete car discovery flow', async ({ page }) => {
    // Step 1: Load home page
    await page.goto('/');
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
    
    // Step 2: Navigate to car selector
    await page.click('text=Find Your Car');
    await expect(page).toHaveURL('/car-selector');
    
    // Step 3-4: Set priorities
    await page.fill('[data-testid="sound-slider"]', '5');
    await page.fill('[data-testid="track-slider"]', '4');
    
    // Step 5: Find matches
    const responsePromise = page.waitForResponse('**/api/cars**');
    await page.click('text=Find Matches');
    const response = await responsePromise;
    const data = await response.json();
    expect(data.cars.length).toBeGreaterThan(0);
    
    // ... continue steps
  });
});
```

---

*Generated from authoritative docs: PAGES.md, API.md, ARCHITECTURE.md, DATABASE.md*

