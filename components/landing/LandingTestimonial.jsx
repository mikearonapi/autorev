import Image from 'next/image';

import styles from './LandingTestimonial.module.css';

const QuoteIcon = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
  </svg>
);

/**
 * Avatar with fallback to initial on load error
 * Uses next/image for optimization with CSS-based error fallback
 */
function Avatar({ name, src }) {
  if (!src) {
    return <span className={styles.avatarInitial}>{name.charAt(0)}</span>;
  }

  return (
    <Image
      src={src}
      alt={name}
      width={48}
      height={48}
      className={styles.avatarImg}
      referrerPolicy="no-referrer"
      unoptimized // Google profile images don't need optimization pipeline
    />
  );
}

/**
 * Testimonial section for landing pages
 */
export default function LandingTestimonial({ testimonials = [] }) {
  if (testimonials.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.badge}>
          <span>Built by Enthusiasts</span>
        </div>
        <h2 className={styles.headline}>We built this for ourselves</h2>
        <p className={styles.subhead}>
          AutoRev was born out of frustration with the status quo. We're car enthusiasts who got tired of the same problems everyone faces.
        </p>

        <div className={styles.grid}>
          {testimonials.map((t) => (
            <div key={t.name} className={styles.card}>
              <div className={styles.quoteIcon}>
                <QuoteIcon />
              </div>
              <blockquote className={styles.quote}>{t.quote}</blockquote>
              <div className={styles.author}>
                <div className={styles.avatar}>
                  <Avatar name={t.name} src={t.avatar} />
                </div>
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>{t.name}</span>
                  <span className={styles.authorRole}>{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

