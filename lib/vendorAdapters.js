/**
 * Vendor Adapters for Parts Fitment Expansion
 *
 * Multi-vendor adapter pattern for normalizing fitment data from different sources.
 * Each vendor has unique tag formats, product structures, and confidence levels.
 *
 * @module lib/vendorAdapters
 */

// ============================================================================
// CAR SLUG MAPPINGS — Canonical mappings from vendor tags to our car slugs
// ============================================================================

/**
 * Platform tag patterns mapped to our car slugs.
 * Patterns can be RegExp or exact strings.
 * Higher specificity patterns should come first.
 */
export const PLATFORM_TAG_PATTERNS = {
  // ===========================================================================
  // VAG (Volkswagen Group)
  // ===========================================================================
  vag: [
    // Audi RS3
    { pattern: /8Y[- ]?RS3/i, car_slug: 'audi-rs3-8y', confidence: 0.85 },
    { pattern: /RS3.*8Y/i, car_slug: 'audi-rs3-8y', confidence: 0.80 },
    { pattern: /8V\.?2[- ]?RS3/i, car_slug: 'audi-rs3-8v', confidence: 0.80 },
    { pattern: /8V[- ]?RS3/i, car_slug: 'audi-rs3-8v', confidence: 0.85 },
    { pattern: /RS3.*8V/i, car_slug: 'audi-rs3-8v', confidence: 0.80 },
    { pattern: /RS3.*2\.5T/i, car_slug: 'audi-rs3-8v', confidence: 0.70 },

    // Audi TT RS
    { pattern: /8S[- ]?TT\s?RS/i, car_slug: 'audi-tt-rs-8s', confidence: 0.85 },
    { pattern: /TT\s?RS.*8S/i, car_slug: 'audi-tt-rs-8s', confidence: 0.80 },
    { pattern: /8J[- ]?TT\s?RS/i, car_slug: 'audi-tt-rs-8j', confidence: 0.85 },
    { pattern: /TT\s?RS.*8J/i, car_slug: 'audi-tt-rs-8j', confidence: 0.80 },

    // Audi RS5
    { pattern: /B9[- ]?RS5/i, car_slug: 'audi-rs5-b9', confidence: 0.85 },
    { pattern: /RS5.*B9/i, car_slug: 'audi-rs5-b9', confidence: 0.80 },
    { pattern: /B8[- ]?RS5/i, car_slug: 'audi-rs5-b8', confidence: 0.85 },
    { pattern: /RS5.*B8/i, car_slug: 'audi-rs5-b8', confidence: 0.80 },

    // Audi R8
    { pattern: /R8.*V10/i, car_slug: 'audi-r8-v10', confidence: 0.85 },
    { pattern: /V10.*R8/i, car_slug: 'audi-r8-v10', confidence: 0.80 },
    { pattern: /R8.*V8/i, car_slug: 'audi-r8-v8', confidence: 0.85 },
    { pattern: /V8.*R8/i, car_slug: 'audi-r8-v8', confidence: 0.80 },

    // VW GTI
    { pattern: /MK8[- ]?GTI/i, car_slug: 'volkswagen-gti-mk8', confidence: 0.85, notes: 'No MK8 GTI in DB yet' },
    { pattern: /MK7\.?5[- ]?GTI/i, car_slug: 'volkswagen-gti-mk7', confidence: 0.80 },
    { pattern: /MK7[- ]?GTI/i, car_slug: 'volkswagen-gti-mk7', confidence: 0.85 },
    { pattern: /GTI.*MK7/i, car_slug: 'volkswagen-gti-mk7', confidence: 0.80 },
    { pattern: /GTI.*2\.0T.*\[?MQB\]?/i, car_slug: 'volkswagen-gti-mk7', confidence: 0.75 },
    { pattern: /GTI 2\.0T \(Mk7/i, car_slug: 'volkswagen-gti-mk7', confidence: 0.80 },

    // VW Golf R
    { pattern: /MK8[- ]?R(?!S)/i, car_slug: 'volkswagen-golf-r-mk8', confidence: 0.85 },
    { pattern: /Golf\s?R.*MK8/i, car_slug: 'volkswagen-golf-r-mk8', confidence: 0.80 },
    { pattern: /MK7\.?5[- ]?R(?!S)/i, car_slug: 'volkswagen-golf-r-mk7', confidence: 0.80 },
    { pattern: /MK7[- ]?R(?!S)/i, car_slug: 'volkswagen-golf-r-mk7', confidence: 0.85 },
    { pattern: /Golf\s?R.*MK7/i, car_slug: 'volkswagen-golf-r-mk7', confidence: 0.80 },
    { pattern: /Golf R 2\.0T \(Mk7/i, car_slug: 'volkswagen-golf-r-mk7', confidence: 0.80 },

    // Focus RS (technically Ford but often grouped with VAG by vendors)
    { pattern: /Focus\s?RS/i, car_slug: 'ford-focus-rs', confidence: 0.80 },
  ],

  // ===========================================================================
  // BMW
  // ===========================================================================
  bmw: [
    // M3
    { pattern: /E46[- ]?M3/i, car_slug: 'bmw-m3-e46', confidence: 0.85 },
    { pattern: /M3.*E46/i, car_slug: 'bmw-m3-e46', confidence: 0.80 },
    { pattern: /E9[02][- ]?M3/i, car_slug: 'bmw-m3-e92', confidence: 0.85 },
    { pattern: /M3.*E9[02]/i, car_slug: 'bmw-m3-e92', confidence: 0.80 },
    { pattern: /F80[- ]?M3/i, car_slug: 'bmw-m3-f80', confidence: 0.85 },
    { pattern: /M3.*F80/i, car_slug: 'bmw-m3-f80', confidence: 0.80 },
    { pattern: /G80[- ]?M3/i, car_slug: 'bmw-m3-g80', confidence: 0.85, notes: 'G80 M3 not in DB' },

    // M4
    { pattern: /F82[- ]?M4/i, car_slug: 'bmw-m4-f82', confidence: 0.85 },
    { pattern: /M4.*F82/i, car_slug: 'bmw-m4-f82', confidence: 0.80 },
    { pattern: /F83[- ]?M4/i, car_slug: 'bmw-m4-f82', confidence: 0.80, notes: 'F83 is convertible, maps to F82' },

    // M2
    { pattern: /F87[- ]?M2/i, car_slug: 'bmw-m2-competition', confidence: 0.85 },
    { pattern: /M2.*Comp/i, car_slug: 'bmw-m2-competition', confidence: 0.80 },

    // M5
    { pattern: /F90[- ]?M5/i, car_slug: 'bmw-m5-f90-competition', confidence: 0.85 },
    { pattern: /F10[- ]?M5/i, car_slug: 'bmw-m5-f10-competition', confidence: 0.85 },
    { pattern: /E60[- ]?M5/i, car_slug: 'bmw-m5-e60', confidence: 0.85 },
    { pattern: /E39[- ]?M5/i, car_slug: 'bmw-m5-e39', confidence: 0.85 },

    // 1M
    { pattern: /E82.*1M/i, car_slug: 'bmw-1m-coupe-e82', confidence: 0.85 },
    { pattern: /1M.*E82/i, car_slug: 'bmw-1m-coupe-e82', confidence: 0.80 },
    { pattern: /1\s?Series\s?M/i, car_slug: 'bmw-1m-coupe-e82', confidence: 0.75 },

    // Z4M
    { pattern: /E8[56][- ]?Z4\s?M/i, car_slug: 'bmw-z4m-e85-e86', confidence: 0.85 },
    { pattern: /Z4\s?M.*E8[56]/i, car_slug: 'bmw-z4m-e85-e86', confidence: 0.80 },

    // Generic platform codes
    { pattern: /S55/i, car_slug: 'bmw-m3-f80', confidence: 0.65, notes: 'S55 engine used in F80 M3, F82 M4' },
    { pattern: /S65/i, car_slug: 'bmw-m3-e92', confidence: 0.65, notes: 'S65 V8 in E9x M3' },
    { pattern: /S54/i, car_slug: 'bmw-m3-e46', confidence: 0.65, notes: 'S54 I6 in E46 M3' },
  ],

  // ===========================================================================
  // Porsche
  // ===========================================================================
  porsche: [
    // 718 Cayman
    { pattern: /718.*GT4/i, car_slug: '718-cayman-gt4', confidence: 0.85 },
    { pattern: /Cayman\s?GT4/i, car_slug: '718-cayman-gt4', confidence: 0.80 },
    { pattern: /718.*GTS\s?4\.0/i, car_slug: '718-cayman-gts-40', confidence: 0.85 },
    { pattern: /982.*Cayman/i, car_slug: '718-cayman-gt4', confidence: 0.75 },

    // 981 Cayman
    { pattern: /981.*GTS/i, car_slug: '981-cayman-gts', confidence: 0.85 },
    { pattern: /981.*Cayman\s?S/i, car_slug: '981-cayman-s', confidence: 0.85 },
    { pattern: /981.*Cayman/i, car_slug: '981-cayman-s', confidence: 0.70 },

    // 987 Cayman
    { pattern: /987\.?2.*Cayman/i, car_slug: '987-2-cayman-s', confidence: 0.80 },
    { pattern: /987.*Cayman/i, car_slug: '987-2-cayman-s', confidence: 0.70 },

    // 911 GT3
    { pattern: /997.*GT3/i, car_slug: 'porsche-911-gt3-997', confidence: 0.85 },
    { pattern: /996.*GT3/i, car_slug: 'porsche-911-gt3-996', confidence: 0.85 },
    { pattern: /GT3.*997/i, car_slug: 'porsche-911-gt3-997', confidence: 0.80 },

    // 911 Carrera
    { pattern: /991\.?1.*Carrera/i, car_slug: '991-1-carrera-s', confidence: 0.80 },
    { pattern: /997\.?2.*Carrera/i, car_slug: '997-2-carrera-s', confidence: 0.80 },

    // 911 Turbo
    { pattern: /997\.?2.*Turbo/i, car_slug: 'porsche-911-turbo-997-2', confidence: 0.85 },
    { pattern: /997\.?1.*Turbo/i, car_slug: 'porsche-911-turbo-997-1', confidence: 0.85 },
  ],

  // ===========================================================================
  // Nissan / Infiniti
  // ===========================================================================
  nissan: [
    { pattern: /R35.*GT-?R/i, car_slug: 'nissan-gt-r', confidence: 0.85 },
    { pattern: /GT-?R.*R35/i, car_slug: 'nissan-gt-r', confidence: 0.80 },
    { pattern: /GT-?R.*VR38/i, car_slug: 'nissan-gt-r', confidence: 0.75 },
    { pattern: /370Z.*NISMO/i, car_slug: 'nissan-370z-nismo', confidence: 0.85 },
    { pattern: /Z34.*370Z/i, car_slug: 'nissan-370z-nismo', confidence: 0.75 },
    { pattern: /370Z/i, car_slug: 'nissan-370z-nismo', confidence: 0.70 },
    { pattern: /Z33.*350Z/i, car_slug: 'nissan-350z', confidence: 0.80 },
    { pattern: /350Z/i, car_slug: 'nissan-350z', confidence: 0.70 },
    { pattern: /RZ34|Nissan\s?Z(?!\d)/i, car_slug: 'nissan-z-rz34', confidence: 0.80 },
    { pattern: /Z32.*300ZX/i, car_slug: 'nissan-300zx-twin-turbo-z32', confidence: 0.80 },
  ],

  // ===========================================================================
  // Toyota / Scion / Subaru (86 twins)
  // ===========================================================================
  toyota: [
    { pattern: /GR\s?Supra.*A90/i, car_slug: 'toyota-gr-supra', confidence: 0.85 },
    { pattern: /A90.*Supra/i, car_slug: 'toyota-gr-supra', confidence: 0.80 },
    { pattern: /MK5.*Supra/i, car_slug: 'toyota-gr-supra', confidence: 0.80 },
    { pattern: /GR\s?Supra/i, car_slug: 'toyota-gr-supra', confidence: 0.75 },
    { pattern: /A80.*Supra/i, car_slug: 'toyota-supra-mk4-a80-turbo', confidence: 0.85 },
    { pattern: /MK4.*Supra/i, car_slug: 'toyota-supra-mk4-a80-turbo', confidence: 0.80 },
    { pattern: /GR86/i, car_slug: 'toyota-gr86', confidence: 0.85 },
    { pattern: /ZN8.*86/i, car_slug: 'toyota-gr86', confidence: 0.80 },
    { pattern: /ZN6.*86|FT86|GT86/i, car_slug: 'toyota-86-scion-frs', confidence: 0.80 },
    { pattern: /FR-?S|Scion.*86/i, car_slug: 'toyota-86-scion-frs', confidence: 0.80 },
    { pattern: /ZD8.*BRZ/i, car_slug: 'subaru-brz-zd8', confidence: 0.80 },
    { pattern: /BRZ.*2nd.*Gen/i, car_slug: 'subaru-brz-zd8', confidence: 0.75 },
    { pattern: /ZC6.*BRZ/i, car_slug: 'subaru-brz-zc6', confidence: 0.80 },
    { pattern: /BRZ/i, car_slug: 'subaru-brz-zc6', confidence: 0.65 },
  ],

  // ===========================================================================
  // Subaru (WRX/STI)
  // ===========================================================================
  subaru: [
    { pattern: /VA.*STI/i, car_slug: 'subaru-wrx-sti-va', confidence: 0.85 },
    { pattern: /STI.*VA/i, car_slug: 'subaru-wrx-sti-va', confidence: 0.80 },
    { pattern: /2015.*2021.*STI/i, car_slug: 'subaru-wrx-sti-va', confidence: 0.75 },
    { pattern: /GR.*GV.*STI/i, car_slug: 'subaru-wrx-sti-gr-gv', confidence: 0.85 },
    { pattern: /Hatch.*STI/i, car_slug: 'subaru-wrx-sti-gr-gv', confidence: 0.75 },
    { pattern: /GD.*STI/i, car_slug: 'subaru-wrx-sti-gd', confidence: 0.85 },
    { pattern: /Blob.*Eye.*STI/i, car_slug: 'subaru-wrx-sti-gd', confidence: 0.75 },
  ],

  // ===========================================================================
  // Domestic (Corvette, Mustang, Camaro)
  // ===========================================================================
  domestic: [
    // Corvette
    { pattern: /C8.*Corvette|Corvette.*C8/i, car_slug: 'c8-corvette-stingray', confidence: 0.85 },
    { pattern: /C7.*Z06|Z06.*C7/i, car_slug: 'c7-corvette-z06', confidence: 0.85 },
    { pattern: /C7.*Grand\s?Sport/i, car_slug: 'c7-corvette-grand-sport', confidence: 0.85 },
    { pattern: /C6.*Z06|Z06.*C6/i, car_slug: 'chevrolet-corvette-c6-z06', confidence: 0.85 },
    { pattern: /C6.*Grand\s?Sport/i, car_slug: 'chevrolet-corvette-c6-grand-sport', confidence: 0.85 },
    { pattern: /C5.*Z06|Z06.*C5/i, car_slug: 'chevrolet-corvette-c5-z06', confidence: 0.85 },

    // Camaro
    { pattern: /ZL1.*Camaro|Camaro.*ZL1/i, car_slug: 'camaro-zl1', confidence: 0.85 },
    { pattern: /SS.*1LE|1LE.*SS/i, car_slug: 'camaro-ss-1le', confidence: 0.85 },
    { pattern: /6th.*Gen.*Camaro.*SS/i, car_slug: 'camaro-ss-1le', confidence: 0.75 },

    // Mustang
    { pattern: /GT350/i, car_slug: 'shelby-gt350', confidence: 0.85 },
    { pattern: /GT500/i, car_slug: 'shelby-gt500', confidence: 0.85 },
    { pattern: /S550.*GT|Mustang.*GT.*2015/i, car_slug: 'mustang-gt-pp2', confidence: 0.75 },
    { pattern: /Boss\s?302/i, car_slug: 'ford-mustang-boss-302', confidence: 0.85 },

    // Hellcat
    { pattern: /Challenger.*Hellcat/i, car_slug: 'dodge-challenger-hellcat', confidence: 0.85 },
    { pattern: /Charger.*Hellcat/i, car_slug: 'dodge-charger-hellcat', confidence: 0.85 },
    { pattern: /Challenger.*392/i, car_slug: 'dodge-challenger-srt-392', confidence: 0.85 },
    { pattern: /Charger.*392/i, car_slug: 'dodge-charger-srt-392', confidence: 0.85 },

    // Cadillac CTS-V
    { pattern: /CTS-?V.*Gen\s?2/i, car_slug: 'cadillac-cts-v-gen2', confidence: 0.85 },
    { pattern: /CTS-?V.*Gen\s?3/i, car_slug: 'cadillac-cts-v-gen3', confidence: 0.85 },

    // Dodge Viper
    { pattern: /Dodge.*Viper|Viper/i, car_slug: 'dodge-viper', confidence: 0.85 },
  ],

  // ===========================================================================
  // Honda / Acura
  // ===========================================================================
  honda: [
    { pattern: /FK8.*Type\s?R|CTR.*FK8/i, car_slug: 'honda-civic-type-r-fk8', confidence: 0.85 },
    { pattern: /FL5.*Type\s?R|CTR.*FL5/i, car_slug: 'honda-civic-type-r-fl5', confidence: 0.85 },
    { pattern: /AP1.*S2000|AP2.*S2000/i, car_slug: 'honda-s2000', confidence: 0.85 },
    { pattern: /S2000/i, car_slug: 'honda-s2000', confidence: 0.70 },
    { pattern: /DC2.*Integra.*Type\s?R/i, car_slug: 'acura-integra-type-r-dc2', confidence: 0.85 },
  ],

  // ===========================================================================
  // Mazda
  // ===========================================================================
  mazda: [
    { pattern: /ND.*Miata|ND.*MX-?5/i, car_slug: 'mazda-mx5-miata-nd', confidence: 0.85 },
    { pattern: /NC.*Miata|NC.*MX-?5/i, car_slug: 'mazda-mx5-miata-nc', confidence: 0.85 },
    { pattern: /NB.*Miata|NB.*MX-?5/i, car_slug: 'mazda-mx5-miata-nb', confidence: 0.85 },
    { pattern: /NA.*Miata|NA.*MX-?5/i, car_slug: 'mazda-mx5-miata-na', confidence: 0.85 },
    { pattern: /FD3?S.*RX-?7|RX-?7.*FD/i, car_slug: 'mazda-rx7-fd3s', confidence: 0.85 },
  ],

  // ===========================================================================
  // Mitsubishi
  // ===========================================================================
  mitsubishi: [
    { pattern: /Evo\s?X|Evo\s?10|CZ4A/i, car_slug: 'mitsubishi-lancer-evo-x', confidence: 0.85 },
    { pattern: /Evo\s?[89]|Evo\s?VIII|Evo\s?IX|CT9A/i, car_slug: 'mitsubishi-lancer-evo-8-9', confidence: 0.85 },
  ],

  // ===========================================================================
  // Mercedes / Mercedes-AMG
  // ===========================================================================
  mercedes: [
    { pattern: /W204.*C63|C63.*W204/i, car_slug: 'mercedes-c63-amg-w204', confidence: 0.85 },
    { pattern: /W205.*C63|C63.*W205/i, car_slug: 'mercedes-amg-c63-w205', confidence: 0.85 },
    { pattern: /W212.*E63|E63.*W212/i, car_slug: 'mercedes-amg-e63-w212', confidence: 0.85 },
    { pattern: /W213.*E63\s?S|E63\s?S.*W213/i, car_slug: 'mercedes-amg-e63s-w213', confidence: 0.85 },
    { pattern: /AMG\s?GT|Mercedes-?AMG\s?GT/i, car_slug: 'mercedes-amg-gt', confidence: 0.85 },
  ],

  // ===========================================================================
  // Misc / Exotic / Other
  // ===========================================================================
  misc: [
    // Alfa Romeo
    { pattern: /Alfa.*4C|\b4C\b/i, car_slug: 'alfa-romeo-4c', confidence: 0.85 },
    { pattern: /Giulia.*Quadrifoglio|Quadrifoglio/i, car_slug: 'alfa-romeo-giulia-quadrifoglio', confidence: 0.85 },

    // Aston Martin
    { pattern: /Aston.*Vantage|V8\s?Vantage/i, car_slug: 'aston-martin-v8-vantage', confidence: 0.85 },

    // Jaguar
    { pattern: /F-?Type.*V6\s?S/i, car_slug: 'jaguar-f-type-v6-s', confidence: 0.85 },
    { pattern: /F-?Type.*\bR\b|F-?Type\s?R/i, car_slug: 'jaguar-f-type-r', confidence: 0.85 },

    // Lamborghini
    { pattern: /Gallardo/i, car_slug: 'lamborghini-gallardo', confidence: 0.85 },

    // Lexus
    { pattern: /LC\s?500|Lexus.*LC/i, car_slug: 'lexus-lc-500', confidence: 0.85 },
    { pattern: /RC\s?F|RCF/i, car_slug: 'lexus-rc-f', confidence: 0.85 },

    // Lotus
    { pattern: /Elise.*S2|Lotus.*Elise/i, car_slug: 'lotus-elise-s2', confidence: 0.85 },
    { pattern: /Emira/i, car_slug: 'lotus-emira', confidence: 0.85 },
    { pattern: /Evora\s?GT/i, car_slug: 'lotus-evora-gt', confidence: 0.85 },
    { pattern: /Evora\s?S/i, car_slug: 'lotus-evora-s', confidence: 0.85 },
    { pattern: /Exige\s?S/i, car_slug: 'lotus-exige-s', confidence: 0.85 },

    // Maserati
    { pattern: /GranTurismo/i, car_slug: 'maserati-granturismo', confidence: 0.85 },

    // Tesla
    { pattern: /Model\s?3.*Performance|Tesla.*Model\s?3.*Performance|M3P/i, car_slug: 'tesla-model-3-performance', confidence: 0.85 },
  ],
};

// ============================================================================
// VENDOR CONFIGURATIONS
// ============================================================================

export const VENDOR_CONFIGS = {
  // ---------------------------------------------------------------------------
  // VAG Vendors (Shopify JSON)
  // ---------------------------------------------------------------------------
  performancebyie: {
    vendorKey: 'performancebyie',
    vendorName: 'Integrated Engineering',
    vendorUrl: 'https://performancebyie.com',
    ingestionType: 'shopify_json',
    families: ['vag'],
    tagField: 'tags', // Shopify tags field
    tagSeparator: ',',
    confidenceBase: 0.75,
    notes: 'Strong platform tags (MK7/MK8/8V/8Y)',
  },
  eqtuning: {
    vendorKey: 'eqtuning',
    vendorName: 'EQTuning',
    vendorUrl: 'https://eqtuning.com',
    ingestionType: 'shopify_json',
    families: ['vag'],
    tagField: 'tags',
    tagSeparator: ',',
    confidenceBase: 0.72,
    notes: 'Good MQB tagging',
  },
  bmptuning: {
    vendorKey: 'bmptuning',
    vendorName: 'BMP Tuning',
    vendorUrl: 'https://www.bmptuning.com',
    ingestionType: 'shopify_json',
    families: ['vag'],
    tagField: 'tags',
    tagSeparator: ',',
    confidenceBase: 0.70,
    notes: 'Tags like "MK7 GTI 2.0T I4 [MQB]"',
  },

  // ---------------------------------------------------------------------------
  // BMW Vendors (Candidates - need verification)
  // ---------------------------------------------------------------------------
  turnermotorsport: {
    vendorKey: 'turnermotorsport',
    vendorName: 'Turner Motorsport',
    vendorUrl: 'https://www.turnermotorsport.com',
    ingestionType: 'affiliate_feed', // Large catalog, better via affiliate
    families: ['bmw'],
    confidenceBase: 0.70,
    notes: 'Large BMW catalog; may need CJ/Rakuten feed',
  },

  // ---------------------------------------------------------------------------
  // Porsche Vendors
  // ---------------------------------------------------------------------------
  rennline: {
    vendorKey: 'rennline',
    vendorName: 'Rennline',
    vendorUrl: 'https://www.rennline.com',
    ingestionType: 'manual_export', // Need to verify if Shopify
    families: ['porsche'],
    confidenceBase: 0.70,
    notes: 'Porsche specialist; fitment by model selector',
  },
  suncoast: {
    vendorKey: 'suncoast',
    vendorName: 'Suncoast Porsche',
    vendorUrl: 'https://www.suncoastparts.com',
    ingestionType: 'manual_export',
    families: ['porsche'],
    confidenceBase: 0.72,
    notes: 'Porsche parts specialist',
  },

  // ---------------------------------------------------------------------------
  // Nissan/JDM Vendors
  // ---------------------------------------------------------------------------
  z1motorsports: {
    vendorKey: 'z1motorsports',
    vendorName: 'Z1 Motorsports',
    vendorUrl: 'https://www.z1motorsports.com',
    ingestionType: 'manual_export', // Custom platform
    families: ['nissan'],
    confidenceBase: 0.75,
    notes: 'Nissan Z specialist (350Z, 370Z, GT-R)',
  },

  // ---------------------------------------------------------------------------
  // Multi-Brand Vendors
  // ---------------------------------------------------------------------------
  fcpeuro: {
    vendorKey: 'fcpeuro',
    vendorName: 'FCP Euro',
    vendorUrl: 'https://www.fcpeuro.com',
    ingestionType: 'affiliate_feed',
    families: ['vag', 'bmw', 'porsche'],
    confidenceBase: 0.70,
    notes: 'Best for OEM/OE parts; Rakuten affiliate feed available',
  },
  ecstuning: {
    vendorKey: 'ecstuning',
    vendorName: 'ECS Tuning',
    vendorUrl: 'https://www.ecstuning.com',
    ingestionType: 'affiliate_feed',
    families: ['vag', 'bmw', 'porsche'],
    confidenceBase: 0.68,
    notes: 'Huge catalog; Rakuten affiliate feed',
  },
  summitracing: {
    vendorKey: 'summitracing',
    vendorName: 'Summit Racing',
    vendorUrl: 'https://www.summitracing.com',
    ingestionType: 'affiliate_feed',
    families: ['domestic'],
    confidenceBase: 0.65,
    notes: 'Domestic performance; CJ Affiliate feed',
  },

  // ---------------------------------------------------------------------------
  // Toyota/Subaru Vendors
  // ---------------------------------------------------------------------------
  ftspeed: {
    vendorKey: 'ftspeed',
    vendorName: 'FT Speed',
    vendorUrl: 'https://www.ftspeed.com',
    ingestionType: 'shopify_json', // Verify
    families: ['toyota', 'subaru'],
    confidenceBase: 0.72,
    notes: 'BRZ/86/GR86 specialist',
  },
  rallysportdirect: {
    vendorKey: 'rallysportdirect',
    vendorName: 'RallySport Direct',
    vendorUrl: 'https://www.rallysportdirect.com',
    ingestionType: 'affiliate_feed',
    families: ['subaru', 'toyota'],
    confidenceBase: 0.70,
    notes: 'Subaru specialist; affiliate feed',
  },

  // ---------------------------------------------------------------------------
  // Honda Vendors
  // ---------------------------------------------------------------------------
  jhpusa: {
    vendorKey: 'jhpusa',
    vendorName: 'JHP USA',
    vendorUrl: 'https://www.jhpusa.com',
    ingestionType: 'manual_export',
    families: ['honda'],
    confidenceBase: 0.70,
    notes: 'Honda/Acura specialist',
  },
};

// ============================================================================
// ADAPTER FUNCTIONS
// ============================================================================

/**
 * Resolve car slug from a tag string using pattern matching.
 *
 * @param {string} tag - The vendor tag to match
 * @param {string[]} families - Families to search (e.g., ['vag', 'bmw'])
 * @returns {{ car_slug: string, confidence: number, notes?: string } | null}
 */
export function resolveCarSlugFromTag(tag, families = []) {
  if (!tag || typeof tag !== 'string') return null;

  const normalized = tag.trim();
  const familiesToSearch = families.length > 0 ? families : Object.keys(PLATFORM_TAG_PATTERNS);

  for (const family of familiesToSearch) {
    const patterns = PLATFORM_TAG_PATTERNS[family];
    if (!patterns) continue;

    for (const entry of patterns) {
      const { pattern, car_slug, confidence, notes } = entry;

      if (pattern instanceof RegExp) {
        if (pattern.test(normalized)) {
          return { car_slug, confidence, notes, matched_pattern: pattern.toString(), family };
        }
      } else if (typeof pattern === 'string') {
        if (normalized.toLowerCase() === pattern.toLowerCase()) {
          return { car_slug, confidence, notes, matched_pattern: pattern, family };
        }
      }
    }
  }

  return null;
}

/**
 * Resolve all possible car slugs from a list of tags.
 * Returns unique results sorted by confidence (highest first).
 *
 * @param {string[]} tags - Array of vendor tags
 * @param {string[]} families - Families to search
 * @returns {Array<{ car_slug: string, confidence: number, tags: string[] }>}
 */
export function resolveCarSlugsFromTags(tags, families = []) {
  if (!Array.isArray(tags) || tags.length === 0) return [];

  const resultsBySlug = new Map();

  for (const tag of tags) {
    const match = resolveCarSlugFromTag(tag, families);
    if (!match) continue;

    const existing = resultsBySlug.get(match.car_slug);
    if (existing) {
      // Keep highest confidence and accumulate tags
      existing.confidence = Math.max(existing.confidence, match.confidence);
      existing.tags.push(tag);
    } else {
      resultsBySlug.set(match.car_slug, {
        car_slug: match.car_slug,
        confidence: match.confidence,
        tags: [tag],
        family: match.family,
        notes: match.notes,
      });
    }
  }

  return [...resultsBySlug.values()].sort((a, b) => b.confidence - a.confidence);
}

/**
 * Get vendor configuration by key.
 * @param {string} vendorKey
 * @returns {object | undefined}
 */
export function getVendorConfig(vendorKey) {
  return VENDOR_CONFIGS[vendorKey];
}

/**
 * Get all vendors for a specific family (e.g., 'bmw', 'porsche').
 * @param {string} family
 * @returns {object[]}
 */
export function getVendorsForFamily(family) {
  return Object.values(VENDOR_CONFIGS).filter((v) => v.families?.includes(family));
}

/**
 * Get all vendors that support Shopify JSON ingestion.
 * @returns {object[]}
 */
export function getShopifyVendors() {
  return Object.values(VENDOR_CONFIGS).filter((v) => v.ingestionType === 'shopify_json');
}

/**
 * Parse Shopify product tags into normalized array.
 * @param {string | string[]} tags
 * @returns {string[]}
 */
export function parseShopifyTags(tags) {
  if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean);
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Generate fitment suggestions for a product based on its tags.
 * Returns all possible fitments with confidence scores.
 *
 * @param {object} product - Shopify product object
 * @param {object} vendorConfig - Vendor configuration
 * @returns {Array<{ car_slug: string, confidence: number, source_tag: string }>}
 */
export function suggestFitmentsForProduct(product, vendorConfig) {
  const tags = parseShopifyTags(product?.tags);
  const families = vendorConfig?.families || [];
  const baseConfidence = vendorConfig?.confidenceBase || 0.70;

  const matches = resolveCarSlugsFromTags(tags, families);

  return matches.map((m) => ({
    car_slug: m.car_slug,
    confidence: Math.min(1.0, m.confidence * (baseConfidence / 0.70)), // Adjust by vendor
    source_tags: m.tags,
    family: m.family,
    notes: m.notes,
  }));
}

// ============================================================================
// PRIORITY CARS FOR EXPANSION
// ============================================================================

/**
 * Priority tiers for fitment expansion.
 * Tier 1 = highest demand, expand first.
 */
export const PRIORITY_CARS = {
  tier1: [
    'bmw-m3-e46',
    'bmw-m3-e92',
    'bmw-m3-f80',
    'bmw-m4-f82',
    '718-cayman-gt4',
    '718-cayman-gts-40',
    '981-cayman-gts',
    'c8-corvette-stingray',
    'c7-corvette-z06',
    'toyota-gr-supra',
  ],
  tier2: [
    'shelby-gt350',
    'mustang-gt-pp2',
    'camaro-zl1',
    'camaro-ss-1le',
    'toyota-gr86',
    'subaru-brz-zd8',
    'nissan-370z-nismo',
    'nissan-gt-r',
    'mazda-mx5-miata-nd',
    'mazda-mx5-miata-nc',
    'honda-civic-type-r-fk8',
    'honda-civic-type-r-fl5',
    'honda-s2000',
    'porsche-911-gt3-997',
    'volkswagen-golf-r-mk8',
  ],
  tier3: [
    'audi-tt-rs-8s',
    'audi-tt-rs-8j',
    'audi-rs5-b9',
    'bmw-m2-competition',
    'bmw-m5-f90-competition',
    'bmw-1m-coupe-e82',
    'subaru-wrx-sti-va',
    'mitsubishi-lancer-evo-x',
    'nissan-350z',
    'mazda-rx7-fd3s',
    'acura-integra-type-r-dc2',
    'ford-focus-rs',
    'chevrolet-corvette-c6-z06',
    'chevrolet-corvette-c5-z06',
    'dodge-challenger-hellcat',
  ],
};

export default {
  PLATFORM_TAG_PATTERNS,
  VENDOR_CONFIGS,
  PRIORITY_CARS,
  resolveCarSlugFromTag,
  resolveCarSlugsFromTags,
  getVendorConfig,
  getVendorsForFamily,
  getShopifyVendors,
  parseShopifyTags,
  suggestFitmentsForProduct,
};





