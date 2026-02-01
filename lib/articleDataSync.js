/**
 * Article Data Sync Service
 *
 * Ensures AL Articles align with database content and car selector algorithms.
 * Articles should recommend the SAME cars that the car finder recommends
 * with equivalent filters applied.
 *
 * Key Principle: Articles are VIEWS of database data, not independent content.
 *
 * @module lib/articleDataSync
 */

import { createClient } from '@supabase/supabase-js';

import { calculateWeightedScore, DEFAULT_WEIGHTS, ENTHUSIAST_WEIGHTS } from './scoring.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// =============================================================================
// ARTICLE TYPE DEFINITIONS
// =============================================================================

/**
 * Maps article types to their data requirements
 */
const _ARTICLE_DATA_REQUIREMENTS = {
  // Budget articles: "Best Sports Cars Under $X"
  budget: {
    queryType: 'price_filter',
    weights: DEFAULT_WEIGHTS, // Default weights = balanced
    limit: 10,
    sortBy: 'score',
    priceField: 'msrp', // Use MSRP
  },

  // Head-to-head: "Car A vs Car B"
  head_to_head: {
    queryType: 'specific_cars',
    weights: DEFAULT_WEIGHTS,
    includeComparison: true,
  },

  // Three-way: "Car A vs Car B vs Car C"
  three_way: {
    queryType: 'specific_cars',
    weights: DEFAULT_WEIGHTS,
    includeComparison: true,
  },

  // Best for category: "Best Track Cars", "Best JDM Cars"
  best_for: {
    queryType: 'category_filter',
    weights: DEFAULT_WEIGHTS,
    limit: 10,
  },

  // Technical: Uses car data for specifications
  technical: {
    queryType: 'example_cars',
    weights: ENTHUSIAST_WEIGHTS,
    limit: 5,
  },
};

// =============================================================================
// PRICE TIER MAPPINGS
// =============================================================================

/**
 * Standard price tiers used in articles and car selector
 * These should match what users see in the UI
 */
const PRICE_TIERS = [
  { key: 'under_30k', label: 'Under $30,000', max: 30000, min: 0 },
  { key: 'under_40k', label: 'Under $40,000', max: 40000, min: 0 },
  { key: 'under_50k', label: 'Under $50,000', max: 50000, min: 0 },
  { key: 'under_75k', label: 'Under $75,000', max: 75000, min: 0 },
  { key: 'under_100k', label: 'Under $100,000', max: 100000, min: 0 },
  { key: '30_to_50k', label: '$30,000 - $50,000', max: 50000, min: 30000 },
  { key: '50_to_75k', label: '$50,000 - $75,000', max: 75000, min: 50000 },
  { key: '75_to_100k', label: '$75,000 - $100,000', max: 100000, min: 75000 },
];

// =============================================================================
// CORE QUERY FUNCTIONS
// =============================================================================

/**
 * Get the supabase client (server-side only)
 */
function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

/**
 * Calculate weighted score from database row
 * Database uses score_* columns (snake_case), not camelCase
 */
function calculateWeightedScoreFromDB(car, weights = {}) {
  const defaultWeights = {
    sound: 1,
    interior: 1,
    track: 1,
    reliability: 1,
    value: 1,
    driverFun: 1,
    aftermarket: 1,
  };
  const w = { ...defaultWeights, ...weights };

  return (
    (parseFloat(car.score_sound) || 0) * w.sound +
    (parseFloat(car.score_interior) || 0) * w.interior +
    (parseFloat(car.score_track) || 0) * w.track +
    (parseFloat(car.score_reliability) || 0) * w.reliability +
    (parseFloat(car.score_value) || 0) * w.value +
    (parseFloat(car.score_driver_fun) || 0) * w.driverFun +
    (parseFloat(car.score_aftermarket) || 0) * w.aftermarket
  );
}

/**
 * Get top cars under a price threshold using the SAME algorithm as car selector
 *
 * @param {number} maxPrice - Maximum price (market/used value)
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Sorted array of top cars
 */
