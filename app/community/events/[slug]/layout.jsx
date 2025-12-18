/**
 * Event Detail Page Layout - SEO Metadata + Structured Data
 * 
 * URL: /community/events/[slug]
 * 
 * Provides:
 * - Dynamic metadata for each event (title, description, Open Graph, Twitter)
 * - Event schema (schema.org/Event)
 * - BreadcrumbList schema for navigation
 */

import { createClient } from '@supabase/supabase-js';
import SchemaOrg from '@/components/SchemaOrg';
import { 
  generateEventMetadata, 
  generateEventSchema, 
  generateBreadcrumbSchema,
} from '@/lib/seoUtils';

/**
 * Create a Supabase client for server-side data fetching.
 */
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Fetch event by slug from database.
 * @param {string} slug
 * @returns {Promise<Object|null>}
 */
async function fetchEvent(slug) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        event_type:event_types(slug, name, description, icon, is_track_event)
      `)
      .eq('slug', slug)
      .eq('status', 'approved')
      .single();

    if (error) {
      console.warn('[EventLayout] Error fetching event:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.warn('[EventLayout] Error fetching event:', err.message);
    return null;
  }
}

/**
 * Generate dynamic metadata for event pages.
 */
export async function generateMetadata({ params }) {
  const { slug } = params;
  const event = await fetchEvent(slug);
  
  if (!event) {
    return {
      title: 'Event Not Found',
      description: 'The requested event could not be found.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return generateEventMetadata(event);
}

/**
 * Event Detail Layout Component
 * Wraps children with structured data for SEO.
 */
export default async function EventDetailLayout({ children, params }) {
  const { slug } = params;
  const event = await fetchEvent(slug);

  // Generate structured data schemas
  const eventSchema = event ? generateEventSchema(event) : null;
  
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Community', url: '/community' },
    { name: 'Events', url: '/community/events' },
    { name: event?.name || 'Event', url: `/community/events/${slug}` },
  ]);

  // Collect all valid schemas
  const schemas = [breadcrumbSchema, eventSchema].filter(Boolean);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <SchemaOrg schemas={schemas} />
      {children}
    </>
  );
}



