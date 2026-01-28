'use client';

/**
 * Sortable Photo Gallery - Drag-and-drop reordering for vehicle photos
 *
 * This component allows users to reorder their photos to control how they
 * appear on the community build page. Uses @dnd-kit for drag-and-drop.
 *
 * @module components/garage/SortablePhotoGallery
 */

import { useState, useCallback, useMemo } from 'react';

import Image from 'next/image';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
 * Sortable Photo Item - Individual photo with drag handle
 */
function SortablePhotoItem({ item, onSetPrimary, onDelete, isHero, isDragging, readOnly }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
    zIndex: isSortableDragging ? 100 : 'auto',
  };

  const isVideo = item.media_type === 'video';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.photoItem} ${isHero ? styles.heroItem : ''} ${isVideo ? styles.videoItem : ''}`}
    >
      {/* Drag Handle - Only visible when not in readOnly mode */}
      {!readOnly && (
        <div className={styles.dragHandle} {...attributes} {...listeners}>
          <Icons.grip size={16} />
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
        {isHero && !isVideo && (
          <span className={styles.heroBadge}>
            <Icons.star size={10} />
            Hero
          </span>
        )}

        {/* Position indicator */}
        {!readOnly && (
          <span className={styles.positionBadge}>
            {item.displayOrder || item.display_order || 1}
          </span>
        )}
      </div>

      {/* Actions */}
      {!readOnly && !isDragging && (
        <div className={styles.actions}>
          {!isHero && !isVideo && onSetPrimary && (
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
          {onDelete && (
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
 * Drag Overlay Item - Shows what's being dragged
 */
function DragOverlayItem({ item }) {
  if (!item) return null;

  const isVideo = item.media_type === 'video';

  return (
    <div className={`${styles.photoItem} ${styles.photoItemOverlay}`}>
      <div className={styles.dragHandle}>
        <Icons.grip size={16} />
      </div>
      <div className={styles.photoContent}>
        {isVideo ? (
          <div className={styles.videoThumbnail}>
            <div className={styles.videoPlaceholder}>
              <Icons.play size={24} />
            </div>
          </div>
        ) : (
          <Image
            src={item.blob_url || item.thumbnail_url}
            alt={item.caption || 'Photo'}
            fill
            style={{ objectFit: 'cover' }}
            sizes="180px"
          />
        )}
      </div>
    </div>
  );
}

/**
 * Sortable Photo Gallery - Main component with drag-and-drop reordering
 *
 * @param {Object} props
 * @param {Array} props.images - Array of image objects with id, blob_url, is_primary, etc.
 * @param {Function} props.onReorder - Called with new order array after drag (array of ids)
 * @param {Function} props.onSetPrimary - Called when user sets a photo as hero
 * @param {Function} props.onDelete - Called when user deletes a photo
 * @param {boolean} props.readOnly - Disable editing (no drag, no actions)
 */
export default function SortablePhotoGallery({
  images = [],
  onReorder,
  onSetPrimary,
  onDelete,
  readOnly = false,
}) {
  const [activeId, setActiveId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Configure sensors for touch and pointer input
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms hold before drag starts on touch
        tolerance: 5, // Allow 5px movement during delay
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get the image IDs for SortableContext
  const imageIds = useMemo(() => images.map((img) => img.id).filter(Boolean), [images]);

  // Find which image is the hero (is_primary)
  const heroImageId = useMemo(
    () => images.find((img) => img.is_primary && img.media_type !== 'video')?.id,
    [images]
  );

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      setActiveId(null);
      setIsDragging(false);

      if (over && active.id !== over.id) {
        const oldIndex = images.findIndex((img) => img.id === active.id);
        const newIndex = images.findIndex((img) => img.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1 && onReorder) {
          // Create new array with reordered items
          const newImages = arrayMove(images, oldIndex, newIndex);
          // Extract image IDs in new order and call reorder
          const newImageIds = newImages.map((img) => img.id);
          onReorder(newImageIds);
        }
      }
    },
    [images, onReorder]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setIsDragging(false);
  }, []);

  // Find the active item for the drag overlay
  const activeItem = activeId ? images.find((img) => img.id === activeId) : null;

  if (images.length === 0) {
    return null;
  }

  // If readOnly, just render a simple grid without drag
  if (readOnly) {
    return (
      <div className={styles.gallery}>
        <div className={styles.photoGrid}>
          {images.map((item) => (
            <SortablePhotoItem
              key={item.id}
              item={item}
              isHero={item.id === heroImageId}
              readOnly={true}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={imageIds} strategy={rectSortingStrategy}>
        <div className={styles.gallery}>
          <div className={styles.header}>
            <p className={styles.hint}>
              <Icons.grip size={14} />
              Drag photos to reorder how they appear on your community build
            </p>
          </div>
          <div className={styles.photoGrid}>
            {images.map((item, index) => (
              <SortablePhotoItem
                key={item.id}
                item={{ ...item, displayOrder: index + 1 }}
                onSetPrimary={onSetPrimary}
                onDelete={onDelete}
                isHero={item.id === heroImageId}
                isDragging={isDragging}
                readOnly={false}
              />
            ))}
          </div>
        </div>
      </SortableContext>
      <DragOverlay>{activeId ? <DragOverlayItem item={activeItem} /> : null}</DragOverlay>
    </DndContext>
  );
}
