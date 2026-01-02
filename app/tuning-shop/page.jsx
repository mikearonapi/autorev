'use client';

/**
 * Tuning Shop Page
 * 
 * Three-step modification workflow:
 * 1. Select a Car - Choose a car to mod
 * 2. Upgrade Center - Configure upgrades and see performance impact
 * 3. Projects - View, manage, compare, and analyze saved builds
 */

import React, { useState, useEffect, Suspense, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';

import styles from './page.module.css';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary, { CompactFallback } from '@/components/ErrorBoundary';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import CarImage from '@/components/CarImage';
import CarActionMenu from '@/components/CarActionMenu';
import UpgradeCenter from '@/components/UpgradeCenter';
import OnboardingPopup, { tuningShopOnboardingSteps } from '@/components/OnboardingPopup';
import { fetchCars } from '@/lib/carsClient';

// New mobile-first tuning shop components
import {
  FactoryConfig,
  WheelTireConfigurator,
  StickyCarHeader,
  BuildSummaryBar,
  useWheelTireSelection,
} from '@/components/tuning-shop';

// Sort options for projects
const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'hp-desc', label: 'Most HP Gain' },
  { value: 'hp-asc', label: 'Least HP Gain' },
  { value: 'cost-asc', label: 'Lowest Cost' },
  { value: 'cost-desc', label: 'Highest Cost' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'vehicle', label: 'By Vehicle' },
];

// Icons
const Icons = {
  gauge: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  folder: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  wrench: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  trash: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  plus: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  search: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  x: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
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
  heart: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  grid: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  arrowLeft: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  bolt: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  settings: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  list: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  compare: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10"/>
      <path d="M12 20V4"/>
      <path d="M6 20v-6"/>
    </svg>
  ),
  filter: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  sort: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="11" y2="6"/>
      <line x1="4" y1="12" x2="11" y2="12"/>
      <line x1="4" y1="18" x2="13" y2="18"/>
      <polyline points="15 15 18 18 21 15"/>
      <line x1="18" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  check: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  dollar: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  calendar: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  chevronDown: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  edit: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  alertTriangle: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  analytics: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.997.398-.997.95v8a1 1 0 0 0 1 1h8z"/>
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
    </svg>
  ),
};

