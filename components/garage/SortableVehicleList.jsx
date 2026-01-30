'use client';

/**
 * Sortable Vehicle List - Drag-and-drop reordering for garage vehicles
 *
 * This component is dynamically imported to avoid loading @dnd-kit (~317 KiB)
 * on initial page load. The library is only loaded when the user needs to
 * reorder their vehicles.
 *
 * @module components/garage/SortableVehicleList
 */

import { useState, useCallback, useMemo } from 'react';

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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import CarImage from '@/components/CarImage';
import { useCarImages } from '@/hooks/useCarImages';

import styles from './SortableVehicleList.module.css';

// Icon wrapper to prevent browser extension DOM conflicts
const IconWrapper = ({ children, style }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      lineHeight: 0,
      ...style,
    }}
    suppressHydrationWarning
  >
    {children}
  </span>
);

// Grip icon for drag handle
const GripIcon = ({ size = 20 }) => (
  <IconWrapper>
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
      <circle cx="9" cy="5" r="1" fill="currentColor" />
      <circle cx="9" cy="12" r="1" fill="currentColor" />
      <circle cx="9" cy="19" r="1" fill="currentColor" />
      <circle cx="15" cy="5" r="1" fill="currentColor" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
      <circle cx="15" cy="19" r="1" fill="currentColor" />
    </svg>
  </IconWrapper>
);

// Trash icon
const TrashIcon = ({ size = 16 }) => (
  <IconWrapper>
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
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  </IconWrapper>
);

// Sortable Vehicle Item - Individual vehicle row with drag handle
function SortableVehicleItem({ item, onSelectVehicle, onDeleteVehicle, isDragging }) {
  const { vehicle, car, enrichedCar } = item;
  const carSlugForImages =
    car?.slug || vehicle?.matchedCarSlug || (vehicle?.id ? `user-vehicle-${vehicle.id}` : null);
  const { heroImageUrl } = useCarImages(carSlugForImages, { enabled: !!carSlugForImages });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: vehicle?.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
    zIndex: isSortableDragging ? 100 : 'auto',
  };

  // Get display name
  const displayName = useMemo(() => {
    const nickname = vehicle?.nickname?.trim();
    if (nickname) return nickname;
    const parts = [vehicle?.year, vehicle?.make, vehicle?.model].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    if (car?.name) return car.name;
    return 'Vehicle';
  }, [vehicle?.nickname, vehicle?.year, vehicle?.make, vehicle?.model, car?.name]);

  // Build a stable car object for CarImage so it can render:
  // - user-selected hero (from useCarImages) as the primary thumbnail
  // - enrichment image (daily_driver_enrichments.image_url) as fallback
  // - stock garage/hero images from car data as final fallback
  const carForImage = useMemo(() => {
    if (!carSlugForImages) return null;

    const baseCar = car || {};
    const enrichmentUrl = vehicle?.enrichment?.imageUrl || null;

    return {
      ...baseCar,
      slug: carSlugForImages,
      // CarImage placeholder uses car.name; prefer something human-readable
      name: baseCar.name || displayName,
      years: baseCar.years || (vehicle?.year ? String(vehicle.year) : baseCar.years),
      brand: baseCar.brand || vehicle?.make || baseCar.brand,
      // For garage variant, CarImage prefers imageGarageUrl first
      imageGarageUrl: heroImageUrl || baseCar.imageGarageUrl || enrichmentUrl || null,
      // Allow garage variant to fall back to hero when garage image is missing/fails
      imageHeroUrl: heroImageUrl || baseCar.imageHeroUrl || null,
    };
  }, [
    carSlugForImages,
    car,
    vehicle?.enrichment?.imageUrl,
    vehicle?.year,
    vehicle?.make,
    displayName,
    heroImageUrl,
  ]);

  // Get HP display
  const displayData = enrichedCar || car;
  const stockHp = displayData?.hp || displayData?.horsepower;

  return (
    <div ref={setNodeRef} style={style} className={styles.vehicleListItem}>
      {/* Drag Handle */}
      <div className={styles.dragHandle} {...attributes} {...listeners}>
        <GripIcon size={20} />
      </div>

      {/* Vehicle Info - Clickable */}
      <div className={styles.vehicleListContent} onClick={() => onSelectVehicle?.(item)}>
        <div className={styles.vehicleListImage}>
          <CarImage
            car={carForImage}
            variant="garage"
            className={styles.vehicleListCarImage}
            showName={false}
            lazy={true}
          />
        </div>
        <div className={styles.vehicleListInfo}>
          <h3 className={styles.vehicleListName}>{displayName}</h3>
          {stockHp && <span className={styles.vehicleListHp}>{stockHp} HP</span>}
        </div>
      </div>

      {/* Delete Button */}
      {!isDragging && (
        <button
          className={styles.deleteButton}
          onClick={(e) => {
            e.stopPropagation();
            onDeleteVehicle?.(vehicle?.id);
          }}
          aria-label="Remove vehicle"
        >
          <TrashIcon size={16} />
        </button>
      )}
    </div>
  );
}

