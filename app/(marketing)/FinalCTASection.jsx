/**
 * Final CTA Section - Lazy-loaded below-fold component
 *
 * This component is dynamically imported to defer its CSS loading
 * and reduce render-blocking resources on the homepage.
 */

import { FinalCTA } from '@/components/homepage';

import styles from './page.module.css';

export default function FinalCTASection() {
  return (
    <section className={styles.finalSection}>
      <h2 className={styles.finalHeadline}>
        STOP GUESSING.
        <br />
        <span className={styles.finalAccent}>START BUILDING.</span>
      </h2>
      <p className={styles.finalSubtext}>100% free to start. No credit card required.</p>
      <FinalCTA />
    </section>
  );
}
