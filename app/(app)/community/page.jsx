'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import BuildDetailSheet from './BuildDetailSheet';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './page.module.css';

/**
 * Community Page - TikTok/Reels-style Full-Screen Feed
 * Immersive, content-first design with minimal UI
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

const SpinnerIcon = () => (
  <svg className={styles.spinner} width="32" height="32" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2"/>
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
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
  const [likedItems, setLikedItems] = useState(new Set());
  const [showDetails, setShowDetails] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  
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
    }
  }, [currentIndex, builds.length]);
  
  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowDetails(false);
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
  }, [activeTab]);
  
  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); goToNext(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); goToPrev(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goToNextImage(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goToPrevImage(); }
      else if (e.key === 'Escape') { setShowDetails(false); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, goToNextImage, goToPrevImage]);
  
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
    } else if (swipeDirection.current === 'vertical' && !showDetails && (Math.abs(deltaY) > 50 || Math.abs(deltaY) / deltaTime > 0.5)) {
      if (deltaY > 0) goToNext();
      else goToPrev();
    }
  }, [goToNext, goToPrev, goToNextImage, goToPrevImage, showDetails]);
  
  // Mouse wheel
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let isScrolling = false;
    const handleWheel = (e) => {
      if (showDetails) return;
      e.preventDefault();
      if (isScrolling) return;
      isScrolling = true;
      if (e.deltaY > 20) goToNext();
      else if (e.deltaY < -20) goToPrev();
      setTimeout(() => { isScrolling = false; }, 400);
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [goToNext, goToPrev, showDetails]);
  
  // Like
  const toggleLike = useCallback((buildId) => {
    setLikedItems(prev => {
      const next = new Set(prev);
      if (next.has(buildId)) next.delete(buildId);
      else next.add(buildId);
      localStorage.setItem('likedBuilds', JSON.stringify([...next]));
      return next;
    });
  }, []);
  
  useEffect(() => {
    try {
      const liked = JSON.parse(localStorage.getItem('likedBuilds') || '[]');
      setLikedItems(new Set(liked));
    } catch (e) {}
  }, []);
  
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
  
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
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
          
          {/* Right Side Actions */}
          <div className={styles.actions}>
            <button className={`${styles.actionBtn} ${likedItems.has(currentBuild.id) ? styles.liked : ''}`} onClick={() => toggleLike(currentBuild.id)}>
              <HeartIcon filled={likedItems.has(currentBuild.id)} />
              <span>{formatNumber((currentBuild.like_count || 0) + (likedItems.has(currentBuild.id) ? 1 : 0))}</span>
            </button>
            <button className={styles.actionBtn} onClick={() => setShowDetails(true)}>
              <CommentIcon />
              <span>Details</span>
            </button>
            <button className={`${styles.actionBtn} ${showCopied ? styles.copied : ''}`} onClick={() => shareBuild(currentBuild)}>
              <ShareIcon />
              <span>{showCopied ? 'Copied!' : 'Share'}</span>
            </button>
          </div>
          
          {/* Bottom Info - Minimal */}
          <div className={styles.info} onClick={() => setShowDetails(true)}>
            <div className={styles.userRow}>
              <div className={styles.avatar}>
                {currentBuild.author?.avatar_url ? (
                  <Image src={currentBuild.author.avatar_url} alt="" width={32} height={32} />
                ) : (
                  <span>{currentBuild.author?.display_name?.charAt(0) || 'A'}</span>
                )}
              </div>
              <span className={styles.username}>{currentBuild.author?.display_name || 'Anonymous'}</span>
              {currentBuild.author?.tier === 'admin' && <span className={styles.badge}>Staff</span>}
            </div>
            <h2 className={styles.title}>{currentBuild.title}</h2>
            <div className={styles.meta}>
              <span className={styles.carName}>{currentBuild.car_name}</span>
              {currentBuild.build_data?.hp_gain > 0 && (
                <span className={styles.stat}>+{currentBuild.build_data.hp_gain} HP</span>
              )}
              {currentBuild.build_data?.mod_count > 0 && (
                <span className={styles.stat}>{currentBuild.build_data.mod_count} mods</span>
              )}
            </div>
            <div className={styles.seeMore}>
              <span>See build details</span>
              <ChevronIcon />
            </div>
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
        </>
      )}
    </div>
  );
}
