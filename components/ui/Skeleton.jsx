/**
 * Skeleton Loading Components
 * 
 * Provides loading placeholders for content to improve perceived performance.
 * Features a smooth shimmer animation for visual feedback.
 * 
 * @module components/ui/Skeleton
 * 
 * @example
 * // Basic usage
 * <Skeleton width={200} height={20} />
 * 
 * // Text placeholder
 * <SkeletonText lines={3} />
 * 
 * // Card skeleton
 * <CardSkeleton />
 * 
 * // List skeleton
 * <ListSkeleton count={5} />
 * 
 * // Table skeleton
 * <TableSkeleton rows={10} columns={4} />
 */

import styles from './Skeleton.module.css';

// =============================================================================
// BASE SKELETON
// =============================================================================

/**
 * Base skeleton component with shimmer animation
 * 
 * @param {Object} props
 * @param {number|string} [props.width] - Width (number for px, string for other units)
 * @param {number|string} [props.height] - Height (number for px, string for other units)
 * @param {string} [props.variant='rectangular'] - Shape: 'rectangular' | 'circular' | 'rounded'
 * @param {boolean} [props.animate=true] - Whether to show shimmer animation
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} [props.style] - Additional inline styles
 */
export function Skeleton({
  width,
  height,
  variant = 'rectangular',
  animate = true,
  className = '',
  style = {},
}) {
  const inlineStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style,
  };

  return (
    <div
      className={`${styles.skeleton} ${styles[variant]} ${animate ? styles.animate : ''} ${className}`}
      style={inlineStyle}
      aria-hidden="true"
      role="presentation"
    />
  );
}

// =============================================================================
// SPECIALIZED SKELETONS
// =============================================================================

/**
 * Text skeleton with multiple lines
 * 
 * @param {Object} props
 * @param {number} [props.lines=3] - Number of text lines
 * @param {number} [props.lineHeight=20] - Height of each line in px
 * @param {number} [props.gap=8] - Gap between lines in px
 * @param {string} [props.className] - Additional CSS classes
 */
export function SkeletonText({
  lines = 3,
  lineHeight = 20,
  gap = 8,
  className = '',
}) {
  return (
    <div className={`${styles.textWrapper} ${className}`} style={{ gap: `${gap}px` }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={lineHeight}
          width={i === lines - 1 ? '70%' : '100%'} // Last line shorter
          variant="rounded"
        />
      ))}
    </div>
  );
}

/**
 * Card skeleton for card-based layouts
 * 
 * @param {Object} props
 * @param {boolean} [props.hasImage=true] - Whether to show image placeholder
 * @param {number} [props.imageHeight=160] - Height of image placeholder
 * @param {string} [props.className] - Additional CSS classes
 */
export function CardSkeleton({
  hasImage = true,
  imageHeight = 160,
  className = '',
}) {
  return (
    <div className={`${styles.card} ${className}`}>
      {hasImage && (
        <Skeleton height={imageHeight} className={styles.cardImage} variant="rectangular" />
      )}
      <div className={styles.cardContent}>
        <Skeleton height={24} width="80%" variant="rounded" />
        <SkeletonText lines={2} lineHeight={16} gap={6} />
        <div className={styles.cardFooter}>
          <Skeleton height={32} width={100} variant="rounded" />
          <Skeleton height={32} width={32} variant="circular" />
        </div>
      </div>
    </div>
  );
}

/**
 * List item skeleton
 * 
 * @param {Object} props
 * @param {boolean} [props.hasAvatar=false] - Whether to show avatar placeholder
 * @param {string} [props.className] - Additional CSS classes
 */
export function ListItemSkeleton({
  hasAvatar = false,
  className = '',
}) {
  return (
    <div className={`${styles.listItem} ${className}`}>
      {hasAvatar && (
        <Skeleton width={40} height={40} variant="circular" />
      )}
      <div className={styles.listItemContent}>
        <Skeleton height={18} width="60%" variant="rounded" />
        <Skeleton height={14} width="80%" variant="rounded" />
      </div>
    </div>
  );
}

/**
 * List skeleton with multiple items
 * 
 * @param {Object} props
 * @param {number} [props.count=5] - Number of items
 * @param {boolean} [props.hasAvatar=false] - Whether items have avatars
 * @param {string} [props.className] - Additional CSS classes
 */
