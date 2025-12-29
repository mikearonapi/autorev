'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './LocationAutocomplete.module.css';

// US State name to abbreviation mapping
const STATE_ABBREVIATIONS = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC',
};

/**
 * Convert full state name to abbreviation
 */
function getStateAbbrev(stateText) {
  if (!stateText) return '';
  
  const normalized = stateText.trim().toLowerCase();
  
  // Already an abbreviation (2 chars)?
  if (normalized.length === 2) {
    return normalized.toUpperCase();
  }
  
  // Look up full name
  if (STATE_ABBREVIATIONS[normalized]) {
    return STATE_ABBREVIATIONS[normalized];
  }
  
  // Try partial match for cases like "Virginia, USA"
  const firstPart = normalized.split(',')[0].trim();
  if (STATE_ABBREVIATIONS[firstPart]) {
    return STATE_ABBREVIATIONS[firstPart];
  }
  
  return stateText; // Return original if no match
}

/**
 * Parse Google Places secondary text to extract state abbreviation
 * Google returns format like "Virginia, USA" or "CA, USA"
 */
function parseGoogleState(secondaryText) {
  if (!secondaryText) return '';
  
  // Split by comma, state is typically the first part
  const parts = secondaryText.split(',');
  if (parts.length > 0) {
    return getStateAbbrev(parts[0].trim());
  }
  return '';
}

/**
 * LocationAutocomplete Component
 * 
 * Provides a location input with Google Places Autocomplete API.
 * Falls back to OpenStreetMap Nominatim if Google Maps is not available.
 * 
 * @param {Object} props
 * @param {string} props.value - Current input value
 * @param {Function} props.onChange - Callback when value changes (value, coords)
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.className] - Additional CSS class
 */
