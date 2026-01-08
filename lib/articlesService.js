/**
 * Articles Service
 * 
 * Handles fetching and managing AL articles across all categories:
 * - comparisons: Comparisons & Buyer Guides
 * - enthusiast: Car Industry/Culture
 * - technical: Modification/Technical Guides
 * 
 * @module lib/articlesService
 */

import { supabase, isSupabaseConfigured } from './supabase';

// =============================================================================
// CATEGORY DEFINITIONS
// =============================================================================

// SVG icon identifiers for professional styling (rendered as components in UI)
export const ARTICLE_CATEGORIES = {
  comparisons: {
    id: 'comparisons',
    name: 'Comparisons & Buyer Guides',
    shortName: 'Comparisons',
    description: 'Side-by-side comparisons and buying guides to help you find the perfect car.',
    iconId: 'scale',
    persona: 'Car Search',
    subcategories: {
      head_to_head: { name: 'Head-to-Head', iconId: 'swords' },
      three_way: { name: 'Multi-Car Showdowns', iconId: 'trophy' },
      best_under: { name: 'Best Under', iconId: 'dollar' },
      best_for: { name: 'Best For', iconId: 'target' },
      alternatives: { name: 'Alternatives', iconId: 'refresh' },
      buyer_guide: { name: 'Buyer Guides', iconId: 'clipboard' },
    },
  },
  enthusiast: {
    id: 'enthusiast',
    name: 'Enthusiast',
    shortName: 'Enthusiast',
    description: 'Car culture, history, events, and community stories.',
    iconId: 'flag',
    persona: 'My Garage',
    subcategories: {
      news: { name: 'News', iconId: 'newspaper' },
      culture: { name: 'Car Culture', iconId: 'sparkles' },
      history: { name: 'History', iconId: 'book' },
      events: { name: 'Events', iconId: 'calendar' },
      community: { name: 'Community', iconId: 'users' },
    },
  },
  technical: {
    id: 'technical',
    name: 'Technical & Mods',
    shortName: 'Technical',
    description: 'Modification guides, how-tos, dyno results, and maintenance tips.',
    iconId: 'wrench',
    persona: 'Tuning Shop',
    subcategories: {
      mod_guide: { name: 'Mod Guides', iconId: 'book-open' },
      how_to: { name: 'How-To', iconId: 'tool' },
      dyno_results: { name: 'Dyno Results', iconId: 'chart' },
      maintenance: { name: 'Maintenance', iconId: 'cog' },
      troubleshooting: { name: 'Troubleshooting', iconId: 'search' },
    },
  },
  pitlane: {
    id: 'pitlane',
    name: 'Pit Lane',
    shortName: 'Pit Lane',
    description: 'Light-hearted takes, satire, and entertainment for car enthusiasts who don\'t take themselves too seriously.',
    iconId: 'sparkles',
    persona: 'Community',
    subcategories: {
      satire: { name: 'Satire', iconId: 'sparkles' },
      trash_talk: { name: 'Car Banter', iconId: 'chat' },
      survival_guides: { name: 'Survival Guides', iconId: 'shield' },
      listicles: { name: 'Top Lists', iconId: 'list' },
      memes: { name: 'Car Culture LOLs', iconId: 'smile' },
    },
  },
};

// =============================================================================
// FETCH ARTICLES
// =============================================================================

/**
 * Fetch articles with optional filtering
 * 
 * @param {Object} options - Query options
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchArticles(options = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Database not configured') };
  }

  const {
    category = null,
    subcategory = null,
    carSlug = null,
    featuredOnly = false,
    limit = 20,
    offset = 0,
  } = options;

  try {
    const { data, error } = await supabase.rpc('get_al_articles', {
      p_category: category,
      p_subcategory: subcategory,
      p_car_slug: carSlug,
      p_featured_only: featuredOnly,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('[ArticlesService] Error:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch a single article by slug
 * 
 * @param {string} slug - Article slug
 * @param {string} category - Article category (optional, for validation)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function fetchArticleBySlug(slug, category = null) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Database not configured') };
  }

  try {
    const { data, error } = await supabase.rpc('get_al_article_by_slug', {
      p_slug: slug,
      p_category: category,
    });

    if (error) {
      return { data: null, error };
    }

    if (!data || data.length === 0) {
      return { data: null, error: null };
    }

    const result = data[0];
    return {
      data: {
        ...result.article,
        comparisonData: result.comparison_data,
      },
      error: null,
    };
  } catch (err) {
    console.error('[ArticlesService] Error:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch article counts by category
 * 
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function fetchArticleCounts() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Database not configured') };
  }

  try {
    const { data, error } = await supabase.rpc('get_article_counts');

    if (error) {
      return { data: null, error };
    }

    // Convert to object
    const counts = {
      comparisons: 0,
      enthusiast: 0,
      technical: 0,
      pitlane: 0,
      total: 0,
    };

    (data || []).forEach(row => {
      counts[row.category] = parseInt(row.count);
      counts.total += parseInt(row.count);
    });

    return { data: counts, error: null };
  } catch (err) {
    console.error('[ArticlesService] Error:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch related articles for a given article
 * 
 * @param {string} articleId - Article UUID
 * @param {string} category - Article category (for same-category suggestions)
 * @param {number} limit - Max articles to return
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchRelatedArticles(articleId, category = null, limit = 4) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Database not configured') };
  }

  try {
    const { data, error } = await supabase.rpc('get_related_articles', {
      p_article_id: articleId,
      p_category: category,
      p_limit: limit,
    });

    if (error) {
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('[ArticlesService] Error:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch featured articles across all categories
 * 
 * @param {number} limit - Max articles per category
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function fetchFeaturedArticles(limit = 4) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Database not configured') };
  }

  try {
    const { data, error } = await supabase
      .from('al_articles')
      .select('*')
      .eq('is_published', true)
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('[ArticlesService] Error:', err);
    return { data: null, error: err };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get category info by ID
 */
export function getCategoryInfo(categoryId) {
  return ARTICLE_CATEGORIES[categoryId] || null;
}

/**
 * Get subcategory info
 */
export function getSubcategoryInfo(categoryId, subcategoryId) {
  const category = ARTICLE_CATEGORIES[categoryId];
  if (!category) return null;
  return category.subcategories[subcategoryId] || null;
}

/**
 * Generate article URL
 */
export function getArticleUrl(article) {
  return `/articles/${article.category}/${article.slug}`;
}

/**
 * Generate category URL
 */
export function getCategoryUrl(categoryId) {
  return `/articles/${categoryId}`;
}

/**
 * Format read time
 */
export function formatReadTime(minutes) {
  if (!minutes) return '3 min read';
  return `${minutes} min read`;
}

/**
 * Get all articles for sitemap
 */
export async function getAllArticleSlugs() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Database not configured') };
  }

  try {
    const { data, error } = await supabase
      .from('al_articles')
      .select('slug, category, updated_at')
      .eq('is_published', true);

    if (error) {
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('[ArticlesService] Error:', err);
    return { data: null, error: err };
  }
}

