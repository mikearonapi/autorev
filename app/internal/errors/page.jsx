'use client';

/**
 * Internal Error Dashboard
 * 
 * Central hub for error triage and monitoring.
 * Shows:
 * - Real-time error statistics
 * - Error trends over time
 * - Top recurring errors
 * - Filterable error list with bulk actions
 * 
 * Goal: Spend 5 minutes here daily to know exactly what's broken.
 */

import { useState, useEffect, useMemo } from 'react';
import styles from './errors.module.css';

// Severity configuration
const severityConfig = {
  blocking: { label: 'Blocking', color: '#ef4444', emoji: '🚨' },
  major: { label: 'Major', color: '#f59e0b', emoji: '⚠️' },
  minor: { label: 'Minor', color: '#6b7280', emoji: 'ℹ️' },
};

// Error source configuration
const sourceConfig = {
  client: { label: 'Client', color: '#8b5cf6', emoji: '🖥️' },
  api: { label: 'API', color: '#3b82f6', emoji: '🌐' },
  cron: { label: 'Cron', color: '#10b981', emoji: '⏰' },
  external_api: { label: 'External API', color: '#f59e0b', emoji: '🔗' },
  database: { label: 'Database', color: '#ef4444', emoji: '💾' },
  auth: { label: 'Auth', color: '#ec4899', emoji: '🔐' },
};

// Status colors
const statusColors = {
  new: '#3b82f6',
  reviewed: '#f59e0b',
  in_progress: '#8b5cf6',
  resolved: '#10b981',
};

