'use client';

/**
 * FeedbackWidget Component
 * 
 * Enhanced beta feedback collection widget with:
 * - Category classification (Bug, Feature, Data Issue, General, Praise)
 * - Severity tracking for bugs (Blocking, Major, Minor)
 * - Auto-capture of context (page, car, browser, user tier)
 * - Optional rating and email for follow-up
 * - Progressive disclosure to minimize friction
 * 
 * All feedback is stored in Supabase for analytics and tracking.
 * Supports both authenticated and anonymous submissions.
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useAuth } from './providers/AuthProvider';
import styles from './FeedbackWidget.module.css';

// ============================================================================
// FEEDBACK CONTEXT - For programmatic control from other components
// ============================================================================

const FeedbackContext = createContext(null);

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    // Return a no-op if used outside provider (graceful degradation)
    return {
      openFeedback: () => console.warn('[useFeedback] No FeedbackProvider found'),
      openCarRequest: () => console.warn('[useFeedback] No FeedbackProvider found'),
      openBugReport: () => console.warn('[useFeedback] No FeedbackProvider found'),
    };
  }
  return context;
}

export function FeedbackProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackConfig, setFeedbackConfig] = useState({
    context: null,
    preselectedCategory: null,
    preselectedType: null,
    customHint: null,
  });

  const openFeedback = useCallback(({ context = null, preselectedCategory = null, preselectedType = null, customHint = null } = {}) => {
    setFeedbackConfig({ context, preselectedCategory, preselectedType, customHint });
    setIsOpen(true);
  }, []);

  const openCarRequest = useCallback((customHint = null) => {
    setFeedbackConfig({ 
      context: 'car-request', 
      preselectedCategory: 'feature',
      preselectedType: 'car_request', 
      customHint: customHint || "Tell us which car you'd like to see added to our database." 
    });
    setIsOpen(true);
  }, []);

  const openBugReport = useCallback((customHint = null) => {
    setFeedbackConfig({ 
      context: 'bug-report', 
      preselectedCategory: 'bug',
      preselectedType: 'bug', 
      customHint: customHint || "Describe what went wrong and we'll fix it ASAP." 
    });
    setIsOpen(true);
  }, []);

  const closeFeedback = useCallback(() => {
    setIsOpen(false);
    // Reset config after close animation
    setTimeout(() => {
      setFeedbackConfig({ context: null, preselectedCategory: null, preselectedType: null, customHint: null });
    }, 300);
  }, []);

  return (
    <FeedbackContext.Provider value={{ openFeedback, openCarRequest, openBugReport, closeFeedback, isOpen }}>
      {children}
      <FeedbackWidget
        context={feedbackConfig.context}
        preselectedCategory={feedbackConfig.preselectedCategory}
        preselectedType={feedbackConfig.preselectedType}
        customHint={feedbackConfig.customHint}
        isExternalOpen={isOpen}
        onExternalClose={closeFeedback}
        showButton={false} // Using FeedbackCorner instead
      />
    </FeedbackContext.Provider>
  );
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  messageSquare: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  x: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  bug: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="6" width="8" height="14" rx="4"/>
      <path d="M19 9h-2a3 3 0 0 0-3-3V4"/>
      <path d="M5 9h2a3 3 0 0 1 3-3V4"/>
      <path d="M5 13H4a2 2 0 0 0-2 2"/>
      <path d="M19 13h1a2 2 0 0 1 2 2"/>
      <path d="M5 17H2"/>
      <path d="M22 17h-3"/>
    </svg>
  ),
  lightbulb: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6"/>
      <path d="M10 22h4"/>
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
    </svg>
  ),
  database: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  ),
  message: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
  ),
  heart: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  check: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  send: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  star: ({ size = 20, filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  alertTriangle: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  info: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
};

// ============================================================================
// CATEGORY & SEVERITY OPTIONS
// ============================================================================

const categories = [
  { id: 'bug', label: 'Bug Report', icon: Icons.bug, color: '#ef4444', description: 'Something is broken' },
  { id: 'feature', label: 'Feature Request', icon: Icons.lightbulb, color: '#10b981', description: 'I have an idea' },
  { id: 'data', label: 'Data Issue', icon: Icons.database, color: '#f59e0b', description: 'Wrong or missing data' },
  { id: 'general', label: 'General', icon: Icons.message, color: '#6b7280', description: 'Other feedback' },
  { id: 'praise', label: 'Praise', icon: Icons.heart, color: '#ec4899', description: 'Something I love' },
];

const severities = [
  { id: 'blocking', label: 'Blocking', description: "Can't use the feature at all", color: '#ef4444' },
  { id: 'major', label: 'Major', description: 'Significant impact on usage', color: '#f59e0b' },
  { id: 'minor', label: 'Minor', description: 'Annoying but workable', color: '#6b7280' },
];

// ============================================================================
// HELPERS
// ============================================================================

// Generate or get session ID for anonymous tracking
function getSessionId() {
  if (typeof window === 'undefined') return null;
  let sessionId = sessionStorage.getItem('autorev_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('autorev_session_id', sessionId);
  }
  return sessionId;
}

// Get browser info for bug reports
function getBrowserInfo() {
  if (typeof window === 'undefined') return null;
  const ua = navigator.userAgent;
  return {
    browser: /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : /Edge/.test(ua) ? 'Edge' : 'Other',
    os: /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : /iOS/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : 'Other',
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language,
    userAgent: ua,
  };
}

// Extract car slug from URL
function getCarContextFromUrl(url) {
  if (!url) return null;
  const carMatch = url.match(/\/browse-cars\/([^/?#]+)/);
  return carMatch ? carMatch[1] : null;
}

// Extract feature context from URL
function getFeatureContextFromUrl(url) {
  if (!url) return null;
  const pathname = new URL(url).pathname;
  
  if (pathname.includes('/tuning-shop')) return 'tuning-shop';
  if (pathname.includes('/garage')) return 'garage';
  if (pathname.includes('/browse-cars')) return 'browse-cars';
  if (pathname.includes('/encyclopedia')) return 'encyclopedia';
  if (pathname.includes('/compare')) return 'compare';
  if (pathname.includes('/al') || pathname.includes('/ai-mechanic')) return 'ai-mechanic';
  
  return pathname.split('/')[1] || 'home';
}

/**
 * Contextual prompts based on page/section
 */
