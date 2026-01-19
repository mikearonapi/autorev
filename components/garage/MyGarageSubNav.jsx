'use client';

/**
 * MyGarageSubNav Component
 * 
 * Dropdown navigation for My Garage sub-pages:
 * - Specs: Full vehicle specifications
 * - Build: Configure upgrades and modifications
 * - Performance: See performance impact of upgrades
 * - Parts: Research and select specific parts
 * - Photos: Manage vehicle photos
 * 
 * Used across all five vehicle-specific pages in My Garage.
 */

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './MyGarageSubNav.module.css';

// Navigation options - in display order
const NAV_OPTIONS = [
  { 
    id: 'my-specs', 
    label: 'Specs',
    href: '/garage/my-specs',
    description: 'Vehicle specifications',
    icon: 'specs'
  },
  { 
    id: 'my-build', 
    label: 'Build',
    href: '/garage/my-build',
    description: 'Configure upgrades',
    icon: 'wrench'
  },
  { 
    id: 'my-performance', 
    label: 'Performance',
    href: '/garage/my-performance',
    description: 'See performance gains',
    icon: 'bolt'
  },
  { 
    id: 'my-parts', 
    label: 'Parts',
    href: '/garage/my-parts',
    description: 'Research parts',
    icon: 'box'
  },
  { 
    id: 'my-photos', 
    label: 'Photos',
    href: '/garage/my-photos',
    description: 'Manage photos',
    icon: 'camera'
  },
];

// Icons
const Icons = {
  chevronDown: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  specs: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  wrench: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  bolt: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  box: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  camera: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  arrowLeft: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  check: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

// Get icon component by name
function getIcon(iconName) {
  switch (iconName) {
    case 'specs': return Icons.specs;
    case 'wrench': return Icons.wrench;
    case 'bolt': return Icons.bolt;
    case 'box': return Icons.box;
    case 'camera': return Icons.camera;
    default: return Icons.specs;
  }
}

export default function MyGarageSubNav({ 
  carSlug, 
  buildId,
  onBack,
  rightAction,
}) {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Determine current page from pathname
  const currentOption = NAV_OPTIONS.find(opt => pathname?.startsWith(opt.href)) || NAV_OPTIONS[0];
  
  // Build URL with query params
  const buildUrl = (baseHref) => {
    const params = new URLSearchParams();
    if (buildId) params.set('build', buildId);
    else if (carSlug) params.set('car', carSlug);
    const queryString = params.toString();
    return queryString ? `${baseHref}?${queryString}` : baseHref;
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownOpen]);
  
  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(e) {
      if (e.key === 'Escape') setIsDropdownOpen(false);
    }
    
    if (isDropdownOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isDropdownOpen]);
  
  return (
    <div className={styles.header}>
      {/* Back Button */}
      <button 
        className={styles.backButton} 
        onClick={onBack}
        aria-label="Back to garage"
      >
        <Icons.arrowLeft size={20} />
      </button>
      
      {/* Dropdown Trigger */}
      <div className={styles.dropdownContainer} ref={dropdownRef}>
        <button 
          className={`${styles.dropdownTrigger} ${isDropdownOpen ? styles.dropdownTriggerOpen : ''}`}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          aria-expanded={isDropdownOpen}
          aria-haspopup="listbox"
        >
          <span className={styles.triggerLabel}>{currentOption.label}</span>
          <span className={`${styles.triggerIcon} ${isDropdownOpen ? styles.triggerIconRotated : ''}`}>
            <Icons.chevronDown size={16} />
          </span>
        </button>
        
        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className={styles.dropdownMenu} role="listbox">
            {NAV_OPTIONS.map((option) => {
              const IconComponent = getIcon(option.icon);
              const isActive = option.id === currentOption.id;
              
              return (
                <Link
                  key={option.id}
                  href={buildUrl(option.href)}
                  className={`${styles.dropdownOption} ${isActive ? styles.dropdownOptionActive : ''}`}
                  onClick={() => setIsDropdownOpen(false)}
                  role="option"
                  aria-selected={isActive}
                >
                  <span className={styles.optionIcon}>
                    <IconComponent size={18} />
                  </span>
                  <div className={styles.optionText}>
                    <span className={styles.optionLabel}>{option.label}</span>
                    <span className={styles.optionDescription}>{option.description}</span>
                  </div>
                  {isActive && (
                    <span className={styles.optionCheck}>
                      <Icons.check size={16} />
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Right Action (optional, e.g., Save button) */}
      {rightAction && (
        <div className={styles.rightAction}>
          {rightAction}
        </div>
      )}
    </div>
  );
}
