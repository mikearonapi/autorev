/**
 * Tuning Data Validation
 * 
 * Validates tuning profile data before writing to the database.
 * Prevents data contamination by ensuring:
 * 1. Engine platform matches the car's actual engine
 * 2. Stock power numbers are within expected range
 * 3. Tuning platforms are appropriate for the manufacturer
 * 
 * This is the last line of defense against bad data.
 */

import { identifyEnginePlatform, validateStockWhp, ENGINE_PLATFORMS } from './enginePlatforms.js';
import { getTuningTemplate } from '@/data/tuningTemplates.js';

/**
 * Manufacturer to appropriate tuning platforms mapping
 */
const MANUFACTURER_PLATFORMS = {
  audi: ['APR', 'Unitronic', 'IE', 'Integrated Engineering', 'EQT', 'HPA', 'Rennline', 'GIAC', '034'],
  volkswagen: ['APR', 'Unitronic', 'IE', 'Integrated Engineering', 'EQT', 'COBB', 'Burger Tuning', 'JB4'],
  bmw: ['bootmod3', 'BM3', 'MHD', 'Dinan', 'Burger Tuning', 'JB4', 'ESS', 'VF Engineering'],
  mercedes: ['Eurocharged', 'RENNtech', 'Weistec', 'Burger Tuning'],
  porsche: ['GIAC', 'Cobb', 'APR', 'Dundon', 'Fabspeed', 'SharkWerks'],
  ford: ['SCT', 'HP Tuners', 'COBB', 'Lund Racing', 'Palm Beach Dyno', 'MPT', '5 Star Tuning', 'Livernois'],
  chevrolet: ['HP Tuners', 'DiabloSport', 'TRIFECTA', 'Lingenfelter', 'Hennessey', 'EFI Live'],
  dodge: ['HP Tuners', 'DiabloSport', 'Tazer', 'Pulley Boys', 'Demon Performance'],
  subaru: ['COBB', 'EcuTek', 'Open Source', 'Delicious Tuning', 'Torqued Performance'],
  honda: ['Hondata', 'KTuner', '27WON', 'PRL', 'Kraftwerks'],
  toyota: ['bootmod3', 'BM3', 'MHD', 'JB4', 'Visconti', 'EcuTek'], // Supra uses BMW platforms
  nissan: ['UpRev', 'EcuTek', 'AdminTuning', 'Z1 Motorsports'],
};

/**
 * Validate tuning profile data against car specifications
 * @param {Object} car - Car object from database
 * @param {Object} profileData - Tuning profile data to validate
 * @returns {Object} - { valid: boolean, errors: string[], warnings: string[] }
 */
