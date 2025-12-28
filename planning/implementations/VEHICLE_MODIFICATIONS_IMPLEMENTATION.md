# Vehicle Modifications Feature - Implementation Plan

> **Status:** Planning Complete, Implementation Pending
> **Created:** December 20, 2024
> **Risk Level:** Medium (touches core user data)

---

## Feature Overview

Allow users to save modifications/upgrades to their owned vehicles in the garage, so their cars display as "modified" with actual installed upgrades rather than just stock specs.

### User Story

1. User has a stock Evo in their garage
2. User goes to Tuning Shop, configures a build (intake, exhaust, tune)
3. User clicks "Apply to My Evo" 
4. User's garage now shows the Evo with "+45 HP" badge and modification list
5. User can later edit or clear modifications

---

## Impact Analysis

### Files That Touch `user_vehicles`

| File | Usage | Impact |
|------|-------|--------|
| `lib/userDataService.js` | CRUD operations | ✅ Add new functions |
| `components/providers/OwnedVehiclesProvider.jsx` | React state management | ✅ Update transform + add methods |
| `app/garage/page.jsx` | Display vehicles | ✅ Show mod badge + tab |
| `app/tuning-shop/page.jsx` | List owned cars | ✅ Add "Apply" button |
| `app/mod-planner/page.jsx` | List owned cars | ⚪ Read-only, no changes needed |
| `app/browse-cars/page.jsx` | Add to collection | ⚪ No changes needed |
| `components/CarActionMenu.jsx` | Quick actions | ⚪ No changes needed (for now) |
| `lib/aiMechanicService.js` | AL context | ⚪ Future: could include mods |

### Database Safety

- **Migration type:** ADD COLUMN (non-breaking)
- **Default values:** All new columns have safe defaults (`[]`, `NULL`, `0`)
- **RLS policies:** Existing policies cover new columns automatically
- **Existing queries:** `SELECT *` will include new columns; code ignores unknown fields

### No-Break Guarantees

1. ✅ Existing vehicles remain unchanged (new columns default to empty/null)
2. ✅ Existing builds/projects work exactly as before
3. ✅ Transform functions gracefully handle missing fields
4. ✅ Frontend code that doesn't use mods continues working
5. ✅ AI mechanic context unaffected (reads from cars table, not user_vehicles)

---

## Phase 1: Database & Backend

### 1A. Database Migration

**File:** `supabase/migrations/034_vehicle_modifications.sql`

```sql
-- Add columns to user_vehicles for tracking installed modifications
ALTER TABLE user_vehicles 
  ADD COLUMN IF NOT EXISTS installed_modifications JSONB DEFAULT '[]'::jsonb;

ALTER TABLE user_vehicles 
  ADD COLUMN IF NOT EXISTS active_build_id UUID REFERENCES user_projects(id) ON DELETE SET NULL;

ALTER TABLE user_vehicles 
  ADD COLUMN IF NOT EXISTS total_hp_gain INTEGER DEFAULT 0;

ALTER TABLE user_vehicles 
  ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ;

-- Index for finding modified vehicles
CREATE INDEX IF NOT EXISTS idx_user_vehicles_is_modified 
  ON user_vehicles ((jsonb_array_length(installed_modifications) > 0));

-- Index for build lookups
CREATE INDEX IF NOT EXISTS idx_user_vehicles_active_build 
  ON user_vehicles (active_build_id) WHERE active_build_id IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN user_vehicles.installed_modifications IS 'Array of upgrade keys installed on this vehicle, e.g. ["intake", "exhaust-catback", "tune-street"]';
COMMENT ON COLUMN user_vehicles.active_build_id IS 'Optional link to the user_projects row this build came from';
COMMENT ON COLUMN user_vehicles.total_hp_gain IS 'Cached total HP gain from installed modifications';
COMMENT ON COLUMN user_vehicles.modified_at IS 'Timestamp when modifications were last updated';
```

**Rollback:**
```sql
ALTER TABLE user_vehicles DROP COLUMN IF EXISTS installed_modifications;
ALTER TABLE user_vehicles DROP COLUMN IF EXISTS active_build_id;
ALTER TABLE user_vehicles DROP COLUMN IF EXISTS total_hp_gain;
ALTER TABLE user_vehicles DROP COLUMN IF EXISTS modified_at;
DROP INDEX IF EXISTS idx_user_vehicles_is_modified;
DROP INDEX IF EXISTS idx_user_vehicles_active_build;
```

### 1B. Backend Service Functions

**File:** `lib/userDataService.js`

Add these functions:

```javascript
/**
 * Apply modifications to a user vehicle
 * @param {string} userId 
 * @param {string} vehicleId 
 * @param {Object} modifications - { upgrades: string[], totalHpGain: number, buildId?: string }
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function applyVehicleModifications(userId, vehicleId, modifications) {
  // Implementation
}

/**
 * Clear all modifications from a vehicle (reset to stock)
 * @param {string} userId 
 * @param {string} vehicleId 
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function clearVehicleModifications(userId, vehicleId) {
  // Implementation
}

/**
 * Apply a saved build/project to a vehicle
 * @param {string} userId 
 * @param {string} vehicleId 
 * @param {string} buildId - user_projects.id
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function applyBuildToVehicle(userId, vehicleId, buildId) {
  // Implementation - fetches build, applies to vehicle
}
```

### 1C. Provider Updates

