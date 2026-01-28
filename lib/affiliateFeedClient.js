/**
 * Affiliate Feed Client
 *
 * Client for parsing and processing affiliate datafeeds from networks
 * like Rakuten (LinkShare), CJ Affiliate, and ShareASale.
 *
 * Supported feed formats:
 * - CSV (most common)
 * - XML (some vendors)
 * - TSV (tab-separated)
 *
 * @module lib/affiliateFeedClient
 */

import { createReadStream } from 'fs';

import { parse as csvParse } from 'csv-parse';
import { XMLParser } from 'fast-xml-parser';

// ============================================================================
// VENDOR FEED CONFIGURATIONS
// ============================================================================

export const AFFILIATE_FEED_CONFIGS = {
  // ECS Tuning (Rakuten)
  ecstuning: {
    network: 'rakuten',
    vendorKey: 'ecstuning',
    vendorName: 'ECS Tuning',
    families: ['vag', 'bmw', 'porsche'],
    feedFormat: 'csv',
    fieldMapping: {
      partNumber: 'SKU',
      name: 'PRODUCTNAME',
      description: 'DESCRIPTION',
      brand: 'MANUFACTURER',
      category: 'CATEGORY',
      price: 'PRICE',
      salePrice: 'SALEPRICE',
      imageUrl: 'IMAGEURL',
      productUrl: 'LINKURL',
      inStock: 'AVAILABILITY',
      // Vehicle fitment fields (if available)
      year: 'VEHICLE_YEAR',
      make: 'VEHICLE_MAKE',
      model: 'VEHICLE_MODEL',
    },
    confidenceBase: 0.70,
  },

  // FCP Euro (Rakuten)
  fcpeuro: {
    network: 'rakuten',
    vendorKey: 'fcpeuro',
    vendorName: 'FCP Euro',
    families: ['vag', 'bmw', 'porsche'],
    feedFormat: 'csv',
    fieldMapping: {
      partNumber: 'SKU',
      name: 'PRODUCT_NAME',
      description: 'DESCRIPTION',
      brand: 'BRAND',
      category: 'CATEGORY',
      price: 'RETAIL_PRICE',
      imageUrl: 'IMAGE_URL',
      productUrl: 'PRODUCT_URL',
      year: 'YEAR',
      make: 'MAKE',
      model: 'MODEL',
    },
    confidenceBase: 0.72,
  },

  // Summit Racing (CJ Affiliate)
  summitracing: {
    network: 'cj',
    vendorKey: 'summitracing',
    vendorName: 'Summit Racing',
    families: ['domestic'],
    feedFormat: 'csv',
    fieldMapping: {
      partNumber: 'PROGRAMSKU',
      name: 'NAME',
      description: 'DESCRIPTION',
      brand: 'MANUFACTURER',
      category: 'ADVERTISERCATEGORY',
      price: 'PRICE',
      salePrice: 'SALEPRICE',
      imageUrl: 'IMAGEURL',
      productUrl: 'BUYURL',
      inStock: 'INSTOCK',
    },
    confidenceBase: 0.65,
  },

  // RallySport Direct (ShareASale)
  rallysportdirect: {
    network: 'shareasale',
    vendorKey: 'rallysportdirect',
    vendorName: 'RallySport Direct',
    families: ['subaru', 'toyota'],
    feedFormat: 'csv',
    fieldMapping: {
      partNumber: 'SKU',
      name: 'Name',
      description: 'Description',
      brand: 'Manufacturer',
      category: 'Category',
      price: 'Price',
      imageUrl: 'ImageURL',
      productUrl: 'URL',
    },
    confidenceBase: 0.70,
  },
};

// ============================================================================
// CATEGORY MAPPING
// ============================================================================

/**
 * Map affiliate category to AutoRev category
 * @param {string} affiliateCategory - Category from feed
 * @returns {string}
 */
