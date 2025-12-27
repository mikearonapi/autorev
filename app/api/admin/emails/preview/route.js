/**
 * Email Preview API
 * 
 * Returns rendered HTML preview of email templates for admin review.
 * 
 * GET /api/admin/emails/preview?template=welcome
 */

import { NextResponse } from 'next/server';
import { createAuthenticatedClient, getBearerToken } from '@/lib/supabaseServer';
import { createClient } from '@supabase/supabase-js';

// For local dev, use localhost; for production, use the production URL
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://autorev.app';
// Image URL - in dev, this will be dynamically set based on the request
const getImageUrl = (requestUrl, imagePath) => {
  // Extract host from request for local preview to work
  try {
    const url = new URL(requestUrl);
    if (url.hostname === 'localhost') {
      return `${url.protocol}//${url.host}${imagePath}`;
    }
  } catch {}
  return `${SITE_URL}${imagePath}`;
};

/**
 * Email templates defined inline for preview (avoid circular dependency issues)
 */
function getWelcomeEmailHtml(vars, imageBaseUrl) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>Welcome to AutoRev</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Inter:wght@400;500;600&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
  
  <div style="display: none; max-height: 0; overflow: hidden;">
    Your sports car journey starts here. Research 98+ cars, track your rides, plan builds, and join a community that lifts up every enthusiast.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background: #171717; border-radius: 16px; overflow: hidden; box-shadow: 0 24px 48px rgba(0,0,0,0.4);">
          
          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a4d6e 0%, #0f3347 50%, #171717 100%); padding: 48px 40px 56px; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <!-- Logo - White version for dark backgrounds (like social share) -->
                    <img src="${imageBaseUrl}/images/autorev-logo-white.png" alt="AutoRev" width="100" style="display: block; margin: 0 auto 16px; width: 100px; height: auto;" />
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
                          <img src="${imageBaseUrl}/images/al-mascot.png" alt="AL" width="44" height="44" style="display: block; width: 44px; height: 44px; border-radius: 22px; object-fit: cover; border: 2px solid rgba(139,92,246,0.3);" />
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

function getInactivity7dHtml(vars, imageBaseUrl) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>Your garage is waiting</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: #171717; border-radius: 16px; overflow: hidden; box-shadow: 0 24px 48px rgba(0,0,0,0.4);">
          <tr>
            <td style="background: linear-gradient(135deg, #1a4d6e 0%, #0f3347 100%); padding: 40px 40px; text-align: center;">
              <img src="${imageBaseUrl}/images/autorev-logo-white.png" alt="AutoRev" width="100" style="display: block; margin: 0 auto 16px; width: 100px; height: auto;" />
              <h1 style="margin: 0; font-family: 'Oswald', Impact, Arial, sans-serif; font-size: 36px; font-weight: 700; letter-spacing: 3px; color: #D4AF37; text-transform: uppercase;">AutoRev</h1>
            </td>
          </tr>
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
                    <a href="${vars.login_url || SITE_URL}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #D4AF37 0%, #B8973A 100%); color: #171717; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 16px rgba(212,175,55,0.3);">
                      Come Back & Explore
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background: rgba(0,0,0,0.2); text-align: center;">
              <p style="margin: 0 0 8px; font-size: 12px; color: rgba(255,255,255,0.35);">
                © ${new Date().getFullYear()} AutoRev · Built for enthusiasts
              </p>
              <a href="${SITE_URL}/unsubscribe?email=${encodeURIComponent(vars.email || '')}" style="font-size: 11px; color: rgba(255,255,255,0.25); text-decoration: none;">
                Unsubscribe from these emails
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function getReferralRewardHtml(vars, imageBaseUrl) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>You earned AL credits!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background: #171717; border-radius: 16px; overflow: hidden; box-shadow: 0 24px 48px rgba(0,0,0,0.4);">
          <tr>
            <td style="background: linear-gradient(135deg, #D4AF37 0%, #B8973A 100%); padding: 32px 40px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 48px;">🎁</p>
              <h1 style="margin: 0; font-family: 'Oswald', Impact, Arial, sans-serif; font-size: 28px; font-weight: 700; color: #171717; text-transform: uppercase;">
                Referral Reward!
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px; text-align: center;">
              <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 600; color: #ffffff;">
                ${vars.friend_name || 'Your friend'} joined AutoRev!
              </h2>
              <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.6; color: rgba(255,255,255,0.7);">
                Thanks for spreading the word. Brotherhood over gatekeeping, right?
              </p>
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
              <a href="${SITE_URL}/al" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #D4AF37 0%, #B8973A 100%); color: #171717; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 16px rgba(212,175,55,0.3);">
                Chat with AL →
              </a>
            </td>
          </tr>
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
</html>`;
}

const PREVIEW_TEMPLATES = {
  welcome: { render: (vars, imageBaseUrl) => getWelcomeEmailHtml(vars, imageBaseUrl), subject: 'Welcome to AutoRev — Find What Drives You' },
  'inactivity-7d': { render: (vars, imageBaseUrl) => getInactivity7dHtml(vars, imageBaseUrl), subject: 'Your garage is waiting 🏁' },
  'referral-reward': { render: (vars, imageBaseUrl) => getReferralRewardHtml(vars, imageBaseUrl), subject: 'You earned 500 AL credits! 🎁' },
};

/**
 * Check if user is admin
 */
async function isAdmin(request) {
  try {
    const bearerToken = getBearerToken(request);
    if (!bearerToken) return false;
    
    const supabase = createAuthenticatedClient(bearerToken);
    if (!supabase) return false;
    
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return false;
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();
    
    return profile?.subscription_tier === 'admin';
  } catch {
    return false;
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const templateSlug = searchParams.get('template') || 'welcome';
    
    // Allow preview without auth for development convenience
    // In production, you might want to add IP restrictions or similar
    const skipAuth = searchParams.get('dev') === 'preview';
    
    if (!skipAuth && !await isAdmin(request)) {
      return NextResponse.json({ error: 'Admin access required. Add ?dev=preview for development.' }, { status: 403 });
    }

    const template = PREVIEW_TEMPLATES[templateSlug];
    
    if (!template) {
      return NextResponse.json({ 
        error: 'Template not found',
        available: Object.keys(PREVIEW_TEMPLATES)
      }, { status: 404 });
    }

    // Calculate image base URL from request (for local dev support)
    const url = new URL(request.url);
    const imageBaseUrl = url.hostname === 'localhost' 
      ? `${url.protocol}//${url.host}` 
      : SITE_URL;

    // Sample variables for preview
    const sampleVars = {
      user_name: 'Alex',
      login_url: imageBaseUrl,
      email: 'alex@example.com',
      friend_name: 'Jordan',
      credits_earned: 500,
      total_credits: 1500,
      car_count: 3,
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
    return NextResponse.json({ error: 'Internal server error', message: err.message }, { status: 500 });
  }
}

