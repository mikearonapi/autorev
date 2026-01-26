'use client';

/**
 * Vercel Status Component
 * 
 * Displays deployment status, build info, domains, checks, and project health.
 * Shows setup instructions if not configured.
 * 
 * Enhanced data includes:
 * - Build time metrics (average, fastest, slowest)
 * - Domain health status
 * - Deployment frequency
 * - Success rate percentage
 * - Deployment checks status
 * 
 * Per data visualization rules:
 * - Interpretive title (Rule 4.1)
 * - Semantic status colors (Rule 3.1)
 */

import { useState, useEffect, useMemo } from 'react';

import styles from './VercelStatus.module.css';

// Icons
const VercelIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 22.525H0l12-21.05 12 21.05z"/>
  </svg>
);

const CheckCircleIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const XCircleIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const LoaderIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.spinning}>
    <line x1="12" y1="2" x2="12" y2="6"/>
    <line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
    <line x1="2" y1="12" x2="6" y2="12"/>
    <line x1="18" y1="12" x2="22" y2="12"/>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
  </svg>
);

const GitBranchIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="3" x2="6" y2="15"/>
    <circle cx="18" cy="6" r="3"/>
    <circle cx="6" cy="18" r="3"/>
    <path d="M18 9a9 9 0 0 1-9 9"/>
  </svg>
);

const ExternalLinkIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

const GlobeIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const ClockIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const ZapIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const TrendingUpIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const KeyIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);

// Status badge colors
const STATUS_COLORS = {
  healthy: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' },
  building: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
  warning: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
  error: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
};

// Deployment state to display
const STATE_DISPLAY = {
  READY: { label: 'Ready', color: '#22c55e', icon: CheckCircleIcon },
  ERROR: { label: 'Error', color: '#ef4444', icon: XCircleIcon },
  BUILDING: { label: 'Building', color: '#3b82f6', icon: LoaderIcon },
  QUEUED: { label: 'Queued', color: '#f59e0b', icon: LoaderIcon },
  CANCELED: { label: 'Canceled', color: '#64748b', icon: XCircleIcon },
  INITIALIZING: { label: 'Starting', color: '#8b5cf6', icon: LoaderIcon },
};

function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function truncateCommit(message, maxLength = 50) {
  if (!message) return 'No commit message';
  if (message.length <= maxLength) return message;
  return message.slice(0, maxLength - 3) + '...';
}