export function mapAffiliateCategory(affiliateCategory) {
  if (!affiliateCategory) return 'other';

  const cat = affiliateCategory.toLowerCase();

  // Intake
  if (cat.includes('intake') || cat.includes('air filter') || cat.includes('induction')) {
    return 'intake';
  }

  // Exhaust
  if (
    cat.includes('exhaust') ||
    cat.includes('header') ||
    cat.includes('muffler') ||
    cat.includes('downpipe') ||
    cat.includes('catback')
  ) {
    return 'exhaust';
  }

  // Suspension
  if (
    cat.includes('suspension') ||
    cat.includes('coilover') ||
    cat.includes('spring') ||
    cat.includes('shock') ||
    cat.includes('strut') ||
    cat.includes('sway bar')
  ) {
    return 'suspension';
  }

  // Brakes
  if (
    cat.includes('brake') ||
    cat.includes('rotor') ||
    cat.includes('pad') ||
    cat.includes('caliper')
  ) {
    return 'brakes';
  }

  // Forced Induction
  if (
    cat.includes('turbo') ||
    cat.includes('supercharger') ||
    cat.includes('intercooler') ||
    cat.includes('blow off')
  ) {
    return 'forced_induction';
  }

  // Cooling
  if (cat.includes('cooling') || cat.includes('radiator') || cat.includes('oil cooler')) {
    return 'cooling';
  }

  // Fuel
  if (
    cat.includes('fuel') ||
    cat.includes('injector') ||
    cat.includes('pump') ||
    cat.includes('ethanol')
  ) {
    return 'fuel_system';
  }

  // Wheels/Tires
  if (cat.includes('wheel') || cat.includes('tire') || cat.includes('rim')) {
    return 'wheels_tires';
  }

  // Tuning
  if (
    cat.includes('tune') ||
    cat.includes('chip') ||
    cat.includes('ecu') ||
    cat.includes('flash') ||
    cat.includes('programmer')
  ) {
    return 'tune';
  }

  return 'other';
}

// ============================================================================
// FEED PARSING
// ============================================================================

/**
 * Parse a CSV feed file
 * @param {string} filePath - Path to CSV file
 * @param {Object} config - Vendor feed config
 * @param {Object} [options] - Options
 * @param {number} [options.limit] - Max rows to process
 * @param {Function} [options.onRow] - Callback for each row
 * @returns {Promise<Array>}
 */
export async function parseCsvFeed(filePath, config, options = {}) {
  const { limit, onRow } = options;
  const { fieldMapping } = config;
  const products = [];

  return new Promise((resolve, reject) => {
    const parser = createReadStream(filePath).pipe(
      csvParse({
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        trim: true,
      })
    );

    let rowCount = 0;

    parser.on('data', (row) => {
      if (limit && rowCount >= limit) {
        parser.destroy();
        return;
      }

      const product = mapRowToProduct(row, fieldMapping, config);

      if (product) {
        products.push(product);
        if (onRow) {
          onRow(product, rowCount);
        }
      }

      rowCount++;
    });

    parser.on('end', () => resolve(products));
    parser.on('error', reject);
  });
}

/**
 * Parse an XML feed file
 * @param {string} filePath - Path to XML file
 * @param {Object} config - Vendor feed config
 * @returns {Promise<Array>}
 */
export async function parseXmlFeed(filePath, config) {
  const fs = await import('fs/promises');
  const xmlContent = await fs.readFile(filePath, 'utf-8');

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  const parsed = parser.parse(xmlContent);

  // Find products array in XML structure
  let products = parsed.products?.product || parsed.feed?.product || [];

  if (!Array.isArray(products)) {
    products = [products];
  }

  return products.map((item) => mapRowToProduct(item, config.fieldMapping, config));
}

/**
 * Map a feed row to product format
 * @param {Object} row - Raw row data
 * @param {Object} fieldMapping - Field mapping config
 * @param {Object} config - Vendor config
 * @returns {Object|null}
 */
function mapRowToProduct(row, fieldMapping, config) {
  // Get field values with fallbacks
  const getValue = (field) => {
    const mappedField = fieldMapping[field];
    if (!mappedField) return null;

    // Handle array of possible field names
    if (Array.isArray(mappedField)) {
      for (const f of mappedField) {
        if (row[f]) return row[f];
      }
      return null;
    }

    return row[mappedField] || null;
  };

  const partNumber = getValue('partNumber');
  const name = getValue('name');

  // Skip if missing required fields
  if (!partNumber || !name) {
    return null;
  }

  // Parse price
  let priceCents = null;
  const priceStr = getValue('salePrice') || getValue('price');
  if (priceStr) {
    const price = parseFloat(String(priceStr).replace(/[^0-9.]/g, ''));
    if (!isNaN(price)) {
      priceCents = Math.round(price * 100);
    }
  }

  // Map category
  const category = mapAffiliateCategory(getValue('category'));

  // Build product object
  return {
    partNumber,
    name,
    description: getValue('description') || null,
    brand: getValue('brand') || config.vendorName,
    category,
    priceCents,
    imageUrl: getValue('imageUrl') || null,
    productUrl: getValue('productUrl') || null,
    inStock: getValue('inStock') === 'true' || getValue('inStock') === 'Y' || getValue('inStock') === '1',
    // Vehicle fitment if available
    vehicle: {
      year: getValue('year'),
      make: getValue('make'),
      model: getValue('model'),
    },
    // Source metadata
    _source: {
      vendor: config.vendorKey,
      network: config.network,
      confidence: config.confidenceBase,
    },
  };
}

