'use client';

/**
 * GarageVehicleSelector Component
 * 
 * Dropdown selector for switching between vehicles in the garage.
 * Matches the insights page vehicle selector design for consistency.
 * 
 * Used across all six vehicle-specific pages in My Garage:
 * - Specs, Build, Performance, Parts, Install, Photos
 */

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';

import { useRouter, usePathname } from 'next/navigation';

import { createPortal } from 'react-dom';

import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import { useCarsList } from '@/hooks/useCarData';

import styles from './GarageVehicleSelector.module.css';

// Icons
const GarageIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20v-8l10-6 10 6v8"/>
    <path d="M4 20v-4a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4"/>
    <path d="M4 20h16"/>
  </svg>
);

const CarIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/>
    <circle cx="6.5" cy="16.5" r="2.5"/>
    <circle cx="16.5" cy="16.5" r="2.5"/>
  </svg>
);

const CheckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const ChevronDownIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

export default function GarageVehicleSelector({ 
  selectedCarSlug,
  buildId,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);
  
  // Get user's owned vehicles
  const { vehicles } = useOwnedVehicles();
  
  // Get all cars data for matching
  const { data: allCars = [] } = useCarsList();
  
  // Build vehicle options with car data
  const vehicleOptions = (vehicles || []).map(vehicle => {
    const matchedCar = allCars.find(c => c.slug === vehicle.matchedCarSlug);
    return {
      id: vehicle.id,
      carSlug: vehicle.matchedCarSlug,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      nickname: vehicle.nickname,
      name: matchedCar?.name || `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    };
  });
  
  // Find currently selected vehicle
  const selectedVehicle = vehicleOptions.find(v => v.carSlug === selectedCarSlug);
  
  // Get display label for selected vehicle
  const getSelectedLabel = () => {
    if (!selectedVehicle) return 'Select Vehicle';
    return selectedVehicle.nickname || `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`;
  };
  
  // Handle vehicle selection
  const handleSelectVehicle = (vehicle) => {
    setDropdownOpen(false);
    
    // Build URL with new car slug, preserving the current page
    const params = new URLSearchParams();
    params.set('car', vehicle.carSlug);
    
    // Navigate to the same page with the new vehicle
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Mark as mounted for portal rendering
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Position dropdown below button
  useLayoutEffect(() => {
    if (dropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({ 
        top: rect.bottom + 6, 
        left: rect.left, 
        width: rect.width 
      });
    }
  }, [dropdownOpen]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;
    
    const handleClickOutside = (e) => {
      const dropdown = document.getElementById('garage-vehicle-selector-dropdown');
      if (
        wrapperRef.current && 
        !wrapperRef.current.contains(e.target) && 
        (!dropdown || !dropdown.contains(e.target))
      ) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdownOpen]);
  
  // Close on escape key
  useEffect(() => {
    if (!dropdownOpen) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [dropdownOpen]);
  
  // Don't render if no vehicles
  if (vehicleOptions.length === 0) {
    return null;
  }
  
  // Don't render dropdown for single vehicle (just show the label)
  if (vehicleOptions.length === 1) {
    return (
      <section className={styles.vehicleSelector}>
        <div className={styles.selectorButton} style={{ cursor: 'default' }}>
          <div className={styles.selectorLeft}>
            <GarageIcon size={18} className={styles.selectorIcon} />
            <span className={styles.selectorValue}>{getSelectedLabel()}</span>
          </div>
        </div>
      </section>
    );
  }
  
  return (
    <section className={styles.vehicleSelector} ref={wrapperRef}>
      <button 
        ref={buttonRef} 
        type="button" 
        className={styles.selectorButton} 
        onClick={() => setDropdownOpen(!dropdownOpen)}
        aria-expanded={dropdownOpen}
        aria-haspopup="listbox"
      >
        <div className={styles.selectorLeft}>
          <GarageIcon size={18} className={styles.selectorIcon} />
          <span className={styles.selectorValue}>{getSelectedLabel()}</span>
        </div>
        <ChevronDownIcon 
          size={16} 
          className={`${styles.selectorChevron} ${dropdownOpen ? styles.open : ''}`} 
        />
      </button>
      
      {dropdownOpen && mounted && createPortal(
        <div 
          id="garage-vehicle-selector-dropdown"
          className={styles.selectorDropdownPortal} 
          role="listbox"
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
          }}
        >
          {vehicleOptions.map(vehicle => (
            <button
              type="button"
              role="option"
              aria-selected={selectedCarSlug === vehicle.carSlug}
              key={vehicle.id}
              className={`${styles.selectorOption} ${selectedCarSlug === vehicle.carSlug ? styles.active : ''}`}
              onClick={() => handleSelectVehicle(vehicle)}
            >
              {selectedCarSlug === vehicle.carSlug ? (
                <CheckIcon size={16} className={styles.selectorOptionIcon} />
              ) : (
                <CarIcon size={16} className={styles.selectorOptionIcon} />
              )}
              <span className={styles.selectorOptionText}>
                {vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              </span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </section>
  );
}
