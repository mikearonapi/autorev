import Link from 'next/link';
import styles from './Footer.module.css';

// Navigation sections
const footerSections = [
  {
    title: 'Research',
    links: [
      { label: 'Browse Cars', href: '/browse-cars' },
      { label: 'Car Selector', href: '/car-selector' },
      { label: 'Encyclopedia', href: '/encyclopedia' },
    ],
  },
  {
    title: 'Ownership',
    links: [
      { label: 'My Garage', href: '/garage' },
      { label: 'Tuning Shop', href: '/tuning-shop' },
      { label: 'AutoRev AI', href: '/al' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'Events', href: '/community/events' },
      { label: 'Submit Event', href: '/events/submit' },
      { label: 'Community Hub', href: '/community' },
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
              The sports car encyclopedia for enthusiasts.
            </p>
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
