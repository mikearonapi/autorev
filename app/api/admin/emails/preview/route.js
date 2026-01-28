/**
 * Email Preview API
 * 
 * Returns rendered HTML preview of email templates for admin review.
 * Uses the canonical templates from lib/email.js (single source of truth).
 * 
 * GET /api/admin/emails/preview?template=welcome
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { requireAdmin } from '@/lib/adminAccess';
import { generateWelcomeEmailHtml, EMAIL_TEMPLATES } from '@/lib/emailService';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { generateUnsubscribeToken } from '@/lib/unsubscribeToken';

// Force dynamic rendering - this route uses request.headers and request.url
export const dynamic = 'force-dynamic';

// For local dev, use localhost; for production, use the production URL
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://autorev.app';

/**
 * Get image base URL from request (for local dev support)
 */
function getImageBaseUrl(requestUrl) {
  try {
    const url = new URL(requestUrl);
    if (url.hostname === 'localhost') {
      return `${url.protocol}//${url.host}`;
    }
  } catch {}
  return SITE_URL;
}

/**
 * Generate inactivity 7-day email HTML - Strategic re-engagement focused on AL
 */
function generateInactivity7dHtml(vars, baseUrl) {
  // Extract first name only (handles "Cory Hughes" → "Cory")
  const rawName = vars.user_name || 'there';
  const userName = rawName.split(' ')[0];
  const alUrl = `${baseUrl}/al`;
  const year = new Date().getFullYear();
  const carCount = vars.car_count || 310; // Updated 2026-01-22: actual count 310 cars
  
  return `
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
              <img src="${baseUrl}/images/autorev-email-logo.png" alt="AutoRev" width="60" height="60" style="display: block;">
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
                          <img src="${baseUrl}/images/al-mascot.png" alt="AL" width="48" height="48" style="display: block; width: 48px; height: 48px; border-radius: 12px;">
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
                Or <a href="${baseUrl}/events" style="color: #4b5563; text-decoration: underline;">find a Cars & Coffee near you</a> · <a href="${baseUrl}/browse-cars" style="color: #4b5563; text-decoration: underline;">explore ${carCount} sports cars</a>
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #f9fafb; padding: 24px 24px; border-top: 1px solid #f3f4f6; border-radius: 0 0 16px 16px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af;">
                © ${year} AutoRev · <a href="${baseUrl}/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy</a> · <a href="${baseUrl}/terms" style="color: #9ca3af; text-decoration: underline;">Terms</a>
              </p>
              <a href="${baseUrl}/unsubscribe?token=${generateUnsubscribeToken(vars.email || 'preview@example.com')}" style="font-size: 11px; color: #9ca3af; text-decoration: underline;">
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
</html>`;
}

/**
 * Generate inactivity 21-day email HTML - Events focused win-back
 */
