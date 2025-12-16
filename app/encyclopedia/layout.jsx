/**
 * Encyclopedia Layout - Automotive Education + SEO
 * 
 * Comprehensive guide to car systems, modifications, and build paths.
 * URL: /encyclopedia
 * 
 * Provides:
 * - Static metadata for the encyclopedia landing page
 * - Article schema (schema.org/Article)
 * - BreadcrumbList schema
 */

import SchemaOrg from '@/components/SchemaOrg';
import { 
  generateBreadcrumbSchema,
  generateArticleSchema,
  SITE_URL,
} from '@/lib/seoUtils';

export const metadata = {
  title: 'Automotive Encyclopedia | Learn About Cars, Mods & Performance',
  description: 'Your comprehensive guide to understanding how cars work, what modifications do, and how to build your perfect machine. 9 systems, 136 topics, 49 mods explained.',
  keywords: [
    'automotive encyclopedia',
    'automotive education',
    'car modifications guide',
    'how cars work',
    'vehicle systems explained',
    'performance upgrades',
    'car mod encyclopedia',
    'tuning guide',
    'suspension explained',
    'brake upgrades',
    'engine tuning',
    'forced induction',
    'turbo explained',
    'car build guide',
    'track car preparation',
    'engine components',
    'drivetrain explained',
    'exhaust system',
    'cooling system',
  ],
  openGraph: {
    title: 'Automotive Encyclopedia | AutoRev',
    description: 'Your comprehensive guide to car systems, modifications, and build paths. 9 systems, 136 topics, 49 mods explained.',
    url: '/encyclopedia',
    type: 'website',
  },
  twitter: {
    title: 'Automotive Encyclopedia | AutoRev',
    description: 'Your comprehensive guide to car systems, modifications, and build paths.',
  },
  alternates: {
    canonical: '/encyclopedia',
  },
};

export default function EncyclopediaLayout({ children }) {
  // Breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Encyclopedia', url: '/encyclopedia' },
  ]);

  // Article schema for the encyclopedia as educational content
  const articleSchema = generateArticleSchema({
    title: 'Automotive Encyclopedia',
    description: 'Comprehensive guide to understanding automotive systems, modifications, and performance upgrades. From engine fundamentals to advanced tuning concepts.',
    path: '/encyclopedia',
    keywords: ['automotive education', 'car systems', 'modifications', 'performance upgrades'],
  });

  const schemas = [breadcrumbSchema, articleSchema];

  return (
    <>
      {/* JSON-LD Structured Data */}
      <SchemaOrg schemas={schemas} />
      {children}
    </>
  );
}
