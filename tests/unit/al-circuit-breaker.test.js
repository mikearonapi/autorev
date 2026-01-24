/**
 * Unit Tests: AI Circuit Breaker
 * 
 * Tests the circuit breaker state transitions and protection logic.
 * 
 * Run: npm test -- tests/unit/al-circuit-breaker.test.js
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  CIRCUIT_STATES,
  CircuitOpenError,
  createCircuitBreaker,
} from '@/lib/aiCircuitBreaker';

describe('AI Circuit Breaker', () => {
  let circuitBreaker;

  beforeEach(() => {
    // Create a fresh circuit breaker with fast timings for testing
    circuitBreaker = createCircuitBreaker({
      failureThreshold: 3,
      recoveryTimeout: 100, // 100ms for fast testing
      successThreshold: 2,
      failureWindow: 5000,
      halfOpenRequests: 2,
    });
  });

  describe('Initial State', () => {
    test('should start in CLOSED state', () => {
      expect(circuitBreaker.getState('test')).toBe(CIRCUIT_STATES.CLOSED);
    });

    test('should allow requests when closed', () => {
      expect(circuitBreaker.canRequest('test')).toBe(true);
    });

    test('should have zero initial stats', () => {
      const stats = circuitBreaker.getStats('test');
      expect(stats.stats.totalCalls).toBe(0);
      expect(stats.stats.totalFailures).toBe(0);
      expect(stats.stats.totalSuccesses).toBe(0);
    });
  });

  describe('Success Recording', () => {
    test('should record successful calls', () => {
      circuitBreaker.recordSuccess('test');
      circuitBreaker.recordSuccess('test');
      
      const stats = circuitBreaker.getStats('test');
      expect(stats.stats.totalSuccesses).toBe(2);
      expect(stats.stats.totalCalls).toBe(2);
    });

    test('should track last success timestamp', () => {
      const before = Date.now();
      circuitBreaker.recordSuccess('test');
      const after = Date.now();
      
      const stats = circuitBreaker.getStats('test');
      expect(stats.lastSuccess).toBeGreaterThanOrEqual(before);
      expect(stats.lastSuccess).toBeLessThanOrEqual(after);
    });

    test('should remain closed after successes', () => {
      circuitBreaker.recordSuccess('test');
      circuitBreaker.recordSuccess('test');
      
      expect(circuitBreaker.getState('test')).toBe(CIRCUIT_STATES.CLOSED);
    });
  });

  describe('Failure Recording', () => {
    test('should record failed calls', () => {
      circuitBreaker.recordFailure('test', new Error('API error'));
      
      const stats = circuitBreaker.getStats('test');
      expect(stats.stats.totalFailures).toBe(1);
      expect(stats.failuresInWindow).toBe(1);
    });

    test('should track last failure timestamp', () => {
      const before = Date.now();
      circuitBreaker.recordFailure('test');
      const after = Date.now();
      
      const stats = circuitBreaker.getStats('test');
      expect(stats.lastFailure).toBeGreaterThanOrEqual(before);
      expect(stats.lastFailure).toBeLessThanOrEqual(after);
    });

    test('should reset consecutive successes on failure', () => {
      circuitBreaker.recordSuccess('test');
      circuitBreaker.recordSuccess('test');
      circuitBreaker.recordFailure('test');
      
      // Record success again and check consecutiveSuccesses restarted
      circuitBreaker.recordSuccess('test');
      const state = circuitBreaker.getProviderState('test');
      expect(state.consecutiveSuccesses).toBe(1);
    });
  });

  describe('State Transitions: CLOSED -> OPEN', () => {
    test('should open circuit after failure threshold', () => {
      // Record failures up to threshold
      circuitBreaker.recordFailure('test', new Error('Error 1'));
      circuitBreaker.recordFailure('test', new Error('Error 2'));
      expect(circuitBreaker.getState('test')).toBe(CIRCUIT_STATES.CLOSED);
      
      circuitBreaker.recordFailure('test', new Error('Error 3'));
      expect(circuitBreaker.getState('test')).toBe(CIRCUIT_STATES.OPEN);
    });

    test('should block requests when open', () => {
      // Open the circuit
      circuitBreaker.recordFailure('test');
      circuitBreaker.recordFailure('test');
      circuitBreaker.recordFailure('test');
      
      expect(circuitBreaker.canRequest('test')).toBe(false);
    });

    test('should track circuit opens in stats', () => {
      circuitBreaker.recordFailure('test');
      circuitBreaker.recordFailure('test');
      circuitBreaker.recordFailure('test');
      
      const stats = circuitBreaker.getStats('test');
      expect(stats.stats.circuitOpens).toBe(1);
    });
  });

  describe('State Transitions: OPEN -> HALF_OPEN', () => {
    test('should transition to half-open after recovery timeout', async () => {
      // Open the circuit
      circuitBreaker.recordFailure('test');
      circuitBreaker.recordFailure('test');
      circuitBreaker.recordFailure('test');
      expect(circuitBreaker.getState('test')).toBe(CIRCUIT_STATES.OPEN);
      
      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Check if can request (which triggers transition)
      expect(circuitBreaker.canRequest('test')).toBe(true);
      expect(circuitBreaker.getState('test')).toBe(CIRCUIT_STATES.HALF_OPEN);
    });

    test('should not transition before recovery timeout', async () => {
      circuitBreaker.recordFailure('test');
      circuitBreaker.recordFailure('test');
      circuitBreaker.recordFailure('test');
      
      // Wait less than recovery timeout
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(circuitBreaker.canRequest('test')).toBe(false);
      expect(circuitBreaker.getState('test')).toBe(CIRCUIT_STATES.OPEN);
    });
  });

  describe('State Transitions: HALF_OPEN -> CLOSED', () => {
    test('should close circuit after success threshold in half-open', async () => {
      // Open then transition to half-open
      circuitBreaker.recordFailure('test');
      circuitBreaker.recordFailure('test');
      circuitBreaker.recordFailure('test');
      await new Promise(resolve => setTimeout(resolve, 150));
      circuitBreaker.canRequest('test'); // Trigger half-open transition
      
      expect(circuitBreaker.getState('test')).toBe(CIRCUIT_STATES.HALF_OPEN);
      
      // Record successes to meet threshold
      circuitBreaker.recordSuccess('test');
      expect(circuitBreaker.getState('test')).toBe(CIRCUIT_STATES.HALF_OPEN);
      
      circuitBreaker.recordSuccess('test');
      expect(circuitBreaker.getState('test')).toBe(CIRCUIT_STATES.CLOSED);
    });
  });

  describe('State Transitions: HALF_OPEN -> OPEN', () => {
    test('should reopen circuit on failure in half-open state', async () => {
      // Open then transition to half-open
      circuitBreaker.recordFailure('test');
      circuitBreaker.recordFailure('test');
      circuitBreaker.recordFailure('test');
      await new Promise(resolve => setTimeout(resolve, 150));
      circuitBreaker.canRequest('test');
      
      expect(circuitBreaker.getState('test')).toBe(CIRCUIT_STATES.HALF_OPEN);
      
      // Single failure reopens circuit
      circuitBreaker.recordFailure('test');
      expect(circuitBreaker.getState('test')).toBe(CIRCUIT_STATES.OPEN);
    });
  });

  describe('execute() Method', () => {
    test('should execute function when circuit is closed', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      
      const result = await circuitBreaker.execute(mockFn, { provider: 'test' });
      
      expect(mockFn).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
    });

    test('should throw CircuitOpenError when circuit is open', async () => {
      // Open the circuit
      circuitBreaker.recordFailure('test');
      circuitBreaker.recordFailure('test');
      circuitBreaker.recordFailure('test');
      
      const mockFn = vi.fn();
      
      await expect(
        circuitBreaker.execute(mockFn, { provider: 'test' })
      ).rejects.toThrow(CircuitOpenError);
      
      expect(mockFn).not.toHaveBeenCalled();
    });

    test('should return error object when throwOnOpen is false', async () => {
      circuitBreaker.recordFailure('test');
      circuitBreaker.recordFailure('test');
      circuitBreaker.recordFailure('test');
      
      const mockFn = vi.fn();
      
      const result = await circuitBreaker.execute(mockFn, { 
        provider: 'test',
        throwOnOpen: false,
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Circuit breaker is OPEN');
    });

    test('should use fallback when circuit is open', async () => {
      circuitBreaker.recordFailure('test');
      circuitBreaker.recordFailure('test');
      circuitBreaker.recordFailure('test');
      
      const mockFn = vi.fn();
      const fallbackFn = vi.fn().mockResolvedValue('fallback result');
      
      const result = await circuitBreaker.execute(mockFn, {
        provider: 'test',
        fallback: fallbackFn,
      });
      
      expect(mockFn).not.toHaveBeenCalled();
      expect(fallbackFn).toHaveBeenCalled();
      expect(result.result).toBe('fallback result');
      expect(result.usedFallback).toBe(true);
    });

    test('should record success on successful execution', async () => {
      const mockFn = vi.fn().mockResolvedValue('ok');
      
      await circuitBreaker.execute(mockFn, { provider: 'test' });
      
      const stats = circuitBreaker.getStats('test');
      expect(stats.stats.totalSuccesses).toBe(1);
    });

    test('should record failure and potentially open circuit', async () => {
      const failingFn = vi.fn().mockRejectedValue(new Error('API down'));
      
      // Execute until circuit opens
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingFn, { provider: 'test' });
        } catch {
          // Expected
        }
      }
      
      const stats = circuitBreaker.getStats('test');
      expect(stats.stats.totalFailures).toBe(3);
      expect(stats.state).toBe(CIRCUIT_STATES.OPEN);
    });
  });

  describe('Per-Provider Tracking', () => {
    test('should track state independently per provider', () => {
      // Open circuit for provider A
      circuitBreaker.recordFailure('provider-a');
      circuitBreaker.recordFailure('provider-a');
      circuitBreaker.recordFailure('provider-a');
      
      expect(circuitBreaker.getState('provider-a')).toBe(CIRCUIT_STATES.OPEN);
      expect(circuitBreaker.getState('provider-b')).toBe(CIRCUIT_STATES.CLOSED);
    });

    test('should allow requests to healthy provider when another is failing', () => {
      circuitBreaker.recordFailure('anthropic');
      circuitBreaker.recordFailure('anthropic');
      circuitBreaker.recordFailure('anthropic');
      
      expect(circuitBreaker.canRequest('anthropic')).toBe(false);
      expect(circuitBreaker.canRequest('openai')).toBe(true);
    });
  });

  describe('Manual Reset', () => {
    test('should reset circuit to closed state', () => {
      circuitBreaker.recordFailure('test');
      circuitBreaker.recordFailure('test');
      circuitBreaker.recordFailure('test');
      expect(circuitBreaker.getState('test')).toBe(CIRCUIT_STATES.OPEN);
      
      circuitBreaker.reset('test');
      
      expect(circuitBreaker.getState('test')).toBe(CIRCUIT_STATES.CLOSED);
      expect(circuitBreaker.canRequest('test')).toBe(true);
    });

    test('should clear failure history on reset', () => {
      circuitBreaker.recordFailure('test');
      circuitBreaker.recordFailure('test');
      
      circuitBreaker.reset('test');
      
      const stats = circuitBreaker.getStats('test');
      expect(stats.failuresInWindow).toBe(0);
    });
  });

  describe('Statistics', () => {
    test('should provide comprehensive stats', () => {
      circuitBreaker.recordSuccess('test');
      circuitBreaker.recordFailure('test');
      circuitBreaker.recordSuccess('test');
      
      const stats = circuitBreaker.getStats('test');
      
      expect(stats).toHaveProperty('provider');
      expect(stats).toHaveProperty('state');
      expect(stats).toHaveProperty('stats');
      expect(stats).toHaveProperty('failuresInWindow');
      expect(stats).toHaveProperty('lastFailure');
      expect(stats).toHaveProperty('lastSuccess');
      expect(stats).toHaveProperty('config');
      
      expect(stats.stats.totalCalls).toBe(3);
      expect(stats.stats.totalSuccesses).toBe(2);
      expect(stats.stats.totalFailures).toBe(1);
    });

    test('should include recovery time when open', () => {
      circuitBreaker.recordFailure('test');
      circuitBreaker.recordFailure('test');
      circuitBreaker.recordFailure('test');
      
      const stats = circuitBreaker.getStats('test');
      
      expect(stats).toHaveProperty('recoveryIn');
      expect(stats.recoveryIn).toBeGreaterThan(0);
      expect(stats.recoveryIn).toBeLessThanOrEqual(100);
    });

    test('should return all provider stats', () => {
      circuitBreaker.recordSuccess('provider-a');
      circuitBreaker.recordFailure('provider-b');
      
      const allStats = circuitBreaker.getAllStats();
      
      expect(allStats).toHaveProperty('provider-a');
      expect(allStats).toHaveProperty('provider-b');
    });
  });

  describe('CircuitOpenError', () => {
    test('should include error details', () => {
      const error = new CircuitOpenError('Test error', {
        provider: 'anthropic',
        state: CIRCUIT_STATES.OPEN,
      });
      
      expect(error.name).toBe('CircuitOpenError');
      expect(error.code).toBe('CIRCUIT_OPEN');
      expect(error.details.provider).toBe('anthropic');
    });
  });

  describe('Failure Window', () => {
    test('should only count failures within time window', async () => {
      // Create breaker with very short failure window
      const shortWindowBreaker = createCircuitBreaker({
        failureThreshold: 3,
        failureWindow: 50, // 50ms window
        recoveryTimeout: 100,
      });
      
      // Record two failures
      shortWindowBreaker.recordFailure('test');
      shortWindowBreaker.recordFailure('test');
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 60));
      
      // These failures should start fresh count
      shortWindowBreaker.recordFailure('test');
      shortWindowBreaker.recordFailure('test');
      
      // Should still be closed (only 2 failures in window)
      expect(shortWindowBreaker.getState('test')).toBe(CIRCUIT_STATES.CLOSED);
    });
  });
});