export async function getTopCarsUnderPrice(maxPrice, options = {}) {
  const { minPrice = 0, weights = DEFAULT_WEIGHTS, limit = 10, includeScores = true } = options;

  const supabase = getSupabase();

  // Column selections for article generation - needs scoring columns
  const CAR_COLS =
    'id, slug, name, year_start, year_end, make, model, country_of_origin, hp, hp_range, torque, acceleration_0_60, top_speed, engine_layout, drive_type, transmission, msrp, price_low, price_high, track, sound, reliability, value, aftermarket, daily, tuning_potential, fun, image_url, created_at';

  // Query cars within price range
  const { data: cars, error } = await supabase
    .from('cars')
    .select(CAR_COLS)
    .gte('msrp', minPrice)
    .lte('msrp', maxPrice)
    .not('msrp', 'is', null);

  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }

  if (!cars || cars.length === 0) {
    return [];
  }

  // Apply the SAME scoring algorithm used in car selector
  // Use calculateWeightedScoreFromDB for database rows
  const scoredCars = cars.map((car) => ({
    ...car,
    total: calculateWeightedScoreFromDB(car, weights),
  }));

  // Sort by weighted score (descending) - same as car selector
  scoredCars.sort((a, b) => b.total - a.total);

  // Return top N
  const topCars = scoredCars.slice(0, limit);

  if (includeScores) {
    return topCars.map((car) => ({
      ...car,
      displayScore: car.total.toFixed(1),
      maxScore: Object.values(weights)
        .reduce((sum, w) => sum + 10 * w, 0)
        .toFixed(1),
    }));
  }

  return topCars;
}

/**
 * Get specific cars by slug for comparison articles
 */
export async function getCarsBySlugs(slugs) {
  const supabase = getSupabase();

  const CAR_COLS =
    'id, slug, name, year_start, year_end, make, model, country_of_origin, hp, hp_range, torque, acceleration_0_60, top_speed, engine_layout, drive_type, transmission, msrp, price_low, price_high, track, sound, reliability, value, aftermarket, daily, tuning_potential, fun, image_url, created_at';

  const { data: cars, error } = await supabase.from('cars').select(CAR_COLS).in('slug', slugs);

  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }

  // Maintain original slug order
  const orderedCars = slugs.map((slug) => cars.find((c) => c.slug === slug)).filter(Boolean);

  return orderedCars;
}

/**
 * Get top cars for a specific category (JDM, Track, etc.)
 */
export async function getTopCarsForCategory(category, options = {}) {
  const { weights = DEFAULT_WEIGHTS, limit = 10 } = options;

  const supabase = getSupabase();

  // Category-specific filters
  const categoryFilters = {
    jdm: { country: 'Japan' },
    american: { country: 'USA' },
    german: { country: 'Germany' },
    track: { minTrackScore: 8 },
    sound: { minSoundScore: 8 },
    reliable: { minReliabilityScore: 8 },
    value: { minValueScore: 8 },
    tuner: { minAftermarketScore: 8 },
  };

  const filter = categoryFilters[category];
  if (!filter) {
    throw new Error(`Unknown category: ${category}`);
  }

  const CAR_COLS =
    'id, slug, name, year_start, year_end, make, model, country_of_origin, hp, hp_range, torque, acceleration_0_60, top_speed, engine_layout, drive_type, transmission, msrp, price_low, price_high, track, sound, reliability, value, aftermarket, daily, tuning_potential, fun, image_url, created_at';

  let query = supabase.from('cars').select(CAR_COLS);

  if (filter.country) {
    query = query.eq('country_of_origin', filter.country);
  }
  if (filter.minTrackScore) {
    query = query.gte('track', filter.minTrackScore);
  }
  if (filter.minSoundScore) {
    query = query.gte('sound', filter.minSoundScore);
  }
  if (filter.minReliabilityScore) {
    query = query.gte('reliability', filter.minReliabilityScore);
  }
  if (filter.minValueScore) {
    query = query.gte('value', filter.minValueScore);
  }
  if (filter.minAftermarketScore) {
    query = query.gte('aftermarket', filter.minAftermarketScore);
  }

  const { data: cars, error } = await query;

  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }

  // Score and sort
  const scoredCars = cars.map((car) => ({
    ...car,
    total: calculateWeightedScore(car, weights),
  }));
  scoredCars.sort((a, b) => b.total - a.total);

  return scoredCars.slice(0, limit);
}

