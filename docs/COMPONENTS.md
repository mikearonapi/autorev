# AutoRev Components

> Reference for all 192 React components (152 in components/ + 40 in app/admin/components/)
>
> **Last Verified:** January 21, 2026 — Full audit against codebase

---

## Overview

| Category | Count |
|----------|-------|
| Providers | 9 |
| Feature Components | 45 |
| Events Components | 7 |
| Admin Components | 40 |
| UI Components | 15 |
| Gate Components | 3 |
| Modals | 12 |
| Action Components | 6 |
| Utility/System | 12 |
| Auth Components | 2 |
| Garage Components | 6 |
| Landing Components | 7 |
| Onboarding Components | 8 |
| Tuning Shop Components | 8 |
| **Total** | **192** |

---

## Directory Structure

```
components/
├── auth/           (2)   - Authentication UI components
├── garage/         (6)   - Garage-specific components
├── landing/        (7)   - Marketing landing page components
├── onboarding/     (8)   - User onboarding flow
├── providers/      (9)   - React context providers
├── tuning-shop/    (8)   - Tuning shop components
├── ui/             (3)   - Base UI primitives
└── [root]         (107)  - Core feature components
```

---

## Providers (9)

Providers wrap the app and provide context/state.

### `AuthProvider`
**File:** `components/providers/AuthProvider.jsx` (1,763 lines)
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
**File:** `components/providers/SavedBuildsProvider.jsx` (701 lines)
**Purpose:** User's saved build projects
**Provides:**
- `builds` - Array of saved builds
- `saveBuild()`, `updateBuild()`, `deleteBuild()`
- Tier-gated (Tuner required)

### `OwnedVehiclesProvider`
**File:** `components/providers/OwnedVehiclesProvider.jsx` (969 lines)
**Purpose:** User's owned vehicles
**Provides:**
- `vehicles` - Array of owned vehicles
- `addVehicle()`, `updateVehicle()`
- Tier-gated (Collector required)

### `BannerProvider`
**File:** `components/providers/BannerProvider.jsx`
**Purpose:** Global banner/notification state
**Provides:**
- `showBanner()`, `hideBanner()`
- Banner queue management

### `LoadingProgressProvider`
**File:** `components/providers/LoadingProgressProvider.jsx`
**Purpose:** Global loading progress indicator
**Provides:**
- `startLoading()`, `stopLoading()`
- Progress percentage state

### `QueryProvider`
**File:** `components/providers/QueryProvider.jsx`
**Purpose:** React Query client provider
**Provides:**
- Query client configuration
- Cache management

---

## Feature Components (45)

Major feature implementations.

### Performance & Tuning

#### `PerformanceHub`
**File:** `components/PerformanceHub.jsx` (1,764 lines)
**Purpose:** Upgrade visualization (Gran Turismo style)
**Features:**
- Car selection grid
- Performance bars
- Upgrade package selection
- Before/after comparison

#### `UpgradeCenter`
**File:** `components/UpgradeCenter.jsx` (4,230 lines)
**Purpose:** Browse and select upgrades
**Features:**
- Category navigation
- Package tiers (Street, Track, Time Attack)
- Cost estimates
- Part compatibility

#### `UpgradeAggregator`
**File:** `components/UpgradeAggregator.jsx` (369 lines)
**Purpose:** Aggregate upgrade impact calculations

#### `UpgradeConfigPanel`
**File:** `components/UpgradeConfigPanel.jsx` (325 lines)
**Purpose:** Configuration panel for upgrades

#### `UpgradeDetailModal`
**File:** `components/UpgradeDetailModal.jsx` (369 lines)
**Purpose:** Modal for detailed upgrade info

#### `CalculatedPerformance`
**File:** `components/CalculatedPerformance.jsx` (387 lines)
**Purpose:** Display calculated performance metrics

#### `PerformanceData`
**File:** `components/PerformanceData.jsx` (380 lines)
**Purpose:** Performance metrics display
**Exports:**
- `DynoDataSection` - Dyno runs (Tuner)
- `LapTimesSection` - Track lap times (Tuner)

