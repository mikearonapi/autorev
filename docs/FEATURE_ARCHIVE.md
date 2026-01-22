# AutoRev Feature Archive

> **Purpose:** Documents all features preserved in codebase but de-emphasized in the Build-focused pivot.
> **Created:** January 18, 2026 (v1.0-pre-pivot)

---

## Overview

AutoRev is pivoting from a multi-product platform to a focused **Build** product. This document archives all Find/Care features that are being de-emphasized but NOT deleted from the codebase.

**Key Principle:** All code remains intact for potential future reactivation as separate products.

---

## Find Features (De-emphasized)

Features related to car discovery, browsing, and selection.

### Browse Cars Page
- **Route:** `/browse-cars`, `/cars`
- **Files:**
  - `app/(app)/browse-cars/page.jsx`
  - `app/(app)/cars/page.jsx`
  - `components/CarGrid.jsx`
  - `components/CarFilters.jsx`
- **Purpose:** Browse all 309 cars in database with filtering
- **Status:** Routes remain accessible, removed from navigation

### Car Selector / Quiz
- **Route:** `/car-selector`, `/select`
- **Files:**
  - `app/(app)/car-selector/page.jsx`
  - `components/CarSelector.jsx`
  - `components/QuizFlow.jsx`
- **Purpose:** Interactive quiz to match users with ideal car
- **Status:** Routes remain accessible, removed from navigation

### Car Compare
- **Route:** `/compare`
- **Files:**
  - `app/(app)/compare/page.jsx`
  - `components/CompareTable.jsx`
  - `lib/stores/compareStore.js`
- **Purpose:** Side-by-side car comparison
- **Status:** Routes remain accessible, removed from navigation

### Individual Car Detail Pages
- **Route:** `/cars/[slug]`
- **Files:**
  - `app/(app)/cars/[slug]/page.jsx`
  - `components/CarDetail/` (entire folder)
  - `components/SpecsTable.jsx`
  - `components/ReviewsSection.jsx`
- **Purpose:** Comprehensive car information pages
- **Status:** Routes remain accessible (needed for Build context), de-emphasized in navigation

---

## Care Features (De-emphasized)

Features related to vehicle ownership and maintenance tracking.

### Vehicle Health Dashboard
- **Location:** Within Garage page
- **Files:**
  - `components/garage/VehicleHealthCard.jsx`
  - `components/garage/HealthAnalysis.jsx`
  - `lib/vehicleHealthAnalyzer.js`
- **Purpose:** AI-analyzed vehicle health status
- **Status:** Collapsed into "Ownership" section, not prominently displayed

### Service Log Tracking
- **Location:** Within Garage and Vehicle Detail
- **Files:**
  - `components/ServiceLogModal.jsx`
  - `components/ServiceLogList.jsx`
  - `components/garage/ServiceLogEntry.jsx`
- **Database Tables:**
  - `user_service_logs`
  - `vehicle_service_intervals`
- **Purpose:** Track maintenance history and upcoming services
- **Status:** Features remain functional but de-emphasized

### Maintenance Reminders
- **Files:**
  - `components/MaintenanceReminder.jsx`
  - `lib/maintenanceScheduler.js`
- **Database Tables:**
  - `vehicle_maintenance_specs`
  - `vehicle_service_intervals`
- **Purpose:** Proactive maintenance notifications
- **Status:** Backend functional, UI de-emphasized

### Owner's Reference
- **Route:** Within `/cars/[slug]`
- **Files:**
  - `components/CarDetail/OwnerReference.jsx`
  - `components/CarDetail/FluidSpecs.jsx`
  - `components/CarDetail/TireWheelSpecs.jsx`
- **Purpose:** Detailed ownership specifications
- **Status:** Accessible via car detail, not promoted

### Car Concierge Features
- **Location:** User vehicles detail
- **Files:**
  - `components/garage/CarConcierge.jsx`
- **Database Columns in `user_vehicles`:**
  - `last_started_at`
  - `battery_status`
  - `storage_mode`
  - `tire_installed_date`
  - `registration_due_date`
  - `inspection_due_date`
- **Purpose:** Track storage car status and documentation
- **Status:** Features remain but collapsed

---

## Build Features (Promoted - PRIMARY)

These features are the focus of the pivot.

### Tuning Shop
- **Route:** `/tuning-shop`
- **Files:**
  - `app/(app)/tuning-shop/page.jsx`
  - `components/tuning-shop/` (entire folder)
  - `components/tuning-shop/UpgradeCenter.jsx`
  - `components/tuning-shop/CarPickerModal.jsx`
- **Database Tables:**
  - `car_tuning_profiles`
  - `parts`
  - `part_fitments`
  - `upgrade_packages`
  - `upgrade_keys`
- **Status:** PRIMARY PRODUCT EXPERIENCE

### Project Management
- **Location:** Tuning Shop and My Builds
- **Files:**
  - `components/tuning-shop/ProjectCard.jsx`
  - `components/tuning-shop/ProjectsTab.jsx`
- **Database Tables:**
  - `user_projects`
  - `user_project_parts`