// =============================================================================
// ARTICLE DATA EXTRACTION
// =============================================================================

/**
 * Extract the data requirements from an article based on its title/type
 *
 * @param {Object} article - Article from al_articles table
 * @returns {Object} - Data requirements for this article
 */
export function analyzeArticleDataNeeds(article) {
  const title = article.title.toLowerCase();
  const result = {
    articleSlug: article.slug,
    articleTitle: article.title,
    dataType: null,
    filters: {},
    expectedCars: [],
    issues: [],
  };

  // Budget articles: "Under $X"
  const priceMatch = title.match(/under\s*\$?(\d+),?(\d*)k?/i);
  if (priceMatch) {
    const numStr = priceMatch[1] + (priceMatch[2] || '');
    const num = parseInt(numStr.replace(/,/g, ''), 10);
    const maxPrice = num < 1000 ? num * 1000 : num;

    result.dataType = 'budget';
    result.filters = { maxPrice, minPrice: 0 };
    return result;
  }

  // Three-way comparison: "A vs B vs C"
  const threeWayMatch = title.match(/(.+?)\s*vs\.?\s*(.+?)\s*vs\.?\s*(.+?)(?::|$)/i);
  if (threeWayMatch) {
    result.dataType = 'three_way';
    result.filters = {
      cars: [threeWayMatch[1].trim(), threeWayMatch[2].trim(), threeWayMatch[3].trim()],
    };
    return result;
  }

  // Head-to-head: "A vs B"
  const vsMatch = title.match(/(.+?)\s*vs\.?\s*(.+?)(?::|$)/i);
  if (vsMatch) {
    result.dataType = 'head_to_head';
    result.filters = {
      cars: [vsMatch[1].trim(), vsMatch[2].trim()],
    };
    return result;
  }

  // Category articles
  if (title.includes('jdm')) {
    result.dataType = 'category';
    result.filters = { category: 'jdm' };
    return result;
  }

  if (title.includes('track') && (title.includes('best') || title.includes('top'))) {
    result.dataType = 'category';
    result.filters = { category: 'track' };
    return result;
  }

  // Default: technical/general article
  result.dataType = 'general';
  return result;
}

/**
 * Fetch the cars that SHOULD be in an article based on database
 */
export async function fetchArticleRecommendedCars(article) {
  const needs = analyzeArticleDataNeeds(article);

  switch (needs.dataType) {
    case 'budget':
      return await getTopCarsUnderPrice(needs.filters.maxPrice, {
        minPrice: needs.filters.minPrice,
        limit: 10,
      });

    case 'head_to_head':
    case 'three_way':
      // For comparisons, we need to find the cars by name
      // This requires fuzzy matching since titles may not have exact slugs
      return await findCarsByNames(needs.filters.cars);

    case 'category':
      return await getTopCarsForCategory(needs.filters.category);

    default:
      return [];
  }
}

/**
 * Find cars by name (fuzzy match)
 */
async function findCarsByNames(names) {
  const supabase = getSupabase();
  const results = [];

  for (const name of names) {
    const searchTerm = name
      .replace(/^\d{4}\s*/, '') // Remove year prefix
      .replace(/[^\w\s]/g, '') // Remove special chars
      .toLowerCase()
      .trim();

    const CAR_COLS =
      'id, slug, name, year_start, year_end, make, model, country_of_origin, hp, hp_range, torque, acceleration_0_60, top_speed, engine_layout, drive_type, transmission, msrp, price_low, price_high, track, sound, reliability, value, aftermarket, daily, tuning_potential, fun, image_url, created_at';

    // Try exact match first
    const { data: exactMatch } = await supabase
      .from('cars')
      .select(CAR_COLS)
      .ilike('name', `%${searchTerm}%`)
      .limit(1);

    if (exactMatch && exactMatch.length > 0) {
      results.push(exactMatch[0]);
    }
  }

  return results;
}

// =============================================================================
// ARTICLE VALIDATION & AUDIT
// =============================================================================

