import assert from 'node:assert';
import { describe, it, afterEach } from 'node:test';
import { fetchWithRetry } from './fetchWithRetry.js';
import { ErrorLogger } from './errorLogger.js';

const originalFetch = global.fetch;
const originalApiError = ErrorLogger.apiError;
const originalNetworkTimeout = ErrorLogger.networkTimeout;

function restore() {
  global.fetch = originalFetch;
  ErrorLogger.apiError = originalApiError;
  ErrorLogger.networkTimeout = originalNetworkTimeout;
}

process.env.NODE_ENV = 'test';

describe('fetchWithRetry', () => {
  afterEach(() => {
    restore();
  });

  it('logs client errors once and does not retry 4xx', async () => {
    let apiErrorCalls = 0;
    ErrorLogger.apiError = () => { apiErrorCalls += 1; };
    ErrorLogger.networkTimeout = () => {};

    let fetchCalls = 0;
    global.fetch = async () => {
      fetchCalls += 1;
      return { ok: false, status: 404, statusText: 'Not Found' };
    };

    let threw = false;
    try {
      await fetchWithRetry('https://example.com/notfound', {}, 1);
    } catch (err) {
      threw = true;
      assert.match(err.message, /HTTP 404/);
    }

    assert.ok(threw, 'expected fetchWithRetry to throw on 4xx');
    assert.strictEqual(fetchCalls, 1);
    assert.strictEqual(apiErrorCalls, 1);
  });

  it('logs timeout on final attempt', async () => {
    let timeoutCalls = 0;
    ErrorLogger.networkTimeout = () => { timeoutCalls += 1; };
    ErrorLogger.apiError = () => {};

    let fetchCalls = 0;
    global.fetch = async () => {
      fetchCalls += 1;
      const err = new Error('Aborted');
      err.name = 'AbortError';
      throw err;
    };

    let threw = false;
    try {
      await fetchWithRetry('https://example.com/timeout', {}, 0);
    } catch (err) {
      threw = true;
      assert.strictEqual(err.name, 'AbortError');
    }

    assert.ok(threw, 'expected fetchWithRetry to throw on timeout');
    assert.strictEqual(fetchCalls, 1);
    assert.strictEqual(timeoutCalls, 1);
  });
});