const contextualHints = {
  'browse-cars': {
    title: 'Car Browser Feedback',
    hint: "Can't find a car you're looking for? Let us know!",
  },
  'garage': {
    title: 'Garage Feedback',
    hint: 'How can we improve your garage experience?',
  },
  'tuning-shop': {
    title: 'Tuning Shop Feedback',
    hint: 'Missing an upgrade option or have suggestions?',
  },
  'car-request': {
    title: 'Request a Car',
    hint: "Tell us which car you'd like to see in our database.",
  },
  'bug-report': {
    title: 'Report a Bug',
    hint: "Describe what went wrong and we'll fix it ASAP.",
  },
  default: {
    title: 'Share Your Feedback',
    hint: null,
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FeedbackWidget({ 
  context = null,
  preselectedCategory = null,
  preselectedType = null,
  customHint = null,
  buttonLabel = 'Feedback',
  showButton = true,
  isExternalOpen = false,
  onExternalClose = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState(null);
  const [severity, setSeverity] = useState(null);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  // Get auth context
  const { user, isAuthenticated, userTier } = useAuth();
  
  // Handle external open state
  useEffect(() => {
    if (isExternalOpen) {
      setIsOpen(true);
      if (preselectedCategory) {
        setCategory(preselectedCategory);
      }
    }
  }, [isExternalOpen, preselectedCategory]);
  
  // Get contextual config
  const contextConfig = contextualHints[context] || contextualHints.default;

  // Handle close with external callback
  const handleClose = () => {
    setIsOpen(false);
    if (onExternalClose) {
      onExternalClose();
    }
  };

  // Reset form when closing
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setCategory(preselectedCategory || null);
        setSeverity(null);
        setMessage('');
        setEmail('');
        setRating(0);
        setError(null);
        if (isSuccess) setIsSuccess(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isSuccess, preselectedCategory]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!category) {
      setError('Please select a category.');
      return;
    }

    if (!message.trim()) {
      setError('Please enter your feedback message.');
      return;
    }

    if (category === 'bug' && !severity) {
      setError('Please select a severity level for the bug.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (typeof window === 'undefined') {
        setError('Feedback is only available in the browser.');
        setIsSubmitting(false);
        return;
      }

      const pageUrl = window.location.href;
      
      // Map category to feedback_type for API compatibility
      const feedbackTypeMap = {
        'bug': 'bug',
        'feature': 'feature',
        'data': 'other',
        'general': 'other',
        'praise': 'like',
      };
      
      const feedbackPayload = {
        // API required fields
        feedback_type: feedbackTypeMap[category] || 'other',
        message: message.trim(),
        
        // New beta fields (stored in metadata)
        category,
        severity: category === 'bug' ? severity : null,
        rating: rating > 0 ? rating : null,
        featureContext: getFeatureContextFromUrl(pageUrl),
        carContext: getCarContextFromUrl(pageUrl),
        
        // User info
        userId: user?.id || null,
        userTier: userTier || null,
        email: email || (user?.email) || null,
        
        // Common fields
        page_url: pageUrl,
        page_title: typeof document !== 'undefined' ? document.title : '',
        metadata: {
          sessionId: getSessionId(),
          browserInfo: getBrowserInfo(),
          screenWidth: typeof window !== 'undefined' ? window.innerWidth : null,
          screenHeight: typeof window !== 'undefined' ? window.innerHeight : null,
        },
      };

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit feedback');
      }

      setIsSuccess(true);
      
      // Auto-close after success
      setTimeout(() => {
        handleClose();
      }, 2500);
    } catch (err) {
      console.error('[FeedbackWidget] Error:', err);
      setError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get placeholder text based on category
  const getPlaceholder = () => {
    switch (category) {
      case 'bug':
        return 'Describe what happened, what you expected, and steps to reproduce...';
      case 'feature':
        return 'Describe the feature you\'d like to see...';
      case 'data':
        return 'Which data is wrong or missing? Include car name if applicable...';
      case 'praise':
        return 'What do you love about AutoRev?';
      default:
        return 'Share your thoughts...';
    }
  };

  return (
    <>
      {/* Floating button - conditionally rendered */}
      {showButton && (
        <button
          className={`${styles.floatingButton} ${isOpen ? styles.floatingButtonHidden : ''}`}
          onClick={() => setIsOpen(true)}
          aria-label="Give feedback"
        >
          <Icons.messageSquare size={22} />
          <span>{buttonLabel}</span>
        </button>
      )}

      {/* Overlay */}
      {isOpen && (
        <div className={styles.overlay} onClick={handleClose}>
          <div className={styles.widget} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.header}>
              <h3 className={styles.title}>
                {isSuccess ? 'Thank You!' : contextConfig.title}
              </h3>
              <button
                className={styles.closeButton}
                onClick={handleClose}
                aria-label="Close"
              >
                <Icons.x size={20} />
              </button>
            </div>

            {/* Content */}
            {isSuccess ? (
              <div className={styles.success}>
                <div className={styles.successIcon}>
                  <Icons.check size={32} />
                </div>
                <p>Thanks for sharing your feedback!</p>
                <p className={styles.successSubtext}>
                  {category === 'bug' && severity === 'blocking' 
                    ? "We'll prioritize this and get back to you ASAP."
                    : "We'll review your feedback and use it to improve AutoRev."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form}>
                {/* Contextual Hint */}
                {(customHint || contextConfig.hint) && (
                  <p className={styles.contextHint}>
                    {customHint || contextConfig.hint}
                  </p>
                )}

                {/* Category Selection */}
                <div className={styles.field}>
                  <label className={styles.label}>What's this about?</label>
                  <div className={styles.categoryGrid}>
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          className={`${styles.categoryButton} ${category === cat.id ? styles.categoryButtonActive : ''}`}
                          onClick={() => {
                            setCategory(cat.id);
                            if (cat.id !== 'bug') setSeverity(null);
                          }}
                          style={{ 
                            '--cat-color': cat.color,
                            borderColor: category === cat.id ? cat.color : undefined,
                            background: category === cat.id ? `${cat.color}15` : undefined,
                          }}
                        >
                          <Icon size={18} />
                          <span className={styles.categoryLabel}>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Severity (only for bugs) */}
                {category === 'bug' && (
                  <div className={styles.field}>
                    <label className={styles.label}>
                      <Icons.alertTriangle size={16} />
                      <span>How severe is this?</span>
                    </label>
                    <div className={styles.severityGrid}>
                      {severities.map((sev) => (
                        <button
                          key={sev.id}
                          type="button"
                          className={`${styles.severityButton} ${severity === sev.id ? styles.severityButtonActive : ''}`}
                          onClick={() => setSeverity(sev.id)}
                          style={{ 
                            '--sev-color': sev.color,
                            borderColor: severity === sev.id ? sev.color : undefined,
                            background: severity === sev.id ? `${sev.color}15` : undefined,
                          }}
                        >
                          <span className={styles.severityLabel}>{sev.label}</span>
                          <span className={styles.severityDesc}>{sev.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="feedback-message">
                    Tell us more <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    id="feedback-message"
                    className={styles.textarea}
                    placeholder={getPlaceholder()}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                {/* Email (optional) */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="feedback-email">
                    Email <span className={styles.optional}>(optional)</span>
                  </label>
                  <input
                    id="feedback-email"
                    type="email"
                    className={styles.input}
                    placeholder={user?.email || 'your@email.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className={styles.hint}>
                    <Icons.info size={12} />
                    <span>Only if you'd like us to follow up</span>
                  </p>
                </div>

                {/* Rating (optional) */}
                <div className={styles.field}>
                  <label className={styles.label}>
                    How's your experience? <span className={styles.optional}>(optional)</span>
                  </label>
                  <div className={styles.ratingContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={styles.starButton}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        aria-label={`Rate ${star} stars`}
                      >
                        <Icons.star 
                          size={24} 
                          filled={star <= (hoverRating || rating)} 
                        />
                      </button>
                    ))}
                    {rating > 0 && (
                      <span className={styles.ratingText}>
                        {rating === 5 ? 'Excellent!' : 
                         rating === 4 ? 'Great!' : 
                         rating === 3 ? 'Good' : 
                         rating === 2 ? 'Fair' : 'Poor'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className={styles.error}>
                    <Icons.alertTriangle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Auto-captured context note */}
                <div className={styles.autoCapture}>
                  <Icons.info size={12} />
                  <span>Auto-captured: page, browser, {getCarContextFromUrl(typeof window !== 'undefined' ? window.location.href : '') ? 'car context' : 'context'}</span>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSubmitting || !category || !message.trim() || (category === 'bug' && !severity)}
                >
                  {isSubmitting ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <Icons.send size={16} />
                      <span>Submit Feedback</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
