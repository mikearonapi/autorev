'use client';

/**
 * ServiceCenterCard Component
 * 
 * Displays a single service center/shop with:
 * - Shop name and address
 * - Rating stars and review count
 * - Distance from user
 * - Phone number
 * - Get Directions link
 */

import React from 'react';
import { Icons } from '@/components/ui/Icons';
import { calculateDistanceMiles } from '@/lib/geocodingService';
import styles from './ServiceCenterCard.module.css';

/**
 * ServiceCenterCard - Single shop display
 * 
 * @param {Object} shop - Shop data from Google Places
 * @param {number} userLat - User's latitude
 * @param {number} userLng - User's longitude
 * @param {function} onSelect - Callback when shop is selected
 */
export default function ServiceCenterCard({
  shop,
  userLat,
  userLng,
  onSelect,
}) {
  // Calculate distance if we have user coordinates and shop coordinates
  const distance = (userLat && userLng && shop.lat && shop.lng)
    ? calculateDistanceMiles(userLat, userLng, shop.lat, shop.lng)
    : null;
  
  // Format distance
  const formattedDistance = distance !== null
    ? distance < 1 
      ? `${(distance * 5280).toFixed(0)} ft`
      : `${distance.toFixed(1)} mi`
    : null;
  
  // Generate Google Maps directions URL
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(shop.address || shop.name)}&destination_place_id=${shop.place_id}`;
  
  // Generate Google Maps place URL
  const placeUrl = `https://www.google.com/maps/place/?q=place_id:${shop.place_id}`;
  
  // Generate Google Maps reviews URL (deep link to reviews tab)
  const reviewsUrl = `https://search.google.com/local/reviews?placeid=${shop.place_id}`;
  
  // Render star rating
  const renderStars = (rating) => {
    if (!rating) return null;
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <span className={styles.stars}>
        {[...Array(fullStars)].map((_, i) => (
          <StarIcon key={`full-${i}`} filled />
        ))}
        {hasHalfStar && <StarIcon half />}
        {[...Array(emptyStars)].map((_, i) => (
          <StarIcon key={`empty-${i}`} />
        ))}
      </span>
    );
  };
  
  // Performance indicators in shop name
  const PERFORMANCE_KEYWORDS = [
    'performance', 'tuning', 'racing', 'custom', 'speed', 'motorsport',
    'dyno', 'turbo', 'exhaust', 'suspension', 'fabrication', 'fab',
    'imports', 'euro', 'jdm', 'muscle', 'hot rod', 'supercharger',
    'boost', 'ecu', 'chip', 'tune', 'drift'
  ];
  
  // Check if shop is a performance shop based on name
  const isPerformanceShop = (name) => {
    const nameLower = name?.toLowerCase() || '';
    return PERFORMANCE_KEYWORDS.some(kw => nameLower.includes(kw));
  };
  
  // Get shop type label - prioritize performance shops
  const getTypeLabel = (name, types) => {
    // First check if it's a performance shop
    if (isPerformanceShop(name)) {
      return { label: 'Performance Shop', isPerformance: true };
    }
    
    if (!types || types.length === 0) {
      return { label: 'Auto Service', isPerformance: false };
    }
    
    const typeLabels = {
      'car_repair': 'Auto Repair',
      'car_dealer': 'Dealer',
      'gas_station': 'Gas Station',
      'auto_parts_store': 'Auto Parts',
      'car_wash': 'Car Wash',
    };
    
    for (const type of types) {
      if (typeLabels[type]) {
        return { label: typeLabels[type], isPerformance: false };
      }
    }
    
    return { label: 'Automotive', isPerformance: false };
  };
  
  const typeInfo = getTypeLabel(shop.name, shop.types);
  
  return (
    <div className={styles.card} onClick={onSelect}>
      {/* Main Info */}
      <div className={styles.main}>
        <div className={styles.nameRow}>
          <h4 className={styles.name}>{shop.name}</h4>
          {formattedDistance && (
            <span className={styles.distance}>{formattedDistance}</span>
          )}
        </div>
        
        <p className={styles.address}>{shop.address}</p>
        
        {/* Rating Row */}
        {shop.rating && (
          <div className={styles.ratingRow}>
            {renderStars(shop.rating)}
            <span className={styles.ratingValue}>{shop.rating.toFixed(1)}</span>
            {shop.review_count && (
              <a 
                href={reviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.reviewLink}
                onClick={(e) => e.stopPropagation()}
              >
                {shop.review_count.toLocaleString()} reviews
              </a>
            )}
          </div>
        )}
        
        {/* Type Badge */}
        <span className={`${styles.typeBadge} ${typeInfo.isPerformance ? styles.performanceBadge : ''}`}>
          {typeInfo.label}
        </span>
      </div>
      
      {/* Actions */}
      <div className={styles.actions}>
        {shop.phone && (
          <a 
            href={`tel:${shop.phone}`}
            className={styles.actionBtn}
            onClick={(e) => e.stopPropagation()}
          >
            <PhoneIcon size={16} />
            Call
          </a>
        )}
        
        <a 
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.actionBtn} ${styles.directionsBtn}`}
          onClick={(e) => e.stopPropagation()}
        >
          <NavigationIcon size={16} />
          Directions
        </a>
        
        <a 
          href={placeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.actionBtn}
          onClick={(e) => e.stopPropagation()}
          aria-label="View on Google Maps"
        >
          <Icons.externalLink size={16} />
        </a>
      </div>
    </div>
  );
}

// Star icon component
function StarIcon({ filled = false, half = false }) {
  if (half) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" className={styles.starIcon}>
        <defs>
          <linearGradient id="half-star">
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#475569" />
          </linearGradient>
        </defs>
        <path 
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
          fill="url(#half-star)"
        />
      </svg>
    );
  }
  
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" className={styles.starIcon}>
      <path 
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
        fill={filled ? '#f59e0b' : '#475569'}
      />
    </svg>
  );
}

// Phone icon
function PhoneIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}

// Navigation/directions icon
function NavigationIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11"/>
    </svg>
  );
}
