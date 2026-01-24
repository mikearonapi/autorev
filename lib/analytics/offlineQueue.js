/**
 * Offline Analytics Queue
 * 
 * Provides offline support for analytics events when the user is offline (PWA mode).
 * Events are queued in localStorage and flushed when connectivity is restored.
 * 
 * Features:
 * - Automatic queue management with size limits
 * - Network status detection
 * - Automatic flush on reconnect
 * - Batch sending for efficiency
 * - Persistence across sessions
 * 
 * @module lib/analytics/offlineQueue
 * 
 * @example
 * import { offlineQueue } from '@/lib/analytics/offlineQueue';
 * 
 * // Queue an event (will be sent immediately if online, queued if offline)
 * offlineQueue.enqueue('Button Clicked', { button_id: 'cta' });
 * 
 * // Manually flush the queue
 * await offlineQueue.flush();
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const QUEUE_KEY = 'autorev_analytics_queue';
const MAX_QUEUE_SIZE = 1000;
const MAX_EVENT_AGE_HOURS = 72; // Drop events older than 3 days
const BATCH_SIZE = 50;
const FLUSH_ENDPOINT = '/api/analytics/batch';

// =============================================================================
// OFFLINE QUEUE CLASS
// =============================================================================

class OfflineAnalyticsQueue {
  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.isFlushing = false;
    this.flushPromise = null;
    
    // Set up network listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this._handleOnline.bind(this));
      window.addEventListener('offline', this._handleOffline.bind(this));
    }
  }

  // ===========================================================================
  // PUBLIC METHODS
  // ===========================================================================

  /**
   * Queue an analytics event
   * If online, sends immediately. If offline, stores in queue.
   * 
   * @param {string} event - Event name
   * @param {Object} properties - Event properties
   * @returns {boolean} - true if queued, false if sent immediately
   */
  enqueue(event, properties = {}) {
    const eventData = {
      event,
      properties,
      timestamp: Date.now(),
      id: this._generateId(),
    };

    // If online, try to send immediately
    if (this.isOnline) {
      this._sendImmediate(eventData);
      return false;
    }

    // Otherwise, add to queue
    const queue = this._getQueue();
    queue.push(eventData);

    // Enforce size limit (drop oldest events)
    if (queue.length > MAX_QUEUE_SIZE) {
      queue.splice(0, queue.length - MAX_QUEUE_SIZE);
    }

    this._saveQueue(queue);
    return true;
  }

  /**
   * Flush all queued events to the server
   * 
   * @returns {Promise<{sent: number, failed: number, remaining: number}>}
   */
  async flush() {
    // Prevent concurrent flushes
    if (this.isFlushing) {
      return this.flushPromise;
    }

    this.isFlushing = true;
    this.flushPromise = this._performFlush();
    
    try {
      return await this.flushPromise;
    } finally {
      this.isFlushing = false;
      this.flushPromise = null;
    }
  }

  /**
   * Get the current queue size
   * 
   * @returns {number}
   */
  getQueueSize() {
    return this._getQueue().length;
  }

  /**
   * Clear all queued events
   */
  clear() {
    this._saveQueue([]);
  }

  /**
   * Check if the queue has events
   * 
   * @returns {boolean}
   */
  hasEvents() {
    return this.getQueueSize() > 0;
  }

  /**
   * Get current online status
   * 
   * @returns {boolean}
   */
  getOnlineStatus() {
    return this.isOnline;
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  /**
   * Handle coming online
   * @private
   */
  _handleOnline() {
    this.isOnline = true;
    console.log('[OfflineQueue] Back online, flushing queue...');
    this.flush().catch(console.error);
  }

  /**
   * Handle going offline
   * @private
   */
  _handleOffline() {
    this.isOnline = false;
    console.log('[OfflineQueue] Gone offline, events will be queued');
  }

  /**
   * Perform the actual flush operation
   * @private
   * @returns {Promise<{sent: number, failed: number, remaining: number}>}
   */
  async _performFlush() {
    const results = { sent: 0, failed: 0, remaining: 0 };
    
    let queue = this._getQueue();
    
    // Remove stale events
    const now = Date.now();
    const maxAge = MAX_EVENT_AGE_HOURS * 60 * 60 * 1000;
    queue = queue.filter(e => (now - e.timestamp) < maxAge);
    
    if (queue.length === 0) {
      return results;
    }

    // Process in batches
    while (queue.length > 0) {
      const batch = queue.splice(0, BATCH_SIZE);
      
      try {
        const success = await this._sendBatch(batch);
        if (success) {
          results.sent += batch.length;
        } else {
          // Put events back in queue
          queue.unshift(...batch);
          results.failed += batch.length;
          break; // Stop trying if we can't send
        }
      } catch (error) {
        console.error('[OfflineQueue] Batch send failed:', error);
        queue.unshift(...batch);
        results.failed += batch.length;
        break;
      }
    }

    // Save remaining queue
    this._saveQueue(queue);
    results.remaining = queue.length;

    if (results.sent > 0) {
      console.log(`[OfflineQueue] Flushed ${results.sent} events`);
    }

    return results;
  }

  /**
   * Send a batch of events to the server
   * @private
   * @param {Array} events
   * @returns {Promise<boolean>}
   */
  async _sendBatch(events) {
    try {
      const response = await fetch(FLUSH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      });

      return response.ok;
    } catch (error) {
      // Network error - we're probably offline
      return false;
    }
  }

  /**
   * Send an event immediately (for when we're online)
   * Falls back to queueing if send fails
   * @private
   * @param {Object} eventData
   */
  _sendImmediate(eventData) {
    // Fire and forget - if it fails, the event is lost (acceptable for online mode)
    fetch(FLUSH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: [eventData] }),
      keepalive: true,
    }).catch(() => {
      // Failed to send - queue it
      const queue = this._getQueue();
      queue.push(eventData);
      if (queue.length > MAX_QUEUE_SIZE) {
        queue.shift();
      }
      this._saveQueue(queue);
    });
  }

  /**
   * Get the queue from localStorage
   * @private
   * @returns {Array}
   */
  _getQueue() {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save the queue to localStorage
   * @private
   * @param {Array} queue
   */
  _saveQueue(queue) {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      // localStorage might be full
      console.error('[OfflineQueue] Failed to save queue:', error);
    }
  }

  /**
   * Generate a unique event ID
   * @private
   * @returns {string}
   */
  _generateId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Global offline queue instance
 * @type {OfflineAnalyticsQueue}
 */
export const offlineQueue = new OfflineAnalyticsQueue();

export { OfflineAnalyticsQueue };
export default offlineQueue;
