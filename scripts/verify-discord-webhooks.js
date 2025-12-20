#!/usr/bin/env node

/**
 * Discord Webhook Verification Script
 * 
 * Verifies that all required Discord webhook environment variables are set
 * and optionally tests each webhook endpoint.
 * 
 * Usage:
 *   node scripts/verify-discord-webhooks.js           # Check env vars only
 *   node scripts/verify-discord-webhooks.js --test    # Check env vars and test webhooks
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const REQUIRED_WEBHOOKS = {
  DISCORD_WEBHOOK_DEPLOYMENTS: '#deployments - Deployment notifications',
  DISCORD_WEBHOOK_ERRORS: '#errors - Error logging',
  DISCORD_WEBHOOK_CRON: '#cron-summary - Cron job summaries',
  DISCORD_WEBHOOK_FEEDBACK: '#feedback - User feedback',
  DISCORD_WEBHOOK_SIGNUPS: '#signups - New user signups',
  DISCORD_WEBHOOK_CONTACTS: '#contacts - Contact form submissions',
  DISCORD_WEBHOOK_EVENTS: '#event-submissions - Event submissions',
  DISCORD_WEBHOOK_AL: '#al-conversations - AL conversation starts',
  DISCORD_WEBHOOK_DIGEST: '#daily-digest - Daily summary at 9am CST',
};

const shouldTest = process.argv.includes('--test');

console.log('🔍 Discord Webhook Verification\n');

// Check environment variables
let missingVars = [];
let configuredVars = [];

for (const [varName, description] of Object.entries(REQUIRED_WEBHOOKS)) {
  const value = process.env[varName];
  
  if (!value) {
    console.log(`❌ ${varName}`);
    console.log(`   ${description}`);
    console.log(`   Status: NOT SET\n`);
    missingVars.push(varName);
  } else {
    console.log(`✅ ${varName}`);
    console.log(`   ${description}`);
    console.log(`   URL: ${value.substring(0, 50)}...\n`);
    configuredVars.push(varName);
  }
}

// Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📊 Summary: ${configuredVars.length}/${Object.keys(REQUIRED_WEBHOOKS).length} webhooks configured`);

if (missingVars.length > 0) {
  console.log(`\n⚠️  Missing ${missingVars.length} webhook(s):`);
  missingVars.forEach(v => console.log(`   - ${v}`));
  console.log('\n📝 To fix, add these variables to your .env.local file or Vercel environment.');
  process.exit(1);
} else {
  console.log('✅ All Discord webhooks are configured!\n');
}

// Test webhooks if requested
if (shouldTest && configuredVars.length > 0) {
  console.log('🧪 Testing webhook endpoints...\n');
  
  const testWebhook = async (url, channelName) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: '🧪 Test Message',
            description: `This is a test message from the Discord webhook verification script.`,
            color: 0x3b82f6, // blue
            fields: [
              { name: 'Channel', value: channelName, inline: true },
              { name: 'Status', value: 'Test Successful', inline: true },
            ],
            footer: { text: 'AutoRev Webhook Verification' },
            timestamp: new Date().toISOString(),
          }],
        }),
      });

      if (response.ok) {
        console.log(`✅ ${channelName} - Test message sent successfully`);
        return true;
      } else {
        console.log(`❌ ${channelName} - Failed (HTTP ${response.status})`);
        return false;
      }
    } catch (error) {
      console.log(`❌ ${channelName} - Error: ${error.message}`);
      return false;
    }
  };

  // Test each configured webhook
  const testPromises = [];
  for (const [varName, description] of Object.entries(REQUIRED_WEBHOOKS)) {
    const url = process.env[varName];
    if (url) {
      const channelName = description.split(' - ')[0];
      testPromises.push(testWebhook(url, channelName));
      // Rate limit: 1 request per second
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const results = await Promise.all(testPromises);
  const successCount = results.filter(r => r).length;
  
  console.log(`\n📊 Test Results: ${successCount}/${configuredVars.length} webhooks working\n`);
  
  if (successCount === configuredVars.length) {
    console.log('✅ All webhooks are functional!');
  } else {
    console.log('⚠️  Some webhooks failed. Check Discord channel permissions.');
    process.exit(1);
  }
}

console.log('\n✨ Verification complete!\n');

