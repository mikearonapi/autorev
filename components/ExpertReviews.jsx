'use client';

import { useState, useMemo } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { useCarExpertReviews } from '@/hooks/useCarData';
import { getUpgradeSuggestions, formatTag } from '@/lib/expertFeedback';

import styles from './ExpertReviews.module.css';

// Category labels for sentiment display
const CATEGORY_LABELS = {
  sound: 'Sound',
  interior: 'Interior',
  track: 'Track',
  reliability: 'Reliability',
  value: 'Value',
  driverFun: 'Driver Fun',
  aftermarket: 'Aftermarket',
};

/**
 * ExpertReviews Component
 *
 * Displays AI-processed expert reviews from YouTube for a specific car.
 * Shows embedded videos, summaries, key quotes, and consensus indicators.
 * Uses React Query for data caching and deduplication.
 *
 * @param {Object} props
 * @param {string} props.carId - The car's ID
 * @param {Object} props.car - The car object (for slug and consensus data)
 */
export default function ExpertReviews({ carId: _carId, car }) {
  const [expandedVideo, setExpandedVideo] = useState(null);
  const [showAllVideos, setShowAllVideos] = useState(false);

  // Use React Query for expert reviews with caching
  const {
    data: reviewsData,
    isLoading,
    error,
    refetch,
  } = useCarExpertReviews(car?.slug, { limit: 10 });

  const videos = reviewsData?.videos || [];

  // Extract consensus data from car if available
  const consensus = car?.externalConsensus || car?.external_consensus;
  const reviewCount = car?.expertReviewCount || car?.expert_review_count || 0;
  const consensusSummary = car?.expertConsensusSummary || car?.expert_consensus_summary;

  // Calculate sentiment indicators comparing external sentiment to internal scores
  const sentimentIndicators = useMemo(() => {
    if (!consensus?.categoryMeans || !car) return [];

    const indicators = [];
    const categoryMap = {
      sound: 'sound',
      interior: 'interior',
      track: 'track',
      reliability: 'reliability',
      value: 'value',
      driver_fun: 'driverFun',
      aftermarket: 'aftermarket',
    };

    for (const [extKey, intKey] of Object.entries(categoryMap)) {
      const externalSentiment = consensus.categoryMeans?.[extKey];
      const internalScore = car[intKey];

      if (externalSentiment !== undefined && internalScore !== undefined) {
        // Normalize internal score (1-10) to sentiment scale (-1 to 1)
        const normalizedInternal = (internalScore - 5) / 5;
        const diff = externalSentiment - normalizedInternal;

        // Only show significant differences
        if (Math.abs(diff) > 0.15) {
          indicators.push({
            category: CATEGORY_LABELS[intKey] || intKey,
            direction: diff > 0 ? 'up' : 'down',
            magnitude: Math.abs(diff) > 0.4 ? 'strong' : 'mild',
          });
        }
      }
    }

    return indicators;
  }, [consensus, car]);

  // Get upgrade suggestions based on weakness tags
  const upgradeSuggestions = useMemo(() => {
    const weaknessTags = consensus?.weaknesses?.map((w) => w.tag || w) || [];
    return getUpgradeSuggestions(weaknessTags).slice(0, 4);
  }, [consensus]);

  // Don't render if no reviews and no consensus data (and no error)
  if (!isLoading && !error && videos.length === 0 && !consensus && reviewCount === 0) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <span>Loading expert reviews...</span>
        </div>
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <VerifiedIcon />
            <span className={styles.headerTitle}>Expert Reviews</span>
          </div>
        </div>
        <div className={styles.errorState}>
          <AlertIcon size={20} />
          <span>Unable to load expert reviews</span>
          <button className={styles.retryButton} onClick={() => refetch()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Build embed URL for YouTube
  const getEmbedUrl = (videoId, startTime = null) => {
    let url = `https://www.youtube.com/embed/${videoId}?rel=0`;
    if (startTime) url += `&start=${startTime}`;
    return url;
  };

  // Format duration from seconds
  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.container}>
      {/* Compact Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <VerifiedIcon />
          <span className={styles.headerTitle}>Expert Reviews</span>
          {reviewCount > 0 && (
            <span className={styles.reviewCount}>
              {reviewCount} trusted {reviewCount === 1 ? 'review' : 'reviews'}
            </span>
          )}
        </div>
        {sentimentIndicators.length > 0 && (
          <div className={styles.sentimentIndicators}>
            {sentimentIndicators.slice(0, 3).map((ind, i) => (
              <span
                key={i}
                className={`${styles.sentimentChip} ${styles[ind.direction]} ${styles[ind.magnitude]}`}
                title={`Experts ${ind.direction === 'up' ? 'more positive' : 'more critical'} about ${ind.category}`}
              >
                {ind.direction === 'up' ? <ArrowUpIcon size={10} /> : <ArrowDownIcon size={10} />}
                {ind.category}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Consensus Summary */}
      {consensusSummary && (
        <div className={styles.consensusSummary}>
          <QuoteIcon />
          <p>{consensusSummary}</p>
        </div>
      )}

      {/* Consensus Tags - Compact */}
      {consensus && (consensus.strengths?.length > 0 || consensus.weaknesses?.length > 0) && (
        <div className={styles.consensusTags}>
          {/* Strengths */}
          {consensus.strengths?.length > 0 && (
            <div className={styles.tagGroup}>
              <span className={styles.tagLabel}>Praised:</span>
              <div className={styles.tags}>
                {consensus.strengths.slice(0, 5).map((item, i) => (
                  <span key={i} className={`${styles.tag} ${styles.strength}`}>
                    <CheckIcon size={10} />
                    {item.tag || item}
                    {item.count > 1 && <span className={styles.tagCount}>×{item.count}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Weaknesses */}
          {consensus.weaknesses?.length > 0 && (
            <div className={styles.tagGroup}>
              <span className={styles.tagLabel}>Watch:</span>
              <div className={styles.tags}>
                {consensus.weaknesses.slice(0, 5).map((item, i) => (
                  <span key={i} className={`${styles.tag} ${styles.weakness}`}>
                    <AlertIcon size={10} />
                    {item.tag || item}
                    {item.count > 1 && <span className={styles.tagCount}>×{item.count}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upgrade Suggestions based on weaknesses */}
      {upgradeSuggestions.length > 0 && car?.slug && (
        <div className={styles.upgradeSuggestions}>
          <span className={styles.upgradeLabel}>
            <WrenchIcon size={12} />
            Common upgrades to address:
          </span>
          <div className={styles.upgradeTags}>
            {upgradeSuggestions.map((upgrade, i) => (
              <Link key={i} href={`/tuning-shop?car=${car.slug}`} className={styles.upgradeTag}>
                {formatTag(upgrade)}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Video Cards - Show 2 by default, expandable */}
      {videos.length > 0 && (
        <>
          <div className={styles.videoGrid}>
            {videos.slice(0, showAllVideos ? videos.length : 2).map((video) => {
              const isExpanded = expandedVideo === video.video_id;
              const videoData = video.youtube_videos || video;
              const proText = videoData.pros_mentioned?.[0];

              return (
                <div key={video.video_id} className={styles.videoCard}>
                  {/* Video Player / Thumbnail */}
                  <div className={styles.videoWrapper}>
                    {isExpanded ? (
                      <iframe
                        src={getEmbedUrl(video.video_id)}
                        title={videoData.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className={styles.videoIframe}
                      />
                    ) : (
                      <button
                        className={styles.thumbnailButton}
                        onClick={() => setExpandedVideo(video.video_id)}
                        aria-label={`Play ${videoData.title}`}
                      >
                        <Image
                          src={
                            videoData.thumbnail_url ||
                            `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`
                          }
                          alt={videoData.title}
                          fill
                          className={styles.thumbnail}
                          sizes="(max-width: 768px) 100vw, 320px"
                        />
                        <div className={styles.playOverlay}>
                          <div className={styles.playIconCircle}>
                            <PlayIcon size={24} />
                          </div>
                        </div>
                        {videoData.duration_seconds && (
                          <span className={styles.duration}>
                            {formatDuration(videoData.duration_seconds)}
                          </span>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Compact Video Info */}
                  <div className={styles.videoInfo}>
                    <div className={styles.videoMeta}>
                      <span className={styles.channelBadge}>{videoData.channel_name}</span>
                    </div>
                    <h3 className={styles.videoTitle}>{videoData.title}</h3>

                    {/* Insight Badge */}
                    {proText && !isExpanded && (
                      <div className={styles.insightBadge}>
                        <CheckIcon size={14} />
                        <span>{typeof proText === 'string' ? proText : proText.text}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className={styles.videoActions}>
                      <button
                        className={styles.playButton}
                        onClick={() => setExpandedVideo(video.video_id)}
                      >
                        <PlayIcon size={14} />
                        {isExpanded ? 'Playing...' : 'Watch Review'}
                      </button>
                      <a
                        href={`https://www.youtube.com/watch?v=${video.video_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.watchLink}
                        aria-label="Watch on YouTube"
                      >
                        <ExternalLinkIcon size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* View More Toggle */}
          {videos.length > 2 && (
            <div className={styles.viewMore}>
              <button
                className={styles.viewMoreButton}
                onClick={() => setShowAllVideos(!showAllVideos)}
              >
                {showAllVideos ? 'Show Less' : `View All ${videos.length} Reviews`}
                <ChevronIcon direction={showAllVideos ? 'up' : 'down'} size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {videos.length === 0 && !consensus && (
        <div className={styles.emptyState}>
          <p>Expert reviews coming soon for this vehicle.</p>
        </div>
      )}

      {/* Disclaimer */}
      <p className={styles.disclaimer}>
        Expert opinions sourced from trusted automotive reviewers. Not affiliated with AutoRev.
      </p>
    </div>
  );
}

// Simple SVG icons as components
function PlayIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function CheckIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function QuoteIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
      <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
    </svg>
  );
}

function ExternalLinkIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function VerifiedIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function ArrowUpIcon({ size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M18 15l-6-6-6 6" />
    </svg>
  );
}

function ArrowDownIcon({ size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ChevronIcon({ size = 16, direction = 'down' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ transform: direction === 'up' ? 'rotate(180deg)' : 'none' }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function WrenchIcon({ size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}
