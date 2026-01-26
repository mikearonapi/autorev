'use client';

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/AuthProvider';
import { usePointsNotification } from '@/components/providers/PointsNotificationProvider';
import BuildDetailSheet from './BuildDetailSheet';
import CommentsSheet from './CommentsSheet';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton, AvatarSkeleton } from '@/components/ui/Skeleton';
import { Icons } from '@/components/ui/Icons';
import { useFeedTracking } from '@/hooks/useFeedTracking';
import { useCommunityBuildsInfinite, useToggleLike, communityKeys } from '@/hooks/useCommunityData';
import { TITLES } from '@/app/(app)/dashboard/components/UserGreeting';
import styles from './page.module.css';

/**
 * Legacy URL redirect handler - wrapped in Suspense for useSearchParams
 */
function LegacyTabRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'events') {
      router.replace('/community/events');
    } else if (tabParam === 'leaderboard') {
      router.replace('/community/leaderboard');
    }
  }, [searchParams, router]);
  
  return null;
}

/**
 * Community Builds Page - Card-based Feed with Aspect Ratio Toggle
 * Clean, content-first design optimized for viewing builds
 * 
 * This is the primary /community experience.
 * Events and Leaderboard are now separate routes.
 * 
 * Features:
 * - 4:5 default aspect ratio with 3:2 horizontal toggle
 * - Persistent likes via API (stored in database)
 * - AI-moderated comments
 * - Share functionality
 */

// Minimal Icons
const HeartIcon = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} 
    stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <polyline points="16 6 12 2 8 6"/>
    <line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);

const CommentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);

const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const ScrollHintIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const SwipeLeftIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const SwipeRightIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

// Aspect Ratio Toggle Icon
const AspectRatioIcon = ({ isWide }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {isWide ? (
      // 3:2 horizontal icon
      <rect x="2" y="6" width="20" height="12" rx="2" />
    ) : (
      // 4:5 vertical icon  
      <rect x="5" y="2" width="14" height="20" rx="2" />
    )}
  </svg>
);

const PLACEHOLDER_IMAGE = '/images/placeholder-car.jpg';

/**
 * Skeleton loader for build feed - matches the build card layout
 */
function BuildFeedSkeleton() {
  return (
    <div className={styles.feedContent}>
      {/* Build Info Card Skeleton */}
      <div className={styles.buildCard} style={{ cursor: 'default' }}>
        <div className={styles.cardHeader}>
          <AvatarSkeleton size={36} />
          <div className={styles.headerText} style={{ flex: 1 }}>
            <Skeleton height={16} width="40%" variant="rounded" />
            <Skeleton height={20} width="70%" variant="rounded" style={{ marginTop: 4 }} />
            <Skeleton height={14} width="50%" variant="rounded" style={{ marginTop: 4 }} />
          </div>
        </div>
        {/* Stats Row Skeleton */}
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <Skeleton height={24} width={50} variant="rounded" />
            <Skeleton height={12} width={30} variant="rounded" style={{ marginTop: 2 }} />
          </div>
          <div className={styles.stat}>
            <Skeleton height={24} width={50} variant="rounded" />
            <Skeleton height={12} width={30} variant="rounded" style={{ marginTop: 2 }} />
          </div>
          <div className={styles.stat}>
            <Skeleton height={24} width={50} variant="rounded" />
            <Skeleton height={12} width={30} variant="rounded" style={{ marginTop: 2 }} />
          </div>
        </div>
      </div>
      
      {/* Image Card Skeleton */}
      <div className={styles.imageCard}>
        <Skeleton height="100%" width="100%" variant="rectangular" />
      </div>
      
      {/* Actions Row Skeleton */}
      <div className={styles.actionsRow}>
        <Skeleton height={36} width={70} variant="rounded" />
        <Skeleton height={36} width={70} variant="rounded" />
        <Skeleton height={36} width={70} variant="rounded" />
      </div>
    </div>
  );
}

