/**
 * Car Filtering Utilities - Single Source of Truth
 *
 * Shared functions for filtering and sorting car lists.
 * Used by browse-cars, SportsCarComparison, and other components.
 *
 * @module lib/filterUtils
 */

// =============================================================================
// SEARCH FILTERS
// =============================================================================

/**
 * Filter cars by search query
 * Searches across name, brand, engine, category, and vehicle type
 *
 * @param {Array} cars - Array of car objects
 * @param {string} query - Search query string
 * @returns {Array} - Filtered cars
 */
export function filterCarsBySearch(cars, query) {
  if (!query || !query.trim()) return cars;

  const searchTerm = query.toLowerCase().trim();

  return cars.filter(
    (car) =>
      car.name?.toLowerCase().includes(searchTerm) ||
      car.make?.toLowerCase().includes(searchTerm) ||
      car.engineType?.toLowerCase().includes(searchTerm) ||
      car.category?.toLowerCase().includes(searchTerm) ||
      car.vehicleType?.toLowerCase().includes(searchTerm) ||
      String(car.year || '').includes(searchTerm)
  );
}

/**
 * Filter cars by brand/make
 *
 * @param {Array} cars - Array of car objects
 * @param {string} make - Brand name or 'all'
 * @returns {Array} - Filtered cars
 */
export function filterCarsByMake(cars, make) {
  if (!make || make === 'all') return cars;

  const makeLower = make.toLowerCase();
  return cars.filter((car) => {
    const carMake = car.make || car.name?.split(' ')[0];
    return carMake?.toLowerCase() === makeLower;
  });
}

/**
 * Filter cars by tier (Premium, Upper-Mid, Mid, Budget)
 *
 * @param {Array} cars - Array of car objects
 * @param {string} tier - Tier value or 'all'
 * @returns {Array} - Filtered cars
 */
export function filterCarsByTier(cars, tier) {
  if (!tier || tier === 'all') return cars;
  return cars.filter((car) => car.tier === tier);
}

/**
 * Filter cars by vehicle type (Sports Car, Sports Sedan, Wagon, etc.)
 *
 * @param {Array} cars - Array of car objects
 * @param {string} vehicleType - Vehicle type or 'all'
 * @returns {Array} - Filtered cars
 */
export function filterCarsByVehicleType(cars, vehicleType) {
  if (!vehicleType || vehicleType === 'all') return cars;
  return cars.filter((car) => car.vehicleType === vehicleType);
}

/**
 * Filter cars by price range
 *
 * @param {Array} cars - Array of car objects
 * @param {number} minPrice - Minimum price
 * @param {number} maxPrice - Maximum price
 * @param {Function} [getPriceFn] - Optional function to extract price from car
 * @returns {Array} - Filtered cars
 */
export function filterCarsByPrice(cars, minPrice, maxPrice, getPriceFn) {
  const getPrice = getPriceFn || ((car) => car.msrp || 0);

  return cars.filter((car) => {
    const price = getPrice(car);
    return price >= minPrice && price <= maxPrice;
  });
}

/**
 * Filter cars by drivetrain (RWD, AWD, FWD)
 *
 * @param {Array} cars - Array of car objects
 * @param {string} drivetrain - Drivetrain value or 'all'
 * @returns {Array} - Filtered cars
 */
export function filterCarsByDrivetrain(cars, drivetrain) {
  if (!drivetrain || drivetrain === 'all') return cars;
  return cars.filter((car) => car.driveType === drivetrain);
}

/**
 * Filter cars by transmission type
 *
 * @param {Array} cars - Array of car objects
 * @param {string} transmission - 'manual', 'automatic', or 'all'
 * @returns {Array} - Filtered cars
 */
export function filterCarsByTransmission(cars, transmission) {
  if (!transmission || transmission === 'all') return cars;

  return cars.filter((car) => {
    const trans = (car.transmission || '').toUpperCase();
    const hasManual = trans.includes('MT') || trans.includes('MANUAL');
    const hasAuto =
      trans.includes('AT') ||
      trans.includes('DCT') ||
      trans.includes('PDK') ||
      trans.includes('DSG') ||
      trans.includes('SMG') ||
      trans.includes('AUTO') ||
      trans.includes('TRONIC') ||
      trans.includes('GEAR') ||
      trans.includes('DIRECT');

    if (transmission === 'manual') return hasManual;
    if (transmission === 'automatic') return hasAuto;
    return true;
  });
}

/**
 * Filter cars by engine layout/category
 *
 * @param {Array} cars - Array of car objects
 * @param {string} engineLayout - Engine layout or 'all'
 * @returns {Array} - Filtered cars
 */
export function filterCarsByEngineLayout(cars, engineLayout) {
  if (!engineLayout || engineLayout === 'all') return cars;
  return cars.filter((car) => car.category === engineLayout);
}

/**
 * Filter cars by number of seats
 *
 * @param {Array} cars - Array of car objects
 * @param {string} seats - '2' for 2-seaters, '4' for 4+, or 'all'
 * @returns {Array} - Filtered cars
 */
export function filterCarsBySeats(cars, seats) {
  if (!seats || seats === 'all') return cars;

  return cars.filter((car) => {
    if (!car.seats) return true; // Include if no seat data
    if (seats === '2') return car.seats <= 2;
    if (seats === '4') return car.seats >= 4;
    return true;
  });
}

// =============================================================================
// SORTING
// =============================================================================

/**
 * Sort modes available for car lists
 */
