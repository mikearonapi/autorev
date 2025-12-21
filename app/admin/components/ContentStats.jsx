'use client';

/**
 * ContentStats Component
 * 
 * Horizontal bar chart showing content library coverage.
 */

import styles from './ContentStats.module.css';
import { CarIcon, CalendarIcon, WrenchIcon, VideoIcon } from './Icons';

const CONTENT_CONFIG = {
  vehicles: { icon: CarIcon, label: 'Vehicles', target: 100, color: '#3b82f6' },
  events: { icon: CalendarIcon, label: 'Events', target: 50, color: '#8b5cf6' },
  parts: { icon: WrenchIcon, label: 'Parts', target: 200, color: '#06b6d4' },
  videos: { icon: VideoIcon, label: 'Videos', target: 100, color: '#ef4444' },
};

export function ContentStats({ content, title = 'Content Library' }) {
  if (!content) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.emptyState}>No content data available</div>
      </div>
    );
  }
  
  const items = Object.entries(CONTENT_CONFIG).map(([key, config]) => {
    const count = content[key] || 0;
    const percentage = Math.min(Math.round((count / config.target) * 100), 100);
    
    return {
      key,
      ...config,
      count,
      percentage,
    };
  });
  
  // Total content items
  const totalItems = items.reduce((sum, item) => sum + item.count, 0);
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <span className={styles.totalBadge}>{totalItems.toLocaleString()} items</span>
      </div>
      
      <div className={styles.list}>
        {items.map((item) => {
          const IconComponent = item.icon;
          return (
            <div key={item.key} className={styles.item}>
              <div className={styles.itemHeader}>
                <div className={styles.itemIcon} style={{ color: item.color }}>
                  <IconComponent size={16} />
                </div>
                <span className={styles.itemLabel}>{item.label}</span>
                <span className={styles.itemCount}>{item.count.toLocaleString()}</span>
              </div>
              
              <div className={styles.barContainer}>
                <div 
                  className={styles.bar}
                  style={{ 
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
                <div className={styles.barTarget} />
              </div>
              
              <div className={styles.itemMeta}>
                <span className={styles.percentage}>{item.percentage}% of target</span>
                <span className={styles.target}>(target: {item.target})</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ContentStats;
