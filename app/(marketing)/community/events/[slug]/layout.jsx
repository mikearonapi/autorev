/**
 * Event Detail Layout - SEO Metadata
 * 
 * Provides dynamic metadata for event detail pages since the main page is a client component.
 * Includes Event schema.org structured data for rich search results.
 * 
 * URL: /community/events/[slug]
 */

import SchemaOrg from '@/components/SchemaOrg';
import { generateEventMetadata, generateEventSchema, generateBreadcrumbSchema, SITE_URL } from '@/lib/seoUtils';
import { supabase } from '@/lib/supabase';

/**
 * Fetch event data for metadata generation
 */
async function fetchEvent(slug) {
  if (!slug || !supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        id,
        slug,
        name,
        description,
        event_type:event_types(id, name, slug),
        start_date,
        end_date,
        start_time,
        end_time,
        timezone,
        venue_name,
        address,
        city,
        state,
        zip,
        country,
        latitude,
        longitude,
        source_url,
        source_name,
        registration_url,
        image_url,
        cost_text,
        is_free,
        featured,
        status
      `)
      .eq('slug', slug)
      .eq('status', 'approved')
      .single();

    if (error || !data) return null;
    return data;
  } catch (err) {
    console.error('[EventLayout] Error fetching event:', err);
    return null;
  }
}

/**
 * Generate dynamic metadata for each event page
 */
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const event = await fetchEvent(slug);

  if (!event) {
    return {
      title: 'Event Not Found | AutoRev',
      description: 'The requested event could not be found.',
      robots: { index: false, follow: false },
    };
  }

  // Use the seoUtils helper for consistent metadata
  const baseMetadata = generateEventMetadata(event);
  
  // Format date for display
  const dateStr = event.start_date 
    ? new Date(event.start_date + 'T00:00:00').toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      })
    : '';
  
  const location = [event.city, event.state].filter(Boolean).join(', ');
  const eventType = event.event_type?.name || 'Car Event';
  const twitterDescription = `${eventType} in ${location || 'your area'}${dateStr ? ` on ${dateStr}` : ''}. ${event.description?.substring(0, 100) || `Join us for ${event.name}`}`;
  
  // Enhance with additional fields including explicit Twitter tags
  return {
    ...baseMetadata,
    // Explicit Twitter Card tags for better social sharing
    twitter: {
      card: 'summary_large_image',
      title: `${event.name}${dateStr ? ` - ${dateStr}` : ''} | AutoRev`,
      description: twitterDescription.substring(0, 200),
      images: event.image_url ? [event.image_url] : undefined,
    },
    // Ensure proper indexing for public events
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Layout component that injects Event schema
 */
export default async function EventDetailLayout({ children, params }) {
  const { slug } = await params;
  const event = await fetchEvent(slug);

  // Generate schemas
  const schemas = [];
  
  // Event schema for rich results
  if (event) {
    const eventSchema = generateEventSchema(event);
    if (eventSchema) schemas.push(eventSchema);
    
    // Breadcrumb schema for navigation
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Community', url: '/community' },
      { name: 'Events', url: '/community/events' },
      { name: event.name, url: `/community/events/${slug}` },
    ]);
    schemas.push(breadcrumbSchema);
  }

  return (
    <>
      {schemas.length > 0 && <SchemaOrg schemas={schemas} />}
      {children}
    </>
  );
}
