/**
 * AL Part Recommendations API Route
 *
 * Returns part recommendations for a specific car.
 * Used by the Parts page to show top recommendations in each part tile.
 *
 * Priority:
 * 1. AL-researched recommendations (from al_part_recommendations table)
 * 2. Fallback: Popular parts from our database (from part_fitments + parts)
 *
 * Query params:
 * - upgrade_key: (optional) Filter by specific upgrade type (e.g., "cold-air-intake")
 * - upgrade_keys: (optional) Comma-separated list of upgrade types
 * - limit: (optional) Max recommendations per upgrade type (default: 3)
 *
 * Response includes:
 * - Part details (brand, name, price, product_url)
 * - Recommendation rank (1 = best)
 * - Source: 'al_recommendation' or 'database'
 */

import { NextResponse } from 'next/server';

import { resolveCarId } from '@/lib/carResolver';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * Transform database row to API response format
 */
function transformRecommendation(row) {
  // Use manufacturer_name if available (new schema), fall back to brand_name (legacy)
  const manufacturerName = row.parts?.manufacturer_name || row.parts?.brand_name || null;
  
  return {
    id: row.id,
    rank: row.rank,
    upgradeKey: row.upgrade_key,
    conversationId: row.conversation_id || null,
    createdAt: row.created_at,
    source: row.source || 'database', // 'al_recommendation' or 'database'

    // Part details (joined from parts table)
    partId: row.part_id,
    // Manufacturer info (new schema - who makes the part)
    manufacturerName: manufacturerName,
    manufacturerUrl: row.parts?.manufacturer_url || null,
    // brandName kept for backward compatibility, but now points to manufacturer
    brandName: manufacturerName,
    name: row.parts?.name || null,
    partNumber: row.parts?.part_number || null,
    category: row.parts?.category || null,
    qualityTier: row.parts?.quality_tier || null,
    description: row.parts?.description || null,

    // Pricing (from latest snapshot) - this is VENDOR/RETAILER info
    priceCents: row.latest_price?.price_cents || null,
    price: row.latest_price?.price_cents
      ? row.latest_price.price_cents / 100
      : null,
    vendorName: row.latest_price?.vendor_name || null, // Who SELLS the part
    productUrl: row.latest_price?.product_url || null, // Where to BUY
    currency: row.latest_price?.currency || 'USD',

    // Fitment info (if available)
    fitmentVerified: row.fitment?.verified || false,
    fitmentConfidence: row.fitment?.confidence || null,
    requiresTune: row.fitment?.requires_tune || false,
    installDifficulty: row.fitment?.install_difficulty || null,
    estimatedLaborHours: row.fitment?.estimated_labor_hours || null,
  };
}

/**
 * Map upgrade keys to part categories
 */
const UPGRADE_TO_CATEGORY = {
  'cold-air-intake': 'intake',
  'intake': 'intake',
  'exhaust-catback': 'exhaust',
  'exhaust-headers': 'exhaust',
  'exhaust': 'exhaust',
  'downpipe': 'exhaust',
  'tune': 'tune',
  'ecu-tune': 'tune',
  'coilovers': 'suspension',
  'coilovers-street': 'suspension',
  'coilovers-track': 'suspension',
  'lowering-springs': 'suspension',
  'suspension': 'suspension',
  'brakes': 'brakes',
  'big-brake-kit': 'brakes',
  'turbo-upgrade': 'forced_induction',
  'supercharger': 'forced_induction',
  'intercooler': 'cooling',
  'wheels': 'wheels_tires',
};

