'use client';

/**
 * DIYVideoEmbed Component
 * 
 * Lazy-loading YouTube video embed that shows thumbnail first.
 * Clicking the thumbnail loads the YouTube iframe (saves bandwidth/load time).
 * Used in installation guidance to show DIY tutorial videos.
 */

import React, { useState } from 'react';
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
 * Enhanced with better empty/error states and YouTube search fallback
 */
export function DIYVideoList({ videos = [], carName, category, isLoading, error }) {
  // Build YouTube search URL for manual fallback
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${carName} ${category} install tutorial DIY how to`)}`;
  
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
  
  if (error) {
    return (
      <div className={styles.listContainer}>
        <div className={styles.error}>
          <Icons.alertTriangle size={24} />
          <span className={styles.errorTitle}>Unable to load videos</span>
          <p className={styles.errorSubtext}>
            Our video search is temporarily unavailable. You can search YouTube directly for tutorials.
          </p>
          <a 
            href={youtubeSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.searchYouTubePrimary}
          >
            <YouTubeIcon size={16} />
            Search on YouTube
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
          <span className={styles.emptyTitle}>No curated tutorials found</span>
          <p className={styles.emptySubtext}>
            We couldn&apos;t find specific tutorials for this part. Try searching YouTube directly for DIY install guides.
          </p>
          <a 
            href={youtubeSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.searchYouTubePrimary}
          >
            <YouTubeIcon size={16} />
            Search "{carName} {category} install" on YouTube
            <Icons.externalLink size={12} />
          </a>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.listContainer}>
      <div className={styles.videoGrid}>
        {videos.map((video) => (
          <DIYVideoEmbed
            key={video.video_id || video.videoId}
            videoId={video.video_id || video.videoId}
            title={video.title}
            channelName={video.channel_name || video.channelName}
            thumbnailUrl={video.thumbnail_url || video.thumbnailUrl}
            durationSeconds={video.duration_seconds || video.durationSeconds}
            variant="card"
          />
        ))}
      </div>
      
      {/* Always show "Search for more" link when we have some videos */}
      <div className={styles.moreVideosLink}>
        <a 
          href={youtubeSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.searchYouTube}
        >
          <YouTubeIcon size={14} />
          Find more tutorials on YouTube
          <Icons.externalLink size={12} />
        </a>
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
