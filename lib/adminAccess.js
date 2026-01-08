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
 * Known admin user IDs (from database)
 * These are hardcoded for reliability - the auth.admin.listUsers filter doesn't work well
 */
const KNOWN_ADMIN_IDS = [
  '3260fb82-c202-42c4-b51c-98dd6d83a390', // Mike (mjaron5@gmail.com)
  '5d5ea494-f799-459d-ac7a-0688417e471a', // Cory (corhughes@gmail.com)
];

/**
 * Get admin user IDs from the database
 * Used to exclude admin activity from analytics
 * @param {object} supabaseAdmin - Supabase client with service role
 * @returns {Promise<string[]>} Array of admin user UUIDs
 */
export async function getAdminUserIds(supabaseAdmin) {
  try {
    // Start with known IDs
    const adminIds = [...KNOWN_ADMIN_IDS];
    
    // Also try to look up any additional admin emails dynamically
    const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers();
    
    if (allUsers?.users) {
      for (const user of allUsers.users) {
        if (ADMIN_EMAILS.includes(user.email?.toLowerCase()) && !adminIds.includes(user.id)) {
          adminIds.push(user.id);
        }
      }
    }
    
    return adminIds;
  } catch (err) {
    console.error('[getAdminUserIds] Error:', err);
    // Return known IDs as fallback
    return KNOWN_ADMIN_IDS;
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

const adminAccess = {
  isAdminEmail,
  getAdminFromRequest,
  getAdminFromUserId,
  getAdminEmails,
  getAdminUserIds,
  getAdminUserIdsCached,
  ADMIN_EMAILS,
};

export default adminAccess;

