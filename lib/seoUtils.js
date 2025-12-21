/**
 * AutoRev SEO Utilities
 * 
 * Shared SEO helper functions for generating metadata, structured data,
 * canonical URLs, and Open Graph content across all pages.
 * 
 * Usage:
 *   import { generatePageMetadata, generateBreadcrumbSchema } from '@/lib/seoUtils';
 * 
 * @module seoUtils
 */

// =============================================================================
// CONSTANTS
// =============================================================================

export const SITE_URL = 'https://autorev.app';
export const SITE_NAME = 'AutoRev';
export const DEFAULT_DESCRIPTION = 'Find your perfect sports car, plan performance builds with purpose, and join a community that values mastery over materialism.';
export const TWITTER_HANDLE = '@autorev';

// =============================================================================
// CANONICAL URL HELPERS
// =============================================================================

/**
 * Generate an absolute canonical URL from a relative path.
 * @param {string} path - Relative path (e.g., '/browse-cars/718-cayman-gt4')
 * @returns {string} - Absolute URL
 */
export function getCanonicalUrl(path = '') {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}

// =============================================================================
// METADATA GENERATORS
// =============================================================================

/**
 * Generate standard page metadata for Next.js App Router.
 * 
 * @param {Object} options
 * @param {string} options.title - Page title (without site name suffix)
 * @param {string} options.description - Page description (max 160 chars)
 * @param {string} options.path - Relative URL path
 * @param {string[]} [options.keywords] - Additional keywords
 * @param {string} [options.ogType='website'] - OpenGraph type
 * @param {string} [options.ogImage] - Custom OG image URL (absolute)
 * @param {boolean} [options.noIndex=false] - Set to true for private pages
 * @returns {Object} - Next.js metadata object
 */
export function generatePageMetadata({
  title,
  description,
  path,
  keywords = [],
  ogType = 'website',
  ogImage,
  noIndex = false,
}) {
  const fullTitle = title; // Template in root layout adds " | AutoRev"
  const canonicalUrl = getCanonicalUrl(path);
  const truncatedDescription = description?.length > 160 
    ? description.substring(0, 157) + '...' 
    : description;

  const metadata = {
    title: fullTitle,
    description: truncatedDescription,
    keywords: [...keywords],
    openGraph: {
      title: fullTitle,
      description: truncatedDescription,
      url: canonicalUrl,
      type: ogType,
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: truncatedDescription,
      site: TWITTER_HANDLE,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };

  // Add custom OG image if provided
  if (ogImage) {
    metadata.openGraph.images = [
      {
        url: ogImage.startsWith('http') ? ogImage : getCanonicalUrl(ogImage),
        width: 1200,
        height: 630,
        alt: title,
      },
    ];
    metadata.twitter.images = [ogImage.startsWith('http') ? ogImage : getCanonicalUrl(ogImage)];
  }

  // Add noindex for private pages
  if (noIndex) {
    metadata.robots = {
      index: false,
      follow: false,
    };
  }

  return metadata;
}

/**
 * Generate metadata for a car detail page.
 * 
 * @param {Object} car - Car object from database
 * @returns {Object} - Next.js metadata object
 */
export function generateCarMetadata(car) {
  if (!car) {
    return {
      title: 'Car Not Found',
      description: 'The requested car could not be found.',
    };
  }

  const yearRange = car.years || '';
  const priceRange = car.priceRange || car.price || '';
  const hp = car.hp ? `${car.hp} HP` : '';
  
  const title = `${car.name} - Specs, Reviews & Pricing`;
  const description = `Complete guide to the ${car.name}${yearRange ? ` (${yearRange})` : ''}. ${hp ? `${hp}. ` : ''}${priceRange ? `Price: ${priceRange}. ` : ''}Performance scores, ownership costs, known issues, and expert reviews.`;

  const keywords = [
    car.name,
    car.brand,
    `${car.brand} ${car.model || ''}`.trim(),
    `${car.name} review`,
    `${car.name} specs`,
    `${car.name} buying guide`,
    'sports car',
    'performance car',
  ].filter(Boolean);

  return generatePageMetadata({
    title,
    description,
    path: `/browse-cars/${car.slug}`,
    keywords,
    ogType: 'website', // Could use 'article' for more detailed pages
  });
}

/**
 * Generate metadata for an event detail page.
 * 
 * @param {Object} event - Event object from database
 * @returns {Object} - Next.js metadata object
 */
export function generateEventMetadata(event) {
  if (!event) {
    return {
      title: 'Event Not Found',
      description: 'The requested event could not be found.',
    };
  }

  const dateStr = event.start_date 
    ? new Date(event.start_date + 'T00:00:00').toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      })
    : '';
  
  const location = [event.city, event.state].filter(Boolean).join(', ');
  const eventType = event.event_type?.name || 'Car Event';
  
  const title = `${event.name}${dateStr ? ` - ${dateStr}` : ''}`;
  const description = `${eventType} in ${location || 'your area'}. ${event.description?.substring(0, 100) || `Join us for ${event.name}`}...`;

  const keywords = [
    event.name,
    eventType,
    'car event',
    'automotive event',
    location,
    event.venue_name,
    'cars and coffee',
    'car show',
  ].filter(Boolean);

  return generatePageMetadata({
    title,
    description,
    path: `/community/events/${event.slug}`,
    keywords,
    ogType: 'article',
    ogImage: event.image_url,
  });
}

