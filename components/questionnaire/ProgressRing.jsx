'use client';

/**
 * ProgressRing Component
 * 
 * Circular progress indicator showing questionnaire completion.
 * SVG-based with smooth animations.
 */

import { useState, useEffect } from 'react';
import styles from './ProgressRing.module.css';

export default function ProgressRing({
  percentage = 0,
  size = 120,
  strokeWidth = 8,
  color = '#10b981',
  backgroundColor = 'rgba(255, 255, 255, 0.1)',
  animated = true,
  showLabel = true,
  label,
  subLabel,
  children,
}) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  
  // Animate on mount and when percentage changes
  useEffect(() => {
    if (!animated) {
      setAnimatedPercentage(percentage);
      return;
    }
    
    // Animate to new percentage
    const duration = 800;
    const startTime = Date.now();
    const startValue = animatedPercentage;
    const endValue = percentage;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing function (ease-out-cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * eased;
      
      setAnimatedPercentage(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [percentage, animated]);
  
  // Calculate SVG dimensions
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;
  const center = size / 2;
  
  return (
    <div className={styles.container} style={{ width: size, height: size }}>
      <svg
        className={styles.svg}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          className={styles.backgroundCircle}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <circle
          className={styles.progressCircle}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      
      {/* Center content */}
      <div className={styles.centerContent}>
        {children ? (
          children
        ) : showLabel ? (
          <>
            <span className={styles.percentage}>
              {Math.round(animatedPercentage)}%
            </span>
            {label && <span className={styles.label}>{label}</span>}
            {subLabel && <span className={styles.subLabel}>{subLabel}</span>}
          </>
        ) : null}
      </div>
    </div>
  );
}
