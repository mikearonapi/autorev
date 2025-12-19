# AutoRev Components

> Reference for all 53 React components
>
> **Last Verified:** December 15, 2024 — MCP-verified file listing

---

## Overview

| Category | Count |
|----------|-------|
| Providers | 6 |
| Feature Components | 15 |
| Events Components | 7 |
| UI Components | 12 |
| Gate Components | 3 |
| Modals | 5 |
| Action Components | 4 |
| Utility | 1 |

---

## Providers (6)

Providers wrap the app and provide context/state.

### `AuthProvider`
**File:** `components/providers/AuthProvider.jsx`
**Purpose:** Authentication state and user context
**Provides:**
- `user` - Current user object
- `isAuthenticated` - Boolean
- `userTier` - User's subscription tier
- `signIn()`, `signOut()` - Auth methods

### `FavoritesProvider`
**File:** `components/providers/FavoritesProvider.jsx`
**Purpose:** User's favorite cars
**Provides:**
- `favorites` - Array of favorite car slugs
- `addFavorite()`, `removeFavorite()`, `isFavorite()`

### `CompareProvider`
**File:** `components/providers/CompareProvider.jsx`
**Purpose:** Car comparison state
**Provides:**
- `compareList` - Array of cars to compare
- `addToCompare()`, `removeFromCompare()`
- `isInCompare()`

### `CarSelectionProvider`
**File:** `components/providers/CarSelectionProvider.jsx`
**Purpose:** Selected car for tuning/upgrades
**Provides:**
- `selectedCar` - Currently selected car
- `setSelectedCar()`

### `SavedBuildsProvider`
**File:** `components/providers/SavedBuildsProvider.jsx`
**Purpose:** User's saved build projects
**Provides:**
- `builds` - Array of saved builds
- `saveBuild()`, `updateBuild()`, `deleteBuild()`
- Tier-gated (Tuner required)

### `OwnedVehiclesProvider`
**File:** `components/providers/OwnedVehiclesProvider.jsx`
**Purpose:** User's owned vehicles
**Provides:**
- `vehicles` - Array of owned vehicles
- `addVehicle()`, `updateVehicle()`
- Tier-gated (Collector required)

---

## Feature Components (15)

Major feature implementations.

### `PerformanceHub`
**File:** `components/PerformanceHub.jsx`
**Purpose:** Upgrade visualization (Gran Turismo style)
**Features:**
- Car selection grid
- Performance bars
- Upgrade package selection
- Before/after comparison

### `UpgradeCenter`
**File:** `components/UpgradeCenter.jsx`
**Purpose:** Browse and select upgrades
**Features:**
- Category navigation
- Package tiers (Street, Track, Time Attack)
- Cost estimates

### `BuildsWorkshop`
**File:** `components/BuildsWorkshop.jsx`
**Purpose:** Manage build projects
**Tier:** Tuner

### `BuildDetailView`
**File:** `components/BuildDetailView.jsx`
**Purpose:** View single build project details

### `ExpertReviews`
**File:** `components/ExpertReviews.jsx`
**Purpose:** Display YouTube expert reviews
**Features:**
- Video grid
- AI consensus
- Topic filtering

### `AIMechanicChat`
**File:** `components/AIMechanicChat.jsx`
**Purpose:** AL assistant chat interface
**Features:**
- Message input
- Conversation history
- Tool use display
- Credit balance

### `SportsCarComparison`
**File:** `components/SportsCarComparison.jsx`
**Purpose:** Side-by-side car comparison
**Features:**
- Spec comparison table
- Score comparison
- Winner highlights

### `MarketValueSection`
**File:** `components/MarketValueSection.jsx`
**Purpose:** Display market value data
**Tier:** Collector
**Data:** `car_market_pricing`, `car_price_history`

### `CarDetailSections`
**File:** `components/CarDetailSections.jsx`
**Purpose:** Car detail page sections
**Exports:**
- `FuelEconomySection` - EPA data display
- `SafetyRatingsSection` - NHTSA/IIHS ratings
- `PriceByYearSection` - Price by model year

### `PerformanceData`
**File:** `components/PerformanceData.jsx`
**Purpose:** Performance metrics display
**Exports:**
- `DynoDataSection` - Dyno runs (Tuner)
- `LapTimesSection` - Track lap times (Tuner)

### `ModelVariantComparison`
**File:** `components/ModelVariantComparison.jsx`
**Purpose:** Compare variants of same model

### `UpgradeAggregator`
**File:** `components/UpgradeAggregator.jsx`
**Purpose:** Aggregate upgrade impact calculations

### `UpgradeDetailModal`
**File:** `components/UpgradeDetailModal.jsx`
**Purpose:** Modal for detailed upgrade info

### `ScoringInfo`
**File:** `components/ScoringInfo.jsx`
**Purpose:** Explain scoring methodology