**File:** `components/providers/OwnedVehiclesProvider.jsx`

Updates needed:

1. Update `transformVehicle()` to include new fields:
   ```javascript
   installedModifications: row.installed_modifications || [],
   activeBuildId: row.active_build_id,
   totalHpGain: row.total_hp_gain || 0,
   modifiedAt: row.modified_at,
   isModified: (row.installed_modifications?.length || 0) > 0,
   ```

2. Add new context methods:
   ```javascript
   applyModifications: async (vehicleId, mods) => { ... }
   clearModifications: async (vehicleId) => { ... }
   applyBuild: async (vehicleId, buildId) => { ... }
   ```

3. Export new hook:
   ```javascript
   export function useVehicleModifications(vehicleId) {
     // Returns modification state + actions for a specific vehicle
   }
   ```

### 1D. API Route

**File:** `app/api/users/[userId]/vehicles/[vehicleId]/modifications/route.js`

```javascript
// POST - Apply modifications
// PUT - Update modifications  
// DELETE - Clear modifications (reset to stock)
```

---

## Phase 2: Frontend

### 2A. Tuning Shop - "Apply to My Vehicle"

**File:** `app/tuning-shop/page.jsx` (PerformanceHub integration)

**Location:** Build Summary panel (where "Save Build" button is)

**Logic:**
1. Check if user owns a vehicle matching `selectedCar.slug`
2. If yes, show "Apply to My [Vehicle Nickname/Name]" button
3. On click:
   - Get current upgrades from PerformanceHub state
   - Call `applyModifications(vehicleId, { upgrades, totalHpGain })`
   - Show success toast
   - Optionally link to garage

**UI Mockup:**
```
┌─────────────────────────────────┐
│ Build Summary                   │
│ +68 HP | $4,500-6,200           │
│                                 │
│ [Save Build]  [Apply to My Evo] │
└─────────────────────────────────┘
```

### 2B. Garage Cards - Modified Badge

**File:** `app/garage/page.jsx`

**Location:** Vehicle card in carousel

**Changes:**
1. Add "MODIFIED" badge when `vehicle.isModified`
2. Show "+XX HP" pill next to badge
3. Different card styling for modified vs stock vehicles

**UI Mockup:**
```
┌─────────────────────────────────┐
│ [Car Image]                     │
│                                 │
│ 2019 Mitsubishi Evo X          │
│ MODIFIED • +68 HP               │
└─────────────────────────────────┘
```

### 2C. Garage Detail - Modifications Tab

**File:** `app/garage/page.jsx` (HeroVehicleDisplay component)

**Location:** Add new tab alongside Overview, Maintenance, Safety, Service

**Content:**
- List of installed upgrades with icons
- Total HP gain summary
- "Edit Modifications" button → opens Tuning Shop with vehicle pre-selected
- "Reset to Stock" button → clears all modifications
- Link to source build if `activeBuildId` exists

---

## Phase 3: Testing & Documentation

### Integration Tests

1. **Add mods flow:** Create vehicle → Go to Tuning Shop → Select upgrades → Apply to vehicle → Verify in garage
2. **Clear mods flow:** Modified vehicle → Clear modifications → Verify shows as stock
3. **Build link flow:** Save build → Apply to vehicle → Verify `activeBuildId` set
4. **Edit mods flow:** Modified vehicle → Edit → Add more upgrades → Verify updated
5. **Delete vehicle:** Delete modified vehicle → Verify no orphaned data
6. **Regression:** Existing vehicles without mods still display correctly

### Safety Checks Before Deployment

- [ ] Run migration on staging first
- [ ] Verify existing vehicles unaffected
- [ ] Verify existing builds unaffected
- [ ] Test with guest users (localStorage fallback)
- [ ] Test with authenticated users (Supabase)
- [ ] Verify RLS policies work for new columns
- [ ] Check garage page loads without errors
- [ ] Check tuning shop loads without errors

### Documentation Updates

- [ ] Update `docs/DATABASE.md` with new columns
- [ ] Update `docs/COMPONENTS.md` if new components created
- [ ] Update `docs/PAGES.md` with new garage functionality

---

## Data Structures

### installed_modifications (JSONB)

Simple array of upgrade keys (matches `user_projects.selected_upgrades` format):

```json
["intake", "exhaust-catback", "tune-street", "lowering-springs"]
```

### OwnedVehicle Type (Updated)

```typescript
interface OwnedVehicle {
  // Existing fields...
  id: string;
  vin?: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  matchedCarSlug?: string;
  nickname?: string;
  // ... other existing fields

  // NEW FIELDS
  installedModifications: string[];  // Array of upgrade keys
  activeBuildId?: string;            // FK to user_projects
  totalHpGain: number;               // Cached HP gain
  modifiedAt?: string;               // ISO timestamp
  isModified: boolean;               // Computed: mods.length > 0
}
```

---

## Rollback Plan

If issues arise after deployment:

1. **Database:** Run rollback SQL to remove columns
2. **Code:** Revert commits for service/provider/frontend changes
3. **Data:** No data loss - we're only adding, not modifying existing data

---

## Future Enhancements (Out of Scope)

These are NOT part of this implementation but could be added later:

- [ ] Installation date per modification
- [ ] Cost tracking per modification
- [ ] Full modification history table
- [ ] "Remove single mod" (currently all-or-nothing)
- [ ] Share modified vehicle specs
- [ ] AL awareness of user's modifications



