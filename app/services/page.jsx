import Image from 'next/image';
import Button from '@/components/Button';
import styles from './page.module.css';

export const metadata = {
  title: 'Performance Services | Suspension, Brakes & Engine Upgrades',
  description: 'Professional motorsports service center specializing in suspension setup, brake upgrades, engine tuning, and track preparation. Expert technicians for Porsche, BMW, Corvette, and other performance vehicles.',
  keywords: ['car service', 'performance service', 'suspension setup', 'brake upgrades', 'engine tuning', 'track preparation', 'Porsche service', 'BMW M service', 'Corvette service', 'motorsports service'],
  openGraph: {
    title: 'Performance Services | SuperNatural Motorsports',
    description: 'Professional motorsports service center for suspension, brakes, engine tuning, and track prep.',
    url: '/services',
    type: 'website',
  },
  twitter: {
    title: 'Performance Services | SuperNatural Motorsports',
    description: 'Professional motorsports service center for suspension, brakes, engine tuning, and track prep.',
  },
  alternates: {
    canonical: '/services',
  },
};

// Blob URLs for page images
const BLOB_BASE = 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com';
const heroImageUrl = `${BLOB_BASE}/pages/services/hero.webp`;
const workshopImageUrl = `${BLOB_BASE}/pages/services/workshop.webp`;

// CTA Icon
const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

// Service Icons
const SuspensionIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const BrakeIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="4"/>
    <line x1="12" y1="2" x2="12" y2="4"/>
    <line x1="12" y1="20" x2="12" y2="22"/>
    <line x1="2" y1="12" x2="4" y2="12"/>
    <line x1="20" y1="12" x2="22" y2="12"/>
  </svg>
);

const PowerIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const TuneIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14"/>
    <line x1="4" y1="10" x2="4" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12" y2="3"/>
    <line x1="20" y1="21" x2="20" y2="16"/>
    <line x1="20" y1="12" x2="20" y2="3"/>
    <line x1="1" y1="14" x2="7" y2="14"/>
    <line x1="9" y1="8" x2="15" y2="8"/>
    <line x1="17" y1="16" x2="23" y2="16"/>
  </svg>
);

const TrackIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);

const services = [
  {
    icon: <SuspensionIcon />,
    title: 'Suspension Setup',
    description: 'Coilover installation, corner balancing, alignment optimization for your driving style.',
    downtime: '1-2 days',
    budget: '$500 – $3,000+',
    includes: ['Parts installation', 'Corner balance', 'Custom alignment', 'Road/track test']
  },
  {
    icon: <BrakeIcon />,
    title: 'Brake Upgrades',
    description: 'From pad/rotor upgrades to full big brake kit installation and bedding.',
    downtime: '1-3 days',
    budget: '$300 – $5,000+',
    includes: ['Parts installation', 'Fluid flush', 'Proper bedding', 'System inspection']
  },
  {
    icon: <PowerIcon />,
    title: 'Power Packages',
    description: 'Intake, exhaust, and tune combinations tailored to your goals and budget.',
    downtime: '1-4 days',
    budget: '$1,000 – $10,000+',
    includes: ['Parts installation', 'ECU tuning', 'Dyno verification', 'Heat management']
  },
  {
    icon: <TuneIcon />,
    title: 'Alignment & Setup',
    description: 'Precision alignment with specs matched to your driving style and tire choice.',
    downtime: '2-4 hours',
    budget: '$150 – $400',
    includes: ['4-wheel alignment', 'Spec consultation', 'Toe/camber notes', 'Before/after printout']
  },
  {
    icon: <TrackIcon />,
    title: 'Track Prep',
    description: 'Get your car track-ready with safety gear, brake prep, and setup consultation.',
    downtime: '1-2 days',
    budget: '$500 – $2,500+',
    includes: ['Safety inspection', 'Fluid check/change', 'Brake inspection', 'Setup consultation']
  },
  {
    icon: <ShieldIcon />,
    title: 'Reliability Packages',
    description: 'Address known weak points and preventative maintenance for peace of mind.',
    downtime: '1-3 days',
    budget: '$500 – $3,000+',
    includes: ['Known issue fixes', 'Preventative maintenance', 'Cooling upgrades', 'Documentation']
  }
];

