/**
 * UI Components Barrel Export
 *
 * Central export point for all reusable UI primitives.
 *
 * Usage:
 *   import { Icons, Modal, EmptyState, Skeleton } from '@/components/ui';
 */

export { Icons, default as IconsDefault } from './Icons';
export * from './Icons';

export { default as Modal } from './Modal';
export { default as EmptyState } from './EmptyState';

// Skeleton loading components
export {
  Skeleton,
  SkeletonText,
  CardSkeleton,
  ListItemSkeleton,
  ListSkeleton,
  TableSkeleton,
  AvatarSkeleton,
  ButtonSkeleton,
  ImageSkeleton,
  StatSkeleton,
  CarCardSkeleton,
} from './Skeleton';

// Gesture components (mobile)
export { default as PullToRefresh } from './PullToRefresh';
export { default as SwipeableRow } from './SwipeableRow';

// Feedback components
export { default as InsightFeedback } from './InsightFeedback';

// Data source indication
export {
  DataSourceBadge,
  DataSourceIndicator,
  MetricWithSource,
  PerformanceSourceSummary,
} from './DataSourceBadge';
