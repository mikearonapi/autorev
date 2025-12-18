/**
 * Profile Page Layout - SEO Metadata
 * 
 * Provides metadata for the Profile/Account page.
 * URL: /profile
 */

export const metadata = {
  title: 'My Profile | Account Settings & AL Credits',
  description: 'Manage your AutoRev account. Update profile settings, view AL credits, manage subscription, billing, and notification preferences.',
  robots: {
    index: false,  // Don't index profile pages
    follow: false,
  },
  alternates: {
    canonical: '/profile',
  },
};

export default function ProfileLayout({ children }) {
  return children;
}