/**
 * Audit an article to check if its content matches database recommendations
 *
 * @param {Object} article - Article from al_articles table
 * @returns {Object} - Audit result with discrepancies
 */
export async function auditArticleAlignment(article) {
  const audit = {
    articleSlug: article.slug,
    articleTitle: article.title,
    passed: true,
    issues: [],
    recommendations: [],
  };

  const needs = analyzeArticleDataNeeds(article);

  if (needs.dataType === 'budget') {
    // Fetch what the database says should be top cars
    const dbTopCars = await getTopCarsUnderPrice(needs.filters.maxPrice, { limit: 10 });
    const _dbCarNames = dbTopCars.map((c) => c.name.toLowerCase());

    // Check what cars are mentioned in article car_slugs
    const articleCars = article.car_slugs || [];

    // Check for misalignment
    if (articleCars.length === 0) {
      audit.issues.push({
        type: 'missing_car_slugs',
        message: 'Article has no car_slugs linked',
        severity: 'high',
      });
      audit.passed = false;
    }

    // Check if article's top cars are actually in database top 10
    const dbTop3Slugs = dbTopCars.slice(0, 3).map((c) => c.slug);
    const articleHasDbTop = articleCars.some((slug) => dbTop3Slugs.includes(slug));

    if (!articleHasDbTop && dbTopCars.length > 0) {
      audit.issues.push({
        type: 'top_cars_mismatch',
        message: `Article doesn't feature any of the database's top 3 cars for this price range`,
        severity: 'high',
        expected: dbTop3Slugs,
        actual: articleCars,
      });
      audit.passed = false;
    }

    // Provide recommendations
    audit.recommendations = dbTopCars.slice(0, 5).map((car, i) => ({
      rank: i + 1,
      name: car.name,
      slug: car.slug,
      score: car.total.toFixed(1),
      msrp: car.msrp,
    }));
  }

  return audit;
}

/**
 * Audit ALL published articles for database alignment
 */
