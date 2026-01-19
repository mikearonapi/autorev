'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { UI_IMAGES } from '@/lib/images';
import styles from './page.module.css';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import { AL_PLANS, AL_TOPUP_PACKAGES } from '@/lib/alConfig';
import { useCheckout } from '@/hooks/useCheckout';
import { IS_BETA } from '@/lib/tierAccess';
import { AL_CREDIT_PACKS, SUBSCRIPTION_TIERS } from '@/lib/stripe';
import ReferralPanel from '@/components/ReferralPanel';
import LoadingSpinner from '@/components/LoadingSpinner';
// Car count now comes from usePlatformStats hook or default

// Format fuel units for display (1 cent = 1 fuel)
const formatFuel = (cents) => `${cents || 0}`;

// Estimate conversations from fuel (rough: 1-2 fuel per simple chat)
const estimateConversations = (fuel) => {
  const min = Math.floor(fuel / 2);
  const max = Math.floor(fuel / 1.2);
  return `~${min}-${max}`;
};

// Icons
const Icons = {
  mapPin: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  user: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  mail: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  ),
  heart: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  wrench: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  settings: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  logout: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
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
  check: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  arrowLeft: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  creditCard: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  crown: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
    </svg>
  ),
  shield: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  bell: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  infinity: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z"/>
    </svg>
  ),
  sparkle: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z"/>
    </svg>
  ),
  trash: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  externalLink: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
  fuel: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>
      <path d="M15 10h4a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2"/>
      <path d="M15 6V3"/>
      <path d="M3 22h12"/>
      <rect x="6" y="10" width="6" height="4"/>
    </svg>
  ),
  bot: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"/>
      <circle cx="12" cy="5" r="2"/>
      <path d="M12 7v4"/>
      <line x1="8" y1="16" x2="8" y2="16"/>
      <line x1="16" y1="16" x2="16" y2="16"/>
    </svg>
  ),
  plus: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  zap: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  gift: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"/>
      <rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  ),
  play: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  refresh: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
};

// Car count for display
// NOTE: Update this when car database grows significantly (current: ~192 cars)
const CAR_COUNT = '190+';

