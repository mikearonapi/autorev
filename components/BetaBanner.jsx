'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useBannerSafe, BANNER_TYPES } from '@/components/providers/BannerProvider';
import styles from './BetaBanner.module.css';

/**
 * Beta Banner Component
 * 
 * Displays a site-wide banner during beta period.
 * Registers itself with the BannerProvider so other components
 * can adjust their layout accordingly.
 * 
 * Props:
 * - message: Custom message to display (optional)
 * - badge: Badge text (default: "BETA")
 * - visible: Force visibility state (optional, for admin control)
 */
export default function BetaBanner({ 
  message = "All membership levels FREE during beta",
  badge = "BETA",
  visible = true  // Can be controlled via props for future flexibility
}) {
  const pathname = usePathname();
  const { registerBanner, unregisterBanner } = useBannerSafe();
  
  // Determine if banner should be shown
  const shouldShow = visible && 
    !pathname?.startsWith('/admin') && 
    !pathname?.startsWith('/internal');
  
  // Register/unregister banner with context when visibility changes
  useEffect(() => {
    if (shouldShow) {
      registerBanner(BANNER_TYPES.BETA);
    } else {
      unregisterBanner(BANNER_TYPES.BETA);
    }
    
    // Cleanup on unmount
    return () => {
      unregisterBanner(BANNER_TYPES.BETA);
    };
  }, [shouldShow, registerBanner, unregisterBanner]);
  
  if (!shouldShow) {
    return null;
  }
  
  return (
    <div className={styles.banner} role="banner" aria-label="Site announcement">
      <div className={styles.content}>
        <span className={styles.badge}>{badge}</span>
        <span className={styles.message}>{message}</span>
      </div>
    </div>
  );
}
