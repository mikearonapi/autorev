/**
 * Questionnaire Library - Enthusiast Profile System
 * 
 * Comprehensive questionnaire with 60+ questions across 8 categories.
 * The more questions a user answers, the better AL can personalize their experience.
 * 
 * Question Types:
 * - single: Single-select (radio buttons)
 * - multi: Multi-select (checkboxes)
 * - scale: Numeric scale (slider)
 * - freeform: Text input
 * 
 * @example
 * import { QUESTIONNAIRE_LIBRARY, getQuestionsByCategory } from '@/data/questionnaireLibrary';
 * 
 * // Get all core questions
 * const coreQuestions = getQuestionsByCategory('core');
 * 
 * // Get next unanswered question
 * const next = getNextUnansweredQuestion(answeredIds);
 */

// =============================================================================
// QUESTION CATEGORIES
// =============================================================================

export const QUESTION_CATEGORIES = {
  core: {
    id: 'core',
    name: 'Getting Started',
    description: 'Essential questions to personalize your experience',
    icon: 'star',
    color: '#f59e0b', // amber
    priority: 1,
    targetCount: 7,
  },
  vehicle_preferences: {
    id: 'vehicle_preferences',
    name: 'Vehicle Preferences',
    description: 'What types of cars excite you',
    icon: 'car',
    color: '#f97316', // orange
    priority: 2,
    targetCount: 8,
  },
  driving_behavior: {
    id: 'driving_behavior',
    name: 'Driving Style',
    description: 'How you actually drive day-to-day',
    icon: 'steering',
    color: '#3b82f6', // blue
    priority: 3,
    targetCount: 10,
  },
  car_knowledge: {
    id: 'car_knowledge',
    name: 'Car Knowledge',
    description: 'Your technical understanding',
    icon: 'wrench',
    color: '#8b5cf6', // purple
    priority: 4,
    targetCount: 10,
  },
  mod_interests: {
    id: 'mod_interests',
    name: 'Modification Interests',
    description: 'Specific areas you want to explore',
    icon: 'tools',
    color: '#14b8a6', // teal
    priority: 5,
    targetCount: 8,
  },
  track_performance: {
    id: 'track_performance',
    name: 'Track & Performance',
    description: 'Competition and lap times',
    icon: 'flag',
    color: '#ef4444', // red
    priority: 6,
    targetCount: 8,
  },
  practical: {
    id: 'practical',
    name: 'Practical Constraints',
    description: 'Real-world limitations and preferences',
    icon: 'clipboard',
    color: '#64748b', // slate
    priority: 7,
    targetCount: 6,
  },
  lifestyle: {
    id: 'lifestyle',
    name: 'Car Lifestyle',
    description: 'How cars fit into your life',
    icon: 'calendar',
    color: '#10b981', // green
    priority: 8,
    targetCount: 8,
  },
  learning: {
    id: 'learning',
    name: 'Learning Goals',
    description: 'What you want to learn',
    icon: 'book',
    color: '#06b6d4', // cyan
    priority: 9,
    targetCount: 8,
  },
  community: {
    id: 'community',
    name: 'Community',
    description: 'How you engage with others',
    icon: 'users',
    color: '#ec4899', // pink
    priority: 10,
    targetCount: 6,
  },
  financial: {
    id: 'financial',
    name: 'Budget & Planning',
    description: 'Financial preferences',
    icon: 'dollar',
    color: '#22c55e', // green
    priority: 11,
    targetCount: 6,
  },
};

// =============================================================================
// QUESTION LIBRARY (60+ questions)
// =============================================================================

