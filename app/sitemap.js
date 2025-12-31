/**
 * Dynamic Sitemap Generation for SEO
 * 
 * Generates sitemap.xml at /sitemap.xml including:
 * - Static pages (home, browse, car selector, etc.)
 * - All car detail pages (from cars table via carsClient)
 * - Event pages (from events table)
 * - Encyclopedia topics (from static data)
 * 
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */

import { fetchCars } from '@/lib/carsClient';
import { createClient } from '@supabase/supabase-js';
import { getNavigationTree } from '@/lib/encyclopediaData';

const SITE_URL = 'https://autorev.app';

// Supabase client for fetching dynamic data (events only)
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Fetch all car slugs from database via carsClient.
 * @returns {Promise<Array>}
 */
async function fetchCarSlugs() {
  try {
    const cars = await fetchCars();
    return cars.map(c => ({ slug: c.slug }));
  } catch (err) {
    console.warn('[Sitemap] Error fetching cars:', err.message);
    return [];
  }
}

/**
 * Fetch approved events from database.
 * @returns {Promise<Array>}
 */
async function fetchEvents() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('events')
      .select('slug, updated_at')
      .eq('status', 'approved')
      .gte('start_date', new Date().toISOString().split('T')[0])
      .order('start_date', { ascending: true })
      .limit(500);

    if (error) {
      console.warn('[Sitemap] Error fetching events:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn('[Sitemap] Error fetching events:', err.message);
    return [];
  }
}

/**
 * Get encyclopedia topic slugs from navigation tree.
 * @returns {Array<string>}
 */
function getEncyclopediaTopics() {
  try {
    const navTree = getNavigationTree();
    const topics = [];

    // Traverse the navigation tree to get all topic keys
    function collectTopicKeys(items, depth = 0) {
      for (const item of items) {
        // Include items that look like navigable topics
        if (item.key && !item.key.includes('automotive') && 
            !item.key.includes('modifications') && 
            !item.key.includes('guides')) {
          topics.push(item.key);
        }
        if (item.children && item.children.length > 0) {
          collectTopicKeys(item.children, depth + 1);
        }
      }
    }

    collectTopicKeys(navTree);
    return topics;
  } catch (err) {
    console.warn('[Sitemap] Error getting encyclopedia topics:', err.message);
    return [];
  }
}

export default async function sitemap() {
  const now = new Date();

  // ==========================================================================
  // STATIC PAGES
  // ==========================================================================
  const staticPages = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/browse-cars`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/car-selector`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/community`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/community/events`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/join`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/tuning-shop`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/encyclopedia`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/garage`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/mod-planner`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/events/submit`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    // AL - AI Assistant (key feature page)
    {
      url: `${SITE_URL}/al`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Feature landing pages
    {
      url: `${SITE_URL}/features/ask-al`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/features/browse-cars`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/features/own`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/features/build`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/features/connect`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/features/learn`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/features/car-selector`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // ==========================================================================
  // CAR DETAIL PAGES (from database)
  // ==========================================================================
  const cars = await fetchCarSlugs();
  const carPages = cars.map((car) => ({
    url: `${SITE_URL}/browse-cars/${car.slug}`,
    lastModified: car.updated_at ? new Date(car.updated_at) : now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // ==========================================================================
  // EVENT PAGES (from database)
  // ==========================================================================
  const events = await fetchEvents();
  const eventPages = events.map((event) => ({
    url: `${SITE_URL}/community/events/${event.slug}`,
    lastModified: event.updated_at ? new Date(event.updated_at) : now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // ==========================================================================
  // ENCYCLOPEDIA TOPIC PAGES
  // ==========================================================================
  const encyclopediaTopics = getEncyclopediaTopics();
  const encyclopediaPages = encyclopediaTopics.map((topicKey) => ({
    url: `${SITE_URL}/encyclopedia?topic=${encodeURIComponent(topicKey)}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  // ==========================================================================
  // COMBINE ALL PAGES
  // ==========================================================================
  const allPages = [
    ...staticPages,
    ...carPages,
    ...eventPages,
    ...encyclopediaPages,
  ];

  console.log(`[Sitemap] Generated: ${staticPages.length} static, ${carPages.length} cars, ${eventPages.length} events, ${encyclopediaPages.length} encyclopedia topics`);

  return allPages;
}
