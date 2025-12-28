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
  financials: process.env.DISCORD_WEBHOOK_FINANCIALS,
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
 * Notify when someone submits contact form (enhanced with lead scoring)
 */
export async function notifyContact(lead, quality = {}) {
  // Determine lead quality color
  const qualityColors = {
    hot: 'error',     // Red - high priority
    warm: 'warning',  // Amber - medium priority
    cold: 'info',     // Blue - low priority
  };
  const color = qualityColors[quality.score] || 'info';

  // Quality emoji
  const qualityEmoji = quality.score === 'hot' ? '🔥' :
                       quality.score === 'warm' ? '⚡' :
                       quality.score === 'cold' ? '❄️' : '📬';

  const fields = [
      { name: 'Name', value: lead.name || 'Not provided', inline: true },
      { name: 'Email', value: maskEmail(lead.email), inline: true },
      { name: 'Interest', value: lead.interest || 'Not specified', inline: true },
  ];

  // Add quality indicators
  if (quality.score) {
    const scoreLabels = {
      hot: '🔥 HIGH (engaged user)',
      warm: '⚡ MEDIUM (some activity)',
      cold: '❄️ LOW (new visitor)',
    };
    fields.push({
      name: 'Lead Quality',
      value: scoreLabels[quality.score] || 'Unknown',
      inline: true,
    });
  }

  if (quality.engagement_summary) {
    fields.push({
      name: '📊 Recent Activity',
      value: quality.engagement_summary,
      inline: false,
    });
  }

  if (lead.message) {
    fields.push({
      name: 'Message',
      value: truncate(lead.message, 300),
      inline: false,
    });
  }

  return postToDiscord('contacts', {
    title: `${qualityEmoji} New Contact: ${lead.interest || 'General'}`,
    color,
    fields,
    footer: quality.suggested_action || undefined,
  });
}

/**
 * Notify when an error occurs (legacy - use notifyAggregatedError for auto-errors)
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
 * Notify aggregated error with user impact tracking
 * @param {Object} aggregatedError - Formatted aggregate from errorAggregator
 */
export async function notifyAggregatedError(aggregatedError) {
  const {
    title,
    severity,
    message,
    count,
    firstSeen,
    userCount,
    sessionCount,
    topBrowsers,
    topPages,
    component,
    apiRoute,
    stack,
  } = aggregatedError;

  const severityColors = {
    blocking: 'error',
    major: 'warning',
    minor: 'info',
  };

  // Build browser breakdown
  const browserBreakdown = topBrowsers.length > 0
    ? topBrowsers.map(b => `${b.name}: ${b.count}`).join(' • ')
    : 'Unknown';

  // Build page breakdown
  const pageBreakdown = topPages.length > 0
    ? topPages.map(p => `${p.name.slice(p.name.lastIndexOf('/'))}: ${p.count}x`).join('\n')
    : 'Unknown';

  const fields = [
    { name: '💥 Error', value: truncate(message, 300), inline: false },
    { name: '📊 Impact', value: userCount > 0 ? `**${userCount}** users` : `**${sessionCount}** sessions`, inline: true },
    { name: '🔄 Occurrences', value: `**${count}** times`, inline: true },
    { name: '⏰ First Seen', value: firstSeen, inline: true },
    { name: '🌐 Browsers', value: browserBreakdown, inline: false },
    topPages.length > 0 && { name: '📄 Affected Pages', value: pageBreakdown, inline: false },
    component && { name: '🧩 Component', value: component, inline: true },
    apiRoute && { name: '🔌 API Route', value: apiRoute, inline: true },
  ].filter(Boolean);

  return postToDiscord('errors', {
    title,
    color: severityColors[severity] || 'error',
    fields,
    footer: stack ? `Stack: ${truncate(stack, 150)}` : undefined,
  });
}

/**
 * Notify when a new user signs up (enhanced with context)
 */
