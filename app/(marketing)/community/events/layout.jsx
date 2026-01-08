/**
 * Community Events Layout - SEO Metadata + Structured Data
 * 
 * URL: /community/events
 * 
 * Provides:
 * - Static metadata for the events listing page
 * - ItemList schema for event listings
 * - BreadcrumbList schema
 */

import SchemaOrg from '@/components/SchemaOrg';
import { 
  generateBreadcrumbSchema,
  generateItemListSchema,
  SITE_URL,
} from '@/lib/seoUtils';

export const metadata = {
  title: 'Car Events Near You | Cars & Coffee, Track Days, Shows',
  description: 'Discover car events in your area. Browse Cars & Coffee meetups, track days, car shows, auctions, and more. Filter by location, event type, and date.',
  keywords: [
    'car events',
    'cars and coffee',
    'car shows',
    'track days',
    'HPDE events',
    'autocross',
    'car meetups',
    'automotive events',
    'car auctions',
    'car cruises',
    'motorsport events',
    'car enthusiast events',
  ],
  openGraph: {
    title: 'Car Events Near You | AutoRev',
    description: 'Discover Cars & Coffee, track days, shows, and more. Filter by location and event type.',
    url: '/community/events',
    type: 'website',
  },
  twitter: {
    title: 'Car Events Near You | AutoRev',
    description: 'Discover Cars & Coffee, track days, shows, and more.',
  },
  alternates: {
    canonical: '/community/events',
  },
};

export default function CommunityEventsLayout({ children }) {
  // Breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Community', url: '/community' },
    { name: 'Events', url: '/community/events' },
  ]);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <SchemaOrg schema={breadcrumbSchema} />
      {children}
    </>
  );
}












