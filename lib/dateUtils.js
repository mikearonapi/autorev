/**
 * Date Formatting Utilities - Single Source of Truth
 * 
 * Centralized date formatting functions used across the codebase.
 * All event-related date formatting should use these functions.
 * 
 * @module lib/dateUtils
 */

// =============================================================================
// DATE PARSING
// =============================================================================

/**
 * Parse a date string safely, handling YYYY-MM-DD format correctly
 * Appends T00:00:00 to avoid timezone issues with date-only strings
 * 
 * @param {string|Date} dateInput - Date string (YYYY-MM-DD) or Date object
 * @returns {Date} - Parsed Date object
 */
export function parseDate(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return dateInput;
  
  // Handle YYYY-MM-DD format by appending time to avoid timezone issues
  const dateStr = String(dateInput);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T00:00:00');
  }
  
  return new Date(dateInput);
}

// =============================================================================
// EVENT DATE FORMATTING
// =============================================================================

/**
 * Format date for event display (e.g., "Jan 15, 2026")
 * 
 * @param {string|Date} dateInput - Date to format
 * @returns {string} - Formatted date string
 */
export function formatEventDate(dateInput) {
  const date = parseDate(dateInput);
  if (!date || isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date showing full weekday (e.g., "Saturday, January 15, 2026")
 * 
 * @param {string|Date} dateInput - Date to format
 * @returns {string} - Formatted date string
 */
export function formatEventDateFull(dateInput) {
  const date = parseDate(dateInput);
  if (!date || isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date for event cards (e.g., "Sat, Jan 15")
 * 
 * @param {string|Date} dateInput - Date to format
 * @returns {string} - Formatted date string
 */
export function formatEventDateShort(dateInput) {
  const date = parseDate(dateInput);
  if (!date || isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get month abbreviation for calendar display (e.g., "JAN")
 * 
 * @param {string|Date} dateInput - Date to get month from
 * @returns {string} - Uppercase month abbreviation
 */
export function getMonthAbbrev(dateInput) {
  const date = parseDate(dateInput);
  if (!date || isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
}

/**
 * Get day of month (e.g., 15)
 * 
 * @param {string|Date} dateInput - Date to get day from
 * @returns {number} - Day of month
 */
export function getDayOfMonth(dateInput) {
  const date = parseDate(dateInput);
  if (!date || isNaN(date.getTime())) return 0;
  
  return date.getDate();
}

/**
 * Get weekday abbreviation (e.g., "Sat")
 * 
 * @param {string|Date} dateInput - Date to get weekday from
 * @returns {string} - Weekday abbreviation
 */
export function getWeekdayAbbrev(dateInput) {
  const date = parseDate(dateInput);
  if (!date || isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

// =============================================================================
// DATE COMPARISON
// =============================================================================

/**
 * Check if a date is in the past
 * 
 * @param {string|Date} dateInput - Date to check
 * @returns {boolean} - True if date is before today
 */
export function isPastDate(dateInput) {
  const date = parseDate(dateInput);
  if (!date || isNaN(date.getTime())) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Check if a date is today
 * 
 * @param {string|Date} dateInput - Date to check
 * @returns {boolean} - True if date is today
 */
export function isToday(dateInput) {
  const date = parseDate(dateInput);
  if (!date || isNaN(date.getTime())) return false;
  
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is in the future
 * 
 * @param {string|Date} dateInput - Date to check
 * @returns {boolean} - True if date is after today
 */
export function isFutureDate(dateInput) {
  const date = parseDate(dateInput);
  if (!date || isNaN(date.getTime())) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
}

// =============================================================================
// CALENDAR HELPERS
// =============================================================================

/**
 * Get number of days in a month
 * 
 * @param {number} year - Full year (e.g., 2026)
 * @param {number} month - Month (0-11)
 * @returns {number} - Days in month
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the day of week for the first day of a month (0=Sunday)
 * 
 * @param {number} year - Full year
 * @param {number} month - Month (0-11)
 * @returns {number} - Day of week (0-6)
 */
export function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

/**
 * Format a date as YYYY-MM-DD for API/comparison use
 * 
 * @param {number} year - Full year
 * @param {number} month - Month (0-11)
 * @param {number} day - Day of month
 * @returns {string} - ISO date string (YYYY-MM-DD)
 */
export function toISODateString(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Get today's date as YYYY-MM-DD
 * 
 * @returns {string} - Today's date in ISO format
 */
export function getTodayISO() {
  const today = new Date();
  return toISODateString(today.getFullYear(), today.getMonth(), today.getDate());
}

// =============================================================================
// RELATIVE DATE FORMATTING
// =============================================================================

/**
 * Format a date relative to now (e.g., "2 days ago", "in 3 weeks")
 * 
 * @param {string|Date} dateInput - Date to format
 * @returns {string} - Relative date string
 */
export function formatRelativeDate(dateInput) {
  const date = parseDate(dateInput);
  if (!date || isNaN(date.getTime())) return '';
  
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  
  if (diffDays > 0) {
    if (diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 30) return `In ${Math.round(diffDays / 7)} weeks`;
    if (diffDays < 365) return `In ${Math.round(diffDays / 30)} months`;
    return `In ${Math.round(diffDays / 365)} years`;
  } else {
    const absDays = Math.abs(diffDays);
    if (absDays < 7) return `${absDays} days ago`;
    if (absDays < 30) return `${Math.round(absDays / 7)} weeks ago`;
    if (absDays < 365) return `${Math.round(absDays / 30)} months ago`;
    return `${Math.round(absDays / 365)} years ago`;
  }
}

// =============================================================================
// TIMESTAMP FORMATTING
// =============================================================================

/**
 * Format a timestamp for display (e.g., "Jan 15, 2026 at 3:30 PM")
 * 
 * @param {string|Date} dateInput - Timestamp to format
 * @returns {string} - Formatted timestamp
 */
export function formatTimestamp(dateInput) {
  const date = parseDate(dateInput);
  if (!date || isNaN(date.getTime())) return '';
  
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format time only (e.g., "3:30 PM")
 * 
 * @param {string|Date} dateInput - Timestamp to format
 * @returns {string} - Formatted time
 */
export function formatTime(dateInput) {
  const date = parseDate(dateInput);
  if (!date || isNaN(date.getTime())) return '';
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format date as month and short year (e.g., "Jan '26")
 * Useful for price history charts and timelines
 * 
 * @param {string|Date} dateInput - Date to format
 * @returns {string} - Formatted month/year
 */
export function formatMonthYear(dateInput) {
  const date = parseDate(dateInput);
  if (!date || isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

/**
 * Format date simply (e.g., "1/15/2026")
 * For basic date display without time
 * 
 * @param {string|Date} dateInput - Date to format
 * @returns {string} - Formatted date
 */
export function formatDateSimple(dateInput) {
  const date = parseDate(dateInput);
  if (!date || isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString();
}

// Default export for convenient destructuring
const dateUtils = {
  parseDate,
  formatEventDate,
  formatEventDateFull,
  formatEventDateShort,
  getMonthAbbrev,
  getDayOfMonth,
  getWeekdayAbbrev,
  isPastDate,
  isToday,
  isFutureDate,
  getDaysInMonth,
  getFirstDayOfMonth,
  formatMonthYear,
  formatDateSimple,
  toISODateString,
  getTodayISO,
  formatRelativeDate,
  formatTimestamp,
  formatTime,
};

export default dateUtils;
