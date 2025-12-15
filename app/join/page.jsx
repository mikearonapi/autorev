'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/providers/AuthProvider';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import ScrollIndicator from '@/components/ScrollIndicator';
import styles from './page.module.css';
import { carData } from '@/data/cars.js';

// Icons
const Icons = {
  check: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  minus: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  car: ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/>
      <path d="M9 17h6"/>
      <circle cx="17" cy="17" r="2"/>
    </svg>
  ),
  garage: ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <path d="M9 22V12h6v10"/>
    </svg>
  ),
  wrench: ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  star: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  users: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  zap: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  sparkle: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z"/>
    </svg>
  ),
  robot: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="12" rx="2" ry="2"/>
      <path d="M12 2v6"/>
      <path d="M8.5 2h7"/>
      <circle cx="8" cy="14" r="1.5"/>
      <circle cx="16" cy="14" r="1.5"/>
      <path d="M9 18h6"/>
    </svg>
  ),
  fuel: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>
      <path d="M3 22h12"/>
      <path d="M18 10h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-1"/>
      <path d="M6 8h6"/>
      <path d="M6 12h6"/>
    </svg>
  ),
  search: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
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
  tool: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  gauge: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10H12V2z"/>
      <path d="M12 12L19.5 4.5"/>
    </svg>
  ),
};

// Get dynamic car count from database
const CAR_COUNT = carData?.length || 98;

// Membership tiers - simplified for clarity
const tiers = [
  {
    id: 'free',
    name: 'Free',
    price: 'Free',
    priceNote: 'Forever',
    tagline: 'Discover your dream sports car',
    icon: Icons.car,
    color: '#059669',
    features: [
      `Car Finder + full ${CAR_COUNT}-car database`,
      'Specs, education & tuning shop',
      'Community builds & newsletter',
    ],
    ai: { chats: '~25 chats/mo', label: 'Basic search & recommendations' },
    cta: 'Join Free',
    recommended: false,
  },
  {
    id: 'collector',
    name: 'Collector',
    price: 'Free',
    priceNote: 'During Beta',
    futurePrice: '$4.99/mo',
    tagline: 'Track & organize your collection',
    icon: Icons.garage,
    color: '#2563eb',
    features: [
      'My Garage — save & track cars',
      'Collections & side-by-side compare',
      'Ownership history & export',
    ],
    ai: { chats: '~75 chats/mo', label: 'Reviews, reliability & deep research' },
    cta: 'Join Free',
    recommended: true,
  },
  {
    id: 'tuner',
    name: 'Tuner',
    price: 'Free',
    priceNote: 'During Beta',
    futurePrice: '$9.99/mo',
    tagline: 'Maximum power for builders',
    icon: Icons.wrench,
    color: '#7c3aed',
    features: [
      'Save & organize tuning projects',
      'Build analytics & cost projections',
      'PDF exports & early access',
    ],
    ai: { chats: '~150 chats/mo', label: 'Unlimited tools & priority support' },
    cta: 'Join Free',
    recommended: false,
  },
];

// Community benefits
const communityBenefits = [
  {
    icon: Icons.users,
    title: 'Connect with Enthusiasts',
    description: 'Join a community of passionate car lovers who share your obsession with sports cars.',
  },
  {
    icon: Icons.zap,
    title: 'Weekly Newsletter',
    description: 'Get curated content, featured builds, and the latest in the sports car world delivered to your inbox.',
  },
  {
    icon: Icons.star,
    title: 'Share Your Journey',
    description: 'Document your ownership experience and inspire others with your builds and discoveries.',
  },
];

