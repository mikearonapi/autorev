'use client';

import { useState } from 'react';
import Button from '@/components/Button';
import styles from './page.module.css';

// Icons
const PowerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const HandlingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M16.2 7.8l-2 6.3-6.4 2.1 2-6.3z"/>
  </svg>
);

const BrakesIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="4"/>
  </svg>
);

const SoundIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
  </svg>
);

const goals = [
  { id: 'track', label: 'Track Days', description: 'Maximum grip and lap times' },
  { id: 'canyon', label: 'Canyon Carving', description: 'Balanced handling and feedback' },
  { id: 'daily', label: 'Daily Driver+', description: 'Improved without sacrificing comfort' },
  { id: 'show', label: 'Show & Sound', description: 'Look and sound incredible' },
  { id: 'balanced', label: 'Balanced Build', description: 'A bit of everything' }
];

const budgetRanges = [
  { id: 'under2k', label: 'Under $2K', description: 'Entry-level improvements' },
  { id: '2k-5k', label: '$2K – $5K', description: 'Meaningful upgrades' },
  { id: '5k-10k', label: '$5K – $10K', description: 'Serious transformation' },
  { id: '10k-plus', label: '$10K+', description: 'Full build territory' }
];

const sampleBuilds = [
  {
    title: 'Track-Focused C7 Corvette',
    budget: '$8K – $12K',
    tags: ['Power', 'Handling', 'Brakes'],
    upgrades: ['Coilovers + alignment', 'Brake pads & fluid', 'CAI + tune', 'Seats/harness'],
    result: 'Turn a street car into a track weapon'
  },
  {
    title: 'Budget Miata Stage 1',
    budget: 'Under $2K',
    tags: ['Handling', 'Sound'],
    upgrades: ['Quality shocks', 'Sway bars', 'Header + exhaust', 'Good tires'],
    result: 'Maximum smiles-per-dollar'
  },
  {
    title: 'Daily Luxury M3/M4',
    budget: '$3K – $6K',
    tags: ['Sound', 'Power', 'Comfort'],
    upgrades: ['Downpipes + tune', 'Intake', 'Upgraded speakers', 'Quality tires'],
    result: 'More presence without compromising livability'
  }
];

export const metadata = {
  title: 'Upgrade Advisory',
  description: 'Get expert guidance on performance modifications. We help you prioritize upgrades that deliver the most driving joy per dollar.',
};

export default function Upgrades() {
  const [selectedGoal, setSelectedGoal] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');
  const [carInput, setCarInput] = useState('');

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.badge}>Upgrade Advisory</span>
          <h1 className={styles.title}>
            Build a Car That Feels<br />
            <span className={styles.titleAccent}>SuperNatural</span>
          </h1>
          <p className={styles.subtitle}>
            Whether you&apos;re driving a Miata or a GT3, we help you prioritize 
            modifications that deliver the most driving joy per dollar. 
            Every budget is welcome here.
          </p>
        </div>
      </section>

      {/* Intake Form Section */}
      <section className={styles.form}>
        <div className={styles.container}>
          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>Tell Us About Your Build</h2>
            <p className={styles.formSubtitle}>
              Share your situation and we&apos;ll help you prioritize upgrades that matter.
            </p>

            {/* Car Input */}
            <div className={styles.formGroup}>
              <label className={styles.label}>What car do you have (or are considering)?</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g., 2018 Mustang GT, C6 Corvette, ND2 Miata..."
                value={carInput}
                onChange={e => setCarInput(e.target.value)}
              />
            </div>

            {/* Goal Selection */}
            <div className={styles.formGroup}>
              <label className={styles.label}>What&apos;s your primary goal?</label>
              <div className={styles.optionsGrid}>
                {goals.map(goal => (
                  <button
                    key={goal.id}
                    type="button"
                    className={`${styles.optionCard} ${selectedGoal === goal.id ? styles.optionSelected : ''}`}
                    onClick={() => setSelectedGoal(goal.id)}
                  >
                    <span className={styles.optionLabel}>{goal.label}</span>
                    <span className={styles.optionDesc}>{goal.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Budget Selection */}
            <div className={styles.formGroup}>
              <label className={styles.label}>What&apos;s your budget range?</label>
              <div className={styles.budgetGrid}>
                {budgetRanges.map(range => (
                  <button
                    key={range.id}
                    type="button"
                    className={`${styles.budgetCard} ${selectedBudget === range.id ? styles.budgetSelected : ''}`}
                    onClick={() => setSelectedBudget(range.id)}
                  >
                    <span className={styles.budgetLabel}>{range.label}</span>
                    <span className={styles.budgetDesc}>{range.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Sliders */}
            <div className={styles.formGroup}>
              <label className={styles.label}>What matters most to you?</label>
              <div className={styles.prioritiesGrid}>
                <div className={styles.priorityItem}>
                  <div className={styles.priorityHeader}>
                    <PowerIcon />
                    <span>Power</span>
                  </div>
                  <input type="range" min="0" max="10" defaultValue="5" className={styles.slider} />
                </div>
                <div className={styles.priorityItem}>
                  <div className={styles.priorityHeader}>
                    <HandlingIcon />
                    <span>Handling</span>
                  </div>
                  <input type="range" min="0" max="10" defaultValue="5" className={styles.slider} />
                </div>
                <div className={styles.priorityItem}>
                  <div className={styles.priorityHeader}>
                    <BrakesIcon />
                    <span>Brakes</span>
                  </div>
                  <input type="range" min="0" max="10" defaultValue="5" className={styles.slider} />
                </div>
                <div className={styles.priorityItem}>
                  <div className={styles.priorityHeader}>
                    <SoundIcon />
                    <span>Sound</span>
                  </div>
                  <input type="range" min="0" max="10" defaultValue="5" className={styles.slider} />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className={styles.formSubmit}>
              <Button href="/contact" variant="primary" size="lg" fullWidth>
                Send My Info
              </Button>
              <p className={styles.formNote}>
                We&apos;ll review your setup and share our honest thoughts—no strings attached.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Builds Section */}
      <section className={styles.samples}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Example Upgrade Paths</h2>
            <p className={styles.sectionSubtitle}>
              Real builds we&apos;ve helped plan. Every budget, every goal.
            </p>
          </div>
          <div className={styles.buildsGrid}>
            {sampleBuilds.map((build, index) => (
              <div key={index} className={styles.buildCard}>
                <div className={styles.buildHeader}>
                  <h3 className={styles.buildTitle}>{build.title}</h3>
                  <span className={styles.buildBudget}>{build.budget}</span>
                </div>
                <div className={styles.buildTags}>
                  {build.tags.map(tag => (
                    <span key={tag} className={styles.buildTag}>{tag}</span>
                  ))}
                </div>
                <ul className={styles.buildList}>
                  {build.upgrades.map((upgrade, i) => (
                    <li key={i}>{upgrade}</li>
                  ))}
                </ul>
                <p className={styles.buildResult}>{build.result}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Still Exploring?</h2>
            <p className={styles.ctaSubtitle}>
              No rush. Check out the advisory to compare cars, or reach out whenever you&apos;re ready.
            </p>
            <Button href="/advisory" variant="secondary" size="lg">
              Try the Advisory
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

