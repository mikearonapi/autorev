/**
 * Car Pricing API Route
 * 
 * GET /api/cars/[slug]/pricing
 * 
 * Fetches market pricing data from multiple sources:
 * - Bring a Trailer (auction results)
 * - Hagerty (collector valuations)
 * - Cars.com (current listings)
 * 
 * @module app/api/cars/[slug]/pricing
 */

import { NextResponse } from 'next/server';
import { errors } from '@/lib/apiErrors';
import { fetchCarBySlug } from '@/lib/carsClient';
import * as batScraper from '@/lib/scrapers/bringATrailerScraper';
import * as hagertyScraper from '@/lib/scrapers/hagertyScraper';
import * as carsComScraper from '@/lib/scrapers/carsComScraper';
import { withErrorLogging } from '@/lib/serverErrorLogger';

/**
 * GET /api/cars/[slug]/pricing
 * Fetch market pricing data for a car
 */
async function handleGet(request, { params }) {
  const { slug } = params;
  
  if (!slug) {
    return NextResponse.json(
      { error: 'Slug is required' },
      { status: 400 }
    );
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source'); // Optional: bat, hagerty, carscom
    
    // Find the car in our database via carsClient
    const car = await fetchCarBySlug(slug);
    
    if (!car) {
      return NextResponse.json(
        { error: 'Car not found', slug },
        { status: 404 }
      );
    }
    
    const pricing = {
      car: {
        slug: car.slug,
        name: car.name,
        priceAvg: car.priceAvg || car.price_avg,
        priceRange: car.priceRange || car.price_range,
      },
      sources: {},
      consensus: null,
    };
    
    // Fetch from specified source or all sources
    const fetchPromises = [];
    
    if (!source || source === 'bat') {
      fetchPromises.push(
        batScraper.matchCarToBaTData(car).then(data => {
          if (data && data.sampleSize > 0) {
            pricing.sources.bringATrailer = {
              averagePrice: data.averagePrice,
              medianPrice: data.medianPrice,
              minPrice: data.minPrice,
              maxPrice: data.maxPrice,
              sampleSize: data.sampleSize,
              sellThroughRate: data.sellThroughRate,
              recentSales: data.recentSales?.slice(0, 5),
              source: 'auction',
              note: 'Based on recent BaT auction results',
            };
          }
        }).catch(err => {
          console.warn('[Pricing API] BaT fetch failed:', err.message);
        })
      );
    }
    
    if (!source || source === 'hagerty') {
      fetchPromises.push(
        hagertyScraper.matchCarToHagertyValuation(car).then(data => {
          if (data && data.values) {
            pricing.sources.hagerty = {
              values: data.values,
              trend: data.trend,
              trendPercent: data.trendPercent,
              url: data.url,
              source: 'valuation',
              note: 'Hagerty condition-based valuations (Good = #3 condition)',
            };
          }
        }).catch(err => {
          console.warn('[Pricing API] Hagerty fetch failed:', err.message);
        })
      );
    }
    
    if (!source || source === 'carscom') {
      fetchPromises.push(
        carsComScraper.matchCarToMarketData(car).then(data => {
          if (data && data.listingCount > 0) {
            pricing.sources.carsCom = {
              averagePrice: data.averagePrice,
              medianPrice: data.medianPrice,
              minPrice: data.minPrice,
              maxPrice: data.maxPrice,
              listingCount: data.listingCount,
              averageMileage: data.averageMileage,
              priceByMileage: data.priceByMileage,
              source: 'listings',
              note: 'Based on current for-sale listings',
            };
          }
        }).catch(err => {
          console.warn('[Pricing API] Cars.com fetch failed:', err.message);
        })
      );
    }
    
    await Promise.all(fetchPromises);
    
    // Calculate consensus pricing
    const prices = [];
    
    if (pricing.sources.bringATrailer?.averagePrice) {
      prices.push({
        source: 'BaT',
        price: pricing.sources.bringATrailer.averagePrice,
        weight: 1.2, // Auction data is very reliable for enthusiast cars
      });
    }
    
    if (pricing.sources.hagerty?.values?.good) {
      prices.push({
        source: 'Hagerty',
        price: pricing.sources.hagerty.values.good,
        weight: 1.0,
      });
    }
    
    if (pricing.sources.carsCom?.averagePrice) {
      prices.push({
        source: 'Cars.com',
        price: pricing.sources.carsCom.averagePrice,
        weight: 0.8, // Asking prices tend to be higher than selling prices
      });
    }
    
    if (prices.length > 0) {
      const weightedSum = prices.reduce((sum, p) => sum + p.price * p.weight, 0);
      const weightSum = prices.reduce((sum, p) => sum + p.weight, 0);
      const consensusPrice = Math.round(weightedSum / weightSum);
      
      pricing.consensus = {
        price: consensusPrice,
        sourcesUsed: prices.length,
        range: {
          low: Math.min(...prices.map(p => p.price)),
          high: Math.max(...prices.map(p => p.price)),
        },
        comparedToListed: car.priceAvg ? {
          difference: consensusPrice - car.priceAvg,
          differencePercent: Math.round(((consensusPrice - car.priceAvg) / car.priceAvg) * 100),
        } : null,
      };
    }
    
    return NextResponse.json({
      success: true,
      slug,
      pricing,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Pricing API] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch pricing data' },
      { status: 500 }
    );
  }
}

export const GET = withErrorLogging(handleGet, { route: 'cars/[slug]/pricing', feature: 'browse-cars' });















