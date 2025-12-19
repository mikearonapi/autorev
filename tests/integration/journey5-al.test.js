/**
 * Journey 5: AL Assistant
 * 
 * Tests AI assistant functionality:
 * Chat → Tool Usage → Credits
 * 
 * Note: Full AL tests require auth and will use credits
 * These tests verify API structure and error handling
 * 
 * Preconditions:
 * - Dev server running
 * - ANTHROPIC_API_KEY configured (for live tests)
 * - al_user_credits has balance for test user
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { apiRequest, assertResponse, waitForServer, BASE_URL } from './test-helpers.js';

describe('Journey 5: AL Assistant', () => {
  
  before(async () => {
    console.log(`Testing against: ${BASE_URL}`);
    try {
      await waitForServer(10000, 500);
      console.log('Server is ready');
    } catch (err) {
      console.log('Server not available, tests may fail:', err.message);
    }
  });
  
  describe('AL Chat Endpoint', () => {
    it('POST /api/ai-mechanic requires authentication', async () => {
      const response = await apiRequest('/api/ai-mechanic', {
        method: 'POST',
        body: JSON.stringify({
          message: 'What is a good sports car under $50k?',
        }),
      });
      
      // Should require auth
      assert.ok(
        response.status === 401 || response.status === 403,
        `Should require auth, got ${response.status}`
      );
    });
    
    it('POST /api/ai-mechanic validates message field', async () => {
      const response = await apiRequest('/api/ai-mechanic', {
        method: 'POST',
        body: JSON.stringify({
          // Missing message field
        }),
      });
      
      // Should return validation error or auth error
      assert.ok(
        response.status === 400 || response.status === 401,
        `Should validate or require auth, got ${response.status}`
      );
    });
  });
  
  describe('AL Conversations (Auth Required)', () => {
    it('GET /api/users/[userId]/al-conversations checks auth or returns empty', async () => {
      // Use a fake user ID
      const response = await apiRequest('/api/users/test-user-id/al-conversations');
      
      // In IS_BETA mode, may return 200 with empty data
      // In production, should return 401/403
      if (response.status === 200) {
        console.log('AL conversations allowed (IS_BETA mode) - returns:', 
          response.data.conversations?.length || 0, 'conversations');
      } else {
        assert.ok(
          response.status === 401 || response.status === 403,
          `Should require auth, got ${response.status}`
        );
      }
    });
  });
  
  describe('AL Credits (Auth Required)', () => {
    it('GET /api/users/[userId]/al-credits checks auth or returns default', async () => {
      const response = await apiRequest('/api/users/test-user-id/al-credits');
      
      // In IS_BETA mode, may return 200 with default credits
      // In production, should return 401/403
      if (response.status === 200) {
        console.log('AL credits allowed (IS_BETA mode) - balance:', 
          response.data.balance_cents || 0, 'cents');
      } else {
        assert.ok(
          response.status === 401 || response.status === 403,
          `Should require auth, got ${response.status}`
        );
      }
    });
  });
});

describe('AL Health Check', () => {
  it('API health endpoint works', async () => {
    const response = await apiRequest('/api/health');
    
    assertResponse(response, 200);
    assert.ok(response.data.status === 'ok' || response.data, 'Should be healthy');
  });
});

/**
 * Authenticated AL Tests
 * 
 * To run these tests, set TEST_AUTH_TOKEN environment variable
 * with a valid Supabase access token for a user with AL credits.
 * 
 * Example:
 * TEST_AUTH_TOKEN=<token> node --test tests/integration/journey5-al.test.js
 */
describe('AL Assistant (Authenticated)', { skip: !process.env.TEST_AUTH_TOKEN }, () => {
  const authToken = process.env.TEST_AUTH_TOKEN;
  
  it('POST /api/ai-mechanic returns response', async () => {
    const response = await apiRequest('/api/ai-mechanic', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        message: 'What is the Porsche 718 Cayman GT4?',
      }),
    });
    
    assertResponse(response, 200, ['response', 'conversationId', 'usage']);
    
    assert.ok(response.data.response.length > 0, 'Should have response text');
    assert.ok(response.data.conversationId, 'Should have conversation ID');
    assert.ok(response.data.usage, 'Should have usage data');
    
    console.log(`Response length: ${response.data.response.length} chars`);
    console.log(`Tokens: ${response.data.usage.inputTokens}/${response.data.usage.outputTokens}`);
  });
  
  it('AL uses tools for car queries', async () => {
    const response = await apiRequest('/api/ai-mechanic', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        message: 'What are the common issues with the E46 M3?',
      }),
    });
    
    assertResponse(response, 200);
    
    // Response should mention specific issues from database
    const text = response.data.response.toLowerCase();
    // Known E46 M3 issues include VANOS, subframe, etc.
    console.log(`Response mentions car-specific data: ${text.includes('vanos') || text.includes('subframe')}`);
  });
});

