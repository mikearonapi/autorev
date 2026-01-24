/**
 * useReducedMotion Hook
 * 
 * Detects if the user prefers reduced motion via OS/browser settings.
 * Use this to disable or simplify animations for accessibility.
 * 
 * WCAG 2.1 AA Compliance: 2.3.3 Animation from Interactions
 * 
 * @see https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
 * 
 * @example
 * const prefersReducedMotion = useReducedMotion();
 * const animationDuration = prefersReducedMotion ? 0 : 300;
 */

import { useState, useEffect } from 'react';

/**
 * Check if user prefers reduced motion
 * 
 * @returns {boolean} - true if user prefers reduced motion
 */
export function useReducedMotion() {
  // Default to false during SSR (animations enabled by default)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined') {
      return;
    }

    // Check for matchMedia support
    if (!window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes (user might toggle settings while app is open)
    const handleChange = (event) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers use addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
}

/**
 * Get animation duration based on reduced motion preference
 * 
 * @param {number} normalDuration - Duration in ms when motion is allowed
 * @param {number} [reducedDuration=0] - Duration in ms when motion is reduced
 * @returns {number} - The appropriate duration based on user preference
 * 
 * @example
 * const duration = useAnimationDuration(300);
 * // Returns 0 if reduced motion, 300 otherwise
 */
export function useAnimationDuration(normalDuration, reducedDuration = 0) {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? reducedDuration : normalDuration;
}

/**
 * Get animation config for framer-motion or similar
 * 
 * @returns {Object} - Animation config with appropriate values
 * 
 * @example
 * const { duration, animate } = useAnimationConfig();
 * <motion.div animate={animate ? { opacity: 1 } : false} transition={{ duration }} />
 */
export function useAnimationConfig() {
  const prefersReducedMotion = useReducedMotion();
  
  return {
    animate: !prefersReducedMotion,
    duration: prefersReducedMotion ? 0 : 0.3,
    spring: prefersReducedMotion 
      ? { type: 'tween', duration: 0 } 
      : { type: 'spring', stiffness: 300, damping: 30 },
  };
}

export default useReducedMotion;
