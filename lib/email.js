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

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

// Initialize Resend client
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

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
 * - Primary: #1a4d6e (dark blue)
 * - Accent/Gold: #D4AF37
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
  const carCount = vars.car_count || 188;
  
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
              <img src="${baseUrl}/images/autorev-logo-trimmed.png" alt="AutoRev" width="60" height="60" style="display: block; margin-bottom: 16px;">
              <p style="margin: 0; font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #1f2937; text-transform: uppercase;">Welcome to AutoRev</p>
            </td>
          </tr>
          
          <!-- Hero Section -->
          <tr>
            <td align="center" style="padding: 32px 32px 0 32px;">
              <img src="${baseUrl}/images/pages/home-hero.jpg" alt="Sports Car" class="hero-image" width="536" style="display: block; width: 100%; max-width: 536px; height: auto; border-radius: 12px;">
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
                     <img src="${baseUrl}/images/al-mascot.png" alt="AL" width="40" height="40" style="display: block; width: 40px; height: 40px; border-radius: 10px; background-color: #f3f4f6;">
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
  const carCount = vars.car_count || 188;
  
  return `AUTOREV — Find What Drives You
================================

Hey ${userName}! 👋

Welcome to AutoRev—where we lift up the driver with the $3K Miata the same as the one with the $300K GT3RS.

We built this for enthusiasts who want real data, honest guidance, and a community that celebrates the passion—not the price tag.

No flex culture. No gatekeeping. Just honest guidance and genuine community.

---

HERE'S WHAT YOU CAN DO:

🔍 BROWSE & DISCOVER
Explore ${carCount} sports cars. Use our Car Selector to find your perfect match based on 7 priorities you actually care about.

🚗 MY GARAGE
Save favorites, add your rides with VIN decode, track service history, and monitor market value—all in one place.

🔧 TUNING SHOP
Plan your build with real dyno data, lap times, and parts that actually fit. No guessing, just data.

📍 COMMUNITY & EVENTS
Find Cars & Coffee, track days, car shows, and meetups near you. Never miss another event.

📚 ENCYCLOPEDIA
136 topics on how cars actually work—from turbo fundamentals to suspension geometry.

🤖 MEET AL
Your AI car expert with access to our entire database. Ask anything—specs, reliability issues, best mods, events near you. AL knows.

---

Start exploring: ${loginUrl}

© ${year} AutoRev · Built for enthusiasts, by enthusiasts`;
}

