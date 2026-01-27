import Link from 'next/link';

import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.page} data-no-main-offset>
      <div className={styles.content}>
        <h1 className={styles.title}>404</h1>
        <p className={styles.message}>Looks like we're stuck in the pit lane.</p>
        <Link href="/" className={styles.homeLink}>
          Back to the Grid
        </Link>
      </div>
    </div>
  );
}
