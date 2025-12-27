#!/usr/bin/env node
/**
 * Send test welcome emails
 * Usage: node scripts/send-test-welcome-email.js email1@example.com email2@example.com
 */

import { Resend } from 'resend';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://autorev.app';

function getWelcomeEmailHtml(vars) {
  const userName = vars.user_name || 'there';
  const loginUrl = vars.login_url || SITE_URL;
  const year = new Date().getFullYear();
  
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>Welcome to AutoRev</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style>
    table { border-collapse: collapse; }
    td { font-family: Arial, sans-serif; }
  </style>
  <![endif]-->
  <style type="text/css">
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    
    /* Mobile styles */
    @media only screen and (max-width: 600px) {
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
      .mobile-center { text-align: center !important; }
      .mobile-full { width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0 !important; padding: 0 !important; background-color: #1a1a1a;">
  
  <!-- Preview text -->
  <div style="display: none; font-size: 1px; color: #1a1a1a; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Your sports car journey starts here. Research 98+ cars, track your rides, plan builds, and join a community that celebrates every enthusiast.
  </div>
  
  <!-- Wrapper table for full-width background -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1a1a1a;" bgcolor="#1a1a1a">
    <tr>
      <td align="center" valign="top" style="padding: 40px 10px;" bgcolor="#1a1a1a">
        
        <!-- Main container - 560px max -->
        <table border="0" cellpadding="0" cellspacing="0" width="560" class="mobile-full" style="max-width: 560px; background-color: #242424; border-radius: 12px;" bgcolor="#242424">
          
          <!-- HEADER -->
          <tr>
            <td align="center" style="padding: 40px 30px; background-color: #1a4d6e; border-radius: 12px 12px 0 0;" bgcolor="#1a4d6e" class="mobile-padding">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <!-- Logo -->
                    <img src="${SITE_URL}/images/autorev-logo-white.png" alt="AutoRev Logo" width="90" height="90" style="display: block; width: 90px; height: 90px; margin-bottom: 16px;">
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family: 'Trebuchet MS', Arial, sans-serif; font-size: 36px; font-weight: bold; color: #D4AF37; letter-spacing: 2px; text-transform: uppercase;">
                    AUTOREV
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 8px; font-family: Arial, sans-serif; font-size: 12px; color: #94a3b8; letter-spacing: 3px; text-transform: uppercase;">
                    FIND WHAT DRIVES YOU
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- WELCOME BANNER -->
          <tr>
            <td align="center" style="padding: 30px 30px 20px 30px; background-color: #242424;" bgcolor="#242424" class="mobile-padding">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #2d2d2d; border-radius: 10px; border: 1px solid #D4AF37;" bgcolor="#2d2d2d">
                <tr>
                  <td align="center" style="padding: 24px 20px;">
                    <p style="margin: 0 0 6px 0; font-family: Arial, sans-serif; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
                      Welcome aboard
                    </p>
                    <h2 style="margin: 0; font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; color: #ffffff;">
                      Hey ${userName}!
                    </h2>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- MAIN CONTENT -->
          <tr>
            <td style="padding: 10px 30px 30px 30px; background-color: #242424;" bgcolor="#242424" class="mobile-padding">
              
              <!-- Intro text -->
              <p style="margin: 0 0 20px 0; font-family: Arial, sans-serif; font-size: 16px; line-height: 26px; color: #e5e5e5;">
                You've just joined a community that celebrates every enthusiast—from the weekend warrior with a $3K Miata to the collector with a GT3RS.
              </p>
              
              <p style="margin: 0 0 30px 0; font-family: Arial, sans-serif; font-size: 16px; line-height: 26px; color: #a3a3a3;">
                <strong style="color: #D4AF37;">No flex culture. No gatekeeping.</strong> Just honest guidance and genuine community.
              </p>
              
              <!-- FEATURE CARDS -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                
                <!-- Research -->
                <tr>
                  <td style="padding: 16px; background-color: #2d2d2d; border-radius: 8px; border-left: 4px solid #D4AF37;" bgcolor="#2d2d2d">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="50" valign="top" style="padding-right: 12px;">
                          <div style="width: 40px; height: 40px; background-color: #3d3520; border-radius: 8px; text-align: center; line-height: 40px; font-size: 20px;">
                            &#128269;
                          </div>
                        </td>
                        <td valign="top">
                          <p style="margin: 0 0 4px 0; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; color: #ffffff;">Research</p>
                          <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 20px; color: #a3a3a3;">Deep-dive into 98 sports cars with real specs, owner insights, and honest reviews.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <tr><td height="12"></td></tr>
                
                <!-- Garage -->
                <tr>
                  <td style="padding: 16px; background-color: #2d2d2d; border-radius: 8px; border-left: 4px solid #1a4d6e;" bgcolor="#2d2d2d">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="50" valign="top" style="padding-right: 12px;">
                          <div style="width: 40px; height: 40px; background-color: #1e3a4d; border-radius: 8px; text-align: center; line-height: 40px; font-size: 20px;">
                            &#128663;
                          </div>
                        </td>
                        <td valign="top">
                          <p style="margin: 0 0 4px 0; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; color: #ffffff;">My Garage</p>
                          <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 20px; color: #a3a3a3;">Track your rides, decode VINs, get recall alerts, and log service history.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <tr><td height="12"></td></tr>
                
                <!-- Build -->
                <tr>
                  <td style="padding: 16px; background-color: #2d2d2d; border-radius: 8px; border-left: 4px solid #22c55e;" bgcolor="#2d2d2d">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="50" valign="top" style="padding-right: 12px;">
                          <div style="width: 40px; height: 40px; background-color: #1a3d2a; border-radius: 8px; text-align: center; line-height: 40px; font-size: 20px;">
                            &#128295;
                          </div>
                        </td>
                        <td valign="top">
                          <p style="margin: 0 0 4px 0; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; color: #ffffff;">Plan Builds</p>
                          <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 20px; color: #a3a3a3;">Visualize power gains, explore parts, and see real dyno data before you wrench.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <tr><td height="12"></td></tr>
                
                <!-- Meet AL -->
                <tr>
                  <td style="padding: 16px; background-color: #2d2d2d; border-radius: 8px; border-left: 4px solid #8b5cf6;" bgcolor="#2d2d2d">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="50" valign="top" style="padding-right: 12px;">
                          <img src="${SITE_URL}/images/al-mascot.png" alt="AL" width="40" height="40" style="display: block; width: 40px; height: 40px; border-radius: 8px;">
                        </td>
                        <td valign="top">
                          <p style="margin: 0 0 4px 0; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; color: #ffffff;">Meet AL</p>
                          <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 20px; color: #a3a3a3;">Your AI car expert. Get instant answers about specs, common issues, and the best mods.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
              </table>
              
            </td>
          </tr>
          
          <!-- CTA BUTTON -->
          <tr>
            <td align="center" style="padding: 0 30px 40px 30px; background-color: #242424;" bgcolor="#242424" class="mobile-padding">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #D4AF37;" bgcolor="#D4AF37">
                    <a href="${loginUrl}" target="_blank" style="display: inline-block; padding: 16px 40px; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; color: #1a1a1a; text-decoration: none; border-radius: 8px;">
                      Start Exploring &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- DIVIDER -->
          <tr>
            <td style="padding: 0 30px; background-color: #242424;" bgcolor="#242424" class="mobile-padding">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="border-top: 1px solid #3d3d3d;"></td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding: 30px; background-color: #242424; border-radius: 0 0 12px 12px;" bgcolor="#242424" class="mobile-padding">
              <p style="margin: 0 0 8px 0; font-family: Arial, sans-serif; font-size: 13px; color: #737373;">
                Questions? Just reply to this email—we read every one.
              </p>
              <p style="margin: 0 0 16px 0; font-family: Arial, sans-serif; font-size: 12px; color: #525252;">
                &copy; ${year} AutoRev &middot; Built for enthusiasts, by enthusiasts
              </p>
              <p style="margin: 0; font-family: Arial, sans-serif; font-size: 12px;">
                <a href="${SITE_URL}" style="color: #737373; text-decoration: none;">Web</a>
                <span style="color: #525252;"> &middot; </span>
                <a href="${SITE_URL}/contact" style="color: #737373; text-decoration: none;">Contact</a>
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

async function sendWelcomeEmail(to, userName) {
  const html = getWelcomeEmailHtml({
    user_name: userName,
    login_url: SITE_URL,
  });

  console.log(`Sending welcome email to ${to}...`);

  const { data, error } = await resend.emails.send({
    from: 'AutoRev <hello@autorev.app>',
    to: [to],
    replyTo: 'support@autorev.app',
    subject: 'Welcome to AutoRev — Find What Drives You',
    html,
  });

  if (error) {
    console.error(`❌ Failed to send to ${to}:`, error);
    return { success: false, error };
  }

  console.log(`✅ Email sent to ${to}! ID: ${data.id}`);
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

console.log('🚀 Sending welcome emails...\n');

for (const email of emails) {
  await sendWelcomeEmail(email, 'there');
}

console.log('\n✨ Done!');

