'use client';

import Button from '@/components/Button';
import { trackEvent } from '@/lib/ga4';
import styles from './LandingHero.module.css';

const SparkleIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
  </svg>
);

/**
 * @typedef {Object} LandingHeroProps
 * @property {string} pageId
 * @property {string} headline
 * @property {string} subhead
 * @property {string} primaryCtaLabel
 * @property {string} primaryCtaHref
 * @property {string=} secondaryCtaLabel
 * @property {string=} secondaryCtaHref
 * @property {string=} badgeText
 */

/**
 * @param {LandingHeroProps} props
 */
export default function LandingHero({
  pageId,
  headline,
  subhead,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  badgeText,
}) {
  const trackCta = (ctaLabel, destination) => {
    try {
      trackEvent('landing_page_cta_click', {
        landing_page: pageId,
        cta: ctaLabel,
        destination,
        position: 'hero',
      });
    } catch (err) {
      console.warn('[LandingHero] Failed to track CTA click:', err);
    }
  };

  return (
    <section className={styles.hero}>
      <div className={styles.bg} aria-hidden="true" />
      <div className={styles.container}>
        {badgeText ? (
          <div className={styles.badge}>
            <SparkleIcon />
            <span>{badgeText}</span>
          </div>
        ) : null}

        <h1 className={styles.headline}>{headline}</h1>
        <p className={styles.subhead}>{subhead}</p>

        <div className={styles.ctas}>
          <Button
            href={primaryCtaHref}
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => trackCta(primaryCtaLabel, primaryCtaHref)}
          >
            {primaryCtaLabel}
          </Button>

          {secondaryCtaLabel && secondaryCtaHref ? (
            <Button
              href={secondaryCtaHref}
              variant="outlineLight"
              size="lg"
              fullWidth
              onClick={() => trackCta(secondaryCtaLabel, secondaryCtaHref)}
            >
              {secondaryCtaLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}


