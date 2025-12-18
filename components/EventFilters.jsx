'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './EventFilters.module.css';
import EventCategoryPill from './EventCategoryPill';
import PremiumGate from './PremiumGate';
import LocationAutocomplete from './LocationAutocomplete';

// Radius options in miles
const RADIUS_OPTIONS = [
  { value: 25, label: '25 miles' },
  { value: 50, label: '50 miles' },
  { value: 100, label: '100 miles' },
  { value: 150, label: '150 miles' },
  { value: 200, label: '200 miles' },
  { value: 300, label: '300 miles' },
  { value: 500, label: '500 miles' },
];

// Icons
const Icons = {
  search: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  calendar: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  filter: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  list: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  map: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
      <line x1="8" y1="2" x2="8" y2="18"/>
      <line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  ),
  grid: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  lock: ({ size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  garage: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"/>
      <path d="M3 21h18"/>
      <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/>
      <path d="M10 9h4"/>
    </svg>
  ),
};

export default function EventFilters({
  initialFilters = {},
  onFilterChange,
  eventTypes = [],
  showCategoryPills = false,
  showLocationInput = false,
  showDateRange = false,
  showCarFilters = false,
  showViewToggle = false,
  currentView = 'list',
  onViewChange,
  garageBrands = [],
  isAuthenticated = false,
  userTier = 'free',
}) {
  const [filters, setFilters] = useState(initialFilters);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  // Track if location has coordinates from Google Places
  const [locationCoords, setLocationCoords] = useState(null);

  const handleChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Handle location changes from autocomplete (now includes optional coordinates)
  const handleLocationChange = (newLocation, coords = null) => {
    setLocationCoords(coords);
    
    // Build the filter update
    const updates = { location: newLocation };
    
    // If we have coordinates from Google Places, include them
    if (coords?.lat && coords?.lng) {
      updates.locationLat = coords.lat;
      updates.locationLng = coords.lng;
    } else {
      // Clear coordinates if location changed without coords
      updates.locationLat = null;
      updates.locationLng = null;
    }
    
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Handle radius changes
  const handleRadiusChange = (newRadius) => {
    handleChange('radius', parseInt(newRadius, 10));
  };

  const handleClear = () => {
    const cleared = {
      location: '',
      radius: 50, // Reset to default
      type: '',
      start_date: '',
      end_date: '',
      is_track_event: false,
      is_free: false,
      brand: '',
      for_my_cars: false,
      locationLat: null,
      locationLng: null,
    };
    setFilters(cleared);
    setLocationCoords(null);
    onFilterChange(cleared);
  };

  const canUsePremiumFeatures = ['collector', 'tuner', 'admin'].includes(userTier);

  // Handle premium feature clicks for non-premium users
  const handlePremiumFeatureClick = (featureName) => {
    if (canUsePremiumFeatures) {
      // User has access, proceed with view change
      if (featureName === 'map') onViewChange('map');
      if (featureName === 'calendar') onViewChange('calendar');
    } else {
      // Show upgrade modal
      setShowUpgradeModal(featureName);
    }
  };

  return (
    <div className={styles.filters}>
      {/* Category Pills */}
      {showCategoryPills && (
        <div className={styles.categoryRow}>
          <EventCategoryPill 
            category={{ name: 'All Events', slug: '' }}
            isActive={!filters.type}
            onClick={() => handleChange('type', '')}
          />
          {eventTypes.map(type => (
            <EventCategoryPill 
              key={type.id}
              category={type}
              isActive={filters.type === type.slug}
              onClick={() => handleChange('type', type.slug)}
            />
          ))}
        </div>
      )}

      {/* Main Filter Bar */}
      <div className={styles.filterRow}>
        {/* Location Search with Autocomplete */}
        {showLocationInput && (
          <LocationAutocomplete
            value={filters.location || ''}
            onChange={handleLocationChange}
            placeholder="ZIP code or City, State"
            className={styles.locationAutocomplete}
          />
        )}

        {/* Radius/Distance Select - Only show when location is entered */}
        {showLocationInput && (
          <select 
            value={filters.radius || 50} 
            onChange={(e) => handleRadiusChange(e.target.value)}
            className={styles.filterSelect}
            title="Search radius from location"
          >
            {RADIUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        {/* Region Select - 8 regions for better geographic filtering */}
        <select 
          value={filters.region || ''} 
          onChange={(e) => handleChange('region', e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All Regions</option>
          <option value="New England">New England</option>
          <option value="Mid-Atlantic">Mid-Atlantic</option>
          <option value="Southeast">Southeast</option>
          <option value="Great Lakes">Great Lakes</option>
          <option value="Plains">Plains</option>
          <option value="Southwest">Southwest</option>
          <option value="Mountain">Mountain</option>
          <option value="Pacific">Pacific</option>
        </select>

        {/* Date Range */}
        {showDateRange && (
          <div className={styles.dateRange}>
            <input
              type="date"
              value={filters.start_date || ''}
              onChange={(e) => handleChange('start_date', e.target.value)}
              className={styles.dateInput}
              placeholder="Start Date"
            />
            <span className={styles.dateSeparator}>to</span>
            <input
              type="date"
              value={filters.end_date || ''}
              onChange={(e) => handleChange('end_date', e.target.value)}
              className={styles.dateInput}
              placeholder="End Date"
            />
          </div>
        )}

        {/* Clear Filters */}
        <button onClick={handleClear} className={styles.clearBtn}>
          <Icons.filter size={14} />
          Clear
        </button>

        {/* View Toggle */}
        {showViewToggle && (
          <div className={styles.viewToggle}>
            <button
              onClick={() => onViewChange('list')}
              className={`${styles.viewBtn} ${currentView === 'list' ? styles.viewBtnActive : ''}`}
            >
              <Icons.list />
              List
            </button>
            <button
              onClick={() => handlePremiumFeatureClick('map')}
              className={`${styles.viewBtn} ${currentView === 'map' ? styles.viewBtnActive : ''} ${!canUsePremiumFeatures ? styles.viewBtnLocked : ''}`}
              title={!canUsePremiumFeatures ? "Upgrade to Collector for Map View" : "Map View"}
            >
              <Icons.map />
              Map
              {!canUsePremiumFeatures && <span className={styles.lockIcon}><Icons.lock /></span>}
            </button>
            <button
              onClick={() => handlePremiumFeatureClick('calendar')}
              className={`${styles.viewBtn} ${currentView === 'calendar' ? styles.viewBtnActive : ''} ${!canUsePremiumFeatures ? styles.viewBtnLocked : ''}`}
              title={!canUsePremiumFeatures ? "Upgrade to Collector for Calendar View" : "Calendar View"}
            >
              <Icons.calendar />
              Calendar
              {!canUsePremiumFeatures && <span className={styles.lockIcon}><Icons.lock /></span>}
            </button>
          </div>
        )}
      </div>

      {/* Toggles Row */}
      <div className={styles.toggleRow}>
        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={filters.is_track_event || false}
            onChange={(e) => handleChange('is_track_event', e.target.checked)}
            className={styles.toggleCheckbox}
          />
          <span className={styles.toggleText}>Track Events Only</span>
        </label>

        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={filters.is_free || false}
            onChange={(e) => handleChange('is_free', e.target.checked)}
            className={styles.toggleCheckbox}
          />
          <span className={styles.toggleText}>Free Events Only</span>
        </label>

        {showCarFilters && isAuthenticated && (
          <PremiumGate feature="eventsForMyCars" fallback={null}>
            <button
              onClick={() => handleChange('for_my_cars', !filters.for_my_cars)}
              className={`${styles.garageFilterBtn} ${filters.for_my_cars ? styles.garageFilterBtnActive : ''}`}
            >
              <Icons.garage />
              Events for My Cars
            </button>
          </PremiumGate>
        )}
      </div>

      {/* Upgrade Modal for Premium Features */}
      {showUpgradeModal && (
        <div className={styles.upgradeModalOverlay} onClick={() => setShowUpgradeModal(false)}>
          <div className={styles.upgradeModal} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.upgradeModalClose}
              onClick={() => setShowUpgradeModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className={styles.upgradeModalIcon}>
              {showUpgradeModal === 'map' ? <Icons.map size={32} /> : <Icons.calendar size={32} />}
            </div>
            <h3 className={styles.upgradeModalTitle}>
              {showUpgradeModal === 'map' ? 'Map View' : 'Calendar View'}
            </h3>
            <p className={styles.upgradeModalDescription}>
              {showUpgradeModal === 'map' 
                ? 'See events on an interactive map with location clustering and easy discovery.'
                : 'View events in a monthly calendar layout to plan your car meet schedule.'}
              {' '}This feature is available for Collector members and above.
            </p>
            <div className={styles.upgradeModalActions}>
              <Link 
                href="/join" 
                className={styles.upgradeModalUpgradeBtn}
              >
                Upgrade to Collector
              </Link>
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className={styles.upgradeModalDismissBtn}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
