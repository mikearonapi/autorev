'use client';

/**
 * Add Vehicle Modal
 *
 * Full-screen modal for adding a performance vehicle to user's garage.
 * Rendered via React Portal to document.body for proper stacking context.
 *
 * Three modes:
 * 1. Selector mode (default): Year → Make → Model → Trim cascading dropdowns
 * 2. Search mode: Text search for power users who know their car
 * 3. Request mode: Freeform inputs for vehicles not in our database
 *
 * Features:
 * - Industry-standard Year/Make/Model/Trim selection
 * - "Request to add" flow for cars not in our database (accessible from all modes)
 * - LIME CTA buttons per brand guidelines
 */

import { useState, useMemo, useEffect, useCallback } from 'react';

import { createPortal } from 'react-dom';

import { Icons } from '@/components/ui/Icons';
import { fetchCars } from '@/lib/carsClient';
import { calculateWeightedScore, ENTHUSIAST_WEIGHTS } from '@/lib/scoring';

import styles from './AddVehicleModal.module.css';

/**
 * Parse year ranges like "2020-2024" or "2019-present" into individual years
 */
function parseYearRange(yearsStr) {
  if (!yearsStr) return [];

  const currentYear = new Date().getFullYear();
  const match = yearsStr.match(/(\d{4})(?:\s*[-–]\s*(\d{4}|present))?/i);

  if (!match) return [];

  const startYear = parseInt(match[1]);
  let endYear = currentYear;

  if (match[2] && match[2].toLowerCase() !== 'present') {
    endYear = parseInt(match[2]);
  }

  const years = [];
  for (let y = startYear; y <= endYear; y++) {
    years.push(y);
  }
  return years;
}

/**
 * Check if a year falls within a car's year range
 */
function yearMatchesCar(year, car) {
  const carYears = parseYearRange(car.years);
  return carYears.includes(year);
}

