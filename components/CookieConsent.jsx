'use client';

/**
 * Cookie Consent Banner
 * 
 * GDPR-compliant cookie consent UI that:
 * - Shows on first visit or when consent expires
 * - Allows users to accept/reject analytics cookies
 * - Persists preference in localStorage
 * - Integrates with PostHog for consent management
 * 
 * @module components/CookieConsent
 */

import { useState, useEffect, useCallback } from 'react';
import styles from './CookieConsent.module.css';
import posthog from 'posthog-js';

// =============================================================================
// CONSTANTS
// =============================================================================

const CONSENT_KEY = 'autorev_cookie_consent';
const CONSENT_EXPIRY_DAYS = 365; // Re-ask after 1 year

/**
 * Consent preferences structure
 * @typedef {Object} ConsentPreferences
 * @property {boolean} analytics - Analytics cookies (PostHog, GA)
 * @property {boolean} marketing - Marketing cookies (Meta Pixel)
 * @property {boolean} functional - Functional cookies (always required)
 * @property {number} timestamp - When consent was given
 */

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get stored consent preferences
 * @returns {ConsentPreferences|null}
 */
function getStoredConsent() {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;
    
    const consent = JSON.parse(stored);
    
    // Check if consent has expired
    const expiryMs = CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    if (Date.now() - consent.timestamp > expiryMs) {
      localStorage.removeItem(CONSENT_KEY);
      return null;
    }
    
    return consent;
  } catch {
    return null;
  }
}

/**
 * Store consent preferences
 * @param {Partial<ConsentPreferences>} preferences
 */
function storeConsent(preferences) {
  if (typeof window === 'undefined') return;
  
  const consent = {
    ...preferences,
    functional: true, // Always required
    timestamp: Date.now(),
  };
  
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    
    // Update PostHog consent
    if (preferences.analytics) {
      posthog.opt_in_capturing();
    } else {
      posthog.opt_out_capturing();
    }
    
    // Update GA consent
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: preferences.analytics ? 'granted' : 'denied',
        ad_storage: preferences.marketing ? 'granted' : 'denied',
      });
    }
  } catch (err) {
    console.error('[CookieConsent] Failed to store preferences:', err);
  }
}

/**
 * Check if consent is needed
 * @returns {boolean}
 */
function needsConsent() {
  return getStoredConsent() === null;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Cookie Consent Banner Component
 * 
 * @param {Object} props
 * @param {function} [props.onConsentGiven] - Callback when consent is given
 */
export default function CookieConsent({ onConsentGiven }) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    analytics: true,
    marketing: true,
  });
  
  // Check if we need to show the banner
  useEffect(() => {
    // Delay to prevent flash during SSR hydration
    const timer = setTimeout(() => {
      if (needsConsent()) {
        setIsVisible(true);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle accept all
  const handleAcceptAll = useCallback(() => {
    const consent = {
      analytics: true,
      marketing: true,
      functional: true,
    };
    storeConsent(consent);
    setIsVisible(false);
    onConsentGiven?.(consent);
  }, [onConsentGiven]);
  
  // Handle reject non-essential
  const handleRejectNonEssential = useCallback(() => {
    const consent = {
      analytics: false,
      marketing: false,
      functional: true,
    };
    storeConsent(consent);
    setIsVisible(false);
    onConsentGiven?.(consent);
  }, [onConsentGiven]);
  
  // Handle save custom preferences
  const handleSavePreferences = useCallback(() => {
    const consent = {
      ...preferences,
      functional: true,
    };
    storeConsent(consent);
    setIsVisible(false);
    onConsentGiven?.(consent);
  }, [preferences, onConsentGiven]);
  
  // Handle preference toggle
  const togglePreference = useCallback((key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <div className={styles.overlay} role="dialog" aria-label="Cookie consent">
      <div className={styles.banner}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>We value your privacy</h2>
          <p className={styles.description}>
            We use cookies to enhance your browsing experience, analyze site traffic, 
            and provide personalized content. You can choose which cookies to accept.
          </p>
        </div>
        
        {/* Cookie details (expandable) */}
        {showDetails && (
          <div className={styles.details}>
            {/* Functional cookies - always on */}
            <label className={styles.cookieOption}>
              <div className={styles.optionInfo}>
                <span className={styles.optionName}>Essential Cookies</span>
                <span className={styles.optionDescription}>
                  Required for the site to function. Cannot be disabled.
                </span>
              </div>
              <input
                type="checkbox"
                checked={true}
                disabled
                className={styles.checkbox}
              />
            </label>
            
            {/* Analytics cookies */}
            <label className={styles.cookieOption}>
              <div className={styles.optionInfo}>
                <span className={styles.optionName}>Analytics Cookies</span>
                <span className={styles.optionDescription}>
                  Help us understand how visitors interact with our site.
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={() => togglePreference('analytics')}
                className={styles.checkbox}
              />
            </label>
            
            {/* Marketing cookies */}
            <label className={styles.cookieOption}>
              <div className={styles.optionInfo}>
                <span className={styles.optionName}>Marketing Cookies</span>
                <span className={styles.optionDescription}>
                  Used to deliver relevant ads and track campaign effectiveness.
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.marketing}
                onChange={() => togglePreference('marketing')}
                className={styles.checkbox}
              />
            </label>
          </div>
        )}
        
        {/* Actions */}
        <div className={styles.actions}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={styles.manageButton}
          >
            {showDetails ? 'Hide Options' : 'Manage Options'}
          </button>
          
          <div className={styles.mainActions}>
            {showDetails ? (
              <button onClick={handleSavePreferences} className={styles.acceptButton}>
                Save Preferences
              </button>
            ) : (
              <>
                <button onClick={handleRejectNonEssential} className={styles.rejectButton}>
                  Essential Only
                </button>
                <button onClick={handleAcceptAll} className={styles.acceptButton}>
                  Accept All
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Privacy policy link */}
        <div className={styles.footer}>
          <a href="/privacy" className={styles.privacyLink}>
            Read our Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Hook to check consent status
 * @returns {{ hasConsent: boolean, preferences: ConsentPreferences|null }}
 */
export function useCookieConsent() {
  const [consent, setConsent] = useState(() => getStoredConsent());
  
  useEffect(() => {
    // Re-check on mount (for SSR)
    setConsent(getStoredConsent());
  }, []);
  
  return {
    hasConsent: consent !== null,
    preferences: consent,
    hasAnalytics: consent?.analytics ?? false,
    hasMarketing: consent?.marketing ?? false,
  };
}
