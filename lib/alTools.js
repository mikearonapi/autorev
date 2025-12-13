/**
 * AL Tools Service
 * 
 * Implements all the tool functions that AL can call via Claude's tool use.
 * These functions provide AL with access to:
 * - Car database (search, details, comparisons)
 * - Expert reviews (YouTube content)
 * - Encyclopedia (mods, systems, guides)
 * - Known issues database
 * - Maintenance specifications
 * - Forum/web search
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { carData } from '@/data/cars';
import { fetchVideosForCar, calculateCarConsensus } from './youtubeClient';
import { searchEncyclopedia, getModificationArticle, getBuildGuideArticle } from './encyclopediaData';
import { upgradeDetails, upgradeCategories } from '@/data/upgradeEducation';

// =============================================================================
// CAR SEARCH & DATABASE
// =============================================================================

/**
 * Search cars by various criteria
 * @param {Object} params - Search parameters
 * @returns {Object} Search results with matching cars
 */
export async function searchCars({ query, filters = {}, sort_by = 'value', limit = 5 }) {
  let results = [...carData];
  
  // Apply filters
  if (filters.budget_min) {
    results = results.filter(c => (c.priceAvg || 0) >= filters.budget_min);
  }
  if (filters.budget_max) {
    results = results.filter(c => (c.priceAvg || 0) <= filters.budget_max);
  }
  if (filters.hp_min) {
    results = results.filter(c => (c.hp || 0) >= filters.hp_min);
  }
  if (filters.hp_max) {
    results = results.filter(c => (c.hp || 0) <= filters.hp_max);
  }
  if (filters.category) {
    results = results.filter(c => c.category === filters.category);
  }
  if (filters.drivetrain) {
    results = results.filter(c => c.drivetrain === filters.drivetrain);
  }
  if (filters.tier) {
    results = results.filter(c => c.tier === filters.tier);
  }
  if (filters.brand) {
    const brandLower = filters.brand.toLowerCase();
    results = results.filter(c => 
      c.brand?.toLowerCase().includes(brandLower) ||
      c.name?.toLowerCase().includes(brandLower)
    );
  }
  if (filters.manual_available !== undefined) {
    results = results.filter(c => c.manualAvailable === filters.manual_available);
  }
  
  // Text search on query
  if (query) {
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/);
    
    results = results.filter(car => {
      const searchText = [
        car.name,
        car.brand,
        car.category,
        car.engine,
        car.notes,
        car.highlight,
        car.tagline,
      ].filter(Boolean).join(' ').toLowerCase();
      
      return queryTerms.some(term => searchText.includes(term));
    });
  }
  
  // Sort results
  const sortFunctions = {
    hp: (a, b) => (b.hp || 0) - (a.hp || 0),
    price: (a, b) => (a.priceAvg || 0) - (b.priceAvg || 0),
    value: (a, b) => (b.value || b.score_value || 5) - (a.value || a.score_value || 5),
    track: (a, b) => (b.track || b.score_track || 5) - (a.track || a.score_track || 5),
    reliability: (a, b) => (b.reliability || b.score_reliability || 5) - (a.reliability || a.score_reliability || 5),
    sound: (a, b) => (b.sound || b.score_sound || 5) - (a.sound || a.score_sound || 5),
  };
  
  if (sortFunctions[sort_by]) {
    results.sort(sortFunctions[sort_by]);
  }
  
  // Limit results
  results = results.slice(0, limit);
  
  // Format for AL
  return {
    count: results.length,
    cars: results.map(car => ({
      name: car.name,
      slug: car.slug,
      years: car.years,
      hp: car.hp,
      engine: car.engine,
      priceRange: car.priceRange,
      priceAvg: car.priceAvg,
      category: car.category,
      drivetrain: car.drivetrain,
      highlight: car.highlight,
      scores: {
        sound: car.sound || car.score_sound,
        track: car.track || car.score_track,
        reliability: car.reliability || car.score_reliability,
        value: car.value || car.score_value,
        driverFun: car.driverFun || car.score_driver_fun,
      },
    })),
  };
}

