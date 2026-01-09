/**
 * Font Configuration using next/font
 * 
 * Optimized font loading:
 * - Automatic self-hosting (no external requests)
 * - Automatic font-display: swap
 * - Preloading of font files
 * - CSS size-adjust for layout shift prevention
 */

import { Inter, Oswald } from 'next/font/google';

/**
 * Inter - Primary body font
 * Clean, modern sans-serif for excellent readability
 * Reduced weights: 400 (body), 500 (medium), 600 (semibold) - removed 700
 */
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600'],
  preload: true,
});

/**
 * Oswald - Display/heading font
 * Bold, condensed for impactful headlines
 * Reduced weights: 600 only - 500 and 700 rarely used
 */
export const oswald = Oswald({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-oswald',
  weight: ['600'],
  preload: true,
});

/**
 * Combined font class names for body element
 */
export const fontVariables = `${inter.variable} ${oswald.variable}`;

