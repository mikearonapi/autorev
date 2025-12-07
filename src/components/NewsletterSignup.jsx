import React, { useState } from 'react';
import styles from './NewsletterSignup.module.css';
import { submitLead, LEAD_SOURCES } from '../api/leadsClient.js';

/**
 * Non-gated newsletter signup component
 * Can be used in footer, hero pages, or other locations
 */
export default function NewsletterSignup({ 
  variant = 'default', // 'default', 'compact', 'inline'
  source = LEAD_SOURCES.NEWSLETTER,
  carSlug = null,
  title = 'Stay Updated',
  description = 'Get expert insights, market updates, and tips delivered to your inbox.',
  buttonText = 'Subscribe',
  successText = 'Thanks! You\'re on the list.',
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setErrorMessage('Please enter your email');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      const result = await submitLead({
        email,
        source,
        carSlug,
        metadata: {
          signup_variant: variant,
        },
      });

      if (result.success) {
        setStatus('success');
        setEmail('');
      } else {
        setErrorMessage(result.error || 'Something went wrong');
        setStatus('error');
      }
    } catch (err) {
      console.error('[NewsletterSignup] Error:', err);
      setErrorMessage('Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  const containerClass = `${styles.container} ${styles[variant]}`;

  // Success state
  if (status === 'success') {
    return (
      <div className={containerClass}>
        <div className={styles.successState}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span>{successText}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {variant !== 'compact' && (
        <div className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {description && <p className={styles.description}>{description}</p>}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputWrapper}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            className={`${styles.input} ${status === 'error' ? styles.inputError : ''}`}
            disabled={status === 'submitting'}
          />
          <button 
            type="submit" 
            className={styles.button}
            disabled={status === 'submitting'}
          >
            {status === 'submitting' ? (
              <span className={styles.spinner}></span>
            ) : (
              buttonText
            )}
          </button>
        </div>
        
        {status === 'error' && errorMessage && (
          <p className={styles.error}>{errorMessage}</p>
        )}
      </form>
      
      <p className={styles.privacy}>
        We respect your privacy. Unsubscribe anytime.
      </p>
    </div>
  );
}

