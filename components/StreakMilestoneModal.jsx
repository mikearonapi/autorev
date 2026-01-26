'use client';

import { useState, useEffect } from 'react';

import { createPortal } from 'react-dom';

import { getStreakDisplayInfo, STREAK_MILESTONES } from '@/lib/engagementService';

import styles from './StreakMilestoneModal.module.css';

/**
 * StreakMilestoneModal Component
 *
 * Celebration modal shown when user reaches a streak milestone.
 */
export default function StreakMilestoneModal({ isOpen, onClose, milestone, currentStreak }) {
  // Portal mounting - required for SSR compatibility
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen || !isMounted) return null;

  const _displayInfo = getStreakDisplayInfo(currentStreak);
  const milestoneInfo = getMilestoneInfo(milestone);

  const modalContent = (
    <div className={styles.overlay} onClick={onClose} data-overlay-modal>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="milestone-title"
      >
        <div className={styles.confetti}>
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={styles.confettiPiece}
              style={{
                '--delay': `${Math.random() * 0.5}s`,
                '--rotation': `${Math.random() * 360}deg`,
                '--left': `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <div className={styles.iconContainer}>
          <span className={styles.icon}>{milestoneInfo.icon}</span>
          <div className={styles.streakCount}>{currentStreak}</div>
        </div>

        <h2 id="milestone-title" className={styles.title}>
          {milestoneInfo.title}
        </h2>

        <p className={styles.subtitle}>{milestoneInfo.message}</p>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statIcon}>🔥</span>
            <span className={styles.statValue}>{currentStreak}</span>
            <span className={styles.statLabel}>Day Streak</span>
          </div>
          {getNextMilestone(milestone) && (
            <div className={styles.stat}>
              <span className={styles.statIcon}>🎯</span>
              <span className={styles.statValue}>{getNextMilestone(milestone)}</span>
              <span className={styles.statLabel}>Next Goal</span>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.shareButton} onClick={() => handleShare(currentStreak)}>
            Share Achievement
          </button>
          <button className={styles.closeButton} onClick={onClose}>
            Keep Going!
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render at document body level
  return createPortal(modalContent, document.body);
}

// =============================================================================
// HELPERS
// =============================================================================

function getMilestoneInfo(milestone) {
  switch (milestone) {
    case 7:
      return {
        icon: '🎉',
        title: 'First Week Complete!',
        message: "You've built a solid habit. Keep the momentum going!",
      };
    case 14:
      return {
        icon: '🌟',
        title: 'Two Week Streak!',
        message: "Consistency is key, and you've got it!",
      };
    case 30:
      return {
        icon: '🏆',
        title: 'One Month Strong!',
        message: "A full month of dedication. You're officially committed!",
      };
    case 50:
      return {
        icon: '💪',
        title: '50 Day Legend!',
        message: "Half way to triple digits. You're unstoppable!",
      };
    case 100:
      return {
        icon: '🔥',
        title: 'Triple Digit Streak!',
        message: "100 days of commitment. You're in the elite club now!",
      };
    case 365:
      return {
        icon: '👑',
        title: 'Full Year Streak!',
        message: 'An entire year of dedication. You are a true legend!',
      };
    default:
      return {
        icon: '🎊',
        title: `${milestone} Day Milestone!`,
        message: 'Keep up the amazing work!',
      };
  }
}

function getNextMilestone(current) {
  const index = STREAK_MILESTONES.indexOf(current);
  if (index === -1 || index === STREAK_MILESTONES.length - 1) {
    return null;
  }
  return STREAK_MILESTONES[index + 1];
}

function handleShare(streak) {
  const text = `I just hit a ${streak} day streak on AutoRev! 🔥🚗`;
  const url = 'https://autorev.app';

  if (navigator.share) {
    navigator
      .share({
        title: 'My AutoRev Streak',
        text,
        url,
      })
      .catch(() => {});
  } else {
    // Fallback to copying to clipboard
    navigator.clipboard
      .writeText(`${text} ${url}`)
      .then(() => {
        alert('Copied to clipboard!');
      })
      .catch(() => {});
  }
}
