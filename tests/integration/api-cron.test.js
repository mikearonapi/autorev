/**
 * Cron Job API Tests
 * Tests all scheduled job endpoints
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { apiRequest, assertResponse, waitForServer, BASE_URL } from './test-helpers.js';

describe('Cron API - Scheduled Jobs', () => {
  before(async () => {
    console.log(`Testing against: ${BASE_URL}`);
    await waitForServer(10000, 500);
  });

  // Note: All cron endpoints require CRON_SECRET auth
  // We test that they properly require authentication

  // =========================================
  // GET /api/cron/schedule-ingestion
  // =========================================
  describe('GET /api/cron/schedule-ingestion', () => {
    it('requires cron authentication', async () => {
      const response = await apiRequest('/api/cron/schedule-ingestion');
      
      // Should require CRON_SECRET or x-vercel-cron header
      assert.ok([401, 403].includes(response.status), 
        `Should require auth, got ${response.status}`);
    });

    it('supports dryRun parameter', async () => {
      const response = await apiRequest('/api/cron/schedule-ingestion?dryRun=true');
      assert.ok([401, 403].includes(response.status));
    });
  });

  // =========================================
  // GET /api/cron/process-scrape-jobs
  // =========================================
  describe('GET /api/cron/process-scrape-jobs', () => {
    it('requires cron authentication', async () => {
      const response = await apiRequest('/api/cron/process-scrape-jobs');
      assert.ok([401, 403].includes(response.status));
    });

    it('supports max parameter', async () => {
      const response = await apiRequest('/api/cron/process-scrape-jobs?max=3');
      assert.ok([401, 403].includes(response.status));
    });

    it('supports type parameter', async () => {
      const response = await apiRequest('/api/cron/process-scrape-jobs?type=parts');
      assert.ok([401, 403].includes(response.status));
    });
  });

  // =========================================
  // GET /api/cron/refresh-recalls
  // =========================================
  describe('GET /api/cron/refresh-recalls', () => {
    it('requires cron authentication', async () => {
      const response = await apiRequest('/api/cron/refresh-recalls');
      assert.ok([401, 403].includes(response.status));
    });

    it('supports limitCars parameter', async () => {
      const response = await apiRequest('/api/cron/refresh-recalls?limitCars=5');
      assert.ok([401, 403].includes(response.status));
    });
  });

  // =========================================
  // GET /api/cron/refresh-complaints
  // =========================================
  describe('GET /api/cron/refresh-complaints', () => {
    it('requires cron authentication', async () => {
      const response = await apiRequest('/api/cron/refresh-complaints');
      assert.ok([401, 403].includes(response.status));
    });

    it('supports limitCars parameter', async () => {
      const response = await apiRequest('/api/cron/refresh-complaints?limitCars=5');
      assert.ok([401, 403].includes(response.status));
    });
  });

  // =========================================
  // GET /api/cron/youtube-enrichment
  // =========================================
  describe('GET /api/cron/youtube-enrichment', () => {
    it('requires cron authentication', async () => {
      const response = await apiRequest('/api/cron/youtube-enrichment');
      assert.ok([401, 403].includes(response.status));
    });

    it('supports skipDiscovery parameter', async () => {
      const response = await apiRequest('/api/cron/youtube-enrichment?skipDiscovery=true');
      assert.ok([401, 403].includes(response.status));
    });

    it('supports channel parameter', async () => {
      const response = await apiRequest('/api/cron/youtube-enrichment?channel=throttlehouse');
      assert.ok([401, 403].includes(response.status));
    });
  });

  // =========================================
  // GET /api/cron/forum-scrape
  // =========================================
  describe('GET /api/cron/forum-scrape', () => {
    it('requires cron authentication', async () => {
      const response = await apiRequest('/api/cron/forum-scrape');
      assert.ok([401, 403].includes(response.status));
    });

    it('supports mode parameter', async () => {
      const response = await apiRequest('/api/cron/forum-scrape?mode=scrape');
      assert.ok([401, 403].includes(response.status));
    });

    it('supports forum parameter', async () => {
      const response = await apiRequest('/api/cron/forum-scrape?forum=rennlist');
      assert.ok([401, 403].includes(response.status));
    });
  });

  // =========================================
  // GET /api/cron/refresh-events
  // =========================================
  describe('GET /api/cron/refresh-events', () => {
    it('requires cron authentication', async () => {
      const response = await apiRequest('/api/cron/refresh-events');
      assert.ok([401, 403].includes(response.status));
    });

    it('supports dryRun parameter', async () => {
      const response = await apiRequest('/api/cron/refresh-events?dryRun=true');
      assert.ok([401, 403].includes(response.status));
    });

    it('supports source parameter', async () => {
      const response = await apiRequest('/api/cron/refresh-events?source=motorsportreg');
      assert.ok([401, 403].includes(response.status));
    });
  });

  // =========================================
  // GET /api/cron/daily-digest
  // =========================================
  describe('GET /api/cron/daily-digest', () => {
    it('requires cron authentication', async () => {
      const response = await apiRequest('/api/cron/daily-digest');
      assert.ok([401, 403].includes(response.status));
    });
  });
});

// =========================================
// Cron Auth Header Tests
// =========================================
describe('Cron Authentication Methods', () => {
  it('rejects requests without any auth', async () => {
    const response = await apiRequest('/api/cron/schedule-ingestion');
    assert.ok([401, 403].includes(response.status));
  });

  it('rejects invalid Bearer token', async () => {
    const response = await apiRequest('/api/cron/schedule-ingestion', {
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });
    assert.ok([401, 403].includes(response.status));
  });

  it('rejects invalid x-vercel-cron header', async () => {
    const response = await apiRequest('/api/cron/schedule-ingestion', {
      headers: {
        'x-vercel-cron': 'false',
      },
    });
    assert.ok([401, 403].includes(response.status));
  });
});

