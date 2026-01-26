'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './CommunityNav.module.css';

/**
 * CommunityNav - Tab bar navigation for community section
 * 
 * Uses Link components for proper routing (not state-based tabs).
 * Highlights active tab based on current pathname.
 * 
 * Routes:
 * - /community → Builds tab (exact match)
 * - /community/events → Events tab
 * - /community/leaderboard → Leaderboard tab
 */

const TABS = [
  { href: '/community', label: 'Builds', exact: true },
  { href: '/community/events', label: 'Events' },
  { href: '/community/leaderboard', label: 'Leaderboard' },
];

export default function CommunityNav() {
  const pathname = usePathname();
  
  const isActive = (tab) => {
    if (tab.exact) return pathname === tab.href;
    return pathname.startsWith(tab.href);
  };
  
  return (
    <nav className={styles.header}>
      <div className={styles.tabBar}>
        {TABS.map(tab => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${styles.tab} ${isActive(tab) ? styles.tabActive : ''}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
