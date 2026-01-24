/**
 * Dynamic Component Imports
 *
 * Centralized dynamic imports for heavy components that should be
 * code-split for better initial page load performance.
 *
 * These components are:
 * - Large (significant JS bundle impact)
 * - Not needed immediately on page load
 * - Often below the fold
 *
 * Usage:
 *   import { DynamicVirtualDynoChart } from '@/components/dynamic';
 *
 *   // In your component
 *   <DynamicVirtualDynoChart {...props} />
 *
 * Benefits:
 * - Reduced initial bundle size
 * - Faster Time to Interactive (TTI)
 * - Built-in loading states
 * - Automatic error boundaries
 *
 * @module components/dynamic
 */

import dynamic from 'next/dynamic';

import LoadingSpinner from './LoadingSpinner';

// =============================================================================
// LOADING SKELETONS
// =============================================================================

/**
 * Chart loading skeleton
 * Matches the approximate size and shape of chart components
 */
function ChartSkeleton({ height = 300 }) {
  return (
    <div
      style={{
        height,
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <LoadingSpinner size="medium" />
    </div>
  );
}

/**
 * Card loading skeleton for analysis components
 */
function CardSkeleton() {
  return (
    <div
      style={{
        padding: 'var(--space-lg)',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        minHeight: 150,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <LoadingSpinner size="small" />
    </div>
  );
}

// =============================================================================
// CHART COMPONENTS
// =============================================================================

/**
 * Virtual Dyno Chart - Shows HP/TQ curves
 * Heavy: Uses custom chart rendering, complex calculations
 */
export const DynamicVirtualDynoChart = dynamic(
  () => import('./VirtualDynoChart'),
  {
    loading: () => <ChartSkeleton height={350} />,
    ssr: false, // Chart rendering is client-only
  }
);

/**
 * Lap Time Estimator - Track time predictions
 * Heavy: Complex physics calculations, track data
 */
export const DynamicLapTimeEstimator = dynamic(
  () => import('./LapTimeEstimator'),
  {
    loading: () => <ChartSkeleton height={400} />,
    ssr: false,
  }
);

/**
 * Calculated Performance - 0-60, quarter mile estimates
 * Moderate: Physics calculations
 */
export const DynamicCalculatedPerformance = dynamic(
  () => import('./CalculatedPerformance'),
  {
    loading: () => <CardSkeleton />,
    ssr: false,
  }
);

/**
 * Power Breakdown - Detailed HP/TQ breakdown by component
 */
export const DynamicPowerBreakdown = dynamic(
  () => import('./PowerBreakdown'),
  {
    loading: () => <CardSkeleton />,
    ssr: false,
  }
);

/**
 * Power Limits Advisory - Engine limit warnings
 */
export const DynamicPowerLimitsAdvisory = dynamic(
  () => import('./PowerLimitsAdvisory'),
  {
    loading: () => <CardSkeleton />,
    ssr: false,
  }
);

/**
 * Handling Balance Indicator - Visual balance diagram
 */
export const DynamicHandlingBalanceIndicator = dynamic(
  () => import('./HandlingBalanceIndicator'),
  {
    loading: () => <ChartSkeleton height={200} />,
    ssr: false,
  }
);

/**
 * Aero Balance Chart - Downforce distribution
 */
export const DynamicAeroBalanceChart = dynamic(
  () => import('./AeroBalanceChart'),
  {
    loading: () => <ChartSkeleton height={200} />,
    ssr: false,
  }
);

// =============================================================================
// ANALYSIS COMPONENTS
// =============================================================================

/**
 * Build Progress Analysis - Completion tracking
 */
export const DynamicBuildProgressAnalysis = dynamic(
  () => import('./BuildProgressAnalysis'),
  {
    loading: () => <CardSkeleton />,
    ssr: false,
  }
);

/**
 * Known Issues Alert - Platform-specific warnings
 */
export const DynamicKnownIssuesAlert = dynamic(
  () => import('./KnownIssuesAlert'),
  {
    loading: () => <CardSkeleton />,
    ssr: false,
  }
);

/**
 * Build Value Analysis - Cost/value insights
 */
export const DynamicBuildValueAnalysis = dynamic(
  () => import('./BuildValueAnalysis'),
  {
    loading: () => <CardSkeleton />,
    ssr: false,
  }
);

/**
 * Platform Insights - Car platform information
 */
export const DynamicPlatformInsights = dynamic(
  () => import('./PlatformInsights'),
  {
    loading: () => <CardSkeleton />,
    ssr: false,
  }
);

/**
 * Next Upgrade Recommendation - AI-powered suggestions
 */
export const DynamicNextUpgradeRecommendation = dynamic(
  () => import('./NextUpgradeRecommendation'),
  {
    loading: () => <CardSkeleton />,
    ssr: false,
  }
);

// =============================================================================
// COMPARISON COMPONENTS
// =============================================================================

/**
 * Sports Car Comparison - Multi-car comparison charts
 * Heavy: Multiple chart renderings, complex data processing
 */
export const DynamicSportsCarComparison = dynamic(
  () => import('./SportsCarComparison'),
  {
    loading: () => <ChartSkeleton height={500} />,
    ssr: false,
  }
);

// =============================================================================
// MODAL COMPONENTS
// =============================================================================

/**
 * Dyno Log Modal - For logging dyno results
 */
export const DynamicDynoLogModal = dynamic(() => import('./DynoLogModal'), {
  loading: () => null, // Modals don't need visible loading state
  ssr: false,
});

/**
 * Track Time Log Modal - For logging track sessions
 */
export const DynamicTrackTimeLogModal = dynamic(
  () => import('./TrackTimeLogModal'),
  {
    loading: () => null,
    ssr: false,
  }
);

// =============================================================================
// UTILITY: PRELOAD FUNCTIONS
// =============================================================================

/**
 * Preload chart components when user is likely to need them
 * Call this on hover/focus of navigation elements
 */
export function preloadChartComponents() {
  // Trigger dynamic imports to start loading
  import('./VirtualDynoChart');
  import('./LapTimeEstimator');
  import('./CalculatedPerformance');
}

/**
 * Preload analysis components
 */
export function preloadAnalysisComponents() {
  import('./BuildProgressAnalysis');
  import('./KnownIssuesAlert');
  import('./NextUpgradeRecommendation');
}

export default {
  // Charts
  DynamicVirtualDynoChart,
  DynamicLapTimeEstimator,
  DynamicCalculatedPerformance,
  DynamicPowerBreakdown,
  DynamicPowerLimitsAdvisory,
  DynamicHandlingBalanceIndicator,
  DynamicAeroBalanceChart,

  // Analysis
  DynamicBuildProgressAnalysis,
  DynamicKnownIssuesAlert,
  DynamicBuildValueAnalysis,
  DynamicPlatformInsights,
  DynamicNextUpgradeRecommendation,

  // Comparison
  DynamicSportsCarComparison,

  // Modals
  DynamicDynoLogModal,
  DynamicTrackTimeLogModal,

  // Utilities
  preloadChartComponents,
  preloadAnalysisComponents,
};
