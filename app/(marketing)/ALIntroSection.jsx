/**
 * AL Introduction Section - Lazy-loaded below-fold component
 *
 * This component is dynamically imported to defer its CSS loading
 * and reduce render-blocking resources on the homepage.
 */

import Image from 'next/image';

import { TypingAnimation } from '@/components/homepage';
import { UI_IMAGES } from '@/lib/images';

import styles from './page.module.css';

// Sample questions for typing animation - complex questions that showcase AL's depth
const AL_SAMPLE_QUESTIONS = [
  'What wheel fitment can I run without rubbing?',
  'If I upgrade my fuel pump, do I need a tune?',
  'What are the common failure points on this engine?',
  'What torque specs and tools do I need for this job?',
  'Can I run E85 with my current fuel system?',
  "What's the best mod order for a $5k budget?",
];

export default function ALIntroSection() {
  return (
    <>
      {/* AL Introduction Section */}
      <section className={styles.alIntro}>
        <div className={styles.alAvatar}>
          <Image
            src={UI_IMAGES.alMascot}
            alt="AL - Your AI Assistant"
            width={88}
            height={88}
            sizes="(max-width: 768px) 88px, 100px"
            className={styles.alAvatarImage}
          />
        </div>
        <p className={styles.alGreeting}>
          Hi, I&apos;m <span className={styles.alName}>AL</span>, your AutoRev AI.
        </p>
        <p className={styles.alTagline}>
          Tony Stark had Jarvis. <span className={styles.alHighlight}>You have AL.</span>
        </p>

        {/* Typing Animation - Client Component */}
        <TypingAnimation questions={AL_SAMPLE_QUESTIONS} />

        {/* AL Data Access List */}
        <div className={styles.alDataAccess}>
          <p className={styles.alDataLabel}>AL has instant access to:</p>
          <ul className={styles.alDataList}>
            <li>Platform-specific specs & known issues</li>
            <li>Modification compatibility & gains</li>
            <li>Torque specs & service intervals</li>
            <li>Real dyno results & owner experiences</li>
            <li>Part fitment & current pricing</li>
          </ul>
        </div>
      </section>

      {/* Feature Card Section */}
      <section className={styles.featureCard}>
        <p className={styles.featureCardLabel}>Built for enthusiasts who want more</p>
        <h2 className={styles.featureCardTitle}>
          <span className={styles.featureCardBold}>SMARTER BUILDS</span>
          <br />
          THAT LEAD TO RESULTS
        </h2>
      </section>
    </>
  );
}