export default function ErrorDashboard() {
  const [stats, setStats] = useState(null);
  const [errors, setErrors] = useState([]);
  const [totalErrors, setTotalErrors] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [severity, setSeverity] = useState('');
  const [errorSource, setErrorSource] = useState('');
  const [status, setStatus] = useState('');
  const [resolved, setResolved] = useState('false'); // Default to unresolved
  const [search, setSearch] = useState('');
  const [feature, setFeature] = useState('');
  
  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Expanded error details
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Refresh stats every minute
    return () => clearInterval(interval);
  }, []);

  // Fetch errors when filters change
  useEffect(() => {
    fetchErrors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [severity, errorSource, status, resolved, feature]);

  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      const response = await fetch('/api/internal/errors/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('[ErrorDashboard] Stats error:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchErrors = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.set('category', 'auto-error');
      if (severity) params.set('severity', severity);
      if (errorSource) params.set('error_source', errorSource);
      if (status) params.set('status', status);
      if (resolved) params.set('resolved', resolved);
      if (feature) params.set('feature', feature);
      if (search) params.set('search', search);
      params.set('limit', '100');
      
      const response = await fetch(`/api/internal/errors?${params}`);
      if (!response.ok) throw new Error('Failed to fetch errors');
      const data = await response.json();
      
      setErrors(data.errors || []);
      setTotalErrors(data.total || 0);
    } catch (err) {
      console.error('[ErrorDashboard] Fetch error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Search with debounce
  const handleSearch = (value) => {
    setSearch(value);
  };

  const executeSearch = () => {
    fetchErrors();
  };

  // Toggle selection
  const toggleSelection = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select all visible
  const toggleSelectAll = () => {
    if (selectedIds.size === errors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(errors.map(e => e.id)));
    }
  };

  // Bulk actions
  const handleBulkAction = async (action) => {
    if (selectedIds.size === 0) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch('/api/internal/errors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          action,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to update');
      
      setSelectedIds(new Set());
      await fetchErrors();
      await fetchStats();
    } catch (err) {
      console.error('[ErrorDashboard] Bulk action error:', err);
      alert('Failed to update errors');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    return formatDate(timestamp);
  };

  // Extract readable error message
  const getErrorMessage = (item) => {
    const meta = item.error_metadata;
    return meta?.errorMessage || item.message?.replace(/^\[(CLIENT|API|CRON|EXTERNAL_API|DATABASE|AUTH)\]\s*/i, '') || 'Unknown error';
  };

  // Unique features for filter dropdown
  const uniqueFeatures = useMemo(() => {
    const features = new Set();
    errors.forEach(e => e.feature_context && features.add(e.feature_context));
    return Array.from(features).sort();
  }, [errors]);

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <h2>⚠️ Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={() => { fetchStats(); fetchErrors(); }} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>🚨 Error Dashboard</h1>
          <p className={styles.subtitle}>
            Monitor, triage, and resolve issues across AutoRev
          </p>
        </div>
        <button onClick={() => { fetchStats(); fetchErrors(); }} className={styles.refreshButton}>
          🔄 Refresh
        </button>
      </header>

      {/* Quick Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {isLoadingStats ? '...' : stats?.summary?.errorsLastHour || 0}
          </div>
          <div className={styles.statLabel}>Last Hour</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {isLoadingStats ? '...' : stats?.summary?.errorsLast24h || 0}
          </div>
          <div className={styles.statLabel}>Last 24h</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {isLoadingStats ? '...' : stats?.summary?.errorsLast7d || 0}
          </div>
          <div className={styles.statLabel}>Last 7 Days</div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardHighlight}`}>
          <div className={styles.statValue}>
            {isLoadingStats ? '...' : stats?.summary?.unresolvedTotal || 0}
          </div>
          <div className={styles.statLabel}>Unresolved</div>
        </div>
      </div>

      {/* Severity Breakdown */}
      {stats?.summary?.unresolvedByPriority && (
        <div className={styles.severityBreakdown}>
          <div className={styles.severityItem} style={{ '--severity-color': severityConfig.blocking.color }}>
            <span className={styles.severityEmoji}>🚨</span>
            <span className={styles.severityCount}>{stats.summary.unresolvedByPriority.blocking || 0}</span>
            <span className={styles.severityLabel}>Blocking</span>
          </div>
          <div className={styles.severityItem} style={{ '--severity-color': severityConfig.major.color }}>
            <span className={styles.severityEmoji}>⚠️</span>
            <span className={styles.severityCount}>{stats.summary.unresolvedByPriority.major || 0}</span>
            <span className={styles.severityLabel}>Major</span>
          </div>
          <div className={styles.severityItem} style={{ '--severity-color': severityConfig.minor.color }}>
            <span className={styles.severityEmoji}>ℹ️</span>
            <span className={styles.severityCount}>{stats.summary.unresolvedByPriority.minor || 0}</span>
            <span className={styles.severityLabel}>Minor</span>
          </div>
        </div>
      )}

      {/* Top Recurring Errors */}
      {stats?.topRecurring?.length > 0 && (
        <div className={styles.topErrorsSection}>
          <h2 className={styles.sectionTitle}>🔄 Top Recurring (24h)</h2>
          <div className={styles.topErrorsList}>
            {stats.topRecurring.slice(0, 5).map((err, idx) => (
              <div key={idx} className={styles.topErrorItem}>
                <span className={styles.topErrorCount}>{err.occurrence_count || 1}x</span>
                <span className={styles.topErrorMessage}>{err.message?.slice(0, 80) || 'Unknown'}...</span>
                <span className={styles.topErrorFeature}>{err.feature_context || 'N/A'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breakdowns */}
      <div className={styles.breakdownGrid}>
        {/* By Source */}
        {stats?.breakdown?.bySource && Object.keys(stats.breakdown.bySource).length > 0 && (
          <div className={styles.breakdownCard}>
            <h3>By Source</h3>
            <div className={styles.breakdownList}>
              {Object.entries(stats.breakdown.bySource)
                .sort((a, b) => b[1] - a[1])
                .map(([source, count]) => (
                  <div key={source} className={styles.breakdownItem}>
                    <span>{sourceConfig[source]?.emoji || '❓'} {sourceConfig[source]?.label || source}</span>
                    <span className={styles.breakdownCount}>{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* By Feature */}
        {stats?.breakdown?.byFeature && Object.keys(stats.breakdown.byFeature).length > 0 && (
          <div className={styles.breakdownCard}>
            <h3>By Feature</h3>
            <div className={styles.breakdownList}>
              {Object.entries(stats.breakdown.byFeature)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([feat, count]) => (
                  <div key={feat} className={styles.breakdownItem}>
                    <span>{feat || 'unknown'}</span>
                    <span className={styles.breakdownCount}>{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* By Version */}
        {stats?.breakdown?.byVersion && Object.keys(stats.breakdown.byVersion).length > 0 && (
          <div className={styles.breakdownCard}>
            <h3>By Deployment</h3>
            <div className={styles.breakdownList}>
              {Object.entries(stats.breakdown.byVersion)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([version, count]) => (
                  <div key={version} className={styles.breakdownItem}>
                    <span>🏷️ {version}</span>
                    <span className={styles.breakdownCount}>{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterRow}>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="">All Severities</option>
            <option value="blocking">🚨 Blocking</option>
            <option value="major">⚠️ Major</option>
            <option value="minor">ℹ️ Minor</option>
          </select>

          <select value={errorSource} onChange={(e) => setErrorSource(e.target.value)}>
            <option value="">All Sources</option>
            <option value="client">🖥️ Client</option>
            <option value="api">🌐 API</option>
            <option value="cron">⏰ Cron</option>
            <option value="external_api">🔗 External API</option>
            <option value="database">💾 Database</option>
            <option value="auth">🔐 Auth</option>
          </select>

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          <select value={resolved} onChange={(e) => setResolved(e.target.value)}>
            <option value="">All</option>
            <option value="false">Unresolved Only</option>
            <option value="true">Resolved Only</option>
          </select>

          {uniqueFeatures.length > 0 && (
            <select value={feature} onChange={(e) => setFeature(e.target.value)}>
              <option value="">All Features</option>
              {uniqueFeatures.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          )}
        </div>

        <div className={styles.searchRow}>
          <input
            type="text"
            placeholder="Search error messages..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
            className={styles.searchInput}
          />
          <button onClick={executeSearch} className={styles.searchButton}>
            🔍 Search
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className={styles.bulkActions}>
          <span>{selectedIds.size} selected</span>
          <button 
            onClick={() => handleBulkAction('resolve')} 
            className={styles.bulkResolveButton}
            disabled={isUpdating}
          >
            ✓ Resolve
          </button>
          <button 
            onClick={() => handleBulkAction('mark_reviewed')} 
            className={styles.bulkReviewButton}
            disabled={isUpdating}
          >
            👁️ Mark Reviewed
          </button>
          <button 
            onClick={() => setSelectedIds(new Set())} 
            className={styles.clearButton}
          >
            Clear
          </button>
        </div>
      )}

      {/* Error List */}
      <div className={styles.errorList}>
        {/* Select All */}
        {errors.length > 0 && (
          <div className={styles.selectAllRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={selectedIds.size === errors.length && errors.length > 0}
                onChange={toggleSelectAll}
              />
              Select All ({errors.length})
            </label>
            <span className={styles.totalCount}>
              {totalErrors} total errors matching filters
            </span>
          </div>
        )}

        {isLoading ? (
          <div className={styles.loading}>Loading errors...</div>
        ) : errors.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyEmoji}>🎉</span>
            <p>No errors matching your filters!</p>
          </div>
        ) : (
          errors.map((item) => (
            <div 
              key={item.id} 
              className={`${styles.errorCard} ${selectedIds.has(item.id) ? styles.errorCardSelected : ''}`}
            >
              <div className={styles.errorCheckbox}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.id)}
                  onChange={() => toggleSelection(item.id)}
                />
              </div>

              <div className={styles.errorContent}>
                <div className={styles.errorHeader}>
                  {/* Severity Badge */}
                  <span 
                    className={styles.severityBadge}
                    style={{ 
                      backgroundColor: severityConfig[item.severity]?.color || '#6b7280',
                    }}
                  >
                    {severityConfig[item.severity]?.emoji} {severityConfig[item.severity]?.label || item.severity}
                  </span>

                  {/* Source Badge */}
                  {item.error_source && (
                    <span 
                      className={styles.sourceBadge}
                      style={{ borderColor: sourceConfig[item.error_source]?.color || '#6b7280' }}
                    >
                      {sourceConfig[item.error_source]?.emoji} {sourceConfig[item.error_source]?.label || item.error_source}
                    </span>
                  )}

                  {/* Status */}
                  <span
                    className={styles.statusBadge}
                    style={{ backgroundColor: statusColors[item.status] || '#6b7280' }}
                  >
                    {item.status}
                  </span>

                  {/* Occurrence Count */}
                  {item.occurrence_count > 1 && (
                    <span className={styles.occurrenceBadge}>
                      🔁 {item.occurrence_count}x
                    </span>
                  )}

                  {/* Time */}
                  <span className={styles.errorTime}>
                    {formatTimeAgo(item.created_at)}
                  </span>
                </div>

                {/* Error Message */}
                <div className={styles.errorMessage}>
                  {getErrorMessage(item)}
                </div>

                {/* Context Row */}
                <div className={styles.errorContext}>
                  {item.feature_context && (
                    <span className={styles.contextTag}>📍 {item.feature_context}</span>
                  )}
                  {item.error_metadata?.apiRoute && (
                    <span className={styles.contextTag}>🌐 {item.error_metadata.apiRoute}</span>
                  )}
                  {item.error_metadata?.componentName && (
                    <span className={styles.contextTag}>🧩 {item.error_metadata.componentName}</span>
                  )}
                  {item.app_version && (
                    <span className={styles.contextTag}>🏷️ {item.app_version}</span>
                  )}
                  {item.page_url && (
                    <a href={item.page_url} target="_blank" rel="noopener noreferrer" className={styles.contextLink}>
                      🔗 View Page
                    </a>
                  )}
                </div>

                {/* Expandable Details */}
                <details 
                  className={styles.errorDetails}
                  open={expandedIds.has(item.id)}
                  onToggle={(e) => {
                    setExpandedIds(prev => {
                      const next = new Set(prev);
                      if (e.target.open) next.add(item.id);
                      else next.delete(item.id);
                      return next;
                    });
                  }}
                >
                  <summary>View Details</summary>
                  <div className={styles.detailsContent}>
                    {item.error_metadata?.stackTrace && (
                      <div className={styles.stackTrace}>
                        <strong>Stack Trace:</strong>
                        <pre>{item.error_metadata.stackTrace}</pre>
                      </div>
                    )}
                    <div className={styles.metadataJson}>
                      <strong>Full Metadata:</strong>
                      <pre>{JSON.stringify(item.error_metadata, null, 2)}</pre>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}



