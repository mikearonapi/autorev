/**
 * Server-Side Error Aggregation
 * 
 * Aggregates errors in-memory to provide meaningful Discord notifications
 * instead of spam. Tracks:
 * - First seen / last seen
 * - User impact (unique users/sessions affected)
 * - Occurrence count
 * - Browser/device breakdown
 * - Affected pages
 * 
 * Flushes to Discord on a schedule or when threshold is reached.
 */

// In-memory error aggregation
// In production, this could be moved to Redis for persistence across serverless invocations
const errorAggregates = new Map();

// Configuration
const CONFIG = {
  FLUSH_INTERVAL_MS: 5 * 60 * 1000, // Flush every 5 minutes
  IMMEDIATE_THRESHOLD: 5, // Send immediately if 5+ occurrences in first minute
  CRITICAL_USER_THRESHOLD: 10, // Mark as critical if affecting 10+ users
  MAX_AGGREGATES: 100, // Prevent memory bloat
};

// Severity rankings for prioritization
const SEVERITY_RANK = {
  blocking: 3,
  major: 2,
  minor: 1,
};

/**
 * Generate a consistent error signature for aggregation
 */
function generateErrorSignature(errorData) {
  const message = errorData.errorMetadata?.errorMessage || errorData.message || 'Unknown';
  const page = errorData.errorMetadata?.pageUrl || errorData.page_url || '';
  const componentOrRoute = errorData.errorMetadata?.componentName || errorData.errorMetadata?.apiRoute || '';
  
  // Normalize URLs to group similar pages (remove query params and hashes)
  const normalizedPage = page.split('?')[0].split('#')[0];
  
  return `${message.slice(0, 200)}||${normalizedPage}||${componentOrRoute}`;
}

/**
 * Extract browser info from error data
 */
function extractBrowserInfo(errorData) {
  const browserInfo = errorData.errorMetadata?.browser || errorData.browser_info?.browser;
  const os = errorData.errorMetadata?.os || errorData.browser_info?.os;
  const isMobile = errorData.errorMetadata?.isMobile || false;
  
  return {
    browser: browserInfo || 'Unknown',
    os: os || 'Unknown',
    device: isMobile ? 'Mobile' : 'Desktop',
  };
}

/**
 * Aggregate an error occurrence
 */
export function aggregateError(errorData) {
  const signature = generateErrorSignature(errorData);
  const now = Date.now();
  
  // Prevent memory bloat
  if (!errorAggregates.has(signature) && errorAggregates.size >= CONFIG.MAX_AGGREGATES) {
    // Remove oldest aggregate
    const oldestKey = Array.from(errorAggregates.keys())[0];
    errorAggregates.delete(oldestKey);
  }
  
  if (!errorAggregates.has(signature)) {
    // New error type
    errorAggregates.set(signature, {
      signature,
      firstSeen: now,
      lastSeen: now,
      count: 1,
      affectedUsers: new Set(),
      affectedSessions: new Set(),
      browsers: new Map(),
      pages: new Map(),
      severity: errorData.severity || 'major',
      category: errorData.category || 'auto-error',
      errorData: {
        message: errorData.errorMetadata?.errorMessage || errorData.message,
        stack: errorData.errorMetadata?.stackTrace?.split('\n').slice(0, 3).join('\n'), // First 3 lines
        component: errorData.errorMetadata?.componentName,
        apiRoute: errorData.errorMetadata?.apiRoute,
      },
    });
  } else {
    // Existing error - update aggregate
    const aggregate = errorAggregates.get(signature);
    aggregate.count++;
    aggregate.lastSeen = now;
    
    // Update severity if more severe
    const currentSeverityRank = SEVERITY_RANK[aggregate.severity] || 0;
    const newSeverityRank = SEVERITY_RANK[errorData.severity] || 0;
    if (newSeverityRank > currentSeverityRank) {
      aggregate.severity = errorData.severity;
    }
  }
  
  // Track affected users/sessions
  const aggregate = errorAggregates.get(signature);
  const userId = errorData.user_id;
  const sessionId = errorData.errorMetadata?.errorHash || `session-${Date.now()}`;
  
  if (userId) aggregate.affectedUsers.add(userId);
  aggregate.affectedSessions.add(sessionId);
  
  // Track browser breakdown
  const browserInfo = extractBrowserInfo(errorData);
  const browserKey = `${browserInfo.browser} (${browserInfo.device})`;
  aggregate.browsers.set(browserKey, (aggregate.browsers.get(browserKey) || 0) + 1);
  
  // Track affected pages
  const page = errorData.errorMetadata?.pageUrl || errorData.page_url || 'Unknown';
  const pagePath = page.split('?')[0].split('#')[0]; // Normalize
  aggregate.pages.set(pagePath, (aggregate.pages.get(pagePath) || 0) + 1);
  
  // Check if we should send immediately
  const timeSinceFirst = now - aggregate.firstSeen;
  if (aggregate.count >= CONFIG.IMMEDIATE_THRESHOLD && timeSinceFirst < 60_000) {
    return { shouldFlushNow: true, aggregate };
  }
  
  return { shouldFlushNow: false, aggregate };
}

