'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { usePrefetchNavigation } from '@/hooks/usePrefetchNavigation';
import { isAppRoute } from '@/lib/appRoutes';
import { UI_IMAGES } from '@/lib/images';

import styles from './BottomTabBar.module.css';

/**
 * BottomTabBar - Premium Minimal Tab Navigation
 *
 * Design Philosophy: Less is more
 * - Clean, thin stroke icons (no filled variants - too heavy)
 * - Subtle active indicator dot
 * - Teal accent for active state
 * - Special AL mascot with elegant glow
 * - No pills or backgrounds - just color and weight
 */

// Refined icons - consistent 1.5px stroke, cleaner paths
const InsightsIcon = ({ active }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? 2 : 1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="m4.93 4.93 2.83 2.83" />
    <path d="m16.24 16.24 2.83 2.83" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
    <path d="m4.93 19.07 2.83-2.83" />
    <path d="m16.24 7.76 2.83-2.83" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);

const GarageIcon = ({ active }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? 2 : 1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 21h18" />
    <path d="M5 21V7l7-4 7 4v14" />
    <path d="M9 21v-6h6v6" />
  </svg>
);

const DataIcon = ({ active }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? 2 : 1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 3v18h18" />
    <path d="M7 16v-3" />
    <path d="M11 16V8" />
    <path d="M15 16v-5" />
    <path d="M19 16v-7" />
  </svg>
);

const CommunityIcon = ({ active }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={active ? 2 : 1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const ALIcon = ({ active }) => (
  <div className={`${styles.alWrapper} ${active ? styles.alWrapperActive : ''}`}>
    <Image
      src={UI_IMAGES.alMascotFull}
      alt="AL"
      width={26}
      height={26}
      className={styles.alImage}
      quality={90}
    />
  </div>
);

const tabs = [
  {
    id: 'garage',
    label: 'Garage',
    href: '/garage',
    Icon: GarageIcon,
    matchPaths: [
      '/garage',
      '/garage/builds',
      '/garage/my-specs',
      '/garage/my-build',
      '/garage/my-parts',
      '/garage/my-install',
      '/garage/my-photos',
      '/garage/tuning-shop',
      '/my-builds',
      '/build',
      '/tuning-shop',
      '/parts',
    ],
  },
  {
    id: 'data',
    label: 'Data',
    href: '/data',
    Icon: DataIcon,
    matchPaths: ['/data', '/track'],
  },
  {
    id: 'insights',
    label: 'Insights',
    href: '/insights',
    Icon: InsightsIcon,
    matchPaths: ['/insights'],
  },
  {
    id: 'community',
    label: 'Community',
    href: '/community',
    Icon: CommunityIcon,
    matchPaths: ['/community'],
  },
  {
    id: 'al',
    label: 'AL',
    href: '/al',
    Icon: ALIcon,
    isAL: true,
    matchPaths: ['/al'],
  },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const { prefetchRoute } = usePrefetchNavigation();
  const navRef = useRef(null);
  const prefetchedRef = useRef(new Set());

  /**
   * PWA SAFE AREA FIX: Force re-render after mount
   *
   * In PWAs, env(safe-area-inset-bottom) may not be available on first render.
   * This causes the nav to render with incorrect padding initially.
   * Setting mounted state triggers a re-render after hydration, ensuring
   * the browser has calculated safe area values and CSS is applied correctly.
   */
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Small delay ensures safe area values are calculated
    const timer = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  /**
   * Handle prefetch on hover (desktop) or touch start (mobile)
   * This loads data before navigation so pages render instantly
   */
  const handlePrefetch = useCallback(
    (href) => {
      // Prevent duplicate prefetches in the same session
      if (prefetchedRef.current.has(href)) return;
      prefetchedRef.current.add(href);
      prefetchRoute(href);
    },
    [prefetchRoute]
  );

  /**
   * ANDROID FIX: Attach passive touch listeners for faster response
   * React's onTouchStart is not passive by default, causing potential delays
   * on Android. Passive listeners allow the browser to start scrolling/navigating
   * immediately without waiting for JS to process.
   */
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    // Create touch handlers for each tab link
    const handleTouchStart = (e) => {
      const link = e.target.closest('a[href]');
      if (link) {
        const href = link.getAttribute('href');
        if (href) {
          handlePrefetch(href);
        }
      }
    };

    // Add passive listener for faster touch response on Android
    nav.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      nav.removeEventListener('touchstart', handleTouchStart);
    };
  }, [handlePrefetch]);

  const shouldShow = isAppRoute(pathname);
  if (!shouldShow) return null;

  const isActive = (tab) => {
    return tab.matchPaths?.some((path) => pathname?.startsWith(path));
  };

  return (
    <nav
      ref={navRef}
      className={styles.nav}
      aria-label="Main navigation"
      data-mounted={mounted || undefined}
    >
      <div className={styles.container}>
        {tabs.map((tab) => {
          const active = isActive(tab);
          const TabIcon = tab.Icon;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`${styles.tab} ${active ? styles.active : ''} ${tab.isAL ? styles.alTab : ''}`}
              aria-current={active ? 'page' : undefined}
              onMouseEnter={() => handlePrefetch(tab.href)}
            >
              <span className={styles.icon}>
                <TabIcon active={active} />
              </span>
              <span className={styles.label}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export { tabs };
export { APP_ROUTES, isAppRoute } from '@/lib/appRoutes';