export function validateTuningData(car, profileData) {
  const errors = [];
  const warnings = [];
  
  if (!car || !car.slug) {
    errors.push('Car object is required for validation');
    return { valid: false, errors, warnings };
  }
  
  const manufacturer = car.slug.split('-')[0].toLowerCase();
  const identifiedPlatform = identifyEnginePlatform(car);
  
  // 1. Validate engine family matches identified platform
  if (profileData.engine_family && identifiedPlatform) {
    const expectedDisplayName = identifiedPlatform.displayName;
    
    // Normalize for comparison (remove extra spaces, case insensitive)
    const normalizedProfile = profileData.engine_family.toLowerCase().replace(/\s+/g, ' ').trim();
    const normalizedExpected = expectedDisplayName.toLowerCase().replace(/\s+/g, ' ').trim();
    
    if (!normalizedProfile.includes(normalizedExpected) && !normalizedExpected.includes(normalizedProfile)) {
      // Check if they're at least talking about the same engine displacement
      const profileDisplacement = profileData.engine_family.match(/(\d+\.\d+)L/)?.[1];
      const expectedDisplacement = expectedDisplayName.match(/(\d+\.\d+)L/)?.[1];
      
      if (profileDisplacement !== expectedDisplacement) {
        errors.push(
          `Engine family mismatch: Profile says "${profileData.engine_family}" but car has "${car.engine}" ` +
          `(expected platform: "${expectedDisplayName}")`
        );
      } else {
        warnings.push(
          `Engine family naming differs: "${profileData.engine_family}" vs expected "${expectedDisplayName}"`
        );
      }
    }
  }
  
  // 2. Validate stock power is reasonable
  if (profileData.stock_whp && car.hp) {
    const expectedWhp = Math.round(car.hp * 0.85); // ~15% drivetrain loss
    const tolerance = 60; // Allow 60 WHP tolerance for different dynos
    
    if (Math.abs(profileData.stock_whp - expectedWhp) > tolerance) {
      errors.push(
        `Stock WHP ${profileData.stock_whp} doesn't match expected ~${expectedWhp} WHP ` +
        `(car has ${car.hp} crank HP, expected ${expectedWhp - tolerance} to ${expectedWhp + tolerance} WHP)`
      );
    }
    
    // Also validate against platform expected range if available
    if (identifiedPlatform) {
      const platformValidation = validateStockWhp(identifiedPlatform.platform, profileData.stock_whp);
      if (!platformValidation.valid) {
        warnings.push(platformValidation.message);
      }
    }
  }
  
  // 3. Validate tuning platforms are appropriate for manufacturer
  if (profileData.tuning_platforms && profileData.tuning_platforms.length > 0) {
    const appropriatePlatforms = MANUFACTURER_PLATFORMS[manufacturer] || [];
    
    if (appropriatePlatforms.length > 0) {
      const profilePlatformNames = profileData.tuning_platforms.map(p => 
        (p.name || '').toLowerCase()
      );
      
      // Check if ANY of the profile platforms match what's appropriate
      const hasAppropriate = profilePlatformNames.some(pName => 
        appropriatePlatforms.some(ap => ap.toLowerCase() === pName || pName.includes(ap.toLowerCase()))
      );
      
      if (!hasAppropriate && profilePlatformNames.length > 0) {
        warnings.push(
          `Tuning platforms may not be appropriate for ${manufacturer}. ` +
          `Profile has: ${profilePlatformNames.join(', ')}. ` +
          `Expected brands like: ${appropriatePlatforms.slice(0, 3).join(', ')}`
        );
      }
    }
  }
  
  // 4. Validate stage progressions make sense
  if (profileData.stage_progressions && profileData.stage_progressions.length > 0) {
    let prevMaxGain = 0;
    
    for (const stage of profileData.stage_progressions) {
      const maxGain = stage.hpGainHigh || stage.hpGainLow || 0;
      
      // Each stage should have more gains than the previous
      if (maxGain > 0 && maxGain < prevMaxGain) {
        warnings.push(
          `Stage "${stage.stage}" has lower gains (${maxGain} HP) than previous stage (${prevMaxGain} HP)`
        );
      }
      prevMaxGain = Math.max(prevMaxGain, maxGain);
      
      // Validate gains are reasonable (not > 500 HP from tune alone)
      if (maxGain > 500) {
        warnings.push(
          `Stage "${stage.stage}" claims ${maxGain} HP gain which seems unusually high`
        );
      }
    }
  }
  
  // 5. Validate power limits are sensible
  if (profileData.power_limits) {
    const limits = profileData.power_limits;
    
    // Stock turbo should be less than upgraded internals
    if (limits.stockTurbo?.whp && limits.stockInternals?.whp) {
      if (limits.stockTurbo.whp > limits.stockInternals.whp) {
        warnings.push(
          `Stock turbo limit (${limits.stockTurbo.whp} WHP) higher than stock internals limit (${limits.stockInternals.whp} WHP)`
        );
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    identifiedPlatform,
    manufacturer,
  };
}

/**
 * Generate validated tuning profile from template for a car
 * @param {Object} car - Car object
 * @returns {Object} - { success: boolean, profile: Object, validation: Object }
 */
export function generateValidatedProfile(car) {
  const platform = identifyEnginePlatform(car);
  
  if (!platform) {
    return {
      success: false,
      error: `Could not identify engine platform for ${car.name} (${car.engine})`,
      profile: null,
      validation: null,
    };
  }
  
  const template = getTuningTemplate(platform.platform);
  
  if (!template) {
    return {
      success: false,
      error: `No tuning template available for platform ${platform.displayName}`,
      profile: null,
      platform,
    };
  }
  
  // Build profile from template, adjusting stock power based on actual car
  const expectedWhp = Math.round((car.hp || 400) * 0.85);
  const expectedWtq = Math.round((car.torque || 400) * 0.85);
  
  const profile = {
    ...template,
    // Adjust stock power to match this specific car
    stock_whp: expectedWhp,
    stock_wtq: expectedWtq,
    // Add metadata
    pipeline_version: '2.0.0-platform-based',
    pipeline_run_at: new Date().toISOString(),
    notes: `Generated from ${platform.displayName} platform template. Validated for ${car.name}.`,
  };
  
  // Validate the generated profile
  const validation = validateTuningData(car, profile);
  
  return {
    success: validation.valid,
    profile,
    validation,
    platform,
  };
}

/**
 * Check if a car can have tuning data generated
 * @param {Object} car - Car object
 * @returns {Object} - { canGenerate: boolean, platform: Object|null, hasTemplate: boolean }
 */
export function canGenerateTuningData(car) {
  const platform = identifyEnginePlatform(car);
  
  if (!platform) {
    return {
      canGenerate: false,
      platform: null,
      hasTemplate: false,
      reason: 'Unknown engine platform',
    };
  }
  
  const template = getTuningTemplate(platform.platform);
  
  return {
    canGenerate: !!template,
    platform,
    hasTemplate: !!template,
    reason: template ? null : `No template for ${platform.displayName}`,
  };
}

const tuningValidation = {
  validateTuningData,
  generateValidatedProfile,
  canGenerateTuningData,
  MANUFACTURER_PLATFORMS,
};

export default tuningValidation;
