#!/usr/bin/env node
/**
 * Send test welcome emails
 * 
 * Uses the canonical welcome email template from lib/email.js
 * This ensures test emails match what users actually receive.
 * 
 * Usage: node scripts/send-test-welcome-email.js email1@example.com email2@example.com
 */

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://autorev.app';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Import the canonical welcome email template generator
 * Note: Using dynamic import since this is an ES module
 */
async function getWelcomeEmailTemplate() {
  const { generateWelcomeEmailHtml, generateWelcomeEmailText } = await import('../lib/email.js');
  return { generateWelcomeEmailHtml, generateWelcomeEmailText };
}

/**
 * Get the current car count from database
 */
async function getCarCount() {
  try {
    const { count, error } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    return count || 188;
  } catch (err) {
    console.error(`  Error fetching car count: ${err.message}`);
    return 188; // Fallback
  }
}

/**
 * Get user's display name from database by email
 */
async function getUserNameByEmail(email) {
  try {
    // First get the user ID from auth
    const { data: authData } = await supabase.auth.admin.listUsers();
    const user = authData?.users?.find(u => u.email === email);
    
    if (!user) {
      console.log(`  User not found in auth: ${email}`);
      return null;
    }
    
    // Then get their profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();
    
    if (profile?.display_name) {
      console.log(`  Found user: ${profile.display_name}`);
      return profile.display_name;
    }
    
    // Fallback to email prefix
    const emailPrefix = email.split('@')[0];
    console.log(`  No display_name, using email prefix: ${emailPrefix}`);
    return emailPrefix;
  } catch (err) {
    console.error(`  Error fetching user: ${err.message}`);
    return null;
  }
}

async function sendWelcomeEmail(to) {
  console.log(`\nPreparing welcome email for ${to}...`);
  
  // Get template generators
  const { generateWelcomeEmailHtml, generateWelcomeEmailText } = await getWelcomeEmailTemplate();
  
  // Fetch user's name and car count from database
  const [userName, carCount] = await Promise.all([
    getUserNameByEmail(to),
    getCarCount()
  ]);
  
  const templateVars = {
    user_name: userName || 'there',
    login_url: SITE_URL,
    car_count: carCount,
  };
  
  const html = generateWelcomeEmailHtml(templateVars, SITE_URL);
  const text = generateWelcomeEmailText(templateVars, SITE_URL);

  console.log(`  Sending email (using canonical template from lib/email.js)...`);

  const { data, error } = await resend.emails.send({
    from: 'AutoRev <hello@autorev.app>',
    to: [to],
    replyTo: 'support@autorev.app',
    subject: 'Welcome to AutoRev — Find What Drives You',
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
const emails = process.argv.slice(2);

if (emails.length === 0) {
  console.log('Usage: node scripts/send-test-welcome-email.js email1@example.com [email2@example.com ...]');
  process.exit(1);
}

if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not found in .env.local');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Supabase credentials not found in .env.local');
  process.exit(1);
}

console.log('🚀 AutoRev Welcome Email Sender');
console.log('================================');
console.log('📧 Using canonical template from lib/email.js');

for (const email of emails) {
  await sendWelcomeEmail(email);
}

console.log('\n✨ All done!');
