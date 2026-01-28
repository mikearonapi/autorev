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
 * Features:
 * - Drag-and-drop photo reordering (controls display on community build page)
 * - Fullscreen slideshow with auto-advance
 * - Hero image selection
 *
 * URL: /garage/my-photos?car=<carSlug> or ?build=<buildId>
 */

import React, { useState, useEffect, Suspense, useRef } from 'react';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

import AuthModal, { useAuthModal } from '@/components/AuthModal';
import ErrorBoundary from '@/components/ErrorBoundary';
import { MyGarageSubNav, GarageVehicleSelector } from '@/components/garage';
import ImageUploader from '@/components/ImageUploader';
import LoadingSpinner from '@/components/LoadingSpinner';
import PhotoSlideshow from '@/components/PhotoSlideshow';
import { useAuth } from '@/components/providers/AuthProvider';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import ShareBuildButton from '@/components/ShareBuildButton';
import EmptyState from '@/components/ui/EmptyState';
import { Icons } from '@/components/ui/Icons';
import { useCarsList, useCarBySlug } from '@/hooks/useCarData';
import { useCarImages } from '@/hooks/useCarImages';
import { useGarageScore } from '@/hooks/useGarageScore';
import { getCarHeroImage } from '@/lib/images';

import styles from './page.module.css';

// Dynamically import SortablePhotoGallery to avoid loading @dnd-kit on initial render
const SortablePhotoGallery = dynamic(() => import('@/components/garage/SortablePhotoGallery'), {
  loading: () => <div className={styles.loadingGallery}>Loading gallery...</div>,
  ssr: false,
});

function MyPhotosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedCar, setSelectedCar] = useState(null);
  const [currentBuildId, setCurrentBuildId] = useState(null);
  const [vehicleId, setVehicleId] = useState(null);
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const uploadSectionRef = useRef(null);

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const authModal = useAuthModal();
  const { builds, isLoading: buildsLoading } = useSavedBuilds();
  const { vehicles, updateVehicle } = useOwnedVehicles();

  // Garage score recalculation hook (uses vehicleId state set in useEffect below)
  const { recalculateScore } = useGarageScore(vehicleId);

  // Use cached cars data from React Query hook
  const { data: allCars = [] } = useCarsList();

  // Check for action=upload query param
  const actionParam = searchParams.get('action');

  // Get URL params
  const buildIdParam = searchParams.get('build');
  const carSlugParam = searchParams.get('car');

  // Fallback: fetch single car in parallel with full list
  // This provides faster data when the full list is slow or unavailable
  const carFromList = carSlugParam ? allCars.find((c) => c.slug === carSlugParam) : null;
  const { data: fallbackCar } = useCarBySlug(carSlugParam, {
    enabled: !!carSlugParam && !carFromList && !selectedCar,
  });

  // Get images for this car
  const {
    images: carImages,
    refreshImages: refreshCarImages,
    setHeroImage: setCarHeroImage,
    reorderImages: reorderCarImages,
  } = useCarImages(selectedCar?.slug, { enabled: !!selectedCar?.slug });

  // Sort images by display_order for consistent display
  const sortedImages = React.useMemo(() => {
    if (!carImages || carImages.length === 0) return [];
    return [...carImages].sort((a, b) => {
      const orderA = a.display_order || a.displayOrder || 999;
      const orderB = b.display_order || b.displayOrder || 999;
      return orderA - orderB;
    });
  }, [carImages]);

  // Handle URL params - load build or car (with fallback support)
  useEffect(() => {
    if (allCars.length > 0) {
      if (buildIdParam) {
        if (buildsLoading) return;
        const build = builds.find((b) => b.id === buildIdParam);
        if (build) {
          const car = allCars.find((c) => c.slug === build.carSlug);
          if (car) {
            setSelectedCar(car);
            setCurrentBuildId(buildIdParam);
          }
        }
      } else if (carSlugParam) {
        const car = allCars.find((c) => c.slug === carSlugParam);
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

  // Find the current vehicle for the selected car
  const currentVehicle =
    selectedCar && vehicles ? vehicles.find((v) => v.matchedCarSlug === selectedCar.slug) : null;

  // Set vehicle ID when current vehicle changes
  useEffect(() => {
    if (currentVehicle) {
      setVehicleId(currentVehicle.id);
    }
  }, [currentVehicle]);

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

  // Loading state - only block on auth and builds, NOT carsLoading
  // The fallbackCar mechanism ensures we have car data when needed
  const isLoadingBuild = buildIdParam && buildsLoading;
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
  const currentBuild = builds.find((b) => b.id === currentBuildId);

  // No car selected
  if (!selectedCar) {
    return (
      <div className={styles.page}>
        <MyGarageSubNav carSlug={carSlugParam} buildId={buildIdParam} onBack={handleBack} />
        <EmptyState
          icon={Icons.camera}
          title="Select a Vehicle"
          description="Choose a vehicle from your garage to manage photos"
          action={{ label: 'Go to My Garage', href: '/garage' }}
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
          isAuthenticated &&
          currentBuildId && (
            <ShareBuildButton
              build={currentBuild}
              vehicle={currentVehicle}
              car={selectedCar}
              existingImages={currentBuild?.uploadedImages || []}
            />
          )
        }
      />

      <GarageVehicleSelector selectedCarSlug={selectedCar.slug} buildId={currentBuildId} />

      <div className={styles.content}>
        {/* Upload Section */}
        {canUpload ? (
          <div className={styles.uploadSection} ref={uploadSectionRef}>
            <ImageUploader
              onUploadComplete={(_media) => {
                refreshCarImages();
                // Recalculate garage score after photo upload (photos_uploaded category)
                if (vehicleId) {
                  recalculateScore().catch((err) => {
                    console.warn('[MyPhotos] Score recalculation failed:', err);
                  });
                }
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

        {/* Stock Photo Management Section */}
        {selectedCar && getCarHeroImage(selectedCar) && canUpload && (
          <div className={styles.stockPhotoSection}>
            <h3 className={styles.sectionTitle}>Stock Photo</h3>
            <div className={styles.stockPhotoCard}>
              <div className={styles.stockPhotoPreview}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getCarHeroImage(selectedCar)}
                  alt={`${selectedCar.name} - Stock Photo`}
                  className={styles.stockPhotoImage}
                />
              </div>
              <div className={styles.stockPhotoInfo}>
                <p className={styles.stockPhotoDescription}>
                  {currentVehicle?.hideStockImage
                    ? 'The stock photo is hidden from your garage gallery.'
                    : sortedImages.length > 0
                      ? 'The stock photo is shown in your garage gallery alongside your uploaded photos.'
                      : 'The stock photo is shown as your primary garage image until you upload your own photos.'}
                </p>
                {sortedImages.length > 0 && (
                  <button
                    type="button"
                    className={`${styles.stockPhotoToggle} ${currentVehicle?.hideStockImage ? styles.showBtn : styles.hideBtn}`}
                    onClick={async () => {
                      const newValue = !currentVehicle?.hideStockImage;
                      try {
                        const response = await fetch(
                          `/api/users/${user?.id}/vehicles/${vehicleId}`,
                          {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ hide_stock_image: newValue }),
                          }
                        );

                        if (!response.ok) {
                          throw new Error('Failed to update stock photo visibility');
                        }

                        // Update local state via provider
                        await updateVehicle(vehicleId, { hideStockImage: newValue });
                      } catch (err) {
                        console.error('[MyPhotos] Toggle stock photo error:', err);
                      }
                    }}
                  >
                    {currentVehicle?.hideStockImage ? (
                      <>
                        <Icons.eye size={16} />
                        Show Stock Photo
                      </>
                    ) : (
                      <>
                        <Icons.eyeOff size={16} />
                        Hide Stock Photo
                      </>
                    )}
                  </button>
                )}
                {sortedImages.length === 0 && (
                  <p className={styles.stockPhotoNote}>
                    Upload your own photos to enable hiding the stock image.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Gallery Section */}
        <div className={styles.gallerySection}>
          <div className={styles.galleryHeader}>
            <h3 className={styles.sectionTitle}>Your Photos</h3>
            {sortedImages.length > 0 && (
              <button
                type="button"
                className={styles.slideshowBtn}
                onClick={() => setSlideshowOpen(true)}
                aria-label="Start slideshow"
              >
                <Icons.slideshow size={18} />
                <span>Slideshow</span>
              </button>
            )}
          </div>

          {sortedImages.length > 0 ? (
            <SortablePhotoGallery
              images={sortedImages}
              onReorder={async (newOrder) => {
                await reorderCarImages(newOrder);
              }}
              onSetPrimary={async (imageId) => {
                await setCarHeroImage(imageId);
              }}
              onDelete={
                canUpload
                  ? async (imageId) => {
                      const confirmed = window.confirm('Delete this photo? This cannot be undone.');
                      if (!confirmed) return;

                      try {
                        const response = await fetch(`/api/uploads?id=${imageId}`, {
                          method: 'DELETE',
                        });

                        if (!response.ok) {
                          throw new Error('Failed to delete image');
                        }

                        // Refresh images after successful delete
                        refreshCarImages();

                        // Recalculate garage score after photo deletion
                        if (vehicleId) {
                          recalculateScore().catch((err) => {
                            console.warn('[MyPhotos] Score recalculation failed:', err);
                          });
                        }
                      } catch (err) {
                        console.error('[MyPhotos] Delete error:', err);
                      }
                    }
                  : undefined
              }
              readOnly={!canUpload}
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

      {/* Fullscreen Slideshow */}
      <PhotoSlideshow
        images={sortedImages.filter((img) => img.media_type !== 'video')}
        isOpen={slideshowOpen}
        onClose={() => setSlideshowOpen(false)}
        interval={5000}
      />

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
