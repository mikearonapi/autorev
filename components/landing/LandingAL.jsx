'use client';

import { useState, useRef, useEffect } from 'react';
import Button from '@/components/Button';
import IPhoneFrame from '@/components/IPhoneFrame';
import Image from 'next/image';
import { trackEvent } from '@/lib/ga4';
import styles from './LandingAL.module.css';

/**
 * AL (AI Assistant) section for landing pages
 * Tailored to each page's persona and problems
 * Video plays automatically when scrolled into view
 */
export default function LandingAL({
  pageId,
  headline,
  description,
  exampleQuestions = [],
  videoSrc,
  imageSrc = '/images/onboarding/ai-al-05-response-analysis.png',
  imageAlt = 'AL - AutoRev AI Assistant',
}) {
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const videoRef = useRef(null);
  const sectionRef = useRef(null);

  // Intersection Observer to detect when section is in view
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !videoSrc) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting);
        });
      },
      {
        threshold: 0.3, // Trigger when 30% of section is visible
        rootMargin: '0px',
      }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [videoSrc]);

  // Play/pause video based on visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isInView && videoReady) {
      video.play().catch(() => {
        // Autoplay blocked - that's okay
      });
    } else {
      video.pause();
    }
  }, [isInView, videoReady]);

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

  const handleVideoError = () => {
    setVideoFailed(true);
  };

  const handleVideoCanPlay = () => {
    setVideoReady(true);
  };

  const hasVideo = Boolean(videoSrc) && !videoFailed;

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Left: Phone with AL video/screenshot */}
          <div className={styles.visual}>
            <div className={styles.phoneWrapper}>
              <IPhoneFrame size="medium">
                <div className={styles.phoneContent}>
                  {hasVideo ? (
                    <>
                      {/* Show static image until video is ready */}
                      {!videoReady && (
                        <Image
                          src={imageSrc}
                          alt={imageAlt}
                          fill
                          sizes="280px"
                          style={{ objectFit: 'cover', objectPosition: 'top' }}
                        />
                      )}
                      <video
                        ref={videoRef}
                        className={`${styles.video} ${videoReady ? styles.videoReady : styles.videoLoading}`}
                        src={videoSrc}
                        muted
                        loop
                        playsInline
                        onError={handleVideoError}
                        onCanPlay={handleVideoCanPlay}
                      />
                    </>
                  ) : (
                    <Image
                      src={imageSrc}
                      alt={imageAlt}
                      fill
                      sizes="280px"
                      style={{ objectFit: 'cover', objectPosition: 'top' }}
                    />
                  )}
                </div>
              </IPhoneFrame>
            </div>
          </div>

          {/* Right: Content */}
          <div className={styles.content}>
            <div className={styles.badge}>
              <Image
                src="/images/al-mascot.png"
                alt="AL"
                width={24}
                height={24}
                className={styles.alAvatar}
              />
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
              <p className={styles.note}>Free with any account — sign up in seconds</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
