'use client';

/**
 * CelebrationModal Component
 * 
 * Displays a celebration when a user marks a part as installed.
 * Features:
 * - CSS-based confetti animation (no external dependencies)
 * - Part name display
 * - Progress counter (X of Y installed)
 * - Auto-dismiss after delay
 */

import React, { useEffect, useState } from 'react';
import Modal from './ui/Modal';
import { Icons } from './ui/Icons';
import styles from './CelebrationModal.module.css';

/**
 * CelebrationModal - Celebrate part installation
 * 
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Close handler
 * @param {string} partName - Name of the installed part
 * @param {number} installedCount - Number of parts now installed
 * @param {number} totalCount - Total parts in build
 */
export default function CelebrationModal({
  isOpen,
  onClose,
  partName,
  installedCount,
  totalCount,
}) {
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Trigger confetti when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      
      // Auto-close after 4 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      
      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
    }
  }, [isOpen, onClose]);
  
  // Calculate progress
  const progressPercent = totalCount > 0 
    ? Math.round((installedCount / totalCount) * 100)
    : 0;
  
  const isComplete = installedCount === totalCount;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className={styles.container}>
        {/* Confetti Effect */}
        {showConfetti && <ConfettiEffect />}
        
        {/* Success Icon */}
        <div className={styles.iconWrapper}>
          <div className={styles.iconCircle}>
            {isComplete ? (
              <Icons.trophy size={40} />
            ) : (
              <Icons.check size={40} />
            )}
          </div>
        </div>
        
        {/* Title */}
        <h2 className={styles.title}>
          {isComplete ? 'Build Complete!' : 'Part Installed!'}
        </h2>
        
        {/* Part Name */}
        <p className={styles.partName}>{partName}</p>
        
        {/* Progress */}
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className={styles.progressText}>
            {installedCount} of {totalCount} parts installed
          </p>
        </div>
        
        {/* Message */}
        <p className={styles.message}>
          {isComplete
            ? "Congratulations! You've completed your build."
            : `${totalCount - installedCount} more part${totalCount - installedCount === 1 ? '' : 's'} to go!`
          }
        </p>
        
        {/* Close Button */}
        <button className={styles.closeBtn} onClick={onClose}>
          {isComplete ? 'View Build' : 'Continue'}
        </button>
      </div>
    </Modal>
  );
}

/**
 * CSS-based confetti effect
 */
function ConfettiEffect() {
  // Generate confetti pieces
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.5}s`,
    duration: `${1 + Math.random() * 2}s`,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: `${4 + Math.random() * 6}px`,
    rotation: `${Math.random() * 360}deg`,
  }));
  
  return (
    <div className={styles.confettiContainer} aria-hidden="true">
      {pieces.map(piece => (
        <div
          key={piece.id}
          className={styles.confetti}
          style={{
            left: piece.left,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
            backgroundColor: piece.color,
            width: piece.size,
            height: piece.size,
            transform: `rotate(${piece.rotation})`,
          }}
        />
      ))}
    </div>
  );
}

// Confetti colors (brand colors + festive)
const CONFETTI_COLORS = [
  '#d4ff00', // lime
  '#10b981', // teal
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#22d3ee', // cyan
];
