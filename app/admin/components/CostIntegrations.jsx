'use client';

/**
 * Cost Integrations Component
 * 
 * Shows the status of external cost tracking integrations and provides
 * setup instructions for services that need configuration.
 * 
 * Displays:
 * - Connected services with real-time cost data
 * - Setup instructions for unconfigured services
 * - Manual tracking requirements
 * - Cost comparison between internal and external tracking
 */

import { useState, useEffect } from 'react';
import styles from './CostIntegrations.module.css';

// Icons
const CheckCircleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const XCircleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const AlertCircleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const ExternalLinkIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

const LoadingIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.spinning}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const DollarIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const ClipboardIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
);

// Service logos/icons
const ServiceIcon = ({ service }) => {
  const iconStyles = {
    anthropic: { background: '#cc9a6a', color: '#1a1a1a' },
    google: { background: '#4285f4', color: 'white' },
    cursor: { background: '#1a1a1a', color: 'white' },
    vercel: { background: '#000', color: 'white' },
    stripe: { background: '#635bff', color: 'white' },
    supabase: { background: '#3ecf8e', color: 'white' },
  };
  
  const style = iconStyles[service] || iconStyles.anthropic;
  const initial = service.charAt(0).toUpperCase();
  
  return (
    <div className={styles.serviceIcon} style={style}>
      {initial}
    </div>
  );
};

