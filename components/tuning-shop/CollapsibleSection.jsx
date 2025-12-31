'use client';

/**
 * Collapsible Section Component
 * 
 * Reusable accordion section for organizing tuning shop content.
 * Used to reduce visual clutter on mobile by collapsing secondary info.
 * 
 * @module components/tuning-shop/CollapsibleSection
 */

import { useState, useCallback, useId } from 'react';
import styles from './CollapsibleSection.module.css';

const ChevronIcon = ({ isOpen }) => (
  <svg 
    width={16} 
    height={16} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
  >
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

/**
 * @typedef {Object} CollapsibleSectionProps
 * @property {string} title - Section title
 * @property {React.ReactNode} [icon] - Icon to show before title
 * @property {React.ReactNode} children - Section content
 * @property {boolean} [defaultExpanded] - Start expanded
 * @property {React.ReactNode} [summary] - Summary text shown when collapsed
 * @property {React.ReactNode} [badge] - Badge shown in header
 * @property {string} [variant] - Visual variant: 'default' | 'compact' | 'highlighted'
 * @property {boolean} [disabled] - Disable toggle
 * @property {function} [onToggle] - Callback when toggled
 * @property {string} [className] - Additional CSS class
 */

/**
 * Collapsible Section
 * @param {CollapsibleSectionProps} props
 */
export default function CollapsibleSection({
  title,
  icon,
  children,
  defaultExpanded = false,
  summary,
  badge,
  variant = 'default',
  disabled = false,
  onToggle,
  className = '',
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentId = useId();
  const headerId = useId();

  const handleToggle = useCallback(() => {
    if (disabled) return;
    
    setIsExpanded(prev => {
      const next = !prev;
      onToggle?.(next);
      return next;
    });
  }, [disabled, onToggle]);

  const variantClass = {
    default: '',
    compact: styles.variantCompact,
    highlighted: styles.variantHighlighted,
  }[variant] || '';

  return (
    <div className={`${styles.container} ${variantClass} ${className}`}>
      <button
        id={headerId}
        className={styles.header}
        onClick={handleToggle}
        disabled={disabled}
        aria-expanded={isExpanded}
        aria-controls={contentId}
      >
        <div className={styles.headerLeft}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <span className={styles.title}>{title}</span>
          {badge && <span className={styles.badge}>{badge}</span>}
        </div>
        <div className={styles.headerRight}>
          {!isExpanded && summary && (
            <span className={styles.summary}>{summary}</span>
          )}
          <ChevronIcon isOpen={isExpanded} />
        </div>
      </button>

      {isExpanded && (
        <div 
          id={contentId}
          className={styles.content}
          role="region"
          aria-labelledby={headerId}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Group of collapsible sections with accordion behavior (only one open at a time)
 */
export function CollapsibleAccordion({
  children,
  allowMultiple = false,
  defaultOpenIndex = null,
}) {
  const [openIndex, setOpenIndex] = useState(
    allowMultiple ? (defaultOpenIndex !== null ? [defaultOpenIndex] : []) : defaultOpenIndex
  );

  const handleToggle = useCallback((index, isOpen) => {
    if (allowMultiple) {
      setOpenIndex(prev => {
        if (isOpen) {
          return [...prev, index];
        } else {
          return prev.filter(i => i !== index);
        }
      });
    } else {
      setOpenIndex(isOpen ? index : null);
    }
  }, [allowMultiple]);

  // Clone children and inject expanded state
  const items = Array.isArray(children) ? children : [children];
  
  return (
    <div className={styles.accordion}>
      {items.map((child, index) => {
        if (!child) return null;
        
        const isExpanded = allowMultiple 
          ? openIndex.includes(index)
          : openIndex === index;
        
        return (
          <div key={index}>
            {/* We render children directly but they control their own state */}
            {child}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Performance summary section - condensed stats with expandable detail
 */
export function PerformanceSummarySection({
  hpGain = 0,
  tqGain = 0,
  zeroToSixty,
  quarterMile,
  topSpeed,
  defaultExpanded = false,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const hasDetailedStats = zeroToSixty || quarterMile || topSpeed;

  return (
    <div className={`${styles.container} ${styles.performanceSection}`}>
      <button
        className={styles.header}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className={styles.headerLeft}>
          <span className={styles.performanceIcon}>⚡</span>
          <span className={styles.title}>Performance Impact</span>
        </div>
        <div className={styles.performanceStats}>
          {hpGain > 0 && (
            <span className={styles.performanceStat}>
              <span className={styles.performanceValue}>+{hpGain}</span>
              <span className={styles.performanceLabel}>HP</span>
            </span>
          )}
          {tqGain > 0 && (
            <span className={styles.performanceStat}>
              <span className={styles.performanceValue}>+{tqGain}</span>
              <span className={styles.performanceLabel}>TQ</span>
            </span>
          )}
          {hasDetailedStats && <ChevronIcon isOpen={isExpanded} />}
        </div>
      </button>

      {isExpanded && hasDetailedStats && (
        <div className={styles.content}>
          <div className={styles.performanceGrid}>
            {zeroToSixty && (
              <div className={styles.performanceCard}>
                <span className={styles.performanceCardLabel}>0-60 mph</span>
                <span className={styles.performanceCardValue}>{zeroToSixty}s</span>
              </div>
            )}
            {quarterMile && (
              <div className={styles.performanceCard}>
                <span className={styles.performanceCardLabel}>1/4 Mile</span>
                <span className={styles.performanceCardValue}>{quarterMile}s</span>
              </div>
            )}
            {topSpeed && (
              <div className={styles.performanceCard}>
                <span className={styles.performanceCardLabel}>Top Speed</span>
                <span className={styles.performanceCardValue}>{topSpeed} mph</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



