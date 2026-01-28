/**
 * VIN Decoder Service
 * 
 * Uses NHTSA's free VIN Decoder API to decode vehicle information.
 * https://vpic.nhtsa.dot.gov/api/
 * 
 * @module lib/vinDecoder
 */

const NHTSA_API_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';

/**
 * @typedef {Object} DecodedVIN
 * @property {string} vin - The VIN that was decoded
 * @property {boolean} success - Whether decoding was successful
 * @property {string|null} error - Error message if failed
 * @property {number} year - Model year
 * @property {string} make - Manufacturer (e.g., "BMW", "Porsche")
 * @property {string} model - Model name
 * @property {string} [trim] - Trim level
 * @property {string} [bodyClass] - Body type (e.g., "Coupe", "Sedan")
 * @property {string} [driveType] - Drive type (e.g., "RWD", "AWD")
 * @property {number} [engineCylinders] - Number of cylinders
 * @property {string} [engineDisplacement] - Engine displacement in liters
 * @property {string} [fuelType] - Fuel type
 * @property {string} [transmission] - Transmission type
 * @property {number} [engineHP] - Engine horsepower
 * @property {string} [manufacturerName] - Full manufacturer name
 * @property {string} [plantCountry] - Country of manufacture
 * @property {Object} raw - Raw API response data
 */

/**
 * Validate VIN format
 * 
 * @param {string} vin - VIN to validate
 * @returns {boolean}
 */
export function isValidVIN(vin) {
  if (!vin || typeof vin !== 'string') {
    return false;
  }
  
  // VINs are 17 characters, alphanumeric except I, O, Q
  const cleanVin = vin.replace(/[\s-]/g, '').toUpperCase();
  const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
  
  return vinRegex.test(cleanVin);
}

/**
 * Clean and normalize VIN
 * 
 * @param {string} vin 
 * @returns {string}
 */
export function cleanVIN(vin) {
  return vin.replace(/[\s-]/g, '').toUpperCase();
}

/**
 * Decode a VIN using NHTSA API
 * 
 * @param {string} vin - 17-character VIN
 * @returns {Promise<DecodedVIN>}
 */
export async function decodeVIN(vin) {
  const cleanedVin = cleanVIN(vin);
  
  if (!isValidVIN(cleanedVin)) {
    return {
      vin: cleanedVin,
      success: false,
      error: 'Invalid VIN format. VIN must be 17 alphanumeric characters.',
      raw: null,
    };
  }

  try {
    const response = await fetch(
      `${NHTSA_API_BASE}/DecodeVin/${cleanedVin}?format=json`
    );

    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.Results || data.Results.length === 0) {
      return {
        vin: cleanedVin,
        success: false,
        error: 'No data returned from VIN decoder',
        raw: data,
      };
    }

    // Parse results into a more usable format
    const results = {};
    data.Results.forEach(item => {
      if (item.Value && item.Value.trim() !== '') {
        results[item.Variable] = item.Value;
      }
    });

    // Check for error codes from NHTSA
    const errorCode = results['Error Code'];
    const errorText = results['Error Text'];
    
    if (errorCode && errorCode !== '0' && !results['Model Year']) {
      return {
        vin: cleanedVin,
        success: false,
        error: errorText || 'Unable to decode VIN',
        raw: results,
      };
    }

    // Build decoded VIN object
    const decoded = {
      vin: cleanedVin,
      success: true,
      error: null,
      year: parseInt(results['Model Year']) || null,
      make: results['Make'] || null,
      model: results['Model'] || null,
      trim: results['Trim'] || results['Trim2'] || null,
      bodyClass: results['Body Class'] || null,
      driveType: normalizeDriveType(results['Drive Type']),
      engineCylinders: parseInt(results['Engine Number of Cylinders']) || null,
      engineDisplacement: results['Displacement (L)'] || null,
      fuelType: results['Fuel Type - Primary'] || null,
      transmission: normalizeTransmission(results['Transmission Style']),
      engineHP: parseFloat(results['Engine Brake (hp) From']) || null,
      manufacturerName: results['Manufacturer Name'] || null,
      plantCountry: results['Plant Country'] || null,
      vehicleType: results['Vehicle Type'] || null,
      series: results['Series'] || null,
      raw: results,
    };

    return decoded;
  } catch (err) {
    console.error('[VIN Decoder] Error:', err);
    return {
      vin: cleanedVin,
      success: false,
      error: err.message || 'Failed to decode VIN',
      raw: null,
    };
  }
}

