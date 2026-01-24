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

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

import styles from './page.module.css';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { MyGarageSubNav, GarageVehicleSelector } from '@/components/garage';
import { useAuth } from '@/components/providers/AuthProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import ImageUploader from '@/components/ImageUploader';
import BuildMediaGallery from '@/components/BuildMediaGallery';
import ShareBuildButton from '@/components/ShareBuildButton';
import { useCarImages } from '@/hooks/useCarImages';
import { useCarsList, useCarBySlug } from '@/hooks/useCarData';
import { Icons } from '@/components/ui/Icons';
import EmptyState from '@/components/ui/EmptyState';

function MyPhotosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedCar, setSelectedCar] = useState(null);
  const [currentBuildId, setCurrentBuildId] = useState(null);
  const [vehicleId, setVehicleId] = useState(null);
  const uploadSectionRef = useRef(null);
  
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const authModal = useAuthModal();
  const { builds, isLoading: buildsLoading } = useSavedBuilds();
  const { vehicles } = useOwnedVehicles();
  
  // Use cached cars data from React Query hook
  const { data: allCars = [], isLoading: carsLoading } = useCarsList();
  
  // Check for action=upload query param
  const actionParam = searchParams.get('action');
  
  // Get URL params
  const buildIdParam = searchParams.get('build');
  const carSlugParam = searchParams.get('car');
  
  // Fallback: fetch single car if not in list
  const { data: fallbackCar, isLoading: fallbackLoading } = useCarBySlug(carSlugParam, {
    enabled: !!carSlugParam && allCars.length === 0 && !carsLoading,
  });
  
  // Get images for this car
  const { 
    images: carImages,
    heroImageUrl,
    refreshImages: refreshCarImages,
    setHeroImage: setCarHeroImage,
    clearHeroImage: clearCarHeroImage
  } = useCarImages(selectedCar?.slug, { enabled: !!selectedCar?.slug });

  // Handle URL params - load build or car (with fallback support)
  useEffect(() => {
    if (allCars.length > 0) {
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
    } else if (fallbackCar && carSlugParam) {
      // Fallback: use directly fetched car when list is unavailable
      setSelectedCar(fallbackCar);
      setCurrentBuildId(null);
    }
  }, [buildIdParam, carSlugParam, allCars, builds, buildsLoading, fallbackCar]);

  // Find vehicle ID for this car
  useEffect(() => {
    if (selectedCar && vehicles) {
      const vehicle = vehicles.find(v => v.matchedCarSlug === selectedCar.slug);
      if (vehicle) {
        setVehicleId(vehicle.id);
      }
    }
  }, [selectedCar, vehicles]);
  
  // Handle action=upload to scroll to and highlight upload section
  useEffect(() => {
    if (actionParam === 'upload' && selectedCar && uploadSectionRef.current) {
      // Wait for content to render
      setTimeout(() => {
        uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add highlight class for visual feedback
        uploadSectionRef.current?.classList.add(styles.highlight);
        setTimeout(() => {
          uploadSectionRef.current?.classList.remove(styles.highlight);
        }, 2000);
      }, 500);
    }
  }, [actionParam, selectedCar]);

  const handleBack = () => {
    router.push('/garage');
  };

  // Loading state
  const isLoadingBuild = buildIdParam && (buildsLoading || carsLoading);
  if (authLoading || carsLoading || isLoadingBuild) {
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
        <EmptyState
          icon={Icons.camera}
          title="Select a Vehicle"
          description="Choose a vehicle from your garage to manage photos"
          action={{ label: "Go to My Garage", href: "/garage" }}
          variant="centered"
          size="lg"
        />
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
        rightAction={
          isAuthenticated && currentBuildId && (
            <ShareBuildButton
              build={currentBuild}
              vehicle={vehicles?.find(v => v.matchedCarSlug === selectedCar?.slug)}
              car={selectedCar}
              existingImages={currentBuild?.uploadedImages || []}
            />
          )
        }
      />
      
      <GarageVehicleSelector 
        selectedCarSlug={selectedCar.slug}
        buildId={currentBuildId}
      />

      <div className={styles.content}>
        {/* Upload Section */}
        {canUpload ? (
          <div className={styles.uploadSection} ref={uploadSectionRef}>
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
    <ErrorBoundary name="MyPhotosPage" featureContext="garage-my-photos">
      <Suspense fallback={<MyPhotosLoading />}>
        <MyPhotosContent />
      </Suspense>
    </ErrorBoundary>
  );
}
