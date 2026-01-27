# AutoRev Technical Systems Guide

> **How the calculation engines, algorithms, and data systems work**  
> **Version:** 1.0 | **Last Updated:** January 27, 2026

---

## Table of Contents

1. [Performance Calculator Engine](#1-performance-calculator-engine)
2. [Virtual Dyno System](#2-virtual-dyno-system)
3. [Lap Time Estimator](#3-lap-time-estimator)
4. [Performance Scoring System](#4-performance-scoring-system)
5. [Garage Score System](#5-garage-score-system)
6. [Data Calibration & Learning](#6-data-calibration--learning)
7. [Confidence Tier System](#7-confidence-tier-system)
8. [Build Progress Calculations](#8-build-progress-calculations)
9. [User Data Feedback Loop](#9-user-data-feedback-loop)

---

## 1. Performance Calculator Engine

### Overview

The Performance Calculator is the **single source of truth** for all HP/power calculations in AutoRev. It lives in `lib/performanceCalculator/` and handles:

- HP gain predictions from modifications
- Torque calculations with aspiration awareness
- Category caps and diminishing returns
- Tune hierarchy and overlap detection
- Conflict detection between incompatible mods

### How HP Gains Are Calculated

#### Step 1: Detect Engine Aspiration

The system first determines the engine type:

```
Engine String Analysis:
├── Contains "twin turbo", "biturbo", "tt" → TwinTurbo
├── Contains "turbo" → Turbo
├── Contains "supercharged", "sc" → Supercharged
└── Otherwise → NA (Naturally Aspirated)
```

**Why this matters:** Turbo engines respond dramatically differently to mods than NA engines. A tune on a turbo car can add 50-150 HP by increasing boost, while the same "tune" on an NA car only optimizes timing for 15-40 HP.

#### Step 2: Calculate Base Gains (Physics Model)

Each modification has a **percentage-based gain** relative to stock HP:

| Modification     | NA Engine | Turbo Engine |
| ---------------- | --------- | ------------ |
| Stage 1 Tune     | 5%        | 18%          |
| Stage 2 Tune     | 6%        | 35%          |
| Stage 3 Tune     | 8%        | 55%          |
| Cold Air Intake  | 3%        | 3%           |
| Downpipe         | 0%        | 5%           |
| Catback Exhaust  | 3%        | 2%           |
| Headers          | 5%        | 2%           |
| Turbo Upgrade    | N/A       | 25%          |
| Supercharger Kit | 50%       | N/A          |

**Example Calculation:**

```
Car: BMW M3 G80 (473 HP stock, Twin-Turbo)
Selected Mods: Stage 2 Tune + Downpipe + Intake

Stage 2 Tune: 473 × 0.35 = 165 HP
Downpipe: 473 × 0.05 = 24 HP
Intake: 473 × 0.03 = 14 HP
───────────────────────────────
Raw Total: 203 HP
```

#### Step 3: Apply Category Caps

The system prevents unrealistic stacking with category caps:

| Category      | NA Cap | Turbo Cap |
| ------------- | ------ | --------- |
| Exhaust Total | 50 HP  | 40 HP     |
| Intake Total  | 25 HP  | 30 HP     |
| Tune Total    | 40 HP  | 150 HP    |

#### Step 4: Handle Tune Hierarchy

Only **one tune applies** - they don't stack:

```
Tune Priority:
1. Stage 3 Tune (includes Stage 2 + Stage 1)
2. Stage 2 Tune (includes Stage 1)
3. Stage 1 Tune
4. Piggyback Tuner
```

If user selects both Stage 1 and Stage 2, only Stage 2 counts.

#### Step 5: Apply Overlap Modifiers

Stage tunes are **calibrated assuming supporting mods are installed**:

- Stage 2 assumes: Downpipe + Intake
- Stage 3 assumes: Downpipe + Intake + Turbo Upgrade + Intercooler

When both the tune AND supporting mods are selected, the mod gains are reduced by 50% to prevent double-counting:

```
Stage 2 Tune + Downpipe:
├── Tune gives full 35% gain (accounts for downpipe)
├── Downpipe gives 50% of its normal gain (overlap)
└── Result: Realistic total, not inflated
```

#### Step 6: Apply Diminishing Returns

Multiple mods in the same category don't fully stack:

```
Headers + Catback Exhaust:
├── Headers: Full gain (e.g., 25 HP)
├── Catback: 85% of stated gain (diminishing returns)
└── Both don't just add up - there's crossover
```

### Platform-Specific Calibration

Some cars have **forum-validated overrides** that trump the generic physics model:

```javascript
// Downpipe gains vary wildly by platform
BMW B58 (Supra, M340i): +35 HP (restrictive stock)
Audi RS5 2.9T: +8 HP (efficient stock downpipe)
Evo X: +40 HP (very restrictive stock)
Porsche 992 Turbo: +5 HP (already optimized)
```

These calibrations come from aggregating real dyno data from enthusiast forums.

---

## 2. Virtual Dyno System

### What It Does

The Virtual Dyno predicts wheel horsepower and torque curves for modified vehicles without requiring an actual dyno run.

### Calculation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    VIRTUAL DYNO FLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. STOCK BASELINE                                          │
│     └── Pull car's stock HP/TQ from database                │
│                                                             │
│  2. DRIVETRAIN LOSSES                                       │
│     ├── FWD: 12% loss                                       │
│     ├── RWD Manual: 15% loss                                │
│     ├── RWD Auto: 17% loss                                  │
│     ├── AWD Manual: 20% loss                                │
│     ├── AWD Auto: 22% loss                                  │
│     └── AWD DCT: 18% loss                                   │
│                                                             │
│  3. CALCULATE GAINS                                         │
│     └── Use Performance Calculator (Section 1)              │
│                                                             │
│  4. TORQUE CALCULATION                                      │
│     ├── NA: Torque gain = HP gain × 0.95                    │
│     ├── Turbo: Torque gain = HP gain × 1.20                 │
│     ├── TwinTurbo: Torque gain = HP gain × 1.25             │
│     └── Supercharged: Torque gain = HP gain × 1.10          │
│                                                             │
│  5. OUTPUT                                                  │
│     ├── Estimated WHP (wheel horsepower)                    │
│     ├── Estimated WTQ (wheel torque)                        │
│     ├── Confidence score (0.4 - 1.0)                        │
│     └── Calculation method used                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Why Turbo Cars Gain More Torque

Turbo engines gain disproportionately more torque than HP because:

1. **Boost increases torque throughout the rev range**, especially at lower RPM
2. **More air = more fuel = more torque** at every point in the powerband
3. **NA engines** are more RPM-dependent, so gains are more linear with HP

This is why we apply aspiration-specific torque multipliers.

### User Dyno Data Override

If a user has **actual dyno results**, those take precedence:

```javascript
if (userHasDynoResults) {
  return {
    estimatedWhp: userDynoData.whp,
    estimatedWtq: userDynoData.wtq,
    confidence: 1.0, // Verified data
    source: 'user_dyno',
  };
}
```

This is the highest confidence tier (Tier 1: Verified).

---

## 3. Lap Time Estimator

### Data-Driven Approach

The Lap Time Estimator uses **real lap time data** from our database rather than pure physics simulation. This is more accurate because:

1. Real data captures driver skill variance
2. Track-specific characteristics are baked in
3. We can show where the user's car compares to others

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                  LAP TIME ESTIMATION FLOW                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. FETCH TRACK STATISTICS                                  │
│     └── Query car_track_lap_times for this track            │
│                                                             │
│  2. BUILD DISTRIBUTION                                      │
│     ├── Calculate percentiles (P5, P25, P50, P65, P90)      │
│     ├── Separate stock vs modified times                    │
│     └── Compute HP-to-time correlation                      │
│                                                             │
│  3. APPLY DRIVER SKILL                                      │
│     ├── Professional: P5 (top 5%)                           │
│     ├── Advanced: P25 (top 25%)                             │
│     ├── Intermediate: P65 (middle of pack)                  │
│     └── Beginner: P90 (slower end)                          │
│                                                             │
│  4. CALCULATE MOD IMPROVEMENTS                              │
│     ├── Power: 1.5% per 50 HP gain (max 8%)                 │
│     ├── Tires: 2-10% based on compound                      │
│     ├── Suspension: 1-4% based on setup                     │
│     ├── Brakes: 0.5-1.5%                                    │
│     ├── Aero: 0.5-2.5%                                      │
│     └── Weight: 1% per 100 lbs                              │
│                                                             │
│  5. APPLY SKILL UTILIZATION                                 │
│     ├── Pro: Uses 95% of mod potential                      │
│     ├── Advanced: Uses 80% of mod potential                 │
│     ├── Intermediate: Uses 50% of mod potential             │
│     └── Beginner: Uses 20% of mod potential                 │
│                                                             │
│  6. OUTPUT                                                  │
│     ├── Estimated stock lap time                            │
│     ├── Estimated modified lap time                         │
│     ├── Time improvement breakdown by category              │
│     └── Comparison to track fastest/median                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Driver Skill Modifiers

A key insight: **mods only help as much as the driver can extract**.

| Skill Level  | Percentile    | Mod Utilization | Description                |
| ------------ | ------------- | --------------- | -------------------------- |
| Beginner     | 90th (slower) | 20%             | 0-2 years track experience |
| Intermediate | 65th          | 50%             | 2-5 years, consistent laps |
| Advanced     | 25th          | 80%             | 5+ years, pushing limits   |
| Professional | 5th (fastest) | 95%             | Instructor / racer         |

**Example:**

```
Track pack gives theoretical 5 second improvement
├── Pro driver: Actually gains 4.75 seconds
├── Intermediate driver: Actually gains 2.5 seconds
└── Beginner driver: Actually gains 1.0 second
```

### Modification Impact Factors

```javascript
// Percentage improvement to lap time
MOD_IMPACT = {
  power: {
    perHpGain: 0.015, // 1.5% per 50hp
    maxImprovement: 0.08, // Cap at 8%
  },
  tires: {
    'all-season': 0,
    summer: 0.02, // 2% faster
    'max-performance': 0.04,
    'r-comp': 0.07,
    slick: 0.1, // 10% faster
  },
  suspension: {
    stock: 0,
    'lowering-springs': 0.01,
    coilovers: 0.025,
    'coilovers-race': 0.04,
  },
};
```

### Fallback When No Data Exists

If a track has fewer than 5 lap times in our database, we return:

```javascript
{
  source: 'unavailable',
  note: 'Insufficient lap time data for this track.
         Log your times to help build the database!'
}
```

This encourages user contributions.

---

## 4. Performance Scoring System

### The 7 Performance Categories

AutoRev uses a **Gran Turismo-style** scoring system with 7 categories:

| Category                 | What It Measures        | Key Metrics                |
| ------------------------ | ----------------------- | -------------------------- |
| **Power & Acceleration** | Straight-line speed     | HP, torque, 0-60, 1/4 mile |
| **Grip & Cornering**     | Mechanical grip         | Lateral G, weight, tires   |
| **Braking**              | Stopping power          | 60-0 distance, brake size  |
| **Track Pace**           | Overall lap capability  | Composite of above         |
| **Drivability**          | Daily usability         | Ride quality, comfort      |
| **Reliability**          | Durability under stress | Cooling, known issues      |
| **Sound & Emotion**      | Exhaust character       | Engine type, exhaust       |

### Scoring Philosophy: Leave Headroom

**Critical design decision:** Stock cars score **5-8**, not 8-10.

Why? Because if a stock Porsche 911 GT3 scores 10/10 on Grip, there's no room to show improvement when someone adds R-compound tires and track coilovers.

```
Score Distribution:
├── 1-3: Poor / Below Average
├── 4-5: Average (entry sports cars)
├── 6-7: Good (solid sports cars)
├── 8-9: Excellent (reserved for MODIFIED cars)
└── 10: Exceptional (heavily modified)
```

### Score Calculation: Power & Acceleration

```javascript
function calculatePowerScore(car) {
  // Primary: Use 0-60 time
  if (car.zeroToSixty) {
    // 2.5s = 7.5, 4.0s = 6.0, 5.0s = 5.0
    score = 10 - car.zeroToSixty * 1.0;
  }

  // HP bonus for perceived power
  if (car.hp >= 700) score += 0.5;
  else if (car.hp >= 600) score += 0.3;
  else if (car.hp >= 500) score += 0.2;

  // Cap stock cars at 8.0
  return Math.min(score, 8.0);
}
```

### Score Calculation: Grip & Cornering

```javascript
function calculateGripScore(car) {
  if (car.lateralG) {
    // 0.90g = 5.0, 1.00g = 6.0, 1.10g = 7.0
    // 1.20g = 8.0 (R-compound), 1.30g = 9.0 (slicks)
    score = 4 + (car.lateralG - 0.85) * 12;
  }

  // Cap stock street cars at 7.5
  return Math.min(score, 7.5);
}
```

### Score Calculation: Braking

```javascript
function calculateBrakingScore(car) {
  if (car.braking60To0) {
    // 80ft = 9.4, 95ft = 7.6, 110ft = 5.8
    score = 19 - car.braking60To0 * 0.12;
  }

  // Cap stock cars at 7.5
  return Math.min(score, 7.5);
}
```

### How Upgrades Affect Scores

Each upgrade package/module has **delta values** that add to base scores:

```javascript
trackPack = {
  deltas: {
    powerAccel: +1.5,
    gripCornering: +2.0,
    braking: +2.0,
    trackPace: +2.5,
    drivability: -1.0, // Trade-off: stiffer ride
    reliabilityHeat: +1.5,
    soundEmotion: +2.0,
  },
};
```

Final scores are clamped to 1-10 range.

---

## 5. Garage Score System

### What It Measures

The Garage Score (0-100) measures how completely a user has documented their vehicle in the system.

### Scoring Breakdown

| Category            | Max Points | How to Earn                                          |
| ------------------- | ---------- | ---------------------------------------------------- |
| **Specs Confirmed** | 20         | Verify vehicle specs are accurate                    |
| **Build Saved**     | 15         | Save a build in Tuning Shop                          |
| **Build Shared**    | 25         | Share build to community                             |
| **Parts Specified** | 25         | Add parts with brand/model (1-2 = 10pts, 3+ = 25pts) |
| **Photos Uploaded** | 15         | Upload photos of YOUR car                            |

### Score Levels

| Score | Level           | Color |
| ----- | --------------- | ----- |
| 0-19  | New             | Gray  |
| 20-39 | Beginner        | Gray  |
| 40-59 | Getting Started | Blue  |
| 60-79 | Intermediate    | Blue  |
| 80-99 | Advanced        | Teal  |
| 100   | Complete        | Teal  |

### How It's Calculated

The score is calculated by a PostgreSQL function (`calculate_garage_score`) that:

1. Checks if specs are confirmed
2. Counts saved builds linked to vehicle
3. Checks if any builds are shared to community
4. Counts parts with brand/model details
5. Counts uploaded photos

---

## 6. Data Calibration & Learning

### The Calibration Hierarchy

AutoRev uses a **tiered calibration system** where more specific data overrides generic calculations:

```
┌─────────────────────────────────────────────────────────────┐
│               CALIBRATION HIERARCHY                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TIER 1: USER VERIFIED (Confidence: 0.90-0.99)              │
│  ├── User's actual dyno results                             │
│  ├── User's logged lap times                                │
│  └── Source: user_dyno_results, user_track_times            │
│                                                             │
│  TIER 2: PLATFORM CALIBRATED (Confidence: 0.70-0.85)        │
│  ├── Forum-aggregated dyno data for specific platforms      │
│  ├── Real lap times from car_track_lap_times                │
│  └── Source: car_dyno_runs, car_track_lap_times             │
│                                                             │
│  TIER 3: PHYSICS MODEL (Confidence: 0.55-0.70)              │
│  ├── Percentage-based HP gains by aspiration                │
│  ├── Empirical formulas (0-60, 1/4 mile)                    │
│  └── Source: lib/performanceCalculator                      │
│                                                             │
│  TIER 4: GENERIC FALLBACK (Confidence: 0.40-0.50)           │
│  ├── Rule-of-thumb estimates                                │
│  ├── Used when no other data available                      │
│  └── Source: upgrade metricChanges defaults                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Sources for Calibration

| Data Type          | Source                           | Update Frequency |
| ------------------ | -------------------------------- | ---------------- |
| Dyno Runs          | Forum scraping, user submissions | Ongoing          |
| Lap Times          | Fastestlaps, user logs, forums   | Ongoing          |
| Community Insights | Forum AI extraction              | Bi-weekly        |
| HP Gain Estimates  | Physics model + forum validation | As needed        |

### Forum Intelligence System

AutoRev scrapes enthusiast forums (Bimmerpost, Rennlist, FT86Club, etc.) and uses AI to extract structured insights:

```
Forum Thread → AI Extraction → Structured Insight
                    │
                    ├── known_issue
                    ├── maintenance_tip
                    ├── modification_guide
                    ├── troubleshooting
                    ├── buying_guide
                    ├── performance_data ← Dyno numbers!
                    ├── reliability_report
                    └── cost_insight
```

When we extract a `performance_data` insight with dyno numbers, those can be used to calibrate our physics model.

### How Real Data Refines Calculations

**Example: Downpipe Calibration**

1. **Physics model says:** Downpipe adds 5% HP on turbo cars
2. **Forum data shows:** BMW B58 engines gain 35 HP from downpipe (7.5%)
3. **Calibration:** Add platform-specific override for B58

```javascript
// Platform-specific downpipe gains (forum-validated)
DOWNPIPE_GAINS = {
  'bmw-b58': 35, // Restrictive stock
  'audi-ea839': 8, // Already efficient
  'mitsubishi-4b11t': 40, // Very restrictive
  'porsche-9a2': 5, // Already optimized
};
```

---

## 7. Confidence Tier System

### Why Confidence Matters

Not all predictions are equally reliable. The confidence system tells users how much to trust an estimate.

### Tier Definitions

| Tier | Label       | Confidence Range | When Used                     |
| ---- | ----------- | ---------------- | ----------------------------- |
| 1    | Verified    | 0.90-0.99        | User has actual dyno/lap data |
| 2    | Calibrated  | 0.70-0.85        | Platform-specific forum data  |
| 3    | Estimated   | 0.55-0.70        | Physics model with aspiration |
| 4    | Approximate | 0.40-0.50        | Generic fallback              |

### How Confidence Is Calculated

The system tracks the **lowest confidence** method used:

```javascript
// Start with physics tier
let minConfidence = CONFIDENCE_TIERS.PHYSICS.max; // 0.70

for (const mod of selectedMods) {
  if (hasPlatformOverride(mod, car)) {
    // Calibrated data is better
    minConfidence = Math.min(minConfidence, 0.75);
  } else if (hasPhysicsModel(mod)) {
    minConfidence = Math.min(minConfidence, 0.65);
  } else {
    // Fallback to generic
    minConfidence = Math.min(minConfidence, 0.45);
  }
}
```

### Displaying Confidence to Users

```
Projected HP: 580 HP (+107)
Confidence: ████████░░ Calibrated (75%)

"Based on real dyno data from BMW B58 builds"
```

---

## 8. Build Progress Calculations

### The Three Progress Rings

The Tuning Shop shows three progress rings for each build:

| Ring            | Measures                    | Max Potential             |
| --------------- | --------------------------- | ------------------------- |
| **Power**       | HP gains vs max achievable  | Aspiration-based          |
| **Handling**    | Handling mod coverage       | 100 (starts at 50 stock)  |
| **Reliability** | Support mods vs power level | 100 (degrades with power) |

### Power Ring: Max Potential by Aspiration

```javascript
MAX_HP_GAIN_PERCENT = {
  'Turbo': 0.70,        // 70% of stock HP achievable
  'TwinTurbo': 0.70,
  'Supercharged': 0.50, // 50% of stock HP
  'NA': 0.25            // 25% without adding FI
}

// Example: 400 HP turbo car
maxGain = 400 × 0.70 = 280 HP achievable
currentGain = 150 HP
powerProgress = 150 / 280 = 54%
```

### Handling Ring: Category Points

Stock vehicles start at **50%** (they handle fine stock). Mods add points:

| Category     | Max Points | Mods                                                                    |
| ------------ | ---------- | ----------------------------------------------------------------------- |
| Suspension   | 20         | Track coilovers (18), street coilovers (12), springs (6), sway bars (3) |
| Brakes       | 15         | BBK (10), track pads (4), fluid (2), lines (2)                          |
| Tires/Wheels | 10         | R-compound (8), performance (5), lightweight wheels (3)                 |
| Chassis      | 5          | Roll cage (4), bracing (2)                                              |

```
Stock car: 50%
+ Track coilovers: +18 → 68%
+ BBK: +10 → 78%
+ R-compound tires: +8 → 86%
```

### Reliability Ring: Power Penalty + Support Bonus

**Philosophy:** Adding power stresses the engine. Support mods restore reliability.

```javascript
// Power penalty: 5% per 10% HP gain
powerPenalty = hpGainPercent × 50;

// Support bonuses
if (hasIntercooler) supportBonus += 12;
if (hasOilCooler) supportBonus += 6;
if (hasFuelUpgrade) supportBonus += 6;
if (hasCatchCan) supportBonus += 3;

reliabilityScore = 100 - powerPenalty + supportBonus;
```

**Example:**

```
25% HP gain → -12.5% reliability
+ Intercooler (+12%) + Oil cooler (+6%)
= 100 - 12.5 + 18 = 105.5 → capped at 100
```

### Reliability Warnings

The system generates warnings when builds are unbalanced:

```javascript
if (netPenalty > 20 && !hasIntercooler) {
  warn('Significant power gains without intercooler may cause heat soak');
}

if (hpGainPercent > 0.4 && !hasFuelUpgrade) {
  warn('40%+ HP gain may benefit from fuel system upgrades');
}
```

---

## 9. User Data Feedback Loop

### How User Data Improves the System

```
┌─────────────────────────────────────────────────────────────┐
│                USER DATA FEEDBACK LOOP                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  USER ACTIONS                     SYSTEM BENEFITS           │
│  ───────────────                  ───────────────           │
│                                                             │
│  Logs dyno results      ───────►  Calibrates HP models      │
│  ├── user_dyno_results            for specific platforms    │
│  └── Tier 1 confidence                                      │
│                                                             │
│  Logs lap times         ───────►  Builds track baselines    │
│  ├── user_track_times             for estimation            │
│  └── Track stats improve                                    │
│                                                             │
│  Shares builds          ───────►  Validates mod combos      │
│  ├── community_posts              Real-world proof          │
│  └── user_projects                                          │
│                                                             │
│  Reports issues         ───────►  Identifies calculation    │
│  ├── user_feedback                bugs or bad data          │
│  └── Triggers review                                        │
│                                                             │
│  Answers questionnaire  ───────►  Personalizes AL advice    │
│  ├── user_questionnaire           Tailored recommendations  │
│  └── user_profile_summary                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Dyno Data Processing

When a user logs dyno results:

1. **Stored** in `user_dyno_results` linked to their vehicle
2. **Used immediately** for that user's calculations (Tier 1)
3. **Aggregated** (if permission given) into `car_dyno_runs` for platform calibration
4. **Analyzed** to identify outliers or calibration opportunities

### Lap Time Data Processing

When a user logs a lap time:

1. **Stored** in `user_track_times` with track, conditions, mods
2. **Updates track statistics** (percentiles, HP correlation)
3. **Improves estimates** for all users on that track
4. **Tracks personal progress** over time

### The Virtuous Cycle

```
More users log data
       ↓
Better calibrations
       ↓
More accurate predictions
       ↓
More trust in the system
       ↓
More users log data
       ↓
(repeat)
```

---

## Appendix A: Key Formulas

### 0-60 Time Estimation

```javascript
// Physics-based with drivetrain and traction factors
k = 0.22;  // Calibration constant
powerToWeight = weight / effectiveWHP;
baseTime = k × (powerToWeight ^ 0.85) + 1.5;
shiftPenalty = shiftTime × gearsTo60;
finalTime = (baseTime + shiftPenalty) × 1.08;  // Real-world factor
```

### Quarter Mile Time

```javascript
// Classic drag formula with corrections
ET = 5.825 × (weight / whp) ^ 0.333;
trapSpeed = 234 × (whp / weight) ^ 0.333;

// AWD bonus
if (drivetrain === 'AWD') ET -= 0.2;
```

### Braking Distance

```javascript
// Physics: d = v² / (2 × μ × g)
// v = 60 mph = 88 ft/s
// g = 32.2 ft/s²
baseDistance = (88²) / (2 × tireGrip × 32.2);
finalDistance = baseDistance - brakeUpgradeBonus;
```

### Lateral G

```javascript
// Tire compound is primary factor (60%)
if (tireGrip > 0.95) {
  gripBonus = (tireGrip / 0.95 - 1) × 0.80;
}

// Suspension adds 2-6%
if (hasTrackCoilovers) multiplier += 0.06;
else if (hasCoilovers) multiplier += 0.04;

newLateralG = stockLateralG × multiplier;
```

---

## Appendix B: Database Tables Used

| Table                 | Used For                              |
| --------------------- | ------------------------------------- |
| `cars`                | Stock specs (HP, weight, 0-60, etc.)  |
| `car_dyno_runs`       | Platform calibration data             |
| `car_track_lap_times` | Track baseline statistics             |
| `car_tuning_profiles` | Upgrade recommendations               |
| `user_vehicles`       | User's owned cars with mods           |
| `user_projects`       | Saved builds from Tuning Shop         |
| `user_dyno_results`   | User's actual dyno numbers            |
| `user_track_times`    | User's logged lap times               |
| `community_insights`  | Forum-extracted performance data      |
| `tracks`              | Track metadata for lap time estimates |

---

## Appendix C: File Locations

| Component                | File Path                                        |
| ------------------------ | ------------------------------------------------ |
| Main HP Calculator       | `lib/performanceCalculator/hpCalculator.js`      |
| Constants & Caps         | `lib/performanceCalculator/constants.js`         |
| Metrics (0-60, 1/4 mile) | `lib/performanceCalculator/metricsCalculator.js` |
| Score Calculator         | `lib/performanceCalculator/scoreCalculator.js`   |
| Conflict Detector        | `lib/performanceCalculator/conflictDetector.js`  |
| Lap Time Service         | `lib/lapTimeService.js`                          |
| Physics Models           | `lib/performancePhysics.js`                      |
| Garage Score             | `lib/garageScoreService.js`                      |
| Dashboard Scores         | `lib/dashboardScoreService.js`                   |
| Upgrade Packages         | `data/upgradePackages.js`                        |
| Performance Categories   | `data/performanceCategories.js`                  |

---

_Document Version 1.0 — January 27, 2026_
