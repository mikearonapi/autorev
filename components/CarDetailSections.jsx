'use client';

/**
 * Car Detail Page Sections
 * 
 * Additional data sections for the car detail page:
 * - Fuel Economy (EPA data) - FREE
 * - Safety Ratings (NHTSA/IIHS) - FREE
 * - Price by Year (Best value years) - FREE
 */

import React, { useState, useEffect } from 'react';
import styles from './CarDetailSections.module.css';

// Icons
const Icons = {
  fuel: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>
      <path d="M15 22V10a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2"/>
      <path d="M15 14v4"/>
      <path d="M3 22h12"/>
      <path d="M7 10h4"/>
    </svg>
  ),
  shield: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  dollar: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  star: ({ size = 16, filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  check: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  alertTriangle: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  leaf: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>
  ),
  loader: ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
    </svg>
  ),
  trendingUp: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
};

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
 * Fuel Economy Section
 */
export function FuelEconomySection({ carSlug }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!carSlug) return;
      try {
        const res = await fetch(`/api/cars/${carSlug}/efficiency`);
        const json = await res.json();
        setData(json.efficiency);
      } catch (err) {
        console.error('[FuelEconomySection] Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [carSlug]);
  
  if (loading) {
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
            {data.is_electric ? '⚡ Electric' : '🔋 Hybrid'}
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
 */
export function SafetyRatingsSection({ carSlug }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!carSlug) return;
      try {
        const res = await fetch(`/api/cars/${carSlug}/safety-ratings`);
        const json = await res.json();
        setData(json.safety);
      } catch (err) {
        console.error('[SafetyRatingsSection] Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [carSlug]);
  
  if (loading) {
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
 */
export function PriceByYearSection({ carSlug, carName }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!carSlug) return;
      try {
        const res = await fetch(`/api/cars/${carSlug}/price-by-year`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('[PriceByYearSection] Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [carSlug]);
  
  if (loading) {
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

export default {
  FuelEconomySection,
  SafetyRatingsSection,
  PriceByYearSection,
};



