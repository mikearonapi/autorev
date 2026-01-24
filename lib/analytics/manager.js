/**
 * Analytics Manager
 * 
 * Unified analytics abstraction layer that enables switching analytics backends
 * without code changes. All analytics calls go through this manager which
 * distributes them to registered providers.
 * 
 * @module lib/analytics/manager
 * 
 * @example
 * import { analytics } from '@/lib/analytics/manager';
 * 
 * // Register providers on app init
 * analytics.registerProvider(posthogProvider);
 * analytics.registerProvider(ga4Provider);
 * 
 * // Track events (goes to all providers)
 * analytics.track('Button Clicked', { button_id: 'cta-hero' });
 * 
 * // Identify user (goes to all providers)
 * analytics.identify('user-123', { email: 'user@example.com' });
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * @typedef {Object} AnalyticsProvider
 * @property {string} name - Provider identifier (e.g., 'posthog', 'ga4')
 * @property {function(string, Object): void} track - Track an event
 * @property {function(string, Object=): void} [identify] - Identify a user
 * @property {function(string=, Object=): void} [page] - Track a page view
 * @property {function(): void} [reset] - Reset user identity
 * @property {function(): Promise<void>} [initialize] - Initialize the provider
 * @property {function(): boolean} [isReady] - Check if provider is ready
 */

/**
 * @typedef {Object} AnalyticsOptions
 * @property {boolean} [debug=false] - Enable debug logging
 * @property {boolean} [batchEvents=false] - Batch events for efficiency
 * @property {number} [batchSize=10] - Number of events to batch
 * @property {number} [batchInterval=5000] - Batch flush interval in ms
 */

// =============================================================================
// ANALYTICS MANAGER CLASS
// =============================================================================

class AnalyticsManager {
  /**
   * @param {AnalyticsOptions} [options]
   */
  constructor(options = {}) {
    /** @type {Map<string, AnalyticsProvider>} */
    this.providers = new Map();
    
    /** @type {boolean} */
    this.initialized = false;
    
    /** @type {boolean} */
    this.debug = options.debug || process.env.NODE_ENV === 'development';
    
    /** @type {Array<{event: string, properties: Object, timestamp: number}>} */
    this.eventQueue = [];
    
    /** @type {boolean} */
    this.batchEvents = options.batchEvents || false;
    
    /** @type {number} */
    this.batchSize = options.batchSize || 10;
    
    /** @type {number} */
    this.batchInterval = options.batchInterval || 5000;
    
    /** @type {number|null} */
    this.batchTimer = null;
  }

  /**
   * Register an analytics provider
   * 
   * @param {AnalyticsProvider} provider
   */
  registerProvider(provider) {
    if (!provider.name) {
      console.error('[Analytics] Provider must have a name');
      return;
    }
    
    if (!provider.track) {
      console.error(`[Analytics] Provider "${provider.name}" must have a track method`);
      return;
    }
    
    this.providers.set(provider.name, provider);
    
    if (this.debug) {
      console.log(`[Analytics] Registered provider: ${provider.name}`);
    }
  }

  /**
   * Unregister an analytics provider
   * 
   * @param {string} providerName
   */
  unregisterProvider(providerName) {
    this.providers.delete(providerName);
    
    if (this.debug) {
      console.log(`[Analytics] Unregistered provider: ${providerName}`);
    }
  }

  /**
   * Initialize all registered providers
   * 
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    const initPromises = Array.from(this.providers.values())
      .filter(p => typeof p.initialize === 'function')
      .map(p => p.initialize().catch(err => {
        console.error(`[Analytics] Failed to initialize ${p.name}:`, err);
      }));

    await Promise.all(initPromises);
    this.initialized = true;

    if (this.debug) {
      console.log('[Analytics] All providers initialized');
    }

    // Start batch timer if batching is enabled
    if (this.batchEvents) {
      this._startBatchTimer();
    }
  }

  /**
   * Track an event to all providers
   * 
   * @param {string} event - Event name (should follow "Object + Past-Tense Verb" convention)
   * @param {Object} [properties={}] - Event properties
   */
  track(event, properties = {}) {
    // Add common properties
    const enrichedProperties = {
      ...properties,
      timestamp: properties.timestamp || new Date().toISOString(),
    };

    if (this.batchEvents) {
      this._queueEvent(event, enrichedProperties);
      return;
    }

    this._sendToProviders('track', event, enrichedProperties);
  }

  /**
   * Identify a user across all providers
   * 
   * @param {string} userId - User's unique identifier
   * @param {Object} [traits={}] - User traits/properties
   */
  identify(userId, traits = {}) {
    this._sendToProviders('identify', userId, traits);

    if (this.debug) {
      console.log(`[Analytics] User identified: ${userId.slice(0, 8)}...`);
    }
  }

  /**
   * Track a page view across all providers
   * 
   * @param {string} [pageName] - Page name/title
   * @param {Object} [properties={}] - Additional properties
   */
  page(pageName, properties = {}) {
    this._sendToProviders('page', pageName, properties);
  }

  /**
   * Reset user identity across all providers (call on logout)
   */
  reset() {
    this._sendToProviders('reset');

    if (this.debug) {
      console.log('[Analytics] User identity reset');
    }
  }

  /**
   * Flush any queued events immediately
   * 
   * @returns {Promise<void>}
   */
  async flush() {
    if (this.eventQueue.length === 0) {
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    for (const { event, properties } of events) {
      this._sendToProviders('track', event, properties);
    }

    if (this.debug) {
      console.log(`[Analytics] Flushed ${events.length} events`);
    }
  }

  /**
   * Get a specific provider by name
   * 
   * @param {string} name
   * @returns {AnalyticsProvider|undefined}
   */
  getProvider(name) {
    return this.providers.get(name);
  }

  /**
   * Check if a provider is registered
   * 
   * @param {string} name
   * @returns {boolean}
   */
  hasProvider(name) {
    return this.providers.has(name);
  }

  /**
   * Get list of registered provider names
   * 
   * @returns {string[]}
   */
  getProviderNames() {
    return Array.from(this.providers.keys());
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  /**
   * Send a method call to all providers
   * 
   * @private
   * @param {string} method
   * @param {...any} args
   */
  _sendToProviders(method, ...args) {
    this.providers.forEach((provider, name) => {
      if (typeof provider[method] !== 'function') {
        return;
      }

      try {
        provider[method](...args);
      } catch (error) {
        console.error(`[Analytics] ${name}.${method} failed:`, error);
      }
    });
  }

  /**
   * Queue an event for batching
   * 
   * @private
   * @param {string} event
   * @param {Object} properties
   */
  _queueEvent(event, properties) {
    this.eventQueue.push({
      event,
      properties,
      timestamp: Date.now(),
    });

    // Flush if batch size reached
    if (this.eventQueue.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Start the batch timer
   * 
   * @private
   */
  _startBatchTimer() {
    if (this.batchTimer) {
      return;
    }

    this.batchTimer = setInterval(() => {
      this.flush();
    }, this.batchInterval);
  }

  /**
   * Stop the batch timer
   * 
   * @private
   */
  _stopBatchTimer() {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Global analytics manager instance
 * @type {AnalyticsManager}
 */
export const analytics = new AnalyticsManager({
  debug: process.env.NODE_ENV === 'development',
});

// =============================================================================
// EXPORTS
// =============================================================================

export { AnalyticsManager };
export default analytics;
