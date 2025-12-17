'use client';

/**
 * Market Value Section
 * 
 * Displays market pricing data from BaT, Hagerty, and Cars.com
 * Collector tier feature - shows what your car is worth.
 */

import React, { useState, useEffect } from 'react';
import PremiumGate, { usePremiumAccess } from './PremiumGate';
import styles from './MarketValueSection.module.css';

// Icons
const Icons = {
  dollarSign: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  trendingUp: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  trendingDown: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
      <polyline points="17 18 23 18 23 12"/>
    </svg>
  ),
  loader: ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
    </svg>
  ),
  info: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
};

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
  const [marketData, setMarketData] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { hasAccess } = usePremiumAccess('marketValue');
  
  useEffect(() => {
    const fetchMarketData = async () => {
      if (!carSlug) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch both market value and price history in parallel
        const [marketRes, historyRes] = await Promise.all([
          fetch(`/api/cars/${carSlug}/market-value`),
          fetch(`/api/cars/${carSlug}/price-by-year`),
        ]);
        
        if (marketRes.ok) {
          const marketJson = await marketRes.json();
          setMarketData(marketJson.pricing || null);
        }
        
        if (historyRes.ok) {
          const historyJson = await historyRes.json();
          setPriceHistory(historyJson.priceHistory || []);
        }
      } catch (err) {
        console.error('[MarketValueSection] Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMarketData();
  }, [carSlug]);
  
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
  
  if (error || !marketData) {
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
              {priceHistory.slice(-6).map((point, idx) => {
                const date = new Date(point.recorded_at);
                const formattedDate = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                return (
                  <div key={idx} className={styles.historyPoint}>
                    <span className={styles.historyDate}>{formattedDate}</span>
                    <span className={styles.historyPrice}>{formatPrice(point.avg_price)}</span>
                  </div>
                );
              })}
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



