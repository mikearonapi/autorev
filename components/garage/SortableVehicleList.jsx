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
  const { heroImageUrl } = useCarImages(car?.slug, { enabled: !!car?.slug });

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
  const displayData = enrichedCar || car;
  const displayName = displayData
    ? `${displayData.year} ${displayData.make} ${displayData.model}`
    : vehicle?.nickname || 'Unknown Vehicle';

  // Get HP display
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
            src={heroImageUrl || displayData?.imageUrl}
            alt={displayName}
            fill
            sizes="60px"
            className={styles.vehicleListImg}
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

  const { car, enrichedCar, vehicle } = item;
  const displayData = enrichedCar || car;
  const displayName = displayData
    ? `${displayData.year} ${displayData.make} ${displayData.model}`
    : vehicle?.nickname || 'Unknown Vehicle';

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
export default function SortableVehicleList({ items, onSelectVehicle, onDeleteVehicle, onReorder }) {
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
