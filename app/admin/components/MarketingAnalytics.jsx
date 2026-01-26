'use client';

/**
 * Marketing Analytics Dashboard Component
 * 
 * Shows funnels, attribution, cohorts, and event analytics.
 * For marketing optimization and user journey understanding.
 */

import { useState } from 'react';

import { useAdminMarketingAnalytics } from '@/hooks/useAdminData';

import styles from './MarketingAnalytics.module.css';

// Funnel visualization component
function FunnelChart({ funnel }) {
  if (!funnel) return null;
  
  const steps = [
    { key: 'visitors', label: 'Visitors', value: funnel.visitors || 0, color: '#3b82f6' },
    { key: 'signupStarted', label: 'Signup Started', value: funnel.signupStarted || 0, color: '#8b5cf6' },
    { key: 'signupCompleted', label: 'Signed Up', value: funnel.signupCompleted || 0, color: '#06b6d4' },
    { key: 'onboardingCompleted', label: 'Onboarded', value: funnel.onboardingCompleted || 0, color: '#10b981' },
    { key: 'activated', label: 'Activated', value: funnel.activated || 0, color: '#f59e0b' },
    { key: 'converted', label: 'Converted', value: funnel.converted || 0, color: '#22c55e' }
  ];
  
  const maxValue = Math.max(...steps.map(s => s.value), 1);
  
  return (
    <div className={styles.funnelChart}>
      {steps.map((step, i) => {
        const widthPercent = (step.value / maxValue) * 100;
        const prevValue = i > 0 ? steps[i - 1].value : step.value;
        const dropoff = prevValue > 0 ? ((prevValue - step.value) / prevValue * 100).toFixed(0) : 0;
        
        return (
          <div key={step.key} className={styles.funnelStep}>
            <div className={styles.funnelStepLabel}>
              <span className={styles.funnelStepName}>{step.label}</span>
              <span className={styles.funnelStepValue}>{step.value.toLocaleString()}</span>
            </div>
            <div className={styles.funnelBarWrapper}>
              <div 
                className={styles.funnelBar}
                style={{ 
                  width: `${widthPercent}%`,
                  backgroundColor: step.color
                }}
              />
            </div>
            {i > 0 && dropoff > 0 && (
              <span className={styles.funnelDropoff}>-{dropoff}%</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Attribution breakdown component
function AttributionBreakdown({ attribution }) {
  const [view, setView] = useState('source');
  
  if (!attribution) return null;
  
  const data = {
    source: attribution.bySource || [],
    medium: attribution.byMedium || [],
    campaign: attribution.byCampaign || [],
    landing: attribution.byLandingPage || []
  };
  
  const currentData = data[view] || [];
  const total = currentData.reduce((sum, item) => sum + (item.users || 0), 0);
  
  return (
    <div className={styles.attributionSection}>
      <div className={styles.attributionTabs}>
        <button 
          className={`${styles.attrTab} ${view === 'source' ? styles.attrTabActive : ''}`}
          onClick={() => setView('source')}
        >
          Source
        </button>
        <button 
          className={`${styles.attrTab} ${view === 'medium' ? styles.attrTabActive : ''}`}
          onClick={() => setView('medium')}
        >
          Medium
        </button>
        <button 
          className={`${styles.attrTab} ${view === 'campaign' ? styles.attrTabActive : ''}`}
          onClick={() => setView('campaign')}
        >
          Campaign
        </button>
        <button 
          className={`${styles.attrTab} ${view === 'landing' ? styles.attrTabActive : ''}`}
          onClick={() => setView('landing')}
        >
          Landing Page
        </button>
      </div>
      
      <div className={styles.attributionList}>
        {currentData.length > 0 ? (
          currentData.map((item, i) => {
            const label = item.source || item.medium || item.campaign || item.landing_page || 'Unknown';
            const percent = total > 0 ? ((item.users / total) * 100).toFixed(0) : 0;
            
            return (
              <div key={i} className={styles.attributionRow}>
                <span className={styles.attrLabel}>{label}</span>
                <div className={styles.attrBar}>
                  <div 
                    className={styles.attrBarFill}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className={styles.attrValue}>{item.users}</span>
                <span className={styles.attrPercent}>{percent}%</span>
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState}>No attribution data yet</div>
        )}
      </div>
    </div>
  );
}

// Cohort retention table
function CohortTable({ cohorts }) {
  if (!cohorts || cohorts.length === 0) {
    return <div className={styles.emptyState}>No cohort data yet</div>;
  }
  
  return (
    <div className={styles.cohortTableWrapper}>
      <table className={styles.cohortTable}>
        <thead>
          <tr>
            <th>Cohort</th>
            <th>Size</th>
            <th>Week 1</th>
            <th>Week 2</th>
            <th>Week 4</th>
          </tr>
        </thead>
        <tbody>
          {cohorts.map((cohort, i) => {
            const week1Pct = cohort.cohort_size > 0 
              ? ((cohort.week_1_retained / cohort.cohort_size) * 100).toFixed(0) 
              : 0;
            const week2Pct = cohort.cohort_size > 0 
              ? ((cohort.week_2_retained / cohort.cohort_size) * 100).toFixed(0) 
              : 0;
            const week4Pct = cohort.cohort_size > 0 
              ? ((cohort.week_4_retained / cohort.cohort_size) * 100).toFixed(0) 
              : 0;
            
            return (
              <tr key={i}>
                <td>{new Date(cohort.cohort_week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                <td>{cohort.cohort_size}</td>
                <td className={getRetentionClass(week1Pct)}>{week1Pct}%</td>
                <td className={getRetentionClass(week2Pct)}>{week2Pct}%</td>
                <td className={getRetentionClass(week4Pct)}>{week4Pct}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function getRetentionClass(pct) {
  if (pct >= 50) return styles.retentionGood;
  if (pct >= 25) return styles.retentionMedium;
  return styles.retentionLow;
}

// Event counts table
function EventsTable({ events }) {
  if (!events || events.length === 0) {
    return <div className={styles.emptyState}>No events tracked yet</div>;
  }
  
  const categoryColors = {
    onboarding: '#8b5cf6',
    conversion: '#22c55e',
    feature: '#3b82f6',
    navigation: '#06b6d4',
    engagement: '#f59e0b'
  };
  
  return (
    <div className={styles.eventsTableWrapper}>
      <table className={styles.eventsTable}>
        <thead>
          <tr>
            <th>Event</th>
            <th>Category</th>
            <th>Total</th>
            <th>Unique Users</th>
          </tr>
        </thead>
        <tbody>
          {events.slice(0, 15).map((event, i) => (
            <tr key={i}>
              <td className={styles.eventName}>{event.event_name}</td>
              <td>
                <span 
                  className={styles.eventCategory}
                  style={{ backgroundColor: categoryColors[event.event_category] || '#666' }}
                >
                  {event.event_category || 'other'}
                </span>
              </td>
              <td>{event.total_events?.toLocaleString()}</td>
              <td>{event.unique_users?.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Main component
export function MarketingAnalytics({ token, range = '30d', loading: externalLoading }) {
  const [activeSection, setActiveSection] = useState('funnel');
  
  // Use React Query hook for marketing analytics
  const { 
    data, 
    isLoading: loading, 
    error: queryError,
  } = useAdminMarketingAnalytics(range);
  
  const error = queryError?.message || null;
  
  if (loading || externalLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <p>Loading marketing analytics...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>Error: {error}</p>
          <button onClick={fetchData} className={styles.retryButton}>Retry</button>
        </div>
      </div>
    );
  }
  
  const { funnel, attribution, cohorts, events } = data || {};
  
  return (
    <div className={styles.container}>
      {/* Summary Stats */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Visitors → Signup</span>
          <span className={styles.summaryValue}>{funnel?.conversionRates?.visitorToSignup || 0}%</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Signup → Onboarded</span>
          <span className={styles.summaryValue}>{funnel?.conversionRates?.signupToOnboarding || 0}%</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Onboarded → Activated</span>
          <span className={styles.summaryValue}>{funnel?.conversionRates?.onboardingToActivation || 0}%</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Activated → Converted</span>
          <span className={styles.summaryValue}>{funnel?.conversionRates?.activationToConversion || 0}%</span>
        </div>
      </div>
      
      {/* Section Navigation */}
      <div className={styles.sectionNav}>
        <button 
          className={`${styles.sectionTab} ${activeSection === 'funnel' ? styles.sectionTabActive : ''}`}
          onClick={() => setActiveSection('funnel')}
        >
          📊 Funnel
        </button>
        <button 
          className={`${styles.sectionTab} ${activeSection === 'attribution' ? styles.sectionTabActive : ''}`}
          onClick={() => setActiveSection('attribution')}
        >
          🎯 Attribution
        </button>
        <button 
          className={`${styles.sectionTab} ${activeSection === 'cohorts' ? styles.sectionTabActive : ''}`}
          onClick={() => setActiveSection('cohorts')}
        >
          👥 Cohorts
        </button>
        <button 
          className={`${styles.sectionTab} ${activeSection === 'events' ? styles.sectionTabActive : ''}`}
          onClick={() => setActiveSection('events')}
        >
          ⚡ Events
        </button>
      </div>
      
      {/* Section Content */}
      <div className={styles.sectionContent}>
        {activeSection === 'funnel' && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Conversion Funnel</h3>
            <p className={styles.sectionDesc}>
              Track users from first visit through to conversion. Identify drop-off points.
            </p>
            <FunnelChart funnel={funnel} />
          </div>
        )}
        
        {activeSection === 'attribution' && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Traffic Attribution</h3>
            <p className={styles.sectionDesc}>
              Understand where your users come from. First-touch attribution.
            </p>
            <AttributionBreakdown attribution={attribution} />
          </div>
        )}
        
        {activeSection === 'cohorts' && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Cohort Retention</h3>
            <p className={styles.sectionDesc}>
              Track how well you retain users over time by signup week.
            </p>
            <CohortTable cohorts={cohorts} />
          </div>
        )}
        
        {activeSection === 'events' && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Event Analytics</h3>
            <p className={styles.sectionDesc}>
              See which features users engage with and key actions taken.
            </p>
            <EventsTable events={events} />
          </div>
        )}
      </div>
    </div>
  );
}

export default MarketingAnalytics;