export const QUESTIONNAIRE_LIBRARY = [
  // =========================================================================
  // CORE QUESTIONS (7) - Essential for basic personalization
  // Migrated from existing insightQuestions.js
  // =========================================================================
  {
    id: 'driving_focus',
    category: 'core',
    question: "What's your main driving focus?",
    hint: 'This helps us prioritize relevant insights',
    type: 'multi',
    maxSelections: 3,
    options: [
      { value: 'power', label: 'Power & acceleration' },
      { value: 'handling', label: 'Handling & cornering' },
      { value: 'daily', label: 'Daily comfort & reliability' },
      { value: 'track', label: 'Track performance' },
      { value: 'show', label: 'Show & aesthetics' },
    ],
    points: 10,
    alContext: 'driving_focus',
  },
  {
    id: 'work_preference',
    category: 'core',
    question: 'Do you typically do your own work?',
    hint: 'DIY tips or shop recommendations',
    type: 'single',
    options: [
      { value: 'diy', label: 'I do everything myself' },
      { value: 'shop', label: 'I take it to a shop' },
      { value: 'mixed', label: 'Mix of both' },
    ],
    points: 10,
    alContext: 'work_preference',
  },
  {
    id: 'budget_comfort',
    category: 'core',
    question: "What's your mod budget comfort level?",
    hint: 'Helps us suggest appropriate upgrades',
    type: 'single',
    options: [
      { value: 'budget', label: 'Budget-friendly options' },
      { value: 'moderate', label: 'Mid-range is fine' },
      { value: 'no_limit', label: "Sky's the limit" },
    ],
    points: 10,
    alContext: 'budget_comfort',
  },
  {
    id: 'mod_experience',
    category: 'core',
    question: 'What experience level are you?',
    hint: 'Tailors the detail of our recommendations',
    type: 'single',
    options: [
      { value: 'beginner', label: "I'm new to modding" },
      { value: 'intermediate', label: "I've done some mods" },
      { value: 'expert', label: "I'm an experienced builder" },
    ],
    points: 10,
    alContext: 'mod_experience',
  },
  {
    id: 'primary_goals',
    category: 'core',
    question: 'What are your primary goals?',
    hint: 'Select all that apply',
    type: 'multi',
    maxSelections: 3,
    options: [
      { value: 'more_power', label: 'More power' },
      { value: 'better_handling', label: 'Better handling' },
      { value: 'reliability', label: 'Improved reliability' },
      { value: 'sound', label: 'Better sound' },
      { value: 'aesthetics', label: 'Aesthetics & looks' },
    ],
    points: 10,
    alContext: 'primary_goals',
  },
  {
    id: 'track_frequency',
    category: 'core',
    question: 'How often do you track your car?',
    hint: 'Affects maintenance and upgrade priorities',
    type: 'single',
    options: [
      { value: 'never', label: 'Never or rarely' },
      { value: 'occasionally', label: 'A few times a year' },
      { value: 'regularly', label: 'Monthly or more' },
      { value: 'competitive', label: 'Competitively' },
    ],
    points: 10,
    alContext: 'track_frequency',
  },
  {
    id: 'detail_level',
    category: 'core',
    question: 'How detailed should insights be?',
    hint: 'Quick tips vs deep dives',
    type: 'single',
    options: [
      { value: 'quick_tips', label: 'Quick tips only' },
      { value: 'balanced', label: 'Balanced detail' },
      { value: 'deep_dive', label: 'Full deep dives' },
    ],
    points: 10,
    alContext: 'detail_level',
  },

  // =========================================================================
  // VEHICLE PREFERENCES (8 questions) - What types of cars excite them
  // =========================================================================
  {
    id: 'vehicle_culture',
    category: 'vehicle_preferences',
    question: 'What car culture resonates with you most?',
    type: 'multi',
    maxSelections: 3,
    options: [
      { value: 'jdm', label: 'JDM (Japanese domestic)' },
      { value: 'euro', label: 'European performance' },
      { value: 'american_muscle', label: 'American muscle' },
      { value: 'american_modern', label: 'Modern American performance' },
      { value: 'korean', label: 'Korean performance' },
      { value: 'exotic', label: 'Exotics & supercars' },
      { value: 'classic', label: 'Classics & vintage' },
      { value: 'all', label: 'I appreciate all cultures' },
    ],
    points: 10,
    alContext: 'vehicle_culture',
  },
  {
    id: 'vehicle_era',
    category: 'vehicle_preferences',
    question: 'What era of cars do you prefer?',
    type: 'single',
    options: [
      { value: 'classic', label: 'Classic (pre-1980)' },
      { value: 'retro', label: '1980s-1990s' },
      { value: '2000s', label: '2000s-2010s' },
      { value: 'modern', label: 'Modern (2015+)' },
      { value: 'no_preference', label: 'No preference' },
    ],
    points: 10,
    alContext: 'vehicle_era',
  },
  {
    id: 'drivetrain_preference',
    category: 'vehicle_preferences',
    question: 'What drivetrain do you prefer?',
    type: 'single',
    options: [
      { value: 'rwd', label: 'RWD - rear wheel drive' },
      { value: 'fwd', label: 'FWD - front wheel drive' },
      { value: 'awd', label: 'AWD - all wheel drive' },
      { value: 'no_preference', label: 'No strong preference' },
    ],
    points: 10,
    alContext: 'drivetrain_preference',
  },
  {
    id: 'aspiration_preference',
    category: 'vehicle_preferences',
    question: 'Naturally aspirated or forced induction?',
    type: 'single',
    options: [
      { value: 'na', label: 'Naturally aspirated purist' },
      { value: 'turbo', label: 'Turbocharged' },
      { value: 'supercharged', label: 'Supercharged' },
      { value: 'both', label: 'Love both equally' },
    ],
    points: 10,
    alContext: 'aspiration_preference',
  },
  {
    id: 'body_style_preference',
    category: 'vehicle_preferences',
    question: 'What body styles do you gravitate toward?',
    type: 'multi',
    maxSelections: 3,
    options: [
      { value: 'coupe', label: 'Coupes' },
      { value: 'sedan', label: 'Sedans' },
      { value: 'hatchback', label: 'Hatchbacks' },
      { value: 'wagon', label: 'Wagons' },
      { value: 'convertible', label: 'Convertibles' },
      { value: 'suv', label: 'SUVs & crossovers' },
      { value: 'truck', label: 'Trucks' },
    ],
    points: 10,
    alContext: 'body_style_preference',
  },
  {
    id: 'cylinder_preference',
    category: 'vehicle_preferences',
    question: 'Do you have an engine preference?',
    type: 'single',
    options: [
      { value: '4cyl', label: '4-cylinder enthusiast' },
      { value: '6cyl', label: '6-cylinder (inline or V)' },
      { value: 'v8', label: 'V8 or nothing' },
      { value: 'rotary', label: 'Rotary' },
      { value: 'ev', label: 'Electric' },
      { value: 'no_preference', label: 'No preference' },
    ],
    points: 10,
    alContext: 'cylinder_preference',
  },
  {
    id: 'climate_region',
    category: 'vehicle_preferences',
    question: 'What climate do you live in?',
    hint: 'Affects maintenance and tire recommendations',
    type: 'single',
    options: [
      { value: 'hot_dry', label: 'Hot and dry (desert/southwest)' },
      { value: 'hot_humid', label: 'Hot and humid (southeast/tropical)' },
      { value: 'moderate', label: 'Moderate (mild seasons)' },
      { value: 'cold_snow', label: 'Cold with snow/salt' },
      { value: 'coastal', label: 'Coastal (salt air)' },
      { value: 'mixed', label: 'Mixed/varied seasons' },
    ],
    points: 10,
    alContext: 'climate_region',
  },
  {
    id: 'dream_car',
    category: 'vehicle_preferences',
    question: 'What category is your dream car?',
    type: 'single',
    options: [
      { value: 'sports_car', label: 'Sports car (Miata, 86, Cayman)' },
      { value: 'muscle', label: 'Muscle car (Mustang, Camaro, Challenger)' },
      { value: 'jdm_legend', label: 'JDM legend (Supra, GT-R, NSX)' },
      { value: 'euro_performance', label: 'Euro performance (M3, RS, AMG)' },
      { value: 'hypercar', label: 'Hypercar/exotic' },
      { value: 'classic', label: 'Classic/vintage' },
      { value: 'practical_fast', label: 'Practical but fast' },
      { value: 'already_have_it', label: 'Already own my dream car' },
    ],
    points: 10,
    alContext: 'dream_car',
  },

  // =========================================================================
  // DRIVING BEHAVIOR (10 questions) - How they actually drive
  // =========================================================================
  {
    id: 'driving_aggression',
    category: 'driving_behavior',
    question: 'How would you describe your typical driving style?',
    hint: 'Be honest - this helps AL give better advice',
    type: 'single',
    options: [
      { value: 'relaxed', label: 'Relaxed, I prioritize comfort' },
      { value: 'spirited', label: 'Spirited when roads are clear' },
      { value: 'aggressive', label: 'I push it regularly' },
      { value: 'track_only', label: 'Save it all for the track' },
    ],
    points: 10,
    alContext: 'driving_style',
  },
  {
    id: 'daily_commute',
    category: 'driving_behavior',
    question: 'What does your typical daily drive look like?',
    type: 'single',
    options: [
      { value: 'short_city', label: 'Short city commute (under 15 min)' },
      { value: 'long_city', label: 'Longer city driving (15-45 min)' },
      { value: 'highway', label: 'Mostly highway miles' },
      { value: 'mixed', label: 'Mix of city and highway' },
      { value: 'weekend_only', label: 'Weekend car only' },
    ],
    points: 10,
    alContext: 'usage_pattern',
  },
  {
    id: 'weather_driving',
    category: 'driving_behavior',
    question: 'Do you drive your car in bad weather?',
    type: 'single',
    options: [
      { value: 'all_weather', label: 'Year-round daily driver' },
      { value: 'avoid_snow', label: 'Avoid snow, drive in rain' },
      { value: 'fair_weather', label: 'Fair weather only' },
      { value: 'garage_queen', label: 'Stored most of the time' },
    ],
    points: 10,
    alContext: 'weather_usage',
  },
  {
    id: 'spirited_frequency',
    category: 'driving_behavior',
    question: 'How often do you drive spiritedly (backroads, on-ramps)?',
    type: 'single',
    options: [
      { value: 'never', label: 'Never, just A to B' },
      { value: 'rarely', label: 'Occasionally, when mood strikes' },
      { value: 'weekly', label: 'Weekly canyon/backroad runs' },
      { value: 'daily', label: 'Every chance I get' },
    ],
    points: 10,
    alContext: 'spirited_driving',
  },
  {
    id: 'corner_confidence',
    category: 'driving_behavior',
    question: 'How confident are you pushing through corners?',
    type: 'single',
    options: [
      { value: 'cautious', label: 'Very cautious, I slow way down' },
      { value: 'comfortable', label: 'Comfortable at moderate speeds' },
      { value: 'confident', label: 'Confident, I know my limits' },
      { value: 'expert', label: 'Expert, I trail brake and rotate' },
    ],
    points: 15,
    alContext: 'driving_skill',
  },
  {
    id: 'heel_toe',
    category: 'driving_behavior',
    question: 'Can you heel-toe downshift?',
    hint: 'Only relevant for manual drivers',
    type: 'single',
    options: [
      { value: 'no', label: "No / Don't have a manual" },
      { value: 'learning', label: "I'm learning" },
      { value: 'sometimes', label: 'Sometimes, inconsistently' },
      { value: 'yes', label: 'Yes, consistently' },
    ],
    points: 10,
    alContext: 'driving_technique',
  },
  {
    id: 'transmission_preference',
    category: 'driving_behavior',
    question: 'What transmission do you prefer?',
    type: 'single',
    options: [
      { value: 'manual_only', label: 'Manual only, always' },
      { value: 'manual_prefer', label: 'Prefer manual, but open to auto' },
      { value: 'auto_prefer', label: 'Prefer auto/DCT for daily' },
      { value: 'no_preference', label: 'No strong preference' },
    ],
    points: 10,
    alContext: 'transmission_preference',
  },
  {
    id: 'mileage_annual',
    category: 'driving_behavior',
    question: 'How many miles do you drive per year?',
    type: 'single',
    options: [
      { value: 'under_5k', label: 'Under 5,000' },
      { value: '5k_10k', label: '5,000 - 10,000' },
      { value: '10k_15k', label: '10,000 - 15,000' },
      { value: 'over_15k', label: 'Over 15,000' },
    ],
    points: 10,
    alContext: 'annual_mileage',
  },
  {
    id: 'road_trip_frequency',
    category: 'driving_behavior',
    question: 'Do you take your car on road trips?',
    type: 'single',
    options: [
      { value: 'never', label: 'Never' },
      { value: 'occasionally', label: 'Occasionally (1-2x/year)' },
      { value: 'regularly', label: 'Regularly' },
      { value: 'love_it', label: 'Love road trips' },
    ],
    points: 10,
    alContext: 'road_trip',
  },
  {
    id: 'passenger_frequency',
    category: 'driving_behavior',
    question: 'How often do you have passengers?',
    type: 'single',
    options: [
      { value: 'solo', label: 'Almost always solo' },
      { value: 'occasional', label: 'Occasionally' },
      { value: 'frequent', label: 'Frequently' },
      { value: 'family', label: 'Family car duties' },
    ],
    points: 10,
    alContext: 'passenger_needs',
  },

  // =========================================================================
  // CAR KNOWLEDGE (10 questions) - Technical understanding
  // =========================================================================
  {
    id: 'oil_change_knowledge',
    category: 'car_knowledge',
    question: 'Could you explain why oil change intervals matter?',
    type: 'single',
    options: [
      { value: 'no_idea', label: "Not really, I just follow the sticker" },
      { value: 'basic', label: 'Basic understanding - lubrication' },
      { value: 'good', label: 'Good - I know about viscosity and wear' },
      { value: 'expert', label: 'Expert - I could discuss oil analysis' },
    ],
    points: 10,
    alContext: 'maintenance_knowledge',
  },
  {
    id: 'forced_induction_understanding',
    category: 'car_knowledge',
    question: 'How well do you understand turbo/supercharger systems?',
    type: 'single',
    options: [
      { value: 'none', label: "I know they make more power, that's it" },
      { value: 'basic', label: 'Basic - boost pressure, intercoolers' },
      { value: 'intermediate', label: 'Good - compressor maps, surge' },
      { value: 'advanced', label: 'Advanced - sizing, tuning, limits' },
    ],
    points: 15,
    alContext: 'technical_depth',
  },
  {
    id: 'suspension_knowledge',
    category: 'car_knowledge',
    question: 'How much do you know about suspension tuning?',
    type: 'single',
    options: [
      { value: 'none', label: 'Springs and shocks exist, I guess?' },
      { value: 'basic', label: 'Lowering, stiffer = sportier' },
      { value: 'intermediate', label: 'Camber, toe, damper settings' },
      { value: 'advanced', label: 'Corner weighting, motion ratios' },
    ],
    points: 15,
    alContext: 'suspension_knowledge',
  },
  {
    id: 'engine_internals',
    category: 'car_knowledge',
    question: 'How familiar are you with engine internals?',
    type: 'single',
    options: [
      { value: 'none', label: "Gas goes in, vroom comes out" },
      { value: 'basic', label: 'Pistons, valves, basic stuff' },
      { value: 'intermediate', label: 'Compression, cam profiles, timing' },
      { value: 'advanced', label: 'Forged internals, tolerances, builds' },
    ],
    points: 15,
    alContext: 'engine_knowledge',
  },
  {
    id: 'data_logging',
    category: 'car_knowledge',
    question: 'Do you use data logging or performance monitoring?',
    type: 'single',
    options: [
      { value: 'no', label: 'No, never' },
      { value: 'phone_apps', label: 'Phone apps (Torque, etc.)' },
      { value: 'obd_device', label: 'OBD2 scanner/logger' },
      { value: 'dedicated', label: 'Dedicated data system (AiM, etc.)' },
    ],
    points: 10,
    alContext: 'data_sophistication',
  },
  {
    id: 'ecu_tuning_knowledge',
    category: 'car_knowledge',
    question: 'How familiar are you with ECU tuning?',
    type: 'single',
    options: [
      { value: 'none', label: "Don't know what that is" },
      { value: 'aware', label: 'Know it exists, never done it' },
      { value: 'basic', label: 'Have run a tune (canned/OTS)' },
      { value: 'custom', label: 'Run custom tunes, understand maps' },
    ],
    points: 15,
    alContext: 'tuning_knowledge',
  },
  {
    id: 'brake_knowledge',
    category: 'car_knowledge',
    question: 'How well do you understand brake systems?',
    type: 'single',
    options: [
      { value: 'basic', label: 'Pads and rotors, thats about it' },
      { value: 'intermediate', label: 'Pad compounds, rotor types, fluid' },
      { value: 'advanced', label: 'BBK sizing, bias, heat management' },
    ],
    points: 10,
    alContext: 'brake_knowledge',
  },
  {
    id: 'aerodynamics_understanding',
    category: 'car_knowledge',
    question: 'How much do you know about aerodynamics?',
    type: 'single',
    options: [
      { value: 'none', label: 'Wings look cool?' },
      { value: 'basic', label: 'Downforce vs drag basics' },
      { value: 'intermediate', label: 'Splitters, diffusers, balance' },
      { value: 'advanced', label: 'CFD, pressure distribution, aero mapping' },
    ],
    points: 10,
    alContext: 'aero_knowledge',
  },
  {
    id: 'tire_knowledge',
    category: 'car_knowledge',
    question: 'How well do you understand tire dynamics?',
    type: 'single',
    options: [
      { value: 'basic', label: 'Bigger = better grip?' },
      { value: 'intermediate', label: 'Compound, treadwear, heat cycles' },
      { value: 'advanced', label: 'Slip angles, pressure optimization' },
    ],
    points: 10,
    alContext: 'tire_knowledge',
  },
  {
    id: 'diagnostics_ability',
    category: 'car_knowledge',
    question: 'Can you diagnose common car problems?',
    type: 'single',
    options: [
      { value: 'no', label: 'I go to a shop for everything' },
      { value: 'basic', label: 'Basic stuff (fluids, filters)' },
      { value: 'intermediate', label: 'I can use scan tools' },
      { value: 'advanced', label: 'I can diagnose most issues' },
    ],
    points: 10,
    alContext: 'diagnostic_ability',
  },

  // =========================================================================
  // MODIFICATION INTERESTS (8 questions) - Specific areas to explore
  // =========================================================================
  {
    id: 'engine_swap_interest',
    category: 'mod_interests',
    question: 'Are you interested in engine swaps?',
    type: 'single',
    options: [
      { value: 'no', label: 'No, keep it original' },
      { value: 'curious', label: 'Curious but intimidated' },
      { value: 'considering', label: 'Actively considering one' },
      { value: 'done', label: 'Have done or doing one' },
    ],
    points: 10,
    alContext: 'engine_swap_interest',
  },
  {
    id: 'fi_conversion_interest',
    category: 'mod_interests',
    question: 'Interested in adding forced induction to an NA car?',
    type: 'single',
    options: [
      { value: 'no', label: 'No, prefer NA' },
      { value: 'turbo', label: 'Yes, turbo' },
      { value: 'supercharger', label: 'Yes, supercharger' },
      { value: 'already_fi', label: 'My car is already FI' },
    ],
    points: 10,
    alContext: 'fi_conversion_interest',
  },
  {
    id: 'drift_interest',
    category: 'mod_interests',
    question: 'Are you interested in drifting?',
    type: 'single',
    options: [
      { value: 'no', label: 'Not my thing' },
      { value: 'watch', label: 'Fun to watch, not do' },
      { value: 'try', label: 'Want to try it' },
      { value: 'active', label: 'Actively drift' },
    ],
    points: 10,
    alContext: 'drift_interest',
  },
  {
    id: 'drag_racing_interest',
    category: 'mod_interests',
    question: 'Are you interested in drag racing?',
    type: 'single',
    options: [
      { value: 'no', label: 'Not interested' },
      { value: 'casual', label: 'Casual test & tune nights' },
      { value: 'bracket', label: 'Bracket racing' },
      { value: 'serious', label: 'Serious drag builds' },
    ],
    points: 10,
    alContext: 'drag_racing_interest',
  },
  {
    id: 'audio_interest',
    category: 'mod_interests',
    question: 'How important is audio/stereo to you?',
    type: 'single',
    options: [
      { value: 'none', label: 'Stock is fine / dont care' },
      { value: 'basic', label: 'Better speakers and head unit' },
      { value: 'enthusiast', label: 'Upgraded system with subs' },
      { value: 'competition', label: 'Competition-level audio' },
    ],
    points: 10,
    alContext: 'audio_interest',
  },
  {
    id: 'interior_interest',
    category: 'mod_interests',
    question: 'How interested are you in interior modifications?',
    type: 'single',
    options: [
      { value: 'none', label: 'Keep it stock' },
      { value: 'functional', label: 'Functional only (gauges, wheel)' },
      { value: 'comfort', label: 'Comfort and aesthetics' },
      { value: 'full', label: 'Full interior transformation' },
    ],
    points: 10,
    alContext: 'interior_interest',
  },
  {
    id: 'lighting_interest',
    category: 'mod_interests',
    question: 'Are you into lighting modifications?',
    type: 'single',
    options: [
      { value: 'no', label: 'Keep it stock' },
      { value: 'functional', label: 'Better bulbs/visibility only' },
      { value: 'aesthetic', label: 'LEDs, halos, accent lighting' },
      { value: 'full', label: 'Full lighting overhaul' },
    ],
    points: 10,
    alContext: 'lighting_interest',
  },
  {
    id: 'offroad_interest',
    category: 'mod_interests',
    question: 'Any interest in off-road or overlanding?',
    type: 'single',
    options: [
      { value: 'no', label: 'No, pavement only' },
      { value: 'light', label: 'Light trails and camping' },
      { value: 'moderate', label: 'Moderate off-roading' },
      { value: 'serious', label: 'Serious off-road builds' },
    ],
    points: 10,
    alContext: 'offroad_interest',
  },

  // =========================================================================
  // TRACK & PERFORMANCE (8 questions)
  // =========================================================================
  {
    id: 'track_experience',
    category: 'track_performance',
    question: 'What track driving experience do you have?',
    type: 'single',
    options: [
      { value: 'none', label: 'Never been on a track' },
      { value: 'hpde_beginner', label: 'A few HPDE days' },
      { value: 'hpde_regular', label: 'Regular HPDE participant' },
      { value: 'time_attack', label: 'Time attack / competitive' },
      { value: 'racing', label: 'Wheel-to-wheel racing' },
    ],
    points: 15,
    alContext: 'track_level',
  },
  {
    id: 'track_goals',
    category: 'track_performance',
    question: 'What are your track driving goals?',
    type: 'multi',
    maxSelections: 3,
    options: [
      { value: 'learn', label: 'Learn car control safely' },
      { value: 'fun', label: 'Have fun, no pressure' },
      { value: 'improve', label: 'Improve lap times consistently' },
      { value: 'compete', label: 'Compete and win' },
      { value: 'no_interest', label: 'Not interested in track' },
    ],
    points: 10,
    alContext: 'track_goals',
  },
  {
    id: 'lap_time_priority',
    category: 'track_performance',
    question: 'When building for track, what matters most?',
    hint: 'Only if you track your car',
    type: 'single',
    prerequisite: { questionId: 'track_experience', notEqual: 'none' },
    options: [
      { value: 'reliability', label: 'Reliability - finish every session' },
      { value: 'balance', label: 'Balance of speed and reliability' },
      { value: 'speed', label: 'Maximum speed, accept more risk' },
    ],
    points: 10,
    alContext: 'track_priority',
  },
  {
    id: 'instruction_interest',
    category: 'track_performance',
    question: 'Are you interested in professional driving instruction?',
    type: 'single',
    options: [
      { value: 'not_interested', label: 'Not interested' },
      { value: 'curious', label: 'Curious but havent tried' },
      { value: 'taken_some', label: 'Have taken some instruction' },
      { value: 'ongoing', label: 'Ongoing coaching/instruction' },
    ],
    points: 10,
    alContext: 'instruction_interest',
  },
  {
    id: 'autocross_interest',
    category: 'track_performance',
    question: 'Have you tried autocross?',
    type: 'single',
    options: [
      { value: 'no', label: 'No, never' },
      { value: 'interested', label: 'Interested but havent tried' },
      { value: 'tried', label: 'Tried it a few times' },
      { value: 'regular', label: 'Regular autocross participant' },
    ],
    points: 10,
    alContext: 'autocross',
  },
  {
    id: 'sim_racing',
    category: 'track_performance',
    question: 'Do you do any sim racing?',
    type: 'single',
    options: [
      { value: 'no', label: 'No' },
      { value: 'casual', label: 'Casually (controller/wheel)' },
      { value: 'serious', label: 'Seriously (proper rig)' },
      { value: 'competitive', label: 'Competitively (leagues)' },
    ],
    points: 10,
    alContext: 'sim_racing',
  },
  {
    id: 'track_prep_level',
    category: 'track_performance',
    question: 'How prepared is your car for track use?',
    type: 'single',
    prerequisite: { questionId: 'track_experience', notEqual: 'none' },
    options: [
      { value: 'stock', label: 'Completely stock' },
      { value: 'basic', label: 'Basic prep (brake fluid, pads)' },
      { value: 'moderate', label: 'Moderate (cooling, suspension)' },
      { value: 'full', label: 'Full track build (cage, etc.)' },
    ],
    points: 10,
    alContext: 'track_prep',
  },
  {
    id: 'track_frequency_detail',
    category: 'track_performance',
    question: 'How many track days do you do per year?',
    type: 'single',
    prerequisite: { questionId: 'track_experience', notEqual: 'none' },
    options: [
      { value: '1_2', label: '1-2 days' },
      { value: '3_5', label: '3-5 days' },
      { value: '6_10', label: '6-10 days' },
      { value: '10_plus', label: '10+ days' },
    ],
    points: 10,
    alContext: 'track_days_per_year',
  },

  // =========================================================================
  // PRACTICAL CONSTRAINTS (6 questions) - Real-world limitations
  // =========================================================================
  {
    id: 'tool_access',
    category: 'practical',
    question: 'What tools do you have access to?',
    type: 'single',
    options: [
      { value: 'basic', label: 'Basic hand tools only' },
      { value: 'moderate', label: 'Good tool collection' },
      { value: 'advanced', label: 'Full tool set + specialty tools' },
      { value: 'shop', label: 'Access to a full shop' },
    ],
    points: 10,
    alContext: 'tool_access',
  },
  {
    id: 'lift_access',
    category: 'practical',
    question: 'Do you have access to a lift?',
    type: 'single',
    options: [
      { value: 'no', label: 'No, jack and stands only' },
      { value: 'ramps', label: 'Ramps or low-rise lift' },
      { value: 'quickjack', label: 'QuickJack or portable lift' },
      { value: 'full', label: 'Full 2-post or 4-post lift' },
    ],
    points: 10,
    alContext: 'lift_access',
  },
  {
    id: 'time_availability',
    category: 'practical',
    question: 'How much time can you dedicate to car projects?',
    type: 'single',
    options: [
      { value: 'minimal', label: 'Very limited, weekends only' },
      { value: 'moderate', label: 'A few hours per week' },
      { value: 'good', label: 'Regular dedicated time' },
      { value: 'lots', label: 'As much as needed' },
    ],
    points: 10,
    alContext: 'time_availability',
  },
  {
    id: 'emissions_requirements',
    category: 'practical',
    question: 'Do you have emissions testing requirements?',
    hint: 'Affects mod recommendations',
    type: 'single',
    options: [
      { value: 'none', label: 'No emissions testing' },
      { value: 'basic', label: 'Basic OBD2 check' },
      { value: 'strict', label: 'Strict visual + sniffer test' },
      { value: 'california', label: 'CARB/California strict' },
    ],
    points: 10,
    alContext: 'emissions_requirements',
  },
  {
    id: 'street_legal_priority',
    category: 'practical',
    question: 'How important is keeping the car street legal?',
    type: 'single',
    options: [
      { value: 'must', label: 'Must stay street legal' },
      { value: 'prefer', label: 'Prefer street legal, some exceptions' },
      { value: 'flexible', label: 'Flexible, track-focused' },
      { value: 'track_only', label: 'Track/show car only' },
    ],
    points: 10,
    alContext: 'street_legal_priority',
  },
  {
    id: 'mod_reversibility',
    category: 'practical',
    question: 'How do you feel about permanent modifications?',
    type: 'single',
    options: [
      { value: 'reversible', label: 'Prefer fully reversible mods' },
      { value: 'mostly', label: 'Mostly reversible is fine' },
      { value: 'dont_care', label: 'Doesnt matter to me' },
      { value: 'permanent', label: 'Go all in, no looking back' },
    ],
    points: 10,
    alContext: 'mod_reversibility',
  },

  // =========================================================================
  // LIFESTYLE (8 questions) - How cars fit into their life
  // =========================================================================
  {
    id: 'car_culture_events',
    category: 'lifestyle',
    question: 'What car events do you attend?',
    type: 'multi',
    maxSelections: 4,
    options: [
      { value: 'none', label: 'None, not my thing' },
      { value: 'cars_coffee', label: 'Cars & Coffee meetups' },
      { value: 'car_shows', label: 'Car shows' },
      { value: 'track_days', label: 'Track days / HPDE' },
      { value: 'autocross', label: 'Autocross events' },
      { value: 'rallies', label: 'Rallies or cruises' },
    ],
    points: 10,
    alContext: 'event_participation',
  },
  {
    id: 'content_consumption',
    category: 'lifestyle',
    question: 'How do you learn about cars?',
    type: 'multi',
    maxSelections: 4,
    options: [
      { value: 'youtube', label: 'YouTube channels' },
      { value: 'forums', label: 'Forums and communities' },
      { value: 'podcasts', label: 'Podcasts' },
      { value: 'magazines', label: 'Magazines / publications' },
      { value: 'friends', label: 'Friends and local scene' },
      { value: 'hands_on', label: 'Hands-on experimentation' },
    ],
    points: 10,
    alContext: 'learning_sources',
  },
  {
    id: 'car_count',
    category: 'lifestyle',
    question: 'How many cars do you currently own?',
    type: 'single',
    options: [
      { value: '1', label: 'One - it does everything' },
      { value: '2', label: 'Two - daily + fun car' },
      { value: '3_plus', label: 'Three or more' },
      { value: 'none_shopping', label: 'None yet, shopping' },
    ],
    points: 10,
    alContext: 'car_ownership',
  },
  {
    id: 'garage_situation',
    category: 'lifestyle',
    question: 'What garage/workspace do you have?',
    type: 'single',
    options: [
      { value: 'none', label: 'Street parking only' },
      { value: 'covered', label: 'Covered/carport' },
      { value: 'garage', label: 'Garage (storage)' },
      { value: 'workshop', label: 'Garage with workspace' },
      { value: 'full_shop', label: 'Full shop setup' },
    ],
    points: 10,
    alContext: 'workspace',
  },
  {
    id: 'detailing_interest',
    category: 'lifestyle',
    question: 'How into detailing are you?',
    type: 'single',
    options: [
      { value: 'none', label: 'Just car washes' },
      { value: 'basic', label: 'Basic home wash and wax' },
      { value: 'enthusiast', label: 'Paint correction, ceramic' },
      { value: 'obsessed', label: 'Full detailing setup' },
    ],
    points: 10,
    alContext: 'detailing',
  },
  {
    id: 'car_photography',
    category: 'lifestyle',
    question: 'Do you photograph your cars?',
    type: 'single',
    options: [
      { value: 'no', label: 'Not really' },
      { value: 'phone', label: 'Phone pics occasionally' },
      { value: 'enthusiast', label: 'Regular photos, social media' },
      { value: 'serious', label: 'Serious car photography' },
    ],
    points: 10,
    alContext: 'photography',
  },
  {
    id: 'future_car_plans',
    category: 'lifestyle',
    question: 'What are your future car plans?',
    type: 'single',
    options: [
      { value: 'keep_current', label: 'Keep and enjoy current car' },
      { value: 'upgrade', label: 'Looking to upgrade' },
      { value: 'add', label: 'Looking to add another car' },
      { value: 'project', label: 'Starting a project car' },
    ],
    points: 10,
    alContext: 'future_plans',
  },
  {
    id: 'car_history',
    category: 'lifestyle',
    question: 'How many cars have you owned?',
    type: 'single',
    options: [
      { value: 'first', label: 'This is my first' },
      { value: '2_5', label: '2-5 cars' },
      { value: '6_10', label: '6-10 cars' },
      { value: '10_plus', label: 'More than 10' },
    ],
    points: 10,
    alContext: 'ownership_history',
  },

  // =========================================================================
  // LEARNING GOALS (8 questions) - What they want to learn
  // =========================================================================
  {
    id: 'want_to_learn_mods',
    category: 'learning',
    question: 'What modification topics do you want to learn more about?',
    type: 'multi',
    maxSelections: 4,
    options: [
      { value: 'power', label: 'Making more power' },
      { value: 'handling', label: 'Suspension & handling' },
      { value: 'braking', label: 'Braking upgrades' },
      { value: 'aero', label: 'Aerodynamics' },
      { value: 'tuning', label: 'ECU tuning & calibration' },
      { value: 'maintenance', label: 'Maintenance & reliability' },
    ],
    points: 10,
    alContext: 'learning_interests',
  },
  {
    id: 'learning_style',
    category: 'learning',
    question: 'How do you prefer to learn new things?',
    type: 'single',
    options: [
      { value: 'video', label: 'Watch videos, then try' },
      { value: 'read', label: 'Read guides thoroughly first' },
      { value: 'hands_on', label: 'Jump in and figure it out' },
      { value: 'mentor', label: 'Learn from someone experienced' },
    ],
    points: 10,
    alContext: 'learning_style',
  },
  {
    id: 'technical_depth_preference',
    category: 'learning',
    question: 'How technical do you want explanations to be?',
    type: 'single',
    options: [
      { value: 'simple', label: 'Keep it simple, just tell me what to do' },
      { value: 'some_detail', label: 'Some detail, explain the why' },
      { value: 'technical', label: 'Full technical explanations' },
      { value: 'deep_dive', label: 'Deep dives with data and specs' },
    ],
    points: 10,
    alContext: 'explanation_depth',
  },
  {
    id: 'driving_improvement',
    category: 'learning',
    question: 'Do you want to improve your driving skills?',
    type: 'single',
    options: [
      { value: 'no', label: 'Happy with current skills' },
      { value: 'street', label: 'Better street driving' },
      { value: 'performance', label: 'Performance/spirited driving' },
      { value: 'track', label: 'Track/racing techniques' },
    ],
    points: 10,
    alContext: 'driving_improvement',
  },
  {
    id: 'maintenance_learning',
    category: 'learning',
    question: 'Do you want to learn more about maintenance?',
    type: 'single',
    options: [
      { value: 'no', label: 'Prefer to leave it to shops' },
      { value: 'basic', label: 'Basic DIY (oil, fluids)' },
      { value: 'intermediate', label: 'More involved work' },
      { value: 'everything', label: 'Want to do everything myself' },
    ],
    points: 10,
    alContext: 'maintenance_learning',
  },
  {
    id: 'buying_research',
    category: 'learning',
    question: 'Are you researching what car to buy?',
    type: 'single',
    options: [
      { value: 'no', label: 'No, happy with current car' },
      { value: 'casual', label: 'Casually browsing' },
      { value: 'active', label: 'Actively researching' },
      { value: 'ready', label: 'Ready to buy soon' },
    ],
    points: 10,
    alContext: 'buying_stage',
  },
  {
    id: 'encyclopedia_interest',
    category: 'learning',
    question: 'Are you interested in learning how car systems work?',
    type: 'multi',
    maxSelections: 4,
    options: [
      { value: 'engine', label: 'Engines & powertrain' },
      { value: 'suspension', label: 'Suspension & handling' },
      { value: 'brakes', label: 'Braking systems' },
      { value: 'electronics', label: 'Electronics & ECU' },
      { value: 'aero', label: 'Aerodynamics' },
      { value: 'not_interested', label: 'Not really interested' },
    ],
    points: 10,
    alContext: 'system_interests',
  },
  {
    id: 'brand_loyalty',
    category: 'learning',
    question: 'Are you brand-loyal or brand-agnostic?',
    type: 'single',
    options: [
      { value: 'loyal', label: 'Loyal to one brand' },
      { value: 'preference', label: 'Have preferences but open' },
      { value: 'agnostic', label: 'Best car for the money' },
      { value: 'eclectic', label: 'Love variety, owned many brands' },
    ],
    points: 10,
    alContext: 'brand_loyalty',
  },

  // =========================================================================
  // COMMUNITY (6 questions) - How they engage with others
  // =========================================================================
  {
    id: 'community_involvement',
    category: 'community',
    question: 'How involved are you in car communities?',
    type: 'single',
    options: [
      { value: 'lurker', label: 'I read but rarely post' },
      { value: 'occasional', label: 'Occasionally share/comment' },
      { value: 'active', label: 'Active contributor' },
      { value: 'leader', label: 'Organizer/leader in communities' },
    ],
    points: 10,
    alContext: 'community_role',
  },
  {
    id: 'help_others',
    category: 'community',
    question: 'Do you enjoy helping others with car questions?',
    type: 'single',
    options: [
      { value: 'no', label: 'Not really my thing' },
      { value: 'sometimes', label: 'When I know the answer' },
      { value: 'yes', label: 'Yes, I like sharing knowledge' },
      { value: 'mentor', label: 'I actively mentor others' },
    ],
    points: 10,
    alContext: 'mentorship',
  },
  {
    id: 'social_sharing',
    category: 'community',
    question: 'Do you share your car on social media?',
    type: 'single',
    options: [
      { value: 'no', label: 'No social media presence' },
      { value: 'private', label: 'Private/friends only' },
      { value: 'occasional', label: 'Occasional posts' },
      { value: 'active', label: 'Active car account' },
    ],
    points: 10,
    alContext: 'social_presence',
  },
  {
    id: 'local_scene',
    category: 'community',
    question: 'Are you connected to your local car scene?',
    type: 'single',
    options: [
      { value: 'no', label: 'No, mostly online' },
      { value: 'some', label: 'Know a few people' },
      { value: 'active', label: 'Active in local meets' },
      { value: 'organizer', label: 'Help organize events' },
    ],
    points: 10,
    alContext: 'local_scene',
  },
  {
    id: 'build_sharing',
    category: 'community',
    question: 'Would you share your build on AutoRev?',
    type: 'single',
    options: [
      { value: 'no', label: 'Prefer to keep private' },
      { value: 'maybe', label: 'Maybe when its more complete' },
      { value: 'yes', label: 'Yes, love sharing builds' },
      { value: 'already', label: 'Already have' },
    ],
    points: 10,
    alContext: 'build_sharing',
  },
  {
    id: 'club_membership',
    category: 'community',
    question: 'Are you a member of any car clubs?',
    type: 'single',
    options: [
      { value: 'no', label: 'No club memberships' },
      { value: 'online', label: 'Online communities only' },
      { value: 'local', label: 'Local car club member' },
      { value: 'multiple', label: 'Multiple clubs/organizations' },
    ],
    points: 10,
    alContext: 'club_membership',
  },

  // =========================================================================
  // FINANCIAL (6 questions) - Budget and spending habits
  // =========================================================================
  {
    id: 'mod_budget_annual',
    category: 'financial',
    question: 'Roughly, what do you spend on mods per year?',
    type: 'single',
    options: [
      { value: 'minimal', label: 'Under $500 - minimal' },
      { value: 'moderate', label: '$500-$2,000' },
      { value: 'significant', label: '$2,000-$5,000' },
      { value: 'serious', label: '$5,000-$15,000' },
      { value: 'unlimited', label: '$15,000+ - serious builds' },
    ],
    points: 10,
    alContext: 'annual_budget',
  },
  {
    id: 'value_vs_brand',
    category: 'financial',
    question: 'When buying parts, what matters more?',
    type: 'single',
    options: [
      { value: 'value', label: 'Value - best performance per dollar' },
      { value: 'balanced', label: 'Balance of quality and price' },
      { value: 'quality', label: 'Quality first, price second' },
      { value: 'brand', label: 'Known brands I trust, regardless' },
    ],
    points: 10,
    alContext: 'purchasing_priority',
  },
  {
    id: 'maintenance_budget',
    category: 'financial',
    question: 'What do you typically spend on maintenance yearly?',
    type: 'single',
    options: [
      { value: 'minimal', label: 'Under $500' },
      { value: 'moderate', label: '$500-$1,500' },
      { value: 'significant', label: '$1,500-$3,000' },
      { value: 'high', label: '$3,000+' },
    ],
    points: 10,
    alContext: 'maintenance_budget',
  },
  {
    id: 'new_vs_used',
    category: 'financial',
    question: 'Do you prefer new or used parts?',
    type: 'single',
    options: [
      { value: 'new_only', label: 'New parts only' },
      { value: 'prefer_new', label: 'Prefer new, but open to used' },
      { value: 'mixed', label: 'Mix of both' },
      { value: 'prefer_used', label: 'Prefer used for value' },
    ],
    points: 10,
    alContext: 'parts_preference',
  },
  {
    id: 'financing_approach',
    category: 'financial',
    question: 'How do you approach car purchases?',
    type: 'single',
    options: [
      { value: 'cash', label: 'Cash only' },
      { value: 'finance_some', label: 'Finance sometimes' },
      { value: 'finance_usually', label: 'Usually finance' },
      { value: 'lease', label: 'Prefer leasing' },
    ],
    points: 10,
    alContext: 'financing_preference',
  },
  {
    id: 'investment_mindset',
    category: 'financial',
    question: 'Do you see cars as investments?',
    type: 'single',
    options: [
      { value: 'no', label: 'No, cars are for driving' },
      { value: 'some', label: 'Some collector potential' },
      { value: 'yes', label: 'Yes, I consider resale/appreciation' },
      { value: 'collector', label: 'Active collector' },
    ],
    points: 10,
    alContext: 'investment_mindset',
  },
];