export function ListSkeleton({
  count = 5,
  hasAvatar = false,
  className = '',
}) {
  return (
    <div className={`${styles.list} ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} hasAvatar={hasAvatar} />
      ))}
    </div>
  );
}

/**
 * Table skeleton for tabular data
 * 
 * @param {Object} props
 * @param {number} [props.rows=5] - Number of data rows
 * @param {number} [props.columns=4] - Number of columns
 * @param {boolean} [props.hasHeader=true] - Whether to show header row
 * @param {string} [props.className] - Additional CSS classes
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  hasHeader = true,
  className = '',
}) {
  return (
    <div className={`${styles.table} ${className}`}>
      {hasHeader && (
        <div className={styles.tableHeader}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} height={16} variant="rounded" />
          ))}
        </div>
      )}
      <div className={styles.tableBody}>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className={styles.tableRow}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={colIndex} 
                height={16} 
                width={colIndex === 0 ? '80%' : '60%'}
                variant="rounded" 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Avatar skeleton
 * 
 * @param {Object} props
 * @param {number} [props.size=40] - Size in pixels
 * @param {string} [props.className] - Additional CSS classes
 */
export function AvatarSkeleton({
  size = 40,
  className = '',
}) {
  return (
    <Skeleton
      width={size}
      height={size}
      variant="circular"
      className={className}
    />
  );
}

/**
 * Button skeleton
 * 
 * @param {Object} props
 * @param {number} [props.width=120] - Width in pixels
 * @param {number} [props.height=40] - Height in pixels
 * @param {string} [props.className] - Additional CSS classes
 */
export function ButtonSkeleton({
  width = 120,
  height = 40,
  className = '',
}) {
  return (
    <Skeleton
      width={width}
      height={height}
      variant="rounded"
      className={className}
    />
  );
}

/**
 * Image skeleton
 * 
 * @param {Object} props
 * @param {number|string} [props.width='100%'] - Width
 * @param {number} [props.height=200] - Height in pixels
 * @param {string} [props.aspectRatio] - CSS aspect-ratio (e.g., '16/9')
 * @param {string} [props.className] - Additional CSS classes
 */
export function ImageSkeleton({
  width = '100%',
  height = 200,
  aspectRatio,
  className = '',
}) {
  const style = aspectRatio
    ? { aspectRatio, height: 'auto' }
    : { height: typeof height === 'number' ? `${height}px` : height };

  return (
    <Skeleton
      width={width}
      variant="rectangular"
      className={`${styles.imageSkeleton} ${className}`}
      style={style}
    />
  );
}

/**
 * Stat/metric skeleton
 * 
 * @param {Object} props
 * @param {string} [props.className] - Additional CSS classes
 */
export function StatSkeleton({ className = '' }) {
  return (
    <div className={`${styles.stat} ${className}`}>
      <Skeleton height={32} width="60%" variant="rounded" />
      <Skeleton height={14} width="80%" variant="rounded" />
    </div>
  );
}

/**
 * Car card skeleton - specialized for AutoRev car cards
 */
export function CarCardSkeleton({ className = '' }) {
  return (
    <div className={`${styles.carCard} ${className}`}>
      <Skeleton height={180} className={styles.carCardImage} variant="rectangular" />
      <div className={styles.carCardContent}>
        <Skeleton height={20} width="70%" variant="rounded" />
        <Skeleton height={16} width="50%" variant="rounded" />
        <div className={styles.carCardStats}>
          <Skeleton height={24} width={60} variant="rounded" />
          <Skeleton height={24} width={60} variant="rounded" />
          <Skeleton height={24} width={60} variant="rounded" />
        </div>
        <div className={styles.carCardFooter}>
          <Skeleton height={14} width="40%" variant="rounded" />
          <Skeleton height={28} width={80} variant="rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Dyno chart skeleton - specialized for Virtual Dyno chart
 * Mimics the layout of the actual chart for smooth loading transition
 */
export function DynoChartSkeleton({ className = '' }) {
  return (
    <div className={`${styles.dynoChart} ${className}`}>
      {/* Header */}
      <div className={styles.dynoChartHeader}>
        <Skeleton height={16} width={100} variant="rounded" />
        <Skeleton height={14} width={200} variant="rounded" />
      </div>
      {/* Legend */}
      <div className={styles.dynoChartLegend}>
        <Skeleton height={14} width={60} variant="rounded" />
        <Skeleton height={14} width={80} variant="rounded" />
        <Skeleton height={14} width={80} variant="rounded" />
      </div>
      {/* Chart area with Y-axis and main area */}
      <div className={styles.dynoChartBody}>
        {/* Y-Axis */}
        <div className={styles.dynoChartYAxis}>
          <Skeleton height={10} width={30} variant="rounded" />
          <Skeleton height={10} width={30} variant="rounded" />
          <Skeleton height={10} width={30} variant="rounded" />
          <Skeleton height={10} width={30} variant="rounded" />
          <Skeleton height={10} width={20} variant="rounded" />
        </div>
        {/* Main chart area */}
        <Skeleton 
          height="100%" 
          width="100%" 
          variant="rounded" 
          className={styles.dynoChartArea}
        />
      </div>
      {/* X-Axis */}
      <div className={styles.dynoChartXAxis}>
        <Skeleton height={10} width={20} variant="rounded" />
        <Skeleton height={10} width={20} variant="rounded" />
        <Skeleton height={10} width={20} variant="rounded" />
        <Skeleton height={10} width={20} variant="rounded" />
        <Skeleton height={10} width={40} variant="rounded" />
      </div>
    </div>
  );
}

/**
 * Data page skeleton - full page loading state for /data
 * Matches the layout of VirtualDynoChart + CalculatedPerformance + PowerBreakdown
 */
export function DataPageSkeleton({ className = '' }) {
  return (
    <div className={`${styles.dataPageSkeleton} ${className}`}>
      {/* Estimate explainer */}
      <Skeleton height={48} width="100%" variant="rounded" style={{ marginBottom: '16px' }} />
      
      {/* Virtual Dyno Chart */}
      <DynoChartSkeleton />
      
      {/* Calculated Performance */}
      <div className={styles.perfSection}>
        <Skeleton height={18} width={160} variant="rounded" style={{ marginBottom: '12px' }} />
        <div className={styles.perfGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.perfMetric}>
              <Skeleton height={14} width="60%" variant="rounded" />
              <Skeleton height={8} width="100%" variant="rounded" style={{ marginTop: '8px' }} />
            </div>
          ))}
        </div>
      </div>
      
      {/* Power Breakdown */}
      <div className={styles.powerSection}>
        <Skeleton height={18} width={140} variant="rounded" style={{ marginBottom: '16px' }} />
        <div className={styles.powerLayout}>
          <Skeleton height={140} width={140} variant="circular" />
          <div className={styles.powerLegend}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={24} width="100%" variant="rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Default export for convenience
export default Skeleton;
