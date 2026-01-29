'use client';

import { useState, useCallback, useEffect } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { useAuth } from '@/components/providers/AuthProvider';

import styles from './DesktopHeader.module.css';
import DesktopSidebar from './DesktopSidebar';

/**
 * DesktopHeader - Premium Header for iPad/Desktop
 *
 * Design: Clean, minimal header with centered branding
 * - Hamburger menu (left) - opens sidebar navigation
 * - AutoRev logo (dead center)
 * - User avatar (right) - links to profile
 *
 * Shows at 768px+ (iPad and desktop), hidden on mobile
 * Uses both CSS media queries AND JavaScript detection for reliability
 */

// Minimum width to show desktop header (matches CSS breakpoint)
const DESKTOP_BREAKPOINT = 768;

// Hamburger icon - clean 3-line design
const HamburgerIcon = () => (
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
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

// Default avatar icon when user has no profile picture
const DefaultAvatarIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);

export default function DesktopHeader() {
  const { user, profile, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Check if we're on desktop (768px+)
  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    };

    // Check on mount
    checkIsDesktop();

    // Listen for resize events
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  const handleOpenSidebar = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // Get avatar URL from profile or user metadata
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;

  // Don't render on mobile - only render on desktop/iPad (768px+)
  if (!isDesktop) {
    return null;
  }

  return (
    <>
      <header className={styles.header}>
        <div className={styles.container}>
          {/* Left: Hamburger menu */}
          <button
            className={styles.hamburger}
            onClick={handleOpenSidebar}
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
            aria-controls="desktop-sidebar"
          >
            <HamburgerIcon />
          </button>

          {/* Center: AutoRev logo */}
          <Link href="/" className={styles.logoLink} aria-label="AutoRev home">
            <Image
              src="/autorev-logo-transparent.png"
              alt="AutoRev"
              width={140}
              height={32}
              className={styles.logo}
              priority
            />
          </Link>

          {/* Right: User avatar */}
          <Link
            href={isAuthenticated ? '/profile' : '/login'}
            className={styles.avatar}
            aria-label={isAuthenticated ? 'View profile' : 'Sign in'}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Profile"
                width={36}
                height={36}
                className={styles.avatarImage}
              />
            ) : (
              <span className={styles.avatarPlaceholder}>
                <DefaultAvatarIcon />
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Sidebar navigation drawer */}
      <DesktopSidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />
    </>
  );
}