// =============================================================================
// DERIVED PERSONA TYPES
// =============================================================================

export const PERSONA_TYPES = {
  track_enthusiast: {
    id: 'track_enthusiast',
    name: 'Track Enthusiast',
    description: 'Lives for lap times and track days',
  },
  spirited_driver: {
    id: 'spirited_driver',
    name: 'Spirited Driver',
    description: 'Enjoys spirited driving on backroads',
  },
  casual_enthusiast: {
    id: 'casual_enthusiast',
    name: 'Casual Enthusiast',
    description: 'Appreciates cars but prioritizes comfort',
  },
  weekend_warrior: {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Daily drives something else, weekend fun car',
  },
  garage_tinkerer: {
    id: 'garage_tinkerer',
    name: 'Garage Tinkerer',
    description: 'Loves working on cars as much as driving',
  },
  show_stopper: {
    id: 'show_stopper',
    name: 'Show Stopper',
    description: 'Aesthetics and presentation come first',
  },
  data_driven: {
    id: 'data_driven',
    name: 'Data Driven',
    description: 'Loves numbers, logging, and optimization',
  },
  community_builder: {
    id: 'community_builder',
    name: 'Community Builder',
    description: 'Connects with others, organizes events',
  },
};

// =============================================================================
// KNOWLEDGE LEVELS
// =============================================================================

