'use client';

/**
 * Car Detail Page Sections
 * 
 * Additional data sections for the car detail page:
 * - Fuel Economy (EPA data) - FREE
 * - Safety Ratings (NHTSA/IIHS) - FREE
 * - Price by Year (Best value years) - FREE
 * 
 * Uses React Query for caching and automatic deduplication.
 * 
 * @module components/CarDetailSections
 */

import React from 'react';

import { Icons } from '@/components/ui/Icons';
import { useCarEfficiency, useCarSafety, useCarPriceByYear } from '@/hooks/useCarData';

import styles from './CarDetailSections.module.css';

/**
 * Star rating display
 */
function StarRating({ rating, max = 5, label }) {
  const stars = [];
  for (let i = 1; i <= max; i++) {
    stars.push(
      <Icons.star key={i} size={14} filled={i <= rating} />
    );
  }
  return (
    <div className={styles.starRating}>
      <div className={styles.stars}>{stars}</div>
      {label && <span className={styles.ratingLabel}>{label}</span>}
    </div>
  );
}

/**
 * Error Alert Component for failed data loads
 */
function DataLoadError({ message, onRetry }) {
  return (
    <div className={styles.errorState}>
      <Icons.alertTriangle size={20} />
      <span>{message || 'Failed to load data'}</span>
      {onRetry && (
        <button className={styles.retryButton} onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}

/**
 * Fuel Economy Section
 * Uses React Query for caching
 */
export function FuelEconomySection({ carSlug }) {
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useCarEfficiency(carSlug);
  
  if (isLoading) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Icons.fuel size={22} />
          <h2>Fuel Economy</h2>
        </div>
        <div className={styles.loadingState}>
          <Icons.loader size={20} className={styles.spinner} />
          <span>Loading efficiency data...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Icons.fuel size={22} />
          <h2>Fuel Economy</h2>
        </div>
        <DataLoadError message="Unable to load fuel economy data" onRetry={refetch} />
      </div>
    );
  }
  
  if (!data) return null;
  
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <Icons.fuel size={22} />
        <h2>Fuel Economy</h2>
        {data.source && <span className={styles.sourceTag}>{data.source}</span>}
      </div>
      
      <div className={styles.efficiencyGrid}>
        {/* MPG Cards */}
        <div className={styles.mpgCard}>
          <span className={styles.mpgValue}>{data.city_mpg || '—'}</span>
          <span className={styles.mpgLabel}>City MPG</span>
        </div>
        <div className={styles.mpgCard}>
          <span className={styles.mpgValue}>{data.highway_mpg || '—'}</span>
          <span className={styles.mpgLabel}>Highway MPG</span>
        </div>
        <div className={`${styles.mpgCard} ${styles.mpgCardPrimary}`}>
          <span className={styles.mpgValue}>{data.combined_mpg || '—'}</span>
          <span className={styles.mpgLabel}>Combined MPG</span>
        </div>
        
        {/* Cost & Emissions */}
        {data.annual_fuel_cost && (
          <div className={styles.statCard}>
            <Icons.dollar size={18} />
            <div className={styles.statContent}>
              <span className={styles.statValue}>${data.annual_fuel_cost.toLocaleString()}</span>
              <span className={styles.statLabel}>Est. Annual Fuel Cost</span>
            </div>
          </div>
        )}
        
        {data.co2_emissions && (
          <div className={styles.statCard}>
            <Icons.leaf size={18} />
            <div className={styles.statContent}>
              <span className={styles.statValue}>{data.co2_emissions} g/mi</span>
              <span className={styles.statLabel}>CO₂ Emissions</span>
            </div>
          </div>
        )}
        
        {data.ghg_score && (
          <div className={styles.statCard}>
            <div className={`${styles.ghgScore} ${styles[`ghg${Math.min(10, Math.max(1, data.ghg_score))}`]}`}>
              {data.ghg_score}/10
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>EPA GHG Score</span>
            </div>
          </div>
        )}
      </div>
      
      {/* EV/Hybrid Info */}
      {(data.is_electric || data.is_hybrid) && (
        <div className={styles.evInfo}>
          <span className={styles.evBadge}>
            <Icons.bolt size={14} /> {data.is_electric ? 'Electric' : 'Hybrid'}
          </span>
          {data.ev_range && (
            <span className={styles.evRange}>{data.ev_range} mi electric range</span>
          )}
        </div>
      )}
      
      {data.fuel_type && (
        <p className={styles.fuelType}>Fuel Type: {data.fuel_type}</p>
      )}
    </div>
  );
}

/**
 * Safety Ratings Section
 * Uses React Query for caching
 */
