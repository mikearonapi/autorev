'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '@/components/providers/AuthProvider';
import LoadingSpinner from '@/components/LoadingSpinner';
import { TITLES } from '@/app/(app)/dashboard/components/UserGreeting';
import PointsExplainerModal from '@/app/(app)/dashboard/components/PointsExplainerModal';
import styles from './LeaderboardView.module.css';

/**
 * LeaderboardView - Points leaderboard with monthly/all-time toggle
 * 
 * Shows top users by points earned. Users can toggle between
 * monthly (current month) and all-time leaderboards.
 */

// Simple, premium rank indicators for top 3
const RankBadge = ({ rank }) => {
  const styles = {
    1: { color: '#FFD700', border: '1px solid #FFD700' }, // Gold
    2: { color: '#C0C0C0', border: '1px solid #C0C0C0' }, // Silver
    3: { color: '#CD7F32', border: '1px solid #CD7F32' }, // Bronze
  };

  const style = styles[rank];

  if (!style) {
    return <span className="text-gray-400 font-mono text-sm">#{rank}</span>;
  }

  return (
    <div 
      style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
        fontFamily: 'var(--font-mono)',
        ...style
      }}
    >
      {rank}
    </div>
  );
};

// CrownIcon removed for cleaner UI

const FireIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6"/>
  </svg>
);

const InfoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 16v-4"/>
    <path d="M12 8h.01"/>
  </svg>
);

const PERIOD_OPTIONS = [
  { value: 'monthly', label: 'This Month' },
  { value: 'all-time', label: 'All Time' },
];

export default function LeaderboardView() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [periodLabel, setPeriodLabel] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);

  const fetchLeaderboard = useCallback(async (selectedPeriod) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/community/leaderboard?limit=20&period=${selectedPeriod}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
      setPeriodLabel(data.periodLabel || '');
      setCurrentUserRank(data.currentUserRank);
    } catch (err) {
      console.error('[LeaderboardView] Error:', err);
      setError('Unable to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard(period);
  }, [period, fetchLeaderboard]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setIsDropdownOpen(false);
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
        <LoadingSpinner 
          variant="branded" 
          text="Loading Leaderboard" 
          subtext="Fetching top performers..."
        />
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
              {PERIOD_OPTIONS.find(opt => opt.value === period)?.label}
              <ChevronDownIcon />
            </button>
            
            {isDropdownOpen && (
              <>
                <div 
                  className={styles.dropdownBackdrop} 
                  onClick={() => setIsDropdownOpen(false)}
                />
                <ul className={styles.dropdownMenu} role="listbox">
                  {PERIOD_OPTIONS.map(option => (
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
        <div className={styles.list}>
          {leaderboard.map((entry, index) => {
            const isCurrentUser = user?.id === entry.userId;
            const isTopThree = entry.rank <= 3;
            
            return (
              <div 
                key={entry.userId}
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
                      alt={entry.displayName} 
                      width={36} 
                      height={36}
                      className={styles.avatarImage}
                    />
                  ) : (
                    <span className={styles.avatarFallback}>
                      {entry.displayName?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>

                {/* User Info */}
                <div className={styles.userInfo}>
                  <div className={styles.nameRow}>
                    <span className={styles.displayName}>{getFirstName(entry.displayName)}</span>
                    {isCurrentUser && <span className={styles.youBadge}>You</span>}
                  </div>
                  {entry.selectedTitle && TITLES[entry.selectedTitle] && (
                    <span className={styles.titleBadge}>
                      {TITLES[entry.selectedTitle].display}
                    </span>
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

      {/* Points Explainer Modal */}
      <PointsExplainerModal 
        isOpen={showPointsModal} 
        onClose={() => setShowPointsModal(false)} 
      />
    </div>
  );
}
