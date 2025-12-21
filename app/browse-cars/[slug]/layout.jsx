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
 * Now fetches from Supabase with fallback to static data.
 */

import { carData as localCarData } from '@/data/cars.js';
import SchemaOrg from '@/components/SchemaOrg';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  generateCarMetadata, 
  generateVehicleSchema, 
  generateBreadcrumbSchema,
  SITE_URL 
} from '@/lib/seoUtils';

/**
 * Fetch car by slug from database with fallback to static data.
 */
async function getCarBySlug(slug) {
  // Try database first
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (!error && data) {
        // Transform snake_case to camelCase for compatibility
        return {
          ...data,
          priceRange: data.price_range,
          priceAvg: data.price_avg,
          curbWeight: data.curb_weight,
          zeroToSixty: data.zero_to_sixty,
          topSpeed: data.top_speed,
          heroBlurb: data.hero_blurb,
          imageHeroUrl: data.image_hero_url,
        };
      }
    } catch {
      // Fall through to static data
    }
  }
  
  // Fallback to static data
  return localCarData.find((c) => c.slug === slug) || null;
}

/**
 * Fetch all car slugs for static generation.
 */
async function getAllCarSlugs() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('slug');
      
      if (!error && data && data.length > 0) {
        return data.map(c => ({ slug: c.slug }));
      }
    } catch {
      // Fall through to static data
    }
  }
  
  return localCarData.map(c => ({ slug: c.slug }));
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
