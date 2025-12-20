/**
 * Journey 1: Car Shopper (Free Tier)
 * 
 * Tests the complete flow:
 * Home → Car Selector → Browse Cars → Car Detail → Save to Garage → AL Chat
 * 
 * Preconditions:
 * - Dev server running
 * - cars table has data
 * - car_fuel_economy, car_safety_data populated
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { apiRequest, assertResponse, assertArrayItems, waitForServer, BASE_URL } from './test-helpers.js';

describe('Journey 1: Car Shopper (Free Tier)', () => {
  let testCarSlug;
  
  before(async () => {
    console.log(`Testing against: ${BASE_URL}`);
    try {
      await waitForServer(10000, 500);
      console.log('Server is ready');
    } catch (err) {
      console.log('Server not available, tests may fail:', err.message);
    }
  });
  
  describe('Step 5: Get Cars List', () => {
    it('GET /api/cars returns cars array', async () => {
      const response = await apiRequest('/api/cars');
      
      assertResponse(response, 200, ['cars']);
      assertArrayItems(response.data.cars, ['id', 'slug', 'name', 'brand'], 10);
      
      // Save a car slug for later tests
      testCarSlug = response.data.cars[0].slug;
      console.log(`Using test car: ${testCarSlug}`);
    });
    
    it('GET /api/cars supports brand filter', async () => {
      const response = await apiRequest('/api/cars?brand=Porsche');
      
      assertResponse(response, 200, ['cars']);
      assert.ok(response.data.cars.length > 0, 'Should have Porsche cars');
      assert.ok(
        response.data.cars.every(c => c.brand === 'Porsche'),
        'All cars should be Porsche'
      );
    });
    
    it('GET /api/cars supports tier filter', async () => {
      const response = await apiRequest('/api/cars?tier=premium');
      
      assertResponse(response, 200, ['cars']);
      assert.ok(response.data.cars.length > 0, 'Should have premium cars');
    });
    
    it('GET /api/cars supports limit', async () => {
      const response = await apiRequest('/api/cars?limit=5');
      
      assertResponse(response, 200, ['cars']);
      assert.ok(response.data.cars.length <= 5, 'Should respect limit');
    });
  });
  
  describe('Step 8: Car Detail - Efficiency', () => {
    it('GET /api/cars/[slug]/efficiency returns fuel data', async () => {
      const response = await apiRequest(`/api/cars/${testCarSlug}/efficiency`);
      
      assertResponse(response, 200, ['efficiency']);
      
      if (response.data.efficiency) {
        const eff = response.data.efficiency;
        assert.ok('city_mpg' in eff || 'combined_mpg' in eff, 'Should have MPG data');
      }
    });
  });
  
  describe('Step 8: Car Detail - Safety', () => {
    it('GET /api/cars/[slug]/safety-ratings returns safety data', async () => {
      const response = await apiRequest(`/api/cars/${testCarSlug}/safety-ratings`);
      
      assertResponse(response, 200, ['safety']);
      
      if (response.data.safety) {
        const safety = response.data.safety;
        // May have NHTSA or IIHS data
        assert.ok(
          'nhtsa_overall_rating' in safety || 'iihs_overall' in safety || 'safety_score' in safety,
          'Should have some safety data'
        );
      }
    });
  });
  
  describe('Step 9: Car Detail - Pricing', () => {
    it('GET /api/cars/[slug]/price-by-year returns pricing data', async () => {
      const response = await apiRequest(`/api/cars/${testCarSlug}/price-by-year`);
      
      assertResponse(response, 200);
      // Price data may be sparse (only 10 cars have it)
      assert.ok(response.data !== null, 'Should return response');
    });
    
    it('GET /api/cars/[slug]/recalls returns recalls array', async () => {
      const response = await apiRequest(`/api/cars/${testCarSlug}/recalls`);
      
      assertResponse(response, 200, ['recalls']);
      assert.ok(Array.isArray(response.data.recalls), 'recalls should be array');
    });
  });
  
  describe('Step 10: Car Detail - Maintenance', () => {
    it('GET /api/cars/[slug]/maintenance returns maintenance specs', async () => {
      const response = await apiRequest(`/api/cars/${testCarSlug}/maintenance`);
      
      assertResponse(response, 200);
      // Should have maintenance object with oil specs
      if (response.data.maintenance) {
        assert.ok(response.data.maintenance, 'Should have maintenance data');
      }
    });
  });
  
  describe('Step 11: Car Detail - Expert Reviews', () => {
    it('GET /api/cars/[slug]/expert-reviews returns videos array', async () => {
      const response = await apiRequest(`/api/cars/${testCarSlug}/expert-reviews`);
      
      assertResponse(response, 200, ['videos']);
      assert.ok(Array.isArray(response.data.videos), 'videos should be array');
    });
  });
  
  describe('Error Handling', () => {
    it('GET /api/cars/[invalid-slug]/efficiency returns 404', async () => {
      const response = await apiRequest('/api/cars/nonexistent-car-slug-12345/efficiency');
      
      // Should return 404 or empty data
      assert.ok(
        response.status === 404 || response.data.efficiency === null,
        'Should handle missing car gracefully'
      );
    });
  });
});

describe('Car Selector Scoring', () => {
  it('Cars have required fields for selector algorithm', async () => {
    const response = await apiRequest('/api/cars?limit=5');
    
    assertResponse(response, 200, ['cars']);
    
    const car = response.data.cars[0];
    // Core fields used by selector
    const requiredFields = ['id', 'slug', 'name', 'brand', 'hp'];
    
    for (const field of requiredFields) {
      assert.ok(field in car, `Cars should have ${field} field`);
    }
    
    // Score fields may be in DB but not returned by list API
    // (Selector fetches full car data separately)
    console.log('Car fields:', Object.keys(car).slice(0, 10).join(', '), '...');
  });
});







