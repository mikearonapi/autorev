import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Button.module.css';

/**
 * Button component - supports both button and link variants
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'outline' | 'ghost'} props.variant - Button style variant
 * @param {'sm' | 'md' | 'lg'} props.size - Button size
 * @param {string} props.to - If provided, renders as Link
 * @param {string} props.href - If provided, renders as anchor
 * @param {boolean} props.fullWidth - Makes button full width
 * @param {React.ReactNode} props.icon - Optional icon to display
 * @param {string} props.className - Additional class names
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  to,
  href,
  fullWidth = false,
  icon,
  className = '',
  ...props
}) {
  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    icon ? styles.withIcon : '',
    className
  ].filter(Boolean).join(' ');

  const content = (
    <>
      {icon && <span className={styles.icon}>{icon}</span>}
      <span>{children}</span>
    </>
  );

  // Render as Link (internal navigation)
  if (to) {
    return (
      <Link to={to} className={classNames} {...props}>
        {content}
      </Link>
    );
  }

  // Render as anchor (external link)
  if (href) {
    return (
      <a href={href} className={classNames} target="_blank" rel="noopener noreferrer" {...props}>
        {content}
      </a>
    );
  }

  // Render as button
  return (
    <button className={classNames} {...props}>
      {content}
    </button>
  );
}

