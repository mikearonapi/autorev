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

// Medal icons for top 3 with distinct designs
const MedalIcon = ({ place }) => {
  const config = {
    1: { 
      primary: '#FFD700', 
      secondary: '#FFA500', 
      ribbon: '#DC2626',
      shine: '#FFFACD'
    },
    2: { 
      primary: '#C0C0C0', 
      secondary: '#A8A8A8', 
      ribbon: '#3B82F6',
      shine: '#E8E8E8'
    },
    3: { 
      primary: '#CD7F32', 
      secondary: '#8B4513', 
      ribbon: '#059669',
      shine: '#DEB887'
    },
  };
  
  const c = config[place];
  
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      {/* Ribbon */}
      <path 
        d="M8 2L10 8H14L16 2" 
        fill={c.ribbon}
        opacity="0.9"
      />
      <path 
        d="M9 2L10.5 6H13.5L15 2" 
        fill={c.ribbon}
        opacity="0.7"
      />
      {/* Medal circle with gradient effect */}
      <circle cx="12" cy="14" r="8" fill={c.secondary} />
      <circle cx="12" cy="14" r="7" fill={c.primary} />
      <circle cx="12" cy="14" r="5.5" fill={c.secondary} opacity="0.3" />
      {/* Inner detail */}
      <circle cx="12" cy="14" r="4" fill="none" stroke={c.secondary} strokeWidth="0.75" />
      {/* Place number */}
      <text 
        x="12" 
        y="17" 
        textAnchor="middle" 
        fontSize="7" 
        fontWeight="bold" 
        fill={c.secondary}
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {place}
      </text>
      {/* Shine highlight */}
      <ellipse cx="9.5" cy="11.5" rx="2" ry="1.5" fill={c.shine} opacity="0.4" />
    </svg>
  );
};

const CrownIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="1.5">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/>
    <path d="M2 16h20"/>
    <path d="M4 20h16"/>
  </svg>
);

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
        {/* Info button - top left */}
        <button 
          className={styles.infoButtonCircle}
          onClick={() => setShowPointsModal(true)}
          aria-label="How to earn points"
        >
          <InfoIcon />
        </button>

        <h2 className={styles.title}>
          <CrownIcon />
          {period === 'monthly' ? 'Monthly' : 'All-Time'} Leaderboard
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
                    <MedalIcon place={entry.rank} />
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
                  {entry.rank === 1 && (
                    <div className={styles.crownBadge}>
                      <CrownIcon size={14} />
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className={styles.userInfo}>
                  <div className={styles.nameRow}>
                    <span className={styles.displayName}>{entry.displayName}</span>
                    {isCurrentUser && <span className={styles.youBadge}>You</span>}
                  </div>
                  {entry.selectedTitle && TITLES[entry.selectedTitle] && (
                    <span 
                      className={styles.titleBadge}
                      style={{ 
                        color: TITLES[entry.selectedTitle].color,
                        background: `${TITLES[entry.selectedTitle].color}15`,
                      }}
                    >
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
