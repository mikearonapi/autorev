'use client';

import { useEffect, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import styles from './VehicleSelectModal.module.css';

const VehicleSelectModal = forwardRef(function VehicleSelectModal({ vehicles, selectedId, onSelect, onClose }, ref) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Use portal to render at body level
  if (typeof document === 'undefined') return null;
  
  return createPortal(
    <>
      {/* Backdrop - separate element, closes on tap */}
      <div 
        className={styles.backdrop}
        onClick={onClose}
        aria-hidden="true"
        data-overlay-modal
      />
      
      {/* Modal - sibling, not child of backdrop */}
      <div ref={ref} className={styles.modal} role="dialog" aria-modal="true">
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Select Vehicle</h2>
            <p className={styles.subtitle}>{vehicles.length} vehicles in your garage</p>
          </div>
          <button 
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        
        {/* Vehicle List */}
        <div className={styles.vehicleList}>
          {vehicles.map((v) => (
            <div 
              key={v.id}
              className={`${styles.vehicleItem} ${selectedId === v.id ? styles.vehicleItemActive : ''}`}
              onClick={() => onSelect(v.id)}
              role="button"
              tabIndex={0}
            >
              <div className={styles.vehicleImage}>
                {v.matchedCar?.imageHeroUrl ? (
                  <Image
                    src={v.matchedCar.imageHeroUrl}
                    alt={`${v.year} ${v.make} ${v.model}`}
                    fill
                    sizes="50px"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <span className={styles.vehicleImagePlaceholder}>🚗</span>
                )}
              </div>
              
              <div className={styles.vehicleInfo}>
                <span className={styles.vehicleName}>
                  {v.year} {v.make} {v.model}
                </span>
                {v.nickname && (
                  <span className={styles.vehicleNickname}>{v.nickname}</span>
                )}
              </div>
              
              {selectedId === v.id && (
                <span className={styles.checkmark}>✓</span>
              )}
            </div>
          ))}
        </div>
        
        {/* Footer */}
        <div className={styles.footer}>
          <Link 
            href="/garage" 
            className={styles.addBtn}
            onClick={onClose}
          >
            <span>+</span>
            Add New Vehicle
          </Link>
        </div>
      </div>
    </>,
    document.body
  );
});

export default VehicleSelectModal;
