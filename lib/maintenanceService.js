/**
 * Maintenance Service
 * 
 * Fetches vehicle maintenance specs, known issues, and service intervals
 * from Supabase for the Vehicle Owner Dashboard.
 * 
 * @module lib/maintenanceService
 */

import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Fetch maintenance specs for a specific car
 * @param {string} carSlug - The car slug to fetch specs for
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function fetchMaintenanceSpecs(carSlug) {
  if (!isSupabaseConfigured || !supabase || !carSlug) {
    return { data: null, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('vehicle_maintenance_specs')
      .select('*')
      .eq('car_slug', carSlug)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" - not a real error
      console.error('[MaintenanceService] Error fetching specs:', error);
      return { data: null, error };
    }

    return { data: data || null, error: null };
  } catch (err) {
    console.error('[MaintenanceService] Unexpected error:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch known issues for a specific car
 * @param {string} carSlug - The car slug to fetch issues for
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchKnownIssues(carSlug) {
  if (!isSupabaseConfigured || !supabase || !carSlug) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('vehicle_known_issues')
      .select('*')
      .eq('car_slug', carSlug)
      .order('severity', { ascending: false });

    if (error) {
      console.error('[MaintenanceService] Error fetching known issues:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('[MaintenanceService] Unexpected error:', err);
    return { data: [], error: err };
  }
}

/**
 * Fetch service intervals for a specific car
 * @param {string} carSlug - The car slug to fetch intervals for
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchServiceIntervals(carSlug) {
  if (!isSupabaseConfigured || !supabase || !carSlug) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('vehicle_service_intervals')
      .select('*')
      .eq('car_slug', carSlug)
      .order('interval_miles', { ascending: true });

    if (error) {
      console.error('[MaintenanceService] Error fetching service intervals:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('[MaintenanceService] Unexpected error:', err);
    return { data: [], error: err };
  }
}

/**
 * Fetch all maintenance data for a car (specs, issues, intervals)
 * @param {string} carSlug - The car slug to fetch data for
 * @returns {Promise<{specs: Object|null, issues: Array, intervals: Array, error: Error|null}>}
 */
export async function fetchAllMaintenanceData(carSlug) {
  if (!carSlug) {
    return { specs: null, issues: [], intervals: [], error: null };
  }

  try {
    const [specsResult, issuesResult, intervalsResult] = await Promise.all([
      fetchMaintenanceSpecs(carSlug),
      fetchKnownIssues(carSlug),
      fetchServiceIntervals(carSlug),
    ]);

    return {
      specs: specsResult.data,
      issues: issuesResult.data || [],
      intervals: intervalsResult.data || [],
      error: specsResult.error || issuesResult.error || intervalsResult.error,
    };
  } catch (err) {
    console.error('[MaintenanceService] Error fetching all data:', err);
    return { specs: null, issues: [], intervals: [], error: err };
  }
}

/**
 * Fetch user's service logs for a vehicle
 * @param {string} vehicleId - The user vehicle ID
 * @param {string} userId - The user ID
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchUserServiceLogs(vehicleId, userId) {
  if (!isSupabaseConfigured || !supabase || !vehicleId || !userId) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('user_service_logs')
      .select('*')
      .eq('user_vehicle_id', vehicleId)
      .eq('user_id', userId)
      .order('service_date', { ascending: false });

    if (error) {
      console.error('[MaintenanceService] Error fetching service logs:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('[MaintenanceService] Unexpected error:', err);
    return { data: [], error: err };
  }
}

/**
 * Add a service log entry
 * @param {string} vehicleId - The user vehicle ID
 * @param {string} userId - The user ID
 * @param {Object} logData - The service log data
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function addServiceLog(vehicleId, userId, logData) {
  if (!isSupabaseConfigured || !supabase || !vehicleId || !userId) {
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  try {
    const { data, error } = await supabase
      .from('user_service_logs')
      .insert({
        user_vehicle_id: vehicleId,
        user_id: userId,
        service_date: logData.serviceDate,
        service_type: logData.serviceType,
        service_category: logData.serviceCategory,
        service_description: logData.description,
        odometer_reading: logData.mileage,
        performed_by: logData.performedBy,
        shop_name: logData.shopName,
        parts_cost: logData.partsCost,
        labor_cost: logData.laborCost,
        total_cost: logData.totalCost,
        parts_used: logData.partsUsed,
        notes: logData.notes,
        next_service_miles: logData.nextServiceMiles,
        next_service_date: logData.nextServiceDate,
        is_scheduled_maintenance: logData.isScheduledMaintenance || false,
        warranty_covered: logData.warrantyCovered || false,
      })
      .select()
      .single();

    if (error) {
      console.error('[MaintenanceService] Error adding service log:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('[MaintenanceService] Unexpected error:', err);
    return { data: null, error: err };
  }
}

/**
 * Update a service log entry
 * @param {string} logId - The service log ID
 * @param {string} userId - The user ID
 * @param {Object} updates - The fields to update
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateServiceLog(logId, userId, updates) {
  if (!isSupabaseConfigured || !supabase || !logId || !userId) {
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  try {
    const updateData = {};
    if (updates.serviceDate !== undefined) updateData.service_date = updates.serviceDate;
    if (updates.serviceType !== undefined) updateData.service_type = updates.serviceType;
    if (updates.serviceCategory !== undefined) updateData.service_category = updates.serviceCategory;
    if (updates.description !== undefined) updateData.service_description = updates.description;
    if (updates.mileage !== undefined) updateData.odometer_reading = updates.mileage;
    if (updates.performedBy !== undefined) updateData.performed_by = updates.performedBy;
    if (updates.shopName !== undefined) updateData.shop_name = updates.shopName;
    if (updates.partsCost !== undefined) updateData.parts_cost = updates.partsCost;
    if (updates.laborCost !== undefined) updateData.labor_cost = updates.laborCost;
    if (updates.totalCost !== undefined) updateData.total_cost = updates.totalCost;
    if (updates.partsUsed !== undefined) updateData.parts_used = updates.partsUsed;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.nextServiceMiles !== undefined) updateData.next_service_miles = updates.nextServiceMiles;
    if (updates.nextServiceDate !== undefined) updateData.next_service_date = updates.nextServiceDate;

    const { data, error } = await supabase
      .from('user_service_logs')
      .update(updateData)
      .eq('id', logId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[MaintenanceService] Error updating service log:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('[MaintenanceService] Unexpected error:', err);
    return { data: null, error: err };
  }
}

/**
 * Delete a service log entry
 * @param {string} logId - The service log ID
 * @param {string} userId - The user ID
 * @returns {Promise<{error: Error|null}>}
 */
export async function deleteServiceLog(logId, userId) {
  if (!isSupabaseConfigured || !supabase || !logId || !userId) {
    return { error: new Error('Not configured or not authenticated') };
  }

  try {
    const { error } = await supabase
      .from('user_service_logs')
      .delete()
      .eq('id', logId)
      .eq('user_id', userId);

    if (error) {
      console.error('[MaintenanceService] Error deleting service log:', error);
      return { error };
    }

    return { error: null };
  } catch (err) {
    console.error('[MaintenanceService] Unexpected error:', err);
    return { error: err };
  }
}

/**
 * Get upcoming service reminders based on logged services
 * @param {Array} serviceLogs - Array of service logs
 * @param {number} currentMileage - Current vehicle mileage
 * @returns {Array} - Array of upcoming services
 */
export function getUpcomingServices(serviceLogs, currentMileage) {
  if (!serviceLogs || serviceLogs.length === 0) return [];

  const today = new Date();
  const upcoming = [];

  serviceLogs.forEach(log => {
    if (log.next_service_date || log.next_service_miles) {
      const dueDate = log.next_service_date ? new Date(log.next_service_date) : null;
      const dueMiles = log.next_service_miles;
      
      const isOverdueByDate = dueDate && dueDate < today;
      const isOverdueByMiles = currentMileage && dueMiles && currentMileage >= dueMiles;
      const isDueSoon = dueDate && !isOverdueByDate && 
        (dueDate - today) / (1000 * 60 * 60 * 24) <= 30;
      const isDueSoonByMiles = currentMileage && dueMiles && !isOverdueByMiles &&
        (dueMiles - currentMileage) <= 1000;

      if (isOverdueByDate || isOverdueByMiles || isDueSoon || isDueSoonByMiles) {
        upcoming.push({
          serviceType: log.service_type,
          lastServiceDate: log.service_date,
          lastServiceMileage: log.odometer_reading,
          dueDate: log.next_service_date,
          dueMiles: log.next_service_miles,
          isOverdue: isOverdueByDate || isOverdueByMiles,
          priority: isOverdueByDate || isOverdueByMiles ? 'high' : 'medium',
        });
      }
    }
  });

  // Sort by priority (overdue first) then by date
  upcoming.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
    return 0;
  });

  return upcoming;
}

/**
 * Get a summary of maintenance specs for display (simplified version)
 * @param {Object} specs - Full maintenance specs object
 * @returns {Object} - Simplified summary for quick reference
 */
export function getMaintenanceSummary(specs) {
  if (!specs) return null;

  return {
    oil: {
      type: specs.oil_type,
      viscosity: specs.oil_viscosity,
      capacity: specs.oil_capacity_quarts,
      changeInterval: specs.oil_change_interval_miles,
    },
    coolant: {
      type: specs.coolant_type,
      spec: specs.coolant_spec,
    },
    brakeFluid: {
      type: specs.brake_fluid_type,
    },
    tires: {
      front: specs.tire_size_front,
      rear: specs.tire_size_rear,
      pressureFront: specs.tire_pressure_front_psi,
      pressureRear: specs.tire_pressure_rear_psi,
    },
    wipers: {
      driver: specs.wiper_driver_size_inches,
      passenger: specs.wiper_passenger_size_inches,
      rear: specs.wiper_rear_size_inches,
    },
    battery: {
      groupSize: specs.battery_group_size,
      cca: specs.battery_cca,
      agm: specs.battery_agm,
    },
    fuel: {
      type: specs.fuel_type,
      octaneMin: specs.fuel_octane_minimum,
      octaneRecommended: specs.fuel_octane_recommended,
    },
  };
}
