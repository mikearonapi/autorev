# AutoRev Events Strategy

> Comprehensive plan for populating the events database with real automotive events
> 
> **Updated:** December 17, 2024
> **Goal:** 2+ events within 30 miles of top 500 US cities per relevant category

---

## Executive Summary

| Category | Slug | Primary Source | Secondary Sources | Approach | Est. Events/Year |
|----------|------|---------------|-------------------|----------|------------------|
| **Cars & Coffee** | `cars-and-coffee` | carsandcoffeedirectory.com | CarCruiseFinder, PistonRepublic | Scrape + manual curation | 3,000+ |
| **Track Day/HPDE** | `track-day` | MotorsportReg API | NASA regions, Chin, HOD | API + regional scraping | 800+ |
| **Autocross** | `autocross` | MotorsportReg API | SCCA regions, AXWare | API + iCal feeds | 500+ |
| **Time Attack** | `time-attack` | Global Time Attack | GridLife, Super Lap | Manual seed + scrape | 50+ |
| **Car Shows** | `car-show` | Hemmings Calendar | CarShowCalendars, 10times | Scrape multiple sources | 500+ |
| **Club Meetups** | `club-meetup` | MotorsportReg API | PCA/BMW CCA/MBCA sites | API + club scraping | 400+ |
| **Cruise/Drive** | `cruise` | Hagerty, CrownRally | CarCruiseFinder | Scrape + manual | 200+ |
| **Auctions** | `auction` | Manual curation | — | Seed script (fixed) | 50-75 |
| **Industry** | `industry` | Manual curation | — | Seed script (fixed) | 25-30 |

---

## Category Deep Dives

### 1. Cars & Coffee (`cars-and-coffee`)

**Goal:** 2+ C&C events within 30 miles of every top 500 US city.

**Primary Sources:**
| Source | URL | Events | Structure | Reliability |
|--------|-----|--------|-----------|-------------|
| Cars & Coffee Directory | carsandcoffeedirectory.com | 424 | By state | ⭐⭐⭐⭐ |
| CarCruiseFinder | carcruisefinder.com | 200+ | Searchable | ⭐⭐⭐ |
| Piston Republic | pistonrepublic.com | 100+ | Calendar | ⭐⭐⭐ |
| GarageApp | garageapp.com | Unknown | App-based | ⭐⭐ |

**Validated Example - Leesburg, VA (pop ~55,000):**
- Katie's Cars and Coffee - Great Falls, VA (every Saturday, 6-9am) - 15 min
- Cars & Coffee Middleburg - Middleburg, VA (every Saturday, 7-9:30am) - 20 min
- Cars and Coffee Bethesda - Bethesda, MD (every Saturday, 8-10am) - 30 min
- Cars & Coffee Alexandria - Alexandria, VA (2nd/4th Saturday) - 40 min

**Implementation:**
1. Scrape carsandcoffeedirectory.com all 50 states
2. Cross-reference with CarCruiseFinder
3. Geocode all locations
4. Generate recurring dates for 2025-2026
5. Gap analysis against top 500 cities
6. Manual curation for underserved areas

---

### 2. Track Day / HPDE (`track-day`)

**Goal:** Coverage of all major track day organizations and venues nationwide.

**Primary Source: MotorsportReg GraphQL API**
- Endpoint: `https://api-v2.motorsportreg.com/graphql`
- Auth: `x-api-key` header
- Registration: https://developer.motorsportreg.com/
- **Status: REQUIRES API KEY APPLICATION**

**Secondary Sources:**
| Organization | Coverage | Data Access |
|--------------|----------|-------------|
| NASA (National Auto Sport Association) | 15+ regions | Regional websites |
| Chin Track Days | Eastern US | Website |
| Hooked on Driving | West Coast | Website |
| TrackDaze | Southeast | Website |
| Putnam Park Road Course | Midwest | Website |

**NASA Regional Sites (all have schedules):**
- nasane.com (Northeast)
- nasanorcal.com (NorCal)
- nasasocal.com (SoCal)
- nasatx.com (Texas)
- nasaaz.com (Arizona)
- nasautah.com (Utah)
- nasagreatlakes.com (Great Lakes)
- nasasoutheast.com (Southeast)
- nasamidatlantic.com (Mid-Atlantic)

---

### 3. Autocross (`autocross`)

**Goal:** Coverage of SCCA regions and other autocross series.

**Primary Source: MotorsportReg API** (same as track days)