export const SORT_MODES = {
  NAME_ASC: 'name',
  HP_HIGH: 'hp-high',
  HP_LOW: 'hp-low',
  PRICE_HIGH: 'price-high',
  PRICE_LOW: 'price-low',
  SCORE: 'score',
  ZERO_TO_SIXTY: '0-60',
};

/**
 * Sort cars by specified criteria
 *
 * @param {Array} cars - Array of car objects
 * @param {string} sortBy - Sort mode from SORT_MODES
 * @returns {Array} - Sorted cars (new array, doesn't mutate original)
 */
export function sortCars(cars, sortBy) {
  const sorted = [...cars];

  switch (sortBy) {
    case SORT_MODES.NAME_ASC:
    case 'name':
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      break;
    case SORT_MODES.HP_HIGH:
    case 'hp-high':
      sorted.sort((a, b) => (b.hp || 0) - (a.hp || 0));
      break;
    case SORT_MODES.HP_LOW:
    case 'hp-low':
      sorted.sort((a, b) => (a.hp || 0) - (b.hp || 0));
      break;
    case SORT_MODES.PRICE_HIGH:
    case 'price-high':
      sorted.sort((a, b) => (b.msrp || 0) - (a.msrp || 0));
      break;
    case SORT_MODES.PRICE_LOW:
    case 'price-low':
    case 'price':
      sorted.sort((a, b) => (a.msrp || 0) - (b.msrp || 0));
      break;
    case SORT_MODES.ZERO_TO_SIXTY:
    case '0-60':
      sorted.sort(
        (a, b) =>
          (a.zero_to_sixty || a.zeroToSixty || 999) - (b.zero_to_sixty || b.zeroToSixty || 999)
      );
      break;
    case SORT_MODES.SCORE:
    case 'score':
      sorted.sort((a, b) => (b.score || b.total || 0) - (a.score || a.total || 0));
      break;
    default:
      // Default to name sort
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  return sorted;
}

// =============================================================================
// COMBINED FILTER + SORT
// =============================================================================

/**
 * Apply multiple filters and sort in one operation
 * More efficient than chaining individual filter calls
 *
 * @param {Array} cars - Array of car objects
 * @param {Object} filters - Filter options
 * @param {string} [filters.search] - Search query
 * @param {string} [filters.make] - Brand filter
 * @param {string} [filters.tier] - Tier filter
 * @param {string} [filters.vehicleType] - Vehicle type filter
 * @param {string} [filters.drivetrain] - Drivetrain filter
 * @param {string} [filters.transmission] - Transmission filter
 * @param {number} [filters.priceMin] - Min price
 * @param {number} [filters.priceMax] - Max price
 * @param {string} sortBy - Sort mode
 * @param {number} [limit] - Optional limit on results
 * @returns {Array} - Filtered and sorted cars
 */
export function filterAndSortCars(cars, filters = {}, sortBy = 'name', limit) {
  let result = cars;

  // Apply filters in order of most restrictive first (for performance)
  if (filters.search) {
    result = filterCarsBySearch(result, filters.search);
  }
  if (filters.make) {
    result = filterCarsByMake(result, filters.make);
  }
  if (filters.tier) {
    result = filterCarsByTier(result, filters.tier);
  }
  if (filters.vehicleType) {
    result = filterCarsByVehicleType(result, filters.vehicleType);
  }
  if (filters.drivetrain) {
    result = filterCarsByDrivetrain(result, filters.drivetrain);
  }
  if (filters.transmission) {
    result = filterCarsByTransmission(result, filters.transmission);
  }
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    result = filterCarsByPrice(
      result,
      filters.priceMin || 0,
      filters.priceMax || Infinity,
      filters.getPriceFn
    );
  }

  // Sort
  result = sortCars(result, sortBy);

  // Limit
  if (limit && limit > 0) {
    result = result.slice(0, limit);
  }

  return result;
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Get unique makes/brands from a car list
 *
 * @param {Array} cars - Array of car objects
 * @returns {Array<string>} - Sorted unique brand names
 */
export function getUniqueMakes(cars) {
  const makes = new Set();
  cars.forEach((car) => {
    const make = car.make || car.name?.split(' ')[0];
    if (make) makes.add(make);
  });
  return Array.from(makes).sort();
}

/**
 * Get unique tiers from a car list
 *
 * @param {Array} cars - Array of car objects
 * @returns {Array<string>} - Unique tiers
 */
export function getUniqueTiers(cars) {
  const tiers = new Set();
  cars.forEach((car) => {
    if (car.tier) tiers.add(car.tier);
  });
  return Array.from(tiers);
}

/**
 * Get unique vehicle types from a car list
 *
 * @param {Array} cars - Array of car objects
 * @returns {Array<string>} - Unique vehicle types
 */
export function getUniqueVehicleTypes(cars) {
  const types = new Set();
  cars.forEach((car) => {
    if (car.vehicleType) types.add(car.vehicleType);
  });
  return Array.from(types).sort();
}

// Default export for convenient destructuring
const filterUtils = {
  filterCarsBySearch,
  filterCarsByMake,
  filterCarsByTier,
  filterCarsByVehicleType,
  filterCarsByPrice,
  filterCarsByDrivetrain,
  filterCarsByTransmission,
  filterCarsByEngineLayout,
  filterCarsBySeats,
  sortCars,
  filterAndSortCars,
  getUniqueMakes,
  getUniqueTiers,
  getUniqueVehicleTypes,
  SORT_MODES,
};

export default filterUtils;
