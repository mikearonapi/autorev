/**
 * User Dyno Data Service
 *
 * Handles fetching, merging, and prioritizing user-provided dyno data.
 *
 * KEY PRINCIPLE: When a user has provided actual dyno data, that data
 * takes precedence over any estimated/calculated values throughout the app.
 *
 * Data Source Hierarchy (highest to lowest priority):
 * 1. Verified - Admin-verified user data (confidence: 1.0)
 * 2. Measured - User-provided dyno sheet data (confidence: 0.95)
 * 3. Calibrated - Platform-specific tuned estimates (confidence: 0.75)
 * 4. Estimated - Physics-based calculations (confidence: 0.6)
 *
 * @module lib/userDynoDataService
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Data source types and their confidence levels
 */
export const DATA_SOURCE = {
  VERIFIED: 'verified',
  MEASURED: 'measured',
  CALIBRATED: 'calibrated',
  ESTIMATED: 'estimated',
};

export const DATA_SOURCE_CONFIG = {
  [DATA_SOURCE.VERIFIED]: {
    label: 'Verified',
    shortLabel: 'Verified',
    description: 'Admin-verified dyno data',
    confidence: 1.0,
    priority: 1,
    color: 'teal', // Uses design token
  },
  [DATA_SOURCE.MEASURED]: {
    label: 'Measured',
    shortLabel: 'Dyno',
    description: 'User-provided dyno data',
    confidence: 0.95,
    priority: 2,
    color: 'lime', // Uses design token
  },
  [DATA_SOURCE.CALIBRATED]: {
    label: 'Calibrated',
    shortLabel: 'Cal.',
    description: 'Platform-tuned estimate',
    confidence: 0.75,
    priority: 3,
    color: 'blue', // Uses design token
  },
  [DATA_SOURCE.ESTIMATED]: {
    label: 'Estimated',
    shortLabel: 'Est.',
    description: 'Physics-based calculation',
    confidence: 0.6,
    priority: 4,
    color: 'neutral', // Uses design token
  },
};

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * @typedef {Object} PerformanceMetric
 * @property {number} value - The metric value
 * @property {string} source - Data source (verified/measured/calibrated/estimated)
 * @property {number} confidence - Confidence level 0-1
 * @property {string} [sourceDetail] - Additional detail about the source
 */

/**
 * @typedef {Object} MergedPerformanceData
 * @property {PerformanceMetric} hp - Horsepower
 * @property {PerformanceMetric} torque - Torque
 * @property {PerformanceMetric} [whp] - Wheel horsepower (if dyno data)
 * @property {PerformanceMetric} [wtq] - Wheel torque (if dyno data)
 * @property {PerformanceMetric} [boost] - Boost PSI (if applicable)
 * @property {PerformanceMetric} zeroToSixty - 0-60 time
 * @property {PerformanceMetric} quarterMile - 1/4 mile time
 * @property {PerformanceMetric} braking - 60-0 braking distance
 * @property {PerformanceMetric} lateralG - Lateral G
 * @property {boolean} hasUserData - Whether any user-provided data exists
 * @property {string} primarySource - The primary data source for power metrics
 */

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get configuration for a data source
 * @param {string} source - Data source type
 * @returns {Object} Source configuration
 */
export function getDataSourceConfig(source) {
  return DATA_SOURCE_CONFIG[source] || DATA_SOURCE_CONFIG[DATA_SOURCE.ESTIMATED];
}

/**
 * Compare two data sources and return the higher priority one
 * @param {string} source1 - First data source
 * @param {string} source2 - Second data source
 * @returns {string} Higher priority source
 */
export function getHigherPrioritySource(source1, source2) {
  const config1 = getDataSourceConfig(source1);
  const config2 = getDataSourceConfig(source2);
  return config1.priority <= config2.priority ? source1 : source2;
}

/**
 * Create a performance metric object
 * @param {number} value - Metric value
 * @param {string} source - Data source
 * @param {string} [sourceDetail] - Additional source detail
 * @returns {PerformanceMetric}
 */
export function createMetric(value, source, sourceDetail = null) {
  const config = getDataSourceConfig(source);
  return {
    value,
    source,
    confidence: config.confidence,
    label: config.label,
    shortLabel: config.shortLabel,
    sourceDetail,
  };
}

// =============================================================================
// DRIVETRAIN LOSS CALCULATIONS
// =============================================================================

/**
 * Drivetrain loss percentages by type
 */
const DRIVETRAIN_LOSS = {
  FWD: 0.12, // 12% loss
  RWD: 0.15, // 15% loss
  AWD: 0.2, // 20% loss
  '4WD': 0.22, // 22% loss
};

/**
 * Calculate crank HP from wheel HP
 * @param {number} whp - Wheel horsepower
 * @param {string} drivetrain - Drivetrain type (FWD/RWD/AWD/4WD)
 * @returns {number} Estimated crank HP
 */
export function whpToCrankHp(whp, drivetrain = 'RWD') {
  const loss = DRIVETRAIN_LOSS[drivetrain.toUpperCase()] || DRIVETRAIN_LOSS.RWD;
  return Math.round(whp / (1 - loss));
}

