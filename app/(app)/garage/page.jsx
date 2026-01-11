'use client';

/**
 * My Garage Page - Gran Turismo / Forza Inspired
 * 
 * Immersive vehicle showcase with:
 * - Hero display for the selected vehicle
 * - Spec overlay with key stats
 * - Bottom carousel for vehicle navigation
 * - Tab system: My Collection, Favorites, Builds
 */

import React, { useState, useEffect, useRef, Suspense, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { UI_IMAGES } from '@/lib/images';
import styles from './page.module.css';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import AddVehicleModal from '@/components/AddVehicleModal';
import AddFavoritesModal from '@/components/AddFavoritesModal';
import CarImage from '@/components/CarImage';
import CarActionMenu from '@/components/CarActionMenu';
import BuildDetailView from '@/components/BuildDetailView';
import ServiceLogModal from '@/components/ServiceLogModal';
import OnboardingPopup, { garageOnboardingSteps } from '@/components/OnboardingPopup';
import { fetchCars } from '@/lib/carsClient';
import { calculateWeightedScore, ENTHUSIAST_WEIGHTS } from '@/lib/scoring';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { fetchAllMaintenanceData, fetchUserServiceLogs, addServiceLog, updateServiceLog, deleteServiceLog } from '@/lib/maintenanceService';
import { decodeVIN } from '@/lib/vinDecoder';
import { getSafetySummary } from '@/lib/nhtsaSafetyService';
import { calculateAllModificationGains } from '@/lib/upgrades';
import PremiumGate, { usePremiumAccess } from '@/components/PremiumGate';
import WheelTireSpecsCard from '@/components/WheelTireSpecsCard';
import AskALButton from '@/components/AskALButton';
import VehicleHealthCard from '@/components/garage/VehicleHealthCard';
import { useAIChat } from '@/components/AIChatContext';
import ErrorBoundary from '@/components/ErrorBoundary';

// Icon wrapper to prevent browser extension DOM conflicts
// Wrapping SVGs in a span prevents "removeChild" errors when extensions modify the DOM
const IconWrapper = ({ children, style }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 0, ...style }} suppressHydrationWarning>
    {children}
  </span>
);

// Icons
const Icons = {
  car: ({ size = 20, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
        <circle cx="7" cy="17" r="2"/>
        <path d="M9 17h6"/>
        <circle cx="17" cy="17" r="2"/>
      </svg>
    </IconWrapper>
  ),
  chevronDown: ({ size = 20, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </IconWrapper>
  ),
  chevronUp: ({ size = 20, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15"/>
      </svg>
    </IconWrapper>
  ),
  x: ({ size = 20, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </IconWrapper>
  ),
  heart: ({ size = 20, filled = false, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </IconWrapper>
  ),
  wrench: ({ size = 20, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    </IconWrapper>
  ),
  arrowRight: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"/>
        <polyline points="12 5 19 12 12 19"/>
      </svg>
    </IconWrapper>
  ),
  arrowLeft: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"/>
        <polyline points="12 19 5 12 12 5"/>
      </svg>
    </IconWrapper>
  ),
  trash: ({ size = 20, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      </svg>
    </IconWrapper>
  ),
  plus: ({ size = 20, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </IconWrapper>
  ),
  gauge: ({ size = 20, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    </IconWrapper>
  ),
  folder: ({ size = 20, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    </IconWrapper>
  ),
  tool: ({ size = 20, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h4l13-13a2.83 2.83 0 0 0-4-4L3 17v4z"/>
        <path d="M14.5 5.5L18.5 9.5"/>
      </svg>
    </IconWrapper>
  ),
  dollar: ({ size = 20, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    </IconWrapper>
  ),
  settings: ({ size = 20, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    </IconWrapper>
  ),
  chevronLeft: ({ size = 24, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </IconWrapper>
  ),
  chevronRight: ({ size = 24, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </IconWrapper>
  ),
  info: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    </IconWrapper>
  ),
  search: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    </IconWrapper>
  ),
  check: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </IconWrapper>
  ),
  alert: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    </IconWrapper>
  ),
  loader: ({ size = 16, className, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="12" y1="2" x2="12" y2="6"/>
        <line x1="12" y1="18" x2="12" y2="22"/>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
        <line x1="2" y1="12" x2="6" y2="12"/>
        <line x1="18" y1="12" x2="22" y2="12"/>
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
      </svg>
    </IconWrapper>
  ),
  shield: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    </IconWrapper>
  ),
  star: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    </IconWrapper>
  ),
  fire: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
      </svg>
    </IconWrapper>
  ),
  clipboard: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      </svg>
    </IconWrapper>
  ),
  book: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    </IconWrapper>
  ),
  calendar: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    </IconWrapper>
  ),
  edit: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    </IconWrapper>
  ),
  link: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    </IconWrapper>
  ),
  sparkles: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/>
        <path d="M5 3v4"/>
        <path d="M19 17v4"/>
        <path d="M3 5h4"/>
        <path d="M17 19h4"/>
      </svg>
    </IconWrapper>
  ),
  unlock: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
      </svg>
    </IconWrapper>
  ),
  loader: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
        <line x1="12" y1="2" x2="12" y2="6"/>
        <line x1="12" y1="18" x2="12" y2="22"/>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
        <line x1="2" y1="12" x2="6" y2="12"/>
        <line x1="18" y1="12" x2="22" y2="12"/>
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
      </svg>
    </IconWrapper>
  ),
  alertCircle: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    </IconWrapper>
  ),
  refresh: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"/>
        <polyline points="1 20 1 14 7 14"/>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
      </svg>
    </IconWrapper>
  ),
};

// Brand Logo Component - displays brand name with consistent gold color
function BrandLogo({ brand }) {
  // Use consistent gold/yellow color for all brands in garage view
  const brandColor = 'var(--sn-gold, #c4a564)';

  return (
    <div className={styles.brandLogo}>
      <span className={styles.brandName} style={{ color: brandColor }}>
        {brand?.toUpperCase()}
      </span>
    </div>
  );
}

