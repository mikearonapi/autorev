/**
 * Email Service for AutoRev
 *
 * Uses Resend for email delivery with database logging.
 * Respects user opt-in preferences and handles templating.
 *
 * Environment Variables:
 * - RESEND_API_KEY: Your Resend API key
 * - NEXT_PUBLIC_SITE_URL: Site URL for links in emails
 */

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

import { generateUnsubscribeToken } from './unsubscribeToken.js';

// Initialize Resend client
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Initialize Supabase admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Email configuration
const EMAIL_CONFIG = {
  from: {
    default: 'AutoRev <hello@autorev.app>',
    noreply: 'AutoRev <noreply@autorev.app>',
    support: 'AutoRev Support <support@autorev.app>',
  },
  replyTo: 'support@autorev.app',
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://autorev.app',
  // Stop sending to users with this many bounces
  maxBounceCount: 3,
};

/**
 * Email template definitions with React-style rendering
 *
 * SINGLE SOURCE OF TRUTH for all email templates.
 * All email sending (admin, scripts, automation) should use these templates.
 *
 * Brand Guidelines:
 * - Primary: #0d1b2a (dark navy)
 * - Accent/Teal: #10b981 (positive/success)
 * - Light theme background: #f3f4f6
 * - Card background: #ffffff
 * - Font: System fonts (Arial, -apple-system, etc.)
 * - Tone: Brotherhood over gatekeeping, excellence over ego
 */

/**
 * Generate the welcome email HTML template
 * Exported for use by preview routes and scripts
 */
