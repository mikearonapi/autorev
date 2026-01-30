'use client';

/**
 * My Garage Page - Immersive Vehicle Showcase (GRAVL-inspired)
 *
 * Full-screen native app experience with three core tabs:
 * - Vehicles: Your owned cars with build tracking, photos, and reference data
 * - Builds: Your saved build projects and modifications
 * - Tuning Shop: Link to the full modification planner
 *
 * Each vehicle has sub-views: Specs, Build, Performance, Parts, Install, Photos
 * Photo management is centralized here (not in Tuning Shop).
 */

import React, { useState, useEffect, useRef, Suspense, useCallback, useMemo } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { createPortal } from 'react-dom';

import AddVehicleModal from '@/components/AddVehicleModal';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import BuildDetailView from '@/components/BuildDetailView';
import BuildMediaGallery from '@/components/BuildMediaGallery';
import CarActionMenu from '@/components/CarActionMenu';
import CarImage from '@/components/CarImage';
import { DynamicSortableVehicleList, preloadGarageComponents } from '@/components/dynamic';
import ErrorBoundary from '@/components/ErrorBoundary';
import ImageUploader from '@/components/ImageUploader';
import LoadingSpinner from '@/components/LoadingSpinner';
import OnboardingPopup, { garageOnboardingSteps } from '@/components/OnboardingPopup';
import PremiumGate, { usePremiumAccess } from '@/components/PremiumGate';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import { usePointsNotification } from '@/components/providers/PointsNotificationProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import ServiceLogModal from '@/components/ServiceLogModal';
import { DataSourceIndicator } from '@/components/ui';
import PullToRefresh from '@/components/ui/PullToRefresh';
import { Skeleton } from '@/components/ui/Skeleton';
import SwipeableRow from '@/components/ui/SwipeableRow';
import VehicleBuildPanel from '@/components/VehicleBuildPanel';
import WheelTireSpecsCard from '@/components/WheelTireSpecsCard';
import { useCarsList, useCarBySlug } from '@/hooks/useCarData';
import { useCarImages } from '@/hooks/useCarImages';
import { submitCarRequest } from '@/lib/carRequestService';
import {
  fetchAllMaintenanceData,
  fetchUserServiceLogs,
  addServiceLog,
  updateServiceLog,
  deleteServiceLog,
} from '@/lib/maintenanceService';
import { calculateAllModificationGains } from '@/lib/performanceCalculator';
import { calculateWeightedScore, ENTHUSIAST_WEIGHTS } from '@/lib/scoring';
import { decodeVIN } from '@/lib/vinDecoder';

import styles from './page.module.css';
// GarageScoreCard moved to Dashboard tab - January 2026

// Video file extensions - URLs containing these are videos, not images
// Used to prevent native video controls from appearing when rendering images
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v', '.quicktime'];

/**
 * Check if a URL points to a video file based on extension
 * This catches cases where media_type might be missing/incorrect in the database
 * @param {string} url - The URL to check
 * @returns {boolean} - True if the URL appears to be a video
 */
function isVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const lowerUrl = url.toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => lowerUrl.includes(ext));
}

// Icon wrapper to prevent browser extension DOM conflicts
// Wrapping SVGs in a span prevents "removeChild" errors when extensions modify the DOM
const IconWrapper = ({ children, style }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      lineHeight: 0,
      ...style,
    }}
    suppressHydrationWarning
  >
    {children}
  </span>
);

// Icons
const Icons = {
  car: ({ size = 20, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
        <circle cx="7" cy="17" r="2" />
        <path d="M9 17h6" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    </IconWrapper>
  ),
  chevronDown: ({ size = 20, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </IconWrapper>
  ),
  chevronUp: ({ size = 20, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </IconWrapper>
  ),
  x: ({ size = 20, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </IconWrapper>
  ),
  heart: ({ size = 20, filled = false, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </IconWrapper>
  ),
  wrench: ({ size = 20, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    </IconWrapper>
  ),
  arrowRight: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </IconWrapper>
  ),
  arrowLeft: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
    </IconWrapper>
  ),
  trash: ({ size = 20, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    </IconWrapper>
  ),
  // Drag handle (grip lines) for reordering
  grip: ({ size = 20, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="8" y1="6" x2="16" y2="6" />
        <line x1="8" y1="12" x2="16" y2="12" />
        <line x1="8" y1="18" x2="16" y2="18" />
      </svg>
    </IconWrapper>
  ),
  plus: ({ size = 20, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </IconWrapper>
  ),
  gauge: ({ size = 20, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </IconWrapper>
  ),
  folder: ({ size = 20, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    </IconWrapper>
  ),
  tool: ({ size = 20, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 21h4l13-13a2.83 2.83 0 0 0-4-4L3 17v4z" />
        <path d="M14.5 5.5L18.5 9.5" />
      </svg>
    </IconWrapper>
  ),
  dollar: ({ size = 20, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    </IconWrapper>
  ),
  settings: ({ size = 20, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </IconWrapper>
  ),
  chevronLeft: ({ size = 24, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </IconWrapper>
  ),
  chevronRight: ({ size = 24, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </IconWrapper>
  ),
  info: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    </IconWrapper>
  ),
  search: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </IconWrapper>
  ),
  check: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </IconWrapper>
  ),
  alert: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </IconWrapper>
  ),
  loader: ({ size = 16, className, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
      </svg>
    </IconWrapper>
  ),
  shield: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    </IconWrapper>
  ),
  star: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </IconWrapper>
  ),
  fire: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    </IconWrapper>
  ),
  clipboard: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    </IconWrapper>
  ),
  book: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    </IconWrapper>
  ),
  calendar: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    </IconWrapper>
  ),
  edit: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </IconWrapper>
  ),
  link: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    </IconWrapper>
  ),
  sparkles: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
        <path d="M5 3v4" />
        <path d="M19 17v4" />
        <path d="M3 5h4" />
        <path d="M17 19h4" />
      </svg>
    </IconWrapper>
  ),
  unlock: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
      </svg>
    </IconWrapper>
  ),
  loader: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-spin"
      >
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
      </svg>
    </IconWrapper>
  ),
  alertCircle: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </IconWrapper>
  ),
  refresh: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
    </IconWrapper>
  ),
  camera: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    </IconWrapper>
  ),
  gallery: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    </IconWrapper>
  ),
  list: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    </IconWrapper>
  ),
  package: ({ size = 16, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    </IconWrapper>
  ),
  user: ({ size = 20, style }) => (
    <IconWrapper style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
      </svg>
    </IconWrapper>
  ),
};

