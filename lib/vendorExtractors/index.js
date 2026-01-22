/**
 * Vendor Extractors
 *
 * Defines extraction schemas and configurations for scraping parts data
 * from vendor websites using Firecrawl AI extraction.
 *
 * Each vendor has:
 * - A JSON schema for structured extraction
 * - URL patterns for product pages
 * - Category mappings
 *
 * @module lib/vendorExtractors
 */

// ============================================================================
// EXTRACTION SCHEMAS
// ============================================================================

/**
 * Base schema for parts extraction
 * Used as a foundation for vendor-specific schemas
 */
export const BASE_PARTS_SCHEMA = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'Full product name',
    },
    partNumber: {
      type: 'string',
      description: 'Part number or SKU',
    },
    price: {
      type: 'number',
      description: 'Price in USD',
    },
    brand: {
      type: 'string',
      description: 'Brand/manufacturer name',
    },
    category: {
      type: 'string',
      description: 'Product category (e.g., intake, exhaust, suspension)',
    },
    description: {
      type: 'string',
      description: 'Product description',
    },
    fitment: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          year: { type: 'string', description: 'Model year or year range' },
          make: { type: 'string', description: 'Vehicle make' },
          model: { type: 'string', description: 'Vehicle model' },
          submodel: { type: 'string', description: 'Trim or submodel' },
        },
      },
      description: 'List of compatible vehicles',
    },
    gains: {
      type: 'object',
      properties: {
        hp: { type: 'number', description: 'Horsepower gain' },
        torque: { type: 'number', description: 'Torque gain (lb-ft)' },
      },
      description: 'Performance gains',
    },
    images: {
      type: 'array',
      items: { type: 'string' },
      description: 'Product image URLs',
    },
    inStock: {
      type: 'boolean',
      description: 'Whether the product is in stock',
    },
  },
  required: ['name'],
};

// ============================================================================
// APR - Tunes and Hardware
// ============================================================================

export const APR_CONFIG = {
  vendorKey: 'apr',
  vendorName: 'APR',
  vendorUrl: 'https://www.goapr.com',
  families: ['vag'],
  confidenceBase: 0.75,

  // URL patterns for product pages
  urlPatterns: [
    /goapr\.com\/products\//,
  ],

  // Sitemap/catalog URLs
  catalogUrls: [
    'https://www.goapr.com/products/software/',
    'https://www.goapr.com/products/hardware/turbocharger/',
    'https://www.goapr.com/products/hardware/intake/',
    'https://www.goapr.com/products/hardware/exhaust/',
  ],

  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Product name' },
      partNumber: { type: 'string', description: 'APR part number' },
      price: { type: 'number', description: 'Price in USD' },
      category: {
        type: 'string',
        enum: ['tune', 'intake', 'exhaust', 'turbo', 'intercooler', 'suspension'],
        description: 'Product category',
      },
      description: { type: 'string', description: 'Full product description' },
      stage: {
        type: 'string',
        enum: ['Stage 1', 'Stage 2', 'Stage 2+', 'Stage 3'],
        description: 'Tune stage level',
      },
      gains: {
        type: 'object',
        properties: {
          hp: { type: 'number', description: 'Peak HP gain' },
          torque: { type: 'number', description: 'Peak torque gain' },
        },
      },
      requirements: {
        type: 'array',
        items: { type: 'string' },
        description: 'Required supporting modifications',
      },
      fitment: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            platform: { type: 'string', description: 'Platform code (e.g., MK7 GTI)' },
            years: { type: 'string', description: 'Year range' },
            engine: { type: 'string', description: 'Engine code' },
          },
        },
      },
    },
    required: ['name'],
  },

  // Category mapping
  categoryMap: {
    software: 'tune',
    tune: 'tune',
    'ecu upgrade': 'tune',
    turbocharger: 'forced_induction',
    turbo: 'forced_induction',
    intake: 'intake',
    exhaust: 'exhaust',
    intercooler: 'cooling',
    suspension: 'suspension',
  },
};

// ============================================================================
// Cobb Tuning - Accessports and Hardware
// ============================================================================

