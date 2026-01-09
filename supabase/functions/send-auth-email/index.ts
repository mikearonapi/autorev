/**
 * Supabase Auth Email Hook
 * 
 * Intercepts all auth-related emails (confirmation, recovery, magic link)
 * and sends them via Resend with beautiful branded templates.
 * 
 * Required secrets (set via Supabase Dashboard > Edge Functions > Secrets):
 * - RESEND_API_KEY: Your Resend API key
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// IMPORTANT: Always use the app URL, not Supabase's URL
const SITE_URL = "https://autorev.app";

// Logo URL - using a publicly hosted version for email reliability
const LOGO_URL = "https://autorev.app/images/autorev-logo-trimmed.png";

const EMAIL_CONFIG = {
  from: "AutoRev <hello@autorev.app>",
  replyTo: "support@autorev.app",
};

interface AuthEmailPayload {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      name?: string;
      display_name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: "signup" | "recovery" | "magiclink" | "email_change" | "invite";
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

/**
 * Build the action URL - ALWAYS use our app URL, never Supabase's
 */
function buildActionUrl(payload: AuthEmailPayload): string {
  const { email_data } = payload;
  const { token_hash, redirect_to, email_action_type } = email_data;
  
  const typeMap: Record<string, string> = {
    signup: "signup",
    recovery: "recovery",
    magiclink: "magiclink",
    email_change: "email_change",
    invite: "invite",
  };
  
  const type = typeMap[email_action_type] || email_action_type;
  
  // ALWAYS use SITE_URL (our app), not the payload's site_url (Supabase)
  const confirmUrl = new URL("/auth/confirm", SITE_URL);
  confirmUrl.searchParams.set("token_hash", token_hash);
  confirmUrl.searchParams.set("type", type);
  if (redirect_to) {
    confirmUrl.searchParams.set("next", redirect_to);
  }
  
  console.log(`[Auth Email] Built confirmation URL: ${confirmUrl.toString()}`);
  return confirmUrl.toString();
}

/**
 * Get user's display name from metadata
 */
function getUserName(user: AuthEmailPayload["user"]): string {
  const name = user.user_metadata?.display_name || 
               user.user_metadata?.full_name || 
               user.user_metadata?.name || 
               "there";
  console.log(`[Auth Email] User name resolved to: ${name}`);
  return name;
}

/**
 * Generate confirmation email HTML
 */