function generateInactivity21dHtml(vars, baseUrl) {
  const rawName = vars.user_name || 'there';
  const userName = rawName.split(' ')[0];
  const eventsUrl = `${baseUrl}/events`;
  const year = new Date().getFullYear();
  const eventCount = vars.event_count || 940;
  
  return `
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
    body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f3f4f6; }
    @media screen and (max-width: 600px) {
      .wrapper { padding: 12px !important; }
      .container { width: 100% !important; max-width: 100% !important; }
      .content { padding: 24px 20px !important; }
      .hero-image { width: 100% !important; max-width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${eventCount}+ car events. Cars & Coffee, track days, meetups—find one near you.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" class="wrapper" style="padding: 40px 20px;">
        
        <table role="presentation" class="container" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <tr>
            <td align="center" style="padding: 40px 0 32px 0; border-bottom: 1px solid #f3f4f6;">
              <img src="${baseUrl}/images/autorev-email-logo.png" alt="AutoRev" width="60" height="60" style="display: block;">
            </td>
          </tr>
          
          <tr>
            <td class="content" style="padding: 24px 40px 40px 40px;">
              
              <p style="margin: 0 0 20px 0; font-size: 24px; font-weight: 700; color: #1f2937; text-align: left;">
                Hey ${userName},
              </p>
              
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                Quick thought: when's the last time you went to a car meet?
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                We've got <strong>${eventCount}+ events</strong> in our database—Cars & Coffee, track days, car shows, rallies. There's probably something happening near you this weekend.
              </p>
              
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
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${eventsUrl}" target="_blank" style="display: inline-block; background-color: #111827; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px; border: 1px solid #111827;">
                      Find Events Near Me →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 22px; color: #9ca3af; text-align: center;">
                Or <a href="${baseUrl}/al" style="color: #4b5563; text-decoration: underline;">ask AL for recommendations</a>
              </p>
              
            </td>
          </tr>
          
          <tr>
            <td align="center" style="background-color: #f9fafb; padding: 24px 24px; border-top: 1px solid #f3f4f6; border-radius: 0 0 16px 16px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af;">
                © ${year} AutoRev · <a href="${baseUrl}/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy</a> · <a href="${baseUrl}/terms" style="color: #9ca3af; text-decoration: underline;">Terms</a>
              </p>
              <a href="${baseUrl}/unsubscribe?token=${generateUnsubscribeToken(vars.email || 'preview@example.com')}" style="font-size: 11px; color: #9ca3af; text-decoration: underline;">
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
</html>`;
}

/**
 * Generate referral reward email HTML
 */
