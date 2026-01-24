/**
 * AI Circuit Breaker
 * 
 * Implements the circuit breaker pattern for AI API calls to prevent
 * cascading failures and provide graceful degradation.
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Too many failures, requests fail fast
 * - HALF_OPEN: Testing recovery, limited requests allowed
 * 
 * Usage:
 *   import { aiCircuitBreaker } from '@/lib/aiCircuitBreaker';
 *   
 *   const result = await aiCircuitBreaker.execute(
 *     () => callClaudeAPI(params),
 *     { provider: 'anthropic' }
 *   );
 */

// =============================================================================
// CIRCUIT STATES
// =============================================================================

export const CIRCUIT_STATES = {
  CLOSED: 'closed',
  OPEN: 'open',
  HALF_OPEN: 'half_open',
};

// =============================================================================
// CONFIGURATION
// =============================================================================

const DEFAULT_CONFIG = {
  // Number of failures before opening circuit
  failureThreshold: 5,
  
  // Time in ms to wait before attempting recovery
  recoveryTimeout: 60000, // 60 seconds
  
  // Number of successful calls needed to close circuit from half-open
  successThreshold: 2,
  
  // Time window in ms for counting failures
  failureWindow: 120000, // 2 minutes
  
  // Requests allowed in half-open state for testing
  halfOpenRequests: 3,
  
  // Whether to track failures per-provider
  perProviderTracking: true,
};

// =============================================================================
// CIRCUIT BREAKER CLASS
// =============================================================================

