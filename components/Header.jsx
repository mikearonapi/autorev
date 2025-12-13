'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';
import AuthModal, { useAuthModal } from './AuthModal';
import { useAIChat } from './AIMechanicChat';
import { useAuth } from './providers/AuthProvider';

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

// Navigation links - KISS principles: clear, direct names that match URLs
// - Browse Cars: Explore our car catalog
// - Your Sports Car Match: Interactive car selection tool
// - My Garage: Personal user area (collection & favorites)
// - Tuning Shop: Mod planner & projects
// - Encyclopedia: Automotive Education
const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/browse-cars', label: 'Browse Cars' },
  { href: '/car-selector', label: 'Your Sports Car Match' },
  { href: '/garage', label: 'My Garage' },
  { href: '/tuning-shop', label: 'Tuning Shop' },
  { href: '/encyclopedia', label: 'Encyclopedia' },
];

// AL Mascot Avatar for mobile menu
const ALMascotIcon = ({ size = 20 }) => (
  <img 
    src="/images/al-mascot.png" 
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

// Settings Icon for mobile menu
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
  const mobileNavRef = useRef(null);
  
  // Auth
  const { user, profile, isAuthenticated, logout } = useAuth();
  const authModal = useAuthModal();
  
  // AI Chat context for mobile menu
  const { toggleChat } = useAIChat();
  
  // Get avatar URL from profile or user metadata
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0];
  const initials = (displayName || 'U').charAt(0).toUpperCase();
  
  // Handle sign out
  const handleSignOut = async () => {
    setShowProfileDropdown(false);
    await logout();
  };

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Handle scroll for header shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when menu is open and reset menu scroll position
  useEffect(() => {
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

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <Image 
              src="/images/autorev-logo-trimmed.png" 
              alt="AutoRev Logo" 
              width={36} 
              height={36}
              priority
              unoptimized
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
              <div key={link.href} className={styles.navDropdown}>
                <Link
                  href={link.href}
                  className={`${styles.navLink} ${isActive(link.href) || link.subLinks.some(sub => isActive(sub.href)) ? styles.navLinkActive : ''}`}
                >
                  {link.label}
                  <ChevronIcon />
                </Link>
                <div className={styles.dropdownMenu}>
                  {link.subLinks.map(subLink => (
                    <Link
                      key={subLink.href}
                      href={subLink.href}
                      className={`${styles.dropdownItem} ${isActive(subLink.href) ? styles.dropdownItemActive : ''}`}
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
              <Link href="/profile" className={styles.profileLink}>
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName || 'Profile'}
                    width={36}
                    height={36}
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

        {/* Mobile Menu Toggle */}
        <button
          className={styles.menuToggle}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile Navigation Overlay */}
      <div 
        ref={mobileNavRef}
        className={`${styles.mobileNav} ${isMenuOpen ? styles.mobileNavOpen : ''}`}
      >
        <nav className={styles.mobileNavLinks}>
          {navLinks.map(link => (
            link.subLinks ? (
              <div key={link.href} className={styles.mobileNavGroup}>
                <Link
                  href={link.href}
                  className={`${styles.mobileNavLink} ${isActive(link.href) ? styles.mobileNavLinkActive : ''}`}
                >
                  {link.label}
                </Link>
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
          
          {/* Settings link - always visible, leads to profile page */}
          <Link 
            href="/profile"
            className={styles.mobileSettingsLink}
            onClick={() => setIsMenuOpen(false)}
          >
            <SettingsIcon size={20} />
            <span>Settings</span>
          </Link>
          
          {/* Mobile Auth Buttons - Only shown when not authenticated */}
          {!isAuthenticated && (
            <div className={styles.mobileAuthButtons}>
              <button 
                className={styles.mobileLoginBtn}
                onClick={() => {
                  setIsMenuOpen(false);
                  authModal.openSignIn();
                }}
              >
                Log In
              </button>
              <Link 
                href="/join" 
                className={styles.mobileJoinBtn}
                onClick={() => setIsMenuOpen(false)}
              >
                Join AutoRev
              </Link>
            </div>
          )}
          
          {/* Sign Out for authenticated users */}
          {isAuthenticated && (
            <button 
              className={styles.mobileSignOutBtn}
              onClick={() => {
                setIsMenuOpen(false);
                handleSignOut();
              }}
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
    </header>
  );
}

