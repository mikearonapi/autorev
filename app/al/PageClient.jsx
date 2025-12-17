'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Button from '@/components/Button';
import { useAuth } from '@/components/providers/AuthProvider';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import { useAIChat } from '@/components/AIMechanicChat';
import styles from './page.module.css';

// SVG Icons (Lucide style) - matches brand patterns
const Icons = {
  car: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/>
      <circle cx="17" cy="17" r="2"/>
    </svg>
  ),
  messageCircle: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
  ),
  wrench: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  fileCheck: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <path d="m9 15 2 2 4-4"/>
    </svg>
  ),
  playCircle: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="10 8 16 12 10 16 10 8"/>
    </svg>
  ),
  garage: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/>
      <path d="M6 18h12"/>
      <path d="M6 14h12"/>
      <rect width="12" height="12" x="6" y="10"/>
    </svg>
  ),
  alertTriangle: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  arrowRight: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  database: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M3 5v14a9 3 0 0 0 18 0V5"/>
      <path d="M3 12a9 3 0 0 0 18 0"/>
    </svg>
  ),
  shield: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
};

const capabilityCards = [
  { 
    icon: 'car', 
    title: 'Skip Hours of Research', 
    body: 'sports cars with deep data. Get exact specs, maintenance costs, and known issues in seconds — not hours of forum diving.',
    statKey: 'cars',
    statSuffix: ''
  },
  { 
    icon: 'messageCircle', 
    title: 'Know Before You Buy', 
    body: 'owner insights from Rennlist, Bimmerpost, and more. Learn what breaks, what to check in a PPI, and what mods actually work.',
    statKey: 'ownerInsights',
    statSuffix: ''
  },
  { 
    icon: 'wrench', 
    title: 'Parts That Actually Fit', 
    body: "verified fitments. Stop second-guessing — filter by your exact car, see install difficulty, and know if you'll need a tune.",
    statKey: 'verifiedFitments',
    statSuffix: ''
  },
  { 
    icon: 'fileCheck', 
    title: 'Trust the Answer', 
    body: 'Every claim backed by data — NHTSA recalls, dyno charts, forum consensus. AL tells you the source, not just "I think..."',
    statKey: null,
    statSuffix: ''
  },
  { 
    icon: 'playCircle', 
    title: 'Expert Consensus, Fast', 
    body: 'YouTube reviews analyzed. What do Throttle House, Savagegeese, and Doug DeMuro agree on? Get the consensus, not 30 tabs.',
    statKey: 'youtubeReviews',
    statSuffix: ''
  },
  { 
    icon: 'garage', 
    title: 'Knows Your Car', 
    body: 'Add your car to your garage and AL remembers. Ask "what oil do I need?" and get your exact spec, not a generic answer.',
    statKey: null,
    statSuffix: ''
  },
];

const problemBullets = [
  { 
    text: '"The 911 GT3 has 500hp" — wrong. Generic AI invents specs and gets safety-critical info wrong.',
    icon: 'alertTriangle'
  },
  { 
    text: '"This intake should fit" — maybe. Without real fitment data, you\'re gambling on expensive parts.',
    icon: 'alertTriangle'
  },
  { 
    text: '"I\'ve heard it\'s reliable" — from where? No sources means no way to verify before you buy.',
    icon: 'alertTriangle'
  },
];

const comparisonRows = [
  {
    question: 'What oil does my Cayman GT4 need?',
    generic: "Check your owner's manual for the recommended oil specification.",
    alTemplate: 'Porsche A40 spec required — 0W-40 full synthetic. Our maintenance database has capacity, interval, and filter specs for all {cars} cars.',
  },
  {
    question: 'What breaks on E46 M3s?',
    generic: 'Some owners report mechanical issues. Check enthusiast forums for details.',
    alTemplate: 'VANOS system and subframe cracks are the big ones. We have {knownIssues} documented issues across our database with severity ratings and repair cost estimates.',
  },
  {
    question: 'Will this intake fit my car?',
    generic: 'Check with the manufacturer or retailer for fitment information.',
    alTemplate: 'Searching {verifiedFitments} verified fitments. I can filter by your exact car, show install difficulty, and flag if you need a supporting tune.',
  },
];

