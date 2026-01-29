'use client';

import { useEffect, useRef, useCallback } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { UI_IMAGES } from '@/lib/images';

import styles from './DesktopSidebar.module.css';

/**
 * DesktopSidebar - Slide-out Navigation Drawer
 *
 * Design: Notion/Linear style slide-out from left
 * - 280px width
 * - Smooth 300ms animation
 * - Navigation: Garage, Data, Insights, Community, AL
 * - Active page: teal left border accent
 * - Close: backdrop click, X button, or Escape key
 * - Focus trap for accessibility
 */

// Navigation icons - clean stroke style matching BottomTabBar
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

// Close icon
const CloseIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Navigation items configuration
const navItems = [
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
    isAL: true,
    matchPaths: ['/al'],
  },
];

export default function DesktopSidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const sidebarRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Check if a nav item is active
  const isActive = useCallback(
    (item) => {
      return item.matchPaths?.some((path) => pathname?.startsWith(path));
    },
    [pathname]
  );

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap and initial focus
  useEffect(() => {
    if (!isOpen) return;

    // Focus the close button when sidebar opens
    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 100);

    // Prevent body scroll when sidebar is open
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Handle nav item click - close sidebar after navigation
  const handleNavClick = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ''}`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <nav
        ref={sidebarRef}
        id="desktop-sidebar"
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}
        aria-label="Main navigation"
        aria-hidden={!isOpen}
      >
        {/* Header with logo and close button */}
        <div className={styles.header}>
          <Link href="/" className={styles.logoLink} onClick={handleNavClick}>
            <Image
              src="/autorev-logo-transparent.png"
              alt="AutoRev"
              width={120}
              height={28}
              className={styles.logo}
            />
          </Link>

          <button
            ref={closeButtonRef}
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Navigation items */}
        <div className={styles.nav}>
          {navItems.map((item) => {
            const active = isActive(item);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`${styles.navItem} ${active ? styles.navItemActive : ''} ${item.isAL ? styles.navItemAL : ''}`}
                onClick={handleNavClick}
                aria-current={active ? 'page' : undefined}
              >
                <span className={styles.navIcon}>
                  {item.isAL ? (
                    <div className={`${styles.alWrapper} ${active ? styles.alWrapperActive : ''}`}>
                      <Image
                        src={UI_IMAGES.alMascotFull}
                        alt="AL"
                        width={24}
                        height={24}
                        className={styles.alImage}
                      />
                    </div>
                  ) : (
                    <item.Icon active={active} />
                  )}
                </span>
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Secondary links */}
        <div className={styles.secondary}>
          <Link href="/profile" className={styles.secondaryLink} onClick={handleNavClick}>
            Settings
          </Link>
          <Link href="/help" className={styles.secondaryLink} onClick={handleNavClick}>
            Help
          </Link>
        </div>
      </nav>
    </>
  );
}