export const COBB_CONFIG = {
  vendorKey: 'cobbtuning',
  vendorName: 'Cobb Tuning',
  vendorUrl: 'https://www.cobbtuning.com',
  families: ['subaru', 'ford', 'nissan', 'vag', 'bmw', 'porsche', 'mazda'],
  confidenceBase: 0.78,

  urlPatterns: [
    /cobbtuning\.com\/products\//,
  ],

  catalogUrls: [
    'https://www.cobbtuning.com/products?categories=subaru',
    'https://www.cobbtuning.com/products?categories=ford',
    'https://www.cobbtuning.com/products?categories=nissan',
    'https://www.cobbtuning.com/products?categories=volkswagen',
    'https://www.cobbtuning.com/products?categories=bmw',
    'https://www.cobbtuning.com/products?categories=porsche',
  ],

  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Product name' },
      partNumber: { type: 'string', description: 'Cobb part number' },
      price: { type: 'number', description: 'Price in USD' },
      category: {
        type: 'string',
        enum: ['accessport', 'intake', 'exhaust', 'turbo', 'intercooler', 'fuel', 'suspension'],
        description: 'Product category',
      },
      description: { type: 'string' },
      stage: { type: 'string', description: 'Tune stage (Stage 1, Stage 2, etc.)' },
      gains: {
        type: 'object',
        properties: {
          hp: { type: 'number' },
          torque: { type: 'number' },
        },
      },
      fitment: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            make: { type: 'string' },
            model: { type: 'string' },
            years: { type: 'string' },
            engine: { type: 'string' },
          },
        },
      },
      mapNotes: {
        type: 'string',
        description: 'Map/tune notes for Accessport products',
      },
    },
    required: ['name'],
  },

  categoryMap: {
    accessport: 'tune',
    'access port': 'tune',
    tuning: 'tune',
    intake: 'intake',
    exhaust: 'exhaust',
    turbo: 'forced_induction',
    intercooler: 'cooling',
    'fuel system': 'fuel_system',
    suspension: 'suspension',
  },
};

// ============================================================================
// KW Suspensions
// ============================================================================

export const KW_CONFIG = {
  vendorKey: 'kw',
  vendorName: 'KW Suspensions',
  vendorUrl: 'https://www.kwsuspensions.com',
  families: ['vag', 'bmw', 'porsche', 'domestic', 'honda', 'toyota', 'nissan'],
  confidenceBase: 0.80,

  urlPatterns: [
    /kwsuspensions\.com\/products\//,
    /kwsuspensions\.net\/products\//,
  ],

  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Product name' },
      partNumber: { type: 'string', description: 'KW part number' },
      price: { type: 'number', description: 'Price in USD' },
      productLine: {
        type: 'string',
        enum: ['V1', 'V2', 'V3', 'V4', 'Clubsport', 'Competition', 'Street Comfort'],
        description: 'KW product line',
      },
      adjustability: {
        type: 'object',
        properties: {
          rebound: { type: 'boolean', description: 'Rebound damping adjustable' },
          compression: { type: 'boolean', description: 'Compression damping adjustable' },
          height: { type: 'boolean', description: 'Ride height adjustable' },
        },
      },
      lowering: {
        type: 'object',
        properties: {
          front: { type: 'string', description: 'Front lowering range (e.g., 20-40mm)' },
          rear: { type: 'string', description: 'Rear lowering range' },
        },
      },
      fitment: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            make: { type: 'string' },
            model: { type: 'string' },
            years: { type: 'string' },
            chassisCode: { type: 'string' },
          },
        },
      },
    },
    required: ['name'],
  },

  categoryMap: {
    coilovers: 'suspension',
    'coilover kit': 'suspension',
    springs: 'suspension',
    shocks: 'suspension',
    'spring kit': 'suspension',
  },
};

// ============================================================================
// StopTech Brakes
// ============================================================================

