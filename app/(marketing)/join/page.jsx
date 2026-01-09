'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/providers/AuthProvider';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import ScrollIndicator from '@/components/ScrollIndicator';
import FeatureBreakdown from '@/components/FeatureBreakdown';
import { UI_IMAGES } from '@/lib/images';
import styles from './page.module.css';
import { IS_BETA } from '@/lib/tierAccess';
import { useCheckout } from '@/hooks/useCheckout';

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
  book: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
};

// Car count for display (actual count from database via stats hook)
const CAR_COUNT = '100+';

// Membership tiers - clean & accurate
const tiers = [
  {
    id: 'free',
    name: 'Free',
    price: 'Free',
    priceNote: 'Forever',
    tagline: 'Research any sports car',
    icon: Icons.car,
    color: '#059669',
    features: [
      `Full ${CAR_COUNT}-car database`,
      'Specs, reviews & buying guides',
      'Side-by-side comparison',
    ],
    al: { chats: '~25/mo', label: 'Car search & basic questions' },
    cta: 'Join Free',
    recommended: false,
  },
  {
    id: 'collector',
    name: 'Enthusiast',
    price: 'Free',
    priceNote: 'During Beta',
    futurePrice: '$4.99/mo',
    tagline: 'Own & maintain your car',
    icon: Icons.garage,
    color: '#2563eb',
    features: [
      'Garage Intelligence system',
      'VIN decode, specs & service logs',
      'Maintenance schedules & recalls',
    ],
    al: { chats: '~75/mo', label: 'Reviews, reliability & maintenance' },
    cta: 'Join Free',
    recommended: true,
  },
  {
    id: 'tuner',
    name: 'Tuner',
    price: 'Free',
    priceNote: 'During Beta',
    futurePrice: '$9.99/mo',
    tagline: 'Build & modify your car',
    icon: Icons.wrench,
    color: '#7c3aed',
    features: [
      'Full parts catalog & fitments',
      'Save build projects',
      'Build cost calculator',
    ],
    al: { chats: '~150/mo', label: 'Build advice & parts search' },
    cta: 'Join Free',
    recommended: false,
  },
];

// What you get - simple value props
const valueProps = [
  {
    icon: Icons.search,
    title: 'Research',
    description: `Specs, reviews, and buying guides for ${CAR_COUNT} sports cars.`,
  },
  {
    icon: Icons.garage,
    title: 'Ownership',
    description: 'VIN decode, maintenance schedules, and service tracking.',
  },
  {
    icon: Icons.wrench,
    title: 'Build',
    description: 'Parts catalog, build projects, and cost calculator.',
  },
];

// Brand suffixes for the animated REV text (full words since REV is separate)
const brandSuffixes = ['IVAL', 'ELATION', 'OLUTION'];

// Hero image - 911 GT3 RS rear with glowing taillights (63KB WebP)
const heroImageUrl = 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/pages/join/hero-v2.webp';

export default function JoinPage() {
  const { user, isLoading } = useAuth();
  const authModal = useAuthModal();
  const { checkoutSubscription, isLoading: checkoutLoading } = useCheckout();
  
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

  const handleJoin = async (tierId = 'free') => {
    // If user is already logged in
    if (user) {
      // During beta or free tier, just go to garage
      if (IS_BETA || tierId === 'free') {
        window.location.href = '/garage';
        return;
      }
      // For paid tiers after beta, go to checkout
      await checkoutSubscription(tierId);
      return;
    }
    
    // Not logged in - store selected tier and open auth modal
    // During beta, all tiers are free so just do normal signup flow
    // After beta, paid tiers will redirect to checkout after auth
    localStorage.setItem('autorev_selected_tier', tierId);
    
    // For paid tiers after beta, also store checkout intent
    if (!IS_BETA && tierId !== 'free') {
      localStorage.setItem('autorev_checkout_intent', JSON.stringify({ 
        type: 'subscription', 
        tier: tierId 
      }));
    }
    
    authModal.openSignUp();
  };

  return (
    <div className={styles.page} data-no-main-offset>
      {/* Hero Section */}
      <section className={styles.hero}>
        {/* Background Image */}
        <div className={styles.heroImageWrapper}>
          <Image
            src={heroImageUrl}
            alt="911 GT3 RS rear view with glowing red taillight bar in dramatic darkness"
            fill
            priority
            unoptimized // Skip Next.js Image Optimization - blob images are pre-compressed via TinyPNG
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

                {/* AL AI Mechanic - Compact */}
                <div className={styles.alCompact}>
                  <div className={styles.alCompactHeader}>
                    <img 
                      src={UI_IMAGES.alMascot}
                      alt="AL" 
                      className={styles.alAvatar}
                      width={24} 
                      height={24} 
                    />
                    <span>AL AI Mechanic</span>
                    <span className={styles.alCreditsTag}>{tier.al.chats}</span>
                  </div>
                  <p className={styles.alCompactDesc}>{tier.al.label}</p>
                </div>

                <button 
                  className={styles.tierCta}
                  onClick={() => handleJoin(tier.id)}
                  disabled={isLoading || checkoutLoading}
                >
                  {checkoutLoading ? 'Processing...' : user ? 'Access Your Garage' : tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className={styles.communitySection}>
        <div className={styles.container}>
          <div className={styles.communityHeader}>
            <h2>What You <span className={styles.accent}>Get</span></h2>
            <p>Three tiers designed around how you use AutoRev</p>
          </div>

          <div className={styles.benefitsGrid}>
            {valueProps.map((prop, idx) => (
              <div key={idx} className={styles.benefitCard}>
                <div className={styles.benefitIcon}>
                  <prop.icon size={24} />
                </div>
                <h3>{prop.title}</h3>
                <p>{prop.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Feature Breakdown */}
      <FeatureBreakdown />

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