### `TunabilityBadge`
**File:** `components/TunabilityBadge.jsx`
**Purpose:** Display tunability rating badge

---

## Events Components (7)

Event discovery and management components.

### `EventCard`
**File:** `components/EventCard.jsx`
**Purpose:** Display event preview in list/grid
**Props:**
- `event` - Event object with name, date, location, type
- `featured` - Boolean for featured styling
- `isSaved` - Boolean for saved state
- `onSaveToggle` - Callback for save toggle
- `showSaveButton` - Boolean to show/hide save button

### `EventCategoryPill`
**File:** `components/EventCategoryPill.jsx`
**Purpose:** Clickable category filter pill
**Props:**
- `category` - Category object with name, icon, slug
- `count` - Optional event count
- `isActive` - Boolean for active state
- `onClick` - Click handler

### `EventFilters`
**File:** `components/EventFilters.jsx`
**Purpose:** Comprehensive event filtering UI
**Props:**
- `initialFilters` - Initial filter state
- `onFilterChange` - Callback when filters change
- `eventTypes` - Array of available event types
- `showCategoryPills` - Show category pill row
- `showLocationInput` - Show location search
- `showDateRange` - Show date range picker
- `showCarFilters` - Show "Events for My Cars" (gated)
- `showViewToggle` - Show List/Map/Calendar toggle
- `currentView` - Current view mode
- `onViewChange` - View change callback

### `EventCalendarView`
**File:** `components/EventCalendarView.jsx`
**Purpose:** Monthly calendar grid view of events
**Tier:** Enthusiast+
**Props:**
- `events` - Array of events
- `month` - Display month (0-11)
- `year` - Display year
- `onDateClick` - Date click handler

### `EventMap`
**File:** `components/EventMap.jsx`
**Purpose:** Geographic map view of events
**Tier:** Enthusiast+
**Props:**
- `events` - Array of events with lat/lng
- `onEventSelect` - Event selection callback
- `selectedEvent` - Currently selected event
- `height` - Map height
**Features:**
- OpenStreetMap tiles (dark theme)
- Marker clustering
- Event list sidebar
- Selected event popup

### `SaveEventButton`
**File:** `components/SaveEventButton.jsx`
**Purpose:** Reusable save/unsave event button with auth/tier gating
**Tier:** Enthusiast+ (prompts upgrade for free users)
**Props:**
- `eventId` - Event ID
- `eventSlug` - Event slug
- `eventName` - Event name for confirmation
- `isSaved` - Current saved state
- `onSaveChange` - Callback when saved state changes

### `AddToCalendarButton`
**File:** `components/AddToCalendarButton.jsx`
**Purpose:** Dropdown to export event to calendar services
**Tier:** Enthusiast+
**Props:**
- `event` - Full event object
**Exports to:**
- Google Calendar
- Apple Calendar (.ics)
- Outlook Calendar
- Generic ICS download

---

## UI Components (12)

Reusable UI elements.

### `Header`
**File:** `components/Header.jsx`
**Purpose:** Site navigation header
**Features:**
- Logo
- Nav links
- Auth buttons
- Mobile menu

### `Footer`
**File:** `components/Footer.jsx`
**Purpose:** Site footer
**Features:**
- Links
- Newsletter signup
- Copyright

### `HeroSection`
**File:** `components/HeroSection.jsx`
**Purpose:** Hero banner component

### `PillarsSection`
**File:** `components/PillarsSection.jsx`
**Purpose:** Three-pillar features section

### `CarCarousel`
**File:** `components/CarCarousel.jsx`
**Purpose:** Horizontal car carousel

### `CarImage`
**File:** `components/CarImage.jsx`
**Purpose:** Car image with fallback
**Features:**
- Lazy loading
- Placeholder on error
- Aspect ratio handling

### `Button`
**File:** `components/Button.jsx`
**Purpose:** Styled button component
**Variants:** primary, secondary, ghost

### `LoadingSpinner`
**File:** `components/LoadingSpinner.jsx`
**Purpose:** Loading indicator

### `ScrollToTop`
**File:** `components/ScrollToTop.jsx`
**Purpose:** Scroll to top button

### `ScrollIndicator`
**File:** `components/ScrollIndicator.jsx`
**Purpose:** Scroll progress indicator

### `ExpertReviewedStrip`
**File:** `components/ExpertReviewedStrip.jsx`
**Purpose:** "Expert reviewed" badge strip

### `MobileBottomCta`
**File:** `components/MobileBottomCta.jsx`
**Purpose:** Fixed bottom CTA for mobile

---

## Gate Components (3)

Tier-based access control.

### `PremiumGate`
**File:** `components/PremiumGate.jsx`
**Purpose:** Conditionally render premium content
**Props:**
- `feature` - Feature key from tierAccess
- `children` - Content to show if authorized
- `fallback` - Content if unauthorized (optional)