#### `PerformanceGoals`
**File:** `components/PerformanceGoals.jsx` (544 lines)
**Purpose:** Set and track performance objectives

#### `LapTimeEstimator`
**File:** `components/LapTimeEstimator.jsx` (776 lines)
**Purpose:** Estimate lap times based on modifications

#### `VirtualDynoChart`
**File:** `components/VirtualDynoChart.jsx` (236 lines)
**Purpose:** Virtual dyno visualization

#### `PowerBreakdown`
**File:** `components/PowerBreakdown.jsx` (329 lines)
**Purpose:** Power distribution breakdown

#### `PowerLimitsAdvisory`
**File:** `components/PowerLimitsAdvisory.jsx` (134 lines)
**Purpose:** Warn about power limits

#### `PredictedVsActual`
**File:** `components/PredictedVsActual.jsx` (249 lines)
**Purpose:** Compare predicted vs actual performance

#### `GapAnalysis`
**File:** `components/GapAnalysis.jsx` (248 lines)
**Purpose:** Analyze performance gaps

#### `HandlingBalanceIndicator`
**File:** `components/HandlingBalanceIndicator.jsx` (113 lines)
**Purpose:** Visual handling balance indicator

#### `AeroBalanceChart`
**File:** `components/AeroBalanceChart.jsx` (121 lines)
**Purpose:** Aerodynamic balance visualization

### Build Management

#### `BuildDetailView`
**File:** `components/BuildDetailView.jsx` (532 lines)
**Purpose:** View single build project details

#### `BuildEditor`
**File:** `components/BuildEditor.jsx` (1,000 lines)
**Purpose:** Edit and manage build projects
**Tier:** Tuner

#### `BuildWizard`
**File:** `components/BuildWizard.jsx` (614 lines)
**Purpose:** Guided build creation wizard

#### `BuildProgressAnalysis`
**File:** `components/BuildProgressAnalysis.jsx` (304 lines)
**Purpose:** Analyze build progress

#### `BuildValueAnalysis`
**File:** `components/BuildValueAnalysis.jsx` (408 lines)
**Purpose:** Analyze build cost vs value

#### `BuildMediaGallery`
**File:** `components/BuildMediaGallery.jsx` (295 lines)
**Purpose:** Gallery for build photos/videos

#### `NextUpgradeRecommendation`
**File:** `components/NextUpgradeRecommendation.jsx` (407 lines)
**Purpose:** AI-powered next upgrade suggestions

### AL (AI Assistant)

#### `ALPreferencesPanel`
**File:** `components/ALPreferencesPanel.jsx` (319 lines)
**Purpose:** AL assistant preferences configuration

#### `ALAttachmentMenu`
**File:** `components/ALAttachmentMenu.jsx` (325 lines)
**Purpose:** Attachment menu for AL conversations

#### `AIChatContext`
**File:** `components/AIChatContext.jsx` (59 lines)
**Purpose:** AI chat context provider

#### `AskALButton`
**File:** `components/AskALButton.jsx` (179 lines)
**Purpose:** Quick access button to ask AL

### Car & Vehicle

#### `CarDetailSections`
**File:** `components/CarDetailSections.jsx` (423 lines)
**Purpose:** Car detail page sections
**Exports:**
- `FuelEconomySection` - EPA data display
- `SafetyRatingsSection` - NHTSA/IIHS ratings
- `PriceByYearSection` - Price by model year

#### `SportsCarComparison`
**File:** `components/SportsCarComparison.jsx` (1,084 lines)
**Purpose:** Side-by-side car comparison
**Features:**
- Spec comparison table
- Score comparison
- Winner highlights

#### `ModelVariantComparison`
**File:** `components/ModelVariantComparison.jsx` (492 lines)
**Purpose:** Compare variants of same model

#### `MarketValueSection`
**File:** `components/MarketValueSection.jsx` (273 lines)
**Purpose:** Display market value data
**Tier:** Collector
**Data:** `car_market_pricing`, `car_price_history`

