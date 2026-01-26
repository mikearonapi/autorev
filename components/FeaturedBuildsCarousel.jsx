'use client';

/**
 * Featured Builds Carousel Component
 * 
 * Showcases community builds on the homepage to inspire new users
 * and demonstrate what's possible with AutoRev's build planner.
 * 
 * BUILD PIVOT: Primary homepage social proof section
 * 
 * @module components/FeaturedBuildsCarousel
 */

import { useState, useEffect, useRef, useCallback } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import styles from './FeaturedBuildsCarousel.module.css';

// Icons
const BoltIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const WrenchIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const HeartIcon = ({ filled = false }) => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

/**
 * Featured build card showcasing a community build
 */
function BuildCard({ build, priority = false }) {
  const {
    title,
    carName,
    carSlug,
    imageUrl,
    hpGain,
    modCount,
    likes,
    builderName,
    buildStage,
  } = build;

  return (
    <Link href={`/community/builds/${carSlug}`} className={styles.card}>
      <div className={styles.cardImageContainer}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${carName} build by ${builderName}`}
            fill
            sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, 360px"
            className={styles.cardImage}
            priority={priority}
          />
        ) : (
          <div className={styles.cardImagePlaceholder}>
            <WrenchIcon />
          </div>
        )}
        <div className={styles.cardOverlay}>
          {buildStage && (
            <span className={styles.buildStage}>{buildStage}</span>
          )}
        </div>
      </div>
      
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{title || carName}</h3>
        <p className={styles.cardCar}>{carName}</p>
        
        <div className={styles.cardStats}>
          <div className={styles.statItem}>
            <BoltIcon />
            <span>+{hpGain} HP</span>
          </div>
          <div className={styles.statItem}>
            <WrenchIcon />
            <span>{modCount} mods</span>
          </div>
          <div className={styles.statItem}>
            <HeartIcon />
            <span>{likes}</span>
          </div>
        </div>
        
        <div className={styles.cardFooter}>
          <span className={styles.builderName}>by {builderName}</span>
        </div>
      </div>
    </Link>
  );
}

/**
 * Placeholder builds for demo/development
 * In production, these would come from the database
 */
const PLACEHOLDER_BUILDS = [
  {
    id: '1',
    title: 'Weekend Warrior 911',
    carName: '2019 Porsche 911 GT3',
    carSlug: 'porsche-911-gt3',
    imageUrl: 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/cars/porsche-911-gt3-992-hero.webp',
    hpGain: 45,
    modCount: 8,
    likes: 124,
    builderName: 'TrackDayMike',
    buildStage: 'Stage 2',
  },
  {
    id: '2',
    title: 'JDM Dream Build',
    carName: '1999 Nissan Skyline GT-R',
    carSlug: 'nissan-skyline-gtr-r34',
    imageUrl: 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/cars/nissan-skyline-r34-hero.webp',
    hpGain: 280,
    modCount: 24,
    likes: 342,
    builderName: 'GT-RLife',
    buildStage: 'Stage 3+',
  },
  {
    id: '3',
    title: 'Budget Track Beast',
    carName: '2016 Mazda MX-5 Miata',
    carSlug: 'mazda-mx5-miata-nd',
    imageUrl: 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/cars/mazda-mx5-nd-hero.webp',
    hpGain: 65,
    modCount: 12,
    likes: 89,
    builderName: 'MiataManiac',
    buildStage: 'Stage 2',
  },
  {
    id: '4',
    title: 'Canyon Carver',
    carName: '2021 BMW M2 Competition',
    carSlug: 'bmw-m2-competition',
    imageUrl: 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/cars/bmw-m2-competition-hero.webp',
    hpGain: 85,
    modCount: 10,
    likes: 156,
    builderName: 'BavarianBoost',
    buildStage: 'Stage 2',
  },
  {
    id: '5',
    title: 'Turbo Civic Build',
    carName: '2018 Honda Civic Type R',
    carSlug: 'honda-civic-type-r-fk8',
    imageUrl: 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/cars/honda-civic-type-r-hero.webp',
    hpGain: 120,
    modCount: 15,
    likes: 198,
    builderName: 'VTECKicked',
    buildStage: 'Stage 3',
  },
];

/**
 * Featured Builds Carousel
 * Displays community builds with horizontal scroll on mobile
 * and arrows navigation on desktop
 */
export default function FeaturedBuildsCarousel({ 
  builds = PLACEHOLDER_BUILDS,
  title = "Featured Community Builds",
  subtitle = "Get inspired by what others are building"
}) {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll position to enable/disable arrows
  const updateScrollButtons = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 20);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 20);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    updateScrollButtons();
    container.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      container.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [updateScrollButtons]);

  const scroll = useCallback((direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = 300; // Approximate card width + gap
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
    
    container.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  }, []);

  if (!builds || builds.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        
        <div className={styles.headerActions}>
          <Link href="/community/builds" className={styles.viewAllLink}>
            View All Builds →
          </Link>
          
          <div className={styles.arrowsDesktop}>
            <button 
              className={`${styles.arrowBtn} ${!canScrollLeft ? styles.arrowDisabled : ''}`}
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
            >
              <ArrowLeftIcon />
            </button>
            <button 
              className={`${styles.arrowBtn} ${!canScrollRight ? styles.arrowDisabled : ''}`}
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Scroll right"
            >
              <ArrowRightIcon />
            </button>
          </div>
        </div>
      </div>

      <div className={styles.carouselContainer}>
        <div 
          ref={scrollContainerRef}
          className={styles.carousel}
        >
          {builds.map((build, index) => (
            <BuildCard 
              key={build.id} 
              build={build} 
              priority={index < 3}
            />
          ))}
        </div>

        {/* Gradient fade edges */}
        <div className={`${styles.fadeEdge} ${styles.fadeLeft} ${!canScrollLeft ? styles.fadeHidden : ''}`} />
        <div className={`${styles.fadeEdge} ${styles.fadeRight} ${!canScrollRight ? styles.fadeHidden : ''}`} />
      </div>

      {/* Start Building CTA */}
      <div className={styles.ctaContainer}>
        <Link href="/garage/tuning-shop" className={styles.ctaButton}>
          Start Your Build
        </Link>
      </div>
    </section>
  );
}
