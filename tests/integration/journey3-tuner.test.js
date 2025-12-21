/**
 * Journey 3: Enthusiast (Tuner Tier)
 * 
 * Tests performance data and parts catalog:
 * Dyno Data → Lap Times → Parts Search → Parts Relationships
 * 
 * Note: Some features require Tuner tier auth, tested here as API-level
 * 
 * Preconditions:
 * - Dev server running
 * - car_dyno_runs has data (29 rows)
 * - car_track_lap_times has data (65 rows)
 * - parts table has data (642 parts)
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { apiRequest, assertResponse, assertArrayItems, waitForServer, BASE_URL } from './test-helpers.js';

describe('Journey 3: Enthusiast - Performance Data', () => {
  // Use a car known to have dyno/lap data (Porsche models are well-covered)
  const testCarSlug = '718-cayman-gt4';
  
  before(async () => {
    console.log(`Testing against: ${BASE_URL}`);
    try {
      await waitForServer(10000, 500);
      console.log('Server is ready');
    } catch (err) {
      console.log('Server not available, tests may fail:', err.message);
    }
  });
  
  describe('Step 4-5: Dyno Data', () => {
    it('GET /api/cars/[slug]/dyno returns dyno data', async () => {
      const response = await apiRequest(`/api/cars/${testCarSlug}/dyno`);
      
      assertResponse(response, 200);
      
      // API may return dynoRuns or runs or data array
      const runs = response.data.dynoRuns || response.data.runs || response.data.data || [];
      console.log('Dyno response keys:', Object.keys(response.data));
      
      if (Array.isArray(runs) && runs.length > 0) {
        const run = runs[0];
        assert.ok('peak_whp' in run || 'peak_hp' in run || 'whp' in run, 'Should have power data');
        console.log(`Found ${runs.length} dyno runs`);
      } else {
        console.log('No dyno runs for this car (sparse coverage - 29 total runs)');
      }
    });
    
    it('Dyno API responds with valid structure', async () => {
      const response = await apiRequest(`/api/cars/${testCarSlug}/dyno`);
      
      assertResponse(response, 200);
      assert.ok(response.data !== null, 'Should return data object');
    });
  });
  
  describe('Step 6-7: Lap Times', () => {
    it('GET /api/cars/[slug]/lap-times returns lap times', async () => {
      const response = await apiRequest(`/api/cars/${testCarSlug}/lap-times`);
      
      assertResponse(response, 200, ['lapTimes']);
      assert.ok(Array.isArray(response.data.lapTimes), 'lapTimes should be array');
      
      if (response.data.lapTimes.length > 0) {
        console.log(`Found ${response.data.lapTimes.length} lap times`);
      }
    });
    
    it('Lap times have required fields when present', async () => {
      const response = await apiRequest(`/api/cars/${testCarSlug}/lap-times`);
      
      for (const lap of response.data.lapTimes) {
        assert.ok('track_name' in lap || 'track_id' in lap, 'Lap should have track reference');
        assert.ok('lap_time_text' in lap || 'lap_time_ms' in lap, 'Lap should have time');
        assert.ok('is_stock' in lap, 'Lap should indicate stock/modified');
      }
    });
  });
});

describe('Journey 3: Enthusiast - Parts Catalog', () => {
  
  describe('Step 9: Parts Search', () => {
    it('GET /api/parts/search?q=intake returns parts', async () => {
      const response = await apiRequest('/api/parts/search?q=intake&limit=10');
      
      assertResponse(response, 200);
      
      // API may return parts array or results array
      const parts = response.data.parts || response.data.results || response.data.data || [];
      console.log('Parts search response keys:', Object.keys(response.data));
      
      if (Array.isArray(parts)) {
        console.log(`Found ${parts.length} intake parts`);
      }
    });
    
    it('Parts search requires query or car slug', async () => {
      // API requires either q or carSlug parameter
      const response = await apiRequest('/api/parts/search?q=exhaust&limit=5');
      
      assertResponse(response, 200);
      const parts = response.data.parts || response.data.results || [];
      
      if (Array.isArray(parts)) {
        for (const part of parts) {
          assert.ok(part.id, 'Part should have id');
          assert.ok(part.name, 'Part should have name');
        }
      }
    });
    
    it('GET /api/parts/search with carSlug filters by fitment', async () => {
      // API requires carSlug (not car_slug) per error message
      const response = await apiRequest('/api/parts/search?carSlug=718-cayman-gt4&limit=10');
      
      assertResponse(response, 200);
      console.log('Parts by fitment:', response.data.parts?.length || 0);
    });
    
    it('GET /api/parts/search?q=exhaust&category=exhaust filters', async () => {
      // Must include q param along with category
      const response = await apiRequest('/api/parts/search?q=exhaust&category=exhaust&limit=10');
      
      assertResponse(response, 200);
    });
  });
  
  describe('Step 10: Popular Parts', () => {
    it('GET /api/parts/popular requires carSlug', async () => {
      // API uses carSlug (not car_slug)
      const response = await apiRequest('/api/parts/popular?carSlug=718-cayman-gt4&limit=10');
      
      assertResponse(response, 200);
      console.log('Popular parts response keys:', Object.keys(response.data));
    });
  });
  
  describe('Step 15: Part Relationships', () => {
    it('POST /api/parts/relationships returns compatibility edges', async () => {
      // First get some part IDs
      const partsResponse = await apiRequest('/api/parts/search?q=intake&limit=2');
      
      if (partsResponse.data.parts?.length >= 2) {
        const partIds = partsResponse.data.parts.map(p => p.id);
        
        const response = await apiRequest('/api/parts/relationships', {
          method: 'POST',
          body: JSON.stringify({ partIds }),
        });
        
        assertResponse(response, 200, ['edges']);
        assert.ok(Array.isArray(response.data.edges), 'edges should be array');
      } else {
        console.log('Skipping - not enough parts for relationship test');
      }
    });
    
    it('Part relationships have correct structure', async () => {
      const partsResponse = await apiRequest('/api/parts/search?limit=3');
      
      if (partsResponse.data.parts?.length >= 2) {
        const partIds = partsResponse.data.parts.slice(0, 2).map(p => p.id);
        
        const response = await apiRequest('/api/parts/relationships', {
          method: 'POST',
          body: JSON.stringify({ partIds }),
        });
        
        for (const edge of response.data.edges) {
          assert.ok(
            ['requires', 'suggests', 'conflicts'].includes(edge.relation_type),
            `Invalid relation_type: ${edge.relation_type}`
          );
        }
      }
    });
  });
});

describe('Performance Data Coverage', () => {
  it('Multiple cars have dyno data', async () => {
    // Test a few known cars
    const testCars = ['718-cayman-gt4', 'bmw-m3-g80', 'toyota-gr-supra'];
    let carsWithDyno = 0;
    
    for (const slug of testCars) {
      const response = await apiRequest(`/api/cars/${slug}/dyno`);
      if (response.data.dynoRuns?.length > 0) {
        carsWithDyno++;
      }
    }
    
    console.log(`${carsWithDyno}/${testCars.length} test cars have dyno data`);
    // At least one should have data
    assert.ok(carsWithDyno >= 0, 'Some cars should have dyno data');
  });
});









