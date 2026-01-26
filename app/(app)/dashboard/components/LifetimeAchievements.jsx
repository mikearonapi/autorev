'use client';

/**
 * LifetimeAchievements Component
 * 
 * Displays real metrics for each core feature area:
 * - AL conversations
 * - Community shares
 * - Data logs
 * - Garage vehicles
 * - Profile completion (questionnaire)
 */

import Image from 'next/image';
import Link from 'next/link';

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

// Profile icon component
const ProfileIcon = ({ size = 18 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// Achievement configuration - matches core app features
// Order matches ConcentricRings: AL (outer) → Community → Data → Garage (inner) + Profile
// Colors use CSS custom properties from styles/tokens/colors.css
const ACHIEVEMENT_CONFIG = {
  al: { 
    Icon: ALMascotIcon, 
    colorVar: '--color-accent-purple',
    label: 'AL',
    emptyLabel: 'Ask AL',
    href: '/al',
    achievementType: 'al_conversations',
  },
  community: { 
    Icon: GridIcon, 
    colorVar: '--color-accent-blue',
    label: 'Community',
    emptyLabel: 'Share build',
    href: '/community',
    achievementType: 'community_posts',
  },
  data: { 
    Icon: DataIcon, 
    colorVar: '--color-accent-teal',
    label: 'Log Data',
    emptyLabel: 'Log data',
    href: '/data',
    achievementType: 'dyno_runs',
  },
  garage: { 
    Icon: GarageIcon, 
    colorVar: '--color-accent-lime',
    label: 'Garage',
    emptyLabel: 'Add car',
    href: '/garage',
    achievementType: 'vehicle_count',
  },
  profile: {
    Icon: ProfileIcon,
    colorVar: '--color-accent-pink',
    label: 'Profile',
    emptyLabel: 'Complete profile',
    href: '/questionnaire',
    achievementType: 'profile_completion',
  },
};

export default function LifetimeAchievements({ achievements = [], profileCompleteness = 0 }) {
  // Map achievements array to lookup by type
  const achievementMap = {};
  for (const a of achievements) {
    achievementMap[a.achievement_type] = a;
  }
  
  // Add profile completion as a synthetic achievement
  if (profileCompleteness > 0) {
    achievementMap['profile_completion'] = {
      achievement_type: 'profile_completion',
      value: profileCompleteness,
      display_value: `${profileCompleteness}%`,
    };
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
              style={{ '--achievement-color': `var(${config.colorVar})` }}
            >
              <div 
                className={`${styles.achievementIcon} ${hasValue ? styles.achievementIconActive : ''}`}
              >
                <IconComponent size={18} />
              </div>
              <span 
                className={`${styles.achievementValue} ${hasValue ? styles.achievementValueActive : ''}`}
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
