'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './LocationAutocomplete.module.css';

/**
 * LocationAutocomplete Component
 * 
 * Provides a location input with Google Places Autocomplete API.
 * Falls back to manual input if Google Maps is not available.
 * 
 * @param {Object} props
 * @param {string} props.value - Current input value
 * @param {Function} props.onChange - Callback when value changes (receives { formatted: string, lat?: number, lng?: number })
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.className] - Additional CSS class
 */
export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = "ZIP code or City, State",
  className = '',
}) {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  
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
    // Support both key names for flexibility
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    
    if (!apiKey) {
      console.warn('[LocationAutocomplete] Google Maps API key not set (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY), using fallback mode');
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
      console.error('[LocationAutocomplete] Failed to load Google Maps API');
    };
    
    // Only append if not already in document
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
    if (!window.google?.maps?.places) return;
    
    autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
    
    // Create a dummy element for PlacesService (required by the API)
    const dummyElement = document.createElement('div');
    placesServiceRef.current = new window.google.maps.places.PlacesService(dummyElement);
    
    // Create a session token for billing optimization
    sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
    
    setGoogleLoaded(true);
  }, []);

  // Fetch suggestions from Google Places API
  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2 || !autocompleteServiceRef.current) {
      setSuggestions([]);
      return;
    }

    // If it looks like a ZIP code, don't use Google Places
    if (/^\d{5}$/.test(query.trim())) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      const request = {
        input: query,
        types: ['(cities)'], // Only return cities
        componentRestrictions: { country: 'us' },
        sessionToken: sessionTokenRef.current,
      };

      autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
        setIsLoading(false);
        
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
          setSuggestions([]);
          return;
        }

        const formattedSuggestions = predictions.map(prediction => ({
          placeId: prediction.place_id,
          mainText: prediction.structured_formatting.main_text,
          secondaryText: prediction.structured_formatting.secondary_text,
          fullText: prediction.description,
        }));

        setSuggestions(formattedSuggestions);
      });
    } catch (err) {
      console.error('[LocationAutocomplete] Error fetching suggestions:', err);
      setIsLoading(false);
      setSuggestions([]);
    }
  }, []);

  // Debounced suggestion fetch
  useEffect(() => {
    if (!googleLoaded) return;
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(inputValue);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputValue, googleLoaded, fetchSuggestions]);

  // Get place details (coordinates) when a suggestion is selected
  const getPlaceDetails = useCallback((placeId, displayText) => {
    if (!placesServiceRef.current) {
      // Fallback: just return the text
      onChange(displayText);
      return;
    }

    const request = {
      placeId: placeId,
      fields: ['geometry', 'formatted_address'],
      sessionToken: sessionTokenRef.current,
    };

    placesServiceRef.current.getDetails(request, (place, status) => {
      // Create a new session token after place details request
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();

      if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place) {
        onChange(displayText);
        return;
      }

      // Return both the formatted text and coordinates
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
    const displayText = `${suggestion.mainText}, ${suggestion.secondaryText?.split(',')[0] || ''}`.trim();
    setInputValue(displayText);
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Get coordinates for the selected place
    getPlaceDetails(suggestion.placeId, displayText);
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
    // Delay to allow click on suggestions
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
              role="option"
              aria-selected={index === highlightedIndex}
            >
              <svg className={styles.locationIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span className={styles.suggestionText}>
                <strong>{suggestion.mainText}</strong>
                {suggestion.secondaryText && (
                  <span style={{ color: 'var(--color-gray-500)', marginLeft: '4px' }}>
                    {suggestion.secondaryText}
                  </span>
                )}
              </span>
            </li>
          ))}
          {/* Google attribution (required by ToS) */}
          <div className={styles.attribution}>
            <img 
              src="https://developers.google.com/static/maps/documentation/images/powered_by_google_on_white.png" 
              alt="Powered by Google" 
              height="14"
            />
          </div>
        </ul>
      )}
    </div>
  );
}
