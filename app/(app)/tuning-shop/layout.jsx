/**
 * Tuning Shop Layout - SEO Metadata + Structured Data
 * 
 * Provides metadata for the Tuning Shop page (modification planning).
 * URL: /tuning-shop
 */

import SchemaOrg from '@/components/SchemaOrg';
import { 
  generateBreadcrumbSchema, 
  generateWebApplicationSchema 
} from '@/lib/seoUtils';

// Build Pivot (January 2026): This is now the PRIMARY product page
export const metadata = {
  title: 'Build Planner | Performance Modifications & Project Tracking',
  description: 'Plan your perfect performance build with verified parts data and real dyno results. Select your car, configure upgrades, see projected HP gains, and track your project. The complete platform for car enthusiasts.',
  keywords: [
    'car build planner',
    'performance modifications',
    'mod planner',
    'build planner',
    'car upgrades',
    'HP gains',
    'dyno results',
    'parts compatibility',
    'suspension upgrades',
    'forced induction',
    'turbo kits',
    'supercharger',
    'exhaust upgrades',
    'engine tuning',
    'track car build',
    'stage 1 tune',
    'stage 2 build',
    'car mod cost calculator',
    'build project tracker',
  ],
  openGraph: {
    title: 'Build Planner | Plan Your Perfect Performance Build',
    description: 'The complete platform for planning performance modifications. Verified parts data, real dyno results, and project tracking.',
    url: '/tuning-shop',
    type: 'website',
  },
  twitter: {
    title: 'Build Planner | Plan Your Perfect Performance Build',
    description: 'Plan your perfect build with verified parts data and real dyno results. Track your project from start to finish.',
  },
  alternates: {
    canonical: '/tuning-shop',
  },
};

export default function TuningShopLayout({ children }) {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Tuning Shop', url: '/tuning-shop' },
  ]);

  const webAppSchema = generateWebApplicationSchema({
    name: 'AutoRev Tuning Shop',
    description: 'Interactive modification planner to configure upgrades, estimate costs, and plan your perfect performance build.',
    path: '/tuning-shop',
    applicationCategory: 'AutomotiveApplication',
  });

  return (
    <>
      <SchemaOrg schemas={[breadcrumbSchema, webAppSchema]} />
      {children}
    </>
  );
}
