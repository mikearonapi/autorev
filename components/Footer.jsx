'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

// Brand suffix rotation: Revival → Revelation → Revolution
const brandSuffixes = ['ival', 'elation', 'olution'];

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [suffixIndex, setSuffixIndex] = useState(0);
  const [suffixVisible, setSuffixVisible] = useState(true);

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

  const mainLinks = [
    { href: '/browse-cars', label: 'Browse Cars' },
    { href: '/car-selector', label: 'Your Sportscar Match' },
    { href: '/tuning-shop', label: 'Tuning Shop' },
    { href: '/community', label: 'Community' },
    { href: '/community/events', label: 'Events' },
    { href: '/encyclopedia', label: 'Encyclopedia' },
    { href: '/garage', label: 'My Garage' },
    { href: '/contact', label: 'Contact' },
  ];

  const legalLinks = [
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Top Row: Brand + Navigation */}
        <div className={styles.topRow}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandName}>
              Auto<span className={styles.brandRev}>Rev</span>
              <span className={`${styles.brandSuffix} ${suffixVisible ? styles.suffixVisible : styles.suffixHidden}`}>
                {brandSuffixes[suffixIndex]}
              </span>
            </span>
          </Link>

          <nav className={styles.mainNav} aria-label="Footer navigation">
            {mainLinks.map((link) => (
              <Link key={link.href} href={link.href} className={styles.navLink}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Bottom Row: Copyright + Legal */}
        <div className={styles.bottomRow}>
          <p className={styles.copyright}>
            © {currentYear} AutoRev. All rights reserved.
          </p>

          <nav className={styles.legalNav} aria-label="Legal links">
            {legalLinks.map((link, index) => (
              <span key={link.href}>
                <Link href={link.href} className={styles.legalLink}>
                  {link.label}
                </Link>
                {index < legalLinks.length - 1 && (
                  <span className={styles.separator}>·</span>
                )}
              </span>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
