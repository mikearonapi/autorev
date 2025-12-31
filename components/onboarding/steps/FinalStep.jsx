'use client';

import { useRouter } from 'next/navigation';
import styles from './FinalStep.module.css';

/**
 * Action buttons for the final step
 * Each takes the user directly to that feature
 */
const ACTION_BUTTONS = [
  {
    id: 'browse',
    emoji: '🔍',
    label: 'Browse Cars',
    description: 'Explore specs & reviews',
    href: '/browse-cars',
  },
  {
    id: 'selector',
    emoji: '🎯',
    label: 'Find My Match',
    description: 'Get personalized picks',
    href: '/car-selector',
  },
  {
    id: 'garage',
    emoji: '🚗',
    label: 'My Garage',
    description: 'Add & track my cars',
    href: '/garage?add=true',
  },
  {
    id: 'tuning',
    emoji: '🔧',
    label: 'Tuning Shop',
    description: 'Plan my build',
    href: '/tuning-shop',
  },
  {
    id: 'community',
    emoji: '📍',
    label: 'Events',
    description: 'Find local meets',
    href: '/community',
  },
  {
    id: 'learn',
    emoji: '📚',
    label: 'Learn',
    description: 'How things work',
    href: '/encyclopedia',
  },
];

/**
 * FinalStep Component
 * Final step: "You're all set!" with action buttons for each feature
 * 
 * @param {Object} props
 * @param {string} props.className - CSS class name for animation
 * @param {Function} props.onComplete - Called when user selects an action
 */
export default function FinalStep({ 
  className,
  onComplete,
}) {
  const router = useRouter();

  const handleAction = (href) => {
    onComplete?.();
    router.push(href);
  };

  return (
    <div className={`${className} ${styles.container}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>You're all set!</h2>
        <p className={styles.subtitle}>What would you like to do first?</p>
      </div>
      
      <div className={styles.actionGrid}>
        {ACTION_BUTTONS.map((action) => (
          <button
            key={action.id}
            className={styles.actionButton}
            onClick={() => handleAction(action.href)}
          >
            <span className={styles.actionEmoji}>{action.emoji}</span>
            <div className={styles.actionContent}>
              <span className={styles.actionLabel}>{action.label}</span>
              <span className={styles.actionDesc}>{action.description}</span>
            </div>
            <svg className={styles.actionArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
