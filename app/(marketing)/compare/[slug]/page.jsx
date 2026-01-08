/**
 * Individual Car Comparison Page
 * 
 * Server-rendered comparison page with:
 * - Full spec comparison table
 * - Score comparison with winners
 * - Pros/cons for each car
 * - AL recommendation
 * - SEO-optimized metadata
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  fetchComparisonPage, 
  generateSpecComparison, 
  generateScoreComparison,
  getComparisonTypeInfo,
  fetchAllComparisons
} from '@/lib/comparisonService';
import { getCarImageByType } from '@/lib/images';
import styles from './page.module.css';

// Generate static paths for published comparisons
export async function generateStaticParams() {
  const { data: comparisons } = await fetchAllComparisons();
  
  return (comparisons || []).map((comp) => ({
    slug: comp.slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { data: comparison } = await fetchComparisonPage(slug);
  
  if (!comparison) {
    return {
      title: 'Comparison Not Found | AutoRev',
    };
  }

  const carNames = comparison.cars.map(c => c.name).join(' vs ');
  
  return {
    title: comparison.title,
    description: comparison.meta_description || `Compare ${carNames}. Detailed specs, performance, and expert recommendations.`,
    openGraph: {
      title: comparison.title,
      description: comparison.meta_description,
      type: 'article',
      images: comparison.cars[0]?.image_hero_url ? [{ url: comparison.cars[0].image_hero_url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: comparison.title,
      description: comparison.meta_description,
    },
  };
}

export const revalidate = 3600; // Revalidate every hour

export default async function ComparisonPage({ params }) {
  const { slug } = await params;
  const { data: comparison, error } = await fetchComparisonPage(slug);

  if (error || !comparison) {
    notFound();
  }

  const { cars } = comparison;
  const typeInfo = getComparisonTypeInfo(comparison.comparison_type);
  const specComparison = generateSpecComparison(cars);
  const scoreComparison = generateScoreComparison(cars);

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: comparison.title,
    description: comparison.meta_description,
    datePublished: comparison.published_at,
    dateModified: comparison.updated_at,
    author: {
      '@type': 'Organization',
      name: 'AutoRev',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className={styles.page}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.breadcrumb}>
              <Link href="/compare">← All Comparisons</Link>
            </div>
            <span className={styles.badge}>
              {typeInfo.icon} {typeInfo.label}
            </span>
            <h1 className={styles.title}>{comparison.title}</h1>
            {comparison.meta_description && (
              <p className={styles.subtitle}>{comparison.meta_description}</p>
            )}
          </div>
        </section>

        {/* Car Cards */}
        <section className={styles.carsSection}>
          <div className={styles.carsGrid}>
            {cars.map((car, index) => (
              <CarCard 
                key={car.slug} 
                car={car} 
                isWinner={comparison.winner_slug === car.slug}
                position={index + 1}
              />
            ))}
          </div>
        </section>

        {/* Intro Content */}
        {comparison.intro_content && (
          <section className={styles.section}>
            <div className={styles.prose}>
              <p>{comparison.intro_content}</p>
            </div>
          </section>
        )}

        {/* Specs Comparison Table */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>📊 Specifications Comparison</h2>
          <div className={styles.tableWrapper}>
            <table className={styles.comparisonTable}>
              <thead>
                <tr>
                  <th>Specification</th>
                  {cars.map(car => (
                    <th key={car.slug}>{car.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {specComparison.map((row, idx) => (
                  <tr key={idx}>
                    <td className={styles.specLabel}>{row.label}</td>
                    {row.values.map((val, i) => (
                      <td 
                        key={i}
                        className={row.winner === val.carSlug ? styles.winner : ''}
                      >
                        {val.value}
                        {row.winner === val.carSlug && (
                          <span className={styles.winnerBadge}>Best</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Scores Comparison */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>⭐ AutoRev Scores</h2>
          <div className={styles.scoresGrid}>
            {scoreComparison.map((score, idx) => (
              <div key={idx} className={styles.scoreRow}>
                <div className={styles.scoreLabel}>
                  <span className={styles.scoreIcon}>{score.icon}</span>
                  {score.label}
                </div>
                <div className={styles.scoreBars}>
                  {score.values.map((val, i) => (
                    <div key={i} className={styles.scoreBarWrapper}>
                      <span className={styles.scoreCarName}>{val.carName.split(' ').slice(-1)[0]}</span>
                      <div className={styles.scoreBar}>
                        <div 
                          className={`${styles.scoreBarFill} ${score.winner === val.carSlug ? styles.scoreWinner : ''}`}
                          style={{ width: `${(val.value / 10) * 100}%` }}
                        />
                      </div>
                      <span className={styles.scoreValue}>{val.value}/10</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pros and Cons */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>✅ Strengths & Weaknesses</h2>
          <div className={styles.prosConsGrid}>
            {cars.map(car => (
              <div key={car.slug} className={styles.prosConsCard}>
                <h3 className={styles.prosConsCarName}>{car.name}</h3>
                
                {car.defining_strengths && (
                  <div className={styles.prosList}>
                    <h4 className={styles.prosTitle}>✅ Strengths</h4>
                    <ul>
                      {(Array.isArray(car.defining_strengths) 
                        ? car.defining_strengths 
                        : [car.defining_strengths]
                      ).map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {car.honest_weaknesses && (
                  <div className={styles.consList}>
                    <h4 className={styles.consTitle}>⚠️ Weaknesses</h4>
                    <ul>
                      {(Array.isArray(car.honest_weaknesses) 
                        ? car.honest_weaknesses 
                        : [car.honest_weaknesses]
                      ).map((weakness, i) => (
                        <li key={i}>{weakness}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* AL Recommendation */}
        {comparison.al_recommendation && (
          <section className={styles.section}>
            <div className={styles.recommendationCard}>
              <div className={styles.recommendationHeader}>
                <span className={styles.alBadge}>AL Recommendation</span>
                <h2 className={styles.recommendationTitle}>Which Should You Buy?</h2>
              </div>
              <div className={styles.recommendationContent}>
                <p>{comparison.al_recommendation}</p>
              </div>
            </div>
          </section>
        )}

        {/* Conclusion */}
        {comparison.conclusion_content && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📝 Conclusion</h2>
            <div className={styles.prose}>
              <p>{comparison.conclusion_content}</p>
            </div>
          </section>
        )}

        {/* Winner Declaration */}
        {comparison.winner_slug && (
          <section className={styles.winnerSection}>
            <div className={styles.winnerCard}>
              <span className={styles.winnerLabel}>Our Pick</span>
              <h3 className={styles.winnerName}>
                {cars.find(c => c.slug === comparison.winner_slug)?.name}
              </h3>
              {comparison.winner_rationale && (
                <p className={styles.winnerRationale}>{comparison.winner_rationale}</p>
              )}
              <Link 
                href={`/browse-cars/${comparison.winner_slug}`}
                className={styles.winnerCta}
              >
                View Full Details →
              </Link>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <h2 className={styles.ctaTitle}>Ready to dive deeper?</h2>
          <p className={styles.ctaSubtitle}>
            Explore each car's full specs, ownership costs, and community insights.
          </p>
          <div className={styles.ctaButtons}>
            {cars.map(car => (
              <Link 
                key={car.slug}
                href={`/browse-cars/${car.slug}`}
                className={styles.ctaButton}
              >
                View {car.name.split(' ').slice(-2).join(' ')}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function CarCard({ car, isWinner, position }) {
  const imageUrl = car.image_hero_url || getCarImageByType(car, 'hero');
  
  return (
    <div className={`${styles.carCard} ${isWinner ? styles.winnerCard : ''}`}>
      {isWinner && (
        <div className={styles.winnerRibbon}>🏆 Our Pick</div>
      )}
      <div className={styles.carImageWrapper}>
        <Image
          src={imageUrl}
          alt={car.name}
          width={400}
          height={225}
          className={styles.carImage}
          priority={position <= 2}
        />
      </div>
      <div className={styles.carInfo}>
        <h3 className={styles.carName}>{car.name}</h3>
        <p className={styles.carYears}>{car.years}</p>
        <div className={styles.carQuickSpecs}>
          <span>{car.hp} hp</span>
          <span>•</span>
          <span>{car.engine}</span>
          <span>•</span>
          <span>{car.price_range}</span>
        </div>
      </div>
    </div>
  );
}

