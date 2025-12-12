import styles from './page.module.css';

export const metadata = {
  title: 'Terms of Service | AutoRev',
  description: 'AutoRev terms of service. Read our terms and conditions for using the sports car discovery and modification planning platform.',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsOfService() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.lastUpdated}>Last updated: December 2024</p>

        <section className={styles.section}>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using AutoRev, you agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use our platform.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. Description of Service</h2>
          <p>
            AutoRev is an educational and informational platform designed to help automotive 
            enthusiasts discover sports cars and plan vehicle modifications. We provide:
          </p>
          <ul>
            <li>Car discovery and comparison tools</li>
            <li>Modification planning resources</li>
            <li>Educational content about vehicle upgrades</li>
            <li>Personal garage and build tracking features</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>3. User Accounts</h2>
          <p>
            To access certain features, you may need to create an account. You are responsible for:
          </p>
          <ul>
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized use</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the platform for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with or disrupt the platform&apos;s operation</li>
            <li>Scrape or collect data without permission</li>
            <li>Impersonate others or provide false information</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>5. Content Disclaimer</h2>
          <p>
            <strong>Important:</strong> All information on AutoRev is provided for educational 
            and informational purposes only. We are not responsible for:
          </p>
          <ul>
            <li>The accuracy of pricing estimates or specifications</li>
            <li>Results of modifications made based on our content</li>
            <li>Compatibility of parts or upgrades with your specific vehicle</li>
            <li>Any damage, injury, or loss resulting from vehicle modifications</li>
          </ul>
          <p>
            Always consult with qualified automotive professionals before performing any 
            modifications to your vehicle. Modifications may affect vehicle warranty, 
            insurance, safety, and emissions compliance.
          </p>
        </section>

        <section className={styles.section}>
          <h2>6. Intellectual Property</h2>
          <p>
            All content on AutoRev, including text, graphics, logos, and software, is owned 
            by AutoRev or its licensors and is protected by intellectual property laws. 
            You may not reproduce, distribute, or create derivative works without permission.
          </p>
        </section>

        <section className={styles.section}>
          <h2>7. Third-Party Content</h2>
          <p>
            Our platform may display content from third parties, including YouTube videos 
            and expert reviews. We do not control or endorse third-party content and are 
            not responsible for its accuracy or availability.
          </p>
        </section>

        <section className={styles.section}>
          <h2>8. Limitation of Liability</h2>
          <p>
            AutoRev is provided &quot;as is&quot; without warranties of any kind. To the maximum 
            extent permitted by law, we shall not be liable for any indirect, incidental, 
            special, or consequential damages arising from your use of the platform.
          </p>
        </section>

        <section className={styles.section}>
          <h2>9. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Continued use of the 
            platform after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section className={styles.section}>
          <h2>10. Contact</h2>
          <p>
            For questions about these terms, please contact us through our{' '}
            <a href="/contact">contact page</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
