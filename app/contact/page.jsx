'use client';

import { useState } from 'react';
import Button from '@/components/Button';
import styles from './page.module.css';
import { submitLead, LEAD_SOURCES } from '@/lib/leadsClient.js';

// Icons (Lucide style - matches community/AL pages)
const Icons = {
  mail: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  clock: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
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
  users: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  shield: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  heart: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
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

const faqs = [
  {
    question: 'How quickly do you respond?',
    answer: 'We typically respond within 24-48 hours. For urgent matters, mention it in your message and we\'ll prioritize.'
  },
  {
    question: 'What kind of questions can I ask?',
    answer: "Anything car-related. Questions about AL's answers, need help with the Car Selector, curious about performance upgrades, or just want to talk shop—we're here for it."
  },
  {
    question: 'Do you sell parts or services?',
    answer: "Nope. AutoRev is a data platform, not a shop. We help you make informed decisions, but we don't sell parts, services, or have affiliate relationships. Just honest information."
  },
  {
    question: 'Can I suggest features or report bugs?',
    answer: "Absolutely. We're constantly improving based on user feedback. Tell us what's broken, what's missing, or what would make your experience better."
  }
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
    
    try {
      // 1. Send email notification
      const emailResponse = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          interest: formData.interest,
          car: formData.car,
          message: formData.message,
        }),
      });
      
      const emailResult = await emailResponse.json();
      
      if (!emailResult.success) {
        console.warn('[Contact] Email failed, but continuing with database logging:', emailResult.error);
      }
      
      // 2. Save to leads table for CRM tracking
      const leadResult = await submitLead({
        email: formData.email,
        name: formData.name,
        source: LEAD_SOURCES.CONTACT,
        metadata: {
          car: formData.car,
          interest: formData.interest,
          form_page: 'contact',
          email_sent: emailResult.success,
          message: formData.message,
        },
      });
      
      if (!leadResult.success) {
        console.warn('[Contact] Lead capture failed:', leadResult.error);
      }
      
      // 3. Save to user_feedback table for analytics and tracking
      const feedbackResponse = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback_type: 'question',
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
          },
        }),
      });
      
      const feedbackResult = await feedbackResponse.json();
      
      if (!feedbackResult.success) {
        console.warn('[Contact] Feedback logging failed:', feedbackResult.error);
      }
      
      // Consider success if email OR database logging succeeded
      if (emailResult.success || leadResult.success || feedbackResult.success) {
        setSubmitted(true);
      } else {
        setSubmitError('Failed to send message. Please try again or email us directly.');
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
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <span className={styles.badge}>Get in Touch</span>
          <h1 className={styles.heroTitle}>
            Let&apos;s Talk <span className={styles.titleAccent}>Cars</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Questions? Looking for straight-up honest advice? Just want to talk shop?
            We&apos;re here to help—no sales pitch, no ego, just drivers helping drivers.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className={styles.main}>
        <div className={styles.container}>
          <div className={styles.grid}>
            {/* Contact Form */}
            <div className={styles.formSection}>
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
                    <Button href="/car-selector" variant="primary" size="lg">
                      Your Sportscar Match
                      <Icons.arrowRight size={16} />
                    </Button>
                    <Button href="/browse-cars" variant="outline" size="lg">
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
                      variant="primary" 
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

            {/* Info Sidebar */}
            <div className={styles.infoSection}>
              <div className={styles.infoCard}>
                <div className={styles.cardIcon}>
                  <Icons.clock size={24} />
                </div>
                <h3 className={styles.cardTitle}>Response Time</h3>
                <p className={styles.cardText}>Within 48 hours, usually sooner</p>
              </div>

              <div className={styles.valuesCard}>
                <div className={styles.valuesHeader}>
                  <div className={styles.valuesIconWrapper}>
                    <Icons.shield size={20} />
                  </div>
                  <h3 className={styles.valuesTitle}>How We Operate</h3>
                </div>
                <ul className={styles.valuesList}>
                  <li>
                    <Icons.checkCircle size={16} />
                    <span>Straight talk—no BS, no upselling</span>
                  </li>
                  <li>
                    <Icons.users size={16} />
                    <span>Respect for every budget, every build</span>
                  </li>
                  <li>
                    <Icons.messageCircle size={16} />
                    <span>Real experience, not keyboard warrior advice</span>
                  </li>
                  <li>
                    <Icons.heart size={16} />
                    <span>We compete with honor—and help you do the same</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Common Questions</h2>
            <p className={styles.sectionSubtitle}>
              Everything you need to know about getting in touch
            </p>
          </div>
          <div className={styles.faqGrid}>
            {faqs.map((faq, index) => (
              <div key={index} className={styles.faqCard}>
                <h3 className={styles.faqQuestion}>{faq.question}</h3>
                <p className={styles.faqAnswer}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