export async function auditAllArticles() {
  const supabase = getSupabase();

  const ARTICLE_COLS =
    'id, slug, title, car_id, car_slug, topic, content_markdown, excerpt, seo_title, seo_description, featured_image_url, is_published, published_at, view_count, created_at';

  const { data: articles, error } = await supabase
    .from('al_articles')
    .select(ARTICLE_COLS)
    .eq('is_published', true);

  if (error) {
    throw new Error(`Failed to fetch articles: ${error.message}`);
  }

  const results = {
    total: articles.length,
    passed: 0,
    failed: 0,
    audits: [],
  };

  for (const article of articles) {
    const audit = await auditArticleAlignment(article);
    results.audits.push(audit);

    if (audit.passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  return results;
}

// =============================================================================
// ARTICLE CONTENT GENERATION FROM DATABASE
// =============================================================================

/**
 * Generate article content data directly from database
 * This ensures articles always reflect current database state
 *
 * @param {string} articleType - Type of article to generate
 * @param {Object} params - Parameters for the article
 * @returns {Object} - Article content data
 */
export async function generateArticleContentFromDB(articleType, params) {
  switch (articleType) {
    case 'budget':
      return await generateBudgetArticleData(params);
    case 'comparison':
      return await generateComparisonArticleData(params);
    default:
      throw new Error(`Unknown article type: ${articleType}`);
  }
}

/**
 * Generate data for a "Best Sports Cars Under $X" article
 */
async function generateBudgetArticleData(params) {
  const { maxPrice, year = new Date().getFullYear() } = params;

  const topCars = await getTopCarsUnderPrice(maxPrice, {
    limit: 10,
    includeScores: true,
  });

  if (topCars.length === 0) {
    throw new Error(`No cars found under $${maxPrice}`);
  }

  return {
    title: `Best Sports Cars Under $${(maxPrice / 1000).toFixed(0)}k in ${year}: Our Top Picks`,
    slug: `best-sports-cars-under-${(maxPrice / 1000).toFixed(0)}k`,
    meta_description: `Discover the best sports cars under $${(maxPrice / 1000).toFixed(0)},000. Our expert-scored recommendations based on sound, track capability, reliability, and more.`,

    // Cars to feature in the article
    featuredCars: topCars.slice(0, 6),

    // Car slugs for database
    car_slugs: topCars.slice(0, 6).map((c) => c.slug),

    // Cars for the hero image
    heroImageCars: topCars.slice(0, 3).map((c) => ({
      name: c.name,
      slug: c.slug,
      color: getCarColor(c),
    })),

    // Content sections (one per featured car)
    sections: topCars.slice(0, 6).map((car, index) => ({
      rank: index + 1,
      heading: `${index + 1}. ${car.name}`,
      carData: {
        name: car.name,
        slug: car.slug,
        msrp: car.msrp,
        year: car.year_start && car.year_end ? `${car.year_start}-${car.year_end}` : car.year_start,
        engineType: car.engine_type,
        hp: car.hp,
        transmission: car.transmission,
        driveType: car.drive_type,
        scores: {
          sound: car.sound,
          interior: car.interior,
          track: car.track,
          reliability: car.reliability,
          value: car.value,
          driverFun: car.driver_fun,
          aftermarket: car.aftermarket,
        },
        totalScore: car.total.toFixed(1),
        notes: car.notes,
        pros: car.pros,
        cons: car.cons,
      },
    })),

    // CTA linking to car selector
    ctaLink: `/car-selector?maxPrice=${maxPrice}`,
    ctaText: `Find Your Perfect Sports Car Under $${(maxPrice / 1000).toFixed(0)}k`,
  };
}

/**
 * Generate data for a comparison article
 */
async function generateComparisonArticleData(params) {
  const { carSlugs } = params;

  const cars = await getCarsBySlugs(carSlugs);

  if (cars.length < 2) {
    throw new Error('Need at least 2 cars for comparison');
  }

  // Calculate scores for each car
  const scoredCars = cars.map((car) => ({
    ...car,
    total: calculateWeightedScore(car, DEFAULT_WEIGHTS),
  }));

  // Determine winner
  scoredCars.sort((a, b) => b.total - a.total);
  const winner = scoredCars[0];

  return {
    title: `${cars[0].name} vs ${cars[1].name}${cars[2] ? ` vs ${cars[2].name}` : ''}: Complete Comparison`,
    cars: scoredCars,
    winner: winner,
    car_slugs: carSlugs,

    // Category-by-category comparison
    categoryComparisons: [
      'sound',
      'interior',
      'track',
      'reliability',
      'value',
      'driverFun',
      'aftermarket',
    ].map((cat) => ({
      category: cat,
      scores: scoredCars.map((car) => ({
        name: car.name,
        score: car[cat] || car[cat.toLowerCase()] || 0,
      })),
      winner: scoredCars.reduce((best, car) => {
        const score = car[cat] || car[cat.toLowerCase()] || 0;
        const bestScore = best[cat] || best[cat.toLowerCase()] || 0;
        return score > bestScore ? car : best;
      }).name,
    })),
  };
}

function getCarColor(car) {
  // Return a sensible color based on the car
  const colorMap = {
    corvette: 'Torch Red',
    mustang: 'Grabber Blue',
    camaro: 'Summit White',
    supra: 'Renaissance Red',
    miata: 'Soul Red Crystal',
    'mx-5': 'Soul Red Crystal',
    civic: 'Championship White',
    m3: 'Isle of Man Green',
    m4: 'San Marino Blue',
    porsche: 'GT Silver Metallic',
    cayman: 'Racing Yellow',
  };

  const nameLower = car.name.toLowerCase();
  for (const [key, color] of Object.entries(colorMap)) {
    if (nameLower.includes(key)) return color;
  }

  return 'Silver Metallic';
}

// =============================================================================
// EXPORTS
// =============================================================================

const articleDataSync = {
  getTopCarsUnderPrice,
  getCarsBySlugs,
  getTopCarsForCategory,
  analyzeArticleDataNeeds,
  fetchArticleRecommendedCars,
  auditArticleAlignment,
  auditAllArticles,
  generateArticleContentFromDB,
  PRICE_TIERS,
};

export default articleDataSync;