/**
 * Get comprehensive details about a specific car
 * @param {Object} params - Parameters including car_slug and what to include
 * @returns {Object} Detailed car information
 */
export async function getCarDetails({ car_slug, include = ['specs', 'scores'] }) {
  // Find car in local data
  const car = carData.find(c => c.slug === car_slug);
  if (!car) {
    return { error: `Car not found: ${car_slug}` };
  }
  
  const result = {
    name: car.name,
    slug: car.slug,
    years: car.years,
    category: car.category,
    tier: car.tier,
  };
  
  if (include.includes('specs')) {
    result.specs = {
      engine: car.engine,
      hp: car.hp,
      torque: car.torque,
      trans: car.trans,
      drivetrain: car.drivetrain,
      curbWeight: car.curbWeight,
      zeroToSixty: car.zeroToSixty,
      topSpeed: car.topSpeed,
      quarterMile: car.quarterMile,
      braking60To0: car.braking60To0,
      lateralG: car.lateralG,
    };
  }
  
  if (include.includes('scores')) {
    result.scores = {
      sound: car.sound || car.score_sound,
      interior: car.interior || car.score_interior,
      track: car.track || car.score_track,
      reliability: car.reliability || car.score_reliability,
      value: car.value || car.score_value,
      driverFun: car.driverFun || car.score_driver_fun,
      aftermarket: car.aftermarket || car.score_aftermarket,
    };
    result.highlight = car.highlight;
    result.notes = car.notes;
  }
  
  if (include.includes('buyer_guide')) {
    result.buyerGuide = {
      priceRange: car.priceRange,
      priceAvg: car.priceAvg,
      msrpNew: car.msrpNewLow && car.msrpNewHigh ? `$${car.msrpNewLow.toLocaleString()} - $${car.msrpNewHigh.toLocaleString()}` : null,
      bestFor: car.bestFor,
      pros: car.pros,
      cons: car.cons,
      idealOwner: car.idealOwner,
      notIdealFor: car.notIdealFor,
      yearsToAvoid: car.yearsToAvoid,
      recommendedYears: car.recommendedYearsNote,
      buyersSummary: car.buyersSummary,
    };
  }
  
  if (include.includes('ownership_costs')) {
    result.ownership = {
      annualCost: car.annualOwnershipCost,
      majorServiceCosts: car.majorServiceCosts,
      partsAvailability: car.partsAvailability,
      dealerVsIndependent: car.dealerVsIndependent,
      diyFriendliness: car.diyFriendliness,
      insuranceNotes: car.insuranceNotes,
      maintenanceCostIndex: car.maintenanceCostIndex,
    };
  }
  
  // Try to get additional data from Supabase
  if (isSupabaseConfigured && supabase) {
    const promises = [];

    if (include.includes('known_issues')) {
      promises.push(
        supabase
          .from('car_known_issues')
          .select('*')
          .eq('car_slug', car_slug)
          .order('severity', { ascending: true })
          .then(({ data: issues }) => {
            if (issues && issues.length > 0) {
              result.knownIssues = issues.map(issue => ({
                name: issue.issue_name,
                severity: issue.severity,
                affectedYears: issue.affected_years,
                description: issue.description,
                symptoms: issue.symptoms,
                estimatedCost: issue.estimated_cost,
              }));
            }
          })
          .catch(err => console.warn('[AL Tools] Error fetching known issues:', err))
      );
    }
  
    if (include.includes('maintenance')) {
      promises.push(
        supabase
          .from('vehicle_maintenance_specs')
          .select('*')
          .eq('car_slug', car_slug)
          .single()
          .then(({ data: specs }) => {
            if (specs) {
              result.maintenance = {
                oilType: specs.oil_type,
                oilCapacity: specs.oil_capacity,
                oilChangeInterval: specs.oil_change_interval,
                fuelOctane: specs.fuel_octane,
                coolantType: specs.coolant_type,
                brakeFluidType: specs.brake_fluid_type,
                tirePressureFront: specs.tire_pressure_front,
                tirePressureRear: specs.tire_pressure_rear,
                tireSizeFront: specs.tire_size_front,
                tireSizeRear: specs.tire_size_rear,
              };
            }
          })
          .catch(err => console.warn('[AL Tools] Error fetching maintenance specs:', err))
      );
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }
  
  return result;
}

/**
 * Get expert YouTube reviews for a car
 * @param {Object} params - Parameters including car_slug
 * @returns {Object} Expert reviews and consensus
 */
export async function getExpertReviews({ car_slug, limit = 3, include_quotes = true }) {
  // Try to get from database
  if (isSupabaseConfigured) {
    try {
      const videos = await fetchVideosForCar(car_slug, { limit });
      
      if (videos && videos.length > 0) {
        const consensus = await calculateCarConsensus(car_slug);
        
        return {
          reviewCount: videos.length,
          reviews: videos.map(v => ({
            title: v.youtube_videos?.title,
            channel: v.youtube_videos?.channel_name,
            url: v.youtube_videos?.url,
            summary: v.youtube_videos?.summary,
            oneLiner: v.youtube_videos?.one_line_take,
            keyPoints: v.youtube_videos?.key_points,
            pros: v.youtube_videos?.pros_mentioned,
            cons: v.youtube_videos?.cons_mentioned,
            quotes: include_quotes ? v.youtube_videos?.notable_quotes : undefined,
          })),
          consensus: consensus ? {
            overallStrengths: consensus.strengths?.map(s => s.tag).slice(0, 3),
            overallWeaknesses: consensus.weaknesses?.map(w => w.tag).slice(0, 3),
            frequentlyComparedTo: consensus.comparisons?.map(c => c.slug).slice(0, 3),
          } : null,
        };
      }
    } catch (err) {
      console.warn('[AL Tools] Error fetching expert reviews:', err);
    }
  }
  
  // Return placeholder if no data
  return {
    reviewCount: 0,
    message: 'No expert reviews found in database for this car.',
  };
}

/**
 * Get known issues for a car
 * @param {Object} params - Parameters including car_slug
 * @returns {Object} Known issues
 */
export async function getKnownIssues({ car_slug, severity_filter = 'All' }) {
  // First check local car data for common issues
  const car = carData.find(c => c.slug === car_slug);
  let localIssues = [];
  
  if (car?.commonIssuesDetailed) {
    localIssues = car.commonIssuesDetailed;
  } else if (car?.commonIssues) {
    localIssues = car.commonIssues.map(issue => ({ issue, severity: 'Unknown' }));
  }
  
  // Try database
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('car_known_issues')
        .select('*')
        .eq('car_slug', car_slug)
        .order('sort_order', { ascending: true });
      
      if (severity_filter !== 'All') {
        query = query.eq('severity', severity_filter);
      }
      
      const { data: dbIssues } = await query;
      
      if (dbIssues && dbIssues.length > 0) {
        return {
          carName: car?.name || car_slug,
          issueCount: dbIssues.length,
          issues: dbIssues.map(issue => ({
            name: issue.issue_name,
            severity: issue.severity,
            affectedYears: issue.affected_years,
            description: issue.description,
            symptoms: issue.symptoms,
            prevention: issue.prevention,
            fix: issue.fix_description,
            estimatedCost: issue.estimated_cost,
          })),
        };
      }
    } catch (err) {
      console.warn('[AL Tools] Error fetching known issues from DB:', err);
    }
  }
  
  // Return local issues if DB fetch failed
  if (localIssues.length > 0) {
    return {
      carName: car?.name || car_slug,
      issueCount: localIssues.length,
      issues: localIssues,
      source: 'local_data',
    };
  }
  
  return {
    carName: car?.name || car_slug,
    issueCount: 0,
    message: 'No known issues documented for this car in our database.',
  };
}

