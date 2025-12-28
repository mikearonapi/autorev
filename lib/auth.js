/**
 * Authentication Utilities for AutoRev
 * 
 * Provides helper functions for Supabase Auth operations:
 * - OAuth sign in (Google)
 * - Email/password sign in
 * - Sign out
 * - Session management
 * - User profile operations
 */

import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Sign in with Google OAuth
 * Redirects to Google for authentication, then back to the app
 * 
 * @param {string} redirectTo - URL to redirect to after sign in (optional)
 * @returns {Promise<{error: Error|null}>}
 */
export async function signInWithGoogle(redirectTo) {
  if (!isSupabaseConfigured || !supabase) {
    return { error: new Error('Supabase not configured') };
  }

  const redirectUrl = redirectTo || `${window.location.origin}/auth/callback`;
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  return { error };
}

/**
 * Sign in with email and password
 * 
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function signInWithEmail(email, password) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Supabase not configured') };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

/**
 * Sign up with email and password
 * 
 * @param {string} email 
 * @param {string} password 
 * @param {object} metadata - Optional user metadata (name, etc.)
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function signUpWithEmail(email, password, metadata = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Supabase not configured') };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  return { data, error };
}

/**
 * Sign out the current user
 * 
 * Enhanced to handle stale sessions and ensure complete cleanup.
 * Uses 'local' scope by default to avoid issues with stale server sessions.
 * 
 * @param {Object} options - Sign out options
 * @param {'global'|'local'|'others'} options.scope - Scope of sign out (default: 'local')
 * @returns {Promise<{error: Error|null}>}
 */
export async function signOut({ scope = 'local' } = {}) {
  if (!isSupabaseConfigured || !supabase) {
    return { error: new Error('Supabase not configured') };
  }

  try {
    // First attempt sign out with requested scope
    const { error } = await supabase.auth.signOut({ scope });
    
    // Even if sign out returns an error (e.g., stale session), 
    // we still want to clear local state
    if (error) {
      console.warn('[Auth] Sign out returned error:', error.message);
    }
    
    // Force clear any remaining auth tokens from localStorage
    // This ensures clean state even if server signOut failed
    if (typeof window !== 'undefined') {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.includes('auth')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        console.log('[Auth] Clearing auth key:', key);
        localStorage.removeItem(key);
      });
    }
    
    return { error: null }; // Return success even if server had issues - local state is cleared
  } catch (err) {
    console.error('[Auth] Sign out exception:', err);
    
    // Even on exception, try to clear local storage
    if (typeof window !== 'undefined') {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.includes('auth')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
    
    return { error: err };
  }
}

/**
 * Get the current session
 * 
 * @returns {Promise<{data: {session: object|null}, error: Error|null}>}
 */
export async function getSession() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: { session: null }, error: null };
  }

  const { data, error } = await supabase.auth.getSession();
  return { data, error };
}

/**
 * Get the current user
 * 
 * @returns {Promise<{data: {user: object|null}, error: Error|null}>}
 */
export async function getUser() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: { user: null }, error: null };
  }

  const { data, error } = await supabase.auth.getUser();
  return { data, error };
}

/**
 * Listen to auth state changes
 * 
 * @param {Function} callback - Called with (event, session) on auth changes
 * @returns {Function} Unsubscribe function
 */
export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured || !supabase) {
    return () => {}; // Return no-op unsubscribe
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return () => subscription.unsubscribe();
}

/**
 * Send password reset email
 * 
 * @param {string} email 
 * @returns {Promise<{error: Error|null}>}
 */
export async function resetPassword(email) {
  if (!isSupabaseConfigured || !supabase) {
    return { error: new Error('Supabase not configured') };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  return { error };
}

/**
 * Update user password
 * 
 * @param {string} newPassword 
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function updatePassword(newPassword) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Supabase not configured') };
  }

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  return { data, error };
}

/**
 * Update user metadata (name, avatar, etc.)
 * 
 * @param {object} metadata 
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function updateUserMetadata(metadata) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Supabase not configured') };
  }

  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  });

  return { data, error };
}

// ============================================================================
// User Profile Operations (user_profiles table)
// ============================================================================

/**
 * Get the current user's profile
 * 
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function getUserProfile() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Supabase not configured') };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { data, error };
}

/**
 * Update the current user's profile
 * 
 * @param {object} updates - Profile fields to update
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function updateUserProfile(updates) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Supabase not configured') };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  return { data, error };
}

// ============================================================================
// Auth State Helpers
// ============================================================================

/**
 * Check if user is authenticated
 * 
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
  const { data } = await getSession();
  return !!data?.session;
}

/**
 * Get auth redirect URL for OAuth
 * 
 * @param {string} path - Path to redirect to after auth
 * @returns {string}
 */
export function getAuthRedirectUrl(path = '/') {
  if (typeof window === 'undefined') {
    return path;
  }
  return `${window.location.origin}${path}`;
}
