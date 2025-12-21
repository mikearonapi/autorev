/**
 * Community Hub Layout - SEO Metadata
 * 
 * URL: /community
 * 
 * Provides metadata for the community landing page.
 */

import SchemaOrg from '@/components/SchemaOrg';
import { generateBreadcrumbSchema } from '@/lib/seoUtils';

export const metadata = {
  title: 'Community Hub | Events, Resources & Enthusiast Network',
  description: 'Join the AutoRev community. Discover car events, connect with enthusiasts, and access resources for your automotive journey. From track days to Cars & Coffee meetups.',
  keywords: [
    'car community',
    'automotive enthusiasts',
    'car events',
    'car meetups',
    'car clubs',
    'automotive community',
    'car enthusiast network',
    'track day community',
  ],
  openGraph: {
    title: 'Community Hub | AutoRev',
    description: 'Join the AutoRev community. Discover events, connect with enthusiasts, and access resources.',
    url: '/community',
    type: 'website',
  },
  twitter: {
    title: 'Community Hub | AutoRev',
    description: 'Join the AutoRev community. Discover events and connect with enthusiasts.',
  },
  alternates: {
    canonical: '/community',
  },
};

export default function CommunityLayout({ children }) {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Community', url: '/community' },
  ]);

  return (
    <>
      <SchemaOrg schema={breadcrumbSchema} />
      {children}
    </>
  );
}












