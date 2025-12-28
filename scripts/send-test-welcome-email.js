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
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
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
    body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    
    @media screen and (max-width: 600px) {
      .wrapper { padding: 24px 16px !important; }
      .content { padding: 0 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    You've just joined a community that celebrates every enthusiast. No flex culture. No gatekeeping.
  </div>
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff;">
    <tr>
      <td align="center" class="wrapper" style="padding: 48px 24px;">
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px;">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <img src="${SITE_URL}/images/autorev-logo-colored.png" alt="AutoRev" width="72" height="72" style="display: block;">
            </td>
          </tr>
          
          <!-- Welcome Header -->
          <tr>
            <td align="center" style="padding-bottom: 8px;">
              <p style="margin: 0; font-size: 13px; font-weight: 500; letter-spacing: 1.5px; color: #6b7280; text-transform: uppercase;">Welcome to AutoRev</p>
            </td>
          </tr>
          
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #111827;">Hey ${userName} 👋</h1>
            </td>
          </tr>
          
          <!-- Intro -->
          <tr>
            <td style="padding-bottom: 24px;">
              <p style="margin: 0; font-size: 16px; line-height: 26px; color: #374151;">
                You've just joined a community that celebrates every enthusiast—from the weekend warrior with a $3K Miata to the collector with a GT3RS.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding-bottom: 40px;">
              <p style="margin: 0; font-size: 16px; line-height: 26px; color: #374151;">
                <strong style="color: #b8860b;">No flex culture. No gatekeeping.</strong><br>
                Just honest guidance and genuine community.
              </p>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding-bottom: 40px;">
              <div style="height: 1px; background-color: #e5e7eb;"></div>
            </td>
          </tr>
          
          <!-- Section Header -->
          <tr>
            <td style="padding-bottom: 24px;">
              <p style="margin: 0; font-size: 13px; font-weight: 600; letter-spacing: 1px; color: #6b7280; text-transform: uppercase;">Here's what you can do</p>
            </td>
          </tr>
          
          <!-- Feature 1: Research -->
          <tr>
            <td style="padding-bottom: 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td width="48" valign="top">
                    <div style="width: 40px; height: 40px; background-color: #fef3c7; border-radius: 10px; text-align: center; line-height: 40px; font-size: 18px;">🔍</div>
                  </td>
                  <td style="padding-left: 16px;">
                    <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">Research</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 21px; color: #6b7280;">Deep-dive into 98 sports cars with real specs, owner insights, and honest reviews.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Feature 2: My Garage -->
          <tr>
            <td style="padding-bottom: 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td width="48" valign="top">
                    <div style="width: 40px; height: 40px; background-color: #fee2e2; border-radius: 10px; text-align: center; line-height: 40px; font-size: 18px;">🚗</div>
                  </td>
                  <td style="padding-left: 16px;">
                    <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">My Garage</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 21px; color: #6b7280;">Track your rides, decode VINs, get recall alerts, and log service history.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Feature 3: Plan Builds -->
          <tr>
            <td style="padding-bottom: 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td width="48" valign="top">
                    <div style="width: 40px; height: 40px; background-color: #dbeafe; border-radius: 10px; text-align: center; line-height: 40px; font-size: 18px;">🔧</div>
                  </td>
                  <td style="padding-left: 16px;">
                    <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">Plan Builds</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 21px; color: #6b7280;">Visualize power gains, explore parts, and see real dyno data before you wrench.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Feature 4: Meet AL -->
          <tr>
            <td style="padding-bottom: 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td width="48" valign="top">
                    <div style="width: 40px; height: 40px; background-color: #ede9fe; border-radius: 10px; text-align: center; line-height: 40px; font-size: 18px;">✨</div>
                  </td>
                  <td style="padding-left: 16px;">
                    <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">Meet AL</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 21px; color: #6b7280;">Your AI car expert. Get instant answers about specs, common issues, and the best mods.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding-bottom: 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius: 8px; background-color: #111827;">
                    <a href="${loginUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none;">
                      Start Exploring →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding-bottom: 32px;">
              <div style="height: 1px; background-color: #e5e7eb;"></div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
                Questions? Just reply to this email.
              </p>
              <p style="margin: 0; font-size: 13px; color: #9ca3af;">
                © ${year} AutoRev · <a href="${SITE_URL}/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy</a> · <a href="${SITE_URL}/terms" style="color: #9ca3af; text-decoration: underline;">Terms</a>
              </p>
            </td>
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
  
  // Fetch user's name from database
  const userName = await getUserNameByEmail(to);
  
  const html = getWelcomeEmailHtml({
    user_name: userName || 'there',
    login_url: SITE_URL,
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

