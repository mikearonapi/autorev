'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './BrandsStep.module.css';

/**
 * Car brands we showcase - ordered by recognition/prestige
 * Using free car logos from car-logos dataset (MIT licensed)
 * https://github.com/filippofilip95/car-logos-dataset
 */
const SHOWCASE_BRANDS = [
  // Row 1 - Premium European
  { name: 'Porsche', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/porsche.png' },
  { name: 'Ferrari', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/ferrari.png' },
  { name: 'Lamborghini', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/lamborghini.png' },
  { name: 'McLaren', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/mclaren.png' },
  { name: 'Aston Martin', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/aston-martin.png' },
  
  // Row 2 - German Performance
  { name: 'BMW', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/bmw.png' },
  { name: 'Mercedes', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/mercedes-benz.png' },
  { name: 'Audi', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/audi.png' },
  { name: 'Volkswagen', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/volkswagen.png' },
  { name: 'Alfa Romeo', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/alfa-romeo.png' },
  
  // Row 3 - American Muscle
  { name: 'Ford', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/ford.png' },
  { name: 'Chevrolet', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/chevrolet.png' },
  { name: 'Dodge', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/dodge.png' },
  { name: 'Cadillac', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/cadillac.png' },
  { name: 'Tesla', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/tesla.png' },
  
  // Row 4 - Japanese Performance
  { name: 'Toyota', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/toyota.png' },
  { name: 'Nissan', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/nissan.png' },
  { name: 'Honda', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/honda.png' },
  { name: 'Mazda', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/mazda.png' },
  { name: 'Subaru', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/subaru.png' },
  
  // Row 5 - Luxury Japanese + Others
  { name: 'Lexus', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/lexus.png' },
  { name: 'Acura', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/acura.png' },
  { name: 'Lotus', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/lotus.png' },
  { name: 'Maserati', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/maserati.png' },
  { name: 'Jaguar', logo: 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/jaguar.png' },
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
