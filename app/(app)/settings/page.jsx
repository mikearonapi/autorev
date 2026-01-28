'use client';

/**
 * Settings Page - Clean Single-Page Layout
 * 
 * Everything visible, well-organized sections, no accordions.
 * Key info at top, settings below.
 * 
 * Features:
 * - Avatar upload
 * - Display name
 * - Location for events
 * - Plan management
 * - Data export
 * - Notification preferences
 * - Account deletion
 * 
 * Formerly /profile - now accessed via gear icon on Dashboard.
 */

import { useState, useEffect, useRef } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';


import DeleteAccountModal from '@/components/DeleteAccountModal';
import NotificationPreferences from '@/components/NotificationPreferences';
import { useAuth } from '@/components/providers/AuthProvider';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import { 
  XIcon, 
  LogoutIcon, 
  CheckIcon, 
  CopyIcon, 
  ExternalLinkIcon, 
  GiftIcon, 
  StarIcon, 
  DownloadIcon,
  CameraIcon
} from '@/components/ui/Icons';
import { useCheckout } from '@/hooks/useCheckout';
import usePWAInstall from '@/hooks/usePWAInstall';
import { useUserCredits, useClearUserData, useZipLookup, useSaveLocation, useBillingPortal } from '@/hooks/useUserData';
import { isAdminEmail } from '@/lib/adminAccess';
import { AL_TOPUP_PACKAGES } from '@/lib/alConfig';
import { UI_IMAGES } from '@/lib/images';
import { IS_BETA, getEffectiveTier, getTrialStatus } from '@/lib/tierAccess';

import styles from './page.module.css';

const PLAN_NAMES = { free: 'Free', collector: 'Enthusiast', tuner: 'Pro', admin: 'Admin' };

/**
 * Skeleton loader that matches the settings page content shape
 * Per SOURCE_OF_TRUTH.md: "Always match the content shape"
 */
function SettingsSkeleton() {
  return (
    <div className={styles.skeleton}>
      {/* Header skeleton */}
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonAvatar} />
        <div className={styles.skeletonHeaderInfo}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonSubtitle} />
          <div className={styles.skeletonBadges}>
            <div className={styles.skeletonBadge} />
            <div className={styles.skeletonBadge} />
          </div>
        </div>
        <div className={styles.skeletonCloseBtn} />
      </div>
      
      {/* Sign out skeleton */}
      <div className={styles.skeletonSignOut} />
      
      {/* Fuel card skeleton */}
      <div className={styles.skeletonFuelCard} />
      
      {/* Referral card skeleton */}
      <div className={styles.skeletonReferralCard} />
      
      {/* Sections skeleton */}
      <div className={styles.skeletonSection} />
      <div className={styles.skeletonSection} />
      <div className={styles.skeletonSection} />
    </div>
  );
}

// Tier features for display - SIMPLIFIED MODEL (Jan 2026)
// Note: "chats" = AL responses. "conversations" = threads with multiple chats.
const TIER_FEATURES = {
  free: ['1 car in garage', 'Full garage features', 'Community & Events', '~15 AL chats/mo'],
  collector: ['3 cars in garage', 'Insights dashboard', 'Data (Dyno & Track)', '~130 AL chats/mo'],
  tuner: ['Unlimited cars', 'Everything in Enthusiast', '~350 AL chats/mo', 'Priority support'],
};

const TIER_PRICES = {
  free: { amount: 'Free', period: 'forever' },
  collector: { amount: '$9.99', period: '/month', annual: '$79/year' },
  tuner: { amount: '$19.99', period: '/month', annual: '$149/year' },
};

