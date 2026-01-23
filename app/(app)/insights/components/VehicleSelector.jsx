'use client';

/**
 * VehicleSelector Component
 * 
 * Pill-style tabs for selecting which garage vehicle to show insights for.
 */

import styles from './VehicleSelector.module.css';

export default function VehicleSelector({ vehicles, selectedId, onSelect }) {
  if (!vehicles || vehicles.length <= 1) return null;

  return (
    <div className={styles.selector}>
      {vehicles.map((vehicle) => (
        <button
          key={vehicle.id}
          className={`${styles.pill} ${selectedId === vehicle.id ? styles.active : ''}`}
          onClick={() => onSelect(vehicle.id)}
        >
          <span className={styles.year}>{vehicle.year}</span>
          <span className={styles.name}>{vehicle.make} {vehicle.model}</span>
        </button>
      ))}
    </div>
  );
}
