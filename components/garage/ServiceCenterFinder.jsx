'use client';

/**
 * ServiceCenterFinder Component
 * 
 * Helps users find automotive service centers near them.
 * Uses location input + Google Places API to find relevant shops.
 */

import React, { useState, useCallback } from 'react';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import ServiceCenterCard from './ServiceCenterCard';
import { Icons } from '@/components/ui/Icons';
import styles from './ServiceCenterFinder.module.css';

/**
 * Geocode a location string (ZIP code or city/state) to coordinates
 * Uses server-side geocoding API
 */
async function geocodeLocation(locationString) {
  if (!locationString || locationString.trim().length < 2) {
    return null;
  }
  
  try {
    const response = await fetch('/api/locations/geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: locationString.trim() }),
    });
    
    if (!response.ok) {
      console.warn('[ServiceCenterFinder] Geocode failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.lat && data.lng) {
      return { lat: data.lat, lng: data.lng };
    }
    
    return null;
  } catch (err) {
    console.error('[ServiceCenterFinder] Geocode error:', err);
    return null;
  }
}

/**
 * ServiceCenterFinder - Find nearby service centers
 * 
 * @param {string} carName - Vehicle name for context
 * @param {Array} buildParts - Parts to be installed (for filtering)
 * @param {function} onShopSelected - Callback when shop is selected
 * @param {boolean} hideHeader - Hide the header (when used inline with a parent header)
 */
