'use client';

/**
 * Add Vehicle Modal
 * 
 * Modal for adding a new vehicle to user's garage.
 * Two modes:
 *   1. "Performance Cars" - Search our database of enthusiast vehicles
 *   2. "Any Vehicle" - Add any car via VIN decode or manual entry
 * 
 * Now supports daily drivers, trucks, minivans, etc. that aren't in our
 * performance car database.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import styles from './AddVehicleModal.module.css';
import { fetchCars } from '@/lib/carsClient';
import { calculateWeightedScore } from '@/lib/scoring';
import CarImage from './CarImage';

// Icons
const Icons = {
  x: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  search: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  car: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/>
      <path d="M9 17h6"/>
      <circle cx="17" cy="17" r="2"/>
    </svg>
  ),
  check: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  barcode: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5v14"/>
      <path d="M8 5v14"/>
      <path d="M12 5v14"/>
      <path d="M17 5v14"/>
      <path d="M21 5v14"/>
    </svg>
  ),
  edit: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  truck: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17h4V5H2v12h3"/>
      <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/>
      <circle cx="7.5" cy="17.5" r="2.5"/>
      <circle cx="17.5" cy="17.5" r="2.5"/>
    </svg>
  ),
  loader: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.spinning}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  ),
};

// Generate year options (current year back to 1980)
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1979 }, (_, i) => CURRENT_YEAR + 1 - i);

// Common makes for dropdown
const COMMON_MAKES = [
  'Acura', 'Alfa Romeo', 'Aston Martin', 'Audi', 'BMW', 'Buick', 'Cadillac',
  'Chevrolet', 'Chrysler', 'Dodge', 'Ferrari', 'Fiat', 'Ford', 'Genesis',
  'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jaguar', 'Jeep', 'Kia', 'Lamborghini',
  'Land Rover', 'Lexus', 'Lincoln', 'Lotus', 'Maserati', 'Mazda', 'McLaren',
  'Mercedes-Benz', 'Mini', 'Mitsubishi', 'Nissan', 'Porsche', 'Ram', 'Rivian',
  'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
];

export default function AddVehicleModal({ isOpen, onClose, onAdd, existingVehicles = [] }) {
  // Tab state: 'database' or 'manual'
  const [activeTab, setActiveTab] = useState('database');
  
  // Database search state
  const [searchQuery, setSearchQuery] = useState('');
  const [addingSlug, setAddingSlug] = useState(null);
  const [recentlyAdded, setRecentlyAdded] = useState(new Set());
  const [allCars, setAllCars] = useState([]);

  // VIN decode state
  const [vinInput, setVinInput] = useState('');
  const [vinDecoding, setVinDecoding] = useState(false);
  const [vinDecoded, setVinDecoded] = useState(null);
  const [vinError, setVinError] = useState(null);

  // Manual entry state
  const [manualYear, setManualYear] = useState('');
  const [manualMake, setManualMake] = useState('');
  const [manualModel, setManualModel] = useState('');
  const [manualTrim, setManualTrim] = useState('');
  const [manualNickname, setManualNickname] = useState('');
  
  // Adding state for manual/VIN entry
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [addError, setAddError] = useState(null);

  // Fetch car data from database on mount
  useEffect(() => {
    fetchCars().then(setAllCars).catch(console.error);
  }, []);

  // Default weights for scoring (balanced enthusiast preferences)
  const defaultWeights = {
    powerAccel: 1.5,
    gripCornering: 1.5,
    braking: 1.2,
    trackPace: 1.5,
    drivability: 1.0,
    reliabilityHeat: 1.0,
    soundEmotion: 1.2,
  };

  // Filter and sort cars based on search (from database)
  const filteredCars = useMemo(() => {
    let results = allCars;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = allCars.filter(car => 
        car.name?.toLowerCase().includes(query) ||
        car.brand?.toLowerCase().includes(query) ||
        car.category?.toLowerCase().includes(query) ||
        car.engine?.toLowerCase().includes(query) ||
        car.years?.toLowerCase().includes(query)
      );
    }
    
    // Sort by weighted score (highest scoring cars first)
    return results
      .map(car => ({
        car,
        score: calculateWeightedScore(car, defaultWeights)
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.car)
      .slice(0, 30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, allCars]);

  // Check if a car is already in My Collection
  const isOwned = (slug) => {
    return existingVehicles.some(v => v.matchedCarSlug === slug) || recentlyAdded.has(slug);
  };

  // Handle adding a car from database to My Collection
  const handleAddVehicle = async (car) => {
    if (isOwned(car.slug) || addingSlug) return;
    
    setAddingSlug(car.slug);
    
    try {
      // Parse year from car data
      const yearMatch = car.years?.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
      
      // Extract make and model from name
      let make = '';
      let model = car.name;
      
      if (car.name.startsWith('718') || car.name.startsWith('911') || car.name.startsWith('981') || 
          car.name.startsWith('997') || car.name.startsWith('987') || car.name.startsWith('991') || 
          car.name.startsWith('992')) {
        make = 'Porsche';
      } else {
        const parts = car.name.split(' ');
        make = parts[0];
        model = parts.slice(1).join(' ');
      }

      const vehicleData = {
        year,
        make,
        model,
        matchedCarSlug: car.slug,
      };

      await onAdd(vehicleData);
      setRecentlyAdded(prev => new Set([...prev, car.slug]));
    } catch (err) {
      console.error('Error adding vehicle:', err);
    } finally {
      setAddingSlug(null);
    }
  };

  // VIN decode handler
  const handleVinDecode = useCallback(async () => {
    const cleanVin = vinInput.replace(/[\s-]/g, '').toUpperCase();
    if (cleanVin.length !== 17) {
      setVinError('VIN must be exactly 17 characters');
      return;
    }

    setVinDecoding(true);
    setVinError(null);
    setVinDecoded(null);

    try {
      const response = await fetch(`/api/vin/decode?vin=${cleanVin}`);
      const data = await response.json();

      if (!data.success) {
        setVinError(data.error || 'Failed to decode VIN');
        return;
      }

      setVinDecoded(data);
      // Auto-populate manual fields from VIN decode
      setManualYear(data.year?.toString() || '');
      setManualMake(data.make || '');
      setManualModel(data.model || '');
      setManualTrim(data.trim || '');
    } catch (err) {
      console.error('VIN decode error:', err);
      setVinError('Network error - please try again');
    } finally {
      setVinDecoding(false);
    }
  }, [vinInput]);

  // Handle adding manual/VIN-decoded vehicle
  const handleAddManualVehicle = useCallback(async () => {
    // Validation
    if (!manualYear || !manualMake || !manualModel) {
      setAddError('Year, Make, and Model are required');
      return;
    }

    setIsAddingManual(true);
    setAddError(null);

    try {
      const vehicleData = {
        year: parseInt(manualYear),
        make: manualMake.trim(),
        model: manualModel.trim(),
        trim: manualTrim.trim() || undefined,
        nickname: manualNickname.trim() || undefined,
        vin: vinInput.replace(/[\s-]/g, '').toUpperCase() || undefined,
        vinDecodeData: vinDecoded?.raw || undefined,
        // No matchedCarSlug - this is an unmatched daily driver
      };

      await onAdd(vehicleData);
      setAddSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setVinInput('');
        setVinDecoded(null);
        setManualYear('');
        setManualMake('');
        setManualModel('');
        setManualTrim('');
        setManualNickname('');
        setAddSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error adding vehicle:', err);
      setAddError(err.message || 'Failed to add vehicle');
    } finally {
      setIsAddingManual(false);
    }
  }, [manualYear, manualMake, manualModel, manualTrim, manualNickname, vinInput, vinDecoded, onAdd]);

  // Reset state when modal closes
  const handleClose = () => {
    setSearchQuery('');
    setRecentlyAdded(new Set());
    setActiveTab('database');
    setVinInput('');
    setVinDecoded(null);
    setVinError(null);
    setManualYear('');
    setManualMake('');
    setManualModel('');
    setManualTrim('');
    setManualNickname('');
    setAddError(null);
    setAddSuccess(false);
    onClose();
  };

  // Can add manual vehicle?
  const canAddManual = manualYear && manualMake && manualModel && !isAddingManual;

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Add to My Garage</h2>
          <button onClick={handleClose} className={styles.closeButton}>
            <Icons.x size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'database' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('database')}
          >
            <Icons.car size={16} />
            Performance Cars
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'manual' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            <Icons.truck size={16} />
            Any Vehicle
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {activeTab === 'database' ? (
            <>
              {/* Database Search */}
              <div className={styles.searchWrapper}>
                <Icons.search size={18} />
                <input
                  type="text"
                  placeholder="Search performance vehicles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                  autoFocus
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className={styles.searchClear}
                    type="button"
                  >
                    <Icons.x size={16} />
                  </button>
                )}
              </div>

              {/* Search hint */}
              {!searchQuery && (
                <p className={styles.searchHint}>
                  Search our database of {allCars.length}+ enthusiast vehicles
                </p>
              )}

              {/* Car List */}
              <div className={styles.carList}>
                {filteredCars.map(car => {
                  const alreadyOwned = isOwned(car.slug);
                  const isAdding = addingSlug === car.slug;
                  
                  return (
                    <button
                      key={car.slug}
                      className={`${styles.carOption} ${alreadyOwned ? styles.carOptionAdded : ''}`}
                      onClick={() => handleAddVehicle(car)}
                      disabled={alreadyOwned || isAdding}
                    >
                      <div className={styles.carOptionImage}>
                        <CarImage car={car} variant="thumbnail" showName={false} />
                      </div>
                      <div className={styles.carOptionInfo}>
                        <span className={styles.carOptionName}>{car.name}</span>
                        <span className={styles.carOptionMeta}>
                          {car.hp} hp • {car.category || 'Sports Car'} • {car.priceRange || car.years}
                        </span>
                      </div>
                      <span className={styles.carOptionAction}>
                        {alreadyOwned ? (
                          <span className={styles.addedBadge}>
                            <Icons.check size={14} />
                            Added
                          </span>
                        ) : isAdding ? (
                          <span className={styles.addingBadge}>Adding...</span>
                        ) : (
                          <span className={styles.addBadge}>
                            <Icons.car size={14} />
                            Add
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
                {filteredCars.length === 0 && searchQuery && (
                  <div className={styles.noResults}>
                    <Icons.truck size={32} />
                    <p className={styles.noResultsText}>No performance cars found for "{searchQuery}"</p>
                    <p className={styles.noResultsHint}>
                      Looking for a daily driver, truck, or SUV?
                    </p>
                    <button 
                      className={styles.switchTabButton}
                      onClick={() => setActiveTab('manual')}
                    >
                      <Icons.edit size={16} />
                      Add Any Vehicle
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Manual Entry / VIN Decode Tab */}
              <div className={styles.manualEntrySection}>
                {/* VIN Entry */}
                <div className={styles.vinSection}>
                  <label className={styles.sectionLabel}>
                    <Icons.barcode size={16} />
                    Enter VIN (Recommended)
                  </label>
                  <p className={styles.sectionHint}>
                    We'll automatically look up your vehicle details
                  </p>
                  <div className={styles.vinInputWrapper}>
                    <input
                      type="text"
                      placeholder="e.g., 1HGBH41JXMN109186"
                      value={vinInput}
                      onChange={(e) => {
                        setVinInput(e.target.value.toUpperCase());
                        setVinError(null);
                        setVinDecoded(null);
                      }}
                      className={styles.vinInput}
                      maxLength={17}
                    />
                    <button
                      className={styles.vinDecodeButton}
                      onClick={handleVinDecode}
                      disabled={vinInput.length !== 17 || vinDecoding}
                    >
                      {vinDecoding ? (
                        <Icons.loader size={16} />
                      ) : (
                        'Decode'
                      )}
                    </button>
                  </div>
                  {vinError && (
                    <p className={styles.vinError}>{vinError}</p>
                  )}
                  {vinDecoded && (
                    <div className={styles.vinSuccess}>
                      <Icons.check size={16} />
                      Found: {vinDecoded.year} {vinDecoded.make} {vinDecoded.model}
                      {vinDecoded.trim && ` ${vinDecoded.trim}`}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className={styles.divider}>
                  <span>or enter manually</span>
                </div>

                {/* Manual Entry Form */}
                <div className={styles.formSection}>
                  <div className={styles.formRow}>
                    <div className={styles.formField}>
                      <label className={styles.fieldLabel}>Year *</label>
                      <select
                        value={manualYear}
                        onChange={(e) => setManualYear(e.target.value)}
                        className={styles.formSelect}
                      >
                        <option value="">Select year</option>
                        {YEAR_OPTIONS.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formField}>
                      <label className={styles.fieldLabel}>Make *</label>
                      <select
                        value={manualMake}
                        onChange={(e) => setManualMake(e.target.value)}
                        className={styles.formSelect}
                      >
                        <option value="">Select make</option>
                        {COMMON_MAKES.map(make => (
                          <option key={make} value={make}>{make}</option>
                        ))}
                        <option value="__other__">Other...</option>
                      </select>
                    </div>
                  </div>

                  {manualMake === '__other__' && (
                    <div className={styles.formField}>
                      <label className={styles.fieldLabel}>Custom Make *</label>
                      <input
                        type="text"
                        placeholder="Enter make"
                        value=""
                        onChange={(e) => setManualMake(e.target.value)}
                        className={styles.formInput}
                      />
                    </div>
                  )}

                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Model *</label>
                    <input
                      type="text"
                      placeholder="e.g., Odyssey, F-150, Civic"
                      value={manualModel}
                      onChange={(e) => setManualModel(e.target.value)}
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formField}>
                      <label className={styles.fieldLabel}>Trim</label>
                      <input
                        type="text"
                        placeholder="e.g., EX-L, XLT, Sport"
                        value={manualTrim}
                        onChange={(e) => setManualTrim(e.target.value)}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label className={styles.fieldLabel}>Nickname</label>
                      <input
                        type="text"
                        placeholder="e.g., Family Hauler"
                        value={manualNickname}
                        onChange={(e) => setManualNickname(e.target.value)}
                        className={styles.formInput}
                      />
                    </div>
                  </div>

                  {addError && (
                    <p className={styles.formError}>{addError}</p>
                  )}

                  {addSuccess && (
                    <div className={styles.formSuccess}>
                      <Icons.check size={16} />
                      Vehicle added to your garage!
                    </div>
                  )}

                  <button
                    className={styles.addManualButton}
                    onClick={handleAddManualVehicle}
                    disabled={!canAddManual || addSuccess}
                  >
                    {isAddingManual ? (
                      <>
                        <Icons.loader size={18} />
                        Adding...
                      </>
                    ) : addSuccess ? (
                      <>
                        <Icons.check size={18} />
                        Added!
                      </>
                    ) : (
                      <>
                        <Icons.car size={18} />
                        Add to Garage
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer with count */}
        {recentlyAdded.size > 0 && (
          <div className={styles.footer}>
            <span className={styles.addedCount}>
              <Icons.check size={16} />
              {recentlyAdded.size} car{recentlyAdded.size !== 1 ? 's' : ''} added to My Garage
            </span>
            <button onClick={handleClose} className={styles.doneButton}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
