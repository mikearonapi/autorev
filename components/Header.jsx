'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Header.module.css';
import AuthModal, { useAuthModal } from './AuthModal';
import { useAIChat } from './AIChatContext';
import { useAuth } from './providers/AuthProvider';
import { isAdminEmail } from '@/lib/adminAccess';
import { prefetchForRoute } from '@/lib/prefetch';
import { UI_IMAGES } from '@/lib/images';

// Brand suffix rotation: Revival → Revelation → Revolution
const brandSuffixes = ['ival', 'elation', 'olution'];

// Menu Icon
const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

// Close Icon
const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

// Chevron Icon for dropdowns
const ChevronIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

// Navigation links - Build-focused pivot (January 2026)
// 5-Tab Structure: Garage, Build, Performance, Community, Profile
// Primary focus: Build planning, performance tracking, community
// All old routes redirect to new structure
const navLinks = [
  { href: '/garage', label: 'Garage' },
  { href: '/build', label: 'Build' },
  { href: '/performance', label: 'Performance' },
  { href: '/community', label: 'Community' },
  { href: '/encyclopedia', label: 'Encyclopedia' },
];

// App routes where tab bar is shown (header should be minimal on mobile)
const APP_ROUTES = [
  '/garage',
  '/build',
  '/performance',
  '/community',
  '/profile',
  '/parts',
  '/encyclopedia',
  '/al',
  // Legacy routes (redirect but still match)
  '/tuning-shop',
  '/my-builds',
];

// AL Mascot Avatar for mobile menu
const ALMascotIcon = ({ size = 20 }) => (
  <img 
    src={UI_IMAGES.alMascot}
    alt="AL"
    width={size} 
    height={size}
    style={{ 
      width: size, 
      height: size, 
      borderRadius: '50%',
      objectFit: 'cover',
    }}
  />
);

// Profile Icon for mobile menu (user silhouette)
const ProfileIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

// Settings Icon for desktop dropdown
const SettingsIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

