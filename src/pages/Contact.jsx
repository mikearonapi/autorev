import React, { useState } from 'react';
import Button from '../components/Button';
import styles from './Contact.module.css';
import { submitLead, LEAD_SOURCES } from '../api/leadsClient.js';

// Icons
const MailIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const MessageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const interests = [
  { id: 'advisory', label: 'Sports Car Advisory' },
  { id: 'upgrades', label: 'Upgrade Planning' },
  { id: 'services', label: 'Upgrade Services' },
  { id: 'inspection', label: 'Pre-Purchase Inspection' },
  { id: 'other', label: 'Something Else' }
];

const faqs = [
  {
    question: 'How quickly do you respond?',
    answer: 'We typically respond within 24-48 hours. For urgent matters, please mention it in your message.'
  },
  {
    question: 'Do you work on all makes and models?',
    answer: 'We specialize in sports cars and performance vehicles, but we\'re happy to discuss any project. If it\'s not in our wheelhouse, we\'ll point you in the right direction.'
  },
  {
    question: 'Can you work with my budget?',
    answer: 'Absolutely. Whether you\'re spending $1K or $50K, we believe every enthusiast deserves honest guidance. We\'ll help you prioritize to get the most out of whatever you\'re working with.'
  },
  {
    question: 'Do you offer remote consultations?',
    answer: 'Yes! Our advisory services and build planning can be done remotely via video call. For hands-on work, we\'re based in [Location] and happy to discuss logistics.'
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
      const result = await submitLead({
        email: formData.email,
        name: formData.name,
        source: LEAD_SOURCES.CONTACT,
        interest: formData.interest,
        message: formData.message,
        metadata: {
          car: formData.car,
          interest: formData.interest,
          form_page: 'contact',
        },
      });
      
      if (result.success) {
        setSubmitted(true);
      } else {
        setSubmitError(result.error || 'Failed to send message. Please try again.');
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
        <div className={styles.container}>
          <span className={styles.badge}>Get in Touch</span>
          <h1 className={styles.title}>
            Let's Talk<br />
            <span className={styles.titleAccent}>Cars</span>
          </h1>
          <p className={styles.subtitle}>
            Have a question? Looking for honest advice? Just curious?
            Drop us a line—no obligation, no sales pitch.
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
                <div className={styles.successMessage}>
                  <div className={styles.successIcon}>
                    <MessageIcon />
                  </div>
                  <h2 className={styles.successTitle}>Message Sent!</h2>
                  <p className={styles.successText}>
                    Thanks for reaching out. We'll get back to you within 48 hours.
                    In the meantime, check out our Car Selector or Upgrade Advisory.
                  </p>
                  <div className={styles.successLinks}>
                    <Button to="/advisory" variant="primary" size="md">
                      Car Selector
                    </Button>
                    <Button to="/upgrades" variant="outline" size="md">
                      Plan Upgrades
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className={styles.form}>
                  <h2 className={styles.formTitle}>Send Us a Message</h2>

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
                  
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg" 
                    fullWidth
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              )}
            </div>

            {/* Info Sidebar */}
            <div className={styles.infoSection}>
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}><MailIcon /></div>
                <h3 className={styles.infoTitle}>Email Us</h3>
                <p className={styles.infoText}>info@supernaturalmotorsports.com</p>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoIcon}><ClockIcon /></div>
                <h3 className={styles.infoTitle}>Response Time</h3>
                <p className={styles.infoText}>Within 48 hours, usually sooner</p>
              </div>

              <div className={styles.expectCard}>
                <h3 className={styles.expectTitle}>What to Expect</h3>
                <ul className={styles.expectList}>
                  <li>Honest advice—no upselling</li>
                  <li>Budget-conscious recommendations</li>
                  <li>Real-world experience, not just spec sheets</li>
                  <li>Respect for your time and goals</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faq}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Common Questions</h2>
          </div>
          <div className={styles.faqGrid}>
            {faqs.map((faq, index) => (
              <div key={index} className={styles.faqItem}>
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

