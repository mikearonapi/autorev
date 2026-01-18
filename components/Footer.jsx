import Link from 'next/link';
import styles from './Footer.module.css';

// Social media links
const socialLinks = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/autorev.app/',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61585868463925',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
];

// Navigation sections - Build-focused (January 2026)
const footerSections = [
  {
    title: 'Build',
    links: [
      { label: 'Start Building', href: '/tuning-shop' },
      { label: 'Parts Database', href: '/parts' },
      { label: 'Encyclopedia', href: '/encyclopedia' },
    ],
  },
  {
    title: 'My Account',
    links: [
      { label: 'My Projects', href: '/my-builds' },
      { label: 'Profile', href: '/profile' },
      { label: 'AL Assistant', href: '/al' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'Community Builds', href: '/community/builds' },
      { label: 'Events', href: '/community/events' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Join AutoRev', href: '/join' },
      { label: 'Contact', href: '/contact' },
    ],
  },
];

// Popular brands
const popularBrands = [
  { name: 'Porsche', slug: 'porsche' },
  { name: 'BMW', slug: 'bmw' },
  { name: 'Audi', slug: 'audi' },
  { name: 'Chevrolet', slug: 'chevrolet' },
  { name: 'Lotus', slug: 'lotus' },
  { name: 'Ferrari', slug: 'ferrari' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Top Section: Brand + Nav Columns */}
        <div className={styles.topSection}>
          {/* Brand */}
          <div className={styles.brandColumn}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoText}>
                Auto<span className={styles.logoAccent}>Rev</span>
              </span>
            </Link>
            <p className={styles.tagline}>
              Plan your perfect build.
            </p>
            <p className={styles.jarvisTag}>
              The complete platform for performance modifications.
            </p>
            <div className={styles.socialLinks}>
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label={`Follow us on ${social.name}`}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Columns */}
          <div className={styles.navColumns}>
            {footerSections.map((section) => (
              <div key={section.title} className={styles.navColumn}>
                <h3 className={styles.columnTitle}>{section.title}</h3>
                <ul className={styles.columnLinks}>
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className={styles.columnLink}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Bottom Section: Brands + Legal */}
        <div className={styles.bottomSection}>
          <nav className={styles.brandsNav} aria-label="Popular brands">
            {popularBrands.map((brand, i) => (
              <span key={brand.slug}>
                <Link href={`/browse-cars?brand=${brand.slug}`} className={styles.brandLink}>
                  {brand.name}
                </Link>
                {i < popularBrands.length - 1 && <span className={styles.brandSep}>·</span>}
              </span>
            ))}
            <span className={styles.brandSep}>·</span>
            <Link href="/browse-cars" className={styles.brandLinkAll}>
              All Cars →
            </Link>
          </nav>

          <div className={styles.legalRow}>
            <p className={styles.copyright}>© {currentYear} AutoRev</p>
            <nav className={styles.legalLinks} aria-label="Legal">
              <Link href="/privacy" className={styles.legalLink}>Privacy</Link>
              <span className={styles.legalSep}>·</span>
              <Link href="/terms" className={styles.legalLink}>Terms</Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
