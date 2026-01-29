# Consolidation Plan

**Generated:** 2026-01-22
**Purpose:** Actionable plan for addressing tech debt identified in the audit

---

## Phase 1: Performance Calculator Consolidation (P0)

### Goal
Consolidate 5 performance calculation files into a single, well-organized module.

### Current State
```
lib/
├── performance.js                    # Performance HUB helpers
├── performanceCalculatorV2.js        # "V2" unified calculator  
├── buildPerformanceCalculator.js     # Build performance
├── upgradeCalculator.js              # Smart HP calculation
└── upgrades.js                       # Also has HP calculations
```

### Target State
```
lib/
├── performanceCalculator/
│   ├── index.js                      # Public API
│   ├── constants.js                  # STAGE_TUNE_INCLUDED_MODS, CATEGORY_CAPS, etc.
│   ├── hpCalculator.js               # Core HP calculation logic
│   ├── metricsCalculator.js          # 0-60, braking, lateral G calculations
│   ├── conflictDetector.js           # Detect upgrade conflicts
│   ├── scoreCalculator.js            # Performance HUB scores
│   └── types.d.ts                    # TypeScript definitions
│
├── performance.js                    # Re-export from performanceCalculator (deprecated)
├── upgradeCalculator.js              # Re-export from performanceCalculator (deprecated)
└── upgrades.js                       # Keep non-calculation functions
```

### Migration Steps

#### Step 1: Extract Constants (1 hour)
```javascript
// lib/performanceCalculator/constants.js
export const STAGE_TUNE_INCLUDED_MODS = {
  'stage2-tune': ['downpipe', 'intake'],
  'stage3-tune': ['downpipe', 'intake', 'turbo-upgrade-existing', 'intercooler'],
};

export const TUNE_HIERARCHY = { /* ... */ };
export const CATEGORY_CAPS = { /* ... */ };
export const DIMINISHING_RETURNS_FACTOR = 0.3;
```

#### Step 2: Consolidate HP Calculation (4 hours)
```javascript
// lib/performanceCalculator/hpCalculator.js
import { STAGE_TUNE_INCLUDED_MODS, CATEGORY_CAPS } from './constants';

/**
 * Unified HP calculation
 * Consolidates: calculateSmartHpGain, calculateBuildPerformance, calculateAllModificationGains
 */
export function calculateHpGain(car, selectedUpgradeKeys, options = {}) {
  // Implementation that handles all cases:
  // - Basic mode (multiplier-based)
  // - Advanced mode (physics-based)
  // - With/without car context
  // - With/without engine family data
}
```

#### Step 3: Create Public API (1 hour)
```javascript
// lib/performanceCalculator/index.js
export { calculateHpGain, calculateBuildPerformance } from './hpCalculator';
export { calculateUpgradedMetrics } from './metricsCalculator';
export { detectUpgradeConflicts, getConflictSummary } from './conflictDetector';
export { getStockPerformanceScores, applyUpgradeDeltas } from './scoreCalculator';
export * from './constants';
```

#### Step 4: Update Consumers (2-4 hours)
```javascript
// Before
import { calculateSmartHpGain } from '@/lib/upgradeCalculator';
import { calculateUpgradedMetrics } from '@/lib/performance';

// After
import { calculateHpGain, calculateUpgradedMetrics } from '@/lib/performanceCalculator';
```

#### Step 5: Deprecate Old Files (30 min)
```javascript
// lib/upgradeCalculator.js
/**
 * @deprecated Use lib/performanceCalculator instead
 */
export { calculateHpGain as calculateSmartHpGain } from './performanceCalculator';
// ... other re-exports
```

### Files to Update

| Component | Current Import | New Import |
|-----------|----------------|------------|
| `VirtualDynoChart.jsx` | `lib/performance.js` | `lib/performanceCalculator` |
| `PowerBreakdown.jsx` | `lib/upgradeCalculator.js` | `lib/performanceCalculator` |
| `CalculatedPerformance.jsx` | `lib/buildPerformanceCalculator.js` | `lib/performanceCalculator` |
| `UpgradeCenter.jsx` | `lib/upgrades.js` | `lib/performanceCalculator` |
| `UpgradeAggregator.jsx` | `lib/performance.js` | `lib/performanceCalculator` |
| `PerformanceHub.jsx` | `lib/performance.js` | `lib/performanceCalculator` |

### Verification
```bash
# After migration, these should return 0 results:
grep -r "from.*'@/lib/performance'" components/ --include="*.jsx"
grep -r "from.*'@/lib/upgradeCalculator'" components/ --include="*.jsx"
grep -r "from.*'@/lib/buildPerformanceCalculator'" components/ --include="*.jsx"

# This should be the only import path:
grep -r "from.*'@/lib/performanceCalculator'" components/ --include="*.jsx"
```

### Estimated Effort: 8-12 hours

---

## Phase 2: resolveCarId Deduplication (P0)

### Goal
Single source of truth for car slug→id resolution.

### Current State
```
lib/carResolver.js:21     - export async function resolveCarId() ✓ Canonical
lib/userDataService.js:29 - async function resolveCarId()        ✗ Local duplicate
lib/knowledgeIndexService.js:37 - async function resolveCarId()  ✗ Local duplicate
```

### Migration Steps

#### Step 1: Update userDataService.js (30 min)
```javascript
// Before
async function resolveCarId(carSlug) {
  // Local implementation
}

// After
import { resolveCarId } from './carResolver';
// Remove local function
```