export default function AddVehicleModal({
  isOpen,
  onClose,
  onAdd,
  onRequestCar,
  existingVehicles = [],
}) {
  // Mode: 'selector', 'search', or 'request'
  const [mode, setMode] = useState('selector');

  // Selector state
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedTrim, setSelectedTrim] = useState('');

  // Request mode state (freeform inputs)
  const [requestYear, setRequestYear] = useState('');
  const [requestMake, setRequestMake] = useState('');
  const [requestModel, setRequestModel] = useState('');
  const [requestTrim, setRequestTrim] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [addingSlug, setAddingSlug] = useState(null);
  const [recentlyAdded, setRecentlyAdded] = useState(new Set());
  const [allCars, setAllCars] = useState([]);
  const [addError, setAddError] = useState(null);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // Track if component is mounted (for portal - SSR compatibility)
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Fetch car data from database on mount
  useEffect(() => {
    fetchCars().then(setAllCars).catch(console.error);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ============================================================================
  // SELECTOR MODE: Cascading dropdown options
  // ============================================================================

  // Get all available years (sorted descending - newest first)
  const availableYears = useMemo(() => {
    const yearsSet = new Set();
    allCars.forEach((car) => {
      parseYearRange(car.years).forEach((y) => yearsSet.add(y));
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [allCars]);

  // Get makes filtered by selected year
  const availableMakes = useMemo(() => {
    if (!selectedYear) return [];
    const year = parseInt(selectedYear);
    const makesSet = new Set();
    allCars.forEach((car) => {
      if (yearMatchesCar(year, car) && car.brand) {
        makesSet.add(car.brand);
      }
    });
    return Array.from(makesSet).sort();
  }, [allCars, selectedYear]);

  // Get models filtered by year + make
  const availableModels = useMemo(() => {
    if (!selectedYear || !selectedMake) return [];
    const year = parseInt(selectedYear);
    const modelsSet = new Set();
    allCars.forEach((car) => {
      if (yearMatchesCar(year, car) && car.brand === selectedMake && car.model) {
        modelsSet.add(car.model);
      }
    });
    return Array.from(modelsSet).sort();
  }, [allCars, selectedYear, selectedMake]);

  // Get trims filtered by year + make + model
  const availableTrims = useMemo(() => {
    if (!selectedYear || !selectedMake || !selectedModel) return [];
    const year = parseInt(selectedYear);
    const trimsSet = new Set();
    allCars.forEach((car) => {
      if (
        yearMatchesCar(year, car) &&
        car.brand === selectedMake &&
        car.model === selectedModel &&
        car.trim
      ) {
        trimsSet.add(car.trim);
      }
    });
    return Array.from(trimsSet).sort();
  }, [allCars, selectedYear, selectedMake, selectedModel]);

  // Find the matched car based on selections
  const matchedCar = useMemo(() => {
    if (!selectedYear || !selectedMake || !selectedModel || !selectedTrim) return null;
    const year = parseInt(selectedYear);
    return allCars.find(
      (car) =>
        yearMatchesCar(year, car) &&
        car.brand === selectedMake &&
        car.model === selectedModel &&
        car.trim === selectedTrim
    );
  }, [allCars, selectedYear, selectedMake, selectedModel, selectedTrim]);

  // Reset dependent dropdowns when parent changes
  const handleYearChange = useCallback((value) => {
    setSelectedYear(value);
    setSelectedMake('');
    setSelectedModel('');
    setSelectedTrim('');
    setRequestSubmitted(false);
  }, []);

  const handleMakeChange = useCallback((value) => {
    setSelectedMake(value);
    setSelectedModel('');
    setSelectedTrim('');
    setRequestSubmitted(false);
  }, []);

  const handleModelChange = useCallback((value) => {
    setSelectedModel(value);
    setSelectedTrim('');
    setRequestSubmitted(false);
  }, []);

  const handleTrimChange = useCallback((value) => {
    setSelectedTrim(value);
    setRequestSubmitted(false);
  }, []);

  // Switch to request mode with optional prefill from current state
  const switchToRequestMode = useCallback(
    (prefill = {}) => {
      // Prefill from selector state if available, or from passed prefill
      setRequestYear(prefill.year || selectedYear || '');
      setRequestMake(prefill.make || selectedMake || '');
      setRequestModel(prefill.model || selectedModel || '');
      setRequestTrim(prefill.trim || selectedTrim || '');
      setRequestSubmitted(false);
      setMode('request');
    },
    [selectedYear, selectedMake, selectedModel, selectedTrim]
  );

  // ============================================================================
  // SEARCH MODE: Filter and sort cars
  // ============================================================================

  const filteredCars = useMemo(() => {
    let results = allCars;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = allCars.filter(
        (car) =>
          car.name?.toLowerCase().includes(query) ||
          car.brand?.toLowerCase().includes(query) ||
          car.category?.toLowerCase().includes(query) ||
          car.engine?.toLowerCase().includes(query) ||
          car.years?.toLowerCase().includes(query)
      );
    }

    // Sort by weighted score (highest scoring cars first)
    return results
      .map((car) => ({
        car,
        score: calculateWeightedScore(car, ENTHUSIAST_WEIGHTS),
      }))
      .sort((a, b) => b.score - a.score)
      .map((item) => item.car)
      .slice(0, 30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, allCars]);

  // Check if a car is already in My Collection
  const isOwned = (slug) => {
    return existingVehicles.some((v) => v.matchedCarSlug === slug) || recentlyAdded.has(slug);
  };

  // Handle adding a car to My Garage
  const handleAddVehicle = async (car, yearOverride = null) => {
    if (isOwned(car.slug) || addingSlug) return;

    setAddingSlug(car.slug);
    setAddError(null);

    try {
      // Use override year if provided (from selector), otherwise parse from car data
      let year = yearOverride;
      if (!year) {
        const yearMatch = car.years?.match(/(\d{4})/);
        year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
      }

      // Use new model/trim fields if available, fall back to parsing name
      let make = car.brand || '';
      let model = car.model || car.name;

      // Handle Porsche model numbers (legacy fallback)
      if (
        !make &&
        (car.name.startsWith('718') ||
          car.name.startsWith('911') ||
          car.name.startsWith('981') ||
          car.name.startsWith('997') ||
          car.name.startsWith('987') ||
          car.name.startsWith('991') ||
          car.name.startsWith('992'))
      ) {
        make = 'Porsche';
      } else if (!make) {
        const parts = car.name.split(' ');
        make = parts[0];
        model = parts.slice(1).join(' ');
      }

      const vehicleData = {
        year,
        make,
        model,
        trim: car.trim || null,
        matchedCarSlug: car.slug,
      };

      await onAdd(vehicleData);
      setRecentlyAdded((prev) => new Set([...prev, car.slug]));
    } catch (err) {
      console.error('Error adding vehicle:', err);
      setAddError(err.message || 'Failed to add vehicle. Please try again or sign in.');
    } finally {
      setAddingSlug(null);
    }
  };

  // Handle request to add a car not in database
  // Works from both selector mode (uses selected*) and request mode (uses request*)
  const handleRequestCar = async (fromRequestMode = false) => {
    const year = fromRequestMode ? requestYear : selectedYear;
    const make = fromRequestMode ? requestMake : selectedMake;
    const model = fromRequestMode ? requestModel : selectedModel;
    const trim = fromRequestMode ? requestTrim : selectedTrim;

    if (!year || !make || !model) {
      setAddError('Please fill in Year, Make, and Model.');
      return;
    }

    // Basic year validation
    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 2) {
      setAddError('Please enter a valid year.');
      return;
    }

    setAddError(null);
    setIsSubmittingRequest(true);

    try {
      if (onRequestCar) {
        await onRequestCar({
          year: yearNum,
          make: make.trim(),
          model: model.trim(),
          trim: trim?.trim() || null,
          source: 'garage',
        });
      }
      setRequestSubmitted(true);
    } catch (err) {
      console.error('Error submitting car request:', err);
      setAddError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Reset state when modal closes
  const handleClose = () => {
    setSearchQuery('');
    setSelectedYear('');
    setSelectedMake('');
    setSelectedModel('');
    setSelectedTrim('');
    setRequestYear('');
    setRequestMake('');
    setRequestModel('');
    setRequestTrim('');
    setRecentlyAdded(new Set());
    setAddError(null);
    setRequestSubmitted(false);
    setIsSubmittingRequest(false);
    setMode('selector');
    onClose();
  };

  if (!isOpen) return null;

  // Format engine string for display (truncate if too long)
  const formatEngine = (engine) => {
    if (!engine) return null;
    // Truncate long engine names
    if (engine.length > 20) {
      return engine.substring(0, 18) + '…';
    }
    return engine;
  };

  // Check if we have enough selections to show "not found" state
  const showNotFoundState =
    selectedYear && selectedMake && selectedModel && selectedTrim && !matchedCar;

  const modalContent = (
    <div className={styles.overlay} onClick={handleClose} data-overlay-modal>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Add to My Garage</h2>
          <button onClick={handleClose} className={styles.closeButton}>
            <Icons.x size={24} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Mode toggle */}
          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeButton} ${mode === 'selector' ? styles.modeButtonActive : ''}`}
              onClick={() => setMode('selector')}
              type="button"
            >
              Select Vehicle
            </button>
            <button
              className={`${styles.modeButton} ${mode === 'search' ? styles.modeButtonActive : ''}`}
              onClick={() => setMode('search')}
              type="button"
            >
              Search
            </button>
          </div>

          {/* Error message */}
          {addError && (
            <div className={styles.addError}>
              <span>⚠️ {addError}</span>
              <button
                onClick={() => setAddError(null)}
                className={styles.errorDismiss}
                type="button"
              >
                ×
              </button>
            </div>
          )}

          {/* SELECTOR MODE */}
          {mode === 'selector' && (
            <div className={styles.selectorContent}>
              {/* Year Dropdown */}
              <div className={styles.selectGroup}>
                <label className={styles.selectLabel}>Year</label>
                <select
                  className={styles.select}
                  value={selectedYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                >
                  <option value="">Select year...</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Make Dropdown */}
              <div className={styles.selectGroup}>
                <label className={styles.selectLabel}>Make</label>
                <select
                  className={styles.select}
                  value={selectedMake}
                  onChange={(e) => handleMakeChange(e.target.value)}
                  disabled={!selectedYear}
                >
                  <option value="">Select make...</option>
                  {availableMakes.map((make) => (
                    <option key={make} value={make}>
                      {make}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model Dropdown */}
              <div className={styles.selectGroup}>
                <label className={styles.selectLabel}>Model</label>
                <select
                  className={styles.select}
                  value={selectedModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  disabled={!selectedMake}
                >
                  <option value="">Select model...</option>
                  {availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trim Dropdown */}
              <div className={styles.selectGroup}>
                <label className={styles.selectLabel}>Trim</label>
                <select
                  className={styles.select}
                  value={selectedTrim}
                  onChange={(e) => handleTrimChange(e.target.value)}
                  disabled={!selectedModel}
                >
                  <option value="">Select trim...</option>
                  {availableTrims.map((trim) => (
                    <option key={trim} value={trim}>
                      {trim}
                    </option>
                  ))}
                </select>
              </div>

              {/* Matched Car Preview */}
              {matchedCar && (
                <div className={styles.matchedCar}>
                  <div className={styles.matchedCarInfo}>
                    <span className={styles.matchedCarName}>{matchedCar.name}</span>
                    <span className={styles.matchedCarMeta}>
                      {matchedCar.hp && <span>{matchedCar.hp} hp</span>}
                      {matchedCar.drivetrain && <span> • {matchedCar.drivetrain}</span>}
                      {matchedCar.engine && <span> • {formatEngine(matchedCar.engine)}</span>}
                    </span>
                  </div>
                  <button
                    className={styles.addMatchedButton}
                    onClick={() => handleAddVehicle(matchedCar, parseInt(selectedYear))}
                    disabled={isOwned(matchedCar.slug) || addingSlug === matchedCar.slug}
                  >
                    {isOwned(matchedCar.slug) ? (
                      <>
                        <Icons.check size={16} />
                        Added
                      </>
                    ) : addingSlug === matchedCar.slug ? (
                      <Icons.loader size={16} />
                    ) : (
                      <>
                        <Icons.car size={16} />
                        Add to Garage
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Not Found State */}
              {showNotFoundState && !requestSubmitted && (
                <div className={styles.notFound}>
                  <p className={styles.notFoundText}>
                    We don&apos;t have this exact configuration yet.
                  </p>
                  <button className={styles.requestButton} onClick={handleRequestCar} type="button">
                    <Icons.plus size={16} />
                    Request to Add to AutoRev
                  </button>
                </div>
              )}

              {/* Request Submitted */}
              {requestSubmitted && (
                <div className={styles.requestSubmitted}>
                  <Icons.check size={20} />
                  <p>Request submitted! We&apos;ll review and add this vehicle soon.</p>
                </div>
              )}

              {/* Can't find your vehicle link */}
              {!requestSubmitted && (
                <button
                  className={styles.cantFindLink}
                  onClick={() => switchToRequestMode()}
                  type="button"
                >
                  <Icons.plus size={14} />
                  Can&apos;t find your vehicle? Request it
                </button>
              )}
            </div>
          )}

          {/* SEARCH MODE */}
          {mode === 'search' && (
            <>
              {/* Search */}
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
                {filteredCars.map((car) => {
                  const alreadyOwned = isOwned(car.slug);
                  const isAdding = addingSlug === car.slug;

                  return (
                    <button
                      key={car.slug}
                      className={`${styles.carOption} ${alreadyOwned ? styles.carOptionAdded : ''}`}
                      onClick={() => handleAddVehicle(car)}
                      disabled={alreadyOwned || isAdding}
                    >
                      <div className={styles.carOptionInfo}>
                        <span className={styles.carOptionName}>{car.name}</span>
                        <span className={styles.carOptionMeta}>
                          {car.years && <span className={styles.metaItem}>{car.years}</span>}
                          {car.hp && <span className={styles.metaItem}>{car.hp} hp</span>}
                          {car.drivetrain && (
                            <span className={styles.metaItem}>{car.drivetrain}</span>
                          )}
                          {car.engine && (
                            <span className={styles.metaItem}>{formatEngine(car.engine)}</span>
                          )}
                        </span>
                      </div>
                      <span className={styles.carOptionAction}>
                        {alreadyOwned ? (
                          <span className={styles.addedBadge}>
                            <Icons.check size={14} />
                            Added
                          </span>
                        ) : isAdding ? (
                          <span className={styles.addingBadge}>
                            <Icons.loader size={14} />
                          </span>
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
                    <Icons.car size={32} />
                    <p className={styles.noResultsText}>
                      No vehicles found for &quot;{searchQuery}&quot;
                    </p>
                    <p className={styles.noResultsHint}>
                      Try a different search or request this vehicle
                    </p>
                    <button
                      className={styles.requestFromSearchButton}
                      onClick={() => {
                        // Try to parse search query into make/model
                        const parts = searchQuery.trim().split(/\s+/);
                        const prefill = {};
                        // Check if first part looks like a year
                        if (parts[0] && /^\d{4}$/.test(parts[0])) {
                          prefill.year = parts[0];
                          prefill.make = parts[1] || '';
                          prefill.model = parts.slice(2).join(' ') || '';
                        } else {
                          prefill.make = parts[0] || '';
                          prefill.model = parts.slice(1).join(' ') || '';
                        }
                        switchToRequestMode(prefill);
                      }}
                      type="button"
                    >
                      <Icons.plus size={16} />
                      Request this vehicle
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* REQUEST MODE */}
          {mode === 'request' && (
            <div className={styles.requestContent}>
              <p className={styles.requestIntro}>
                Tell us about the vehicle you&apos;d like added to AutoRev.
              </p>

              {/* Year Input */}
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="request-year">
                  Year <span className={styles.required}>*</span>
                </label>
                <input
                  id="request-year"
                  type="number"
                  inputMode="numeric"
                  className={styles.textInput}
                  value={requestYear}
                  onChange={(e) => {
                    setRequestYear(e.target.value);
                    setRequestSubmitted(false);
                  }}
                  placeholder="e.g., 2023"
                  min="1900"
                  max={new Date().getFullYear() + 2}
                />
              </div>

              {/* Make Input */}
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="request-make">
                  Make <span className={styles.required}>*</span>
                </label>
                <input
                  id="request-make"
                  type="text"
                  className={styles.textInput}
                  value={requestMake}
                  onChange={(e) => {
                    setRequestMake(e.target.value);
                    setRequestSubmitted(false);
                  }}
                  placeholder="e.g., Hyundai"
                />
              </div>

              {/* Model Input */}
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="request-model">
                  Model <span className={styles.required}>*</span>
                </label>
                <input
                  id="request-model"
                  type="text"
                  className={styles.textInput}
                  value={requestModel}
                  onChange={(e) => {
                    setRequestModel(e.target.value);
                    setRequestSubmitted(false);
                  }}
                  placeholder="e.g., Genesis Coupe"
                />
              </div>

              {/* Trim Input (optional) */}
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="request-trim">
                  Trim <span className={styles.optional}>(optional)</span>
                </label>
                <input
                  id="request-trim"
                  type="text"
                  className={styles.textInput}
                  value={requestTrim}
                  onChange={(e) => {
                    setRequestTrim(e.target.value);
                    setRequestSubmitted(false);
                  }}
                  placeholder="e.g., 3.8 Track"
                />
              </div>

              {/* Submit Button */}
              {!requestSubmitted ? (
                <button
                  className={styles.submitRequestButton}
                  onClick={() => handleRequestCar(true)}
                  disabled={isSubmittingRequest || !requestYear || !requestMake || !requestModel}
                  type="button"
                >
                  {isSubmittingRequest ? (
                    <>
                      <Icons.loader size={16} />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Icons.send size={16} />
                      Submit Request
                    </>
                  )}
                </button>
              ) : (
                <div className={styles.requestSubmitted}>
                  <Icons.check size={20} />
                  <p>Request submitted! We&apos;ll review and add this vehicle soon.</p>
                </div>
              )}

              {/* Back link */}
              <button
                className={styles.backToSelectorLink}
                onClick={() => setMode('selector')}
                type="button"
              >
                ← Back to vehicle selector
              </button>
            </div>
          )}
        </div>

        {/* Footer with count */}
        {recentlyAdded.size > 0 && (
          <div className={styles.footer}>
            <span className={styles.addedCount}>
              <Icons.check size={16} />
              {recentlyAdded.size} vehicle{recentlyAdded.size !== 1 ? 's' : ''} added
            </span>
            <button onClick={handleClose} className={styles.doneButton}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Use portal to render at document body level (above all other content)
  // This ensures the modal is not trapped inside any parent's stacking context
  // Only render when mounted AND open - prevents data-overlay-modal from affecting safe area when closed
  if (!isMounted || !isOpen) return null;
  return createPortal(modalContent, document.body);
}
