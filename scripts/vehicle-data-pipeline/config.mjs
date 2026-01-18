/**
 * Vehicle Data Pipeline - Configuration
 * 
 * Central configuration for all tables, fields, validation rules, and data sources.
 */

// ============================================================================
// TABLE SCHEMAS - Complete definition of all 17 vehicle tables
// ============================================================================

export const TABLES = {
  // -------------------------------------------------------------------------
  // CRITICAL PRIORITY - Core vehicle data
  // -------------------------------------------------------------------------
  cars: {
    priority: 'CRITICAL',
    type: 'single', // One record per car
    foreignKey: 'id',
    fieldGroups: {
      identity: [
        'name', 'slug', 'years', 'brand', 'country', 'generation_code',
        'vehicle_type', 'category', 'tier'
      ],
      performance: [
        'hp', 'torque', 'engine', 'trans', 'drivetrain', 'layout',
        'curb_weight', 'zero_to_sixty', 'quarter_mile', 'top_speed',
        'braking_60_0', 'lateral_g'
      ],
      pricing: [
        'msrp_new_low', 'msrp_new_high', 'price_range', 'price_avg',
        'platform_cost_tier'
      ],
      scores: [
        'score_sound', 'score_interior', 'score_track', 'score_reliability',
        'score_value', 'score_driver_fun', 'score_aftermarket'
      ],
      ownership: [
        'fuel_economy_combined', 'maintenance_cost_index', 'insurance_cost_index',
        'daily_usability_tag', 'manual_available', 'seats'
      ],
      editorial: [
        'notes', 'highlight', 'tagline', 'hero_blurb', 'essence',
        'heritage', 'design_philosophy', 'motorsport_history'
      ],
      driving_feel: [
        'engine_character', 'transmission_feel', 'chassis_dynamics',
        'steering_feel', 'brake_confidence', 'sound_signature', 'comfort_notes'
      ],
      buyer_guide: [
        'ideal_owner', 'not_ideal_for', 'buyers_summary',
        'recommendation_highlight', 'years_to_avoid', 'recommended_years_note'
      ],
      arrays: [
        'pros', 'cons', 'best_for', 'common_issues', 'predecessors',
        'successors', 'defining_strengths', 'honest_weaknesses'
      ],
      market: [
        'market_position', 'market_commentary', 'resale_reputation',
        'price_guide', 'annual_ownership_cost', 'major_service_costs'
      ],
      track: [
        'track_readiness', 'track_readiness_notes', 'cooling_capacity',
        'brake_fade_resistance', 'recommended_track_prep', 'popular_track_mods',
        'laptime_benchmarks'
      ],
      community: [
        'community_strength', 'community_notes', 'key_resources',
        'facebook_groups', 'annual_events', 'aftermarket_scene_notes'
      ],
      reviews: [
        'notable_reviews', 'must_watch_videos', 'expert_quotes',
        'expert_consensus_summary', 'expert_review_count'
      ],
      comparisons: [
        'direct_competitors', 'if_you_want_more', 'if_you_want_less',
        'similar_driving_experience'
      ]
    },
    dataSources: ['AI_EDITORIAL', 'AI_PERFORMANCE', 'WEB_SEARCH'],
    requiredFields: ['name', 'slug', 'years', 'brand', 'hp', 'engine']
  },

  vehicle_maintenance_specs: {
    priority: 'CRITICAL',
    type: 'single',
    foreignKey: 'car_id',
    fieldGroups: {
      oil: [
        'oil_type', 'oil_viscosity', 'oil_spec', 'oil_capacity_liters',
        'oil_capacity_quarts', 'oil_filter_oem_part', 'oil_filter_alternatives',
        'oil_change_interval_miles', 'oil_change_interval_months'
      ],
      coolant: [
        'coolant_type', 'coolant_color', 'coolant_spec', 'coolant_capacity_liters',
        'coolant_change_interval_miles', 'coolant_change_interval_years'
      ],
      brake_fluid: [
        'brake_fluid_type', 'brake_fluid_spec', 'brake_fluid_change_interval_miles',
        'brake_fluid_change_interval_years'
      ],
      transmission: [
        'trans_fluid_manual', 'trans_fluid_manual_capacity', 'trans_fluid_auto',
        'trans_fluid_auto_capacity', 'trans_fluid_change_interval_miles'
      ],
      differential: [
        'diff_fluid_type', 'diff_fluid_front_capacity', 'diff_fluid_rear_capacity',
        'diff_fluid_change_interval_miles'
      ],
      fuel: [
        'fuel_type', 'fuel_octane_minimum', 'fuel_octane_recommended',
        'fuel_tank_capacity_gallons', 'fuel_tank_capacity_liters'
      ],
      tires: [
        'tire_size_front', 'tire_size_rear', 'tire_pressure_front_psi',
        'tire_pressure_rear_psi', 'tire_rotation_pattern', 'tire_rotation_interval_miles',
        'tire_oem_brand', 'tire_recommended_brands'
      ],
      wheels: [
        'wheel_size_front', 'wheel_size_rear', 'wheel_bolt_pattern',
        'wheel_center_bore_mm', 'wheel_lug_torque_ft_lbs', 'wheel_lug_torque_nm'
      ],
      brakes_front: [
        'brake_front_rotor_diameter_mm', 'brake_front_rotor_thickness_mm',
        'brake_front_rotor_min_thickness_mm', 'brake_front_rotor_oem_part',
        'brake_front_pad_oem_part', 'brake_front_caliper_type'
      ],
      brakes_rear: [
        'brake_rear_rotor_diameter_mm', 'brake_rear_rotor_thickness_mm',
        'brake_rear_rotor_min_thickness_mm', 'brake_rear_rotor_oem_part',
        'brake_rear_pad_oem_part', 'brake_rear_caliper_type'
      ],
      spark: [
        'spark_plug_type', 'spark_plug_gap_mm', 'spark_plug_oem_part',
        'spark_plug_alternatives', 'spark_plug_change_interval_miles', 'spark_plug_quantity'
      ],
      battery: [
        'battery_group_size', 'battery_cca', 'battery_voltage',
        'battery_oem_brand', 'battery_location', 'battery_agm'
      ],
      alignment: [
        'alignment_camber_front_degrees', 'alignment_camber_rear_degrees',
        'alignment_toe_front_degrees', 'alignment_toe_rear_degrees', 'alignment_caster_degrees'
      ],
      suspension: [
        'shock_front_oem_part', 'shock_rear_oem_part', 'spring_front_oem_part',
        'spring_rear_oem_part', 'sway_bar_front_diameter_mm', 'sway_bar_rear_diameter_mm'
      ]
    },
    dataSources: ['AI_MAINTENANCE', 'WEB_SEARCH'],
    requiredFields: ['oil_viscosity', 'oil_capacity_quarts', 'tire_size_front']
  },

  car_tuning_profiles: {
    priority: 'CRITICAL',
    type: 'single',
    foreignKey: 'car_id',
    fields: [
      'engine_family', 'tuning_focus', 'stock_whp', 'stock_wtq',
      'stage_progressions', 'tuning_platforms', 'power_limits',
      'brand_recommendations', 'upgrades_by_objective', 'curated_packages',
      'platform_insights', 'youtube_insights', 'research_sources',
      'verified', 'verified_by', 'notes'
    ],
    dataSources: ['AI_TUNING', 'WEB_SEARCH'],
    requiredFields: ['engine_family', 'stock_whp']
  },

  car_issues: {
    priority: 'CRITICAL',
    type: 'multiple', // Many records per car
    foreignKey: 'car_id',
    fields: [
      'kind', 'severity', 'title', 'description', 'symptoms', 'prevention',
      'fix_description', 'affected_years_text', 'affected_year_start',
      'affected_year_end', 'estimated_cost_text', 'estimated_cost_low',
      'estimated_cost_high', 'source_type', 'source_url', 'confidence'
    ],
    dataSources: ['NHTSA_COMPLAINTS', 'AI_ISSUES', 'WEB_SEARCH'],
    requiredFields: ['title', 'severity', 'description']
  },

  car_variants: {
    priority: 'CRITICAL',
    type: 'multiple',
    foreignKey: 'car_id',
    fields: [
      // Live DB schema (docs/DATABASE.md + information_schema)
      'variant_key', 'display_name', 'years_text', 'model_year_start', 'model_year_end',
      'trim', 'drivetrain', 'transmission', 'engine', 'metadata'
    ],
    dataSources: ['AI_RESEARCH', 'WEB_SEARCH'],
    requiredFields: ['variant_key', 'display_name', 'engine']
  },

  // -------------------------------------------------------------------------
  // HIGH PRIORITY - Safety and fuel data
  // -------------------------------------------------------------------------
  car_fuel_economy: {
    priority: 'HIGH',
    type: 'single',
    foreignKey: 'car_id',
    fields: [
      'epa_vehicle_id', 'city_mpg', 'highway_mpg', 'combined_mpg',
      'fuel_type', 'annual_fuel_cost', 'co2_emissions', 'ghg_score',
      'user_avg_mpg', 'user_city_mpg', 'user_highway_mpg', 'user_sample_size',
      'is_electric', 'is_hybrid', 'ev_range', 'source', 'fetched_at'
    ],
    dataSources: ['EPA_API'], // Fully automated
    requiredFields: ['city_mpg', 'highway_mpg', 'combined_mpg']
  },

  car_safety_data: {
    priority: 'HIGH',
    type: 'single',
    foreignKey: 'car_id',
    fields: [
      'nhtsa_overall_rating', 'nhtsa_front_crash_rating', 'nhtsa_side_crash_rating',
      'nhtsa_rollover_rating', 'recall_count', 'complaint_count',
      'investigation_count', 'tsb_count', 'has_open_recalls', 'has_open_investigations',
      'iihs_overall', 'iihs_small_overlap_front', 'iihs_moderate_overlap_front',
      'iihs_side', 'iihs_roof_strength', 'iihs_head_restraints',
      'iihs_front_crash_prevention', 'iihs_headlight_rating',
      'iihs_top_safety_pick', 'iihs_top_safety_pick_plus',
      'safety_score', 'safety_grade', 'nhtsa_fetched_at', 'iihs_fetched_at'
    ],
    dataSources: ['NHTSA_SAFETY_API', 'NHTSA_COMPLAINTS_API'],
    requiredFields: ['nhtsa_overall_rating']
  },

  car_recalls: {
    priority: 'HIGH',
    type: 'multiple',
    foreignKey: 'car_id',
    fields: [
      'campaign_number', 'recall_campaign_number', 'recall_date', 'component',
      'summary', 'consequence', 'remedy', 'report_received_date',
      'manufacturer', 'notes', 'source_url', 'is_incomplete'
    ],
    dataSources: ['NHTSA_RECALLS_API'],
    requiredFields: ['campaign_number', 'summary']
  },

  vehicle_service_intervals: {
    priority: 'HIGH',
    type: 'multiple',
    foreignKey: 'car_id',
    fields: [
      'service_name', 'service_description', 'interval_miles', 'interval_months',
      'items_included', 'dealer_cost_low', 'dealer_cost_high',
      'independent_cost_low', 'independent_cost_high', 'diy_cost_low',
      'diy_cost_high', 'labor_hours_estimate', 'is_critical', 'skip_consequences'
    ],
    dataSources: ['AI_MAINTENANCE'],
    requiredFields: ['service_name', 'interval_miles']
  },

  // -------------------------------------------------------------------------
  // MEDIUM PRIORITY - Enthusiast data
  // -------------------------------------------------------------------------
  car_dyno_runs: {
    priority: 'MEDIUM',
    type: 'multiple',
    foreignKey: 'car_id',
    fields: [
      'run_date', 'dyno_type', 'dyno_brand', 'location', 'weather_temp_f',
      'weather_humidity', 'weather_altitude_ft', 'correction_factor',
      'whp_peak', 'whp_rpm', 'wtq_peak', 'wtq_rpm', 'boost_peak_psi',
      'air_fuel_ratio', 'mods_description', 'tune_name', 'fuel_type',
      'is_stock', 'is_verified', 'source_type', 'source_url', 'dyno_sheet_url'
    ],
    dataSources: ['YOUTUBE_SEARCH', 'WEB_SEARCH'],
    requiredFields: ['whp_peak', 'is_stock']
  },

  car_track_lap_times: {
    priority: 'MEDIUM',
    type: 'multiple',
    foreignKey: 'car_id',
    fields: [
      'track_name', 'track_config', 'track_length_miles', 'lap_time_seconds',
      'lap_time_formatted', 'driver_type', 'driver_name', 'date_recorded',
      'weather_conditions', 'tire_brand', 'tire_model', 'tire_type',
      'mods_description', 'is_stock', 'source_type', 'source_url', 'video_url'
    ],
    dataSources: ['WEB_SEARCH', 'FASTESTLAPS_SCRAPE'],
    requiredFields: ['track_name', 'lap_time_seconds', 'is_stock']
  },

  car_expert_reviews: {
    priority: 'MEDIUM',
    type: 'multiple',
    foreignKey: 'car_id',
    fields: [
      // Live DB schema (structured review record)
      'source', 'source_url', 'title', 'overall_rating',
      'performance_rating', 'handling_rating', 'comfort_rating', 'interior_rating', 'value_rating',
      'pros', 'cons', 'verdict',
      'zero_to_sixty', 'zero_to_hundred', 'quarter_mile', 'quarter_mile_speed', 'braking_70_to_0', 'skidpad_g',
      'review_date', 'review_type', 'fetched_at'
    ],
    dataSources: ['WEB_SEARCH', 'EXA_SEARCH'],
    requiredFields: ['source', 'source_url', 'title']
  },

  car_auction_results: {
    priority: 'MEDIUM',
    type: 'multiple',
    foreignKey: 'car_id',
    fields: [
      'auction_house', 'auction_url', 'sale_date', 'sale_price', 'currency',
      'sold', 'reserve_met', 'mileage', 'location', 'title_status',
      'condition_notes', 'mods_description', 'color_exterior', 'color_interior',
      'vin', 'lot_number', 'image_urls'
    ],
    dataSources: ['BAT_API', 'CARS_BIDS_API'],
    requiredFields: ['auction_house', 'sale_price', 'sale_date']
  },

  wheel_tire_fitment_options: {
    priority: 'MEDIUM',
    type: 'multiple',
    foreignKey: 'car_id',
    fields: [
      // Live DB schema (much richer)
      'fitment_type',
      'wheel_diameter_inches', 'wheel_width_front', 'wheel_width_rear',
      'wheel_offset_front_mm', 'wheel_offset_rear_mm', 'wheel_offset_range_front', 'wheel_offset_range_rear',
      'tire_size_front', 'tire_size_rear',
      'tire_width_front_mm', 'tire_width_rear_mm', 'tire_aspect_front', 'tire_aspect_rear',
      'diameter_change_percent', 'speedometer_error_percent',
      'requires_fender_roll', 'requires_fender_pull', 'requires_camber_adjustment',
      'recommended_camber_front', 'recommended_camber_rear',
      'requires_coilovers', 'requires_spacers', 'spacer_size_front_mm', 'spacer_size_rear_mm',
      'clearance_notes', 'known_issues',
      'recommended_for', 'not_recommended_for',
      'popularity_score', 'community_verified', 'forum_threads',
      'source_type', 'source_url', 'confidence',
      'verified', 'verified_by', 'verified_at'
    ],
    dataSources: ['AI_RESEARCH', 'WEB_SEARCH'],
    requiredFields: ['tire_size_front', 'wheel_diameter_inches']
  },

  car_manual_data: {
    priority: 'MEDIUM',
    type: 'multiple',
    foreignKey: 'car_id',
    fields: [
      // Live DB schema (manual overrides / attachments)
      'data_type', 'source', 'source_url', 'data',
      'verified', 'verified_by', 'verified_at', 'notes', 'entered_by'
    ],
    dataSources: ['WEB_SEARCH'],
    requiredFields: ['data_type', 'source_url']
  },

  // -------------------------------------------------------------------------
  // LOW PRIORITY - Market and visual data
  // -------------------------------------------------------------------------
  car_market_pricing: {
    priority: 'LOW',
    type: 'multiple',
    foreignKey: 'car_id',
    fields: [
      'price_date', 'source', 'condition', 'mileage_low', 'mileage_high',
      'price_low', 'price_mid', 'price_high', 'sample_size',
      'trend_direction', 'trend_percent', 'notes'
    ],
    dataSources: ['KBB_SCRAPE', 'EDMUNDS_SCRAPE'],
    requiredFields: ['source', 'price_mid']
  },

  car_images: {
    priority: 'LOW',
    type: 'multiple',
    foreignKey: 'car_id',
    fields: [
      // Live DB schema (image library)
      'brand', 'blob_url', 'blob_path', 'file_size_bytes',
      'width', 'height', 'aspect_ratio', 'format',
      'source_type', 'source_url', 'source_attribution', 'license',
      'photographer', 'title', 'description', 'alt_text',
      'content_tags', 'recommended_uses', 'quality_tier',
      'is_primary', 'display_order',
      'ai_prompt', 'ai_model', 'ai_settings',
      'is_verified', 'is_active', 'needs_review', 'review_notes',
      'metadata'
    ],
    dataSources: ['MANUAL'],
    requiredFields: ['blob_url', 'blob_path', 'source_type']
  }
};

