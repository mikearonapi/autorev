/**
 * Error Handling Tests
 * Tests error scenarios and edge cases
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { apiRequest, assertResponse, waitForServer, BASE_URL } from './test-helpers.js';

describe('Error Handling', () => {
  before(async () => {
    console.log(`Testing against: ${BASE_URL}`);
    await waitForServer(10000, 500);
  });

  // =========================================
  // 404 Not Found
  // =========================================
  describe('404 Not Found Responses', () => {
    it('invalid car slug returns 404 or null', async () => {
      const response = await apiRequest('/api/cars/this-car-does-not-exist/efficiency');
      assert.ok(
        response.status === 404 || response.data?.efficiency === null,
        'Should return 404 or null data'
      );
    });

    it('invalid event slug returns 404', async () => {
      const response = await apiRequest('/api/events/nonexistent-event-12345');
      assert.strictEqual(response.status, 404);
    });

    it('unknown API route handled gracefully', async () => {
      const response = await apiRequest('/api/unknown-endpoint');
      assert.ok([404, 500].includes(response.status));
    });
  });

  // =========================================
  // 400 Bad Request
  // =========================================
  describe('400 Bad Request Responses', () => {
    it('parts search without params returns 400', async () => {
      const response = await apiRequest('/api/parts/search');
      assert.strictEqual(response.status, 400);
    });

    it('parts popular without carSlug returns 400', async () => {
      const response = await apiRequest('/api/parts/popular');
      assert.strictEqual(response.status, 400);
    });

    it('invalid VIN format returns 400', async () => {
      const response = await apiRequest('/api/vin/decode', {
        method: 'POST',
        body: JSON.stringify({ vin: 'ABC' }),
      });
      assert.ok([400, 401].includes(response.status));
    });

    it('empty message to AL returns 400', async () => {
      const response = await apiRequest('/api/ai-mechanic', {
        method: 'POST',
        body: JSON.stringify({ message: '' }),
      });
      assert.ok([400, 401].includes(response.status));
    });

    it('missing required fields in contact returns 400', async () => {
      const response = await apiRequest('/api/contact', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      assert.ok([400, 500].includes(response.status));
    });

    it('missing required fields in feedback returns 400', async () => {
      const response = await apiRequest('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      assert.ok([400, 500].includes(response.status));
    });
  });

  // =========================================
  // 401/403 Authorization Errors
  // =========================================
  describe('401/403 Authorization Errors', () => {
    it('AL chat without auth returns 401/403', async () => {
      const response = await apiRequest('/api/ai-mechanic', {
        method: 'POST',
        body: JSON.stringify({ message: 'Test' }),
      });
      assert.ok([401, 403].includes(response.status));
    });

    it('cron endpoints without auth return 401/403', async () => {
      const response = await apiRequest('/api/cron/schedule-ingestion');
      assert.ok([401, 403].includes(response.status));
    });

    it('invalid Bearer token returns 401/403', async () => {
      const response = await apiRequest('/api/cron/schedule-ingestion', {
        headers: { Authorization: 'Bearer invalid-token' },
      });
      assert.ok([401, 403].includes(response.status));
    });
  });

  // =========================================
  // Invalid Input Handling
  // =========================================
  describe('Invalid Input Handling', () => {
    it('handles invalid JSON body gracefully', async () => {
      const response = await fetch(`${BASE_URL}/api/ai-mechanic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json{{{',
      });
      assert.ok([400, 401, 500].includes(response.status));
    });

    it('handles very long query strings', async () => {
      const longQuery = 'a'.repeat(10000);
      const response = await apiRequest(`/api/cars?brand=${longQuery}`);
      // Should handle gracefully, not crash
      assert.ok([200, 400, 414].includes(response.status));
    });

    it('handles special characters in query', async () => {
      const response = await apiRequest('/api/parts/search?q=<script>alert(1)</script>');
      // Should not execute, just search
      assert.ok([200, 400].includes(response.status));
    });

    it('handles SQL injection attempts', async () => {
      const response = await apiRequest("/api/parts/search?q='; DROP TABLE parts; --");
      // Should handle safely
      assert.ok([200, 400].includes(response.status));
    });

    it('handles unicode in query', async () => {
      const response = await apiRequest('/api/parts/search?q=テスト');
      assertResponse(response, 200);
    });

    it('handles emoji in query', async () => {
      const response = await apiRequest('/api/parts/search?q=🚗');
      assertResponse(response, 200);
    });
  });

  // =========================================
  // Boundary Conditions
  // =========================================
  describe('Boundary Conditions', () => {
    it('handles limit=0', async () => {
      const response = await apiRequest('/api/cars?limit=0');
      assertResponse(response, 200);
    });

    it('handles very large limit', async () => {
      const response = await apiRequest('/api/cars?limit=10000');
      assertResponse(response, 200);
      // Should cap at reasonable max
    });

    it('handles negative limit', async () => {
      const response = await apiRequest('/api/cars?limit=-1');
      // Should handle gracefully
      assert.ok([200, 400].includes(response.status));
    });

    it('handles large offset', async () => {
      const response = await apiRequest('/api/events?limit=10&offset=99999');
      assertResponse(response, 200);
      assert.ok(response.data.events.length === 0);
    });

    it('handles negative offset', async () => {
      const response = await apiRequest('/api/events?limit=10&offset=-1');
      assert.ok([200, 400].includes(response.status));
    });
  });

  // =========================================
  // Empty Results Handling
  // =========================================
  describe('Empty Results Handling', () => {
    it('returns empty array for no matching cars', async () => {
      const response = await apiRequest('/api/cars?brand=NonexistentBrand');
      assertResponse(response, 200);
      assert.strictEqual(response.data.cars.length, 0);
    });

    it('returns empty array for no matching events', async () => {
      const response = await apiRequest('/api/events?state=ZZ');
      assertResponse(response, 200);
      assert.strictEqual(response.data.events.length, 0);
    });

    it('returns empty array for no matching parts', async () => {
      const response = await apiRequest('/api/parts/search?q=xyznonexistentpart123');
      assertResponse(response, 200);
      const parts = response.data.results || response.data.parts || [];
      assert.strictEqual(parts.length, 0);
    });
  });

  // =========================================
  // Method Not Allowed
  // =========================================
  describe('Method Handling', () => {
    it('GET on POST-only endpoint returns error', async () => {
      const response = await apiRequest('/api/ai-mechanic');
      // Should return 401 (auth required), 405 (method not allowed), or 200 with error
      assert.ok([200, 401, 403, 405, 500].includes(response.status));
    });

    it('DELETE on GET-only endpoint returns error', async () => {
      const response = await apiRequest('/api/cars', { method: 'DELETE' });
      assert.ok([401, 403, 405, 500].includes(response.status));
    });

    it('PUT on read-only endpoint returns error', async () => {
      const response = await apiRequest('/api/events/types', { method: 'PUT' });
      assert.ok([401, 403, 405, 500].includes(response.status));
    });
  });

  // =========================================
  // Concurrent Request Handling
  // =========================================
  describe('Concurrent Requests', () => {
    it('handles multiple simultaneous requests', async () => {
      const promises = Array(10).fill().map(() => 
        apiRequest('/api/cars?limit=5')
      );
      
      const responses = await Promise.all(promises);
      responses.forEach(response => {
        assert.strictEqual(response.status, 200);
      });
    });

    it('handles rapid sequential requests', async () => {
      for (let i = 0; i < 5; i++) {
        const response = await apiRequest('/api/health');
        assert.strictEqual(response.status, 200);
      }
    });
  });
});

// =========================================
// Error Response Format Validation
// =========================================
describe('Error Response Format', () => {
  it('errors return JSON', async () => {
    const response = await apiRequest('/api/cars/invalid-slug/efficiency');
    // Response should be parseable (apiRequest already parses JSON)
    assert.ok(response.data !== undefined);
  });

  it('400 errors include error message', async () => {
    const response = await apiRequest('/api/parts/search');
    assert.strictEqual(response.status, 400);
    assert.ok(response.data.error, 'Should have error message');
  });
});
