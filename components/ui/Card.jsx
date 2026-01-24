'use client';

/**
 * Card Component - Reusable card UI element
 * 
 * Uses centralized card styles from styles/components/cards.css
 * 
 * @module components/ui/Card
 * @see styles/components/cards.css
 */

import { forwardRef } from 'react';
import styles from '@/styles/components/cards.css';

/**
 * Card variants mapping to CSS classes
 */
const VARIANTS = {
  default: 'card',
  interactive: 'card-interactive',
  elevated: 'card-elevated',
  outlined: 'card-outlined',
  highlight: 'card-highlight',
  teal: 'card-teal',
  dashed: 'card-dashed',
  success: 'card-success',
  warning: 'card-warning',
  error: 'card-error',
  compact: 'card-compact',
  flush: 'card-flush',
};

/**
 * Base Card component
 * 
 * @param {Object} props
 * @param {string} [props.variant='default'] - Card variant (default, interactive, elevated, etc.)
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} props.children - Card content
 * @param {boolean} [props.hoverable] - Add hover effects
 * @param {string} [props.as='div'] - HTML element to render
 */
const Card = forwardRef(function Card(
  { 
    variant = 'default', 
    className = '', 
    children, 
    hoverable = false,
    as: Component = 'div',
    ...props 
  }, 
  ref
) {
  const variantClass = VARIANTS[variant] || VARIANTS.default;
  const hoverClass = hoverable && variant === 'default' ? 'card-interactive' : '';
  
  const combinedClassName = [
    variantClass,
    hoverClass,
    className,
  ].filter(Boolean).join(' ');

  return (
    <Component ref={ref} className={combinedClassName} {...props}>
      {children}
    </Component>
  );
});

/**
 * Card Header component
 */
export function CardHeader({ className = '', children, ...props }) {
  return (
    <div className={`card-header ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * Card Body component
 */
export function CardBody({ className = '', children, ...props }) {
  return (
    <div className={`card-body ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * Card Footer component
 */
export function CardFooter({ className = '', children, ...props }) {
  return (
    <div className={`card-footer ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * Card Title component
 */
export function CardTitle({ className = '', children, as: Component = 'h3', ...props }) {
  return (
    <Component className={`card-title ${className}`} {...props}>
      {children}
    </Component>
  );
}

/**
 * Interactive Card Link wrapper
 * For cards that should be clickable links
 */
export function CardLink({ href, className = '', children, ...props }) {
  return (
    <a href={href} className={`card-interactive ${className}`} {...props}>
      {children}
    </a>
  );
}

// Export available variants for reference
export const CARD_VARIANTS = Object.keys(VARIANTS);

export default Card;
