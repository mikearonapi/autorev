# Data Asset Inventory
## AutoRev - OEM-Spec Audit

> **Created:** December 8, 2024  
> **Purpose:** Comprehensive inventory of all data and algorithm assets for audit validation  
> **Reference Standard:** OEM Specifications

---

## 1. Executive Summary

| Domain | Assets | Data Records | Algorithms | Validation Scripts |
|--------|--------|--------------|------------|-------------------|
| Car Selector | 4 | 50+ vehicles | 2 | 1 |
| Performance Hub | 6 | 100+ upgrades | 5 | 1 |
| Education | 3 | 14 systems, 50+ nodes | 4 | 0 |
| **Total** | **13** | **200+ records** | **11** | **2** |

---

## 2. Car Selector Domain

### 2.1 Vehicle Master Database

| Asset | File Path | Format | Records | SSOT Field |
|-------|-----------|--------|---------|------------|
| **Car Data** | `data/cars.js` | JavaScript/JSON | 50+ vehicles | ✅ Yes |
| **Database Schema** | `supabase/schema.sql` | SQL | N/A | ✅ Yes |

#### 2.1.1 Car Data Structure (`data/cars.js`)

**Required Fields (per vehicle):**
- `id` - Unique identifier
- `name` - Display name (e.g., "718 Cayman GT4")
- `slug` - URL-friendly identifier
- `years` - Year range
- `tier` - Price tier: premium | upper-mid | mid | budget
- `category` - Layout: Mid-Engine | Front-Engine | Rear-Engine
- `engine` - Engine description (e.g., "4.0L NA Flat-6")
- `hp` - Peak horsepower
- `trans` - Transmission options
- `priceRange` - Display price
- `priceAvg` - Average price (numeric)

**Advisory Scores (1-10 scale):**
- `sound` - Exhaust note, engine character
- `interior` - Materials, technology
- `track` - Lap times, handling, cooling
- `reliability` - Ownership costs, issues
- `value` - Performance per dollar
- `driverFun` - Steering feel, connection
- `aftermarket` - Tuning support

**Hard Metrics (OEM-verifiable):**
- `torque` - Peak torque (lb-ft)
- `curbWeight` - Curb weight (lbs)
- `zeroToSixty` - 0-60 time (seconds)
- `quarterMile` - Quarter mile time
- `braking60To0` - 60-0 distance (feet)
- `lateralG` - Maximum lateral G
- `drivetrain` - RWD | AWD | FWD

**Performance Hub Scores (1-10 scale):**
- `perfPowerAccel` - Power & Acceleration
- `perfGripCornering` - Grip & Cornering
- `perfBraking` - Braking performance
- `perfTrackPace` - Overall track pace
- `perfDrivability` - Drivability & Comfort
- `perfReliabilityHeat` - Reliability & Heat Management
- `perfSoundEmotion` - Sound & Emotion

### 2.2 Scoring Algorithms

| Algorithm | File Path | Purpose | Inputs | Outputs |
|-----------|-----------|---------|--------|---------|
| **Car Scoring** | `lib/scoring.js` | Match cars to user preferences | User weights, car scores | Ranked car list |
| **Performance Mapping** | `data/performanceCategories.js` | Map hard metrics to perf scores | Car specs | Performance profile |

#### 2.2.1 Advisory Categories Definition

```javascript
// From data/cars.js - categories array
const categories = [
  { key: 'sound', label: 'Sound', desc: 'Exhaust note, engine character' },
  { key: 'interior', label: 'Interior', desc: 'Materials quality, technology' },
  { key: 'track', label: 'Track', desc: 'Lap times, handling limits' },
  { key: 'reliability', label: 'Reliability', desc: 'Ownership costs, issues' },
  { key: 'value', label: 'Value', desc: 'Performance per dollar' },
  { key: 'driverFun', label: 'Driver Fun', desc: 'Steering feel, connection' },
  { key: 'aftermarket', label: 'Aftermarket', desc: 'Tuning support, parts' }
];
```

---

## 3. Performance Hub Domain

### 3.1 Upgrade Data Assets

| Asset | File Path | Format | Records | SSOT Field |
|-------|-----------|--------|---------|------------|
| **Upgrade Packages** | `data/upgradePackages.js` | JavaScript | 4 packages + 50+ modules | ✅ Yes |
| **Upgrade Encyclopedia** | `data/upgradeEducation.js` | JavaScript | 60+ educational entries | ✅ Yes |
| **Upgrade Pricing** | `data/upgradePricing.js` | JavaScript | Brand-specific overrides | ✅ Yes |
| **Car Recommendations** | `data/carUpgradeRecommendations.js` | JavaScript | 30+ car-specific recs | ✅ Yes |
| **Performance Categories** | `data/performanceCategories.js` | JavaScript | 7 categories | ✅ Yes |

