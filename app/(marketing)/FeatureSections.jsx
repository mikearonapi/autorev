/**
 * Feature Sections - Lazy-loaded below-fold component
 *
 * This component is dynamically imported to defer its CSS loading
 * and reduce render-blocking resources on the homepage.
 *
 * Contains all 7 feature showcase sections with alternating layout.
 */

import Image from 'next/image';

import IPhoneFrame from '@/components/IPhoneFrame';
import { SITE_DESIGN_IMAGES } from '@/lib/images';

import styles from './page.module.css';

// Feature sections data - 7 sections in order
const FEATURES = [
  // 1. My Garage - Your car cards and ownership
  {
    id: 'my-garage',
    title: 'YOUR GARAGE',
    titleAccent: 'YOUR COMMAND CENTER',
    description:
      'Add the cars you own and love. Track specs, mileage, and ownership history. Your garage is always ready when you are.',
    screen: SITE_DESIGN_IMAGES.garageOverview,
  },
  // 2. My Garage Upgrades / Parts
  {
    id: 'garage-upgrades',
    title: 'PLAN YOUR BUILD',
    titleAccent: 'PARTS THAT FIT',
    description:
      'Curated upgrade paths for track, street, or daily driving. See exactly what each mod delivers — power gains, real-world feel, and compatibility.',
    screen: SITE_DESIGN_IMAGES.tuningOverview,
  },
  // 3. My Garage Performance
  {
    id: 'garage-performance',
    title: 'KNOW YOUR NUMBERS',
    titleAccent: 'PERFORMANCE METRICS',
    description:
      'See calculated 0-60, quarter mile, and experience scores. Understand exactly how your mods translate to real-world performance.',
    screen: SITE_DESIGN_IMAGES.performanceMetrics,
  },
  // 4. My Data Dyno
  {
    id: 'data-dyno',
    title: 'VIRTUAL DYNO',
    titleAccent: 'SEE YOUR POWER',
    description:
      'Visualize estimated HP and torque curves based on your modifications. Track gains from each upgrade and log real dyno results.',
    screen: SITE_DESIGN_IMAGES.garageData,
  },
  // 5. My Data Track
  {
    id: 'data-track',
    title: 'LAP TIME ESTIMATOR',
    titleAccent: 'TRACK YOUR TIMES',
    description:
      'Predict lap times at popular tracks based on your build. Log real sessions and compare your progress over time.',
    screen: SITE_DESIGN_IMAGES.lapTimeEstimator,
  },
  // 6. Community
  {
    id: 'community',
    title: 'COMMUNITY BUILDS',
    titleAccent: 'REAL ENTHUSIASTS',
    description:
      'Get inspiration from real builds. Share your progress, find local events, and connect with owners who share your passion.',
    screen: SITE_DESIGN_IMAGES.communityFeed,
  },
  // 7. AI AL
  {
    id: 'al',
    title: 'ASK AL ANYTHING',
    titleAccent: 'YOUR AI EXPERT',
    description:
      'No more hours of forum searching. AL knows your car, your mods, and your goals. Get instant answers to any question.',
    screen: SITE_DESIGN_IMAGES.alChatResponse,
  },
];

export default function FeatureSections() {
  return (
    <>
      {FEATURES.map((feature, index) => (
        <section key={feature.id} className={styles.featureSection}>
          <div className={styles.featureText}>
            <h3 className={styles.featureTitle}>
              <span className={styles.featureTitleAccent}>{feature.title}</span>
              {feature.titleAccent && (
                <>
                  <br />
                  <span className={styles.featureTitleWhite}>{feature.titleAccent}</span>
                </>
              )}
            </h3>
            <p className={styles.featureDescription}>{feature.description}</p>
          </div>
          <div className={styles.featurePhone}>
            <IPhoneFrame size="small">
              <Image
                src={feature.screen}
                alt={feature.title}
                fill
                sizes="224px"
                className={styles.screenImage}
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </IPhoneFrame>
          </div>
        </section>
      ))}
    </>
  );
}