class CircuitBreaker {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Track state per provider (anthropic, openai, cohere, etc.)
    this.providerStates = new Map();
  }

  /**
   * Get or initialize provider state
   */
  getProviderState(provider = 'default') {
    if (!this.providerStates.has(provider)) {
      this.providerStates.set(provider, {
        state: CIRCUIT_STATES.CLOSED,
        failures: [],
        lastFailure: null,
        lastSuccess: null,
        consecutiveSuccesses: 0,
        halfOpenAttempts: 0,
        openedAt: null,
        stats: {
          totalCalls: 0,
          totalFailures: 0,
          totalSuccesses: 0,
          circuitOpens: 0,
        },
      });
    }
    return this.providerStates.get(provider);
  }

  /**
   * Get current circuit state
   */
  getState(provider = 'default') {
    const providerState = this.getProviderState(provider);
    return providerState.state;
  }

  /**
   * Check if circuit allows requests
   */
  canRequest(provider = 'default') {
    const providerState = this.getProviderState(provider);
    
    switch (providerState.state) {
      case CIRCUIT_STATES.CLOSED:
        return true;
        
      case CIRCUIT_STATES.OPEN:
        // Check if recovery timeout has passed
        if (providerState.openedAt && 
            Date.now() - providerState.openedAt > this.config.recoveryTimeout) {
          this.transitionToHalfOpen(provider);
          return true;
        }
        return false;
        
      case CIRCUIT_STATES.HALF_OPEN:
        // Allow limited requests for testing
        return providerState.halfOpenAttempts < this.config.halfOpenRequests;
        
      default:
        return true;
    }
  }

  /**
   * Record a successful call
   */
  recordSuccess(provider = 'default') {
    const providerState = this.getProviderState(provider);
    providerState.lastSuccess = Date.now();
    providerState.consecutiveSuccesses++;
    providerState.stats.totalSuccesses++;
    providerState.stats.totalCalls++;
    
    if (providerState.state === CIRCUIT_STATES.HALF_OPEN) {
      // Check if we can close the circuit
      if (providerState.consecutiveSuccesses >= this.config.successThreshold) {
        this.transitionToClosed(provider);
      }
    }
  }

  /**
   * Record a failed call
   */
  recordFailure(provider = 'default', error = null) {
    const providerState = this.getProviderState(provider);
    const now = Date.now();
    
    providerState.lastFailure = now;
    providerState.consecutiveSuccesses = 0;
    providerState.stats.totalFailures++;
    providerState.stats.totalCalls++;
    
    // Add to failure window
    providerState.failures.push({
      timestamp: now,
      error: error?.message || 'Unknown error',
    });
    
    // Clean up old failures outside the window
    const windowStart = now - this.config.failureWindow;
    providerState.failures = providerState.failures.filter(f => f.timestamp > windowStart);
    
    // Check if we should open the circuit
    if (providerState.state === CIRCUIT_STATES.CLOSED) {
      if (providerState.failures.length >= this.config.failureThreshold) {
        this.transitionToOpen(provider);
      }
    } else if (providerState.state === CIRCUIT_STATES.HALF_OPEN) {
      // Any failure in half-open state reopens the circuit
      this.transitionToOpen(provider);
    }
  }

  /**
   * Transition to OPEN state
   */
  transitionToOpen(provider = 'default') {
    const providerState = this.getProviderState(provider);
    providerState.state = CIRCUIT_STATES.OPEN;
    providerState.openedAt = Date.now();
    providerState.halfOpenAttempts = 0;
    providerState.stats.circuitOpens++;
    
    console.warn(`[Circuit Breaker] Circuit OPENED for provider: ${provider}`, {
      failures: providerState.failures.length,
      threshold: this.config.failureThreshold,
      recoveryTimeout: this.config.recoveryTimeout,
    });
  }

  /**
   * Transition to HALF_OPEN state
   */
  transitionToHalfOpen(provider = 'default') {
    const providerState = this.getProviderState(provider);
    providerState.state = CIRCUIT_STATES.HALF_OPEN;
    providerState.halfOpenAttempts = 0;
    providerState.consecutiveSuccesses = 0;
    
    console.info(`[Circuit Breaker] Circuit HALF-OPEN for provider: ${provider}, testing recovery...`);
  }

  /**
   * Transition to CLOSED state
   */
  transitionToClosed(provider = 'default') {
    const providerState = this.getProviderState(provider);
    providerState.state = CIRCUIT_STATES.CLOSED;
    providerState.failures = [];
    providerState.openedAt = null;
    providerState.halfOpenAttempts = 0;
    
    console.info(`[Circuit Breaker] Circuit CLOSED for provider: ${provider}, recovered successfully`);
  }

  /**
   * Execute a function with circuit breaker protection
   * 
   * @param {Function} fn - Async function to execute
   * @param {Object} options
   * @param {string} options.provider - Provider name for tracking
   * @param {Function} options.fallback - Fallback function if circuit is open
   * @param {boolean} options.throwOnOpen - Throw error if circuit is open (default: true)
   * @returns {Promise<{success: boolean, result?: any, error?: string, circuitState: string}>}
   */
  async execute(fn, options = {}) {
    const { 
      provider = 'default', 
      fallback = null,
      throwOnOpen = true,
    } = options;

    const providerState = this.getProviderState(provider);
    
    // Check if circuit allows request
    if (!this.canRequest(provider)) {
      const error = new CircuitOpenError(
        `Circuit breaker is OPEN for ${provider}. Requests blocked until recovery.`,
        {
          provider,
          state: providerState.state,
          openedAt: providerState.openedAt,
          recoveryIn: this.config.recoveryTimeout - (Date.now() - providerState.openedAt),
        }
      );

      // Try fallback if provided
      if (fallback) {
        try {
          const fallbackResult = await fallback();
          return {
            success: true,
            result: fallbackResult,
            circuitState: providerState.state,
            usedFallback: true,
          };
        } catch (fallbackError) {
          // Fallback also failed
          if (throwOnOpen) throw error;
          return {
            success: false,
            error: error.message,
            circuitState: providerState.state,
            fallbackError: fallbackError.message,
          };
        }
      }

      if (throwOnOpen) throw error;
      return {
        success: false,
        error: error.message,
        circuitState: providerState.state,
      };
    }

    // Track half-open attempts
    if (providerState.state === CIRCUIT_STATES.HALF_OPEN) {
      providerState.halfOpenAttempts++;
    }

    try {
      const result = await fn();
      this.recordSuccess(provider);
      
      return {
        success: true,
        result,
        circuitState: providerState.state,
      };
    } catch (error) {
      this.recordFailure(provider, error);
      
      // If circuit just opened and fallback available, try it
      if (providerState.state === CIRCUIT_STATES.OPEN && fallback) {
        try {
          const fallbackResult = await fallback();
          return {
            success: true,
            result: fallbackResult,
            circuitState: providerState.state,
            usedFallback: true,
            originalError: error.message,
          };
        } catch (fallbackError) {
          throw error; // Re-throw original error
        }
      }

      throw error;
    }
  }

  /**
   * Get statistics for a provider
   */
  getStats(provider = 'default') {
    const providerState = this.getProviderState(provider);
    const now = Date.now();
    
    return {
      provider,
      state: providerState.state,
      stats: { ...providerState.stats },
      failuresInWindow: providerState.failures.length,
      lastFailure: providerState.lastFailure,
      lastSuccess: providerState.lastSuccess,
      openedAt: providerState.openedAt,
      config: {
        failureThreshold: this.config.failureThreshold,
        recoveryTimeout: this.config.recoveryTimeout,
        failureWindow: this.config.failureWindow,
      },
      ...(providerState.state === CIRCUIT_STATES.OPEN && {
        recoveryIn: Math.max(0, this.config.recoveryTimeout - (now - providerState.openedAt)),
      }),
    };
  }

  /**
   * Get stats for all providers
   */
  getAllStats() {
    const stats = {};
    for (const provider of this.providerStates.keys()) {
      stats[provider] = this.getStats(provider);
    }
    return stats;
  }

  /**
   * Manually reset a circuit to closed state
   */
  reset(provider = 'default') {
    const providerState = this.getProviderState(provider);
    providerState.state = CIRCUIT_STATES.CLOSED;
    providerState.failures = [];
    providerState.openedAt = null;
    providerState.halfOpenAttempts = 0;
    providerState.consecutiveSuccesses = 0;
    
    console.info(`[Circuit Breaker] Circuit manually RESET for provider: ${provider}`);
  }

  /**
   * Reset all circuits
   */
  resetAll() {
    for (const provider of this.providerStates.keys()) {
      this.reset(provider);
    }
  }
}

