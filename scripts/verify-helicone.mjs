#!/usr/bin/env node
/**
 * Verify Helicone Integration
 * 
 * Run: node scripts/verify-helicone.mjs
 */

import { isHeliconeConfigured, getAnthropicConfig, logObservabilityStatus } from '../lib/observability.js';

console.log('=== Helicone Integration Check ===\n');

// 1. Check environment
const hasKey = !!process.env.HELICONE_API_KEY;
console.log(`1. HELICONE_API_KEY env var: ${hasKey ? '✅ Set' : '❌ Missing'}`);

if (hasKey) {
  const keyPreview = process.env.HELICONE_API_KEY.slice(0, 10) + '...';
  console.log(`   Key preview: ${keyPreview}`);
}

// 2. Check module detection
const configured = isHeliconeConfigured();
console.log(`\n2. isHeliconeConfigured(): ${configured ? '✅ true' : '❌ false'}`);

// 3. Check config generation
const config = getAnthropicConfig({
  userId: 'test-user',
  sessionId: 'test-session',
  promptVersion: 'v1-test',
  properties: { tier: 'free', test: true },
});

console.log(`\n3. API Configuration:`);
console.log(`   URL: ${config.apiUrl}`);
console.log(`   Observability: ${config.observabilityEnabled ? '✅ Enabled' : '❌ Disabled'}`);

// 4. Check headers
console.log(`\n4. Headers Generated:`);
const headerKeys = Object.keys(config.headers);
headerKeys.forEach(key => {
  if (key.startsWith('Helicone')) {
    const value = config.headers[key];
    const preview = typeof value === 'string' && value.length > 30 
      ? value.slice(0, 30) + '...' 
      : value;
    console.log(`   ✅ ${key}: ${preview}`);
  }
});

const heliconeHeaders = headerKeys.filter(k => k.startsWith('Helicone'));
if (heliconeHeaders.length === 0) {
  console.log('   ❌ No Helicone headers (observability disabled)');
}

// 5. Summary
console.log('\n=== Summary ===');
if (configured) {
  console.log('✅ Helicone is properly configured!');
  console.log('   - Requests will be proxied through anthropic.helicone.ai');
  console.log('   - User, session, and prompt tracking enabled');
  console.log('   - View traces at https://helicone.ai/dashboard');
} else {
  console.log('⚠️  Helicone is NOT configured');
  console.log('   - Requests go directly to api.anthropic.com');
  console.log('   - Set HELICONE_API_KEY to enable observability');
}

console.log('');
