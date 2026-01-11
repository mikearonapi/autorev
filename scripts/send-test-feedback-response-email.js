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

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load env vars (required for lib/email.js which uses Supabase and Resend)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

/**
 * Import the canonical feedback response email function
 * This function fetches car image from database automatically
 */
async function getEmailFunction() {
  const { sendFeedbackResponseEmail } = await import('../lib/email.js');
  return { sendFeedbackResponseEmail };
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

async function sendTestFeedbackEmail(to, options) {
  console.log(`\nPreparing feedback response email for ${to}...`);
  console.log(`  Type: ${options.type}`);
  
  if (options.type === 'car_request') {
    console.log(`  Car: ${options.carName}`);
    console.log(`  Slug: ${options.carSlug}`);
    console.log(`  (Hero image will be fetched from database)`);
  }

  // Use the canonical sendFeedbackResponseEmail function which:
  // - Validates the car slug exists
  // - Fetches the hero image URL from the database
  // - Logs the email to the database
  const { sendFeedbackResponseEmail } = await getEmailFunction();
  
  console.log(`  Sending email...`);

  const result = await sendFeedbackResponseEmail({
    to,
    userName: options.userName,
    feedbackType: options.type,
    carName: options.type === 'car_request' ? options.carName : null,
    carSlug: options.type === 'car_request' ? options.carSlug : null,
    originalFeedback: options.feedback,
  });

  if (!result.success) {
    console.error(`  ❌ Failed to send: ${result.error}`);
    return result;
  }

  console.log(`  ✅ Sent! ID: ${result.id}`);
  return result;
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
console.log('📧 Using sendFeedbackResponseEmail from lib/email.js');
console.log('📷 Car hero images fetched automatically from database');

await sendTestFeedbackEmail(options.email, options);

console.log('\n✨ Done!');
