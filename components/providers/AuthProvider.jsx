'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
};

/**
 * AuthProvider Component
 * Wraps the app and provides auth context
 */
export function AuthProvider({ children }) {
  const [state, setState] = useState(defaultAuthState);

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

  // Handle auth state changes
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState({
            user: session.user,
            profile,
            session,
            isLoading: false,
            isAuthenticated: true,
          });
        } else {
          setState({
            ...defaultAuthState,
            isLoading: false,
          });
        }
      } catch (err) {
        console.error('[AuthProvider] Error initializing auth:', err);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const unsubscribe = onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchProfile(session.user.id);
        
        // Check if there's a pending tier selection from the join page
        const pendingTier = localStorage.getItem('autorev_selected_tier');
        if (pendingTier && pendingTier !== profile?.subscription_tier) {
          try {
            // Update the profile with the selected tier
            const { data: updatedProfile } = await updateUserProfile({ 
              subscription_tier: pendingTier 
            });
            localStorage.removeItem('autorev_selected_tier');
            
            setState({
              user: session.user,
              profile: updatedProfile || { ...profile, subscription_tier: pendingTier },
              session,
              isLoading: false,
              isAuthenticated: true,
            });
            return;
          } catch (err) {
            console.error('[AuthProvider] Failed to apply selected tier:', err);
            localStorage.removeItem('autorev_selected_tier');
          }
        }
        
        setState({
          user: session.user,
          profile,
          session,
          isLoading: false,
          isAuthenticated: true,
        });
      } else if (event === 'SIGNED_OUT') {
        setState({
          ...defaultAuthState,
          isLoading: false,
        });
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setState(prev => ({
          ...prev,
          session,
        }));
      } else if (event === 'USER_UPDATED' && session?.user) {
        const profile = await fetchProfile(session.user.id);
        setState(prev => ({
          ...prev,
          user: session.user,
          profile,
        }));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [fetchProfile]);

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

  // Context value
  const value = useMemo(() => ({
    // State
    user: state.user,
    profile: state.profile,
    session: state.session,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    
    // Methods
    loginWithGoogle,
    loginWithEmail,
    signUp,
    logout,
    updateProfile,
    refreshProfile,
    
    // Helpers
    isSupabaseConfigured,
  }), [
    state,
    loginWithGoogle,
    loginWithEmail,
    signUp,
    logout,
    updateProfile,
    refreshProfile,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
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
