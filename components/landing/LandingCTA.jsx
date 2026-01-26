'use client';

import Button from '@/components/Button';
import { trackEvent } from '@/lib/ga4';

import styles from './LandingCTA.module.css';

/**
 * @typedef {Object} LandingCTAProps
 * @property {string} pageId
 * @property {string} headline
 * @property {string} subhead
 * @property {string} primaryCtaLabel
 * @property {string} primaryCtaHref
 * @property {string=} secondaryCtaLabel
 * @property {string=} secondaryCtaHref
 * @property {string=} note
 */

/**
 * @param {LandingCTAProps} props
 */
export default function LandingCTA({
  pageId,
  headline,
  subhead,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  note,
}) {
  const trackCta = (ctaLabel, destination, position) => {
    try {
      trackEvent('Landing Page CTA Clicked', {
        landing_page: pageId,
        cta: ctaLabel,
        destination,
        position,
      });
    } catch (err) {
      console.warn('[LandingCTA] Failed to track CTA click:', err);
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.headline}>{headline}</h2>
        <p className={styles.subhead}>{subhead}</p>
        <div className={styles.ctas}>
          <Button
            href={primaryCtaHref}
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => trackCta(primaryCtaLabel, primaryCtaHref, 'final')}
          >
            {primaryCtaLabel}
          </Button>
          {secondaryCtaLabel && secondaryCtaHref ? (
            <Button
              href={secondaryCtaHref}
              variant="outlineLight"
              size="lg"
              fullWidth
              onClick={() => trackCta(secondaryCtaLabel, secondaryCtaHref, 'final')}
            >
              {secondaryCtaLabel}
            </Button>
          ) : null}
        </div>
        {note ? <p className={styles.note}>{note}</p> : null}
      </div>
    </section>
  );
}