/**
 * Compare multiple cars
 * @param {Object} params - Parameters including car_slugs array
 * @returns {Object} Comparison data
 */
export async function compareCars({ car_slugs, focus_areas = [] }) {
  const cars = car_slugs
    .map(slug => carData.find(c => c.slug === slug))
    .filter(Boolean);
  
  if (cars.length < 2) {
    return { error: 'At least 2 valid cars required for comparison' };
  }
  
  const comparison = {
    cars: cars.map(car => ({
      name: car.name,
      slug: car.slug,
      years: car.years,
      hp: car.hp,
      torque: car.torque,
      engine: car.engine,
      curbWeight: car.curbWeight,
      zeroToSixty: car.zeroToSixty,
      priceRange: car.priceRange,
      priceAvg: car.priceAvg,
      category: car.category,
      drivetrain: car.drivetrain,
      trans: car.trans,
    })),
    scores: {},
    analysis: {},
  };
  
  // Build score comparisons
  const scoreFields = [
    { key: 'sound', label: 'Sound & Emotion' },
    { key: 'interior', label: 'Interior Quality' },
    { key: 'track', label: 'Track Capability' },
    { key: 'reliability', label: 'Reliability' },
    { key: 'value', label: 'Value' },
    { key: 'driverFun', label: 'Driver Fun' },
    { key: 'aftermarket', label: 'Aftermarket Support' },
  ];
  
  for (const field of scoreFields) {
    comparison.scores[field.key] = cars.map(car => ({
      name: car.name,
      score: car[field.key] || car[`score_${field.key}`] || null,
    }));
  }
  
  // Focus area analysis
  if (focus_areas.includes('performance') || focus_areas.length === 0) {
    const powerWinner = cars.reduce((a, b) => (a.hp || 0) > (b.hp || 0) ? a : b);
    const quickestCar = cars.reduce((a, b) => 
      (a.zeroToSixty || 99) < (b.zeroToSixty || 99) ? a : b
    );
    
    comparison.analysis.performance = {
      mostPowerful: { name: powerWinner.name, hp: powerWinner.hp },
      quickest: { name: quickestCar.name, zeroToSixty: quickestCar.zeroToSixty },
    };
  }
  
  if (focus_areas.includes('value') || focus_areas.length === 0) {
    const bestValue = cars.reduce((a, b) => {
      const aValue = (a.value || a.score_value || 5);
      const bValue = (b.value || b.score_value || 5);
      return aValue > bValue ? a : b;
    });
    const lowestPrice = cars.reduce((a, b) => 
      (a.priceAvg || 999999) < (b.priceAvg || 999999) ? a : b
    );
    
    comparison.analysis.value = {
      bestValue: { name: bestValue.name, score: bestValue.value || bestValue.score_value },
      lowestPrice: { name: lowestPrice.name, priceRange: lowestPrice.priceRange },
    };
  }
  
  if (focus_areas.includes('reliability') || focus_areas.length === 0) {
    const mostReliable = cars.reduce((a, b) => {
      const aRel = (a.reliability || a.score_reliability || 5);
      const bRel = (b.reliability || b.score_reliability || 5);
      return aRel > bRel ? a : b;
    });
    
    comparison.analysis.reliability = {
      mostReliable: { 
        name: mostReliable.name, 
        score: mostReliable.reliability || mostReliable.score_reliability,
      },
    };
  }
  
  return comparison;
}

