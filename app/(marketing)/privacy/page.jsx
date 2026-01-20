// LEGAL DISCLAIMER: This document should be reviewed by a qualified attorney
// before deployment. Placeholders marked with [BRACKETS] must be filled in.

import Link from 'next/link';
import styles from '@/styles/legal-page.module.css';

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
    <div className={styles.page}>
      {/* Hero-style Header - matches homepage */}
      <header className={styles.heroHeader}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoAuto}>AUTO</span>
          <span className={styles.logoRev}>REV</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.contentCard}>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.lastUpdated}>Last updated: January 20, 2026</p>

          {/* Table of Contents */}
          <nav className={styles.toc}>
            <h3 className={styles.tocTitle}>Table of Contents</h3>
            <ol className={styles.tocList}>
              <li><a href="#information-we-collect">Information We Collect</a></li>
              <li><a href="#how-we-use-information">How We Use Information</a></li>
              <li><a href="#third-party-services">Third-Party Services</a></li>
              <li><a href="#data-retention-deletion">Data Retention & Deletion</a></li>
              <li><a href="#user-rights">Your Rights</a></li>
              <li><a href="#cookies-tracking">Cookies & Tracking</a></li>
              <li><a href="#security-measures">Security Measures</a></li>
              <li><a href="#children-privacy">Children's Privacy</a></li>
              <li><a href="#california-residents">California Residents (CCPA)</a></li>
              <li><a href="#international-users">International Users</a></li>
              <li><a href="#updates-policy">Updates to This Policy</a></li>
              <li><a href="#contact-information">Contact Information</a></li>
            </ol>
          </nav>

          <section className={styles.section} id="information-we-collect">
            <h2>1. Information We Collect</h2>
            
            <h3>1.1 Account Information</h3>
            <p>
              When you create an account with AutoRev, we collect:
            </p>
            <ul>
              <li><strong>Email address:</strong> Used for authentication and account communications</li>
              <li><strong>Display name:</strong> Optional name displayed in your profile</li>
              <li><strong>Authentication data:</strong> Password hash or OAuth tokens from Google sign-in (managed by Supabase Auth)</li>
              <li><strong>Profile settings:</strong> Preferred units (metric/imperial), notification preferences</li>
              <li><strong>Subscription tier:</strong> Free, Collector, or Tuner membership level</li>
            </ul>

            <h3>1.2 Vehicle and Usage Data</h3>
            <p>
              When you use AutoRev features, we may collect:
            </p>
            <ul>
              <li><strong>Favorite cars:</strong> Cars you save to your garage for quick access</li>
              <li><strong>Owned vehicles:</strong> Vehicle details including VIN, year, make, model, trim, mileage, and purchase information (Enthusiast tier)</li>
              <li><strong>Service logs:</strong> Maintenance records for your owned vehicles (Enthusiast tier)</li>
              <li><strong>Build projects:</strong> Saved modification plans and upgrade selections (Tuner tier)</li>
              <li><strong>Comparison lists:</strong> Cars you compare side-by-side</li>
              <li><strong>Car Selector preferences:</strong> Priority weights and filter selections</li>
            </ul>

            <h3>1.3 AL Assistant Conversations</h3>
            <p>
              When you interact with our AL AI assistant, we collect:
            </p>
            <ul>
              <li><strong>Chat messages:</strong> Your questions and AL's responses</li>
              <li><strong>Tool usage:</strong> Which database queries and tools AL used to answer your questions</li>
              <li><strong>Token usage:</strong> Number of input and output tokens for billing and usage tracking</li>
              <li><strong>Conversation metadata:</strong> Timestamps, car context, and conversation summaries</li>
              <li><strong>Credit usage:</strong> AL credits consumed per conversation</li>
            </ul>

            <h3>1.4 Feedback and Communications</h3>
            <ul>
              <li><strong>Feedback submissions:</strong> Bug reports, feature requests, and general feedback through our FeedbackWidget</li>
              <li><strong>Contact form messages:</strong> Inquiries submitted through the contact page</li>
              <li><strong>Event submissions:</strong> User-submitted car events for moderation</li>
              <li><strong>Email communications:</strong> Any email correspondence with our support team</li>
            </ul>

            <h3>1.5 Automatically Collected Information</h3>
            <ul>
              <li><strong>Browser and device data:</strong> Browser type, operating system, screen resolution, device identifiers</li>
              <li><strong>Log data:</strong> IP address, access times, pages viewed, referral URLs</li>
              <li><strong>Session data:</strong> Authentication tokens stored in cookies for session management</li>
              <li><strong>Analytics data:</strong> Page views, feature usage, click patterns (anonymized where possible)</li>
            </ul>
          </section>

          <section className={styles.section} id="how-we-use-information">
            <h2>2. How We Use Your Information</h2>
            
            <h3>2.1 Core Platform Services</h3>
            <p>We use your information to:</p>
            <ul>
              <li>Provide car discovery, comparison, and recommendation services</li>
              <li>Save your garage, favorites, and build projects across sessions</li>
              <li>Enable ownership tracking and service log features (Enthusiast tier)</li>
              <li>Provide performance data and parts catalog access (Tuner tier)</li>
              <li>Manage your subscription tier and feature access</li>
            </ul>

            <h3>2.2 Personalization and Recommendations</h3>
            <ul>
              <li>Personalize car recommendations based on your Car Selector preferences</li>
              <li>Provide upgrade recommendations tailored to your owned vehicles</li>
              <li>Display relevant car events based on your location and garage vehicles</li>
              <li>Remember your preferred units and display settings</li>
            </ul>

            <h3>2.3 AL Assistant Context</h3>
            <ul>
              <li>Provide AL with context about your garage and owned vehicles for personalized assistance</li>
              <li>Maintain conversation history for follow-up questions</li>
              <li>Track credit usage and enforce monthly usage limits</li>
              <li>Improve AL's responses through conversation analysis</li>
            </ul>

            <h3>2.4 Platform Improvement</h3>
            <ul>
              <li>Analyze usage patterns to improve user experience and feature design</li>
              <li>Identify and fix bugs reported through feedback submissions</li>
              <li>Prioritize new features based on user requests and behavior</li>
              <li>Optimize database performance and query efficiency</li>
            </ul>

            <h3>2.5 Communication</h3>
            <ul>
              <li>Send transactional emails (account verification, password resets)</li>
              <li>Respond to contact form inquiries and support requests</li>
              <li>Send optional newsletters and feature updates (with your consent)</li>
              <li>Notify you of changes to terms, privacy policy, or subscription</li>
            </ul>

            <h3>2.6 Security and Legal Compliance</h3>
            <ul>
              <li>Detect and prevent fraudulent activity and abuse</li>
              <li>Enforce our Terms of Service</li>
              <li>Comply with legal obligations and respond to lawful requests</li>
              <li>Protect the rights, property, and safety of AutoRev, our users, and the public</li>
            </ul>
          </section>

          <section className={styles.section} id="third-party-services">
            <h2>3. Third-Party Services</h2>
            
            <p>
              AutoRev integrates with the following third-party services. Each service has its own privacy policy 
              governing how they collect and use data:
            </p>

            <h3>3.1 Infrastructure and Hosting</h3>
            <ul>
              <li>
                <strong>Supabase (PostgreSQL + Auth):</strong> Database storage for all car data, user profiles, and application data. 
                Handles user authentication. Data stored in [US/EU region - confirm with your setup].
                <br />Privacy Policy: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">https://supabase.com/privacy</a>
              </li>
              <li>
                <strong>Vercel:</strong> Hosting and content delivery network. Processes requests and serves application.
                <br />Privacy Policy: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">https://vercel.com/legal/privacy-policy</a>
              </li>
              <li>
                <strong>Vercel Blob Storage:</strong> Image hosting for car photos and user-uploaded gallery images.
                <br />Privacy Policy: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">https://vercel.com/legal/privacy-policy</a>
              </li>
            </ul>

            <h3>3.2 AI Services</h3>
            <ul>
              <li>
                <strong>Anthropic (Claude AI):</strong> Powers the AL assistant. Processes user queries and conversation history. 
                We send conversation context but do not train custom models on your data.
                <br />Privacy Policy: <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer">https://www.anthropic.com/privacy</a>
              </li>
              <li>
                <strong>OpenAI:</strong> Generates vector embeddings for our knowledge base search (text-embedding-3-small model). 
                Text is processed but not used for training.
                <br />Privacy Policy: <a href="https://openai.com/privacy" target="_blank" rel="noopener noreferrer">https://openai.com/privacy</a>
              </li>
            </ul>

            <h3>3.3 External APIs</h3>
            <ul>
              <li>
                <strong>Google APIs:</strong> We use YouTube Data API for expert review integration, and may use Google OAuth for authentication. 
                Your YouTube watch history is not collected.
                <br />Privacy Policy: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy</a>
              </li>
              <li>
                <strong>NHTSA (National Highway Traffic Safety Administration):</strong> We fetch vehicle safety ratings, recall data, and complaints 
                from this public government API. No personal data is shared.
                <br />Website: <a href="https://www.nhtsa.gov" target="_blank" rel="noopener noreferrer">https://www.nhtsa.gov</a>
              </li>
              <li>
                <strong>EPA (Environmental Protection Agency):</strong> We fetch fuel economy data from this public government API. 
                No personal data is shared.
                <br />Website: <a href="https://www.epa.gov" target="_blank" rel="noopener noreferrer">https://www.epa.gov</a>
              </li>
            </ul>

            <h3>3.4 Payment Processing (Future)</h3>
            <p>
              If we implement credit purchases or paid subscriptions, we will integrate with a payment processor 
              (e.g., Stripe) that will handle all payment card information. We will not store payment card details 
              on our servers. This section will be updated when payment features are added.
            </p>
          </section>

          <section className={styles.section} id="data-retention-deletion">
            <h2>4. Data Retention & Deletion</h2>
            
            <h3>4.1 How Long We Keep Your Data</h3>
            <ul>
              <li><strong>Account data:</strong> Retained as long as your account is active</li>
              <li><strong>Owned vehicles and garage:</strong> Retained until you delete them or close your account</li>
              <li><strong>AL conversation history:</strong> Retained until you delete it or close your account</li>
              <li><strong>Feedback submissions:</strong> Retained indefinitely for product improvement (anonymized where possible)</li>
              <li><strong>Analytics and logs:</strong> Retained for 90 days, then aggregated or deleted</li>
              <li><strong>Contact form submissions:</strong> Retained until request is resolved</li>
            </ul>

            <h3>4.2 How to Delete Your Data</h3>
            <p>You can delete your data in the following ways:</p>
            <ul>
              <li><strong>Individual items:</strong> Delete favorite cars, build projects, or service logs directly from your garage</li>
              <li><strong>Owned vehicles:</strong> Remove vehicles from your garage using the delete option</li>
              <li><strong>Clear specific data:</strong> Use the "Clear My Data" feature in your profile settings to selectively remove favorites, vehicles, projects, or AL history</li>
              <li><strong>Full account deletion:</strong> Email us at <strong>contact@autorev.app</strong> with "Delete My Account" in the subject line. 
              We will delete your account and all associated data within 30 days.</li>
            </ul>

            <h3>4.3 What Happens After Deletion</h3>
            <p>When you delete your account:</p>
            <ul>
              <li>All personal information (email, profile, owned vehicles) is permanently deleted</li>
              <li>AL conversation history is anonymized (user ID removed, content retained for model improvement)</li>
              <li>Feedback submissions are anonymized (name and email removed)</li>
              <li>Backup copies are deleted within 90 days</li>
            </ul>

            <h3>4.4 Exceptions to Deletion</h3>
            <p>We may retain certain information when required by law or for legitimate business purposes:</p>
            <ul>
              <li>Financial records for tax and accounting compliance (7 years)</li>
              <li>Legal disputes or investigations</li>
              <li>Fraud prevention and security incidents</li>
            </ul>
          </section>

          <section className={styles.section} id="user-rights">
            <h2>5. Your Rights</h2>
            
            <h3>5.1 Access and Portability</h3>
            <p>You have the right to:</p>
            <ul>
              <li>Access all personal data we hold about you</li>
              <li>Request a copy of your data in a portable format (JSON or CSV)</li>
              <li>View your AL conversation history and credit usage</li>
            </ul>
            <p>To request a data export, email <strong>contact@autorev.app</strong> with "Data Export Request" in the subject line.</p>

            <h3>5.2 Correction and Updates</h3>
            <p>You can update your information:</p>
            <ul>
              <li>Profile settings: Edit your display name and preferences in /profile</li>
              <li>Owned vehicles: Update mileage, nickname, and details in your garage</li>
              <li>Contact us if you cannot update information yourself</li>
            </ul>

            <h3>5.3 Deletion</h3>
            <p>See section 4.2 above for deletion instructions.</p>

            <h3>5.4 Opt-Out of Communications</h3>
            <p>You can:</p>
            <ul>
              <li>Unsubscribe from marketing emails using the link in any email</li>
              <li>Disable email notifications in your profile settings</li>
              <li>Note: We must still send transactional emails (password resets, account security)</li>
            </ul>

            <h3>5.5 Object to Processing</h3>
            <p>
              You have the right to object to certain types of data processing, such as analytics or marketing. 
              Contact us to discuss your specific concerns.
            </p>
          </section>

          <section className={styles.section} id="cookies-tracking">
            <h2>6. Cookies & Tracking</h2>
            
            <h3>6.1 Types of Cookies We Use</h3>
            
            <h4>Essential Cookies (Cannot be Disabled)</h4>
            <ul>
              <li><strong>Authentication tokens:</strong> Keep you logged in (Supabase session cookies)</li>
              <li><strong>Security tokens:</strong> Prevent CSRF attacks and ensure secure requests</li>
            </ul>

            <h4>Functional Cookies (Improve Your Experience)</h4>
            <ul>
              <li><strong>Preferences:</strong> Remember your unit preferences (metric vs imperial)</li>
              <li><strong>Session state:</strong> Remember your Car Selector filters and comparison lists</li>
              <li><strong>Theme settings:</strong> Remember display preferences</li>
            </ul>

            <h4>Analytics Cookies (Optional - If Implemented)</h4>
            <p>
              We may use analytics cookies to understand how users interact with AutoRev. This helps us improve 
              the platform. These cookies may be provided by:
            </p>
            <ul>
              <li>Vercel Analytics (first-party analytics)</li>
              <li>Google Analytics (if implemented) - Can be opted out via browser settings</li>
            </ul>

            <h3>6.2 How to Control Cookies</h3>
            <p>You can control cookies through:</p>
            <ul>
              <li><strong>Browser settings:</strong> Most browsers allow you to block or delete cookies</li>
              <li><strong>Do Not Track:</strong> We respect browser Do Not Track signals where possible</li>
              <li><strong>Cookie banner:</strong> [If implemented] Use our cookie preferences to opt out of non-essential cookies</li>
            </ul>
            <p>
              <strong>Note:</strong> Disabling essential cookies will prevent you from logging in and using 
              personalized features.
            </p>

            <h3>6.3 Third-Party Tracking</h3>
            <p>
              We do not use third-party advertising networks or tracking pixels. YouTube embeds (expert reviews) 
              may set their own cookies when you play videos. Refer to Google's privacy policy for details.
            </p>
          </section>

          <section className={styles.section} id="security-measures">
            <h2>7. Security Measures</h2>
            
            <p>We implement the following security measures to protect your data:</p>

            <h3>7.1 Technical Safeguards</h3>
            <ul>
              <li><strong>Encryption in transit:</strong> All connections use HTTPS/TLS encryption</li>
              <li><strong>Encryption at rest:</strong> Database encryption managed by Supabase</li>
              <li><strong>Password security:</strong> Passwords are hashed using bcrypt (managed by Supabase Auth)</li>
              <li><strong>OAuth authentication:</strong> Google sign-in eliminates password storage risks</li>
              <li><strong>Row-level security (RLS):</strong> Database policies ensure users can only access their own data</li>
              <li><strong>API authentication:</strong> All API requests require valid session tokens</li>
            </ul>

            <h3>7.2 Access Controls</h3>
            <ul>
              <li>Admin access is restricted to authorized personnel only</li>
              <li>Database access requires multi-factor authentication</li>
              <li>Service role keys are stored securely as environment variables</li>
              <li>Cron jobs use authenticated secret tokens</li>
            </ul>

            <h3>7.3 Monitoring and Response</h3>
            <ul>
              <li>Automated monitoring for suspicious activity and login attempts</li>
              <li>Regular security audits of dependencies and code</li>
              <li>Incident response plan for data breaches (notification within 72 hours where required by law)</li>
            </ul>

            <h3>7.4 Limitations</h3>
            <p>
              While we implement strong security measures, no system is 100% secure. You are responsible for 
              keeping your account credentials confidential. If you suspect unauthorized access, change your 
              password immediately and contact us.
            </p>
          </section>

          <section className={styles.section} id="children-privacy">
            <h2>8. Children's Privacy</h2>
            
            <p>
              AutoRev is not intended for children under the age of 13 (or 16 in the EU). We do not knowingly 
              collect personal information from children. If you are a parent or guardian and believe your child 
              has provided us with personal information, please contact us immediately. We will delete such 
              information within 30 days.
            </p>
          </section>

          <section className={styles.section} id="california-residents">
            <h2>9. California Residents (CCPA)</h2>
            
            <p>
              If you are a California resident, you have additional rights under the California Consumer Privacy 
              Act (CCPA):
            </p>

            <h3>9.1 Right to Know</h3>
            <p>You have the right to request:</p>
            <ul>
              <li>Categories and specific pieces of personal information we collect</li>
              <li>Categories of sources from which we collect personal information</li>
              <li>Business or commercial purpose for collecting personal information</li>
              <li>Categories of third parties with whom we share personal information</li>
            </ul>

            <h3>9.2 Right to Delete</h3>
            <p>
              You have the right to request deletion of your personal information, subject to certain exceptions 
              (see Section 4.4).
            </p>

            <h3>9.3 Right to Opt-Out of Sale</h3>
            <p>
              <strong>We do not sell your personal information.</strong> We have not sold personal information 
              in the preceding 12 months and do not plan to do so in the future.
            </p>

            <h3>9.4 Right to Non-Discrimination</h3>
            <p>
              We will not discriminate against you for exercising your CCPA rights. You will not be denied 
              service, charged different prices, or provided a different level of service for making a CCPA request.
            </p>

            <h3>9.5 How to Exercise Your Rights</h3>
            <p>
              To exercise any of these rights, email <strong>contact@autorev.app</strong> with "CCPA Request" 
              in the subject line. We will verify your identity and respond within 45 days.
            </p>
          </section>

          <section className={styles.section} id="international-users">
            <h2>10. International Users</h2>
            
            <p>
              AutoRev is operated from the United States. If you access our platform from outside the U.S., 
              your information may be transferred to, stored, and processed in the United States or other countries.
            </p>

            <h3>10.1 Data Transfer</h3>
            <p>
              Our database infrastructure (Supabase) may store data in multiple regions. We use industry-standard 
              safeguards to protect data during international transfers.
            </p>

            <h3>10.2 GDPR Compliance (EU Users)</h3>
            <p>If you are located in the European Economic Area (EEA), you have additional rights under GDPR:</p>
            <ul>
              <li><strong>Legal basis for processing:</strong> We process your data based on consent, contract performance, 
              or legitimate interests</li>
              <li><strong>Right to erasure:</strong> You can request deletion of your data (see Section 4.2)</li>
              <li><strong>Right to restriction:</strong> You can request we limit how we use your data</li>
              <li><strong>Right to data portability:</strong> You can receive your data in a structured, machine-readable format</li>
              <li><strong>Right to object:</strong> You can object to certain types of processing</li>
              <li><strong>Right to lodge a complaint:</strong> You can file a complaint with your local data protection authority</li>
            </ul>
            <p>
              To exercise these rights, contact us at <strong>contact@autorev.app</strong>.
            </p>
          </section>

          <section className={styles.section} id="updates-policy">
            <h2>11. Updates to This Policy</h2>
            
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, 
              legal requirements, or other factors.
            </p>

            <h3>11.1 Notification of Changes</h3>
            <ul>
              <li><strong>Minor changes:</strong> Updated "Last updated" date at the top of this page</li>
              <li><strong>Material changes:</strong> Email notification to registered users and prominent notice on the platform</li>
              <li><strong>Effective date:</strong> Changes take effect 30 days after notification (or immediately for legal compliance)</li>
            </ul>

            <h3>11.2 Your Acceptance</h3>
            <p>
              Continued use of AutoRev after policy updates constitutes acceptance of the revised policy. 
              If you do not agree to changes, you should discontinue use and delete your account.
            </p>
          </section>

          <section className={styles.section} id="contact-information">
            <h2>12. Contact Information</h2>
            
            <h3>12.1 Privacy Questions</h3>
            <p>
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, 
              please contact us:
            </p>
            <div className={styles.contactInfo}>
              <p><strong>Email:</strong> contact@autorev.app</p>
              <p><strong>Contact Form:</strong> <a href="/contact">/contact</a></p>
              <p><strong>Mailing Address:</strong> [Company Legal Address]</p>
            </div>

            <h3>12.2 Response Time</h3>
            <p>
              We strive to respond to all privacy inquiries within 48 hours for general questions and within 
              30 days for formal data requests (CCPA, GDPR).
            </p>

            <h3>12.3 Data Protection Officer</h3>
            <p>
              If required by law, we will designate a Data Protection Officer (DPO). Contact information will 
              be updated here when applicable.
            </p>
          </section>

          <div className={styles.legalFooter}>
            <p>
              <strong>Document Version:</strong> 1.1 (January 20, 2026)
            </p>
            <p>
              This Privacy Policy was last reviewed and updated on January 20, 2026. Please check this page 
              periodically for updates.
            </p>
            <p>
              <strong>Questions?</strong> Contact us at contact@autorev.app
            </p>
          </div>
        </div>
      </main>

      {/* Site Footer */}
      <footer className={styles.footer}>
        {/* Social Icons */}
        <div className={styles.footerSocial}>
          <a 
            href="https://www.instagram.com/autorev.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.socialIcon}
            aria-label="Follow us on Instagram"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
          <a 
            href="https://www.facebook.com/profile.php?id=61585868463925" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.socialIcon}
            aria-label="Follow us on Facebook"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
        </div>

        <div className={styles.footerLinks}>
          <div className={styles.footerSection}>
            <h4 className={styles.footerSectionTitle}>INFO</h4>
            <Link href="/terms">Terms & Conditions</Link>
            <Link href="/privacy">Privacy Policy</Link>
          </div>
          <div className={styles.footerSection}>
            <h4 className={styles.footerSectionTitle}>CONTACT</h4>
            <Link href="/contact">Support</Link>
          </div>
        </div>
        <p className={styles.footerCopyright}>© 2026 AUTOREV</p>
      </footer>
    </div>
  );
}
