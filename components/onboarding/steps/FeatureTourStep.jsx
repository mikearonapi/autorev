'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import styles from '../OnboardingFlow.module.css';

// Feature Icons
const SearchIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  </svg>
);

const GarageIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <path d="M9 22V12h6v10"/>
  </svg>
);

const WrenchIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const CommunityIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const SparklesIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/>
    <path d="M5 3v4M19 17v4M3 5h4M17 19h4"/>
  </svg>
);

/**
 * Build features array with dynamic car count
 * @param {number} carCount - Dynamic car count from database
 */
const getFeatures = (carCount) => [
  {
    id: 'research',
    icon: SearchIcon,
    title: 'Research',
    description: `Browse ${carCount} sports cars with detailed specs, expert reviews, and community insights.`,
    highlights: ['Browse Cars', 'Car Selector', 'Compare'],
  },
  {
    id: 'own',
    icon: GarageIcon,
    title: 'Own',
    description: 'Track your collection, decode VINs, get recall alerts, and log service history.',
    highlights: ['My Garage', 'VIN Decode', 'Service Logs'],
    intentHighlight: 'owner',
  },
  {
    id: 'build',
    icon: WrenchIcon,
    title: 'Build',
    description: 'Plan modifications, explore parts, and see real dyno data from modified cars.',
    highlights: ['Tuning Shop', 'Parts Catalog', 'Dyno Data'],
  },
  {
    id: 'connect',
    icon: CommunityIcon,
    title: 'Connect',
    description: 'Discover car events near you and explore our automotive encyclopedia.',
    highlights: ['Events', 'Encyclopedia', 'Community'],
  },
  {
    id: 'al',
    icon: SparklesIcon,
    title: 'Ask AL',
    description: 'Your AI car expert — get instant answers about any car, mod, or maintenance question.',
    highlights: ['AI Assistant', 'Car-Specific', 'Always Learning'],
  },
];

/**
 * FeatureTourStep Component
 * Step 4: Feature carousel showcasing key features
 * 
 * @param {Object} props
 * @param {string} props.className - CSS class name for animation
 * @param {string} props.userIntent - User's selected intent for highlighting
 * @param {number} props.carCount - Dynamic car count from database
 */
export default function FeatureTourStep({ className, userIntent, carCount = 188 }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef(null);
  const autoAdvanceRef = useRef(null);
  const isScrollingProgrammatically = useRef(false);
  const scrollTimeoutRef = useRef(null);
  
  // Get features with dynamic car count
  const features = getFeatures(carCount);

  // Auto-advance carousel
  const startAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) {
      clearInterval(autoAdvanceRef.current);
    }
    autoAdvanceRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % features.length);
    }, 5000);
  }, [features.length]);

  // Stop auto-advance on interaction
  const stopAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) {
      clearInterval(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoAdvance();
    return () => stopAutoAdvance();
  }, [startAutoAdvance, stopAutoAdvance]);

  // Scroll carousel when active index changes (programmatic navigation)
  useEffect(() => {
    if (carouselRef.current) {
      const cards = carouselRef.current.children;
      if (cards[activeIndex]) {
        // Mark that we're scrolling programmatically to prevent scroll handler interference
        isScrollingProgrammatically.current = true;
        
        // Use scrollTo with explicit position calculation for more reliable scrolling
        const cardWidth = carouselRef.current.offsetWidth;
        carouselRef.current.scrollTo({
          left: activeIndex * cardWidth,
          behavior: 'smooth',
        });
        
        // Clear the programmatic scroll flag after animation completes
        setTimeout(() => {
          isScrollingProgrammatically.current = false;
        }, 500);
      }
    }
  }, [activeIndex]);

  const handleDotClick = (index) => {
    stopAutoAdvance();
    setActiveIndex(index);
    // Restart auto-advance after manual interaction
    setTimeout(startAutoAdvance, 10000);
  };

  const handlePrev = () => {
    stopAutoAdvance();
    setActiveIndex(prev => Math.max(0, prev - 1));
    setTimeout(startAutoAdvance, 10000);
  };

  const handleNext = () => {
    stopAutoAdvance();
    setActiveIndex(prev => Math.min(features.length - 1, prev + 1));
    setTimeout(startAutoAdvance, 10000);
  };

  // Handle touch/scroll interaction - debounced to prevent multiple updates
  const handleScroll = useCallback(() => {
    // Ignore scroll events triggered by programmatic scrolling
    if (isScrollingProgrammatically.current) {
      return;
    }
    
    stopAutoAdvance();
    
    // Debounce scroll detection to only update when scrolling settles
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      if (carouselRef.current) {
        const scrollLeft = carouselRef.current.scrollLeft;
        const cardWidth = carouselRef.current.offsetWidth;
        const newIndex = Math.round(scrollLeft / cardWidth);
        if (newIndex !== activeIndex && newIndex >= 0 && newIndex < features.length) {
          setActiveIndex(newIndex);
        }
      }
      // Restart after scroll interaction settles
      setTimeout(startAutoAdvance, 10000);
    }, 100);
  }, [activeIndex, features.length, startAutoAdvance, stopAutoAdvance]);
  
  // Cleanup scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={className}>
      <h2 className={styles.stepTitle}>What you can do</h2>
      <p className={styles.stepDescription}>
        Swipe through to see what AutoRev has to offer.
      </p>
      
      <div className={styles.carouselContainer}>
        <div 
          ref={carouselRef}
          className={styles.carousel}
          onScroll={handleScroll}
          onTouchStart={stopAutoAdvance}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            const isHighlighted = feature.intentHighlight === userIntent;
            
            return (
              <div key={feature.id} className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <Icon />
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
                <div className={styles.featureHighlights}>
                  {feature.highlights.map((tag, i) => (
                    <span 
                      key={i} 
                      className={`${styles.featureTag} ${isHighlighted ? styles.featureTagHighlight : ''}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className={styles.carouselNav}>
          <button 
            className={styles.carouselArrow}
            onClick={handlePrev}
            disabled={activeIndex === 0}
            aria-label="Previous feature"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          
          {features.map((_, index) => (
            <button
              key={index}
              className={`${styles.carouselDot} ${index === activeIndex ? styles.active : ''}`}
              onClick={() => handleDotClick(index)}
              aria-label={`Go to feature ${index + 1}`}
            />
          ))}
          
          <button 
            className={styles.carouselArrow}
            onClick={handleNext}
            disabled={activeIndex === features.length - 1}
            aria-label="Next feature"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