- **Status:** Core feature - prominent placement

### Parts Database
- **Route:** `/parts` (NEW)
- **Files:** To be created
- **Database Tables:**
  - `parts` (723 records)
  - `part_fitments` (930 records)
  - `part_pricing_snapshots` (971 records)
  - `part_relationships` (38 records)
- **Status:** NEW - public parts browser

### Community Builds
- **Route:** `/community/builds`
- **Files:**
  - `app/(app)/community/builds/page.jsx`
  - `components/CommunityBuildCard.jsx`
- **Database Tables:**
  - `community_posts`
  - `community_post_parts`
- **Status:** Promoted in navigation

### Encyclopedia
- **Route:** `/encyclopedia`
- **Files:**
  - `app/(app)/encyclopedia/page.jsx`
  - `lib/encyclopediaHierarchy.js`
  - `data/upgradeEducation.js`
- **Purpose:** Modification education and guides
- **Status:** Promoted for Build learning

---

## Database Tables by Feature Area

### Find-Related (Keep, not primary)
| Table | Rows | Notes |
|-------|------|-------|
| `cars` | 309 | Core - needed for Build too |
| `car_fuel_economy` | 98 | Ownership info |
| `car_safety_data` | 98 | Buying info |
| `car_market_pricing` | 10 | Value tracking |
| `user_favorites` | 19 | Bookmarks |
| `user_compare_lists` | 0 | Compare feature |

### Care-Related (Keep, de-emphasized)
| Table | Rows | Notes |
|-------|------|-------|
| `vehicle_maintenance_specs` | 305 | Ownership specs |
| `vehicle_service_intervals` | 3,093 | Service schedules |
| `user_service_logs` | 1 | User maintenance |
| `vehicle_known_issues` | 89 | DEPRECATED - use car_issues |

### Build-Related (PRIMARY)
| Table | Rows | Notes |
|-------|------|-------|
| `car_tuning_profiles` | 309 | Tuning data |
| `parts` | 723 | Parts catalog |
| `part_fitments` | 930 | Fitment data |
| `user_projects` | 13 | User builds |
| `user_project_parts` | 8 | Build parts |
| `car_dyno_runs` | 29 | Performance data |
| `car_track_lap_times` | 65 | Track benchmarks |
| `community_posts` | 7 | User builds |

---

## Navigation Changes

### Previous Navigation (Pre-Pivot)
```
Home | Articles | Vehicles > | My Garage | Tuning Shop | Community > | AutoRev AI
                    |                                        |
                    +-- Browse Vehicles                      +-- Community Builds
                    +-- Your Vehicle Match                   +-- Events
                                                            +-- Saved Events
                                                            +-- Submit Event
```

### Current Navigation (January 2026 - 5-Tab Structure)

**Bottom Tab Bar (Mobile-First):**
```
┌─────────────────────────────────────────────────────────┐
│  Garage   │   Data    │ Community │    AL     │ Profile │
└─────────────────────────────────────────────────────────┘
```

**Header Navigation (Desktop):**
```
My Garage | My Data | Community | AL
```

### Route Mapping
| Old Route | Current Status | Notes |
|-----------|----------------|-------|
| `/` | ✅ Active | Homepage with login CTA |
| `/browse-cars` | ⚠️ Archived | Accessible, NOT in nav |
| `/car-selector` | ⚠️ Archived | Accessible, NOT in nav |
| `/compare` | ⚠️ Archived | Accessible, NOT in nav |
| `/garage` | ✅ Active | Primary tab - vehicle & build management |
| `/data` | ✅ Active | NEW - Performance data hub |
| `/tuning-shop` | ⚠️ Legacy | Consolidated into /garage |
| `/mod-planner` | ⚠️ Legacy | Consolidated into /garage |
| `/community` | ✅ Active | Social build feed |
| `/community/builds` | ⚠️ Archived | Moved to /community main feed |
| `/encyclopedia` | ⚠️ Archived | Accessible, NOT in nav |
| `/join` | ⚠️ Archived | Auth modal used instead |
| `/al` | ✅ Active | Full-page AL chat |
| `/profile` | ✅ Active | User settings |

---

## Reactivation Guide

To restore Find or Care features as separate products:

### Option 1: Feature Flags
Add feature flags to conditionally show navigation items:
```javascript
// lib/featureFlags.js
export const FEATURES = {
  FIND_ENABLED: process.env.NEXT_PUBLIC_FIND_ENABLED === 'true',
  CARE_ENABLED: process.env.NEXT_PUBLIC_CARE_ENABLED === 'true',
};
```

### Option 2: Separate App
Create a new Next.js app for Find/Care:
1. Copy relevant components and pages
2. Share database (Supabase)
3. Share auth system
4. Deploy to separate domain (e.g., find.autorev.app)

### Option 3: Route Groups
Use Next.js route groups for product separation:
```
app/
  (build)/        # Build product routes
  (find)/         # Find product routes (disabled)
  (care)/         # Care product routes (disabled)
```

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-18 | 1.0 | Initial archive - Build pivot begins |

---

*This document should be updated whenever features are restored or permanently removed.*
