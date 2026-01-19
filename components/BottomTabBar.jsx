'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from './BottomTabBar.module.css';
import { UI_IMAGES } from '@/lib/images';
import { APP_ROUTES, isAppRoute } from '@/lib/appRoutes';

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

const DataIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
    strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    {/* Chart/data icon - represents telemetry, OBD2, track data */}
    <path d="M3 3v18h18"/>
    <path d="M18 17V9"/>
    <path d="M13 17V5"/>
    <path d="M8 17v-3"/>
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
  <Image
    src={UI_IMAGES.alMascotFull}
    alt="AL"
    width={26}
    height={26}
    className={`${styles.alMascot} ${active ? styles.alMascotActive : ''}`}
    quality={90}
  />
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
    // Garage now includes build, upgrades, specs, photos, and performance features
    // Routes: /garage (vehicles), /garage/my-specs, /garage/my-build, /garage/my-performance, /garage/my-parts, /garage/my-photos
    matchPaths: ['/garage', '/garage/builds', '/garage/my-specs', '/garage/my-build', '/garage/my-performance', '/garage/my-parts', '/garage/my-photos', '/garage/tuning-shop', '/my-builds', '/build', '/tuning-shop', '/performance', '/parts']
  },
  { 
    id: 'data', 
    label: 'My Data', 
    href: '/data', 
    Icon: DataIcon,
    // Data covers: track sessions, OBD2 logging, telemetry, tuning optimization
    matchPaths: ['/data', '/track']
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

// APP_ROUTES imported from @/lib/appRoutes

export default function BottomTabBar() {
  const pathname = usePathname();
  
  // Determine if we should show the tab bar
  const shouldShow = isAppRoute(pathname);
  
  if (!shouldShow) return null;
  
  // Check if a tab is active based on current path
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

// Export tabs configuration for other components that may need it
// Note: isAppRoute and APP_ROUTES are available from @/lib/appRoutes
export { tabs };
export { APP_ROUTES, isAppRoute } from '@/lib/appRoutes';
