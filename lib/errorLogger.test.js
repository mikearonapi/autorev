import assert from 'node:assert';
import { describe, it } from 'node:test';
import { logError, generateErrorHash } from './errorLogger.js';

const originalFetch = global.fetch;

function createMockFetch({ ok = true, status = 200, statusText = 'OK' } = {}) {
  let calls = 0;
  const mock = async () => {
    calls += 1;
    return { ok, status, statusText };
  };
  mock.getCalls = () => calls;
  return mock;
}

async function runWithMockedFetch(mock, fn) {
  global.fetch = mock;
  try {
    await fn();
  } finally {
    global.fetch = originalFetch;
  }
}

// Set production mode so logging is enabled
process.env.NODE_ENV = 'production';

describe('errorLogger', () => {
  it('generates stable hashes for identical input', () => {
    const error = new Error('Boom');
    const hash1 = generateErrorHash(error, { pageUrl: '/a' });
    const hash2 = generateErrorHash(error, { pageUrl: '/a' });
    assert.strictEqual(hash1, hash2);
  });

  it('deduplicates identical errors (fetch called once)', async () => {
    const mockFetch = createMockFetch();
    const error = new Error('Duplicate boom');

    await runWithMockedFetch(mockFetch, async () => {
      await logError(error, { pageUrl: '/dup' });
      await logError(error, { pageUrl: '/dup' });
    });

    assert.strictEqual(mockFetch.getCalls(), 1);
  });
});








