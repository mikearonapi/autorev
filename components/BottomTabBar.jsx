'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './BottomTabBar.module.css';

/**
 * BottomTabBar - Native iOS/Android style tab navigation
 * 
 * SIMPLIFIED 5-Tab Structure (GRAVL-inspired):
 * 
 * 1. My Garage - Everything about YOUR cars
 *    - Your vehicles
 *    - Build projects  
 *    - Upgrade planner
 *    - Performance estimates
 * 
 * 2. Track - Real-world performance
 *    - Track day mode
 *    - Data logging
 *    - Telemetry upload
 *    - Lap times
 * 
 * 3. Community - Social discovery (TikTok/IG style)
 *    - Build feed
 *    - Favorite builds
 *    - Build details
 * 
 * 4. AI AL - Search + AI Assistant
 *    - Ask anything
 *    - Get recommendations
 *    - Research
 * 
 * 5. Profile - Account management
 *    - Settings
 *    - Subscription
 *    - Preferences
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

const TrackIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
    strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    {/* Racing flag / track icon */}
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);

const CommunityIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
    strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    {/* Grid/feed icon - more social media feel */}
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);

const AIIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
    strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    {/* Brain/sparkle icon for AI */}
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
  </svg>
);

const ProfileIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
    strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

// Tab configuration - SIMPLIFIED 5-tab structure
const tabs = [
  { 
    id: 'garage', 
    label: 'My Garage', 
    href: '/garage', 
    Icon: GarageIcon,
    // Garage now includes build, upgrades, and performance features
    matchPaths: ['/garage', '/my-builds', '/build', '/tuning-shop', '/performance', '/parts']
  },
  { 
    id: 'track', 
    label: 'Track', 
    href: '/track', 
    Icon: TrackIcon,
    matchPaths: ['/track']
  },
  { 
    id: 'community', 
    label: 'Community', 
    href: '/community', 
    Icon: CommunityIcon,
    matchPaths: ['/community']
  },
  { 
    id: 'al', 
    label: 'AL', 
    href: '/al', 
    Icon: AIIcon,
    matchPaths: ['/al']
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
  '/my-builds', // Legacy - part of garage
  '/build',     // Legacy - part of garage
  '/tuning-shop', // Legacy - part of garage
  '/performance', // Part of garage
  '/parts',     // Part of garage (upgrade flow)
  '/track',
  '/community',
  '/al',
  '/profile',
  '/settings',
  '/encyclopedia', // Reference - accessible from garage
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