// Format currency
function formatCurrency(cents) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Integration status card
function IntegrationCard({ name, service, status, data, setupUrl, setupSteps, description }) {
  const [expanded, setExpanded] = useState(false);
  
  const isConnected = status === 'connected' || status === 'active';
  const StatusIcon = isConnected ? CheckCircleIcon : status === 'error' ? XCircleIcon : AlertCircleIcon;
  const statusColor = isConnected ? '#22c55e' : status === 'error' ? '#ef4444' : '#f59e0b';
  
  return (
    <div className={`${styles.integrationCard} ${isConnected ? styles.connected : styles.disconnected}`}>
      <div className={styles.integrationHeader}>
        <div className={styles.integrationMain}>
          <ServiceIcon service={service} />
          <div className={styles.integrationInfo}>
            <h4 className={styles.integrationName}>{name}</h4>
            <span className={styles.integrationStatus} style={{ color: statusColor }}>
              <StatusIcon size={14} />
              {isConnected ? 'Connected' : status === 'error' ? 'Error' : 'Not Configured'}
            </span>
          </div>
        </div>
        
        {isConnected && data && (
          <div className={styles.integrationCost}>
            <span className={styles.costValue}>{formatCurrency(data.totalCostCents || 0)}</span>
            <span className={styles.costPeriod}>this period</span>
          </div>
        )}
      </div>
      
      {description && (
        <p className={styles.integrationDesc}>{description}</p>
      )}
      
      {!isConnected && setupSteps && (
        <div className={styles.setupSection}>
          <button 
            className={styles.setupToggle}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Hide setup steps' : 'Show setup steps'}
          </button>
          
          {expanded && (
            <div className={styles.setupContent}>
              <ol className={styles.setupSteps}>
                {setupSteps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              {setupUrl && (
                <a 
                  href={setupUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.setupLink}
                >
                  Open Setup Guide <ExternalLinkIcon size={12} />
                </a>
              )}
            </div>
          )}
        </div>
      )}
      
      {isConnected && data?.breakdown && (
        <div className={styles.breakdown}>
          <div className={styles.breakdownItem}>
            <span className={styles.breakdownLabel}>Input Tokens</span>
            <span className={styles.breakdownValue}>{(data.breakdown.inputTokens || 0).toLocaleString()}</span>
          </div>
          <div className={styles.breakdownItem}>
            <span className={styles.breakdownLabel}>Output Tokens</span>
            <span className={styles.breakdownValue}>{(data.breakdown.outputTokens || 0).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Manual tracking card
function ManualTrackingCard({ service, reason, currentCost, recommendation }) {
  return (
    <div className={styles.manualCard}>
      <div className={styles.manualHeader}>
        <ClipboardIcon size={16} />
        <h5 className={styles.manualName}>{service}</h5>
      </div>
      <div className={styles.manualBody}>
        <p className={styles.manualReason}>{reason}</p>
        <div className={styles.manualCost}>{currentCost}</div>
        <p className={styles.manualTip}>{recommendation}</p>
      </div>
    </div>
  );
}

export function CostIntegrations({ token, range = 'month', loading: externalLoading }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchIntegrations() {
      if (!token) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/admin/external-costs?range=${range}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch cost integrations');
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('[CostIntegrations] Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchIntegrations();
  }, [token, range]);
  
  if (loading || externalLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <DollarIcon size={20} />
          <h3 className={styles.title}>Cost Tracking Integrations</h3>
        </div>
        <div className={styles.loading}>
          <LoadingIcon size={24} />
          <span>Loading integrations...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <DollarIcon size={20} />
          <h3 className={styles.title}>Cost Tracking Integrations</h3>
        </div>
        <div className={styles.error}>
          <XCircleIcon size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }
  
  const { configStatus, automated, internalTracking, manual, summary, manualTrackingRequired } = data || {};
  
  // Count connected integrations
  const connectedCount = Object.values(configStatus || {}).filter(s => s.status === 'connected' || s.status === 'active').length;
  const totalCount = Object.keys(configStatus || {}).length;
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <DollarIcon size={20} />
          <div>
            <h3 className={styles.title}>Cost Tracking Integrations</h3>
            <p className={styles.subtitle}>
              {connectedCount}/{totalCount} integrations active
            </p>
          </div>
        </div>
        {summary && (
          <div className={styles.totalCost}>
            <span className={styles.totalLabel}>Total Tracked</span>
            <span className={styles.totalValue}>{formatCurrency(summary.totalTrackedCents)}</span>
          </div>
        )}
      </div>
      
      {/* Summary comparison */}
      {summary && (
        <div className={styles.summarySection}>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Automated (API)</span>
              <span className={styles.summaryValue}>${summary.automatedCostsUSD}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Internal Tracking</span>
              <span className={styles.summaryValue}>${summary.internalEstimateUSD}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Manual Entries</span>
              <span className={styles.summaryValue}>${summary.manualCostsUSD}</span>
            </div>
          </div>
          {summary.note && (
            <p className={styles.summaryNote}>{summary.note}</p>
          )}
        </div>
      )}
      
      {/* API Integrations */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>API Integrations</h4>
        <div className={styles.integrationGrid}>
          <IntegrationCard
            name="Anthropic Admin API"
            service="anthropic"
            status={configStatus?.anthropicAdminApi?.status}
            data={automated?.anthropic}
            setupUrl={configStatus?.anthropicAdminApi?.setupUrl}
            setupSteps={configStatus?.anthropicAdminApi?.setupSteps}
            description="Real-time usage and cost data from Claude API"
          />
          
          <IntegrationCard
            name="Google Cloud Billing"
            service="google"
            status={configStatus?.googleCloudBilling?.status}
            data={automated?.googleCloud}
            setupUrl={configStatus?.googleCloudBilling?.setupUrl}
            setupSteps={configStatus?.googleCloudBilling?.setupSteps}
            description="Track GCP costs (Vertex AI, Cloud Run, etc.)"
          />
          
          <IntegrationCard
            name="Internal Usage Tracking"
            service="supabase"
            status={configStatus?.internalTracking?.status}
            data={{
              totalCostCents: internalTracking?.total?.costCents || 0,
              breakdown: {
                inputTokens: internalTracking?.total?.inputTokens || 0,
                outputTokens: internalTracking?.total?.outputTokens || 0,
              }
            }}
            description={configStatus?.internalTracking?.description}
          />
        </div>
      </div>
      
      {/* Manual Tracking Required */}
      {manualTrackingRequired?.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>
            <AlertCircleIcon size={16} />
            Manual Tracking Required
          </h4>
          <p className={styles.sectionDesc}>
            These services don't have billing APIs. Add cost entries manually in the Financials tab.
          </p>
          <div className={styles.manualGrid}>
            {manualTrackingRequired.map((item, i) => (
              <ManualTrackingCard key={i} {...item} />
            ))}
          </div>
        </div>
      )}
      
      {/* Recommendations */}
      <div className={styles.recommendations}>
        <h4 className={styles.recommendationsTitle}>Recommendations</h4>
        <ul className={styles.recommendationsList}>
          <li>
            <strong>For accurate Anthropic tracking:</strong> Get an Admin API key from 
            <a href="https://console.anthropic.com/settings/admin-api-keys" target="_blank" rel="noopener noreferrer">
              console.anthropic.com <ExternalLinkIcon size={10} />
            </a>
          </li>
          <li>
            <strong>For Cursor costs:</strong> Set up a recurring cost entry for your subscription ($20-$200/month)
          </li>
          <li>
            <strong>For complete picture:</strong> Check your Stripe dashboard for actual billing history
          </li>
        </ul>
      </div>
    </div>
  );
}

export default CostIntegrations;





