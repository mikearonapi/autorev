/**
 * Maintenance Service
 * 
 * Fetches vehicle maintenance specs, known issues, and service intervals
 * from Supabase for the Vehicle Owner Dashboard.
 * 
 * Updated 2026-01-11: Uses car_id exclusively (car_slug columns removed from tables)
 * 
 * @module lib/maintenanceService
 */

import { resolveCarId } from './carResolver';
import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Fetch compact maintenance summary (RPC).
 * Optionally variant-aware via car_variants.variant_key.
 * @param {string} carSlug
 * @param {string|null} carVariantKey
 * @returns {Promise<{data: any|null, error: any|null}>}
 */
export async function fetchMaintenanceSummary(carSlug, carVariantKey = null) {
  if (!isSupabaseConfigured || !supabase || !carSlug) {
    return { data: null, error: null };
  }

  try {
    if (carVariantKey) {
      const { data, error } = await supabase.rpc('get_car_maintenance_summary_variant', { p_variant_key: carVariantKey });
      if (!error && data) return { data, error: null };
    }

    const { data, error } = await supabase.rpc('get_car_maintenance_summary', { p_car_slug: carSlug });
    if (error) return { data: null, error };
    return { data: data || null, error: null };
  } catch (err) {
    console.error('[MaintenanceService] Unexpected summary RPC error:', err);
    return { data: null, error: err };
  }
}

function applySummaryToSpecsRow(specsRow, summary) {
  if (!summary || typeof summary !== 'object') return specsRow;
  const base = specsRow && typeof specsRow === 'object' ? { ...specsRow } : {};

  const oil = summary.oil || {};
  const fuel = summary.fuel || {};
  const coolant = summary.coolant || {};
  const brake = summary.brake_fluid || {};
  const tires = summary.tires || {};
  const wheels = summary.wheels || {};
  const wipers = summary.wipers || {};
  const battery = summary.battery || {};

  if (oil.type) base.oil_type = oil.type;
  if (oil.viscosity) base.oil_viscosity = oil.viscosity;
  if (oil.spec) base.oil_spec = oil.spec;
  if (oil.capacity_quarts !== undefined && oil.capacity_quarts !== null) base.oil_capacity_quarts = oil.capacity_quarts;
  if (oil.capacity_liters !== undefined && oil.capacity_liters !== null) base.oil_capacity_liters = oil.capacity_liters;
  if (oil.interval_miles !== undefined && oil.interval_miles !== null) base.oil_change_interval_miles = oil.interval_miles;
  if (oil.interval_months !== undefined && oil.interval_months !== null) base.oil_change_interval_months = oil.interval_months;

  if (fuel.type) base.fuel_type = fuel.type;
  if (fuel.octane_minimum !== undefined && fuel.octane_minimum !== null) base.fuel_octane_minimum = fuel.octane_minimum;
  if (fuel.octane_recommended !== undefined && fuel.octane_recommended !== null) base.fuel_octane_recommended = fuel.octane_recommended;
  if (fuel.tank_capacity_gallons !== undefined && fuel.tank_capacity_gallons !== null) base.fuel_tank_capacity_gallons = fuel.tank_capacity_gallons;
  if (fuel.tank_capacity_liters !== undefined && fuel.tank_capacity_liters !== null) base.fuel_tank_capacity_liters = fuel.tank_capacity_liters;

  if (coolant.type) base.coolant_type = coolant.type;
  if (coolant.spec) base.coolant_spec = coolant.spec;
  if (coolant.capacity_liters !== undefined && coolant.capacity_liters !== null) base.coolant_capacity_liters = coolant.capacity_liters;
  if (coolant.interval_miles !== undefined && coolant.interval_miles !== null) base.coolant_change_interval_miles = coolant.interval_miles;
  if (coolant.interval_years !== undefined && coolant.interval_years !== null) base.coolant_change_interval_years = coolant.interval_years;

  if (brake.type) base.brake_fluid_type = brake.type;
  if (brake.spec) base.brake_fluid_spec = brake.spec;
  if (brake.interval_years !== undefined && brake.interval_years !== null) base.brake_fluid_change_interval_years = brake.interval_years;
  if (brake.interval_miles !== undefined && brake.interval_miles !== null) base.brake_fluid_change_interval_miles = brake.interval_miles;

  if (tires.size_front) base.tire_size_front = tires.size_front;
  if (tires.size_rear) base.tire_size_rear = tires.size_rear;
  if (tires.pressure_front_psi !== undefined && tires.pressure_front_psi !== null) base.tire_pressure_front_psi = tires.pressure_front_psi;
  if (tires.pressure_rear_psi !== undefined && tires.pressure_rear_psi !== null) base.tire_pressure_rear_psi = tires.pressure_rear_psi;

  // Wheel data (bolt pattern, sizes, fitment info)
  if (wheels.bolt_pattern) base.wheel_bolt_pattern = wheels.bolt_pattern;
  if (wheels.size_front) base.wheel_size_front = wheels.size_front;
  if (wheels.size_rear) base.wheel_size_rear = wheels.size_rear;
  if (wheels.center_bore_mm !== undefined && wheels.center_bore_mm !== null) base.wheel_center_bore_mm = wheels.center_bore_mm;
  if (wheels.lug_torque_ft_lbs !== undefined && wheels.lug_torque_ft_lbs !== null) base.wheel_lug_torque_ft_lbs = wheels.lug_torque_ft_lbs;
  if (wheels.lug_torque_nm !== undefined && wheels.lug_torque_nm !== null) base.wheel_lug_torque_nm = wheels.lug_torque_nm;

  if (wipers.driver !== undefined && wipers.driver !== null) base.wiper_driver_size_inches = wipers.driver;
  if (wipers.passenger !== undefined && wipers.passenger !== null) base.wiper_passenger_size_inches = wipers.passenger;
  if (wipers.rear !== undefined && wipers.rear !== null) base.wiper_rear_size_inches = wipers.rear;

  if (battery.group_size) base.battery_group_size = battery.group_size;
  if (battery.cca !== undefined && battery.cca !== null) base.battery_cca = battery.cca;
  if (battery.agm !== undefined && battery.agm !== null) base.battery_agm = Boolean(battery.agm);

  return base;
}

