/**
 * Vehicle Match Layout - SEO Metadata + Structured Data
 * 
 * URL: /car-selector
 */

import { getPlatformStats } from '@/lib/statsService';
import SchemaOrg from '@/components/SchemaOrg';
import { 
  generateBreadcrumbSchema, 
  generateWebApplicationSchema 
} from '@/lib/seoUtils';

export async function generateMetadata() {
  let carCount = 188; // Fallback
  try {
    const stats = await getPlatformStats();
    carCount = stats.cars || 188;
  } catch (e) {
    console.warn('[car-selector/layout] Failed to fetch stats for metadata:', e.message);
  }

  return {
    title: `Vehicle Match | Compare ${carCount} Performance Vehicles`,
    description: `Find your perfect vehicle with our intelligent matching tool. Compare ${carCount} vehicles from $25K-$300K based on sound, track capability, reliability, daily comfort, and value. Real owner insights included.`,
    keywords: ['vehicle match', 'car comparison', 'track cars', 'sports car buying guide', 'Porsche comparison', 'BMW M comparison', 'Corvette comparison', 'best sports car under 100k', 'muscle cars', 'import tuners', 'drift cars', 'sports sedan', 'hot hatch'],
    openGraph: {
      title: `Vehicle Match | Compare ${carCount} Performance Vehicles`,
      description: `Find your perfect vehicle. Compare ${carCount} vehicles based on what matters most to you.`,
      url: '/car-selector',
      type: 'website',
    },
    twitter: {
      title: `Vehicle Match | Compare ${carCount} Performance Vehicles`,
      description: `Find your perfect vehicle. Compare ${carCount} vehicles from $25K-$300K.`,
    },
    alternates: {
      canonical: '/car-selector',
    },
  };
}

export default function CarSelectorLayout({ children }) {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Vehicle Match', url: '/car-selector' },
  ]);

  const webAppSchema = generateWebApplicationSchema({
    name: 'AutoRev Vehicle Match',
    description: 'Intelligent vehicle comparison tool. Match your priorities with the perfect vehicle based on sound, track capability, reliability, daily comfort, and value.',
    path: '/car-selector',
    applicationCategory: 'AutomotiveApplication',
  });

  return (
    <>
      <SchemaOrg schemas={[breadcrumbSchema, webAppSchema]} />
      {children}
    </>
  );
}
