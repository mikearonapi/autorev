/**
 * Saved Events Layout - SEO Metadata
 * 
 * URL: /events/saved
 * 
 * User-specific page - noindex to prevent indexing of personalized content.
 */

export const metadata = {
  title: 'Saved Events | My Event Watchlist',
  description: 'View your saved car events. Track upcoming Cars & Coffee meetups, track days, and car shows you plan to attend.',
  openGraph: {
    title: 'Saved Events | AutoRev',
    description: 'Your personal car event watchlist.',
    url: '/events/saved',
    type: 'website',
  },
  twitter: {
    title: 'Saved Events | AutoRev',
    description: 'Your personal car event watchlist.',
  },
  alternates: {
    canonical: '/events/saved',
  },
  // Don't index user-specific pages
  robots: {
    index: false,
    follow: true,
  },
};

export default function SavedEventsLayout({ children }) {
  return children;
}

