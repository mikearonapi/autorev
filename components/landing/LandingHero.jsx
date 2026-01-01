'use client';

import { useState } from 'react';
import Button from '@/components/Button';
import IPhoneFrame from '@/components/IPhoneFrame';
import Image from 'next/image';
import { trackEvent } from '@/lib/ga4';
import styles from './LandingHero.module.css';

const SparkleIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
  </svg>
);

/**
 * Landing page hero with split layout: text left, video/phone right
 * Falls back to phone mockup if video fails to load
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
  // Video or phone mockup
  videoSrc,
  videoPoster,
  phoneSrc,
  phoneAlt,
}) {
  const [videoFailed, setVideoFailed] = useState(false);

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

  const hasVideo = Boolean(videoSrc) && !videoFailed;
  const hasPhone = Boolean(phoneSrc);

  const handleVideoError = () => {
    // Video failed to load - fall back to phone mockup
    setVideoFailed(true);
  };

  return (
    <section className={styles.hero}>
      <div className={styles.bg} aria-hidden="true" />
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Left: Text content */}
          <div className={styles.content}>
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
                onClick={() => trackCta(primaryCtaLabel, primaryCtaHref)}
              >
                {primaryCtaLabel}
              </Button>

              {secondaryCtaLabel && secondaryCtaHref ? (
                <Button
                  href={secondaryCtaHref}
                  variant="outlineLight"
                  size="lg"
                  onClick={() => trackCta(secondaryCtaLabel, secondaryCtaHref)}
                >
                  {secondaryCtaLabel}
                </Button>
              ) : null}
            </div>

            <p className={styles.note}>Free. No credit card required.</p>
          </div>

          {/* Right: Video or Phone mockup */}
          <div className={styles.visual}>
            {hasVideo ? (
              <div className={styles.videoWrapper}>
                <video
                  className={styles.video}
                  src={videoSrc}
                  poster={videoPoster}
                  autoPlay
                  muted
                  loop
                  playsInline
                  onError={handleVideoError}
                />
              </div>
            ) : hasPhone ? (
              <div className={styles.phoneWrapper}>
                <IPhoneFrame size="large">
                  <div className={styles.phoneContent}>
                    <Image
                      src={phoneSrc}
                      alt={phoneAlt || 'App screenshot'}
                      fill
                      sizes="(max-width: 768px) 280px, 360px"
                      style={{ objectFit: 'cover', objectPosition: 'top' }}
                      priority
                    />
                  </div>
                </IPhoneFrame>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
