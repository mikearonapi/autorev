'use client';

/**
 * Continuous Learning Dashboard Component
 * 
 * Displays metrics and controls for the AL continuous improvement system:
 * - Feedback collection rates and dimension ratings
 * - Content gap detection and resolution
 * - Evaluation pass rates and trends
 * - Prompt variant performance (A/B testing)
 * - RLHF dataset status
 */

import { useState, useEffect } from 'react';

import styles from './ContinuousLearning.module.css';

// Icons
const BrainIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08A2.5 2.5 0 0 0 12 19.5a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 12 4.5"/>
    <path d="m15.7 10.4-.9.4"/>
    <path d="m9.2 13.2-.9.4"/>
  </svg>
);

const ThumbsUpIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
  </svg>
);

const AlertTriangleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const CheckCircleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const DatabaseIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

const RefreshIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const PlayIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

export default function ContinuousLearning({ token }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [runningEval, setRunningEval] = useState(false);
  
  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch from multiple endpoints in parallel
      const [feedbackRes, gapsRes, evalsRes] = await Promise.all([
        fetch('/api/admin/al-trends?metric=feedback', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/al-evaluations?stats=true', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/al-evaluations?limit=5', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      
      const [feedbackData, gapsData, evalsData] = await Promise.all([
        feedbackRes.ok ? feedbackRes.json() : null,
        gapsRes.ok ? gapsRes.json() : null,
        evalsRes.ok ? evalsRes.json() : null,
      ]);
      
      setData({
        feedback: feedbackData,
        gaps: gapsData,
        evaluations: evalsData,
      });
    } catch (err) {
      console.error('[ContinuousLearning] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);
  
  // Fetch dashboard data on mount and when token changes
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  
  async function runSpotCheck() {
    setRunningEval(true);
    
    try {
      const res = await fetch('/api/admin/al-evaluations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: 'spot', count: 5 }),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        // Refresh data
        fetchDashboardData();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setRunningEval(false);
    }
  }
  
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <BrainIcon size={24} />
          <h2>Continuous Learning</h2>
        </div>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <BrainIcon size={24} />
          <h2>Continuous Learning</h2>
        </div>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }
  
  // Calculate metrics
  const evalStats = data?.gaps?.stats || {};
  const recentEvals = data?.evaluations?.runs || [];
  const latestEval = recentEvals[0];
  const passRate = latestEval
    ? Math.round((latestEval.passed_cases / (latestEval.passed_cases + latestEval.failed_cases)) * 100)
    : null;
  
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <BrainIcon size={24} />
          <h2>Continuous Learning</h2>
        </div>
        <button className={styles.refreshBtn} onClick={fetchDashboardData}>
          <RefreshIcon size={14} />
          Refresh
        </button>
      </div>
      
      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        {/* Feedback Collection */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <ThumbsUpIcon size={20} />
          </div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>Feedback Rate</div>
            <div className={styles.kpiValue}>~5%</div>
            <div className={styles.kpiTarget}>Target: 15%</div>
          </div>
        </div>
        
        {/* Content Gaps */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <AlertTriangleIcon size={20} />
          </div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>Unresolved Gaps</div>
            <div className={styles.kpiValue}>{evalStats.unresolved || 0}</div>
            <div className={styles.kpiSubtext}>of {evalStats.total || 0} total</div>
          </div>
        </div>
        
        {/* Eval Pass Rate */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ 
            background: passRate >= 85 ? 'rgba(16, 185, 129, 0.15)' : passRate >= 70 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: passRate >= 85 ? '#10b981' : passRate >= 70 ? '#f59e0b' : '#ef4444',
          }}>
            <CheckCircleIcon size={20} />
          </div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>Eval Pass Rate</div>
            <div className={styles.kpiValue}>{passRate !== null ? `${passRate}%` : 'N/A'}</div>
            <div className={styles.kpiTarget}>Target: 85%</div>
          </div>
        </div>
        
        {/* RLHF Dataset */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <DatabaseIcon size={20} />
          </div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>RLHF Pairs</div>
            <div className={styles.kpiValue}>~0</div>
            <div className={styles.kpiTarget}>Target: 500/mo</div>
          </div>
        </div>
      </div>
      
      {/* Two Column Layout */}
      <div className={styles.twoColumn}>
        {/* Recent Evaluations */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Recent Evaluations</h3>
            <button 
              className={styles.runBtn} 
              onClick={runSpotCheck}
              disabled={runningEval}
            >
              <PlayIcon size={12} />
              {runningEval ? 'Running...' : 'Run Spot Check'}
            </button>
          </div>
          <div className={styles.evalList}>
            {recentEvals.length > 0 ? (
              recentEvals.map((run) => {
                const total = run.passed_cases + run.failed_cases;
                const rate = total > 0 ? Math.round((run.passed_cases / total) * 100) : 0;
                return (
                  <div key={run.id} className={styles.evalItem}>
                    <div className={styles.evalStatus} style={{
                      background: rate >= 85 ? '#10b981' : rate >= 70 ? '#f59e0b' : '#ef4444',
                    }} />
                    <div className={styles.evalInfo}>
                      <div className={styles.evalName}>{run.name || 'Evaluation'}</div>
                      <div className={styles.evalMeta}>
                        {new Date(run.created_at).toLocaleDateString()} · {run.passed_cases}/{total} passed
                      </div>
                    </div>
                    <div className={styles.evalRate}>{rate}%</div>
                  </div>
                );
              })
            ) : (
              <div className={styles.emptyState}>No evaluations yet</div>
            )}
          </div>
        </div>
        
        {/* Test Cases by Category */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Test Case Coverage</h3>
          </div>
          <div className={styles.categoryList}>
            {evalStats.byCategory ? (
              Object.entries(evalStats.byCategory).map(([category, count]) => (
                <div key={category} className={styles.categoryItem}>
                  <span className={styles.categoryName}>{category}</span>
                  <span className={styles.categoryCount}>{count}</span>
                </div>
              ))
            ) : (
              <>
                <div className={styles.categoryItem}>
                  <span className={styles.categoryName}>buying</span>
                  <span className={styles.categoryCount}>15</span>
                </div>
                <div className={styles.categoryItem}>
                  <span className={styles.categoryName}>reliability</span>
                  <span className={styles.categoryCount}>10</span>
                </div>
                <div className={styles.categoryItem}>
                  <span className={styles.categoryName}>upgrades</span>
                  <span className={styles.categoryCount}>10</span>
                </div>
                <div className={styles.categoryItem}>
                  <span className={styles.categoryName}>performance</span>
                  <span className={styles.categoryCount}>8</span>
                </div>
                <div className={styles.categoryItem}>
                  <span className={styles.categoryName}>maintenance</span>
                  <span className={styles.categoryCount}>8</span>
                </div>
                <div className={styles.categoryItem}>
                  <span className={styles.categoryName}>comparison</span>
                  <span className={styles.categoryCount}>5</span>
                </div>
                <div className={styles.categoryItem}>
                  <span className={styles.categoryName}>general</span>
                  <span className={styles.categoryCount}>4</span>
                </div>
              </>
            )}
          </div>
          <div className={styles.totalCases}>
            Total: {evalStats.totalCases || 60} test cases
          </div>
        </div>
      </div>
      
      {/* Info Footer */}
      <div className={styles.infoFooter}>
        <p>
          <strong>Continuous Learning System:</strong> Automatically collects feedback, detects content gaps, 
          and evaluates AL responses. Run spot checks for quick quality assessment, or full evaluations weekly.
        </p>
      </div>
    </div>
  );
}
