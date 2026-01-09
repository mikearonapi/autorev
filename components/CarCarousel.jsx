'use client';

/**
 * CarCarousel Component
 * 
 * A dual-row marquee showcasing all ~100 sports cars.
 * Two rows scroll in opposite directions for a dynamic, premium feel.
 * Mobile-optimized: pauses on touch, allows manual scrolling.
 * 
 * Now fetches from database via carsClient with fallback.
 */

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCarsList } from '@/hooks/useCarData';
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
function createVarietyMix(cars, seed = 42) {
  // Group cars by manufacturer
  const byMake = {};
  cars.forEach(car => {
    const make = car.make || car.name.split(' ')[0];
    if (!byMake[make]) byMake[make] = [];
    byMake[make].push(car);
  });
  
  // Shuffle each manufacturer's cars
  Object.keys(byMake).forEach(make => {
    byMake[make] = seededShuffle(byMake[make], seed);
  });
  
  // Interleave cars from different manufacturers for variety
  const makes = seededShuffle(Object.keys(byMake), seed);
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

/**
 * Single row component for the marquee
 */
function MarqueeRow({ cars, direction, isPausedRef, isMobile, rowIndex }) {
  const scrollRef = useRef(null);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Triple the cars for seamless infinite scroll
  const displayCars = useMemo(() => [...cars, ...cars, ...cars], [cars]);
  
  // Auto-scroll animation
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || !isClient) return;
    
    let animationId;
    let lastTime = performance.now();
    // Speed varies slightly between rows for visual interest
    const baseSpeed = isMobile ? 40 : 60;
    const scrollSpeed = direction === 'left' ? baseSpeed : baseSpeed * 0.85;
    
    // PERF: Cache scrollWidth outside animation loop to avoid forced reflow
    // scrollWidth doesn't change during animation, so read it once
    const totalWidth = scrollContainer.scrollWidth;
    const oneThirdWidth = totalWidth / 3;
    const oneSixthWidth = totalWidth / 6;
    
    // Start second row at different position for visual variety
    if (direction === 'right' && scrollContainer.scrollLeft === 0) {
      scrollContainer.scrollLeft = oneSixthWidth;
    }
    
    const animate = () => {
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      if (!isPausedRef.current && scrollContainer) {
        if (direction === 'left') {
          scrollContainer.scrollLeft += scrollSpeed * deltaTime;
          // Use cached value instead of reading scrollWidth
          if (scrollContainer.scrollLeft >= oneThirdWidth) {
            scrollContainer.scrollLeft = 0;
          }
        } else {
          scrollContainer.scrollLeft -= scrollSpeed * deltaTime;
          if (scrollContainer.scrollLeft <= 0) {
            // Use cached value instead of reading scrollWidth
            scrollContainer.scrollLeft = oneThirdWidth;
          }
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
  }, [isMobile, isClient, direction, isPausedRef]);
  
  return (
    <div className={styles.scrollContainer} ref={scrollRef}>
      {displayCars.map((car, index) => (
        <Link 
          key={`${car.slug}-${rowIndex}-${index}`}
          href={`/browse-cars/${car.slug}`}
          className={styles.carCard}
          prefetch={false}
        >
          <div className={styles.imageWrapper}>
            <Image
              src={getCarImageUrl(car.slug)}
              alt={car.name}
              fill
              sizes="(max-width: 480px) 160px, (max-width: 768px) 200px, 240px"
              className={styles.carImage}
              style={{ objectFit: 'cover' }}
              loading="lazy"
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
  );
}

export default function CarCarousel() {
  const isPausedRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Fetch cars using React Query (consistent with other pages)
  const { data: carsResponse } = useCarsList();
  const carData = useMemo(() => carsResponse?.cars || [], [carsResponse]);
  
  // Check for mobile viewport
  useEffect(() => {
  if (typeof window === 'undefined') return;
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Pause/resume handlers
  const pauseScroll = useCallback(() => {
    isPausedRef.current = true;
  }, []);
  
  const resumeScroll = useCallback(() => {
    isPausedRef.current = false;
  }, []);
  
  // Create two varied mixes with different seeds for each row
  const topRowCars = useMemo(() => createVarietyMix(carData, 42), [carData]);
  const bottomRowCars = useMemo(() => createVarietyMix(carData, 137), [carData]);
  
  return (
    <div 
      className={styles.carousel}
      onMouseEnter={pauseScroll}
      onMouseLeave={resumeScroll}
    >
      {/* Top row - scrolls left */}
      <MarqueeRow 
        cars={topRowCars} 
        direction="left" 
        isPausedRef={isPausedRef}
        isMobile={isMobile}
        rowIndex={0}
      />
      
      {/* Bottom row - scrolls right */}
      <MarqueeRow 
        cars={bottomRowCars} 
        direction="right" 
        isPausedRef={isPausedRef}
        isMobile={isMobile}
        rowIndex={1}
      />
      
      {/* Gradient overlays for edge fade effect */}
      <div className={styles.gradientLeft} />
      <div className={styles.gradientRight} />
    </div>
  );
}

