import { Resend } from 'resend';
import { errors } from '@/lib/apiErrors';
import { notifyContact } from '@/lib/discord';
import { withErrorLogging } from '@/lib/serverErrorLogger';

const CONTACT_EMAIL = 'contact@autorev.app';

async function handlePost(request) {
  const body = await request.json();
    const { name, email, interest, car, message } = body;

    // Initialize Resend at runtime (not build time)
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Validate required fields
    if (!name || !email || !message) {
      return Response.json(
        { success: false, error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Format interest for display
    const interestLabels = {
      'al-question': 'Question about AL (AI)',
      'car-selector': 'Car Selector Help',
      'bug-report': 'Bug or Issue',
      'feature-request': 'Feature Suggestion',
      'general': 'General Question',
    };

    const interestDisplay = interest ? interestLabels[interest] || interest : 'Not specified';

    // Send email to Cory
    const { data, error } = await resend.emails.send({
      from: 'AutoRev <noreply@autorev.app>',
      to: [CONTACT_EMAIL],
      replyTo: email,
      subject: `New Contact Form Message from ${name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #00d4ff; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
            <p style="color: #8892b0; margin: 10px 0 0 0;">AutoRev</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; font-weight: 600; color: #495057; width: 120px;">Name:</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; color: #212529;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; font-weight: 600; color: #495057;">Email:</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; color: #212529;">
                  <a href="mailto:${email}" style="color: #00d4ff; text-decoration: none;">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; font-weight: 600; color: #495057;">Interest:</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; color: #212529;">${interestDisplay}</td>
              </tr>
              ${car ? `
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; font-weight: 600; color: #495057;">Car:</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; color: #212529;">${car}</td>
              </tr>
              ` : ''}
            </table>
            
            <div style="margin-top: 24px;">
              <h3 style="color: #495057; margin: 0 0 12px 0; font-size: 16px;">Message:</h3>
              <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; color: #212529; line-height: 1.6;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>
            
            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="color: #6c757d; font-size: 14px; margin: 0;">
                Reply directly to this email to respond to ${name}.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('[Contact API] Resend error:', error);
      return Response.json(
        { success: false, error: 'Failed to send email. Please try again.' },
        { status: 500 }
      );
    }

    // Calculate lead quality score
    let leadQuality = { score: 'cold' };
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Check if this email has user activity (engaged users are higher quality)
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('id, created_at')
        .eq('id', (await supabase.auth.admin.getUserByEmail(email)).data?.user?.id)
        .single()
        .catch(() => ({ data: null }));

      if (userProfile) {
        // Existing user - check their activity
        const { data: activities } = await supabase
          .from('user_activity')
          .select('event_type, created_at')
          .eq('user_id', userProfile.id)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
          .order('created_at', { ascending: false });

        const activityCount = activities?.length || 0;
        const accountAge = Date.now() - new Date(userProfile.created_at).getTime();
        const daysSinceSignup = Math.floor(accountAge / (1000 * 60 * 60 * 24));

        // Scoring logic
        if (activityCount >= 10 || (activityCount >= 5 && daysSinceSignup <= 7)) {
          leadQuality.score = 'hot';
          leadQuality.suggested_action = '🎯 High priority - respond within 2 hours';
        } else if (activityCount >= 3 || daysSinceSignup <= 3) {
          leadQuality.score = 'warm';
          leadQuality.suggested_action = '⏰ Respond within 24 hours';
        } else {
          leadQuality.score = 'cold';
        }

        // Build engagement summary
        const eventSummary = activities?.slice(0, 5).map(a => a.event_type).join(', ') || 'None';
        leadQuality.engagement_summary = activityCount > 0 
          ? `${activityCount} actions in last 7 days • Signed up ${daysSinceSignup}d ago\nRecent: ${eventSummary}`
          : `Signed up ${daysSinceSignup}d ago • No recent activity`;
      } else {
        // New visitor - check message content for quality signals
        const messageLower = (body.message || '').toLowerCase();
        const highIntentKeywords = ['buy', 'purchase', 'ready', 'budget', 'soon', 'looking to'];
        const hasHighIntent = highIntentKeywords.some(keyword => messageLower.includes(keyword));

        if (hasHighIntent && body.interest && body.car) {
          leadQuality.score = 'warm';
          leadQuality.suggested_action = '⏰ Specific interest with intent - respond within 24 hours';
          leadQuality.engagement_summary = 'New visitor with specific car interest and buying intent';
        } else {
          leadQuality.score = 'cold';
          leadQuality.engagement_summary = 'New visitor';
        }
      }
    } catch (scoringErr) {
      console.error('[Contact API] Lead scoring failed:', scoringErr);
      // Continue with default score
    }

    // Fire-and-forget Discord notification with quality scoring
    notifyContact({
      name: body.name,
      email: body.email,
      interest: body.interest,
      message: body.message,
    }, leadQuality).catch(err => console.error('[Contact API] Discord notification failed:', err));

  return Response.json({ success: true, data: { id: data?.id } });
}

export const POST = withErrorLogging(handlePost, { route: 'contact', feature: 'contact' });

