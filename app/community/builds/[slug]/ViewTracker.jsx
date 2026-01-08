'use client';

/**
 * View Tracker Component
 * 
 * Tracks page views with smart deduplication:
 * - Uses session storage to avoid duplicate calls on same page
 * - Sends hashed IP/user agent for server-side dedup
 * - Excludes owner views
 * - 1-hour deduplication window on server
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/AuthProvider';

// Generate a session ID that persists for the browser session
function getSessionId() {
  if (typeof window === 'undefined') return null;
  
  let sessionId = sessionStorage.getItem('autorev_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('autorev_session_id', sessionId);
  }
  return sessionId;
}

// Simple hash function for privacy
async function hashString(str) {
  if (!str || typeof window === 'undefined') return null;
  
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
  } catch {
    return null;
  }
}

export default function ViewTracker({ postId, ownerId }) {
  const { user } = useAuth();
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only track once per component mount
    if (hasTracked.current) return;
    
    // Don't track if user is the owner
    if (user?.id && user.id === ownerId) {
      return;
    }

    // Check if we've already tracked this post in this session
    const trackedKey = `viewed_${postId}`;
    if (sessionStorage.getItem(trackedKey)) {
      return;
    }

    async function trackView() {
      try {
        hasTracked.current = true;
        
        const sessionId = getSessionId();
        const userAgentHash = await hashString(navigator.userAgent);
        
        // Call the tracking function
        const { error } = await supabase.rpc('track_community_post_view', {
          p_post_id: postId,
          p_viewer_id: user?.id || null,
          p_session_id: sessionId,
          p_ip_hash: null, // IP hashing should be done server-side for accuracy
          p_user_agent_hash: userAgentHash,
          p_referer: document.referrer || null,
        });

        if (!error) {
          // Mark as tracked in session storage
          sessionStorage.setItem(trackedKey, 'true');
        }
      } catch (err) {
        console.error('[ViewTracker] Error tracking view:', err);
      }
    }

    // Small delay to avoid tracking on quick navigations
    const timer = setTimeout(trackView, 1000);
    
    return () => clearTimeout(timer);
  }, [postId, ownerId, user?.id]);

  // This component renders nothing
  return null;
}

