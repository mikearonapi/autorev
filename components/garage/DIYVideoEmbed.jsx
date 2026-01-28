'use client';

/**
 * DIYVideoEmbed Component
 * 
 * Lazy-loading YouTube video embed that shows thumbnail first.
 * Clicking the thumbnail loads the YouTube iframe (saves bandwidth/load time).
 * Used in installation guidance to show DIY tutorial videos.
 * 
 * When no curated videos exist, the "Search YouTube" button triggers
 * a live search via Exa API and embeds the results directly in-app.
 */

import React, { useState, useCallback } from 'react';

import Image from 'next/image';

import { Icons } from '@/components/ui/Icons';

import styles from './DIYVideoEmbed.module.css';

/**
 * DIYVideoEmbed - Lazy-loading YouTube embed
 * 
 * @param {string} videoId - YouTube video ID
 * @param {string} title - Video title
 * @param {string} channelName - Channel name (optional)
 * @param {string} thumbnailUrl - Custom thumbnail URL (optional, falls back to YouTube default)
 * @param {number} durationSeconds - Video duration in seconds (optional)
 * @param {string} variant - 'card' | 'inline' - Display style
 * @param {function} onPlay - Callback when video starts playing
 */
export default function DIYVideoEmbed({
  videoId,
  title,
  channelName,
  thumbnailUrl,
  durationSeconds,
  variant = 'card',
  onPlay,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Generate thumbnail URL (YouTube provides various sizes)
  const thumbnail = thumbnailUrl || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  
  // Generate embed URL
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  
  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handlePlay = () => {
    setIsPlaying(true);
    onPlay?.();
  };
  
  return (
    <div className={`${styles.container} ${styles[variant]}`}>
      {/* Video Player / Thumbnail */}
      <div className={styles.videoWrapper}>
        {isPlaying ? (
          <iframe
            src={embedUrl}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className={styles.iframe}
          />
        ) : (
          <button 
            className={styles.thumbnailButton}
            onClick={handlePlay}
            aria-label={`Play ${title}`}
          >
            <Image 
              src={thumbnail}
              alt={title}
              fill
              className={styles.thumbnail}
              sizes="(max-width: 768px) 100vw, 400px"
            />
            <div className={styles.playOverlay}>
              <div className={styles.playIcon}>
                <PlayIcon size={32} />
              </div>
            </div>
            {durationSeconds && (
              <span className={styles.duration}>
                {formatDuration(durationSeconds)}
              </span>
            )}
          </button>
        )}
      </div>
      
      {/* Video Info (card variant only) */}
      {variant === 'card' && (
        <div className={styles.info}>
          {channelName && (
            <span className={styles.channel}>{channelName}</span>
          )}
          <h4 className={styles.title}>{title}</h4>
          <div className={styles.actions}>
            {!isPlaying && (
              <button className={styles.playButton} onClick={handlePlay}>
                <PlayIcon size={14} />
                Watch Tutorial
              </button>
            )}
            <a 
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.youtubeLink}
              aria-label="Watch on YouTube"
            >
              <Icons.externalLink size={14} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * DIYVideoList - Multiple videos in a grid/list
 * 
 * When no curated videos exist, clicking "Search YouTube" triggers a live
 * search via our Exa-powered API and displays embedded results in-app.
 * Users never have to leave AutoRev to watch install tutorials.
 */
export function DIYVideoList({ videos: initialVideos = [], carName, category, isLoading: parentLoading, error: parentError }) {
  // Local state for triggered search
  const [searchedVideos, setSearchedVideos] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showYouTubeFallback, setShowYouTubeFallback] = useState(false);
  
  // Combine initial videos with searched videos
  const videos = searchedVideos.length > 0 ? searchedVideos : initialVideos;
  const isLoading = parentLoading || isSearching;
  const error = searchError || parentError;
  
  // Build YouTube search URL for fallback
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${carName} ${category} install DIY`)}`;
  
  /**
   * Trigger a live YouTube search via Exa API
   */
  const handleSearchYouTube = useCallback(async () => {
    if (isSearching) return;
    
    setIsSearching(true);
    setSearchError(null);
    setShowYouTubeFallback(false);
    
    try {
      const response = await fetch('/api/diy-videos/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carName,
          category,
          limit: 5,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data = await response.json();
      const results = data.videos || [];
      
      // Check for API errors that require fallback
      if (data.errorCode) {
        console.warn('[DIYVideoList] API error:', data.errorCode, data.warning);
        setShowYouTubeFallback(true);
      }
      
      // Normalize the video format
      const normalizedVideos = results.map(v => ({
        videoId: v.videoId || v.video_id,
        title: v.title,
        channelName: v.channelName || v.channel_name,
        thumbnailUrl: v.thumbnailUrl || v.thumbnail_url || `https://img.youtube.com/vi/${v.videoId || v.video_id}/mqdefault.jpg`,
        durationSeconds: v.durationSeconds || v.duration_seconds,
      }));
      
      setSearchedVideos(normalizedVideos);
      setHasSearched(true);
      
      // If no videos, show YouTube fallback
      if (normalizedVideos.length === 0) {
        setShowYouTubeFallback(true);
        if (data.warning) {
          setSearchError(data.warning);
        }
      }
    } catch (err) {
      console.error('[DIYVideoList] Search error:', err);
      setSearchError(err.message || 'Failed to search for videos');
      setShowYouTubeFallback(true);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }, [carName, category, isSearching]);
  
  if (isLoading) {
    return (
      <div className={styles.listContainer}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Finding {category} tutorials for {carName}...</span>
        </div>
      </div>
    );
  }
  
  if (error && hasSearched && videos.length === 0) {
    // Show error with YouTube fallback
    return (
      <div className={styles.listContainer}>
        <div className={styles.error}>
          <Icons.alertTriangle size={24} />
          <span className={styles.errorTitle}>Search unavailable</span>
          <p className={styles.errorSubtext}>
            {error}
          </p>
          <a 
            href={youtubeSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.searchYouTubePrimary}
          >
            <YouTubeIcon size={16} />
            Open YouTube Search
            <Icons.externalLink size={12} />
          </a>
        </div>
      </div>
    );
  }
  
  if (videos.length === 0) {
    return (
      <div className={styles.listContainer}>
        <div className={styles.empty}>
          <Icons.video size={32} />
          <span className={styles.emptyTitle}>
            {hasSearched ? 'No tutorials found' : 'No curated tutorials found'}
          </span>
          <p className={styles.emptySubtext}>
            {error 
              ? error
              : hasSearched 
                ? 'We couldn\'t find install videos for this specific part and car combination.'
                : 'Click below to search YouTube for DIY install guides.'}
          </p>
          
          {/* Show search button if haven't searched yet */}
          {!hasSearched && (
            <button 
              onClick={handleSearchYouTube}
              className={styles.searchYouTubePrimary}
              disabled={isSearching}
            >
              <Icons.search size={16} />
              Find Install Videos
            </button>
          )}
          
          {/* Show YouTube fallback link when API fails or no results */}
          {showYouTubeFallback && (
            <a 
              href={youtubeSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.searchYouTubePrimary}
            >
              <YouTubeIcon size={16} />
              Open YouTube Search
              <Icons.externalLink size={12} />
            </a>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.listContainer}>
      <div className={styles.videoGrid}>
        {videos.map((video) => (
          <DIYVideoEmbed
            key={video.videoId || video.video_id}
            videoId={video.videoId || video.video_id}
            title={video.title}
            channelName={video.channelName || video.channel_name}
            thumbnailUrl={video.thumbnailUrl || video.thumbnail_url}
            durationSeconds={video.durationSeconds || video.duration_seconds}
            variant="card"
          />
        ))}
      </div>
      
      {/* Show "Search for more" button to refresh/find additional videos */}
      <div className={styles.moreVideosLink}>
        <button 
          onClick={handleSearchYouTube}
          className={styles.searchYouTube}
          disabled={isSearching}
        >
          <Icons.refresh size={14} />
          {isSearching ? 'Searching...' : 'Find More Tutorials'}
        </button>
      </div>
    </div>
  );
}

// YouTube icon component
function YouTubeIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

// Simple play icon
function PlayIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
