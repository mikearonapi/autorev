'use client';

/**
 * Content Inventory Component
 * 
 * Displays content stats with visual indicators.
 * Uses SVG icons (no emojis).
 */

import styles from './ContentInventory.module.css';

// SVG Icons
const CarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" />
    <circle cx="6.5" cy="16.5" r="2.5" />
    <circle cx="16.5" cy="16.5" r="2.5" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
    <line x1="16" x2="16" y1="2" y2="6"/>
    <line x1="8" x2="8" y1="2" y2="6"/>
    <line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
);

const VideoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="15" x="2" y="4" rx="2"/>
    <polygon points="10,9 16,12 10,15"/>
  </svg>
);

const LightbulbIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
    <path d="M9 18h6"/>
    <path d="M10 22h4"/>
  </svg>
);

const GearIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const BookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
  </svg>
);

function ContentCard({ label, value, icon, color = '#3b82f6' }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardIcon} style={{ color }}>{icon}</div>
      <div className={styles.cardContent}>
        <span className={styles.cardValue}>{(value || 0).toLocaleString()}</span>
        <span className={styles.cardLabel}>{label}</span>
      </div>
    </div>
  );
}

export function ContentInventory({ content, loading = false }) {
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Content Inventory</h3>
        </div>
        <div className={styles.loading}>Loading content stats...</div>
      </div>
    );
  }
  
  if (!content) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Content Inventory</h3>
        </div>
        <div className={styles.emptyState}>No content data available</div>
      </div>
    );
  }
  
  // Ensure safe numeric values
  const safeNum = (val) => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  };
  
  const vehiclesCount = safeNum(content.vehicles);
  const eventsCount = safeNum(content.events);
  const videosCount = safeNum(content.videos);
  const insightsCount = safeNum(content.insights);
  const partsCount = safeNum(content.parts);
  const kbChunksCount = safeNum(content.kbChunks);
  const vehiclesWithImages = safeNum(content.vehiclesWithImages);
  const vehiclesWithEmbeddings = safeNum(content.vehiclesWithEmbeddings);
  const partsWithFitment = safeNum(content.partsWithFitment);
  const upcomingEvents = safeNum(content.upcomingEvents);
  const pendingVideos = safeNum(content.pendingVideos);
  const forumThreads = safeNum(content.forumThreads);
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Content Inventory</h3>
      </div>
      
      <div className={styles.grid}>
        <ContentCard 
          label="Vehicles"
          value={vehiclesCount}
          icon={<CarIcon />}
          color="#3b82f6"
        />
        <ContentCard 
          label="Events"
          value={eventsCount}
          icon={<CalendarIcon />}
          color="#8b5cf6"
        />
        <ContentCard 
          label="Videos"
          value={videosCount}
          icon={<VideoIcon />}
          color="#ef4444"
        />
        <ContentCard 
          label="Insights"
          value={insightsCount}
          icon={<LightbulbIcon />}
          color="#f59e0b"
        />
        <ContentCard 
          label="Parts"
          value={partsCount}
          icon={<GearIcon />}
          color="#22c55e"
        />
        <ContentCard 
          label="KB Chunks"
          value={kbChunksCount}
          icon={<BookIcon />}
          color="#06b6d4"
        />
      </div>
      
      {/* Coverage Stats */}
      <div className={styles.coverage}>
        <h4 className={styles.sectionTitle}>Data Coverage</h4>
        <div className={styles.coverageGrid}>
          <div className={styles.coverageItem}>
            <span className={styles.coverageLabel}>Vehicles w/ Images</span>
            <div className={styles.coverageBar}>
              <div 
                className={styles.coverageFill}
                style={{ 
                  width: `${vehiclesCount > 0 ? (vehiclesWithImages / vehiclesCount) * 100 : 0}%` 
                }}
              />
            </div>
            <span className={styles.coverageValue}>
              {vehiclesWithImages}/{vehiclesCount}
            </span>
          </div>
          <div className={styles.coverageItem}>
            <span className={styles.coverageLabel}>Vehicles w/ Embeddings</span>
            <div className={styles.coverageBar}>
              <div 
                className={styles.coverageFill}
                style={{ 
                  width: `${vehiclesCount > 0 ? (vehiclesWithEmbeddings / vehiclesCount) * 100 : 0}%` 
                }}
              />
            </div>
            <span className={styles.coverageValue}>
              {vehiclesWithEmbeddings}/{vehiclesCount}
            </span>
          </div>
          <div className={styles.coverageItem}>
            <span className={styles.coverageLabel}>Parts w/ Category</span>
            <div className={styles.coverageBar}>
              <div 
                className={styles.coverageFill}
                style={{ 
                  width: `${partsCount > 0 ? (partsWithFitment / partsCount) * 100 : 100}%` 
                }}
              />
            </div>
            <span className={styles.coverageValue}>
              {partsWithFitment || partsCount}/{partsCount}
            </span>
          </div>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className={styles.quickStats}>
        <div className={styles.quickStat}>
          <span className={styles.quickValue}>{upcomingEvents.toLocaleString()}</span>
          <span className={styles.quickLabel}>Upcoming Events</span>
        </div>
        <div className={styles.quickStat}>
          <span className={styles.quickValue}>{pendingVideos}</span>
          <span className={styles.quickLabel}>Pending Videos</span>
        </div>
        <div className={styles.quickStat}>
          <span className={styles.quickValue}>{forumThreads}</span>
          <span className={styles.quickLabel}>Forum Threads</span>
        </div>
      </div>
    </div>
  );
}

export default ContentInventory;
