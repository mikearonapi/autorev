'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchCarBySlug } from '@/lib/carsClient.js';
import { getCarBySlug as getLocalCarBySlug } from '@/data/cars.js';
import PerformanceHub from '@/components/PerformanceHub';
import styles from './page.module.css';

// Icons
const ArrowLeftIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const AlertCircleIcon = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export default function CarPerformance() {
  const params = useParams();
  const slug = params.slug;
  const [car, setCar] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading Performance HUB...</p>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <AlertCircleIcon size={48} />
          <h2>{error || 'Vehicle not found'}</h2>
          <p>The vehicle you&apos;re looking for doesn&apos;t exist or couldn&apos;t be loaded.</p>
          <Link href="/performance" className={styles.backLink}>
            <ArrowLeftIcon size={18} />
            Back to Performance HUB
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PerformanceHub car={car} />
    </div>
  );
}