// Tier order for upgrade/downgrade logic
const TIER_ORDER = ['free', 'collector', 'tuner'];

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, isAuthenticated, isLoading, logout, updateProfile, triggerOnboarding } = useAuth();
  const { 
    shouldShowInstallPrompt, 
    canPromptNatively, 
    promptInstall, 
    isInstalled 
  } = usePWAInstall();
  const [showPWAModal, setShowPWAModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    if (!isLoading) {
      setLoadingTimedOut(false);
      return;
    }
    const timeout = setTimeout(() => {
      console.warn('[Settings] Loading timeout - showing content');
      setLoadingTimedOut(true);
    }, 6000);
    return () => clearTimeout(timeout);
  }, [isLoading]);
  
  // Handle PWA install
  const handleInstallApp = async () => {
    if (canPromptNatively) {
      setIsInstalling(true);
      await promptInstall();
      setIsInstalling(false);
    } else {
      // Show instructions modal (iOS, etc.)
      setShowPWAModal(true);
    }
  };
  
  // Handle account deletion success
  const handleAccountDeleted = async () => {
    // Account has been deleted, redirect to home
    // The logout will happen automatically since auth state changes
    router.push('/');
  };
  
  // Handle sign out - redirect to homepage after logout
  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('[SettingsPage] Sign out error:', error);
      // Still redirect to home even on error - user expects to be logged out
      router.push('/');
    }
  };
  const { checkoutSubscription, checkoutCredits, isLoading: checkoutLoading } = useCheckout();
  
  const [displayName, setDisplayName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [locationZip, setLocationZip] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [locationState, setLocationState] = useState('');
  const [isLookingUpZip, setIsLookingUpZip] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [showClearModal, setShowClearModal] = useState(null);
  
  // Avatar upload state
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);
  
  // Data export state
  const [isExporting, setIsExporting] = useState(false);
  
  // React Query hooks
  const { data: alBalance = { fuel: 0, isUnlimited: false } } = useUserCredits(user?.id);
  const clearUserData = useClearUserData();
  const zipLookupMutation = useZipLookup();
  const saveLocationMutation = useSaveLocation();
  const billingPortalMutation = useBillingPortal();

  // Use effective tier (considers trial status)
  const effectiveTier = getEffectiveTier(profile);
  const trialStatus = getTrialStatus(profile);
  
  // Admin users always show "Admin" regardless of subscription tier
  const userIsAdmin = isAdminEmail(user?.email);
  const planName = userIsAdmin
    ? 'Admin'
    : trialStatus 
      ? `${PLAN_NAMES[effectiveTier]} Trial`
      : PLAN_NAMES[effectiveTier] || 'Free';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/garage');
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
    else if (user?.user_metadata?.full_name) setDisplayName(user.user_metadata.full_name);
    if (profile?.location_zip) {
      setLocationZip(profile.location_zip);
      setLocationCity(profile.location_city || '');
      setLocationState(profile.location_state || '');
    }
    if (profile?.referral_code) setReferralCode(profile.referral_code);
  }, [profile, user]);

  // ============================================================================
  // AVATAR UPLOAD HANDLERS
  // ============================================================================
  
  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };
  
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a JPG, PNG, or WebP image');
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }
    
    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setIsUploadingAvatar(true);
    
    try {
      // Upload to blob storage via API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatar');
      
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const { url } = await response.json();
      
      // Update profile with new avatar URL
      const { error } = await updateProfile({ avatar_url: url });
      
      if (error) {
        throw error;
      }
      
    } catch (err) {
      console.error('[Settings] Avatar upload failed:', err);
      // Revert preview on error
      setAvatarPreview(null);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
      // Clear the input so the same file can be selected again
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  // ============================================================================
  // DATA EXPORT HANDLER
  // ============================================================================
  
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Trigger download by opening in new tab/initiating download
      const response = await fetch('/api/user/export-data?format=download');
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      // Get filename from content-disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || `autorev-data-export-${new Date().toISOString().split('T')[0]}.json`;
      
      // Create blob and download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('[Settings] Data export failed:', err);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };


  // Optimistic UI: Show success immediately, save in background
  const handleSave = async () => {
    if (!displayName.trim()) return;
    
    const previousName = profile?.display_name || '';
    const trimmedName = displayName.trim();
    
    // Optimistic: show success immediately
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    
    // Save in background
    const { error } = await updateProfile({ display_name: trimmedName });
    
    if (error) {
      // Revert on error
      setDisplayName(previousName);
      setSaveSuccess(false);
      console.error('[Settings] Failed to save display name:', error);
    }
  };

  const handleZipLookup = async (zip) => {
    setLocationZip(zip);
    if (!/^\d{5}$/.test(zip)) { setLocationCity(''); setLocationState(''); return; }
    setIsLookingUpZip(true);
    try {
      const data = await zipLookupMutation.mutateAsync({ zip });
      if (data.city) { setLocationCity(data.city); setLocationState(data.state); }
    } catch (e) { console.error(e); }
    finally { setIsLookingUpZip(false); }
  };

  // Optimistic UI: Location is already displayed, just save in background
  const handleSaveLocation = async () => {
    if (!/^\d{5}$/.test(locationZip)) return;
    
    const previousZip = profile?.location_zip || '';
    const previousCity = profile?.location_city || '';
    const previousState = profile?.location_state || '';
    
    try {
      await saveLocationMutation.mutateAsync({ zip: locationZip });
    } catch (e) {
      // Revert on error
      setLocationZip(previousZip);
      setLocationCity(previousCity);
      setLocationState(previousState);
      console.error('[Settings] Failed to save location:', e);
    }
  };

  const handleCopyReferral = () => {
    const link = `https://autorev.app/?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpgrade = async (tier) => {
    if (IS_BETA) {
      await updateProfile({ subscription_tier: tier });
      window.location.reload();
    } else {
      await checkoutSubscription(tier);
    }
  };

  const handleClearData = async (scope) => {
    try {
      await clearUserData.mutateAsync({ userId: user.id, scope });
      setShowClearModal(null);
      window.location.reload();
    } catch (e) { alert('Failed'); }
  };

  // Loading - with safety timeout to prevent stuck state
  // Using skeleton loader per SOURCE_OF_TRUTH.md guidelines
  if (isLoading && !loadingTimedOut) return <SettingsSkeleton />;
  if (!isAuthenticated || !user) return null;

  const avatarUrl = avatarPreview || profile?.avatar_url || user?.user_metadata?.avatar_url;
  const initials = (displayName || user?.email || 'U').charAt(0).toUpperCase();
  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button 
          type="button"
          onClick={handleAvatarClick} 
          className={styles.avatarButton}
          aria-label="Change profile photo"
          disabled={isUploadingAvatar}
        >
          <div className={styles.avatar}>
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" width={56} height={56} className={styles.avatarImg} />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className={styles.avatarOverlay}>
            {isUploadingAvatar ? (
              <span className={styles.avatarUploading}>...</span>
            ) : (
              <CameraIcon size={18} />
            )}
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarChange}
            className={styles.avatarInput}
            aria-hidden="true"
          />
        </button>
        <div className={styles.headerInfo}>
          <h1>{displayName || 'Settings'}</h1>
          <p>{user.email}</p>
          <div className={styles.badges}>
            {isAdminEmail(user.email) ? (
              <Link href="/admin" className={`${styles.planBadge} ${styles.adminBadgeLink}`}>
                {planName}
              </Link>
            ) : (
              <span className={styles.planBadge}>{planName}</span>
            )}
            <span className={styles.sinceBadge}>Since {memberSince}</span>
          </div>
        </div>
        <button onClick={() => router.back()} className={styles.closeBtn} aria-label="Close settings">
          <XIcon size={18} />
        </button>
      </header>

      {/* Sign Out Button - thin, above fuel card */}
      <button onClick={handleSignOut} className={styles.signOutThin}>
        <LogoutIcon size={18} />
        <span>Sign out</span>
      </button>

      {/* AL Fuel Card */}
      <section className={styles.fuelCard}>
        <div className={styles.fuelTop}>
          <Image src={UI_IMAGES.alMascot} alt="AL" width={40} height={40} className={styles.fuelAvatar} />
          <div className={styles.fuelInfo}>
            <span className={styles.fuelLabel}>AL Fuel</span>
            <span className={styles.fuelValue}>
              {alBalance.isUnlimited ? '∞' : alBalance.fuel.toLocaleString()}
              {!alBalance.isUnlimited && <span className={styles.fuelUnit}> available</span>}
            </span>
          </div>
          {alBalance.isUnlimited && <span className={styles.founderBadge}>Founder</span>}
        </div>
        {!alBalance.isUnlimited && (
          <div className={styles.fuelMeter}>
            <div className={styles.fuelFill} style={{ width: `${Math.min(100, (alBalance.fuel / 100) * 100)}%` }} />
          </div>
        )}
        {!alBalance.isUnlimited && (
          <div className={styles.topupRow}>
            {AL_TOPUP_PACKAGES.map(p => (
              <button key={p.id} onClick={() => checkoutCredits(p.id)} disabled={checkoutLoading} className={styles.topupBtn}>
                <span className={styles.topupLabel}>{p.label}</span>
                <span className={styles.topupDesc}>{p.description}</span>
                <span className={styles.topupPrice}>${p.price}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Referral Card */}
      <section className={styles.referralCard}>
        <div className={styles.referralHeader}>
          <GiftIcon size={18} />
          <span>Refer friends, both get <strong>200 fuel</strong></span>
        </div>
        <div className={styles.referralLink}>
          <span>autorev.app/?ref={referralCode || '...'}</span>
          <button onClick={handleCopyReferral} className={styles.copyBtn} aria-label={copied ? 'Copied!' : 'Copy referral link'}>
            {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
          </button>
        </div>
      </section>

      {/* Settings Sections */}
      <div className={styles.sections}>
        {/* Account */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Account</h2>
          <div className={styles.field}>
            <label htmlFor="display-name">Display Name</label>
            <div className={styles.inputRow}>
              <input 
                id="display-name"
                type="text" 
                value={displayName} 
                onChange={e => setDisplayName(e.target.value)} 
                placeholder="Your name"
                autoComplete="name"
              />
              <button onClick={handleSave} disabled={isSaving || !displayName.trim()} className={styles.inlineSaveBtn}>
                {saveSuccess ? <CheckIcon size={14} /> : 'Save'}
              </button>
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={user.email} disabled autoComplete="email" />
          </div>
        </section>

        {/* Location */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Location</h2>
          <p className={styles.sectionHint} id="location-hint">For local event recommendations</p>
          <div className={styles.locationRow}>
            <div className={styles.locationInputs}>
              <input 
                id="zip-code"
                type="text" 
                inputMode="numeric" 
                autoComplete="postal-code" 
                value={locationZip} 
                onChange={e => handleZipLookup(e.target.value.replace(/\D/g,'').slice(0,5))} 
                placeholder="ZIP" 
                maxLength={5} 
                className={styles.zipInput}
                aria-describedby="location-hint"
                aria-label="ZIP code"
              />
              <input 
                type="text" 
                value={isLookingUpZip ? '...' : (locationCity && locationState ? `${locationCity}, ${locationState}` : '')} 
                disabled 
                placeholder="City, State" 
                className={styles.cityInput}
                aria-label="City and state"
              />
            </div>
            <button onClick={handleSaveLocation} disabled={!/^\d{5}$/.test(locationZip)} className={styles.locationSaveBtn}>Save</button>
          </div>
        </section>

        {/* Plan */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Your Plan</h2>
          
          {/* Trial Banner */}
          {trialStatus && (
            <div className={styles.trialBanner}>
              <div className={styles.trialBannerContent}>
                <span className={styles.trialTag}>PRO TRIAL</span>
                <span className={styles.trialText}>
                  {trialStatus.daysRemaining} day{trialStatus.daysRemaining !== 1 ? 's' : ''} remaining
                </span>
              </div>
              <p className={styles.trialSubtext}>
                You have full Pro access. Upgrade now to keep all features!
              </p>
            </div>
          )}

          {/* Current Plan Hero */}
          <div className={styles.currentPlanHero}>
            <div className={styles.currentPlanBadge}>
              <StarIcon size={16} filled />
              <span className={styles.currentPlanLabel}>Current Plan</span>
            </div>
            <h3 className={styles.currentPlanName}>
              {trialStatus ? `${PLAN_NAMES[effectiveTier]} (Trial)` : PLAN_NAMES[effectiveTier]}
            </h3>
            {IS_BETA ? (
              <p className={styles.betaBanner}>
                <span className={styles.betaTag}>BETA</span>
                All features unlocked free during beta!
              </p>
            ) : trialStatus ? (
              <p className={styles.currentPlanPrice}>
                <span className={styles.priceAmount}>Free</span>
                <span className={styles.pricePeriod}> for {trialStatus.daysRemaining} more day{trialStatus.daysRemaining !== 1 ? 's' : ''}</span>
              </p>
            ) : (
              <p className={styles.currentPlanPrice}>
                <span className={styles.priceAmount}>{TIER_PRICES[effectiveTier]?.amount || 'Free'}</span>
                <span className={styles.pricePeriod}>{TIER_PRICES[effectiveTier]?.period || ''}</span>
              </p>
            )}
          </div>

          {/* Plan Options */}
          <div className={styles.planOptions}>
            <p className={styles.planOptionsLabel}>
              {IS_BETA ? 'Select your tier (all features free in beta):' : 'Available plans:'}
            </p>
            <div className={styles.planGrid}>
              {TIER_ORDER.map(tier => {
                const isCurrent = effectiveTier === tier;
                const tierIndex = TIER_ORDER.indexOf(tier);
                const currentIndex = TIER_ORDER.indexOf(effectiveTier);
                const isUpgrade = tierIndex > currentIndex;
                
                return (
                  <div 
                    key={tier} 
                    className={`${styles.planCard} ${isCurrent ? styles.planCardCurrent : ''}`}
                  >
                    {isCurrent && <div className={styles.yourPlanRibbon}>Your Plan</div>}
                    <span className={styles.planName}>{PLAN_NAMES[tier]}</span>
                    <span className={styles.planPrice}>
                      {TIER_PRICES[tier].amount}
                      {tier !== 'free' && <span className={styles.planPeriod}>{TIER_PRICES[tier].period}</span>}
                    </span>
                    <ul className={styles.planFeatures}>
                      {TIER_FEATURES[tier].map((feature, i) => (
                        <li key={i}><CheckIcon size={12} /> {feature}</li>
                      ))}
                    </ul>
                    {isCurrent ? (
                      <span className={styles.currentPlanTag}>
                        <CheckIcon size={12} /> Active
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleUpgrade(tier)} 
                        className={`${styles.planBtn} ${isUpgrade ? styles.planBtnUpgrade : styles.planBtnSwitch}`}
                        disabled={checkoutLoading}
                      >
                        {isUpgrade ? 'Upgrade' : 'Switch'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Billing Link */}
          {profile?.stripe_customer_id && !IS_BETA && (
            <button 
              onClick={async () => { 
                try {
                  const d = await billingPortalMutation.mutateAsync();
                  if (d.url) window.location.href = d.url;
                } catch (e) { console.error('Failed to open billing portal:', e); }
              }} 
              className={styles.billingLink}
            >
              Manage billing <ExternalLinkIcon size={14} />
            </button>
          )}
        </section>

        {/* Notifications */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Notifications</h2>
          <NotificationPreferences />
        </section>

        {/* Data & Privacy */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Data & Privacy</h2>
          
          {/* Export Data Button */}
          <button 
            onClick={handleExportData} 
            disabled={isExporting}
            className={styles.exportBtn}
          >
            <DownloadIcon size={18} />
            {isExporting ? 'Exporting...' : 'Export My Data'}
            <span className={styles.exportHint}>Download all your data as JSON</span>
          </button>
          
          <div className={styles.dataRow}>
            <button onClick={() => setShowClearModal('vehicles')} className={styles.clearBtn}>Clear garage data</button>
            <button onClick={() => setShowClearModal('al_history')} className={styles.clearBtn}>Clear AL history</button>
          </div>
          <Link href="/privacy" className={styles.privacyLink}>Privacy Policy <ExternalLinkIcon size={14} /></Link>
        </section>

        {/* App */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>App</h2>
          {/* PWA Install button - only shown when not installed */}
          {shouldShowInstallPrompt && !isInstalled && (
            <button 
              onClick={handleInstallApp} 
              className={styles.installBtn}
              disabled={isInstalling}
            >
              <DownloadIcon size={18} />
              {isInstalling ? 'Installing...' : 'Install App'}
              <span className={styles.installHint}>Add to home screen</span>
            </button>
          )}
          {isInstalled && (
            <div className={styles.installedBadge}>
              <CheckIcon size={16} /> App installed
            </div>
          )}
          <button onClick={triggerOnboarding} className={styles.tourBtn}>Relaunch Onboarding</button>
          <button onClick={() => setShowDeleteModal(true)} className={styles.deleteBtn}>Delete account</button>
        </section>
      </div>

      {/* Clear Data Modal */}
      {showClearModal && (
        <div 
          className={styles.modalOverlay} 
          onClick={() => setShowClearModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-modal-title"
        >
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 id="clear-modal-title">Clear {showClearModal === 'vehicles' ? 'Garage' : 'AL History'}?</h3>
            <p>This cannot be undone.</p>
            <div className={styles.modalBtns}>
              <button onClick={() => setShowClearModal(null)} className={styles.cancelBtn}>Cancel</button>
              <button onClick={() => handleClearData(showClearModal)} className={styles.confirmBtn}>
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        userId={user?.id}
        onDeleted={handleAccountDeleted}
      />
      
      {/* PWA Install Modal (iOS instructions) */}
      {showPWAModal && (
        <PWAInstallPrompt 
          variant="modal" 
          forceShow={true}
          onDismissed={() => setShowPWAModal(false)}
        />
      )}
    </div>
  );
}
