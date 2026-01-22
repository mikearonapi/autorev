/**
 * Performance Calculator V2 API
 * 
 * FUTURE PERFORMANCE MODEL - Not yet in production.
 * This endpoint provides access to the hybrid physics + calibration calculator.
 * 
 * Endpoints:
 * - POST /api/v2/performance - Calculate performance for a build
 * - GET /api/v2/performance/compare - Compare V1 vs V2 calculations
 */

import { NextResponse } from 'next/server';
import { errors } from '@/lib/apiErrors';
import { createClient } from '@supabase/supabase-js';
import { calculateBuildPerformance, calculateSmartHpGainV2 } from '@/lib/performanceCalculatorV2';
import { getUpgradeByKey } from '@/lib/upgrades';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * POST /api/v2/performance
 * 
 * Calculate performance metrics for a car with selected upgrades
 * using the new hybrid physics + calibration model.
 * 
 * Request body:
 * {
 *   "carSlug": "volkswagen-gti-mk7",  // or "carId": "uuid"
 *   "upgrades": ["stage1-tune", "intake", "downpipe"],
 *   "includePhysicsDetails": false  // Optional: include calculation details
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "stockHp": 228,
 *     "projectedHp": 315,
 *     "totalGain": 87,
 *     "confidence": 0.75,
 *     "confidenceLabel": "High confidence",
 *     "tier": 2,
 *     "breakdown": [...],
 *     "metrics": {
 *       "zeroToSixty": { "stock": 5.9, "projected": 5.1, "improvement": 0.8 },
 *       "quarterMile": { "stock": 14.2, "projected": 13.5, "improvement": 0.7 }
 *     }
 *   },
 *   "model": "v2-hybrid",
 *   "timestamp": "2026-01-13T..."
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { carSlug, carId, upgrades, includePhysicsDetails = false } = body;
    
    // Validate input
    if (!carSlug && !carId) {
      return NextResponse.json(
        { success: false, error: 'carSlug or carId is required' },
        { status: 400 }
      );
    }
    
    if (!upgrades || !Array.isArray(upgrades)) {
      return NextResponse.json(
        { success: false, error: 'upgrades array is required' },
        { status: 400 }
      );
    }
    
    // Fetch car data
    let query = supabase.from('cars').select('*');
    if (carId) {
      query = query.eq('id', carId);
    } else {
      query = query.eq('slug', carSlug);
    }
    
    const { data: car, error: carError } = await query.single();
    
    if (carError || !car) {
      return NextResponse.json(
        { success: false, error: 'Car not found' },
        { status: 404 }
      );
    }
    
    // Calculate performance using V2 model
    const result = await calculateBuildPerformance(car, upgrades, {
      getUpgradeByKey,
    });
    
    // Calculate derived metrics (0-60, quarter mile improvements)
    const metrics = calculateDerivedMetrics(car, result);
    
    // Build response
    const response = {
      success: true,
      data: {
        stockHp: result.stockHp,
        projectedHp: result.projectedHp,
        totalGain: result.totalGain,
        confidence: result.confidence,
        confidenceLabel: result.confidenceLabel,
        tier: result.tier,
        breakdown: result.breakdown,
        metrics,
      },
      model: 'v2-hybrid',
      timestamp: new Date().toISOString(),
    };
    
    // Include physics details if requested
    if (includePhysicsDetails) {
      response.data.physicsDetails = {
        categoryGains: result.categoryGains,
        rawGain: result.rawGain,
        adjustmentAmount: result.adjustmentAmount,
      };
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Performance V2 API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v2/performance/compare
 * 
 * Compare V1 (legacy) vs V2 (hybrid) calculations for a car.
 * Useful for validating the new model before switching.
 * 
 * Query params:
 * - carSlug: Car slug (required)
 * - upgrades: Comma-separated upgrade keys (required)
 * 
 * Example: /api/v2/performance/compare?carSlug=volkswagen-gti-mk7&upgrades=stage1-tune,intake
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const carSlug = searchParams.get('carSlug');
    const upgradesParam = searchParams.get('upgrades');
    
    if (!carSlug || !upgradesParam) {
      return NextResponse.json(
        { success: false, error: 'carSlug and upgrades query params required' },
        { status: 400 }
      );
    }
    
    const upgrades = upgradesParam.split(',').map(u => u.trim());
    
    // Fetch car
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('*')
      .eq('slug', carSlug)
      .single();
    
    if (carError || !car) {
      return NextResponse.json(
        { success: false, error: 'Car not found' },
        { status: 404 }
      );
    }
    
    // Import legacy calculator dynamically to avoid circular deps
    const { calculateSmartHpGain } = await import('@/lib/upgradeCalculator');
    
    // Calculate with both models
    const legacyResult = calculateSmartHpGain(car, upgrades);
    const v2Result = await calculateBuildPerformance(car, upgrades, {
      getUpgradeByKey,
    });
    
    // Build comparison
    const comparison = {
      car: {
        name: car.name,
        slug: car.slug,
        stockHp: car.hp,
        engine: car.engine,
      },
      upgrades,
      legacy: {
        projectedHp: legacyResult.projectedHp,
        totalGain: legacyResult.totalGain,
        source: 'Hardcoded values',
      },
      v2: {
        projectedHp: v2Result.projectedHp,
        totalGain: v2Result.totalGain,
        confidence: v2Result.confidence,
        confidenceLabel: v2Result.confidenceLabel,
        tier: v2Result.tier,
        source: getTierSource(v2Result.tier),
      },
      difference: {
        hpDelta: v2Result.projectedHp - legacyResult.projectedHp,
        gainDelta: v2Result.totalGain - legacyResult.totalGain,
      },
    };
    
    return NextResponse.json({
      success: true,
      data: comparison,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Performance compare API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function calculateDerivedMetrics(car, result) {
  const metrics = {};
  
  // 0-60 improvement
  if (car.zeroToSixty) {
    const hpPercentGain = result.totalGain / (car.hp || 400);
    const improvement = car.zeroToSixty * hpPercentGain * 0.4;
    
    metrics.zeroToSixty = {
      stock: car.zeroToSixty,
      projected: Math.max(2.0, car.zeroToSixty - improvement),
      improvement: Math.round(improvement * 100) / 100,
    };
  }
  
  // Quarter mile improvement (rough estimate)
  if (car.quarterMile) {
    const hpPercentGain = result.totalGain / (car.hp || 400);
    const improvement = car.quarterMile * hpPercentGain * 0.15;
    
    metrics.quarterMile = {
      stock: car.quarterMile,
      projected: Math.max(9.0, car.quarterMile - improvement),
      improvement: Math.round(improvement * 100) / 100,
    };
  }
  
  // Power to weight
  if (car.curbWeight && result.projectedHp) {
    metrics.powerToWeight = {
      stock: car.hp ? Math.round(car.hp / (car.curbWeight / 1000) * 10) / 10 : null,
      projected: Math.round(result.projectedHp / (car.curbWeight / 1000) * 10) / 10,
    };
  }
  
  return metrics;
}

function getTierSource(tier) {
  switch (tier) {
    case 1: return 'Verified dyno data';
    case 2: return 'Engine family calibration';
    case 3: return 'Physics model';
    case 4: return 'Generic estimate';
    default: return 'Unknown';
  }
}
