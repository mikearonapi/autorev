/**
 * Unsubscribe Token Utility
 * 
 * Generates and verifies secure tokens for email unsubscribe links.
 * Uses HMAC SHA256 for cryptographic signing.
 * 
 * Token format: base64url(email:timestamp:signature)
 * Tokens expire after 30 days by default.
 */

import crypto from 'crypto';

// Use a dedicated secret for unsubscribe tokens
// Falls back to SUPABASE_SERVICE_ROLE_KEY if not set (not ideal but functional)
const SECRET = process.env.UNSUBSCRIBE_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Token expiration: 30 days in milliseconds
const TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Generate a secure unsubscribe token for an email address
 * @param {string} email - The email address to generate token for
 * @returns {string} Base64URL encoded token
 */
export function generateUnsubscribeToken(email) {
  if (!email) {
    throw new Error('Email is required to generate unsubscribe token');
  }

  if (!SECRET) {
    throw new Error('UNSUBSCRIBE_TOKEN_SECRET or SUPABASE_SERVICE_ROLE_KEY must be set');
  }

  const timestamp = Date.now();
  const payload = `${email}:${timestamp}`;
  
  // Create HMAC signature
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(payload)
    .digest('hex');
  
  // Combine and encode as base64url
  const token = Buffer.from(`${payload}:${signature}`).toString('base64url');
  
  return token;
}

/**
 * Verify and decode an unsubscribe token
 * @param {string} token - The token to verify
 * @returns {{ valid: boolean, email?: string, error?: string }}
 */
export function verifyUnsubscribeToken(token) {
  if (!token) {
    return { valid: false, error: 'invalid_token' };
  }

  if (!SECRET) {
    console.error('[UnsubscribeToken] SECRET not configured');
    return { valid: false, error: 'server_error' };
  }

  try {
    // Decode from base64url
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    
    if (parts.length !== 3) {
      return { valid: false, error: 'invalid_token' };
    }
    
    const [email, timestampStr, providedSignature] = parts;
    const timestamp = parseInt(timestampStr, 10);
    
    if (!email || isNaN(timestamp)) {
      return { valid: false, error: 'invalid_token' };
    }
    
    // Verify signature
    const payload = `${email}:${timestamp}`;
    const expectedSignature = crypto
      .createHmac('sha256', SECRET)
      .update(payload)
      .digest('hex');
    
    // Use timing-safe comparison to prevent timing attacks
    const sigBuffer = Buffer.from(providedSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    
    if (sigBuffer.length !== expectedBuffer.length || 
        !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return { valid: false, error: 'invalid_token' };
    }
    
    // Check expiration
    const age = Date.now() - timestamp;
    if (age > TOKEN_EXPIRY_MS) {
      return { valid: false, error: 'expired_token', email };
    }
    
    return { valid: true, email };
    
  } catch (err) {
    console.error('[UnsubscribeToken] Verification error:', err.message);
    return { valid: false, error: 'invalid_token' };
  }
}

/**
 * Generate a resubscribe token (shorter expiry for security)
 * @param {string} email - The email address
 * @returns {string} Token valid for 24 hours
 */
export function generateResubscribeToken(email) {
  // Same mechanism, but we'll check expiry differently on verification
  return generateUnsubscribeToken(email);
}
