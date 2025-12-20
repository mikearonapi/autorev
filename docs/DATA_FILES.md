# AutoRev Static Data Files

> Reference for static data files in `data/` directory
>
> **Last Updated:** December 15, 2024

---

## Overview

The `data/` directory contains static JavaScript data files that power major features without requiring database queries. These provide fallback data, configuration, and content that rarely changes.

| File | Purpose | Records |
|------|---------|---------|
| `cars.js` | Core car data and categories | 98 cars, 7 categories |
| `upgradeEducation.js` | Modification articles | 49 entries |
| `upgradePackages.js` | Performance packages | 15+ packages |
| `connectedTissueMatrix.js` | Encyclopedia legacy data | 14 systems |
| `carUpgradeRecommendations.js` | Car-specific mod recommendations | Per-car |
| `selectorDescriptors.js` | Car Selector UI text | 7 categories |
| `performanceCategories.js` | Performance bar definitions | 6 categories |
| `upgradeConflicts.js` | Part conflict rules | (stub) |
| `upgradePricing.js` | Cost estimates by tier | 3 tiers |
| `upgradeTools.js` | Tool requirements | Per-upgrade |

---

## `cars.js`

**Purpose:** Core car data, scoring categories, and fallback specifications.

### Exports

```javascript
import { cars, categories, carBrands } from '@/data/cars';
```

### `categories` — Scoring Categories

Defines the 7 subjective scoring dimensions used in the Car Selector:

| Key | Label | Description |
|-----|-------|-------------|
| `sound` | Sound | Exhaust note, engine character |
| `interior` | Interior | Material quality, comfort |
| `track` | Track | Performance capability |
| `reliability` | Reliability | Dependability, known issues |
| `value` | Value | Price-to-performance ratio |
| `driverFun` | Driver Fun | Engagement, steering feel |
| `aftermarket` | Aftermarket | Mod support, parts availability |

**Structure:**
```javascript
export const categories = [
  { key: 'sound', label: 'Sound', desc: 'Exhaust note and engine character' },
  { key: 'interior', label: 'Interior', desc: 'Material quality and comfort' },
  // ...
];
```

### `carBrands` — Brand List

Array of all car brands in the database for filtering.

### `cars` — Fallback Car Data

Static car array used as fallback when database is unavailable. Contains basic specs for all 98 cars.

**Used By:**
- `lib/scoring.js` — Category definitions
- `app/(pages)/car-selector/page.jsx` — Category sliders
- Components displaying category breakdowns

---

## `upgradeEducation.js`

**Purpose:** 49 detailed modification articles for the Encyclopedia.

### Structure

```javascript
export const upgradeEducation = [
  {
    key: 'cold-air-intake',
    name: 'Cold Air Intake',
    category: 'intake',
    subtitle: 'Improved airflow and engine sound',
    overview: 'A cold air intake replaces your factory airbox...',
    sections: [
      {
        title: 'How It Works',
        type: 'text',
        content: '...'
      },
      {
        title: 'Expected Gains',
        type: 'gains',
        items: [
          { metric: 'Horsepower', value: '+5-15 HP', notes: '...' }
        ]
      },
      // ...
    ],
    difficulty: 'easy',
    typicalCost: { low: 200, high: 500 },
    installTime: '30 min - 1 hour',
    requiresTune: false,
  },
  // ... 48 more entries
];
```

### Categories

| Category | Modifications |
|----------|---------------|
| `intake` | Cold air intake, short ram intake |
| `exhaust` | Cat-back, axle-back, headers, downpipe |
| `tune` | ECU tune, piggyback, E85 |
| `suspension` | Coilovers, springs, sway bars |
| `brakes` | Pads, rotors, big brake kit |
| `cooling` | Radiator, oil cooler, intercooler |
| `forced-induction` | Turbo kit, supercharger |
| `drivetrain` | Short shifter, clutch, LSD |
| `aero` | Splitter, wing, diffuser |

**Used By:**
- Encyclopedia modification pages
- AL `get_upgrade_info` tool
- Tuning Shop education sections

