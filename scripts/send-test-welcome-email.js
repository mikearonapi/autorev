#!/usr/bin/env node
/**
 * Send test welcome emails
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
 * Get the current car count from database
 */
async function getCarCount() {
  try {
    const { count, error } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    return count || 100;
  } catch (err) {
    console.error(`  Error fetching car count: ${err.message}`);
    return 100; // Fallback
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

function getWelcomeEmailHtml(vars) {
  const userName = vars.user_name || 'there';
  const loginUrl = vars.login_url || SITE_URL;
  const year = new Date().getFullYear();
  const carCount = vars.car_count || 100;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Welcome to AutoRev</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset & Base */
    body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f3f4f6; }
    
    /* Mobile Optimizations */
    @media screen and (max-width: 600px) {
      .wrapper { padding: 12px !important; }
      .container { width: 100% !important; max-width: 100% !important; }
      .content { padding: 24px 20px !important; }
      .mobile-stack { display: block !important; width: 100% !important; padding-left: 0 !important; padding-top: 12px !important; }
      .mobile-icon { padding-bottom: 0 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    Welcome to the community, ${userName}. Find what drives you.
  </div>
  
  <!-- Outer Background -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" class="wrapper" style="padding: 40px 20px;">
        
        <!-- Main Card Container -->
        <table role="presentation" class="container" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Logo Header - Clean White -->
          <tr>
            <td align="center" style="padding: 40px 0 32px 0; border-bottom: 1px solid #f3f4f6;">
              <img src="${SITE_URL}/images/autorev-logo-white.png" alt="AutoRev" width="100" height="100" style="display: block; margin-bottom: 16px;">
              <p style="margin: 0; font-size: 14px; font-weight: 600; letter-spacing: 2px; color: #9ca3af; text-transform: uppercase;">Welcome to AutoRev</p>
            </td>
          </tr>
          
          <!-- Hero Section -->
          <tr>
            <td align="center" style="padding: 32px 32px 0 32px;">
              <img src="${SITE_URL}/images/pages/home-hero.jpg" alt="Sports Car" width="536" style="display: block; width: 100%; max-width: 536px; height: auto; border-radius: 12px;">
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td class="content" style="padding: 24px 40px 40px 40px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1f2937; text-align: left;">
                Hey ${userName} 👋
              </p>
              
              <!-- Intro Text -->
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                Welcome to AutoRev—where we lift up the driver with the $3K Miata the same as the one with the $300K GT3RS.
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                We built this for enthusiasts who want real data, honest guidance, and a community that celebrates the passion—not the price tag.
              </p>
              
              <!-- Mission Statement Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fffbeb; border-radius: 8px; border: 1px solid #fcd34d;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; font-size: 15px; line-height: 24px; color: #92400e; text-align: center; font-weight: 500;">
                      No flex culture. No gatekeeping. Just honest guidance and genuine community.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Divider -->
              <div style="height: 1px; background-color: #e5e7eb; margin: 32px 0;"></div>
              
              <!-- Features Intro -->
              <p style="margin: 0 0 24px 0; font-size: 13px; font-weight: 700; letter-spacing: 1px; color: #9ca3af; text-transform: uppercase;">
                Here's what you can do
              </p>
              
              <!-- Feature List -->
              
              <!-- 1. Browse & Discover -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td width="50" valign="top" class="mobile-icon">
                    <div style="width: 40px; height: 40px; background-color: #eff6ff; border-radius: 10px; text-align: center; line-height: 40px; font-size: 20px;">🔍</div>
                  </td>
                  <td class="mobile-stack" style="padding-left: 16px;">
                    <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">Browse & Discover</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #6b7280;">Explore ${carCount} sports cars. Use our Car Selector to find your perfect match based on 7 priorities you actually care about.</p>
                  </td>
                </tr>
              </table>
              
              <!-- 2. My Garage -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td width="50" valign="top" class="mobile-icon">
                    <div style="width: 40px; height: 40px; background-color: #fef2f2; border-radius: 10px; text-align: center; line-height: 40px; font-size: 20px;">🚗</div>
                  </td>
                  <td class="mobile-stack" style="padding-left: 16px;">
                    <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">My Garage</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #6b7280;">Save favorites, add your rides with VIN decode, track service history, and monitor market value—all in one place.</p>
                  </td>
                </tr>
              </table>
              
              <!-- 3. Tuning Shop -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td width="50" valign="top" class="mobile-icon">
                    <div style="width: 40px; height: 40px; background-color: #f0fdf4; border-radius: 10px; text-align: center; line-height: 40px; font-size: 20px;">🔧</div>
                  </td>
                  <td class="mobile-stack" style="padding-left: 16px;">
                    <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">Tuning Shop</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #6b7280;">Plan your build with real dyno data, lap times, and parts that actually fit. No guessing, just data.</p>
                  </td>
                </tr>
              </table>
              
              <!-- 4. Community & Events -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td width="50" valign="top" class="mobile-icon">
                    <div style="width: 40px; height: 40px; background-color: #fef3c7; border-radius: 10px; text-align: center; line-height: 40px; font-size: 20px;">📍</div>
                  </td>
                  <td class="mobile-stack" style="padding-left: 16px;">
                    <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">Community & Events</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #6b7280;">Find Cars & Coffee, track days, car shows, and meetups near you. Never miss another event.</p>
                  </td>
                </tr>
              </table>
              
              <!-- 5. Encyclopedia -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td width="50" valign="top" class="mobile-icon">
                    <div style="width: 40px; height: 40px; background-color: #ede9fe; border-radius: 10px; text-align: center; line-height: 40px; font-size: 20px;">📚</div>
                  </td>
                  <td class="mobile-stack" style="padding-left: 16px;">
                    <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">Encyclopedia</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #6b7280;">136 topics on how cars actually work—from turbo fundamentals to suspension geometry. Learn from enthusiasts, not marketers.</p>
                  </td>
                </tr>
              </table>
              
              <!-- 6. Meet AL -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td width="50" valign="top" class="mobile-icon">
                     <img src="${SITE_URL}/images/al-mascot.png" alt="AL" width="40" height="40" style="display: block; width: 40px; height: 40px; border-radius: 10px; background-color: #f3f4f6;">
                  </td>
                  <td class="mobile-stack" style="padding-left: 16px;">
                    <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">Meet AL</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #6b7280;">Your AI car expert with access to our entire database. Ask anything—specs, reliability issues, best mods, events near you. AL knows.</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" target="_blank" style="display: inline-block; background-color: #111827; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px; border: 1px solid #111827;">
                      Start Exploring →
                    </a>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f9fafb; padding: 32px 24px; border-top: 1px solid #f3f4f6; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${year} AutoRev · <a href="${SITE_URL}/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy</a> · <a href="${SITE_URL}/terms" style="color: #9ca3af; text-decoration: underline;">Terms</a>
              </p>
            </td>
          </tr>
          
        </table>
        
        <!-- Bottom Spacer -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td height="60" style="line-height: 60px; font-size: 1px;">&nbsp;</td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>`;
}

async function sendWelcomeEmail(to) {
  console.log(`\nPreparing welcome email for ${to}...`);
  
  // Fetch user's name and car count from database
  const [userName, carCount] = await Promise.all([
    getUserNameByEmail(to),
    getCarCount()
  ]);
  
  const html = getWelcomeEmailHtml({
    user_name: userName || 'there',
    login_url: SITE_URL,
    car_count: carCount,
  });

  console.log(`  Sending email...`);

  const { data, error } = await resend.emails.send({
    from: 'AutoRev <hello@autorev.app>',
    to: [to],
    replyTo: 'support@autorev.app',
    subject: 'Welcome to AutoRev — Find What Drives You',
    html,
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

for (const email of emails) {
  await sendWelcomeEmail(email);
}

console.log('\n✨ All done!');

