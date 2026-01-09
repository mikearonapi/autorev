/**
 * Feedback Email Integration Tests
 * 
 * Tests the feedback resolution workflow and email sending.
 * 
 * Run: npm test -- tests/integration/feedback-email-integration.test.js
 */

import { describe, it, expect, beforeAll } from 'vitest';

const API_BASE = process.env.TEST_API_URL || 'http://localhost:3000';

// Helper to make authenticated requests
async function authFetch(endpoint, options = {}) {
  const token = process.env.TEST_ADMIN_TOKEN;
  if (!token) {
    throw new Error('TEST_ADMIN_TOKEN environment variable required');
  }
  
  return fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

describe('Feedback Resolution API', () => {
  describe('POST /api/admin/feedback/resolve', () => {
    it('should require authentication', async () => {
      const res = await fetch(`${API_BASE}/api/admin/feedback/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId: 'test-id' }),
      });
      
      expect(res.status).toBe(401);
    });

    it('should require feedbackId', async () => {
      const res = await authFetch('/api/admin/feedback/resolve', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('feedbackId');
    });

    it('should return 404 for non-existent feedback', async () => {
      const res = await authFetch('/api/admin/feedback/resolve', {
        method: 'POST',
        body: JSON.stringify({ 
          feedbackId: '00000000-0000-0000-0000-000000000000' 
        }),
      });
      
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/admin/feedback/resolve-batch', () => {
    it('should require carSlug parameter', async () => {
      const res = await authFetch('/api/admin/feedback/resolve-batch');
      
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('carSlug');
    });

    it('should preview matching feedback for a car', async () => {
      const res = await authFetch(
        '/api/admin/feedback/resolve-batch?carSlug=bmw-m3-cs-2024&carName=2024 BMW M3 CS'
      );
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('carSlug');
      expect(data).toHaveProperty('totalUnresolvedCarRequests');
      expect(data).toHaveProperty('potentialMatches');
      expect(data).toHaveProperty('matches');
    });
  });

  describe('POST /api/admin/feedback/resolve-batch', () => {
    it('should require either feedbackIds or auto-match params', async () => {
      const res = await authFetch('/api/admin/feedback/resolve-batch', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      expect(res.status).toBe(400);
    });

    it('should handle empty feedback arrays gracefully', async () => {
      const res = await authFetch('/api/admin/feedback/resolve-batch', {
        method: 'POST',
        body: JSON.stringify({
          feedbackIds: [],
          carSlug: 'test-car',
          carName: 'Test Car',
        }),
      });
      
      expect(res.status).toBe(400);
    });

    it('should auto-match and return preview count', async () => {
      const res = await authFetch('/api/admin/feedback/resolve-batch', {
        method: 'POST',
        body: JSON.stringify({
          autoMatch: true,
          carSlug: 'nonexistent-car-12345',
          carName: 'Nonexistent Car',
          sendEmails: false, // Don't actually send emails in test
        }),
      });
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.resolved).toBe(0); // No matching feedback expected
    });
  });
});

describe('Email Template', () => {
  describe('feedback-response template', () => {
    it('should render for car_request type', async () => {
      const res = await authFetch(
        '/api/admin/emails/preview?template=feedback-response&format=html'
      );
      
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain('BMW M3 CS'); // Sample car name
      expect(html).toContain('Feedback Received');
      expect(html).toContain('is live!');
    });
  });
});

// Manual integration test helper
describe('Manual Integration Test', () => {
  it.skip('should resolve feedback and send email (manual test)', async () => {
    // This test requires a real feedback ID with an email
    // Uncomment and set the feedbackId to test manually
    
    const feedbackId = 'YOUR_FEEDBACK_ID_HERE';
    
    const res = await authFetch('/api/admin/feedback/resolve', {
      method: 'POST',
      body: JSON.stringify({
        feedbackId,
        sendEmail: true,
        carSlug: 'bmw-m3-cs-2024',
        carName: '2024 BMW M3 CS',
      }),
    });
    
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.email.sent).toBe(true);
  });
});