/**
 * Normalize drive type to our standard format
 * 
 * @param {string} driveType 
 * @returns {string|null}
 */
function normalizeDriveType(driveType) {
  if (!driveType) return null;
  
  const dt = driveType.toLowerCase();
  if (dt.includes('rear') || dt.includes('rwd')) return 'RWD';
  if (dt.includes('front') || dt.includes('fwd')) return 'FWD';
  if (dt.includes('all') || dt.includes('awd') || dt.includes('4wd') || dt.includes('4x4')) return 'AWD';
  
  return driveType;
}

/**
 * Normalize transmission to our standard format
 * 
 * @param {string} transmission 
 * @returns {string|null}
 */
function normalizeTransmission(transmission) {
  if (!transmission) return null;
  
  const t = transmission.toLowerCase();
  if (t.includes('manual')) return 'Manual';
  if (t.includes('automatic') || t.includes('auto')) return 'Automatic';
  if (t.includes('dct') || t.includes('dual clutch')) return 'DCT';
  if (t.includes('cvt')) return 'CVT';
  
  return transmission;
}

/**
 * Get basic VIN info (year, make) using the extended endpoint
 * Useful for quicker lookups when full data isn't needed
 * 
 * @param {string} vin 
 * @returns {Promise<{year: number|null, make: string|null, error: string|null}>}
 */
export async function getVINBasicInfo(vin) {
  const cleanedVin = cleanVIN(vin);
  
  if (!isValidVIN(cleanedVin)) {
    return { year: null, make: null, error: 'Invalid VIN format' };
  }

  try {
    const response = await fetch(
      `${NHTSA_API_BASE}/DecodeVinValues/${cleanedVin}?format=json`
    );

    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.Results?.[0] || {};

    return {
      year: parseInt(result.ModelYear) || null,
      make: result.Make || null,
      model: result.Model || null,
      error: null,
    };
  } catch (err) {
    return { year: null, make: null, error: err.message };
  }
}

/**
 * Try to match decoded VIN to a car in our database
 * 
 * @param {DecodedVIN} decodedVin 
 * @param {Array} cars - Array of cars from our database
 * @returns {Object|null} - Matched car or null
 */
export function matchVINToCar(decodedVin, cars) {
  if (!decodedVin?.success || !cars?.length) {
    return null;
  }

  const { make, model, year } = decodedVin;
  
  // Normalize for comparison
  const normalizedMake = make?.toLowerCase().trim();
  const normalizedModel = model?.toLowerCase().trim();
  
  // Find potential matches
  const matches = cars.filter(car => {
    const carName = car.name.toLowerCase();
    const _carMake = carName.split(' ')[0]; // First word is usually the make
    
    // Check if make matches
    if (normalizedMake && !carName.includes(normalizedMake)) {
      return false;
    }
    
    // Check if model is in the car name
    if (normalizedModel) {
      // Handle common variations
      const modelVariants = [
        normalizedModel,
        normalizedModel.replace(/-/g, ' '),
        normalizedModel.replace(/ /g, '-'),
      ];
      
      if (!modelVariants.some(variant => carName.includes(variant))) {
        return false;
      }
    }
    
    // Check if year is in range
    if (year && car.years) {
      const yearRange = car.years.match(/(\d{4})/g);
      if (yearRange) {
        const startYear = parseInt(yearRange[0]);
        const endYear = yearRange[1] ? parseInt(yearRange[1]) : startYear;
        if (year < startYear || year > endYear) {
          return false;
        }
      }
    }
    
    return true;
  });

  // Return best match (most specific)
  return matches[0] || null;
}
