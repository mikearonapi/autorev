# Data Enrichment Plan for AutoRev

> **Created**: December 7, 2024  
> **Purpose**: Identify and prioritize database enrichment opportunities  
> **Goal**: Create the most valuable, comprehensive sports car platform

---

## Executive Summary

Our database currently has **35 vehicles** with good basic coverage, but **91% are missing critical Performance HUB data** needed for upgrade planning. Additionally, our new **Upgrade Education content is not in the database**, limiting our ability to update it without code changes.

### Priority Matrix

| Priority | Item | Impact | Effort |
|----------|------|--------|--------|
| 🔴 HIGH | Add Performance HUB scores for 32 cars | Enables full Performance HUB | Medium |
| 🔴 HIGH | Add hard metrics (torque, weight, 0-60) | Better comparisons | Medium |
| 🔴 HIGH | Migrate Upgrade Education to database | Easier updates | Low |
| 🟡 MEDIUM | Add Hero Blurbs for all cars | Better car detail pages | High |
| 🟡 MEDIUM | Add Known Issues per car | Huge buyer value | High |
| 🟢 LOW | Add maintenance cost estimates | Nice to have | High |
| 🟢 LOW | Add image galleries | Visual appeal | Medium |

---

## 1. Missing Car Performance Data (32 cars)

### Hard Metrics Needed Per Car

These can be researched from Car and Driver, Motor Trend, manufacturer specs:

```
For each car, research and add:
- torque (INTEGER) - Peak torque in lb-ft
- curbWeight (INTEGER) - Weight in lbs
- zeroToSixty (DECIMAL) - 0-60 mph time in seconds
- quarterMile (DECIMAL) - Quarter mile time in seconds
- braking60To0 (INTEGER) - 60-0 braking distance in feet
- lateralG (DECIMAL) - Maximum lateral G in cornering
```

### Performance HUB Scores (1-10)

These need to be assigned based on the car's actual capabilities:

```
For each car, assign scores:
- perfPowerAccel - Power & Acceleration rating
- perfGripCornering - Grip & Cornering rating
- perfBraking - Braking performance rating
- perfTrackPace - Overall track pace rating
- perfDrivability - Daily drivability rating
- perfReliabilityHeat - Track reliability rating
- perfSoundEmotion - Sound & emotion rating
```

### Cars Needing Research (32)

**Premium Tier:**
- 718 Cayman GTS 4.0
- Audi R8 V8
- Audi R8 V10
- Lamborghini Gallardo
- Lotus Emira
- Dodge Viper

**Upper-Mid Tier:**
- C8 Corvette Stingray
- 981 Cayman GTS
- 991.1 Carrera S
- 997.2 Carrera S
- Nissan GT-R
- Shelby GT500
- Lotus Evora GT

**Mid Tier:**
- 981 Cayman S
- Jaguar F-Type R
- C7 Corvette Z06
- Camaro ZL1
- BMW M2 Competition
- Alfa Romeo 4C
- Aston Martin V8 Vantage
- Lotus Evora S
- Lexus LC 500

**Budget Tier:**
- 987.2 Cayman S
- Jaguar F-Type V6 S
- Lexus RC F
- Nissan 370Z NISMO
- Mercedes C63 AMG W204
- BMW M4 F82
- Mustang GT PP2
- Camaro SS 1LE
- Toyota GR Supra
- Maserati GranTurismo

---

## 2. New Database Table: Upgrade Education

The upgrade education content I created should be moved to a database table for easier maintenance.

### Proposed Schema: `upgrade_education`

