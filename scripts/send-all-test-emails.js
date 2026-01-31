#!/usr/bin/env node
/**
 * Send all email templates for review
 *
 * Usage: node scripts/send-all-test-emails.js email@example.com
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
import { Resend } from 'resend';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://autorev.app';

// Import email generators
const emailService = await import('../lib/emailService.js');
const {
  generateWelcomeEmailHtml,
  generateWelcomeEmailText,
  generateConfirmationEmailHtml,
  generateConfirmationEmailText,
  generateRecoveryEmailHtml,
  generateRecoveryEmailText,
  generateMagicLinkEmailHtml,
  generateMagicLinkEmailText,
  EMAIL_TEMPLATES,
} = emailService;

const EMAIL_FROM = 'AutoRev <hello@autorev.app>';

// Helper to add delay between requests (rate limit is 2/sec)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendEmail(to, subject, html, text) {
  await delay(600); // Wait 600ms between emails to avoid rate limit
  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: [to],
    replyTo: 'support@autorev.app',
    subject: `[TEST] ${subject}`,
    html,
    text,
  });

  if (error) {
    console.error(`  ❌ Failed: ${error.message}`);
    return false;
  }
  console.log(`  ✅ Sent! ID: ${data.id}`);
  return true;
}

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.log('Usage: node scripts/send-all-test-emails.js email@example.com');
    process.exit(1);
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in .env.local');
    process.exit(1);
  }

  console.log('🚀 AutoRev Email Test Suite');
  console.log('===========================');
  console.log(`📧 Sending all templates to: ${email}\n`);

  const testVars = {
    user_name: 'Test User',
    login_url: SITE_URL,
    car_count: 325,
    confirmation_url: `${SITE_URL}/auth/confirm?token=test`,
    recovery_url: `${SITE_URL}/auth/reset?token=test`,
    magic_link_url: `${SITE_URL}/auth/magic?token=test`,
  };

  let sent = 0;
  let failed = 0;

  // 1. Welcome Email
  console.log('1. Welcome Email');
  const welcomeHtml = generateWelcomeEmailHtml(testVars, SITE_URL);
  const welcomeText = generateWelcomeEmailText(testVars, SITE_URL);
  if (await sendEmail(email, 'Welcome to AutoRev — Find What Drives You', welcomeHtml, welcomeText))
    sent++;
  else failed++;

  // 2. Confirmation Email
  console.log('2. Confirmation Email');
  const confirmHtml = generateConfirmationEmailHtml(testVars, SITE_URL);
  const confirmText = generateConfirmationEmailText(testVars, SITE_URL);
  if (await sendEmail(email, 'Confirm Your Email — AutoRev', confirmHtml, confirmText)) sent++;
  else failed++;

  // 3. Password Recovery Email
  console.log('3. Password Recovery Email');
  const recoveryHtml = generateRecoveryEmailHtml(testVars, SITE_URL);
  const recoveryText = generateRecoveryEmailText(testVars, SITE_URL);
  if (await sendEmail(email, 'Reset Your Password — AutoRev', recoveryHtml, recoveryText)) sent++;
  else failed++;

  // 4. Magic Link Email
  console.log('4. Magic Link Email');
  const magicHtml = generateMagicLinkEmailHtml(testVars, SITE_URL);
  const magicText = generateMagicLinkEmailText(testVars, SITE_URL);
  if (await sendEmail(email, 'Your Login Link — AutoRev', magicHtml, magicText)) sent++;
  else failed++;

  // 5. Inactivity 7-day Email
  console.log('5. Inactivity 7-Day Email');
  const inactivityTemplate = EMAIL_TEMPLATES['inactivity-7d'];
  const inactivityContent = inactivityTemplate.render({
    ...testVars,
    email: email,
    imageBaseUrl: SITE_URL,
  });
  if (
    await sendEmail(
      email,
      inactivityTemplate.subject,
      inactivityContent.html,
      inactivityContent.text
    )
  )
    sent++;
  else failed++;

  // 6. Inactivity 21-Day Email
  console.log('6. Inactivity 21-Day Email');
  const inactivity21Template = EMAIL_TEMPLATES['inactivity-21d'];
  if (inactivity21Template) {
    const inactivity21Content = inactivity21Template.render({
      ...testVars,
      email: email,
      imageBaseUrl: SITE_URL,
    });
    if (
      await sendEmail(
        email,
        inactivity21Template.subject,
        inactivity21Content.html,
        inactivity21Content.text
      )
    )
      sent++;
    else failed++;
  } else {
    console.log('  ⏭️ Skipped (template not found)');
  }

  // 7. Referral Reward Email
  console.log('7. Referral Reward Email');
  const rewardTemplate = EMAIL_TEMPLATES['referral-reward'];
  const rewardContent = rewardTemplate.render({
    friend_name: 'John Smith',
    credits_earned: 200,
    total_credits: 400,
    imageBaseUrl: SITE_URL,
  });
  if (
    await sendEmail(email, 'You earned 200 AL credits! 🎁', rewardContent.html, rewardContent.text)
  )
    sent++;
  else failed++;

  // 8. Feedback Response Email
  console.log('8. Feedback Response Email');
  const feedbackTemplate = EMAIL_TEMPLATES['feedback-response'];
  const feedbackContent = feedbackTemplate.render({
    user_name: 'Test User',
    original_feedback:
      'The app would be great if it had more detailed dyno charts with RPM breakdowns.',
    imageBaseUrl: SITE_URL,
  });
  if (
    await sendEmail(email, 'Thanks for your feedback', feedbackContent.html, feedbackContent.text)
  )
    sent++;
  else failed++;

  // 9. Referral Invite Email
  console.log('9. Referral Invite Email');
  const inviteTemplate = EMAIL_TEMPLATES['referral-invite'];
  const inviteContent = inviteTemplate.render({
    referrer_name: 'Mike',
    bonus_credits: 200,
    referral_link: `${SITE_URL}/join?ref=test123`,
    car_count: 325,
    imageBaseUrl: SITE_URL,
  });
  if (
    await sendEmail(
      email,
      "Mike thinks you'd love AutoRev 🏎️",
      inviteContent.html,
      inviteContent.text
    )
  )
    sent++;
  else failed++;

  // 10. Trial Ending Email
  console.log('10. Trial Ending Email');
  const trialEndingResult = await emailService.sendTrialEndingEmail({
    userId: null,
    email: email,
    userName: 'Test User',
    daysRemaining: 3,
    trialEndDate: 'February 10, 2026',
    tier: 'tuner',
  });
  if (trialEndingResult.success) {
    console.log('  ✅ Sent!');
    sent++;
  } else {
    console.log(`  ❌ Failed: ${trialEndingResult.error}`);
    failed++;
  }

  // 11. Trial Ended Email
  console.log('11. Trial Ended Email');
  const trialEndedResult = await emailService.sendTrialEndedEmail({
    userId: null,
    email: email,
    userName: 'Test User',
    trialTier: 'tuner',
  });
  if (trialEndedResult.success) {
    console.log('  ✅ Sent!');
    sent++;
  } else {
    console.log(`  ❌ Failed: ${trialEndedResult.error}`);
    failed++;
  }

  // 12. Payment Failed Email
  console.log('12. Payment Failed Email');
  const paymentFailedResult = await emailService.sendPaymentFailedEmail({
    userId: null,
    email: email,
    userName: 'Test User',
    amountCents: 999,
    tier: 'tuner',
    nextRetryDate: 'February 5, 2026',
  });
  if (paymentFailedResult.success) {
    console.log('  ✅ Sent!');
    sent++;
  } else {
    console.log(`  ❌ Failed: ${paymentFailedResult.error}`);
    failed++;
  }

  // 13. Product Update Email (Jan 2026)
  console.log('13. Product Update Email (Jan 2026)');
  const productUpdateTemplate = EMAIL_TEMPLATES['product-update-jan2026'];
  const productUpdateContent = productUpdateTemplate.render({
    user_name: 'Test User',
    email: email,
    imageBaseUrl: SITE_URL,
  });
  if (
    await sendEmail(
      email,
      productUpdateTemplate.subject,
      productUpdateContent.html,
      productUpdateContent.text
    )
  )
    sent++;
  else failed++;

  console.log('\n===========================');
  console.log(`✨ Complete! ${sent} sent, ${failed} failed`);
  console.log(`📬 Check your inbox: ${email}`);
}

main().catch(console.error);
