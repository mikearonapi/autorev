#!/usr/bin/env node
/**
 * Update Car Curated Content Script
 * 
 * Updates a single car's curated content in Supabase.
 * Designed to be run car-by-car to avoid data loss.
 * 
 * Usage:
 *   node scripts/update-car-curated-content.js <slug>
 *   node scripts/update-car-curated-content.js 718-cayman-gt4
 *   node scripts/update-car-curated-content.js --all  (updates all cars with curated data in cars.js)
 * 
 * Prerequisites:
 *   - Run migration 004_add_curated_experience_columns.sql first
 *   - Ensure .env.local has SUPABASE_URL and SUPABASE_SERVICE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { carData } from '../data/cars.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Convert camelCase to snake_case
 */
function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Map local car data to Supabase column format
 */
function mapCarToSupabase(car) {
  return {
    // Brand & Platform
    brand: car.brand || null,
    country: car.country || null,
    platform_cost_tier: car.platformCostTier || null,
    
    // Ownership & Usability
    manual_available: car.manualAvailable ?? null,
    seats: car.seats || null,
    daily_usability_tag: car.dailyUsabilityTag || null,
    maintenance_cost_index: car.maintenanceCostIndex || null,
    insurance_cost_index: car.insuranceCostIndex || null,
    fuel_economy_combined: car.fuelEconomyCombined || null,
    common_issues: car.commonIssues || [],
    years_to_avoid: car.yearsToAvoid || null,
    recommended_years_note: car.recommendedYearsNote || null,
    ownership_cost_notes: car.ownershipCostNotes || null,
    
    // Identity & Story
    essence: car.essence || null,
    heritage: car.heritage || null,
    design_philosophy: car.designPhilosophy || null,
    motorsport_history: car.motorsportHistory || null,
    generation_code: car.generationCode || null,
    predecessors: car.predecessors || [],
    successors: car.successors || [],
    
    // Driving Experience
    engine_character: car.engineCharacter || null,
    transmission_feel: car.transmissionFeel || null,
    chassis_dynamics: car.chassisDynamics || null,
    steering_feel: car.steeringFeel || null,
    brake_confidence: car.brakeConfidence || null,
    sound_signature: car.soundSignature || null,
    comfort_track_balance: car.comfortTrackBalance || null,
    comfort_notes: car.comfortNotes || null,
    
    // Enhanced Strengths & Weaknesses
    defining_strengths: car.definingStrengths || [],
    honest_weaknesses: car.honestWeaknesses || [],
    ideal_owner: car.idealOwner || null,
    not_ideal_for: car.notIdealFor || null,
    
    // Buyer's Guide
    buyers_summary: car.buyersSummary || null,
    best_years_detailed: car.bestYearsDetailed || [],
    years_to_avoid_detailed: car.yearsToAvoidDetailed || null,
    must_have_options: car.mustHaveOptions || [],
    nice_to_have_options: car.niceToHaveOptions || [],
    pre_inspection_checklist: car.preInspectionChecklist || [],
    ppi_recommendations: car.ppiRecommendations || null,
    market_position: car.marketPosition || null,
    market_commentary: car.marketCommentary || null,
    price_guide: car.priceGuide || {},
    
    // Ownership Reality
    annual_ownership_cost: car.annualOwnershipCost || {},
    major_service_costs: car.majorServiceCosts || [],
    common_issues_detailed: car.commonIssuesDetailed || [],
    parts_availability: car.partsAvailability || null,
    parts_notes: car.partsNotes || null,
    dealer_vs_independent: car.dealerVsIndependent || null,
    dealer_notes: car.dealerNotes || null,
    diy_friendliness: car.diyFriendliness || null,
    diy_notes: car.diyNotes || null,
    warranty_info: car.warrantyInfo || null,
    insurance_notes: car.insuranceNotes || null,
    
    // Track & Performance
    track_readiness: car.trackReadiness || null,
    track_readiness_notes: car.trackReadinessNotes || null,
    cooling_capacity: car.coolingCapacity || null,
    brake_fade_resistance: car.brakeFadeResistance || null,
    recommended_track_prep: car.recommendedTrackPrep || [],
    popular_track_mods: car.popularTrackMods || [],
    laptime_benchmarks: car.laptimeBenchmarks || [],
    
    // Alternatives
    direct_competitors: car.directCompetitors || [],
    if_you_want_more: car.ifYouWantMore || [],
    if_you_want_less: car.ifYouWantLess || [],
    similar_driving_experience: car.similarDrivingExperience || [],
    
    // Community & Culture
    community_strength: car.communityStrength || null,
    community_notes: car.communityNotes || null,
    key_resources: car.keyResources || [],
    facebook_groups: car.facebookGroups || [],
    annual_events: car.annualEvents || [],
    aftermarket_scene_notes: car.aftermarketSceneNotes || null,
    resale_reputation: car.resaleReputation || null,
    
    // Media & Reviews
    notable_reviews: car.notableReviews || [],
    must_watch_videos: car.mustWatchVideos || [],
    expert_quotes: car.expertQuotes || [],
  };
}

