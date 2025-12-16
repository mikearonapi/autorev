/**
 * Car Selector Layout - SEO Metadata + Structured Data
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
  let carCount = 98; // Fallback
  try {
    const stats = await getPlatformStats();
    carCount = stats.cars || 98;
  } catch (e) {
    console.warn('[car-selector/layout] Failed to fetch stats for metadata:', e.message);
  }

  return {
    title: `Sports Car Selector | Compare ${carCount} Performance Vehicles`,
    description: `Select your perfect sports car with our intelligent comparison tool. Compare ${carCount} vehicles from $25K-$300K based on sound, track capability, reliability, daily comfort, and value. Real owner insights included.`,
    keywords: ['sports car selector', 'car comparison', 'track cars', 'sports car buying guide', 'Porsche comparison', 'BMW M comparison', 'Corvette comparison', 'best sports car under 100k', 'muscle cars', 'import tuners', 'drift cars'],
    openGraph: {
      title: `Sports Car Selector | Compare ${carCount} Performance Vehicles`,
      description: `Select your perfect sports car. Compare ${carCount} vehicles based on what matters most to you.`,
      url: '/car-selector',
      type: 'website',
    },
    twitter: {
      title: `Sports Car Selector | Compare ${carCount} Performance Vehicles`,
      description: `Select your perfect sports car. Compare ${carCount} vehicles from $25K-$300K.`,
    },
    alternates: {
      canonical: '/car-selector',
    },
  };
}

export default function CarSelectorLayout({ children }) {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Car Selector', url: '/car-selector' },
  ]);

  const webAppSchema = generateWebApplicationSchema({
    name: 'AutoRev Sports Car Selector',
    description: 'Intelligent sports car comparison tool. Match your priorities with the perfect vehicle based on sound, track capability, reliability, daily comfort, and value.',
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
