'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import styles from './page.module.css';

/**
 * Community Page - TikTok/IG-style Build Feed
 * 
 * Features:
 * - Vertical scrolling feed of builds
 * - Full-width cards with hero images
 * - Quick actions (favorite, share, view details)
 * - Filter by category/tag
 * - Infinite scroll
 */

// Icons
const HeartIcon = ({ filled }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} 
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

const CommentIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const ChevronIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

// Filter categories
const CATEGORIES = [
  { id: 'all', label: 'All Builds' },
  { id: 'track', label: 'Track' },
  { id: 'street', label: 'Street' },
  { id: 'drift', label: 'Drift' },
  { id: 'show', label: 'Show' },
  { id: 'rally', label: 'Rally' },
];

// Sample community builds data (would come from API)
const SAMPLE_BUILDS = [
  {
    id: 1,
    title: 'Track Monster 991.2 GT3',
    car: { year: 2018, make: 'Porsche', model: '911 GT3', slug: 'porsche-911-gt3-2018' },
    owner: { name: 'TrackDayMike', avatar: null },
    image: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f373b?w=800&h=600&fit=crop',
    stats: { hp: 520, cost: 45000, mods: 12 },
    tags: ['track', 'na', 'pdk'],
    likes: 234,
    comments: 18,
    featured: true,
  },
  {
    id: 2,
    title: 'Daily Driven Widebody M4',
    car: { year: 2021, make: 'BMW', model: 'M4 Competition', slug: 'bmw-m4-competition-2021' },
    owner: { name: 'BimmerFan_JP', avatar: null },
    image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&h=600&fit=crop',
    stats: { hp: 580, cost: 32000, mods: 8 },
    tags: ['street', 'turbo', 'widebody'],
    likes: 456,
    comments: 42,
    featured: false,
  },
  {
    id: 3,
    title: 'K-Swap Track Miata',
    car: { year: 1995, make: 'Mazda', model: 'MX-5 Miata', slug: 'mazda-mx5-miata-1995' },
    owner: { name: 'MiataLife', avatar: null },
    image: 'https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=800&h=600&fit=crop',
    stats: { hp: 280, cost: 18000, mods: 15 },
    tags: ['track', 'swap', 'lightweight'],
    likes: 892,
    comments: 76,
    featured: true,
  },
  {
    id: 4,
    title: 'Pro Drift 350Z',
    car: { year: 2006, make: 'Nissan', model: '350Z', slug: 'nissan-350z-2006' },
    owner: { name: 'DriftKing99', avatar: null },
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
    stats: { hp: 450, cost: 28000, mods: 20 },
    tags: ['drift', 'turbo', 'ls-swap'],
    likes: 1203,
    comments: 89,
    featured: false,
  },
  {
    id: 5,
    title: 'Coyote Swapped S550',
    car: { year: 2019, make: 'Ford', model: 'Mustang GT', slug: 'ford-mustang-gt-2019' },
    owner: { name: 'MustangMatt', avatar: null },
    image: 'https://images.unsplash.com/photo-1584345604476-8ec5f82d718e?w=800&h=600&fit=crop',
    stats: { hp: 720, cost: 55000, mods: 18 },
    tags: ['street', 'supercharged', 'drag'],
    likes: 567,
    comments: 34,
    featured: false,
  },
];

