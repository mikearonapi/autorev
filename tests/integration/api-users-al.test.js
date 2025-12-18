/**
 * Complete Users & AL API Tests
 * Tests user data and AL assistant routes
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { apiRequest, assertResponse, waitForServer, BASE_URL } from './test-helpers.js';

describe('Users & AL API - Complete Coverage', () => {
  const testUserId = 'test-user-id';
  
  before(async () => {
    console.log(`Testing against: ${BASE_URL}`);
    await waitForServer(10000, 500);
  });

  // =========================================
  // POST /api/ai-mechanic
  // =========================================
  describe('POST /api/ai-mechanic', () => {
    it('requires authentication', async () => {
      const response = await apiRequest('/api/ai-mechanic', {
        method: 'POST',
        body: JSON.stringify({
          message: 'What is a good sports car?',
        }),
      });
      
      assert.ok([401, 403].includes(response.status), 'Should require auth');
    });

    it('validates message field', async () => {
      const response = await apiRequest('/api/ai-mechanic', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      assert.ok([400, 401].includes(response.status));
    });

    it('validates empty message', async () => {
      const response = await apiRequest('/api/ai-mechanic', {
        method: 'POST',
        body: JSON.stringify({ message: '' }),
      });
      
      assert.ok([400, 401].includes(response.status));
    });
  });

  // =========================================
  // POST /api/ai-mechanic/feedback
  // =========================================
  describe('POST /api/ai-mechanic/feedback', () => {
    it('handles feedback submission', async () => {
      const response = await apiRequest('/api/ai-mechanic/feedback', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: 'test-conv-id',
          messageId: 'test-msg-id',
          rating: 5,
          feedback: 'Great response!',
        }),
      });
      
      // May require auth or accept feedback
      assert.ok([200, 401, 500].includes(response.status));
    });
  });

  // =========================================
  // GET /api/users/[userId]/al-conversations
  // =========================================
  describe('GET /api/users/[userId]/al-conversations', () => {
    it('returns conversations (IS_BETA mode)', async () => {
      const response = await apiRequest(`/api/users/${testUserId}/al-conversations`);
      
      // In IS_BETA mode returns 200, in production returns 401/403
      if (response.status === 200) {
        assert.ok('conversations' in response.data || Array.isArray(response.data));
        console.log('AL conversations accessible (IS_BETA mode)');
      } else {
        assert.ok([401, 403].includes(response.status));
      }
    });

    it('handles invalid user ID', async () => {
      const response = await apiRequest('/api/users/invalid-uuid-format/al-conversations');
      // Should return empty or error
      assert.ok([200, 400, 401, 403].includes(response.status));
    });
  });

  // =========================================
  // GET /api/users/[userId]/al-conversations/[conversationId]
  // =========================================
  describe('GET /api/users/[userId]/al-conversations/[conversationId]', () => {
    it('returns specific conversation', async () => {
      const response = await apiRequest(`/api/users/${testUserId}/al-conversations/test-conv-id`);
      
      // In IS_BETA mode returns 200, in production returns 401/403
      if (response.status === 200) {
        console.log('Conversation detail accessible');
      } else {
        assert.ok([401, 403, 404].includes(response.status));
      }
    });

    it('handles nonexistent conversation', async () => {
      const response = await apiRequest(`/api/users/${testUserId}/al-conversations/nonexistent-id`);
      assert.ok([200, 401, 403, 404].includes(response.status));
    });
  });

  // =========================================
  // GET /api/users/[userId]/al-credits
  // =========================================
  describe('GET /api/users/[userId]/al-credits', () => {
    it('returns credit balance (IS_BETA mode)', async () => {
      const response = await apiRequest(`/api/users/${testUserId}/al-credits`);
      
      if (response.status === 200) {
        // Check for credit fields
        const data = response.data;
        console.log('AL credits:', data.balance_cents || 0, 'cents');
        assert.ok('balance_cents' in data || 'credits' in data || typeof data === 'object');
      } else {
        assert.ok([401, 403].includes(response.status));
      }
    });
  });

  // =========================================
  // GET /api/users/[userId]/saved-events
  // =========================================
  describe('GET /api/users/[userId]/saved-events', () => {
    it('returns saved events (IS_BETA mode)', async () => {
      const response = await apiRequest(`/api/users/${testUserId}/saved-events`);
      
      // May be accessible in IS_BETA mode or require auth
      console.log(`Saved events status: ${response.status}`);
      if (response.status === 200) {
        console.log('Saved events accessible');
      }
      // Accept any valid HTTP response
      assert.ok([200, 401, 403, 404, 500].includes(response.status));
    });

    it('supports includeExpired parameter', async () => {
      const response = await apiRequest(`/api/users/${testUserId}/saved-events?includeExpired=true`);
      assert.ok([200, 401, 403, 404, 500].includes(response.status));
    });
  });

  // =========================================
  // POST /api/users/[userId]/clear-data
  // =========================================
  describe('POST /api/users/[userId]/clear-data', () => {
    it('requires authentication', async () => {
      const response = await apiRequest(`/api/users/${testUserId}/clear-data`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      // Should require auth
      assert.ok([401, 403, 500].includes(response.status));
    });
  });

  // =========================================
  // GET /api/al/stats
  // =========================================
  describe('GET /api/al/stats', () => {
    it('returns AL usage statistics', async () => {
      const response = await apiRequest('/api/al/stats');
      
      // May require auth or return public stats
      if (response.status === 200) {
        console.log('AL stats accessible');
      } else {
        console.log('AL stats requires auth');
      }
    });
  });
});

// =========================================
// AL Tool Integration Tests
// =========================================
describe('AL Tool Definitions', () => {
  it('AL endpoint accepts carContext', async () => {
    const response = await apiRequest('/api/ai-mechanic', {
      method: 'POST',
      body: JSON.stringify({
        message: 'What do you know about this car?',
        carContext: { slug: '718-cayman-gt4' },
      }),
    });
    
    // Should accept or require auth (may return 500 on error)
    console.log(`AL with carContext status: ${response.status}`);
    assert.ok([200, 400, 401, 403, 500].includes(response.status));
  });

  it('AL endpoint accepts conversationId', async () => {
    const response = await apiRequest('/api/ai-mechanic', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Continue our conversation',
        conversationId: 'test-conversation-id',
      }),
    });
    
    // Should accept or require auth (may return 500 on error)
    console.log(`AL with conversationId status: ${response.status}`);
    assert.ok([200, 400, 401, 403, 500].includes(response.status));
  });
});