**Secondary Sources:**
| Source | Coverage | Data Format |
|--------|----------|-------------|
| SCCA National | scca.com/events | HTML |
| SCCA Regional Sites | 120+ regions | Varies (HTML, Google Cal, iCal) |
| AXWare Systems | axwaresystems.com | HTML calendar |

**SCCA National Tours 2026:**
- Brunswick National Tour (June 19-21, Brunswick, ME)
- Bristol National Tour (July 3-5, Bristol, TN)
- Packwood National Tour (July 17-19, Packwood, WA)
- Grissom National Tour (July 17-19, Bunker Hill, IN)
- Finger Lakes National Tour (July 31-Aug 2, Romulus, NY)
- Solo Nationals (Sept 7-11, Lincoln, NE)

---

### 4. Time Attack (`time-attack`)

**Goal:** Coverage of competitive time attack series.

**Primary Source: Global Time Attack**
- Website: globaltimeattack.com
- Events: 3-5 per year
- Data: Manual extraction from website

**2026 GTA Schedule:**
- May 30-31: Thunderhill Raceway (Willows, CA)
- Aug 22-23: Speed Summit @ Ridge Motorsports Park (Shelton, WA)
- Nov 14-15: GTA Finals @ Buttonwillow (CA)

**Other Series:**
- GridLife (gridlife.co) - Multiple events
- Super Lap Battle - Part of GTA

---

### 5. Car Shows / Concours (`car-show`)

**Goal:** Major concours and regional shows.

**Primary Sources:**
| Source | URL | Coverage | Notes |
|--------|-----|----------|-------|
| Hemmings Calendar | hemmings.com/calendar | National | Best coverage, no API |
| Car Show Calendars | carshowcalendars.com | National | User-submitted |
| Car Collectors Club | carcollectorsclub.com | Premium shows | Curated |
| 10times | 10times.com/usa/auto-shows | Trade shows | API possible |

**Major Concours (Annual - Seed Script):**
- Pebble Beach Concours d'Elegance (August)
- Amelia Island Concours d'Elegance (March)
- The Quail, A Motorsports Gathering (August)
- Hilton Head Island Concours (November)
- Audrain Newport Concours (October)
- Greenwich Concours d'Elegance (June)
- Keels & Wheels Concours (May)

**Regional Show Series:**
- Carlisle Events (carlisleevents.com) - 12+ shows/year
- Goodguys Rod & Custom (good-guys.com) - 20+ shows/year
- NSRA Street Rod Nationals

---

### 6. Club Meetups (`club-meetup`)

**Goal:** Major brand club events.

**Major Clubs:**
| Club | Members | Events Source | Major Annual Event |
|------|---------|---------------|-------------------|
| PCA (Porsche) | 90,000+ | pca.org, MotorsportReg | Porsche Parade |
| BMW CCA | 70,000+ | bmwcca.org | Oktoberfest |
| MBCA (Mercedes) | 30,000+ | mbca.org | StarFest |
| Ferrari Club | 8,000+ | fca.org | Annual Meet |
| Corvette (NCM) | 35,000+ | corvettemuseum.org | Anniversary Events |
| Miata Club | Many | miata.net | Miatas at Laguna Seca |

