'use client';

/**
 * My Photos Page - Vehicle Photo Management
 * 
 * Upload and manage photos for a selected vehicle.
 * Part of the My Garage suite:
 * - Specs: Vehicle specifications
 * - Build: Configure upgrades
 * - Performance: See performance impact
 * - Parts: Research and buy parts
 * - Photos: Manage vehicle photos (this page)
 * 
 * URL: /garage/my-photos?car=<carSlug> or ?build=<buildId>
 */

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

import styles from './page.module.css';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { MyGarageSubNav, VehicleInfoBar } from '@/components/garage';
import { useAuth } from '@/components/providers/AuthProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import ImageUploader from '@/components/ImageUploader';
import BuildMediaGallery from '@/components/BuildMediaGallery';
import { useCarImages } from '@/hooks/useCarImages';
import { fetchCars } from '@/lib/carsClient';

// Icons
const Icons = {
  camera: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
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
  image: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="M21 15l-5-5L5 21"/>
    </svg>
  ),
};

// Stat component for VehicleInfoBar
function PhotoCountStat({ count }) {
  return (
    <div className={styles.statBadge}>
      <span className={styles.statValue}>{count}</span>
      <span className={styles.statLabel}>{count === 1 ? 'Photo' : 'Photos'}</span>
    </div>
  );
}

function MyPhotosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedCar, setSelectedCar] = useState(null);
  const [currentBuildId, setCurrentBuildId] = useState(null);
  const [allCars, setAllCars] = useState([]);
  const [vehicleId, setVehicleId] = useState(null);
  
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const authModal = useAuthModal();
  const { builds, isLoading: buildsLoading } = useSavedBuilds();
  const { vehicles } = useOwnedVehicles();
  
  // Get images for this car
  const { 
    images: carImages,
    heroImageUrl,
    refreshImages: refreshCarImages,
    setHeroImage: setCarHeroImage,
    clearHeroImage: clearCarHeroImage
  } = useCarImages(selectedCar?.slug, { enabled: !!selectedCar?.slug });

  // Fetch all cars
  useEffect(() => {
    let cancelled = false;
    fetchCars().then(cars => {
      if (!cancelled && Array.isArray(cars)) {
        setAllCars(cars);
      }
    });
    return () => { cancelled = true; };
  }, []);

  // Get URL params
  const buildIdParam = searchParams.get('build');
  const carSlugParam = searchParams.get('car');

  // Handle URL params - load build or car
  useEffect(() => {
    if (allCars.length === 0) return;

    if (buildIdParam) {
      if (buildsLoading) return;
      const build = builds.find(b => b.id === buildIdParam);
      if (build) {
        const car = allCars.find(c => c.slug === build.carSlug);
        if (car) {
          setSelectedCar(car);
          setCurrentBuildId(buildIdParam);
        }
      }
    } else if (carSlugParam) {
      const car = allCars.find(c => c.slug === carSlugParam);
      if (car) {
        setSelectedCar(car);
        setCurrentBuildId(null);
      }
    }
  }, [buildIdParam, carSlugParam, allCars, builds, buildsLoading]);

  // Find vehicle ID for this car
  useEffect(() => {
    if (selectedCar && vehicles) {
      const vehicle = vehicles.find(v => v.matchedCarSlug === selectedCar.slug);
      if (vehicle) {
        setVehicleId(vehicle.id);
      }
    }
  }, [selectedCar, vehicles]);

  const handleBack = () => {
    router.push('/garage');
  };

  // Loading state
  const isLoadingBuild = buildIdParam && (buildsLoading || allCars.length === 0);
  if (authLoading || isLoadingBuild) {
    return (
      <div className={styles.page}>
        <LoadingSpinner 
          variant="branded" 
          text="Loading Photos" 
          subtext="Fetching your gallery..."
          fullPage 
        />
      </div>
    );
  }

  // Get current build for display
  const currentBuild = builds.find(b => b.id === currentBuildId);
  const buildName = currentBuild?.name;

  // No car selected
  if (!selectedCar) {
    return (
      <div className={styles.page}>
        <MyGarageSubNav 
          carSlug={carSlugParam}
          buildId={buildIdParam}
          onBack={handleBack}
        />
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Icons.camera size={48} />
          </div>
          <h2 className={styles.emptyTitle}>Select a Vehicle</h2>
          <p className={styles.emptyText}>
            Choose a vehicle from your garage to manage photos
          </p>
          <Link href="/garage" className={styles.emptyAction}>
            <Icons.car size={18} />
            Go to My Garage
          </Link>
        </div>
        <AuthModal {...authModal.props} />
      </div>
    );
  }

  // Check if user is authenticated for uploads
  const canUpload = isAuthenticated && vehicleId;

  // Car selected - show photos
  return (
    <div className={styles.page}>
      <MyGarageSubNav 
        carSlug={selectedCar.slug}
        buildId={currentBuildId}
        onBack={handleBack}
      />
      
      <VehicleInfoBar
        car={selectedCar}
        buildName={buildName}
        stat={<PhotoCountStat count={carImages?.length || 0} />}
        heroImageUrl={heroImageUrl}
      />

      <div className={styles.content}>
        {/* Upload Section */}
        {canUpload ? (
          <div className={styles.uploadSection}>
            <ImageUploader
              onUploadComplete={(media) => {
                refreshCarImages();
              }}
              onUploadError={(err) => console.error('[Photos] Upload error:', err)}
              maxFiles={10}
              vehicleId={vehicleId}
              carSlug={selectedCar.slug}
              existingImages={carImages}
              showPreviews={false}
              compact={true}
            />
          </div>
        ) : (
          <div className={styles.authPrompt}>
            {!isAuthenticated ? (
              <>
                <Icons.camera size={32} />
                <p>Sign in to upload photos of your vehicle</p>
                <button 
                  className={styles.authButton}
                  onClick={() => authModal.open('Sign in to upload photos')}
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                <Icons.car size={32} />
                <p>Add this vehicle to your garage to upload photos</p>
                <Link href="/garage" className={styles.authButton}>
                  Go to Garage
                </Link>
              </>
            )}
          </div>
        )}

        {/* Gallery Section */}
        <div className={styles.gallerySection}>
          <h3 className={styles.sectionTitle}>Your Photos</h3>
          {(carImages?.length > 0 || selectedCar) ? (
            <BuildMediaGallery
              car={selectedCar}
              media={carImages || []}
              onSetPrimary={async (imageId) => {
                await setCarHeroImage(imageId);
              }}
              onSetStockHero={async () => {
                await clearCarHeroImage();
              }}
            />
          ) : (
            <div className={styles.noPhotos}>
              <Icons.image size={40} />
              <p>No photos yet</p>
              <span>Upload your first photo above</span>
            </div>
          )}
        </div>
      </div>
      
      <AuthModal {...authModal.props} />
    </div>
  );
}

function MyPhotosLoading() {
  return (
    <div className={styles.page}>
      <LoadingSpinner 
        variant="branded" 
        text="Loading Photos" 
        subtext="Fetching your gallery..."
        fullPage 
      />
    </div>
  );
}

export default function MyPhotosPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<MyPhotosLoading />}>
        <MyPhotosContent />
      </Suspense>
    </ErrorBoundary>
  );
}
