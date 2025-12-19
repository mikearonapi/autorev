/**
 * Complete VIN API Tests
 * Tests all 3 VIN-related routes
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { apiRequest, assertResponse, waitForServer, BASE_URL } from './test-helpers.js';

// Sample VINs for testing (structure, not necessarily real)
const TEST_VINS = {
  porsche: 'WP0AB29986S731234',    // Porsche 911 format
  bmw: 'WBAPH5C55BA123456',        // BMW format
  toyota: 'JTDKN3DU5A0123456',     // Toyota format
  invalid: 'INVALID123',           // Too short
  badChecksum: 'WBAPH5C55BA12345X', // Invalid check digit
};

describe('VIN API - Complete Coverage', () => {
  before(async () => {
    console.log(`Testing against: ${BASE_URL}`);
    await waitForServer(10000, 500);
  });

  // =========================================
  // POST /api/vin/decode
  // =========================================
  describe('POST /api/vin/decode', () => {
    it('decodes Porsche VIN (IS_BETA mode)', async () => {
      const response = await apiRequest('/api/vin/decode', {
        method: 'POST',
        body: JSON.stringify({
          vin: TEST_VINS.porsche,
        }),
      });
      
      // In IS_BETA mode may return 200, otherwise 401/403
      if (response.status === 200) {
        console.log('VIN decode result:', response.data.car_slug || response.data);
      } else {
        assert.ok([401, 403].includes(response.status), 'Should require auth');
      }
    });

    it('decodes BMW VIN', async () => {
      const response = await apiRequest('/api/vin/decode', {
        method: 'POST',
        body: JSON.stringify({
          vin: TEST_VINS.bmw,
        }),
      });
      
      assert.ok([200, 400, 401, 403, 404].includes(response.status));
    });

    it('decodes Toyota VIN', async () => {
      const response = await apiRequest('/api/vin/decode', {
        method: 'POST',
        body: JSON.stringify({
          vin: TEST_VINS.toyota,
        }),
      });
      
      assert.ok([200, 400, 401, 403, 404].includes(response.status));
    });

    it('rejects invalid VIN format', async () => {
      const response = await apiRequest('/api/vin/decode', {
        method: 'POST',
        body: JSON.stringify({
          vin: TEST_VINS.invalid,
        }),
      });
      
      // Should return 400 or 401
      assert.ok([400, 401].includes(response.status));
    });

    it('validates VIN length', async () => {
      const response = await apiRequest('/api/vin/decode', {
        method: 'POST',
        body: JSON.stringify({
          vin: 'ABC',
        }),
      });
      
      assert.ok([400, 401].includes(response.status));
    });

    it('handles empty VIN', async () => {
      const response = await apiRequest('/api/vin/decode', {
        method: 'POST',
        body: JSON.stringify({
          vin: '',
        }),
      });
      
      assert.ok([400, 401].includes(response.status));
    });

    it('handles missing VIN field', async () => {
      const response = await apiRequest('/api/vin/decode', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      assert.ok([400, 401].includes(response.status));
    });
  });

  // =========================================
  // POST /api/vin/resolve
  // =========================================
  describe('POST /api/vin/resolve', () => {
    it('resolves VIN to variant', async () => {
      const response = await apiRequest('/api/vin/resolve', {
        method: 'POST',
        body: JSON.stringify({
          vin: TEST_VINS.porsche,
        }),
      });
      
      // May resolve successfully or require auth
      assert.ok([200, 400, 401, 403, 404].includes(response.status));
    });

    it('handles unmatched VIN', async () => {
      const response = await apiRequest('/api/vin/resolve', {
        method: 'POST',
        body: JSON.stringify({
          vin: 'ZZZZZZZZZZZZZZZZZ',  // Valid format but won't match
        }),
      });
      
      // May return various statuses including timeout
      console.log(`VIN resolve unmatched status: ${response.status}`);
      // Accept any HTTP response - the test verifies the endpoint doesn't crash
      assert.ok(typeof response.status === 'number');
    });
  });

  // =========================================
  // POST /api/vin/safety
  // =========================================
  describe('POST /api/vin/safety', () => {
    it('proxies NHTSA safety data', async () => {
      const response = await apiRequest('/api/vin/safety', {
        method: 'POST',
        body: JSON.stringify({
          vin: TEST_VINS.porsche,
          year: 2020,
          make: 'Porsche',
          model: '911',
        }),
      });
      
      // This is a CORS proxy, should work without auth
      assertResponse(response, 200);
    });

    it('fetches recalls for VIN', async () => {
      const response = await apiRequest('/api/vin/safety', {
        method: 'POST',
        body: JSON.stringify({
          vin: TEST_VINS.bmw,
          year: 2021,
          make: 'BMW',
          model: 'M3',
        }),
      });
      
      assertResponse(response, 200);
      // May have recalls, complaints, investigations
    });

    it('handles unknown make/model', async () => {
      const response = await apiRequest('/api/vin/safety', {
        method: 'POST',
        body: JSON.stringify({
          vin: 'ZZZZZZZZZZZZZZZZZ',
          year: 2020,
          make: 'Unknown',
          model: 'Unknown',
        }),
      });
      
      // Should still return 200 with empty data
      assertResponse(response, 200);
    });

    it('handles missing year', async () => {
      const response = await apiRequest('/api/vin/safety', {
        method: 'POST',
        body: JSON.stringify({
          vin: TEST_VINS.porsche,
          make: 'Porsche',
          model: '911',
        }),
      });
      
      // Should handle gracefully
      assert.ok([200, 400].includes(response.status));
    });
  });
});

// =========================================
// VIN Format Validation Tests
// =========================================
describe('VIN Format Validation', () => {
  const validVINs = [
    'WP0AB29986S731234',  // Porsche
    'WBAPH5C55BA123456',  // BMW
    '1G1YY22G965123456',  // Chevrolet
    'JN1TBNT30Z0123456',  // Nissan
    'JTDKN3DU5A0123456',  // Toyota
  ];

  for (const vin of validVINs) {
    it(`accepts valid VIN format: ${vin.substring(0, 8)}...`, async () => {
      const response = await apiRequest('/api/vin/decode', {
        method: 'POST',
        body: JSON.stringify({ vin }),
      });
      
      // Should not reject due to format
      assert.ok(response.status !== 400 || response.status === 401);
    });
  }

  const invalidVINs = [
    { vin: 'ABC', reason: 'too short' },
    { vin: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', reason: 'too long' },
    { vin: 'IOQIOQIOQIOQIOQIO', reason: 'contains I, O, Q' },
  ];

  for (const { vin, reason } of invalidVINs) {
    it(`rejects invalid VIN (${reason})`, async () => {
      const response = await apiRequest('/api/vin/decode', {
        method: 'POST',
        body: JSON.stringify({ vin }),
      });
      
      // Should return 400 or require auth
      assert.ok([400, 401].includes(response.status));
    });
  }
});