export function generateWelcomeEmailHtml(vars, baseUrl) {
  // Extract first name only (handles "Cory Hughes" → "Cory")
  const rawName = vars.user_name || 'there';
  const userName = rawName.split(' ')[0];
  const loginUrl = vars.login_url || baseUrl;
  const year = new Date().getFullYear();
  const _carCount = vars.car_count || 300; // Reserved for future use

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
      .hero-image { width: 100% !important; max-width: 100% !important; }
      .screenshot { width: 100% !important; max-width: 100% !important; }
      .screenshot-cell { display: block !important; width: 100% !important; padding: 8px 0 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    Welcome to the community, ${userName}. Find what drives you.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  
  <!-- Outer Background -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" class="wrapper" style="padding: 40px 20px;">
        
        <!-- Main Card Container -->
        <table role="presentation" class="container" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 40px 0 32px 0; border-bottom: 1px solid #f3f4f6;">
              <div style="width: 60px; height: 60px; background-color: #0d1b2a; border-radius: 50%; margin: 0 auto 16px auto; overflow: hidden;"><img src="${baseUrl}/images/autorev-logo-transparent.png" alt="AutoRev" width="60" height="60" style="display: block;"></div>
              <p style="margin: 0; font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #1f2937; text-transform: uppercase;">Welcome to AutoRev</p>
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td class="content" style="padding: 32px 40px 40px 40px;">
              
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
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ecfdf5; border-radius: 8px; border: 1px solid #6ee7b7;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; font-size: 15px; line-height: 24px; color: #065f46; text-align: center; font-weight: 500;">
                      No flex culture. No gatekeeping. Just honest guidance and genuine community.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Divider -->
              <div style="height: 1px; background-color: #e5e7eb; margin: 32px 0;"></div>
              
              <!-- Features Intro -->
              <p style="margin: 0 0 20px 0; font-size: 13px; font-weight: 700; letter-spacing: 1px; color: #9ca3af; text-transform: uppercase;">
                Here's what you can do
              </p>
              
              <!-- Screenshot: Garage -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">Your Garage</p>
                    <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 22px; color: #6b7280;">Your ride's command center. View specs, plan your build with curated parts, and document your install photos.</p>
                    <img src="https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/site-design-v2/garage-audi-rs5-hero.webp" alt="Your Garage" class="screenshot" width="520" style="display: block; width: 100%; max-width: 520px; height: auto; border-radius: 12px; border: 1px solid #e5e7eb;">
                  </td>
                </tr>
              </table>
              
              <!-- Screenshot Row: Data -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td class="screenshot-cell" width="48%" valign="top" style="padding-right: 8px;">
                    <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">Virtual Dyno</p>
                    <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 22px; color: #6b7280;">See your estimated HP and torque curves based on your mods.</p>
                    <img src="https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/site-design-v2/data-virtual-dyno-chart.webp" alt="Virtual Dyno" class="screenshot" width="244" style="display: block; width: 100%; max-width: 244px; height: auto; border-radius: 12px; border: 1px solid #e5e7eb;">
                  </td>
                  <td class="screenshot-cell" width="48%" valign="top" style="padding-left: 8px;">
                    <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">Lap Time Estimator</p>
                    <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 22px; color: #6b7280;">Predict your lap times at popular tracks based on your build.</p>
                    <img src="https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/site-design-v2/data-track-lap-time-estimator.webp" alt="Lap Time Estimator" class="screenshot" width="244" style="display: block; width: 100%; max-width: 244px; height: auto; border-radius: 12px; border: 1px solid #e5e7eb;">
                  </td>
                </tr>
              </table>
              
              <!-- Screenshot: Build -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">Plan Your Build</p>
                    <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 22px; color: #6b7280;">Curated upgrade paths for track, street, or daily driving. See what each mod delivers—power gains, real-world feel, and compatibility.</p>
                    <img src="https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/site-design-v2/build-categories-overview.webp" alt="Plan Your Build" class="screenshot" width="520" style="display: block; width: 100%; max-width: 520px; height: auto; border-radius: 12px; border: 1px solid #e5e7eb;">
                  </td>
                </tr>
              </table>
              
              <!-- Screenshot Row: Community -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td class="screenshot-cell" width="48%" valign="top" style="padding-right: 8px;">
                    <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">Community Builds</p>
                    <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 22px; color: #6b7280;">Get inspiration from real builds. Share your progress.</p>
                    <img src="https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/site-design-v2/community-builds-evo-x-track.webp" alt="Community Builds" class="screenshot" width="244" style="display: block; width: 100%; max-width: 244px; height: auto; border-radius: 12px; border: 1px solid #e5e7eb;">
                  </td>
                  <td class="screenshot-cell" width="48%" valign="top" style="padding-left: 8px;">
                    <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">Events</p>
                    <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 22px; color: #6b7280;">Find Cars & Coffee, track days, and meetups near you.</p>
                    <img src="https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/site-design-v2/community-events-calendar.webp" alt="Events Calendar" class="screenshot" width="244" style="display: block; width: 100%; max-width: 244px; height: auto; border-radius: 12px; border: 1px solid #e5e7eb;">
                  </td>
                </tr>
              </table>
              
              <!-- Screenshot: AL -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">Ask AL Anything</p>
                    <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 22px; color: #6b7280;">Your AI car expert. No more forum searching—AL knows your car, your mods, and your goals. Get instant, honest answers.</p>
                    <img src="https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/site-design-v2/al-chat-response.webp" alt="Ask AL" class="screenshot" width="520" style="display: block; width: 100%; max-width: 520px; height: auto; border-radius: 12px; border: 1px solid #e5e7eb;">
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" target="_blank" style="display: inline-block; background-color: #d4ff00; color: #0a1628; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.02em; white-space: nowrap;">
                      Start Exploring
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Social Links -->
              <div style="margin-top: 32px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 24px;">
                <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #374151;">Join the AutoRev community</p>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">
                  <a href="https://instagram.com/autorev.app" target="_blank" style="color: #3b82f6; text-decoration: none; font-weight: 500;">Instagram</a>
                  <span style="color: #d1d5db; margin: 0 8px;">·</span>
                  <a href="https://facebook.com/autorev.app" target="_blank" style="color: #3b82f6; text-decoration: none; font-weight: 500;">Facebook</a>
                </p>
              </div>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f9fafb; padding: 24px 24px; border-top: 1px solid #f3f4f6; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${year} AutoRev · <a href="${baseUrl}/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy</a> · <a href="${baseUrl}/terms" style="color: #9ca3af; text-decoration: underline;">Terms</a>
              </p>
            </td>
          </tr>
          
        </table>
        
        <!-- Bottom Spacer -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td height="40" style="line-height: 40px; font-size: 1px;">&nbsp;</td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>`;
}

/**
 * Generate the welcome email plain text template
 */
export function generateWelcomeEmailText(vars, baseUrl) {
  // Extract first name only (handles "Cory Hughes" → "Cory")
  const rawName = vars.user_name || 'there';
  const userName = rawName.split(' ')[0];
  const loginUrl = vars.login_url || baseUrl;
  const year = new Date().getFullYear();
  const _carCount = vars.car_count || 300; // Reserved for future use

  return `AUTOREV — Find What Drives You
================================

Hey ${userName}! 👋

Welcome to AutoRev—where we lift up the driver with the $3K Miata the same as the one with the $300K GT3RS.

We built this for enthusiasts who want real data, honest guidance, and a community that celebrates the passion—not the price tag.

No flex culture. No gatekeeping. Just honest guidance and genuine community.

---

HERE'S WHAT YOU CAN DO:

YOUR GARAGE
Your ride's command center. View specs, plan your build with curated parts, and document your install photos.

VIRTUAL DYNO
See your estimated HP and torque curves based on your mods.

LAP TIME ESTIMATOR
Predict your lap times at popular tracks based on your build.

PLAN YOUR BUILD
Curated upgrade paths for track, street, or daily driving. See what each mod delivers—power gains, real-world feel, and compatibility.

COMMUNITY BUILDS
Get inspiration from real builds. Share your progress.

EVENTS
Find Cars & Coffee, track days, and meetups near you.

ASK AL ANYTHING
Your AI car expert. No more forum searching—AL knows your car, your mods, and your goals. Get instant, honest answers.

---

Start exploring: ${loginUrl}

© ${year} AutoRev · Built for enthusiasts, by enthusiasts`;
}

/**
 * Generate the email confirmation HTML template
 * Used by Supabase Auth Hook to send branded confirmation emails
 */
export function generateConfirmationEmailHtml(vars, baseUrl) {
  const rawName = vars.user_name || 'there';
  const userName = rawName.split(' ')[0];
  const confirmationUrl = vars.confirmation_url;
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Confirm Your Email - AutoRev</title>
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
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f3f4f6; }
    @media screen and (max-width: 600px) {
      .wrapper { padding: 12px !important; }
      .container { width: 100% !important; max-width: 100% !important; }
      .content { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    One click to confirm your email and join the AutoRev community.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" class="wrapper" style="padding: 40px 20px;">
        
        <!-- Main Card -->
        <table role="presentation" class="container" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 40px 0 32px 0; border-bottom: 1px solid #f3f4f6;">
              <div style="width: 60px; height: 60px; background-color: #0d1b2a; border-radius: 50%; margin: 0 auto 16px auto; overflow: hidden;"><img src="${baseUrl}/images/autorev-logo-transparent.png" alt="AutoRev" width="60" height="60" style="display: block;"></div>
              <p style="margin: 0; font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #1f2937; text-transform: uppercase;">Confirm Your Email</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="content" style="padding: 32px 40px 40px 40px;">
              
              <p style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1f2937; text-align: left;">
                Hey ${userName} 👋
              </p>
              
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                Thanks for signing up for AutoRev! Just one quick step—confirm your email address to unlock your account.
              </p>
              
              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                Click the button below to verify and start exploring detailed specs, reliability data, and a community that celebrates the passion—not the price tag.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${confirmationUrl}" target="_blank" style="display: inline-block; background-color: #d4ff00; color: #0a1628; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.02em; white-space: nowrap;">
                      Confirm My Email
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Fallback Link -->
              <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 20px; color: #9ca3af; text-align: center;">
                Button not working? Copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px; line-height: 18px; color: #6b7280; text-align: center; word-break: break-all;">
                ${confirmationUrl}
              </p>
              
              <!-- Security Note -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px; background-color: #f8fafc; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; font-size: 13px; line-height: 20px; color: #6b7280; text-align: center;">
                      🔒 This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f9fafb; padding: 24px 24px; border-top: 1px solid #f3f4f6; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${year} AutoRev · <a href="${baseUrl}/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy</a> · <a href="${baseUrl}/terms" style="color: #9ca3af; text-decoration: underline;">Terms</a>
              </p>
            </td>
          </tr>
          
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td height="40" style="line-height: 40px; font-size: 1px;">&nbsp;</td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>`;
}

/**
 * Generate the email confirmation plain text template
 */
export function generateConfirmationEmailText(vars, baseUrl) {
  const rawName = vars.user_name || 'there';
  const userName = rawName.split(' ')[0];
  const confirmationUrl = vars.confirmation_url;
  const year = new Date().getFullYear();

  return `AUTOREV — Confirm Your Email
================================

Hey ${userName}! 👋

Thanks for signing up for AutoRev! Just one quick step—confirm your email address to unlock your account.

Click the link below to verify and start exploring detailed specs, reliability data, and a community that celebrates the passion—not the price tag.

→ CONFIRM YOUR EMAIL: ${confirmationUrl}

---

🔒 This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.

© ${year} AutoRev · Privacy: ${baseUrl}/privacy · Terms: ${baseUrl}/terms`;
}

/**
 * Generate password recovery email HTML template
 */
export function generateRecoveryEmailHtml(vars, baseUrl) {
  const rawName = vars.user_name || 'there';
  const userName = rawName.split(' ')[0];
  const recoveryUrl = vars.recovery_url;
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Reset Your Password - AutoRev</title>
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
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f3f4f6; }
    @media screen and (max-width: 600px) {
      .wrapper { padding: 12px !important; }
      .container { width: 100% !important; max-width: 100% !important; }
      .content { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    Reset your AutoRev password. This link expires in 24 hours.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" class="wrapper" style="padding: 40px 20px;">
        
        <!-- Main Card -->
        <table role="presentation" class="container" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 40px 0 32px 0; border-bottom: 1px solid #f3f4f6;">
              <div style="width: 60px; height: 60px; background-color: #0d1b2a; border-radius: 50%; margin: 0 auto 16px auto; overflow: hidden;"><img src="${baseUrl}/images/autorev-logo-transparent.png" alt="AutoRev" width="60" height="60" style="display: block;"></div>
              <p style="margin: 0; font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #1f2937; text-transform: uppercase;">Password Reset</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="content" style="padding: 32px 40px 40px 40px;">
              
              <p style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1f2937; text-align: left;">
                Hey ${userName} 👋
              </p>
              
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                We received a request to reset your AutoRev password. Click the button below to create a new password.
              </p>
              
              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                If you didn't request this, you can safely ignore this email—your password will remain unchanged.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${recoveryUrl}" target="_blank" style="display: inline-block; background-color: #d4ff00; color: #0a1628; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.02em; white-space: nowrap;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Fallback Link -->
              <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 20px; color: #9ca3af; text-align: center;">
                Button not working? Copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px; line-height: 18px; color: #6b7280; text-align: center; word-break: break-all;">
                ${recoveryUrl}
              </p>
              
              <!-- Security Note -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px; background-color: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; font-size: 13px; line-height: 20px; color: #92400e; text-align: center;">
                      ⚠️ This link expires in 24 hours. Never share this link with anyone.
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f9fafb; padding: 24px 24px; border-top: 1px solid #f3f4f6; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${year} AutoRev · <a href="${baseUrl}/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy</a> · <a href="${baseUrl}/terms" style="color: #9ca3af; text-decoration: underline;">Terms</a>
              </p>
            </td>
          </tr>
          
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td height="40" style="line-height: 40px; font-size: 1px;">&nbsp;</td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>`;
}

/**
 * Generate password recovery plain text template
 */
export function generateRecoveryEmailText(vars, baseUrl) {
  const rawName = vars.user_name || 'there';
  const userName = rawName.split(' ')[0];
  const recoveryUrl = vars.recovery_url;
  const year = new Date().getFullYear();

  return `AUTOREV — Reset Your Password
================================

Hey ${userName} 👋

We received a request to reset your AutoRev password. Click the link below to create a new password.

→ RESET PASSWORD: ${recoveryUrl}

If you didn't request this, you can safely ignore this email—your password will remain unchanged.

---

⚠️ This link expires in 24 hours. Never share this link with anyone.

© ${year} AutoRev · Privacy: ${baseUrl}/privacy · Terms: ${baseUrl}/terms`;
}

/**
 * Generate magic link email HTML template
 */
export function generateMagicLinkEmailHtml(vars, baseUrl) {
  const rawName = vars.user_name || 'there';
  const userName = rawName.split(' ')[0];
  const magicLinkUrl = vars.magic_link_url;
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Your Login Link - AutoRev</title>
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
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f3f4f6; }
    @media screen and (max-width: 600px) {
      .wrapper { padding: 12px !important; }
      .container { width: 100% !important; max-width: 100% !important; }
      .content { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    Your one-click login link for AutoRev. Expires in 1 hour.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" class="wrapper" style="padding: 40px 20px;">
        
        <!-- Main Card -->
        <table role="presentation" class="container" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 40px 0 32px 0; border-bottom: 1px solid #f3f4f6;">
              <div style="width: 60px; height: 60px; background-color: #0d1b2a; border-radius: 50%; margin: 0 auto 16px auto; overflow: hidden;"><img src="${baseUrl}/images/autorev-logo-transparent.png" alt="AutoRev" width="60" height="60" style="display: block;"></div>
              <p style="margin: 0; font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #1f2937; text-transform: uppercase;">Your Login Link</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="content" style="padding: 32px 40px 40px 40px;">
              
              <p style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1f2937; text-align: left;">
                Hey ${userName} 👋
              </p>
              
              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                Here's your magic login link. Click the button below to sign in instantly—no password needed.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${magicLinkUrl}" target="_blank" style="display: inline-block; background-color: #d4ff00; color: #0a1628; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.02em; white-space: nowrap;">
                      Log In to AutoRev
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Fallback Link -->
              <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 20px; color: #9ca3af; text-align: center;">
                Button not working? Copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px; line-height: 18px; color: #6b7280; text-align: center; word-break: break-all;">
                ${magicLinkUrl}
              </p>
              
              <!-- Security Note -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px; background-color: #f8fafc; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; font-size: 13px; line-height: 20px; color: #6b7280; text-align: center;">
                      🔒 This link expires in 1 hour and can only be used once. If you didn't request this, you can safely ignore it.
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f9fafb; padding: 24px 24px; border-top: 1px solid #f3f4f6; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${year} AutoRev · <a href="${baseUrl}/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy</a> · <a href="${baseUrl}/terms" style="color: #9ca3af; text-decoration: underline;">Terms</a>
              </p>
            </td>
          </tr>
          
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td height="40" style="line-height: 40px; font-size: 1px;">&nbsp;</td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>`;
}

/**
 * Generate magic link plain text template
 */
export function generateMagicLinkEmailText(vars, baseUrl) {
  const rawName = vars.user_name || 'there';
  const userName = rawName.split(' ')[0];
  const magicLinkUrl = vars.magic_link_url;
  const year = new Date().getFullYear();

  return `AUTOREV — Your Login Link
================================

Hey ${userName}! 👋

Here's your magic login link. Click below to sign in instantly—no password needed.

→ LOG IN: ${magicLinkUrl}

---

🔒 This link expires in 1 hour and can only be used once. If you didn't request this, you can safely ignore it.

© ${year} AutoRev · Privacy: ${baseUrl}/privacy · Terms: ${baseUrl}/terms`;
}

const EMAIL_TEMPLATES = {
  welcome: {
    subject: 'Welcome to AutoRev — Find What Drives You',
    render: (vars) => ({
      html: generateWelcomeEmailHtml(vars, vars.imageBaseUrl || EMAIL_CONFIG.baseUrl),
      text: generateWelcomeEmailText(vars, vars.imageBaseUrl || EMAIL_CONFIG.baseUrl),
    }),
  },

  confirmation: {
    subject: 'Confirm Your Email — AutoRev',
    render: (vars) => ({
      html: generateConfirmationEmailHtml(vars, vars.imageBaseUrl || EMAIL_CONFIG.baseUrl),
      text: generateConfirmationEmailText(vars, vars.imageBaseUrl || EMAIL_CONFIG.baseUrl),
    }),
  },

  recovery: {
    subject: 'Reset Your Password — AutoRev',
    render: (vars) => ({
      html: generateRecoveryEmailHtml(vars, vars.imageBaseUrl || EMAIL_CONFIG.baseUrl),
      text: generateRecoveryEmailText(vars, vars.imageBaseUrl || EMAIL_CONFIG.baseUrl),
    }),
  },

  'magic-link': {
    subject: 'Your Login Link — AutoRev',
    render: (vars) => ({
      html: generateMagicLinkEmailHtml(vars, vars.imageBaseUrl || EMAIL_CONFIG.baseUrl),
      text: generateMagicLinkEmailText(vars, vars.imageBaseUrl || EMAIL_CONFIG.baseUrl),
    }),
  },

  'inactivity-7d': {
    subject: 'Quick question for you',
    render: (vars) => {
      // Extract first name only (handles "Cory Hughes" → "Cory")
      const rawName = vars.user_name || 'there';
      const userName = rawName.split(' ')[0];
      const _loginUrl = vars.login_url || EMAIL_CONFIG.baseUrl;
      const alUrl = `${EMAIL_CONFIG.baseUrl}/al`;
      const year = new Date().getFullYear();
      const carCount = vars.car_count || 300;

      return {
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Quick question</title>
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
      .hero-image { width: 100% !important; max-width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    Still deciding? Ask AL anything—no judgment, just real answers.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  
  <!-- Outer Background -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" class="wrapper" style="padding: 40px 20px;">
        
        <!-- Main Card Container -->
        <table role="presentation" class="container" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 40px 0 32px 0; border-bottom: 1px solid #f3f4f6;">
              <div style="width: 60px; height: 60px; background-color: #0d1b2a; border-radius: 50%; margin: 0 auto; overflow: hidden;"><img src="${EMAIL_CONFIG.baseUrl}/images/autorev-logo-transparent.png" alt="AutoRev" width="60" height="60" style="display: block;"></div>
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td class="content" style="padding: 32px 40px 40px 40px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 20px 0; font-size: 24px; font-weight: 700; color: #1f2937; text-align: left;">
                Hey ${userName} 👋
              </p>
              
              <!-- The Hook -->
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                Still thinking about your next car? Or maybe you're stuck on a mod decision?
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                Here's the thing—most car forums will roast you for asking "dumb" questions. We built AutoRev specifically so you don't have to deal with that.
              </p>
              
              <!-- AL Feature Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td width="60" valign="top">
                          <img src="${EMAIL_CONFIG.baseUrl}/images/al-mascot.png" alt="AL" width="48" height="48" style="display: block; width: 48px; height: 48px; border-radius: 12px;">
                        </td>
                        <td style="padding-left: 16px;">
                          <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #111827;">Ask AL anything</h3>
                          <p style="margin: 0 0 12px 0; font-size: 15px; line-height: 24px; color: #4b5563;">
                            "What wheel fitment can I run without rubbing?"<br>
                            "If I upgrade my fuel pump, do I need a tune?"<br>
                            "What's the best mod order for a $5K budget?"
                          </p>
                          <p style="margin: 0; font-size: 14px; color: #6b7280; font-style: italic;">
                            Real data. Honest answers. Zero judgment.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${alUrl}" target="_blank" style="display: inline-block; background-color: #d4ff00; color: #0a1628; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.02em; white-space: nowrap;">
                      Ask AL a Question →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Soft secondary options -->
              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 22px; color: #9ca3af; text-align: center;">
                Or <a href="${EMAIL_CONFIG.baseUrl}/events" style="color: #3b82f6; text-decoration: underline;">find a Cars & Coffee near you</a> · <a href="${EMAIL_CONFIG.baseUrl}/browse-cars" style="color: #3b82f6; text-decoration: underline;">explore ${carCount}+ cars</a>
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f9fafb; padding: 24px 24px; border-top: 1px solid #f3f4f6; border-radius: 0 0 16px 16px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af;">
                © ${year} AutoRev · <a href="${EMAIL_CONFIG.baseUrl}/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy</a> · <a href="${EMAIL_CONFIG.baseUrl}/terms" style="color: #9ca3af; text-decoration: underline;">Terms</a>
              </p>
              <a href="${EMAIL_CONFIG.baseUrl}/unsubscribe?token=${generateUnsubscribeToken(vars.email || '')}" style="font-size: 11px; color: #9ca3af; text-decoration: underline;">
                Unsubscribe from these emails
              </a>
            </td>
          </tr>
          
        </table>
        
        <!-- Bottom Spacer -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td height="40" style="line-height: 40px; font-size: 1px;">&nbsp;</td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>`,
        text: `Hey ${userName} 👋

Still thinking about your next car? Or maybe you're stuck on a mod decision?

Here's the thing—most car forums will roast you for asking "dumb" questions. We built AutoRev specifically so you don't have to deal with that.

---

ASK AL ANYTHING

"What wheel fitment can I run without rubbing?"
"If I upgrade my fuel pump, do I need a tune?"
"What's the best mod order for a $5K budget?"

Real data. Honest answers. Zero judgment.

→ Ask AL: ${alUrl}

---

Or find a Cars & Coffee near you: ${EMAIL_CONFIG.baseUrl}/events
Or explore ${carCount}+ cars: ${EMAIL_CONFIG.baseUrl}/browse-cars

© ${year} AutoRev

Unsubscribe: ${EMAIL_CONFIG.baseUrl}/unsubscribe?token=${generateUnsubscribeToken(vars.email || '')}`,
      };
    },
  },

  'inactivity-21d': {
    subject: 'Builds that might inspire your next project',
    render: (vars) => {
      // Extract first name only
      const rawName = vars.user_name || 'there';
      const userName = rawName.split(' ')[0];
      const communityUrl = `${EMAIL_CONFIG.baseUrl}/community/builds`;
      const garageUrl = `${EMAIL_CONFIG.baseUrl}/garage`;
      const year = new Date().getFullYear();

      // Screenshot URL from Vercel Blob CDN
      const communityScreenshot =
        'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/site-design-v2/community-builds-evo-x-track.webp';

      return {
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Community Builds</title>
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
      .screenshot { width: 100% !important; max-width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    Real enthusiasts sharing real builds. See what the community is working on.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  
  <!-- Outer Background -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" class="wrapper" style="padding: 40px 20px;">
        
        <!-- Main Card Container -->
        <table role="presentation" class="container" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 40px 0 32px 0; border-bottom: 1px solid #f3f4f6;">
              <div style="width: 60px; height: 60px; background-color: #0d1b2a; border-radius: 50%; margin: 0 auto; overflow: hidden;"><img src="${EMAIL_CONFIG.baseUrl}/images/autorev-logo-transparent.png" alt="AutoRev" width="60" height="60" style="display: block;"></div>
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td class="content" style="padding: 24px 40px 40px 40px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 20px 0; font-size: 24px; font-weight: 700; color: #1f2937; text-align: left;">
                Hey ${userName} 👋
              </p>
              
              <!-- The Hook -->
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                Sometimes the best way to figure out your next mod is to see what other people are doing.
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                We've been adding community builds to AutoRev—real enthusiasts sharing their setups, mods, and lessons learned. It's like browsing the best parts of car forums without the noise.
              </p>
              
              <!-- Screenshot -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <a href="${communityUrl}" target="_blank">
                      <img src="${communityScreenshot}" alt="Community Builds" class="screenshot" width="520" style="display: block; width: 100%; max-width: 520px; height: auto; border-radius: 12px; border: 1px solid #e5e7eb;">
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- What You'll Find Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 16px 0; font-size: 13px; font-weight: 700; letter-spacing: 1px; color: #9ca3af; text-transform: uppercase;">
                      What you'll find
                    </p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <span style="font-size: 15px; color: #4b5563;"><strong>Detailed mod lists</strong> — See exactly what parts people are running</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <span style="font-size: 15px; color: #4b5563;"><strong>Real power numbers</strong> — Dyno results and performance data</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <span style="font-size: 15px; color: #4b5563;"><strong>Build philosophy</strong> — Track builds, daily drivers, weekend warriors</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span style="font-size: 15px; color: #4b5563;"><strong>Inspiration</strong> — Ideas for your own project</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${communityUrl}" target="_blank" style="display: inline-block; background-color: #d4ff00; color: #0a1628; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.02em; white-space: nowrap;">
                      Browse Community Builds
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Soft secondary -->
              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 22px; color: #9ca3af; text-align: center;">
                Or <a href="${garageUrl}" style="color: #3b82f6; text-decoration: underline;">start documenting your own build</a>
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f9fafb; padding: 24px 24px; border-top: 1px solid #f3f4f6; border-radius: 0 0 16px 16px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af;">
                © ${year} AutoRev · <a href="${EMAIL_CONFIG.baseUrl}/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy</a> · <a href="${EMAIL_CONFIG.baseUrl}/terms" style="color: #9ca3af; text-decoration: underline;">Terms</a>
              </p>
              <a href="${EMAIL_CONFIG.baseUrl}/unsubscribe?token=${generateUnsubscribeToken(vars.email || '')}" style="font-size: 11px; color: #9ca3af; text-decoration: underline;">
                Unsubscribe from these emails
              </a>
            </td>
          </tr>
          
        </table>
        
        <!-- Bottom Spacer -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td height="40" style="line-height: 40px; font-size: 1px;">&nbsp;</td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>`,
        text: `Hey ${userName} 👋

Sometimes the best way to figure out your next mod is to see what other people are doing.

We've been adding community builds to AutoRev—real enthusiasts sharing their setups, mods, and lessons learned. It's like browsing the best parts of car forums without the noise.

---

WHAT YOU'LL FIND:

• Detailed mod lists — See exactly what parts people are running
• Real power numbers — Dyno results and performance data
• Build philosophy — Track builds, daily drivers, weekend warriors
• Inspiration — Ideas for your own project

---

→ Browse Community Builds: ${communityUrl}

Or start documenting your own build: ${garageUrl}

© ${year} AutoRev

Unsubscribe: ${EMAIL_CONFIG.baseUrl}/unsubscribe?token=${generateUnsubscribeToken(vars.email || '')}`,
      };
    },
  },

  'referral-reward': {
    subject: 'You earned ${vars?.credits_earned || 200} AL credits!',
    render: (vars) => ({
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>You earned AL credits!</title>
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
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f3f4f6; }
    @media screen and (max-width: 600px) {
      .wrapper { padding: 12px !important; }
      .container { width: 100% !important; max-width: 100% !important; }
      .content { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${vars.friend_name || 'Your friend'} joined AutoRev! +${vars.credits_earned || 200} credits added to your account.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" class="wrapper" style="padding: 40px 20px;">
        
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 40px 0 32px 0; border-bottom: 1px solid #f3f4f6;">
              <div style="width: 60px; height: 60px; background-color: #0d1b2a; border-radius: 50%; margin: 0 auto 16px auto; overflow: hidden;"><div style="width: 60px; height: 60px; background-color: #0d1b2a; border-radius: 50%; margin: 0 auto; overflow: hidden;"><img src="${EMAIL_CONFIG.baseUrl}/images/autorev-logo-transparent.png" alt="AutoRev" width="60" height="60" style="display: block;"></div></div>
              <p style="margin: 0; font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #1f2937; text-transform: uppercase;">Referral Reward</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content" style="padding: 40px; text-align: center;">
              <h2 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #1f2937;">
                ${vars.friend_name || 'Your friend'} joined AutoRev!
              </h2>
              
              <p style="margin: 0 0 28px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                Thanks for spreading the word. Brotherhood over gatekeeping, right?
              </p>

              <!-- Credits Badge -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                <tr>
                  <td style="padding: 24px; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; border: 1px solid #6ee7b7;">
                    <p style="margin: 0 0 4px; font-size: 12px; color: #065f46; text-transform: uppercase; letter-spacing: 1px;">
                      Credits Earned
                    </p>
                    <p style="margin: 0 0 16px; font-size: 42px; font-weight: 700; color: #10b981; line-height: 1;">
                      +${vars.credits_earned || 200}
                    </p>
                    <div style="height: 1px; background: #6ee7b7; margin: 0 0 16px;"></div>
                    <p style="margin: 0; font-size: 13px; color: #065f46;">
                      Total Balance: <strong style="color: #10b981;">${vars.total_credits || 200} credits</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px; font-size: 14px; color: #6b7280;">
                Use your credits to chat with AL, your AI car expert.
              </p>

              <a href="${EMAIL_CONFIG.baseUrl}/al" style="display: inline-block; padding: 12px 28px; background-color: #d4ff00; color: #0a1628; text-decoration: none; border-radius: 100px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.02em; white-space: nowrap;">
                Chat with AL
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background: #f9fafb; text-align: center; border-top: 1px solid #f3f4f6;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280;">
                Keep sharing—earn 200 credits for each friend who joins.
              </p>
              <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                © ${new Date().getFullYear()} AutoRev · Built for enthusiasts
              </p>
            </td>
          </tr>

        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>`,
      text: `REFERRAL REWARD!

${vars.friend_name || 'Your friend'} joined AutoRev!

Thanks for spreading the word. Brotherhood over gatekeeping, right?

CREDITS EARNED: +${vars.credits_earned || 200}
TOTAL BALANCE: ${vars.total_credits || 200} credits

Use your credits to chat with AL, your AI car expert.

Chat with AL: ${EMAIL_CONFIG.baseUrl}/al

---
Keep sharing—earn 200 credits for each friend who joins.

© ${new Date().getFullYear()} AutoRev · Built for enthusiasts`,
    }),
  },

  'feedback-response': {
    subject: 'Thanks for your feedback',
    render: (vars) => {
      // Extract first name only (handles "Cory Hughes" → "Cory")
      const rawName = vars.user_name || 'there';
      const userName = rawName.split(' ')[0];
      const year = new Date().getFullYear();
      const baseUrl = EMAIL_CONFIG.baseUrl;
      const garageUrl = `${baseUrl}/garage`;

      // Optional: quote their original feedback back to them
      const originalFeedback = vars.original_feedback || null;

      // Build original feedback quote if provided
      const feedbackQuoteHtml = originalFeedback
        ? `
              <!-- Original Feedback Quote -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 600; letter-spacing: 1px; color: #9ca3af; text-transform: uppercase;">
                      What you shared
                    </p>
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #4b5563; font-style: italic;">
                      "${originalFeedback}"
                    </p>
                  </td>
                </tr>
              </table>
              `
        : '';

      const feedbackQuoteText = originalFeedback
        ? `
WHAT YOU SHARED:
"${originalFeedback}"

---
`
        : '';

      return {
        html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Thanks for Your Feedback</title>
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
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f3f4f6; }
    @media screen and (max-width: 600px) {
      .wrapper { padding: 12px !important; }
      .container { width: 100% !important; max-width: 100% !important; }
      .content { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    We read every piece of feedback. Thank you for helping us improve.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" class="wrapper" style="padding: 40px 20px;">
        
        <!-- Main Card -->
        <table role="presentation" class="container" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 40px 0 32px 0; border-bottom: 1px solid #f3f4f6;">
              <div style="width: 60px; height: 60px; background-color: #0d1b2a; border-radius: 50%; margin: 0 auto 16px auto; overflow: hidden;"><img src="${baseUrl}/images/autorev-logo-transparent.png" alt="AutoRev" width="60" height="60" style="display: block;"></div>
              <p style="margin: 0; font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #1f2937; text-transform: uppercase;">Feedback Received</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="content" style="padding: 32px 40px 40px 40px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1f2937; text-align: left;">
                Hey ${userName} 👋
              </p>
              
              <!-- Headline -->
              <p style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111827; text-align: left;">
                We heard you.
              </p>
              
              <!-- Body Text -->
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                Thank you for taking the time to share your thoughts with us. We read every piece of feedback that comes in—it's how we make AutoRev better.
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                Your input has been logged and is being reviewed by our team. We can't always respond to every message individually, but know that your feedback directly shapes what we build next.
              </p>
              
              ${feedbackQuoteHtml}
              
              <!-- Thank You Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ecfdf5; border-radius: 8px; border: 1px solid #6ee7b7; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; font-size: 15px; line-height: 24px; color: #065f46; text-align: center; font-weight: 500;">
                      We're building this with you, not just for you. Thank you for being part of the AutoRev community.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${garageUrl}" target="_blank" style="display: inline-block; background-color: #d4ff00; color: #0a1628; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.02em; white-space: nowrap;">
                      Back to Your Garage
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Secondary -->
              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 22px; color: #9ca3af; text-align: center;">
                Have more to share? Just reply to this email—we read every one.
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f9fafb; padding: 24px 24px; border-top: 1px solid #f3f4f6; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${year} AutoRev · <a href="${baseUrl}/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy</a> · <a href="${baseUrl}/terms" style="color: #9ca3af; text-decoration: underline;">Terms</a>
              </p>
            </td>
          </tr>
          
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td height="40" style="line-height: 40px; font-size: 1px;">&nbsp;</td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>`,
        text: `AUTOREV — We Heard You!
================================

Hey ${userName} 👋

We heard you.

Thank you for taking the time to share your thoughts with us. We read every piece of feedback that comes in—it's how we make AutoRev better.

Your input has been logged and is being reviewed by our team. We can't always respond to every message individually, but know that your feedback directly shapes what we build next.
${feedbackQuoteText}
---

We're building this with you, not just for you. Thank you for being part of the AutoRev community.

Back to Your Garage: ${garageUrl}

---

Have more feedback? We'd love to hear it: ${baseUrl}/contact

© ${year} AutoRev · Built for enthusiasts, by enthusiasts`,
      };
    },
  },

  'referral-invite': {
    subject: '${vars?.referrer_name || "Your friend"} invited you to AutoRev',
    render: (vars) => {
      const year = new Date().getFullYear();
      const referrerName = vars.referrer_name || 'Your friend';
      const bonusCredits = vars.bonus_credits || 200;
      const referralLink = vars.referral_link || EMAIL_CONFIG.baseUrl;
      const _carCount = vars.car_count || 300; // Reserved for future use

      return {
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>You're invited to AutoRev</title>
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
      .hero-image { width: 100% !important; max-width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${referrerName} invited you to join AutoRev! Get ${bonusCredits} bonus AL credits when you sign up.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  
  <!-- Outer Background -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" class="wrapper" style="padding: 40px 20px;">
        
        <!-- Main Card Container -->
        <table role="presentation" class="container" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 40px 0 32px 0; border-bottom: 1px solid #f3f4f6;">
              <div style="width: 60px; height: 60px; background-color: #0d1b2a; border-radius: 50%; margin: 0 auto 16px auto; overflow: hidden;"><div style="width: 60px; height: 60px; background-color: #0d1b2a; border-radius: 50%; margin: 0 auto; overflow: hidden;"><img src="${EMAIL_CONFIG.baseUrl}/images/autorev-logo-transparent.png" alt="AutoRev" width="60" height="60" style="display: block;"></div></div>
              <p style="margin: 0; font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #1f2937; text-transform: uppercase;">You're Invited</p>
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td class="content" style="padding: 24px 40px 40px 40px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1f2937; text-align: left;">
                ${referrerName} thinks you'd love this
              </p>
              
              <!-- Intro Text -->
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                AutoRev is where car enthusiasts research, compare, and plan their builds—whether you're driving a $3K Miata or a $300K GT3RS.
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                Real data, honest guidance, and a community that celebrates the passion—not the price tag.
              </p>
              
              <!-- Welcome Bonus Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ecfdf5; border-radius: 8px; border: 1px solid #6ee7b7; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; letter-spacing: 1px; color: #065f46; text-transform: uppercase;">
                      Your Welcome Bonus
                    </p>
                    <p style="margin: 0 0 8px 0; font-size: 36px; font-weight: 700; color: #10b981; line-height: 1;">
                      +${bonusCredits} AL Credits
                    </p>
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #065f46;">
                      Use them to chat with AL, your AI car expert who actually knows cars.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Divider -->
              <div style="height: 1px; background-color: #e5e7eb; margin: 32px 0;"></div>
              
              <!-- Features Intro -->
              <p style="margin: 0 0 24px 0; font-size: 13px; font-weight: 700; letter-spacing: 1px; color: #9ca3af; text-transform: uppercase;">
                Here's what you'll get
              </p>
              
              <!-- Feature List -->
              
              <!-- 1. Garage -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td width="50" valign="top" class="mobile-icon">
                    <div style="width: 40px; height: 40px; background-color: #0d1b2a; border-radius: 10px; text-align: center; line-height: 40px; font-size: 16px; font-weight: 700; color: #d4ff00;">G</div>
                  </td>
                  <td class="mobile-stack" style="padding-left: 16px;">
                    <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">Garage</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #6b7280;">Your ride's home base. View specs, plan your build with curated parts, and document install photos.</p>
                  </td>
                </tr>
              </table>
              
              <!-- 2. Data -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td width="50" valign="top" class="mobile-icon">
                    <div style="width: 40px; height: 40px; background-color: #0d1b2a; border-radius: 10px; text-align: center; line-height: 40px; font-size: 16px; font-weight: 700; color: #d4ff00;">D</div>
                  </td>
                  <td class="mobile-stack" style="padding-left: 16px;">
                    <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">Data</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #6b7280;">Real dyno charts and track times from real enthusiasts. No guessing, just data.</p>
                  </td>
                </tr>
              </table>
              
              <!-- 3. Insights -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td width="50" valign="top" class="mobile-icon">
                    <div style="width: 40px; height: 40px; background-color: #0d1b2a; border-radius: 10px; text-align: center; line-height: 40px; font-size: 16px; font-weight: 700; color: #d4ff00;">I</div>
                  </td>
                  <td class="mobile-stack" style="padding-left: 16px;">
                    <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">Insights</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #6b7280;">Personalized recommendations for your car. Discover what mods make sense for your goals.</p>
                  </td>
                </tr>
              </table>
              
              <!-- 4. Community -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td width="50" valign="top" class="mobile-icon">
                    <div style="width: 40px; height: 40px; background-color: #0d1b2a; border-radius: 10px; text-align: center; line-height: 40px; font-size: 16px; font-weight: 700; color: #d4ff00;">C</div>
                  </td>
                  <td class="mobile-stack" style="padding-left: 16px;">
                    <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">Community</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #6b7280;">Browse community builds, find local events, and check the leaderboard.</p>
                  </td>
                </tr>
              </table>
              
              <!-- 5. Meet AL -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td width="50" valign="top" class="mobile-icon">
                     <img src="${EMAIL_CONFIG.baseUrl}/images/al-mascot.png" alt="AL" width="40" height="40" style="display: block; width: 40px; height: 40px; border-radius: 10px; background-color: #0d1b2a;">
                  </td>
                  <td class="mobile-stack" style="padding-left: 16px;">
                    <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">Meet AL</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #6b7280;">Your AI car expert. Ask anything—specs, reliability, best mods. Real answers, no gatekeeping.</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${referralLink}" target="_blank" style="display: inline-block; background-color: #d4ff00; color: #0a1628; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.02em; white-space: nowrap;">
                      Join AutoRev Free
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; font-size: 13px; color: #9ca3af; text-align: center;">
                Takes less than 30 seconds to sign up
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f9fafb; padding: 24px 24px; border-top: 1px solid #f3f4f6; border-radius: 0 0 16px 16px;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #4b5563;">
                <strong>${referrerName}</strong> thought you'd dig this. No pressure—just an invite to check it out.
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${year} AutoRev · <a href="${EMAIL_CONFIG.baseUrl}/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy</a> · <a href="${EMAIL_CONFIG.baseUrl}/terms" style="color: #9ca3af; text-decoration: underline;">Terms</a>
              </p>
            </td>
          </tr>
          
        </table>
        
        <!-- Bottom Spacer -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td height="40" style="line-height: 40px; font-size: 1px;">&nbsp;</td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>`,
        text: `AUTOREV — You're Invited!
================================

${referrerName} thinks you'd love this!

AutoRev is where car enthusiasts research, compare, and plan their builds—whether you're driving a $3K Miata or a $300K GT3RS.

Real data, honest guidance, and a community that celebrates the passion—not the price tag.

YOUR WELCOME BONUS: +${bonusCredits} AL Credits
Use them to chat with AL, your AI car expert who actually knows cars.

---

HERE'S WHAT YOU'LL GET:

GARAGE
Your ride's home base. View specs, plan your build with curated parts, and document install photos.

DATA
Real dyno charts and track times from real enthusiasts. No guessing, just data.

INSIGHTS
Personalized recommendations for your car. Discover what mods make sense for your goals.

COMMUNITY
Browse community builds, find local events, and check the leaderboard.

MEET AL
Your AI car expert. Ask anything—specs, reliability, best mods. Real answers, no gatekeeping.

---

👉 JOIN AUTOREV FREE: ${referralLink}
Takes less than 30 seconds to sign up.

---

${referrerName} thought you'd dig this. No pressure—just an invite to check it out.

© ${year} AutoRev · Privacy: ${EMAIL_CONFIG.baseUrl}/privacy · Terms: ${EMAIL_CONFIG.baseUrl}/terms

Join free: ${referralLink}

Takes less than 30 seconds to sign up.

---
${referrerName} thought you'd dig this. No pressure—just an invite to check it out.

© ${year} AutoRev · Built by enthusiasts, for enthusiasts`,
      };
    },
  },

  'product-update-jan2026': {
    subject: 'A quick update from the AutoRev team',
    render: (vars) => {
      const rawName = vars.user_name || 'there';
      const userName = rawName.split(' ')[0];
      const year = new Date().getFullYear();
      const baseUrl = EMAIL_CONFIG.baseUrl;

      // Screenshot URLs from Vercel Blob CDN
      const blobBase = 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/site-design-v2';
      const screenshots = {
        garage: `${blobBase}/garage-audi-rs5-hero.webp`,
        virtualDyno: `${blobBase}/data-virtual-dyno-chart.webp`,
        lapTime: `${blobBase}/data-track-lap-time-estimator.webp`,
        build: `${blobBase}/build-categories-overview.webp`,
        community: `${blobBase}/community-builds-evo-x-track.webp`,
        events: `${blobBase}/community-events-calendar.webp`,
        al: `${blobBase}/al-chat-response.webp`,
      };

      return {
        html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>A Quick Update from AutoRev</title>
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
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f3f4f6; }
    @media screen and (max-width: 600px) {
      .wrapper { padding: 12px !important; }
      .container { width: 100% !important; max-width: 100% !important; }
      .content { padding: 24px 20px !important; }
      .screenshot { width: 100% !important; max-width: 100% !important; }
      .screenshot-cell { display: block !important; width: 100% !important; padding: 8px 0 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Preheader -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    We've been busy. Here's what's new in AutoRev — and we'd love your feedback.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" class="wrapper" style="padding: 40px 20px;">
        
        <!-- Main Card -->
        <table role="presentation" class="container" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 40px 0 32px 0; border-bottom: 1px solid #f3f4f6;">
              <div style="width: 60px; height: 60px; background-color: #0d1b2a; border-radius: 50%; margin: 0 auto 16px auto; overflow: hidden;"><img src="${baseUrl}/images/autorev-logo-transparent.png" alt="AutoRev" width="60" height="60" style="display: block;"></div>
              <p style="margin: 0; font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #1f2937; text-transform: uppercase;">A Quick Update</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="content" style="padding: 32px 40px 40px 40px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 20px 0; font-size: 24px; font-weight: 700; color: #1f2937; text-align: left;">
                Hey ${userName} 👋
              </p>
              
              <!-- Thank You -->
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                First—<strong>thank you</strong> for signing up for AutoRev. We know you took a chance on us, and that means everything.
              </p>
              
              <!-- Honest Acknowledgment -->
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                We'll be real with you: the app hasn't been perfect. We've had bugs, rough edges, and features that needed work. We know that, and we've been heads-down for the past 30 days fixing it.
              </p>
              
              <!-- What We've Done -->
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                We've redesigned and refocused the entire app around what actually matters: <strong>helping you plan and track your build</strong>. Real data, real community, real answers—no fluff.
              </p>
              
              <!-- Beta Callout Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ecfdf5; border-radius: 8px; border: 1px solid #6ee7b7; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; font-size: 15px; line-height: 24px; color: #065f46; text-align: center;">
                      <strong>We're still in beta</strong> — and that's intentional. We'd rather ship, learn, and improve with you than hide in a corner until it's "perfect."
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Section Header -->
              <p style="margin: 0 0 20px 0; font-size: 13px; font-weight: 700; letter-spacing: 1px; color: #9ca3af; text-transform: uppercase;">
                If you haven't seen the app recently, here's what's new
              </p>
              
              <!-- Screenshot: Garage -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">Your Garage</p>
                    <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 22px; color: #6b7280;">Your ride's command center. View specs, track your build with curated parts, and document your install photos.</p>
                    <img src="${screenshots.garage}" alt="Your Garage" class="screenshot" width="520" style="display: block; width: 100%; max-width: 520px; height: auto; border-radius: 12px; border: 1px solid #e5e7eb;">
                  </td>
                </tr>
              </table>
              
              <!-- Screenshot Row: Data -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td class="screenshot-cell" width="48%" valign="top" style="padding-right: 8px;">
                    <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">Virtual Dyno</p>
                    <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 22px; color: #6b7280;">See your estimated HP and torque curves based on your mods.</p>
                    <img src="${screenshots.virtualDyno}" alt="Virtual Dyno" class="screenshot" width="244" style="display: block; width: 100%; max-width: 244px; height: auto; border-radius: 12px; border: 1px solid #e5e7eb;">
                  </td>
                  <td class="screenshot-cell" width="48%" valign="top" style="padding-left: 8px;">
                    <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">Lap Time Estimator</p>
                    <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 22px; color: #6b7280;">Predict your lap times at popular tracks based on your build.</p>
                    <img src="${screenshots.lapTime}" alt="Lap Time Estimator" class="screenshot" width="244" style="display: block; width: 100%; max-width: 244px; height: auto; border-radius: 12px; border: 1px solid #e5e7eb;">
                  </td>
                </tr>
              </table>
              
              <!-- Screenshot: Build -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">Plan Your Build</p>
                    <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 22px; color: #6b7280;">Curated upgrade paths for track, street, or daily driving. See exactly what each mod delivers—power gains, real-world feel, and compatibility.</p>
                    <img src="${screenshots.build}" alt="Plan Your Build" class="screenshot" width="520" style="display: block; width: 100%; max-width: 520px; height: auto; border-radius: 12px; border: 1px solid #e5e7eb;">
                  </td>
                </tr>
              </table>
              
              <!-- Screenshot Row: Community -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td class="screenshot-cell" width="48%" valign="top" style="padding-right: 8px;">
                    <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">Community Builds</p>
                    <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 22px; color: #6b7280;">Get inspiration from real builds. Share your progress.</p>
                    <img src="${screenshots.community}" alt="Community Builds" class="screenshot" width="244" style="display: block; width: 100%; max-width: 244px; height: auto; border-radius: 12px; border: 1px solid #e5e7eb;">
                  </td>
                  <td class="screenshot-cell" width="48%" valign="top" style="padding-left: 8px;">
                    <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">Events</p>
                    <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 22px; color: #6b7280;">Find Cars & Coffee, track days, and meetups near you.</p>
                    <img src="${screenshots.events}" alt="Events Calendar" class="screenshot" width="244" style="display: block; width: 100%; max-width: 244px; height: auto; border-radius: 12px; border: 1px solid #e5e7eb;">
                  </td>
                </tr>
              </table>
              
              <!-- Screenshot: AL -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">Ask AL Anything</p>
                    <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 22px; color: #6b7280;">Your AI car expert. No more forum searching—AL knows your car, your mods, and your goals. Get instant, honest answers.</p>
                    <img src="${screenshots.al}" alt="Ask AL" class="screenshot" width="520" style="display: block; width: 100%; max-width: 520px; height: auto; border-radius: 12px; border: 1px solid #e5e7eb;">
                  </td>
                </tr>
              </table>
              
              <!-- Divider -->
              <div style="height: 1px; background-color: #e5e7eb; margin: 32px 0;"></div>
              
              <!-- Feedback Request -->
              <p style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #111827; text-align: left;">
                We need your help
              </p>
              
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                We're building this <em>with</em> you, not just <em>for</em> you. Your patience as an early adopter means the world to us—and your feedback helps us make this better for everyone.
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                Bugs, feature ideas, things that annoyed you—we want to hear it all. No filter needed.
              </p>
              
              <!-- Feedback Instructions Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; letter-spacing: 1px; color: #9ca3af; text-transform: uppercase;">
                      How to Share Feedback
                    </p>
                    <p style="margin: 0; font-size: 15px; line-height: 24px; color: #4b5563;">
                      <strong>1.</strong> Open the app and go to your Garage<br>
                      <strong>2.</strong> Tap your profile picture in the top corner<br>
                      <strong>3.</strong> Hit the <strong>"Share Feedback"</strong> button
                    </p>
                    <p style="margin: 12px 0 0 0; font-size: 14px; color: #6b7280;">
                      (Or just reply to this email—we read every one.)
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${baseUrl}/garage" target="_blank" style="display: inline-block; background-color: #d4ff00; color: #0a1628; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.02em; white-space: nowrap;">
                      Open AutoRev
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Closing -->
              <p style="margin: 32px 0 0 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                Thanks for being part of this journey. We're just getting started.
              </p>
              
              <p style="margin: 16px 0 0 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                — The AutoRev Team
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f9fafb; padding: 24px 24px; border-top: 1px solid #f3f4f6; border-radius: 0 0 16px 16px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af;">
                © ${year} AutoRev · <a href="${baseUrl}/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy</a> · <a href="${baseUrl}/terms" style="color: #9ca3af; text-decoration: underline;">Terms</a>
              </p>
              <a href="${baseUrl}/unsubscribe?token=${generateUnsubscribeToken(vars.email || '')}" style="font-size: 11px; color: #9ca3af; text-decoration: underline;">
                Unsubscribe from these emails
              </a>
            </td>
          </tr>
          
        </table>
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td height="40" style="line-height: 40px; font-size: 1px;">&nbsp;</td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>`,
        text: `A QUICK UPDATE FROM AUTOREV
================================

Hey ${userName} 👋

First—thank you for signing up for AutoRev. We know you took a chance on us, and that means everything.

We'll be real with you: the app hasn't been perfect. We've had bugs, rough edges, and features that needed work. We know that, and we've been heads-down for the past 30 days fixing it.

We've redesigned and refocused the entire app around what actually matters: helping you plan and track your build. Real data, real community, real answers—no fluff.

We're still in beta — and that's intentional. We'd rather ship, learn, and improve with you than hide in a corner until it's "perfect."

---

IF YOU HAVEN'T SEEN THE APP RECENTLY, HERE'S WHAT'S NEW:

YOUR GARAGE
Your ride's command center. View specs, track your build with curated parts, and document your install photos.

VIRTUAL DYNO
See your estimated HP and torque curves based on your mods.

LAP TIME ESTIMATOR
Predict your lap times at popular tracks based on your build.

PLAN YOUR BUILD
Curated upgrade paths for track, street, or daily driving. See exactly what each mod delivers—power gains, real-world feel, and compatibility.

COMMUNITY BUILDS
Get inspiration from real builds. Share your progress.

EVENTS
Find Cars & Coffee, track days, and meetups near you.

ASK AL ANYTHING
Your AI car expert. No more forum searching—AL knows your car, your mods, and your goals. Get instant, honest answers.

---

WE NEED YOUR HELP

We're building this with you, not just for you. Your patience as an early adopter means the world to us—and your feedback helps us make this better for everyone.

Bugs, feature ideas, things that annoyed you—we want to hear it all. No filter needed.

HOW TO SHARE FEEDBACK:
1. Open the app and go to your Garage
2. Tap your profile picture in the top corner
3. Hit the "Share Feedback" button

(Or just reply to this email—we read every one.)

---

→ Open AutoRev: ${baseUrl}/garage

Thanks for being part of this journey. We're just getting started.

— The AutoRev Team

© ${year} AutoRev

Unsubscribe: ${baseUrl}/unsubscribe?token=${generateUnsubscribeToken(vars.email || '')}`,
      };
    },
  },
};

/**
 * Check if user can receive a specific email type
 */
async function canSendEmail(userId, templateSlug, _recipientEmail) {
  if (!userId) return { canSend: true, reason: null };

  const { data: profile, error } = await supabaseAdmin
    .from('user_profiles')
    .select('email_opt_in_features, email_opt_in_events, email_unsubscribed_at, email_bounce_count')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[Email] Error checking user preferences:', error);
    return { canSend: true, reason: null }; // Default to sending on error
  }

  // Check global unsubscribe
  if (profile.email_unsubscribed_at) {
    return { canSend: false, reason: 'unsubscribed' };
  }

  // Check bounce threshold
  if (profile.email_bounce_count >= EMAIL_CONFIG.maxBounceCount) {
    return { canSend: false, reason: 'bounce_threshold' };
  }

  // Get template opt-in requirements
  const { data: template } = await supabaseAdmin
    .from('email_templates')
    .select('requires_opt_in')
    .eq('slug', templateSlug)
    .single();

  if (template?.requires_opt_in === 'features' && !profile.email_opt_in_features) {
    return { canSend: false, reason: 'opt_out_features' };
  }

  if (template?.requires_opt_in === 'events' && !profile.email_opt_in_events) {
    return { canSend: false, reason: 'opt_out_events' };
  }

  return { canSend: true, reason: null };
}

/**
 * Log email to database
 */
async function logEmail(data) {
  try {
    const { data: log, error } = await supabaseAdmin
      .from('email_logs')
      .insert({
        user_id: data.userId || null,
        recipient_email: data.to,
        template_slug: data.templateSlug || null,
        subject: data.subject,
        resend_id: data.resendId || null,
        status: data.status,
        error_message: data.errorMessage || null,
        error_code: data.errorCode || null,
        metadata: data.metadata || {},
        sent_at: data.status === 'sent' ? new Date().toISOString() : null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Email] Error logging email:', error);
    }
    return log?.id;
  } catch (err) {
    console.error('[Email] Exception logging email:', err);
    return null;
  }
}

/**
 * Send an email using a template
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.templateSlug - Template identifier (e.g., 'welcome')
 * @param {Object} options.variables - Template variables
 * @param {string} options.userId - Optional user ID for logging and preferences
 * @param {Object} options.metadata - Optional metadata for logging
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export async function sendTemplateEmail({
  to,
  templateSlug,
  variables = {},
  userId = null,
  metadata = {},
}) {
  // Check if Resend is configured
  if (!resend) {
    console.warn('[Email] Resend not configured, skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  // Check user preferences
  const { canSend, reason } = await canSendEmail(userId, templateSlug, to);
  if (!canSend) {
    console.log(`[Email] Skipping email to ${to.slice(0, 3)}***: ${reason}`);
    await logEmail({
      userId,
      to,
      templateSlug,
      subject: 'SKIPPED',
      status: 'skipped',
      metadata: { ...metadata, skip_reason: reason },
    });
    return { success: false, error: `Skipped: ${reason}` };
  }

  // Get template
  const template = EMAIL_TEMPLATES[templateSlug];
  if (!template) {
    console.error(`[Email] Template not found: ${templateSlug}`);
    return { success: false, error: 'Template not found' };
  }

  // Render template
  const { html, text } = template.render(variables);
  const subject = template.subject.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || '');

  try {
    // Send via Resend
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from.default,
      to,
      subject,
      html,
      text,
      reply_to: EMAIL_CONFIG.replyTo,
      tags: [
        { name: 'template', value: templateSlug },
        { name: 'category', value: metadata.category || 'transactional' },
      ],
    });

    if (error) {
      console.error('[Email] Resend error:', error);
      await logEmail({
        userId,
        to,
        templateSlug,
        subject,
        status: 'failed',
        errorMessage: error.message,
        errorCode: error.name,
        metadata,
      });
      return { success: false, error: error.message };
    }

    console.log(`[Email] Sent ${templateSlug} to ${to.slice(0, 3)}***`);

    // Log success
    const logId = await logEmail({
      userId,
      to,
      templateSlug,
      subject,
      resendId: data.id,
      status: 'sent',
      metadata,
    });

    // Update user's last email timestamp
    if (userId) {
      await supabaseAdmin
        .from('user_profiles')
        .update({ last_email_sent_at: new Date().toISOString() })
        .eq('id', userId);
    }

    return { success: true, id: data.id, logId };
  } catch (err) {
    console.error('[Email] Exception sending email:', err);
    await logEmail({
      userId,
      to,
      templateSlug,
      subject,
      status: 'failed',
      errorMessage: err.message,
      metadata,
    });
    return { success: false, error: err.message };
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(user) {
  const { id, email, user_metadata } = user;
  const userName = user_metadata?.full_name || user_metadata?.name || null;

  return sendTemplateEmail({
    to: email,
    templateSlug: 'welcome',
    variables: {
      user_name: userName, // Template extracts first name automatically
      login_url: EMAIL_CONFIG.baseUrl,
    },
    userId: id,
    metadata: { category: 'transactional', trigger: 'signup' },
  });
}

/**
 * Send referral reward email
 */
export async function sendReferralRewardEmail(referrerId, friendName, creditsEarned, totalCredits) {
  // Get referrer info
  const { data: _profile } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('id', referrerId)
    .single();

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(referrerId);

  if (!authUser?.user?.email) {
    console.error('[Email] Could not find referrer email');
    return { success: false, error: 'Referrer email not found' };
  }

  return sendTemplateEmail({
    to: authUser.user.email,
    templateSlug: 'referral-reward',
    variables: {
      user_name: authUser.user.user_metadata?.full_name?.split(' ')[0],
      friend_name: friendName,
      credits_earned: creditsEarned,
      total_credits: totalCredits,
    },
    userId: referrerId,
    metadata: { category: 'referral', trigger: 'friend_signup' },
  });
}

/**
 * Send referral invite email to a friend
 */
export async function sendReferralInviteEmail(
  friendEmail,
  referrerName,
  referralLink,
  bonusCredits = 200
) {
  return sendTemplateEmail({
    to: friendEmail,
    templateSlug: 'referral-invite',
    variables: {
      referrer_name: referrerName,
      referral_link: referralLink,
      bonus_credits: bonusCredits,
    },
    metadata: { category: 'referral', trigger: 'friend_invite' },
  });
}

/**
 * Send feedback response email
 *
 * Simple "thank you for your feedback" email sent when we want to acknowledge
 * that we received and are reviewing a user's feedback.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.userName - User's name (optional)
 * @param {string} options.originalFeedback - The original feedback text to quote back (optional)
 * @param {string} options.userId - User ID for logging (optional)
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export async function sendFeedbackResponseEmail({
  to,
  userName = null,
  originalFeedback = null,
  userId = null,
}) {
  return sendTemplateEmail({
    to,
    templateSlug: 'feedback-response',
    variables: {
      user_name: userName,
      original_feedback: originalFeedback,
    },
    userId,
    metadata: {
      category: 'transactional',
      trigger: 'feedback_addressed',
    },
  });
}

/**
 * Queue an email for later sending
 */
export async function queueEmail({
  userId,
  email,
  templateSlug,
  variables = {},
  scheduledFor,
  priority = 0,
  metadata = {},
}) {
  try {
    const { data, error } = await supabaseAdmin
      .from('email_queue')
      .insert({
        user_id: userId,
        recipient_email: email,
        template_slug: templateSlug,
        template_variables: variables,
        scheduled_for: scheduledFor,
        priority,
        metadata,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Email] Error queuing email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, queueId: data.id };
  } catch (err) {
    console.error('[Email] Exception queuing email:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Process email queue (called by cron job)
 */
export async function processEmailQueue(limit = 50) {
  const now = new Date().toISOString();

  const QUEUE_COLS =
    'id, user_id, email_type, to_email, subject, html_content, text_content, metadata, status, priority, scheduled_for, attempts, last_error, sent_at, created_at';

  // Get pending emails scheduled for now or earlier
  const { data: queuedEmails, error } = await supabaseAdmin
    .from('email_queue')
    .select(QUEUE_COLS)
    .eq('status', 'pending')
    .lte('scheduled_for', now)
    .lt('attempts', 3)
    .order('priority', { ascending: false })
    .order('scheduled_for', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[Email] Error fetching queue:', error);
    return { processed: 0, errors: 1 };
  }

  let processed = 0;
  let errors = 0;

  for (const item of queuedEmails || []) {
    // Mark as processing
    await supabaseAdmin
      .from('email_queue')
      .update({ status: 'processing', last_attempt_at: now })
      .eq('id', item.id);

    // Send the email
    const result = await sendTemplateEmail({
      to: item.recipient_email,
      templateSlug: item.template_slug,
      variables: item.template_variables,
      userId: item.user_id,
      metadata: item.metadata,
    });

    if (result.success) {
      await supabaseAdmin
        .from('email_queue')
        .update({
          status: 'sent',
          processed_at: now,
          email_log_id: result.logId,
        })
        .eq('id', item.id);
      processed++;
    } else {
      const newAttempts = item.attempts + 1;
      await supabaseAdmin
        .from('email_queue')
        .update({
          status: newAttempts >= item.max_attempts ? 'failed' : 'pending',
          attempts: newAttempts,
          error_message: result.error,
        })
        .eq('id', item.id);
      errors++;
    }
  }

  console.log(`[Email] Queue processed: ${processed} sent, ${errors} errors`);
  return { processed, errors };
}

/**
 * Get email analytics for admin dashboard
 */
export async function getEmailAnalytics(daysBack = 30) {
  const { data, error } = await supabaseAdmin.rpc('get_email_analytics', { days_back: daysBack });

  if (error) {
    console.error('[Email] Error fetching analytics:', error);
    return null;
  }

  return data;
}

/**
 * Handle Resend webhook events (for tracking delivery, opens, etc.)
 */
export async function handleResendWebhook(event) {
  const { type, data } = event;
  const emailId = data?.email_id;

  if (!emailId) {
    console.warn('[Email Webhook] No email ID in event');
    return;
  }

  const updates = {};

  switch (type) {
    case 'email.delivered':
      updates.status = 'delivered';
      updates.delivered_at = new Date().toISOString();
      break;
    case 'email.opened':
      updates.opened_at = new Date().toISOString();
      break;
    case 'email.clicked':
      updates.clicked_at = new Date().toISOString();
      break;
    case 'email.bounced':
      updates.status = 'bounced';
      updates.error_message = data?.bounce?.message || 'Bounced';
      // Increment bounce count for user
      if (data?.to) {
        await supabaseAdmin.rpc('increment_bounce_count', { email_addr: data.to });
      }
      break;
    case 'email.complained':
      updates.status = 'complained';
      // Auto-unsubscribe user who complained
      if (data?.to) {
        await supabaseAdmin
          .from('user_profiles')
          .update({ email_unsubscribed_at: new Date().toISOString() })
          .eq(
            'id',
            (await supabaseAdmin.auth.admin.listUsers({ filter: { email: data.to } })).data
              ?.users?.[0]?.id
          );
      }
      break;
    default:
      console.log(`[Email Webhook] Unhandled event type: ${type}`);
      return;
  }

  if (Object.keys(updates).length > 0) {
    await supabaseAdmin.from('email_logs').update(updates).eq('resend_id', emailId);
  }
}

/**
 * Send a raw email (not using templates)
 * Use this for custom one-off emails like retention alerts.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @param {string} options.text - Optional plain text body
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export async function sendEmail({ to, subject, html, text = '' }) {
  if (!resend) {
    console.warn('[Email] Resend not configured, skipping email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from.default,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text fallback
      reply_to: EMAIL_CONFIG.replyTo,
    });

    if (error) {
      console.error('[Email] Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Sent raw email to ${to.slice(0, 3)}***`);
    return { success: true, id: data.id };
  } catch (err) {
    console.error('[Email] Exception sending email:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send trial ending soon notification email
 *
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {string} params.email - User email
 * @param {string} params.userName - User's display name
 * @param {number} params.daysRemaining - Days until trial ends
 * @param {string} params.trialEndDate - Formatted date string
 * @param {string} params.tier - Current subscription tier
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendTrialEndingEmail({
  userId: _userId,
  email,
  userName,
  daysRemaining,
  trialEndDate,
  tier = 'tuner',
}) {
  if (!email) {
    console.error('[Email] sendTrialEndingEmail: No email provided');
    return { success: false, error: 'No email provided' };
  }

  const firstName = userName?.split(' ')[0] || 'there';
  const tierName = tier === 'collector' ? 'Enthusiast' : 'Tuner';

  // Generate email HTML
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your AutoRev Trial Ends Soon</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 40px 0 32px 0; border-bottom: 1px solid #f3f4f6;">
              <div style="width: 60px; height: 60px; background-color: #0d1b2a; border-radius: 50%; margin: 0 auto 16px auto; overflow: hidden;"><img src="${EMAIL_CONFIG.baseUrl}/images/autorev-logo-transparent.png" alt="AutoRev" width="60" height="60" style="display: block;"></div>
              <p style="margin: 0; font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #1f2937; text-transform: uppercase;">Trial Ending Soon</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; color: #0d1b2a; font-size: 24px;">
                Hey ${firstName} 👋
              </h2>
              
              <p style="margin: 0 0 8px; color: #64748b; font-size: 16px; line-height: 1.6;">
                Your ${tierName} trial ends ${daysRemaining === 1 ? 'tomorrow' : `in ${daysRemaining} days`}.
              </p>
              
              <p style="margin: 0 0 24px; color: #64748b; font-size: 16px; line-height: 1.6;">
                Your trial will end on <strong>${trialEndDate}</strong>. After that, you'll be moved to the Free tier unless you subscribe.
              </p>
              
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px; color: #0d1b2a; font-size: 16px;">
                  What you'll lose access to:
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #64748b;">
                  ${
                    tier === 'tuner'
                      ? `
                    <li>Unlimited AL (AI Expert) questions</li>
                    <li>Build planning with curated parts</li>
                    <li>Virtual Dyno & Lap Time Estimator</li>
                    <li>Community builds & events</li>
                  `
                      : `
                    <li>Unlimited favorites</li>
                    <li>Garage vehicle tracking</li>
                    <li>Event calendar access</li>
                    <li>Personalized Insights</li>
                  `
                  }
                </ul>
              </div>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${EMAIL_CONFIG.baseUrl}/pricing" style="display: inline-block; padding: 12px 28px; background-color: #d4ff00; color: #0a1628; text-decoration: none; font-weight: 700; border-radius: 100px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.02em; white-space: nowrap;">
                      Keep My ${tierName} Access
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0; color: #94a3b8; font-size: 14px; text-align: center;">
                Questions? Just reply to this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 32px; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                © ${new Date().getFullYear()} AutoRev. All rights reserved.<br>
                <a href="${EMAIL_CONFIG.baseUrl}/settings/notifications" style="color: #64748b;">Manage email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to: email,
    subject: `Your AutoRev ${tierName} trial ends ${daysRemaining === 1 ? 'tomorrow' : `in ${daysRemaining} days`}`,
    html,
    text: `Hey ${firstName}, your ${tierName} trial ends ${daysRemaining === 1 ? 'tomorrow' : `in ${daysRemaining} days`} on ${trialEndDate}. Subscribe now to keep your access: ${EMAIL_CONFIG.baseUrl}/pricing`,
  });
}

/**
 * Send trial ended notification email
 *
 * Sent when a user's free trial has expired. Encourages them to subscribe
 * to continue accessing premium features.
 *
 * @param {Object} params
 * @param {string} params.userId - User ID for logging
 * @param {string} params.email - User email address
 * @param {string} params.userName - User's display name
 * @param {string} [params.trialTier='tuner'] - The tier they had during trial
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendTrialEndedEmail({
  userId: _userId,
  email,
  userName,
  trialTier = 'tuner',
}) {
  if (!email) {
    console.error('[Email] sendTrialEndedEmail: No email provided');
    return { success: false, error: 'No email provided' };
  }

  const firstName = userName?.split(' ')[0] || 'there';
  const tierName = trialTier === 'collector' ? 'Enthusiast' : 'Tuner';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your AutoRev Trial Has Ended</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 40px 0 32px 0; border-bottom: 1px solid #f3f4f6;">
              <div style="width: 60px; height: 60px; background-color: #0d1b2a; border-radius: 50%; margin: 0 auto 16px auto; overflow: hidden;"><img src="${EMAIL_CONFIG.baseUrl}/images/autorev-logo-transparent.png" alt="AutoRev" width="60" height="60" style="display: block;"></div>
              <p style="margin: 0; font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #1f2937; text-transform: uppercase;">Trial Ended</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; color: #0d1b2a; font-size: 20px;">
                Hey ${firstName} 👋
              </h2>
              
              <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">
                Your 7-day ${tierName} trial has ended. We hope you enjoyed exploring all the premium features!
              </p>
              
              <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">
                You've been moved back to our Free tier, but you can upgrade anytime to unlock:
              </p>
              
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <ul style="margin: 0; padding-left: 20px; color: #334155;">
                  ${
                    trialTier === 'tuner'
                      ? `
                    <li>Unlimited AL (AI Expert) questions</li>
                    <li>Build planning with curated parts</li>
                    <li>Virtual Dyno & Lap Time Estimator</li>
                    <li>Community builds & events</li>
                  `
                      : `
                    <li>Unlimited favorites</li>
                    <li>Garage vehicle tracking</li>
                    <li>Event calendar access</li>
                    <li>Personalized Insights</li>
                  `
                  }
                </ul>
              </div>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${EMAIL_CONFIG.baseUrl}/pricing" style="display: inline-block; padding: 12px 28px; background-color: #d4ff00; color: #0a1628; text-decoration: none; font-weight: 700; border-radius: 100px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.02em; white-space: nowrap;">
                      Upgrade to ${tierName}
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0; color: #94a3b8; font-size: 14px; text-align: center;">
                Questions? Just reply to this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 32px; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                © ${new Date().getFullYear()} AutoRev. All rights reserved.<br>
                <a href="${EMAIL_CONFIG.baseUrl}/settings/notifications" style="color: #64748b;">Manage email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to: email,
    subject: `Your AutoRev ${tierName} trial has ended`,
    html,
    text: `Hey ${firstName}, your 7-day ${tierName} trial has ended. You've been moved back to our Free tier. Upgrade anytime at ${EMAIL_CONFIG.baseUrl}/pricing to continue using premium features.`,
  });
}

/**
 * Send payment failed notification email (dunning)
 *
 * Part of the subscription recovery flow - sent when invoice.payment_failed
 * webhook is received from Stripe.
 *
 * @param {Object} params
 * @param {string} params.userId - User ID for logging
 * @param {string} params.email - User email address
 * @param {string} params.userName - User's display name
 * @param {number} params.amountCents - Failed payment amount in cents
 * @param {string} params.tier - Current subscription tier
 * @param {string} [params.nextRetryDate] - Optional formatted date of next retry
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendPaymentFailedEmail({
  userId: _userId,
  email,
  userName,
  amountCents,
  tier = 'tuner',
  nextRetryDate,
}) {
  if (!email) {
    console.error('[Email] sendPaymentFailedEmail: No email provided');
    return { success: false, error: 'No email provided' };
  }

  const firstName = userName?.split(' ')[0] || 'there';
  const tierName = tier === 'collector' ? 'Enthusiast' : 'Tuner';
  const amountFormatted = amountCents ? `$${(amountCents / 100).toFixed(2)}` : 'your subscription';
  const updatePaymentUrl = `${EMAIL_CONFIG.baseUrl}/profile?manage=payment`;

  // Generate email HTML
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Failed - Action Required</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 40px 0 32px 0; border-bottom: 1px solid #f3f4f6;">
              <div style="width: 60px; height: 60px; background-color: #0d1b2a; border-radius: 50%; margin: 0 auto 16px auto; overflow: hidden;"><img src="${EMAIL_CONFIG.baseUrl}/images/autorev-logo-transparent.png" alt="AutoRev" width="60" height="60" style="display: block;"></div>
              <p style="margin: 0; font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #f59e0b; text-transform: uppercase;">Action Required</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; color: #0d1b2a; font-size: 24px; text-align: left;">
                Hey ${firstName} 👋
              </h2>
              
              <p style="margin: 0 0 24px; color: #64748b; font-size: 16px; line-height: 1.6; text-align: left;">
                We couldn't process your payment of ${amountFormatted} for your ${tierName} subscription.
              </p>
              
              <div style="background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  <strong>What happens next:</strong><br>
                  ${
                    nextRetryDate
                      ? `We'll automatically retry your payment on ${nextRetryDate}. To avoid any interruption, please update your payment method before then.`
                      : `Please update your payment method to keep your ${tierName} access and avoid losing your features.`
                  }
                </p>
              </div>
              
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px; color: #0d1b2a; font-size: 16px;">
                  Features at risk:
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #64748b;">
                  ${
                    tier === 'tuner'
                      ? `
                    <li>Unlimited AL (AI Expert) questions</li>
                    <li>Build planning with curated parts</li>
                    <li>Virtual Dyno & Lap Time Estimator</li>
                    <li>Community builds & events</li>
                  `
                      : `
                    <li>Unlimited favorites</li>
                    <li>Garage vehicle tracking</li>
                    <li>Event calendar access</li>
                    <li>Personalized Insights</li>
                  `
                  }
                </ul>
              </div>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${updatePaymentUrl}" style="display: inline-block; padding: 12px 28px; background-color: #d4ff00; color: #0a1628; text-decoration: none; font-weight: 700; border-radius: 100px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.02em; white-space: nowrap;">
                      Update Payment Method
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0; color: #94a3b8; font-size: 14px; text-align: center;">
                Having trouble? Reply to this email and we'll help you out.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 32px; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                © ${new Date().getFullYear()} AutoRev. All rights reserved.<br>
                <a href="${EMAIL_CONFIG.baseUrl}/settings/notifications" style="color: #64748b;">Manage email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to: email,
    subject: `Action Required: Your AutoRev payment failed`,
    html,
    text: `Hey ${firstName}, we couldn't process your payment of ${amountFormatted} for your ${tierName} subscription. Please update your payment method to keep your access: ${updatePaymentUrl}`,
  });
}

export { EMAIL_CONFIG, EMAIL_TEMPLATES };