#### `KnownIssuesAlert`
**File:** `components/KnownIssuesAlert.jsx` (328 lines)
**Purpose:** Alert for known vehicle issues

#### `WheelTireSpecsCard`
**File:** `components/WheelTireSpecsCard.jsx` (401 lines)
**Purpose:** Display wheel/tire specifications

#### `CustomSpecsEditor`
**File:** `components/CustomSpecsEditor.jsx` (534 lines)
**Purpose:** Edit custom vehicle specifications

#### `VehicleBuildPanel`
**File:** `components/VehicleBuildPanel.jsx` (99 lines)
**Purpose:** Vehicle build summary panel

### Expert Content

#### `ExpertReviews`
**File:** `components/ExpertReviews.jsx` (468 lines)
**Purpose:** Display YouTube expert reviews
**Features:**
- Video grid
- AI consensus
- Topic filtering

#### `ExpertReviewedStrip`
**File:** `components/ExpertReviewedStrip.jsx` (103 lines)
**Purpose:** "Expert reviewed" badge strip

#### `FeaturedBuildsCarousel`
**File:** `components/FeaturedBuildsCarousel.jsx` (300 lines)
**Purpose:** Carousel of featured community builds

#### `PlatformInsights`
**File:** `components/PlatformInsights.jsx` (314 lines)
**Purpose:** Platform-specific insights

#### `FeatureBreakdown`
**File:** `components/FeatureBreakdown.jsx` (207 lines)
**Purpose:** Feature comparison breakdown

### Scoring & Rating

#### `ScoringInfo`
**File:** `components/ScoringInfo.jsx` (386 lines)
**Purpose:** Explain scoring methodology

#### `TunabilityBadge`
**File:** `components/TunabilityBadge.jsx` (176 lines)
**Purpose:** Display tunability rating badge

---

## Events Components (7)

Event discovery and management components.

### `EventCard`
**File:** `components/EventCard.jsx` (287 lines)
**Purpose:** Display event preview in list/grid
**Props:**
- `event` - Event object with name, date, location, type
- `featured` - Boolean for featured styling
- `isSaved` - Boolean for saved state
- `onSaveToggle` - Callback for save toggle
- `showSaveButton` - Boolean to show/hide save button

### `EventCategoryPill`
**File:** `components/EventCategoryPill.jsx` (104 lines)
**Purpose:** Clickable category filter pill
**Props:**
- `category` - Category object with name, icon, slug
- `count` - Optional event count
- `isActive` - Boolean for active state
- `onClick` - Click handler

### `EventFilters`
**File:** `components/EventFilters.jsx` (506 lines)
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
**File:** `components/EventCalendarView.jsx` (348 lines)
**Purpose:** Monthly calendar grid view of events
**Tier:** Enthusiast+
**Props:**
- `events` - Array of events
- `month` - Display month (0-11)
- `year` - Display year
- `onDateClick` - Date click handler

### `EventMap`
**File:** `components/EventMap.jsx` (345 lines)
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
**File:** `components/SaveEventButton.jsx` (256 lines)
**Purpose:** Reusable save/unsave event button with auth/tier gating
**Tier:** Enthusiast+ (prompts upgrade for free users)
**Props:**
- `eventId` - Event ID
- `eventSlug` - Event slug
- `eventName` - Event name for confirmation
- `isSaved` - Current saved state
- `onSaveChange` - Callback when saved state changes

### `AddToCalendarButton`
**File:** `components/AddToCalendarButton.jsx` (470 lines)
**Purpose:** Dropdown to export event to calendar services
**Tier:** Enthusiast+
**Props:**
- `event` - Full event object
**Exports to:**
- Google Calendar
- Apple Calendar (.ics)
- Outlook Calendar
- Generic ICS download

### Event Integration Components

#### `CarEventsSection`
**File:** `components/CarEventsSection.jsx` (142 lines)
**Purpose:** Events section for car detail pages

#### `GarageEventsSection`
**File:** `components/GarageEventsSection.jsx` (172 lines)
**Purpose:** Events section for garage pages

