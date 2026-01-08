/**
 * Car Comparisons Index Page
 * 
 * Lists all published car comparison pages for SEO.
 * Each comparison targets high-intent "X vs Y" searches.
 */

import Link from 'next/link';
import { fetchAllComparisons, getComparisonTypeInfo } from '@/lib/comparisonService';
import styles from './page.module.css';

export const metadata = {
  title: 'Car Comparisons | AutoRev',
  description: 'Compare sports cars side-by-side. Detailed specs, performance data, and expert recommendations to help you choose.',
  openGraph: {
    title: 'Car Comparisons | AutoRev',
    description: 'Compare sports cars side-by-side. Detailed specs, performance data, and expert recommendations.',
    type: 'website',
  },
};

export const revalidate = 3600; // Revalidate every hour

export default async function ComparisonsPage() {
  const { data: comparisons, error } = await fetchAllComparisons();

  if (error) {
    console.error('[ComparisonsPage] Error fetching comparisons:', error);
  }

  // Group comparisons by type
  const grouped = {
    head_to_head: [],
    three_way: [],
    alternatives: [],
    best_under: [],
    best_for: [],
  };

  (comparisons || []).forEach(comp => {
    if (grouped[comp.comparison_type]) {
      grouped[comp.comparison_type].push(comp);
    }
  });

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>Compare</span>
          <h1 className={styles.heroTitle}>
            Car <span className={styles.accent}>Comparisons</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Side-by-side comparisons with detailed specs, performance data, 
            and AI-powered recommendations to help you choose.
          </p>
        </div>
      </section>

      {/* Comparisons Grid */}
      <section className={styles.content}>
        {/* Head-to-Head */}
        {grouped.head_to_head.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>⚔️</span>
              <h2 className={styles.sectionTitle}>Head-to-Head Comparisons</h2>
            </div>
            <div className={styles.grid}>
              {grouped.head_to_head.map(comp => (
                <ComparisonCard key={comp.slug} comparison={comp} />
              ))}
            </div>
          </div>
        )}

        {/* Three-Way */}
        {grouped.three_way.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🔺</span>
              <h2 className={styles.sectionTitle}>Three-Way Showdowns</h2>
            </div>
            <div className={styles.grid}>
              {grouped.three_way.map(comp => (
                <ComparisonCard key={comp.slug} comparison={comp} />
              ))}
            </div>
          </div>
        )}

        {/* Alternatives */}
        {grouped.alternatives.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🔄</span>
              <h2 className={styles.sectionTitle}>Alternatives & Options</h2>
            </div>
            <div className={styles.grid}>
              {grouped.alternatives.map(comp => (
                <ComparisonCard key={comp.slug} comparison={comp} />
              ))}
            </div>
          </div>
        )}

        {/* Best Under/For */}
        {(grouped.best_under.length > 0 || grouped.best_for.length > 0) && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🎯</span>
              <h2 className={styles.sectionTitle}>Best Picks</h2>
            </div>
            <div className={styles.grid}>
              {grouped.best_under.map(comp => (
                <ComparisonCard key={comp.slug} comparison={comp} />
              ))}
              {grouped.best_for.map(comp => (
                <ComparisonCard key={comp.slug} comparison={comp} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!comparisons || comparisons.length === 0) && (
          <div className={styles.emptyState}>
            <p>Comparison pages coming soon! Check back later.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function ComparisonCard({ comparison }) {
  const typeInfo = getComparisonTypeInfo(comparison.comparison_type);
  
  return (
    <Link href={`/compare/${comparison.slug}`} className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardType}>{typeInfo.icon} {typeInfo.label}</span>
        {comparison.view_count > 100 && (
          <span className={styles.popularBadge}>Popular</span>
        )}
      </div>
      <h3 className={styles.cardTitle}>{comparison.title}</h3>
      <p className={styles.cardDescription}>{comparison.meta_description}</p>
      <div className={styles.cardFooter}>
        <span className={styles.carCount}>
          {comparison.car_slugs?.length || 0} cars compared
        </span>
        <span className={styles.readMore}>
          Read Comparison →
        </span>
      </div>
    </Link>
  );
}