/**
 * Fetch maintenance specs for a specific car
 * @param {string} carSlug - The car slug to fetch specs for
 * @param {string|null} [carId] - Optional pre-resolved car_id for efficient queries
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function fetchMaintenanceSpecs(carSlug, carId = null) {
  if (!isSupabaseConfigured || !supabase || !carSlug) {
    return { data: null, error: null };
  }

  try {
    // Resolve car_id if not provided (for efficient index usage)
    const resolvedCarId = carId || await resolveCarId(carSlug);
    
    // car_id is required - car_slug column no longer exists on this table
    if (!resolvedCarId) {
      console.warn('[MaintenanceService] Could not resolve car_id for slug:', carSlug);
      return { data: null, error: null };
    }
    
    const MAINT_COLS = 'id, car_id, oil_type, oil_viscosity, oil_spec, oil_capacity_liters, oil_capacity_quarts, oil_change_interval_miles, oil_change_interval_months, oil_filter_oem_part, coolant_type, coolant_color, coolant_spec, coolant_capacity_liters, coolant_change_interval_miles, coolant_change_interval_years, brake_fluid_type, brake_fluid_spec, brake_fluid_change_interval_miles, brake_fluid_change_interval_years, trans_fluid_type, trans_fluid_spec, trans_fluid_interval_miles, diff_fluid_type, diff_fluid_spec, diff_fluid_interval_miles, spark_plug_type, spark_plug_gap, spark_plug_interval_miles, tire_pressure_front, tire_pressure_rear, created_at, updated_at';
    
    const { data, error } = await supabase
      .from('vehicle_maintenance_specs')
      .select(MAINT_COLS)
      .eq('car_id', resolvedCarId)
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
 * NOTE: Uses car_issues as source of truth (vehicle_known_issues is DEPRECATED)
 * @param {string} carSlug - The car slug to fetch issues for
 * @param {string|null} [carId] - Optional pre-resolved car_id for efficient queries
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchKnownIssues(carSlug, carId = null) {
  if (!isSupabaseConfigured || !supabase || !carSlug) {
    return { data: [], error: null };
  }

  try {
    // Resolve car_id if not provided (for efficient index usage)
    const resolvedCarId = carId || await resolveCarId(carSlug);
    
    // car_issues is the source of truth as of 2026-01-15
    // car_id is required - car_slug column no longer exists on this table
    if (!resolvedCarId) {
      console.warn('[MaintenanceService] Could not resolve car_id for slug:', carSlug);
      return { data: [], error: null };
    }
    
    const { data, error } = await supabase
      .from('car_issues')
      .select('id, title, kind, severity, affected_years_text, description, symptoms, prevention, fix_description, estimated_cost_text, estimated_cost_low, estimated_cost_high, source_url, source_type, sort_order')
      .eq('car_id', resolvedCarId)
      .order('severity', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[MaintenanceService] Error fetching known issues:', error);
      return { data: [], error };
    }

    // Map to consistent shape for backward compatibility
    const mappedData = (data || []).map(issue => ({
      id: issue.id,
      issue_title: issue.title, // Legacy field name
      title: issue.title,
      kind: issue.kind,
      severity: issue.severity,
      affected_years_text: issue.affected_years_text,
      issue_description: issue.description, // Legacy field name
      description: issue.description,
      symptoms: issue.symptoms,
      prevention: issue.prevention,
      fix_description: issue.fix_description,
      estimated_cost_text: issue.estimated_cost_text || (
        issue.estimated_cost_low || issue.estimated_cost_high
          ? `$${issue.estimated_cost_low || ''}–$${issue.estimated_cost_high || ''}`
          : null
      ),
      estimated_repair_cost_low: issue.estimated_cost_low,
      estimated_repair_cost_high: issue.estimated_cost_high,
      source_url: issue.source_url,
      source_type: issue.source_type,
    }));

    return { data: mappedData, error: null };
  } catch (err) {
    console.error('[MaintenanceService] Unexpected error:', err);
    return { data: [], error: err };
  }
}

/**
 * Fetch service intervals for a specific car
 * @param {string} carSlug - The car slug to fetch intervals for
 * @param {string|null} [carId] - Optional pre-resolved car_id for efficient queries
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchServiceIntervals(carSlug, carId = null) {
  if (!isSupabaseConfigured || !supabase || !carSlug) {
    return { data: [], error: null };
  }

  try {
    // Resolve car_id if not provided (for efficient index usage)
    const resolvedCarId = carId || await resolveCarId(carSlug);
    
    // car_id is required - car_slug column no longer exists on this table
    if (!resolvedCarId) {
      console.warn('[MaintenanceService] Could not resolve car_id for slug:', carSlug);
      return { data: [], error: null };
    }
    
    const INTERVAL_COLS = 'id, car_id, service_type, interval_miles, interval_months, description, estimated_cost_low, estimated_cost_high, severity, notes, created_at';
    
    const { data, error } = await supabase
      .from('vehicle_service_intervals')
      .select(INTERVAL_COLS)
      .eq('car_id', resolvedCarId)
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
 * Optimized: Resolves car_id once and uses it for all efficient queries
 * @param {string} carSlug - The car slug to fetch data for
 * @param {Object} [options]
 * @param {string|null} [options.carVariantKey]
 * @param {string|null} [options.carId] - Optional pre-resolved car_id
 * @returns {Promise<{specs: Object|null, summary: Object|null, issues: Array, intervals: Array, error: Error|null}>}
 */