---

## `upgradePackages.js`

**Purpose:** Pre-configured upgrade packages for the Tuning Shop.

### Package Tiers

| Tier | Target Use | Cost Range |
|------|------------|------------|
| `streetSport` | Street driving, canyon runs | $3,000 - $6,000 |
| `trackPack` | Track days, HPDE | $8,000 - $15,000 |
| `timeAttack` | Competitive time attack | $20,000 - $50,000+ |

### Structure

```javascript
export const genericPackages = [
  {
    key: 'streetSport',
    name: 'Street Sport Package',
    slug: 'street-sport',
    type: 'package',
    tier: 'streetSport',
    description: 'Enhanced street performance...',
    intendedUse: 'Spirited street driving...',
    estimatedCost: '$3,000 - $6,000',
    estimatedCostLow: 3000,
    estimatedCostHigh: 6000,
    deltas: {
      powerAccel: 1,
      gripCornering: 0.5,
      braking: 0.5,
      trackPace: 1,
      drivability: 0,
      reliabilityHeat: 0,
    },
    metricChanges: {
      hp: { delta: 15, percent: 5 },
      zeroToSixty: { delta: -0.2 },
    },
    includes: [
      'Performance air intake',
      'Cat-back exhaust',
      'ECU tune',
      'Lowering springs'
    ],
    considerations: [
      'May void warranty',
      'Slightly stiffer ride'
    ],
    carSlug: null, // Applies to all cars
    applicableLayouts: ['Front-Engine', 'Mid-Engine', 'Rear-Engine'],
  },
  // ...
];

export const carSpecificPackages = [
  // Car-specific overrides
];
```

**Used By:**
- Tuning Shop package selection
- PerformanceHub component
- Build cost estimators

---

## `connectedTissueMatrix.js`

**Purpose:** Legacy Encyclopedia structure (systems and components).

> **Note:** This is being phased out in favor of `lib/encyclopediaHierarchy.js` but is still used for some legacy navigation.

### Structure

```javascript
export const systems = [
  {
    id: 'engine',
    name: 'Engine',
    icon: '🔧',
    nodes: [
      { id: 'engine-block', name: 'Engine Block', type: 'component' },
      { id: 'cylinder-head', name: 'Cylinder Head', type: 'component' },
      // ...
    ]
  },
  // 14 systems total
];
```

**Used By:**
- Encyclopedia sidebar (legacy sections)
- Component relationship mapping

---

## `carUpgradeRecommendations.js`

**Purpose:** Car-specific modification recommendations.

### Structure

```javascript
export const carUpgradeRecommendations = {
  '718-cayman-gt4': {
    recommended: ['intake', 'exhaust', 'suspension'],
    notRecommended: ['turbo-kit'], // Already NA perfection
    notes: 'The GT4 is already track-focused...',
    popularMods: [
      { key: 'cat-back-exhaust', reason: 'Unleashes the flat-6 sound' },
      { key: 'coilovers', reason: 'Better track adjustability' },
    ],
  },
  // Per-car entries
};
```

**Used By:**
- AL `recommend_build` tool
- Tuning Shop car-specific suggestions
- Build recommendation engine

---

## `selectorDescriptors.js`

**Purpose:** UI text and guidance for Car Selector priority sliders.

### Structure

```javascript
export const priorityDescriptors = {
  sound: {
    label: 'Sound',
    shortDescription: 'How important is exhaust note and engine sound?',
    fullDescription: 'Emphasizes cars known for their exhaust note...',
    levels: {
      0: "You don't care about engine sound",
      0.5: "Sound is nice but won't make or break it",
      1: "You appreciate a good exhaust note",
      1.5: "You want a car that sounds good when you step on it",
      2: "An intoxicating exhaust note is part of the experience",
      2.5: "You want goosebumps every time you rev it",
      3: "You want the loudest, most visceral engine sound possible",
    },
    tips: [
      "V8s and flat-6s typically score highest for sound",
      // ...
    ],
    examples: {
      high: ['Ford Mustang GT', 'Porsche 911 GT3'],
      low: ['Tesla Model 3', 'Porsche Taycan'],
    },
  },
  // 7 categories total
};
```