---

## UI Components (15)

Reusable UI elements.

### `Header`
**File:** `components/Header.jsx` (579 lines)
**Purpose:** Site navigation header
**Features:**
- Logo
- Nav links
- Auth buttons
- Mobile menu

### `Footer`
**File:** `components/Footer.jsx` (119 lines)
**Purpose:** Site footer
**Features:**
- Links
- Newsletter signup
- Copyright

### `HeroSection`
**File:** `components/HeroSection.jsx` (80 lines)
**Purpose:** Hero banner component

### `HeroCta`
**File:** `components/HeroCta.jsx` (55 lines)
**Purpose:** Hero call-to-action button

### `PillarsSection`
**File:** `components/PillarsSection.jsx` (134 lines)
**Purpose:** Three-pillar features section

### `CarCarousel`
**File:** `components/CarCarousel.jsx` (246 lines)
**Purpose:** Horizontal car carousel

### `CarImage`
**File:** `components/CarImage.jsx` (216 lines)
**Purpose:** Car image with fallback
**Features:**
- Lazy loading
- Placeholder on error
- Aspect ratio handling

### `ImageCarousel`
**File:** `components/ImageCarousel.jsx` (135 lines)
**Purpose:** Generic image carousel

### `AdvancedImageCarousel`
**File:** `components/AdvancedImageCarousel.jsx` (146 lines)
**Purpose:** Advanced carousel with more controls

### `Button`
**File:** `components/Button.jsx` (65 lines)
**Purpose:** Styled button component
**Variants:** primary, secondary, ghost

### `LoadingSpinner`
**File:** `components/LoadingSpinner.jsx` (122 lines)
**Purpose:** Loading indicator

### `ScrollToTop`
**File:** `components/ScrollToTop.jsx` (79 lines)
**Purpose:** Scroll to top button

### `ScrollIndicator`
**File:** `components/ScrollIndicator.jsx` (81 lines)
**Purpose:** Scroll progress indicator

### `MobileBottomCta`
**File:** `components/MobileBottomCta.jsx` (135 lines)
**Purpose:** Fixed bottom CTA for mobile

### `BottomTabBar`
**File:** `components/BottomTabBar.jsx` (149 lines)
**Purpose:** Mobile bottom navigation bar

---

## Gate Components (3)

Tier-based access control.

### `PremiumGate`
**File:** `components/PremiumGate.jsx` (225 lines)
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
**File:** `components/SelectedCarBanner.jsx` (264 lines)
**Purpose:** Banner showing selected car context

### `SelectedCarFloatingWidget`
**File:** `components/SelectedCarFloatingWidget.jsx` (161 lines)
**Purpose:** Floating widget for car selection

---

## Modals (12)

Overlay dialogs.

### `AuthModal`
**File:** `components/AuthModal.jsx` (632 lines)
**Purpose:** Sign in/sign up modal
**Methods:** Google OAuth, Magic Link

### `AddVehicleModal`
**File:** `components/AddVehicleModal.jsx` (266 lines)
**Purpose:** Add owned vehicle (with VIN)
**Tier:** Collector

### `AddFavoritesModal`
**File:** `components/AddFavoritesModal.jsx` (204 lines)
**Purpose:** Add car to favorites

### `ServiceLogModal`
**File:** `components/ServiceLogModal.jsx` (459 lines)
**Purpose:** Add service log entry
**Tier:** Collector

### `CompareModal`
**File:** `components/CompareModal.jsx` (430 lines)
**Purpose:** Full comparison view

### `ShareBuildModal`
**File:** `components/ShareBuildModal.jsx` (346 lines)
**Purpose:** Share build to social/community

### `DeleteAccountModal`
**File:** `components/DeleteAccountModal.jsx` (228 lines)
**Purpose:** Confirm account deletion

### `VehicleSelectModal`
**File:** `components/VehicleSelectModal.jsx` (115 lines)
**Purpose:** Select vehicle from list

