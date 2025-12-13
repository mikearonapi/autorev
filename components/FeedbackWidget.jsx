'use client';

/**
 * FeedbackWidget Component
 * 
 * Floating feedback button that expands into a form for users to submit:
 * - What they like
 * - What they don't like
 * - Feature requests
 * - Bug reports
 * - Car requests (new cars for the database)
 * 
 * Now supports contextual prompts based on the page.
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
    };
  }
  return context;
}

export function FeedbackProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackConfig, setFeedbackConfig] = useState({
    context: null,
    preselectedType: null,
    customHint: null,
  });

  const openFeedback = useCallback(({ context = null, preselectedType = null, customHint = null } = {}) => {
    setFeedbackConfig({ context, preselectedType, customHint });
    setIsOpen(true);
  }, []);

  const openCarRequest = useCallback((customHint = null) => {
    setFeedbackConfig({ 
      context: 'car-request', 
      preselectedType: 'car_request', 
      customHint: customHint || "Tell us which car you'd like to see added to our database." 
    });
    setIsOpen(true);
  }, []);

  const closeFeedback = useCallback(() => {
    setIsOpen(false);
    // Reset config after close animation
    setTimeout(() => {
      setFeedbackConfig({ context: null, preselectedType: null, customHint: null });
    }, 300);
  }, []);

  return (
    <FeedbackContext.Provider value={{ openFeedback, openCarRequest, closeFeedback, isOpen }}>
      {children}
      <FeedbackWidget
        context={feedbackConfig.context}
        preselectedType={feedbackConfig.preselectedType}
        customHint={feedbackConfig.customHint}
        isExternalOpen={isOpen}
        onExternalClose={closeFeedback}
        showButton={false} // Using FeedbackCorner instead
      />
    </FeedbackContext.Provider>
  );
}

// Icons
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
  heart: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  thumbsDown: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
    </svg>
  ),
  lightbulb: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6"/>
      <path d="M10 22h4"/>
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
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
};

// Car request icon
const Icons_car = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
    <circle cx="7" cy="17" r="2"/>
    <path d="M9 17h6"/>
    <circle cx="17" cy="17" r="2"/>
  </svg>
);

const feedbackTypes = [
  { id: 'like', label: 'Something I love', icon: Icons.heart, color: '#ef4444' },
  { id: 'dislike', label: 'Could be better', icon: Icons.thumbsDown, color: '#f59e0b' },
  { id: 'feature', label: 'Feature request', icon: Icons.lightbulb, color: '#10b981' },
  { id: 'bug', label: 'Bug report', icon: Icons.bug, color: '#8b5cf6' },
  { id: 'car_request', label: 'Request a car', icon: Icons_car, color: '#3b82f6' },
];

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
  };
}

/**
 * Contextual prompts based on page/section
 * Pages can pass context to show relevant hints
 */
const contextualHints = {
  'browse-cars': {
    title: 'Car Browser Feedback',
    hint: "Can't find a car you're looking for? Let us know!",
    defaultType: null,
  },
  'garage': {
    title: 'Garage Feedback',
    hint: 'How can we improve your garage experience?',
    defaultType: null,
  },
  'tuning-shop': {
    title: 'Tuning Shop Feedback',
    hint: 'Missing an upgrade option or have suggestions?',
    defaultType: null,
  },
  'car-request': {
    title: 'Request a Car',
    hint: "Tell us which car you'd like to see in our database.",
    defaultType: 'car_request',
  },
  default: {
    title: 'Share Your Feedback',
    hint: null,
    defaultType: null,
  },
};

export default function FeedbackWidget({ 
  context = null,           // Page context: 'browse-cars', 'garage', 'tuning-shop', 'car-request'
  preselectedType = null,   // Pre-select a feedback type
  customHint = null,        // Custom hint text
  buttonLabel = 'Feedback', // Custom button label
  showButton = true,        // Whether to show the floating button (false if triggered externally)
  isExternalOpen = false,   // External control for open state
  onExternalClose = null,   // Callback when closing (for external control)
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState(null);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  // Get auth context
  const { user, isAuthenticated } = useAuth();
  
  // Handle external open state
  useEffect(() => {
    if (isExternalOpen) {
      setIsOpen(true);
      // Set preselected type if provided
      if (preselectedType) {
        setFeedbackType(preselectedType);
      }
    }
  }, [isExternalOpen, preselectedType]);
  
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
      // Delay reset to allow animation
      const timer = setTimeout(() => {
        setFeedbackType(preselectedType || null);
        setMessage('');
        setEmail('');
        setError(null);
        if (isSuccess) setIsSuccess(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isSuccess, preselectedType]);

  // Handle form submission - saves to database
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!feedbackType || !message.trim()) {
      setError('Please select a feedback type and enter your message.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Collect comprehensive context for analytics
      const feedbackPayload = {
        feedbackType,
        message: message.trim(),
        email: email || (user?.email) || null,
        pageUrl: window.location.href,
        pageTitle: document.title,
        sessionId: getSessionId(),
        userId: user?.id || null,
        browserInfo: getBrowserInfo(),
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
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

      const result = await response.json();

      setIsSuccess(true);
      
      // Auto-close after success
      setTimeout(() => {
        setIsOpen(false);
      }, 2500);
    } catch (err) {
      console.error('[FeedbackWidget] Error:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
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
                <p>Your feedback has been received!</p>
                <p className={styles.successSubtext}>We appreciate you taking the time to help us improve.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form}>
                {/* Contextual Hint */}
                {(customHint || contextConfig.hint) && (
                  <p className={styles.contextHint}>
                    {customHint || contextConfig.hint}
                  </p>
                )}

                {/* Feedback Type Selection */}
                <div className={styles.typeSelection}>
                  <label className={styles.label}>What type of feedback?</label>
                  <div className={styles.typeGrid}>
                    {feedbackTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          className={`${styles.typeButton} ${feedbackType === type.id ? styles.typeButtonActive : ''}`}
                          onClick={() => setFeedbackType(type.id)}
                          style={{ 
                            '--type-color': type.color,
                            borderColor: feedbackType === type.id ? type.color : undefined,
                            background: feedbackType === type.id ? `${type.color}15` : undefined,
                          }}
                        >
                          <Icon size={18} />
                          <span>{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Message */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="feedback-message">
                    Tell us more
                  </label>
                  <textarea
                    id="feedback-message"
                    className={styles.textarea}
                    placeholder={
                      feedbackType === 'like' ? "What do you love about AutoRev?" :
                      feedbackType === 'dislike' ? "What could we improve?" :
                      feedbackType === 'feature' ? "What feature would you like to see?" :
                      feedbackType === 'bug' ? "Please describe the issue you encountered..." :
                      feedbackType === 'car_request' ? "Which car would you like us to add? Include year, make, model (e.g., 2020 Toyota GR Supra)" :
                      "Share your thoughts..."
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                {/* Optional Email */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="feedback-email">
                    Email <span className={styles.optional}>(optional)</span>
                  </label>
                  <input
                    id="feedback-email"
                    type="email"
                    className={styles.input}
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className={styles.hint}>Include your email if you'd like us to follow up.</p>
                </div>

                {/* Error */}
                {error && (
                  <p className={styles.error}>{error}</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSubmitting || !feedbackType || !message.trim()}
                >
                  {isSubmitting ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <Icons.send size={16} />
                      <span>Send Feedback</span>
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

