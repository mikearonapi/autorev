'use client';

/**
 * System Health Panel Component
 * 
 * Displays errors, pipeline status, and system alerts.
 */

import styles from './SystemHealthPanel.module.css';

const STATUS_COLORS = {
  healthy: '#22c55e',
  info: '#3b82f6',
  warning: '#f59e0b',
  critical: '#ef4444',
};

// SVG Icons
const ErrorIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const WarningIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

function StatusIndicator({ status }) {
  return (
    <span 
      className={styles.statusDot}
      style={{ backgroundColor: STATUS_COLORS[status] || '#64748b' }}
    />
  );
}

function AlertItem({ alert }) {
  const Icon = alert.type === 'error' ? ErrorIcon : alert.type === 'warning' ? WarningIcon : InfoIcon;
  
  return (
    <div className={`${styles.alertItem} ${styles[alert.severity]}`}>
      <span className={styles.alertIcon}>
        <Icon />
      </span>
      <div className={styles.alertContent}>
        <span className={styles.alertMessage}>{alert.message}</span>
        <span className={styles.alertAction}>{alert.action}</span>
      </div>
    </div>
  );
}

function ErrorRow({ error }) {
  return (
    <div className={styles.errorRow}>
      <div className={styles.errorHeader}>
        <span className={`${styles.severityBadge} ${styles[error.severity || 'unknown']}`}>
          {error.severity || 'unknown'}
        </span>
        <span className={styles.errorStatus}>{error.status}</span>
        {error.occurrences > 1 && (
          <span className={styles.occurrences}>×{error.occurrences}</span>
        )}
      </div>
      <p className={styles.errorMessage}>{error.message}</p>
      {error.page && (
        <span className={styles.errorPage}>{error.page}</span>
      )}
    </div>
  );
}

function PipelineJob({ job }) {
  return (
    <div className={styles.pipelineJob}>
      <span className={`${styles.jobStatus} ${styles[job.status]}`}>
        {job.status}
      </span>
      <span className={styles.jobType}>{job.type}</span>
      {job.car && <span className={styles.jobCar}>{job.car}</span>}
      {job.error && <span className={styles.jobError}>{job.error}</span>}
    </div>
  );
}

export function SystemHealthPanel({ health, loading = false }) {
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>System Health</h3>
        </div>
        <div className={styles.loading}>Checking system health...</div>
      </div>
    );
  }
  
  if (!health) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>System Health</h3>
        </div>
        <div className={styles.emptyState}>No health data available</div>
      </div>
    );
  }
  
  const { errors, pipeline, alerts, health: systemHealth } = health;
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>System Health</h3>
        <div className={styles.statusBadge}>
          <StatusIndicator status={systemHealth?.status || 'healthy'} />
          <span className={styles.statusText}>
            {systemHealth?.status || 'healthy'}
          </span>
        </div>
      </div>
      
      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div className={styles.alertsSection}>
          <h4 className={styles.sectionTitle}>Active Alerts ({alerts.length})</h4>
          <div className={styles.alertsList}>
            {alerts.map((alert, i) => (
              <AlertItem key={i} alert={alert} />
            ))}
          </div>
        </div>
      )}
      
      {/* Error Summary */}
      <div className={styles.errorsSection}>
        <h4 className={styles.sectionTitle}>Errors</h4>
        
        {/* Primary stats row */}
        <div className={styles.errorStats}>
          <div className={styles.errorStat}>
            <span className={styles.statValue}>{errors?.total24h || 0}</span>
            <span className={styles.statLabel}>Last 24h</span>
          </div>
          <div className={styles.errorStat}>
            <span className={styles.statValue}>{errors?.unresolved || 0}</span>
            <span className={styles.statLabel}>Unresolved</span>
          </div>
          <div className={styles.errorStat}>
            <span className={styles.statValue}>{errors?.blocking || 0}</span>
            <span className={styles.statLabel}>Blocking</span>
          </div>
        </div>
        
        {/* Secondary stats - fixed and 7-day view */}
        <div className={styles.errorStatsSecondary}>
          <span className={styles.secondaryStat}>
            <span className={styles.secondaryValue}>{errors?.fixed24h || 0}</span> fixed (24h)
          </span>
          <span className={styles.secondaryDivider}>|</span>
          <span className={styles.secondaryStat}>
            <span className={styles.secondaryValue}>{errors?.total7d || 0}</span> total (7d)
          </span>
          <span className={styles.secondaryDivider}>|</span>
          <span className={styles.secondaryStat}>
            <span className={styles.secondaryValue}>{errors?.fixed7d || 0}</span> fixed (7d)
          </span>
        </div>
        
        {errors?.recent && errors.recent.length > 0 && (
          <div className={styles.recentErrors}>
            <span className={styles.recentLabel}>Recent Unresolved</span>
            {errors.recent.slice(0, 3).map((error, i) => (
              <ErrorRow key={i} error={error} />
            ))}
          </div>
        )}
      </div>
      
      {/* Pipeline Status */}
      <div className={styles.pipelineSection}>
        <h4 className={styles.sectionTitle}>Data Pipeline</h4>
        <div className={styles.pipelineStats}>
          <div className={styles.pipelineStat}>
            <span className={styles.statValue}>
              {pipeline?.scrapeJobs?.byStatus?.completed || 0}
            </span>
            <span className={styles.statLabel}>Completed</span>
          </div>
          <div className={styles.pipelineStat}>
            <span className={styles.statValue}>
              {pipeline?.scrapeJobs?.byStatus?.pending || 0}
            </span>
            <span className={styles.statLabel}>Pending</span>
          </div>
          <div className={styles.pipelineStat}>
            <span className={styles.statValue}>
              {pipeline?.scrapeJobs?.byStatus?.failed || 0}
            </span>
            <span className={styles.statLabel}>Failed</span>
          </div>
        </div>
        
        {/* YouTube Stats */}
        <div className={styles.subStats}>
          <span className={styles.subStatsLabel}>YouTube Pipeline:</span>
          <span>{pipeline?.youtube?.byStatus?.processed || 0} processed</span>
          <span>{pipeline?.youtube?.byStatus?.pending || 0} pending</span>
        </div>
        
        {/* Recent Jobs */}
        {pipeline?.scrapeJobs?.recent && pipeline.scrapeJobs.recent.length > 0 && (
          <div className={styles.recentJobs}>
            <span className={styles.recentLabel}>Recent Jobs</span>
            {pipeline.scrapeJobs.recent.slice(0, 3).map((job, i) => (
              <PipelineJob key={i} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SystemHealthPanel;