// =============================================================================
// CUSTOM ERROR
// =============================================================================

export class CircuitOpenError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'CircuitOpenError';
    this.code = 'CIRCUIT_OPEN';
    this.details = details;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

// Create a singleton instance with default configuration
export const aiCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  recoveryTimeout: 60000,    // 60 seconds
  successThreshold: 2,
  failureWindow: 120000,     // 2 minutes
  halfOpenRequests: 3,
});

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Execute an Anthropic API call with circuit breaker protection
 */
export async function executeWithCircuitBreaker(fn, options = {}) {
  return aiCircuitBreaker.execute(fn, {
    provider: 'anthropic',
    ...options,
  });
}

/**
 * Check if Anthropic circuit is healthy
 */
export function isAnthropicHealthy() {
  return aiCircuitBreaker.canRequest('anthropic');
}

/**
 * Get Anthropic circuit stats
 */
export function getAnthropicStats() {
  return aiCircuitBreaker.getStats('anthropic');
}

/**
 * Create a new circuit breaker with custom configuration
 */
export function createCircuitBreaker(config = {}) {
  return new CircuitBreaker(config);
}

export default {
  CircuitBreaker,
  aiCircuitBreaker,
  CIRCUIT_STATES,
  CircuitOpenError,
  executeWithCircuitBreaker,
  isAnthropicHealthy,
  getAnthropicStats,
  createCircuitBreaker,
};
