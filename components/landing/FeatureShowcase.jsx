import Image from 'next/image';
import IPhoneFrame from '@/components/IPhoneFrame';
import styles from './FeatureShowcase.module.css';

const CheckIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/**
 * @typedef {Object} FeatureShowcaseProps
 * @property {import('react').ReactNode} icon
 * @property {string} headline
 * @property {string} description
 * @property {string[]} bullets
 * @property {string} imageSrc
 * @property {string} imageAlt
 * @property {string=} imageCaption
 * @property {boolean=} reversed
 */

/**
 * Two-column feature section: text + iPhone frame screenshot (matches existing style patterns).
 * @param {FeatureShowcaseProps} props
 */
export default function FeatureShowcase({
  icon,
  headline,
  description,
  bullets = [],
  imageSrc,
  imageAlt,
  imageCaption,
  reversed = false,
}) {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={`${styles.grid} ${reversed ? styles.reversed : ''}`}>
          <div className={styles.content}>
            <div className={styles.kicker}>
              <span className={styles.icon}>{icon}</span>
              <span className={styles.kickerText}>Feature</span>
            </div>
            <h2 className={styles.headline}>{headline}</h2>
            <p className={styles.description}>{description}</p>

            <ul className={styles.bullets}>
              {bullets.map((text) => (
                <li key={text} className={styles.bullet}>
                  <span className={styles.check}>
                    <CheckIcon />
                  </span>
                  <span className={styles.bulletText}>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.visual}>
            <div className={styles.phone}>
              <IPhoneFrame size="medium">
                <div className={styles.phoneContent}>
                  <Image
                    src={imageSrc}
                    alt={imageAlt}
                    fill
                    sizes="(max-width: 768px) 280px, 320px"
                    style={{ objectFit: 'cover', objectPosition: 'top' }}
                  />
                </div>
              </IPhoneFrame>
              {imageCaption ? <div className={styles.caption}>{imageCaption}</div> : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


