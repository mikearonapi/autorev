/**
 * Maintenance Page - Build Pivot (January 2026)
 * 
 * A simple maintenance notice page to show during major updates.
 * Can be enabled by routing traffic to this page during deployments.
 */

import Link from 'next/link';
import styles from './page.module.css';

export const metadata = {
  title: 'Under Maintenance | AutoRev',
  description: 'AutoRev is currently undergoing maintenance and improvements. We\'ll be back shortly with a better experience.',
  robots: 'noindex, nofollow',
};

// Wrench icon
const WrenchIcon = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

export default function MaintenancePage() {
  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <WrenchIcon />
        </div>
        
        <h1 className={styles.title}>
          We&apos;re Making Things Better
        </h1>
        
        <p className={styles.description}>
          AutoRev is undergoing maintenance and improvements.
          We&apos;ll be back shortly with an enhanced experience.
        </p>
        
        <div className={styles.details}>
          <p>What&apos;s happening:</p>
          <ul>
            <li>Improving performance and reliability</li>
            <li>Enhancing the build planning experience</li>
            <li>Adding new features for enthusiasts</li>
          </ul>
        </div>
        
        <div className={styles.footer}>
          <p>Questions? Reach out at <a href="mailto:support@autorev.app">support@autorev.app</a></p>
          <p className={styles.brand}>
            Auto<span className={styles.accent}>Rev</span>
          </p>
        </div>
      </div>
    </main>
  );
}
