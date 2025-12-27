#!/usr/bin/env node
/**
 * Stripe Setup Verification Script
 * 
 * Run this script to verify your Stripe integration is properly configured.
 * 
 * Usage: node scripts/verify-stripe-setup.mjs
 */

import {
  SUBSCRIPTION_TIERS,
  AL_CREDIT_PACKS,
  DONATION_PRESETS,
  DONATION_PRODUCT_ID,
  PAYMENT_LINKS,
} from '../lib/stripe.js';

console.log(`
================================================================================
🔧 STRIPE INTEGRATION VERIFICATION
================================================================================
`);

// =============================================================================
// 1. VERIFY LIB/STRIPE.JS CONFIGURATION
// =============================================================================
console.log('📦 Checking lib/stripe.js configuration...\n');

let issues = [];
let passes = 0;

// Verify subscription tiers
console.log('  Subscription Tiers:');
const expectedTiers = {
  free: { price: 0, priceId: null },
  collector: { price: 499, priceId: 'price_1Sj5QuPAhBIL8qL1G5vd4Etd' },
  tuner: { price: 999, priceId: 'price_1Sj5QvPAhBIL8qL1EWLZKRFL' },
};

Object.entries(expectedTiers).forEach(([tier, expected]) => {
  const actual = SUBSCRIPTION_TIERS[tier];
  if (!actual) {
    issues.push(`Missing tier: ${tier}`);
    console.log(`    ❌ ${tier}: NOT FOUND`);
  } else if (actual.price !== expected.price || actual.priceId !== expected.priceId) {
    issues.push(`Tier ${tier} mismatch: expected price=${expected.price}, priceId=${expected.priceId}`);
    console.log(`    ❌ ${tier}: MISMATCH`);
  } else {
    passes++;
    console.log(`    ✅ ${tier}: $${(actual.price/100).toFixed(2)}/mo (price_id: ${actual.priceId || 'none'})`);
  }
});

// Verify credit packs
console.log('\n  AL Credit Packs:');
const expectedPacks = {
  small: { credits: 25, price: 299, priceId: 'price_1Sj5QwPAhBIL8qL1Yy2WePeo' },
  medium: { credits: 75, price: 499, priceId: 'price_1Sj5QwPAhBIL8qL1HrLcIGno' },
  large: { credits: 200, price: 999, priceId: 'price_1Sj5QxPAhBIL8qL1XUyXgK7N' },
};

Object.entries(expectedPacks).forEach(([pack, expected]) => {
  const actual = AL_CREDIT_PACKS[pack];
  if (!actual) {
    issues.push(`Missing credit pack: ${pack}`);
    console.log(`    ❌ ${pack}: NOT FOUND`);
  } else if (actual.credits !== expected.credits || actual.price !== expected.price) {
    issues.push(`Credit pack ${pack} mismatch`);
    console.log(`    ❌ ${pack}: MISMATCH`);
  } else {
    passes++;
    console.log(`    ✅ ${pack}: ${actual.credits} credits for $${(actual.price/100).toFixed(2)}`);
  }
});

// Verify donation presets
console.log('\n  Donation Presets:');
const expectedDonations = {
  5: 'price_1Sj5QyPAhBIL8qL1VpykxChM',
  10: 'price_1Sj5QyPAhBIL8qL1lzZj6BwC',
  25: 'price_1Sj5QzPAhBIL8qL14CC4axrj',
  50: 'price_1Sj5QzPAhBIL8qL1hddvLFSq',
};

Object.entries(expectedDonations).forEach(([amount, expectedPriceId]) => {
  const preset = DONATION_PRESETS[amount];
  if (!preset || preset.priceId !== expectedPriceId) {
    issues.push(`Donation preset $${amount} mismatch`);
    console.log(`    ❌ $${amount}: NOT FOUND or MISMATCH`);
  } else {
    passes++;
    console.log(`    ✅ $${amount}: ${preset.priceId}`);
  }
});

// Verify donation product
console.log('\n  Donation Product:');
if (DONATION_PRODUCT_ID === 'prod_TgSLv0JmV9iTZB') {
  passes++;
  console.log(`    ✅ Support AutoRev: ${DONATION_PRODUCT_ID}`);
} else {
  issues.push('Donation product ID mismatch');
  console.log(`    ❌ Support AutoRev: MISMATCH`);
}

