/**
 * ScoringInfo Component
 * 
 * Provides transparent explanations of how we score vehicles and
 * where our data comes from. Reinforces unbiased, for-the-people positioning.
 */

import React, { useState } from 'react';
import styles from './ScoringInfo.module.css';

// Icons
const InfoIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const ChevronIcon = ({ size = 16, expanded = false }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/**
 * Scoring categories and their explanations
 */
const scoringCategories = [
  {
    key: 'sound',
    label: 'Sound',
    description: 'Exhaust note character, engine tone at various RPMs, and overall emotional response. Based on in-person evaluations and owner feedback.',
    notes: 'Higher scores go to cars with distinctive, engaging soundtracks. Turbo whine counts, but nothing beats a naturally-aspirated scream.',
  },
  {
    key: 'interior',
    label: 'Interior',
    description: 'Materials quality, design cohesion, ergonomics, and technology. We consider both objective quality and subjective character.',
    notes: 'A well-executed sporty interior can score as high as a luxury one. We\'re not just measuring price.',
  },
  {
    key: 'track',
    label: 'Track',
    description: 'Handling limits, cooling capacity, brake fade resistance, and overall track-day capability. Based on professional reviews and track-day owner reports.',
    notes: 'Some daily-focused cars score lower here, and that\'s okay—not every sports car needs to be a track weapon.',
  },
  {
    key: 'reliability',
    label: 'Reliability',
    description: 'Known issues, maintenance costs, parts availability, and real-world ownership experience from forums and owner communities.',
    notes: 'We factor in both frequency of issues and cost to resolve. A reliable expensive fix is different from an unreliable cheap fix.',
  },
  {
    key: 'value',
    label: 'Value',
    description: 'Performance and experience per dollar, considering both purchase price and total cost of ownership.',
    notes: 'A $100K car can have great value if it delivers a $150K experience. A $30K car can have poor value if it drives like a $20K car.',
  },
  {
    key: 'driverFun',
    label: 'Driver Engagement',
    description: 'Steering feel, throttle response, chassis feedback, and the sense of connection between driver and machine.',
    notes: 'This is subjective by nature, but we prioritize analog feel and driver involvement over raw capability.',
  },
  {
    key: 'aftermarket',
    label: 'Aftermarket',
    description: 'Availability of performance parts, tuning support, active community forums, and ease of modification.',
    notes: 'Niche exotics may score lower here even if excellent otherwise. If you like modding, this matters.',
  },
];

/**
 * Data sources we use
 */
const dataSources = [
  {
    name: 'Owner Communities',
    description: 'Forums, Facebook groups, and subreddits where real owners share their experiences—good and bad.',
  },
  {
    name: 'Professional Reviews',
    description: 'Track tests and long-term reviews from respected automotive journalists, weighted toward those who actually buy cars.',
  },
  {
    name: 'Our Own Experience',
    description: 'Many cars on our list we\'ve driven, owned, or maintained ourselves. We share what we know firsthand.',
  },
  {
    name: 'Market Data',
    description: 'Pricing trends, maintenance cost averages, and depreciation curves from public sources and dealers.',
  },
];

/**
 * Main ScoringInfo Component
 * Can be rendered as inline disclosure, modal, or standalone page content
 * 
 * Variants:
 * - 'inline': Collapsible disclosure (default)
 * - 'advisory': Subtle disclosure for the advisory page
 * - 'carDetail': Compact disclosure for car detail pages
 * - 'performance': For the performance hub
 * - 'full': Full content for dedicated page
 */
export default function ScoringInfo({ variant = 'inline' }) {
  const [expanded, setExpanded] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Advisory page variant - more prominent but still collapsible
  if (variant === 'advisory') {
    return (
      <div className={styles.advisoryContainer}>
        <button 
          className={styles.advisoryTrigger}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          <InfoIcon size={16} />
          <span>About Our Scoring & Sources</span>
          <ChevronIcon size={16} expanded={expanded} />
        </button>
        
        {expanded && (
          <div className={styles.advisoryContent}>
            <div className={styles.disclaimer}>
              <strong>Independent & Unbiased:</strong> All scores reflect real-world data from owner communities, 
              professional reviews, and our own driving experience. We're not affiliated with any manufacturer or dealer.
            </div>
            
            <div className={styles.twoColumn}>
              <div className={styles.column}>
                <h4>How We Score (1–10)</h4>
                <ul className={styles.scaleList}>
                  <li><span className={styles.scoreExcellent}>9–10</span> Exceptional, class-leading</li>
                  <li><span className={styles.scoreGood}>7–8</span> Very good, above average</li>
                  <li><span className={styles.scoreAverage}>5–6</span> Average for class</li>
                  <li><span className={styles.scoreBelowAverage}>1–4</span> Below average</li>
                </ul>
              </div>
              
              <div className={styles.column}>
                <h4>Our Data Sources</h4>
                <ul className={styles.sourceList}>
                  <li>Owner forums & communities</li>
                  <li>Professional track tests & reviews</li>
                  <li>First-hand driving & ownership</li>
                  <li>Market data & depreciation trends</li>
                </ul>
              </div>
            </div>
            
            <p className={styles.feedbackNote}>
              Own one of these cars? <a href="/contact">Share your experience</a>—we update scores based on community feedback.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Car detail variant - compact, subtle
  if (variant === 'carDetail') {
    return (
      <div className={styles.carDetailContainer}>
        <button 
          className={styles.carDetailTrigger}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          <InfoIcon size={14} />
          <span>How we score vehicles</span>
          <ChevronIcon size={14} expanded={expanded} />
        </button>
        
        {expanded && (
          <div className={styles.carDetailContent}>
            <p>
              Scores are editorial opinions based on owner feedback, professional reviews, and our driving experience. 
              We're not paid by any manufacturer—just enthusiasts sharing honest assessments.
            </p>
            <ul className={styles.compactScale}>
              <li><strong>9–10:</strong> Exceptional</li>
              <li><strong>7–8:</strong> Very good</li>
              <li><strong>5–6:</strong> Average</li>
              <li><strong>1–4:</strong> Below average</li>
            </ul>
            <a href="/contact" className={styles.feedbackLinkSmall}>Disagree? Let us know →</a>
          </div>
        )}
      </div>
    );
  }

  // Performance HUB variant
  if (variant === 'performance') {
    return (
      <div className={styles.performanceContainer}>
        <button 
          className={styles.performanceTrigger}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          <InfoIcon size={14} />
          <span>About these estimates</span>
          <ChevronIcon size={14} expanded={expanded} />
        </button>
        
        {expanded && (
          <div className={styles.performanceContent}>
            <p>
              <strong>Estimates Only:</strong> Upgrade impacts shown are general estimates based on typical outcomes. 
              Actual results depend on tuner quality, existing mods, conditions, and many other factors.
            </p>
            <p>
              Stock performance scores reflect our assessment of each car's capabilities. 
              Upgrade projections are illustrative—use them as a starting point, not a guarantee.
            </p>
            <a href="/contact" className={styles.feedbackLinkSmall}>Questions? Ask us →</a>
          </div>
        )}
      </div>
    );
  }

  // Inline disclosure variant (default)
  if (variant === 'inline') {
    return (
      <div className={styles.inlineContainer}>
        <button 
          className={styles.inlineTrigger}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          <InfoIcon size={14} />
          <span>How we score vehicles</span>
          <ChevronIcon size={14} expanded={expanded} />
        </button>
        
        {expanded && (
          <div className={styles.inlineContent}>
            <div className={styles.disclaimer}>
              <strong>Our Approach:</strong> All scores are editorial opinions based on real-world data. 
              We're not affiliated with any manufacturer or dealer—just enthusiasts sharing what we've learned.
            </div>
            
            <div className={styles.quickOverview}>
              <h4>Score Scale (1–10)</h4>
              <ul>
                <li><strong>9–10:</strong> Exceptional, class-leading</li>
                <li><strong>7–8:</strong> Very good, above average</li>
                <li><strong>5–6:</strong> Average, typical for class</li>
                <li><strong>3–4:</strong> Below average, notable weakness</li>
                <li><strong>1–2:</strong> Significant concerns</li>
              </ul>
            </div>
            
            <p className={styles.learnMore}>
              Scores reflect our best assessment at time of writing. 
              Cars and markets change—if you see something outdated, <a href="/contact">let us know</a>.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Full content variant (for a dedicated page or modal)
  return (
    <div className={styles.fullContainer}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Our Scoring Philosophy</h2>
        <p className={styles.sectionText}>
          We score vehicles based on a combination of objective data and real-world owner experience.
          Every number you see represents our honest assessment—not marketing speak, not paid promotion.
        </p>
        <p className={styles.sectionText}>
          We're car enthusiasts who've spent years in forums, at track days, and in garages.
          Our scores reflect what actually matters when you're living with a car, not just driving it for a weekend.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Score Categories</h2>
        <div className={styles.categoryGrid}>
          {scoringCategories.map(cat => (
            <div key={cat.key} className={styles.categoryCard}>
              <button
                className={styles.categoryHeader}
                onClick={() => setExpandedCategory(expandedCategory === cat.key ? null : cat.key)}
              >
                <span className={styles.categoryLabel}>{cat.label}</span>
                <ChevronIcon size={14} expanded={expandedCategory === cat.key} />
              </button>
              {expandedCategory === cat.key && (
                <div className={styles.categoryContent}>
                  <p>{cat.description}</p>
                  <p className={styles.categoryNote}><em>{cat.notes}</em></p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Where Our Data Comes From</h2>
        <div className={styles.sourceGrid}>
          {dataSources.map(source => (
            <div key={source.name} className={styles.sourceCard}>
              <h4 className={styles.sourceName}>{source.name}</h4>
              <p className={styles.sourceDesc}>{source.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What We're Not</h2>
        <ul className={styles.notList}>
          <li>We're <strong>not</strong> paid by manufacturers or dealers to promote any vehicle.</li>
          <li>We're <strong>not</strong> an affiliate site earning commissions on sales.</li>
          <li>We're <strong>not</strong> claiming our scores are objective truth—they're informed opinions.</li>
          <li>We <strong>do</strong> update scores when we learn new information or get community feedback.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Feedback Welcome</h2>
        <p className={styles.sectionText}>
          Own a car we've reviewed? Disagree with a score? We genuinely want to hear from you.
          The best automotive knowledge comes from the community.
        </p>
        <a href="/contact" className={styles.feedbackLink}>Share Your Thoughts →</a>
      </section>
    </div>
  );
}

/**
 * Compact inline trigger (just the link)
 */
export function ScoringInfoLink() {
  return (
    <a href="/about-scoring" className={styles.infoLink}>
      <InfoIcon size={14} />
      <span>How we score</span>
    </a>
  );
}

