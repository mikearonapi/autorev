'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import BuildDetailSheet from './BuildDetailSheet';
import CommentsSheet from './CommentsSheet';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './page.module.css';

/**
 * Community Page - TikTok/Reels-style Full-Screen Feed
 * Immersive, content-first design with minimal UI
 * 
 * Features:
 * - Persistent likes via API (stored in database)
 * - AI-moderated comments
 * - Share functionality
 */

// Minimal Icons
const HeartIcon = ({ filled }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} 
    stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <polyline points="16 6 12 2 8 6"/>
    <line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);

const CommentIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);

const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const PLACEHOLDER_IMAGE = '/images/placeholder-car.jpg';

export default function CommunityPage() {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('builds');
  const [builds, setBuilds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likedItems, setLikedItems] = useState(new Map()); // Map of postId -> { liked, count }
  const [showDetails, setShowDetails] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [isLikeProcessing, setIsLikeProcessing] = useState(false);
  
  const containerRef = useRef(null);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const touchStartTime = useRef(0);
  const swipeDirection = useRef(null);
  
  // Fetch builds
  useEffect(() => {
    async function fetchBuilds() {
      if (activeTab !== 'builds') return;
      setIsLoading(true);
      try {
        const res = await fetch('/api/community/builds?limit=20');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setBuilds(data.builds || []);
      } catch (err) {
        setError('Unable to load builds');
      } finally {
        setIsLoading(false);
      }
    }
    fetchBuilds();
  }, [activeTab]);
  
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
  
  const currentBuild = builds[currentIndex];
  
  const buildImages = currentBuild?.images?.length > 0 
    ? currentBuild.images 
    : currentBuild?.car_image_url 
      ? [{ blob_url: currentBuild.car_image_url }]
      : [{ blob_url: PLACEHOLDER_IMAGE }];
  
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [currentIndex]);
  
  // Navigation
  const goToNext = useCallback(() => {
    if (currentIndex < builds.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowDetails(false);
      setShowComments(false);
    }
  }, [currentIndex, builds.length]);
  
  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowDetails(false);
      setShowComments(false);
    }
  }, [currentIndex]);
  
  const goToNextImage = useCallback(() => {
    if (currentImageIndex < buildImages.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
  }, [currentImageIndex, buildImages.length]);
  
  const goToPrevImage = useCallback(() => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  }, [currentImageIndex]);
  
  useEffect(() => {
    setCurrentIndex(0);
    setCurrentImageIndex(0);
    setShowDetails(false);
    setShowComments(false);
  }, [activeTab]);
  
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
  
  // Toggle Like - now uses API for persistence
  const toggleLike = useCallback(async (buildId) => {
    if (isLikeProcessing) return;
    
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
    
    // If user is not logged in, show the local state but warn on next interaction
    if (!user) {
      // Keep the optimistic update but it won't persist
      return;
    }
    
    setIsLikeProcessing(true);
    
    try {
      const res = await fetch(`/api/community/posts/${buildId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (res.ok) {
        const data = await res.json();
        // Update with actual server state
        setLikedItems(prev => new Map(prev).set(buildId, {
          liked: data.liked,
          count: data.likeCount,
        }));
      } else if (res.status === 401) {
        // User not logged in - revert optimistic update
        setLikedItems(prev => new Map(prev).set(buildId, currentState));
      }
    } catch (err) {
      // On error, keep the optimistic state for better UX
      console.error('[Community] Like error:', err);
    } finally {
      setIsLikeProcessing(false);
    }
  }, [user, likedItems, builds, isLikeProcessing]);
  
  // Share
  const shareBuild = useCallback(async (build) => {
    const url = `${window.location.origin}/community/builds/${build.slug}`;
    if (navigator.share) {
      try { await navigator.share({ title: build.title, url }); } catch (e) {}
    } else {
      await navigator.clipboard.writeText(url);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 1500);
    }
  }, []);
  
  // Open comments
  const openComments = useCallback(() => {
    setShowComments(true);
  }, []);
  
  // Handle comment added
  const handleCommentAdded = useCallback(() => {
    // Update the comment count in the builds array
    setBuilds(prev => prev.map(build => 
      build.id === currentBuild?.id 
        ? { ...build, comment_count: (build.comment_count || 0) + 1 }
        : build
    ));
  }, [currentBuild?.id]);
  
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

  // Events placeholder
  if (activeTab === 'events') {
    return (
      <div className={styles.container}>
        <div className={styles.tabBar}>
          <button className={`${styles.tab} ${activeTab === 'builds' ? styles.tabActive : ''}`} onClick={() => setActiveTab('builds')}>Builds</button>
          <button className={`${styles.tab} ${activeTab === 'events' ? styles.tabActive : ''}`} onClick={() => setActiveTab('events')}>Events</button>
        </div>
        <div className={styles.emptyState}>
          <p>Events coming soon</p>
          <Link href="/community/events" className={styles.primaryBtn}>Browse Events</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} ref={containerRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      
      {/* Tab Bar - Floating */}
      <div className={styles.tabBar}>
        <button className={`${styles.tab} ${activeTab === 'builds' ? styles.tabActive : ''}`} onClick={() => setActiveTab('builds')}>Builds</button>
        <button className={`${styles.tab} ${activeTab === 'events' ? styles.tabActive : ''}`} onClick={() => setActiveTab('events')}>Events</button>
      </div>
      
      {/* Loading */}
      {isLoading && (
        <div className={styles.centerState}>
          <LoadingSpinner 
            variant="branded" 
            text="Loading Community" 
            subtext="Fetching builds..."
            fullPage 
          />
        </div>
      )}
      
      {/* Error/Empty */}
      {!isLoading && (error || builds.length === 0) && (
        <div className={styles.emptyState}>
          <p>{error || 'No builds yet'}</p>
          <Link href="/garage" className={styles.primaryBtn}>Share Your Build</Link>
        </div>
      )}
      
      {/* Main Content */}
      {currentBuild && !isLoading && (
        <>
          {/* Full-screen Image */}
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
            
            {/* Gradient Overlays */}
            <div className={styles.gradientTop} />
            <div className={styles.gradientBottom} />
          </div>
          
          {/* Image Dots - Only if multiple */}
          {buildImages.length > 1 && (
            <div className={styles.dots}>
              {buildImages.map((_, idx) => (
                <span key={idx} className={`${styles.dot} ${idx === currentImageIndex ? styles.dotActive : ''}`} />
              ))}
            </div>
          )}
          
          {/* Right Side Actions - Heart, Comment, Share */}
          <div className={styles.actions}>
            {/* Like Button */}
            <button 
              className={`${styles.actionBtn} ${getLikeData(currentBuild.id).liked ? styles.liked : ''}`} 
              onClick={() => toggleLike(currentBuild.id)}
              disabled={isLikeProcessing}
            >
              <HeartIcon filled={getLikeData(currentBuild.id).liked} />
              <span>{formatNumber(getLikeData(currentBuild.id).count)}</span>
            </button>
            
            {/* Comment Button */}
            <button 
              className={styles.actionBtn} 
              onClick={openComments}
            >
              <CommentIcon />
              <span>{formatNumber(currentBuild.comment_count || 0)}</span>
            </button>
            
            {/* Share Button */}
            <button 
              className={`${styles.actionBtn} ${showCopied ? styles.copied : ''}`} 
              onClick={() => shareBuild(currentBuild)}
            >
              <ShareIcon />
              <span>{showCopied ? 'Copied!' : 'Share'}</span>
            </button>
          </div>
          
          {/* Bottom Build Card - Visual Performance Display */}
          <div className={styles.buildCard} onClick={() => setShowDetails(true)}>
            {/* User & Build Header */}
            <div className={styles.cardHeader}>
              <div className={styles.avatar}>
                {currentBuild.author?.avatar_url ? (
                  <Image src={currentBuild.author.avatar_url} alt="" width={40} height={40} />
                ) : (
                  <span>{currentBuild.author?.display_name?.charAt(0) || 'A'}</span>
                )}
              </div>
              <div className={styles.headerText}>
                <div className={styles.userLine}>
                  <span className={styles.username}>{currentBuild.author?.display_name || 'Anonymous'}</span>
                  {currentBuild.author?.tier === 'admin' && <span className={styles.badge}>Staff</span>}
                </div>
                <h2 className={styles.buildTitle}>{currentBuild.title}</h2>
                <span className={styles.carName}>{currentBuild.car_name}</span>
              </div>
              <ChevronIcon />
            </div>
            
            {/* Performance Stats Row - Clean minimal design */}
            {(currentBuild.build_data?.final_hp || currentBuild.car_specs?.hp) && (
              <div className={styles.statsRow}>
                {/* HP - Final HP from build, or stock HP from car */}
                <div className={styles.stat}>
                  <span className={styles.statValue}>
                    {currentBuild.build_data?.final_hp || currentBuild.car_specs?.hp || '—'}
                  </span>
                  <span className={styles.statLabel}>HP</span>
                </div>
                
                {/* Torque - from car specs */}
                {currentBuild.car_specs?.torque && (
                  <div className={styles.stat}>
                    <span className={styles.statValue}>
                      {currentBuild.car_specs.torque}
                    </span>
                    <span className={styles.statLabel}>LB-FT</span>
                  </div>
                )}
                
                {/* 0-60 Time - use build's modified value if available, else stock from car specs */}
                {(currentBuild.build_data?.final_zero_to_sixty || currentBuild.car_specs?.zero_to_sixty) && (
                  <div className={styles.stat}>
                    <span className={styles.statValue}>
                      {currentBuild.build_data?.final_zero_to_sixty || currentBuild.car_specs?.zero_to_sixty}
                      <span className={styles.statSuffix}>s</span>
                    </span>
                    <span className={styles.statLabel}>0-60</span>
                  </div>
                )}
                
                {/* Top Speed - from car specs */}
                {currentBuild.car_specs?.top_speed && (
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{currentBuild.car_specs.top_speed}</span>
                    <span className={styles.statLabel}>MPH</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Premium Build Detail Sheet */}
          {showDetails && (
            <BuildDetailSheet
              build={currentBuild}
              images={buildImages}
              currentImageIndex={currentImageIndex}
              onImageSelect={(idx) => {
                setCurrentImageIndex(idx);
              }}
              onClose={() => setShowDetails(false)}
            />
          )}
          
          {/* Comments Sheet */}
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
