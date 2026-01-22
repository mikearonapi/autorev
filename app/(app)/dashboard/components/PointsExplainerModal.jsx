'use client';

/**
 * PointsExplainerModal
 * 
 * Modal that explains how users can earn points across the app.
 * Triggered by the info button near the activity rings.
 */

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon, GarageIcon, DataIcon, CommunityIcon, MessageIcon, FlameIcon } from './DashboardIcons';
import styles from './PointsExplainerModal.module.css';

// Points configuration - matches lib/pointsService.js
const POINTS_BY_CATEGORY = {
  garage: {
    label: 'Garage',
    icon: GarageIcon,
    color: '#d4ff00',
    actions: [
      { label: 'Add a vehicle', points: 100 },
      { label: 'Add a modification', points: 50 },
      { label: 'Upload a photo', points: 25 },
      { label: 'Add part details', points: 25 },
    ],
  },
  data: {
    label: 'Data',
    icon: DataIcon,
    color: '#10b981',
    actions: [
      { label: 'Log dyno data', points: 75 },
      { label: 'Log track time', points: 75 },
    ],
  },
  community: {
    label: 'Community',
    icon: CommunityIcon,
    color: '#3b82f6',
    actions: [
      { label: 'Share your build', points: 100 },
      { label: 'Post a comment', points: 10 },
      { label: 'Like a post', points: 5 },
    ],
  },
  al: {
    label: 'AL',
    icon: MessageIcon,
    color: '#a855f7',
    actions: [
      { label: 'Ask AL a question', points: 25 },
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

export default function PointsExplainerModal({ isOpen, onClose }) {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

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

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
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
                    {category.actions.map((action, idx) => (
                      <li key={idx} className={styles.actionItem}>
                        <span className={styles.actionLabel}>{action.label}</span>
                        <span 
                          className={styles.actionPoints}
                          style={{ color: category.color }}
                        >
                          +{action.points}
                        </span>
                      </li>
                    ))}
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
