'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/Button';
import styles from './page.module.css';
import legalStyles from '@/styles/legal-page.module.css';
import { submitLead, LEAD_SOURCES } from '@/lib/leadsClient.js';

// Icons (Lucide style - matches community/AL pages)
const Icons = {
  messageCircle: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
  ),
  checkCircle: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  ),
  arrowRight: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
};

const interests = [
  { id: 'al-question', label: 'Question about AL (AI)' },
  { id: 'car-selector', label: 'Car Selector Help' },
  { id: 'bug-report', label: 'Bug or Issue' },
  { id: 'feature-request', label: 'Feature Suggestion' },
  { id: 'general', label: 'General Question' },
];


export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    interest: '',
    car: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    
    // Track which saves succeeded for debugging
    const saveResults = {
      leads: false,
      feedback: false,
      email: false,
    };
    
    try {
      // PRIORITY 1: Save to leads table (CRM tracking) - this is critical
      try {
        const leadResult = await submitLead({
          email: formData.email,
          name: formData.name,
          source: LEAD_SOURCES.CONTACT,
          metadata: {
            car: formData.car,
            interest: formData.interest,
            form_page: 'contact',
            message: formData.message,
            submitted_at: new Date().toISOString(),
          },
        });
        saveResults.leads = leadResult.success;
        if (!leadResult.success) {
          console.warn('[Contact] Lead capture failed:', leadResult.error);
        }
      } catch (leadErr) {
        console.error('[Contact] Lead capture error:', leadErr);
      }
      
      // PRIORITY 2: Save to user_feedback table (support tracking) - also critical
      try {
        const feedbackResponse = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            feedback_type: 'question',
            category: 'general',
            message: formData.message,
            email: formData.email,
            page_url: '/contact',
            page_title: 'Contact Us',
            car_slug: null,
            tags: ['contact-form', formData.interest].filter(Boolean),
            metadata: {
              name: formData.name,
              car: formData.car,
              interest: formData.interest,
              source: 'contact-page',
            },
          }),
        });
        const feedbackResult = await feedbackResponse.json();
        saveResults.feedback = feedbackResult.success;
        if (!feedbackResult.success) {
          console.warn('[Contact] Feedback logging failed:', feedbackResult.error);
        }
      } catch (feedbackErr) {
        console.error('[Contact] Feedback logging error:', feedbackErr);
      }
      
      // PRIORITY 3: Send email notification (fire-and-forget, non-blocking)
      // Email is nice-to-have but database saves are what matter
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          interest: formData.interest,
          car: formData.car,
          message: formData.message,
        }),
      })
        .then(res => res.json())
        .then(result => {
          saveResults.email = result.success;
          if (!result.success) {
            console.warn('[Contact] Email notification failed:', result.error);
          }
        })
        .catch(err => console.error('[Contact] Email notification error:', err));
      
      // Success if at least ONE database save succeeded
      // (leads OR feedback - email doesn't count as it's just notification)
      if (saveResults.leads || saveResults.feedback) {
        console.log('[Contact] Submission saved successfully:', saveResults);
        setSubmitted(true);
      } else {
        console.error('[Contact] All database saves failed:', saveResults);
        setSubmitError('Failed to send message. Please try again or email us directly at contact@autorev.app');
      }
    } catch (err) {
      console.error('[Contact] Error submitting form:', err);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Hero-style Header - matches homepage */}
      <header className={legalStyles.heroHeader}>
        <Link href="/" className={legalStyles.logo}>
          <span className={legalStyles.logoAuto}>AUTO</span>
          <span className={legalStyles.logoRev}>REV</span>
        </Link>
      </header>

      {/* Main Content */}
      <section className={styles.main}>
        <div className={styles.container}>
          <div className={styles.formWrapper}>
            {submitted ? (
                <div className={styles.successCard}>
                  <div className={styles.successIcon}>
                    <Icons.checkCircle size={48} />
                  </div>
                  <h2 className={styles.successTitle}>Message Sent!</h2>
                  <p className={styles.successText}>
                    Thanks for reaching out. We&apos;ll get back to you within 48 hours.
                    In the meantime, check out our Car Selector or Upgrade Planner.
                  </p>
                  <div className={styles.successLinks}>
                    <Button href="/car-selector" variant="secondary" size="lg">
                      Your Sportscar Match
                      <Icons.arrowRight size={16} />
                    </Button>
                    <Button href="/browse-cars" variant="outlineLight" size="lg">
                      Browse Cars
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className={styles.form}>
                  <div className={styles.formHeader}>
                    <h2 className={styles.formTitle}>Send Us a Message</h2>
                    <p className={styles.formDescription}>
                      We read every message and respond within 48 hours.
                    </p>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="name" className={styles.label}>Name *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className={styles.input}
                        placeholder="Your name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="email" className={styles.label}>Email *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className={styles.input}
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>What are you interested in?</label>
                    <div className={styles.interestGrid}>
                      {interests.map(item => (
                        <label key={item.id} className={styles.interestItem}>
                          <input
                            type="radio"
                            name="interest"
                            value={item.id}
                            checked={formData.interest === item.id}
                            onChange={handleChange}
                            className={styles.radio}
                          />
                          <span className={styles.interestLabel}>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="car" className={styles.label}>Your Car (optional)</label>
                    <input
                      type="text"
                      id="car"
                      name="car"
                      className={styles.input}
                      placeholder="e.g., 2019 Mustang GT, considering a Cayman..."
                      value={formData.car}
                      onChange={handleChange}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="message" className={styles.label}>Message *</label>
                    <textarea
                      id="message"
                      name="message"
                      className={styles.textarea}
                      placeholder="Tell us what you're looking for..."
                      rows="5"
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {submitError && (
                    <div className={styles.errorMessage}>
                      {submitError}
                    </div>
                  )}
                  
                  <div className={styles.formActions}>
                    <Button 
                      type="submit" 
                      variant="secondary" 
                      size="lg" 
                      fullWidth
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Icons.messageCircle size={18} />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Message
                          <Icons.arrowRight size={18} />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
          </div>
        </div>
      </section>

      {/* Site Footer */}
      <footer className={legalStyles.footer}>
        {/* Social Icons */}
        <div className={legalStyles.footerSocial}>
          <a 
            href="https://www.instagram.com/autorev.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className={legalStyles.socialIcon}
            aria-label="Follow us on Instagram"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
          <a 
            href="https://www.facebook.com/profile.php?id=61585868463925" 
            target="_blank" 
            rel="noopener noreferrer"
            className={legalStyles.socialIcon}
            aria-label="Follow us on Facebook"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
        </div>

        <div className={legalStyles.footerLinks}>
          <div className={legalStyles.footerSection}>
            <h4 className={legalStyles.footerSectionTitle}>INFO</h4>
            <Link href="/terms">Terms & Conditions</Link>
            <Link href="/privacy">Privacy Policy</Link>
          </div>
          <div className={legalStyles.footerSection}>
            <h4 className={legalStyles.footerSectionTitle}>CONTACT</h4>
            <Link href="/contact">Support</Link>
          </div>
        </div>
        <p className={legalStyles.footerCopyright}>© 2026 AUTOREV</p>
      </footer>
    </div>
  );
}