export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = "City, State or ZIP code",
  className = '',
}) {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const debounceRef = useRef(null);

  // Sync external value with internal state
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Load Google Maps script and initialize services
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    
    if (!apiKey) {
      console.info('[LocationAutocomplete] Google Maps API key not set, using Nominatim fallback');
      setUseFallback(true);
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google?.maps?.places) {
      initGoogleServices();
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initGoogleServices();
    };
    script.onerror = () => {
      console.warn('[LocationAutocomplete] Failed to load Google Maps API, using fallback');
      setUseFallback(true);
    };
    
    if (!document.querySelector(`script[src*="maps.googleapis.com"]`)) {
      document.head.appendChild(script);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Initialize Google services
  const initGoogleServices = useCallback(() => {
    if (!window.google?.maps?.places) {
      setUseFallback(true);
      return;
    }
    
    try {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      
      const dummyElement = document.createElement('div');
      placesServiceRef.current = new window.google.maps.places.PlacesService(dummyElement);
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
      
      setGoogleLoaded(true);
    } catch (err) {
      console.warn('[LocationAutocomplete] Error initializing Google services:', err);
      setUseFallback(true);
    }
  }, []);

  // Fetch suggestions from fallback API (Nominatim)
  const fetchFallbackSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    // Don't search for pure ZIP codes
    if (/^\d{5}$/.test(query.trim())) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}&limit=6`);
      
      if (!res.ok) {
        setSuggestions([]);
        return;
      }
      
      const data = await res.json();
      
      const formattedSuggestions = (data.suggestions || []).map(s => ({
        placeId: s.placeId,
        mainText: s.city,
        secondaryText: s.state,
        fullText: s.displayName,
        county: s.county,
        lat: s.lat,
        lng: s.lng,
        isFallback: true,
      }));
      
      setSuggestions(formattedSuggestions);
    } catch (err) {
      console.error('[LocationAutocomplete] Fallback search error:', err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch suggestions from Google Places API
  const fetchGoogleSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2 || !autocompleteServiceRef.current) {
      setSuggestions([]);
      return;
    }

    // Don't use Google Places for ZIP codes
    if (/^\d{5}$/.test(query.trim())) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      const request = {
        input: query,
        types: ['(cities)'],
        componentRestrictions: { country: 'us' },
        sessionToken: sessionTokenRef.current,
      };

      autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
        setIsLoading(false);
        
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
          setSuggestions([]);
          return;
        }

        const formattedSuggestions = predictions.map(prediction => {
          const stateAbbrev = parseGoogleState(prediction.structured_formatting.secondary_text);
          
          return {
            placeId: prediction.place_id,
            mainText: prediction.structured_formatting.main_text,
            secondaryText: stateAbbrev,
            fullText: prediction.description,
            isFallback: false,
          };
        });

        setSuggestions(formattedSuggestions);
      });
    } catch (err) {
      console.error('[LocationAutocomplete] Google search error:', err);
      setIsLoading(false);
      setSuggestions([]);
    }
  }, []);

  // Debounced suggestion fetch
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!inputValue || inputValue.length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      if (useFallback || !googleLoaded) {
        fetchFallbackSuggestions(inputValue);
      } else {
        fetchGoogleSuggestions(inputValue);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputValue, googleLoaded, useFallback, fetchGoogleSuggestions, fetchFallbackSuggestions]);

  // Get place details (coordinates) when a Google suggestion is selected
  const getGooglePlaceDetails = useCallback((placeId, displayText) => {
    if (!placesServiceRef.current) {
      onChange(displayText);
      return;
    }

    const request = {
      placeId: placeId,
      fields: ['geometry', 'formatted_address'],
      sessionToken: sessionTokenRef.current,
    };

    placesServiceRef.current.getDetails(request, (place, status) => {
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();

      if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place) {
        onChange(displayText);
        return;
      }

      onChange(displayText, {
        lat: place.geometry?.location?.lat(),
        lng: place.geometry?.location?.lng(),
      });
    });
  }, [onChange]);

  // Handle input changes
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowSuggestions(true);
    setHighlightedIndex(-1);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion) => {
    const displayText = `${suggestion.mainText}, ${suggestion.secondaryText}`;
    setInputValue(displayText);
    setShowSuggestions(false);
    setSuggestions([]);
    
    if (suggestion.isFallback) {
      // Fallback already has coordinates
      onChange(displayText, {
        lat: suggestion.lat,
        lng: suggestion.lng,
      });
    } else {
      // Get coordinates from Google Places
      getGooglePlaceDetails(suggestion.placeId, displayText);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        onChange(inputValue);
        setShowSuggestions(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelectSuggestion(suggestions[highlightedIndex]);
        } else {
          onChange(inputValue);
          setShowSuggestions(false);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Handle blur
  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      if (inputValue !== value) {
        onChange(inputValue);
      }
    }, 200);
  };

  // Handle focus
  const handleFocus = () => {
    if (inputValue && inputValue.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle clear
  const handleClear = () => {
    setInputValue('');
    onChange('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.inputWrapper}>
        <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={styles.input}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showSuggestions && suggestions.length > 0}
          aria-haspopup="listbox"
        />
        {isLoading && <div className={styles.loadingSpinner} />}
        {inputValue && !isLoading && (
          <button 
            type="button"
            onClick={handleClear}
            className={styles.clearBtn}
            aria-label="Clear location"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <ul
          ref={suggestionsRef}
          className={styles.suggestions}
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.placeId}
              className={`${styles.suggestionItem} ${index === highlightedIndex ? styles.highlighted : ''}`}
              onClick={() => handleSelectSuggestion(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              role="option"
              aria-selected={index === highlightedIndex}
            >
              <svg className={styles.locationIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span className={styles.suggestionText}>
                <strong className={styles.cityName}>{suggestion.mainText}</strong>
                {suggestion.secondaryText && (
                  <span className={styles.stateText}>, {suggestion.secondaryText}</span>
                )}
                {suggestion.county && (
                  <span className={styles.countyText}>({suggestion.county})</span>
                )}
              </span>
            </li>
          ))}
          {/* Attribution based on source */}
          {!useFallback && googleLoaded && (
            <div className={styles.attribution}>
              <img 
                src="https://developers.google.com/static/maps/documentation/images/powered_by_google_on_white.png" 
                alt="Powered by Google" 
                height="14"
              />
            </div>
          )}
          {(useFallback || !googleLoaded) && (
            <div className={styles.attribution}>
              <span className={styles.osmAttribution}>Data © OpenStreetMap</span>
            </div>
          )}
        </ul>
      )}
    </div>
  );
}
