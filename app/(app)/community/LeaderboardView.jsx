'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import Image from 'next/image';

import PointsExplainerModal from '@/app/(app)/dashboard/components/PointsExplainerModal';
import { TITLES } from '@/app/(app)/dashboard/components/UserGreeting';
import { useAuth } from '@/components/providers/AuthProvider';
import { ListSkeleton } from '@/components/ui/Skeleton';

import styles from './LeaderboardView.module.css';

// How often to auto-refresh when page is visible (5 minutes)
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

// Minimum time between refreshes (30 seconds) to prevent spam
const MIN_REFRESH_INTERVAL_MS = 30 * 1000;

/**
 * LeaderboardView - Points leaderboard with monthly/all-time toggle
 *
 * Shows top users by points earned. Users can toggle between
 * monthly (current month) and all-time leaderboards.
 */

// Medal emojis for top 3 ranks
const MEDALS = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

// Premium rank indicators for top 3 with medals
// Uses CSS classes to avoid hardcoded hex colors per SOURCE_OF_TRUTH.md
const RankBadge = ({ rank }) => {
  if (rank > 3) {
    return <span className={styles.rankNumber}>#{rank}</span>;
  }

  const rankClass =
    rank === 1 ? styles.rankGold : rank === 2 ? styles.rankSilver : styles.rankBronze;

  return (
    <div className={`${styles.rankBadge} ${rankClass}`} aria-label={`Rank ${rank}`}>
      <span className={styles.medal} role="img" aria-hidden="true">
        {MEDALS[rank]}
      </span>
    </div>
  );
};

// CrownIcon removed for cleaner UI

const FireIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const InfoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

const RefreshIcon = ({ isSpinning }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    style={{
      animation: isSpinning ? 'spin 1s linear infinite' : 'none',
    }}
  >
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 21h5v-5" />
  </svg>
);

const PERIOD_OPTIONS = [
  { value: 'monthly', label: 'This Month' },
  { value: 'all-time', label: 'All Time' },
];

const ITEMS_PER_PAGE = 20;

