'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './BuildWizard.module.css';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import CarImage from '@/components/CarImage';
import { useSafeAreaColor, SAFE_AREA_COLORS } from '@/hooks/useSafeAreaColor';

/**
 * BuildWizard - Full-screen onboarding flow for creating a new build
 * 
 * UPDATED: Vehicle-first approach - builds require a vehicle from your garage.
 * 
 * Inspired by GRAVL's workout setup wizard:
 * - Full-screen steps
 * - Large, tappable goal cards
 * - Progress indicator
 * - Smooth transitions between steps
 * 
 * Steps:
 * 1. Select Vehicle from Garage (or add new vehicle)
 * 2. What's Your Goal? (Track, Street, Show, Daily)
 * 3. Current Setup (Stock, Light Mods, Stage 1, Stage 2+)
 * 4. Budget Range (Slider or presets)
 * 
 * Usage:
 * <BuildWizard 
 *   isOpen={showWizard} 
 *   onClose={() => setShowWizard(false)}
 *   onComplete={(buildData) => handleBuildCreated(buildData)}
 *   allCars={allCars} // Optional: for matching vehicles to car data
 * />
 */

const STEPS = ['vehicle', 'goal', 'setup', 'budget'];

const BUILD_GOALS = [
  {
    id: 'track',
    label: 'Track Ready',
    description: 'Optimized for lap times and track performance',
    icon: '🏁',
    color: '#ef4444',
  },
  {
    id: 'street',
    label: 'Street Performance',
    description: 'Daily drivable with spirited driving capability',
    icon: '🔥',
    color: '#f59e0b',
  },
  {
    id: 'show',
    label: 'Show Car',
    description: 'Aesthetics and presence at car meets',
    icon: '✨',
    color: '#8b5cf6',
  },
  {
    id: 'daily',
    label: 'Daily+',
    description: 'Reliable daily with subtle upgrades',
    icon: '🚗',
    color: '#22c55e',
  },
];

const CURRENT_SETUPS = [
  {
    id: 'stock',
    label: 'Completely Stock',
    description: 'No modifications yet',
    icon: '📦',
  },
  {
    id: 'light',
    label: 'Light Mods',
    description: 'Intake, exhaust, minor bolt-ons',
    icon: '🔧',
  },
  {
    id: 'stage1',
    label: 'Stage 1',
    description: 'Tune, intake, exhaust, suspension',
    icon: '⚡',
  },
  {
    id: 'stage2',
    label: 'Stage 2+',
    description: 'Significant power mods, built engine',
    icon: '🚀',
  },
];

const BUDGET_RANGES = [
  { id: 'starter', label: 'Under $5K', value: 5000, description: 'Essential bolt-ons' },
  { id: 'enthusiast', label: '$5K - $15K', value: 15000, description: 'Solid foundation' },
  { id: 'serious', label: '$15K - $30K', value: 30000, description: 'Comprehensive build' },
  { id: 'no_limit', label: 'No Limit', value: null, description: 'Dream build' },
];