export const KNOWLEDGE_LEVELS = {
  beginner: {
    id: 'beginner',
    name: 'Beginner',
    description: 'New to the car world, learning the basics',
    alInstruction: 'Explain concepts clearly, avoid jargon',
  },
  intermediate: {
    id: 'intermediate',
    name: 'Intermediate',
    description: 'Understands basics, ready for more depth',
    alInstruction: 'Can use technical terms with brief explanations',
  },
  expert: {
    id: 'expert',
    name: 'Expert',
    description: 'Deep technical knowledge',
    alInstruction: 'Go technical, skip basic explanations',
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all questions for a specific category
 * @param {string} categoryId - Category ID
 * @returns {Array} Questions in that category
 */
export function getQuestionsByCategory(categoryId) {
  return QUESTIONNAIRE_LIBRARY.filter(q => q.category === categoryId);
}

/**
 * Get the next unanswered question, prioritized by category
 * @param {Set|Array} answeredIds - IDs of already answered questions
 * @param {string} [preferredCategory] - Optional preferred category to pull from
 * @returns {Object|null} Next question to ask, or null if all answered
 */
export function getNextUnansweredQuestion(answeredIds, preferredCategory = null) {
  const answered = new Set(answeredIds);
  
  // Sort categories by priority
  const sortedCategories = Object.values(QUESTION_CATEGORIES)
    .sort((a, b) => a.priority - b.priority);
  
  // If preferred category, check it first
  if (preferredCategory) {
    const preferredQuestions = QUESTIONNAIRE_LIBRARY
      .filter(q => q.category === preferredCategory && !answered.has(q.id));
    if (preferredQuestions.length > 0) {
      return preferredQuestions[0];
    }
  }
  
  // Otherwise, go through categories in priority order
  for (const category of sortedCategories) {
    const unanswered = QUESTIONNAIRE_LIBRARY
      .filter(q => q.category === category.id && !answered.has(q.id));
    if (unanswered.length > 0) {
      return unanswered[0];
    }
  }
  
  return null;
}

/**
 * Get multiple next questions (for showing a batch)
 * @param {Set|Array} answeredIds - IDs of already answered questions
 * @param {number} count - Number of questions to return
 * @returns {Array} Next questions to ask
 */
export function getNextQuestions(answeredIds, count = 3) {
  const answered = new Set(answeredIds);
  const result = [];
  
  // Sort categories by priority
  const sortedCategories = Object.values(QUESTION_CATEGORIES)
    .sort((a, b) => a.priority - b.priority);
  
  for (const category of sortedCategories) {
    if (result.length >= count) break;
    
    const unanswered = QUESTIONNAIRE_LIBRARY
      .filter(q => q.category === category.id && !answered.has(q.id));
    
    for (const q of unanswered) {
      if (result.length >= count) break;
      result.push(q);
    }
  }
  
  return result;
}

/**
 * Calculate profile completeness percentage
 * @param {number} answeredCount - Number of questions answered
 * @returns {number} Percentage (0-100)
 */
export function calculateCompleteness(answeredCount) {
  const totalQuestions = QUESTIONNAIRE_LIBRARY.length;
  return Math.min(100, Math.round((answeredCount / totalQuestions) * 100));
}

/**
 * Calculate category completion stats
 * @param {Set|Array} answeredIds - IDs of answered questions
 * @returns {Object} Category completion map
 */
export function calculateCategoryCompletion(answeredIds) {
  const answered = new Set(answeredIds);
  const stats = {};
  
  for (const category of Object.values(QUESTION_CATEGORIES)) {
    const categoryQuestions = QUESTIONNAIRE_LIBRARY.filter(q => q.category === category.id);
    const answeredInCategory = categoryQuestions.filter(q => answered.has(q.id)).length;
    
    stats[category.id] = {
      answered: answeredInCategory,
      total: categoryQuestions.length,
      percentage: Math.round((answeredInCategory / categoryQuestions.length) * 100),
    };
  }
  
  return stats;
}

/**
 * Calculate total points earned from questionnaire
 * @param {Set|Array} answeredIds - IDs of answered questions
 * @returns {number} Total points
 */
export function calculatePointsEarned(answeredIds) {
  const answered = new Set(answeredIds);
  let total = 0;
  
  for (const question of QUESTIONNAIRE_LIBRARY) {
    if (answered.has(question.id)) {
      total += question.points || 10;
    }
  }
  
  return total;
}

/**
 * Get question by ID
 * @param {string} questionId - Question ID
 * @returns {Object|null} Question object or null
 */
export function getQuestionById(questionId) {
  return QUESTIONNAIRE_LIBRARY.find(q => q.id === questionId) || null;
}

/**
 * Check if a question's prerequisite is met
 * @param {Object} question - Question object with optional prerequisite
 * @param {Object} responses - User's responses keyed by question ID
 * @returns {boolean} Whether the question should be shown
 */
export function checkPrerequisite(question, responses) {
  if (!question.prerequisite) return true;
  
  const { questionId, notEqual, equals } = question.prerequisite;
  const response = responses[questionId];
  
  if (!response) return false;
  
  const value = response.value || response;
  
  if (notEqual !== undefined) {
    return value !== notEqual;
  }
  
  if (equals !== undefined) {
    return value === equals;
  }
  
  return true;
}

/**
 * Filter questions based on prerequisites and already answered
 * @param {Object} responses - User's responses
 * @returns {Array} Available questions
 */
export function getAvailableQuestions(responses = {}) {
  const answeredIds = new Set(Object.keys(responses));
  
  return QUESTIONNAIRE_LIBRARY.filter(q => {
    // Already answered
    if (answeredIds.has(q.id)) return false;
    
    // Check prerequisite
    if (!checkPrerequisite(q, responses)) return false;
    
    return true;
  });
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const TOTAL_QUESTIONS = QUESTIONNAIRE_LIBRARY.length;
export const POINTS_PER_QUESTION = 10;
export const MAX_QUESTIONNAIRE_POINTS = QUESTIONNAIRE_LIBRARY.reduce(
  (sum, q) => sum + (q.points || POINTS_PER_QUESTION), 
  0
);

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

const questionnaireLibrary = {
  QUESTION_CATEGORIES,
  QUESTIONNAIRE_LIBRARY,
  PERSONA_TYPES,
  KNOWLEDGE_LEVELS,
  getQuestionsByCategory,
  getNextUnansweredQuestion,
  getNextQuestions,
  calculateCompleteness,
  calculateCategoryCompletion,
  calculatePointsEarned,
  getQuestionById,
  checkPrerequisite,
  getAvailableQuestions,
  TOTAL_QUESTIONS,
  POINTS_PER_QUESTION,
  MAX_QUESTIONNAIRE_POINTS,
};

export default questionnaireLibrary;
