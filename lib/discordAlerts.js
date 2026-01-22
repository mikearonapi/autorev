/**
 * Discord Alerts for AL Evaluation
 * 
 * Sends notifications when evaluation pass rate drops below threshold.
 * 
 * Environment: DISCORD_WEBHOOK_URL
 */

/**
 * Send a Discord webhook message
 * @param {string} content - Message content
 * @param {Object} options - Additional options
 */
export async function sendDiscordAlert(content, options = {}) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('[Discord] DISCORD_WEBHOOK_URL not configured, skipping alert');
    return { sent: false, reason: 'not_configured' };
  }
  
  const payload = {
    content,
    username: options.username || 'AutoRev AL Bot',
    embeds: options.embeds || [],
  };
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      console.error('[Discord] Alert failed:', response.status, await response.text());
      return { sent: false, reason: 'request_failed', status: response.status };
    }
    
    return { sent: true };
  } catch (error) {
    console.error('[Discord] Alert error:', error);
    return { sent: false, reason: 'error', error: error.message };
  }
}

/**
 * Send evaluation failure alert
 * @param {Object} results - Evaluation results
 * @param {number} threshold - Pass rate threshold (default 80)
 */
export async function sendEvalFailureAlert(results, threshold = 80) {
  const passRate = ((results.passed / results.total) * 100).toFixed(1);
  
  if (parseFloat(passRate) >= threshold) {
    return { sent: false, reason: 'above_threshold' };
  }
  
  const embed = {
    title: '⚠️ AL Evaluation Alert',
    color: 0xf59e0b, // Amber
    fields: [
      {
        name: 'Pass Rate',
        value: `${passRate}% (threshold: ${threshold}%)`,
        inline: true,
      },
      {
        name: 'Results',
        value: `✅ ${results.passed} / ❌ ${results.failed}`,
        inline: true,
      },
      {
        name: 'Avg Score',
        value: `${results.avgScore}/10`,
        inline: true,
      },
    ],
    timestamp: new Date().toISOString(),
  };
  
  if (results.runId) {
    embed.footer = { text: `Run ID: ${results.runId}` };
  }
  
  // Add failed test cases summary
  if (results.failedCases?.length > 0) {
    const failedList = results.failedCases
      .slice(0, 5)
      .map(c => `• ${c.id}: ${c.reason || 'Failed'}`)
      .join('\n');
    
    embed.fields.push({
      name: 'Failed Cases',
      value: failedList + (results.failedCases.length > 5 ? '\n...' : ''),
      inline: false,
    });
  }
  
  return sendDiscordAlert(
    `🚨 **AL Evaluation pass rate dropped below ${threshold}%**`,
    { embeds: [embed] }
  );
}

/**
 * Send evaluation success summary (optional, for daily reports)
 * @param {Object} results - Evaluation results
 */
export async function sendEvalSuccessAlert(results) {
  const passRate = ((results.passed / results.total) * 100).toFixed(1);
  
  const embed = {
    title: '✅ AL Evaluation Passed',
    color: 0x10b981, // Teal
    fields: [
      {
        name: 'Pass Rate',
        value: `${passRate}%`,
        inline: true,
      },
      {
        name: 'Total Tests',
        value: `${results.total}`,
        inline: true,
      },
      {
        name: 'Avg Score',
        value: `${results.avgScore}/10`,
        inline: true,
      },
    ],
    timestamp: new Date().toISOString(),
  };
  
  return sendDiscordAlert(null, { embeds: [embed] });
}
