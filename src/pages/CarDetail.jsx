import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styles from './CarDetail.module.css';
import { fetchCarBySlug } from '../api/carsClient.js';
import { getCarBySlug as getLocalCarBySlug, categories, tierConfig } from '../data/cars.js';
import { calculateScoreBreakdown, getScoreLabel, DEFAULT_WEIGHTS } from '../lib/scoring.js';
import NewsletterSignup from '../components/NewsletterSignup';
import { LEAD_SOURCES } from '../api/leadsClient.js';
import CarImage from '../components/CarImage';
import ScoringInfo from '../components/ScoringInfo';

// Icons - Using inline SVG for consistency with the advisory component
const Icons = {
  arrowLeft: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  check: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  x: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  zap: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  target: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  tool: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  settings: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  alertCircle: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  gauge: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z"/>
      <path d="M12 6v6l4 2"/>
      <path d="M16.24 7.76a6 6 0 1 0 0 8.49"/>
    </svg>
  ),
};

// Get tier badge class
const getTierClass = (tier) => {
  const tierClasses = {
    premium: styles.tierPremium,
    'upper-mid': styles.tierUpper,
    mid: styles.tierMid,
    budget: styles.tierEntry,
  };
  return tierClasses[tier] || styles.tierMid;
};

// Get score tier class
const getScoreTierClass = (score) => {
  if (score >= 9) return styles.scoreExcellent;
  if (score >= 7) return styles.scoreGood;
  if (score >= 5) return styles.scoreAverage;
  return styles.scorePoor;
};

