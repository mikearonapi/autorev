'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './BuildWizard.module.css';

/**
 * BuildWizard - Full-screen onboarding flow for creating a new build
 * 
 * Inspired by GRAVL's workout setup wizard:
 * - Full-screen steps
 * - Large, tappable goal cards
 * - Progress indicator
 * - Smooth transitions between steps
 * 
 * Steps:
 * 1. Select Your Car (search or browse)
 * 2. What's Your Goal? (Track, Street, Show, Daily)
 * 3. Current Setup (Stock, Light Mods, Stage 1, Stage 2+)
 * 4. Budget Range (Slider or presets)
 * 
 * Usage:
 * <BuildWizard 
 *   isOpen={showWizard} 
 *   onClose={() => setShowWizard(false)}
 *   onComplete={(buildData) => handleBuildCreated(buildData)}
 * />
 */

const STEPS = ['car', 'goal', 'setup', 'budget'];

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
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState('forward');
  
  // Build data
  const [selectedCar, setSelectedCar] = useState(initialCar);
  const [carSearchQuery, setCarSearchQuery] = useState('');
  const [carSearchResults, setCarSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [currentSetup, setCurrentSetup] = useState(null);
  const [budgetRange, setBudgetRange] = useState(null);
  
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
      case 'car':
        return !!selectedCar;
      case 'goal':
        return !!selectedGoal;
      case 'setup':
        return !!currentSetup;
      case 'budget':
        return !!budgetRange;
      default:
        return false;
    }
  }, [currentStep, selectedCar, selectedGoal, currentSetup, budgetRange]);
  
  // Handle complete
  const handleComplete = useCallback(() => {
    const buildData = {
      car: selectedCar,
      goal: selectedGoal,
      currentSetup,
      budgetRange,
    };
    
    onComplete?.(buildData);
    
    // Navigate to tuning shop with car selected
    if (selectedCar?.slug) {
      router.push(`/tuning-shop?car=${selectedCar.slug}`);
    }
    
    onClose?.();
  }, [selectedCar, selectedGoal, currentSetup, budgetRange, onComplete, onClose, router]);
  
  // Select car
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
    <div className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`}>
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
          {/* Step 1: Select Car */}
          {STEPS[currentStep] === 'car' && (
            <div className={styles.step}>
              <h1 className={styles.stepTitle}>Select Your Car</h1>
              <p className={styles.stepSubtitle}>What car are you building?</p>
              
              <div className={styles.searchContainer}>
                <SearchIcon />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search make, model, or year..."
                  value={carSearchQuery}
                  onChange={(e) => setCarSearchQuery(e.target.value)}
                  autoFocus
                />
                {isSearching && <div className={styles.searchSpinner} />}
              </div>
              
              {/* Selected car preview */}
              {selectedCar && (
                <div className={styles.selectedCar}>
                  <div className={styles.selectedCarInfo}>
                    {selectedCar.thumbnail && (
                      <Image
                        src={selectedCar.thumbnail}
                        alt={selectedCar.name}
                        width={80}
                        height={60}
                        className={styles.selectedCarImage}
                      />
                    )}
                    <div>
                      <span className={styles.selectedCarName}>{selectedCar.name}</span>
                      <span className={styles.selectedCarYear}>{selectedCar.year}</span>
                    </div>
                  </div>
                  <button
                    className={styles.changeCar}
                    onClick={() => setSelectedCar(null)}
                  >
                    Change
                  </button>
                </div>
              )}
              
              {/* Search results */}
              {carSearchResults.length > 0 && !selectedCar && (
                <div className={styles.searchResults}>
                  {carSearchResults.map((car) => (
                    <button
                      key={car.id || car.slug}
                      className={styles.searchResult}
                      onClick={() => handleSelectCar(car)}
                    >
                      {car.thumbnail && (
                        <Image
                          src={car.thumbnail}
                          alt={car.name}
                          width={60}
                          height={45}
                          className={styles.resultImage}
                        />
                      )}
                      <div className={styles.resultInfo}>
                        <span className={styles.resultName}>{car.name}</span>
                        <span className={styles.resultYear}>{car.year}</span>
                      </div>
                      <ChevronRightIcon />
                    </button>
                  ))}
                </div>
              )}
              
              {/* Popular cars suggestion */}
              {!carSearchQuery && !selectedCar && (
                <div className={styles.popularCars}>
                  <h3 className={styles.popularTitle}>Popular Platforms</h3>
                  <div className={styles.popularGrid}>
                    {['BMW M3', 'Porsche 911', 'Toyota Supra', 'Corvette'].map((name) => (
                      <button
                        key={name}
                        className={styles.popularCard}
                        onClick={() => setCarSearchQuery(name)}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Step 2: Select Goal */}
          {STEPS[currentStep] === 'goal' && (
            <div className={styles.step}>
              <h1 className={styles.stepTitle}>What's Your Goal?</h1>
              <p className={styles.stepSubtitle}>We'll tailor recommendations to your build style</p>
              
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
              <p className={styles.stepSubtitle}>Where is your car at today?</p>
              
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
              <p className={styles.stepSubtitle}>Help us find parts within your budget</p>
              
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
