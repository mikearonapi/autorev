/**
 * Integration Test Helpers
 * Utilities for E2E API testing
 */

// Base URL - defaults to local dev server
export const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3002';

/**
 * Make an API request and return parsed JSON
 * @param {string} path - API path (e.g., '/api/cars')
 * @param {object} options - fetch options
 * @returns {Promise<{status: number, data: any, headers: Headers}>}
 */
export async function apiRequest(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  
  return {
    status: response.status,
    data,
    headers: response.headers,
  };
}

/**
 * Make authenticated API request
 * @param {string} path - API path
 * @param {string} token - Auth token (Supabase access token)
 * @param {object} options - fetch options
 */
export async function authApiRequest(path, token, options = {}) {
  return apiRequest(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

/**
 * Wait for dev server to be ready
 * @param {number} maxWaitMs - Max time to wait
 * @param {number} intervalMs - Check interval
 */
export async function waitForServer(maxWaitMs = 30000, intervalMs = 1000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok) return true;
    } catch {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  throw new Error(`Server not ready after ${maxWaitMs}ms`);
}

/**
 * Assert response has expected structure
 */
export function assertResponse(response, expectedStatus, requiredFields = []) {
  if (response.status !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, got ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  for (const field of requiredFields) {
    if (!(field in response.data)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
}

/**
 * Assert array has items and each item has required fields
 */
export function assertArrayItems(items, requiredFields, minLength = 1) {
  if (!Array.isArray(items)) {
    throw new Error(`Expected array, got ${typeof items}`);
  }
  if (items.length < minLength) {
    throw new Error(`Expected at least ${minLength} items, got ${items.length}`);
  }
  
  for (const item of items) {
    for (const field of requiredFields) {
      if (!(field in item)) {
        throw new Error(`Item missing required field: ${field}`);
      }
    }
  }
}