/**
 * Check if car has curated content
 */
function hasCuratedContent(car) {
  return !!(
    car.essence ||
    car.heritage ||
    car.engineCharacter ||
    car.definingStrengths?.length ||
    car.buyersSummary
  );
}

/**
 * Update a single car's curated content
 */
async function updateCar(slug) {
  const car = carData.find(c => c.slug === slug);
  
  if (!car) {
    console.error(`❌ Car not found in local data: ${slug}`);
    return false;
  }
  
  if (!hasCuratedContent(car)) {
    console.warn(`⚠️  No curated content found for: ${slug}`);
    return false;
  }
  
  const updates = mapCarToSupabase(car);
  
  // Count non-null fields for logging
  const fieldCount = Object.values(updates).filter(v => 
    v !== null && v !== undefined && 
    (typeof v !== 'object' || (Array.isArray(v) ? v.length > 0 : Object.keys(v).length > 0))
  ).length;
  
  console.log(`📝 Updating ${car.name} with ${fieldCount} curated fields...`);
  
  const { data, error } = await supabase
    .from('cars')
    .update(updates)
    .eq('slug', slug)
    .select('slug, name');
  
  if (error) {
    console.error(`❌ Error updating ${slug}:`, error.message);
    return false;
  }
  
  if (!data || data.length === 0) {
    console.error(`❌ Car not found in Supabase: ${slug}`);
    return false;
  }
  
  console.log(`✅ Updated: ${data[0].name}`);
  return true;
}

/**
 * Update all cars that have curated content
 */
async function updateAllCars() {
  const carsWithContent = carData.filter(hasCuratedContent);
  
  console.log(`\n🚗 Found ${carsWithContent.length} cars with curated content\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const car of carsWithContent) {
    const success = await updateCar(car.slug);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  console.log(`\n📊 Results: ${successCount} updated, ${failCount} failed\n`);
}

/**
 * List all cars and their curated content status
 */
async function listCars() {
  console.log('\n📋 Cars Curated Content Status:\n');
  console.log('─'.repeat(60));
  
  const tiers = ['premium', 'upper-mid', 'mid', 'budget'];
  
  for (const tier of tiers) {
    const tierCars = carData.filter(c => c.tier === tier);
    const withContent = tierCars.filter(hasCuratedContent);
    
    console.log(`\n${tier.toUpperCase()} TIER: ${withContent.length}/${tierCars.length} with curated content`);
    console.log('─'.repeat(40));
    
    for (const car of tierCars) {
      const status = hasCuratedContent(car) ? '✅' : '⬜';
      console.log(`  ${status} ${car.name} (${car.slug})`);
    }
  }
  
  console.log('\n');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage:
  node scripts/update-car-curated-content.js <slug>     Update single car
  node scripts/update-car-curated-content.js --all      Update all cars with content
  node scripts/update-car-curated-content.js --list     List all cars and status

Examples:
  node scripts/update-car-curated-content.js 718-cayman-gt4
  node scripts/update-car-curated-content.js --all
`);
    process.exit(0);
  }
  
  const command = args[0];
  
  if (command === '--list') {
    await listCars();
  } else if (command === '--all') {
    await updateAllCars();
  } else {
    await updateCar(command);
  }
}

main().catch(console.error);






