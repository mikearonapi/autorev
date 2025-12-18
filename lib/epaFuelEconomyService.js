/**
 * EPA Fuel Economy Service
 * 
 * Fetches official fuel economy data from fueleconomy.gov
 * This is a FREE government API with no authentication required.
 * 
 * API Documentation: https://www.fueleconomy.gov/feg/ws/
 * 
 * @module lib/epaFuelEconomyService
 */

const EPA_API_BASE = 'https://www.fueleconomy.gov/ws/rest';

/**
 * @typedef {Object} FuelEconomyData
 * @property {number} id - EPA vehicle ID
 * @property {number} year - Model year
 * @property {string} make - Manufacturer
 * @property {string} model - Model name
 * @property {number} cityMpg - City fuel economy (MPG)
 * @property {number} highwayMpg - Highway fuel economy (MPG)
 * @property {number} combinedMpg - Combined fuel economy (MPG)
 * @property {string} fuelType - Primary fuel type
 * @property {number} co2Emissions - CO2 emissions (grams/mile)
 * @property {number} annualFuelCost - Estimated annual fuel cost
 * @property {string} transmission - Transmission type
 * @property {string} drive - Drive type (FWD, RWD, AWD, 4WD)
 * @property {number} cylinders - Number of cylinders
 * @property {number} displacement - Engine displacement (liters)
 */

/**
 * Get available model years from EPA database
 * @returns {Promise<number[]>} Array of available years
 */
export async function getAvailableYears() {
  try {
    const response = await fetch(`${EPA_API_BASE}/vehicle/menu/year`);
    if (!response.ok) throw new Error(`EPA API error: ${response.status}`);
    
    const data = await response.json();
    return data.menuItem?.map(item => parseInt(item.value)) || [];
  } catch (err) {
    console.error('[EPA Fuel Economy] Error fetching years:', err);
    return [];
  }
}

/**
 * Get available makes for a specific year
 * @param {number} year - Model year
 * @returns {Promise<string[]>} Array of make names
 */
export async function getMakesByYear(year) {
  if (!year) return [];
  
  try {
    const response = await fetch(`${EPA_API_BASE}/vehicle/menu/make?year=${year}`);
    if (!response.ok) throw new Error(`EPA API error: ${response.status}`);
    
    const data = await response.json();
    return data.menuItem?.map(item => item.value) || [];
  } catch (err) {
    console.error('[EPA Fuel Economy] Error fetching makes:', err);
    return [];
  }
}

/**
 * Get available models for a specific year and make
 * @param {number} year - Model year
 * @param {string} make - Manufacturer name
 * @returns {Promise<string[]>} Array of model names
 */
export async function getModelsByYearMake(year, make) {
  if (!year || !make) return [];
  
  try {
    const response = await fetch(
      `${EPA_API_BASE}/vehicle/menu/model?year=${year}&make=${encodeURIComponent(make)}`
    );
    if (!response.ok) throw new Error(`EPA API error: ${response.status}`);
    
    const data = await response.json();
    return data.menuItem?.map(item => item.value) || [];
  } catch (err) {
    console.error('[EPA Fuel Economy] Error fetching models:', err);
    return [];
  }
}

/**
 * Get vehicle options/trims for year/make/model
 * @param {number} year - Model year
 * @param {string} make - Manufacturer
 * @param {string} model - Model name
 * @returns {Promise<Array<{id: number, text: string}>>} Vehicle options
 */
export async function getVehicleOptions(year, make, model) {
  if (!year || !make || !model) return [];
  
  try {
    const response = await fetch(
      `${EPA_API_BASE}/vehicle/menu/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`
    );
    if (!response.ok) throw new Error(`EPA API error: ${response.status}`);
    
    const data = await response.json();
    const items = data.menuItem;
    
    // Handle single item vs array
    if (!items) return [];
    if (!Array.isArray(items)) {
      return [{ id: parseInt(items.value), text: items.text }];
    }
    
    return items.map(item => ({
      id: parseInt(item.value),
      text: item.text
    }));
  } catch (err) {
    console.error('[EPA Fuel Economy] Error fetching vehicle options:', err);
    return [];
  }
}

