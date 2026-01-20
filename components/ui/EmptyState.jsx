/**
 * EmptyState Component
 * 
 * A reusable component for displaying empty states across the app.
 * Provides consistent styling for "no data" scenarios.
 * 
 * Usage:
 *   import EmptyState from '@/components/ui/EmptyState';
 *   
 *   <EmptyState 
 *     variant="no-results"
 *     description="Try adjusting your filters"
 *     action={{ label: 'Clear filters', onClick: handleClear }}
 *   />
 * 
 * Or with custom content:
 *   <EmptyState
 *     icon={<MyIcon />}
 *     title="No vehicles yet"
 *     description="Add your first vehicle to get started"
 *   />
 */

import { Icons } from './Icons';
import styles from './EmptyState.module.css';

// =============================================================================
// VARIANT CONFIGURATIONS
// =============================================================================

const VARIANTS = {
  // Search & filtering
  'no-results': {
    icon: Icons.search,
    title: 'No results found',
    description: 'Try adjusting your search or filters',
  },
  
  // Empty lists
  'no-data': {
    icon: Icons.layers,
    title: 'No data available',
    description: 'There is nothing to display here yet',
  },
  
  'no-vehicles': {
    icon: Icons.car,
    title: 'No vehicles yet',
    description: 'Add your first vehicle to get started',
  },
  
  'no-builds': {
    icon: Icons.wrench,
    title: 'No builds yet',
    description: 'Create your first build to track modifications',
  },
  
  'no-events': {
    icon: Icons.calendar,
    title: 'No events found',
    description: 'Check back later for upcoming events',
  },
  
  'no-favorites': {
    icon: Icons.heart,
    title: 'No favorites yet',
    description: 'Save items to access them quickly',
  },
  
  // Errors & states
  'error': {
    icon: Icons.alertCircle,
    title: 'Something went wrong',
    description: 'Please try again or contact support',
  },
  
  'offline': {
    icon: Icons.alertTriangle,
    title: 'You are offline',
    description: 'Check your internet connection',
  },
  
  // Onboarding
  'get-started': {
    icon: Icons.sparkles,
    title: 'Get started',
    description: 'Take the first step to begin',
  },
  
  'welcome': {
    icon: Icons.home,
    title: 'Welcome!',
    description: 'Let\'s set things up for you',
  },
  
  // Default
  'default': {
    icon: Icons.layers,
    title: 'Nothing here',
    description: 'This section is empty',
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * EmptyState Component
 * 
 * @param {'no-results' | 'no-data' | 'no-vehicles' | 'no-builds' | 'no-events' | 'no-favorites' | 'error' | 'offline' | 'get-started' | 'welcome' | 'default'} variant - Preset variant
 * @param {React.ReactNode} icon - Custom icon (overrides variant)
 * @param {string} title - Custom title (overrides variant)
 * @param {string} description - Custom description (overrides variant)
 * @param {{ label: string, onClick: function, variant?: string }} action - Primary action button
 * @param {{ label: string, onClick: function }} secondaryAction - Secondary action button
 * @param {'sm' | 'md' | 'lg'} size - Component size
 * @param {string} className - Additional CSS class
 */
export default function EmptyState({
  variant = 'default',
  icon: customIcon,
  title: customTitle,
  description: customDescription,
  action,
  secondaryAction,
  size = 'md',
  className = '',
}) {
  const config = VARIANTS[variant] || VARIANTS.default;
  
  // Use custom props if provided, otherwise use variant config
  const IconComponent = customIcon ? () => customIcon : config.icon;
  const title = customTitle ?? config.title;
  const description = customDescription ?? config.description;

  return (
    <div className={`${styles.container} ${styles[size]} ${className}`}>
      {/* Icon */}
      <div className={styles.iconWrapper}>
        <IconComponent size={size === 'lg' ? 56 : size === 'sm' ? 36 : 48} />
      </div>
      
      {/* Title */}
      {title && (
        <h3 className={styles.title}>{title}</h3>
      )}
      
      {/* Description */}
      {description && (
        <p className={styles.description}>{description}</p>
      )}
      
      {/* Actions */}
      {(action || secondaryAction) && (
        <div className={styles.actions}>
          {action && (
            <button 
              className={`${styles.actionButton} ${action.variant === 'secondary' ? styles.secondary : styles.primary}`}
              onClick={action.onClick}
              type="button"
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button 
              className={`${styles.actionButton} ${styles.secondary}`}
              onClick={secondaryAction.onClick}
              type="button"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// COMPOUND COMPONENTS (for more flexibility)
// =============================================================================

/**
 * EmptyState.Icon - Custom icon container
 */
EmptyState.Icon = function EmptyStateIcon({ children, className = '' }) {
  return (
    <div className={`${styles.iconWrapper} ${className}`}>
      {children}
    </div>
  );
};

/**
 * EmptyState.Title - Custom title
 */
EmptyState.Title = function EmptyStateTitle({ children, className = '' }) {
  return (
    <h3 className={`${styles.title} ${className}`}>
      {children}
    </h3>
  );
};

/**
 * EmptyState.Description - Custom description
 */
EmptyState.Description = function EmptyStateDescription({ children, className = '' }) {
  return (
    <p className={`${styles.description} ${className}`}>
      {children}
    </p>
  );
};

/**
 * EmptyState.Actions - Action buttons container
 */
EmptyState.Actions = function EmptyStateActions({ children, className = '' }) {
  return (
    <div className={`${styles.actions} ${className}`}>
      {children}
    </div>
  );
};
