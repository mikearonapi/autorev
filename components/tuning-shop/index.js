/**
 * Tuning Shop Components
 *
 * Barrel export for all tuning shop related components.
 *
 * Components:
 * - FactoryConfig: Factory options configuration (transmission, wheel package)
 * - WheelTireConfigurator: Wheel/tire fitment selection
 * - SizeSelector: Part size variant selection
 * - StickyCarHeader: Collapsible sticky header after car selection
 * - BuildSummaryBar: Sticky bottom bar with build summary
 * - CategoryNav: Horizontal/vertical category navigation
 * - CollapsibleSection: Reusable accordion section
 */

// Factory Configuration
export {
  default as FactoryConfig,
  getFactoryConfigFromVehicle,
  factoryConfigToCustomSpecs,
} from './FactoryConfig';

// Wheel & Tire
export { default as WheelTireConfigurator, useWheelTireSelection } from './WheelTireConfigurator';

// Parts Size Selection
export {
  default as SizeSelector,
  InlineSizeSelector,
  useSizeSelections,
  extractSizeVariants,
  partRequiresSizeSelection,
} from './SizeSelector';

// Layout Components
export { default as StickyCarHeader } from './StickyCarHeader';
export { default as BuildSummaryBar, InlineBuildSummary } from './BuildSummaryBar';
export { default as CategoryNav, CategoryNavVertical } from './CategoryNav';
export {
  default as CollapsibleSection,
  CollapsibleAccordion,
  PerformanceSummarySection,
} from './CollapsibleSection';

// Parts Components
export { default as PartRecommendationCard, ALPartsResults } from './PartRecommendationCard';

// AL Search Inputs
export { default as ALRecommendationsButton } from './ALRecommendationsButton';
export { default as ALBuildSearchInput } from './ALBuildSearchInput';