// Format duration in seconds to readable format
function formatDuration(seconds) {
  if (!seconds) return '--';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

// Generate interpretive title
function generateInterpretiveTitle(data) {
  if (!data?.configured) return 'Vercel integration not configured';
  if (data.error) return 'Unable to connect to Vercel';
  
  const { status, latestDeployment, stats, buildMetrics, deploymentFrequency } = data;
  
  if (status === 'building') {
    return `Deployment in progress — ${latestDeployment?.branch || 'main'} branch`;
  }
  if (status === 'error') {
    return `Latest deployment failed — ${stats?.failed || 0} errors in recent builds`;
  }
  if (status === 'healthy') {
    const avgBuild = buildMetrics?.averageBuildTime 
      ? `, ~${formatDuration(buildMetrics.averageBuildTime)} avg build` 
      : '';
    const frequency = deploymentFrequency?.perDay 
      ? ` • ${deploymentFrequency.perDay}/day` 
      : '';
    return `Production healthy — ${stats?.successRate || 100}% success rate${avgBuild}${frequency}`;
  }
  return `${stats?.total || 0} deployments tracked`;
}

// Deployment row component
function DeploymentRow({ deployment }) {
  const stateInfo = STATE_DISPLAY[deployment.state] || STATE_DISPLAY.READY;
  const StateIcon = stateInfo.icon;
  
  return (
    <div className={styles.deploymentRow}>
      <div className={styles.deploymentMain}>
        <div className={styles.deploymentStatus}>
          <StateIcon size={14} />
          <span style={{ color: stateInfo.color }}>{stateInfo.label}</span>
        </div>
        <span className={styles.deploymentCommit}>
          {truncateCommit(deployment.commit)}
        </span>
      </div>
      <div className={styles.deploymentMeta}>
        <span className={styles.deploymentTarget}>
          {deployment.target === 'production' ? '🚀 Prod' : '👁 Preview'}
        </span>
        <span className={styles.deploymentTime}>
          {formatTimeAgo(deployment.createdAt)}
        </span>
        {deployment.url && (
          <a 
            href={`https://${deployment.url}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.deploymentLink}
          >
            <ExternalLinkIcon size={12} />
          </a>
        )}
      </div>
    </div>
  );
}

// Setup instructions component
function SetupInstructions({ setupInfo }) {
  return (
    <div className={styles.setupContainer}>
      <div className={styles.setupHeader}>
        <VercelIcon size={24} />
        <h4>Connect to Vercel</h4>
      </div>
      <p className={styles.setupDesc}>
        Add these environment variables to enable Vercel integration:
      </p>
      <div className={styles.setupVars}>
        {setupInfo?.required?.map(varName => (
          <code key={varName} className={styles.setupVar}>
            {varName}
          </code>
        ))}
      </div>
      <a 
        href={setupInfo?.docs || 'https://vercel.com/docs/rest-api#creating-an-access-token'} 
        target="_blank" 
        rel="noopener noreferrer"
        className={styles.setupLink}
      >
        View setup guide <ExternalLinkIcon size={12} />
      </a>
    </div>
  );
}

export function VercelStatus({ token, loading: externalLoading }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchStatus() {
      if (!token) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/admin/vercel-status', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const result = await response.json();
        setData(result);
        
        if (result.error && result.configured) {
          setError(result.error);
        }
      } catch (err) {
        console.error('[VercelStatus] Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [token]);
  
  // Generate interpretive title
  const interpretiveTitle = useMemo(() => {
    return generateInterpretiveTitle(data);
  }, [data]);
  
  if (loading || externalLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <VercelIcon size={18} />
          <h3 className={styles.title}>Connecting to Vercel...</h3>
        </div>
        <div className={styles.loading}>
          <LoaderIcon size={20} />
        </div>
      </div>
    );
  }
  
  // Not configured - show setup instructions
  if (!data?.configured) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <VercelIcon size={18} />
          <h3 className={styles.title}>Vercel Integration</h3>
        </div>
        <SetupInstructions setupInfo={data?.setup} />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <VercelIcon size={18} />
          <h3 className={styles.title}>Vercel Connection Error</h3>
        </div>
        <div className={styles.error}>
          <XCircleIcon size={16} />
          <span>{error}</span>
        </div>
      </div>
    );
  }
  
  const statusColors = STATUS_COLORS[data.status] || STATUS_COLORS.healthy;
  
  return (
    <div className={styles.container}>
      {/* Header with interpretive title */}
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <VercelIcon size={18} />
          <div className={styles.headerText}>
            <h3 className={styles.title}>{interpretiveTitle}</h3>
            <span className={styles.subtitle}>Vercel Deployment Status</span>
          </div>
        </div>
        <span 
          className={styles.statusBadge}
          style={{ 
            backgroundColor: statusColors.bg,
            color: statusColors.text,
            borderColor: statusColors.border,
          }}
        >
          {data.status === 'building' && <LoaderIcon size={12} />}
          {data.statusMessage}
        </span>
      </div>
      
      {/* Current Production */}
      {data.currentDeployment && (
        <div className={styles.currentDeployment}>
          <div className={styles.currentHeader}>
            <CheckCircleIcon size={14} />
            <span>Production</span>
          </div>
          <div className={styles.currentInfo}>
            <a 
              href={`https://${data.currentDeployment.url}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.currentUrl}
            >
              {data.currentDeployment.url}
              <ExternalLinkIcon size={12} />
            </a>
            <div className={styles.currentMeta}>
              {data.currentDeployment.branch && (
                <span className={styles.branch}>
                  <GitBranchIcon size={12} />
                  {data.currentDeployment.branch}
                </span>
              )}
              <span className={styles.deployTime}>
                Deployed {formatTimeAgo(data.currentDeployment.createdAt)}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats row */}
      {data.stats && (
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statValue} style={{ color: '#22c55e' }}>
              {data.stats.successRate}%
            </span>
            <span className={styles.statLabel}>Success Rate</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{data.stats.successful}</span>
            <span className={styles.statLabel}>Successful</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue} style={{ color: data.stats.failed > 0 ? '#ef4444' : undefined }}>
              {data.stats.failed}
            </span>
            <span className={styles.statLabel}>Failed</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{data.stats.production}</span>
            <span className={styles.statLabel}>Production</span>
          </div>
        </div>
      )}
      
      {/* Build Metrics */}
      {data.buildMetrics && (
        <div className={styles.metricsSection}>
          <h4 className={styles.metricsSectionTitle}>
            <ClockIcon size={14} />
            Build Performance
          </h4>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricValue}>{formatDuration(data.buildMetrics.averageBuildTime)}</span>
              <span className={styles.metricLabel}>Avg Build</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricValue} style={{ color: '#22c55e' }}>
                {formatDuration(data.buildMetrics.fastestBuild)}
              </span>
              <span className={styles.metricLabel}>Fastest</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricValue} style={{ color: '#f59e0b' }}>
                {formatDuration(data.buildMetrics.slowestBuild)}
              </span>
              <span className={styles.metricLabel}>Slowest</span>
            </div>
            {data.deploymentFrequency && (
              <div className={styles.metricCard}>
                <span className={styles.metricValue}>
                  {data.deploymentFrequency.perDay}
                </span>
                <span className={styles.metricLabel}>Deploys/Day</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Domains */}
      {data.domains?.list?.length > 0 && (
        <div className={styles.domainsSection}>
          <h4 className={styles.domainsSectionTitle}>
            <GlobeIcon size={14} />
            Domains ({data.domains.health.total})
          </h4>
          <div className={styles.domainsList}>
            {data.domains.list.slice(0, 3).map((domain, i) => (
              <div key={i} className={styles.domainItem}>
                <span className={styles.domainName}>{domain.name}</span>
                {domain.verified ? (
                  <span className={styles.domainVerified}>
                    <CheckCircleIcon size={12} />
                    Verified
                  </span>
                ) : (
                  <span className={styles.domainUnverified}>
                    <XCircleIcon size={12} />
                    Unverified
                  </span>
                )}
              </div>
            ))}
            {data.domains.list.length > 3 && (
              <span className={styles.domainsMore}>
                +{data.domains.list.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Latest Deployment Checks */}
      {data.latestDeployment?.checks?.length > 0 && (
        <div className={styles.checksSection}>
          <h4 className={styles.checksSectionTitle}>
            <ZapIcon size={14} />
            Deployment Checks
          </h4>
          <div className={styles.checksList}>
            {data.latestDeployment.checks.map((check, i) => (
              <div key={i} className={styles.checkItem}>
                <span className={styles.checkName}>{check.name}</span>
                <span 
                  className={styles.checkStatus}
                  style={{ 
                    color: check.conclusion === 'succeeded' ? '#22c55e' 
                      : check.conclusion === 'failed' ? '#ef4444' 
                      : '#64748b' 
                  }}
                >
                  {check.conclusion === 'succeeded' && <CheckCircleIcon size={12} />}
                  {check.conclusion === 'failed' && <XCircleIcon size={12} />}
                  {check.status === 'running' && <LoaderIcon size={12} />}
                  {check.conclusion || check.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Cron Jobs */}
      {data.cronJobs?.enabled && data.cronJobs.jobs?.length > 0 && (
        <div className={styles.cronsSection}>
          <h4 className={styles.cronsSectionTitle}>
            <ClockIcon size={14} />
            Scheduled Jobs ({data.cronJobs.totalJobs})
          </h4>
          <div className={styles.cronsList}>
            {data.cronJobs.jobs.slice(0, 5).map((cron, i) => (
              <div key={i} className={styles.cronItem}>
                <span className={styles.cronPath}>{cron.path.split('?')[0]}</span>
                <span className={styles.cronSchedule}>{cron.scheduleDescription}</span>
              </div>
            ))}
            {data.cronJobs.jobs.length > 5 && (
              <span className={styles.cronsMore}>
                +{data.cronJobs.jobs.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Environment Variables Audit */}
      {data.envVars?.total > 0 && (
        <div className={styles.envVarsSection}>
          <h4 className={styles.envVarsSectionTitle}>
            <KeyIcon size={14} />
            Environment ({data.envVars.total} vars)
          </h4>
          <div className={styles.envVarsGrid}>
            <div className={styles.envVarStat}>
              <span className={styles.envVarValue}>{data.envVars.byType.secret}</span>
              <span className={styles.envVarLabel}>Secrets</span>
            </div>
            <div className={styles.envVarStat}>
              <span className={styles.envVarValue}>{data.envVars.byType.plain}</span>
              <span className={styles.envVarLabel}>Plain</span>
            </div>
            <div className={styles.envVarStat}>
              <span className={styles.envVarValue}>{data.envVars.byTarget.production}</span>
              <span className={styles.envVarLabel}>Prod</span>
            </div>
            <div className={styles.envVarStat}>
              <span className={styles.envVarValue}>{data.envVars.byTarget.preview}</span>
              <span className={styles.envVarLabel}>Preview</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Recent Deployments */}
      {data.recentDeployments && data.recentDeployments.length > 0 && (
        <div className={styles.recentSection}>
          <h4 className={styles.recentTitle}>Recent Deployments</h4>
          <div className={styles.deploymentsList}>
            {data.recentDeployments.map(deployment => (
              <DeploymentRow key={deployment.id} deployment={deployment} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default VercelStatus;

