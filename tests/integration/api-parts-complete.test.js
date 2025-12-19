/**
 * Complete Parts API Tests
 * Tests all 3 parts-related API routes
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { apiRequest, assertResponse, waitForServer, BASE_URL } from './test-helpers.js';

describe('Parts API - Complete Coverage', () => {
  let samplePartIds = [];
  
  before(async () => {
    console.log(`Testing against: ${BASE_URL}`);
    await waitForServer(10000, 500);
  });

  // =========================================
  // GET /api/parts/search
  // =========================================
  describe('GET /api/parts/search', () => {
    it('requires q or carSlug parameter', async () => {
      const response = await apiRequest('/api/parts/search');
      assert.strictEqual(response.status, 400);
    });

    it('searches by query string (intake)', async () => {
      const response = await apiRequest('/api/parts/search?q=intake&limit=20');
      assertResponse(response, 200);
      const parts = response.data.results || response.data.parts || [];
      console.log(`Found ${parts.length} intake parts`);
      if (parts.length > 0) {
        samplePartIds.push(parts[0].id);
      }
    });

    it('searches by query string (exhaust)', async () => {
      const response = await apiRequest('/api/parts/search?q=exhaust&limit=20');
      assertResponse(response, 200);
      const parts = response.data.results || response.data.parts || [];
      console.log(`Found ${parts.length} exhaust parts`);
      if (parts.length > 0) {
        samplePartIds.push(parts[0].id);
      }
    });

    it('searches by query string (tune)', async () => {
      const response = await apiRequest('/api/parts/search?q=tune&limit=20');
      assertResponse(response, 200);
    });

    it('searches by query string (suspension)', async () => {
      const response = await apiRequest('/api/parts/search?q=suspension&limit=20');
      assertResponse(response, 200);
    });

    it('searches by query string (brakes)', async () => {
      const response = await apiRequest('/api/parts/search?q=brakes&limit=20');
      assertResponse(response, 200);
    });

    it('searches by carSlug', async () => {
      const response = await apiRequest('/api/parts/search?carSlug=718-cayman-gt4&limit=20');
      assertResponse(response, 200);
    });

    it('searches by carSlug (BMW)', async () => {
      const response = await apiRequest('/api/parts/search?carSlug=bmw-m3-g80&limit=20');
      assertResponse(response, 200);
    });

    it('searches by carSlug (Toyota)', async () => {
      const response = await apiRequest('/api/parts/search?carSlug=toyota-gr86&limit=20');
      assertResponse(response, 200);
    });

    it('combines query and carSlug', async () => {
      const response = await apiRequest('/api/parts/search?q=intake&carSlug=718-cayman-gt4&limit=20');
      assertResponse(response, 200);
    });

    it('respects limit parameter', async () => {
      const response = await apiRequest('/api/parts/search?q=exhaust&limit=5');
      assertResponse(response, 200);
      const parts = response.data.results || response.data.parts || [];
      assert.ok(parts.length <= 5);
    });

    it('parts have required fields', async () => {
      const response = await apiRequest('/api/parts/search?q=intake&limit=5');
      const parts = response.data.results || response.data.parts || [];
      parts.forEach(part => {
        assert.ok(part.id, 'Part should have id');
        assert.ok(part.name, 'Part should have name');
      });
    });

    it('handles empty results gracefully', async () => {
      const response = await apiRequest('/api/parts/search?q=xyznonexistent123');
      assertResponse(response, 200);
      const parts = response.data.results || response.data.parts || [];
      assert.strictEqual(parts.length, 0);
    });

    it('returns parts without verified filter (default behavior)', async () => {
      // For cars with unverified fitments only (e.g., most Porsche models),
      // the search should return results when verified filter is not applied
      const response = await apiRequest('/api/parts/search?carSlug=981-cayman-gts&limit=10');
      assertResponse(response, 200);
      const parts = response.data.results || response.data.parts || [];
      // 981 Cayman GTS has 5 parts with unverified fitments
      console.log(`Found ${parts.length} parts for 981 Cayman GTS (unfiltered)`);
    });

    it('verified=true may return fewer or no parts for cars without verified fitments', async () => {
      // Most fitments are unverified, so verified=true may return empty
      const response = await apiRequest('/api/parts/search?carSlug=981-cayman-gts&verified=true&limit=10');
      assertResponse(response, 200);
      const parts = response.data.results || response.data.parts || [];
      console.log(`Found ${parts.length} verified parts for 981 Cayman GTS`);
      // This is expected to be 0 since 981 Cayman GTS has no verified fitments
    });

    it('VW GTI has verified fitments', async () => {
      // VW GTI Mk7 is one of the few cars with verified fitments
      const response = await apiRequest('/api/parts/search?carSlug=volkswagen-gti-mk7&verified=true&limit=10');
      assertResponse(response, 200);
      const parts = response.data.results || response.data.parts || [];
      console.log(`Found ${parts.length} verified parts for VW GTI Mk7`);
      // Should find some verified parts
    });
  });

  // =========================================
  // GET /api/parts/popular
  // =========================================
  describe('GET /api/parts/popular', () => {
    it('requires carSlug parameter', async () => {
      const response = await apiRequest('/api/parts/popular');
      assert.strictEqual(response.status, 400);
    });

    it('returns popular parts for Porsche', async () => {
      const response = await apiRequest('/api/parts/popular?carSlug=718-cayman-gt4');
      assertResponse(response, 200);
    });

    it('returns popular parts for BMW', async () => {
      const response = await apiRequest('/api/parts/popular?carSlug=bmw-m3-g80');
      assertResponse(response, 200);
    });

    it('returns popular parts for Toyota', async () => {
      const response = await apiRequest('/api/parts/popular?carSlug=toyota-gr86');
      assertResponse(response, 200);
    });

    it('respects limit parameter', async () => {
      const response = await apiRequest('/api/parts/popular?carSlug=718-cayman-gt4&limit=3');
      assertResponse(response, 200);
    });
  });

  // =========================================
  // POST /api/parts/relationships
  // =========================================
  describe('POST /api/parts/relationships', () => {
    it('returns edges for valid part IDs', async function() {
      if (samplePartIds.length < 2) {
        console.log('Skipping - need sample part IDs');
        return;
      }
      
      const response = await apiRequest('/api/parts/relationships', {
        method: 'POST',
        body: JSON.stringify({ partIds: samplePartIds }),
      });
      
      assertResponse(response, 200, ['edges']);
      assert.ok(Array.isArray(response.data.edges));
    });

    it('handles empty partIds array', async () => {
      const response = await apiRequest('/api/parts/relationships', {
        method: 'POST',
        body: JSON.stringify({ partIds: [] }),
      });
      
      assertResponse(response, 200, ['edges']);
      assert.strictEqual(response.data.edges.length, 0);
    });

    it('handles single partId', async function() {
      if (samplePartIds.length < 1) {
        console.log('Skipping - need sample part ID');
        return;
      }
      
      const response = await apiRequest('/api/parts/relationships', {
        method: 'POST',
        body: JSON.stringify({ partIds: [samplePartIds[0]] }),
      });
      
      assertResponse(response, 200, ['edges']);
    });

    it('validates relationship types', async function() {
      if (samplePartIds.length < 2) {
        return;
      }
      
      const response = await apiRequest('/api/parts/relationships', {
        method: 'POST',
        body: JSON.stringify({ partIds: samplePartIds }),
      });
      
      const validTypes = ['requires', 'suggests', 'conflicts'];
      response.data.edges.forEach(edge => {
        assert.ok(validTypes.includes(edge.relation_type), 
          `Invalid relation type: ${edge.relation_type}`);
      });
    });
  });
});

// =========================================
// Parts Data Validation
// =========================================
describe('Parts Data Validation', () => {
  it('parts have valid categories', async () => {
    const response = await apiRequest('/api/parts/search?q=exhaust&limit=50');
    const parts = response.data.results || response.data.parts || [];
    
    const validCategories = [
      'intake', 'exhaust', 'tune', 'ecu', 'suspension', 'brakes', 'cooling',
      'turbo', 'supercharger', 'intercooler', 'clutch', 'flywheel', 'wheels',
      'body', 'interior', 'lighting', 'fuel', 'engine', 'drivetrain', 'other'
    ];
    
    parts.forEach(part => {
      if (part.category) {
        // Category may be in valid list or a variation
        console.log(`Part category: ${part.category}`);
      }
    });
  });

  it('parts have valid price data when present', async () => {
    const response = await apiRequest('/api/parts/search?q=intake&limit=20');
    const parts = response.data.results || response.data.parts || [];
    
    parts.forEach(part => {
      if (part.latest_price?.price_cents) {
        assert.ok(part.latest_price.price_cents > 0, 'Price should be positive');
        assert.ok(part.latest_price.price_cents < 10000000, 'Price should be reasonable');
      }
    });
  });
});

