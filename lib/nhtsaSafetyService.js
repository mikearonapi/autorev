/**
 * NHTSA Safety Service
 * 
 * Fetches recalls, TSBs (Technical Service Bulletins), complaints, 
 * and safety ratings from NHTSA APIs.
 * 
 * API Documentation: https://api.nhtsa.gov/
 * 
 * @module lib/nhtsaSafetyService
 */

const NHTSA_API_BASE = 'https://api.nhtsa.gov';

/**
 * @typedef {Object} Recall
 * @property {string} campaignNumber - NHTSA campaign number
 * @property {string} manufacturer - Manufacturer name
 * @property {string} component - Affected component
 * @property {string} summary - Recall summary
 * @property {string} consequence - Potential consequence
 * @property {string} remedy - Repair remedy
 * @property {string} reportReceivedDate - Date recall was reported
 * @property {boolean} incomplete - Whether recall is incomplete for this VIN
 */

/**
 * @typedef {Object} Complaint
 * @property {number} odiNumber - NHTSA ODI number
 * @property {string} manufacturer - Manufacturer name
 * @property {string} component - Component involved
 * @property {string} summary - Complaint summary
 * @property {string} dateReceived - Date complaint was received
 * @property {boolean} crash - Whether crash occurred
 * @property {boolean} fire - Whether fire occurred
 * @property {number} numberOfDeaths - Number of deaths
 * @property {number} numberOfInjuries - Number of injuries
 */

/**
 * @typedef {Object} Investigation
 * @property {string} investigationId - NHTSA investigation ID
 * @property {string} manufacturer - Manufacturer name
 * @property {string} subject - Investigation subject
 * @property {string} summary - Investigation summary
 * @property {string} openDate - Date investigation opened
 * @property {string} closeDate - Date investigation closed (if applicable)
 * @property {string} status - Current status
 */

/**
 * Fetch recalls by VIN
 * This returns recalls specific to the vehicle identified by VIN
 * 
 * @param {string} vin - 17-character VIN
 * @returns {Promise<{data: Array<Recall>|null, error: string|null}>}
 */