// =============================================================================
// ENCYCLOPEDIA & KNOWLEDGE
// =============================================================================

/**
 * Search the encyclopedia for mods, systems, and guides
 * @param {Object} params - Search parameters
 * @returns {Object} Search results
 */
export async function searchEncyclopediaContent({ query, category = 'all' }) {
  const results = searchEncyclopedia(query);
  
  // Filter by category if specified
  let filtered = results;
  if (category !== 'all') {
    const categoryMap = {
      modifications: ['modification', 'category'],
      systems: ['system'],
      components: ['component'],
      build_guides: ['buildGuide'],
    };
    const types = categoryMap[category] || [];
    filtered = results.filter(r => types.includes(r.type));
  }
  
  return {
    query,
    resultCount: filtered.length,
    results: filtered.slice(0, 10).map(r => ({
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
      type: r.type,
      section: r.section,
    })),
  };
}

/**
 * Get detailed upgrade/modification info
 * @param {Object} params - Parameters including upgrade_key
 * @returns {Object} Detailed upgrade information
 */
export async function getUpgradeInfo({ upgrade_key, car_slug = null }) {
  // Try to find in upgrade details
  const upgrade = upgradeDetails[upgrade_key];
  
  if (!upgrade) {
    // Try article lookup
    const article = getModificationArticle(upgrade_key);
    if (article) {
      return {
        name: article.title,
        description: article.summary,
        sections: article.sections,
        metadata: article.metadata,
      };
    }
    return { error: `Upgrade not found: ${upgrade_key}` };
  }
  
  const category = upgradeCategories[upgrade.category];
  
  const result = {
    name: upgrade.name,
    category: category?.name || upgrade.category,
    shortDescription: upgrade.shortDescription,
    fullDescription: upgrade.fullDescription,
    howItWorks: upgrade.howItWorks,
    expectedGains: upgrade.expectedGains,
    cost: upgrade.cost,
    difficulty: upgrade.difficulty,
    installTime: upgrade.installTime,
    requiresTune: upgrade.requiresTune,
    streetLegal: upgrade.streetLegal,
    pros: upgrade.pros,
    cons: upgrade.cons,
    bestFor: upgrade.bestFor,
    worksWellWith: upgrade.worksWellWith,
    considerations: upgrade.considerations,
    popularBrands: upgrade.brands,
  };
  
  // Add car-specific info if requested
  if (car_slug) {
    const car = carData.find(c => c.slug === car_slug);
    if (car) {
      result.carContext = {
        carName: car.name,
        engineType: car.engine?.includes('Turbo') ? 'turbo' : 'naturally_aspirated',
        aftermarketScore: car.aftermarket || car.score_aftermarket,
        note: car.aftermarket >= 8 
          ? 'This car has excellent aftermarket support for this upgrade.'
          : car.aftermarket >= 6 
            ? 'Good aftermarket options available for this car.'
            : 'Limited aftermarket options - consider OEM or universal parts.',
      };
    }
  }
  
  return result;
}