// Detailed feature breakdown for transparency
const featureCategories = [
  {
    id: 'discovery',
    name: 'Car Discovery & Research',
    icon: Icons.search,
    features: [
      { name: 'Full sports car database (98+ cars)', free: true, collector: true, tuner: true },
      { name: 'Car Selector with personalized matching', free: true, collector: true, tuner: true },
      { name: 'Detailed specs, history & heritage', free: true, collector: true, tuner: true },
      { name: 'Complete buying guides', free: true, collector: true, tuner: true },
      { name: 'AI-curated expert video reviews', free: true, collector: true, tuner: true },
      { name: 'EPA fuel economy data', free: true, collector: true, tuner: true },
      { name: 'NHTSA & IIHS safety ratings', free: true, collector: true, tuner: true },
      { name: 'Price by model year (best value years)', free: true, collector: true, tuner: true },
      { name: 'Side-by-side comparison tool', free: false, collector: true, tuner: true },
    ],
  },
  {
    id: 'garage',
    name: 'My Garage & Collections',
    icon: Icons.garage,
    features: [
      { name: 'Save cars to your garage', free: true, collector: true, tuner: true },
      { name: 'Add notes to saved cars', free: true, collector: true, tuner: true },
      { name: 'Organize into custom collections', free: false, collector: true, tuner: true },
      { name: 'VIN decode → exact variant identification', free: false, collector: true, tuner: true },
      { name: "Owner's Reference (oil specs, capacities)", free: false, collector: true, tuner: true },
      { name: 'Maintenance schedules for your car', free: false, collector: true, tuner: true },
      { name: 'Service log tracking', free: false, collector: true, tuner: true },
      { name: 'Service reminders', free: false, collector: true, tuner: true },
      { name: 'Export your garage data', free: false, collector: true, tuner: true },
    ],
  },
  {
    id: 'market',
    name: 'Market Value & Tracking',
    icon: Icons.dollar,
    features: [
      { name: 'General price guides', free: true, collector: true, tuner: true },
      { name: 'Market position (rising/stable/falling)', free: true, collector: true, tuner: true },
      { name: 'Bring a Trailer recent sales', free: false, collector: true, tuner: true },
      { name: 'Cars.com current listings data', free: false, collector: true, tuner: true },
      { name: 'Hagerty insurance values', free: false, collector: true, tuner: true },
      { name: 'Price history trends over time', free: false, collector: true, tuner: true },
      { name: 'VIN-specific active recall alerts', free: false, collector: true, tuner: true },
    ],
  },
  {
    id: 'performance',
    name: 'Performance Data',
    icon: Icons.gauge,
    features: [
      { name: 'Track lap times preview (2 samples)', free: true, collector: true, tuner: true },
      { name: 'Popular parts preview (3 items)', free: true, collector: true, tuner: true },
      { name: 'Full lap times library (all tracks)', free: false, collector: false, tuner: true },
      { name: 'Dyno database (real HP/torque)', free: false, collector: false, tuner: true },
      { name: 'Full parts catalog with fitments', free: false, collector: false, tuner: true },
      { name: 'Part compatibility verification', free: false, collector: false, tuner: true },
    ],
  },
  {
    id: 'builds',
    name: 'Tuning Shop & Build Projects',
    icon: Icons.tool,
    features: [
      { name: 'Browse upgrade packages', free: true, collector: true, tuner: true },
      { name: 'View recommended mods by tier', free: true, collector: true, tuner: true },
      { name: 'Save and organize build projects', free: false, collector: false, tuner: true },
      { name: 'Build cost calculator', free: false, collector: false, tuner: true },
      { name: 'HP/torque gain projections', free: false, collector: false, tuner: true },
      { name: 'Mod stack compatibility checking', free: false, collector: false, tuner: true },
      { name: 'PDF export of build plans', free: false, collector: false, tuner: true },
      { name: 'Early access to new features', free: false, collector: false, tuner: true },
    ],
  },
  {
    id: 'ai',
    name: 'AL — Your AI Co-Pilot',
    icon: Icons.robot,
    features: [
      { name: 'Monthly AI conversations', free: '~25', collector: '~75', tuner: '~150' },
      { name: 'Car recommendations', free: true, collector: true, tuner: true },
      { name: 'Common issues & solutions', free: true, collector: true, tuner: true },
      { name: 'Basic specs & questions', free: true, collector: true, tuner: true },
      { name: 'Deep reliability research', free: false, collector: true, tuner: true },
      { name: 'Ownership cost analysis', free: false, collector: true, tuner: true },
      { name: 'Knowledge base search', free: false, collector: true, tuner: true },
      { name: 'Personalized build recommendations', free: false, collector: false, tuner: true },
      { name: 'Parts compatibility questions', free: false, collector: false, tuner: true },
      { name: 'Priority response time', free: false, collector: false, tuner: true },
    ],
  },
];

