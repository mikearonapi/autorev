/**
 * Car Detail Page Layout - SEO Metadata + Structured Data
 * 
 * URL: /browse-cars/[slug]
 * 
 * Provides:
 * - Dynamic metadata for each car (title, description, Open Graph, Twitter)
 * - Vehicle schema (schema.org/Car)
 * - BreadcrumbList schema for navigation
 * 
 * Now fetches from database via carsClient.
 */

import { getCachedCarBySlug, getCachedCars, getCachedCarSlugs } from '@/lib/carsCache';
import SchemaOrg from '@/components/SchemaOrg';
import { 
  generateCarMetadata, 
  generateVehicleSchema, 
  generateBreadcrumbSchema,
  SITE_URL 
} from '@/lib/seoUtils';

/**
 * Fetch car by slug from database with caching.
 */
async function getCarBySlug(slug) {
  return await getCachedCarBySlug(slug);
}

/**
 * Fetch all car slugs for static generation with caching.
 */
async function getAllCarSlugs() {
  const slugs = await getCachedCarSlugs();
  return slugs.map(slug => ({ slug }));
}

/**
 * Generate static params for all car pages.
 * Enables static generation of car detail pages.
 */
export async function generateStaticParams() {
  return getAllCarSlugs();
}

/**
 * Generate dynamic metadata for each car page.
 */
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const car = await getCarBySlug(slug);
  
  if (!car) {
    return {
      title: 'Car Not Found',
      description: 'The requested car could not be found.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return generateCarMetadata(car);
}

/**
 * Car Detail Layout Component
 * Wraps children with structured data for SEO.
 */
export default async function CarDetailLayout({ children, params }) {
  const { slug } = await params;
  const car = await getCarBySlug(slug);

  // Generate structured data schemas
  const vehicleSchema = car ? generateVehicleSchema(car) : null;
  
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Browse Cars', url: '/browse-cars' },
    { name: car?.name || 'Car', url: `/browse-cars/${slug}` },
  ]);

  // Collect all valid schemas
  const schemas = [breadcrumbSchema, vehicleSchema].filter(Boolean);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <SchemaOrg schemas={schemas} />
      {children}
    </>
  );
}