// Verify payment links
console.log('\n  Payment Links:');
const requiredLinks = ['enthusiast', 'tuner', 'creditPackSmall', 'creditPackMedium', 'creditPackLarge', 'donate5', 'donate10', 'donate25', 'donate50'];
requiredLinks.forEach(link => {
  const url = PAYMENT_LINKS[link];
  if (!url || !url.startsWith('https://buy.stripe.com/')) {
    issues.push(`Invalid payment link: ${link}`);
    console.log(`    ❌ ${link}: INVALID`);
  } else {
    passes++;
    console.log(`    ✅ ${link}: ${url.slice(0, 40)}...`);
  }
});

// =============================================================================
// 2. CHECK REQUIRED FILES EXIST
// =============================================================================
console.log('\n📁 Checking required files...');

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const requiredFiles = [
  'lib/stripe.js',
  'app/api/checkout/route.js',
  'app/api/webhooks/stripe/route.js',
  'app/api/billing/portal/route.js',
  'hooks/useCheckout.js',
];

requiredFiles.forEach(file => {
  const filePath = join(rootDir, file);
  if (existsSync(filePath)) {
    passes++;
    console.log(`    ✅ ${file}`);
  } else {
    issues.push(`Missing file: ${file}`);
    console.log(`    ❌ ${file}: NOT FOUND`);
  }
});

// =============================================================================
// 3. CHECK PACKAGE.JSON FOR STRIPE
// =============================================================================
console.log('\n📦 Checking package.json...');

import { readFileSync } from 'fs';

const packageJsonPath = join(rootDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

if (packageJson.dependencies?.stripe) {
  passes++;
  console.log(`    ✅ stripe: ${packageJson.dependencies.stripe}`);
} else {
  issues.push('stripe package not in dependencies');
  console.log('    ❌ stripe: NOT FOUND IN DEPENDENCIES');
}

// =============================================================================
// 4. ENVIRONMENT VARIABLES CHECKLIST
// =============================================================================
console.log(`
================================================================================
📋 REQUIRED ENVIRONMENT VARIABLES FOR VERCEL
================================================================================

Add these environment variables to your Vercel project:

1. STRIPE_SECRET_KEY
   └── Your Stripe secret key
   └── Format: sk_live_xxx or sk_test_xxx
   └── Get from: https://dashboard.stripe.com/apikeys

2. STRIPE_WEBHOOK_SECRET
   └── Webhook signing secret
   └── Format: whsec_xxx
   └── Get after creating webhook endpoint in Stripe Dashboard

3. NEXT_PUBLIC_APP_URL
   └── Your production URL
   └── Value: https://autorev.app
   └── Required for checkout success/cancel redirects

================================================================================
🔗 STRIPE DASHBOARD CONFIGURATION
================================================================================

1. WEBHOOK ENDPOINT
   └── Go to: https://dashboard.stripe.com/webhooks
   └── Click "Add endpoint"
   └── Endpoint URL: https://autorev.app/api/webhooks/stripe
   └── Events to send:
       • checkout.session.completed
       • customer.subscription.created
       • customer.subscription.updated
       • customer.subscription.deleted
       • invoice.paid
       • invoice.payment_failed

2. CUSTOMER PORTAL
   └── Go to: https://dashboard.stripe.com/test/settings/billing/portal
   └── Enable the Customer Portal
   └── Configure:
       • Allow customers to update payment methods
       • Allow customers to view invoices
       • Allow customers to cancel subscriptions
       • Set up return URL: https://autorev.app/profile?tab=billing

================================================================================
🔄 BETA → PRODUCTION SWITCH
================================================================================

To switch from beta mode (all features free) to production (paid subscriptions):

1. Edit lib/tierAccess.js:
   └── Change: export const IS_BETA = true;
   └── To:     export const IS_BETA = false;

2. That's it! The subscription buttons will start redirecting to Stripe Checkout.

================================================================================
`);

// =============================================================================
// SUMMARY
// =============================================================================
console.log('📊 VERIFICATION SUMMARY');
console.log('─────────────────────────────────────────');
console.log(`    ✅ Passed: ${passes}`);
console.log(`    ❌ Issues: ${issues.length}`);

if (issues.length > 0) {
  console.log('\n⚠️  ISSUES FOUND:');
  issues.forEach(issue => console.log(`    • ${issue}`));
}

const finalMessage = issues.length === 0 
  ? '✅ ALL CHECKS PASSED! Your Stripe integration is properly configured.'
  : '⚠️  Please fix the issues above before deploying.';

console.log(`
================================================================================
${finalMessage}
================================================================================
`);

process.exit(issues.length > 0 ? 1 : 0);