### `TrackTimeLogModal`
**File:** `components/TrackTimeLogModal.jsx` (612 lines)
**Purpose:** Log track lap times
**Tier:** Tuner

### `DynoLogModal`
**File:** `components/DynoLogModal.jsx` (559 lines)
**Purpose:** Log dyno runs
**Tier:** Tuner

### `FeedbackDimensionsModal`
**File:** `components/FeedbackDimensionsModal.jsx` (296 lines)
**Purpose:** Detailed feedback collection

### `SlideUpPanel`
**File:** `components/SlideUpPanel.jsx` (178 lines)
**Purpose:** Mobile slide-up panel/sheet

---

## Action Components (6)

User action handlers.

### `CarActionMenu`
**File:** `components/CarActionMenu.jsx` (549 lines)
**Purpose:** Dropdown menu for car actions
**Actions:** Add to favorites, Compare, View details

### `CompareBar`
**File:** `components/CompareBar.jsx` (190 lines)
**Purpose:** Fixed bar showing compare selection

### `FeedbackWidget`
**File:** `components/FeedbackWidget.jsx` (795 lines)
**Purpose:** Inline feedback collection

### `FeedbackCorner`
**File:** `components/FeedbackCorner.jsx` (72 lines)
**Purpose:** Corner feedback trigger

### `FeedbackContext`
**File:** `components/FeedbackContext.jsx` (137 lines)
**Purpose:** Feedback context provider

### `ReferralPanel`
**File:** `components/ReferralPanel.jsx` (445 lines)
**Purpose:** Referral program panel

---

## Utility & System Components (12)

Infrastructure and utility components.

### `SchemaOrg`
**File:** `components/SchemaOrg.jsx` (170 lines)
**Purpose:** JSON-LD structured data

### `PrefetchCarLink`
**File:** `components/PrefetchCarLink.jsx` (112 lines)
**Purpose:** Prefetch car data on hover

### `CarPickerFullscreen`
**File:** `components/CarPickerFullscreen.jsx` (246 lines)
**Purpose:** Fullscreen car selection

### `LocationAutocomplete`
**File:** `components/LocationAutocomplete.jsx` (499 lines)
**Purpose:** Location search autocomplete

### `VideoPlayer`
**File:** `components/VideoPlayer.jsx` (390 lines)
**Purpose:** Video player wrapper

### `ImageUploader`
**File:** `components/ImageUploader.jsx` (468 lines)
**Purpose:** Image upload with preview

### `ArticleShareButtons`
**File:** `components/ArticleShareButtons.jsx` (103 lines)
**Purpose:** Social share buttons

### `ArticleIcons`
**File:** `components/ArticleIcons.jsx` (290 lines)
**Purpose:** Article category icons

### `PageViewTracker`
**File:** `components/PageViewTracker.jsx` (421 lines)
**Purpose:** Analytics page view tracking

### `ErrorBoundary`
**File:** `components/ErrorBoundary.jsx` (188 lines)
**Purpose:** React error boundary

### `GlobalErrorHandler`
**File:** `components/GlobalErrorHandler.jsx` (93 lines)
**Purpose:** Global error handling

### `ConsoleErrorInterceptor`
**File:** `components/ConsoleErrorInterceptor.jsx` (170 lines)
**Purpose:** Console error interception

### `FetchInterceptor`
**File:** `components/FetchInterceptor.jsx` (174 lines)
**Purpose:** Fetch request interception

### `ServiceWorkerRegistration`
**File:** `components/ServiceWorkerRegistration.jsx` (28 lines)
**Purpose:** Service worker registration

### `PWAInstallPrompt`
**File:** `components/PWAInstallPrompt.jsx` (427 lines)
**Purpose:** PWA install prompt

### `BetaBanner`
**File:** `components/BetaBanner.jsx` (59 lines)
**Purpose:** Beta feature banner

### `WelcomeToast`
**File:** `components/WelcomeToast.jsx` (70 lines)
**Purpose:** Welcome notification toast

