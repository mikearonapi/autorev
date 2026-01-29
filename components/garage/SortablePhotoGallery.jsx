'use client';

/**
 * Photo Gallery with Reordering - PWA-friendly photo management
 *
 * This component allows users to reorder their photos using simple up/down
 * arrow buttons, which work reliably on touch devices without conflicting
 * with scroll behavior.
 *
 * @module components/garage/SortablePhotoGallery
 */

import { useMemo, useCallback } from 'react';

import Image from 'next/image';

import { Icons } from '@/components/ui/Icons';

import styles from './SortablePhotoGallery.module.css';

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
 * Photo Item - Individual photo with reorder controls
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

  return (
    <div
      className={`${styles.photoItem} ${isHero ? styles.heroItem : ''} ${isVideo ? styles.videoItem : ''} ${isStockPhoto ? styles.stockItem : ''}`}
    >
      {/* Reorder Controls - Only visible when not in readOnly mode and not a stock photo */}
      {!readOnly && !isStockPhoto && (
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

        {/* Position indicator - not shown for stock photos */}
        {!readOnly && !isStockPhoto && <span className={styles.positionBadge}>{index + 1}</span>}
      </div>

      {/* Actions */}
      {!readOnly && (
        <div className={styles.actions}>
          {/* Set as Hero button - not available for stock photos or videos */}
          {!isHero && !isVideo && !isStockPhoto && onSetPrimary && (
            <button
              type="button"
              className={styles.setHeroBtn}
              onClick={(e) => {
                e.stopPropagation();
                onSetPrimary(item.id);
              }}
              title="Set as hero image"
            >
              <Icons.star size={14} />
            </button>
          )}
          {/* Delete button - for stock photos, this hides instead of deletes */}
          {isStockPhoto
            ? onHideStockPhoto && (
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onHideStockPhoto();
                  }}
                  title="Hide stock photo"
                >
                  <Icons.x size={14} />
                </button>
              )
            : onDelete && (
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  title="Delete photo"
                >
                  <Icons.x size={14} />
                </button>
              )}
        </div>
      )}
    </div>
  );
}

/**
 * Photo Gallery - Main component with tap-based reordering
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
  // Find which image is the hero (is_primary)
  const heroImageId = useMemo(
    () => images.find((img) => img.is_primary && img.media_type !== 'video')?.id,
    [images]
  );

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

  if (images.length === 0) {
    return null;
  }

  // Count non-stock photos for display
  const userPhotoCount = images.filter((img) => !img.isStockPhoto).length;

  return (
    <div className={styles.gallery}>
      {!readOnly && userPhotoCount > 1 && (
        <div className={styles.header}>
          <p className={styles.hint}>
            <Icons.chevronUp size={14} />
            <Icons.chevronDown size={14} />
            Tap arrows to reorder photos
          </p>
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
            onSetPrimary={onSetPrimary}
            onDelete={onDelete}
            onHideStockPhoto={onHideStockPhoto}
            isHero={item.id === heroImageId}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
}