export default function BuildWizard({
  isOpen,
  onClose,
  onComplete,
  initialCar = null,
  allCars = [], // For matching vehicles to car database
  onAddVehicle, // Callback to open Add Vehicle modal
}) {
  // Set safe area color to match overlay background when modal is open
  useSafeAreaColor(SAFE_AREA_COLORS.OVERLAY, { enabled: isOpen });
  
  const router = useRouter();
  const { vehicles } = useOwnedVehicles();
  const { getBuildById } = useSavedBuilds();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState('forward');
  
  // Build data
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedCar, setSelectedCar] = useState(initialCar);
  const [carSearchQuery, setCarSearchQuery] = useState('');
  const [carSearchResults, setCarSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [currentSetup, setCurrentSetup] = useState(null);
  const [budgetRange, setBudgetRange] = useState(null);
  
  // Match vehicles with car data and build data from database
  // Include active build data for accurate HP gain display
  const vehiclesWithCars = vehicles.map(v => {
    const car = allCars.find(c => c.slug === v.matchedCarSlug);
    const activeBuild = v.activeBuildId ? getBuildById(v.activeBuildId) : null;
    return { 
      vehicle: v, 
      car,
      // Use build's HP gain if available (more accurate), otherwise fall back to cached value
      displayHpGain: activeBuild?.totalHpGain ?? v.totalHpGain ?? 0,
    };
  });
  
  // Mount check for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Lock body scroll when open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);
  
  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setSelectedVehicle(null);
      if (!initialCar) {
        setSelectedCar(null);
        setCarSearchQuery('');
        setCarSearchResults([]);
      }
      setSelectedGoal(null);
      setCurrentSetup(null);
      setBudgetRange(null);
    }
  }, [isOpen, initialCar]);
  
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  
  // Search cars (debounced)
  useEffect(() => {
    if (carSearchQuery.length < 2) {
      setCarSearchResults([]);
      return;
    }
    
    const searchTimer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/cars/search?q=${encodeURIComponent(carSearchQuery)}&limit=10`);
        if (response.ok) {
          const data = await response.json();
          setCarSearchResults(data.cars || []);
        }
      } catch (error) {
        console.error('[BuildWizard] Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    
    return () => clearTimeout(searchTimer);
  }, [carSearchQuery]);
  
  // Navigate steps
  const goToStep = useCallback((step, dir = 'forward') => {
    if (animating) return;
    setAnimating(true);
    setDirection(dir);
    
    setTimeout(() => {
      setCurrentStep(step);
      setAnimating(false);
    }, 150);
  }, [animating]);
  
  const nextStep = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      goToStep(currentStep + 1, 'forward');
    }
  }, [currentStep, goToStep]);
  
  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      goToStep(currentStep - 1, 'backward');
    }
  }, [currentStep, goToStep]);
  
  // Check if current step is complete
  const isStepComplete = useCallback(() => {
    switch (STEPS[currentStep]) {
      case 'vehicle':
        return !!selectedVehicle;
      case 'goal':
        return !!selectedGoal;
      case 'setup':
        return !!currentSetup;
      case 'budget':
        return !!budgetRange;
      default:
        return false;
    }
  }, [currentStep, selectedVehicle, selectedGoal, currentSetup, budgetRange]);
  
  // Handle complete
  const handleComplete = useCallback(() => {
    const buildData = {
      vehicle: selectedVehicle,
      car: selectedVehicle?.car || selectedCar,
      goal: selectedGoal,
      currentSetup,
      budgetRange,
    };
    
    onComplete?.(buildData);
    
    // Navigate to tuning shop with car selected
    const carSlug = selectedVehicle?.car?.slug || selectedCar?.slug;
    if (carSlug) {
      router.push(`/tuning-shop?car=${carSlug}`);
    }
    
    onClose?.();
  }, [selectedVehicle, selectedCar, selectedGoal, currentSetup, budgetRange, onComplete, onClose, router]);
  
  // Select vehicle from garage
  const handleSelectVehicle = useCallback((vehicleWithCar) => {
    setSelectedVehicle(vehicleWithCar);
    if (vehicleWithCar.car) {
      setSelectedCar(vehicleWithCar.car);
    }
    // Auto-advance after short delay
    setTimeout(() => nextStep(), 300);
  }, [nextStep]);
  
  // Handle add vehicle click
  const handleAddVehicle = useCallback(() => {
    onClose?.();
    onAddVehicle?.();
  }, [onClose, onAddVehicle]);
  
  // Select car (fallback for search - deprecated but kept for compatibility)
  const handleSelectCar = useCallback((car) => {
    setSelectedCar(car);
    setCarSearchQuery('');
    setCarSearchResults([]);
    // Auto-advance after short delay
    setTimeout(() => nextStep(), 300);
  }, [nextStep]);
  
  // Select goal
  const handleSelectGoal = useCallback((goal) => {
    setSelectedGoal(goal);
    setTimeout(() => nextStep(), 300);
  }, [nextStep]);
  
  // Select setup
  const handleSelectSetup = useCallback((setup) => {
    setCurrentSetup(setup);
    setTimeout(() => nextStep(), 300);
  }, [nextStep]);
  
  // Select budget
  const handleSelectBudget = useCallback((budget) => {
    setBudgetRange(budget);
    // Don't auto-advance on last step
  }, []);
  
  if (!mounted) return null;
  
  const stepProgress = ((currentStep + 1) / STEPS.length) * 100;
  
  const wizard = (
    <div className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`} {...(isOpen && { 'data-overlay-modal': true })}>
      <div className={styles.wizard}>
        {/* Header */}
        <header className={styles.header}>
          <button
            className={styles.backButton}
            onClick={currentStep === 0 ? onClose : prevStep}
            aria-label={currentStep === 0 ? 'Close' : 'Go back'}
          >
            {currentStep === 0 ? <CloseIcon /> : <BackIcon />}
          </button>
          
          <div className={styles.progress}>
            <div 
              className={styles.progressBar} 
              style={{ width: `${stepProgress}%` }}
            />
          </div>
          
          <span className={styles.stepCounter}>
            {currentStep + 1} / {STEPS.length}
          </span>
        </header>
        
        {/* Content */}
        <div className={`${styles.content} ${animating ? styles.contentAnimating : ''}`}>
          {/* Step 1: Select Vehicle from Garage */}
          {STEPS[currentStep] === 'vehicle' && (
            <div className={styles.step}>
              <h1 className={styles.stepTitle}>Select Your Vehicle</h1>
              <p className={styles.stepSubtitle}>
                {vehiclesWithCars.length > 0 
                  ? 'Choose a vehicle from your garage to build'
                  : 'Add a vehicle to your garage to start building'
                }
              </p>
              
              {/* Selected vehicle preview */}
              {selectedVehicle && (
                <div className={styles.selectedCar}>
                  <div className={styles.selectedCarInfo}>
                    {selectedVehicle.car ? (
                      <div className={styles.selectedCarImageWrapper}>
                        <CarImage car={selectedVehicle.car} variant="garage" />
                      </div>
                    ) : (
                      <div className={styles.selectedCarPlaceholder}>
                        <CarIcon />
                      </div>
                    )}
                    <div>
                      <span className={styles.selectedCarName}>
                        {selectedVehicle.vehicle.nickname || selectedVehicle.car?.name || 
                          `${selectedVehicle.vehicle.year} ${selectedVehicle.vehicle.make} ${selectedVehicle.vehicle.model}`}
                      </span>
                      {selectedVehicle.displayHpGain > 0 && (
                        <span className={styles.selectedCarYear}>
                          +{selectedVehicle.displayHpGain} HP from existing build
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className={styles.changeCar}
                    onClick={() => setSelectedVehicle(null)}
                  >
                    Change
                  </button>
                </div>
              )}
              
              {/* Vehicle list from garage */}
              {!selectedVehicle && vehiclesWithCars.length > 0 && (
                <div className={styles.vehicleList}>
                  {vehiclesWithCars.map((item) => (
                    <button
                      key={item.vehicle.id}
                      className={styles.vehicleCard}
                      onClick={() => handleSelectVehicle(item)}
                    >
                      <div className={styles.vehicleCardImage}>
                        {item.car ? (
                          <CarImage car={item.car} variant="garage" />
                        ) : (
                          <div className={styles.vehicleCardPlaceholder}>
                            <CarIcon />
                          </div>
                        )}
                      </div>
                      <div className={styles.vehicleCardInfo}>
                        <span className={styles.vehicleCardName}>
                          {item.vehicle.nickname || item.car?.name || 
                            `${item.vehicle.year} ${item.vehicle.make} ${item.vehicle.model}`}
                        </span>
                        {item.displayHpGain > 0 ? (
                          <span className={styles.vehicleCardHp}>
                            +{item.displayHpGain} HP
                          </span>
                        ) : (
                          <span className={styles.vehicleCardStock}>Stock</span>
                        )}
                      </div>
                      <ChevronRightIcon />
                    </button>
                  ))}
                </div>
              )}
              
              {/* Empty state - no vehicles */}
              {!selectedVehicle && vehiclesWithCars.length === 0 && (
                <div className={styles.emptyVehicles}>
                  <div className={styles.emptyVehiclesIcon}>
                    <CarIcon />
                  </div>
                  <h3 className={styles.emptyVehiclesTitle}>No Vehicles Yet</h3>
                  <p className={styles.emptyVehiclesText}>
                    Add your first vehicle to start building
                  </p>
                </div>
              )}
              
              {/* Add Vehicle Button */}
              {!selectedVehicle && (
                <button
                  className={styles.addVehicleButton}
                  onClick={handleAddVehicle}
                >
                  <PlusIcon />
                  Add Vehicle to Garage
                </button>
              )}
            </div>
          )}
          
          {/* Step 2: Select Goal */}
          {STEPS[currentStep] === 'goal' && (
            <div className={styles.step}>
              <h1 className={styles.stepTitle}>What's Your Goal?</h1>
              <p className={styles.stepSubtitle}>We'll prioritize upgrades that match your driving style — no more endless forum searching</p>
              
              <div className={styles.goalGrid}>
                {BUILD_GOALS.map((goal) => (
                  <button
                    key={goal.id}
                    className={`${styles.goalCard} ${selectedGoal?.id === goal.id ? styles.goalCardSelected : ''}`}
                    onClick={() => handleSelectGoal(goal)}
                    style={{ '--goal-color': goal.color }}
                  >
                    <span className={styles.goalIcon}>{goal.icon}</span>
                    <span className={styles.goalLabel}>{goal.label}</span>
                    <span className={styles.goalDescription}>{goal.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Step 3: Current Setup */}
          {STEPS[currentStep] === 'setup' && (
            <div className={styles.step}>
              <h1 className={styles.stepTitle}>Current Setup</h1>
              <p className={styles.stepSubtitle}>We'll recommend next steps based on what you already have</p>
              
              <div className={styles.setupList}>
                {CURRENT_SETUPS.map((setup) => (
                  <button
                    key={setup.id}
                    className={`${styles.setupCard} ${currentSetup?.id === setup.id ? styles.setupCardSelected : ''}`}
                    onClick={() => handleSelectSetup(setup)}
                  >
                    <span className={styles.setupIcon}>{setup.icon}</span>
                    <div className={styles.setupInfo}>
                      <span className={styles.setupLabel}>{setup.label}</span>
                      <span className={styles.setupDescription}>{setup.description}</span>
                    </div>
                    {currentSetup?.id === setup.id && <CheckIcon />}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Step 4: Budget Range */}
          {STEPS[currentStep] === 'budget' && (
            <div className={styles.step}>
              <h1 className={styles.stepTitle}>Budget Range</h1>
              <p className={styles.stepSubtitle}>We'll filter recommendations to fit your budget — no sticker shock</p>
              
              <div className={styles.budgetGrid}>
                {BUDGET_RANGES.map((budget) => (
                  <button
                    key={budget.id}
                    className={`${styles.budgetCard} ${budgetRange?.id === budget.id ? styles.budgetCardSelected : ''}`}
                    onClick={() => handleSelectBudget(budget)}
                  >
                    <span className={styles.budgetLabel}>{budget.label}</span>
                    <span className={styles.budgetDescription}>{budget.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <footer className={styles.footer}>
          {currentStep < STEPS.length - 1 ? (
            <button
              className={styles.continueButton}
              onClick={nextStep}
              disabled={!isStepComplete()}
            >
              Continue
            </button>
          ) : (
            <button
              className={styles.startButton}
              onClick={handleComplete}
              disabled={!budgetRange}
            >
              Start Building
            </button>
          )}
          
          {currentStep > 0 && (
            <button
              className={styles.skipButton}
              onClick={nextStep}
            >
              Skip this step
            </button>
          )}
        </footer>
      </div>
    </div>
  );
  
  return createPortal(wizard, document.body);
}

// Icons
const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const BackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const CarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
    <circle cx="7" cy="17" r="2"/>
    <path d="M9 17h6"/>
    <circle cx="17" cy="17" r="2"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
