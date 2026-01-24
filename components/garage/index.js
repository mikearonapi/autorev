/**
 * Garage Components - Premium GRAVL-inspired Design
 * 
 * Export all garage-related components for easy importing.
 */

// Premium garage components
export {
  VehicleSelector,
  QuickActionBar,
  CircularGauge,
  PremiumSpecCard,
  PremiumSpecRow,
  FloatingCTA,
  HealthSummaryRow,
  SegmentControl,
  PremiumIcons,
} from './PremiumGarageComponents';

// Existing components
export { default as VehicleHealthCard } from './VehicleHealthCard';

// Sub-navigation for garage pages
export { default as MyGarageSubNav } from './MyGarageSubNav';

// Vehicle selector (matches Insights page design)
export { default as GarageVehicleSelector } from './GarageVehicleSelector';

// Vehicle info bar (below navigation, at top of content)
export { 
  default as VehicleInfoBar,
  UpgradeCountStat,
  HpGainStat,
  PartsCountStat,
} from './VehicleInfoBar';

// Objective banner for build goals
export { default as ObjectiveBanner } from './ObjectiveBanner';

// Build guidance card with conditional trust signals
export { default as BuildGuidanceCard } from './BuildGuidanceCard';
