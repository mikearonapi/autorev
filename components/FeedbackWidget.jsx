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

import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';

import Image from 'next/image';

import html2canvas from 'html2canvas';
import { createPortal } from 'react-dom';

// Feedback category colors - matching design system tokens
const FEEDBACK_COLORS = {
  error: '#ef4444', // var(--color-error) - Bugs, blocking issues
  success: '#10b981', // var(--color-accent-teal) - Features, positive
  warning: '#f59e0b', // var(--color-warning) - Data issues, major
  neutral: '#6b7280', // General, minor
};

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

  const openFeedback = useCallback(
    ({
      context = null,
      preselectedCategory = null,
      preselectedType = null,
      customHint = null,
    } = {}) => {
      setFeedbackConfig({ context, preselectedCategory, preselectedType, customHint });
      setIsOpen(true);
    },
    []
  );

  const openCarRequest = useCallback((customHint = null) => {
    setFeedbackConfig({
      context: 'car-request',
      preselectedCategory: 'feature',
      preselectedType: 'car_request',
      customHint: customHint || "Tell us which car you'd like to see added to our database.",
    });
    setIsOpen(true);
  }, []);

  const openBugReport = useCallback((customHint = null) => {
    setFeedbackConfig({
      context: 'bug-report',
      preselectedCategory: 'bug',
      preselectedType: 'bug',
      customHint: customHint || "Describe what went wrong and we'll fix it ASAP.",
    });
    setIsOpen(true);
  }, []);

  const closeFeedback = useCallback(() => {
    setIsOpen(false);
    // Reset config after close animation
    setTimeout(() => {
      setFeedbackConfig({
        context: null,
        preselectedCategory: null,
        preselectedType: null,
        customHint: null,
      });
    }, 300);
  }, []);

  return (
    <FeedbackContext.Provider
      value={{ openFeedback, openCarRequest, openBugReport, closeFeedback, isOpen }}
    >
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
// ICONS - Using shared Icons library
// ============================================================================

import { Icons } from '@/components/ui/Icons';

import styles from './FeedbackWidget.module.css';
import { useAuth } from './providers/AuthProvider';

// ============================================================================
// CATEGORY & SEVERITY OPTIONS
// ============================================================================

const categories = [
  {
    id: 'bug',
    label: 'Bug Report',
    icon: Icons.bug,
    color: FEEDBACK_COLORS.error,
    description: 'Something is broken',
  },
  {
    id: 'feature',
    label: 'Feature Request',
    icon: Icons.lightbulb,
    color: FEEDBACK_COLORS.success,
    description: 'I have an idea',
  },
  {
    id: 'data',
    label: 'Data Issue',
    icon: Icons.database,
    color: FEEDBACK_COLORS.warning,
    description: 'Wrong or missing data',
  },
  {
    id: 'general',
    label: 'General',
    icon: Icons.message,
    color: '#6b7280',
    description: 'Other feedback',
  },
  {
    id: 'praise',
    label: 'Praise',
    icon: Icons.heart,
    color: '#ec4899',
    description: 'Something I love',
  },
];

const severities = [
  {
    id: 'blocking',
    label: 'Blocking',
    description: "Can't use the feature at all",
    color: FEEDBACK_COLORS.error,
  },
  {
    id: 'major',
    label: 'Major',
    description: 'Significant impact on usage',
    color: FEEDBACK_COLORS.warning,
  },
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
    browser: /Chrome/.test(ua)
      ? 'Chrome'
      : /Firefox/.test(ua)
        ? 'Firefox'
        : /Safari/.test(ua)
          ? 'Safari'
          : /Edge/.test(ua)
            ? 'Edge'
            : 'Other',
    os: /Windows/.test(ua)
      ? 'Windows'
      : /Mac/.test(ua)
        ? 'macOS'
        : /Linux/.test(ua)
          ? 'Linux'
          : /iOS/.test(ua)
            ? 'iOS'
            : /Android/.test(ua)
              ? 'Android'
              : 'Other',
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
  garage: {
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

// Beta welcome message
const BETA_MESSAGE =
  'While in beta, we really appreciate all feedback so we can create the best possible experience for you and our enthusiast car community. Please take the time to share as much with us so we can create the best possible experience.';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FeedbackWidget({
  context = null,
  preselectedCategory = null,
  preselectedType: _preselectedType = null,
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

  // Screenshot state
  const [screenshotPreview, setScreenshotPreview] = useState(null); // base64 for preview
  const [screenshotUrl, setScreenshotUrl] = useState(null); // uploaded URL
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const _widgetRef = useRef(null);

  // Portal mounting - required for SSR compatibility
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get auth context
  const { user, isAuthenticated: _isAuthenticated, userTier } = useAuth();

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
        setScreenshotPreview(null);
        setScreenshotUrl(null);
        if (isSuccess) setIsSuccess(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isSuccess, preselectedCategory]);

  // Capture screenshot of the page (hides the feedback widget first)
  const captureScreenshot = async () => {
    if (typeof window === 'undefined') return;

    setIsCapturingScreenshot(true);
    setError(null);

    try {
      // Temporarily hide the widget overlay for screenshot
      const overlay = document.querySelector(`.${styles.overlay}`);
      if (overlay) {
        overlay.style.visibility = 'hidden';
      }

      // Small delay to ensure widget is hidden
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Capture the page
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        scale: Math.min(window.devicePixelRatio || 1, 2), // Limit scale for performance
        width: window.innerWidth,
        height: window.innerHeight,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        x: window.scrollX,
        y: window.scrollY,
      });

      // Restore widget visibility
      if (overlay) {
        overlay.style.visibility = 'visible';
      }

      // Convert to base64
      const base64Image = canvas.toDataURL('image/png', 0.9);
      setScreenshotPreview(base64Image);

      // Upload to blob storage
      setIsUploadingScreenshot(true);

      const uploadResponse = await fetch('/api/feedback/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenshot: base64Image,
          metadata: {
            pageUrl: window.location.href,
            pageTitle: document.title,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            scrollPosition: `${window.scrollX},${window.scrollY}`,
            capturedAt: new Date().toISOString(),
          },
        }),
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success) {
        console.warn('[FeedbackWidget] Screenshot upload failed:', uploadResult.error);
        // Keep preview but note upload failed - we can still show it locally
        setError('Screenshot captured but upload failed. It will be included as preview only.');
      } else {
        setScreenshotUrl(uploadResult.data.url);
      }
    } catch (err) {
      console.error('[FeedbackWidget] Screenshot capture error:', err);
      setError('Failed to capture screenshot. Please try again.');
      setScreenshotPreview(null);
    } finally {
      setIsCapturingScreenshot(false);
      setIsUploadingScreenshot(false);
    }
  };

  // Remove screenshot
  const removeScreenshot = () => {
    setScreenshotPreview(null);
    setScreenshotUrl(null);
  };

  // Open screenshot in new tab for full view
  const viewScreenshot = () => {
    if (screenshotPreview) {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>Feedback Screenshot Preview</title></head>
            <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#1a1a1a;">
              <img src="${screenshotPreview}" style="max-width:100%;max-height:100vh;object-fit:contain;" />
            </body>
          </html>
        `);
      }
    }
  };

  // Handle form submission
  const handleFeedbackSubmit = async (e) => {
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
        bug: 'bug',
        feature: 'feature',
        data: 'other',
        general: 'other',
        praise: 'like',
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
        email: email || user?.email || null,

        // Screenshot
        screenshot_url: screenshotUrl || null,
        screenshot_metadata: screenshotUrl
          ? {
              capturedAt: new Date().toISOString(),
              pageUrl,
              viewport:
                typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : null,
            }
          : null,

        // Common fields
        page_url: pageUrl,
        page_title: typeof document !== 'undefined' ? document.title : '',
        metadata: {
          sessionId: getSessionId(),
          browserInfo: getBrowserInfo(),
          screenWidth: typeof window !== 'undefined' ? window.innerWidth : null,
          screenHeight: typeof window !== 'undefined' ? window.innerHeight : null,
          hasScreenshot: !!screenshotUrl,
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
        return "Describe the feature you'd like to see...";
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

      {/* Full-Screen Overlay - Rendered via Portal */}
      {isOpen &&
        isMounted &&
        createPortal(
          <div className={styles.overlay} onClick={handleClose} data-overlay-modal>
            <div className={styles.widget} onClick={(e) => e.stopPropagation()}>
              {/* Close Button - Floating */}
              <button className={styles.closeButton} onClick={handleClose} aria-label="Close">
                <Icons.x size={24} />
              </button>

              {/* Content */}
              {isSuccess ? (
                <div className={styles.success}>
                  <div className={styles.successIcon}>
                    <Icons.check size={40} />
                  </div>
                  <h2 className={styles.successTitle}>Thank You!</h2>
                  <p>Thanks for sharing your feedback!</p>
                  <p className={styles.successSubtext}>
                    {category === 'bug' && severity === 'blocking'
                      ? "We'll prioritize this and get back to you ASAP."
                      : "We'll review your feedback and use it to improve AutoRev."}
                  </p>
                </div>
              ) : (
                <div className={styles.content}>
                  {/* Header Section */}
                  <div className={styles.header}>
                    <div className={styles.headerIcon}>
                      <Icons.messageSquare size={28} />
                    </div>
                    <h2 className={styles.title}>{contextConfig.title}</h2>
                    <p className={styles.betaMessage}>{BETA_MESSAGE}</p>
                  </div>

                  {/* Form Section */}
                  <form onSubmit={handleFeedbackSubmit} className={styles.form}>
                    {/* Contextual Hint */}
                    {(customHint || contextConfig.hint) && (
                      <p className={styles.contextHint}>{customHint || contextConfig.hint}</p>
                    )}

                    {/* Category Selection */}
                    <div className={styles.field}>
                      <label className={styles.label}>
                        What's this about? <span className={styles.required}>*</span>
                      </label>
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
                          <span>
                            How severe is this? <span className={styles.required}>*</span>
                          </span>
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

                    {/* Screenshot Capture */}
                    <div className={styles.field}>
                      <label className={styles.label}>
                        <Icons.camera size={16} />
                        <span>
                          Screenshot <span className={styles.optional}>(optional)</span>
                        </span>
                      </label>

                      <div className={styles.screenshotSection}>
                        {!screenshotPreview && !isCapturingScreenshot && !isUploadingScreenshot && (
                          <button
                            type="button"
                            className={styles.screenshotButton}
                            onClick={captureScreenshot}
                            disabled={isCapturingScreenshot || isUploadingScreenshot}
                          >
                            <Icons.camera size={18} />
                            <span>Capture Current Page</span>
                          </button>
                        )}

                        {(isCapturingScreenshot || isUploadingScreenshot) && (
                          <div className={styles.screenshotUploading}>
                            <div className={styles.spinner} />
                            <span>{isCapturingScreenshot ? 'Capturing...' : 'Uploading...'}</span>
                          </div>
                        )}

                        {screenshotPreview && !isUploadingScreenshot && (
                          <>
                            <div className={styles.screenshotPreview}>
                              <Image
                                src={screenshotPreview}
                                alt="Screenshot preview"
                                width={200}
                                height={150}
                                className={styles.screenshotImage}
                                style={{ objectFit: 'cover' }}
                                unoptimized
                              />
                              <div className={styles.screenshotOverlay}>
                                <button
                                  type="button"
                                  className={styles.screenshotView}
                                  onClick={viewScreenshot}
                                >
                                  <Icons.eye size={14} />
                                  <span>View</span>
                                </button>
                                <button
                                  type="button"
                                  className={styles.screenshotRemove}
                                  onClick={removeScreenshot}
                                >
                                  <Icons.trash size={14} />
                                  <span>Remove</span>
                                </button>
                              </div>
                            </div>
                            {screenshotUrl && (
                              <div className={styles.screenshotSuccess}>
                                <Icons.checkCircle size={14} />
                                <span>
                                  Screenshot attached and will be included with your feedback
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <p className={styles.hint}>
                        <Icons.info size={12} />
                        <span>
                          Captures what you see on the page to help us understand the issue
                        </span>
                      </p>
                    </div>

                    {/* Email (optional) */}
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="feedback-email">
                        Email <span className={styles.optional}>(optional)</span>
                      </label>
                      <input
                        id="feedback-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
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
                            <Icons.star size={24} filled={star <= (hoverRating || rating)} />
                          </button>
                        ))}
                        {rating > 0 && (
                          <span className={styles.ratingText}>
                            {rating === 5
                              ? 'Excellent!'
                              : rating === 4
                                ? 'Great!'
                                : rating === 3
                                  ? 'Good'
                                  : rating === 2
                                    ? 'Fair'
                                    : 'Poor'}
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
                      <span>
                        Auto-captured: page, browser,{' '}
                        {getCarContextFromUrl(
                          typeof window !== 'undefined' ? window.location.href : ''
                        )
                          ? 'car context'
                          : 'context'}
                      </span>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      className={styles.submitButton}
                      disabled={
                        isSubmitting ||
                        !category ||
                        !message.trim() ||
                        (category === 'bug' && !severity)
                      }
                    >
                      {isSubmitting ? (
                        <span>Sending...</span>
                      ) : (
                        <>
                          <Icons.send size={18} />
                          <span>Submit Feedback</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
