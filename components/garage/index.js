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

// Vehicle info bar (below navigation, at top of content)
export { 
  default as VehicleInfoBar,
  UpgradeCountStat,
  HpGainStat,
  PartsCountStat,
} from './VehicleInfoBar';
