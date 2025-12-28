'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  signOut as authSignOut,
  onAuthStateChange,
  getUserProfile,
  updateUserProfile,
} from '@/lib/auth';
import { prefetchAllUserData, clearPrefetchCache } from '@/lib/prefetch';
import { useLoadingProgress } from './LoadingProgressProvider';
import dynamic from 'next/dynamic';

// Dynamically import AuthLoadingScreen to avoid SSR issues
const AuthLoadingScreen = dynamic(() => import('@/components/auth/AuthLoadingScreen'), {
  ssr: false,
});

// Dynamically import OnboardingFlow to avoid SSR issues
const OnboardingFlow = dynamic(() => import('@/components/onboarding/OnboardingFlow'), {
  ssr: false,
});

// Dynamically import AuthErrorBanner for session error notifications
const AuthErrorBanner = dynamic(() => import('@/components/auth/AuthErrorBanner'), {
  ssr: false,
});

/**
 * Auth Context
 * Provides authentication state and methods throughout the app
 */
const AuthContext = createContext(null);

/**
 * Default auth state
 */
const defaultAuthState = {
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  authError: null,
  sessionExpired: false, // True when session was invalidated (token expired)
  sessionRevoked: false, // True when session was revoked (e.g., logout from another device)
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
 * 1. Try refreshSession() first - this works with refresh token even if access token expired
 * 2. If refresh works, validate with getUser()
 * 3. If refresh fails, try getUser() directly (maybe access token is fine)
 * 4. If all fail and it's a stale session error, clear local storage
 * 
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} initialDelay - Initial delay in ms (doubles with each retry)
 * @param {string|null} expectedUserId - If provided from callback, verify user matches
 */
