'use client';

/**
 * Share Build Button Component
 * 
 * Controls community sharing for builds. Shows different states:
 * - Not shared: Shows "Share" button
 * - Shared: Shows "Shared" indicator with checkmark
 * 
 * When clicked, opens ShareBuildModal for first-time share
 * or toggles visibility for already-shared builds.
 */

import React, { useState, useCallback } from 'react';
import { Icons } from '@/components/ui/Icons';
import ShareBuildModal from '@/components/ShareBuildModal';
import styles from './ShareBuildButton.module.css';

export default function ShareBuildButton({
  build,
  car,
  isShared = false,
  communitySlug = null,
  existingImages = [],
  onShareStatusChange,
  className = '',
}) {
  const [showModal, setShowModal] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleClick = useCallback(async () => {
    if (isShared) {
      // Already shared - toggle off (unshare) or open modal to edit
      setShowModal(true);
    } else {
      // Not shared - open modal to share
      setShowModal(true);
    }
  }, [isShared]);

  const handleClose = useCallback(() => {
    setShowModal(false);
  }, []);

  // Handle share status change from modal
  const handleShareChange = useCallback(async (newIsShared, shareData) => {
    if (onShareStatusChange) {
      await onShareStatusChange(newIsShared, shareData);
    }
  }, [onShareStatusChange]);

  return (
    <>
      <button
        className={`${styles.shareButton} ${isShared ? styles.shared : ''} ${className}`}
        onClick={handleClick}
        disabled={isToggling}
        title={isShared ? 'Shared to Community' : 'Share to Community'}
      >
        {isToggling ? (
          <span className={styles.spinner} />
        ) : isShared ? (
          <>
            <Icons.check size={14} />
            <span>Shared</span>
          </>
        ) : (
          <>
            <Icons.share size={14} />
            <span>Share</span>
          </>
        )}
      </button>

      <ShareBuildModal
        isOpen={showModal}
        onClose={handleClose}
        build={build}
        carSlug={car?.slug}
        carName={car?.name}
        existingImages={existingImages}
        isShared={isShared}
        communitySlug={communitySlug}
        onShareChange={handleShareChange}
      />
    </>
  );
}
