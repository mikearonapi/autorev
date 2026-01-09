#!/usr/bin/env node
/**
 * Send test feedback response emails
 * 
 * Uses the canonical feedback-response email template from lib/email.js
 * This ensures test emails match what users actually receive.
 * 
 * Usage: 
 *   node scripts/send-test-feedback-response-email.js email@example.com
 *   node scripts/send-test-feedback-response-email.js email@example.com --type=car_request --car="2024 BMW M3 CS" --slug=bmw-m3-cs-2024
 *   node scripts/send-test-feedback-response-email.js email@example.com --type=general
 *   node scripts/send-test-feedback-response-email.js email@example.com --type=feature_request
 */

import { Resend } from 'resend';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://autorev.app';

/**
 * Import the canonical feedback response email template generator
 */
async function getEmailTemplate() {
  const { EMAIL_TEMPLATES, EMAIL_CONFIG } = await import('../lib/email.js');
  return { EMAIL_TEMPLATES, EMAIL_CONFIG };
}

/**
 * Parse command line arguments
 */
function parseArgs(args) {
  const result = {
    email: null,
    type: 'car_request', // Default to car_request to show full functionality
    carName: '2024 BMW M3 CS',
    carSlug: 'bmw-m3-cs-2024',
    userName: 'Test User',
    feedback: 'I would love to see the BMW M3 CS added to the database!',
  };

  for (const arg of args) {
    if (arg.startsWith('--type=')) {
      result.type = arg.replace('--type=', '');
    } else if (arg.startsWith('--car=')) {
      result.carName = arg.replace('--car=', '');
    } else if (arg.startsWith('--slug=')) {
      result.carSlug = arg.replace('--slug=', '');
    } else if (arg.startsWith('--name=')) {
      result.userName = arg.replace('--name=', '');
    } else if (arg.startsWith('--feedback=')) {
      result.feedback = arg.replace('--feedback=', '');
    } else if (!arg.startsWith('--')) {
      result.email = arg;
    }
  }

  return result;
}

async function sendFeedbackResponseEmail(to, options) {
  console.log(`\nPreparing feedback response email for ${to}...`);
  console.log(`  Type: ${options.type}`);
  
  // Get template
  const { EMAIL_TEMPLATES, EMAIL_CONFIG } = await getEmailTemplate();
  const template = EMAIL_TEMPLATES['feedback-response'];
  
  if (!template) {
    console.error('❌ Template not found: feedback-response');
    process.exit(1);
  }

  const templateVars = {
    user_name: options.userName,
    feedback_type: options.type,
    car_name: options.type === 'car_request' ? options.carName : null,
    car_slug: options.type === 'car_request' ? options.carSlug : null,
    original_feedback: options.feedback,
  };

  if (options.type === 'car_request') {
    console.log(`  Car: ${options.carName}`);
    console.log(`  Slug: ${options.carSlug}`);
  }
  
  const { html, text } = template.render(templateVars);
  const subject = template.subject;

  console.log(`  Sending email...`);

  const { data, error } = await resend.emails.send({
    from: 'AutoRev <hello@autorev.app>',
    to: [to],
    replyTo: 'support@autorev.app',
    subject,
    html,
    text,
  });

  if (error) {
    console.error(`  ❌ Failed to send: ${error.message}`);
    return { success: false, error };
  }

  console.log(`  ✅ Sent! ID: ${data.id}`);
  return { success: true, id: data.id };
}

// Main
const args = process.argv.slice(2);
const options = parseArgs(args);

if (!options.email) {
  console.log(`
Usage: node scripts/send-test-feedback-response-email.js <email> [options]

Options:
  --type=<type>       Feedback type: car_request, general, feature_request (default: car_request)
  --car=<name>        Car name for car_request type (default: "2024 BMW M3 CS")
  --slug=<slug>       Car slug for car detail URL (default: "bmw-m3-cs-2024")
  --name=<name>       User's name (default: "Test User")
  --feedback=<text>   Original feedback text

Examples:
  # Car request (default - shows car link)
  node scripts/send-test-feedback-response-email.js me@example.com

  # Car request with custom car
  node scripts/send-test-feedback-response-email.js me@example.com --car="2024 Porsche 911 GT3 RS" --slug=porsche-911-gt3-rs-2024

  # General feedback
  node scripts/send-test-feedback-response-email.js me@example.com --type=general

  # Feature request
  node scripts/send-test-feedback-response-email.js me@example.com --type=feature_request
`);
  process.exit(1);
}

if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not found in .env.local');
  process.exit(1);
}

console.log('🚀 AutoRev Feedback Response Email Sender');
console.log('==========================================');
console.log('📧 Using canonical template from lib/email.js');

await sendFeedbackResponseEmail(options.email, options);

console.log('\n✨ Done!');
