/**
 * Car Detail Loading State
 * 
 * Shows instantly while the car detail page is loading.
 * Provides a skeleton UI that matches the page structure.
 * 
 * @module app/browse-cars/[slug]/loading
 */

import styles from './page.module.css';

export default function CarDetailLoading() {
  return (
    <div className={styles.container}>
      {/* Hero Section Skeleton */}
      <section className={styles.heroSection}>
        <div className={styles.heroInner}>
          <div className={styles.heroMain}>
            <div className={styles.heroContent}>
              <div className={styles.heroBadges}>
                <span className={`${styles.skeletonBadge}`} />
                <span className={`${styles.skeletonBadge}`} />
              </div>
              
              <div className={styles.skeletonTitle} />
              <div className={styles.skeletonYears} />
              
              <div className={styles.skeletonEssence} />
              
              <div className={styles.skeletonHighlight} />
            </div>
            
            <div className={styles.heroImageWrapper}>
              <div className={styles.skeletonImage} />
            </div>
          </div>
          
          <div className={styles.specBar}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={styles.specItem}>
                <div className={styles.skeletonIcon} />
                <div className={styles.specContent}>
                  <span className={styles.skeletonSpecLabel} />
                  <span className={styles.skeletonSpecValue} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Take Skeleton */}
      <section className={styles.quickTake}>
        <div className={styles.quickTakeInner}>
          <div className={styles.quickTakeHeader}>
            <div className={styles.skeletonQuickTitle} />
            <div className={styles.skeletonQuickScore} />
          </div>
          
          <div className={styles.quickTakeContent}>
            <div className={styles.skeletonSummary} />
            
            <div className={styles.quickGrid}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={styles.quickCard}>
                  <div className={styles.skeletonCardTitle} />
                  <div className={styles.skeletonCardContent} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation Skeleton */}
      <nav className={styles.tabNav}>
        <div className={styles.tabNavInner}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={styles.skeletonTab} />
          ))}
        </div>
      </nav>

      {/* Content Skeleton */}
      <div className={styles.tabContent}>
        <div className={styles.tabPanel}>
          <section className={styles.contentSection}>
            <div className={styles.skeletonSectionHeader} />
            <div className={styles.skeletonParagraph} />
            <div className={styles.skeletonParagraph} />
            <div className={styles.skeletonParagraph} style={{ width: '70%' }} />
          </section>
        </div>
      </div>
    </div>
  );
}