export function SafetyRatingsSection({ carSlug }) {
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useCarSafety(carSlug);
  
  if (isLoading) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Icons.shield size={22} />
          <h2>Safety Ratings</h2>
        </div>
        <div className={styles.loadingState}>
          <Icons.loader size={20} className={styles.spinner} />
          <span>Loading safety data...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Icons.shield size={22} />
          <h2>Safety Ratings</h2>
        </div>
        <DataLoadError message="Unable to load safety data" onRetry={refetch} />
      </div>
    );
  }
  
  if (!data) return null;
  
  const hasNhtsa = data.nhtsa_overall_rating;
  const hasIihs = data.iihs_overall;
  
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <Icons.shield size={22} />
        <h2>Safety Ratings</h2>
        {data.safety_grade && (
          <span className={`${styles.safetyGrade} ${styles[`grade${data.safety_grade}`]}`}>
            {data.safety_grade}
          </span>
        )}
      </div>
      
      <div className={styles.safetyGrid}>
        {/* NHTSA Ratings */}
        {hasNhtsa && (
          <div className={styles.safetyCard}>
            <h4 className={styles.safetyCardTitle}>NHTSA</h4>
            <div className={styles.safetyOverall}>
              <StarRating rating={data.nhtsa_overall_rating} label="Overall" />
            </div>
            <div className={styles.safetyDetails}>
              {data.nhtsa_front_crash_rating && (
                <div className={styles.safetyRow}>
                  <span>Front Crash</span>
                  <StarRating rating={data.nhtsa_front_crash_rating} />
                </div>
              )}
              {data.nhtsa_side_crash_rating && (
                <div className={styles.safetyRow}>
                  <span>Side Crash</span>
                  <StarRating rating={data.nhtsa_side_crash_rating} />
                </div>
              )}
              {data.nhtsa_rollover_rating && (
                <div className={styles.safetyRow}>
                  <span>Rollover</span>
                  <StarRating rating={data.nhtsa_rollover_rating} />
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* IIHS Ratings */}
        {hasIihs && (
          <div className={styles.safetyCard}>
            <h4 className={styles.safetyCardTitle}>
              IIHS
              {data.iihs_top_safety_pick_plus && (
                <span className={styles.iihsBadge}>TOP SAFETY PICK+</span>
              )}
              {data.iihs_top_safety_pick && !data.iihs_top_safety_pick_plus && (
                <span className={styles.iihsBadge}>TOP SAFETY PICK</span>
              )}
            </h4>
            <div className={styles.safetyDetails}>
              {data.iihs_overall && (
                <div className={styles.safetyRow}>
                  <span>Overall</span>
                  <span className={styles.iihsRating}>{data.iihs_overall}</span>
                </div>
              )}
              {data.iihs_front_crash_prevention && (
                <div className={styles.safetyRow}>
                  <span>Crash Prevention</span>
                  <span className={styles.iihsRating}>{data.iihs_front_crash_prevention}</span>
                </div>
              )}
              {data.iihs_headlight_rating && (
                <div className={styles.safetyRow}>
                  <span>Headlights</span>
                  <span className={styles.iihsRating}>{data.iihs_headlight_rating}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Recall/Complaint Stats */}
        <div className={styles.safetyCard}>
          <h4 className={styles.safetyCardTitle}>History</h4>
          <div className={styles.safetyStats}>
            <div className={`${styles.safetyStat} ${data.recall_count > 5 ? styles.safetyStatWarn : ''}`}>
              <span className={styles.safetyStatValue}>{data.recall_count || 0}</span>
              <span className={styles.safetyStatLabel}>Recalls</span>
            </div>
            <div className={`${styles.safetyStat} ${data.complaint_count > 100 ? styles.safetyStatWarn : ''}`}>
              <span className={styles.safetyStatValue}>{data.complaint_count || 0}</span>
              <span className={styles.safetyStatLabel}>Complaints</span>
            </div>
            <div className={styles.safetyStat}>
              <span className={styles.safetyStatValue}>{data.investigation_count || 0}</span>
              <span className={styles.safetyStatLabel}>Investigations</span>
            </div>
          </div>
          
          {data.has_open_recalls && (
            <div className={styles.openRecallWarning}>
              <Icons.alertTriangle size={14} />
              <span>Has open recalls</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Price by Year Section (Best Value Years)
 * Uses React Query for caching
 */
export function PriceByYearSection({ carSlug, carName: _carName }) {
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useCarPriceByYear(carSlug);
  
  if (isLoading) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Icons.dollar size={22} />
          <h2>Price by Model Year</h2>
        </div>
        <div className={styles.loadingState}>
          <Icons.loader size={20} className={styles.spinner} />
          <span>Loading pricing data...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Icons.dollar size={22} />
          <h2>Price by Model Year</h2>
        </div>
        <DataLoadError message="Unable to load pricing data" onRetry={refetch} />
      </div>
    );
  }
  
  if (!data || !data.pricesByYear || data.pricesByYear.length === 0) return null;
  
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <Icons.dollar size={22} />
        <h2>Price by Model Year</h2>
      </div>
      
      {data.bestValueYear && (
        <div className={styles.bestValueBanner}>
          <Icons.trendingUp size={18} />
          <span>
            <strong>Best Value:</strong> {data.bestValueYear} at ~${data.bestValuePrice?.toLocaleString()}
          </span>
        </div>
      )}
      
      <div className={styles.priceTable}>
        <div className={styles.priceTableHeader}>
          <span>Year</span>
          <span>Avg Price</span>
          <span>Range</span>
          <span>Sample</span>
        </div>
        {data.pricesByYear.slice(0, 10).map((row) => (
          <div 
            key={row.model_year} 
            className={`${styles.priceTableRow} ${row.model_year === data.bestValueYear ? styles.priceTableRowBest : ''}`}
          >
            <span className={styles.priceYear}>
              {row.model_year}
              {row.model_year === data.bestValueYear && (
                <span className={styles.bestBadge}>Best Value</span>
              )}
            </span>
            <span className={styles.priceAvg}>${row.avg_price?.toLocaleString() || '—'}</span>
            <span className={styles.priceRange}>
              ${row.min_price?.toLocaleString() || '?'} - ${row.max_price?.toLocaleString() || '?'}
            </span>
            <span className={styles.priceSample}>{row.sample_size || 0} listings</span>
          </div>
        ))}
      </div>
      
      {data.pricesByYear.length > 10 && (
        <p className={styles.moreYears}>
          Showing top 10 years. {data.pricesByYear.length - 10} more available.
        </p>
      )}
    </div>
  );
}

const CarDetailSections = {
  FuelEconomySection,
  SafetyRatingsSection,
  PriceByYearSection,
};

export default CarDetailSections;
