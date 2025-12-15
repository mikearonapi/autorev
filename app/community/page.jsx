'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import EventCard from '@/components/EventCard';
import EventCategoryPill from '@/components/EventCategoryPill';
import { useState, useEffect } from 'react';

// Icons (Lucide style)
const Icons = {
  search: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  mapPin: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  coffee: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/>
      <line x1="10" y1="1" x2="10" y2="4"/>
      <line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  ),
  flag: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  ),
  cone: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 22 4.5-17a2 2 0 0 1 3 0l4.5 17"/>
      <path d="M2 22h20"/>
      <path d="M6 18h12"/>
      <path d="M8 14h8"/>
    </svg>
  ),
  trophy: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
    </svg>
  ),
  users: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  arrowRight: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
};

const CATEGORIES = [
  { name: 'Cars & Coffee', slug: 'cars-and-coffee', icon: <Icons.coffee />, description: 'Morning meetups with fellow enthusiasts' },
  { name: 'Track Days', slug: 'track-day', icon: <Icons.flag />, description: 'HPDE and open lapping sessions' },
  { name: 'Autocross', slug: 'autocross', icon: <Icons.cone />, description: 'Timed runs on closed courses' },
  { name: 'Car Shows', slug: 'car-show', icon: <Icons.trophy />, description: 'Concours and display events' },
  { name: 'Club Events', slug: 'club-meetup', icon: <Icons.users />, description: 'Brand and model club gatherings' },
];

export default function CommunityPage() {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationQuery, setLocationQuery] = useState('');

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch('/api/events/featured?limit=4');
        if (res.ok) {
          const data = await res.json();
          setFeaturedEvents(data.events || []);
        }
      } catch (err) {
        console.error('Failed to fetch featured events:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <span className={styles.badge}>Community</span>
          <h1 className={styles.heroTitle}>
            Find Your <span className={styles.titleAccent}>Next Event</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Discover Cars & Coffee meetups, track days, car shows, and more in your area.
            Connect with the AutoRev community.
          </p>

          <div className={styles.searchContainer}>
            <div className={styles.searchWrapper}>
              <Icons.mapPin size={20} />
              <input
                type="text"
                placeholder="Enter ZIP code or City, State"
                className={styles.searchInput}
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
              />
              <button className={styles.nearMeBtn}>
                Near Me
              </button>
            </div>
            <Link 
              href={`/community/events${locationQuery ? `?location=${encodeURIComponent(locationQuery)}` : ''}`}
              className={styles.searchBtn}
            >
              Find Events
              <Icons.arrowRight size={18} />
            </Link>
          </div>

          <div className={styles.quickFilters}>
            {CATEGORIES.slice(0, 5).map(cat => (
              <Link 
                key={cat.slug} 
                href={`/community/events?type=${cat.slug}`}
                className={styles.quickFilterBtn}
              >
                <span className={styles.quickFilterIcon}>{cat.icon}</span>
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Featured Events</h2>
            <Link href="/community/events" className={styles.viewAllLink}>
              View All Events
              <Icons.arrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p>Loading events...</p>
            </div>
          ) : (
            <div className={styles.eventsGrid}>
              {featuredEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  featured 
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories Grid */}
      <section className={styles.sectionAlt}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Browse by Category</h2>
          <div className={styles.categoriesGrid}>
            {CATEGORIES.map(cat => (
              <Link 
                key={cat.slug} 
                href={`/community/events?type=${cat.slug}`}
                className={styles.categoryCard}
              >
                <div className={styles.categoryIconWrapper}>
                  {cat.icon}
                </div>
                <h3 className={styles.categoryName}>{cat.name}</h3>
                <p className={styles.categoryDescription}>{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Community Teaser */}
      <section className={styles.section}>
        <div className={`${styles.container} ${styles.comingSoonContainer}`}>
          <div className={styles.comingSoonContent}>
            <div className={styles.comingSoonBadge}>Coming Soon</div>
            <h2 className={styles.sectionTitle}>Join the Club</h2>
            <p className={styles.comingSoonText}>
              We're building a comprehensive community hub for enthusiasts. Soon you'll be able to:
            </p>
            <ul className={styles.featureList}>
              <li className={styles.featureItem}>
                <div className={styles.checkIcon}><Icons.users size={14} /></div>
                Join and create car clubs
              </li>
              <li className={styles.featureItem}>
                <div className={styles.checkIcon}><Icons.flag size={14} /></div>
                Share your build progress
              </li>
              <li className={styles.featureItem}>
                <div className={styles.checkIcon}><Icons.mapPin size={14} /></div>
                Connect with local enthusiasts
              </li>
              <li className={styles.featureItem}>
                <div className={styles.checkIcon}><Icons.trophy size={14} /></div>
                Organize your own events
              </li>
            </ul>
            <Link href="/join" className={styles.ctaButton}>
              Join AutoRev to Get Notified
            </Link>
          </div>
        </div>
      </section>

      {/* Submit CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>Know of an event we're missing?</h2>
          <p className={styles.ctaSubtitle}>Help the community discover great car events in their area</p>
          <Link href="/events/submit" className={styles.submitBtn}>
            Submit an Event
          </Link>
        </div>
      </section>
    </div>
  );
}
