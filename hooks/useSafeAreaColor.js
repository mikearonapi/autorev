/**
 * useSafeAreaColor - Manage iOS/Android PWA safe area background colors
 * 
 * iOS PWAs with black-translucent status bar show page content behind
 * the status bar/notch. Android uses the theme-color meta tag for status bar.
 * This hook allows components (especially modals) to set the safe area color
 * to match their background on BOTH platforms.
 * 
 * Usage:
 * ```jsx
 * function MyModal() {
 *   // Sets safe area to charcoal when mounted, resets on unmount
 *   useSafeAreaColor('#1a1a1a');
 *   
 *   return <div className={styles.modal}>...</div>;
 * }
 * ```
 * 
 * Or with options:
 * ```jsx
 * useSafeAreaColor('#1a1a1a', { 
 *   bottom: '#0d1b2a',  // Different color for bottom (optional)
 *   enabled: isOpen,    // Conditionally enable (optional)
 *   updateThemeColor: true  // Update Android theme-color meta tag (default: true)
 * });
 * ```
 */

import { useEffect } from 'react';

/**
 * Update the theme-color meta tag for Android status bar
 * @param {string} color - Hex color value
 */
function updateThemeColorMeta(color) {
  if (typeof document === 'undefined') return;
  
  const themeColorMetas = document.querySelectorAll('meta[name="theme-color"]');
  themeColorMetas.forEach(meta => {
    meta.setAttribute('content', color);
  });
}

/**
 * Set safe area colors for iOS/Android PWA
 * @param {string} topColor - Background color for top safe area (status bar/notch)
 * @param {Object} options - Optional configuration
 * @param {string} options.bottom - Background color for bottom safe area (home indicator)
 * @param {boolean} options.enabled - Whether to apply the colors (default: true)
 * @param {boolean} options.updateThemeColor - Whether to update Android theme-color meta (default: true)
 */
export function useSafeAreaColor(topColor, options = {}) {
  const { bottom, enabled = true, updateThemeColor = true } = options;

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    // Store original values to restore on cleanup
    const originalTop = document.body.style.getPropertyValue('--safe-area-top-bg');
    const originalBottom = document.body.style.getPropertyValue('--safe-area-bottom-bg');
    const originalThemeColor = document.querySelector('meta[name="theme-color"]')?.getAttribute('content');

    // Set the new colors (iOS via CSS variables)
    if (topColor) {
      document.body.style.setProperty('--safe-area-top-bg', topColor);
      
      // Also update Android theme-color meta tag
      if (updateThemeColor) {
        updateThemeColorMeta(topColor);
      }
    }
    if (bottom) {
      document.body.style.setProperty('--safe-area-bottom-bg', bottom);
    }

    // Cleanup: restore original values or remove property
    return () => {
      if (originalTop) {
        document.body.style.setProperty('--safe-area-top-bg', originalTop);
      } else {
        document.body.style.removeProperty('--safe-area-top-bg');
      }
      if (originalBottom) {
        document.body.style.setProperty('--safe-area-bottom-bg', originalBottom);
      } else {
        document.body.style.removeProperty('--safe-area-bottom-bg');
      }
      
      // Restore Android theme-color
      if (updateThemeColor && originalThemeColor) {
        updateThemeColorMeta(originalThemeColor);
      }
    };
  }, [topColor, bottom, enabled, updateThemeColor]);
}

/**
 * Safe area color constants for common backgrounds
 * Use these to ensure consistency across the app
 */
export const SAFE_AREA_COLORS = {
  /** Level 1: Immersive - Media galleries, video players */
  IMMERSIVE: '#050a12',
  /** Level 2: Base - Main app pages */
  BASE: '#0d1b2a',
  /** Level 3: Overlay - Full-screen modals, questionnaires (charcoal) */
  OVERLAY: '#1a1a1a',
  /** Level 4: Elevated - Cards, panels */
  ELEVATED: '#1b263b',
  /** PWA navigation bar */
  PWA_NAV: '#0d1b2a',
};

export default useSafeAreaColor;
