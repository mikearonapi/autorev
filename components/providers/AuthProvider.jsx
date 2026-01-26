'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  signInWithGoogle,
  signInWithFacebook, 
  signInWithEmail, 
  signUpWithEmail, 
  signOut as authSignOut,
  onAuthStateChange,
  getUserProfile,
  updateUserProfile,
} from '@/lib/auth';
import { prefetchAllUserData, clearPrefetchCache } from '@/lib/prefetch';
import { getSessionEarly, clearSessionCache } from '@/lib/sessionCache';
import { useLoadingProgress } from './LoadingProgressProvider';
import { trackSignUp as ga4TrackSignUp, trackLogin as ga4TrackLogin } from '@/lib/ga4';
import dynamic from 'next/dynamic';
import { TRIAL_CONFIG, calculateTrialEndDate } from '@/lib/tierAccess';

// Dynamically import OnboardingFlow to avoid SSR issues
const OnboardingFlow = dynamic(() => import('@/components/onboarding/OnboardingFlow'), {
  ssr: false,
});

// Dynamically import WelcomeToast for fresh login greeting
const WelcomeToast = dynamic(() => import('@/components/WelcomeToast'), {
  ssr: false,
});

// Dynamically import SplashScreen for post-login branded loading
const SplashScreen = dynamic(() => import('@/components/SplashScreen'), {
  ssr: false,
});

/**
 * Auth Context
 * Provides authentication state and methods throughout the app
 */
const AuthContext = createContext(null);

// =============================================================================
// Fresh Login Signal Detection
// =============================================================================
// A "fresh login" triggers the loading overlay. This happens for:
// 1. OAuth callback returns (detected via auth_callback_complete cookie and/or auth_ts param)
// 2. Explicit user-initiated sign-ins (Google button, email/password submit, error banner sign-in)
//
// Silent session recovery (TOKEN_REFRESHED, page refresh) does NOT count as fresh login.
// =============================================================================

/** Storage key for short-lived login intent signal */
const LOGIN_INTENT_KEY = 'autorev_login_intent';

/** How long the login intent signal is valid (ms) */
const LOGIN_INTENT_TTL = 30000; // 30 seconds

/**
 * Set login intent signal before initiating an explicit sign-in.
 * This signal has a short TTL and is consumed by fresh login detection.
 */
function setLoginIntent() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOGIN_INTENT_KEY, Date.now().toString());
  } catch (e) {
    console.warn('[AuthProvider] Failed to set login intent:', e);
  }
}

/**
 * Check and consume login intent signal.
 * Returns true if a valid (not expired) login intent was present.
 */
function consumeLoginIntent() {
  if (typeof window === 'undefined') return false;
  try {
    const intentTs = localStorage.getItem(LOGIN_INTENT_KEY);
    if (!intentTs) return false;
    
    localStorage.removeItem(LOGIN_INTENT_KEY);
    
    const elapsed = Date.now() - parseInt(intentTs, 10);
    if (elapsed < LOGIN_INTENT_TTL) {
      console.log('[AuthProvider] Valid login intent consumed (age:', elapsed, 'ms)');
      return true;
    }
    console.log('[AuthProvider] Login intent expired (age:', elapsed, 'ms)');
    return false;
  } catch (e) {
    console.warn('[AuthProvider] Failed to consume login intent:', e);
    return false;
  }
}

/** Maximum age for auth_ts to be considered fresh (ms) */
const AUTH_TS_MAX_AGE = 60000; // 60 seconds

/**
 * Check for OAuth callback signals (auth_callback_complete cookie or auth_ts param).
 * Returns true if this appears to be returning from an OAuth callback.
 */
function hasOAuthCallbackSignals() {
  if (typeof window === 'undefined') return false;
  
  // Check for auth_ts in URL params
  const params = new URLSearchParams(window.location.search);
  const hasAuthTs = params.has('auth_ts');
  
  // Check for auth_callback_complete cookie
  const hasCallbackCookie = document.cookie.includes('auth_callback_complete=');
  
  if (hasAuthTs || hasCallbackCookie) {
    console.log('[AuthProvider] OAuth callback signals detected:', { hasAuthTs, hasCallbackCookie });
    return true;
  }
  return false;
}

/**
 * Check if OAuth callback signals are FRESH (not stale from a previous session).
 * This is more stringent than hasOAuthCallbackSignals() - it also checks timestamps.
 * 
 * Returns { isFresh: boolean, hasAuthTs: boolean, hasCallbackCookie: boolean }
 */
function checkFreshOAuthSignals() {
  if (typeof window === 'undefined') {
    return { isFresh: false, hasAuthTs: false, hasCallbackCookie: false };
  }
  
  const params = new URLSearchParams(window.location.search);
  const authTsStr = params.get('auth_ts');
  const hasCallbackCookie = document.cookie.includes('auth_callback_complete=');
  
  let hasAuthTs = false;
  let authTsFresh = false;
  
  if (authTsStr) {
    hasAuthTs = true;
    const authTs = parseInt(authTsStr, 10);
    if (!isNaN(authTs)) {
      const age = Date.now() - authTs;
      authTsFresh = age >= 0 && age < AUTH_TS_MAX_AGE;
      if (!authTsFresh) {
        console.log('[AuthProvider] auth_ts is stale (age:', age, 'ms)');
      }
    }
  }
  
  // Fresh if either:
  // - auth_ts is present AND fresh (within TTL)
  // - auth_callback_complete cookie is present (it has its own 60s TTL)
  const isFresh = authTsFresh || hasCallbackCookie;
  
  console.log('[AuthProvider] Fresh OAuth signal check:', { hasAuthTs, authTsFresh, hasCallbackCookie, isFresh });
  
  return { isFresh, hasAuthTs, hasCallbackCookie };
}

/**
 * Clear/consume OAuth callback signals to prevent double-triggering.
 * Call this AFTER starting progress to ensure INITIAL_SESSION doesn't also trigger.
 */
function consumeOAuthSignals() {
  if (typeof window === 'undefined') return;
  
  // Clear auth_ts from URL
  const url = new URL(window.location.href);
  if (url.searchParams.has('auth_ts')) {
    url.searchParams.delete('auth_ts');
    window.history.replaceState({}, '', url.pathname + url.search);
    console.log('[AuthProvider] Cleared auth_ts from URL');
  }
  
  // Clear auth_callback_complete cookie
  if (document.cookie.includes('auth_callback_complete=')) {
    document.cookie = 'auth_callback_complete=; max-age=0; path=/';
    console.log('[AuthProvider] Cleared auth_callback_complete cookie');
  }
  
  // Clear auth_verified_user cookie
  if (document.cookie.includes('auth_verified_user=')) {
    document.cookie = 'auth_verified_user=; max-age=0; path=/';
    console.log('[AuthProvider] Cleared auth_verified_user cookie');
  }
}

/**
 * Detect if this is a "fresh login" that should show the loading overlay.
 * Consumes any pending signals.
 * 
 * A fresh login is:
 * - OAuth callback return (auth_ts param or auth_callback_complete cookie)
 * - Explicit user-initiated sign-in (loginWithGoogle, loginWithEmail, loginViaErrorBanner)
 * 
 * NOT a fresh login:
 * - Page refresh with existing session
 * - Silent token refresh (TOKEN_REFRESHED event)
 * - Session recovery
 */
function detectFreshLogin() {
  const hasOAuth = hasOAuthCallbackSignals();
  const hasIntent = consumeLoginIntent();
  
  const isFresh = hasOAuth || hasIntent;
  console.log('[AuthProvider] Fresh login detection:', { hasOAuth, hasIntent, isFresh });
  return isFresh;
}

/**
 * Check if the inline OAuth splash is currently showing.
 * The inline splash is injected by a script in root layout BEFORE React hydrates.
 */
function hasInlineSplash() {
  if (typeof window === 'undefined') return false;
  return window.__hasSplash === true;
}

