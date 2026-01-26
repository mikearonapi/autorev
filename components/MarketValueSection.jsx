'use client';

/**
 * Market Value Section
 * 
 * Displays market pricing data from BaT, Hagerty, and Cars.com
 * Enthusiast tier feature - shows what your car is worth.
 * 
 * Uses React Query for cached data fetching.
 */

import React from 'react';

import { Icons } from '@/components/ui/Icons';
import { useCarMarketValue, useCarPriceByYear } from '@/hooks/useCarData';
import { formatMonthYear } from '@/lib/dateUtils';

import styles from './MarketValueSection.module.css';
import PremiumGate, { usePremiumAccess } from './PremiumGate';

/**
 * Format price as currency
 */
function formatPrice(price) {
  if (!price) return '—';
  return `$${price.toLocaleString()}`;
}

/**
 * Market Value Section Component
 */
export default function MarketValueSection({ carSlug, carName }) {
  const { hasAccess } = usePremiumAccess('marketValue');
  
  // Use React Query hooks for data fetching with caching
  const { 
    data: marketData, 
    isLoading: marketLoading, 
    error: marketError,
    refetch: refetchMarket,
  } = useCarMarketValue(carSlug, { enabled: !!carSlug });
  
  const { 
    data: priceHistoryData, 
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useCarPriceByYear(carSlug, { enabled: !!carSlug });
  
  const priceHistory = priceHistoryData?.priceHistory || [];
  const loading = marketLoading || historyLoading;
  const error = marketError?.message || null;
  
  // Refetch function for retry
  const refetchMarketData = () => {
    refetchMarket();
    refetchHistory();
  };
  
  if (loading) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Icons.dollarSign size={18} />
          <h4>Market Value</h4>
        </div>
        <div className={styles.loadingState}>
          <Icons.loader size={20} className={styles.spinner} />
          <span>Loading market data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Icons.dollarSign size={18} />
          <h4>Market Value</h4>
        </div>
        <div className={styles.errorState}>
          <Icons.info size={20} />
          <span>Unable to load market data</span>
          <button className={styles.retryButton} onClick={refetchMarketData}>
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  if (!marketData) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Icons.dollarSign size={18} />
          <h4>Market Value</h4>
        </div>
        <div className={styles.emptyState}>
          <p>No market data available yet for {carName || 'this car'}</p>
          <span className={styles.emptyHint}>Market pricing data is being added regularly</span>
        </div>
      </div>
    );
  }
  
  const trendIcon = marketData.market_trend === 'rising' ? (
    <Icons.trendingUp size={14} />
  ) : marketData.market_trend === 'falling' ? (
    <Icons.trendingDown size={14} />
  ) : null;
  
  const trendClass = marketData.market_trend === 'rising' 
    ? styles.trendUp 
    : marketData.market_trend === 'falling' 
      ? styles.trendDown 
      : styles.trendStable;
  
  return (
    <PremiumGate feature="marketValue" variant="compact">
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Icons.dollarSign size={18} />
          <h4>Market Value</h4>
          {marketData.market_trend && (
            <span className={`${styles.trendBadge} ${trendClass}`}>
              {trendIcon}
              {marketData.market_trend}
            </span>
          )}
        </div>
        
        {/* Consensus Price */}
        {marketData.consensus_price && (
          <div className={styles.consensusPrice}>
            <span className={styles.consensusLabel}>Estimated Value</span>
            <span className={styles.consensusValue}>{formatPrice(marketData.consensus_price)}</span>
            {marketData.price_confidence && (
              <span className={styles.confidenceBadge}>{marketData.price_confidence} confidence</span>
            )}
          </div>
        )}
        
        {/* Source Breakdown */}
        <div className={styles.sourcesGrid}>
          {/* BaT Auction Data */}
          {marketData.bat_avg_price && (
            <div className={styles.sourceCard}>
              <div className={styles.sourceHeader}>
                <span className={styles.sourceName}>Bring a Trailer</span>
                <span className={styles.sourceType}>Auction</span>
              </div>
              <div className={styles.sourceStats}>
                <div className={styles.sourceStat}>
                  <span className={styles.sourceStatLabel}>Average</span>
                  <span className={styles.sourceStatValue}>{formatPrice(marketData.bat_avg_price)}</span>
                </div>
                <div className={styles.sourceStat}>
                  <span className={styles.sourceStatLabel}>Range</span>
                  <span className={styles.sourceStatValue}>
                    {formatPrice(marketData.bat_min_price)} - {formatPrice(marketData.bat_max_price)}
                  </span>
                </div>
                {marketData.bat_sample_size && (
                  <div className={styles.sourceStat}>
                    <span className={styles.sourceStatLabel}>Sales</span>
                    <span className={styles.sourceStatValue}>{marketData.bat_sample_size}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Cars.com Listing Data */}
          {marketData.carscom_avg_price && (
            <div className={styles.sourceCard}>
              <div className={styles.sourceHeader}>
                <span className={styles.sourceName}>Cars.com</span>
                <span className={styles.sourceType}>Listings</span>
              </div>
              <div className={styles.sourceStats}>
                <div className={styles.sourceStat}>
                  <span className={styles.sourceStatLabel}>Average</span>
                  <span className={styles.sourceStatValue}>{formatPrice(marketData.carscom_avg_price)}</span>
                </div>
                <div className={styles.sourceStat}>
                  <span className={styles.sourceStatLabel}>Range</span>
                  <span className={styles.sourceStatValue}>
                    {formatPrice(marketData.carscom_min_price)} - {formatPrice(marketData.carscom_max_price)}
                  </span>
                </div>
                {marketData.carscom_listing_count && (
                  <div className={styles.sourceStat}>
                    <span className={styles.sourceStatLabel}>Listings</span>
                    <span className={styles.sourceStatValue}>{marketData.carscom_listing_count}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Hagerty Values */}
          {marketData.hagerty_good && (
            <div className={styles.sourceCard}>
              <div className={styles.sourceHeader}>
                <span className={styles.sourceName}>Hagerty</span>
                <span className={styles.sourceType}>Insurance Values</span>
              </div>
              <div className={styles.sourceStats}>
                <div className={styles.sourceStat}>
                  <span className={styles.sourceStatLabel}>Fair</span>
                  <span className={styles.sourceStatValue}>{formatPrice(marketData.hagerty_fair)}</span>
                </div>
                <div className={styles.sourceStat}>
                  <span className={styles.sourceStatLabel}>Good</span>
                  <span className={styles.sourceStatValue}>{formatPrice(marketData.hagerty_good)}</span>
                </div>
                <div className={styles.sourceStat}>
                  <span className={styles.sourceStatLabel}>Excellent</span>
                  <span className={styles.sourceStatValue}>{formatPrice(marketData.hagerty_excellent)}</span>
                </div>
                {marketData.hagerty_concours && (
                  <div className={styles.sourceStat}>
                    <span className={styles.sourceStatLabel}>Concours</span>
                    <span className={styles.sourceStatValue}>{formatPrice(marketData.hagerty_concours)}</span>
                  </div>
                )}
              </div>
              {marketData.hagerty_trend_percent && (
                <div className={styles.sourceFooter}>
                  <span className={`${styles.trendIndicator} ${trendClass}`}>
                    {marketData.hagerty_trend_percent > 0 ? '+' : ''}{marketData.hagerty_trend_percent}% 
                    {marketData.hagerty_trend && ` (${marketData.hagerty_trend})`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Price History Trend */}
        {priceHistory.length > 1 && (
          <div className={styles.priceHistorySection}>
            <h5 className={styles.historyTitle}>
              <Icons.trendingUp size={14} />
              Price History
            </h5>
            <div className={styles.historyList}>
              {priceHistory.slice(-6).map((point, idx) => (
                  <div key={idx} className={styles.historyPoint}>
                    <span className={styles.historyDate}>{formatMonthYear(point.recorded_at)}</span>
                    <span className={styles.historyPrice}>{formatPrice(point.avg_price)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
        
        <p className={styles.disclaimer}>
          <Icons.info size={12} />
          Values are estimates based on recent sales and listings. Actual value depends on condition, mileage, and options.
        </p>
      </div>
    </PremiumGate>
  );
}






