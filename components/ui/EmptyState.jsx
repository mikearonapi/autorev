'use client';

/**
 * EmptyState Component
 * 
 * A reusable component for displaying empty states throughout the app.
 * Supports different variants for various use cases.
 * 
 * Variants:
 * - default: Standard empty state with icon, title, description
 * - inline: Compact version for use within lists/tables
 * - centered: Large centered display for full-page empty states
 * 
 * Usage:
 *   import { EmptyState } from '@/components/ui/EmptyState';
 *   
 *   <EmptyState
 *     icon={Icons.search}
 *     title="No results found"
 *     description="Try adjusting your search or filters"
 *     action={{ label: "Clear filters", onClick: handleClear }}
 *   />
 */

import { Icons } from './Icons';
import styles from './EmptyState.module.css';

/**
 * EmptyState Component
 * 
 * @param {React.ComponentType | React.ReactNode} icon - Icon component or element
 * @param {string} title - Primary title text
 * @param {string | React.ReactNode} description - Description or helper text
 * @param {object} action - Optional CTA { label: string, onClick: function, href?: string }
 * @param {'default' | 'inline' | 'centered'} variant - Display variant
 * @param {'sm' | 'md' | 'lg'} size - Icon size variant
 * @param {string} className - Additional CSS class
 */
export default function EmptyState({
  icon: IconProp,
  title,
  description,
  action,
  variant = 'default',
  size = 'md',
  className = '',
}) {
  // Determine icon size based on size prop
  const iconSizes = {
    sm: 16,
    md: 24,
    lg: 48,
  };
  const iconSize = iconSizes[size];

  // Render the icon
  const renderIcon = () => {
    if (!IconProp) return null;
    
    // If it's a React element (already rendered), just return it
    if (typeof IconProp !== 'function') {
      return <div className={styles.icon}>{IconProp}</div>;
    }
    
    // If it's a component (function), render it with size
    return (
      <div className={styles.icon}>
        <IconProp size={iconSize} />
      </div>
    );
  };

  const renderAction = () => {
    if (!action) return null;

    if (action.href) {
      return (
        <a href={action.href} className={styles.action}>
          {action.label}
        </a>
      );
    }

    return (
      <button onClick={action.onClick} className={styles.action}>
        {action.label}
      </button>
    );
  };

  return (
    <div className={`${styles.emptyState} ${styles[variant]} ${styles[`size-${size}`]} ${className}`}>
      {renderIcon()}
      <div className={styles.content}>
        {title && <h3 className={styles.title}>{title}</h3>}
        {description && <p className={styles.description}>{description}</p>}
        {renderAction()}
      </div>
    </div>
  );
}

// =============================================================================
// PRESET VARIANTS (Common patterns)
// =============================================================================

/**
 * EmptyState.NoResults - Search/filter with no results
 */
EmptyState.NoResults = function NoResults({ query, onClear }) {
  return (
    <EmptyState
      icon={Icons.search}
      title="No results found"
      description={query ? `No results for "${query}"` : "Try adjusting your search or filters"}
      action={onClear ? { label: "Clear filters", onClick: onClear } : undefined}
      variant="centered"
    />
  );
};

/**
 * EmptyState.NoData - Empty list/collection
 */
EmptyState.NoData = function NoData({ itemType = "items", action }) {
  return (
    <EmptyState
      icon={Icons.inbox}
      title={`No ${itemType} yet`}
      description={`When you add ${itemType}, they'll appear here`}
      action={action}
      variant="centered"
    />
  );
};

/**
 * EmptyState.Error - Error state with retry
 */
EmptyState.Error = function ErrorState({ message, onRetry }) {
  return (
    <EmptyState
      icon={Icons.alertTriangle}
      title="Something went wrong"
      description={message || "An error occurred while loading data"}
      action={onRetry ? { label: "Try again", onClick: onRetry } : undefined}
      variant="centered"
    />
  );
};

/**
 * EmptyState.Loading - Placeholder loading state
 */
EmptyState.Loading = function Loading({ message = "Loading..." }) {
  return (
    <EmptyState
      icon={Icons.spinner}
      title={message}
      variant="inline"
      size="sm"
    />
  );
};

/**
 * EmptyState.NotFound - 404/item not found
 */
EmptyState.NotFound = function NotFound({ itemType = "item", action }) {
  return (
    <EmptyState
      icon={Icons.searchSlash}
      title={`${itemType} not found`}
      description={`The ${itemType.toLowerCase()} you're looking for doesn't exist or has been removed`}
      action={action}
      variant="centered"
      size="lg"
    />
  );
};

/**
 * EmptyState.Premium - Upsell for premium features
 */
EmptyState.Premium = function Premium({ feature, action }) {
  return (
    <EmptyState
      icon={Icons.crown}
      title="Premium Feature"
      description={feature ? `${feature} is available to premium members` : "Upgrade to unlock this feature"}
      action={action}
      variant="centered"
    />
  );
};

/**
 * EmptyState.ComingSoon - Feature not yet available
 */
EmptyState.ComingSoon = function ComingSoon({ feature }) {
  return (
    <EmptyState
      icon={Icons.clock}
      title="Coming Soon"
      description={feature ? `${feature} is currently under development` : "This feature is coming soon"}
      variant="centered"
    />
  );
};
