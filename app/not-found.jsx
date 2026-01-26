import Link from 'next/link';

import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.page} data-no-main-offset>
      {/* Animated pit lane lines */}
      <div className={styles.pitLaneLines}>
        <div className={styles.line}></div>
        <div className={styles.line}></div>
        <div className={styles.line}></div>
      </div>

      {/* Floating wrenches animation */}
      <div className={styles.floatingTools}>
        <span className={styles.wrench}>🔧</span>
        <span className={styles.tire}>🛞</span>
        <span className={styles.wrench}>🔩</span>
        <span className={styles.tire}>⚙️</span>
      </div>

      <div className={styles.content}>
        {/* Animated car on jacks */}
        <div className={styles.carScene}>
          <div className={styles.car}>
            <div className={styles.carBody}>
              <div className={styles.carTop}></div>
              <div className={styles.carBottom}></div>
              <div className={styles.window}></div>
              <div className={styles.headlight}></div>
              <div className={styles.taillight}></div>
            </div>
            <div className={`${styles.wheel} ${styles.wheelFront}`}>
              <div className={styles.wheelInner}></div>
            </div>
            <div className={`${styles.wheel} ${styles.wheelRear}`}>
              <div className={styles.wheelInner}></div>
            </div>
            {/* Jack stands */}
            <div className={styles.jackStand}></div>
            <div className={styles.jackStandRear}></div>
          </div>
          {/* Loose wheel rolling away */}
          <div className={styles.looseWheel}>
            <div className={styles.wheelInner}></div>
          </div>
        </div>

        <h1 className={styles.title}>404</h1>
        <h2 className={styles.subtitle}>Lost in the Pit Lane</h2>
        <p className={styles.message}>
          Looks like you&apos;ve taken a wrong turn. Your page is currently up on jacks 
          while the crew searches for the right parts. 🔧
        </p>
        <p className={styles.joke}>
          &ldquo;We found 4 lug nuts, but we&apos;re still missing the 0th and 4th...&rdquo;
        </p>

        <div className={styles.links}>
          <Link href="/" className={styles.homeLink}>
            🏁 Back to the Grid
          </Link>
          <Link href="/garage" className={styles.advisoryLink}>
            🚗 My Garage
          </Link>
        </div>

        <p className={styles.footer}>
          Radio check: &ldquo;Box box box!&rdquo; — but nobody&apos;s answering on this frequency.
        </p>
      </div>

      {/* Checkered flag corner decoration */}
      <div className={styles.checkeredCorner}></div>
    </div>
  );
}