// Hero Vehicle Display Component
// Progressive disclosure: Collapsed → Expanded (key info) → Full Details/Owner Dashboard
function HeroVehicleDisplay({ item, type, onAction, onAddToMyCars, isInMyCars, onUpdateVehicle, onClearModifications, onUpdateCustomSpecs, onClearCustomSpecs, userId }) {
  // Panel states: 'collapsed', 'expanded', 'details'
  const [panelState, setPanelState] = useState('collapsed');
  const [showPerformance, setShowPerformance] = useState(false);
  
  // For owned vehicles: toggle between views in details mode
  // 'specs' = Details, 'reference' = Reference, 'safety' = Safety, 'service' = Service Log
  const [detailsView, setDetailsView] = useState('specs');
  
  // VIN input state
  const [vinInput, setVinInput] = useState('');
  const [vinLookupLoading, setVinLookupLoading] = useState(false);
  const [vinData, setVinData] = useState(null);
  const [vinError, setVinError] = useState(null);
  const [vinSaveStatus, setVinSaveStatus] = useState(null); // 'saving', 'saved', 'error', null
  
  // Maintenance data for owned vehicles
  const [maintenanceData, setMaintenanceData] = useState({ specs: null, issues: [], intervals: [] });
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);
  
  // Wheel/tire fitment options
  const [fitmentOptions, setFitmentOptions] = useState([]);
  const [showFitmentOptions, setShowFitmentOptions] = useState(false);
  
  // Safety data (recalls, complaints, ratings)
  const [safetyData, setSafetyData] = useState({ recalls: [], complaints: [], investigations: [], safetyRatings: null });
  const [loadingSafety, setLoadingSafety] = useState(false);
  
  // Service logs
  const [serviceLogs, setServiceLogs] = useState([]);
  const [loadingServiceLogs, setLoadingServiceLogs] = useState(false);
  const [showServiceLogModal, setShowServiceLogModal] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [deletingLogId, setDeletingLogId] = useState(null);
  
  // Daily driver enrichment state
  const [enrichmentData, setEnrichmentData] = useState(null);
  const [enrichmentStatus, setEnrichmentStatus] = useState('none'); // 'none', 'checking', 'available', 'enriching', 'enriched', 'error'
  const [enrichmentError, setEnrichmentError] = useState(null);
  
  // Initialize VIN from vehicle data (reset all VIN state when vehicle changes)
  useEffect(() => {
    // Always reset VIN state when the selected vehicle changes
    // This prevents VIN from one car persisting on another
    setVinData(null);
    setVinError(null);
    
    if (type === 'mycars' && item?.vehicle?.vin) {
      setVinInput(item.vehicle.vin);
    } else {
      setVinInput('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, item?.vehicle?.id]); // Key off vehicle ID, not just VIN
  
  // Reset maintenance & safety data when car changes to prevent stale data showing
  useEffect(() => {
    // Reset all car-specific data when switching vehicles
    setMaintenanceData({ specs: null, issues: [], intervals: [] });
    setFitmentOptions([]);
    setSafetyData({ recalls: [], complaints: [], investigations: [], safetyRatings: null });
    setServiceLogs([]);
    // Reset enrichment data
    setEnrichmentData(null);
    setEnrichmentStatus('none');
    setEnrichmentError(null);
  }, [item?.vehicle?.id, item?.matchedCar?.slug]);
  
  // Check enrichment status for unmatched vehicles (daily drivers)
  useEffect(() => {
    const checkEnrichmentStatus = async () => {
      if (type !== 'mycars') return;
      
      // Only check for unmatched vehicles (daily drivers)
      const hasMatchedCar = item?.vehicle?.matchedCarSlug || item?.matchedCar?.slug;
      if (hasMatchedCar && !item?.matchedCar?._hasNoMatchedCar) return;
      
      const vehicleId = item?.vehicle?.id;
      if (!vehicleId) return;
      
      setEnrichmentStatus('checking');
      
      try {
        const response = await fetch(`/api/garage/enrich?vehicleId=${vehicleId}`);
        const data = await response.json();
        
        if (data.success) {
          if (data.enrichment) {
            setEnrichmentData(data.enrichment);
            setEnrichmentStatus('enriched');
            // Also populate maintenance data from enrichment
            if (data.enrichment.maintenance_specs || data.enrichment.service_intervals || data.enrichment.known_issues) {
              setMaintenanceData({
                specs: data.enrichment.maintenance_specs || null,
                intervals: data.enrichment.service_intervals || [],
                issues: data.enrichment.known_issues || [],
              });
            }
          } else if (data.sharedEnrichmentAvailable) {
            setEnrichmentStatus('available');
          } else {
            setEnrichmentStatus('none');
          }
        } else {
          setEnrichmentStatus('none');
        }
      } catch (err) {
        console.error('[HeroVehicleDisplay] Error checking enrichment:', err);
        setEnrichmentStatus('none');
      }
    };
    
    checkEnrichmentStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, item?.vehicle?.id, item?.vehicle?.matchedCarSlug, item?.matchedCar?._hasNoMatchedCar]);
  
  // Fetch maintenance data for owned vehicles (when in expanded or details state)
  useEffect(() => {
    const loadMaintenanceData = async () => {
      if (type !== 'mycars') return;
      if (panelState !== 'expanded' && panelState !== 'details') return;
      
      const carSlug = item?.matchedCar?.slug || item?.vehicle?.matchedCarSlug;
      if (!carSlug) return;
      const carVariantKey = item?.vehicle?.matchedCarVariantKey || null;
      
      setLoadingMaintenance(true);
      try {
        const data = await fetchAllMaintenanceData(carSlug, { carVariantKey });
        setMaintenanceData(data);
      } catch (err) {
        console.error('[HeroVehicleDisplay] Error loading maintenance:', err);
      } finally {
        setLoadingMaintenance(false);
      }
    };
    
    loadMaintenanceData();
  }, [type, panelState, item?.matchedCar?.slug, item?.vehicle?.matchedCarSlug, item?.vehicle?.matchedCarVariantKey]);

  // Fetch wheel/tire fitment options when panel is expanded
  useEffect(() => {
    const loadFitmentOptions = async () => {
      if (type !== 'mycars') return;
      if (panelState !== 'expanded' && panelState !== 'details') return;
      
      // NOTE: car_slug column was removed from wheel_tire_fitment_options (2026-01-11)
      // Use car_id from matched car, or resolve from slug
      const carId = item?.matchedCar?.id || item?.vehicle?.matchedCarId;
      const carSlug = item?.matchedCar?.slug || item?.vehicle?.matchedCarSlug;
      
      if (!carId && !carSlug) return;
      
      try {
        // If we have carId, use it directly; otherwise resolve from slug
        let resolvedCarId = carId;
        if (!resolvedCarId && carSlug) {
          const { data: carData } = await supabase
            .from('cars')
            .select('id')
            .eq('slug', carSlug)
            .single();
          resolvedCarId = carData?.id;
        }
        
        if (!resolvedCarId) return;
        
        const { data, error } = await supabase
          .from('wheel_tire_fitment_options')
          .select('*')
          .eq('car_id', resolvedCarId)
          .order('fitment_type', { ascending: true });
        
        if (!error && data) {
          // Sort by fitment type priority: oem first, then upgrades
          const sortOrder = { oem: 1, oem_optional: 2, plus_one: 3, plus_two: 4, square: 5, aggressive: 6, conservative: 7 };
          data.sort((a, b) => (sortOrder[a.fitment_type] || 99) - (sortOrder[b.fitment_type] || 99));
          setFitmentOptions(data);
        }
      } catch (err) {
        console.error('[HeroVehicleDisplay] Error loading fitment options:', err);
      }
    };
    
    loadFitmentOptions();
  }, [type, panelState, item?.matchedCar?.id, item?.matchedCar?.slug, item?.vehicle?.matchedCarId, item?.vehicle?.matchedCarSlug]);
  
  // Fetch safety data when vehicle info is available
  useEffect(() => {
    const loadSafetyData = async () => {
      if (type !== 'mycars') return;
      if (panelState !== 'details' || detailsView !== 'safety') return;
      
      const vehicle = item?.vehicle;
      if (!vehicle) return;
      
      setLoadingSafety(true);
      try {
        const res = await fetch('/api/vin/safety', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vin: vehicle.vin,
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
          }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(json?.error || 'Failed to fetch safety data');
        }
        setSafetyData(json || { recalls: [], complaints: [], investigations: [], safetyRatings: null });
      } catch (err) {
        console.error('[HeroVehicleDisplay] Error loading safety data:', err);
      } finally {
        setLoadingSafety(false);
      }
    };
    
    loadSafetyData();
  }, [type, panelState, detailsView, item?.vehicle]);

  // Fetch service logs from database when service tab is opened
  useEffect(() => {
    let timeoutId;
    let isMounted = true;
    
    const loadServiceLogs = async () => {
      if (type !== 'mycars') return;
      if (panelState !== 'details' || detailsView !== 'service') return;
      
      const vehicleId = item?.vehicle?.id;
      if (!vehicleId || !userId) return;
      
      setLoadingServiceLogs(true);
      try {
        // Create a timeout promise that rejects after 10 seconds
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Request timeout - loading service records took too long'));
          }, 10000);
        });
        
        // Race between the fetch and the timeout
        const result = await Promise.race([
          fetchUserServiceLogs(vehicleId, userId),
          timeoutPromise
        ]);
        
        // Clear timeout if fetch succeeded
        if (timeoutId) clearTimeout(timeoutId);
        
        if (!isMounted) return;
        
        const { data, error } = result;
        if (error) {
          console.error('[HeroVehicleDisplay] Error loading service logs:', error);
        }
        setServiceLogs(data || []);
      } catch (err) {
        console.error('[HeroVehicleDisplay] Unexpected error loading service logs:', err);
        if (isMounted) {
          // Set empty array on error so UI shows "No service records" instead of hanging
          setServiceLogs([]);
        }
      } finally {
        if (isMounted) {
          setLoadingServiceLogs(false);
        }
      }
    };
    
    loadServiceLogs();
    
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [type, panelState, detailsView, item?.vehicle?.id, userId]);
  
  // VIN Lookup handler - uses real NHTSA API
  const handleVinLookup = async () => {
    if (!vinInput || vinInput.length !== 17) return;
    
    setVinLookupLoading(true);
    setVinError(null);
    
    try {
      const decoded = await decodeVIN(vinInput);
      
      if (!decoded.success) {
        setVinError(decoded.error || 'Failed to decode VIN');
        setVinData(null);
        return;
      }
      
      setVinData({
        vin: decoded.vin,
        decoded: true,
        manufacturer: decoded.manufacturerName,
        modelYear: decoded.year,
        make: decoded.make,
        model: decoded.model,
        trim: decoded.trim,
        engine: decoded.engineDisplacement ? `${decoded.engineDisplacement}L ${decoded.engineCylinders ? `V${decoded.engineCylinders}` : ''}` : null,
        transmission: decoded.transmission,
        drivetrain: decoded.driveType,
        bodyStyle: decoded.bodyClass,
        fuelType: decoded.fuelType,
        plantCountry: decoded.plantCountry,
        engineHP: decoded.engineHP,
        vehicleType: decoded.vehicleType,
        raw: decoded.raw,
      });

      // Persist VIN decode + attempt to resolve an exact car_variant match
      if (isOwnedVehicle && item?.vehicle?.id && typeof onUpdateVehicle === 'function') {
        setVinSaveStatus('saving');
        try {
          const res = await fetch('/api/vin/resolve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              decoded: {
                success: true,
                year: decoded.year,
                make: decoded.make,
                model: decoded.model,
                trim: decoded.trim,
                series: decoded.series,
                driveType: decoded.driveType,
                transmission: decoded.transmission,
              },
            }),
          });
          const json = await res.json();
          const match = json?.match || null;

          // Save VIN data to database - year/make/model/trim from VIN decode for accuracy
          const updateResult = await onUpdateVehicle(item.vehicle.id, {
            vin: decoded.vin,
            year: decoded.year,
            make: decoded.make,
            model: decoded.model,
            trim: decoded.trim || item.vehicle.trim, // Keep existing trim if VIN doesn't provide one
            vinDecodeData: decoded.raw,
            // Do not override a manually-selected car slug unless missing.
            matchedCarSlug: item.vehicle.matchedCarSlug || match?.carSlug,
            matchedCarVariantId: match?.carVariantId || null,
            matchedCarVariantKey: match?.carVariantKey || null,
            vinMatchConfidence: match?.confidence ?? null,
            vinMatchNotes: Array.isArray(match?.reasons) ? match.reasons.join(', ') : null,
            vinMatchedAt: new Date().toISOString(),
          });
          
          if (updateResult?.error) {
            console.error('[VIN Lookup] Database update failed:', updateResult.error);
            setVinSaveStatus('error');
          } else {
            console.log('[VIN Lookup] VIN data saved successfully:', { 
              vin: decoded.vin, 
              year: decoded.year, 
              make: decoded.make, 
              model: decoded.model 
            });
            setVinSaveStatus('saved');
            // Clear saved status after 3 seconds
            setTimeout(() => setVinSaveStatus(null), 3000);
          }
        } catch (err) {
          console.warn('[VIN Lookup] Failed to persist VIN/variant match:', err);
          setVinSaveStatus('error');
        }
      }
      
      // Also fetch safety data with the decoded VIN
      if (decoded.year && decoded.make && decoded.model) {
        const res = await fetch('/api/vin/safety', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vin: decoded.vin,
            year: decoded.year,
            make: decoded.make,
            model: decoded.model,
          }),
        });
        const json = await res.json().catch(() => null);
        if (res.ok) {
          setSafetyData(json || { recalls: [], complaints: [], investigations: [], safetyRatings: null });
        }
      }
    } catch (err) {
      console.error('[VIN Lookup] Error:', err);
      setVinError('Failed to decode VIN. Please try again.');
    } finally {
      setVinLookupLoading(false);
    }
  };

  // Handle daily driver enrichment
  const handleEnrichVehicle = async () => {
    const vehicleId = item?.vehicle?.id;
    if (!vehicleId) return;
    
    setEnrichmentStatus('enriching');
    setEnrichmentError(null);
    
    try {
      const response = await fetch('/api/garage/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEnrichmentData(data.enrichment);
        setEnrichmentStatus('enriched');
        
        // Populate maintenance data from enrichment
        if (data.enrichment) {
          setMaintenanceData({
            specs: data.enrichment.maintenance_specs || null,
            intervals: data.enrichment.service_intervals || [],
            issues: data.enrichment.known_issues || [],
          });
        }
      } else {
        setEnrichmentError(data.error || 'Enrichment failed');
        setEnrichmentStatus('error');
      }
    } catch (err) {
      console.error('[HeroVehicleDisplay] Enrichment error:', err);
      setEnrichmentError('Failed to enrich vehicle. Please try again.');
      setEnrichmentStatus('error');
    }
  };

  // Service log handlers
  const handleSaveServiceLog = async (logData) => {
    const vehicleId = item?.vehicle?.id;
    if (!vehicleId || !userId) {
      throw new Error('Vehicle or user information missing');
    }

    if (editingLog) {
      // Update existing log
      const { data, error } = await updateServiceLog(editingLog.id, userId, logData);
      if (error) {
        console.error('[ServiceLog] Update error:', error);
        throw error;
      }
      // Update local state
      setServiceLogs(prev => prev.map(log => log.id === editingLog.id ? data : log));
      setEditingLog(null);
    } else {
      // Add new log
      const { data, error } = await addServiceLog(vehicleId, userId, logData);
      if (error) {
        console.error('[ServiceLog] Add error:', error);
        throw error;
      }
      // Prepend to local state (most recent first)
      setServiceLogs(prev => [data, ...prev]);
    }
  };

  const handleEditServiceLog = (log) => {
    setEditingLog(log);
    setShowServiceLogModal(true);
  };

  const handleDeleteServiceLog = async (logId) => {
    if (!userId) return;
    
    setDeletingLogId(logId);
    try {
      const { error } = await deleteServiceLog(logId, userId);
      if (error) {
        console.error('[ServiceLog] Delete error:', error);
        return;
      }
      // Remove from local state
      setServiceLogs(prev => prev.filter(log => log.id !== logId));
    } finally {
      setDeletingLogId(null);
    }
  };

  const handleCloseServiceLogModal = () => {
    setShowServiceLogModal(false);
    setEditingLog(null);
  };
  
  // Determine what data we're showing based on type
  // For daily drivers with enrichment, merge the enrichment image into the car object
  // NOTE: useMemo must be called before any early returns (React hooks rules)
  const baseCar = type === 'projects' ? item?.car : (item?.matchedCar || item);
  const car = useMemo(() => {
    if (!baseCar) return null;
    if (enrichmentData?.image_url && baseCar?._hasNoMatchedCar) {
      return { ...baseCar, imageGarageUrl: enrichmentData.image_url };
    }
    return baseCar;
  }, [baseCar, enrichmentData?.image_url]);

  if (!item) return null;
  
  const isOwnedVehicle = type === 'mycars';
  const isBuild = type === 'projects';
  const isFavorite = type === 'favorites';
  
  // Calculate all modification gains from installed mods (for owned vehicles)
  const modificationGains = isOwnedVehicle && item.vehicle?.installedModifications?.length > 0
    ? calculateAllModificationGains(item.vehicle.installedModifications, car)
    : { hpGain: 0, torqueGain: 0, zeroToSixtyImprovement: 0, brakingImprovement: 0, lateralGImprovement: 0 };

  // Get display name
  const displayName = isOwnedVehicle 
    ? (item.vehicle?.nickname || `${item.vehicle?.make} ${item.vehicle?.model}`)
    : isBuild 
      ? (item.name || `${car?.name} Build`)
      : car?.name;

  // Extract brand from car data or name
  const getBrand = () => {
    // Use brand from car object if available (from database)
    if (car?.brand) return car.brand;
    
    // Check owned vehicle make
    if (isOwnedVehicle && item.vehicle?.make) {
      return item.vehicle.make;
    }
    
    // Fallback to name parsing
    const name = displayName || '';
    const brandMap = {
      '718': 'Porsche', '911': 'Porsche', '981': 'Porsche', '991': 'Porsche', 
      '992': 'Porsche', '997': 'Porsche', '987': 'Porsche', 'Cayman': 'Porsche',
      'BMW': 'BMW', 'M2': 'BMW', 'M3': 'BMW', 'M4': 'BMW',
      'Audi': 'Audi', 'RS': 'Audi', 'S3': 'Audi', 'S4': 'Audi',
      'Toyota': 'Toyota', 'Supra': 'Toyota', 'GR86': 'Toyota',
      'Nissan': 'Nissan', 'GT-R': 'Nissan', '370Z': 'Nissan', 'Z': 'Nissan',
      'Subaru': 'Subaru', 'WRX': 'Subaru', 'BRZ': 'Subaru', 'STI': 'Subaru',
      'Mazda': 'Mazda', 'MX-5': 'Mazda', 'Miata': 'Mazda', 'RX-7': 'Mazda',
      'Honda': 'Honda', 'Civic': 'Honda', 'S2000': 'Honda', 'NSX': 'Honda',
      'Chevrolet': 'Chevrolet', 'Corvette': 'Chevrolet', 'Camaro': 'Chevrolet',
      'Ford': 'Ford', 'Mustang': 'Ford', 'Focus': 'Ford', 'GT': 'Ford',
      'Dodge': 'Dodge', 'Challenger': 'Dodge', 'Charger': 'Dodge', 'Viper': 'Dodge',
      'Mercedes': 'Mercedes', 'AMG': 'Mercedes',
    };
    
    for (const [key, brand] of Object.entries(brandMap)) {
      if (name.includes(key)) return brand;
    }
    return name.split(' ')[0];
  };

  const brand = getBrand();

  // Get sub-info text (year only, category in details)
  // For owned vehicles: prefer VIN-decoded year if available, otherwise use stored year
  const getSubInfo = () => {
    if (isOwnedVehicle) {
      // Use VIN-decoded year if available (most accurate)
      const vinYear = vinData?.modelYear;
      const storedYear = item.vehicle?.year;
      
      // Show VIN year with "updated" indicator if it differs from stored
      if (vinYear && vinYear !== storedYear) {
        return vinYear;
      }
      
      return storedYear || '';
    }
    if (car?.years) return car.years;
    return '';
  };

  // Toggle panel state
  const togglePanel = () => {
    if (panelState === 'collapsed') {
      setPanelState('expanded');
    } else if (panelState === 'expanded') {
      setPanelState('collapsed');
    } else {
      setPanelState('expanded');
    }
  };

  return (
    <div className={styles.heroDisplay}>
      {/* Hero Image - Uses exclusive garage images (premium studio photography) */}
      <div className={styles.heroImageWrapper}>
        <div className={styles.heroImageContainer}>
          {car ? (
            <CarImage car={car} variant="garage" className={styles.heroImage} lazy={false} />
          ) : (
            <div className={styles.heroPlaceholder}>
              <Icons.car size={120} />
            </div>
          )}
        </div>
        
        {/* Mobile Quick Action Bar - Inside image container, below car */}
        {/* Uses same mobileActionBar styles for consistency */}
        {panelState !== 'details' && (
          <div className={styles.mobileActionBar}>
            <button 
              className={styles.mobileActionBtn}
              onClick={() => {
                setDetailsView('specs');
                setPanelState('details');
              }}
            >
              <Icons.info size={18} />
              <span>Details</span>
            </button>
            {isOwnedVehicle && (
              <>
                <button 
                  className={styles.mobileActionBtn}
                  onClick={() => {
                    setDetailsView('reference');
                    setPanelState('details');
                  }}
                >
                  <Icons.book size={18} />
                  <span>Reference</span>
                </button>
                <button 
                  className={styles.mobileActionBtn}
                  onClick={() => {
                    setDetailsView('safety');
                    setPanelState('details');
                  }}
                >
                  <Icons.shield size={18} />
                  <span>Safety</span>
                </button>
                <button 
                  className={styles.mobileActionBtn}
                  onClick={() => {
                    setDetailsView('service');
                    setPanelState('details');
                  }}
                >
                  <Icons.clipboard size={18} />
                  <span>Service</span>
                </button>
                <button 
                  className={styles.mobileActionBtn}
                  onClick={() => {
                    setDetailsView('health');
                    setPanelState('details');
                  }}
                >
                  <Icons.gauge size={18} />
                  <span>Health</span>
                </button>
              </>
            )}
          </div>
        )}
        
        {/* Gradient overlay for readability */}
        <div className={styles.heroGradient} />
      </div>

      {/* Mobile Action Bar - Horizontal below car image, only visible on mobile in details mode */}
      {panelState === 'details' && isOwnedVehicle && (
        <div className={styles.mobileActionBar}>
          <button 
            className={`${styles.mobileActionBtn} ${detailsView === 'specs' ? styles.mobileActionBtnActive : ''}`}
            onClick={() => setDetailsView('specs')}
          >
            <Icons.info size={18} />
            <span>Details</span>
          </button>
          <button 
            className={`${styles.mobileActionBtn} ${detailsView === 'reference' ? styles.mobileActionBtnActive : ''}`}
            onClick={() => setDetailsView('reference')}
          >
            <Icons.book size={18} />
            <span>Reference</span>
          </button>
          <button 
            className={`${styles.mobileActionBtn} ${detailsView === 'safety' ? styles.mobileActionBtnActive : ''}`}
            onClick={() => setDetailsView('safety')}
          >
            <Icons.shield size={18} />
            <span>Safety</span>
          </button>
          <button 
            className={`${styles.mobileActionBtn} ${detailsView === 'service' ? styles.mobileActionBtnActive : ''}`}
            onClick={() => setDetailsView('service')}
          >
            <Icons.clipboard size={18} />
            <span>Service</span>
          </button>
          <button 
            className={`${styles.mobileActionBtn} ${detailsView === 'health' ? styles.mobileActionBtnActive : ''}`}
            onClick={() => setDetailsView('health')}
          >
            <Icons.gauge size={18} />
            <span>Health</span>
          </button>
        </div>
      )}

      {/* Spec Panel - Left Side with consistent transparency */}
      <div className={`${styles.specPanel} ${styles[`specPanel_${panelState}`]}`}>
        {/* Header - Always visible */}
        <div className={styles.specPanelHeader}>
          <div className={styles.specPanelHeaderInfo}>
            <BrandLogo brand={brand} />
            <div className={styles.heroVehicleNameRow}>
              <h2 className={styles.heroVehicleName}>{displayName}</h2>
              {/* Modified badge for owned vehicles with modifications */}
              {isOwnedVehicle && item.vehicle?.isModified && (
                <span className={styles.modifiedBadge}>
                  <Icons.wrench size={12} />
                  MODIFIED
                  {item.vehicle.totalHpGain > 0 && (
                    <span className={styles.modifiedHpGain}>+{item.vehicle.totalHpGain} HP</span>
                  )}
                </span>
              )}
            </div>
            <p className={styles.heroSubInfo}>{getSubInfo()}</p>
          </div>
          <div className={styles.headerActions}>
            {/* View toggle for owned vehicles in details mode - 4 tabs */}
            {panelState === 'details' && isOwnedVehicle && (
              <div className={styles.headerViewToggle}>
                <button 
                  className={`${styles.headerToggleBtn} ${detailsView === 'specs' ? styles.headerToggleActive : ''}`}
                  onClick={() => setDetailsView('specs')}
                  title="Vehicle Details"
                >
                  <Icons.info size={12} />
                  <span>Details</span>
                </button>
                <button 
                  className={`${styles.headerToggleBtn} ${detailsView === 'reference' ? styles.headerToggleActive : ''}`}
                  onClick={() => setDetailsView('reference')}
                  title="Owner's Reference"
                >
                  <Icons.book size={12} />
                  <span>Reference</span>
                </button>
                <button 
                  className={`${styles.headerToggleBtn} ${detailsView === 'safety' ? styles.headerToggleActive : ''}`}
                  onClick={() => setDetailsView('safety')}
                  title="Safety & Recalls"
                >
                  <Icons.shield size={12} />
                  <span>Safety</span>
                </button>
                <button 
                  className={`${styles.headerToggleBtn} ${detailsView === 'service' ? styles.headerToggleActive : ''}`}
                  onClick={() => setDetailsView('service')}
                  title="Service Log"
                >
                  <Icons.clipboard size={12} />
                  <span>Service</span>
                </button>
                <button 
                  className={`${styles.headerToggleBtn} ${detailsView === 'mods' ? styles.headerToggleActive : ''}`}
                  onClick={() => setDetailsView('mods')}
                  title="Modifications"
                >
                  <Icons.wrench size={12} />
                  <span>Mods</span>
                  {item.vehicle?.isModified && (
                    <span className={styles.tabBadge}>{item.vehicle.installedModifications?.length || 0}</span>
                  )}
                </button>
                <button 
                  className={`${styles.headerToggleBtn} ${detailsView === 'health' ? styles.headerToggleActive : ''}`}
                  onClick={() => setDetailsView('health')}
                  title="Vehicle Health"
                >
                  <Icons.gauge size={12} />
                  <span>Health</span>
                </button>
              </div>
            )}
            <button 
              className={styles.collapseToggle}
              onClick={() => {
                if (panelState === 'details') setPanelState('expanded');
                else if (panelState === 'expanded') setPanelState('collapsed');
                else setPanelState('expanded');
              }}
              title={panelState === 'collapsed' ? 'Expand' : panelState === 'expanded' ? 'Collapse' : 'Back to summary'}
            >
              {panelState === 'collapsed' && <Icons.chevronDown size={16} />}
              {panelState === 'expanded' && <Icons.chevronUp size={16} />}
              {panelState === 'details' && <Icons.chevronLeft size={16} />}
            </button>
          </div>
        </div>

        {/* Expanded Content - Key Specs + Actions */}
        {panelState === 'expanded' && (
          <div className={styles.specPanelBody}>
            {/* Key Stats Grid */}
            <div className={styles.specGrid}>
              {car?.hp && (
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Power</span>
                  <span className={styles.specValue}>
                    {isOwnedVehicle && modificationGains.hpGain > 0 
                      ? `${car.hp + modificationGains.hpGain} HP`
                      : `${car.hp} HP`
                    }
                    {isOwnedVehicle && modificationGains.hpGain > 0 && (
                      <span className={styles.modifiedIndicator}> (+{modificationGains.hpGain})</span>
                    )}
                  </span>
                </div>
              )}
              {car?.zeroToSixty && (
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>0-60</span>
                  <span className={styles.specValue}>
                    {isOwnedVehicle && modificationGains.zeroToSixtyImprovement > 0
                      ? `${(car.zeroToSixty - modificationGains.zeroToSixtyImprovement).toFixed(1)}s`
                      : `${car.zeroToSixty}s`
                    }
                    {isOwnedVehicle && modificationGains.zeroToSixtyImprovement > 0 && (
                      <span className={styles.modifiedIndicator}> (-{modificationGains.zeroToSixtyImprovement}s)</span>
                    )}
                  </span>
                </div>
              )}
              {car?.torque && (
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Torque</span>
                  <span className={styles.specValue}>
                    {isOwnedVehicle && modificationGains.torqueGain > 0
                      ? `${car.torque + modificationGains.torqueGain} lb-ft`
                      : `${car.torque} lb-ft`
                    }
                    {isOwnedVehicle && modificationGains.torqueGain > 0 && (
                      <span className={styles.modifiedIndicator}> (+{modificationGains.torqueGain})</span>
                    )}
                  </span>
                </div>
              )}
              {car?.drivetrain && (
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Layout</span>
                  <span className={styles.specValue}>{car.drivetrain}</span>
                </div>
              )}
              {isOwnedVehicle && item.vehicle?.mileage && (
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Miles</span>
                  <span className={styles.specValue}>{item.vehicle.mileage.toLocaleString()}</span>
                </div>
              )}
              {isBuild && (
                <>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Mods</span>
                    <span className={styles.specValue}>{item.upgrades?.length || 0}</span>
                  </div>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>+HP</span>
                    <span className={styles.specValue}>+{item.totalHpGain || 0}</span>
                  </div>
                </>
              )}
            </div>

            {/* Quick link to reference */}
            {isOwnedVehicle && !car?._hasNoMatchedCar && (
              <div className={styles.variantMatchRow}>
                <button
                  className={styles.variantMatchLink}
                  onClick={() => {
                    setPanelState('details');
                    setDetailsView('reference');
                  }}
                  title="Open Owner Reference"
                >
                  <Icons.book size={14} />
                  <span>Reference</span>
                </button>
              </div>
            )}

            {/* Daily Driver Enrichment Prompt */}
            {isOwnedVehicle && car?._hasNoMatchedCar && enrichmentStatus !== 'enriched' && (
              <div className={styles.enrichmentPrompt}>
                {enrichmentStatus === 'none' || enrichmentStatus === 'available' ? (
                  <>
                    <div className={styles.enrichmentPromptText}>
                      <Icons.sparkles size={16} />
                      <span>Unlock maintenance specs, service intervals, and more</span>
                    </div>
                    <button
                      className={styles.enrichmentButton}
                      onClick={handleEnrichVehicle}
                    >
                      <Icons.unlock size={14} />
                      Unlock Full Details
                    </button>
                  </>
                ) : enrichmentStatus === 'checking' ? (
                  <div className={styles.enrichmentPromptText}>
                    <Icons.loader size={16} />
                    <span>Checking for data...</span>
                  </div>
                ) : enrichmentStatus === 'enriching' ? (
                  <div className={styles.enrichmentPromptText}>
                    <Icons.loader size={16} />
                    <span>Researching your vehicle...</span>
                  </div>
                ) : enrichmentStatus === 'error' ? (
                  <>
                    <div className={styles.enrichmentPromptText}>
                      <Icons.alertCircle size={16} />
                      <span>{enrichmentError || 'Something went wrong'}</span>
                    </div>
                    <button
                      className={styles.enrichmentButton}
                      onClick={handleEnrichVehicle}
                    >
                      <Icons.refresh size={14} />
                      Try Again
                    </button>
                  </>
                ) : null}
              </div>
            )}

            {/* Enrichment Success Indicator */}
            {isOwnedVehicle && car?._hasNoMatchedCar && enrichmentStatus === 'enriched' && (
              <div className={styles.enrichmentSuccess}>
                <Icons.check size={14} />
                <span>Full details available</span>
              </div>
            )}

            {/* Action Row - See Details + Action Icons */}
            <div className={styles.expandedActionsRow}>
              {/* See Details button */}
              <button 
                className={styles.seeDetailsBtn}
                onClick={() => setPanelState('details')}
                title="See Details"
              >
                <Icons.info size={14} />
                <span>See Details</span>
              </button>
              
              {/* Compact Action Buttons - All 5 icons for consistency */}
              {car && (
                <CarActionMenu 
                  car={car} 
                  variant="compact" 
                  theme="dark"
                  hideActions={[]}
                />
              )}
            </div>
          </div>
        )}

        {/* Full Details - Consistent view for all, with Owner's Reference toggle for My Collection */}
        {panelState === 'details' && car && (
          <div className={styles.specPanelBody}>
            {/* Vehicle Details View - Same for both My Collection and Favorites */}
            {(!isOwnedVehicle || detailsView === 'specs') && (
              <>
                {/* Summary/Tagline at top */}
                {car.tagline && (
                  <p className={styles.detailsSummary}>{car.tagline}</p>
                )}

                {/* Main Specs Grid - wider blocks */}
                <div className={styles.fullDetailsInPanel}>
                  {/* Performance */}
                  <div className={styles.detailBlock}>
                    <h4 className={styles.detailBlockTitle}>
                      <span>Performance</span>
                      {isOwnedVehicle && item.vehicle?.isModified && (
                        <span className={styles.modifiedBadgeSmall}>
                          <Icons.wrench size={10} />
                          MODIFIED
                        </span>
                      )}
                      <AskALButton 
                        category="Performance"
                        prompt={`Tell me about the performance capabilities of my ${car?.name || 'car'}. How does it compare to competitors, and what are its strengths on the street and track?`}
                        carName={car?.name}
                      />
                    </h4>
                    <div className={styles.detailBlockItems}>
                      {car.hp && (
                        <div className={styles.detailBlockItem}>
                          <span>Horsepower</span>
                          <span className={isOwnedVehicle && modificationGains.hpGain > 0 ? styles.modifiedValue : ''}>
                            {isOwnedVehicle && modificationGains.hpGain > 0 
                              ? `${car.hp + modificationGains.hpGain} HP`
                              : `${car.hp} HP`
                            }
                            {isOwnedVehicle && modificationGains.hpGain > 0 && (
                              <span className={styles.modifiedIndicator}> (+{modificationGains.hpGain})</span>
                            )}
                          </span>
                        </div>
                      )}
                      {car.torque && (
                        <div className={styles.detailBlockItem}>
                          <span>Torque</span>
                          <span className={isOwnedVehicle && modificationGains.torqueGain > 0 ? styles.modifiedValue : ''}>
                            {isOwnedVehicle && modificationGains.torqueGain > 0
                              ? `${car.torque + modificationGains.torqueGain} lb-ft`
                              : `${car.torque} lb-ft`
                            }
                            {isOwnedVehicle && modificationGains.torqueGain > 0 && (
                              <span className={styles.modifiedIndicator}> (+{modificationGains.torqueGain})</span>
                            )}
                          </span>
                        </div>
                      )}
                      {car.zeroToSixty && (
                        <div className={styles.detailBlockItem}>
                          <span>0-60 mph</span>
                          <span className={isOwnedVehicle && modificationGains.zeroToSixtyImprovement > 0 ? styles.modifiedValue : ''}>
                            {isOwnedVehicle && modificationGains.zeroToSixtyImprovement > 0
                              ? `${(car.zeroToSixty - modificationGains.zeroToSixtyImprovement).toFixed(1)}s`
                              : `${car.zeroToSixty}s`
                            }
                            {isOwnedVehicle && modificationGains.zeroToSixtyImprovement > 0 && (
                              <span className={styles.modifiedIndicator}> (-{modificationGains.zeroToSixtyImprovement}s)</span>
                            )}
                          </span>
                        </div>
                      )}
                      {car.quarterMile && <div className={styles.detailBlockItem}><span>1/4 Mile</span><span>{car.quarterMile}s</span></div>}
                      {car.braking60To0 && (
                        <div className={styles.detailBlockItem}>
                          <span>60-0 Braking</span>
                          <span className={isOwnedVehicle && modificationGains.brakingImprovement > 0 ? styles.modifiedValue : ''}>
                            {isOwnedVehicle && modificationGains.brakingImprovement > 0
                              ? `${car.braking60To0 - modificationGains.brakingImprovement} ft`
                              : `${car.braking60To0} ft`
                            }
                            {isOwnedVehicle && modificationGains.brakingImprovement > 0 && (
                              <span className={styles.modifiedIndicator}> (-{modificationGains.brakingImprovement} ft)</span>
                            )}
                          </span>
                        </div>
                      )}
                      {car.lateralG && (
                        <div className={styles.detailBlockItem}>
                          <span>Lateral G</span>
                          <span className={isOwnedVehicle && modificationGains.lateralGImprovement > 0 ? styles.modifiedValue : ''}>
                            {isOwnedVehicle && modificationGains.lateralGImprovement > 0
                              ? `${(car.lateralG + modificationGains.lateralGImprovement).toFixed(2)}g`
                              : `${car.lateralG}g`
                            }
                            {isOwnedVehicle && modificationGains.lateralGImprovement > 0 && (
                              <span className={styles.modifiedIndicator}> (+{modificationGains.lateralGImprovement}g)</span>
                            )}
                          </span>
                        </div>
                      )}
                      {car.topSpeed && <div className={styles.detailBlockItem}><span>Top Speed</span><span>{car.topSpeed} mph</span></div>}
                    </div>
                  </div>

                  {/* Engine & Drivetrain */}
                  <div className={styles.detailBlock}>
                    <h4 className={styles.detailBlockTitle}>
                      <span>Engine & Drivetrain</span>
                      <AskALButton 
                        category="Engine & Drivetrain"
                        prompt={`Tell me about the engine and drivetrain in my ${car?.name || 'car'}. What are common issues, maintenance tips, and potential upgrades?`}
                        carName={car?.name}
                      />
                    </h4>
                    <div className={styles.detailBlockItems}>
                      {car.engine && <div className={styles.detailBlockItem}><span>Engine</span><span>{car.engine}</span></div>}
                      {car.trans && <div className={styles.detailBlockItem}><span>Transmission</span><span>{car.trans}</span></div>}
                      {car.drivetrain && <div className={styles.detailBlockItem}><span>Drivetrain</span><span>{car.drivetrain}</span></div>}
                      {car.category && <div className={styles.detailBlockItem}><span>Layout</span><span>{car.category}</span></div>}
                      {car.manualAvailable !== undefined && <div className={styles.detailBlockItem}><span>Manual</span><span>{car.manualAvailable ? 'Yes' : 'No'}</span></div>}
                    </div>
                  </div>

                  {/* Chassis & Body */}
                  <div className={styles.detailBlock}>
                    <h4 className={styles.detailBlockTitle}>
                      <span>Chassis & Body</span>
                      <AskALButton 
                        category="Chassis & Body"
                        prompt={`Tell me about the chassis and body of my ${car?.name || 'car'}. What makes it unique, and what should I know about its construction and handling characteristics?`}
                        carName={car?.name}
                      />
                    </h4>
                    <div className={styles.detailBlockItems}>
                      {car.curbWeight && <div className={styles.detailBlockItem}><span>Curb Weight</span><span>{car.curbWeight.toLocaleString()} lbs</span></div>}
                      {car.seats && <div className={styles.detailBlockItem}><span>Seats</span><span>{car.seats}</span></div>}
                      {car.country && <div className={styles.detailBlockItem}><span>Origin</span><span>{car.country}</span></div>}
                    </div>
                  </div>

                  {/* AutoRev Ratings */}
                  <div className={styles.detailBlock}>
                    <h4 className={styles.detailBlockTitle}>
                      <span>AutoRev Ratings</span>
                      <AskALButton 
                        category="AutoRev Ratings"
                        prompt={`Explain the AutoRev ratings for my ${car?.name || 'car'}. Why did it receive these scores, and how does it compare to similar vehicles?`}
                        carName={car?.name}
                      />
                    </h4>
                    <div className={styles.detailBlockItems}>
                      {car.driverFun && <div className={styles.detailBlockItem}><span>Driver Fun</span><span className={styles.ratingValue}>{car.driverFun}/10</span></div>}
                      {car.track && <div className={styles.detailBlockItem}><span>Track</span><span className={styles.ratingValue}>{car.track}/10</span></div>}
                      {car.sound && <div className={styles.detailBlockItem}><span>Sound</span><span className={styles.ratingValue}>{car.sound}/10</span></div>}
                      {car.reliability && <div className={styles.detailBlockItem}><span>Reliability</span><span className={styles.ratingValue}>{car.reliability}/10</span></div>}
                      {car.interior && <div className={styles.detailBlockItem}><span>Interior</span><span className={styles.ratingValue}>{car.interior}/10</span></div>}
                      {car.value && <div className={styles.detailBlockItem}><span>Value</span><span className={styles.ratingValue}>{car.value}/10</span></div>}
                      {car.aftermarket && <div className={styles.detailBlockItem}><span>Aftermarket</span><span className={styles.ratingValue}>{car.aftermarket}/10</span></div>}
                    </div>
                  </div>

                  {/* Ownership */}
                  <div className={styles.detailBlock}>
                    <h4 className={styles.detailBlockTitle}>
                      <span>Ownership</span>
                      <AskALButton 
                        category="Ownership"
                        prompt={`What should I know about owning a ${car?.name || 'car'}? Include typical costs, common issues to watch for, and what makes it special as a daily driver or weekend car.`}
                        carName={car?.name}
                      />
                    </h4>
                    <div className={styles.detailBlockItems}>
                      {car.priceRange && <div className={styles.detailBlockItem}><span>Price Range</span><span>{car.priceRange}</span></div>}
                      {car.years && <div className={styles.detailBlockItem}><span>Model Years</span><span>{car.years}</span></div>}
                      {car.dailyUsabilityTag && <div className={styles.detailBlockItem}><span>Daily Use</span><span>{car.dailyUsabilityTag}</span></div>}
                      {car.fuelEconomyCombined && <div className={styles.detailBlockItem}><span>MPG Combined</span><span>{car.fuelEconomyCombined}</span></div>}
                      {car.maintenanceCostIndex && <div className={styles.detailBlockItem}><span>Maintenance</span><span>{car.maintenanceCostIndex <= 3 ? 'Low' : car.maintenanceCostIndex <= 6 ? 'Medium' : 'High'}</span></div>}
                      {car.insuranceCostIndex && <div className={styles.detailBlockItem}><span>Insurance</span><span>{car.insuranceCostIndex <= 3 ? 'Low' : car.insuranceCostIndex <= 6 ? 'Medium' : 'High'}</span></div>}
                    </div>
                  </div>

                  {/* Ownership Extras - if available */}
                  {(car.partsAvailability || car.dealerVsIndependent || car.diyFriendliness || car.trackReadiness || car.communityStrength) && (
                    <div className={styles.detailBlock}>
                      <h4 className={styles.detailBlockTitle}>
                        <span>Ownership Extras</span>
                        <AskALButton 
                          category="Ownership Extras"
                          prompt={`Tell me more about owning a ${car?.name || 'car'} - parts availability, DIY friendliness, track readiness, and the enthusiast community.`}
                          carName={car?.name}
                        />
                      </h4>
                      <div className={styles.detailBlockItems}>
                        {car.partsAvailability && <div className={styles.detailBlockItem}><span>Parts</span><span style={{textTransform: 'capitalize'}}>{car.partsAvailability}</span></div>}
                        {car.dealerVsIndependent && <div className={styles.detailBlockItem}><span>Service</span><span style={{textTransform: 'capitalize'}}>{car.dealerVsIndependent.replace(/-/g, ' ')}</span></div>}
                        {car.diyFriendliness && <div className={styles.detailBlockItem}><span>DIY Friendly</span><span className={styles.ratingValue}>{car.diyFriendliness}/10</span></div>}
                        {car.trackReadiness && <div className={styles.detailBlockItem}><span>Track Ready</span><span style={{textTransform: 'capitalize'}}>{car.trackReadiness.replace(/-/g, ' ')}</span></div>}
                        {car.communityStrength && <div className={styles.detailBlockItem}><span>Community</span><span className={styles.ratingValue}>{car.communityStrength}/10</span></div>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Pros & Cons Row - Below main specs */}
                {(car.pros?.length > 0 || car.cons?.length > 0) && (
                  <div className={styles.prosConsRow}>
                    {/* Pros */}
                    {car.pros && car.pros.length > 0 && (
                      <div className={styles.prosConsBlock}>
                        <h4 className={styles.detailBlockTitle}>Pros</h4>
                        <ul className={styles.proConList}>
                          {car.pros.slice(0, 4).map((pro, i) => (
                            <li key={i} className={styles.proItem}>✓ {pro}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Cons */}
                    {car.cons && car.cons.length > 0 && (
                      <div className={styles.prosConsBlock}>
                        <h4 className={styles.detailBlockTitle}>Cons</h4>
                        <ul className={styles.proConList}>
                          {car.cons.slice(0, 4).map((con, i) => (
                            <li key={i} className={styles.conItem}>✗ {con}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Owner's Reference View - Only for My Collection (Enthusiast+ tier) */}
            {isOwnedVehicle && detailsView === 'reference' && (
              <PremiumGate feature="ownerReference" variant="compact">
                {/* VIN Lookup - Compact inline */}
                <div className={styles.vinLookupCompact}>
                  <input
                    type="text"
                    value={vinInput}
                    onChange={(e) => setVinInput(e.target.value.toUpperCase())}
                    placeholder="Enter VIN to decode vehicle info"
                    className={styles.vinInputCompact}
                    maxLength={17}
                  />
                  <button 
                    onClick={handleVinLookup}
                    disabled={vinInput.length !== 17 || vinLookupLoading}
                    className={styles.vinLookupBtnCompact}
                  >
                    {vinLookupLoading ? 'Decoding...' : 'Decode & Save'}
                  </button>
                </div>

                {/* VIN Decode Results */}
                {vinData && (
                  <div className={styles.vinDecodeResults}>
                    <div className={styles.vinDecodeHeader}>
                      <h4 className={styles.detailBlockTitle}>
                        VIN Decoded
                        {vinSaveStatus === 'saved' && (
                          <span className={styles.vinSaveSuccess}>✓ Saved to vehicle</span>
                        )}
                        {vinSaveStatus === 'saving' && (
                          <span className={styles.vinSaving}>Saving...</span>
                        )}
                        {vinSaveStatus === 'error' && (
                          <span className={styles.vinSaveError}>Save failed</span>
                        )}
                      </h4>
                    </div>
                    <div className={styles.vinDecodeGrid}>
                      <div className={styles.vinDecodeItem}>
                        <span>Year</span>
                        <span className={vinData.modelYear !== item?.vehicle?.year ? styles.vinDataChanged : ''}>
                          {vinData.modelYear}
                          {vinData.modelYear !== item?.vehicle?.year && (
                            <span className={styles.vinDataOld}> (was {item?.vehicle?.year})</span>
                          )}
                        </span>
                      </div>
                      <div className={styles.vinDecodeItem}>
                        <span>Make</span>
                        <span>{vinData.make}</span>
                      </div>
                      <div className={styles.vinDecodeItem}>
                        <span>Model</span>
                        <span>{vinData.model}</span>
                      </div>
                      {vinData.trim && (
                        <div className={styles.vinDecodeItem}>
                          <span>Trim</span>
                          <span>{vinData.trim}</span>
                        </div>
                      )}
                      {vinData.engine && (
                        <div className={styles.vinDecodeItem}>
                          <span>Engine</span>
                          <span>{vinData.engine}</span>
                        </div>
                      )}
                      {vinData.transmission && (
                        <div className={styles.vinDecodeItem}>
                          <span>Transmission</span>
                          <span>{vinData.transmission}</span>
                        </div>
                      )}
                      {vinData.drivetrain && (
                        <div className={styles.vinDecodeItem}>
                          <span>Drivetrain</span>
                          <span>{vinData.drivetrain}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* VIN Error */}
                {vinError && (
                  <div className={styles.vinErrorMsg}>
                    {vinError}
                  </div>
                )}

                {/* Main Reference Grid - Same layout as Details */}
                <div className={styles.fullDetailsInPanel}>
                  {/* Engine Oil */}
                  <div className={styles.detailBlock}>
                    <h4 className={styles.detailBlockTitle}>
                      <span>Engine Oil</span>
                      <AskALButton 
                        category="Engine Oil"
                        prompt={`What's the best engine oil for my ${car?.name || 'car'}? Include recommended brands, viscosity, and change intervals.`}
                        carName={car?.name}
                      />
                    </h4>
                    <div className={styles.detailBlockItems}>
                      <div className={styles.detailBlockItem}><span>Viscosity</span><span>{maintenanceData.specs?.oil_viscosity || '5W-30 or 5W-40'}</span></div>
                      <div className={styles.detailBlockItem}><span>Capacity</span><span>{maintenanceData.specs?.oil_capacity_quarts ? `${maintenanceData.specs.oil_capacity_quarts} qt` : '~8-10 qt'}</span></div>
                      <div className={styles.detailBlockItem}><span>Change Interval</span><span>{maintenanceData.specs?.oil_change_interval_miles ? `${maintenanceData.specs.oil_change_interval_miles.toLocaleString()} mi` : '5,000-7,500 mi'}</span></div>
                    </div>
                  </div>

                  {/* Fuel */}
                  <div className={styles.detailBlock}>
                    <h4 className={styles.detailBlockTitle}>
                      <span>Fuel</span>
                      <AskALButton 
                        category="Fuel"
                        prompt={`What fuel should I use in my ${car?.name || 'car'}? Is premium worth it, and what about E85 compatibility?`}
                        carName={car?.name}
                      />
                    </h4>
                    <div className={styles.detailBlockItems}>
                      <div className={styles.detailBlockItem}><span>Fuel Type</span><span>{maintenanceData.specs?.fuel_type || 'Premium Unleaded'}</span></div>
                      <div className={styles.detailBlockItem}><span>Min Octane</span><span>{maintenanceData.specs?.fuel_octane_minimum || '91'}</span></div>
                      <div className={styles.detailBlockItem}><span>Recommended</span><span>{maintenanceData.specs?.fuel_octane_recommended ? `${maintenanceData.specs.fuel_octane_recommended} octane` : '93 octane'}</span></div>
                      <div className={styles.detailBlockItem}><span>Tank Capacity</span><span>{maintenanceData.specs?.fuel_tank_capacity_gallons ? `${maintenanceData.specs.fuel_tank_capacity_gallons} gal` : '~16 gal'}</span></div>
                    </div>
                  </div>

                  {/* Tires & Wheels - Inline Editable Card */}
                  <WheelTireSpecsCard
                    stockSpecs={maintenanceData.specs}
                    customSpecs={item.vehicle?.customSpecs}
                    onUpdateCustomSpecs={onUpdateCustomSpecs ? async (specs) => {
                      if (item.vehicle?.id) {
                        await onUpdateCustomSpecs(item.vehicle.id, specs);
                      }
                    } : undefined}
                    fitmentOptions={fitmentOptions}
                    showFitmentToggle={true}
                    carName={car?.name}
                  />

                  {/* Fluids */}
                  <div className={styles.detailBlock}>
                    <h4 className={styles.detailBlockTitle}>
                      <span>Fluids</span>
                      <AskALButton 
                        category="Fluids"
                        prompt={`What fluids does my ${car?.name || 'car'} need? Include coolant, brake fluid, transmission fluid, and differential fluid specifications.`}
                        carName={car?.name}
                      />
                    </h4>
                    <div className={styles.detailBlockItems}>
                      <div className={styles.detailBlockItem}><span>Coolant</span><span>{maintenanceData.specs?.coolant_type || 'OEM Coolant'}</span></div>
                      <div className={styles.detailBlockItem}><span>Brake Fluid</span><span>{maintenanceData.specs?.brake_fluid_type || 'DOT 4'}</span></div>
                      <div className={styles.detailBlockItem}><span>Trans Fluid</span><span>{maintenanceData.specs?.trans_fluid_auto || maintenanceData.specs?.trans_fluid_manual || 'Check manual'}</span></div>
                      <div className={styles.detailBlockItem}><span>Diff Fluid</span><span>{maintenanceData.specs?.diff_fluid_type || 'Check manual'}</span></div>
                    </div>
                  </div>

                  {/* Brakes */}
                  <div className={styles.detailBlock}>
                    <h4 className={styles.detailBlockTitle}>
                      <span>Brakes</span>
                      <AskALButton 
                        category="Brakes"
                        prompt={`Tell me about the brake system on my ${car?.name || 'car'}. What are good upgrade options and when should I replace pads/rotors?`}
                        carName={car?.name}
                      />
                    </h4>
                    <div className={styles.detailBlockItems}>
                      <div className={styles.detailBlockItem}><span>Front Caliper</span><span>{maintenanceData.specs?.brake_front_caliper_type || 'Brembo 6-piston'}</span></div>
                      <div className={styles.detailBlockItem}><span>Rear Caliper</span><span>{maintenanceData.specs?.brake_rear_caliper_type || 'Brembo 4-piston'}</span></div>
                      <div className={styles.detailBlockItem}><span>Pad Compound</span><span>Performance</span></div>
                    </div>
                  </div>

                  {/* Battery */}
                  <div className={styles.detailBlock}>
                    <h4 className={styles.detailBlockTitle}>
                      <span>Battery</span>
                      <AskALButton 
                        category="Battery"
                        prompt={`What battery should I get for my ${car?.name || 'car'}? Include recommended brands and any special considerations.`}
                        carName={car?.name}
                      />
                    </h4>
                    <div className={styles.detailBlockItems}>
                      <div className={styles.detailBlockItem}><span>Group Size</span><span>{maintenanceData.specs?.battery_group_size || 'H6/48'}</span></div>
                      <div className={styles.detailBlockItem}><span>CCA</span><span>{maintenanceData.specs?.battery_cca || '750+'}</span></div>
                      <div className={styles.detailBlockItem}><span>Type</span><span>{maintenanceData.specs?.battery_agm ? 'AGM' : 'AGM Recommended'}</span></div>
                    </div>
                  </div>

                  {/* Wipers & Lights */}
                  <div className={styles.detailBlock}>
                    <h4 className={styles.detailBlockTitle}>
                      <span>Wipers & Lights</span>
                      <AskALButton 
                        category="Wipers & Lights"
                        prompt={`What are the wiper blade sizes and bulb types for my ${car?.name || 'car'}? Any recommended upgrades?`}
                        carName={car?.name}
                      />
                    </h4>
                    <div className={styles.detailBlockItems}>
                      <div className={styles.detailBlockItem}><span>Driver Wiper</span><span>{maintenanceData.specs?.wiper_driver_size_inches ? `${maintenanceData.specs.wiper_driver_size_inches}"` : '22"'}</span></div>
                      <div className={styles.detailBlockItem}><span>Passenger Wiper</span><span>{maintenanceData.specs?.wiper_passenger_size_inches ? `${maintenanceData.specs.wiper_passenger_size_inches}"` : '20"'}</span></div>
                      <div className={styles.detailBlockItem}><span>Low Beam</span><span>{maintenanceData.specs?.headlight_low_beam_type || 'LED'}</span></div>
                      <div className={styles.detailBlockItem}><span>High Beam</span><span>{maintenanceData.specs?.headlight_high_beam_type || 'LED'}</span></div>
                    </div>
                  </div>

                  {/* VIN Decoded Info - if available */}
                  {vinData && (
                    <div className={styles.detailBlock}>
                      <h4 className={styles.detailBlockTitle}>
                        <span>VIN Details</span>
                      </h4>
                      <div className={styles.detailBlockItems}>
                        <div className={styles.detailBlockItem}><span>VIN</span><span className={styles.vinValueSmall}>{vinData.vin}</span></div>
                        <div className={styles.detailBlockItem}><span>Plant</span><span>{vinData.plantCity}, {vinData.plantCountry}</span></div>
                        <div className={styles.detailBlockItem}><span>Body Style</span><span>{vinData.bodyStyle}</span></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recalls Section - if VIN decoded and has recalls */}
                {vinData?.recalls && vinData.recalls.length > 0 && (
                  <div className={styles.prosConsRow}>
                    <div className={styles.prosConsBlock} style={{ flex: 1 }}>
                      <h4 className={styles.detailBlockTitle}>Recalls & Campaigns</h4>
                      <ul className={styles.proConList}>
                        {vinData.recalls.map((recall, i) => (
                          <li key={i} className={styles.conItem}>
                            <span style={{ color: recall.status === 'Completed' ? '#10b981' : '#ef4444' }}>
                              {recall.status === 'Completed' ? '✓' : '!'} 
                            </span>
                            {' '}{recall.description} ({recall.status})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Data source note */}
                <p className={styles.referenceNote}>
                  Values shown are estimates. Verify with your owner's manual or VIN decode.
                </p>
              </PremiumGate>
            )}

            {/* Safety View - Recalls, TSBs, Complaints, Safety Ratings (Enthusiast+ tier) */}
            {isOwnedVehicle && detailsView === 'safety' && (
              <PremiumGate feature="safetyData" variant="compact">
                {loadingSafety ? (
                  <div className={styles.loadingState}>
                    <Icons.loader size={24} className={styles.spinnerIcon} />
                    <span>Loading safety data...</span>
                  </div>
                ) : (
                  <>
                    {/* Safety Summary */}
                    <div className={styles.safetySummary}>
                      <div className={styles.safetyStatCard}>
                        <span className={styles.safetyStatValue} style={{ color: safetyData.recalls.length > 0 ? '#ef4444' : '#10b981' }}>
                          {safetyData.recalls.length}
                        </span>
                        <span className={styles.safetyStatLabel}>Recalls</span>
                      </div>
                      <div className={styles.safetyStatCard}>
                        <span className={styles.safetyStatValue}>{safetyData.complaints.length}</span>
                        <span className={styles.safetyStatLabel}>Complaints</span>
                      </div>
                      {safetyData.safetyRatings?.overallRating && (
                        <div className={styles.safetyStatCard}>
                          <span className={styles.safetyStatValue}>
                            {safetyData.safetyRatings.overallRating}
                            <Icons.star size={14} />
                          </span>
                          <span className={styles.safetyStatLabel}>NHTSA Rating</span>
                        </div>
                      )}
                    </div>

                    {/* Recalls Section */}
                    <div className={styles.safetySection}>
                      <h4 className={styles.detailBlockTitle}>
                        <Icons.alert size={14} />
                        Recalls ({safetyData.recalls.length})
                      </h4>
                      {safetyData.recalls.length === 0 ? (
                        <p className={styles.noDataText}>No open recalls found for this vehicle.</p>
                      ) : (
                        <div className={styles.recallList}>
                          {safetyData.recalls.map((recall, i) => (
                            <div key={i} className={styles.recallItem}>
                              <div className={styles.recallHeader}>
                                <span className={styles.recallCampaign}>{recall.campaignNumber}</span>
                                <span className={styles.recallDate}>{recall.reportReceivedDate}</span>
                              </div>
                              <p className={styles.recallComponent}>{recall.component}</p>
                              <p className={styles.recallSummary}>{recall.summary}</p>
                              {recall.remedy && (
                                <p className={styles.recallRemedy}>
                                  <strong>Remedy:</strong> {recall.remedy}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Complaints Section - Top Issues */}
                    {safetyData.complaints.length > 0 && (
                      <div className={styles.safetySection}>
                        <h4 className={styles.detailBlockTitle}>
                          <Icons.info size={14} />
                          Common Complaints ({safetyData.complaints.length} total)
                        </h4>
                        <div className={styles.complaintsList}>
                          {safetyData.complaints.slice(0, 5).map((complaint, i) => (
                            <div key={i} className={styles.complaintItem}>
                              <div className={styles.complaintHeader}>
                                <span className={styles.complaintComponent}>{complaint.component}</span>
                                {(complaint.crash || complaint.fire) && (
                                  <span className={styles.complaintWarning}>
                                    {complaint.crash && <><Icons.alert size={12} /> Crash</>}
                                    {complaint.crash && complaint.fire && ' '}
                                    {complaint.fire && <><Icons.fire size={12} /> Fire</>}
                                  </span>
                                )}
                              </div>
                              <p className={styles.complaintSummary}>{complaint.summary}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Safety Ratings */}
                    {safetyData.safetyRatings?.hasRatings && (
                      <div className={styles.safetySection}>
                        <h4 className={styles.detailBlockTitle}>
                          <Icons.shield size={14} />
                          NHTSA Safety Ratings
                        </h4>
                        <div className={styles.ratingsGrid}>
                          <div className={styles.ratingItem}>
                            <span className={styles.ratingLabel}>Overall</span>
                            <span className={styles.ratingStars}>{safetyData.safetyRatings.overallRating}<Icons.star size={12} /></span>
                          </div>
                          {safetyData.safetyRatings.overallFrontCrashRating && (
                            <div className={styles.ratingItem}>
                              <span className={styles.ratingLabel}>Front Crash</span>
                              <span className={styles.ratingStars}>{safetyData.safetyRatings.overallFrontCrashRating}<Icons.star size={12} /></span>
                            </div>
                          )}
                          {safetyData.safetyRatings.overallSideCrashRating && (
                            <div className={styles.ratingItem}>
                              <span className={styles.ratingLabel}>Side Crash</span>
                              <span className={styles.ratingStars}>{safetyData.safetyRatings.overallSideCrashRating}<Icons.star size={12} /></span>
                            </div>
                          )}
                          {safetyData.safetyRatings.rolloverRating && (
                            <div className={styles.ratingItem}>
                              <span className={styles.ratingLabel}>Rollover</span>
                              <span className={styles.ratingStars}>{safetyData.safetyRatings.rolloverRating}<Icons.star size={12} /></span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <p className={styles.referenceNote}>
                      Safety data from NHTSA. Check nhtsa.gov for complete details.
                    </p>
                  </>
                )}
              </PremiumGate>
            )}

            {/* Service Log View (Enthusiast+ tier) */}
            {isOwnedVehicle && detailsView === 'service' && (
              <PremiumGate feature="serviceLog" variant="compact">
                {/* Add Service Button */}
                <div className={styles.serviceLogHeader}>
                  <h4 className={styles.detailBlockTitle}>
                    <Icons.clipboard size={14} />
                    Service History
                  </h4>
                  <button 
                    onClick={() => {
                      setEditingLog(null);
                      setShowServiceLogModal(true);
                    }}
                    className={styles.addServiceBtn}
                  >
                    <Icons.plus size={14} />
                    Log Service
                  </button>
                </div>

                {loadingServiceLogs ? (
                  <div className={styles.emptyServiceLog}>
                    <LoadingSpinner size="small" />
                    <p>Loading service records...</p>
                  </div>
                ) : serviceLogs.length === 0 ? (
                  <div className={styles.emptyServiceLog}>
                    <Icons.clipboard size={48} />
                    <p>No service records yet</p>
                    <p className={styles.emptyServiceHint}>
                      Track oil changes, tire rotations, and other maintenance to stay on top of your vehicle's health.
                    </p>
                    <button 
                      onClick={() => {
                        setEditingLog(null);
                        setShowServiceLogModal(true);
                      }}
                      className={styles.firstServiceBtn}
                    >
                      <Icons.plus size={16} style={{ transform: 'translateY(3px)' }} />
                      Add First Service Record
                    </button>
                  </div>
                ) : (
                  <div className={styles.serviceLogList}>
                    {serviceLogs.map((log, i) => (
                      <div key={log.id || i} className={styles.serviceLogItem}>
                        <div className={styles.serviceLogDate}>
                          <span className={styles.serviceLogMonth}>
                            {new Date(log.service_date).toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                          <span className={styles.serviceLogDay}>
                            {new Date(log.service_date).getDate()}
                          </span>
                        </div>
                        <div className={styles.serviceLogContent}>
                          <span className={styles.serviceLogType}>{log.service_type}</span>
                          {log.odometer_reading && (
                            <span className={styles.serviceLogMiles}>{log.odometer_reading.toLocaleString()} mi</span>
                          )}
                          {log.total_cost && (
                            <span className={styles.serviceLogCost}>${Number(log.total_cost).toFixed(2)}</span>
                          )}
                          {log.notes && (
                            <p className={styles.serviceLogNotes}>{log.notes}</p>
                          )}
                        </div>
                        <div className={styles.serviceLogActions}>
                          <button 
                            className={styles.serviceLogEditBtn}
                            onClick={() => handleEditServiceLog(log)}
                            title="Edit service record"
                          >
                            <Icons.edit size={14} />
                          </button>
                          <button 
                            className={styles.serviceLogDeleteBtn}
                            onClick={() => handleDeleteServiceLog(log.id)}
                            disabled={deletingLogId === log.id}
                            title="Delete service record"
                          >
                            {deletingLogId === log.id ? (
                              <LoadingSpinner size="tiny" />
                            ) : (
                              <Icons.trash size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className={styles.referenceNote}>
                  Keep your service records up to date for accurate maintenance reminders.
                </p>
              </PremiumGate>
            )}

            {/* Modifications View - Shows installed upgrades */}
            {isOwnedVehicle && detailsView === 'mods' && (
              <div className={styles.modsView}>
                <div className={styles.modsHeader}>
                  <h4 className={styles.detailBlockTitle}>
                    <Icons.wrench size={14} />
                    Installed Modifications
                  </h4>
                  {item.vehicle?.matchedCarSlug && (
                    <Link 
                      href={`/tuning-shop?plan=${item.vehicle.matchedCarSlug}`}
                      className={styles.editModsLink}
                    >
                      <Icons.edit size={14} />
                      {item.vehicle?.isModified ? 'Edit Mods' : 'Add Mods'}
                    </Link>
                  )}
                </div>

                {item.vehicle?.isModified && item.vehicle.installedModifications?.length > 0 ? (
                  <>
                    {/* HP Gain Summary */}
                    {item.vehicle.totalHpGain > 0 && (
                      <div className={styles.modsHpSummary}>
                        <span className={styles.modsHpLabel}>Total Estimated Gain</span>
                        <span className={styles.modsHpValue}>+{item.vehicle.totalHpGain} HP</span>
                      </div>
                    )}

                    {/* Modifications List */}
                    <div className={styles.modsList}>
                      {item.vehicle.installedModifications.map((mod, idx) => (
                        <div key={idx} className={styles.modItem}>
                          <Icons.check size={14} />
                          <span className={styles.modName}>
                            {mod.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Source Build Link */}
                    {item.vehicle.activeBuildId && (
                      <Link 
                        href={`/tuning-shop?build=${item.vehicle.activeBuildId}`}
                        className={styles.sourceBuildLink}
                      >
                        <Icons.link size={14} />
                        View Original Build
                      </Link>
                    )}

                    {/* Clear Modifications Button */}
                    <button 
                      className={styles.clearModsButton}
                      onClick={async () => {
                        if (window.confirm('Reset this vehicle to stock configuration? This will remove all modifications.')) {
                          if (onClearModifications) {
                            await onClearModifications(item.vehicle.id);
                          }
                        }
                      }}
                    >
                      <Icons.x size={14} />
                      Reset to Stock
                    </button>
                  </>
                ) : (
                  <div className={styles.modsEmptyState}>
                    <Icons.wrench size={32} />
                    <p>No modifications installed</p>
                    <p className={styles.modsEmptyDesc}>
                      Track your upgrades by applying a build from the Tuning Shop
                    </p>
                    {item.vehicle?.matchedCarSlug && (
                      <Link 
                        href={`/tuning-shop?plan=${item.vehicle.matchedCarSlug}`}
                        className={styles.modsEmptyAction}
                      >
                        <Icons.plus size={16} />
                        Plan Modifications
                      </Link>
                    )}
                  </div>
                )}

                {/* Link to Reference tab for custom specs */}
                {item.vehicle?.hasCustomSpecs && (
                  <div className={styles.customSpecsLink}>
                    <Icons.info size={14} />
                    <span>Your wheel & tire specs are shown in the <strong>Reference</strong> tab</span>
                  </div>
                )}

                {item.vehicle.modifiedAt && (
                  <p className={styles.referenceNote}>
                    Last updated: {new Date(item.vehicle.modifiedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* Vehicle Health View - Track maintenance status */}
            {isOwnedVehicle && detailsView === 'health' && item?.vehicle?.id && (
              <div className={styles.healthView}>
                <VehicleHealthCard
                  userId={userId}
                  vehicleId={item.vehicle.id}
                  vehicleName={
                    car.name ||
                    item.vehicle.nickname ||
                    `${item.vehicle.year || ''} ${item.vehicle.make || ''} ${item.vehicle.model || ''}`.trim()
                  }
                  initialMileage={item.vehicle.mileage}
                  maintenanceSpecs={maintenanceData.specs}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Action Buttons - Right side */}
      {panelState !== 'details' && (
        <div className={styles.quickActionBar}>
          {/* Details button - available for both My Collection and Favorites */}
          <button 
            className={styles.quickActionItem}
            onClick={() => {
              setDetailsView('specs');
              setPanelState('details');
            }}
          >
            <Icons.info size={20} />
            <span>Details</span>
          </button>
          
          {/* Additional buttons only for My Collection */}
          {isOwnedVehicle && (
            <>
              <button 
                className={styles.quickActionItem}
                onClick={() => {
                  setDetailsView('reference');
                  setPanelState('details');
                }}
              >
                <Icons.book size={20} />
                <span>Reference</span>
              </button>
              <button 
                className={styles.quickActionItem}
                onClick={() => {
                  setDetailsView('safety');
                  setPanelState('details');
                }}
              >
                <Icons.shield size={20} />
                <span>Safety</span>
              </button>
              <button 
                className={styles.quickActionItem}
                onClick={() => {
                  setDetailsView('service');
                  setPanelState('details');
                }}
              >
                <Icons.clipboard size={20} />
                <span>Service</span>
              </button>
              <button 
                className={styles.quickActionItem}
                onClick={() => {
                  setDetailsView('health');
                  setPanelState('details');
                }}
              >
                <Icons.gauge size={20} />
                <span>Health</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Badges */}
      {isOwnedVehicle && item.vehicle?.isPrimary && (
        <span className={styles.heroBadge}>Primary Vehicle</span>
      )}
      {isFavorite && isInMyCars && (
        <span className={styles.heroBadgeOwned}>
          <Icons.car size={12} />
          Owned
        </span>
      )}

      {/* Performance Hub Overlay */}
      {showPerformance && car && (
        <PerformanceOverlay car={car} onClose={() => setShowPerformance(false)} />
      )}

      {/* Service Log Modal */}
      {showServiceLogModal && isOwnedVehicle && (
        <ServiceLogModal
          isOpen={showServiceLogModal}
          onClose={handleCloseServiceLogModal}
          vehicleInfo={{
            year: item.vehicle?.year,
            make: item.vehicle?.make,
            model: item.vehicle?.model,
            currentMileage: item.vehicle?.mileage,
          }}
          editingLog={editingLog}
          onSave={handleSaveServiceLog}
          maintenanceSpecs={maintenanceData?.specs}
        />
      )}
    </div>
  );
}

// Performance Overlay Component - Shows Performance Hub preview within garage
function PerformanceOverlay({ car, onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.overlayContentWide} onClick={e => e.stopPropagation()}>
        <button className={styles.overlayClose} onClick={onClose}>
          <Icons.x size={24} />
        </button>
        
        <div className={styles.overlayHeader}>
          <h2 className={styles.overlayTitle}>Performance Upgrades</h2>
          <p className={styles.overlaySubtitle}>{car.name}</p>
        </div>

        <div className={styles.performanceCategories}>
          <div className={styles.perfCategory}>
            <Icons.gauge size={28} />
            <span>Power</span>
            <small>ECU, Intake, Exhaust, Turbo</small>
          </div>
          <div className={styles.perfCategory}>
            <Icons.tool size={28} />
            <span>Handling</span>
            <small>Suspension, Brakes, Wheels</small>
          </div>
          <div className={styles.perfCategory}>
            <Icons.settings size={28} />
            <span>Drivetrain</span>
            <small>Clutch, Diff, Transmission</small>
          </div>
        </div>

        <div className={styles.overlayFooter}>
          <Link href={`/tuning-shop?car=${car.slug}`} className={styles.overlayLinkPrimary}>
            <Icons.wrench size={16} />
            Open Tuning Shop
          </Link>
        </div>
      </div>
    </div>
  );
}

// Confirmation Modal Component
function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Remove', confirmType = 'danger' }) {
  if (!isOpen) return null;
  
  return (
    <div className={styles.confirmOverlay} onClick={onClose}>
      <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
        <div className={styles.confirmIcon}>
          <Icons.alert size={32} />
        </div>
        <h3 className={styles.confirmTitle}>{title}</h3>
        <p className={styles.confirmMessage}>{message}</p>
        <div className={styles.confirmActions}>
          <button 
            onClick={onClose} 
            className={styles.confirmCancelBtn}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className={`${styles.confirmBtn} ${confirmType === 'danger' ? styles.confirmBtnDanger : ''}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Thumbnail Strip Component
function ThumbnailStrip({ items, selectedIndex, onSelect, type, onRemoveItem, isEditMode, onMoveItem, isReordering }) {
  const stripRef = useRef(null);

  const scrollToSelected = (index) => {
    if (stripRef.current) {
      const thumbnail = stripRef.current.children[index];
      if (thumbnail) {
        thumbnail.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  };

  const handlePrev = () => {
    const newIndex = selectedIndex > 0 ? selectedIndex - 1 : items.length - 1;
    onSelect(newIndex);
    scrollToSelected(newIndex);
  };

  const handleNext = () => {
    const newIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : 0;
    onSelect(newIndex);
    scrollToSelected(newIndex);
  };

  const handleRemoveClick = (e, index) => {
    e.stopPropagation();
    if (onRemoveItem) {
      onRemoveItem(index);
    }
  };

  const handleMoveUp = (e, index) => {
    e.stopPropagation();
    if (onMoveItem && index > 0) {
      onMoveItem(index, index - 1);
    }
  };

  const handleMoveDown = (e, index) => {
    e.stopPropagation();
    if (onMoveItem && index < items.length - 1) {
      onMoveItem(index, index + 1);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className={styles.thumbnailContainer}>
      {items.length > 1 && !isEditMode && (
        <button onClick={handlePrev} className={styles.navArrow} aria-label="Previous">
          <Icons.chevronLeft size={24} />
        </button>
      )}

      <div className={`${styles.thumbnailStrip} ${isEditMode ? styles.thumbnailStripEditMode : ''}`} ref={stripRef}>
        {items.map((item, index) => {
          const car = type === 'projects' ? item.car : (item.matchedCar || item);
          const isSelected = index === selectedIndex;
          
          // Get display name for tooltip
          const displayName = type === 'mycars' 
            ? (item.vehicle?.nickname || `${item.vehicle?.make} ${item.vehicle?.model}`)
            : type === 'projects'
              ? (item.name || car?.name)
              : car?.name;

          return (
            <div
              key={item.id || item.slug || index}
              className={`${styles.thumbnailWrapper} ${isSelected ? styles.thumbnailWrapperSelected : ''} ${isEditMode ? styles.thumbnailWrapperEditMode : ''}`}
            >
              {/* Reorder controls in edit mode */}
              {isEditMode && type === 'mycars' && (
                <div className={styles.reorderControls}>
                  <button 
                    onClick={(e) => handleMoveUp(e, index)} 
                    className={styles.reorderBtn}
                    disabled={index === 0 || isReordering}
                    title="Move up"
                    aria-label="Move up"
                  >
                    <Icons.chevronUp size={16} />
                  </button>
                  <span className={styles.reorderPosition}>{index + 1}</span>
                  <button 
                    onClick={(e) => handleMoveDown(e, index)} 
                    className={styles.reorderBtn}
                    disabled={index === items.length - 1 || isReordering}
                    title="Move down"
                    aria-label="Move down"
                  >
                    <Icons.chevronDown size={16} />
                  </button>
                </div>
              )}
              
              <button
                onClick={() => !isEditMode && onSelect(index)}
                className={`${styles.thumbnail} ${isSelected ? styles.thumbnailSelected : ''}`}
                title={displayName}
              >
                {car ? (
                  <CarImage car={car} variant="garage" className={styles.thumbnailImage} />
                ) : (
                  <div className={styles.thumbnailPlaceholder}>
                    <Icons.car size={24} />
                  </div>
                )}
                {isSelected && !isEditMode && <div className={styles.thumbnailIndicator} />}
              </button>
              {/* Delete button on each thumbnail (hidden in edit mode) */}
              {onRemoveItem && !isEditMode && (
                <button 
                  onClick={(e) => handleRemoveClick(e, index)} 
                  className={styles.thumbnailDeleteBtn}
                  title="Remove"
                  aria-label="Remove from list"
                >
                  <Icons.x size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {items.length > 1 && !isEditMode && (
        <button onClick={handleNext} className={styles.navArrow} aria-label="Next">
          <Icons.chevronRight size={24} />
        </button>
      )}
    </div>
  );
}

// Empty State Component
function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <Icon size={64} />
      </div>
      <h3 className={styles.emptyTitle}>{title}</h3>
      <p className={styles.emptyDescription}>{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className={styles.emptyAction}>
          {actionLabel}
          <Icons.arrowRight size={16} />
        </button>
      )}
    </div>
  );
}

// Car Picker Modal for starting new projects on ANY car
function CarPickerModal({ isOpen, onClose, onSelectCar, existingBuilds, allCars = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter and sort cars (from database via allCars prop)
  // Uses ENTHUSIAST_WEIGHTS from lib/scoring.js for consistent scoring across the app
  const filteredCars = React.useMemo(() => {
    let results = allCars;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = allCars.filter(car => 
        car.name?.toLowerCase().includes(query) ||
        car.brand?.toLowerCase().includes(query) ||
        car.category?.toLowerCase().includes(query) ||
        car.engine?.toLowerCase().includes(query)
      );
    }
    
    return results
      .map(car => ({
        car,
        score: calculateWeightedScore(car, ENTHUSIAST_WEIGHTS),
        buildCount: existingBuilds.filter(b => b.carSlug === car.slug).length
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, existingBuilds]);
  
  if (!isOpen) return null;
  
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.carPickerModal} onClick={e => e.stopPropagation()}>
        <div className={styles.carPickerHeader}>
          <h2>Start a New Project</h2>
          <p>Select any car to plan modifications</p>
          <button onClick={onClose} className={styles.carPickerClose}>
            <Icons.x size={24} />
          </button>
        </div>
        
        <div className={styles.carPickerSearch}>
          <Icons.search size={18} />
          <input
            type="text"
            placeholder="Search any car..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>
        
        <div className={styles.carPickerGrid}>
          {filteredCars.map(({ car, buildCount }) => (
            <button
              key={car.slug}
              className={styles.carPickerCard}
              onClick={() => {
                onSelectCar(car);
                onClose();
              }}
            >
              <div className={styles.carPickerImage}>
                <CarImage car={car} variant="card" />
              </div>
              <div className={styles.carPickerInfo}>
                <span className={styles.carPickerName}>{car.name}</span>
                <span className={styles.carPickerMeta}>{car.hp} hp • {car.priceRange}</span>
                {buildCount > 0 && (
                  <span className={styles.carPickerExisting}>{buildCount} existing project{buildCount > 1 ? 's' : ''}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main Garage Component Content
function GarageContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('mycars');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isAddFavoritesOpen, setIsAddFavoritesOpen] = useState(false);
  const [addingFavoriteCar, setAddingFavoriteCar] = useState(null);
  const [selectedBuild, setSelectedBuild] = useState(null);
  const [allCars, setAllCars] = useState([]);
  
  // Quick mileage update mode state
  const [quickUpdateMode, setQuickUpdateMode] = useState(false);
  const [quickUpdateValues, setQuickUpdateValues] = useState({});
  const [savingQuickUpdates, setSavingQuickUpdates] = useState(false);
  
  // Edit/reorder mode state (for My Collection tab)
  const [isEditMode, setIsEditMode] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  
  // Swipe gesture state (for mobile navigation)
  const touchStartRef = useRef({ x: 0, y: 0 });
  const touchEndRef = useRef({ x: 0, y: 0 });
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, index: null, item: null });
  
  const { isAuthenticated, user, profile, isLoading: authLoading, isDataFetchReady, sessionExpired, authError } = useAuth();
  const authModal = useAuthModal();
  const { favorites, addFavorite, removeFavorite, isLoading: favoritesLoading } = useFavorites();
  const { builds, deleteBuild, getBuildById, isLoading: buildsLoading } = useSavedBuilds();
  const { vehicles, addVehicle, updateVehicle, removeVehicle, clearModifications, updateCustomSpecs, clearCustomSpecs, reorderVehicles, isLoading: vehiclesLoading } = useOwnedVehicles();
  const { hasAccess } = usePremiumAccess();
  const { openChatWithPrompt } = useAIChat();
  
  // Combined loading state - show loading while auth or provider data is being fetched
  // CRITICAL: Also check isDataFetchReady to prevent race condition on page refresh where
  // auth resolves (authLoading=false) but providers haven't started fetching yet (waiting for isDataFetchReady)
  // Without this check, there's a brief moment where the page shows empty state instead of loading
  //
  // TAB-SPECIFIC: Only check loading for the current tab's data provider. This prevents
  // one slow provider from blocking all tabs. If vehicles are loaded but builds is still 
  // loading, My Collection shows vehicles while Builds would show loading.
  const isDataLoading = useMemo(() => {
    // Always show loading during auth check
    if (authLoading) return true;
    
    // Not authenticated = no loading (show empty state or guest content)
    if (!isAuthenticated) return false;
    
    // Wait for prefetch to complete before showing any data
    if (!isDataFetchReady) return true;
    
    // Check loading state for current tab only
    switch (activeTab) {
      case 'mycars':
        return vehiclesLoading;
      case 'favorites':
        return favoritesLoading;
      case 'projects':
        return buildsLoading;
      default:
        return false;
    }
  }, [authLoading, isAuthenticated, isDataFetchReady, activeTab, vehiclesLoading, favoritesLoading, buildsLoading]);

  // Fetch car data from database on mount
  useEffect(() => {
    fetchCars().then(setAllCars).catch(console.error);
  }, []);

  // Reset selection and exit edit mode when tab changes
  useEffect(() => {
    setSelectedIndex(0);
    setIsEditMode(false);
  }, [activeTab]);
  
  // Merge favorites with full car data (from database)
  const favoriteCars = useMemo(() => {
    return favorites.map(fav => {
      const fullCarData = allCars.find(c => c.slug === fav.slug);
      return fullCarData ? { ...fullCarData, addedAt: fav.addedAt } : fav;
    });
  }, [favorites, allCars]);
  
  // Get cars for builds (from database)
  const buildsWithCars = useMemo(() => {
    if (allCars.length === 0) return [];
    return builds.map(build => ({
      ...build,
      car: allCars.find(c => c.slug === build.carSlug)
    })).filter(b => b.car);
  }, [builds, allCars]);

  // Get matched car data for owned vehicles (from database)
  // When allCars hasn't loaded yet, create a temporary car-like object from vehicle data
  // so the UI shows the vehicle info immediately instead of "Loading..."
  const vehiclesWithCars = useMemo(() => {
    return vehicles.map(vehicle => {
      const matchedCar = vehicle.matchedCarSlug ? allCars.find(c => c.slug === vehicle.matchedCarSlug) : null;
      
      // Create a temporary car object from vehicle data when:
      // 1. matchedCar isn't available yet (allCars still loading), OR
      // 2. Vehicle has no matchedCarSlug (manually added, not in our database)
      // This allows the UI to show vehicle info immediately instead of "Loading..."
      const tempCarFromVehicle = !matchedCar ? {
        name: vehicle.nickname || `${vehicle.make} ${vehicle.model}`,
        slug: vehicle.matchedCarSlug || `user-vehicle-${vehicle.id}`,
        years: vehicle.year?.toString(),
        brand: vehicle.make,
        // Include enrichment image URL if available (for daily drivers)
        imageGarageUrl: vehicle.enrichment?.imageUrl || null,
        // Placeholder flags so components know this is partial data
        _isTemporary: true,
        _hasNoMatchedCar: !vehicle.matchedCarSlug,
        _enrichmentStatus: vehicle.enrichmentStatus,
      } : null;
      
      return {
        vehicle,
        matchedCar: matchedCar || tempCarFromVehicle,
        id: vehicle.id,
        // Only show loading state if we expect to get real car data eventually
        _isCarDataLoading: !matchedCar && vehicle.matchedCarSlug && allCars.length === 0,
      };
    });
  }, [vehicles, allCars]);

  // Check if a car is already in My Collection
  const isInMyCars = (slug) => vehicles.some(v => v.matchedCarSlug === slug);

  // Get current items based on tab
  const getCurrentItems = () => {
    switch (activeTab) {
      case 'mycars':
        return vehiclesWithCars;
      case 'favorites':
        return favoriteCars;
      case 'projects':
        return buildsWithCars;
      default:
        return [];
    }
  };

  const currentItems = getCurrentItems();
  const currentItem = currentItems[selectedIndex];

  // Handle adding a favorite car to My Collection
  // When promoting a car from favorites to owned, auto-remove from favorites
  const handleAddFavoriteToMyCars = async (car) => {
    // Auth check removed for testing - will be re-enabled for production
    // if (!isAuthenticated) {
    //   authModal.openSignIn();
    //   return;
    // }

    if (isInMyCars(car.slug)) return;

    setAddingFavoriteCar(car.slug);

    try {
      const yearMatch = car.years?.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

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

      await addVehicle({
        year,
        make,
        model,
        matchedCarSlug: car.slug,
      });

      // Auto-remove from favorites when promoted to owned
      // Collection = cars you OWN, Favorites = cars you WANT (mutually exclusive)
      if (favorites.some(f => f.slug === car.slug)) {
        removeFavorite(car.slug);
      }
    } catch (err) {
      console.error('[GaragePage] Error adding vehicle:', err);
    } finally {
      setAddingFavoriteCar(null);
    }
  };

  // Open confirmation modal for removal
  const handleRemoveRequest = (index) => {
    const itemToRemove = currentItems[index];
    if (!itemToRemove) return;
    setConfirmModal({ isOpen: true, index, item: itemToRemove });
  };

  // Get confirmation message based on tab and item
  const getConfirmationDetails = () => {
    const item = confirmModal.item;
    if (!item) return { title: '', message: '' };
    
    switch (activeTab) {
      case 'mycars':
        const vehicleName = item.vehicle?.nickname || `${item.vehicle?.year} ${item.vehicle?.make} ${item.vehicle?.model}`;
        return {
          title: 'Remove from Collection',
          message: `Are you sure you want to remove "${vehicleName}" from My Collection?`,
        };
      case 'favorites':
        return {
          title: 'Remove from Favorites',
          message: `Are you sure you want to remove "${item.name}" from your favorites?`,
        };
      case 'projects':
        return {
          title: 'Delete Project',
          message: `Are you sure you want to delete the project "${item.name || 'Untitled'}"?`,
        };
      default:
        return { title: 'Confirm Removal', message: 'Are you sure you want to remove this item?' };
    }
  };

  // Confirm and execute removal
  const handleConfirmRemove = async () => {
    const { index, item } = confirmModal;
    if (!item) return;
    
    // Close modal immediately for better UX
    setConfirmModal({ isOpen: false, index: null, item: null });
    
    let result = { error: null };
    
    switch (activeTab) {
      case 'mycars':
        result = await removeVehicle(item.vehicle.id);
        break;
      case 'favorites':
        result = await removeFavorite(item.slug);
        break;
      case 'projects':
        result = await deleteBuild(item.id);
        break;
    }

    if (result?.error) {
      console.error('[Garage] Removal failed:', result.error);
      // Could add toast notification here
      return;
    }

    // Adjust selection if needed
    if (index <= selectedIndex && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    } else if (index === selectedIndex && currentItems.length === 1) {
      setSelectedIndex(0);
    }
  };

  // Close confirmation modal
  const handleCancelRemove = () => {
    setConfirmModal({ isOpen: false, index: null, item: null });
  };

  // Handle build/mod action - navigates to Tuning Shop
  const handleBuildAction = (item) => {
    if (!item) return;
    
    // For saved builds - navigate to tuning shop with build ID
    if (item.id && item.carSlug) {
      router.push(`/tuning-shop?build=${item.id}`);
    }
    // For car items (from favorites or owned) - navigate to tuning shop with car slug
    else if (item.slug) {
      router.push(`/tuning-shop?plan=${item.slug}`);
    }
    // For owned vehicle items - get the matched car slug
    else if (item.matchedCar?.slug) {
      router.push(`/tuning-shop?plan=${item.matchedCar.slug}`);
    }
  };
  
  const tabs = [
    { id: 'mycars', label: 'My Collection', icon: Icons.car, count: vehicles.length },
    { id: 'favorites', label: 'Favorites', icon: Icons.heart, count: favoriteCars.length },
  ];

  const handleAddVehicle = async (vehicleData) => {
    const result = await addVehicle(vehicleData);
    
    // Handle both { error } pattern and direct errors
    if (result?.error) {
      const errorMsg = result.error?.message || result.error || 'Failed to add vehicle';
      console.error('Failed to add vehicle:', errorMsg);
      throw new Error(errorMsg);
    }
    
    // Also check for unexpected null data (silent failure)
    if (!result?.data && !result?.error) {
      console.error('Failed to add vehicle: No data or error returned');
      throw new Error('Failed to save vehicle. Please try signing in again.');
    }
  };

  // Handle adding a car to favorites from the modal
  const handleAddFavorite = async (car) => {
    await addFavorite(car);
  };

  // Handle "Analyze All Vehicles" button - opens AL with comprehensive context
  const handleAnalyzeAllVehicles = useCallback(async () => {
    // Build comprehensive vehicle summary with all available data
    const vehicleSummary = vehiclesWithCars.map((v, idx) => {
      const name = v.matchedCar?.name || `${v.vehicle.year} ${v.vehicle.make} ${v.vehicle.model}`;
      const mileage = v.vehicle.current_mileage || v.vehicle.mileage;
      const mileageStr = mileage ? `${mileage.toLocaleString()} mi` : 'Unknown mileage';
      const year = v.vehicle.year || 'Unknown year';
      const usageType = v.vehicle.usage_type || 'daily';
      const slug = v.matchedCar?.slug || '';
      
      // Include service history if available
      let serviceInfo = '';
      if (v.vehicle.last_oil_change_date || v.vehicle.last_oil_change_miles) {
        const oilDate = v.vehicle.last_oil_change_date ? new Date(v.vehicle.last_oil_change_date).toLocaleDateString() : null;
        const oilMiles = v.vehicle.last_oil_change_miles?.toLocaleString();
        serviceInfo = ` | Last oil change: ${oilDate || 'unknown date'}${oilMiles ? ` at ${oilMiles} mi` : ''}`;
      }
      
      return `${idx + 1}. ${name} (${year}) - ${mileageStr} - Usage: ${usageType}${serviceInfo}${slug ? ` [slug: ${slug}]` : ''}`;
    }).join('\n');
    
    // Get favorites summary
    const favoritesSummary = favoriteCars.length > 0 
      ? favoriteCars.slice(0, 10).map(car => `- ${car.name || `${car.year} ${car.make} ${car.model}`}`).join('\n')
      : 'No favorites saved';
    
    // Get builds summary
    const buildsSummary = builds.length > 0
      ? builds.slice(0, 5).map(b => `- ${b.name || 'Unnamed build'}: ${b.carSlug || 'unknown car'}`).join('\n')
      : 'No build projects';
    
    // Get user location from profile if available
    const userLocation = profile?.location_zip 
      ? `${profile.location_city || ''}, ${profile.location_state || ''} ${profile.location_zip}`.trim()
      : null;
    
    // Get current month/season for seasonal context
    const now = new Date();
    const month = now.toLocaleDateString('en-US', { month: 'long' });
    const season = now.getMonth() >= 2 && now.getMonth() <= 4 ? 'Spring'
      : now.getMonth() >= 5 && now.getMonth() <= 7 ? 'Summer'
      : now.getMonth() >= 8 && now.getMonth() <= 10 ? 'Fall'
      : 'Winter';
    
    // Build the comprehensive prompt
    const prompt = `# Garage Concierge Analysis Request

## My Vehicles (${vehiclesWithCars.length} total)
${vehicleSummary}

## My Favorites (${favoriteCars.length} cars)
${favoritesSummary}

## My Build Projects (${builds.length} projects)
${buildsSummary}

${userLocation ? `## My Location\n${userLocation}\n` : ''}
## Current Date
${month} ${now.getFullYear()} (${season})

---

Please provide a comprehensive "Garage Concierge" analysis covering:

1. **Maintenance Priorities** - Based on mileage and last service dates, what should I address first? Use get_maintenance_schedule for each vehicle to check intervals.

2. **Safety & Reliability Alerts** - Are there any known issues, TSBs, or recalls affecting my vehicles? Use get_known_issues for each.

3. **Fleet Strengths** - What does my collection do well? (Performance, practicality, variety, etc.)

4. **Fleet Gaps** - What's missing? Suggestions for my next vehicle based on my taste (favorites/builds).

${userLocation ? `5. **Upcoming Events Near Me** - Use search_events to find relevant car events in my area.\n` : ''}
6. **Fresh Content** - Any expert reviews, comparison tests, or news about my cars? Use get_expert_reviews.

7. **Seasonal Considerations** - What should I be thinking about for ${season}? (Tire swaps, storage prep, road trip planning, etc.)

8. **Recommended Next Steps** - Top 3 actionable items I should tackle.

Be specific, mention actual vehicles by name, and use your tools to get accurate data. This is a concierge-level analysis!`;
    
    // Clean user-facing message (what they see in chat)
    const vehicleNames = vehiclesWithCars.slice(0, 3).map(v => 
      v.matchedCar?.name || `${v.vehicle.year} ${v.vehicle.make} ${v.vehicle.model}`
    );
    const vehicleList = vehicleNames.join(', ');
    const moreText = vehiclesWithCars.length > 3 ? ` and ${vehiclesWithCars.length - 3} more` : '';
    
    const displayMessage = `Analyze my garage: ${vehicleList}${moreText}. Check maintenance priorities, safety alerts, and give me recommendations.`;
    
    openChatWithPrompt(prompt, {
      category: 'Garage Concierge',
      vehicleCount: vehiclesWithCars.length,
      hasLocation: !!userLocation,
    }, displayMessage);
  }, [vehiclesWithCars, favoriteCars, builds, profile, openChatWithPrompt]);

  // Toggle quick update mode
  const handleToggleQuickUpdate = () => {
    if (!quickUpdateMode) {
      // Entering quick update mode - initialize values from current vehicles
      const initialValues = {};
      vehicles.forEach(v => {
        initialValues[v.id] = v.mileage || '';
      });
      setQuickUpdateValues(initialValues);
    }
    setQuickUpdateMode(!quickUpdateMode);
  };

  // Update mileage in quick update mode
  const handleQuickMileageChange = (vehicleId, value) => {
    setQuickUpdateValues(prev => ({
      ...prev,
      [vehicleId]: value
    }));
  };

  // Save all quick updates
  const handleSaveQuickUpdates = async () => {
    setSavingQuickUpdates(true);
    
    try {
      // Update each vehicle that has changed
      const updates = Object.entries(quickUpdateValues).map(async ([vehicleId, mileage]) => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (vehicle && mileage !== vehicle.mileage) {
          await updateVehicle(vehicleId, { mileage: Number(mileage) || null });
        }
      });
      
      await Promise.all(updates);
      setQuickUpdateMode(false);
      setQuickUpdateValues({});
    } catch (err) {
      console.error('[QuickUpdate] Error saving mileage updates:', err);
    } finally {
      setSavingQuickUpdates(false);
    }
  };

  // ============================================================================
  // SWIPE GESTURE HANDLERS (Mobile Navigation)
  // ============================================================================
  
  const handleTouchStart = useCallback((e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    touchEndRef.current = { x: 0, y: 0 };
  }, []);

  const handleTouchMove = useCallback((e) => {
    touchEndRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (isEditMode || quickUpdateMode) return; // Disable swipe in edit mode
    
    const deltaX = touchStartRef.current.x - touchEndRef.current.x;
    const deltaY = touchStartRef.current.y - touchEndRef.current.y;
    
    // Only process if horizontal swipe is dominant (2x greater than vertical)
    // and meets minimum threshold of 50px
    const minSwipeDistance = 50;
    if (Math.abs(deltaX) < minSwipeDistance) return;
    if (Math.abs(deltaY) > Math.abs(deltaX) / 2) return;
    
    if (deltaX > 0) {
      // Swipe left → next vehicle
      setSelectedIndex(prev => (prev < currentItems.length - 1 ? prev + 1 : 0));
    } else {
      // Swipe right → previous vehicle
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : currentItems.length - 1));
    }
  }, [isEditMode, quickUpdateMode, currentItems.length]);

  // ============================================================================
  // REORDER HANDLERS (Edit Mode)
  // ============================================================================
  
  const handleMoveVehicle = useCallback(async (fromIndex, toIndex) => {
    if (activeTab !== 'mycars') return;
    if (toIndex < 0 || toIndex >= vehiclesWithCars.length) return;
    
    setIsReordering(true);
    
    // Create new order array
    const newOrder = [...vehiclesWithCars];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    
    // Extract vehicle IDs in new order
    const vehicleIds = newOrder.map(item => item.vehicle.id);
    
    const result = await reorderVehicles(vehicleIds);
    
    if (result.success) {
      // Update selected index to follow the moved item
      setSelectedIndex(toIndex);
    } else {
      console.error('[Garage] Reorder failed:', result.error);
    }
    
    setIsReordering(false);
  }, [activeTab, vehiclesWithCars, reorderVehicles]);

  const handleToggleEditMode = useCallback(() => {
    setIsEditMode(prev => !prev);
  }, []);

  // If viewing a build detail, show that instead
  if (selectedBuild) {
    return (
      <div className={styles.page} data-no-main-offset>
        <BuildDetailView 
          build={selectedBuild}
          car={allCars.find(c => c.slug === selectedBuild.carSlug)}
          onBack={() => {
            setSelectedBuild(null);
            window.history.pushState({}, '', '/garage');
          }}
        />
      </div>
    );
  }
  
  return (
    <div className={styles.page} data-no-main-offset>
      {/* Optimized Background Image */}
      <div className={styles.backgroundImageWrapper}>
        <Image
          src="https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/pages/garage/background.webp"
          alt="Garage Background"
          fill
          priority={false}
          loading="lazy"
          quality={50}
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'center', opacity: 0.4 }}
        />
      </div>

      {/* Compact Header Bar */}
      <div className={styles.headerBar}>
        <div className={styles.headerLeft}>
          <h1 className={styles.titleCompact}>MY GARAGE</h1>
        </div>

        <div className={styles.headerCenter}>
          {/* Tab Pills */}
          <div className={styles.tabPills}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${styles.tabPill} ${activeTab === tab.id ? styles.tabPillActive : ''}`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* Quick Actions for My Collection tab */}
          {activeTab === 'mycars' && (
            <div className={styles.quickActions}>
              {/* Add Vehicle Button - Always visible */}
              <button
                className={styles.addVehicleBtn}
                onClick={() => setIsAddVehicleOpen(true)}
                title="Add a vehicle to your garage"
              >
                <Icons.plus size={16} />
                <span className={styles.quickActionLabel}>Add Vehicle</span>
              </button>

              {/* Reorder Mode Toggle - Only when you have 2+ vehicles */}
              {vehicles.length > 1 && (
                <button
                  className={`${styles.quickActionBtn} ${isEditMode ? styles.quickActionBtnActive : ''}`}
                  onClick={handleToggleEditMode}
                  title={isEditMode ? 'Done Reordering' : 'Reorder Vehicles'}
                  disabled={isReordering}
                >
                  {isEditMode ? <Icons.check size={16} /> : <Icons.settings size={16} />}
                  <span className={styles.quickActionLabel}>
                    {isEditMode ? 'Done' : 'Reorder'}
                  </span>
                </button>
              )}

              {/* Quick Update Mode Toggle - Only when you have vehicles */}
              {vehicles.length > 0 && !isEditMode && (
                <button
                  className={`${styles.quickActionBtn} ${quickUpdateMode ? styles.quickActionBtnActive : ''}`}
                  onClick={handleToggleQuickUpdate}
                  title={quickUpdateMode ? 'Cancel Quick Update' : 'Quick Update All Mileage'}
                >
                  <Icons.edit size={16} />
                  <span className={styles.quickActionLabel}>
                    {quickUpdateMode ? 'Cancel' : 'Quick Update'}
                  </span>
                </button>
              )}

              {/* Analyze All Vehicles - Enthusiast+ */}
              {vehicles.length > 0 && (
                <PremiumGate feature="alCollector" fallback={null}>
                  <button
                    className={styles.analyzeAllBtn}
                    onClick={handleAnalyzeAllVehicles}
                    title="Analyze All Vehicles with AL"
                  >
                    <img 
                      src={UI_IMAGES.alMascot}
                      alt=""
                      width={16}
                      height={16}
                      style={{ marginRight: 6 }}
                    />
                    <span>Analyze All</span>
                  </button>
                </PremiumGate>
              )}
            </div>
          )}

          {/* Add Favorites button when on Favorites tab */}
          {activeTab === 'favorites' && (
            <div className={styles.quickActions}>
              <button
                className={styles.addVehicleBtn}
                onClick={() => setIsAddFavoritesOpen(true)}
                title="Add favorites from our catalog"
              >
                <Icons.plus size={16} />
                <span className={styles.quickActionLabel}>Add Favorites</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area - with swipe support for mobile navigation */}
      <div 
        className={styles.mainContent}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Quick Update Mode Overlay */}
        {quickUpdateMode && activeTab === 'mycars' && (
          <div className={styles.quickUpdateOverlay}>
            <div className={styles.quickUpdatePanel}>
              <div className={styles.quickUpdateHeader}>
                <h3>Quick Update Mileage</h3>
                <p>Update mileage for all vehicles at once</p>
              </div>
              
              <div className={styles.quickUpdateList}>
                {vehiclesWithCars.map((item) => {
                  const vehicleName = item.matchedCar?.name || 
                    `${item.vehicle.year || ''} ${item.vehicle.make || ''} ${item.vehicle.model || ''}`.trim();
                  
                  return (
                    <div key={item.vehicle.id} className={styles.quickUpdateItem}>
                      <div className={styles.quickUpdateVehicleInfo}>
                        <span className={styles.quickUpdateVehicleName}>{vehicleName}</span>
                        <span className={styles.quickUpdateCurrentMileage}>
                          Current: {item.vehicle.mileage ? item.vehicle.mileage.toLocaleString() : 'Not set'}
                        </span>
                      </div>
                      <input
                        type="number"
                        className={styles.quickUpdateInput}
                        value={quickUpdateValues[item.vehicle.id] || ''}
                        onChange={(e) => handleQuickMileageChange(item.vehicle.id, e.target.value)}
                        placeholder="Enter mileage"
                        min="0"
                        step="1"
                      />
                    </div>
                  );
                })}
              </div>
              
              <div className={styles.quickUpdateActions}>
                <button
                  className={styles.quickUpdateCancel}
                  onClick={handleToggleQuickUpdate}
                  disabled={savingQuickUpdates}
                >
                  Cancel
                </button>
                <button
                  className={styles.quickUpdateSave}
                  onClick={handleSaveQuickUpdates}
                  disabled={savingQuickUpdates}
                >
                  {savingQuickUpdates ? (
                    <>
                      <LoadingSpinner size="small" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Icons.check size={16} />
                      <span>Save All Updates</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* My Collection & Favorites - Hero display layout */}
        {(activeTab === 'mycars' || activeTab === 'favorites') && (
          currentItems.length > 0 ? (
            <>
              {/* Hero Display */}
              <HeroVehicleDisplay
                item={currentItem}
                type={activeTab}
                onAction={handleBuildAction}
                onAddToMyCars={handleAddFavoriteToMyCars}
                isInMyCars={activeTab === 'favorites' && currentItem ? isInMyCars(currentItem.slug) : false}
                onUpdateVehicle={updateVehicle}
                onClearModifications={clearModifications}
                onUpdateCustomSpecs={updateCustomSpecs}
                onClearCustomSpecs={clearCustomSpecs}
                userId={user?.id}
              />

              {/* Thumbnail Strip at Bottom */}
              <ThumbnailStrip
                items={currentItems}
                selectedIndex={selectedIndex}
                onSelect={setSelectedIndex}
                type={activeTab}
                onRemoveItem={handleRemoveRequest}
                isEditMode={isEditMode && activeTab === 'mycars'}
                onMoveItem={handleMoveVehicle}
                isReordering={isReordering}
              />

              {/* Vehicle Counter */}
              <div className={styles.vehicleCounter}>
                <span>{selectedIndex + 1}</span>
                <span className={styles.counterDivider}>/</span>
                <span>{currentItems.length}</span>
              </div>
            </>
          ) : isDataLoading ? (
            // Show loading indicator while fetching data
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <LoadingSpinner />
              </div>
              <h3 className={styles.emptyTitle}>Loading your garage...</h3>
              <p className={styles.emptyDescription}>
                {authLoading ? 'Checking authentication...' : 'Fetching your data...'}
              </p>
            </div>
          ) : sessionExpired || authError ? (
            // Show auth error state with retry option
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Icons.alert size={48} />
              </div>
              <h3 className={styles.emptyTitle}>
                {sessionExpired ? 'Session Expired' : 'Connection Issue'}
              </h3>
              <p className={styles.emptyDescription}>
                {sessionExpired 
                  ? 'Your session has expired. Please sign in again to access your garage.'
                  : 'There was an issue loading your data. Please try again.'}
              </p>
              <button 
                onClick={() => sessionExpired ? authModal.openSignIn() : window.location.reload()} 
                className={styles.emptyAction}
              >
                {sessionExpired ? 'Sign In' : 'Retry'}
              </button>
            </div>
          ) : (
            <EmptyState
              icon={tabs.find(t => t.id === activeTab)?.icon || Icons.car}
              title={
                activeTab === 'mycars' ? 'No Vehicles Yet' : 'No Favorites Yet'
              }
              description={
                activeTab === 'mycars' 
                  ? 'Add the vehicles you own to track maintenance and get personalized recommendations.'
                  : 'Build your dream garage by adding cars you love. Browse the catalog and tap the heart icon.'
              }
              actionLabel={
                activeTab === 'mycars' ? 'Add Your First Car' : 'Add Your First Favorite'
              }
              onAction={() => {
                if (activeTab === 'mycars') {
                  setIsAddVehicleOpen(true);
                } else {
                  setIsAddFavoritesOpen(true);
                }
              }}
            />
          )
        )}
      </div>
      
      <AuthModal 
        isOpen={authModal.isOpen}
        onClose={authModal.close}
        defaultMode={authModal.defaultMode}
      />

      <AddVehicleModal
        isOpen={isAddVehicleOpen}
        onClose={() => setIsAddVehicleOpen(false)}
        onAdd={handleAddVehicle}
        existingVehicles={vehicles}
      />

      <AddFavoritesModal
        isOpen={isAddFavoritesOpen}
        onClose={() => setIsAddFavoritesOpen(false)}
        onAdd={handleAddFavorite}
        existingFavorites={favorites}
      />

      {/* Confirmation Modal for deletions */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={handleCancelRemove}
        onConfirm={handleConfirmRemove}
        title={getConfirmationDetails().title}
        message={getConfirmationDetails().message}
        confirmLabel="Remove"
        confirmType="danger"
      />

      {/* Onboarding Popup */}
      <OnboardingPopup 
        storageKey="autorev_garage_onboarding_dismissed"
        steps={garageOnboardingSteps}
        accentColor="var(--sn-accent)"
      />
    </div>
  );
}

// Loading fallback
function GarageLoading() {
  return (
    <div className={styles.page} data-no-main-offset>
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" />
      </div>
    </div>
  );
}

// Main export
export default function GaragePage() {
  return (
    <ErrorBoundary name="GaragePage" featureContext="garage">
      <Suspense fallback={<GarageLoading />}>
        <GarageContent />
      </Suspense>
    </ErrorBoundary>
  );
}
