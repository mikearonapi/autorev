'use client';

/**
 * Theme Provider
 * 
 * Wraps the app with next-themes ThemeProvider for dark/light mode support.
 * Currently AutoRev uses a dark theme by default.
 * 
 * @module components/providers/ThemeProvider
 */

import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * Theme Provider Component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {Object} [props.themeProps] - Additional props for next-themes
 */
export function ThemeProvider({ children, ...themeProps }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      {...themeProps}
    >
      {children}
    </NextThemesProvider>
  );
}

export default ThemeProvider;
