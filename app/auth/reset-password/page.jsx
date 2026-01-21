'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';
import { Icons } from '@/components/ui/Icons';

/**
 * Password validation
 */
function validatePassword(password) {
  if (!password) return { isValid: false, message: '', strength: 0 };
  if (password.length < 8) {
    return { isValid: false, message: 'At least 8 characters required', strength: 1 };
  }
  
  let strength = 1;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  
  return { isValid: true, message: '', strength: Math.min(strength, 4) };
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(null);

  // Check if we have a valid recovery session
  useEffect(() => {
    async function checkSession() {
      // Supabase automatically processes the recovery token from URL hash
      // and establishes a session if valid
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[ResetPassword] Session error:', error);
        setIsValidSession(false);
        return;
      }
      
      // Check if this is a recovery session
      // The session will exist if the recovery link was valid
      if (session) {
        setIsValidSession(true);
      } else {
        // No session - might need to wait for hash processing
        // Listen for auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY') {
            setIsValidSession(true);
          } else if (event === 'SIGNED_IN' && session) {
            // Recovery flow completed, session established
            setIsValidSession(true);
          }
        });
        
        // Give it a moment to process the URL hash
        setTimeout(() => {
          if (isValidSession === null) {
            setIsValidSession(false);
          }
        }, 3000);
        
        return () => subscription.unsubscribe();
      }
    }
    
    checkSession();
  }, []);

  const passwordValidation = validatePassword(password);
  const strengthColors = ['#dc2626', '#f59e0b', '#eab308', '#22c55e'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!passwordValidation.isValid) {
      setError(passwordValidation.message || 'Please enter a valid password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message || 'Failed to update password');
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      
      // Sign out to clear the recovery session, then redirect to login
      setTimeout(async () => {
        await supabase.auth.signOut();
        router.push('/garage?auth=signin');
      }, 3000);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Verifying your reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid or expired link
  if (isValidSession === false) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.iconWrapper} style={{ background: 'var(--color-error-light)' }}>
            <Icons.alertCircle size={32} />
          </div>
          <h1 className={styles.title}>Link Expired</h1>
          <p className={styles.subtitle}>
            This password reset link has expired or is invalid. 
            Please request a new one.
          </p>
          <Link href="/garage?auth=signin" className={styles.primaryBtn}>
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.iconWrapper} style={{ background: 'var(--color-success-light)' }}>
            <Icons.checkCircle size={48} />
          </div>
          <h1 className={styles.title}>Password Updated</h1>
          <p className={styles.subtitle}>
            Your password has been successfully reset. 
            Redirecting you to sign in...
          </p>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <Icons.lock size={32} />
        </div>
        <h1 className={styles.title}>Reset Your Password</h1>
        <p className={styles.subtitle}>
          Enter a new password for your account
        </p>

        {error && (
          <div className={styles.error}>
            <Icons.alertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="password">New Password</label>
            <div className={styles.inputWrapper}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                disabled={isSubmitting}
                autoComplete="new-password"
                autoFocus
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <Icons.eyeOff size={18} /> : <Icons.eye size={18} />}
              </button>
            </div>
            
            {/* Password strength indicator */}
            {password && (
              <div className={styles.passwordStrength}>
                <div className={styles.strengthBars}>
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={styles.strengthBar}
                      style={{
                        backgroundColor: passwordValidation.strength >= level 
                          ? strengthColors[passwordValidation.strength - 1] 
                          : 'var(--color-gray-200)',
                      }}
                    />
                  ))}
                </div>
                <span 
                  className={styles.strengthLabel}
                  style={{ color: strengthColors[passwordValidation.strength - 1] || 'var(--color-gray-400)' }}
                >
                  {passwordValidation.strength > 0 ? strengthLabels[passwordValidation.strength - 1] : ''}
                </span>
              </div>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className={styles.inputWrapper}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                disabled={isSubmitting}
                autoComplete="new-password"
                className={confirmPassword && password !== confirmPassword ? styles.inputError : ''}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <Icons.eyeOff size={18} /> : <Icons.eye size={18} />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <span className={styles.fieldError}>Passwords do not match</span>
            )}
          </div>

          <button 
            type="submit"
            className={styles.primaryBtn}
            disabled={isSubmitting || !password || !confirmPassword}
          >
            {isSubmitting ? 'Updating...' : 'Reset Password'}
          </button>
        </form>

        <Link href="/garage?auth=signin" className={styles.backLink}>
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading...</p>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