// ============================================================================
// DATA SOURCES - Available APIs and methods
// ============================================================================

export const DATA_SOURCES = {
  // Government APIs (Free, reliable)
  EPA_API: {
    name: 'EPA Fuel Economy API',
    baseUrl: 'https://www.fueleconomy.gov/ws/rest',
    reliability: 5,
    rateLimit: 100, // requests per minute
    automated: true
  },
  NHTSA_SAFETY_API: {
    name: 'NHTSA Safety Ratings API',
    baseUrl: 'https://api.nhtsa.gov/SafetyRatings',
    reliability: 5,
    rateLimit: 100,
    automated: true
  },
  NHTSA_RECALLS_API: {
    name: 'NHTSA Recalls API',
    baseUrl: 'https://api.nhtsa.gov/recalls/recallsByVehicle',
    reliability: 5,
    rateLimit: 100,
    automated: true
  },
  NHTSA_COMPLAINTS_API: {
    name: 'NHTSA Complaints API',
    baseUrl: 'https://api.nhtsa.gov/complaints/complaintsByVehicle',
    reliability: 5,
    rateLimit: 100,
    automated: true
  },

  // AI Research (Requires API keys)
  AI_MAINTENANCE: {
    name: 'AI Maintenance Research',
    provider: 'anthropic', // Claude is best for technical specs
    model: 'claude-sonnet-4-20250514',
    reliability: 4,
    requiresVerification: true
  },
  AI_TUNING: {
    name: 'AI Tuning Research',
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    reliability: 3,
    requiresVerification: true
  },
  AI_PERFORMANCE: {
    name: 'AI Performance Research',
    provider: 'openai', // GPT-4 good for numbers
    model: 'gpt-4-turbo',
    reliability: 4,
    requiresVerification: true
  },
  AI_EDITORIAL: {
    name: 'AI Editorial Content',
    provider: 'openai', // GPT-4 best for prose
    model: 'gpt-4-turbo',
    reliability: 4,
    requiresVerification: false // Editorial can be AI-generated
  },
  AI_ISSUES: {
    name: 'AI Issues Research',
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    reliability: 3,
    requiresVerification: true
  },

  // Web Search (Requires Exa API key)
  WEB_SEARCH: {
    name: 'Exa Web Search',
    provider: 'exa',
    reliability: 4,
    requiresVerification: true
  },
  EXA_SEARCH: {
    name: 'Exa Semantic Search',
    provider: 'exa',
    reliability: 4,
    requiresVerification: true
  }
};

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const VALIDATION_RULES = {
  // Range validations
  ranges: {
    'zero_to_sixty': { min: 1.5, max: 30, unit: 'seconds' },
    'quarter_mile': { min: 8, max: 25, unit: 'seconds' },
    'top_speed': { min: 80, max: 300, unit: 'mph' },
    'braking_60_0': { min: 80, max: 250, unit: 'feet' },
    'lateral_g': { min: 0.5, max: 1.5, unit: 'g' },
    'hp': { min: 50, max: 2000, unit: 'hp' },
    'torque': { min: 50, max: 1500, unit: 'lb-ft' },
    'curb_weight': { min: 1500, max: 10000, unit: 'lbs' },
    'oil_capacity_quarts': { min: 2, max: 16, unit: 'quarts' },
    'fuel_tank_capacity_gallons': { min: 8, max: 50, unit: 'gallons' },
    'city_mpg': { min: 5, max: 150, unit: 'mpg' },
    'highway_mpg': { min: 8, max: 200, unit: 'mpg' },
    'nhtsa_overall_rating': { min: 1, max: 5, unit: 'stars' }
  },

  // Format validations (regex)
  formats: {
    // Supports: 325/65R18, LT325/65R18, P265/70R17, 35x12.50R17, 245/45ZR17
    'tire_size': /^(LT|P|ST)?\d{2,3}[\\/x]\d{2}(\.\d{1,2})?(Z)?R\d{2}$/i,
    'wheel_bolt_pattern': /^\d+x\d{2,3}(\.\d)?$/,
    'oil_viscosity': /^\d+W-\d+$/i
  },

  // Cross-field validations
  crossField: [
    {
      name: 'MPG consistency',
      check: (data) => data.city_mpg < data.highway_mpg,
      message: 'City MPG should be less than highway MPG'
    },
    {
      name: 'Supercharged oil',
      check: (data) => {
        if (data.engine?.toLowerCase().includes('supercharged')) {
          return data.oil_viscosity !== '0W-20';
        }
        return true;
      },
      message: 'Supercharged engines typically require 0W-40 or thicker oil'
    }
  ]
};

