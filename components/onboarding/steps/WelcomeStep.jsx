'use client';

import styles from '../OnboardingFlow.module.css';

// AutoRev Logo Icon
const LogoIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
    <circle cx="7" cy="17" r="2"/>
    <path d="M9 17h6"/>
    <circle cx="17" cy="17" r="2"/>
    <path d="M12 6v-3M9 3l3 3 3-3"/>
  </svg>
);

/**
 * WelcomeStep Component
 * Step 1: Welcome message and introduction
 */
export default function WelcomeStep({ className, displayName }) {
  const greeting = displayName ? `Welcome, ${displayName.split(' ')[0]}!` : 'Welcome to AutoRev!';
  
  return (
    <div className={className}>
      <div className={styles.welcomeIcon}>
        <LogoIcon />
      </div>
      
      <h1 className={styles.welcomeTitle}>
        {greeting}
      </h1>
      
      <p className={styles.welcomeTagline}>
        Your complete <span className={styles.welcomeHighlight}>sports car companion</span> — 
        from research to ownership to modifications.
      </p>
    </div>
  );
}

