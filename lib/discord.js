/**
 * Discord Webhook Integration for AutoRev
 * Posts notifications to various Discord channels
 */

// Channel webhook URLs from environment variables
const CHANNELS = {
  feedback: process.env.DISCORD_WEBHOOK_FEEDBACK,
  contacts: process.env.DISCORD_WEBHOOK_CONTACTS,
  errors: process.env.DISCORD_WEBHOOK_ERRORS,
  signups: process.env.DISCORD_WEBHOOK_SIGNUPS,
  events: process.env.DISCORD_WEBHOOK_EVENTS,
  al: process.env.DISCORD_WEBHOOK_AL,
  cron: process.env.DISCORD_WEBHOOK_CRON,
  digest: process.env.DISCORD_WEBHOOK_DIGEST,
};

// Embed colors
const COLORS = {
  success: 0x22c55e,  // green
  error: 0xef4444,    // red
  warning: 0xf59e0b,  // amber
  info: 0x3b82f6,     // blue
  neutral: 0x6b7280,  // gray
  brand: 0x8b5cf6,    // purple (AutoRev brand)
};

/**
 * Post a message to a Discord channel via webhook
 * Never throws - logs errors and returns result object
 */
export async function postToDiscord(channel, options) {
  const webhookUrl = CHANNELS[channel];
  
  if (!webhookUrl) {
    // Silent skip in dev, log in prod
    if (process.env.NODE_ENV === 'production') {
      console.warn(`[Discord] No webhook configured for channel: ${channel}`);
    }
    return { success: false, error: 'No webhook configured' };
  }

  const embed = {
    title: options.title,
    description: options.description,
    color: COLORS[options.color] || COLORS.neutral,
    fields: options.fields || [],
    footer: options.footer ? { text: options.footer } : undefined,
    url: options.url,
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!response.ok) {
      console.error(`[Discord] Webhook failed: ${response.status}`);
      return { success: false, error: `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    console.error(`[Discord] Webhook error:`, error.message);
    return { success: false, error: error.message };
  }
}

// Helper to mask email for privacy
function maskEmail(email) {
  if (!email) return 'Unknown';
  const [local, domain] = email.split('@');
  if (!domain) return 'Invalid email';
  return `${local[0]}${'*'.repeat(Math.min(local.length - 1, 5))}@${domain}`;
}

// Helper to truncate text
function truncate(text, maxLength = 200) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

/**
 * Notify when user submits feedback
 */
export async function notifyFeedback(feedback) {
  const severityColors = {
    blocking: 'error',
    major: 'warning',
    minor: 'info',
  };

  return postToDiscord('feedback', {
    title: `📝 New Feedback: ${feedback.category || 'General'}`,
    color: feedback.severity ? severityColors[feedback.severity] || 'info' : 'info',
    fields: [
      { name: 'Category', value: feedback.category || 'Not specified', inline: true },
      feedback.severity && { name: 'Severity', value: feedback.severity, inline: true },
      { name: 'User Tier', value: feedback.user_tier || 'Anonymous', inline: true },
      { name: 'Page', value: feedback.page_url || 'Not specified', inline: false },
      { name: 'Message', value: truncate(feedback.message, 300), inline: false },
    ].filter(Boolean),
    footer: `ID: ${feedback.id?.slice(0, 8) || 'N/A'}`,
  });
}

/**
 * Notify when someone submits contact form
 */
export async function notifyContact(lead) {
  return postToDiscord('contacts', {
    title: `📬 New Contact: ${lead.interest || 'General'}`,
    color: 'info',
    fields: [
      { name: 'Name', value: lead.name || 'Not provided', inline: true },
      { name: 'Email', value: maskEmail(lead.email), inline: true },
      { name: 'Interest', value: lead.interest || 'Not specified', inline: true },
      lead.message && { name: 'Message', value: truncate(lead.message, 300), inline: false },
    ].filter(Boolean),
  });
}

/**
 * Notify when an error occurs
 */
export async function notifyError(error, context = {}) {
  return postToDiscord('errors', {
    title: `🚨 Error: ${context.source || 'Unknown Source'}`,
    color: 'error',
    fields: [
      { name: 'Error', value: truncate(error.message || String(error), 200), inline: false },
      context.job && { name: 'Job', value: context.job, inline: true },
      context.route && { name: 'Route', value: context.route, inline: true },
      context.details && { name: 'Details', value: truncate(context.details, 200), inline: false },
    ].filter(Boolean),
    footer: `Stack: ${truncate(error.stack?.split('\n')[1] || 'N/A', 100)}`,
  });
}

/**
 * Notify when a new user signs up
 */
export async function notifySignup(user) {
  return postToDiscord('signups', {
    title: '👋 New User Signup',
    color: 'success',
    fields: [
      { name: 'Email', value: maskEmail(user.email), inline: true },
      { name: 'Provider', value: user.provider || 'Email', inline: true },
      { name: 'Tier', value: 'Free', inline: true },
    ],
    footer: `User ID: ${user.id?.slice(0, 8) || 'N/A'}`,
  });
}

/**
 * Notify when user submits an event
 */
export async function notifyEventSubmission(submission) {
  return postToDiscord('events', {
    title: '📅 New Event Submission',
    color: 'info',
    fields: [
      { name: 'Event Name', value: submission.name || 'Untitled', inline: false },
      { name: 'Type', value: submission.event_type_slug || 'Not specified', inline: true },
      { name: 'Date', value: submission.start_date || 'TBD', inline: true },
      { name: 'Location', value: `${submission.city || '?'}, ${submission.state || '?'}`, inline: true },
      submission.source_url && { name: 'Source', value: submission.source_url, inline: false },
    ].filter(Boolean),
    footer: `Submission ID: ${submission.id?.slice(0, 8) || 'N/A'} • Needs moderation`,
  });
}

/**
 * Notify when a new AL conversation starts
 */
export async function notifyALConversation(conversation) {
  return postToDiscord('al', {
    title: '🤖 New AL Conversation',
    color: 'neutral',
    fields: [
      { name: 'First Question', value: truncate(conversation.firstMessage, 150), inline: false },
      conversation.carContext && { name: 'Car Context', value: conversation.carContext, inline: true },
      { name: 'User Tier', value: conversation.userTier || 'Unknown', inline: true },
    ].filter(Boolean),
    footer: `Conversation: ${conversation.id?.slice(0, 8) || 'N/A'}`,
  });
}

/**
 * Notify when a cron job completes
 */
export async function notifyCronCompletion(jobName, stats = {}) {
  const fields = [
    stats.duration && { name: 'Duration', value: `${(stats.duration / 1000).toFixed(1)}s`, inline: true },
    stats.processed !== undefined && { name: 'Processed', value: String(stats.processed), inline: true },
    stats.succeeded !== undefined && { name: 'Succeeded', value: String(stats.succeeded), inline: true },
    stats.failed !== undefined && { name: 'Failed', value: String(stats.failed), inline: true },
    stats.created !== undefined && { name: 'Created', value: String(stats.created), inline: true },
    stats.errors !== undefined && { name: 'Errors', value: String(stats.errors), inline: true },
  ].filter(Boolean);

  return postToDiscord('cron', {
    title: `✅ Cron: ${jobName} Complete`,
    color: stats.failed > 0 ? 'warning' : 'success',
    fields: fields.length > 0 ? fields : [{ name: 'Status', value: 'Completed', inline: true }],
  });
}

/**
 * Notify when a cron job fails
 */
export async function notifyCronFailure(jobName, error, context = {}) {
  return postToDiscord('errors', {
    title: `🚨 Cron: ${jobName} Failed`,
    color: 'error',
    fields: [
      { name: 'Error', value: truncate(error.message || String(error), 300), inline: false },
      context.phase && { name: 'Phase', value: context.phase, inline: true },
      context.processed && { name: 'Processed Before Failure', value: String(context.processed), inline: true },
    ].filter(Boolean),
  });
}

/**
 * Post daily digest summary
 */
export async function postDailyDigest(stats) {
  const fields = [
    { name: '👥 New Signups', value: String(stats.signups || 0), inline: true },
    { name: '📝 Feedback', value: String(stats.feedback || 0), inline: true },
    { name: '📬 Contacts', value: String(stats.contacts || 0), inline: true },
    { name: '🤖 AL Conversations', value: String(stats.alConversations || 0), inline: true },
    { name: '📅 Event Submissions', value: String(stats.eventSubmissions || 0), inline: true },
    { name: '🚨 Errors', value: String(stats.errors || 0), inline: true },
  ];

  // Add cron summary if available
  if (stats.cronJobs) {
    fields.push({
      name: '⚙️ Cron Jobs',
      value: `${stats.cronJobs.succeeded}/${stats.cronJobs.total} succeeded`,
      inline: true,
    });
  }

  // Add notable items
  if (stats.topFeedbackCategories?.length > 0) {
    fields.push({
      name: '📊 Top Feedback Categories',
      value: stats.topFeedbackCategories.join(', '),
      inline: false,
    });
  }

  if (stats.unresolvedBugs > 0) {
    fields.push({
      name: '🐛 Unresolved Bugs',
      value: String(stats.unresolvedBugs),
      inline: true,
    });
  }

  return postToDiscord('digest', {
    title: `📈 AutoRev Daily Digest`,
    description: `Summary for ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    color: 'brand',
    fields,
    footer: 'AutoRev Operations',
  });
}

