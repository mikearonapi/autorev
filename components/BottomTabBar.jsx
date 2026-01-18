'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './BottomTabBar.module.css';

/**
 * BottomTabBar - Native iOS/Android style tab navigation
 * 
 * 5-Tab Structure for Build-Focused Experience:
 * 1. Garage - Your vehicles & build projects
 * 2. Build - 5-step build configuration flow
 * 3. Performance - Dyno estimates, track times, logging
 * 4. Community - Browse builds, events, share
 * 5. Profile - Settings, preferences, account
 * 
 * Design inspired by GRAVL:
 * - Clean minimal icons
 * - Active state with accent color
 * - Safe area padding for notched devices
 */

// Tab icons - clean, minimal line icons
const GarageIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
    strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"/>
    <path d="M1 21h22"/>
    <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/>
    <rect x="9" y="7" width="6" height="4" rx="1"/>
  </svg>
);

const BuildIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
    strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const PerformanceIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
    strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4"/>
    <path d="M12 18v4"/>
    <path d="M4.93 4.93l2.83 2.83"/>
    <path d="M16.24 16.24l2.83 2.83"/>
    <path d="M2 12h4"/>
    <path d="M18 12h4"/>
    <path d="M4.93 19.07l2.83-2.83"/>
    <path d="M16.24 7.76l2.83-2.83"/>
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 12l2-2"/>
  </svg>
);

const CommunityIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
    strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const ProfileIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
    strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

// Tab configuration - 5-tab structure
const tabs = [
  { 
    id: 'garage', 
    label: 'Garage', 
    href: '/garage', 
    Icon: GarageIcon,
    matchPaths: ['/garage', '/my-builds'] // Include legacy route
  },
  { 
    id: 'build', 
    label: 'Build', 
    href: '/build', 
    Icon: BuildIcon,
    matchPaths: ['/build', '/tuning-shop'] // Include legacy route
  },
  { 
    id: 'performance', 
    label: 'Perf', 
    href: '/performance', 
    Icon: PerformanceIcon,
    matchPaths: ['/performance']
  },
  { 
    id: 'community', 
    label: 'Community', 
    href: '/community/builds', // Points to existing marketing community page
    Icon: CommunityIcon,
    matchPaths: ['/community']
  },
  { 
    id: 'profile', 
    label: 'Profile', 
    href: '/profile', 
    Icon: ProfileIcon,
    matchPaths: ['/profile', '/settings']
  },
];

// Pages where the tab bar should be shown (app routes)
const APP_ROUTES = [
  '/garage',
  '/my-builds', // Legacy - redirects to /garage
  '/build',
  '/tuning-shop', // Legacy - redirects to /build
  '/performance',
  '/community',
  '/profile',
  '/settings',
  '/parts', // Accessible from Build flow
  '/encyclopedia',
  '/al', // AI assistant (overlay, not tab)
];

export default function BottomTabBar() {
  const pathname = usePathname();
  
  // Determine if we should show the tab bar
  const shouldShow = APP_ROUTES.some(route => pathname?.startsWith(route));
  
  if (!shouldShow) return null;
  
  // Check if a tab is active
  const isActive = (tab) => {
    return tab.matchPaths?.some(path => pathname?.startsWith(path));
  };
  
  return (
    <nav className={styles.tabBar} aria-label="Main navigation">
      <div className={styles.tabContainer}>
        {tabs.map((tab) => {
          const active = isActive(tab);
          const TabIcon = tab.Icon;
          
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`${styles.tab} ${active ? styles.tabActive : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className={styles.tabIcon}>
                <TabIcon active={active} />
              </span>
              <span className={styles.tabLabel}>{tab.label}</span>
              {active && <span className={styles.activeIndicator} />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Export route checker for use in other components
export function isAppRoute(pathname) {
  return APP_ROUTES.some(route => pathname?.startsWith(route));
}

// Export tabs configuration for other components that may need it
export { tabs, APP_ROUTES };
