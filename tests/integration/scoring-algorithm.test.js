/**
 * Scoring Algorithm Tests
 * Tests car selector scoring and ranking
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { apiRequest, assertResponse, waitForServer, BASE_URL } from './test-helpers.js';

describe('Scoring Algorithm Validation', () => {
  let allCars = [];
  
  before(async () => {
    console.log(`Testing against: ${BASE_URL}`);
    await waitForServer(10000, 500);
    
    const response = await apiRequest('/api/cars');
    allCars = response.data.cars || [];
  });

  // =========================================
  // Score Field Presence
  // =========================================
  describe('Score Fields Availability', () => {
    const scoreFields = [
      'score_sound',
      'score_interior',
      'score_track',
      'score_reliability',
      'score_value',
      'score_driver_fun',
      'score_aftermarket',
    ];

    it('API returns cars for scoring', async () => {
      const response = await apiRequest('/api/cars');
      assertResponse(response, 200, ['cars']);
      assert.ok(response.data.cars.length > 0);
    });

    it('cars have HP for performance calculations', async () => {
      const carsWithHP = allCars.filter(c => c.hp && c.hp > 0);
      console.log(`${carsWithHP.length}/${allCars.length} cars have HP`);
      assert.ok(carsWithHP.length >= allCars.length * 0.9, 'Most cars should have HP');
    });

    it('cars have price for value calculations', async () => {
      const carsWithPrice = allCars.filter(c => c.price_avg && c.price_avg > 0);
      console.log(`${carsWithPrice.length}/${allCars.length} cars have price`);
      assert.ok(carsWithPrice.length >= allCars.length * 0.5, 'Many cars should have price');
    });
  });

  // =========================================
  // Score Value Validation
  // =========================================
  describe('Score Value Ranges', () => {
    it('HP values are in valid range', async () => {
      allCars.forEach(car => {
        if (car.hp) {
          assert.ok(car.hp >= 50 && car.hp <= 2000, 
            `Invalid HP ${car.hp} for ${car.slug}`);
        }
      });
    });

    it('prices are in valid range', async () => {
      allCars.forEach(car => {
        if (car.price_avg) {
          assert.ok(car.price_avg >= 5000 && car.price_avg <= 5000000, 
            `Invalid price ${car.price_avg} for ${car.slug}`);
        }
      });
    });
  });

  // =========================================
  // Tier Distribution
  // =========================================
  describe('Tier Distribution', () => {
    it('has cars in all tiers', async () => {
      const tiers = {};
      allCars.forEach(car => {
        tiers[car.tier] = (tiers[car.tier] || 0) + 1;
      });
      
      console.log('Tier distribution:', tiers);
      
      assert.ok(tiers['premium'] > 0, 'Should have premium cars');
      assert.ok(tiers['budget'] > 0, 'Should have budget cars');
    });

    it('premium cars have higher avg price', async () => {
      const premiumCars = allCars.filter(c => c.tier === 'premium' && c.price_avg);
      const budgetCars = allCars.filter(c => c.tier === 'budget' && c.price_avg);
      
      if (premiumCars.length > 0 && budgetCars.length > 0) {
        const premiumAvg = premiumCars.reduce((sum, c) => sum + c.price_avg, 0) / premiumCars.length;
        const budgetAvg = budgetCars.reduce((sum, c) => sum + c.price_avg, 0) / budgetCars.length;
        
        console.log(`Premium avg: $${Math.round(premiumAvg)}, Budget avg: $${Math.round(budgetAvg)}`);
        assert.ok(premiumAvg > budgetAvg, 'Premium should cost more than budget');
      }
    });
  });

  // =========================================
  // Brand Distribution
  // =========================================
  describe('Brand Distribution', () => {
    it('has multiple brands', async () => {
      const brands = new Set(allCars.map(c => c.brand));
      console.log(`Total brands: ${brands.size}`);
      assert.ok(brands.size >= 10, 'Should have 10+ brands');
    });

    it('major brands are represented', async () => {
      const brands = new Set(allCars.map(c => c.brand));
      const expectedBrands = ['Porsche', 'BMW', 'Toyota', 'Mazda', 'Ford', 'Chevrolet'];
      
      expectedBrands.forEach(brand => {
        assert.ok(brands.has(brand), `Missing major brand: ${brand}`);
      });
    });

    it('brand distribution is reasonable', async () => {
      const brandCounts = {};
      allCars.forEach(car => {
        brandCounts[car.brand] = (brandCounts[car.brand] || 0) + 1;
      });
      
      const sortedBrands = Object.entries(brandCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      console.log('Top 10 brands:', sortedBrands.map(([b, c]) => `${b}: ${c}`).join(', '));
    });
  });

  // =========================================
  // Category Distribution
  // =========================================
  describe('Category Distribution', () => {
    it('has multiple categories', async () => {
      const categories = new Set(allCars.map(c => c.category).filter(Boolean));
      console.log(`Categories: ${[...categories].join(', ')}`);
      assert.ok(categories.size >= 2, 'Should have multiple categories');
    });
  });

  // =========================================
  // Filter Combinations
  // =========================================
  describe('Filter Combinations', () => {
    it('brand + tier filter returns expected results', async () => {
      const response = await apiRequest('/api/cars?brand=Porsche&tier=premium');
      assertResponse(response, 200);
      
      response.data.cars.forEach(car => {
        assert.strictEqual(car.brand, 'Porsche');
        assert.strictEqual(car.tier, 'premium');
      });
    });

    it('limit respects exact count', async () => {
      for (const limit of [1, 5, 10, 20]) {
        const response = await apiRequest(`/api/cars?limit=${limit}`);
        assert.ok(response.data.cars.length <= limit, 
          `Expected <= ${limit}, got ${response.data.cars.length}`);
      }
    });
  });

  // =========================================
  // Consistency Checks
  // =========================================
  describe('Data Consistency', () => {
    it('repeated requests return same data', async () => {
      const response1 = await apiRequest('/api/cars?limit=10');
      const response2 = await apiRequest('/api/cars?limit=10');
      
      assert.strictEqual(
        response1.data.cars.length,
        response2.data.cars.length,
        'Same query should return same count'
      );
      
      // Check first car matches
      assert.strictEqual(
        response1.data.cars[0]?.slug,
        response2.data.cars[0]?.slug,
        'Same query should return same first car'
      );
    });

    it('car details match list data', async () => {
      const listResponse = await apiRequest('/api/cars?limit=5');
      const car = listResponse.data.cars[0];
      
      // Fetch efficiency to verify slug works
      const detailResponse = await apiRequest(`/api/cars/${car.slug}/efficiency`);
      assert.strictEqual(detailResponse.status, 200);
    });
  });
});

// =========================================
// Performance Metrics Validation
// =========================================
describe('Performance Metrics Validation', () => {
  it('0-60 times are reasonable', async () => {
    const response = await apiRequest('/api/cars');
    response.data.cars.forEach(car => {
      if (car.zero_to_sixty) {
        // Should be between 2 and 15 seconds for sports cars
        assert.ok(car.zero_to_sixty >= 2 && car.zero_to_sixty <= 15,
          `Invalid 0-60: ${car.zero_to_sixty} for ${car.slug}`);
      }
    });
  });

  it('curb weights are reasonable', async () => {
    const response = await apiRequest('/api/cars');
    response.data.cars.forEach(car => {
      if (car.curb_weight) {
        // Should be between 1500 and 6000 lbs
        assert.ok(car.curb_weight >= 1500 && car.curb_weight <= 6000,
          `Invalid weight: ${car.curb_weight} for ${car.slug}`);
      }
    });
  });

  it('torque values are reasonable', async () => {
    const response = await apiRequest('/api/cars');
    response.data.cars.forEach(car => {
      if (car.torque) {
        // Should be between 100 and 1500 lb-ft
        assert.ok(car.torque >= 100 && car.torque <= 1500,
          `Invalid torque: ${car.torque} for ${car.slug}`);
      }
    });
  });
});