### `IPhoneFrame`
**File:** `components/IPhoneFrame.jsx` (62 lines)
**Purpose:** iPhone device frame for screenshots

### `FeaturePhoneShowcase`
**File:** `components/FeaturePhoneShowcase.jsx` (119 lines)
**Purpose:** Feature showcase in phone frame

---

## Auth Components (2)

Located in `components/auth/`

### `AuthErrorBanner`
**File:** `components/auth/AuthErrorBanner.jsx` (265 lines)
**Purpose:** Display authentication errors

### `AuthLoadingScreen`
**File:** `components/auth/AuthLoadingScreen.jsx` (417 lines)
**Purpose:** Loading screen during auth

---

## Garage Components (6)

Located in `components/garage/`

### `VehicleHealthCard`
**File:** `components/garage/VehicleHealthCard.jsx` (426 lines)
**Purpose:** Vehicle health status card

### `PremiumGarageComponents`
**File:** `components/garage/PremiumGarageComponents.jsx` (793 lines)
**Purpose:** Premium garage features
**Tier:** Collector+

### `BuildGuidanceCard`
**File:** `components/garage/BuildGuidanceCard.jsx` (225 lines)
**Purpose:** Build guidance suggestions

### `MyGarageSubNav`
**File:** `components/garage/MyGarageSubNav.jsx` (196 lines)
**Purpose:** Garage sub-navigation

### `ObjectiveBanner`
**File:** `components/garage/ObjectiveBanner.jsx` (132 lines)
**Purpose:** Build objective banner

### `VehicleInfoBar`
**File:** `components/garage/VehicleInfoBar.jsx` (115 lines)
**Purpose:** Vehicle information bar

---

## Landing Components (7)

Located in `components/landing/` - Marketing landing page components.

### `LandingHero`
**File:** `components/landing/LandingHero.jsx` (181 lines)
**Purpose:** Landing page hero section

### `LandingAL`
**File:** `components/landing/LandingAL.jsx` (191 lines)
**Purpose:** AL assistant showcase

### `LandingCTA`
**File:** `components/landing/LandingCTA.jsx` (86 lines)
**Purpose:** Landing page call-to-action

### `LandingProblem`
**File:** `components/landing/LandingProblem.jsx` (32 lines)
**Purpose:** Problem statement section

### `LandingTestimonial`
**File:** `components/landing/LandingTestimonial.jsx` (72 lines)
**Purpose:** Testimonial section

### `LandingTracking`
**File:** `components/landing/LandingTracking.jsx` (32 lines)
**Purpose:** Tracking/analytics for landing

### `FeatureShowcase`
**File:** `components/landing/FeatureShowcase.jsx` (103 lines)
**Purpose:** Feature showcase section

---

## Onboarding Components (8)

Located in `components/onboarding/` - New user onboarding flow.

### `OnboardingFlow`
**File:** `components/onboarding/OnboardingFlow.jsx` (473 lines)
**Purpose:** Main onboarding orchestration

### `OnboardingPopup`
**File:** `components/OnboardingPopup.jsx` (498 lines)
**Purpose:** Onboarding popup wrapper

### Step Components

Located in `components/onboarding/steps/`

#### `WelcomeStep`
**File:** `components/onboarding/steps/WelcomeStep.jsx` (35 lines)
**Purpose:** Welcome screen

#### `NameStep`
**File:** `components/onboarding/steps/NameStep.jsx` (52 lines)
**Purpose:** Name collection

#### `IntentStep`
**File:** `components/onboarding/steps/IntentStep.jsx` (94 lines)
**Purpose:** User intent selection

#### `BrandsStep`
**File:** `components/onboarding/steps/BrandsStep.jsx` (141 lines)
**Purpose:** Brand preferences

#### `ReferralStep`
**File:** `components/onboarding/steps/ReferralStep.jsx` (196 lines)
**Purpose:** Referral source

#### `FeatureSlide`
**File:** `components/onboarding/steps/FeatureSlide.jsx` (197 lines)
**Purpose:** Feature highlights