/**
 * Calculate wheel HP from crank HP
 * @param {number} crankHp - Crank horsepower
 * @param {string} drivetrain - Drivetrain type
 * @returns {number} Estimated wheel HP
 */
export function crankHpToWhp(crankHp, drivetrain = 'RWD') {
  const loss = DRIVETRAIN_LOSS[drivetrain.toUpperCase()] || DRIVETRAIN_LOSS.RWD;
  return Math.round(crankHp * (1 - loss));
}

// =============================================================================
// MAIN SERVICE FUNCTIONS
// =============================================================================

/**
 * Merge user dyno data with estimated/stock data
 *
 * Priority: User dyno data > Calculated from mods > Stock values
 *
 * @param {Object} params
 * @param {Object} params.stockData - Stock car performance data
 * @param {Object} params.userDyno - User's dyno results (from user_dyno_results)
 * @param {Object} params.calculatedData - Data calculated from modifications
 * @param {string} params.drivetrain - Car's drivetrain type
 * @returns {MergedPerformanceData}
 */
export function mergePerformanceData({
  stockData = {},
  userDyno = null,
  calculatedData = {},
  drivetrain = 'RWD',
}) {
  const result = {
    hasUserData: false,
    primarySource: DATA_SOURCE.ESTIMATED,
  };

  // ==========================================================================
  // POWER METRICS - User dyno takes absolute priority
  // ==========================================================================
  if (userDyno?.whp && userDyno.whp > 0) {
    // User has provided dyno data - USE IT
    const source = userDyno.isVerified ? DATA_SOURCE.VERIFIED : DATA_SOURCE.MEASURED;
    const crankHp = userDyno.crankHp || whpToCrankHp(userDyno.whp, drivetrain);
    const crankTq =
      userDyno.crankTq || (userDyno.wtq ? whpToCrankHp(userDyno.wtq, drivetrain) : null);

    result.whp = createMetric(
      userDyno.whp,
      source,
      userDyno.dynoShop
        ? `${userDyno.dynoType || 'Dyno'} @ ${userDyno.dynoShop}`
        : userDyno.dynoType
    );

    result.hp = createMetric(crankHp, source, `Calculated from ${userDyno.whp} WHP`);

    if (userDyno.wtq) {
      result.wtq = createMetric(
        userDyno.wtq,
        source,
        userDyno.dynoShop
          ? `${userDyno.dynoType || 'Dyno'} @ ${userDyno.dynoShop}`
          : userDyno.dynoType
      );
      result.torque = createMetric(crankTq, source, `Calculated from ${userDyno.wtq} WTQ`);
    } else if (calculatedData.torque) {
      result.torque = createMetric(
        calculatedData.torque,
        DATA_SOURCE.ESTIMATED,
        'Estimated from HP'
      );
    } else if (stockData.torque) {
      result.torque = createMetric(stockData.torque, DATA_SOURCE.ESTIMATED, 'Stock value');
    }

    if (userDyno.boostPsi) {
      result.boost = createMetric(userDyno.boostPsi, source, 'Peak boost');
    }

    result.hasUserData = true;
    result.primarySource = source;
  } else if (calculatedData.hp && calculatedData.hp > (stockData.hp || 0)) {
    // No dyno data, but we have calculated gains
    const source =
      calculatedData.confidenceLevel === 'calibrated'
        ? DATA_SOURCE.CALIBRATED
        : DATA_SOURCE.ESTIMATED;

    result.hp = createMetric(
      calculatedData.hp,
      source,
      calculatedData.confidenceLabel || 'Physics-based estimate'
    );
    result.torque = createMetric(
      calculatedData.torque || stockData.torque,
      source,
      'Estimated from power gains'
    );
    result.primarySource = source;
  } else {
    // Stock values only
    result.hp = createMetric(stockData.hp || 0, DATA_SOURCE.ESTIMATED, 'Manufacturer spec');
    result.torque = createMetric(stockData.torque || 0, DATA_SOURCE.ESTIMATED, 'Manufacturer spec');
  }

  // ==========================================================================
  // PERFORMANCE METRICS - These could also be user-provided in the future
  // For now, they're always calculated/estimated
  // ==========================================================================

  // 0-60 time
  if (calculatedData.zeroToSixty) {
    result.zeroToSixty = createMetric(
      calculatedData.zeroToSixty,
      result.hasUserData ? DATA_SOURCE.CALIBRATED : DATA_SOURCE.ESTIMATED,
      result.hasUserData ? 'Based on dyno HP' : 'Physics estimate'
    );
  } else if (stockData.zeroToSixty) {
    result.zeroToSixty = createMetric(
      stockData.zeroToSixty,
      DATA_SOURCE.ESTIMATED,
      'Manufacturer spec'
    );
  }

  // Quarter mile
  if (calculatedData.quarterMile) {
    result.quarterMile = createMetric(
      calculatedData.quarterMile,
      result.hasUserData ? DATA_SOURCE.CALIBRATED : DATA_SOURCE.ESTIMATED,
      result.hasUserData ? 'Based on dyno HP' : 'Physics estimate'
    );
  } else if (stockData.quarterMile) {
    result.quarterMile = createMetric(
      stockData.quarterMile,
      DATA_SOURCE.ESTIMATED,
      'Manufacturer spec'
    );
  }

  // Braking
  if (calculatedData.braking60To0) {
    result.braking = createMetric(
      calculatedData.braking60To0,
      DATA_SOURCE.ESTIMATED,
      calculatedData.hasBreakUpgrades ? 'Brake upgrades applied' : 'Physics estimate'
    );
  } else if (stockData.braking60To0) {
    result.braking = createMetric(
      stockData.braking60To0,
      DATA_SOURCE.ESTIMATED,
      'Manufacturer spec'
    );
  }

  // Lateral G
  if (calculatedData.lateralG) {
    result.lateralG = createMetric(
      calculatedData.lateralG,
      DATA_SOURCE.ESTIMATED,
      calculatedData.hasSuspensionUpgrades ? 'Suspension upgrades applied' : 'Physics estimate'
    );
  } else if (stockData.lateralG) {
    result.lateralG = createMetric(stockData.lateralG, DATA_SOURCE.ESTIMATED, 'Manufacturer spec');
  }

  return result;
}

