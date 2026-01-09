'use client';

import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

/**
 * Banner Provider Context
 * 
 * Manages global banner state (beta banner, promotional banners, etc.)
 * and provides dynamic CSS variables for content offset calculations.
 * 
 * This allows pages to automatically adjust their layout based on
 * whether a banner is currently displayed, ensuring content is never
 * hidden behind fixed headers + banners.
 */

const BannerContext = createContext(null);

// CSS variable names for banner heights (defined in globals.css)
const CSS_VARS = {
  headerHeightMobile: '--header-height-mobile',
  headerHeight: '--header-height',
  betaBannerHeightMobile: '--beta-banner-height-mobile',
  betaBannerHeight: '--beta-banner-height',
};

// Banner registry to track active banners
const BANNER_TYPES = {
  BETA: 'beta',
  PROMO: 'promo',
  ALERT: 'alert',
};

export function BannerProvider({ children }) {
  // Track which banners are currently visible
  const [activeBanners, setActiveBanners] = useState(new Map());
  
  // Register a banner as visible
  const registerBanner = useCallback((type, height = null) => {
    setActiveBanners(prev => {
      const next = new Map(prev);
      next.set(type, { visible: true, height });
      return next;
    });
  }, []);
  
  // Unregister a banner (hidden)
  const unregisterBanner = useCallback((type) => {
    setActiveBanners(prev => {
      const next = new Map(prev);
      next.delete(type);
      return next;
    });
  }, []);
  
  // Check if any banner is visible
  const hasBanner = useMemo(() => activeBanners.size > 0, [activeBanners]);
  
  // Check if a specific banner type is visible
  const isBannerVisible = useCallback((type) => {
    return activeBanners.has(type);
  }, [activeBanners]);
  
  // Calculate total banner height (for custom height banners)
  const totalBannerHeight = useMemo(() => {
    let total = 0;
    activeBanners.forEach((banner) => {
      if (banner.height) {
        total += banner.height;
      }
    });
    return total;
  }, [activeBanners]);
  
  // Update CSS custom properties on document root
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    
    // Set a data attribute for CSS targeting
    // IMPORTANT (performance/CLS):
    // The site uses `main { padding-top: var(--content-offset-*) }` and
    // `html:not([data-has-banner]) { --content-offset-* = header-only }`.
    //
    // Toggling `data-has-banner` AFTER hydration causes a full-page reflow and
    // large CLS spikes in Lighthouse/PageSpeed.
    //
    // We keep `data-has-banner="true"` set from the server (`app/layout.jsx`)
    // and never remove it on the client. This reserves space for the banner
    // even if it is hidden on certain routes, avoiding layout shifts.
    if (hasBanner) {
      root.setAttribute('data-has-banner', 'true');
    }
    
    // Set specific banner type attributes
    BANNER_TYPES && Object.values(BANNER_TYPES).forEach(type => {
      if (activeBanners.has(type)) {
        root.setAttribute(`data-banner-${type}`, 'true');
      } else {
        root.removeAttribute(`data-banner-${type}`);
      }
    });
    
  }, [hasBanner, activeBanners]);
  
  const value = useMemo(() => ({
    registerBanner,
    unregisterBanner,
    hasBanner,
    isBannerVisible,
    activeBanners,
    totalBannerHeight,
    BANNER_TYPES,
  }), [registerBanner, unregisterBanner, hasBanner, isBannerVisible, activeBanners, totalBannerHeight]);
  
  return (
    <BannerContext.Provider value={value}>
      {children}
    </BannerContext.Provider>
  );
}

export function useBanner() {
  const context = useContext(BannerContext);
  if (!context) {
    throw new Error('useBanner must be used within a BannerProvider');
  }
  return context;
}

// Safe hook that returns defaults when outside provider (for components that might render before provider)
export function useBannerSafe() {
  const context = useContext(BannerContext);
  if (!context) {
    return {
      registerBanner: () => {},
      unregisterBanner: () => {},
      hasBanner: true, // Default to true to prevent flash of unstyled content
      isBannerVisible: () => true,
      activeBanners: new Map(),
      totalBannerHeight: 0,
      BANNER_TYPES,
    };
  }
  return context;
}

export { BANNER_TYPES };
export default BannerProvider;

