/**
 * SEMA Data API Client
 *
 * Client for SEMA Data API - the industry standard for aftermarket parts data.
 * Provides access to millions of SKUs with built-in year/make/model/submodel fitment.
 *
 * API Documentation: https://apps.semadata.org/sdapi/v2
 *
 * IMPORTANT: SEMA Data subscription required since April 2024.
 * Rate limit: 60 calls per minute.
 *
 * @module lib/semaDataClient
 */

const SEMA_API_BASE_URL = 'https://api.semadata.org/v2';
const SEMA_SDC_API_BASE_URL = 'https://sdc.semadatacoop.org/sdcapi';

// Rate limiting: 60 calls per minute
const RATE_LIMIT_CALLS = 60;
const RATE_LIMIT_WINDOW_MS = 60000;

let rateLimitState = {
  remaining: RATE_LIMIT_CALLS,
  resetTime: Date.now() + RATE_LIMIT_WINDOW_MS,
};

/**
 * Get SEMA Data API credentials (read dynamically)
 * @returns {{ username: string, password: string, apiKey: string } | null}
 */
function getCredentials() {
  const username = process.env.SEMA_DATA_USERNAME;
  const password = process.env.SEMA_DATA_PASSWORD;
  const apiKey = process.env.SEMA_DATA_API_KEY;

  if (!username || !password) {
    return null;
  }

  return { username, password, apiKey };
}

/**
 * Check if SEMA Data is configured
 * @returns {boolean}
 */
export function isSemaDataConfigured() {
  const creds = getCredentials();
  return !!(creds?.username && creds?.password);
}

/**
 * Token cache for session management
 */
let tokenCache = {
  token: null,
  expiresAt: 0,
};

/**
 * Get or refresh authentication token
 * @returns {Promise<string>}
 */
