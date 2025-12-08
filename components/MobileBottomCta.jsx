'use client';

/**
 * MobileBottomCta Component
 * 
 * Sticky bottom CTA bar for mobile users.
 * Shows contextual action based on current page.
 */

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './MobileBottomCta.module.css';

// Icons
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const WrenchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const MessageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

// Page-specific CTAs
const pageCtas = {
  '/': {
    primary: { href: '/car-selector', label: 'Find Your Car', icon: <SearchIcon /> },
    secondary: { href: '/contact', label: 'Contact' }
  },
  '/car-selector': {
    primary: { href: '/contact', label: 'Get Expert Help', icon: <MessageIcon /> },
    secondary: { href: '/performance', label: 'Plan Build' }
  },
  '/performance': {
    primary: { href: '/contact', label: 'Talk to Expert', icon: <MessageIcon /> },
    secondary: { href: '/education', label: 'Learn More' }
  },
  '/upgrades': {
    primary: { href: '/performance', label: 'Plan Your Build', icon: <WrenchIcon /> },
    secondary: { href: '/contact', label: 'Contact' }
  },
  '/education': {
    primary: { href: '/car-selector', label: 'Find Your Car', icon: <SearchIcon /> },
    secondary: { href: '/contact', label: 'Contact' }
  },
  '/cars': {
    primary: { href: '/car-selector', label: 'Compare Cars', icon: <SearchIcon /> },
    secondary: { href: '/contact', label: 'Contact' }
  }
};

// Pages where CTA bar should NOT appear
const hiddenPaths = ['/contact'];

export default function MobileBottomCta() {
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();

  // Get CTA config for current page
  const getCtaConfig = () => {
    // Check exact match first
    if (pageCtas[pathname]) {
      return pageCtas[pathname];
    }
    // Check for partial matches (e.g., /cars/[slug])
    for (const path of Object.keys(pageCtas)) {
      if (pathname.startsWith(path) && path !== '/') {
        return pageCtas[path];
      }
    }
    // Default CTA
    return pageCtas['/'];
  };

  const ctaConfig = getCtaConfig();

  // Check if should be hidden
  const shouldHide = hiddenPaths.some(path => pathname.startsWith(path));

  // Show/hide based on scroll direction and position
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Show after scrolling down 200px
      if (currentScrollY > 200) {
        // Hide when near bottom (last 200px)
        if (currentScrollY + windowHeight > documentHeight - 200) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      } else {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Don't render on hidden pages or if not visible
  if (shouldHide || !isVisible) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.bar}>
        <Link href={ctaConfig.primary.href} className={styles.primaryCta}>
          {ctaConfig.primary.icon}
          <span>{ctaConfig.primary.label}</span>
        </Link>
        {ctaConfig.secondary && (
          <Link href={ctaConfig.secondary.href} className={styles.secondaryCta}>
            {ctaConfig.secondary.label}
          </Link>
        )}
      </div>
    </div>
  );
}