/**
 * Dismiss the inline OAuth splash with fade animation.
 * Ensures minimum display time of 2s for branding.
 * @param {Function} callback - Called after splash is fully removed
 */
function dismissInlineSplash(callback) {
  if (typeof window === 'undefined' || !window.dismissOAuthSplash) {
    callback?.();
    return;
  }
  
  const startTime = window.__splashStartTime || Date.now();
  const elapsed = Date.now() - startTime;
  const minDuration = 3000; // 3 seconds minimum - gives time for prefetch to complete
  const remaining = Math.max(0, minDuration - elapsed);
  
  console.log('[Splash] Will dismiss in', remaining, 'ms (elapsed:', elapsed, 'ms)');
  
  setTimeout(() => {
    window.dismissOAuthSplash(callback);
  }, remaining);
}

/**
 * Default auth state
 */
const defaultAuthState = {
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  isDataFetchReady: false, // True when child providers can safely start fetching user data
  authError: null,
  sessionExpired: false, // True when session was invalidated (token expired)
  sessionRevoked: false, // True when session was revoked (e.g., logout from another device)
  showWelcomeToast: false, // True to show welcome toast after fresh login
  showSplashScreen: false, // Only used for email login (OAuth uses inline splash)
};

/**
 * Default onboarding state
 */
const defaultOnboardingState = {
  showOnboarding: false,
  onboardingStep: 1,
  onboardingData: {},
  onboardingDismissed: false,
  dismissedCount: 0,
};

/**
 * Maximum dismissals before opting out permanently
 */
const MAX_ONBOARDING_DISMISSALS = 3;

/**
 * Session initialization with retry logic
 * Handles race conditions after OAuth callback and stale sessions
 * 
 * Strategy:
 * 1. Use cached session promise from getSessionEarly() for fast initial check
 * 2. If that fails, try refreshSession() - works with refresh token even if access token expired
 * 3. If refresh works, validate with getUser()
 * 4. If refresh fails, try getUser() directly (maybe access token is fine)
 * 5. If all fail and it's a stale session error, clear local storage
 * 
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} initialDelay - Initial delay in ms (doubles with each retry)
 * @param {string|null} expectedUserId - If provided from callback, verify user matches
 */
