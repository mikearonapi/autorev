import { Resend } from 'resend';
import { notifyContact } from '@/lib/discord';

const CONTACT_EMAIL = 'contact@autorev.app';

export async function POST(request) {
  try {
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

    // Fire-and-forget Discord notification
    notifyContact({
      name: body.name,
      email: body.email,
      interest: body.interest,
      message: body.message,
    }).catch(err => console.error('[Contact API] Discord notification failed:', err));

    return Response.json({ success: true, data: { id: data?.id } });
  } catch (err) {
    console.error('[Contact API] Unexpected error:', err);
    return Response.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

