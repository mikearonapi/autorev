'use client';

/**
 * PointsExplainerModal
 * 
 * Modal that explains how users can earn points across the app.
 * Triggered by the info button near the activity rings.
 * 
 * Features:
 * - Clickable "Refer a friend" row that copies referral link instantly
 * - Categories organized by point value (highest to lowest)
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon, GarageIcon, DataIcon, CommunityIcon, MessageIcon, FlameIcon } from './DashboardIcons';
import { useReferralData } from '@/hooks/useUserData';
import { platform } from '@/lib/platform';
import styles from './PointsExplainerModal.module.css';

// Points configuration - matches lib/pointsService.js
// 5-tier system: Growth (250) > Community (100) > Real Data (50) > Engagement (10) > Participation (5)
const POINTS_BY_CATEGORY = {
  growth: {
    label: 'Growth',
    icon: ({ size }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    color: '#f59e0b',
    actions: [
      { label: 'Refer a friend', points: 250 },
    ],
  },
  community: {
    label: 'Community',
    icon: CommunityIcon,
    color: '#3b82f6',
    actions: [
      { label: 'Share your build', points: 100 },
      { label: 'Post a comment', points: 10 },
      { label: 'Like a build', points: 5 },
    ],
  },
  data: {
    label: 'Data',
    icon: DataIcon,
    color: '#10b981',
    actions: [
      { label: 'Log dyno data', points: 50 },
      { label: 'Log track time', points: 50 },
    ],
  },
  garage: {
    label: 'Garage',
    icon: GarageIcon,
    color: '#d4ff00',
    actions: [
      { label: 'Install an upgrade', points: 50 },
      { label: 'Add a vehicle', points: 10 },
      { label: 'Plan an upgrade', points: 10 },
      { label: 'Upload a photo', points: 5 },
    ],
  },
  al: {
    label: 'AL',
    icon: MessageIcon,
    color: '#a855f7',
    actions: [
      { label: 'Ask AL a question', points: 10 },
      { label: 'Answer a profile question', points: 5 },
    ],
  },
};

// Streak bonuses
const STREAK_BONUSES = [
  { weeks: 2, points: 10 },
  { weeks: 4, points: 50 },
  { weeks: 6, points: 200 },
  { weeks: 8, points: 500 },
  { weeks: 12, points: 1000 },
];

// Copy icon for the referral action
const CopyIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

// Check icon for copy success
const CheckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function PointsExplainerModal({ isOpen, onClose }) {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);
  const [referralCopied, setReferralCopied] = useState(false);
  
  // Fetch referral data for the copy link feature
  const { data: referralData } = useReferralData({ enabled: isOpen });

  // Handle escape key and focus trap
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    // Focus the modal
    setTimeout(() => {
      modalRef.current?.focus();
    }, 0);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    };
  }, [isOpen, onClose]);
  
  // Reset copied state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setReferralCopied(false);
    }
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // Handle referral link copy
  const handleReferralCopy = async () => {
    if (!referralData?.referral_link) return;
    
    const success = await platform.copyToClipboard(referralData.referral_link);
    if (success) {
      setReferralCopied(true);
      // Reset after 4 seconds
      setTimeout(() => setReferralCopied(false), 4000);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className={styles.backdrop} 
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="points-modal-title"
    >
      <div 
        className={styles.modal}
        ref={modalRef}
        tabIndex={-1}
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 id="points-modal-title" className={styles.title}>
            How to Earn Points
          </h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          <p className={styles.intro}>
            Earn points by using AutoRev. The more you build, log, and engage, the more points you earn!
          </p>

          {/* Categories */}
          <div className={styles.categories}>
            {Object.entries(POINTS_BY_CATEGORY).map(([key, category]) => {
              const IconComponent = category.icon;
              const isGrowthCategory = key === 'growth';
              
              return (
                <div key={key} className={styles.category}>
                  <div className={styles.categoryHeader}>
                    <div 
                      className={styles.categoryIcon}
                      style={{ color: category.color }}
                    >
                      <IconComponent size={18} />
                    </div>
                    <span className={styles.categoryLabel}>{category.label}</span>
                  </div>
                  <ul className={styles.actionList}>
                    {category.actions.map((action, idx) => {
                      // Make "Refer a friend" clickable
                      const isReferralAction = isGrowthCategory && action.label === 'Refer a friend';
                      
                      if (isReferralAction) {
                        return (
                          <li key={idx} className={styles.actionItemReferral}>
                            <button
                              className={`${styles.referralButton} ${referralCopied ? styles.referralButtonCopied : ''}`}
                              onClick={handleReferralCopy}
                              disabled={!referralData?.referral_link}
                            >
                              <div className={styles.referralButtonContent}>
                                <span className={styles.referralIcon}>
                                  {referralCopied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                                </span>
                                <span className={styles.referralLabel}>
                                  {referralCopied ? 'Link copied!' : action.label}
                                </span>
                              </div>
                              <span 
                                className={styles.actionPoints}
                                style={{ color: category.color }}
                              >
                                +{action.points}
                              </span>
                            </button>
                            {referralCopied && (
                              <div className={styles.referralHint}>
                                Text this link to a friend. When they sign up, you both earn 250 points!
                              </div>
                            )}
                          </li>
                        );
                      }
                      
                      return (
                        <li key={idx} className={styles.actionItem}>
                          <span className={styles.actionLabel}>{action.label}</span>
                          <span 
                            className={styles.actionPoints}
                            style={{ color: category.color }}
                          >
                            +{action.points}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}

            {/* Streak Bonuses */}
            <div className={styles.category}>
              <div className={styles.categoryHeader}>
                <div 
                  className={styles.categoryIcon}
                  style={{ color: '#f59e0b' }}
                >
                  <FlameIcon size={18} />
                </div>
                <span className={styles.categoryLabel}>Streak Bonuses</span>
              </div>
              <p className={styles.streakIntro}>
                Use the app consistently to earn bonus points!
              </p>
              <ul className={styles.actionList}>
                {STREAK_BONUSES.map((bonus, idx) => (
                  <li key={idx} className={styles.actionItem}>
                    <span className={styles.actionLabel}>{bonus.weeks} week streak</span>
                    <span 
                      className={styles.actionPoints}
                      style={{ color: '#f59e0b' }}
                    >
                      +{bonus.points}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.gotItButton} onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render at document root
  if (typeof window === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
