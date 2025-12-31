'use client';

import { usePathname } from 'next/navigation';
import styles from './BetaBanner.module.css';

export default function BetaBanner() {
  const pathname = usePathname();
  
  // Hide on admin and internal pages
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/internal')) {
    return null;
  }
  
  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <span className={styles.badge}>BETA</span>
        <span className={styles.message}>All membership levels FREE during beta</span>
      </div>
    </div>
  );
}





