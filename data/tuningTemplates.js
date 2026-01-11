/**
 * Platform-Based Tuning Templates
 * 
 * These templates provide accurate tuning data at the ENGINE PLATFORM level,
 * not at the individual car level. This prevents data contamination between
 * different cars and ensures accuracy.
 * 
 * Each template is keyed by the platform key from lib/enginePlatforms.js
 * 
 * Data structure matches car_tuning_profiles table schema for easy insertion.
 */

export const TUNING_TEMPLATES = {
  // ============================================================================
  // AUDI 2.9L TFSI Twin-Turbo V6 (RS5 B9, RS4 B9)
  // ============================================================================
  '29_TFSI': {
    engine_family: '2.9L TFSI Twin-Turbo V6',
    tuning_focus: 'performance',
    
    // Stock power baseline (wheel horsepower/torque)
    // RS5 B9: 444 crank HP → ~377 WHP (15% drivetrain loss)
    stock_whp: 377,
    stock_wtq: 400,
    
    stage_progressions: [
      {
        key: 'stage1',
        stage: 'Stage 1',
        components: ['ECU tune'],
        hpGainLow: 50,
        hpGainHigh: 80,
        torqueGainLow: 60,
        torqueGainHigh: 100,
        costLow: 700,
        costHigh: 1200,
        requirements: ['Premium fuel (93 octane)'],
        notes: 'The 2.9 TFSI responds excellently to ECU tuning alone. Safe for daily driving.',
      },
      {
        key: 'stage2',
        stage: 'Stage 2',
        components: ['ECU tune', 'Downpipes', 'Intake', 'Charge pipes'],
        hpGainLow: 100,
        hpGainHigh: 150,
        torqueGainLow: 120,
        torqueGainHigh: 170,
        costLow: 4000,
        costHigh: 7000,
        requirements: ['High-flow or catless downpipes', 'Stage 2 specific tune'],
        notes: 'Popular configuration for enthusiasts. Significant power gains while maintaining reliability.',
      },
      {
        key: 'stage2plus',
        stage: 'Stage 2+',
        components: ['Stage 2 + FMIC', 'Full exhaust', 'E85 partial'],
        hpGainLow: 140,
        hpGainHigh: 180,
        torqueGainLow: 160,
        torqueGainHigh: 210,
        costLow: 8000,
        costHigh: 12000,
        requirements: ['Upgraded intercooler', 'E85 compatible fuel system'],
        notes: 'Pushing stock turbos near their limits. E85 blend adds significant power.',
      },
      {
        key: 'stage3',
        stage: 'Stage 3 (Hybrid Turbos)',
        components: ['Hybrid turbo upgrade', 'Full bolt-ons', 'Fuel system'],
        hpGainLow: 200,
        hpGainHigh: 280,
        torqueGainLow: 220,
        torqueGainHigh: 300,
        costLow: 15000,
        costHigh: 25000,
        requirements: ['Upgraded turbos', 'Fuel system upgrades', 'Transmission upgrades recommended'],
        notes: 'Big turbo territory. Requires supporting modifications and professional tuning.',
      },
    ],
    
    tuning_platforms: [
      {
        name: 'APR',
        url: 'https://goapr.com',
        priceLow: 700,
        priceHigh: 1200,
        notes: 'Industry standard for Audi. Excellent dealer network.',
      },
      {
        name: 'Unitronic',
        url: 'https://getunitronic.com',
        priceLow: 600,
        priceHigh: 1000,
        notes: 'Great tunes, strong community support.',
      },
      {
        name: 'HPA Motorsports',
        url: 'https://hpamotorsports.com',
        priceLow: 800,
        priceHigh: 1500,
        notes: 'Premium tuning with excellent support. Popular for RS models.',
      },
      {
        name: 'Integrated Engineering (IE)',
        url: 'https://performancebyie.com',
        priceLow: 600,
        priceHigh: 1000,
        notes: 'Excellent value. Well-researched calibrations.',
      },
      {
        name: 'Rennline',
        url: 'https://rennline.com',
        priceLow: 650,
        priceHigh: 1100,
        notes: 'Quality parts and tunes for Audi performance.',
      },
    ],
    
    power_limits: {
      stockTurbo: {
        whp: 520,
        notes: 'Stock turbos max around 500-520 WHP with full bolt-ons and E85',
      },
      stockInternals: {
        whp: 700,
        notes: '2.9 TFSI internals are robust. Most builds stay under this.',
      },
      stockTransmission: {
        tq: 550,
        notes: 'ZF 8-speed handles ~550 lb-ft with TCU tune. Consider upgrades above this.',
      },
      stockFuelSystem: {
        whp: 550,
        notes: 'Stock HPFP limits around 550 WHP. Upgrade needed for more.',
      },
    },
    
    brand_recommendations: {
      downpipes: ['AWE Tuning', 'Milltek', 'IE', 'CTS Turbo'],
      intakes: ['IE', 'APR', 'Eventuri', 'CTS Turbo'],
      intercoolers: ['Wagner', 'APR', 'CTS Turbo', 'IE'],
      exhausts: ['AWE Tuning', 'Milltek', 'Remus', 'Akrapovic'],
      suspension: ['KW', 'Bilstein', 'H&R', 'Ohlins'],
      brakes: ['Stoptech', 'AP Racing', 'Brembo'],
    },
    
    platform_insights: {
      strengths: [
        'Excellent twin-turbo V6 with strong power potential',
        'Responsive to ECU tuning with significant gains',
        'Robust internals handle significant power increases',
        'Quattro AWD provides excellent traction for power',
        'ZF 8-speed transmission shifts quickly and handles power well',
      ],
      weaknesses: [
        'Downpipes require removal of significant underbody components',
        'Heat soak can be an issue - intercooler upgrade recommended for track use',
        'Limited aftermarket compared to 2.5 TFSI platform',
        'High-flow cats still recommended over catless for emissions areas',
      ],
      community_tips: [
        'Stage 1 tune is the best bang-for-buck modification',
        'Consider TCU (transmission) tune alongside ECU tune',
        'AWE Switchpath exhaust offers best sound/drone balance',
        'Carbon cleaning recommended every 40-50k miles',
      ],
    },
    
    upgrades_by_objective: {
      power: [
        {
          name: 'ECU Tune (Stage 1)',
          tier: 'entry',
          gains: { hp: { low: 50, high: 80 } },
          cost: { low: 700, high: 1200 },
          notes: 'Best first mod. Significant gains from tune alone.',
        },
        {
          name: 'TCU Tune',
          tier: 'entry',
          gains: { hp: { low: 0, high: 0 } },
          cost: { low: 400, high: 700 },
          notes: 'Faster shifts, higher torque limits. Pairs with ECU tune.',
        },
        {
          name: 'High-Flow Downpipes',
          tier: 'mid',
          gains: { hp: { low: 20, high: 40 } },
          cost: { low: 1500, high: 3000 },
          notes: 'Required for Stage 2. Removes restriction from stock cats.',
        },
        {
          name: 'Cold Air Intake',
          tier: 'mid',
          gains: { hp: { low: 10, high: 20 } },
          cost: { low: 400, high: 800 },
          notes: 'Improved airflow and turbo sounds. Modest power gains.',
        },
        {
          name: 'Upgraded Intercooler (FMIC)',
          tier: 'mid',
          gains: { hp: { low: 15, high: 30 } },
          cost: { low: 1500, high: 3000 },
          notes: 'Reduces heat soak. Essential for track use or hot climates.',
        },
        {
          name: 'Full Exhaust System',
          tier: 'mid',
          gains: { hp: { low: 15, high: 25 } },
          cost: { low: 2500, high: 5000 },
          notes: 'Improved flow and sound. AWE Switchpath popular choice.',
        },
        {
          name: 'E85 Tune',
          tier: 'advanced',
          gains: { hp: { low: 40, high: 80 } },
          cost: { low: 500, high: 1000 },
          notes: 'Significant gains from E85 with supporting mods. Requires flex fuel kit.',
        },
        {
          name: 'Hybrid Turbo Upgrade',
          tier: 'advanced',
          gains: { hp: { low: 100, high: 180 } },
          cost: { low: 8000, high: 15000 },
          notes: 'Significantly increased turbo capacity. Requires full supporting mods.',
        },
      ],
      handling: [
        {
          name: 'Lowering Springs',
          tier: 'entry',
          gains: null,
          cost: { low: 300, high: 600 },
          notes: 'Lowers center of gravity, improves appearance. Slight handling improvement.',
        },
        {
          name: 'Adjustable Coilovers',
          tier: 'mid',
          gains: null,
          cost: { low: 2000, high: 4000 },
          notes: 'Full suspension adjustability. KW V3 popular choice.',
        },
        {
          name: 'Sway Bars',
          tier: 'mid',
          gains: null,
          cost: { low: 500, high: 1200 },
          notes: 'Reduces body roll. Adjustable rear recommended.',
        },
        {
          name: 'Alignment (Performance)',
          tier: 'entry',
          gains: null,
          cost: { low: 200, high: 400 },
          notes: 'More aggressive camber and toe for improved grip.',
        },
      ],
      braking: [
        {
          name: 'Performance Brake Pads',
          tier: 'entry',
          gains: null,
          cost: { low: 200, high: 500 },
          notes: 'Improved stopping power and fade resistance.',
        },
        {
          name: 'Stainless Brake Lines',
          tier: 'entry',
          gains: null,
          cost: { low: 150, high: 300 },
          notes: 'Improved pedal feel. Simple upgrade.',
        },
        {
          name: 'Big Brake Kit',
          tier: 'advanced',
          gains: null,
          cost: { low: 3000, high: 8000 },
          notes: 'Larger rotors and calipers for track use.',
        },
      ],
      cooling: [
        {
          name: 'Upgraded Intercooler',
          tier: 'mid',
          gains: { hp: { low: 15, high: 30 } },
          cost: { low: 1500, high: 3000 },
          notes: 'Essential for sustained performance. Wagner or CTS recommended.',
        },
        {
          name: 'Oil Cooler',
          tier: 'mid',
          gains: null,
          cost: { low: 800, high: 1500 },
          notes: 'Recommended for track use to maintain oil temps.',
        },
      ],
      sound: [
        {
          name: 'Cat-Back Exhaust',
          tier: 'entry',
          gains: { hp: { low: 5, high: 15 } },
          cost: { low: 1500, high: 3500 },
          notes: 'Improved sound without drone. AWE Touring popular.',
        },
        {
          name: 'Valved Exhaust (Switchpath)',
          tier: 'mid',
          gains: { hp: { low: 10, high: 20 } },
          cost: { low: 3000, high: 5000 },
          notes: 'Quiet when needed, loud when wanted. Best of both worlds.',
        },
        {
          name: 'Full Turbo-Back Exhaust',
          tier: 'mid',
          gains: { hp: { low: 20, high: 40 } },
          cost: { low: 4000, high: 7000 },
          notes: 'Maximum flow and sound. Includes downpipes.',
        },
      ],
      aero: [
        {
          name: 'Front Lip/Splitter',
          tier: 'entry',
          gains: null,
          cost: { low: 300, high: 800 },
          notes: 'Improved front-end appearance and minor downforce.',
        },
        {
          name: 'Rear Spoiler/Wing',
          tier: 'mid',
          gains: null,
          cost: { low: 500, high: 2000 },
          notes: 'Added rear downforce for high-speed stability.',
        },
      ],
    },
    
    data_quality_tier: 'researched',
    data_sources: {
      has_manual_research: true,
      has_community_data: true,
      has_youtube: false,
      source_notes: 'Based on community forums, tuner documentation, and owner experiences.',
    },
  },
  
  // ============================================================================
  // AUDI 2.5L TFSI 5-Cylinder (RS3, TT RS) - For comparison
  // ============================================================================
  '25_TFSI': {
    engine_family: '2.5L TFSI 5-Cylinder',
    tuning_focus: 'performance',
    stock_whp: 340,
    stock_wtq: 360,
    
    stage_progressions: [
      {
        key: 'stage1',
        stage: 'Stage 1',
        components: ['ECU tune only'],
        hpGainLow: 60,
        hpGainHigh: 90,
        torqueGainLow: 80,
        torqueGainHigh: 120,
        costLow: 500,
        costHigh: 800,
        requirements: ['Premium fuel (93+)'],
        notes: 'The 2.5 TFSI responds incredibly well to tuning.',
      },
      {
        key: 'stage2',
        stage: 'Stage 2',
        components: ['Tune', 'Downpipe', 'Intake', 'FMIC'],
        hpGainLow: 100,
        hpGainHigh: 150,
        torqueGainLow: 130,
        torqueGainHigh: 180,
        costLow: 3000,
        costHigh: 5000,
        requirements: ['Catless or high-flow downpipe'],
        notes: 'Popular power level for daily driving.',
      },
      {
        key: 'stage3',
        stage: 'Stage 3',
        components: ['Turbo upgrade', 'Fuel system', 'Built engine optional'],
        hpGainLow: 180,
        hpGainHigh: 280,
        torqueGainLow: 200,
        torqueGainHigh: 320,
        costLow: 8000,
        costHigh: 15000,
        requirements: ['Big turbo kit', 'Supporting mods'],
        notes: '600+ WHP achievable with big turbo.',
      },
    ],
    
    tuning_platforms: [
      { name: 'APR', url: 'https://goapr.com', priceLow: 600, priceHigh: 900, notes: 'Industry standard for Audi' },
      { name: 'Unitronic', url: 'https://getunitronic.com', priceLow: 500, priceHigh: 700, notes: 'Great tunes, popular choice' },
      { name: 'Integrated Engineering', url: 'https://performancebyie.com', priceLow: 450, priceHigh: 650, notes: 'Excellent value' },
      { name: 'EQT', url: 'https://eqtuning.com', priceLow: 175, priceHigh: 300, notes: 'Best value, flat rate' },
    ],
    
    power_limits: {
      stockTurbo: { whp: 450, notes: 'Stock turbo maxes around 450 WHP' },
      stockInternals: { whp: 600, notes: '2.5 TFSI internals are strong' },
      stockTransmission: { tq: 500, notes: 'DSG handles ~500 lb-ft with tune' },
    },
    
    brand_recommendations: {
      downpipes: ['AWE', 'IE', 'Unitronic', 'Wagner'],
      intakes: ['IE', 'APR', 'Eventuri', 'CTS'],
      intercoolers: ['Wagner', 'APR', 'CTS', 'IE'],
      exhausts: ['AWE', 'Milltek', 'Remus', 'Akrapovic'],
    },
    
    platform_insights: {
      strengths: [
        'Legendary 5-cylinder sound and character',
        'Extremely responsive to tuning modifications',
        'Robust internals handle significant power',
        'Strong aftermarket support',
      ],
      weaknesses: [
        'Carbon buildup on intake valves (direct injection)',
        'DSG service intervals important for reliability',
        'Haldex AWD less capable than Quattro in higher models',
      ],
      community_tips: [
        'Walnut blast intake valves every 40-50k miles',
        'DSG fluid change every 40k miles when tuned',
        'EQT offers excellent value for tunes',
      ],
    },
    
    upgrades_by_objective: {
      power: [
        { name: 'ECU Tune', tier: 'entry', gains: { hp: { low: 60, high: 90 } }, cost: { low: 500, high: 800 } },
        { name: 'Downpipe', tier: 'mid', gains: { hp: { low: 20, high: 40 } }, cost: { low: 800, high: 1500 } },
        { name: 'Intake', tier: 'entry', gains: { hp: { low: 10, high: 20 } }, cost: { low: 400, high: 700 } },
        { name: 'Intercooler', tier: 'mid', gains: { hp: { low: 15, high: 30 } }, cost: { low: 1000, high: 2000 } },
      ],
      handling: [],
      braking: [],
      cooling: [
        { name: 'Upgraded Intercooler', tier: 'mid', gains: { hp: { low: 15, high: 30 } }, cost: { low: 1000, high: 2000 } },
      ],
      sound: [
        { name: 'Full Exhaust', tier: 'mid', gains: { hp: { low: 10, high: 20 } }, cost: { low: 2000, high: 4000 } },
      ],
      aero: [],
    },
    
    data_quality_tier: 'researched',
    data_sources: {
      has_manual_research: true,
      has_community_data: true,
    },
  },
};

/**
 * Get tuning template for a platform
 * @param {string} platformKey - Platform key from ENGINE_PLATFORMS
 * @returns {Object|null} - Template or null if not found
 */
export function getTuningTemplate(platformKey) {
  return TUNING_TEMPLATES[platformKey] || null;
}

/**
 * Get all available platform templates
 * @returns {string[]} - Array of platform keys that have templates
 */
export function getAvailableTemplates() {
  return Object.keys(TUNING_TEMPLATES);
}

/**
 * Check if a platform has a tuning template
 * @param {string} platformKey - Platform key
 * @returns {boolean}
 */
export function hasTemplate(platformKey) {
  return platformKey in TUNING_TEMPLATES;
}

export default {
  TUNING_TEMPLATES,
  getTuningTemplate,
  getAvailableTemplates,
  hasTemplate,
};