export default function CommunityBuildsPage() {
  const { user } = useAuth();
  const { showPointsEarned } = usePointsNotification();
  const queryClient = useQueryClient();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [likedItems, setLikedItems] = useState(new Map()); // Map of postId -> { liked, count }
  const [showDetails, setShowDetails] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [isLikeProcessing, setIsLikeProcessing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('4:5'); // '4:5' (vertical/Instagram) or '3:2' (horizontal)
  
  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const touchStartTime = useRef(0);
  const swipeDirection = useRef(null);
  
  // Toggle aspect ratio
  const toggleAspectRatio = useCallback(() => {
    setAspectRatio(prev => prev === '4:5' ? '3:2' : '4:5');
  }, []);
  
  // Generate session seed once per page load (stays consistent during session)
  const [sessionSeed] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `${today}-${randomPart}`;
  });
  
  // Feed tracking for ML recommendations
  const {
    trackImpressions,
    trackView,
    trackDetailView,
    trackLike,
    trackComment,
    trackShare,
    trackImageSwipe,
  } = useFeedTracking(sessionSeed);
  
  // React Query hooks for community data - infinite loading
  const { 
    data: buildsData, 
    isLoading, 
    error: queryError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCommunityBuildsInfinite(
    { limit: 20, sort: 'algorithm', seed: sessionSeed },
    { enabled: true }
  );
  // Flatten pages into single builds array
  const builds = useMemo(() => {
    if (!buildsData?.pages) return [];
    return buildsData.pages.flatMap(page => page.builds || []);
  }, [buildsData?.pages]);
  const error = queryError ? 'Unable to load builds' : null;
  
  const toggleLikeMutation = useToggleLike();
  
  // Track impressions ref to avoid dependency issues
  const trackImpressionsRef = useRef(trackImpressions);
  trackImpressionsRef.current = trackImpressions;
  
  // Track impressions when builds load
  useEffect(() => {
    if (builds.length > 0) {
      trackImpressionsRef.current(builds);
    }
  }, [builds]);
  
  // Derived state - must be defined before useEffects that use it
  const currentBuild = builds[currentIndex];
  
  const buildImages = currentBuild?.images?.length > 0 
    ? currentBuild.images 
    : currentBuild?.car_image_url 
      ? [{ blob_url: currentBuild.car_image_url }]
      : [{ blob_url: PLACEHOLDER_IMAGE }];
  
  
  // Fetch like status for current build when user is logged in
  useEffect(() => {
    async function fetchLikeStatus() {
      if (!currentBuild?.id) return;
      
      // If we already have like status for this post, don't refetch
      if (likedItems.has(currentBuild.id)) return;
      
      try {
        const res = await fetch(`/api/community/posts/${currentBuild.id}/like`);
        if (res.ok) {
          const data = await res.json();
          setLikedItems(prev => new Map(prev).set(currentBuild.id, {
            liked: data.liked,
            count: data.likeCount,
          }));
        }
      } catch (err) {
        // Silently fail - will show local count
        console.error('[Community] Failed to fetch like status:', err);
      }
    }
    
    fetchLikeStatus();
  }, [currentIndex, builds]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Track view ref to avoid dependency issues
  const trackViewRef = useRef(trackView);
  trackViewRef.current = trackView;
  
  // Track view when user navigates to a new build
  useEffect(() => {
    if (currentBuild && builds.length > 0) {
      trackViewRef.current(currentBuild, currentIndex);
    }
  }, [currentIndex, currentBuild, builds.length]);
  
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [currentIndex]);
  
  // Navigation - fetch more when near end, loop only when no more to load
  const goToNext = useCallback(() => {
    if (builds.length === 0) return;
    
    setCurrentIndex(prev => {
      const nextIndex = prev + 1;
      
      // If near the end (3 builds away), fetch more
      if (nextIndex >= builds.length - 3 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
      
      // If at the last build and no more to load, loop back to the first
      if (nextIndex >= builds.length) {
        return hasNextPage ? prev : 0; // Stay on current if loading, else loop
      }
      return nextIndex;
    });
    setShowDetails(false);
    setShowComments(false);
  }, [builds.length, hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  const goToPrev = useCallback(() => {
    if (builds.length === 0) return;
    
    setCurrentIndex(prev => {
      // If at the first build, loop to the last
      if (prev <= 0) {
        return builds.length - 1;
      }
      return prev - 1;
    });
    setShowDetails(false);
    setShowComments(false);
  }, [builds.length]);
  
  const goToNextImage = useCallback(() => {
    if (currentImageIndex < buildImages.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
      // Track image swipe for ML
      if (currentBuild) {
        trackImageSwipe(currentBuild, currentIndex);
      }
    }
  }, [currentImageIndex, buildImages.length, currentBuild, currentIndex, trackImageSwipe]);
  
  const goToPrevImage = useCallback(() => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
      // Track image swipe for ML
      if (currentBuild) {
        trackImageSwipe(currentBuild, currentIndex);
      }
    }
  }, [currentImageIndex, currentBuild, currentIndex, trackImageSwipe]);
  
  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showComments) return; // Don't navigate when comments are open
      if (e.key === 'ArrowDown') { e.preventDefault(); goToNext(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); goToPrev(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goToNextImage(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goToPrevImage(); }
      else if (e.key === 'Escape') { setShowDetails(false); setShowComments(false); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, goToNextImage, goToPrevImage, showComments]);
  
  // Touch handling
  const handleTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    touchStartTime.current = Date.now();
    swipeDirection.current = null;
  }, []);
  
  const handleTouchMove = useCallback((e) => {
    if (swipeDirection.current) return;
    const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (deltaX > 10 || deltaY > 10) {
      swipeDirection.current = deltaX > deltaY ? 'horizontal' : 'vertical';
    }
  }, []);
  
  const handleTouchEnd = useCallback((e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaY = touchStartY.current - touchEndY;
    const deltaX = touchStartX.current - touchEndX;
    const deltaTime = Date.now() - touchStartTime.current;
    
    if (swipeDirection.current === 'horizontal' && (Math.abs(deltaX) > 50 || Math.abs(deltaX) / deltaTime > 0.5)) {
      if (deltaX > 0) goToNextImage();
      else goToPrevImage();
    } else if (swipeDirection.current === 'vertical' && !showDetails && !showComments && (Math.abs(deltaY) > 50 || Math.abs(deltaY) / deltaTime > 0.5)) {
      if (deltaY > 0) goToNext();
      else goToPrev();
    }
  }, [goToNext, goToPrev, goToNextImage, goToPrevImage, showDetails, showComments]);
  
  // Mouse wheel
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let isScrolling = false;
    const handleWheel = (e) => {
      if (showDetails || showComments) return;
      e.preventDefault();
      if (isScrolling) return;
      isScrolling = true;
      if (e.deltaY > 20) goToNext();
      else if (e.deltaY < -20) goToPrev();
      setTimeout(() => { isScrolling = false; }, 400);
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [goToNext, goToPrev, showDetails, showComments]);
  
  // Toggle Like - now uses React Query mutation for persistence
  const toggleLike = useCallback(async (buildId) => {
    if (isLikeProcessing || toggleLikeMutation.isPending) return;
    
    // Get current state
    const currentState = likedItems.get(buildId) || { 
      liked: false, 
      count: builds.find(b => b.id === buildId)?.like_count || 0 
    };
    
    // Optimistic update
    const newLiked = !currentState.liked;
    const newCount = newLiked ? currentState.count + 1 : Math.max(currentState.count - 1, 0);
    
    setLikedItems(prev => new Map(prev).set(buildId, {
      liked: newLiked,
      count: newCount,
    }));
    
    // Track the like/unlike for ML
    const build = builds.find(b => b.id === buildId);
    trackLike(build, currentIndex, newLiked);
    
    // If user is not logged in, show the local state but warn on next interaction
    if (!user) {
      // Keep the optimistic update but it won't persist
      return;
    }
    
    setIsLikeProcessing(true);
    
    try {
      const result = await toggleLikeMutation.mutateAsync({ postId: buildId });
      // Update with actual server state
      setLikedItems(prev => new Map(prev).set(buildId, {
        liked: result.liked,
        count: result.likeCount,
      }));
      // Show points notification for new likes only
      if (result.liked && !currentState.liked) {
        showPointsEarned(5, 'Build liked');
      }
    } catch (err) {
      if (err.status === 401) {
        // User not logged in - revert optimistic update
        setLikedItems(prev => new Map(prev).set(buildId, currentState));
      }
      // On error, keep the optimistic state for better UX
      console.error('[Community] Like error:', err);
    } finally {
      setIsLikeProcessing(false);
    }
  }, [user, likedItems, builds, isLikeProcessing, currentIndex, trackLike, toggleLikeMutation, showPointsEarned]);
  
  // Share
  const shareBuild = useCallback(async (build) => {
    const url = `${window.location.origin}/community/builds/${build.slug}`;
    
    // Track share for ML
    trackShare(build, currentIndex);
    
    if (navigator.share) {
      try { await navigator.share({ title: build.title, url }); } catch (e) {}
    } else {
      await navigator.clipboard.writeText(url);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 1500);
    }
  }, [currentIndex, trackShare]);
  
  // Open comments
  const openComments = useCallback(() => {
    setShowComments(true);
  }, []);
  
  // Handle comment added
  const handleCommentAdded = useCallback(() => {
    // Track comment for ML
    if (currentBuild) {
      trackComment(currentBuild, currentIndex);
    }
    
    // Optimistically update the comment count in React Query cache (infinite query format)
    const queryKey = communityKeys.buildsList({ limit: 20, sort: 'algorithm', seed: sessionSeed, infinite: true });
    queryClient.setQueryData(queryKey, (oldData) => {
      if (!oldData?.pages) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.map(page => ({
          ...page,
          builds: page.builds.map(build =>
            build.id === currentBuild?.id
              ? { ...build, comment_count: (build.comment_count || 0) + 1 }
              : build
          ),
        })),
      };
    });
  }, [currentBuild, currentIndex, trackComment, queryClient, sessionSeed]);
  
  // Format number helper
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };
  
  // Get like display data for current build
  const getLikeData = (buildId) => {
    const state = likedItems.get(buildId);
    if (state) {
      return { liked: state.liked, count: state.count };
    }
    const build = builds.find(b => b.id === buildId);
    return { liked: false, count: build?.like_count || 0 };
  };

  return (
    <div className={styles.container} ref={containerRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {/* Handle legacy ?tab= URLs - wrapped in Suspense for useSearchParams */}
      <Suspense fallback={null}>
        <LegacyTabRedirect />
      </Suspense>
      
      {/* Loading - Skeleton that matches build feed layout */}
      {isLoading && <BuildFeedSkeleton />}
      
      {/* Error/Empty */}
      {!isLoading && (error || builds.length === 0) && (
        <EmptyState
          icon={error ? Icons.alertTriangle : Icons.car}
          title={error ? 'Something went wrong' : 'No builds yet'}
          description={error || 'Be the first to share a build with the community!'}
          action={{ label: 'Share Your Build', href: '/garage' }}
          variant="centered"
        />
      )}
      
      {/* Main Content - Fixed Viewport Layout */}
      {currentBuild && !isLoading && (
        <>
          <div className={styles.feedContent}>
            {/* Build Info Card */}
            <div className={styles.buildCard} onClick={() => {
              trackDetailView(currentBuild, currentIndex);
              setShowDetails(true);
            }}>
              <div className={styles.cardHeader}>
                <div className={styles.avatar}>
                  {currentBuild.author?.avatar_url ? (
                    <Image src={currentBuild.author.avatar_url} alt="" width={36} height={36} />
                  ) : (
                    <span>{currentBuild.author?.display_name?.charAt(0) || 'A'}</span>
                  )}
                </div>
                <div className={styles.headerText}>
                <div className={styles.userLine}>
                  <span className={styles.username}>{currentBuild.author?.display_name || 'Anonymous'}</span>
                  {currentBuild.author?.selected_title && TITLES[currentBuild.author.selected_title] && (
                    <span 
                      className={styles.badge}
                      style={{ 
                        color: TITLES[currentBuild.author.selected_title].color,
                        background: `${TITLES[currentBuild.author.selected_title].color}15`,
                      }}
                    >
                      {TITLES[currentBuild.author.selected_title].display}
                    </span>
                  )}
                </div>
                  <div className={styles.buildTitleRow}>
                    <h2 className={styles.buildTitle}>{currentBuild.title}</h2>
                  </div>
                  <span className={styles.carName}>{currentBuild.car_name}</span>
                </div>
                <ChevronIcon />
              </div>
              
              {/* Stats Row - SOURCE OF TRUTH: Only use computedPerformance (dynamically calculated)
                  NEVER use build_data.final_hp etc. - those are stale stored values that don't
                  reflect the user's current installed modifications. Always calculate from
                  the linked vehicle's installed_modifications via computedPerformance. */}
              {(currentBuild.computedPerformance?.upgraded?.hp || currentBuild.car_specs?.hp || 
                currentBuild.car_specs?.torque || currentBuild.car_specs?.zero_to_sixty || 
                currentBuild.car_specs?.top_speed) && (
                <div className={styles.statsRow}>
                  {(currentBuild.computedPerformance?.upgraded?.hp || currentBuild.car_specs?.hp) && (
                    <div className={styles.stat}>
                      <span className={styles.statValue}>
                        {/* SOURCE OF TRUTH: computedPerformance (live) > car_specs (stock) 
                            Never use build_data.final_hp - it's stale! */}
                        {Math.round(currentBuild.computedPerformance?.upgraded?.hp || currentBuild.car_specs?.hp)}
                      </span>
                      <span className={styles.statLabel}>HP</span>
                    </div>
                  )}
                  
                  {(currentBuild.computedPerformance?.upgraded?.torque || currentBuild.car_specs?.torque) && (
                    <div className={styles.stat}>
                      <span className={styles.statValue}>
                        {Math.round(currentBuild.computedPerformance?.upgraded?.torque || currentBuild.car_specs?.torque)}
                      </span>
                      <span className={styles.statLabel}>LB-FT</span>
                    </div>
                  )}
                  
                  {(currentBuild.computedPerformance?.upgraded?.zeroToSixty || currentBuild.car_specs?.zero_to_sixty) && (
                    <div className={styles.stat}>
                      <span className={styles.statValue}>
                        {(currentBuild.computedPerformance?.upgraded?.zeroToSixty || currentBuild.car_specs?.zero_to_sixty)?.toFixed?.(1) || 
                          currentBuild.computedPerformance?.upgraded?.zeroToSixty || currentBuild.car_specs?.zero_to_sixty}
                        <span className={styles.statSuffix}>s</span>
                      </span>
                      <span className={styles.statLabel}>0-60</span>
                    </div>
                  )}
                  
                  {currentBuild.car_specs?.top_speed && (
                    <div className={styles.stat}>
                      <span className={styles.statValue}>{currentBuild.car_specs.top_speed}</span>
                      <span className={styles.statLabel}>MPH</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Image - Fills Available Space */}
            <div className={`${styles.imageCard} ${aspectRatio === '3:2' ? styles.imageCardWide : ''}`}>
              <div className={styles.imageContainer}>
                <div className={styles.imageTrack} style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}>
                  {buildImages.map((img, idx) => (
                    <div key={img.id || idx} className={styles.imageSlide}>
                      <Image
                        src={img.blob_url || img.thumbnail_url || PLACEHOLDER_IMAGE}
                        alt={currentBuild.title}
                        fill
                        className={styles.image}
                        sizes="100vw"
                        priority={idx === 0}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Aspect Ratio Toggle */}
              <button 
                className={styles.aspectToggle}
                onClick={toggleAspectRatio}
                aria-label={`Switch to ${aspectRatio === '4:5' ? '3:2 horizontal' : '4:5 vertical'} aspect ratio`}
              >
                <AspectRatioIcon isWide={aspectRatio === '4:5'} />
                <span>{aspectRatio === '4:5' ? '3:2' : '4:5'}</span>
              </button>
              
              {/* Image Dots with Swipe Hints - Top */}
              {buildImages.length > 1 && (
                <div className={styles.dots}>
                  <span className={`${styles.swipeHint} ${styles.swipeHintLeft}`}>
                    <SwipeLeftIcon />
                  </span>
                  {buildImages.map((_, idx) => (
                    <span key={idx} className={`${styles.dot} ${idx === currentImageIndex ? styles.dotActive : ''}`} />
                  ))}
                  <span className={`${styles.swipeHint} ${styles.swipeHintRight}`}>
                    <SwipeRightIcon />
                  </span>
                </div>
              )}
              
              {/* Scroll Hint - Bottom */}
              {builds.length > 1 && (
                <div className={styles.scrollHint}>
                  {isFetchingNextPage ? (
                    <span>Loading more...</span>
                  ) : (
                    <>
                      <ScrollHintIcon />
                      <span>Swipe</span>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className={styles.actionsRow}>
              <button 
                className={`${styles.actionBtn} ${getLikeData(currentBuild.id).liked ? styles.liked : ''}`} 
                onClick={() => toggleLike(currentBuild.id)}
                disabled={isLikeProcessing}
                aria-label={getLikeData(currentBuild.id).liked ? 'Unlike this build' : 'Like this build'}
                aria-pressed={getLikeData(currentBuild.id).liked}
              >
                <HeartIcon filled={getLikeData(currentBuild.id).liked} />
                <span>{formatNumber(getLikeData(currentBuild.id).count)}</span>
              </button>
              
              <button 
                className={styles.actionBtn} 
                onClick={openComments}
                aria-label={`View comments (${currentBuild.comment_count || 0})`}
              >
                <CommentIcon />
                <span>{formatNumber(currentBuild.comment_count || 0)}</span>
              </button>
              
              <button 
                className={`${styles.actionBtn} ${showCopied ? styles.copied : ''}`} 
                onClick={() => shareBuild(currentBuild)}
                aria-label="Share this build"
              >
                <ShareIcon />
                <span>{showCopied ? 'Copied!' : 'Share'}</span>
              </button>
            </div>
          </div>
          
          {/* Sheets render outside feedContent */}
          {showDetails && (
            <BuildDetailSheet
              build={currentBuild}
              images={buildImages}
              currentImageIndex={currentImageIndex}
              onImageSelect={(idx) => setCurrentImageIndex(idx)}
              onClose={() => setShowDetails(false)}
            />
          )}
          
          {showComments && (
            <CommentsSheet
              postId={currentBuild.id}
              postTitle={currentBuild.title}
              commentCount={currentBuild.comment_count || 0}
              onClose={() => setShowComments(false)}
              onCommentAdded={handleCommentAdded}
            />
          )}
        </>
      )}
    </div>
  );
}