export async function notifySignup(user, context = {}) {
  const fields = [
    { name: 'Name', value: user.name || 'Not provided', inline: true },
    { name: 'Email', value: user.email || 'Unknown', inline: true },
    { name: 'Provider', value: user.provider || 'Email', inline: true },
    { name: 'Tier', value: 'Free', inline: true },
  ];

  // Add acquisition context if available
  if (context.source_page) {
    const pageName = context.source_page.split('/').filter(Boolean).pop() || 'home';
    fields.push({ 
      name: '📍 Signup Source', 
      value: `/${pageName}`, 
      inline: true 
    });
  }

  if (context.car_context) {
    fields.push({ 
      name: '🚗 Viewing Car', 
      value: context.car_context, 
      inline: true 
    });
  }

  if (context.referrer) {
    const referrerDomain = context.referrer.includes('google') ? '🔍 Google Search' :
                           context.referrer.includes('facebook') ? '📘 Facebook' :
                           context.referrer.includes('twitter') ? '🐦 Twitter' :
                           context.referrer === 'direct' ? '🔗 Direct' :
                           truncate(context.referrer, 30);
    fields.push({ 
      name: '📊 Referrer', 
      value: referrerDomain, 
      inline: true 
    });
  }

  if (context.first_action) {
    fields.push({ 
      name: '⚡ First Action', 
      value: context.first_action, 
      inline: true 
    });
  }

  return postToDiscord('signups', {
    title: '👋 New User Signup',
    color: 'success',
    fields,
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
 * Notify when a cron job completes (legacy - use notifyCronEnrichment for data jobs)
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
 * Notify when a cron job enriches database data
 * Provides a clear summary of what data was added/updated
 */
export async function notifyCronEnrichment(jobName, enrichment = {}) {
  const {
    duration,
    table,           // e.g., 'car_recalls', 'community_insights'
    recordsAdded = 0,
    recordsUpdated = 0,
    recordsProcessed = 0,
    sourcesChecked = 0,
    errors = 0,
    details = [],    // Array of { label, value } for extra context
    skipped = false, // If true, job ran but had nothing to do
    skipReason = '', // Why job was skipped
  } = enrichment;

  // Skip notification entirely if nothing happened and it's a skip
  if (skipped && skipReason === 'empty_queue') {
    // Silent skip for empty queue - don't spam Discord
    return { success: true, skipped: true };
  }

  const totalEnriched = recordsAdded + recordsUpdated;
  
  // Determine status emoji and color
  let emoji = '✅';
  let color = 'success';
  
  if (errors > 0 && totalEnriched > 0) {
    emoji = '⚠️';
    color = 'warning';
  } else if (errors > 0 && totalEnriched === 0) {
    emoji = '❌';
    color = 'error';
  } else if (skipped) {
    emoji = '⏭️';
    color = 'neutral';
  } else if (totalEnriched === 0) {
    emoji = '📭';
    color = 'neutral';
  }

  // Build description based on what happened
  let description = '';
  if (skipped) {
    description = skipReason || 'No work to do';
  } else if (totalEnriched > 0) {
    const parts = [];
    if (recordsAdded > 0) parts.push(`**${recordsAdded}** new`);
    if (recordsUpdated > 0) parts.push(`**${recordsUpdated}** updated`);
    description = `${parts.join(', ')} ${table ? `in \`${table}\`` : 'records'}`;
  } else if (recordsProcessed > 0) {
    description = `Processed ${recordsProcessed} items, no new data found`;
  } else {
    description = 'Completed with no changes';
  }

  // Build fields
  const fields = [];
  
  // Duration
  if (duration) {
    const durationSec = (duration / 1000).toFixed(1);
    const durationDisplay = duration > 60000 
      ? `${Math.floor(duration / 60000)}m ${Math.round((duration % 60000) / 1000)}s`
      : `${durationSec}s`;
    fields.push({ name: '⏱️ Duration', value: durationDisplay, inline: true });
  }
  
  // Sources/Items checked
  if (sourcesChecked > 0) {
    fields.push({ name: '🔍 Checked', value: String(sourcesChecked), inline: true });
  }
  
  // Records processed (if different from enriched)
  if (recordsProcessed > 0 && recordsProcessed !== totalEnriched) {
    fields.push({ name: '📊 Processed', value: String(recordsProcessed), inline: true });
  }
  
  // Errors
  if (errors > 0) {
    fields.push({ name: '❌ Errors', value: String(errors), inline: true });
  }
  
  // Additional details
  for (const detail of details.slice(0, 4)) {
    if (detail.label && detail.value !== undefined) {
      fields.push({ name: detail.label, value: String(detail.value), inline: true });
    }
  }

  return postToDiscord('cron', {
    title: `${emoji} ${jobName}`,
    description,
    color,
    fields: fields.length > 0 ? fields : undefined,
    footer: table ? `Table: ${table}` : undefined,
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
 * Post AL Intelligence Report
 */
export async function postALIntelligence(intelligence) {
  const {
    conversationCount,
    questionCount,
    uniqueUsers,
    totalCost,
    avgCostPerConversation,
    topTopics,
    topCars,
    topComparisons,
    contentGaps,
    mostExpensiveConversations,
    qualitySignals,
  } = intelligence;

  if (conversationCount === 0) {
    return { success: true, skipped: true, reason: 'No AL activity' };
  }

  const fields = [];

  // Volume & Cost
  fields.push({
    name: '📊 Volume & Cost',
    value: `**${conversationCount}** conversations • **${questionCount}** questions\n` +
           `**${uniqueUsers}** unique users • **$${totalCost.toFixed(2)}** total cost\n` +
           `Avg: **$${avgCostPerConversation.toFixed(2)}** per conversation`,
    inline: false,
  });

  // Hot Topics
  if (topTopics.length > 0) {
    const topicsText = topTopics
      .map(t => `**${t.count}x** ${t.topic.replace(/-/g, ' ')}`)
      .join(' • ');
    fields.push({
      name: '🔥 Hot Topics',
      value: topicsText,
      inline: false,
    });
  }

  // Popular Cars
  if (topCars.length > 0) {
    const carsText = topCars
      .slice(0, 3)
      .map(c => `**${c.slug}** (${c.count}x)`)
      .join(' • ');
    fields.push({
      name: '🚗 Most Asked About',
      value: carsText,
      inline: false,
    });
  }

  // Popular Comparisons
  if (topComparisons.length > 0) {
    const comparisonsText = topComparisons
      .map(c => `**${c.comparison}** (${c.count}x)`)
      .join('\n');
    fields.push({
      name: '⚖️ Popular Comparisons',
      value: comparisonsText,
      inline: false,
    });
    }

  // Content Gaps
  if (contentGaps.length > 0) {
    const gapsText = contentGaps
      .map(g => `• "${truncate(g.question, 100)}"`)
      .join('\n');
    fields.push({
      name: '💡 Content Gaps Detected',
      value: gapsText + `\n\n**${Math.round(qualitySignals.gapRate * 100)}%** of conversations had gaps`,
      inline: false,
    });
    }

  // Cost Optimization Opportunities
  if (mostExpensiveConversations.length > 0) {
    const expensiveText = mostExpensiveConversations
      .map(c => `**$${(c.credits / 100).toFixed(2)}** (${c.messages} messages)`)
      .join(' • ');
    fields.push({
      name: '💰 Most Expensive Conversations',
      value: expensiveText,
      inline: false,
    });
  }

  return postToDiscord('al', {
    title: '🤖 AL Intelligence Report',
    description: 'Daily insights from AL conversations',
    color: 'brand',
    fields,
    footer: 'Use these insights to guide content creation and product improvements',
  });
}

/**
 * Notify when a payment is received (subscriptions, credits, donations)
 */
export async function notifyPayment(payment) {
  const { type, amount, credits, userId, customerId } = payment;
  
  const amountDisplay = amount ? `$${(amount / 100).toFixed(2)}` : 'Unknown';
  
  const typeConfig = {
    subscription_renewal: {
      title: '💳 Subscription Renewed',
      color: 'success',
      description: `Subscription payment received: **${amountDisplay}**`,
    },
    al_credits: {
      title: '🤖 AL Credits Purchased',
      color: 'info',
      description: `**${credits}** AL credits purchased for **${amountDisplay}**`,
    },
    donation: {
      title: '💜 Donation Received',
      color: 'brand',
      description: `Thank you! Someone donated **${amountDisplay}** to support AutoRev`,
    },
    new_subscription: {
      title: '🎉 New Subscriber',
      color: 'success',
      description: `New subscription started: **${amountDisplay}**/month`,
    },
  };

  const config = typeConfig[type] || {
    title: '💰 Payment Received',
    color: 'success',
    description: `Payment received: **${amountDisplay}**`,
  };

  return postToDiscord('financials', {
    title: config.title,
    description: config.description,
    color: config.color,
    fields: [
      userId && { name: 'User ID', value: userId.slice(0, 8) + '...', inline: true },
      customerId && { name: 'Customer', value: customerId, inline: true },
    ].filter(Boolean),
  });
}

/**
 * Post daily digest summary (enhanced with trends and actionability)
 */
export async function postDailyDigest(stats) {
  const fields = [];

  // === KEY METRICS (with trends) ===
  const metricsItems = [];
  
  // Users Section
  if (stats.signups !== undefined) {
    const trend = stats.signupTrend || '';
    metricsItems.push(`👤 Signups: **${stats.signups}** ${trend}`);
  }
  if (stats.activeUsers !== undefined) {
    const trend = stats.activeUsersTrend || '';
    metricsItems.push(`🔐 Logins: **${stats.activeUsers}** ${trend}`);
  }
  if (stats.totalUsers !== undefined) {
    metricsItems.push(`📊 Total Users: **${stats.totalUsers}**`);
  }
  
  if (metricsItems.length > 0) {
    fields.push({
      name: '👥 Users',
      value: metricsItems.join('\n'),
      inline: true,
    });
  }

  // === ENGAGEMENT METRICS ===
  const engagementItems = [];
  if (stats.carPageViews > 0 || stats.uniqueCarsViewed > 0) {
    engagementItems.push(`🚗 Car Views: **${stats.carPageViews || 0}** (${stats.uniqueCarsViewed || 0} unique)`);
  }
  if (stats.favoritesAdded > 0) {
    engagementItems.push(`❤️ Favorites: **+${stats.favoritesAdded}**`);
  }
  if (stats.searchesPerformed > 0) {
    engagementItems.push(`🔍 Searches: **${stats.searchesPerformed}**`);
  }
  if (stats.vehiclesAdded > 0) {
    engagementItems.push(`🏎️ Vehicles Added: **+${stats.vehiclesAdded}**`);
  }
  
  if (engagementItems.length > 0) {
    fields.push({
      name: '📈 Engagement',
      value: engagementItems.join('\n'),
      inline: true,
    });
  }

  // === AL METRICS ===
  const alItems = [];
  if (stats.alConversations !== undefined) {
    const trend = stats.alConversationsTrend || '';
    alItems.push(`💬 Chats: **${stats.alConversations}** ${trend}`);
  }
  if (stats.alQuestions > 0) {
    alItems.push(`❓ Questions: **${stats.alQuestions}**`);
  }
  if (stats.alToolCalls > 0) {
    alItems.push(`🔧 Tool Calls: **${stats.alToolCalls}**`);
  }
  
  if (alItems.length > 0) {
    fields.push({
      name: '🤖 AL (AI Mechanic)',
      value: alItems.join('\n'),
      inline: true,
    });
  }

  // === WINS OF THE DAY ===
  if (stats.wins && stats.wins.length > 0) {
    fields.push({
      name: '🚀 Wins',
      value: stats.wins.map(w => `✅ ${w}`).join('\n'),
      inline: false,
    });
  }

  // === ATTENTION NEEDED (Alerts) ===
  if (stats.alerts && stats.alerts.length > 0) {
    fields.push({
      name: '⚠️ Attention Needed',
      value: stats.alerts.map(a => `${a.severity === 'critical' ? '🔴' : '🟡'} ${a.message}`).join('\n'),
      inline: false,
    });
  }

  // === TRENDING UP ===
  if (stats.trendingUp && stats.trendingUp.length > 0) {
    fields.push({
      name: '📈 Trending Up',
      value: stats.trendingUp.map(t => `• ${t}`).join('\n'),
      inline: true,
    });
  }

  // === TRENDING DOWN ===
  if (stats.trendingDown && stats.trendingDown.length > 0) {
    fields.push({
      name: '📉 Trending Down',
      value: stats.trendingDown.map(t => `• ${t}`).join('\n'),
      inline: true,
    });
  }

  // === USER INSIGHTS ===
  if (stats.userInsights) {
    const insights = [];
    if (stats.userInsights.mostViewedCar) {
      insights.push(`Most viewed: **${stats.userInsights.mostViewedCar}**`);
    }
    if (stats.userInsights.topALTopic) {
      insights.push(`Top AL topic: **${stats.userInsights.topALTopic}**`);
    }
    if (stats.userInsights.topFeedbackTheme) {
      insights.push(`Feedback theme: **${stats.userInsights.topFeedbackTheme}**`);
    }
    
    if (insights.length > 0) {
      fields.push({
        name: '🎓 User Insights',
        value: insights.join('\n'),
        inline: false,
      });
    }
  }

  // === ACTION ITEMS ===
  if (stats.actionItems && stats.actionItems.length > 0) {
    fields.push({
      name: '📋 Action Items for You',
      value: stats.actionItems.map((item, i) => `${i + 1}. ${item}`).join('\n'),
      inline: false,
    });
  }

  // If no activity at all, add a placeholder
  if (fields.length === 0) {
    fields.push({
      name: '💤 Quiet Day',
      value: 'No significant activity recorded',
      inline: false,
    });
  }

  return postToDiscord('digest', {
    title: `📊 AutoRev Daily Dose - ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`,
    color: 'brand',
    fields,
    footer: 'AutoRev Operations • 9:00 AM CST',
  });
}