// Subscription plans configuration - matches join page
const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceNote: 'Forever',
    features: [
      `Car Finder + full ${CAR_COUNT}-car database`,
      'Specs, education & tuning shop',
      'Community builds & newsletter',
      '25 AL Fuel/month (~15-20 chats)',
    ],
  },
  collector: {
    id: 'collector',
    name: 'Enthusiast',
    price: 0,
    priceNote: 'Free During Beta',
    futurePrice: '$4.99/mo',
    features: [
      'Everything in Free',
      'My Garage — save & track cars',
      'Collections & side-by-side compare',
      'Ownership history & export',
      '100 AL Fuel/month (~70-80 chats)',
    ],
    popular: true,
  },
  tuner: {
    id: 'tuner',
    name: 'Tuner',
    price: 0,
    priceNote: 'Free During Beta',
    futurePrice: '$9.99/mo',
    features: [
      'Everything in Collector',
      'Save & organize tuning projects',
      'Build analytics & cost projections',
      'PDF exports & early access',
      '250 AL Fuel/month (~175-200 chats)',
    ],
  },
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, isAuthenticated, isLoading, logout, updateProfile, authError, sessionExpired, clearAuthError, triggerOnboarding } = useAuth();
  const { count: favoritesCount } = useFavorites();
  const { builds } = useSavedBuilds();
  const { checkoutSubscription, checkoutCredits, resumeCheckout, isLoading: checkoutLoading, error: checkoutError } = useCheckout();
  
  // Check for checkout success or resume intent from URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const params = new URLSearchParams(window.location.search);
    
    // Handle successful checkout
    if (params.get('checkout') === 'success') {
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('checkout');
      url.searchParams.delete('session_id');
      window.history.replaceState({}, '', url.pathname + url.search);
      
      // Show success message and refresh profile
      alert('Payment successful! Your account has been updated.');
    }
    
    // Handle checkout resume after auth
    if (params.get('resume_checkout') === 'true' && user) {
      const url = new URL(window.location.href);
      url.searchParams.delete('resume_checkout');
      window.history.replaceState({}, '', url.pathname + url.search);
      
      // Resume the pending checkout
      resumeCheckout();
    }
  }, [user, resumeCheckout]);
  
  const [activeTab, setActiveTab] = useState('profile');
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    maintenance: true,
    newsletter: false,
  });
  
  // Location state
  const [locationZip, setLocationZip] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [locationState, setLocationState] = useState('');
  const [isLookingUpZip, setIsLookingUpZip] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [locationSaveSuccess, setLocationSaveSuccess] = useState(false);
  const [locationError, setLocationError] = useState('');

  // AL Fuel state
  const [alBalance, setAlBalance] = useState({
    fuel: 25,
    monthlyFuel: 25,
    spentFuel: 0,
    plan: 'free',
    tank: { percentage: 100, status: { label: 'Full', color: '#22c55e' } },
    messagesThisMonth: 0,
    isUnlimited: false,
  });
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  // isPurchasing now driven by checkoutLoading from hook

  // Data clearing state
  const [clearingData, setClearingData] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(null);

  // Current plan (mock - would come from backend)
  const currentPlan = profile?.subscription_tier || 'free';

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/garage');
    }
  }, [isLoading, isAuthenticated, router]);

  // Initialize display name from profile
  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    } else if (user?.user_metadata?.full_name) {
      setDisplayName(user.user_metadata.full_name);
    }
  }, [profile, user]);

  // Initialize location from profile
  useEffect(() => {
    if (profile?.location_zip) {
      setLocationZip(profile.location_zip);
      setLocationCity(profile.location_city || '');
      setLocationState(profile.location_state || '');
    }
  }, [profile]);

  // Fetch AL Balance - live from API (fuel-based display)
  useEffect(() => {
    async function fetchAlBalance() {
      if (!user?.id) return;
      
      setIsLoadingBalance(true);
      try {
        const response = await fetch(`/api/users/${user.id}/al-credits`);
        const data = await response.json();
        
        if (response.ok) {
          const plan = AL_PLANS[data.plan || currentPlan] || AL_PLANS.free;
          const fuel = data.balanceCents || 0;
          const monthlyFuel = data.monthlyAllocationCents || plan.allocation.monthlyCents;
          const spentFuel = data.spentThisMonthCents || 0;
          const isUnlimited = data.isUnlimited || false;
          
          setAlBalance({
            fuel,
            monthlyFuel,
            spentFuel,
            plan: data.plan || currentPlan,
            planName: isUnlimited ? 'Founder' : (data.planName || plan.name),
            tank: data.tank || {
              percentage: isUnlimited ? 100 : 100,
              status: isUnlimited 
                ? { label: 'Unlimited', color: '#8b5cf6' }
                : { label: 'Full', color: '#22c55e' },
              label: isUnlimited ? 'Founder Tank' : plan.tankLabel,
            },
            purchasedFuel: data.purchasedCents || 0,
            messagesThisMonth: data.messagesThisMonth || 0,
            isUnlimited,
          });
        } else {
          console.warn('Failed to fetch balance, using defaults');
          const plan = AL_PLANS[currentPlan] || AL_PLANS.free;
          const monthlyFuel = plan.allocation.monthlyCents;
          setAlBalance({
            fuel: monthlyFuel,
            monthlyFuel,
            spentFuel: 0,
            plan: currentPlan,
            planName: plan.name,
            tank: {
              percentage: 100,
              status: { label: 'Full', color: '#22c55e' },
              label: plan.tankLabel,
            },
            purchasedFuel: 0,
            messagesThisMonth: 0,
          });
        }
      } catch (err) {
        console.error('Failed to fetch AL balance:', err);
        const plan = AL_PLANS[currentPlan] || AL_PLANS.free;
        const monthlyFuel = plan.allocation.monthlyCents;
        setAlBalance({
          fuel: monthlyFuel,
          monthlyFuel,
          spentFuel: 0,
          plan: currentPlan,
          planName: plan.name,
          tank: {
            percentage: 100,
            status: { label: 'Full', color: '#22c55e' },
            label: plan.tankLabel,
          },
          purchasedFuel: 0,
          messagesThisMonth: 0,
        });
      } finally {
        setIsLoadingBalance(false);
      }
    }

    fetchAlBalance();
  }, [user?.id, currentPlan]);

  // Handle fuel top-up purchase via Stripe
  const handlePurchaseTopup = async (packageId) => {
    // Map the old package IDs to new Stripe pack IDs
    const packMapping = {
      'starter': 'small',
      'popular': 'medium', 
      'value': 'large',
      'small': 'small',
      'medium': 'medium',
      'large': 'large',
    };
    const stripePack = packMapping[packageId] || packageId;
    await checkoutCredits(stripePack);
  };

  // Handle subscription upgrade
  const handleUpgrade = async (tier) => {
    if (IS_BETA) {
      // During beta, just update the tier directly (free upgrade)
      const { error } = await updateProfile({ subscription_tier: tier });
      if (!error) {
        alert(`Upgraded to ${PLANS[tier]?.name || tier}! Enjoy your new features.`);
      }
    } else {
      // After beta, go through Stripe checkout
      await checkoutSubscription(tier);
    }
  };

  // Handle profile update
  const handleSaveProfile = async () => {
    if (!displayName.trim()) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    
    const { error } = await updateProfile({ display_name: displayName.trim() });
    
    setIsSaving(false);
    
    if (!error) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    await logout();
    router.push('/');
  };

  // Handle ZIP code lookup
  const handleZipLookup = async (zip) => {
    setLocationZip(zip);
    setLocationError('');
    
    // Only lookup if we have a valid 5-digit ZIP
    if (!/^\d{5}$/.test(zip)) {
      setLocationCity('');
      setLocationState('');
      return;
    }
    
    setIsLookingUpZip(true);
    try {
      const response = await fetch(`/api/user/location?zip=${zip}`);
      const data = await response.json();
      
      if (response.ok && data.city) {
        setLocationCity(data.city);
        setLocationState(data.state);
      } else if (response.ok && data.state) {
        // We know the state but not the city
        setLocationCity('');
        setLocationState(data.state);
      } else {
        setLocationCity('');
        setLocationState('');
        setLocationError('ZIP code not found');
      }
    } catch (err) {
      console.error('Failed to lookup ZIP:', err);
      setLocationCity('');
      setLocationState('');
    } finally {
      setIsLookingUpZip(false);
    }
  };

  // Handle location save
  const handleSaveLocation = async () => {
    if (!locationZip || !/^\d{5}$/.test(locationZip)) {
      setLocationError('Please enter a valid 5-digit ZIP code');
      return;
    }
    
    setIsSavingLocation(true);
    setLocationError('');
    setLocationSaveSuccess(false);
    
    try {
      const response = await fetch('/api/user/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zip: locationZip }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setLocationCity(data.location.city || '');
        setLocationState(data.location.state || '');
        setLocationSaveSuccess(true);
        setTimeout(() => setLocationSaveSuccess(false), 3000);
      } else {
        setLocationError(data.error || 'Failed to save location');
      }
    } catch (err) {
      console.error('Failed to save location:', err);
      setLocationError('Failed to save location');
    } finally {
      setIsSavingLocation(false);
    }
  };

  // Handle clear location
  const handleClearLocation = async () => {
    setIsSavingLocation(true);
    setLocationError('');
    
    try {
      const response = await fetch('/api/user/location', {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setLocationZip('');
        setLocationCity('');
        setLocationState('');
        setLocationSaveSuccess(true);
        setTimeout(() => setLocationSaveSuccess(false), 3000);
      } else {
        const data = await response.json();
        setLocationError(data.error || 'Failed to clear location');
      }
    } catch (err) {
      console.error('Failed to clear location:', err);
      setLocationError('Failed to clear location');
    } finally {
      setIsSavingLocation(false);
    }
  };

  // Handle data clearing
  const handleClearData = async (scope) => {
    if (!user?.id) return;
    
    setClearingData(scope);
    try {
      const response = await fetch(`/api/users/${user.id}/clear-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scope }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        alert(`Successfully cleared: ${data.cleared.join(', ')}`);
        setShowClearConfirm(null);
        
        // Refresh the page to update counts
        window.location.reload();
      } else {
        alert(`Failed to clear data: ${data.error || data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Failed to clear data:', err);
      alert('Failed to clear data. Please try again.');
    } finally {
      setClearingData(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.loading}>
        <LoadingSpinner 
          variant="branded" 
          text="Loading Profile" 
          subtext="Fetching your account..."
          fullPage 
        />
      </div>
    );
  }

  // Session expired or auth error - show message with retry option
  if (sessionExpired || authError) {
    return (
      <div className={styles.loading}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--color-warning, #f59e0b)' }}>
            {sessionExpired ? 'Session Expired' : 'Authentication Error'}
          </h2>
          <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
            {sessionExpired 
              ? 'Your session has expired. Please sign in again to continue.'
              : authError || 'There was an error loading your profile.'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              onClick={() => {
                clearAuthError?.();
                router.push('/garage');
              }}
              className={styles.saveButton}
            >
              Sign In Again
            </button>
            <button 
              onClick={() => window.location.reload()}
              className={styles.secondaryButton}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated (should redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const initials = (displayName || user?.email || 'U').charAt(0).toUpperCase();
  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: Icons.user },
    { id: 'data', label: 'Your Data', icon: Icons.shield },
    { id: 'al', label: 'AL Credits', icon: 'al-mascot' },
    { id: 'referrals', label: 'Refer & Earn', icon: Icons.gift },
    { id: 'subscription', label: 'Subscription & Billing', icon: Icons.crown },
  ];

  return (
    <div className={styles.page} data-no-main-offset>
      {/* Hero Header with Gradient */}
      <div className={styles.heroHeader}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.profileHeader}>
            <div className={styles.avatar}>
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName || 'Profile'}
                  width={100}
                  height={100}
                  className={styles.avatarImage}
                />
              ) : (
                <span className={styles.avatarInitials}>{initials}</span>
              )}
              <div className={styles.avatarGlow} />
            </div>
            
            <div className={styles.headerInfo}>
              <h1 className={styles.title}>{displayName || 'Your Account'}</h1>
              <p className={styles.email}>
                <Icons.mail size={16} />
                {user.email}
              </p>
              <div className={styles.headerMeta}>
                <span className={styles.memberSince}>
                  <Icons.calendar size={14} />
                  Member since {memberSince}
                </span>
                <span className={styles.planBadge} data-plan={currentPlan}>
                  <Icons.crown size={14} />
                  {PLANS[currentPlan]?.name || 'Free'} Plan
                </span>
              </div>
            </div>
            
            {/* Quick Sign Out Button */}
            <button onClick={handleSignOut} className={styles.headerSignOut}>
              <Icons.logout size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className={styles.container}>

        {/* Quick Stats */}
        <div className={styles.statsRow}>
          <Link href="/garage" className={styles.statCard}>
            <div className={styles.statIcon}>
              <Icons.heart size={22} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{favoritesCount}</span>
              <span className={styles.statLabel}>Favorites</span>
            </div>
            <Icons.externalLink size={14} />
          </Link>
          <Link href="/garage/tuning-shop" className={styles.statCard}>
            <div className={styles.statIcon}>
              <Icons.wrench size={22} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{builds.length}</span>
              <span className={styles.statLabel}>Saved Builds</span>
            </div>
            <Icons.externalLink size={14} />
          </Link>
          <div className={styles.statCard} data-highlight>
            <div className={styles.statIconAl}>
              <img src={UI_IMAGES.alMascot} alt="AL" className={styles.alIconMedium} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{formatFuel(alBalance.fuel)}</span>
              <span className={styles.statLabel}>AL Fuel</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabsContainer}>
          <nav className={styles.tabs}>
            {tabs.map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon === 'al-mascot' ? (
                    <img src={UI_IMAGES.alMascot} alt="AL" className={styles.tabAlIcon} />
                  ) : (
                    <TabIcon size={18} />
                  )}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Icons.user size={20} />
                Profile Information
              </h2>
              
              <div className={styles.formGroup}>
                <label htmlFor="displayName" className={styles.label}>
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={styles.input}
                  placeholder="Enter your name"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email Address</label>
                <input
                  type="email"
                  value={user.email}
                  className={styles.input}
                  disabled
                />
                <p className={styles.inputHint}>
                  Email cannot be changed. Contact support if you need to update it.
                </p>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className={styles.saveButton}
              >
                {saveSuccess ? (
                  <>
                    <Icons.check size={18} />
                    Saved!
                  </>
                ) : isSaving ? (
                  'Saving...'
                ) : (
                  'Save Changes'
                )}
              </button>

              {/* Notification Preferences */}
              <div className={styles.profileSubsection}>
                <h3 className={styles.subsectionTitle}>
                  <Icons.bell size={18} />
                  Notification Preferences
                </h3>

                <div className={styles.notificationSettings}>
                  <div className={styles.notificationItem}>
                    <div className={styles.notificationInfo}>
                      <h4>Email Notifications</h4>
                      <p>Receive updates about your garage activity</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={notifications.email}
                        onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>

                  <div className={styles.notificationItem}>
                    <div className={styles.notificationInfo}>
                      <h4>Maintenance Reminders</h4>
                      <p>Get notified about upcoming maintenance for your vehicles</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={notifications.maintenance}
                        onChange={(e) => setNotifications({...notifications, maintenance: e.target.checked})}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>

                  <div className={styles.notificationItem}>
                    <div className={styles.notificationInfo}>
                      <h4>Newsletter</h4>
                      <p>Receive our monthly newsletter with car news and tips</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={notifications.newsletter}
                        onChange={(e) => setNotifications({...notifications, newsletter: e.target.checked})}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Your Location */}
              <div className={styles.profileSubsection}>
                <h3 className={styles.subsectionTitle}>
                  <Icons.mapPin size={18} />
                  Your Location
                </h3>
                <p className={styles.locationDescription}>
                  Set your location to receive local event recommendations and personalized AL analysis.
                </p>

                <div className={styles.locationForm}>
                  <div className={styles.locationRow}>
                    <div className={styles.locationField}>
                      <label htmlFor="zipCode" className={styles.label}>
                        ZIP Code
                      </label>
                      <input
                        id="zipCode"
                        type="text"
                        value={locationZip}
                        onChange={(e) => handleZipLookup(e.target.value.replace(/\D/g, '').slice(0, 5))}
                        className={styles.input}
                        placeholder="Enter ZIP"
                        maxLength={5}
                      />
                    </div>
                    
                    <div className={styles.locationField}>
                      <label className={styles.label}>City</label>
                      <input
                        type="text"
                        value={isLookingUpZip ? 'Looking up...' : locationCity}
                        className={styles.input}
                        disabled
                        placeholder="Auto-detected"
                      />
                    </div>
                    
                    <div className={styles.locationField} style={{ maxWidth: '80px' }}>
                      <label className={styles.label}>State</label>
                      <input
                        type="text"
                        value={locationState}
                        className={styles.input}
                        disabled
                        placeholder="--"
                      />
                    </div>
                  </div>
                  
                  {locationError && (
                    <p className={styles.locationError}>{locationError}</p>
                  )}
                  
                  <div className={styles.locationActions}>
                    <button
                      onClick={handleSaveLocation}
                      disabled={isSavingLocation || !locationZip}
                      className={styles.saveButton}
                    >
                      {locationSaveSuccess ? (
                        <>
                          <Icons.check size={18} />
                          Saved!
                        </>
                      ) : isSavingLocation ? (
                        'Saving...'
                      ) : (
                        'Save Location'
                      )}
                    </button>
                    
                    {(locationZip || profile?.location_zip) && (
                      <button
                        onClick={handleClearLocation}
                        disabled={isSavingLocation}
                        className={styles.clearLocationButton}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  
                  <p className={styles.inputHint}>
                    Your location is used to recommend local car events and for personalized garage analysis. 
                    We never share your exact location.
                  </p>
                </div>
              </div>

              {/* Connected Accounts */}
              <div className={styles.profileSubsection}>
                <h3 className={styles.subsectionTitle}>
                  <Icons.shield size={18} />
                  Connected Accounts
                </h3>
                <div className={styles.connectedAccounts}>
                  {user?.app_metadata?.provider === 'google' && (
                    <div className={styles.connectedAccount}>
                      <span>Google</span>
                      <span className={styles.connectedBadge}>Connected</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Replay Onboarding */}
              <div className={styles.profileSubsection}>
                <h3 className={styles.subsectionTitle}>
                  <Icons.play size={18} />
                  App Tour
                </h3>
                <p className={styles.locationDescription}>
                  Missed something or want a refresher? Replay the AutoRev tour to discover all the features.
                </p>
                <button
                  onClick={triggerOnboarding}
                  className={styles.onboardingButton}
                >
                  <Icons.refresh size={18} />
                  Replay App Tour
                </button>
              </div>
            </section>
          )}

          {/* Referrals Tab */}
          {activeTab === 'referrals' && (
            <section className={styles.section}>
              <ReferralPanel userId={user?.id} />
            </section>
          )}

          {/* AL Fuel Tab */}
          {activeTab === 'al' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <img src={UI_IMAGES.alMascot} alt="AL" className={styles.alIconSmall} />
                AL Fuel
              </h2>
              
              <p className={styles.sectionDescription}>
                Fuel powers your conversations with AL. Simple questions use less, detailed research uses more.
              </p>

              {/* Fuel Tank Visualization */}
              <div className={styles.gasTankContainer}>
                <div className={styles.gasTankCard}>
                  <div className={styles.gasTankHeader}>
                    <img src={UI_IMAGES.alMascot} alt="AL" className={styles.alIconMedium} />
                    <span>{alBalance.tank?.label || 'Your Tank'}</span>
                  </div>
                  
                  <div className={styles.gasTankMeter}>
                    <div 
                      className={styles.gasTankFill}
                      style={{ 
                        width: `${alBalance.tank?.percentage || 0}%`,
                        backgroundColor: alBalance.tank?.status?.color || '#22c55e',
                      }}
                    />
                    <div className={styles.gasTankMarkers}>
                      <span>E</span>
                      <span>¼</span>
                      <span>½</span>
                      <span>¾</span>
                      <span>F</span>
                    </div>
                  </div>
                  
                  <div className={styles.gasTankStats}>
                    <div className={styles.gasTankStat}>
                      <span className={styles.gasTankValue}>{formatFuel(alBalance.fuel)}</span>
                      <span className={styles.gasTankLabel}>Fuel Available</span>
                    </div>
                    <div className={styles.gasTankStat}>
                      <span className={styles.gasTankValue}>{formatFuel(alBalance.spentFuel)}</span>
                      <span className={styles.gasTankLabel}>Used This Month</span>
                    </div>
                    <div className={styles.gasTankStat}>
                      <span className={styles.gasTankValue}>{formatFuel(alBalance.monthlyFuel)}</span>
                      <span className={styles.gasTankLabel}>Monthly Refill</span>
                    </div>
                  </div>
                  
                  <div className={styles.gasTankStatus}>
                    <span 
                      className={styles.statusIndicator}
                      style={{ backgroundColor: alBalance.tank?.status?.color }}
                    />
                    {alBalance.tank?.status?.label} - {alBalance.tank?.percentage}%
                    {alBalance.messagesThisMonth > 0 && (
                      <span style={{ marginLeft: '8px', opacity: 0.7 }}>
                        • {alBalance.messagesThisMonth} chat{alBalance.messagesThisMonth !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* How Fuel Works */}
              <div className={styles.creditInfo}>
                <h3>Fuel Usage</h3>
                <div className={styles.creditInfoGrid}>
                  <div className={styles.creditInfoItem}>
                    <Icons.zap size={16} />
                    <div>
                      <strong>1-2 fuel</strong>
                      <p>Quick questions</p>
                    </div>
                  </div>
                  <div className={styles.creditInfoItem}>
                    <Icons.zap size={16} />
                    <div>
                      <strong>2-4 fuel</strong>
                      <p>Car comparisons</p>
                    </div>
                  </div>
                  <div className={styles.creditInfoItem}>
                    <Icons.zap size={16} />
                    <div>
                      <strong>4-8 fuel</strong>
                      <p>Deep research</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Up Fuel - Hide for unlimited users */}
              {!alBalance.isUnlimited && (
                <div className={styles.purchaseSection}>
                  <h3>
                    <Icons.plus size={18} />
                    Top Up Fuel
                  </h3>
                  
                  <div className={styles.creditPackages}>
                    {AL_TOPUP_PACKAGES.map(pkg => (
                      <div 
                        key={pkg.id} 
                        className={`${styles.creditPackage} ${pkg.popular ? styles.creditPackagePopular : ''}`}
                      >
                        {pkg.popular && <span className={styles.popularTag}>Popular</span>}
                        {pkg.savings && <span className={styles.savingsTag}>{pkg.savings}</span>}
                        
                        <div className={styles.packageName}>{pkg.label}</div>
                        <div className={styles.packageCredits}>{pkg.cents} fuel</div>
                        <div className={styles.packagePrice}>${pkg.price.toFixed(2)}</div>
                        <p className={styles.packageDescription}>{pkg.description}</p>
                        
                        <button
                          className={styles.purchaseButton}
                          onClick={() => handlePurchaseTopup(pkg.id)}
                          disabled={checkoutLoading}
                        >
                          {checkoutLoading ? '...' : 'Buy'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plan Upgrade Prompt - Hide for unlimited users */}
              {currentPlan === 'free' && !alBalance.isUnlimited && (
                <div className={styles.upgradePrompt}>
                  <img src={UI_IMAGES.alMascot} alt="AL" className={styles.alIconMedium} />
                  <div>
                    <h4>Want More Monthly Fuel?</h4>
                    <p>Upgrade for 4x or 10x more fuel each month.</p>
                  </div>
                  <button 
                    className={styles.upgradeButton}
                    onClick={() => setActiveTab('subscription')}
                  >
                    View Plans
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Icons.crown size={20} />
                Subscription Plans
              </h2>
              
              <p className={styles.sectionDescription}>
                Choose the plan that fits your automotive journey. Upgrade anytime to unlock more features.
              </p>

              {/* Beta Banner / Billing Status */}
              {IS_BETA ? (
                <div className={styles.betaBanner}>
                  <Icons.sparkle size={20} />
                  <div>
                    <h3>Beta Period - All Features Free!</h3>
                    <p>During our beta, all subscription tiers are free. After beta ends, you&apos;ll be notified before any charges begin.</p>
                    <p style={{ marginTop: '8px', opacity: 0.8 }}>
                      Current tier: <strong>{PLANS[currentPlan]?.name || 'Free'}</strong>
                      {PLANS[currentPlan]?.futurePrice && ` (Will be ${PLANS[currentPlan].futurePrice} after beta)`}
                    </p>
                  </div>
                </div>
              ) : profile?.stripe_customer_id && (
                <div className={styles.billingStatusCard}>
                  <div className={styles.billingInfo}>
                    <h3>Subscription Status</h3>
                    <p className={styles.subscriptionStatus}>
                      <span className={styles.statusBadge} data-status={profile?.stripe_subscription_status || 'none'}>
                        {profile?.stripe_subscription_status === 'active' ? '✓ Active' : 
                         profile?.stripe_subscription_status === 'canceled' ? '✗ Canceled' :
                         profile?.stripe_subscription_status || 'None'}
                      </span>
                    </p>
                    {profile?.subscription_ends_at && (
                      <p className={styles.billingDate}>
                        {profile?.stripe_subscription_status === 'canceled' ? 'Access ends: ' : 'Renews: '}
                        {new Date(profile.subscription_ends_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                  <button 
                    className={styles.updateButton}
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/billing/portal', { method: 'POST' });
                        const data = await res.json();
                        if (data.url) {
                          window.location.href = data.url;
                        } else {
                          alert(data.error || 'Failed to open billing portal');
                        }
                      } catch (err) {
                        alert('Failed to open billing portal');
                      }
                    }}
                  >
                    Manage Billing
                  </button>
                </div>
              )}

              {/* Billing Management Section */}
              {profile?.stripe_customer_id && (
                <div className={styles.billingManagement}>
                  <div className={styles.billingManagementInfo}>
                    <Icons.creditCard size={20} />
                    <div>
                      <h4>Payment & Billing</h4>
                      <p>Update payment method, view invoices, or manage your subscription</p>
                    </div>
                  </div>
                  <button 
                    className={styles.manageBillingButton}
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/billing/portal', { method: 'POST' });
                        const data = await res.json();
                        if (data.url) {
                          window.location.href = data.url;
                        } else {
                          alert(data.error || 'Failed to open billing portal');
                        }
                      } catch (err) {
                        alert('Failed to open billing portal');
                      }
                    }}
                  >
                    <Icons.externalLink size={16} />
                    Manage in Stripe
                  </button>
                </div>
              )}

              <div className={styles.plansGrid}>
                {Object.values(PLANS).map((plan, index) => (
                  <div 
                    key={plan.id} 
                    className={`${styles.planCard} ${currentPlan === plan.id ? styles.planCardCurrent : ''} ${plan.popular ? styles.planCardPopular : ''}`}
                  >
                    {plan.popular && <span className={styles.popularBadge}>Most Popular</span>}
                    {currentPlan === plan.id && <span className={styles.currentBadge}>Current Plan</span>}
                    
                    <h3 className={styles.planName}>{plan.name}</h3>
                    <div className={styles.planPrice}>
                      <span className={styles.planAmount}>
                        {plan.price === 0 ? 'Free' : `$${plan.price}`}
                      </span>
                      <span className={styles.planPeriod}>{plan.priceNote}</span>
                    </div>
                    {plan.futurePrice && (
                      <span className={styles.futurePrice}>
                        {plan.futurePrice} after beta
                      </span>
                    )}
                    
                    <ul className={styles.planFeatures}>
                      {plan.features.map((feature, i) => (
                        <li key={i}>
                          <Icons.check size={16} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    {currentPlan === plan.id ? (
                      <button className={styles.planButtonCurrent} disabled>
                        Current Plan
                      </button>
                    ) : index > Object.keys(PLANS).indexOf(currentPlan) ? (
                      <button 
                        className={styles.planButtonUpgrade}
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={checkoutLoading}
                      >
                        {checkoutLoading ? 'Processing...' : `Upgrade to ${plan.name}`}
                      </button>
                    ) : (
                      <button 
                        className={styles.planButtonDowngrade}
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={checkoutLoading}
                      >
                        {checkoutLoading ? 'Processing...' : `Switch to ${plan.name}`}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}


          {/* Your Data Tab */}
          {activeTab === 'data' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Icons.shield size={20} />
                Your Data
              </h2>
              
              <p className={styles.sectionDescription}>
                Manage the data associated with your account. You can selectively clear data while keeping your account active.
              </p>

              {/* Data Transparency */}
              <div className={styles.dataTransparency}>
                <h3>What We Store</h3>
                <div className={styles.dataInfoGrid}>
                  <div className={styles.dataInfoCard}>
                    <div className={styles.dataInfoIcon}>
                      <Icons.user size={20} />
                    </div>
                    <div>
                      <h4>Account</h4>
                      <p>Email, display name, preferences</p>
                    </div>
                  </div>
                  
                  <div className={styles.dataInfoCard}>
                    <div className={styles.dataInfoIcon}>
                      <Icons.heart size={20} />
                    </div>
                    <div>
                      <h4>Favorites</h4>
                      <p>Cars you've saved to your garage</p>
                    </div>
                  </div>
                  
                  <div className={styles.dataInfoCard}>
                    <div className={styles.dataInfoIcon}>
                      <Icons.wrench size={20} />
                    </div>
                    <div>
                      <h4>Vehicles</h4>
                      <p>Cars you own, including VIN if provided</p>
                    </div>
                  </div>
                  
                  <div className={styles.dataInfoCard}>
                    <div className={styles.dataInfoIcon}>
                      <Icons.settings size={20} />
                    </div>
                    <div>
                      <h4>Projects</h4>
                      <p>Your tuning/build configurations</p>
                    </div>
                  </div>
                  
                  <div className={styles.dataInfoCard}>
                    <div className={styles.dataInfoIcon}>
                      <Icons.bot size={20} />
                    </div>
                    <div>
                      <h4>AL Conversations</h4>
                      <p>Your chat history with our AI assistant</p>
                    </div>
                  </div>
                </div>

                <h3 style={{ marginTop: 'var(--space-xl)' }}>How We Protect It</h3>
                <ul className={styles.protectionList}>
                  <li>
                    <Icons.check size={16} />
                    All data encrypted in transit (HTTPS) and at rest
                  </li>
                  <li>
                    <Icons.check size={16} />
                    Authentication via Supabase Auth (industry standard)
                  </li>
                  <li>
                    <Icons.check size={16} />
                    We never sell your personal data
                  </li>
                  <li>
                    <Icons.check size={16} />
                    VIN data is only used for vehicle identification
                  </li>
                </ul>

                <p className={styles.privacyLink}>
                  Read our full <Link href="/privacy">Privacy Policy</Link>
                </p>
              </div>

              {/* Clear Data Actions */}
              <div className={styles.clearDataSection}>
                <h3>Clear Your Data</h3>
                <p className={styles.clearDataDescription}>
                  Remove specific data from your account. Your account will remain active.
                </p>

                <div className={styles.clearDataGrid}>
                  <div className={styles.clearDataCard}>
                    <div className={styles.clearDataInfo}>
                      <Icons.heart size={20} />
                      <div>
                        <h4>Clear Favorites</h4>
                        <p>{favoritesCount} saved car{favoritesCount !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <button
                      className={styles.clearButton}
                      onClick={() => setShowClearConfirm('favorites')}
                      disabled={clearingData === 'favorites' || favoritesCount === 0}
                    >
                      {clearingData === 'favorites' ? 'Clearing...' : 'Clear'}
                    </button>
                  </div>

                  <div className={styles.clearDataCard}>
                    <div className={styles.clearDataInfo}>
                      <Icons.wrench size={20} />
                      <div>
                        <h4>Clear Vehicles</h4>
                        <p>Owned vehicles & service logs</p>
                      </div>
                    </div>
                    <button
                      className={styles.clearButton}
                      onClick={() => setShowClearConfirm('vehicles')}
                      disabled={clearingData === 'vehicles'}
                    >
                      {clearingData === 'vehicles' ? 'Clearing...' : 'Clear'}
                    </button>
                  </div>

                  <div className={styles.clearDataCard}>
                    <div className={styles.clearDataInfo}>
                      <Icons.settings size={20} />
                      <div>
                        <h4>Clear Projects</h4>
                        <p>{builds.length} saved build{builds.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <button
                      className={styles.clearButton}
                      onClick={() => setShowClearConfirm('projects')}
                      disabled={clearingData === 'projects' || builds.length === 0}
                    >
                      {clearingData === 'projects' ? 'Clearing...' : 'Clear'}
                    </button>
                  </div>

                  <div className={styles.clearDataCard}>
                    <div className={styles.clearDataInfo}>
                      <Icons.bot size={20} />
                      <div>
                        <h4>Clear AL History</h4>
                        <p>All conversations & messages</p>
                      </div>
                    </div>
                    <button
                      className={styles.clearButton}
                      onClick={() => setShowClearConfirm('al_history')}
                      disabled={clearingData === 'al_history'}
                    >
                      {clearingData === 'al_history' ? 'Clearing...' : 'Clear'}
                    </button>
                  </div>
                </div>

                {/* Clear All */}
                <div className={styles.clearAllSection}>
                  <div className={styles.clearAllInfo}>
                    <Icons.trash size={20} />
                    <div>
                      <h4>Clear All My Data</h4>
                      <p>This removes all your saved data but keeps your account active.</p>
                    </div>
                  </div>
                  <button
                    className={styles.clearAllButton}
                    onClick={() => setShowClearConfirm('all')}
                    disabled={clearingData === 'all'}
                  >
                    {clearingData === 'all' ? 'Clearing...' : 'Clear All Data'}
                  </button>
                </div>
              </div>

              {/* Export & Account Actions */}
              <div className={styles.dataActionsSection}>
                <h3>Account Actions</h3>
                <div className={styles.dataActionsGrid}>
                  <div className={styles.dataActionCard}>
                    <div className={styles.dataActionInfo}>
                      <Icons.externalLink size={20} />
                      <div>
                        <h4>Export Data</h4>
                        <p>Download all your data</p>
                      </div>
                    </div>
                    <button className={styles.secondaryButton}>
                      Export
                    </button>
                  </div>
                </div>

                <div className={styles.dangerZone}>
                  <h4>Danger Zone</h4>
                  <div className={styles.dangerActions}>
                    <button onClick={handleSignOut} className={styles.signOutButton}>
                      <Icons.logout size={18} />
                      Sign Out
                    </button>
                    <button className={styles.deleteButton}>
                      <Icons.trash size={18} />
                      Delete Account
                    </button>
                  </div>
                  <p className={styles.dangerNote}>
                    Account deletion is permanent and cannot be undone.
                  </p>
                </div>
              </div>

              {/* Confirmation Modal */}
              {showClearConfirm && (
                <div className={styles.modalOverlay} onClick={() => setShowClearConfirm(null)}>
                  <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <h3>Confirm Data Deletion</h3>
                    <p>
                      Are you sure you want to clear your <strong>{showClearConfirm === 'all' ? 'all data' : showClearConfirm}</strong>?
                      This action cannot be undone.
                    </p>
                    <div className={styles.modalActions}>
                      <button
                        className={styles.modalCancel}
                        onClick={() => setShowClearConfirm(null)}
                      >
                        Cancel
                      </button>
                      <button
                        className={styles.modalConfirm}
                        onClick={() => handleClearData(showClearConfirm)}
                        disabled={clearingData}
                      >
                        {clearingData ? 'Clearing...' : 'Yes, Clear Data'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
