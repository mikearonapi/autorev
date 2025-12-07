import Link from 'next/link';
import styles from './Footer.module.css';
import NewsletterSignup from './NewsletterSignup';

// Social Icons
const InstagramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
  </svg>
);

const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Brand & Tagline */}
        <div className={styles.brand}>
          <h3 className={styles.brandName}>SuperNatural Motorsports</h3>
          <p className={styles.tagline}>Unleash Your Racing Spirit</p>
        </div>

        {/* Quick Links */}
        <div className={styles.links}>
          <h4 className={styles.linksTitle}>Quick Links</h4>
          <nav className={styles.nav}>
            <Link href="/advisory" className={styles.link}>Car Selector</Link>
            <Link href="/upgrades" className={styles.link}>Upgrade Advisory</Link>
            <Link href="/services" className={styles.link}>Services</Link>
            <Link href="/contact" className={styles.link}>Contact</Link>
          </nav>
        </div>

        {/* Contact & Social */}
        <div className={styles.contact}>
          <h4 className={styles.linksTitle}>Connect</h4>
          <div className={styles.social}>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Instagram">
              <InstagramIcon />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="YouTube">
              <YouTubeIcon />
            </a>
            <a href="mailto:info@supernaturalmotorsports.com" className={styles.socialLink} aria-label="Email">
              <MailIcon />
            </a>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className={styles.newsletter}>
          <NewsletterSignup 
            variant="compact"
            title="Stay in the Loop"
            description="Expert insights and market updates."
            buttonText="Join"
          />
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.bottom}>
        <div className={styles.bottomContainer}>
          <p className={styles.copyright}>
            © {currentYear} SuperNatural Motorsports. All rights reserved.
          </p>
          <p className={styles.note}>
            For enthusiasts, by enthusiasts. All budgets welcome.
          </p>
        </div>
      </div>
    </footer>
  );
}

