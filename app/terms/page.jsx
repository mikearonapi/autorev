// LEGAL DISCLAIMER: This document should be reviewed by a qualified attorney
// before deployment. Placeholders marked with [BRACKETS] must be filled in.

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
        <p className={styles.lastUpdated}>Last updated: December 16, 2024</p>

        {/* Table of Contents */}
        <nav className={styles.toc}>
          <h3 className={styles.tocTitle}>Table of Contents</h3>
          <ol className={styles.tocList}>
            <li><a href="#acceptance">Acceptance of Terms</a></li>
            <li><a href="#account-terms">Account Terms</a></li>
            <li><a href="#acceptable-use">Acceptable Use</a></li>
            <li><a href="#automotive-disclaimer">Automotive Information Disclaimer</a></li>
            <li><a href="#intellectual-property">Intellectual Property</a></li>
            <li><a href="#user-content">User-Submitted Content</a></li>
            <li><a href="#third-party">Third-Party Links & Services</a></li>
            <li><a href="#subscriptions">Subscriptions and Billing</a></li>
            <li><a href="#warranty-disclaimer">Warranty Disclaimer</a></li>
            <li><a href="#limitation-liability">Limitation of Liability</a></li>
            <li><a href="#indemnification">Indemnification</a></li>
            <li><a href="#termination">Termination</a></li>
            <li><a href="#governing-law">Governing Law</a></li>
            <li><a href="#dispute-resolution">Dispute Resolution</a></li>
            <li><a href="#changes-terms">Changes to Terms</a></li>
            <li><a href="#contact-information">Contact Information</a></li>
          </ol>
        </nav>

        <section className={styles.section} id="acceptance">
          <h2>1. Acceptance of Terms</h2>
          
          <p>
            Welcome to AutoRev. By accessing or using our website, mobile application, or any services 
            (collectively, the "Platform"), you agree to be bound by these Terms of Service ("Terms"). 
            If you do not agree to these Terms, you must not access or use the Platform.
          </p>

          <p>
            These Terms constitute a legally binding agreement between you and AutoRev ("we," "us," "our"). 
            By creating an account, browsing our content, or using any features, you acknowledge that you 
            have read, understood, and agree to be bound by these Terms and our Privacy Policy.
          </p>

          <h3>1.1 Eligibility</h3>
          <p>You must be at least 13 years old (or 16 in the EU) to use AutoRev. By using the Platform, you represent and warrant that:</p>
          <ul>
            <li>You meet the minimum age requirement</li>
            <li>You have the legal capacity to enter into binding contracts</li>
            <li>You are not barred from using the Platform under applicable law</li>
            <li>All information you provide is accurate and current</li>
          </ul>

          <h3>1.2 Changes to Terms</h3>
          <p>
            We reserve the right to modify these Terms at any time. Material changes will be notified via 
            email or prominent notice on the Platform. Continued use after changes constitutes acceptance 
            of the revised Terms.
          </p>
        </section>

        <section className={styles.section} id="account-terms">
          <h2>2. Account Terms</h2>
          
          <h3>2.1 Account Creation</h3>
          <p>To access certain features, you must create an account. When creating an account:</p>
          <ul>
            <li>You must provide accurate, complete, and current information</li>
            <li>You must maintain and update your information as needed</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials</li>
            <li>You are responsible for all activities that occur under your account</li>
            <li>You must notify us immediately of any unauthorized access or security breach</li>
          </ul>

          <h3>2.2 Account Security</h3>
          <p>
            You are solely responsible for safeguarding your password and account credentials. We recommend 
            using a strong, unique password and enabling two-factor authentication if available. AutoRev 
            will not be liable for any loss or damage arising from your failure to maintain account security.
          </p>

          <h3>2.3 Subscription Tiers</h3>
          <p>AutoRev offers multiple subscription tiers with different feature access:</p>
          <ul>
            <li><strong>Free Tier:</strong> Access to car browsing, Car Selector, basic car details, and limited AL assistant usage</li>
            <li><strong>Collector Tier:</strong> Adds VIN decode, owned vehicle tracking, service logs, market value data, 
            expert reviews, known issues, and increased AL usage</li>
            <li><strong>Tuner Tier:</strong> Adds dyno data, lap times, full parts catalog, build projects, 
            performance metrics, and highest AL usage limits</li>
          </ul>
          <p>
            Feature access is subject to change. We will notify users of significant changes to tier benefits 
            at least 30 days in advance.
          </p>

          <h3>2.4 Beta Access</h3>
          <p>
            During beta periods, certain tier restrictions may be lifted for testing purposes. Beta access 
            is temporary and does not guarantee permanent access to premium features. We reserve the right 
            to end beta access at any time with reasonable notice.
          </p>

          <h3>2.5 Account Termination by You</h3>
          <p>
            You may terminate your account at any time by emailing contact@autorev.app. Upon termination, 
            your data will be deleted as described in our Privacy Policy (Section 4).
          </p>
        </section>

        <section className={styles.section} id="acceptable-use">
          <h2>3. Acceptable Use</h2>
          
          <h3>3.1 Permitted Use</h3>
          <p>You may use the Platform for lawful personal or commercial purposes, including:</p>
          <ul>
            <li>Researching and comparing sports cars</li>
            <li>Planning vehicle modifications and upgrades</li>
            <li>Tracking your owned vehicles and maintenance history</li>
            <li>Learning about automotive systems and technology</li>
            <li>Using the AL assistant for automotive questions</li>
          </ul>

          <h3>3.2 Prohibited Conduct</h3>
          <p>You agree NOT to:</p>
          <ul>
            <li><strong>Violate laws:</strong> Use the Platform for any illegal purpose or in violation of any local, 
            state, national, or international law</li>
            <li><strong>Infringe rights:</strong> Violate intellectual property, privacy, or other rights of AutoRev or third parties</li>
            <li><strong>Scrape data:</strong> Use automated tools (bots, scrapers, crawlers) to extract data without written permission</li>
            <li><strong>Reverse engineer:</strong> Attempt to decompile, disassemble, or reverse engineer any part of the Platform</li>
            <li><strong>Interfere with systems:</strong> Attempt to gain unauthorized access to our servers, databases, or user accounts</li>
            <li><strong>Disrupt service:</strong> Introduce viruses, malware, or any code that could damage or interfere with the Platform</li>
            <li><strong>Abuse features:</strong> Use the AL assistant to generate spam, harmful content, or violate Anthropic's usage policies</li>
            <li><strong>Impersonate:</strong> Pretend to be another person or entity, or falsely claim affiliation</li>
            <li><strong>Harass others:</strong> Abuse, harass, threaten, or intimidate other users</li>
            <li><strong>Resell services:</strong> Resell, redistribute, or commercialize access to the Platform without permission</li>
          </ul>

          <h3>3.3 Enforcement</h3>
          <p>
            Violation of these terms may result in account suspension, termination, and/or legal action. 
            We reserve the right to investigate suspected violations and cooperate with law enforcement.
          </p>
        </section>

        <section className={styles.section} id="automotive-disclaimer">
          <h2>4. Automotive Information Disclaimer</h2>
          
          <div className={styles.criticalWarning}>
            <h3>⚠️ CRITICAL: Read This Section Carefully</h3>
            <p>
              Automotive modifications can affect safety, emissions compliance, warranty coverage, and 
              insurance. This section outlines important limitations and responsibilities.
            </p>
          </div>

          <h3>4.1 Information Is for Educational Purposes Only</h3>
          <p>
            All content on AutoRev—including specifications, maintenance schedules, known issues, upgrade 
            recommendations, pricing estimates, performance data, and AL assistant responses—is provided 
            for <strong>informational and educational purposes only</strong>. It is NOT:
          </p>
          <ul>
            <li>Professional mechanical advice or diagnosis</li>
            <li>A substitute for consulting qualified automotive technicians</li>
            <li>A guarantee of compatibility, performance, or safety</li>
            <li>A recommendation to perform any specific modification or repair</li>
          </ul>

          <h3>4.2 Verify All Critical Information</h3>
          <p>You are responsible for verifying all information before making decisions. Always:</p>
          <ul>
            <li><strong>Consult your vehicle's owner's manual</strong> for official specifications</li>
            <li><strong>Verify part compatibility</strong> with the manufacturer or installer before purchasing</li>
            <li><strong>Confirm maintenance intervals</strong> with your dealer or service center</li>
            <li><strong>Research emissions laws</strong> in your jurisdiction before modifying exhaust or engine management</li>
            <li><strong>Check warranty implications</strong> with your dealer before making modifications</li>
            <li><strong>Consult a qualified mechanic</strong> for any safety-critical work (brakes, suspension, steering)</li>
          </ul>

          <h3>4.3 No Warranty of Accuracy</h3>
          <p>
            We strive for accuracy, but AutoRev does NOT warrant that:
          </p>
          <ul>
            <li>Specifications, pricing, or performance data are current or accurate</li>
            <li>Part fitments listed in our catalog will work with your specific vehicle configuration</li>
            <li>Known issues apply to your specific vehicle or will occur</li>
            <li>Maintenance schedules match your vehicle's official service intervals</li>
            <li>Market pricing reflects current values in your local market</li>
          </ul>
          <p>
            Data is aggregated from public sources, user submissions, and third-party APIs. We cannot 
            guarantee completeness, timeliness, or freedom from errors.
          </p>

          <h3>4.4 AL Assistant Limitations</h3>
          <p>
            Our AL AI assistant is a large language model tool that provides conversational responses based 
            on our database and training data. AL:
          </p>
          <ul>
            <li><strong>May provide incorrect or outdated information</strong> despite our best efforts</li>
            <li><strong>Cannot diagnose mechanical problems</strong> remotely or replace professional inspection</li>
            <li><strong>Does not know your vehicle's specific condition</strong> or maintenance history unless you provide it</li>
            <li><strong>Cannot verify part compatibility</strong> with 100% certainty for your exact vehicle configuration</li>
            <li><strong>Should not be used for safety-critical decisions</strong> without professional verification</li>
          </ul>
          <p>
            Always verify AL's recommendations with official sources and qualified professionals before 
            taking action, especially for safety-related work.
          </p>

          <h3>4.5 Modification Risks and Responsibilities</h3>
          <p>
            Vehicle modifications carry inherent risks. You acknowledge and accept that:
          </p>
          <ul>
            <li><strong>Warranty:</strong> Modifications may void manufacturer warranties (Magnuson-Moss Act provides some protection, 
            but burden of proof is on you)</li>
            <li><strong>Insurance:</strong> Some modifications must be disclosed to insurance companies; failure to disclose 
            may void coverage</li>
            <li><strong>Emissions:</strong> Many modifications are illegal for street use in emissions-regulated states 
            (California, New York, etc.)</li>
            <li><strong>Safety:</strong> Improper installation can cause accidents, injuries, or death</li>
            <li><strong>Reliability:</strong> Modifications can reduce reliability and increase maintenance costs</li>
            <li><strong>Resale value:</strong> Modifications may decrease resale value or limit buyer pool</li>
          </ul>

          <h3>4.6 Performance Claims</h3>
          <p>
            Performance gains (horsepower, torque, lap times) shown on AutoRev are estimates based on typical 
            results. Actual results vary based on:
          </p>
          <ul>
            <li>Vehicle condition and mileage</li>
            <li>Quality of installation and tuning</li>
            <li>Complementary modifications</li>
            <li>Altitude, temperature, fuel quality</li>
            <li>Dyno type and calibration (dyno numbers are NOT comparable across different dynos)</li>
          </ul>
          <p>
            We do not guarantee any specific performance results from modifications.
          </p>

          <h3>4.7 Your Responsibility</h3>
          <p>
            By using AutoRev, you acknowledge that <strong>YOU are solely responsible for</strong>:
          </p>
          <ul>
            <li>All decisions to modify or repair your vehicle</li>
            <li>Selecting qualified professionals for installation</li>
            <li>Ensuring compliance with local laws and regulations</li>
            <li>Verifying compatibility and safety of all parts</li>
            <li>Any consequences, costs, or liabilities resulting from modifications</li>
          </ul>
        </section>

        <section className={styles.section} id="intellectual-property">
          <h2>5. Intellectual Property</h2>
          
          <h3>5.1 Our Content</h3>
          <p>
            All content on AutoRev—including but not limited to text, graphics, logos, images, car data, 
            upgrade recommendations, software code, and database structure—is owned by AutoRev or its 
            licensors and is protected by U.S. and international copyright, trademark, and other intellectual 
            property laws.
          </p>

          <h3>5.2 Limited License</h3>
          <p>We grant you a limited, non-exclusive, non-transferable license to:</p>
          <ul>
            <li>Access and use the Platform for personal, non-commercial purposes</li>
            <li>View and print car pages for your own reference</li>
            <li>Share links to AutoRev content on social media</li>
          </ul>

          <h3>5.3 Restrictions</h3>
          <p>You may NOT:</p>
          <ul>
            <li>Copy, reproduce, or redistribute our content without written permission</li>
            <li>Create derivative works based on our content or database</li>
            <li>Use our data to create competing products or services</li>
            <li>Remove copyright, trademark, or attribution notices</li>
            <li>Frame or embed our content on other websites without permission</li>
          </ul>

          <h3>5.4 Trademarks</h3>
          <p>
            AutoRev, the AutoRev logo, and "AL" are trademarks of AutoRev. Car manufacturer names, model 
            names, and logos are trademarks of their respective owners. We claim no ownership of third-party 
            trademarks, which are used for informational purposes only.
          </p>

          <h3>5.5 Third-Party Content</h3>
          <p>
            Some content on AutoRev is sourced from third parties (YouTube videos, NHTSA data, EPA data, 
            forum posts). We respect intellectual property rights and will remove content upon receiving 
            valid DMCA takedown notices. See Section 16 for DMCA contact information.
          </p>
        </section>

        <section className={styles.section} id="user-content">
          <h2>6. User-Submitted Content</h2>
          
          <h3>6.1 Types of User Content</h3>
          <p>Users may submit content including:</p>
          <ul>
            <li>Feedback submissions (bug reports, feature requests)</li>
            <li>Event submissions (Cars & Coffee, track days, meetups)</li>
            <li>Contact form messages</li>
            <li>AL assistant conversations (considered user content)</li>
            <li>Future: User reviews, forum posts, build photos (if implemented)</li>
          </ul>

          <h3>6.2 License Grant</h3>
          <p>
            By submitting content to AutoRev, you grant us a worldwide, non-exclusive, royalty-free, 
            perpetual, irrevocable license to use, reproduce, modify, adapt, publish, and display your 
            content for the purposes of operating and improving the Platform.
          </p>
          <p>
            <strong>Example:</strong> If you submit a bug report, we may share anonymized details with 
            developers. If you submit an event, we may display it publicly on our events pages.
          </p>

          <h3>6.3 Content Standards</h3>
          <p>User-submitted content must NOT:</p>
          <ul>
            <li>Violate any laws or regulations</li>
            <li>Infringe on intellectual property or privacy rights</li>
            <li>Contain false, misleading, or deceptive information</li>
            <li>Contain hate speech, harassment, or threats</li>
            <li>Contain spam, advertisements, or promotional material</li>
            <li>Contain malware, viruses, or malicious code</li>
          </ul>

          <h3>6.4 Moderation</h3>
          <p>
            We reserve the right to review, edit, or remove any user-submitted content at our discretion, 
            with or without notice. We are not obligated to publish, display, or retain user content.
          </p>

          <h3>6.5 No Confidentiality</h3>
          <p>
            Do not submit confidential or proprietary information through our Platform. We do not accept 
            unsolicited ideas or business proposals.
          </p>
        </section>

        <section className={styles.section} id="third-party">
          <h2>7. Third-Party Links & Services</h2>
          
          <h3>7.1 External Links</h3>
          <p>
            AutoRev contains links to third-party websites and services, including:
          </p>
          <ul>
            <li>YouTube videos (expert reviews)</li>
            <li>Parts vendor websites</li>
            <li>Auction sites (Bring a Trailer)</li>
            <li>Event websites and registration pages</li>
            <li>Forum threads and discussions</li>
          </ul>
          <p>
            We do not control or endorse third-party content. These links are provided for convenience only. 
            We are not responsible for the content, accuracy, or practices of third-party sites.
          </p>

          <h3>7.2 Third-Party Services</h3>
          <p>
            Our Platform integrates with third-party services (Supabase, Anthropic, Google APIs, etc.). 
            See our Privacy Policy for details. These services have their own terms and privacy policies, 
            which you should review.
          </p>

          <h3>7.3 Parts and Services</h3>
          <p>
            We may display parts catalogs, pricing, and vendor links. AutoRev:
          </p>
          <ul>
            <li>Does NOT sell parts or services directly</li>
            <li>Does NOT earn affiliate commissions from part sales (currently)</li>
            <li>Does NOT endorse any specific vendor, brand, or product</li>
            <li>Is NOT responsible for part quality, delivery, returns, or customer service</li>
          </ul>
          <p>
            Any purchases are between you and the vendor. Read vendor terms and policies before purchasing.
          </p>
        </section>

        <section className={styles.section} id="subscriptions">
          <h2>8. Subscriptions and Billing</h2>
          
          <h3>8.1 Current Pricing</h3>
          <p>
            During beta, all tiers are currently free. When paid subscriptions launch, pricing will be 
            clearly displayed on the /join page.
          </p>

          <h3>8.2 AL Assistant Credits</h3>
          <p>
            AL assistant usage is billed based on credits (token usage). Each tier has monthly credit limits:
          </p>
          <ul>
            <li><strong>Free:</strong> $0.25/month (~15-20 conversations)</li>
            <li><strong>Collector:</strong> $1.00/month (~70-80 conversations)</li>
            <li><strong>Tuner:</strong> $2.50/month (~175-200 conversations)</li>
          </ul>
          <p>
            When monthly limits are exceeded, AL access is suspended until the next billing period or 
            additional credits are purchased.
          </p>

          <h3>8.3 Future: Paid Subscriptions</h3>
          <p>When paid subscriptions are implemented:</p>
          <ul>
            <li><strong>Billing cycle:</strong> Monthly or annual (annual subscribers receive discount)</li>
            <li><strong>Auto-renewal:</strong> Subscriptions auto-renew unless canceled</li>
            <li><strong>Cancellation:</strong> Cancel anytime; access continues through end of billing period</li>
            <li><strong>Refunds:</strong> Pro-rated refunds within 14 days of charge; no refunds for partial months</li>
            <li><strong>Price changes:</strong> 30 days' notice for existing subscribers; new prices apply at next renewal</li>
            <li><strong>Payment processor:</strong> Stripe (or similar) will handle all payment card data</li>
          </ul>

          <h3>8.4 Taxes</h3>
          <p>
            Prices do not include sales tax, VAT, or other applicable taxes. You are responsible for any 
            taxes required by your jurisdiction.
          </p>
        </section>

        <section className={styles.section} id="warranty-disclaimer">
          <h2>9. Warranty Disclaimer</h2>
          
          <div className={styles.legalNotice}>
            <p>
              <strong>READ CAREFULLY:</strong> This section limits our liability. By using AutoRev, you 
              accept these limitations.
            </p>
          </div>

          <h3>9.1 "AS IS" Basis</h3>
          <p>
            THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER 
            EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
          </p>
          <ul>
            <li>Warranties of merchantability</li>
            <li>Fitness for a particular purpose</li>
            <li>Non-infringement</li>
            <li>Accuracy, completeness, or reliability of content</li>
            <li>Uninterrupted or error-free operation</li>
            <li>Freedom from viruses or harmful components</li>
          </ul>

          <h3>9.2 No Professional Advice</h3>
          <p>
            AutoRev is not a licensed mechanic, automotive engineer, or professional repair service. We do 
            not provide professional advice. Do not rely on our content as a substitute for professional 
            consultation.
          </p>

          <h3>9.3 Third-Party Data</h3>
          <p>
            We aggregate data from government APIs (NHTSA, EPA), YouTube, forums, and other sources. We 
            cannot guarantee the accuracy of third-party data and are not responsible for errors or omissions 
            in source data.
          </p>

          <h3>9.4 Availability</h3>
          <p>
            We do not guarantee the Platform will be available at all times. We may suspend or discontinue 
            features without notice for maintenance, updates, or other reasons.
          </p>
        </section>

        <section className={styles.section} id="limitation-liability">
          <h2>10. Limitation of Liability</h2>
          
          <div className={styles.legalNotice}>
            <p>
              <strong>IMPORTANT:</strong> This section limits the damages you can recover from us.
            </p>
          </div>

          <h3>10.1 Exclusion of Damages</h3>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, AUTOREV SHALL NOT BE LIABLE FOR ANY:
          </p>
          <ul>
            <li><strong>Indirect, incidental, consequential, or punitive damages</strong></li>
            <li><strong>Loss of profits, revenue, or business opportunities</strong></li>
            <li><strong>Loss of data or vehicle damage</strong> resulting from modifications based on our content</li>
            <li><strong>Personal injury or property damage</strong> arising from use of our Platform or reliance on our content</li>
            <li><strong>Claims related to part compatibility, performance, or safety</strong></li>
            <li><strong>Third-party actions</strong> including vendor disputes, part defects, or installation errors</li>
          </ul>

          <h3>10.2 Cap on Liability</h3>
          <p>
            IN NO EVENT SHALL AUTOREV'S TOTAL LIABILITY EXCEED THE GREATER OF:
          </p>
          <ul>
            <li>$100 USD, OR</li>
            <li>The amount you paid us in the 12 months preceding the claim</li>
          </ul>

          <h3>10.3 Acknowledgment</h3>
          <p>
            You acknowledge that these limitations are reasonable and essential elements of the agreement 
            between you and AutoRev. Without these limitations, we could not provide the Platform at current 
            pricing.
          </p>

          <h3>10.4 State-Specific Limitations</h3>
          <p>
            Some jurisdictions do not allow exclusion of implied warranties or limitation of liability for 
            incidental or consequential damages. In such jurisdictions, our liability is limited to the 
            maximum extent permitted by law.
          </p>
        </section>

        <section className={styles.section} id="indemnification">
          <h2>11. Indemnification</h2>
          
          <p>
            You agree to indemnify, defend, and hold harmless AutoRev, its officers, directors, employees, 
            agents, and affiliates from any claims, liabilities, damages, losses, costs, or expenses 
            (including reasonable attorneys' fees) arising from:
          </p>
          <ul>
            <li>Your use or misuse of the Platform</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any third-party rights (intellectual property, privacy, etc.)</li>
            <li>Vehicle modifications or repairs you perform based on information from AutoRev</li>
            <li>Any content you submit to the Platform</li>
            <li>Any fraudulent, negligent, or illegal actions you take</li>
          </ul>
          <p>
            We reserve the right to assume exclusive defense and control of any matter subject to 
            indemnification, at your expense.
          </p>
        </section>

        <section className={styles.section} id="termination">
          <h2>12. Termination</h2>
          
          <h3>12.1 Termination by You</h3>
          <p>
            You may terminate your account at any time by contacting us at contact@autorev.app. Upon 
            termination, your subscription is canceled and data is deleted per our Privacy Policy.
          </p>

          <h3>12.2 Termination by Us</h3>
          <p>
            We may suspend or terminate your account immediately, without notice or liability, if:
          </p>
          <ul>
            <li>You violate these Terms</li>
            <li>You engage in fraudulent or illegal activity</li>
            <li>You abuse the AL assistant or other features</li>
            <li>Your account poses a security risk</li>
            <li>Required by law or court order</li>
          </ul>

          <h3>12.3 Effect of Termination</h3>
          <p>
            Upon termination:
          </p>
          <ul>
            <li>Your license to use the Platform immediately ends</li>
            <li>You must stop accessing the Platform</li>
            <li>Sections 4-11, 13-16 survive termination</li>
            <li>No refunds for partial months (except as required by law)</li>
          </ul>

          <h3>12.4 Discontinuation of Service</h3>
          <p>
            We reserve the right to discontinue the Platform or any features at any time. We will provide 
            reasonable notice (30 days) before permanent discontinuation and offer refunds for prepaid 
            subscription periods.
          </p>
        </section>

        <section className={styles.section} id="governing-law">
          <h2>13. Governing Law</h2>
          
          <p>
            These Terms are governed by the laws of the State of [STATE], United States, without regard 
            to its conflict of law principles. The United Nations Convention on Contracts for the International 
            Sale of Goods does not apply.
          </p>

          <h3>13.1 Jurisdiction</h3>
          <p>
            You agree that any legal action or proceeding related to these Terms or the Platform shall be 
            brought exclusively in the state or federal courts located in [COUNTY, STATE]. You consent to 
            the jurisdiction of such courts and waive any objections based on inconvenient forum.
          </p>
        </section>

        <section className={styles.section} id="dispute-resolution">
          <h2>14. Dispute Resolution</h2>
          
          <h3>14.1 Informal Resolution</h3>
          <p>
            Before filing a formal claim, you agree to contact us at contact@autorev.app to attempt to 
            resolve the dispute informally. We commit to working in good faith to resolve issues.
          </p>

          <h3>14.2 Arbitration Agreement (Optional - Review with Attorney)</h3>
          <p>
            [PLACEHOLDER: Include arbitration clause if desired. Consult attorney regarding pros/cons for 
            your specific business. Arbitration clauses are common for consumer services but have legal 
            nuances.]
          </p>

          <h3>14.3 Class Action Waiver</h3>
          <p>
            You agree to bring claims against AutoRev only in your individual capacity, not as a plaintiff 
            or class member in any class, collective, or representative action. Class arbitrations and 
            class actions are not permitted.
          </p>
          <p>
            <strong>Note:</strong> Some jurisdictions do not allow class action waivers. If this provision 
            is found unenforceable, the arbitration agreement (if applicable) shall not apply to that claim.
          </p>
        </section>

        <section className={styles.section} id="changes-terms">
          <h2>15. Changes to Terms</h2>
          
          <h3>15.1 Modifications</h3>
          <p>
            We reserve the right to modify these Terms at any time. Changes will be effective:
          </p>
          <ul>
            <li><strong>Immediately</strong> for legal compliance or security fixes</li>
            <li><strong>30 days after notice</strong> for material changes affecting user rights</li>
            <li><strong>Upon posting</strong> for minor clarifications or non-material changes</li>
          </ul>

          <h3>15.2 Notification</h3>
          <p>
            Material changes will be communicated via:
          </p>
          <ul>
            <li>Email to registered users</li>
            <li>Prominent notice on the Platform</li>
            <li>Updated "Last updated" date at the top of this page</li>
          </ul>

          <h3>15.3 Acceptance</h3>
          <p>
            Continued use of the Platform after changes constitutes acceptance of revised Terms. If you do 
            not agree to changes, you must discontinue use and may request account deletion.
          </p>
        </section>

        <section className={styles.section} id="contact-information">
          <h2>16. Contact Information</h2>
          
          <h3>16.1 General Inquiries</h3>
          <div className={styles.contactInfo}>
            <p><strong>Email:</strong> contact@autorev.app</p>
            <p><strong>Contact Form:</strong> <a href="/contact">/contact</a></p>
            <p><strong>Mailing Address:</strong> [Company Legal Address]</p>
          </div>

          <h3>16.2 Legal Notices</h3>
          <p>
            All legal notices, including DMCA takedown notices and subpoenas, should be sent to:
          </p>
          <div className={styles.contactInfo}>
            <p><strong>Legal Department</strong></p>
            <p>[Company Legal Address]</p>
            <p>Email: legal@autorev.app (if separate legal email)</p>
          </div>

          <h3>16.3 DMCA Copyright Agent</h3>
          <p>
            If you believe content on AutoRev infringes your copyright, submit a DMCA takedown notice to 
            the address above with:
          </p>
          <ul>
            <li>Your physical or electronic signature</li>
            <li>Description of copyrighted work claimed to be infringed</li>
            <li>URL or location of infringing content on our Platform</li>
            <li>Your contact information (email, phone, address)</li>
            <li>Statement that you have good faith belief use is not authorized</li>
            <li>Statement that information is accurate and you are authorized to act on behalf of copyright owner</li>
          </ul>

          <h3>16.4 Miscellaneous</h3>
          <ul>
            <li><strong>Entire Agreement:</strong> These Terms and our Privacy Policy constitute the entire agreement 
            between you and AutoRev</li>
            <li><strong>Severability:</strong> If any provision is found unenforceable, remaining provisions remain in effect</li>
            <li><strong>Waiver:</strong> Failure to enforce any provision does not constitute a waiver</li>
            <li><strong>Assignment:</strong> You may not assign these Terms; we may assign to affiliates or successors</li>
            <li><strong>Force Majeure:</strong> We are not liable for delays or failures due to events beyond our control 
            (natural disasters, war, government action, etc.)</li>
          </ul>
        </section>

        <div className={styles.legalFooter}>
          <p>
            <strong>Document Version:</strong> 1.0 (December 16, 2024)
          </p>
          <p>
            These Terms of Service were last reviewed and updated on December 16, 2024. Please check this 
            page periodically for updates.
          </p>
          <p>
            <strong>Questions?</strong> Contact us at contact@autorev.app
          </p>
        </div>
      </div>
    </main>
  );
}