/**
 * Get build recommendations for a goal
 * @param {Object} params - Parameters including car_slug, goal, budget
 * @returns {Object} Build recommendations
 */
export async function recommendBuild({ car_slug, goal, budget = null, maintain_warranty = false }) {
  const car = carData.find(c => c.slug === car_slug);
  if (!car) {
    return { error: `Car not found: ${car_slug}` };
  }
  
  // Get the build guide for this goal
  const guide = getBuildGuideArticle(goal);
  
  // Define upgrade tiers for each goal
  const goalUpgrades = {
    street_fun: {
      stage1: ['cold-air-intake', 'cat-back-exhaust', 'short-shifter'],
      stage2: ['coilovers', 'sway-bars', 'wheels-tires'],
      stage3: ['ecu-tune', 'headers', 'big-brake-kit'],
    },
    weekend_track: {
      stage1: ['brake-pads', 'brake-fluid', 'alignment'],
      stage2: ['coilovers', 'track-tires', 'big-brake-kit'],
      stage3: ['roll-bar', 'harness', 'bucket-seats'],
    },
    time_attack: {
      stage1: ['full-suspension', 'aero-package', 'lightweight-wheels'],
      stage2: ['engine-tune', 'race-brakes', 'cooling-upgrades'],
      stage3: ['forced-induction', 'cage', 'data-logging'],
    },
    canyon_carver: {
      stage1: ['suspension-upgrade', 'quality-tires', 'brake-upgrade'],
      stage2: ['coilovers', 'sway-bars', 'wheels'],
      stage3: ['ecu-tune', 'intake-exhaust', 'lsd'],
    },
    daily_plus: {
      stage1: ['intake', 'exhaust-tips', 'quality-tires'],
      stage2: ['lowering-springs', 'wheels', 'tune'],
      stage3: ['coilovers', 'intake-exhaust', 'big-brake-kit'],
    },
  };
  
  const upgrades = goalUpgrades[goal] || goalUpgrades.street_fun;
  
  // Filter warranty-safe mods if requested
  const warrantySafe = ['intake', 'exhaust-tips', 'wheels', 'tires', 'brake-pads'];
  
  const recommendation = {
    carName: car.name,
    goal: goal,
    budget: budget,
    maintainWarranty: maintain_warranty,
    stages: [],
  };
  
  for (const [stage, mods] of Object.entries(upgrades)) {
    const stageMods = mods
      .filter(mod => !maintain_warranty || warrantySafe.some(safe => mod.includes(safe)))
      .map(mod => {
        const modInfo = upgradeDetails[mod];
        return {
          name: modInfo?.name || mod,
          cost: modInfo?.cost?.range || 'Varies',
          expectedGains: modInfo?.expectedGains,
          difficulty: modInfo?.difficulty,
        };
      });
    
    recommendation.stages.push({
      name: stage,
      mods: stageMods,
    });
  }
  
  // Add car-specific notes
  recommendation.carNotes = {
    aftermarketSupport: car.aftermarket || car.score_aftermarket,
    trackCapability: car.track || car.score_track,
    reliability: car.reliability || car.score_reliability,
    recommendation: car.aftermarket >= 8 
      ? 'Excellent aftermarket support - many options available for all upgrades.'
      : 'Consider researching specific parts availability for this platform.',
  };
  
  if (guide) {
    recommendation.guideInfo = {
      name: guide.title,
      description: guide.summary,
    };
  }
  
  return recommendation;
}

