/**
 * App Layout
 * 
 * Wrapper for interactive app pages with native app-like experience.
 * Routes: /tuning-shop, /my-builds, /garage, /parts, /profile, /encyclopedia, /community/*
 * 
 * Features:
 * - Bottom tab bar navigation (mobile)
 * - Hides footer on mobile (tab bar replaces it)
 * - App-specific padding for tab bar
 * 
 * Design inspiration: GRAVL fitness app
 * - Native iOS/Android feel
 * - Bottom tab navigation
 * - Full-height layouts
 */

import BottomTabBar from '@/components/BottomTabBar';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import styles from './layout.module.css';

export default function AppLayout({ children }) {
  return (
    <div className={styles.appLayout} data-app-layout="true">
      {children}
      <BottomTabBar />
      {/* PWA Install Banner - shows after 5 page views, 3s delay */}
      <PWAInstallPrompt 
        variant="banner" 
        showAfterViews={5} 
        delay={3000}
      />
    </div>
  );
}
