'use client';

import { useState, useRef, useEffect } from 'react';
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
 * Video plays inside iPhone frame, falls back to static image if video fails
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
  videoPoster, // PERF: Poster image shown while video loads
  phoneSrc,
  phoneAlt,
}) {
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const videoRef = useRef(null);
  const sectionRef = useRef(null);

  // PERF: Lazy load video only after LCP completes to prevent blocking
  // Video files consume bandwidth that competes with LCP image loading
  useEffect(() => {
    // Delay video loading until well after LCP completes
    // LCP target is <2.5s, so we wait 2.5s to ensure LCP is done
    // This prioritizes the static hero image which is the LCP element
    const timer = setTimeout(() => {
      setShouldLoadVideo(true);
    }, 2500); // 2500ms delay - ensures LCP completes before video loads
    
    return () => clearTimeout(timer);
  }, []);

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
    setVideoFailed(true);
  };

  const handleVideoCanPlay = () => {
    setVideoReady(true);
  };

  return (
    <section className={styles.hero}>
      <div className={styles.bg} aria-hidden="true" />
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Text content - shows first on mobile */}
          <div className={styles.textContent}>
            {badgeText ? (
              <div className={styles.badge}>
                <SparkleIcon />
                <span>{badgeText}</span>
              </div>
            ) : null}

            <h1 className={styles.headline}>{headline}</h1>
            <p className={styles.subhead}>{subhead}</p>
          </div>

          {/* Phone mockup - shows second on mobile */}
          <div className={styles.visual}>
            <div className={styles.phoneWrapper}>
              <IPhoneFrame size="medium">
                <div className={styles.phoneContent}>
                  {hasVideo ? (
                    <>
                      {/* PERF: Always show static image first for fast LCP */}
                      {/* Video loads after initial paint via shouldLoadVideo */}
                      {(!videoReady || !shouldLoadVideo) && hasPhone && (
                        <Image
                          src={phoneSrc}
                          alt={phoneAlt || 'App screenshot'}
                          fill
                          sizes="(max-width: 640px) 240px, 280px"
                          style={{ objectFit: 'cover', objectPosition: 'top' }}
                          priority
                          quality={75}
                        />
                      )}
                      {/* Only render video element after LCP completes to not block it */}
                      {shouldLoadVideo && (
                        <video
                          ref={videoRef}
                          className={`${styles.video} ${videoReady ? styles.videoReady : styles.videoLoading}`}
                          src={videoSrc}
                          poster={videoPoster}
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="none"
                          webkit-playsinline="true"
                          onError={handleVideoError}
                          onCanPlay={handleVideoCanPlay}
                          onLoadedData={handleVideoCanPlay}
                        />
                      )}
                    </>
                  ) : hasPhone ? (
                    <Image
                      src={phoneSrc}
                      alt={phoneAlt || 'App screenshot'}
                      fill
                      sizes="(max-width: 640px) 240px, 280px"
                      style={{ objectFit: 'cover', objectPosition: 'top' }}
                      priority
                      quality={75}
                    />
                  ) : null}
                </div>
              </IPhoneFrame>
            </div>
          </div>

          {/* CTAs - shows third on mobile, below phone */}
          <div className={styles.ctaContent}>
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

            <p className={styles.note}>Join free — no credit card required</p>
          </div>
        </div>
      </div>
    </section>
  );
}
