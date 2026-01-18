/**
 * Comparison Service
 * 
 * Handles fetching and managing car comparison pages for SEO.
 * 
 * @module lib/comparisonService
 */

import { supabase, isSupabaseConfigured } from './supabase';

// =============================================================================
// FETCH COMPARISON PAGE
// =============================================================================

/**
 * Fetch a comparison page by slug with full car data
 * 
 * @param {string} slug - Comparison page slug
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function fetchComparisonPage(slug) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Supabase not configured') };
  }

  try {
    // Fetch comparison page
    const { data: comparison, error: comparisonError } = await supabase
      .from('comparison_pages')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (comparisonError) {
      if (comparisonError.code === 'PGRST116') {
        return { data: null, error: null }; // Not found
      }
      return { data: null, error: comparisonError };
    }

    // Fetch the cars being compared
    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select(`
        slug,
        name,
        years,
        tier,
        category,
        engine,
        hp,
        torque,
        trans,
        drivetrain,
        curb_weight,
        zero_to_sixty,
        top_speed,
        quarter_mile,
        price_range,
        price_avg,
        msrp_new_low,
        msrp_new_high,
        score_sound,
        score_interior,
        score_track,
        score_reliability,
        score_value,
        score_driver_fun,
        score_aftermarket,
        defining_strengths,
        honest_weaknesses,
        ideal_buyer,
        image_hero_url
      `)
      .in('slug', comparison.car_slugs);

    if (carsError) {
      return { data: null, error: carsError };
    }

    // Increment view count (fire and forget)
    // Note: Supabase client returns a thenable, use .then() pattern
    supabase.rpc('increment_comparison_views', { p_slug: slug }).then(({ error }) => {
      if (error) console.debug('[ComparisonService] View count increment failed:', error.message);
    });

    return {
      data: {
        ...comparison,
        cars: cars || [],
      },
      error: null,
    };
  } catch (err) {
    console.error('[ComparisonService] Error:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch all published comparison pages for sitemap/index
 * 
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchAllComparisons() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Supabase not configured') };
  }

  try {
    const { data, error } = await supabase
      .from('comparison_pages')
      .select('slug, title, comparison_type, meta_description, car_slugs, view_count, updated_at')
      .eq('is_published', true)
      .order('view_count', { ascending: false });

    if (error) {
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('[ComparisonService] Error:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch comparisons that include a specific car
 * 
 * @param {string} carSlug - Car slug to find comparisons for
 * @param {number} limit - Max results
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchComparisonsForCar(carSlug, limit = 5) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Supabase not configured') };
  }

  try {
    const { data, error } = await supabase.rpc('get_comparisons_for_car', {
      p_car_slug: carSlug,
      p_limit: limit,
    });

    if (error) {
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('[ComparisonService] Error:', err);
    return { data: null, error: err };
  }
}

// =============================================================================
// COMPARISON DATA HELPERS
// =============================================================================

/**
 * Generate a spec comparison table from car data
 * 
 * @param {Array} cars - Array of car objects
 * @returns {Array} Comparison rows with car values
 */
export function generateSpecComparison(cars) {
  if (!cars || cars.length === 0) return [];

  const specs = [
    { key: 'engine', label: 'Engine', format: (v) => v || '—' },
    { key: 'hp', label: 'Horsepower', format: (v) => v ? `${v} hp` : '—' },
    { key: 'torque', label: 'Torque', format: (v) => v ? `${v} lb-ft` : '—' },
    { key: 'trans', label: 'Transmission', format: (v) => v || '—' },
    { key: 'drivetrain', label: 'Drivetrain', format: (v) => v || '—' },
    { key: 'curb_weight', label: 'Curb Weight', format: (v) => v ? `${v.toLocaleString()} lbs` : '—' },
    { key: 'zero_to_sixty', label: '0-60 mph', format: (v) => v ? `${v}s` : '—' },
    { key: 'quarter_mile', label: '1/4 Mile', format: (v) => v ? `${v}s` : '—' },
    { key: 'top_speed', label: 'Top Speed', format: (v) => v ? `${v} mph` : '—' },
    { key: 'price_avg', label: 'Avg. Used Price', format: (v) => v ? `$${v.toLocaleString()}` : '—' },
    { key: 'msrp_new_low', label: 'MSRP (New)', format: (v, car) => {
      if (car.msrp_new_low && car.msrp_new_high) {
        return `$${car.msrp_new_low.toLocaleString()} - $${car.msrp_new_high.toLocaleString()}`;
      }
      return v ? `$${v.toLocaleString()}+` : '—';
    }},
  ];

  return specs.map(spec => ({
    label: spec.label,
    values: cars.map(car => ({
      carSlug: car.slug,
      carName: car.name,
      value: spec.format(car[spec.key], car),
      raw: car[spec.key],
    })),
    // Determine winner for numeric specs (higher is better for most)
    winner: determineWinner(cars, spec.key),
  }));
}

