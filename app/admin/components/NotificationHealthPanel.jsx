'use client';

import { useState, useEffect } from 'react';
import styles from './NotificationHealthPanel.module.css';

/**
 * NotificationHealthPanel Component
 * 
 * Admin dashboard panel showing notification system health metrics,
 * fatigue indicators, and trends.
 */
export default function NotificationHealthPanel() {
  const [metrics, setMetrics] = useState(null);
  const [fatiguedUsers, setFatiguedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricsRes, usersRes] = await Promise.all([
        fetch('/api/admin/notifications/metrics'),
        fetch('/api/admin/notifications/fatigued-users'),
      ]);

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setFatiguedUsers(usersData.users || []);
      }
    } catch (err) {
      console.error('Error fetching notification health:', err);
      setError('Failed to load notification health data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.panel}>
        <div className={styles.loading}>Loading notification health...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.panel}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  const healthStatus = metrics?.health?.status || 'unknown';
  const statusColors = {
    healthy: '#10b981',
    warning: '#f59e0b',
    critical: '#ef4444',
    unknown: '#6b7280',
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Notification Health</h3>
        <div 
          className={styles.statusBadge}
          style={{ backgroundColor: statusColors[healthStatus] }}
        >
          {healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
        </div>
      </div>

      {metrics && (
        <>
          {/* Key Metrics */}
          <div className={styles.metricsGrid}>
            <div className={styles.metric}>
              <span className={styles.metricValue}>{metrics.totals?.notificationsSent?.toLocaleString() || 0}</span>
              <span className={styles.metricLabel}>Notifications Sent</span>
              <span className={styles.metricPeriod}>{metrics.period?.days} days</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricValue}>{metrics.rates?.clickRate || 0}%</span>
              <span className={styles.metricLabel}>Click Rate</span>
              <span className={`${styles.metricStatus} ${metrics.rates?.clickRate < metrics.thresholds?.clickRateThreshold ? styles.bad : styles.good}`}>
                {metrics.rates?.clickRate < metrics.thresholds?.clickRateThreshold ? 'Below threshold' : 'Good'}
              </span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricValue}>{metrics.rates?.dismissRate || 0}%</span>
              <span className={styles.metricLabel}>Dismiss Rate</span>
              <span className={`${styles.metricStatus} ${metrics.rates?.dismissRate > metrics.thresholds?.dismissRateThreshold ? styles.bad : styles.good}`}>
                {metrics.rates?.dismissRate > metrics.thresholds?.dismissRateThreshold ? 'Above threshold' : 'Good'}
              </span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricValue}>{metrics.totals?.uniqueUsersReached?.toLocaleString() || 0}</span>
              <span className={styles.metricLabel}>Users Reached</span>
            </div>
          </div>

          {/* Interaction Breakdown */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Interactions</h4>
            <div className={styles.interactionBar}>
              {metrics.totals?.totalInteractions > 0 && (
                <>
                  <div 
                    className={styles.interactionSegment}
                    style={{ 
                      width: `${(metrics.interactions?.clicked / metrics.totals?.totalInteractions) * 100}%`,
                      backgroundColor: '#10b981',
                    }}
                    title={`Clicked: ${metrics.interactions?.clicked}`}
                  />
                  <div 
                    className={styles.interactionSegment}
                    style={{ 
                      width: `${(metrics.interactions?.viewed / metrics.totals?.totalInteractions) * 100}%`,
                      backgroundColor: '#3b82f6',
                    }}
                    title={`Viewed: ${metrics.interactions?.viewed}`}
                  />
                  <div 
                    className={styles.interactionSegment}
                    style={{ 
                      width: `${(metrics.interactions?.dismissed / metrics.totals?.totalInteractions) * 100}%`,
                      backgroundColor: '#ef4444',
                    }}
                    title={`Dismissed: ${metrics.interactions?.dismissed}`}
                  />
                </>
              )}
            </div>
            <div className={styles.interactionLegend}>
              <span><span className={styles.legendDot} style={{ backgroundColor: '#10b981' }} /> Clicked ({metrics.interactions?.clicked || 0})</span>
              <span><span className={styles.legendDot} style={{ backgroundColor: '#3b82f6' }} /> Viewed ({metrics.interactions?.viewed || 0})</span>
              <span><span className={styles.legendDot} style={{ backgroundColor: '#ef4444' }} /> Dismissed ({metrics.interactions?.dismissed || 0})</span>
            </div>
          </div>
        </>
      )}

      {/* Fatigued Users Alert */}
      {fatiguedUsers.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>
            ⚠️ Users Showing Fatigue ({fatiguedUsers.length})
          </h4>
          <div className={styles.fatiguedList}>
            {fatiguedUsers.slice(0, 5).map((user, index) => (
              <div key={index} className={styles.fatiguedUser}>
                <span className={styles.fatiguedUserId}>{user.userId.substring(0, 8)}...</span>
                <span className={styles.fatiguedCount}>{user.dismissCount} dismisses</span>
              </div>
            ))}
            {fatiguedUsers.length > 5 && (
              <div className={styles.moreUsers}>
                +{fatiguedUsers.length - 5} more users
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {healthStatus === 'warning' || healthStatus === 'critical' && (
        <div className={styles.recommendations}>
          <h4 className={styles.sectionTitle}>Recommendations</h4>
          <ul className={styles.recommendationList}>
            {metrics.rates?.dismissRate > metrics.thresholds?.dismissRateThreshold && (
              <li>Consider reducing notification frequency</li>
            )}
            {metrics.rates?.clickRate < metrics.thresholds?.clickRateThreshold && (
              <li>Improve notification relevance and targeting</li>
            )}
            {fatiguedUsers.length > 10 && (
              <li>Review notification strategy for fatigued users</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
