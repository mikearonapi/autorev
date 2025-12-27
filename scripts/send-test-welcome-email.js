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
  
  // 1x1 pixel dark background images (data URIs that Gmail respects)
  const darkBg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wnwEAAQkBA+hUvK4AAAAASUVORK5CYII='; // #171717
  const darkerBg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwF/dyqxhwAAAABJRU5ErkJggg=='; // #0f0f0f
  const cardBg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P//PwAGBAL/ZoLIHwAAAABJRU5ErkJggg=='; // #1f1f1f
  const headerBg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkSGb4HwADJAF/YWPgewAAAABJRU5ErkJggg='; // #163d52
  
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Welcome to AutoRev</title>
  <!--[if gte mso 9]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <style type="text/css">
    body{margin:0!important;padding:0!important;background:#0f0f0f!important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table{border-spacing:0;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt}
    td{padding:0}
    img{border:0;height:auto;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic}
    a{text-decoration:none}
    @media only screen and (max-width:600px){
      .mobile-full{width:100%!important}
      .mobile-pad{padding-left:16px!important;padding-right:16px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;">
<!--[if mso]>
<style type="text/css">
body,table,td{font-family:Arial,sans-serif!important}
</style>
<![endif]-->

<!-- Preheader -->
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#0f0f0f;">
Your sports car journey starts here. Research 98+ cars, track your rides, plan builds, and join a community of enthusiasts.
</div>

<!-- WRAPPER -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;" bgcolor="#0f0f0f">
<tr>
<td align="center" style="padding:30px 10px;background:#0f0f0f;" bgcolor="#0f0f0f">

<!-- MAIN CONTAINER -->
<table role="presentation" class="mobile-full" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#171717;border:1px solid #2a2a2a;" bgcolor="#171717">

  <!-- ===== HEADER ===== -->
  <tr>
    <td align="center" class="mobile-pad" style="padding:45px 30px 50px;background:#1a4d6e;" bgcolor="#1a4d6e">
      <img src="${SITE_URL}/images/autorev-logo-white.png" alt="AutoRev" width="100" height="100" style="display:block;width:100px;height:100px;margin-bottom:18px;">
      <div style="font-family:Impact,'Arial Black',Arial,sans-serif;font-size:42px;font-weight:bold;color:#D4AF37;letter-spacing:3px;">AUTOREV</div>
      <div style="margin-top:10px;font-family:Arial,sans-serif;font-size:11px;color:#8899aa;letter-spacing:4px;">FIND WHAT DRIVES YOU</div>
    </td>
  </tr>

  <!-- ===== WELCOME BANNER ===== -->
  <tr>
    <td class="mobile-pad" style="padding:0 30px;background:#171717;" bgcolor="#171717">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:-25px;background:#1f1f1f;border:2px solid #D4AF37;" bgcolor="#1f1f1f">
        <tr>
          <td align="center" style="padding:22px 20px;background:#1f1f1f;" bgcolor="#1f1f1f">
            <div style="font-family:Arial,sans-serif;font-size:11px;color:#a3a3a3;letter-spacing:2px;margin-bottom:6px;">WELCOME ABOARD</div>
            <div style="font-family:Arial,sans-serif;font-size:26px;font-weight:bold;color:#ffffff;">${userName}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ===== BODY CONTENT ===== -->
  <tr>
    <td class="mobile-pad" style="padding:30px 30px 24px;background:#171717;" bgcolor="#171717">
      <p style="margin:0 0 18px;font-family:Arial,sans-serif;font-size:16px;line-height:26px;color:#e5e5e5;">
        You've just joined a community that celebrates every enthusiast—from the weekend warrior with a $3K Miata to the collector with a GT3RS.
      </p>
      <p style="margin:0 0 26px;font-family:Arial,sans-serif;font-size:16px;line-height:26px;color:#a3a3a3;">
        <strong style="color:#D4AF37;">No flex culture. No gatekeeping.</strong> Just honest guidance and genuine community.
      </p>

      <!-- FEATURE CARDS -->
      
      <!-- Research -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;background:#1f1f1f;border-left:4px solid #D4AF37;" bgcolor="#1f1f1f">
        <tr>
          <td width="52" valign="top" style="padding:16px 0 16px 16px;background:#1f1f1f;" bgcolor="#1f1f1f">
            <table role="presentation" width="40" height="40" cellpadding="0" cellspacing="0" style="background:#3d3520;" bgcolor="#3d3520">
              <tr><td align="center" valign="middle" style="font-size:20px;line-height:40px;">&#128269;</td></tr>
            </table>
          </td>
          <td valign="top" style="padding:16px 16px 16px 12px;background:#1f1f1f;" bgcolor="#1f1f1f">
            <div style="font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;margin-bottom:4px;">Research</div>
            <div style="font-family:Arial,sans-serif;font-size:13px;line-height:19px;color:#a3a3a3;">Deep-dive into 98 sports cars with real specs, owner insights, and honest reviews.</div>
          </td>
        </tr>
      </table>

      <!-- Garage -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;background:#1f1f1f;border-left:4px solid #1a4d6e;" bgcolor="#1f1f1f">
        <tr>
          <td width="52" valign="top" style="padding:16px 0 16px 16px;background:#1f1f1f;" bgcolor="#1f1f1f">
            <table role="presentation" width="40" height="40" cellpadding="0" cellspacing="0" style="background:#1e3a4d;" bgcolor="#1e3a4d">
              <tr><td align="center" valign="middle" style="font-size:20px;line-height:40px;">&#128663;</td></tr>
            </table>
          </td>
          <td valign="top" style="padding:16px 16px 16px 12px;background:#1f1f1f;" bgcolor="#1f1f1f">
            <div style="font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;margin-bottom:4px;">My Garage</div>
            <div style="font-family:Arial,sans-serif;font-size:13px;line-height:19px;color:#a3a3a3;">Track your rides, decode VINs, get recall alerts, and log service history.</div>
          </td>
        </tr>
      </table>

      <!-- Build -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;background:#1f1f1f;border-left:4px solid #22c55e;" bgcolor="#1f1f1f">
        <tr>
          <td width="52" valign="top" style="padding:16px 0 16px 16px;background:#1f1f1f;" bgcolor="#1f1f1f">
            <table role="presentation" width="40" height="40" cellpadding="0" cellspacing="0" style="background:#1a3d2a;" bgcolor="#1a3d2a">
              <tr><td align="center" valign="middle" style="font-size:20px;line-height:40px;">&#128295;</td></tr>
            </table>
          </td>
          <td valign="top" style="padding:16px 16px 16px 12px;background:#1f1f1f;" bgcolor="#1f1f1f">
            <div style="font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;margin-bottom:4px;">Plan Builds</div>
            <div style="font-family:Arial,sans-serif;font-size:13px;line-height:19px;color:#a3a3a3;">Visualize power gains, explore parts, and see real dyno data before you wrench.</div>
          </td>
        </tr>
      </table>

      <!-- Meet AL -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1f1f1f;border-left:4px solid #8b5cf6;" bgcolor="#1f1f1f">
        <tr>
          <td width="52" valign="top" style="padding:16px 0 16px 16px;background:#1f1f1f;" bgcolor="#1f1f1f">
            <img src="${SITE_URL}/images/al-mascot.png" alt="AL" width="40" height="40" style="display:block;width:40px;height:40px;">
          </td>
          <td valign="top" style="padding:16px 16px 16px 12px;background:#1f1f1f;" bgcolor="#1f1f1f">
            <div style="font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;margin-bottom:4px;">Meet AL &#10024;</div>
            <div style="font-family:Arial,sans-serif;font-size:13px;line-height:19px;color:#a3a3a3;">Your AI car expert. Get instant answers about specs, common issues, and the best mods.</div>
          </td>
        </tr>
      </table>

    </td>
  </tr>

  <!-- ===== CTA BUTTON ===== -->
  <tr>
    <td align="center" class="mobile-pad" style="padding:10px 30px 40px;background:#171717;" bgcolor="#171717">
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="background:#D4AF37;border-radius:6px;" bgcolor="#D4AF37">
            <a href="${loginUrl}" target="_blank" style="display:inline-block;padding:16px 44px;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#171717;text-decoration:none;">Start Exploring &rarr;</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ===== DIVIDER ===== -->
  <tr>
    <td class="mobile-pad" style="padding:0 30px;background:#171717;" bgcolor="#171717">
      <div style="height:1px;background:#2a2a2a;"></div>
    </td>
  </tr>

  <!-- ===== FOOTER ===== -->
  <tr>
    <td align="center" class="mobile-pad" style="padding:26px 30px;background:#171717;" bgcolor="#171717">
      <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:13px;color:#737373;">Questions? Just reply—we read every one.</p>
      <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:12px;color:#525252;">&copy; ${year} AutoRev &middot; Built for enthusiasts, by enthusiasts</p>
      <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;">
        <a href="${SITE_URL}" style="color:#737373;">Web</a>
        <span style="color:#525252;"> &middot; </span>
        <a href="${SITE_URL}/contact" style="color:#737373;">Contact</a>
      </p>
    </td>
  </tr>

</table>
<!-- END MAIN CONTAINER -->

</td>
</tr>
</table>
<!-- END WRAPPER -->

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