**Usage:**
```jsx
<PremiumGate feature="marketValue">
  <MarketValueSection car={car} />
</PremiumGate>
```

### `SelectedCarBanner`
**File:** `components/SelectedCarBanner.jsx`
**Purpose:** Banner showing selected car context

### `SelectedCarFloatingWidget`
**File:** `components/SelectedCarFloatingWidget.jsx`
**Purpose:** Floating widget for car selection

---

## Modals (5)

Overlay dialogs.

### `AuthModal`
**File:** `components/AuthModal.jsx`
**Purpose:** Sign in/sign up modal
**Methods:** Google OAuth, Magic Link

### `AddVehicleModal`
**File:** `components/AddVehicleModal.jsx`
**Purpose:** Add owned vehicle (with VIN)
**Tier:** Collector

### `AddFavoritesModal`
**File:** `components/AddFavoritesModal.jsx`
**Purpose:** Add car to favorites

### `ServiceLogModal`
**File:** `components/ServiceLogModal.jsx`
**Purpose:** Add service log entry
**Tier:** Collector

### `CompareModal`
**File:** `components/CompareModal.jsx`
**Purpose:** Full comparison view

---

## Action Components (4)

User action handlers.

### `CarActionMenu`
**File:** `components/CarActionMenu.jsx`
**Purpose:** Dropdown menu for car actions
**Actions:** Add to favorites, Compare, View details

### `CompareBar`
**File:** `components/CompareBar.jsx`
**Purpose:** Fixed bar showing compare selection

### `FeedbackWidget`
**File:** `components/FeedbackWidget.jsx`
**Purpose:** Inline feedback collection

### `FeedbackCorner`
**File:** `components/FeedbackCorner.jsx`
**Purpose:** Corner feedback trigger

---

## Utility Components (1)

### `OnboardingPopup`
**File:** `components/OnboardingPopup.jsx`
**Purpose:** New user onboarding

### CSS Modules

Each component has a corresponding `.module.css` file:
- `Header.module.css`
- `CarDetailSections.module.css`
- `PerformanceHub.module.css`
- etc.

---

## Component Tree (Key Pages)

### Home Page
```
Layout
└── Header
└── HeroSection
└── PillarsSection
└── CarCarousel
└── ExpertReviewedStrip
└── Footer
```

### Car Detail Page
```
Layout
└── Header
└── CarImage
└── TabNavigation
    ├── Overview Tab
    │   └── ScoringInfo
    │   └── Strengths/Weaknesses
    ├── Buying Tab
    │   └── SafetyRatingsSection
    │   └── PriceByYearSection
    ├── Ownership Tab
    │   └── FuelEconomySection
    │   └── KnownIssues
    └── Expert Reviews Tab
        └── ExpertReviews
└── Footer
```

### My Garage
```
Layout
└── Header
└── FavoritesProvider
└── OwnedVehiclesProvider
    ├── Favorites Grid
    └── Owned Vehicles
        └── Vehicle Card
            └── Reference Tab
            └── Service Tab
            └── Value Tab
                └── MarketValueSection
└── Footer
```

### Tuning Shop
```
Layout
└── Header
└── CarSelectionProvider
└── SavedBuildsProvider
└── PerformanceHub
    └── Car Selection Grid
    └── Performance Bars
    └── UpgradeCenter
└── BuildsWorkshop (Tuner)
└── Footer
```

### Encyclopedia
```
Layout
└── PageBanner
│   └── Stats (systems, topics, mods, guides)
└── Sidebar
│   └── SearchBox
│   └── NavTreeItem (recursive)
│       └── Automotive Systems (new hierarchy)
│       │   └── System → Components → Topics
│       └── Modifications (preserved)
│       └── Build Guides (preserved)
│       └── Technical Reference (legacy)
└── MainContent
    └── HomeView (when no topic selected)
    │   └── HomeSectionCard (grid of sections)
    └── ArticleView (when topic selected)
        └── Breadcrumb
        └── ArticleHeader (icon, title, subtitle)
        └── ArticleSection (renders by section.type)
        │   └── text | keyValue | gains | prosCons | tags
        │   └── componentList | automotiveComponentList
        │   └── topicList | topicLinks | upgradeLinks
        │   └── modificationList | relationships | buildStages
        └── RelatedArticles
```

**Encyclopedia Data Layer:**
| File | Purpose |
|------|---------|
| `lib/encyclopediaHierarchy.js` | System → topic structure, exports, helpers |
| `lib/encyclopediaTopics/` | 136 comprehensive topic articles by system |
| `lib/encyclopediaData.js` | Unified data layer, article generation |
| `lib/educationData.js` | Build goals and paths |
| `data/upgradeEducation.js` | 49 modification articles |
| `data/connectedTissueMatrix.js` | Legacy systems/nodes (still used) |

---

*See [PAGES.md](PAGES.md) for page-level documentation.*