/**
 * Get detailed fuel economy data for a specific vehicle by EPA ID
 * @param {number} vehicleId - EPA vehicle ID
 * @returns {Promise<FuelEconomyData|null>}
 */
export async function getVehicleById(vehicleId) {
  if (!vehicleId) return null;
  
  try {
    const response = await fetch(`${EPA_API_BASE}/vehicle/${vehicleId}`);
    if (!response.ok) throw new Error(`EPA API error: ${response.status}`);
    
    const data = await response.json();
    return normalizeVehicleData(data);
  } catch (err) {
    console.error('[EPA Fuel Economy] Error fetching vehicle:', err);
    return null;
  }
}

/**
 * Search for vehicles and get fuel economy data
 * @param {number} year - Model year
 * @param {string} make - Manufacturer
 * @param {string} model - Model name
 * @returns {Promise<FuelEconomyData[]>} Array of matching vehicles with fuel economy
 */
export async function searchVehicles(year, make, model) {
  const options = await getVehicleOptions(year, make, model);
  
  if (options.length === 0) return [];
  
  // Fetch details for all vehicle options in parallel
  const vehicles = await Promise.all(
    options.map(opt => getVehicleById(opt.id))
  );
  
  return vehicles.filter(Boolean);
}

/**
 * Get fuel economy data by year/make/model - returns best match or average
 * @param {number} year - Model year
 * @param {string} make - Manufacturer
 * @param {string} model - Model name
 * @returns {Promise<FuelEconomyData|null>}
 */
export async function getFuelEconomy(year, make, model) {
  const vehicles = await searchVehicles(year, make, model);
  
  if (vehicles.length === 0) return null;
  if (vehicles.length === 1) return vehicles[0];
  
  // Return the base model (usually first) or calculate average
  // For sports cars, prefer the performance variant
  const performanceVariant = vehicles.find(v => 
    v.transmission?.toLowerCase().includes('manual') ||
    v.model?.toLowerCase().includes('sport') ||
    v.model?.toLowerCase().includes('gt')
  );
  
  return performanceVariant || vehicles[0];
}

/**
 * Get emissions data for a vehicle
 * @param {number} vehicleId - EPA vehicle ID
 * @returns {Promise<Object|null>} Emissions data
 */
