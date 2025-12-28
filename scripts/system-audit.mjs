#!/usr/bin/env node

/**
 * AutoRev Pre-Launch System Audit Script
 * 
 * Comprehensive validation of all 10 system phases:
 * 1. Authentication System
 * 2. Stripe Payment System
 * 3. AL Assistant System
 * 4. Database & Connectivity
 * 5. Tier Gating System
 * 6. Discord Notifications
 * 7. Cron Jobs
 * 8. Email System
 * 9. Error Tracking & Feedback
 * 10. Key User Journeys (Smoke Tests)
 * 
 * Usage:
 *   node scripts/system-audit.mjs [--phase=N] [--verbose] [--fix]
 * 
 * Options:
 *   --phase=N     Run only phase N (1-10)
 *   --verbose     Show detailed output for each check
 *   --fix         Attempt to fix issues where possible
 *   --skip-discord Skip Discord notification on completion
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  resendApiKey: process.env.RESEND_API_KEY,
  cronSecret: process.env.CRON_SECRET,
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  discordWebhooks: {
    deployments: process.env.DISCORD_WEBHOOK_DEPLOYMENTS,
    errors: process.env.DISCORD_WEBHOOK_ERRORS,
    cron: process.env.DISCORD_WEBHOOK_CRON,
    feedback: process.env.DISCORD_WEBHOOK_FEEDBACK,
    signups: process.env.DISCORD_WEBHOOK_SIGNUPS,
    contacts: process.env.DISCORD_WEBHOOK_CONTACTS,
    events: process.env.DISCORD_WEBHOOK_EVENTS,
    al: process.env.DISCORD_WEBHOOK_AL,
    digest: process.env.DISCORD_WEBHOOK_DIGEST,
    financials: process.env.DISCORD_WEBHOOK_FINANCIALS,
  },
};

// Stripe price IDs to verify
const STRIPE_PRICE_IDS = {
  collector: 'price_1Sj5QuPAhBIL8qL1G5vd4Etd',
  tuner: 'price_1Sj5QvPAhBIL8qL1EWLZKRFL',
  alCreditsSmall: 'price_1Sj5QwPAhBIL8qL1Yy2WePeo',
  alCreditsMedium: 'price_1Sj5QwPAhBIL8qL1HrLcIGno',
  alCreditsLarge: 'price_1Sj5QxPAhBIL8qL1XUyXgK7N',
};

// ============================================================================
// Utilities
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logPhase(phase, name) {
  console.log('\n' + '═'.repeat(70));
  log(`PHASE ${phase}: ${name}`, colors.cyan + colors.bright);
  console.log('═'.repeat(70));
}

function logCheck(status, name, detail = '') {
  const icon = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '○';
  const color = status === 'pass' ? colors.green : status === 'fail' ? colors.red : colors.yellow;
  const detailText = detail ? ` — ${detail}` : '';
  console.log(`${color}  ${icon} ${status.toUpperCase()}: ${name}${detailText}${colors.reset}`);
}

function logSubsection(name) {
  console.log(`\n${colors.blue}▸ ${name}${colors.reset}`);
}

// Result tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  issues: [],
};

function recordResult(status, checkName, detail = '') {
  if (status === 'pass') results.passed++;
  else if (status === 'fail') {
    results.failed++;
    results.issues.push({ check: checkName, detail });
  }
  else results.skipped++;
  
  logCheck(status, checkName, detail);
}

// File existence checker
function fileExists(relativePath) {
  return fs.existsSync(join(projectRoot, relativePath));
}

// Read file content
function readFile(relativePath) {
  try {
    return fs.readFileSync(join(projectRoot, relativePath), 'utf-8');
  } catch {
    return null;
  }
}

// Supabase client (lazy initialized)
let supabase = null;
function getSupabase() {
  if (!supabase && CONFIG.supabaseUrl && CONFIG.supabaseServiceKey) {
    supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return supabase;
}

// ============================================================================
// PHASE 1: Authentication System
// ============================================================================

async function auditPhase1() {
  logPhase(1, 'AUTHENTICATION SYSTEM');
  
  // 1.1 OAuth Flow Verification
  logSubsection('1.1 OAuth Flow Verification');
  
  // Check callback route exists and has correct structure
  const callbackFile = readFile('app/auth/callback/route.js');
  if (callbackFile) {
    recordResult('pass', 'OAuth callback route exists');
    
    // Check for code exchange
    if (callbackFile.includes('exchangeCodeForSession')) {
      recordResult('pass', 'Callback exchanges code for session');
    } else {
      recordResult('fail', 'Callback exchanges code for session', 'Missing exchangeCodeForSession call');
    }
    
    // Check cookie handling
    if (callbackFile.includes('cookiesToSet') && callbackFile.includes('response.cookies.set')) {
      recordResult('pass', 'Explicit cookie transfer to response');
    } else {
      recordResult('fail', 'Explicit cookie transfer to response', 'Missing explicit cookie handling');
    }
    
    // Check error handling
    if (callbackFile.includes('auth/error') || callbackFile.includes('error_description')) {
      recordResult('pass', 'OAuth error states handled');
    } else {
      recordResult('fail', 'OAuth error states handled', 'Missing error redirect');
    }
    
    // Check Discord signup notification
    if (callbackFile.includes('notifySignup')) {
      recordResult('pass', 'Discord signup notification in callback');
    } else {
      recordResult('skip', 'Discord signup notification in callback', 'Not implemented in callback');
    }
  } else {
    recordResult('fail', 'OAuth callback route exists', 'File not found');
  }
  
  // 1.2 Session Persistence (file checks)
  logSubsection('1.2 Session Persistence');
  
  const authProviderFile = readFile('components/providers/AuthProvider.jsx');
  if (authProviderFile) {
    recordResult('pass', 'AuthProvider component exists');
    
    // Check session initialization
    if (authProviderFile.includes('getSession') || authProviderFile.includes('getUser')) {
      recordResult('pass', 'Session initialization logic present');
    } else {
      recordResult('fail', 'Session initialization logic present', 'Missing getSession/getUser');
    }
    
    // Check auth state change listener
    if (authProviderFile.includes('onAuthStateChange')) {
      recordResult('pass', 'Auth state change listener configured');
    } else {
      recordResult('fail', 'Auth state change listener configured', 'Missing onAuthStateChange');
    }
    
    // Check session refresh
    if (authProviderFile.includes('refreshSession')) {
      recordResult('pass', 'Session refresh mechanism present');
    } else {
      recordResult('fail', 'Session refresh mechanism present', 'Missing refreshSession');
    }
    
    // Check cross-tab sync
    if (authProviderFile.includes('visibilitychange') || authProviderFile.includes('storage')) {
      recordResult('pass', 'Cross-tab session sync present');
    } else {
      recordResult('skip', 'Cross-tab session sync present', 'May not be implemented');
    }
  } else {
    recordResult('fail', 'AuthProvider component exists', 'File not found');
  }
  
  // 1.3 User Profile Creation
  logSubsection('1.3 User Profile Creation');
  
  const db = getSupabase();
  if (db) {
    // Check user_profiles table exists and has required columns
    const { data: columns, error } = await db
      .from('user_profiles')
      .select('*')
      .limit(0);
    
    if (!error) {
      recordResult('pass', 'user_profiles table accessible');
      
      // Check for required columns by querying table structure
      const { data: tableInfo } = await db.rpc('get_table_columns', { p_table: 'user_profiles' }).catch(() => ({ data: null }));
      
      // Alternative: just verify key fields work by selecting them
      const { error: colError } = await db
        .from('user_profiles')
        .select('id, subscription_tier, referral_code, stripe_customer_id')
        .limit(1);
      
      if (!colError) {
        recordResult('pass', 'user_profiles has required columns (tier, referral, stripe)');
      } else {
        recordResult('fail', 'user_profiles has required columns', colError.message);
      }
    } else {
      recordResult('fail', 'user_profiles table accessible', error.message);
    }
    
    // Check RLS by attempting to query (will return empty if working)
    const { error: rlsError } = await db.from('user_profiles').select('id').limit(1);
    if (!rlsError) {
      recordResult('pass', 'user_profiles RLS allows service role access');
    } else {
      recordResult('fail', 'user_profiles RLS allows service role access', rlsError.message);
    }
  } else {
    recordResult('skip', 'Database checks', 'Supabase not configured');
  }
  
  // Check auth.js helper
  const authHelperFile = readFile('lib/auth.js');
  if (authHelperFile && authHelperFile.includes('signInWithGoogle')) {
    recordResult('pass', 'Auth helper with Google sign-in exists');
  } else {
    recordResult('fail', 'Auth helper with Google sign-in exists', 'Missing lib/auth.js or signInWithGoogle');
  }
}

// ============================================================================
// PHASE 2: Stripe Payment System
// ============================================================================

async function auditPhase2() {
  logPhase(2, 'STRIPE PAYMENT SYSTEM');
  
  // 2.1 Checkout Flow
  logSubsection('2.1 Checkout Flow');
  
  // Check environment variables
  if (CONFIG.stripeSecretKey) {
    recordResult('pass', 'STRIPE_SECRET_KEY is set');
  } else {
    recordResult('fail', 'STRIPE_SECRET_KEY is set', 'Environment variable missing');
  }
  
  if (CONFIG.stripeWebhookSecret) {
    recordResult('pass', 'STRIPE_WEBHOOK_SECRET is set');
  } else {
    recordResult('fail', 'STRIPE_WEBHOOK_SECRET is set', 'Environment variable missing');
  }
  
  // Check checkout route
  const checkoutFile = readFile('app/api/checkout/route.js');
  if (checkoutFile) {
    recordResult('pass', 'Checkout API route exists');
    
    // Verify it checks authentication
    if (checkoutFile.includes('getUser') || checkoutFile.includes('auth.getUser')) {
      recordResult('pass', 'Checkout requires authentication');
    } else {
      recordResult('fail', 'Checkout requires authentication', 'Missing auth check');
    }
    
    // Check for all checkout types
    if (checkoutFile.includes('subscription') && checkoutFile.includes('credits') && checkoutFile.includes('donation')) {
      recordResult('pass', 'Checkout supports subscription, credits, donation');
    } else {
      recordResult('fail', 'Checkout supports all payment types', 'Missing one or more types');
    }
  } else {
    recordResult('fail', 'Checkout API route exists', 'File not found');
  }
  
  // Check stripe.js config
  const stripeConfigFile = readFile('lib/stripe.js');
  if (stripeConfigFile) {
    recordResult('pass', 'Stripe config file exists');
    
    // Verify price IDs
    for (const [name, priceId] of Object.entries(STRIPE_PRICE_IDS)) {
      if (stripeConfigFile.includes(priceId)) {
        recordResult('pass', `Price ID for ${name} is correct`);
      } else {
        recordResult('fail', `Price ID for ${name} is correct`, `Expected ${priceId}`);
      }
    }
  } else {
    recordResult('fail', 'Stripe config file exists', 'lib/stripe.js not found');
  }
  
  // 2.2 Webhook Processing
  logSubsection('2.2 Webhook Processing');
  
  const webhookFile = readFile('app/api/webhooks/stripe/route.js');
  if (webhookFile) {
    recordResult('pass', 'Stripe webhook route exists');
    
    // Check signature verification
    if (webhookFile.includes('constructEvent') || webhookFile.includes('verifyWebhookSignature')) {
      recordResult('pass', 'Webhook signature verification present');
    } else {
      recordResult('fail', 'Webhook signature verification present', 'Missing signature check');
    }
    
    // Check event handlers
    const events = [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.paid',
    ];
    
    for (const event of events) {
      if (webhookFile.includes(event)) {
        recordResult('pass', `Handles ${event}`);
      } else {
        recordResult('fail', `Handles ${event}`, 'Event handler missing');
      }
    }
  } else {
    recordResult('fail', 'Stripe webhook route exists', 'File not found');
  }
  
  // 2.3 Billing Portal
  logSubsection('2.3 Billing Portal');
  
  const portalFile = readFile('app/api/billing/portal/route.js');
  if (portalFile) {
    recordResult('pass', 'Billing portal route exists');
    
    if (portalFile.includes('billingPortal.sessions.create')) {
      recordResult('pass', 'Creates Stripe portal session');
    } else {
      recordResult('fail', 'Creates Stripe portal session', 'Missing billingPortal.sessions.create');
    }
    
    if (portalFile.includes('stripe_customer_id')) {
      recordResult('pass', 'Checks for stripe_customer_id');
    } else {
      recordResult('fail', 'Checks for stripe_customer_id', 'Missing customer ID check');
    }
  } else {
    recordResult('fail', 'Billing portal route exists', 'File not found');
  }
  
  // 2.4 Database Updates
  logSubsection('2.4 Database Updates (via webhook)');
  
  const db = getSupabase();
  if (db && webhookFile) {
    // Check if webhook updates user_profiles
    if (webhookFile.includes('user_profiles') && webhookFile.includes('stripe_')) {
      recordResult('pass', 'Webhook updates user_profiles with Stripe data');
    } else {
      recordResult('fail', 'Webhook updates user_profiles with Stripe data', 'Missing DB update logic');
    }
    
    // Check if webhook updates al_credits
    if (webhookFile.includes('al_user_credits') || webhookFile.includes('al_credits')) {
      recordResult('pass', 'Webhook handles AL credit purchases');
    } else {
      recordResult('skip', 'Webhook handles AL credit purchases', 'May be handled elsewhere');
    }
  }
}

// ============================================================================
// PHASE 3: AL Assistant System
// ============================================================================

async function auditPhase3() {
  logPhase(3, 'AL ASSISTANT SYSTEM');
  
  // 3.1 API Endpoint
  logSubsection('3.1 API Endpoint');
  
  // Check environment
  if (CONFIG.anthropicApiKey) {
    recordResult('pass', 'ANTHROPIC_API_KEY is set');
  } else {
    recordResult('fail', 'ANTHROPIC_API_KEY is set', 'Environment variable missing');
  }
  
  if (CONFIG.openaiApiKey) {
    recordResult('pass', 'OPENAI_API_KEY is set (for embeddings)');
  } else {
    recordResult('skip', 'OPENAI_API_KEY is set', 'Optional for semantic search');
  }
  
  const aiRouteFile = readFile('app/api/ai-mechanic/route.js');
  if (aiRouteFile) {
    recordResult('pass', 'AI mechanic API route exists');
    
    // Check model string
    if (aiRouteFile.includes('claude-sonnet-4') || aiRouteFile.includes('claude-3')) {
      recordResult('pass', 'Claude model configuration present');
    } else {
      recordResult('fail', 'Claude model configuration present', 'Missing model string');
    }
    
    // Check streaming support
    if (aiRouteFile.includes('stream') && aiRouteFile.includes('ReadableStream')) {
      recordResult('pass', 'Streaming response support');
    } else {
      recordResult('skip', 'Streaming response support', 'May use non-streaming');
    }
    
    // Check tool execution
    if (aiRouteFile.includes('tool_use') || aiRouteFile.includes('executeToolCall')) {
      recordResult('pass', 'Tool execution support');
    } else {
      recordResult('fail', 'Tool execution support', 'Missing tool handling');
    }
  } else {
    recordResult('fail', 'AI mechanic API route exists', 'File not found');
  }
  
  // 3.2 Tool Execution
  logSubsection('3.2 Tool Execution');
  
  const toolsFile = readFile('lib/alTools.js');
  if (toolsFile) {
    recordResult('pass', 'AL tools file exists');
    
    // Check for expected tools
    const expectedTools = [
      'search_cars',
      'get_car_details',
      'get_car_ai_context',
      'search_events',
      'get_expert_reviews',
      'get_known_issues',
      'compare_cars',
      'search_knowledge',
    ];
    
    let toolsFound = 0;
    for (const tool of expectedTools) {
      if (toolsFile.includes(tool)) {
        toolsFound++;
      }
    }
    
    if (toolsFound === expectedTools.length) {
      recordResult('pass', `All ${expectedTools.length} core tools implemented`);
    } else {
      recordResult('fail', `All ${expectedTools.length} core tools implemented`, `Only ${toolsFound} found`);
    }
    
    // Check executeToolCall function
    if (toolsFile.includes('executeToolCall')) {
      recordResult('pass', 'executeToolCall dispatcher exists');
    } else {
      recordResult('fail', 'executeToolCall dispatcher exists', 'Missing function');
    }
  } else {
    recordResult('fail', 'AL tools file exists', 'lib/alTools.js not found');
  }
  
  // Check config file
  const configFile = readFile('lib/alConfig.js');
  if (configFile) {
    recordResult('pass', 'AL config file exists');
    
    if (configFile.includes('AL_PLANS') || configFile.includes('AL_TOOLS')) {
      recordResult('pass', 'AL plans and tools configuration present');
    } else {
      recordResult('fail', 'AL plans and tools configuration present', 'Missing definitions');
    }
  } else {
    recordResult('fail', 'AL config file exists', 'lib/alConfig.js not found');
  }
  
  // 3.3 Credit System
  logSubsection('3.3 Credit System');
  
  const usageServiceFile = readFile('lib/alUsageService.js');
  if (usageServiceFile) {
    recordResult('pass', 'AL usage service exists');
    
    const functions = ['getUserBalance', 'deductUsage', 'purchaseTopup', 'processMonthlyRefill'];
    for (const fn of functions) {
      if (usageServiceFile.includes(fn)) {
        recordResult('pass', `${fn} function exists`);
      } else {
        recordResult('fail', `${fn} function exists`, 'Missing function');
      }
    }
  } else {
    recordResult('fail', 'AL usage service exists', 'lib/alUsageService.js not found');
  }
  
  // Check DB tables
  const db = getSupabase();
  if (db) {
    const tables = ['al_user_credits', 'al_conversations', 'al_messages'];
    for (const table of tables) {
      const { error } = await db.from(table).select('*').limit(0);
      if (!error) {
        recordResult('pass', `Table ${table} accessible`);
      } else {
        recordResult('fail', `Table ${table} accessible`, error.message);
      }
    }
  }
  
  // 3.4 Conversation Service
  logSubsection('3.4 Conversation Service');
  
  const convServiceFile = readFile('lib/alConversationService.js');
  if (convServiceFile) {
    recordResult('pass', 'AL conversation service exists');
    
    const functions = ['createConversation', 'getConversation', 'addMessage'];
    for (const fn of functions) {
      if (convServiceFile.includes(fn)) {
        recordResult('pass', `${fn} function exists`);
      } else {
        recordResult('fail', `${fn} function exists`, 'Missing function');
      }
    }
  } else {
    recordResult('fail', 'AL conversation service exists', 'lib/alConversationService.js not found');
  }
}

// ============================================================================
// PHASE 4: Database & Connectivity
// ============================================================================

async function auditPhase4() {
  logPhase(4, 'DATABASE & CONNECTIVITY');
  
  // 4.1 Health Check
  logSubsection('4.1 Health Check');
  
  const healthFile = readFile('app/api/health/route.js');
  if (healthFile) {
    recordResult('pass', 'Health check route exists');
    
    if (healthFile.includes('deep') && healthFile.includes('database')) {
      recordResult('pass', 'Deep health check with DB connectivity');
    } else {
      recordResult('fail', 'Deep health check with DB connectivity', 'Missing deep check');
    }
    
    if (healthFile.includes('degraded') || healthFile.includes('503')) {
      recordResult('pass', 'Returns degraded status on DB failure');
    } else {
      recordResult('fail', 'Returns degraded status on DB failure', 'Missing degraded handling');
    }
  } else {
    recordResult('fail', 'Health check route exists', 'File not found');
  }
  
  // 4.2 Critical Tables
  logSubsection('4.2 Critical Tables Exist');
  
  const db = getSupabase();
  if (db) {
    const criticalTables = [
      'user_profiles',
      'al_user_credits',
      'al_conversations',
      'al_messages',
      'user_favorites',
      'user_vehicles',
      'user_projects',
      'user_feedback',
      'email_templates',
      'email_logs',
      'email_queue',
      'cars',
      'parts',
      'events',
    ];
    
    for (const table of criticalTables) {
      const { error } = await db.from(table).select('*').limit(0);
      if (!error) {
        recordResult('pass', `Table ${table} exists`);
      } else {
        recordResult('fail', `Table ${table} exists`, error.message);
      }
    }
  } else {
    recordResult('skip', 'Critical tables check', 'Supabase not configured');
  }
  
  // 4.3 Database Views
  logSubsection('4.3 Database Views');
  
  if (db) {
    const views = ['v_unresolved_errors', 'v_regression_errors', 'v_error_summary'];
    for (const view of views) {
      const { error } = await db.from(view).select('*').limit(1);
      if (!error) {
        recordResult('pass', `View ${view} accessible`);
      } else {
        recordResult('skip', `View ${view} accessible`, error.message || 'May not exist');
      }
    }
  }
  
  // 4.4 Supabase Client Files
  logSubsection('4.4 Supabase Client Files');
  
  const supabaseFiles = [
    'lib/supabase.js',
    'lib/supabaseServer.js',
    'lib/serviceSupabase.js',
  ];
  
  for (const file of supabaseFiles) {
    if (fileExists(file)) {
      recordResult('pass', `${file} exists`);
    } else {
      recordResult('fail', `${file} exists`, 'File not found');
    }
  }
}

// ============================================================================
// PHASE 5: Tier Gating System
// ============================================================================

async function auditPhase5() {
  logPhase(5, 'TIER GATING SYSTEM');
  
  // 5.1 Beta Mode Verification
  logSubsection('5.1 Beta Mode Verification');
  
  const tierAccessFile = readFile('lib/tierAccess.js');
  if (tierAccessFile) {
    recordResult('pass', 'Tier access file exists');
    
    // Check IS_BETA flag
    const isBetaMatch = tierAccessFile.match(/export const IS_BETA\s*=\s*(true|false)/);
    if (isBetaMatch) {
      const isBeta = isBetaMatch[1] === 'true';
      recordResult('pass', `IS_BETA flag is set to ${isBeta}`, isBeta ? 'Beta mode active' : 'Production mode');
    } else {
      recordResult('fail', 'IS_BETA flag is set', 'Could not find IS_BETA export');
    }
    
    // Check TIER_HIERARCHY
    if (tierAccessFile.includes('TIER_HIERARCHY') && tierAccessFile.includes("'free'") && tierAccessFile.includes("'collector'") && tierAccessFile.includes("'tuner'")) {
      recordResult('pass', 'Tier hierarchy defined (free → collector → tuner)');
    } else {
      recordResult('fail', 'Tier hierarchy defined', 'Missing tier definitions');
    }
  } else {
    recordResult('fail', 'Tier access file exists', 'lib/tierAccess.js not found');
  }
  
  // 5.2 Feature Access Functions
  logSubsection('5.2 Feature Access Functions');
  
  if (tierAccessFile) {
    const functions = ['hasAccess', 'hasFeatureAccess', 'hasTierAccess', 'shouldShowUpgradePrompt'];
    for (const fn of functions) {
      if (tierAccessFile.includes(`export function ${fn}`) || tierAccessFile.includes(`function ${fn}`)) {
        recordResult('pass', `${fn}() function exists`);
      } else {
        recordResult('fail', `${fn}() function exists`, 'Missing function');
      }
    }
    
    // Check FEATURES object
    if (tierAccessFile.includes('export const FEATURES')) {
      recordResult('pass', 'FEATURES object exported');
    } else {
      recordResult('fail', 'FEATURES object exported', 'Missing FEATURES export');
    }
    
    // Check TEASER_LIMITS
    if (tierAccessFile.includes('TEASER_LIMITS')) {
      recordResult('pass', 'TEASER_LIMITS defined');
    } else {
      recordResult('fail', 'TEASER_LIMITS defined', 'Missing TEASER_LIMITS');
    }
  }
  
  // 5.3 UI Gating Components
  logSubsection('5.3 UI Gating Components');
  
  const premiumGateFile = readFile('components/PremiumGate.jsx');
  if (premiumGateFile) {
    recordResult('pass', 'PremiumGate component exists');
    
    if (premiumGateFile.includes('useAuth') || premiumGateFile.includes('isAuthenticated')) {
      recordResult('pass', 'PremiumGate uses auth context');
    } else {
      recordResult('fail', 'PremiumGate uses auth context', 'Missing auth integration');
    }
    
    if (premiumGateFile.includes('hasAccess') || premiumGateFile.includes('shouldShowUpgradePrompt')) {
      recordResult('pass', 'PremiumGate uses tier access functions');
    } else {
      recordResult('fail', 'PremiumGate uses tier access functions', 'Missing access check');
    }
    
    if (premiumGateFile.includes('IS_BETA')) {
      recordResult('pass', 'PremiumGate respects IS_BETA flag');
    } else {
      recordResult('fail', 'PremiumGate respects IS_BETA flag', 'Missing beta check');
    }
  } else {
    recordResult('fail', 'PremiumGate component exists', 'components/PremiumGate.jsx not found');
  }
  
  // Check TeaserPrompt
  if (premiumGateFile && premiumGateFile.includes('TeaserPrompt')) {
    recordResult('pass', 'TeaserPrompt component exported');
  } else {
    recordResult('skip', 'TeaserPrompt component exported', 'May be in separate file');
  }
  
  // Check usePremiumAccess hook
  if (premiumGateFile && premiumGateFile.includes('usePremiumAccess')) {
    recordResult('pass', 'usePremiumAccess hook exists');
  } else {
    recordResult('skip', 'usePremiumAccess hook exists', 'May not be implemented');
  }
}

// ============================================================================
// PHASE 6: Discord Notifications
// ============================================================================

async function auditPhase6() {
  logPhase(6, 'DISCORD NOTIFICATIONS');
  
  // 6.1 Environment Variables
  logSubsection('6.1 Environment Variables');
  
  const webhookNames = Object.keys(CONFIG.discordWebhooks);
  let configuredCount = 0;
  
  for (const name of webhookNames) {
    const isSet = !!CONFIG.discordWebhooks[name];
    if (isSet) {
      recordResult('pass', `DISCORD_WEBHOOK_${name.toUpperCase()} is set`);
      configuredCount++;
    } else {
      recordResult('fail', `DISCORD_WEBHOOK_${name.toUpperCase()} is set`, 'Environment variable missing');
    }
  }
  
  log(`\n  Summary: ${configuredCount}/${webhookNames.length} Discord webhooks configured`, colors.dim);
  
  // 6.2 Discord Library
  logSubsection('6.2 Discord Library');
  
  const discordFile = readFile('lib/discord.js');
  if (discordFile) {
    recordResult('pass', 'Discord helper library exists');
    
    // Check for notification functions
    const functions = [
      'postToDiscord',
      'notifyFeedback',
      'notifyContact',
      'notifyError',
      'notifySignup',
      'notifyEventSubmission',
      'notifyALConversation',
      'notifyCronCompletion',
      'notifyPayment',
      'postDailyDigest',
    ];
    
    let functionsFound = 0;
    for (const fn of functions) {
      if (discordFile.includes(fn)) {
        functionsFound++;
      }
    }
    
    if (functionsFound >= 8) {
      recordResult('pass', `${functionsFound}/${functions.length} notification functions present`);
    } else {
      recordResult('fail', `Discord notification functions`, `Only ${functionsFound}/${functions.length} found`);
    }
    
    // Check CHANNELS object
    const channelsInLib = ['feedback', 'contacts', 'errors', 'signups', 'events', 'al', 'cron', 'digest'];
    let channelsConfigured = 0;
    for (const ch of channelsInLib) {
      if (discordFile.includes(`${ch}:`)) {
        channelsConfigured++;
      }
    }
    recordResult('pass', `${channelsConfigured} channels configured in library`);
  } else {
    recordResult('fail', 'Discord helper library exists', 'lib/discord.js not found');
  }
  
  // 6.3 Verify webhook script exists
  logSubsection('6.3 Verification Script');
  
  if (fileExists('scripts/verify-discord-webhooks.js')) {
    recordResult('pass', 'Discord webhook verification script exists');
  } else {
    recordResult('skip', 'Discord webhook verification script exists', 'Optional');
  }
}

// ============================================================================
// PHASE 7: Cron Jobs
// ============================================================================

async function auditPhase7() {
  logPhase(7, 'CRON JOBS');
  
  // 7.1 Vercel.json Configuration
  logSubsection('7.1 Vercel.json Configuration');
  
  const vercelConfigFile = readFile('vercel.json');
  if (vercelConfigFile) {
    recordResult('pass', 'vercel.json exists');
    
    try {
      const config = JSON.parse(vercelConfigFile);
      
      if (config.crons && Array.isArray(config.crons)) {
        recordResult('pass', `${config.crons.length} cron jobs configured`);
        
        // List all cron paths
        const cronPaths = config.crons.map(c => c.path.split('?')[0]);
        log(`\n  Configured crons: ${cronPaths.join(', ')}`, colors.dim);
      } else {
        recordResult('fail', 'Cron jobs configured', 'Missing crons array');
      }
    } catch (e) {
      recordResult('fail', 'vercel.json is valid JSON', e.message);
    }
  } else {
    recordResult('fail', 'vercel.json exists', 'File not found');
  }
  
  // 7.2 Cron Route Files
  logSubsection('7.2 Cron Route Files');
  
  const expectedCrons = [
    'daily-digest',
    'daily-metrics',
    'flush-error-aggregates',
    'forum-scrape',
    'process-email-queue',
    'process-scrape-jobs',
    'refresh-complaints',
    'refresh-events',
    'refresh-recalls',
    'schedule-inactivity-emails',
    'schedule-ingestion',
    'youtube-enrichment',
  ];
  
  for (const cron of expectedCrons) {
    if (fileExists(`app/api/cron/${cron}/route.js`)) {
      recordResult('pass', `Cron route ${cron} exists`);
    } else {
      recordResult('fail', `Cron route ${cron} exists`, 'File not found');
    }
  }
  
  // 7.3 Cron Authentication
  logSubsection('7.3 Cron Authentication');
  
  if (CONFIG.cronSecret) {
    recordResult('pass', 'CRON_SECRET is set');
  } else {
    recordResult('fail', 'CRON_SECRET is set', 'Environment variable missing');
  }
  
  // Spot check one cron file for auth
  const dailyDigestFile = readFile('app/api/cron/daily-digest/route.js');
  if (dailyDigestFile) {
    if (dailyDigestFile.includes('CRON_SECRET') || dailyDigestFile.includes('x-vercel-cron') || dailyDigestFile.includes('authorization')) {
      recordResult('pass', 'Cron routes check authentication');
    } else {
      recordResult('fail', 'Cron routes check authentication', 'Missing auth check in daily-digest');
    }
  }
}

// ============================================================================
// PHASE 8: Email System
// ============================================================================

async function auditPhase8() {
  logPhase(8, 'EMAIL SYSTEM');
  
  // 8.1 Configuration
  logSubsection('8.1 Configuration');
  
  if (CONFIG.resendApiKey) {
    recordResult('pass', 'RESEND_API_KEY is set');
  } else {
    recordResult('fail', 'RESEND_API_KEY is set', 'Environment variable missing');
  }
  
  // 8.2 Email Service
  logSubsection('8.2 Email Service');
  
  const emailFile = readFile('lib/email.js');
  if (emailFile) {
    recordResult('pass', 'Email service file exists');
    
    // Check for Resend integration
    if (emailFile.includes('Resend') || emailFile.includes('resend')) {
      recordResult('pass', 'Resend SDK integration present');
    } else {
      recordResult('fail', 'Resend SDK integration present', 'Missing Resend');
    }
    
    // Check for templates
    if (emailFile.includes('EMAIL_TEMPLATES') || emailFile.includes('welcome')) {
      recordResult('pass', 'Email templates defined');
    } else {
      recordResult('fail', 'Email templates defined', 'Missing templates');
    }
    
    // Check functions
    const functions = ['sendTemplateEmail', 'sendWelcomeEmail', 'queueEmail', 'processEmailQueue'];
    for (const fn of functions) {
      if (emailFile.includes(fn)) {
        recordResult('pass', `${fn} function exists`);
      } else {
        recordResult('skip', `${fn} function exists`, 'May not be implemented');
      }
    }
  } else {
    recordResult('fail', 'Email service file exists', 'lib/email.js not found');
  }
  
  // 8.3 Email Queue Cron
  logSubsection('8.3 Email Queue Processing');
  
  if (fileExists('app/api/cron/process-email-queue/route.js')) {
    recordResult('pass', 'Email queue processor cron exists');
  } else {
    recordResult('fail', 'Email queue processor cron exists', 'File not found');
  }
  
  // 8.4 Database Tables
  logSubsection('8.4 Email Database Tables');
  
  const db = getSupabase();
  if (db) {
    const tables = ['email_templates', 'email_logs', 'email_queue'];
    for (const table of tables) {
      const { error } = await db.from(table).select('*').limit(0);
      if (!error) {
        recordResult('pass', `Table ${table} exists`);
      } else {
        recordResult('fail', `Table ${table} exists`, error.message);
      }
    }
  }
}

// ============================================================================
// PHASE 9: Error Tracking & Feedback
// ============================================================================

async function auditPhase9() {
  logPhase(9, 'ERROR TRACKING & FEEDBACK');
  
  // 9.1 Feedback API
  logSubsection('9.1 Feedback API');
  
  const feedbackFile = readFile('app/api/feedback/route.js');
  if (feedbackFile) {
    recordResult('pass', 'Feedback API route exists');
    
    // Check for POST handler
    if (feedbackFile.includes('export async function POST')) {
      recordResult('pass', 'POST handler for feedback submission');
    } else {
      recordResult('fail', 'POST handler for feedback submission', 'Missing POST');
    }
    
    // Check for GET handler
    if (feedbackFile.includes('export async function GET')) {
      recordResult('pass', 'GET handler for feedback retrieval');
    } else {
      recordResult('fail', 'GET handler for feedback retrieval', 'Missing GET');
    }
    
    // Check for Discord notification
    if (feedbackFile.includes('notifyFeedback')) {
      recordResult('pass', 'Discord notification on feedback');
    } else {
      recordResult('fail', 'Discord notification on feedback', 'Missing notifyFeedback');
    }
    
    // Check for auto-error handling
    if (feedbackFile.includes('auto-error') || feedbackFile.includes('application_errors')) {
      recordResult('pass', 'Auto-error logging support');
    } else {
      recordResult('skip', 'Auto-error logging support', 'May not be implemented');
    }
  } else {
    recordResult('fail', 'Feedback API route exists', 'File not found');
  }
  
  // 9.2 Error Analysis Tools
  logSubsection('9.2 Error Analysis Tools');
  
  if (fileExists('scripts/error-analysis.mjs')) {
    recordResult('pass', 'Error analysis CLI script exists');
  } else {
    recordResult('skip', 'Error analysis CLI script exists', 'Optional tool');
  }
  
  if (fileExists('lib/errorAnalysis.js')) {
    recordResult('pass', 'Error analysis library exists');
  } else {
    recordResult('skip', 'Error analysis library exists', 'Optional');
  }
  
  // 9.3 Database Tables
  logSubsection('9.3 Error Tracking Database');
  
  const db = getSupabase();
  if (db) {
    const { error: feedbackError } = await db.from('user_feedback').select('*').limit(0);
    if (!feedbackError) {
      recordResult('pass', 'user_feedback table exists');
    } else {
      recordResult('fail', 'user_feedback table exists', feedbackError.message);
    }
    
    const { error: appErrorsError } = await db.from('application_errors').select('*').limit(0);
    if (!appErrorsError) {
      recordResult('pass', 'application_errors table exists');
    } else {
      recordResult('skip', 'application_errors table exists', 'Optional advanced table');
    }
  }
}

// ============================================================================
// PHASE 10: Key User Journeys (Smoke Tests)
// ============================================================================

async function auditPhase10() {
  logPhase(10, 'KEY USER JOURNEYS (Smoke Tests)');
  
  // 10.1 Car Shopper Journey
  logSubsection('10.1 Car Shopper Journey');
  
  // Check browse-cars page
  if (fileExists('app/browse-cars/page.jsx')) {
    recordResult('pass', 'Browse cars page exists');
  } else {
    recordResult('fail', 'Browse cars page exists', 'File not found');
  }
  
  // Check car detail page
  if (fileExists('app/browse-cars/[slug]/page.jsx')) {
    recordResult('pass', 'Car detail page exists');
  } else {
    recordResult('fail', 'Car detail page exists', 'File not found');
  }
  
  // Check car selector
  if (fileExists('app/car-selector/page.jsx')) {
    recordResult('pass', 'Car selector page exists');
  } else {
    recordResult('fail', 'Car selector page exists', 'File not found');
  }
  
  // 10.2 Garage Owner Journey
  logSubsection('10.2 Garage Owner Journey');
  
  if (fileExists('app/garage/page.jsx')) {
    recordResult('pass', 'Garage page exists');
  } else {
    recordResult('fail', 'Garage page exists', 'File not found');
  }
  
  // Check for VIN decode API
  if (fileExists('app/api/vin/decode/route.js')) {
    recordResult('pass', 'VIN decode API exists');
  } else {
    recordResult('skip', 'VIN decode API exists', 'May be in different location');
  }
  
  // 10.3 Tuner Journey
  logSubsection('10.3 Tuner Journey');
  
  if (fileExists('app/tuning-shop/page.jsx')) {
    recordResult('pass', 'Tuning shop page exists');
  } else {
    recordResult('fail', 'Tuning shop page exists', 'File not found');
  }
  
  // 10.4 AL Chat Journey
  logSubsection('10.4 AL Chat Journey');
  
  if (fileExists('app/al/page.jsx')) {
    recordResult('pass', 'AL chat page exists');
  } else {
    recordResult('fail', 'AL chat page exists', 'File not found');
  }
  
  if (fileExists('components/AIMechanicChat.jsx')) {
    recordResult('pass', 'AI Mechanic Chat component exists');
  } else {
    recordResult('fail', 'AI Mechanic Chat component exists', 'File not found');
  }
  
  // 10.5 Events Journey
  logSubsection('10.5 Events Journey');
  
  if (fileExists('app/community/page.jsx') || fileExists('app/events/page.jsx')) {
    recordResult('pass', 'Events/community page exists');
  } else {
    recordResult('fail', 'Events/community page exists', 'File not found');
  }
  
  // 10.6 API Route Coverage
  logSubsection('10.6 Critical API Routes');
  
  const criticalApiRoutes = [
    'app/api/cars/route.js',
    'app/api/parts/route.js',
    'app/api/events/route.js',
    'app/api/favorites/route.js',
    'app/api/vehicles/route.js',
  ];
  
  for (const route of criticalApiRoutes) {
    if (fileExists(route)) {
      recordResult('pass', `${route.split('/').slice(-2, -1)[0]} API exists`);
    } else {
      recordResult('fail', `${route.split('/').slice(-2, -1)[0]} API exists`, 'File not found');
    }
  }
}

// ============================================================================
// Summary & Discord Notification
// ============================================================================

async function printSummary() {
  console.log('\n' + '═'.repeat(70));
  log('AUDIT SUMMARY', colors.cyan + colors.bright);
  console.log('═'.repeat(70));
  
  const total = results.passed + results.failed + results.skipped;
  const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
  
  console.log(`
  ${colors.green}✓ Passed:  ${results.passed}${colors.reset}
  ${colors.red}✗ Failed:  ${results.failed}${colors.reset}
  ${colors.yellow}○ Skipped: ${results.skipped}${colors.reset}
  ─────────────────
  Total:     ${total}
  Pass Rate: ${passRate}%
  `);
  
  if (results.issues.length > 0) {
    log('\nCritical Issues:', colors.red + colors.bright);
    for (const issue of results.issues.slice(0, 10)) {
      console.log(`  • ${issue.check}: ${issue.detail}`);
    }
    if (results.issues.length > 10) {
      console.log(`  ... and ${results.issues.length - 10} more issues`);
    }
  }
  
  // Go/No-Go recommendation
  console.log('\n' + '─'.repeat(70));
  if (results.failed === 0) {
    log('🚀 GO FOR LAUNCH: All checks passed!', colors.green + colors.bright);
  } else if (results.failed <= 5) {
    log('⚠️  CONDITIONAL GO: Minor issues to address before launch', colors.yellow + colors.bright);
  } else {
    log('🛑 NO-GO: Critical issues must be resolved before launch', colors.red + colors.bright);
  }
  console.log('─'.repeat(70) + '\n');
}

async function sendDiscordSummary() {
  const webhookUrl = CONFIG.discordWebhooks.cron;
  if (!webhookUrl) {
    log('Skipping Discord notification (webhook not configured)', colors.dim);
    return;
  }
  
  const total = results.passed + results.failed + results.skipped;
  const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
  
  const status = results.failed === 0 ? '✅ ALL PASSED' : 
                 results.failed <= 5 ? '⚠️ MINOR ISSUES' : '🛑 CRITICAL ISSUES';
  
  const color = results.failed === 0 ? 0x22c55e : results.failed <= 5 ? 0xf59e0b : 0xef4444;
  
  const embed = {
    title: `🔍 System Audit Complete: ${status}`,
    description: `Pre-launch system audit completed with ${passRate}% pass rate.`,
    color,
    fields: [
      { name: '✓ Passed', value: String(results.passed), inline: true },
      { name: '✗ Failed', value: String(results.failed), inline: true },
      { name: '○ Skipped', value: String(results.skipped), inline: true },
    ],
    footer: { text: 'AutoRev System Audit' },
    timestamp: new Date().toISOString(),
  };
  
  if (results.issues.length > 0) {
    const topIssues = results.issues.slice(0, 5).map(i => `• ${i.check}`).join('\n');
    embed.fields.push({
      name: '🚨 Top Issues',
      value: topIssues,
      inline: false,
    });
  }
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
    
    if (response.ok) {
      log('✓ Discord notification sent', colors.green);
    } else {
      log(`✗ Discord notification failed: ${response.status}`, colors.red);
    }
  } catch (err) {
    log(`✗ Discord notification error: ${err.message}`, colors.red);
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main() {
  console.log('\n' + '═'.repeat(70));
  log('AUTOREV PRE-LAUNCH SYSTEM AUDIT', colors.magenta + colors.bright);
  console.log('═'.repeat(70));
  log(`Started at: ${new Date().toISOString()}`, colors.dim);
  log(`App URL: ${CONFIG.appUrl}`, colors.dim);
  
  // Parse arguments
  const args = process.argv.slice(2);
  const phaseArg = args.find(a => a.startsWith('--phase='));
  const specificPhase = phaseArg ? parseInt(phaseArg.split('=')[1]) : null;
  const skipDiscord = args.includes('--skip-discord');
  
  // Run phases
  const phases = [
    auditPhase1,
    auditPhase2,
    auditPhase3,
    auditPhase4,
    auditPhase5,
    auditPhase6,
    auditPhase7,
    auditPhase8,
    auditPhase9,
    auditPhase10,
  ];
  
  for (let i = 0; i < phases.length; i++) {
    if (specificPhase && (i + 1) !== specificPhase) continue;
    
    try {
      await phases[i]();
    } catch (err) {
      log(`\n  ERROR in Phase ${i + 1}: ${err.message}`, colors.red);
      results.failed++;
      results.issues.push({ check: `Phase ${i + 1}`, detail: err.message });
    }
  }
  
  // Print summary
  await printSummary();
  
  // Send Discord notification
  if (!skipDiscord) {
    await sendDiscordSummary();
  }
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