**Implementation:**
1. Seed major annual events (Porsche Parade, BMW O'fest, etc.)
2. Query MotorsportReg for club-tagged events
3. Scrape major club region calendars

---

### 7. Cruise / Drive Events (`cruise`)

**Goal:** Group drives, rallies, and cruise events.

**Primary Sources:**
| Source | URL | Type |
|--------|-----|------|
| Hagerty Drivers Club | hagerty.com/drivers-club | Member events |
| Crown Rally | crownrally.com | Exotic rallies |
| Iconic Rallies | iconicrallies.com | Multi-day drives |
| Powercruise | powercruise.com | Track/cruise hybrid |

**Major Events (Seed Script):**
- Gumball 3000 (if US leg)
- Goldrush Rally
- Powercruise USA events
- Regional canyon runs

---

### 8. Auctions (`auction`) ✅ COMPLETE

**Status:** Seed script created and tested.

**Coverage:**
- Barrett-Jackson (4 events)
- Mecum (12 events)
- RM Sotheby's (4 events)
- Gooding & Company (3 events)
- Bonhams (4 events)
- Bring a Trailer (Monterey presence)

**Total:** 27 events seeded

---

### 9. Industry Events (`industry`)

**Goal:** Major auto shows and trade events.

**Events (Seed Script):**
| Event | Location | Dates | Type |
|-------|----------|-------|------|
| SEMA Show | Las Vegas, NV | November 3-6, 2026 | Trade |
| PRI Show | Indianapolis, IN | December 10-12, 2026 | Trade |
| Detroit Auto Show | Detroit, MI | January 14-25, 2026 | Public |
| Chicago Auto Show | Chicago, IL | February 2026 | Public |
| NY Auto Show | New York, NY | April 2026 | Public |
| LA Auto Show | Los Angeles, CA | November 2026 | Public |
| Philadelphia Auto Show | Philadelphia, PA | Jan 31-Feb 8, 2026 | Public |
| Goodwood Festival of Speed | UK | July 2026 | International |
| Goodwood Revival | UK | September 2026 | International |

---

## Technical Architecture

### Directory Structure

```
scripts/
  events/
    data/
      top-500-cities.json          # US cities with populations + coords
      auction-schedule-2026.json   # Structured auction data
      industry-events-2026.json    # Industry event data
      concours-schedule-2026.json  # Major show data
      time-attack-2026.json        # GTA and other series
      club-annual-events.json      # Major club events
    
    seeders/
      seed-auctions.js             # ✅ Working
      seed-industry-events.js      # To create
      seed-major-shows.js          # To create
      seed-time-attack.js          # To create
      seed-club-annual.js          # To create
      seed-cars-and-coffee.js      # Needs fix
      seed-major-events.js         # Needs fix
    
    scrapers/
      carsandcoffee-directory.js   # Created, needs testing
      hemmings-calendar.js         # To create
      motorsportreg-client.js      # To create (needs API key)
      nasa-regions.js              # To create
      scca-national.js             # To create
    
    lib/
      event-helpers.js             # ✅ Working
      cities.js                    # City lookup utilities
      geocoding.js                 # Batch geocoding
      recurrence.js                # Complex patterns
    
    analysis/
      coverage-analysis.js         # Gap analysis by city
      category-coverage.js         # Coverage by category
    
    run-all-seeds.js               # Master runner
```

### Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Data Sources  │────▶│    Scrapers/     │────▶│    Database     │
│  (APIs, Sites)  │     │    Seeders       │     │    (Supabase)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  Validation  │
                        │  & Geocoding │
                        └──────────────┘
```

---

## API Keys Required

| Service | Purpose | Status | Action |
|---------|---------|--------|--------|
| MotorsportReg | Track days, autocross, clubs | ❌ Not obtained | Apply at developer.motorsportreg.com |
| Google Geocoding | Address → coordinates | ✅ Have key | Already configured |
| Eventbrite | Limited use (no search) | ⚠️ Limited | Partner program needed |

---

## Implementation Priority

### Phase 1: Fix & Seed (This Week)
1. ✅ Fix event-helpers.js constraint issue
2. ✅ Run auction seeder (27 events)
3. ⬜ Fix and run major events seeder
4. ⬜ Fix and run C&C seeder
5. ⬜ Create and run industry events seeder
6. ⬜ Create and run time attack seeder

### Phase 2: Expand Cities (Week 2)
1. ⬜ Expand top-metros.json to 500 cities
2. ⬜ Add city lookup utilities
3. ⬜ Run coverage analysis

### Phase 3: Scrapers (Week 2-3)
1. ⬜ Apply for MotorsportReg API key
2. ⬜ Build carsandcoffeedirectory scraper
3. ⬜ Build Hemmings calendar scraper
4. ⬜ Build NASA regional scrapers

### Phase 4: Gap Analysis (Week 3-4)
1. ⬜ Run coverage analysis per city
2. ⬜ Identify underserved areas
3. ⬜ Manual curation for gaps

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Total events | 5,000+ | 27 |
| Cities with 2+ C&C within 30mi | 500/500 | TBD |
| Track day venues covered | 50+ | 0 |
| Auction coverage | 100% major houses | ✅ 100% |
| Data freshness | Updated weekly | N/A |

---

## Next Steps

1. ⬜ Expand top-500-cities.json to full 500
2. ⬜ Fix seed-major-events.js bug
3. ⬜ Fix seed-cars-and-coffee.js bug  
4. ⬜ Create seed-industry-events.js
5. ⬜ Create seed-time-attack.js
6. ⬜ Create seed-major-shows.js
7. ⬜ Apply for MotorsportReg API access
8. ⬜ Build and test Cars & Coffee scraper