// =============================================================================
// MAINTENANCE
// =============================================================================

/**
 * Get maintenance schedule and specs
 * @param {Object} params - Parameters including car_slug and optional mileage
 * @returns {Object} Maintenance information
 */
export async function getMaintenanceSchedule({ car_slug, mileage = null }) {
  const car = carData.find(c => c.slug === car_slug);
  if (!car) {
    return { error: `Car not found: ${car_slug}` };
  }
  
  const result = {
    carName: car.name,
    mileage,
  };
  
  // Try database for detailed specs
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: specs } = await supabase
        .from('vehicle_maintenance_specs')
        .select('*')
        .eq('car_slug', car_slug)
        .single();
      
      if (specs) {
        result.fluids = {
          oil: {
            type: specs.oil_type,
            capacity: specs.oil_capacity,
            interval: specs.oil_change_interval || '7,500-10,000 miles',
          },
          coolant: {
            type: specs.coolant_type,
            capacity: specs.coolant_capacity,
          },
          brakeFluid: {
            type: specs.brake_fluid_type,
            interval: 'Every 2 years or when discolored',
          },
          transmission: {
            type: specs.trans_fluid_type,
            capacity: specs.trans_fluid_capacity,
          },
        };
        
        result.tires = {
          pressureFront: specs.tire_pressure_front,
          pressureRear: specs.tire_pressure_rear,
          sizeFront: specs.tire_size_front,
          sizeRear: specs.tire_size_rear,
        };
        
        result.fuel = {
          octane: specs.fuel_octane,
          type: specs.fuel_type,
          capacity: specs.fuel_capacity,
        };
      }
    } catch (err) {
      console.warn('[AL Tools] Error fetching maintenance specs:', err);
    }
  }
  
  // Add general schedule based on mileage
  if (mileage) {
    result.upcomingService = [];
    
    const intervals = [
      { interval: 7500, service: 'Oil Change', priority: 'high' },
      { interval: 15000, service: 'Brake Inspection', priority: 'medium' },
      { interval: 30000, service: 'Major Service (spark plugs, filters, fluids)', priority: 'high' },
      { interval: 60000, service: 'Timing/Accessory Belt Check', priority: 'high' },
    ];
    
    for (const item of intervals) {
      const nextDue = Math.ceil(mileage / item.interval) * item.interval;
      const milesUntilDue = nextDue - mileage;
      
      if (milesUntilDue <= item.interval) {
        result.upcomingService.push({
          service: item.service,
          dueAtMiles: nextDue,
          milesUntilDue,
          priority: milesUntilDue < 1000 ? 'urgent' : item.priority,
        });
      }
    }
    
    result.upcomingService.sort((a, b) => a.milesUntilDue - b.milesUntilDue);
  }
  
  // Add ownership cost info if available
  if (car.majorServiceCosts) {
    result.serviceCosts = car.majorServiceCosts;
  }
  if (car.annualOwnershipCost) {
    result.annualCost = car.annualOwnershipCost;
  }
  
  return result;
}

