/**
 * SafeAreaFallback - Provides :has() selector fallback for older Android browsers
 * 
 * CSS :has() is used to automatically change safe area colors when overlay modals
 * are present (body:has([data-overlay-modal])). However, older browsers (Samsung
 * Internet 18 and older) don't support :has().
 * 
 * This component uses MutationObserver to detect [data-overlay-modal] and 
 * [data-immersive-modal] elements and adds corresponding classes to <body>
 * as a fallback.
 * 
 * Also manages dynamic theme-color meta tag for Android status bar color.
 * 
 * @see https://caniuse.com/css-has
 */
'use client';

import { useEffect } from 'react';

// Theme colors matching our design system
const THEME_COLORS = {
  BASE: '#0d1b2a',       // Level 2: Main app pages
  OVERLAY: '#1a1a1a',    // Level 3: Modals, questionnaires (charcoal)
  IMMERSIVE: '#050a12',  // Level 1: Media galleries, video, splash
};

/**
 * Check if CSS :has() selector is supported
 * @returns {boolean}
 */
function hasSupport() {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
    return false;
  }
  try {
    return CSS.supports('selector(:has(*))');
  } catch {
    return false;
  }
}

/**
 * Update the theme-color meta tag for Android status bar
 * @param {string} color - Hex color value
 */
function updateThemeColor(color) {
  if (typeof document === 'undefined') return;
  
  // Update both theme-color meta tags (light and dark schemes)
  const themeColorMetas = document.querySelectorAll('meta[name="theme-color"]');
  themeColorMetas.forEach(meta => {
    meta.setAttribute('content', color);
  });
}

/**
 * SafeAreaFallback component
 * 
 * Renders nothing visible, but:
 * 1. On older browsers without :has() support, uses MutationObserver to add
 *    fallback classes to <body> when overlay/immersive modals are present
 * 2. On all browsers, updates the theme-color meta tag for Android status bar
 */
export default function SafeAreaFallback() {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const supportsHas = hasSupport();
    
    /**
     * Check for overlay/immersive modals and update state accordingly
     */
    const updateState = () => {
      const hasOverlay = document.querySelector('[data-overlay-modal]');
      const hasImmersive = document.querySelector('[data-immersive-modal]');
      
      // Determine the appropriate theme color
      let themeColor = THEME_COLORS.BASE;
      if (hasImmersive) {
        themeColor = THEME_COLORS.IMMERSIVE;
      } else if (hasOverlay) {
        themeColor = THEME_COLORS.OVERLAY;
      }
      
      // Always update theme-color for Android (regardless of :has() support)
      updateThemeColor(themeColor);
      
      // Only add fallback classes if :has() is not supported
      if (!supportsHas) {
        // Add to both html and body for complete coverage
        document.documentElement.classList.toggle('has-overlay-modal', !!hasOverlay);
        document.documentElement.classList.toggle('has-immersive-modal', !!hasImmersive);
        document.body.classList.toggle('has-overlay-modal', !!hasOverlay);
        document.body.classList.toggle('has-immersive-modal', !!hasImmersive);
      }
    };
    
    // Initial check
    updateState();
    
    // Create MutationObserver to watch for modal additions/removals
    const observer = new MutationObserver((mutations) => {
      // Only recheck if nodes were added or removed
      const hasNodeChanges = mutations.some(
        m => m.type === 'childList' && (m.addedNodes.length > 0 || m.removedNodes.length > 0)
      );
      
      if (hasNodeChanges) {
        updateState();
      }
    });
    
    // Observe the entire document body for modal changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    
    // Cleanup
    return () => {
      observer.disconnect();
      
      // Reset to base theme color on unmount
      updateThemeColor(THEME_COLORS.BASE);
      
      if (!supportsHas) {
        document.documentElement.classList.remove('has-overlay-modal', 'has-immersive-modal');
        document.body.classList.remove('has-overlay-modal', 'has-immersive-modal');
      }
    };
  }, []);
  
  // This component renders nothing
  return null;
}
