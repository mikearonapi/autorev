/**
 * CarPerformance Page
 * 
 * Performance HUB accessed via /cars/:slug/performance
 * The car is pre-selected based on the URL slug.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { fetchCarBySlug } from '../api/carsClient.js';
import { getCarBySlug as getLocalCarBySlug } from '../data/cars.js';
import PerformanceHub from '../components/PerformanceHub';
import styles from './CarPerformance.module.css';

// Icons
const Icons = {
  arrowLeft: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  alertCircle: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

export default function CarPerformance() {
  const { slug } = useParams();
  const [car, setCar] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch car data
  useEffect(() => {
    let isMounted = true;

    async function loadCar() {
      try {
        setIsLoading(true);
        setError(null);
        const carData = await fetchCarBySlug(slug);
        
        if (isMounted) {
          if (carData) {
            setCar(carData);
          } else {
            // Try local fallback
            const localCar = getLocalCarBySlug(slug);
            if (localCar) {
              setCar(localCar);
            } else {
              setError('Vehicle not found');
            }
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[CarPerformance] Error loading car:', err);
        if (isMounted) {
          // Try local fallback
          const localCar = getLocalCarBySlug(slug);
          if (localCar) {
            setCar(localCar);
          } else {
            setError('Failed to load vehicle data');
          }
          setIsLoading(false);
        }
      }
    }

    loadCar();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading Performance HUB...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !car) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <Icons.alertCircle size={48} />
          <h2>{error || 'Vehicle not found'}</h2>
          <p>The vehicle you're looking for doesn't exist or couldn't be loaded.</p>
          <Link to="/performance" className={styles.backButton}>
            <Icons.arrowLeft size={18} />
            Browse All Cars
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Navigation Bar */}
      <div className={styles.navBar}>
        <div className={styles.navContent}>
          <Link to={`/cars/${car.slug}`} className={styles.navLink}>
            <Icons.arrowLeft size={16} />
            Back to {car.name}
          </Link>
          <span className={styles.navDivider}>|</span>
          <Link to="/performance" className={styles.navLink}>
            Select Different Car
          </Link>
        </div>
      </div>

      {/* Performance HUB */}
      <div className={styles.hubWrapper}>
        <PerformanceHub car={car} />
      </div>
    </div>
  );
}

