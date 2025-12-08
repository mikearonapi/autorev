'use client';

/**
 * CarCarousel Component
 * 
 * An auto-scrolling carousel showcasing all ~100 sports cars.
 * Creates an engaging visual experience as users scroll through the page.
 * Mobile-optimized: pauses on touch, allows manual scrolling.
 */

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
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

/**
 * Shuffle array using Fisher-Yates algorithm with a seeded random
 * Using a seed ensures consistent shuffling on server/client to avoid hydration issues
 */
function seededShuffle(array, seed = 42) {
  const shuffled = [...array];
  let currentIndex = shuffled.length;
  
  // Simple seeded random number generator
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  
  while (currentIndex > 0) {
    const randomIndex = Math.floor(seededRandom() * currentIndex);
    currentIndex--;
    [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
  }
  
  return shuffled;
}

/**
 * Create a variety mix by interleaving cars from different tiers and makes
 */
function createVarietyMix(cars) {
  // Group cars by manufacturer
  const byMake = {};
  cars.forEach(car => {
    const make = car.make || car.name.split(' ')[0];
    if (!byMake[make]) byMake[make] = [];
    byMake[make].push(car);
  });
  
  // Shuffle each manufacturer's cars
  Object.keys(byMake).forEach(make => {
    byMake[make] = seededShuffle(byMake[make]);
  });
  
  // Interleave cars from different manufacturers for variety
  const makes = seededShuffle(Object.keys(byMake));
  const result = [];
  let hasMore = true;
  
  while (hasMore) {
    hasMore = false;
    for (const make of makes) {
      if (byMake[make].length > 0) {
        result.push(byMake[make].shift());
        hasMore = true;
      }
    }
  }
  
  return result;
}

export default function CarCarousel() {
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const touchStartRef = useRef(null);
  const lastScrollRef = useRef(0);
  
  // Mark when we're on the client
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Create a varied mix of cars from different makes and tiers
  const shuffledCars = useMemo(() => createVarietyMix(carData), []);
  
  // Duplicate cars for infinite scroll effect (triple for smoother looping)
  const displayCars = useMemo(() => [...shuffledCars, ...shuffledCars, ...shuffledCars], [shuffledCars]);
  
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
    if (!scrollContainer || !isClient) return;
    
    let animationId;
    let lastTime = 0;
    // Speed in pixels per second for consistent speed across devices
    const scrollSpeed = isMobile ? 40 : 60;
    
    const animate = (currentTime) => {
      if (!lastTime) lastTime = currentTime;
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;
      
      if (!isPaused && scrollContainer) {
        scrollContainer.scrollLeft += scrollSpeed * deltaTime;
        
        // Reset scroll when we've scrolled through the first set (1/3 of total since we tripled)
        const oneThirdWidth = scrollContainer.scrollWidth / 3;
        if (scrollContainer.scrollLeft >= oneThirdWidth) {
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
  }, [isPaused, isMobile, isClient]);
  
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

