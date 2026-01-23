'use client';

/**
 * Settings Page - Clean Single-Page Layout
 * 
 * Everything visible, well-organized sections, no accordions.
 * Key info at top, settings below.
 * 
 * Formerly /profile - now accessed via gear icon on Dashboard.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { UI_IMAGES } from '@/lib/images';
import styles from './page.module.css';
import { useAuth } from '@/components/providers/AuthProvider';
import { AL_PLANS, AL_TOPUP_PACKAGES } from '@/lib/alConfig';
import { useCheckout } from '@/hooks/useCheckout';
import { IS_BETA } from '@/lib/tierAccess';
import LoadingSpinner from '@/components/LoadingSpinner';
import usePWAInstall from '@/hooks/usePWAInstall';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import DeleteAccountModal from '@/components/DeleteAccountModal';
import { useUserCredits, useClearUserData, useZipLookup, useSaveLocation, useBillingPortal } from '@/hooks/useUserData';

// Compact Icons
const Icon = {
  close: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  logout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  copy: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  external: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  gift: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  star: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  install: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
};

const PLAN_NAMES = { free: 'Free', collector: 'Enthusiast', tuner: 'Tuner', admin: 'Admin' };

// Tier features for display
const TIER_FEATURES = {
  free: ['Browse car database', 'Basic garage', '25 AL chats/mo'],
  collector: ['VIN decoding', 'Service tracking', 'Maintenance reminders', '75 AL chats/mo'],
  tuner: ['Dyno data access', 'Full parts catalog', 'Build projects', '150 AL chats/mo'],
};

const TIER_PRICES = {
  free: { amount: 'Free', period: 'forever' },
  collector: { amount: '$4.99', period: '/month' },
  tuner: { amount: '$9.99', period: '/month' },
};

// Tier order for upgrade/downgrade logic
const TIER_ORDER = ['free', 'collector', 'tuner'];

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, isAuthenticated, isLoading, logout, updateProfile, triggerOnboarding } = useAuth();
  const { 
    shouldShowInstallPrompt, 
    isIOS, 
    canPromptNatively, 
    promptInstall, 
    isInstalled 
  } = usePWAInstall();
  const [showPWAModal, setShowPWAModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notifications, setNotifications] = useState({ email: true, maintenance: true });
  const [locationZip, setLocationZip] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [locationState, setLocationState] = useState('');
  const [isLookingUpZip, setIsLookingUpZip] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [showClearModal, setShowClearModal] = useState(null);
  
  // React Query hooks
  const { data: alBalance = { fuel: 0, isUnlimited: false } } = useUserCredits(user?.id);
  const clearUserData = useClearUserData();
  const zipLookupMutation = useZipLookup();
  const saveLocationMutation = useSaveLocation();
  const billingPortalMutation = useBillingPortal();

  const currentTier = profile?.subscription_tier || 'free';
  const planName = PLAN_NAMES[currentTier] || 'Free';

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


  const handleSave = async () => {
    if (!displayName.trim()) return;
    setIsSaving(true);
    const { error } = await updateProfile({ display_name: displayName.trim() });
    setIsSaving(false);
    if (!error) { setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 2000); }
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

  const handleSaveLocation = async () => {
    if (!/^\d{5}$/.test(locationZip)) return;
    try {
      await saveLocationMutation.mutateAsync({ zip: locationZip });
    } catch (e) { console.error(e); }
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

  if (isLoading) return <div className={styles.loading}><LoadingSpinner variant="branded" text="Loading" fullPage /></div>;
  if (!isAuthenticated || !user) return null;

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const initials = (displayName || user?.email || 'U').charAt(0).toUpperCase();
  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.avatar}>
          {avatarUrl ? <Image src={avatarUrl} alt="" width={56} height={56} className={styles.avatarImg} /> : <span>{initials}</span>}
        </div>
        <div className={styles.headerInfo}>
          <h1>{displayName || 'Settings'}</h1>
          <p>{user.email}</p>
          <div className={styles.badges}>
            <span className={styles.planBadge}>{planName}</span>
            <span className={styles.sinceBadge}>Since {memberSince}</span>
          </div>
        </div>
        <button onClick={() => router.back()} className={styles.closeBtn} title="Close">{Icon.close}</button>
      </header>

      {/* Sign Out Button - thin, above fuel card */}
      <button onClick={handleSignOut} className={styles.signOutThin}>
        {Icon.logout}
        <span>Sign out</span>
      </button>

      {/* AL Fuel Card */}
      <section className={styles.fuelCard}>
        <div className={styles.fuelTop}>
          <Image src={UI_IMAGES.alMascot} alt="AL" width={40} height={40} className={styles.fuelAvatar} />
          <div className={styles.fuelInfo}>
            <span className={styles.fuelLabel}>AL Fuel</span>
            <span className={styles.fuelValue}>
              {alBalance.isUnlimited ? '∞' : alBalance.fuel}
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
            {AL_TOPUP_PACKAGES.slice(0, 3).map(p => (
              <button key={p.id} onClick={() => checkoutCredits(p.id)} disabled={checkoutLoading} className={styles.topupBtn}>
                <span className={styles.topupFuel}>+{p.cents}</span>
                <span className={styles.topupPrice}>${p.price}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Referral Card */}
      <section className={styles.referralCard}>
        <div className={styles.referralHeader}>
          {Icon.gift}
          <span>Refer friends, both get <strong>200 fuel</strong></span>
        </div>
        <div className={styles.referralLink}>
          <span>autorev.app/?ref={referralCode || '...'}</span>
          <button onClick={handleCopyReferral} className={styles.copyBtn}>
            {copied ? Icon.check : Icon.copy}
          </button>
        </div>
      </section>

      {/* Settings Sections */}
      <div className={styles.sections}>
        {/* Account */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Account</h2>
          <div className={styles.field}>
            <label>Display Name</label>
            <div className={styles.inputRow}>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
              <button onClick={handleSave} disabled={isSaving || !displayName.trim()} className={styles.inlineSaveBtn}>
                {saveSuccess ? Icon.check : 'Save'}
              </button>
            </div>
          </div>
          <div className={styles.field}>
            <label>Email</label>
            <input type="email" value={user.email} disabled />
          </div>
        </section>

        {/* Notifications */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Notifications</h2>
          <div className={styles.toggleRow}>
            <span>Email updates</span>
            <label className={styles.toggle}>
              <input type="checkbox" checked={notifications.email} onChange={e => setNotifications({...notifications, email: e.target.checked})} />
              <span></span>
            </label>
          </div>
          <div className={styles.toggleRow}>
            <span>Maintenance reminders</span>
            <label className={styles.toggle}>
              <input type="checkbox" checked={notifications.maintenance} onChange={e => setNotifications({...notifications, maintenance: e.target.checked})} />
              <span></span>
            </label>
          </div>
        </section>

        {/* Location */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Location</h2>
          <p className={styles.sectionHint}>For local event recommendations</p>
          <div className={styles.locationRow}>
            <div className={styles.locationInputs}>
              <input type="text" value={locationZip} onChange={e => handleZipLookup(e.target.value.replace(/\D/g,'').slice(0,5))} placeholder="ZIP" maxLength={5} className={styles.zipInput} />
              <input type="text" value={isLookingUpZip ? '...' : (locationCity && locationState ? `${locationCity}, ${locationState}` : '')} disabled placeholder="City, State" className={styles.cityInput} />
            </div>
            <button onClick={handleSaveLocation} disabled={!/^\d{5}$/.test(locationZip)} className={styles.locationSaveBtn}>Save</button>
          </div>
        </section>

        {/* Plan */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Your Plan</h2>
          
          {/* Current Plan Hero */}
          <div className={styles.currentPlanHero}>
            <div className={styles.currentPlanBadge}>
              {Icon.star}
              <span className={styles.currentPlanLabel}>Current Plan</span>
            </div>
            <h3 className={styles.currentPlanName}>{PLAN_NAMES[currentTier]}</h3>
            {IS_BETA ? (
              <p className={styles.betaBanner}>
                <span className={styles.betaTag}>BETA</span>
                All features unlocked free during beta!
              </p>
            ) : (
              <p className={styles.currentPlanPrice}>
                <span className={styles.priceAmount}>{TIER_PRICES[currentTier].amount}</span>
                <span className={styles.pricePeriod}>{TIER_PRICES[currentTier].period}</span>
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
                const isCurrent = currentTier === tier;
                const tierIndex = TIER_ORDER.indexOf(tier);
                const currentIndex = TIER_ORDER.indexOf(currentTier);
                const isUpgrade = tierIndex > currentIndex;
                const isDowngrade = tierIndex < currentIndex;
                
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
                        <li key={i}>{Icon.check} {feature}</li>
                      ))}
                    </ul>
                    {isCurrent ? (
                      <span className={styles.currentPlanTag}>
                        {Icon.check} Active
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
              Manage billing {Icon.external}
            </button>
          )}
        </section>

        {/* Data & Privacy */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Data & Privacy</h2>
          <div className={styles.dataRow}>
            <button onClick={() => setShowClearModal('vehicles')} className={styles.clearBtn}>Clear garage data</button>
            <button onClick={() => setShowClearModal('al_history')} className={styles.clearBtn}>Clear AL history</button>
          </div>
          <Link href="/privacy" className={styles.privacyLink}>Privacy Policy {Icon.external}</Link>
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
              {Icon.install} 
              {isInstalling ? 'Installing...' : 'Install App'}
              <span className={styles.installHint}>Add to home screen</span>
            </button>
          )}
          {isInstalled && (
            <div className={styles.installedBadge}>
              {Icon.check} App installed
            </div>
          )}
          <button onClick={triggerOnboarding} className={styles.tourBtn}>Relaunch Onboarding</button>
          <button onClick={() => setShowDeleteModal(true)} className={styles.deleteBtn}>Delete account</button>
        </section>
      </div>

      {/* Clear Data Modal */}
      {showClearModal && (
        <div className={styles.modalOverlay} onClick={() => setShowClearModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Clear {showClearModal === 'vehicles' ? 'Garage' : 'AL History'}?</h3>
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
