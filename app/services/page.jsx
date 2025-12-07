import Button from '@/components/Button';
import styles from './page.module.css';

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
  { number: '1', title: 'Consult', description: 'We discuss your goals, budget, and timeline to understand exactly what you need.' },
  { number: '2', title: 'Plan', description: 'We create a detailed build plan with parts recommendations and expected outcomes.' },
  { number: '3', title: 'Source', description: 'We help source quality parts—no cheap knockoffs, just proven components.' },
  { number: '4', title: 'Install', description: 'Our experienced team handles the installation with attention to detail.' },
  { number: '5', title: 'Test', description: 'Road or track testing to verify everything works exactly as intended.' }
];

export const metadata = {
  title: 'Upgrade Services',
  description: 'Professional sports car upgrades and performance builds. From suspension setup to full builds, our team handles it all.',
};

export default function Services() {
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.badge}>Upgrade Services</span>
          <h1 className={styles.title}>
            Hands-On Help When<br />
            <span className={styles.titleAccent}>You Need It</span>
          </h1>
          <p className={styles.subtitle}>
            Not everyone has the time, tools, or confidence to do their own wrenching. 
            Our team handles everything from basic upgrades to full performance builds—
            no pressure, just honest work.
          </p>
          <Button href="/contact" variant="secondary" size="lg">
            Ask Us Anything
          </Button>
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
            <h2 className={styles.ctaTitle}>Questions? Just Ask.</h2>
            <p className={styles.ctaSubtitle}>
              No obligation. Tell us about your car and goals, and we&apos;ll share honest advice.
            </p>
            <div className={styles.ctaButtons}>
              <Button href="/contact" variant="secondary" size="lg">
                Get in Touch
              </Button>
              <Button href="/upgrades" variant="outline" size="lg">
                Explore Upgrades First
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

