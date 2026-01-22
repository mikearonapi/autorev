'use client';

/**
 * ImprovementActions Component
 * 
 * Shows ways users can earn more points:
 * - Garage: Add vehicles, upload photos, add modifications
 * - Data: Log track times, dyno runs
 * - Community: Share builds, comment, like posts
 * - AL: Ask questions
 * 
 * Points match the actual points system in lib/pointsService.js
 */

import Link from 'next/link';
import styles from './ImprovementActions.module.css';

// Icons for each action type
const Icons = {
  garage: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  photo: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  share: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  ),
  data: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  comment: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
  ),
  heart: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  al: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  wrench: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  tool: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  ),
  arrow: ({ size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
};

// Points-earning actions configuration - matches lib/pointsService.js
const EARN_POINTS_ACTIONS = [
  {
    id: 'add-vehicle',
    Icon: Icons.garage,
    color: '#d4ff00', // lime
    label: 'Add a vehicle',
    points: 100,
    href: '/garage',
    category: 'Garage',
  },
  {
    id: 'share-build',
    Icon: Icons.share,
    color: '#3b82f6', // blue
    label: 'Share your build',
    points: 100,
    href: '/community',
    category: 'Community',
  },
  {
    id: 'log-track-time',
    Icon: Icons.data,
    color: '#10b981', // teal
    label: 'Log track time',
    points: 75,
    href: '/data',
    category: 'Data',
  },
  {
    id: 'log-dyno',
    Icon: Icons.data,
    color: '#10b981', // teal
    label: 'Log dyno run',
    points: 75,
    href: '/data',
    category: 'Data',
  },
  {
    id: 'add-modification',
    Icon: Icons.wrench,
    color: '#d4ff00', // lime
    label: 'Add a modification',
    points: 50,
    href: '/garage/my-parts',
    category: 'Garage',
  },
  {
    id: 'upload-photo',
    Icon: Icons.photo,
    color: '#d4ff00', // lime
    label: 'Upload a photo',
    points: 25,
    href: '/garage/my-photos',
    category: 'Garage',
  },
  {
    id: 'add-part-details',
    Icon: Icons.tool,
    color: '#d4ff00', // lime
    label: 'Add part details',
    points: 25,
    href: '/garage/my-specs',
    category: 'Garage',
  },
  {
    id: 'ask-al',
    Icon: Icons.al,
    color: '#a855f7', // purple
    label: 'Ask AL a question',
    points: 25,
    href: '/al',
    category: 'AL',
  },
  {
    id: 'post-comment',
    Icon: Icons.comment,
    color: '#3b82f6', // blue
    label: 'Post a comment',
    points: 10,
    href: '/community',
    category: 'Community',
  },
  {
    id: 'like-post',
    Icon: Icons.heart,
    color: '#3b82f6', // blue
    label: 'Like a post',
    points: 5,
    href: '/community',
    category: 'Community',
  },
];

export default function ImprovementActions({
  actions = null, // If null, shows all earn points actions
  title = "Earn More Points",
  showPoints = true, // Points shown by default
}) {
  // Use provided actions or default to all earn points actions
  const displayActions = actions || EARN_POINTS_ACTIONS;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
      </div>
      
      <div className={styles.actionsList}>
        {displayActions.map((action) => {
          const IconComponent = action.Icon;
          
          return (
            <Link
              key={action.id}
              href={action.href}
              className={styles.actionCard}
            >
              <div 
                className={styles.actionIcon}
                style={{ 
                  background: `${action.color}18`,
                  color: action.color,
                }}
              >
                <IconComponent size={16} />
              </div>
              
              <span className={styles.actionLabel}>{action.label}</span>
              
              <div className={styles.actionMeta}>
                {showPoints && action.points > 0 && (
                  <span 
                    className={styles.actionPoints}
                    style={{ color: '#10b981' }}
                  >
                    +{action.points}
                  </span>
                )}
                <span className={styles.actionArrow}>
                  <Icons.arrow size={12} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
