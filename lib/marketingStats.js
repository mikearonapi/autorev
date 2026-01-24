/**
 * Marketing Statistics - Single Source of Truth
 * 
 * This file provides marketing-friendly statistics for the UI.
 * These values are used across marketing pages, join pages, and feature lists.
 * 
 * IMPORTANT: Update these values when database counts change significantly.
 * Run the following query to get current counts:
 * 
 *   SELECT 
 *     (SELECT COUNT(*) FROM cars) as car_count,
 *     (SELECT COUNT(*) FROM events) as event_count;
 * 
 * Last verified: 2026-01-22
 * Car count: 310
 * Event count: 8,650
 * 
 * @module lib/marketingStats
 */

// =============================================================================
// MARKETING-FRIENDLY DISPLAY COUNTS
// =============================================================================
// These are rounded/approximate values suitable for marketing copy.
// They use "+" suffix to indicate "at least this many" which stays accurate
// longer than exact counts.

/**
 * Marketing-friendly car count (e.g., "300+")
 * Update when actual count exceeds next threshold (350, 400, etc.)
 */
export const CAR_COUNT_DISPLAY = '300+';

/**
 * Marketing-friendly event count (e.g., "8,500+")
 * Update when actual count exceeds next threshold
 */
export const EVENT_COUNT_DISPLAY = '8,500+';

/**
 * Marketing-friendly user count (update periodically)
 */
export const USER_COUNT_DISPLAY = '2,500+';

// =============================================================================
// EXACT COUNTS (for places needing precision)
// =============================================================================
// These are the approximate actual counts - use for calculations, not display.
// Update these based on the SQL query above.

/**
 * Approximate car count for calculations (not display)
 */
export const CAR_COUNT_APPROX = 310;

/**
 * Approximate event count for calculations (not display)
 */
export const EVENT_COUNT_APPROX = 8650;

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

/**
 * Get the car database description string
 * @param {string} [suffix='sports car database'] - Optional suffix
 * @returns {string} E.g., "300+ sports car database"
 */
export function getCarDatabaseLabel(suffix = 'sports car database') {
  return `${CAR_COUNT_DISPLAY} ${suffix}`;
}

/**
 * Get the event count description string
 * @param {string} [suffix='car events'] - Optional suffix
 * @returns {string} E.g., "8,500+ car events"
 */
export function getEventCountLabel(suffix = 'car events') {
  return `${EVENT_COUNT_DISPLAY} ${suffix}`;
}

// =============================================================================
// FEATURE STRINGS (for consistent marketing copy)
// =============================================================================

/**
 * Pre-built marketing strings for common use cases
 */
export const MARKETING_STRINGS = {
  carDatabase: `Full ${CAR_COUNT_DISPLAY}-car database`,
  carDatabaseShort: `${CAR_COUNT_DISPLAY} sports cars`,
  eventDatabase: `${EVENT_COUNT_DISPLAY} car events`,
  browsePrompt: `Explore ${CAR_COUNT_DISPLAY} sports cars`,
};

// Default export for convenient destructuring
export default {
  CAR_COUNT_DISPLAY,
  EVENT_COUNT_DISPLAY,
  USER_COUNT_DISPLAY,
  CAR_COUNT_APPROX,
  EVENT_COUNT_APPROX,
  getCarDatabaseLabel,
  getEventCountLabel,
  MARKETING_STRINGS,
};
