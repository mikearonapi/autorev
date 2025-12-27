'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './EmailDashboard.module.css';

/**
 * EmailDashboard Component
 * 
 * Admin dashboard for email analytics, logs, and queue management.
 */
export default function EmailDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [queue, setQueue] = useState({ items: [], stats: {} });
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testEmail, setTestEmail] = useState('');
  const [testTemplate, setTestTemplate] = useState('welcome');
  const [sending, setSending] = useState(false);

  // Fetch data based on active tab
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/emails?view=${activeTab}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch data');
      }
      
      switch (activeTab) {
        case 'analytics':
          setAnalytics(data.analytics);
          break;
        case 'logs':
          setLogs(data.logs || []);
          break;
        case 'queue':
          setQueue({ items: data.queue || [], stats: data.stats || {} });
          break;
        case 'templates':
          setTemplates(data.templates || []);
          break;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Send test email
  const handleSendTest = async () => {
    if (!testEmail) return;
    
    setSending(true);
    try {
      const response = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_test',
          templateSlug: testTemplate,
          to: testEmail,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Test email sent successfully!');
        setTestEmail('');
      } else {
        alert(`Failed to send: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  // Process queue manually
  const handleProcessQueue = async () => {
    setSending(true);
    try {
      const response = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process_queue' }),
      });
      
      const data = await response.json();
      alert(`Queue processed: ${data.processed} sent, ${data.errors} errors`);
      fetchData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return styles.statusSuccess;
      case 'bounced':
      case 'failed':
      case 'complained':
        return styles.statusError;
      case 'pending':
      case 'queued':
        return styles.statusPending;
      default:
        return styles.statusDefault;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>📧 Email Management</h2>
        <div className={styles.tabs}>
          {['analytics', 'logs', 'queue', 'templates'].map((tab) => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : (
        <>
          {/* Analytics Tab */}
          {activeTab === 'analytics' && analytics && (
            <div className={styles.analyticsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{analytics.total_sent || 0}</div>
                <div className={styles.statLabel}>Emails Sent</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{analytics.total_delivered || 0}</div>
                <div className={styles.statLabel}>Delivered</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{analytics.total_bounced || 0}</div>
                <div className={styles.statLabel}>Bounced</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{analytics.total_failed || 0}</div>
                <div className={styles.statLabel}>Failed</div>
              </div>

              {analytics.by_template && Object.keys(analytics.by_template).length > 0 && (
                <div className={styles.templateBreakdown}>
                  <h3>By Template</h3>
                  <div className={styles.templateList}>
                    {Object.entries(analytics.by_template).map(([template, count]) => (
                      <div key={template} className={styles.templateItem}>
                        <span className={styles.templateName}>{template}</span>
                        <span className={styles.templateCount}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className={styles.logsContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Template</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className={styles.email}>{log.recipient_email}</td>
                      <td>{log.template_slug || '-'}</td>
                      <td className={styles.subject}>{log.subject}</td>
                      <td>
                        <span className={`${styles.status} ${getStatusClass(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className={styles.date}>{formatDate(log.sent_at || log.created_at)}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={5} className={styles.empty}>No email logs yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Queue Tab */}
          {activeTab === 'queue' && (
            <div className={styles.queueContainer}>
              <div className={styles.queueStats}>
                <div className={styles.statMini}>
                  <span className={styles.statMiniValue}>{queue.stats.pending || 0}</span>
                  <span className={styles.statMiniLabel}>Pending</span>
                </div>
                <div className={styles.statMini}>
                  <span className={styles.statMiniValue}>{queue.stats.processing || 0}</span>
                  <span className={styles.statMiniLabel}>Processing</span>
                </div>
                <div className={styles.statMini}>
                  <span className={styles.statMiniValue}>{queue.stats.sent || 0}</span>
                  <span className={styles.statMiniLabel}>Sent</span>
                </div>
                <div className={styles.statMini}>
                  <span className={styles.statMiniValue}>{queue.stats.failed || 0}</span>
                  <span className={styles.statMiniLabel}>Failed</span>
                </div>
                <button 
                  className={styles.processBtn}
                  onClick={handleProcessQueue}
                  disabled={sending}
                >
                  {sending ? 'Processing...' : 'Process Queue Now'}
                </button>
              </div>

              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Template</th>
                    <th>Scheduled</th>
                    <th>Status</th>
                    <th>Attempts</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.items.map((item) => (
                    <tr key={item.id}>
                      <td className={styles.email}>{item.recipient_email}</td>
                      <td>{item.template_slug}</td>
                      <td className={styles.date}>{formatDate(item.scheduled_for)}</td>
                      <td>
                        <span className={`${styles.status} ${getStatusClass(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>{item.attempts}/{item.max_attempts}</td>
                    </tr>
                  ))}
                  {queue.items.length === 0 && (
                    <tr>
                      <td colSpan={5} className={styles.empty}>Queue is empty</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className={styles.templatesContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Category</th>
                    <th>Requires Opt-in</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template) => (
                    <tr key={template.id}>
                      <td>
                        <strong>{template.name}</strong>
                        {template.description && (
                          <div className={styles.templateDesc}>{template.description}</div>
                        )}
                      </td>
                      <td><code>{template.slug}</code></td>
                      <td>{template.category}</td>
                      <td>{template.requires_opt_in || 'No'}</td>
                      <td>
                        <span className={`${styles.status} ${template.is_active ? styles.statusSuccess : styles.statusError}`}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Test Email Section */}
          <div className={styles.testSection}>
            <h3>Test & Preview Emails</h3>
            <div className={styles.testForm}>
              <select
                value={testTemplate}
                onChange={(e) => setTestTemplate(e.target.value)}
                className={styles.select}
              >
                <option value="welcome">Welcome</option>
                <option value="inactivity-7d">Inactivity (7 day)</option>
                <option value="referral-reward">Referral Reward</option>
              </select>
              <button
                onClick={() => window.open(`/api/admin/emails/preview?template=${testTemplate}&format=html`, '_blank')}
                className={styles.previewBtn}
              >
                👁️ Preview
              </button>
              <input
                type="email"
                placeholder="recipient@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className={styles.input}
              />
              <button
                onClick={handleSendTest}
                disabled={!testEmail || sending}
                className={styles.sendBtn}
              >
                {sending ? 'Sending...' : 'Send Test'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