export default function CommunityPage() {
  const { user, isAuthenticated } = useAuth();
  const [builds, setBuilds] = useState(SAMPLE_BUILDS);
  const [activeFilter, setActiveFilter] = useState('all');
  const [likedBuilds, setLikedBuilds] = useState(new Set());
  const feedRef = useRef(null);
  
  // Filter builds by category
  const filteredBuilds = activeFilter === 'all' 
    ? builds 
    : builds.filter(b => b.tags.includes(activeFilter));
  
  // Toggle like
  const toggleLike = useCallback((buildId) => {
    setLikedBuilds(prev => {
      const next = new Set(prev);
      if (next.has(buildId)) {
        next.delete(buildId);
      } else {
        next.add(buildId);
      }
      return next;
    });
  }, []);
  
  // Share build
  const shareBuild = useCallback((build) => {
    if (navigator.share) {
      navigator.share({
        title: build.title,
        text: `Check out this ${build.car.year} ${build.car.make} ${build.car.model} build on AutoRev`,
        url: `https://autorev.app/community/builds/${build.id}`,
      });
    }
  }, []);
  
  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Community</h1>
        <button className={styles.filterBtn}>
          <FilterIcon />
        </button>
      </header>
      
      {/* Category Filter - Horizontal scroll */}
      <div className={styles.filterBar}>
        <div className={styles.filterScroll}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`${styles.filterPill} ${activeFilter === cat.id ? styles.filterActive : ''}`}
              onClick={() => setActiveFilter(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Build Feed */}
      <div className={styles.feed} ref={feedRef}>
        {filteredBuilds.map((build, index) => (
          <article key={build.id} className={styles.buildCard}>
            {/* Build Image */}
            <div className={styles.buildImageWrapper}>
              <Image
                src={build.image}
                alt={build.title}
                fill
                className={styles.buildImage}
                sizes="(max-width: 768px) 100vw, 600px"
                priority={index < 2}
              />
              
              {/* Overlay gradient */}
              <div className={styles.buildOverlay} />
              
              {/* Featured badge */}
              {build.featured && (
                <span className={styles.featuredBadge}>Featured</span>
              )}
              
              {/* Quick action buttons - right side */}
              <div className={styles.quickActions}>
                <button 
                  className={`${styles.actionBtn} ${likedBuilds.has(build.id) ? styles.liked : ''}`}
                  onClick={() => toggleLike(build.id)}
                  aria-label="Like build"
                >
                  <HeartIcon filled={likedBuilds.has(build.id)} />
                  <span>{build.likes + (likedBuilds.has(build.id) ? 1 : 0)}</span>
                </button>
                
                <button className={styles.actionBtn} aria-label="Comments">
                  <CommentIcon />
                  <span>{build.comments}</span>
                </button>
                
                <button 
                  className={styles.actionBtn} 
                  onClick={() => shareBuild(build)}
                  aria-label="Share build"
                >
                  <ShareIcon />
                </button>
              </div>
            </div>
            
            {/* Build Info */}
            <div className={styles.buildInfo}>
              <div className={styles.buildHeader}>
                <div className={styles.ownerInfo}>
                  <div className={styles.ownerAvatar}>
                    {build.owner.name.charAt(0)}
                  </div>
                  <span className={styles.ownerName}>{build.owner.name}</span>
                </div>
              </div>
              
              <h2 className={styles.buildTitle}>{build.title}</h2>
              
              <p className={styles.buildCar}>
                {build.car.year} {build.car.make} {build.car.model}
              </p>
              
              {/* Stats */}
              <div className={styles.buildStats}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{build.stats.hp}</span>
                  <span className={styles.statLabel}>HP</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>${(build.stats.cost / 1000).toFixed(0)}k</span>
                  <span className={styles.statLabel}>Invested</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{build.stats.mods}</span>
                  <span className={styles.statLabel}>Mods</span>
                </div>
              </div>
              
              {/* Tags */}
              <div className={styles.buildTags}>
                {build.tags.map(tag => (
                  <span key={tag} className={styles.tag}>#{tag}</span>
                ))}
              </div>
              
              {/* View Details CTA */}
              <Link href={`/community/builds/${build.id}`} className={styles.viewDetailsBtn}>
                View Full Build
                <ChevronIcon />
              </Link>
            </div>
          </article>
        ))}
        
        {/* Load More / End of feed */}
        <div className={styles.feedEnd}>
          <p>You&apos;ve reached the end!</p>
          <button 
            className={styles.refreshBtn}
            onClick={() => setBuilds([...SAMPLE_BUILDS])}
          >
            Refresh Feed
          </button>
        </div>
      </div>
    </div>
  );
}
