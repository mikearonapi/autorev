'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './EmailDashboard.module.css';

/**
 * EmailDashboard Component
 * 
 * Admin dashboard for email analytics, logs, queue management, and automation workflows.
 */

// SVG Icons for professional appearance (emojis only in actual email templates)
const Icons = {
  mail: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" />
    </svg>
  ),
  wave: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 11v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-6M7 11V9a2 2 0 0 1 2-2M7 11h10M17 11V9a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <path d="M9 7V3a2 2 0 0 1 4 0v4" />
    </svg>
  ),
  clock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  ),
  gift: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="14" rx="1" /><path d="M12 8v14M3 12h18M19 8c0-2.5-2-4-4-4-1.5 0-2.5 1-3 2.5C11.5 5 10.5 4 9 4c-2 0-4 1.5-4 4" />
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  eye: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  send: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  zap: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  refresh: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" />
    </svg>
  ),
};

// Email templates - these match the templates defined in lib/email.js
// Status: 'active' = fully implemented with trigger, 'draft' = template exists but not triggered
const EMAIL_TEMPLATES_CONFIG = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    slug: 'welcome',
    subject: 'Welcome to AutoRev — Find What Drives You',
    description: 'Onboarding email sent on signup. Introduces key features and encourages first login.',
    category: 'transactional',
    status: 'active',
    iconKey: 'wave',
  },
  {
    id: 'inactivity-7d',
    name: '7-Day Nudge',
    slug: 'inactivity-7d',
    subject: 'Quick question for you',
    description: 'Re-engagement at 7 days inactive. Promotes AL assistant—"forums roast you, we don\'t."',
    category: 'marketing',
    status: 'active',
    iconKey: 'clock',
  },
  {
    id: 'inactivity-21d',
    name: '21-Day Win-back',
    slug: 'inactivity-21d',
    subject: 'Events near you this weekend',
    description: 'Win-back at 21 days inactive. Promotes events—real-world hook to re-engage.',
    category: 'marketing',
    status: 'active',
    iconKey: 'calendar',
  },
  {
    id: 'referral-reward',
    name: 'Referral Reward',
    slug: 'referral-reward',
    subject: 'You earned 200 AL credits! 🎁',
    description: 'Sent to referrer when their referred friend signs up. Awards 200 credits.',
    category: 'transactional',
    status: 'active',
    iconKey: 'gift',
  },
  {
    id: 'referral-invite',
    name: 'Referral Invite',
    slug: 'referral-invite',
    subject: 'Your friend thinks you\'d love AutoRev 🏎️',
    description: 'Invitation sent when user shares via email. Includes 200 credit bonus for new signups.',
    category: 'transactional',
    status: 'active',
    iconKey: 'mail',
  },
];

// Email automation definitions - these match the triggers in lib/email.js
const EMAIL_AUTOMATIONS = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    trigger: 'User Signup',
    template: 'welcome',
    description: 'Sent immediately when a new user creates an account',
    status: 'active',
    timing: 'Instant',
    iconKey: 'wave',
  },
  {
    id: 'inactivity-7d',
    name: '7-Day Nudge',
    trigger: '7 Days Inactive',
    template: 'inactivity-7d',
    description: 'Promotes AL assistant—low friction re-engagement',
    status: 'active',
    timing: 'Daily cron',
    iconKey: 'clock',
  },
  {
    id: 'inactivity-21d',
    name: '21-Day Win-back',
    trigger: '21 Days Inactive',
    template: 'inactivity-21d',
    description: 'Promotes events—real-world hook to bring them back',
    status: 'active',
    timing: 'Daily cron',
    iconKey: 'calendar',
  },
  {
    id: 'referral-reward',
    name: 'Referral Reward',
    trigger: 'Friend Signup',
    template: 'referral-reward',
    description: 'Triggered via auth callback when referred user completes signup',
    status: 'active',
    timing: 'Instant',
    iconKey: 'gift',
  },
  {
    id: 'referral-invite',
    name: 'Referral Invite',
    trigger: 'User Shares Link',
    template: 'referral-invite',
    description: 'Sent when user invites friend via email from profile',
    status: 'active',
    timing: 'Instant',
    iconKey: 'mail',
  },
];