export async function getToken() {
  const creds = getCredentials();
  if (!creds) {
    throw new Error('SEMA_DATA_USERNAME and SEMA_DATA_PASSWORD not configured');
  }

  // Return cached token if still valid (with 5 min buffer)
  if (tokenCache.token && tokenCache.expiresAt > Date.now() + 300000) {
    return tokenCache.token;
  }

  try {
    const response = await fetch(`${SEMA_API_BASE_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username: creds.username,
        password: creds.password,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SEMA token request failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // Cache token with expiry
    tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    };

    return tokenCache.token;
  } catch (err) {
    console.error('[SEMA] Token request error:', err.message);
    throw err;
  }
}

/**
 * Check and update rate limiting
 * @returns {Promise<void>}
 */
async function checkRateLimit() {
  const now = Date.now();

  // Reset window if expired
  if (now >= rateLimitState.resetTime) {
    rateLimitState = {
      remaining: RATE_LIMIT_CALLS,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    };
  }

  // Wait if rate limited
  if (rateLimitState.remaining <= 0) {
    const waitTime = rateLimitState.resetTime - now;
    console.log(`[SEMA] Rate limited, waiting ${Math.ceil(waitTime / 1000)}s...`);
    await new Promise((r) => setTimeout(r, waitTime + 100));

    // Reset after waiting
    rateLimitState = {
      remaining: RATE_LIMIT_CALLS,
      resetTime: Date.now() + RATE_LIMIT_WINDOW_MS,
    };
  }

  rateLimitState.remaining--;
}

/**
 * Make authenticated API request to SEMA Data
 * @param {string} endpoint - API endpoint path
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>}
 */
async function semaRequest(endpoint, options = {}) {
  await checkRateLimit();

  const token = await getToken();
  const url = endpoint.startsWith('http') ? endpoint : `${SEMA_API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...options.headers,
    },
  });

  // Update rate limit from headers if available
  const remaining = response.headers.get('RateLimit-Remaining');
  if (remaining !== null) {
    rateLimitState.remaining = parseInt(remaining, 10);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SEMA API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// ============================================================================
// VEHICLE LOOKUP METHODS
// ============================================================================

/**
 * Get all available years
 * @returns {Promise<Array<{ YearID: number }>>}
 */
export async function getYears() {
  return semaRequest('/lookup/years');
}

/**
 * Get makes for a specific year
 * @param {number} yearId - Year ID
 * @returns {Promise<Array<{ MakeID: number, MakeName: string }>>}
 */
export async function getMakes(yearId) {
  return semaRequest(`/lookup/makes?year=${yearId}`);
}

/**
 * Get models for a specific year and make
 * @param {number} yearId - Year ID
 * @param {number} makeId - Make ID
 * @returns {Promise<Array<{ ModelID: number, ModelName: string }>>}
 */
export async function getModels(yearId, makeId) {
  return semaRequest(`/lookup/models?year=${yearId}&make=${makeId}`);
}

/**
 * Get submodels for a specific year, make, and model
 * @param {number} yearId - Year ID
 * @param {number} makeId - Make ID
 * @param {number} modelId - Model ID
 * @returns {Promise<Array<{ SubModelID: number, SubModelName: string }>>}
 */
export async function getSubmodels(yearId, makeId, modelId) {
  return semaRequest(`/lookup/submodels?year=${yearId}&make=${makeId}&model=${modelId}`);
}

/**
 * Get engine configurations for a vehicle
 * @param {number} yearId - Year ID
 * @param {number} makeId - Make ID
 * @param {number} modelId - Model ID
 * @param {number} [submodelId] - Optional Submodel ID
 * @returns {Promise<Array>}
 */
export async function getEngines(yearId, makeId, modelId, submodelId = null) {
  let url = `/lookup/engines?year=${yearId}&make=${makeId}&model=${modelId}`;
  if (submodelId) {
    url += `&submodel=${submodelId}`;
  }
  return semaRequest(url);
}

// ============================================================================
// PRODUCT LOOKUP METHODS
// ============================================================================

/**
 * Get products by vehicle fitment
 * @param {Object} params - Search parameters
 * @param {number} params.yearId - Year ID
 * @param {number} params.makeId - Make ID
 * @param {number} params.modelId - Model ID
 * @param {number} [params.submodelId] - Optional Submodel ID
 * @param {number} [params.engineId] - Optional Engine ID
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.pageSize=100] - Items per page (max 100)
 * @returns {Promise<Object>}
 */
export async function getProductsByVehicle(params) {
  const { yearId, makeId, modelId, submodelId, engineId, page = 1, pageSize = 100 } = params;

  let url = `/products/vehicle?year=${yearId}&make=${makeId}&model=${modelId}`;
  if (submodelId) url += `&submodel=${submodelId}`;
  if (engineId) url += `&engine=${engineId}`;
  url += `&page=${page}&pageSize=${Math.min(pageSize, 100)}`;

  return semaRequest(url);
}

/**
 * Get products by category
 * @param {number} categoryId - Category ID
 * @param {Object} [options] - Options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.pageSize=100] - Items per page
 * @returns {Promise<Object>}
 */
export async function getProductsByCategory(categoryId, options = {}) {
  const { page = 1, pageSize = 100 } = options;
  return semaRequest(`/products/category/${categoryId}?page=${page}&pageSize=${Math.min(pageSize, 100)}`);
}

/**
 * Get products by brand
 * @param {number} brandId - Brand ID
 * @param {Object} [options] - Options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.pageSize=100] - Items per page
 * @returns {Promise<Object>}
 */
export async function getProductsByBrand(brandId, options = {}) {
  const { page = 1, pageSize = 100 } = options;
  return semaRequest(`/products/brand/${brandId}?page=${page}&pageSize=${Math.min(pageSize, 100)}`);
}

/**
 * Get single product details
 * @param {string} partNumber - Part number
 * @param {number} brandId - Brand ID
 * @returns {Promise<Object>}
 */
export async function getProduct(partNumber, brandId) {
  return semaRequest(`/products/${encodeURIComponent(partNumber)}?brand=${brandId}`);
}

/**
 * Get product attributes
 * @param {string} partNumber - Part number
 * @param {number} brandId - Brand ID
 * @returns {Promise<Object>}
 */
export async function getProductAttributes(partNumber, brandId) {
  return semaRequest(`/products/${encodeURIComponent(partNumber)}/attributes?brand=${brandId}`);
}

/**
 * Get product descriptions
 * @param {string} partNumber - Part number
 * @param {number} brandId - Brand ID
 * @returns {Promise<Object>}
 */
export async function getProductDescriptions(partNumber, brandId) {
  return semaRequest(`/products/${encodeURIComponent(partNumber)}/descriptions?brand=${brandId}`);
}

/**
 * Get product digital assets (images, documents)
 * @param {string} partNumber - Part number
 * @param {number} brandId - Brand ID
 * @returns {Promise<Object>}
 */
export async function getProductAssets(partNumber, brandId) {
  return semaRequest(`/products/${encodeURIComponent(partNumber)}/digitalassets?brand=${brandId}`);
}

/**
 * Get product pricing
 * @param {string} partNumber - Part number
 * @param {number} brandId - Brand ID
 * @returns {Promise<Object>}
 */
export async function getProductPricing(partNumber, brandId) {
  return semaRequest(`/products/${encodeURIComponent(partNumber)}/prices?brand=${brandId}`);
}

/**
 * Get vehicles that a product fits
 * @param {string} partNumber - Part number
 * @param {number} brandId - Brand ID
 * @returns {Promise<Object>}
 */
export async function getProductVehicles(partNumber, brandId) {
  return semaRequest(`/vehicles/product/${encodeURIComponent(partNumber)}?brand=${brandId}`);
}

// ============================================================================
// CATEGORY METHODS
// ============================================================================

/**
 * Get all categories
 * @returns {Promise<Array>}
 */
export async function getCategories() {
  return semaRequest('/lookup/categories');
}

/**
 * Get subcategories
 * @param {number} parentCategoryId - Parent category ID
 * @returns {Promise<Array>}
 */
export async function getSubcategories(parentCategoryId) {
  return semaRequest(`/lookup/categories/${parentCategoryId}/subcategories`);
}

// ============================================================================
// BRAND METHODS
// ============================================================================

/**
 * Get all brands
 * @returns {Promise<Array>}
 */
export async function getBrands() {
  return semaRequest('/lookup/brands');
}

// ============================================================================
// BULK METHODS
// ============================================================================

/**
 * Get bulk products for a brand (paginated)
 * @param {number} brandId - Brand ID
 * @param {Object} [options] - Options
 * @param {number} [options.maxPages=10] - Max pages to fetch
 * @param {number} [options.pageSize=100] - Items per page
 * @param {Function} [options.onPage] - Callback for each page
 * @returns {Promise<Array>}
 */
export async function getBulkProductsByBrand(brandId, options = {}) {
  const { maxPages = 10, pageSize = 100, onPage } = options;
  const allProducts = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= maxPages) {
    try {
      const result = await getProductsByBrand(brandId, { page, pageSize });
      const products = result.Products || result.products || [];

      if (products.length === 0) {
        hasMore = false;
      } else {
        allProducts.push(...products);
        if (onPage) {
          await onPage(products, page);
        }
        page++;
      }

      // Small delay between pages to be nice to the API
      if (hasMore) {
        await new Promise((r) => setTimeout(r, 200));
      }
    } catch (err) {
      console.error(`[SEMA] Error fetching page ${page} for brand ${brandId}:`, err.message);
      hasMore = false;
    }
  }

  return allProducts;
}

/**
 * Get all products for a vehicle across all pages
 * @param {Object} params - Vehicle parameters
 * @param {Object} [options] - Options
 * @param {number} [options.maxPages=20] - Max pages to fetch
 * @param {Function} [options.onPage] - Callback for each page
 * @returns {Promise<Array>}
 */
export async function getAllProductsForVehicle(params, options = {}) {
  const { maxPages = 20, onPage } = options;
  const allProducts = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= maxPages) {
    try {
      const result = await getProductsByVehicle({ ...params, page });
      const products = result.Products || result.products || [];

      if (products.length === 0) {
        hasMore = false;
      } else {
        allProducts.push(...products);
        if (onPage) {
          await onPage(products, page);
        }
        page++;
      }

      if (hasMore) {
        await new Promise((r) => setTimeout(r, 200));
      }
    } catch (err) {
      console.error(`[SEMA] Error fetching page ${page}:`, err.message);
      hasMore = false;
    }
  }

  return allProducts;
}