// =============================================================================
// FORUM/WEB SEARCH
// =============================================================================

/**
 * Search forums and web for real-world owner experiences
 * This is a placeholder - would integrate with Exa or similar API
 * @param {Object} params - Search parameters
 * @returns {Object} Search results
 */
export async function searchForums({ query, car_context = null, sources = ['all'] }) {
  // This would integrate with Exa API or similar web search
  // For now, return a helpful message
  
  const searchQuery = car_context ? `${query} ${car_context}` : query;
  
  // TODO: Integrate with Exa API when available
  // For now, provide helpful guidance
  
  return {
    query: searchQuery,
    sources: sources,
    message: 'Forum search integration coming soon. For now, I can help with information from our database.',
    suggestedForums: [
      { name: 'Reddit r/cars', url: 'https://reddit.com/r/cars' },
      { name: 'Rennlist (Porsche)', url: 'https://rennlist.com' },
      { name: 'M3Post (BMW)', url: 'https://m3post.com' },
      { name: '6SpeedOnline', url: 'https://6speedonline.com' },
      { name: 'Corvette Forum', url: 'https://corvetteforum.com' },
    ],
    searchTip: `Try searching: "${searchQuery}" on these forums for real owner experiences.`,
  };
}

// =============================================================================
// TOOL EXECUTOR
// =============================================================================

/**
 * Execute a tool call from Claude
 * @param {string} toolName - Name of the tool to execute
 * @param {Object} toolInput - Input parameters for the tool
 * @returns {Object} Tool execution result
 */
export async function executeToolCall(toolName, toolInput) {
  const tools = {
    search_cars: searchCars,
    get_car_details: getCarDetails,
    get_expert_reviews: getExpertReviews,
    get_known_issues: getKnownIssues,
    compare_cars: compareCars,
    search_encyclopedia: searchEncyclopediaContent,
    get_upgrade_info: getUpgradeInfo,
    search_forums: searchForums,
    get_maintenance_schedule: getMaintenanceSchedule,
    recommend_build: recommendBuild,
  };
  
  const tool = tools[toolName];
  if (!tool) {
    return { error: `Unknown tool: ${toolName}` };
  }
  
  try {
    const result = await tool(toolInput);
    return result;
  } catch (err) {
    console.error(`[AL Tools] Error executing ${toolName}:`, err);
    return { error: `Tool execution failed: ${err.message}` };
  }
}

export default {
  searchCars,
  getCarDetails,
  getExpertReviews,
  getKnownIssues,
  compareCars,
  searchEncyclopediaContent,
  getUpgradeInfo,
  searchForums,
  getMaintenanceSchedule,
  recommendBuild,
  executeToolCall,
};








