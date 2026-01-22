'use client';

/**
 * LifetimeAchievements Component
 * 
 * Displays real metrics for each core feature area:
 * - AL conversations
 * - Community shares
 * - Data logs
 * - Garage vehicles
 */

import Link from 'next/link';
import Image from 'next/image';
import { UI_IMAGES } from '@/lib/images';
import { 
  GarageIcon,
  DataIcon,
  GridIcon,
} from './DashboardIcons';
import styles from './LifetimeAchievements.module.css';

// AL Mascot icon component
const ALMascotIcon = ({ size = 18 }) => (
  <Image
    src={UI_IMAGES.alMascotFull}
    alt="AL"
    width={size}
    height={size}
    style={{ 
      objectFit: 'cover',
      borderRadius: '50%',
    }}
    quality={90}
  />
);

// Achievement configuration - matches core app features
// Order matches ConcentricRings: AL (outer) → Community → Data → Garage (inner)
const ACHIEVEMENT_CONFIG = {
  al: { 
    Icon: ALMascotIcon, 
    color: '#a855f7',
    label: 'AL',
    emptyLabel: 'Ask AL',
    href: '/al',
    achievementType: 'al_conversations',
  },
  community: { 
    Icon: GridIcon, 
    color: '#3b82f6',
    label: 'Community',
    emptyLabel: 'Share build',
    href: '/community',
    achievementType: 'community_posts',
  },
  data: { 
    Icon: DataIcon, 
    color: '#10b981',
    label: 'Log Data',
    emptyLabel: 'Log data',
    href: '/data',
    achievementType: 'dyno_runs',
  },
  garage: { 
    Icon: GarageIcon, 
    color: '#d4ff00',
    label: 'Garage',
    emptyLabel: 'Add car',
    href: '/garage',
    achievementType: 'vehicle_count',
  },
};

export default function LifetimeAchievements({ achievements = [] }) {
  // Map achievements array to lookup by type
  const achievementMap = {};
  for (const a of achievements) {
    achievementMap[a.achievement_type] = a;
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Lifetime Achievements</h3>
      <div className={styles.achievementsGrid}>
        {Object.entries(ACHIEVEMENT_CONFIG).map(([key, config]) => {
          const achievement = achievementMap[config.achievementType];
          const IconComponent = config.Icon;
          const hasValue = achievement && achievement.value > 0;
          
          return (
            <Link 
              key={key} 
              href={config.href}
              className={`${styles.achievementCard} ${!hasValue ? styles.achievementCardEmpty : ''}`}
            >
              <div 
                className={styles.achievementIcon}
                style={{ 
                  background: hasValue ? `${config.color}20` : 'rgba(255,255,255,0.04)',
                  color: hasValue ? config.color : 'var(--color-text-tertiary, #64748b)',
                }}
              >
                <IconComponent size={18} />
              </div>
              <span 
                className={styles.achievementValue} 
                style={{ color: hasValue ? config.color : 'var(--color-text-tertiary)' }}
              >
                {hasValue ? achievement.display_value : '—'}
              </span>
              <span className={styles.achievementLabel}>
                {hasValue ? config.label : config.emptyLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
