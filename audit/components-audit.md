# Components Audit Report

**Generated:** 2026-01-22
**Scope:** All files in `components/` directory
**Total Components:** ~222 JSX files

---

## Component Categories

### 1. Performance Display Components

| Component | File | Purpose | Performance Calc Used |
|-----------|------|---------|----------------------|
| `VirtualDynoChart` | `VirtualDynoChart.jsx` | Dyno chart visualization | `lib/performance.js` |
| `PowerBreakdown` | `PowerBreakdown.jsx` | Power gain breakdown | `lib/upgradeCalculator.js` |
| `CalculatedPerformance` | `CalculatedPerformance.jsx` | Display calculated metrics | `lib/buildPerformanceCalculator.js` |
| `PerformanceHub` | `PerformanceHub.jsx` | Performance hub dashboard | `lib/performance.js` |
| `PerformanceData` | `PerformanceData.jsx` | Performance data display | Unknown |
| `PerformanceGoals` | `PerformanceGoals.jsx` | Performance goals UI | Unknown |
| `PredictedVsActual` | `PredictedVsActual.jsx` | Compare predicted/actual | Unknown |

**CRITICAL:** These components use different performance calculators, potentially showing inconsistent data.

---

### 2. Upgrade/Tuning Components

| Component | File | Purpose |
|-----------|------|---------|
| `UpgradeCenter` | `UpgradeCenter.jsx` | Main upgrade selection UI |
| `UpgradeAggregator` | `UpgradeAggregator.jsx` | Aggregate upgrade data |
| `UpgradeConfigPanel` | `UpgradeConfigPanel.jsx` | Configure upgrades |
| `UpgradeDetailModal` | `UpgradeDetailModal.jsx` | Upgrade details popup |
| `NextUpgradeRecommendation` | `NextUpgradeRecommendation.jsx` | Recommended next upgrade |

**Related Tuning Shop Components:**
- `PartsSelector` - Select parts
- `PartRecommendationCard` - Part recommendations
- `CategoryNav` - Upgrade category navigation
- `BuildSummaryBar` - Build summary display
- `FactoryConfig` - Factory configuration
- `WheelTireConfigurator` - Wheel/tire selection

---

### 3. Build Components

| Component | File | Purpose |
|-----------|------|---------|
| `BuildDetailView` | `BuildDetailView.jsx` | View build details |
| `BuildComparisonPanel` | `BuildComparisonPanel.jsx` | Compare builds |
| `BuildEditor` | `BuildEditor.jsx` | Edit build config |
| `BuildMediaGallery` | `BuildMediaGallery.jsx` | Build photos |
| `BuildProgressAnalysis` | `BuildProgressAnalysis.jsx` | Build progress |
| `BuildValueAnalysis` | `BuildValueAnalysis.jsx` | Build value analysis |
| `BuildWizard` | `BuildWizard.jsx` | Build creation wizard |
| `DynamicBuildConfig` | `DynamicBuildConfig.jsx` | Dynamic config UI |

---

### 4. Garage Components

| Component | File | Purpose |
|-----------|------|---------|
| `MyGarageSubNav` | `garage/MyGarageSubNav.jsx` | Garage navigation |
| `VehicleHealthCard` | `garage/VehicleHealthCard.jsx` | Vehicle health display |
| `VehicleInfoBar` | `garage/VehicleInfoBar.jsx` | Vehicle info strip |
| `BuildGuidanceCard` | `garage/BuildGuidanceCard.jsx` | Build guidance |
| `ObjectiveBanner` | `garage/ObjectiveBanner.jsx` | Objective banner |
| `ServiceCenterFinder` | `garage/ServiceCenterFinder.jsx` | Find service centers |
| `ServiceCenterCard` | `garage/ServiceCenterCard.jsx` | Service center display |
| `InstallPathSelector` | `garage/InstallPathSelector.jsx` | DIY vs Pro path |
| `InstallChecklistItem` | `garage/InstallChecklistItem.jsx` | Install checklist |
| `InstallToolsPanel` | `garage/InstallToolsPanel.jsx` | Tools needed |
| `DIYVideoEmbed` | `garage/DIYVideoEmbed.jsx` | DIY video player |

---

### 5. Modal Components

| Component | File | Purpose |
|-----------|------|---------|
| `Modal` | `ui/Modal.jsx` | Base modal |
| `AuthModal` | `AuthModal.jsx` | Authentication modal |
| `AddVehicleModal` | `AddVehicleModal.jsx` | Add vehicle modal |
| `AddFavoritesModal` | `AddFavoritesModal.jsx` | Add favorites modal |
| `CompareModal` | `CompareModal.jsx` | Compare cars modal |
| `ShareBuildModal` | `ShareBuildModal.jsx` | Share build modal |
| `ServiceLogModal` | `ServiceLogModal.jsx` | Service log modal |
| `TrackTimeLogModal` | `TrackTimeLogModal.jsx` | Track time modal |
| `DynoLogModal` | `DynoLogModal.jsx` | Dyno log modal |
| `VehicleSelectModal` | `VehicleSelectModal.jsx` | Vehicle select modal |
| `CelebrationModal` | `CelebrationModal.jsx` | Celebration animation |
| `FeedbackDimensionsModal` | `FeedbackDimensionsModal.jsx` | Feedback modal |
| `DeleteAccountModal` | `DeleteAccountModal.jsx` | Delete account modal |

