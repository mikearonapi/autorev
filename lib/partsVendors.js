/**
 * Parts vendor shortlist by brand family + ingestion strategy.
 *
 * This is used to prioritize ingestion work and to keep the pipeline systematic.
 * "ingestion" values are implementation hints, not guarantees (some vendors will
 * require affiliate feeds / permission / robots-toS review).
 */

export const PARTS_VENDOR_INGESTION = {
  SHOPIFY_JSON: 'shopify_json', // /products.json (best-case)
  AFFILIATE_FEED: 'affiliate_feed', // Rakuten/CJ/etc (preferred for scale + compliance)
  SITEMAP_SCRAPE: 'sitemap_scrape', // careful: ToS/robots/legal
  MANUAL_EXPORT: 'manual_export', // CSV/JSON export or partner-provided feed
};

export const PARTS_VENDOR_SHORTLIST = [
  // ===========================================================================
  // VAG (VW / Audi) — pilot family (strong aftermarket + clean platform tags)
  // ===========================================================================
  {
    family: 'vag',
    vendors: [
      {
        name: 'Integrated Engineering',
        key: 'performancebyie',
        url: 'https://performancebyie.com',
        ingestion: PARTS_VENDOR_INGESTION.SHOPIFY_JSON,
        notes: 'Good platform tags (MK7/MK8/8V/8Y). Great pilot source.',
      },
      {
        name: 'EQTuning',
        key: 'eqtuning',
        url: 'https://eqtuning.com',
        ingestion: PARTS_VENDOR_INGESTION.SHOPIFY_JSON,
        notes: 'Shopify feed exposed; strong MQB (Mk7 GTI/Golf R) tagging. Great second source.',
      },
      {
        name: 'BMP Tuning',
        key: 'bmptuning',
        url: 'https://www.bmptuning.com',
        ingestion: PARTS_VENDOR_INGESTION.SHOPIFY_JSON,
        notes: 'Shopify feed exposed; tag format like "MK7 GTI 2.0T I4 [MQB]". Good breadth.',
      },
      {
        name: 'ECS Tuning',
        key: 'ecstuning',
        url: 'https://www.ecstuning.com',
        ingestion: PARTS_VENDOR_INGESTION.AFFILIATE_FEED,
        notes: 'Huge catalog; likely best via Rakuten affiliate datafeed.',
      },
      {
        name: 'APR',
        key: 'apr',
        url: 'https://www.goapr.com',
        ingestion: PARTS_VENDOR_INGESTION.MANUAL_EXPORT,
        notes: 'Tuning + hardware; may require partner feed.',
      },
      {
        name: 'Unitronic',
        key: 'unitronic',
        url: 'https://www.getunitronic.com',
        ingestion: PARTS_VENDOR_INGESTION.MANUAL_EXPORT,
        notes: 'ECU/TCU software + hardware; may require partner feed.',
      },
      {
        name: '034Motorsport',
        key: '034motorsport',
        url: 'https://www.034motorsport.com',
        ingestion: PARTS_VENDOR_INGESTION.MANUAL_EXPORT,
        notes: 'Excellent VAG coverage; may require permission or dealer feed.',
      },
      {
        name: 'FCP Euro',
        key: 'fcpeuro',
        url: 'https://www.fcpeuro.com',
        ingestion: PARTS_VENDOR_INGESTION.AFFILIATE_FEED,
        notes: 'OEM/OE parts; strong for maintenance + wear items (completeness).',
      },
    ],
  },

  // ===========================================================================
  // BMW
  // ===========================================================================
  {
    family: 'bmw',
    vendors: [
      { name: 'FCP Euro', key: 'fcpeuro', url: 'https://www.fcpeuro.com', ingestion: PARTS_VENDOR_INGESTION.AFFILIATE_FEED },
      { name: 'Turner Motorsport', key: 'turnermotorsport', url: 'https://www.turnermotorsport.com', ingestion: PARTS_VENDOR_INGESTION.AFFILIATE_FEED },
      { name: 'BimmerWorld', key: 'bimmerworld', url: 'https://www.bimmerworld.com', ingestion: PARTS_VENDOR_INGESTION.MANUAL_EXPORT },
      { name: 'ECS Tuning', key: 'ecstuning', url: 'https://www.ecstuning.com', ingestion: PARTS_VENDOR_INGESTION.AFFILIATE_FEED },
    ],
  },

  // ===========================================================================
  // Porsche
  // ===========================================================================
  {
    family: 'porsche',
    vendors: [
      { name: 'FCP Euro', key: 'fcpeuro', url: 'https://www.fcpeuro.com', ingestion: PARTS_VENDOR_INGESTION.AFFILIATE_FEED },
      { name: 'Pelican Parts', key: 'pelican', url: 'https://www.pelicanparts.com', ingestion: PARTS_VENDOR_INGESTION.MANUAL_EXPORT },
      { name: 'Suncoast Porsche', key: 'suncoast', url: 'https://www.suncoastparts.com', ingestion: PARTS_VENDOR_INGESTION.MANUAL_EXPORT },
      { name: 'Rennline', key: 'rennline', url: 'https://www.rennline.com', ingestion: PARTS_VENDOR_INGESTION.MANUAL_EXPORT },
    ],
  },

  // ===========================================================================
  // Subaru
  // ===========================================================================
  {
    family: 'subaru',
    vendors: [
      { name: 'Cobb Tuning', key: 'cobbtuning', url: 'https://www.cobbtuning.com', ingestion: PARTS_VENDOR_INGESTION.MANUAL_EXPORT },
      { name: 'IAG Performance', key: 'iagperformance', url: 'https://www.iagperformance.com', ingestion: PARTS_VENDOR_INGESTION.MANUAL_EXPORT },
      { name: 'RallySport Direct', key: 'rallysportdirect', url: 'https://www.rallysportdirect.com', ingestion: PARTS_VENDOR_INGESTION.AFFILIATE_FEED },
      { name: 'FT Speed', key: 'ftspeed', url: 'https://www.ftspeed.com', ingestion: PARTS_VENDOR_INGESTION.SHOPIFY_JSON },
    ],
  },

  // ===========================================================================
  // Toyota / Lexus
  // ===========================================================================
  {
    family: 'toyota',
    vendors: [
      { name: 'FT Speed', key: 'ftspeed', url: 'https://www.ftspeed.com', ingestion: PARTS_VENDOR_INGESTION.SHOPIFY_JSON, notes: 'GR86/BRZ/GR Supra/GR Corolla specialist' },
      { name: 'Titan Motorsports', key: 'titanmotorsports', url: 'https://www.titanmotorsports.com', ingestion: PARTS_VENDOR_INGESTION.SHOPIFY_JSON, notes: 'Toyota Supra specialist' },
      { name: 'MAPerformance', key: 'maperformance', url: 'https://www.maperformance.com', ingestion: PARTS_VENDOR_INGESTION.SHOPIFY_JSON, notes: 'Multi-brand imports' },
    ],
  },

  // ===========================================================================
  // Honda / Acura
  // ===========================================================================
  {
    family: 'honda',
    vendors: [
      { name: 'JHP USA', key: 'jhpusa', url: 'https://www.jhpusa.com', ingestion: PARTS_VENDOR_INGESTION.SHOPIFY_JSON, notes: 'Honda/Acura specialist' },
      { name: 'PRL Motorsports', key: 'prlmotorsports', url: 'https://www.prlmotorsports.com', ingestion: PARTS_VENDOR_INGESTION.MANUAL_EXPORT, notes: 'Civic Type R specialist' },
      { name: '27WON Performance', key: '27won', url: 'https://www.27won.com', ingestion: PARTS_VENDOR_INGESTION.MANUAL_EXPORT, notes: 'Honda performance' },
    ],
  },

  // ===========================================================================
  // GM (Corvette/Camaro) + Ford (Mustang)
  // ===========================================================================
  {
    family: 'domestic',
    vendors: [
      { name: 'Summit Racing', key: 'summitracing', url: 'https://www.summitracing.com', ingestion: PARTS_VENDOR_INGESTION.AFFILIATE_FEED },
      { name: 'JEGS', key: 'jegs', url: 'https://www.jegs.com', ingestion: PARTS_VENDOR_INGESTION.AFFILIATE_FEED },
      { name: 'Ford Performance', key: 'fordperformance', url: 'https://performanceparts.ford.com', ingestion: PARTS_VENDOR_INGESTION.MANUAL_EXPORT },
      { name: 'Chevrolet Performance', key: 'chevroletperformance', url: 'https://www.chevrolet.com/performance-parts', ingestion: PARTS_VENDOR_INGESTION.MANUAL_EXPORT },
      { name: 'MAPerformance', key: 'maperformance', url: 'https://www.maperformance.com', ingestion: PARTS_VENDOR_INGESTION.SHOPIFY_JSON },
    ],
  },

  // ===========================================================================
  // Mitsubishi
  // ===========================================================================
  {
    family: 'mitsubishi',
    vendors: [
      { name: 'MAPerformance', key: 'maperformance', url: 'https://www.maperformance.com', ingestion: PARTS_VENDOR_INGESTION.SHOPIFY_JSON, notes: 'Evo X specialist' },
      { name: 'AMS Performance', key: 'amsperformance', url: 'https://www.amsperformance.com', ingestion: PARTS_VENDOR_INGESTION.MANUAL_EXPORT, notes: 'Evo turbo kits' },
    ],
  },
];

export function getVendorsForFamily(family) {
  return PARTS_VENDOR_SHORTLIST.find(f => f.family === family)?.vendors || [];
}















