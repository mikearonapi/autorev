/**
 * Fuel Economy API Route
 * 
 * GET /api/cars/[slug]/fuel-economy
 * 
 * Fetches EPA fuel economy data including:
 * - Official MPG ratings (city/highway/combined)
 * - User-reported real-world MPG
 * - Emissions data
 * - Annual fuel cost estimates
 * 
 * This is a FREE government API with no rate limits or authentication.
 * 
 * @module app/api/cars/[slug]/fuel-economy
 */

import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { carData } from '@/data/cars';
import * as epaService from '@/lib/epaFuelEconomyService';

/**
 * GET /api/cars/[slug]/fuel-economy
 * Fetch EPA fuel economy data for a car
 */
export async function GET(request, { params }) {
  const { slug } = params;
  
  if (!slug) {
    return NextResponse.json(
      { error: 'Slug is required' },
      { status: 400 }
    );
  }
  
  try {
    // Find the car in our database
    let car = carData.find(c => c.slug === slug);
    
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .eq('slug', slug)
          .single();
        
        if (!error && data) {
          car = { ...car, ...data };
        }
      } catch (err) {
        console.warn('[Fuel Economy API] Supabase fetch failed:', err.message);
      }
    }
    
    if (!car) {
      return NextResponse.json(
        { error: 'Car not found', slug },
        { status: 404 }
      );
    }
    
    // Fetch comprehensive fuel data
    const fuelData = await epaService.getComprehensiveFuelData(car);
    
    if (!fuelData) {
      return NextResponse.json({
        success: true,
        slug,
        car: {
          name: car.name,
          years: car.years,
        },
        fuelEconomy: null,
        message: 'EPA fuel economy data not available for this vehicle',
      });
    }
    
    // Get current fuel prices for context
    const fuelPrices = await epaService.getCurrentFuelPrices();
    
    // Format the response
    const response = {
      success: true,
      slug,
      car: {
        name: car.name,
        years: car.years,
      },
      fuelEconomy: {
        // Official EPA ratings
        epa: fuelData.epa ? {
          cityMpg: fuelData.epa.cityMpg,
          highwayMpg: fuelData.epa.highwayMpg,
          combinedMpg: fuelData.epa.combinedMpg,
          fuelType: fuelData.epa.fuelType,
          annualFuelCost: fuelData.epa.annualFuelCost,
          co2Emissions: fuelData.epa.co2Emissions,
          ghgScore: fuelData.epa.ghgScore,
          // Vehicle details from EPA
          transmission: fuelData.epa.transmission,
          cylinders: fuelData.epa.cylinders,
          displacement: fuelData.epa.displacement,
          turbo: fuelData.epa.turbo,
          supercharged: fuelData.epa.supercharged,
          vehicleClass: fuelData.epa.vehicleClass,
          // Electric vehicle data (if applicable)
          isElectric: fuelData.epa.isElectric,
          isHybrid: fuelData.epa.isHybrid,
          evRange: fuelData.epa.evRange,
        } : null,
        
        // Real-world user-reported data
        userReported: fuelData.userReported ? {
          averageMpg: fuelData.userReported.averageMpg,
          cityMpg: fuelData.userReported.cityMpg,
          highwayMpg: fuelData.userReported.highwayMpg,
          sampleSize: fuelData.userReported.userCount,
        } : null,
        
        // Comparison if we have both
        comparison: fuelData.comparison,
        
        // Cost estimates
        costs: {
          annualFuelCost: fuelData.annualCostEstimate,
          fuelPrices: fuelPrices ? {
            regular: fuelPrices.regular,
            premium: fuelPrices.premium,
            diesel: fuelPrices.diesel,
            lastUpdated: fuelPrices.lastUpdated,
          } : null,
          // 5-year estimate
          fiveYearFuelCost: fuelData.annualCostEstimate 
            ? fuelData.annualCostEstimate * 5 
            : null,
        },
      },
      source: 'EPA (fueleconomy.gov)',
      fetchedAt: new Date().toISOString(),
    };
    
    return NextResponse.json(response);
  } catch (err) {
    console.error('[Fuel Economy API] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch fuel economy data', message: err.message },
      { status: 500 }
    );
  }
}