export async function getEmissions(vehicleId) {
  if (!vehicleId) return null;
  
  try {
    const response = await fetch(`${EPA_API_BASE}/vehicle/emissions/${vehicleId}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    const emissions = data.emissionsInfo;
    
    if (!emissions) return null;
    
    // Handle single item vs array
    const emissionsList = Array.isArray(emissions) ? emissions : [emissions];
    
    return emissionsList.map(e => ({
      standard: e.efid,
      salesArea: e.salesArea,
      score: e.score,
      smartwayScore: e.smartwayScore,
      ghgScore: e.ghgScore,
    }));
  } catch (err) {
    console.error('[EPA Fuel Economy] Error fetching emissions:', err);
    return null;
  }
}

/**
 * Get current fuel prices used by EPA calculations
 * @returns {Promise<Object|null>} Fuel prices
 */
export async function getCurrentFuelPrices() {
  try {
    const response = await fetch(`${EPA_API_BASE}/fuelprices`);
    if (!response.ok) return null;
    
    const data = await response.json();
    return {
      regular: parseFloat(data.regular) || null,
      midgrade: parseFloat(data.midgrade) || null,
      premium: parseFloat(data.premium) || null,
      diesel: parseFloat(data.diesel) || null,
      e85: parseFloat(data.e85) || null,
      electric: parseFloat(data.electric) || null, // $/kWh
      cng: parseFloat(data.cng) || null,
      lpg: parseFloat(data.lpg) || null,
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    console.error('[EPA Fuel Economy] Error fetching fuel prices:', err);
    return null;
  }
}

/**
 * Calculate annual fuel cost for a vehicle
 * @param {FuelEconomyData} vehicle - Vehicle data
 * @param {number} annualMiles - Annual miles driven (default 12,000)
 * @param {Object} fuelPrices - Current fuel prices
 * @returns {number|null} Estimated annual fuel cost
 */
export function calculateAnnualFuelCost(vehicle, annualMiles = 12000, fuelPrices = null) {
  if (!vehicle?.combinedMpg) return null;
  
  // Default to $4/gallon if no prices provided
  const pricePerGallon = fuelPrices?.premium || fuelPrices?.regular || 4.00;
  
  const gallonsPerYear = annualMiles / vehicle.combinedMpg;
  return Math.round(gallonsPerYear * pricePerGallon);
}

/**
 * Get user-reported MPG data (real-world averages)
 * @param {number} vehicleId - EPA vehicle ID
 * @returns {Promise<Object|null>} User MPG data
 */
export async function getUserMpgData(vehicleId) {
  if (!vehicleId) return null;
  
  try {
    const response = await fetch(`${EPA_API_BASE}/ympg/shared/ympgVehicle/${vehicleId}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (!data || data.avgMpg === undefined) return null;
    
    return {
      averageMpg: parseFloat(data.avgMpg) || null,
      userCount: parseInt(data.userMpgVehicleCount) || 0,
      cityMpg: parseFloat(data.avgCityMpg) || null,
      highwayMpg: parseFloat(data.avgHwyMpg) || null,
    };
  } catch (err) {
    console.error('[EPA Fuel Economy] Error fetching user MPG:', err);
    return null;
  }
}

/**
 * Normalize raw EPA data to our standard format
 * @param {Object} raw - Raw EPA API response
 * @returns {FuelEconomyData}
 */
function normalizeVehicleData(raw) {
  if (!raw) return null;
  
  return {
    id: parseInt(raw.id),
    year: parseInt(raw.year),
    make: raw.make,
    model: raw.model,
    
    // Fuel economy
    cityMpg: parseFloat(raw.city08) || null,
    highwayMpg: parseFloat(raw.highway08) || null,
    combinedMpg: parseFloat(raw.comb08) || null,
    
    // Alternative fuel (if applicable)
    cityMpgAlt: parseFloat(raw.cityA08) || null,
    highwayMpgAlt: parseFloat(raw.highwayA08) || null,
    combinedMpgAlt: parseFloat(raw.combA08) || null,
    
    // Fuel info
    fuelType: raw.fuelType1,
    fuelTypeAlt: raw.fuelType2 || null,
    
    // Emissions
    co2Emissions: parseFloat(raw.co2) || null, // grams/mile
    co2EmissionsAlt: parseFloat(raw.co2A) || null,
    ghgScore: parseInt(raw.ghgScore) || null,
    ghgScoreAlt: parseInt(raw.ghgScoreA) || null,
    
    // Costs
    annualFuelCost: parseFloat(raw.fuelCost08) || null,
    annualFuelCostAlt: parseFloat(raw.fuelCostA08) || null,
    
    // Vehicle specs
    transmission: normalizeTransmission(raw.trany),
    drive: normalizeDrive(raw.drive),
    cylinders: parseInt(raw.cylinders) || null,
    displacement: parseFloat(raw.displ) || null,
    
    // Additional details
    vehicleClass: raw.VClass,
    startStop: raw.startStop === 'Y',
    turbo: raw.tCharger === 'T',
    supercharged: raw.sCharger === 'S',
    
    // Electric vehicle data
    isElectric: raw.atvType === 'EV' || raw.fuelType1 === 'Electricity',
    isHybrid: raw.atvType === 'Hybrid' || raw.atvType === 'Plug-in Hybrid',
    evRange: parseFloat(raw.range) || null, // miles
    evRangeAlt: parseFloat(raw.rangeA) || null,
    
    // Raw data for debugging
    raw: raw,
  };
}

/**
 * Normalize transmission string
 * @param {string} trans 
 * @returns {string}
 */
function normalizeTransmission(trans) {
  if (!trans) return null;
  
  const t = trans.toLowerCase();
  if (t.includes('manual') || t.match(/\d-spd man/)) return 'Manual';
  if (t.includes('auto') || t.match(/\d-spd auto/)) return 'Automatic';
  if (t.includes('cvt')) return 'CVT';
  if (t.includes('dct') || t.includes('dual')) return 'DCT';
  if (t.includes('amt')) return 'Automated Manual';
  
  return trans;
}

/**
 * Normalize drive type string
 * @param {string} drive 
 * @returns {string}
 */
function normalizeDrive(drive) {
  if (!drive) return null;
  
  const d = drive.toLowerCase();
  if (d.includes('rear') || d === 'rwd') return 'RWD';
  if (d.includes('front') || d === 'fwd') return 'FWD';
  if (d.includes('all') || d === 'awd') return 'AWD';
  if (d.includes('4wd') || d.includes('4-wheel')) return '4WD';
  
  return drive;
}

/**
 * Match our car database entry to EPA data
 * Tries multiple strategies to find a match
 * @param {Object} car - Car from our database
 * @returns {Promise<FuelEconomyData|null>}
 */
export async function matchCarToEpaData(car) {
  if (!car) return null;
  
  // Extract year range from our car data
  const yearMatch = car.years?.match(/(\d{4})/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;
  
  // Try to extract make and model from car name
  // Our names are like "Porsche 911 GT3" or "BMW M3 E92"
  const nameParts = car.name?.split(' ') || [];
  const make = nameParts[0];
  
  // Model is trickier - try different combinations
  const modelCandidates = [
    nameParts.slice(1).join(' '),
    nameParts.slice(1, 3).join(' '),
    nameParts[1],
  ];
  
  if (!year || !make) return null;
  
  // Try each model candidate
  for (const model of modelCandidates) {
    if (!model) continue;
    
    const result = await getFuelEconomy(year, make, model);
    if (result) return result;
  }
  
  // Try with brand field if available
  if (car.brand && car.brand !== make) {
    for (const model of modelCandidates) {
      if (!model) continue;
      const result = await getFuelEconomy(year, car.brand, model);
      if (result) return result;
    }
  }
  
  return null;
}

/**
 * Get comprehensive fuel data for a car (EPA + user-reported + costs)
 * @param {Object} car - Car from our database
 * @returns {Promise<Object|null>}
 */
export async function getComprehensiveFuelData(car) {
  const epaData = await matchCarToEpaData(car);
  
  if (!epaData) return null;
  
  const [userMpg, fuelPrices] = await Promise.all([
    getUserMpgData(epaData.id),
    getCurrentFuelPrices(),
  ]);
  
  return {
    epa: epaData,
    userReported: userMpg,
    fuelPrices,
    annualCostEstimate: calculateAnnualFuelCost(epaData, 12000, fuelPrices),
    comparison: userMpg ? {
      epaVsReal: epaData.combinedMpg && userMpg.averageMpg 
        ? Math.round((userMpg.averageMpg / epaData.combinedMpg - 1) * 100)
        : null, // % difference
      dataPoints: userMpg.userCount,
    } : null,
  };
}

export default {
  getAvailableYears,
  getMakesByYear,
  getModelsByYearMake,
  getVehicleOptions,
  getVehicleById,
  searchVehicles,
  getFuelEconomy,
  getEmissions,
  getCurrentFuelPrices,
  calculateAnnualFuelCost,
  getUserMpgData,
  matchCarToEpaData,
  getComprehensiveFuelData,
};