#### `FinalStep`
**File:** `components/onboarding/steps/FinalStep.jsx` (56 lines)
**Purpose:** Completion step

---

## Tuning Shop Components (8)

Located in `components/tuning-shop/` - Specialized tuning shop UI.

### `WheelTireConfigurator`
**File:** `components/tuning-shop/WheelTireConfigurator.jsx` (742 lines)
**Purpose:** Wheel and tire configuration

### `FactoryConfig`
**File:** `components/tuning-shop/FactoryConfig.jsx` (490 lines)
**Purpose:** Factory option configuration

### `PartsSelector`
**File:** `components/tuning-shop/PartsSelector.jsx` (412 lines)
**Purpose:** Parts selection interface

### `CategoryNav`
**File:** `components/tuning-shop/CategoryNav.jsx` (392 lines)
**Purpose:** Category navigation

### `SizeSelector`
**File:** `components/tuning-shop/SizeSelector.jsx` (367 lines)
**Purpose:** Size selection (wheels/tires)

### `BuildSummaryBar`
**File:** `components/tuning-shop/BuildSummaryBar.jsx` (300 lines)
**Purpose:** Build summary sticky bar

### `CollapsibleSection`
**File:** `components/tuning-shop/CollapsibleSection.jsx` (248 lines)
**Purpose:** Collapsible content section

### `StickyCarHeader`
**File:** `components/tuning-shop/StickyCarHeader.jsx` (221 lines)
**Purpose:** Sticky car info header

---

## UI Primitives (3)

Located in `components/ui/` - Base UI building blocks.

### `Modal`
**File:** `components/ui/Modal.jsx` (234 lines)
**Purpose:** Base modal component

### `EmptyState`
**File:** `components/ui/EmptyState.jsx` (209 lines)
**Purpose:** Empty state placeholder

### `Icons`
**File:** `components/ui/Icons.jsx` (1,268 lines)
**Purpose:** Icon component library

---

## Admin Components (40)

Located in `app/admin/components/` - Admin dashboard components.

### Financial & Business Metrics

| Component | Lines | Purpose |
|-----------|-------|---------|
| `StripeDashboard` | 602 | Stripe payment metrics & transactions |
| `PLStatement` | - | Profit & Loss statement |
| `CostBreakdown` | 257 | Detailed cost analysis |
| `CostInputForm` | 339 | Manual cost entry |
| `CostEntriesTable` | 364 | Cost entries display |
| `BreakEvenProgress` | 239 | Break-even analysis |
| `UnitEconomics` | 246 | Per-user economics |
| `CostIntegrations` | 378 | External cost integrations |

### User & Usage Analytics

| Component | Lines | Purpose |
|-----------|-------|---------|
| `UsersDashboard` | 516 | User management dashboard |
| `ALUserUsage` | 375 | AL usage per user |
| `ALUsageTrends` | 409 | AL usage trends |
| `AICostSummary` | 342 | AI cost summary |
| `UsageEstimate` | 257 | Usage forecasting |
| `RetentionMetrics` | 223 | User retention analysis |
| `FunnelChart` | - | Conversion funnel |
| `GrowthChart` | - | User growth chart |
| `MonthlyTrend` | - | Month-over-month metrics |

### Content & Data

| Component | Lines | Purpose |
|-----------|-------|---------|
| `ContentInventory` | 225 | Data coverage analysis |
| `ContentStats` | - | Content metrics |
| `ContentGrowthChart` | 445 | Content growth over time |
| `ContinuousLearning` | 359 | AI learning metrics |

### System Health

| Component | Lines | Purpose |
|-----------|-------|---------|
| `SystemHealth` | - | System status overview |
| `SystemHealthPanel` | 241 | Detailed health metrics |
| `VercelStatus` | 580 | Vercel deployment status |
| `WebVitalsPanel` | 345 | Web performance vitals |

### Analytics Dashboards

