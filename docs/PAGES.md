# AutoRev Pages & Routes

> Complete inventory of all 37 pages & routes
>
> **Last Verified:** December 24, 2024 — MCP-verified file listing (updated counts)

---

## Public Pages

### Home (`/`)
| Attribute | Value |
|-----------|-------|
| **Purpose** | Welcome page, features overview, primary CTA |
| **Tier** | Public (no auth) |
| **Key Components** | HeroSection, PillarsSection, CarCarousel, ExpertReviewedStrip |
| **Data Sources** | None (static + car count from DB) |

### Browse Cars (`/browse-cars`)
| Attribute | Value |
|-----------|-------|
| **Purpose** | Browse the complete 98-car database |
| **Tier** | Free |
| **Key Components** | Car grid, filters, search |
| **Data Sources** | `cars` table |
| **Features** | Filter by price, brand, drivetrain, engine layout |

### Car Detail (`/browse-cars/[slug]`)
| Attribute | Value |
|-----------|-------|
| **Purpose** | Deep dive on individual car |
| **Tier** | Free (some sections Collector/Tuner) |
| **Tabs** | Overview, Buying, Ownership, Expert Reviews |
| **Data Sources** | `cars`, `car_fuel_economy`, `car_safety_data`, `car_market_pricing_years`, `car_recalls`, `youtube_video_car_links`, `vehicle_known_issues` |

**Tab Breakdown:**

| Tab | Content | Tier |
|-----|---------|------|
| Overview | Story, heritage, strengths/weaknesses, scores | Free |
| Buying | Best years, price guide, safety ratings, alternatives | Free |
| Ownership | Fuel economy, costs, parts preview, known issues | Free |
| Expert Reviews | YouTube videos, AI consensus | Free |

**Events Integration:**
- Shows upcoming events featuring this car or brand (sidebar section)
- Links to `/events?brand=X` for more events
- Component: `CarEventsSection`

### Car Selector (`/car-selector`)
| Attribute | Value |
|-----------|-------|
| **Purpose** | Personalized car matching based on priorities |
| **Tier** | Free |
| **Key Components** | Priority sliders (7), Must-have filters, Results grid |
| **Data Sources** | `cars` table, `lib/scoring.js` algorithm |
| **How it Works** | User sets priorities → weighted scoring → ranked results |

**7 Priority Categories:**
1. Sound & Character
2. Interior & Comfort
3. Track Capability
4. Reliability
5. Value for Money
6. Driver Engagement
7. Aftermarket Support

### My Garage (`/garage`)
| Attribute | Value |
|-----------|-------|
| **Purpose** | User's saved favorites and owned vehicles |
| **Tier** | Free (favorites), Collector (owned vehicles) |
| **Key Components** | FavoritesProvider, OwnedVehiclesProvider, AddVehicleModal, GarageEventsSection |
| **Views** | Favorites, Owned Vehicles (with sub-tabs) |

**Owned Vehicle Sub-Tabs:**

| Tab | Content | Tier |
|-----|---------|------|
| Overview | Basic car info | Collector |
| Reference | Oil specs, fluid capacities | Collector |
| Service | Service log tracking | Collector |
| Value | Market value, price history | Collector |

**Events Integration (Enthusiast+):**
- Shows upcoming events relevant to user's owned vehicles
- Queries events by car brand/slug matching garage vehicles
- Falls back to favorites' brands if no owned vehicles
- Links to `/events?brand=X` for full event listings
- Component: `GarageEventsSection`

### Garage Compare (`/garage/compare`)
| Attribute | Value |
|-----------|-------|
| **Purpose** | Side-by-side car comparison |
| **Tier** | Collector |
| **Data Sources** | `cars` table |
| **Max Cars** | 4 |

### Tuning Shop (`/tuning-shop`)
| Attribute | Value |
|-----------|-------|
| **Purpose** | Upgrade planning, performance data, build projects |
| **Tier** | Free (browse), Tuner (full data, save builds) |
| **Key Components** | PerformanceHub, UpgradeCenter, BuildsWorkshop |
| **Data Sources** | `parts`, `part_fitments`, `car_dyno_runs`, `car_track_lap_times`, `upgrade_packages` |

**Features:**
- Browse upgrade packages
- View dyno data (Tuner)
- View lap times (Tuner)
- Search parts catalog (Tuner)
- Save build projects (Tuner)