// =============================================================================
// SCHEMA.ORG STRUCTURED DATA GENERATORS
// =============================================================================

/**
 * Generate Organization schema (site-wide).
 * @returns {Object}
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/apple-icon`,
    description: 'Sports car research, performance builds, and an enthusiast community built on excellence over ego.',
    sameAs: [
      'https://instagram.com/autorev',
      'https://youtube.com/@autorev',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'contact@autorev.app',
    },
  };
}

/**
 * Generate WebSite schema with SearchAction.
 * @returns {Object}
 */
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/car-selector?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate BreadcrumbList schema.
 * 
 * @param {Array<{name: string, url: string}>} items - Breadcrumb items
 * @returns {Object}
 */
export function generateBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : getCanonicalUrl(item.url),
    })),
  };
}

/**
 * Generate Vehicle schema for a car detail page.
 * Uses schema.org/Vehicle and schema.org/Car types.
 * 
 * @param {Object} car - Car object from database
 * @returns {Object}
 */
export function generateVehicleSchema(car) {
  if (!car) return null;

  // Parse year range to get model year
  const yearMatch = car.years?.match(/(\d{4})/);
  const modelYear = yearMatch ? yearMatch[1] : undefined;

  // Parse price to number
  const priceMatch = car.priceRange?.match(/\$?([\d,]+)/);
  const priceValue = priceMatch ? priceMatch[1].replace(/,/g, '') : undefined;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: car.name,
    brand: {
      '@type': 'Brand',
      name: car.brand,
    },
    model: car.model || car.name,
    vehicleConfiguration: car.category, // Mid-Engine, Front-Engine, etc.
    url: getCanonicalUrl(`/browse-cars/${car.slug}`),
  };

  // Add optional fields if present
  if (modelYear) {
    schema.modelDate = modelYear;
    schema.vehicleModelDate = modelYear;
  }

  if (car.hp) {
    schema.vehicleEngine = {
      '@type': 'EngineSpecification',
      enginePower: {
        '@type': 'QuantitativeValue',
        value: car.hp,
        unitCode: 'HP',
      },
    };
    if (car.engine) {
      schema.vehicleEngine.name = car.engine;
    }
    if (car.torque) {
      schema.vehicleEngine.torque = {
        '@type': 'QuantitativeValue',
        value: car.torque,
        unitCode: 'LBF',
      };
    }
  }

  if (car.trans) {
    schema.vehicleTransmission = car.trans;
  }

  if (car.drivetrain) {
    schema.driveWheelConfiguration = car.drivetrain;
  }

  if (car.zeroToSixty) {
    schema.accelerationTime = {
      '@type': 'QuantitativeValue',
      value: car.zeroToSixty,
      unitCode: 'SEC',
      description: '0-60 mph',
    };
  }

  if (priceValue) {
    schema.offers = {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: priceValue,
      offerCount: 1,
      availability: 'https://schema.org/InStock',
    };
  }

  if (car.notes || car.essence) {
    schema.description = car.essence || car.notes;
  }

  // Add image if available
  if (car.image_url || car.primaryImage) {
    schema.image = car.image_url || car.primaryImage;
  }

  return schema;
}

/**
 * Generate Event schema for an event detail page.
 * 
 * @param {Object} event - Event object from database
 * @returns {Object}
 */
