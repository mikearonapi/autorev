#!/usr/bin/env node

/**
 * Test Daily Digest (with today's data)
 * 
 * This script triggers the daily digest endpoint to test it with today's actual data.
 * You can run this anytime - it will analyze the last 24 hours and post to Discord.
 * 
 * Usage:
 *   node scripts/test-daily-digest.js
 * 
 * Or test against production:
 *   node scripts/test-daily-digest.js --production
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const args = process.argv.slice(2);
const isProduction = args.includes('--production');

const CRON_SECRET = process.env.CRON_SECRET;
const BASE_URL = isProduction 
  ? 'https://autorev.app'
  : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

if (!CRON_SECRET) {
  console.error('❌ CRON_SECRET environment variable is required');
  console.error('   Make sure it\'s set in your .env.local file');
  process.exit(1);
}

console.log('🧪 Testing Daily Digest');
console.log(`📍 Target: ${BASE_URL}`);
console.log('⏳ Sending request...\n');

try {
  const response = await fetch(`${BASE_URL}/api/cron/daily-digest`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CRON_SECRET}`,
    },
  });

  const contentType = response.headers.get('content-type');
  let result;
  
  if (contentType && contentType.includes('application/json')) {
    result = await response.json();
    } else {
    result = await response.text();
    }

  if (response.ok) {
    console.log('✅ Daily Digest Posted Successfully!\n');
    console.log('📊 Stats from response:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n💬 Check your Discord #daily-digest and #al-conversations channels!');
    } else {
    console.error('❌ Request failed:', response.status, response.statusText);
    console.error('Response:', result);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  
  if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
    console.error('\n💡 Tip: Make sure your dev server is running:');
    console.error('   npm run dev');
    console.error('\n   Or test against production:');
    console.error('   node scripts/test-daily-digest.js --production');
  }
}
