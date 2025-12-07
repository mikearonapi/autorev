import React from 'react';
import SportsCarComparison from '../../sports-car-comparison';
import Button from '../components/Button';
import ScoringInfo from '../components/ScoringInfo';
import styles from './Advisory.module.css';

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function Advisory() {
  return (
    <div className={styles.page}>
      {/* Intro Section */}
      <section className={styles.intro}>
        <div className={styles.container}>
          <div className={styles.introContent}>
            <span className={styles.badge}>Performance Vehicle Advisory</span>
            <h1 className={styles.title}>
              Find Your Perfect<br />
              <span className={styles.titleAccent}>Sports Car</span>
            </h1>
            <p className={styles.subtitle}>
              We've driven and lived with these cars. This advisory blends 
              real-world ownership experience with enthusiast data to match 
              you with the right vehicle for your priorities—and your budget.
            </p>
            <div className={styles.features}>
              <div className={styles.feature}>
                <CheckIcon />
                <span>35+ vehicles from $25K to $100K</span>
              </div>
              <div className={styles.feature}>
                <CheckIcon />
                <span>7 weighted criteria you control</span>
              </div>
              <div className={styles.feature}>
                <CheckIcon />
                <span>Real owner insights, not just specs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scoring Methodology */}
      <section className={styles.scoringSection}>
        <div className={styles.container}>
          <ScoringInfo variant="advisory" />
        </div>
      </section>

      {/* Sports Car Selector Tool */}
      <section className={styles.tool}>
        <SportsCarComparison />
      </section>

      {/* Post-Selector CTA */}
      <section className={styles.postCta}>
        <div className={styles.container}>
          <div className={styles.ctaCard}>
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>Found a Match You Love?</h2>
              <p className={styles.ctaSubtitle}>
                We can help you inspect, modify, or set up your new ride. 
                From pre-purchase inspections to full performance builds, 
                our team is here to support your journey.
              </p>
              <div className={styles.ctaButtons}>
                <Button to="/upgrades" variant="primary" size="lg">
                  Plan Upgrades
                </Button>
                <Button to="/contact" variant="outline" size="lg">
                  Talk to an Expert
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

