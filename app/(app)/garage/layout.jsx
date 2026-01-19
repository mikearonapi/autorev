/**
 * Garage Layout - SEO Metadata
 * 
 * Provides metadata for the Garage page since the main page is a client component.
 * Note: Garage is a user-specific page so we use noindex for privacy.
 * 
 * IMPORTANT: No SchemaOrg here - user-specific pages don't need structured data
 * and it was causing rendering issues on mobile.
 */

export const metadata = {
  title: 'My Garage | Save Cars & Builds',
  description: 'Your personal automotive workspace. Save favorite cars, build configurations, and comparison lists. Plan your perfect setup with saved Performance HUB builds.',
  keywords: [
    'saved cars',
    'favorite sports cars',
    'car garage',
    'build planner',
    'saved builds',
    'car comparison',
    'performance builds',
    'modification planning',
  ],
  openGraph: {
    title: 'My Garage | Save Cars & Builds',
    description: 'Your personal automotive workspace. Save favorite cars, build configurations, and comparison lists.',
    url: '/garage',
    type: 'website',
  },
  twitter: {
    title: 'My Garage | Save Cars & Builds',
    description: 'Your personal automotive workspace for saved cars and builds.',
  },
  alternates: {
    canonical: '/garage',
  },
  // Don't index user-specific pages
  robots: {
    index: false,
    follow: true,
  },
};

export default function GarageLayout({ children }) {
  return children;
}






