'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [unsubscribeType, setUnsubscribeType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: unsubscribeType }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult({ success: true, message: data.message || 'Successfully unsubscribed' });
      } else {
        setResult({ success: false, message: data.error || 'Failed to unsubscribe' });
      }
    } catch (err) {
      setResult({ success: false, message: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoText}>AutoRev</span>
        </div>
        
        <h1 className={styles.title}>Email Preferences</h1>
        
        {result ? (
          <div className={`${styles.result} ${result.success ? styles.success : styles.error}`}>
            <p>{result.message}</p>
            {result.success && (
              <p className={styles.note}>
                You can always update your email preferences in your{' '}
                <a href="/profile">profile settings</a>.
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <p className={styles.description}>
              Choose which emails you'd like to unsubscribe from.
            </p>

            <div className={styles.field}>
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className={styles.options}>
              <label className={styles.option}>
                <input
                  type="radio"
                  name="type"
                  value="all"
                  checked={unsubscribeType === 'all'}
                  onChange={(e) => setUnsubscribeType(e.target.value)}
                />
                <span>Unsubscribe from all emails</span>
              </label>
              
              <label className={styles.option}>
                <input
                  type="radio"
                  name="type"
                  value="features"
                  checked={unsubscribeType === 'features'}
                  onChange={(e) => setUnsubscribeType(e.target.value)}
                />
                <span>Just feature updates & tips</span>
              </label>
              
              <label className={styles.option}>
                <input
                  type="radio"
                  name="type"
                  value="events"
                  checked={unsubscribeType === 'events'}
                  onChange={(e) => setUnsubscribeType(e.target.value)}
                />
                <span>Just event notifications</span>
              </label>
            </div>

            <button type="submit" className={styles.button} disabled={loading || !email}>
              {loading ? 'Processing...' : 'Update Preferences'}
            </button>
          </form>
        )}
        
        <div className={styles.footer}>
          <a href="/">← Back to AutoRev</a>
        </div>
      </div>
    </div>
  );
}

