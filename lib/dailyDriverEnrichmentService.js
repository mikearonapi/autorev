/**
 * Daily Driver Enrichment Service
 * 
 * Handles AI-powered enrichment for vehicles not in our performance car database.
 * This service researches maintenance specs, service intervals, known issues,
 * and generates a garage image for daily drivers (SUVs, trucks, minivans, etc.).
 * 
 * Key features:
 * - Shared enrichment: First user pays, subsequent users get data for free
 * - AI research via Claude for maintenance specs and service intervals
 * - NHTSA complaints for known issues
 * - Image generation via Google Gemini (Nano Banana Pro)
 * 
 * @module lib/dailyDriverEnrichmentService
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { put } from '@vercel/blob';

// Lazy-init clients
let supabase = null;
let anthropic = null;

function getSupabase() {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase not configured');
    supabase = createClient(url, key);
  }
  return supabase;
}

function getAnthropic() {
  if (!anthropic) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error('Anthropic API key not configured');
    anthropic = new Anthropic({ apiKey: key });
  }
  return anthropic;
}

/**
 * Generate a normalized lookup key for vehicle matching
 */
export function generateLookupKey(year, make, model) {
  const normalized = `${year}-${make}-${model}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
  return normalized;
}

/**
 * Check if enrichment already exists for this vehicle
 */
export async function getExistingEnrichment(year, make, model) {
  const db = getSupabase();
  const lookupKey = generateLookupKey(year, make, model);
  
  const { data, error } = await db
    .from('daily_driver_enrichments')
    .select('*')
    .eq('lookup_key', lookupKey)
    .eq('status', 'completed')
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('[DailyDriverEnrichment] Error checking existing:', error);
  }
  
  return data || null;
}

/**
 * Research maintenance specs using Claude
 */
async function researchMaintenanceSpecs(year, make, model) {
  const ai = getAnthropic();
  
  const prompt = `You are an automotive expert. Research and provide maintenance specifications for a ${year} ${make} ${model}.

Return a JSON object with the following structure (use null for unknown values):
{
  "oil_type": "Full synthetic 0W-20",
  "oil_capacity_quarts": 5.0,
  "oil_filter_part_number": "example part number or null",
  "coolant_type": "OEM long-life coolant",
  "coolant_capacity_quarts": 8.5,
  "brake_fluid_type": "DOT 3",
  "transmission_fluid_type": "ATF or Manual trans fluid type",
  "transmission_fluid_capacity_quarts": 4.0,
  "fuel_type": "Regular unleaded",
  "fuel_octane_minimum": 87,
  "tire_size_front": "225/65R17",
  "tire_size_rear": "225/65R17",
  "tire_pressure_front_psi": 35,
  "tire_pressure_rear_psi": 35,
  "battery_group_size": "35",
  "battery_cca": 500,
  "spark_plug_gap_mm": 1.1,
  "air_filter_part_number": null,
  "cabin_filter_part_number": null,
  "wiper_blade_size_front": "26\\" + 16\\"",
  "wiper_blade_size_rear": "12\\""
}

Only return valid JSON, no explanation. Use realistic values based on typical specifications for this vehicle.`;

  try {
    const response = await ai.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0]?.text || '{}';
    // Extract JSON from response (handle potential markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const specs = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    
    return {
      specs,
      tokens: {
        input: response.usage?.input_tokens || 0,
        output: response.usage?.output_tokens || 0,
      },
    };
  } catch (err) {
    console.error('[DailyDriverEnrichment] Error researching maintenance specs:', err);
    return { specs: {}, tokens: { input: 0, output: 0 } };
  }
}

/**
 * Research service intervals using Claude
 */
async function researchServiceIntervals(year, make, model) {
  const ai = getAnthropic();
  
  const prompt = `You are an automotive expert. Research and provide service interval recommendations for a ${year} ${make} ${model}.

Return a JSON array of service items with this structure:
[
  {
    "service_name": "Oil Change",
    "service_description": "Replace engine oil and filter with manufacturer-recommended oil",
    "interval_miles": 7500,
    "interval_months": 12,
    "is_critical": true,
    "estimated_dealer_cost_low": 75,
    "estimated_dealer_cost_high": 150,
    "estimated_diy_cost_low": 30,
    "estimated_diy_cost_high": 50
  }
]

Include these common services:
1. Oil Change
2. Tire Rotation
3. Brake Fluid Flush
4. Transmission Service
5. Coolant Flush
6. Air Filter Replacement
7. Cabin Air Filter Replacement
8. Spark Plug Replacement
9. Brake Pad Inspection/Replacement
10. Battery Check

Only return valid JSON array, no explanation. Use realistic intervals and costs for this vehicle.`;

  try {
    const response = await ai.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0]?.text || '[]';
    // Extract JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const intervals = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    
    return {
      intervals,
      tokens: {
        input: response.usage?.input_tokens || 0,
        output: response.usage?.output_tokens || 0,
      },
    };
  } catch (err) {
    console.error('[DailyDriverEnrichment] Error researching service intervals:', err);
    return { intervals: [], tokens: { input: 0, output: 0 } };
  }
}

/**
 * Fetch known issues from NHTSA complaints
 */
async function fetchNHTSAIssues(year, make, model) {
  try {
    // NHTSA complaints API
    const url = `https://api.nhtsa.gov/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('[DailyDriverEnrichment] NHTSA API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    const complaints = data.results || [];
    
    // Group complaints by component and count
    const componentCounts = {};
    complaints.forEach(c => {
      const component = c.components || 'Unknown';
      if (!componentCounts[component]) {
        componentCounts[component] = {
          component,
          count: 0,
          summaries: [],
        };
      }
      componentCounts[component].count++;
      if (componentCounts[component].summaries.length < 3 && c.summary) {
        componentCounts[component].summaries.push(c.summary.substring(0, 200));
      }
    });
    
    // Convert to array and sort by count
    const issues = Object.values(componentCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(item => ({
        title: `${item.component} Issues`,
        kind: 'mechanical',
        severity: item.count > 50 ? 'Major' : item.count > 10 ? 'Minor' : 'Information',
        complaint_count: item.count,
        description: `${item.count} complaints reported to NHTSA for ${item.component.toLowerCase()} issues.`,
        sample_complaints: item.summaries,
        source: 'NHTSA',
      }));
    
    return issues;
  } catch (err) {
    console.error('[DailyDriverEnrichment] Error fetching NHTSA issues:', err);
    return [];
  }
}