### Mod Planner (`/mod-planner`)
| Attribute | Value |
|-----------|-------|
| **Purpose** | Interactive modification planner (legacy/alternate) |
| **Tier** | Free |
| **Note** | May be consolidated with Tuning Shop |

### Join (`/join`)
| Attribute | Value |
|-----------|-------|
| **Purpose** | Membership tiers and signup |
| **Tier** | Public |
| **Content** | Tier cards, feature comparison table, signup CTAs |

### Encyclopedia (`/encyclopedia`)
| Attribute | Value |
|-----------|-------|
| **Purpose** | Component-centric automotive education |
| **Tier** | Free |
| **Data Sources** | `lib/encyclopediaData.js`, `lib/encyclopediaHierarchy.js`, `lib/educationData.js` |

**Navigation Structure (v2 - Component-Centric Hierarchy):**

```
Automotive Systems (NEW - Primary Section)
├── Engine (8 components, ~20 topics)
│   ├── Engine Block → bore, stroke, displacement, block-material
│   ├── Cylinder Head → port-design, valve-sizing, combustion-chamber
│   ├── Pistons & Rods → piston-types, connecting-rods
│   └── ... (5 more components)
├── Drivetrain (5 components)
├── Fuel System (4 components)
├── Engine Management (5 components)
├── Air Intake & Forced Induction (6 components)
├── Exhaust (5 components)
├── Suspension & Steering (9 components)
├── Aerodynamics (4 components)
└── Brakes (6 components)

Modifications (Preserved)
├── Power & Engine → cold-air-intake, ecu-tune, etc.
├── Forced Induction → turbo-upgrade, supercharger, etc.
└── ... (other categories)

Build Guides (Preserved)
├── More Power
├── Better Handling
└── ... (other goals)

Technical Reference (Legacy)
└── connectedTissueMatrix systems/nodes
```

**Content Stats:**
- 9 automotive systems
- 52 components
- 55 topics (100% complete)
- 49 modification articles
- 6 build guides

### Profile (`/profile`)
| Attribute | Value |
|-----------|-------|
| **Purpose** | User settings and account management |
| **Tier** | Authenticated |
| **Data Sources** | `user_profiles` |

### Community (`/community`)
| Attribute | Value |
|-----------|-------|
| **Purpose** | Community hub landing page - events, resources, and future forum/clubs |
| **Tier** | Free |
| **Key Components** | Hero section, EventCard, EventCategoryPill grid, CTAs |
| **Data Sources** | `events`, `event_types`, `event_car_affinities` |

**Features:**
- Featured events carousel
- Event category grid (quick filter links)
- Upcoming events near user (if location available)
- CTAs to browse all events

### Community Events (`/community/events`)
| Attribute | Value |
|-----------|-------|
| **Purpose** | Discover car events (Cars & Coffee, track days, shows, auctions) |
| **Tier** | Free (List view), Enthusiast+ (Map/Calendar views) |
| **Key Components** | EventCard, EventFilters, EventCalendarView, EventMap |
| **Data Sources** | `events`, `event_types`, `event_car_affinities` |

**Features:**
- **Three View Modes:**
  - List (Free) - Grid of EventCards
  - Map (Enthusiast+) - Geographic view with clustering
  - Calendar (Enthusiast+) - Monthly calendar grid
- **Filters (EventFilters component):**
  - Category pills (quick event type selection)
  - Location (ZIP, city/state, region, scope)
  - Date range picker
  - Track Events Only toggle
  - Free Events Only toggle
  - "Events for My Cars" (Enthusiast+ with garage data)
- Featured events highlighted
- Pagination
- Save events (Enthusiast+)

### Community Event Detail (`/community/events/[slug]`)
| Attribute | Value |
|-----------|-------|
| **Purpose** | Full event details with location, dates, and car affinities |
| **Tier** | Free |
| **Key Components** | SaveEventButton, AddToCalendarButton, Related EventCards |
| **Data Sources** | `events`, `event_types`, `event_car_affinities`, `cars` |

**Features:**
- Hero image with overlay
- Full event information (date/time, location, description, cost)
- Google Maps integration (external link)
- Car/brand affinity badges with links
- Save button (Enthusiast+ tier)
- Add to Calendar dropdown (Enthusiast+ tier, Google/Apple/Outlook/ICS)
- Share functionality
- Related events (same type or region)
- CTA to external source/registration

