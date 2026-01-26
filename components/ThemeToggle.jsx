'use client';

/**
 * Theme Toggle Component
 * 
 * A button that toggles between light and dark themes.
 * Uses next-themes for theme management.
 * 
 * @module components/ThemeToggle
 */

import { useEffect, useState } from 'react';

import { useTheme } from 'next-themes';

import styles from './ThemeToggle.module.css';

/**
 * Theme Toggle Button
 * 
 * @param {Object} props
 * @param {string} [props.className] - Additional CSS classes
 * @param {'icon'|'text'|'both'} [props.variant='icon'] - Display variant
 */
export default function ThemeToggle({ className, variant = 'icon' }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const isDark = resolvedTheme === 'dark';
  
  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };
  
  // Show placeholder during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        className={`${styles.toggle} ${className || ''}`}
        aria-label="Toggle theme"
        disabled
      >
        <span className={styles.icon}>
          <ThemeIcon theme="dark" />
        </span>
      </button>
    );
  }
  
  return (
    <button
      onClick={toggleTheme}
      className={`${styles.toggle} ${className || ''}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className={styles.icon}>
        <ThemeIcon theme={isDark ? 'dark' : 'light'} />
      </span>
      {(variant === 'text' || variant === 'both') && (
        <span className={styles.label}>
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
}

/**
 * Theme icon component
 */
function ThemeIcon({ theme }) {
  if (theme === 'dark') {
    // Moon icon
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    );
  }
  
  // Sun icon
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}
