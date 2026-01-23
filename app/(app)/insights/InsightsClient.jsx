'use client';

/**
 * InsightsClient Component
 * 
 * Personalized insights dashboard for car enthusiasts focused on:
 * - Build Progress - How are your projects coming along?
 * - Performance Gains - What have you achieved?
 * - What's Next - Recommended mods, services, actions
 * - Known Issues - What to watch out for
 * 
 * Design: Clean, actionable, mobile-first
 * Target audience: Enthusiasts who modify, track, and care about their cars
 */

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/components/providers/AuthProvider';
import Link from 'next/link';
import Image from 'next/image';
import LoadingSpinner from '@/components/LoadingSpinner';
import BuildProgressCard from './components/BuildProgressCard';
import VehicleHealthCard from './components/VehicleHealthCard';
import ActionCard from './components/ActionCard';
import InsightCard from './components/InsightCard';
import styles from './page.module.css';

// Icons
const UserIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>
  </svg>
);

const AlertIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const RocketIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
);

const CarIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/>
    <circle cx="6.5" cy="16.5" r="2.5"/>
    <circle cx="16.5" cy="16.5" r="2.5"/>
  </svg>
);

const WrenchIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const CheckCircleIcon = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const ChevronDownIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const ChevronRightIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const GarageIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20v-8l10-6 10 6v8"/>
    <path d="M4 20v-4a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4"/>
    <path d="M4 20h16"/>
  </svg>
);

const CheckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function InsightsClient() {
  const { user, profile, loading: authLoading } = useAuth();
  const [insightsData, setInsightsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('all'); // 'all' or vehicle id
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);
  
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  // Track mount state for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate dropdown position when opening
  useLayoutEffect(() => {
    if (dropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 6, // 6px gap below button
        left: rect.left,
        width: rect.width,
      });
    }
  }, [dropdownOpen]);

  // Click outside handler - now also needs to check dropdown element
  useEffect(() => {
    if (!dropdownOpen) return;
    
    function handleClickOutside(event) {
      // Check if click is outside both the wrapper and dropdown
      const dropdownEl = document.getElementById('vehicle-selector-dropdown');
      const isOutsideWrapper = wrapperRef.current && !wrapperRef.current.contains(event.target);
      const isOutsideDropdown = !dropdownEl || !dropdownEl.contains(event.target);
      
      if (isOutsideWrapper && isOutsideDropdown) {
        setDropdownOpen(false);
      }
    }
    
    // Use timeout to avoid immediate trigger
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 10);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Fetch insights data
  const fetchInsights = useCallback(async () => {
    if (!user?.id) return;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      setLoading(true);
      setError(null);
      
      // Always fetch all vehicles first, then filter on frontend
      const url = `/api/users/${user.id}/insights`;
        
      const response = await fetch(url, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to fetch insights');
      
      setInsightsData(result.data);
      setLoading(false);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setError('Loading took too long. Please try again.');
      } else {
        console.error('Insights fetch error:', err);
        setError(err.message);
      }
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setLoading(false);
      return;
    }
    fetchInsights();
  }, [user?.id, authLoading, fetchInsights]);

  // Handle feedback
  const handleFeedback = useCallback(async (insightType, insightKey, rating) => {
    if (!user?.id) return;
    
    try {
      await fetch('/api/insights/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          insightType,
          insightKey,
          carId: selectedVehicleId !== 'all' ? selectedVehicleId : null,
          rating,
        }),
      });
    } catch (err) {
      console.error('Feedback error:', err);
    }
  }, [user?.id, selectedVehicleId]);

  // Not logged in
  if (!authLoading && !user) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>Sign in to view your Insights</h2>
          <p className={styles.emptyText}>Get personalized insights about your vehicles.</p>
        </div>
      </div>
    );
  }

  // Loading
  if (loading || authLoading) {
    return (
      <LoadingSpinner 
        variant="branded" 
        text="Loading Insights" 
        subtext="Analyzing your garage..."
        fullPage 
      />
    );
  }

  // Error
  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={fetchInsights} className={styles.retryButton}>Try Again</button>
        </div>
      </div>
    );
  }

  // Get first name for personalized greeting
  const firstName = profile?.display_name?.split(' ')[0] || 
                    user?.email?.split('@')[0] || 
                    'there';

  // Extract data
  const vehicles = insightsData?.vehicles || [];
  const insights = insightsData?.insights || {};
  const summary = insightsData?.summary || {};
  
  // Filter data based on selection
  const selectedVehicle = selectedVehicleId !== 'all' 
    ? vehicles.find(v => v.id === selectedVehicleId)
    : null;
    
  const actionItems = selectedVehicle
    ? (insights.actionItems || []).filter(a => a.vehicleId === selectedVehicleId)
    : insights.actionItems || [];
    
  const buildProgress = selectedVehicle
    ? (insights.buildProgress || []).filter(b => b.vehicleId === selectedVehicleId)
    : insights.buildProgress || [];
    
  const vehicleHealth = selectedVehicle
    ? (insights.vehicleHealth || []).filter(v => v.id === selectedVehicleId)
    : insights.vehicleHealth || [];
    
  const knownIssues = insights.knownIssues || [];
  const recommendations = insights.recommendations || [];

  // Calculate summary based on selection
  // SOURCE OF TRUTH: HP gain comes from buildProgress (active build), not vehicle.total_hp_gain
  const displaySummary = selectedVehicle ? {
    // Get HP gain from buildProgress for this vehicle (computed from active build)
    totalHpGain: buildProgress.find(b => b.vehicleId === selectedVehicle.id)?.currentHpGain || 0,
    totalMods: (selectedVehicle.installed_modifications || []).length,
    activeBuilds: buildProgress.filter(b => b.status === 'in_progress').length,
    completeBuilds: buildProgress.filter(b => b.status === 'complete').length,
  } : {
    // For "All Vehicles", use the backend-computed summary (already using active builds)
    totalHpGain: summary.totalHpGain || 0,
    totalMods: summary.totalMods || 0,
    activeBuilds: buildProgress.filter(b => b.status === 'in_progress').length,
    completeBuilds: buildProgress.filter(b => b.status === 'complete').length,
  };

  // No vehicles - show empty state
  if (vehicles.length === 0) {
    return (
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>{firstName}&apos;s Insights</h1>
          </div>
          <div className={styles.headerRight}>
            <Link href="/dashboard" className={styles.profileLink} aria-label="Dashboard">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  width={36}
                  height={36}
                  className={styles.profileAvatar}
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <UserIcon size={20} />
              )}
            </Link>
          </div>
        </header>
        
        <div className={styles.emptyState}>
          <CheckCircleIcon size={48} />
          <h2 className={styles.emptyTitle}>Ready to track your garage</h2>
          <p className={styles.emptyText}>
            Once you add vehicles to your garage, you&apos;ll see personalized insights here — build progress, recommended mods, maintenance reminders, and more.
          </p>
          <Link href="/garage" className={styles.emptyLink}>
            Go to Garage <ChevronRightIcon />
          </Link>
        </div>
      </div>
    );
  }

  // Get selected vehicle name for display
  const getSelectedLabel = () => {
    if (selectedVehicleId === 'all') return 'All Vehicles';
    const v = vehicles.find(v => v.id === selectedVehicleId);
    return v ? (v.nickname || `${v.year} ${v.make} ${v.model}`) : 'All Vehicles';
  };

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <header className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>{firstName}&apos;s Insights</h1>
        </div>
        <div className={styles.headerRight}>
          <Link href="/dashboard" className={styles.profileLink} aria-label="Dashboard">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                width={36}
                height={36}
                className={styles.profileAvatar}
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <UserIcon size={20} />
            )}
          </Link>
        </div>
      </header>

      {/* Vehicle Selector */}
      <section className={styles.vehicleSelector} ref={wrapperRef}>
        <button 
          ref={buttonRef}
          type="button"
          className={styles.selectorButton}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-expanded={dropdownOpen}
          aria-haspopup="listbox"
        >
          <div className={styles.selectorLeft}>
            <GarageIcon size={18} className={styles.selectorIcon} />
            <div>
              <span className={styles.selectorLabel}>Viewing</span>
              <span className={styles.selectorValue}>{getSelectedLabel()}</span>
            </div>
          </div>
          <ChevronDownIcon size={16} className={`${styles.selectorChevron} ${dropdownOpen ? styles.open : ''}`} />
        </button>
        
        {/* Dropdown rendered via portal for reliable positioning */}
        {dropdownOpen && mounted && createPortal(
          <div 
            id="vehicle-selector-dropdown"
            className={styles.selectorDropdownPortal} 
            role="listbox"
            style={{
              position: 'fixed',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
          >
            <button
              type="button"
              role="option"
              aria-selected={selectedVehicleId === 'all'}
              className={`${styles.selectorOption} ${selectedVehicleId === 'all' ? styles.active : ''}`}
              onClick={() => { setSelectedVehicleId('all'); setDropdownOpen(false); }}
            >
              {selectedVehicleId === 'all' ? (
                <CheckIcon size={16} className={styles.selectorOptionIcon} />
              ) : (
                <GarageIcon size={16} className={styles.selectorOptionIcon} />
              )}
              <span className={styles.selectorOptionText}>All Vehicles ({vehicles.length})</span>
            </button>
            {vehicles.map(v => (
              <button
                type="button"
                role="option"
                aria-selected={selectedVehicleId === v.id}
                key={v.id}
                className={`${styles.selectorOption} ${selectedVehicleId === v.id ? styles.active : ''}`}
                onClick={() => { setSelectedVehicleId(v.id); setDropdownOpen(false); }}
              >
                {selectedVehicleId === v.id ? (
                  <CheckIcon size={16} className={styles.selectorOptionIcon} />
                ) : (
                  <CarIcon size={16} className={styles.selectorOptionIcon} />
                )}
                <span className={styles.selectorOptionText}>
                  {v.nickname || `${v.year} ${v.make} ${v.model}`}
                </span>
              </button>
            ))}
          </div>,
          document.body
        )}
      </section>

      {/* Summary Card */}
      <section className={styles.summarySection}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryStats}>
            <div className={styles.summaryStat}>
              <span className={`${styles.summaryStatValue} ${displaySummary.totalHpGain > 0 ? styles.gain : ''}`}>
                {displaySummary.totalHpGain > 0 ? `+${displaySummary.totalHpGain}` : '—'}
              </span>
              <span className={styles.summaryStatLabel}>HP Gained</span>
            </div>
            <div className={styles.summaryStat}>
              <span className={styles.summaryStatValue}>{displaySummary.totalMods}</span>
              <span className={styles.summaryStatLabel}>Mods Installed</span>
            </div>
            <div className={styles.summaryStat}>
              <span className={styles.summaryStatValue}>
                {displaySummary.completeBuilds > 0 
                  ? displaySummary.completeBuilds 
                  : displaySummary.activeBuilds > 0 
                    ? displaySummary.activeBuilds 
                    : '—'}
              </span>
              <span className={styles.summaryStatLabel}>
                {displaySummary.completeBuilds > 0 
                  ? 'Builds Complete' 
                  : displaySummary.activeBuilds > 0 
                    ? 'In Progress' 
                    : 'Builds'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Action Needed Section */}
      {actionItems.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <WrenchIcon size={18} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Action Needed</h2>
            <span className={styles.sectionCount}>{actionItems.length}</span>
          </div>
          <div className={styles.actionsList}>
            {actionItems.slice(0, 4).map((action) => (
              <ActionCard key={action.id} action={action} />
            ))}
          </div>
        </section>
      )}

      {/* Build Progress Section */}
      {buildProgress.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <RocketIcon size={18} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Build Progress</h2>
          </div>
          <div className={styles.buildsList}>
            {buildProgress.slice(0, 3).map((build) => (
              <BuildProgressCard key={build.id} build={build} />
            ))}
          </div>
        </section>
      )}

      {/* Your Vehicles Section (only show when viewing "All") */}
      {selectedVehicleId === 'all' && vehicleHealth.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <CarIcon size={18} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Your Vehicles</h2>
            <Link href="/garage" className={styles.sectionLink}>
              View All <ChevronRightIcon />
            </Link>
          </div>
          <div className={styles.vehiclesList}>
            {vehicleHealth.slice(0, 4).map((vehicle) => (
              <VehicleHealthCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        </section>
      )}

      {/* Watch Out Section - Known Issues */}
      {knownIssues.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <AlertIcon size={18} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Watch Out</h2>
            <span className={styles.sectionCount}>{knownIssues.length}</span>
          </div>
          <div className={styles.issuesList}>
            {knownIssues.slice(0, 3).map((issue, index) => (
              <InsightCard
                key={`issue-${issue.id || index}`}
                type="known_issue"
                insightKey={issue.id || `issue-${index}`}
                title={issue.title}
                description={issue.description}
                severity={issue.severity}
                carId={selectedVehicleId !== 'all' ? selectedVehicleId : null}
                onFeedback={handleFeedback}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recommendations Section */}
      {recommendations.length > 0 && selectedVehicleId !== 'all' && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <RocketIcon size={18} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Recommended Upgrades</h2>
          </div>
          <div className={styles.issuesList}>
            {recommendations.slice(0, 3).map((rec, index) => (
              <InsightCard
                key={`rec-${rec.id || index}`}
                type="recommendation"
                insightKey={rec.id || `rec-${index}`}
                title={rec.title}
                description={rec.description}
                severity="info"
                link={rec.link}
                onFeedback={handleFeedback}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Clear Message (when no action items and no builds) */}
      {actionItems.length === 0 && buildProgress.length === 0 && knownIssues.length === 0 && (
        <section className={styles.allClearSection}>
          <div className={styles.allClearContent}>
            <CheckCircleIcon size={36} />
            <div>
              <h3 className={styles.allClearTitle}>All caught up!</h3>
              <p className={styles.allClearText}>
                {selectedVehicleId === 'all' 
                  ? 'No urgent actions needed. Start a build to track your progress!'
                  : 'No issues or tasks for this vehicle.'}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