export async function fetchAllMaintenanceData(carSlug, options = {}) {
  if (!carSlug) {
    return { specs: null, summary: null, issues: [], intervals: [], error: null };
  }

  try {
    const carVariantKey = options?.carVariantKey || null;
    
    // Resolve car_id once for efficient queries on all tables
    const carId = options?.carId || await resolveCarId(carSlug);

    const [summaryResult, specsResult, issuesResult, intervalsResult] = await Promise.all([
      fetchMaintenanceSummary(carSlug, carVariantKey),
      fetchMaintenanceSpecs(carSlug, carId),
      fetchKnownIssues(carSlug, carId),
      fetchServiceIntervals(carSlug, carId),
    ]);

    const summary = summaryResult.data || null;
    const mergedSpecs = applySummaryToSpecsRow(specsResult.data, summary);

    return {
      specs: mergedSpecs,
      summary,
      issues: issuesResult.data || [],
      intervals: intervalsResult.data || [],
      error: summaryResult.error || specsResult.error || issuesResult.error || intervalsResult.error,
    };
  } catch (err) {
    console.error('[MaintenanceService] Error fetching all data:', err);
    return { specs: null, summary: null, issues: [], intervals: [], error: err };
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

  const LOG_COLS = 'id, user_id, user_vehicle_id, service_date, service_type, description, mileage_at_service, cost_cents, vendor_name, receipt_url, notes, created_at, updated_at';
  
  try {
    const { data, error } = await supabase
      .from('user_service_logs')
      .select(LOG_COLS)
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
  console.log('[MaintenanceService] addServiceLog called with:', { vehicleId, userId, logData });
  
  if (!isSupabaseConfigured || !supabase) {
    console.error('[MaintenanceService] Supabase not configured');
    return { data: null, error: new Error('Supabase not configured') };
  }
  
  if (!vehicleId || !userId) {
    console.error('[MaintenanceService] Missing vehicleId or userId:', { vehicleId, userId });
    return { data: null, error: new Error('Vehicle or user information missing') };
  }

  try {
    // Verify we have a valid session before attempting insert
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session) {
      console.error('[MaintenanceService] No valid session:', sessionError);
      return { data: null, error: new Error('Not authenticated. Please sign in again.') };
    }
    
    console.log('[MaintenanceService] Session valid, user:', sessionData.session.user.id);
    
    // Verify session user matches the provided userId
    if (sessionData.session.user.id !== userId) {
      console.error('[MaintenanceService] User ID mismatch:', { sessionUserId: sessionData.session.user.id, providedUserId: userId });
      return { data: null, error: new Error('User authentication mismatch') };
    }
    
    const insertData = {
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
    };
    
    console.log('[MaintenanceService] Inserting:', insertData);
    
    // Add timeout to prevent infinite hanging
    const insertPromise = supabase
      .from('user_service_logs')
      .insert(insertData)
      .select()
      .single();
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out after 15 seconds')), 15000)
    );
    
    const { data, error } = await Promise.race([insertPromise, timeoutPromise]);

    if (error) {
      console.error('[MaintenanceService] Error adding service log:', error);
      return { data: null, error };
    }

    console.log('[MaintenanceService] Service log added successfully:', data);
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
  console.log('[MaintenanceService] updateServiceLog called with:', { logId, userId, updates });
  
  if (!isSupabaseConfigured || !supabase) {
    console.error('[MaintenanceService] Supabase not configured');
    return { data: null, error: new Error('Supabase not configured') };
  }
  
  if (!logId || !userId) {
    console.error('[MaintenanceService] Missing logId or userId:', { logId, userId });
    return { data: null, error: new Error('Log ID or user information missing') };
  }

  try {
    // Verify we have a valid session before attempting update
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session) {
      console.error('[MaintenanceService] No valid session:', sessionError);
      return { data: null, error: new Error('Not authenticated. Please sign in again.') };
    }
    
    // Verify session user matches the provided userId
    if (sessionData.session.user.id !== userId) {
      console.error('[MaintenanceService] User ID mismatch');
      return { data: null, error: new Error('User authentication mismatch') };
    }
    
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
    if (updates.warrantyCovered !== undefined) updateData.warranty_covered = updates.warrantyCovered;
    if (updates.isScheduledMaintenance !== undefined) updateData.is_scheduled_maintenance = updates.isScheduledMaintenance;

    console.log('[MaintenanceService] Updating with:', updateData);

    // Add timeout to prevent infinite hanging
    const updatePromise = supabase
      .from('user_service_logs')
      .update(updateData)
      .eq('id', logId)
      .eq('user_id', userId)
      .select()
      .single();
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out after 15 seconds')), 15000)
    );
    
    const { data, error } = await Promise.race([updatePromise, timeoutPromise]);

    if (error) {
      console.error('[MaintenanceService] Error updating service log:', error);
      return { data: null, error };
    }

    console.log('[MaintenanceService] Service log updated successfully:', data);
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
