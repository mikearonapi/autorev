import styles from './page.module.css';

export const metadata = {
  title: 'Privacy Policy | AutoRev',
  description: 'AutoRev privacy policy. Learn how we collect, use, and protect your personal information when you use our sports car discovery and modification planning platform.',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPolicy() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.lastUpdated}>Last updated: December 2024</p>

        <section className={styles.section}>
          <h2>1. Information We Collect</h2>
          <p>
            When you use AutoRev, we may collect the following types of information:
          </p>
          <ul>
            <li><strong>Account Information:</strong> Email address and display name when you create an account</li>
            <li><strong>Usage Data:</strong> Information about how you interact with our platform, including cars viewed, builds saved, and preferences</li>
            <li><strong>Device Information:</strong> Browser type, operating system, and device identifiers for analytics and optimization</li>
            <li><strong>Cookies:</strong> We use cookies to maintain your session and remember your preferences</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide and improve our car discovery and modification planning services</li>
            <li>Save your garage, builds, and preferences across sessions</li>
            <li>Send relevant communications about your account (if opted in)</li>
            <li>Analyze usage patterns to improve user experience</li>
            <li>Ensure platform security and prevent abuse</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>3. Information Sharing</h2>
          <p>
            We do not sell your personal information. We may share information with:
          </p>
          <ul>
            <li><strong>Service Providers:</strong> Third-party services that help us operate our platform (hosting, analytics)</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>4. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your information, including 
            encrypted connections (HTTPS) and secure authentication through Supabase.
          </p>
        </section>

        <section className={styles.section}>
          <h2>5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access and download your personal data</li>
            <li>Request correction of inaccurate information</li>
            <li>Delete your account and associated data</li>
            <li>Opt out of non-essential communications</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>6. Cookies</h2>
          <p>
            We use essential cookies to maintain your session and functional cookies to remember 
            your preferences. You can control cookies through your browser settings, though this 
            may affect platform functionality.
          </p>
        </section>

        <section className={styles.section}>
          <h2>7. Third-Party Services</h2>
          <p>
            Our platform integrates with third-party services including Supabase (authentication 
            and database), Vercel (hosting), and YouTube (video content). These services have 
            their own privacy policies.
          </p>
        </section>

        <section className={styles.section}>
          <h2>8. Changes to This Policy</h2>
          <p>
            We may update this privacy policy periodically. We will notify users of significant 
            changes through the platform or email.
          </p>
        </section>

        <section className={styles.section}>
          <h2>9. Contact Us</h2>
          <p>
            If you have questions about this privacy policy or your data, please contact us 
            through our <a href="/contact">contact page</a>.
          </p>
        </section>
      </div>
    </main>
  );
}








