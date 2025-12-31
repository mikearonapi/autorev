'use client';

/**
 * Tooltip Component
 * 
 * Reusable tooltip for explaining metrics across the admin dashboard.
 * Supports hover-triggered explanations for ARPU, LTV, CAC, etc.
 */

import { useState, useRef, useEffect } from 'react';
import styles from './Tooltip.module.css';

// Info icon for tooltips
const InfoIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

/**
 * Metric definitions for common business/SaaS terms
 */
export const METRIC_DEFINITIONS = {
  // Unit Economics
  ARPU: {
    label: 'ARPU',
    full: 'Average Revenue Per User',
    description: 'Total revenue divided by total users. Shows how much revenue each user generates on average per month.',
  },
  LTV: {
    label: 'LTV',
    full: 'Lifetime Value',
    description: 'The total revenue expected from a customer over their entire relationship. Calculated as ARPU × expected customer lifetime (typically 24 months).',
  },
  CAC: {
    label: 'CAC',
    full: 'Customer Acquisition Cost',
    description: 'The cost to acquire a new customer. Calculated as total marketing spend divided by new customers acquired.',
  },
  LTV_CAC: {
    label: 'LTV:CAC Ratio',
    full: 'Lifetime Value to Customer Acquisition Cost',
    description: 'How much value you get per dollar spent acquiring customers. A ratio of 3x or higher indicates healthy unit economics.',
  },
  CONVERSION: {
    label: 'Conversion Rate',
    full: 'Free to Paid Conversion',
    description: 'Percentage of users who convert from free to paying customers.',
  },
  RUNWAY: {
    label: 'Cash Runway',
    full: 'Months of Operating Cash',
    description: 'How many months the company can operate at current burn rate before running out of cash.',
  },
  
  // Revenue Metrics
  MRR: {
    label: 'MRR',
    full: 'Monthly Recurring Revenue',
    description: 'Predictable revenue received every month from subscriptions.',
  },
  ARR: {
    label: 'ARR',
    full: 'Annual Recurring Revenue',
    description: 'MRR × 12. Annualized view of subscription revenue.',
  },
  
  // Growth Metrics
  DAU: {
    label: 'DAU',
    full: 'Daily Active Users',
    description: 'Unique users who engaged with the product in the last 24 hours.',
  },
  WAU: {
    label: 'WAU',
    full: 'Weekly Active Users',
    description: 'Unique users who engaged with the product in the last 7 days.',
  },
  MAU: {
    label: 'MAU',
    full: 'Monthly Active Users',
    description: 'Unique users who engaged with the product in the last 30 days.',
  },
  CHURN: {
    label: 'Churn Rate',
    full: 'Customer Churn Rate',
    description: 'Percentage of customers who stop using the product over a given period.',
  },
  RETENTION: {
    label: 'Retention Rate',
    full: 'Customer Retention Rate',
    description: 'Percentage of customers who continue using the product. Calculated as 100% minus churn rate.',
  },
  
  // Engagement Metrics
  BOUNCE: {
    label: 'Bounce Rate',
    full: 'Single-Page Session Rate',
    description: 'Percentage of visitors who leave after viewing only one page. Lower is generally better.',
  },
  SESSION: {
    label: 'Session Duration',
    full: 'Average Session Duration',
    description: 'Average time users spend on your site per visit.',
  },
  PAGES_PER_SESSION: {
    label: 'Pages/Session',
    full: 'Pages Per Session',
    description: 'Average number of pages viewed during a single visit.',
  },
  
  // Financial Metrics
  BURN_RATE: {
    label: 'Burn Rate',
    full: 'Monthly Cash Burn',
    description: 'How much cash the company spends per month above what it earns.',
  },
  GROSS_MARGIN: {
    label: 'Gross Margin',
    full: 'Gross Profit Margin',
    description: 'Revenue minus cost of goods sold, divided by revenue. Shows profitability before operating expenses.',
  },
  NET_POSITION: {
    label: 'Net Position',
    full: 'Net Income/Loss',
    description: 'Total revenue minus all expenses. Positive = profit, negative = loss.',
  },
  R_AND_D: {
    label: 'R&D',
    full: 'Research & Development',
    description: 'Investment in product development, engineering, and innovation.',
  },
  OPEX: {
    label: 'OpEx',
    full: 'Operating Expenses',
    description: 'Day-to-day costs of running the business (hosting, tools, services).',
  },
  
  // Break-Even
  BREAK_EVEN: {
    label: 'Break-Even',
    full: 'Break-Even Point',
    description: 'The point where revenue equals expenses. No profit, no loss.',
  },
};

/**
 * Tooltip Component
 * 
 * @param {string} metric - Key from METRIC_DEFINITIONS
 * @param {string} customLabel - Override the label
 * @param {string} customDescription - Override the description
 * @param {ReactNode} children - Content to wrap with tooltip
 * @param {boolean} showIcon - Show info icon (default true when no children)
 */
export function Tooltip({ 
  metric,
  customLabel,
  customDescription,
  children,
  showIcon = true,
  position = 'top',
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState(position);
  const tooltipRef = useRef(null);
  const containerRef = useRef(null);
  
  const definition = metric ? METRIC_DEFINITIONS[metric] : null;
  const label = customLabel || definition?.full || definition?.label || '';
  const description = customDescription || definition?.description || '';
  
  // Adjust position if tooltip would go off-screen
  useEffect(() => {
    if (isVisible && tooltipRef.current && containerRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      
      if (tooltipRect.top < 0) {
        setTooltipPosition('bottom');
      } else if (tooltipRect.bottom > window.innerHeight) {
        setTooltipPosition('top');
      }
      
      if (tooltipRect.left < 0) {
        setTooltipPosition('right');
      } else if (tooltipRect.right > window.innerWidth) {
        setTooltipPosition('left');
      }
    }
  }, [isVisible]);
  
  if (!label && !description) {
    return children || null;
  }
  
  return (
    <span 
      ref={containerRef}
      className={styles.container}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {showIcon && !children && <InfoIcon size={12} />}
      {showIcon && children && (
        <span className={styles.iconWrapper}>
          <InfoIcon size={12} />
        </span>
      )}
      
      {isVisible && (
        <div 
          ref={tooltipRef}
          className={`${styles.tooltip} ${styles[tooltipPosition]}`}
        >
          {label && <span className={styles.tooltipLabel}>{label}</span>}
          {description && <span className={styles.tooltipDescription}>{description}</span>}
        </div>
      )}
    </span>
  );
}

/**
 * MetricLabel Component
 * 
 * A label with built-in tooltip. Use for metric headers.
 * 
 * @param {string} metric - Key from METRIC_DEFINITIONS
 * @param {string} label - Display label (defaults to metric's label)
 */
export function MetricLabel({ metric, label, className = '' }) {
  const definition = metric ? METRIC_DEFINITIONS[metric] : null;
  const displayLabel = label || definition?.label || metric;
  
  return (
    <span className={`${styles.metricLabel} ${className}`}>
      {displayLabel}
      {definition && (
        <Tooltip metric={metric} showIcon={true}>
          <span />
        </Tooltip>
      )}
    </span>
  );
}

export default Tooltip;