export default function CarDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch car data
  useEffect(() => {
    let isMounted = true;

    async function loadCar() {
      try {
        setIsLoading(true);
        setError(null);
        const carData = await fetchCarBySlug(slug);
        
        if (isMounted) {
          if (carData) {
            setCar(carData);
          } else {
            // Try local fallback
            const localCar = getLocalCarBySlug(slug);
            if (localCar) {
              setCar(localCar);
            } else {
              setError('Vehicle not found');
            }
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[CarDetail] Error loading car:', err);
        if (isMounted) {
          // Try local fallback
          const localCar = getLocalCarBySlug(slug);
          if (localCar) {
            setCar(localCar);
          } else {
            setError('Failed to load vehicle data');
          }
          setIsLoading(false);
        }
      }
    }

    loadCar();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Calculate score breakdown
  const scoreBreakdown = useMemo(() => {
    if (!car) return [];
    return calculateScoreBreakdown(car, DEFAULT_WEIGHTS);
  }, [car]);

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading vehicle...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !car) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <Icons.alertCircle size={48} />
          <h2>{error || 'Vehicle not found'}</h2>
          <p>The vehicle you're looking for doesn't exist or couldn't be loaded.</p>
          <Link to="/advisory" className={styles.backButton}>
            <Icons.arrowLeft size={18} />
            Back to Advisory
          </Link>
        </div>
      </div>
    );
  }

  const tier = tierConfig[car.tier] || { label: car.tier };

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <Link to="/advisory" className={styles.backLink}>
            <Icons.arrowLeft size={18} />
            Back to Advisory
          </Link>
          
          <div className={styles.heroHeader}>
            <span className={`${styles.tierBadge} ${getTierClass(car.tier)}`}>
              {tier.label}
            </span>
            <span className={styles.categoryBadge}>{car.category}</span>
          </div>
          
          <h1 className={styles.heroTitle}>{car.name}</h1>
          <p className={styles.heroYears}>{car.years}</p>
          
          {car.tagline && (
            <p className={styles.heroTagline}>{car.tagline}</p>
          )}
          
          <div className={styles.heroHighlight}>
            <Icons.zap size={18} />
            <span>{car.highlight}</span>
          </div>
        </div>
        
        {/* Hero image with fallback placeholder */}
        <div className={styles.heroImageWrapper}>
          <CarImage car={car} variant="hero" className={styles.heroImage} />
        </div>
      </section>

      {/* Quick Specs Strip */}
      <section className={styles.specsStrip}>
        <div className={styles.specsGrid}>
          <div className={styles.specItem}>
            <span className={styles.specLabel}>Engine</span>
            <span className={styles.specValue}>{car.engine}</span>
          </div>
          <div className={styles.specItem}>
            <span className={styles.specLabel}>Power</span>
            <span className={styles.specValue}>{car.hp} hp</span>
          </div>
          <div className={styles.specItem}>
            <span className={styles.specLabel}>Transmission</span>
            <span className={styles.specValue}>{car.trans}</span>
          </div>
          {car.drivetrain && (
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Drivetrain</span>
              <span className={styles.specValue}>{car.drivetrain}</span>
            </div>
          )}
          <div className={styles.specItem}>
            <span className={styles.specLabel}>Price Range</span>
            <span className={styles.specValue}>{car.priceRange}</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Scoring Breakdown */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Icons.target size={24} />
            Performance Breakdown
          </h2>
          <p className={styles.sectionSubtitle}>
            How this vehicle scores across our key categories
          </p>
          
          <div className={styles.scoreGrid}>
            {scoreBreakdown.map(score => {
              const { label: ratingLabel, tier: ratingTier } = getScoreLabel(score.rawScore);
              return (
                <div key={score.key} className={styles.scoreCard}>
                  <div className={styles.scoreCardHeader}>
                    <span className={styles.scoreCardLabel}>{score.label}</span>
                    <span className={`${styles.scoreValue} ${getScoreTierClass(score.rawScore)}`}>
                      {score.rawScore}/10
                    </span>
                  </div>
                  <div className={styles.scoreBar}>
                    <div 
                      className={`${styles.scoreBarFill} ${getScoreTierClass(score.rawScore)}`}
                      style={{ width: `${score.percentage}%` }}
                    />
                  </div>
                  <span className={styles.scoreRating}>{ratingLabel}</span>
                </div>
              );
            })}
          </div>

          {/* How We Score Explanation */}
          <div className={styles.scoringInfoWrapper}>
            <ScoringInfo variant="carDetail" />
          </div>
        </section>

        {/* Two Column Layout */}
        <div className={styles.twoColumn}>
          {/* Left Column - Pros & Cons */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>What We Think</h2>
            
            {/* Notes */}
            <div className={styles.notesBox}>
              <p>{car.notes}</p>
            </div>

            {/* Pros */}
            {car.pros && car.pros.length > 0 && (
              <div className={styles.prosConsSection}>
                <h3 className={styles.prosTitle}>Pros</h3>
                <ul className={styles.prosList}>
                  {car.pros.map((pro, index) => (
                    <li key={index} className={styles.proItem}>
                      <Icons.check size={16} />
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cons */}
            {car.cons && car.cons.length > 0 && (
              <div className={styles.prosConsSection}>
                <h3 className={styles.consTitle}>Cons</h3>
                <ul className={styles.consList}>
                  {car.cons.map((con, index) => (
                    <li key={index} className={styles.conItem}>
                      <Icons.x size={16} />
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Right Column - Best For */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Best For</h2>
            
            {car.bestFor && car.bestFor.length > 0 ? (
              <div className={styles.bestForGrid}>
                {car.bestFor.map((archetype, index) => (
                  <div key={index} className={styles.bestForCard}>
                    <Icons.target size={18} />
                    <span>{archetype}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noBestFor}>
                This vehicle is versatile and suits many driving styles.
              </p>
            )}

            {/* Upgrade Teaser */}
            <div className={styles.upgradeTeaser}>
              <div className={styles.upgradeTeaserHeader}>
                <Icons.tool size={24} />
                <h3>Thinking About Upgrades?</h3>
              </div>
              <p>
                Explore popular modification paths for the {car.name}. 
                No pressure—just ideas and honest advice.
              </p>
              <div className={styles.upgradeTeaserActions}>
                <Link 
                  to={`/upgrades?car=${car.slug}`} 
                  className={styles.primaryButton}
                >
                  Explore Upgrades
                </Link>
                <Link to="/contact" className={styles.secondaryButton}>
                  Ask a Question
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Performance HUB CTA */}
      <section className={styles.performanceHubSection}>
        <div className={styles.container}>
          <div className={styles.performanceHubCard}>
            <div className={styles.performanceHubIcon}>
              <Icons.gauge size={32} />
            </div>
            <div className={styles.performanceHubContent}>
              <h3>See the Numbers</h3>
              <p>
                Curious how upgrades affect the {car.name}? Our Performance HUB shows 
                stock vs. upgraded specs across 7 categories. Just for fun—or to plan a build.
              </p>
            </div>
            <Link 
              to={`/cars/${car.slug}/performance`} 
              className={styles.performanceHubButton}
            >
              Open Performance HUB
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className={styles.newsletterSection}>
        <div className={styles.newsletterContent}>
          <NewsletterSignup 
            variant="default"
            source={LEAD_SOURCES.HERO_PAGE}
            carSlug={car.slug}
            title={`Interested in the ${car.name}?`}
            description="Get market insights, buying tips, and maintenance advice for this vehicle."
            buttonText="Get Updates"
            successText="You're in! We'll send relevant updates."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2>Keep Exploring</h2>
          <p>
            See how the {car.name} stacks up against other options—or browse more vehicles.
          </p>
          <Link to="/advisory" className={styles.ctaButton}>
            Back to Advisory
          </Link>
        </div>
      </section>
    </div>
  );
}

