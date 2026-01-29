/**
 * App Layout
 *
 * Wrapper for interactive app pages with native app-like experience.
 * Routes: /tuning-shop, /my-builds, /garage, /parts, /profile, /encyclopedia, /community/*
 *
 * Features:
 * - Desktop header with sidebar navigation (768px+)
 * - Bottom tab bar navigation (mobile < 768px)
 * - Hides footer on mobile (tab bar replaces it)
 * - App-specific padding for navigation
 *
 * Design inspiration: GRAVL fitness app
 * - Native iOS/Android feel
 * - Bottom tab navigation on mobile
 * - Premium header + sidebar on iPad/desktop
 */

import AppDataPrefetcher from '@/components/AppDataPrefetcher';
import BottomTabBar from '@/components/BottomTabBar';
import DesktopHeader from '@/components/DesktopHeader';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

import styles from './layout.module.css';

export default function AppLayout({ children }) {
  return (
    <div className={styles.appLayout} data-app-layout="true">
      {/* Pre-load common user data at layout level for instant page navigation */}
      <AppDataPrefetcher />

      {/* Desktop/iPad: Header with hamburger menu (shows at 768px+) */}
      <DesktopHeader />

      {children}

      {/* Mobile: Bottom tab bar (shows below 768px) */}
      <BottomTabBar />

      {/* PWA Install Banner - shows after 5 page views, 3s delay */}
      <PWAInstallPrompt variant="banner" showAfterViews={5} delay={3000} />
    </div>
  );
}