async function handleGet(request, { params }) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);

  // Query params
  const upgradeKey = searchParams.get('upgrade_key');
  const upgradeKeysParam = searchParams.get('upgrade_keys');
  const limitParam = searchParams.get('limit');
  const limit = Math.min(parseInt(limitParam) || 3, 10); // Max 10 per type

  if (!slug) {
    return NextResponse.json({ error: 'Car slug is required' }, { status: 400 });
  }

  // Check if Supabase is configured
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({
      success: true,
      data: {
        carSlug: slug,
        recommendations: {},
      },
      message: 'Database not configured',
    });
  }

  // Parse upgrade_keys if provided
  const upgradeKeys = upgradeKeysParam
    ? upgradeKeysParam.split(',').map((k) => k.trim()).filter(Boolean)
    : upgradeKey
      ? [upgradeKey]
      : null;

  try {
    // Resolve car_id from slug
    const carId = await resolveCarId(slug);
    if (!carId) {
      return NextResponse.json({
        success: true,
        data: {
          carSlug: slug,
          recommendations: {},
        },
        message: 'Car not found',
      });
    }

    // =================================================================
    // STEP 1: Try to get AL recommendations first
    // =================================================================
    let query = supabase
      .from('al_part_recommendations')
      .select(`
        id,
        car_id,
        upgrade_key,
        part_id,
        rank,
        conversation_id,
        source,
        created_at,
        parts (
          id,
          brand_name,
          manufacturer_name,
          manufacturer_url,
          name,
          part_number,
          category,
          quality_tier,
          description
        )
      `)
      .eq('car_id', carId)
      .order('rank', { ascending: true });

    // Filter by upgrade_keys if provided
    if (upgradeKeys && upgradeKeys.length > 0) {
      query = query.in('upgrade_key', upgradeKeys);
    }

    const { data: alRecommendations, error: recError } = await query;

    if (recError) {
      console.error('[Recommendations API] AL recommendations error:', recError);
      // Don't fail - fall through to database fallback
    }

    // =================================================================
    // STEP 2: For upgrade types without AL recs, query existing parts
    // =================================================================
    const alRecsByUpgrade = {};
    for (const rec of alRecommendations || []) {
      if (!alRecsByUpgrade[rec.upgrade_key]) {
        alRecsByUpgrade[rec.upgrade_key] = [];
      }
      alRecsByUpgrade[rec.upgrade_key].push(rec);
    }

    // DISABLED: Category-based fallback was causing cross-contamination
    // (e.g., catback exhaust showing under downpipe because both are 'exhaust' category)
    // Now we only show AL recommendations - no fallback to generic parts
    // Users can click "AL's top picks" button to get live research for missing categories
    const fallbackParts = {};
    
    // Legacy fallback code disabled - keeping for reference but not executing
    const FALLBACK_DISABLED = true;
    if (!FALLBACK_DISABLED && false) {
      // Find upgrade types that need fallback
      const upgradeTypesNeedingFallback = upgradeKeys
        ? upgradeKeys.filter((key) => !alRecsByUpgrade[key] || alRecsByUpgrade[key].length === 0)
        : [];

      // Query existing parts as fallback
      if (upgradeTypesNeedingFallback.length > 0) {
        // Map upgrade keys to categories
        const categories = [...new Set(
          upgradeTypesNeedingFallback
            .map((key) => UPGRADE_TO_CATEGORY[key] || key)
            .filter(Boolean)
        )];

        if (categories.length > 0) {
          // Query parts that fit this car in the needed categories
          const { data: fitmentParts, error: fitmentError } = await supabase
            .from('part_fitments')
            .select(`
              part_id,
              verified,
              confidence,
              requires_tune,
              install_difficulty,
              estimated_labor_hours,
              parts (
                id,
                brand_name,
                manufacturer_name,
                manufacturer_url,
                name,
                part_number,
                category,
                quality_tier,
                description
              )
            `)
            .eq('car_id', carId)
            .order('confidence', { ascending: false })
            .order('verified', { ascending: false })
            .limit(limit * categories.length * 2); // Get extra to filter by category

          if (!fitmentError && fitmentParts) {
            // Group by category, then map back to upgrade keys
            for (const fit of fitmentParts) {
              if (!fit.parts) continue;
              const category = fit.parts.category;
              
              // Find which upgrade keys this category maps to
              for (const upgradeKeyToCheck of upgradeTypesNeedingFallback) {
                const expectedCategory = UPGRADE_TO_CATEGORY[upgradeKeyToCheck] || upgradeKeyToCheck;
                if (category === expectedCategory) {
                  if (!fallbackParts[upgradeKeyToCheck]) {
                    fallbackParts[upgradeKeyToCheck] = [];
                  }
                  if (fallbackParts[upgradeKeyToCheck].length < limit) {
                  fallbackParts[upgradeKeyToCheck].push({
                    id: `fallback-${fit.part_id}`,
                    part_id: fit.part_id,
                    upgrade_key: upgradeKeyToCheck,
                    rank: fallbackParts[upgradeKeyToCheck].length + 1,
                    source: 'database',
                    parts: fit.parts,
                    fitment: {
                      verified: fit.verified,
                      confidence: fit.confidence,
                      requires_tune: fit.requires_tune,
                      install_difficulty: fit.install_difficulty,
                      estimated_labor_hours: fit.estimated_labor_hours,
                    },
                  });
                }
              }
            }
          }
        }
      }
    }
    } // End of FALLBACK_DISABLED block

    // =================================================================
    // STEP 3: Merge AL recs with fallback parts
    // =================================================================
    const allRecommendations = [
      ...(alRecommendations || []),
      ...Object.values(fallbackParts).flat(),
    ];

    if (allRecommendations.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          carSlug: slug,
          recommendations: {},
        },
        message: 'No recommendations available',
      });
    }

    // Get part IDs for pricing lookups
    const partIds = [...new Set(allRecommendations.map((r) => r.part_id))];

    // Fetch latest pricing for each part
    const { data: pricingData } = await supabase
      .from('part_pricing_snapshots')
      .select('part_id, price_cents, vendor_name, product_url, currency, recorded_at')
      .in('part_id', partIds)
      .order('recorded_at', { ascending: false });

    // Create a map of latest price per part
    const latestPriceByPart = {};
    for (const price of pricingData || []) {
      if (!latestPriceByPart[price.part_id]) {
        latestPriceByPart[price.part_id] = price;
      }
    }

    // Fetch fitment info for AL recs (fallback already has it)
    const alPartIds = (alRecommendations || []).map((r) => r.part_id);
    const fitmentByPart = {};
    
    if (alPartIds.length > 0) {
      const { data: fitmentData } = await supabase
        .from('part_fitments')
        .select('part_id, verified, confidence, requires_tune, install_difficulty, estimated_labor_hours')
        .eq('car_id', carId)
        .in('part_id', alPartIds);

      for (const fit of fitmentData || []) {
        fitmentByPart[fit.part_id] = fit;
      }
    }

    // Transform and enrich recommendations
    const enrichedRecs = allRecommendations.map((rec) => ({
      ...rec,
      latest_price: latestPriceByPart[rec.part_id] || null,
      fitment: rec.fitment || fitmentByPart[rec.part_id] || null,
    }));

    // Group by upgrade_key and apply limit
    const groupedByUpgrade = {};
    for (const rec of enrichedRecs) {
      const key = rec.upgrade_key;
      if (!groupedByUpgrade[key]) {
        groupedByUpgrade[key] = [];
      }
      // Apply limit per upgrade type
      if (groupedByUpgrade[key].length < limit) {
        groupedByUpgrade[key].push(transformRecommendation(rec));
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        carSlug: slug,
        carId: carId,
        recommendations: groupedByUpgrade,
        totalCount: enrichedRecs.length,
        limit: limit,
      },
    });
  } catch (err) {
    console.error('[Recommendations API] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

export const GET = withErrorLogging(handleGet, {
  route: 'cars/[slug]/recommendations',
  feature: 'parts',
});
