'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import { fetchCarBySlug } from '@/lib/carsClient.js';
import { getCarBySlug as getLocalCarBySlug, categories, tierConfig } from '@/data/cars.js';
import { calculateScoreBreakdown, getScoreLabel, DEFAULT_WEIGHTS } from '@/lib/scoring.js';
import CarImage from '@/components/CarImage';
import ScoringInfo from '@/components/ScoringInfo';

// Icons - Using inline SVG for consistency
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
    </svg>
  ),
  book: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  car: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/>
      <circle cx="6.5" cy="16.5" r="2.5"/>
      <circle cx="16.5" cy="16.5" r="2.5"/>
    </svg>
  ),
  shield: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  dollar: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  flag: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  ),
  users: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  star: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  play: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  externalLink: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
  chevronDown: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  chevronUp: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  ),
  clipboard: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  ),
  trendingUp: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  trendingDown: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
      <polyline points="17 18 23 18 23 12"/>
    </svg>
  ),
  minus: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
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

// Get market position icon
const getMarketIcon = (position) => {
  switch (position) {
    case 'appreciating': return <Icons.trendingUp size={16} />;
    case 'depreciating': return <Icons.trendingDown size={16} />;
    default: return <Icons.minus size={16} />;
  }
};

// Collapsible Section Component
function CollapsibleSection({ title, icon, children, defaultOpen = true, id }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <section className={styles.collapsibleSection} id={id}>
      <button 
        className={styles.sectionHeader} 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className={styles.sectionHeaderLeft}>
          {icon}
          <h2>{title}</h2>
        </div>
        {isOpen ? <Icons.chevronUp size={24} /> : <Icons.chevronDown size={24} />}
      </button>
      {isOpen && <div className={styles.sectionContent}>{children}</div>}
    </section>
  );
}

