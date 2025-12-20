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
 */
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
  preload: true,
});

/**
 * Oswald - Display/heading font
 * Bold, condensed for impactful headlines
 */
export const oswald = Oswald({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-oswald',
  weight: ['500', '600', '700'],
  preload: true,
});

/**
 * Combined font class names for body element
 */
export const fontVariables = `${inter.variable} ${oswald.variable}`;