#### Step 2: Update knowledgeIndexService.js (30 min)
```javascript
// Before  
async function resolveCarId(client, carSlug) {
  // Local implementation with different signature
}

// After
import { resolveCarId } from './carResolver';
// Update call sites to use simpler signature
```

### Verification
```bash
# Should return exactly 1 result (carResolver.js)
grep -r "export.*function resolveCarId" lib/

# Should return 0 results (no local implementations)
grep -r "async function resolveCarId" lib/userDataService.js lib/knowledgeIndexService.js
```

### Estimated Effort: 1-2 hours

---

## Phase 3: Provider Clarification (P1)

### Goal
Clear separation of concerns between providers.

### Proposed Responsibilities

| Provider | Owns | Uses |
|----------|------|------|
| `AuthProvider` | Auth state, session | Supabase auth |
| `OwnedVehiclesProvider` | Real vehicles, installed mods | userDataService |
| `SavedBuildsProvider` | Hypothetical builds | userDataService |
| `FavoritesProvider` | Favorite cars list | userDataService |
| `CarSelectionProvider` | Currently browsing car | Local state |
| `CompareProvider` | Compare list | Local state |

### Audit Questions to Answer

1. **OwnedVehicles vs SavedBuilds overlap?**
   - `user_vehicles.installed_modifications` vs `user_projects.modifications`
   - Answer: vehicles = reality, projects = planning

2. **CarSelectionProvider vs carSelectionStore?**
   - Both exist - are they duplicates?
   - Action: Check if both are used, consolidate if so

3. **FavoritesProvider vs favoritesStore?**
   - Provider for logged-in users, store for guests?
   - Action: Document this pattern

### Steps
1. Document current usage of each provider
2. Create provider usage guide in docs
3. Remove any true duplicates

### Estimated Effort: 4-6 hours for investigation + documentation

---

## Phase 4: Supabase Client Consolidation (P1)

### Goal
Clear guidance on which Supabase client to use where.

### Current Files
- `lib/supabase.js` - Browser client
- `lib/supabaseClient.js` - Appears to be alias?
- `lib/supabaseServer.js` - Server client

### Steps

1. **Audit supabaseClient.js** (30 min)
   - Is it identical to supabase.js?
   - Who imports it?

2. **Document Usage Pattern** (1 hour)
   ```markdown
   # Supabase Client Usage
   
   | Context | Use | File |
   |---------|-----|------|
   | Client components | `supabase` | `lib/supabase.js` |
   | API routes | `supabaseAdmin` | `lib/supabaseServer.js` |
   | Server components | `supabaseAdmin` | `lib/supabaseServer.js` |
   ```

3. **Consolidate if Duplicate** (30 min)
   - If supabaseClient.js is identical, make it re-export from supabase.js

### Estimated Effort: 2-3 hours

---

## Phase 5: Error Logging Consolidation (P1)

### Goal
Single, clear error logging strategy.

### Current Files
```
lib/errorLogger.js        - Client error logging
lib/serverErrorLogger.js  - Server error logging  
lib/errorAggregator.js    - Aggregate errors
lib/errorAnalysis.js      - Analyze error patterns
```

### Proposed Structure
```
lib/errorLogging/
├── index.js              # Public API
├── clientLogger.js       # Browser error logging
├── serverLogger.js       # Server error logging
├── aggregator.js         # Error aggregation
└── analysis.js           # Error analysis
```

### Steps
1. Document current functionality of each file
2. Determine if any are unused
3. Consolidate into error logging module
4. Update all consumers

### Estimated Effort: 4-6 hours

---

## Phase 6: Discord Integration Consolidation (P1)

### Goal
Single Discord integration module.

### Current Files
- `lib/discord.js`
- `lib/discordAlerts.js`

### Steps
1. Compare functionality
2. Merge into single `lib/discord.js`
3. Update consumers

### Estimated Effort: 2-3 hours

---

## Phase 7: Large File Splitting (P2)

### Files to Consider Splitting

#### lib/alTools.js (~2,000 lines)
```
lib/alTools/
├── index.js            # Tool registration
├── carTools.js         # Car-related tools
├── maintenanceTools.js # Maintenance tools
├── tuningTools.js      # Tuning tools
└── generalTools.js     # General tools
```

#### lib/userDataService.js (~1,000 lines)
```
lib/userDataService/
├── index.js            # Public API
├── vehicles.js         # Vehicle CRUD
├── favorites.js        # Favorites CRUD
├── projects.js         # Projects CRUD
├── preferences.js      # Preferences CRUD
└── sync.js             # Data sync utilities
```

### Estimated Effort: 4-8 hours each

---

## Implementation Timeline

### Week 1
- [ ] Phase 1: Performance Calculator Consolidation (P0)
- [ ] Phase 2: resolveCarId Deduplication (P0)

### Week 2
- [ ] Phase 3: Provider Clarification (P1)
- [ ] Phase 4: Supabase Client Consolidation (P1)

### Week 3
- [ ] Phase 5: Error Logging Consolidation (P1)
- [ ] Phase 6: Discord Integration Consolidation (P1)

### Backlog
- [ ] Phase 7: Large File Splitting (P2)

---

## Success Criteria

### After Phase 1
- Single import path for all performance calculations
- No duplicate STAGE_TUNE_INCLUDED_MODS constants
- All components show same HP numbers for same inputs

### After Phase 2
- Single resolveCarId implementation
- All car_id lookups use caching

### After All Phases
- Clear documentation for which module to use for what
- No duplicate functionality across lib files
- Consistent patterns throughout codebase
