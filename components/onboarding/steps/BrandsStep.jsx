'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';

import styles from './BrandsStep.module.css';

/**
 * Car brands we showcase - ordered by recognition/prestige
 * Logos stored in Vercel Blob (TinyPNG compressed)
 * Original source: filippofilip95/car-logos-dataset (MIT licensed)
 */
const BLOB_BASE = 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/brand-logos';

const SHOWCASE_BRANDS = [
  // Row 1 - Premium European
  { name: 'Porsche', logo: `${BLOB_BASE}/porsche.png` },
  { name: 'Ferrari', logo: `${BLOB_BASE}/ferrari.png` },
  { name: 'Lamborghini', logo: `${BLOB_BASE}/lamborghini.png` },
  { name: 'McLaren', logo: `${BLOB_BASE}/mclaren.png` },
  { name: 'Aston Martin', logo: `${BLOB_BASE}/aston-martin.png` },
  
  // Row 2 - German Performance
  { name: 'BMW', logo: `${BLOB_BASE}/bmw.png` },
  { name: 'Mercedes', logo: `${BLOB_BASE}/mercedes-benz.png` },
  { name: 'Audi', logo: `${BLOB_BASE}/audi.png` },
  { name: 'Volkswagen', logo: `${BLOB_BASE}/volkswagen.png` },
  { name: 'Alfa Romeo', logo: `${BLOB_BASE}/alfa-romeo.png` },
  
  // Row 3 - American Muscle
  { name: 'Ford', logo: `${BLOB_BASE}/ford.png` },
  { name: 'Chevrolet', logo: `${BLOB_BASE}/chevrolet.png` },
  { name: 'Dodge', logo: `${BLOB_BASE}/dodge.png` },
  { name: 'Cadillac', logo: `${BLOB_BASE}/cadillac.png` },
  { name: 'Tesla', logo: `${BLOB_BASE}/tesla.png` },
  
  // Row 4 - Japanese Performance
  { name: 'Toyota', logo: `${BLOB_BASE}/toyota.png` },
  { name: 'Nissan', logo: `${BLOB_BASE}/nissan.png` },
  { name: 'Honda', logo: `${BLOB_BASE}/honda.png` },
  { name: 'Mazda', logo: `${BLOB_BASE}/mazda.png` },
  { name: 'Subaru', logo: `${BLOB_BASE}/subaru.png` },
  
  // Row 5 - Luxury Japanese + Others
  { name: 'Lexus', logo: `${BLOB_BASE}/lexus.png` },
  { name: 'Acura', logo: `${BLOB_BASE}/acura.png` },
  { name: 'Lotus', logo: `${BLOB_BASE}/lotus.png` },
  { name: 'Maserati', logo: `${BLOB_BASE}/maserati.png` },
  { name: 'Jaguar', logo: `${BLOB_BASE}/jaguar.png` },
];

// Split brands into rows for the animated grid
const ROWS = [
  SHOWCASE_BRANDS.slice(0, 5),
  SHOWCASE_BRANDS.slice(5, 10),
  SHOWCASE_BRANDS.slice(10, 15),
  SHOWCASE_BRANDS.slice(15, 20),
  SHOWCASE_BRANDS.slice(20, 25),
];

/**
 * BrandLogo Component
 * Shows logo image with text fallback
 */
function BrandLogo({ brand }) {
  const [imageError, setImageError] = useState(false);
  
  if (imageError || !brand.logo) {
    // Fallback to styled text
    return (
      <div className={styles.brandCard}>
        <span className={styles.brandText}>{brand.name}</span>
      </div>
    );
  }
  
  return (
    <div className={styles.brandCard}>
      <Image
        src={brand.logo}
        alt={brand.name}
        width={80}
        height={80}
        className={styles.brandLogo}
        onError={() => setImageError(true)}
        unoptimized // External URLs need this
      />
    </div>
  );
}

/**
 * BrandsStep Component
 * 
 * Shows an animated grid of car brand logos to communicate
 * the breadth of coverage in AutoRev.
 * 
 * Inspired by Gravl's fitness app integrations screen.
 */
export default function BrandsStep({ className, firstName }) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Trigger animation after mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className={`${className || ''} ${styles.container}`}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span className={styles.titleAccent}>310+</span> SPORTS CARS
        </h2>
        <p className={styles.subtitle}>
          {firstName 
            ? `Deep specs, tuning data, and real owner insights — all for you, ${firstName}.`
            : 'Deep specs, tuning data, and real owner insights.'}
        </p>
      </div>
      
      {/* Animated Logo Grid */}
      <div className={`${styles.logoGrid} ${isVisible ? styles.visible : ''}`}>
        {ROWS.map((row, rowIndex) => (
          <div 
            key={rowIndex} 
            className={`${styles.logoRow} ${rowIndex % 2 === 0 ? styles.scrollLeft : styles.scrollRight}`}
            style={{ animationDelay: `${rowIndex * 0.1}s` }}
          >
            {/* Duplicate row for infinite scroll effect */}
            {[...row, ...row].map((brand, brandIndex) => (
              <BrandLogo key={`${brand.name}-${brandIndex}`} brand={brand} />
            ))}
          </div>
        ))}
        
        {/* Gradient overlays for fade effect */}
        <div className={styles.gradientLeft} />
        <div className={styles.gradientRight} />
      </div>
    </div>
  );
}
