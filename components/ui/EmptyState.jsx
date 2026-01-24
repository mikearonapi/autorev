/**
 * EmptyState Component
 * 
 * Standardized empty state pattern with icon, title, description, and optional CTA.
 * Use this component whenever a list, grid, or section has no content to display.
 * 
 * @module components/ui/EmptyState
 * 
 * @example
 * <EmptyState
 *   icon="inbox"
 *   title="No messages yet"
 *   description="When you receive messages, they'll appear here."
 *   action={{ label: "Compose", onClick: handleCompose }}
 * />
 * 
 * @example
 * <EmptyState
 *   icon={<CustomIcon />}
 *   title="No builds saved"
 *   description="Start building your dream car"
 *   action={{ label: "Create Build", href: "/garage/builds/new" }}
 *   variant="compact"
 * />
 */

import Link from 'next/link';
import styles from './EmptyState.module.css';

// =============================================================================
// ICON MAP
// =============================================================================

const icons = {
  inbox: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
  car: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" />
      <circle cx="6.5" cy="16.5" r="2.5" />
      <circle cx="16.5" cy="16.5" r="2.5" />
    </svg>
  ),
  heart: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  search: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  calendar: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  wrench: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  message: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  list: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  folder: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  error: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * EmptyState Component
 * 
 * @param {Object} props
 * @param {string|React.ReactNode} [props.icon='inbox'] - Icon name or custom element
 * @param {string} props.title - Main heading text
 * @param {string} [props.description] - Supporting description text
 * @param {Object} [props.action] - Primary action
 * @param {string} props.action.label - Button text
 * @param {function} [props.action.onClick] - Click handler
 * @param {string} [props.action.href] - Link destination (use instead of onClick)
 * @param {Object} [props.secondaryAction] - Secondary action (same shape as action)
 * @param {'default'|'compact'|'large'} [props.variant='default'] - Size variant
 * @param {string} [props.className] - Additional CSS class
 */
export default function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
  secondaryAction,
  variant = 'default',
  className,
}) {
  // Get icon element
  const iconElement = typeof icon === 'string' ? icons[icon] || icons.inbox : icon;
  
  const variantClass = {
    default: styles.default,
    compact: styles.compact,
    large: styles.large,
  }[variant] || styles.default;
  
  return (
    <div className={`${styles.container} ${variantClass} ${className || ''}`}>
      {/* Icon */}
      <div className={styles.icon}>
        {iconElement}
      </div>
      
      {/* Title */}
      <h3 className={styles.title}>{title}</h3>
      
      {/* Description */}
      {description && (
        <p className={styles.description}>{description}</p>
      )}
      
      {/* Actions */}
      {(action || secondaryAction) && (
        <div className={styles.actions}>
          {action && (
            action.href ? (
              <Link href={action.href} className={styles.primaryAction}>
                {action.label}
              </Link>
            ) : (
              <button onClick={action.onClick} className={styles.primaryAction}>
                {action.label}
              </button>
            )
          )}
          {secondaryAction && (
            secondaryAction.href ? (
              <Link href={secondaryAction.href} className={styles.secondaryAction}>
                {secondaryAction.label}
              </Link>
            ) : (
              <button onClick={secondaryAction.onClick} className={styles.secondaryAction}>
                {secondaryAction.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// Export icon names for reference
EmptyState.iconNames = Object.keys(icons);