// Brand suffixes for the animated REV text (full words since REV is separate)
const brandSuffixes = ['IVAL', 'ELATION', 'OLUTION'];

// Hero image - 718 Cayman GT4 RS dramatic rear shot
const heroImageUrl = '/images/pages/join-hero.jpg';

export default function JoinPage() {
  const { user, isLoading } = useAuth();
  const authModal = useAuthModal();
  
  // Animated REV text state
  const [suffixIndex, setSuffixIndex] = useState(0);
  const [suffixVisible, setSuffixVisible] = useState(true);

  // Cycle through REVival, REVelation, REVolution
  useEffect(() => {
    const interval = setInterval(() => {
      setSuffixVisible(false);
      setTimeout(() => {
        setSuffixIndex((prev) => (prev + 1) % brandSuffixes.length);
        setSuffixVisible(true);
      }, 300);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleJoin = (tierId = 'free') => {
    // Store selected tier in localStorage for the auth callback to read
    localStorage.setItem('autorev_selected_tier', tierId);
    authModal.openSignUp();
  };

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        {/* Background Image */}
        <div className={styles.heroImageWrapper}>
          <Image
            src={heroImageUrl}
            alt="718 Cayman GT4 RS rear view with glowing taillights in dramatic studio lighting"
            fill
            priority
            quality={90}
            className={styles.heroImage}
            sizes="100vw"
          />
        </div>
        <div className={styles.heroOverlay} />
        
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <Icons.sparkle size={14} />
            <span>100% Free During Launch</span>
          </div>
          <h1 className={styles.title}>
            Join the Auto{' '}
            <span className={styles.revWord}>
              <span className={styles.accent}>REV</span>
              <span className={`${styles.accent} ${styles.brandSuffix} ${suffixVisible ? styles.suffixVisible : styles.suffixHidden}`}>
                {brandSuffixes[suffixIndex]}
              </span>
            </span>
          </h1>
          <p className={styles.subtitle}>
            Whether you're dreaming about your first sports car or planning your tenth build, 
            AutoRev is your companion for the journey.
          </p>
        </div>

        <ScrollIndicator />
      </section>

      {/* Tiers Section */}
      <section className={styles.tiersSection}>
        <div className={styles.container}>
          <div className={styles.tiersHeader}>
            <h2>Choose Your Path</h2>
            <p>All tiers are free during our beta. Help us shape the future of AutoRev.</p>
          </div>

          <div className={styles.tiersGrid}>
            {tiers.map((tier) => (
              <div 
                key={tier.id} 
                className={`${styles.tierCard} ${tier.recommended ? styles.recommended : ''}`}
                style={{ '--tier-color': tier.color }}
              >
                {tier.recommended && (
                  <div className={styles.recommendedBadge}>Most Popular</div>
                )}
                
                <div className={styles.tierHeader}>
                  <div className={styles.tierIcon}>
                    <tier.icon size={28} />
                  </div>
                  <h3 className={styles.tierName}>{tier.name}</h3>
                  <div className={styles.tierPricing}>
                    <span className={styles.tierPrice}>{tier.price}</span>
                    <span className={styles.tierPriceNote}>{tier.priceNote}</span>
                  </div>
                  {tier.futurePrice && (
                    <div className={styles.futurePrice}>
                      <span>After beta: {tier.futurePrice}</span>
                    </div>
                  )}
                  <p className={styles.tierTagline}>{tier.tagline}</p>
                </div>

                <ul className={styles.featureList}>
                  {tier.features.map((feature, idx) => (
                    <li key={idx}>
                      <Icons.check size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* AL AI - Compact */}
                <div className={styles.alCompact}>
                  <div className={styles.alCompactHeader}>
                    <img 
                      src="/images/al-mascot.png" 
                      alt="AL" 
                      className={styles.alAvatar}
                      width={24} 
                      height={24} 
                    />
                    <span>AL Assistant</span>
                    <span className={styles.alCreditsTag}>{tier.ai.chats}</span>
                  </div>
                  <p className={styles.alCompactDesc}>{tier.ai.label}</p>
                </div>

                <button 
                  className={styles.tierCta}
                  onClick={() => handleJoin(tier.id)}
                  disabled={isLoading}
                >
                  {user ? 'Access Your Garage' : tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className={styles.communitySection}>
        <div className={styles.container}>
          <div className={styles.communityHeader}>
            <h2>More Than a Tool — A <span className={styles.accent}>Community</span></h2>
            <p>Join thousands of enthusiasts who are passionate about sports cars</p>
          </div>

          <div className={styles.benefitsGrid}>
            {communityBenefits.map((benefit, idx) => (
              <div key={idx} className={styles.benefitCard}>
                <div className={styles.benefitIcon}>
                  <benefit.icon size={24} />
                </div>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Feature Breakdown */}
      <section className={styles.featureBreakdown}>
        <div className={styles.container}>
          <div className={styles.breakdownHeader}>
            <h2>Full Feature <span className={styles.accent}>Breakdown</span></h2>
            <p>Everything included in each tier — we believe in transparency</p>
          </div>

          {/* Tier headers */}
          <div className={styles.breakdownTable}>
            <div className={styles.tableHeader}>
              <div className={styles.tableHeaderCell}>Features</div>
              <div className={`${styles.tableHeaderCell} ${styles.tierHeader}`}>
                <span className={styles.tierHeaderName}>Free</span>
                <span className={styles.tierHeaderPrice}>$0</span>
              </div>
              <div className={`${styles.tableHeaderCell} ${styles.tierHeader} ${styles.tierHeaderCollector}`}>
                <span className={styles.tierHeaderName}>Collector</span>
                <span className={styles.tierHeaderPrice}>$4.99/mo</span>
              </div>
              <div className={`${styles.tableHeaderCell} ${styles.tierHeader} ${styles.tierHeaderTuner}`}>
                <span className={styles.tierHeaderName}>Tuner</span>
                <span className={styles.tierHeaderPrice}>$9.99/mo</span>
              </div>
            </div>

            {/* Feature categories */}
            {featureCategories.map((category) => (
              <div key={category.id} className={styles.tableCategory}>
                <div className={styles.categoryHeader}>
                  <category.icon size={18} />
                  <span>{category.name}</span>
                </div>
                {category.features.map((feature, idx) => (
                  <div key={idx} className={styles.tableRow}>
                    <div className={styles.featureName}>{feature.name}</div>
                    <div className={styles.featureCell}>
                      {typeof feature.free === 'string' ? (
                        <span className={styles.featureLimit}>{feature.free}</span>
                      ) : feature.free ? (
                        <span className={styles.featureIncluded}><Icons.check size={16} /></span>
                      ) : (
                        <span className={styles.featureNotIncluded}><Icons.minus size={16} /></span>
                      )}
                    </div>
                    <div className={styles.featureCell}>
                      {typeof feature.collector === 'string' ? (
                        <span className={styles.featureLimit}>{feature.collector}</span>
                      ) : feature.collector ? (
                        <span className={styles.featureIncluded}><Icons.check size={16} /></span>
                      ) : (
                        <span className={styles.featureNotIncluded}><Icons.minus size={16} /></span>
                      )}
                    </div>
                    <div className={styles.featureCell}>
                      {typeof feature.tuner === 'string' ? (
                        <span className={styles.featureLimit}>{feature.tuner}</span>
                      ) : feature.tuner ? (
                        <span className={styles.featureIncluded}><Icons.check size={16} /></span>
                      ) : (
                        <span className={styles.featureNotIncluded}><Icons.minus size={16} /></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <p className={styles.breakdownNote}>
            <Icons.sparkle size={14} />
            <span>During beta, all features are unlocked for free. Pricing applies after launch.</span>
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.finalCta}>
        <div className={styles.container}>
          <h2>Ready to Find What <span className={styles.accent}>Drives You</span>?</h2>
          <p>Join AutoRev today. It's completely free during our launch.</p>
          <div className={styles.ctaButtons}>
            <button className={styles.primaryCta} onClick={() => handleJoin('collector')}>
              Create Free Account
            </button>
            <Link href="/car-selector" className={styles.secondaryCta}>
              Explore Cars First
            </Link>
          </div>
          <p className={styles.ctaNote}>No credit card required. Unsubscribe anytime.</p>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={authModal.close} 
        defaultMode={authModal.defaultMode}
      />
    </div>
  );
}