### 3.2 Upgrade Packages Structure (`data/upgradePackages.js`)

**Generic Packages (4 tiers):**
1. `streetSport` - Enhanced street performance ($3-6K)
2. `trackPack` - Serious track capability ($12-20K)
3. `timeAttack` - Maximum NA performance ($25-40K)
4. `ultimatePower` - Forced induction builds ($15-35K+)

**Package Fields:**
- `key`, `name`, `slug` - Identifiers
- `tier` - streetSport | trackPack | timeAttack | ultimatePower
- `deltas` - Performance score changes per category
- `metricChanges` - Hard metric changes (HP, 0-60, etc.)
- `includes` - Description of included upgrades
- `includedUpgradeKeys` - Canonical keys mapping to encyclopedia
- `considerations` - Trade-offs and notes
- `applicableLayouts` - Mid-Engine | Front-Engine | Rear-Engine

### 3.3 Upgrade Modules Structure

**Module Categories:**
- `power` - Engine bolt-ons, tunes
- `forcedInduction` - Superchargers, turbos
- `exhaust` - Headers, cat-backs
- `chassis` - Coilovers, springs, sway bars
- `brakes` - Pads, BBK, fluid
- `cooling` - Oil coolers, radiators
- `wheels` - Lightweight wheels, tires
- `aero` - Splitters, wings

**Module Fields:**
- `key`, `name`, `slug` - Identifiers
- `category` - Module category
- `tier` - Applicable package tier
- `estimatedCostLow`, `estimatedCostHigh` - Price range
- `deltas` - Performance score changes
- `metricChanges` - HP gain, braking improvement, etc.
- `requires` - Hard dependencies (other upgrade keys)
- `stronglyRecommended` - Soft dependencies
- `applicableEngines` - Engine type compatibility
- `applicableLayouts` - Chassis layout compatibility

### 3.4 Performance Algorithms

| Algorithm | File Path | Function | OEM-Verifiable |
|-----------|-----------|----------|----------------|
| **Engine Type Detection** | `data/upgradePackages.js` | `getEngineType(car)` | ✅ |
| **HP Gain Multiplier** | `data/upgradePackages.js` | `getHpGainMultiplier(car, upgrade)` | ⚠️ Empirical |
| **Upgrade Compatibility** | `data/upgradePackages.js` | `isUpgradeCompatible(car, upgrade)` | ✅ |
| **Realistic HP Calculation** | `data/upgradePackages.js` | `calculateRealisticHpGain(car, upgrades)` | ⚠️ Empirical |
| **Performance Mapping** | `data/performanceCategories.js` | `mapCarToPerformanceScores(car)` | ⚠️ Derived |

#### 3.4.1 Engine Type Detection Logic

```javascript
// Patterns detected in getEngineType():
// Supercharged: 'sc', 'supercharged' → SC V8, SC V6
// Turbocharged: 'turbo', 'tt', 'biturbo' → Turbo V8, V6, I6, I4, Flat-6
// NA engines: By cylinder config → NA V8, V6, I6, I4, Flat-6, V10, V12
```

#### 3.4.2 HP Gain Multiplier Scaling

| Engine Type | FI Upgrades | NA Bolt-Ons |
|-------------|-------------|-------------|
| NA V8 (>500hp) | 1.2x | 1.0x |
| NA V8 (400-500hp) | 1.0x | 1.0x |
| NA V8 (<400hp) | 0.85x | 1.0x |
| NA V6 | 0.7x | 0.75x |
| NA Flat-6 | 0.5x | 0.8x |
| Turbo engines | 0x (already FI) | 1.3x |
| SC engines | 0x (already FI) | 1.1x |

### 3.5 Upgrade Encyclopedia Structure (`data/upgradeEducation.js`)

**60+ Upgrade Entries with:**
- `key`, `name` - Identifiers
- `category` - Upgrade category
- `tier` - streetSport | trackPack | timeAttack | ultimatePower
- `shortDescription` - Brief summary
- `fullDescription` - Detailed explanation
- `howItWorks` - Technical explanation
- `expectedGains` - HP, torque, notes
- `cost` - Price range with low/high
- `difficulty` - Installation difficulty
- `installTime` - Time estimate
- `requiresTune` - Boolean
- `requiresProInstall` - Boolean
- `streetLegal` - Legal status
- `riskLevel` - low | medium | high
- `pros`, `cons` - Lists
- `bestFor` - Ideal use cases
- `worksWellWith` - Synergistic upgrades
- `considerations` - Important notes
- `brands` - Recommended brands

