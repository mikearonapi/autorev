'use client';

/**
 * Internal Feedback Admin Page
 * 
 * Enhanced for beta feedback review with:
 * - Category and severity filters
 * - User tier breakdown
 * - Bulk actions (mark resolved, export)
 * - Browser/context info display
 * 
 * Uses the GET /api/feedback endpoint to fetch data.
 */

import { useState, useEffect, useMemo } from 'react';
import styles from './page.module.css';

// SVG Icons for admin feedback display
const Icons = {
  star: ({ filled = true, size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  image: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  car: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>
    </svg>
  ),
  mapPin: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  globe: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  mail: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  link: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  calendar: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  check: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

// Status colors
const statusColors = {
  new: '#3b82f6',
  reviewed: '#f59e0b',
  in_progress: '#8b5cf6',
  resolved: '#10b981',
  wont_fix: '#6b7280',
  duplicate: '#6b7280',
};

// Priority colors
const priorityColors = {
  low: '#6b7280',
  normal: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444',
};

// Category labels and colors
const categoryConfig = {
  bug: { label: 'Bug', color: '#ef4444' },
  feature: { label: 'Feature', color: '#10b981' },
  data: { label: 'Data Issue', color: '#f59e0b' },
  general: { label: 'General', color: '#6b7280' },
  praise: { label: 'Praise', color: '#ec4899' },
};

// Severity labels and colors
const severityConfig = {
  blocking: { label: 'Blocking', color: '#ef4444' },
  major: { label: 'Major', color: '#f59e0b' },
  minor: { label: 'Minor', color: '#6b7280' },
};

// Legacy feedback type labels
const typeLabels = {
  like: 'Like',
  dislike: 'Dislike',
  feature: 'Feature',
  bug: 'Bug',
  question: 'Question',
  car_request: 'Car Request',
  other: 'Other',
};

// Tier labels
const tierLabels = {
  free: 'Free',
  collector: 'Enthusiast',
  tuner: 'Tuner',
  admin: 'Admin',
};

export default function FeedbackAdminPage() {
  const [feedback, setFeedback] = useState([]);
  const [counts, setCounts] = useState([]);
  const [categoryStats, setCategoryStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [unresolvedOnly, setUnresolvedOnly] = useState(false);
  
  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFeedback = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Build query params
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (severityFilter !== 'all') params.set('severity', severityFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (unresolvedOnly) params.set('unresolved', 'true');
      params.set('limit', '100');
      
      const response = await fetch(`/api/feedback?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }
      const data = await response.json();
      setFeedback(data.recent || []);
      setCounts(data.counts || []);
      setCategoryStats(data.categoryStats || {});
    } catch (err) {
      console.error('[FeedbackAdmin] Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply client-side tier filter
  const filteredFeedback = useMemo(() => {
    return feedback.filter((item) => {
      const tierMatch = tierFilter === 'all' || item.user_tier === tierFilter;
      return tierMatch;
    });
  }, [feedback, tierFilter]);

  // Group occurrences by error hash for auto-errors
  const occurrenceByHash = useMemo(() => {
    const counts = {};
    feedback.forEach((item) => {
      const hash = item.error_metadata?.errorHash || item.error_metadata?.error_hash;
      if (!hash) return;
      counts[hash] = (counts[hash] || 0) + 1;
    });
    return counts;
  }, [feedback]);

  // Toggle selection
  const toggleSelection = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select/deselect all
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredFeedback.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFeedback.map(f => f.id)));
    }
  };

  // Bulk resolve
  const bulkResolve = async () => {
    if (selectedIds.size === 0) return;
    
    setIsUpdating(true);
    try {
      const promises = Array.from(selectedIds).map(id =>
        fetch('/api/feedback', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feedbackId: id, resolved: true }),
        })
      );
      
      await Promise.all(promises);
      setSelectedIds(new Set());
      await fetchFeedback();
    } catch (err) {
      console.error('[FeedbackAdmin] Bulk resolve error:', err);
      alert('Failed to resolve some feedback items');
    } finally {
      setIsUpdating(false);
    }
  };

  // Export to CSV
  const exportToCsv = () => {
    const headers = [
      'ID', 'Category', 'Severity', 'Message', 'Email', 'User Tier',
      'Page URL', 'Car', 'Feature', 'Status', 'Priority', 'Rating',
      'Browser', 'Screenshot URL', 'Created At', 'Resolved At'
    ];
    
    const rows = filteredFeedback.map(item => [
      item.id,
      item.category || '',
      item.severity || '',
      `"${(item.message || '').replace(/"/g, '""')}"`,
      item.email || '',
      item.user_tier || '',
      item.page_url || '',
      item.car_slug || '',
      item.feature_context || '',
      item.status || '',
      item.priority || '',
      item.rating || '',
      item.browser_info?.browser || '',
      item.screenshot_url || '',
      item.created_at || '',
      item.resolved_at || '',
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDisplayLabel = (item) => {
    if (item.category && categoryConfig[item.category]) {
      return categoryConfig[item.category].label;
    }
    return typeLabels[item.feedback_type] || item.feedback_type;
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading feedback...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error Loading Feedback</h2>
          <p>{error}</p>
          <button onClick={fetchFeedback} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>📬 Beta Feedback Dashboard</h1>
        <p className={styles.subtitle}>
          Review and manage user feedback submissions
        </p>
      </header>

      {/* Category Stats */}
      <div className={styles.statsSection}>
        <h2 className={styles.sectionTitle}>📊 Unresolved by Category</h2>
        <div className={styles.summaryGrid}>
          {Object.entries(categoryStats).map(([cat, stats]) => {
            const config = categoryConfig[cat] || { label: cat, color: '#6b7280' };
            return (
              <div 
                key={cat} 
                className={styles.summaryCard}
                style={{ borderLeftColor: config.color }}
              >
                <div className={styles.summaryIcon}>
                  {config.label.split(' ')[0]}
                </div>
                <div className={styles.summaryContent}>
                  <div className={styles.summaryType}>
                    {config.label.split(' ').slice(1).join(' ') || cat}
                  </div>
                  <div className={styles.summaryStats}>
                    <span className={styles.summaryTotal}>{stats.total} total</span>
                    {stats.blocking > 0 && (
                      <span className={styles.summaryBlocking}>🚨 {stats.blocking}</span>
                    )}
                    {stats.major > 0 && (
                      <span className={styles.summaryMajor}>⚠️ {stats.major}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {Object.keys(categoryStats).length === 0 && (
            <div className={styles.noData}>No unresolved feedback 🎉</div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <label>Category:</label>
            <select 
              value={categoryFilter} 
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                fetchFeedback();
              }}
            >
              <option value="all">All Categories</option>
              <option value="bug">🐛 Bug</option>
              <option value="feature">💡 Feature</option>
              <option value="data">📊 Data Issue</option>
              <option value="general">💬 General</option>
              <option value="praise">❤️ Praise</option>
              <option value="auto-error">⚙️ Auto-Error</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label>Severity:</label>
            <select 
              value={severityFilter} 
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                fetchFeedback();
              }}
            >
              <option value="all">All Severities</option>
              <option value="blocking">🚨 Blocking</option>
              <option value="major">⚠️ Major</option>
              <option value="minor">ℹ️ Minor</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label>Status:</label>
            <select 
              value={statusFilter} 
              onChange={(e) => {
                setStatusFilter(e.target.value);
                fetchFeedback();
              }}
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="wont_fix">Won't Fix</option>
              <option value="duplicate">Duplicate</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label>Tier:</label>
            <select 
              value={tierFilter} 
              onChange={(e) => setTierFilter(e.target.value)}
            >
              <option value="all">All Tiers</option>
              <option value="free">Free</option>
              <option value="collector">Collector</option>
              <option value="tuner">Tuner</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={unresolvedOnly}
                onChange={(e) => {
                  setUnresolvedOnly(e.target.checked);
                  fetchFeedback();
                }}
              />
              Unresolved only
            </label>
          </div>
        </div>
        
        <div className={styles.filterActions}>
          <button onClick={fetchFeedback} className={styles.refreshButton}>
            🔄 Refresh
          </button>
          <button onClick={exportToCsv} className={styles.exportButton}>
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className={styles.bulkActions}>
          <span>{selectedIds.size} selected</span>
          <button 
            onClick={bulkResolve} 
            className={styles.bulkResolveButton}
            disabled={isUpdating}
          >
            {isUpdating ? 'Resolving...' : '✓ Mark Resolved'}
          </button>
          <button 
            onClick={() => setSelectedIds(new Set())} 
            className={styles.clearSelectionButton}
          >
            Clear
          </button>
        </div>
      )}

      {/* Feedback List */}
      <div className={styles.feedbackList}>
        {/* Select All */}
        {filteredFeedback.length > 0 && (
          <div className={styles.selectAllRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={selectedIds.size === filteredFeedback.length && filteredFeedback.length > 0}
                onChange={toggleSelectAll}
              />
              Select All
            </label>
          </div>
        )}

        {filteredFeedback.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No feedback matching your filters</p>
          </div>
        ) : (
          filteredFeedback.map((item) => (
            <div 
              key={item.id} 
              className={`${styles.feedbackCard} ${selectedIds.has(item.id) ? styles.feedbackCardSelected : ''}`}
            >
              <div className={styles.feedbackSelectColumn}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.id)}
                  onChange={() => toggleSelection(item.id)}
                />
              </div>
              
              <div className={styles.feedbackContent}>
                <div className={styles.feedbackHeader}>
                  {/* Category/Type */}
                  <span 
                    className={styles.feedbackCategory}
                    style={{ 
                      backgroundColor: categoryConfig[item.category]?.color || '#6b7280',
                      color: '#fff'
                    }}
                  >
                    {getDisplayLabel(item)}
                  </span>
                  
                  {/* Severity (for bugs) */}
                  {item.severity && (
                    <span 
                      className={styles.feedbackSeverity}
                      style={{ 
                        borderColor: severityConfig[item.severity]?.color || '#6b7280',
                        color: severityConfig[item.severity]?.color || '#6b7280'
                      }}
                    >
                      {severityConfig[item.severity]?.label || item.severity}
                    </span>
                  )}
                  
                  {/* Status */}
                  <span
                    className={styles.feedbackStatus}
                    style={{ backgroundColor: statusColors[item.status] }}
                  >
                    {item.status}
                  </span>
                  
                  {/* Priority */}
                  <span
                    className={styles.feedbackPriority}
                    style={{ borderColor: priorityColors[item.priority] }}
                  >
                    {item.priority}
                  </span>
                  
                  {/* Rating */}
                  {item.rating && (
                    <span className={styles.feedbackRating}>
                      {[...Array(5)].map((_, i) => (
                        <Icons.star key={i} filled={i < item.rating} size={12} />
                      ))}
                    </span>
                  )}
                  
                  {/* User Tier */}
                  {item.user_tier && (
                    <span className={styles.feedbackTier}>
                      {tierLabels[item.user_tier] || item.user_tier}
                    </span>
                  )}
                </div>
                
                <p className={styles.feedbackMessage}>{item.message}</p>
                
                {/* Context Row */}
                <div className={styles.feedbackContext}>
                  {item.car_slug && (
                    <span className={styles.contextItem}>
                      <Icons.car size={12} /> {item.car_slug}
                    </span>
                  )}
                  {item.feature_context && (
                    <span className={styles.contextItem}>
                      <Icons.mapPin size={12} /> {item.feature_context}
                    </span>
                  )}
                  {item.browser_info?.browser && (
                    <span className={styles.contextItem}>
                      <Icons.globe size={12} /> {item.browser_info.browser} / {item.browser_info.os}
                    </span>
                  )}
                </div>
                
                <div className={styles.feedbackMeta}>
                  {item.email && (
                    <a href={`mailto:${item.email}`} className={styles.feedbackEmail}>
                      <Icons.mail size={12} /> {item.email}
                    </a>
                  )}
                  {item.page_url && (
                    <a 
                      href={item.page_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.feedbackPageUrl}
                    >
                      <Icons.link size={12} /> View Page
                    </a>
                  )}
                  {item.screenshot_url && (
                    <a 
                      href={item.screenshot_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.feedbackScreenshot}
                    >
                      <Icons.image size={12} /> 📸 Screenshot
                    </a>
                  )}
                  <span className={styles.feedbackDate}>
                    <Icons.calendar size={12} /> {formatDate(item.created_at)}
                  </span>
                  {item.resolved_at && (
                    <span className={styles.feedbackResolved}>
                      <Icons.check size={12} /> Resolved {formatDate(item.resolved_at)}
                    </span>
                  )}
                </div>
                
                {/* Screenshot Preview */}
                {item.screenshot_url && (
                  <div className={styles.screenshotPreview}>
                    <a 
                      href={item.screenshot_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.screenshotLink}
                    >
                      <img 
                        src={item.screenshot_url} 
                        alt="Feedback screenshot" 
                        className={styles.screenshotThumbnail}
                        loading="lazy"
                      />
                      <span className={styles.screenshotOverlayText}>Click to view full size</span>
                    </a>
                  </div>
                )}

                {item.category === 'auto-error' && (
                  <div className={styles.errorDetailsCard}>
                    <div className={styles.errorDetailsHeader}>
                      <span className={styles.contextItem}>
                        🔁 Occurrences: {(() => {
                          const hash = item.error_metadata?.errorHash || item.error_metadata?.error_hash;
                          return hash ? occurrenceByHash[hash] || 1 : 1;
                        })()}
                      </span>
                      {item.error_metadata?.apiRoute && (
                        <span className={styles.contextItem}>
                          🌐 {item.error_metadata.apiRoute}
                        </span>
                      )}
                      {item.error_metadata?.errorCode && (
                        <span className={styles.contextItem}>
                          ⚠️ {item.error_metadata.errorCode}
                        </span>
                      )}
                    </div>
                    <details
                      className={styles.errorDetailsBody}
                      open={expandedIds.has(item.id)}
                      onToggle={(e) => {
                        setExpandedIds(prev => {
                          const next = new Set(prev);
                          if (e.target.open) {
                            next.add(item.id);
                          } else {
                            next.delete(item.id);
                          }
                          return next;
                        });
                      }}
                    >
                      <summary>View error metadata</summary>
                      <pre className={styles.errorMetadataPre}>
                        {JSON.stringify(item.error_metadata, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Total Count */}
      <div className={styles.totalCount}>
        Showing {filteredFeedback.length} of {feedback.length} feedback items
      </div>
    </div>
  );
}





