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

export const metadata = {
  title: 'Tuning Shop | Plan Performance Builds & Modifications',
  description: 'Plan your perfect build with our interactive modification planner. Select a car, configure upgrades, track costs, and manage mod projects. From suspension to forced induction—build with purpose.',
  keywords: [
    'car tuning',
    'performance modifications',
    'mod planner',
    'build planner',
    'car upgrades',
    'suspension upgrades',
    'brake upgrades',
    'forced induction',
    'turbo kits',
    'supercharger',
    'exhaust upgrades',
    'engine tuning',
    'track car build',
    'sports car modifications',
    'car mod cost calculator',
  ],
  openGraph: {
    title: 'Tuning Shop | Plan Performance Builds & Modifications',
    description: 'Plan your perfect build with our interactive modification planner. Configure upgrades, track costs, and build with purpose.',
    url: '/tuning-shop',
    type: 'website',
  },
  twitter: {
    title: 'Tuning Shop | Plan Performance Builds & Modifications',
    description: 'Plan your perfect build with our interactive modification planner. Configure upgrades and track costs.',
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
