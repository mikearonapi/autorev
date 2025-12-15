'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './LocationAutocomplete.module.css';

// Common US cities for quick suggestions
const POPULAR_CITIES = [
  'Los Angeles, CA',
  'San Francisco, CA',
  'New York, NY',
  'Chicago, IL',
  'Houston, TX',
  'Phoenix, AZ',
  'Philadelphia, PA',
  'San Antonio, TX',
  'San Diego, CA',
  'Dallas, TX',
  'Austin, TX',
  'Miami, FL',
  'Atlanta, GA',
  'Denver, CO',
  'Seattle, WA',
  'Boston, MA',
  'Detroit, MI',
  'Portland, OR',
  'Las Vegas, NV',
  'Nashville, TN',
];

/**
 * LocationAutocomplete Component
 * 
 * Provides a location input with basic autocomplete from popular cities.
 * Fast and reliable without external API dependencies.
 * 
 * @param {Object} props
 * @param {string} props.value - Current input value
 * @param {Function} props.onChange - Callback when value changes
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
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Sync external value with internal state
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Filter cities based on input
  const filterCities = useCallback((query) => {
    if (!query || query.length < 2) {
      return [];
    }
    
    const lowerQuery = query.toLowerCase();
    
    // If it looks like a ZIP code, don't suggest cities
    if (/^\d+$/.test(query)) {
      return [];
    }
    
    return POPULAR_CITIES.filter(city => 
      city.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);
  }, []);

  // Update suggestions when input changes
  useEffect(() => {
    const filtered = filterCities(inputValue);
    setSuggestions(filtered);
  }, [inputValue, filterCities]);

  // Handle input changes
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowSuggestions(true);
    setHighlightedIndex(-1);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion) => {
    setInputValue(suggestion);
    onChange(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
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
    }, 150);
  };

  // Handle focus
  const handleFocus = () => {
    if (inputValue && inputValue.length >= 2) {
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
        {inputValue && (
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
              key={suggestion}
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
                {suggestion}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
