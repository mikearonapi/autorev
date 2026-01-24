'use client';

/**
 * Skip Link Component
 * 
 * Provides keyboard users with a quick way to skip to main content,
 * improving accessibility by avoiding repetitive navigation.
 * 
 * WCAG 2.1 AA Compliance: 2.4.1 Bypass Blocks
 * 
 * Uses 'use client' to ensure CSS module hydration works correctly
 * on initial load (prevents FOUC on iOS Safari).
 * 
 * @see https://www.w3.org/WAI/WCAG21/Techniques/general/G1
 */

import styles from './SkipLink.module.css';

export default function SkipLink({ href = '#main-content', children = 'Skip to main content' }) {
  return (
    <a href={href} className={styles.skipLink}>
      {children}
    </a>
  );
}
