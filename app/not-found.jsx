import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.title}>404</h1>
        <h2 className={styles.subtitle}>Page Not Found</h2>
        <p className={styles.message}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className={styles.links}>
          <Link href="/" className={styles.homeLink}>
            Go Home
          </Link>
          <Link href="/car-selector" className={styles.advisoryLink}>
            Your Sportscar Match
          </Link>
        </div>
      </div>
    </div>
  );
}

