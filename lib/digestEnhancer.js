/**
 * Daily Digest Enhancer
 * 
 * Adds trends, alerts, wins, and action items to the daily digest
 */

/**
 * Calculate trend indicator (% change)
 */
function calculateTrend(current, previous) {
  if (previous === 0) {
    return current > 0 ? '(🆕 new!)' : '';
  }
  
  const change = ((current - previous) / previous) * 100;
  
  if (Math.abs(change) < 5) return ''; // No significant change
  
  const arrow = change > 0 ? '↑' : '↓';
  const emoji = change > 0 ? '📈' : '📉';
  
  if (Math.abs(change) > 50) {
    return `(${emoji} ${arrow}${Math.round(Math.abs(change))}%)`;
  }
  
  return `(${arrow}${Math.round(Math.abs(change))}%)`;
}

/**
 * Detect anomalies and create alerts
 */
function detectAlerts(stats, historicalAvg = {}) {
  const alerts = [];
  
  // Zero signups alert
  if (stats.signups === 0 && (historicalAvg.signups || 1) > 0) {
    alerts.push({
      severity: 'warning',
      message: 'Zero signups today (avg is ' + Math.round(historicalAvg.signups || 1) + '/day)',
    });
  }
  
  // Zero contacts alert
  if (stats.contacts === 0 && (historicalAvg.contacts || 1) > 1) {
    alerts.push({
      severity: 'warning',
      message: 'No contact form submissions (unusual)',
    });
  }
  
  // High error rate alert (based on unique errors only)
  if (stats.autoErrors > 5) {
    alerts.push({
      severity: 'critical',
      message: `${stats.autoErrors} unique errors detected (investigate immediately)`,
    });
  } else if (stats.autoErrors > 0) {
    alerts.push({
      severity: 'warning',
      message: `${stats.autoErrors} unique error${stats.autoErrors > 1 ? 's' : ''} detected`,
    });
  }
  
  // AL usage spike
  if (stats.alConversations > (historicalAvg.alConversations || 0) * 2 && historicalAvg.alConversations > 5) {
    alerts.push({
      severity: 'info',
      message: `AL usage spike: ${stats.alConversations} conversations (${Math.round((stats.alConversations / historicalAvg.alConversations - 1) * 100)}% above avg)`,
    });
  }
  
  return alerts;
}

/**
 * Identify wins
 */
function identifyWins(stats, previous = {}) {
  const wins = [];
  
  // New signup records
  if (stats.signups > (previous.signups || 0) && stats.signups >= 5) {
    wins.push(`${stats.signups} signups today (personal best!)`);
  }
  
  // Clean error record
  if (stats.autoErrors === 0 && (previous.autoErrors || 0) > 0) {
    wins.push('Zero auto-errors for 24+ hours 🎉');
  }
  
  // High AL engagement
  if (stats.alConversations > 20) {
    wins.push(`${stats.alConversations} AL conversations (users love it!)`);
  }
  
  // Positive feedback
  const positiveFeedback = stats.topFeedbackCategories?.some(cat => cat.includes('praise'));
  if (positiveFeedback) {
    wins.push('Received positive user feedback');
  }
  
  return wins;
}

/**
 * Identify trending items
 */
function identifyTrends(stats, previous = {}) {
  const trendingUp = [];
  const trendingDown = [];
  
  // Signups trend
  if (stats.signups > (previous.signups || 0) * 1.2 && stats.signups > 2) {
    trendingUp.push(`Signups: +${Math.round(((stats.signups / (previous.signups || 1)) - 1) * 100)}%`);
  } else if (stats.signups < (previous.signups || 0) * 0.8 && previous.signups > 2) {
    trendingDown.push(`Signups: -${Math.round((1 - (stats.signups / (previous.signups || 1))) * 100)}%`);
  }
  
  // AL usage trend
  if (stats.alConversations > (previous.alConversations || 0) * 1.2 && stats.alConversations > 3) {
    trendingUp.push(`AL usage: +${Math.round(((stats.alConversations / (previous.alConversations || 1)) - 1) * 100)}%`);
  }
  
  // Active users trend
  if (stats.activeUsers > (previous.activeUsers || 0) * 1.15) {
    trendingUp.push(`Active users: +${Math.round(((stats.activeUsers / (previous.activeUsers || 1)) - 1) * 100)}%`);
  }
  
  return { trendingUp, trendingDown };
}

/**
 * Generate action items
 */
function generateActionItems(stats, alerts) {
  const actions = [];
  
  // Follow up on high-quality leads
  if (stats.contacts > 0) {
    actions.push(`Review ${stats.contacts} new contact${stats.contacts !== 1 ? 's' : ''} and prioritize responses`);
  }
  
  // Address critical errors
  if (stats.autoErrors > 0) {
    actions.push(`Investigate ${stats.autoErrors} error${stats.autoErrors > 1 ? 's' : ''} in #errors channel`);
  }
  
  // Review unresolved bugs
  if (stats.unresolvedBugs > 10) {
    actions.push(`Triage ${stats.unresolvedBugs} unresolved bugs (prioritize blocking issues)`);
  }
  
  // Check anomalies
  alerts.forEach(alert => {
    if (alert.severity === 'critical') {
      actions.push(`URGENT: ${alert.message}`);
    }
  });
  
  return actions.slice(0, 5); // Max 5 action items
}

/**
 * Enhance digest stats with trends, alerts, wins, and actions
 */
export function enhanceDigestStats(currentStats, previousStats = {}, historicalAvg = {}) {
  // Calculate trends
  const signupTrend = calculateTrend(currentStats.signups || 0, previousStats.signups || 0);
  const activeUsersTrend = calculateTrend(currentStats.activeUsers || 0, previousStats.activeUsers || 0);
  const alConversationsTrend = calculateTrend(currentStats.alConversations || 0, previousStats.alConversations || 0);
  
  // Detect alerts
  const alerts = detectAlerts(currentStats, historicalAvg);
  
  // Identify wins
  const wins = identifyWins(currentStats, previousStats);
  
  // Identify trends
  const { trendingUp, trendingDown } = identifyTrends(currentStats, previousStats);
  
  // Generate action items
  const actionItems = generateActionItems(currentStats, alerts);
  
  return {
    ...currentStats,
    signupTrend,
    activeUsersTrend,
    alConversationsTrend,
    alerts,
    wins,
    trendingUp,
    trendingDown,
    actionItems,
  };
}

const digestEnhancer = {
  enhanceDigestStats,
  calculateTrend,
  detectAlerts,
  identifyWins,
  identifyTrends,
  generateActionItems,
};

export default digestEnhancer;

