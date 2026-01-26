/**
 * Username Availability Check API
 * 
 * Validates username format and checks availability using database functions.
 * 
 * GET /api/user/check-username?username=xxx
 * 
 * @module app/api/user/check-username
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

// Service role client for calling database functions
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Reserved usernames that can't be used (in addition to DB check)
const RESERVED_USERNAMES = [
  'admin', 'api', 'app', 'auth', 'autorev', 'browse', 'cars', 'community',
  'compare', 'contact', 'events', 'garage', 'help', 'home', 'internal',
  'join', 'login', 'logout', 'mod', 'profile', 'settings', 'signup',
  'support', 'terms', 'tuning', 'user', 'users', 'www', 'al'
];

/**
 * Validate username format client-side (mirrors DB function)
 */
function validateUsernameFormat(username) {
  // Must be 3-30 characters
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  if (username.length > 30) {
    return { valid: false, error: 'Username must be 30 characters or less' };
  }
  
  // Must be lowercase alphanumeric with underscores/hyphens
  if (!/^[a-z0-9][a-z0-9_-]*[a-z0-9]$/.test(username) && username.length > 2) {
    return { 
      valid: false, 
      error: 'Username must start and end with a letter or number, and can contain underscores and hyphens' 
    };
  }
  
  // Single character check for 3-char usernames
  if (username.length === 3 && !/^[a-z0-9]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters and numbers' };
  }
  
  // Check reserved
  if (RESERVED_USERNAMES.includes(username)) {
    return { valid: false, error: 'This username is reserved' };
  }
  
  return { valid: true, error: null };
}

/**
 * GET /api/user/check-username
 * 
 * Check if a username is available
 */
async function handleGet(request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username')?.toLowerCase()?.trim();
  
  if (!username) {
    return NextResponse.json({ 
      available: false, 
      error: 'Username is required' 
    }, { status: 400 });
  }
  
  // First validate format
  const formatCheck = validateUsernameFormat(username);
  if (!formatCheck.valid) {
    return NextResponse.json({ 
      available: false, 
      error: formatCheck.error 
    });
  }
  
  try {
    // Check availability using database function
    const { data, error } = await supabaseAdmin.rpc('is_public_slug_available', {
      slug: username
    });
    
    if (error) {
      console.error('[CheckUsername] RPC error:', error);
      return NextResponse.json({ 
        available: false, 
        error: 'Unable to check availability' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      available: data === true,
      error: data === true ? null : 'Username is already taken'
    });
    
  } catch (err) {
    console.error('[CheckUsername] Error:', err);
    return NextResponse.json({ 
      available: false, 
      error: 'Unable to check availability' 
    }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, {
  route: 'user/check-username',
  feature: 'profile',
});
