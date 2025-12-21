'use client';

/**
 * P&L Statement Component
 * 
 * Full Income Statement with proper GL structure.
 * Shows Revenue, COGS, Gross Profit, Operating Expenses, and Net Income.
 */

import styles from './PLStatement.module.css';

function formatCurrency(amount) {
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return amount < 0 ? `($${formatted})` : `$${formatted}`;
}

function PLRow({ label, amount, isTotal, isSubtotal, isNegative, indent = 0, percentage }) {
  const rowClass = isTotal ? styles.totalRow : isSubtotal ? styles.subtotalRow : styles.row;
  const amountClass = isNegative || amount < 0 ? styles.negative : styles.positive;
  
  return (
    <div className={rowClass} style={{ paddingLeft: `${indent * 16}px` }}>
      <span className={styles.label}>{label}</span>
      <div className={styles.values}>
        <span className={`${styles.amount} ${amountClass}`}>{formatCurrency(amount)}</span>
        {percentage !== undefined && (
          <span className={styles.percentage}>{percentage}%</span>
        )}
      </div>
    </div>
  );
}

function PLSection({ title, children }) {
  return (
    <div className={styles.section}>
      <h4 className={styles.sectionTitle}>{title}</h4>
      {children}
    </div>
  );
}

export function PLStatement({ pnl, revenue, costs, period, title = 'Income Statement' }) {
  if (!pnl) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.emptyState}>No financial data available</div>
      </div>
    );
  }
  
  const periodLabel = period?.month 
    ? `${new Date(2024, period.month - 1).toLocaleString('en-US', { month: 'long' })} ${period.year}`
    : period?.range === 'all' ? 'All Time' : 'Current Period';
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <span className={styles.period}>{periodLabel}</span>
      </div>
      
      {/* REVENUE */}
      <PLSection title="Revenue">
        <PLRow label="Subscription Revenue" amount={pnl.revenue.subscriptions / 100} indent={1} />
        <PLRow label="AL Token Sales" amount={pnl.revenue.alTokens / 100} indent={1} />
        <PLRow label="Advertising Revenue" amount={pnl.revenue.advertising / 100} indent={1} />
        <PLRow label="Other Revenue" amount={pnl.revenue.other / 100} indent={1} />
        <PLRow label="Total Revenue" amount={pnl.revenue.total / 100} isSubtotal />
      </PLSection>
      
      {/* COST OF GOODS SOLD */}
      <PLSection title="Cost of Goods Sold">
        <PLRow label="AI API Services (Variable)" amount={pnl.cogs.aiServices / 100} indent={1} />
        <PLRow label="Total COGS" amount={pnl.cogs.total / 100} isSubtotal />
      </PLSection>
      
      {/* GROSS PROFIT */}
      <PLRow 
        label="Gross Profit" 
        amount={pnl.grossProfit / 100} 
        isTotal 
        percentage={pnl.grossMargin}
      />
      
      {/* OPERATING EXPENSES */}
      <PLSection title="Operating Expenses">
        <PLRow label="Infrastructure" amount={pnl.operatingExpenses.infrastructure / 100} indent={1} />
        <PLRow label="Development Tools" amount={pnl.operatingExpenses.development / 100} indent={1} />
        <PLRow label="Marketing" amount={pnl.operatingExpenses.marketing / 100} indent={1} />
        <PLRow label="Other Operating" amount={pnl.operatingExpenses.other / 100} indent={1} />
        <PLRow label="Total Operating Expenses" amount={pnl.operatingExpenses.total / 100} isSubtotal />
      </PLSection>
      
      {/* OPERATING INCOME */}
      <PLRow 
        label="Operating Income" 
        amount={pnl.operatingIncome / 100} 
        isTotal 
        percentage={pnl.operatingMargin}
      />
      
      {/* PRODUCT DEVELOPMENT (Separate call-out) */}
      {pnl.productDevelopment > 0 && (
        <PLSection title="Product Development (R&D)">
          <PLRow label="Product Development Costs" amount={pnl.productDevelopment / 100} indent={1} />
        </PLSection>
      )}
      
      {/* INCOME BEFORE TAX */}
      <PLRow 
        label="Income Before Tax" 
        amount={pnl.incomeBeforeTax / 100} 
        isTotal 
      />
      
      {/* TAXES */}
      <PLSection title="Taxes">
        <PLRow 
          label={`Estimated Income Tax (${(pnl.taxRate * 100).toFixed(0)}%)`} 
          amount={pnl.estimatedTax / 100} 
          indent={1} 
        />
      </PLSection>
      
      {/* NET INCOME */}
      <div className={styles.netIncome}>
        <PLRow 
          label="Net Income" 
          amount={pnl.netIncome / 100} 
          isTotal 
          percentage={pnl.netMargin}
        />
      </div>
      
      {/* Summary Note */}
      <div className={styles.note}>
        <p>
          {pnl.netIncome < 0 
            ? `Net loss of ${formatCurrency(Math.abs(pnl.netIncome / 100))} for the period. Pre-revenue phase with development investments.`
            : pnl.netIncome === 0
            ? 'Break-even for the period.'
            : `Net profit of ${formatCurrency(pnl.netIncome / 100)} for the period.`
          }
        </p>
      </div>
      
      {/* Period breakdown if product dev costs exist */}
      {pnl.productDevelopment > 0 && (
        <div className={styles.breakdown}>
          <div className={styles.breakdownRow}>
            <span>Monthly Operating Costs</span>
            <span>{formatCurrency(pnl.operatingExpenses.total / 100)}</span>
          </div>
          <div className={styles.breakdownRow}>
            <span>One-Time R&D Investment</span>
            <span>{formatCurrency(pnl.productDevelopment / 100)}</span>
          </div>
          <div className={`${styles.breakdownRow} ${styles.breakdownTotal}`}>
            <span>Total Cash Outflow</span>
            <span>{formatCurrency((pnl.operatingExpenses.total + pnl.productDevelopment) / 100)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PLStatement;