/**
 * Parse a feed file based on format
 * @param {string} filePath - Path to feed file
 * @param {string} vendorKey - Vendor key
 * @param {Object} [options] - Options
 * @returns {Promise<Array>}
 */
export async function parseFeed(filePath, vendorKey, options = {}) {
  const config = AFFILIATE_FEED_CONFIGS[vendorKey];

  if (!config) {
    throw new Error(`Unknown vendor: ${vendorKey}`);
  }

  switch (config.feedFormat) {
    case 'csv':
      return parseCsvFeed(filePath, config, options);
    case 'xml':
      return parseXmlFeed(filePath, config);
    default:
      throw new Error(`Unsupported feed format: ${config.feedFormat}`);
  }
}

// ============================================================================
// FEED DOWNLOAD (PLACEHOLDER)
// ============================================================================

/**
 * Download feed from affiliate network
 * NOTE: Actual implementation requires network-specific API credentials
 *
 * @param {string} vendorKey - Vendor key
 * @param {string} outputPath - Where to save the feed
 * @param {Object} credentials - Network credentials
 * @returns {Promise<string>}
 */
export async function downloadFeed(vendorKey, _outputPath, _credentials) {
  const config = AFFILIATE_FEED_CONFIGS[vendorKey];

  if (!config) {
    throw new Error(`Unknown vendor: ${vendorKey}`);
  }

  // Placeholder - actual implementation depends on network
  // Rakuten: Uses FTP or API with token
  // CJ: Uses REST API with publisher ID
  // ShareASale: Uses merchant datafeed API

  console.log(`[AffiliateFeed] Download not implemented for ${config.network}`);
  console.log('[AffiliateFeed] Please manually download the feed and use parseFeed()');

  throw new Error('Feed download not implemented - use manual download');
}

// ============================================================================
// PRODUCT TO PART MAPPING
// ============================================================================

/**
 * Map affiliate product to AutoRev part format
 * @param {Object} product - Parsed product from feed
 * @param {Object} [fitment] - Resolved fitment data
 * @returns {Object}
 */
export function mapProductToPart(product, fitment = null) {
  const attributes = {
    system: product.category,
    subSystem: null,
    vehicleTags: [],
    fitment: {
      notes: null,
      modelYears: product.vehicle?.year || null,
      engineCodes: [],
      drivetrain: null,
      transmission: null,
    },
    gains: {
      hp: null,
      tq: null,
      notes: null,
    },
    compliance: {
      emissions: null,
      emissionsNotes: null,
      noiseNotes: null,
    },
    install: {
      difficulty: null,
      laborHours: null,
      requiresTune: null,
      requiresSupportingMods: [],
    },
    source: {
      vendor: product._source.vendor,
      network: product._source.network,
      productUrl: product.productUrl,
      imageUrl: product.imageUrl,
    },
  };

  return {
    brand_name: product.brand,
    name: product.name,
    part_number: product.partNumber,
    category: product.category,
    description: product.description,
    attributes,
    quality_tier: 'standard',
    street_legal: null,
    source_urls: product.productUrl ? [product.productUrl] : [],
    confidence: product._source.confidence,
    is_active: product.inStock !== false,
    // Fitment if resolved
    fitment: fitment
      ? {
          car_id: fitment.car_id,
          confidence: fitment.confidence,
        }
      : null,
    // Pricing
    price_cents: product.priceCents,
    // Affiliate link
    affiliate_url: product.productUrl,
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get feed config for a vendor
 * @param {string} vendorKey
 * @returns {Object|null}
 */
export function getFeedConfig(vendorKey) {
  return AFFILIATE_FEED_CONFIGS[vendorKey] || null;
}

/**
 * Get all configured vendors
 * @returns {Array<string>}
 */
export function getConfiguredVendors() {
  return Object.keys(AFFILIATE_FEED_CONFIGS);
}

/**
 * Get vendors by network
 * @param {string} network - Network name (rakuten, cj, shareasale)
 * @returns {Array<Object>}
 */
export function getVendorsByNetwork(network) {
  return Object.entries(AFFILIATE_FEED_CONFIGS)
    .filter(([, config]) => config.network === network)
    .map(([key, config]) => ({ key, ...config }));
}

// ============================================================================
// EXPORTS
// ============================================================================

const affiliateFeedClient = {
  // Config
  AFFILIATE_FEED_CONFIGS,
  getFeedConfig,
  getConfiguredVendors,
  getVendorsByNetwork,
  // Parsing
  parseFeed,
  parseCsvFeed,
  parseXmlFeed,
  // Mapping
  mapAffiliateCategory,
  mapProductToPart,
  // Download (placeholder)
  downloadFeed,
};

export default affiliateFeedClient;
