'use client';

/**
 * FeedbackCorner Component
 * 
 * Discreet feedback icon in the top right corner, just under the header.
 * Features a subtle wiggle animation that plays periodically to catch attention.
 */

import { useState, useEffect } from 'react';
import { useFeedback } from './FeedbackContext';
import styles from './FeedbackCorner.module.css';

// Message icon
const FeedbackIcon = ({ size = 20 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

export default function FeedbackCorner() {
  const [isWiggling, setIsWiggling] = useState(false);
  const { openFeedback } = useFeedback();
  
  // Trigger wiggle animation every 12-18 seconds
  useEffect(() => {
    const triggerWiggle = () => {
      setIsWiggling(true);
      // Stop wiggling after animation completes
      setTimeout(() => setIsWiggling(false), 1000);
    };
    
    // Initial wiggle after 5 seconds
    const initialTimeout = setTimeout(triggerWiggle, 5000);
    
    // Then wiggle at random intervals (12-18 seconds)
    const interval = setInterval(() => {
      const randomDelay = Math.random() * 6000; // 0-6 seconds variance
      setTimeout(triggerWiggle, randomDelay);
    }, 15000);
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);
  
  const handleClick = () => {
    openFeedback();
  };
  
  return (
    <button
      className={`${styles.feedbackCorner} ${isWiggling ? styles.wiggle : ''}`}
      onClick={handleClick}
      aria-label="Give feedback"
    >
      <FeedbackIcon size={18} />
      <span className={styles.tooltip}>Share feedback</span>
    </button>
  );
}