| Component | Lines | Purpose |
|-----------|-------|---------|
| `UnifiedAnalyticsDashboard` | 762 | Unified analytics view |
| `ConsolidatedAnalytics` | 752 | Consolidated metrics |
| `SiteAnalytics` | 413 | Site-wide analytics |
| `MarketingAnalytics` | 367 | Marketing metrics |
| `ExecutiveInsights` | 358 | Executive summary |

### Email & Communication

| Component | Lines | Purpose |
|-----------|-------|---------|
| `EmailDashboard` | 621 | Email delivery metrics |

### Operations

| Component | Lines | Purpose |
|-----------|-------|---------|
| `AlertsList` | - | System alerts |
| `QuickActions` | - | Common admin actions |
| `ExportButtons` | - | Data export utilities |

### UI Utilities

| Component | Lines | Purpose |
|-----------|-------|---------|
| `TabNav` | - | Tab navigation |
| `TimeRangeToggle` | - | Date range selector |
| `MonthYearSelector` | 185 | Month/year picker |
| `KPICard` | 211 | KPI display card |
| `Icons` | 418 | Admin-specific icons |
| `Tooltip` | 252 | Tooltip component |

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
    │   └── KnownIssuesAlert
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
    ├── MyGarageSubNav
    ├── Favorites Grid
    └── Owned Vehicles
        └── VehicleHealthCard
        └── VehicleInfoBar
        └── BuildGuidanceCard
        └── PremiumGarageComponents (Collector+)
            └── MarketValueSection
└── Footer
```

### Tuning Shop
```
Layout
└── Header
└── CarSelectionProvider
└── SavedBuildsProvider
└── StickyCarHeader
└── PerformanceHub
    └── Performance Bars
    └── UpgradeCenter
        └── CategoryNav
        └── PartsSelector
        └── WheelTireConfigurator
        └── FactoryConfig
└── BuildSummaryBar
└── BuildEditor (Tuner)
└── Footer
```

### Events Page
```
Layout
└── Header
└── EventFilters
    └── EventCategoryPill (multiple)
    └── LocationAutocomplete
└── View Toggle
    ├── List View
    │   └── EventCard (multiple)
    ├── Calendar View (Enthusiast+)
    │   └── EventCalendarView
    └── Map View (Enthusiast+)
        └── EventMap
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

## CSS Modules

Each component has a corresponding `.module.css` file following the naming convention:
- `ComponentName.jsx` → `ComponentName.module.css`

Example:
- `Header.module.css`
- `CarDetailSections.module.css`
- `PerformanceHub.module.css`
- `tuning-shop/PartsSelector.module.css`

---

## Size Analysis

### Largest Components (>500 lines)

| Component | Lines | Notes |
|-----------|-------|-------|
| `UpgradeCenter.jsx` | 4,230 | ⚠️ Consider refactoring |
| `PerformanceHub.jsx` | 1,764 | Core feature |
| `AuthProvider.jsx` | 1,763 | Complex auth logic |
| `ui/Icons.jsx` | 1,268 | Icon definitions |
| `SportsCarComparison.jsx` | 1,084 | Feature component |
| `BuildEditor.jsx` | 1,000 | Feature component |
| `OwnedVehiclesProvider.jsx` | 969 | Provider |
| `FeedbackWidget.jsx` | 795 | Feedback system |
| `garage/PremiumGarageComponents.jsx` | 793 | Premium features |
| `LapTimeEstimator.jsx` | 776 | Feature component |
| `tuning-shop/WheelTireConfigurator.jsx` | 742 | Tuning shop |
| `SavedBuildsProvider.jsx` | 701 | Provider |
| `AuthModal.jsx` | 632 | Modal |
| `BuildWizard.jsx` | 614 | Feature component |
| `TrackTimeLogModal.jsx` | 612 | Modal |
| `Header.jsx` | 579 | UI component |
| `DynoLogModal.jsx` | 559 | Modal |
| `CarActionMenu.jsx` | 549 | Action component |
| `PerformanceGoals.jsx` | 544 | Feature component |
| `CustomSpecsEditor.jsx` | 534 | Feature component |

---

*See [PAGES.md](PAGES.md) for page-level documentation.*
