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
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Welcome to AutoRev</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    .fallback-font { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Inter:wght@400;500;600&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
  
  <!-- Preview Text (hidden) -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    Your sports car journey starts here. Research 98+ cars, track your rides, plan builds, and join a community that lifts up every enthusiast.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        
        <!-- Main Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background: #171717; border-radius: 16px; overflow: hidden; box-shadow: 0 24px 48px rgba(0,0,0,0.4);">
          
          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a4d6e 0%, #0f3347 50%, #171717 100%); padding: 48px 40px 56px; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <!-- Logo - White version for dark backgrounds (like social share) -->
                    <img src="${SITE_URL}/images/autorev-logo-white.png" alt="AutoRev" width="100" style="display: block; margin: 0 auto 16px; width: 100px; height: auto;" />
                    <h1 style="margin: 0; font-family: 'Oswald', Impact, Arial, sans-serif; font-size: 48px; font-weight: 700; letter-spacing: 3px; color: #D4AF37; text-transform: uppercase;">
                      AutoRev
                    </h1>
                    <p style="margin: 10px 0 0; font-size: 14px; color: rgba(255,255,255,0.6); letter-spacing: 4px; text-transform: uppercase;">
                      Find What Drives You
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Welcome Hero - Darker background -->
          <tr>
            <td style="padding: 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: -32px; background: linear-gradient(180deg, rgba(30,30,30,0.95) 0%, rgba(23,23,23,0.98) 100%); border-radius: 12px; border: 1px solid rgba(212,175,55,0.3);">
                <tr>
                  <td style="padding: 28px 24px; text-align: center;">
                    <p style="margin: 0 0 4px; font-size: 14px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px;">
                      Welcome${vars.user_name ? ' aboard' : ''}
                    </p>
                    <h2 style="margin: 0; font-family: 'Inter', -apple-system, sans-serif; font-size: 26px; font-weight: 600; color: #ffffff;">
                      ${vars.user_name ? vars.user_name : "You're In"} 🏁
                    </h2>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: rgba(255,255,255,0.85);">
                You've just joined a community that celebrates every enthusiast—from the weekend warrior with a $3K Miata to the collector with a GT3RS.
              </p>
              
              <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.7; color: rgba(255,255,255,0.7);">
                <strong style="color: #D4AF37;">No flex culture. No gatekeeping.</strong> Just honest guidance and genuine community.
              </p>

              <!-- Feature Cards -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                
                <!-- Feature 1: Research -->
                <tr>
                  <td style="padding: 16px 20px; background: rgba(255,255,255,0.04); border-radius: 10px; border-left: 3px solid #D4AF37;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="44" valign="top">
                          <div style="width: 36px; height: 36px; background: rgba(212,175,55,0.15); border-radius: 8px; text-align: center; line-height: 36px; font-size: 18px;">🔍</div>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #ffffff;">Research</p>
                          <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.55); line-height: 1.5;">Deep-dive into 98 sports cars with real specs, owner insights, and honest reviews.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <tr><td height="12"></td></tr>
                
                <!-- Feature 2: Garage -->
                <tr>
                  <td style="padding: 16px 20px; background: rgba(255,255,255,0.04); border-radius: 10px; border-left: 3px solid #1a4d6e;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="44" valign="top">
                          <div style="width: 36px; height: 36px; background: rgba(26,77,110,0.2); border-radius: 8px; text-align: center; line-height: 36px; font-size: 18px;">🚗</div>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #ffffff;">My Garage</p>
                          <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.55); line-height: 1.5;">Track your rides, decode VINs, get recall alerts, and log service history.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <tr><td height="12"></td></tr>
                
                <!-- Feature 3: Build -->
                <tr>
                  <td style="padding: 16px 20px; background: rgba(255,255,255,0.04); border-radius: 10px; border-left: 3px solid #22c55e;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="44" valign="top">
                          <div style="width: 36px; height: 36px; background: rgba(34,197,94,0.15); border-radius: 8px; text-align: center; line-height: 36px; font-size: 18px;">🔧</div>
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #ffffff;">Plan Builds</p>
                          <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.55); line-height: 1.5;">Visualize power gains, explore parts, and see real dyno data before you wrench.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <tr><td height="12"></td></tr>
                
                <!-- Feature 4: Meet AL -->
                <tr>
                  <td style="padding: 16px 20px; background: rgba(255,255,255,0.04); border-radius: 10px; border-left: 3px solid #8b5cf6;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="44" valign="top">
                          <img src="${SITE_URL}/images/al-mascot.png" alt="AL" width="36" height="36" style="width: 36px; height: 36px; border-radius: 8px; object-fit: cover;" />
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #ffffff;">Meet AL ✨</p>
                          <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.55); line-height: 1.5;">Your AI car expert. Get instant answers about specs, common issues, and the best mods.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Section -->
          <tr>
            <td style="padding: 8px 40px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${vars.login_url || SITE_URL}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #D4AF37 0%, #B8973A 100%); color: #171717; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 4px 16px rgba(212,175,55,0.3);">
                      Start Exploring →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 13px; color: rgba(255,255,255,0.4);">
                Questions? Just reply to this email—we read every one.
              </p>
              <p style="margin: 0 0 16px; font-size: 12px; color: rgba(255,255,255,0.25);">
                © ${new Date().getFullYear()} AutoRev · Built for enthusiasts, by enthusiasts
              </p>
              
              <!-- Social Links -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="padding: 0 8px;">
                    <a href="${SITE_URL}" style="color: rgba(255,255,255,0.35); font-size: 12px; text-decoration: none;">Web</a>
                  </td>
                  <td style="color: rgba(255,255,255,0.15);">·</td>
                  <td style="padding: 0 8px;">
                    <a href="${SITE_URL}/contact" style="color: rgba(255,255,255,0.35); font-size: 12px; text-decoration: none;">Contact</a>
                  </td>
                </tr>
              </table>
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