### Events (Legacy - `/events`)
| Attribute | Value |
|-----------|-------|
| **Purpose** | Redirects to `/community/events` |
| **Tier** | Free |
| **Note** | Legacy route maintained for backwards compatibility |

### Submit Event (`/events/submit`)
| Attribute | Value |
|-----------|-------|
| **Purpose** | User-submitted events for moderation review |
| **Tier** | Authenticated |
| **Key Components** | Event submission form with validation |
| **Data Sources** | Writes to `event_submissions` |

**Features:**
- Full form with event details (name, type, URL, dates, location)
- Client-side validation (URL format, date logic)
- Character counts for description
- Success confirmation message
- Auth modal prompt for unauthenticated users

### Saved Events (`/events/saved`)
| Attribute | Value |
|-----------|-------|
| **Purpose** | User's bookmarked events collection |
| **Tier** | Enthusiast+ |
| **Key Components** | EventCard grid, PremiumGate |
| **Data Sources** | `event_saves`, `events`, `event_types` |

**Features:**
- Displays user's saved events
- Same card format as main events page
- Empty state with browse CTA
- Excludes expired events by default
- Tier gating with upgrade prompt

### Contact (`/contact`)
| Attribute | Value |
|-----------|-------|
| **Purpose** | Contact form |
| **Tier** | Public |
| **Data Sources** | Writes to `leads` table |

### Privacy (`/privacy`)
| Attribute | Value |
|-----------|-------|
| **Purpose** | Privacy policy |
| **Tier** | Public |

### Terms (`/terms`)
| Attribute | Value |
|-----------|-------|
| **Purpose** | Terms of service |
| **Tier** | Public |

### Auth Error (`/auth/error`)
| Attribute | Value |
|-----------|-------|
| **Purpose** | Authentication error display |
| **Tier** | Public |

---

## Internal/Admin Pages

All require admin authentication.

| Route | Purpose |
|-------|---------|
| `/internal` | Admin dashboard |
| `/internal/parts-review` | Review parts catalog |
| `/internal/variant-maintenance` | Manage variant-specific maintenance |
| `/internal/dyno` | Manage dyno data |
| `/internal/lap-times` | Manage track lap times |
| `/internal/knowledge` | Knowledge base ingestion |
| `/internal/manual-entry` | Manual data entry |
| `/internal/feedback` | User feedback review |
| `/internal/qa` | Quality assurance reports |
| `/internal/events` | Event submission moderation |

---

## User Journeys

### Journey 1: Car Shopper (Free Tier)
```
Home → Car Selector → Set priorities → View matches
                   ↓
            Browse Cars → Car Detail (specs, buying guide)
                   ↓
            Save to Garage (favorites)
                   ↓
            Ask AL questions
```

### Journey 2: New Owner (Enthusiast Tier)
```
My Garage → Add Vehicle (enter VIN)
         ↓
VIN Decode → Exact variant identified
         ↓
Owner's Reference → Oil specs, fluid capacities
         ↓
Service Log → Track maintenance
         ↓
Value Tab → Monitor market value
```

### Journey 3: Enthusiast/Tuner (Tuner Tier)
```
Tuning Shop → Select car
           ↓
View Performance Data → Dyno runs, lap times
           ↓
Browse Parts Catalog → Filter by fitment
           ↓
Create Build Project → Add parts, estimate cost
           ↓
Save & Export → PDF build sheet
```

### Journey 4: Research (AL Assistant)
```
Any Page → Click AL chat bubble
        ↓
Ask question → AL searches database
        ↓
Get answer with data → Follow-up questions
        ↓
Links to relevant pages
```

---

## Route Map

```
/
├── browse-cars/
│   └── [slug]/              # Car detail
├── car-selector/
├── community/               # Community hub (NEW)
│   └── events/              # Event discovery
│       └── [slug]/          # Event detail
├── events/                   # Legacy events routes
│   ├── saved/               # User's saved events
│   └── submit/              # Submit new event
├── garage/
│   └── compare/
├── tuning-shop/
├── mod-planner/
├── join/
├── encyclopedia/
├── profile/
├── contact/
├── privacy/
├── terms/
├── auth/
│   └── error/
└── internal/
    ├── parts-review/
    ├── variant-maintenance/
    ├── dyno/
    ├── lap-times/
    ├── knowledge/
    ├── manual-entry/
    ├── feedback/
    ├── qa/
    └── events/              # Event moderation
```

---

*See [API.md](API.md) for API routes.*


