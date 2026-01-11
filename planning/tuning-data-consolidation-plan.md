# Tuning Data Consolidation Plan

## Executive Summary

We have car tuning data scattered across 6+ locations. This plan consolidates everything into a single authoritative source while maintaining backwards compatibility for our 50+ users.

## Current State (Fragmented)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT DATA SOURCES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Static Files (Code)                Database (Supabase)         │
│  ──────────────────────            ─────────────────────        │
│  data/upgradePackages.js           cars.upgrade_recommendations │
│  - Generic packages                - 98 cars                    │
│  - Not car-specific               - Tier-based (entry/mid/adv)  │
│                                                                 │
│  data/carUpgradeRecommendations.js cars.popular_track_mods      │
│  - ~50 specific cars              - 221 cars                    │
│  - Tier-based (mustHave, etc)     - Track mod lists             │
│                                                                 │
│                                    car_tuning_profiles          │
│                                    - 314 profiles               │
│                                    - Stage-based (wrong model)  │
│                                                                 │
│                                    youtube_videos               │
│                                    - 998 with transcripts       │
│                                    - 0 linked to cars ⚠️        │
└─────────────────────────────────────────────────────────────────┘
```

## Target State (Consolidated)

```
┌─────────────────────────────────────────────────────────────────┐
│               SINGLE SOURCE OF TRUTH                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  car_tuning_profiles (Database Table)                          │
│  ═════════════════════════════════════                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Objectives (Power, Handling, Braking, Cooling, Sound)   │   │
│  │   └─ Car-specific upgrades with:                        │   │
│  │       - Expected gains (HP, G-force, etc.)              │   │
│  │       - Cost ranges                                      │   │
│  │       - Recommended brands                               │   │
│  │       - Difficulty level                                 │   │
│  │       - Prerequisites                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Component Limits                                         │   │
│  │   - Stock turbo limit                                    │   │
│  │   - Transmission torque limit                            │   │
│  │   - Fuel system limit                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Platform Insights                                        │   │
│  │   - Strengths & weaknesses                               │   │
│  │   - Known issues                                         │   │
│  │   - Community tips (from YouTube)                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Curated Packages (Optional)                              │   │
│  │   - "Daily Driver+" bundle                               │   │
│  │   - "Weekend Warrior" bundle                             │   │
│  │   - "Track Ready" bundle                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

SUPPORTING DATA (Linked)
─────────────────────────
youtube_videos ──────────┐
  └─ car_id populated    │
  └─ Insights extracted  ├──► Feeds into car_tuning_profiles
                         │
car_issues ──────────────┘
  └─ Known problems
```

## Migration Phases

### Phase 1: Schema Update (Safe - No Breaking Changes)
**Time: 30 minutes**

Add new columns to `car_tuning_profiles` without removing old ones:

```sql
ALTER TABLE car_tuning_profiles 
ADD COLUMN IF NOT EXISTS upgrades_by_objective JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS curated_packages JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS platform_insights JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS data_quality_tier TEXT DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS component_limits_v2 JSONB DEFAULT '{}';