function generateReferralRewardHtml(vars, baseUrl) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>You earned AL credits!</title>
  <style>
    body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; max-width: 100% !important; }
      .content { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${vars.friend_name || 'Your friend'} joined AutoRev! ${vars.credits_earned || 200} credits have been added to your account.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        
        <table role="presentation" class="container" width="480" cellpadding="0" cellspacing="0" style="max-width: 480px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #D4AF37 0%, #B8973A 100%); padding: 32px 40px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 48px;">🎁</p>
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #1f2937; text-transform: uppercase;">
                Referral Reward!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content" style="padding: 40px; text-align: center;">
              <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 600; color: #1f2937;">
                ${vars.friend_name || 'Your friend'} joined AutoRev!
              </h2>
              
              <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.6; color: #4b5563;">
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

              <a href="${baseUrl}/al" style="display: inline-block; padding: 14px 36px; background-color: #111827; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
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
</html>`;
}

/**
 * Generate referral invite email HTML (matches Welcome email style)
 */
function generateReferralInviteHtml(vars, baseUrl) {
  const referrerName = vars.referrer_name || 'Your friend';
  const bonusCredits = vars.bonus_credits || 200;
  const referralLink = vars.referral_link || baseUrl;
  const carCount = vars.car_count || 310; // Updated 2026-01-22: actual count 310 cars
  const year = new Date().getFullYear();
  
  return `<!DOCTYPE html>
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
              <img src="${baseUrl}/images/autorev-email-logo.png" alt="AutoRev" width="60" height="60" style="display: block; margin-bottom: 16px;">
              <p style="margin: 0; font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #1f2937; text-transform: uppercase;">You're Invited</p>
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
                     <img src="${baseUrl}/images/al-mascot.png" alt="AL" width="40" height="40" style="display: block; width: 40px; height: 40px; border-radius: 10px; background-color: #f3f4f6;">
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
 * Preview templates - uses canonical templates from lib/email.js where available
 */
const PREVIEW_TEMPLATES = {
  welcome: { 
    render: (vars, imageBaseUrl) => generateWelcomeEmailHtml(vars, imageBaseUrl), 
    subject: 'Welcome to AutoRev — Find What Drives You' 
  },
  'inactivity-7d': { 
    render: (vars, imageBaseUrl) => generateInactivity7dHtml(vars, imageBaseUrl), 
    subject: 'Quick question for you' 
  },
  'inactivity-21d': { 
    render: (vars, imageBaseUrl) => generateInactivity21dHtml(vars, imageBaseUrl), 
    subject: 'Events near you this weekend' 
  },
  'referral-reward': { 
    render: (vars, imageBaseUrl) => generateReferralRewardHtml(vars, imageBaseUrl), 
    subject: 'You earned 200 AL credits! 🎁' 
  },
  'referral-invite': { 
    render: (vars, imageBaseUrl) => generateReferralInviteHtml(vars, imageBaseUrl), 
    subject: 'Your friend thinks you\'d love AutoRev 🏎️' 
  },
  'feedback-response': { 
    render: (vars, imageBaseUrl) => {
      // Use canonical template from lib/email.js
      const template = EMAIL_TEMPLATES['feedback-response'];
      return template.render({ ...vars, imageBaseUrl }).html;
    }, 
    subject: 'Thanks for your feedback — We listened! 🎉' 
  },
};

/**
 * Check admin access with support for query param token (for new tab/window opens)
 * Falls back to query param if no Authorization header is present
 */
async function checkAdminWithQueryParam(request, searchParams) {
  // First try standard requireAdmin (checks Authorization header)
  const authHeader = request.headers.get('authorization');
  
  // If no auth header but token in query param, create a modified request
  if (!authHeader && searchParams?.get('token')) {
    const token = searchParams.get('token');
    // Create new headers with Authorization
    const newHeaders = new Headers(request.headers);
    newHeaders.set('authorization', `Bearer ${token}`);
    
    // Create a new request with the modified headers
    const modifiedRequest = new Request(request.url, {
      method: request.method,
      headers: newHeaders,
    });
    
    return requireAdmin(modifiedRequest);
  }
  
  // Otherwise use standard requireAdmin
  return requireAdmin(request);
}

async function handleGet(request) {
  try {
    const { searchParams } = new URL(request.url);
    const templateSlug = searchParams.get('template') || 'welcome';
    
    // Check admin auth (supports token in header or query param)
    const denied = await checkAdminWithQueryParam(request, searchParams);
    if (denied) return denied;

    const template = PREVIEW_TEMPLATES[templateSlug];
    
    if (!template) {
      return NextResponse.json({ 
        error: 'Template not found',
        available: Object.keys(PREVIEW_TEMPLATES)
      }, { status: 404 });
    }

    // Calculate image base URL from request (for local dev support)
    const imageBaseUrl = getImageBaseUrl(request.url);

    // Fetch actual car count from database
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
    
    // Fetch actual counts from database
    const [{ count: carCount }, { count: eventCount }] = await Promise.all([
      supabaseAdmin.from('cars').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('events').select('*', { count: 'exact', head: true })
    ]);

    // Sample variables for preview (first name only, matching real behavior)
    const sampleVars = {
      user_name: 'Mike',  // Template will extract first name automatically
      login_url: imageBaseUrl,
      email: 'mike@example.com',
      friend_name: 'Jordan',
      credits_earned: 200,
      total_credits: 400,
      car_count: carCount || 310,  // Updated 2026-01-22: actual count 310 cars
      event_count: eventCount || 8000,  // Updated: actual count ~8,256 events
      // For referral-invite template
      referrer_name: 'Sarah',
      bonus_credits: 200,
      referral_link: `${imageBaseUrl}/?ref=SAMPLE123`,
      // For feedback-response template
      feedback_type: 'car_request', // Shows full car request preview
      car_name: '2024 BMW M3 CS',
      car_slug: 'bmw-m3-cs-2024',
      original_feedback: 'I would love to see the BMW M3 CS added to the database!',
    };

    const html = template.render(sampleVars, imageBaseUrl);

    // Return HTML directly for iframe preview
    if (searchParams.get('format') === 'html') {
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Return JSON with both formats
    return NextResponse.json({
      template: templateSlug,
      subject: template.subject,
      html,
    });

  } catch (err) {
    console.error('[Email Preview] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, { route: 'admin/emails/preview', feature: 'admin' });
