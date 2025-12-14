'use client';

/**
 * Internal Feedback Admin Page
 * 
 * View and manage user feedback submissions.
 * Uses the GET /api/feedback endpoint to fetch data.
 */

import { useState, useEffect } from 'react';
import styles from './page.module.css';

const statusColors = {
  new: '#3b82f6',
  reviewed: '#f59e0b',
  in_progress: '#8b5cf6',
  resolved: '#10b981',
  wont_fix: '#6b7280',
  duplicate: '#6b7280',
};

const priorityColors = {
  low: '#6b7280',
  normal: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444',
};

const typeLabels = {
  like: '❤️ Like',
  dislike: '👎 Dislike',
  feature: '💡 Feature',
  bug: '🐛 Bug',
  question: '❓ Question',
  car_request: '🚗 Car Request',
  other: '📝 Other',
};

export default function FeedbackAdminPage() {
  const [feedback, setFeedback] = useState([]);
  const [counts, setCounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/feedback');
      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }
      const data = await response.json();
      setFeedback(data.recent || []);
      setCounts(data.counts || []);
    } catch (err) {
      console.error('[FeedbackAdmin] Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFeedback = feedback.filter((item) => {
    const typeMatch = filter === 'all' || item.feedback_type === filter;
    const statusMatch = statusFilter === 'all' || item.status === statusFilter;
    return typeMatch && statusMatch;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        <h1>📬 User Feedback</h1>
        <p className={styles.subtitle}>
          Review and manage user feedback submissions
        </p>
      </header>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        {counts.map((count) => (
          <div key={count.type} className={styles.summaryCard}>
            <div className={styles.summaryIcon}>
              {typeLabels[count.type]?.split(' ')[0] || '📝'}
            </div>
            <div className={styles.summaryContent}>
              <div className={styles.summaryType}>
                {typeLabels[count.type]?.split(' ').slice(1).join(' ') || count.type}
              </div>
              <div className={styles.summaryStats}>
                <span className={styles.summaryTotal}>{count.total} total</span>
                {count.new_count > 0 && (
                  <span className={styles.summaryNew}>{count.new_count} new</span>
                )}
              </div>
            </div>
          </div>
        ))}
        {counts.length === 0 && (
          <div className={styles.noData}>No feedback yet</div>
        )}
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Type:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Types</option>
            <option value="like">❤️ Like</option>
            <option value="dislike">👎 Dislike</option>
            <option value="feature">💡 Feature</option>
            <option value="bug">🐛 Bug</option>
            <option value="question">❓ Question</option>
            <option value="car_request">🚗 Car Request</option>
            <option value="other">📝 Other</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="wont_fix">Won't Fix</option>
            <option value="duplicate">Duplicate</option>
          </select>
        </div>
        <button onClick={fetchFeedback} className={styles.refreshButton}>
          🔄 Refresh
        </button>
      </div>

      {/* Feedback List */}
      <div className={styles.feedbackList}>
        {filteredFeedback.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No feedback matching your filters</p>
          </div>
        ) : (
          filteredFeedback.map((item) => (
            <div key={item.id} className={styles.feedbackCard}>
              <div className={styles.feedbackHeader}>
                <span className={styles.feedbackType}>
                  {typeLabels[item.feedback_type] || item.feedback_type}
                </span>
                <span
                  className={styles.feedbackStatus}
                  style={{ backgroundColor: statusColors[item.status] }}
                >
                  {item.status}
                </span>
                <span
                  className={styles.feedbackPriority}
                  style={{ borderColor: priorityColors[item.priority] }}
                >
                  {item.priority}
                </span>
              </div>
              <p className={styles.feedbackMessage}>{item.message}</p>
              <div className={styles.feedbackMeta}>
                {item.email && (
                  <span className={styles.feedbackEmail}>
                    📧 {item.email}
                  </span>
                )}
                <span className={styles.feedbackDate}>
                  {formatDate(item.created_at)}
                </span>
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