export async function fetchRecallsByVIN(vin) {
  if (!vin || vin.length !== 17) {
    return { data: null, error: 'Invalid VIN' };
  }

  try {
    const response = await fetch(
      `${NHTSA_API_BASE}/recalls/recallsByVehicle?vin=${vin}`
    );

    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return { data: [], error: null };
    }

    // Transform to our format
    const recalls = data.results.map(recall => ({
      campaignNumber: recall.NHTSACampaignNumber || recall.CampaignNumber,
      manufacturer: recall.Manufacturer,
      component: recall.Component,
      summary: recall.Summary,
      consequence: recall.Consequence,
      remedy: recall.Remedy,
      reportReceivedDate: recall.ReportReceivedDate,
      notes: recall.Notes,
      // VIN-specific lookup tells us if recall is incomplete
      incomplete: recall.VINInfoSummary?.includes('INCOMPLETE') || false,
    }));

    return { data: recalls, error: null };
  } catch (err) {
    console.error('[NHTSA Safety] Error fetching recalls by VIN:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Fetch recalls by make, model, year
 * Use this when VIN is not available
 * 
 * @param {number} year - Model year
 * @param {string} make - Manufacturer (e.g., "Ford")
 * @param {string} model - Model name (e.g., "Mustang")
 * @returns {Promise<{data: Array<Recall>|null, error: string|null}>}
 */
export async function fetchRecallsByVehicle(year, make, model) {
  if (!year || !make || !model) {
    return { data: null, error: 'Missing required parameters' };
  }

  try {
    const response = await fetch(
      `${NHTSA_API_BASE}/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`
    );

    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return { data: [], error: null };
    }

    const recalls = data.results.map(recall => ({
      campaignNumber: recall.NHTSACampaignNumber || recall.CampaignNumber,
      manufacturer: recall.Manufacturer,
      component: recall.Component,
      summary: recall.Summary,
      consequence: recall.Consequence,
      remedy: recall.Remedy,
      reportReceivedDate: recall.ReportReceivedDate,
      notes: recall.Notes,
    }));

    return { data: recalls, error: null };
  } catch (err) {
    console.error('[NHTSA Safety] Error fetching recalls:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Fetch complaints by make, model, year
 * 
 * @param {number} year - Model year
 * @param {string} make - Manufacturer
 * @param {string} model - Model name
 * @returns {Promise<{data: Array<Complaint>|null, error: string|null}>}
 */
export async function fetchComplaints(year, make, model) {
  if (!year || !make || !model) {
    return { data: null, error: 'Missing required parameters' };
  }

  try {
    const response = await fetch(
      `${NHTSA_API_BASE}/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`
    );

    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return { data: [], error: null };
    }

    const complaints = data.results.map(complaint => ({
      odiNumber: complaint.ODINumber,
      manufacturer: complaint.Manufacturer,
      component: complaint.Component,
      summary: complaint.Summary,
      dateReceived: complaint.DateReceived || complaint.DateOfIncident,
      crash: complaint.Crash === 'Y',
      fire: complaint.Fire === 'Y',
      numberOfDeaths: parseInt(complaint.NumberOfDeaths) || 0,
      numberOfInjuries: parseInt(complaint.NumberOfInjuries) || 0,
      mileage: complaint.ODIMileage,
      speed: complaint.Speed,
    }));

    // Sort by date, most recent first
    complaints.sort((a, b) => 
      new Date(b.dateReceived || 0) - new Date(a.dateReceived || 0)
    );

    return { data: complaints, error: null };
  } catch (err) {
    console.error('[NHTSA Safety] Error fetching complaints:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Fetch investigations by make, model, year
 * Investigations are formal NHTSA inquiries that may lead to recalls
 * 
 * @param {number} year - Model year
 * @param {string} make - Manufacturer
 * @param {string} model - Model name
 * @returns {Promise<{data: Array<Investigation>|null, error: string|null}>}
 */
export async function fetchInvestigations(year, make, model) {
  if (!year || !make || !model) {
    return { data: null, error: 'Missing required parameters' };
  }

  try {
    const response = await fetch(
      `${NHTSA_API_BASE}/products/vehicle/makes/${encodeURIComponent(make)}/models/${encodeURIComponent(model)}/years/${year}/investigations?format=json`
    );

    if (!response.ok) {
      // Investigations endpoint may not exist for all vehicles
      return { data: [], error: null };
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return { data: [], error: null };
    }

    const investigations = data.results.map(inv => ({
      investigationId: inv.NHTSAActionNumber,
      manufacturer: inv.Manufacturer,
      subject: inv.Subject,
      summary: inv.Summary,
      openDate: inv.OpenDate,
      closeDate: inv.CloseDate,
      status: inv.CloseDate ? 'Closed' : 'Open',
      investigationType: inv.InvestigationType,
    }));

    return { data: investigations, error: null };
  } catch (err) {
    console.error('[NHTSA Safety] Error fetching investigations:', err);
    return { data: [], error: null }; // Don't fail on investigation errors
  }
}

/**
 * Get safety ratings by make, model, year
 * 
 * @param {number} year - Model year
 * @param {string} make - Manufacturer
 * @param {string} model - Model name
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function fetchSafetyRatings(year, make, model) {
  if (!year || !make || !model) {
    return { data: null, error: 'Missing required parameters' };
  }

  try {
    // First get vehicle ID
    const searchResponse = await fetch(
      `${NHTSA_API_BASE}/SafetyRatings/modelyear/${year}/make/${encodeURIComponent(make)}/model/${encodeURIComponent(model)}?format=json`
    );

    if (!searchResponse.ok) {
      return { data: null, error: null };
    }

    const searchData = await searchResponse.json();
    
    if (!searchData.Results || searchData.Results.length === 0) {
      return { data: null, error: null };
    }

    // Get the first vehicle's ratings
    const vehicleId = searchData.Results[0].VehicleId;
    
    const ratingsResponse = await fetch(
      `${NHTSA_API_BASE}/SafetyRatings/VehicleId/${vehicleId}?format=json`
    );

    if (!ratingsResponse.ok) {
      return { data: null, error: null };
    }

    const ratingsData = await ratingsResponse.json();
    const result = ratingsData.Results?.[0];

    if (!result) {
      return { data: null, error: null };
    }

    const ratings = {
      vehicleDescription: result.VehicleDescription,
      overallRating: result.OverallRating,
      overallFrontCrashRating: result.OverallFrontCrashRating,
      frontCrashDriversideRating: result.FrontCrashDriversideRating,
      frontCrashPassengersideRating: result.FrontCrashPassengersideRating,
      overallSideCrashRating: result.OverallSideCrashRating,
      sideCrashDriversideRating: result.SideCrashDriversideRating,
      sideCrashPassengersideRating: result.SideCrashPassengersideRating,
      rolloverRating: result.RolloverRating,
      rolloverRating2: result.RolloverRating2,
      rolloverPossibility: result.RolloverPossibility,
      rolloverPossibility2: result.RolloverPossibility2,
      sidePoleCrashRating: result.SidePoleCrashRating,
      nhtsa5StarSafetyUrl: result.NHTSAForwardCollisionWarning,
      // Convert "Not Rated" to null for cleaner display
      hasRatings: result.OverallRating && result.OverallRating !== 'Not Rated',
    };

    return { data: ratings, error: null };
  } catch (err) {
    console.error('[NHTSA Safety] Error fetching safety ratings:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Fetch all safety data for a vehicle
 * Combines recalls, complaints, investigations, and safety ratings
 * 
 * @param {Object} vehicle - { vin, year, make, model }
 * @returns {Promise<Object>}
 */
export async function fetchAllSafetyData(vehicle) {
  const { vin, year, make, model } = vehicle;
  
  if (!year || !make || !model) {
    return {
      recalls: [],
      complaints: [],
      investigations: [],
      safetyRatings: null,
      error: 'Missing vehicle information',
    };
  }

  try {
    // Fetch all data in parallel
    const [recallsResult, complaintsResult, investigationsResult, ratingsResult] = await Promise.all([
      // Use VIN for recalls if available, otherwise use make/model/year
      vin && vin.length === 17 
        ? fetchRecallsByVIN(vin) 
        : fetchRecallsByVehicle(year, make, model),
      fetchComplaints(year, make, model),
      fetchInvestigations(year, make, model),
      fetchSafetyRatings(year, make, model),
    ]);

    return {
      recalls: recallsResult.data || [],
      complaints: complaintsResult.data || [],
      investigations: investigationsResult.data || [],
      safetyRatings: ratingsResult.data,
      error: null,
    };
  } catch (err) {
    console.error('[NHTSA Safety] Error fetching all safety data:', err);
    return {
      recalls: [],
      complaints: [],
      investigations: [],
      safetyRatings: null,
      error: err.message,
    };
  }
}

/**
 * Group complaints by component for summary view
 * 
 * @param {Array<Complaint>} complaints 
 * @returns {Array<Object>}
 */
export function groupComplaintsByComponent(complaints) {
  if (!complaints || complaints.length === 0) return [];

  const groups = {};
  
  complaints.forEach(complaint => {
    const component = complaint.component || 'Other';
    if (!groups[component]) {
      groups[component] = {
        component,
        count: 0,
        crashes: 0,
        fires: 0,
        injuries: 0,
        deaths: 0,
        complaints: [],
      };
    }
    
    groups[component].count++;
    if (complaint.crash) groups[component].crashes++;
    if (complaint.fire) groups[component].fires++;
    groups[component].injuries += complaint.numberOfInjuries || 0;
    groups[component].deaths += complaint.numberOfDeaths || 0;
    groups[component].complaints.push(complaint);
  });

  // Sort by count, highest first
  return Object.values(groups).sort((a, b) => b.count - a.count);
}

/**
 * Get safety summary for quick display
 * 
 * @param {Object} safetyData - Result from fetchAllSafetyData
 * @returns {Object}
 */
export function getSafetySummary(safetyData) {
  const { recalls, complaints, investigations, safetyRatings } = safetyData;
  
  const openRecalls = recalls.filter(r => r.incomplete).length;
  const totalRecalls = recalls.length;
  const complaintsByComponent = groupComplaintsByComponent(complaints);
  const topComponents = complaintsByComponent.slice(0, 3);
  
  return {
    openRecalls,
    totalRecalls,
    totalComplaints: complaints.length,
    openInvestigations: investigations.filter(i => i.status === 'Open').length,
    overallRating: safetyRatings?.overallRating || null,
    hasRatings: safetyRatings?.hasRatings || false,
    topComplaintComponents: topComponents.map(c => ({
      name: c.component,
      count: c.count,
    })),
    hasSafetyIssues: openRecalls > 0 || investigations.some(i => i.status === 'Open'),
  };
}

// ============================================================================
// TECHNICAL SERVICE BULLETINS (TSBs)
// ============================================================================

/**
 * @typedef {Object} TSB
 * @property {string} tsbId - TSB identifier
 * @property {string} manufacturer - Manufacturer name
 * @property {string} component - Affected component
 * @property {string} summary - TSB summary/description
 * @property {string} dateIssued - Date TSB was issued
 * @property {string} nhtsaId - NHTSA tracking ID
 */

/**
 * Fetch Technical Service Bulletins by make, model, year
 * TSBs are manufacturer notices about known issues and fixes
 * 
 * @param {number} year - Model year
 * @param {string} make - Manufacturer
 * @param {string} model - Model name
 * @returns {Promise<{data: Array<TSB>|null, error: string|null}>}
 */
export async function fetchTSBs(year, make, model) {
  if (!year || !make || !model) {
    return { data: null, error: 'Missing required parameters' };
  }

  try {
    // NHTSA TSB endpoint
    const response = await fetch(
      `${NHTSA_API_BASE}/products/vehicle/makes/${encodeURIComponent(make)}/models/${encodeURIComponent(model)}/years/${year}/tsbs?format=json`
    );

    if (!response.ok) {
      // TSB endpoint may not be available for all vehicles
      return { data: [], error: null };
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return { data: [], error: null };
    }

    const tsbs = data.results.map(tsb => ({
      tsbId: tsb.TSBId || tsb.ServiceBulletinNumber,
      manufacturer: tsb.Manufacturer || make,
      component: tsb.Component,
      summary: tsb.Summary || tsb.TSBSummary,
      dateIssued: tsb.DateIssued || tsb.TSBDate,
      nhtsaId: tsb.NHTSAActionNumber,
      modelYear: tsb.ModelYear || year,
    }));

    // Sort by date, most recent first
    tsbs.sort((a, b) => 
      new Date(b.dateIssued || 0) - new Date(a.dateIssued || 0)
    );

    return { data: tsbs, error: null };
  } catch (err) {
    console.error('[NHTSA Safety] Error fetching TSBs:', err);
    return { data: [], error: null }; // Don't fail on TSB errors
  }
}

/**
 * Group TSBs by component for summary view
 * 
 * @param {Array<TSB>} tsbs 
 * @returns {Array<Object>}
 */
export function groupTSBsByComponent(tsbs) {
  if (!tsbs || tsbs.length === 0) return [];

  const groups = {};
  
  tsbs.forEach(tsb => {
    const component = tsb.component || 'Other';
    if (!groups[component]) {
      groups[component] = {
        component,
        count: 0,
        tsbs: [],
      };
    }
    
    groups[component].count++;
    groups[component].tsbs.push(tsb);
  });

  // Sort by count, highest first
  return Object.values(groups).sort((a, b) => b.count - a.count);
}

/**
 * Fetch all safety data INCLUDING TSBs for a vehicle
 * Extended version that adds TSBs to the standard safety data
 * 
 * @param {Object} vehicle - { vin, year, make, model }
 * @returns {Promise<Object>}
 */
export async function fetchComprehensiveSafetyData(vehicle) {
  const { vin, year, make, model } = vehicle;
  
  if (!year || !make || !model) {
    return {
      recalls: [],
      complaints: [],
      investigations: [],
      tsbs: [],
      safetyRatings: null,
      error: 'Missing vehicle information',
    };
  }

  try {
    // Fetch all data in parallel including TSBs
    const [recallsResult, complaintsResult, investigationsResult, ratingsResult, tsbsResult] = await Promise.all([
      vin && vin.length === 17 
        ? fetchRecallsByVIN(vin) 
        : fetchRecallsByVehicle(year, make, model),
      fetchComplaints(year, make, model),
      fetchInvestigations(year, make, model),
      fetchSafetyRatings(year, make, model),
      fetchTSBs(year, make, model),
    ]);

    return {
      recalls: recallsResult.data || [],
      complaints: complaintsResult.data || [],
      investigations: investigationsResult.data || [],
      tsbs: tsbsResult.data || [],
      safetyRatings: ratingsResult.data,
      error: null,
    };
  } catch (err) {
    console.error('[NHTSA Safety] Error fetching comprehensive safety data:', err);
    return {
      recalls: [],
      complaints: [],
      investigations: [],
      tsbs: [],
      safetyRatings: null,
      error: err.message,
    };
  }
}

/**
 * Get extended safety summary including TSBs
 * 
 * @param {Object} safetyData - Result from fetchComprehensiveSafetyData
 * @returns {Object}
 */
export function getExtendedSafetySummary(safetyData) {
  const baseSummary = getSafetySummary(safetyData);
  const { tsbs } = safetyData;
  
  const tsbsByComponent = groupTSBsByComponent(tsbs || []);
  const topTsbComponents = tsbsByComponent.slice(0, 3);
  
  return {
    ...baseSummary,
    totalTSBs: tsbs?.length || 0,
    topTSBComponents: topTsbComponents.map(c => ({
      name: c.component,
      count: c.count,
    })),
    // Categories of concern (components with both complaints AND TSBs)
    componentsOfConcern: findComponentsOfConcern(safetyData),
  };
}

/**
 * Find components that appear in both complaints and TSBs
 * These are likely the most important issues to be aware of
 * 
 * @param {Object} safetyData 
 * @returns {Array<string>}
 */
function findComponentsOfConcern(safetyData) {
  const { complaints, tsbs } = safetyData;
  
  if (!complaints?.length || !tsbs?.length) return [];
  
  const complaintComponents = new Set(
    complaints.map(c => normalizeComponent(c.component))
  );
  
  const tsbComponents = new Set(
    tsbs.map(t => normalizeComponent(t.component))
  );
  
  const overlap = [...complaintComponents].filter(c => tsbComponents.has(c));
  
  return overlap.filter(Boolean);
}

/**
 * Normalize component names for comparison
 * @param {string} component 
 * @returns {string}
 */
function normalizeComponent(component) {
  if (!component) return '';
  return component.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}



