// Car Picker Modal for searching/selecting cars
function CarPickerModal({ isOpen, onClose, onSelect, existingCars = [], cars = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredCars = useMemo(() => {
    if (!searchTerm) return cars;
    const term = searchTerm.toLowerCase();
    return cars.filter(car => 
      car.name.toLowerCase().includes(term) ||
      car.brand?.toLowerCase().includes(term) ||
      car.category?.toLowerCase().includes(term)
    );
  }, [searchTerm, cars]);
  
  if (!isOpen) return null;
  
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Select a Car to Mod</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <Icons.x size={20} />
          </button>
        </div>
        
        <div className={styles.searchBox}>
          <Icons.search size={18} />
          <input
            type="text"
            placeholder="Search vehicles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>
        <p className={styles.searchHint}>Search by make, model, category, or year • Tap to select</p>
        
        <div className={styles.carList}>
          {filteredCars.map(car => (
            <div
              key={car.slug}
              className={styles.carListItem}
            >
              <div 
                className={styles.carListClickable} 
                onClick={() => {
                  onSelect(car);
                  onClose();
                }}
              >
                <div className={styles.carListImage}>
                  <CarImage car={car} variant="thumbnail" showName={false} />
                </div>
                <div className={styles.carListInfo}>
                  <span className={styles.carListName}>{car.name}</span>
                  <span className={styles.carListMeta}>
                    {car.hp} hp • {car.layout || 'Sports'} • {car.priceRange}
                  </span>
                </div>
              </div>
              <div className={styles.carListActionWrapper}>
                <CarActionMenu car={car} variant="compact" theme="dark" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ icon: IconComponent, title, description, actionLabel, onAction }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        {IconComponent && <IconComponent size={48} />}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button className={styles.emptyAction} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// Project Card Component (works in both grid and list views)
function ProjectCard({ build, viewMode, compareMode, isSelected, onSelect, onLoad, onDelete }) {
  const handleClick = () => {
    if (compareMode) {
      onSelect();
    } else {
      onLoad();
    }
  };
  
  const formattedDate = useMemo(() => {
    if (!build.createdAt) return '';
    const date = new Date(build.createdAt);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [build.createdAt]);
  
  if (viewMode === 'list') {
    return (
      <div 
        className={`${styles.projectListCard} ${isSelected ? styles.projectFullCardSelected : ''}`}
        onClick={handleClick}
      >
        {compareMode && (
          <div className={`${styles.selectCheckbox} ${isSelected ? styles.selectCheckboxSelected : ''}`}>
            {isSelected && <Icons.check size={14} />}
          </div>
        )}
        <div className={styles.projectListImage}>
          <CarImage car={build.car} variant="thumbnail" showName={false} />
        </div>
        <div className={styles.projectListContent}>
          <div className={styles.projectListMain}>
            <h4>{build.name}</h4>
            <p>{build.car.name}</p>
          </div>
          <div className={styles.projectListStat}>
            <span className={styles.statLabel}>HP Gain</span>
            <span className={`${styles.statValue} ${styles.statValueGreen}`}>+{build.totalHpGain || 0}</span>
          </div>
          <div className={styles.projectListStat}>
            <span className={styles.statLabel}>Est. Cost</span>
            <span className={`${styles.statValue} ${styles.statValueGold}`}>${(build.totalCostLow || 0).toLocaleString()}</span>
          </div>
          <div className={styles.projectListStat}>
            <span className={styles.statLabel}>Date</span>
            <span className={styles.statValue}>{formattedDate}</span>
          </div>
        </div>
        <button
          className={styles.deleteBtn}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete project"
        >
          <Icons.trash size={16} />
        </button>
      </div>
    );
  }
  
  // Grid view (default)
  return (
    <div
      onClick={handleClick}
      className={`${styles.projectFullCard} ${isSelected ? styles.projectFullCardSelected : ''}`}
    >
      {compareMode && (
        <div className={styles.cardSelectOverlay}>
          <div className={`${styles.selectCheckbox} ${isSelected ? styles.selectCheckboxSelected : ''}`}>
            {isSelected && <Icons.check size={14} />}
          </div>
        </div>
      )}
      <div className={styles.projectFullImage}>
        <CarImage car={build.car} variant="hero" showName={false} />
      </div>
      <div className={styles.projectFullContent}>
        <h4>{build.name}</h4>
        <p className={styles.projectFullCar}>{build.car.name}</p>
        <div className={styles.projectFullStats}>
          {build.totalHpGain > 0 && (
            <span className={styles.statBadge}>+{build.totalHpGain} hp</span>
          )}
          {build.totalCostLow > 0 && (
            <span className={styles.statBadge}>${build.totalCostLow.toLocaleString()}</span>
          )}
        </div>
        {formattedDate && (
          <span className={styles.projectDate}>{formattedDate}</span>
        )}
      </div>
      <button
        className={styles.deleteBtn}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete project"
      >
        <Icons.trash size={16} />
      </button>
    </div>
  );
}

// Build Comparison Modal
function CompareBuildsModal({ builds, onClose }) {
  if (builds.length < 2) return null;
  
  // Find max values for highlighting winners
  const maxHpGain = Math.max(...builds.map(b => b.totalHpGain || 0));
  const minCost = Math.min(...builds.map(b => b.totalCostLow || Infinity));
  const maxFinalHp = Math.max(...builds.map(b => (b.car?.hp || 0) + (b.totalHpGain || 0)));
  
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.compareModal} onClick={e => e.stopPropagation()}>
        <div className={styles.compareModalHeader}>
          <h2><Icons.compare size={20} /> Build Comparison</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <Icons.x size={20} />
          </button>
        </div>
        
        <div className={styles.compareContent}>
          {/* Build Cards Header */}
          <div className={styles.compareRow}>
            <div className={styles.compareLabelCell}></div>
            {builds.map(build => (
              <div key={build.id} className={styles.compareHeaderCell}>
                <div className={styles.compareBuildImage}>
                  <CarImage car={build.car} variant="thumbnail" showName={false} />
                </div>
                <h4>{build.name}</h4>
                <p>{build.car?.name}</p>
              </div>
            ))}
          </div>
          
          {/* Performance Section */}
          <div className={styles.compareSectionTitle}>
            <Icons.bolt size={16} />
            <span>Performance</span>
          </div>
          
          <div className={styles.compareRow}>
            <div className={styles.compareLabelCell}>Base HP</div>
            {builds.map(build => (
              <div key={build.id} className={styles.compareValueCell}>
                {build.car?.hp || 0} hp
              </div>
            ))}
          </div>
          
          <div className={styles.compareRow}>
            <div className={styles.compareLabelCell}>HP Gain</div>
            {builds.map(build => {
              const isWinner = (build.totalHpGain || 0) === maxHpGain && maxHpGain > 0;
              return (
                <div key={build.id} className={`${styles.compareValueCell} ${isWinner ? styles.winner : ''}`}>
                  +{build.totalHpGain || 0} hp
                  {isWinner && <span className={styles.winnerBadge}>Best</span>}
                </div>
              );
            })}
          </div>
          
          <div className={styles.compareRow}>
            <div className={styles.compareLabelCell}>Final HP</div>
            {builds.map(build => {
              const finalHp = (build.car?.hp || 0) + (build.totalHpGain || 0);
              const isWinner = finalHp === maxFinalHp;
              return (
                <div key={build.id} className={`${styles.compareValueCell} ${isWinner ? styles.winner : ''}`}>
                  <strong>{finalHp} hp</strong>
                </div>
              );
            })}
          </div>
          
          {/* Cost Section */}
          <div className={styles.compareSectionTitle}>
            <Icons.dollar size={16} />
            <span>Cost Analysis</span>
          </div>
          
          <div className={styles.compareRow}>
            <div className={styles.compareLabelCell}>Estimated Cost</div>
            {builds.map(build => {
              const isWinner = (build.totalCostLow || Infinity) === minCost && minCost < Infinity;
              return (
                <div key={build.id} className={`${styles.compareValueCell} ${isWinner ? styles.winner : ''}`}>
                  ${(build.totalCostLow || 0).toLocaleString()}
                  {isWinner && <span className={styles.winnerBadge}>Lowest</span>}
                </div>
              );
            })}
          </div>
          
          <div className={styles.compareRow}>
            <div className={styles.compareLabelCell}>Cost per HP</div>
            {builds.map(build => {
              const costPerHp = build.totalHpGain > 0 
                ? Math.round((build.totalCostLow || 0) / build.totalHpGain)
                : 0;
              return (
                <div key={build.id} className={styles.compareValueCell}>
                  ${costPerHp}/hp
                </div>
              );
            })}
          </div>
          
          {/* Vehicle Section */}
          <div className={styles.compareSectionTitle}>
            <Icons.car size={16} />
            <span>Vehicle Info</span>
          </div>
          
          <div className={styles.compareRow}>
            <div className={styles.compareLabelCell}>Vehicle</div>
            {builds.map(build => (
              <div key={build.id} className={styles.compareValueCell}>
                {build.car?.name || build.carName}
              </div>
            ))}
          </div>
          
          <div className={styles.compareRow}>
            <div className={styles.compareLabelCell}>Price Range</div>
            {builds.map(build => (
              <div key={build.id} className={styles.compareValueCell}>
                {build.car?.priceRange || 'N/A'}
              </div>
            ))}
          </div>
          
          <div className={styles.compareRow}>
            <div className={styles.compareLabelCell}># of Upgrades</div>
            {builds.map(build => (
              <div key={build.id} className={styles.compareValueCell}>
                {build.upgrades?.length || 0} mods
              </div>
            ))}
          </div>
        </div>
        
        <div className={styles.compareModalFooter}>
          <p>Compare different builds to find the best value for your budget and goals.</p>
        </div>
      </div>
    </div>
  );
}

// Analytics Summary Component
function ProjectsAnalytics({ builds }) {
  const analytics = useMemo(() => {
    const totalCost = builds.reduce((sum, b) => sum + (b.totalCostLow || 0), 0);
    const totalHpGain = builds.reduce((sum, b) => sum + (b.totalHpGain || 0), 0);
    const avgCostPerHp = totalHpGain > 0 ? Math.round(totalCost / totalHpGain) : 0;
    
    // Vehicle breakdown
    const vehicleCounts = {};
    builds.forEach(b => {
      const name = b.car?.name || b.carName || 'Unknown';
      vehicleCounts[name] = (vehicleCounts[name] || 0) + 1;
    });
    const topVehicle = Object.entries(vehicleCounts).sort((a, b) => b[1] - a[1])[0];
    
    return {
      totalBuilds: builds.length,
      totalCost,
      totalHpGain,
      avgCostPerHp,
      avgHpPerBuild: builds.length > 0 ? Math.round(totalHpGain / builds.length) : 0,
      uniqueVehicles: Object.keys(vehicleCounts).length,
      topVehicle: topVehicle ? topVehicle[0] : null,
    };
  }, [builds]);
  
  return (
    <div className={styles.analyticsBar}>
      <div className={styles.analyticsStat}>
        <span className={styles.analyticsValue}>{analytics.totalBuilds}</span>
        <span className={styles.analyticsLabel}>Projects</span>
      </div>
      <div className={styles.analyticsStat}>
        <span className={styles.analyticsValue}>+{analytics.totalHpGain}</span>
        <span className={styles.analyticsLabel}>Total HP</span>
      </div>
      <div className={styles.analyticsStat}>
        <span className={styles.analyticsValue}>${((analytics.totalCost || 0) / 1000).toFixed(1)}k</span>
        <span className={styles.analyticsLabel}>Est. Total</span>
      </div>
      <div className={styles.analyticsStat}>
        <span className={styles.analyticsValue}>${analytics.avgCostPerHp}</span>
        <span className={styles.analyticsLabel}>Avg $/HP</span>
      </div>
      <div className={styles.analyticsStat}>
        <span className={styles.analyticsValue}>{analytics.uniqueVehicles}</span>
        <span className={styles.analyticsLabel}>Vehicles</span>
      </div>
    </div>
  );
}

// Main Tuning Shop Content
function TuningShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('select');
  const [selectedCar, setSelectedCar] = useState(null);
  const [currentBuildId, setCurrentBuildId] = useState(null);
  const [showCarPicker, setShowCarPicker] = useState(false);
  const [allCars, setAllCars] = useState([]);
  const [carsError, setCarsError] = useState(null);
  
  // Projects tab state
  const [projectsSort, setProjectsSort] = useState('date-desc');
  const [projectsView, setProjectsView] = useState('grid'); // 'grid' or 'list'
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  
  // New tuning shop state for factory config and wheel selection
  const [factoryConfig, setFactoryConfig] = useState(null);
  const { selectedFitment, selectFitment, clearSelection: clearFitmentSelection } = useWheelTireSelection();
  
  // Track build summary data from UpgradeCenter (passed via ref/callback)
  const [buildSummary, setBuildSummary] = useState({
    totalHpGain: 0,
    totalTqGain: 0,
    totalCost: 0,
    upgradeCount: 0,
    selectedUpgrades: [],
  });
  
  // Hooks with defensive fallbacks using optional chaining
  // Hooks must be called unconditionally (Rules of Hooks)
  const authState = useAuth() || {};
  const authModal = useAuthModal();
  const favoritesState = useFavorites() || {};
  const buildsState = useSavedBuilds() || {};
  const vehiclesState = useOwnedVehicles() || {};
  
  // Extract values with safe defaults
  const isAuthenticated = authState.isAuthenticated || false;
  const authLoading = authState.isLoading || false;
  const isDataFetchReady = authState.isDataFetchReady || false;
  const sessionExpired = authState.sessionExpired || false;
  const favorites = favoritesState.favorites || [];
  const favoritesLoading = favoritesState.isLoading || false;
  const builds = buildsState.builds || [];
  const buildsLoading = buildsState.isLoading || false;
  const deleteBuild = buildsState.deleteBuild || (() => {});
  const getBuildById = buildsState.getBuildById || (() => null);
  const vehicles = vehiclesState.vehicles || [];
  const vehiclesLoading = vehiclesState.isLoading || false;
  
  // Combined loading state for initial data fetch
  // CRITICAL: Also check isDataFetchReady to prevent race condition on page refresh where
  // auth resolves (authLoading=false) but providers haven't started fetching yet (waiting for isDataFetchReady)
  // Without this check, there's a brief moment where the page shows empty/wrong state instead of loading
  const isDataLoading = authLoading || (isAuthenticated && (!isDataFetchReady || favoritesLoading || buildsLoading || vehiclesLoading));
  
  // Fetch car data from database on mount
  // Enhanced error handling to prevent undefined states
  useEffect(() => {
    let cancelled = false;
    
    const loadCars = async () => {
      try {
        const cars = await fetchCars();
        if (!cancelled && Array.isArray(cars)) {
          setAllCars(cars);
          setCarsError(null);
        } else if (!cancelled) {
          setCarsError('Failed to load car data. Please refresh the page.');
        }
      } catch (err) {
        console.error('[TuningShop] Failed to fetch cars:', err);
        if (!cancelled) {
          setCarsError('Failed to load car data. Please refresh the page.');
        }
      }
    };
    
    loadCars();
    
    return () => {
      cancelled = true;
    };
  }, []);
  
  // Handle URL params for direct build access
  // Use a mounted ref to prevent state updates during navigation transitions
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Guard against updates during navigation/unmount
    if (!isMountedRef.current) return;
    
    // Wait for cars to load before processing URL params
    if (allCars.length === 0) return;
    
    // Safely access search params - can throw during navigation transitions
    let buildId = null;
    let planCar = null;
    try {
      buildId = searchParams?.get('build');
      planCar = searchParams?.get('plan');
    } catch (err) {
      // Ignore errors during navigation transitions
      console.warn('[TuningShop] Search params access failed:', err);
      return;
    }
    
    if (buildId && builds.length > 0) {
      const build = getBuildById(buildId);
      if (build) {
        const car = allCars.find(c => c.slug === build.carSlug);
        if (car && isMountedRef.current) {
          setSelectedCar(car);
          setCurrentBuildId(buildId);
          // Restore factory config and wheel fitment from saved build
          if (build.factoryConfig) {
            setFactoryConfig(build.factoryConfig);
          }
          if (build.wheelFitment) {
            selectFitment(build.wheelFitment);
          }
          setActiveTab('upgrades');
        }
      }
    } else if (planCar) {
      const car = allCars.find(c => c.slug === planCar);
      if (car && isMountedRef.current) {
        setSelectedCar(car);
        setCurrentBuildId(null);
        setActiveTab('upgrades');
      }
    }
  }, [searchParams, builds, getBuildById, allCars, selectFitment]);

  // Handle tab changes
  const handleTabChange = (tabId) => {
    if (tabId === 'select') {
      setSelectedCar(null);
      setCurrentBuildId(null);
      window.history.pushState({}, '', '/tuning-shop');
    }
    setActiveTab(tabId);
  };

  // Get cars from favorites with full car data
  const favoriteCars = useMemo(() => {
    if (allCars.length === 0) return [];
    return favorites
      .map(fav => allCars.find(c => c.slug === fav.slug))
      .filter(Boolean);
  }, [favorites, allCars]);
  
  // Get cars from owned vehicles
  const ownedCars = useMemo(() => {
    if (allCars.length === 0) return [];
    return vehicles
      .map(v => allCars.find(c => c.slug === v.matchedCarSlug))
      .filter(Boolean);
  }, [vehicles, allCars]);
  
  // Combined unique cars for quick selection
  const allUserCars = useMemo(() => {
    const carMap = new Map();
    ownedCars.forEach(car => carMap.set(car.slug, { ...car, source: 'owned' }));
    favoriteCars.forEach(car => {
      if (!carMap.has(car.slug)) {
        carMap.set(car.slug, { ...car, source: 'favorite' });
      }
    });
    return Array.from(carMap.values());
  }, [ownedCars, favoriteCars]);
  
  // Builds with car data
  const buildsWithCars = useMemo(() => {
    if (allCars.length === 0) return [];
    return builds
      .map(build => ({
        ...build,
        car: allCars.find(c => c.slug === build.carSlug)
      }))
      .filter(b => b.car);
  }, [builds, allCars]);
  
  // Get unique vehicles for filter dropdown
  const uniqueVehicles = useMemo(() => {
    const vehicles = new Map();
    buildsWithCars.forEach(build => {
      if (build.car && !vehicles.has(build.carSlug)) {
        vehicles.set(build.carSlug, { slug: build.carSlug, name: build.car.name });
      }
    });
    return Array.from(vehicles.values());
  }, [buildsWithCars]);
  
  // Filtered and sorted builds
  const filteredAndSortedBuilds = useMemo(() => {
    let filtered = buildsWithCars;
    
    // Apply vehicle filter
    if (vehicleFilter !== 'all') {
      filtered = filtered.filter(b => b.carSlug === vehicleFilter);
    }
    
    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (projectsSort) {
        case 'date-desc':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'date-asc':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'hp-desc':
          return (b.totalHpGain || 0) - (a.totalHpGain || 0);
        case 'hp-asc':
          return (a.totalHpGain || 0) - (b.totalHpGain || 0);
        case 'cost-asc':
          return (a.totalCostLow || 0) - (b.totalCostLow || 0);
        case 'cost-desc':
          return (b.totalCostLow || 0) - (a.totalCostLow || 0);
        case 'name-asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'vehicle':
          return (a.car?.name || '').localeCompare(b.car?.name || '');
        default:
          return 0;
      }
    });
  }, [buildsWithCars, vehicleFilter, projectsSort]);
  
  // Group builds by vehicle (for vehicle view mode)
  const groupedByVehicle = useMemo(() => {
    if (projectsSort !== 'vehicle') return null;
    
    const groups = new Map();
    filteredAndSortedBuilds.forEach(build => {
      const key = build.carSlug;
      if (!groups.has(key)) {
        groups.set(key, { car: build.car, builds: [] });
      }
      groups.get(key).builds.push(build);
    });
    return Array.from(groups.values());
  }, [filteredAndSortedBuilds, projectsSort]);
  
  // Compare mode handlers
  const handleSelectForCompare = useCallback((build) => {
    setSelectedForCompare(prev => {
      const isSelected = prev.some(b => b.id === build.id);
      if (isSelected) {
        return prev.filter(b => b.id !== build.id);
      }
      // Max 4 builds
      if (prev.length >= 4) {
        return [...prev.slice(1), build];
      }
      return [...prev, build];
    });
  }, []);
  
  const exitCompareMode = useCallback(() => {
    setCompareMode(false);
    setSelectedForCompare([]);
  }, []);

  const handleSelectCar = (car) => {
    setSelectedCar(car);
    setCurrentBuildId(null);
    setActiveTab('upgrades');
    window.history.pushState({}, '', `/tuning-shop?plan=${car.slug}`);
  };

  const handleLoadBuild = (build) => {
    const car = allCars.find(c => c.slug === build.carSlug);
    if (car) {
      setSelectedCar(car);
      setCurrentBuildId(build.id);
      // Restore factory config and wheel fitment from saved build
      if (build.factoryConfig) {
        setFactoryConfig(build.factoryConfig);
      }
      if (build.wheelFitment) {
        selectFitment(build.wheelFitment);
      }
      setActiveTab('upgrades');
      window.history.pushState({}, '', `/tuning-shop?build=${build.id}`);
    }
  };

  // Handle going back from Upgrade Center to Select Car
  const handleBackToSelect = () => {
    setSelectedCar(null);
    setCurrentBuildId(null);
    setFactoryConfig(null);
    clearFitmentSelection();
    setBuildSummary({ totalHpGain: 0, totalTqGain: 0, totalCost: 0, upgradeCount: 0, selectedUpgrades: [] });
    setActiveTab('select');
    window.history.pushState({}, '', '/tuning-shop');
  };
  
  // Callback for UpgradeCenter to update build summary
  const handleBuildSummaryUpdate = useCallback((summary) => {
    setBuildSummary(summary);
  }, []);

  const tabs = [
    { id: 'select', label: 'Select a Car', icon: Icons.car },
    { id: 'upgrades', label: 'Upgrade Center', icon: Icons.gauge },
    { id: 'projects', label: 'Projects', icon: Icons.folder, count: buildsWithCars.length },
  ];

  return (
    <div className={styles.page}>
      {/* Optimized Background Image */}
      <div className={styles.backgroundImageWrapper}>
        <Image
          src="https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/pages/garage/background.webp"
          alt="Tuning Shop Background"
          fill
          priority
          quality={75}
          style={{ objectFit: 'cover', objectPosition: 'center', opacity: 0.4 }}
        />
      </div>

      {/* Header Bar - Matches Garage Layout */}
      <div className={styles.headerBar}>
        <div className={styles.headerLeft}>
          <h1 className={styles.titleCompact}>Tuning Shop</h1>
        </div>
        
        <div className={styles.headerCenter}>
          {/* Tab Pills */}
          <div className={styles.tabPills}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isDisabled = tab.id === 'upgrades' && !selectedCar;
              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && handleTabChange(tab.id)}
                  className={`${styles.tabPill} ${activeTab === tab.id ? styles.tabPillActive : ''} ${isDisabled ? styles.tabPillDisabled : ''}`}
                  disabled={isDisabled}
                  title={isDisabled ? 'Select a car first' : undefined}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {tab.count > 0 && <span className={styles.tabCount}>{tab.count}</span>}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className={styles.headerRight}>
          {/* Settings moved to global header */}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {/* =====================================================
            TAB 1: SELECT A CAR
            ===================================================== */}
        {activeTab === 'select' && (
          <div className={styles.selectCarView}>
            {/* Quick Start from Projects */}
            {buildsWithCars.length > 0 && (
              <div className={styles.projectsSection}>
                <div className={styles.projectsSectionHeader}>
                  <div className={styles.projectsSectionTitle}>
                    <Icons.folder size={20} />
                    <h3>Continue a Project</h3>
                    <span>{buildsWithCars.length}</span>
                  </div>
                  {buildsWithCars.length > 4 && (
                    <button 
                      className={styles.viewAllBtn}
                      onClick={() => setActiveTab('projects')}
                    >
                      View All
                    </button>
                  )}
                </div>
                <div className={styles.projectsRow}>
                  {buildsWithCars.slice(0, 4).map(build => (
                    <button
                      key={build.id}
                      className={styles.projectCard}
                      onClick={() => handleLoadBuild(build)}
                    >
                      <div className={styles.projectImage}>
                        <CarImage car={build.car} variant="thumbnail" showName={false} />
                      </div>
                      <div className={styles.projectInfo}>
                        <h4>{build.name}</h4>
                        <p>{build.car.name}</p>
                        <div className={styles.projectStats}>
                          {build.totalHpGain > 0 && <span>+{build.totalHpGain} hp</span>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Select a Car to Mod - Your Cars */}
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleRow}>
                <div className={styles.sectionTitleGroup}>
                  <Icons.wrench size={22} />
                  <h2>Select a Car to Mod</h2>
                  {allUserCars.length > 0 && <span>{allUserCars.length}</span>}
                </div>
                <button 
                  className={styles.browseBtnHeader}
                  onClick={() => setShowCarPicker(true)}
                >
                  <Icons.grid size={16} />
                  Browse All Cars
                </button>
              </div>
              <p className={styles.sectionDescription}>
                We've included the cars from your garage in the list below. If you want to modify a car not in your garage, please click 'Browse All Cars'.
              </p>
            </div>

            {allUserCars.length > 0 ? (
              <div className={styles.catalogGrid}>
                {allUserCars.map(car => (
                  <div
                    key={car.slug}
                    className={styles.catalogCard}
                  >
                    <div 
                      className={styles.catalogCardClickable}
                      onClick={() => handleSelectCar(car)}
                      style={{ cursor: 'pointer', flex: 1 }}
                    >
                      <div className={styles.catalogCardImage}>
                        <CarImage car={car} variant="hero" showName={false} />
                        <span className={`${styles.catalogCardBadge} ${car.source === 'owned' ? styles.ownedBadge : styles.favBadge}`}>
                          {car.source === 'owned' ? <Icons.car size={14} /> : <Icons.heart size={14} />}
                        </span>
                      </div>
                      <div className={styles.catalogCardContent}>
                        <h4>{car.name}</h4>
                        <p className={styles.catalogCardMeta}>{car.hp} hp • {car.priceRange}</p>
                        {car.tunabilityScore && (
                          <div className={styles.catalogCardScore}>
                            <Icons.wrench size={14} />
                            {car.tunabilityScore.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={styles.catalogCardAction}>
                      <CarActionMenu 
                        car={car} 
                        variant="compact" 
                        theme="dark" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Icons.car}
                title="No Cars in Your Garage"
                description="Add cars to your collection or favorites to quickly select them for modding."
                actionLabel="Browse All Cars"
                onAction={() => setShowCarPicker(true)}
              />
            )}

          </div>
        )}

        {/* =====================================================
            TAB 2: UPGRADE CENTER
            ===================================================== */}
        {activeTab === 'upgrades' && (
          selectedCar ? (
            <div className={styles.hubContainer}>
              <ErrorBoundary 
                name="UpgradeCenter"
                featureContext="tuning-shop"
                fallback={({ error, onRetry }) => (
                  <div className={styles.errorFallback}>
                    <div className={styles.errorContent}>
                      <Icons.alertTriangle size={32} />
                      <h3>Upgrade Center Error</h3>
                      <p>Something went wrong loading the upgrade center.</p>
                      <div className={styles.errorActions}>
                        <button onClick={onRetry} className={styles.retryBtn}>Try Again</button>
                        <button onClick={handleBackToSelect} className={styles.backBtn}>Select Another Car</button>
                      </div>
                    </div>
                  </div>
                )}
              >
                <UpgradeCenter 
                  car={selectedCar} 
                  initialBuildId={currentBuildId}
                  onChangeCar={handleBackToSelect}
                  onBuildSummaryUpdate={handleBuildSummaryUpdate}
                  factoryConfig={factoryConfig}
                  onFactoryConfigChange={setFactoryConfig}
                  selectedWheelFitment={selectedFitment}
                  onWheelFitmentChange={selectFitment}
                />
              </ErrorBoundary>
            </div>
          ) : (
            <div className={styles.selectPrompt}>
              <EmptyState
                icon={Icons.car}
                title="No Car Selected"
                description="Choose a car from the Select a Car tab to start configuring upgrades."
                actionLabel="Select a Car"
                onAction={() => setActiveTab('select')}
              />
            </div>
          )
        )}

        {/* =====================================================
            TAB 3: PROJECTS (Saved Builds) - Enhanced
            ===================================================== */}
        {activeTab === 'projects' && (
          buildsWithCars.length > 0 ? (
            <div className={styles.projectsView}>
              {/* Header with Controls */}
              <div className={styles.projectsHeader}>
                <div className={styles.projectsHeaderTitle}>
                  <h3>Your Saved Projects</h3>
                  <p>Click on a project to continue planning or view details</p>
                </div>
                
                <div className={styles.projectsActions}>
                  {/* Compare Mode Toggle */}
                  {compareMode ? (
                    <>
                      <span className={styles.compareStatus}>
                        {selectedForCompare.length} selected
                      </span>
                      <button 
                        className={styles.compareBtn}
                        onClick={() => setShowCompareModal(true)}
                        disabled={selectedForCompare.length < 2}
                      >
                        <Icons.compare size={16} />
                        Compare
                      </button>
                      <button className={styles.actionBtn} onClick={exitCompareMode}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button 
                      className={`${styles.actionBtn} ${compareMode ? styles.actionBtnActive : ''}`}
                      onClick={() => setCompareMode(true)}
                      disabled={buildsWithCars.length < 2}
                      title="Compare builds"
                    >
                      <Icons.compare size={16} />
                      Compare
                    </button>
                  )}
                  
                  {/* Vehicle Filter */}
                  {uniqueVehicles.length > 1 && (
                    <select 
                      className={styles.filterSelect}
                      value={vehicleFilter}
                      onChange={(e) => setVehicleFilter(e.target.value)}
                    >
                      <option value="all">All Vehicles ({buildsWithCars.length})</option>
                      {uniqueVehicles.map(v => (
                        <option key={v.slug} value={v.slug}>
                          {v.name} ({buildsWithCars.filter(b => b.carSlug === v.slug).length})
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {/* Sort Dropdown */}
                  <select 
                    className={styles.sortSelect}
                    value={projectsSort}
                    onChange={(e) => setProjectsSort(e.target.value)}
                  >
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  
                  {/* View Toggle */}
                  <div className={styles.viewToggle}>
                    <button 
                      className={projectsView === 'grid' ? styles.active : ''}
                      onClick={() => setProjectsView('grid')}
                      title="Grid view"
                    >
                      <Icons.grid size={16} />
                    </button>
                    <button 
                      className={projectsView === 'list' ? styles.active : ''}
                      onClick={() => setProjectsView('list')}
                      title="List view"
                    >
                      <Icons.list size={16} />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Compare Mode Instructions */}
              {compareMode && (
                <div className={styles.compareModeBar}>
                  <Icons.compare size={18} />
                  <span>Select 2-4 projects to compare performance, cost, and more</span>
                </div>
              )}
              
              {/* Builds Display */}
              {projectsSort === 'vehicle' && groupedByVehicle ? (
                // Grouped by Vehicle View
                <div className={styles.groupedView}>
                  {groupedByVehicle.map(group => (
                    <div key={group.car.slug} className={styles.vehicleGroup}>
                      <div className={styles.vehicleGroupHeader}>
                        <div className={styles.vehicleGroupThumb}>
                          <CarImage car={group.car} variant="thumbnail" showName={false} />
                        </div>
                        <div className={styles.vehicleGroupInfo}>
                          <h4>{group.car.name}</h4>
                          <span>{group.builds.length} project{group.builds.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div className={projectsView === 'grid' ? styles.projectsFullGrid : styles.projectsList}>
                        {group.builds.map(build => (
                          <ProjectCard 
                            key={build.id}
                            build={build}
                            viewMode={projectsView}
                            compareMode={compareMode}
                            isSelected={selectedForCompare.some(b => b.id === build.id)}
                            onSelect={() => handleSelectForCompare(build)}
                            onLoad={() => handleLoadBuild(build)}
                            onDelete={() => {
                              if (confirm('Delete this project?')) deleteBuild(build.id);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Flat Grid/List View
                <div className={projectsView === 'grid' ? styles.projectsFullGrid : styles.projectsList}>
                  {filteredAndSortedBuilds.map(build => (
                    <ProjectCard 
                      key={build.id}
                      build={build}
                      viewMode={projectsView}
                      compareMode={compareMode}
                      isSelected={selectedForCompare.some(b => b.id === build.id)}
                      onSelect={() => handleSelectForCompare(build)}
                      onLoad={() => handleLoadBuild(build)}
                      onDelete={() => {
                        if (confirm('Delete this project?')) deleteBuild(build.id);
                      }}
                    />
                  ))}
                </div>
              )}
              
              {/* Compare Modal */}
              {showCompareModal && selectedForCompare.length >= 2 && (
                <CompareBuildsModal 
                  builds={selectedForCompare}
                  onClose={() => setShowCompareModal(false)}
                />
              )}
            </div>
          ) : (
            <EmptyState
              icon={Icons.folder}
              title="No Projects Yet"
              description="Start modding a car to create your first project. Your builds will be saved here."
              actionLabel="Start a New Mod"
              onAction={() => handleTabChange('select')}
            />
          )
        )}
      </div>

      {/* Car Picker Modal */}
      <CarPickerModal
        isOpen={showCarPicker}
        onClose={() => setShowCarPicker(false)}
        onSelect={handleSelectCar}
        cars={allCars}
      />
      
      <AuthModal 
        isOpen={authModal.isOpen}
        onClose={authModal.close}
        defaultMode={authModal.defaultMode}
      />

      {/* Onboarding Popup */}
      <OnboardingPopup 
        storageKey="autorev_tuningshop_onboarding_dismissed"
        steps={tuningShopOnboardingSteps}
        accentColor="var(--perf-power)"
      />
    </div>
  );
}

// Loading fallback
function TuningShopLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" />
      </div>
    </div>
  );
}

// Main export with error boundary protection
export default function TuningShopPage() {
  return (
    <ErrorBoundary name="TuningShopPage" featureContext="tuning-shop">
      <Suspense fallback={<TuningShopLoading />}>
        <TuningShopContent />
      </Suspense>
    </ErrorBoundary>
  );
}

