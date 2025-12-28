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
import dynamic from 'next/dynamic';

// Dynamically import OnboardingFlow to avoid SSR issues
const OnboardingFlow = dynamic(() => import('@/components/onboarding/OnboardingFlow'), {
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
 * Handles race conditions after OAuth callback
 */
async function initializeSessionWithRetry(maxRetries = 3, initialDelay = 100) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Use getUser() for server-validated session (more secure than getSession)
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        // If it's a refresh error, try to get a new session
        if (userError.message?.includes('refresh') || userError.message?.includes('token')) {
          console.log(`[AuthProvider] Token refresh needed on attempt ${attempt}`);
          // Trigger a session refresh
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (!sessionError && session) {
            return { session, user: session.user, error: null };
          }
        }
        lastError = userError;
        throw userError;
      }
      
      if (user) {
        // User validated, now get full session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          lastError = sessionError;
          throw sessionError;
        }
        
        console.log(`[AuthProvider] Session initialized on attempt ${attempt}`);
        return { session, user, error: null };
      }
      
      // No user found - this is valid (not logged in)
      return { session: null, user: null, error: null };
      
    } catch (err) {
      lastError = err;
      console.warn(`[AuthProvider] Init attempt ${attempt}/${maxRetries} failed:`, err.message);
      
      if (attempt < maxRetries) {
        // Exponential backoff: 100ms, 200ms, 400ms
        const delay = initialDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error('[AuthProvider] Session init failed after all retries');
  return { session: null, user: null, error: lastError };
}

/**
 * Check for auth callback completion cookie
 * Set by the OAuth callback route to signal successful auth
 */
function checkAuthCallbackCookie() {
  if (typeof document === 'undefined') return false;
  
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find(c => c.trim().startsWith('auth_callback_complete='));
  
  if (authCookie) {
    // Clear the cookie after reading
    document.cookie = 'auth_callback_complete=; max-age=0; path=/';
    return true;
  }
  return false;
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
  const refreshIntervalRef = useRef(null);
  const initAttemptRef = useRef(0);
  const lastVisibilityChangeRef = useRef(Date.now());
  const isAuthenticatedRef = useRef(false);
  
  // Keep the ref in sync with state
  useEffect(() => {
    isAuthenticatedRef.current = state.isAuthenticated;
  }, [state.isAuthenticated]);

  // Fetch user profile when authenticated
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) return null;
    
    try {
      const { data, error } = await getUserProfile();
      if (error) {
        console.error('[AuthProvider] Error fetching profile:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('[AuthProvider] Unexpected error fetching profile:', err);
      return null;
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
    const fromCallback = checkAuthCallbackCookie();
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
        });
        
        // If coming from OAuth callback, use retry logic to handle race conditions
        const maxRetries = (fromCallback || hasAuthTimestamp) ? 5 : 3;
        const { session, user, error: initError } = await initializeSessionWithRetry(maxRetries);
        
        if (initError) {
          console.error('[AuthProvider] Session init error:', initError);
          setState({
            ...defaultAuthState,
            isLoading: false,
            authError: initError.message,
          });
          return;
        }
        
        console.log('[AuthProvider] Session check result:', {
          hasSession: !!session,
          userId: user?.id?.slice(0, 8) + '...',
          expiresAt: session?.expires_at,
        });
        
        if (user && session) {
          // IMMEDIATELY set authenticated state so UI updates right away
          setState({
            user,
            profile: null, // Will be loaded below
            session,
            isLoading: false,
            isAuthenticated: true,
            authError: null,
          });
          console.log('[AuthProvider] User authenticated, loading profile...');
          
          // Clean up the auth_ts query param if present
          if (hasAuthTimestamp && typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('auth_ts');
            window.history.replaceState({}, '', url.pathname + url.search);
          }
          
          // Schedule proactive token refresh
          scheduleSessionRefresh(session);
          
          // Load profile in background
          const profile = await fetchProfile(user.id);
          if (profile) {
            setState(prev => ({ ...prev, profile }));
            console.log('[AuthProvider] Profile loaded:', {
              userId: user.id.slice(0, 8) + '...',
              tier: profile?.subscription_tier,
            });
          }
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
        // IMMEDIATELY set authenticated state so UI updates right away
        // Profile will be loaded in background
        console.log('[AuthProvider] Handling SIGNED_IN event');
        setState(prev => ({
          ...prev,
          user: session.user,
          session,
          isLoading: false,
          isAuthenticated: true,
          authError: null,
        }));
        console.log('[AuthProvider] Set authenticated=true, fetching profile...');
        scheduleSessionRefresh(session);
        
        // Now fetch profile in background (don't block UI)
        try {
          const profile = await fetchProfile(session.user.id);
          
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
              return;
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
          // User is still authenticated even if profile fails to load
        }
      } else if (event === 'SIGNED_OUT') {
        // Clear refresh timer on signout
        if (refreshIntervalRef.current) {
          clearTimeout(refreshIntervalRef.current);
        }
        setState({
          ...defaultAuthState,
          isLoading: false,
        });
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

  // Sign out
  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    const { error } = await authSignOut();
    if (error) {
      console.error('[AuthProvider] Sign out error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return { error };
    }
    // Auth state change will update the state
    return { error: null };
  }, []);

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
    setState(prev => ({ ...prev, authError: null }));
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

  return (
    <AuthContext.Provider value={value}>
      {children}
      
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
