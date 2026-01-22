'use client';

/**
 * WeeklyEngagement Component
 * 
 * Swipeable views showing:
 * 1. Weekly Activity - 7 days of the week (default view)
 * 2. Monthly Activity - days of the current month
 * 3. Yearly Activity - 12 months of the year
 * 
 * Swipe left/right or tap to switch between views
 * 
 * Features animated bar growth matching the Apple-style activity rings animation.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import styles from './WeeklyEngagement.module.css';

// Minimum swipe distance to trigger view change (in pixels)
const SWIPE_THRESHOLD = 50;

// Animation duration in milliseconds (matches ConcentricRings)
const ANIMATION_DURATION = 1000;

// View order for swiping
const VIEWS = ['weekly', 'monthly', 'yearly'];
const VIEW_TITLES = {
  weekly: 'Weekly Activity',
  monthly: 'Monthly Activity',
  yearly: 'Yearly Activity',
};

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export default function WeeklyEngagement({
  dailyActivity = [], // Array of 7 days, each with { al, community, data } values
  monthlyActivity = [], // Array of days in current month, each with { day, al, community, data } values
  yearlyActivity = [], // Array of 12 months, each with { month, al, community, data } values
  streak = { current: 0, longest: 0 },
  animated = true,
}) {
  const [view, setView] = useState('weekly'); // 'weekly', 'monthly', or 'yearly'
  const [animationProgress, setAnimationProgress] = useState(animated ? 0 : 1);
  const touchStartX = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef(null);

  // Animate bars on mount and when view changes
  useEffect(() => {
    if (!animated) {
      setAnimationProgress(1);
      return;
    }

    // Reset animation progress when view changes
    setAnimationProgress(0);
    
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      // Ease-out-cubic (matches ConcentricRings)
      const eased = 1 - Math.pow(1 - progress, 3);
      
      setAnimationProgress(eased);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [view, animated]);

  // Handle touch start
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  // Handle touch end - detect swipe direction
  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      const currentIndex = VIEWS.indexOf(view);
      if (diff > 0) {
        // Swiped left - go to next view
        const nextIndex = Math.min(currentIndex + 1, VIEWS.length - 1);
        setView(VIEWS[nextIndex]);
      } else {
        // Swiped right - go to previous view
        const prevIndex = Math.max(currentIndex - 1, 0);
        setView(VIEWS[prevIndex]);
      }
    }
    
    touchStartX.current = null;
  }, [view]);

  // Manual tap to switch views (cycle through both)
  const handleTap = useCallback(() => {
    const currentIndex = VIEWS.indexOf(view);
    const nextIndex = (currentIndex + 1) % VIEWS.length;
    setView(VIEWS[nextIndex]);
  }, [view]);

  // Generate data for each view (if not provided, create empty)
  const weeklyData = dailyActivity.length === 7 ? dailyActivity : generateEmptyWeeklyData();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const monthlyData = monthlyActivity.length === daysInMonth ? monthlyActivity : generateEmptyMonthlyData();
  const yearlyData = yearlyActivity.length === 12 ? yearlyActivity : generateEmptyYearlyData();

  return (
    <div 
      ref={containerRef}
      className={styles.container} 
      onClick={handleTap}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>
          {VIEW_TITLES[view]}
        </h3>
        <div className={styles.headerRight}>
          <div className={styles.viewIndicator}>
            {VIEWS.map((v) => (
              <span 
                key={v} 
                className={`${styles.dot} ${view === v ? styles.dotActive : ''}`} 
              />
            ))}
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {/* View 1: Weekly Activity Bar Chart (7 days) */}
        {view === 'weekly' && (
          <div className={styles.chartContainer}>
            <div className={styles.weeklyChart}>
              {weeklyData.map((day, idx) => {
                const maxPerCategory = 15;
                const isToday = idx === getTodayIndex();
                
                // Apply animation progress to bar heights
                const alHeight = Math.min((day.al / maxPerCategory) * 100, 100) * animationProgress;
                const communityHeight = Math.min((day.community / maxPerCategory) * 100, 100) * animationProgress;
                const dataHeight = Math.min((day.data / maxPerCategory) * 100, 100) * animationProgress;
                
                return (
                  <div key={idx} className={styles.weekBarColumn}>
                    <div className={styles.weekBarStack}>
                      <div 
                        className={styles.barSegment}
                        style={{ 
                          height: `${alHeight}%`,
                          background: '#a855f7',
                        }}
                      />
                      <div 
                        className={styles.barSegment}
                        style={{ 
                          height: `${communityHeight}%`,
                          background: '#3b82f6',
                        }}
                      />
                      <div 
                        className={styles.barSegment}
                        style={{ 
                          height: `${dataHeight}%`,
                          background: '#10b981',
                        }}
                      />
                    </div>
                    <span className={`${styles.barLabel} ${isToday ? styles.barLabelToday : ''}`}>
                      {DAYS[idx]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View 2: Monthly Activity Bar Chart (days of month) */}
        {view === 'monthly' && (
          <div className={styles.chartContainer}>
            <div className={styles.monthlyChart}>
              {monthlyData.map((dayData, idx) => {
                const maxPerCategory = 15;
                const today = new Date().getDate();
                const isToday = dayData.day === today;
                // Show label for: first day, today, and last day
                const showLabel = dayData.day === 1 || isToday || dayData.day === monthlyData.length;
                
                // Apply animation progress to bar heights
                const alHeight = Math.min((dayData.al / maxPerCategory) * 100, 100) * animationProgress;
                const communityHeight = Math.min((dayData.community / maxPerCategory) * 100, 100) * animationProgress;
                const dataHeight = Math.min((dayData.data / maxPerCategory) * 100, 100) * animationProgress;
                
                return (
                  <div key={idx} className={styles.monthBarColumn}>
                    <div className={styles.monthBarStack}>
                      <div 
                        className={styles.barSegment}
                        style={{ 
                          height: `${alHeight}%`,
                          background: '#a855f7',
                        }}
                      />
                      <div 
                        className={styles.barSegment}
                        style={{ 
                          height: `${communityHeight}%`,
                          background: '#3b82f6',
                        }}
                      />
                      <div 
                        className={styles.barSegment}
                        style={{ 
                          height: `${dataHeight}%`,
                          background: '#10b981',
                        }}
                      />
                    </div>
                    <span className={`${styles.barLabel} ${isToday ? styles.barLabelToday : ''} ${!showLabel ? styles.barLabelHidden : ''}`}>
                      {showLabel ? dayData.day : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View 3: Yearly Activity Bar Chart (12 months) */}
        {view === 'yearly' && (
          <div className={styles.chartContainer}>
            <div className={styles.yearlyChart}>
              {yearlyData.map((monthData, idx) => {
                // Scale for monthly totals - higher max since it aggregates a full month
                const maxPerCategory = 100;
                const currentMonth = new Date().getMonth();
                const isCurrentMonth = idx === currentMonth;
                
                // Apply animation progress to bar heights
                const alHeight = Math.min((monthData.al / maxPerCategory) * 100, 100) * animationProgress;
                const communityHeight = Math.min((monthData.community / maxPerCategory) * 100, 100) * animationProgress;
                const dataHeight = Math.min((monthData.data / maxPerCategory) * 100, 100) * animationProgress;
                
                return (
                  <div key={idx} className={styles.yearBarColumn}>
                    <div className={styles.yearBarStack}>
                      <div 
                        className={styles.barSegment}
                        style={{ 
                          height: `${alHeight}%`,
                          background: '#a855f7',
                        }}
                      />
                      <div 
                        className={styles.barSegment}
                        style={{ 
                          height: `${communityHeight}%`,
                          background: '#3b82f6',
                        }}
                      />
                      <div 
                        className={styles.barSegment}
                        style={{ 
                          height: `${dataHeight}%`,
                          background: '#10b981',
                        }}
                      />
                    </div>
                    <span className={`${styles.barLabel} ${isCurrentMonth ? styles.barLabelToday : ''}`}>
                      {MONTHS[idx]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper to get today's index (0 = Monday)
function getTodayIndex() {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1; // Convert Sunday=0 to index 6
}

// Generate empty weekly data (7 days)
function generateEmptyWeeklyData() {
  return DAYS.map(() => ({ al: 0, community: 0, data: 0 }));
}

// Generate empty monthly data (days in current month)
function generateEmptyMonthlyData() {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Array(daysInMonth).fill(null).map((_, idx) => ({ day: idx + 1, al: 0, community: 0, data: 0 }));
}

// Generate empty yearly data (12 months)
function generateEmptyYearlyData() {
  return MONTHS.map((_, idx) => ({ month: idx + 1, al: 0, community: 0, data: 0 }));
}