async function initializeSessionWithRetry(maxRetries = 3, initialDelay = 100, expectedUserId = null) {
  let lastError = null;
  let errorCategory = null;
  
  // FIRST: Try cached session from early check (saves 200-400ms)
  try {
    console.log(`[AuthProvider] Checking cached session from early load...`);
    const sessionCheckStart = Date.now();
    const { data, error } = await getSessionEarly();
    const sessionCheckDuration = Date.now() - sessionCheckStart;
    
    console.log(`[AuthProvider] Cached session check completed in ${sessionCheckDuration}ms`);
    
    if (!error && data?.session && data?.session.user) {
      // Verify user matches expected if provided
      if (expectedUserId && data.session.user.id !== expectedUserId) {
        console.warn(`[AuthProvider] User mismatch: expected ${expectedUserId.slice(0, 8)}..., got ${data.session.user.id.slice(0, 8)}...`);
        // This might happen if cookies got mixed - fall through to refresh
      } else {
        console.log(`[AuthProvider] Session retrieved from cache successfully`);
        return { session: data.session, user: data.session.user, error: null, errorCategory: null };
      }
    }
    
    if (error) {
      console.log(`[AuthProvider] Cached session check returned error:`, error.message);
      lastError = error;
      errorCategory = categorizeAuthError(error);
    }
  } catch (cacheErr) {
    console.log(`[AuthProvider] Cached session check threw:`, cacheErr.message);
    lastError = cacheErr;
    errorCategory = categorizeAuthError(cacheErr);
  }
  
  // SECOND: Try to refresh session - this is the most reliable recovery method
  // It uses the refresh token which often survives when access tokens expire
  try {
    console.log(`[AuthProvider] Attempting session refresh...`);
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (!refreshError && refreshData?.session && refreshData?.user) {
      // Verify user matches expected if provided
      if (expectedUserId && refreshData.user.id !== expectedUserId) {
        console.warn(`[AuthProvider] User mismatch: expected ${expectedUserId.slice(0, 8)}..., got ${refreshData.user.id.slice(0, 8)}...`);
        // This might happen if cookies got mixed - clear and re-auth
      } else {
        console.log(`[AuthProvider] Session refreshed successfully`);
        return { session: refreshData.session, user: refreshData.user, error: null, errorCategory: null };
      }
    }
    
    if (refreshError) {
      console.log(`[AuthProvider] Refresh returned error:`, refreshError.message);
      lastError = refreshError;
      errorCategory = categorizeAuthError(refreshError);
      
      // If session was revoked (logged out elsewhere), don't retry - provide clear feedback
      if (errorCategory === ErrorCategory.SESSION_REVOKED) {
        console.warn(`[AuthProvider] Session was revoked - likely logged out on another device`);
        await clearAuthState();
        return { 
          session: null, 
          user: null, 
          error: refreshError, 
          sessionExpired: true,
          sessionRevoked: true,
          errorCategory 
        };
      }
    }
  } catch (refreshErr) {
    console.log(`[AuthProvider] Refresh threw:`, refreshErr.message);
    lastError = refreshErr;
    errorCategory = categorizeAuthError(refreshErr);
  }
  
  // If we know the error is non-recoverable, don't waste time retrying
  if (errorCategory === ErrorCategory.INVALID_TOKEN || errorCategory === ErrorCategory.SESSION_EXPIRED) {
    console.warn(`[AuthProvider] Non-recoverable error (${errorCategory}), clearing session...`);
    await clearAuthState();
    return { session: null, user: null, error: lastError, sessionExpired: true, errorCategory };
  }
  
  // THIRD: Refresh didn't work, try getUser() with retries
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        lastError = userError;
        errorCategory = categorizeAuthError(userError);
        console.warn(`[AuthProvider] getUser attempt ${attempt}/${maxRetries} failed:`, userError.message, `(${errorCategory})`);
        
        // Don't retry for non-recoverable errors
        if (errorCategory !== ErrorCategory.NETWORK && errorCategory !== ErrorCategory.UNKNOWN) {
          console.warn(`[AuthProvider] Non-retryable error category: ${errorCategory}`);
          await clearAuthState();
          return { 
            session: null, 
            user: null, 
            error: userError, 
            sessionExpired: true,
            sessionRevoked: errorCategory === ErrorCategory.SESSION_REVOKED,
            errorCategory 
          };
        }
        
        // For network errors, retry with backoff
        if (attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt - 1);
          console.log(`[AuthProvider] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw userError;
      }
      
      if (user) {
        // Verify user matches expected if provided
        if (expectedUserId && user.id !== expectedUserId) {
          console.warn(`[AuthProvider] User mismatch on getUser: expected ${expectedUserId.slice(0, 8)}..., got ${user.id.slice(0, 8)}...`);
        }
        
        // User validated, get the session
        const { data: { session } } = await supabase.auth.getSession();
        console.log(`[AuthProvider] Session initialized on attempt ${attempt}`);
        return { session, user, error: null, errorCategory: null };
      }
      
      // No user - not logged in
      return { session: null, user: null, error: null, errorCategory: null };
      
    } catch (err) {
      lastError = err;
      errorCategory = categorizeAuthError(err);
      if (attempt < maxRetries && (errorCategory === ErrorCategory.NETWORK || errorCategory === ErrorCategory.UNKNOWN)) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All attempts failed
  // Only log as error for unknown issues - expected failures (expired, revoked) are info-level
  if (errorCategory === ErrorCategory.UNKNOWN || errorCategory === ErrorCategory.NETWORK) {
    console.error('[AuthProvider] All auth attempts failed:', errorCategory, lastError?.message);
  } else {
    console.log('[AuthProvider] Auth session cleared:', errorCategory);
  }
  await clearAuthState();
  
  return { session: null, user: null, error: lastError, sessionExpired: !!lastError, errorCategory };
}

/**
 * Clear all local auth state (localStorage and cookies)
 */
async function clearAuthState() {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch (e) {
    console.warn('[AuthProvider] signOut during clearAuthState failed:', e.message);
  }
  
  // Clear any stale tokens from localStorage directly
  if (typeof window !== 'undefined') {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('sb-') && key.includes('auth')) {
        console.log(`[AuthProvider] Clearing stale auth key: ${key}`);
        localStorage.removeItem(key);
      }
    });
  }
}

/**
 * Error categories for better handling
 */
const ErrorCategory = {
  NETWORK: 'network',        // Network/connectivity issues - retry makes sense
  SESSION_EXPIRED: 'session_expired',  // Session legitimately expired - re-login needed
  SESSION_REVOKED: 'session_revoked',  // Session was revoked (e.g., logout from another device)
  INVALID_TOKEN: 'invalid_token',      // Token is malformed or invalid
  UNKNOWN: 'unknown',        // Unexpected error
};

/**
 * Categorize auth errors for appropriate handling
 */
function categorizeAuthError(error) {
  if (!error) return null;
  
  const message = error.message?.toLowerCase() || '';
  const status = error.status;
  const code = error.code || error.__isAuthError;
  
  // Network errors
  if (message.includes('network') || 
      message.includes('fetch') || 
      message.includes('timeout') ||
      message.includes('failed to fetch') ||
      message.includes('unable to resolve') ||
      message.includes('connection') ||
      status === 0) {
    return ErrorCategory.NETWORK;
  }
  
  // Session was revoked/logged out on another device
  if (message.includes('session has been revoked') || 
      message.includes('logged out') ||
      message.includes('user session not found') ||
      message.includes('not authenticated') ||
      (status === 401 && message.includes('session'))) {
    return ErrorCategory.SESSION_REVOKED;
  }
  
  // Session legitimately expired
  if (message.includes('session not found') ||
      message.includes('session from session_id claim') ||
      message.includes('jwt expired') ||
      message.includes('token expired') ||
      message.includes('token is expired') ||
      message.includes('auth session missing') ||
      message.includes('no current session')) {
    return ErrorCategory.SESSION_EXPIRED;
  }
  
  // Invalid/malformed token
  if (message.includes('invalid refresh token') ||
      message.includes('refresh_token') ||
      message.includes('malformed') ||
      message.includes('invalid jwt') ||
      message.includes('invalid claim') ||
      message.includes('token contains an invalid') ||
      status === 403) {
    return ErrorCategory.INVALID_TOKEN;
  }
  
  // Auth error type from Supabase - treat as expired session
  if (code === true || error.__isAuthError === true) {
    // Generic auth error from Supabase - likely session issue
    return ErrorCategory.SESSION_EXPIRED;
  }
  
  return ErrorCategory.UNKNOWN;
}

/**
 * Check for auth callback completion cookie
 * Set by the OAuth callback route to signal successful auth
 * Returns { fromCallback: boolean, verifiedUserId: string|null }
 */
function checkAuthCallbackCookie() {
  if (typeof document === 'undefined') return { fromCallback: false, verifiedUserId: null };
  
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find(c => c.trim().startsWith('auth_callback_complete='));
  const verifiedCookie = cookies.find(c => c.trim().startsWith('auth_verified_user='));
  
  let verifiedUserId = null;
  if (verifiedCookie) {
    verifiedUserId = verifiedCookie.split('=')[1]?.trim() || null;
    // Clear the verified user cookie
    document.cookie = 'auth_verified_user=; max-age=0; path=/';
  }
  
  if (authCookie) {
    // Clear the callback cookie after reading
    document.cookie = 'auth_callback_complete=; max-age=0; path=/';
    return { fromCallback: true, verifiedUserId };
  }
  
  return { fromCallback: false, verifiedUserId };
}

/**
 * AuthProvider Component
 * Wraps the app and provides auth context
 * 
 * ENHANCED: Includes retry logic, cross-tab sync, and proactive token refresh
 */
export function AuthProvider({ children }) {
  const [state, setState] = useState(defaultAuthState);
  const [onboardingState, setOnboardingState] = useState(defaultOnboardingState);
  const { resetProgress } = useLoadingProgress();
  const refreshIntervalRef = useRef(null);
  const initAttemptRef = useRef(0);
  const lastVisibilityChangeRef = useRef(Date.now());
  const isAuthenticatedRef = useRef(false);
  const isFreshLoginRef = useRef(false); // Tracks if current session is from a fresh login
  const wasAuthenticatedOnMountRef = useRef(null); // null = not checked yet, true/false = initial auth state
  // Track if inline splash is being used (for OAuth logins)
  const usingInlineSplashRef = useRef(typeof window !== 'undefined' && hasInlineSplash());
  const hasShownSplashRef = useRef(usingInlineSplashRef.current);
  
  // Refs for values used in auth state change listener to avoid stale closures
  const resetProgressRef = useRef(resetProgress);
  const stateProfileRef = useRef(state.profile);
  
  // Keep refs in sync with values
  useEffect(() => {
    resetProgressRef.current = resetProgress;
  }, [resetProgress]);
  
  useEffect(() => {
    stateProfileRef.current = state.profile;
  }, [state.profile]);
  
  // Keep the ref in sync with state
  useEffect(() => {
    isAuthenticatedRef.current = state.isAuthenticated;
  }, [state.isAuthenticated]);

  // =============================================================================
  // SPLASH SCREEN: Show on EVERY fresh login
  // =============================================================================
  // Email/Password Login Splash Detection
  // 
  // OAuth logins use the inline splash (injected before React).
  // This useEffect handles email/password logins which happen in-page.
  // =============================================================================
  useEffect(() => {
    // Skip while still loading initial auth state
    if (state.isLoading) return;
    
    // Skip if using inline splash (OAuth login) or splash already shown
    if (usingInlineSplashRef.current || hasShownSplashRef.current || state.showSplashScreen) return;
    
    // Skip if not authenticated
    if (!state.isAuthenticated) {
      // Record that user was not authenticated (for email login detection)
      if (wasAuthenticatedOnMountRef.current === null) {
        wasAuthenticatedOnMountRef.current = false;
        console.log('[Splash] User not authenticated on mount');
      }
      return;
    }
    
    // Record initial auth state if not already recorded
    if (wasAuthenticatedOnMountRef.current === null) {
      wasAuthenticatedOnMountRef.current = state.isAuthenticated;
    }
    
    // Email login: User became authenticated after being unauthenticated on mount
    if (wasAuthenticatedOnMountRef.current === false) {
      console.log('[Splash] 🚀 Email login detected - showing React splash');
      hasShownSplashRef.current = true;
      isFreshLoginRef.current = true;
      setState(prev => ({ ...prev, showSplashScreen: true }));
    }
  }, [state.isAuthenticated, state.isLoading, state.showSplashScreen]);

  // Fetch user profile when authenticated
  // Returns profile data on success, or a minimal profile object on failure
  // This ensures the app can continue functioning even if profile fetch fails
  // NOTE: Timeout reduced from 12s to 6s for better UX - matches page loading timeouts
  const fetchProfile = useCallback(async (userId, timeout = 6000) => {
    if (!userId) return null;

    console.log('[AuthProvider] fetchProfile called for user:', userId);
      
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('[AuthProvider] Profile fetch timeout after', timeout, 'ms');
      controller.abort();
    }, timeout);
    
    try {
      // Fetch with timeout
      const fetchPromise = getUserProfile();
      const timeoutPromise = new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error('Profile fetch timed out'));
        });
      });
      
      const { data: profile, error: profileError } = await Promise.race([fetchPromise, timeoutPromise]);

      console.log('[AuthProvider] Profile fetch result:', {
        hasProfile: !!profile,
        profileError: profileError?.message,
      });

      // If profile doesn't exist but user is authenticated, create it
      if (!profile && supabase && userId && !profileError) {
        try {
          const { data: authUserResult } = await supabase.auth.getUser();
          const authUser = authUserResult?.user;

          if (authUser) {
            // Calculate trial end date for new users (7-day Pro trial)
            const trialEndsAt = TRIAL_CONFIG.enabled 
              ? calculateTrialEndDate(new Date()).toISOString()
              : null;
            
            const newProfileData = {
              id: authUser.id,
              email: authUser.email,
              display_name: authUser.user_metadata?.full_name
                || authUser.user_metadata?.name
                || authUser.email?.split('@')[0]
                || 'User',
              avatar_url: authUser.user_metadata?.avatar_url
                || authUser.user_metadata?.picture
                || null,
              // Start with 'free' tier but trial_ends_at gives Pro access
              subscription_tier: 'free',
              trial_ends_at: trialEndsAt,
              al_credits: 10,
              preferred_units: 'imperial',
              email_notifications: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            console.log('[AuthProvider] No profile found, creating one for:', authUser.id, 'with data:', newProfileData);

            const { data: createdProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert(newProfileData)
              .select()
              .single();

            if (createError) {
              console.error('[AuthProvider] Failed to create profile:', {
                message: createError.message,
                code: createError.code,
                details: createError.details,
                hint: createError.hint,
              });
              // Return default profile shape so the app can continue
              return {
                ...newProfileData,
                _isDefault: true,
                _createError: createError.message,
              };
            }

            console.log('[AuthProvider] Profile created successfully:', createdProfile);
            return createdProfile;
          }
        } catch (createErr) {
          console.error('[AuthProvider] Unexpected error creating profile:', createErr);
          return {
            id: userId,
            subscription_tier: 'free',
            _createError: createErr.message,
          };
        }
      }

      if (profileError) {
        console.error('[AuthProvider] Profile fetch error:', {
          message: profileError.message,
          code: profileError?.code,
          details: profileError?.details,
        });
        return {
          id: userId,
          subscription_tier: 'free',
          _fetchError: true,
        };
      }

      return profile;
    } catch (err) {
      console.error('[AuthProvider] Unexpected error fetching profile:', err);
      // Return minimal profile on exception too
      return {
        id: userId,
        subscription_tier: 'free',
        _fetchError: true,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  // Proactive session refresh (before expiry)
  const scheduleSessionRefresh = useCallback((session) => {
    if (refreshIntervalRef.current) {
      clearTimeout(refreshIntervalRef.current);
    }
    
    if (!session?.expires_at) return;
    
    const expiresAt = session.expires_at * 1000; // Convert to ms
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    
    // Refresh 5 minutes before expiry (or immediately if less than 5 min left)
    const refreshBuffer = 5 * 60 * 1000; // 5 minutes
    const refreshIn = Math.max(timeUntilExpiry - refreshBuffer, 1000);
    
    console.log(`[AuthProvider] Scheduling token refresh in ${Math.round(refreshIn / 1000 / 60)} minutes`);
    
    refreshIntervalRef.current = setTimeout(async () => {
      console.log('[AuthProvider] Proactive token refresh triggered');
      try {
        const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
        if (!error && newSession) {
          console.log('[AuthProvider] Token refreshed proactively');
          setState(prev => ({
            ...prev,
            session: newSession,
          }));
          // Schedule next refresh
          scheduleSessionRefresh(newSession);
        } else if (error) {
          console.warn('[AuthProvider] Proactive refresh failed:', error.message);
        }
      } catch (err) {
        console.error('[AuthProvider] Proactive refresh error:', err);
      }
    }, refreshIn);
  }, []);

  // Handle auth state changes
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      console.log('[AuthProvider] Supabase not configured, skipping auth init');
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    // Check if we just came from OAuth callback
    const { fromCallback, verifiedUserId } = checkAuthCallbackCookie();
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const hasAuthTimestamp = urlParams?.has('auth_ts');

    // Get initial session with retry logic
    const initializeAuth = async () => {
      try {
        initAttemptRef.current += 1;
        const attemptNum = initAttemptRef.current;
        
        console.log(`[AuthProvider] Initializing auth (attempt ${attemptNum})...`, {
          fromCallback,
          hasAuthTimestamp,
          verifiedUserId: verifiedUserId?.slice(0, 8) + '...',
        });
        
        // If coming from OAuth callback, use retry logic to handle race conditions
        const maxRetries = (fromCallback || hasAuthTimestamp) ? 5 : 3;
        
        // Add timeout to prevent infinite loading
        // OAuth callbacks need more time due to cookie propagation delays
        // Regular auth init: 15 seconds, OAuth callback: 30 seconds
        const timeoutMs = (fromCallback || hasAuthTimestamp) ? 30000 : 15000;
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth initialization timeout')), timeoutMs)
        );
        
        let result;
        try {
          result = await Promise.race([
            initializeSessionWithRetry(maxRetries, 100, verifiedUserId),
            timeoutPromise
          ]);
        } catch (timeoutErr) {
          console.error('[AuthProvider] Auth init timed out:', timeoutErr.message);
          
          // For OAuth callbacks, a timeout likely means cookies haven't propagated yet
          // Don't show error immediately - try one more time after a short delay
          if (fromCallback || hasAuthTimestamp) {
            console.log('[AuthProvider] OAuth callback timeout - attempting one more refresh...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // One final attempt with refreshSession
            try {
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              if (!refreshError && refreshData?.session && refreshData?.user) {
                console.log('[AuthProvider] Final refresh succeeded after timeout');
                isAuthenticatedRef.current = true;
                setState({
                  user: refreshData.user,
                  profile: null,
                  session: refreshData.session,
                  isLoading: false,
                  isAuthenticated: true,
                  isDataFetchReady: false, // Will be set true after profile/prefetch
                  authError: null,
                  sessionExpired: false,
                  sessionRevoked: false,
                });
                scheduleSessionRefresh(refreshData.session);
                
                // Fire off prefetch in background (don't block on it)
                prefetchAllUserData(refreshData.user.id).catch(err => {
                  console.warn('[AuthProvider] Prefetch error in timeout recovery:', err);
                });
                
                // Load profile, then signal ready
                const profile = await fetchProfile(refreshData.user.id);
                setState(prev => ({ 
                  ...prev, 
                  profile: profile || prev.profile,
                  isDataFetchReady: true,
                }));
                return;
              }
            } catch (finalErr) {
              console.error('[AuthProvider] Final refresh attempt failed:', finalErr);
            }
          }
          
          // On timeout, assume not authenticated and let user retry
          setState({
            ...defaultAuthState,
            isLoading: false,
            isDataFetchReady: true, // Enable providers to clear any cached user data
            authError: 'Authentication timed out. Please refresh or sign in again.',
          });
          return;
        }
        
        const { session, user, error: initError, sessionExpired, sessionRevoked, errorCategory } = result;
        
        if (initError) {
          console.error('[AuthProvider] Session init error:', initError, `(category: ${errorCategory})`);
          
          // Provide user-friendly error messages based on error category
          let userMessage = initError.message;
          if (sessionRevoked) {
            userMessage = 'You were signed out because you logged in on another device. Please sign in again.';
          } else if (errorCategory === ErrorCategory.NETWORK) {
            userMessage = 'Network error. Please check your connection and try again.';
          } else if (sessionExpired) {
            userMessage = 'Your session has expired. Please sign in again.';
          }
          
          setState({
            ...defaultAuthState,
            isLoading: false,
            isDataFetchReady: true, // Enable providers to clear any cached user data
            authError: userMessage,
            sessionExpired: !!sessionExpired,
            sessionRevoked: !!sessionRevoked,
          });
          return;
        }
        
        // Handle case where session was cleared due to being stale
        if (sessionExpired && !user) {
          const message = sessionRevoked 
            ? 'You were signed out from another device.'
            : 'Your session has expired.';
          console.log(`[AuthProvider] ${message} User needs to re-login`);
          setState({
            ...defaultAuthState,
            isLoading: false,
            isDataFetchReady: true, // Enable providers to clear any cached user data
            sessionExpired: true,
            sessionRevoked: !!sessionRevoked,
          });
          return;
        }
        
        console.log('[AuthProvider] Session check result:', {
          hasSession: !!session,
          userId: user?.id?.slice(0, 8) + '...',
          expiresAt: session?.expires_at,
        });
        
        if (user && session) {
          // Mark as authenticated BEFORE any async work
          isAuthenticatedRef.current = true;
          
          // IMMEDIATELY set authenticated state so UI updates right away
          // NOTE: Use functional update to preserve showSplashScreen if already set
          setState(prev => ({
            ...prev,
            user,
            profile: null, // Will be loaded below
            session,
            isLoading: false,
            isAuthenticated: true,
            isDataFetchReady: false, // Will be set true after prefetch
            authError: null,
          }));
          console.log('[AuthProvider] User authenticated via initializeAuth');
          
          // Schedule proactive token refresh
          scheduleSessionRefresh(session);
          
          // Check for fresh OAuth signals
          const { isFresh: isFreshOAuth, hasAuthTs } = checkFreshOAuthSignals();
          
          // Fresh OAuth login detected
          if (isFreshOAuth) {
            console.log('[Splash] Fresh OAuth login detected');
            
            // Consume the signals
            consumeOAuthSignals();
            consumeLoginIntent();
            
            // Mark as fresh login for onboarding
            isFreshLoginRef.current = true;
            hasShownSplashRef.current = true;
            
            // GA4 tracking: Check if new signup vs returning user
            const userCreatedAt = new Date(user.created_at);
            const isNewUser = (Date.now() - userCreatedAt.getTime()) < 60000; // Created within 60 seconds
            if (isNewUser) {
              console.log('[AuthProvider] New user signup detected - firing GA4 sign_up');
              ga4TrackSignUp(user.app_metadata?.provider || 'google');
            } else {
              console.log('[AuthProvider] Returning user login - firing GA4 login');
              ga4TrackLogin(user.app_metadata?.provider || 'google');
            }
          }
          
          // Clean up auth_ts from URL if present
          if (hasAuthTs && typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('auth_ts');
            window.history.replaceState({}, '', url.pathname + url.search);
          }
          
          // Load profile in background, then signal ready for child providers
          // NOTE: Prefetch runs in parallel but does NOT block isDataFetchReady
          // Providers will use prefetched data if available, otherwise fetch themselves
          console.log('[AuthProvider] Loading user data in background');
          
          // Fire off prefetch in background (fire-and-forget)
          prefetchAllUserData(user.id).catch(err => {
            console.warn('[AuthProvider] Background prefetch error:', err);
          });
          
          // Load profile - this is what we actually wait for
          fetchProfile(user.id).then(profile => {
            if (profile) {
              setState(prev => ({ ...prev, profile }));
              console.log('[AuthProvider] Profile loaded:', {
                userId: user.id.slice(0, 8) + '...',
                tier: profile?.subscription_tier,
              });
            }
            // Signal ready for child providers AFTER profile loads
            console.log('[AuthProvider] Profile loaded, signaling ready for child providers');
            setState(prev => ({ ...prev, isDataFetchReady: true }));
            
            // Dismiss inline splash (if present) - OAuth login complete
            if (usingInlineSplashRef.current) {
              dismissInlineSplash(() => {
                console.log('[Splash] Inline splash dismissed, showing welcome toast');
                setState(prev => ({ ...prev, showWelcomeToast: true }));
              });
            }
          }).catch(err => {
            console.warn('[AuthProvider] Profile fetch error:', err);
            // Still signal ready so app doesn't hang
            setState(prev => ({ ...prev, isDataFetchReady: true }));
            
            // Dismiss inline splash even on error
            if (usingInlineSplashRef.current) {
              dismissInlineSplash(() => {
                setState(prev => ({ ...prev, showWelcomeToast: true }));
              });
            }
          });
        } else {
          console.log('[AuthProvider] No session found, user is not authenticated');
          setState({
            ...defaultAuthState,
            isLoading: false,
            isDataFetchReady: true, // Guests can immediately use localStorage
          });
        }
      } catch (err) {
        console.error('[AuthProvider] Error initializing auth:', err);
        setState(prev => ({ ...prev, isLoading: false, authError: err.message }));
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const unsubscribe = onAuthStateChange(async (event, session) => {
      console.log('[AuthProvider] Auth state change:', JSON.stringify({
        event,
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id?.slice(0, 8),
        currentIsAuthenticated: isAuthenticatedRef.current,
      }));
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Check if this is a fresh login that should show the loading overlay.
        // A fresh login is either:
        // 1. User was not previously authenticated AND we have fresh login signals
        //    (OAuth callback, explicit sign-in via login intent)
        // 2. Never: silent session recovery (handled differently)
        const wasNotAuthenticated = !isAuthenticatedRef.current;
        const hasFreshSignals = wasNotAuthenticated && detectFreshLogin();
        const isFreshLogin = wasNotAuthenticated && hasFreshSignals;
        console.log('[AuthProvider] Handling SIGNED_IN event:', { wasNotAuthenticated, hasFreshSignals, isFreshLogin });
        
        // Mark as authenticated and track fresh login for onboarding
        isAuthenticatedRef.current = true;
        if (isFreshLogin) {
          isFreshLoginRef.current = true;
        }
        
        // Update state - keep isDataFetchReady false until prefetch completes
        setState(prev => ({
          ...prev,
          user: session.user,
          session,
          isLoading: false,
          isAuthenticated: true,
          isDataFetchReady: false, // Will be set true after prefetch
          authError: null,
        }));
        scheduleSessionRefresh(session);
        
        // Fresh login via explicit sign-in
        if (isFreshLogin) {
          // Only show React splash for email logins (OAuth uses inline splash)
          if (!usingInlineSplashRef.current && !hasShownSplashRef.current) {
            console.log('[Splash] 🚀 Fresh email login - showing React splash');
            hasShownSplashRef.current = true;
            setState(prev => ({ ...prev, showSplashScreen: true }));
          }
          
          // GA4 tracking: Check if new signup vs returning user
          const userCreatedAt = new Date(session.user.created_at);
          const isNewUser = (Date.now() - userCreatedAt.getTime()) < 60000; // Created within 60 seconds
          if (isNewUser) {
            console.log('[AuthProvider] New user signup via SIGNED_IN - firing GA4 sign_up');
            ga4TrackSignUp(session.user.app_metadata?.provider || 'google');
          } else {
            console.log('[AuthProvider] Returning user via SIGNED_IN - firing GA4 login');
            ga4TrackLogin(session.user.app_metadata?.provider || 'google');
          }
          
          // Fire off prefetch in background (don't wait for it)
          prefetchAllUserData(session.user.id).catch(err => {
            console.warn('[AuthProvider] Prefetch error (non-fatal):', err);
          });
          
          // Load profile - this we do wait for
          try {
            const profile = await fetchProfile(session.user.id);
            
            // Signal ready for child providers immediately after profile
            setState(prev => ({ ...prev, isDataFetchReady: true }));
            
            // Check if there's a pending tier selection from the join page
            let finalProfile = profile;
            const pendingTier = localStorage.getItem('autorev_selected_tier');
            if (pendingTier && pendingTier !== profile?.subscription_tier) {
              try {
                const { data: updatedProfile } = await updateUserProfile({ 
                  subscription_tier: pendingTier 
                });
                localStorage.removeItem('autorev_selected_tier');
                finalProfile = updatedProfile || { ...profile, subscription_tier: pendingTier };
              } catch (err) {
                console.error('[AuthProvider] Failed to apply selected tier:', err);
                localStorage.removeItem('autorev_selected_tier');
              }
            }
            
            if (finalProfile) {
              setState(prev => ({ ...prev, profile: finalProfile }));
              console.log('[AuthProvider] Profile loaded:', { tier: finalProfile?.subscription_tier });
            }
          } catch (err) {
            console.error('[AuthProvider] Error loading data:', err);
            setState(prev => ({ ...prev, isDataFetchReady: true }));
          }
        } else {
          console.log('[AuthProvider] Page refresh - initializeAuth handles loading');
        }
      } else if (event === 'SIGNED_OUT') {
        // Clear refresh timer on signout
        console.log('[AuthProvider] Handling SIGNED_OUT event');
        if (refreshIntervalRef.current) {
          clearTimeout(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
        // Reset refs
        isAuthenticatedRef.current = false;
        // Clear prefetch cache to ensure fresh data on next login
        clearPrefetchCache();
        // Clear session cache to ensure fresh check on next login
        clearSessionCache();
        // Reset loading progress screen state
        resetProgressRef.current();
        // NOTE: isDataFetchReady must be TRUE so child providers can clear their user data
        setState({
          ...defaultAuthState,
          isLoading: false,
          isDataFetchReady: true, // Critical: enables providers to clear user data on logout
        });
        // Also reset onboarding state
        setOnboardingState(defaultOnboardingState);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('[AuthProvider] Token refreshed via Supabase');
        // IMPORTANT: Also update user and isAuthenticated in case initial auth failed
        // but token refresh succeeded (auth recovery scenario)
        const wasAuthenticated = isAuthenticatedRef.current;
        const needsProfileLoad = !wasAuthenticated || !stateProfileRef.current;
        
        // Mark as authenticated
        isAuthenticatedRef.current = true;
        
        setState(prev => {
          if (!prev.isAuthenticated) {
            console.log('[AuthProvider] Auth recovered via token refresh');
          }
          return {
            ...prev,
            user: session.user,
            session,
            isAuthenticated: true,
            isLoading: false,
            // If recovering auth, keep isDataFetchReady false until profile/prefetch done
            isDataFetchReady: wasAuthenticated ? prev.isDataFetchReady : false,
            authError: null,
          };
        });
        scheduleSessionRefresh(session);
        
        // If we just recovered auth or don't have a profile, load profile
        // Prefetch runs in background but doesn't block isDataFetchReady
        if (needsProfileLoad) {
          // Only prefetch if this is auth recovery (wasn't previously authenticated)
          if (!wasAuthenticated) {
            prefetchAllUserData(session.user.id).catch(err => {
              console.warn('[AuthProvider] Prefetch error in TOKEN_REFRESHED:', err);
            });
          }
          
          // Load profile - this is what we wait for
          fetchProfile(session.user.id).then(profile => {
            setState(prev => ({ 
              ...prev, 
              profile: profile || prev.profile,
              isDataFetchReady: true, // Now safe for child providers
            }));
            console.log('[AuthProvider] Profile loaded after token refresh:', { tier: profile?.subscription_tier });
          }).catch(err => {
            console.error('[AuthProvider] Error loading profile after token refresh:', err);
            // Still signal ready so child providers don't hang
            setState(prev => ({ ...prev, isDataFetchReady: true }));
          });
        }
      } else if (event === 'USER_UPDATED' && session?.user) {
        const profile = await fetchProfile(session.user.id);
        setState(prev => ({
          ...prev,
          user: session.user,
          profile,
        }));
      } else if (event === 'INITIAL_SESSION' && session?.user) {
        // Handle initial session detection (page load with existing session)
        // This can fire if Supabase detects a session before our initializeAuth completes
        // OR right after an OAuth callback (race: INITIAL_SESSION might arrive before SIGNED_IN)
        console.log('[AuthProvider] Initial session detected via event');
        
        // Only proceed if we're not already authenticated
        if (isAuthenticatedRef.current) {
          console.log('[AuthProvider] Already authenticated, skipping INITIAL_SESSION');
          return;
        }
        
        // Check for fresh login signals - if present, this is actually an OAuth callback
        // or explicit sign-in that arrived via INITIAL_SESSION instead of SIGNED_IN
        const hasFreshSignals = detectFreshLogin();
        console.log('[AuthProvider] INITIAL_SESSION fresh login check:', { hasFreshSignals });
        
        isAuthenticatedRef.current = true;
        setState(prev => ({
          ...prev,
          user: session.user,
          session,
          isAuthenticated: true,
          isLoading: false,
          isDataFetchReady: false, // Will be set true after profile/prefetch
          authError: null,
        }));
        scheduleSessionRefresh(session);
        
        // Fresh login via INITIAL_SESSION
        if (hasFreshSignals) {
          console.log('[Splash] Fresh login via INITIAL_SESSION');
          
          // Mark as fresh login (inline splash is already showing)
          hasShownSplashRef.current = true;
          isFreshLoginRef.current = true;
          
          // GA4 tracking: Check if new signup vs returning user
          const userCreatedAt = new Date(session.user.created_at);
          const isNewUser = (Date.now() - userCreatedAt.getTime()) < 60000; // Created within 60 seconds
          if (isNewUser) {
            console.log('[AuthProvider] New user signup via INITIAL_SESSION - firing GA4 sign_up');
            ga4TrackSignUp(session.user.app_metadata?.provider || 'google');
          } else {
            console.log('[AuthProvider] Returning user via INITIAL_SESSION - firing GA4 login');
            ga4TrackLogin(session.user.app_metadata?.provider || 'google');
          }
        }
        
        // Load data silently in background (same path for fresh and recovery)
        // Prefetch runs in parallel but doesn't block isDataFetchReady
        console.log('[AuthProvider] INITIAL_SESSION - loading data silently');
        
        // Fire off prefetch (fire-and-forget)
        prefetchAllUserData(session.user.id).catch(err => {
          console.warn('[AuthProvider] Prefetch error in INITIAL_SESSION:', err);
        });
        
        // Load profile - this is what we wait for
        fetchProfile(session.user.id).then(profile => {
          setState(prev => ({ 
            ...prev, 
            profile: profile || prev.profile,
            isDataFetchReady: true,
          }));
          
          // Dismiss inline splash (if present) - INITIAL_SESSION login complete
          if (usingInlineSplashRef.current && hasFreshSignals) {
            dismissInlineSplash(() => {
              console.log('[Splash] Inline splash dismissed via INITIAL_SESSION');
              setState(prev => ({ ...prev, showWelcomeToast: true }));
            });
          }
        }).catch(err => {
          console.error('[AuthProvider] Error loading data in INITIAL_SESSION:', err);
          setState(prev => ({ ...prev, isDataFetchReady: true }));
          
          // Dismiss inline splash even on error
          if (usingInlineSplashRef.current && hasFreshSignals) {
            dismissInlineSplash(() => {
              setState(prev => ({ ...prev, showWelcomeToast: true }));
            });
          }
        });
      } else if (session?.user && !isAuthenticatedRef.current) {
        // Catch-all: If we have a valid session but aren't authenticated,
        // this is an auth recovery scenario
        console.log('[AuthProvider] Auth recovery detected via event:', event);
        isAuthenticatedRef.current = true;
        setState(prev => ({
          ...prev,
          user: session.user,
          session,
          isAuthenticated: true,
          isLoading: false,
          isDataFetchReady: false, // Will be set true after profile/prefetch
          authError: null,
        }));
        scheduleSessionRefresh(session);
        
        // Load profile, then signal ready for child providers
        // Prefetch runs in parallel but doesn't block isDataFetchReady
        
        // Fire off prefetch (fire-and-forget)
        prefetchAllUserData(session.user.id).catch(err => {
          console.warn('[AuthProvider] Prefetch error in auth recovery:', err);
        });
        
        // Load profile - this is what we wait for
        fetchProfile(session.user.id).then(profile => {
          setState(prev => ({ 
            ...prev, 
            profile: profile || prev.profile,
            isDataFetchReady: true,
          }));
        }).catch(err => {
          console.error('[AuthProvider] Error loading data after auth recovery:', err);
          // Still signal ready so child providers don't hang
          setState(prev => ({ ...prev, isDataFetchReady: true }));
        });
      }
    });

    // Cross-tab session synchronization via visibility change
    // When user switches back to this tab, verify session is still valid
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const timeSinceLastCheck = now - lastVisibilityChangeRef.current;
        lastVisibilityChangeRef.current = now;
        
        // Only check if tab was hidden for more than 30 seconds
        if (timeSinceLastCheck > 30000) {
          console.log('[AuthProvider] Tab became visible after long absence, verifying session...');
          try {
            const { data: { user }, error } = await supabase.auth.getUser();
            
            if (error) {
              console.warn('[AuthProvider] Session invalid after tab switch:', error.message);
              // Try to refresh
              const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
              if (refreshError || !newSession) {
                // Session is truly invalid - user needs to re-auth
                console.warn('[AuthProvider] Session refresh failed, user logged out');
                setState({
                  ...defaultAuthState,
                  isLoading: false,
                  isDataFetchReady: true, // Enable providers to clear cached user data
                  authError: 'Session expired. Please sign in again.',
                });
              } else {
                console.log('[AuthProvider] Session restored after tab switch');
                setState(prev => ({
                  ...prev,
                  session: newSession,
                  user: newSession.user,
                  authError: null,
                }));
                scheduleSessionRefresh(newSession);
              }
            } else if (!user && isAuthenticatedRef.current) {
              // User was authenticated but now no user - logged out in another tab
              console.log('[AuthProvider] User logged out in another tab');
              isAuthenticatedRef.current = false;
              setState({
                ...defaultAuthState,
                isLoading: false,
                isDataFetchReady: true, // Enable providers to clear cached user data
              });
            }
          } catch (err) {
            console.error('[AuthProvider] Error checking session on tab focus:', err);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Storage event listener for cross-tab logout sync
    const handleStorageChange = (e) => {
      // Supabase stores auth in localStorage with this key pattern
      // Use ref instead of state to avoid stale closure issues
      if (e.key?.includes('supabase.auth') && e.newValue === null && isAuthenticatedRef.current) {
        console.log('[AuthProvider] Auth storage cleared in another tab, logging out');
        isAuthenticatedRef.current = false;
        setState({
          ...defaultAuthState,
          isLoading: false,
          isDataFetchReady: true, // Enable providers to clear cached user data
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      if (refreshIntervalRef.current) {
        clearTimeout(refreshIntervalRef.current);
      }
    };
  }, [fetchProfile, scheduleSessionRefresh]);

  // Sign in with Google
  const loginWithGoogle = useCallback(async (redirectTo) => {
    // Set login intent signal BEFORE redirect so we can detect fresh login on return
    setLoginIntent();
    setState(prev => ({ ...prev, isLoading: true }));
    const { error } = await signInWithGoogle(redirectTo);
    if (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { error };
    }
    return { error: null };
  }, []);

  // Sign in with Facebook
  const loginWithFacebook = useCallback(async (redirectTo) => {
    // Set login intent signal BEFORE redirect so we can detect fresh login on return
    setLoginIntent();
    setState(prev => ({ ...prev, isLoading: true }));
    const { error } = await signInWithFacebook(redirectTo);
    if (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { error };
    }
    return { error: null };
  }, []);

  // Sign in with email
  const loginWithEmail = useCallback(async (email, password) => {
    // Set login intent signal for fresh login detection
    setLoginIntent();
    setState(prev => ({ ...prev, isLoading: true }));
    const { data, error } = await signInWithEmail(email, password);
    if (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { error };
    }
    // Auth state change will update the state
    return { data, error: null };
  }, []);

  // Sign up with email
  const signUp = useCallback(async (email, password, metadata) => {
    setState(prev => ({ ...prev, isLoading: true }));
    const { data, error } = await signUpWithEmail(email, password, metadata);
    if (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { error };
    }
    return { data, error: null };
  }, []);

  // Sign out - Instant UI update, background cleanup
  /**
   * Sign out the current user
   * 
   * @param {Object} options - Logout options
   * @param {'global'|'local'|'others'} options.scope - Scope of sign out:
   *   - 'global': (default) Sign out from ALL devices
   *   - 'local': Sign out only from this device
   *   - 'others': Sign out from all OTHER devices (keep this session)
   * @param {Function} options.onComplete - Optional callback when server signout completes
   */
  const logout = useCallback(async ({ scope = 'global', onComplete } = {}) => {
    console.log('[AuthProvider] Starting logout with scope:', scope);
    
    // Clear refresh timer immediately
    if (refreshIntervalRef.current) {
      clearTimeout(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    
    // Reset refs immediately
    isAuthenticatedRef.current = false;
    initAttemptRef.current = 0;
    wasAuthenticatedOnMountRef.current = null; // Reset so next login shows splash
    hasShownSplashRef.current = false;
    isFreshLoginRef.current = false;
    
    console.log('[Splash] Logout - refs reset for next login');
    
    // Reset loading progress immediately
    resetProgress();
    
    // Clear prefetch cache
    clearPrefetchCache();
    
    // Clear session cache to ensure fresh check on next login
    clearSessionCache();
    
    // Clear onboarding dismissal so next login shows onboarding if incomplete
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('onboarding_dismissed_until');
    }
    
    // INSTANT: Clear state immediately so UI updates right away
    // NOTE: isDataFetchReady must be TRUE on logout so child providers 
    // (FavoritesProvider, OwnedVehiclesProvider, SavedBuildsProvider) can 
    // properly react to the auth change and clear their cached user data.
    setState({
      ...defaultAuthState,
      isLoading: false,
      isDataFetchReady: true, // Critical: enables providers to clear user data on logout
    });
    setOnboardingState(defaultOnboardingState);
    
    console.log('[AuthProvider] UI cleared - starting background cleanup...');
    
    // BACKGROUND: Do server signout and cookie cleanup async (don't await)
    authSignOut({ 
      scope, 
      onComplete: (result) => {
        if (result.serverSignOutFailed) {
          console.warn('[AuthProvider] Server signout had issues (local cleanup succeeded)');
        } else {
          console.log('[AuthProvider] Server signout complete');
        }
        // Call user's callback if provided
        if (onComplete) {
          onComplete(result);
        }
      }
    }).catch(err => {
      console.warn('[AuthProvider] Background signout exception (ignored):', err.message);
      if (onComplete) {
        onComplete({ error: err, serverSignOutFailed: true });
      }
    });
    
    return { error: null }; // Return success immediately - UI is already cleared
  }, [resetProgress]);

  // Update profile
  const updateProfile = useCallback(async (updates) => {
    const { data, error } = await updateUserProfile(updates);
    if (!error && data) {
      setState(prev => ({
        ...prev,
        profile: { ...prev.profile, ...data },
      }));
    }
    return { data, error };
  }, []);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    if (state.user?.id) {
      const profile = await fetchProfile(state.user.id);
      if (profile) {
        setState(prev => ({ ...prev, profile }));
      }
    }
  }, [state.user?.id, fetchProfile]);

  // Force session refresh - useful when API returns 401
  const refreshSession = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: new Error('Supabase not configured') };
    }

    try {
      console.log('[AuthProvider] Manual session refresh requested');
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[AuthProvider] Manual refresh failed:', error);
        return { error };
      }
      
      if (session) {
        setState(prev => ({
          ...prev,
          session,
          user: session.user,
          authError: null,
        }));
        scheduleSessionRefresh(session);
        console.log('[AuthProvider] Manual refresh succeeded');
        return { session, error: null };
      }
      
      return { error: new Error('No session returned') };
    } catch (err) {
      console.error('[AuthProvider] Manual refresh error:', err);
      return { error: err };
    }
  }, [scheduleSessionRefresh]);

  // Clear auth error
  const clearAuthError = useCallback(() => {
    setState(prev => ({ ...prev, authError: null, sessionExpired: false }));
  }, []);

  // Check if user needs onboarding
  // SIMPLIFIED LOGIC: If onboarding_completed_at is NULL in DB, ALWAYS show onboarding
  // No temporary dismissals - user must complete it or it shows every time
  const checkOnboardingStatus = useCallback(async (profile, isFreshLogin = false) => {
    // DEV: Allow forcing onboarding with ?showOnboarding=1 query param
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('showOnboarding') === '1') {
        console.log('[AuthProvider] Forcing onboarding via query param');
        localStorage.removeItem('onboarding_dismissed_until');
        setOnboardingState({
          showOnboarding: true,
          onboardingStep: 1,
          onboardingData: {
            referral_source: null,
            referral_source_other: '',
            user_intent: null,
            email_opt_in_features: false,
            email_opt_in_events: false,
          },
          onboardingDismissed: false,
          dismissedCount: 0,
        });
        return;
      }
    }
    
    // If onboarding is already completed (timestamp set in DB), don't show
    if (profile?.onboarding_completed_at) {
      console.log('[AuthProvider] Onboarding already completed, not showing');
      setOnboardingState(prev => ({ ...prev, showOnboarding: false }));
      return;
    }
    
    // IMPORTANT: If onboarding is NOT completed, ALWAYS show it
    // Clear any localStorage dismissal - the database is the source of truth
    // User must complete onboarding to stop seeing it
    console.log('[AuthProvider] Onboarding NOT completed - showing onboarding flow');
    localStorage.removeItem('onboarding_dismissed_until');
    
    setOnboardingState({
      showOnboarding: true,
      onboardingStep: profile?.onboarding_step || 1,
      onboardingData: {
        referral_source: profile?.referral_source || null,
        referral_source_other: profile?.referral_source_other || '',
        user_intent: profile?.user_intent || null,
        email_opt_in_features: profile?.email_opt_in_features || false,
        email_opt_in_events: profile?.email_opt_in_events || false,
      },
      onboardingDismissed: false,
      dismissedCount: profile?.onboarding_dismissed_count || 0,
    });
  }, []);

  // Handle onboarding close (dismiss for current session only)
  // NOTE: This only hides onboarding for the current page session
  // It will show again on next page load/sign-in until user completes it
  const dismissOnboarding = useCallback(async () => {
    // Just hide for current session - don't persist to localStorage or database
    // This ensures onboarding shows again on next visit until completed
    setOnboardingState(prev => ({ 
      ...prev, 
      showOnboarding: false, 
      onboardingDismissed: true,
    }));
    
    console.log('[AuthProvider] Onboarding dismissed for current session (will show again next time)');
  }, []);

  // Handle onboarding complete
  const completeOnboarding = useCallback((data) => {
    setState(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        onboarding_completed_at: new Date().toISOString(),
        ...data,
      },
    }));
    setOnboardingState(prev => ({ ...prev, showOnboarding: false }));
    // Clear any dismissal tracking since onboarding is now complete
    localStorage.removeItem('onboarding_dismissed_until');
  }, []);

  // Trigger onboarding manually (for re-watching from profile)
  const triggerOnboarding = useCallback(() => {
    // Clear localStorage dismissal
    localStorage.removeItem('onboarding_dismissed_until');
    
    // Reset onboarding state to show the flow from the beginning
    setOnboardingState({
      showOnboarding: true,
      onboardingStep: 1,
      onboardingData: {
        referral_source: state.profile?.referral_source || null,
        referral_source_other: state.profile?.referral_source_other || '',
        user_intent: state.profile?.user_intent || null,
        email_opt_in_features: state.profile?.email_opt_in_features || false,
        email_opt_in_events: state.profile?.email_opt_in_events || false,
      },
      onboardingDismissed: false,
      dismissedCount: 0,
    });
    
    console.log('[AuthProvider] Onboarding triggered manually');
  }, [state.profile]);

  // Check onboarding status when profile loads
  useEffect(() => {
    if (state.isAuthenticated && state.profile) {
      // DEBUG: Log what's in the profile for onboarding check
      console.log('[AuthProvider] Checking onboarding status with profile:', {
        hasProfile: !!state.profile,
        onboarding_completed_at: state.profile?.onboarding_completed_at,
        onboarding_step: state.profile?.onboarding_step,
        profileKeys: state.profile ? Object.keys(state.profile) : [],
      });
      // Pass whether this is a fresh login (clears temporary dismissals)
      const isFresh = isFreshLoginRef.current;
      checkOnboardingStatus(state.profile, isFresh);
      // Reset the fresh login flag after checking (so page refreshes work correctly)
      if (isFresh) {
        isFreshLoginRef.current = false;
      }
    }
  }, [state.isAuthenticated, state.profile, checkOnboardingStatus]);

  // Context value
  const value = useMemo(() => ({
    // State
    user: state.user,
    profile: state.profile,
    session: state.session,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    isDataFetchReady: state.isDataFetchReady, // True when child providers can safely fetch user data
    authError: state.authError,
    sessionExpired: state.sessionExpired, // True when session token expired
    sessionRevoked: state.sessionRevoked, // True when session was revoked (e.g., logout from another device)
    
    // Onboarding State
    showOnboarding: onboardingState.showOnboarding,
    onboardingDismissed: onboardingState.onboardingDismissed,
    needsOnboarding: state.isAuthenticated && !state.profile?.onboarding_completed_at,
    
    // Methods
    loginWithGoogle,
    loginWithFacebook,
    loginWithEmail,
    signUp,
    logout,
    updateProfile,
    refreshProfile,
    refreshSession,
    clearAuthError,
    dismissOnboarding,
    completeOnboarding,
    triggerOnboarding,
    
    // Helpers
    isSupabaseConfigured,
  }), [
    state,
    onboardingState.showOnboarding,
    onboardingState.onboardingDismissed,
    loginWithGoogle,
    loginWithFacebook,
    loginWithEmail,
    signUp,
    logout,
    updateProfile,
    refreshProfile,
    refreshSession,
    clearAuthError,
    dismissOnboarding,
    completeOnboarding,
    triggerOnboarding,
  ]);

  // Handler for when React splash screen finishes (email login only)
  const handleSplashComplete = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      showSplashScreen: false,
      showWelcomeToast: true,
    }));
  }, []);

  return (
    <AuthContext.Provider value={value}>
      {children}
      
      {/* Splash Screen - full-screen branded loading shown on fresh login */}
      {state.showSplashScreen && (
        <SplashScreen
          duration={2000}
          onComplete={handleSplashComplete}
        />
      )}
      
      {/* Welcome Toast - shown briefly after splash completes */}
      {state.showWelcomeToast && !state.showSplashScreen && (
        <WelcomeToast
          userName={state.profile?.display_name || state.user?.user_metadata?.name || state.user?.email?.split('@')[0]}
          onDismiss={() => setState(prev => ({ ...prev, showWelcomeToast: false }))}
        />
      )}
      
      {/* Onboarding Modal - shown for new users who haven't completed it */}
      {onboardingState.showOnboarding && state.isAuthenticated && (
        <OnboardingFlow
          isOpen={onboardingState.showOnboarding}
          onClose={dismissOnboarding}
          onComplete={completeOnboarding}
          user={state.user}
          profile={state.profile}
          initialStep={onboardingState.onboardingStep}
          initialData={onboardingState.onboardingData}
        />
      )}
    </AuthContext.Provider>
  );
}

/**
 * useAuth Hook
 * Access auth context from any component
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * useUser Hook
 * Get the current user (null if not authenticated)
 */
export function useUser() {
  const { user } = useAuth();
  return user;
}

/**
 * useIsAuthenticated Hook
 * Check if user is authenticated
 */
export function useIsAuthenticated() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

/**
 * useProfile Hook
 * Get the current user's profile
 */
export function useProfile() {
  const { profile } = useAuth();
  return profile;
}