/**
 * Format performance data for display with source indicators
 *
 * @param {MergedPerformanceData} data - Merged performance data
 * @returns {Object} Display-ready data
 */
export function formatForDisplay(data) {
  const format = (metric) => {
    if (!metric) return null;
    return {
      value: metric.value,
      formatted: formatMetricValue(metric),
      source: metric.source,
      sourceLabel: metric.shortLabel || metric.label,
      confidence: metric.confidence,
      showBadge: metric.source !== DATA_SOURCE.ESTIMATED, // Show badge for non-estimated
      badgeColor: getDataSourceConfig(metric.source).color,
    };
  };

  return {
    hp: format(data.hp),
    torque: format(data.torque),
    whp: format(data.whp),
    wtq: format(data.wtq),
    boost: format(data.boost),
    zeroToSixty: format(data.zeroToSixty),
    quarterMile: format(data.quarterMile),
    braking: format(data.braking),
    lateralG: format(data.lateralG),
    hasUserData: data.hasUserData,
    primarySource: data.primarySource,
    primarySourceLabel: getDataSourceConfig(data.primarySource).label,
  };
}

/**
 * Format a metric value based on its type (inferred from value range)
 * @param {PerformanceMetric} metric
 * @returns {string}
 */
function formatMetricValue(metric) {
  if (!metric || metric.value == null) return '—';

  const value = metric.value;

  // Detect type from value and format accordingly
  if (value >= 100) {
    // HP, torque, weight - whole numbers
    return Math.round(value).toLocaleString();
  } else if (value >= 10) {
    // Quarter mile, braking distance - 1 decimal
    return value.toFixed(1);
  } else if (value >= 1) {
    // 0-60 time - 1 decimal
    return value.toFixed(1);
  } else {
    // Lateral G - 2 decimals
    return value.toFixed(2);
  }
}

// =============================================================================
// API FUNCTIONS (Client-side)
// =============================================================================

/**
 * Fetch user's dyno results for a vehicle
 *
 * @param {string} userVehicleId - User vehicle UUID
 * @returns {Promise<Object[]>} Array of dyno results
 */
export async function fetchUserDynoResults(userVehicleId) {
  try {
    const response = await fetch(`/api/dyno-results?vehicleId=${userVehicleId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch dyno results');
    }
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('[userDynoDataService] Fetch error:', error);
    return [];
  }
}

/**
 * Get the latest dyno result for a vehicle, formatted for use
 *
 * @param {string} userVehicleId - User vehicle UUID
 * @returns {Promise<Object|null>} Latest dyno result or null
 */
export async function getLatestDynoResult(userVehicleId) {
  const results = await fetchUserDynoResults(userVehicleId);
  if (results.length === 0) return null;

  // Results should be sorted by date desc from API
  const latest = results[0];

  return {
    whp: latest.whp,
    wtq: latest.wtq,
    boostPsi: latest.boost_psi,
    crankHp: latest.crank_hp,
    crankTq: latest.crank_tq,
    fuelType: latest.fuel_type,
    dynoType: latest.dyno_type,
    dynoDate: latest.dyno_date,
    dynoShop: latest.dyno_shop,
    isVerified: latest.is_verified,
    dataSource: latest.data_source || DATA_SOURCE.MEASURED,
    confidence: latest.confidence || 0.95,
    dynoSheetUrl: latest.dyno_sheet_url,
    id: latest.id,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

const userDynoDataService = {
  DATA_SOURCE,
  DATA_SOURCE_CONFIG,
  getDataSourceConfig,
  getHigherPrioritySource,
  createMetric,
  whpToCrankHp,
  crankHpToWhp,
  mergePerformanceData,
  formatForDisplay,
  fetchUserDynoResults,
  getLatestDynoResult,
};

export default userDynoDataService;
