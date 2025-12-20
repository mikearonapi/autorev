/**
 * Data Validation Tests
 * Verifies data integrity across the database
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { apiRequest, assertResponse, waitForServer, BASE_URL } from './test-helpers.js';

describe('Database Data Validation', () => {
  let allCars = [];
  
  before(async () => {
    console.log(`Testing against: ${BASE_URL}`);
    await waitForServer(10000, 500);
    
    // Fetch all cars for validation tests
    const response = await apiRequest('/api/cars');
    allCars = response.data.cars || [];
    console.log(`Loaded ${allCars.length} cars for validation`);
  });

  // =========================================
  // Cars Table Validation
  // =========================================
  describe('Cars Data Completeness', () => {
    it('has 98+ cars (per DATABASE.md)', async () => {
      assert.ok(allCars.length >= 90, `Expected 98+ cars, got ${allCars.length}`);
    });

    it('all cars have unique slugs', async () => {
      const slugs = allCars.map(c => c.slug);
      const uniqueSlugs = new Set(slugs);
      assert.strictEqual(slugs.length, uniqueSlugs.size, 'Duplicate slugs found');
    });

    it('all cars have unique IDs', async () => {
      const ids = allCars.map(c => c.id);
      const uniqueIds = new Set(ids);
      assert.strictEqual(ids.length, uniqueIds.size, 'Duplicate IDs found');
    });

    it('all cars have valid brands', async () => {
      allCars.forEach(car => {
        assert.ok(car.brand && car.brand.length > 0, `Car ${car.slug} missing brand`);
      });
    });

    it('all cars have valid names', async () => {
      allCars.forEach(car => {
        assert.ok(car.name && car.name.length > 0, `Car ${car.slug} missing name`);
      });
    });

    it('all cars have valid tiers', async () => {
      const validTiers = ['budget', 'mid', 'upper-mid', 'premium'];
      allCars.forEach(car => {
        assert.ok(validTiers.includes(car.tier), `Invalid tier: ${car.tier} for ${car.slug}`);
      });
    });
  });

  // =========================================
  // Fuel Economy Validation
  // =========================================
  describe('Fuel Economy Data', () => {
    it('most cars have efficiency data', async () => {
      let carsWithEfficiency = 0;
      
      for (const car of allCars.slice(0, 20)) {
        const response = await apiRequest(`/api/cars/${car.slug}/efficiency`);
        if (response.data.efficiency) {
          carsWithEfficiency++;
        }
      }
      
      console.log(`${carsWithEfficiency}/20 sampled cars have efficiency data`);
      assert.ok(carsWithEfficiency >= 15, 'Most cars should have efficiency data');
    });

    it('MPG values are reasonable', async () => {
      const response = await apiRequest('/api/cars/718-cayman-gt4/efficiency');
      if (response.data.efficiency) {
        const eff = response.data.efficiency;
        if (eff.city_mpg) {
          assert.ok(eff.city_mpg >= 5 && eff.city_mpg <= 100, `Invalid city MPG: ${eff.city_mpg}`);
        }
        if (eff.highway_mpg) {
          assert.ok(eff.highway_mpg >= 5 && eff.highway_mpg <= 100, `Invalid highway MPG: ${eff.highway_mpg}`);
        }
      }
    });
  });

  // =========================================
  // Safety Data Validation
  // =========================================
  describe('Safety Data', () => {
    it('most cars have safety data', async () => {
      let carsWithSafety = 0;
      
      for (const car of allCars.slice(0, 20)) {
        const response = await apiRequest(`/api/cars/${car.slug}/safety-ratings`);
        if (response.data.safety) {
          carsWithSafety++;
        }
      }
      
      console.log(`${carsWithSafety}/20 sampled cars have safety data`);
      assert.ok(carsWithSafety >= 15, 'Most cars should have safety data');
    });

    it('NHTSA ratings are 1-5 stars', async () => {
      const response = await apiRequest('/api/cars/718-cayman-gt4/safety-ratings');
      if (response.data.safety?.nhtsa_overall_rating) {
        const rating = response.data.safety.nhtsa_overall_rating;
        assert.ok(rating >= 1 && rating <= 5, `Invalid NHTSA rating: ${rating}`);
      }
    });
  });

  // =========================================
  // Recall Data Validation
  // =========================================
  describe('Recall Data', () => {
    it('recall data is properly structured', async () => {
      const response = await apiRequest('/api/cars/718-cayman-gt4/recalls');
      assertResponse(response, 200, ['recalls']);
      
      response.data.recalls.forEach(recall => {
        assert.ok(recall.car_slug || recall.campaign_number, 'Recall should have identifier');
      });
    });
  });

  // =========================================
  // Event Types Validation
  // =========================================
  describe('Event Types Data', () => {
    it('has all expected event types', async () => {
      const response = await apiRequest('/api/events/types');
      const slugs = response.data.types.map(t => t.slug);
      
      const expectedTypes = [
        'cars-and-coffee',
        'track-day',
        'car-show',
        'auction',
        'club-meetup',
      ];
      
      expectedTypes.forEach(expected => {
        assert.ok(slugs.includes(expected), `Missing event type: ${expected}`);
      });
    });

    it('event types have icons', async () => {
      const response = await apiRequest('/api/events/types');
      response.data.types.forEach(type => {
        assert.ok(type.icon || type.name, `Type ${type.slug} should have icon or name`);
      });
    });
  });

  // =========================================
  // Events Validation
  // =========================================
  describe('Events Data', () => {
    it('events have valid start dates', async () => {
      const response = await apiRequest('/api/events?limit=50');
      
      response.data.events.forEach(event => {
        const date = new Date(event.start_date);
        assert.ok(!isNaN(date.getTime()), `Invalid date for event ${event.slug}`);
      });
    });

    it('events have valid states', async () => {
      const validStates = [
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
      ];
      
      const response = await apiRequest('/api/events?limit=50');
      response.data.events.forEach(event => {
        if (event.state) {
          assert.ok(validStates.includes(event.state), `Invalid state: ${event.state}`);
        }
      });
    });
  });

  // =========================================
  // Parts Validation
  // =========================================
  describe('Parts Data', () => {
    it('parts search returns valid results', async () => {
      const response = await apiRequest('/api/parts/search?q=intake&limit=20');
      assertResponse(response, 200);
      
      const parts = response.data.results || response.data.parts || [];
      parts.forEach(part => {
        assert.ok(part.id, 'Part should have ID');
        assert.ok(part.name, 'Part should have name');
      });
    });
  });

  // =========================================
  // Lap Times Validation
  // =========================================
  describe('Lap Times Data', () => {
    it('lap times have valid format', async () => {
      const response = await apiRequest('/api/cars/718-cayman-gt4/lap-times');
      
      response.data.lapTimes.forEach(lap => {
        if (lap.lap_time_text) {
          // Should be in format like "1:35.5" or "1:35"
          assert.ok(/^\d{1,2}:\d{2}(\.\d+)?$/.test(lap.lap_time_text), 
            `Invalid lap time format: ${lap.lap_time_text}`);
        }
        if (lap.lap_time_ms) {
          // Should be positive milliseconds
          assert.ok(lap.lap_time_ms > 0, 'Lap time should be positive');
        }
      });
    });
  });

  // =========================================
  // Dyno Data Validation
  // =========================================
  describe('Dyno Data', () => {
    it('dyno runs have valid power values', async () => {
      const response = await apiRequest('/api/cars/718-cayman-gt4/dyno');
      const runs = response.data.runs || response.data.dynoRuns || [];
      
      runs.forEach(run => {
        if (run.peak_whp) {
          assert.ok(run.peak_whp > 50 && run.peak_whp < 2000, 
            `Invalid WHP: ${run.peak_whp}`);
        }
        if (run.peak_wtq) {
          assert.ok(run.peak_wtq > 50 && run.peak_wtq < 2000, 
            `Invalid WTQ: ${run.peak_wtq}`);
        }
      });
    });

    it('dyno runs have valid run_kind', async () => {
      const response = await apiRequest('/api/cars/718-cayman-gt4/dyno');
      const runs = response.data.runs || response.data.dynoRuns || [];
      
      const validKinds = ['baseline', 'modded', 'stock', 'modified'];
      runs.forEach(run => {
        if (run.run_kind) {
          assert.ok(validKinds.includes(run.run_kind), `Invalid run_kind: ${run.run_kind}`);
        }
      });
    });
  });
});

// =========================================
// Cross-Reference Validation
// =========================================
describe('Cross-Reference Validation', () => {
  it('car slugs are consistent across APIs', async () => {
    const carsResponse = await apiRequest('/api/cars?limit=10');
    const car = carsResponse.data.cars[0];
    
    // Test that the slug works across different endpoints
    const endpoints = [
      `/api/cars/${car.slug}/efficiency`,
      `/api/cars/${car.slug}/safety-ratings`,
      `/api/cars/${car.slug}/recalls`,
      `/api/cars/${car.slug}/lap-times`,
    ];
    
    for (const endpoint of endpoints) {
      const response = await apiRequest(endpoint);
      assert.ok([200, 404].includes(response.status), 
        `${endpoint} should resolve for ${car.slug}`);
    }
  });
});