function generateConfirmationHtml(userName: string, confirmUrl: string): string {
  const year = new Date().getFullYear();
  const firstName = userName.split(" ")[0];
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Confirm Your Email - AutoRev</title>
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
    One click to confirm your email and join the AutoRev community.
  </div>
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" class="wrapper" style="padding: 40px 20px;">
        
        <table role="presentation" class="container" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <tr>
            <td align="center" style="padding: 40px 0 32px 0; border-bottom: 1px solid #f3f4f6;">
              <img src="${LOGO_URL}" alt="AutoRev" width="60" height="60" style="display: block; margin-bottom: 16px;">
              <p style="margin: 0; font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #1f2937; text-transform: uppercase;">Confirm Your Email</p>
            </td>
          </tr>
          
          <tr>
            <td class="content" style="padding: 32px 40px 40px 40px;">
              
              <p style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1f2937; text-align: left;">
                Hey ${firstName} 👋
              </p>
              
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                Thanks for signing up for AutoRev! Just one quick step—confirm your email address to unlock your account.
              </p>
              
              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                Click the button below to verify and start exploring sports car specs, reliability data, and a community that celebrates the passion—not the price tag.
              </p>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${confirmUrl}" target="_blank" style="display: inline-block; background-color: #111827; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px; border: 1px solid #111827;">
                      Confirm My Email →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 20px; color: #9ca3af; text-align: center;">
                Button not working? Copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px; line-height: 18px; color: #6b7280; text-align: center; word-break: break-all;">
                ${confirmUrl}
              </p>
              
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
          
          <tr>
            <td align="center" style="background-color: #f9fafb; padding: 24px 24px; border-top: 1px solid #f3f4f6; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${year} AutoRev · <a href="${SITE_URL}/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy</a> · <a href="${SITE_URL}/terms" style="color: #9ca3af; text-decoration: underline;">Terms</a>
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
 * Generate password recovery email HTML
 */
function generateRecoveryHtml(userName: string, recoveryUrl: string): string {
  const year = new Date().getFullYear();
  const firstName = userName.split(" ")[0];
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Reset Your Password - AutoRev</title>
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
    Reset your AutoRev password. This link expires in 24 hours.
  </div>
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" class="wrapper" style="padding: 40px 20px;">
        
        <table role="presentation" class="container" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <tr>
            <td align="center" style="padding: 40px 0 32px 0; border-bottom: 1px solid #f3f4f6;">
              <img src="${LOGO_URL}" alt="AutoRev" width="60" height="60" style="display: block; margin-bottom: 16px;">
              <p style="margin: 0; font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #1f2937; text-transform: uppercase;">Password Reset</p>
            </td>
          </tr>
          
          <tr>
            <td class="content" style="padding: 32px 40px 40px 40px;">
              
              <p style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1f2937; text-align: left;">
                Hey ${firstName},
              </p>
              
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                We received a request to reset your AutoRev password. Click the button below to create a new password.
              </p>
              
              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                If you didn't request this, you can safely ignore this email—your password will remain unchanged.
              </p>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${recoveryUrl}" target="_blank" style="display: inline-block; background-color: #111827; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px; border: 1px solid #111827;">
                      Reset Password →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 20px; color: #9ca3af; text-align: center;">
                Button not working? Copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px; line-height: 18px; color: #6b7280; text-align: center; word-break: break-all;">
                ${recoveryUrl}
              </p>
              
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
          
          <tr>
            <td align="center" style="background-color: #f9fafb; padding: 24px 24px; border-top: 1px solid #f3f4f6; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${year} AutoRev · <a href="${SITE_URL}/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy</a> · <a href="${SITE_URL}/terms" style="color: #9ca3af; text-decoration: underline;">Terms</a>
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
 * Generate magic link email HTML
 */
function generateMagicLinkHtml(userName: string, magicLinkUrl: string): string {
  const year = new Date().getFullYear();
  const firstName = userName.split(" ")[0];
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Your Login Link - AutoRev</title>
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
    Your one-click login link for AutoRev. Expires in 1 hour.
  </div>
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" class="wrapper" style="padding: 40px 20px;">
        
        <table role="presentation" class="container" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <tr>
            <td align="center" style="padding: 40px 0 32px 0; border-bottom: 1px solid #f3f4f6;">
              <img src="${LOGO_URL}" alt="AutoRev" width="60" height="60" style="display: block; margin-bottom: 16px;">
              <p style="margin: 0; font-size: 16px; font-weight: 700; letter-spacing: 2px; color: #1f2937; text-transform: uppercase;">Your Login Link</p>
            </td>
          </tr>
          
          <tr>
            <td class="content" style="padding: 32px 40px 40px 40px;">
              
              <p style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1f2937; text-align: left;">
                Hey ${firstName} 👋
              </p>
              
              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 26px; color: #4b5563; text-align: left;">
                Here's your magic login link. Click the button below to sign in instantly—no password needed.
              </p>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${magicLinkUrl}" target="_blank" style="display: inline-block; background-color: #111827; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px; border: 1px solid #111827;">
                      Log In to AutoRev →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 20px; color: #9ca3af; text-align: center;">
                Button not working? Copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px; line-height: 18px; color: #6b7280; text-align: center; word-break: break-all;">
                ${magicLinkUrl}
              </p>
              
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
          
          <tr>
            <td align="center" style="background-color: #f9fafb; padding: 24px 24px; border-top: 1px solid #f3f4f6; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${year} AutoRev · <a href="${SITE_URL}/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy</a> · <a href="${SITE_URL}/terms" style="color: #9ca3af; text-decoration: underline;">Terms</a>
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
 * Generate plain text version of email
 */
function generatePlainText(type: string, userName: string, actionUrl: string): string {
  const firstName = userName.split(" ")[0];
  const year = new Date().getFullYear();
  
  const templates: Record<string, string> = {
    signup: `AUTOREV — Confirm Your Email\n================================\n\nHey ${firstName}!\n\nThanks for signing up for AutoRev! Just one quick step—confirm your email address to unlock your account.\n\n→ CONFIRM YOUR EMAIL: ${actionUrl}\n\n---\n\nThis link expires in 24 hours. If you didn't create an account, you can safely ignore this email.\n\n© ${year} AutoRev`,
    
    recovery: `AUTOREV — Reset Your Password\n================================\n\nHey ${firstName},\n\nWe received a request to reset your AutoRev password. Click the link below to create a new password.\n\n→ RESET PASSWORD: ${actionUrl}\n\nIf you didn't request this, you can safely ignore this email—your password will remain unchanged.\n\n---\n\nThis link expires in 24 hours. Never share this link with anyone.\n\n© ${year} AutoRev`,
    
    magiclink: `AUTOREV — Your Login Link\n================================\n\nHey ${firstName}!\n\nHere's your magic login link. Click below to sign in instantly—no password needed.\n\n→ LOG IN: ${actionUrl}\n\n---\n\nThis link expires in 1 hour and can only be used once. If you didn't request this, you can safely ignore it.\n\n© ${year} AutoRev`,
  };
  
  return templates[type] || templates.signup;
}

/**
 * Send email via Resend API
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.error("[Auth Email] RESEND_API_KEY not configured");
    return { success: false, error: "Email service not configured" };
  }
  
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_CONFIG.from,
        to: [to],
        subject,
        html,
        text,
        reply_to: EMAIL_CONFIG.replyTo,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("[Auth Email] Resend API error:", data);
      return { success: false, error: data.message || "Failed to send email" };
    }
    
    console.log(`[Auth Email] Sent to ${to.slice(0, 3)}***, ID: ${data.id}`);
    return { success: true };
    
  } catch (error) {
    console.error("[Auth Email] Exception:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Main handler for the Auth Email Hook
 */
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  try {
    const payload: AuthEmailPayload = await req.json();
    const { user, email_data } = payload;
    
    console.log(`[Auth Email] Processing ${email_data.email_action_type} for ${user.email}`);
    console.log(`[Auth Email] Payload site_url: ${email_data.site_url}`);
    console.log(`[Auth Email] Using SITE_URL: ${SITE_URL}`);
    
    const userName = getUserName(user);
    const actionUrl = buildActionUrl(payload);
    
    let subject: string;
    let html: string;
    let textType: string;
    
    switch (email_data.email_action_type) {
      case "signup":
      case "invite":
        subject = "Confirm Your Email — AutoRev";
        html = generateConfirmationHtml(userName, actionUrl);
        textType = "signup";
        break;
        
      case "recovery":
        subject = "Reset Your Password — AutoRev";
        html = generateRecoveryHtml(userName, actionUrl);
        textType = "recovery";
        break;
        
      case "magiclink":
        subject = "Your Login Link — AutoRev";
        html = generateMagicLinkHtml(userName, actionUrl);
        textType = "magiclink";
        break;
        
      case "email_change":
        subject = "Confirm Your New Email — AutoRev";
        html = generateConfirmationHtml(userName, actionUrl);
        textType = "signup";
        break;
        
      default:
        console.warn(`[Auth Email] Unknown email type: ${email_data.email_action_type}`);
        subject = "AutoRev Account Action";
        html = generateConfirmationHtml(userName, actionUrl);
        textType = "signup";
    }
    
    const text = generatePlainText(textType, userName, actionUrl);
    
    const result = await sendEmail(user.email, subject, html, text);
    
    if (!result.success) {
      console.error(`[Auth Email] Failed to send ${email_data.email_action_type} email:`, result.error);
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("[Auth Email] Handler error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