### 3.6 Car-Specific Recommendations (`data/carUpgradeRecommendations.js`)

**30+ Vehicle Entries with:**
- `defaultTier` - Recommended starting tier
- `tiers` - Tier-specific recommendations:
  - `mustHave` - Essential upgrades
  - `recommended` - Strongly recommended
  - `niceToHave` - Optional enhancements
  - `narrative` - Explanation
- `platformNotes` - Car-specific considerations
- `knownIssues` - Reliability concerns

---

## 4. Education Domain

### 4.1 Education Assets

| Asset | File Path | Format | Records |
|-------|-----------|--------|---------|
| **Connected Tissue Matrix** | `data/connectedTissueMatrix.js` | JavaScript | 14 systems, 50+ nodes |
| **Dependency Checker** | `lib/dependencyChecker.js` | JavaScript | Validation algorithms |
| **Unified Upgrade API** | `lib/upgrades.js` | JavaScript | Merge layer |

### 4.2 Connected Tissue Matrix Structure

#### 4.2.1 Systems (14 Top-Level)

```javascript
// Core vehicle systems defined in connectedTissueMatrix.js
systems = {
  powertrain: 'Engine, ECU, and power delivery',
  fueling: 'Fuel delivery, injectors, pumps',
  ignition: 'Spark plugs, coils, timing',
  exhaust: 'Headers, catalytic converters, mufflers',
  cooling: 'Radiator, oil cooler, intercooler',
  induction: 'Intake, turbo/supercharger, boost control',
  drivetrain: 'Clutch, transmission, differential',
  brakes: 'Calipers, rotors, pads, fluid',
  suspension: 'Springs, dampers, control arms',
  tires: 'Tire compound, size, wheel weight',
  chassis: 'Alignment, roll center, camber',
  aero: 'Downforce, drag, balance',
  electronics: 'ECU, traction control, ABS',
  safety: 'Occupant protection, track prep'
};
```

#### 4.2.2 Nodes (50+ Components)

**Node Structure:**
- `key` - System.attribute format (e.g., `powertrain.boost_level`)
- `system` - Parent system
- `name` - Display name
- `description` - What this node represents
- `unit` - Measurement unit (psi, degrees, ratio, etc.)
- `applicableEngines` - Engine type restrictions (optional)

**Key Powertrain Nodes:**
- `powertrain.boost_level` - Boost pressure (Turbo/SC only)
- `powertrain.timing_advance` - Ignition timing
- `powertrain.air_fuel_ratio` - AFR ratio
- `powertrain.cylinder_pressure` - Peak combustion pressure
- `powertrain.torque_output` - Engine torque
- `powertrain.hp_output` - Engine power
- `powertrain.bottom_end_strength` - Internal strength rating

#### 4.2.3 Dependency Rules

**Rule Types:**
- `requires` - Hard dependency (must have)
- `stresses` - Increases load on component
- `invalidates` - Requires recalibration
- `modifies` - Changes behavior
- `compromises` - May negatively affect

### 4.3 Dependency Checker Algorithms (`lib/dependencyChecker.js`)

| Algorithm | Function | Purpose |
|-----------|----------|---------|
| **Validate Selection** | `validateUpgradeSelection(keys, car, options)` | Check all dependencies |
| **Get Recommendations** | `getRecommendedUpgrades(keys, car)` | Suggest supporting mods |
| **Get Required** | `getRequiredUpgrades(keys, car)` | Find hard dependencies |
| **Impact Summary** | `getUpgradeImpactSummary(upgradeKey)` | Show system effects |
| **System Overview** | `getSystemImpactOverview(keys)` | Aggregate impact by system |

**Severity Levels:**
- `CRITICAL` - Must address before proceeding
- `WARNING` - Should address for optimal results
- `INFO` - Nice to know / optimization opportunity
- `POSITIVE` - Good synergy detected

### 4.4 Positive Synergies Detected

```javascript
// checkPositiveSynergies() detects:
1. Full Bolt-On Package: intake + exhaust + tune
2. Track-Ready Tire & Brake Package: track tires + track brakes
3. Complete Chassis Package: suspension + alignment/sway bars
4. Power with Proper Cooling: high-power mod + cooling upgrades
```

---

## 5. Cross-Domain Relationships

