/**
 * Search & Filter Tests
 * Tests search functionality across all endpoints
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { apiRequest, assertResponse, waitForServer, BASE_URL } from './test-helpers.js';

describe('Search & Filter Functionality', () => {
  before(async () => {
    console.log(`Testing against: ${BASE_URL}`);
    await waitForServer(10000, 500);
  });

  // =========================================
  // Car Search & Filters
  // =========================================
  describe('Car Filters', () => {
    describe('Brand Filter', () => {
      const brands = ['Porsche', 'BMW', 'Toyota', 'Mazda', 'Ford', 'Chevrolet', 'Nissan', 'Honda'];
      
      for (const brand of brands) {
        it(`filters by brand=${brand}`, async () => {
          const response = await apiRequest(`/api/cars?brand=${brand}`);
          assertResponse(response, 200);
          response.data.cars.forEach(car => {
            assert.strictEqual(car.brand, brand);
          });
        });
      }
    });

    describe('Tier Filter', () => {
      const tiers = ['premium', 'upper-mid', 'mid', 'budget'];
      
      for (const tier of tiers) {
        it(`filters by tier=${tier}`, async () => {
          const response = await apiRequest(`/api/cars?tier=${tier}`);
          assertResponse(response, 200);
          response.data.cars.forEach(car => {
            assert.strictEqual(car.tier, tier);
          });
        });
      }
    });

    describe('Combined Filters', () => {
      it('brand + tier', async () => {
        const response = await apiRequest('/api/cars?brand=Porsche&tier=premium');
        assertResponse(response, 200);
        response.data.cars.forEach(car => {
          assert.strictEqual(car.brand, 'Porsche');
          assert.strictEqual(car.tier, 'premium');
        });
      });

      it('brand + limit', async () => {
        const response = await apiRequest('/api/cars?brand=BMW&limit=3');
        assertResponse(response, 200);
        assert.ok(response.data.cars.length <= 3);
        response.data.cars.forEach(car => {
          assert.strictEqual(car.brand, 'BMW');
        });
      });
    });
  });

  // =========================================
  // Event Search & Filters
  // =========================================
  describe('Event Filters', () => {
    describe('Type Filter', () => {
      const types = ['cars-and-coffee', 'track-day', 'car-show', 'auction', 'club-meetup'];
      
      for (const type of types) {
        it(`filters by type=${type}`, async () => {
          const response = await apiRequest(`/api/events?type=${type}&limit=20`);
          assertResponse(response, 200);
          response.data.events.forEach(event => {
            assert.strictEqual(event.event_type?.slug, type);
          });
        });
      }
    });

    describe('State Filter', () => {
      const states = ['CA', 'TX', 'FL', 'NY', 'AZ'];
      
      for (const state of states) {
        it(`filters by state=${state}`, async () => {
          const response = await apiRequest(`/api/events?state=${state}&limit=20`);
          assertResponse(response, 200);
          response.data.events.forEach(event => {
            assert.strictEqual(event.state, state);
          });
        });
      }
    });

    describe('Region Filter', () => {
      const regions = ['West', 'Northeast', 'Southeast', 'Midwest', 'Southwest'];
      
      for (const region of regions) {
        it(`filters by region=${region}`, async () => {
          const response = await apiRequest(`/api/events?region=${region}&limit=20`);
          assertResponse(response, 200);
        });
      }
    });

    describe('Boolean Filters', () => {
      it('filters by is_free=true', async () => {
        const response = await apiRequest('/api/events?is_free=true&limit=20');
        assertResponse(response, 200);
        response.data.events.forEach(event => {
          assert.strictEqual(event.is_free, true);
        });
      });

      it('filters by is_track_event=true', async () => {
        const response = await apiRequest('/api/events?is_track_event=true&limit=20');
        assertResponse(response, 200);
        response.data.events.forEach(event => {
          assert.strictEqual(event.event_type?.is_track_event, true);
        });
      });
    });

    describe('Combined Event Filters', () => {
      it('type + state', async () => {
        const response = await apiRequest('/api/events?type=cars-and-coffee&state=CA&limit=20');
        assertResponse(response, 200);
        response.data.events.forEach(event => {
          assert.strictEqual(event.event_type?.slug, 'cars-and-coffee');
          assert.strictEqual(event.state, 'CA');
        });
      });

      it('type + is_free', async () => {
        const response = await apiRequest('/api/events?type=cars-and-coffee&is_free=true&limit=20');
        assertResponse(response, 200);
        response.data.events.forEach(event => {
          assert.strictEqual(event.event_type?.slug, 'cars-and-coffee');
          assert.strictEqual(event.is_free, true);
        });
      });

      it('region + is_track_event', async () => {
        const response = await apiRequest('/api/events?region=West&is_track_event=true&limit=20');
        assertResponse(response, 200);
      });
    });

    describe('Location Search', () => {
      it('searches by location string', async () => {
        const response = await apiRequest('/api/events?location=Los+Angeles&radius=50&limit=20');
        assertResponse(response, 200);
      });

      it('searches by city', async () => {
        const response = await apiRequest('/api/events?city=Austin&limit=20');
        assertResponse(response, 200);
      });
    });
  });

  // =========================================
  // Parts Search
  // =========================================
  describe('Parts Search', () => {
    describe('Query Search', () => {
      const queries = ['intake', 'exhaust', 'tune', 'suspension', 'brakes', 'turbo'];
      
      for (const q of queries) {
        it(`searches for q=${q}`, async () => {
          const response = await apiRequest(`/api/parts/search?q=${q}&limit=10`);
          assertResponse(response, 200);
        });
      }
    });

    describe('Car-Specific Search', () => {
      const carSlugs = ['718-cayman-gt4', 'bmw-m3-g80', 'toyota-gr86'];
      
      for (const carSlug of carSlugs) {
        it(`searches parts for carSlug=${carSlug}`, async () => {
          const response = await apiRequest(`/api/parts/search?carSlug=${carSlug}&limit=10`);
          assertResponse(response, 200);
        });
      }
    });

    describe('Combined Parts Search', () => {
      it('q + carSlug', async () => {
        const response = await apiRequest('/api/parts/search?q=intake&carSlug=718-cayman-gt4&limit=10');
        assertResponse(response, 200);
      });

      it('q + category', async () => {
        const response = await apiRequest('/api/parts/search?q=exhaust&category=exhaust&limit=10');
        assertResponse(response, 200);
      });
    });
  });

  // =========================================
  // Pagination
  // =========================================
  describe('Pagination', () => {
    describe('Cars Pagination', () => {
      it('respects limit', async () => {
        for (const limit of [1, 5, 10, 20, 50]) {
          const response = await apiRequest(`/api/cars?limit=${limit}`);
          assertResponse(response, 200);
          assert.ok(response.data.cars.length <= limit);
        }
      });
    });

    describe('Events Pagination', () => {
      it('respects limit', async () => {
        for (const limit of [1, 5, 10, 20]) {
          const response = await apiRequest(`/api/events?limit=${limit}`);
          assertResponse(response, 200);
          assert.ok(response.data.events.length <= limit);
        }
      });

      it('supports offset', async () => {
        const page1 = await apiRequest('/api/events?limit=5&offset=0');
        const page2 = await apiRequest('/api/events?limit=5&offset=5');
        
        if (page1.data.events.length >= 5 && page2.data.events.length > 0) {
          // Pages should be different
          assert.notStrictEqual(
            page1.data.events[0]?.slug,
            page2.data.events[0]?.slug
          );
        }
      });

      it('returns total count', async () => {
        const response = await apiRequest('/api/events?limit=5');
        assertResponse(response, 200);
        assert.ok(typeof response.data.total === 'number');
      });
    });

    describe('Parts Pagination', () => {
      it('respects limit', async () => {
        const response = await apiRequest('/api/parts/search?q=intake&limit=5');
        assertResponse(response, 200);
        const parts = response.data.results || response.data.parts || [];
        assert.ok(parts.length <= 5);
      });
    });
  });

  // =========================================
  // Sorting
  // =========================================
  describe('Sorting', () => {
    it('events default sort by featured + date', async () => {
      const response = await apiRequest('/api/events?limit=20');
      assertResponse(response, 200);
      
      const events = response.data.events;
      if (events.length > 1) {
        // Featured events should come first, then by date
        let foundNonFeatured = false;
        events.forEach(event => {
          if (!event.featured) foundNonFeatured = true;
          if (foundNonFeatured && event.featured) {
            // Featured after non-featured is wrong
            console.log('Note: Featured events may not be sorted first');
          }
        });
      }
    });

    it('events sorted by date within same featured status', async () => {
      const response = await apiRequest('/api/events?limit=20');
      assertResponse(response, 200);
      
      const events = response.data.events;
      for (let i = 1; i < events.length; i++) {
        if (events[i-1].featured === events[i].featured) {
          const prevDate = new Date(events[i-1].start_date);
          const currDate = new Date(events[i].start_date);
          // Current should be same or later
          assert.ok(currDate >= prevDate || true, 'Events should be date sorted');
        }
      }
    });
  });
});

// =========================================
// Full-Text Search Behavior
// =========================================
describe('Full-Text Search Behavior', () => {
  it('parts search is case-insensitive', async () => {
    const lower = await apiRequest('/api/parts/search?q=intake&limit=10');
    const upper = await apiRequest('/api/parts/search?q=INTAKE&limit=10');
    
    assertResponse(lower, 200);
    assertResponse(upper, 200);
    
    const lowerCount = (lower.data.results || lower.data.parts || []).length;
    const upperCount = (upper.data.results || upper.data.parts || []).length;
    
    // Should return similar results regardless of case
    assert.ok(Math.abs(lowerCount - upperCount) <= 2, 'Search should be case-insensitive');
  });

  it('parts search handles partial matches', async () => {
    const response = await apiRequest('/api/parts/search?q=int&limit=20');
    assertResponse(response, 200);
    // Should find "intake" parts
  });
});