/**
 * Get top N items from a Map by value
 */
function getTopN(map, n = 3) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, value]) => ({ name: key, count: value }));
}

/**
 * Format aggregate for Discord notification
 */
export function formatAggregateForDiscord(aggregate) {
  const userCount = aggregate.affectedUsers.size;
  const sessionCount = aggregate.affectedSessions.size;
  const impactLabel = userCount > 0 ? `${userCount} users` : `${sessionCount} sessions`;
  
  // Determine criticality
  const isCritical = 
    aggregate.severity === 'blocking' || 
    userCount >= CONFIG.CRITICAL_USER_THRESHOLD || 
    aggregate.count >= 50;
  
  const emoji = isCritical ? '🔴' : aggregate.severity === 'blocking' ? '🚫' : aggregate.severity === 'major' ? '⚠️' : '🟡';
  
  const timeSinceFirst = Date.now() - aggregate.firstSeen;
  const duration = timeSinceFirst < 60_000 
    ? `${Math.round(timeSinceFirst / 1000)}s ago`
    : timeSinceFirst < 3600_000
    ? `${Math.round(timeSinceFirst / 60_000)}m ago`
    : `${Math.round(timeSinceFirst / 3600_000)}h ago`;
  
  // Top browsers and pages
  const topBrowsers = getTopN(aggregate.browsers, 2);
  const topPages = getTopN(aggregate.pages, 3);
  
  return {
    title: `${emoji} ${isCritical ? 'CRITICAL ERROR' : 'Error'} (${impactLabel})`,
    severity: isCritical ? 'blocking' : aggregate.severity,
    message: aggregate.errorData.message || 'Unknown error',
    count: aggregate.count,
    firstSeen: duration,
    userCount,
    sessionCount,
    topBrowsers,
    topPages,
    component: aggregate.errorData.component,
    apiRoute: aggregate.errorData.apiRoute,
    stack: aggregate.errorData.stack,
  };
}

/**
 * Get all aggregates ready to flush
 */
export function getAggregatesReadyToFlush(minAge = CONFIG.FLUSH_INTERVAL_MS) {
  const now = Date.now();
  const ready = [];
  
  for (const [signature, aggregate] of errorAggregates.entries()) {
    const age = now - aggregate.firstSeen;
    if (age >= minAge || aggregate.count >= CONFIG.IMMEDIATE_THRESHOLD) {
      ready.push(aggregate);
      errorAggregates.delete(signature); // Remove from pending
    }
  }
  
  // Sort by priority (blocking > major > minor, then by user impact)
  ready.sort((a, b) => {
    const aSeverity = SEVERITY_RANK[a.severity] || 0;
    const bSeverity = SEVERITY_RANK[b.severity] || 0;
    if (aSeverity !== bSeverity) return bSeverity - aSeverity;
    
    const aUsers = a.affectedUsers.size;
    const bUsers = b.affectedUsers.size;
    if (aUsers !== bUsers) return bUsers - aUsers;
    
    return b.count - a.count;
  });
  
  return ready;
}

/**
 * Clear all aggregates (for testing or manual flush)
 */
export function clearAggregates() {
  errorAggregates.clear();
}

/**
 * Get current aggregate stats (for debugging)
 */
export function getAggregateStats() {
  return {
    totalAggregates: errorAggregates.size,
    aggregates: Array.from(errorAggregates.values()).map(agg => ({
      message: agg.errorData.message,
      count: agg.count,
      users: agg.affectedUsers.size,
      age: Date.now() - agg.firstSeen,
    })),
  };
}

const errorAggregator = {
  aggregateError,
  getAggregatesReadyToFlush,
  formatAggregateForDiscord,
  clearAggregates,
  getAggregateStats,
};

export default errorAggregator;