export default function LeaderboardView() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [periodLabel, setPeriodLabel] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Track last fetch time to prevent spam refreshes
  const lastFetchRef = useRef(0);
  const intervalRef = useRef(null);

  const fetchLeaderboard = useCallback(
    async (selectedPeriod, offset = 0, append = false, isBackgroundRefresh = false) => {
      // Prevent refresh if recently fetched (unless it's a forced fetch like period change)
      const now = Date.now();
      if (isBackgroundRefresh && now - lastFetchRef.current < MIN_REFRESH_INTERVAL_MS) {
        return;
      }

      try {
        if (append) {
          setIsLoadingMore(true);
        } else if (!isBackgroundRefresh) {
          // Only show loading state for initial loads, not background refreshes
          setIsLoading(true);
        }
        setError(null);

        // Add timestamp cache buster for fresh data
        // Use aggressive no-cache headers for iOS Safari compatibility
        const timestamp = Date.now();
        const res = await fetch(
          `/api/community/leaderboard?limit=${ITEMS_PER_PAGE}&offset=${offset}&period=${selectedPeriod}&_t=${timestamp}`,
          {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              Pragma: 'no-cache',
            },
          }
        );

        if (!res.ok) {
          throw new Error('Failed to fetch leaderboard');
        }

        const data = await res.json();
        lastFetchRef.current = Date.now();

        if (append) {
          setLeaderboard((prev) => [...prev, ...(data.leaderboard || [])]);
        } else {
          setLeaderboard(data.leaderboard || []);
        }

        setPeriodLabel(data.periodLabel || '');
        setCurrentUserRank(data.currentUserRank);
        setHasMore(data.hasMore || false);
        setTotal(data.total || 0);
      } catch (err) {
        console.error('[LeaderboardView] Error:', err);
        // Only show error for non-background refreshes
        if (!isBackgroundRefresh) {
          setError('Unable to load leaderboard');
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  // Initial fetch when period changes
  useEffect(() => {
    fetchLeaderboard(period);
  }, [period, fetchLeaderboard]);

  // Auto-refresh on visibility change and periodic interval
  useEffect(() => {
    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLeaderboard(period, 0, false, true);
      }
    };

    // Refresh when window gains focus
    const handleFocus = () => {
      fetchLeaderboard(period, 0, false, true);
    };

    // Set up periodic refresh when visible
    const setupInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchLeaderboard(period, 0, false, true);
        }
      }, REFRESH_INTERVAL_MS);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    setupInterval();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [period, fetchLeaderboard]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setLeaderboard([]); // Reset list on period change
    setIsDropdownOpen(false);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchLeaderboard(period, leaderboard.length, true);
    }
  };

  // Manual refresh handler - bypasses the minimum interval check
  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    // Force fresh fetch by resetting lastFetchRef
    lastFetchRef.current = 0;
    await fetchLeaderboard(period, 0, false, false);
    setIsRefreshing(false);
  };

  // Format points with commas
  const formatPoints = (points) => {
    return points.toLocaleString();
  };

  // Get first name only for privacy
  const getFirstName = (displayName) => {
    if (!displayName) return 'User';
    return displayName.split(' ')[0];
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <ListSkeleton count={10} hasAvatar={true} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          {period === 'monthly' ? 'Monthly' : 'All-Time'} Leaderboard
          {/* Info button - inline with title */}
          <button
            className={styles.infoButtonInline}
            onClick={() => setShowPointsModal(true)}
            aria-label="How to earn points"
          >
            <InfoIcon />
          </button>
          {/* Refresh button - inline with title */}
          <button
            className={styles.infoButtonInline}
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            aria-label="Refresh leaderboard"
          >
            <RefreshIcon isSpinning={isRefreshing} />
          </button>
        </h2>
        <div className={styles.headerControls}>
          <p className={styles.subtitle}>{periodLabel}</p>

          {/* Period Dropdown */}
          <div className={styles.dropdownContainer}>
            <button
              className={styles.dropdownTrigger}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="listbox"
            >
              {PERIOD_OPTIONS.find((opt) => opt.value === period)?.label}
              <ChevronDownIcon />
            </button>

            {isDropdownOpen && (
              <>
                <div className={styles.dropdownBackdrop} onClick={() => setIsDropdownOpen(false)} />
                <ul className={styles.dropdownMenu} role="listbox">
                  {PERIOD_OPTIONS.map((option) => (
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={period === option.value}
                      className={`${styles.dropdownItem} ${period === option.value ? styles.active : ''}`}
                      onClick={() => handlePeriodChange(option.value)}
                    >
                      {option.label}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Current User Rank (if not in top 20) */}
      {currentUserRank && currentUserRank.rank > 20 && (
        <div className={styles.currentUserBanner}>
          <span className={styles.yourRank}>Your Rank</span>
          <span className={styles.rankBadge}>#{currentUserRank.rank}</span>
          <span className={styles.yourPoints}>{formatPoints(currentUserRank.points)} pts</span>
        </div>
      )}

      {/* Leaderboard List */}
      {leaderboard.length === 0 ? (
        <div className={styles.emptyState}>
          <FireIcon />
          <p>No points earned yet this month</p>
          <span>Be the first to earn points!</span>
        </div>
      ) : (
        <div
          className={styles.list}
          role="list"
          aria-label={`${period === 'monthly' ? 'Monthly' : 'All-time'} leaderboard rankings`}
        >
          {leaderboard.map((entry, _index) => {
            const isCurrentUser = user?.id === entry.userId;
            const isTopThree = entry.rank <= 3;
            const firstName = getFirstName(entry.displayName);

            return (
              <div
                key={entry.userId}
                role="listitem"
                aria-label={`Rank ${entry.rank}: ${firstName}, ${formatPoints(entry.points)} points${isCurrentUser ? ' (You)' : ''}`}
                className={`${styles.entry} ${isCurrentUser ? styles.currentUser : ''} ${isTopThree ? styles.topThree : ''}`}
              >
                {/* Rank */}
                <div className={styles.rankContainer}>
                  {isTopThree ? (
                    <RankBadge rank={entry.rank} />
                  ) : (
                    <span className={styles.rank}>#{entry.rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className={styles.avatar}>
                  {entry.avatarUrl ? (
                    <Image
                      src={entry.avatarUrl}
                      alt={`Avatar for ${firstName}`}
                      width={36}
                      height={36}
                      className={styles.avatarImage}
                    />
                  ) : (
                    <span className={styles.avatarFallback} aria-hidden="true">
                      {entry.displayName?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>

                {/* User Info */}
                <div className={styles.userInfo}>
                  <div className={styles.nameRow}>
                    <span className={styles.displayName}>{firstName}</span>
                    {isCurrentUser && <span className={styles.youBadge}>You</span>}
                  </div>
                  {entry.selectedTitle && TITLES[entry.selectedTitle] && (
                    <span className={styles.titleBadge}>{TITLES[entry.selectedTitle].display}</span>
                  )}
                </div>

                {/* Points */}
                <div className={styles.pointsContainer}>
                  <span className={styles.points}>{formatPoints(entry.points)}</span>
                  <span className={styles.pointsLabel}>pts</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && leaderboard.length > 0 && (
        <div className={styles.loadMoreContainer}>
          <button className={styles.loadMoreBtn} onClick={handleLoadMore} disabled={isLoadingMore}>
            {isLoadingMore ? 'Loading...' : `Load More (${leaderboard.length} of ${total})`}
          </button>
        </div>
      )}

      {/* Points Explainer Modal */}
      <PointsExplainerModal isOpen={showPointsModal} onClose={() => setShowPointsModal(false)} />
    </div>
  );
}
