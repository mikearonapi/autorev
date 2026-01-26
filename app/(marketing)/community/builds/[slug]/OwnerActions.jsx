'use client';

/**
 * Owner Actions for Build Detail Page
 * 
 * Shows edit/manage buttons when the authenticated user is viewing their own build.
 * Edit redirects to the UpgradeCenter (single source of truth) rather than inline editing.
 */

import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/providers/AuthProvider';

import styles from './OwnerActions.module.css';

export default function OwnerActions({ postId, ownerId, buildSlug, carSlug, userBuildId }) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const isOwner = isAuthenticated && user?.id === ownerId;

  // Redirect to UpgradeCenter with the build loaded
  const handleEditClick = () => {
    // Navigate to tuning shop with the build pre-loaded
    // The tuning shop page reads ?build=<id> or ?plan=<carSlug> from URL params
    const url = userBuildId 
      ? `/tuning-shop?build=${userBuildId}`
      : carSlug 
        ? `/tuning-shop?plan=${carSlug}`
        : '/tuning-shop';
    
    router.push(url);
  };

  if (!isOwner) {
    return null;
  }

  return (
    <div className={styles.ownerActions}>
      <button 
        className={styles.editBtn}
        onClick={handleEditClick}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Edit in Tuning Shop
      </button>
      <span className={styles.ownerBadge}>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
        Your Build
      </span>
    </div>
  );
}