/**
 * Generate a garage image using Google Gemini (Nano Banana Pro)
 */
async function generateGarageImage(year, make, model) {
  const googleApiKey = process.env.GOOGLE_AI_API_KEY;
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  
  if (!googleApiKey) {
    console.warn('[DailyDriverEnrichment] GOOGLE_AI_API_KEY not set, skipping image');
    return null;
  }
  
  if (!blobToken) {
    console.warn('[DailyDriverEnrichment] BLOB_READ_WRITE_TOKEN not set, skipping image');
    return null;
  }
  
  // Determine vehicle type for better prompting
  const modelLower = model.toLowerCase();
  let vehicleType = 'vehicle';
  if (modelLower.includes('odyssey') || modelLower.includes('sienna') || modelLower.includes('pacifica') || modelLower.includes('minivan')) {
    vehicleType = 'minivan';
  } else if (modelLower.includes('f-150') || modelLower.includes('f150') || modelLower.includes('silverado') || modelLower.includes('ram') || modelLower.includes('tundra') || modelLower.includes('truck')) {
    vehicleType = 'pickup truck';
  } else if (modelLower.includes('suv') || modelLower.includes('pilot') || modelLower.includes('highlander') || modelLower.includes('explorer') || modelLower.includes('tahoe') || modelLower.includes('4runner')) {
    vehicleType = 'SUV';
  } else if (modelLower.includes('civic') || modelLower.includes('accord') || modelLower.includes('camry') || modelLower.includes('corolla')) {
    vehicleType = 'sedan';
  }
  
  const prompt = `SUBJECT: A pristine ${year} ${make} ${model} (${vehicleType}) in a clean, well-lit modern residential garage.

ENVIRONMENT: Clean, organized home garage with epoxy floor, good overhead LED lighting. The garage looks like a proud owner's space - clean and well-maintained.

COMPOSITION: Front 3/4 angle view of the vehicle. Car fills about 60% of frame. Shot at eye level.

LIGHTING: Bright, even garage lighting. No harsh shadows. The vehicle looks clean and well-cared-for.

STYLE: Clean, professional automotive photography. Sharp focus. Realistic proportions and details for a ${year} ${make} ${model}.

QUALITY: High resolution, photorealistic. The vehicle should look exactly like a real ${year} ${make} ${model}.

EXCLUSIONS: No people, no text, no watermarks, no license plates, no clutter.`;

  try {
    const modelName = 'gemini-2.0-flash-exp-image-generation';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${googleApiKey}`;
    
    const body = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
      }
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DailyDriverEnrichment] Gemini API error:', response.status, errorText);
      return null;
    }
    
    const result = await response.json();
    const candidates = result.candidates || [];
    if (candidates.length === 0) {
      console.warn('[DailyDriverEnrichment] No candidates in Gemini response');
      return null;
    }
    
    const parts = candidates[0].content?.parts || [];
    const imagePart = parts.find(p => p.inlineData);
    
    if (!imagePart) {
      console.warn('[DailyDriverEnrichment] No image in Gemini response');
      return null;
    }
    
    const imageData = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || 'image/png';
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageData, 'base64');
    
    // Generate a unique filename
    const lookupKey = generateLookupKey(year, make, model);
    const filename = `daily-drivers/${lookupKey}/garage.${mimeType === 'image/jpeg' ? 'jpg' : 'png'}`;
    
    // Upload to Vercel Blob
    const blob = await put(filename, imageBuffer, {
      access: 'public',
      contentType: mimeType,
    });
    
    console.log('[DailyDriverEnrichment] Image uploaded:', blob.url);
    return blob.url;
  } catch (err) {
    console.error('[DailyDriverEnrichment] Error generating image:', err);
    return null;
  }
}

/**
 * Main enrichment function
 * 
 * @param {Object} vehicle - Vehicle data { year, make, model, trim? }
 * @param {string} userId - User ID initiating the enrichment
 * @returns {Object} - Enrichment result with data and token usage
 */
export async function enrichDailyDriver(vehicle, userId) {
  const { year, make, model, trim } = vehicle;
  const db = getSupabase();
  const lookupKey = generateLookupKey(year, make, model);
  
  console.log(`[DailyDriverEnrichment] Starting enrichment for ${year} ${make} ${model}`);
  
  // Check for existing enrichment first
  const existing = await getExistingEnrichment(year, make, model);
  if (existing) {
    console.log('[DailyDriverEnrichment] Found existing enrichment, returning cached data');
    return {
      success: true,
      enrichment: existing,
      source: 'cache',
      tokensUsed: 0,
    };
  }
  
  // Create a pending enrichment record
  const { data: pendingRecord, error: insertError } = await db
    .from('daily_driver_enrichments')
    .insert({
      year,
      make,
      model,
      trim,
      enriched_by_user_id: userId,
      status: 'processing',
    })
    .select()
    .single();
  
  if (insertError) {
    // Could be a race condition - check if another request created it
    if (insertError.code === '23505') { // unique violation
      const existing = await getExistingEnrichment(year, make, model);
      if (existing) {
        return {
          success: true,
          enrichment: existing,
          source: 'cache',
          tokensUsed: 0,
        };
      }
    }
    throw new Error(`Failed to create enrichment record: ${insertError.message}`);
  }
  
  const enrichmentId = pendingRecord.id;
  let totalTokens = { input: 0, output: 0 };
  
  try {
    // Run all enrichment tasks in parallel
    const [
      maintenanceResult,
      intervalsResult,
      knownIssues,
      imageUrl,
    ] = await Promise.all([
      researchMaintenanceSpecs(year, make, model),
      researchServiceIntervals(year, make, model),
      fetchNHTSAIssues(year, make, model),
      generateGarageImage(year, make, model),
    ]);
    
    // Aggregate token usage
    totalTokens.input = maintenanceResult.tokens.input + intervalsResult.tokens.input;
    totalTokens.output = maintenanceResult.tokens.output + intervalsResult.tokens.output;
    
    // Update the enrichment record with results
    const { data: updatedRecord, error: updateError } = await db
      .from('daily_driver_enrichments')
      .update({
        maintenance_specs: maintenanceResult.specs,
        service_intervals: intervalsResult.intervals,
        known_issues: knownIssues,
        image_url: imageUrl,
        status: 'completed',
        ai_model_used: 'claude-sonnet-4-20250514',
        ai_tokens_used: totalTokens.input + totalTokens.output,
      })
      .eq('id', enrichmentId)
      .select()
      .single();
    
    if (updateError) {
      throw new Error(`Failed to update enrichment: ${updateError.message}`);
    }
    
    console.log(`[DailyDriverEnrichment] Completed enrichment for ${year} ${make} ${model}`);
    
    return {
      success: true,
      enrichment: updatedRecord,
      source: 'new',
      tokensUsed: totalTokens.input + totalTokens.output,
      tokenBreakdown: totalTokens,
    };
  } catch (err) {
    // Mark the enrichment as failed
    await db
      .from('daily_driver_enrichments')
      .update({
        status: 'failed',
        error_message: err.message,
      })
      .eq('id', enrichmentId);
    
    console.error('[DailyDriverEnrichment] Enrichment failed:', err);
    throw err;
  }
}

/**
 * Link an enrichment to a user's vehicle
 */
export async function linkEnrichmentToVehicle(vehicleId, enrichmentId) {
  const db = getSupabase();
  
  const { error } = await db
    .from('user_vehicles')
    .update({
      enrichment_id: enrichmentId,
      enrichment_status: 'enriched',
    })
    .eq('id', vehicleId);
  
  if (error) {
    console.error('[DailyDriverEnrichment] Error linking enrichment:', error);
    throw error;
  }
  
  return true;
}

/**
 * Get enrichment data for a vehicle (if available)
 */
export async function getVehicleEnrichment(vehicleId) {
  const db = getSupabase();
  
  const { data: vehicle, error } = await db
    .from('user_vehicles')
    .select(`
      id,
      year,
      make,
      model,
      enrichment_id,
      enrichment_status,
      daily_driver_enrichments (
        id,
        maintenance_specs,
        service_intervals,
        known_issues,
        image_url,
        status,
        created_at
      )
    `)
    .eq('id', vehicleId)
    .single();
  
  if (error) {
    console.error('[DailyDriverEnrichment] Error fetching vehicle enrichment:', error);
    return null;
  }
  
  return vehicle;
}

