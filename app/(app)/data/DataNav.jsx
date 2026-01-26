'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import styles from './DataNav.module.css';

/**
 * DataNav - Tab bar navigation for data section
 * 
 * Uses Link components for proper routing (not state-based tabs).
 * Highlights active tab based on current pathname.
 * CRITICAL: Preserves vehicle selection across tab navigation via URL params.
 * 
 * Routes:
 * - /data → Dyno tab (exact match)
 * - /data/track → Track tab
 */

const TABS = [
  { href: '/data', label: 'Dyno', exact: true },
  { href: '/data/track', label: 'Track' },
];

export default function DataNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Get current vehicle param to preserve across navigation
  const vehicleId = searchParams.get('vehicle');
  
  const isActive = (tab) => {
    if (tab.exact) return pathname === tab.href;
    return pathname.startsWith(tab.href);
  };
  
  // Build href with preserved vehicle param
  const getHref = (baseHref) => {
    if (!vehicleId) return baseHref;
    return `${baseHref}?vehicle=${vehicleId}`;
  };
  
  return (
    <nav className={styles.tabBar} aria-label="Data navigation">
      {TABS.map(tab => (
        <Link
          key={tab.href}
          href={getHref(tab.href)}
          className={`${styles.tab} ${isActive(tab) ? styles.tabActive : ''}`}
          aria-current={isActive(tab) ? 'page' : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
