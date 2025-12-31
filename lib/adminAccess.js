/**
 * Admin Access Control
 * 
 * Email-based admin verification for the AutoRev admin dashboard.
 * Only specific users can access admin features.
 * 
 * @module lib/adminAccess
 */

import { createClient } from '@supabase/supabase-js';

// Authorized admin emails
const ADMIN_EMAILS = [
  'mjaron5@gmail.com',
  'mike@mikearon.com',
  'corhughes@gmail.com',
];

/**
 * Check if an email is an admin
 * @param {string} email - Email to check
 * @returns {boolean}
 */
export function isAdminEmail(email) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

/**
 * Get admin status from Supabase session
 * Server-side only - requires service role key
 * @param {Request} request - Next.js request object (optional, for cookie-based auth)
 * @returns {Promise<{ isAdmin: boolean, user: object|null, error: string|null }>}
 */
export async function getAdminFromRequest(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return { isAdmin: false, user: null, error: 'Supabase not configured' };
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Get auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { isAdmin: false, user: null, error: 'No auth token provided' };
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { isAdmin: false, user: null, error: error?.message || 'Invalid token' };
    }
    
    const isAdmin = isAdminEmail(user.email);
    return { isAdmin, user, error: null };
  } catch (err) {
    return { isAdmin: false, user: null, error: err.message };
  }
}

/**
 * Get admin status from user ID
 * Server-side only
 * @param {string} userId - Supabase user ID
 * @returns {Promise<{ isAdmin: boolean, email: string|null, error: string|null }>}
 */
export async function getAdminFromUserId(userId) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return { isAdmin: false, email: null, error: 'Supabase not configured' };
  }
  
  if (!userId) {
    return { isAdmin: false, email: null, error: 'No user ID provided' };
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);
    
    if (error || !user) {
      return { isAdmin: false, email: null, error: error?.message || 'User not found' };
    }
    
    const isAdmin = isAdminEmail(user.email);
    return { isAdmin, email: user.email, error: null };
  } catch (err) {
    return { isAdmin: false, email: null, error: err.message };
  }
}

/**
 * Get list of admin emails (for display purposes)
 * @returns {string[]}
 */
export function getAdminEmails() {
  return [...ADMIN_EMAILS];
}

/**
 * Get admin user IDs from the database
 * Used to exclude admin activity from analytics
 * @param {object} supabaseAdmin - Supabase client with service role
 * @returns {Promise<string[]>} Array of admin user UUIDs
 */
export async function getAdminUserIds(supabaseAdmin) {
  try {
    const adminIds = [];
    
    for (const email of ADMIN_EMAILS) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        filter: `email.eq.${email}`
      });
      
      if (!error && data?.users?.[0]?.id) {
        adminIds.push(data.users[0].id);
      }
    }
    
    return adminIds;
  } catch (err) {
    console.error('[getAdminUserIds] Error:', err);
    return [];
  }
}

/**
 * Cached admin user IDs to avoid repeated lookups
 * Cache expires after 1 hour
 */
let cachedAdminIds = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Get admin user IDs with caching
 * @param {object} supabaseAdmin - Supabase client with service role
 * @returns {Promise<string[]>} Array of admin user UUIDs
 */
export async function getAdminUserIdsCached(supabaseAdmin) {
  const now = Date.now();
  
  if (cachedAdminIds && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedAdminIds;
  }
  
  cachedAdminIds = await getAdminUserIds(supabaseAdmin);
  cacheTimestamp = now;
  
  return cachedAdminIds;
}

export default {
  isAdminEmail,
  getAdminFromRequest,
  getAdminFromUserId,
  getAdminEmails,
  getAdminUserIds,
  getAdminUserIdsCached,
  ADMIN_EMAILS,
};