export default function CarDetail() {
  const params = useParams();
  const slug = params.slug;
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
    return () => { isMounted = false; };
  }, [slug]);

  // Calculate score breakdown
  const scoreBreakdown = useMemo(() => {
    if (!car) return [];
    return calculateScoreBreakdown(car, DEFAULT_WEIGHTS);
  }, [car]);

  // Check if car has curated content
  const hasCuratedContent = useMemo(() => {
    if (!car) return false;
    return !!(car.essence || car.heritage || car.engineCharacter);
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
          <p>The vehicle you&apos;re looking for doesn&apos;t exist or couldn&apos;t be loaded.</p>
          <Link href="/car-selector" className={styles.backButton}>
            <Icons.arrowLeft size={18} />
            Back to Car Selector
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
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <Link href="/car-selector" className={styles.backLink}>
              <Icons.arrowLeft size={18} />
              Back to Car Selector
            </Link>
            
            <div className={styles.heroHeader}>
              <span className={`${styles.tierBadge} ${getTierClass(car.tier)}`}>
                {tier.label}
              </span>
              <span className={styles.categoryBadge}>{car.category}</span>
              {car.brand && (
                <span className={styles.brandBadge}>{car.brand}</span>
              )}
            </div>
            
            <h1 className={styles.heroTitle}>{car.name}</h1>
            <p className={styles.heroYears}>{car.years}</p>
            
            {/* Essence - the soul of the car */}
            {car.essence ? (
              <p className={styles.heroEssence}>{car.essence}</p>
            ) : car.tagline ? (
              <p className={styles.heroTagline}>{car.tagline}</p>
            ) : null}
            
            <div className={styles.heroHighlight}>
              <Icons.zap size={18} />
              <span>{car.highlight}</span>
            </div>
          </div>
          
          <div className={styles.heroImageWrapper}>
            <CarImage car={car} variant="hero" className={styles.heroImage} />
          </div>
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
          {car.torque && (
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Torque</span>
              <span className={styles.specValue}>{car.torque} lb-ft</span>
            </div>
          )}
          <div className={styles.specItem}>
            <span className={styles.specLabel}>Trans</span>
            <span className={styles.specValue}>{car.trans}</span>
          </div>
          {car.drivetrain && (
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Drive</span>
              <span className={styles.specValue}>{car.drivetrain}</span>
            </div>
          )}
          <div className={styles.specItem}>
            <span className={styles.specLabel}>Price</span>
            <span className={styles.specValue}>{car.priceRange}</span>
          </div>
        </div>
      </section>

      {/* Performance Metrics Strip */}
      {(car.zeroToSixty || car.quarterMile || car.curbWeight || car.braking60To0 || car.lateralG) && (
        <section className={styles.perfSpecsStrip}>
          <div className={styles.perfSpecsGrid}>
            {car.zeroToSixty && (
              <div className={styles.perfSpecItem}>
                <span className={styles.perfSpecValue}>{car.zeroToSixty}s</span>
                <span className={styles.perfSpecLabel}>0-60 mph</span>
              </div>
            )}
            {car.quarterMile && (
              <div className={styles.perfSpecItem}>
                <span className={styles.perfSpecValue}>{car.quarterMile}s</span>
                <span className={styles.perfSpecLabel}>¼ Mile</span>
              </div>
            )}
            {car.braking60To0 && (
              <div className={styles.perfSpecItem}>
                <span className={styles.perfSpecValue}>{car.braking60To0} ft</span>
                <span className={styles.perfSpecLabel}>60-0 Braking</span>
              </div>
            )}
            {car.lateralG && (
              <div className={styles.perfSpecItem}>
                <span className={styles.perfSpecValue}>{car.lateralG}g</span>
                <span className={styles.perfSpecLabel}>Lateral G</span>
              </div>
            )}
            {car.curbWeight && (
              <div className={styles.perfSpecItem}>
                <span className={styles.perfSpecValue}>{car.curbWeight.toLocaleString()} lbs</span>
                <span className={styles.perfSpecLabel}>Curb Weight</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Table of Contents - Only show if curated content exists */}
      {hasCuratedContent && (
        <nav className={styles.tocNav}>
          <div className={styles.tocInner}>
            <span className={styles.tocLabel}>Jump to:</span>
            <div className={styles.tocLinks}>
              <a href="#story">The Story</a>
              <a href="#driving">Driving Experience</a>
              <a href="#strengths">Strengths & Tradeoffs</a>
              <a href="#buyers-guide">Buyer&apos;s Guide</a>
              <a href="#ownership">Ownership</a>
              <a href="#track">Track & Performance</a>
              <a href="#alternatives">Alternatives</a>
              <a href="#community">Community</a>
              <a href="#scores">Scores</a>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <div className={styles.mainContent}>
        
        {/* ============================================================
            SECTION: THE STORY
            ============================================================ */}
        {(car.heritage || car.designPhilosophy || car.motorsportHistory) && (
          <CollapsibleSection 
            title="The Story" 
            icon={<Icons.book size={24} />}
            id="story"
            defaultOpen={true}
          >
            {car.heritage && (
              <div className={styles.storyBlock}>
                <h3>Heritage & Legacy</h3>
                <div className={styles.storyText}>
                  {car.heritage.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>
            )}
            
            {car.designPhilosophy && (
              <div className={styles.storyBlock}>
                <h3>Design Philosophy</h3>
                <div className={styles.storyText}>
                  {car.designPhilosophy.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>
            )}
            
            {car.motorsportHistory && (
              <div className={styles.storyBlock}>
                <h3>Motorsport Heritage</h3>
                <div className={styles.storyText}>
                  {car.motorsportHistory.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>
            )}

            {(car.predecessors?.length > 0 || car.successors?.length > 0) && (
              <div className={styles.lineageBar}>
                {car.predecessors?.length > 0 && (
                  <div className={styles.lineageItem}>
                    <span className={styles.lineageLabel}>Preceded by</span>
                    <span className={styles.lineageValue}>{car.predecessors.join(', ')}</span>
                  </div>
                )}
                {car.generationCode && (
                  <div className={styles.lineageItem}>
                    <span className={styles.lineageLabel}>Generation</span>
                    <span className={styles.lineageValue}>{car.generationCode}</span>
                  </div>
                )}
                {car.successors?.length > 0 && (
                  <div className={styles.lineageItem}>
                    <span className={styles.lineageLabel}>Succeeded by</span>
                    <span className={styles.lineageValue}>{car.successors.join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </CollapsibleSection>
        )}

        {/* ============================================================
            SECTION: THE DRIVING EXPERIENCE
            ============================================================ */}
        {(car.engineCharacter || car.chassisDynamics || car.transmissionFeel || car.steeringFeel || car.soundSignature) && (
          <CollapsibleSection 
            title="The Driving Experience" 
            icon={<Icons.car size={24} />}
            id="driving"
            defaultOpen={true}
          >
            <div className={styles.experienceGrid}>
              {car.engineCharacter && (
                <div className={styles.experienceCard}>
                  <h3>Engine Character</h3>
                  <div className={styles.experienceText}>
                    {car.engineCharacter.split('\n\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </div>
              )}
              
              {car.chassisDynamics && (
                <div className={styles.experienceCard}>
                  <h3>Chassis Dynamics</h3>
                  <div className={styles.experienceText}>
                    {car.chassisDynamics.split('\n\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </div>
              )}
              
              {car.transmissionFeel && (
                <div className={styles.experienceCard}>
                  <h3>Transmission Feel</h3>
                  <div className={styles.experienceText}>
                    {car.transmissionFeel.split('\n\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </div>
              )}
              
              {car.steeringFeel && (
                <div className={styles.experienceCard}>
                  <h3>Steering Feel</h3>
                  <div className={styles.experienceText}>
                    {car.steeringFeel.split('\n\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </div>
              )}
              
              {car.soundSignature && (
                <div className={styles.experienceCard}>
                  <h3>Sound Signature</h3>
                  <div className={styles.experienceText}>
                    {car.soundSignature.split('\n\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </div>
              )}
              
              {car.brakeConfidence && (
                <div className={styles.experienceCard}>
                  <h3>Brake Confidence</h3>
                  <div className={styles.experienceText}>
                    {car.brakeConfidence.split('\n\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {car.comfortNotes && (
              <div className={styles.comfortBox}>
                <h4>Daily Usability</h4>
                <p>{car.comfortNotes}</p>
                {car.comfortTrackBalance && (
                  <span className={`${styles.balanceBadge} ${styles[car.comfortTrackBalance]}`}>
                    {car.comfortTrackBalance.replace('-', ' ')}
                  </span>
                )}
              </div>
            )}
          </CollapsibleSection>
        )}

        {/* ============================================================
            SECTION: STRENGTHS & TRADEOFFS
            ============================================================ */}
        <CollapsibleSection 
          title="Strengths & Tradeoffs" 
          icon={<Icons.shield size={24} />}
          id="strengths"
          defaultOpen={true}
        >
          {/* What We Think Summary */}
          {car.notes && (
            <div className={styles.notesBox}>
              <p>{car.notes}</p>
            </div>
          )}

          <div className={styles.strengthsGrid}>
            {/* Defining Strengths */}
            <div className={styles.strengthsColumn}>
              <h3 className={styles.prosTitle}>
                <Icons.check size={20} />
                Defining Strengths
              </h3>
              {car.definingStrengths?.length > 0 ? (
                <div className={styles.strengthsList}>
                  {car.definingStrengths.map((item, index) => (
                    <div key={index} className={styles.strengthItem}>
                      <h4>{item.title}</h4>
                      <p>{item.description}</p>
                    </div>
                  ))}
                </div>
              ) : car.pros?.length > 0 ? (
                <ul className={styles.prosList}>
                  {car.pros.map((pro, index) => (
                    <li key={index} className={styles.proItem}>
                      <Icons.check size={16} />
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            {/* Honest Weaknesses */}
            <div className={styles.weaknessesColumn}>
              <h3 className={styles.consTitle}>
                <Icons.x size={20} />
                Honest Tradeoffs
              </h3>
              {car.honestWeaknesses?.length > 0 ? (
                <div className={styles.weaknessesList}>
                  {car.honestWeaknesses.map((item, index) => (
                    <div key={index} className={styles.weaknessItem}>
                      <h4>{item.title}</h4>
                      <p>{item.description}</p>
                    </div>
                  ))}
                </div>
              ) : car.cons?.length > 0 ? (
                <ul className={styles.consList}>
                  {car.cons.map((con, index) => (
                    <li key={index} className={styles.conItem}>
                      <Icons.x size={16} />
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          {/* Ideal Owner */}
          {(car.idealOwner || car.notIdealFor) && (
            <div className={styles.ownerFitSection}>
              {car.idealOwner && (
                <div className={styles.ownerFitCard}>
                  <h4>
                    <Icons.check size={18} />
                    Ideal Owner
                  </h4>
                  <p>{car.idealOwner}</p>
                </div>
              )}
              {car.notIdealFor && (
                <div className={styles.ownerFitCard}>
                  <h4>
                    <Icons.x size={18} />
                    Not Ideal For
                  </h4>
                  <p>{car.notIdealFor}</p>
                </div>
              )}
            </div>
          )}

          {/* Best For Tags */}
          {car.bestFor?.length > 0 && (
            <div className={styles.bestForSection}>
              <h4>Best For</h4>
              <div className={styles.bestForGrid}>
                {car.bestFor.map((archetype, index) => (
                  <div key={index} className={styles.bestForCard}>
                    <Icons.target size={18} />
                    <span>{archetype}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CollapsibleSection>

        {/* ============================================================
            SECTION: BUYER'S GUIDE
            ============================================================ */}
        {(car.buyersSummary || car.bestYearsDetailed || car.mustHaveOptions || car.preInspectionChecklist || car.priceGuide) && (
          <CollapsibleSection 
            title="Buyer's Guide" 
            icon={<Icons.clipboard size={24} />}
            id="buyers-guide"
            defaultOpen={true}
          >
            {car.buyersSummary && (
              <div className={styles.buyersSummary}>
                <p>{car.buyersSummary}</p>
              </div>
            )}

            {/* Market Position */}
            {car.marketPosition && (
              <div className={`${styles.marketBadge} ${styles[car.marketPosition]}`}>
                {getMarketIcon(car.marketPosition)}
                <span>Market: {car.marketPosition.charAt(0).toUpperCase() + car.marketPosition.slice(1)}</span>
              </div>
            )}

            {/* Best Years */}
            {car.bestYearsDetailed?.length > 0 && (
              <div className={styles.buyersBlock}>
                <h3>Best Years to Buy</h3>
                <div className={styles.yearsList}>
                  {car.bestYearsDetailed.map((item, index) => (
                    <div key={index} className={styles.yearItem}>
                      <span className={styles.yearBadge}>{item.years}</span>
                      <p>{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Years to Avoid */}
            {car.yearsToAvoidDetailed?.length > 0 && (
              <div className={styles.buyersBlock}>
                <h3>Years to Avoid</h3>
                <div className={styles.yearsList}>
                  {car.yearsToAvoidDetailed.map((item, index) => (
                    <div key={index} className={`${styles.yearItem} ${styles.avoid}`}>
                      <span className={`${styles.yearBadge} ${styles.avoid}`}>{item.years}</span>
                      <p>{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Must Have Options */}
            {car.mustHaveOptions?.length > 0 && (
              <div className={styles.buyersBlock}>
                <h3>Must-Have Options</h3>
                <div className={styles.optionsList}>
                  {car.mustHaveOptions.map((opt, index) => (
                    <div key={index} className={styles.optionItem}>
                      <div className={styles.optionHeader}>
                        <Icons.check size={16} />
                        <strong>{opt.name}</strong>
                      </div>
                      <p>{opt.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nice to Have Options */}
            {car.niceToHaveOptions?.length > 0 && (
              <div className={styles.buyersBlock}>
                <h3>Nice-to-Have Options</h3>
                <div className={styles.optionsList}>
                  {car.niceToHaveOptions.map((opt, index) => (
                    <div key={index} className={`${styles.optionItem} ${styles.secondary}`}>
                      <div className={styles.optionHeader}>
                        <Icons.star size={16} />
                        <strong>{opt.name}</strong>
                      </div>
                      <p>{opt.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pre-Purchase Inspection */}
            {car.preInspectionChecklist?.length > 0 && (
              <div className={styles.buyersBlock}>
                <h3>Pre-Purchase Inspection Checklist</h3>
                <ul className={styles.checklistList}>
                  {car.preInspectionChecklist.map((item, index) => (
                    <li key={index}>
                      <Icons.check size={14} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {car.ppiRecommendations && (
                  <p className={styles.ppiNote}>{car.ppiRecommendations}</p>
                )}
              </div>
            )}

            {/* Price Guide */}
            {car.priceGuide && (
              <div className={styles.buyersBlock}>
                <h3>Price Guide</h3>
                <div className={styles.priceGuideGrid}>
                  {car.priceGuide.low && (
                    <div className={styles.priceGuideCard}>
                      <span className={styles.priceLabel}>Entry Level</span>
                      <span className={styles.priceValue}>{car.priceGuide.low.price}</span>
                      <p>{car.priceGuide.low.condition}</p>
                    </div>
                  )}
                  {car.priceGuide.mid && (
                    <div className={`${styles.priceGuideCard} ${styles.recommended}`}>
                      <span className={styles.priceLabel}>Sweet Spot</span>
                      <span className={styles.priceValue}>{car.priceGuide.mid.price}</span>
                      <p>{car.priceGuide.mid.condition}</p>
                    </div>
                  )}
                  {car.priceGuide.high && (
                    <div className={styles.priceGuideCard}>
                      <span className={styles.priceLabel}>Collector Grade</span>
                      <span className={styles.priceValue}>{car.priceGuide.high.price}</span>
                      <p>{car.priceGuide.high.condition}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Market Commentary */}
            {car.marketCommentary && (
              <div className={styles.marketCommentary}>
                <h3>Market Outlook</h3>
                <div className={styles.storyText}>
                  {car.marketCommentary.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleSection>
        )}

        {/* ============================================================
            SECTION: OWNERSHIP REALITY
            ============================================================ */}
        {(car.annualOwnershipCost || car.majorServiceCosts || car.commonIssuesDetailed) && (
          <CollapsibleSection 
            title="Ownership Reality" 
            icon={<Icons.dollar size={24} />}
            id="ownership"
            defaultOpen={false}
          >
            {/* Annual Costs */}
            {car.annualOwnershipCost && (
              <div className={styles.ownershipBlock}>
                <h3>Annual Ownership Cost</h3>
                <div className={styles.costGrid}>
                  <div className={styles.costCard}>
                    <span className={styles.costLabel}>Light Use</span>
                    <span className={styles.costValue}>{car.annualOwnershipCost.low}</span>
                  </div>
                  <div className={`${styles.costCard} ${styles.typical}`}>
                    <span className={styles.costLabel}>Typical</span>
                    <span className={styles.costValue}>{car.annualOwnershipCost.typical}</span>
                  </div>
                  <div className={styles.costCard}>
                    <span className={styles.costLabel}>Heavy/Track</span>
                    <span className={styles.costValue}>{car.annualOwnershipCost.heavy}</span>
                  </div>
                </div>
                {car.annualOwnershipCost.notes && (
                  <p className={styles.costNotes}>{car.annualOwnershipCost.notes}</p>
                )}
              </div>
            )}

            {/* Major Service Costs */}
            {car.majorServiceCosts && (
              <div className={styles.ownershipBlock}>
                <h3>Major Service Costs</h3>
                <div className={styles.serviceGrid}>
                  {car.majorServiceCosts.oilChange && (
                    <div className={styles.serviceItem}>
                      <h4>Oil Change</h4>
                      <span className={styles.serviceInterval}>{car.majorServiceCosts.oilChange.interval}</span>
                      <span className={styles.serviceCost}>{car.majorServiceCosts.oilChange.cost}</span>
                      <p>{car.majorServiceCosts.oilChange.notes}</p>
                    </div>
                  )}
                  {car.majorServiceCosts.majorService && (
                    <div className={styles.serviceItem}>
                      <h4>Major Service</h4>
                      <span className={styles.serviceInterval}>{car.majorServiceCosts.majorService.interval}</span>
                      <span className={styles.serviceCost}>{car.majorServiceCosts.majorService.cost}</span>
                      <p>{car.majorServiceCosts.majorService.notes}</p>
                    </div>
                  )}
                  {car.majorServiceCosts.clutch && (
                    <div className={styles.serviceItem}>
                      <h4>Clutch Replacement</h4>
                      <span className={styles.serviceInterval}>{car.majorServiceCosts.clutch.typicalLife}</span>
                      <span className={styles.serviceCost}>{car.majorServiceCosts.clutch.cost}</span>
                      <p>{car.majorServiceCosts.clutch.notes}</p>
                    </div>
                  )}
                  {car.majorServiceCosts.brakes && (
                    <div className={styles.serviceItem}>
                      <h4>Brakes</h4>
                      <span className={styles.serviceInterval}>{car.majorServiceCosts.brakes.typicalLife}</span>
                      <span className={styles.serviceCost}>{car.majorServiceCosts.brakes.cost}</span>
                      <p>{car.majorServiceCosts.brakes.notes}</p>
                    </div>
                  )}
                  {car.majorServiceCosts.tires && (
                    <div className={styles.serviceItem}>
                      <h4>Tires</h4>
                      <span className={styles.serviceInterval}>{car.majorServiceCosts.tires.typicalLife}</span>
                      <span className={styles.serviceCost}>{car.majorServiceCosts.tires.cost}</span>
                      <p>{car.majorServiceCosts.tires.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Common Issues */}
            {car.commonIssuesDetailed?.length > 0 && (
              <div className={styles.ownershipBlock}>
                <h3>Known Issues</h3>
                <div className={styles.issuesList}>
                  {car.commonIssuesDetailed.map((issue, index) => (
                    <div key={index} className={`${styles.issueItem} ${styles[issue.severity]}`}>
                      <div className={styles.issueHeader}>
                        <h4>{issue.issue}</h4>
                        <div className={styles.issueMeta}>
                          <span className={`${styles.severityBadge} ${styles[issue.severity]}`}>
                            {issue.severity}
                          </span>
                          <span className={styles.frequencyBadge}>{issue.frequency}</span>
                        </div>
                      </div>
                      <p>{issue.notes}</p>
                      <span className={styles.issueCost}>Typical cost: {issue.cost}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ownership Notes */}
            <div className={styles.ownershipMeta}>
              {car.partsAvailability && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Parts Availability</span>
                  <span className={`${styles.metaValue} ${styles[car.partsAvailability]}`}>
                    {car.partsAvailability}
                  </span>
                </div>
              )}
              {car.dealerVsIndependent && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Service Options</span>
                  <span className={styles.metaValue}>{car.dealerVsIndependent}</span>
                </div>
              )}
              {car.diyFriendliness && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>DIY Friendly</span>
                  <span className={styles.metaValue}>{car.diyFriendliness}/10</span>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* ============================================================
            SECTION: TRACK & PERFORMANCE
            ============================================================ */}
        {(car.trackReadiness || car.recommendedTrackPrep || car.laptimeBenchmarks) && (
          <CollapsibleSection 
            title="Track & Performance" 
            icon={<Icons.flag size={24} />}
            id="track"
            defaultOpen={false}
          >
            {car.trackReadiness && (
              <div className={`${styles.trackReadinessBadge} ${styles[car.trackReadiness]}`}>
                <Icons.flag size={18} />
                <span>{car.trackReadiness.replace('-', ' ')}</span>
              </div>
            )}

            {car.trackReadinessNotes && (
              <p className={styles.trackNotes}>{car.trackReadinessNotes}</p>
            )}

            {/* Recommended Track Prep */}
            {car.recommendedTrackPrep?.length > 0 && (
              <div className={styles.trackBlock}>
                <h3>Recommended Track Prep</h3>
                <div className={styles.trackPrepList}>
                  {car.recommendedTrackPrep.map((item, index) => (
                    <div key={index} className={`${styles.trackPrepItem} ${styles[item.priority]}`}>
                      <div className={styles.trackPrepHeader}>
                        <strong>{item.item}</strong>
                        <span className={`${styles.priorityBadge} ${styles[item.priority]}`}>
                          {item.priority}
                        </span>
                      </div>
                      <span className={styles.trackPrepCost}>{item.cost}</span>
                      <p>{item.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lap Times */}
            {car.laptimeBenchmarks?.length > 0 && (
              <div className={styles.trackBlock}>
                <h3>Lap Time Benchmarks</h3>
                <div className={styles.laptimeGrid}>
                  {car.laptimeBenchmarks.map((lap, index) => (
                    <div key={index} className={styles.laptimeCard}>
                      <span className={styles.laptimeTrack}>{lap.track}</span>
                      <span className={styles.laptimeTime}>{lap.time}</span>
                      <span className={styles.laptimeSource}>{lap.source}</span>
                      {lap.notes && <p>{lap.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleSection>
        )}

        {/* ============================================================
            SECTION: ALTERNATIVES TO CONSIDER
            ============================================================ */}
        {(car.directCompetitors || car.ifYouWantMore || car.ifYouWantLess) && (
          <CollapsibleSection 
            title="Alternatives to Consider" 
            icon={<Icons.target size={24} />}
            id="alternatives"
            defaultOpen={false}
          >
            {car.directCompetitors?.length > 0 && (
              <div className={styles.alternativesBlock}>
                <h3>Direct Competitors</h3>
                <div className={styles.alternativesList}>
                  {car.directCompetitors.map((alt, index) => (
                    <div key={index} className={styles.alternativeCard}>
                      <Link href={`/cars/${alt.slug}`} className={styles.alternativeLink}>
                        <strong>{alt.name}</strong>
                        <Icons.externalLink size={14} />
                      </Link>
                      <p>{alt.comparison}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {car.ifYouWantMore?.length > 0 && (
              <div className={styles.alternativesBlock}>
                <h3>If You Want More</h3>
                <div className={styles.alternativesList}>
                  {car.ifYouWantMore.map((alt, index) => (
                    <div key={index} className={styles.alternativeCard}>
                      <Link href={`/cars/${alt.slug}`} className={styles.alternativeLink}>
                        <strong>{alt.name}</strong>
                        <Icons.externalLink size={14} />
                      </Link>
                      <p>{alt.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {car.ifYouWantLess?.length > 0 && (
              <div className={styles.alternativesBlock}>
                <h3>If You Want Less / Save Money</h3>
                <div className={styles.alternativesList}>
                  {car.ifYouWantLess.map((alt, index) => (
                    <div key={index} className={styles.alternativeCard}>
                      <Link href={`/cars/${alt.slug}`} className={styles.alternativeLink}>
                        <strong>{alt.name}</strong>
                        <Icons.externalLink size={14} />
                      </Link>
                      <p>{alt.reason || alt.comparison}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleSection>
        )}

        {/* ============================================================
            SECTION: COMMUNITY & CULTURE
            ============================================================ */}
        {(car.communityStrength || car.keyResources || car.facebookGroups) && (
          <CollapsibleSection 
            title="Community & Culture" 
            icon={<Icons.users size={24} />}
            id="community"
            defaultOpen={false}
          >
            {car.communityNotes && (
              <p className={styles.communityIntro}>{car.communityNotes}</p>
            )}

            {car.communityStrength && (
              <div className={styles.communityStrengthBar}>
                <span>Community Strength</span>
                <div className={styles.strengthMeter}>
                  <div 
                    className={styles.strengthFill} 
                    style={{ width: `${car.communityStrength * 10}%` }}
                  />
                </div>
                <span>{car.communityStrength}/10</span>
              </div>
            )}

            {car.keyResources?.length > 0 && (
              <div className={styles.communityBlock}>
                <h3>Key Resources</h3>
                <div className={styles.resourcesList}>
                  {car.keyResources.map((res, index) => (
                    <a 
                      key={index} 
                      href={res.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.resourceCard}
                    >
                      <div className={styles.resourceHeader}>
                        <strong>{res.name}</strong>
                        <span className={styles.resourceType}>{res.type}</span>
                      </div>
                      <p>{res.notes}</p>
                      <Icons.externalLink size={14} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {car.facebookGroups?.length > 0 && (
              <div className={styles.communityBlock}>
                <h3>Facebook Groups</h3>
                <div className={styles.groupsList}>
                  {car.facebookGroups.map((group, index) => (
                    <span key={index} className={styles.groupBadge}>{group}</span>
                  ))}
                </div>
              </div>
            )}

            {car.aftermarketSceneNotes && (
              <div className={styles.communityBlock}>
                <h3>Aftermarket Scene</h3>
                <p>{car.aftermarketSceneNotes}</p>
              </div>
            )}
          </CollapsibleSection>
        )}

        {/* ============================================================
            SECTION: MEDIA & REVIEWS
            ============================================================ */}
        {(car.notableReviews || car.mustWatchVideos || car.expertQuotes) && (
          <CollapsibleSection 
            title="Media & Reviews" 
            icon={<Icons.play size={24} />}
            id="media"
            defaultOpen={false}
          >
            {car.expertQuotes?.length > 0 && (
              <div className={styles.quotesSection}>
                {car.expertQuotes.map((quote, index) => (
                  <blockquote key={index} className={styles.expertQuote}>
                    <p>&ldquo;{quote.quote}&rdquo;</p>
                    <cite>— {quote.person}, {quote.outlet}</cite>
                  </blockquote>
                ))}
              </div>
            )}

            {car.notableReviews?.length > 0 && (
              <div className={styles.mediaBlock}>
                <h3>Notable Reviews</h3>
                <div className={styles.reviewsList}>
                  {car.notableReviews.map((review, index) => (
                    <div key={index} className={styles.reviewCard}>
                      <div className={styles.reviewHeader}>
                        <strong>{review.source}</strong>
                        {review.rating && <span className={styles.reviewRating}>{review.rating}</span>}
                      </div>
                      <p>&ldquo;{review.quote}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {car.mustWatchVideos?.length > 0 && (
              <div className={styles.mediaBlock}>
                <h3>Must-Watch Videos</h3>
                <div className={styles.videosList}>
                  {car.mustWatchVideos.map((video, index) => (
                    <a 
                      key={index} 
                      href={video.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.videoCard}
                    >
                      <Icons.play size={24} />
                      <div className={styles.videoInfo}>
                        <strong>{video.title}</strong>
                        <span>{video.channel}</span>
                        {video.duration && <span className={styles.videoDuration}>{video.duration}</span>}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleSection>
        )}

        {/* ============================================================
            SECTION: PERFORMANCE SCORES
            ============================================================ */}
        <CollapsibleSection 
          title="Performance Scores" 
          icon={<Icons.gauge size={24} />}
          id="scores"
          defaultOpen={!hasCuratedContent}
        >
          <p className={styles.sectionSubtitle}>
            How this vehicle scores across our key categories
          </p>
          
          <div className={styles.scoreGrid}>
            {scoreBreakdown.map(score => {
              const { label: ratingLabel } = getScoreLabel(score.rawScore);
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

          <div className={styles.scoringInfoWrapper}>
            <ScoringInfo variant="carDetail" />
          </div>
        </CollapsibleSection>

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
              href={`/performance?car=${car.slug}`} 
              className={styles.primaryButton}
            >
              Explore Upgrades
            </Link>
            <Link href="/education" className={styles.secondaryButton}>
              Learn More
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <div className={styles.ctaButtons}>
            <Link href={`/performance?car=${car.slug}`} className={styles.ctaPrimary}>
              <Icons.gauge size={20} />
              See Performance Impact
            </Link>
            <Link href="/car-selector" className={styles.ctaSecondary}>
              <Icons.arrowLeft size={18} />
              Back to Car Selector
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