// ============================================================================
// AI PROMPTS - Templates for each research type
// ============================================================================

export const AI_PROMPTS = {
  maintenance: (car) => `You are an automotive maintenance specialist. Research accurate maintenance specifications for:

Vehicle: ${car.name}
Years: ${car.years}
Engine: ${car.engine}
Brand: ${car.brand}

Provide data for ALL categories. Use "N/A" only if truly not applicable.
Use real OEM part numbers from ${getOemBrand(car.brand)}.

Return a JSON object with these exact fields:
{
  "oil": {
    "oil_type": "Full Synthetic",
    "oil_viscosity": "e.g., 0W-40",
    "oil_spec": "e.g., API SP, MS-12633",
    "oil_capacity_quarts": number,
    "oil_filter_oem_part": "part number",
    "oil_change_interval_miles": number
  },
  "coolant": {
    "coolant_type": "OAT, HOAT, or IAT",
    "coolant_spec": "manufacturer spec",
    "coolant_color": "color"
  },
  "transmission": {
    "trans_fluid_auto": "fluid type",
    "trans_fluid_auto_capacity": number in quarts
  },
  "differential": {
    "diff_fluid_type": "e.g., 75W-140 GL-5",
    "diff_fluid_front_capacity": number,
    "diff_fluid_rear_capacity": number
  },
  "brakes": {
    "brake_front_caliper_type": "e.g., 2-piston pin-slider",
    "brake_rear_caliper_type": "e.g., single-piston",
    "brake_front_rotor_diameter_mm": number,
    "brake_rear_rotor_diameter_mm": number
  },
  "tires_wheels": {
    "tire_size_front": "e.g., 325/65R18",
    "tire_size_rear": "e.g., 325/65R18",
    "wheel_bolt_pattern": "e.g., 6x139.7",
    "wheel_center_bore_mm": number,
    "wheel_lug_torque_ft_lbs": number
  },
  "electrical": {
    "battery_group_size": "e.g., H7",
    "battery_cca": number,
    "alternator_output_amps": number
  },
  "spark_plugs": {
    "spark_plug_oem_part": "part number",
    "spark_plug_quantity": number,
    "spark_plug_gap_mm": number
  },
  "confidence": 0.0-1.0,
  "sources": ["source1", "source2"]
}`,

  performance: (car) => `Research verified performance test data for:

Vehicle: ${car.name}
Years: ${car.years}
Engine: ${car.engine} (${car.hp}hp)

Find data from Car and Driver, MotorTrend, Road & Track, or other reputable publications.

Return JSON:
{
  "zero_to_sixty": number (seconds),
  "quarter_mile_time": number (seconds),
  "quarter_mile_speed": number (mph),
  "top_speed": number (mph),
  "braking_60_0": number (feet),
  "lateral_g": number,
  "curb_weight": number (lbs),
  "sources": [{"publication": "name", "date": "YYYY-MM", "url": "..."}],
  "confidence": 0.0-1.0
}

Only include data you're confident about.`,

  tuning: (car) => `Research tuning information for:

Vehicle: ${car.name}
Engine: ${car.engine}

Return JSON:
{
  "engine_family": "e.g., 6.2L Supercharged HEMI V8 (Hellcat)",
  "stock_whp": number,
  "stock_wtq": number,
  "tuning_platforms": [
    {"name": "HP Tuners", "price_range": "$xxx-$xxx"}
  ],
  "stage_progressions": [
    {
      "stage": "Stage 1",
      "hp_gain": "XX-XX hp",
      "components": ["tune", "intake", "etc"],
      "cost_range": "$XXX-$XXX"
    }
  ],
  "power_limits": {
    "stock_internals_hp": number,
    "stock_transmission_tq": number
  }
}`,

  issues: (car) => `Research common issues and problems for:

Vehicle: ${car.name}
Years: ${car.years}

Find real issues from forums, NHTSA complaints, TSBs.

Return JSON array:
[
  {
    "title": "Issue title",
    "severity": "critical|high|medium|low",
    "description": "Detailed description",
    "symptoms": ["symptom1", "symptom2"],
    "affected_years_text": "2021-2023",
    "estimated_cost_low": number,
    "estimated_cost_high": number,
    "fix_description": "How to fix"
  }
]

Include 5-10 REAL, documented issues only.`
};

// Helper function for OEM brand lookup
function getOemBrand(brand) {
  const oemBrands = {
    'Ram': 'Mopar', 'Dodge': 'Mopar', 'Jeep': 'Mopar', 'Chrysler': 'Mopar',
    'Ford': 'Motorcraft', 'Lincoln': 'Motorcraft',
    'Chevrolet': 'ACDelco', 'GMC': 'ACDelco', 'Cadillac': 'ACDelco', 'Buick': 'ACDelco',
    'Toyota': 'Toyota Genuine', 'Lexus': 'Toyota/Lexus Genuine',
    'Honda': 'Honda Genuine', 'Acura': 'Honda/Acura Genuine',
    'Nissan': 'Nissan Genuine', 'Infiniti': 'Nissan/Infiniti Genuine',
    'BMW': 'BMW Original', 'Mercedes-Benz': 'Mercedes-Benz Genuine',
    'Audi': 'Audi/VW Genuine', 'Volkswagen': 'VW Genuine', 'Porsche': 'Porsche Genuine'
  };
  return oemBrands[brand] || 'OEM';
}

export { getOemBrand };