// Drag Overlay Item - Shows what's being dragged
function DragOverlayItem({ item }) {
  if (!item) return null;

  const { car, vehicle } = item;
  const displayName = (() => {
    const nickname = vehicle?.nickname?.trim();
    if (nickname) return nickname;
    const parts = [vehicle?.year, vehicle?.make, vehicle?.model].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    if (car?.name) return car.name;
    return 'Vehicle';
  })();

  return (
    <div className={`${styles.vehicleListItem} ${styles.vehicleListItemOverlay}`}>
      <div className={styles.dragHandle}>
        <GripIcon size={20} />
      </div>
      <div className={styles.vehicleListInfo}>
        <h3 className={styles.vehicleListName}>{displayName}</h3>
      </div>
    </div>
  );
}

/**
 * Sortable Vehicle List - Main component with drag-and-drop reordering
 *
 * @param {Object} props
 * @param {Array} props.items - Array of { vehicle, car, enrichedCar } objects
 * @param {Function} props.onSelectVehicle - Called when a vehicle is clicked
 * @param {Function} props.onDeleteVehicle - Called when delete button is clicked
 * @param {Function} props.onReorder - Called with new vehicle ID order after drag
 */
export default function SortableVehicleList({
  items,
  onSelectVehicle,
  onDeleteVehicle,
  onReorder,
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
        delay: 150, // 150ms hold before drag starts on touch
        tolerance: 5, // Allow 5px movement during delay
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get the vehicle IDs for SortableContext
  const vehicleIds = useMemo(() => items.map((item) => item.vehicle?.id).filter(Boolean), [items]);

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
        const oldIndex = items.findIndex((item) => item.vehicle?.id === active.id);
        const newIndex = items.findIndex((item) => item.vehicle?.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1 && onReorder) {
          // Create new array with reordered items
          const newItems = arrayMove(items, oldIndex, newIndex);
          // Extract vehicle IDs in new order and call reorder
          const newVehicleIds = newItems.map((item) => item.vehicle.id);
          onReorder(newVehicleIds);
        }
      }
    },
    [items, onReorder]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setIsDragging(false);
  }, []);

  // Find the active item for the drag overlay
  const activeItem = activeId ? items.find((item) => item.vehicle?.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={vehicleIds} strategy={verticalListSortingStrategy}>
        <div className={styles.vehicleListView}>
          {items.map((item) => (
            <SortableVehicleItem
              key={item.vehicle?.id}
              item={item}
              onSelectVehicle={onSelectVehicle}
              onDeleteVehicle={onDeleteVehicle}
              isDragging={isDragging}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>{activeId ? <DragOverlayItem item={activeItem} /> : null}</DragOverlay>
    </DndContext>
  );
}