```sql
CREATE TABLE IF NOT EXISTS upgrade_education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Identity
  key TEXT UNIQUE NOT NULL,              -- e.g., 'cold-air-intake'
  name TEXT NOT NULL,                    -- e.g., 'Cold Air Intake (CAI)'
  category TEXT NOT NULL,                -- 'power', 'exhaust', 'suspension', 'brakes', 'wheels', 'cooling', 'aero', 'electronics'
  
  -- Short content (for cards)
  short_description TEXT NOT NULL,       -- One-line description
  cost_range TEXT NOT NULL,              -- e.g., '$200 - $500'
  cost_low INTEGER,
  cost_high INTEGER,
  difficulty TEXT,                       -- 'Easy', 'Moderate', 'Hard', 'Professional'
  install_time TEXT,                     -- e.g., '30-60 minutes'
  
  -- Long content (for detail modal)
  full_description TEXT,                 -- Full explanation
  how_it_works TEXT,                     -- Technical explanation
  
  -- Expected gains (JSONB for flexibility)
  expected_gains JSONB DEFAULT '{}'::jsonb,  -- { hp: '5-15 hp', torque: '5-10 lb-ft', note: '...' }
  
  -- Pros/Cons
  pros JSONB DEFAULT '[]'::jsonb,
  cons JSONB DEFAULT '[]'::jsonb,
  
  -- Related info
  best_for JSONB DEFAULT '[]'::jsonb,    -- ['Track enthusiasts', 'Budget builds']
  works_well_with JSONB DEFAULT '[]'::jsonb,  -- ['ECU tune', 'Exhaust']
  considerations TEXT,                   -- Important notes
  
  -- Metadata
  applicable_car_types JSONB DEFAULT '["all"]'::jsonb,  -- ['turbo', 'na', 'all']
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Current Content to Migrate (17 upgrades)

**Power & Engine (3):**
- Cold Air Intake (CAI)
- High-Flow Air Filter
- Throttle Body Upgrade

**Exhaust & Sound (3):**
- Cat-Back Exhaust System
- Downpipe (Turbo Cars)
- Resonator Delete

**Electronics & Tuning (3):**
- ECU Tune (Remap)
- Piggyback Tuner
- High-Pressure Fuel Pump (HPFP)

**Suspension & Handling (3):**
- Lowering Springs
- Coilovers
- Sway Bars (Anti-Roll Bars)

**Brakes (3):**
- Performance Brake Pads
- Big Brake Kit (BBK)
- High-Temperature Brake Fluid

**Wheels & Tires (3):**
- Performance Summer Tires
- 200TW Track Tires
- Lightweight Wheels

**Cooling (2):**
- Oil Cooler
- Upgraded Intercooler (Turbo Cars)

---

## 3. New Database Table: Known Issues

High-value content that helps buyers make informed decisions.

### Proposed Schema: `car_known_issues`

```sql
CREATE TABLE IF NOT EXISTS car_known_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  car_slug TEXT NOT NULL REFERENCES cars(slug) ON DELETE CASCADE,
  
  -- Issue details
  issue_name TEXT NOT NULL,              -- e.g., 'IMS Bearing Failure'
  severity TEXT NOT NULL,                -- 'Critical', 'Major', 'Minor'
  affected_years TEXT,                   -- e.g., '2009-2011' or 'All'
  
  -- Description
  description TEXT NOT NULL,             -- What the issue is
  symptoms TEXT,                         -- How to identify it
  prevention TEXT,                       -- How to prevent/check
  fix_description TEXT,                  -- How to fix
  estimated_cost TEXT,                   -- Cost to fix
  
  -- Metadata
  source TEXT,                           -- Where we learned this
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Example Issues to Document:

**Porsche:**
- 997.2: IMS bearing (early cars), bore scoring
- 981/718: Cylinder scoring rumors, coolant leaks
- 991.1: PDK mechatronic unit issues

**BMW:**
- F82 M4: S55 crank hub, rod bearing concerns
- M2 Competition: S55 rod bearings

**Mercedes:**
- W204 C63: Head bolt stretch issue (6.2L V8)

**Ford:**
- Shelby GT350: Oil consumption on Voodoo engine (early cars)
- GT500: Overheating under track use

**Corvette:**
- C7 Z06: Overheating, supercharger whine leak
- C8: Frunk latch, transmission shudder

**Nissan GT-R:**
- Expensive transmission service ($10K+)
- Clutch pack wear on launch mode

**Jaguar F-Type:**
- Supercharger nose cone issues
- Electrical gremlins

---

## 4. Enhanced Car Content

### Hero Blurbs (Long Descriptions)

Each car needs a 2-3 paragraph "hero blurb" for the detail page that covers:
- What makes this car special
- Who it's for
- What the ownership experience is like

### Owner Notes (Detailed)

More detailed ownership notes covering:
- Common modifications
- Maintenance requirements
- What to look for when buying
- Community/resources

---

## 5. Implementation Priority

### Phase 1: Foundation (Immediate)
1. ✅ Create upgrade education table schema
2. Migrate `upgradeEducation.js` content to database
3. Update UpgradeGuide component to fetch from Supabase

### Phase 2: Car Data Enrichment (Week 1-2)
1. Research hard metrics for all 32 cars missing them
2. Calculate/assign Performance HUB scores for all 32 cars
3. Update database with new metrics

### Phase 3: Content Expansion (Week 3-4)
1. Create `car_known_issues` table
2. Research and add known issues for all 35 cars
3. Write hero blurbs for all cars

### Phase 4: Advanced Features (Future)
1. Car-specific upgrade recommendations
2. Maintenance cost estimates table
3. Image galleries
4. Video content

---

## Data Sources for Research

**Hard Metrics:**
- Car and Driver instrumented tests
- Motor Trend comparison tests
- Road & Track reviews
- Manufacturer specifications

**Known Issues:**
- Rennlist (Porsche)
- Bimmerpost (BMW)
- Corvette Forum
- MBWorld (Mercedes)
- Reddit r/cars, r/Porsche, etc.
- NHTSA complaints database

**Ownership Info:**
- Long-term reviews
- Owner forums
- YouTube channels (Doug DeMuro, Throttle House, etc.)

---

## Success Metrics

After enrichment, we should have:
- 100% of cars with Performance HUB scores
- 100% of cars with hard metrics
- 100% of cars with known issues documented
- Upgrade education in database (easy to update)
- Hero blurbs for top 10 most-viewed cars

This will make AutoRev **the most comprehensive sports car comparison platform** for enthusiasts.