const EMAIL_TEMPLATES = {
  welcome: {
    subject: 'Welcome to AutoRev — Find What Drives You',
    render: (vars) => ({
      html: generateWelcomeEmailHtml(vars, vars.imageBaseUrl || EMAIL_CONFIG.baseUrl),
      text: generateWelcomeEmailText(vars, vars.imageBaseUrl || EMAIL_CONFIG.baseUrl),
    }),
  },

  'inactivity-7d': {
    subject: 'Quick question for you',
    render: (vars) => {
      // Extract first name only (handles "Cory Hughes" → "Cory")
      const rawName = vars.user_name || 'there';
      const userName = rawName.split(' ')[0];
      const loginUrl = vars.login_url || EMAIL_CONFIG.baseUrl;
      const alUrl = `${EMAIL_CONFIG.baseUrl}/al`;
      const year = new Date().getFullYear();
      const carCount = vars.car_count || 188;
      
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
              <img src="${EMAIL_CONFIG.baseUrl}/images/autorev-logo-trimmed.png" alt="AutoRev" width="60" height="60" style="display: block;">
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td class="content" style="padding: 32px 40px 40px 40px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 20px 0; font-size: 24px; font-weight: 700; color: #1f2937; text-align: left;">
                Hey ${userName},
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
                            "What's the most reliable sports car under $40K?"<br>
                            "Is the 987 Cayman's IMS bearing really that bad?"<br>
                            "Best first mods for an ND Miata?"
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
                    <a href="${alUrl}" target="_blank" style="display: inline-block; background-color: #111827; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px; border: 1px solid #111827;">
                      Ask AL a Question →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Soft secondary options -->
              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 22px; color: #9ca3af; text-align: center;">
                Or <a href="${EMAIL_CONFIG.baseUrl}/events" style="color: #4b5563; text-decoration: underline;">find a Cars & Coffee near you</a> · <a href="${EMAIL_CONFIG.baseUrl}/browse-cars" style="color: #4b5563; text-decoration: underline;">explore ${carCount} sports cars</a>
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f9fafb; padding: 24px 24px; border-top: 1px solid #f3f4f6; border-radius: 0 0 16px 16px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af;">
                © ${year} AutoRev · <a href="${EMAIL_CONFIG.baseUrl}/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy</a> · <a href="${EMAIL_CONFIG.baseUrl}/terms" style="color: #9ca3af; text-decoration: underline;">Terms</a>
              </p>
              <a href="${EMAIL_CONFIG.baseUrl}/unsubscribe?email=${encodeURIComponent(vars.email || '')}" style="font-size: 11px; color: #9ca3af; text-decoration: underline;">
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
      text: `Hey ${userName},

Still thinking about your next car? Or maybe you're stuck on a mod decision?

Here's the thing—most car forums will roast you for asking "dumb" questions. We built AutoRev specifically so you don't have to deal with that.

---

ASK AL ANYTHING

"What's the most reliable sports car under $40K?"
"Is the 987 Cayman's IMS bearing really that bad?"
"Best first mods for an ND Miata?"

Real data. Honest answers. Zero judgment.

→ Ask AL: ${alUrl}

---

Or find a Cars & Coffee near you: ${EMAIL_CONFIG.baseUrl}/events
Or explore ${carCount} sports cars: ${EMAIL_CONFIG.baseUrl}/browse-cars

© ${year} AutoRev

Unsubscribe: ${EMAIL_CONFIG.baseUrl}/unsubscribe?email=${encodeURIComponent(vars.email || '')}`
      };
    }
  },

  'inactivity-21d': {
    subject: 'Events near you this weekend',
    render: (vars) => {
      // Extract first name only
      const rawName = vars.user_name || 'there';
      const userName = rawName.split(' ')[0];
      const eventsUrl = `${EMAIL_CONFIG.baseUrl}/events`;
      const year = new Date().getFullYear();
      const eventCount = vars.event_count || 940;
      
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
  <title>Events near you</title>
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
    ${eventCount}+ car events. Cars & Coffee, track days, meetups—find one near you.
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
              <img src="${EMAIL_CONFIG.baseUrl}/images/autorev-logo-trimmed.png" alt="AutoRev" width="60" height="60" style="display: block;">
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td class="content" style="padding: 24px 40px 40px 40px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 20px 0; font-size: 24px; font-weight: 700; color: #1f2937; text-align: left;">
                Hey ${userName},
              </p>
              
              <!-- The Hook -->
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                Quick thought: when's the last time you went to a car meet?
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                We've got <strong>${eventCount}+ events</strong> in our database—Cars & Coffee, track days, car shows, rallies. There's probably something happening near you this weekend.
              </p>
              
              <!-- Event Types Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 16px 0; font-size: 13px; font-weight: 700; letter-spacing: 1px; color: #9ca3af; text-transform: uppercase;">
                      Find your scene
                    </p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <span style="font-size: 20px; margin-right: 12px;">☕</span>
                          <span style="font-size: 15px; color: #4b5563;"><strong>Cars & Coffee</strong> — Casual weekend mornings</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <span style="font-size: 20px; margin-right: 12px;">🏁</span>
                          <span style="font-size: 15px; color: #4b5563;"><strong>Track Days</strong> — Push your limits (safely)</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <span style="font-size: 20px; margin-right: 12px;">🏆</span>
                          <span style="font-size: 15px; color: #4b5563;"><strong>Car Shows</strong> — See incredible builds up close</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span style="font-size: 20px; margin-right: 12px;">🤝</span>
                          <span style="font-size: 15px; color: #4b5563;"><strong>Meetups</strong> — Connect with local enthusiasts</span>
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
                    <a href="${eventsUrl}" target="_blank" style="display: inline-block; background-color: #111827; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px; border: 1px solid #111827;">
                      Find Events Near Me →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Soft secondary -->
              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 22px; color: #9ca3af; text-align: center;">
                Or <a href="${EMAIL_CONFIG.baseUrl}/al" style="color: #4b5563; text-decoration: underline;">ask AL for recommendations</a>
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f9fafb; padding: 24px 24px; border-top: 1px solid #f3f4f6; border-radius: 0 0 16px 16px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af;">
                © ${year} AutoRev · <a href="${EMAIL_CONFIG.baseUrl}/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy</a> · <a href="${EMAIL_CONFIG.baseUrl}/terms" style="color: #9ca3af; text-decoration: underline;">Terms</a>
              </p>
              <a href="${EMAIL_CONFIG.baseUrl}/unsubscribe?email=${encodeURIComponent(vars.email || '')}" style="font-size: 11px; color: #9ca3af; text-decoration: underline;">
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
      text: `Hey ${userName},

Quick thought: when's the last time you went to a car meet?

We've got ${eventCount}+ events in our database—Cars & Coffee, track days, car shows, rallies. There's probably something happening near you this weekend.

---

FIND YOUR SCENE:

☕ Cars & Coffee — Casual weekend mornings
🏁 Track Days — Push your limits (safely)
🏆 Car Shows — See incredible builds up close
🤝 Meetups — Connect with local enthusiasts

---

→ Find events near you: ${eventsUrl}

Or ask AL for recommendations: ${EMAIL_CONFIG.baseUrl}/al

© ${year} AutoRev

Unsubscribe: ${EMAIL_CONFIG.baseUrl}/unsubscribe?email=${encodeURIComponent(vars.email || '')}`
      };
    }
  },

  'referral-reward': {
    subject: 'You earned ${vars?.credits_earned || 200} AL credits! 🎁',
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
              <img src="${EMAIL_CONFIG.baseUrl}/images/autorev-logo-trimmed.png" alt="AutoRev" width="60" height="60" style="display: block; margin-bottom: 16px;">
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
                  <td style="padding: 24px; background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-radius: 12px; border: 1px solid #fcd34d;">
                    <p style="margin: 0 0 4px; font-size: 12px; color: #92400e; text-transform: uppercase; letter-spacing: 1px;">
                      Credits Earned
                    </p>
                    <p style="margin: 0 0 16px; font-size: 42px; font-weight: 700; color: #D4AF37; line-height: 1;">
                      +${vars.credits_earned || 200}
                    </p>
                    <div style="height: 1px; background: #fcd34d; margin: 0 0 16px;"></div>
                    <p style="margin: 0; font-size: 13px; color: #92400e;">
                      Total Balance: <strong style="color: #D4AF37;">${vars.total_credits || 200} credits</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px; font-size: 14px; color: #6b7280;">
                Use your credits to chat with AL, your AI car expert.
              </p>

              <a href="${EMAIL_CONFIG.baseUrl}/al" style="display: inline-block; padding: 14px 36px; background-color: #1a4d6e; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                Chat with AL →
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
      text: `🎁 REFERRAL REWARD!

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

  'referral-invite': {
    subject: '${vars?.referrer_name || "Your friend"} thinks you\'d love AutoRev 🏎️',
    render: (vars) => {
      const year = new Date().getFullYear();
      const referrerName = vars.referrer_name || 'Your friend';
      const bonusCredits = vars.bonus_credits || 200;
      const referralLink = vars.referral_link || EMAIL_CONFIG.baseUrl;
      const carCount = vars.car_count || 188;
      
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
              <img src="${EMAIL_CONFIG.baseUrl}/images/autorev-logo-trimmed.png" alt="AutoRev" width="60" height="60" style="display: block; margin-bottom: 16px;">
              <p style="margin: 0; font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #1f2937; text-transform: uppercase;">You're Invited</p>
            </td>
          </tr>
          
          <!-- Hero Section -->
          <tr>
            <td align="center" style="padding: 32px 32px 0 32px;">
              <img src="${EMAIL_CONFIG.baseUrl}/images/pages/home-hero.jpg" alt="Sports Car" class="hero-image" width="536" style="display: block; width: 100%; max-width: 536px; height: auto; border-radius: 12px;">
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td class="content" style="padding: 24px 40px 40px 40px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1f2937; text-align: left;">
                ${referrerName} thinks you'd love this 🏎️
              </p>
              
              <!-- Intro Text -->
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                AutoRev is where sports car enthusiasts research, compare, and plan their builds—whether you're driving a $3K Miata or a $300K GT3RS.
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                Real data, honest guidance, and a community that celebrates the passion—not the price tag.
              </p>
              
              <!-- Welcome Bonus Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fffbeb; border-radius: 8px; border: 1px solid #fcd34d; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; letter-spacing: 1px; color: #92400e; text-transform: uppercase;">
                      🎁 Your Welcome Bonus
                    </p>
                    <p style="margin: 0 0 8px 0; font-size: 36px; font-weight: 700; color: #D4AF37; line-height: 1;">
                      +${bonusCredits} AL Credits
                    </p>
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #92400e;">
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
              
              <!-- 1. Browse & Discover -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td width="50" valign="top" class="mobile-icon">
                    <div style="width: 40px; height: 40px; background-color: #eff6ff; border-radius: 10px; text-align: center; line-height: 40px; font-size: 20px;">🔍</div>
                  </td>
                  <td class="mobile-stack" style="padding-left: 16px;">
                    <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">Browse ${carCount} Sports Cars</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #6b7280;">Use our Car Selector to find your perfect match based on 7 priorities you actually care about.</p>
                  </td>
                </tr>
              </table>
              
              <!-- 2. Meet AL -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td width="50" valign="top" class="mobile-icon">
                     <img src="${EMAIL_CONFIG.baseUrl}/images/al-mascot.png" alt="AL" width="40" height="40" style="display: block; width: 40px; height: 40px; border-radius: 10px; background-color: #f3f4f6;">
                  </td>
                  <td class="mobile-stack" style="padding-left: 16px;">
                    <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">Meet AL — Your AI Car Expert</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #6b7280;">Ask anything—specs, reliability issues, best mods. Real answers, no gatekeeping.</p>
                  </td>
                </tr>
              </table>
              
              <!-- 3. My Garage -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td width="50" valign="top" class="mobile-icon">
                    <div style="width: 40px; height: 40px; background-color: #fef2f2; border-radius: 10px; text-align: center; line-height: 40px; font-size: 20px;">🚗</div>
                  </td>
                  <td class="mobile-stack" style="padding-left: 16px;">
                    <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">My Garage</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #6b7280;">Save favorites, add your rides with VIN decode, track service history, and monitor market value.</p>
                  </td>
                </tr>
              </table>
              
              <!-- 4. Tuning Shop -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td width="50" valign="top" class="mobile-icon">
                    <div style="width: 40px; height: 40px; background-color: #f0fdf4; border-radius: 10px; text-align: center; line-height: 40px; font-size: 20px;">🔧</div>
                  </td>
                  <td class="mobile-stack" style="padding-left: 16px;">
                    <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">Tuning Shop</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #6b7280;">Plan your build with real dyno data, lap times, and parts that actually fit.</p>
                  </td>
                </tr>
              </table>
              
              <!-- 5. Community & Events -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td width="50" valign="top" class="mobile-icon">
                    <div style="width: 40px; height: 40px; background-color: #fef3c7; border-radius: 10px; text-align: center; line-height: 40px; font-size: 20px;">📍</div>
                  </td>
                  <td class="mobile-stack" style="padding-left: 16px;">
                    <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #111827;">Community & Events</h3>
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #6b7280;">Find Cars & Coffee, track days, car shows, and meetups near you.</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${referralLink}" target="_blank" style="display: inline-block; background-color: #111827; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px; border: 1px solid #111827;">
                      Join AutoRev Free →
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

${referrerName} thinks you'd love this! 🏎️

AutoRev is where sports car enthusiasts research, compare, and plan their builds—whether you're driving a $3K Miata or a $300K GT3RS.

Real data, honest guidance, and a community that celebrates the passion—not the price tag.

🎁 YOUR WELCOME BONUS: +${bonusCredits} AL Credits
Use them to chat with AL, your AI car expert who actually knows cars.

---

HERE'S WHAT YOU'LL GET:

🔍 BROWSE ${carCount} SPORTS CARS
Use our Car Selector to find your perfect match based on 7 priorities you actually care about.

🤖 MEET AL — YOUR AI CAR EXPERT
Ask anything—specs, reliability issues, best mods. Real answers, no gatekeeping.

🚗 MY GARAGE
Save favorites, add your rides with VIN decode, track service history, and monitor market value.

🔧 TUNING SHOP
Plan your build with real dyno data, lap times, and parts that actually fit.

📍 COMMUNITY & EVENTS
Find Cars & Coffee, track days, car shows, and meetups near you.

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
};

/**
 * Check if user can receive a specific email type
 */
async function canSendEmail(userId, templateSlug, recipientEmail) {
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
export async function sendTemplateEmail({ to, templateSlug, variables = {}, userId = null, metadata = {} }) {
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
  const { data: profile } = await supabaseAdmin
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
export async function sendReferralInviteEmail(friendEmail, referrerName, referralLink, bonusCredits = 200) {
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
 * Queue an email for later sending
 */
export async function queueEmail({ userId, email, templateSlug, variables = {}, scheduledFor, priority = 0, metadata = {} }) {
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
  
  // Get pending emails scheduled for now or earlier
  const { data: queuedEmails, error } = await supabaseAdmin
    .from('email_queue')
    .select('*')
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
          .eq('id', (
            await supabaseAdmin.auth.admin.listUsers({ filter: { email: data.to } })
          ).data?.users?.[0]?.id);
      }
      break;
    default:
      console.log(`[Email Webhook] Unhandled event type: ${type}`);
      return;
  }

  if (Object.keys(updates).length > 0) {
    await supabaseAdmin
      .from('email_logs')
      .update(updates)
      .eq('resend_id', emailId);
  }
}

export { EMAIL_CONFIG, EMAIL_TEMPLATES };

