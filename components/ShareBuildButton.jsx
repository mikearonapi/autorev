'use client';

/**
 * Share Build Button Component
 *
 * Controls community sharing for builds. Shows different states:
 * - Not shared: Shows "Share" button
 * - Shared: Shows "Shared" indicator with checkmark
 *
 * When clicked, opens ShareBuildModal for first-time share
 * or opens edit modal for already-shared builds.
 */

import React, { useState, useCallback } from 'react';

import ShareBuildModal from '@/components/ShareBuildModal';
import { Icons } from '@/components/ui/Icons';
import { useLinkedPost } from '@/hooks/useCommunityData';

import styles from './ShareBuildButton.module.css';

export default function ShareBuildButton({
  build,
  vehicle, // Vehicle data to link community post to vehicle
  car,
  existingImages = [],
  onShareStatusChange,
  className = '',
}) {
  const [showModal, setShowModal] = useState(false);

  // Fetch linked community post data for this build
  const {
    data: linkedCommunityPost,
    isLoading: checkingCommunityPost,
    refetch: refetchLinkedPost,
  } = useLinkedPost(build?.id, { enabled: !!build?.id });

  // Derive shared state from linked post data
  const isShared = !!linkedCommunityPost && linkedCommunityPost.is_published !== false;

  const handleShareButtonClick = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleClose = useCallback(() => {
    setShowModal(false);
    // Refetch linked post data in case it was updated
    refetchLinkedPost();
  }, [refetchLinkedPost]);

  // Handle share status change from modal
  const handleShareChange = useCallback(
    async (newIsShared, shareData) => {
      // Refetch to get updated linked post data
      await refetchLinkedPost();
      if (onShareStatusChange) {
        await onShareStatusChange(newIsShared, shareData);
      }
    },
    [onShareStatusChange, refetchLinkedPost]
  );

  return (
    <>
      <button
        className={`${styles.shareButton} ${isShared ? styles.shared : ''} ${className}`}
        onClick={handleShareButtonClick}
        disabled={checkingCommunityPost}
        title={isShared ? 'Edit Community Post' : 'Share to Community'}
      >
        {checkingCommunityPost ? (
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
        vehicle={vehicle}
        car={car}
        carName={car?.name}
        existingImages={existingImages}
        linkedCommunityPost={linkedCommunityPost}
        onShareChange={handleShareChange}
      />
    </>
  );
}
