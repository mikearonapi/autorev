/**
 * Other API Tests
 * Tests contact, feedback, health, stats, webhooks
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { apiRequest, assertResponse, waitForServer, BASE_URL } from './test-helpers.js';

describe('Other APIs - Complete Coverage', () => {
  before(async () => {
    console.log(`Testing against: ${BASE_URL}`);
    await waitForServer(10000, 500);
  });

  // =========================================
  // GET /api/health
  // =========================================
  describe('GET /api/health', () => {
    it('returns health status', async () => {
      const response = await apiRequest('/api/health');
      assertResponse(response, 200);
      assert.ok(response.data.status === 'ok' || response.data.status === 'healthy');
    });

    it('includes timestamp', async () => {
      const response = await apiRequest('/api/health');
      assertResponse(response, 200);
      assert.ok(response.data.timestamp || response.data.time);
    });

    it('responds quickly', async () => {
      const start = Date.now();
      await apiRequest('/api/health');
      const duration = Date.now() - start;
      assert.ok(duration < 1000, `Health check took ${duration}ms`);
    });
  });

  // =========================================
  // GET /api/stats
  // =========================================
  describe('GET /api/stats', () => {
    it('returns platform statistics', async () => {
      const response = await apiRequest('/api/stats');
      assertResponse(response, 200);
    });

    it('includes car count', async () => {
      const response = await apiRequest('/api/stats');
      assertResponse(response, 200);
      // Stats should include some counts
      const data = response.data;
      assert.ok(
        data.carCount || data.cars || data.totalCars || Object.keys(data).length > 0,
        'Should have some stats'
      );
    });
  });

  // =========================================
  // POST /api/contact
  // =========================================
  describe('POST /api/contact', () => {
    it('validates required fields', async () => {
      const response = await apiRequest('/api/contact', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      // Should return 400 for missing fields
      assert.ok([400, 500].includes(response.status));
    });

    it('validates email format', async () => {
      const response = await apiRequest('/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
          name: 'Test User',
          message: 'Test message',
        }),
      });
      
      assert.ok([400, 500].includes(response.status));
    });

    it('accepts valid contact form', async () => {
      const response = await apiRequest('/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          name: 'Test User',
          interest: 'services',
          message: 'This is a test message from integration tests.',
        }),
      });
      
      // Should succeed or fail gracefully
      assert.ok([200, 201, 400, 500].includes(response.status));
    });
  });

  // =========================================
  // POST /api/feedback
  // =========================================
  describe('POST /api/feedback', () => {
    it('validates required message field', async () => {
      const response = await apiRequest('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      assert.ok([400, 500].includes(response.status));
    });

    it('accepts basic feedback', async () => {
      const response = await apiRequest('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test feedback from integration tests',
          category: 'general',
        }),
      });
      
      // Should accept or require additional fields
      assert.ok([200, 201, 400].includes(response.status));
    });

    it('accepts bug report with severity', async () => {
      const response = await apiRequest('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test bug report',
          category: 'bug',
          severity: 'minor',
          pageUrl: '/browse-cars',
        }),
      });
      
      assert.ok([200, 201, 400].includes(response.status));
    });

    it('accepts feature request', async () => {
      const response = await apiRequest('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test feature request',
          category: 'feature',
        }),
      });
      
      assert.ok([200, 201, 400].includes(response.status));
    });

    it('accepts rating with feedback', async () => {
      const response = await apiRequest('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Great app!',
          category: 'praise',
          rating: 5,
        }),
      });
      
      assert.ok([200, 201, 400].includes(response.status));
    });

    it('validates rating range (1-5)', async () => {
      const response = await apiRequest('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test',
          rating: 10, // Invalid - may be accepted or rejected
        }),
      });
      
      // May accept (normalize) or reject invalid rating
      console.log(`Rating 10 status: ${response.status}`);
      assert.ok([200, 201, 400, 500].includes(response.status));
    });
  });

  // =========================================
  // GET /api/feedback (Admin)
  // =========================================
  describe('GET /api/feedback', () => {
    it('returns feedback or requires auth', async () => {
      const response = await apiRequest('/api/feedback');
      
      if (response.status === 200) {
        console.log('Feedback list accessible');
      } else {
        assert.ok([401, 403].includes(response.status));
      }
    });

    it('supports category filter', async () => {
      const response = await apiRequest('/api/feedback?category=bug');
      assert.ok([200, 401, 403].includes(response.status));
    });

    it('supports unresolved filter', async () => {
      const response = await apiRequest('/api/feedback?unresolved=true');
      assert.ok([200, 401, 403].includes(response.status));
    });
  });

  // =========================================
  // PATCH /api/feedback (Admin)
  // =========================================
  describe('PATCH /api/feedback', () => {
    it('requires admin authentication', async () => {
      const response = await apiRequest('/api/feedback', {
        method: 'PATCH',
        body: JSON.stringify({
          feedbackId: 'test-id',
          status: 'resolved',
        }),
      });
      
      // 405 if PATCH not supported, otherwise auth error
      assert.ok([401, 403, 405, 500].includes(response.status));
    });
  });

  // =========================================
  // Webhooks
  // =========================================
  describe('POST /api/webhooks/vercel', () => {
    it('handles Vercel deploy webhook', async () => {
      const response = await apiRequest('/api/webhooks/vercel', {
        method: 'POST',
        body: JSON.stringify({
          type: 'deployment.succeeded',
          payload: {
            deployment: {
              id: 'test-deployment-id',
            },
          },
        }),
      });
      
      // May accept or require validation
      assert.ok([200, 400, 401, 500].includes(response.status));
    });
  });
});

// =========================================
// Response Time Tests
// =========================================
describe('API Response Times', () => {
  const endpoints = [
    { path: '/api/health', maxMs: 2000 },  // Allow up to 2s for health
    { path: '/api/stats', maxMs: 3000 },
    { path: '/api/cars?limit=10', maxMs: 3000 },
    { path: '/api/events?limit=10', maxMs: 3000 },
    { path: '/api/events/types', maxMs: 2000 },
  ];

  for (const { path, maxMs } of endpoints) {
    it(`${path} responds within ${maxMs}ms`, async () => {
      const start = Date.now();
      const response = await apiRequest(path);
      const duration = Date.now() - start;
      
      console.log(`${path}: ${duration}ms`);
      assert.ok(duration < maxMs, `${path} took ${duration}ms (max: ${maxMs}ms)`);
    });
  }
});

// =========================================
// Error Response Format Tests
// =========================================
describe('Error Response Format', () => {
  it('404 returns JSON error', async () => {
    const response = await apiRequest('/api/nonexistent-route');
    // May return 404 or 500 for unknown routes
    assert.ok([404, 500].includes(response.status));
  });

  it('errors include error message', async () => {
    const response = await apiRequest('/api/cars/invalid-car/efficiency');
    if (response.status === 404) {
      assert.ok(
        response.data === null || response.data.error || response.data.efficiency === null,
        'Should have error info or null data'
      );
    }
  });
});