export default function EmailDashboard({ token }) {
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
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/emails?view=${activeTab}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
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
  }, [activeTab, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Send test email
  const handleSendTest = async () => {
    if (!testEmail || !token) return;
    
    setSending(true);
    try {
      const response = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
    if (!token) return;
    
    setSending(true);
    try {
      const response = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <span className={styles.titleIcon}>{Icons.mail}</span>
            <h2 className={styles.title}>Email Management</h2>
          </div>
          <p className={styles.subtitle}>Automations, templates, and delivery</p>
        </div>
        <div className={styles.tabs}>
          {['analytics', 'automations', 'logs', 'queue', 'templates'].map((tab) => (
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
          {activeTab === 'analytics' && (
            <div className={styles.analyticsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{analytics?.total_sent || 0}</div>
                <div className={styles.statLabel}>Emails Sent</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{analytics?.total_delivered || 0}</div>
                <div className={styles.statLabel}>Delivered</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{analytics?.total_bounced || 0}</div>
                <div className={styles.statLabel}>Bounced</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{analytics?.total_failed || 0}</div>
                <div className={styles.statLabel}>Failed</div>
              </div>

              {/* Delivery Rate */}
              <div className={styles.deliveryRate}>
                <div className={styles.deliveryRateHeader}>
                  <h3>Delivery Rate</h3>
                  <span className={styles.deliveryRateValue}>
                    {analytics?.total_sent > 0 
                      ? Math.round((analytics?.total_delivered / analytics?.total_sent) * 100) 
                      : 0}%
                  </span>
                </div>
                <div className={styles.deliveryRateBar}>
                  <div 
                    className={styles.deliveryRateFill} 
                    style={{ 
                      width: analytics?.total_sent > 0 
                        ? `${(analytics?.total_delivered / analytics?.total_sent) * 100}%` 
                        : '0%' 
                    }}
                  />
                </div>
              </div>

              {analytics?.by_template && Object.keys(analytics.by_template).length > 0 && (
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
              
              {(!analytics?.by_template || Object.keys(analytics?.by_template || {}).length === 0) && (
                <div className={styles.emptyAnalytics}>
                  <p>No email activity in the selected period.</p>
                  <p className={styles.emptyTip}>Emails will appear here once sent via automations or manually.</p>
                </div>
              )}
            </div>
          )}
          
          {/* Automations Tab */}
          {activeTab === 'automations' && (
            <div className={styles.automationsContainer}>
              <div className={styles.automationsList}>
                {EMAIL_AUTOMATIONS.map((automation) => (
                  <div key={automation.id} className={`${styles.automationRow} ${automation.status === 'draft' ? styles.automationDraft : ''}`}>
                    <div className={styles.automationIcon}>{Icons[automation.iconKey]}</div>
                    <div className={styles.automationMain}>
                      <div className={styles.automationHeader}>
                        <span className={styles.automationName}>{automation.name}</span>
                        <span className={`${styles.statusBadge} ${styles[`status${automation.status.charAt(0).toUpperCase() + automation.status.slice(1)}`]}`}>
                          {automation.status === 'active' ? 'Active' : 'Draft'}
                        </span>
                      </div>
                      <div className={styles.automationMeta}>
                        <span><strong>Trigger:</strong> {automation.trigger}</span>
                        <span><strong>Timing:</strong> {automation.timing}</span>
                        <code className={styles.templateCode}>{automation.template}</code>
                      </div>
                    </div>
                    <button
                      onClick={() => window.open(`/api/admin/emails/preview?template=${automation.template}&format=html&token=${encodeURIComponent(token)}`, '_blank')}
                      className={styles.iconBtn}
                      title="Preview"
                    >
                      {Icons.eye}
                    </button>
                  </div>
                ))}
              </div>
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
                  {Icons.refresh} {sending ? 'Processing...' : 'Process Queue'}
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

          {/* Templates Tab - Template management with preview and test sending */}
          {activeTab === 'templates' && (
            <div className={styles.templatesContainer}>
              <div className={styles.templatesList}>
                {EMAIL_TEMPLATES_CONFIG.map((template) => (
                  <div key={template.id} className={`${styles.templateRow} ${template.status === 'draft' ? styles.templateDraft : ''}`}>
                    <div className={styles.templateIcon}>{Icons[template.iconKey]}</div>
                    <div className={styles.templateMain}>
                      <div className={styles.templateHeader}>
                        <span className={styles.templateName}>{template.name}</span>
                        <span className={`${styles.statusBadge} ${styles[`status${template.status.charAt(0).toUpperCase() + template.status.slice(1)}`]}`}>
                          {template.status === 'active' ? 'Active' : 'Draft'}
                        </span>
                        <span className={styles.categoryBadge}>{template.category}</span>
                      </div>
                      <div className={styles.templateSubject}>{template.subject}</div>
                      <div className={styles.templateDesc}>{template.description}</div>
                    </div>
                    <div className={styles.templateActions}>
                      <button
                        onClick={() => window.open(`/api/admin/emails/preview?template=${template.slug}&format=html&token=${encodeURIComponent(token)}`, '_blank')}
                        className={styles.iconBtn}
                        title="Preview"
                      >
                        {Icons.eye}
                      </button>
                      <button
                        onClick={() => {
                          setTestTemplate(template.slug);
                          document.querySelector(`.${styles.testSection}`)?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={styles.iconBtn}
                        title="Send Test"
                      >
                        {Icons.send}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Test Email Section - Only on Templates tab */}
              <div className={styles.testSection}>
                <h4 className={styles.testTitle}>Send Test Email</h4>
                <div className={styles.testForm}>
                  <select
                    value={testTemplate}
                    onChange={(e) => setTestTemplate(e.target.value)}
                    className={styles.select}
                  >
                    {EMAIL_TEMPLATES_CONFIG.filter(t => t.status === 'active').map(t => (
                      <option key={t.slug} value={t.slug}>{t.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => window.open(`/api/admin/emails/preview?template=${testTemplate}&format=html&token=${encodeURIComponent(token)}`, '_blank')}
                    className={styles.previewBtn}
                    title="Preview"
                  >
                    {Icons.eye} Preview
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
                    {Icons.send} {sending ? 'Sending...' : 'Send Test'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