**Observation:** Good use of base `Modal` component. Ensure all modals use it.

---

### 6. Card Components

| Component | Purpose |
|-----------|---------|
| `GarageScoreCard` | Display garage score |
| `ServiceCenterCard` | Service center info |
| `VehicleHealthCard` | Vehicle health |
| `PartRecommendationCard` | Part recommendation |
| `BuildGuidanceCard` | Build guidance |
| `ActionCard` (insights) | Action suggestion |
| `InsightCard` (insights) | Insight display |
| `EventCard` | Event display |

**Question:** Should there be a base `Card` component?

---

### 7. Provider Components

| Component | File | Purpose |
|-----------|------|---------|
| `AuthProvider` | `providers/AuthProvider.jsx` | Auth context |
| `OwnedVehiclesProvider` | `providers/OwnedVehiclesProvider.jsx` | Owned vehicles |
| `SavedBuildsProvider` | `providers/SavedBuildsProvider.jsx` | Saved builds |
| `FavoritesProvider` | `providers/FavoritesProvider.jsx` | Favorites |
| `CarSelectionProvider` | `providers/CarSelectionProvider.jsx` | Selected car |
| `CompareProvider` | `providers/CompareProvider.jsx` | Compare list |
| `QueryProvider` | `providers/QueryProvider.jsx` | React Query |
| `LoadingProgressProvider` | `providers/LoadingProgressProvider.jsx` | Loading state |
| `BannerProvider` | `providers/BannerProvider.jsx` | Banner state |

---

### 8. Landing Page Components

| Component | Purpose |
|-----------|---------|
| `LandingHero` | Hero section |
| `LandingAL` | AL feature showcase |
| `LandingCTA` | Call to action |
| `LandingProblem` | Problem statement |
| `LandingTestimonial` | Testimonials |
| `LandingTracking` | Tracking showcase |
| `FeatureShowcase` | Feature showcase |
| `HeroSection` | Hero section (duplicate?) |
| `HeroCta` | Hero CTA (duplicate?) |

**Question:** Is `HeroSection` the same as `LandingHero`?

---

### 9. Onboarding Components

| Component | Purpose |
|-----------|---------|
| `OnboardingFlow` | Main onboarding flow |
| `OnboardingPopup` | Onboarding popup |
| `WelcomeStep` | Welcome step |
| `NameStep` | Name input step |
| `BrandsStep` | Brand preferences |
| `IntentStep` | User intent |
| `ReferralStep` | Referral info |
| `FinalStep` | Final step |
| `FeatureSlide` | Feature slide |

---

### 10. UI/Utility Components

| Component | Purpose |
|-----------|---------|
| `EmptyState` | Empty state display |
| `InfoTooltip` | Info tooltip |
| `Icons` | Icon components |
| `LoadingSpinner` | Loading indicator |
| `Button` | Base button |
| `ScrollToTop` | Scroll to top |
| `SplashScreen` | App splash screen |
| `SlideUpPanel` | Slide-up panel |

---

## Potential Duplications

### 1. Hero Components
- `components/HeroSection.jsx`
- `components/HeroCta.jsx`
- `components/landing/LandingHero.jsx`

**Action:** Audit for overlap

### 2. Event Components
- `components/EventCard.jsx`
- `components/EventFilters.jsx`
- `components/EventMap.jsx`
- `components/EventCalendarView.jsx`
- `components/CarEventsSection.jsx`
- `components/GarageEventsSection.jsx`

**Question:** Are CarEventsSection and GarageEventsSection similar?

### 3. Share Components
- `components/ShareBuildButton.jsx`
- `components/ShareBuildModal.jsx`
- `components/ArticleShareButtons.jsx`

**Action:** Consider shared share utilities

---

## Missing Base Components

### Should Consider Creating

1. **Base Card Component**
   - Many card-like components exist
   - Could have consistent styling/behavior

2. **Base Form Components**
   - Input, Select, Checkbox, etc.
   - Currently using native or inline styles

3. **Base List Component**
   - For consistent list rendering
   - With loading/empty states

---

## Component Import Patterns

### Good Patterns
- UI components from `components/ui/`
- Providers from `components/providers/`
- Hooks from `hooks/`

### Potential Issues
- Some components import directly from `lib/` (should use hooks?)
- Some components do direct Supabase calls (should use services?)

---

## CSS Module Usage

| Pattern | Count | Status |
|---------|-------|--------|
| `.module.css` files | ~140 | Good |
| Inline styles | Some | Minimize |
| Tailwind utilities | Some | OK for one-offs |

**Observation:** Good use of CSS modules overall.

---

## Recommendations

### 1. Immediate
- Standardize performance calculation imports across components
- Audit Hero component duplications

### 2. Short-term
- Create base Card component
- Document component library
- Create Storybook for key components

### 3. Long-term
- Consider component design system
- Add TypeScript props interfaces
- Add component tests

---

## Summary

| Category | Count | Status |
|----------|-------|--------|
| Performance Display | 7 | **NEEDS CONSOLIDATION** |
| Upgrade/Tuning | 11 | Good |
| Build | 8 | Good |
| Garage | 11 | Good |
| Modals | 13 | Good |
| Cards | 8 | Consider base component |
| Providers | 9 | Good |
| Landing | 9 | Check duplicates |
| Onboarding | 9 | Good |
| UI/Utility | 10 | Good |
| Other | ~130 | Various |
| **Total** | **~222** | |
