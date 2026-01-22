'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

/**
 * Data Quality Dashboard
 * 
 * Real-time monitoring of data linkage health across all tables.
 * Shows car_id coverage, orphaned records, and data quality metrics.
 */

export default function DataQualityDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/internal/data-quality');
      if (!res.ok) throw new Error('Failed to fetch metrics');
      const data = await res.json();
      setMetrics(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (percentage) => {
    if (percentage >= 95) return 'var(--color-accent-teal)';
    if (percentage >= 80) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Data Quality Dashboard</h1>
          <p>Real-time monitoring of data linkage health across all tables</p>
        </div>
        <div className={styles.headerActions}>
          <button 
            onClick={fetchMetrics} 
            className={styles.refreshBtn}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          {lastRefresh && (
            <span className={styles.lastRefresh}>
              Last: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>
      </header>

      {error && (
        <div className={styles.errorBanner}>
          Error loading metrics: {error}
        </div>
      )}

      {metrics && (
        <>
          {/* Summary Cards */}
          <section className={styles.summarySection}>
            <h2>Overall Health</h2>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Total Cars</span>
                <span className={styles.summaryValue}>{formatNumber(metrics.summary?.totalCars || 0)}</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Cars with Parts</span>
                <span className={styles.summaryValue}>
                  {formatNumber(metrics.summary?.carsWithParts || 0)}
                  <span className={styles.summaryPercent} style={{ color: getHealthColor(metrics.summary?.carsWithPartsPercent || 0) }}>
                    ({metrics.summary?.carsWithPartsPercent || 0}%)
                  </span>
                </span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Lap Times</span>
                <span className={styles.summaryValue}>{formatNumber(metrics.summary?.totalLapTimes || 0)}</span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Community Insights</span>
                <span className={styles.summaryValue}>{formatNumber(metrics.summary?.totalInsights || 0)}</span>
              </div>
            </div>
          </section>

          {/* Table Health Grid */}
          <section className={styles.tableSection}>
            <h2>Table Linkage Health</h2>
            <div className={styles.tableGrid}>
              {metrics.tables?.map((table) => (
                <div key={table.name} className={styles.tableCard}>
                  <div className={styles.tableHeader}>
                    <span className={styles.tableName}>{table.name}</span>
                    <span 
                      className={styles.healthBadge}
                      style={{ backgroundColor: getHealthColor(table.linkedPercent) }}
                    >
                      {table.linkedPercent}%
                    </span>
                  </div>
                  <div className={styles.tableStats}>
                    <div className={styles.statRow}>
                      <span>Total Rows</span>
                      <span>{formatNumber(table.total)}</span>
                    </div>
                    <div className={styles.statRow}>
                      <span>With car_id</span>
                      <span className={styles.linked}>{formatNumber(table.linked)}</span>
                    </div>
                    {table.orphaned > 0 && (
                      <div className={styles.statRow}>
                        <span>Missing car_id</span>
                        <span className={styles.orphaned}>{formatNumber(table.orphaned)}</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ 
                        width: `${table.linkedPercent}%`,
                        backgroundColor: getHealthColor(table.linkedPercent)
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Parts Coverage */}
          <section className={styles.coverageSection}>
            <h2>Parts Category Distribution</h2>
            <div className={styles.categoryGrid}>
              {metrics.partCategories?.map((cat) => (
                <div key={cat.category} className={styles.categoryCard}>
                  <span className={styles.categoryName}>{cat.category}</span>
                  <span className={styles.categoryCount}>{formatNumber(cat.count)}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Data Quality Issues */}
          {metrics.issues?.length > 0 && (
            <section className={styles.issuesSection}>
              <h2>Active Data Quality Issues</h2>
              <div className={styles.issuesList}>
                {metrics.issues.map((issue, i) => (
                  <div key={i} className={styles.issueCard}>
                    <span className={`${styles.issueSeverity} ${styles[issue.severity]}`}>
                      {issue.severity}
                    </span>
                    <span className={styles.issueMessage}>{issue.message}</span>
                    <span className={styles.issueCount}>{formatNumber(issue.count)} affected</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Vendor Coverage */}
          <section className={styles.vendorSection}>
            <h2>Vendor Part Coverage</h2>
            <div className={styles.vendorGrid}>
              {metrics.vendors?.map((vendor) => (
                <div key={vendor.name} className={styles.vendorCard}>
                  <span className={styles.vendorName}>{vendor.name}</span>
                  <div className={styles.vendorStats}>
                    <span>{formatNumber(vendor.partCount)} parts</span>
                    <span>{formatNumber(vendor.fitmentCount)} fitments</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {loading && !metrics && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading data quality metrics...</p>
        </div>
      )}
    </div>
  );
}
