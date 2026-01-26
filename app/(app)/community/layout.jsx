import CommunityNav from './CommunityNav';
import styles from './layout.module.css';

/**
 * Community Layout - Shared wrapper for all community pages
 * 
 * Provides:
 * - Tab bar navigation (Builds/Events/Leaderboard)
 * - Consistent container styling
 * - Base metadata (pages can override with their own)
 * 
 * Routes:
 * - /community → Builds feed (main page)
 * - /community/events → Events page
 * - /community/leaderboard → Leaderboard page
 */

export const metadata = {
  title: {
    template: '%s | AutoRev Community',
    default: 'Community Builds | AutoRev',
  },
  description: 'Explore community builds, car events, and see top contributors in the AutoRev community.',
  keywords: [
    'car builds',
    'community builds',
    'car events',
    'car meets',
    'leaderboard',
    'car modification showcase',
  ],
  openGraph: {
    title: 'AutoRev Community',
    description: 'Explore community builds, events, and connect with enthusiasts.',
    url: '/community',
    type: 'website',
  },
  twitter: {
    title: 'AutoRev Community',
    description: 'Explore community builds, events, and connect with enthusiasts.',
  },
  alternates: {
    canonical: '/community',
  },
  robots: {
    index: false, // App route - marketing version at /community is indexed
    follow: true,
  },
};

export default function CommunityLayout({ children }) {
  return (
    <div className={styles.container}>
      <CommunityNav />
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