-- Keep stage_progressions for backwards compatibility
-- It will be deprecated but not removed
```

### Phase 2: Link YouTube Videos to Cars
**Time: 1 hour**

1. Add `car_id` foreign key to `youtube_videos` (if not exists)
2. Run matching script to link videos to cars by title/content
3. Extract tuning insights from linked videos

```sql
-- Add car_id if missing
ALTER TABLE youtube_videos 
ADD COLUMN IF NOT EXISTS car_id UUID REFERENCES cars(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_youtube_videos_car_id ON youtube_videos(car_id);
```

### Phase 3: Data Migration Script
**Time: 2 hours**

Create script that:
1. Reads from ALL existing sources
2. Merges and deduplicates
3. Transforms to objective-based structure
4. Writes to `car_tuning_profiles.upgrades_by_objective`

Priority order for conflicts:
1. Manual research data (highest trust)
2. cars.upgrade_recommendations (database)
3. carUpgradeRecommendations.js (static file)
4. YouTube-derived insights
5. Template/generic data (lowest trust)

### Phase 4: Update UpgradeCenter.jsx
**Time: 1 hour**

Modify to read from consolidated source:

```javascript
// OLD (fragmented)
const carRecs = getRecommendationsForCar(carSlug);  // from JS file
const dbRecs = car.upgradeRecommendations;           // from cars table
const platformNotes = getPlatformNotes(carSlug);     // from JS file

// NEW (consolidated)
const { profile } = useTuningProfile(car);
const upgrades = profile?.upgrades_by_objective || {};
const insights = profile?.platform_insights || {};
```

### Phase 5: Data Quality Tiers
**Time: 30 minutes**

Mark each profile with quality tier:
- `verified` - Manually verified, multiple sources
- `researched` - Has real research data
- `enriched` - Has YouTube/auto-extracted data
- `templated` - Generic template only
- `skeleton` - No data yet

Display in UI so users know confidence level.

## Safety Measures

### Backwards Compatibility
- Keep ALL old columns/fields
- Add new columns alongside old ones
- UpgradeCenter falls back to old data if new is empty
- Deprecate old sources after 2 weeks of stability

### Rollback Plan
```sql
-- If issues, revert UI to use old sources
-- New columns can stay (harmless)
-- No data loss possible
```

### Testing Before Deploy
1. Test with 5 popular cars manually
2. Verify UpgradeCenter renders correctly
3. Check saved_builds still work
4. Verify user_vehicles (garage) unaffected

## Execution Checklist

- [ ] Phase 1: Schema migration
- [ ] Phase 2: YouTube linking
- [ ] Phase 3: Data consolidation script
- [ ] Phase 4: UpgradeCenter update (with fallback)
- [ ] Phase 5: Quality tier marking
- [ ] Testing: GTI, M3, Mustang, F-150, Corvette
- [ ] Deploy to production
- [ ] Monitor for 48 hours
- [ ] Deprecate old sources (2 weeks later)

## New Data Structure

### upgrades_by_objective Schema

```json
{
  "power": [
    {
      "name": "ECU Tune",
      "description": "Flash tune for increased power and torque",
      "gains": {
        "hp": { "low": 40, "high": 60 },
        "tq": { "low": 50, "high": 80 }
      },
      "cost": { "low": 600, "high": 900 },
      "brands": ["APR", "Unitronic", "IE"],
      "difficulty": "easy",
      "reversible": true,
      "prerequisites": [],
      "notes": "Best first mod - huge gains for the cost"
    },
    {
      "name": "Downpipe",
      "gains": { "hp": { "low": 15, "high": 25 } },
      "cost": { "low": 400, "high": 800 },
      "brands": ["CTS", "IE", "Milltek"],
      "difficulty": "moderate",
      "prerequisites": ["ECU Tune"],
      "notes": "Requires tune to unlock gains. May trigger CEL without tune."
    }
  ],
  "handling": [
    {
      "name": "Coilovers",
      "description": "Adjustable height and damping",
      "gains": { "lateral_g": { "improvement": "10-15%" } },
      "cost": { "low": 1200, "high": 3000 },
      "brands": ["KW", "Bilstein", "BC Racing"],
      "difficulty": "moderate"
    }
  ],
  "braking": [...],
  "cooling": [...],
  "sound": [...]
}
```

### curated_packages Schema

```json
[
  {
    "name": "Daily Driver+",
    "description": "Meaningful gains without compromising reliability",
    "target_gains": { "hp": 50 },
    "upgrades": ["ECU Tune", "Intake", "Exhaust"],
    "total_cost": { "low": 1500, "high": 2500 }
  },
  {
    "name": "Track Ready",
    "description": "Prepared for track days",
    "upgrades": ["Coilovers", "Brake Pads", "Brake Fluid", "Tires"],
    "total_cost": { "low": 4000, "high": 8000 }
  }
]
```

### platform_insights Schema

```json
{
  "strengths": [
    "EA888 engine responds incredibly well to tuning",
    "Large aftermarket support"
  ],
  "weaknesses": [
    "Carbon buildup on intake valves (direct injection)",
    "DSG clutch packs can slip at high torque"
  ],
  "community_tips": [
    "Walnut blast every 50k miles for carbon buildup",
    "DSG tune recommended with Stage 2+ power"
  ],
  "youtube_insights": {
    "common_mods_mentioned": ["IS38 swap", "intercooler"],
    "tuners_recommended": ["EQT", "Integrated Engineering"],
    "video_count": 15
  }
}
```
