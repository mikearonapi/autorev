'use client';

/**
 * CarCarousel Component
 * 
 * An auto-scrolling carousel showcasing all 35 sports cars.
 * Creates an engaging visual experience as users scroll through the page.
 * Mobile-optimized: pauses on touch, allows manual scrolling.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { carData } from '@/data/cars.js';
import styles from './CarCarousel.module.css';

// Blob base URL for car images
const BLOB_BASE = 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com';

/**
 * Get car hero image URL
 */
function getCarImageUrl(slug) {
  return `${BLOB_BASE}/cars/${slug}/hero.webp`;
}

export default function CarCarousel() {
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const touchStartRef = useRef(null);
  const lastScrollRef = useRef(0);
  
  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Sort cars by tier for visual variety
  const sortedCars = [...carData].sort((a, b) => {
    const tierOrder = { premium: 0, 'upper-mid': 1, mid: 2, budget: 3 };
    return tierOrder[a.tier] - tierOrder[b.tier];
  });
  
  // Duplicate cars for infinite scroll effect
  const displayCars = [...sortedCars, ...sortedCars];
  
  // Handle touch start - pause animation
  const handleTouchStart = useCallback((e) => {
    setIsPaused(true);
    touchStartRef.current = e.touches[0].clientX;
    lastScrollRef.current = scrollRef.current?.scrollLeft || 0;
  }, []);
  
  // Handle touch move - manual scrolling
  const handleTouchMove = useCallback((e) => {
    if (!touchStartRef.current || !scrollRef.current) return;
    const touchDelta = touchStartRef.current - e.touches[0].clientX;
    scrollRef.current.scrollLeft = lastScrollRef.current + touchDelta;
  }, []);
  
  // Handle touch end - resume animation after delay
  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    // Resume auto-scroll after a brief delay
    setTimeout(() => {
      setIsPaused(false);
    }, 2000);
  }, []);
  
  // Auto-scroll animation
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;
    
    let animationId;
    // Slower speed on mobile for better UX
    const scrollSpeed = isMobile ? 0.3 : 0.5;
    
    const animate = () => {
      if (!isPaused && scrollContainer) {
        scrollContainer.scrollLeft += scrollSpeed;
        
        // Reset scroll when we've scrolled through the first set
        const halfWidth = scrollContainer.scrollWidth / 2;
        if (scrollContainer.scrollLeft >= halfWidth) {
          scrollContainer.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isPaused, isMobile]);
  
  return (
    <div 
      className={styles.carousel}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div 
        className={styles.scrollContainer} 
        ref={scrollRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {displayCars.map((car, index) => (
          <Link 
            key={`${car.slug}-${index}`}
            href={`/cars/${car.slug}`}
            className={styles.carCard}
          >
            <div className={styles.imageWrapper}>
              <Image
                src={getCarImageUrl(car.slug)}
                alt={car.name}
                fill
                sizes="(max-width: 480px) 200px, (max-width: 768px) 240px, 280px"
                className={styles.carImage}
                style={{ objectFit: 'cover' }}
              />
              <div className={styles.imageOverlay} />
            </div>
            <div className={styles.carInfo}>
              <span className={styles.carName}>{car.name}</span>
              <span className={styles.carMeta}>{car.priceRange}</span>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Gradient overlays for edge fade effect */}
      <div className={styles.gradientLeft} />
      <div className={styles.gradientRight} />
    </div>
  );
}