export const STOPTECH_CONFIG = {
  vendorKey: 'stoptech',
  vendorName: 'StopTech',
  vendorUrl: 'https://www.stoptech.com',
  families: ['vag', 'bmw', 'porsche', 'domestic', 'honda', 'toyota', 'nissan', 'subaru'],
  confidenceBase: 0.80,

  urlPatterns: [
    /stoptech\.com\/products\//,
  ],

  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Product name' },
      partNumber: { type: 'string', description: 'StopTech part number' },
      price: { type: 'number', description: 'Price in USD' },
      productLine: {
        type: 'string',
        enum: ['Street', 'Sport', 'Trophy', 'ST-40', 'ST-60', 'ST-22', 'ST-41', 'ST-43'],
        description: 'StopTech product line or caliper model',
      },
      category: {
        type: 'string',
        enum: ['big_brake_kit', 'rotors', 'pads', 'calipers', 'lines'],
        description: 'Product category',
      },
      specifications: {
        type: 'object',
        properties: {
          rotorDiameter: { type: 'string', description: 'Rotor diameter (e.g., 355mm)' },
          pistonCount: { type: 'number', description: 'Number of caliper pistons' },
          position: { type: 'string', enum: ['front', 'rear', 'front_and_rear'] },
        },
      },
      fitment: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            make: { type: 'string' },
            model: { type: 'string' },
            years: { type: 'string' },
          },
        },
      },
    },
    required: ['name'],
  },

  categoryMap: {
    'big brake kit': 'brakes',
    'brake kit': 'brakes',
    rotors: 'brakes',
    'brake rotors': 'brakes',
    pads: 'brakes',
    'brake pads': 'brakes',
    calipers: 'brakes',
    lines: 'brakes',
    'brake lines': 'brakes',
  },
};

// ============================================================================
// Z1 Motorsports (Nissan specialist)
// ============================================================================

export const Z1_CONFIG = {
  vendorKey: 'z1motorsports',
  vendorName: 'Z1 Motorsports',
  vendorUrl: 'https://www.z1motorsports.com',
  families: ['nissan'],
  confidenceBase: 0.78,

  urlPatterns: [
    /z1motorsports\.com\/p\//,
    /z1motorsports\.com\/.*\/products\//,
  ],

  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Product name' },
      partNumber: { type: 'string', description: 'Part number/SKU' },
      price: { type: 'number', description: 'Price in USD' },
      brand: { type: 'string', description: 'Manufacturer' },
      category: { type: 'string', description: 'Product category' },
      description: { type: 'string' },
      fitment: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            model: { type: 'string', description: 'Vehicle model (350Z, 370Z, GT-R, etc.)' },
            years: { type: 'string' },
            engine: { type: 'string', description: 'Engine code (VQ35, VQ37, VR38)' },
          },
        },
      },
    },
    required: ['name'],
  },

  categoryMap: {
    'turbo kits': 'forced_induction',
    'supercharger kits': 'forced_induction',
    intakes: 'intake',
    exhaust: 'exhaust',
    suspension: 'suspension',
    brakes: 'brakes',
    'fuel system': 'fuel_system',
    'engine internals': 'engine',
    cooling: 'cooling',
  },
};

// ============================================================================
// All Vendor Configs
// ============================================================================

export const VENDOR_EXTRACTORS = {
  apr: APR_CONFIG,
  cobbtuning: COBB_CONFIG,
  kw: KW_CONFIG,
  stoptech: STOPTECH_CONFIG,
  z1motorsports: Z1_CONFIG,
};

/**
 * Get extractor config for a vendor
 * @param {string} vendorKey
 * @returns {Object|null}
 */
export function getExtractorConfig(vendorKey) {
  return VENDOR_EXTRACTORS[vendorKey] || null;
}

/**
 * Get all configured extractors
 * @returns {string[]}
 */
export function getConfiguredExtractors() {
  return Object.keys(VENDOR_EXTRACTORS);
}

/**
 * Map extracted category to AutoRev category
 * @param {string} category - Extracted category
 * @param {string} vendorKey - Vendor key
 * @returns {string}
 */
export function mapExtractedCategory(category, vendorKey) {
  if (!category) return 'other';

  const config = VENDOR_EXTRACTORS[vendorKey];
  if (!config?.categoryMap) return 'other';

  const lowerCat = category.toLowerCase();

  // Try exact match
  if (config.categoryMap[lowerCat]) {
    return config.categoryMap[lowerCat];
  }

  // Try partial match
  for (const [key, value] of Object.entries(config.categoryMap)) {
    if (lowerCat.includes(key.toLowerCase())) {
      return value;
    }
  }

  return 'other';
}

export default {
  VENDOR_EXTRACTORS,
  BASE_PARTS_SCHEMA,
  getExtractorConfig,
  getConfiguredExtractors,
  mapExtractedCategory,
};
