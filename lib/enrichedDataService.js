/**
 * Enriched Data Service
 * 
 * Handles persistence of enriched car data to Supabase.
 * Provides functions to:
 * - Save scraped data to appropriate tables
 * - Retrieve cached enriched data
 * - Check data freshness
 * - Queue scrape jobs
 * - Handle manual data entry
 * 
 * @module lib/enrichedDataService
 */

import { supabase, isSupabaseConfigured } from './supabase.js';

// ============================================================================
// FUEL ECONOMY
// ============================================================================

/**
 * Save fuel economy data for a car
 * @param {string} carSlug 
 * @param {Object} data - EPA fuel economy data
 * @returns {Promise<Object>}
 */
export async function saveFuelEconomy(carSlug, data) {
  if (!isSupabaseConfigured) {
    console.warn('[EnrichedData] Supabase not configured');
    return { success: false, error: 'Supabase not configured' };
  }
  
  try {
    const record = {
      car_slug: carSlug,
      epa_vehicle_id: data.epa?.id,
      city_mpg: data.epa?.cityMpg,
      highway_mpg: data.epa?.highwayMpg,
      combined_mpg: data.epa?.combinedMpg,
      fuel_type: data.epa?.fuelType,
      annual_fuel_cost: data.epa?.annualFuelCost,
      co2_emissions: data.epa?.co2Emissions,
      ghg_score: data.epa?.ghgScore,
      user_avg_mpg: data.userReported?.averageMpg,
      user_city_mpg: data.userReported?.cityMpg,
      user_highway_mpg: data.userReported?.highwayMpg,
      user_sample_size: data.userReported?.userCount,
      is_electric: data.epa?.isElectric || false,
      is_hybrid: data.epa?.isHybrid || false,
      ev_range: data.epa?.evRange,
      source: 'EPA',
      fetched_at: new Date().toISOString(),
    };
    
    const { data: result, error } = await supabase
      .from('car_fuel_economy')
      .upsert(record, { onConflict: 'car_slug' })
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, data: result };
  } catch (err) {
    console.error('[EnrichedData] Error saving fuel economy:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get fuel economy data for a car
 * @param {string} carSlug 
 * @returns {Promise<Object|null>}
 */
export async function getFuelEconomy(carSlug) {
  if (!isSupabaseConfigured) return null;
  
  try {
    const { data, error } = await supabase
      .from('car_fuel_economy')
      .select('*')
      .eq('car_slug', carSlug)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // Ignore "not found"
    
    return data;
  } catch (err) {
    console.error('[EnrichedData] Error fetching fuel economy:', err);
    return null;
  }
}

// ============================================================================
// SAFETY DATA
// ============================================================================

/**
 * Save safety data for a car
 * @param {string} carSlug 
 * @param {Object} data - Combined NHTSA and IIHS data
 * @returns {Promise<Object>}
 */
export async function saveSafetyData(carSlug, data) {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }
  
  try {
    const record = {
      car_slug: carSlug,
      
      // NHTSA Ratings
      nhtsa_overall_rating: data.nhtsa?.crashTestRatings?.overall 
        ? parseInt(data.nhtsa.crashTestRatings.overall) : null,
      nhtsa_front_crash_rating: data.nhtsa?.crashTestRatings?.frontCrash 
        ? parseInt(data.nhtsa.crashTestRatings.frontCrash) : null,
      nhtsa_side_crash_rating: data.nhtsa?.crashTestRatings?.sideCrash
        ? parseInt(data.nhtsa.crashTestRatings.sideCrash) : null,
      nhtsa_rollover_rating: data.nhtsa?.crashTestRatings?.rollover
        ? parseInt(data.nhtsa.crashTestRatings.rollover) : null,
      
      // NHTSA Counts
      recall_count: data.nhtsa?.recalls?.count || 0,
      complaint_count: data.nhtsa?.complaints?.count || 0,
      investigation_count: data.nhtsa?.investigations?.count || 0,
      tsb_count: data.nhtsa?.tsbs?.count || 0,
      has_open_recalls: data.nhtsa?.recalls?.hasOpenRecalls || false,
      has_open_investigations: (data.nhtsa?.investigations?.openCount || 0) > 0,
      
      // IIHS Ratings
      iihs_overall: data.iihs?.overallAssessment,
      iihs_small_overlap_front: data.iihs?.crashworthiness?.smallOverlapFront,
      iihs_moderate_overlap_front: data.iihs?.crashworthiness?.moderateOverlapFront,
      iihs_side: data.iihs?.crashworthiness?.side,
      iihs_roof_strength: data.iihs?.crashworthiness?.roofStrength,
      iihs_head_restraints: data.iihs?.crashworthiness?.headRestraints,
      iihs_front_crash_prevention: data.iihs?.crashAvoidance?.frontCrashPrevention,
      iihs_headlight_rating: data.iihs?.headlightRating,
      iihs_top_safety_pick: data.iihs?.topSafetyPick || false,
      iihs_top_safety_pick_plus: data.iihs?.topSafetyPickPlus || false,
      
      // Computed Score
      safety_score: data.summary?.overallScore,
      safety_grade: data.summary?.grade,
      
      // Timestamps
      nhtsa_fetched_at: data.nhtsa ? new Date().toISOString() : null,
      iihs_fetched_at: data.iihs ? new Date().toISOString() : null,
    };
    
    const { data: result, error } = await supabase
      .from('car_safety_data')
      .upsert(record, { onConflict: 'car_slug' })
      .select()
      .single();
    
    if (error) throw error;
    
    // Save individual recalls
    if (data.nhtsa?.recalls?.items) {
      await saveRecalls(carSlug, data.nhtsa.recalls.items);
    }
    
    return { success: true, data: result };
  } catch (err) {
    console.error('[EnrichedData] Error saving safety data:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Save individual recall records
 * @param {string} carSlug 
 * @param {Array} recalls 
 */
async function saveRecalls(carSlug, recalls) {
  if (!recalls || recalls.length === 0) return;
  
  const records = recalls.map(r => ({
    car_slug: carSlug,
    campaign_number: r.campaignNumber,
    component: r.component,
    summary: r.summary,
    consequence: r.consequence,
    remedy: r.remedy,
    report_received_date: r.reportReceivedDate,
    is_incomplete: r.incomplete || false,
  }));
  
  try {
    await supabase
      .from('car_recalls')
      .upsert(records, { onConflict: 'car_slug,campaign_number' });
  } catch (err) {
    console.error('[EnrichedData] Error saving recalls:', err);
  }
}

/**
 * Get safety data for a car
 * @param {string} carSlug 
 * @returns {Promise<Object|null>}
 */
export async function getSafetyData(carSlug) {
  if (!isSupabaseConfigured) return null;
  
  try {
    const { data, error } = await supabase
      .from('car_safety_data')
      .select('*')
      .eq('car_slug', carSlug)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    return data;
  } catch (err) {
    console.error('[EnrichedData] Error fetching safety data:', err);
    return null;
  }
}

// ============================================================================
// MARKET PRICING
// ============================================================================

/**
 * Save market pricing data
 * @param {string} carSlug 
 * @param {Object} data - Pricing from BaT, Hagerty, Cars.com
 * @returns {Promise<Object>}
 */
export async function saveMarketPricing(carSlug, data) {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }
  
  try {
    const record = {
      car_slug: carSlug,
      
      // Bring a Trailer
      bat_avg_price: data.bringATrailer?.averagePrice,
      bat_median_price: data.bringATrailer?.medianPrice,
      bat_min_price: data.bringATrailer?.minPrice,
      bat_max_price: data.bringATrailer?.maxPrice,
      bat_sample_size: data.bringATrailer?.sampleSize,
      bat_sell_through_rate: data.bringATrailer?.sellThroughRate,
      bat_avg_mileage: data.bringATrailer?.averageMileage,
      bat_fetched_at: data.bringATrailer ? new Date().toISOString() : null,
      
      // Hagerty
      hagerty_concours: data.hagerty?.values?.concours,
      hagerty_excellent: data.hagerty?.values?.excellent,
      hagerty_good: data.hagerty?.values?.good,
      hagerty_fair: data.hagerty?.values?.fair,
      hagerty_trend: data.hagerty?.trend,
      hagerty_trend_percent: data.hagerty?.trendPercent,
      hagerty_fetched_at: data.hagerty ? new Date().toISOString() : null,
      
      // Cars.com
      carscom_avg_price: data.carsCom?.averagePrice,
      carscom_median_price: data.carsCom?.medianPrice,
      carscom_min_price: data.carsCom?.minPrice,
      carscom_max_price: data.carsCom?.maxPrice,
      carscom_listing_count: data.carsCom?.listingCount,
      carscom_avg_mileage: data.carsCom?.averageMileage,
      carscom_fetched_at: data.carsCom ? new Date().toISOString() : null,
      
      // Consensus (will be computed)
      consensus_price: data.consensus?.price,
      price_confidence: calculatePriceConfidence(data),
    };
    
    const { data: result, error } = await supabase
      .from('car_market_pricing')
      .upsert(record, { onConflict: 'car_slug' })
      .select()
      .single();
    
    if (error) throw error;
    
    // Save to price history
    await savePriceHistory(carSlug, data);
    
    // Save auction results if available
    if (data.bringATrailer?.recentSales) {
      await saveAuctionResults(carSlug, data.bringATrailer.recentSales);
    }
    
    return { success: true, data: result };
  } catch (err) {
    console.error('[EnrichedData] Error saving market pricing:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Save per-year market pricing stats (nuanced pricing) for a given source.
 * Persists to `car_market_pricing_years`.
 *
 * @param {string} carSlug
 * @param {string} source - e.g. 'carscom', 'bat'
 * @param {Array<Object>} years - array of per-year stats
 * @returns {Promise<{success:boolean, error?:string, count?:number}>}
 */
export async function saveMarketPricingYears(carSlug, source, years) {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }
  
  if (!carSlug || !source || !Array.isArray(years)) {
    return { success: false, error: 'Invalid input' };
  }
  
  const records = years
    .filter(y => Number.isFinite(y?.year))
    .map(y => ({
      car_slug: carSlug,
      source,
      year: y.year,
      median_price: y.medianPrice ?? y.median_price ?? null,
      average_price: y.averagePrice ?? y.average_price ?? null,
      min_price: y.minPrice ?? y.min_price ?? null,
      max_price: y.maxPrice ?? y.max_price ?? null,
      p10_price: y.p10Price ?? y.p10_price ?? null,
      p90_price: y.p90Price ?? y.p90_price ?? null,
      listing_count: y.listingCount ?? y.listing_count ?? 0,
      average_mileage: y.averageMileage ?? y.average_mileage ?? null,
      price_by_mileage: y.priceByMileage ?? y.price_by_mileage ?? null,
      fetched_at: new Date().toISOString(),
    }));
  
  if (records.length === 0) {
    return { success: false, error: 'No valid year records' };
  }
  
  try {
    const { error } = await supabase
      .from('car_market_pricing_years')
      .upsert(records, { onConflict: 'car_slug,source,year' });
    
    if (error) throw error;
    
    return { success: true, count: records.length };
  } catch (err) {
    console.error('[EnrichedData] Error saving yearly market pricing:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Save price history point
 * @param {string} carSlug 
 * @param {Object} data 
 */
async function savePriceHistory(carSlug, data) {
  const records = [];
  const today = new Date().toISOString().split('T')[0];
  
  if (data.bringATrailer?.averagePrice) {
    records.push({
      car_slug: carSlug,
      source: 'bat',
      price: data.bringATrailer.averagePrice,
      recorded_at: today,
    });
  }
  
  if (data.hagerty?.values?.good) {
    records.push({
      car_slug: carSlug,
      source: 'hagerty',
      price: data.hagerty.values.good,
      recorded_at: today,
    });
  }
  
  if (data.carsCom?.averagePrice) {
    records.push({
      car_slug: carSlug,
      source: 'carscom',
      price: data.carsCom.averagePrice,
      recorded_at: today,
    });
  }
  
  if (records.length > 0) {
    try {
      await supabase
        .from('car_price_history')
        .upsert(records, { onConflict: 'car_slug,source,recorded_at' });
    } catch (err) {
      console.error('[EnrichedData] Error saving price history:', err);
    }
  }
}

/**
 * Save auction results
 * @param {string} carSlug 
 * @param {Array} auctions 
 */
async function saveAuctionResults(carSlug, auctions) {
  if (!auctions || auctions.length === 0) return;
  
  const records = auctions.map(a => ({
    car_slug: carSlug,
    auction_id: a.id,
    source: 'bringatrailer',
    auction_url: a.url,
    title: a.title,
    year: a.year,
    make: a.make,
    model: a.model,
    mileage: a.mileage,
    transmission: a.transmission,
    sold_price: a.soldPrice,
    high_bid: a.highBid,
    sold: a.sold,
    reserve_not_met: a.reserveNotMet,
    bid_count: a.bidCount,
    auction_end_date: a.endDate,
    location: a.location,
    thumbnail_url: a.thumbnailUrl,
    highlights: a.highlights,
    fetched_at: new Date().toISOString(),
  }));
  
  try {
    await supabase
      .from('car_auction_results')
      .upsert(records, { onConflict: 'auction_id,source' });
  } catch (err) {
    console.error('[EnrichedData] Error saving auction results:', err);
  }
}

/**
 * Calculate price confidence based on data sources
 * @param {Object} data 
 * @returns {string}
 */
function calculatePriceConfidence(data) {
  let sources = 0;
  
  if (data.bringATrailer?.sampleSize > 5) sources++;
  if (data.hagerty?.values) sources++;
  if (data.carsCom?.listingCount > 10) sources++;
  
  if (sources >= 3) return 'high';
  if (sources >= 2) return 'medium';
  return 'low';
}

/**
 * Get market pricing for a car
 * @param {string} carSlug 
 * @returns {Promise<Object|null>}
 */
export async function getMarketPricing(carSlug) {
  if (!isSupabaseConfigured) return null;
  
  try {
    const { data, error } = await supabase
      .from('car_market_pricing')
      .select('*')
      .eq('car_slug', carSlug)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    return data;
  } catch (err) {
    console.error('[EnrichedData] Error fetching market pricing:', err);
    return null;
  }
}

/**
 * Get price history for a car
 * @param {string} carSlug 
 * @param {number} days - Number of days to look back
 * @returns {Promise<Array>}
 */
export async function getPriceHistory(carSlug, days = 365) {
  if (!isSupabaseConfigured) return [];
  
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('car_price_history')
      .select('*')
      .eq('car_slug', carSlug)
      .gte('recorded_at', startDate.toISOString().split('T')[0])
      .order('recorded_at', { ascending: true });
    
    if (error) throw error;
    
    return data || [];
  } catch (err) {
    console.error('[EnrichedData] Error fetching price history:', err);
    return [];
  }
}

// ============================================================================
// EXPERT REVIEWS
// ============================================================================

/**
 * Save expert review
 * @param {string} carSlug 
 * @param {Object} review 
 * @returns {Promise<Object>}
 */
export async function saveExpertReview(carSlug, review) {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }
  
  try {
    const record = {
      car_slug: carSlug,
      source: review.source?.toLowerCase().replace(/\s+/g, ''),
      source_url: review.url,
      title: review.title,
      overall_rating: review.rating,
      performance_rating: review.categoryRatings?.performance,
      handling_rating: review.categoryRatings?.handling,
      comfort_rating: review.categoryRatings?.comfort,
      interior_rating: review.categoryRatings?.interior,
      value_rating: review.categoryRatings?.value,
      pros: review.highs || review.pros,
      cons: review.lows || review.cons,
      verdict: review.verdict,
      zero_to_sixty: review.testData?.zeroToSixty,
      zero_to_hundred: review.testData?.zeroToHundred,
      quarter_mile: review.testData?.quarterMile,
      quarter_mile_speed: review.testData?.quarterMileSpeed,
      braking_70_to_0: review.testData?.braking70to0,
      skidpad_g: review.testData?.skidpad,
      review_date: review.reviewDate,
      review_type: review.reviewType || 'review',
      fetched_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('car_expert_reviews')
      .upsert(record, { onConflict: 'car_slug,source,source_url' })
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (err) {
    console.error('[EnrichedData] Error saving expert review:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get expert reviews for a car
 * @param {string} carSlug 
 * @returns {Promise<Array>}
 */
export async function getExpertReviews(carSlug) {
  if (!isSupabaseConfigured) return [];
  
  try {
    const { data, error } = await supabase
      .from('car_expert_reviews')
      .select('*')
      .eq('car_slug', carSlug)
      .order('review_date', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (err) {
    console.error('[EnrichedData] Error fetching expert reviews:', err);
    return [];
  }
}

// ============================================================================
// DATA FRESHNESS
// ============================================================================

/**
 * Check data freshness for a car
 * @param {string} carSlug 
 * @returns {Promise<Object>}
 */
export async function checkDataFreshness(carSlug) {
  if (!isSupabaseConfigured) {
    return { error: 'Supabase not configured' };
  }
  
  const now = new Date();
  const freshness = {
    fuelEconomy: { fresh: false, age: null, maxAge: 7 },
    nhtsaSafety: { fresh: false, age: null, maxAge: 7 },
    iihsSafety: { fresh: false, age: null, maxAge: 30 },
    batPricing: { fresh: false, age: null, maxAge: 7 },
    hagertyPricing: { fresh: false, age: null, maxAge: 30 },
    carscomPricing: { fresh: false, age: null, maxAge: 3 },
  };
  
  try {
    // Check fuel economy
    const fuelData = await getFuelEconomy(carSlug);
    if (fuelData?.fetched_at) {
      const age = Math.floor((now - new Date(fuelData.fetched_at)) / (1000 * 60 * 60 * 24));
      freshness.fuelEconomy = { fresh: age < 7, age, maxAge: 7 };
    }
    
    // Check safety data
    const safetyData = await getSafetyData(carSlug);
    if (safetyData?.nhtsa_fetched_at) {
      const age = Math.floor((now - new Date(safetyData.nhtsa_fetched_at)) / (1000 * 60 * 60 * 24));
      freshness.nhtsaSafety = { fresh: age < 7, age, maxAge: 7 };
    }
    if (safetyData?.iihs_fetched_at) {
      const age = Math.floor((now - new Date(safetyData.iihs_fetched_at)) / (1000 * 60 * 60 * 24));
      freshness.iihsSafety = { fresh: age < 30, age, maxAge: 30 };
    }
    
    // Check pricing data
    const pricingData = await getMarketPricing(carSlug);
    if (pricingData?.bat_fetched_at) {
      const age = Math.floor((now - new Date(pricingData.bat_fetched_at)) / (1000 * 60 * 60 * 24));
      freshness.batPricing = { fresh: age < 7, age, maxAge: 7 };
    }
    if (pricingData?.hagerty_fetched_at) {
      const age = Math.floor((now - new Date(pricingData.hagerty_fetched_at)) / (1000 * 60 * 60 * 24));
      freshness.hagertyPricing = { fresh: age < 30, age, maxAge: 30 };
    }
    if (pricingData?.carscom_fetched_at) {
      const age = Math.floor((now - new Date(pricingData.carscom_fetched_at)) / (1000 * 60 * 60 * 24));
      freshness.carscomPricing = { fresh: age < 3, age, maxAge: 3 };
    }
    
    // Calculate overall freshness
    const totalSources = Object.keys(freshness).length;
    const freshSources = Object.values(freshness).filter(f => f.fresh).length;
    
    return {
      sources: freshness,
      overallFresh: freshSources / totalSources > 0.5,
      freshPercent: Math.round((freshSources / totalSources) * 100),
      staleCategories: Object.entries(freshness)
        .filter(([_, v]) => !v.fresh && v.age !== null)
        .map(([k]) => k),
    };
  } catch (err) {
    console.error('[EnrichedData] Error checking freshness:', err);
    return { error: err.message };
  }
}

// ============================================================================
// GET ALL ENRICHED DATA
// ============================================================================

/**
 * Get all enriched data for a car
 * @param {string} carSlug 
 * @returns {Promise<Object>}
 */
export async function getAllEnrichedData(carSlug) {
  const [fuelEconomy, safetyData, marketPricing, expertReviews, priceHistory, freshness] = await Promise.all([
    getFuelEconomy(carSlug),
    getSafetyData(carSlug),
    getMarketPricing(carSlug),
    getExpertReviews(carSlug),
    getPriceHistory(carSlug, 365),
    checkDataFreshness(carSlug),
  ]);
  
  return {
    carSlug,
    fuelEconomy,
    safety: safetyData,
    pricing: marketPricing,
    priceHistory,
    reviews: expertReviews,
    freshness,
    hasData: !!(fuelEconomy || safetyData || marketPricing || expertReviews.length > 0),
  };
}

// ============================================================================
// MANUAL DATA ENTRY
// ============================================================================

/**
 * Save manual data entry
 * @param {string} carSlug 
 * @param {string} dataType - pricing, review, safety, specs
 * @param {Object} data 
 * @param {Object} meta - source, sourceUrl, notes, enteredBy
 * @returns {Promise<Object>}
 */
export async function saveManualData(carSlug, dataType, data, meta = {}) {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }
  
  try {
    const record = {
      car_slug: carSlug,
      data_type: dataType,
      source: meta.source,
      source_url: meta.sourceUrl,
      data,
      notes: meta.notes,
      entered_by: meta.enteredBy,
      verified: false,
    };
    
    const { data: result, error } = await supabase
      .from('car_manual_data')
      .insert(record)
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, data: result };
  } catch (err) {
    console.error('[EnrichedData] Error saving manual data:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get manual data entries for a car
 * @param {string} carSlug 
 * @param {string} [dataType] - Optional filter by type
 * @returns {Promise<Array>}
 */
export async function getManualData(carSlug, dataType = null) {
  if (!isSupabaseConfigured) return [];
  
  try {
    let query = supabase
      .from('car_manual_data')
      .select('*')
      .eq('car_slug', carSlug)
      .order('created_at', { ascending: false });
    
    if (dataType) {
      query = query.eq('data_type', dataType);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data || [];
  } catch (err) {
    console.error('[EnrichedData] Error fetching manual data:', err);
    return [];
  }
}

const enrichedDataService = {
  // Fuel Economy
  saveFuelEconomy,
  getFuelEconomy,
  
  // Safety
  saveSafetyData,
  getSafetyData,
  
  // Pricing
  saveMarketPricing,
  getMarketPricing,
  getPriceHistory,
  
  // Reviews
  saveExpertReview,
  getExpertReviews,
  
  // All Data
  getAllEnrichedData,
  checkDataFreshness,
  
  // Manual Entry
  saveManualData,
  getManualData,
};

export default enrichedDataService;