const toolGroups = [
  {
    title: 'Search & Discovery',
    items: [
      'Find your perfect car — Describe what you want, get matched with cars that fit your criteria',
      'Compare any two cars — Side-by-side specs, ownership costs, and real trade-offs',
      'Discover local events — Car meets, track days, and shows happening near you',
    ],
  },
  {
    title: 'Car Intelligence',
    items: [
      'Get the full picture — 139 data points per car including specs, scores, and ownership costs',
      'Know before you buy — Common problems, recall history, and what to check in a PPI',
      'See what experts say — Consensus from Throttle House, Savagegeese, Doug DeMuro, and more',
    ],
  },
  {
    title: 'Parts & Upgrades',
    items: [
      'Find parts that actually fit — Search 800+ verified fitments for your exact car',
      'Plan your build — Get mod recommendations based on your goals: daily, track, or show',
      'Understand the work — Install difficulty, tune requirements, and expected gains',
    ],
  },
  {
    title: 'Ownership',
    items: [
      'Maintenance made easy — Exact fluids, capacities, and service intervals for your car',
      'Tap into owner wisdom — Real experiences from Rennlist, Bimmerpost, and enthusiast forums',
      'Get answers fast — Search our curated knowledge base built from thousands of sources',
    ],
  },
  {
    title: 'Performance Data',
    items: [
      'Real track times — Verified lap times with sources you can cite, not forum guesses',
      'Actual dyno numbers — Stock vs modified results with context on conditions and setup',
    ],
  },
];

const tierRows = [
  { label: 'Monthly Conversations', free: '~15-20', collector: '~70-80', tuner: '~175-200' },
  { label: 'All 17 Tools', free: '4 tools', collector: '✓', tuner: '✓' },
  { label: 'Community Insights', free: '—', collector: '✓', tuner: '✓' },
  { label: 'Build Recommendations', free: '—', collector: '—', tuner: '✓' },
];

const promptButtons = [
  "What's the most reliable sports car under $40k?",
  'Compare GT4 vs Supra for track use',
  'What should I check before buying a 997.2?',
];

// Format numbers with commas
function formatNumber(num) {
  if (typeof num !== 'number') return '—';
  return num.toLocaleString('en-US');
}

// Interpolate template strings with stats
function interpolateTemplate(template, stats) {
  if (!template || !stats) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = stats[key];
    return typeof value === 'number' ? formatNumber(value) : match;
  });
}