const processSteps = [
  { number: '1', title: 'Consult', description: 'We listen first. Your goals, budget, and timeline—we understand before we prescribe.' },
  { number: '2', title: 'Plan', description: 'Disciplined planning. Detailed build plan with parts recommendations and clear outcomes.' },
  { number: '3', title: 'Source', description: 'Integrity in sourcing. Quality components only—no cheap knockoffs, no shortcuts.' },
  { number: '4', title: 'Install', description: 'Craftsmanship in execution. Every bolt torqued, every wire routed with purpose.' },
  { number: '5', title: 'Test', description: 'Verification through action. Road or track testing to prove the build performs.' }
];

export default function Services() {
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroImageWrapper}>
          <Image
            src={heroImageUrl}
            alt="Professional automotive shop"
            fill
            priority
            quality={85}
            className={styles.heroImage}
            sizes="100vw"
          />
        </div>
        <div className={styles.heroOverlay} />
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <span className={styles.badge}>Service Center</span>
            <h1 className={styles.title}>
              Excellence in<br />
              <span className={styles.titleAccent}>Every Build</span>
            </h1>
            <p className={styles.subtitle}>
              Military discipline meets motorsports craftsmanship. Our team handles 
              everything from basic bolt-ons to full track builds with the same standard 
              of excellence—no shortcuts, no compromises, just professional results.
            </p>
            <Button href="/contact" variant="secondary" size="lg" icon={<ChatIcon />}>
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className={styles.services}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>What We Offer</h2>
            <p className={styles.sectionSubtitle}>
              From quick installs to comprehensive builds
            </p>
          </div>
          <div className={styles.servicesGrid}>
            {services.map((service, index) => (
              <div key={index} className={styles.serviceCard}>
                <div className={styles.serviceIcon}>{service.icon}</div>
                <h3 className={styles.serviceTitle}>{service.title}</h3>
                <p className={styles.serviceDescription}>{service.description}</p>
                <div className={styles.serviceMeta}>
                  <div className={styles.serviceMetaItem}>
                    <span className={styles.metaLabel}>Typical Time</span>
                    <span className={styles.metaValue}>{service.downtime}</span>
                  </div>
                  <div className={styles.serviceMetaItem}>
                    <span className={styles.metaLabel}>Budget Range</span>
                    <span className={styles.metaValue}>{service.budget}</span>
                  </div>
                </div>
                <ul className={styles.serviceIncludes}>
                  {service.includes.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className={styles.process}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Our Process</h2>
            <p className={styles.sectionSubtitle}>
              From first call to first drive
            </p>
          </div>
          <div className={styles.processGrid}>
            {processSteps.map((step, index) => (
              <div key={index} className={styles.processStep}>
                <div className={styles.processNumber}>{step.number}</div>
                <h3 className={styles.processTitle}>{step.title}</h3>
                <p className={styles.processDescription}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Placeholder */}
      <section className={styles.projects}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Projects</h2>
            <p className={styles.sectionSubtitle}>
              A few builds we&apos;re proud of
            </p>
          </div>
          <div className={styles.projectsPlaceholder}>
            <p>Project photos and case studies coming soon.</p>
            <p>In the meantime, reach out to see examples of our work.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to Build with Purpose?</h2>
            <p className={styles.ctaSubtitle}>
              Tell us about your car and your mission. We&apos;ll create a plan that 
              respects your budget and delivers real results—then execute it with excellence.
            </p>
            <div className={styles.ctaButtons}>
              <Button href="/contact" variant="secondary" size="lg">
                Talk to Us
              </Button>
              <Button href="/performance" variant="outlineLight" size="lg">
                Plan Your Build First
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

