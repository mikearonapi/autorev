'use client';

import { useState, useEffect, Suspense } from 'react';

import { useSearchParams } from 'next/navigation';

import styles from './page.module.css';

/**
 * Unsubscribe Status States
 */
const STATUS = {
  LOADING: 'loading',
  READY: 'ready',
  SUCCESS: 'success',
  ALREADY_UNSUBSCRIBED: 'already_unsubscribed',
  RESUBSCRIBED: 'resubscribed',
  ERROR: 'error',
  INVALID_TOKEN: 'invalid_token',
  EXPIRED_TOKEN: 'expired_token',
};

/**
 * UnsubscribeForm - Handles token-based unsubscribe flow
 */
function UnsubscribeForm() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(STATUS.LOADING);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [unsubscribeType, setUnsubscribeType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const errorParam = searchParams.get('error');

    if (errorParam === 'missing_token' || errorParam === 'invalid') {
      setStatus(STATUS.INVALID_TOKEN);
      setMessage('This unsubscribe link is invalid. Please use the link from your most recent email.');
      return;
    }

    if (tokenParam) {
      setToken(tokenParam);
      setStatus(STATUS.READY);
    } else {
      setStatus(STATUS.INVALID_TOKEN);
      setMessage('No unsubscribe token provided. Please use the link from your email.');
    }
  }, [searchParams]);

  const handleUnsubscribe = async (e) => {
    e.preventDefault();
    if (!token || loading) return;

    setLoading(true);

    try {
      const response = await fetch('/api/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, type: unsubscribeType, action: 'unsubscribe' }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setEmail(data.email || '');
        if (data.alreadyUnsubscribed) {
          setStatus(STATUS.ALREADY_UNSUBSCRIBED);
          setMessage(data.message);
        } else {
          setStatus(STATUS.SUCCESS);
          setMessage(data.message);
        }
      } else {
        if (data.code === 'expired_token') {
          setStatus(STATUS.EXPIRED_TOKEN);
        } else {
          setStatus(STATUS.ERROR);
        }
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus(STATUS.ERROR);
      setMessage('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleResubscribe = async () => {
    if (!token || loading) return;

    setLoading(true);

    try {
      const response = await fetch('/api/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'resubscribe' }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setEmail(data.email || '');
        setStatus(STATUS.RESUBSCRIBED);
        setMessage(data.message || 'You have been resubscribed to AutoRev emails.');
      } else {
        setStatus(STATUS.ERROR);
        setMessage(data.error || 'Failed to resubscribe. Please try again.');
      }
    } catch {
      setStatus(STATUS.ERROR);
      setMessage('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Invalid/Expired Token State
  if (status === STATUS.INVALID_TOKEN || status === STATUS.EXPIRED_TOKEN) {
    return (
      <div 
        className={styles.result} 
        role="alert" 
        aria-live="polite"
      >
        <div className={styles.errorIcon}>!</div>
        <h2 className={styles.resultTitle}>
          {status === STATUS.EXPIRED_TOKEN ? 'Link Expired' : 'Invalid Link'}
        </h2>
        <p className={styles.resultMessage}>{message}</p>
        <p className={styles.helpText}>
          Need help? <a href="/contact">Contact support</a>
        </p>
      </div>
    );
  }

  // Success State
  if (status === STATUS.SUCCESS) {
    return (
      <div 
        className={`${styles.result} ${styles.success}`} 
        role="status" 
        aria-live="polite"
      >
        <div className={styles.successIcon}>✓</div>
        <h2 className={styles.resultTitle}>You&apos;ve been unsubscribed</h2>
        <p className={styles.resultMessage}>
          {message}
          {email && <span className={styles.emailDisplay}> ({email})</span>}
        </p>
        <div className={styles.resubscribeSection}>
          <p className={styles.resubscribePrompt}>Changed your mind?</p>
          <button 
            onClick={handleResubscribe} 
            className={styles.resubscribeButton}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Re-subscribe'}
          </button>
        </div>
      </div>
    );
  }

  // Already Unsubscribed State
  if (status === STATUS.ALREADY_UNSUBSCRIBED) {
    return (
      <div 
        className={`${styles.result} ${styles.info}`} 
        role="status" 
        aria-live="polite"
      >
        <div className={styles.infoIcon}>ℹ</div>
        <h2 className={styles.resultTitle}>Already Unsubscribed</h2>
        <p className={styles.resultMessage}>
          {message}
          {email && <span className={styles.emailDisplay}> ({email})</span>}
        </p>
        <div className={styles.resubscribeSection}>
          <p className={styles.resubscribePrompt}>Want to receive emails again?</p>
          <button 
            onClick={handleResubscribe} 
            className={styles.resubscribeButton}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Re-subscribe'}
          </button>
        </div>
      </div>
    );
  }

  // Resubscribed State
  if (status === STATUS.RESUBSCRIBED) {
    return (
      <div 
        className={`${styles.result} ${styles.success}`} 
        role="status" 
        aria-live="polite"
      >
        <div className={styles.successIcon}>✓</div>
        <h2 className={styles.resultTitle}>Welcome Back!</h2>
        <p className={styles.resultMessage}>
          {message}
          {email && <span className={styles.emailDisplay}> ({email})</span>}
        </p>
        <p className={styles.note}>
          You can manage your email preferences anytime in your{' '}
          <a href="/settings">settings</a>.
        </p>
      </div>
    );
  }

  // Error State
  if (status === STATUS.ERROR) {
    return (
      <div 
        className={`${styles.result} ${styles.error}`} 
        role="alert" 
        aria-live="assertive"
      >
        <div className={styles.errorIcon}>!</div>
        <h2 className={styles.resultTitle}>Something went wrong</h2>
        <p className={styles.resultMessage}>{message}</p>
        <p className={styles.helpText}>
          Please try again or <a href="/contact">contact support</a>.
        </p>
      </div>
    );
  }

  // Loading State
  if (status === STATUS.LOADING) {
    return (
      <div className={styles.loadingState} aria-busy="true">
        <div className={styles.spinner} />
        <p>Loading...</p>
      </div>
    );
  }

  // Ready State - Show Form
  return (
    <form onSubmit={handleUnsubscribe} className={styles.form}>
      <p className={styles.description}>
        Choose which emails you&apos;d like to unsubscribe from.
      </p>

      <fieldset className={styles.options}>
        <legend className={styles.visuallyHidden}>Unsubscribe options</legend>
        
        <label className={styles.option}>
          <input
            type="radio"
            name="type"
            value="all"
            checked={unsubscribeType === 'all'}
            onChange={(e) => setUnsubscribeType(e.target.value)}
          />
          <span className={styles.optionContent}>
            <span className={styles.optionLabel}>Unsubscribe from all emails</span>
            <span className={styles.optionHint}>Stop receiving all marketing emails</span>
          </span>
        </label>
        
        <label className={styles.option}>
          <input
            type="radio"
            name="type"
            value="features"
            checked={unsubscribeType === 'features'}
            onChange={(e) => setUnsubscribeType(e.target.value)}
          />
          <span className={styles.optionContent}>
            <span className={styles.optionLabel}>Just feature updates & tips</span>
            <span className={styles.optionHint}>Still receive event notifications</span>
          </span>
        </label>
        
        <label className={styles.option}>
          <input
            type="radio"
            name="type"
            value="events"
            checked={unsubscribeType === 'events'}
            onChange={(e) => setUnsubscribeType(e.target.value)}
          />
          <span className={styles.optionContent}>
            <span className={styles.optionLabel}>Just event notifications</span>
            <span className={styles.optionHint}>Still receive feature updates</span>
          </span>
        </label>
      </fieldset>

      <button 
        type="submit" 
        className={styles.button} 
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? 'Processing...' : 'Update Preferences'}
      </button>
    </form>
  );
}

/**
 * Loading fallback for Suspense
 */
function FormLoading() {
  return (
    <div className={styles.loadingState} aria-busy="true">
      <div className={styles.spinner} />
      <p>Loading...</p>
    </div>
  );
}

/**
 * UnsubscribePage - Main page component
 */
export default function UnsubscribePage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoText}>AutoRev</span>
        </div>
        
        <h1 className={styles.title}>Email Preferences</h1>
        
        <Suspense fallback={<FormLoading />}>
          <UnsubscribeForm />
        </Suspense>
        
        <div className={styles.footer}>
          <a href="/">← Back to AutoRev</a>
        </div>
      </div>
    </div>
  );
}
