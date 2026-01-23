/**
 * Settings Page Layout - SEO Metadata
 * 
 * Provides metadata for the Settings/Account page.
 * URL: /settings (formerly /profile)
 */

export const metadata = {
  title: 'Settings | Account Settings & AL Credits',
  description: 'Manage your AutoRev account. Update profile settings, view AL credits, manage subscription, billing, and notification preferences.',
  robots: {
    index: false,  // Don't index settings pages
    follow: false,
  },
  alternates: {
    canonical: '/settings',
  },
};

export default function SettingsLayout({ children }) {
  return children;
}