export default function ServiceCenterFinder({
  carName,
  carMake,
  buildParts = [],
  onShopSelected,
  hideHeader = false,
}) {
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState(null);
  const [shops, setShops] = useState([]);
  const [filteredShops, setFilteredShops] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Filter/Sort state
  const [sortBy, setSortBy] = useState('relevance'); // 'relevance', 'rating', 'distance', 'reviews'
  const [minRating, setMinRating] = useState(0); // 0 = all, 4 = 4+ stars, 4.5 = 4.5+ stars
  
  // Handle location change from autocomplete
  const handleLocationChange = useCallback((value, coordinates) => {
    setLocation(value);
    
    // If coordinates are provided (from autocomplete selection), use them
    // Otherwise, clear coords so search will geocode the text
    if (coordinates?.lat && coordinates?.lng) {
      setCoords(coordinates);
    } else {
      // Clear stale coords when user types new text
      setCoords(null);
    }
  }, []);
  
  // Use browser geolocation
  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCoords(userCoords);
        setLocation('Current Location');
        
        // Search with the coordinates
        await searchShops(userCoords);
      },
      (err) => {
        console.error('[ServiceCenterFinder] Geolocation error:', err);
        setError('Unable to get your location. Please enter it manually.');
        setIsLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);
  
  // Search for shops
  const searchShops = useCallback(async (searchCoords) => {
    let coordsToUse = searchCoords || coords;
    
    // If no coords yet, try to geocode the location string
    if (!coordsToUse?.lat || !coordsToUse?.lng) {
      if (location && location.trim().length >= 2) {
        setIsLoading(true);
        setError(null);
        
        const geocoded = await geocodeLocation(location);
        if (geocoded) {
          coordsToUse = geocoded;
          setCoords(geocoded);
        } else {
          setIsLoading(false);
          setError('Unable to find that location. Please try a different city or ZIP code.');
          return;
        }
      } else {
        setError('Please enter a location or use your current location');
        return;
      }
    }
    
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      const response = await fetch('/api/service-centers/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: coordsToUse.lat,
          lng: coordsToUse.lng,
          radius: 25, // 25 miles
          carMake: carMake, // For matching shops to car brand
          includeReviews: true, // Fetch review snippets
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data = await response.json();
      setShops(data.shops || []);
      
      if (data.shops?.length === 0) {
        setError('No service centers found in your area. Try expanding your search radius.');
      }
    } catch (err) {
      console.error('[ServiceCenterFinder] Search error:', err);
      setError('Unable to search for service centers. Please try again.');
      setShops([]);
    } finally {
      setIsLoading(false);
    }
  }, [coords, location]);
  
  // Handle search button click
  const handleSearch = useCallback(() => {
    searchShops(coords);
  }, [searchShops, coords]);
  
  // Determine if search is possible (have coords OR have location string to geocode)
  const canSearch = Boolean(coords?.lat && coords?.lng) || Boolean(location && location.trim().length >= 2);
  
  // Filter categories based on build parts
  const relevantCategories = buildParts.length > 0 
    ? buildParts.map(p => p.upgradeKey?.split('-')[0]).filter(Boolean)
    : ['performance', 'exhaust', 'suspension'];
  
  // Apply filters and sorting whenever shops, filters, or sort change
  React.useEffect(() => {
    if (shops.length === 0) {
      setFilteredShops([]);
      return;
    }
    
    let result = [...shops];
    
    // Apply minimum rating filter
    if (minRating > 0) {
      result = result.filter(shop => (shop.rating || 0) >= minRating);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          // Higher rating first, then by review count
          if ((b.rating || 0) !== (a.rating || 0)) {
            return (b.rating || 0) - (a.rating || 0);
          }
          return (b.review_count || 0) - (a.review_count || 0);
          
        case 'reviews':
          // More reviews first (social proof)
          return (b.review_count || 0) - (a.review_count || 0);
          
        case 'distance':
          // Already sorted by distance from API, but recalculate
          const distA = a.distance || 999;
          const distB = b.distance || 999;
          return distA - distB;
          
        case 'relevance':
        default:
          // Relevance score from API (performance shops first)
          const scoreA = a.relevance_score || 0;
          const scoreB = b.relevance_score || 0;
          if (Math.abs(scoreA - scoreB) >= 5) {
            return scoreB - scoreA;
          }
          // Then by rating
          return (b.rating || 0) - (a.rating || 0);
      }
    });
    
    setFilteredShops(result);
  }, [shops, sortBy, minRating, coords]);
  
  return (
    <div className={styles.container}>
      {/* Header - can be hidden when used inline */}
      {!hideHeader && (
        <>
          <div className={styles.header}>
            <Icons.location size={20} />
            <h3 className={styles.title}>Find a Service Center</h3>
          </div>
          
          <p className={styles.subtitle}>
            {carName 
              ? `Find reputable shops that can work on your ${carName}`
              : 'Find reputable automotive service centers near you'
            }
          </p>
        </>
      )}
      
      {/* Search Section */}
      <div className={styles.searchSection}>
        <div className={styles.searchRow}>
          <LocationAutocomplete
            value={location}
            onChange={handleLocationChange}
            placeholder="Enter city, state or ZIP code"
            className={styles.locationInput}
            variant="dark"
          />
          <button 
            className={styles.searchBtn}
            onClick={handleSearch}
            disabled={isLoading || !canSearch}
          >
            {isLoading ? (
              <span className={styles.spinner} />
            ) : (
              <>
                <Icons.search size={16} />
                Search
              </>
            )}
          </button>
        </div>
        
        <button 
          className={styles.geolocateBtn}
          onClick={handleUseMyLocation}
          disabled={isLoading}
        >
          <Icons.target size={16} />
          Use my current location
        </button>
      </div>
      
      {/* Filter/Sort Controls - only show when we have results */}
      {!isLoading && shops.length > 0 && (
        <div className={styles.filterBar}>
          {/* Sort Dropdown */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Sort by</label>
            <select 
              className={styles.filterSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="relevance">Most Relevant</option>
              <option value="rating">Highest Rated</option>
              <option value="reviews">Most Reviewed</option>
              <option value="distance">Nearest</option>
            </select>
          </div>
          
          {/* Rating Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Min Rating</label>
            <div className={styles.ratingPills}>
              <button 
                className={`${styles.ratingPill} ${minRating === 0 ? styles.active : ''}`}
                onClick={() => setMinRating(0)}
              >
                All
              </button>
              <button 
                className={`${styles.ratingPill} ${minRating === 4 ? styles.active : ''}`}
                onClick={() => setMinRating(4)}
              >
                4+ ★
              </button>
              <button 
                className={`${styles.ratingPill} ${minRating === 4.5 ? styles.active : ''}`}
                onClick={() => setMinRating(4.5)}
              >
                4.5+ ★
              </button>
            </div>
          </div>
          
          {/* Results count */}
          <span className={styles.resultCount}>
            {filteredShops.length} of {shops.length} shops
          </span>
        </div>
      )}
      
      {/* Results */}
      <div className={styles.results}>
        {/* Error State */}
        {error && (
          <div className={styles.errorState}>
            <Icons.alertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}
        
        {/* Loading State */}
        {isLoading && (
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner} />
            <span>Searching for service centers...</span>
          </div>
        )}
        
        {/* Results List */}
        {!isLoading && filteredShops.length > 0 && (
          <div className={styles.shopList}>
            {filteredShops.map((shop, index) => (
              <ServiceCenterCard
                key={shop.place_id || index}
                shop={shop}
                userLat={coords?.lat}
                userLng={coords?.lng}
                onSelect={() => onShopSelected?.(shop)}
              />
            ))}
          </div>
        )}
        
        {/* No Results after filtering */}
        {!isLoading && hasSearched && shops.length > 0 && filteredShops.length === 0 && (
          <div className={styles.emptyState}>
            <Icons.filter size={24} />
            <span>No shops match your filters</span>
            <p>Try lowering the minimum rating or changing the sort order.</p>
            <button 
              className={styles.clearFiltersBtn}
              onClick={() => { setMinRating(0); setSortBy('relevance'); }}
            >
              Clear Filters
            </button>
          </div>
        )}
        
        {/* No Results State */}
        {!isLoading && hasSearched && shops.length === 0 && !error && (
          <div className={styles.emptyState}>
            <Icons.search size={24} />
            <span>No service centers found</span>
            <p>Try searching in a different location or expanding your radius.</p>
          </div>
        )}
        
        {/* Initial State */}
        {!isLoading && !hasSearched && !error && (
          <div className={styles.initialState}>
            <Icons.location size={32} />
            <span>Enter your location to find nearby shops</span>
            <p>We'll show you reputable automotive service centers that can help with your build.</p>
          </div>
        )}
      </div>
      
      {/* Disclaimer */}
      <p className={styles.disclaimer}>
        Shops are sourced from Google Maps. AutoRev is not affiliated with these businesses.
      </p>
    </div>
  );
}
