'use client';

/**
 * PartsQualityDashboard Component
 *
 * Admin dashboard widget showing parts data quality metrics,
 * issues requiring attention, and overall health score.
 */

import { useState, useEffect } from 'react';

import { WrenchIcon, AlertIcon, CheckIcon, XIcon } from './Icons';
import styles from './PartsQualityDashboard.module.css';

// Health score color coding
function getHealthColor(score) {
  if (score >= 80) return 'var(--color-accent-teal)';
  if (score >= 60) return 'var(--color-warning)';
  return 'var(--color-error)';
}

// Health score label
function getHealthLabel(score) {
  if (score >= 80) return 'Healthy';
  if (score >= 60) return 'Needs Attention';
  return 'Critical';
}

export function PartsQualityDashboard({ initialData }) {
  const [data, setData] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!initialData) {
      fetchQualityData();
    }
  }, [initialData]);

  async function fetchQualityData() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/parts-quality');
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Parts Data Quality</h3>
        </div>
        <div className={styles.loading}>Loading quality metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Parts Data Quality</h3>
        </div>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Parts Data Quality</h3>
        </div>
        <div className={styles.emptyState}>No quality data available</div>
      </div>
    );
  }

  const { totalParts, totalFitments, averageFitmentsPerPart, issues, healthScore } = data;
  const healthColor = getHealthColor(healthScore);
  const healthLabel = getHealthLabel(healthScore);

  // Issue items config
  const issueItems = [
    {
      key: 'lowConfidenceFitments',
      label: 'Low Confidence Fitments',
      count: issues?.lowConfidenceFitments || 0,
      threshold: 50,
      description: 'Fitments with confidence < 60%',
    },
    {
      key: 'partsMissingData',
      label: 'Parts Missing Data',
      count: issues?.partsMissingData || 0,
      threshold: 25,
      description: 'Missing category or description',
    },
    {
      key: 'partsWithoutFitments',
      label: 'Parts Without Fitments',
      count: issues?.partsWithoutFitments || 0,
      threshold: 100,
      description: 'Parts with no vehicle fitments',
    },
    {
      key: 'pendingReview',
      label: 'Pending Review',
      count: issues?.pendingReview || 0,
      threshold: 10,
      description: 'Flagged for manual review',
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <WrenchIcon size={20} className={styles.icon} />
          <h3 className={styles.title}>Parts Data Quality</h3>
        </div>
        <button onClick={fetchQualityData} className={styles.refreshBtn}>
          Refresh
        </button>
      </div>

      {/* Health Score */}
      <div className={styles.healthSection}>
        <div className={styles.healthScore} style={{ borderColor: healthColor }}>
          <span className={styles.healthValue} style={{ color: healthColor }}>
            {healthScore}
          </span>
          <span className={styles.healthLabel}>{healthLabel}</span>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{totalParts?.toLocaleString() || 0}</span>
            <span className={styles.statLabel}>Total Parts</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{totalFitments?.toLocaleString() || 0}</span>
            <span className={styles.statLabel}>Total Fitments</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{averageFitmentsPerPart || '0.00'}</span>
            <span className={styles.statLabel}>Avg Fitments/Part</span>
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className={styles.issuesSection}>
        <h4 className={styles.sectionTitle}>Issues Requiring Attention</h4>

        <div className={styles.issuesList}>
          {issueItems.map((item) => {
            const isOk = item.count <= item.threshold;
            return (
              <div
                key={item.key}
                className={`${styles.issueItem} ${isOk ? styles.ok : styles.warning}`}
              >
                <div className={styles.issueIcon}>
                  {isOk ? (
                    <CheckIcon size={16} />
                  ) : (
                    <AlertIcon size={16} />
                  )}
                </div>
                <div className={styles.issueContent}>
                  <div className={styles.issueHeader}>
                    <span className={styles.issueLabel}>{item.label}</span>
                    <span className={styles.issueCount}>{item.count}</span>
                  </div>
                  <span className={styles.issueDescription}>{item.description}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coverage Progress */}
      <div className={styles.coverageSection}>
        <h4 className={styles.sectionTitle}>Coverage Goals</h4>

        <div className={styles.coverageItem}>
          <div className={styles.coverageHeader}>
            <span>Fitment Coverage</span>
            <span>{Math.min(100, Math.round((totalFitments / 15500) * 100))}%</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${Math.min(100, (totalFitments / 15500) * 100)}%`,
                background: 'var(--color-accent-teal)',
              }}
            />
          </div>
          <span className={styles.coverageTarget}>
            {totalFitments?.toLocaleString()} / 15,500 target fitments
          </span>
        </div>

        <div className={styles.coverageItem}>
          <div className={styles.coverageHeader}>
            <span>Parts Catalog</span>
            <span>{Math.min(100, Math.round((totalParts / 6000) * 100))}%</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${Math.min(100, (totalParts / 6000) * 100)}%`,
                background: 'var(--color-accent-blue)',
              }}
            />
          </div>
          <span className={styles.coverageTarget}>
            {totalParts?.toLocaleString()} / 6,000 target parts
          </span>
        </div>
      </div>
    </div>
  );
}

export default PartsQualityDashboard;
