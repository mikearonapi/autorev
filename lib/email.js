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
 * Brand Guidelines:
 * - Primary: #1a4d6e (dark blue)
 * - Accent/Gold: #D4AF37
 * - Dark BG: #171717
 * - Font Display: Oswald (fallback to system)
 * - Font Body: Inter (fallback to system)
 * - Tone: Brotherhood over gatekeeping, excellence over ego
 */
const EMAIL_TEMPLATES = {
  welcome: {
    subject: 'Welcome to AutoRev — Find What Drives You',
    render: (vars) => ({
      html: `
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
              <!-- Logo -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <!-- Logo - White version for dark backgrounds (like social share) -->
                    <img src="${EMAIL_CONFIG.baseUrl}/images/autorev-logo-white.png" alt="AutoRev" width="100" style="display: block; margin: 0 auto 16px; width: 100px; height: auto;" />
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
                
                <!-- Feature 4: AL (Special highlight with mascot) -->
                <tr>
                  <td style="padding: 16px 20px; background: linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.04) 100%); border-radius: 10px; border-left: 3px solid #8b5cf6;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="52" valign="top">
                          <img src="${EMAIL_CONFIG.baseUrl}/images/al-mascot.png" alt="AL" width="44" height="44" style="display: block; width: 44px; height: 44px; border-radius: 22px; object-fit: cover; border: 2px solid rgba(139,92,246,0.3);" />
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
                    <a href="${vars.login_url || EMAIL_CONFIG.baseUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #D4AF37 0%, #B8973A 100%); color: #171717; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 4px 16px rgba(212,175,55,0.3);">
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
                    <a href="${EMAIL_CONFIG.baseUrl}" style="color: rgba(255,255,255,0.35); font-size: 12px; text-decoration: none;">Web</a>
                  </td>
                  <td style="color: rgba(255,255,255,0.15);">·</td>
                  <td style="padding: 0 8px;">
                    <a href="${EMAIL_CONFIG.baseUrl}/contact" style="color: rgba(255,255,255,0.35); font-size: 12px; text-decoration: none;">Contact</a>
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
</html>`,
      text: `AUTOREV — Find What Drives You
================================

Welcome${vars.user_name ? `, ${vars.user_name}` : ''}! 🏁

You've just joined a community that celebrates every enthusiast—from the weekend warrior with a $3K Miata to the collector with a GT3RS.

No flex culture. No gatekeeping. Just honest guidance and genuine community.

---

🔍 RESEARCH
Deep-dive into 98 sports cars with real specs, owner insights, and honest reviews.

🚗 MY GARAGE
Track your rides, decode VINs, get recall alerts, and log service history.

🔧 PLAN BUILDS
Visualize power gains, explore parts, and see real dyno data before you wrench.

✨ ASK AL
Your AI car expert. Get instant answers about specs, issues, and modifications.

---

Start exploring: ${vars.login_url || EMAIL_CONFIG.baseUrl}

Questions? Just reply to this email—we read every one.

© ${new Date().getFullYear()} AutoRev · Built for enthusiasts, by enthusiasts`,
    }),
  },

  'inactivity-7d': {
    subject: 'Your garage is waiting 🏁',
    render: (vars) => ({
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>Your garage is waiting</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
  
  <div style="display: none; max-height: 0; overflow: hidden;">
    It's been a week—here's what's new in the sports car world.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: #171717; border-radius: 16px; overflow: hidden; box-shadow: 0 24px 48px rgba(0,0,0,0.4);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a4d6e 0%, #0f3347 100%); padding: 40px 40px; text-align: center;">
              <img src="${EMAIL_CONFIG.baseUrl}/images/autorev-logo-white.png" alt="AutoRev" width="100" style="display: block; margin: 0 auto 16px; width: 100px; height: auto;" />
              <h1 style="margin: 0; font-family: 'Oswald', Impact, Arial, sans-serif; font-size: 36px; font-weight: 700; letter-spacing: 3px; color: #D4AF37; text-transform: uppercase;">AutoRev</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #ffffff;">
                Hey${vars.user_name ? ` ${vars.user_name}` : ''},
              </h2>
              
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: rgba(255,255,255,0.7);">
                It's been a week since your last visit. Your garage is still here, ready when you are.
              </p>

              <p style="margin: 0 0 20px; font-size: 14px; font-weight: 600; color: #D4AF37; text-transform: uppercase; letter-spacing: 1px;">
                While you were away:
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                <tr>
                  <td style="padding: 12px 16px; background: rgba(255,255,255,0.04); border-radius: 8px; border-left: 2px solid #D4AF37;">
                    <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.7);">✨ New insights from enthusiast discussions</p>
                  </td>
                </tr>
                <tr><td height="8"></td></tr>
                <tr>
                  <td style="padding: 12px 16px; background: rgba(255,255,255,0.04); border-radius: 8px; border-left: 2px solid #1a4d6e;">
                    <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.7);">📊 Updated market data and pricing trends</p>
                  </td>
                </tr>
                <tr><td height="8"></td></tr>
                <tr>
                  <td style="padding: 12px 16px; background: rgba(255,255,255,0.04); border-radius: 8px; border-left: 2px solid #22c55e;">
                    <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.7);">🏎️ Car events happening near you</p>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${vars.login_url || EMAIL_CONFIG.baseUrl}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #D4AF37 0%, #B8973A 100%); color: #171717; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 16px rgba(212,175,55,0.3);">
                      Come Back & Explore
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background: rgba(0,0,0,0.2); text-align: center;">
              <p style="margin: 0 0 8px; font-size: 12px; color: rgba(255,255,255,0.35);">
                © ${new Date().getFullYear()} AutoRev · Built for enthusiasts
              </p>
              <a href="${EMAIL_CONFIG.baseUrl}/unsubscribe?email=${encodeURIComponent(vars.email || '')}" style="font-size: 11px; color: rgba(255,255,255,0.25); text-decoration: none;">
                Unsubscribe from these emails
              </a>
            </td>
          </tr>

        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>`,
      text: `Hey${vars.user_name ? ` ${vars.user_name}` : ''},

It's been a week since your last visit. Your garage is still here, ready when you are.

WHILE YOU WERE AWAY:
✨ New insights from enthusiast discussions
📊 Updated market data and pricing trends
🏎️ Car events happening near you

Come back and explore: ${vars.login_url || EMAIL_CONFIG.baseUrl}

---
© ${new Date().getFullYear()} AutoRev · Built for enthusiasts

Unsubscribe: ${EMAIL_CONFIG.baseUrl}/unsubscribe?email=${encodeURIComponent(vars.email || '')}`,
    }),
  },

  'referral-reward': {
    subject: 'You earned ${vars?.credits_earned || 500} AL credits! 🎁',
    render: (vars) => ({
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>You earned AL credits!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
  
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${vars.friend_name || 'Your friend'} joined AutoRev! ${vars.credits_earned || 500} credits have been added to your account.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background: #171717; border-radius: 16px; overflow: hidden; box-shadow: 0 24px 48px rgba(0,0,0,0.4);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #D4AF37 0%, #B8973A 100%); padding: 32px 40px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 48px;">🎁</p>
              <h1 style="margin: 0; font-family: 'Oswald', Impact, Arial, sans-serif; font-size: 28px; font-weight: 700; color: #171717; text-transform: uppercase;">
                Referral Reward!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px; text-align: center;">
              <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 600; color: #ffffff;">
                ${vars.friend_name || 'Your friend'} joined AutoRev!
              </h2>
              
              <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.6; color: rgba(255,255,255,0.7);">
                Thanks for spreading the word. Brotherhood over gatekeeping, right?
              </p>

              <!-- Credits Badge -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                <tr>
                  <td style="padding: 24px; background: linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%); border-radius: 12px; border: 1px solid rgba(212,175,55,0.2);">
                    <p style="margin: 0 0 4px; font-size: 12px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px;">
                      Credits Earned
                    </p>
                    <p style="margin: 0 0 16px; font-size: 42px; font-weight: 700; color: #D4AF37; line-height: 1;">
                      +${vars.credits_earned || 500}
                    </p>
                    <div style="height: 1px; background: rgba(255,255,255,0.1); margin: 0 0 16px;"></div>
                    <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.4);">
                      Total Balance: <strong style="color: #D4AF37;">${vars.total_credits || 500} credits</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px; font-size: 14px; color: rgba(255,255,255,0.5);">
                Use your credits to chat with AL, your AI car expert.
              </p>

              <a href="${EMAIL_CONFIG.baseUrl}/al" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #D4AF37 0%, #B8973A 100%); color: #171717; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 16px rgba(212,175,55,0.3);">
                Chat with AL →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background: rgba(0,0,0,0.2); text-align: center;">
              <p style="margin: 0 0 8px; font-size: 12px; color: rgba(255,255,255,0.35);">
                Keep sharing—earn ${vars.credits_earned || 500} credits for each friend who joins.
              </p>
              <p style="margin: 0; font-size: 11px; color: rgba(255,255,255,0.25);">
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

CREDITS EARNED: +${vars.credits_earned || 500}
TOTAL BALANCE: ${vars.total_credits || 500} credits

Use your credits to chat with AL, your AI car expert.

Chat with AL: ${EMAIL_CONFIG.baseUrl}/al

---
Keep sharing—earn ${vars.credits_earned || 500} credits for each friend who joins.

© ${new Date().getFullYear()} AutoRev · Built for enthusiasts`,
    }),
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
      user_name: userName?.split(' ')[0], // First name only
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

