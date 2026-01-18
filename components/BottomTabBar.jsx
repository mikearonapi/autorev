'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAIChat } from './AIChatContext';
import styles from './BottomTabBar.module.css';

/**
 * BottomTabBar - Native iOS/Android style tab navigation
 * 
 * Inspired by GRAVL's app navigation:
 * - 5 tabs maximum
 * - Icon + label for each tab
 * - Active state with accent color
 * - Safe area padding for notched devices
 * - Only shows on app pages (not marketing)
 */

// Tab icons - clean, minimal line icons
const BuildsIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
    strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const ProjectsIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
    strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    <line x1="12" y1="11" x2="12" y2="17"/>
    <line x1="9" y1="14" x2="15" y2="14"/>
  </svg>
);

const PartsIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
    strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
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

const ALIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
    strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="10" r="1" fill="currentColor"/>
    <circle cx="8" cy="10" r="1" fill="currentColor"/>
    <circle cx="16" cy="10" r="1" fill="currentColor"/>
  </svg>
);

// Tab configuration
const tabs = [
  { 
    id: 'builds', 
    label: 'Builds', 
    href: '/tuning-shop', 
    Icon: BuildsIcon,
    matchPaths: ['/tuning-shop']
  },
  { 
    id: 'projects', 
    label: 'Projects', 
    href: '/my-builds', 
    Icon: ProjectsIcon,
    matchPaths: ['/my-builds', '/garage']
  },
  { 
    id: 'parts', 
    label: 'Parts', 
    href: '/parts', 
    Icon: PartsIcon,
    matchPaths: ['/parts']
  },
  { 
    id: 'community', 
    label: 'Community', 
    href: '/community/builds', 
    Icon: CommunityIcon,
    matchPaths: ['/community']
  },
  { 
    id: 'al', 
    label: 'AL', 
    href: null, // Opens chat overlay
    Icon: ALIcon,
    isChat: true,
    matchPaths: ['/al']
  },
];

// Pages where the tab bar should be shown
const APP_ROUTES = [
  '/tuning-shop',
  '/my-builds',
  '/garage',
  '/parts',
  '/community',
  '/al',
  '/encyclopedia',
  '/profile',
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const { toggleChat, isChatOpen } = useAIChat();
  
  // Determine if we should show the tab bar
  const shouldShow = APP_ROUTES.some(route => pathname?.startsWith(route));
  
  if (!shouldShow) return null;
  
  // Check if a tab is active
  const isActive = (tab) => {
    if (tab.isChat && isChatOpen) return true;
    return tab.matchPaths?.some(path => pathname?.startsWith(path));
  };
  
  // Handle tab click
  const handleTabClick = (tab, e) => {
    if (tab.isChat) {
      e.preventDefault();
      toggleChat();
    }
  };
  
  return (
    <nav className={styles.tabBar} aria-label="Main navigation">
      <div className={styles.tabContainer}>
        {tabs.map((tab) => {
          const active = isActive(tab);
          const TabIcon = tab.Icon;
          
          if (tab.isChat) {
            return (
              <button
                key={tab.id}
                className={`${styles.tab} ${active ? styles.tabActive : ''}`}
                onClick={(e) => handleTabClick(tab, e)}
                aria-label={`Open ${tab.label} assistant`}
                aria-pressed={active}
              >
                <span className={styles.tabIcon}>
                  <TabIcon active={active} />
                </span>
                <span className={styles.tabLabel}>{tab.label}</span>
                {active && <span className={styles.activeIndicator} />}
              </button>
            );
          }
          
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
