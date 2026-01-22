/**
 * API Error Utilities
 * 
 * Provides standardized error responses across all API routes.
 * Ensures consistent error format for web PWA, iOS, and Android clients.
 * 
 * @module lib/apiErrors
 */

import { NextResponse } from 'next/server';

/**
 * Standard error codes for API responses
 * These codes help clients handle errors programmatically
 */
export const ErrorCodes = {
  // Authentication errors (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Authorization errors (403)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_TIER: 'INSUFFICIENT_TIER',
  
  // Resource errors (404)
  NOT_FOUND: 'NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  CAR_NOT_FOUND: 'CAR_NOT_FOUND',
  
  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',
  
  // Rate limiting (429)
  RATE_LIMITED: 'RATE_LIMITED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  
  // Server errors (500, 503)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
};

/**
 * Create a standardized API error response
 * 
 * @param {string} code - Error code from ErrorCodes
 * @param {string} message - Human-readable error message
 * @param {number} status - HTTP status code
 * @param {Object} [details] - Optional additional error details
 * @returns {NextResponse} - Formatted error response
 * 
 * @example
 * // Basic usage
 * return apiError(ErrorCodes.NOT_FOUND, 'Car not found', 404);
 * 
 * @example
 * // With details
 * return apiError(ErrorCodes.VALIDATION_ERROR, 'Invalid input', 400, {
 *   field: 'email',
 *   reason: 'Invalid email format'
 * });
 */
export function apiError(code, message, status, details = null) {
  const body = {
    error: message,
    code,
  };
  
  if (details) {
    body.details = details;
  }
  
  return NextResponse.json(body, { status });
}

/**
 * Pre-built error responses for common scenarios
 * Use these for consistency across routes
 */
export const errors = {
  // 400 Bad Request
  badRequest: (message = 'Bad request', details = null) =>
    apiError(ErrorCodes.VALIDATION_ERROR, message, 400, details),
  
  missingField: (field) =>
    apiError(ErrorCodes.MISSING_FIELD, `Missing required field: ${field}`, 400, { field }),
  
  invalidInput: (message, details = null) =>
    apiError(ErrorCodes.INVALID_INPUT, message, 400, details),
  
  // 401 Unauthorized
  unauthorized: (message = 'Authentication required') =>
    apiError(ErrorCodes.UNAUTHORIZED, message, 401),
  
  invalidToken: () =>
    apiError(ErrorCodes.INVALID_TOKEN, 'Invalid or expired token', 401),
  
  // 403 Forbidden
  forbidden: (message = 'Access denied') =>
    apiError(ErrorCodes.FORBIDDEN, message, 403),
  
  insufficientTier: (requiredTier) =>
    apiError(ErrorCodes.INSUFFICIENT_TIER, `This feature requires ${requiredTier} tier`, 403, { requiredTier }),
  
  // 404 Not Found
  notFound: (resource = 'Resource') =>
    apiError(ErrorCodes.NOT_FOUND, `${resource} not found`, 404),
  
  userNotFound: () =>
    apiError(ErrorCodes.USER_NOT_FOUND, 'User not found', 404),
  
  carNotFound: () =>
    apiError(ErrorCodes.CAR_NOT_FOUND, 'Car not found', 404),
  
  // 429 Rate Limited
  rateLimited: (retryAfter = null) =>
    apiError(ErrorCodes.RATE_LIMITED, 'Too many requests', 429, retryAfter ? { retryAfter } : null),
  
  quotaExceeded: (resource = 'requests') =>
    apiError(ErrorCodes.QUOTA_EXCEEDED, `${resource} quota exceeded`, 429),
  
  // 500 Internal Server Error
  internal: (message = 'Internal server error') =>
    apiError(ErrorCodes.INTERNAL_ERROR, message, 500),
  
  database: (message = 'Database error') =>
    apiError(ErrorCodes.DATABASE_ERROR, message, 500),
  
  // 503 Service Unavailable
  serviceUnavailable: (service = 'Service') =>
    apiError(ErrorCodes.SERVICE_UNAVAILABLE, `${service} temporarily unavailable`, 503),
};

export default errors;