/**
 * Generate a scores comparison from car data
 * 
 * @param {Array} cars - Array of car objects
 * @returns {Array} Score comparison rows
 */
export function generateScoreComparison(cars) {
  if (!cars || cars.length === 0) return [];

  const scores = [
    { key: 'score_driver_fun', label: 'Driver Fun', icon: '🎯' },
    { key: 'score_track', label: 'Track Capability', icon: '🏁' },
    { key: 'score_sound', label: 'Exhaust Note', icon: '🔊' },
    { key: 'score_interior', label: 'Interior Quality', icon: '🪑' },
    { key: 'score_reliability', label: 'Reliability', icon: '🔧' },
    { key: 'score_value', label: 'Value', icon: '💰' },
    { key: 'score_aftermarket', label: 'Aftermarket Support', icon: '⚙️' },
  ];

  return scores.map(score => ({
    label: score.label,
    icon: score.icon,
    values: cars.map(car => ({
      carSlug: car.slug,
      carName: car.name,
      value: car[score.key] || 0,
    })),
    winner: determineWinnerByScore(cars, score.key),
  }));
}

/**
 * Determine winner for a numeric spec (higher is better, except weight)
 */
function determineWinner(cars, key) {
  if (!cars || cars.length < 2) return null;

  const validCars = cars.filter(c => c[key] != null);
  if (validCars.length < 2) return null;

  // Lower is better for these specs
  const lowerIsBetter = ['curb_weight', 'zero_to_sixty', 'quarter_mile', 'price_avg'];
  
  const sorted = [...validCars].sort((a, b) => {
    if (lowerIsBetter.includes(key)) {
      return a[key] - b[key];
    }
    return b[key] - a[key];
  });

  return sorted[0].slug;
}

/**
 * Determine winner for a score (higher is better)
 */
function determineWinnerByScore(cars, key) {
  if (!cars || cars.length < 2) return null;

  const validCars = cars.filter(c => c[key] != null && c[key] > 0);
  if (validCars.length < 2) return null;

  const sorted = [...validCars].sort((a, b) => b[key] - a[key]);
  
  // Only declare winner if there's a clear difference
  if (sorted[0][key] > sorted[1][key]) {
    return sorted[0].slug;
  }
  return null; // Tie
}

/**
 * Get comparison type display info
 */
export function getComparisonTypeInfo(type) {
  const types = {
    head_to_head: {
      label: 'Head-to-Head',
      description: 'Direct comparison of two cars',
      icon: '⚔️',
    },
    three_way: {
      label: 'Three-Way Comparison',
      description: 'Comparing three top options',
      icon: '🔺',
    },
    best_under: {
      label: 'Best Under',
      description: 'Top picks under a price threshold',
      icon: '💵',
    },
    best_for: {
      label: 'Best For',
      description: 'Top picks for a specific use case',
      icon: '🎯',
    },
    alternatives: {
      label: 'Alternatives',
      description: 'Similar options to consider',
      icon: '🔄',
    },
  };

  return types[type] || types.head_to_head;
}

// =============================================================================
// ADMIN FUNCTIONS
// =============================================================================

/**
 * Update comparison page content (admin only)
 * 
 * @param {string} slug - Comparison slug
 * @param {Object} updates - Fields to update
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateComparisonPage(slug, updates) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Supabase not configured') };
  }

  try {
    const { data, error } = await supabase
      .from('comparison_pages')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('slug', slug)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('[ComparisonService] Error:', err);
    return { data: null, error: err };
  }
}

/**
 * Publish a comparison page
 * 
 * @param {string} slug - Comparison slug
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function publishComparisonPage(slug) {
  return updateComparisonPage(slug, {
    is_published: true,
    published_at: new Date().toISOString(),
  });
}

