'use client';

import Button from '@/components/Button';
import IPhoneFrame from '@/components/IPhoneFrame';
import Image from 'next/image';
import { trackEvent } from '@/lib/ga4';
import styles from './LandingAL.module.css';

const ALIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </svg>
);

/**
 * AL (AI Assistant) section for landing pages
 * Tailored to each page's persona and problems
 */
export default function LandingAL({
  pageId,
  headline,
  description,
  exampleQuestions = [],
  imageSrc = '/images/onboarding/ai-al-05-response-analysis.png',
  imageAlt = 'AL - AutoRev AI Assistant',
}) {
  const handleCtaClick = () => {
    try {
      trackEvent('landing_page_cta_click', {
        landing_page: pageId,
        cta: 'Ask AL',
        destination: '/al',
        position: 'al_section',
      });
    } catch (err) {
      console.warn('[LandingAL] Failed to track CTA click:', err);
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Left: Phone with AL screenshot */}
          <div className={styles.visual}>
            <div className={styles.phoneWrapper}>
              <IPhoneFrame size="medium">
                <div className={styles.phoneContent}>
                  <Image
                    src={imageSrc}
                    alt={imageAlt}
                    fill
                    sizes="280px"
                    style={{ objectFit: 'cover', objectPosition: 'top' }}
                  />
                </div>
              </IPhoneFrame>
            </div>
          </div>

          {/* Right: Content */}
          <div className={styles.content}>
            <div className={styles.badge}>
              <ALIcon />
              <span>AL — Your Car Expert</span>
            </div>

            <h2 className={styles.headline}>{headline}</h2>
            <p className={styles.description}>{description}</p>

            {exampleQuestions.length > 0 && (
              <div className={styles.examples}>
                <p className={styles.examplesLabel}>Try asking AL:</p>
                <ul className={styles.examplesList}>
                  {exampleQuestions.map((q, i) => (
                    <li key={i} className={styles.exampleItem}>
                      <span className={styles.exampleQuote}>&ldquo;</span>
                      {q}
                      <span className={styles.exampleQuote}>&rdquo;</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className={styles.cta}>
              <Button
                href="/al"
                variant="secondary"
                size="lg"
                onClick={handleCtaClick}
              >
                Ask AL Now
              </Button>
              <p className={styles.note}>Try it free — no sign-up needed to start</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

