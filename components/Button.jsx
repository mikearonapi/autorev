import Link from 'next/link';
import styles from './Button.module.css';

/**
 * Button component - supports both button and link variants
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'outline' | 'outlineLight' | 'ghost'} props.variant - Button style variant
 * @param {'sm' | 'md' | 'lg'} props.size - Button size
 * @param {string} props.href - If provided, renders as Link (internal) or anchor (external)
 * @param {boolean} props.fullWidth - Makes button full width
 * @param {React.ReactNode} props.icon - Optional icon to display
 * @param {string} props.className - Additional class names
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  fullWidth = false,
  icon,
  className = '',
  external = false,
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
      <span className={styles.content}>{children}</span>
    </>
  );

  // Render as external anchor
  if (href && (external || href.startsWith('http') || href.startsWith('mailto:'))) {
    return (
      <a href={href} className={classNames} target="_blank" rel="noopener noreferrer" {...props}>
        {content}
      </a>
    );
  }

  // Render as Link (internal navigation)
  if (href) {
    return (
      <Link href={href} className={classNames} {...props}>
        {content}
      </Link>
    );
  }

  // Render as button
  return (
    <button className={classNames} {...props}>
      {content}
    </button>
  );
}