async function initializeSessionWithRetry(maxRetries = 3, initialDelay = 100, expectedUserId = null) {
  let lastError = null;
  let errorCategory = null;
  
  // FIRST: Try to refresh session - this is the most reliable recovery method
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
  
  // SECOND: Refresh didn't work, try getUser() with retries
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
  console.error('[AuthProvider] All auth attempts failed:', errorCategory);
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
  
  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout') || status === 0) {
    return ErrorCategory.NETWORK;
  }
  
  // Session was revoked/logged out on another device
  if (message.includes('session has been revoked') || 
      message.includes('logged out') ||
      message.includes('user session not found') ||
      (status === 401 && message.includes('session'))) {
    return ErrorCategory.SESSION_REVOKED;
  }
  
  // Session legitimately expired
  if (message.includes('session not found') ||
      message.includes('session from session_id claim') ||
      message.includes('jwt expired') ||
      message.includes('token expired')) {
    return ErrorCategory.SESSION_EXPIRED;
  }
  
  // Invalid/malformed token
  if (message.includes('invalid refresh token') ||
      message.includes('refresh_token') ||
      message.includes('malformed') ||
      message.includes('invalid jwt') ||
      status === 403) {
    return ErrorCategory.INVALID_TOKEN;
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
  const { loadingStates, isShowingProgress, markComplete, markStarted, markFailed, retryStep, startProgress, endProgress, dismissProgress, resetProgress } = useLoadingProgress();
  const refreshIntervalRef = useRef(null);
  const initAttemptRef = useRef(0);
  const lastVisibilityChangeRef = useRef(Date.now());
  const isAuthenticatedRef = useRef(false);
  
  // Keep the ref in sync with state
  useEffect(() => {
    isAuthenticatedRef.current = state.isAuthenticated;
  }, [state.isAuthenticated]);

  // Fetch user profile when authenticated
  // Returns profile data on success, or a minimal profile object on failure
  // This ensures the app can continue functioning even if profile fetch fails
  const fetchProfile = useCallback(async (userId, timeout = 5000) => {
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
              subscription_tier: 'free',
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
                setState({
                  user: refreshData.user,
                  profile: null,
                  session: refreshData.session,
                  isLoading: false,
                  isAuthenticated: true,
                  authError: null,
                });
                scheduleSessionRefresh(refreshData.session);
                const profile = await fetchProfile(refreshData.user.id);
                if (profile) {
                  setState(prev => ({ ...prev, profile }));
                }
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
          setState({
            user,
            profile: null, // Will be loaded below
            session,
            isLoading: false,
            isAuthenticated: true,
            authError: null,
          });
          console.log('[AuthProvider] User authenticated via initializeAuth');
          
          // Clean up the auth_ts query param if present
          if (hasAuthTimestamp && typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('auth_ts');
            window.history.replaceState({}, '', url.pathname + url.search);
          }
          
          // Schedule proactive token refresh
          scheduleSessionRefresh(session);
          
          // For page refresh, load profile quickly in background (no progress screen)
          // The SIGNED_IN event will handle fresh logins with progress screen
          fetchProfile(user.id).then(profile => {
            if (profile) {
              setState(prev => ({ ...prev, profile }));
              console.log('[AuthProvider] Profile loaded via initializeAuth:', {
                userId: user.id.slice(0, 8) + '...',
                tier: profile?.subscription_tier,
              });
            }
          }).catch(err => {
            console.warn('[AuthProvider] Profile fetch error in initializeAuth:', err);
          });
          
          // Prefetch user data in background for snappy navigation
          prefetchAllUserData(user.id).catch(err => 
            console.warn('[AuthProvider] Background prefetch error:', err)
          );
        } else {
          console.log('[AuthProvider] No session found, user is not authenticated');
          setState({
            ...defaultAuthState,
            isLoading: false,
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
        // Check if this is a fresh login or just a page refresh with existing session
        const isFreshLogin = !isAuthenticatedRef.current;
        console.log('[AuthProvider] Handling SIGNED_IN event:', { isFreshLogin });
        
        // Mark as authenticated
        isAuthenticatedRef.current = true;
        
        // Update state
        setState(prev => ({
          ...prev,
          user: session.user,
          session,
          isLoading: false,
          isAuthenticated: true,
          authError: null,
        }));
        scheduleSessionRefresh(session);
        
        // Only show progress screen for FRESH logins (OAuth redirect, password login)
        // Skip for page refresh - data loads silently in background
        if (isFreshLogin) {
          console.log('[AuthProvider] Fresh login - showing progress screen');
          startProgress();
          
          // Mark profile loading as started
          markStarted('profile');
          
          // Fetch profile with progress tracking
          try {
            // Start prefetching user data in parallel
            prefetchAllUserData(session.user.id).catch(err => 
              console.warn('[AuthProvider] Background prefetch error:', err)
            );
            
            const profile = await fetchProfile(session.user.id);
            
            // Check for fetch error flag
            if (profile?._fetchError) {
              console.warn('[AuthProvider] Profile fetch had errors, using fallback');
              markFailed('profile', 'Failed to load profile, using defaults');
            } else {
              markComplete('profile');
            }
            
            // Check if there's a pending tier selection from the join page
            const pendingTier = localStorage.getItem('autorev_selected_tier');
            if (pendingTier && pendingTier !== profile?.subscription_tier) {
              try {
                const { data: updatedProfile } = await updateUserProfile({ 
                  subscription_tier: pendingTier 
                });
                localStorage.removeItem('autorev_selected_tier');
                setState(prev => ({
                  ...prev,
                  profile: updatedProfile || { ...profile, subscription_tier: pendingTier },
                }));
              } catch (err) {
                console.error('[AuthProvider] Failed to apply selected tier:', err);
                localStorage.removeItem('autorev_selected_tier');
              }
            }
            
            // Update profile in state
            if (profile) {
              setState(prev => ({ ...prev, profile }));
              console.log('[AuthProvider] Profile loaded:', { tier: profile?.subscription_tier });
            }
          } catch (err) {
            console.error('[AuthProvider] Error loading profile:', err);
            markFailed('profile', err.message || 'Failed to load profile');
          }
        } else {
          console.log('[AuthProvider] Page refresh - skipping progress screen');
          // initializeAuth already handled profile loading
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
        // Reset loading progress screen state
        resetProgress();
        setState({
          ...defaultAuthState,
          isLoading: false,
        });
        // Also reset onboarding state
        setOnboardingState(defaultOnboardingState);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('[AuthProvider] Token refreshed via Supabase');
        // IMPORTANT: Also update user and isAuthenticated in case initial auth failed
        // but token refresh succeeded (auth recovery scenario)
        const needsProfileLoad = !state.isAuthenticated || !state.profile;
        
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
            authError: null,
          };
        });
        scheduleSessionRefresh(session);
        
        // If we just recovered auth or don't have a profile, load it
        if (needsProfileLoad) {
          fetchProfile(session.user.id).then(profile => {
            if (profile) {
              setState(prev => ({ ...prev, profile }));
              console.log('[AuthProvider] Profile loaded after token refresh:', { tier: profile?.subscription_tier });
            }
          }).catch(err => {
            console.error('[AuthProvider] Error loading profile after token refresh:', err);
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
        console.log('[AuthProvider] Initial session detected via event');
        setState(prev => {
          // Only update if we're not already authenticated
          if (prev.isAuthenticated) {
            return prev;
          }
          return {
            ...prev,
            user: session.user,
            session,
            isAuthenticated: true,
            isLoading: false,
            authError: null,
          };
        });
        scheduleSessionRefresh(session);
        
        // Load profile if needed
        fetchProfile(session.user.id).then(profile => {
          if (profile) {
            setState(prev => ({ ...prev, profile }));
          }
        }).catch(err => {
          console.error('[AuthProvider] Error loading profile after initial session:', err);
        });
      } else if (session?.user && !isAuthenticatedRef.current) {
        // Catch-all: If we have a valid session but aren't authenticated,
        // this is an auth recovery scenario
        console.log('[AuthProvider] Auth recovery detected via event:', event);
        setState(prev => ({
          ...prev,
          user: session.user,
          session,
          isAuthenticated: true,
          isLoading: false,
          authError: null,
        }));
        scheduleSessionRefresh(session);
        
        fetchProfile(session.user.id).then(profile => {
          if (profile) {
            setState(prev => ({ ...prev, profile }));
          }
        }).catch(err => {
          console.error('[AuthProvider] Error loading profile after auth recovery:', err);
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
            } else if (!user && state.isAuthenticated) {
              // User was authenticated but now no user - logged out in another tab
              console.log('[AuthProvider] User logged out in another tab');
              setState({
                ...defaultAuthState,
                isLoading: false,
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
      if (e.key?.includes('supabase.auth') && e.newValue === null && state.isAuthenticated) {
        console.log('[AuthProvider] Auth storage cleared in another tab, logging out');
        setState({
          ...defaultAuthState,
          isLoading: false,
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
  }, [fetchProfile, scheduleSessionRefresh, state.isAuthenticated]);

  // Sign in with Google
  const loginWithGoogle = useCallback(async (redirectTo) => {
    setState(prev => ({ ...prev, isLoading: true }));
    const { error } = await signInWithGoogle(redirectTo);
    if (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { error };
    }
    return { error: null };
  }, []);

  // Sign in with email
  const loginWithEmail = useCallback(async (email, password) => {
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
    
    // Reset loading progress immediately
    resetProgress();
    
    // Clear prefetch cache
    clearPrefetchCache();
    
    // INSTANT: Clear state immediately so UI updates right away
    setState({
      ...defaultAuthState,
      isLoading: false,
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
  const checkOnboardingStatus = useCallback(async (profile) => {
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
    
    // If onboarding is already completed, don't show
    if (profile?.onboarding_completed_at) {
      setOnboardingState(prev => ({ ...prev, showOnboarding: false }));
      return;
    }
    
    // If user has permanently opted out (too many dismissals), don't show
    if (profile?.onboarding_opted_out) {
      console.log('[AuthProvider] User has opted out of onboarding');
      setOnboardingState(prev => ({ ...prev, showOnboarding: false, onboardingDismissed: true }));
      return;
    }
    
    // Check localStorage for session-based dismissal (persists across browser sessions)
    const dismissedUntil = localStorage.getItem('onboarding_dismissed_until');
    if (dismissedUntil) {
      const dismissedTime = parseInt(dismissedUntil, 10);
      // Only honor dismissal for 24 hours
      if (Date.now() < dismissedTime) {
        console.log('[AuthProvider] Onboarding dismissed temporarily');
        setOnboardingState(prev => ({ ...prev, showOnboarding: false, onboardingDismissed: true }));
        return;
      } else {
        // Dismissal expired, clear it
        localStorage.removeItem('onboarding_dismissed_until');
      }
    }

    // Show onboarding for users who haven't completed it
    const dismissedCount = profile?.onboarding_dismissed_count || 0;
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
      dismissedCount,
    });
  }, []);

  // Handle onboarding close (dismiss with tracking)
  const dismissOnboarding = useCallback(async () => {
    const newDismissedCount = (onboardingState.dismissedCount || 0) + 1;
    const shouldOptOut = newDismissedCount >= MAX_ONBOARDING_DISMISSALS;
    
    // Set localStorage to dismiss for 24 hours
    const dismissUntil = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    localStorage.setItem('onboarding_dismissed_until', dismissUntil.toString());
    
    // Update local state immediately
    setOnboardingState(prev => ({ 
      ...prev, 
      showOnboarding: false, 
      onboardingDismissed: true,
      dismissedCount: newDismissedCount,
    }));
    
    // Track dismissal in database
    if (state.user?.id) {
      try {
        const response = await fetch(`/api/users/${state.user.id}/onboarding/dismiss`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ optOut: shouldOptOut }),
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('[AuthProvider] Onboarding dismissed:', { 
            count: result.dismissedCount, 
            optedOut: result.optedOut 
          });
          
          // Update profile state if opted out
          if (result.optedOut) {
            setState(prev => ({
              ...prev,
              profile: { ...prev.profile, onboarding_opted_out: true },
            }));
          }
        }
      } catch (err) {
        console.error('[AuthProvider] Failed to track dismissal:', err);
        // Continue anyway - localStorage dismissal still works
      }
    }
  }, [state.user?.id, onboardingState.dismissedCount]);

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

  // Check onboarding status when profile loads
  useEffect(() => {
    if (state.isAuthenticated && state.profile) {
      checkOnboardingStatus(state.profile);
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
    authError: state.authError,
    sessionExpired: state.sessionExpired, // True when session token expired
    sessionRevoked: state.sessionRevoked, // True when session was revoked (e.g., logout from another device)
    
    // Onboarding State
    showOnboarding: onboardingState.showOnboarding,
    onboardingDismissed: onboardingState.onboardingDismissed,
    needsOnboarding: state.isAuthenticated && !state.profile?.onboarding_completed_at,
    
    // Methods
    loginWithGoogle,
    loginWithEmail,
    signUp,
    logout,
    updateProfile,
    refreshProfile,
    refreshSession,
    clearAuthError,
    dismissOnboarding,
    completeOnboarding,
    
    // Helpers
    isSupabaseConfigured,
  }), [
    state,
    onboardingState.showOnboarding,
    onboardingState.onboardingDismissed,
    loginWithGoogle,
    loginWithEmail,
    signUp,
    logout,
    updateProfile,
    refreshProfile,
    refreshSession,
    clearAuthError,
    dismissOnboarding,
    completeOnboarding,
  ]);

  // Handler for sign-in button in error banner
  const handleErrorBannerSignIn = useCallback(() => {
    // Clear the error and redirect to trigger login
    clearAuthError();
    loginWithGoogle();
  }, [clearAuthError, loginWithGoogle]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      
      {/* Auth Error Banner - shown when session is revoked/expired */}
      {!state.isLoading && !state.isAuthenticated && (state.sessionExpired || state.sessionRevoked || state.authError) && (
        <AuthErrorBanner
          sessionExpired={state.sessionExpired}
          sessionRevoked={state.sessionRevoked}
          authError={state.authError}
          onSignIn={handleErrorBannerSignIn}
          onDismiss={clearAuthError}
        />
      )}
      
      {/* Auth Loading Screen - shown after sign-in while data loads */}
      <AuthLoadingScreen
        isVisible={isShowingProgress}
        loadingStates={loadingStates}
        onComplete={endProgress}
        onDismiss={dismissProgress}
        onRetry={retryStep}
        userName={state.profile?.display_name || state.user?.user_metadata?.name}
        userAvatar={state.profile?.avatar_url || state.user?.user_metadata?.avatar_url}
      />
      
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
