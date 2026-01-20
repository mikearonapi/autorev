/**
 * Feed Tracking Hook
 * 
 * Tracks user interactions with the community feed for ML-based recommendations.
 * Handles impressions, views, dwell time, and engagement events.
 */

import { useCallback, useRef, useEffect } from 'react';

/**
 * Send tracking data to the API (non-hook helper)
 */
async function sendTrackingEvent(data) {
  try {
    await fetch('/api/community/feed/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error(`[FeedTracking] Failed to track ${data.action}:`, err);
  }
}

/**
 * Custom hook for tracking feed interactions
 * @param {string} sessionId - Unique session identifier
 * @returns {Object} Tracking functions
 */
export function useFeedTracking(sessionId) {
  const viewStartTime = useRef(null);
  const currentPostId = useRef(null);
  const currentPostMeta = useRef(null);
  const trackedImpressions = useRef(new Set());
  
  /**
   * Track a specific engagement action
   */
  const trackEngagement = useCallback(async (postId, action, extras = {}) => {
    if (!postId || !sessionId) return;
    sendTrackingEvent({ action, sessionId, postId, ...extras });
  }, [sessionId]);
  
  /**
   * Track batch impressions (posts shown in feed)
   */
  const trackImpressions = useCallback(async (posts) => {
    if (!posts || posts.length === 0 || !sessionId) return;
    
    // Filter out already tracked impressions
    const newPosts = posts.filter(p => !trackedImpressions.current.has(p.id));
    if (newPosts.length === 0) return;
    
    // Mark as tracked
    newPosts.forEach(p => trackedImpressions.current.add(p.id));
    
    sendTrackingEvent({
      action: 'impression',
      sessionId,
      posts: newPosts.map((post, index) => ({
        id: post.id,
        car_slug: post.car_slug,
        car_make: post.car_make,
        car_id: post.car_id,
        feedPosition: index,
      })),
    });
  }, [sessionId]);
  
  /**
   * Track when user views a specific post (swipes to it)
   */
  const trackView = useCallback(async (post, feedPosition) => {
    if (!post || !sessionId) return;
    
    // End tracking for previous post
    if (currentPostId.current && viewStartTime.current) {
      const dwellTime = Date.now() - viewStartTime.current;
      const prevMeta = currentPostMeta.current || {};
      
      // If user spent less than 1 second, it's a swipe_past
      if (dwellTime < 1000) {
        sendTrackingEvent({
          action: 'swipe_past',
          sessionId,
          postId: currentPostId.current,
          feedPosition: feedPosition - 1,
          ...prevMeta,
        });
      } else if (dwellTime >= 3000) {
        // If user spent 3+ seconds, track as dwell
        sendTrackingEvent({
          action: 'dwell',
          sessionId,
          postId: currentPostId.current,
          feedPosition: feedPosition - 1,
          dwellTimeMs: dwellTime,
          ...prevMeta,
        });
      }
    }
    
    // Start tracking new post
    currentPostId.current = post.id;
    currentPostMeta.current = {
      carSlug: post.car_slug,
      carMake: post.car_make,
      carId: post.car_id,
    };
    viewStartTime.current = Date.now();
    
    // Track the view
    sendTrackingEvent({
      action: 'view',
      sessionId,
      postId: post.id,
      carSlug: post.car_slug,
      carMake: post.car_make,
      carId: post.car_id,
      feedPosition,
    });
  }, [sessionId]);
  
  /**
   * Track detail view (user tapped to see more)
   */
  const trackDetailView = useCallback((post, feedPosition) => {
    if (!post) return;
    trackEngagement(post.id, 'detail_view', {
      carSlug: post.car_slug,
      carMake: post.car_make,
      carId: post.car_id,
      feedPosition,
    });
  }, [trackEngagement]);
  
  /**
   * Track like action
   */
  const trackLike = useCallback((post, feedPosition, isLiking) => {
    if (!post) return;
    trackEngagement(post.id, isLiking ? 'like' : 'unlike', {
      carSlug: post.car_slug,
      carMake: post.car_make,
      carId: post.car_id,
      feedPosition,
    });
  }, [trackEngagement]);
  
  /**
   * Track comment action
   */
  const trackComment = useCallback((post, feedPosition) => {
    if (!post) return;
    trackEngagement(post.id, 'comment', {
      carSlug: post.car_slug,
      carMake: post.car_make,
      carId: post.car_id,
      feedPosition,
    });
  }, [trackEngagement]);
  
  /**
   * Track share action
   */
  const trackShare = useCallback((post, feedPosition) => {
    if (!post) return;
    trackEngagement(post.id, 'share', {
      carSlug: post.car_slug,
      carMake: post.car_make,
      carId: post.car_id,
      feedPosition,
    });
  }, [trackEngagement]);
  
  /**
   * Track image swipe within a post
   */
  const trackImageSwipe = useCallback((post, feedPosition) => {
    if (!post) return;
    trackEngagement(post.id, 'image_swipe', {
      carSlug: post.car_slug,
      carMake: post.car_make,
      feedPosition,
    });
  }, [trackEngagement]);
  
  /**
   * Flush any pending dwell tracking on unmount
   */
  useEffect(() => {
    return () => {
      if (currentPostId.current && viewStartTime.current) {
        const dwellTime = Date.now() - viewStartTime.current;
        if (dwellTime >= 3000) {
          // Fire and forget on unmount
          fetch('/api/community/feed/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'dwell',
              sessionId,
              postId: currentPostId.current,
              dwellTimeMs: dwellTime,
            }),
          }).catch(() => {});
        }
      }
    };
  }, [sessionId]);
  
  return {
    trackImpressions,
    trackView,
    trackDetailView,
    trackLike,
    trackComment,
    trackShare,
    trackImageSwipe,
    trackEngagement,
  };
}

export default useFeedTracking;
