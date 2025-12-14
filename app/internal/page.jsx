'use client';

import Link from 'next/link';
import styles from './page.module.css';

const TOOLS = [
  { href: '/internal/qa', title: 'QA Dashboard', desc: 'Quick health checks and debugging helpers.' },
  { href: '/internal/knowledge', title: 'Knowledge Ingest', desc: 'Paste text to index into source_documents/document_chunks for citeable answers.' },
  { href: '/internal/parts-review', title: 'Parts Fitment Review', desc: 'Review/verify part fitments and confidence.' },
  { href: '/internal/lap-times', title: 'Track Lap Times', desc: 'Curate citeable lap times with conditions + source URL.' },
  { href: '/internal/dyno', title: 'Dyno Runs', desc: 'Curate citeable dyno runs with peaks/conditions + source URL.' },
  { href: '/internal/variant-maintenance', title: 'Variant Maintenance Overrides', desc: 'Override maintenance specs by car_variants.variant_key (VIN-matched vehicles).' },
];

export default function InternalHomePage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Internal Tools</h1>
        <p>
          Admin-only utilities for curating data that makes AL and the app noticeably better: citations, fitment accuracy, and variant-specific maintenance.
        </p>
      </header>

      <div className={styles.grid}>
        {TOOLS.map((t) => (
          <Link key={t.href} href={t.href} className={styles.card}>
            <div className={styles.cardTitle}>{t.title}</div>
            <div className={styles.cardDesc}>{t.desc}</div>
            <div className={styles.cardHref}>{t.href}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