### 5.1 Data Flow Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   cars.js       │────▶│  scoring.js      │────▶│  Car Selector   │
│  (50+ vehicles) │     │  (Match algo)    │     │  (UI/Rankings)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │
        │ car object
        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ upgradePackages │────▶│ performance.js   │────▶│ Performance Hub │
│ (modules/pkgs)  │     │ (HP calcs, etc.) │     │ (Build Configs) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │
        │ upgrade keys
        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ connectedTissue │────▶│ dependencyChecker│────▶│ Dep Warnings    │
│ Matrix (graph)  │     │ (Validation)     │     │ (UI Alerts)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### 5.2 Key Mapping Tables

**Module Key → Education Key (from `lib/upgrades.js`):**

| Module Key | Education Key |
|------------|---------------|
| `intake` | `cold-air-intake` |
| `exhaust-catback` | `cat-back-exhaust` |
| `tune-street` | `ecu-tune` |
| `tune-track` | `ecu-tune` |
| `stage1-tune` | `ecu-tune` |
| `coilovers-street` | `coilovers` |
| `coilovers-track` | `coilovers` |
| `brake-pads-street` | `brake-pads-performance` |
| `brake-pads-track` | `brake-pads-performance` |
| `wheels-lightweight` | `lightweight-wheels` |
| `tires-performance` | `performance-tires` |
| `tires-track` | `competition-tires` |

---

## 6. Existing Validation Scripts

### 6.1 Car Data Audit (`scripts/audit-car-data.js`)

**Validates:**
- ✅ Required fields present
- ✅ Advisory scores (7 categories, 1-10 range)
- ✅ Performance Hub scores (7 categories, 1-10 range)
- ✅ Hard metrics presence
- ✅ Content fields (notes, highlight, pros/cons)
- ✅ Performance score vs hard metric alignment

**Output:**
- Missing required fields count
- Missing/out-of-range scores
- Hard metric coverage
- Score/metric mismatches

### 6.2 Upgrade Validation (`scripts/validate-upgrades.js`)

**Validates:**
- ✅ Generic package `includedUpgradeKeys` resolve
- ✅ Module dependencies (`requires`, `stronglyRecommended`) resolve
- ✅ Car recommendation keys resolve
- ✅ Encyclopedia entry completeness
- ✅ Cross-reference analysis (keys in modules vs education)

**Output:**
- Unresolved upgrade keys
- Incomplete encyclopedia entries
- Keys only in modules or only in education
- Test car scenario results

---

## 7. Audit Priority Matrix

### 7.1 Critical OEM-Verifiable Data

| Data Point | Source File | OEM Reference |
|------------|-------------|---------------|
| Engine specs (HP, torque) | `cars.js` | Manufacturer spec sheets |
| 0-60 times | `cars.js` | Manufacturer press releases |
| Braking distances | `cars.js` | Third-party tests (C&D, MT) |
| Curb weights | `cars.js` | EPA/manufacturer specs |
| Engine types/codes | `cars.js` | Service manuals |
| Drivetrain configuration | `cars.js` | VIN decoder/specs |
| Transmission types | `cars.js` | Manufacturer specs |

### 7.2 Empirical/Expert Data

| Data Point | Source File | Validation Method |
|------------|-------------|-------------------|
| HP gain estimates | `upgradePackages.js` | Dyno data, tuner reports |
| Upgrade costs | `upgradePackages.js`, `upgradePricing.js` | Vendor pricing |
| Compatibility rules | `upgradePackages.js` | Service manuals, forums |
| Dependency relationships | `connectedTissueMatrix.js` | Engineering analysis |
| Subjective scores | `cars.js` | Expert review, community |

### 7.3 Risk Assessment

| Risk Level | Count | Examples |
|------------|-------|----------|
| **High** | ~15 | HP claims, torque values, 0-60 times |
| **Medium** | ~25 | Upgrade gain estimates, compatibility |
| **Low** | ~30 | Pricing, subjective scores, descriptions |

---

## 8. Next Steps

### 8.1 Immediate Actions
1. ☐ Define quantitative accuracy thresholds per domain
2. ☐ Build OEM reference dataset for top-priority vehicles
3. ☐ Create audit tracking schema for evidence capture

### 8.2 Audit Execution Order
1. **Phase 1:** Car selector data vs OEM specs
2. **Phase 2:** Performance hub algorithms vs empirical data
3. **Phase 3:** Education content accuracy
4. **Phase 4:** Cross-domain consistency checks

---

*Generated by Audit Plan Execution - Step 1.1*






