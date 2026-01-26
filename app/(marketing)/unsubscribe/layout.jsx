/**
 * Unsubscribe Page Layout - SEO Metadata
 * 
 * Provides metadata for the unsubscribe/email preferences page.
 * This page should NOT be indexed as it's a utility page.
 * 
 * URL: /unsubscribe
 */

export const metadata = {
  title: 'Email Preferences | AutoRev',
  description: 'Manage your AutoRev email preferences and notification settings.',
  // Don't index utility pages
  robots: {
    index: false,
    follow: false,
  },
};

export default function UnsubscribeLayout({ children }) {
  return children;
}