// ============================================================================
// UTILITY METHODS
// ============================================================================

/**
 * Map SEMA category to AutoRev category
 * @param {string} semaCategory - SEMA category name
 * @returns {string}
 */
export function mapCategory(semaCategory) {
  const categoryMap = {
    // Intake
    'Air Filters': 'intake',
    'Air Intake Systems': 'intake',
    'Cold Air Intakes': 'intake',
    'Intake Manifolds': 'intake',

    // Exhaust
    Exhaust: 'exhaust',
    'Exhaust Systems': 'exhaust',
    'Cat-Back Exhaust': 'exhaust',
    Headers: 'exhaust',
    Mufflers: 'exhaust',
    Downpipes: 'exhaust',

    // Suspension
    Suspension: 'suspension',
    Coilovers: 'suspension',
    'Lowering Springs': 'suspension',
    'Sway Bars': 'suspension',
    Shocks: 'suspension',
    Struts: 'suspension',

    // Brakes
    Brakes: 'brakes',
    'Brake Pads': 'brakes',
    'Brake Rotors': 'brakes',
    'Big Brake Kits': 'brakes',
    Calipers: 'brakes',

    // Forced Induction
    Turbochargers: 'forced_induction',
    Superchargers: 'forced_induction',
    Intercoolers: 'cooling',
    'Blow Off Valves': 'forced_induction',
    Wastegates: 'forced_induction',

    // Fuel
    'Fuel System': 'fuel_system',
    'Fuel Injectors': 'fuel_system',
    'Fuel Pumps': 'fuel_system',

    // Wheels/Tires
    Wheels: 'wheels_tires',
    Tires: 'wheels_tires',

    // Cooling
    Radiators: 'cooling',
    Cooling: 'cooling',
    'Oil Coolers': 'cooling',

    // Tuning
    'Performance Chips': 'tune',
    Tuners: 'tune',
    ECU: 'tune',
  };

  // Try exact match first
  if (categoryMap[semaCategory]) {
    return categoryMap[semaCategory];
  }

  // Try partial match
  const lowerCategory = semaCategory.toLowerCase();
  for (const [key, value] of Object.entries(categoryMap)) {
    if (lowerCategory.includes(key.toLowerCase())) {
      return value;
    }
  }

  return 'other';
}

/**
 * Get rate limit status
 * @returns {{ remaining: number, resetTime: number }}
 */
export function getRateLimitStatus() {
  return { ...rateLimitState };
}

// ============================================================================
// EXPORTS
// ============================================================================

const semaDataClient = {
  isSemaDataConfigured,
  getToken,
  getRateLimitStatus,
  // Vehicle lookups
  getYears,
  getMakes,
  getModels,
  getSubmodels,
  getEngines,
  // Product lookups
  getProductsByVehicle,
  getProductsByCategory,
  getProductsByBrand,
  getProduct,
  getProductAttributes,
  getProductDescriptions,
  getProductAssets,
  getProductPricing,
  getProductVehicles,
  // Categories & Brands
  getCategories,
  getSubcategories,
  getBrands,
  // Bulk methods
  getBulkProductsByBrand,
  getAllProductsForVehicle,
  // Utilities
  mapCategory,
};

export default semaDataClient;