export function generateEventSchema(event) {
  if (!event) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description || `Car event: ${event.name}`,
    url: getCanonicalUrl(`/community/events/${event.slug}`),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  };

  // Add date/time
  if (event.start_date) {
    const startDateTime = event.start_time 
      ? `${event.start_date}T${event.start_time}`
      : `${event.start_date}T00:00:00`;
    schema.startDate = startDateTime;
  }

  if (event.end_date) {
    const endDateTime = event.end_time 
      ? `${event.end_date}T${event.end_time}`
      : `${event.end_date}T23:59:59`;
    schema.endDate = endDateTime;
  } else if (event.start_date && event.end_time) {
    schema.endDate = `${event.start_date}T${event.end_time}`;
  }

  // Add location
  if (event.venue_name || event.city) {
    schema.location = {
      '@type': 'Place',
      name: event.venue_name || `${event.city}, ${event.state}`,
      address: {
        '@type': 'PostalAddress',
        streetAddress: event.address,
        addressLocality: event.city,
        addressRegion: event.state,
        postalCode: event.zip,
        addressCountry: event.country || 'US',
      },
    };

    // Add geo coordinates if available
    if (event.latitude && event.longitude) {
      schema.location.geo = {
        '@type': 'GeoCoordinates',
        latitude: event.latitude,
        longitude: event.longitude,
      };
    }
  }

  // Add image
  if (event.image_url) {
    schema.image = event.image_url;
  }

  // Add organizer
  if (event.source_name) {
    schema.organizer = {
      '@type': 'Organization',
      name: event.source_name,
      url: event.source_url,
    };
  }

  // Add offers (free/paid)
  if (event.is_free) {
    schema.isAccessibleForFree = true;
  } else if (event.cost_text) {
    schema.offers = {
      '@type': 'Offer',
      description: event.cost_text,
      url: event.registration_url || event.source_url,
    };
  }

  return schema;
}

/**
 * Generate ItemList schema for browse pages (cars, events).
 * 
 * @param {Object} options
 * @param {string} options.name - List name
 * @param {string} options.description - List description
 * @param {Array<{name: string, url: string, position?: number}>} options.items
 * @returns {Object}
 */
export function generateItemListSchema({ name, description, items }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    description,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: item.position || index + 1,
      name: item.name,
      url: item.url.startsWith('http') ? item.url : getCanonicalUrl(item.url),
    })),
  };
}

/**
 * Generate Article schema for encyclopedia/educational content.
 * 
 * @param {Object} options
 * @param {string} options.title - Article title
 * @param {string} options.description - Article description/summary
 * @param {string} options.path - URL path
 * @param {string} [options.datePublished] - ISO date string
 * @param {string} [options.dateModified] - ISO date string
 * @param {string[]} [options.keywords] - Article keywords
 * @returns {Object}
 */
export function generateArticleSchema({
  title,
  description,
  path,
  datePublished,
  dateModified,
  keywords = [],
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url: getCanonicalUrl(path),
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/apple-icon`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': getCanonicalUrl(path),
    },
  };

  if (datePublished) {
    schema.datePublished = datePublished;
  }

  if (dateModified) {
    schema.dateModified = dateModified;
  }

  if (keywords.length > 0) {
    schema.keywords = keywords.join(', ');
  }

  return schema;
}

/**
 * Generate FAQPage schema from question/answer pairs.
 * 
 * @param {Array<{question: string, answer: string}>} faqs
 * @returns {Object}
 */
export function generateFAQSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate WebApplication schema for interactive tools (car selector, tuning shop).
 * 
 * @param {Object} options
 * @param {string} options.name - Application name
 * @param {string} options.description - Application description
 * @param {string} options.path - URL path
 * @param {string} [options.applicationCategory='AutomotiveApplication']
 * @returns {Object}
 */
export function generateWebApplicationSchema({
  name,
  description,
  path,
  applicationCategory = 'AutomotiveApplication',
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    description,
    url: getCanonicalUrl(path),
    applicationCategory,
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

// =============================================================================
// HELPER TO SERIALIZE SCHEMA FOR INJECTION
// =============================================================================

/**
 * Serialize schema object(s) to JSON string for script injection.
 * Handles both single schemas and arrays.
 * 
 * @param {Object|Object[]} schema - Schema object or array of schemas
 * @returns {string} - JSON string
 */
export function serializeSchema(schema) {
  return JSON.stringify(schema, null, 0);
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default {
  SITE_URL,
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  TWITTER_HANDLE,
  getCanonicalUrl,
  generatePageMetadata,
  generateCarMetadata,
  generateEventMetadata,
  generateOrganizationSchema,
  generateWebsiteSchema,
  generateBreadcrumbSchema,
  generateVehicleSchema,
  generateEventSchema,
  generateItemListSchema,
  generateArticleSchema,
  generateFAQSchema,
  generateWebApplicationSchema,
  serializeSchema,
};












