'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import styles from './page.module.css';

/**
 * Track Page - Track day experience and data logging
 * 
 * This page is for when you're AT the track or want to log/share track data:
 * - Start a track session
 * - Log lap times
 * - Upload telemetry data
 * - View track history
 * - Compare against other builds
 */

// Icons
const FlagIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);

const TimerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="13" r="8"/>
    <path d="M12 9v4l2 2"/>
    <path d="M5 3L2 6"/>
    <path d="M22 6l-3-3"/>
    <path d="M12 5V2"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const HistoryIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3v5h5"/>
    <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/>
    <path d="M12 7v5l4 2"/>
  </svg>
);

const CarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2.7-5.5c-.4-.7-1.1-1.5-2.3-1.5H11c-1.2 0-1.9.8-2.3 1.5L6 10l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/>
    <circle cx="7" cy="17" r="2"/>
    <circle cx="17" cy="17" r="2"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

// Sample track data (would come from database)
const SAMPLE_TRACKS = [
  { id: 1, name: 'Laguna Seca', location: 'Monterey, CA', length: '2.238 mi' },
  { id: 2, name: 'Road Atlanta', location: 'Braselton, GA', length: '2.54 mi' },
  { id: 3, name: 'Watkins Glen', location: 'Watkins Glen, NY', length: '3.4 mi' },
  { id: 4, name: 'Circuit of the Americas', location: 'Austin, TX', length: '3.426 mi' },
  { id: 5, name: 'Buttonwillow Raceway', location: 'Buttonwillow, CA', length: '2.05 mi' },
];

export default function TrackPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { vehicles, isLoading: vehiclesLoading } = useOwnedVehicles();
  const authModal = useAuthModal();
  
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [view, setView] = useState('home'); // 'home' | 'new-session' | 'history'
  
  // Get user's vehicles that are build-ready
  const trackReadyVehicles = useMemo(() => {
    if (!vehicles) return [];
    return vehicles.filter(v => v.vehicle);
  }, [vehicles]);
  
  // Not authenticated - show sign in prompt
  if (!authLoading && !isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <FlagIcon />
          <h2>Track Day Mode</h2>
          <p>Log lap times, upload telemetry, and compare your track performance.</p>
          <button className={styles.signInBtn} onClick={() => authModal.openSignIn()}>
            Sign In to Get Started
          </button>
        </div>
        <AuthModal 
          isOpen={authModal.isOpen} 
          onClose={authModal.close}
          defaultMode={authModal.defaultMode}
        />
      </div>
    );
  }
  
  // Loading state
  if (authLoading || vehiclesLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Track</h1>
        <p className={styles.subtitle}>Log sessions, track times, share data</p>
      </header>
      
      {/* Quick Actions */}
      <section className={styles.quickActions}>
        <button 
          className={styles.primaryAction}
          onClick={() => setView('new-session')}
        >
          <FlagIcon />
          <span>Start Track Session</span>
        </button>
      </section>
      
      {/* Feature Cards */}
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Track Features</h2>
        
        <div className={styles.featureGrid}>
          <button className={styles.featureCard} onClick={() => setView('new-session')}>
            <div className={styles.featureIcon}>
              <TimerIcon />
            </div>
            <div className={styles.featureContent}>
              <h3>Log Lap Times</h3>
              <p>Record your lap times manually or via GPS</p>
            </div>
            <ChevronRightIcon />
          </button>
          
          <button className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <UploadIcon />
            </div>
            <div className={styles.featureContent}>
              <h3>Upload Telemetry</h3>
              <p>Import data from OBD2, RaceCapture, AIM</p>
            </div>
            <span className={styles.comingSoon}>Soon</span>
          </button>
          
          <button className={styles.featureCard} onClick={() => setView('history')}>
            <div className={styles.featureIcon}>
              <HistoryIcon />
            </div>
            <div className={styles.featureContent}>
              <h3>Session History</h3>
              <p>View past sessions and track progress</p>
            </div>
            <ChevronRightIcon />
          </button>
        </div>
      </section>
      
      {/* Vehicle Selection */}
      {trackReadyVehicles.length > 0 && (
        <section className={styles.vehicleSection}>
          <h2 className={styles.sectionTitle}>Your Track Cars</h2>
          <div className={styles.vehicleList}>
            {trackReadyVehicles.map((v) => (
              <button 
                key={v.id}
                className={`${styles.vehicleCard} ${selectedVehicle?.id === v.id ? styles.vehicleSelected : ''}`}
                onClick={() => setSelectedVehicle(v)}
              >
                <div className={styles.vehicleIcon}>
                  <CarIcon />
                </div>
                <div className={styles.vehicleInfo}>
                  <span className={styles.vehicleName}>
                    {v.vehicle?.year} {v.vehicle?.make} {v.vehicle?.model}
                  </span>
                  {v.nickname && (
                    <span className={styles.vehicleNickname}>{v.nickname}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
      
      {/* Popular Tracks */}
      <section className={styles.tracksSection}>
        <h2 className={styles.sectionTitle}>Popular Tracks</h2>
        <div className={styles.trackList}>
          {SAMPLE_TRACKS.map((track) => (
            <div key={track.id} className={styles.trackItem}>
              <div className={styles.trackInfo}>
                <span className={styles.trackName}>{track.name}</span>
                <span className={styles.trackLocation}>{track.location}</span>
              </div>
              <span className={styles.trackLength}>{track.length}</span>
            </div>
          ))}
        </div>
      </section>
      
      {/* Empty state for no vehicles */}
      {trackReadyVehicles.length === 0 && (
        <section className={styles.noVehicles}>
          <CarIcon />
          <p>Add a vehicle to your garage to start logging track sessions</p>
          <a href="/garage" className={styles.addVehicleBtn}>
            <PlusIcon />
            Add Vehicle
          </a>
        </section>
      )}
      
      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={authModal.close}
        defaultMode={authModal.defaultMode}
      />
    </div>
  );
}