// Logout Icon
const LogoutIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [suffixIndex, setSuffixIndex] = useState(0);
  const [suffixVisible, setSuffixVisible] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const mobileNavRef = useRef(null);
  
  // Auth
  const { user, profile, isAuthenticated, logout } = useAuth();
  const authModal = useAuthModal();
  
  // GRAVL-STYLE: Hide header completely on homepage
  // Homepage is a standalone marketing page - no navigation
  const isHomepage = pathname === '/';
  if (isHomepage) {
    return null;
  }
  
  // AI Chat context for mobile menu
  const { toggleChat } = useAIChat();
  
  // Get avatar URL from profile or user metadata
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0];
  const firstName = displayName?.split(' ')[0] || 'there';
  const initials = (displayName || 'U').charAt(0).toUpperCase();
  
  // Check if user is admin
  const isAdmin = useMemo(() => {
    return user?.email && isAdminEmail(user.email);
  }, [user?.email]);
  
  // Check if on an app page (where bottom tab bar is shown)
  const isAppPage = useMemo(() => {
    return APP_ROUTES.some(route => pathname?.startsWith(route));
  }, [pathname]);
  
  // Handle sign out - redirects to home page after logout
  const handleSignOut = async () => {
    try {
      setShowProfileDropdown(false);
      await logout();
      // Redirect to home page after logout
      router.push('/');
    } catch (error) {
      console.error('[Header] Sign out error:', error);
      // Still redirect to home even on error - user expects to be logged out
      router.push('/');
    }
  };

  // Handle mobile login - ensures menu closes even if auth modal fails
  const handleMobileLogin = () => {
    try {
      setIsMenuOpen(false);
    } catch (error) {
      console.error('[Header] Error closing menu:', error);
    }
    // Always try to open auth modal regardless of menu close success
    authModal.openSignIn();
  };

  // Handle mobile sign out - ensures menu closes even if logout fails
  const handleMobileSignOut = async () => {
    try {
      setIsMenuOpen(false);
    } catch (error) {
      console.error('[Header] Error closing menu:', error);
    }
    // Always try to sign out regardless of menu close success
    try {
      await handleSignOut();
    } catch (error) {
      console.error('[Header] Error signing out:', error);
    }
  };

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Handle scroll for header shadow
  useEffect(() => {
  if (typeof window === 'undefined') return;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when menu is open and reset menu scroll position
  useEffect(() => {
  if (typeof document === 'undefined') return;
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      // Reset mobile nav scroll to top when opening
      if (mobileNavRef.current) {
        mobileNavRef.current.scrollTop = 0;
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Cycle through brand suffixes every 1.5 seconds
  useEffect(() => {
    const cycleInterval = setInterval(() => {
      setSuffixVisible(false);
      setTimeout(() => {
        setSuffixIndex((prev) => (prev + 1) % brandSuffixes.length);
        setSuffixVisible(true);
      }, 300);
    }, 1500);

    return () => clearInterval(cycleInterval);
  }, []);

  const isActive = (href) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // OPTIMIZATION: Prefetch user data on hover over navigation links
  // This makes page loads feel instant
  const handleNavHover = useCallback((href) => {
    // Only prefetch for authenticated users
    if (!isAuthenticated || !user?.id) return;
    
    // Prefetch data for the route
    prefetchForRoute(href, user.id);
  }, [isAuthenticated, user?.id]);

  return (
    <>
      <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''} ${isAppPage ? styles.headerAppPage : ''}`}>
        <div className={styles.container}>
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <Image 
                src={UI_IMAGES.logoTrimmed}
                alt="AutoRev Logo" 
                width={36} 
                height={36}
                unoptimized
                priority
              />
            </div>
            <div className={styles.logoText}>
              <span className={styles.logoName}>
                Auto<span className={styles.logoRev}>Rev</span><span className={`${styles.logoSuffix} ${suffixVisible ? styles.suffixVisible : styles.suffixHidden}`}>{brandSuffixes[suffixIndex]}</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className={styles.desktopNav}>
            {navLinks.map(link => (
              link.subLinks ? (
                <div key={link.href || link.label} className={styles.navDropdown}>
                  {link.href ? (
                    <Link
                      href={link.href}
                      className={`${styles.navLink} ${isActive(link.href) || link.subLinks.some(sub => isActive(sub.href)) ? styles.navLinkActive : ''}`}
                      onMouseEnter={() => handleNavHover(link.href)}
                    >
                      {link.label}
                      <ChevronIcon />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className={`${styles.navLink} ${styles.navLinkDropdown} ${link.subLinks.some(sub => isActive(sub.href)) ? styles.navLinkActive : ''}`}
                    >
                      {link.label}
                      <ChevronIcon />
                    </button>
                  )}
                  <div className={styles.dropdownMenu}>
                    {link.subLinks.map(subLink => (
                      <Link
                        key={subLink.href}
                        href={subLink.href}
                        className={`${styles.dropdownItem} ${isActive(subLink.href) ? styles.dropdownItemActive : ''}`}
                        onMouseEnter={() => handleNavHover(subLink.href)}
                      >
                        {subLink.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={link.href}
                  onMouseEnter={() => handleNavHover(link.href)}
                  href={link.href}
                  className={`${styles.navLink} ${isActive(link.href) ? styles.navLinkActive : ''}`}
                >
                  {link.label}
                </Link>
              )
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className={styles.headerActions}>
            {isAuthenticated ? (
              <div 
                className={styles.profileDropdownContainer}
                onMouseEnter={() => setShowProfileDropdown(true)}
                onMouseLeave={() => setShowProfileDropdown(false)}
              >
                <Link href="/profile" className={styles.profileLink} onMouseEnter={() => handleNavHover('/profile')}>
                  <span className={styles.profileGreeting}>Hi {firstName}</span>
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={displayName || 'Profile'}
                      width={32}
                      height={32}
                      className={styles.profileAvatarImage}
                    />
                  ) : (
                    <span className={styles.profileAvatar}>
                      {initials}
                    </span>
                  )}
                </Link>
                
                {/* Profile Dropdown */}
                <div className={`${styles.profileDropdown} ${showProfileDropdown ? styles.profileDropdownOpen : ''}`}>
                  <div className={styles.profileDropdownHeader}>
                    <span className={styles.profileDropdownName}>{displayName}</span>
                    <span className={styles.profileDropdownEmail}>{user?.email}</span>
                  </div>
                  <div className={styles.profileDropdownDivider} />
                  {isAdmin && (
                    <>
                      <Link 
                        href="/admin" 
                        className={styles.profileDropdownItem}
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <line x1="3" y1="9" x2="21" y2="9"/>
                          <line x1="9" y1="21" x2="9" y2="9"/>
                        </svg>
                        Admin Dashboard
                      </Link>
                      <div className={styles.profileDropdownDivider} />
                    </>
                  )}
                  <Link 
                    href="/profile" 
                    className={styles.profileDropdownItem}
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    <SettingsIcon size={16} />
                    My Profile
                  </Link>
                  <div className={styles.profileDropdownDivider} />
                  <button 
                    className={styles.profileDropdownSignOut}
                    onClick={handleSignOut}
                  >
                    <LogoutIcon size={16} />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button 
                  className={styles.loginLink}
                  onClick={() => authModal.openSignIn()}
                >
                  Log In
                </button>
                <Link href="/join" className={styles.joinButton}>
                  Join
                </Link>
              </>
            )}
          </div>

          {/* Mobile Right Group - Greeting + Hamburger tightly together */}
          <div className={styles.mobileRightGroup}>
            {/* Mobile User Greeting - Shows when logged in */}
            {isAuthenticated && (
              <Link href="/profile" className={styles.mobileUserGreeting}>
                <span className={styles.mobileGreetingText}>Hi {firstName}</span>
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName || 'Profile'}
                    width={32}
                    height={32}
                    className={styles.mobileGreetingAvatar}
                  />
                ) : (
                  <span className={styles.mobileGreetingAvatarFallback}>
                    {initials}
                  </span>
                )}
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className={styles.menuToggle}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              data-testid="mobile-menu-toggle"
            >
              {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </header>

      {/* 
        Mobile Navigation Overlay - MUST be outside <header> to escape its stacking context.
        When header has position:fixed + backdrop-filter, it creates a stacking context
        that traps children regardless of z-index. Sibling placement allows proper layering.
      */}
      <div 
        ref={mobileNavRef}
        className={`${styles.mobileNav} ${isMenuOpen ? styles.mobileNavOpen : ''}`}
        data-testid="mobile-nav"
        data-open={isMenuOpen ? 'true' : 'false'}
      >
        <nav className={styles.mobileNavLinks}>
          {navLinks.map(link => (
            link.subLinks ? (
              <div key={link.href || link.label} className={styles.mobileNavGroup}>
                {link.href ? (
                  <Link
                    href={link.href}
                    className={`${styles.mobileNavLink} ${isActive(link.href) ? styles.mobileNavLinkActive : ''}`}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <span className={`${styles.mobileNavLink} ${styles.mobileNavLabel}`}>
                    {link.label}
                  </span>
                )}
                <div className={styles.mobileSubLinks}>
                  {link.subLinks.map(subLink => (
                    <Link
                      key={subLink.href}
                      href={subLink.href}
                      className={`${styles.mobileSubLink} ${isActive(subLink.href) ? styles.mobileNavLinkActive : ''}`}
                    >
                      {subLink.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.mobileNavLink} ${isActive(link.href) ? styles.mobileNavLinkActive : ''}`}
              >
                {link.label}
              </Link>
            )
          ))}
        </nav>
        {/* Mobile Actions */}
        <div className={styles.mobileActions}>
          <button 
            className={styles.mobileAiMechanicBtn}
            onClick={() => {
              setIsMenuOpen(false);
              toggleChat();
            }}
          >
            <ALMascotIcon size={32} />
            <span>Ask AL</span>
          </button>
          
          {/* Admin Dashboard - only visible for admins */}
          {isAdmin && (
            <Link 
              href="/admin"
              className={styles.mobileAdminLink}
              onClick={() => setIsMenuOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
              <span>Admin Dashboard</span>
            </Link>
          )}
          
          {/* Profile link - always visible, leads to profile page */}
          <Link 
            href="/profile"
            className={styles.mobileSettingsLink}
            onClick={() => setIsMenuOpen(false)}
          >
            <ProfileIcon size={20} />
            <span>Profile</span>
          </Link>
          
          {/* Mobile Auth Buttons - Only shown when not authenticated */}
          {!isAuthenticated && (
            <div className={styles.mobileAuthButtons}>
              <button 
                className={styles.mobileLoginBtn}
                onClick={handleMobileLogin}
              >
                Log In
              </button>
              <Link 
                href="/join" 
                className={styles.mobileJoinBtn}
                onClick={() => setIsMenuOpen(false)}
              >
                Join
              </Link>
            </div>
          )}
          
          {/* Sign Out for authenticated users */}
          {isAuthenticated && (
            <button 
              className={styles.mobileSignOutBtn}
              onClick={handleMobileSignOut}
            >
              <LogoutIcon size={20} />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={authModal.close}
        defaultMode={authModal.defaultMode}
      />
    </>
  );
}

