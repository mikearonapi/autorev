'use client';

/**
 * Photo Gallery with Reordering - PWA-friendly photo management
 *
 * This component uses a mode-based approach for managing photos:
 * - Default: Clean photo display without action buttons
 * - Hero mode: Tap a photo to set it as the hero image
 * - Reorder mode: Use arrows to reorder photos
 * - Delete mode: Tap a photo to delete it
 *
 * @module components/garage/SortablePhotoGallery
 */

import { useMemo, useCallback, useState } from 'react';

import Image from 'next/image';

import { Icons } from '@/components/ui/Icons';

import styles from './SortablePhotoGallery.module.css';

// Edit modes for the photo gallery
const EDIT_MODES = {
  NONE: null,
  HERO: 'hero',
  REORDER: 'reorder',
  DELETE: 'delete',
};

/**
 * Format duration in seconds to mm:ss
 */
function formatDuration(seconds) {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Mode Selector - Toggle between edit modes
 */
function ModeSelector({ activeMode, onModeChange, hasMultiplePhotos }) {
  const modes = [
    { id: EDIT_MODES.HERO, label: 'Select Hero', icon: Icons.star },
    {
      id: EDIT_MODES.REORDER,
      label: 'Reorder',
      icon: Icons.chevronUp,
      disabled: !hasMultiplePhotos,
    },
    { id: EDIT_MODES.DELETE, label: 'Delete', icon: Icons.x },
  ];

  return (
    <div className={styles.modeSelector}>
      {modes.map(({ id, label, icon: Icon, disabled }) => (
        <button
          key={id}
          type="button"
          className={`${styles.modeBtn} ${activeMode === id ? styles.modeBtnActive : ''} ${disabled ? styles.modeBtnDisabled : ''}`}
          onClick={() => onModeChange(activeMode === id ? EDIT_MODES.NONE : id)}
          disabled={disabled}
          aria-pressed={activeMode === id}
        >
          <Icon size={14} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Photo Item - Individual photo with mode-specific interactions
 */
function PhotoItem({
  item,
  index,
  totalCount,
  nextItemIsStock,
  onMoveUp,
  onMoveDown,
  onSetPrimary,
  onDelete,
  onHideStockPhoto,
  isHero,
  readOnly,
  editMode,
}) {
  const isStockPhoto = item.isStockPhoto === true;
  const isVideo = item.media_type === 'video';
  const isFirst = index === 0;
  const isLast = index === totalCount - 1;

  // Stock photos can't be moved
  const canMoveUp = !isStockPhoto && !isFirst && !readOnly;
  const canMoveDown = !isStockPhoto && !isLast && !readOnly;
  // Don't allow moving down if the next item is a stock photo
  const actualCanMoveDown = canMoveDown && !nextItemIsStock;

  // Handle photo tap based on active mode
  const handlePhotoTap = useCallback(() => {
    if (readOnly || !editMode) return;

    if (editMode === EDIT_MODES.HERO && !isVideo && !isStockPhoto && onSetPrimary) {
      onSetPrimary(item.id);
    } else if (editMode === EDIT_MODES.DELETE) {
      if (isStockPhoto && onHideStockPhoto) {
        onHideStockPhoto();
      } else if (!isStockPhoto && onDelete) {
        onDelete(item.id);
      }
    }
  }, [
    editMode,
    readOnly,
    isVideo,
    isStockPhoto,
    onSetPrimary,
    onDelete,
    onHideStockPhoto,
    item.id,
  ]);

  // Determine if this photo is selectable in current mode
  const isSelectable =
    editMode === EDIT_MODES.HERO
      ? !isVideo && !isStockPhoto
      : editMode === EDIT_MODES.DELETE
        ? true
        : false;

  return (
    <div
      className={`${styles.photoItem} ${isHero ? styles.heroItem : ''} ${isVideo ? styles.videoItem : ''} ${isStockPhoto ? styles.stockItem : ''} ${editMode && isSelectable ? styles.selectableItem : ''}`}
      onClick={handlePhotoTap}
      role={editMode && isSelectable ? 'button' : undefined}
      tabIndex={editMode && isSelectable ? 0 : undefined}
      onKeyDown={
        editMode && isSelectable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePhotoTap();
              }
            }
          : undefined
      }
    >
      {/* Reorder Controls - Only visible in reorder mode */}
      {editMode === EDIT_MODES.REORDER && !isStockPhoto && (
        <div className={styles.reorderControls}>
          <button
            type="button"
            className={`${styles.reorderBtn} ${!canMoveUp ? styles.disabled : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (canMoveUp) onMoveUp(index);
            }}
            disabled={!canMoveUp}
            aria-label="Move photo up"
          >
            <Icons.chevronUp size={14} />
          </button>
          <button
            type="button"
            className={`${styles.reorderBtn} ${!actualCanMoveDown ? styles.disabled : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (actualCanMoveDown) onMoveDown(index);
            }}
            disabled={!actualCanMoveDown}
            aria-label="Move photo down"
          >
            <Icons.chevronDown size={14} />
          </button>
        </div>
      )}

      {/* Photo/Video Content */}
      <div className={styles.photoContent}>
        {isVideo ? (
          <div className={styles.videoThumbnail}>
            {item.video_thumbnail_url ? (
              <Image
                src={item.video_thumbnail_url}
                alt={item.caption || 'Video'}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 640px) 50vw, 180px"
              />
            ) : (
              <div className={styles.videoPlaceholder}>
                <Icons.play size={24} />
              </div>
            )}
            <div className={styles.playOverlay}>
              <Icons.play size={20} />
            </div>
            {item.duration_seconds && (
              <span className={styles.duration}>{formatDuration(item.duration_seconds)}</span>
            )}
          </div>
        ) : (
          <Image
            src={item.blob_url || item.thumbnail_url}
            alt={item.caption || 'Photo'}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 640px) 50vw, 180px"
          />
        )}

        {/* Hero Badge */}
        {isHero && !isVideo && !isStockPhoto && (
          <span className={styles.heroBadge}>
            <Icons.star size={10} />
            Hero
          </span>
        )}

        {/* Stock Photo Badge */}
        {isStockPhoto && <span className={styles.stockBadge}>Stock</span>}

        {/* Position indicator - only in reorder mode */}
        {editMode === EDIT_MODES.REORDER && !isStockPhoto && (
          <span className={styles.positionBadge}>{index + 1}</span>
        )}

        {/* Mode-specific overlay indicators */}
        {editMode === EDIT_MODES.HERO && !isVideo && !isStockPhoto && !isHero && (
          <div className={styles.modeOverlay}>
            <Icons.star size={20} />
            <span>Tap to set as Hero</span>
          </div>
        )}
        {editMode === EDIT_MODES.DELETE && (
          <div className={`${styles.modeOverlay} ${styles.deleteOverlay}`}>
            <Icons.x size={20} />
            <span>{isStockPhoto ? 'Tap to hide' : 'Tap to delete'}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Photo Gallery - Main component with mode-based editing
 *
 * @param {Object} props
 * @param {Array} props.images - Array of image objects with id, blob_url, is_primary, etc.
 * @param {Function} props.onReorder - Called with new order array after reorder (array of ids)
 * @param {Function} props.onSetPrimary - Called when user sets a photo as hero
 * @param {Function} props.onDelete - Called when user deletes a photo
 * @param {Function} props.onHideStockPhoto - Called when user hides the stock photo
 * @param {boolean} props.readOnly - Disable editing (no reorder, no actions)
 */
export default function SortablePhotoGallery({
  images = [],
  onReorder,
  onSetPrimary,
  onDelete,
  onHideStockPhoto,
  readOnly = false,
}) {
  const [editMode, setEditMode] = useState(EDIT_MODES.NONE);

  // Find which image is the hero (is_primary)
  const heroImageId = useMemo(
    () => images.find((img) => img.is_primary && img.media_type !== 'video')?.id,
    [images]
  );

  // Count non-stock photos for display
  const userPhotoCount = useMemo(() => images.filter((img) => !img.isStockPhoto).length, [images]);

  // Move photo up one position
  const handleMoveUp = useCallback(
    (index) => {
      if (index <= 0 || !onReorder) return;

      const newImages = [...images];
      // Swap with the item above
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      // Extract IDs and call reorder
      const newImageIds = newImages.map((img) => img.id);
      onReorder(newImageIds);
    },
    [images, onReorder]
  );

  // Move photo down one position
  const handleMoveDown = useCallback(
    (index) => {
      if (index >= images.length - 1 || !onReorder) return;

      const newImages = [...images];
      // Swap with the item below
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      // Extract IDs and call reorder
      const newImageIds = newImages.map((img) => img.id);
      onReorder(newImageIds);
    },
    [images, onReorder]
  );

  // Wrap callbacks to exit mode after action (for hero and delete)
  const handleSetPrimary = useCallback(
    (imageId) => {
      if (onSetPrimary) {
        onSetPrimary(imageId);
        setEditMode(EDIT_MODES.NONE);
      }
    },
    [onSetPrimary]
  );

  const handleDelete = useCallback(
    (imageId) => {
      if (onDelete) {
        onDelete(imageId);
        // Don't exit delete mode - user might want to delete multiple
      }
    },
    [onDelete]
  );

  const handleHideStockPhoto = useCallback(() => {
    if (onHideStockPhoto) {
      onHideStockPhoto();
      setEditMode(EDIT_MODES.NONE);
    }
  }, [onHideStockPhoto]);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className={styles.gallery}>
      {/* Mode Selector - Only show when not in readOnly mode */}
      {!readOnly && (
        <ModeSelector
          activeMode={editMode}
          onModeChange={setEditMode}
          hasMultiplePhotos={userPhotoCount > 1}
        />
      )}

      {/* Mode Instructions */}
      {editMode && (
        <div className={styles.modeInstructions}>
          {editMode === EDIT_MODES.HERO && <p>Tap a photo to set it as your hero image</p>}
          {editMode === EDIT_MODES.REORDER && <p>Use the arrows to reorder your photos</p>}
          {editMode === EDIT_MODES.DELETE && <p>Tap a photo to delete it</p>}
        </div>
      )}

      <div className={styles.photoGrid}>
        {images.map((item, index) => (
          <PhotoItem
            key={item.id}
            item={item}
            index={index}
            totalCount={images.length}
            nextItemIsStock={images[index + 1]?.isStockPhoto === true}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onSetPrimary={handleSetPrimary}
            onDelete={handleDelete}
            onHideStockPhoto={handleHideStockPhoto}
            isHero={item.id === heroImageId}
            readOnly={readOnly}
            editMode={editMode}
          />
        ))}
      </div>
    </div>
  );
}