export default function PageClient() {
  const { isAuthenticated, profile } = useAuth();
  const authModal = useAuthModal();
  const { openChat } = useAIChat();
  const [accordionOpen, setAccordionOpen] = useState(() => toolGroups.map(() => false));
  const [pendingPrompt, setPendingPrompt] = useState('');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const capabilitiesRef = useRef(null);

  // Fetch stats from API
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/al/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch AL stats:', err);
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, []);

  const handleOpenChat = useCallback(() => {
    if (!isAuthenticated) {
      authModal.openSignIn();
      return;
    }
    openChat();
  }, [isAuthenticated, authModal, openChat]);

  const attemptPrefill = useCallback((prompt) => {
    if (!prompt || typeof window === 'undefined') return;
    let attempts = 0;
    const tryFill = () => {
      const textarea = document.querySelector('textarea[placeholder="Ask me anything about cars..."]');
      if (textarea) {
        textarea.focus();
        textarea.value = prompt;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
      attempts += 1;
      if (attempts < 8) requestAnimationFrame(tryFill);
    };
    tryFill();
  }, []);

  const handlePrompt = useCallback((prompt) => {
    if (!isAuthenticated) {
      setPendingPrompt(prompt);
      authModal.openSignIn();
      return;
    }
    openChat();
    setTimeout(() => attemptPrefill(prompt), 150);
  }, [isAuthenticated, authModal, openChat, attemptPrefill]);

  useEffect(() => {
    if (isAuthenticated && pendingPrompt) {
      openChat();
      setTimeout(() => attemptPrefill(pendingPrompt), 150);
      setPendingPrompt('');
    }
  }, [isAuthenticated, pendingPrompt, openChat, attemptPrefill]);

  const scrollToCapabilities = useCallback(() => {
    capabilitiesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Hero stats derived from API
  const heroStats = [
    { label: 'Sports cars', value: stats?.cars },
    { label: 'Owner insights', value: stats?.ownerInsights },
    { label: 'Verified fitments', value: stats?.verifiedFitments },
    { label: 'Known issues', value: stats?.knownIssues },
  ];

  const toggleAccordion = useCallback((index) => {
    setAccordionOpen((prev) => prev.map((open, i) => (i === index ? !open : open)));
  }, []);

  const IconComponent = ({ name, size = 24 }) => {
    const Icon = Icons[name];
    return Icon ? <Icon size={size} /> : null;
  };

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <IconComponent name="database" size={14} />
            Car AI with Real Data
          </div>
          <h1>Finally, an AI That <span className={styles.titleAccent}>Actually Knows Cars</span></h1>
          <p className={styles.subhead}>
            ChatGPT guesses. AL — AutoRev's AI — knows. Real specs, real owner insights, real fitment data — for {stats?.cars ? formatNumber(stats.cars) : '—'} sports cars and counting.
          </p>
          <div className={styles.heroActions}>
            <Button variant="primary" size="lg" onClick={handleOpenChat}>
              Ask AL Anything
            </Button>
            <Button variant="secondary" size="lg" onClick={scrollToCapabilities}>
              See What AL Knows
            </Button>
          </div>
          <div className={styles.heroStats}>
            {heroStats.map((stat) => (
              <div key={stat.label} className={styles.statCard}>
                <div className={styles.statValue}>
                  {statsLoading ? <span className={styles.statSkeleton} /> : formatNumber(stat.value)}
                </div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroGlow} />
          <div className={styles.heroCard}>
            <div className={styles.heroMascotWrapper}>
              <Image
                src="/images/al-mascot.png"
                alt="AL - AutoRev AI Assistant"
                width={180}
                height={180}
                className={styles.heroMascot}
                priority
              />
            </div>
            <div className={styles.heroCardContent}>
              <p className={styles.heroCardTitle}>What AL Can Do</p>
              <ul className={styles.heroCardList}>
                <li><IconComponent name="shield" size={16} /> Answer with exact specs, not approximations</li>
                <li><IconComponent name="wrench" size={16} /> Find parts verified to fit your car</li>
                <li><IconComponent name="alertTriangle" size={16} /> Surface known issues before you buy</li>
                <li><IconComponent name="fileCheck" size={16} /> Cite sources you can actually check</li>
              </ul>
              <Button variant="outline" fullWidth onClick={handleOpenChat}>
                Ask Your First Question
                <IconComponent name="arrowRight" size={16} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className={styles.problem}>
        <div className={styles.sectionHeader}>
          <h2>The Problem with Generic AI</h2>
          <p>You wouldn't trust a stranger's car advice. Why trust AI that can't cite its sources?</p>
        </div>
        <div className={styles.problemGrid}>
          {problemBullets.map((bullet, idx) => (
            <div key={idx} className={styles.problemCard}>
              <div className={styles.problemIcon}>
                <IconComponent name={bullet.icon} size={20} />
              </div>
              <p>{bullet.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className={styles.comparison}>
        <div className={styles.sectionHeader}>
          <h2>See the Difference</h2>
          <p>Same question. Very different answers.</p>
        </div>
        {/* Desktop table */}
        <div className={styles.tableWrapper}>
          <table className={styles.compareTable}>
            <thead>
              <tr>
                <th>Question</th>
                <th>ChatGPT Says</th>
                <th>AL Says</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, idx) => (
                <tr key={row.question} className={idx % 2 === 1 ? styles.altRow : ''}>
                  <td>{row.question}</td>
                  <td className={styles.genericAnswer}>{row.generic}</td>
                  <td className={styles.alAnswer}>{interpolateTemplate(row.alTemplate, stats)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className={styles.comparisonCards}>
          {comparisonRows.map((row) => (
            <div key={row.question} className={styles.comparisonCard}>
              <div className={styles.comparisonQuestion}>{row.question}</div>
              <div className={styles.responseComparison}>
                <div className={styles.responseBlock}>
                  <span className={`${styles.responseLabel} ${styles.chatgptLabel}`}>🤷 ChatGPT says</span>
                  <p className={`${styles.responseText} ${styles.genericAnswer}`}>{row.generic}</p>
                </div>
                <div className={styles.responseBlock}>
                  <span className={`${styles.responseLabel} ${styles.alLabel}`}>✓ AL says</span>
                  <p className={`${styles.responseText} ${styles.alAnswer}`}>{interpolateTemplate(row.alTemplate, stats)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section className={styles.capabilities} ref={capabilitiesRef}>
        <div className={styles.sectionHeader}>
          <h2>What AL Gives You</h2>
          <p>Each built to save you time and frustration.</p>
        </div>
        <div className={styles.cardGrid}>
          {capabilityCards.map((card) => (
            <div key={card.title} className={styles.card}>
              <div className={styles.cardIcon}>
                <IconComponent name={card.icon} size={24} />
              </div>
              <h3>{card.title}</h3>
              <p>
                {card.statKey && stats?.[card.statKey] ? (
                  <><strong>{formatNumber(stats[card.statKey])}</strong> {card.body}</>
                ) : (
                  card.body
                )}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tools accordion */}
      <section className={styles.tools}>
        <div className={styles.sectionHeader}>
          <h2>What You Can Ask AL</h2>
          <p>From finding your next car to maintaining the one you have — AL has you covered.</p>
        </div>
        <div className={styles.accordion}>
          {toolGroups.map((group, idx) => (
            <div key={group.title} className={styles.accordionItem}>
              <button className={styles.accordionTrigger} onClick={() => toggleAccordion(idx)} aria-expanded={accordionOpen[idx]}>
                <span>{group.title}</span>
                <span className={styles.chevron}>{accordionOpen[idx] ? '−' : '+'}</span>
              </button>
              {accordionOpen[idx] && (
                <ul className={styles.accordionContent}>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className={styles.pricing}>
        <div className={styles.sectionHeader}>
          <h2>Pricing by Tier</h2>
          <p>Based on typical token usage. Actual conversations depend on query complexity.</p>
        </div>
        {/* Desktop table */}
        <div className={styles.pricingTable}>
          <div className={styles.pricingHead}>
            <div />
            <div>Free</div>
            <div>Collector</div>
            <div>Tuner</div>
          </div>
          {tierRows.map((row, idx) => (
            <div key={row.label} className={`${styles.pricingRow} ${idx % 2 === 1 ? styles.altRow : ''}`}>
              <div className={styles.pricingLabel}>{row.label}</div>
              <div>{row.free}</div>
              <div>{row.collector}</div>
              <div>{row.tuner}</div>
            </div>
          ))}
        </div>
        {/* Mobile cards */}
        <div className={styles.pricingCards}>
          {[
            { id: 'free', name: 'Free', summary: tierRows[0]?.free || '~15-20', values: tierRows.map((row) => ({ label: row.label, value: row.free })) },
            { id: 'collector', name: 'Collector', summary: tierRows[0]?.collector || '~70-80', values: tierRows.map((row) => ({ label: row.label, value: row.collector })) },
            { id: 'tuner', name: 'Tuner', summary: tierRows[0]?.tuner || '~175-200', values: tierRows.map((row) => ({ label: row.label, value: row.tuner })) },
          ].map((tier) => {
            const isCurrent = profile?.subscription_tier === tier.id;
            return (
              <div key={tier.id} className={`${styles.pricingCard} ${isCurrent ? styles.activeTier : ''}`}>
                <div className={styles.pricingCardHeader}>
                  <div className={styles.pricingCardTitle}>{tier.name}</div>
                  {isCurrent && <span className={styles.currentTierBadge}>Current plan</span>}
                </div>
                <div className={styles.pricingCardSummary}>{tier.summary}</div>
                <ul className={styles.pricingCardList}>
                  {tier.values.map((entry) => (
                    <li key={`${tier.id}-${entry.label}`}>
                      <span className={styles.pricingItemLabel}>{entry.label}</span>
                      <span className={styles.pricingItemValue}>{entry.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA / prompt section */}
      <section className={styles.tryNow}>
        <div className={styles.sectionHeader}>
          <h2>What Do You Want to Know?</h2>
          <p>Pick a question to try, or ask your own. Free accounts get ~15-20 conversations per month.</p>
        </div>
        <div className={styles.promptGrid}>
          {promptButtons.map((prompt) => (
            <button key={prompt} className={styles.promptButton} onClick={() => handlePrompt(prompt)}>
              {prompt}
            </button>
          ))}
        </div>
        <div className={styles.tryActions}>
          <Button variant="primary" size="lg" onClick={handleOpenChat}>
            Try It Free
            <IconComponent name="arrowRight" size={18} />
          </Button>
        </div>
      </section>

      {/* Mobile sticky CTA */}
      <div className={styles.mobileStickyCta}>
        <Button fullWidth variant="primary" onClick={() => handlePrompt(promptButtons[0])}>
          Ask AL Anything
        </Button>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={authModal.isOpen} onClose={authModal.close} defaultMode={authModal.defaultMode} />
    </div>
  );
}

