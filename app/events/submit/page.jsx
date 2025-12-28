'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import styles from './page.module.css';

// US States for dropdown
const US_STATES = [
  { value: '', label: 'Select State' },
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'Washington D.C.' },
  { value: 'INTL', label: 'International' },
];

const MAX_DESCRIPTION_LENGTH = 1000;

// Icons
const Icons = {
  check: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  calendar: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  link: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  alertTriangle: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  mapPin: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
};

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// Calculate similarity between two strings (simple Jaccard-like)
function calculateSimilarity(str1, str2) {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
}

export default function SubmitEventPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading, sessionExpired, authError } = useAuth();
  const authModal = useAuthModal();
  
  // Form state
  const [eventTypes, setEventTypes] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    eventTypeSlug: '',
    sourceUrl: '',
    startDate: '',
    endDate: '',
    venueName: '',
    city: '',
    state: '',
    description: '',
  });
  
  // UI state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  // Duplicate detection state
  const [potentialDuplicates, setPotentialDuplicates] = useState([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  
  // Fetch event types on mount
  useEffect(() => {
    async function fetchTypes() {
      try {
        const res = await fetch('/api/events/types');
        const data = await res.json();
        if (data.types) {
          setEventTypes(data.types);
        }
      } catch (err) {
        console.error('[SubmitEvent] Error fetching event types:', err);
      }
    }
    fetchTypes();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Event name is required';
    }
    
    if (!formData.eventTypeSlug) {
      newErrors.eventTypeSlug = 'Event type is required';
    }
    
    if (!formData.sourceUrl.trim()) {
      newErrors.sourceUrl = 'Event URL is required';
    } else if (!isValidUrl(formData.sourceUrl.trim())) {
      newErrors.sourceUrl = 'Please enter a valid URL (starting with http:// or https://)';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else if (formData.startDate < getTodayDate()) {
      newErrors.startDate = 'Start date must be today or in the future';
    }
    
    if (formData.endDate && formData.endDate < formData.startDate) {
      newErrors.endDate = 'End date must be on or after start date';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.state) {
      newErrors.state = 'State is required';
    }
    
    if (formData.description.length > MAX_DESCRIPTION_LENGTH) {
      newErrors.description = `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Check for duplicate events
  const checkForDuplicates = async () => {
    setIsCheckingDuplicates(true);
    
    try {
      // Fetch events near the same date and location
      const params = new URLSearchParams();
      params.set('city', formData.city.trim());
      params.set('state', formData.state);
      params.set('start_after', formData.startDate);
      
      // Get events within a week of the start date
      const endCheckDate = new Date(formData.startDate);
      endCheckDate.setDate(endCheckDate.getDate() + 7);
      params.set('start_before', endCheckDate.toISOString().split('T')[0]);
      params.set('limit', '50');
      
      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();
      
      const existingEvents = data.events || [];
      
      // Find similar events
      const duplicates = existingEvents.filter(event => {
        const nameSimilarity = calculateSimilarity(formData.name.trim(), event.name);
        const sameCity = event.city?.toLowerCase() === formData.city.trim().toLowerCase();
        const sameDate = event.start_date === formData.startDate;
        
        // High name similarity (>50%) and same city, or exact same name
        return (nameSimilarity > 0.5 && sameCity) || nameSimilarity > 0.8 || (sameCity && sameDate && nameSimilarity > 0.3);
      });
      
      return duplicates;
    } catch (err) {
      console.error('[SubmitEvent] Error checking duplicates:', err);
      return [];
    } finally {
      setIsCheckingDuplicates(false);
    }
  };
  
  // Submit the event
  const submitEvent = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const res = await fetch('/api/events/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          event_type_slug: formData.eventTypeSlug,
          source_url: formData.sourceUrl.trim(),
          start_date: formData.startDate,
          end_date: formData.endDate || null,
          venue_name: formData.venueName.trim() || null,
          city: formData.city.trim(),
          state: formData.state === 'INTL' ? null : formData.state,
          description: formData.description.trim() || null,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit event');
      }
      
      setSubmitSuccess(true);
      setFormData({
        name: '',
        eventTypeSlug: '',
        sourceUrl: '',
        startDate: '',
        endDate: '',
        venueName: '',
        city: '',
        state: '',
        description: '',
      });
    } catch (err) {
      console.error('[SubmitEvent] Error submitting event:', err);
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      authModal.openSignIn();
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    // Check for duplicates first
    const duplicates = await checkForDuplicates();
    
    if (duplicates.length > 0) {
      setPotentialDuplicates(duplicates);
      setShowDuplicateModal(true);
    } else {
      // No duplicates, submit directly
      await submitEvent();
    }
  };
  
  const handleConfirmSubmit = async () => {
    setShowDuplicateModal(false);
    await submitEvent();
  };
  
  // Auth loading state
  if (authLoading) {
    return (
      <div className={styles.page}>
        <header className={styles.hero}>
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <span className={styles.badge}>Submit</span>
            <h1 className={styles.heroTitle}>
              Share an <span className={styles.titleAccent}>Event</span>
            </h1>
          </div>
        </header>
        <div className={styles.formWrapper}>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className={styles.loadingSpinner} style={{ margin: '0 auto 1rem', width: '32px', height: '32px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (submitSuccess) {
    return (
      <div className={styles.page}>
        <div className={styles.successContainer}>
          <div className={styles.successIcon}>
            <Icons.check size={48} />
          </div>
          <h1 className={styles.successTitle}>Event Submitted!</h1>
          <p className={styles.successMessage}>
            Thanks for contributing to the AutoRev community! Your event has been added and is now live for other enthusiasts to discover.
          </p>
          <div className={styles.successActions}>
            <Link href="/community/events" className={styles.primaryButton}>
              Browse Events
            </Link>
            <button 
              onClick={() => setSubmitSuccess(false)} 
              className={styles.secondaryButton}
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.page}>
      {/* Hero Header */}
      <header className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <span className={styles.badge}>Submit</span>
          <h1 className={styles.heroTitle}>
            Share an <span className={styles.titleAccent}>Event</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Know of a great car event? Help the community discover it!
          </p>
        </div>
      </header>
      
      {/* Form Container */}
      <div className={styles.formWrapper}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {submitError && (
            <div className={styles.errorBanner}>
              <Icons.alertTriangle size={18} />
              {submitError}
            </div>
          )}
          
          {/* Event Name */}
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              Event Name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Malibu Cars & Coffee"
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              maxLength={200}
            />
            {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
          </div>
          
          {/* Event Type */}
          <div className={styles.formGroup}>
            <label htmlFor="eventTypeSlug" className={styles.label}>
              Event Type <span className={styles.required}>*</span>
            </label>
            <select
              id="eventTypeSlug"
              name="eventTypeSlug"
              value={formData.eventTypeSlug}
              onChange={handleChange}
              className={`${styles.select} ${errors.eventTypeSlug ? styles.inputError : ''}`}
            >
              <option value="">Select Event Type</option>
              {eventTypes.map(type => (
                <option key={type.slug} value={type.slug}>
                  {type.name}
                </option>
              ))}
            </select>
            {errors.eventTypeSlug && <span className={styles.fieldError}>{errors.eventTypeSlug}</span>}
          </div>
          
          {/* Event URL */}
          <div className={styles.formGroup}>
            <label htmlFor="sourceUrl" className={styles.label}>
              Event URL <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWithIcon}>
              <Icons.link size={18} />
              <input
                type="url"
                id="sourceUrl"
                name="sourceUrl"
                value={formData.sourceUrl}
                onChange={handleChange}
                placeholder="https://example.com/event"
                className={`${styles.input} ${styles.inputIconPadding} ${errors.sourceUrl ? styles.inputError : ''}`}
              />
            </div>
            {errors.sourceUrl && <span className={styles.fieldError}>{errors.sourceUrl}</span>}
            <span className={styles.fieldHint}>Link to the official event page or registration</span>
          </div>
          
          {/* Date Row */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="startDate" className={styles.label}>
                Start Date <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWithIcon}>
                <Icons.calendar size={18} />
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  min={getTodayDate()}
                  className={`${styles.input} ${styles.inputIconPadding} ${errors.startDate ? styles.inputError : ''}`}
                />
              </div>
              {errors.startDate && <span className={styles.fieldError}>{errors.startDate}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="endDate" className={styles.label}>
                End Date <span className={styles.optional}>(optional)</span>
              </label>
              <div className={styles.inputWithIcon}>
                <Icons.calendar size={18} />
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate || getTodayDate()}
                  className={`${styles.input} ${styles.inputIconPadding} ${errors.endDate ? styles.inputError : ''}`}
                />
              </div>
              {errors.endDate && <span className={styles.fieldError}>{errors.endDate}</span>}
              <span className={styles.fieldHint}>For multi-day events</span>
            </div>
          </div>
          
          {/* Venue Name */}
          <div className={styles.formGroup}>
            <label htmlFor="venueName" className={styles.label}>
              Venue Name <span className={styles.optional}>(optional)</span>
            </label>
            <div className={styles.inputWithIcon}>
              <Icons.mapPin size={18} />
              <input
                type="text"
                id="venueName"
                name="venueName"
                value={formData.venueName}
                onChange={handleChange}
                placeholder="e.g., Laguna Seca Raceway"
                className={`${styles.input} ${styles.inputIconPadding}`}
                maxLength={200}
              />
            </div>
          </div>
          
          {/* Location Row */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="city" className={styles.label}>
                City <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g., Monterey"
                className={`${styles.input} ${errors.city ? styles.inputError : ''}`}
                maxLength={100}
              />
              {errors.city && <span className={styles.fieldError}>{errors.city}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="state" className={styles.label}>
                State <span className={styles.required}>*</span>
              </label>
              <select
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={`${styles.select} ${errors.state ? styles.inputError : ''}`}
              >
                {US_STATES.map(state => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
              {errors.state && <span className={styles.fieldError}>{errors.state}</span>}
            </div>
          </div>
          
          {/* Description */}
          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              Description <span className={styles.optional}>(optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell us about this event..."
              className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
              rows={4}
              maxLength={MAX_DESCRIPTION_LENGTH}
            />
            <div className={styles.charCount}>
              {formData.description.length} / {MAX_DESCRIPTION_LENGTH}
            </div>
            {errors.description && <span className={styles.fieldError}>{errors.description}</span>}
          </div>
          
          {/* Submit Button */}
          <div className={styles.submitSection}>
            {!isAuthenticated && !authLoading && (
              <p className={styles.authNotice}>
                You&apos;ll need to sign in to submit an event.
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting || isCheckingDuplicates || authLoading}
              className={styles.submitButton}
            >
              {isCheckingDuplicates ? 'Checking for duplicates...' : 
               isSubmitting ? 'Submitting...' : 
               isAuthenticated ? 'Submit Event' : 'Sign In to Submit'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Duplicate Detection Modal */}
      {showDuplicateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDuplicateModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <Icons.alertTriangle size={24} />
              <h2 className={styles.modalTitle}>Similar Events Found</h2>
            </div>
            <p className={styles.modalDescription}>
              We found some events that might be similar to yours. Please confirm this is a different event:
            </p>
            <div className={styles.duplicatesList}>
              {potentialDuplicates.slice(0, 3).map(event => (
                <div key={event.id} className={styles.duplicateItem}>
                  <strong>{event.name}</strong>
                  <span>{event.city}, {event.state} • {new Date(event.start_date + 'T00:00:00').toLocaleDateString()}</span>
                </div>
              ))}
              {potentialDuplicates.length > 3 && (
                <p className={styles.moreCount}>
                  + {potentialDuplicates.length - 3} more similar events
                </p>
              )}
            </div>
            <div className={styles.modalActions}>
              <button 
                onClick={() => setShowDuplicateModal(false)}
                className={styles.secondaryButton}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmSubmit}
                className={styles.primaryButton}
              >
                This is a Different Event
              </button>
            </div>
          </div>
        </div>
      )}
      
      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={authModal.close}
        defaultMode={authModal.defaultMode}
      />
    </div>
  );
}
