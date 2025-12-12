'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';
import UserMenu from './UserMenu';
import AuthModal from './AuthModal';

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
// - Find Your Car: Interactive car selection tool
// - Mod Planner: Plan upgrades for your car
// - How Mods Work: Learn about modifications
// - My Garage: Personal user area
const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/browse-cars', label: 'Browse Cars' },
  { href: '/car-selector', label: 'Find Your Car' },
  { href: '/mod-planner', label: 'Mod Planner' },
  { href: '/how-mods-work', label: 'How Mods Work' },
  { href: '/garage', label: 'My Garage' },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [suffixIndex, setSuffixIndex] = useState(0);
  const [suffixVisible, setSuffixVisible] = useState(true);
  const pathname = usePathname();

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

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
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

        {/* Desktop User Menu / Account */}
        <div className={styles.userMenuWrapper}>
          <UserMenu onSignInClick={() => setShowAuthModal(true)} />
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
      <div className={`${styles.mobileNav} ${isMenuOpen ? styles.mobileNavOpen : ''}`}>
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
        {/* Mobile User Menu */}
        <div className={styles.mobileUserMenu}>
          <UserMenu onSignInClick={() => {
            setIsMenuOpen(false);
            setShowAuthModal(true);
          }} />
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </header>
  );
}

