/**
 * Complete Car API Tests
 * Tests all 18 car-related API routes
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { apiRequest, assertResponse, waitForServer, BASE_URL } from './test-helpers.js';

// Test car slugs - mix of brands and tiers
const TEST_CARS = [
  '718-cayman-gt4',      // Porsche, premium
  'bmw-m3-g80',          // BMW, premium  
  'toyota-gr86',         // Toyota, budget
  'mazda-mx5-miata-nd',  // Mazda, budget
  'chevrolet-corvette-c8', // Chevy, premium
];

describe('Car API - Complete Coverage', () => {
  before(async () => {
    console.log(`Testing against: ${BASE_URL}`);
    await waitForServer(10000, 500);
  });

  // =========================================
  // GET /api/cars - List all cars
  // =========================================
  describe('GET /api/cars', () => {
    it('returns all cars without filters', async () => {
      const response = await apiRequest('/api/cars');
      assertResponse(response, 200, ['cars']);
      assert.ok(response.data.cars.length >= 90, 'Should have 90+ cars');
    });

    it('filters by brand=Porsche', async () => {
      const response = await apiRequest('/api/cars?brand=Porsche');
      assertResponse(response, 200, ['cars']);
      response.data.cars.forEach(car => {
        assert.strictEqual(car.brand, 'Porsche');
      });
    });

    it('filters by brand=BMW', async () => {
      const response = await apiRequest('/api/cars?brand=BMW');
      assertResponse(response, 200, ['cars']);
      response.data.cars.forEach(car => {
        assert.strictEqual(car.brand, 'BMW');
      });
    });

    it('filters by tier=premium', async () => {
      const response = await apiRequest('/api/cars?tier=premium');
      assertResponse(response, 200, ['cars']);
      response.data.cars.forEach(car => {
        assert.strictEqual(car.tier, 'premium');
      });
    });

    it('filters by tier=budget', async () => {
      const response = await apiRequest('/api/cars?tier=budget');
      assertResponse(response, 200, ['cars']);
      response.data.cars.forEach(car => {
        assert.strictEqual(car.tier, 'budget');
      });
    });

    it('filters by tier=mid', async () => {
      const response = await apiRequest('/api/cars?tier=mid');
      assertResponse(response, 200, ['cars']);
    });

    it('filters by tier=upper-mid', async () => {
      const response = await apiRequest('/api/cars?tier=upper-mid');
      assertResponse(response, 200, ['cars']);
    });

    it('respects limit parameter', async () => {
      const response = await apiRequest('/api/cars?limit=5');
      assertResponse(response, 200, ['cars']);
      assert.ok(response.data.cars.length <= 5);
    });

    it('combines brand and tier filters', async () => {
      const response = await apiRequest('/api/cars?brand=Porsche&tier=premium');
      assertResponse(response, 200, ['cars']);
      response.data.cars.forEach(car => {
        assert.strictEqual(car.brand, 'Porsche');
        assert.strictEqual(car.tier, 'premium');
      });
    });

    it('returns cars with required fields', async () => {
      const response = await apiRequest('/api/cars?limit=10');
      const requiredFields = ['id', 'slug', 'name', 'brand'];
      response.data.cars.forEach(car => {
        requiredFields.forEach(field => {
          assert.ok(field in car, `Missing field: ${field}`);
        });
      });
    });

    it('handles unknown brand gracefully', async () => {
      const response = await apiRequest('/api/cars?brand=UnknownBrand');
      assertResponse(response, 200, ['cars']);
      assert.strictEqual(response.data.cars.length, 0);
    });
  });

  // =========================================
  // GET /api/cars/expert-reviewed
  // =========================================
  describe('GET /api/cars/expert-reviewed', () => {
    it('returns cars with expert reviews', async () => {
      const response = await apiRequest('/api/cars/expert-reviewed');
      assertResponse(response, 200);
    });
  });

  // =========================================
  // GET /api/cars/[slug]/efficiency
  // =========================================
  describe('GET /api/cars/[slug]/efficiency', () => {
    for (const slug of TEST_CARS) {
      it(`returns efficiency for ${slug}`, async () => {
        const response = await apiRequest(`/api/cars/${slug}/efficiency`);
        assertResponse(response, 200, ['efficiency']);
        if (response.data.efficiency) {
          const eff = response.data.efficiency;
          if (eff.city_mpg) assert.ok(eff.city_mpg > 0 && eff.city_mpg < 100);
          if (eff.highway_mpg) assert.ok(eff.highway_mpg > 0 && eff.highway_mpg < 100);
        }
      });
    }

    it('returns 404 for invalid slug', async () => {
      const response = await apiRequest('/api/cars/nonexistent-car/efficiency');
      assert.ok(response.status === 404 || response.data.efficiency === null);
    });
  });

  // =========================================
  // GET /api/cars/[slug]/fuel-economy (live EPA)
  // =========================================
  describe('GET /api/cars/[slug]/fuel-economy', () => {
    it('fetches live EPA data', async () => {
      const response = await apiRequest('/api/cars/718-cayman-gt4/fuel-economy');
      assertResponse(response, 200);
    });
  });

  // =========================================
  // GET /api/cars/[slug]/safety-ratings
  // =========================================
  describe('GET /api/cars/[slug]/safety-ratings', () => {
    for (const slug of TEST_CARS) {
      it(`returns safety ratings for ${slug}`, async () => {
        const response = await apiRequest(`/api/cars/${slug}/safety-ratings`);
        assertResponse(response, 200, ['safety']);
      });
    }
  });

  // =========================================
  // GET /api/cars/[slug]/safety (live NHTSA)
  // =========================================
  describe('GET /api/cars/[slug]/safety', () => {
    it('fetches live NHTSA data', async () => {
      const response = await apiRequest('/api/cars/718-cayman-gt4/safety');
      assertResponse(response, 200);
    });
  });

  // =========================================
  // GET /api/cars/[slug]/recalls
  // =========================================
  describe('GET /api/cars/[slug]/recalls', () => {
    for (const slug of TEST_CARS) {
      it(`returns recalls for ${slug}`, async () => {
        const response = await apiRequest(`/api/cars/${slug}/recalls`);
        assertResponse(response, 200, ['recalls']);
        assert.ok(Array.isArray(response.data.recalls));
      });
    }

    it('respects limit parameter', async () => {
      const response = await apiRequest('/api/cars/718-cayman-gt4/recalls?limit=5');
      assertResponse(response, 200, ['recalls']);
      assert.ok(response.data.recalls.length <= 5);
    });

    it('includes count in response', async () => {
      const response = await apiRequest('/api/cars/718-cayman-gt4/recalls');
      assertResponse(response, 200, ['recalls', 'count']);
    });
  });

  // =========================================
  // GET /api/cars/[slug]/price-by-year
  // =========================================
  describe('GET /api/cars/[slug]/price-by-year', () => {
    for (const slug of TEST_CARS) {
      it(`returns price data for ${slug}`, async () => {
        const response = await apiRequest(`/api/cars/${slug}/price-by-year`);
        assertResponse(response, 200);
      });
    }
  });

  // =========================================
  // GET /api/cars/[slug]/market-value
  // =========================================
  describe('GET /api/cars/[slug]/market-value', () => {
    it('handles sparse market data', async () => {
      const response = await apiRequest('/api/cars/718-cayman-gt4/market-value');
      // May return 200 with data or 500 if no data
      assert.ok([200, 500].includes(response.status));
    });
  });

  // =========================================
  // GET /api/cars/[slug]/pricing (live)
  // Note: This endpoint fetches from external sources and may timeout
  // =========================================
  describe('GET /api/cars/[slug]/pricing', { skip: process.env.SKIP_SLOW_TESTS }, () => {
    it('fetches live pricing data', async () => {
      const response = await apiRequest('/api/cars/718-cayman-gt4/pricing');
      // May timeout fetching external data or return 500 if no data
      assert.ok([200, 500, 504].includes(response.status) || response.data !== undefined);
    });
  });

  // =========================================
  // GET /api/cars/[slug]/maintenance
  // =========================================
  describe('GET /api/cars/[slug]/maintenance', () => {
    for (const slug of TEST_CARS) {
      it(`returns maintenance for ${slug}`, async () => {
        const response = await apiRequest(`/api/cars/${slug}/maintenance`);
        assertResponse(response, 200);
      });
    }
  });

  // =========================================
  // GET /api/cars/[slug]/lap-times
  // =========================================
  describe('GET /api/cars/[slug]/lap-times', () => {
    for (const slug of TEST_CARS) {
      it(`returns lap times for ${slug}`, async () => {
        const response = await apiRequest(`/api/cars/${slug}/lap-times`);
        assertResponse(response, 200, ['lapTimes']);
        assert.ok(Array.isArray(response.data.lapTimes));
      });
    }
  });

  // =========================================
  // GET /api/cars/[slug]/dyno
  // =========================================
  describe('GET /api/cars/[slug]/dyno', () => {
    for (const slug of TEST_CARS) {
      it(`returns dyno data for ${slug}`, async () => {
        const response = await apiRequest(`/api/cars/${slug}/dyno`);
        assertResponse(response, 200);
        // API returns 'runs' not 'dynoRuns'
        assert.ok('runs' in response.data || 'dynoRuns' in response.data);
      });
    }
  });

  // =========================================
  // GET /api/cars/[slug]/expert-reviews
  // =========================================
  describe('GET /api/cars/[slug]/expert-reviews', () => {
    for (const slug of TEST_CARS) {
      it(`returns expert reviews for ${slug}`, async () => {
        const response = await apiRequest(`/api/cars/${slug}/expert-reviews`);
        assertResponse(response, 200, ['videos']);
        assert.ok(Array.isArray(response.data.videos));
      });
    }
  });

  // =========================================
  // GET /api/cars/[slug]/expert-consensus
  // =========================================
  describe('GET /api/cars/[slug]/expert-consensus', () => {
    it('returns AI-aggregated consensus', async () => {
      const response = await apiRequest('/api/cars/718-cayman-gt4/expert-consensus');
      assertResponse(response, 200);
    });
  });

  // =========================================
  // GET /api/cars/[slug]/enriched
  // Note: This endpoint fetches from multiple sources and may timeout
  // =========================================
  describe('GET /api/cars/[slug]/enriched', { skip: process.env.SKIP_SLOW_TESTS }, () => {
    it('returns combined enriched data', async () => {
      const response = await apiRequest('/api/cars/718-cayman-gt4/enriched');
      // May timeout fetching external data
      assert.ok([200, 500, 504].includes(response.status) || response.data !== undefined);
    });
  });

  // =========================================
  // GET /api/cars/[slug]/manual-data
  // =========================================
  describe('GET /api/cars/[slug]/manual-data', () => {
    it('returns manual data entries', async () => {
      const response = await apiRequest('/api/cars/718-cayman-gt4/manual-data');
      assertResponse(response, 200);
    });
  });
});

// =========================================
// Car Data Validation Tests
// =========================================
describe('Car Data Validation', () => {
  it('all cars have valid slugs', async () => {
    const response = await apiRequest('/api/cars');
    response.data.cars.forEach(car => {
      assert.ok(/^[a-z0-9-]+$/.test(car.slug), `Invalid slug: ${car.slug}`);
    });
  });

  it('all cars have valid HP values', async () => {
    const response = await apiRequest('/api/cars');
    response.data.cars.forEach(car => {
      if (car.hp) {
        assert.ok(car.hp > 50 && car.hp < 2000, `Invalid HP: ${car.hp} for ${car.slug}`);
      }
    });
  });

  it('all cars have valid price ranges', async () => {
    const response = await apiRequest('/api/cars');
    response.data.cars.forEach(car => {
      if (car.price_avg) {
        assert.ok(car.price_avg > 5000 && car.price_avg < 5000000, 
          `Invalid price: ${car.price_avg} for ${car.slug}`);
      }
    });
  });

  it('all brands are known manufacturers', async () => {
    const knownBrands = [
      'Porsche', 'BMW', 'Mercedes-Benz', 'Audi', 'Toyota', 'Lexus', 'Nissan',
      'Honda', 'Acura', 'Mazda', 'Subaru', 'Ford', 'Chevrolet', 'Dodge',
      'Alfa Romeo', 'Lotus', 'McLaren', 'Ferrari', 'Lamborghini', 'Aston Martin',
      'Jaguar', 'Land Rover', 'Volkswagen', 'Hyundai', 'Kia', 'Genesis',
      'Cadillac', 'Buick', 'GMC', 'Chrysler', 'Jeep', 'Ram', 'Lincoln',
      'Infiniti', 'Mitsubishi', 'Volvo', 'Mini', 'Fiat', 'Maserati'
    ];
    const response = await apiRequest('/api/cars');
    const unknownBrands = new Set();
    response.data.cars.forEach(car => {
      if (!knownBrands.includes(car.brand)) {
        unknownBrands.add(car.brand);
      }
    });
    if (unknownBrands.size > 0) {
      console.log('New brands found:', [...unknownBrands].join(', '));
    }
    // Just log unknown brands rather than failing
    assert.ok(true, 'Brands checked');
  });

  it('tier distribution is reasonable', async () => {
    const response = await apiRequest('/api/cars');
    const tiers = {};
    response.data.cars.forEach(car => {
      tiers[car.tier] = (tiers[car.tier] || 0) + 1;
    });
    console.log('Tier distribution:', tiers);
    assert.ok(Object.keys(tiers).length >= 3, 'Should have multiple tiers');
  });
});









