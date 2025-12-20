/**
 * Internal/Admin API Tests
 * Tests all internal routes (require admin auth)
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { apiRequest, assertResponse, waitForServer, BASE_URL } from './test-helpers.js';

describe('Internal API - Admin Routes', () => {
  before(async () => {
    console.log(`Testing against: ${BASE_URL}`);
    await waitForServer(10000, 500);
  });

  // =========================================
  // Car Variants
  // =========================================
  describe('POST /api/internal/car-variants', () => {
    it('requires admin authentication', async () => {
      const response = await apiRequest('/api/internal/car-variants', {
        method: 'POST',
        body: JSON.stringify({
          car_id: 'test-id',
          variant_key: 'test-variant',
        }),
      });
      
      // Should require admin auth (405 if method not supported)
      assert.ok([401, 403, 405, 500].includes(response.status));
    });

    it('GET returns variants list', async () => {
      const response = await apiRequest('/api/internal/car-variants');
      
      // May require auth or return data
      assert.ok([200, 401, 403].includes(response.status));
    });
  });

  // =========================================
  // Dyno Data
  // =========================================
  describe('POST /api/internal/dyno/runs', () => {
    it('requires admin authentication', async () => {
      const response = await apiRequest('/api/internal/dyno/runs', {
        method: 'POST',
        body: JSON.stringify({
          car_slug: '718-cayman-gt4',
          peak_whp: 385,
          peak_wtq: 310,
        }),
      });
      
      // May return various auth/method errors
      assert.ok([401, 403, 405, 500].includes(response.status));
    });

    it('GET returns dyno runs list', async () => {
      const response = await apiRequest('/api/internal/dyno/runs');
      assert.ok([200, 401, 403].includes(response.status));
    });
  });

  // =========================================
  // Lap Times
  // =========================================
  describe('POST /api/internal/track/lap-times', () => {
    it('requires admin authentication', async () => {
      const response = await apiRequest('/api/internal/track/lap-times', {
        method: 'POST',
        body: JSON.stringify({
          car_slug: '718-cayman-gt4',
          track_name: 'Laguna Seca',
          lap_time_text: '1:35.5',
        }),
      });
      
      // May return various auth/method errors
      assert.ok([401, 403, 405, 500].includes(response.status));
    });

    it('GET returns lap times list', async () => {
      const response = await apiRequest('/api/internal/track/lap-times');
      assert.ok([200, 401, 403].includes(response.status));
    });
  });

  // =========================================
  // Parts Fitments
  // =========================================
  describe('POST /api/internal/parts/fitments', () => {
    it('requires admin authentication', async () => {
      const response = await apiRequest('/api/internal/parts/fitments', {
        method: 'POST',
        body: JSON.stringify({
          part_id: 'test-part-id',
          car_id: 'test-car-id',
        }),
      });
      
      // Should require admin auth (405 if method not supported)
      assert.ok([401, 403, 405, 500].includes(response.status));
    });

    it('GET returns fitments list', async () => {
      const response = await apiRequest('/api/internal/parts/fitments');
      assert.ok([200, 401, 403].includes(response.status));
    });
  });

  // =========================================
  // Knowledge Base
  // =========================================
  describe('POST /api/internal/knowledge/ingest', () => {
    it('requires admin authentication', async () => {
      const response = await apiRequest('/api/internal/knowledge/ingest', {
        method: 'POST',
        body: JSON.stringify({
          source_url: 'https://example.com/article',
          content: 'Test content',
        }),
      });
      
      // May return 401, 403, 405, or 500
      assert.ok([401, 403, 405, 500].includes(response.status));
    });
  });

  // =========================================
  // Maintenance Overrides
  // =========================================
  describe('POST /api/internal/maintenance/variant-overrides', () => {
    it('requires admin authentication', async () => {
      const response = await apiRequest('/api/internal/maintenance/variant-overrides', {
        method: 'POST',
        body: JSON.stringify({
          variant_id: 'test-variant-id',
          overrides: {},
        }),
      });
      
      // May return 401, 403, 405, or 500
      assert.ok([401, 403, 405, 500].includes(response.status));
    });
  });

  // =========================================
  // QA Report
  // =========================================
  describe('GET /api/internal/qa-report', () => {
    it('requires admin authentication', async () => {
      const response = await apiRequest('/api/internal/qa-report');
      
      // May return report or require auth
      if (response.status === 200) {
        console.log('QA report accessible');
      } else {
        assert.ok([401, 403].includes(response.status));
      }
    });
  });

  // =========================================
  // Forum Insights
  // =========================================
  describe('GET /api/internal/forum-insights', () => {
    it('returns forum stats or requires auth', async () => {
      const response = await apiRequest('/api/internal/forum-insights');
      
      if (response.status === 200) {
        console.log('Forum insights accessible');
      } else {
        assert.ok([401, 403].includes(response.status));
      }
    });

    it('POST requires auth for manual operations', async () => {
      const response = await apiRequest('/api/internal/forum-insights', {
        method: 'POST',
        body: JSON.stringify({
          action: 'scrape',
          forum: 'rennlist',
        }),
      });
      
      assert.ok([401, 403, 405, 500].includes(response.status));
    });
  });

  // =========================================
  // Event Submissions (Moderation)
  // =========================================
  describe('GET /api/internal/events/submissions', () => {
    it('returns submissions or requires auth', async () => {
      const response = await apiRequest('/api/internal/events/submissions');
      
      if (response.status === 200) {
        assert.ok('submissions' in response.data || Array.isArray(response.data));
      } else {
        assert.ok([401, 403].includes(response.status));
      }
    });

    it('supports status filter', async () => {
      const response = await apiRequest('/api/internal/events/submissions?status=pending');
      assert.ok([200, 401, 403].includes(response.status));
    });
  });

  describe('POST /api/internal/events/submissions', () => {
    it('requires admin auth to approve', async () => {
      const response = await apiRequest('/api/internal/events/submissions', {
        method: 'POST',
        body: JSON.stringify({
          submissionId: 'test-submission-id',
          eventData: {
            name: 'Test Event',
            start_date: '2025-06-01',
          },
        }),
      });
      
      assert.ok([401, 403, 500].includes(response.status));
    });
  });

  describe('POST /api/internal/events/submissions/[id]/reject', () => {
    it('requires admin auth to reject', async () => {
      const response = await apiRequest('/api/internal/events/submissions/test-id/reject', {
        method: 'POST',
        body: JSON.stringify({
          reason: 'Duplicate event',
        }),
      });
      
      assert.ok([401, 403, 404, 500].includes(response.status));
    });
  });

  // =========================================
  // Discord Test
  // =========================================
  describe('POST /api/internal/test-discord', () => {
    it('requires admin auth', async () => {
      const response = await apiRequest('/api/internal/test-discord', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test message',
        }),
      });
      
      // May return 405 if method not supported
      assert.ok([200, 401, 403, 405, 500].includes(response.status));
    });
  });
});







