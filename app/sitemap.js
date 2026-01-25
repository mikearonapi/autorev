/**
 * Dynamic Sitemap Generation for SEO
 * 
 * Generates sitemap.xml at /sitemap.xml including:
 * - Homepage
 * - Legal pages (terms, privacy, contact)
 * - Public community builds gallery
 * - Public community events listing
 * - Individual build detail pages (dynamic)
 * - Individual event detail pages (dynamic)
 * 
 * NOTE: App pages (/garage, /data, /community, /al, /profile) are auth-protected
 * and should NOT be in the sitemap as Google cannot crawl them.
 * 
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */

import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://autorev.app';

// Supabase client for fetching dynamic data
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
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
 * Fetch all public community builds for sitemap inclusion.
 * These are user-shared builds that help with SEO.
 * @returns {Promise<Array>}
 */
async function fetchPublicBuilds() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('community_posts')
      .select('slug, updated_at, published_at')
      .eq('is_published', true)
      .eq('post_type', 'build')
      .order('published_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.warn('[Sitemap] Error fetching public builds:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn('[Sitemap] Error fetching public builds:', err.message);
    return [];
  }
}

export default async function sitemap() {
  const now = new Date();

  // ==========================================================================
  // STATIC PAGES - Only public, crawlable pages
  // ==========================================================================
  const staticPages = [
    // Homepage
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    
    // Public community pages
    {
      url: `${SITE_URL}/community/builds`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    
    // Legal/Utility pages
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
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
  ];

  // ==========================================================================
  // EVENT DETAIL PAGES (from database)
  // ==========================================================================
  const events = await fetchEvents();
  const eventPages = events.map((event) => ({
    url: `${SITE_URL}/community/events/${event.slug}`,
    lastModified: event.updated_at ? new Date(event.updated_at) : now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // ==========================================================================
  // PUBLIC COMMUNITY BUILDS (user-shared builds for SEO)
  // ==========================================================================
  const publicBuilds = await fetchPublicBuilds();
  const buildPages = publicBuilds.map((build) => ({
    url: `${SITE_URL}/community/builds/${build.slug}`,
    lastModified: build.updated_at ? new Date(build.updated_at) : (build.published_at ? new Date(build.published_at) : now),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // ==========================================================================
  // COMBINE ALL PAGES
  // ==========================================================================
  const allPages = [
    ...staticPages,
    ...eventPages,
    ...buildPages,
  ];

  console.log(`[Sitemap] Generated: ${staticPages.length} static, ${eventPages.length} events, ${buildPages.length} public builds`);
  console.log(`[Sitemap] Total URLs: ${allPages.length}`);

  return allPages;
}
