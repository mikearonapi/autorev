/**
 * Car Detail Page Layout - SEO Metadata + Structured Data
 * 
 * URL: /browse-cars/[slug]
 * 
 * Provides:
 * - Dynamic metadata for each car (title, description, Open Graph, Twitter)
 * - Vehicle schema (schema.org/Car)
 * - BreadcrumbList schema for navigation
 */

import { carData } from '@/data/cars.js';
import SchemaOrg from '@/components/SchemaOrg';
import { 
  generateCarMetadata, 
  generateVehicleSchema, 
  generateBreadcrumbSchema,
  SITE_URL 
} from '@/lib/seoUtils';

/**
 * Generate static params for all car pages.
 * Enables static generation of car detail pages.
 */
export async function generateStaticParams() {
  return carData.map((car) => ({
    slug: car.slug,
  }));
}

/**
 * Generate dynamic metadata for each car page.
 */
export async function generateMetadata({ params }) {
  const { slug } = params;
  const car = carData.find((c) => c.slug === slug);
  
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
export default function CarDetailLayout({ children, params }) {
  const { slug } = params;
  const car = carData.find((c) => c.slug === slug);

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
