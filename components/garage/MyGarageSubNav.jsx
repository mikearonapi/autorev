'use client';

/**
 * MyGarageSubNav Component
 *
 * Dropdown navigation for My Garage sub-pages:
 * - Specs: Full vehicle specifications
 * - Build: Configure upgrades and modifications
 * - Parts: Research and select specific parts
 * - Install: Track installation progress and find service centers
 * - Photos: Manage vehicle photos
 *
 * Used across all five vehicle-specific pages in My Garage.
 */

import React, { useState, useRef, useEffect } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Icons } from '@/components/ui/Icons';

import styles from './MyGarageSubNav.module.css';

// Navigation options - in display order
const NAV_OPTIONS = [
  {
    id: 'my-specs',
    label: 'Specs',
    href: '/garage/my-specs',
    description: 'Vehicle specifications',
    icon: 'specs',
  },
  {
    id: 'my-build',
    label: 'Build',
    href: '/garage/my-build',
    description: 'Configure upgrades',
    icon: 'wrench',
  },
  {
    id: 'my-parts',
    label: 'Parts',
    href: '/garage/my-parts',
    description: 'Research parts',
    icon: 'box',
  },
  {
    id: 'my-install',
    label: 'Install',
    href: '/garage/my-install',
    description: 'Track installations',
    icon: 'tool',
  },
  {
    id: 'my-photos',
    label: 'Photos',
    href: '/garage/my-photos',
    description: 'Manage photos',
    icon: 'camera',
  },
];

// Get icon component by name
function getIcon(iconName) {
  switch (iconName) {
    case 'specs':
      return Icons.specs;
    case 'wrench':
      return Icons.wrench;
    case 'bolt':
      return Icons.bolt;
    case 'box':
      return Icons.box;
    case 'camera':
      return Icons.camera;
    case 'tool':
      return Icons.tool;
    default:
      return Icons.specs;
  }
}

/**
 * MyGarageSubNav Component
 *
 * @param {Object} props
 * @param {string} [props.carId] - Car ID (PRIMARY identifier)
 * @param {string} [props.carSlug] - Car slug for URL generation (fallback if carId provided but slug needed)
 * @param {Object} [props.car] - Car object (if provided, slug will be extracted from car.slug)
 * @param {string} [props.buildId] - Optional build ID
 * @param {Function} [props.onBack] - Back button handler
 * @param {ReactNode} [props.leftAction] - Optional left action element
 * @param {ReactNode} [props.rightAction] - Optional right action element
 */
export default function MyGarageSubNav({
  carId: _carId,
  carSlug,
  car,
  buildId,
  onBack,
  leftAction,
  rightAction,
}) {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Determine current page from pathname
  const currentOption = NAV_OPTIONS.find((opt) => pathname?.startsWith(opt.href)) || NAV_OPTIONS[0];

  // Get slug for URL generation: prefer car.slug, then carSlug prop
  // URLs use slugs, not IDs
  const slugForUrl = car?.slug || carSlug;

  // Build URL with query params
  const buildUrl = (baseHref) => {
    const params = new URLSearchParams();
    if (buildId) params.set('build', buildId);
    else if (slugForUrl) params.set('car', slugForUrl);
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
      <button className={styles.backButton} onClick={onBack} aria-label="Back to garage">
        <Icons.arrowLeft size={20} />
      </button>

      {/* Left Action (optional, e.g., Save status) */}
      {leftAction && <div className={styles.leftAction}>{leftAction}</div>}

      {/* Dropdown Trigger */}
      <div className={styles.dropdownContainer} ref={dropdownRef}>
        <button
          className={`${styles.dropdownTrigger} ${isDropdownOpen ? styles.dropdownTriggerOpen : ''}`}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          aria-expanded={isDropdownOpen}
          aria-haspopup="listbox"
        >
          <span className={styles.triggerLabel}>{currentOption.label}</span>
          <span
            className={`${styles.triggerIcon} ${isDropdownOpen ? styles.triggerIconRotated : ''}`}
          >
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
      {rightAction && <div className={styles.rightAction}>{rightAction}</div>}
    </div>
  );
}