// Visual Rating Bar Component - GRAVL-style progress bar for X/10 ratings
function RatingBar({ value, maxValue = 10, label }) {
  if (value === undefined || value === null) return null;

  const percentage = Math.min(Math.max((value / maxValue) * 100, 0), 100);

  // Determine color class based on percentage
  const getColorClass = (pct) => {
    if (pct >= 80) return 'high';
    if (pct >= 60) return 'good';
    if (pct >= 40) return 'medium';
    return 'low';
  };

  const colorClass = getColorClass(percentage);

  return (
    <div className={styles.barRatingItem}>
      <span className={styles.barRatingLabel}>{label}</span>
      <div className={styles.ratingBarTrack}>
        <div
          className={`${styles.ratingBarFill} ${styles[colorClass]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`${styles.ratingScoreValue} ${styles[colorClass]}`}>
        {value}/{maxValue}
      </span>
    </div>
  );
}

// Performance Score Gauge Component - Circular visualization
function PerformanceScoreGauge({ score, label: _label = 'Performance Score', stats = [] }) {
  const percentage = Math.min(Math.max(score, 0), 100);
  const circumference = 2 * Math.PI * 52; // radius = 52
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={styles.performanceScoreCard}>
      <div className={styles.performanceScoreGauge}>
        <svg viewBox="0 0 120 120">
          <circle className={styles.track} cx="60" cy="60" r="52" />
          <circle
            className={styles.fill}
            cx="60"
            cy="60"
            r="52"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
            }}
          />
        </svg>
        <div className={styles.performanceScoreValue}>
          <div className={styles.performanceScoreNumber}>{Math.round(score)}</div>
          <div className={styles.performanceScoreLabel}>Score</div>
        </div>
      </div>

      {stats.length > 0 && (
        <div className={styles.performanceKeyStats}>
          {stats.map((stat, index) => (
            <div key={index} className={styles.performanceKeyStat}>
              <div className={styles.performanceKeyStatValue}>
                {stat.value}
                {stat.unit && <span className={styles.performanceKeyStatUnit}>{stat.unit}</span>}
              </div>
              <div className={styles.performanceKeyStatLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Brand Logo Component - displays brand name with consistent gold color
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Reserved for future use
function BrandLogo({ brand }) {
  // Use consistent gold/yellow color for all brands in garage view
  // Uses design token only - no hardcoded hex fallback per SOURCE_OF_TRUTH.md
  const brandColor = 'var(--sn-gold)';

  return (
    <div className={styles.brandLogo}>
      <span className={styles.brandName} style={{ color: brandColor }}>
        {brand?.toUpperCase()}
      </span>
    </div>
  );
}

// Desktop Garage Layout Component
// Two-column layout for desktop: Image left, info panel right
function DesktopGarageLayout({
  item,
  selectedIndex,
  totalItems,
  onNavigate,
  onAddVehicle,
  viewMode: _viewMode,
  onViewModeChange: _onViewModeChange,
}) {
  const car = item?.matchedCar || item?.car;
  const isOwnedVehicle = item?.vehicle?.id != null;
  const carSlugForImages = car?.slug || item?.vehicle?.matchedCarSlug || null;

  // Get user's uploaded images for this car (same hook as mobile HeroVehicleDisplay)
  const {
    images: carImages,
    heroImage: userHeroImage,
    heroImageUrl: hookHeroImageUrl,
  } = useCarImages(carSlugForImages, { enabled: !!carSlugForImages });

  // Calculate modification gains for owned vehicles
  const modificationGains = useMemo(() => {
    if (!isOwnedVehicle || !car) return { hpGain: 0, torqueGain: 0, zeroToSixtyImprovement: 0 };
    return calculateAllModificationGains(item.vehicle?.installedModifications || [], car);
  }, [isOwnedVehicle, car, item?.vehicle?.installedModifications]);

  // Get the correct image to display (match mobile HeroVehicleDisplay logic)
  const hasCustomHero = !!userHeroImage;
  // Only use hookHeroImageUrl if it's not a video URL (safety check)
  const userHeroImageUrl =
    hookHeroImageUrl && !isVideoUrl(hookHeroImageUrl)
      ? hookHeroImageUrl
      : item?.vehicle?.heroImageUrl && !isVideoUrl(item?.vehicle?.heroImageUrl)
        ? item?.vehicle?.heroImageUrl
        : null;
  // Check for stock images using correct property names from car data
  const hasStockImage = !!(car?.imageGarageUrl || car?.imageHeroUrl);
  // Filter out videos when selecting fallback - check both media_type AND URL extension
  const firstImageFromCarImages = carImages?.find((img) => {
    if (img.media_type === 'video') return false;
    const url = img.blob_url || img.blobUrl || img.url;
    if (isVideoUrl(url)) return false;
    return true;
  });
  // Also verify fallback URL from photos is not a video
  const photosUrl = item?.vehicle?.photos?.[0]?.url;
  const safePhotosUrl = photosUrl && !isVideoUrl(photosUrl) ? photosUrl : null;
  const fallbackHeroUrl =
    !hasCustomHero && !hasStockImage && firstImageFromCarImages
      ? firstImageFromCarImages.url
      : safePhotosUrl;

  // Vehicle info
  const brand = item?.vehicle?.make || car?.brand || car?.make || 'VEHICLE';
  const year = item?.vehicle?.year || car?.years?.split('-')[0] || car?.year;
  const model = item?.vehicle?.model || car?.model || car?.name || 'Vehicle';

  // Navigation
  const canGoPrev = selectedIndex > 0;
  const canGoNext = selectedIndex < totalItems - 1;

  const handlePrev = () => {
    if (canGoPrev && onNavigate) {
      onNavigate(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext && onNavigate) {
      onNavigate(selectedIndex + 1);
    }
  };

  // Stats with modification gains
  const hp = car?.hp
    ? isOwnedVehicle && modificationGains.hpGain > 0
      ? car.hp + modificationGains.hpGain
      : car.hp
    : null;
  const torque = car?.torque
    ? isOwnedVehicle && modificationGains.torqueGain > 0
      ? car.torque + modificationGains.torqueGain
      : car.torque
    : null;
  const zeroToSixty = car?.zeroToSixty
    ? isOwnedVehicle && modificationGains.zeroToSixtyImprovement > 0
      ? (car.zeroToSixty - modificationGains.zeroToSixtyImprovement).toFixed(1)
      : car.zeroToSixty
    : null;
  const topSpeed = car?.topSpeed || null;

  return (
    <div className={styles.desktopGarageLayout}>
      {/* Left column: Info panel */}
      <div className={styles.desktopInfoPanel}>
        {/* Vehicle header */}
        <div className={styles.desktopVehicleHeader}>
          <div className={styles.desktopBrandYear}>
            <span className={styles.desktopBrandName}>{brand}</span>
            <span className={styles.desktopYear}>{year}</span>
          </div>
          <h2 className={styles.desktopVehicleName}>{model}</h2>
        </div>

        {/* Stats grid */}
        <div className={styles.desktopStatsGrid}>
          <div className={styles.desktopStatItem}>
            <span
              className={`${styles.desktopStatValue} ${isOwnedVehicle && modificationGains.hpGain > 0 ? styles.desktopStatValueModified : ''}`}
            >
              {hp || '—'}
            </span>
            <span className={styles.desktopStatLabel}>Horsepower</span>
          </div>
          <div className={styles.desktopStatItem}>
            <span
              className={`${styles.desktopStatValue} ${isOwnedVehicle && modificationGains.torqueGain > 0 ? styles.desktopStatValueModified : ''}`}
            >
              {torque || '—'}
            </span>
            <span className={styles.desktopStatLabel}>LB-FT Torque</span>
          </div>
          <div className={styles.desktopStatItem}>
            <span
              className={`${styles.desktopStatValue} ${isOwnedVehicle && modificationGains.zeroToSixtyImprovement > 0 ? styles.desktopStatValueModified : ''}`}
            >
              {zeroToSixty ? `${zeroToSixty}s` : '—'}
            </span>
            <span className={styles.desktopStatLabel}>0-60 MPH</span>
          </div>
          <div className={styles.desktopStatItem}>
            <span className={styles.desktopStatValue}>{topSpeed || '—'}</span>
            <span className={styles.desktopStatLabel}>Top Speed</span>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className={styles.desktopNavButtons}>
          <Link
            href={
              item.vehicle?.activeBuildId
                ? `/garage/my-specs?build=${item.vehicle.activeBuildId}`
                : `/garage/my-specs?car=${car?.slug}`
            }
            className={styles.desktopNavBtn}
          >
            <Icons.gauge size={18} />
            <span>Specs</span>
          </Link>
          {isOwnedVehicle && car?.slug && (
            <>
              <Link
                href={
                  item.vehicle?.activeBuildId
                    ? `/garage/my-build?build=${item.vehicle.activeBuildId}`
                    : `/garage/my-build?car=${car.slug}`
                }
                className={styles.desktopNavBtn}
              >
                <Icons.wrench size={18} />
                <span>Build</span>
              </Link>
              <Link
                href={
                  item.vehicle?.activeBuildId
                    ? `/garage/my-parts?build=${item.vehicle.activeBuildId}`
                    : `/garage/my-parts?car=${car.slug}`
                }
                className={styles.desktopNavBtn}
              >
                <Icons.package size={18} />
                <span>Parts</span>
              </Link>
              <Link
                href={
                  item.vehicle?.activeBuildId
                    ? `/garage/my-install?build=${item.vehicle.activeBuildId}`
                    : `/garage/my-install?car=${car.slug}`
                }
                className={styles.desktopNavBtn}
              >
                <Icons.tool size={18} />
                <span>Install</span>
              </Link>
              <Link
                href={
                  item.vehicle?.activeBuildId
                    ? `/garage/my-photos?build=${item.vehicle.activeBuildId}`
                    : `/garage/my-photos?car=${car.slug}`
                }
                className={styles.desktopNavBtn}
              >
                <Icons.camera size={18} />
                <span>Photos</span>
              </Link>
            </>
          )}
        </div>

        {/* Vehicle switcher */}
        {totalItems > 1 && (
          <div className={styles.desktopVehicleSwitcher}>
            <div className={styles.desktopVehicleNav}>
              <button
                className={styles.desktopNavArrow}
                onClick={handlePrev}
                disabled={!canGoPrev}
                aria-label="Previous vehicle"
              >
                <Icons.chevronLeft size={16} />
              </button>
              <span className={styles.desktopVehicleCounter}>
                {selectedIndex + 1} of {totalItems}
              </span>
              <button
                className={styles.desktopNavArrow}
                onClick={handleNext}
                disabled={!canGoNext}
                aria-label="Next vehicle"
              >
                <Icons.chevronRight size={16} />
              </button>
            </div>
            <button className={styles.desktopAddVehicleBtn} onClick={onAddVehicle}>
              <Icons.plus size={16} />
              Add Vehicle
            </button>
          </div>
        )}

        {/* Single vehicle - just show add button */}
        {totalItems <= 1 && (
          <div className={styles.desktopVehicleSwitcher}>
            <div />
            <button className={styles.desktopAddVehicleBtn} onClick={onAddVehicle}>
              <Icons.plus size={16} />
              Add Vehicle
            </button>
          </div>
        )}
      </div>

      {/* Right column: Image */}
      <div className={styles.desktopImageColumn}>
        <div className={styles.heroImageWrapper}>
          <div className={styles.heroImageContainer}>
            {hasCustomHero && userHeroImageUrl ? (
              <Image
                src={userHeroImageUrl}
                alt={model || 'Vehicle'}
                fill
                className={styles.heroImage}
                priority
              />
            ) : fallbackHeroUrl ? (
              <Image
                src={fallbackHeroUrl}
                alt={model || 'Vehicle'}
                fill
                className={styles.heroImage}
                priority
              />
            ) : hasStockImage ? (
              <CarImage car={car} variant="garage" className={styles.heroImage} lazy={false} />
            ) : (
              <div className={styles.heroPlaceholder}>
                <Icons.car size={80} />
                <span className={styles.heroPlaceholderText}>{model || 'Vehicle'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Hero Vehicle Display Component
// Progressive disclosure: Collapsed → Expanded (key info) → Full Details/Owner Dashboard
function HeroVehicleDisplay({
  item,
  type,
  onAction: _onAction,
  onUpdateVehicle,
  onClearModifications: _onClearModifications,
  onUpdateCustomSpecs,
  onClearCustomSpecs: _onClearCustomSpecs,
  userId,
  selectedIndex,
  totalItems,
  onNavigate,
  viewMode,
  onViewModeChange,
  onAddVehicle,
}) {
  // Panel states: 'collapsed', 'expanded', 'details'
  const [panelState, setPanelState] = useState('collapsed');
  const [showPerformance, setShowPerformance] = useState(false);

  // For owned vehicles: toggle between views in details mode
  // 'specs' = Full specifications (incl. owner data for My Collection), 'safety' = Safety data
  const [detailsView, _setDetailsView] = useState('specs');

  // VIN input state
  const [vinInput, setVinInput] = useState('');
  const [vinLookupLoading, setVinLookupLoading] = useState(false);
  const [vinData, setVinData] = useState(null);
  const [vinError, setVinError] = useState(null);
  const [vinSaveStatus, setVinSaveStatus] = useState(null); // 'saving', 'saved', 'error', null

  // Maintenance data for owned vehicles
  const [maintenanceData, setMaintenanceData] = useState({
    specs: null,
    issues: [],
    intervals: [],
  });
  const [_loadingMaintenance, setLoadingMaintenance] = useState(false);

  // Wheel/tire fitment options
  const [fitmentOptions, setFitmentOptions] = useState([]);
  const [_showFitmentOptions, _setShowFitmentOptions] = useState(false);

  // Safety data (recalls, complaints, ratings)
  const [safetyData, setSafetyData] = useState({
    recalls: [],
    complaints: [],
    investigations: [],
    safetyRatings: null,
  });
  const [loadingSafety, setLoadingSafety] = useState(false);

  // Service logs
  const [_serviceLogs, setServiceLogs] = useState([]);
  const [_loadingServiceLogs, setLoadingServiceLogs] = useState(false);
  const [showServiceLogModal, setShowServiceLogModal] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [_deletingLogId, setDeletingLogId] = useState(null);

  // Daily driver enrichment state
  const [enrichmentData, setEnrichmentData] = useState(null);
  const [enrichmentStatus, setEnrichmentStatus] = useState('none'); // 'none', 'checking', 'available', 'enriching', 'enriched', 'error'
  const [enrichmentError, setEnrichmentError] = useState(null);

  // Driving Character modal state
  const [showDrivingCharacter, setShowDrivingCharacter] = useState(false);

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
    // Reset driving character modal
    setShowDrivingCharacter(false);
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
            if (
              data.enrichment.maintenance_specs ||
              data.enrichment.service_intervals ||
              data.enrichment.known_issues
            ) {
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
  }, [
    type,
    panelState,
    item?.matchedCar?.slug,
    item?.vehicle?.matchedCarSlug,
    item?.vehicle?.matchedCarVariantKey,
  ]);

  // Fetch wheel/tire fitment options when panel is expanded
  // Uses fitmentService per SOURCE_OF_TRUTH.md - no direct Supabase in components
  useEffect(() => {
    const loadFitmentOptions = async () => {
      if (type !== 'mycars') return;
      if (panelState !== 'expanded' && panelState !== 'details') return;

      const carSlug = item?.matchedCar?.slug || item?.vehicle?.matchedCarSlug;
      if (!carSlug) return;

      try {
        const { fetchCarFitments } = await import('@/lib/fitmentService');
        const { data, error } = await fetchCarFitments(carSlug);

        if (error) {
          console.error('[HeroVehicleDisplay] Error loading fitment options:', error);
          return;
        }

        if (data) {
          // Transform service response to expected format
          // Service returns { oem, options } - combine and sort by fitment type priority
          const allOptions = [];
          if (data.oem) allOptions.push(data.oem);
          if (data.options) allOptions.push(...data.options);

          const sortOrder = {
            oem: 1,
            oem_optional: 2,
            plus_one: 3,
            plus_two: 4,
            square: 5,
            aggressive: 6,
            conservative: 7,
          };
          allOptions.sort(
            (a, b) => (sortOrder[a.fitmentType] || 99) - (sortOrder[b.fitmentType] || 99)
          );
          setFitmentOptions(allOptions);
        }
      } catch (err) {
        console.error('[HeroVehicleDisplay] Error loading fitment options:', err);
      }
    };

    loadFitmentOptions();
  }, [type, panelState, item?.matchedCar?.slug, item?.vehicle?.matchedCarSlug]);

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
        setSafetyData(
          json || { recalls: [], complaints: [], investigations: [], safetyRatings: null }
        );
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
          timeoutPromise,
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
        engine: decoded.engineDisplacement
          ? `${decoded.engineDisplacement}L ${decoded.engineCylinders ? `V${decoded.engineCylinders}` : ''}`
          : null,
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
          setSafetyData(
            json || { recalls: [], complaints: [], investigations: [], safetyRatings: null }
          );
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
      setServiceLogs((prev) => prev.map((log) => (log.id === editingLog.id ? data : log)));
      setEditingLog(null);
    } else {
      // Add new log
      const { data, error } = await addServiceLog(vehicleId, userId, logData);
      if (error) {
        console.error('[ServiceLog] Add error:', error);
        throw error;
      }
      // Prepend to local state (most recent first)
      setServiceLogs((prev) => [data, ...prev]);
    }
  };

  const _handleEditServiceLog = (log) => {
    setEditingLog(log);
    setShowServiceLogModal(true);
  };

  const _handleDeleteServiceLog = async (logId) => {
    if (!userId) return;

    setDeletingLogId(logId);
    try {
      const { error } = await deleteServiceLog(logId, userId);
      if (error) {
        console.error('[ServiceLog] Delete error:', error);
        return;
      }
      // Remove from local state
      setServiceLogs((prev) => prev.filter((log) => log.id !== logId));
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
  const baseCar = type === 'projects' ? item?.car : item?.matchedCar || item;
  const car = useMemo(() => {
    if (!baseCar) return null;
    if (enrichmentData?.image_url && baseCar?._hasNoMatchedCar) {
      return { ...baseCar, imageGarageUrl: enrichmentData.image_url };
    }
    return baseCar;
  }, [baseCar, enrichmentData?.image_url]);

  // Get the car slug for shared images (used by useCarImages hook)
  const carSlugForImages = car?.slug || item?.vehicle?.matchedCarSlug || null;

  // Get user's uploaded images for this car (shared between garage and tuning shop)
  // Hook must be called unconditionally per React rules
  const {
    images: carImages,
    heroImage: userHeroImage,
    heroImageUrl: userHeroImageUrl,
    setHeroImage: setCarHeroImage,
    clearHeroImage: clearCarHeroImage,
    refreshImages: refreshCarImages,
  } = useCarImages(carSlugForImages, { enabled: !!carSlugForImages });

  // Fetch full car data for driving character fields (engine feel, steering, sound)
  const { data: fullCarData } = useCarBySlug(carSlugForImages, {
    enabled: !!carSlugForImages,
  });

  // Check if car has driving character data
  const hasDrivingCharacter =
    fullCarData?.engineCharacter ||
    fullCarData?.transmissionFeel ||
    fullCarData?.steeringFeel ||
    fullCarData?.soundSignature;

  // Determine if user has a custom hero image
  // Also verify the hero URL is not a video URL (safety check - hook should filter this too)
  const hasCustomHero = !!userHeroImage && userHeroImageUrl && !isVideoUrl(userHeroImageUrl);

  // Fallback hero: use first uploaded image if no designated hero and no stock image
  // Only consider stock image available if car has explicit image URLs in database
  // Don't assume all matched cars have images - many may not have images uploaded yet
  // Filter out videos - check both media_type AND URL extension for safety
  const hasStockImage = !!(car?.imageGarageUrl || car?.imageHeroUrl);
  const firstImageMedia = carImages?.find((img) => {
    if (img.media_type === 'video') return false;
    const url = img.blob_url || img.blobUrl || img.url;
    if (isVideoUrl(url)) return false;
    return true;
  });
  const fallbackHeroUrl =
    !hasCustomHero && !hasStockImage && firstImageMedia ? firstImageMedia.url : null;

  const isOwnedVehicle = type === 'mycars';
  const isBuild = type === 'projects';

  // Calculate all modification gains from installed mods (for owned vehicles)
  // SOURCE OF TRUTH: lib/performanceCalculator - always calculate dynamically
  // Never use stored values (they can become stale and cause inconsistencies)
  // NOTE: This must be called before any early returns (React hooks rules)
  const modificationGains = useMemo(() => {
    if (!item || !(isOwnedVehicle && item.vehicle?.installedModifications?.length > 0)) {
      return {
        hpGain: 0,
        torqueGain: 0,
        zeroToSixtyImprovement: 0,
        brakingImprovement: 0,
        lateralGImprovement: 0,
      };
    }
    return calculateAllModificationGains(item.vehicle.installedModifications, car);
  }, [isOwnedVehicle, item, car]);

  if (!item) return null;

  // Get display name
  const displayName = isOwnedVehicle
    ? item.vehicle?.nickname || `${item.vehicle?.make} ${item.vehicle?.model}`
    : isBuild
      ? item.name || `${car?.name} Build`
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
      718: 'Porsche',
      911: 'Porsche',
      981: 'Porsche',
      991: 'Porsche',
      992: 'Porsche',
      997: 'Porsche',
      987: 'Porsche',
      Cayman: 'Porsche',
      BMW: 'BMW',
      M2: 'BMW',
      M3: 'BMW',
      M4: 'BMW',
      Audi: 'Audi',
      RS: 'Audi',
      S3: 'Audi',
      S4: 'Audi',
      Toyota: 'Toyota',
      Supra: 'Toyota',
      GR86: 'Toyota',
      Nissan: 'Nissan',
      'GT-R': 'Nissan',
      '370Z': 'Nissan',
      Z: 'Nissan',
      Subaru: 'Subaru',
      WRX: 'Subaru',
      BRZ: 'Subaru',
      STI: 'Subaru',
      Mazda: 'Mazda',
      'MX-5': 'Mazda',
      Miata: 'Mazda',
      'RX-7': 'Mazda',
      Honda: 'Honda',
      Civic: 'Honda',
      S2000: 'Honda',
      NSX: 'Honda',
      Chevrolet: 'Chevrolet',
      Corvette: 'Chevrolet',
      Camaro: 'Chevrolet',
      Ford: 'Ford',
      Mustang: 'Ford',
      Focus: 'Ford',
      GT: 'Ford',
      Dodge: 'Dodge',
      Challenger: 'Dodge',
      Charger: 'Dodge',
      Viper: 'Dodge',
      Mercedes: 'Mercedes',
      AMG: 'Mercedes',
    };

    for (const [key, brand] of Object.entries(brandMap)) {
      if (name.includes(key)) return brand;
    }
    return name.split(' ')[0];
  };

  const brand = getBrand();

  // Get model display name (strips brand prefix to avoid "Porsche Porsche Panamera")
  const getModelDisplayName = () => {
    // For user-owned vehicles, use their model field
    const modelSource = item?.vehicle?.model || car?.name || displayName;
    if (!modelSource) return displayName;

    // Get the brand to strip (from vehicle make, car brand, or derived)
    const brandToStrip = item?.vehicle?.make || car?.brand || brand;
    if (!brandToStrip) return modelSource;

    // Strip brand prefix if present (case-insensitive match)
    const brandLower = brandToStrip.toLowerCase();
    const modelLower = modelSource.toLowerCase();
    if (modelLower.startsWith(brandLower + ' ')) {
      return modelSource.slice(brandToStrip.length + 1);
    }

    return modelSource;
  };

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
  const _togglePanel = () => {
    if (panelState === 'collapsed') {
      setPanelState('expanded');
    } else if (panelState === 'expanded') {
      setPanelState('collapsed');
    } else {
      setPanelState('expanded');
    }
  };

  // Navigation handlers
  const canGoPrev = selectedIndex > 0;
  const canGoNext = selectedIndex < totalItems - 1;

  const handlePrev = () => {
    if (canGoPrev && onNavigate) {
      onNavigate(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext && onNavigate) {
      onNavigate(selectedIndex + 1);
    }
  };

  return (
    <div className={styles.heroDisplay}>
      {/* Vehicle Info Header - Vehicle name left, view toggle + add vehicle right */}
      {panelState === 'collapsed' && (
        <div className={styles.vehicleInfoHeader}>
          <div className={styles.vehicleInfoText}>
            <div className={styles.brandYearRow}>
              <span className={styles.brandName}>
                {item?.vehicle?.make || car?.brand || car?.make || 'VEHICLE'}
              </span>
              <span className={styles.vehicleYear}>
                {item?.vehicle?.year || car?.years?.split('-')[0] || car?.year}
              </span>
            </div>
            <h2 className={styles.heroVehicleName}>{getModelDisplayName()}</h2>
          </div>
          <div className={styles.vehicleHeaderActions}>
            {/* View Toggle - Gallery/List */}
            {viewMode && onViewModeChange && (
              <div className={styles.viewToggle}>
                <button
                  className={`${styles.viewToggleBtn} ${viewMode === 'presentation' ? styles.viewToggleBtnActive : ''}`}
                  onClick={() => onViewModeChange('presentation')}
                  title="Gallery view"
                  aria-label="Gallery view"
                >
                  <Icons.gallery size={16} />
                </button>
                <button
                  className={`${styles.viewToggleBtn} ${viewMode === 'list' ? styles.viewToggleBtnActive : ''}`}
                  onClick={() => onViewModeChange('list')}
                  title="List view"
                  aria-label="List view"
                >
                  <Icons.list size={16} />
                </button>
              </div>
            )}
            {/* Add Vehicle Button */}
            {onAddVehicle && (
              <button className={styles.addVehicleBtn} onClick={onAddVehicle}>
                <Icons.plus size={16} />
                Add Vehicle
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hero Image - 4:3 aspect ratio */}
      <div className={styles.heroImageWrapper}>
        <div className={styles.heroImageContainer}>
          {hasCustomHero && userHeroImageUrl ? (
            // User's designated hero image
            <Image
              src={userHeroImageUrl}
              alt={displayName || 'Vehicle'}
              fill
              className={styles.heroImage}
              priority
            />
          ) : fallbackHeroUrl ? (
            // First uploaded image as fallback for vehicles without stock images
            <Image
              src={fallbackHeroUrl}
              alt={displayName || 'Vehicle'}
              fill
              className={styles.heroImage}
              priority
            />
          ) : hasStockImage ? (
            // Stock car image from database (only render if car has actual image URLs)
            <CarImage car={car} variant="garage" className={styles.heroImage} lazy={false} />
          ) : (
            // Placeholder for vehicles with no images
            <div className={styles.heroPlaceholder}>
              <Icons.car size={80} />
              <span className={styles.heroPlaceholderText}>{displayName || 'Vehicle'}</span>
            </div>
          )}
        </div>

        {/* Centered Left/Right Navigation Arrows */}
        {totalItems > 1 && panelState !== 'details' && (
          <>
            <button
              className={`${styles.heroNavArrow} ${styles.heroNavArrowLeft} ${!canGoPrev ? styles.heroNavArrowDisabled : ''}`}
              onClick={handlePrev}
              disabled={!canGoPrev}
              aria-label="Previous vehicle"
            >
              <Icons.chevronLeft size={14} />
            </button>
            <button
              className={`${styles.heroNavArrow} ${styles.heroNavArrowRight} ${!canGoNext ? styles.heroNavArrowDisabled : ''}`}
              onClick={handleNext}
              disabled={!canGoNext}
              aria-label="Next vehicle"
            >
              <Icons.chevronRight size={14} />
            </button>
          </>
        )}

        {/* Vehicle Counter - Top right overlay on image */}
        {totalItems > 1 && panelState === 'collapsed' && (
          <div className={styles.heroImageCounter}>
            <span>{selectedIndex + 1}</span>
            <span className={styles.heroImageCounterDivider}>/</span>
            <span>{totalItems}</span>
          </div>
        )}

        {/* Driving Character Info Button - Top left overlay on image */}
        {hasDrivingCharacter && panelState === 'collapsed' && (
          <button
            className={styles.drivingCharacterBtn}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowDrivingCharacter(true);
            }}
            aria-label="View driving character"
            title="Driving Character"
          >
            <Icons.info size={16} />
          </button>
        )}
      </div>

      {/* Key Specs Strip - Quick stats between image and action buttons */}
      {/* Always show build stats (with mods applied) for owned vehicles */}
      {/* Show loading state when car data is still loading (uses _isCarDataLoading flag) */}
      {/* ENHANCED: Shows data source indicator when values are from user dyno data */}
      {panelState !== 'details' && (
        <div className={styles.keySpecsStrip}>
          <div className={styles.keySpecItem}>
            <span
              className={`${styles.keySpecValue} ${isOwnedVehicle && modificationGains.hpGain > 0 ? styles.keySpecValueModified : ''} ${item._isCarDataLoading ? styles.keySpecValueLoading : ''}`}
            >
              {item._isCarDataLoading
                ? '...'
                : car?.hp
                  ? isOwnedVehicle && modificationGains.hpGain > 0
                    ? car.hp + modificationGains.hpGain
                    : car.hp
                  : '—'}
              {/* Show indicator when HP is from user dyno data */}
              <DataSourceIndicator
                source={
                  isOwnedVehicle &&
                  (item.vehicle?.customSpecs?.dyno?.whp || item.vehicle?.customSpecs?.engine?.whp)
                    ? 'measured'
                    : null
                }
              />
            </span>
            <span className={styles.keySpecLabel}>HP</span>
          </div>
          <div className={styles.keySpecItem}>
            <span
              className={`${styles.keySpecValue} ${isOwnedVehicle && modificationGains.torqueGain > 0 ? styles.keySpecValueModified : ''} ${item._isCarDataLoading ? styles.keySpecValueLoading : ''}`}
            >
              {item._isCarDataLoading
                ? '...'
                : car?.torque
                  ? isOwnedVehicle && modificationGains.torqueGain > 0
                    ? car.torque + modificationGains.torqueGain
                    : car.torque
                  : '—'}
              <DataSourceIndicator
                source={
                  isOwnedVehicle &&
                  (item.vehicle?.customSpecs?.dyno?.wtq || item.vehicle?.customSpecs?.engine?.wtq)
                    ? 'measured'
                    : null
                }
              />
            </span>
            <span className={styles.keySpecLabel}>LB-FT</span>
          </div>
          <div className={styles.keySpecItem}>
            <span
              className={`${styles.keySpecValue} ${isOwnedVehicle && modificationGains.zeroToSixtyImprovement > 0 ? styles.keySpecValueModified : ''} ${item._isCarDataLoading ? styles.keySpecValueLoading : ''}`}
            >
              {item._isCarDataLoading
                ? '...'
                : car?.zeroToSixty
                  ? (isOwnedVehicle && modificationGains.zeroToSixtyImprovement > 0
                      ? (car.zeroToSixty - modificationGains.zeroToSixtyImprovement).toFixed(1)
                      : car.zeroToSixty) + 's'
                  : '—'}
            </span>
            <span className={styles.keySpecLabel}>0-60</span>
          </div>
          <div className={styles.keySpecItem}>
            <span
              className={`${styles.keySpecValue} ${item._isCarDataLoading ? styles.keySpecValueLoading : ''}`}
            >
              {item._isCarDataLoading ? '...' : car?.topSpeed || '—'}
            </span>
            <span className={styles.keySpecLabel}>MPH</span>
          </div>
        </div>
      )}

      {/* Bottom Action Bar - Specs, Build, Parts, Install, Photos (when not in details view) */}
      {panelState !== 'details' && (
        <div className={styles.heroBottomBar}>
          {/* Specs - links to dedicated page */}
          <Link
            href={
              item.vehicle?.activeBuildId
                ? `/garage/my-specs?build=${item.vehicle.activeBuildId}`
                : `/garage/my-specs?car=${car.slug}`
            }
            className={styles.heroBottomBtn}
          >
            <Icons.gauge size={18} />
            <span>Specs</span>
          </Link>
          {isOwnedVehicle && car?.slug && (
            <>
              <Link
                href={
                  item.vehicle?.activeBuildId
                    ? `/garage/my-build?build=${item.vehicle.activeBuildId}`
                    : `/garage/my-build?car=${car.slug}`
                }
                className={styles.heroBottomBtn}
              >
                <Icons.wrench size={18} />
                <span>Build</span>
              </Link>
              <Link
                href={
                  item.vehicle?.activeBuildId
                    ? `/garage/my-parts?build=${item.vehicle.activeBuildId}`
                    : `/garage/my-parts?car=${car.slug}`
                }
                className={styles.heroBottomBtn}
              >
                <Icons.package size={18} />
                <span>Parts</span>
              </Link>
              {/* Install - links to dedicated page */}
              <Link
                href={
                  item.vehicle?.activeBuildId
                    ? `/garage/my-install?build=${item.vehicle.activeBuildId}`
                    : `/garage/my-install?car=${car.slug}`
                }
                className={styles.heroBottomBtn}
              >
                <Icons.tool size={18} />
                <span>Install</span>
              </Link>
              {/* Photos - links to dedicated page */}
              <Link
                href={
                  item.vehicle?.activeBuildId
                    ? `/garage/my-photos?build=${item.vehicle.activeBuildId}`
                    : `/garage/my-photos?car=${car.slug}`
                }
                className={styles.heroBottomBtn}
              >
                <Icons.camera size={18} />
                <span>Photos</span>
              </Link>
            </>
          )}
        </div>
      )}

      {/* Vehicle Tab Bar removed - was causing extra menu clutter */}

      {/* Spec Panel - Left Side with consistent transparency */}
      <div
        className={`${styles.specPanel} ${styles[`specPanel_${panelState}`]}`}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Header - Always visible */}
        {/* Close button - Fixed position top right of panel */}
        {panelState !== 'collapsed' && (
          <button
            className={styles.panelCloseBtn}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setPanelState('collapsed');
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
            }}
            title="Close"
            aria-label="Close panel"
          >
            <Icons.x size={20} />
          </button>
        )}

        {/* Spec Panel Header - Only show when expanded or in details view */}
        {panelState !== 'collapsed' && (
          <div className={styles.specPanelHeader}>
            <div className={styles.specPanelHeaderInfo}>
              {/* Match main page format: MAKE YEAR / Model */}
              <div className={styles.brandYearRow}>
                <span className={styles.brandName}>
                  {item?.vehicle?.make || car?.brand || car?.make || brand}
                </span>
                <span className={styles.vehicleYear}>{getSubInfo()}</span>
              </div>
              <div className={styles.heroVehicleNameRow}>
                <h2 className={styles.heroVehicleName}>{getModelDisplayName()}</h2>
                {/* Modified badge for owned vehicles with modifications */}
                {isOwnedVehicle && item.vehicle?.isModified && (
                  <span className={styles.modifiedBadge}>
                    <Icons.wrench size={12} />
                    MODIFIED
                    {modificationGains.hpGain > 0 && (
                      <span className={styles.modifiedHpGain}>+{modificationGains.hpGain} HP</span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

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
                      : `${car.hp} HP`}
                    {isOwnedVehicle && modificationGains.hpGain > 0 && (
                      <span className={styles.modifiedIndicator}>
                        {' '}
                        (+{modificationGains.hpGain})
                      </span>
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
                      : `${car.zeroToSixty}s`}
                    {isOwnedVehicle && modificationGains.zeroToSixtyImprovement > 0 && (
                      <span className={styles.modifiedIndicator}>
                        {' '}
                        (-{modificationGains.zeroToSixtyImprovement}s)
                      </span>
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
                      : `${car.torque} lb-ft`}
                    {isOwnedVehicle && modificationGains.torqueGain > 0 && (
                      <span className={styles.modifiedIndicator}>
                        {' '}
                        (+{modificationGains.torqueGain})
                      </span>
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

            {/* Daily Driver Enrichment Prompt */}
            {isOwnedVehicle && car?._hasNoMatchedCar && enrichmentStatus !== 'enriched' && (
              <div className={styles.enrichmentPrompt}>
                {enrichmentStatus === 'none' || enrichmentStatus === 'available' ? (
                  <>
                    <div className={styles.enrichmentPromptText}>
                      <Icons.sparkles size={16} />
                      <span>Unlock maintenance specs, service intervals, and more</span>
                    </div>
                    <button className={styles.enrichmentButton} onClick={handleEnrichVehicle}>
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
                    <button className={styles.enrichmentButton} onClick={handleEnrichVehicle}>
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
              {car && <CarActionMenu car={car} variant="compact" theme="dark" hideActions={[]} />}
            </div>
          </div>
        )}

        {/* Full Details - Specs view with owner-specific data for My Collection vehicles */}
        {panelState === 'details' && car && (
          <div className={styles.specPanelBody}>
            {/* Vehicle Details View - Specifications and performance data */}
            {(!isOwnedVehicle || detailsView === 'specs') && (
              <>
                {/* Summary/Tagline at top */}
                {car.tagline && <p className={styles.detailsSummary}>{car.tagline}</p>}

                {/* Performance Score Gauge - GRAVL-style visual summary */}
                {(car.hp || car.zeroToSixty || car.track) && (
                  <PerformanceScoreGauge
                    score={(() => {
                      // Calculate a composite score from available metrics
                      let score = 50; // base
                      if (car.hp) score += Math.min((car.hp / 800) * 25, 25);
                      if (car.track) score += (car.track / 10) * 15;
                      if (car.zeroToSixty && car.zeroToSixty < 6)
                        score += (6 - car.zeroToSixty) * 5;
                      return Math.min(Math.round(score), 100);
                    })()}
                    label="Performance"
                    stats={[
                      car.hp && { value: car.hp, unit: 'HP', label: 'Power' },
                      car.zeroToSixty && { value: car.zeroToSixty, unit: 's', label: '0-60' },
                      car.track && { value: car.track, unit: '/10', label: 'Track' },
                    ]
                      .filter(Boolean)
                      .slice(0, 3)}
                  />
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
                    </h4>
                    <div className={styles.detailBlockItems}>
                      {car.hp && (
                        <div className={styles.detailBlockItem}>
                          <span>Horsepower</span>
                          <span
                            className={
                              isOwnedVehicle && modificationGains.hpGain > 0
                                ? styles.modifiedValue
                                : ''
                            }
                          >
                            {isOwnedVehicle && modificationGains.hpGain > 0
                              ? `${car.hp + modificationGains.hpGain} HP`
                              : `${car.hp} HP`}
                            {isOwnedVehicle && modificationGains.hpGain > 0 && (
                              <span className={styles.modifiedIndicator}>
                                {' '}
                                (+{modificationGains.hpGain})
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      {car.torque && (
                        <div className={styles.detailBlockItem}>
                          <span>Torque</span>
                          <span
                            className={
                              isOwnedVehicle && modificationGains.torqueGain > 0
                                ? styles.modifiedValue
                                : ''
                            }
                          >
                            {isOwnedVehicle && modificationGains.torqueGain > 0
                              ? `${car.torque + modificationGains.torqueGain} lb-ft`
                              : `${car.torque} lb-ft`}
                            {isOwnedVehicle && modificationGains.torqueGain > 0 && (
                              <span className={styles.modifiedIndicator}>
                                {' '}
                                (+{modificationGains.torqueGain})
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      {car.zeroToSixty && (
                        <div className={styles.detailBlockItem}>
                          <span>0-60 mph</span>
                          <span
                            className={
                              isOwnedVehicle && modificationGains.zeroToSixtyImprovement > 0
                                ? styles.modifiedValue
                                : ''
                            }
                          >
                            {isOwnedVehicle && modificationGains.zeroToSixtyImprovement > 0
                              ? `${(car.zeroToSixty - modificationGains.zeroToSixtyImprovement).toFixed(1)}s`
                              : `${car.zeroToSixty}s`}
                            {isOwnedVehicle && modificationGains.zeroToSixtyImprovement > 0 && (
                              <span className={styles.modifiedIndicator}>
                                {' '}
                                (-{modificationGains.zeroToSixtyImprovement}s)
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      {car.quarterMile && (
                        <div className={styles.detailBlockItem}>
                          <span>1/4 Mile</span>
                          <span>{car.quarterMile}s</span>
                        </div>
                      )}
                      {car.braking60To0 && (
                        <div className={styles.detailBlockItem}>
                          <span>60-0 Braking</span>
                          <span
                            className={
                              isOwnedVehicle && modificationGains.brakingImprovement > 0
                                ? styles.modifiedValue
                                : ''
                            }
                          >
                            {isOwnedVehicle && modificationGains.brakingImprovement > 0
                              ? `${car.braking60To0 - modificationGains.brakingImprovement} ft`
                              : `${car.braking60To0} ft`}
                            {isOwnedVehicle && modificationGains.brakingImprovement > 0 && (
                              <span className={styles.modifiedIndicator}>
                                {' '}
                                (-{modificationGains.brakingImprovement} ft)
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      {car.lateralG && (
                        <div className={styles.detailBlockItem}>
                          <span>Lateral G</span>
                          <span
                            className={
                              isOwnedVehicle && modificationGains.lateralGImprovement > 0
                                ? styles.modifiedValue
                                : ''
                            }
                          >
                            {isOwnedVehicle && modificationGains.lateralGImprovement > 0
                              ? `${(car.lateralG + modificationGains.lateralGImprovement).toFixed(2)}g`
                              : `${car.lateralG}g`}
                            {isOwnedVehicle && modificationGains.lateralGImprovement > 0 && (
                              <span className={styles.modifiedIndicator}>
                                {' '}
                                (+{modificationGains.lateralGImprovement}g)
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      {car.topSpeed && (
                        <div className={styles.detailBlockItem}>
                          <span>Top Speed</span>
                          <span>{car.topSpeed} mph</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Engine & Drivetrain */}
                  <div className={styles.detailBlock}>
                    <h4 className={styles.detailBlockTitle}>
                      <span>Engine & Drivetrain</span>
                    </h4>
                    <div className={styles.detailBlockItems}>
                      {car.engine && (
                        <div className={styles.detailBlockItem}>
                          <span>Engine</span>
                          <span>{car.engine}</span>
                        </div>
                      )}
                      {car.trans && (
                        <div className={styles.detailBlockItem}>
                          <span>Transmission</span>
                          <span>{car.trans}</span>
                        </div>
                      )}
                      {car.drivetrain && (
                        <div className={styles.detailBlockItem}>
                          <span>Drivetrain</span>
                          <span>{car.drivetrain}</span>
                        </div>
                      )}
                      {car.category && (
                        <div className={styles.detailBlockItem}>
                          <span>Layout</span>
                          <span>{car.category}</span>
                        </div>
                      )}
                      {car.manualAvailable !== undefined && (
                        <div className={styles.detailBlockItem}>
                          <span>Manual</span>
                          <span>{car.manualAvailable ? 'Yes' : 'No'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chassis & Body */}
                  <div className={styles.detailBlock}>
                    <h4 className={styles.detailBlockTitle}>
                      <span>Chassis & Body</span>
                    </h4>
                    <div className={styles.detailBlockItems}>
                      {car.curbWeight && (
                        <div className={styles.detailBlockItem}>
                          <span>Curb Weight</span>
                          <span>{car.curbWeight.toLocaleString()} lbs</span>
                        </div>
                      )}
                      {car.seats && (
                        <div className={styles.detailBlockItem}>
                          <span>Seats</span>
                          <span>{car.seats}</span>
                        </div>
                      )}
                      {car.country && (
                        <div className={styles.detailBlockItem}>
                          <span>Origin</span>
                          <span>{car.country}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ownership */}
                  <div className={styles.detailBlock}>
                    <h4 className={styles.detailBlockTitle}>
                      <span>Ownership</span>
                    </h4>
                    <div className={styles.detailBlockItems}>
                      {car.priceRange && (
                        <div className={styles.detailBlockItem}>
                          <span>Price Range</span>
                          <span>{car.priceRange}</span>
                        </div>
                      )}
                      {car.years && (
                        <div className={styles.detailBlockItem}>
                          <span>Model Years</span>
                          <span>{car.years}</span>
                        </div>
                      )}
                      {car.dailyUsabilityTag && (
                        <div className={styles.detailBlockItem}>
                          <span>Daily Use</span>
                          <span>{car.dailyUsabilityTag}</span>
                        </div>
                      )}
                      {car.fuelEconomyCombined && (
                        <div className={styles.detailBlockItem}>
                          <span>MPG Combined</span>
                          <span>{car.fuelEconomyCombined}</span>
                        </div>
                      )}
                      {car.maintenanceCostIndex && (
                        <div className={styles.detailBlockItem}>
                          <span>Maintenance</span>
                          <span>
                            {car.maintenanceCostIndex <= 3
                              ? 'Low'
                              : car.maintenanceCostIndex <= 6
                                ? 'Medium'
                                : 'High'}
                          </span>
                        </div>
                      )}
                      {car.insuranceCostIndex && (
                        <div className={styles.detailBlockItem}>
                          <span>Insurance</span>
                          <span>
                            {car.insuranceCostIndex <= 3
                              ? 'Low'
                              : car.insuranceCostIndex <= 6
                                ? 'Medium'
                                : 'High'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ownership Extras - if available */}
                  {(car.partsAvailability ||
                    car.dealerVsIndependent ||
                    car.diyFriendliness ||
                    car.trackReadiness ||
                    car.communityStrength) && (
                    <div className={styles.detailBlock}>
                      <h4 className={styles.detailBlockTitle}>
                        <span>Ownership Extras</span>
                      </h4>
                      <div className={styles.detailBlockItems}>
                        {car.partsAvailability && (
                          <div className={styles.detailBlockItem}>
                            <span>Parts</span>
                            <span className={styles.textCapitalize}>{car.partsAvailability}</span>
                          </div>
                        )}
                        {car.dealerVsIndependent && (
                          <div className={styles.detailBlockItem}>
                            <span>Service</span>
                            <span className={styles.textCapitalize}>
                              {car.dealerVsIndependent.replace(/-/g, ' ')}
                            </span>
                          </div>
                        )}
                        <RatingBar value={car.diyFriendliness} label="DIY Friendly" />
                        {car.trackReadiness && (
                          <div className={styles.detailBlockItem}>
                            <span>Track Ready</span>
                            <span className={styles.textCapitalize}>
                              {car.trackReadiness.replace(/-/g, ' ')}
                            </span>
                          </div>
                        )}
                        <RatingBar value={car.communityStrength} label="Community" />
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
                            <li key={i} className={styles.proItem}>
                              ✓ {pro}
                            </li>
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
                            <li key={i} className={styles.conItem}>
                              ✗ {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Owner-Specific Specs - Only for My Collection (Enthusiast+ tier) */}
                {isOwnedVehicle && (
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
                            <span
                              className={
                                vinData.modelYear !== item?.vehicle?.year
                                  ? styles.vinDataChanged
                                  : ''
                              }
                            >
                              {vinData.modelYear}
                              {vinData.modelYear !== item?.vehicle?.year && (
                                <span className={styles.vinDataOld}>
                                  {' '}
                                  (was {item?.vehicle?.year})
                                </span>
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
                    {vinError && <div className={styles.vinErrorMsg}>{vinError}</div>}

                    {/* Owner Specs Grid */}
                    <div className={styles.fullDetailsInPanel}>
                      {/* Engine Oil */}
                      <div className={styles.detailBlock}>
                        <h4 className={styles.detailBlockTitle}>
                          <span>Engine Oil</span>
                        </h4>
                        <div className={styles.detailBlockItems}>
                          <div className={styles.detailBlockItem}>
                            <span>Viscosity</span>
                            <span>{maintenanceData.specs?.oil_viscosity || '5W-30 or 5W-40'}</span>
                          </div>
                          <div className={styles.detailBlockItem}>
                            <span>Capacity</span>
                            <span>
                              {maintenanceData.specs?.oil_capacity_quarts
                                ? `${maintenanceData.specs.oil_capacity_quarts} qt`
                                : '~8-10 qt'}
                            </span>
                          </div>
                          <div className={styles.detailBlockItem}>
                            <span>Change Interval</span>
                            <span>
                              {maintenanceData.specs?.oil_change_interval_miles
                                ? `${maintenanceData.specs.oil_change_interval_miles.toLocaleString()} mi`
                                : '5,000-7,500 mi'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Fuel */}
                      <div className={styles.detailBlock}>
                        <h4 className={styles.detailBlockTitle}>
                          <span>Fuel</span>
                        </h4>
                        <div className={styles.detailBlockItems}>
                          <div className={styles.detailBlockItem}>
                            <span>Fuel Type</span>
                            <span>{maintenanceData.specs?.fuel_type || 'Premium Unleaded'}</span>
                          </div>
                          <div className={styles.detailBlockItem}>
                            <span>Min Octane</span>
                            <span>{maintenanceData.specs?.fuel_octane_minimum || '91'}</span>
                          </div>
                          <div className={styles.detailBlockItem}>
                            <span>Recommended</span>
                            <span>
                              {maintenanceData.specs?.fuel_octane_recommended
                                ? `${maintenanceData.specs.fuel_octane_recommended} octane`
                                : '93 octane'}
                            </span>
                          </div>
                          <div className={styles.detailBlockItem}>
                            <span>Tank Capacity</span>
                            <span>
                              {maintenanceData.specs?.fuel_tank_capacity_gallons
                                ? `${maintenanceData.specs.fuel_tank_capacity_gallons} gal`
                                : '~16 gal'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tires & Wheels - Inline Editable Card */}
                      <WheelTireSpecsCard
                        stockSpecs={maintenanceData.specs}
                        customSpecs={item.vehicle?.customSpecs}
                        onUpdateCustomSpecs={
                          onUpdateCustomSpecs
                            ? async (specs) => {
                                if (item.vehicle?.id) {
                                  await onUpdateCustomSpecs(item.vehicle.id, specs);
                                }
                              }
                            : undefined
                        }
                        fitmentOptions={fitmentOptions}
                        showFitmentToggle={true}
                        carName={car?.name}
                      />

                      {/* Fluids */}
                      <div className={styles.detailBlock}>
                        <h4 className={styles.detailBlockTitle}>
                          <span>Fluids</span>
                        </h4>
                        <div className={styles.detailBlockItems}>
                          <div className={styles.detailBlockItem}>
                            <span>Coolant</span>
                            <span>{maintenanceData.specs?.coolant_type || 'OEM Coolant'}</span>
                          </div>
                          <div className={styles.detailBlockItem}>
                            <span>Brake Fluid</span>
                            <span>{maintenanceData.specs?.brake_fluid_type || 'DOT 4'}</span>
                          </div>
                          <div className={styles.detailBlockItem}>
                            <span>Trans Fluid</span>
                            <span>
                              {maintenanceData.specs?.trans_fluid_auto ||
                                maintenanceData.specs?.trans_fluid_manual ||
                                'Check manual'}
                            </span>
                          </div>
                          <div className={styles.detailBlockItem}>
                            <span>Diff Fluid</span>
                            <span>{maintenanceData.specs?.diff_fluid_type || 'Check manual'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Brakes */}
                      <div className={styles.detailBlock}>
                        <h4 className={styles.detailBlockTitle}>
                          <span>Brakes</span>
                        </h4>
                        <div className={styles.detailBlockItems}>
                          <div className={styles.detailBlockItem}>
                            <span>Front Caliper</span>
                            <span>{maintenanceData.specs?.brake_front_caliper_type || '—'}</span>
                          </div>
                          <div className={styles.detailBlockItem}>
                            <span>Rear Caliper</span>
                            <span>{maintenanceData.specs?.brake_rear_caliper_type || '—'}</span>
                          </div>
                          <div className={styles.detailBlockItem}>
                            <span>Pad Compound</span>
                            <span>{maintenanceData.specs?.brake_pad_compound || 'OEM'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Battery */}
                      <div className={styles.detailBlock}>
                        <h4 className={styles.detailBlockTitle}>
                          <span>Battery</span>
                        </h4>
                        <div className={styles.detailBlockItems}>
                          <div className={styles.detailBlockItem}>
                            <span>Group Size</span>
                            <span>{maintenanceData.specs?.battery_group_size || 'H6/48'}</span>
                          </div>
                          <div className={styles.detailBlockItem}>
                            <span>CCA</span>
                            <span>{maintenanceData.specs?.battery_cca || '750+'}</span>
                          </div>
                          <div className={styles.detailBlockItem}>
                            <span>Type</span>
                            <span>
                              {maintenanceData.specs?.battery_agm ? 'AGM' : 'AGM Recommended'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Wipers & Lights */}
                      <div className={styles.detailBlock}>
                        <h4 className={styles.detailBlockTitle}>
                          <span>Wipers & Lights</span>
                        </h4>
                        <div className={styles.detailBlockItems}>
                          <div className={styles.detailBlockItem}>
                            <span>Driver Wiper</span>
                            <span>
                              {maintenanceData.specs?.wiper_driver_size_inches
                                ? `${maintenanceData.specs.wiper_driver_size_inches}"`
                                : '22"'}
                            </span>
                          </div>
                          <div className={styles.detailBlockItem}>
                            <span>Passenger Wiper</span>
                            <span>
                              {maintenanceData.specs?.wiper_passenger_size_inches
                                ? `${maintenanceData.specs.wiper_passenger_size_inches}"`
                                : '20"'}
                            </span>
                          </div>
                          <div className={styles.detailBlockItem}>
                            <span>Low Beam</span>
                            <span>{maintenanceData.specs?.headlight_low_beam_type || 'LED'}</span>
                          </div>
                          <div className={styles.detailBlockItem}>
                            <span>High Beam</span>
                            <span>{maintenanceData.specs?.headlight_high_beam_type || 'LED'}</span>
                          </div>
                        </div>
                      </div>

                      {/* VIN Decoded Info - if available */}
                      {vinData && (
                        <div className={styles.detailBlock}>
                          <h4 className={styles.detailBlockTitle}>
                            <span>VIN Details</span>
                          </h4>
                          <div className={styles.detailBlockItems}>
                            <div className={styles.detailBlockItem}>
                              <span>VIN</span>
                              <span className={styles.vinValueSmall}>{vinData.vin}</span>
                            </div>
                            <div className={styles.detailBlockItem}>
                              <span>Plant</span>
                              <span>
                                {vinData.plantCity}, {vinData.plantCountry}
                              </span>
                            </div>
                            <div className={styles.detailBlockItem}>
                              <span>Body Style</span>
                              <span>{vinData.bodyStyle}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Recalls Section - if VIN decoded and has recalls */}
                    {vinData?.recalls && vinData.recalls.length > 0 && (
                      <div className={styles.prosConsRow}>
                        <div className={`${styles.prosConsBlock} ${styles.flexOne}`}>
                          <h4 className={styles.detailBlockTitle}>Recalls & Campaigns</h4>
                          <ul className={styles.proConList}>
                            {vinData.recalls.map((recall, i) => (
                              <li key={i} className={styles.conItem}>
                                <span
                                  className={
                                    recall.status === 'Completed'
                                      ? styles.colorSuccess
                                      : styles.colorError
                                  }
                                >
                                  {recall.status === 'Completed' ? '✓' : '!'}
                                </span>{' '}
                                {recall.description} ({recall.status})
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
              </>
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
                        <span
                          className={`${styles.safetyStatValue} ${safetyData.recalls.length > 0 ? styles.colorError : styles.colorSuccess}`}
                        >
                          {safetyData.recalls.length}
                        </span>
                        <span className={styles.safetyStatLabel}>Recalls</span>
                      </div>
                      <div className={styles.safetyStatCard}>
                        <span className={styles.safetyStatValue}>
                          {safetyData.complaints.length}
                        </span>
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
                                <span className={styles.recallCampaign}>
                                  {recall.campaignNumber}
                                </span>
                                <span className={styles.recallDate}>
                                  {recall.reportReceivedDate}
                                </span>
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
                                <span className={styles.complaintComponent}>
                                  {complaint.component}
                                </span>
                                {(complaint.crash || complaint.fire) && (
                                  <span className={styles.complaintWarning}>
                                    {complaint.crash && (
                                      <>
                                        <Icons.alert size={12} /> Crash
                                      </>
                                    )}
                                    {complaint.crash && complaint.fire && ' '}
                                    {complaint.fire && (
                                      <>
                                        <Icons.fire size={12} /> Fire
                                      </>
                                    )}
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
                            <span className={styles.ratingStars}>
                              {safetyData.safetyRatings.overallRating}
                              <Icons.star size={12} />
                            </span>
                          </div>
                          {safetyData.safetyRatings.overallFrontCrashRating && (
                            <div className={styles.ratingItem}>
                              <span className={styles.ratingLabel}>Front Crash</span>
                              <span className={styles.ratingStars}>
                                {safetyData.safetyRatings.overallFrontCrashRating}
                                <Icons.star size={12} />
                              </span>
                            </div>
                          )}
                          {safetyData.safetyRatings.overallSideCrashRating && (
                            <div className={styles.ratingItem}>
                              <span className={styles.ratingLabel}>Side Crash</span>
                              <span className={styles.ratingStars}>
                                {safetyData.safetyRatings.overallSideCrashRating}
                                <Icons.star size={12} />
                              </span>
                            </div>
                          )}
                          {safetyData.safetyRatings.rolloverRating && (
                            <div className={styles.ratingItem}>
                              <span className={styles.ratingLabel}>Rollover</span>
                              <span className={styles.ratingStars}>
                                {safetyData.safetyRatings.rolloverRating}
                                <Icons.star size={12} />
                              </span>
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

            {/* Modifications View - Build Editor with Basic/Advanced modes */}
            {isOwnedVehicle && detailsView === 'mods' && (
              <div className={styles.modsView}>
                <VehicleBuildPanel
                  vehicleId={item.vehicle?.id}
                  carSlug={item.vehicle?.matchedCarSlug}
                  stockHp={item.car?.hp || 0}
                  stockTorque={item.car?.torque || 0}
                  installedMods={item.vehicle?.installedModifications || []}
                  customSpecs={item.vehicle?.customSpecs || {}}
                  onUpdateBuild={(updatedVehicle) => {
                    if (onUpdateVehicle) {
                      onUpdateVehicle(item.vehicle.id, {
                        installedModifications: updatedVehicle.installed_modifications,
                        customSpecs: updatedVehicle.custom_specs,
                        totalHpGain: updatedVehicle.total_hp_gain,
                      });
                    }
                  }}
                />
              </div>
            )}

            {/* Photos View - Upload and manage vehicle photos */}
            {isOwnedVehicle && detailsView === 'photos' && carSlugForImages && (
              <div className={styles.photosView}>
                <div className={styles.photosHeader}>
                  <h3>Your Photos</h3>
                  <p className={styles.photosHint}>
                    Add photos of your build. Select a hero image to display across your garage.
                  </p>
                </div>

                {/* Upload Component */}
                <ImageUploader
                  onUploadComplete={(_media) => {
                    // Refresh images to include the new upload
                    refreshCarImages();
                  }}
                  onUploadError={(err) => console.error('[Garage] Photo upload error:', err)}
                  maxFiles={10}
                  vehicleId={item.vehicle.id}
                  carSlug={carSlugForImages}
                  existingImages={carImages}
                  showPreviews={false}
                />

                {/* Gallery with Hero Selection */}
                {(carImages.length > 0 || car) && (
                  <BuildMediaGallery
                    car={car}
                    media={carImages}
                    hideStockImage={item.vehicle?.hideStockImage}
                    onSetPrimary={async (imageId) => {
                      await setCarHeroImage(imageId);
                    }}
                    onSetStockHero={async () => {
                      await clearCarHeroImage();
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Badges */}
      {isOwnedVehicle && item.vehicle?.isPrimary && (
        <span className={styles.heroBadge}>Primary Vehicle</span>
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

      {/* Driving Character Modal */}
      {showDrivingCharacter && hasDrivingCharacter && (
        <DrivingCharacterModal
          isOpen={showDrivingCharacter}
          onClose={() => setShowDrivingCharacter(false)}
          carName={displayName}
          engineCharacter={fullCarData?.engineCharacter}
          transmissionFeel={fullCarData?.transmissionFeel}
          steeringFeel={fullCarData?.steeringFeel}
          soundSignature={fullCarData?.soundSignature}
        />
      )}
    </div>
  );
}

// Build Hero Display - Shows build project with user's hero image if available
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Reserved for future use
function BuildHeroDisplay({
  build,
  onOpenTuningShop,
  onViewDetails,
  selectedIndex,
  totalItems,
  onNavigate: _onNavigate,
}) {
  const carSlug = build?.car?.slug;

  // Get user's uploaded images for this car (shared between garage and tuning shop)
  const { heroImage: userHeroImage, heroImageUrl: userHeroImageUrl } = useCarImages(carSlug, {
    enabled: !!carSlug,
  });

  // Determine if user has a custom hero image
  const hasCustomHero = !!userHeroImage && !!userHeroImageUrl;

  return (
    <div className={styles.buildHeroDisplay}>
      <div className={styles.buildHeroContent}>
        <div className={styles.buildHeroInfo}>
          <span className={styles.buildBadge}>BUILD PROJECT</span>
          <h2 className={styles.buildHeroName}>{build?.name || 'Untitled Build'}</h2>
          <p className={styles.buildHeroCar}>{build?.car?.name || 'Unknown Car'}</p>
          {build?.notes && <p className={styles.buildHeroNotes}>{build.notes}</p>}
        </div>
        <div className={styles.buildHeroImage}>
          {hasCustomHero ? (
            <Image
              src={userHeroImageUrl}
              alt={build?.name || 'Build'}
              fill
              className={styles.heroImage}
              priority
            />
          ) : (
            <CarImage car={build?.car} variant="garage" priority />
          )}
        </div>
        <div className={styles.buildHeroActions}>
          <button className={styles.buildHeroAction} onClick={() => onOpenTuningShop(build)}>
            <Icons.wrench size={18} />
            <span>Open in Tuning Shop</span>
          </button>
          <button className={styles.buildHeroActionSecondary} onClick={() => onViewDetails(build)}>
            <Icons.info size={18} />
            <span>View Details</span>
          </button>
        </div>
      </div>

      {/* Navigation counter */}
      {totalItems > 1 && (
        <div className={styles.buildNavCounter}>
          <span>{selectedIndex + 1}</span>
          <span className={styles.buildNavCounterSeparator}>/</span>
          <span>{totalItems}</span>
        </div>
      )}
    </div>
  );
}

// Performance Overlay Component - Shows Performance Hub preview within garage
function PerformanceOverlay({ car, onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose} data-overlay-modal>
      <div className={styles.overlayContentWide} onClick={(e) => e.stopPropagation()}>
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
          <Link href={`/garage/my-build?car=${car.slug}`} className={styles.overlayLinkPrimary}>
            <Icons.wrench size={16} />
            Configure Build
          </Link>
        </div>
      </div>
    </div>
  );
}

// Confirmation Modal Component
function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Remove',
  confirmType = 'danger',
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.confirmOverlay} onClick={onClose}>
      <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.confirmIcon}>
          <Icons.alert size={32} />
        </div>
        <h3 className={styles.confirmTitle}>{title}</h3>
        <p className={styles.confirmMessage}>{message}</p>
        <div className={styles.confirmActions}>
          <button onClick={onClose} className={styles.confirmCancelBtn}>
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

// Driving Character Modal - Shows engine feel, transmission, steering, sound
// Uses createPortal to render at document.body level for proper z-index stacking
function DrivingCharacterModal({
  isOpen,
  onClose,
  carName: _carName,
  engineCharacter,
  transmissionFeel,
  steeringFeel,
  soundSignature,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  // Handle close with event stopping to prevent bubbling
  const handleClose = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onClose();
  };

  const modalContent = (
    <div
      className={styles.drivingCharacterOverlay}
      onClick={handleClose}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div
        className={styles.drivingCharacterModal}
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <div className={styles.drivingCharacterModalHeader}>
          <div className={styles.drivingCharacterModalTitle}>
            <Icons.car size={20} />
            <span>Driving Character</span>
          </div>
          <button
            className={styles.drivingCharacterCloseBtn}
            onClick={handleClose}
            onTouchEnd={(e) => e.stopPropagation()}
            aria-label="Close"
          >
            <Icons.x size={20} />
          </button>
        </div>

        <div className={styles.drivingCharacterModalBody}>
          {engineCharacter && (
            <div className={styles.drivingCharacterModalItem}>
              <span className={styles.drivingCharacterModalLabel}>Engine Feel</span>
              <p className={styles.drivingCharacterModalText}>{engineCharacter}</p>
            </div>
          )}
          {transmissionFeel && (
            <div className={styles.drivingCharacterModalItem}>
              <span className={styles.drivingCharacterModalLabel}>Transmission</span>
              <p className={styles.drivingCharacterModalText}>{transmissionFeel}</p>
            </div>
          )}
          {steeringFeel && (
            <div className={styles.drivingCharacterModalItem}>
              <span className={styles.drivingCharacterModalLabel}>Steering</span>
              <p className={styles.drivingCharacterModalText}>{steeringFeel}</p>
            </div>
          )}
          {soundSignature && (
            <div className={styles.drivingCharacterModalItem}>
              <span className={styles.drivingCharacterModalLabel}>Sound</span>
              <p className={styles.drivingCharacterModalText}>{soundSignature}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// Thumbnail Strip Component
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Reserved for future use
function ThumbnailStrip({
  items,
  selectedIndex,
  onSelect,
  type,
  onRemoveItem,
  isEditMode,
  onMoveItem,
  isReordering,
}) {
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

      <div
        className={`${styles.thumbnailStrip} ${isEditMode ? styles.thumbnailStripEditMode : ''}`}
        ref={stripRef}
      >
        {items.map((item, index) => {
          const car = type === 'projects' ? item.car : item.matchedCar || item;
          const isSelected = index === selectedIndex;

          // Get display name for tooltip
          const displayName =
            type === 'mycars'
              ? item.vehicle?.nickname || `${item.vehicle?.make} ${item.vehicle?.model}`
              : type === 'projects'
                ? item.name || car?.name
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

// Vehicle List View Component - Uses dynamically imported sortable list
// The DynamicSortableVehicleList component is lazy-loaded to avoid bundling
// @dnd-kit (~317 KiB) on initial page load. This wrapper handles the data
// transformation and provides the interface expected by the parent component.
function VehicleListView({ items, onSelectVehicle, onDeleteVehicle, onReorder }) {
  // Preload the sortable list component when this view mounts
  useEffect(() => {
    preloadGarageComponents();
  }, []);

  // Transform items to the format expected by SortableVehicleList
  const transformedItems = useMemo(() => {
    return items.map((item) => ({
      vehicle: item.vehicle,
      car: item.matchedCar,
      enrichedCar: item.enrichedCar,
    }));
  }, [items]);

  // Handle vehicle selection - transform back to original item format
  const handleSelectVehicle = useCallback(
    (transformedItem) => {
      const originalItem = items.find((item) => item.vehicle?.id === transformedItem.vehicle?.id);
      if (originalItem && onSelectVehicle) {
        onSelectVehicle(originalItem);
      }
    },
    [items, onSelectVehicle]
  );

  // Handle vehicle deletion
  const handleDeleteVehicle = useCallback(
    (vehicleId) => {
      const originalItem = items.find((item) => item.vehicle?.id === vehicleId);
      if (originalItem && onDeleteVehicle) {
        onDeleteVehicle(originalItem);
      }
    },
    [items, onDeleteVehicle]
  );

  return (
    <Suspense
      fallback={
        <div className={styles.vehicleListView}>
          {items.map((item) => (
            <VehicleListItemFallback
              key={item.vehicle?.id}
              item={item}
              onSelectVehicle={onSelectVehicle}
              onDeleteVehicle={onDeleteVehicle}
            />
          ))}
        </div>
      }
    >
      <DynamicSortableVehicleList
        items={transformedItems}
        onSelectVehicle={handleSelectVehicle}
        onDeleteVehicle={handleDeleteVehicle}
        onReorder={onReorder}
      />
    </Suspense>
  );
}

// Simple fallback list item (no drag support) shown while sortable version loads
function VehicleListItemFallback({ item, onSelectVehicle, onDeleteVehicle }) {
  const car = item.matchedCar;
  const vehicle = item.vehicle;
  const hasBuild = vehicle?.activeBuildId || vehicle?.installedModifications?.length > 0;
  const hpGain = item.build?.totalHpGain ?? vehicle?.totalHpGain ?? 0;

  const displayName =
    vehicle?.nickname ||
    car?.name ||
    `${vehicle?.year || ''} ${vehicle?.make || ''} ${vehicle?.model || ''}`.trim();
  const subtitle = car?.name || `${vehicle?.year} ${vehicle?.make} ${vehicle?.model}`;

  return (
    <SwipeableRow
      rightActions={[
        {
          icon: <Icons.trash size={18} />,
          label: 'Delete',
          onClick: () => onDeleteVehicle?.(item),
          variant: 'danger',
        },
      ]}
    >
      <div
        className={styles.vehicleListItem}
        onClick={() => onSelectVehicle?.(item)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectVehicle?.(item);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`Select ${displayName}`}
      >
        {/* Placeholder for drag handle (maintains layout) */}
        <div className={styles.dragHandle} style={{ opacity: 0.3 }}>
          <Icons.grip size={20} />
        </div>

        {/* Info */}
        <div className={styles.vehicleListInfo}>
          <h3 className={styles.vehicleListName}>{displayName}</h3>
          <p className={styles.vehicleListSubtitle}>{subtitle !== displayName ? subtitle : ''}</p>

          {/* Build stats */}
          <div className={styles.vehicleListStats}>
            {hasBuild && hpGain > 0 && (
              <span className={styles.vehicleListStat}>
                <Icons.bolt size={14} />
                <span className={styles.vehicleListStatValue}>+{hpGain}</span>
                <span className={styles.vehicleListStatLabel}>HP</span>
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className={styles.vehicleListActions}>
          <button
            className={styles.vehicleListAction}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteVehicle?.(item);
            }}
            title="Delete"
          >
            <Icons.trash size={18} />
          </button>
        </div>
      </div>
    </SwipeableRow>
  );
}

// Share icon for list view
Icons.share = ({ size = 16, style }) => (
  <IconWrapper style={style}>
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  </IconWrapper>
);

// Bolt icon for HP gains
Icons.bolt = ({ size = 16, style }) => (
  <IconWrapper style={style}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  </IconWrapper>
);

// Car Picker Modal for starting new projects on ANY car
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Reserved for future use
function CarPickerModal({ isOpen, onClose, onSelectCar, existingBuilds, allCars = [] }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort cars (from database via allCars prop)
  // Uses ENTHUSIAST_WEIGHTS from lib/scoring.js for consistent scoring across the app
  const filteredCars = React.useMemo(() => {
    let results = allCars;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = allCars.filter(
        (car) =>
          car.name?.toLowerCase().includes(query) ||
          car.brand?.toLowerCase().includes(query) ||
          car.category?.toLowerCase().includes(query) ||
          car.engine?.toLowerCase().includes(query)
      );
    }

    return results
      .map((car) => ({
        car,
        score: calculateWeightedScore(car, ENTHUSIAST_WEIGHTS),
        buildCount: existingBuilds.filter((b) => b.carSlug === car.slug).length,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, existingBuilds]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose} data-overlay-modal>
      <div className={styles.carPickerModal} onClick={(e) => e.stopPropagation()}>
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
                <span className={styles.carPickerMeta}>
                  {car.hp} hp • {car.priceRange}
                </span>
                {buildCount > 0 && (
                  <span className={styles.carPickerExisting}>
                    {buildCount} existing project{buildCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// LocalStorage key for persisting selected vehicle index
const SELECTED_INDEX_KEY = 'autorev_garage_selected_index';

// Main Garage Component Content
function GarageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Selection persistence: hydrate from localStorage on mount
  // Per SOURCE_OF_TRUTH.md: Selection should persist across navigation/refresh
  const [selectedIndex, setSelectedIndex] = useState(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const stored = localStorage.getItem(SELECTED_INDEX_KEY);
      const parsed = stored ? parseInt(stored, 10) : 0;
      return isNaN(parsed) ? 0 : parsed;
    } catch {
      return 0;
    }
  });

  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [_addingFavoriteCar, setAddingFavoriteCar] = useState(null);
  const [selectedBuild, setSelectedBuild] = useState(null);

  // Use cached cars data from React Query hook
  const { data: allCars = [], isLoading: carsLoading } = useCarsList();

  // Quick mileage update mode state
  const [quickUpdateMode, setQuickUpdateMode] = useState(false);
  const [quickUpdateValues, setQuickUpdateValues] = useState({});
  const [savingQuickUpdates, setSavingQuickUpdates] = useState(false);

  // Edit/reorder mode state (for My Collection tab)
  const [isEditMode, setIsEditMode] = useState(false);
  const [_isReordering, setIsReordering] = useState(false);

  // Swipe gesture state (for mobile navigation)
  const touchStartRef = useRef({ x: 0, y: 0 });
  const touchEndRef = useRef({ x: 0, y: 0 });

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, index: null, item: null });

  const {
    isAuthenticated,
    user,
    profile,
    isLoading: authLoading,
    isDataFetchReady,
    sessionExpired,
    authError,
  } = useAuth();
  const { showPointsEarned } = usePointsNotification();
  const authModal = useAuthModal();

  // Get user's first name for personalized title
  const firstName =
    profile?.display_name?.split(' ')[0] ||
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'My';

  // Get user's avatar URL for profile button
  const avatarUrl =
    profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  const {
    favorites,
    addFavorite: _addFavorite,
    removeFavorite,
    isLoading: _favoritesLoading,
  } = useFavorites();
  const {
    builds,
    deleteBuild: _deleteBuild,
    getBuildById: _getBuildById,
    isLoading: _buildsLoading,
  } = useSavedBuilds();
  const {
    vehicles,
    addVehicle,
    updateVehicle,
    removeVehicle,
    clearModifications,
    updateCustomSpecs,
    clearCustomSpecs,
    reorderVehicles,
    isLoading: vehiclesLoading,
    refresh: refreshVehicles,
  } = useOwnedVehicles();
  const { hasAccess: _hasAccess } = usePremiumAccess();

  // Persist selectedIndex to localStorage when it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SELECTED_INDEX_KEY, String(selectedIndex));
    } catch {
      // localStorage may be unavailable in some contexts
    }
  }, [selectedIndex]);

  // Validate selectedIndex when vehicles array changes (e.g., after deletion)
  useEffect(() => {
    if (vehicles.length === 0) {
      if (selectedIndex !== 0) setSelectedIndex(0);
      return;
    }
    // Clamp index to valid range if it exceeds vehicle count
    if (selectedIndex >= vehicles.length) {
      setSelectedIndex(vehicles.length - 1);
    }
  }, [vehicles.length, selectedIndex]);

  // LOADING SCREEN TIMEOUT: Safety hatch to prevent infinite loading
  // If loading takes longer than this, show content anyway (degraded but usable)
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  useEffect(() => {
    // Only start timeout if we're in a loading state
    if (!authLoading && isAuthenticated && isDataFetchReady && !vehiclesLoading) {
      // Already loaded, no timeout needed
      return;
    }

    const timeout = setTimeout(() => {
      console.warn('[Garage] Loading timeout reached - showing content to prevent stuck state');
      setLoadingTimedOut(true);
    }, 8000); // 8 second max loading time

    return () => clearTimeout(timeout);
  }, [authLoading, isAuthenticated, isDataFetchReady, vehiclesLoading]);

  // Reset timeout flag when data successfully loads
  useEffect(() => {
    if (!authLoading && isDataFetchReady && !vehiclesLoading) {
      setLoadingTimedOut(false);
    }
  }, [authLoading, isDataFetchReady, vehiclesLoading]);

  // Handle action=add URL parameter to auto-open add vehicle modal
  const [addActionProcessed, setAddActionProcessed] = useState(false);
  useEffect(() => {
    const actionFromUrl = searchParams.get('action');
    if (actionFromUrl === 'add' && !addActionProcessed && isAuthenticated && !authLoading) {
      const timer = setTimeout(() => {
        setIsAddVehicleOpen(true);
        setAddActionProcessed(true);

        // Clear the action param from URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('action');
        router.replace(newUrl.pathname + newUrl.search, { scroll: false });
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [searchParams, addActionProcessed, isAuthenticated, authLoading, router]);

  // Combined loading state - show loading while auth or vehicle data is being fetched
  // CRITICAL: Also check isDataFetchReady to prevent race condition on page refresh where
  // auth resolves (authLoading=false) but providers haven't started fetching yet (waiting for isDataFetchReady)
  // Without this check, there's a brief moment where the page shows empty state instead of loading
  //
  // PERFORMANCE OPTIMIZATION: We no longer block on carsLoading (full car list).
  // Instead, individual vehicle cards use tempCarFromVehicle and _isCarDataLoading
  // to show content immediately while car data loads in the background.
  // This makes tab navigation feel instant for returning users.
  const isDataLoading = useMemo(() => {
    // Safety hatch: if loading times out, show content anyway
    if (loadingTimedOut) return false;

    // STALE-WHILE-REVALIDATE: If we already have vehicles data, don't show loading
    // This prevents loading screens when navigating between tabs - existing data shows instantly
    // while any background refresh happens silently
    if (vehicles.length > 0) return false;

    // Always show loading during auth check
    if (authLoading) return true;

    // Not authenticated = no loading (show empty state or guest content)
    if (!isAuthenticated) return false;

    // Wait for prefetch to complete before showing any data
    if (!isDataFetchReady) return true;

    // Only block on vehicles loading - NOT carsLoading
    // The tempCarFromVehicle fallback provides enough data to render the UI
    // Individual cards will show loading states via _isCarDataLoading flag
    return vehiclesLoading;
  }, [
    authLoading,
    isAuthenticated,
    isDataFetchReady,
    vehiclesLoading,
    loadingTimedOut,
    vehicles.length,
  ]);

  // Merge favorites with full car data (from database)
  // Guard: ensure allCars is an array before using array methods
  // Wrapped in useMemo to provide stable reference for dependent hooks
  const carsArray = useMemo(() => (Array.isArray(allCars) ? allCars : []), [allCars]);

  // Fallback: get the current vehicle's matched car slug for individual fetch
  const currentVehicle = vehicles[selectedIndex];
  const currentVehicleCarSlug = currentVehicle?.matchedCarSlug;

  // Check if current vehicle's car is in the carsArray
  const currentCarInArray = currentVehicleCarSlug
    ? carsArray.find((c) => c.slug === currentVehicleCarSlug)
    : null;

  // Fetch individual car data as fallback when:
  // 1. carsArray is empty, OR
  // 2. The specific car slug isn't found in carsArray (race condition/cache miss)
  // IMPROVEMENT: Run in parallel with the full list, don't wait for !carsLoading
  // This provides faster data when the full list is slow or fails
  // Per SOURCE_OF_TRUTH: Use useCarBySlug as fallback for individual car resolution
  const { data: fallbackCar, isLoading: fallbackCarLoading } = useCarBySlug(currentVehicleCarSlug, {
    enabled: !!currentVehicleCarSlug && !currentCarInArray,
  });

  const _favoriteCars = useMemo(() => {
    return favorites.map((fav) => {
      const fullCarData = carsArray.find((c) => c.slug === fav.slug);
      return fullCarData ? { ...fullCarData, addedAt: fav.addedAt } : fav;
    });
  }, [favorites, carsArray]);

  // Get cars for builds (from database)
  const _buildsWithCars = useMemo(() => {
    if (carsArray.length === 0) return [];
    return builds
      .map((build) => ({
        ...build,
        car: carsArray.find((c) => c.slug === build.carSlug),
      }))
      .filter((b) => b.car);
  }, [builds, carsArray]);

  // Get matched car data for owned vehicles (from database)
  // When allCars hasn't loaded yet, create a temporary car-like object from vehicle data
  // so the UI shows the vehicle info immediately instead of "Loading..."
  const vehiclesWithCars = useMemo(() => {
    return vehicles.map((vehicle, index) => {
      // Try to get from full list first
      let matchedCar = vehicle.matchedCarSlug
        ? carsArray.find((c) => c.slug === vehicle.matchedCarSlug)
        : null;

      // Fallback: use individually fetched car for current vehicle if list is empty
      if (
        !matchedCar &&
        index === selectedIndex &&
        fallbackCar &&
        vehicle.matchedCarSlug === fallbackCar.slug
      ) {
        matchedCar = fallbackCar;
      }

      // Get the active build data if the vehicle has one linked
      // This ensures we show the CURRENT build HP gain, not the stale cached value on user_vehicles
      const activeBuild = vehicle.activeBuildId
        ? builds.find((b) => b.id === vehicle.activeBuildId)
        : null;

      // Create a temporary car object from vehicle data when:
      // 1. matchedCar isn't available yet (allCars still loading), OR
      // 2. Vehicle has no matchedCarSlug (manually added, not in our database)
      // This allows the UI to show vehicle info immediately instead of "Loading..."
      const tempCarFromVehicle = !matchedCar
        ? {
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
          }
        : null;

      return {
        vehicle,
        matchedCar: matchedCar || tempCarFromVehicle,
        id: vehicle.id,
        // Include the active build data for HP gain display
        build: activeBuild,
        // Show loading state when:
        // 1. No matchedCar found AND vehicle has a matchedCarSlug (expects to find data)
        // 2. Either still loading all cars OR current vehicle fallback is still loading
        // Per SOURCE_OF_TRUTH: Stock specs come from cars table via matchedCarSlug
        _isCarDataLoading:
          !matchedCar &&
          vehicle.matchedCarSlug &&
          (carsLoading || // Still loading all cars
            (index === selectedIndex && fallbackCarLoading)), // Current vehicle fallback still loading
      };
    });
  }, [vehicles, carsArray, builds, selectedIndex, fallbackCar, fallbackCarLoading, carsLoading]);

  // Check if a car is already in My Collection
  const isInMyCars = (slug) => vehicles.some((v) => v.matchedCarSlug === slug);

  // Get current items based on tab
  // Vehicles are the current items for this page
  const currentItems = vehiclesWithCars;
  const currentItem = currentItems[selectedIndex];

  // Handle adding a favorite car to My Collection
  // When promoting a car from favorites to owned, auto-remove from favorites
  const _handleAddFavoriteToMyCars = async (car) => {
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

      if (
        car.name.startsWith('718') ||
        car.name.startsWith('911') ||
        car.name.startsWith('981') ||
        car.name.startsWith('997') ||
        car.name.startsWith('987') ||
        car.name.startsWith('991') ||
        car.name.startsWith('992')
      ) {
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
      if (favorites.some((f) => f.slug === car.slug)) {
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

    const vehicleName =
      item.vehicle?.nickname ||
      `${item.vehicle?.year} ${item.vehicle?.make} ${item.vehicle?.model}`;
    return {
      title: 'Remove from My Garage',
      message: `Are you sure you want to remove "${vehicleName}" from My Garage?`,
    };
  };

  // Confirm and execute removal
  const handleConfirmRemove = async () => {
    const { index, item } = confirmModal;
    if (!item) return;

    // Close modal immediately for better UX
    setConfirmModal({ isOpen: false, index: null, item: null });

    const result = await removeVehicle(item.vehicle.id);

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

    // For saved builds - navigate to My Build with build ID
    if (item.id && item.carSlug) {
      router.push(`/garage/my-build?build=${item.id}`);
    }
    // For car items (from favorites or owned) - navigate to My Build with car slug
    else if (item.slug) {
      router.push(`/garage/my-build?car=${item.slug}`);
    }
    // For owned vehicle items - get the matched car slug
    else if (item.matchedCar?.slug) {
      router.push(`/garage/my-build?car=${item.matchedCar.slug}`);
    }
  };

  // View mode: 'presentation' (swipeable cards) or 'list' (compact list)
  // Read from URL param on initial load, default to presentation
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('view') === 'list' ? 'list' : 'presentation';
    }
    return 'presentation';
  });

  // Update URL when view mode changes (without full page reload)
  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    const url = new URL(window.location);
    if (mode === 'list') {
      url.searchParams.set('view', 'list');
    } else {
      url.searchParams.delete('view');
    }
    window.history.replaceState({}, '', url);
  }, []);

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

    // Show points notification for adding vehicle
    showPointsEarned(10, 'Vehicle added');
  };

  // Handle car request for vehicles not in our database
  const handleRequestCar = async (requestData) => {
    const { data, error } = await submitCarRequest(requestData, userId);

    if (error) {
      console.error('Failed to submit car request:', error);
      throw error;
    }

    return data;
  };

  // Toggle quick update mode
  const handleToggleQuickUpdate = () => {
    if (!quickUpdateMode) {
      // Entering quick update mode - initialize values from current vehicles
      const initialValues = {};
      vehicles.forEach((v) => {
        initialValues[v.id] = v.mileage || '';
      });
      setQuickUpdateValues(initialValues);
    }
    setQuickUpdateMode(!quickUpdateMode);
  };

  // Update mileage in quick update mode
  const handleQuickMileageChange = (vehicleId, value) => {
    setQuickUpdateValues((prev) => ({
      ...prev,
      [vehicleId]: value,
    }));
  };

  // Save all quick updates
  const handleSaveQuickUpdates = async () => {
    setSavingQuickUpdates(true);

    try {
      // Update each vehicle that has changed
      const updates = Object.entries(quickUpdateValues).map(async ([vehicleId, mileage]) => {
        const vehicle = vehicles.find((v) => v.id === vehicleId);
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
      setSelectedIndex((prev) => (prev < currentItems.length - 1 ? prev + 1 : 0));
    } else {
      // Swipe right → previous vehicle
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : currentItems.length - 1));
    }
  }, [isEditMode, quickUpdateMode, currentItems.length]);

  // ============================================================================
  // REORDER HANDLERS (Edit Mode)
  // ============================================================================

  const _handleMoveVehicle = useCallback(
    async (fromIndex, toIndex) => {
      if (toIndex < 0 || toIndex >= vehiclesWithCars.length) return;

      setIsReordering(true);

      // Create new order array
      const newOrder = [...vehiclesWithCars];
      const [moved] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, moved);

      // Extract vehicle IDs in new order
      const vehicleIds = newOrder.map((item) => item.vehicle.id);

      const result = await reorderVehicles(vehicleIds);

      if (result.success) {
        // Update selected index to follow the moved item
        setSelectedIndex(toIndex);
      } else {
        console.error('[Garage] Reorder failed:', result.error);
      }

      setIsReordering(false);
    },
    [vehiclesWithCars, reorderVehicles]
  );

  const _handleToggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
  }, []);

  // Pull-to-refresh handler for mobile
  const handleGarageRefresh = useCallback(async () => {
    if (refreshVehicles) {
      await refreshVehicles();
    }
  }, [refreshVehicles]);

  // If viewing a build detail, show that instead
  if (selectedBuild) {
    return (
      <div className={styles.page}>
        <BuildDetailView
          build={selectedBuild}
          car={carsArray.find((c) => c.slug === selectedBuild.carSlug)}
          onBack={() => {
            setSelectedBuild(null);
            window.history.pushState({}, '', '/garage');
          }}
        />
      </div>
    );
  }

  // Full-page loading state - show BEFORE any page content
  if (isDataLoading) {
    return (
      <div className={styles.page}>
        <LoadingSpinner
          variant="branded"
          text="Loading Your Garage"
          subtext={authLoading ? 'Verifying your session...' : 'Fetching your vehicles...'}
          fullPage
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Page Header - Title on left, Profile on right */}
      <header className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>{firstName}&apos;s Garage</h1>
        </div>
        <div className={styles.headerRight}>
          {/* Profile Button */}
          <Link href="/dashboard" className={styles.profileLink}>
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                width={36}
                height={36}
                className={styles.profileAvatar}
              />
            ) : (
              <Icons.user size={20} />
            )}
          </Link>
        </div>
      </header>

      {/* Subtitle row with vehicle count */}
      <div className={styles.subtitleRow}>
        <p className={styles.pageSubtitle}>
          {vehiclesWithCars.length} {vehiclesWithCars.length === 1 ? 'vehicle' : 'vehicles'} in your
          collection
        </p>
      </div>

      {/* Garage Score moved to Dashboard tab - January 2026 */}

      {/* Main Content Area - with swipe support for mobile navigation */}
      <PullToRefresh onRefresh={handleGarageRefresh}>
        <div
          className={styles.mainContent}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Quick Update Mode Overlay */}
          {quickUpdateMode && (
            <div className={styles.quickUpdateOverlay}>
              <div className={styles.quickUpdatePanel}>
                <div className={styles.quickUpdateHeader}>
                  <h3>Quick Update Mileage</h3>
                  <p>Update mileage for all vehicles at once</p>
                </div>

                <div className={styles.quickUpdateList}>
                  {vehiclesWithCars.map((item) => {
                    const vehicleName =
                      item.matchedCar?.name ||
                      `${item.vehicle.year || ''} ${item.vehicle.make || ''} ${item.vehicle.model || ''}`.trim();

                    return (
                      <div key={item.vehicle.id} className={styles.quickUpdateItem}>
                        <div className={styles.quickUpdateVehicleInfo}>
                          <span className={styles.quickUpdateVehicleName}>{vehicleName}</span>
                          <span className={styles.quickUpdateCurrentMileage}>
                            Current:{' '}
                            {item.vehicle.mileage
                              ? item.vehicle.mileage.toLocaleString()
                              : 'Not set'}
                          </span>
                        </div>
                        <input
                          type="number"
                          className={styles.quickUpdateInput}
                          value={quickUpdateValues[item.vehicle.id] || ''}
                          onChange={(e) =>
                            handleQuickMileageChange(item.vehicle.id, e.target.value)
                          }
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

          {/* Vehicles - Presentation or List View based on viewMode */}
          {currentItems.length > 0 ? (
            viewMode === 'list' ? (
              /* List View - Compact list for managing multiple vehicles */
              <div className={styles.listViewContainer}>
                {/* Controls row - View toggle + Add Vehicle (same position as presentation view) */}
                <div className={styles.listViewControls}>
                  <div className={styles.vehicleHeaderActions}>
                    {/* View Toggle - Gallery/List */}
                    <div className={styles.viewToggle}>
                      <button
                        className={`${styles.viewToggleBtn} ${viewMode === 'presentation' ? styles.viewToggleBtnActive : ''}`}
                        onClick={() => handleViewModeChange('presentation')}
                        title="Gallery view"
                        aria-label="Gallery view"
                      >
                        <Icons.gallery size={16} />
                      </button>
                      <button
                        className={`${styles.viewToggleBtn} ${viewMode === 'list' ? styles.viewToggleBtnActive : ''}`}
                        onClick={() => handleViewModeChange('list')}
                        title="List view"
                        aria-label="List view"
                      >
                        <Icons.list size={16} />
                      </button>
                    </div>
                    {/* Add Vehicle Button */}
                    <button
                      className={styles.addVehicleBtn}
                      onClick={() => setIsAddVehicleOpen(true)}
                    >
                      <Icons.plus size={16} />
                      Add Vehicle
                    </button>
                  </div>
                </div>
                <VehicleListView
                  items={currentItems}
                  onSelectVehicle={(item) => {
                    // Switch to presentation view and select this vehicle
                    const idx = currentItems.findIndex((i) => i.vehicle?.id === item.vehicle?.id);
                    if (idx !== -1) {
                      setSelectedIndex(idx);
                      handleViewModeChange('presentation');
                    }
                  }}
                  onDeleteVehicle={(item) => {
                    const idx = currentItems.findIndex((i) => i.vehicle?.id === item.vehicle?.id);
                    if (idx !== -1) {
                      handleRemoveRequest(idx);
                    }
                  }}
                  onReorder={async (vehicleIds) => {
                    // Persist the new order to the database
                    const result = await reorderVehicles(vehicleIds);
                    if (!result.success) {
                      console.error('[Garage] Reorder failed:', result.error);
                    }
                  }}
                />
              </div>
            ) : (
              /* Presentation View - Swipeable hero cards */
              <>
                {/* Desktop Two-Column Layout - hidden on mobile via CSS */}
                <DesktopGarageLayout
                  item={currentItem}
                  selectedIndex={selectedIndex}
                  totalItems={currentItems.length}
                  onNavigate={setSelectedIndex}
                  onAddVehicle={() => setIsAddVehicleOpen(true)}
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                />
                {/* Mobile/Tablet Layout - hidden on desktop via CSS */}
                <div className={styles.mobileGarageLayout}>
                  <HeroVehicleDisplay
                    item={currentItem}
                    type="mycars"
                    onAction={handleBuildAction}
                    onUpdateVehicle={updateVehicle}
                    onClearModifications={clearModifications}
                    onUpdateCustomSpecs={updateCustomSpecs}
                    onClearCustomSpecs={clearCustomSpecs}
                    userId={user?.id}
                    selectedIndex={selectedIndex}
                    totalItems={currentItems.length}
                    onNavigate={setSelectedIndex}
                    viewMode={viewMode}
                    onViewModeChange={handleViewModeChange}
                    onAddVehicle={() => setIsAddVehicleOpen(true)}
                  />
                </div>
              </>
            )
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
                onClick={() => (sessionExpired ? authModal.openSignIn() : window.location.reload())}
                className={styles.emptyAction}
              >
                {sessionExpired ? 'Sign In' : 'Retry'}
              </button>
            </div>
          ) : (
            <EmptyState
              icon={Icons.car}
              title="Your Garage Awaits"
              description="Add your vehicle and we'll handle the research — curated upgrades, known issues, and maintenance schedules, all specific to your car."
              actionLabel="Add Your First Vehicle"
              onAction={() => setIsAddVehicleOpen(true)}
            />
          )}
        </div>
      </PullToRefresh>

      <AuthModal
        isOpen={authModal.isOpen}
        onClose={authModal.close}
        defaultMode={authModal.defaultMode}
      />

      <AddVehicleModal
        isOpen={isAddVehicleOpen}
        onClose={() => setIsAddVehicleOpen(false)}
        onAdd={handleAddVehicle}
        onRequestCar={handleRequestCar}
        existingVehicles={vehicles}
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

// Loading fallback - uses skeleton loaders per SOURCE_OF_TRUTH.md
// Skeleton shapes should match actual content to prevent layout shift
function GarageLoading() {
  return (
    <div className={styles.page}>
      {/* Header skeleton */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <Skeleton width={200} height={36} variant="rounded" />
        </div>
        <div className={styles.headerRight}>
          <Skeleton width={44} height={44} variant="circular" />
        </div>
      </div>

      {/* Subtitle row skeleton */}
      <div className={styles.subtitleRow}>
        <Skeleton width={140} height={16} variant="rounded" />
      </div>

      {/* Vehicle card skeletons - match presentation view cards */}
      <div className={styles.garageLoadingSkeleton}>
        <div className={styles.vehicleCardSkeleton}>
          <Skeleton height={200} variant="rectangular" className={styles.vehicleImageSkeleton} />
          <div className={styles.vehicleInfoSkeleton}>
            <Skeleton width="70%" height={24} variant="rounded" />
            <Skeleton width="50%" height={18} variant="rounded" />
            <div className={styles.vehicleStatsSkeleton}>
              <Skeleton width={60} height={24} variant="rounded" />
              <Skeleton width={60} height={24} variant="rounded" />
              <Skeleton width={80} height={24} variant="rounded" />
            </div>
          </div>
        </div>
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