### Helper Functions

```javascript
// Get descriptor text for slider value
getDescriptorForValue('sound', 2.5)
// → "You want goosebumps every time you rev it"

// Get priority badge label
getPriorityBadgeLabel(2.5)
// → "Critical"
```

**Used By:**
- Car Selector page
- Priority slider tooltips
- Recommendation explanations

---

## `performanceCategories.js`

**Purpose:** Performance bar definitions for PerformanceHub visualization.

### Structure

```javascript
export const performanceCategories = [
  {
    key: 'powerAccel',
    label: 'Power/Accel',
    description: 'Straight-line acceleration capability',
    icon: '⚡',
    color: '#ef4444',
  },
  {
    key: 'gripCornering',
    label: 'Grip/Cornering',
    description: 'Lateral grip and corner speed',
    icon: '🔄',
    color: '#f59e0b',
  },
  // 6 categories
];
```

**Used By:**
- PerformanceHub component
- Gran Turismo-style performance bars
- Upgrade impact visualization

---

## `upgradePricing.js`

**Purpose:** Cost estimates by brand tier and quality level.

### Structure

```javascript
export const brandTiers = {
  budget: {
    label: 'Budget',
    multiplier: 0.7,
    brands: ['eBay', 'Amazon generics', 'Unknown brands'],
  },
  mid: {
    label: 'Mid-Tier',
    multiplier: 1.0,
    brands: ['K&N', 'Mishimoto', 'BC Racing'],
  },
  premium: {
    label: 'Premium',
    multiplier: 1.5,
    brands: ['HKS', 'Öhlins', 'AP Racing'],
  },
};

export const categoryBasePrices = {
  'cold-air-intake': { low: 200, high: 400 },
  'cat-back-exhaust': { low: 600, high: 1500 },
  // ...
};
```

**Used By:**
- Build cost estimators
- Parts price displays
- Budget calculations

---

## `upgradeConflicts.js`

**Purpose:** Part conflict detection rules.

> **Note:** Currently a stub with no active conflicts. Ready for expansion.

### Structure

```javascript
// Check if upgrade conflicts with current selection
checkUpgradeConflict('turbo-kit', ['supercharger'])
// → { conflict: true, reason: 'Cannot have both forced induction' }

// Get conflicting upgrades
getConflictingUpgrades('turbo-kit')
// → ['supercharger']
```

**Used By:**
- Build planner validation
- Parts compatibility checker

---

## `upgradeTools.js`

**Purpose:** Tool requirements for each modification.

### Structure

```javascript
export const upgradeTools = {
  'cold-air-intake': {
    tools: ['Socket set', 'Screwdriver'],
    difficulty: 'easy',
    liftRequired: false,
  },
  'coilovers': {
    tools: ['Spring compressor', 'Jack stands', 'Torque wrench'],
    difficulty: 'medium',
    liftRequired: true,
  },
  // ...
};
```

**Used By:**
- DIY difficulty indicators
- Tool checklist displays

---

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Static Data Files                     │
│                      (data/*.js)                         │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Service Layer                         │
│              (lib/scoring.js, lib/upgrades.js)          │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Components                            │
│    (PerformanceHub, CarSelector, Encyclopedia)          │
└─────────────────────────────────────────────────────────┘
```

---

## Updating Static Data

When modifying static data files:

1. **Test locally** — Ensure imports still work
2. **Validate structure** — Match existing patterns
3. **Update counts** — Update this doc if adding entries
4. **Consider database** — Some data should be in DB instead

### When to Use Static vs Database

| Use Static Data | Use Database |
|-----------------|--------------|
| Category definitions | Car specifications |
| UI text/labels | User-generated content |
| Package templates | Parts with pricing |
| Scoring weights | Market data |
| Tool requirements | Community insights |

---

*See [FEATURES.md](FEATURES.md) for feature documentation and [DATABASE.md](DATABASE.md) for database schema.*













