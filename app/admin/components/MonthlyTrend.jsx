'use client';

/**
 * MonthlyTrend Component
 * 
 * Shows monthly financial trends in a table format.
 * Revenue, costs, and net income by month.
 * Supports compact mode for sidebar display.
 */

import styles from './MonthlyTrend.module.css';

function formatCurrency(amount, compact = false) {
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return amount < 0 ? `($${formatted})` : `$${formatted}`;
}

function formatMonth(year, month, compact = false) {
  if (compact) {
    return new Date(year, month - 1).toLocaleString('en-US', { month: 'short' });
  }
  return new Date(year, month - 1).toLocaleString('en-US', { month: 'short', year: '2-digit' });
}

export function MonthlyTrend({ data = [], title = 'Monthly Financials', compact = false }) {
  if (!data || data.length === 0) {
    return (
      <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.emptyState}>No monthly data available</div>
      </div>
    );
  }
  
  // Sort by date descending - show fewer in compact mode
  const sortedData = [...data].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  }).slice(0, compact ? 3 : 6);
  
  // Compact mode: simplified view
  if (compact) {
    return (
      <div className={`${styles.container} ${styles.compact}`}>
        <h3 className={styles.title}>{title}</h3>
        
        <div className={styles.compactList}>
          {sortedData.map((row, i) => (
            <div key={`${row.year}-${row.month}`} className={`${styles.compactRow} ${i === 0 ? styles.currentRow : ''}`}>
              <span className={styles.compactPeriod}>{formatMonth(row.year, row.month, true)}</span>
              <div className={styles.compactValues}>
                <span className={styles.compactCosts}>{formatCurrency(row.costs + row.productDev)}</span>
                <span className={`${styles.compactNet} ${row.netIncome < 0 ? styles.negative : styles.positive}`}>
                  {formatCurrency(row.netIncome)}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <div className={styles.compactFooter}>
          <span className={styles.compactLabel}>Total Net</span>
          <span className={`${styles.compactTotal} ${sortedData.reduce((sum, r) => sum + r.netIncome, 0) < 0 ? styles.negative : styles.positive}`}>
            {formatCurrency(sortedData.reduce((sum, r) => sum + r.netIncome, 0))}
          </span>
        </div>
      </div>
    );
  }
  
  // Full mode: detailed table
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{title}</h3>
      
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Period</th>
              <th className={styles.right}>Revenue</th>
              <th className={styles.right}>Costs</th>
              <th className={styles.right}>R&D</th>
              <th className={styles.right}>Net</th>
              <th className={styles.right}>Users</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, i) => (
              <tr key={`${row.year}-${row.month}`} className={i === 0 ? styles.currentRow : ''}>
                <td className={styles.period}>{formatMonth(row.year, row.month)}</td>
                <td className={styles.right}>{formatCurrency(row.revenue)}</td>
                <td className={styles.right}>{formatCurrency(row.costs)}</td>
                <td className={styles.right}>{formatCurrency(row.productDev)}</td>
                <td className={`${styles.right} ${row.netIncome < 0 ? styles.negative : styles.positive}`}>
                  {formatCurrency(row.netIncome)}
                </td>
                <td className={styles.right}>{row.totalUsers || row.users || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Summary stats */}
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Revenue</span>
          <span className={styles.summaryValue}>
            {formatCurrency(sortedData.reduce((sum, r) => sum + r.revenue, 0))}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Costs</span>
          <span className={styles.summaryValue}>
            {formatCurrency(sortedData.reduce((sum, r) => sum + r.costs + r.productDev, 0))}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Net</span>
          <span className={`${styles.summaryValue} ${sortedData.reduce((sum, r) => sum + r.netIncome, 0) < 0 ? styles.negative : styles.positive}`}>
            {formatCurrency(sortedData.reduce((sum, r) => sum + r.netIncome, 0))}
          </span>
        </div>
      </div>
    </div>
  );
}

export default MonthlyTrend;

