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
import { Icons } from '@/components/ui/Icons';

// Car count for display
// NOTE: Update this when car database grows significantly (current: ~192 cars)
const CAR_COUNT = '190+';

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
      // During beta or free tier, just go to dashboard
      if (IS_BETA || tierId === 'free') {
        window.location.href = '/dashboard';
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
                    <Image 
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
            <Link href="/garage" className={styles.secondaryCta}>
              Go to My Garage
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

