'use client';

/**
 * VideoPlayer Component
 *
 * In-app video player for build videos.
 * Features:
 * - Modal overlay with video playback
 * - Play/pause, volume, fullscreen controls
 * - Progress bar with seek functionality
 * - Keyboard shortcuts (space, arrow keys, f, escape)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './VideoPlayer.module.css';

/**
 * Format seconds to mm:ss or hh:mm:ss
 */
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function VideoPlayer({ video, onClose, autoPlay = true }) {
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const containerRef = useRef(null);

  // Portal mounting - required for SSR compatibility
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const hideControlsTimer = useRef(null);

  // Auto-hide controls after 3 seconds of inactivity
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  // Handle video events
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handleLoadedMetadata = () => {
      setDuration(videoEl.duration);
      setIsLoading(false);
      if (autoPlay) {
        videoEl.play().catch(() => {
          // Autoplay blocked - user needs to interact
          setIsPlaying(false);
        });
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(videoEl.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => setError('Failed to load video');
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoEl.addEventListener('timeupdate', handleTimeUpdate);
    videoEl.addEventListener('play', handlePlay);
    videoEl.addEventListener('pause', handlePause);
    videoEl.addEventListener('ended', handleEnded);
    videoEl.addEventListener('error', handleError);
    videoEl.addEventListener('waiting', handleWaiting);
    videoEl.addEventListener('canplay', handleCanPlay);

    return () => {
      videoEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoEl.removeEventListener('timeupdate', handleTimeUpdate);
      videoEl.removeEventListener('play', handlePlay);
      videoEl.removeEventListener('pause', handlePause);
      videoEl.removeEventListener('ended', handleEnded);
      videoEl.removeEventListener('error', handleError);
      videoEl.removeEventListener('waiting', handleWaiting);
      videoEl.removeEventListener('canplay', handleCanPlay);
    };
  }, [autoPlay]);

  // Toggle play/pause - defined before keyboard shortcuts that use it
  const togglePlay = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (isPlaying) {
      videoEl.pause();
    } else {
      videoEl.play();
    }
    resetControlsTimer();
  }, [isPlaying, resetControlsTimer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const videoEl = videoRef.current;
      if (!videoEl) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          videoEl.currentTime = Math.max(0, videoEl.currentTime - 10);
          resetControlsTimer();
          break;
        case 'ArrowRight':
          e.preventDefault();
          videoEl.currentTime = Math.min(duration, videoEl.currentTime + 10);
          resetControlsTimer();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume((v) => Math.min(1, v + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume((v) => Math.max(0, v - 0.1));
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          setIsMuted((m) => !m);
          break;
        case 'Escape':
          if (isFullscreen) {
            document.exitFullscreen();
          } else {
            onClose?.();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [duration, isFullscreen, onClose, resetControlsTimer, togglePlay]);

  // Sync volume with video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    };
  }, []);

  const handleProgressClick = (e) => {
    const videoEl = videoRef.current;
    const progressEl = progressRef.current;
    if (!videoEl || !progressEl) return;

    const rect = progressEl.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    videoEl.currentTime = percent * duration;
    resetControlsTimer();
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!video || !isMounted) return null;

  const playerContent = (
    <div className={styles.overlay} onClick={onClose} data-overlay-modal>
      <div
        ref={containerRef}
        className={`${styles.playerContainer} ${showControls ? '' : styles.hideControls}`}
        onClick={(e) => e.stopPropagation()}
        onMouseMove={resetControlsTimer}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        {/* Close button */}
        <button className={styles.closeBtn} onClick={onClose}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Video element */}
        <video
          ref={videoRef}
          className={styles.video}
          src={video.blob_url}
          poster={video.video_thumbnail_url}
          playsInline
          onClick={togglePlay}
        />

        {/* Loading spinner */}
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner} />
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className={styles.errorOverlay}>
            <span>{error}</span>
          </div>
        )}

        {/* Big play button (shown when paused) */}
        {!isPlaying && !isLoading && (
          <button className={styles.bigPlayBtn} onClick={togglePlay}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="white">
              <polygon points="8 5 19 12 8 19 8 5" />
            </svg>
          </button>
        )}

        {/* Controls bar */}
        <div className={styles.controls}>
          {/* Progress bar */}
          <div ref={progressRef} className={styles.progressBar} onClick={handleProgressClick}>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className={styles.controlsRow}>
            {/* Play/Pause */}
            <button className={styles.controlBtn} onClick={togglePlay}>
              {isPlaying ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="8 5 19 12 8 19 8 5" />
                </svg>
              )}
            </button>

            {/* Time display */}
            <span className={styles.time}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Spacer */}
            <div className={styles.spacer} />

            {/* Volume */}
            <button className={styles.controlBtn} onClick={() => setIsMuted((m) => !m)}>
              {isMuted || volume === 0 ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : volume < 0.5 ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>

            {/* Volume slider */}
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(false);
              }}
              className={styles.volumeSlider}
            />

            {/* Fullscreen */}
            <button className={styles.controlBtn} onClick={toggleFullscreen}>
              {isFullscreen ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Caption */}
        {video.caption && <div className={styles.caption}>{video.caption}</div>}
      </div>
    </div>
  );

  // Use portal to render at document body level
  return createPortal(playerContent, document.body);
}
